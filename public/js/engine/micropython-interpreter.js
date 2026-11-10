// MicroPython Execution Engine for ESP8266 and ESP32
export class MicroPythonInterpreter {
  constructor(options = {}) {
    this.board = options.board;
    this.audioSynth = options.audioSynth;
    this.onSerialOutput = options.onSerialOutput || (() => {});
    this.onPinChange = options.onPinChange || (() => {});
    this.onAntennaChange = options.onAntennaChange || (() => {});
    this.onOledFlush = options.onOledFlush || (() => {});
    this.onNeoPixelFlush = options.onNeoPixelFlush || (() => {});
    this.onServoMove = options.onServoMove || (() => {});
    this.readInputState = options.readInputState || (() => ({ digital: {}, analog: {} }));

    this.isRunning = false;
    this.abortController = null;
    this.resetState();
  }

  resetState() {
    this.boardState = {
      gpio: {},
      pinModes: {},
      pwm: {},
      toneFreq: 0,
      tonePin: null,
      isPowered: true,
      activeAntenna: 1,
      serialBuffer: []
    };
    this.startTime = performance.now();
  }

  setBoard(board) {
    this.board = board;
    this.resetState();
  }

  sendSerial(msg) {
    this.onSerialOutput(msg);
  }

  pushSerialInput(str) {
    for (let i = 0; i < str.length; i++) {
      this.boardState.serialBuffer.push(str.charCodeAt(i));
    }
  }

  resolvePinNumber(pin) {
    if (typeof pin === 'number') return pin;
    if (typeof pin === 'string') {
      const upper = pin.toUpperCase();
      if (this.board && this.board.pinAlias && this.board.pinAlias[upper] !== undefined) {
        return this.board.pinAlias[upper];
      }
      const parsed = parseInt(pin, 10);
      return isNaN(parsed) ? pin : parsed;
    }
    return pin;
  }

  /**
   * Lightweight Python to JS converter for MicroPython hardware scripting
   */
  pythonToJS(pyCode) {
    const lines = pyCode.split('\n');
    const jsLines = [];
    let indentStack = [0];

    for (let rawLine of lines) {
      // Ignore comment only or empty lines
      const trimmed = rawLine.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      // Check indentation
      const indent = rawLine.search(/\S/);
      while (indent < indentStack[indentStack.length - 1]) {
        indentStack.pop();
        jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
      }

      let line = trimmed;

      // Handle imports
      if (line.startsWith('import ') || line.startsWith('from ')) {
        continue; // Handled natively in runtime context
      }

      // Handle while True:
      if (line.startsWith('while True:') || line.startsWith('while 1:')) {
        jsLines.push(' '.repeat(indent) + 'while (!signal.aborted) { await __yield();');
        indentStack.push(indent + 4);
        continue;
      }

      // Handle while condition:
      if (line.startsWith('while ') && line.endsWith(':')) {
        const cond = line.slice(6, -1).trim();
        jsLines.push(' '.repeat(indent) + `while (!signal.aborted && (${cond})) { await __yield();`);
        indentStack.push(indent + 4);
        continue;
      }

      // Handle for i in range(...):
      const rangeMatch = line.match(/^for\s+([A-Za-z0-9_]+)\s+in\s+range\(([^)]+)\):$/);
      if (rangeMatch) {
        const varName = rangeMatch[1];
        const args = rangeMatch[2].split(',').map(s => s.trim());
        let forHead = '';
        if (args.length === 1) {
          forHead = `for (let ${varName} = 0; ${varName} < ${args[0]}; ${varName}++)`;
        } else if (args.length === 2) {
          forHead = `for (let ${varName} = ${args[0]}; ${varName} < ${args[1]}; ${varName}++)`;
        } else if (args.length === 3) {
          forHead = `for (let ${varName} = ${args[0]}; ${varName} < ${args[1]}; ${varName} += ${args[2]})`;
        }
        jsLines.push(' '.repeat(indent) + `${forHead} { await __yield();`);
        indentStack.push(indent + 4);
        continue;
      }

      // Handle if / elif / else:
      if (line.startsWith('if ') && line.endsWith(':')) {
        const cond = line.slice(3, -1).trim().replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!');
        jsLines.push(' '.repeat(indent) + `if (${cond}) {`);
        indentStack.push(indent + 4);
        continue;
      }
      if (line.startsWith('elif ') && line.endsWith(':')) {
        const cond = line.slice(5, -1).trim().replace(/\band\b/g, '&&').replace(/\bor\b/g, '||').replace(/\bnot\b/g, '!');
        // Close previous block first
        indentStack.pop();
        jsLines.push(' '.repeat(indent) + `} else if (${cond}) {`);
        indentStack.push(indent + 4);
        continue;
      }
      if (line === 'else:') {
        indentStack.pop();
        jsLines.push(' '.repeat(indent) + `} else {`);
        indentStack.push(indent + 4);
        continue;
      }

      // Handle time.sleep
      line = line.replace(/time\.sleep_ms\(([^)]+)\)/g, 'await __delay($1)');
      line = line.replace(/time\.sleep\(([^)]+)\)/g, 'await __delay(($1) * 1000)');

      // Handle print(...)
      line = line.replace(/\bprint\(([^)]*)\)/g, '__print($1)');

      // Replace variable assignments with 'let' if not already defined
      if (/^[a-zA-Z_][a-zA-Z0-9_]*\s*=[^=]/.test(line)) {
        line = 'let ' + line;
      }

      jsLines.push(' '.repeat(indent) + line + ';');
    }

    // Close remaining blocks
    while (indentStack.length > 1) {
      indentStack.pop();
      jsLines.push(' '.repeat(indentStack[indentStack.length - 1]) + '}');
    }

    return jsLines.join('\n');
  }

  async run(code) {
    this.stop();
    this.resetState();
    this.isRunning = true;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const self = this;
    const board = this.board;

    const __delay = (ms) => {
      return new Promise((resolve, reject) => {
        if (signal.aborted) return reject(new Error('ABORTED'));
        const timeout = setTimeout(() => {
          if (signal.aborted) reject(new Error('ABORTED'));
          else resolve();
        }, Math.max(1, ms));

        signal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('ABORTED'));
        });
      });
    };

    const __yield = async () => {
      if (signal.aborted) throw new Error('ABORTED');
      await new Promise(r => setTimeout(r, 0));
    };

    const __print = (...args) => {
      self.sendSerial(args.map(a => String(a)).join(' ') + '\r\n');
    };

    // MicroPython machine module
    class Pin {
      static OUT = 'OUTPUT';
      static IN = 'INPUT';
      static PULL_UP = 'INPUT_PULLUP';

      constructor(pinNum, mode = Pin.IN, pull = null) {
        this.pin = self.resolvePinNumber(pinNum);
        this.mode = (pull === Pin.PULL_UP) ? 'INPUT_PULLUP' : mode;
        self.boardState.pinModes[this.pin] = this.mode;
        self.onPinChange(this.pin, self.boardState);
      }

      value(val) {
        if (val !== undefined) {
          const level = val ? 1 : 0;
          self.boardState.gpio[this.pin] = level;
          self.onPinChange(this.pin, self.boardState);
        } else {
          const inputs = self.readInputState();
          if (inputs.digital[this.pin] !== undefined) {
            return inputs.digital[this.pin];
          }
          return self.boardState.gpio[this.pin] || 0;
        }
      }

      on() { this.value(1); }
      off() { this.value(0); }
    }

    class ADC {
      constructor(pin) {
        this.pin = pin instanceof Pin ? pin.pin : self.resolvePinNumber(pin);
      }
      read() {
        const inputs = self.readInputState();
        if (inputs.analog[this.pin] !== undefined) {
          return inputs.analog[this.pin];
        }
        return 0;
      }
      read_u16() {
        const val = this.read();
        const max = (self.board.adcBits === 12) ? 4095 : 1023;
        return Math.round((val / max) * 65535);
      }
    }

    class PWM {
      constructor(pin, freq = 1000, duty = 0) {
        this.pin = pin instanceof Pin ? pin.pin : self.resolvePinNumber(pin);
        this.duty(duty);
      }
      duty(dutyVal) {
        const scaledDuty = Math.round((dutyVal / 1023) * 255);
        self.boardState.pwm[this.pin] = scaledDuty;
        self.boardState.gpio[this.pin] = scaledDuty > 127 ? 1 : 0;
        self.onPinChange(this.pin, self.boardState);
      }
    }

    const time = {
      ticks_ms: () => Math.round(performance.now() - self.startTime)
    };

    let transpiled = '';
    try {
      transpiled = this.pythonToJS(code);
    } catch (err) {
      this.sendSerial(`[MicroPython Syntax Error] ${err.message}\r\n`);
      this.isRunning = false;
      return;
    }

    const runner = new Function(
      'signal', '__delay', '__yield', '__print', 'Pin', 'ADC', 'PWM', 'time',
      `return (async function() {
        ${transpiled}
      })();`
    );

    try {
      this.sendSerial(`MicroPython v1.22.0 on ESP-IDF (${this.board.name})\r\n`);
      this.sendSerial(`Type "help()" for more information.\r\n>>> \r\n`);

      await runner(signal, __delay, __yield, __print, Pin, ADC, PWM, time);
    } catch (err) {
      if (err.message !== 'ABORTED') {
        this.sendSerial(`Traceback (most recent call last):\r\n  File "main.py": ${err.message}\r\n`);
      }
    } finally {
      this.isRunning = false;
    }
  }

  stop() {
    this.isRunning = false;
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
