// Wire Removal Service
// Handles individual wire removal, multi-wire removal, and component
// deletion cleanup. Depends on WireConnectionService.
// Platform-independent - no Electron/browser/Node.js dependencies.

import { ValidationError } from '../shared/core/errors/index.js';

/**
 * Wire Removal Service
 * Manages wire removal with proper cleanup, event publishing, and undo support.
 */
export class WireRemovalService {
  constructor(options = {}) {
    this.connectionService = options.connectionService || null;
    this.eventBus = options.eventBus || null;
    this.removedHistory = []; // For undo support
    this.maxHistory = options.maxHistory || 50;
  }

  /**
   * Set the connection service.
   */
  setConnectionService(connectionService) {
    this.connectionService = connectionService;
  }

  /**
   * Set the event bus.
   */
  setEventBus(eventBus) {
    this.eventBus = eventBus;
  }

  /**
   * Remove a single wire by ID.
   * Returns the removed wire data or throws if not found.
   */
  removeWire(wireId) {
    if (!this.connectionService) {
      throw new ValidationError('Connection service not initialized');
    }

    const wire = this.connectionService.getWire(wireId);
    if (!wire) {
      throw new ValidationError(`Wire not found: ${wireId}`, 'wireId', wireId);
    }

    // Save for undo
    this._pushHistory({
      action: 'remove',
      wire: { ...wire }
    });

    this.connectionService.removeWire(wireId);

    return wire;
  }

  /**
   * Remove multiple wires by IDs.
   * Returns array of removed wires.
   */
  removeWires(wireIds) {
    const removed = [];
    for (const wireId of wireIds) {
      try {
        const wire = this.removeWire(wireId);
        removed.push(wire);
      } catch {
        // Skip wires that can't be removed
      }
    }
    return removed;
  }

  /**
   * Remove all wires connected to a target (component or board).
   * When a component is deleted, all its wires must be removed too.
   * Returns array of removed wires.
   */
  removeWiresConnectedTo(targetId) {
    if (!this.connectionService) {
      throw new ValidationError('Connection service not initialized');
    }

    const wires = this.connectionService.getAllWires().filter(w =>
      w.from.target === targetId || w.to.target === targetId
    );

    for (const wire of wires) {
      this._pushHistory({
        action: 'remove',
        wire: { ...wire }
      });
    }

    return this.connectionService.removeWiresConnectedTo(targetId);
  }

  /**
   * Clear all wires.
   * Returns count of cleared wires.
   */
  clearAllWires() {
    if (!this.connectionService) {
      throw new ValidationError('Connection service not initialized');
    }

    const wires = this.connectionService.getAllWires();
    for (const wire of wires) {
      this._pushHistory({
        action: 'remove',
        wire: { ...wire }
      });
    }

    return this.connectionService.clearWires();
  }

  /**
   * Undo the last wire removal.
   * Returns the restored wire or null if nothing to undo.
   */
  undo() {
    const entry = this.removedHistory.pop();
    if (!entry) return null;

    if (entry.action === 'remove' && entry.wire) {
      // Re-create the wire
      this.connectionService.createWire(entry.wire.from, entry.wire.to, entry.wire.color);
      return entry.wire;
    }

    return null;
  }

  /**
   * Get the undo history.
   */
  getHistory() {
    return [...this.removedHistory];
  }

  /**
   * Clear the undo history.
   */
  clearHistory() {
    this.removedHistory = [];
  }

  /**
   * Push an entry to the history stack.
   */
  _pushHistory(entry) {
    this.removedHistory.push(entry);
    if (this.removedHistory.length > this.maxHistory) {
      this.removedHistory.shift();
    }
  }
}

export default WireRemovalService;
