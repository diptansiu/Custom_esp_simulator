// Circuit Service
// Application service for circuit/netlist operations.
// Depends on shared core models and contracts only.

import { CircuitNet } from '../shared/core/models/circuit.js';
import { validateWire } from '../shared/core/models/circuit.js';
import { ValidationError } from '../shared/core/errors/index.js';

export class CircuitService {
  constructor(options = {}) {
    this.circuitNet = options.circuitNet || new CircuitNet();
    this.eventBus = options.eventBus || null;
  }

  /**
   * Get the underlying circuit net.
   */
  getCircuitNet() {
    return this.circuitNet;
  }

  /**
   * Add a wire connection between two pins.
   */
  addWire(from, to, color = '#38bdf8') {
    validateWire(from, to);

    const wire = this.circuitNet.addWire(from, to, color);
    if (!wire) {
      throw new ValidationError(
        `Duplicate wire connection: ${from.target}:${from.pin} -> ${to.target}:${to.pin}`,
        'wire',
        { from, to }
      );
    }

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
   */
  removeWire(wireId) {
    const wire = this.circuitNet.getWire(wireId);
    if (!wire) {
      throw new ValidationError(`Wire not found: ${wireId}`, 'wireId', wireId);
    }

    this.circuitNet.removeWire(wireId);

    this._publish('connection:removed', {
      wireId,
      from: { ...wire.from },
      to: { ...wire.to }
    });

    return { success: true };
  }

  /**
   * Remove all wires connected to a target.
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
    this._publish('circuit:updated', { wiresCleared: true, previousCount: wireCount });
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
   * Publish an event if event bus is available.
   */
  _publish(eventType, payload) {
    if (this.eventBus && typeof this.eventBus.publish === 'function') {
      this.eventBus.publish(eventType, payload);
    }
  }
}

export default CircuitService;
