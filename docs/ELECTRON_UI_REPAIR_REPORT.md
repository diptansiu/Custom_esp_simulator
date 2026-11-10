# Electron UI Repair Report

## 1. Repair Objective

Restore the original ESP Simulator Studio interface inside the Windows Electron application without changing simulation behavior or redesigning the app.

## 2. Root Causes

See `docs/ELECTRON_UI_DIAGNOSTIC_REPORT.md`. Primary causes were missing Tailwind utilities (empty CSS file), stale service-worker cache, non-wrapping header layout, disabled Run button not re-enabled, invalid fast-runner transpile output, duplicate editor header, broken project serialization, and incomplete native-menu IPC bridging.

## 3. Fixes Applied

### Styling and assets
- Vendored Tailwind Play CDN build to `public/js/tailwind.js` (407,279 bytes, v3.4.17).
- Removed empty `public/css/tailwind.css`.
- Vendored fonts under `public/fonts/` and removed Google Fonts import.
- Added cache-busting query strings (`?v=2`) to CSS/JS/font assets.
- Updated `public/sw.js` to `esp-sim-v9` with network-first HTML and stale-while-revalidate assets.
- Server sends `Content-Security-Policy` including `'unsafe-eval'` and `Cache-Control: no-store` for HTML / `no-cache` for assets.

### Layout
- Made the header responsive (`min-h-14`, `flex-wrap`, gaps) and allowed it to grow instead of clipping.
- Hid secondary labels below `xl` (1280 px) and hid the preset dropdown below `xl`; Run/Stop always visible.
- Removed the duplicate HTML editor header; `CodeEditor` remains the single header/toolbar.
- Fixed fallback `header` CSS to `min-height` + `height: auto` + wrapping.
- Added `runButtonInViewport` to the layout probe and verified no panel overlaps.

### Run/Stop and fast runner
- `updateRunButtonUI()` now sets `runBtn.disabled = false`.
- Fixed `const int` transpile output in `arduino-interpreter.js`.
- Verified Run, Stop, runtime-error reset and native-compiler fallback all restore the Run button.

### Project management
- Fixed `exportProjectData()` to read `canvas.components` and `circuitNet.wires`.
- Sanitized project filenames in `storage-manager.js` (path-traversal protection).
- `project:import` now returns `projectData` so the renderer can load imported projects.
- Made the Project Manager desktop-aware (lists/saves/loads/deletes via IPC) while preserving browser localStorage fallback.
- Added `importProjectFromPath`, `exportProjectToPath`, `saveProjectAsDesktop`, `showRuntimeSettingsDialog`, `showPreferencesDialog`.

### Native menus and IPC
- Added all `menu-*` channels to the preload whitelist.
- Exposed `showInfo` / `showError` in the preload.
- Wired every native menu action in `initDesktop()` (new/open/save/save-as/import/export/simulation start/stop/reset/runtime settings/preferences/serial monitor/GPIO inspector).
- Verified end-to-end with the Node inspector and CDP.

### Packaging
- Removed invalid `directories.app` and `publisherName: null` from `electron-builder.json`.
- Added `electronDist: "node_modules/electron/dist"` and `asar: false`.
- Pointed the window icon to `desktop/resources/icons/icon.png` (256x256).
- Generated `desktop/resources/icons/icon.ico` for NSIS installer/uninstaller icons.
- Set NSIS `artifactName` to `ESP-Simulator-Studio-Setup-${arch}.exe`.

### Diagnostics
- Added `ESP_SIM_WINDOW_SIZE`, `ESP_SIM_LAYOUT_PROBE`, `ESP_SIM_CAPTURE_PATH` test-only hooks (inert unless set).
- Added layout probe metrics and CDP smoke tests.

## 4. Files Modified

- `public/index.html`
- `public/css/style.css`
- `public/js/app.js`
- `public/js/engine/arduino-interpreter.js`
- `public/sw.js`
- `server.js` (headers/CSP/data dir, already present)
- `desktop/main/window-manager.js`
- `desktop/main/backend-manager.js` (already present)
- `desktop/main/main.js` (already present)
- `desktop/main/menu-manager.js`
- `desktop/main/storage-manager.js`
- `desktop/main/ipc/project-ipc.js`
- `desktop/preload/preload.js`
- `electron-builder.json`
- `desktop/resources/icons/icon.ico` (new)

## 5. Verification

### Automated
- `node --check` on all modified JS files: PASS.
- `node --test`: 22 total, 17 passed, 5 skipped, 0 failed. Skipped tests are host-compiler/interpreter dependent, not defects.

### Layout
- Dev Electron tested at 1000x700, 1280x720, 1366x768, 1920x1080, 2560x1440: no horizontal/vertical overflow, no panel overlaps, Run button visible.
- Packaged installed app layout probe: viewport 1240x754, document 1240x754, header 91 px, no overlaps, Run button visible.
- Portable app layout probe: identical.

### Packaged apps
- NSIS installer: `dist/ESP-Simulator-Studio-Setup-x64.exe` (88,081,567 bytes) built and installed successfully.
- Portable: `dist/ESP-Simulator-Studio-Portable-x64.exe` (80,749,206 bytes) launched successfully.
- Unpacked: `dist/win-unpacked/ESP Simulator Studio.exe` verified.
- CDP smoke on installed and portable apps: Tailwind loaded, `window.desktopAPI` present, correct CSP, all modals hidden at startup, panels open/close, Serial/GPIO tabs switch, fast runner runs and grows serial output, Stop works, runtime error resets button, native fallback without compiler resets button.
- Native menus verified end-to-end: Open Project, Simulation Start/Stop, Tools GPIO Inspector/Serial Monitor, File Save Project.
- Graceful close: `CloseMainWindow()` stops all processes and frees port 3000.
- Persistence: `Desktop_Persistence_Test.json` remained in `%APPDATA%\ESP Simulator Studio\projects` across uninstall/reinstall and reappeared in the Project Manager.

### Browser/PWA
- Browser tab verified: Tailwind loaded, no desktop API (expected), fast runner runs/stops, runtime error resets, panels work, no overflow at the tested viewport.

## 6. Remaining Issues

1. No code signing; Windows SmartScreen may warn (documented limitation).
2. No bundled C++ compiler or Python interpreter (host dependencies).
3. No auto-update mechanism.
4. Packaged-window screenshot capture can be blocked by OS window occlusion; dev-window screenshots and CDP/layout metrics were used as evidence instead.
5. The preset dropdown is hidden below 1280 px; presets remain available through the Examples Library modal.
6. `menu-runtime-settings` and `menu-app-preferences` show an informational dialog rather than a full settings panel; runtime detection is automatic.

## 7. Final Status

**COMPLETE** (for the emergency UI repair scope). The development and packaged Windows applications render and operate correctly; all required artifacts exist and were executed successfully.