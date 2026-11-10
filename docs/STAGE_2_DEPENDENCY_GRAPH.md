# ESP Simulator Studio — Stage 2 Dependency Graph

**Date:** 2026-11-08  
**Stage:** 2 — Core Architecture Modernization

## 1. Dependency Direction Rules

The architecture enforces a strict dependency direction to prevent circular dependencies and ensure layer separation:

```
LAYER N → depends only on layers N-1 and below
LAYER N → does NOT depend on layers N+1 and above
NO circular dependencies allowed
```

## 2. Layer Dependency Graph

```
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 5: PRESENTATION (app.js, UI modules)                              │
│  Depends on: Layer 4, Layer 3, Layer 2                                  │
│  ┌─────────────┐                                                       │
│  │ app.js      │────┐                                                  │
│  │ UI modules  │────┼──→ uses                                          │
│  └─────────────┘  │                                                    │
└───────────────────┴─────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 4: PLATFORM ADAPTERS (Electron, Browser, PWA)                     │
│  Depends on: Layer 3, Layer 2                                           │
│  ┌─────────────┐                                                       │
│  │ IPC adapter │────┐                                                  │
│  │ Storage ad. │────┼──→ uses                                          │
│  │ Dialog ad.  │────┘                                                  │
│  └─────────────┘                                                       │
└───────────────────┴─────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 3: INFRASTRUCTURE (Logging, Config, Persistence, Filesystem)      │
│  Depends on: Layer 2                                                    │
│  ┌─────────────┐                                                       │
│  │ Logger      │────┐                                                  │
│  │ Config loader│──┼──→ uses                                           │
│  │ FS adapter  │────┘                                                  │
│  └─────────────┘                                                       │
└───────────────────┴─────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 2: APPLICATION SERVICES (Project, Board, Component, Circuit,     │
│                 Execution, Session, Config services)                    │
│  Depends on: Layer 1                                                    │
│  ┌─────────────┐                                                       │
│  │ Project Svc │────┐                                                  │
│  │ Board Svc   │────┼──→ uses                                          │
│  │ Component Svc│────┤                                                 │
│  │ Circuit Svc │────┤                                                 │
│  │ Exec Svc    │────┤                                                 │
│  │ Session Svc │────┘                                                 │
│  │ Config Svc  │                                                      │
│  └─────────────┘                                                       │
└───────────────────┴─────────────────────────────────────────────────────┘
                          ↓ uses
┌─────────────────────────────────────────────────────────────────────────┐
│ LAYER 1: SHARED CORE (Models, Validation, Contracts, Events, Constants)│
│  Depends on: NOTHING (platform-independent)                             │
│  ┌─────────────┐                                                       │
│  │ Board model │                                                       │
│  │ Comp. model │                                                       │
│  │ Circuit mdl │                                                       │
│  │ Project mdl │                                                       │
│  │ Validation  │                                                       │
│  │ Contracts   │                                                       │
│  │ Event bus   │                                                       │
│  │ Errors      │                                                       │
│  └─────────────┘                                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

## 3. Module-Level Dependency Details

### 3.1 Shared Core (Zero Dependencies)

| Module | Imports | Imported By |
|--------|---------|-------------|
| `core/constants/index.js` | none | All layers |
| `core/errors/index.js` | `./constants` | All layers |
| `core/models/board.js` | `./constants`, `./errors` | Application services, Presentation |
| `core/models/component.js` | `./constants`, `./errors` | Application services, Presentation |
| `core/models/circuit.js` | `./constants`, `./errors` | Application services, Presentation |
| `core/models/project.js` | `./constants`, `./errors`, `./circuit` | Application services, Presentation |
| `core/validation/board.js` | `./constants`, `./errors`, `./models/board` | Application services |
| `core/validation/component.js` | `./constants`, `./errors` | Application services |
| `core/validation/project.js` | `./constants`, `./errors` | Application services |
| `core/contracts/execution-engine.js` | `./constants`, `./errors` | Application services, Execution engines |
| `core/contracts/project-schema.js` | `./constants`, `./errors` | Application services |
| `core/contracts/event-contracts.js` | `./constants` | All layers |
| `core/events/event-bus.js` | `./contracts/event-contracts` | Application services |

### 3.2 Application Services (Depends on Layer 1 Only)

| Module | Imports |
|--------|---------|
| `services/project-service.js` | `../shared/core/models/project`, `../shared/core/errors` |
| `services/board-service.js` | `../shared/core/models/board`, `../shared/core/validation/board`, `../shared/core/errors` |
| `services/component-service.js` | `../shared/core/models/component`, `../shared/core/validation/component`, `../shared/core/errors` |
| `services/circuit-service.js` | `../shared/core/models/circuit`, `../shared/core/errors` |
| `services/execution-service.js` | `../shared/core/errors`, `../shared/core/constants` |
| `services/session-service.js` | `../shared/core/errors` |
| `services/config-service.js` | `../shared/core/constants`, `../shared/core/errors` |

### 3.3 Infrastructure (Depends on Layer 1)

| Module | Imports |
|--------|---------|
| `infrastructure/logging/logger.js` | none |

### 3.4 Platform Adapters (Depends on Layers 2 and 3)

Not yet implemented in Stage 2 (planned for future incremental migration). Existing `desktop/main/*` and `desktop/preload/preload.js` remain as-is.

### 3.5 Presentation (app.js - Partially Migrated)

| Module | Imports |
|--------|---------|
| `public/js/app.js` | `./boards/board-defs.js`, `./components/component-defs.js`, `./engine/*`, `./ui/*`, `./shared/core/index.js` (NEW) |

## 4. Circular Dependency Check

Result: **NO CIRCULAR DEPENDENCIES**

The dependency graph is a directed acyclic graph (DAG):
- Layer 1 → no dependencies
- Layer 2 → Layer 1 only
- Layer 3 → Layer 1 only
- Layer 4 → Layers 2 and 3 only
- Layer 5 → Layers 2, 3, and 4 only

## 5. Existing Backend Dependencies (Unchanged)

The existing `server.js` backend maintains its own dependency structure:
- Node.js built-ins: `http`, `fs`, `path`, `child_process`, `crypto`
- No dependency on shared core (planned for future incremental migration)
- Frontend communicates via HTTP API (preserved contract)

## 6. Dependency Verification

To verify no circular dependencies exist:

```powershell
# Check that shared core modules don't import from application/services
Select-String -Path "public/js/shared/core/**/*.js" -Pattern "from.*application/services"

# Check that application services don't import from presentation
Select-String -Path "public/js/application/services/**/*.js" -Pattern "from.*\.\./\.\./app"

# All should return no results
```

Expected result: No matches (clean dependency graph).
