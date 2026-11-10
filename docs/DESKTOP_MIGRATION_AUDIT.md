# Desktop Migration Audit

## Migration Overview
Transformed ESP Simulator Studio from a browser/PWA application into a standalone Windows desktop application using Electron.

## Project Root
`C:\Users\hp\Desktop\esp_simulator`

## Files Created

### Electron Main Process
| File | Purpose |
|------|---------|
| `desktop/main/main.js` | Electron main process entry point |
| `desktop/main/window-manager.js` | BrowserWindow creation and management |
| `desktop/main/backend-manager.js` | Node.js backend server process management |
| `desktop/main/runtime-manager.js` | C++ compiler and Python interpreter detection |
| `desktop/main/storage-manager.js` | Project data persistence |
| `desktop/main/settings-manager.js` | Application settings management |
| `desktop/main/menu-manager.js` | Native application menus |
| `desktop/main/lifecycle-manager.js` | Application lifecycle coordination |
| `desktop/main/ipc/index.js` | IPC handler registration |
| `desktop/main/ipc/application-ipc.js` | App-level IPC (backend, status, window) |
| `desktop/main/ipc/project-ipc.js` | Project file IPC (save, load, import, export) |
| `desktop/main/ipc/runtime-ipc.js` | Runtime detection IPC |
| `desktop/main/ipc/dialog-ipc.js` | File/folder dialog IPC |

### Preload Layer
| File | Purpose |
|------|---------|
| `desktop/preload/preload.js` | Preload script entry point |
| `desktop/preload/desktop-api.js` | Secure contextBridge API exposure |

### Resources
| File | Purpose |
|------|---------|
| `desktop/resources/icons/icon.png` | Application icon (256x256) |
| `electron-builder.json` | electron-builder configuration |

### Scripts
| File | Purpose |
|------|---------|
| `run_as_app.cmd` | Windows desktop app launcher |
| `run_electron.bat` | Electron binary launcher |

## Files Modified

| File | Changes |
|------|---------|
| `package.json` | Added Electron scripts, changed main entry to desktop/main/main.js |
| `public/index.html` | Replaced CDN resources with local files, added Electron detection |
| `public/js/app.js` | Added desktop integration methods (initDesktop, saveProjectDesktop, etc.) |
| `public/css/tailwind.css` | New: Local Tailwind CSS (offline) |
| `public/js/jszip.min.js` | New: Local JSZip (offline) |

## Files Preserved (Not Modified)
| File | Reason |
|------|--------|
| `server.js` | Backend server unchanged, runs as child process |
| `public/js/app.js` core logic | Existing simulation logic preserved |
| `public/js/boards/`, `public/js/components/`, `public/js/engine/`, `public/js/ui/` | All frontend modules preserved |
| `backend/core/` | All C++/Python runtime code preserved |
| `test/` | All existing tests preserved |
| `docs/` (Stage 0/1 docs) | All existing documentation preserved |
| `public copy/`, `backend copy/`, `server copy.js`, etc. | Duplicates preserved per safety rules |

## Architecture Decisions

1. **Custom Protocol**: Uses `esp-simulator://` protocol to serve local assets securely instead of `file://`
2. **Backend Management**: `server.js` runs as a child process, started automatically on app launch
3. **Port Selection**: Ephemeral port allocation (falls back to 3001+ if 3000 is in use)
4. **Security**: contextIsolation=true, nodeIntegration=false, sandbox=true in renderer
5. **IPC**: ContextBridge exposes only validated channels to renderer
6. **Storage**: Uses Electron's `app.getPath('userData')` for project persistence
7. **Single Instance**: app.requestSingleInstanceLock() prevents multiple instances

## Backward Compatibility
- Browser/PWA mode remains fully functional
- `npm start` still works for development
- All existing API endpoints preserved
- All existing frontend functionality preserved