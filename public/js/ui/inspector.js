// Pin State Inspector & Logic Analyzer
export class PinInspector {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.board = options.board;
    this.onAntennaToggle = options.onAntennaToggle || (() => {});
    this.initDOM();
  }

  setBoard(board) {
    this.board = board;
    this.initDOM();
  }

  initDOM() {
    const isESP32DA = this.board && this.board.id === 'esp32-wroom-da';

    this.container.innerHTML = `
      <div class="pin-inspector flex flex-col h-full bg-[#12141a] text-slate-300 font-mono text-xs overflow-y-auto p-3">
        <!-- Dual Antenna Widget for ESP32-WROOM-DA -->
        ${isESP32DA ? `
          <div class="da-panel mb-4 p-3 rounded-lg bg-[#181d26] border border-cyan-900/50 shadow-md">
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center space-x-2">
                <svg class="w-4 h-4 text-cyan-400 animate-pulse" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>
                </svg>
                <span class="font-bold text-cyan-300">ESP32-WROOM-DA RF Antenna Diversity</span>
              </div>
              <span class="px-2 py-0.5 rounded text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">Dual PCB</span>
            </div>
            
            <div class="grid grid-cols-2 gap-2 mt-2">
              <div id="ant1-card" class="p-2 rounded bg-slate-900/80 border border-emerald-600/60 flex flex-col items-center">
                <div class="flex items-center space-x-1 text-emerald-400 font-bold text-[11px]">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  <span>Antenna 1 (Left)</span>
                </div>
                <span class="text-xs text-slate-400 mt-1">RSSI: -52 dBm</span>
                <span id="ant1-status" class="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold">ACTIVE</span>
              </div>

              <div id="ant2-card" class="p-2 rounded bg-slate-900/80 border border-slate-700/60 flex flex-col items-center">
                <div class="flex items-center space-x-1 text-sky-400 font-bold text-[11px]">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
                  <span>Antenna 2 (Right)</span>
                </div>
                <span class="text-xs text-slate-400 mt-1">RSSI: -58 dBm</span>
                <span id="ant2-status" class="mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">STANDBY</span>
              </div>
            </div>

            <div class="mt-3 flex items-center justify-between">
              <span class="text-[10px] text-slate-400">RF Diversity Mode:</span>
              <button id="btn-toggle-antenna" class="px-2.5 py-1 bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-700 rounded text-[10px] font-semibold transition flex items-center space-x-1.5">
                <svg class="w-3 h-3 text-cyan-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="17 11 21 7 17 3"/><line x1="21" y1="7" x2="9" y2="7"/><polyline points="7 21 3 17 7 13"/><line x1="15" y1="17" x2="3" y2="17"/>
                </svg>
                <span>Switch Antenna (1 ⟷ 2)</span>
              </button>
            </div>
          </div>
        ` : ''}

        <!-- Pin State Grid -->
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center space-x-1.5">
            <svg class="w-3.5 h-3.5 text-sky-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span class="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">Live GPIO Status</span>
          </div>
          <div class="flex items-center space-x-1 text-slate-500 text-[10px]" id="pin-refresh-indicator">
            <svg class="w-3 h-3 text-emerald-400 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" stroke-opacity="0.3"></circle>
              <path d="M12 2a10 10 0 0 1 10 10"></path>
            </svg>
            <span>Live 60Hz</span>
          </div>
        </div>

        <div class="pin-table-wrapper rounded border border-slate-800 overflow-hidden">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-[#181a20] text-slate-400 border-b border-slate-800 text-[11px]">
                <th class="py-1.5 px-2 font-medium">Pin / GPIO</th>
                <th class="py-1.5 px-2 font-medium">Mode</th>
                <th class="py-1.5 px-2 font-medium">State</th>
                <th class="py-1.5 px-2 font-medium">Voltage</th>
              </tr>
            </thead>
            <tbody id="pin-table-body" class="divide-y divide-slate-800/60">
              <!-- Dynamically populated -->
            </tbody>
          </table>
        </div>
      </div>
    `;

    if (isESP32DA) {
      const toggleBtn = this.container.querySelector('#btn-toggle-antenna');
      if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
          this.onAntennaToggle();
        });
      }
    }
  }

  update(boardState) {
    if (!this.board) return;

    // Update Antenna cards if ESP32-DA
    const isESP32DA = this.board.id === 'esp32-wroom-da';
    if (isESP32DA) {
      const active = boardState.activeAntenna || 1;
      const ant1Card = this.container.querySelector('#ant1-card');
      const ant2Card = this.container.querySelector('#ant2-card');
      const ant1Status = this.container.querySelector('#ant1-status');
      const ant2Status = this.container.querySelector('#ant2-status');

      if (ant1Card && ant2Card) {
        if (active === 1) {
          ant1Card.className = 'p-2 rounded bg-slate-900/80 border border-emerald-500/80 flex flex-col items-center shadow-[0_0_10px_rgba(16,185,129,0.2)]';
          ant2Card.className = 'p-2 rounded bg-slate-900/80 border border-slate-700/60 flex flex-col items-center opacity-70';
          ant1Status.className = 'mt-1 text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-semibold';
          ant1Status.textContent = 'ACTIVE';
          ant2Status.className = 'mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold';
          ant2Status.textContent = 'STANDBY';
        } else {
          ant2Card.className = 'p-2 rounded bg-slate-900/80 border border-sky-500/80 flex flex-col items-center shadow-[0_0_10px_rgba(56,189,248,0.2)]';
          ant1Card.className = 'p-2 rounded bg-slate-900/80 border border-slate-700/60 flex flex-col items-center opacity-70';
          ant2Status.className = 'mt-1 text-[10px] px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 font-semibold';
          ant2Status.textContent = 'ACTIVE';
          ant1Status.className = 'mt-1 text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold';
          ant1Status.textContent = 'STANDBY';
        }
      }
    }

    // Update GPIO table
    const tbody = this.container.querySelector('#pin-table-body');
    if (!tbody) return;

    const allPins = [...this.board.leftPins, ...this.board.rightPins].filter(p => p.type === 'gpio' || p.type === 'adc');

    const rows = allPins.map(p => {
      const gpio = p.gpio !== null && p.gpio !== undefined ? p.gpio : p.id;
      const mode = (boardState.pinModes && boardState.pinModes[gpio]) || 'INPUT';
      const isHigh = boardState.gpio && boardState.gpio[gpio] === 1;
      const pwmVal = boardState.pwm && boardState.pwm[gpio];

      let stateText = isHigh ? 'HIGH (1)' : 'LOW (0)';
      let badgeClass = isHigh ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-slate-800 text-slate-400 border-slate-700';

      if (pwmVal !== undefined && pwmVal !== null) {
        stateText = `PWM (${Math.round((pwmVal / 255) * 100)}%)`;
        badgeClass = 'bg-sky-950 text-sky-300 border-sky-800';
      }

      const voltage = isHigh ? '3.30 V' : (pwmVal ? ((pwmVal / 255) * 3.3).toFixed(2) + ' V' : '0.00 V');

      return `
        <tr class="hover:bg-slate-800/40 transition">
          <td class="py-1 px-2 font-semibold text-slate-200">
            <span class="text-sky-400">${p.label}</span>
            <span class="text-[10px] text-slate-500 ml-1">(${p.gpio !== null ? 'GPIO' + p.gpio : p.id})</span>
          </td>
          <td class="py-1 px-2 text-slate-300">${mode}</td>
          <td class="py-1 px-2">
            <span class="px-1.5 py-0.5 rounded text-[10px] font-semibold border ${badgeClass}">
              ${stateText}
            </span>
          </td>
          <td class="py-1 px-2 text-slate-300 font-mono">${voltage}</td>
        </tr>
      `;
    }).join('');

    tbody.innerHTML = rows;
  }
}
