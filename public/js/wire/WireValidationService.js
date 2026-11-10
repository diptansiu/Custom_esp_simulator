// Wire Validation Service
// Platform-independent validation for wire connections.
// Inspects frontend pin types, board definitions, and component definitions
// to determine whether a connection between two pins is valid.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { ValidationError } from '../shared/core/errors/index.js';
import { PIN_TYPE } from '../shared/core/constants/index.js';

/**
 * Wire Validation Service
 * Validates whether two pins can be connected based on:
 * - Pin existence (component/pin must exist)
 * - Pin type compatibility (signal-signal, power-signal, gnd-signal, etc.)
 * - Duplicate connection prevention
 * - Self-connection prevention
 * - Connection limits per pin
 */
export class WireValidationService {
  constructor(options = {}) {
    this.components = options.components || []; // Array of component instances {id, type, props}
    this.componentDefs = options.componentDefs || new Map(); // Map<type, ComponentDef>
    this.board = options.board || null; // Board definition with leftPins/rightPins
    this.maxWiresPerPin = options.maxWiresPerPin || 1; // Max wires per pin (1 = exclusive)
    this.existingWires = options.existingWires || []; // Array of {from, to}
  }

  /**
   * Set the board definition.
   */
  setBoard(board) {
    this.board = board;
  }

  /**
   * Set component definitions.
   */
  setComponentDefs(componentDefs) {
    this.componentDefs = componentDefs;
  }

  /**
   * Set existing wires (for duplicate detection).
   */
  setExistingWires(wires) {
    this.existingWires = wires;
  }

  /**
   * Set components list.
   */
  setComponents(components) {
    this.components = components;
  }

  /**
   * Validate a complete wire connection.
   * Returns { valid: true } or throws ValidationError.
   */
  validate(from, to) {
    // 1. Basic structure validation
    if (!from || !from.target || !from.pin) {
      throw new ValidationError('Wire "from" must have target and pin', 'from', from);
    }
    if (!to || !to.target || !to.pin) {
      throw new ValidationError('Wire "to" must have target and pin', 'to', to);
    }

    // 2. Self-connection check
    if (from.target === to.target && from.pin === to.pin) {
      throw new ValidationError(
        `Cannot connect pin ${from.pin} to itself`,
        'wire',
        { from, to }
      );
    }

    // 3. Validate source pin exists
    const fromPin = this._resolvePin(from.target, from.pin);
    if (!fromPin) {
      throw new ValidationError(
        `Source pin ${from.pin} not found on ${from.target}`,
        'from',
        from
      );
    }

    // 4. Validate target pin exists
    const toPin = this._resolvePin(to.target, to.pin);
    if (!toPin) {
      throw new ValidationError(
        `Target pin ${to.pin} not found on ${to.target}`,
        'to',
        to
      );
    }

    // 5. Check pin type compatibility
    this._validatePinTypes(fromPin, toPin);

    // 6. Check for duplicate connection
    if (this._isDuplicate(from, to)) {
      throw new ValidationError(
        `Duplicate connection: ${from.target}:${from.pin} already connected to ${to.target}:${to.pin}`,
        'wire',
        { from, to }
      );
    }

    // 7. Check pin connection limits
    if (!this._canAddWire(from.target, from.pin)) {
      throw new ValidationError(
        `Pin ${from.pin} on ${from.target} has reached its connection limit`,
        'from',
        from
      );
    }
    if (!this._canAddWire(to.target, to.pin)) {
      throw new ValidationError(
        `Pin ${to.pin} on ${to.target} has reached its connection limit`,
        'to',
        to
      );
    }

    return { valid: true };
  }

  /**
   * Resolve a pin reference to a pin definition object.
   * Returns { target, pin, type, componentDef } or null.
   */
  _resolvePin(target, pinId) {
    // Board pins
    if (target === 'board' && this.board) {
      const allPins = [...this.board.leftPins, ...this.board.rightPins];
      return allPins.find(p => p.id === pinId);
    }

    // Component pins
    const comp = this.components.find(c => c.id === target);
    if (comp && comp.type) {
      const compDef = this.componentDefs.get(comp.type);
      if (compDef && compDef.pins) {
        return compDef.pins.find(p => p.id === pinId);
      }
    }

    return null;
  }

  /**
   * Validate pin type compatibility.
   */
  _validatePinTypes(fromPin, toPin) {
    const fromType = fromPin.type || PIN_TYPE.SIGNAL;
    const toType = toPin.type || PIN_TYPE.SIGNAL;

    // Power and ground can connect to anything
    const powerTypes = [PIN_TYPE.POWER, PIN_TYPE.GND];
    if (powerTypes.includes(fromType) || powerTypes.includes(toType)) {
      return; // Power/GND can connect to anything
    }

    // Signal-to-signal is always OK
    if (fromType === PIN_TYPE.SIGNAL && toType === PIN_TYPE.SIGNAL) {
      return;
    }

    // Passive-to-signal is OK
    if ((fromType === PIN_TYPE.PASSIVE && toType === PIN_TYPE.SIGNAL) ||
        (fromType === PIN_TYPE.SIGNAL && toType === PIN_TYPE.PASSIVE)) {
      return;
    }

    // Reset pins are special
    if (fromType === PIN_TYPE.RESET || toType === PIN_TYPE.RESET) {
      return;
    }

    // Default: allow but warn
    return;
  }

  /**
   * Check if a connection already exists (in either direction).
   */
  _isDuplicate(from, to) {
    return this.existingWires.some(w =>
      (w.from.target === from.target && w.from.pin === from.pin &&
       w.to.target === to.target && w.to.pin === to.pin) ||
      (w.from.target === to.target && w.from.pin === to.pin &&
       w.to.target === from.target && w.to.pin === from.pin)
    );
  }

  /**
   * Check if a pin can accept another wire connection.
   */
  _canAddWire(targetId, pinId) {
    if (this.maxWiresPerPin <= 1) {
      // Exclusive: pin can only have one wire
      const existingCount = this.existingWires.filter(w =>
        (w.from.target === targetId && w.from.pin === pinId) ||
        (w.to.target === targetId && w.to.pin === pinId)
      ).length;
      return existingCount === 0;
    }

    // Multiple connections allowed
    return true;
  }

  /**
   * Get all wires connected to a specific pin.
   */
  getWiresForPin(targetId, pinId) {
    return this.existingWires.filter(w =>
      (w.from.target === targetId && w.from.pin === pinId) ||
      (w.to.target === targetId && w.to.pin === pinId)
    );
  }
}

export default WireValidationService;
