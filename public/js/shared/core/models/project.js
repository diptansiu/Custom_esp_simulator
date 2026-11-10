// Project Domain Model
// Platform-independent project definition with schema versioning and migration support.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { ERROR_MESSAGES, PROJECT_SCHEMA_VERSION, LANGUAGE, RUNNER_MODE } from './constants/index.js';
import { ValidationError, StorageError } from './errors/index.js';
import { CircuitNet } from './circuit.js';

/**
 * Project schema migration history.
 * Each migration transforms a project from version N to version N+1.
 */
const MIGRATIONS = {
  // No migrations yet - schema v1 is the initial version
  // Future migrations go here:
  // 1: (project) => { /* v1 -> v2 */ return { ...project, schemaVersion: 2 }; }
};

/**
 * Represents a project with board, code, components, wires, and metadata.
 */
export class Project {
  constructor(data = {}) {
    this.id = data.id || 'project_' + Math.random().toString(36).substring(2, 9);
    this.name = data.name || 'Untitled Project';
    this.schemaVersion = data.schemaVersion || PROJECT_SCHEMA_VERSION;
    this.board = data.board || 'esp8266-nodemcu';
    this.language = data.language || LANGUAGE.CPP;
    this.runnerMode = data.runnerMode || RUNNER_MODE.BROWSER;
    this.code = data.code || '';
    this.components = data.components || [];
    this.wires = data.wires || [];
    this.description = data.description || '';
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
    this.assetReferences = data.assetReferences || [];
  }

  /**
   * Migrate project to the latest schema version.
   * Returns a new Project instance with the migrated data.
   * Does not modify the original instance.
   */
  migrate() {
    let migrated = { ...this, schemaVersion: this.schemaVersion };
    let currentVersion = migrated.schemaVersion;

    while (MIGRATIONS[currentVersion]) {
      migrated = MIGRATIONS[currentVersion](migrated);
      currentVersion = migrated.schemaVersion;
    }

    if (currentVersion !== this.schemaVersion) {
      return new Project(migrated);
    }
    return this;
  }

  /**
   * Validate the project structure.
   * Returns { valid: true } or throws ValidationError.
   */
  validate() {
    if (!this.name || typeof this.name !== 'string') {
      throw new ValidationError('Project name must be a non-empty string', 'name', this.name);
    }
    if (!this.board || typeof this.board !== 'string') {
      throw new ValidationError('Project board must be a non-empty string', 'board', this.board);
    }
    if (!Object.values(LANGUAGE).includes(this.language)) {
      throw new ValidationError(
        `Invalid language: ${this.language}. Must be one of: ${Object.values(LANGUAGE).join(', ')}`,
        'language',
        this.language
      );
    }
    if (!Object.values(RUNNER_MODE).includes(this.runnerMode)) {
      throw new ValidationError(
        `Invalid runnerMode: ${this.runnerMode}. Must be one of: ${Object.values(RUNNER_MODE).join(', ')}`,
        'runnerMode',
        this.runnerMode
      );
    }
    if (typeof this.code !== 'string') {
      throw new ValidationError('Project code must be a string', 'code', this.code);
    }
    if (!Array.isArray(this.components)) {
      throw new ValidationError('Project components must be an array', 'components', this.components);
    }
    if (!Array.isArray(this.wires)) {
      throw new ValidationError('Project wires must be an array', 'wires', this.wires);
    }
    return { valid: true };
  }

  /**
   * Export project data for serialization.
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      schemaVersion: this.schemaVersion,
      board: this.board,
      language: this.language,
      runnerMode: this.runnerMode,
      code: this.code,
      components: this.components,
      wires: this.wires,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      assetReferences: this.assetReferences
    };
  }

  /**
   * Create a Project from serialized data (with migration).
   */
  static fromJSON(data) {
    if (!data) {
      throw new ValidationError('Project data is required', 'data', data);
    }
    const project = new Project(data);
    return project.migrate();
  }

  /**
   * Create a blank project with default values.
   */
  static createBlank(name = 'Untitled Project', board = 'esp8266-nodemcu', language = LANGUAGE.CPP) {
    return new Project({
      name,
      board,
      language,
      code: language === LANGUAGE.CPP
        ? 'void setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  delay(1000);\n}\n'
        : 'import time\nprint("Hello ESP!")\nwhile True:\n  time.sleep(1)\n',
      components: [],
      wires: []
    });
  }

  /**
   * Clone the project (deep copy).
   */
  clone() {
    return new Project(JSON.parse(JSON.stringify(this.toJSON())));
  }
}

/**
 * Project repository interface definition.
 * Implementations handle persistence (filesystem, localStorage, etc.).
 */
export class ProjectRepository {
  constructor() {
    if (this.constructor === ProjectRepository) {
      throw new Error('ProjectRepository is abstract. Use a concrete implementation.');
    }
  }

  async getAll() {
    throw new Error('getAll() not implemented');
  }

  async save(project) {
    throw new Error('save() not implemented');
  }

  async load(id) {
    throw new Error('load() not implemented');
  }

  async delete(id) {
    throw new Error('delete() not implemented');
  }

  async exists(id) {
    throw new Error('exists() not implemented');
  }
}

/**
 * Validate project import data (from file or API).
 * Returns { valid: true, project: Project } or throws.
 */
export function validateProjectImport(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Project data must be an object', 'data', data);
  }

  const project = Project.fromJSON(data);
  project.validate();
  return { valid: true, project };
}

export default { Project, ProjectRepository, validateProjectImport, PROJECT_SCHEMA_VERSION };
