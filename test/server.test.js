const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');

const BASE_URL = 'http://127.0.0.1:3000';

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: { 'Content-Type': 'application/json' }
    };
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

describe('API Status', () => {
  test('GET /api/status returns ok', async () => {
    const res = await request('GET', '/api/status');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    // Compiler/Python availability depends on environment
    assert.ok(typeof res.body.compiler.available === 'boolean');
    assert.ok(typeof res.body.python.available === 'boolean');
  });
});

describe('API Validation', () => {
  test('Invalid JSON returns 400', async () => {
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        method: 'POST',
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/run-real',
        headers: { 'Content-Type': 'application/json' }
      }, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.write('{bad json}');
      req.end();
    });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('Invalid JSON'));
  });

  test('Missing code returns 400', async () => {
    const res = await request('POST', '/api/run-real', { language: 'cpp', board: 'esp8266-nodemcu' });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('code'));
  });

  test('Unknown language returns 400', async () => {
    const res = await request('POST', '/api/run-real', { code: 'void setup(){}', language: 'rust', board: 'esp8266-nodemcu' });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('Unsupported language'));
  });

  test('Unknown board returns 400', async () => {
    const res = await request('POST', '/api/run-real', { code: 'void setup(){}', language: 'cpp', board: 'nonexistent' });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('Unknown board'));
  });

  test('Visual-only board rejected for native', async () => {
    const res = await request('POST', '/api/run-real', { code: 'void setup(){}', language: 'cpp', board: 'esp32-c3-dev-board' });
    assert.strictEqual(res.status, 400);
    assert.ok(res.body.error.includes('visual-only'));
  });
});

describe('C++ Smoke Test', () => {
  test('Harmless C++ sketch compiles and runs', async (t) => {
    // Check if compiler is available
    const statusRes = await request('GET', '/api/status');
    if (!statusRes.body.compiler.available) {
      t.skip('C++ compiler not available');
      return;
    }

    const res = await request('POST', '/api/run-real', {
      code: 'void setup(){ Serial.begin(115200); Serial.println("SMOKE_OK"); } void loop(){ delay(1000); }',
      language: 'cpp',
      board: 'esp8266-nodemcu'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.sessionId);
    const sid = res.body.sessionId;

    // Stop the session
    const stopRes = await request('POST', `/api/stop/${sid}`);
    assert.strictEqual(stopRes.status, 200);
    assert.strictEqual(stopRes.body.success, true);
  });
});

describe('Python Smoke Test', () => {
  test('Harmless Python sketch runs', async (t) => {
    // Check if Python is available
    const statusRes = await request('GET', '/api/status');
    if (!statusRes.body.python.available) {
      t.skip('Python interpreter not available');
      return;
    }

    const res = await request('POST', '/api/run-real', {
      code: 'print("PY_OK")\nimport time\nwhile True:\n  time.sleep(1)\n',
      language: 'python',
      board: 'esp8266-nodemcu'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.sessionId);
    const sid = res.body.sessionId;

    const stopRes = await request('POST', `/api/stop/${sid}`);
    assert.strictEqual(stopRes.status, 200);
  });
});

describe('Session Management', () => {
  test('Stop non-existent session returns 404', async () => {
    const res = await request('POST', '/api/stop/nonexistent-session-id');
    assert.strictEqual(res.status, 404);
  });

  test('Input non-existent session returns 404', async () => {
    const res = await request('POST', '/api/input/nonexistent-session-id', { event: 'pin_in', pin: 2, val: 1 });
    assert.strictEqual(res.status, 404);
  });

  test('Invalid input event returns 400', async (t) => {
    // Check if compiler is available
    const statusRes = await request('GET', '/api/status');
    if (!statusRes.body.compiler.available) {
      t.skip('C++ compiler not available');
      return;
    }

    // Start a session first
    const runRes = await request('POST', '/api/run-real', {
      code: 'void setup(){Serial.begin(115200);} void loop(){delay(1000);}',
      language: 'cpp',
      board: 'esp8266-nodemcu'
    });
    const sid = runRes.body.sessionId;

    const inputRes = await request('POST', `/api/input/${sid}`, { event: 'invalid_event', pin: 2, val: 1 });
    assert.strictEqual(inputRes.status, 400);

    const inputRes2 = await request('POST', `/api/input/${sid}`, { event: 'pin_in', pin: 2, val: 5 });
    assert.strictEqual(inputRes2.status, 400);

    await request('POST', `/api/stop/${sid}`);
  });
});

describe('Compile Error', () => {
  test('Syntax error returns compilerError', async (t) => {
    // Check if compiler is available
    const statusRes = await request('GET', '/api/status');
    if (!statusRes.body.compiler.available) {
      t.skip('C++ compiler not available');
      return;
    }

    const res = await request('POST', '/api/run-real', {
      code: 'void setup(){ this is invalid c++ }',
      language: 'cpp',
      board: 'esp8266-nodemcu'
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, false);
    assert.ok(res.body.compilerError);
    assert.ok(res.body.compilerError.length > 0);
  });
});

describe('Path Traversal', () => {
  test('Path traversal does not serve sensitive files', async () => {
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        method: 'GET',
        hostname: '127.0.0.1',
        port: 3000,
        path: '/../../../etc/passwd'
      }, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.end();
    });
    // URL parser collapses .. so path becomes /etc/passwd which doesn't exist
    // Server falls back to index.html (SPA behavior) - this is safe
    // Verify no sensitive file content is leaked
    assert.ok(!res.body.includes('root:') && !res.body.includes('/bin/bash'));
  });
});
