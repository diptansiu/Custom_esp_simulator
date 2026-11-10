# ESP Simulator Studio — Stage 2 Core Contracts

**Date:** 2026-11-08  
**Stage:** 2 — Core Architecture Modernization

## 1. Execution Engine Contract

The `ExecutionEngine` interface defines the contract that all simulation execution engines must implement. This enables the application services layer to work with any engine without knowing its specific implementation.

### Interface Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getCapabilities()` | `() → RuntimeCapability` | Returns engine capabilities (supported languages, boards, compiler requirements) |
| `validateInput(code, language, boardId)` | `(string, string, string) → {valid: true}` | Validates input code before execution |
| `prepare(code, language, boardId)` | `async → ExecutionResult` | Compiles/prepares code for execution |
| `start(sessionId, code, language, boardId)` | `async → ExecutionResult` | Starts execution of a session |
| `stop(sessionId)` | `async → void` | Stops execution of a session |
| `sendInput(sessionId, input)` | `async → void` | Sends input to a running session |
| `getState(sessionId)` | `(string) → ExecutionState` | Returns current execution state |
| `isSessionRunning(sessionId)` | `(string) → boolean` | Checks if a session is running |
| `cleanup(sessionId)` | `async → void` | Cleans up resources for a session |
| `shutdown()` | `async → void` | Cleans up all resources |

### RuntimeCapability

| Property | Type | Description |
|----------|------|-------------|
| `runtimeId` | string | Unique engine identifier |
| `supportedLanguages` | string[] | Languages supported (e.g. ['cpp', 'python']) |
| `supportedBoards` | string[] | Board IDs supported |
| `requiresCompiler` | boolean | Whether a C++ compiler is needed |
| `requiresInterpreter` | boolean | Whether a Python interpreter is needed |
| `supportsNativeProcess` | boolean | Whether native processes are spawned |
| `supportsSerialInput` | boolean | Whether serial input is supported |
| `supportsPinInput` | boolean | Whether pin-level input is supported |
| `supportsAnalogInput` | boolean | Whether analog input is supported |
| `supportsSSE` | boolean | Whether SSE streaming is used |
| `maxSessions` | number | Maximum concurrent sessions |
| `notes` | string | Human-readable notes |

### ExecutionState

| Property | Type | Description |
|----------|------|-------------|
| `sessionId` | string | Session identifier |
| `isRunning` | boolean | Whether execution is running |
| `isPaused` | boolean | Whether execution is paused |
| `language` | string | Execution language |
| `boardId` | string | Board identifier |
| `startTime` | number | Start timestamp |
| `boardState` | object | Current board GPIO/pin state |
| `error` | string | Error message if any |

### ExecutionResult

| Property | Type | Description |
|----------|------|-------------|
| `success` | boolean | Whether operation succeeded |
| `sessionId` | string | Session identifier |
| `mode` | string | Execution mode description |
| `error` | string | Error message if failed |
| `compilerError` | string | Compiler error if compilation failed |

### Engine Adapters (Existing)

| Engine | File | Capabilities |
|--------|------|--------------|
| Arduino C++ Fast Runner | `public/js/engine/arduino-interpreter.js` | cpp, browser-only, no compiler needed |
| MicroPython Fast Runner | `public/js/engine/micropython-interpreter.js` | python, browser-only, no interpreter needed |
| Native C++ Runner | `public/js/engine/real-runner.js` | cpp, requires clang++, HTTP + SSE |
| Host Python Runner | `public/js/engine/real-runner.js` | python, requires python3, HTTP + SSE |

## 2. Project Schema Contract

### Schema Version 1 (Initial)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Unique project ID |
| `name` | string | Yes | Project display name |
| `schemaVersion` | number | Yes | Schema version number (1) |
| `board` | string | Yes | Selected board ID |
| `language` | string | Yes | `cpp` or `python` |
| `runnerMode` | string | Yes | `browser` or `native` |
| `code` | string | Yes | Source code |
| `components` | array | Yes | Component instances |
| `wires` | array | Yes | Wire connections |
| `description` | string | No | Project description |
| `createdAt` | string | No | ISO 8601 timestamp |
| `updatedAt` | string | No | ISO 8601 timestamp |
| `assetReferences` | array | No | External asset references |

### Migration

No migrations are defined yet (schema v1 is initial). Future migrations will be added to `core/contracts/project-schema.js` as version transformation functions.

## 3. Event Contracts

### Event Categories

| Category | Description |
|----------|-------------|
| `project` | Project lifecycle events |
| `board` | Board selection events |
| `circuit` | Circuit/wire connection events |
| `component` | Component add/update/remove events |
| `execution` | Execution start/stop/fail events |
| `simulation` | Simulation start/pause/resume/stop events |
| `runtime` | Runtime availability events |
| `ui` | UI panel/tab events |

### Standard Event Names

| Event | Payload |
|-------|---------|
| `project:created` | `{projectId, projectName, board}` |
| `project:loaded` | `{projectId, projectName, board}` |
| `project:saved` | `{projectId, projectName, board, filename}` |
| `project:deleted` | `{projectId}` |
| `board:selected` | `{boardId, boardName, family}` |
| `circuit:updated` | `{wiresCleared, previousCount}` |
| `connection:created` | `{wireId, from, to, color}` |
| `connection:removed` | `{wireId, from, to}` |
| `component:added` | `{componentId, componentType, x, y}` |
| `component:removed` | `{componentId}` |
| `component:updated` | `{componentId, updates}` |
| `execution:started` | `{sessionId, engine, language, boardId}` |
| `execution:stopped` | `{sessionId, engine}` |
| `execution:failed` | `{sessionId, engine, error}` |
| `runtime:available` | `{runtime, available}` |
| `runtime:unavailable` | `{runtime, available}` |
| `runtime:error` | `{runtime, error}` |

## 4. Error Contracts

### Error Hierarchy

```
ESPError (base)
├── ValidationError (invalid input data)
├── ConfigError (missing/invalid configuration)
├── RuntimeError (compiler/interpreter not found)
├── ExecutionError (simulation execution failed)
├── StorageError (project persistence failed)
└── NotFoundError (resource not found)
```

Each error includes:
- `name`: Error class name
- `code`: Machine-readable error code
- `message`: Human-readable message
- `details`: Structured detail object
- `timestamp`: ISO 8601 timestamp

### Error Codes

| Code | Meaning |
|------|---------|
| `ESP_ERROR` | Generic application error |
| `VALIDATION_ERROR` | Invalid input data |
| `CONFIG_ERROR` | Configuration issue |
| `RUNTIME_ERROR` | Runtime not available |
| `EXECUTION_ERROR` | Execution failure |
| `STORAGE_ERROR` | Persistence failure |
| `NOT_FOUND` | Resource not found |
