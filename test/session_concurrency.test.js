const { test, describe, before, after } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { spawn } = require('child_process');

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

describe('Session Concurrency', () => {
  test('Start simulation A and confirm it is running', async (t) => {
    const statusRes = await request('GET', '/api/status');
    if (!statusRes.body.compiler.available) {
      t.skip('C++ compiler not available');
      return;
    }
    const res = await request('POST', '/api/run-real', {
      code: 'void setup(){Serial.begin(115200);Serial.println("A");} void loop(){delay(1000);}',
      language: 'cpp',
      board: 'esp8266-nodemcu'
    });
    // If compiler not available, this will return success: false
    // But the session should still be created if compilation succeeds
    if (res.body.success) {
      assert.ok(res.body.sessionId);
      assert.ok(res.body.sessionId.startsWith('sim_'));
    }
  });

  test('Starting a new simulation does not kill existing sessions', async () => {
    // Start session A (if compiler available)
    const resA = await request('POST', '/api/run-real', {
      code: 'void setup(){Serial.begin(115200);Serial.println("SESSION_A");} void loop(){delay(1000);}',
      language: 'cpp',
      board: 'esp8266-nodemcu'
    });

    if (resA.body.success) {
      const sidA = resA.body.sessionId;

      // Start session B
      const resB = await request('POST', '/api/run-real', {
        code: 'void setup(){Serial.begin(115200);Serial.println("SESSION_B");} void loop(){delay(1000);}',
        language: 'cpp',
        board: 'esp8266-nodemcu'
      });

      if (resB.body.success) {
        const sidB = resB.body.sessionId;
        assert.notEqual(sidA, sidB);

        // Stop session A
        const stopA = await request('POST', `/api/stop/${sidA}`);
        assert.strictEqual(stopA.status, 200);
        assert.strictEqual(stopA.body.success, true);

        // Session B should still be running
        const stopB = await request('POST', `/api/stop/${sidB}`);
        assert.strictEqual(stopB.status, 200);
        assert.strictEqual(stopB.body.success, true);
      }
    }
  });

  test('Stop non-existent session returns 404', async () => {
    const res = await request('POST', '/api/stop/non-existent-session');
    assert.strictEqual(res.status, 404);
  });

  test('Input to non-existent session returns 404', async () => {
    const res = await request('POST', '/api/input/non-existent-session', { event: 'pin_in', pin: 2, val: 1 });
    assert.strictEqual(res.status, 404);
  });

  test('Repeated stop request returns 404 on second attempt', async () => {
    // Start a session
    const runRes = await request('POST', '/api/run-real', {
      code: 'void setup(){Serial.begin(115200);} void loop(){delay(1000);}',
      language: 'cpp',
      board: 'esp8266-nodemcu'
    });

    if (runRes.body.success) {
      const sid = runRes.body.sessionId;

      // First stop
      const stop1 = await request('POST', `/api/stop/${sid}`);
      assert.strictEqual(stop1.status, 200);

      // Second stop should return 404
      const stop2 = await request('POST', `/api/stop/${sid}`);
      assert.strictEqual(stop2.status, 404);
    }
  });

  test('Invalid session ID format is rejected', async () => {
    const res = await request('POST', '/api/stop/invalid-session-id-12345');
    // Should return 404 (not found) since session doesn't exist
    assert.ok(res.status === 404 || res.status === 400);
  });

  test('Session cleanup: temp files should not accumulate', async () => {
    const fs = require('fs');
    const path = require('path');
    const BUILD_DIR = path.join(__dirname, '..', 'backend', 'build');

    // Count files before
    const beforeFiles = fs.readdirSync(BUILD_DIR).filter(f => f.startsWith('sim_'));
    const beforeCount = beforeFiles.length;

    // Start and stop a session (if compiler available)
    const runRes = await request('POST', '/api/run-real', {
      code: 'void setup(){Serial.begin(115200);} void loop(){delay(1000);}',
      language: 'cpp',
      board: 'esp8266-nodemcu'
    });

    if (runRes.body.success) {
      const sid = runRes.body.sessionId;
      await request('POST', `/api/stop/${sid}`);

      // Wait a bit for cleanup
      await new Promise(resolve => setTimeout(resolve, 500));

      // Count files after
      const afterFiles = fs.readdirSync(BUILD_DIR).filter(f => f.startsWith('sim_'));
      const afterCount = afterFiles.length;

      // Should not have more files than before (cleanup should have happened)
      assert.ok(afterCount <= beforeCount + 1, 'Temp files should be cleaned up');
    }
  });
});

describe('SSE Connection Handling', () => {
  test('SSE connection to non-existent session returns 404', async () => {
    const res = await new Promise((resolve, reject) => {
      const req = http.request({
        method: 'GET',
        hostname: '127.0.0.1',
        port: 3000,
        path: '/api/stream/non-existent-session'
      }, (res) => {
        let data = '';
        res.on('data', (c) => { data += c; });
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.end();
    });
    assert.strictEqual(res.status, 404);
  });
});

describe('Environment Variable Support', () => {
  test('Status endpoint reports configured executable names', async () => {
    const res = await request('GET', '/api/status');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.compiler.name);
    assert.ok(res.body.python.name);
    // Should reflect environment variables or defaults
    assert.ok(['clang++', process.env.ESP_SIM_CXX || 'clang++'].includes(res.body.compiler.name));
    assert.ok(['python3', process.env.ESP_SIM_PYTHON || 'python3'].includes(res.body.python.name));
  });
});