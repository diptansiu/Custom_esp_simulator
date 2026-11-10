# Desktop Packaging

## Packaging Tool

**electron-builder** v26.18.0 is used for Windows packaging.

## Build Targets

| Target | Output | Description |
|--------|--------|-------------|
| NSIS Installer | `ESP-Simulator-Studio-Setup-x64.exe` | Full Windows installer |
| Portable | `ESP-Simulator-Studio-Portable-x64.exe` | Portable executable |
| Unpacked | `dist/win-unpacked/` | Development directory build |

## Build Commands

```powershell
# Unpacked development build
npm run app:pack

# NSIS installer
npm run app:build:win

# Portable executable
npm run app:build:portable

# All Windows artifacts
npm run app:build:all
```

## Installer Features

| Feature | Configuration |
|---------|---------------|
| Per-user installation | Yes |
| Installation directory selection | Yes |
| Start Menu shortcut | Yes |
| Desktop shortcut | Optional (user choice) |
| Application icon | Custom ESP Simulator icon |
| Uninstallation | Yes (preserves user data) |
| Upgrade compatibility | Yes |
| Admin privileges | Not required (asInvoker) |

## NSIS Configuration

```json
{
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "ESP Simulator Studio",
  "deleteAppDataOnUninstall": false,
  "displayLanguageSelector": true
}
```

## Code Signing

**NOT SIGNED** - This is a development build.

- No digital certificate was provided
- Installer is unsigned
- Windows may show "Unknown publisher" warning
- Users must click "More info" > "Run anyway" on first install

## Output Locations

| Artifact | Path |
|----------|------|
| Unpacked app | `dist/win-unpacked/` |
| NSIS installer | `dist/ESP-Simulator-Studio-Setup-x64.exe` |
| Portable executable | `dist/ESP-Simulator-Studio-Portable-x64.exe` |

## Packaging Configuration (`electron-builder.json`)

Key settings:
- `appId`: `com.espsimulator.studio`
- `productName`: `ESP Simulator Studio`
- `win.target`: `nsis` + `portable` (x64)
- `win.icon`: `desktop/resources/icons/icon.png`
- `extraMetadata.main`: `desktop/main/main.js`

## File Inclusion

The following are included in the packaged app:
- `server.js` - Backend server
- `package.json` - NPM manifest
- `public/**/*` - All frontend assets
- `backend/**/*` - All backend runtime code
- `desktop/**/*` - All Electron desktop code
- `node_modules/**/*` - All dependencies

## Portable Mode

The portable executable:
- Runs without installation
- Uses the packaged Electron runtime
- Starts the internal backend automatically
- Stores user data alongside the executable (portable directory)
- Falls back to `%APPDATA%` if needed
- Does not require system-wide Node.js

## Testing Builds

Before distribution:
1. Launch unpacked app: `npm run app:pack` then run `dist/win-unpacked/ESP Simulator Studio.exe`
2. Install NSIS build to a test location (not over existing installation)
3. Launch portable build from a USB drive or separate folder
4. Verify all features work in each build type