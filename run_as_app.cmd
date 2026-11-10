@echo off
rem -------------------------------------------------------------
rem ESP Simulator Studio - Standalone Desktop App Launcher
rem -------------------------------------------------------------

setlocal enabledelayedexpansion

rem ── 1️⃣  Find the directory where this script lives ───────────
set "APP_DIR=%~dp0"

rem ── 2️⃣  Check if Electron is available ───────────────────────
if not exist "%APP_DIR%node_modules\.bin\electron.cmd" (
    echo.
    echo ERROR: Electron is not installed.
    echo Please run: npm install
    echo.
    pause
    exit /b 1
)

rem ── 3️⃣  Check if Electron binary is available ────────────────
set "ELECTRON_PATH=%LOCALAPPDATA%\electron\Cache\electron-v33.4.11-win32-x64\electron.exe"
if not exist "%ELECTRON_PATH%" (
    echo.
    echo WARNING: Electron binary not found at default cache location.
    echo Attempting to use npm-installed Electron...
    set "ELECTRON_CMD=%APP_DIR%node_modules\.bin\electron.cmd"
) else (
    set "ELECTRON_CMD=%ELECTRON_PATH%"
)

rem ── 4️⃣  Launch ESP Simulator Studio Desktop App ──────────────
echo.
echo ================================================
echo   ESP Simulator Studio - Desktop Application
echo ================================================
echo.
echo Starting Electron desktop application...
echo Working directory: %APP_DIR%
echo.

cd /d "%APP_DIR%"

rem Launch Electron with the app directory
if defined ELECTRON_PATH (
    "%ELECTRON_PATH%" "%APP_DIR%"
) else (
    "%ELECTRON_CMD%" .
)

rem ── 5️⃣  Wait for user to close ───────────────────────────────
echo.
echo ESP Simulator Studio has been closed.
echo.

endlocal
