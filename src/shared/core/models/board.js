// Board Domain Model
// Platform-independent board definition with validation.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { BOARD_FAMILY, PIN_TYPE, ERROR_MESSAGES } from './constants/index.js';
import { ValidationError, NotFoundError } from './errors/index.js';

/**
 * Represents a board definition with pin definitions, aliases, and capabilities.
 */
export class Board {
  constructor(data) {
    if (!data || !data.id) {
      throw new ValidationError('Board definition requires an id', 'id', data);
    }
    if (!data.name) {
      throw new ValidationError('Board definition requires a name', 'name', data);
    }

    this.id = data.id;
    this.name = data.name;
    this.chip = data.chip || null;
    this.family = data.family || BOARD_FAMILY.ESP32;
    this.flashSize = data.flashSize || null;
    this.clockSpeed = data.clockSpeed || null;
    this.adcBits = data.adcBits || 10;
    this.adcMaxVoltage = data.adcMaxVoltage || 3.3;
    this.builtinLeds = data.builtinLeds || [];
    this.buttons = data.buttons || [];
    this.width = data.width || 200;
    this.height = data.height || 400;
    this.pinPitch = data.pinPitch || 20;
    this.pinStartY = data.pinStartY || 75;
    this.pinAlias = data.pinAlias || {};
    this.hasDualAntenna = data.hasDualAntenna || false;
    this.antennaModes = data.antennaModes || [];

    // Parse pins
    this.leftPins = this._parsePins(data.leftPins || []);
    this.rightPins = this._parsePins(data.rightPins || []);

    // Build lookup maps
    this._pinById = new Map();
    this._pinByGpio = new Map();
    for (const pin of [...this.leftPins, ...this.rightPins]) {
      this._pinById.set(pin.id, pin);
      if (pin.gpio !== null && pin.gpio !== undefined) {
        this._pinByGpio.set(pin.gpio, pin);
      }
    }
  }

  _parsePins(pinData) {
    return pinData.map((p, index) => ({
      id: p.id,
      label: p.label || p.id,
      type: p.type || PIN_TYPE.SIGNAL,
      gpio: p.gpio !== undefined ? p.gpio : null,
      adcChannel: p.adcChannel !== undefined ? p.adcChannel : null,
      dacChannel: p.dacChannel !== undefined ? p.dacChannel : null,
      voltage: p.voltage || null,
      description: p.description || '',
      index: index,
      ...(p.isPower !== undefined ? { isPower: p.isPower } : {}),
      ...(p.isReset !== undefined ? { isReset: p.isReset } : {}),
      ...(p.isAntenna !== undefined ? { isAntenna: p.isAntenna } : {})
    }));
  }

  /**
   * Get all pins (left + right)
   */
  getAllPins() {
    return [...this.leftPins, ...this.rightPins];
  }

  /**
   * Find a pin by its board pin ID (e.g. 'D2', 'A0', 'GND')
   */
  findPinById(pinId) {
    return this._pinById.get(pinId) || null;
  }

  /**
   * Find a pin by GPIO number
   */
  findPinByGpio(gpio) {
    return this._pinByGpio.get(gpio) || null;
  }

  /**
   * Resolve a pin alias (e.g. 'LED_BUILTIN', 'D4') to a pin definition
   */
  resolveAlias(alias) {
    if (!alias) return null;
    const upper = alias.toUpperCase();
    const gpio = this.pinAlias[upper];
    if (gpio !== undefined) {
      return this.findPinByGpio(gpio);
    }
    // Try direct ID match
    return this.findPinById(alias) || null;
  }

  /**
   * Check if a board pin ID exists
   */
  hasPin(pinId) {
    return this._pinById.has(pinId);
  }

  /**
   * Get GPIO pins only
   */
  getGpioPins() {
    return this.getAllPins().filter(p => p.type === PIN_TYPE.SIGNAL && p.gpio !== null);
  }

  /**
   * Get power pins only
   */
  getPowerPins() {
    return this.getAllPins().filter(p => p.type === PIN_TYPE.POWER);
  }

  /**
   * Get ground pins only
   */
  getGndPins() {
    return this.getAllPins().filter(p => p.type === PIN_TYPE.GND);
  }

  /**
   * Get ADC pins only
   */
  getAdcPins() {
    return this.getAllPins().filter(p => p.type === PIN_TYPE.SIGNAL && p.adcChannel !== null);
  }

  /**
   * Check if the board has dual antenna support
   */
  hasDualAntennaSupport() {
    return this.hasDualAntenna === true;
  }

  /**
   * Convert to plain object (for serialization)
   */
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      chip: this.chip,
      family: this.family,
      flashSize: this.flashSize,
      clockSpeed: this.clockSpeed,
      adcBits: this.adcBits,
      adcMaxVoltage: this.adcMaxVoltage,
      builtinLeds: this.builtinLeds,
      buttons: this.buttons,
      width: this.width,
      height: this.height,
      pinPitch: this.pinPitch,
      pinStartY: this.pinStartY,
      pinAlias: this.pinAlias,
      hasDualAntenna: this.hasDualAntenna,
      antennaModes: this.antennaModes,
      leftPins: this.leftPins,
      rightPins: this.rightPins
    };
  }

  /**
   * Create a Board from a plain object (legacy format)
   */
  static fromLegacy(data) {
    return new Board(data);
  }
}

/**
 * Validate board data structure.
 * Returns { valid: true } or throws ValidationError.
 */
export function validateBoard(board) {
  if (!board) {
    throw new ValidationError('Board is required', 'board', board);
  }
  if (typeof board.id !== 'string' || board.id.length === 0) {
    throw new ValidationError('Board id must be a non-empty string', 'id', board.id);
  }
  if (typeof board.name !== 'string' || board.name.length === 0) {
    throw new ValidationError('Board name must be a non-empty string', 'name', board.name);
  }
  if (!Object.values(BOARD_FAMILY).includes(board.family)) {
    throw new ValidationError(
      `Invalid board family: ${board.family}. Must be one of: ${Object.values(BOARD_FAMILY).join(', ')}`,
      'family',
      board.family
    );
  }
  if (board.adcBits !== undefined && (typeof board.adcBits !== 'number' || board.adcBits < 1)) {
    throw new ValidationError('Board adcBits must be a positive number', 'adcBits', board.adcBits);
  }
  return { valid: true };
}

/**
 * Validate that a pin reference is valid for the given board.
 */
export function validatePinReference(board, pinId) {
  if (!board) {
    throw new ValidationError('Board is required for pin validation', 'board', board);
  }
  if (!pinId) {
    throw new ValidationError('Pin ID is required', 'pinId', pinId);
  }
  if (!board.hasPin(pinId)) {
    throw new NotFoundError(
      ERROR_MESSAGES.INVALID_PIN(pinId),
      'pin',
      pinId
    );
  }
  return { valid: true, pin: board.findPinById(pinId) };
}

export default { Board, validateBoard, validatePinReference };
