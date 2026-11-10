// Main Application Coordinator
import { BOARDS } from './boards/board-defs.js';
import { COMPONENTS } from './components/component-defs.js';
import { CircuitNet } from './engine/circuit-net.js';
import { AudioSynth } from './engine/audio-synth.js';
import { ArduinoInterpreter } from './engine/arduino-interpreter.js';
import { MicroPythonInterpreter } from './engine/micropython-interpreter.js';
import { RealCodeRunner } from './engine/real-runner.js';
import { CircuitCanvas } from './ui/canvas.js';
import { CodeEditor } from './ui/editor.js';
import { SerialMonitor } from './ui/serial.js';
import { PinInspector } from './ui/inspector.js';
import { EXAMPLES } from './ui/examples.js';

// Shared Core (Stage 2 Modularization)
import {
  Board as SharedBoard,
  Component as SharedComponent,
  Wire,
  CircuitNet as SharedCircuitNet,
  Project as SharedProject,
  validateBoardData,
  validateComponentData,
  validateProjectData,
  PROJECT_SCHEMA_VERSION,
  LANGUAGE,
  RUNNER_MODE,
  ERROR_MESSAGES,
  ValidationError
} from './shared/core/index.js';
import { EventBus } from './shared/core/events/event-bus.js';
import {
  ProjectService,
  BoardService,
  ComponentService,
  CircuitService,
  ExecutionService,
  SessionService,
  ConfigService
} from './application/services/index.js';
import {
  ArduinoInterpreterAdapter,
  MicroPythonInterpreterAdapter,
  RealCodeRunnerAdapter
} from './application/services/engines/index.js';
import { ElectronAdapter } from './platform/electron/ipc-adapter.js';
import { BrowserAdapter } from './platform/browser/ipc-adapter.js';

// Wire Service Layer (Stage 3.3)
import { WireConnectionService } from './wire/WireConnectionService.js';
import { WireRemovalService } from './wire/WireRemovalService.js';
import { WireValidationService } from './wire/WireValidationService.js';
import { WireInteractionController } from './wire/WireInteractionController.js';

class ESPApp {
  constructor() {
    this.currentBoardId = 'esp8266-nodemcu';
    this.currentLanguage = 'cpp'; // 'cpp' | 'python'
    this.runnerMode = 'browser'; // 'native' (clang++ / python3) | 'browser'
    this.compilerAvailable = false; // Set from runtime detection in initDesktop
    this.circuitNet = new CircuitNet();
    this.audioSynth = new AudioSynth();
    this.selectedComponent = null;
    this.libraries = [];
    try { this.libraries = JSON.parse(localStorage.getItem('espLibraries') || '[]'); } catch {}

    // Set default API base URL (empty = relative/same origin for browser mode)
    if (!window.API_BASE_URL) {
      window.API_BASE_URL = '';
    }

    // Stage 2: Shared core services (instantiated in _initSharedCoreServices)
    this.eventBus = null;
    this.boardService = null;
    this.componentService = null;
    this.circuitService = null;
    this.executionService = null;
    this.sessionService = null;
    this.configService = null;
    this.platformAdapter = null;

    // Stage 2: Shared core model instances (for validation and serialization)
    this.SharedBoard = SharedBoard;
    this.SharedComponent = SharedComponent;
    this.SharedWire = Wire;
    this.SharedProject = SharedProject;

    // Stage 3: Wire service layer
    this.wireConnectionService = null;
    this.wireRemovalService = null;
    this.wireValidationService = null;
    this.wireInteractionController = null;

    // Current execution session ID (set when Run is clicked)
    this.currentExecutionSessionId = null;

    this.init();
  }

  init() {
    this.initCanvas();
    this.initEditor();
    this.initSerial();
    this.initInspector();
    this.initInterpreters();
    this.initToolbarEvents();
    this.initBottomDock();
    this.initLibraries();
    this.initWireManager();
    this.initProjects();
    this.initRemoteConnect();
    this.initExamplesLibrary();
    this.initComponentPalette();
    this.initExamplePicker();
    this.startSimulationLoop();

    // Stage 2: Initialize shared core services
    this._initSharedCoreServices();

    // Load initial example (ESP8266 Blink)
    this.loadExample(EXAMPLES[0]);
  }

  // Stage 2: Initialize shared core services
  _initSharedCoreServices() {
    // Event bus for cross-module communication
    this.eventBus = new EventBus();

    // Platform adapter (Electron or browser)
    this.platformAdapter = typeof window.desktopAPI !== 'undefined'
      ? new ElectronAdapter({ desktopAPI: window.desktopAPI, eventBus: this.eventBus })
      : new BrowserAdapter({ eventBus: this.eventBus });

    // Board service (registers all board definitions from board-defs.js)
    this.boardService = new BoardService({ eventBus: this.eventBus });
    for (const [boardId, boardData] of Object.entries(BOARDS)) {
      this.boardService.registerBoard(boardData);
    }

    // Component service (registers all component definitions from component-defs.js)
    this.componentService = new ComponentService({ eventBus: this.eventBus });
    for (const [componentType, componentData] of Object.entries(COMPONENTS)) {
      this.componentService.registerComponent(componentData);
    }

    // Circuit service (wraps shared core CircuitNet)
    this.circuitService = new CircuitService({
      circuitNet: new SharedCircuitNet(),
      eventBus: this.eventBus
    });

    // Session service
    this.sessionService = new SessionService({ eventBus: this.eventBus });

    // Execution service with engine adapters wrapping existing interpreter instances
    this.executionService = new ExecutionService({
      eventBus: this.eventBus,
      sessionManager: this.sessionService,
      defaultEngineId: 'arduino-interpreter'
    });

    // Arduino interpreter adapter
    const arduinoAdapter = new ArduinoInterpreterAdapter({
      interpreter: this.arduinoInterpreter,
      audioSynth: this.audioSynth,
      board: BOARDS[this.currentBoardId],
      supportedBoards: Object.keys(BOARDS),
      eventBus: this.eventBus
    });
    this.executionService.registerEngine(arduinoAdapter);

    // MicroPython interpreter adapter
    const micropythonAdapter = new MicroPythonInterpreterAdapter({
      interpreter: this.microPythonInterpreter,
      audioSynth: this.audioSynth,
      board: BOARDS[this.currentBoardId],
      supportedBoards: Object.keys(BOARDS),
      eventBus: this.eventBus
    });
    this.executionService.registerEngine(micropythonAdapter);

    // Real code runner adapter (native C++/Python via backend)
    const realRunnerAdapter = new RealCodeRunnerAdapter({
      runner: this.realCodeRunner,
      audioSynth: this.audioSynth,
      board: BOARDS[this.currentBoardId],
      supportedBoards: Object.keys(BOARDS),
      eventBus: this.eventBus
    });
    this.executionService.registerEngine(realRunnerAdapter);

    // Config service
    this.configService = new ConfigService({ eventBus: this.eventBus });

    // Wire service layer (Stage 3)
    this.wireValidationService = new WireValidationService();
    this.wireConnectionService = new WireConnectionService({
      circuitNet: this.circuitNet,
      validationService: this.wireValidationService,
      eventBus: this.eventBus
    });
    this.wireRemovalService = new WireRemovalService({
      connectionService: this.wireConnectionService,
      eventBus: this.eventBus
    });
    this.wireInteractionController = new WireInteractionController({
      validationService: this.wireValidationService,
      connectionService: this.wireConnectionService,
      eventBus: this.eventBus
    });

    // Wire up canvas with wire service
    if (this.canvas) {
      this.canvas.setWireService(this.wireConnectionService);
    }

    // Wire up execution service events to app serial output
    this.eventBus.subscribe('execution:started', (event) => {
      this.serial.appendOutput(`\r\n[Execution Started] Session: ${event.sessionId}, Engine: ${event.engine}, Language: ${event.language}, Board: ${event.boardId}\r\n`);
    });

    this.eventBus.subscribe('execution:stopped', (event) => {
      this.serial.appendOutput(`\r\n[Execution Stopped] Session: ${event.sessionId}, Engine: ${event.engine}\r\n`);
    });

    this.eventBus.subscribe('execution:failed', (event) => {
      this.serial.appendOutput(`\r\n[Execution Failed] Session: ${event.sessionId}, Error: ${event.error}\r\n`);
    });

    // Sync session service with execution service
    this.sessionService.setExecutionService(this.executionService);
  }

  initCanvas() {
    const canvasContainer = document.getElementById('canvas-container');
    const board = BOARDS[this.currentBoardId];

    this.canvas = new CircuitCanvas(canvasContainer, {
      board,
      circuitNet: this.circuitNet,
      onComponentChange: (comps) => {
        this.updateInspector();
        if (this.runnerMode === 'native' && this.realCodeRunner && this.realCodeRunner.isRunning) {
          this.syncNativeInputs();
        }
      },
      onWireChange: () => {
        this.updateInspector();
        if (this.runnerMode === 'native' && this.realCodeRunner && this.realCodeRunner.isRunning) {
          this.syncNativeInputs();
        }
      },
      onSelectComponent: (comp) => {
        this.selectedComponent = comp;
        this.updateComponentPropsPanel(comp);
      }
    });
  }

  initEditor() {
    const editorContainer = document.getElementById('editor-container');
    this.editor = new CodeEditor(editorContainer, {
      language: this.currentLanguage,
      initialValue: ''
    });
  }

  initSerial() {
    const serialContainer = document.getElementById('serial-container');
    this.serial = new SerialMonitor(serialContainer, {
      onSend: (text) => {
        if (this.runnerMode === 'native' && this.realCodeRunner.isRunning) {
          this.realCodeRunner.pushSerialInput(text);
        } else if (this.currentInterpreter && this.currentInterpreter.isRunning) {
          this.currentInterpreter.pushSerialInput(text);
        }
      }
    });
  }

  initInspector() {
    const inspectorContainer = document.getElementById('inspector-container');
    const board = BOARDS[this.currentBoardId];
    this.inspector = new PinInspector(inspectorContainer, {
      board,
      onAntennaToggle: () => {
        if (this.currentBoardId === 'esp32-wroom-da') {
          const state = this.getActiveState();
          const current = state.activeAntenna || 1;
          const next = current === 1 ? 2 : 1;
          state.activeAntenna = next;
          this.canvas.renderBoard(state);
          this.inspector.update(state);
          this.serial.appendOutput(`[Manual] Switched RF Antenna to Antenna ${next}\r\n`);
        }
      }
    });
  }

  getActiveState() {
    if (this.runnerMode === 'native' && this.realCodeRunner && this.realCodeRunner.isRunning) {
      return this.realCodeRunner.boardState;
    }
    return this.currentInterpreter ? this.currentInterpreter.boardState : {};
  }

  initInterpreters() {
    const options = {
      board: BOARDS[this.currentBoardId],
      audioSynth: this.audioSynth,
      onSerialOutput: (text) => {
        this.serial.appendOutput(text);
      },
      onPinChange: (pin, state) => {
        this.canvas.renderBoard(state);
        this.inspector.update(state);
      },
      onAntennaChange: (ant) => {
        const state = this.getActiveState();
        this.canvas.renderBoard(state);
        this.inspector.update(state);
      },
      onOledFlush: (buf) => {
        this.canvas.updateOledDisplay(buf);
      },
      onNeoPixelFlush: (colors) => {
        this.canvas.updateNeoPixels(colors);
      },
      onServoMove: (angle) => {
        this.canvas.updateServoAngle(angle);
      },
      readInputState: () => {
        const board = BOARDS[this.currentBoardId];
        const state = this.currentInterpreter ? this.currentInterpreter.boardState : {};
        const inputs = this.circuitNet.solve(board, state, this.canvas.components);

        const dhtComp = this.canvas.components.find(c => c.type === 'dht22');
        if (dhtComp && dhtComp.props) {
          inputs.dht = {
            temperature: dhtComp.props.temperature,
            humidity: dhtComp.props.humidity
          };
        }

        return inputs;
      }
    };

    // Client-side interpreters
    this.arduinoInterpreter = new ArduinoInterpreter(options);
    this.microPythonInterpreter = new MicroPythonInterpreter(options);
    this.currentInterpreter = (this.currentLanguage === 'cpp') ? this.arduinoInterpreter : this.microPythonInterpreter;

    // Real Native Code Runner (Clang++ / Python3 Process)
    this.realCodeRunner = new RealCodeRunner({
      ...options,
      onCompilerError: (err) => {
        this.updateRunButtonUI(false);
        // Automatically switch tab to serial monitor to view exact compiler diagnostics
        const tabSerial = document.getElementById('tab-btn-serial');
        const tabInspector = document.getElementById('tab-btn-inspector');
        const panelSerial = document.getElementById('serial-container');
        const panelInspector = document.getElementById('inspector-container');
        if (tabSerial && panelSerial) {
          tabSerial.classList.add('border-sky-500', 'text-sky-400');
          tabInspector.classList.remove('border-sky-500', 'text-sky-400');
          panelSerial.classList.remove('hidden');
          panelInspector.classList.add('hidden');
        }
      },
      onFinished: () => {
        this.updateRunButtonUI(false);
      }
    });
  }

  syncNativeInputs() {
    const board = BOARDS[this.currentBoardId];
    const state = this.realCodeRunner.boardState;
    const inputs = this.circuitNet.solve(board, state, this.canvas.components);

    if (inputs.digital) {
      for (const [pin, val] of Object.entries(inputs.digital)) {
        this.realCodeRunner.sendDigitalPinInput(parseInt(pin, 10), val);
      }
    }

    if (inputs.analog) {
      for (const [pin, val] of Object.entries(inputs.analog)) {
        this.realCodeRunner.sendAnalogInput(pin === 'A0' ? 100 : parseInt(pin, 10), val);
      }
    }

    const dht = this.canvas.components.find(c => c.type === 'dht22');
    if (dht && dht.props) {
      this.realCodeRunner.sendDhtInput(dht.props.temperature, dht.props.humidity);
    }
  }

  initToolbarEvents() {
    // Board Selector
    const boardSelect = document.getElementById('board-select');
    boardSelect.value = this.currentBoardId;
    boardSelect.addEventListener('change', (e) => {
      this.switchBoard(e.target.value);
    });

    // Language Toggle
    const langSelect = document.getElementById('lang-select');
    langSelect.value = this.currentLanguage;
    langSelect.addEventListener('change', (e) => {
      this.switchLanguage(e.target.value);
    });

    // Runner Mode Selector (Real Native Clang++ vs In-Browser)
    const runnerSelect = document.getElementById('runner-mode-select');
    if (runnerSelect) {
      runnerSelect.value = this.runnerMode;
      runnerSelect.addEventListener('change', (e) => {
        this.stopSimulation();
        this.runnerMode = e.target.value;
        const modeDesc = (this.runnerMode === 'native') 
          ? (this.currentLanguage === 'cpp' ? 'Native Clang++ Real C++17 Binary' : 'Real Python3 Process')
          : 'In-Browser Fast Runner';
        this.serial.appendOutput(`\r\n[Runner Mode] Switched to: ${modeDesc}\r\n`);
      });
    }

    // Run / Stop Simulation Button (prominent)
    const runBtn = document.getElementById('btn-run-sim');

    runBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isRunning = (this.runnerMode === 'native') ? this.realCodeRunner.isRunning : this.currentInterpreter.isRunning;
      if (isRunning) {
        this.stopSimulation();
      } else {
        this.runSimulation();
      }
    });

    // Spacebar shortcut to start/stop
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && !e.target.closest('input, textarea, select')) {
        e.preventDefault();
        const isRunning = (this.runnerMode === 'native') ? this.realCodeRunner.isRunning : this.currentInterpreter.isRunning;
        if (isRunning) this.stopSimulation();
        else this.runSimulation();
      }
    });

    // Reset Button
    const resetBtn = document.getElementById('btn-reset-sim');
    resetBtn.addEventListener('click', () => {
      this.resetSimulation();
    });

    // Wire Color Picker
    const colorPills = document.querySelectorAll('.wire-color-pill');
    colorPills.forEach(pill => {
      pill.addEventListener('click', () => {
        colorPills.forEach(p => p.classList.remove('ring-2', 'ring-white', 'scale-110'));
        pill.classList.add('ring-2', 'ring-white', 'scale-110');
        this.canvas.selectedWireColor = pill.dataset.color;
      });
    });

    // Clear Wires Button
    const clearWiresBtn = document.getElementById('btn-clear-wires');
    if (clearWiresBtn) {
      clearWiresBtn.addEventListener('click', () => {
        if (confirm('Remove all circuit wire connections?')) {
          this.circuitNet.clear();
          this.canvas.renderWires();
          this.updateInspector();
        }
      });
    }

    // Clear All (New Blank Project)
    const newProjBtn = document.getElementById('btn-new-project');
    if (newProjBtn) {
      newProjBtn.addEventListener('click', () => this.newProject());
    }

    // Copy Code Button
    const copyBtn = document.getElementById('btn-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', async () => {
        const code = this.editor.getValue();
        try {
          await navigator.clipboard.writeText(code);
          copyBtn.innerHTML = `
            <svg class="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          `;
          setTimeout(() => {
            copyBtn.innerHTML = `
              <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            `;
          }, 1800);
        } catch {
          copyBtn.title = 'Selected all';
        }
      });
    }

    // Bottom Panel Tabs
    const tabSerial = document.getElementById('tab-btn-serial');
    const tabInspector = document.getElementById('tab-btn-inspector');
    const panelSerial = document.getElementById('serial-container');
    const panelInspector = document.getElementById('inspector-container');

    tabSerial.addEventListener('click', () => {
      tabSerial.classList.add('border-sky-500', 'text-sky-400');
      tabSerial.classList.remove('border-transparent', 'text-slate-400');
      tabInspector.classList.remove('border-sky-500', 'text-sky-400');
      tabInspector.classList.add('border-transparent', 'text-slate-400');
      panelSerial.classList.remove('hidden');
      panelInspector.classList.add('hidden');
    });

    tabInspector.addEventListener('click', () => {
      tabInspector.classList.add('border-sky-500', 'text-sky-400');
      tabInspector.classList.remove('border-transparent', 'text-slate-400');
      tabSerial.classList.remove('border-sky-500', 'text-sky-400');
      tabSerial.classList.add('border-transparent', 'text-slate-400');
      panelInspector.classList.remove('hidden');
      panelSerial.classList.add('hidden');
      this.updateInspector();
    });

    // Audio Mute Button
    const muteBtn = document.getElementById('btn-mute-sound');
    if (muteBtn) {
      muteBtn.addEventListener('click', () => {
        const isMuted = this.audioSynth.toggleMute();
        muteBtn.innerHTML = isMuted 
          ? `<svg class="w-3.5 h-3.5 text-slate-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
             </svg>
             <span>Audio Muted</span>`
          : `<svg class="w-3.5 h-3.5 text-sky-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
               <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
             </svg>
             <span>Audio ON</span>`;
        muteBtn.className = isMuted 
          ? 'px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-400 border border-slate-700 flex items-center space-x-1.5'
          : 'px-2.5 py-1.5 text-xs rounded-lg bg-sky-950 text-sky-400 border border-sky-800/80 flex items-center space-x-1.5';
      });
    }

    // Canvas Zoom Controls
    const zoomInBtn = document.getElementById('btn-zoom-in');
    const zoomOutBtn = document.getElementById('btn-zoom-out');
    const zoomResetBtn = document.getElementById('btn-zoom-reset');

    if (zoomInBtn) {
      zoomInBtn.addEventListener('click', () => {
        this.canvas.boardPos.x += 10;
        this.canvas.boardPos.y += 10;
        this.canvas.layerBoard.setAttribute('transform', `translate(${this.canvas.boardPos.x}, ${this.canvas.boardPos.y})`);
        this.canvas.renderWires();
      });
    }

    if (zoomOutBtn) {
      zoomOutBtn.addEventListener('click', () => {
        this.canvas.boardPos.x = Math.max(20, this.canvas.boardPos.x - 10);
        this.canvas.boardPos.y = Math.max(20, this.canvas.boardPos.y - 10);
        this.canvas.layerBoard.setAttribute('transform', `translate(${this.canvas.boardPos.x}, ${this.canvas.boardPos.y})`);
        this.canvas.renderWires();
      });
    }

    if (zoomResetBtn) {
      zoomResetBtn.addEventListener('click', () => {
        this.canvas.boardPos = { x: 90, y: 70 };
        this.canvas.layerBoard.setAttribute('transform', `translate(90, 70)`);
        this.canvas.renderWires();
      });
    }

    // Export Project Button
    const exportBtn = document.getElementById('btn-export-project');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportProject());
    }

    // Import Project Button
    const importInput = document.getElementById('input-import-file');
    const importBtn = document.getElementById('btn-import-project');
    if (importBtn && importInput) {
      importBtn.addEventListener('click', () => importInput.click());
      importInput.addEventListener('change', (e) => this.importProject(e));
    }
  }

  initLibraries() {
    const modal = document.getElementById('libs-modal');
    const btn = document.getElementById('btn-libraries');
    const closeBtn = document.getElementById('libs-close');
    const addBtn = document.getElementById('libs-add');
    const saveBtn = document.getElementById('libs-save');
    const delBtn = document.getElementById('libs-delete');
    const listEl = document.getElementById('libs-list');
    const nameEl = document.getElementById('libs-name');
    const codeEl = document.getElementById('libs-code');
    const zipInput = document.getElementById('libs-zip-input');
    const statusEl = document.getElementById('libs-status');

    let selectedIdx = -1;

    const persist = () => {
      try { localStorage.setItem('espLibraries', JSON.stringify(this.libraries)); } catch {}
    };

    const renderList = () => {
      listEl.innerHTML = this.libraries.map((l, i) => `
        <button data-idx="${i}" class="w-full text-left px-2 py-1 rounded text-xs ${i === selectedIdx ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">${l.name || 'Untitled'}${l.fromZip ? ' 📦' : ''}</button>
      `).join('');
      listEl.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          selectedIdx = parseInt(b.dataset.idx, 10);
          const l = this.libraries[selectedIdx];
          nameEl.value = l.name || '';
          codeEl.value = l.code || '';
          renderList();
        });
      });
    };

    const setStatus = (txt, ok) => {
      if (statusEl) {
        statusEl.textContent = txt;
        statusEl.className = 'text-[10px] mt-2 ' + (ok ? 'text-emerald-400' : 'text-red-400');
      }
    };

    btn.addEventListener('click', () => {
      modal.classList.remove('hidden');
      renderList();
    });
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    addBtn.addEventListener('click', () => {
      this.libraries.push({ name: 'NewLib', code: '' });
      selectedIdx = this.libraries.length - 1;
      nameEl.value = this.libraries[selectedIdx].name;
      codeEl.value = '';
      renderList();
      persist();
    });

    saveBtn.addEventListener('click', () => {
      if (selectedIdx < 0 || selectedIdx >= this.libraries.length) return;
      this.libraries[selectedIdx].name = nameEl.value.trim() || 'Untitled';
      this.libraries[selectedIdx].code = codeEl.value;
      persist();
      renderList();
      setStatus('Library saved', true);
    });

    delBtn.addEventListener('click', () => {
      if (selectedIdx < 0 || selectedIdx >= this.libraries.length) return;
      this.libraries.splice(selectedIdx, 1);
      selectedIdx = -1;
      nameEl.value = '';
      codeEl.value = '';
      persist();
      renderList();
      setStatus('Library deleted', true);
    });

    // Import .zip library (Arduino IDE style)
    if (zipInput) {
      zipInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setStatus('Extracting zip...', true);
        try {
          if (typeof JSZip === 'undefined') {
            setStatus('JSZip not loaded', false);
            return;
          }
          const zip = await JSZip.loadAsync(file);
          // Collect all code files (.h, .cpp, .c, .ino, .hpp)
          const codeFiles = [];
          const fileNames = [];
          zip.forEach((relativePath, zipEntry) => {
            if (!zipEntry.dir && /\.(h|hpp|cpp|c|ino|cc)$/i.test(relativePath)) {
              codeFiles.push(zipEntry);
              fileNames.push(relativePath);
            }
          });

          if (codeFiles.length === 0) {
            setStatus('No code files found in zip', false);
            return;
          }

          // Extract content from all code files
          let combinedCode = '';
          let libName = file.name.replace(/\.zip$/i, '');
          for (const entry of codeFiles) {
            const content = await entry.async('string');
            combinedCode += `// === ${entry.name} ===\\n${content}\\n\\n`;
            // Try to extract library name from library.properties
            if (entry.name.endsWith('library.properties')) {
              const nameMatch = content.match(/name=(.+)/);
              if (nameMatch) libName = nameMatch[1].trim();
            }
          }

          // Try to find a library.properties for the name
          const propEntry = zip.file(/library\.properties$/i)[0];
          if (propEntry) {
            const propContent = await propEntry.async('string');
            const nameMatch = propContent.match(/name=(.+)/);
            if (nameMatch) libName = nameMatch[1].trim();
          }

          // Add as a new library
          this.libraries.push({ name: libName, code: combinedCode, fromZip: true });
          selectedIdx = this.libraries.length - 1;
          nameEl.value = libName;
          codeEl.value = combinedCode;
          persist();
          renderList();
          setStatus(`Imported "${libName}" (${codeFiles.length} files)`, true);
        } catch (err) {
          setStatus('Failed: ' + err.message, false);
        }
        // Reset input so same file can be re-imported
        zipInput.value = '';
      });
    }

    renderList();
  }

  // ── Bottom Dock Initialization ──────────────────────────────────────
  initBottomDock() {
    const dockTabs = document.querySelectorAll('#bottom-dock .dock-tab');
    const dockContents = document.querySelectorAll('#bottom-dock .dock-content');

    dockTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const target = tab.id.replace('dock-tab-', 'dock-');
        dockTabs.forEach(t => {
          t.classList.remove('active');
          t.classList.remove('bg-emerald-600', 'hover:bg-emerald-500', 'text-white');
          t.classList.add('text-slate-400', 'border-transparent');
        });
        dockContents.forEach(c => c.classList.remove('active'));
        const targetEl = document.getElementById(target);
        if (targetEl) {
          targetEl.classList.add('active');
          tab.classList.add('active');
          tab.classList.remove('text-slate-400', 'border-transparent');
          tab.classList.add('bg-emerald-600', 'hover:bg-emerald-500', 'text-white');
        }
      });
    });

    // Dock serial send button
    const dockSerialSend = document.getElementById('dock-serial-send');
    const dockSerialInput = document.getElementById('dock-serial-input');
    if (dockSerialSend && dockSerialInput) {
      dockSerialSend.addEventListener('click', () => {
        const text = dockSerialInput.value;
        if (text) {
          this.serial.appendOutput(`> ${text}\r\n`, true);
          if (this.runnerMode === 'native' && this.realCodeRunner && this.realCodeRunner.isRunning) {
            this.realCodeRunner.pushSerialInput(text + '\n');
          } else if (this.currentInterpreter && this.currentInterpreter.isRunning) {
            this.currentInterpreter.pushSerialInput(text + '\n');
          }
          dockSerialInput.value = '';
        }
      });
      dockSerialInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          dockSerialSend.click();
        }
      });
    }

    // Dock run/stop/reset buttons
    const dockBtnRun = document.getElementById('dock-btn-run');
    const dockBtnStop = document.getElementById('dock-btn-stop');
    const dockBtnReset = document.getElementById('dock-btn-reset');

    if (dockBtnRun) {
      dockBtnRun.addEventListener('click', () => {
        this.runSimulation().catch(() => {});
      });
    }
    if (dockBtnStop) {
      dockBtnStop.addEventListener('click', () => {
        this.stopSimulation();
      });
    }
    if (dockBtnReset) {
      dockBtnReset.addEventListener('click', () => {
        this.resetSimulation();
      });
    }
  }

  initProjects() {
    const modal = document.getElementById('proj-modal');
    const btn = document.getElementById('btn-projects');
    const closeBtn = document.getElementById('proj-close');
    const saveBtn = document.getElementById('proj-save');
    const nameEl = document.getElementById('proj-name');
    const listEl = document.getElementById('proj-list');

    const getBrowserProjects = () => {
      try { return JSON.parse(localStorage.getItem('espProjects') || '[]'); } catch { return []; }
    };
    const setBrowserProjects = (ps) => {
      try { localStorage.setItem('espProjects', JSON.stringify(ps)); } catch {}
    };
    const escapeHtml = (value) => String(value == null ? '' : value).replace(/[&<>"']/g, (ch) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));

    const renderList = async () => {
      const rows = [];
      if (this.isDesktop()) {
        try {
          const projects = await window.desktopAPI.getAllProjects();
          for (const p of (projects || [])) {
            rows.push({
              key: p.filename,
              name: p.name || p.filename,
              meta: [p.board, p.updatedAt ? new Date(p.updatedAt).toLocaleString() : ''].filter(Boolean).join(' • ')
            });
          }
        } catch (err) {
          listEl.innerHTML = `<div class="text-xs text-red-400 p-2">Failed to read projects: ${escapeHtml(err.message)}</div>`;
          return;
        }
      } else {
        getBrowserProjects().forEach((p, i) => {
          rows.push({ key: String(i), name: p.name, meta: '' });
        });
      }

      if (!rows.length) {
        listEl.innerHTML = '<div class="text-xs text-slate-500 p-2">No saved projects yet.</div>';
        return;
      }

      listEl.innerHTML = rows.map((row) => `
        <div class="flex items-center justify-between bg-slate-800 rounded px-2 py-1.5 gap-2">
          <div class="min-w-0">
            <div class="text-xs text-slate-200 truncate">${escapeHtml(row.name)}</div>
            ${row.meta ? `<div class="text-[10px] text-slate-500 truncate">${escapeHtml(row.meta)}</div>` : ''}
          </div>
          <div class="space-x-1 shrink-0">
            <button data-key="${escapeHtml(row.key)}" data-act="load" class="px-2 py-0.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-[10px]">Load</button>
            <button data-key="${escapeHtml(row.key)}" data-act="del" class="px-2 py-0.5 bg-red-600 hover:bg-red-500 text-white rounded text-[10px]">Delete</button>
          </div>
        </div>
      `).join('');

      listEl.querySelectorAll('button').forEach((b) => {
        b.addEventListener('click', async () => {
          const key = b.dataset.key;
          if (b.dataset.act === 'load') {
            if (this.isDesktop()) {
              try {
                const project = await this.loadProjectDesktop(key);
                if (project) modal.classList.add('hidden');
              } catch {}
            } else {
              const project = getBrowserProjects()[parseInt(key, 10)];
              if (project) {
                this.loadExample(project.data);
                modal.classList.add('hidden');
              }
            }
          } else if (b.dataset.act === 'del') {
            if (!confirm('Delete this saved project?')) return;
            if (this.isDesktop()) {
              try { await window.desktopAPI.deleteProject(key); } catch (err) { alert('Failed to delete project: ' + err.message); }
            } else {
              const ps = getBrowserProjects();
              ps.splice(parseInt(key, 10), 1);
              setBrowserProjects(ps);
            }
            await renderList();
          }
        });
      });
    };

    btn.addEventListener('click', () => { modal.classList.remove('hidden'); renderList(); });
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });

    saveBtn.addEventListener('click', async () => {
      const name = nameEl.value.trim() || 'Untitled Project';
      const data = {
        name,
        board: this.currentBoardId,
        language: this.currentLanguage,
        runnerMode: this.runnerMode,
        code: this.editor.getValue(),
        components: JSON.parse(JSON.stringify(this.canvas.components)),
        wires: JSON.parse(JSON.stringify(this.circuitNet.wires)),
        updatedAt: new Date().toISOString()
      };

      if (this.isDesktop()) {
        try {
          const result = await window.desktopAPI.saveProject(data);
          if (!result.success) throw new Error(result.error || 'Save failed');
          this.serial.appendOutput(`[Desktop] Project saved: ${result.filename}\r\n`);
        } catch (err) {
          alert('Failed to save project: ' + err.message);
          return;
        }
      } else {
        const ps = getBrowserProjects();
        ps.push({ name, data });
        setBrowserProjects(ps);
      }

      nameEl.value = '';
      await renderList();
    });
  }

  initRemoteConnect() {
    const modal = document.getElementById('remote-modal');
    const btn = document.getElementById('btn-remote-connect');
    const closeBtn = document.getElementById('remote-close');
    const joinBtn = document.getElementById('remote-connect');
    const discBtn = document.getElementById('remote-disconnect');
    const statusEl = document.getElementById('remote-status');
    const serverEl = document.getElementById('remote-server');
    const sessionEl = document.getElementById('remote-session');
    const controlsEl = document.getElementById('remote-controls');
    const dotEl = document.getElementById('remote-dot');
    const serialInput = document.getElementById('remote-serial');
    const serialSend = document.getElementById('remote-serial-send');

    let remoteSessionId = null;
    let remoteServer = '';

    const setStatus = (txt, ok) => {
      statusEl.textContent = txt;
      statusEl.className = 'text-[10px] min-h-[14px]' + (ok ? ' text-emerald-400' : ' text-red-400');
      dotEl.className = 'w-1.5 h-1.5 rounded-full ' + (ok ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600');
    };

    const setConnected = (connected) => {
      joinBtn.classList.toggle('hidden', connected);
      discBtn.classList.toggle('hidden', !connected);
      controlsEl.innerHTML = '';
      if (connected) {
        // Build quick controls for common pins D0-D8 + A0
        const pins = ['D0','D1','D2','D3','D4','D5','D6','D7','D8','A0'];
        for (const pin of pins) {
          const card = document.createElement('div');
          card.className = 'bg-slate-800 border border-slate-700 rounded p-2 flex flex-col items-center gap-1';
          card.innerHTML = `
            <div class="text-[10px] font-mono text-slate-300">${pin}</div>
            <div class="flex gap-1">
              <button data-pin="${pin}" data-val="0" class="flex-1 px-1 py-1 bg-slate-700 hover:bg-slate-600 text-[10px] text-slate-200 rounded border border-slate-600">LOW</button>
              <button data-pin="${pin}" data-val="1" class="flex-1 px-1 py-1 bg-slate-700 hover:bg-slate-600 text-[10px] text-slate-200 rounded border border-slate-600">HIGH</button>
            </div>
            <div class="w-full">
              <input type="range" min="0" max="1023" data-pin="${pin}" class="w-full accent-cyan-500 h-1"/>
            </div>
          `;
          card.querySelectorAll('button').forEach(b => {
            b.addEventListener('click', () => this.remoteSendPin(b.dataset.pin, parseInt(b.dataset.val, 10)));
          });
          const range = card.querySelector('input');
          range.addEventListener('input', (e) => this.remoteSendAnalog(range.dataset.pin, parseInt(e.target.value, 10)));
          controlsEl.appendChild(card);
        }
      }
    };

    const postRemote = async (path, body) => {
      const url = remoteServer + path;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        return res.ok;
      } catch { return false; }
    };

    const resolvePin = (pin) => {
      const b = BOARDS[this.currentBoardId];
      if (typeof pin === 'number') return pin;
      if (b && b.pinAlias && b.pinAlias[pin] !== undefined) return b.pinAlias[pin];
      const n = parseInt(pin, 10);
      return isNaN(n) ? pin : n;
    };

    this.remoteSendPin = async (pin, val) => {
      if (!remoteSessionId) return;
      const np = resolvePin(pin);
      const ok = await postRemote(`/api/input/${remoteSessionId}`, { event: 'pin_in', pin: np, val });
      setStatus(ok ? `Pin ${pin} -> ${val}` : `Failed to set pin ${pin}`, ok);
    };

    this.remoteSendAnalog = async (pin, val) => {
      if (!remoteSessionId) return;
      const np = resolvePin(pin);
      const ok = await postRemote(`/api/input/${remoteSessionId}`, { event: 'adc_in', pin: np, val });
      setStatus(ok ? `ADC ${pin} -> ${val}` : `Failed to set ADC ${pin}`, ok);
    };

    btn.addEventListener('click', () => { modal.classList.remove('hidden'); });
    closeBtn.addEventListener('click', () => { modal.classList.add('hidden'); this.remoteDisconnect(); });
    modal.addEventListener('click', (e) => { if (e.target === modal) { modal.classList.add('hidden'); this.remoteDisconnect(); } });

    joinBtn.addEventListener('click', () => {
      remoteServer = serverEl.value.trim().replace(/\/$/, '');
      remoteSessionId = sessionEl.value.trim();
      if (!remoteSessionId) { setStatus('Enter a Session ID', false); return; }
      setStatus('Joining...', false);
      // Quick check: try to set a no-op input; if server reachable mark connected
      postRemote(`/api/input/${remoteSessionId}`, { event: 'ping', val: 0 }).then(ok => {
        setConnected(ok);
        setStatus(ok ? 'Connected to session' : 'Cannot reach session', ok);
      });
    });

    discBtn.addEventListener('click', () => this.remoteDisconnect());

    serialSend.addEventListener('click', async () => {
      if (!remoteSessionId) return;
      const text = serialInput.value;
      if (!text) return;
      const ok = await postRemote(`/api/input/${remoteSessionId}`, { event: 'serial_in', text });
      setStatus(ok ? 'Serial sent' : 'Serial send failed', ok);
      serialInput.value = '';
    });

    this.remoteDisconnect = () => {
      remoteSessionId = null;
      remoteServer = '';
      setConnected(false);
      setStatus('Disconnected', false);
    };

    setConnected(false);
    setStatus('Not connected', false);
  }

  /* ============================================================
   * Arduino IDE Examples Library data
   * ============================================================ */
  // Examples compatible with this simulator (ESP8266/ESP32 runtime).
  // Each: id, name, category, board (recommended), language, description, code
  EXAMPLES_LIBRARY_DATA = [
    // ---------- Basics ----------
    {
      id: 'basics-blink',
      name: 'Blink',
      category: 'Basics',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Turns an LED on for one second, then off for one second, repeatedly.',
      code: `// the setup function runs once when you press reset or power the board
void setup() {
  // initialize digital pin LED_BUILTIN as an output.
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(115200);
  Serial.println("Blink started");
}

// the loop function runs over and over again forever
void loop() {
  digitalWrite(LED_BUILTIN, HIGH);   // turn the LED on (HIGH is the voltage level)
  Serial.println("LED ON");
  delay(1000);                       // wait for a second
  digitalWrite(LED_BUILTIN, LOW);    // turn the LED off by making the voltage LOW
  Serial.println("LED OFF");
  delay(1000);                       // wait for a second
}`
    },
    {
      id: 'basics-bare-minimum',
      name: 'BareMinimum',
      category: 'Basics',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'The minimum code needed to start an Arduino sketch.',
      code: `void setup() {
  // put your setup code here, to run once:
  Serial.begin(115200);
  Serial.println("Setup complete");
}

void loop() {
  // put your main code here, to run repeatedly:
  delay(1000);
}`
    },
    {
      id: 'basics-digital-read-serial',
      name: 'DigitalReadSerial',
      category: 'Basics',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Reads a digital input on pin 2, prints the result to the Serial Monitor.',
      code: `void setup() {
  Serial.begin(9600);
  pinMode(2, INPUT);
}

void loop() {
  int sensorValue = digitalRead(2);
  Serial.println(sensorValue);
  delay(1);        // delay in between reads for stability
}`
    },
    {
      id: 'basics-read-analog-voltage',
      name: 'ReadAnalogVoltage',
      category: 'Basics',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Reads an analog input on pin 0, converts it to voltage, and prints the result.',
      code: `// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

// the loop routine runs over and over again forever:
void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);
  // Convert the analog reading (which goes from 0 - 1023) to a voltage (0 - 5V):
  float voltage = sensorValue * (3.3 / 1023.0);
  // print out the value you read:
  Serial.println(voltage);
}`
    },
    // ---------- Digital ----------
    {
      id: 'digital-button',
      name: 'Button',
      category: 'Digital',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Turns on and off a light emitting diode(LED) connected to digital pin 13, when pressing a pushbutton attached to pin 2.',
      code: `// constants won't change. They're used here to set pin numbers:
const int buttonPin = 2;     // the number of the pushbutton pin
const int ledPin =  LED_BUILTIN;  // the number of the LED pin

// variables will change:
int buttonState = 0;         // variable for reading the pushbutton status

void setup() {
  // initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
  // initialize the pushbutton pin as an input:
  pinMode(buttonPin, INPUT);
  Serial.begin(9600);
}

void loop() {
  // read the state of the pushbutton value:
  buttonState = digitalRead(buttonPin);
  Serial.println(buttonState);

  // check if the pushbutton is pressed. If it is, the buttonState is HIGH:
  if (buttonState == HIGH) {
    digitalWrite(ledPin, HIGH);
  } else {
    digitalWrite(ledPin, LOW);
  }
}`
    },
    {
      id: 'digital-debounce',
      name: 'Debounce',
      category: 'Digital',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Reads a pushbutton and debounces the signal so only one on/off event per press.',
      code: `// Constants won't change. They're used here to set pin numbers:
const int buttonPin = 2;    // the pin that the pushbutton is attached to
const int ledPin = LED_BUILTIN;    // the pin that the LED is attached to

// Variables will change:
int ledState = HIGH;         // the current state of the output pin
int buttonState;             // the current reading from the input pin
int lastButtonState = LOW;   // the previous reading from the input pin

// the following variables are unsigned longs because the time, measured in
// milliseconds, will quickly become a bigger number than can be stored in an int.
unsigned long lastDebounceTime = 0;  // the last time the output pin was toggled
unsigned long debounceDelay = 50;    // the debounce time; increase if the output flickers

void setup() {
  pinMode(buttonPin, INPUT);
  pinMode(ledPin, OUTPUT);

  // set initial LED state
  digitalWrite(ledPin, ledState);
  Serial.begin(9600);
}

void loop() {
  // read the state of the switch into a local variable:
  int reading = digitalRead(buttonPin);

  // check to see if you just pressed the button
  // (i.e. the input went from LOW to HIGH),  and you've waited long enough
  // since the last press to ignore any noise:

  // If the switch changed, due to noise or pressing:
  if (reading != lastButtonState) {
    // reset the debouncing timer
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    // whatever the reading is at, it's been there for longer than the debounce
    // delay, so take it as the actual current state:

    // if the button state has changed:
    if (reading != buttonState) {
      buttonState = reading;

      // only toggle the LED if the new button state is HIGH
      if (buttonState == HIGH) {
        ledState = !ledState;
      }
    }
  }

  // set the LED:
  digitalWrite(ledPin, ledState);

  // save the reading. Next time through the loop, it'll be the lastButtonState:
  lastButtonState = reading;
}`
    },
    {
      id: 'digital-pull-up-down',
      name: 'PullUpDown',
      category: 'Digital',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates the use of INPUT_PULLUP with a button.',
      code: `const int buttonPin = 2;  // the number of the pushbutton pin
const int ledPin = LED_BUILTIN;      // the number of the LED pin

void setup() {
  Serial.begin(9600);
  // initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
  // initialize the pushbutton pin as an input with internal pull-up:
  pinMode(buttonPin, INPUT_PULLUP);
}

void loop() {
  // read the pushbutton input pin:
  int buttonState = digitalRead(buttonPin);
  Serial.println(buttonState);

  // if the button is pressed (pulled to GND), buttonState will be LOW:
  if (buttonState == LOW) {
    digitalWrite(ledPin, HIGH);  // turn LED on
  } else {
    digitalWrite(ledPin, LOW);   // turn LED off
  }

  delay(10);
}`
    },
    // ---------- Analog ----------
    {
      id: 'analog-analog-read-serial',
      name: 'AnalogReadSerial',
      category: 'Analog',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Reads an analog input on pin 0, prints the result to the Serial Monitor.',
      code: `void setup() {
  Serial.begin(9600);
}

void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);
  // print out the value you read:
  Serial.println(sensorValue);
  delay(1);        // delay in between reads for stability
}`
    },
    {
      id: 'analog-fading',
      name: 'Fading',
      category: 'Analog',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Fades an LED on GPIO pin using PWM (analogWrite).',
      code: `int brightness = 0;    // how bright the LED is
int fadeAmount = 5;    // how many points to fade the LED by

// the setup routine runs once when you press reset:
void setup() {
  // declare pin LED_BUILTIN to be an output:
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

// the loop routine runs over and over again forever:
void loop() {
  // set the brightness of pin LED_BUILTIN:
  analogWrite(LED_BUILTIN, brightness);

  // change the brightness for next time through the loop:
  brightness = brightness + fadeAmount;

  // reverse the direction of the fading at the ends of the fade:
  if (brightness <= 0 || brightness >= 255) {
    fadeAmount = -fadeAmount;
  }

  // wait for 30 milliseconds to see the dimming effect
  delay(30);
}`
    },
    {
      id: 'analog-smoothing',
      name: 'Smoothing',
      category: 'Analog',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Reads repeatedly from an analog input, calculating a running average.',
      code: `const int numReadings = 10;

int readings[numReadings];      // the readings from the analog input
int readIndex = 0;              // the index of the current reading
int total = 0;                  // the running total
int average = 0;                // the average

void setup() {
  Serial.begin(9600);
  // initialize all the readings to 0:
  for (int thisReading = 0; thisReading < numReadings; thisReading++) {
    readings[thisReading] = 0;
  }
}

void loop() {
  // subtract the last reading:
  total = total - readings[readIndex];
  // read from the sensor:
  readings[readIndex] = analogRead(A0);
  // add the reading to the total:
  total = total + readings[readIndex];
  // advance to the next position in the array:
  readIndex = readIndex + 1;

  // if we're at the end of the array...
  if (readIndex >= numReadings) {
    // ...wrap around to the beginning:
    readIndex = 0;
  }

  // calculate the average:
  average = total / numReadings;
  // send it to the computer as ASCII digits
  Serial.println(average);
  delay(1);        // delay in between reads for stability
}`
    },
    {
      id: 'analog-calibration',
      name: 'Calibration',
      category: 'Analog',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Calibrates an analog sensor by reading the max/min values during the first 5 seconds.',
      code: `// These constants won't change:
const int sensorPin = A0;    // pin that the sensor is attached to
const int ledPin = LED_BUILTIN; // pin that the LED is attached to

// variables:
int sensorValue = 0;         // the sensor value
int sensorMin = 1023;        // minimum sensor value
int sensorMax = 0;           // maximum sensor value

void setup() {
  // turn on LED to signal the start of the calibration period:
  pinMode(ledPin, OUTPUT);
  digitalWrite(ledPin, HIGH);

  // calibrate during the first five seconds
  while (millis() < 5000) {
    sensorValue = analogRead(sensorPin);

    // record the maximum sensor value
    if (sensorValue > sensorMax) {
      sensorMax = sensorValue;
    }

    // record the minimum sensor value
    if (sensorValue < sensorMin) {
      sensorMin = sensorValue;
    }
  }

  // signal the end of the calibration period
  digitalWrite(ledPin, LOW);
  Serial.begin(9600);
}

void loop() {
  // read the sensor:
  sensorValue = analogRead(sensorPin);

  // apply the calibration to the sensor reading:
  sensorValue = map(sensorValue, sensorMin, sensorMax, 0, 255);

  // in case the sensor value is outside the range seen during calibration:
  sensorValue = constrain(sensorValue, 0, 255);

  // use the calibrated value to set the LED brightness:
  analogWrite(ledPin, sensorValue);
  Serial.println(sensorValue);
}`
    },
    // ---------- Control Structure ----------
    {
      id: 'control-for-loop',
      name: 'ForLoopIteration',
      category: 'Control Structure',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates the use of a for() loop to fade an LED up and down.',
      code: `void setup() {
  // declare pin LED_BUILTIN to be an output:
  pinMode(LED_BUILTIN, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  // fade in from min to max in increments of 5 points:
  for (int fadeValue = 0 ; fadeValue <= 255; fadeValue += 5) {
    // sets the value (range from 0 to 255):
    analogWrite(LED_BUILTIN, fadeValue);
    Serial.println(fadeValue);
    // wait for 30 milliseconds to see the dimming effect
    delay(30);
  }

  // fade out from max to min in increments of 5 points:
  for (int fadeValue = 255 ; fadeValue >= 0; fadeValue -= 5) {
    // sets the value (range from 0 to 255):
    analogWrite(LED_BUILTIN, fadeValue);
    Serial.println(fadeValue);
    // wait for 30 milliseconds to see the dimming effect
    delay(30);
  }
}`
    },
    {
      id: 'control-if-statement',
      name: 'IfStatementConditional',
      category: 'Control Structure',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates the use of if() conditional statements.',
      code: `// These constants won't change:
const int sensorPin = A0;    // pin that the sensor is attached to
const int ledPin = LED_BUILTIN; // pin that the LED is attached to

// threshold value:
int threshold = 400;

void setup() {
  // initialize serial communications:
  Serial.begin(9600);

  // initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
}

void loop() {
  // read the value of the sensor:
  int sensorValue = analogRead(sensorPin);

  Serial.println(sensorValue);

  // if the sensor value is above the threshold, turn on the LED:
  if (sensorValue > threshold) {
    digitalWrite(ledPin, HIGH);
  }
  else {
    digitalWrite(ledPin, LOW);
  }
  delay(100);
}`
    },
    {
      id: 'control-switch-case',
      name: 'SwitchCase',
      category: 'Control Structure',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates the use of a switch statement.',
      code: `// These constants won't change. They are used here to set pin numbers:
const int sensorPin = A0;  // pin that the sensor is attached to
const int ledPin = LED_BUILTIN; // pin that the LED is attached to

// variables:
int sensorValue = 0;  // the sensor value
int ledState = LOW;   // the current state of the output pin
int previousSensorValue = 0;  // the previous state of the sensor

void setup() {
  // initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
  Serial.begin(9600);
}

void loop() {
  // read the sensor:
  sensorValue = analogRead(sensorPin);

  // print out the value you read:
  Serial.println(sensorValue);

  // If the sensor value changed, print out what changed:
  if (sensorValue != previousSensorValue) {
    // map the sensor value to a range of three options:
    int result = map(sensorValue, 0, 1023, 0, 3);

    // do something different depending on the range value:
    switch (result) {
      case 0:
        digitalWrite(ledPin, LOW);
        Serial.println("Low");
        break;
      case 1:
        digitalWrite(ledPin, HIGH);
        delay(100);
        digitalWrite(ledPin, LOW);
        delay(100);
        Serial.println("Medium");
        break;
      case 2:
        digitalWrite(ledPin, HIGH);
        Serial.println("High");
        break;
      case 3:
        digitalWrite(ledPin, HIGH);
        Serial.println("Very High");
        break;
    }
  }
  previousSensorValue = sensorValue;
}`
    },
    {
      id: 'control-while-loop',
      name: 'WhileLoopConditional',
      category: 'Control Structure',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates the use of while() loops.',
      code: `// These constants won't change:
const int sensorPin = A0;    // pin that the sensor is attached to
const int ledPin = LED_BUILTIN; // pin that the LED is attached to

void setup() {
  // initialize serial communication:
  Serial.begin(9600);
  // initialize the LED pin as an output:
  pinMode(ledPin, OUTPUT);
}

void loop() {
  // read the sensor:
  int sensorValue = analogRead(sensorPin);
  Serial.println(sensorValue);

  // if the sensor value is above 500, turn on the LED and stay in a while loop
  // until the sensor value drops below 500:
  if (sensorValue > 500) {
    digitalWrite(ledPin, HIGH);

    // while the sensor value is above 500, keep reading it:
    while (analogRead(sensorPin) > 500) {
      // do nothing, just wait
      delay(100);
    }

    // once we exit the while loop, turn off the LED:
    digitalWrite(ledPin, LOW);
  }
}`
    },
    {
      id: 'control-array',
      name: 'Array',
      category: 'Control Structure',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates the use of an array to hold pin numbers.',
      code: `// This example shows how to use an array to hold pin numbers
// so you can iterate over them in a loop.

const int pinCount = 5;
int pins[] = { D0, D1, D2, D3, D4 };

void setup() {
  // initialize the pin numbers as outputs:
  for (int thisPin = 0; thisPin < pinCount; thisPin++) {
    pinMode(pins[thisPin], OUTPUT);
  }
  Serial.begin(9600);
}

void loop() {
  // iterate over the pins:
  for (int thisPin = 0; thisPin < pinCount; thisPin++) {
    digitalWrite(pins[thisPin], HIGH);
    Serial.print("Pin ");
    Serial.print(pins[thisPin]);
    Serial.println(" ON");
    delay(100);
    digitalWrite(pins[thisPin], LOW);
    Serial.print("Pin ");
    Serial.print(pins[thisPin]);
    Serial.println(" OFF");
    delay(100);
  }
}`
    },
    // ---------- Strings ----------
    {
      id: 'strings-addition-operator',
      name: 'StringAdditionOperator',
      category: 'Strings',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates the use of the String addition operator.',
      code: `String stringOne, stringTwo;

void setup() {
  // initialize serial and wait for port to open:
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  // send an intro:
  Serial.println("\n\nString  Addition Operator:");
  Serial.println();

  // set up the strings:
  stringOne = String("A string ");
  stringTwo = String("and another string");
}

void loop() {
  stringTwo = stringTwo + " more";
  Serial.println(stringTwo);

  stringOne += " more";
  Serial.println(stringOne);

  // do nothing while true:
  while (true);
}`
    },
    {
      id: 'strings-length-trim',
      name: 'StringLengthTrim',
      category: 'Strings',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates String length() and trim() functions.',
      code: `String stringOne = "  Hello!  ";
String stringTwo;

void setup() {
  Serial.begin(9600);

  // send an intro:
  Serial.println("\n\nString  Length and Trim:");
  Serial.println();
}

void loop() {
  Serial.println(stringOne);
  Serial.print("length: ");
  Serial.println(stringOne.length());

  // trim() removes whitespace from both ends of a string:
  stringTwo = stringOne;
  stringTwo.trim();

  Serial.println(stringTwo);
  Serial.print("length: ");
  Serial.println(stringTwo.length());

  // do nothing while true:
  while (true);
}`
    },
    {
      id: 'strings-concatenation',
      name: 'StringConcatenation',
      category: 'Strings',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates String concatenation with += operator.',
      code: `String stringOne = "Hello ";
String stringTwo = "World!";
String stringThree;

void setup() {
  Serial.begin(9600);
  Serial.println("\n\nString Concatenation:");
  Serial.println();
}

void loop() {
  stringThree = stringOne + stringTwo;
  Serial.println(stringThree);
  while (true);
}`
    },
    // ---------- Storage ----------
    {
      id: 'storage-eeprom-read',
      name: 'EEPROM Read',
      category: 'Storage',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Reads the value of each byte of the EEPROM and prints it to the computer.',
      code: `// Include the EEPROM library
#include <EEPROM.h>

// the current address in the EEPROM (i.e. which byte we're going to read next)
int address = 0;

void setup() {
  // initialize serial and wait for port to open:
  Serial.begin(9600);
  while (!Serial) {
    ; // wait for serial port to connect. Needed for native USB port only
  }

  // initialize the EEPROM
  EEPROM.begin(512);
}

void loop() {
  // read a byte from the current address of the EEPROM
  byte value = EEPROM.read(address);

  Serial.print(address);
  Serial.print("\\t");
  Serial.print(value, DEC);
  Serial.println();

  // advance to the next address
  address = address + 1;

  // if we're at the end of the EEPROM, go back to the beginning:
  if (address == EEPROM.length()) {
    address = 0;
  }

  delay(500);
}`
    },
    {
      id: 'storage-eeprom-write',
      name: 'EEPROM Write',
      category: 'Storage',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Stores values read from analog input 0 into the EEPROM.',
      code: `#include <EEPROM.h>

void setup() {
  Serial.begin(9600);
  EEPROM.begin(512);
  // initialize the LED pin as output:
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  // read the input on analog pin 0:
  int sensorValue = analogRead(A0);

  // convert it to a byte (0-255):
  byte byteValue = sensorValue / 4;

  // write it to EEPROM at the current address:
  EEPROM.write(0, byteValue);

  // commit the write
  EEPROM.commit();

  Serial.print("Written: ");
  Serial.println(byteValue);

  digitalWrite(LED_BUILTIN, HIGH);
  delay(500);
  digitalWrite(LED_BUILTIN, LOW);
  delay(500);
}`
    },
    // ---------- Communication ----------
    {
      id: 'communication-serial-event',
      name: 'SerialEvent',
      category: 'Communication',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Demonstrates the use of serialEvent() to handle incoming serial data.',
      code: `String inputString = "";         // a String to hold incoming data
bool stringComplete = false;  // whether the string is complete

void setup() {
  // initialize serial:
  Serial.begin(9600);
  // reserve 200 bytes for the inputString:
  inputString.reserve(200);
}

void loop() {
  // print the string when a newline arrives:
  if (stringComplete) {
    Serial.println(inputString);
    // clear the string:
    inputString = "";
    stringComplete = false;
  }
}

/*
  SerialEvent occurs whenever a new data comes in the hardware serial RX. This
  routine is run between each time loop() runs, so using delay inside loop can
  delay response. Multiple bytes of data may be available.
*/
void serialEvent() {
  while (Serial.available()) {
    // get the new byte:
    char inChar = (char)Serial.read();
    // add it to the inputString:
    inputString += inChar;
    // if the incoming character is a newline, set a flag so the main loop can
    // do something about it:
    if (inChar == '\\n') {
      stringComplete = true;
    }
  }
}`
    },
    {
      id: 'communication-ascii-table',
      name: 'ASCIITable',
      category: 'Communication',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Prints out byte values in all possible formats: raw binary, ascii, decimal, hex, octal.',
      code: `void setup() {
  Serial.begin(9600);

  // prints title with ending line break
  Serial.println("ASCII Table ~ Character Map");

  // prints a line break to separate things:
  Serial.println();
}

int thisByte = 33; // ASCII '!' is the first visible character

void loop() {
  // prints value unaltered, i.e. the raw binary version of the byte
  Serial.write(thisByte);

  Serial.print(", dec: ");
  // prints value as string as an ASCII-encoded decimal (base 10)
  Serial.print(thisByte);

  Serial.print(", hex: ");
  // prints value as string as an ASCII-encoded hexadecimal (base 16)
  Serial.print(thisByte, HEX);

  Serial.print(", oct: ");
  // prints value as string as an ASCII-encoded octal (base 8)
  Serial.print(thisByte, OCT);

  Serial.print(", bin: ");
  // prints value as string as an ASCII-encoded binary (base 2)
  Serial.println(thisByte, BIN);

  // if printed last visible character '~' or 126, stop:
  if (thisByte == 126) {
    // This loop loops forever and does nothing
    while (true) {
      continue;
    }
  }

  // go on to the next character
  thisByte++;
}`
    },
    // ---------- USB ----------
    {
      id: 'usb-keyboard-message',
      name: 'KeyboardMessage',
      category: 'USB',
      board: 'esp32-devkit-v1',
      language: 'cpp',
      description: 'Sends a key press when a button is pressed (Leonardo/Micro/Due/Zero).',
      code: `/*
  Keyboard Message test

  For Arduino Leonardo and Micro

  Sends a text string when a button is pressed.

  The circuit:
  - pushbutton attached from pin 4 to +5V
  - 10 kilohm resistor attached from pin 4 to ground

  created 24 Oct 2011
  by Tom Igoe

  This example code is in the public domain.

  http://www.arduino.cc/en/Tutorial/KeyboardMessage
*/

#include <Keyboard.h>

const int buttonPin = 4;  // input pin for pushbutton
int previousButtonState = HIGH;  // for checking the state of a pushButton

void setup() {
  // make the pushButton pin an input:
  pinMode(buttonPin, INPUT);
  // initialize control over the keyboard:
  Keyboard.begin();
}

void loop() {
  // read the pushbutton:
  int buttonState = digitalRead(buttonPin);

  // if the button state has changed,
  if ((buttonState != previousButtonState)
    // and it's currently pressed:
    && (buttonState == HIGH)) {
    // type out a message
    Keyboard.println("Hello!");
  }
  // save the current button state for comparison next time:
  previousButtonState = buttonState;
}`
    },
    // ---------- Sensors ----------
    {
      id: 'sensors-knock',
      name: 'Knock Sensor',
      category: 'Sensors',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Reads a piezo element to detect a knocking sound.',
      code: `// these constants won't change:
const int ledPin = LED_BUILTIN;      // led connected to digital pin LED_BUILTIN
const int knockPin = A0;             // the piezo is connected to analog pin 0
const int threshold = 100;           // threshold value to decide when the detected sound is a knock or not

// these variables will change:
int sensorReading = 0;      // variable to store the value read from the sensor pin
int ledState = LOW;         // variable used to store the last LED status, to toggle the light

void setup() {
  pinMode(ledPin, OUTPUT);  // declare the ledPin as as OUTPUT
  Serial.begin(9600);       // use the serial port
}

void loop() {
  // read the sensor and store it in the variable sensorReading:
  sensorReading = analogRead(knockPin);

  // if the sensor reading is greater than the threshold:
  if (sensorReading >= threshold) {
    // toggle the status of the ledPin:
    ledState = !ledState;
    // update the LED pin itself:
    digitalWrite(ledPin, ledState);
    // send the string "Knock!" back to the computer, followed by newline
    Serial.println("Knock!");
  }
  delay(100);  // delay to avoid overloading the serial port buffer
}`
    },
    {
      id: 'sensors-ping',
      name: 'Ping',
      category: 'Sensors',
      board: 'esp8266-nodemcu',
      language: 'cpp',
      description: 'Reads an ultrasonic range finder and prints the distance.',
      code: `// this constant won't change.  It's the pin number of the sensor's output:
const int pingPin = 7;

void setup() {
  // initialize serial communication:
  Serial.begin(9600);
}

void loop() {
  // establish variables for duration of the ping,
  // and the distance result in inches and centimeters:
  long duration, inches, cm;

  // The PING))) is triggered by a HIGH pulse of 2 or more microseconds.
  // Give a short LOW pulse beforehand to ensure a clean HIGH pulse:
  pinMode(pingPin, OUTPUT);
  digitalWrite(pingPin, LOW);
  delayMicroseconds(2);
  digitalWrite(pingPin, HIGH);
  delayMicroseconds(5);
  digitalWrite(pingPin, LOW);

  // The same pin is used to read the signal from the PING))): a HIGH pulse
  // whose duration is the time (in microseconds) from the sending of the ping
  // to the reception of its echo off of an object.
  pinMode(pingPin, INPUT);
  duration = pulseIn(pingPin, HIGH);

  // convert the time into a distance
  inches = microsecondsToInches(duration);
  cm = microsecondsToCentimeters(duration);

  Serial.print(inches);
  Serial.print("in, ");
  Serial.print(cm);
  Serial.print("cm");
  Serial.println();

  delay(100);
}

long microsecondsToInches(long microseconds) {
  // According to Parallax's datasheet for the PING))), there are 73.746
  // microseconds per inch (i.e. sound travels at 1130 feet per second).
  // This gives the distance travelled by the ping, outbound and return,
  // so we divide by 2 to get the distance of the obstacle.
  return microseconds / 74 / 2;
}

long microsecondsToCentimeters(long microseconds) {
  // The speed of sound is 340 m/s or 29 microseconds per centimeter.
  // The ping travels out and back, so to find the distance of the object we
  // take half of the distance travelled.
  return microseconds / 29 / 2;
}`
    },
    // ---------- Display ----------
    {
      id: 'display-hello-world',
      name: 'HelloWorld (LCD)',
      category: 'Display',
      board: 'esp32-devkit-v1',
      language: 'cpp',
      description: 'Demonstrates the use a 16x2 LCD display with the LiquidCrystal library.',
      code: `#include <LiquidCrystal.h>

// initialize the library with the numbers of the interface pins
LiquidCrystal lcd(12, 11, 5, 4, 3, 2);

void setup() {
  // set up the LCD's number of columns and rows:
  lcd.begin(16, 2);
  // Print a message to the LCD.
  lcd.print("hello, world!");
}

void loop() {
  // set the cursor to column 0, line 1
  // (note: line 1 is the second row, since counting begins with 0):
  lcd.setCursor(0, 1);
  // print the number of seconds since reset:
  lcd.print(millis() / 1000);
}`
    },
    // ---------- USB ----------
    {
      id: 'usb-mouse-button',
      name: 'MouseButton',
      category: 'USB',
      board: 'esp32-devkit-v1',
      language: 'cpp',
      description: 'Controls the mouse from five pushbuttons on an Arduino Leonardo, Micro, or Due.',
      code: `/*
  Mouse Control

  Controls the mouse from five pushbuttons on an Arduino Leonardo, Micro or Due.

  Hardware:
  - 5 pushbuttons attached to D2, D3, D4, D5, D6

  The mouse movement is always relative. This sketch reads four pushbuttons
  and uses them to set the movement of the mouse.

  WARNING: When you use the Mouse.h library, Arduino takes over your
  mouse! Make sure you can control it before using this sketch.

  created 15 Mar 2012
  by Tom Igoe

  This example is in the public domain.
*/

#include <Mouse.h>

// set pin numbers for the five buttons:
const int upButton = 2;
const int downButton = 3;
const int leftButton = 4;
const int rightButton = 5;
const int mouseButton = 6;

int range = 5;         // output range of X or Y movement; affects movement speed
int responseDelay = 10;  // response delay of the mouse, in ms

void setup() {
  // initialize the buttons' inputs:
  pinMode(upButton, INPUT);
  pinMode(downButton, INPUT);
  pinMode(leftButton, INPUT);
  pinMode(rightButton, INPUT);
  pinMode(mouseButton, INPUT);
  // initialize mouse control:
  Mouse.begin();
}

void loop() {
  // read the buttons:
  int upState = digitalRead(upButton);
  int downState = digitalRead(downButton);
  int rightState = digitalRead(rightButton);
  int leftState = digitalRead(leftButton);
  int clickState = digitalRead(mouseButton);

  // calculate the movement value based on the buttons' states:
  int xMovement = (rightState - leftState) * range;
  int yMovement = (upState - downState) * range;

  // move the mouse if the x or y value is non-zero:
  if (xMovement != 0 || yMovement != 0) {
    Mouse.move(xMovement, yMovement, 0);
  }

  // if the mouse button is pressed:
  if (clickState == HIGH) {
    Mouse.click();
  }

  // a delay so the mouse doesn't move too fast:
  delay(responseDelay);
}`
    },
  ];

  initExamplesLibrary() {
    const modal = document.getElementById('ex-lib-modal');
    const btn = document.getElementById('btn-examples-library');
    const closeBtn = document.getElementById('ex-lib-close');
    const catEl = document.getElementById('ex-lib-categories');
    const listEl = document.getElementById('ex-lib-list');
    const catTitle = document.getElementById('ex-lib-cat-title');
    const catCount = document.getElementById('ex-lib-count');
    const loadBtn = document.getElementById('ex-lib-load');

    // build category list
    const categories = [...new Set(this.EXAMPLES_LIBRARY_DATA.map(e => e.category))];
    let activeCat = categories[0];
    let activeExample = null;

    const renderCategories = () => {
      catEl.innerHTML = categories.map(c => `
        <button data-cat="${c}" class="w-full text-left px-2 py-1.5 rounded text-xs ${c === activeCat ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}">${c}</button>
      `).join('');
      catEl.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          activeCat = b.dataset.cat;
          activeExample = null;
          renderCategories();
          renderList();
          loadBtn.classList.add('hidden');
        });
      });
    };

    const renderList = () => {
      const items = this.EXAMPLES_LIBRARY_DATA.filter(e => e.category === activeCat);
      catTitle.textContent = activeCat;
      catCount.textContent = `${items.length} items`;
      listEl.innerHTML = items.map(e => `
        <button data-id="${e.id}" class="w-full text-left px-2 py-2 rounded bg-slate-800 border border-slate-700 hover:bg-slate-700 ${activeExample === e.id ? 'ring-2 ring-purple-500' : ''}">
          <div class="flex justify-between">
            <span class="text-xs text-slate-200 font-semibold">${e.name}</span>
            <span class="text-[10px] text-slate-500">${e.board}</span>
          </div>
          <div class="text-[10px] text-slate-400 mt-1">${e.description}</div>
        </button>
      `).join('');
      listEl.querySelectorAll('button').forEach(b => {
        b.addEventListener('click', () => {
          activeExample = b.dataset.id;
          renderList();
          loadBtn.classList.remove('hidden');
        });
      });
    };

    const loadSelected = () => {
      if (!activeExample) return;
      const ex = this.EXAMPLES_LIBRARY_DATA.find(e => e.id === activeExample);
      if (!ex) return;
      // set board, language, code
      this.currentBoardId = ex.board;
      document.getElementById('board-select').value = ex.board;
      this.currentLanguage = ex.language;
      document.getElementById('lang-select').value = ex.language;
      const board = BOARDS[ex.board];
      this.canvas.setBoard(board);
      this.inspector.setBoard(board);
      this.arduinoInterpreter.setBoard(board);
      this.microPythonInterpreter.setBoard(board);
      this.realCodeRunner.setBoard(board);
      this.currentInterpreter = (this.currentLanguage === 'cpp') ? this.arduinoInterpreter : this.microPythonInterpreter;
      this.editor.setLanguage(this.currentLanguage);
      this.editor.setValue(ex.code);
      this.filenameEl && (this.filenameEl.textContent = this.currentLanguage === 'cpp' ? 'main.ino' : 'main.py');
      this.serial.clear();
      this.serial.appendOutput(`[Example Loaded] ${ex.name}\r\nBoard: ${board.name} | Language: ${this.currentLanguage.toUpperCase()}\r\n${ex.description}\r\n----------------------------------------\r\n`);
      const fnEl = document.getElementById('editor-filename');
      if (fnEl) fnEl.textContent = this.currentLanguage === 'cpp' ? 'main.ino' : 'main.py';
      modal.classList.add('hidden');
    };

    btn.addEventListener('click', () => { modal.classList.remove('hidden'); renderCategories(); renderList(); });
    closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.add('hidden'); });
    loadBtn.addEventListener('click', loadSelected);

    renderCategories();
    renderList();
  }

  initWireManager() {
    const listEl = document.getElementById('wire-manager-list');
    const countEl = document.getElementById('wire-count');

    const wireColors = ['#38bdf8', '#34d399', '#fbbf24', '#ef4444', '#1e293b', '#a855f7', '#06b6d4', '#f59e0b', '#f97316', '#22c55e'];

    const renderWireList = () => {
      const wires = this.circuitNet.wires;
      if (countEl) countEl.textContent = `${wires.length} wire${wires.length !== 1 ? 's' : ''}`;

      if (!listEl) return;
      if (wires.length === 0) {
        listEl.innerHTML = '<span class="text-slate-500 italic text-[10px]">No wires connected. Click pins to create wires.</span>';
        return;
      }

      listEl.innerHTML = wires.map((w, idx) => {
        const fromLabel = `${w.from.target === 'board' ? 'Board' : w.from.target.slice(0, 6)}:${w.from.pin}`;
        const toLabel = `${w.to.target === 'board' ? 'Board' : w.to.target.slice(0, 6)}:${w.to.pin}`;
        return `
          <div class="flex items-center gap-1.5 bg-slate-800 rounded px-2 py-1 text-[10px] group" data-wire-id="${w.id}">
            <span class="w-3 h-3 rounded-full shrink-0 cursor-pointer border border-slate-600" style="background:${w.color}" data-wire-id="${w.id}" data-action="color" title="Change color"></span>
            <span class="flex-1 text-slate-300 font-mono truncate" title="${fromLabel} → ${toLabel}">${fromLabel} → ${toLabel}</span>
            <button data-wire-id="${w.id}" data-action="delete" class="text-red-400 hover:text-red-300 opacity-0 group-hover:opacity-100 transition" title="Delete wire">✕</button>
          </div>
        `;
      }).join('');

      // Attach color change handlers
      listEl.querySelectorAll('[data-action="color"]').forEach(el => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          const wireId = el.dataset.wireId;
          const wire = this.circuitNet.wires.find(w => w.id === wireId);
          if (!wire) return;
          // Cycle through colors
          const currentIdx = wireColors.indexOf(wire.color);
          const nextIdx = (currentIdx + 1) % wireColors.length;
          wire.color = wireColors[nextIdx];
          this.circuitNet.notify();
          this.canvas.renderWires();
          this.canvas.onWireChange();
          renderWireList();
        });
      });

      // Attach delete handlers
      listEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const wireId = btn.dataset.wireId;
          this.circuitNet.removeWire(wireId);
          this.canvas.renderWires();
          this.canvas.onWireChange();
          renderWireList();
        });
      });
    };

    // Initial render
    renderWireList();

    // Subscribe to wire changes
    this.circuitNet.subscribe(() => {
      renderWireList();
    });
  }

  initComponentPalette() {
    const addComp = (type) => {
      const offset = (this.canvas.components.length % 5) * 25;
      this.canvas.addComponent(type, 380 + offset, 120 + offset);
    };

    // Wire up existing hardcoded buttons
    const compButtons = document.querySelectorAll('.btn-add-comp');
    compButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.compType;
        addComp(type);
      });
    });

    // Get already-shown component types from hardcoded HTML
    const shownTypes = new Set();
    compButtons.forEach(btn => shownTypes.add(btn.dataset.compType));

    // Group remaining components by category
    const byCategory = {};
    const categoryOrder = [
      'Output', 'Display', 'Input', 'Sensors', 'Actuators',
      'Passive', 'Semiconductor', 'Electromechanical', 'Power',
      'Switchgear', 'Communication', 'Computing', 'Connector', 'Protection', 'Other'
    ];

    for (const [type, def] of Object.entries(COMPONENTS)) {
      if (shownTypes.has(type)) continue;
      const cat = def.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push({ type, ...def });
    }

    // Build HTML for each category section
    const container = document.getElementById('component-palette-container');
    if (!container) return;

    const escapeHtml = (str) => String(str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));

    const categoryLabels = {
      'Output': 'Outputs & Actuators',
      'Display': 'Displays',
      'Input': 'Inputs',
      'Sensors': 'Sensors',
      'Actuators': 'Actuators',
      'Passive': 'Passive Components',
      'Semiconductor': 'Semiconductors',
      'Electromechanical': 'Electromechanical',
      'Power': 'Power & Energy',
      'Switchgear': 'Switchgear & Protection',
      'Communication': 'Communication',
      'Computing': 'Computing',
      'Connector': 'Connectors',
      'Protection': 'Protection',
      'Other': 'Other'
    };

    // Sort categories by preferred order
    const sortedCats = Object.keys(byCategory).sort((a, b) => {
      const ia = categoryOrder.indexOf(a);
      const ib = categoryOrder.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });

    for (const cat of sortedCats) {
      const comps = byCategory[cat];
      if (!comps.length) continue;

      const section = document.createElement('div');
      section.className = 'space-y-2';
      section.innerHTML = `
        <span class="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
          ${escapeHtml(categoryLabels[cat] || cat)}
        </span>
        <div class="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
          ${comps.map(c => `
            <button class="btn-add-comp p-1.5 rounded bg-[#161a22] hover:bg-[#1f2430] border border-slate-800 hover:border-slate-700 text-[10px] text-slate-200 transition group flex flex-col items-center" data-comp-type="${escapeHtml(c.type)}" title="${escapeHtml(c.name)}">
              <span class="text-[9px] font-semibold mb-0.5 group-hover:text-emerald-400">${escapeHtml(c.name).length > 12 ? escapeHtml(c.name).slice(0, 11) + '…' : escapeHtml(c.name)}</span>
            </button>
          `).join('')}
        </div>
      `;
      container.appendChild(section);
    }

    // Re-wire all buttons (including newly added ones)
    document.querySelectorAll('.btn-add-comp').forEach(btn => {
      // Remove old listeners by cloning, then add new
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      newBtn.addEventListener('click', () => {
        const type = newBtn.dataset.compType;
        addComp(type);
      });
    });
  }

  initExamplePicker() {
    const select = document.getElementById('example-select');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>Load Preset Project...</option>' +
      EXAMPLES.map(ex => `<option value="${ex.id}">${ex.name}</option>`).join('');

    select.addEventListener('change', (e) => {
      const ex = EXAMPLES.find(x => x.id === e.target.value);
      if (ex) {
        this.loadExample(ex);
        select.value = '';
      }
    });
  }

  newProject() {
    if (!confirm('Create a new blank project? This will clear code and canvas.')) return;
    this.stopSimulation();
    this.circuitNet.clear();
    this.canvas.setComponents([]);
    this.editor.setValue(this.currentLanguage === 'cpp'
      ? 'void setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n  delay(1000);\n}\n'
      : 'import time\nprint("Hello ESP!")\nwhile True:\n  time.sleep(1)\n');
    this.serial.clear();
  }

  loadExample(ex) {
    this.stopSimulation();
    this.currentBoardId = ex.board;
    document.getElementById('board-select').value = ex.board;

    this.currentLanguage = ex.language || 'cpp';
    document.getElementById('lang-select').value = this.currentLanguage;
    this.updateFilenameLabel();

    const board = BOARDS[this.currentBoardId];
    this.canvas.setBoard(board);
    this.inspector.setBoard(board);

    this.arduinoInterpreter.setBoard(board);
    this.microPythonInterpreter.setBoard(board);
    this.realCodeRunner.setBoard(board);
    this.currentInterpreter = (this.currentLanguage === 'cpp') ? this.arduinoInterpreter : this.microPythonInterpreter;

    // Load example code into editor (single file mode)
    this.editor.setValue(ex.code);

    this.circuitNet.clear();
    this.canvas.setComponents(JSON.parse(JSON.stringify(ex.components || [])));

    for (const w of (ex.wires || [])) {
      this.circuitNet.addWire(w.from, w.to, w.color);
    }
    this.canvas.renderWires();

    this.serial.clear();
    this.serial.appendOutput(`[Project Loaded] ${ex.name}\r\n`);
    this.serial.appendOutput(`Board: ${board.name} | Language: ${this.currentLanguage.toUpperCase()} | Runner: ${this.runnerMode.toUpperCase()}\r\n`);
    this.serial.appendOutput(`Click "Run Simulation" (▶) to execute.\r\n----------------------------------------\r\n`);

    this.updateInspector();
  }

  updateFilenameLabel() {
    const filenameEl = document.getElementById('editor-filename');
    if (filenameEl) {
      filenameEl.textContent = this.currentLanguage === 'cpp' ? 'main.ino' : 'main.py';
    }
  }

  switchBoard(boardId) {
    // Stage 2: Validate board using shared core
    const boardValidation = this.boardService.validateBoardId(boardId);
    if (!boardValidation.valid) {
      this.serial.appendOutput(`\r\n[Error] ${boardValidation.error}\r\n`);
      return;
    }

    if (boardId === this.currentBoardId) return;
    this.stopSimulation();
    this.currentBoardId = boardId;
    const board = BOARDS[boardId];

    this.canvas.setBoard(board);
    this.inspector.setBoard(board);
    this.arduinoInterpreter.setBoard(board);
    this.microPythonInterpreter.setBoard(board);
    this.realCodeRunner.setBoard(board);

    this.serial.appendOutput(`\r\n[Board Switched] Active board is now ${board.name}\r\n`);
    this.updateInspector();
  }

  switchLanguage(lang) {
    if (lang === this.currentLanguage) return;
    this.stopSimulation();
    this.currentLanguage = lang;
    this.currentInterpreter = (lang === 'cpp') ? this.arduinoInterpreter : this.microPythonInterpreter;
    this.editor.setLanguage(lang);
    this.updateFilenameLabel();
    this.serial.appendOutput(`\r\n[Mode Switched] Execution language: ${lang === 'cpp' ? 'Arduino C++' : 'MicroPython'}\r\n`);
  }

  async runSimulation() {
    const rawCode = this.editor.getValue();

    // Stage 2: Validate code using shared core
    if (!rawCode || typeof rawCode !== 'string') {
      this.serial.appendOutput(`\r\n[Error] No code to run.\r\n`);
      return;
    }

    // Prepend any user-added libraries (Wokwi-style workaround)
    const libCode = this.libraries.map(l => l.code || '').filter(Boolean).join('\\n\\n');
    const code = libCode ? (libCode + '\\n\\n// --- User Sketch ---\\n' + rawCode) : rawCode;
    const runBtn = document.getElementById('btn-run-sim');

    // Show compiling state
    this.updateRunButtonUI(false);
    const lbl = document.getElementById('run-label');
    const ico = document.getElementById('run-icon');
    if (lbl) lbl.textContent = this.runnerMode === 'native' ? 'Compiling...' : 'Starting...';
    if (ico) ico.innerHTML = '<circle cx="12" cy="12" r="10" stroke-opacity="0.3"/><path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>';
    if (runBtn) {
      runBtn.classList.add('bg-amber-600', 'shadow-amber-500/30');
      runBtn.classList.remove('bg-emerald-600', 'shadow-emerald-500/30');
      runBtn.disabled = true;
    }

    // Generate session ID for this execution
    this.currentExecutionSessionId = 'sim_' + Math.random().toString(36).substring(2, 9);

    try {
      // Select engine based on runner mode
      const engineId = this.runnerMode === 'native' ? 'real-code-runner' : 
        (this.currentLanguage === 'cpp' ? 'arduino-interpreter' : 'micropython-interpreter');

      const result = await this.executionService.startExecution(
        this.currentExecutionSessionId,
        code,
        this.currentLanguage,
        this.currentBoardId,
        engineId
      );

      if (runBtn) runBtn.disabled = false;

      if (!result.success) {
        this.updateRunButtonUI(false);
        if (result.error) {
          this.serial.appendOutput(`\r\n[Execution Error] ${result.error}\r\n`);
        }
        return;
      }

      this.updateRunButtonUI(true);

      // Send initial inputs for native runner
      if (this.runnerMode === 'native') {
        this.syncNativeInputs();
      }
    } catch (err) {
      if (runBtn) runBtn.disabled = false;
      this.updateRunButtonUI(false);
      this.serial.appendOutput(`\r\n[Execution Error] ${err.message}\r\n`);
    }
  }

  stopSimulation() {
    // Stop via execution service (delegates to engine adapter, which calls interpreter.stop())
    if (this.currentExecutionSessionId) {
      this.executionService.stopExecution(this.currentExecutionSessionId).catch(() => {});
      this.currentExecutionSessionId = null;
    }

    // Also stop any directly-running interpreters (belt and suspenders)
    if (this.realCodeRunner && this.realCodeRunner.isRunning) {
      this.realCodeRunner.stop();
    }
    if (this.currentInterpreter && this.currentInterpreter.isRunning) {
      this.currentInterpreter.stop();
    }
    this.audioSynth.stopTone();
    this.updateRunButtonUI(false);

    const state = this.getActiveState();
    this.canvas.renderBoard(state);
    this.updateInspector();
  }

  updateRunButtonUI(running) {
    const runBtn = document.getElementById('btn-run-sim');
    const runLabel = document.getElementById('run-label');
    const runIcon = document.getElementById('run-icon');
    if (!runBtn) return;
    // runSimulation() disables the button while starting; always re-enable it
    // here so Run/Stop remains clickable in both browser and native modes.
    runBtn.disabled = false;
    runBtn.classList.remove('animate-pulse', 'bg-amber-600', 'shadow-amber-500/30');
    if (running) {
      runBtn.classList.add('bg-red-600', 'shadow-[0_0_0_2px_rgba(239,68,68,0.4)]', 'shadow-lg', 'shadow-red-500/30', 'animate-pulse');
      runBtn.classList.remove('bg-emerald-600', 'shadow-emerald-500/30');
      runIcon.innerHTML = '<rect x="4" y="4" width="16" height="16" rx="2"/>';
      runLabel.textContent = 'Stop Simulation';
      runBtn.title = 'Stop Simulation (Space)';
    } else {
      runBtn.classList.add('bg-emerald-600', 'shadow-[0_0_0_2px_rgba(16,185,129,0.4)]', 'shadow-lg', 'shadow-emerald-500/30');
      runBtn.classList.remove('bg-red-600', 'shadow-[0_0_0_2px_rgba(239,68,68,0.4)]', 'shadow-red-500/30');
      runIcon.innerHTML = '<polygon points="5 3 19 12 5 21 5 3"></polygon>';
      runLabel.textContent = 'Run Simulation';
      runBtn.title = 'Start Simulation (Space)';
    }
  }

  resetSimulation() {
    this.stopSimulation();
    this.serial.clear();
    this.serial.appendOutput(`[System Reset] Simulated ESP board restarted.\r\n`);
    this.runSimulation();
  }

  startSimulationLoop() {
    const loop = () => {
      const board = BOARDS[this.currentBoardId];
      const state = this.getActiveState();

      this.circuitNet.solve(board, state, this.canvas.components);

      const isRunning = (this.runnerMode === 'native') ? this.realCodeRunner.isRunning : this.currentInterpreter.isRunning;
      if (isRunning) {
        this.canvas.renderComponents();
      }

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);

    // Dynamic resize handler: re-render canvas when window changes size
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (this.canvas) {
          this.canvas.render();
          this.canvas.renderWires();
        }
      }, 100);
    });

    // Also observe the canvas container for size changes (for split-pane / resize)
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(() => {
        if (this.canvas) {
          this.canvas.renderWires();
        }
      });
      const container = document.getElementById('canvas-container');
      if (container) ro.observe(container);
    }
  }

  updateInspector() {
    const state = this.getActiveState();
    this.inspector.update(state);
  }

  updateComponentPropsPanel(comp) {
    const panel = document.getElementById('component-props-panel');
    if (!panel) return;

    if (!comp) {
      panel.innerHTML = '<span class="text-slate-500 italic text-xs">Click a component on canvas to configure.</span>';
      return;
    }

    const def = COMPONENTS[comp.type] || {};

    let controlsHtml = `
      <div class="flex items-center justify-between mb-2">
        <div class="flex items-center space-x-1.5 text-slate-200 text-xs font-bold">
          <svg class="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>
          </svg>
          <span>${def.name}</span>
        </div>
        <button id="btn-delete-selected-comp" class="flex items-center space-x-1 text-red-400 hover:text-red-300 text-[11px] transition">
          <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          <span>Delete</span>
        </button>
      </div>
    `;

    if (comp.type === 'led') {
      controlsHtml += `
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-1 text-slate-400">
            <svg class="w-3 h-3 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
            </svg>
            <span>LED Color:</span>
          </div>
          <select id="prop-led-color" class="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 outline-none text-xs">
            ${Object.keys(def.colors).map(c => `
              <option value="${c}" ${comp.props.color === c ? 'selected' : ''}>${c.toUpperCase()}</option>
            `).join('')}
          </select>
        </div>
      `;
    } else if (comp.type === 'resistor') {
      controlsHtml += `
        <div class="flex items-center justify-between text-xs">
          <div class="flex items-center space-x-1 text-slate-400">
            <svg class="w-3.5 h-3.5 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M2 12h4l2-5 3 10 3-10 3 10 2-5h5"/>
            </svg>
            <span>Resistance:</span>
          </div>
          <select id="prop-res-val" class="bg-slate-800 text-slate-200 rounded px-2 py-0.5 border border-slate-700 outline-none text-xs">
            ${def.presets.map(p => `
              <option value="${p.value}" ${comp.props.resistance === p.value ? 'selected' : ''}>${p.label}</option>
            `).join('')}
          </select>
        </div>
      `;
    } else if (comp.type === 'potentiometer') {
      const v = typeof comp.props.value === 'number' ? comp.props.value : 0.5;
      controlsHtml += `
        <div class="flex flex-col space-y-1 text-xs">
          <div class="flex justify-between items-center text-slate-400">
            <div class="flex items-center space-x-1">
              <svg class="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="9"/><line x1="12" y1="12" x2="16" y2="7"/>
              </svg>
              <span>Wiper Voltage:</span>
            </div>
            <span id="prop-pot-val-text" class="text-sky-400 font-mono font-bold">${(v * 3.3).toFixed(2)}V</span>
          </div>
          <input type="range" id="prop-pot-slider" min="0" max="1" step="0.01" value="${v}" class="w-full accent-sky-500 cursor-pointer"/>
        </div>
      `;
    } else if (comp.type === 'dht22') {
      const t = comp.props.temperature !== undefined ? comp.props.temperature : 24.5;
      const h = comp.props.humidity !== undefined ? comp.props.humidity : 48;
      controlsHtml += `
        <div class="flex flex-col space-y-2 text-xs">
          <div>
            <div class="flex justify-between items-center text-slate-400 mb-0.5">
              <div class="flex items-center space-x-1">
                <svg class="w-3.5 h-3.5 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z"/>
                </svg>
                <span>Temperature:</span>
              </div>
              <span id="prop-dht-temp-text" class="text-red-400 font-mono font-bold">${t.toFixed(1)}°C</span>
            </div>
            <input type="range" id="prop-dht-temp" min="-40" max="80" step="0.5" value="${t}" class="w-full accent-red-500 cursor-pointer"/>
          </div>
          <div>
            <div class="flex justify-between items-center text-slate-400 mb-0.5">
              <div class="flex items-center space-x-1">
                <svg class="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
                </svg>
                <span>Humidity:</span>
              </div>
              <span id="prop-dht-hum-text" class="text-sky-400 font-mono font-bold">${h.toFixed(0)}%</span>
            </div>
            <input type="range" id="prop-dht-hum" min="0" max="100" step="1" value="${h}" class="w-full accent-sky-500 cursor-pointer"/>
          </div>
        </div>
      `;
    }

    panel.innerHTML = controlsHtml;

    // Attach listeners
    const delBtn = panel.querySelector('#btn-delete-selected-comp');
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        this.canvas.removeComponent(comp.id);
        this.updateComponentPropsPanel(null);
      });
    }

    const ledColor = panel.querySelector('#prop-led-color');
    if (ledColor) {
      ledColor.addEventListener('change', (e) => {
        comp.props.color = e.target.value;
        this.canvas.renderComponents();
      });
    }

    const resVal = panel.querySelector('#prop-res-val');
    if (resVal) {
      resVal.addEventListener('change', (e) => {
        comp.props.resistance = parseInt(e.target.value, 10);
        this.canvas.renderComponents();
      });
    }

    const potSlider = panel.querySelector('#prop-pot-slider');
    if (potSlider) {
      potSlider.addEventListener('input', (e) => {
        comp.props.value = parseFloat(e.target.value);
        panel.querySelector('#prop-pot-val-text').textContent = (comp.props.value * 3.3).toFixed(2) + 'V';
        this.canvas.renderComponents();
        if (this.runnerMode === 'native' && this.realCodeRunner.isRunning) {
          this.syncNativeInputs();
        }
      });
    }

    const dhtTemp = panel.querySelector('#prop-dht-temp');
    const dhtHum = panel.querySelector('#prop-dht-hum');
    if (dhtTemp && dhtHum) {
      dhtTemp.addEventListener('input', (e) => {
        comp.props.temperature = parseFloat(e.target.value);
        panel.querySelector('#prop-dht-temp-text').textContent = comp.props.temperature.toFixed(1) + '°C';
        this.canvas.renderComponents();
        if (this.runnerMode === 'native' && this.realCodeRunner.isRunning) {
          this.syncNativeInputs();
        }
      });
      dhtHum.addEventListener('input', (e) => {
        comp.props.humidity = parseFloat(e.target.value);
        panel.querySelector('#prop-dht-hum-text').textContent = comp.props.humidity.toFixed(0) + '%';
        this.canvas.renderComponents();
        if (this.runnerMode === 'native' && this.realCodeRunner.isRunning) {
          this.syncNativeInputs();
        }
      });
    }
  }

  exportProject() {
    const data = {
      name: 'ESP Project',
      board: this.currentBoardId,
      language: this.currentLanguage,
      code: this.editor.getValue(),
      components: this.canvas.components,
      wires: this.circuitNet.wires
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esp_project_${this.currentBoardId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importProject(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        this.loadExample(data);
        alert('Project imported successfully!');
      } catch (err) {
        alert('Failed to parse project file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }

  // ── Desktop Integration ──────────────────────────────────────
  isDesktop() {
    return !!window.desktopAPI;
  }

  async initDesktop() {
    if (!this.isDesktop()) return;

    // Get backend status and URL
    try {
      const status = await window.desktopAPI.getStatus();
      this.updateBackendStatusUI(status);
      // Set API base URL for desktop mode
      if (status.backendUrl) {
        window.API_BASE_URL = status.backendUrl;
        console.log('[Desktop] Backend URL:', status.backendUrl);
      }

      // Detect compiler availability and enable/disable native runner option
      this.compilerAvailable = !!status.cppAvailable;
      const nativeOpt = document.getElementById('opt-runner-native');
      const runnerSelect = document.getElementById('runner-mode-select');
      if (nativeOpt && runnerSelect) {
        if (!this.compilerAvailable) {
          nativeOpt.disabled = true;
          nativeOpt.textContent = '⚡ Native Clang++ Compiler (not installed)';
          nativeOpt.className = 'bg-[#181d26] text-slate-500';
          if (this.runnerMode === 'native') {
            this.runnerMode = 'browser';
            runnerSelect.value = 'browser';
            this.serial.appendOutput(`\r\n[Runner Mode] Switched to: In-Browser Fast Runner (no C++ compiler detected)\r\n`);
          }
        } else {
          nativeOpt.disabled = false;
          nativeOpt.textContent = '⚡ Native Clang++ Compiler';
          nativeOpt.className = 'bg-[#181d26] text-slate-200';
        }
      }
    } catch (e) {
      console.warn('[Desktop] Failed to get backend status:', e.message);
    }

    // Load runtime configuration
    try {
      const runtimeConfig = await window.desktopAPI.getRuntimeConfig();
      if (runtimeConfig.cppCompiler) {
        console.log('[Desktop] C++ compiler configured:', runtimeConfig.cppCompiler);
      }
      if (runtimeConfig.pythonInterpreter) {
        console.log('[Desktop] Python interpreter configured:', runtimeConfig.pythonInterpreter);
      }
    } catch (e) {
      console.warn('[Desktop] Failed to get runtime config:', e.message);
    }

    // Listen for backend status updates
    window.desktopAPI.on('backend:status-changed', (event, status) => {
      this.updateBackendStatusUI(status);
    });

    // Listen for runtime status updates
    window.desktopAPI.on('runtime:status-changed', (event, status) => {
      this.updateRuntimeStatusUI(status);
    });

    // Native menu actions (the main process sends these when a menu item is
    // clicked or its accelerator is pressed).
    const menuHandlers = {
      'menu-new-project': () => this.newProject(),
      'menu-open-project': () => {
        const projectsBtn = document.getElementById('btn-projects');
        if (projectsBtn) projectsBtn.click();
      },
      'menu-save-project': () => {
        this.saveProjectDesktop().catch(() => {});
      },
      'menu-save-project-as': () => {
        this.saveProjectAsDesktop().catch(() => {});
      },
      'menu-import-project': (event, filePath) => {
        if (filePath) this.importProjectFromPath(filePath).catch(() => {});
      },
      'menu-export-project': (event, filePath) => {
        if (filePath) this.exportProjectToPath(filePath).catch(() => {});
      },
      'menu-simulation-start': () => {
        const running = (this.currentInterpreter && this.currentInterpreter.isRunning) ||
          (this.realCodeRunner && this.realCodeRunner.isRunning);
        if (!running) {
          this.runSimulation().catch((err) => {
            this.serial.appendOutput(`[Runtime Error] ${err.message}\r\n`);
          });
        }
      },
      'menu-simulation-stop': () => this.stopSimulation(),
      'menu-simulation-reset': () => this.resetSimulation(),
      'menu-runtime-settings': () => {
        this.showRuntimeSettingsDialog().catch(() => {});
      },
      'menu-app-preferences': () => {
        this.showPreferencesDialog().catch(() => {});
      },
      'menu-serial-monitor': () => {
        const tab = document.getElementById('tab-btn-serial');
        if (tab) tab.click();
      },
      'menu-gpio-inspector': () => {
        const tab = document.getElementById('tab-btn-inspector');
        if (tab) tab.click();
      }
    };
    for (const [channel, handler] of Object.entries(menuHandlers)) {
      window.desktopAPI.on(channel, handler);
    }

    console.log('[Desktop] Desktop integration initialized');
  }

  updateBackendStatusUI(status) {
    const indicator = document.getElementById('backend-status-indicator');
    if (indicator) {
      if (status.backendRunning) {
        indicator.className = 'text-xs text-emerald-400 font-bold';
        indicator.textContent = '● Backend Running';
      } else {
        indicator.className = 'text-xs text-red-400 font-bold';
        indicator.textContent = '● Backend Stopped';
      }
    }
  }

  updateRuntimeStatusUI(status) {
    const cppIndicator = document.getElementById('cpp-status-indicator');
    const pythonIndicator = document.getElementById('python-status-indicator');

    if (cppIndicator) {
      if (status.cpp.available) {
        cppIndicator.className = 'text-xs text-emerald-400 font-bold';
        cppIndicator.textContent = `● C++: ${status.cpp.path} (${status.cpp.version})`;
      } else {
        cppIndicator.className = 'text-xs text-red-400 font-bold';
        cppIndicator.textContent = '● C++: Not available';
      }
    }

    if (pythonIndicator) {
      if (status.python.available) {
        pythonIndicator.className = 'text-xs text-emerald-400 font-bold';
        pythonIndicator.textContent = `● Python: ${status.python.path} (${status.python.version})`;
      } else {
        pythonIndicator.className = 'text-xs text-red-400 font-bold';
        pythonIndicator.textContent = '● Python: Not available';
      }
    }
  }

  // ── Desktop project helpers ──────────────────────────────────
  async importProjectFromPath(filePath) {
    try {
      const importResult = await window.desktopAPI.importProject(filePath);
      if (!importResult.success) throw new Error(importResult.error || 'Import failed');
      this.loadExample(importResult.projectData || {});
      this.serial.appendOutput(`[Desktop] Project imported: ${filePath}\r\n`);
      return importResult;
    } catch (err) {
      alert('Failed to import project: ' + err.message);
      throw err;
    }
  }

  async exportProjectToPath(filePath) {
    try {
      const projectData = this.exportProjectData();
      const result = await window.desktopAPI.exportProject(filePath, projectData);
      if (result && result.success === false) throw new Error(result.error || 'Export failed');
      this.serial.appendOutput(`[Desktop] Project exported: ${filePath}\r\n`);
      return result;
    } catch (err) {
      alert('Failed to export project: ' + err.message);
      throw err;
    }
  }

  async saveProjectAsDesktop() {
    if (!this.isDesktop()) return this.exportProject();
    const result = await window.desktopAPI.saveFileDialog({
      title: 'Save Project As',
      defaultPath: `esp_project_${this.currentBoardId}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });
    if (result.canceled || !result.filePath) return;
    return this.exportProjectToPath(result.filePath);
  }

  async showRuntimeSettingsDialog() {
    if (!this.isDesktop()) return;
    let message = 'Runtime detection is automatic. No compiler or interpreter was detected.';
    try {
      const status = await window.desktopAPI.getRuntimeStatus();
      const describe = (runtime) => {
        if (!runtime || !runtime.available) return 'Not detected';
        return `${runtime.path}${runtime.version ? ` (${runtime.version})` : ''}`;
      };
      message = [
        `C++ compiler: ${describe(status.cpp)}`,
        `Python interpreter: ${describe(status.python)}`,
        '',
        'Runtime detection runs automatically at startup. Paths can be overridden in settings.json.'
      ].join('\n');
    } catch (err) {
      message += `\n\nCould not read runtime status: ${err.message}`;
    }
    await window.desktopAPI.showInfo('Runtime Settings', message);
  }

  async showPreferencesDialog() {
    if (!this.isDesktop()) return;
    let message = 'Preferences are stored with the application user data.';
    try {
      const paths = await window.desktopAPI.getStoragePaths();
      message = [
        `User data: ${paths.userData || 'unknown'}`,
        `Projects: ${paths.projects || 'unknown'}`,
        `Settings: ${paths.settings || 'unknown'}`,
        `Backups: ${paths.backups || 'unknown'}`
      ].join('\n');
    } catch (err) {
      message += `\n\nCould not read storage paths: ${err.message}`;
    }
    await window.desktopAPI.showInfo('Application Preferences', message);
  }

  // Override project save to use desktop API
  async saveProjectDesktop() {
    if (!this.isDesktop()) return this.saveProjectBrowser();

    try {
      const projectData = this.exportProjectData();
      const result = await window.desktopAPI.saveProject(projectData);
      if (result.success) {
        this.serial.appendOutput(`[Desktop] Project saved: ${result.filename}\r\n`);
        return result;
      } else {
        throw new Error(result.error || 'Save failed');
      }
    } catch (err) {
      alert('Failed to save project: ' + err.message);
      throw err;
    }
  }

  async loadProjectDesktop(filename) {
    if (!this.isDesktop()) return null;

    try {
      const result = await window.desktopAPI.loadProject(filename);
      if (result.success) {
        this.loadExample(result.project);
        this.serial.appendOutput(`[Desktop] Project loaded: ${filename}\r\n`);
        return result.project;
      } else {
        throw new Error(result.error || 'Load failed');
      }
    } catch (err) {
      alert('Failed to load project: ' + err.message);
      throw err;
    }
  }

  async exportProjectDesktop() {
    if (!this.isDesktop()) return this.exportProjectBrowser();

    const result = await window.desktopAPI.saveFileDialog({
      title: 'Export Project',
      defaultPath: `esp_project_${this.currentBoardId}.json`,
      filters: [{ name: 'JSON Files', extensions: ['json'] }]
    });

    if (result.canceled || !result.filePath) return;
    return this.exportProjectToPath(result.filePath).catch(() => {});
  }

  async importProjectDesktop() {
    if (!this.isDesktop()) return this.importProjectBrowser();

    const result = await window.desktopAPI.openFileDialog({
      title: 'Import Project',
      filters: [{ name: 'JSON Files', extensions: ['json'] }],
      properties: ['openFile']
    });

    if (result.canceled || !result.filePaths[0]) return;
    return this.importProjectFromPath(result.filePaths[0]).catch(() => {});
  }

  exportProjectData() {
    return {
      name: `ESP Project - ${this.currentBoardId}`,
      board: this.currentBoardId,
      language: this.currentLanguage,
      runnerMode: this.runnerMode,
      code: this.editor ? this.editor.getValue() : '',
      components: this.canvas ? JSON.parse(JSON.stringify(this.canvas.components || [])) : [],
      wires: this.circuitNet ? JSON.parse(JSON.stringify(this.circuitNet.wires || [])) : [],
      updatedAt: new Date().toISOString()
    };
  }

  saveProjectBrowser() {
    // Fallback to browser download
    const data = this.exportProjectData();
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `esp_project_${this.currentBoardId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importProjectBrowser(e) {
    // Fallback to browser file input
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        this.loadExample(data);
        alert('Project imported successfully!');
      } catch (err) {
        alert('Failed to parse project file: ' + err.message);
      }
    };
    reader.readAsText(file);
  }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', async () => {
  window.espApp = new ESPApp();
  // Initialize desktop integration after app is ready
  setTimeout(() => window.espApp.initDesktop(), 500);
});
