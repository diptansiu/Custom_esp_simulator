# Desktop Known Limitations

## Build & Packaging

1. **No code signing** - Installer is unsigned; Windows SmartScreen may warn users.
2. **No auto-updates** - Updates must be downloaded and installed manually.
3. **Windows x64 only** - No x86, ARM, or other platform builds.
4. **Large artifact size** - Electron runtime adds ~80 MB to the application.

## Runtime Dependencies

5. **C++ compiler not bundled** - `clang++`, `g++`, or `cl.exe` must be installed separately.
6. **Python interpreter not bundled** - `python3` or `python` must be installed separately.
7. **No sandboxing for native code** - Host C++/Python execution runs with user permissions.
8. **Native execution is not ESP firmware** - Host compatibility mode only.

## Application Limitations

9. **Single-user desktop app** - No multi-user or network collaboration.
10. **No remote session support in desktop mode** - Remote Connect feature requires an external server.
11. **No automatic browser data migration** - Users must manually export/import projects.
12. **No rate limiting** - API endpoints are not rate-limited.

## Known Issues

13. **Packaged-window screenshot capture may be blocked** - OS window occlusion can make `document.visibilityState === "hidden"`; layout metrics and CDP smoke tests are used as evidence.
14. **Startup time** - Electron apps have slower cold start than native applications.
15. **Preset dropdown hidden below 1280 px** - Presets remain available via the Examples Library modal.

## Resolved Limitations

- Session concurrency bug fixed.
- Offline support (local Tailwind CSS and JSZip).
- Project persistence (Electron userData directory).
- Secure IPC (contextBridge with channel validation).
- Renderer sandboxing (sandbox: true, nodeIntegration: false).
- HTTP-origin frontend loading with restrictive CSP.
- Automatic backend startup and shutdown.
- Runtime detection and configuration UI.
- NSIS installer and portable executable built and verified.
- Native menu IPC bridge.
- Project save/export serialization.