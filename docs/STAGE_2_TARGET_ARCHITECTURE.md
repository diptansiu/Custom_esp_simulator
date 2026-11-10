# ESP Simulator Studio — Stage 2 Target Architecture

**Date:** 2026-11-08  
**Stage:** 2 — Core Architecture Modernization  
**Substage:** 2.1 — Modular Repository Organization  
**Status:** Proposed (implementation in progress)

## 1. Target Architecture Overview

The target architecture introduces clear layer separation with a platform-independent shared core, application services, infrastructure, platform adapters, and execution engine abstractions. Existing files are preserved during incremental migration.

```
ESP Simulator Studio — Target Architecture
┌─────────────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER (unchanged during Stage 2)                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────────┐│
│  │ app.js      │  │ UI modules  │  │ HTML / Tailwind / PWA       ││
│  │ (God object │  │ canvas,     │  │ index.html, sw.js, manifest ││
│  │  being      │  │ editor,     │  │                             ││
│  │  refactored │  │ serial,     │  │                             ││
│  │  incrementally)│ inspector   │  │                             ││
│  └─────────────┘  └─────────────┘  └─────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  APPLICATION SERVICES LAYER (NEW)                                   │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ project-service.js   board-service.js   component-service.js   ││
│  │ circuit-service.js   execution-service.js session-service.js   ││
│  │ config-service.js                                     ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  SHARED CORE LAYER (NEW) — Platform-independent, no Electron/DOM    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐││
│  │ core/        │  │ domain/      │  │ contracts/                 │││
│  │ models/      │  │ hardware/    │  │ execution-engine.js        │││
│  │   board.js   │  │   boards/    │  │ project-schema.js          │││
│  │   component  │  │   components │  │ event-contracts.js         │││
│  │   circuit.js │  │   interfaces │  │ error-definitions.js       │││
│  │   project.js │  │   capabilities│ │                             │││
│  │ validation/  │  │   contract.js │ │                             │││
│  │   board.js   │  └──────────────┘ │                             │││
│  │   component  │                  │                             │││
│  │   project.js │                  │                             │││
│  └──────────────┘                  │                             ││
├─────────────────────────────────────────────────────────────────────┤
│  EXECUTION LAYER (NEW)                                              │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ interfaces/execution-engine.js   sessions/session-manager.js   ││
│  │ engines/arduino-adapter.js       │                             ││
│  │ engines/micropython-adapter.js   │                             ││
│  │ engines/native-cpp-adapter.js    │                             ││
│  │ engines/host-python-adapter.js   │                             ││
│  └─────────────────────────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE LAYER (NEW)                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐││
│  │ persistence/ │  │ filesystem/  │  │ networking/                │││
│  │ project-repo │  │ fs-adapter   │  │ http-client.js             │││
│  │ logging/     │  └──────────────┘  │                             │││
│  │   logger.js  │                  │                             │││
│  │ configuration│                  │                             │││
│  │   config.js  │                  │                             │││
│  └──────────────┘                  │                             ││
├─────────────────────────────────────────────────────────────────────┤
│  PLATFORM ADAPTER LAYER (NEW)                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐││
│  │ electron/    │  │ browser/     │  │ pwa/                       │││
│  │ ipc-adapter  │  │ storage-ad   │  │ sw-adapter                 │││
│  │ dialog-ad    │  │ fetch-ad     │  │                             │││
│  │ storage-ad   │                  │                             │││
│  └──────────────┘  └──────────────┘  └──────────────────────────┘│
├─────────────────────────────────────────────────────────────────────┤
│  EXISTING BACKEND (preserved as compatible entry point)             │
│  server.js — HTTP server, API routes, session management,           │
│  compilation orchestration, SSE streaming                           │
└─────────────────────────────────────────────────────────────────────┘

Dependency Direction:
  PRESENTATION → APPLICATION SERVICES → SHARED CORE
  PRESENTATION → PLATFORM ADAPTERS → SHARED CORE
  APPLICATION SERVICES → INFRASTRUCTURE → SHARED CORE
  EXECUTION → SHARED CORE
  BACKEND → INFRASTRUCTURE (filesystem, logging)
  
  SHARED CORE does NOT depend on any other layer.
```

## 2. Layer Responsibilities

### 2.1 Shared Core Layer (`src/shared/core/`)
**Purpose:** Platform-independent domain logic. Must NOT import Electron, `window`, `document`, `fs`, `child_process`, or `ipcRenderer`.

**Sub-modules:**
- `models/board.js` — Board domain model with pin definitions, aliases, voltage info
- `models/component.js` — Component domain model with pins, props, categories
- `models/circuit.js` — Circuit domain model (wires, connections, net analysis)
- `models/project.js` — Project domain model with schema versioning
- `validation/board.js` — Board validation (valid board ID, valid pins)
- `validation/component.js` — Component validation (valid component ID, valid pin refs)
- `validation/project.js` — Project validation (structure, references)
- `contracts/execution-engine.js` — Execution engine interface contract
- `contracts/project-schema.js` — Project schema definition with versions
- `contracts/event-contracts.js` — Event payload schemas
- `errors/index.js` — Shared error definitions (ValidationError, ConfigError, etc.)
- `constants/index.js` — Shared constants (categories, capabilities, languages)

### 2.2 Application Services Layer (`src/application/services/`)
**Purpose:** Orchestrates shared core logic for specific use cases. Depends only on shared core and platform interfaces.

**Sub-modules:**
- `project-service.js` — Project CRUD, import/export, validation
- `board-service.js` — Board lookup, capability queries, pin resolution
- `component-service.js` — Component lookup, property validation
- `circuit-service.js` — Circuit operations (add wire, remove wire, solve)
- `execution-service.js` — Execution lifecycle (start, stop, input, output)
- `session-service.js` — Simulation session management (isolation, cleanup)
- `config-service.js` — Application settings, runtime configuration

### 2.3 Execution Layer (`src/execution/`)
**Purpose:** Unified execution lifecycle management through explicit contracts.

**Sub-modules:**
- `interfaces/execution-engine.js` — ExecutionEngine interface (start, stop, compile, input, output, state, cleanup)
- `engines/arduino-adapter.js` — ArduinoInterpreter adapter
- `engines/micropython-adapter.js` — MicroPythonInterpreter adapter
- `engines/native-cpp-adapter.js` — RealCodeRunner adapter (backend HTTP)
- `engines/host-python-adapter.js` — Host Python adapter (backend HTTP)
- `sessions/session-manager.js` — Session lifecycle (create, stop, cleanup, isolation)

### 2.4 Infrastructure Layer (`src/infrastructure/`)
**Purpose:** External system integration.

**Sub-modules:**
- `persistence/project-repository.js` — Project save/load/delete with backup
- `filesystem/fs-adapter.js` — Filesystem operations (read, write, mkdir, unlink)
- `logging/logger.js` — Centralized logging with configurable levels
- `configuration/config-loader.js` — Configuration loading from multiple sources
- `networking/http-client.js` — HTTP client wrapper for backend communication

### 2.5 Platform Adapter Layer (`src/platform/`)
**Purpose:** Environment-specific implementations.

**Sub-modules:**
- `electron/ipc-adapter.js` — Electron IPC communication
- `electron/dialog-adapter.js` — Native file dialogs
- `electron/storage-adapter.js` — Electron userData storage
- `browser/storage-adapter.js` — Browser localStorage
- `browser/fetch-adapter.js` — Browser fetch API
- `pwa/sw-adapter.js` — Service worker integration

## 3. Existing Files Preserved

All existing files remain in place during Stage 2:
- `server.js` — Backend entry point (unchanged entry point)
- `public/index.html` — Canonical frontend entry (unchanged)
- `public/js/app.js` — Main application (refactored incrementally to use shared core)
- `public/js/components/component-defs.js` — Component definitions (source of truth)
- `public/js/components/component-svg.js` — SVG renderers (unchanged)
- `public/js/boards/board-defs.js` — Board definitions (source of truth)
- `public/js/engine/*` — All execution engines (wrapped by adapters)
- `public/js/ui/*` — All UI modules (unchanged)
- `desktop/main/*` — All Electron main process modules (unchanged)
- `desktop/preload/preload.js` — Sandboxed preload (unchanged)
- `test/*` — All existing tests (unchanged, may need backend running)
- `backend/core/*` — C++/Python runtime cores (unchanged)
- `docs/*` — All existing documentation (preserved + new Stage 2 docs)

## 4. Migration Strategy

### Phase 1: Create Shared Core (Substage 2.2)
- Create `src/shared/core/models/` — board, component, circuit, project models
- Create `src/shared/core/validation/` — validation functions
- Create `src/shared/core/contracts/` — execution engine interface, project schema
- Create `src/shared/core/errors/` — shared error definitions
- Create `src/shared/core/constants/` — shared constants

### Phase 2: Create Application Services (Substage 2.2 continued)
- Create `src/application/services/` — project, board, component, circuit, execution, session, config services
- Each service depends only on shared core + platform interfaces

### Phase 3: Create Execution Abstraction (Substage 2.5)
- Create `src/execution/interfaces/execution-engine.js` — Engine interface
- Create `src/execution/engines/*` — Adapters for existing engines
- Create `src/execution/sessions/session-manager.js` — Session management

### Phase 4: Create Platform Adapters (Substage 2.8)
- Create `src/platform/electron/*` — Electron IPC, dialogs, storage
- Create `src/platform/browser/*` — Browser localStorage, fetch
- Create `src/platform/pwa/*` — Service worker integration

### Phase 5: Create Infrastructure (Substage 2.7)
- Create `src/infrastructure/persistence/project-repository.js`
- Create `src/infrastructure/filesystem/fs-adapter.js`
- Create `src/infrastructure/logging/logger.js`
- Create `src/infrastructure/configuration/config-loader.js`

### Phase 6: Incremental Migration (Substage 2.7 continued)
- Update `app.js` to use shared core models instead of direct COMPONENTS/BOARDS imports where appropriate
- Update `app.js` to use execution service instead of direct engine calls
- Update `server.js` to use shared validation where appropriate
- Keep all existing imports working during transition

### Phase 7: Testing and Verification (Substage 2.9)
- Run existing tests (22 tests)
- Add architecture tests (no circular dependencies, core has no platform deps)
- Add board/component validation tests
- Add execution adapter tests
- Add project schema tests
- Run desktop, browser, and PWA regression tests

## 5. Dependency Rules

1. **Shared Core** → depends on NOTHING (no Electron, no DOM, no Node.js fs)
2. **Application Services** → depends on Shared Core + Platform Interfaces
3. **Infrastructure** → depends on Shared Core
4. **Execution** → depends on Shared Core + Infrastructure
5. **Platform Adapters** → depends on Shared Core + Infrastructure
6. **Presentation (app.js)** → depends on Application Services + Platform Adapters + Shared Core
7. **Backend (server.js)** → depends on Infrastructure + Shared Core

No circular dependencies are allowed.

## 6. Backward Compatibility

- All existing IPC channel names remain unchanged
- All existing project JSON schema fields remain valid (schema version added)
- All existing board/component IDs remain valid
- All existing API endpoints remain functional
- Browser/PWA mode continues to work without Electron
- Desktop mode continues to work with all existing features

## 7. What Stage 2 Does NOT Do

- Does not rebuild the frontend
- Does not replace existing execution engines
- Does not change simulation semantics
- Does not remove browser/PWA support
- Does not remove Electron desktop support
- Does not introduce new frameworks
- Does not create giant universal manager classes
- Does not duplicate core hardware logic across platforms

---

**Status:** Target architecture defined. Implementation begins with Substage 2.2 (Shared Core).