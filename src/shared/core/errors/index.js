// Shared Error Definitions
// Platform-independent error classes used across all layers.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { ERROR_MESSAGES } from './constants/index.js';

// Base application error
export class ESPError extends Error {
  constructor(message, code = 'ESP_ERROR', details = null) {
    super(message);
    this.name = 'ESPError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, ESPError.prototype);
  }

  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp
    };
  }
}

// Validation error - invalid input data
export class ValidationError extends ESPError {
  constructor(message, field = null, value = null) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

// Configuration error - missing or invalid configuration
export class ConfigError extends ESPError {
  constructor(message, key = null) {
    super(message, 'CONFIG_ERROR', { key });
    this.name = 'ConfigError';
    Object.setPrototypeOf(this, ConfigError.prototype);
  }
}

// Runtime availability error - compiler/interpreter not found
export class RuntimeError extends ESPError {
  constructor(message, runtime = null) {
    super(message, 'RUNTIME_ERROR', { runtime });
    this.name = 'RuntimeError';
    Object.setPrototypeOf(this, RuntimeError.prototype);
  }
}

// Execution error - simulation execution failed
export class ExecutionError extends ESPError {
  constructor(message, sessionId = null, engine = null) {
    super(message, 'EXECUTION_ERROR', { sessionId, engine });
    this.name = 'ExecutionError';
    Object.setPrototypeOf(this, ExecutionError.prototype);
  }
}

// Storage error - project persistence failed
export class StorageError extends ESPError {
  constructor(message, operation = null, filename = null) {
    super(message, 'STORAGE_ERROR', { operation, filename });
    this.name = 'StorageError';
    Object.setPrototypeOf(this, StorageError.prototype);
  }
}

// Not found error - resource not found
export class NotFoundError extends ESPError {
  constructor(message, resource = null, id = null) {
    super(message, 'NOT_FOUND', { resource, id });
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

// Helper to create errors from message templates
export function createError(type, ...args) {
  const errorClasses = {
    ValidationError,
    ConfigError,
    RuntimeError,
    ExecutionError,
    StorageError,
    NotFoundError,
    ESPError
  };
  const ErrorClass = errorClasses[type];
  if (!ErrorClass) {
    throw new Error(`Unknown error type: ${type}`);
  }
  return new ErrorClass(...args);
}

export default {
  ESPError,
  ValidationError,
  ConfigError,
  RuntimeError,
  ExecutionError,
  StorageError,
  NotFoundError,
  createError
};
