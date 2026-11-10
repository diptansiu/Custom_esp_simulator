// Electron Platform Adapter
// Wraps the existing `window.desktopAPI` (exposed via contextBridge in
// desktop/preload/preload.js) into a platform adapter interface used by the
// shared application core.
// No dependencies on Electron modules are imported here; the adapter simply
// forwards calls to window.desktopAPI which is provided by the sandboxed preload.

export class ElectronAdapter {
  constructor(options = {}) {
    this.desktopAPI = options.desktopAPI || (typeof window !== 'undefined' && window.desktopAPI) || null;
    this.eventBus = options.eventBus || null;
    this._listeners = new Map();
  }

  // ── Application info ──

  async getStatus() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available (not running in Electron)');
    return this.desktopAPI.getStatus();
  }

  // ── Backend management ──

  async startBackend() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.startBackend();
  }

  async stopBackend() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.stopBackend();
  }

  // ── Runtime management ──

  async getRuntimeStatus() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.getRuntimeStatus();
  }

  async validateCppCompiler(compilerPath) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.validateCppCompiler(compilerPath);
  }

  async validatePythonInterpreter(interpreterPath) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.validatePythonInterpreter(interpreterPath);
  }

  async saveRuntimeConfig(config) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.saveRuntimeConfig(config);
  }

  async getRuntimeConfig() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.getRuntimeConfig();
  }

  async detectRuntimes() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.detectRuntimes();
  }

  // ── Project management ──

  async getAllProjects() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.getAllProjects();
  }

  async saveProject(projectData) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.saveProject(projectData);
  }

  async loadProject(filename) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.loadProject(filename);
  }

  async deleteProject(filename) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.deleteProject(filename);
  }

  async importProject(filePath) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.importProject(filePath);
  }

  async exportProject(filePath, projectData) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.exportProject(filePath, projectData);
  }

  async getStoragePaths() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.getStoragePaths();
  }

  // ── Window management ──

  async getWindowState() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.getWindowState();
  }

  async setWindowState(state) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.setWindowState(state);
  }

  async focusWindow() {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.focusWindow();
  }

  // ── Dialogs ──

  async openFileDialog(options) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.openFileDialog(options);
  }

  async saveFileDialog(options) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.saveFileDialog(options);
  }

  async openFolderDialog(options) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.openFolderDialog(options);
  }

  // ── External ──

  async openExternal(url) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.openExternal(url);
  }

  // ── Native dialogs ──

  async showInfo(title, message) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.showInfo(title, message);
  }

  async showError(title, message) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.showError(title, message);
  }

  // ── IPC events (main -> renderer) ──

  /**
   * Subscribe to a desktop IPC channel event.
   * The channel must be one of the validated preload channels.
   */
  on(channel, listener) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    if (typeof listener !== 'function') throw new Error('listener must be a function');

    // Wrap the listener so we can remove it later.
    const wrapped = (event, ...args) => listener(event, ...args);
    this.desktopAPI.on(channel, wrapped);

    if (!this._listeners.has(channel)) {
      this._listeners.set(channel, new Map());
    }
    this._listeners.get(channel).set(listener, wrapped);
  }

  /**
   * Unsubscribe from a desktop IPC channel event.
   */
  off(channel, listener) {
    if (!this.desktopAPI) return;
    const channelListeners = this._listeners.get(channel);
    if (!channelListeners) return;
    const wrapped = channelListeners.get(listener);
    if (wrapped) {
      try {
        this.desktopAPI.off(channel, wrapped);
      } catch {
        // Best effort
      }
      channelListeners.delete(listener);
      if (channelListeners.size === 0) {
        this._listeners.delete(channel);
      }
    }
  }

  /**
   * Send an IPC message (one-way, no reply).
   */
  send(channel, ...args) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.send(channel, ...args);
  }

  /**
   * Invoke an IPC method (request-reply).
   */
  invoke(channel, ...args) {
    if (!this.desktopAPI) throw new Error('desktopAPI not available');
    return this.desktopAPI.invoke(channel, ...args);
  }

  /**
   * Check whether we are running inside Electron with desktopAPI available.
   */
  isElectron() {
    return !!this.desktopAPI;
  }

  /**
   * Get app metadata.
   */
  getAppInfo() {
    if (typeof window !== 'undefined' && window.appInfo) {
      return window.appInfo;
    }
    return { name: 'ESP Simulator Studio', version: '1.0.0', platform: 'unknown', arch: 'unknown' };
  }
}

export default ElectronAdapter;
