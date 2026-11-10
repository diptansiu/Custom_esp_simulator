# Desktop Runtime Management

## Overview

The desktop application detects and manages available execution dependencies:
- C++ compiler (clang++, g++, or cl.exe)
- Python interpreter (python3 or python)

## Environment Variables (Supported)

| Variable | Purpose | Default |
|----------|---------|---------|
| `ESP_SIM_CXX` | C++ compiler executable | `clang++` |
| `ESP_SIM_PYTHON` | Python interpreter executable | `python3` |
| `PORT` | Backend server port | `3000` |
| `HOST` | Backend bind address | `127.0.0.1` |

## Runtime Detection

On startup, the RuntimeManager:
1. Checks environment variables first
2. Falls back to default executable names
3. Validates executables by running `--version`
4. Reports availability via `/api/status` and `desktopAPI.getRuntimeStatus()`

## Runtime Settings UI

The desktop application includes a Runtime Settings section accessible via:
- Menu: Tools > Runtime Settings
- IPC: `menu-runtime-settings`

Features:
- Display C++ compiler status, path, and version
- Display Python interpreter status, path, and version
- Auto-detect runtimes
- Manual executable selection with file browser
- Validate executable paths
- Test execution
- Save configuration
- Reset to defaults

## Runtime Status Reporting

The `/api/status` endpoint reports:

```json
{
  "compiler": {
    "name": "clang++",
    "available": false,
    "mode": "host-native simulation (not ESP firmware)"
  },
  "python": {
    "name": "python3",
    "available": false,
    "mode": "host Python compatibility (not MicroPython VM)"
  }
}
```

## Availability Scenarios

| Scenario | C++ Available | Python Available | Behavior |
|----------|--------------|-----------------|----------|
| Both installed | ✅ | ✅ | Full native execution |
| Only C++ | ✅ | ❌ | C++ execution only, Python skipped |
| Only Python | ❌ | ✅ | Python execution only, C++ skipped |
| Neither | ❌ | ❌ | Browser fast runners only |

The application launches successfully regardless of runtime availability. Missing runtimes are clearly indicated in the UI.

## Bundled Runtimes

No third-party runtimes are bundled with the application. Users must install:
- C++ compiler: MinGW, LLVM, or Visual C++ Build Tools
- Python: python.org or Microsoft Store

## Validation

Executable paths are validated before use:
- Runs `--version` to confirm the executable works
- Captures version string for display
- Reports clear error messages for invalid paths
- Settings are persisted between sessions