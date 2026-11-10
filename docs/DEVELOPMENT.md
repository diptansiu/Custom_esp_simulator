# Development Guide

## Project Structure

```
esp_simulator/
├── server.js              # Node.js HTTP server (main entry point)
├── package.json           # NPM configuration and scripts
├── public/                # Frontend UI (HTML, CSS, JS)
│   ├── index.html         # Main UI page
│   ├── js/                # JavaScript modules
│   │   ├── app.js         # Main application
│   │   ├── boards/        # Board definitions and SVG
│   │   ├── components/    # Component definitions and SVG
│   │   ├── engine/        # Execution engines (Arduino, MicroPython)
│   │   └── ui/            # UI panels and controls
│   └── css/               # Stylesheets
├── backend/               # Backend runtime code
│   ├── core/              # C++/Python runtime shims
│   │   ├── esp_runtime.hpp    # ESP compatibility header
│   │   ├── main_wrapper.cpp   # C++ main wrapper
│   │   └── micropython_runtime.py  # Python runtime shim
│   └── build/             # Compiled binaries and temp files
├── test/                  # Automated tests
│   ├── server.test.js     # API and integration tests
│   └── session_concurrency.test.js  # Session concurrency tests
├── docs/                  # Documentation
├── projects/              # Saved project files
└── run_as_app.cmd         # Windows launcher
```

## Commands

### Start the Application
```bash
npm start
# or
node server.js
```

### Run Tests
```bash
npm test
# or
node --test
```

### Syntax Check
```bash
npm run check
```

### Clean Temporary Files
```bash
npm run clean
```

## Module Responsibilities

### server.js
- HTTP server lifecycle
- API route handling
- Session management
- Compiler/Python process spawning
- SSE streaming
- Static file serving

### public/js/app.js
- Main UI controller
- Board/component selection
- Editor integration
- Run/stop controls

### public/js/engine/
- `arduino-interpreter.js` — In-browser Arduino transpiler
- `micropython-interpreter.js` — In-browser MicroPython transpiler
- `real-runner.js` — Native execution client
- `circuit-net.js` — Circuit state management
- `audio-synth.js` — Buzzer/audio synthesis

### backend/core/
- `esp_runtime.hpp` — ESP API compatibility header
- `main_wrapper.cpp` — C++ main function wrapper
- `micropython_runtime.py` — Python machine module shim

## Configuration

### Environment Variables
| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | 3000 |
| `HOST` | Bind address | 127.0.0.1 |
| `ESP_SIM_CXX` | C++ compiler | clang++ |
| `ESP_SIM_PYTHON` | Python interpreter | python3 |
| `ALLOWED_ORIGINS` | CORS origins | (none) |

### Example: Custom Compiler
```powershell
$env:ESP_SIM_CXX = "g++"
$env:ESP_SIM_PYTHON = "C:\Python39\python.exe"
node server.js
```

## Testing

### Running Tests
Tests require a running server on port 3000:
```bash
# Terminal 1: Start server
node server.js

# Terminal 2: Run tests
node --test
```

### Test Categories
1. **API Status** — Health check
2. **API Validation** — Request validation
3. **C++ Smoke Test** — Compiler integration (skipped if unavailable)
4. **Python Smoke Test** — Python integration (skipped if unavailable)
5. **Session Management** — Session lifecycle
6. **Compile Error** — Error handling (skipped if unavailable)
7. **Path Traversal** — Security
8. **Session Concurrency** — Independent sessions
9. **SSE Connection** — Stream handling
10. **Environment Variables** — Configuration

### Adding New Tests
Place test files in `test/` directory with `.test.js` suffix:
```javascript
const { test, describe } = require('node:test');
const assert = require('node:assert');

describe('My Feature', () => {
  test('does something', async () => {
    assert.strictEqual(1 + 1, 2);
  });
});
```

## Adding Future Modules

1. Place frontend modules in `public/js/`
2. Place backend modules in `backend/core/`
3. Add API routes in `server.js`
4. Add tests in `test/`
5. Update documentation

## Security Notes

- Server binds to loopback by default
- No authentication in Stage 0/1
- Code execution runs with host permissions
- Do not expose to untrusted networks