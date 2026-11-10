// Browser Platform Adapter (stub)
// Provides the same interface as the Electron adapter but using browser-native
// APIs (localStorage, fetch). Used when running outside Electron (PWA/browser).
// No external dependencies beyond the browser.

export class BrowserAdapter {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'esp-simulator-projects';
    this.eventBus = options.eventBus || null;
    this._listeners = new Map();
  }

  // ── Application info ──

  async getStatus() {
    return {
      name: 'ESP Simulator Studio',
      version: '1.0.0',
      backendRunning: false,
      backendUrl: null,
      cppAvailable: false,
      pythonAvailable: false,
      windowCount: 1,
      lifecycle: { isShuttingDown: false, backendRunning: false, activeSessions: 0, windowCount: 1 }
    };
  }

  // ── Backend management (browser has no managed backend) ──

  async startBackend() {
    return { success: false, error: 'Backend management not available in browser mode' };
  }

  async stopBackend() {
    return { success: true };
  }

  // ── Runtime management ──

  async getRuntimeStatus() {
    return {
      cpp: { available: false, path: null, version: null },
      python: { available: false, path: null, version: null },
      detectionComplete: true
    };
  }

  async validateCppCompiler() {
    return { valid: false, error: 'C++ compiler validation not available in browser mode' };
  }

  async validatePythonInterpreter() {
    return { valid: false, error: 'Python interpreter validation not available in browser mode' };
  }

  async saveRuntimeConfig() {
    return { success: true };
  }

  async getRuntimeConfig() {
    return {};
  }

  async detectRuntimes() {
    return {
      cpp: { available: false, path: null, version: null },
      python: { available: false, path: null, version: null },
      detectionComplete: true
    };
  }

  // ── Project management (localStorage) ──

  async getAllProjects() {
    try {
      const raw = localStorage.getItem(this.storageKey || 'esp-simulator-projects');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async saveProject(projectData) {
    const projects = await this.getAllProjects();
    const existingIdx = projects.findIndex(p => p.id === projectData.id);
    const entry = {
      ...projectData,
      updatedAt: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      projects[existingIdx] = entry;
    } else {
      projects.push(entry);
    }
    localStorage.setItem(this.storageKey || 'esp-simulator-projects', JSON.stringify(projects));
    return { success: true, filename: `${projectData.id}.json`, path: `localstorage:${projectData.id}.json` };
  }

  async loadProject(filename) {
    const projects = await this.getAllProjects();
    const entry = projects.find(p => p.id === filename.replace('.json', '') || p.filename === filename);
    if (!entry) return null;
    return { success: true, project: entry };
  }

  async deleteProject(filename) {
    const projects = await this.getAllProjects();
    const id = filename.replace('.json', '');
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(this.storageKey || 'esp-simulator-projects', JSON.stringify(filtered));
    return { success: true };
  }

  async importProject(filePath) {
    // Browser import uses FileReader via the UI; this is a stub for programmatic use.
    return { success: false, error: 'Use file input dialog for browser import' };
  }

  async exportProject(filePath, projectData) {
    // Browser export uses download blob via the UI; this is a stub.
    return { success: false, error: 'Use download for browser export' };
  }

  async getStoragePaths() {
    return {
      userData: 'localstorage',
      projects: `localstorage:${this.storageKey || 'esp-simulator-projects'}`,
      settings: 'localstorage:esp-simulator-settings',
      backups: 'localstorage:esp-simulator-backups',
      temp: 'localstorage:esp-simulator-temp'
    };
  }

  // ── Window management (browser stubs) ──

  async getWindowState() {
    return {
      isMaximized: false,
      isMinimized: false,
      isFullScreen: false,
      bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight }
    };
  }

  async setWindowState() {
    return { success: false, error: 'Window state not controllable in browser mode' };
  }

  async focusWindow() {
    return { success: true };
  }

  // ── Dialogs (browser stubs) ──

  async openFileDialog() {
    return { success: false, error: 'File dialog not available in browser mode' };
  }

  async saveFileDialog() {
    return { success: false, error: 'Save dialog not available in browser mode' };
  }

  async openFolderDialog() {
    return { success: false, error: 'Folder dialog not available in browser mode' };
  }

  // ── External ──

  async openExternal(url) {
    if (typeof window !== 'undefined') {
      window.open(url, '_blank');
    }
    return { success: true };
  }

  // ── Native dialogs ──

  async showInfo(title, message) {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
    }
    return { success: true };
  }

  async showError(title, message) {
    if (typeof window !== 'undefined') {
      window.alert(`${title}\n${message}`);
    }
    return { success: true };
  }

  // ── IPC events (browser has no IPC) ──

  on() {
    // Browser has no IPC channels; no-op.
    return;
  }

  off() {
    return;
  }

  send() {
    return { success: false, error: 'IPC not available in browser mode' };
  }

  invoke() {
    return { success: false, error: 'IPC not available in browser mode' };
  }

  isElectron() {
    return false;
  }

  getAppInfo() {
    if (typeof window !== 'undefined' && window.appInfo) {
      return window.appInfo;
    }
    return { name: 'ESP Simulator Studio', version: '1.0.0', platform: 'browser', arch: 'unknown' };
  }
}

export default BrowserAdapter;
