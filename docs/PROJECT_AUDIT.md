# Project Audit

## Repository Structure

**Root**: `C:\Users\hp\Desktop\esp_simulator`

### Canonical Source Locations

| Category | Location | Description |
|----------|----------|-------------|
| Server entry | `server.js` | Node.js HTTP server |
| Frontend | `public/` | HTML, CSS, JS UI |
| Backend | `backend/core/` | C++/Python runtime shims |
| Tests | `test/` | Automated test suite |
| Documentation | `docs/` | Project documentation |
| Projects | `projects/` | Saved project files |

### Entry Points

- **Server**: `node server.js` (port 3000, loopback)
- **Frontend**: `public/index.html` served by server
- **Tests**: `node --test` (discovers `test/*.test.js`)

### Backend Design

- **C++ Runtime**: Uses `clang++` with `esp_runtime.hpp` compatibility header
- **Python Runtime**: Uses `python3` with `micropython_runtime.py` shim
- **Process Management**: `spawn()` with stdio pipes, per-session tracking
- **SSE**: Server-Sent Events for real-time output streaming

### Frontend Modules

| Module | Purpose |
|--------|---------|
| `app.js` | Main application controller |
| `boards/board-defs.js` | Board definitions |
| `boards/board-svg.js` | Board SVG rendering |
| `components/component-defs.js` | Component definitions |
| `components/component-svg.js` | Component SVG rendering |
| `engine/arduino-interpreter.js` | In-browser Arduino transpiler |
| `engine/micropython-interpreter.js` | In-browser MicroPython transpiler |
| `engine/real-runner.js` | Native execution client |
| `engine/circuit-net.js` | Circuit state management |
| `engine/audio-synth.js` | Buzzer/audio synthesis |
| `ui/canvas.js` | Visual circuit canvas |
| `ui/editor.js` | Code editor |
| `ui/serial.js` | Serial monitor |
| `ui/inspector.js` | GPIO inspector |
| `ui/examples.js` | Example library |
| `ui/icons.js` | Icon management |
| `ui/web-browser.js` | Web browser panel |

### Execution Modes

1. **Native C++ (Clang++)** — Compiles C++ with host compiler, runs binary
2. **Python 3 Compatibility** — Runs Python with machine module shim
3. **In-Browser Fast Runner** — Transpiles Arduino/MicroPython to JavaScript

### Duplicate Files Found

| Duplicate | Canonical | Status |
|-----------|-----------|--------|
| `public copy/` | `public/` | Not consolidated (preserved) |
| `backend copy/` | `backend/` | Not consolidated (preserved) |
| `server copy.js` | `server.js` | Not consolidated (preserved) |
| `README copy.md` | `README.md` | Not consolidated (preserved) |
| `package copy.json` | `package.json` | Not consolidated (preserved) |

### Verified Defects and Repairs

| Defect | Status | Repair |
|--------|--------|--------|
| Session-killing bug in /api/run-real | ✅ Fixed | Removed global session termination loop |
| server.js file corruption | ✅ Fixed | File restored with full source |
| No environment variable support | ✅ Fixed | Added ESP_SIM_CXX and ESP_SIM_PYTHON |
| Non-idempotent session cleanup | ✅ Fixed | Added session.stopped flag |
| Double response on compiler error | ✅ Fixed | Added responseSent guard |
| Missing Python error handling | ✅ Fixed | Added error event handler |

### Board Profiles

- **3 native-supported boards**: esp8266-nodemcu, esp32-wroom-da, esp32-devkit-v1
- **22+ visual-only boards**: No native runtime support

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /api/status | GET | Health and capability info |
| /api/projects | GET | List saved projects |
| /api/run-real | POST | Start execution |
| /api/stop/:id | POST | Stop session |
| /api/input/:id | POST | Send input event |
| /api/stream/:id | GET | SSE output stream |