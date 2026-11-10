// Project Schema Contract
// Platform-independent project schema definition with versioning and migration support.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { LANGUAGE, RUNNER_MODE, PROJECT_SCHEMA_VERSION, ERROR_MESSAGES } from './constants/index.js';
import { ValidationError } from './errors/index.js';

// Project schema version history
export const SCHEMA_VERSIONS = {
  1: {
    version: 1,
    released: '2026-11-08',
    description: 'Initial project schema',
    fields: {
      id: { type: 'string', required: true, description: 'Unique project ID' },
      name: { type: 'string', required: true, description: 'Project display name' },
      schemaVersion: { type: 'number', required: true, description: 'Schema version number' },
      board: { type: 'string', required: true, description: 'Selected board ID' },
      language: { type: 'string', required: true, enum: Object.values(LANGUAGE), description: 'Source language' },
      runnerMode: { type: 'string', required: true, enum: Object.values(RUNNER_MODE), description: 'Execution runner mode' },
      code: { type: 'string', required: true, description: 'Source code' },
      components: { type: 'array', required: true, description: 'Component instances' },
      wires: { type: 'array', required: true, description: 'Wire connections' },
      description: { type: 'string', optional: true, description: 'Project description' },
      createdAt: { type: 'string', optional: true, description: 'Creation timestamp (ISO 8601)' },
      updatedAt: { type: 'string', optional: true, description: 'Last update timestamp (ISO 8601)' },
      assetReferences: { type: 'array', optional: true, description: 'External asset references' }
    }
  }
};

/**
 * Get the latest schema version.
 */
export function getLatestSchemaVersion() {
  return PROJECT_SCHEMA_VERSION;
}

/**
 * Get schema definition for a specific version.
 * Returns the schema object or null if not found.
 */
export function getSchema(version) {
  return SCHEMA_VERSIONS[version] || null;
}

/**
 * Validate a project object against the schema for its version.
 * Returns { valid: true } or throws ValidationError.
 */
export function validateProjectAgainstSchema(project) {
  if (!project || typeof project !== 'object') {
    throw new ValidationError('Project must be an object', 'project', project);
  }

  const version = project.schemaVersion || 1;
  const schema = getSchema(version);

  if (!schema) {
    throw new ValidationError(
      `Unknown project schema version: ${version}`,
      'schemaVersion',
      version
    );
  }

  // Validate required fields
  for (const [fieldName, fieldDef] of Object.entries(schema.fields)) {
    if (fieldDef.required && !(fieldName in project)) {
      throw new ValidationError(
        `Project missing required field: ${fieldName}`,
        fieldName,
        project[fieldName]
      );
    }

    if (fieldName in project && project[fieldName] !== undefined) {
      const value = project[fieldName];

      // Type check
      if (fieldDef.type === 'string' && typeof value !== 'string') {
        throw new ValidationError(
          `Project field ${fieldName} must be a string`,
          fieldName,
          value
        );
      }
      if (fieldDef.type === 'number' && typeof value !== 'number') {
        throw new ValidationError(
          `Project field ${fieldName} must be a number`,
          fieldName,
          value
        );
      }
      if (fieldDef.type === 'array' && !Array.isArray(value)) {
        throw new ValidationError(
          `Project field ${fieldName} must be an array`,
          fieldName,
          value
        );
      }

      // Enum check
      if (fieldDef.enum && !fieldDef.enum.includes(value)) {
        throw new ValidationError(
          `Project field ${fieldName} value "${value}" not in allowed enum: ${fieldDef.enum.join(', ')}`,
          fieldName,
          value
        );
      }
    }
  }

  return { valid: true, schemaVersion: version };
}

/**
 * Check if a project needs migration.
 */
export function needsMigration(project) {
  if (!project || typeof project.schemaVersion !== 'number') {
    return true;
  }
  return project.schemaVersion < PROJECT_SCHEMA_VERSION;
}

/**
 * Get migration path from current version to latest.
 * Returns an array of version numbers that need to be applied.
 */
export function getMigrationPath(fromVersion) {
  const path = [];
  for (let v = fromVersion; v < PROJECT_SCHEMA_VERSION; v++) {
    path.push(v + 1);
  }
  return path;
}

export default {
  SCHEMA_VERSIONS,
  PROJECT_SCHEMA_VERSION,
  getLatestSchemaVersion,
  getSchema,
  validateProjectAgainstSchema,
  needsMigration,
  getMigrationPath
};
