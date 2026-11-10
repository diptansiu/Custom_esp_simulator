# Electron Asset Loading

## 1. Strategy

The desktop renderer is served from the backend HTTP origin (`http://127.0.0.1:<port>/index.html`) rather than from `file://` or a custom protocol. This guarantees exact parity with the browser/PWA version and avoids relative-URL/module resolution issues.

## 2. Served Resources

- `server.js` serves `public/` as static files.
- `public/index.html` is the single frontend entry point.
- Assets referenced by `index.html`:
  - `public/js/tailwind.js?v=2` (vendored Tailwind Play CDN build, 407,279 bytes, offline)
  - `public/js/jszip.min.js?v=2`
  - `public/fonts/fonts.css?v=2` + local font files
  - `public/css/style.css?v=2`
  - `public/js/app.js?v=2` (ES module)
  - `public/manifest.json`, icons

## 3. Content Security Policy

The server emits:

```
default-src 'self';
script-src 'self' 'unsafe-inline' 'unsafe-eval';
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob:;
font-src 'self' data:;
connect-src 'self';
media-src 'self' blob: data:;
worker-src 'self' blob:;
object-src 'none';
base-uri 'self';
form-action 'self';
frame-ancestors 'none'
```

`'unsafe-eval'` is a deliberate, documented exception required by the in-browser fast runner (`new Function`). Remote scripts remain blocked by `'self'`.

## 4. Cache Policy

- HTML responses: `Cache-Control: no-store`.
- Other assets: `Cache-Control: no-cache` (revalidate).
- Service worker `esp-sim-v9` uses network-first for navigations/HTML and stale-while-revalidate for static assets.
- Old caches (`esp-sim-v8`) are deleted on activation.
- Asset URLs are cache-busted with `?v=2`.

## 5. Offline Operation

All core UI assets are local. No external CDN is required for styling, fonts, JSZip or Tailwind. External links (documentation, remote connect) remain network-dependent by design.

## 6. Packaged Paths

The unpacked/packaged app keeps one canonical frontend location:

```
resources/app/
  server.js
  package.json
  public/**
  backend/**
  desktop/**
```

`electron-builder.json` uses `"asar": false` so the backend child process can execute `server.js` and serve `public/` as plain files. `electronDist` points at the locally installed Electron 33.4.11.

## 7. Verification

- Packaged app serves `index.html` with the correct CSP and `no-store`.
- Tailwind reports loaded in both dev and packaged renderers.
- `window.desktopAPI` is present only in Electron.
- No failed resource requests in DevTools for CSS, fonts, JS or icons.