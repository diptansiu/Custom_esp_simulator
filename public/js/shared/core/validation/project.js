// Project Validation
// Platform-independent project validation logic.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { LANGUAGE, RUNNER_MODE, PROJECT_SCHEMA_VERSION } from './constants/index.js';
import { ValidationError } from './errors/index.js';

/**
 * Validate project data structure.
 * Returns { valid: true } or throws ValidationError.
 */
export function validateProjectData(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Project data must be an object', 'data', data);
  }

  if (data.schemaVersion !== undefined && typeof data.schemaVersion !== 'number') {
    throw new ValidationError('Project schemaVersion must be a number', 'schemaVersion', data.schemaVersion);
  }

  if (data.name !== undefined && (typeof data.name !== 'string' || data.name.length === 0)) {
    throw new ValidationError('Project name must be a non-empty string', 'name', data.name);
  }

  if (data.board !== undefined && (typeof data.board !== 'string' || data.board.length === 0)) {
    throw new ValidationError('Project board must be a non-empty string', 'board', data.board);
  }

  if (data.language !== undefined && !Object.values(LANGUAGE).includes(data.language)) {
    throw new ValidationError(
      `Invalid project language: ${data.language}. Must be one of: ${Object.values(LANGUAGE).join(', ')}`,
      'language',
      data.language
    );
  }

  if (data.runnerMode !== undefined && !Object.values(RUNNER_MODE).includes(data.runnerMode)) {
    throw new ValidationError(
      `Invalid project runnerMode: ${data.runnerMode}. Must be one of: ${Object.values(RUNNER_MODE).join(', ')}`,
      'runnerMode',
      data.runnerMode
    );
  }

  if (data.code !== undefined && typeof data.code !== 'string') {
    throw new ValidationError('Project code must be a string', 'code', data.code);
  }

  if (data.components !== undefined && !Array.isArray(data.components)) {
    throw new ValidationError('Project components must be an array', 'components', data.components);
  }

  if (data.wires !== undefined && !Array.isArray(data.wires)) {
    throw new ValidationError('Project wires must be an array', 'wires', data.wires);
  }

  // Validate components
  if (Array.isArray(data.components)) {
    data.components.forEach((comp, index) => {
      if (!comp || typeof comp.id !== 'string' || comp.id.length === 0) {
        throw new ValidationError(`Project components[${index}] must have a non-empty id`, 'components', data.components[index]);
      }
      if (!comp || typeof comp.type !== 'string' || comp.type.length === 0) {
        throw new ValidationError(`Project components[${index}] must have a non-empty type`, 'components', data.components[index]);
      }
    });
  }

  // Validate wires
  if (Array.isArray(data.wires)) {
    data.wires.forEach((wire, index) => {
      if (!wire || !wire.from || !wire.from.target || !wire.from.pin) {
        throw new ValidationError(`Project wires[${index}] from must have target and pin`, 'wires', data.wires[index]);
      }
      if (!wire || !wire.to || !wire.to.target || !wire.to.pin) {
        throw new ValidationError(`Project wires[${index}] to must have target and pin`, 'wires', data.wires[index]);
      }
    });
  }

  return { valid: true };
}

/**
 * Validate project import data from file or API.
 * Returns { valid: true } or throws ValidationError.
 */
export function validateProjectImport(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Project import data must be an object', 'data', data);
  }

  // Check for required fields
  const requiredFields = ['board', 'language'];
  for (const field of requiredFields) {
    if (!(field in data)) {
      throw new ValidationError(`Project import missing required field: ${field}`, field, data[field]);
    }
  }

  validateProjectData(data);
  return { valid: true };
}

/**
 * Validate project export data before serialization.
 */
export function validateProjectExport(data) {
  return validateProjectData(data);
}

export default { validateProjectData, validateProjectImport, validateProjectExport };
