// Shared Constants
// Platform-independent constants used across all layers.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

// Execution modes
export const RUNNER_MODE = {
  BROWSER: 'browser',   // In-browser fast runner (transpiled JS)
  NATIVE: 'native'      // Native host execution (clang++ / python3)
};

// Supported languages
export const LANGUAGE = {
  CPP: 'cpp',
  PYTHON: 'python'
};

// Component categories
export const COMPONENT_CATEGORY = {
  OUTPUT: 'Output',
  DISPLAY: 'Display',
  INPUT: 'Input',
  SENSORS: 'Sensors',
  ACTUATORS: 'Actuators',
  PASSIVE: 'Passive',
  SEMICONDUCTOR: 'Semiconductor',
  ELECTROMECHANICAL: 'Electromechanical',
  POWER: 'Power',
  SWITCHGEAR: 'Switchgear',
  COMMUNICATION: 'Communication',
  COMPUTING: 'Computing',
  CONNECTOR: 'Connector',
  PROTECTION: 'Protection',
  OTHER: 'Other'
};

// Pin types
export const PIN_TYPE = {
  SIGNAL: 'signal',
  POWER: 'power',
  GND: 'gnd',
  PASSIVE: 'passive',
  RESET: 'reset'
};

// Board families
export const BOARD_FAMILY = {
  ESP8266: 'ESP8266',
  ESP32: 'ESP32'
};

// Hardware capabilities
export const HARDWARE_CAPABILITY = {
  DIGITAL_INPUT: 'digital-input',
  DIGITAL_OUTPUT: 'digital-output',
  ANALOG_INPUT: 'analog-input',
  PWM_OUTPUT: 'pwm-output',
  I2C: 'i2c',
  SPI: 'spi',
  UART: 'uart',
  INTERRUPT: 'interrupt',
  TOUCH_INPUT: 'touch-input',
  WIFI: 'wifi',
  BLUETOOTH: 'bluetooth'
};

// Project schema version
export const PROJECT_SCHEMA_VERSION = 1;

// Default configuration
export const DEFAULT_CONFIG = {
  window: {
    width: 1250,
    height: 850,
    x: null,
    y: null,
    maximized: false,
    fullscreen: false
  },
  runtime: {
    cppCompiler: null,
    pythonInterpreter: null,
    autoDetect: true
  },
  app: {
    theme: 'dark',
    autoSave: true,
    checkUpdates: false,
    showDiagnostics: false
  }
};

// Error message templates
export const ERROR_MESSAGES = {
  BOARD_NOT_FOUND: (boardId) => `Board not found: ${boardId}`,
  COMPONENT_NOT_FOUND: (componentId) => `Component not found: ${componentId}`,
  INVALID_PIN: (pin) => `Invalid pin reference: ${pin}`,
  INVALID_WIRE: (from, to) => `Invalid wire connection: ${from} -> ${to}`,
  PROJECT_NOT_FOUND: (filename) => `Project not found: ${filename}`,
  PROJECT_VALIDATION: (message) => `Project validation failed: ${message}`,
  RUNTIME_NOT_AVAILABLE: (runtime) => `Runtime not available: ${runtime}`,
  COMPILER_NOT_FOUND: (compiler) => `Compiler not found: ${compiler}`,
  EXECUTION_FAILED: (message) => `Execution failed: ${message}`,
  SESSION_NOT_FOUND: (sessionId) => `Session not found: ${sessionId}`,
  SESSION_ALREADY_STOPPED: (sessionId) => `Session already stopped: ${sessionId}`
};
