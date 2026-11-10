// Real Code Runner Execution Engine Adapter
// Wraps the existing RealCodeRunner (public/js/engine/real-runner.js) which
// communicates with the backend HTTP server (clang++ / python3 native processes).
// Implements the shared core ExecutionEngine contract.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { ExecutionEngine, RuntimeCapability, ExecutionState, ExecutionResult } from '../../../shared/core/contracts/execution-engine.js';
import { LANGUAGE, RUNNER_MODE } from '../../../shared/core/constants/index.js';
import { ValidationError } from '../../../shared/core/errors/index.js';

/**
 * Adapter for RealCodeRunner (native C++/Python via backend HTTP + SSE).
 */
export class RealCodeRunnerAdapter extends ExecutionEngine {
  constructor(options = {}) {
    super({
      engineId: 'real-code-runner',
      engineName: 'Native Compiler Runner',
      supportedLanguages: [LANGUAGE.CPP, LANGUAGE.PYTHON],
      supportedBoards: options.supportedBoards || [],
      ...options
    });

    this.runner = options.runner || null;
    this.audioSynth = options.audioSynth || null;
    this.board = options.board || null;

    if (this.runner) {
      this.runner.onSerialOutput = (text) => {
        this._publishSerial(text);
      };
      this.runner.onPinChange = (pin, state) => {
        this.boardState = { ...this.boardState, ...state };
        this._publishPinChange(pin, state);
      };
      this.runner.onAntennaChange = (ant) => {
        this.boardState.activeAntenna = ant;
        this._publishAntennaChange(ant);
      };
      this.runner.onOledFlush = (buf) => {
        this._publishOledFlush(buf);
      };
      this.runner.onNeoPixelFlush = (colors) => {
        this._publishNeoPixelFlush(colors);
      };
      this.runner.onServoMove = (angle) => {
        this._publishServoMove(angle);
      };
      this.runner.onServerBegin = (info) => {
        this._publishServerBegin(info);
      };
      this.runner.onCompilerError = (err) => {
        this._publishCompilerError(err);
      };
      this.runner.onFinished = () => {
        this.isRunning = false;
        this._publishFinished();
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
      requiresCompiler: true,
      requiresInterpreter: true,
      supportsNativeProcess: true,
      supportsSerialInput: true,
      supportsPinInput: true,
      supportsAnalogInput: true,
      supportsSSE: true,
      maxSessions: 10,
      notes: 'Native Clang++ / Python3 compatibility runner via backend HTTP + SSE. Not real ESP firmware.'
    });
  }

  /**
   * Validate input code before execution.
   */
  validateInput(code, language, boardId) {
    if (!this.supportedLanguages.includes(language)) {
      throw new ValidationError(
        `Language "${language}" not supported by native runner`,
        'language',
        language
      );
    }
    if (!this.supportedBoards.includes(boardId)) {
      throw new ValidationError(
        `Board "${boardId}" not supported by native runner`,
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
   * For the native runner, preparation is a no-op (compilation happens in start()).
   */
  async prepare(code, language, boardId) {
    this.validateInput(code, language, boardId);

    if (!this.runner) {
      throw new ValidationError('RealCodeRunner not initialized', 'runner', null);
    }

    return new ExecutionResult({
      success: true,
      mode: 'native-code-runner',
      sessionId: null
    });
  }

  /**
   * Start execution of a session (compiles via backend and launches process).
   */
  async start(sessionId, code, language, boardId) {
    this.stop(sessionId);

    this.currentSessionId = sessionId;
    this.isRunning = true;

    if (this.board) {
      this.runner.setBoard(this.board);
    }

    try {
      const ok = await this.runner.run(code, language);
      this.isRunning = this.runner.isRunning;
      this.boardState = { ...this.runner.boardState };

      return new ExecutionResult({
        success: ok,
        sessionId,
        mode: ok ? 'native-code-runner' : null,
        error: ok ? null : 'Compilation or execution failed'
      });
    } catch (err) {
      this.isRunning = false;
      this.boardState = { ...this.runner.boardState };
      return new ExecutionResult({
        success: false,
        sessionId,
        mode: 'native-code-runner',
        error: err.message || 'Native runner execution failed'
      });
    }
  }

  /**
   * Stop execution of a session.
   */
  async stop(sessionId) {
    if (this.runner) {
      this.runner.stop();
    }
    this.isRunning = false;
    if (this.currentSessionId === sessionId) {
      this.currentSessionId = null;
    }
    this.boardState = { ...(this.runner ? this.runner.boardState : {}) };
    return { success: true, sessionId };
  }

  /**
   * Send input to a running session.
   */
  async sendInput(sessionId, input) {
    if (!this.runner || !this.isRunning) {
      return { success: false, error: 'Runner not running' };
    }

    const { event } = input || {};

    if (event === 'pin_in') {
      const { pin, val } = input;
      if (this.runner.sendDigitalPinInput) {
        this.runner.sendDigitalPinInput(pin, val);
      }
      return { success: true };
    }

    if (event === 'adc_in') {
      const { pin, val } = input;
      if (this.runner.sendAnalogInput) {
        this.runner.sendAnalogInput(pin, val);
      }
      return { success: true };
    }

    if (event === 'serial_in') {
      const { text } = input;
      if (this.runner.pushSerialInput) {
        this.runner.pushSerialInput(text || '');
      }
      return { success: true };
    }

    if (event === 'dht_in') {
      const { temp, hum } = input;
      if (this.runner.sendDhtInput) {
        this.runner.sendDhtInput(temp, hum);
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
      isPaused: false,
      language: this.runner && this.runner.currentLanguage ? this.runner.currentLanguage : LANGUAGE.CPP,
      boardId: this.board ? this.board.id : null,
      startTime: null,
      boardState: { ...(this.runner ? this.runner.boardState : {}) },
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

  _publishServerBegin(info) {
    this.boardState = { ...this.boardState, server: info };
  }

  _publishCompilerError(err) {
    this.boardState = { ...this.boardState, compilerError: err };
  }

  _publishFinished() {
    this.boardState = { ...this.boardState, finished: true };
  }
}

export default RealCodeRunnerAdapter;
