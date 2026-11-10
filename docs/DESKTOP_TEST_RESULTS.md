# Desktop Test Results

## Automated Tests (`node --test`)

- Total: 22
- Passed: 17
- Failed: 0
- Skipped: 5 (host C++ compiler / Python interpreter not installed)

Skipped tests are environment limitations, not code defects.

## Syntax Checks

- `node --check` on all `public/**/*.js` and `desktop/**/*.js`: PASS.

## Development Electron Verification

- App launches and backend starts automatically on 127.0.0.1:3000.
- Stitch design system applied (design-tokens.css, local Tailwind, responsive layout).
- Tailwind loaded, desktop API present, correct CSP.
- All utility modals hidden at startup.
- Panels (Projects, Remote, Examples, Libraries) open/close.
- Serial/GPIO tabs switch.
- Fast runner runs and serial output grows; Stop works.
- Runtime error resets the Run button.
- Native fallback without compiler resets the Run button.
- Layout tested at 1000x700, 1280x720, 1366x768, and screen-clamped 1522x754: no overflow, no panel overlaps, Run button visible.
- Stitch design system colors verified (surface #011525, primary #00d5ff, etc.).

## Packaged Verification

### NSIS installer
- Artifact: `dist/ESP-Simulator-Studio-Setup-x64.exe` (88,142,605 bytes).
- Build: PASS (electron-builder --win --x64, electronDist=node_modules/electron/dist, asar=false).
- Silent install: Supported via `/S /D=<dir>`.
- Packaged app launches with backend auto-start on port 3000.
- Stitch design system rendered correctly in packaged window.

### Portable executable
- Artifact: `dist/ESP-Simulator-Studio-Portable-x64.exe` (80,793,745 bytes).
- Build: PASS (included in electron-builder --win --x64).
- Launch: PASS.

### Unpacked app
- Artifact: `dist/win-unpacked/ESP Simulator Studio.exe` (189,119,488 bytes).
- Build: PASS (`npm run app:pack` / `electron-builder --dir`).
- Launch and CDP smoke: PASS.

## Browser/PWA Verification

- Tailwind loaded, no `window.desktopAPI` (expected).
- Fast runner runs/stops, runtime error resets.
- Panels open/close, no overflow at tested viewport.