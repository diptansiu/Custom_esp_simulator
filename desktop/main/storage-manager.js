// Storage Manager
// Handles project data persistence and application settings storage

const fs = require('fs');
const path = require('path');
const os = require('os');

class StorageManager {
  constructor() {
    this.userDataPath = null;
    this.projectsPath = null;
    this.settingsPath = null;
    this.backupsPath = null;
    this.tempPath = null;
    this.initialized = false;
  }

  initialize(app) {
    // Use Electron's app.getPath('userData') for persistent user data
    this.userDataPath = app.getPath('userData');
    this.projectsPath = path.join(this.userDataPath, 'projects');
    this.settingsPath = path.join(this.userDataPath, 'settings.json');
    this.backupsPath = path.join(this.userDataPath, 'backups');
    this.tempPath = path.join(this.userDataPath, 'temp');

    // Create directories
    for (const dir of [this.projectsPath, this.backupsPath, this.tempPath]) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    this.initialized = true;
    console.log('[Storage] User data path:', this.userDataPath);
  }

  // Normalize a renderer-supplied filename and prevent path traversal.
  safeProjectFilename(filename) {
    const base = path.basename(String(filename || 'project.json'));
    const safe = base.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^\.+/, '').slice(0, 120);
    if (!safe) return 'project.json';
    return safe.toLowerCase().endsWith('.json') ? safe : `${safe}.json`;
  }

  // Get all saved projects
  getProjects() {
    if (!this.initialized) return [];

    try {
      const files = fs.readdirSync(this.projectsPath).filter(f => f.endsWith('.json'));
      const projects = files.map(f => {
        try {
          const content = JSON.parse(fs.readFileSync(path.join(this.projectsPath, f), 'utf-8'));
          const stat = fs.statSync(path.join(this.projectsPath, f));
          const parsed = typeof content.updatedAt === 'number'
            ? content.updatedAt
            : Date.parse(content.updatedAt);
          return {
            filename: f,
            name: content.name || f.replace('.json', ''),
            board: content.board || 'esp8266-nodemcu',
            description: content.description || '',
            updatedAt: Number.isFinite(parsed) ? parsed : stat.mtimeMs,
            path: path.join(this.projectsPath, f)
          };
        } catch {
          return { filename: f, name: f.replace('.json', ''), path: path.join(this.projectsPath, f) };
        }
      });
      return projects.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    } catch (e) {
      console.error('[Storage] Error reading projects:', e.message);
      return [];
    }
  }

  // Save a project
  saveProject(projectData) {
    if (!this.initialized) throw new Error('Storage not initialized');

    const requested = projectData.filename || `${projectData.name || 'project'}.json`;
    const filename = this.safeProjectFilename(requested);
    const filePath = path.join(this.projectsPath, filename);

    // Create backup if file exists
    if (fs.existsSync(filePath)) {
      this.createBackup(filePath);
    }

    fs.writeFileSync(filePath, JSON.stringify(projectData, null, 2), 'utf-8');
    return { success: true, path: filePath, filename };
  }

  // Load a project by filename
  loadProject(filename) {
    if (!this.initialized) return null;

    const filePath = path.join(this.projectsPath, this.safeProjectFilename(filename));
    if (!fs.existsSync(filePath)) return null;

    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      console.error('[Storage] Error loading project:', e.message);
      return null;
    }
  }

  // Delete a project
  deleteProject(filename) {
    if (!this.initialized) return false;

    const filePath = path.join(this.projectsPath, this.safeProjectFilename(filename));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  }

  // Create a backup of a file before overwriting
  createBackup(filePath) {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const basename = path.basename(filePath);
      const backupPath = path.join(this.backupsPath, `${timestamp}-${basename}`);
      fs.copyFileSync(filePath, backupPath);
      return backupPath;
    } catch (e) {
      console.error('[Storage] Backup failed:', e.message);
      return null;
    }
  }

  // Get application settings
  getSettings() {
    if (!this.initialized) return {};

    try {
      if (fs.existsSync(this.settingsPath)) {
        return JSON.parse(fs.readFileSync(this.settingsPath, 'utf-8'));
      }
    } catch (e) {
      console.error('[Storage] Error reading settings:', e.message);
    }
    return {};
  }

  // Save application settings
  saveSettings(settings) {
    if (!this.initialized) return false;

    try {
      fs.writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('[Storage] Error saving settings:', e.message);
      return false;
    }
  }

  // Get runtime configuration
  getRuntimeConfig() {
    const settings = this.getSettings();
    return settings.runtime || {};
  }

  // Save runtime configuration
  saveRuntimeConfig(config) {
    const settings = this.getSettings();
    settings.runtime = config;
    return this.saveSettings(settings);
  }

  // Flush any pending writes (for shutdown)
  flush() {
    // Settings are written synchronously, nothing to flush
  }

  // Get storage paths for diagnostics
  getPaths() {
    return {
      userData: this.userDataPath,
      projects: this.projectsPath,
      settings: this.settingsPath,
      backups: this.backupsPath,
      temp: this.tempPath
    };
  }
}

module.exports = { StorageManager };
