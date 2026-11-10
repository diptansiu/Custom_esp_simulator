// MicroPython Interpreter Execution Engine Adapter
// Wraps the existing MicroPythonInterpreter (public/js/engine/micropython-interpreter.js)
// to implement the shared core ExecutionEngine contract.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { ExecutionEngine, RuntimeCapability, ExecutionState, ExecutionResult } from '../../../shared/core/contracts/execution-engine.js';
import { LANGUAGE, RUNNER_MODE } from '../../../shared/core/constants/index.js';
import { ValidationError } from '../../../shared/core/errors/index.js';

/**
 * Adapter for the MicroPythonInterpreter (in-browser Python-like fast runner).
 * Transpiles MicroPython-like Python to JavaScript and executes it via eval.
 */
export class MicroPythonInterpreterAdapter extends ExecutionEngine {
  constructor(options = {}) {
    super({
      engineId: 'micropython-interpreter',
      engineName: 'MicroPython Fast Runner',
      supportedLanguages: [LANGUAGE.PYTHON],
      supportedBoards: options.supportedBoards || [],
      ...options
    });

    this.interpreter = options.interpreter || null;
    this.audioSynth = options.audioSynth || null;
    this.board = options.board || null;

    if (this.interpreter) {
      this.interpreter.onSerialOutput = (text) => {
        this._publishSerial(text);
      };
      this.interpreter.onPinChange = (pin, state) => {
        this.boardState = { ...this.boardState, ...state };
        this._publishPinChange(pin, state);
      };
      this.interpreter.onAntennaChange = (ant) => {
        this.boardState.activeAntenna = ant;
        this._publishAntennaChange(ant);
      };
      this.interpreter.onOledFlush = (buf) => {
        this._publishOledFlush(buf);
      };
      this.interpreter.onNeoPixelFlush = (colors) => {
        this._publishNeoPixelFlush(colors);
      };
      this.interpreter.onServoMove = (angle) => {
        this._publishServoMove(angle);
      };
      this.interpreter.readInputState = () => {
        return this._getInputState();
      };
    }
  }

  /**
   * Get runtime capabilities.
   */
  getCapabilities() {
    return new RuntimeCapability({
      runtimeId: this.engineId,
      supportedLanguages: this.supportedLanguages,
      supportedBoards: this.supportedBoards,
      requiresCompiler: false,
      requiresInterpreter: false,
      supportsNativeProcess: false,
      supportsSerialInput: true,
      supportsPinInput: true,
      supportsAnalogInput: true,
      supportsSSE: false,
      maxSessions: 1,
      notes: 'In-browser MicroPython-like fast runner (transpile-to-JS). Not official MicroPython VM.'
    });
  }

  /**
   * Validate input code before execution.
   */
  validateInput(code, language, boardId) {
    if (!this.supportedLanguages.includes(language)) {
      throw new ValidationError(
        `Language "${language}" not supported by MicroPython interpreter`,
        'language',
        language
      );
    }
    if (!this.supportedBoards.includes(boardId)) {
      throw new ValidationError(
        `Board "${boardId}" not supported by MicroPython interpreter`,
        'board',
        boardId
      );
    }
    if (!code || typeof code !== 'string') {
      throw new ValidationError('Code must be a non-empty string', 'code', code);
    }
    return { valid: true };
  }

  /**
   * Prepare/compile code for execution.
   */
  async prepare(code, language, boardId) {
    this.validateInput(code, language, boardId);

    if (!this.interpreter) {
      throw new ValidationError('MicroPython interpreter not initialized', 'interpreter', null);
    }

    return new ExecutionResult({
      success: true,
      mode: 'micropython-interpreter',
      sessionId: null
    });
  }

  /**
   * Start execution of a session.
   */
  async start(sessionId, code, language, boardId) {
    this.stop(sessionId);

    this.currentSessionId = sessionId;
    this.isRunning = true;

    if (this.board) {
      this.interpreter.setBoard(this.board);
    }

    try {
      await this.interpreter.run(code);
      this.isRunning = this.interpreter.isRunning;
      this.boardState = { ...this.interpreter.boardState };

      return new ExecutionResult({
        success: true,
        sessionId,
        mode: 'micropython-interpreter'
      });
    } catch (err) {
      this.isRunning = false;
      this.boardState = { ...this.interpreter.boardState };
      return new ExecutionResult({
        success: false,
        sessionId,
        mode: 'micropython-interpreter',
        error: err.message || 'MicroPython interpreter execution failed'
      });
    }
  }

  /**
   * Stop execution of a session.
   */
  async stop(sessionId) {
    if (this.interpreter) {
      this.interpreter.stop();
    }
    this.isRunning = false;
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    this.boardState = { ...(this.interpreter ? this.interpreter.boardState : {}) };
    return { success: true, sessionId };
  }

  /**
   * Send input to a running session.
   */
  async sendInput(sessionId, input) {
    if (!this.interpreter || !this.isRunning) {
      return { success: false, error: 'Interpreter not running' };
    }

    const { event } = input || {};

    if (event === 'pin_in') {
      const { pin, val } = input;
      const gpio = this.interpreter.resolvePinNumber ? this.interpreter.resolvePinNumber(pin) : pin;
      this.boardState.gpio = { ...(this.boardState.gpio || {}), [gpio]: val };
      this.boardState.pinModes = { ...(this.boardState.pinModes || {}), [gpio]: 'INPUT' };
      return { success: true };
    }

    if (event === 'serial_in') {
      const { text } = input;
      if (this.interpreter.pushSerialInput) {
        this.interpreter.pushSerialInput(text || '');
      }
      return { success: true };
    }

    return { success: false, error: `Unsupported input event: ${event}` };
  }

  /**
   * Get current execution state for a session.
   */
  getState(sessionId) {
    return new ExecutionState({
      sessionId: this.currentSessionId === sessionId ? sessionId : null,
      isRunning: this.isRunning,
      isPaused: this.interpreter ? this.interpreter.isPaused : false,
      language: LANGUAGE.PYTHON,
      boardId: this.board ? this.board.id : null,
      startTime: this.interpreter ? this.interpreter.startTime : null,
      boardState: { ...(this.interpreter ? this.interpreter.boardState : {}) },
      error: null
    });
  }

  /**
   * Check if a session is running.
   */
  isSessionRunning(sessionId) {
    return this.currentSessionId === sessionId && this.isRunning === true;
  }

  /**
   * Clean up resources for a session.
   */
  async cleanup(sessionId) {
    if (this.currentSessionId === sessionId) {
      await this.stop(sessionId);
    }
  }

  /**
   * Clean up all resources (shutdown).
   */
  async shutdown() {
    await this.stop(this.currentSessionId);
  }

  // ── Internal helpers ──

  _publishSerial(text) {
    this.boardState = {
      ...this.boardState,
      serialOutput: text
    };
  }

  _publishPinChange(pin, state) {
    this.boardState = { ...state };
  }

  _publishAntennaChange(ant) {
    this.boardState = { ...this.boardState, activeAntenna: ant };
  }

  _publishOledFlush(buf) {
    this.boardState = { ...this.boardState, oled: buf };
  }

  _publishNeoPixelFlush(colors) {
    this.boardState = { ...this.boardState, neoPixels: colors };
  }

  _publishServoMove(angle) {
    this.boardState = { ...this.boardState, servoAngle: angle };
  }

  _getInputState() {
    return {
      digital: { ...(this.boardState.gpio || {}) },
      analog: { ...(this.boardState.analog || {}) }
    };
  }
}

export default MicroPythonInterpreterAdapter;
