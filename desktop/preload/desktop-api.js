// Desktop API - reference module (NOT loaded at runtime)
//
// The window runs with sandbox: true, and sandboxed preload scripts cannot
// require() local files. The live, sandbox-compatible implementation is the
// single self-contained file at desktop/preload/preload.js.
//
// This file is kept as the readable/reference copy of the same API surface.
// If you change the API here, mirror the change in preload.js (and the
// VALID_CHANNELS whitelist there).

const { contextBridge, ipcRenderer } = require('electron');

// Validate that a string is a safe IPC channel name
const VALID_CHANNELS = new Set([
  'app:get-status',
  'backend:start',
  'backend:stop',
  'runtime:get-status',
  'runtime:validate-cpp',
  'runtime:validate-python',
  'runtime:save-config',
  'runtime:get-config',
  'runtime:detect',
  'app:open-external',
  'app:show-error',
  'app:show-info',
  'window:get-state',
  'window:set-state',
  'window:focus',
  'project:get-all',
  'project:save',
  'project:load',
  'project:delete',
  'project:import',
  'project:export',
  'storage:get-paths',
  'dialog:open-file',
  'dialog:save-file',
  'dialog:open-folder'
]);

// Validate IPC channel before sending
function validateChannel(channel) {
  if (typeof channel !== 'string') return false;
  return VALID_CHANNELS.has(channel);
}

// Expose desktop API to renderer
contextBridge.exposeInMainWorld('desktopAPI', {
  // Application info
  getStatus: () => ipcRenderer.invoke('app:get-status'),

  // Backend management
  startBackend: () => ipcRenderer.invoke('backend:start'),
  stopBackend: () => ipcRenderer.invoke('backend:stop'),

  // Runtime management
  getRuntimeStatus: () => ipcRenderer.invoke('runtime:get-status'),
  validateCppCompiler: (compilerPath) => ipcRenderer.invoke('runtime:validate-cpp', compilerPath),
  validatePythonInterpreter: (interpreterPath) => ipcRenderer.invoke('runtime:validate-python', interpreterPath),
  saveRuntimeConfig: (config) => ipcRenderer.invoke('runtime:save-config', config),
  getRuntimeConfig: () => ipcRenderer.invoke('runtime:get-config'),
  detectRuntimes: () => ipcRenderer.invoke('runtime:detect'),

  // Project management
  getAllProjects: () => ipcRenderer.invoke('project:get-all'),
  saveProject: (projectData) => ipcRenderer.invoke('project:save', projectData),
  loadProject: (filename) => ipcRenderer.invoke('project:load', filename),
  deleteProject: (filename) => ipcRenderer.invoke('project:delete', filename),
  importProject: (filePath) => ipcRenderer.invoke('project:import', filePath),
  exportProject: (filePath, projectData) => ipcRenderer.invoke('project:export', filePath, projectData),
  getStoragePaths: () => ipcRenderer.invoke('storage:get-paths'),

  // Window management
  getWindowState: () => ipcRenderer.invoke('window:get-state'),
  setWindowState: (state) => ipcRenderer.invoke('window:set-state', state),
  focusWindow: () => ipcRenderer.invoke('window:focus'),

  // Dialogs
  openFileDialog: (options) => ipcRenderer.invoke('dialog:open-file', options),
  saveFileDialog: (options) => ipcRenderer.invoke('dialog:save-file', options),
  openFolderDialog: (options) => ipcRenderer.invoke('dialog:open-folder', options),

  // External
  openExternal: (url) => ipcRenderer.invoke('app:open-external', url),

  // Events
  on: (channel, listener) => {
    if (!validateChannel(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    ipcRenderer.on(channel, listener);
  },
  off: (channel, listener) => {
    if (!validateChannel(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    ipcRenderer.off(channel, listener);
  },
  send: (channel, ...args) => {
    if (!validateChannel(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    ipcRenderer.send(channel, ...args);
  },
  invoke: (channel, ...args) => {
    if (!validateChannel(channel)) {
      throw new Error(`Invalid IPC channel: ${channel}`);
    }
    return ipcRenderer.invoke(channel, ...args);
  }
});

// Expose app metadata
contextBridge.exposeInMainWorld('appInfo', {
  name: 'ESP Simulator Studio',
  version: '1.0.0',
  platform: process.platform,
  arch: process.arch
});
