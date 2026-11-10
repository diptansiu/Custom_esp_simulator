// Settings Manager
// Manages application settings with persistence.

class SettingsManager {
  constructor() {
    this.storageManager = null;
    this.defaults = {
      window: {
        width: 1250,
        height: 850,
        x: null,
        y: null,
        maximized: false,
        fullscreen: false
      },
      runtime: {
        cppCompiler: null,
        pythonInterpreter: null,
        autoDetect: true
      },
      app: {
        theme: 'dark',
        autoSave: true,
        checkUpdates: false,
        showDiagnostics: false
      }
    };
    this.settings = this.clone(this.defaults);
  }

  clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  // Load persisted settings through the StorageManager and merge them with
  // the defaults so a missing/older settings file never breaks startup.
  initialize(storageManager) {
    this.storageManager = storageManager || null;
    const saved = (this.storageManager && this.storageManager.getSettings()) || {};
    this.settings = this.mergeDefaults(this.defaults, saved);
    return this.settings;
  }

  mergeDefaults(defaults, saved) {
    const result = this.clone(defaults);
    for (const key of Object.keys(saved || {})) {
      const defaultValue = defaults[key];
      const savedValue = saved[key];
      if (
        defaultValue && typeof defaultValue === 'object' && !Array.isArray(defaultValue) &&
        savedValue && typeof savedValue === 'object' && !Array.isArray(savedValue)
      ) {
        result[key] = { ...defaultValue, ...savedValue };
      } else {
        result[key] = savedValue;
      }
    }
    return result;
  }

  load() {
    if (this.storageManager) {
      const saved = this.storageManager.getSettings() || {};
      this.settings = this.mergeDefaults(this.defaults, saved);
    }
    return this.settings;
  }

  save() {
    return this.saveSettings();
  }

  saveSettings() {
    if (!this.storageManager) return false;
    return this.storageManager.saveSettings(this.settings);
  }

  get(section, key) {
    if (this.settings[section] !== undefined) {
      return key !== undefined ? this.settings[section][key] : this.settings[section];
    }
    return undefined;
  }

  set(section, key, value) {
    if (!this.settings[section]) {
      this.settings[section] = {};
    }
    this.settings[section][key] = value;
  }

  getAll() {
    return this.clone(this.settings);
  }

  update(updates) {
    this.settings = { ...this.settings, ...updates };
  }

  reset() {
    this.settings = this.clone(this.defaults);
  }

  getRuntimeConfig() {
    return { ...(this.settings.runtime || {}) };
  }

  saveRuntimeConfig(config) {
    this.settings.runtime = { ...(this.settings.runtime || {}), ...(config || {}) };
    return this.saveSettings();
  }
}

module.exports = { SettingsManager };
