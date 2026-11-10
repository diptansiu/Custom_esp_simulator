// Execution Engine Contract
// Platform-independent interface definition for simulation execution engines.
// All execution engines (Arduino, MicroPython, Native C++, Host Python) must
// implement this interface to be used by the application services layer.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { LANGUAGE, RUNNER_MODE, ERROR_MESSAGES } from './constants/index.js';
import { RuntimeError, ExecutionError } from './errors/index.js';

/**
 * Runtime capability description.
 * Describes what a runtime can do and what it requires.
 */
export class RuntimeCapability {
  constructor(data) {
    this.runtimeId = data.runtimeId || '';
    this.supportedLanguages = data.supportedLanguages || [];
    this.supportedBoards = data.supportedBoards || [];
    this.requiresCompiler = data.requiresCompiler || false;
    this.requiresInterpreter = data.requiresInterpreter || false;
    this.supportsNativeProcess = data.supportsNativeProcess || false;
    this.supportsSerialInput = data.supportsSerialInput || false;
    this.supportsPinInput = data.supportsPinInput || false;
    this.supportsAnalogInput = data.supportsAnalogInput || false;
    this.supportsSSE = data.supportsSSE || false;
    this.maxSessions = data.maxSessions || 1;
    this.notes = data.notes || '';
  }

  /**
   * Check if a language is supported.
   */
  supportsLanguage(language) {
    return this.supportedLanguages.includes(language);
  }

  /**
   * Check if a board is supported.
   */
  supportsBoard(boardId) {
    return this.supportedBoards.includes(boardId);
  }

  /**
   * Convert to plain object.
   */
  toJSON() {
    return {
      runtimeId: this.runtimeId,
      supportedLanguages: this.supportedLanguages,
      supportedBoards: this.supportedBoards,
      requiresCompiler: this.requiresCompiler,
      requiresInterpreter: this.requiresInterpreter,
      supportsNativeProcess: this.supportsNativeProcess,
      supportsSerialInput: this.supportsSerialInput,
      supportsPinInput: this.supportsPinInput,
      supportsAnalogInput: this.supportsAnalogInput,
      supportsSSE: this.supportsSSE,
      maxSessions: this.maxSessions,
      notes: this.notes
    };
  }
}

/**
 * Execution state snapshot.
 */
export class ExecutionState {
  constructor(data) {
    this.sessionId = data.sessionId || null;
    this.isRunning = data.isRunning || false;
    this.isPaused = data.isPaused || false;
    this.language = data.language || null;
    this.boardId = data.boardId || null;
    this.startTime = data.startTime || null;
    this.boardState = data.boardState || {};
    this.error = data.error || null;
  }

  /**
   * Convert to plain object.
   */
  toJSON() {
    return {
      sessionId: this.sessionId,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      language: this.language,
      boardId: this.boardId,
      startTime: this.startTime,
      boardState: this.boardState,
      error: this.error
    };
  }
}

/**
 * Execution result from start/compile operations.
 */
export class ExecutionResult {
  constructor(data) {
    this.success = data.success || false;
    this.sessionId = data.sessionId || null;
    this.mode = data.mode || null;
    this.error = data.error || null;
    this.compilerError = data.compilerError || null;
  }

  /**
   * Convert to plain object.
   */
  toJSON() {
    return {
      success: this.success,
      sessionId: this.sessionId,
      mode: this.mode,
      error: this.error,
      compilerError: this.compilerError
    };
  }
}

/**
 * ExecutionEngine interface contract.
 * All execution engines must implement this interface.
 */
export class ExecutionEngine {
  constructor(options = {}) {
    if (this.constructor === ExecutionEngine) {
      throw new Error('ExecutionEngine is abstract. Use a concrete implementation.');
    }

    this.engineId = options.engineId || 'unknown';
    this.engineName = options.engineName || 'Unknown Engine';
    this.supportedLanguages = options.supportedLanguages || [];
    this.supportedBoards = options.supportedBoards || [];
    this.isRunning = false;
    this.currentSessionId = null;
    this.boardState = {};
  }

  /**
   * Get runtime capabilities.
   * Returns a RuntimeCapability object.
   */
  getCapabilities() {
    throw new Error('getCapabilities() not implemented');
  }

  /**
   * Validate input code before execution.
   * Returns { valid: true } or throws ValidationError.
   */
  validateInput(code, language, boardId) {
    throw new Error('validateInput() not implemented');
  }

  /**
   * Prepare/compile code for execution.
   * Returns an ExecutionResult.
   */
  async prepare(code, language, boardId) {
    throw new Error('prepare() not implemented');
  }

  /**
   * Start execution of a prepared session.
   * Returns an ExecutionResult.
   */
  async start(sessionId, code, language, boardId) {
    throw new Error('start() not implemented');
  }

  /**
   * Stop execution of a session.
   */
  async stop(sessionId) {
    throw new Error('stop() not implemented');
  }

  /**
   * Send input to a running session.
   */
  async sendInput(sessionId, input) {
    throw new Error('sendInput() not implemented');
  }

  /**
   * Get current execution state for a session.
   */
  getState(sessionId) {
    throw new Error('getState() not implemented');
  }

  /**
   * Check if a session is running.
   */
  isSessionRunning(sessionId) {
    throw new Error('isSessionRunning() not implemented');
  }

  /**
   * Clean up resources for a session.
   */
  async cleanup(sessionId) {
    throw new Error('cleanup() not implemented');
  }

  /**
   * Clean up all resources (shutdown).
   */
  async shutdown() {
    throw new Error('shutdown() not implemented');
  }

  /**
   * Check if the engine can handle a given language and board combination.
   */
  canHandle(language, boardId) {
    return this.supportedLanguages.includes(language) &&
           this.supportedBoards.includes(boardId);
  }

  /**
   * Get engine ID.
   */
  getEngineId() {
    return this.engineId;
  }

  /**
   * Get engine name.
   */
  getEngineName() {
    return this.engineName;
  }
}

/**
 * Create an execution error from a standard error.
 */
export function createExecutionError(message, sessionId = null, engine = null, cause = null) {
  const err = new ExecutionError(message, sessionId, engine);
  if (cause) {
    err.cause = cause;
  }
  return err;
}

/**
 * Create a runtime error from a standard error.
 */
export function createRuntimeError(message, runtime = null, cause = null) {
  const err = new RuntimeError(message, runtime);
  if (cause) {
    err.cause = cause;
  }
  return err;
}

export default {
  ExecutionEngine,
  RuntimeCapability,
  ExecutionState,
  ExecutionResult,
  createExecutionError,
  createRuntimeError
};
