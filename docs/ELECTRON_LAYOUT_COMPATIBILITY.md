# Electron Layout Compatibility

## 1. Window Configuration

- Default size: 1250 x 850.
- Minimum size: 900 x 600.
- Frameless/transparent only in app mode; standard frame in development.
- Zoom factor is left at the Chromium default; high-DPI (1.25) is handled by the renderer.
- Test-only `ESP_SIM_WINDOW_SIZE` override supports automated multi-resolution checks.

## 2. Tested Viewports

| Requested window | CSS viewport | DPR | Document size | Overflow | Header height | Run button visible |
|---|---|---|---|---|---|---|
| 1000 x 700 | 986 x 642 | 1.25 | 986 x 642 | none | 56-156 (wraps) | Yes |
| 1280 x 720 | 1266 x 658 | 1.25 | 1266 x 658 | none | 56-123 | Yes |
| 1366 x 768 | 1356 x 706 | 1.25 | 1356 x 706 | none | 56-127 | Yes |
| 1920 x 1080 | 1522 x 754 | 1.25 | 1522 x 754 | none | 91 | Yes |
| 2560 x 1440 | 1522 x 754 | 1.25 | 1522 x 754 | none | 91 | Yes |

The screen's work area clamps larger requests to ~1522 x 754 CSS pixels at 125% DPI, so 1920x1080 and 2560x1440 report the same clamped size.

## 3. Layout Invariants (Verified)

- No horizontal overflow (`scrollWidth <= innerWidth`).
- No vertical overflow (`scrollHeight <= innerHeight`).
- No overlaps between palette, workbench and editor panels.
- Run/Stop button remains inside the viewport at every tested size.
- All utility modals are hidden at startup.
- Tailwind and `window.desktopAPI` (Electron only) are loaded.

## 4. Responsive Behavior

- Header uses `flex-wrap` with gaps and grows via `min-height: 56px; height: auto`.
- Secondary action labels are hidden below `xl` (1280 px); icons remain.
- The preset dropdown is hidden below `xl`; presets remain available via the Examples Library modal.
- The main workspace keeps three columns (palette / workbench / editor) with fixed-ish widths and flexible center.

## 5. High-DPI

- Tested at 125% display scaling (DPR 1.25).
- No zoom-factor overrides; Chromium handles device scaling.
- Icons and SVGs preserve their intended dimensions.

## 6. Packaged Verification

- Installed app layout probe: `docs/screenshots/packaged-installed-layout.json` (1240 x 754, no overflow, no overlaps, Run visible).
- Portable app layout probe: `docs/screenshots/packaged-portable-layout.json` (identical).

## 7. Known Constraint

- The `ESP_SIM_CAPTURE_PATH` screenshot hook can produce 0-byte files when the OS window is occluded (`document.visibilityState === "hidden"`). Layout metrics and CDP smoke tests were used as the objective evidence instead.<|end|>