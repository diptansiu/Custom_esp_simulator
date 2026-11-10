// Execution Service
// Application service for simulation execution lifecycle management.
// Coordinates execution engine adapters and session management.
// Depends on shared core contracts only.

import { ExecutionError, RuntimeError } from '../shared/core/errors/index.js';
import {
  LANGUAGE, RUNNER_MODE, ERROR_MESSAGES
} from '../shared/core/constants/index.js';

export class ExecutionService {
  constructor(options = {}) {
    this.engineRegistry = options.engineRegistry || new Map();
    this.sessionManager = options.sessionManager || null;
    this.eventBus = options.eventBus || null;
    this.defaultEngineId = options.defaultEngineId || null;
  }

  /**
   * Register an execution engine.
   */
  registerEngine(engine) {
    this.engineRegistry.set(engine.getEngineId(), engine);
  }

  /**
   * Get an engine by ID.
   */
  getEngine(engineId) {
    const engine = this.engineRegistry.get(engineId);
    if (!engine) {
      throw new Error(`Execution engine not found: ${engineId}`);
    }
    return engine;
  }

  /**
   * Get all registered engines.
   */
  getAllEngines() {
    return [...this.engineRegistry.values()];
  }

  /**
   * Get engine capabilities by ID.
   */
  getEngineCapabilities(engineId) {
    const engine = this.getEngine(engineId);
    return engine.getCapabilities();
  }

  /**
   * Find engines that can handle a language+board combination.
   */
  findEnginesFor(language, boardId) {
    return this.getAllEngines().filter(e => e.canHandle(language, boardId));
  }

  /**
   * Select the best engine for a language+board combination.
   * Prefers the default engine if it can handle the combination.
   */
  selectEngine(language, boardId, preferredEngineId = null) {
    const candidates = this.findEnginesFor(language, boardId);
    if (candidates.length === 0) {
      throw new RuntimeError(
        `No execution engine available for language="${language}" board="${boardId}"`,
        'none'
      );
    }

    // Try preferred engine first
    if (preferredEngineId) {
      const preferred = candidates.find(e => e.getEngineId() === preferredEngineId);
      if (preferred) return preferred;
    }

    // Try default engine
    if (this.defaultEngineId) {
      const def = candidates.find(e => e.getEngineId() === this.defaultEngineId);
      if (def) return def;
    }

    // Return first candidate
    return candidates[0];
  }

  /**
   * Validate input code before execution.
   */
  async validateInput(code, language, boardId, engineId = null) {
    const engine = engineId ? this.getEngine(engineId) : this.selectEngine(language, boardId);
    return engine.validateInput(code, language, boardId);
  }

  /**
   * Start execution of a session.
   */
  async startExecution(sessionId, code, language, boardId, engineId = null) {
    const engine = engineId ? this.getEngine(engineId) : this.selectEngine(language, boardId, engineId);

    try {
      const result = await engine.start(sessionId, code, language, boardId);
      if (result.success) {
        this._publish('execution:started', {
          sessionId,
          engine: engine.getEngineId(),
          language,
          boardId
        });
      }
      return result;
    } catch (err) {
      if (err instanceof ExecutionError || err instanceof RuntimeError) {
        throw err;
      }
      throw new ExecutionError(
        `Failed to start execution: ${err.message}`,
        sessionId,
        engine.getEngineId(),
        err
      );
    }
  }

  /**
   * Stop execution of a session.
   */
  async stopExecution(sessionId) {
    // Find which engine owns this session
    const engine = this._findEngineForSession(sessionId);
    if (!engine) {
      throw new ExecutionError(`Session not found: ${sessionId}`, sessionId);
    }

    try {
      await engine.stop(sessionId);
      this._publish('execution:stopped', {
        sessionId,
        engine: engine.getEngineId()
      });
      return { success: true, sessionId };
    } catch (err) {
      throw new ExecutionError(
        `Failed to stop execution: ${err.message}`,
        sessionId,
        engine.getEngineId(),
        err
      );
    }
  }

  /**
   * Send input to a running session.
   */
  async sendInput(sessionId, input) {
    const engine = this._findEngineForSession(sessionId);
    if (!engine) {
      throw new ExecutionError(`Session not found: ${sessionId}`, sessionId);
    }

    try {
      await engine.sendInput(sessionId, input);
      return { success: true };
    } catch (err) {
      throw new ExecutionError(
        `Failed to send input: ${err.message}`,
        sessionId,
        engine.getEngineId(),
        err
      );
    }
  }

  /**
   * Get execution state for a session.
   */
  getExecutionState(sessionId) {
    const engine = this._findEngineForSession(sessionId);
    if (!engine) {
      throw new ExecutionError(`Session not found: ${sessionId}`, sessionId);
    }
    return engine.getState(sessionId);
  }

  /**
   * Check if a session is running.
   */
  isSessionRunning(sessionId) {
    const engine = this._findEngineForSession(sessionId);
    if (!engine) return false;
    return engine.isSessionRunning(sessionId);
  }

  /**
   * Clean up a session.
   */
  async cleanupSession(sessionId) {
    const engine = this._findEngineForSession(sessionId);
    if (!engine) return;

    try {
      await engine.cleanup(sessionId);
    } catch (err) {
      // Log but don't throw - cleanup should be best-effort
      console.warn(`[ExecutionService] Cleanup warning for session ${sessionId}:`, err.message);
    }
  }

  /**
   * Shutdown all engines and clean up all sessions.
   */
  async shutdown() {
    for (const engine of this.getAllEngines()) {
      try {
        await engine.shutdown();
      } catch (err) {
        console.warn(`[ExecutionService] Shutdown warning for engine ${engine.getEngineId()}:`, err.message);
      }
    }
  }

  /**
   * Find the engine that owns a session.
   * Checks each engine's isSessionRunning method.
   */
  _findEngineForSession(sessionId) {
    for (const engine of this.getAllEngines()) {
      try {
        if (engine.isSessionRunning && engine.isSessionRunning(sessionId)) {
          return engine;
        }
      } catch {
        // Engine may not support session checking, skip
      }
    }
    return null;
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

export default ExecutionService;
