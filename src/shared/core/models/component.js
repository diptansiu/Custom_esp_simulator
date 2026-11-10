// Component Domain Model
// Platform-independent component definition with validation.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { COMPONENT_CATEGORY, PIN_TYPE, ERROR_MESSAGES } from './constants/index.js';
import { ValidationError, NotFoundError } from './errors/index.js';

/**
 * Represents a component definition with pins, properties, and rendering metadata.
 */
export class Component {
  constructor(data) {
    if (!data || !data.type) {
      throw new ValidationError('Component definition requires a type', 'type', data);
    }
    if (!data.name) {
      throw new ValidationError('Component definition requires a name', 'name', data);
    }

    this.type = data.type;
    this.name = data.name;
    this.category = data.category || COMPONENT_CATEGORY.OTHER;
    this.width = data.width || 50;
    this.height = data.height || 30;
    this.defaultProps = data.defaultProps || {};
    this.colors = data.colors || null;
    this.presets = data.presets || null;

    // Parse pins
    this.pins = this._parsePins(data.pins || []);
    this._pinById = new Map();
    for (const pin of this.pins) {
      this._pinById.set(pin.id, pin);
    }
  }

  _parsePins(pinData) {
    return pinData.map((p) => ({
      id: p.id,
      label: p.label || p.id,
      type: p.type || PIN_TYPE.SIGNAL,
      x: p.x !== undefined ? p.x : 0,
      y: p.y !== undefined ? p.y : 0,
      description: p.description || ''
    }));
  }

  /**
   * Find a pin by its ID
   */
  findPinById(pinId) {
    return this._pinById.get(pinId) || null;
  }

  /**
   * Check if a pin ID exists
   */
  hasPin(pinId) {
    return this._pinById.has(pinId);
  }

  /**
   * Get pins by type
   */
  getPinsByType(pinType) {
    return this.pins.filter(p => p.type === pinType);
  }

  /**
   * Get signal pins only
   */
  getSignalPins() {
    return this.getPinsByType(PIN_TYPE.SIGNAL);
  }

  /**
   * Get power pins only
   */
  getPowerPins() {
    return this.getPinsByType(PIN_TYPE.POWER);
  }

  /**
   * Get ground pins only
   */
  getGndPins() {
    return this.getPinsByType(PIN_TYPE.GND);
  }

  /**
   * Convert to plain object (for serialization)
   */
  toJSON() {
    return {
      type: this.type,
      name: this.name,
      category: this.category,
      width: this.width,
      height: this.height,
      defaultProps: this.defaultProps,
      colors: this.colors,
      presets: this.presets,
      pins: this.pins
    };
  }

  /**
   * Create a Component from a plain object (legacy format)
   */
  static fromLegacy(data) {
    return new Component(data);
  }
}

/**
 * Represents a component instance placed on the canvas.
 */
export class ComponentInstance {
  constructor(data) {
    if (!data || !data.id) {
      throw new ValidationError('Component instance requires an id', 'id', data);
    }
    if (!data.type) {
      throw new ValidationError('Component instance requires a type', 'type', data);
    }

    this.id = data.id;
    this.type = data.type;
    this.x = data.x !== undefined ? data.x : 0;
    this.y = data.y !== undefined ? data.y : 0;
    this.props = data.props || {};
    this.rotation = data.rotation || 0;
  }

  /**
   * Convert to plain object (for serialization)
   */
  toJSON() {
    return {
      id: this.id,
      type: this.type,
      x: this.x,
      y: this.y,
      props: this.props,
      rotation: this.rotation
    };
  }
}

/**
 * Validate component definition structure.
 */
export function validateComponent(component) {
  if (!component) {
    throw new ValidationError('Component is required', 'component', component);
  }
  if (typeof component.type !== 'string' || component.type.length === 0) {
    throw new ValidationError('Component type must be a non-empty string', 'type', component.type);
  }
  if (typeof component.name !== 'string' || component.name.length === 0) {
    throw new ValidationError('Component name must be a non-empty string', 'name', component.name);
  }
  if (!Object.values(COMPONENT_CATEGORY).includes(component.category)) {
    throw new ValidationError(
      `Invalid component category: ${component.category}`,
      'category',
      component.category
    );
  }
  if (component.width !== undefined && (typeof component.width !== 'number' || component.width <= 0)) {
    throw new ValidationError('Component width must be a positive number', 'width', component.width);
  }
  if (component.height !== undefined && (typeof component.height !== 'number' || component.height <= 0)) {
    throw new ValidationError('Component height must be a positive number', 'height', component.height);
  }
  return { valid: true };
}

/**
 * Validate that a pin reference is valid for the given component definition.
 */
export function validateComponentPinReference(componentDef, pinId) {
  if (!componentDef) {
    throw new ValidationError('Component definition is required for pin validation', 'componentDef', componentDef);
  }
  if (!pinId) {
    throw new ValidationError('Pin ID is required', 'pinId', pinId);
  }
  if (!componentDef.hasPin(pinId)) {
    throw new NotFoundError(
      ERROR_MESSAGES.INVALID_PIN(pinId),
      'pin',
      pinId
    );
  }
  return { valid: true, pin: componentDef.findPinById(pinId) };
}

export default { Component, ComponentInstance, validateComponent, validateComponentPinReference };
