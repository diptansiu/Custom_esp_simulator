// Runtime IPC handlers

module.exports = function setupRuntimeIPC(ipcMain, managers) {
  const { runtimeManager, backendManager } = managers;

  // Detect runtimes
  ipcMain.handle('runtime:detect', async () => {
    return await runtimeManager.detect();
  });
};
