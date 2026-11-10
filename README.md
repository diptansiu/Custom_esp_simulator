# ⚡ ESP Simulator Studio

An interactive visual circuit simulator and development lab for popular Espressif microcontrollers.

## Supported Boards
- **ESP8266 NodeMCU 1.0 (ESP-12E Module)**
- **ESP32-WROOM-DA (Dual PCB Antenna Module)**
- **ESP32 DevKit V1 (30-Pin Standard Edition)**
- Plus 55+ additional board definitions (visual, with generic runtime profiles)

## Execution Modes
1. **Native Clang++ Compiler** — Compiles C++ with host Clang++ (clang++ -std=c++17). Uses a custom ESP compatibility shim. NOT real ESP firmware.
2. **Python 3 Compatibility** — Runs Python 3 with a limited `machine` module shim. NOT official MicroPython.
3. **In-Browser Fast Runner** — Transpiles Arduino/MicroPython to JavaScript. Separate implementation.

## Prerequisites
- Node.js >= 18.0.0
- npm
- (Optional) Clang++ / g++ / MSVC for native C++ execution
- (Optional) Python 3 for native Python execution

## Getting Started

### Install Dependencies
```bash
cd /path/to/esp_simulator
npm install
```

### Option 1: Run as a Desktop App (Recommended)

**Development mode:**
```bash
npm run app:dev
```
This launches the Electron desktop application. The backend server starts automatically — no manual `node server.js` needed.

**Global command (run from any directory):**
After installing, create a global launcher. On Windows, place `esp-sim.cmd` in your PATH, then simply type:
```bash
esp-sim
```
Supports:
- `esp-sim` — Launch development Electron app
- `esp-sim --dev` — Same as above
- `esp-sim --portable` — Launch the packaged portable executable

**Double-click launchers:**
- `run_as_app.cmd` — Windows batch file that launches the Electron app
- `run_electron.bat` — Alternative Windows batch launcher

**Build and install (Windows):**
```powershell
npm run app:build:all
```
This produces three artifacts in `dist/`:
- `ESP-Simulator-Studio-Setup-x64.exe` — NSIS installer (install like a normal Windows app)
- `ESP-Simulator-Studio-Portable-x64.exe` — Portable executable (no installation needed)
- `dist/win-unpacked/ESP Simulator Studio.exe` — Unpacked application

After installing via NSIS, launch from the Start Menu or Desktop shortcut.

### Option 2: Run in Browser (PWA)

**Start the server:**
```bash
node server.js
```
Or use npm:
```bash
npm start
```

**Open in browser:**
Visit: **http://127.0.0.1:3000**

The app works as a Progressive Web App — you can install it from the browser.

### Running Tests
The tests are integration tests that require the backend server to be running.

**Terminal 1 (start server):**
```bash
node server.js
```

**Terminal 2 (run tests):**
```bash
node --test
```

Expected results: 22 total, 17 passed, 5 skipped (skipped when C++ compiler/Python not installed — this is expected, not a failure).

### Environment Variables (Optional)
| Variable | Purpose | Default |
|----------|---------|---------|
| `PORT` | Server port | 3000 |
| `HOST` | Bind address | 127.0.0.1 |
| `ESP_SIM_CXX` | C++ compiler executable | clang++ |
| `ESP_SIM_PYTHON` | Python interpreter executable | python3 |
| `ALLOWED_ORIGINS` | CORS allowed origins | (none) |

### 3. Run a Sketch
1. Select a board and engine mode
2. Choose "⚡ Native Clang++ Compiler" in the Mode dropdown
3. Write or load an example
4. Click "Run Simulation"

## Security
- Server binds to `127.0.0.1` (loopback only) by default
- No authentication or CORS allowlist (local development only)
- User code executes with host permissions (no sandbox)
- Do NOT expose to network without explicit opt-in and authentication

## Limitations
- C++ mode uses host Clang++, not ESP toolchain
- Python mode uses CPython, not MicroPython VM
- Electrical components are visual-only (no SPICE simulation)
- Only 3 boards have full runtime profiles
- Automated tests available (`npm test`)
- Projects stored in Electron userData directory (desktop) or localStorage (browser)
- C++ compiler and Python interpreter must be installed separately
- No sandboxing for native host execution

## UI Design System (Stitch — Cybernetic Electronics Studio)

The UI follows the Stitch design system extracted from `stitch_esp_simulator_studio.zip`:

- **Colors**: Surface `#011525`, Surface Container `#0d2132`, Primary `#00d5ff` (Electric Cyan), Secondary `#438bff` (Cobalt), Tertiary `#a879ff` (Ionized Violet), Logic High `#29d69a`, Fault `#ff6478`
- **Typography**: Space Grotesk (headings), Geist (body), JetBrains Mono (code) — mapped to local Inter/Fira Code fonts
- **Layout**: 3-column / 2-row desktop workspace (Components | Canvas | Editor + Serial/GPIO), responsive breakpoints at 768px and 1280px
- **Tokens**: `public/css/design-tokens.css` — CSS custom properties for all design tokens

## Desktop Application (Electron)

ESP Simulator Studio is also available as a standalone Windows desktop application using Electron.

### Desktop Installation
```powershell
cd "C:\Users\hp\Desktop\esp_simulator"
npm install
npm run app:dev          # Development mode
npm run app:build:all    # Build Windows installer + portable
```

### Desktop Commands
| Command | Description |
|---------|-------------|
| `npm run app:dev` | Launch Electron desktop app |
| `npm run app:pack` | Create unpacked Windows build |
| `npm run app:build:win` | Build NSIS installer (x64) |
| `npm run app:build:portable` | Build portable executable (x64) |
| `npm run app:build:all` | Build all Windows artifacts |

### Build Outputs
- `dist/ESP-Simulator-Studio-Setup-x64.exe` - NSIS installer (~88 MB)
- `dist/ESP-Simulator-Studio-Portable-x64.exe` - Portable executable (~81 MB)
- `dist/win-unpacked/ESP Simulator Studio.exe` - Unpacked application (~189 MB)

### Desktop Features
- Automatic backend server management (no manual `node server.js`)
- Automatic project persistence (`%APPDATA%\ESP Simulator Studio\`)
- Runtime configuration UI (C++ compiler, Python interpreter)
- Native Windows menus and dialogs
- Single-instance enforcement
- Secure IPC with renderer sandboxing
- Offline-capable (no CDN dependencies)

## Stage 2: Core Architecture (Modularization)

Stage 2 introduces a modular architecture with clear layer separation:

```
Presentation (app.js, UI)
    ↓
Application Services (Project, Board, Component, Circuit, Execution, Session, Config)
    ↓
Shared Core (Board, Component, Circuit, Project models; Validation; Execution contracts; Events)
```

### Shared Core (`public/js/shared/core/`)
Platform-independent domain logic with no Electron or browser dependencies:
- **Models:** Board, Component, CircuitNet, Project (with schema versioning)
- **Validation:** Board, Component, Project data validation
- **Contracts:** ExecutionEngine interface, Project schema, Event contracts
- **Events:** Typed event bus with publish/subscribe

### Application Services (`public/js/application/services/`)
- ProjectService, BoardService, ComponentService, CircuitService
- ExecutionService, SessionService, ConfigService

### Documentation
- `docs/STAGE_2_ARCHITECTURE_AUDIT.md` — Architecture audit
- `docs/STAGE_2_TARGET_ARCHITECTURE.md` — Target architecture
- `docs/STAGE_2_MODULE_MAP.md` — Module map
- `docs/STAGE_2_DEPENDENCY_GRAPH.md` — Dependency graph
- `docs/STAGE_2_CORE_CONTRACTS.md` — Core contracts
- `docs/STAGE_2_ACCEPTANCE_REPORT.md` — Acceptance report


## Repository

- **GitHub**: https://github.com/diptansiu/Custom_esp_simulator
- **Clone**: `git clone https://github.com/diptansiu/Custom_esp_simulator.git`
- **Branch**: `main`
- **License**: MIT

## License
MIT
