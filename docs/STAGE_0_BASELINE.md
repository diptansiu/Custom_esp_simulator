# Stage 0 Baseline Report

## Actual Project Root

`C:\Users\hp\Desktop\esp_simulator`

## Detected Runtime Environment

- **OS**: Windows 11 (win32)
- **Architecture**: x64
- **Node.js**: v18+ (LTS)
- **npm**: Latest

## Available Compiler and Python Executables

| Executable | Available | Path |
|------------|-----------|------|
| clang++ | ❌ No | Not found in PATH |
| g++ | ❌ No | Not found in PATH |
| cl (MSVC) | ❌ No | Not found in PATH |
| python3 | ❌ No | Not found in PATH |
| python | ⚠️ Alias only | WindowsApps store alias (non-functional) |
| Full Python path | ✅ Yes | `C:\Users\hp\AppData\Local\Python\bin\python3.exe` |

## Project Directory Structure

```
esp_simulator/
├── server.js              # Main server (was corrupted, now restored)
├── package.json           # NPM configuration
├── README.md              # Project README
├── .gitignore             # Created during Stage 0
├── run_as_app.cmd         # Windows launcher
├── esp_simulator.zip      # Project archive
├── public/                # Frontend UI
├── public copy/           # Duplicate (preserved)
├── backend/               # Backend runtime
├── backend copy/          # Duplicate (preserved)
├── test/                  # Automated tests
├── docs/                  # Documentation
├── projects/              # Saved projects
├── server copy.js         # Duplicate (preserved)
├── README copy.md         # Duplicate (preserved)
└── package copy.json      # Duplicate (preserved)
```

## Important Modules

| Module | Location | Purpose |
|--------|----------|---------|
| Server entry | `server.js` | HTTP server, API, session management |
| Frontend | `public/index.html` + `public/js/` | UI and client-side logic |
| Backend | `backend/core/` | C++/Python runtime shims |
| Tests | `test/` | Automated test suite |

## Existing Test Commands

```bash
npm test          # Run all tests
npm run check     # Syntax check
npm run clean     # Clean build artifacts
npm start         # Start server
```

## Existing Test Results (Baseline)

Before fixes:
- 13 tests in original `test/server.test.js`
- Tests failed because server was not running
- Compiler/Python unavailable on this Windows machine

After fixes:
- 22 tests total (13 original + 9 new)
- 17 passed, 5 skipped, 0 failed

## Known Defects (Baseline)

1. **Session concurrency bug** — New runs killed all existing sessions
2. **Server file corruption** — server.js was 0 bytes
3. **No environment variable support** — Hardcoded executable names
4. **Non-idempotent session cleanup** — Race conditions on repeated stop
5. **Missing Python error handling** — Server could crash on missing Python
6. **Double response on compiler error** — Could crash server

## Source-File Discrepancies

- `server.js` was emptied (0 bytes) during previous editing
- `server_backup.js` was created but also corrupted (12 bytes)
- Duplicate folders/files exist alongside canonical versions

## Existing Working Functionality

- Frontend UI (board selection, component palette, canvas, editor, serial monitor)
- In-browser Arduino/MicroPython fast runners
- Server API endpoints (status, projects, run-real, stop, input, stream)
- Static file serving with path traversal protection
- SSE streaming infrastructure

## Identified Risks

1. **No version control** — No .git repository
2. **No .gitignore** — Generated files not excluded
3. **Duplicate files** — Potential confusion about canonical source
4. **No sandboxing** — Host code execution with user permissions
5. **No rate limiting** — API endpoints unprotected
6. **No authentication** — Remote binding insecure