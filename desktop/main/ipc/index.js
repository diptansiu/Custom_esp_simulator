// IPC Setup
// Registers all IPC handlers for secure communication between main and renderer processes

const { ipcMain } = require('electron');

function setupIPC(managers) {
  const { windowManager, backendManager, runtimeManager, storageManager, menuManager, settingsManager, lifecycleManager } = managers;

  require('./application-ipc')(ipcMain, { windowManager, backendManager, runtimeManager, settingsManager, lifecycleManager });
  require('./project-ipc')(ipcMain, { storageManager, windowManager });
  require('./runtime-ipc')(ipcMain, { runtimeManager, backendManager });
  require('./dialog-ipc')(ipcMain, { windowManager });

  console.log('[IPC] All IPC handlers registered');
}

module.exports = { setupIPC };
