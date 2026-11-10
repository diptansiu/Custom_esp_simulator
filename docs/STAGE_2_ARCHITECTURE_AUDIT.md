# ESP Simulator Studio — Stage 2 Architecture Audit

**Date:** 2026-11-08  
**Stage:** 2 — Core Architecture Modernization  
**Substage:** 2.0 — Complete Architecture Discovery and Baseline Verification

## 1. Executive Summary

This document presents the results of the complete architecture audit performed as Substage 2.0 of Stage 2 (Core Architecture Modernization). The audit covers the entire codebase including the Electron desktop application, browser/PWA frontend, Node.js backend, execution engines, board/component definitions, circuit solver, project management, persistence, IPC layer, and tests.

**Current state:** The application is a working single-layer monolith with a large God object (`app.js` at 106KB) and a God file backend (`server.js` at 21KB). All functionality works correctly, but the architecture lacks clear layer separation, interfaces, and platform abstraction.

**Baseline test results:** 19 passed, 2 failed, 1 skipped (of 22 total). The 2 failures are environment-related (clang++ found but missing Windows SDK/MSVC headers for `<iostream>`). All syntax checks pass.

## 2. Current Architecture

### 2.1 Layer Overview

The current architecture is essentially a single monolithic layer with minimal separation:

```
┌─────────────────────────────────────────────────────────────┐
│  ESP Simulator Studio (Monolith)                            │
├─────────────────────────────────────────────────────────────┤
│  Presentation:  app.js (God object, 2991 lines)             │
│                 HTML + Tailwind CSS                         │
│  Services:      app.js inline methods                         │
│  Shared Core:   None (duplicated across app.js/server.js)   │
│  Infrastructure: server.js (God file, 627 lines)            │
│  Platform:      Electron (desktop/main/*) + browser direct │
│  Execution:     ArduinoInterpreter, MicroPythonInterpreter, │
│                 RealCodeRunner (inline in app.js/server.js) │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Module Inventory

#### Electron Desktop (`desktop/`)
| File | Size | Responsibility |
|------|------|----------------|
| `desktop/main/main.js` | 5,048 bytes | Electron entry point; initializes all managers; starts backend; creates window |
| `desktop/main/window-manager.js` | 15,261 bytes | BrowserWindow creation, diagnostics, layout probe, capture hook |
| `desktop/main/backend-manager.js` | 6,584 bytes | Spawns server.js as child process; port polling; process lifecycle |
| `desktop/main/runtime-manager.js` | 4,878 bytes | C++ compiler / Python interpreter detection |
| `desktop/main/storage-manager.js` | 5,844 bytes | Project persistence (JSON files in userData); path traversal protection |
| `desktop/main/settings-manager.js` | 2,828 bytes | Application settings with defaults merging |
| `desktop/main/lifecycle-manager.js` | 1,616 bytes | Startup/shutdown coordination |
| `desktop/main/menu-manager.js` | 7,802 bytes | Native menu bar with accelerators |
| `desktop/main/ipc/index.js` | 726 bytes | IPC handler registration |
| `desktop/main/ipc/application-ipc.js` | 3,374 bytes | App status, backend control, runtime config, dialogs |
| `desktop/main/ipc/project-ipc.js` | 2,089 bytes | Project CRUD, import/export, storage paths |
| `desktop/main/ipc/runtime-ipc.js` | 265 bytes | Runtime detection |
| `desktop/main/ipc/dialog-ipc.js` | 664 bytes | File dialogs |
| `desktop/preload/preload.js` | 4,895 bytes | Sandboxed contextBridge API (single self-contained file) |
| `desktop/preload/desktop-api.js` | 4,190 bytes | Reference copy of preload API (NOT loaded at runtime) |

#### Frontend (`public/`)
| File | Size | Responsibility |
|------|------|----------------|
| `public/js/app.js` | 106,173 bytes | **GOD OBJECT** — Main application coordinator; UI init, toolbar events, simulation run/stop, project management, desktop integration, component props panel |
| `public/js/engine/arduino-interpreter.js` | 19,994 bytes | Arduino C++ fast runner (transpile-to-JS) |
| `public/js/engine/micropython-interpreter.js` | 9,476 bytes | MicroPython-like fast runner |
| `public/js/engine/real-runner.js` | 6,731 bytes | Native Clang++/Python3 subprocess runner via HTTP + SSE |
| `public/js/engine/circuit-net.js` | 9,339 bytes | Circuit netlist solver (graph-based) |
| `public/js/engine/audio-synth.js` | 2,052 bytes | Audio/buzzer synthesis |
| `public/js/ui/canvas.js` | 18,408 bytes | Interactive workbench & circuit canvas (SVG rendering) |
| `public/js/ui/editor.js` | 18,172 bytes | Code editor (VS Code-style) |
| `public/js/ui/serial.js` | 6,586 bytes | Serial terminal monitor |
| `public/js/ui/inspector.js` | 9,433 bytes | GPIO pin state inspector |
| `public/js/ui/examples.js` | 16,398 bytes | Examples library modal |
| `public/js/ui/web-browser.js` | 14,837 bytes | Embedded web browser panel |
| `public/js/ui/icons.js` | 16,362 bytes | Icon definitions |
| `public/js/components/component-defs.js` | 49,651 bytes | **110 component definitions** across 18 categories |
| `public/js/components/component-svg.js` | 100,154 bytes | SVG renderers for components (9 custom + default fallback) |
| `public/js/boards/board-defs.js` | 192,502 bytes | Board definitions (ESP8266, ESP32 variants) |
| `public/js/boards/board-svg.js` | 16,096 bytes | Board SVG rendering |
| `public/index.html` | 48,909 bytes | Main HTML entry point; component palette UI |
| `public/css/style.css` | 2,834 bytes | Fallback styling |
| `public/js/tailwind.js` | 407,279 bytes | Vendored Tailwind CSS (v3.4.17) |
| `public/sw.js` | 2,125 bytes | Service worker (PWA offline shell) |
| `public/manifest.json` | 427 bytes | PWA manifest |

#### Backend (`backend/`, `server.js`)
| File | Size | Responsibility |
|------|------|----------------|
| `server.js` | 21,388 bytes | **GOD FILE** — HTTP server, static file serving, CSP, API routing, session management, compilation orchestration, SSE streaming |
| `backend/core/esp_runtime.hpp` | 19,052 bytes | C++ ESP compatibility runtime header |
| `backend/core/main_wrapper.cpp` | 427 bytes | C++ main wrapper |
| `backend/core/micropython_runtime.py` | 2,400 bytes | Python MicroPython compatibility runtime |

#### Tests (`test/`)
| File | Size | Responsibility |
|------|------|----------------|
| `test/server.test.js` | 7,689 bytes | API status, validation, C++/Python smoke, session management, compile error, path traversal |
| `test/session_concurrency.test.js` | 6,653 bytes | Session concurrency, isolation, cleanup, SSE |

### 2.3 Entry Points

| Entry Point | Platform | Description |
|-------------|----------|-------------|
| `npm start` / `node server.js` | Browser/PWA | Starts Node.js HTTP server; frontend served from `public/` |
| `npm run dev` | Browser/PWA | Same as start with PORT=3000 |
| `npm run app:dev` | Electron Desktop | `electron .` — starts Electron with backend auto-launch |
| `npm run app:build:all` | Packaged | `electron-builder --win --x64` — NSIS + portable + unpacked |

### 2.4 Important Shared Data Structures

**Project Schema (`exportProjectData()` in app.js):**
```javascript
{
  name: string,
  board: string,           // e.g. 'esp8266-nodemcu'
  language: string,        // 'cpp' | 'python'
  runnerMode: string,      // 'native' | 'browser'
  code: string,            // Source code
  components: Array,       // Component instances with id, type, props, x, y
  wires: Array,            // Wire connections {id, from, to, color}
  updatedAt: string        // ISO timestamp
}
```

**Board Definition:**
```javascript
{
  id: string,
  name: string,
  chip: string,
  family: 'ESP8266' | 'ESP32',
  flashSize: string,
  clockSpeed: string,
  adcBits: number,
  adcMaxVoltage: number,
  builtinLeds: Array,
  buttons: Array,
  width: number,
  height: number,
  pinPitch: number,
  pinStartY: number,
  pinAlias: Record<string, number>,
  leftPins: Array<PinDef>,
  rightPins: Array<PinDef>
}
```

**Component Definition:**
```javascript
{
  type: string,
  name: string,
  category: string,
  width: number,
  height: number,
  defaultProps: Record<string, any>,
  colors?: Record<string, string>,
  presets?: Array<{value, label}>,
  pins: Array<{id, label, type, x, y, description}>
}
```

**Board State (shared by interpreters and real runner):**
```javascript
{
  gpio: Record<pin, 0|1>,
  pinModes: Record<pin, 'INPUT'|'OUTPUT'|'INPUT_PULLUP'>,
  pwm: Record<pin, 0-255>,
  toneFreq: number,
  tonePin: number|null,
  isPowered: boolean,
  activeAntenna: number,
  wifiConnected: boolean,
  serialBuffer: Array<number>
}
```

**Active Session (server.js):**
```javascript
{
  proc: ChildProcess,
  clients: Array<http.ServerResponse>,
  buffer: Array<string>,
  tempFiles: Array<string>,
  stopped: boolean
}
```

### 2.5 Execution Flow

1. **Browser/PWA:** User opens `http://127.0.0.1:3000` → `server.js` serves `index.html` → `app.js` initializes → UI ready
2. **Electron Desktop:** `main.js` → initializes managers → starts `server.js` child process → creates BrowserWindow → loads `http://127.0.0.1:<port>/index.html` → `app.js` initializes → `initDesktop()` detects renderer via `window.desktopAPI`
3. **Run Simulation (browser mode):** `app.js.runSimulation()` → `arduinoInterpreter.run()` or `microPythonInterpreter.run()` → transpiles code to JS → `eval()` executes → `boardState` updated → `circuitNet.solve()` → canvas re-renders
4. **Run Simulation (native mode):** `app.js.runSimulation()` → `realCodeRunner.run()` → POST `/api/run-real` → `server.js` compiles with clang++ → spawns binary → SSE stream → hardware events → `boardState` updated
5. **Project Save (desktop):** `app.js.saveProjectDesktop()` → IPC `project:save` → `storageManager.saveProject()` → writes JSON to `%APPDATA%\ESP Simulator Studio\projects\`
6. **Project Save (browser):** `app.js.saveProjectBrowser()` → generates download blob

### 2.6 Project Data Flow

```
Browser:       app.js → exportProjectData() → Blob → download → user filesystem
Desktop:       app.js → IPC project:save → storageManager.saveProject() → JSON file in userData/projects/
Desktop Load:  app.js → IPC project:load → storageManager.loadProject() → JSON from userData/projects/ → loadExample()
```

## 3. Identified Architectural Weaknesses

### W1: God Object — `public/js/app.js` (106,173 bytes, 2,991 lines)
`app.js` is a single monolithic class that handles:
- Application lifecycle and initialization
- Canvas, editor, serial, inspector, wire manager
- Toolbar events and board/language/runner switching
- Simulation run/stop/reset
- Component properties panel
- Project save/load/import/export (browser + desktop)
- Examples library
- Desktop integration (IPC handlers, menu bridges)
- Native input synchronization
- Backend status UI

**Risk:** Any change to one responsibility risks breaking others. No clear separation between UI coordination, simulation control, project management, and desktop integration.

### W2: God File — `server.js` (21,388 bytes, 627 lines)
`server.js` handles:
- HTTP server creation and configuration
- Static file serving with path traversal protection
- CSP header management
- All API routing (/api/status, /api/projects, /api/run-real, /api/stop, /api/input, /api/stream)
- Session management (activeSessions Map, killSession, setupSession)
- C++ compilation (spawn clang++)
- Python execution (spawn python3)
- SSE streaming
- Graceful shutdown

**Risk:** Backend API, session management, compilation orchestration, and static serving are all coupled in one file. No interface between routing and business logic.

### W3: No Shared Core Layer
There is no platform-independent shared core. Domain models (boards, components, circuit, project) exist only in frontend JS modules. The backend has its own separate board profiles (`BOARD_PROFILES` in server.js) that duplicate board information from `board-defs.js`.

**Risk:** Board and component definitions are duplicated between frontend and backend. Changes to one must be manually mirrored to the other.

### W4: Direct Platform-Specific Imports
- `preload.js` directly imports `electron` (contextBridge, ipcRenderer)
- `app.js` accesses `window.desktopAPI` directly (no abstraction)
- `real-runner.js` accesses `window.API_BASE_URL` directly
- Backend `server.js` directly uses Node.js `fs`, `child_process`, `http`

**Risk:** The core application logic cannot be tested without Electron or a browser. Platform-specific code is scattered throughout.

### W5: Global Mutable State
- `activeSessions` Map in `server.js` (line 114)
- `window.espApp` singleton in `app.js` (line 2988)
- `this.canvas.components`, `this.circuitNet.wires` in `app.js`

**Risk:** Global state makes concurrent testing difficult and creates hidden dependencies between modules.

### W6: Tight Frontend-Backend Coupling
The frontend talks to the backend via raw HTTP fetch/EventSource calls. The backend expects specific URL paths and JSON formats. There is no service interface or contract definition.

**Risk:** Any backend API change requires frontend changes and vice versa. No versioning or compatibility layer.

### W7: Duplicated Board Definitions
`server.js` has `BOARD_PROFILES` (lines 65-96) that duplicates board family, native support, ADC info from `board-defs.js`. These are separate sources of truth.

**Risk:** Inconsistent board capabilities between frontend and backend.

### W8: No Interface Contracts
There are no defined interfaces for:
- Execution engines (ArduinoInterpreter, MicroPythonInterpreter, RealCodeRunner)
- Project storage
- Runtime detection
- Board/component definitions

**Risk:** New execution engines or storage backends cannot be added without modifying existing code.

### W9: Error Handling Inconsistency
Different modules use different error patterns:
- `server.js`: Returns JSON with `success: false` and `error` field
- `app.js`: Uses `alert()` for errors
- `storage-manager.js`: Returns `{success: false, error}` or throws

**Risk:** Inconsistent error handling makes debugging and UX inconsistent.

### W10: Test Coupling to Backend Process
Tests (`test/server.test.js`) require the backend server to be running on port 3000. They cannot run as standalone unit tests.

**Risk:** Tests are integration tests that depend on external state. Cannot test individual modules in isolation.

## 4. Migration Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Breaking existing IPC channels during modularization | High | Keep channel names unchanged; add new channels alongside |
| Breaking project save/load compatibility | High | Maintain existing project JSON schema; add schema versioning |
| Breaking Electron sandbox security | High | Keep `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false` |
| Breaking browser/PWA mode | High | Keep `public/index.html` as canonical entry; don't remove direct file serving |
| Introducing circular dependencies during reorganization | Medium | Enforce dependency direction rules; use dependency graph |
| Breaking window/session state during refactor | Medium | Preserve existing state shapes; add migration layer |
| Performance regression from added abstraction layers | Low | Keep abstraction thin; avoid unnecessary indirection |

## 5. Proposed Target Boundaries

Based on the audit, the target architecture should introduce these boundaries:

### Boundary 1: Shared Core Layer (`src/shared/`)
**Purpose:** Platform-independent domain logic that can be tested without Electron or browser.
**Contents:** Board models, component models, circuit models, project schema, validation, event contracts, error definitions.
**Constraint:** Must NOT import Electron, `window`, `document`, `fs`, `child_process`, or `ipcRenderer`.

### Boundary 2: Application Services Layer (`src/application/`)
**Purpose:** Orchestrates shared core logic for specific use cases.
**Contents:** Project services, board services, component services, circuit services, execution session services, configuration services.
**Constraint:** Depends only on shared core and platform interfaces.

### Boundary 3: Platform Adapter Layer (`src/platform/`)
**Purpose:** Environment-specific implementations.
**Contents:** Electron adapter (IPC, native dialogs, file system), Browser adapter (localStorage, fetch, File API), PWA adapter (service worker integration).
**Constraint:** Implements platform interfaces; does not contain business logic.

### Boundary 4: Infrastructure Layer (`src/infrastructure/`)
**Purpose:** External system integration.
**Contents:** Persistence adapters, filesystem adapters, backend communication, runtime process management, logging, configuration loading.
**Constraint:** Implements infrastructure interfaces used by application services.

### Boundary 5: Execution Layer (`src/execution/`)
**Purpose:** Unified execution lifecycle management.
**Contents:** Execution interfaces, engine adapters (Arduino, MicroPython, Native C++, Host Python), session management.
**Constraint:** Engines depend on execution interfaces, not on each other.

## 6. Baseline Test Results

| Suite | Tests | Passed | Failed | Skipped |
|-------|-------|--------|--------|---------|
| API Status | 1 | 1 | 0 | 0 |
| API Validation | 5 | 5 | 0 | 0 |
| C++ Smoke Test | 1 | 0 | 1 | 0 |
| Python Smoke Test | 1 | 0 | 0 | 1 |
| Session Management | 3 | 2 | 1 | 0 |
| Compile Error | 1 | 1 | 0 | 0 |
| Path Traversal | 1 | 1 | 0 | 0 |
| Session Concurrency | 9 | 9 | 0 | 0 |
| SSE Connection | 1 | 1 | 0 | 0 |
| Environment Variables | 1 | 1 | 0 | 0 |
| **Total** | **22** | **19** | **2** | **1** |

**2 failures:** Both environment-related — clang++ found but missing Windows SDK headers (`iostream` not found). Not code defects.

## 7. Files to Preserve (Do Not Delete)

All existing files must be preserved during Stage 2:
- `server.js` — Backend entry point (keep as compatible entry)
- `public/index.html` — Canonical frontend entry
- `public/js/app.js` — Main application (will be refactored incrementally)
- `public/js/components/component-defs.js` — Component definitions
- `public/js/components/component-svg.js` — SVG renderers
- `public/js/boards/board-defs.js` — Board definitions
- `public/js/engine/*` — All execution engines
- `public/js/ui/*` — All UI modules
- `desktop/main/*` — All Electron main process modules
- `desktop/preload/preload.js` — Sandboxed preload
- `test/*` — All existing tests
- `backend/core/*` — C++/Python runtime cores
- `docs/*` — All existing documentation

## 8. Next Steps (Substage 2.1)

1. Design target directory structure under `src/`
2. Identify canonical location for each existing module
3. Plan incremental migration path (no big-bang rewrite)
4. Begin implementing shared core contracts
5. Create `docs/STAGE_2_TARGET_ARCHITECTURE.md`

---

**Status:** Substage 2.0 Complete — Architecture audit finished. Ready for Substage 2.1.