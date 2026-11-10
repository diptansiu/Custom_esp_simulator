// Interactive Serial Terminal Monitor
export class SerialMonitor {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onSend = options.onSend || (() => {});
    this.baudRate = 115200;
    this.showTimestamps = false;
    this.autoScroll = true;

    this.initDOM();
    this.attachEvents();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="serial-monitor flex flex-col h-full bg-[#0f1115] text-slate-300 font-mono text-xs border-t border-slate-800">
        <!-- Toolbar -->
        <div class="serial-toolbar flex items-center justify-between px-3 py-1.5 bg-[#14171d] border-b border-slate-800">
          <div class="flex items-center space-x-2">
            <span class="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <div class="flex items-center space-x-1.5 font-semibold text-slate-200">
              <svg class="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
              </svg>
              <span>Serial Terminal</span>
            </div>
            <span class="text-slate-600">|</span>
            <select id="serial-baud" class="bg-[#1e232c] border border-slate-700 text-slate-300 rounded px-1.5 py-0.5 text-xs outline-none cursor-pointer">
              <option value="115200" selected>115200 baud</option>
              <option value="9600">9600 baud</option>
              <option value="57600">57600 baud</option>
            </select>
          </div>

          <div class="flex items-center space-x-3 text-slate-400">
            <label class="flex items-center space-x-1 cursor-pointer hover:text-slate-200 transition">
              <input type="checkbox" id="serial-timestamps" class="rounded border-slate-700 bg-slate-800 text-sky-500"/>
              <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <span>Timestamps</span>
            </label>
            <label class="flex items-center space-x-1 cursor-pointer hover:text-slate-200 transition">
              <input type="checkbox" id="serial-autoscroll" checked class="rounded border-slate-700 bg-slate-800 text-sky-500"/>
              <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>
              </svg>
              <span>Autoscroll</span>
            </label>
            <button id="serial-clear-btn" class="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition flex items-center space-x-1" title="Clear console">
              <svg class="w-3 h-3 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
              <span>Clear</span>
            </button>
          </div>
        </div>

        <!-- Output Log Stream -->
        <div class="serial-log flex-1 p-3 overflow-y-auto whitespace-pre-wrap select-text leading-relaxed font-mono" id="serial-log"></div>

        <!-- Send Command Line -->
        <div class="serial-input-bar flex items-center px-3 py-2 bg-[#14171d] border-t border-slate-800">
          <input type="text" id="serial-input" placeholder="Send serial command to ESP (e.g. AT or sensor query)..."
                 class="flex-1 bg-[#1e232c] border border-slate-700 text-slate-100 px-3 py-1.5 rounded-l text-xs outline-none focus:border-sky-500"/>
          <button id="serial-send-btn" class="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-r font-semibold text-xs transition flex items-center space-x-1">
            <span>Send</span>
            <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
            </svg>
          </button>
        </div>
      </div>
    `;

    this.logEl = this.container.querySelector('#serial-log');
    this.inputEl = this.container.querySelector('#serial-input');
    this.sendBtn = this.container.querySelector('#serial-send-btn');
    this.clearBtn = this.container.querySelector('#serial-clear-btn');
    this.baudSelect = this.container.querySelector('#serial-baud');
    this.timestampCheck = this.container.querySelector('#serial-timestamps');
    this.autoscrollCheck = this.container.querySelector('#serial-autoscroll');
  }

  attachEvents() {
    const handleSend = () => {
      const text = this.inputEl.value;
      if (text) {
        this.appendOutput(`> ${text}\r\n`, true);
        this.onSend(text + '\n');
        this.inputEl.value = '';
      }
    };

    this.sendBtn.addEventListener('click', handleSend);
    this.inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSend();
    });

    this.clearBtn.addEventListener('click', () => {
      this.logEl.innerHTML = '';
    });

    this.timestampCheck.addEventListener('change', (e) => {
      this.showTimestamps = e.target.checked;
    });

    this.autoscrollCheck.addEventListener('change', (e) => {
      this.autoScroll = e.target.checked;
    });

    this.baudSelect.addEventListener('change', (e) => {
      this.baudRate = parseInt(e.target.value, 10);
    });
  }

  appendOutput(text, isInput = false) {
    let formatted = text;
    if (this.showTimestamps) {
      const now = new Date();
      const timeStr = `[${now.toTimeString().split(' ')[0]}.${String(now.getMilliseconds()).padStart(3, '0')}] `;
      formatted = timeStr + formatted;
    }

    const span = document.createElement('span');
    span.className = isInput ? 'text-sky-400 font-semibold' : 'text-slate-300';
    span.textContent = formatted;
    this.logEl.appendChild(span);

    if (this.autoScroll) {
      this.logEl.scrollTop = this.logEl.scrollHeight;
    }
  }

  clear() {
    this.logEl.innerHTML = '';
  }
}
