// Browser Storage Adapter
// Provides project persistence via browser localStorage.
// Used by the browser/PWA platform adapter.

export class BrowserStorageAdapter {
  constructor(options = {}) {
    this.storageKey = options.storageKey || 'esp-simulator-projects';
  }

  async getAll() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  async save(project) {
    const projects = await this.getAll();
    const existingIdx = projects.findIndex(p => p.id === project.id);
    const entry = {
      ...project,
      updatedAt: new Date().toISOString()
    };
    if (existingIdx >= 0) {
      projects[existingIdx] = entry;
    } else {
      projects.push(entry);
    }
    localStorage.setItem(this.storageKey, JSON.stringify(projects));
    return { success: true, filename: `${project.id}.json`, path: `localstorage:${project.id}.json` };
  }

  async load(id) {
    const projects = await this.getAll();
    const entry = projects.find(p => p.id === id);
    return entry || null;
  }

  async delete(id) {
    const projects = await this.getAll();
    const filtered = projects.filter(p => p.id !== id);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
    return { success: true };
  }

  async exists(id) {
    const projects = await this.getAll();
    return projects.some(p => p.id === id);
  }
}

export default BrowserStorageAdapter;
