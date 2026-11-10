// Application-level IPC handlers

module.exports = function setupApplicationIPC(ipcMain, managers) {
  const { windowManager, backendManager, runtimeManager, settingsManager, lifecycleManager } = managers;

  // Get application status
  ipcMain.handle('app:get-status', async () => {
    return {
      name: 'ESP Simulator Studio',
      version: '1.0.0',
      backendRunning: backendManager.isBackendRunning(),
      backendUrl: backendManager.getBackendUrl(),
      cppAvailable: runtimeManager.isCppAvailable(),
      pythonAvailable: runtimeManager.isPythonAvailable(),
      windowCount: windowManager.getWindowCount(),
      lifecycle: lifecycleManager.getStatus()
    };
  });

  // Start the backend server
  ipcMain.handle('backend:start', async () => {
    try {
      const url = await backendManager.start();
      return { success: true, url };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Stop the backend server
  ipcMain.handle('backend:stop', async () => {
    backendManager.stopBackend();
    return { success: true };
  });

  // Get runtime status
  ipcMain.handle('runtime:get-status', async () => {
    return runtimeManager.getStatus();
  });

  // Validate C++ compiler
  ipcMain.handle('runtime:validate-cpp', async (event, compilerPath) => {
    return runtimeManager.validateCppCompiler(compilerPath);
  });

  // Validate Python interpreter
  ipcMain.handle('runtime:validate-python', async (event, interpreterPath) => {
    return runtimeManager.validatePythonInterpreter(interpreterPath);
  });

  // Save runtime configuration
  ipcMain.handle('runtime:save-config', async (event, config) => {
    return settingsManager.saveRuntimeConfig(config);
  });

  // Get runtime configuration
  ipcMain.handle('runtime:get-config', async () => {
    return settingsManager.getRuntimeConfig();
  });

  // Open external URL
  ipcMain.handle('app:open-external', async (event, url) => {
    const { shell } = require('electron');
    await shell.openExternal(url);
    return { success: true };
  });

  // Show error dialog
  ipcMain.handle('app:show-error', async (event, title, message) => {
    windowManager.showErrorDialog(title, message);
    return { success: true };
  });

  // Show info dialog
  ipcMain.handle('app:show-info', async (event, title, message) => {
    windowManager.showInfoDialog(title, message);
    return { success: true };
  });

  // Get window state
  ipcMain.handle('window:get-state', async () => {
    const win = windowManager.getMainWindow();
    if (!win) return null;
    return {
      isMaximized: win.isMaximized(),
      isMinimized: win.isMinimized(),
      isFullScreen: win.isFullScreen(),
      bounds: win.getBounds()
    };
  });

  // Set window state
  ipcMain.handle('window:set-state', async (event, state) => {
    const win = windowManager.getMainWindow();
    if (!win) return { success: false };

    if (state.maximized !== undefined) {
      if (state.maximized) win.maximize(); else win.unmaximize();
    }
    if (state.fullScreen !== undefined) {
      win.setFullScreen(state.fullScreen);
    }
    if (state.bounds) {
      win.setBounds(state.bounds);
    }
    return { success: true };
  });

  // Focus window
  ipcMain.handle('window:focus', async () => {
    windowManager.focusMainWindow();
    return { success: true };
  });
};
