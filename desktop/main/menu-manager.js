// Menu Manager
// Builds and manages native application menus

const { Menu, shell } = require('electron');

class MenuManager {
  constructor(windowManager, backendManager, runtimeManager, settingsManager) {
    this.windowManager = windowManager;
    this.backendManager = backendManager;
    this.runtimeManager = runtimeManager;
    this.settingsManager = settingsManager;
    this.menu = null;
  }

  buildMenu() {
    const template = [
      {
        label: 'File',
        submenu: [
          {
            label: 'New Project',
            accelerator: 'CmdOrCtrl+N',
            click: () => this.windowManager.mainWindow.webContents.send('menu-new-project')
          },
          {
            label: 'Open Project',
            accelerator: 'CmdOrCtrl+O',
            click: () => this.windowManager.mainWindow.webContents.send('menu-open-project')
          },
          {
            label: 'Save Project',
            accelerator: 'CmdOrCtrl+S',
            click: () => this.windowManager.mainWindow.webContents.send('menu-save-project')
          },
          {
            label: 'Save Project As...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click: () => this.windowManager.mainWindow.webContents.send('menu-save-project-as')
          },
          { type: 'separator' },
          {
            label: 'Import Project',
            click: async () => {
              const result = await this.windowManager.openFileDialog({
                title: 'Import Project',
                filters: [{ name: 'JSON Files', extensions: ['json'] }],
                properties: ['openFile']
              });
              if (!result.canceled && result.filePaths[0]) {
                this.windowManager.mainWindow.webContents.send('menu-import-project', result.filePaths[0]);
              }
            }
          },
          {
            label: 'Export Project',
            click: async () => {
              const result = await this.windowManager.saveFileDialog({
                title: 'Export Project',
                filters: [{ name: 'JSON Files', extensions: ['json'] }]
              });
              if (!result.canceled && result.filePath) {
                this.windowManager.mainWindow.webContents.send('menu-export-project', result.filePath);
              }
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              const { app } = require('electron');
              app.quit();
            }
          }
        ]
      },
      {
        label: 'Edit',
        submenu: [
          { label: 'Undo', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
          { label: 'Redo', accelerator: 'CmdOrCtrl+Shift+Z', role: 'redo' },
          { type: 'separator' },
          { label: 'Cut', accelerator: 'CmdOrCtrl+X', role: 'cut' },
          { label: 'Copy', accelerator: 'CmdOrCtrl+C', role: 'copy' },
          { label: 'Paste', accelerator: 'CmdOrCtrl+V', role: 'paste' },
          { label: 'Select All', accelerator: 'CmdOrCtrl+A', role: 'selectAll' }
        ]
      },
      {
        label: 'View',
        submenu: [
          { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => this.windowManager.mainWindow.webContents.reload() },
          { label: 'Zoom In', accelerator: 'CmdOrCtrl+=', click: () => this.windowManager.mainWindow.webContents.zoomIn() },
          { label: 'Zoom Out', accelerator: 'CmdOrCtrl+-', click: () => this.windowManager.mainWindow.webContents.zoomOut() },
          { label: 'Reset Zoom', accelerator: 'CmdOrCtrl+0', click: () => this.windowManager.mainWindow.webContents.setZoomLevel(0) },
          { type: 'separator' },
          { label: 'Full Screen', accelerator: 'F11', click: () => {
            const win = this.windowManager.getMainWindow();
            if (win) win.setFullScreen(!win.isFullScreen());
          }},
          { type: 'separator' },
          {
            label: 'Developer Tools',
            accelerator: 'CmdOrCtrl+Shift+I',
            visible: process.env.NODE_ENV === 'development',
            click: () => {
              const win = this.windowManager.getMainWindow();
              if (win) win.webContents.toggleDevTools();
            }
          }
        ]
      },
      {
        label: 'Simulation',
        submenu: [
          {
            label: 'Start',
            accelerator: 'F5',
            click: () => this.windowManager.mainWindow.webContents.send('menu-simulation-start')
          },
          {
            label: 'Stop',
            accelerator: 'Shift+F5',
            click: () => this.windowManager.mainWindow.webContents.send('menu-simulation-stop')
          },
          {
            label: 'Reset',
            accelerator: 'Ctrl+R',
            click: () => this.windowManager.mainWindow.webContents.send('menu-simulation-reset')
          }
        ]
      },
      {
        label: 'Tools',
        submenu: [
          {
            label: 'Runtime Settings',
            click: () => this.windowManager.mainWindow.webContents.send('menu-runtime-settings')
          },
          {
            label: 'Application Preferences',
            click: () => this.windowManager.mainWindow.webContents.send('menu-app-preferences')
          },
          { type: 'separator' },
          {
            label: 'Serial Monitor',
            click: () => this.windowManager.mainWindow.webContents.send('menu-serial-monitor')
          },
          {
            label: 'GPIO Inspector',
            click: () => this.windowManager.mainWindow.webContents.send('menu-gpio-inspector')
          }
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'Documentation',
            click: () => shell.openExternal('https://github.com/esp-simulator/studio/docs')
          },
          {
            label: 'About ESP Simulator Studio',
            click: () => this.windowManager.showInfoDialog(
              'About ESP Simulator Studio',
              'ESP Simulator Studio v1.0.0\n\nAn interactive visual circuit simulator and development lab for ESP8266 and ESP32 microcontrollers.\n\nNative host execution modes are not sandboxed and run with user permissions.'
            )
          },
          {
            label: 'Version Information',
            click: () => {
              const { app, process: proc } = require('electron');
              const versions = process.versions;
              this.windowManager.showInfoDialog(
                'Version Information',
                `ESP Simulator Studio: ${app.getVersion()}\nElectron: ${versions.electron}\nChrome: ${versions.chrome}\nNode.js: ${versions.node}`
              );
            }
          },
          {
            label: 'Diagnostics',
            click: () => {
              const status = {
                backend: this.backendManager ? this.backendManager.isBackendRunning() : false,
                cpp: this.runtimeManager ? this.runtimeManager.isCppAvailable() : false,
                python: this.runtimeManager ? this.runtimeManager.isPythonAvailable() : false
              };
              this.windowManager.showInfoDialog(
                'Diagnostics',
                `Backend: ${status.backend ? 'Running' : 'Not running'}\nC++ Compiler: ${status.cpp ? 'Available' : 'Not available'}\nPython: ${status.python ? 'Available' : 'Not available'}`
              );
            }
          }
        ]
      }
    ];

    this.menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(this.menu);
  }

  updateRuntimeStatus() {
    // Menu items can be updated to reflect runtime status
    // This is a placeholder for future enhancements
  }
}

module.exports = { MenuManager };
