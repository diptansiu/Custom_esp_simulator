# Desktop Security

## Security Model

The ESP Simulator Studio desktop application follows a multi-layered security architecture:

### 1. Renderer Process Sandbox

| Setting | Value | Purpose |
|---------|-------|---------|
| `contextIsolation` | `true` | Isolates preload scripts from renderer |
| `nodeIntegration` | `false` | Prevents direct Node.js access in renderer |
| `sandbox` | `true` | Chromium sandbox for renderer |
| `webSecurity` | `true` | Enforces same-origin policy |
| `allowRunningInsecureContent` | `false` | Blocks mixed content |

### 2. Preload Layer (ContextBridge)

Only specific, validated IPC channels are exposed to the renderer:

```
VALID_CHANNELS = {
  'app:get-status', 'backend:start', 'backend:stop',
  'runtime:get-status', 'runtime:validate-cpp', 'runtime:validate-python',
  'runtime:save-config', 'runtime:get-config', 'runtime:detect',
  'app:open-external', 'app:show-error', 'app:show-info',
  'window:get-state', 'window:set-state', 'window:focus',
  'project:get-all', 'project:save', 'project:load', 'project:delete',
  'project:import', 'project:export', 'storage:get-paths',
  'dialog:open-file', 'dialog:save-file', 'dialog:open-folder'
}
```

- No unrestricted `ipcRenderer` exposure
- No `fs`, `child_process`, `shell`, or `process` access
- Channel validation on every IPC call
- No arbitrary path operations exposed

### 3. Custom Protocol (`esp-simulator://`)

- Serves frontend assets from the `public/` directory only
- Path traversal protection: normalized paths must start with `PUBLIC_DIR`
- MIME type validation for served files
- SPA fallback to `index.html` for unknown routes

### 4. Backend Server Security

| Setting | Value |
|---------|-------|
| Bind address | `127.0.0.1` (loopback only) |
| Port | Ephemeral (configurable) |
| CORS | Same-origin only (no wildcard) |
| Body size limit | 1 MB |
| External exposure | None |

### 5. IPC Validation

- All IPC channels validated against `VALID_CHANNELS`
- Sender validation (only main process can initiate)
- Argument validation on all handlers
- No arbitrary command execution exposed

## Security Limitations

1. **Host code execution** - C++ and Python code runs with user permissions (not sandboxed)
2. **No rate limiting** - API endpoints have no request rate limits
3. **No authentication** - Desktop app is single-user, local only
4. **No code signing** - Unsigned development build
5. **No auto-updates** - Updates must be applied manually

## Recommendations

1. Do not run untrusted C++ or Python code
2. Keep the application on trusted networks only
3. Use the desktop settings UI to verify runtime executables
4. Review code before executing in native mode
5. Application is designed for local, single-user use