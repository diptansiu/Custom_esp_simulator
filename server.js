const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.join(__dirname, 'public');
// Writable user data (projects + build artifacts) lives outside the app
// bundle when the desktop app provides ESP_SIM_DATA_DIR (e.g. %APPDATA%).
const DATA_DIR = process.env.ESP_SIM_DATA_DIR || __dirname;
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');
const BACKEND_DIR = path.join(__dirname, 'backend');
const BUILD_DIR = path.join(DATA_DIR, 'build');
const CORE_DIR = path.join(BACKEND_DIR, 'core');

// Configurable executables via environment variables
const CXX_EXECUTABLE = process.env.ESP_SIM_CXX || 'clang++';
const PYTHON_EXECUTABLE = process.env.ESP_SIM_PYTHON || 'python3';

// Allowed origins for CORS (configurable via env)
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean);

// Body size limit (1 MB)
const MAX_BODY_SIZE = 1024 * 1024;

if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true });
if (!fs.existsSync(BUILD_DIR)) fs.mkdirSync(BUILD_DIR, { recursive: true });

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

// Content Security Policy for the application shell.
//
// 'unsafe-eval' is required by the in-browser fast runner, which compiles the
// user's Arduino sketch to JavaScript via new Function(). Remote script
// sources remain blocked (script-src only allows 'self', inline bootstrap
// code and eval), the renderer is sandboxed, and nodeIntegration is disabled.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "media-src 'self' blob: data:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'"
].join('; ');

// Board capability profiles
const BOARD_PROFILES = {
  'esp8266-nodemcu': { family: 'ESP8266', nativeSupported: true, adcBits: 10, adcMax: 1023, ledBuiltin: 2, defines: '#define ESP8266 1\n' },
  'esp32-wroom-da': { family: 'ESP32', nativeSupported: true, adcBits: 12, adcMax: 4095, ledBuiltin: 2, defines: '#define ESP32 1\n#define ESP32_WROOM_DA 1\n' },
  'esp32-devkit-v1': { family: 'ESP32', nativeSupported: true, adcBits: 12, adcMax: 4095, ledBuiltin: 2, defines: '#define ESP32 1\n' },
};

// All boards that have visual definitions but may not have native runtime support
const VISUAL_BOARDS = [
  'esp32-dev-board', 'esp32-c3-dev-board', 'esp32-c5-dev-board', 'esp32-c6-dev-board',
  'esp32-h2-dev-board', 'esp32-p4-dev-board', 'esp32-s2-dev-board', 'esp32-s3-dev-board',
  'arduino-nano-esp32', 'esp32-dev-module', 'wemos-lolin32', 'wemos-d1-mini-esp32',
];

// Add visual-only board profiles (no native runtime support)
for (const b of VISUAL_BOARDS) {
  if (!BOARD_PROFILES[b]) {
    BOARD_PROFILES[b] = { family: 'ESP32', nativeSupported: false, adcBits: 12, adcMax: 4095, ledBuiltin: 2, defines: '#define ESP32 1\n' };
  }
}

// ESP8266 visual boards
const ESP8266_VISUAL_BOARDS = [
  'generic-esp8266-module', 'generic-esp8285-module', 'nodemcu-0-9-esp-12-module',
  'nodemcu-1-0-esp-12e-module', 'lolin-wemos-d1-r2-mini', 'lolin-wemos-d1-mini-clone',
  'lolin-wemos-d1-mini-pro', 'lolin-wemos-d1-mini-lite', 'espino-esp-12-module',
  'adafruit-feather-huzzah-esp8266', 'sparkfun-esp8266-thing', 'sparkfun-esp8266-thing-dev',
];
for (const b of ESP8266_VISUAL_BOARDS) {
  if (!BOARD_PROFILES[b]) {
    BOARD_PROFILES[b] = { family: 'ESP8266', nativeSupported: false, adcBits: 10, adcMax: 1023, ledBuiltin: 2, defines: '#define ESP8266 1\n' };
  }
}

const SUPPORTED_LANGUAGES = ['cpp', 'python'];

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function getCorsOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return null;
  if (ALLOWED_ORIGINS.length === 0) return null; // same-origin only
  if (ALLOWED_ORIGINS.includes(origin)) return origin;
  return null;
}

// Active Simulation Sessions: sessionId -> { process, clients, buffer, tempFiles }
const activeSessions = new Map();

function killSession(sessionId) {
  const session = activeSessions.get(sessionId);
  if (!session) {
    // Idempotent: session already cleaned up
    return false;
  }

  // Mark as stopped to prevent race conditions
  session.stopped = true;

  if (session.proc && !session.proc.killed) {
    try {
      session.proc.stdin.write(JSON.stringify({ event: 'stop' }) + '\n');
    } catch {}
    try { session.proc.kill('SIGTERM'); } catch {}
    // Force kill after 2s if still alive
    setTimeout(() => {
      if (session.proc && !session.proc.killed) {
        try { session.proc.kill('SIGKILL'); } catch {}
      }
    }, 2000);
  }

  // Close all SSE connections for this session only
  for (const client of session.clients) {
    try {
      client.write(`event: done\ndata: {}\n\n`);
      client.end();
    } catch {}
  }
  session.clients = [];

  // Clean up temp files
  for (const f of (session.tempFiles || [])) {
    try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
  }

  activeSessions.delete(sessionId);
  return true;
}

function parseBody(req, callback) {
  let body = '';
  let size = 0;
  req.on('data', (chunk) => {
    size += chunk.length;
    if (size > MAX_BODY_SIZE) {
      req.destroy();
      callback(new Error('Request body too large'));
      return;
    }
    body += chunk;
  });
  req.on('end', () => {
    try {
      const data = body ? JSON.parse(body) : {};
      callback(null, data);
    } catch (e) {
      callback(new Error('Invalid JSON: ' + e.message));
    }
  });
  req.on('error', (e) => callback(e));
}

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS headers (restricted)
  const origin = getCorsOrigin(req);
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // API: Status
  if (pathname === '/api/status') {
    let clangAvailable = false;
    let pythonAvailable = false;
    try {
      const { execFileSync } = require('child_process');
      execFileSync(CXX_EXECUTABLE, ['--version'], { timeout: 5000, stdio: 'pipe' });
      clangAvailable = true;
    } catch {}
    try {
      const { execFileSync } = require('child_process');
      execFileSync(PYTHON_EXECUTABLE, ['--version'], { timeout: 5000, stdio: 'pipe' });
      pythonAvailable = true;
    } catch {}
    return sendJSON(res, 200, {
      status: 'ok',
      server: 'ESP Simulator Engine',
      host: HOST,
      port: PORT,
      compiler: { name: CXX_EXECUTABLE, available: clangAvailable, mode: 'host-native simulation (not ESP firmware)' },
      python: { name: PYTHON_EXECUTABLE, available: pythonAvailable, mode: 'host Python compatibility (not MicroPython VM)' },
      boardProfiles: Object.keys(BOARD_PROFILES),
      nativeSupportedBoards: Object.entries(BOARD_PROFILES).filter(([_, p]) => p.nativeSupported).map(([id]) => id)
    });
  }

  // API: Projects List
  if (pathname === '/api/projects' && req.method === 'GET') {
    try {
      const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'));
      const projects = files.map(f => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf-8'));
          return {
            filename: f,
            name: content.name || f.replace('.json', ''),
            board: content.board || 'esp8266-nodemcu',
            description: content.description || '',
            updatedAt: content.updatedAt || fs.statSync(path.join(PROJECTS_DIR, f)).mtime
          };
        } catch {
          return { filename: f, name: f.replace('.json', '') };
        }
      });
      return sendJSON(res, 200, { projects });
    } catch (err) {
      return sendJSON(res, 500, { error: err.message });
    }
  }

  // API: Run Real Code (Compile & Execute)
  if (pathname === '/api/run-real' && req.method === 'POST') {
    parseBody(req, (err, body) => {
      if (err) {
        return sendJSON(res, 400, { error: err.message });
      }

      const { code, language = 'cpp', board = 'esp8266-nodemcu' } = body;

      // Validate inputs
      if (!code || typeof code !== 'string') {
        return sendJSON(res, 400, { error: 'Missing or invalid "code" field' });
      }
      if (code.length > MAX_BODY_SIZE) {
        return sendJSON(res, 413, { error: 'Code too large' });
      }
      if (!SUPPORTED_LANGUAGES.includes(language)) {
        return sendJSON(res, 400, { error: `Unsupported language: ${language}. Supported: ${SUPPORTED_LANGUAGES.join(', ')}` });
      }
      if (!BOARD_PROFILES[board]) {
        return sendJSON(res, 400, { error: `Unknown board: ${board}` });
      }

      const profile = BOARD_PROFILES[board];
      if (!profile.nativeSupported) {
        return sendJSON(res, 400, { error: `Board "${board}" is visual-only and does not support native execution. Use the in-browser fast runner instead.` });
      }

      const sessionId = 'sim_' + crypto.randomUUID();

      if (language === 'cpp') {
        const sourceFile = path.join(BUILD_DIR, `${sessionId}.cpp`);
        const binaryFile = path.join(BUILD_DIR, `${sessionId}.bin`);
        const wrapperFile = path.join(CORE_DIR, 'main_wrapper.cpp');

        const boardDefine = profile.defines;

        const combinedCode = `
#line 1 "esp_config.h"
${boardDefine}
#include "esp_runtime.hpp"
#line 1 "user_sketch.ino"
${code}
#include "main_wrapper.cpp"
`;
        fs.writeFileSync(sourceFile, combinedCode, 'utf-8');

        // Compile with clang++ using spawn (no shell interpolation)
        const compileArgs = ['-std=c++17', '-O1', `-I${CORE_DIR}`, sourceFile, '-o', binaryFile];
        const compiler = spawn(CXX_EXECUTABLE, compileArgs, { timeout: 15000 });

        let stdout = '';
        let stderr = '';

        compiler.stdout.on('data', (data) => { stdout += data.toString(); });
        compiler.stderr.on('data', (data) => { stderr += data.toString(); });

        let responseSent = false;
        compiler.on('error', (err) => {
          if (responseSent) return;
          responseSent = true;
          try { fs.unlinkSync(sourceFile); } catch {}
          try {
            sendJSON(res, 200, {
              success: false,
              compilerError: `Compiler not found: ${err.message}. Ensure ${CXX_EXECUTABLE} is installed.`,
              message: 'C++ Compilation Failed'
            });
          } catch {}
        });

        compiler.on('close', (code_exit) => {
          if (responseSent) return;
          responseSent = true;
          if (code_exit !== 0) {
            try { fs.unlinkSync(sourceFile); } catch {}
            return sendJSON(res, 200, {
              success: false,
              compilerError: (stderr || '') + (stdout ? '\n' + stdout : '') || `Compiler exited with code ${code_exit}`,
              message: 'C++ Compilation Failed'
            });
          }

          // Spawn the compiled executable
          const child = spawn(binaryFile, [], {
            stdio: ['pipe', 'pipe', 'pipe']
          });

          setupSession(sessionId, child, [sourceFile, binaryFile]);
          return sendJSON(res, 200, { success: true, sessionId, mode: 'clang++ native C++' });
        });
      } else {
        // Real MicroPython via Python3 Process
        const scriptFile = path.join(BUILD_DIR, `${sessionId}.py`);
        const runtimeCode = fs.readFileSync(path.join(CORE_DIR, 'micropython_runtime.py'), 'utf-8');
        const combinedScript = runtimeCode + '\n# --- User Code ---\n' + code;

        fs.writeFileSync(scriptFile, combinedScript, 'utf-8');

        const child = spawn(PYTHON_EXECUTABLE, [scriptFile], {
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let pyResponseSent = false;
        child.on('error', (err) => {
          if (pyResponseSent) return;
          pyResponseSent = true;
          try { fs.unlinkSync(scriptFile); } catch {}
          try {
            sendJSON(res, 200, {
              success: false,
              compilerError: `Python interpreter not found: ${err.message}. Ensure ${PYTHON_EXECUTABLE} is installed.`,
              message: 'Python Execution Failed'
            });
          } catch {}
        });

        // Use process.nextTick to allow error event to fire first
        process.nextTick(() => {
          if (!pyResponseSent && !child.killed) {
            pyResponseSent = true;
            setupSession(sessionId, child, [scriptFile]);
            try {
              sendJSON(res, 200, { success: true, sessionId, mode: 'python3 real runtime' });
            } catch {}
          }
        });
      }
    });
    return;
  }

  // API: Stop Simulation
  if (pathname.startsWith('/api/stop/') && req.method === 'POST') {
    const sessionId = pathname.replace('/api/stop/', '');
    if (!sessionId || !activeSessions.has(sessionId)) {
      return sendJSON(res, 404, { error: 'Session not found' });
    }
    killSession(sessionId);
    return sendJSON(res, 200, { success: true, sessionId });
  }

  // API: Forward Input to Running Process Stdin
  if (pathname.startsWith('/api/input/') && req.method === 'POST') {
    const sessionId = pathname.replace('/api/input/', '');
    const session = activeSessions.get(sessionId);
    if (!session || !session.proc) {
      return sendJSON(res, 404, { error: 'Session not found or terminated' });
    }

    parseBody(req, (err, body) => {
      if (err) {
        return sendJSON(res, 400, { error: err.message });
      }

      // Validate input event
      const event = body.event;
      const validEvents = ['pin_in', 'adc_in', 'dht_in', 'serial_in', 'http_req', 'stop'];
      if (!event || !validEvents.includes(event)) {
        return sendJSON(res, 400, { error: `Invalid event type: ${event}` });
      }

      // Validate pin_in
      if (event === 'pin_in') {
        if (typeof body.pin !== 'number' || (body.val !== 0 && body.val !== 1)) {
          return sendJSON(res, 400, { error: 'Invalid pin_in: pin must be number, val must be 0 or 1' });
        }
      }

      // Validate adc_in
      if (event === 'adc_in') {
        if (typeof body.pin !== 'number' || typeof body.val !== 'number') {
          return sendJSON(res, 400, { error: 'Invalid adc_in: pin and val must be numbers' });
        }
      }

      if (!session.proc.killed && session.proc.stdin.writable) {
        try {
          session.proc.stdin.write(JSON.stringify(body) + '\n');
          return sendJSON(res, 200, { success: true });
        } catch (e) {
          return sendJSON(res, 500, { error: e.message });
        }
      }
      return sendJSON(res, 400, { error: 'Process not writable' });
    });
    return;
  }

  // API: Server-Sent Events (SSE) Stream
  if (pathname.startsWith('/api/stream/')) {
    const sessionId = pathname.replace('/api/stream/', '');
    const session = activeSessions.get(sessionId);

    if (!session) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Session not found');
      return;
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    res.write(`event: connected\ndata: {"sessionId":"${sessionId}"}\n\n`);

    // Flush any early buffered events
    for (const msg of session.buffer) {
      res.write(`data: ${msg}\n\n`);
    }

    session.clients.push(res);

    req.on('close', () => {
      session.clients = session.clients.filter(c => c !== res);
    });
    return;
  }

  // Static File Serving (with path traversal protection)
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  const normalizedPath = path.normalize(filePath);
  if (!normalizedPath.startsWith(PUBLIC_DIR + path.sep) && normalizedPath !== PUBLIC_DIR) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access denied');
    return;
  }

  fs.stat(normalizedPath, (err, stats) => {
    if (err || !stats.isFile()) {
      const ext = path.extname(normalizedPath);
      if (!ext) {
        const indexPath = path.join(PUBLIC_DIR, 'index.html');
        if (fs.existsSync(indexPath)) {
          res.writeHead(200, {
            'Content-Type': 'text/html',
            'Content-Security-Policy': CONTENT_SECURITY_POLICY,
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'Referrer-Policy': 'no-referrer'
          });
          fs.createReadStream(indexPath).pipe(res);
          return;
        }
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('File not found: ' + pathname);
      return;
    }

    const ext = path.extname(normalizedPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
      // Local assets are cheap to revalidate; this prevents stale CSS/JS
      // after an application upgrade and keeps the shell in sync with CSP.
      'Cache-Control': contentType === 'text/html' ? 'no-store' : 'no-cache'
    };
    if (contentType === 'text/html') {
      headers['Content-Security-Policy'] = CONTENT_SECURITY_POLICY;
      headers['Referrer-Policy'] = 'no-referrer';
    }
    res.writeHead(200, headers);
    fs.createReadStream(normalizedPath).pipe(res);
  });
});

function setupSession(sessionId, child, tempFiles = []) {
  const session = {
    proc: child,
    clients: [],
    buffer: [],
    tempFiles
  };
  activeSessions.set(sessionId, session);

  let leftover = '';
  child.stdout.on('data', (chunk) => {
    const text = leftover + chunk.toString();
    const lines = text.split('\n');
    leftover = lines.pop();

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      if (session.clients.length === 0) {
        session.buffer.push(trimmed);
        // Bound buffer to 1000 lines
        if (session.buffer.length > 1000) {
          session.buffer = session.buffer.slice(-500);
        }
      } else {
        for (const client of session.clients) {
          try {
            client.write(`data: ${trimmed}\n\n`);
          } catch {}
        }
      }
    }
  });

  child.stderr.on('data', (chunk) => {
    const errText = chunk.toString();
    const event = JSON.stringify({ type: 'serial', text: `[Runtime Stderr] ${errText}` });
    for (const client of session.clients) {
      try {
        client.write(`data: ${event}\n\n`);
      } catch {}
    }
    // Buffer stderr too
    if (session.clients.length === 0) {
      session.buffer.push(event);
    }
  });

  child.on('error', (err) => {
    const event = JSON.stringify({ type: 'serial', text: `[Process Error] ${err.message}` });
    for (const client of session.clients) {
      try { client.write(`data: ${event}\n\n`); } catch {}
    }
  });

  child.on('close', (code) => {
    // Only process if session hasn't been manually stopped
    if (!session.stopped) {
      for (const client of session.clients) {
        try {
          client.write(`event: exit\ndata: {"code":${code}}\n\n`);
          client.end();
        } catch {}
      }
      // Clean up binaries
      for (const f of tempFiles) {
        try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch {}
      }
      activeSessions.delete(sessionId);
    }
  });
}

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  for (const [id] of activeSessions) {
    killSession(id);
  }
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force exit after 5s
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

function startServer(port) {
  server.listen(port, HOST, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 ESP Simulator running at http://${HOST}:${port}`);
    console.log(`⚡ Real C++ Compiler: Clang++ (clang++ -std=c++17)`);
    console.log(`🐍 Real Python Runtime: Python 3`);
    console.log(`🔒 Bound to: ${HOST} (loopback only)`);
    console.log(`=================================================\n`);
  }).on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`Port ${port} in use, trying ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('Server error:', err);
    }
  });
}

startServer(PORT);
