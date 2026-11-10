// Config Service
// Application service for configuration management.
// Depends on shared core constants and infrastructure config loader.

import { DEFAULT_CONFIG } from '../shared/core/constants/index.js';
import { ConfigError } from '../shared/core/errors/index.js';

export class ConfigService {
  constructor(options = {}) {
    this.configLoader = options.configLoader || null;
    this.settings = options.settings || { ...DEFAULT_CONFIG };
    this.eventBus = options.eventBus || null;
  }

  /**
   * Set the configuration loader for persistence.
   */
  setConfigLoader(configLoader) {
    this.configLoader = configLoader;
  }

  /**
   * Set the event bus for publishing events.
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Load configuration from the loader.
   */
  async load() {
    if (this.configLoader) {
      try {
        const loaded = await this.configLoader.load();
        this.settings = this._mergeDefaults(DEFAULT_CONFIG, loaded);
      } catch (err) {
        throw new ConfigError(`Failed to load configuration: ${err.message}`);
      }
    }
    return this.getAll();
  }

  /**
   * Save configuration through the loader.
   */
  async save() {
    if (this.configLoader) {
      try {
        await this.configLoader.save(this.settings);
      } catch (err) {
        throw new ConfigError(`Failed to save configuration: ${err.message}`);
      }
    }
    return { success: true };
  }

  /**
   * Get all configuration.
   */
  getAll() {
    return JSON.parse(JSON.stringify(this.settings)); // Deep clone
  }

  /**
   * Get a configuration section.
   */
  getSection(section) {
    if (!this.settings[section]) {
      return undefined;
    }
    return JSON.parse(JSON.stringify(this.settings[section]));
  }

  /**
   * Get a specific configuration value.
   */
  get(section, key) {
    const sectionData = this.settings[section];
    if (!sectionData) {
      return undefined;
    }
    return key !== undefined ? sectionData[key] : sectionData;
  }

  /**
   * Set a configuration value.
   */
  set(section, key, value) {
    if (!this.settings[section]) {
      this.settings[section] = {};
    }
    this.settings[section][key] = value;
    this._publish('config:changed', { section, key, value });
    return { success: true };
  }

  /**
   * Update multiple configuration values.
   */
  update(updates) {
    this.settings = { ...this.settings, ...updates };
    this._publish('config:updated', { updates });
    return { success: true };
  }

  /**
   * Reset configuration to defaults.
   */
  reset() {
    this.settings = { ...DEFAULT_CONFIG };
    this._publish('config:reset', {});
    return { success: true };
  }

  /**
   * Get runtime configuration section.
   */
  getRuntimeConfig() {
    return this.getSection('runtime');
  }

  /**
   * Save runtime configuration.
   */
  async saveRuntimeConfig(config) {
    this.settings.runtime = { ...(this.settings.runtime || {}), ...(config || {}) };
    await this.save();
    this._publish('runtime:config-changed', { config: this.settings.runtime });
    return { success: true };
  }

  /**
   * Merge saved config with defaults (deep merge for objects).
   */
  _mergeDefaults(defaults, saved) {
    const result = JSON.parse(JSON.stringify(defaults));
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

  /**
   * Publish an event if event bus is available.
   */
  _publish(eventType, payload) {
    if (this.eventBus && typeof this.eventBus.publish === 'function') {
      this.eventBus.publish(eventType, payload);
    }
  }
}

export default ConfigService;
