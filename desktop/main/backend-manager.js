// Backend Manager
// Manages the Node.js HTTP server backend as a child process

const { spawn } = require('child_process');
const path = require('path');
const http = require('http');

class BackendManager {
  constructor(runtimeManager, userDataPath = null) {
    this.runtimeManager = runtimeManager;
    this.userDataPath = userDataPath;
    this.backendProcess = null;
    this.backendUrl = null;
    this.isRunning = false;
    this.isStarting = false;
    this.startPromise = null;
    this.port = null;
    this.startTimeout = null;
    this.readyResolve = null;
    this.readyReject = null;
  }

  // Start the backend server
  async start() {
    if (this.isRunning || this.isStarting) {
      return this.backendUrl;
    }

    this.isStarting = true;

    // Find an available port
    this.port = await this.findAvailablePort(3000);

    // Build environment for the backend process
    const env = { ...process.env };
    env.PORT = String(this.port);
    env.HOST = '127.0.0.1';
    // ELECTRON_RUN_AS_NODE makes the Electron binary run as plain Node.js
    env.ELECTRON_RUN_AS_NODE = '1';

    // Keep projects and build artifacts in persistent user data, never in
    // the installation directory (which may be read-only inside Program Files).
    if (this.userDataPath) {
      env.ESP_SIM_DATA_DIR = this.userDataPath;
    }

    // Pass through runtime configuration
    if (this.runtimeManager) {
      if (this.runtimeManager.getCppCompiler()) {
        env.ESP_SIM_CXX = this.runtimeManager.getCppCompiler();
      }
      if (this.runtimeManager.getPythonInterpreter()) {
        env.ESP_SIM_PYTHON = this.runtimeManager.getPythonInterpreter();
      }
    }

    // Start the server.js process using the Electron binary as Node.js
    const serverPath = path.join(__dirname, '..', '..', 'server.js');

    this.backendProcess = spawn(process.execPath, [serverPath], {
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false,
      windowsHide: true
    });

    // Set up process event handlers
    this.backendProcess.stdout.on('data', (data) => {
      const text = data.toString().trim();
      if (text) {
        console.log(`[Backend] ${text}`);
      }
    });

    this.backendProcess.stderr.on('data', (data) => {
      const text = data.toString().trim();
      if (text) {
        console.error(`[Backend] ${text}`);
      }
    });

    this.backendProcess.on('error', (err) => {
      console.error('[Backend] Process error:', err.message);
      this.isRunning = false;
      this.isStarting = false;
      if (this.readyReject) {
        this.readyReject(new Error(`Backend process failed to start: ${err.message}`));
        this.readyReject = null;
        this.readyResolve = null;
      }
    });

    this.backendProcess.on('close', (code, signal) => {
      console.log(`[Backend] Process exited: code=${code}, signal=${signal}`);
      this.isRunning = false;
      this.isStarting = false;
      this.backendProcess = null;
      this.backendUrl = null;
      this.port = null;
      if (this.readyReject && !this.isRunning) {
        this.readyReject(new Error(`Backend process exited unexpectedly (code=${code}, signal=${signal})`));
        this.readyReject = null;
        this.readyResolve = null;
      }
    });

    // Wait for backend to be ready
    this.backendUrl = `http://127.0.0.1:${this.port}`;
    this.startTimeout = setTimeout(() => {
      this.isStarting = false;
      if (this.readyReject) {
        this.readyReject(new Error('Backend startup timeout'));
        this.readyReject = null;
        this.readyResolve = null;
      }
    }, 15000);

    return new Promise((resolve, reject) => {
      this.readyResolve = resolve;
      this.readyReject = reject;
      this.pollBackendReady();
    });
  }

  // Poll the backend health endpoint until it responds
  pollBackendReady() {
    const check = () => {
      if (!this.isStarting && !this.isRunning) return;

      http.get(`${this.backendUrl}/api/status`, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.status === 'ok') {
              this.isStarting = false;
              this.isRunning = true;
              clearTimeout(this.startTimeout);
              if (this.readyResolve) {
                this.readyResolve(this.backendUrl);
                this.readyResolve = null;
                this.readyReject = null;
              }
            } else {
              setTimeout(check, 500);
            }
          } catch (e) {
            setTimeout(check, 500);
          }
        });
      }).on('error', () => {
        // Backend not ready yet, retry
        if (this.isStarting) {
          setTimeout(check, 500);
        }
      });
    };

    check();
  }

  // Find an available TCP port
  findAvailablePort(preferredPort) {
    return new Promise((resolve) => {
      const server = require('net').createServer();
      server.unref();
      server.on('error', (err) => {
        resolve(this.findAvailablePort(preferredPort + 1));
      });
      server.listen(preferredPort, '127.0.0.1', () => {
        const port = server.address().port;
        server.close(() => {
          resolve(port);
        });
      });
    });
  }

  // Stop the backend server
  stopBackend() {
    if (this.backendProcess && !this.backendProcess.killed) {
      try {
        this.backendProcess.kill('SIGTERM');
      } catch (e) {
        // Process may already be dead
      }
      // Force kill after 5 seconds
      setTimeout(() => {
        if (this.backendProcess && !this.backendProcess.killed) {
          try { this.backendProcess.kill('SIGKILL'); } catch (e) {}
        }
      }, 5000);
    }
    this.isRunning = false;
    this.backendProcess = null;
    this.backendUrl = null;
    this.port = null;
  }

  // Stop all active simulation sessions via backend API
  stopAllSessions() {
    if (!this.isRunning || !this.backendUrl) return;

    // We can't easily enumerate sessions without an API endpoint
    // The backend's shutdown handler will clean up sessions
    // Just stop the backend process which triggers cleanup
  }

  getActiveSessionCount() {
    // Would require querying the backend
    return 0;
  }

  isBackendRunning() {
    return this.isRunning && !!this.backendProcess && !this.backendProcess.killed;
  }

  getBackendUrl() {
    return this.backendUrl;
  }

  getPort() {
    return this.port;
  }
}

module.exports = { BackendManager };
