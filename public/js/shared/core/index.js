// Shared Core Index
// Exports all shared core modules for convenient importing.

// Constants
export * from './constants/index.js';

// Errors
export * from './errors/index.js';

// Models
export { Board } from './models/board.js';
export { Component, ComponentInstance } from './models/component.js';
export { Wire, CircuitNet } from './models/circuit.js';
export { Project, ProjectRepository } from './models/project.js';

// Validation
export { validateBoardData, validateBoardId, createBoard } from './validation/board.js';
export { validateComponentData, validateComponentInstance } from './validation/component.js';
export { validateProjectData, validateProjectImport, validateProjectExport } from './validation/project.js';

// Contracts
export { ExecutionEngine, RuntimeCapability, ExecutionState, ExecutionResult } from './contracts/execution-engine.js';
export { SCHEMA_VERSIONS, PROJECT_SCHEMA_VERSION, getLatestSchemaVersion, getSchema, validateProjectAgainstSchema, needsMigration, getMigrationPath } from './contracts/project-schema.js';
export { EVENT_CATEGORY, EVENT_NAME, BaseEvent, ProjectEvent, CircuitEvent, ExecutionEvent, RuntimeEvent, createEvent } from './contracts/event-contracts.js';

// Events
export { EventBus, eventNames, eventCategories } from './events/event-bus.js';
