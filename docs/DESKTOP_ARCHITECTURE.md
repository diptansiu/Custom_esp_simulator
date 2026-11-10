# Desktop Architecture

## System Overview

```
ESP SIMULATOR STUDIO
    |
    |-- Electron Main Process (desktop/main/main.js)
    |       |-- Application Lifecycle (lifecycle-manager.js)
    |       |-- Window Manager (window-manager.js)
    |       |-- Backend Manager (backend-manager.js)
    |       |-- Runtime Manager (runtime-manager.js)
    |       |-- Storage Manager (storage-manager.js)
    |       |-- Menu Manager (menu-manager.js)
    |       |-- Settings Manager (settings-manager.js)
    |       |-- IPC Controller (ipc/)
    |
    |-- Secure Preload Layer (desktop/preload/)
    |       |-- preload.js
    |       |-- desktop-api.js (contextBridge)
    |
    |-- Existing Frontend (public/)
    |       |-- index.html (served via esp-simulator:// protocol)
    |       |-- js/app.js (main UI coordinator)
    |       |-- js/boards/, js/components/, js/engine/, js/ui/
    |
    |-- Managed Backend (server.js)
    |       |-- HTTP API on ephemeral loopback port
    |       |-- Session Manager
    |       |-- C++ Runtime (clang++)
    |       |-- Python Runtime (python3)
    |       |-- SSE streaming
    |
    |-- User Data (%APPDATA%\ESP Simulator Studio\)
            |-- projects/
            |-- settings.json
            |-- backups/
            |-- temp/
```

## Process Model

### Main Process (Node.js + Electron)
- Runs the Electron application lifecycle
- Manages BrowserWindow creation and state
- Spawns and manages the backend server.js child process
- Handles all IPC requests from renderer
- Manages native menus and dialogs
- Coordinates application shutdown and cleanup

### Renderer Process (Chromium)
- Runs the existing ESP Simulator frontend
- contextIsolation: true, nodeIntegration: false, sandbox: true
- Communicates with main process via contextBridge API
- No direct access to Node.js modules or filesystem

### Backend Process (Node.js - server.js)
- Runs as a child process of the main process
- Binds to 127.0.0.1 on an ephemeral port
- Provides HTTP API for compilation and execution
- Manages simulation sessions and SSE streams
- Automatically cleaned up on application shutdown

## Communication Flow

```
Renderer (UI) --> contextBridge --> ipcRenderer --> ipcMain --> Main Process
                                              |
                                              v
                                      Backend Manager (child process)
                                              |
                                              v
                                      server.js (HTTP API)
                                              |
                                              v
                                      Compiler/Python executables
```

## Security Boundaries

1. **Renderer**: Sandboxed, no Node.js access, limited IPC channels
2. **Preload**: ContextBridge exposes only validated, specific functions
3. **Main Process**: Full Node.js access, manages all sensitive operations
4. **Backend**: Loopback-only binding, ephemeral port, no external exposure
5. **Protocol**: Custom `esp-simulator://` scheme with path traversal protection

## Data Flow

1. User interacts with frontend UI
2. Frontend calls `window.desktopAPI.method()` (contextBridge)
3. IPC message sent to main process via validated channel
4. Main process validates and executes the request
5. For file operations: native dialogs shown, file read/written via StorageManager
6. For backend operations: HTTP request to internal server.js process
7. Results returned through IPC to renderer

## Resource Locations

| Resource | Location | Type |
|----------|----------|------|
| Application code | Installation directory | Read-only |
| User projects | %APPDATA%\ESP Simulator Studio\projects\ | Read-write |
| Application settings | %APPDATA%\ESP Simulator Studio\settings.json | Read-write |
| Backups | %APPDATA%\ESP Simulator Studio\backups\ | Read-write |
| Temp files | %APPDATA%\ESP Simulator Studio\temp\ | Read-write |
| Electron runtime | Installation directory | Read-only |