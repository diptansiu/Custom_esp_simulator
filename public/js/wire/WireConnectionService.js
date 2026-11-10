// Wire Connection Service
// Manages wire creation, validation, and lifecycle.
// Depends on shared core CircuitNet model and WireValidationService.
// Platform-independent - no Electron/browser/Node.js dependencies.

import { CircuitNet } from '../shared/core/models/circuit.js';
import { WireValidationService } from './WireValidationService.js';
import { ValidationError } from '../shared/core/errors/index.js';

/**
 * Wire Connection Service
 * Manages the creation, validation, and lifecycle of circuit wire connections.
 * Coordinates between the WireValidationService (validation) and CircuitNet
 * (storage and topology).
 */
export class WireConnectionService {
  constructor(options = {}) {
    this.circuitNet = options.circuitNet || new CircuitNet();
    this.validationService = options.validationService || new WireValidationService();
    this.eventBus = options.eventBus || null;

    // Wire styling defaults
    this.defaultWireColor = options.defaultWireColor || '#38bdf8';
    this.availableWireColors = options.availableWireColors || [
      '#38bdf8', '#34d399', '#fbbf24', '#ef4444', '#1e293b', '#a855f7',
      '#06b6d4', '#f59e0b', '#f97316', '#22c55e'
    ];

    // Track wire IDs for uniqueness
    this._wireCounter = 0;
  }

  /**
   * Set the validation service.
   */
  setValidationService(validationService) {
    this.validationService = validationService;
  }

  /**
   * Set the event bus for publishing connection events.
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
    this.validationService.eventBus = eventBus;
  }

  /**
   * Set board definition for validation.
   */
  setBoard(board) {
    this.validationService.setBoard(board);
  }

  /**
   * Set component definitions for validation.
   */
  setComponentDefs(componentDefs) {
    this.validationService.setComponentDefs(componentDefs);
  }

  /**
   * Set components for validation.
   */
  setComponents(components) {
    this.validationService.setComponents(components);
  }

  /**
   * Set existing wires for duplicate detection.
   */
  setExistingWires(wires) {
    this.validationService.setExistingWires(wires);
  }

  /**
   * Create a wire connection between two pins.
   * Validates the connection, creates the wire, publishes an event.
   * Returns the created Wire object or throws ValidationError.
   */
  createWire(from, to, color = null) {
    // Validate the connection
    this.validationService.validate(from, to);

    // Create the wire
    const wireColor = color || this.defaultWireColor;
    const wire = this.circuitNet.addWire(from, to, wireColor);

    if (!wire) {
      throw new ValidationError(
        `Duplicate wire connection: ${from.target}:${from.pin} -> ${to.target}:${to.pin}`,
        'wire',
        { from, to }
      );
    }

    // Publish connection event
    this._publish('connection:created', {
      wireId: wire.id,
      from: { ...wire.from },
      to: { ...wire.to },
      color: wire.color
    });

    return wire;
  }

  /**
   * Remove a wire by ID.
   * Returns the removed wire or throws if not found.
   */
  removeWire(wireId) {
    const wire = this.circuitNet.getWire(wireId);
    if (!wire) {
      throw new ValidationError(`Wire not found: ${wireId}`, 'wireId', wireId);
    }

    this.circuitNet.removeWire(wireId);

    // Publish removal event
    this._publish('connection:removed', {
      wireId,
      from: { ...wire.from },
      to: { ...wire.to }
    });

    return wire;
  }

  /**
   * Remove all wires connected to a target (component or board).
   * Returns array of removed wires.
   */
  removeWiresConnectedTo(targetId) {
    const removed = this.circuitNet.removeWiresConnectedTo(targetId);

    for (const wire of removed) {
      this._publish('connection:removed', {
        wireId: wire.id,
        from: { ...wire.from },
        to: { ...wire.to }
      });
    }

    return removed;
  }

  /**
   * Clear all wires.
   */
  clearWires() {
    const wireCount = this.circuitNet.getWireCount();
    this.circuitNet.clear();

    this._publish('circuit:updated', {
      wiresCleared: true,
      previousCount: wireCount
    });

    return { success: true, clearedCount: wireCount };
  }

  /**
   * Get all wires.
   */
  getAllWires() {
    return this.circuitNet.getAllWires();
  }

  /**
   * Get wire count.
   */
  getWireCount() {
    return this.circuitNet.getWireCount();
  }

  /**
   * Get a wire by ID.
   */
  getWire(wireId) {
    return this.circuitNet.getWire(wireId);
  }

  /**
   * Subscribe to circuit changes.
   */
  subscribe(callback) {
    return this.circuitNet.subscribe(callback);
  }

  /**
   * Build the adjacency graph for circuit solving.
   */
  buildGraph(components = []) {
    return this.circuitNet.buildGraph(components);
  }

  /**
   * Find all connected nodes in a net.
   */
  findNet(startNode, components = []) {
    return this.circuitNet.findNet(startNode, components);
  }

  /**
   * Check if a net connects to GND.
   */
  isNetGnd(net) {
    return this.circuitNet.isNetGnd(net);
  }

  /**
   * Check if a net connects to VCC/Power.
   */
  isNetVcc(net) {
    return this.circuitNet.isNetVcc(net);
  }

  /**
   * Validate a wire connection without creating it.
   * Returns { valid: true } or throws ValidationError.
   */
  validateConnection(from, to) {
    return this.validationService.validate(from, to);
  }

  /**
   * Set default wire color.
   */
  setDefaultWireColor(color) {
    this.defaultWireColor = color;
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

export default WireConnectionService;
