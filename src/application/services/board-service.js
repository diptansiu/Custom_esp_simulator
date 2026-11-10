// Board Service
// Application service for board management operations.
// Depends on shared core models and contracts only.

import { Board } from '../shared/core/models/board.js';
import { validateBoardData, validateBoardId } from '../shared/core/validation/board.js';
import { ValidationError, NotFoundError } from '../shared/core/errors/index.js';

export class BoardService {
  constructor(options = {}) {
    this.boardRegistry = options.boardRegistry || new Map();
    this.eventBus = options.eventBus || null;
  }

  /**
   * Register a board definition.
   */
  registerBoard(boardData) {
    validateBoardData(boardData);
    const board = new Board(boardData);
    this.boardRegistry.set(board.id, board);
    return board;
  }

  /**
   * Get a board by ID.
   */
  getBoard(boardId) {
    const board = this.boardRegistry.get(boardId);
    if (!board) {
      throw new NotFoundError(`Board not found: ${boardId}`, 'board', boardId);
    }
    return board;
  }

  /**
   * Get all registered boards.
   */
  getAllBoards() {
    return [...this.boardRegistry.values()];
  }

  /**
   * Get board IDs only.
   */
  getBoardIds() {
    return [...this.boardRegistry.keys()];
  }

  /**
   * Check if a board exists.
   */
  hasBoard(boardId) {
    return this.boardRegistry.has(boardId);
  }

  /**
   * Validate a board ID is known.
   */
  validateBoardId(boardId) {
    return validateBoardId(boardId, this.boardRegistry);
  }

  /**
   * Get boards by family.
   */
  getBoardsByFamily(family) {
    return this.getAllBoards().filter(b => b.family === family);
  }

  /**
   * Get boards that support native execution.
   * Note: native support is determined by backend board profiles,
   * this method returns boards based on family (all ESP8266/ESP32
   * have visual definitions; native support is a runtime concern).
   */
  getNativeSupportedBoards() {
    // All defined boards have visual definitions.
    // Native execution support is determined by the backend
    // (compiler availability + board profile nativeSupported flag).
    return this.getAllBoards();
  }

  /**
   * Resolve a pin alias to a GPIO number.
   */
  resolvePinAlias(boardId, alias) {
    const board = this.getBoard(boardId);
    const pin = board.resolveAlias(alias);
    if (!pin) {
      throw new NotFoundError(`Pin alias not found: ${alias} on board ${boardId}`, 'pin', alias);
    }
    return { pinId: pin.id, gpio: pin.gpio, label: pin.label };
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
   * Select a board (publishes event).
   */
  selectBoard(boardId) {
    const board = this.getBoard(boardId);
    this._publish('board:selected', { boardId: board.id, boardName: board.name, family: board.family });
    return board;
  }
}

export default BoardService;
