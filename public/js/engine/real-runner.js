// Real Code Execution Engine (Clang++ Native C++ Binary & Python3 Subprocess)
export class RealCodeRunner {
  constructor(options = {}) {
    this.board = options.board;
    this.apiBaseUrl = null; // Will be set by getApiBaseUrl()
    this.audioSynth = options.audioSynth;
    this.onSerialOutput = options.onSerialOutput || (() => {});
    this.onPinChange = options.onPinChange || (() => {});
    this.onAntennaChange = options.onAntennaChange || (() => {});
    this.onOledFlush = options.onOledFlush || (() => {});
    this.onNeoPixelFlush = options.onNeoPixelFlush || (() => {});
    this.onServoMove = options.onServoMove || (() => {});
    this.onServerBegin = options.onServerBegin || (() => {});
    this.onCompilerError = options.onCompilerError || (() => {});
    this.onFinished = options.onFinished || (() => {});

    this.sessionId = null;
    this.eventSource = null;
    this.isRunning = false;
    this.pendingHttpCallbacks = {};

    this.resetState();
  }

  getApiBaseUrl() {
    return window.API_BASE_URL || '';
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
      wifiConnected: false,
      serialBuffer: []
    };
  }

  setBoard(board) {
    this.board = board;
    this.resetState();
  }

  async run(code, language = 'cpp') {
    this.stop();
    this.resetState();

    // Determine API base URL (desktop vs browser)
    const apiBase = this.getApiBaseUrl();

    this.onSerialOutput(`\r\n[Compiler] Invoking native Clang++ C++ compiler...\r\n`);

    try {
      const resp = await fetch(`${apiBase}/api/run-real`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          language,
          board: this.board.id
        })
      });

      const res = await resp.json();

      if (!res.success) {
        this.isRunning = false;
        this.onSerialOutput(`\r\n❌ [Compilation Error]\r\n----------------------------------------\r\n${res.compilerError || 'Unknown error'}\r\n----------------------------------------\r\n`);
        this.onCompilerError(res.compilerError);
        return false;
      }

      this.sessionId = res.sessionId;
      this.isRunning = true;
      this.onSerialOutput(`✔ [Compilation Successful] Native binary launched (${res.mode})\r\n----------------------------------------\r\n`);

      // Connect to SSE stream
      this.connectStream(this.sessionId);
      return true;
    } catch (err) {
      this.isRunning = false;
      this.onSerialOutput(`\r\n[Execution Error] ${err.message}\r\n`);
      return false;
    }
  }

  connectStream(sessionId) {
    const apiBase = this.getApiBaseUrl();
    this.eventSource = new EventSource(`${apiBase}/api/stream/${sessionId}`);

    this.eventSource.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        this.handleHardwareEvent(msg);
      } catch (err) {
        console.error('Failed to parse SSE event:', event.data, err);
      }
    };

    this.eventSource.addEventListener('exit', (e) => {
      this.onSerialOutput(`\r\n[Process Terminated]\r\n`);
      this.stop();
    });

    this.eventSource.onerror = () => {
      if (this.isRunning) {
        this.stop();
      }
    };
  }

  handleHardwareEvent(msg) {
    switch (msg.type) {
      case 'pinMode':
        this.boardState.pinModes[msg.pin] = msg.mode;
        this.onPinChange(msg.pin, this.boardState);
        break;

      case 'digitalWrite':
        this.boardState.gpio[msg.pin] = msg.val;
        delete this.boardState.pwm[msg.pin];
        this.onPinChange(msg.pin, this.boardState);
        break;

      case 'pwm':
        this.boardState.pwm[msg.pin] = msg.duty;
        this.boardState.gpio[msg.pin] = msg.duty > 127 ? 1 : 0;
        this.onPinChange(msg.pin, this.boardState);
        break;

      case 'tone':
        this.boardState.tonePin = msg.pin;
        this.boardState.toneFreq = msg.freq;
        if (this.audioSynth) {
          this.audioSynth.playTone(msg.freq);
        }
        this.onPinChange(msg.pin, this.boardState);
        break;

      case 'noTone':
        this.boardState.tonePin = null;
        this.boardState.toneFreq = 0;
        if (this.audioSynth) {
          this.audioSynth.stopTone();
        }
        this.onPinChange(msg.pin, this.boardState);
        break;

      case 'serial':
        this.onSerialOutput(msg.text);
        break;

      case 'oled':
        if (msg.pixels) {
          this.onOledFlush({ pixels: new Uint8Array(msg.pixels) });
        }
        break;

      case 'neopixel':
        if (msg.colors) {
          this.onNeoPixelFlush(msg.colors);
        }
        break;

      case 'servo':
        if (typeof msg.angle === 'number') {
          this.onServoMove(msg.angle);
        }
        break;

      case 'antenna':
        this.boardState.activeAntenna = msg.id;
        this.onAntennaChange(msg.id);
        break;

      case 'server_begin':
        this.onServerBegin({ ip: msg.ip || '192.168.4.1', port: msg.port || 80 });
        break;

      case 'http_res':
        if (this.pendingHttpCallbacks[msg.id]) {
          this.pendingHttpCallbacks[msg.id](msg);
          delete this.pendingHttpCallbacks[msg.id];
        }
        break;
    }
  }

  sendHttpRequest(req, callback) {
    if (callback) {
      this.pendingHttpCallbacks[req.id] = callback;
    }
    this.sendInput({
      event: 'http_req',
      id: req.id,
      method: req.method || 'GET',
      url: req.url || '/'
    });
  }

  sendInput(data) {
    if (!this.sessionId || !this.isRunning) return;
    const apiBase = this.getApiBaseUrl();
    fetch(`${apiBase}/api/input/${this.sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).catch(() => {});
  }

  pushSerialInput(text) {
    this.sendInput({ event: 'serial_in', text });
  }

  sendDigitalPinInput(pin, val) {
    this.sendInput({ event: 'pin_in', pin, val });
  }

  sendAnalogInput(pin, val) {
    this.sendInput({ event: 'adc_in', pin, val });
  }

  sendDhtInput(temp, hum) {
    this.sendInput({ event: 'dht_in', temp, hum });
  }

  stop() {
    this.isRunning = false;
    if (this.audioSynth) {
      this.audioSynth.stopTone();
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.sessionId) {
      const sid = this.sessionId;
      this.sessionId = null;
      const apiBase = this.getApiBaseUrl();
      fetch(`${apiBase}/api/stop/${sid}`, { method: 'POST' }).catch(() => {});
    }
    this.onFinished();
  }
}
