# Electron UI Diagnostic Report

## 1. Scope

This report documents the emergency UI repair performed for ESP Simulator Studio's Electron desktop build. The browser/PWA version remained the visual and functional reference throughout.

## 2. Original Defects Observed

1. **Broken styling**: utility classes were missing because `public/css/tailwind.css` was an empty file (0 bytes) while `index.html` referenced it. Buttons, inputs, modals and panels fell back to browser defaults.
2. **Modals visible at startup**: because the `hidden` utility class did not exist, `proj-modal`, `remote-modal`, `ex-lib-modal` and `libs-modal` rendered on top of the workspace.
3. **Oversized/overflowing toolbar**: the header used a fixed `h-14` height with a non-wrapping toolbar. At typical widths (1000–1366 px) the Run/Stop button and other actions overflowed the viewport and became unreachable.
4. **Duplicate code-editor header**: both `index.html` and `CodeEditor` rendered an editor header, causing duplicated controls and inconsistent layout.
5. **Fast runner did not stop**: `runSimulation()` disabled `btn-run-sim` (`disabled = true`) while starting, but `updateRunButtonUI()` never cleared `disabled`. In browser mode the button stayed disabled, so Stop clicks were ignored.
6. **Fast-runner transpile failure**: the transpiler emitted `const int`, which is invalid JavaScript, so the in-browser runner threw before executing user code.
7. **Stale service worker/CSP**: the old `esp-sim-v8` service worker served a cached `index.html` with an older Content-Security-Policy, so even after the server sent `'unsafe-eval'`, the renderer still blocked `new Function`.
8. **Project save/export failure**: `exportProjectData()` called `this.canvas.getComponents()` / `this.canvas.getWires()`, which do not exist, so Save/Export threw and showed an alert.
9. **Menu IPC not bridged**: preload's `VALID_CHANNELS` did not include `menu-*` channels, so native menu actions could not reach the renderer.
10. **Packaged icon path**: `electron-builder.json` referenced `desktop/resources/icons/icon.png` for NSIS `installerIcon`/`uninstallerIcon`, which NSIS rejects (requires `.ico`).
11. **Invalid builder config**: `directories.app: "."` and `win.publisherName: null` violated the electron-builder schema.
12. **Preload channel gap**: `app:show-info` / `app:show-error` were handled in main but not exposed by the preload.

## 3. Diagnostic Methods Used

- Chromium DevTools via Chrome DevTools Protocol (CDP) against both dev and packaged renderers.
- `ESP_SIM_LAYOUT_PROBE` geometry dump (viewport, document size, header, panels, overlaps, Run-button visibility).
- `ESP_SIM_CAPTURE_PATH` screenshot capture (successful for dev windows; packaged-window capture limited by OS window occlusion).
- `node --test` (22 tests, 17 passed, 5 skipped, 0 failed).
- `node --check` on all modified JavaScript files.
- Real packaged-app smoke tests (NSIS install, portable exe, uninstall/reinstall persistence).

## 4. Root-Cause Summary

| Symptom | Root cause | Fix location |
|---|---|---|
| Default browser styling, visible modals | Empty `tailwind.css`; Tailwind utilities absent | `public/index.html`, `public/css/style.css`, vendored `public/js/tailwind.js` |
| Stale CSP in browser | `esp-sim-v8` SW cached old HTML | `public/sw.js` (v9, network-first shell) |
| Stop ignored in browser | `btn-run-sim.disabled` never cleared | `public/js/app.js` `updateRunButtonUI()` |
| Fast runner threw | `const int` transpile output | `public/js/engine/arduino-interpreter.js` |
| Toolbar overflow | Fixed 56 px header, non-wrapping flex | `public/index.html`, `public/css/style.css` |
| Duplicate editor header | Two header implementations | `public/index.html`, `public/js/ui/editor.js` |
| Save/Export failed | Non-existent canvas getters | `public/js/app.js` `exportProjectData()` |
| Native menus no-op | Missing preload channels/handlers | `desktop/preload/preload.js`, `public/js/app.js` |
| NSIS build failed | PNG used as NSIS icon | `desktop/resources/icons/icon.ico`, `electron-builder.json` |
| Builder schema error | Invalid `directories.app` / `publisherName: null` | `electron-builder.json` |

## 5. Verified Non-Causes

- CSP already permits `'unsafe-eval'` on the server; the failure was stale cached HTML.
- Fonts and Tailwind are now fully local; no CDN dependency remains in `index.html`.
- The backend binds to `127.0.0.1` only and starts automatically in the packaged app.
- No orphan backend processes remain after graceful close (verified via `CloseMainWindow()` and port 3000 checks).
- The browser/PWA path still serves the same frontend files unchanged in behavior.
- No simulation engine logic was changed; only UI, asset loading, project serialization and IPC bridge were touched.
- All 22 automated tests pass (5 skipped due to missing host compilers/interpreters, not defects).
- The packaged NSIS installer and portable executable were built and launched successfully.
- Project data persists in `%APPDATA%\ESP Simulator Studio\` across uninstall/reinstall (verified).