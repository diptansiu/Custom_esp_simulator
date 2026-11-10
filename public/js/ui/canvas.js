// Interactive Workbench & Circuit Canvas
import { renderBoardSVG } from '../boards/board-svg.js';
import { renderComponentSVG } from '../components/component-svg.js';
import { COMPONENTS } from '../components/component-defs.js';

export class CircuitCanvas {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.board = options.board;
    this.circuitNet = options.circuitNet;
    this.components = [];
    this.selectedWireColor = '#38bdf8'; // Default cyan
    this.activeWireStart = null; // { target, pin, x, y }
    this.mousePos = { x: 0, y: 0 };
    this.boardPos = { x: 80, y: 80 };
    this.isDragging = null; // { id, startMouseX, startMouseY, startX, startY }

    this.onComponentChange = options.onComponentChange || (() => {});
    this.onWireChange = options.onWireChange || (() => {});
    this.onSelectComponent = options.onSelectComponent || (() => {});

    this.initDOM();
    this.attachEvents();
    this.render();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="canvas-wrapper relative w-full h-full overflow-hidden select-none bg-grid" id="circuit-canvas-host">
        <svg id="circuit-svg" class="w-full h-full absolute inset-0">
          <defs>
            <!-- Metal gradients -->
            <linearGradient id="metal-gradient-nodemcu" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#94a3b8"/>
              <stop offset="50%" stop-color="#cbd5e1"/>
              <stop offset="100%" stop-color="#64748b"/>
            </linearGradient>
            <linearGradient id="metal-gradient-esp32" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#94a3b8"/>
              <stop offset="40%" stop-color="#e2e8f0"/>
              <stop offset="70%" stop-color="#94a3b8"/>
              <stop offset="100%" stop-color="#475569"/>
            </linearGradient>

            <!-- Glow Filters -->
            <filter id="glow-red" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-blue" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="glow-green" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4.5" result="blur"/>
              <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <filter id="blur-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="5"/>
            </filter>
            <filter id="wire-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.6"/>
            </filter>
          </defs>

          <!-- Breadboard Layer (Optional background) -->
          <g id="layer-breadboard"></g>

          <!-- Board Layer -->
          <g id="layer-board" transform="translate(${this.boardPos.x}, ${this.boardPos.y})"></g>

          <!-- Components Layer -->
          <g id="layer-components"></g>

          <!-- Wires Layer -->
          <g id="layer-wires"></g>

          <!-- Active Drawing Wire Layer -->
          <g id="layer-active-wire"></g>
        </svg>

        <!-- Tooltip overlay -->
        <div id="pin-tooltip" class="absolute pointer-events-none hidden px-2 py-1 rounded bg-slate-900 border border-slate-700 text-xs text-sky-400 font-mono shadow-xl z-50"></div>
      </div>
    `;

    this.svg = this.container.querySelector('#circuit-svg');
    this.layerBoard = this.container.querySelector('#layer-board');
    this.layerComponents = this.container.querySelector('#layer-components');
    this.layerWires = this.container.querySelector('#layer-wires');
    this.layerActiveWire = this.container.querySelector('#layer-active-wire');
    this.tooltip = this.container.querySelector('#pin-tooltip');
  }

  setBoard(board) {
    this.board = board;
    // Reposition board nicely
    this.boardPos = { x: 90, y: 70 };
    this.layerBoard.setAttribute('transform', `translate(${this.boardPos.x}, ${this.boardPos.y})`);
    this.render();
  }

  /**
   * Set the wire connection service for wire management.
   * When set, wire creation/deletion goes through the service layer
   * for validation and event publishing.
   */
  setWireService(wireService) {
    this.wireService = wireService;
  }

  /**
   * Get the wire connection service.
   */
  getWireService() {
    return this.wireService;
  }

  setComponents(components) {
    this.components = components;
    this.renderComponents();
    this.renderWires();
  }

  addComponent(type, x = 360, y = 140, customProps = {}) {
    const def = COMPONENTS[type];
    if (!def) return null;

    const id = 'c_' + Math.random().toString(36).substring(2, 8);
    const comp = {
      id,
      type,
      x,
      y,
      props: { ...(def.defaultProps || {}), ...customProps }
    };
    this.components.push(comp);
    this.renderComponents();
    this.onComponentChange(this.components);
    return comp;
  }

  removeComponent(compId) {
    this.components = this.components.filter(c => c.id !== compId);
    if (this.wireService) {
      this.wireService.removeWiresConnectedTo(compId);
    } else {
      this.circuitNet.removeWiresConnectedTo(compId);
    }
    this.renderComponents();
    this.renderWires();
    this.onComponentChange(this.components);
  }

  attachEvents() {
    const host = this.container.querySelector('#circuit-canvas-host');

    // Mouse movement on SVG
    host.addEventListener('mousemove', (e) => {
      const rect = this.svg.getBoundingClientRect();
      this.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };

      // Handle Component Dragging
      if (this.isDragging) {
        const dx = this.mousePos.x - this.isDragging.startMouseX;
        const dy = this.mousePos.y - this.isDragging.startMouseY;
        const comp = this.components.find(c => c.id === this.isDragging.id);
        if (comp) {
          comp.x = Math.max(10, Math.round(this.isDragging.startX + dx));
          comp.y = Math.max(10, Math.round(this.isDragging.startY + dy));
          const el = this.layerComponents.querySelector(`#comp-${comp.id}`);
          if (el) el.setAttribute('transform', `translate(${comp.x}, ${comp.y})`);
          this.renderWires();
        }
      }

      // Handle Board Dragging
      if (this.isDraggingBoard) {
        const dx = this.mousePos.x - this.isDraggingBoard.startMouseX;
        const dy = this.mousePos.y - this.isDraggingBoard.startMouseY;
        this.boardPos.x = Math.max(10, Math.round(this.isDraggingBoard.startX + dx));
        this.boardPos.y = Math.max(10, Math.round(this.isDraggingBoard.startY + dy));
        this.layerBoard.setAttribute('transform', `translate(${this.boardPos.x}, ${this.boardPos.y})`);
        this.renderWires();
      }

      // Handle active wire preview
      if (this.activeWireStart) {
        this.renderActiveWire();
      }
    });

    // Window mouse up
    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.onComponentChange(this.components);
        this.isDragging = null;
      }
      this.isDraggingBoard = null;
    });

    // Handle pin clicking / hovering
    host.addEventListener('click', (e) => {
      const pinAnchor = e.target.closest('.pin-anchor') || e.target.closest('.board-pin-anchor');
      if (pinAnchor) {
        this.handlePinClick(pinAnchor);
        return;
      }

      // Click wire to delete or select
      const wirePath = e.target.closest('.circuit-wire');
      if (wirePath) {
        const wireId = wirePath.dataset.wireId;
        if (confirm('Delete this wire connection?')) {
          if (this.wireService) {
            this.wireService.removeWire(wireId);
          } else {
            this.circuitNet.removeWire(wireId);
          }
          this.renderWires();
          this.onWireChange();
        }
        return;
      }

      // Click empty canvas cancels active wire
      if (this.activeWireStart) {
        this.activeWireStart = null;
        this.layerActiveWire.innerHTML = '';
      }
    });

    // Pushbutton down/up
    host.addEventListener('mousedown', (e) => {
      const btn = e.target.closest('.pushbutton-art');
      if (btn) {
        const compRoot = btn.closest('.component-root');
        if (compRoot) {
          const comp = this.components.find(c => c.id === compRoot.dataset.id);
          if (comp) {
            comp.props.isPressed = true;
            this.renderComponents();
            this.onComponentChange(this.components);
          }
        }
      }

      // Check component drag handle
      const compRoot = e.target.closest('.component-root');
      if (compRoot && !e.target.closest('.pin-anchor') && !e.target.closest('.interactive-control')) {
        const id = compRoot.dataset.id;
        const comp = this.components.find(c => c.id === id);
        if (comp) {
          this.isDragging = {
            id,
            startMouseX: this.mousePos.x,
            startMouseY: this.mousePos.y,
            startX: comp.x,
            startY: comp.y
          };
          this.onSelectComponent(comp);
        }
      }

      // Check board dragging (click on PCB background)
      const boardRoot = e.target.closest('#board-root');
      if (boardRoot && !e.target.closest('.board-pin-anchor') && !e.target.closest('.interactive-btn')) {
        this.isDraggingBoard = {
          startMouseX: this.mousePos.x,
          startMouseY: this.mousePos.y,
          startX: this.boardPos.x,
          startY: this.boardPos.y
        };
      }
    });

    host.addEventListener('mouseup', (e) => {
      // Release pushbutton
      for (const comp of this.components) {
        if (comp.type === 'pushbutton' && comp.props.isPressed) {
          comp.props.isPressed = false;
        }
      }
      this.renderComponents();
      this.onComponentChange(this.components);
    });

    // Pin hover tooltips
    host.addEventListener('mouseover', (e) => {
      const pinAnchor = e.target.closest('.pin-anchor') || e.target.closest('.board-pin-anchor');
      if (pinAnchor) {
        const title = pinAnchor.querySelector('title')?.textContent || pinAnchor.dataset.pinId;
        this.tooltip.textContent = title;
        this.tooltip.classList.remove('hidden');
        this.positionTooltip(e);
      }
    });

    host.addEventListener('mouseout', (e) => {
      const pinAnchor = e.target.closest('.pin-anchor') || e.target.closest('.board-pin-anchor');
      if (pinAnchor) {
        this.tooltip.classList.add('hidden');
      }
    });
  }

  positionTooltip(e) {
    const rect = this.container.getBoundingClientRect();
    this.tooltip.style.left = `${e.clientX - rect.left + 15}px`;
    this.tooltip.style.top = `${e.clientY - rect.top + 10}px`;
  }

  handlePinClick(pinEl) {
    const isBoard = pinEl.classList.contains('board-pin-anchor');
    const target = isBoard ? 'board' : pinEl.dataset.compId;
    const pin = pinEl.dataset.pinId;
    const coords = this.getPinAbsoluteCoords(target, pin);

    if (!this.activeWireStart) {
      // Start wire
      this.activeWireStart = { target, pin, ...coords };
      // Play brief pulse
      pinEl.classList.add('pulse-pin');
    } else {
      // Finish wire if different pin
      if (this.activeWireStart.target !== target || this.activeWireStart.pin !== pin) {
        // Pick smart color
        let wireColor = this.selectedWireColor;
        if (pin.startsWith('GND') || this.activeWireStart.pin.startsWith('GND') || pin === 'cathode') {
          wireColor = '#1e293b'; // Black
        } else if (pin.startsWith('3V3') || pin === 'VIN' || this.activeWireStart.pin.startsWith('3V3') || pin === 'anode' || pin === 'vcc') {
          wireColor = '#ef4444'; // Red
        } else if (pin === 'scl' || pin === 'D1') {
          wireColor = '#06b6d4'; // Cyan
        } else if (pin === 'sda' || pin === 'D2') {
          wireColor = '#f59e0b'; // Amber
        }

        this.circuitNet.addWire(
          { target: this.activeWireStart.target, pin: this.activeWireStart.pin },
          { target, pin },
          wireColor
        );

        // Use wire service if available
        if (this.wireService) {
          try {
            this.wireService.createWire(
              { target: this.activeWireStart.target, pin: this.activeWireStart.pin },
              { target, pin },
              wireColor
            );
          } catch (err) {
            // Validation error from service - wire still added to circuitNet for UI
            console.warn('[Wire] Service validation:', err.message);
          }
        }

        this.renderWires();
        this.onWireChange();
      }

      this.activeWireStart = null;
      this.layerActiveWire.innerHTML = '';
    }
  }

  getPinAbsoluteCoords(target, pinId) {
    if (target === 'board') {
      const allPins = [...this.board.leftPins, ...this.board.rightPins];
      const p = allPins.find(x => x.id === pinId);
      if (!p) return { x: this.boardPos.x, y: this.boardPos.y };

      const isLeft = this.board.leftPins.some(x => x.id === pinId);
      const index = isLeft 
        ? this.board.leftPins.findIndex(x => x.id === pinId)
        : this.board.rightPins.findIndex(x => x.id === pinId);

      const pinY = this.board.pinStartY + (index * this.board.pinPitch);
      const pinX = isLeft ? 10 : (this.board.width - 10);

      return {
        x: this.boardPos.x + pinX,
        y: this.boardPos.y + pinY
      };
    } else {
      const comp = this.components.find(c => c.id === target);
      if (!comp) return { x: 0, y: 0 };
      const def = COMPONENTS[comp.type];
      const pinDef = def?.pins?.find(p => p.id === pinId);
      if (!pinDef) return { x: comp.x, y: comp.y };

      return {
        x: comp.x + pinDef.x,
        y: comp.y + pinDef.y
      };
    }
  }

  render() {
    this.renderBoard();
    this.renderComponents();
    this.renderWires();
  }

  renderBoard(boardState = {}) {
    const svgContent = renderBoardSVG(this.board.id, boardState);
    
    // Add board pin anchors overlay
    const pinsOverlay = this.renderBoardPinAnchors();

    this.layerBoard.innerHTML = svgContent + pinsOverlay;
  }

  renderBoardPinAnchors() {
    const leftPins = this.board.leftPins.map((p, idx) => {
      const y = this.board.pinStartY + (idx * this.board.pinPitch);
      return `
        <g class="board-pin-anchor" data-pin-id="${p.id}" transform="translate(10, ${y})">
          <circle cx="0" cy="0" r="7" fill="transparent" style="cursor: crosshair;"/>
          <circle cx="0" cy="0" r="4.5" fill="#ca8a04" stroke="#fef08a" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="2.2" fill="#0f172a"/>
          <!-- Label text on PCB silkscreen -->
          <text x="8" y="3" fill="#cbd5e1" font-size="7.5" font-family="'Courier New', monospace" font-weight="bold">${p.label}</text>
          <title>${p.label}: ${p.description}</title>
        </g>
      `;
    }).join('');

    const rightPins = this.board.rightPins.map((p, idx) => {
      const y = this.board.pinStartY + (idx * this.board.pinPitch);
      const x = this.board.width - 10;
      return `
        <g class="board-pin-anchor" data-pin-id="${p.id}" transform="translate(${x}, ${y})">
          <circle cx="0" cy="0" r="7" fill="transparent" style="cursor: crosshair;"/>
          <circle cx="0" cy="0" r="4.5" fill="#ca8a04" stroke="#fef08a" stroke-width="1.2"/>
          <circle cx="0" cy="0" r="2.2" fill="#0f172a"/>
          <!-- Label text on PCB silkscreen -->
          <text x="-8" y="3" fill="#cbd5e1" font-size="7.5" font-family="'Courier New', monospace" font-weight="bold" text-anchor="end">${p.label}</text>
          <title>${p.label}: ${p.description}</title>
        </g>
      `;
    }).join('');

    return leftPins + rightPins;
  }

  renderComponents() {
    this.layerComponents.innerHTML = this.components.map(c => renderComponentSVG(c)).join('');
  }

  renderWires() {
    const wiresSvg = this.circuitNet.wires.map(w => {
      const p1 = this.getPinAbsoluteCoords(w.from.target, w.from.pin);
      const p2 = this.getPinAbsoluteCoords(w.to.target, w.to.pin);
      const pathD = this.calculateWireCurve(p1.x, p1.y, p2.x, p2.y);

      return `
        <g class="circuit-wire-group" data-wire-id="${w.id}">
          <!-- Thick hit area for easy clicking -->
          <path d="${pathD}" fill="none" stroke="transparent" stroke-width="14" class="circuit-wire" data-wire-id="${w.id}" style="cursor: pointer;"/>
          <!-- Wire outer jacket / insulation with shadow -->
          <path d="${pathD}" fill="none" stroke="${w.color}" stroke-width="3.5" stroke-linecap="round" filter="url(#wire-shadow)"/>
          <!-- Specular highlight streak -->
          <path d="${pathD}" fill="none" stroke="#ffffff" stroke-width="0.9" stroke-linecap="round" opacity="0.45"/>
        </g>
      `;
    }).join('');

    this.layerWires.innerHTML = wiresSvg;
  }

  renderActiveWire() {
    if (!this.activeWireStart) return;
    const p1 = this.activeWireStart;
    const p2 = this.mousePos;
    const pathD = this.calculateWireCurve(p1.x, p1.y, p2.x, p2.y);

    this.layerActiveWire.innerHTML = `
      <path d="${pathD}" fill="none" stroke="${this.selectedWireColor}" stroke-width="3" stroke-dasharray="5 3" stroke-linecap="round"/>
      <circle cx="${p2.x}" cy="${p2.y}" r="4" fill="${this.selectedWireColor}"/>
    `;
  }

  calculateWireCurve(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const sag = Math.min(100, Math.max(30, dist * 0.25));

    // Natural curved wire with sag downwards or outwards
    const cx1 = x1 + dx * 0.25;
    const cy1 = y1 + dy * 0.25 + sag;
    const cx2 = x1 + dx * 0.75;
    const cy2 = y1 + dy * 0.75 + sag;

    return `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;
  }

  updateOledDisplay(buffer) {
    for (const comp of this.components) {
      if (comp.type === 'oled-ssd1306') {
        const canvas = document.getElementById(`oled-canvas-${comp.id}`);
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const imgData = ctx.createImageData(128, 64);
          for (let i = 0; i < 128 * 64; i++) {
            const lit = buffer.pixels[i] === 1;
            const idx = i * 4;
            // Crisp OLED sky blue #38bdf8
            imgData.data[idx] = lit ? 56 : 5;      // R
            imgData.data[idx + 1] = lit ? 189 : 8; // G
            imgData.data[idx + 2] = lit ? 248 : 12;// B
            imgData.data[idx + 3] = 255;           // A
          }
          ctx.putImageData(imgData, 0, 0);
        }
      }
    }
  }

  updateNeoPixels(colors) {
    for (const comp of this.components) {
      if (comp.type === 'neopixel-strip') {
        comp.props.pixels = colors;
      }
    }
    this.renderComponents();
  }

  updateServoAngle(angle) {
    for (const comp of this.components) {
      if (comp.type === 'servo-sg90') {
        comp.props.angle = angle;
      }
    }
    this.renderComponents();
  }
}
