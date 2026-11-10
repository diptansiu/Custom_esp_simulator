// Centralized Logger
// Platform-independent logging with configurable levels.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.
// In production, this can be adapted to send logs to a backend or file.

const LEVELS = {
  VERBOSE: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

const LEVEL_NAMES = {
  0: 'VERBOSE',
  1: 'INFO',
  2: 'WARN',
  3: 'ERROR',
  4: 'NONE'
};

export class Logger {
  constructor(options = {}) {
    this.level = options.level || 'INFO';
    this.levelValue = LEVELS[this.level] || LEVELS.INFO;
    this.enabled = options.enabled !== false;
    this.prefix = options.prefix || 'ESP-Sim';
    this.timestamps = options.timestamps !== false;
  }

  /**
   * Set the log level.
   */
  setLevel(level) {
    this.levelValue = LEVELS[level] || LEVELS.INFO;
    this.level = level;
  }

  /**
   * Check if a level is enabled.
   */
  _isEnabled(levelValue) {
    return this.enabled && levelValue >= this.levelValue;
  }

  /**
   * Format a log message.
   */
  _format(level, args) {
    const timestamp = this.timestamps ? new Date().toISOString() : '';
    const prefix = this.prefix ? `[${this.prefix}]` : '';
    const levelStr = LEVEL_NAMES[level] || 'UNKNOWN';
    const message = args.map(a => {
      if (typeof a === 'object') {
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      }
      return String(a);
    }).join(' ');
    return `${timestamp} ${prefix} [${levelStr}] ${message}`.trim();
  }

  /**
   * Log a verbose message.
   */
  verbose(...args) {
    if (this._isEnabled(LEVELS.VERBOSE)) {
      console.log(this._format(LEVELS.VERBOSE, args));
    }
  }

  /**
   * Log an info message.
   */
  info(...args) {
    if (this._isEnabled(LEVELS.INFO)) {
      console.log(this._format(LEVELS.INFO, args));
    }
  }

  /**
   * Log a warning message.
   */
  warn(...args) {
    if (this._isEnabled(LEVELS.WARN)) {
      console.warn(this._format(LEVELS.WARN, args));
    }
  }

  /**
   * Log an error message.
   */
  error(...args) {
    if (this._isEnabled(LEVELS.ERROR)) {
      console.error(this._format(LEVELS.ERROR, args));
    }
  }

  /**
   * Create a child logger with a prefix.
   */
  child(prefix) {
    return new Logger({
      level: this.level,
      enabled: this.enabled,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      timestamps: this.timestamps
    });
  }
}

// Default logger instance
export const defaultLogger = new Logger({
  level: 'INFO',
  enabled: true,
  prefix: 'ESP-Sim',
  timestamps: true
});

export default Logger;
