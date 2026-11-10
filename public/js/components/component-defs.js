// Component Definitions for ESP Simulator
export const COMPONENTS = {
  'led': {
    type: 'led',
    name: 'LED (5mm)',
    category: 'Output',
    width: 60,
    height: 70,
    defaultProps: { color: 'red' },
    colors: {
      red: '#ef4444',
      green: '#22c55e',
      blue: '#3b82f6',
      yellow: '#eab308',
      purple: '#a855f7',
      orange: '#f97316'
    },
    pins: [
      { id: 'anode', label: 'Anode (+)', type: 'signal', x: 20, y: 65, description: 'Positive lead (longer pin)' },
      { id: 'cathode', label: 'Cathode (-)', type: 'gnd', x: 40, y: 65, description: 'Negative lead (flat side)' }
    ]
  },

  'resistor': {
    type: 'resistor',
    name: 'Resistor',
    category: 'Passive',
    width: 80,
    height: 35,
    defaultProps: { resistance: 220 },
    presets: [
      { value: 220, label: '220 Ω (LED current limit)' },
      { value: 330, label: '330 Ω' },
      { value: 1000, label: '1 kΩ' },
      { value: 4700, label: '4.7 kΩ (I2C pullup)' },
      { value: 10000, label: '10 kΩ (Button pullup)' }
    ],
    pins: [
      { id: 'pin1', label: '1', type: 'passive', x: 5, y: 17.5, description: 'Terminal 1' },
      { id: 'pin2', label: '2', type: 'passive', x: 75, y: 17.5, description: 'Terminal 2' }
    ]
  },

  'pushbutton': {
    type: 'pushbutton',
    name: 'Tactile Push Button',
    category: 'Input',
    width: 60,
    height: 60,
    defaultProps: { isPressed: false },
    pins: [
      { id: 'pin1a', label: '1a', type: 'passive', x: 10, y: 15, description: 'Contact 1a' },
      { id: 'pin1b', label: '1b', type: 'passive', x: 10, y: 45, description: 'Contact 1b' },
      { id: 'pin2a', label: '2a', type: 'passive', x: 50, y: 15, description: 'Contact 2a' },
      { id: 'pin2b', label: '2b', type: 'passive', x: 50, y: 45, description: 'Contact 2b' }
    ]
  },

  'potentiometer': {
    type: 'potentiometer',
    name: 'Potentiometer (Rotary)',
    category: 'Input',
    width: 75,
    height: 85,
    defaultProps: { value: 0.5 }, // 0.0 to 1.0 (0V to 3.3V)
    pins: [
      { id: 'gnd', label: 'GND', type: 'gnd', x: 15, y: 80, description: 'Ground' },
      { id: 'sig', label: 'SIG', type: 'signal', x: 37.5, y: 80, description: 'Wiper / Analog Output (0-3.3V)' },
      { id: 'vcc', label: 'VCC', type: 'power', x: 60, y: 80, description: '3.3V Power' }
    ]
  },

  'oled-ssd1306': {
    type: 'oled-ssd1306',
    name: '0.96" OLED (SSD1306 I2C)',
    category: 'Display',
    width: 140,
    height: 100,
    defaultProps: { i2cAddress: 0x3C },
    pins: [
      { id: 'gnd', label: 'GND', type: 'gnd', x: 30, y: 10, description: 'Ground' },
      { id: 'vcc', label: 'VCC', type: 'power', x: 55, y: 10, description: '3.3V Power' },
      { id: 'scl', label: 'SCL', type: 'signal', x: 80, y: 10, description: 'I2C Clock (D1 on ESP8266, GPIO22 on ESP32)' },
      { id: 'sda', label: 'SDA', type: 'signal', x: 105, y: 10, description: 'I2C Data (D2 on ESP8266, GPIO21 on ESP32)' }
    ]
  },

  'dht22': {
    type: 'dht22',
    name: 'DHT22 / AM2302 Sensor',
    category: 'Sensors',
    width: 80,
    height: 105,
    defaultProps: { temperature: 24.5, humidity: 48 },
    pins: [
      { id: 'vcc', label: 'VCC', type: 'power', x: 20, y: 100, description: '3.3V - 5V Power' },
      { id: 'data', label: 'DAT', type: 'signal', x: 40, y: 100, description: 'Data Pin (Digital I/O)' },
      { id: 'gnd', label: 'GND', type: 'gnd', x: 60, y: 100, description: 'Ground' }
    ]
  },

  'servo-sg90': {
    type: 'servo-sg90',
    name: 'SG90 Micro Servo',
    category: 'Actuators',
    width: 90,
    height: 100,
    defaultProps: { angle: 90 },
    pins: [
      { id: 'gnd', label: 'GND (Brown)', type: 'gnd', x: 25, y: 95, description: 'Ground (Brown wire)' },
      { id: 'vcc', label: 'VCC (Red)', type: 'power', x: 45, y: 95, description: '5V / 3.3V Power (Red wire)' },
      { id: 'pwm', label: 'PWM (Orange)', type: 'signal', x: 65, y: 95, description: 'PWM Signal (Orange wire)' }
    ]
  },

  'neopixel-strip': {
    type: 'neopixel-strip',
    name: 'WS2812B 8-RGB LED Strip',
    category: 'Display',
    width: 220,
    height: 50,
    defaultProps: {
      pixels: [
        [0,0,0], [0,0,0], [0,0,0], [0,0,0],
        [0,0,0], [0,0,0], [0,0,0], [0,0,0]
      ]
    },
    pins: [
      { id: 'gnd', label: 'GND', type: 'gnd', x: 15, y: 42, description: 'Ground' },
      { id: 'din', label: 'DIN', type: 'signal', x: 30, y: 42, description: 'Data Input (GPIO pin)' },
      { id: 'vcc', label: '5V/3V3', type: 'power', x: 45, y: 42, description: 'Power In' }
    ]
  },

  'buzzer': {
    type: 'buzzer',
    name: 'Piezo Buzzer (Audio)',
    category: 'Output',
    width: 65,
    height: 75,
    defaultProps: { isSounding: false, frequency: 0 },
    pins: [
      { id: 'pos', label: '(+) POS', type: 'signal', x: 22, y: 70, description: 'Positive / PWM input' },
      { id: 'neg', label: '(-) NEG', type: 'gnd', x: 43, y: 70, description: 'Ground / Negative' }
    ]
  },
  'capacitor': {
    type: 'capacitor',
    name: 'Capacitor',
    category: 'Passive',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 15, description: 'pin2' }
    ]
  },
  'inductor': {
    type: 'inductor',
    name: 'Inductor',
    category: 'Passive',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 15, description: 'pin2' }
    ]
  },
  'transformer': {
    type: 'transformer',
    name: 'Transformer',
    category: 'Passive',
    width: 80,
    height: 60,
    defaultProps: {},
    pins: [
      { id: 'pri1', label: 'P1', type: 'signal', x: 5, y: 15, description: 'pri1' },
      { id: 'pri2', label: 'P2', type: 'signal', x: 5, y: 45, description: 'pri2' },
      { id: 'sec1', label: 'S1', type: 'signal', x: 75, y: 15, description: 'sec1' },
      { id: 'sec2', label: 'S2', type: 'signal', x: 75, y: 45, description: 'sec2' }
    ]
  },
  'crystal': {
    type: 'crystal',
    name: 'Crystal Oscillator',
    category: 'Passive',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 10, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 50, y: 15, description: 'pin2' }
    ]
  },
  'ferrite-bead': {
    type: 'ferrite-bead',
    name: 'Ferrite Bead',
    category: 'Passive',
    width: 50,
    height: 20,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 10, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 10, description: 'pin2' }
    ]
  },
  'varistor': {
    type: 'varistor',
    name: 'Varistor/MOV',
    category: 'Passive',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 15, description: 'pin2' }
    ]
  },
  'thermistor': {
    type: 'thermistor',
    name: 'Thermistor',
    category: 'Passive',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 15, description: 'pin2' }
    ]
  },
  'ldr': {
    type: 'ldr',
    name: 'LDR (Light Sensor)',
    category: 'Passive',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 15, description: 'pin2' }
    ]
  },
  'fuse': {
    type: 'fuse',
    name: 'Fuse',
    category: 'Passive',
    width: 50,
    height: 20,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 10, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 10, description: 'pin2' }
    ]
  },
  'ptc-fuse': {
    type: 'ptc-fuse',
    name: 'Resettable PTC Fuse',
    category: 'Passive',
    width: 50,
    height: 20,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 10, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 10, description: 'pin2' }
    ]
  },
  'filter-rlc': {
    type: 'filter-rlc',
    name: 'RC/LC/RLC Filter',
    category: 'Passive',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 55, y: 15, description: 'out' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 30, y: 25, description: 'gnd' }
    ]
  },
  'diode': {
    type: 'diode',
    name: 'Rectifier Diode',
    category: 'Semiconductor',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'anode', label: 'A', type: 'signal', x: 5, y: 15, description: 'anode' },
      { id: 'cathode', label: 'K', type: 'signal', x: 45, y: 15, description: 'cathode' }
    ]
  },
  'zener': {
    type: 'zener',
    name: 'Zener Diode',
    category: 'Semiconductor',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'anode', label: 'A', type: 'signal', x: 5, y: 15, description: 'anode' },
      { id: 'cathode', label: 'K', type: 'signal', x: 45, y: 15, description: 'cathode' }
    ]
  },
  'schottky': {
    type: 'schottky',
    name: 'Schottky Diode',
    category: 'Semiconductor',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'anode', label: 'A', type: 'signal', x: 5, y: 15, description: 'anode' },
      { id: 'cathode', label: 'K', type: 'signal', x: 45, y: 15, description: 'cathode' }
    ]
  },
  'tvs-diode': {
    type: 'tvs-diode',
    name: 'TVS Diode',
    category: 'Semiconductor',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 15, description: 'pin2' }
    ]
  },
  'photodiode': {
    type: 'photodiode',
    name: 'Photodiode',
    category: 'Semiconductor',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'anode', label: 'A', type: 'signal', x: 5, y: 15, description: 'anode' },
      { id: 'cathode', label: 'K', type: 'signal', x: 45, y: 15, description: 'cathode' }
    ]
  },
  'bjt-npn': {
    type: 'bjt-npn',
    name: 'BJT NPN',
    category: 'Semiconductor',
    width: 50,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'base', label: 'B', type: 'signal', x: 5, y: 25, description: 'base' },
      { id: 'collector', label: 'C', type: 'signal', x: 25, y: 5, description: 'collector' },
      { id: 'emitter', label: 'E', type: 'signal', x: 25, y: 45, description: 'emitter' }
    ]
  },
  'bjt-pnp': {
    type: 'bjt-pnp',
    name: 'BJT PNP',
    category: 'Semiconductor',
    width: 50,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'base', label: 'B', type: 'signal', x: 5, y: 25, description: 'base' },
      { id: 'collector', label: 'C', type: 'signal', x: 25, y: 5, description: 'collector' },
      { id: 'emitter', label: 'E', type: 'signal', x: 25, y: 45, description: 'emitter' }
    ]
  },
  'nmos': {
    type: 'nmos',
    name: 'NMOS MOSFET',
    category: 'Semiconductor',
    width: 50,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'gate', label: 'G', type: 'signal', x: 5, y: 25, description: 'gate' },
      { id: 'drain', label: 'D', type: 'signal', x: 25, y: 5, description: 'drain' },
      { id: 'source', label: 'S', type: 'signal', x: 25, y: 45, description: 'source' }
    ]
  },
  'pmos': {
    type: 'pmos',
    name: 'PMOS MOSFET',
    category: 'Semiconductor',
    width: 50,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'gate', label: 'G', type: 'signal', x: 5, y: 25, description: 'gate' },
      { id: 'drain', label: 'D', type: 'signal', x: 25, y: 5, description: 'drain' },
      { id: 'source', label: 'S', type: 'signal', x: 25, y: 45, description: 'source' }
    ]
  },
  'igbt': {
    type: 'igbt',
    name: 'IGBT',
    category: 'Semiconductor',
    width: 50,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'gate', label: 'G', type: 'signal', x: 5, y: 25, description: 'gate' },
      { id: 'collector', label: 'C', type: 'signal', x: 25, y: 5, description: 'collector' },
      { id: 'emitter', label: 'E', type: 'signal', x: 25, y: 45, description: 'emitter' }
    ]
  },
  'scr': {
    type: 'scr',
    name: 'SCR/Thyristor',
    category: 'Semiconductor',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'anode', label: 'A', type: 'signal', x: 5, y: 20, description: 'anode' },
      { id: 'cathode', label: 'K', type: 'signal', x: 45, y: 20, description: 'cathode' },
      { id: 'gate', label: 'G', type: 'signal', x: 25, y: 35, description: 'gate' }
    ]
  },
  'triac': {
    type: 'triac',
    name: 'Triac',
    category: 'Semiconductor',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'mt1', label: 'MT1', type: 'signal', x: 5, y: 20, description: 'mt1' },
      { id: 'mt2', label: 'MT2', type: 'signal', x: 45, y: 20, description: 'mt2' },
      { id: 'gate', label: 'G', type: 'signal', x: 25, y: 35, description: 'gate' }
    ]
  },
  'optocoupler': {
    type: 'optocoupler',
    name: 'Optocoupler',
    category: 'Semiconductor',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'led_a', label: 'A', type: 'signal', x: 5, y: 10, description: 'led_a' },
      { id: 'led_k', label: 'K', type: 'signal', x: 5, y: 30, description: 'led_k' },
      { id: 'coll', label: 'C', type: 'signal', x: 55, y: 10, description: 'coll' },
      { id: 'emitt', label: 'E', type: 'signal', x: 55, y: 30, description: 'emitt' }
    ]
  },
  'opamp': {
    type: 'opamp',
    name: 'Op-Amp',
    category: 'Semiconductor',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'vin_p', label: 'IN+', type: 'signal', x: 5, y: 10, description: 'vin_p' },
      { id: 'vin_m', label: 'IN-', type: 'signal', x: 5, y: 30, description: 'vin_m' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 30, y: 5, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 30, y: 35, description: 'gnd' },
      { id: 'out', label: 'OUT', type: 'signal', x: 55, y: 20, description: 'out' }
    ]
  },
  'comparator': {
    type: 'comparator',
    name: 'Comparator',
    category: 'Semiconductor',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'vin_p', label: 'IN+', type: 'signal', x: 5, y: 10, description: 'vin_p' },
      { id: 'vin_m', label: 'IN-', type: 'signal', x: 5, y: 30, description: 'vin_m' },
      { id: 'out', label: 'OUT', type: 'signal', x: 55, y: 20, description: 'out' }
    ]
  },
  'timer-555': {
    type: 'timer-555',
    name: 'Timer IC 555',
    category: 'Semiconductor',
    width: 60,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 10, y: 5, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 10, y: 45, description: 'gnd' },
      { id: 'trig', label: 'TRG', type: 'signal', x: 5, y: 20, description: 'trig' },
      { id: 'thr', label: 'THR', type: 'signal', x: 5, y: 30, description: 'thr' },
      { id: 'dis', label: 'DIS', type: 'signal', x: 55, y: 20, description: 'dis' },
      { id: 'out', label: 'OUT', type: 'signal', x: 55, y: 30, description: 'out' },
      { id: 'rst', label: 'RST', type: 'signal', x: 50, y: 5, description: 'rst' }
    ]
  },
  'logic-gate': {
    type: 'logic-gate',
    name: 'Logic Gate',
    category: 'Semiconductor',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'in1', label: 'A', type: 'signal', x: 5, y: 10, description: 'in1' },
      { id: 'in2', label: 'B', type: 'signal', x: 5, y: 30, description: 'in2' },
      { id: 'out', label: 'Y', type: 'signal', x: 45, y: 20, description: 'out' }
    ]
  },
  'adc': {
    type: 'adc',
    name: 'ADC',
    category: 'Semiconductor',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'vin', label: 'VIN', type: 'signal', x: 5, y: 20, description: 'vin' },
      { id: 'vref', label: 'REF', type: 'signal', x: 15, y: 5, description: 'vref' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 15, y: 35, description: 'gnd' },
      { id: 'data', label: 'DATA', type: 'signal', x: 45, y: 20, description: 'data' }
    ]
  },
  'dac': {
    type: 'dac',
    name: 'DAC',
    category: 'Semiconductor',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'data', label: 'DATA', type: 'signal', x: 5, y: 20, description: 'data' },
      { id: 'vref', label: 'REF', type: 'signal', x: 15, y: 5, description: 'vref' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 15, y: 35, description: 'gnd' },
      { id: 'vout', label: 'VOUT', type: 'signal', x: 45, y: 20, description: 'vout' }
    ]
  },
  'mcu': {
    type: 'mcu',
    name: 'Microcontroller',
    category: 'Semiconductor',
    width: 60,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 10, y: 5, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 10, y: 45, description: 'gnd' },
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 25, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 55, y: 25, description: 'out' }
    ]
  },
  'switch': {
    type: 'switch',
    name: 'Switch',
    category: 'Electromechanical',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 15, description: 'pin2' }
    ]
  },
  'relay': {
    type: 'relay',
    name: 'Relay',
    category: 'Electromechanical',
    width: 60,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'coil1', label: 'C1', type: 'signal', x: 5, y: 10, description: 'coil1' },
      { id: 'coil2', label: 'C2', type: 'signal', x: 5, y: 40, description: 'coil2' },
      { id: 'com', label: 'COM', type: 'signal', x: 55, y: 10, description: 'com' },
      { id: 'no', label: 'NO', type: 'signal', x: 55, y: 25, description: 'no' },
      { id: 'nc', label: 'NC', type: 'signal', x: 55, y: 40, description: 'nc' }
    ]
  },
  'ssr': {
    type: 'ssr',
    name: 'Solid-State Relay',
    category: 'Electromechanical',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'in_p', label: 'IN+', type: 'signal', x: 5, y: 10, description: 'in_p' },
      { id: 'in_n', label: 'IN-', type: 'signal', x: 5, y: 30, description: 'in_n' },
      { id: 'out_p', label: 'OUT+', type: 'signal', x: 55, y: 10, description: 'out_p' },
      { id: 'out_n', label: 'OUT-', type: 'signal', x: 55, y: 30, description: 'out_n' }
    ]
  },
  'contactor': {
    type: 'contactor',
    name: 'Contactor',
    category: 'Electromechanical',
    width: 60,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'coil1', label: 'A1', type: 'signal', x: 5, y: 10, description: 'coil1' },
      { id: 'coil2', label: 'A2', type: 'signal', x: 5, y: 40, description: 'coil2' },
      { id: 'l1', label: 'L1', type: 'signal', x: 55, y: 10, description: 'l1' },
      { id: 'l2', label: 'L2', type: 'signal', x: 55, y: 25, description: 'l2' },
      { id: 'l3', label: 'L3', type: 'signal', x: 55, y: 40, description: 'l3' }
    ]
  },
  'solenoid': {
    type: 'solenoid',
    name: 'Solenoid',
    category: 'Electromechanical',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 15, description: 'pin2' }
    ]
  },
  'dc-motor': {
    type: 'dc-motor',
    name: 'DC Motor',
    category: 'Electromechanical',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'terminal1', label: '+', type: 'signal', x: 5, y: 20, description: 'terminal1' },
      { id: 'terminal2', label: '-', type: 'signal', x: 45, y: 20, description: 'terminal2' }
    ]
  },
  'stepper-motor': {
    type: 'stepper-motor',
    name: 'Stepper Motor',
    category: 'Electromechanical',
    width: 60,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'a_p', label: 'A+', type: 'signal', x: 5, y: 10, description: 'a_p' },
      { id: 'a_n', label: 'A-', type: 'signal', x: 5, y: 25, description: 'a_n' },
      { id: 'b_p', label: 'B+', type: 'signal', x: 5, y: 40, description: 'b_p' },
      { id: 'b_n', label: 'B-', type: 'signal', x: 5, y: 50, description: 'b_n' }
    ]
  },
  'encoder': {
    type: 'encoder',
    name: 'Encoder',
    category: 'Electromechanical',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 30, description: 'gnd' },
      { id: 'a', label: 'A', type: 'signal', x: 45, y: 10, description: 'a' },
      { id: 'b', label: 'B', type: 'signal', x: 45, y: 30, description: 'b' }
    ]
  },
  'buzzer': {
    type: 'buzzer',
    name: 'Buzzer/Speaker',
    category: 'Electromechanical',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'pos', label: '+', type: 'signal', x: 20, y: 35, description: 'pos' },
      { id: 'neg', label: '-', type: 'signal', x: 30, y: 35, description: 'neg' }
    ]
  },
  'battery': {
    type: 'battery',
    name: 'Battery',
    category: 'Power',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pos', label: '+', type: 'signal', x: 5, y: 15, description: 'pos' },
      { id: 'neg', label: '-', type: 'signal', x: 45, y: 15, description: 'neg' }
    ]
  },
  'bms': {
    type: 'bms',
    name: 'BMS (Battery Mgmt)',
    category: 'Power',
    width: 60,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'cell_p', label: 'CP', type: 'signal', x: 5, y: 10, description: 'cell_p' },
      { id: 'cell_n', label: 'CN', type: 'signal', x: 5, y: 40, description: 'cell_n' },
      { id: 'pack_p', label: 'PP', type: 'signal', x: 55, y: 10, description: 'pack_p' },
      { id: 'pack_n', label: 'PN', type: 'signal', x: 55, y: 40, description: 'pack_n' }
    ]
  },
  'solar-panel': {
    type: 'solar-panel',
    name: 'Solar Panel',
    category: 'Power',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'pos', label: '+', type: 'signal', x: 5, y: 20, description: 'pos' },
      { id: 'neg', label: '-', type: 'signal', x: 55, y: 20, description: 'neg' }
    ]
  },
  'ac-dc-adapter': {
    type: 'ac-dc-adapter',
    name: 'AC-DC Adapter',
    category: 'Power',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'ac_in', label: 'AC', type: 'signal', x: 5, y: 20, description: 'ac_in' },
      { id: 'dc_p', label: 'DC+', type: 'signal', x: 55, y: 10, description: 'dc_p' },
      { id: 'dc_n', label: 'DC-', type: 'signal', x: 55, y: 30, description: 'dc_n' }
    ]
  },
  'linear-regulator': {
    type: 'linear-regulator',
    name: 'Linear Regulator',
    category: 'Power',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vin', label: 'VIN', type: 'signal', x: 5, y: 15, description: 'vin' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 25, y: 25, description: 'gnd' },
      { id: 'vout', label: 'VOUT', type: 'signal', x: 45, y: 15, description: 'vout' }
    ]
  },
  'buck-converter': {
    type: 'buck-converter',
    name: 'Buck Converter',
    category: 'Power',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'vin', label: 'VIN', type: 'signal', x: 5, y: 20, description: 'vin' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 30, y: 35, description: 'gnd' },
      { id: 'vout', label: 'VOUT', type: 'signal', x: 55, y: 20, description: 'vout' }
    ]
  },
  'boost-converter': {
    type: 'boost-converter',
    name: 'Boost Converter',
    category: 'Power',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'vin', label: 'VIN', type: 'signal', x: 5, y: 20, description: 'vin' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 30, y: 35, description: 'gnd' },
      { id: 'vout', label: 'VOUT', type: 'signal', x: 55, y: 20, description: 'vout' }
    ]
  },
  'buck-boost': {
    type: 'buck-boost',
    name: 'Buck-Boost Converter',
    category: 'Power',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'vin', label: 'VIN', type: 'signal', x: 5, y: 20, description: 'vin' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 30, y: 35, description: 'gnd' },
      { id: 'vout', label: 'VOUT', type: 'signal', x: 55, y: 20, description: 'vout' }
    ]
  },
  'inverter': {
    type: 'inverter',
    name: 'Inverter (DC-AC)',
    category: 'Power',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'dc_p', label: 'DC+', type: 'signal', x: 5, y: 10, description: 'dc_p' },
      { id: 'dc_n', label: 'DC-', type: 'signal', x: 5, y: 30, description: 'dc_n' },
      { id: 'ac', label: 'AC', type: 'signal', x: 55, y: 20, description: 'ac' }
    ]
  },
  'ups': {
    type: 'ups',
    name: 'UPS',
    category: 'Power',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'ac_in', label: 'AC', type: 'signal', x: 5, y: 20, description: 'ac_in' },
      { id: 'batt', label: 'BATT', type: 'signal', x: 30, y: 35, description: 'batt' },
      { id: 'load', label: 'LOAD', type: 'signal', x: 55, y: 20, description: 'load' }
    ]
  },
  'mppt': {
    type: 'mppt',
    name: 'MPPT Controller',
    category: 'Power',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'pv_p', label: 'PV+', type: 'signal', x: 5, y: 10, description: 'pv_p' },
      { id: 'pv_n', label: 'PV-', type: 'signal', x: 5, y: 30, description: 'pv_n' },
      { id: 'batt_p', label: 'BAT+', type: 'signal', x: 55, y: 10, description: 'batt_p' },
      { id: 'batt_n', label: 'BAT-', type: 'signal', x: 55, y: 30, description: 'batt_n' }
    ]
  },
  'mcb': {
    type: 'mcb',
    name: 'MCB',
    category: 'Switchgear',
    width: 40,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 35, y: 15, description: 'out' }
    ]
  },
  'mccb': {
    type: 'mccb',
    name: 'MCCB',
    category: 'Switchgear',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'rccb': {
    type: 'rccb',
    name: 'RCCB/RCBO',
    category: 'Switchgear',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'live_in', label: 'L', type: 'signal', x: 5, y: 10, description: 'live_in' },
      { id: 'neu_in', label: 'N', type: 'signal', x: 5, y: 20, description: 'neu_in' },
      { id: 'live_out', label: 'LO', type: 'signal', x: 45, y: 10, description: 'live_out' },
      { id: 'neu_out', label: 'NO', type: 'signal', x: 45, y: 20, description: 'neu_out' }
    ]
  },
  'isolator': {
    type: 'isolator',
    name: 'Isolator',
    category: 'Switchgear',
    width: 40,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 35, y: 15, description: 'out' }
    ]
  },
  'changeover': {
    type: 'changeover',
    name: 'Changeover Switch',
    category: 'Switchgear',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'mains', label: 'M', type: 'signal', x: 5, y: 10, description: 'mains' },
      { id: 'gen', label: 'G', type: 'signal', x: 5, y: 30, description: 'gen' },
      { id: 'load', label: 'L', type: 'signal', x: 55, y: 20, description: 'load' }
    ]
  },
  'motor-starter': {
    type: 'motor-starter',
    name: 'Motor Starter',
    category: 'Switchgear',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'supply', label: 'S', type: 'signal', x: 5, y: 20, description: 'supply' },
      { id: 'motor', label: 'M', type: 'signal', x: 45, y: 20, description: 'motor' }
    ]
  },
  'vfd': {
    type: 'vfd',
    name: 'VFD',
    category: 'Switchgear',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'supply', label: 'S', type: 'signal', x: 5, y: 20, description: 'supply' },
      { id: 'motor', label: 'M', type: 'signal', x: 55, y: 20, description: 'motor' }
    ]
  },
  'busbar': {
    type: 'busbar',
    name: 'Busbar',
    category: 'Switchgear',
    width: 60,
    height: 20,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 10, description: 'in' },
      { id: 'out1', label: 'O1', type: 'signal', x: 25, y: 10, description: 'out1' },
      { id: 'out2', label: 'O2', type: 'signal', x: 45, y: 10, description: 'out2' }
    ]
  },
  'ct': {
    type: 'ct',
    name: 'Current Transformer',
    category: 'Switchgear',
    width: 50,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'primary', label: 'P', type: 'signal', x: 5, y: 20, description: 'primary' },
      { id: 'sec1', label: 'S1', type: 'signal', x: 45, y: 10, description: 'sec1' },
      { id: 'sec2', label: 'S2', type: 'signal', x: 45, y: 30, description: 'sec2' }
    ]
  },
  'energy-meter': {
    type: 'energy-meter',
    name: 'Energy Meter',
    category: 'Switchgear',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'live', label: 'L', type: 'signal', x: 5, y: 10, description: 'live' },
      { id: 'neu', label: 'N', type: 'signal', x: 5, y: 20, description: 'neu' },
      { id: 'out', label: 'O', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'spd': {
    type: 'spd',
    name: 'Surge Protection (SPD)',
    category: 'Switchgear',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'live', label: 'L', type: 'signal', x: 5, y: 10, description: 'live' },
      { id: 'neu', label: 'N', type: 'signal', x: 5, y: 20, description: 'neu' },
      { id: 'earth', label: 'E', type: 'signal', x: 45, y: 15, description: 'earth' }
    ]
  },
  'earthing': {
    type: 'earthing',
    name: 'Earthing System',
    category: 'Switchgear',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'earth', label: 'E', type: 'signal', x: 5, y: 15, description: 'earth' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 45, y: 15, description: 'gnd' }
    ]
  },
  'temp-sensor': {
    type: 'temp-sensor',
    name: 'Temperature Sensor',
    category: 'Sensors',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'humidity-sensor': {
    type: 'humidity-sensor',
    name: 'Humidity Sensor',
    category: 'Sensors',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'pir-sensor': {
    type: 'pir-sensor',
    name: 'PIR Motion Sensor',
    category: 'Sensors',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'ultrasonic': {
    type: 'ultrasonic',
    name: 'Ultrasonic Sensor',
    category: 'Sensors',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 15, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 15, y: 25, description: 'gnd' },
      { id: 'trig', label: 'TRG', type: 'signal', x: 45, y: 10, description: 'trig' },
      { id: 'echo', label: 'ECH', type: 'signal', x: 55, y: 20, description: 'echo' }
    ]
  },
  'gas-sensor': {
    type: 'gas-sensor',
    name: 'Gas Sensor',
    category: 'Sensors',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'load-cell': {
    type: 'load-cell',
    name: 'Load Cell',
    category: 'Sensors',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'exc_p', label: 'E+', type: 'signal', x: 5, y: 10, description: 'exc_p' },
      { id: 'exc_n', label: 'E-', type: 'signal', x: 5, y: 20, description: 'exc_n' },
      { id: 'sig_p', label: 'S+', type: 'signal', x: 55, y: 10, description: 'sig_p' },
      { id: 'sig_n', label: 'S-', type: 'signal', x: 55, y: 20, description: 'sig_n' }
    ]
  },
  'accelerometer': {
    type: 'accelerometer',
    name: 'Accelerometer/IMU',
    category: 'Sensors',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'sda', label: 'SDA', type: 'signal', x: 45, y: 10, description: 'sda' },
      { id: 'scl', label: 'SCL', type: 'signal', x: 45, y: 20, description: 'scl' }
    ]
  },
  'current-sensor': {
    type: 'current-sensor',
    name: 'Current Sensor',
    category: 'Sensors',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'rfid': {
    type: 'rfid',
    name: 'RFID/NFC Module',
    category: 'Sensors',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 15, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 15, y: 25, description: 'gnd' },
      { id: 'tx', label: 'TX', type: 'signal', x: 45, y: 10, description: 'tx' },
      { id: 'rx', label: 'RX', type: 'signal', x: 55, y: 20, description: 'rx' }
    ]
  },
  'gps': {
    type: 'gps',
    name: 'GPS Module',
    category: 'Sensors',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 15, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 15, y: 25, description: 'gnd' },
      { id: 'tx', label: 'TX', type: 'signal', x: 45, y: 10, description: 'tx' },
      { id: 'rx', label: 'RX', type: 'signal', x: 55, y: 20, description: 'rx' }
    ]
  },
  'led-strip': {
    type: 'led-strip',
    name: 'LED Strip',
    category: 'Output',
    width: 70,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 25, description: 'gnd' },
      { id: 'din', label: 'DIN', type: 'signal', x: 20, y: 25, description: 'din' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 35, y: 25, description: 'vcc' }
    ]
  },
  'lcd-display': {
    type: 'lcd-display',
    name: 'LCD/OLED/TFT',
    category: 'Output',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'sda', label: 'SDA', type: 'signal', x: 55, y: 10, description: 'sda' },
      { id: 'scl', label: 'SCL', type: 'signal', x: 55, y: 20, description: 'scl' }
    ]
  },
  'relay-module': {
    type: 'relay-module',
    name: 'Relay Module',
    category: 'Output',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 20, description: 'in' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 15, y: 5, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 15, y: 35, description: 'gnd' },
      { id: 'com', label: 'COM', type: 'signal', x: 55, y: 10, description: 'com' },
      { id: 'no', label: 'NO', type: 'signal', x: 55, y: 20, description: 'no' },
      { id: 'nc', label: 'NC', type: 'signal', x: 55, y: 30, description: 'nc' }
    ]
  },
  'motor-driver': {
    type: 'motor-driver',
    name: 'Motor Driver',
    category: 'Output',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'pwm', label: 'PWM', type: 'signal', x: 5, y: 10, description: 'pwm' },
      { id: 'dir', label: 'DIR', type: 'signal', x: 5, y: 20, description: 'dir' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 30, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 40, description: 'gnd' },
      { id: 'out1', label: 'O1', type: 'signal', x: 55, y: 15, description: 'out1' },
      { id: 'out2', label: 'O2', type: 'signal', x: 55, y: 25, description: 'out2' }
    ]
  },
  'stepper-driver': {
    type: 'stepper-driver',
    name: 'Stepper Driver',
    category: 'Output',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'step', label: 'STP', type: 'signal', x: 5, y: 10, description: 'step' },
      { id: 'dir', label: 'DIR', type: 'signal', x: 5, y: 20, description: 'dir' },
      { id: 'en', label: 'EN', type: 'signal', x: 5, y: 30, description: 'en' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 40, description: 'vcc' },
      { id: 'a1', label: 'A1', type: 'signal', x: 55, y: 10, description: 'a1' },
      { id: 'a2', label: 'A2', type: 'signal', x: 55, y: 20, description: 'a2' },
      { id: 'b1', label: 'B1', type: 'signal', x: 55, y: 30, description: 'b1' },
      { id: 'b2', label: 'B2', type: 'signal', x: 55, y: 40, description: 'b2' }
    ]
  },
  'heating-element': {
    type: 'heating-element',
    name: 'Heating/Peltier',
    category: 'Output',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 15, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 15, description: 'pin2' }
    ]
  },
  'uart': {
    type: 'uart',
    name: 'UART',
    category: 'Communication',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'tx', label: 'TX', type: 'signal', x: 5, y: 10, description: 'tx' },
      { id: 'rx', label: 'RX', type: 'signal', x: 5, y: 20, description: 'rx' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 45, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 45, y: 20, description: 'gnd' }
    ]
  },
  'i2c': {
    type: 'i2c',
    name: 'I2C',
    category: 'Communication',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'sda', label: 'SDA', type: 'signal', x: 5, y: 10, description: 'sda' },
      { id: 'scl', label: 'SCL', type: 'signal', x: 5, y: 20, description: 'scl' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 45, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 45, y: 20, description: 'gnd' }
    ]
  },
  'spi': {
    type: 'spi',
    name: 'SPI',
    category: 'Communication',
    width: 60,
    height: 40,
    defaultProps: {},
    pins: [
      { id: 'mosi', label: 'MOSI', type: 'signal', x: 5, y: 10, description: 'mosi' },
      { id: 'miso', label: 'MISO', type: 'signal', x: 5, y: 20, description: 'miso' },
      { id: 'sck', label: 'SCK', type: 'signal', x: 5, y: 30, description: 'sck' },
      { id: 'cs', label: 'CS', type: 'signal', x: 5, y: 40, description: 'cs' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 55, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 55, y: 20, description: 'gnd' }
    ]
  },
  'can-bus': {
    type: 'can-bus',
    name: 'CAN Bus',
    category: 'Communication',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'can_h', label: 'H', type: 'signal', x: 5, y: 10, description: 'can_h' },
      { id: 'can_l', label: 'L', type: 'signal', x: 5, y: 20, description: 'can_l' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 45, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 45, y: 20, description: 'gnd' }
    ]
  },
  'rs485': {
    type: 'rs485',
    name: 'RS-485',
    category: 'Communication',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'a', label: 'A', type: 'signal', x: 5, y: 10, description: 'a' },
      { id: 'b', label: 'B', type: 'signal', x: 5, y: 20, description: 'b' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 45, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 45, y: 20, description: 'gnd' }
    ]
  },
  'wifi-module': {
    type: 'wifi-module',
    name: 'WiFi Module',
    category: 'Communication',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'tx', label: 'TX', type: 'signal', x: 5, y: 10, description: 'tx' },
      { id: 'rx', label: 'RX', type: 'signal', x: 5, y: 20, description: 'rx' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 55, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 55, y: 20, description: 'gnd' }
    ]
  },
  'bluetooth': {
    type: 'bluetooth',
    name: 'Bluetooth Module',
    category: 'Communication',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'tx', label: 'TX', type: 'signal', x: 5, y: 10, description: 'tx' },
      { id: 'rx', label: 'RX', type: 'signal', x: 5, y: 20, description: 'rx' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 55, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 55, y: 20, description: 'gnd' }
    ]
  },
  'gsm': {
    type: 'gsm',
    name: 'GSM/4G/5G Module',
    category: 'Communication',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'tx', label: 'TX', type: 'signal', x: 5, y: 10, description: 'tx' },
      { id: 'rx', label: 'RX', type: 'signal', x: 5, y: 20, description: 'rx' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 55, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 55, y: 20, description: 'gnd' }
    ]
  },
  'lora': {
    type: 'lora',
    name: 'LoRa Module',
    category: 'Communication',
    width: 60,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'mosi', label: 'MOSI', type: 'signal', x: 5, y: 10, description: 'mosi' },
      { id: 'miso', label: 'MISO', type: 'signal', x: 5, y: 20, description: 'miso' },
      { id: 'sck', label: 'SCK', type: 'signal', x: 5, y: 30, description: 'sck' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 55, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 55, y: 20, description: 'gnd' }
    ]
  },
  'arduino-board': {
    type: 'arduino-board',
    name: 'Arduino Board',
    category: 'Computing',
    width: 70,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'd2', label: 'D2', type: 'signal', x: 5, y: 10, description: 'd2' },
      { id: 'd13', label: 'D13', type: 'signal', x: 5, y: 20, description: 'd13' },
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 30, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 40, description: 'gnd' },
      { id: 'tx', label: 'TX', type: 'signal', x: 65, y: 10, description: 'tx' },
      { id: 'rx', label: 'RX', type: 'signal', x: 65, y: 20, description: 'rx' }
    ]
  },
  'raspberry-pi': {
    type: 'raspberry-pi',
    name: 'Raspberry Pi',
    category: 'Computing',
    width: 70,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: '5V', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'gpio', label: 'GPIO', type: 'signal', x: 65, y: 10, description: 'gpio' },
      { id: 'sda', label: 'SDA', type: 'signal', x: 65, y: 20, description: 'sda' },
      { id: 'scl', label: 'SCL', type: 'signal', x: 65, y: 30, description: 'scl' }
    ]
  },
  'plc': {
    type: 'plc',
    name: 'PLC',
    category: 'Computing',
    width: 70,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 30, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 65, y: 20, description: 'out' }
    ]
  },
  'hmi': {
    type: 'hmi',
    name: 'HMI Panel',
    category: 'Computing',
    width: 70,
    height: 50,
    defaultProps: {},
    pins: [
      { id: 'vcc', label: 'VCC', type: 'signal', x: 5, y: 10, description: 'vcc' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 5, y: 20, description: 'gnd' },
      { id: 'comm', label: 'COM', type: 'signal', x: 65, y: 20, description: 'comm' }
    ]
  },
  'wire': {
    type: 'wire',
    name: 'Wire/Cable',
    category: 'Connector',
    width: 50,
    height: 20,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 10, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 10, description: 'pin2' }
    ]
  },
  'terminal-block': {
    type: 'terminal-block',
    name: 'Terminal Block',
    category: 'Connector',
    width: 50,
    height: 20,
    defaultProps: {},
    pins: [
      { id: 'pin1', label: '1', type: 'signal', x: 5, y: 10, description: 'pin1' },
      { id: 'pin2', label: '2', type: 'signal', x: 45, y: 10, description: 'pin2' }
    ]
  },
  'usb-connector': {
    type: 'usb-connector',
    name: 'USB Connector',
    category: 'Connector',
    width: 50,
    height: 20,
    defaultProps: {},
    pins: [
      { id: 'vbus', label: 'VBUS', type: 'signal', x: 5, y: 10, description: 'vbus' },
      { id: 'gnd', label: 'GND', type: 'signal', x: 45, y: 10, description: 'gnd' }
    ]
  },
  'battery-connector': {
    type: 'battery-connector',
    name: 'Battery Connector',
    category: 'Connector',
    width: 50,
    height: 20,
    defaultProps: {},
    pins: [
      { id: 'pos', label: '+', type: 'signal', x: 5, y: 10, description: 'pos' },
      { id: 'neg', label: '-', type: 'signal', x: 45, y: 10, description: 'neg' }
    ]
  },
  'overcurrent': {
    type: 'overcurrent',
    name: 'Overcurrent Protection',
    category: 'Protection',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'overvoltage': {
    type: 'overvoltage',
    name: 'Overvoltage Protection',
    category: 'Protection',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'uvlo': {
    type: 'uvlo',
    name: 'Undervoltage Lockout',
    category: 'Protection',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'reverse-polarity': {
    type: 'reverse-polarity',
    name: 'Reverse Polarity Protection',
    category: 'Protection',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'thermal-protection': {
    type: 'thermal-protection',
    name: 'Thermal Protection',
    category: 'Protection',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
  'emergency-stop': {
    type: 'emergency-stop',
    name: 'Emergency Stop',
    category: 'Protection',
    width: 50,
    height: 30,
    defaultProps: {},
    pins: [
      { id: 'in', label: 'IN', type: 'signal', x: 5, y: 15, description: 'in' },
      { id: 'out', label: 'OUT', type: 'signal', x: 45, y: 15, description: 'out' }
    ]
  },
};
