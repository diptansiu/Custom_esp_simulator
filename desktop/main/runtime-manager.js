// Runtime Manager
// Detects and manages C++ compiler and Python interpreter availability

const { execFileSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class RuntimeManager {
  constructor() {
    this.cppCompiler = null;
    this.cppCompilerVersion = null;
    this.pythonInterpreter = null;
    this.pythonVersion = null;
    this.detectionComplete = false;
    this.detectionPromise = null;
  }

  // Detect available runtimes
  detect() {
    if (this.detectionPromise) return this.detectionPromise;

    this.detectionPromise = new Promise((resolve) => {
      this.detectCppCompiler();
      this.detectPythonInterpreter();
      this.detectionComplete = true;
      resolve({
        cpp: {
          available: !!this.cppCompiler,
          path: this.cppCompiler,
          version: this.cppCompilerVersion
        },
        python: {
          available: !!this.pythonInterpreter,
          path: this.pythonInterpreter,
          version: this.pythonVersion
        }
      });
    });

    return this.detectionPromise;
  }

  detectCppCompiler() {
    // Check environment variable first
    const envCompiler = process.env.ESP_SIM_CXX;
    if (envCompiler) {
      try {
        const version = execFileSync(envCompiler, ['--version'], {
          timeout: 5000,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        this.cppCompiler = envCompiler;
        this.cppCompilerVersion = this.extractVersion(version);
        return;
      } catch (e) {
        // Fall through to default detection
      }
    }

    // Try default compilers
    const candidates = ['clang++', 'g++', 'cl.exe'];
    for (const compiler of candidates) {
      try {
        const version = execFileSync(compiler, ['--version'], {
          timeout: 5000,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        this.cppCompiler = compiler;
        this.cppCompilerVersion = this.extractVersion(version);
        return;
      } catch (e) {
        // Try next candidate
      }
    }
  }

  detectPythonInterpreter() {
    // Check environment variable first
    const envPython = process.env.ESP_SIM_PYTHON;
    if (envPython) {
      try {
        const version = execFileSync(envPython, ['--version'], {
          timeout: 5000,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        this.pythonInterpreter = envPython;
        this.pythonVersion = this.extractVersion(version);
        return;
      } catch (e) {
        // Fall through to default detection
      }
    }

    // Try default interpreters
    const candidates = ['python3', 'python'];
    for (const interpreter of candidates) {
      try {
        const version = execFileSync(interpreter, ['--version'], {
          timeout: 5000,
          stdio: 'pipe',
          encoding: 'utf8'
        });
        this.pythonInterpreter = interpreter;
        this.pythonVersion = this.extractVersion(version);
        return;
      } catch (e) {
        // Try next candidate
      }
    }
  }

  extractVersion(output) {
    if (!output) return 'unknown';
    const match = output.match(/(\d+\.\d+\.\d+)/);
    return match ? match[1] : 'unknown';
  }

  getCppCompiler() {
    return this.cppCompiler;
  }

  getCppCompilerVersion() {
    return this.cppCompilerVersion;
  }

  getPythonInterpreter() {
    return this.pythonInterpreter;
  }

  getPythonVersion() {
    return this.pythonVersion;
  }

  isCppAvailable() {
    return !!this.cppCompiler;
  }

  isPythonAvailable() {
    return !!this.pythonInterpreter;
  }

  validateCppCompiler(compilerPath) {
    try {
      const version = execFileSync(compilerPath, ['--version'], {
        timeout: 5000,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      this.cppCompiler = compilerPath;
      this.cppCompilerVersion = this.extractVersion(version);
      return { valid: true, version: this.cppCompilerVersion };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  validatePythonInterpreter(interpreterPath) {
    try {
      const version = execFileSync(interpreterPath, ['--version'], {
        timeout: 5000,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      this.pythonInterpreter = interpreterPath;
      this.pythonVersion = this.extractVersion(version);
      return { valid: true, version: this.pythonVersion };
    } catch (e) {
      return { valid: false, error: e.message };
    }
  }

  getStatus() {
    return {
      cpp: {
        available: this.isCppAvailable(),
        path: this.cppCompiler,
        version: this.cppCompilerVersion
      },
      python: {
        available: this.isPythonAvailable(),
        path: this.pythonInterpreter,
        version: this.pythonVersion
      },
      detectionComplete: this.detectionComplete
    };
  }
}

module.exports = { RuntimeManager };
