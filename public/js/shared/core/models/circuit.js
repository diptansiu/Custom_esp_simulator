// Circuit Domain Model
// Platform-independent circuit netlist and connection model.
// No dependencies on Electron, browser DOM, or Node.js specific APIs.

import { ERROR_MESSAGES } from './constants/index.js';
import { ValidationError, NotFoundError } from './errors/index.js';

/**
 * Represents a wire connection between two pins.
 */
export class Wire {
  constructor(data) {
    if (!data || !data.from || !data.to) {
      throw new ValidationError('Wire requires from and to pin references', 'wire', data);
    }

    this.id = data.id || 'w_' + Math.random().toString(36).substring(2, 9);
    this.from = {
      target: data.from.target,
      pin: data.from.pin
    };
    this.to = {
      target: data.to.target,
      pin: data.to.pin
    };
    this.color = data.color || '#38bdf8';
  }

  /**
   * Check if this wire connects the same pins as another wire (in either direction)
   */
  isSameConnection(other) {
    return (
      (this.from.target === other.from.target && this.from.pin === other.from.pin &&
       this.to.target === other.to.target && this.to.pin === other.to.pin) ||
      (this.from.target === other.to.target && this.from.pin === other.to.pin &&
       this.to.target === other.from.target && this.to.pin === other.from.pin)
    );
  }

  /**
   * Convert to plain object (for serialization)
   */
  toJSON() {
    return {
      id: this.id,
      from: { ...this.from },
      to: { ...this.to },
      color: this.color
    };
  }
}

/**
 * Circuit netlist - manages wires and provides net analysis.
 */
export class CircuitNet {
  constructor() {
    this.wires = [];
    this._wireById = new Map();
    this._listeners = new Set();
  }

  /**
   * Add a wire to the circuit.
   * Returns the wire or null if a duplicate exists.
   */
  addWire(from, to, color = '#38bdf8') {
    // Prevent duplicate wires between same pins
    const exists = this.wires.some(w => w.isSameConnection(new Wire({ from, to, color })));
    if (exists) return null;

    const wire = new Wire({ from, to, color });
    this.wires.push(wire);
    this._wireById.set(wire.id, wire);
    this.notify();
    return wire;
  }

  /**
   * Remove a wire by ID.
   * Returns the removed wire or null.
   */
  removeWire(wireId) {
    const idx = this.wires.findIndex(w => w.id === wireId);
    if (idx !== -1) {
      const removed = this.wires.splice(idx, 1)[0];
      this._wireById.delete(wireId);
      this.notify();
      return removed;
    }
    return null;
  }

  /**
   * Remove all wires connected to a target (component or board).
   */
  removeWiresConnectedTo(targetId) {
    const removed = [];
    this.wires = this.wires.filter(w => {
      if (w.from.target === targetId || w.to.target === targetId) {
        removed.push(w);
        this._wireById.delete(w.id);
        return false;
      }
      return true;
    });
    if (removed.length > 0) {
      this.notify();
    }
    return removed;
  }

  /**
   * Clear all wires.
   */
  clear() {
    this.wires = [];
    this._wireById.clear();
    this.notify();
  }

  /**
   * Get a wire by ID.
   */
  getWire(wireId) {
    return this._wireById.get(wireId) || null;
  }

  /**
   * Get all wires.
   */
  getAllWires() {
    return [...this.wires];
  }

  /**
   * Get wire count.
   */
  getWireCount() {
    return this.wires.length;
  }

  /**
   * Subscribe to wire changes.
   * Returns an unsubscribe function.
   */
  subscribe(callback) {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  notify() {
    this._listeners.forEach(cb => cb(this.wires));
  }

  /**
   * Build an adjacency graph from wires and internal component connections.
   * Returns a Map where keys are "target:pin" strings and values are arrays of {target, pin}.
   */
  buildGraph(components = []) {
    const graph = new Map();

    const addEdge = (nodeA, nodeB) => {
      const keyA = `${nodeA.target}:${nodeA.pin}`;
      const keyB = `${nodeB.target}:${nodeB.pin}`;
      if (!graph.has(keyA)) graph.set(keyA, []);
      if (!graph.has(keyB)) graph.set(keyB, []);
      graph.get(keyA).push(nodeB);
      graph.get(keyB).push(nodeA);
    };

    // Add wires to graph
    for (const w of this.wires) {
      addEdge(w.from, w.to);
    }

    // Add internal component connections
    for (const comp of components) {
      if (comp.type === 'resistor') {
        addEdge({ target: comp.id, pin: 'pin1' }, { target: comp.id, pin: 'pin2' });
      } else if (comp.type === 'pushbutton') {
        addEdge({ target: comp.id, pin: 'pin1a' }, { target: comp.id, pin: 'pin1b' });
        addEdge({ target: comp.id, pin: 'pin2a' }, { target: comp.id, pin: 'pin2b' });
        if (comp.props && comp.props.isPressed) {
          addEdge({ target: comp.id, pin: 'pin1a' }, { target: comp.id, pin: 'pin2a' });
        }
      }
    }

    return graph;
  }

  /**
   * Find all connected nodes in the net containing (target, pin).
   * Uses BFS on the graph.
   */
  findNet(startNode, components = []) {
    const graph = this.buildGraph(components);
    const startKey = `${startNode.target}:${startNode.pin}`;

    const visited = new Set([startKey]);
    const queue = [startKey];
    const net = [{ target: startNode.target, pin: startNode.pin }];

    while (queue.length > 0) {
      const currKey = queue.shift();
      const neighbors = graph.get(currKey) || [];
      for (const n of neighbors) {
        const key = `${n.target}:${n.pin}`;
        if (!visited.has(key)) {
          visited.add(key);
          queue.push(key);
          net.push(n);
        }
      }
    }

    return net;
  }

  /**
   * Check if a net connects to GND (board pin starting with 'GND')
   */
  isNetGnd(net) {
    return net.some(n => {
      if (n.target === 'board') {
        return n.pin && n.pin.startsWith('GND');
      }
      return false;
    });
  }

  /**
   * Check if a net connects to VCC/Power (board pin starting with '3V3' or 'VIN')
   */
  isNetVcc(net) {
    return net.some(n => {
      if (n.target === 'board') {
        return n.pin && (n.pin.startsWith('3V3') || n.pin === 'VIN');
      }
      return false;
    });
  }

  /**
   * Find a board pin definition by pin id.
   */
  findBoardPin(board, pinId) {
    if (!board || !pinId) return null;
    return [...board.leftPins, ...board.rightPins].find(p => p.id === pinId);
  }

  /**
   * Given board pin states and component models, solve circuit voltages and states.
   * Returns input states { digital: {}, analog: {} } for board pins and mutates
   * component props (e.g. led.isOn, buzzer.isSounding) based on net connectivity.
   *
   * @param {object} board - Board definition with leftPins/rightPins/pinAlias
   * @param {object} boardState - Current board state { gpio, pinModes, pwm, toneFreq, tonePin, ... }
   * @param {Array} components - Array of component instances { id, type, props, ... }
   * @returns {object} { digital: { [gpio]: 0|1 }, analog: { [gpio]: 0..max } }
   */
  solve(board, boardState, components = []) {
    // 1. Build adjacency graph of nodes
    const graph = this.buildGraph(components);

    // Helper: find all connected nodes in the net containing (target, pin).
    const findNet = (startNode) => {
      const startKey = `${startNode.target}:${startNode.pin}`;
      const visited = new Set([startKey]);
      const queue = [startKey];
      const net = [{ target: startNode.target, pin: startNode.pin }];

      while (queue.length > 0) {
        const currKey = queue.shift();
        const neighbors = graph.get(currKey) || [];
        for (const n of neighbors) {
          const key = `${n.target}:${n.pin}`;
          if (!visited.has(key)) {
            visited.add(key);
            queue.push(key);
            net.push(n);
          }
        }
      }
      return net;
    };

    // Helper: check if a net connects to GND (board pin starting with 'GND')
    const isNetGnd = (net) => {
      return net.some(n => {
        if (n.target === 'board') {
          return n.pin && n.pin.startsWith('GND');
        }
        return false;
      });
    };

    // Helper: check if a net connects to VCC / Power (board pin starting with '3V3' or 'VIN')
    const isNetVcc = (net) => {
      return net.some(n => {
        if (n.target === 'board') {
          return n.pin && (n.pin.startsWith('3V3') || n.pin === 'VIN');
        }
        return false;
      });
    };

    // Helper: find GPIO drive on net
    const getGpioDriveOnNet = (net) => {
      for (const n of net) {
        if (n.target === 'board') {
          const pinDef = this.findBoardPin(board, n.pin);
          if (pinDef && pinDef.gpio !== null && pinDef.gpio !== undefined) {
            const gpio = pinDef.gpio;
            const mode = (boardState.pinModes && boardState.pinModes[gpio]) || 'INPUT';
            if (mode === 'OUTPUT') {
              const val = (boardState.gpio && boardState.gpio[gpio]) || 0;
              const pwm = (boardState.pwm && boardState.pwm[gpio]) || null;
              return { gpio, val, pwm };
            }
          }
        }
      }
      return null;
    };

    // Solve for each component
    for (const comp of components) {
      if (comp.type === 'led') {
        const anodeNet = findNet({ target: comp.id, pin: 'anode' });
        const cathodeNet = findNet({ target: comp.id, pin: 'cathode' });

        const cathodeToGnd = isNetGnd(cathodeNet);
        const anodeToVcc = isNetVcc(anodeNet);
        const gpioDrive = getGpioDriveOnNet(anodeNet);

        // Reverse check: active-low drive (anode to VCC, cathode to GPIO LOW)
        const gpioDriveCathode = getGpioDriveOnNet(cathodeNet);
        const anodeToGnd = isNetGnd(anodeNet);

        if (anodeToVcc && cathodeToGnd) {
          comp.props.isOn = true;
          comp.props.brightness = 1.0;
        } else if (gpioDrive && cathodeToGnd) {
          if (gpioDrive.pwm !== null) {
            comp.props.isOn = gpioDrive.pwm > 0;
            comp.props.brightness = gpioDrive.pwm / 255;
          } else {
            comp.props.isOn = gpioDrive.val === 1;
            comp.props.brightness = gpioDrive.val === 1 ? 1.0 : 0.0;
          }
        } else if (gpioDriveCathode && anodeToVcc) {
          // Active-low LED wiring
          if (gpioDriveCathode.pwm !== null) {
            comp.props.isOn = gpioDriveCathode.pwm < 255;
            comp.props.brightness = (255 - gpioDriveCathode.pwm) / 255;
          } else {
            comp.props.isOn = gpioDriveCathode.val === 0;
            comp.props.brightness = gpioDriveCathode.val === 0 ? 1.0 : 0.0;
          }
        } else {
          comp.props.isOn = false;
          comp.props.brightness = 0.0;
        }
      } else if (comp.type === 'buzzer') {
        const posNet = findNet({ target: comp.id, pin: 'pos' });
        const negNet = findNet({ target: comp.id, pin: 'neg' });
        const negGnd = isNetGnd(negNet);
        const gpioDrive = getGpioDriveOnNet(posNet);

        if (negGnd && boardState.toneFreq && gpioDrive && boardState.tonePin !== null) {
          const pinDef = this.findBoardPin(board, posNet.find(n => n.target === 'board')?.pin);
          if (pinDef && (pinDef.gpio === boardState.tonePin || pinDef.id === boardState.tonePin)) {
            comp.props.isSounding = true;
            comp.props.frequency = boardState.toneFreq;
          } else {
            comp.props.isSounding = false;
          }
        } else {
          comp.props.isSounding = false;
        }
      }
    }

    // Solve for Board Inputs (digitalRead & analogRead)
    const inputStates = { digital: {}, analog: {} };

    // Check each board pin
    const allBoardPins = [...board.leftPins, ...board.rightPins];
    for (const p of allBoardPins) {
      if (p.gpio !== null && p.gpio !== undefined) {
        const net = findNet({ target: 'board', pin: p.id });
        const connectsGnd = isNetGnd(net);
        const connectsVcc = isNetVcc(net);

        // Check if connected to potentiometer wiper
        let potWiperVal = null;
        for (const n of net) {
          const comp = components.find(c => c.id === n.target);
          if (comp && comp.type === 'potentiometer' && n.pin === 'sig') {
            potWiperVal = comp.props ? comp.props.value : 0.5;
            break;
          }
        }

        if (potWiperVal !== null) {
          const maxAdc = (board.adcBits === 12) ? 4095 : 1023;
          inputStates.analog[p.gpio] = Math.round(potWiperVal * maxAdc);
          inputStates.digital[p.gpio] = potWiperVal > 0.5 ? 1 : 0;
        } else if (connectsGnd && !connectsVcc) {
          inputStates.digital[p.gpio] = 0;
          inputStates.analog[p.gpio] = 0;
        } else if (connectsVcc && !connectsGnd) {
          inputStates.digital[p.gpio] = 1;
          const maxAdc = (board.adcBits === 12) ? 4095 : 1023;
          inputStates.analog[p.gpio] = maxAdc;
        } else {
          // Floating or pullup default
          const mode = (boardState.pinModes && boardState.pinModes[p.gpio]) || 'INPUT';
          if (mode === 'INPUT_PULLUP') {
            inputStates.digital[p.gpio] = 1;
          }
        }
      }

      // Check A0 analog pin on NodeMCU
      if (p.id === 'A0') {
        const net = findNet({ target: 'board', pin: 'A0' });
        for (const n of net) {
          const comp = components.find(c => c.id === n.target);
          if (comp && comp.type === 'potentiometer' && n.pin === 'sig') {
            const potVal = comp.props ? comp.props.value : 0.5;
            inputStates.analog['A0'] = Math.round(potVal * 1023);
          }
        }
      }
    }

    return inputStates;
  }

  /**
   * Convert to plain object (for serialization)
   */
  toJSON() {
    return {
      wires: this.wires.map(w => w.toJSON())
    };
  }

  /**
   * Create a CircuitNet from serialized data
   */
  static fromJSON(data) {
    const net = new CircuitNet();
    if (data && data.wires) {
      for (const w of data.wires) {
        net.addWire(w.from, w.to, w.color);
      }
    }
    return net;
  }
}

/**
 * Validate wire connection data.
 */
export function validateWire(from, to) {
  if (!from || !from.target || !from.pin) {
    throw new ValidationError('Wire from must have target and pin', 'from', from);
  }
  if (!to || !to.target || !to.pin) {
    throw new ValidationError('Wire to must have target and pin', 'to', to);
  }
  return { valid: true };
}

export default { Wire, CircuitNet, validateWire };
