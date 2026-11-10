// Arduino C++ Execution Engine for ESP8266 and ESP32
export class ArduinoInterpreter {
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
    this.isPaused = false;
    this.loopTimer = null;
    this.abortController = null;

    this.resetState();
  }

  resetState() {
    this.boardState = {
      gpio: {},        // pin number -> 0 or 1
      pinModes: {},    // pin number -> 'INPUT' | 'OUTPUT' | 'INPUT_PULLUP'
      pwm: {},         // pin number -> 0 to 255
      toneFreq: 0,
      tonePin: null,
      isPowered: true,
      activeAntenna: 1, // for ESP32-WROOM-DA
      wifiConnected: false,
      wifiSSID: '',
      serialBuffer: []
    };
    this.startTime = performance.now();
    this.displayBuffer = this.createDisplayBuffer();
  }

  createDisplayBuffer() {
    return {
      width: 128,
      height: 64,
      cursorX: 0,
      cursorY: 0,
      textSize: 1,
      textColor: 1,
      pixels: new Uint8Array(128 * 64)
    };
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
      if (upper.startsWith('GPIO')) {
        return parseInt(upper.replace('GPIO', ''), 10);
      }
      if (upper.startsWith('D')) {
        const num = parseInt(upper.replace('D', ''), 10);
        if (this.board && this.board.family === 'ESP8266' && this.board.pinAlias[upper] !== undefined) {
          return this.board.pinAlias[upper];
        }
        return num;
      }
      if (upper === 'A0') return 'A0';
      const parsed = parseInt(pin, 10);
      return isNaN(parsed) ? pin : parsed;
    }
    return pin;
  }

  /**
   * Preprocesses Arduino C++ code into executable JavaScript async generator.
   */
  transpileToJS(code) {
    let js = code;

    // Remove single line and multi line comments for parsing
    // But keep line structure if possible
    js = js.replace(/\/\*[\s\S]*?\*\//g, '');
    js = js.replace(/\/\/[^\n]*/g, '');

    // Strip #include lines
    js = js.replace(/#include\s*[<"][^>"]+[>"]/g, '// (include)');

    // Strip preprocessor defines: #define NAME VAL
    js = js.replace(/#define\s+([A-Za-z0-9_]+)\s+([^\n]+)/g, 'const $1 = $2;');

    // Preserve const/static qualifiers before rewriting C++ types, otherwise
    // "const int X" would become "const let X" (a JavaScript syntax error).
    js = js.replace(
      /\b(const|static)\s+(unsigned\s+int|unsigned\s+long|int|float|double|long|char|byte|boolean|bool|String|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+/g,
      (match, qualifier) => (qualifier === 'const' ? 'const ' : 'let ')
    );

    // Replace remaining C++ type declarations in variable statements:
    // int, float, double, long, unsigned int, char, byte, boolean, bool, String, uint8_t, etc.
    const typeRegex = /\b(unsigned\s+int|unsigned\s+long|int|float|double|long|char|byte|boolean|bool|String|uint8_t|uint16_t|uint32_t|int8_t|int16_t|int32_t)\s+([A-Za-z0-9_]+)\s*([=;\[])/g;
    js = js.replace(typeRegex, 'let $2 $3');

    // Replace object instantiations:
    // Adafruit_SSD1306 display(128, 64, &Wire, -1); -> const display = new __SSD1306(128, 64);
    js = js.replace(/Adafruit_SSD1306\s+([A-Za-z0-9_]+)\s*\([^)]*\);?/g, 'const $1 = new __SSD1306();');

    // DHT dht(PIN, TYPE); -> const dht = new __DHT(PIN, TYPE);
    js = js.replace(/DHT\s+([A-Za-z0-9_]+)\s*\(([^)]+)\);?/g, 'const $1 = new __DHT($2);');

    // Adafruit_NeoPixel strip(NUM, PIN, TYPE); -> const strip = new __NeoPixel(NUM, PIN);
    js = js.replace(/Adafruit_NeoPixel\s+([A-Za-z0-9_]+)\s*\(([^)]+)\);?/g, 'const $1 = new __NeoPixel($2);');

    // Servo myservo; -> const myservo = new __Servo();
    js = js.replace(/Servo\s+([A-Za-z0-9_]+);?/g, 'const $1 = new __Servo();');

    // Convert function declarations:
    // void setup() { ... } -> async function setup() { ... }
    // void loop() { ... } -> async function loop() { ... }
    // void myFunc(...) -> async function myFunc(...)
    js = js.replace(/\bvoid\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/g, 'async function $1($2) {');

    // Convert other typed functions: int calc(...) -> async function calc(...)
    js = js.replace(/\b(int|float|double|long|bool|boolean|String)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)\s*\{/g, 'async function $2($3) {');

    // Add await to delay calls:
    js = js.replace(/\bdelay\s*\(/g, 'await __delay(');
    js = js.replace(/\bdelayMicroseconds\s*\(/g, 'await __delayMicroseconds(');

    // Add yielding inside loops to prevent hanging browser on while(true)
    js = js.replace(/\bwhile\s*\(([^)]+)\)\s*\{/g, 'while ($1) { await __yield();');
    js = js.replace(/\bfor\s*\(([^)]+)\)\s*\{/g, 'for ($1) { await __yield();');

    return js;
  }

  async run(code) {
    this.stop();
    this.resetState();
    this.isRunning = true;
    this.isPaused = false;
    this.abortController = new AbortController();

    const signal = this.abortController.signal;

    const self = this;
    const board = this.board;

    // Pin mappings and constants
    const HIGH = 1;
    const LOW = 0;
    const INPUT = 'INPUT';
    const OUTPUT = 'OUTPUT';
    const INPUT_PULLUP = 'INPUT_PULLUP';
    const LED_BUILTIN = (board && board.pinAlias && board.pinAlias.LED_BUILTIN !== undefined) ? board.pinAlias.LED_BUILTIN : 2;

    const D0 = board?.pinAlias?.D0 ?? 16;
    const D1 = board?.pinAlias?.D1 ?? 5;
    const D2 = board?.pinAlias?.D2 ?? 4;
    const D3 = board?.pinAlias?.D3 ?? 0;
    const D4 = board?.pinAlias?.D4 ?? 2;
    const D5 = board?.pinAlias?.D5 ?? 14;
    const D6 = board?.pinAlias?.D6 ?? 12;
    const D7 = board?.pinAlias?.D7 ?? 13;
    const D8 = board?.pinAlias?.D8 ?? 15;
    const A0 = 'A0';

    const WHITE = 1;
    const BLACK = 0;
    const INVERSE = 2;

    const WL_CONNECTED = 3;
    const WL_IDLE_STATUS = 0;
    const WL_NO_SSID_AVAIL = 1;

    // Delay helper
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

    const __delayMicroseconds = (us) => __delay(Math.max(1, Math.round(us / 1000)));

    let loopYieldCounter = 0;
    const __yield = async () => {
      if (signal.aborted) throw new Error('ABORTED');
      loopYieldCounter++;
      if (loopYieldCounter % 20 === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    };

    // Hardware functions
    const pinMode = (pin, mode) => {
      const p = self.resolvePinNumber(pin);
      self.boardState.pinModes[p] = mode;
      self.onPinChange(p, self.boardState);
    };

    const digitalWrite = (pin, val) => {
      const p = self.resolvePinNumber(pin);
      const level = (val === HIGH || val === 1 || val === true) ? 1 : 0;
      self.boardState.gpio[p] = level;
      delete self.boardState.pwm[p];
      self.onPinChange(p, self.boardState);
    };

    const digitalRead = (pin) => {
      const p = self.resolvePinNumber(pin);
      const inputs = self.readInputState();
      if (inputs.digital[p] !== undefined) {
        return inputs.digital[p];
      }
      return self.boardState.gpio[p] || 0;
    };

    const analogRead = (pin) => {
      const p = self.resolvePinNumber(pin);
      const inputs = self.readInputState();
      if (inputs.analog[p] !== undefined) {
        return inputs.analog[p];
      }
      // Return 0 if not connected
      return 0;
    };

    const analogWrite = (pin, val) => {
      const p = self.resolvePinNumber(pin);
      const duty = Math.max(0, Math.min(255, Math.round(val)));
      self.boardState.pwm[p] = duty;
      self.boardState.gpio[p] = duty > 127 ? 1 : 0;
      self.onPinChange(p, self.boardState);
    };

    // ESP32 LEDC PWM API
    const ledcChannels = {};
    const ledcSetup = (channel, freq, res) => {
      ledcChannels[channel] = { freq, res, pin: null };
    };
    const ledcAttachPin = (pin, channel) => {
      const p = self.resolvePinNumber(pin);
      if (ledcChannels[channel]) {
        ledcChannels[channel].pin = p;
      }
    };
    const ledcWrite = (channel, duty) => {
      if (ledcChannels[channel] && ledcChannels[channel].pin !== null) {
        const pin = ledcChannels[channel].pin;
        analogWrite(pin, duty);
      }
    };

    const millis = () => Math.round(performance.now() - self.startTime);
    const micros = () => Math.round((performance.now() - self.startTime) * 1000);

    const tone = (pin, freq, duration) => {
      const p = self.resolvePinNumber(pin);
      self.boardState.tonePin = p;
      self.boardState.toneFreq = freq;
      if (self.audioSynth) {
        self.audioSynth.playTone(freq);
      }
      self.onPinChange(p, self.boardState);
      if (duration && duration > 0) {
        setTimeout(() => noTone(p), duration);
      }
    };

    const noTone = (pin) => {
      self.boardState.toneFreq = 0;
      self.boardState.tonePin = null;
      if (self.audioSynth) {
        self.audioSynth.stopTone();
      }
      self.onPinChange(self.resolvePinNumber(pin), self.boardState);
    };

    // Serial implementation
    const Serial = {
      begin: (baud) => {
        self.sendSerial(`[ESP Serial Initialized @ ${baud} baud]\r\n`);
      },
      print: (...args) => {
        self.sendSerial(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
      },
      println: (...args) => {
        self.sendSerial(args.map(a => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ') + '\r\n');
      },
      printf: (format, ...args) => {
        let res = format;
        for (const a of args) {
          res = res.replace(/%[sdif]/, a);
        }
        self.sendSerial(res);
      },
      available: () => self.boardState.serialBuffer.length,
      read: () => self.boardState.serialBuffer.shift() || -1
    };

    // WiFi Simulation
    const WiFi = {
      statusVal: WL_IDLE_STATUS,
      begin: async (ssid, pass) => {
        self.boardState.wifiSSID = ssid;
        self.sendSerial(`[WiFi] Connecting to "${ssid}"...\r\n`);
        WiFi.statusVal = WL_IDLE_STATUS;
        setTimeout(() => {
          WiFi.statusVal = WL_CONNECTED;
          self.boardState.wifiConnected = true;
          self.sendSerial(`[WiFi] Connected to "${ssid}"! IP address: 192.168.4.15\r\n`);
        }, 1500);
      },
      status: () => WiFi.statusVal,
      localIP: () => '192.168.4.15',
      macAddress: () => '24:6F:28:DA:82:1C',
      scanNetworks: () => {
        return [
          { ssid: 'Home_HighSpeed_5G', rssi: -48, enc: 'WPA2' },
          { ssid: 'ESP32_IoT_Network', rssi: -62, enc: 'WPA2' },
          { ssid: 'Guest_WiFi_Open', rssi: -79, enc: 'OPEN' }
        ];
      },
      // ESP32-WROOM-DA Dual Antenna selector
      setDualAntennaConfig: (antMode) => {
        self.boardState.activeAntenna = antMode;
        self.onAntennaChange(antMode);
        self.sendSerial(`[ESP32-WROOM-DA] RF Antenna Mode set to: ${antMode === 1 ? 'ANT1 (Left)' : 'ANT2 (Right)'}\r\n`);
      },
      selectAntenna: (antNum) => {
        self.boardState.activeAntenna = antNum;
        self.onAntennaChange(antNum);
        self.sendSerial(`[ESP32-WROOM-DA] Active Antenna switched to ANT ${antNum}\r\n`);
      }
    };

    // SSD1306 Display Class
    class __SSD1306 {
      constructor() {
        this.buf = self.displayBuffer;
      }
      begin() {
        this.clearDisplay();
      }
      clearDisplay() {
        this.buf.pixels.fill(0);
        this.buf.cursorX = 0;
        this.buf.cursorY = 0;
        self.onOledFlush(this.buf);
      }
      setTextSize(s) { this.buf.textSize = s; }
      setTextColor(c) { this.buf.textColor = c; }
      setCursor(x, y) { this.buf.cursorX = x; this.buf.cursorY = y; }
      print(...args) {
        const text = args.join(' ');
        this.drawText(text);
      }
      println(...args) {
        const text = args.join(' ');
        this.drawText(text);
        this.buf.cursorX = 0;
        this.buf.cursorY += 8 * this.buf.textSize;
      }
      drawText(text) {
        // Simple internal font renderer onto 128x64 buffer
        const scale = this.buf.textSize;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          this.renderChar(char, this.buf.cursorX, this.buf.cursorY, scale);
          this.buf.cursorX += 6 * scale;
        }
      }
      renderChar(c, x, y, scale) {
        // Draw basic 5x7 bitmap approximation
        const ascii = c.charCodeAt(0);
        for (let row = 0; row < 7; row++) {
          for (let col = 0; col < 5; col++) {
            // Render visible pixel if char hash matches
            const lit = ((ascii * (row + 1) * (col + 2)) % 3 !== 0);
            if (lit) {
              for (let dx = 0; dx < scale; dx++) {
                for (let dy = 0; dy < scale; dy++) {
                  this.drawPixel(x + col * scale + dx, y + row * scale + dy, 1);
                }
              }
            }
          }
        }
      }
      drawPixel(x, y, color) {
        if (x >= 0 && x < 128 && y >= 0 && y < 64) {
          this.buf.pixels[y * 128 + x] = color ? 1 : 0;
        }
      }
      drawLine(x0, y0, x1, y1, color) {
        // Bresenham's line algorithm
        let dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
        let dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
        let err = dx + dy, e2;
        while (true) {
          this.drawPixel(x0, y0, color);
          if (x0 === x1 && y0 === y1) break;
          e2 = 2 * err;
          if (e2 >= dy) { err += dy; x0 += sx; }
          if (e2 <= dx) { err += dx; y0 += sy; }
        }
      }
      drawRect(x, y, w, h, color) {
        for (let i = x; i < x + w; i++) { this.drawPixel(i, y, color); this.drawPixel(i, y + h - 1, color); }
        for (let j = y; j < y + h; j++) { this.drawPixel(x, j, color); this.drawPixel(x + w - 1, j, color); }
      }
      fillRect(x, y, w, h, color) {
        for (let j = y; j < y + h; j++) {
          for (let i = x; i < x + w; i++) {
            this.drawPixel(i, j, color);
          }
        }
      }
      display() {
        self.onOledFlush(this.buf);
      }
    }

    // DHT Class
    class __DHT {
      constructor(pin, type) {
        this.pin = self.resolvePinNumber(pin);
        this.type = type;
      }
      begin() {}
      readTemperature() {
        // Find dht component from inputs or return 24.5
        const inputs = self.readInputState();
        return inputs.dht ? inputs.dht.temperature : 24.5;
      }
      readHumidity() {
        const inputs = self.readInputState();
        return inputs.dht ? inputs.dht.humidity : 48.0;
      }
    }

    // NeoPixel Class
    class __NeoPixel {
      constructor(numPixels = 8, pin = 2) {
        this.numPixels = numPixels;
        this.pin = self.resolvePinNumber(pin);
        this.colors = Array.from({ length: numPixels }, () => [0, 0, 0]);
      }
      begin() { this.clear(); }
      clear() {
        this.colors = Array.from({ length: this.numPixels }, () => [0, 0, 0]);
        self.onNeoPixelFlush(this.colors);
      }
      setPixelColor(i, r, g, b) {
        if (typeof r === 'object' && Array.isArray(r)) {
          this.colors[i] = r;
        } else if (g !== undefined && b !== undefined) {
          this.colors[i] = [r, g, b];
        } else if (typeof r === 'number') {
          // Packed 32-bit color: 0xRRGGBB
          const red = (r >> 16) & 0xFF;
          const green = (r >> 8) & 0xFF;
          const blue = r & 0xFF;
          this.colors[i] = [red, green, blue];
        }
      }
      Color(r, g, b) {
        return ((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF);
      }
      show() {
        self.onNeoPixelFlush(this.colors);
      }
    }

    // Servo Class
    class __Servo {
      constructor() {
        this.pin = null;
        this.angle = 90;
      }
      attach(pin) {
        this.pin = self.resolvePinNumber(pin);
        self.onServoMove(this.angle);
      }
      write(angle) {
        this.angle = Math.max(0, Math.min(180, Math.round(angle)));
        self.onServoMove(this.angle);
      }
      read() { return this.angle; }
    }

    // Transpile user code to JavaScript
    let transpiledJS = '';
    try {
      transpiledJS = this.transpileToJS(code);
    } catch (err) {
      this.sendSerial(`[Compiler Error] Syntax error: ${err.message}\r\n`);
      this.isRunning = false;
      return;
    }

    // Build execution bundle
    const runnerCode = `
      return (async function() {
        ${transpiledJS}

        // Run setup
        if (typeof setup === 'function') {
          await setup();
        }

        // Run loop continuously
        if (typeof loop === 'function') {
          while (!signal.aborted) {
            await loop();
            await __yield();
          }
        }
      })();
    `;

    try {
      const runner = new Function(
        'signal', '__delay', '__delayMicroseconds', '__yield',
        'pinMode', 'digitalWrite', 'digitalRead', 'analogRead', 'analogWrite',
        'ledcSetup', 'ledcAttachPin', 'ledcWrite',
        'millis', 'micros', 'tone', 'noTone',
        'Serial', 'WiFi', '__SSD1306', '__DHT', '__NeoPixel', '__Servo',
        'HIGH', 'LOW', 'INPUT', 'OUTPUT', 'INPUT_PULLUP', 'LED_BUILTIN',
        'D0', 'D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'D7', 'D8', 'A0',
        'WHITE', 'BLACK', 'INVERSE',
        'WL_CONNECTED', 'WL_IDLE_STATUS', 'WL_NO_SSID_AVAIL',
        runnerCode
      );

      this.sendSerial(`[ESP Boot] Initializing ${this.board.name}...\r\n`);
      this.sendSerial(`[ESP Boot] CPU Frequency: ${this.board.clockSpeed}\r\n`);
      this.sendSerial(`[ESP Boot] Flash Memory: ${this.board.flashSize}\r\n`);
      if (this.board.hasDualAntenna) {
        this.sendSerial(`[ESP32-WROOM-DA] Dual Antenna Subsystem Active: Antenna 1 (Default)\r\n`);
      }
      this.sendSerial(`----------------------------------------\r\n`);

      await runner(
        signal, __delay, __delayMicroseconds, __yield,
        pinMode, digitalWrite, digitalRead, analogRead, analogWrite,
        ledcSetup, ledcAttachPin, ledcWrite,
        millis, micros, tone, noTone,
        Serial, WiFi, __SSD1306, __DHT, __NeoPixel, __Servo,
        HIGH, LOW, INPUT, OUTPUT, INPUT_PULLUP, LED_BUILTIN,
        D0, D1, D2, D3, D4, D5, D6, D7, D8, A0,
        WHITE, BLACK, INVERSE,
        WL_CONNECTED, WL_IDLE_STATUS, WL_NO_SSID_AVAIL
      );
    } catch (err) {
      if (err.message !== 'ABORTED') {
        this.sendSerial(`\r\n[Runtime Error] ${err.message}\r\n`);
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
    if (this.audioSynth) {
      this.audioSynth.stopTone();
    }
  }
}
