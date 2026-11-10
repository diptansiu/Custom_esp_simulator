# ESP Simulator Studio — Stage 3 Architecture Prerequisites

**Date:** 2026-11-08  
**Stage:** 3 — Professional Cybernetic IDE, Interactive Circuit Workspace  
**Substage:** 3.0 — Stage 2 Architecture Closure Verification

## 1. Purpose

This document records the findings from verifying the Stage 2 (Core Architecture Modernization) implementation before beginning Stage 3. It identifies what is actually implemented, what is missing, and what prerequisite repairs must be completed before building Stage 3 features (manual wire connection, wire removal, execution orchestration, professional IDE).

The repository and actual source code are the authoritative sources of truth — not the Stage 2 acceptance reports.

## 2. Stage 2 Implementation — Actual Findings

### 2.1 What IS implemented (verified in source)

| Component | Location | Status |
|-----------|----------|--------|
| Shared core constants | `public/js/shared/core/constants/index.js` | Implemented |
| Shared core errors | `public/js/shared/core/errors/index.js` | Implemented |
| Board model | `public/js/shared/core/models/board.js` | Implemented |
| Component model | `public/js/shared/core/models/component.js` | Implemented |
| Circuit model (Wire, CircuitNet) | `public/js/shared/core/models/circuit.js` | Implemented |
| Project model (with schema v1 + migration) | `public/js/shared/core/models/project.js` | Implemented |
| Board validation | `public/js/shared/core/validation/board.js` | Implemented |
| Component validation | `public/js/shared/core/validation/component.js` | Implemented |
| Project validation | `public/js/shared/core/validation/project.js` | Implemented |
| ExecutionEngine contract | `public/js/shared/core/contracts/execution-engine.js` | Implemented |
| Project schema contract | `public/js/shared/core/contracts/project-schema.js` | Implemented |
| Event contracts | `public/js/shared/core/contracts/event-contracts.js` | Implemented |
| EventBus | `public/js/shared/core/events/event-bus.js` | Implemented |
| Core barrel export | `public/js/shared/core/index.js` | Implemented |
| ProjectService | `public/js/application/services/project-service.js` | Implemented |
| BoardService | `public/js/application/services/board-service.js` | Implemented |
| ComponentService | `public/js/application/services/component-service.js` | Implemented |
| CircuitService | `public/js/application/services/circuit-service.js` | Implemented |
| ExecutionService | `public/js/application/services/execution-service.js` | Implemented |
| SessionService | `public/js/application/services/session-service.js` | Implemented |
| ConfigService | `public/js/application/services/config-service.js` | Implemented |
| Services barrel export | `public/js/application/services/index.js` | Implemented |
| Centralized Logger | `public/js/infrastructure/logging/logger.js` | Implemented |
| app.js imports shared core | `public/js/app.js` line 16 | Partially (imports constants/errors/validation only) |

### 2.2 What is NOT implemented (gaps requiring prerequisite repair)

| Gap | Location | Impact on Stage 3 |
|-----|----------|-------------------|
| Platform adapters | `public/js/platform/` does NOT exist | No Electron/Browser/PWA adapter layer |
| Execution engine adapters | No adapters wrapping ArduinoInterpreter, MicroPythonInterpreter, RealCodeRunner | ExecutionEngine interface exists but is unused |
| Shared core service integration in app.js | app.js creates lightweight wrappers instead of using BoardService/ComponentService/CircuitService | app.js still uses existing BOARDS/COMPONENTS/circuitNet directly |
| Wire connection subsystem | No WireInteractionController, WireConnectionService, WireValidationService | Stage 3 manual wiring depends on this |
| Wire removal subsystem | No WireRemovalService | Stage 3 depends on this |
| Circuit topology service | No CircuitTopologyService | Stage 3 depends on this |
| Wire routing service | No WireRoutingService | Stage 3 depends on this |
| Execution orchestration | No ExecutionOrchestrator, ExecutionCommandService, ExecutionPreflightService | Stage 3 depends on this |
| Execution session controller | No ExecutionSessionController | Stage 3 depends on this |
| Execution output router | No ExecutionOutputRouter | Stage 3 depends on this |
| Circuit signal router | No CircuitSignalRouter | Stage 3 depends on this |
| Project file explorer / multi-file editor | Not implemented | Stage 3 IDE depends on this |

### 2.3 Dual CircuitNet problem

The codebase has TWO CircuitNet implementations:
1. `public/js/engine/circuit-net.js` — the existing engine circuit-net used by `app.js` (`this.circuitNet`)
2. `public/js/shared/core/models/circuit.js` — the Stage 2 shared core CircuitNet (unused by app.js)

`app.js` uses `this.circuitNet = new CircuitNet()` from `./engine/circuit-net.js` (line 4 of app.js). The shared core CircuitNet is defined but never instantiated in the running application.

This must be resolved before Stage 3: either the shared core CircuitNet becomes the canonical implementation used by app.js, or the wire subsystem builds on the existing engine CircuitNet.

**Decision:** The shared core `CircuitNet` (in `public/js/shared/core/models/circuit.js`) is the canonical implementation for Stage 3. It has `addWire`, `removeWire`, `getWire`, `buildGraph`, `findNet`, `isNetGnd`, `isNetVcc`, `toJSON`, `fromJSON`, `subscribe`. The existing engine `CircuitNet` in `./engine/circuit-net.js` has additional `solve()` logic for signal propagation. For Stage 3, the shared core CircuitNet will be extended with `solve()` signal propagation, and app.js will be migrated to use it via the CircuitService.

### 2.4 Dual Wire system

The existing `app.js` already has a basic wire manager (`initWireManager`) that operates on `this.circuitNet.wires` (the engine CircuitNet). It supports:
- Listing wires with color pills and delete buttons
- Changing wire color
- Deleting individual wires
- Subscribing to wire changes

This existing wire UI will be preserved and enhanced by the Stage 3 wire subsystem rather than replaced.

### 2.5 Existing execution engines (to be wrapped)

| Engine | File | Language | Native process? |
|--------|------|----------|-----------------|
| ArduinoInterpreter | `public/js/engine/arduino-interpreter.js` | cpp | No (in-browser transpile) |
| MicroPythonInterpreter | `public/js/engine/micropython-interpreter.js` | python | No (in-browser transpile) |
| RealCodeRunner | `public/js/engine/real-runner.js` | cpp/python | Yes (HTTP + SSE to backend) |

None of these implement the `ExecutionEngine` interface from `shared/core/contracts/execution-engine.js`. Concrete adapters must be created.

### 2.6 IPC channels available (preload)

The following IPC channels are registered in `desktop/preload/preload.js` and `desktop/main/ipc/`:
- `app:get-status`, `backend:start`, `backend:stop`, `runtime:get-status`, `runtime:validate-cpp`, `runtime:validate-python`, `runtime:save-config`, `runtime:get-config`, `runtime:detect`
- `app:open-external`, `app:show-error`, `app:show-info`
- `window:get-state`, `window:set-state`, `window:focus`
- `project:get-all`, `project:save`, `project:load`, `project:delete`, `project:import`, `project:export`
- `storage:get-paths`
- `dialog:open-file`, `dialog:save-file`, `dialog:open-folder`
- Menu events: `menu-new-project`, `menu-open-project`, `menu-save-project`, `menu-save-project-as`, `menu-import-project`, `menu-export-project`, `menu-simulation-start`, `menu-simulation-stop`, `menu-simulation-reset`, `menu-runtime-settings`, `menu-app-preferences`, `menu-serial-monitor`, `menu-gpio-inspector`

No execution-orchestration or wire-management IPC channels exist yet (not needed — Stage 3 runs execution in-browser via the existing engines, and wire management is renderer-only).

## 3. Prerequisite Repairs Required Before Stage 3

### Repair 1: Wire up shared core services in app.js (HIGH priority)

`app.js` currently creates lightweight wrapper objects in `_initSharedCoreServices()` instead of instantiating the actual shared core service classes. Fix: instantiate `BoardService`, `ComponentService`, `CircuitService`, `ExecutionService`, `SessionService`, `ConfigService` and an `EventBus`, and wire them into `app.js`.

### Repair 2: Create concrete execution engine adapters (HIGH priority)

Create adapters wrapping the three existing engines so they implement the `ExecutionEngine` interface:
- `ArduinoInterpreterAdapter` — wraps `ArduinoInterpreter`
- `MicroPythonInterpreterAdapter` — wraps `MicroPythonInterpreter`  
- `RealCodeRunnerAdapter` — wraps `RealCodeRunner`

Register them with `ExecutionService`.

### Repair 3: Create platform adapters (MEDIUM priority)

Create `public/js/platform/electron/`, `public/js/platform/browser/`, `public/js/platform/pwa/` adapter modules. For Stage 3, the Electron adapter is most important (desktop IPC). Browser/PWA adapters can be minimal stubs that preserve existing behavior.

### Repair 4: Unify CircuitNet (MEDIUM priority)

Decide whether the shared core `CircuitNet` or the engine `CircuitNet` is canonical. For Stage 3, extend the shared core `CircuitNet` with `solve()` signal propagation and migrate `app.js` to use `CircuitService` (which wraps shared core `CircuitNet`).

### Repair 5: Verify existing tests still pass (HIGH priority)

After all repairs, run `node --test` to confirm no regressions.

## 4. Repair Plan and Order

1. Create `public/js/platform/electron/ipc-adapter.js` — wraps existing `desktopAPI`
2. Create `public/js/platform/browser/` adapters — minimal stubs
3. Create execution engine adapters in `public/js/application/services/engines/`
4. Wire shared core services into `app.js` (replace lightweight wrappers)
5. Extend shared core `CircuitNet` with `solve()` if needed
6. Run `node --test` and syntax checks
7. Document findings

## 5. Files to be created (prerequisite repairs)

| File | Purpose |
|------|---------|
| `public/js/platform/electron/ipc-adapter.js` | Electron IPC adapter |
| `public/js/platform/browser/ipc-adapter.js` | Browser IPC adapter (stub) |
| `public/js/platform/browser/storage-adapter.js` | Browser storage adapter (stub) |
| `public/js/application/services/engines/arduino-interpreter-adapter.js` | Arduino engine adapter |
| `public/js/application/services/engines/micropython-interpreter-adapter.js` | MicroPython engine adapter |
| `public/js/application/services/engines/real-code-runner-adapter.js` | RealCodeRunner engine adapter |
| `public/js/application/services/engines/index.js` | Engine adapters barrel export |

## 6. Files to be modified (prerequisite repairs)

| File | Change |
|------|--------|
| `public/js/app.js` | Wire up shared core services; instantiate EventBus, ExecutionService, SessionService, CircuitService, etc. |
| `public/js/shared/core/models/circuit.js` | Extend CircuitNet with `solve()` signal propagation (if needed) |

## 7. Acceptance for Substage 3.0

- `node --check` passes on all new/modified files
- `node --test` passes (19 passed, 2 environment-related failures, 1 skipped — same as before Stage 2)
- Shared core services are instantiated and wired in app.js
- Execution engine adapters implement the ExecutionEngine interface and are registered
- Platform adapter directory exists with Electron adapter
- No regressions in existing functionality

## 8. Repair Status — COMPLETE

All prerequisite repairs have been completed:

| Repair | Status | Details |
|--------|--------|---------|
| Shared core services wired into app.js | COMPLETE | EventBus, BoardService, ComponentService, CircuitService, ExecutionService, SessionService, ConfigService all instantiated and registered |
| Execution engine adapters | COMPLETE | ArduinoInterpreterAdapter, MicroPythonInterpreterAdapter, RealCodeRunnerAdapter created and registered with ExecutionService |
| Platform adapters | COMPLETE | Electron IPC adapter, Browser adapter, Browser storage adapter created |
| CircuitNet solve() method | COMPLETE | Shared core CircuitNet extended with full solve() signal propagation logic |
| Syntax checks | COMPLETE | All 40+ files pass `node --check` |
| Automated tests | COMPLETE | 19/22 passed, 2 environment-related (missing Windows SDK headers), 1 skipped (no Python) — same as baseline, no regressions |

## 9. Files Created (Prerequisite Repairs)

| File | Purpose |
|------|---------|
| `public/js/shared/core/models/circuit.js` | Extended CircuitNet with `solve()` signal propagation |
| `public/js/application/services/engines/arduino-interpreter-adapter.js` | Arduino engine adapter |
| `public/js/application/services/engines/micropython-interpreter-adapter.js` | MicroPython engine adapter |
| `public/js/application/services/engines/real-code-runner-adapter.js` | RealCodeRunner engine adapter |
| `public/js/application/services/engines/index.js` | Engine adapters barrel export |
| `public/js/platform/electron/ipc-adapter.js` | Electron IPC adapter |
| `public/js/platform/browser/ipc-adapter.js` | Browser IPC adapter (stub) |
| `public/js/platform/browser/storage-adapter.js` | Browser storage adapter |
| `public/js/platform/index.js` | Platform adapters barrel export |

## 10. Files Modified (Prerequisite Repairs)

| File | Change |
|------|--------|
| `public/js/app.js` | Added shared core imports; instantiated EventBus, BoardService, ComponentService, CircuitService, ExecutionService, SessionService, ConfigService, platform adapter; registered engine adapters; runSimulation/stopSimulation now delegate to ExecutionService |

## 11. Ready for Stage 3

All Stage 2 architecture integration is complete. The shared core, application services, execution engine adapters, and platform adapters are all in place and verified. Ready to begin Stage 3.1 (Professional Cybernetic Design System).
