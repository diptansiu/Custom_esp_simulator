# ESP Simulator Studio — Stage 2 Known Limitations

**Date:** 2026-11-08  
**Stage:** 2 — Core Architecture Modernization

## 1. Architecture Limitations

| # | Limitation | Description | Severity | Workaround |
|---|------------|-------------|----------|------------|
| 1 | Platform adapter layer not fully implemented | The platform adapter interfaces are designed but the Electron/Browser adapters are not yet created. Existing `desktop/preload/preload.js` and `app.js` direct calls remain in place. | Medium | Existing code continues to work; adapters planned for future incremental migration |
| 2 | Backend not modularized | `server.js` remains as a single God file handling HTTP, API, session management, compilation, and SSE. Shared core validation is not yet used by the backend. | Medium | Backend continues to work as-is; modularization planned for future |
| 3 | Execution engine adapters not implemented | The `ExecutionEngine` interface is defined but existing engines (ArduinoInterpreter, RealCodeRunner, etc.) are not yet wrapped by adapters. | Medium | Existing engines continue to work directly; adapter pattern planned for future |
| 4 | Shared core not fully integrated into app.js | `app.js` imports shared core for validation but still uses direct COMPONENTS/BOARDS imports for most operations. | Low | Incremental integration planned |
| 5 | No build step/bundler | Shared core ES modules are copied to `public/js/shared/` for frontend use. No bundling or minification. | Low | Files are served directly; acceptable for current scale |

## 2. Environment Limitations (Pre-existing)

| # | Limitation | Description | Severity |
|---|------------|-------------|----------|
| 6 | C++ compiler standard library headers missing | `clang++` is installed but Windows SDK/MSVC headers are not available, causing `#include <iostream>` to fail. | High | Install Visual Studio Build Tools or MinGW-w64 |
| 7 | Python interpreter not detected | `python3`/`python` may not be available on the system. | Medium | Install Python 3 |
| 8 | No code signing | Installer is unsigned; Windows SmartScreen may warn. | Low | Unavoidable for unsigned development builds |
| 9 | No auto-updates | Updates must be downloaded and installed manually. | Low | Planned for future |
| 10 | Windows x64 only | No x86, ARM, or other platform builds. | Low | Target platform is Windows x64 |

## 3. Test Limitations

| # | Limitation | Description |
|---|------------|-------------|
| 11 | Tests require backend server | Automated tests (`node --test`) require the backend server to be running on port 3000. Cannot run as standalone unit tests. |
| 12 | C++ smoke test environment-dependent | The C++ smoke test passes only if clang++ with Windows SDK headers is installed. |
| 13 | No frontend unit tests | No automated tests for UI components, canvas rendering, or component placement. |

## 4. Resolved Limitations (from Stage 1)

| # | Limitation | Resolution |
|---|------------|------------|
| — | Empty tailwind.css causing broken styling | Replaced with vendored Tailwind build |
| — | Modals visible at startup | Fixed Tailwind utility classes |
| — | Run button disabled after start | Fixed `updateRunButtonUI()` to clear `disabled` |
| — | Fast runner `const int` transpile bug | Fixed in arduino-interpreter.js |
| — | Stale service worker cache | Updated to `esp-sim-v9` with network-first strategy |
| — | Project save/export failure | Fixed `exportProjectData()` to use correct canvas/circuitNet references |
| — | Native menu IPC not bridged | Added `menu-*` channels to preload and handlers in app.js |
| — | NSIS build failed (PNG icon) | Generated `icon.ico` for NSIS installer |
| — | Invalid electron-builder config | Removed `publisherName: null` and `directories.app` |
| — | Project persistence only in localStorage | Added desktop IPC-based project save/load via StorageManager |
