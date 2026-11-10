// Component Validation
// Platform-independent component validation logic.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { COMPONENT_CATEGORY, PIN_TYPE } from './constants/index.js';
import { ValidationError } from './errors/index.js';

/**
 * Validate component definition structure.
 * Returns { valid: true } or throws ValidationError.
 */
export function validateComponentData(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Component data must be an object', 'data', data);
  }

  if (typeof data.type !== 'string' || data.type.length === 0) {
    throw new ValidationError('Component type must be a non-empty string', 'type', data.type);
  }

  if (typeof data.name !== 'string' || data.name.length === 0) {
    throw new ValidationError('Component name must be a non-empty string', 'name', data.name);
  }

  if (data.category && !Object.values(COMPONENT_CATEGORY).includes(data.category)) {
    throw new ValidationError(
      `Invalid component category: ${data.category}`,
      'category',
      data.category
    );
  }

  if (data.width !== undefined && (typeof data.width !== 'number' || data.width <= 0)) {
    throw new ValidationError('Component width must be a positive number', 'width', data.width);
  }

  if (data.height !== undefined && (typeof data.height !== 'number' || data.height <= 0)) {
    throw new ValidationError('Component height must be a positive number', 'height', data.height);
  }

  // Validate pins if present
  if (data.pins) {
    if (!Array.isArray(data.pins)) {
      throw new ValidationError('Component pins must be an array', 'pins', data.pins);
    }
    data.pins.forEach((pin, index) => {
      if (!pin || !pin.id) {
        throw new ValidationError(`Component pins[${index}] must have an id`, 'pins', data.pins[index]);
      }
      if (pin.type && !Object.values(PIN_TYPE).includes(pin.type)) {
        throw new ValidationError(
          `Component pins[${index}] has invalid type: ${pin.type}`,
          'pins',
          data.pins[index]
        );
      }
    });
  }

  return { valid: true };
}

/**
 * Validate component instance data.
 */
export function validateComponentInstance(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Component instance must be an object', 'data', data);
  }

  if (typeof data.id !== 'string' || data.id.length === 0) {
    throw new ValidationError('Component instance id must be a non-empty string', 'id', data.id);
  }

  if (typeof data.type !== 'string' || data.type.length === 0) {
    throw new ValidationError('Component instance type must be a non-empty string', 'type', data.type);
  }

  return { valid: true };
}

export default { validateComponentData, validateComponentInstance };
