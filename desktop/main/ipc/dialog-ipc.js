// Dialog IPC handlers

module.exports = function setupDialogIPC(ipcMain, managers) {
  const { windowManager } = managers;

  // Open file dialog
  ipcMain.handle('dialog:open-file', async (event, options) => {
    const result = await windowManager.openFileDialog(options);
    return result;
  });

  // Save file dialog
  ipcMain.handle('dialog:save-file', async (event, options) => {
    const result = await windowManager.saveFileDialog(options);
    return result;
  });

  // Open folder dialog
  ipcMain.handle('dialog:open-folder', async (event, options) => {
    const result = await windowManager.openFolderDialog(options);
    return result;
  });
};
