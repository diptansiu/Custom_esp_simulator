// Electron Main Process Entry Point
// ESP Simulator Studio - Desktop Application

const { app, dialog } = require('electron');

const { LifecycleManager } = require('./lifecycle-manager');
const { WindowManager } = require('./window-manager');
const { BackendManager } = require('./backend-manager');
const { RuntimeManager } = require('./runtime-manager');
const { StorageManager } = require('./storage-manager');
const { MenuManager } = require('./menu-manager');
const { SettingsManager } = require('./settings-manager');
const { setupIPC } = require('./ipc');

// Application state
let lifecycleManager = null;
let windowManager = null;
let backendManager = null;
let runtimeManager = null;
let storageManager = null;
let menuManager = null;
let settingsManager = null;

// Application constants
const APP_NAME = 'ESP Simulator Studio';
const APP_ID = 'com.espsimulator.studio';
const DEFAULT_PORT = 3000;

// Use a stable product name for userData paths in both dev and packaged
// builds, so projects/settings survive upgrades and reinstallations.
app.setName(APP_NAME);
app.setAppUserModelId(APP_ID);

// Single-instance lock
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  // Another instance is already running, quit
  app.quit();
} else {
  app.on('second-instance', (event, argv, workingDirectory) => {
    // Someone tried to run a second instance, focus our window instead
    if (windowManager) {
      windowManager.focusMainWindow();
    }
  });
}

// App ready handler
app.whenReady().then(async () => {
  try {
    // Step 1: Initialize managers in order
    settingsManager = new SettingsManager();
    storageManager = new StorageManager();
    storageManager.initialize(app);
    settingsManager.initialize(storageManager);
    runtimeManager = new RuntimeManager();
    // Detect available runtimes (C++ compiler, Python interpreter) so the
    // renderer can enable/disable native execution options accordingly.
    await runtimeManager.detect();
    backendManager = new BackendManager(runtimeManager, storageManager.getPaths().userData);
    windowManager = new WindowManager(backendManager, runtimeManager, settingsManager);
    menuManager = new MenuManager(windowManager, backendManager, runtimeManager, settingsManager);
    lifecycleManager = new LifecycleManager(
      app, windowManager, backendManager, runtimeManager,
      storageManager, menuManager, settingsManager
    );

    // Step 2: Setup IPC handlers
    setupIPC({
      windowManager,
      backendManager,
      runtimeManager,
      storageManager,
      menuManager,
      settingsManager,
      lifecycleManager
    });

    // Step 3: Build application menus
    menuManager.buildMenu();

    // Step 4: Start the backend BEFORE loading the UI. The renderer loads
    // the frontend from the local HTTP server, exactly like browser/PWA
    // mode, so relative asset paths, fetch() and EventSource() all resolve
    // against the same origin.
    let backendUrl;
    try {
      backendUrl = await backendManager.start();
      console.log(`[Main] Backend started at ${backendUrl}`);
    } catch (err) {
      console.error('[Main] Backend failed to start:', err.message);
      dialog.showErrorBox(
        'Backend Error',
        `Failed to start the local simulation server.\n\n${err.message}`
      );
      app.quit();
      return;
    }

    // Step 5: Create main window
    windowManager.createMainWindow();

    const mainWindow = windowManager.getMainWindow();
    if (mainWindow) {
      mainWindow.webContents.once('did-finish-load', () => {
        if (!mainWindow.isDestroyed()) {
          mainWindow.webContents.send('backend:status-changed', {
            backendRunning: true,
            backendUrl
          });
        }
      });
    }

    // Log startup
    console.log(`[${new Date().toISOString()}] ${APP_NAME} v${app.getVersion()} started`);
  } catch (err) {
    console.error('Failed to initialize application:', err);
    app.quit();
  }
});

// Window all closed handler
app.on('window-all-closed', () => {
  // On Windows, keep the application running until explicitly quit
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Activate handler (macOS dock click)
app.on('activate', () => {
  if (windowManager && windowManager.getMainWindow() === null) {
    windowManager.createMainWindow();
  }
});

// Quit handler - clean up all resources
app.on('before-quit', () => {
  if (lifecycleManager) {
    lifecycleManager.prepareQuit();
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Don't quit immediately, try to show error dialog
  if (windowManager) {
    windowManager.showErrorDialog('Application Error', err.message || 'Unknown error');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
});

module.exports = {
  APP_NAME,
  APP_ID,
  DEFAULT_PORT
};
