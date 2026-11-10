// Component Service
// Application service for component management operations.
// Depends on shared core models and contracts only.

import { Component } from '../shared/core/models/component.js';
import { validateComponentData } from '../shared/core/validation/component.js';
import { ValidationError, NotFoundError } from '../shared/core/errors/index.js';

export class ComponentService {
  constructor(options = {}) {
    this.componentRegistry = options.componentRegistry || new Map();
    this.eventBus = options.eventBus || null;
  }

  /**
   * Register a component definition.
   */
  registerComponent(componentData) {
    validateComponentData(componentData);
    const component = new Component(componentData);
    this.componentRegistry.set(component.type, component);
    return component;
  }

  /**
   * Get a component definition by type.
   */
  getComponent(componentType) {
    const component = this.componentRegistry.get(componentType);
    if (!component) {
      throw new NotFoundError(`Component not found: ${componentType}`, 'component', componentType);
    }
    return component;
  }

  /**
   * Get all registered component definitions.
   */
  getAllComponents() {
    return [...this.componentRegistry.values()];
  }

  /**
   * Get component types only.
   */
  getComponentTypes() {
    return [...this.componentRegistry.keys()];
  }

  /**
   * Check if a component type exists.
   */
  hasComponent(componentType) {
    return this.componentRegistry.has(componentType);
  }

  /**
   * Get components by category.
   */
  getComponentsByCategory(category) {
    return this.getAllComponents().filter(c => c.category === category);
  }

  /**
   * Get all categories.
   */
  getCategories() {
    return [...new Set(this.getAllComponents().map(c => c.category))];
  }

  /**
   * Validate a component instance against its definition.
   */
  validateInstance(instanceData, componentType) {
    const component = this.getComponent(componentType);
    if (!instanceData.id || typeof instanceData.id !== 'string') {
      throw new ValidationError('Component instance must have a non-empty id', 'id', instanceData.id);
    }
    return { valid: true, component };
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
   * Add a component instance (publishes event).
   */
  addComponent(instanceData, componentType) {
    const component = this.getComponent(componentType);
    this.validateInstance(instanceData, componentType);

    const instance = {
      id: instanceData.id,
      type: componentType,
      x: instanceData.x !== undefined ? instanceData.x : 0,
      y: instanceData.y !== undefined ? instanceData.y : 0,
      props: { ...component.defaultProps, ...(instanceData.props || {}) }
    };

    this._publish('component:added', {
      componentId: instance.id,
      componentType: instance.type,
      x: instance.x,
      y: instance.y
    });

    return instance;
  }

  /**
   * Remove a component instance (publishes event).
   */
  removeComponent(componentId) {
    this._publish('component:removed', { componentId });
    return { success: true };
  }

  /**
   * Update component properties (publishes event).
   */
  updateComponent(componentId, updates) {
    this._publish('component:updated', {
      componentId,
      updates
    });
    return { success: true };
  }
}

export default ComponentService;
