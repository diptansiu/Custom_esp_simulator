# Feature Matrix

## Legend

| Status | Meaning |
|--------|---------|
| ✅ Implemented | Feature is implemented and working |
| ✅ Tested | Feature is implemented and has automated tests |
| ⚠️ Partial | Feature is partially implemented |
| 🔲 Visual-only | Feature exists only in UI, no backend support |
| ❌ Unsupported | Feature is not supported |
| 📋 Planned | Feature is planned for future stage |

---

## Core Server

| Feature | Status | Notes |
|---------|--------|-------|
| HTTP server startup | ✅ Tested | Reliable startup on configurable port |
| Loopback binding (default) | ✅ Tested | Binds to 127.0.0.1 by default |
| Graceful shutdown | ✅ Implemented | Cleans up sessions and temp files |
| Error handling | ✅ Tested | Malformed requests don't crash server |
| CORS (restricted) | ✅ Tested | Same-origin only by default |
| Rate limiting | ❌ Unsupported | Not implemented in Stage 0/1 |
| Authentication | ❌ Unsupported | Not implemented in Stage 0/1 |

## API Endpoints

| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/status | ✅ Tested | Reports real availability |
| GET /api/projects | ✅ Implemented | Lists saved projects |
| POST /api/run-real | ✅ Tested | Start C++ or Python execution |
| POST /api/stop/:id | ✅ Tested | Stop specific session |
| POST /api/input/:id | ✅ Tested | Send input events |
| GET /api/stream/:id | ✅ Tested | SSE output stream |

## Request Validation

| Validation | Status | Notes |
|------------|--------|-------|
| Content-Type check | ✅ Tested | |
| JSON syntax | ✅ Tested | |
| Body size limit | ✅ Implemented | 1 MB max |
| Required fields | ✅ Tested | |
| Language identifier | ✅ Tested | cpp, python |
| Board identifier | ✅ Tested | Unknown boards rejected |
| Visual-only board rejection | ✅ Tested | Native execution blocked for visual boards |
| Input event type | ✅ Tested | Valid events enforced |
| Pin value validation | ✅ Tested | 0 or 1 for digital |
| ADC value validation | ✅ Tested | Must be number |
| Session ID validation | ✅ Tested | Non-existent returns 404 |
| Path traversal protection | ✅ Tested | Normalized path check |

## Execution Engines

| Feature | Status | Notes |
|---------|--------|-------|
| C++ native execution | ⚠️ Partial | Requires clang++ (not installed on this Windows) |
| Python compatibility execution | ⚠️ Partial | Requires python3 (not in PATH on this Windows) |
| In-browser Arduino runner | ✅ Implemented | Fast runner in browser |
| In-browser MicroPython runner | ✅ Implemented | Fast runner in browser |
| Compiler discovery | ✅ Implemented | Configurable via ESP_SIM_CXX |
| Python discovery | ✅ Implemented | Configurable via ESP_SIM_PYTHON |
| Compilation timeout | ✅ Implemented | 15 seconds |
| Process termination | ✅ Implemented | SIGTERM → SIGKILL |
| Temp file cleanup | ✅ Implemented | Per-session cleanup |

## Session Management

| Feature | Status | Notes |
|---------|--------|-------|
| Independent sessions | ✅ Tested | Sessions don't affect each other |
| Unique session IDs | ✅ Tested | UUID-based |
| Session isolation | ✅ Tested | No cross-session leakage |
| Independent stopping | ✅ Tested | Stop one doesn't stop others |
| Repeated stop handling | ✅ Tested | Idempotent |
| SSE per session | ✅ Tested | Session-specific connections |
| Output buffering | ✅ Implemented | Bounded to 1000 lines |
| Process lifecycle | ✅ Implemented | Handles exit, error, timeout |
| Server shutdown cleanup | ✅ Implemented | All sessions terminated |

## Board Support

| Category | Status | Boards |
|----------|--------|--------|
| Native C++ (ESP8266) | ✅ Implemented | esp8266-nodemcu |
| Native C++ (ESP32) | ✅ Implemented | esp32-wroom-da, esp32-devkit-v1 |
| Visual-only (ESP32 variants) | 🔲 Visual-only | 10+ boards |
| Visual-only (ESP8266 variants) | 🔲 Visual-only | 12+ boards |

## Frontend Features

| Feature | Status | Notes |
|---------|--------|-------|
| Board selection | ✅ Implemented | |
| Component palette | ✅ Implemented | |
| Canvas rendering | ✅ Implemented | |
| Wiring | ✅ Implemented | |
| Editor | ✅ Implemented | |
| Serial monitor | ✅ Implemented | |
| GPIO inspector | ✅ Implemented | |
| Example library | ✅ Implemented | |
| PWA support | ✅ Implemented | |
| Responsive layout | ✅ Implemented | |

## Security

| Feature | Status | Notes |
|---------|--------|-------|
| Loopback binding default | ✅ Tested | |
| CORS restriction | ✅ Tested | |
| Path traversal protection | ✅ Tested | |
| Command injection resistance | ✅ Implemented | Uses spawn with args array |
| Host execution disclosure | ⚠️ Partial | UI disclosure needed |
| Rate limiting | ❌ Unsupported | |
| Authentication | ❌ Unsupported | |