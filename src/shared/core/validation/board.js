// Board Validation
// Platform-independent board validation logic.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { BOARD_FAMILY } from './constants/index.js';
import { ValidationError } from './errors/index.js';
import { Board } from './models/board.js';

/**
 * Validate board data structure.
 * Returns { valid: true } or throws ValidationError.
 */
export function validateBoardData(data) {
  if (!data || typeof data !== 'object') {
    throw new ValidationError('Board data must be an object', 'data', data);
  }

  if (typeof data.id !== 'string' || data.id.length === 0) {
    throw new ValidationError('Board id must be a non-empty string', 'id', data.id);
  }

  if (typeof data.name !== 'string' || data.name.length === 0) {
    throw new ValidationError('Board name must be a non-empty string', 'name', data.name);
  }

  if (data.family && !Object.values(BOARD_FAMILY).includes(data.family)) {
    throw new ValidationError(
      `Invalid board family: ${data.family}`,
      'family',
      data.family
    );
  }

  if (data.adcBits !== undefined && (typeof data.adcBits !== 'number' || data.adcBits < 1)) {
    throw new ValidationError('Board adcBits must be a positive number', 'adcBits', data.adcBits);
  }

  // Validate pins if present
  if (data.leftPins) {
    if (!Array.isArray(data.leftPins)) {
      throw new ValidationError('Board leftPins must be an array', 'leftPins', data.leftPins);
    }
    data.leftPins.forEach((pin, index) => {
      if (!pin || !pin.id) {
        throw new ValidationError(`Board leftPins[${index}] must have an id`, 'leftPins', data.leftPins[index]);
      }
    });
  }

  if (data.rightPins) {
    if (!Array.isArray(data.rightPins)) {
      throw new ValidationError('Board rightPins must be an array', 'rightPins', data.rightPins);
    }
    data.rightPins.forEach((pin, index) => {
      if (!pin || !pin.id) {
        throw new ValidationError(`Board rightPins[${index}] must have an id`, 'rightPins', data.rightPins[index]);
      }
    });
  }

  return { valid: true };
}

/**
 * Validate that a board ID is known in the board registry.
 */
export function validateBoardId(boardId, availableBoards) {
  if (!boardId || typeof boardId !== 'string') {
    throw new ValidationError('Board ID must be a non-empty string', 'boardId', boardId);
  }

  if (availableBoards && !availableBoards.has(boardId)) {
    throw new ValidationError(
      `Unknown board: ${boardId}`,
      'boardId',
      boardId
    );
  }

  return { valid: true, boardId };
}

/**
 * Create a Board instance from legacy data with validation.
 */
export function createBoard(legacyData) {
  validateBoardData(legacyData);
  return new Board(legacyData);
}

export default { validateBoardData, validateBoardId, createBoard };
