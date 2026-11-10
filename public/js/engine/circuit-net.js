// Circuit Netlist & Electrical Solver
export class CircuitNet {
  constructor() {
    this.wires = []; // Array of { id, from: { target, pin }, to: { target, pin }, color }
    this.listeners = new Set();
  }

  addWire(from, to, color = '#38bdf8') {
    // Prevent duplicate wires between same pins
    const exists = this.wires.some(w => 
      (isSamePin(w.from, from) && isSamePin(w.to, to)) ||
      (isSamePin(w.from, to) && isSamePin(w.to, from))
    );
    if (exists) return null;

    const wire = {
      id: 'w_' + Math.random().toString(36).substring(2, 9),
      from,
      to,
      color
    };
    this.wires.push(wire);
    this.notify();
    return wire;
  }

  removeWire(wireId) {
    const idx = this.wires.findIndex(w => w.id === wireId);
    if (idx !== -1) {
      const removed = this.wires.splice(idx, 1)[0];
      this.notify();
      return removed;
    }
    return null;
  }

  removeWiresConnectedTo(targetId) {
    this.wires = this.wires.filter(w => w.from.target !== targetId && w.to.target !== targetId);
    this.notify();
  }

  clear() {
    this.wires = [];
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.wires));
  }

  /**
   * Given board pin states and component models, solve circuit voltages and states.
   */
  solve(board, boardState, components) {
    // 1. Build adjacency graph of nodes
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

    // Add internal component connections (e.g. Resistor connects pin1 to pin2; Pushbutton connects pin1a to pin2a when pressed)
    for (const comp of components) {
      if (comp.type === 'resistor') {
        addEdge({ target: comp.id, pin: 'pin1' }, { target: comp.id, pin: 'pin2' });
      } else if (comp.type === 'pushbutton') {
        // Pins 1a and 1b are always connected internally; pins 2a and 2b are always connected internally
        addEdge({ target: comp.id, pin: 'pin1a' }, { target: comp.id, pin: 'pin1b' });
        addEdge({ target: comp.id, pin: 'pin2a' }, { target: comp.id, pin: 'pin2b' });
        if (comp.props && comp.props.isPressed) {
          addEdge({ target: comp.id, pin: 'pin1a' }, { target: comp.id, pin: 'pin2a' });
        }
      }
    }

    // Helper: find all connected nodes in the net containing (target, pin)
    const findNet = (startNode) => {
      const visited = new Set();
      const queue = [`${startNode.target}:${startNode.pin}`];
      visited.add(`${startNode.target}:${startNode.pin}`);
      const net = [startNode];

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

    // Helper: check if a net connects to GND
    const isNetGnd = (net) => {
      return net.some(n => {
        if (n.target === 'board') {
          return n.pin.startsWith('GND');
        }
        return false;
      });
    };

    // Helper: check if a net connects to VCC / Power
    const isNetVcc = (net) => {
      return net.some(n => {
        if (n.target === 'board') {
          return n.pin.startsWith('3V3') || n.pin === 'VIN';
        }
        return false;
      });
    };

    // Helper: find GPIO drive on net
    const getGpioDriveOnNet = (net) => {
      for (const n of net) {
        if (n.target === 'board') {
          const pinDef = findBoardPin(board, n.pin);
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
          const pinDef = findBoardPin(board, posNet.find(n => n.target === 'board')?.pin);
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
}

function isSamePin(a, b) {
  return a.target === b.target && a.pin === b.pin;
}

function findBoardPin(board, pinId) {
  if (!board || !pinId) return null;
  return [...board.leftPins, ...board.rightPins].find(p => p.id === pinId);
}
