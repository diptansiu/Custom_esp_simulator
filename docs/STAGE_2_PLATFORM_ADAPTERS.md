# ESP Simulator Studio — Stage 2 Platform Adapters

**Date:** 2026-11-08  
**Stage:** 2 — Core Architecture Modernization

## 1. Platform Adapter Architecture

Platform adapters provide environment-specific implementations while keeping the shared core platform-independent. The core does not import Electron, browser DOM, or Node.js-specific modules directly.

## 2. Adapter Categories

### 2.1 Electron Platform Adapter (`public/js/platform/electron/`)

| Module | Purpose |
|--------|---------|
| `ipc-adapter.js` | Secure IPC communication via contextBridge |
| `dialog-adapter.js` | Native file dialogs (open/save folder) |
| `storage-adapter.js` | Electron userData directory storage |

**Planned interface:**
```javascript
class ElectronAdapter {
  getStatus() → Promise<AppStatus>
  startBackend() → Promise<{success, url}>
  stopBackend() → Promise<void>
  getRuntimeStatus() → Promise<RuntimeStatus>
  saveProject(projectData) → Promise<{success, filename}>
  loadProject(filename) → Promise<{success, project}>
  deleteProject(filename) → Promise<{success}>
  importProject(filePath) → Promise<{success, projectData}>
  exportProject(filePath, projectData) → Promise<{success, path}>
  getStoragePaths() → Promise<StoragePaths>
  openFileDialog(options) → Promise<DialogResult>
  saveFileDialog(options) → Promise<DialogResult>
  openFolderDialog(options) → Promise<DialogResult>
  openExternal(url) → Promise<void>
  showInfo(title, message) → Promise<void>
  showError(title, message) → Promise<void>
  on(channel, listener) → void
  off(channel, listener) → void
}
```

**Current state:** The existing `desktop/preload/preload.js` implements this API surface via contextBridge. The Stage 2 platform adapter would wrap this existing implementation.

### 2.2 Browser Platform Adapter (`public/js/platform/browser/`)

| Module | Purpose |
|--------|---------|
| `storage-adapter.js` | Browser localStorage persistence |
| `fetch-adapter.js` | Browser fetch API wrapper |

**Planned interface:**
```javascript
class BrowserAdapter {
  getStatus() → Promise<AppStatus>
  saveProject(projectData) → Promise<{success, filename}> (download blob)
  loadProject(file) → Promise<{success, project}> (FileReader)
  deleteProject(filename) → Promise<{success}>
  exportProject(projectData) → Promise<{success, data}> (download blob)
  importProject(file) → Promise<{success, projectData}> (FileReader)
}
```

### 2.3 PWA Platform Adapter (`public/js/platform/pwa/`)

| Module | Purpose |
|--------|---------|
| `sw-adapter.js` | Service worker integration |

**Planned interface:**
```javascript
class PwaAdapter {
  registerServiceWorker() → Promise<Registration>
  checkForUpdates() → Promise<boolean>
  isOnline() → boolean
}
```

## 3. Adapter Registration

Platform adapters are registered at application startup:

```javascript
// Desktop (Electron)
const adapter = new ElectronAdapter(preloadAPI);
const services = createServices({ adapter: adapter });

// Browser
const adapter = new BrowserAdapter(localStorage, fetch);
const services = createServices({ adapter: adapter });
```

## 4. Current State

The platform adapter layer is **planned but not yet fully implemented**. The existing implementation uses:
- `desktop/preload/preload.js` — Sandboxed contextBridge API (Electron only)
- `public/js/app.js` `isDesktop()` check — Detects Electron vs browser
- Direct `window.desktopAPI` calls in app.js

## 5. Migration Path

1. Create platform adapter interface contracts in `src/shared/core/contracts/`
2. Implement Electron adapter wrapping existing preload API
3. Implement Browser adapter using localStorage/fetch
4. Update `app.js` to use adapter instead of direct `window.desktopAPI` calls
5. Ensure browser/PWA mode continues to work without Electron

## 6. Dependency Rule

Platform adapters depend on:
- Shared core (Layer 1)
- Infrastructure (Layer 3)

Platform adapters do NOT depend on:
- Application services (Layer 2)
- Presentation (Layer 5)
- Other platform adapters
