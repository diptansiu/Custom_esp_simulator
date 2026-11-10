// Project file IPC handlers

const fs = require('fs');
const path = require('path');

module.exports = function setupProjectIPC(ipcMain, managers) {
  const { storageManager, windowManager } = managers;

  // Get all projects
  ipcMain.handle('project:get-all', async () => {
    return storageManager.getProjects();
  });

  // Save project
  ipcMain.handle('project:save', async (event, projectData) => {
    try {
      const result = storageManager.saveProject(projectData);
      return { success: true, ...result };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Load project
  ipcMain.handle('project:load', async (event, filename) => {
    const project = storageManager.loadProject(filename);
    if (project) {
      return { success: true, project };
    }
    return { success: false, error: 'Project not found' };
  });

  // Delete project
  ipcMain.handle('project:delete', async (event, filename) => {
    const success = storageManager.deleteProject(filename);
    return { success };
  });

  // Import project from file
  ipcMain.handle('project:import', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) {
        return { success: false, error: 'File not found' };
      }
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const result = storageManager.saveProject(content);
      // Return the parsed project so the renderer can load it immediately.
      return { success: true, ...result, projectData: content };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Export project to file
  ipcMain.handle('project:export', async (event, filePath, projectData) => {
    try {
      fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2), 'utf-8');
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Get storage paths (for diagnostics)
  ipcMain.handle('storage:get-paths', async () => {
    return storageManager.getPaths();
  });
};
