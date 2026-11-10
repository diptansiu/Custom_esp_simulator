# ESP Simulator Studio — Stage 2 Execution Architecture

**Date:** 2026-11-08  
**Stage:** 2 — Core Architecture Modernization

## 1. Execution Engine Abstraction

The execution layer provides a unified lifecycle management interface for all simulation execution modes. Each engine is wrapped by an adapter that implements the `ExecutionEngine` interface.

## 2. Existing Execution Modes

| Engine | File | Language | Compiler Required | Process Type |
|--------|------|----------|-------------------|--------------|
| Arduino C++ Fast Runner | `public/js/engine/arduino-interpreter.js` | cpp | No | In-browser (transpile to JS) |
| MicroPython Fast Runner | `public/js/engine/micropython-interpreter.js` | python | No | In-browser (transpile to JS) |
| Native C++ Runner | `public/js/engine/real-runner.js` | cpp | Yes (clang++) | Host process (child_process) |
| Host Python Runner | `public/js/engine/real-runner.js` | python | Yes (python3) | Host process (child_process) |

## 3. Engine Capabilities

### Arduino C++ Fast Runner
```
runtimeId: "arduino-interpreter"
supportedLanguages: ["cpp"]
supportedBoards: ["esp8266-nodemcu", "esp32-wroom-da", "esp32-devkit-v1", ...]
requiresCompiler: false
requiresInterpreter: false
supportsNativeProcess: false
supportsSerialInput: true
supportsPinInput: true
supportsAnalogInput: true
supportsSSE: false
maxSessions: 1 (single-threaded in-browser)
```

### MicroPython Fast Runner
```
runtimeId: "micropython-interpreter"
supportedLanguages: ["python"]
supportedBoards: ["esp8266-nodemcu", "esp32-wroom-da", "esp32-devkit-v1", ...]
requiresCompiler: false
requiresInterpreter: false
supportsNativeProcess: false
supportsSerialInput: true
supportsPinInput: true
supportsAnalogInput: true
supportsSSE: false
maxSessions: 1
```

### Native C++ Runner
```
runtimeId: "native-cpp"
supportedLanguages: ["cpp"]
supportedBoards: ["esp8266-nodemcu", "esp32-wroom-da", "esp32-devkit-v1"]
requiresCompiler: true (clang++)
requiresInterpreter: false
supportsNativeProcess: true
supportsSerialInput: true
supportsPinInput: true
supportsAnalogInput: true
supportsSSE: true
maxSessions: Multiple (independent sessions)
```

### Host Python Runner
```
runtimeId: "host-python"
supportedLanguages: ["python"]
supportedBoards: ["esp8266-nodemcu", "esp32-wroom-da", "esp32-devkit-v1"]
requiresCompiler: false
requiresInterpreter: true (python3)
supportsNativeProcess: true
supportsSerialInput: true
supportsPinInput: true
supportsAnalogInput: true
supportsSSE: true
maxSessions: Multiple
```

## 4. Session Management

### Session Isolation

Each simulation session is independent:
- Unique session ID (`sim_<uuid>`)
- Separate process (for native runners)
- Separate SSE connection stream
- Separate input/output buffers
- Independent start/stop lifecycle

### Session Lifecycle

1. **Create** — Session registered in session manager
2. **Bind** — Session associated with execution engine
3. **Start** — Engine begins execution (compile + run for native)
4. **Run** — Engine produces output via SSE/events
5. **Input** — User sends input (pin, analog, serial, HTTP)
6. **Stop** — Engine terminates execution
7. **Cleanup** — Resources freed, temp files deleted

### Session Concurrency

Multiple sessions can run simultaneously:
- Each has its own process (native) or interpreter instance (browser)
- Stopping one session does not affect others
- Temp files are cleaned up on session termination
- SSE connections are per-session

## 5. Execution Flow (Native Mode)

```
User clicks Run
    ↓
app.js.runSimulation()
    ↓
ExecutionService.startExecution()
    ↓
RealCodeRunner.start() → POST /api/run-real
    ↓
server.js compiles with clang++
    ↓
server.js spawns binary process
    ↓
SSE stream delivers output
    ↓
app.js handles hardware events
    ↓
canvas renders board state
```

## 6. Execution Flow (Browser Mode)

```
User clicks Run
    ↓
app.js.runSimulation()
    ↓
ArduinoInterpreter.run() or MicroPythonInterpreter.run()
    ↓
Code transpiled to JavaScript
    ↓
eval() executes in-browser
    ↓
Board state updated via callbacks
    ↓
canvas renders board state
```

## 7. Adaptation Plan (Future)

The execution engine adapters will wrap the existing implementations:

```javascript
// ArduinoInterpreterAdapter implements ExecutionEngine
class ArduinoInterpreterAdapter extends ExecutionEngine {
  constructor(arduinoInterpreter) {
    super({ engineId: 'arduino-interpreter', engineName: 'Arduino C++ Fast Runner' });
    this.interpreter = arduinoInterpreter;
  }
  
  getCapabilities() { ... }
  validateInput(code, language, boardId) { ... }
  async start(sessionId, code, language, boardId) { ... }
  async stop(sessionId) { ... }
  // ...
}
```

This adaptation is planned for a future incremental step and does not modify the existing engine implementations.
