// Project Service
// Application service for project management operations.
// Depends on shared core models and contracts only.
// Platform infrastructure (persistence) is injected through the constructor.

import { Project, validateProjectImport, validateProjectExport } from '../shared/core/models/project.js';
import { ValidationError, StorageError } from '../shared/core/errors/index.js';

export class ProjectService {
  constructor(options = {}) {
    this.repository = options.repository || null;
    this.validator = options.validator || null;
    this.eventBus = options.eventBus || null;
  }

  /**
   * Set the persistence repository.
   */
  setRepository(repository) {
    this.repository = repository;
  }

  /**
   * Set the event bus for publishing events.
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Publish an event if event bus is available.
   */
  _publish(eventType, payload) {
    if (this.eventBus && typeof this.eventBus.publish === 'function') {
      this.eventBus.publish(eventType, payload);
    }
  }

  /**
   * Create a new blank project.
   */
  createProject(name, board, language = 'cpp') {
    const project = Project.createBlank(name, board, language);
    project.validate();
    this._publish('project:created', { projectId: project.id, projectName: project.name, board: project.board });
    return project;
  }

  /**
   * Save a project through the repository.
   */
  async saveProject(projectData) {
    if (!this.repository) {
      throw new Error('Project repository not configured');
    }

    const project = Project.fromJSON(projectData);
    project.validate();

    try {
      const result = await this.repository.save(project);
      this._publish('project:saved', {
        projectId: project.id,
        projectName: project.name,
        board: project.board,
        filename: result.filename || result.path
      });
      return { success: true, ...result };
    } catch (err) {
      if (err instanceof StorageError || err instanceof ValidationError) {
        throw err;
      }
      throw new StorageError(`Failed to save project: ${err.message}`, 'save', projectData.filename || projectData.name);
    }
  }

  /**
   * Load a project by ID through the repository.
   */
  async loadProject(projectId) {
    if (!this.repository) {
      throw new Error('Project repository not configured');
    }

    try {
      const data = await this.repository.load(projectId);
      if (!data) {
        throw new Error(`Project not found: ${projectId}`);
      }

      const project = Project.fromJSON(data);
      project.validate();

      this._publish('project:loaded', {
        projectId: project.id,
        projectName: project.name,
        board: project.board
      });

      return { success: true, project: project.toJSON() };
    } catch (err) {
      if (err instanceof ValidationError) {
        throw err;
      }
      throw new StorageError(`Failed to load project: ${err.message}`, 'load', projectId);
    }
  }

  /**
   * Get all projects through the repository.
   */
  async getAllProjects() {
    if (!this.repository) {
      throw new Error('Project repository not configured');
    }

    try {
      const projects = await this.repository.getAll();
      return { success: true, projects };
    } catch (err) {
      throw new StorageError(`Failed to get projects: ${err.message}`, 'list');
    }
  }

  /**
   * Delete a project through the repository.
   */
  async deleteProject(projectId) {
    if (!this.repository) {
      throw new Error('Project repository not configured');
    }

    try {
      const success = await this.repository.delete(projectId);
      if (success) {
        this._publish('project:deleted', { projectId });
      }
      return { success };
    } catch (err) {
      throw new StorageError(`Failed to delete project: ${err.message}`, 'delete', projectId);
    }
  }

  /**
   * Import a project from parsed data.
   */
  async importProject(data) {
    const validation = validateProjectImport(data);
    if (!validation.valid) {
      throw new ValidationError('Project import validation failed');
    }

    const project = validation.project;
    return this.saveProject(project.toJSON());
  }

  /**
   * Export project data for download or file save.
   */
  exportProject(projectData) {
    const validation = validateProjectExport(projectData);
    if (!validation.valid) {
      throw new ValidationError('Project export validation failed');
    }

    const project = Project.fromJSON(projectData);
    const exported = {
      ...project.toJSON(),
      exportedAt: new Date().toISOString(),
      exportFormat: 'esp-simulator-v1'
    };

    this._publish('project:exported', {
      projectId: project.id,
      projectName: project.name
    });

    return { success: true, data: exported };
  }
}

export default ProjectService;
