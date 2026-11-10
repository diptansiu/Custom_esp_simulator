// Event Contracts
// Platform-independent event payload schemas.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

// Event categories and names
export const EVENT_CATEGORY = {
  PROJECT: 'project',
  BOARD: 'board',
  CIRCUIT: 'circuit',
  COMPONENT: 'component',
  EXECUTION: 'execution',
  SIMULATION: 'simulation',
  RUNTIME: 'runtime',
  UI: 'ui'
};

export const EVENT_NAME = {
  // Project events
  PROJECT_CREATED: 'project:created',
  PROJECT_LOADED: 'project:loaded',
  PROJECT_SAVED: 'project:saved',
  PROJECT_UPDATED: 'project:updated',
  PROJECT_DELETED: 'project:deleted',
  PROJECT_IMPORTED: 'project:imported',
  PROJECT_EXPORTED: 'project:exported',

  // Board events
  BOARD_SELECTED: 'board:selected',
  BOARD_CHANGED: 'board:changed',

  // Circuit events
  CIRCUIT_UPDATED: 'circuit:updated',
  CIRCUIT_VALIDATED: 'circuit:validated',
  CONNECTION_CREATED: 'connection:created',
  CONNECTION_REMOVED: 'connection:removed',

  // Component events
  COMPONENT_ADDED: 'component:added',
  COMPONENT_REMOVED: 'component:removed',
  COMPONENT_UPDATED: 'component:updated',
  COMPONENT_SELECTED: 'component:selected',

  // Execution events
  EXECUTION_STARTED: 'execution:started',
  EXECUTION_COMPLETED: 'execution:completed',
  EXECUTION_FAILED: 'execution:failed',
  EXECUTION_STOPPED: 'execution:stopped',

  // Simulation events
  SIMULATION_STARTED: 'simulation:started',
  SIMULATION_PAUSED: 'simulation:paused',
  SIMULATION_RESUMED: 'simulation:resumed',
  SIMULATION_STOPPED: 'simulation:stopped',

  // Runtime events
  RUNTIME_AVAILABLE: 'runtime:available',
  RUNTIME_UNAVAILABLE: 'runtime:unavailable',
  RUNTIME_ERROR: 'runtime:error',

  // UI events
  UI_PANEL_OPENED: 'ui:panel:opened',
  UI_PANEL_CLOSED: 'ui:panel:closed',
  UI_TAB_SWITCHED: 'ui:tab:switched'
};

/**
 * Base event payload structure.
 */
export class BaseEvent {
  constructor(data) {
    this.type = data.type || '';
    this.timestamp = data.timestamp || new Date().toISOString();
    this.source = data.source || 'unknown';
    this.correlationId = data.correlationId || null;
  }

  toJSON() {
    return {
      type: this.type,
      timestamp: this.timestamp,
      source: this.source,
      correlationId: this.correlationId
    };
  }
}

/**
 * Project event payload.
 */
export class ProjectEvent extends BaseEvent {
  constructor(data) {
    super(data);
    this.projectId = data.projectId || null;
    this.projectName = data.projectName || null;
    this.board = data.board || null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      projectId: this.projectId,
      projectName: this.projectName,
      board: this.board
    };
  }
}

/**
 * Circuit event payload.
 */
export class CircuitEvent extends BaseEvent {
  constructor(data) {
    super(data);
    this.componentId = data.componentId || null;
    this.wireId = data.wireId || null;
    this.from = data.from || null;
    this.to = data.to || null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      componentId: this.componentId,
      wireId: this.wireId,
      from: this.from,
      to: this.to
    };
  }
}

/**
 * Execution event payload.
 */
export class ExecutionEvent extends BaseEvent {
  constructor(data) {
    super(data);
    this.sessionId = data.sessionId || null;
    this.engine = data.engine || null;
    this.language = data.language || null;
    this.boardId = data.boardId || null;
    this.error = data.error || null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      sessionId: this.sessionId,
      engine: this.engine,
      language: this.language,
      boardId: this.boardId,
      error: this.error
    };
  }
}

/**
 * Runtime event payload.
 */
export class RuntimeEvent extends BaseEvent {
  constructor(data) {
    super(data);
    this.runtime = data.runtime || null;
    this.available = data.available !== undefined ? data.available : null;
    this.error = data.error || null;
  }

  toJSON() {
    return {
      ...super.toJSON(),
      runtime: this.runtime,
      available: this.available,
      error: this.error
    };
  }
}

/**
 * Create a typed event from raw data.
 */
export function createEvent(data) {
  const type = data.type || '';
  const category = type.split(':')[0];

  switch (category) {
    case EVENT_CATEGORY.PROJECT:
      return new ProjectEvent(data);
    case EVENT_CATEGORY.CIRCUIT:
      return new CircuitEvent(data);
    case EVENT_CATEGORY.EXECUTION:
      return new ExecutionEvent(data);
    case EVENT_CATEGORY.RUNTIME:
      return new RuntimeEvent(data);
    default:
      return new BaseEvent(data);
  }
}

export default {
  EVENT_CATEGORY,
  EVENT_NAME,
  BaseEvent,
  ProjectEvent,
  CircuitEvent,
  ExecutionEvent,
  RuntimeEvent,
  createEvent
};
