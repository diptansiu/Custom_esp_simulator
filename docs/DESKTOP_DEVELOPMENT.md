# Desktop Development Guide

## Prerequisites

- Node.js >= 18.0.0
- npm
- Electron binary (auto-downloaded on install, or cached locally)

## Installation

```powershell
cd "C:\Users\hp\Desktop\esp_simulator"
npm install
```

## Development Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start browser/PWA server (port 3000) |
| `npm run dev` | Start server with custom port |
| `npm test` | Run automated tests |
| `npm run check` | Syntax check all source files |
| `npm run clean` | Clean backend build artifacts |
| `npm run app:dev` | Launch Electron desktop app in dev mode |
| `npm run app:check` | Syntax check Electron main process |
| `npm run app:pack` | Create unpacked Windows build |
| `npm run app:build` | Build NSIS installer (x64) |
| `npm run app:build:win` | Build Windows installer (x64) |
| `npm run app:build:portable` | Build portable executable (x64) |
| `npm run app:build:all` | Build all Windows artifacts |

## Desktop Development Workflow

1. Install dependencies: `npm install`
2. Launch desktop app: `npm run app:dev`
3. Make changes to source files
4. Electron auto-reloads (if using electron-reload) or restart manually
5. Run tests: `npm run app:test`
6. Syntax check: `npm run app:check`

## Project Structure for Development

```
esp_simulator/
├── server.js              # Backend server (unchanged)
├── package.json           # Updated with Electron scripts
├── public/                # Frontend (unchanged + local CDN replacements)
├── backend/               # Backend runtime (unchanged)
├── desktop/               # NEW: Electron desktop code
│   ├── main/
│   │   ├── main.js
│   │   ├── window-manager.js
│   │   ├── backend-manager.js
│   │   ├── runtime-manager.js
│   │   ├── storage-manager.js
│   │   ├── settings-manager.js
│   │   ├── menu-manager.js
│   │   ├── lifecycle-manager.js
│   │   └── ipc/
│   ├── preload/
│   │   ├── preload.js
│   │   └── desktop-api.js
│   └── resources/
│       └── icons/
│           └── icon.png
├── test/                  # Test suite
├── docs/                  # Documentation
├── electron-builder.json  # Packaging configuration
├── run_as_app.cmd         # Windows launcher
└── run_electron.bat       # Electron binary launcher
```

## Adding New IPC Channels

1. Add the channel name to `VALID_CHANNELS` in `desktop/preload/desktop-api.js`
2. Add the handler in the appropriate `desktop/main/ipc/*.js` file
3. Call from renderer via `window.desktopAPI.invoke('channel:name', args)`

## Adding New Menu Items

1. Add to the template array in `desktop/main/menu-manager.js`
2. Add IPC handler if the menu item needs backend communication
3. Connect to renderer via `window.desktopAPI.send()` or `invoke()`

## Testing Desktop Features

```powershell
# Syntax check all files
npm run app:check

# Run all tests
npm run app:test

# Launch desktop app
npm run app:dev

# Build for Windows
npm run app:build:all
```

## Offline Development

The desktop application works completely offline:
- Tailwind CSS is bundled locally (`public/css/tailwind.css`)
- JSZip is bundled locally (`public/js/jszip.min.js`)
- All frontend modules are local
- Backend runs locally on loopback
- No external CDN dependencies

## Runtime Configuration

Environment variables (optional):
- `ESP_SIM_CXX` - C++ compiler path (default: clang++)
- `ESP_SIM_PYTHON` - Python interpreter path (default: python3)
- `PORT` - Backend server port (default: 3000)
- `HOST` - Backend bind address (default: 127.0.0.1)
- `ALLOWED_ORIGINS` - CORS allowed origins (default: none)

Desktop settings UI provides the same configuration without environment variables.