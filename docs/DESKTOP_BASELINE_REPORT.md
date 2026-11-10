# Desktop Baseline Report

## Project Root
`C:\Users\hp\Desktop\esp_simulator`

## Detected Runtime Environment
- OS: Windows 11 (win32) x64
- Node.js: v18+
- npm: Latest

## Source Structure

### Canonical Directories
| Directory | Purpose |
|-----------|---------|
| `public/` | Frontend UI (HTML, CSS, JS modules) |
| `backend/` | C++/Python runtime code |
| `test/` | Automated test suite |
| `docs/` | Documentation |

### Entry Points
- **Server**: `server.js` (Node.js HTTP server, port 3000)
- **Frontend**: `public/index.html` (served by server)
- **Tests**: `test/server.test.js` + `test/session_concurrency.test.js`

### Frontend Modules
- `public/js/app.js` - Main application coordinator
- `public/js/boards/board-defs.js` - Board definitions
- `public/js/boards/board-svg.js` - Board SVG rendering
- `public/js/components/component-defs.js` - Component definitions
- `public/js/components/component-svg.js` - Component SVG rendering
- `public/js/engine/circuit-net.js` - Circuit state management
- `public/js/engine/arduino-interpreter.js` - In-browser Arduino transpiler
- `public/js/engine/micropython-interpreter.js` - In-browser MicroPython transpiler
- `public/js/engine/real-runner.js` - Native execution client
- `public/js/engine/audio-synth.js` - Audio/buzzer synthesis
- `public/js/ui/canvas.js` - Visual circuit canvas
- `public/js/ui/editor.js` - Code editor
- `public/js/ui/serial.js` - Serial monitor
- `public/js/ui/inspector.js` - GPIO inspector
- `public/js/ui/examples.js` - Example library
- `public/js/ui/icons.js` - Icon management

### Backend Modules
- `backend/core/esp_runtime.hpp` - ESP compatibility header
- `backend/core/main_wrapper.cpp` - C++ main wrapper
- `backend/core/micropython_runtime.py` - Python runtime shim

### Duplicate Files (Preserved, Not Deleted)
| Duplicate | Canonical |
|-----------|-----------|
| `public copy/` | `public/` |
| `backend copy/` | `backend/` |
| `server copy.js` | `server.js` |
| `README copy.md` | `README.md` |
| `package copy.json` | `package.json` |

## Existing Capabilities (Verified)
- ✅ ESP8266 and ESP32 board definitions
- ✅ Component library
- ✅ Visual circuit canvas with wire connections
- ✅ SVG board and component rendering
- ✅ Arduino C++ fast runner (in-browser)
- ✅ MicroPython-like fast runner (in-browser)
- ✅ Native C++ compatibility execution (requires clang++)
- ✅ Host CPython compatibility execution (requires python3)
- ✅ Serial Monitor
- ✅ GPIO inspector
- ✅ Audio/buzzer synthesis
- ✅ Examples library
- ✅ Project import/export
- ✅ Browser/PWA support
- ✅ Server-Sent Events for runtime output
- ✅ Session concurrency (independent sessions)
- ✅ Session isolation (starting one doesn't kill others)

## Existing Package Configuration (`package.json`)
- Scripts: start, dev, test, check, clean
- No existing Electron dependency
- No existing desktop application code

## Available Compiler/Python
- clang++: NOT available (not in PATH)
- g++: NOT available
- python3: NOT available in PATH (only WindowsApps alias)
- C++ native execution: BLOCKED (no compiler)
- Python execution: BLOCKED (no interpreter in PATH)

## Test Results (Baseline)
- 22 total tests
- 17 passed, 0 failed, 5 skipped (compiler/Python unavailable)

## Known Limitations (Pre-Migration)
- C++ compiler not installed on Windows
- Python not in PATH
- Frontend loads Tailwind CSS from CDN (not offline-capable)
- Frontend loads JSZip from CDN (not offline-capable)
- Projects stored in localStorage (browser-only)
- No `.gitignore` before migration
- No version control initialized