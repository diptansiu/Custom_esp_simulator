# ESP Simulator Studio — Stage 2 Module Map

**Date:** 2026-11-08  
**Stage:** 2 — Core Architecture Modernization

## 1. Module Organization

The target architecture introduces a modular structure under `src/` and `public/js/shared/` while preserving all existing files.

### 1.1 Shared Core (`public/js/shared/core/`)

| Module | File | Purpose |
|--------|------|---------|
| Constants | `core/constants/index.js` | Shared constants (runner modes, languages, categories, capabilities, error messages) |
| Errors | `core/errors/index.js` | Shared error classes (ESPError, ValidationError, ConfigError, RuntimeError, ExecutionError, StorageError, NotFoundError) |
| Board Model | `core/models/board.js` | Board domain model with pin definitions, aliases, validation |
| Component Model | `core/models/component.js` | Component domain model with pins, props, instance model |
| Circuit Model | `core/models/circuit.js` | Circuit netlist model (Wire, CircuitNet, net analysis) |
| Project Model | `core/models/project.js` | Project domain model with schema versioning and migration |
| Board Validation | `core/validation/board.js` | Board data and ID validation |
| Component Validation | `core/validation/component.js` | Component data and instance validation |
| Project Validation | `core/validation/project.js` | Project data import/export validation |
| Execution Contract | `core/contracts/execution-engine.js` | ExecutionEngine interface, RuntimeCapability, ExecutionState, ExecutionResult |
| Project Schema | `core/contracts/project-schema.js` | Project schema versions, validation, migration |
| Event Contracts | `core/contracts/event-contracts.js` | Event categories, names, payload schemas |
| Event Bus | `core/events/event-bus.js` | Publish/subscribe event bus |
| Core Index | `core/index.js` | Barrel export for all shared core modules |

### 1.2 Application Services (`public/js/application/services/`)

| Module | File | Purpose |
|--------|------|---------|
| Project Service | `services/project-service.js` | Project CRUD, import/export, validation |
| Board Service | `services/board-service.js` | Board registry, lookup, capability queries |
| Component Service | `services/component-service.js` | Component registry, lookup, category queries |
| Circuit Service | `services/circuit-service.js` | Wire management, net analysis, circuit solving |
| Execution Service | `services/execution-service.js` | Engine registry, session execution coordination |
| Session Service | `services/session-service.js` | Session lifecycle (create, stop, cleanup, isolation) |
| Config Service | `services/config-service.js` | Configuration loading, saving, defaults merging |
| Services Index | `services/index.js` | Barrel export for all application services |

### 1.3 Infrastructure (`public/js/infrastructure/`)

| Module | File | Purpose |
|--------|------|---------|
| Logger | `infrastructure/logging/logger.js` | Centralized logging with configurable levels |

### 1.4 Existing Files Preserved

All existing files remain in their original locations:
- `server.js` — Backend entry point
- `public/index.html` — Frontend entry point
- `public/js/app.js` — Main application (incrementally refactored)
- `public/js/boards/board-defs.js` — Board definitions (source of truth)
- `public/js/components/component-defs.js` — Component definitions (source of truth)
- `public/js/components/component-svg.js` — SVG renderers
- `public/js/engine/*` — All execution engines
- `public/js/ui/*` — All UI modules
- `desktop/main/*` — All Electron main process modules
- `desktop/preload/preload.js` — Sandboxed preload
- `test/*` — All existing tests
- `backend/core/*` — C++/Python runtime cores

## 2. Canonical Locations

| Concern | Canonical Location | Notes |
|---------|-------------------|-------|
| Board definitions | `public/js/boards/board-defs.js` | Source of truth; shared core Board model wraps this data |
| Component definitions | `public/js/components/component-defs.js` | Source of truth; shared core Component model wraps this data |
| Circuit netlist | `public/js/engine/circuit-net.js` | Existing implementation; shared core CircuitNet wraps this |
| Execution engines | `public/js/engine/*` | Existing implementations; wrapped by execution adapters |
| UI modules | `public/js/ui/*` | Existing implementations; unchanged |
| Electron main | `desktop/main/*` | Existing implementations; unchanged |
| Preload | `desktop/preload/preload.js` | Existing implementation; unchanged |
| Backend server | `server.js` | Existing implementation; unchanged entry point |
| Shared core (new) | `public/js/shared/core/` | New modular domain layer |
| Application services (new) | `public/js/application/services/` | New service layer |

## 3. Import Relationships

```
public/js/app.js
  ├── ./boards/board-defs.js (existing, preserved)
  ├── ./components/component-defs.js (existing, preserved)
  ├── ./engine/* (existing, preserved)
  ├── ./ui/* (existing, preserved)
  └── ./shared/core/index.js (NEW - shared core constants, errors, models, validation)

public/js/shared/core/*
  ├── No external dependencies (platform-independent)

public/js/application/services/*
  └── ./shared/core/index.js (depends on shared core only)

public/js/infrastructure/logging/*
  └── No external dependencies (standalone)
```

## 4. Files Created (Stage 2)

| File | Status |
|------|--------|
| `public/js/shared/core/constants/index.js` | Created |
| `public/js/shared/core/errors/index.js` | Created |
| `public/js/shared/core/models/board.js` | Created |
| `public/js/shared/core/models/component.js` | Created |
| `public/js/shared/core/models/circuit.js` | Created |
| `public/js/shared/core/models/project.js` | Created |
| `public/js/shared/core/validation/board.js` | Created |
| `public/js/shared/core/validation/component.js` | Created |
| `public/js/shared/core/validation/project.js` | Created |
| `public/js/shared/core/contracts/execution-engine.js` | Created |
| `public/js/shared/core/contracts/project-schema.js` | Created |
| `public/js/shared/core/contracts/event-contracts.js` | Created |
| `public/js/shared/core/events/event-bus.js` | Created |
| `public/js/shared/core/index.js` | Created |
| `public/js/application/services/project-service.js` | Created |
| `public/js/application/services/board-service.js` | Created |
| `public/js/application/services/component-service.js` | Created |
| `public/js/application/services/circuit-service.js` | Created |
| `public/js/application/services/execution-service.js` | Created |
| `public/js/application/services/session-service.js` | Created |
| `public/js/application/services/config-service.js` | Created |
| `public/js/application/services/index.js` | Created |
| `public/js/infrastructure/logging/logger.js` | Created |
| `src/shared/core/*` | Source copies (development) |
| `src/application/services/*` | Source copies (development) |
| `src/infrastructure/logging/*` | Source copies (development) |

## 5. Files Modified (Stage 2)

| File | Change |
|------|--------|
| `public/js/app.js` | Added shared core imports; added `_initSharedCoreServices()`; added board validation in `switchBoard()`; added code validation in `runSimulation()` |

## 6. Files Deleted

None. All existing files are preserved.

## 7. Duplicate/Unused Files (Intentionally Preserved)

| File | Reason |
|------|--------|
| `public copy/`, `backend copy/`, `projects copy/`, `server copy.js`, `README copy.md`, `package copy.json` | Duplicate folders/files intentionally untouched per project rules |
| `desktop/preload/desktop-api.js` | Reference copy of preload API (not loaded at runtime) |
