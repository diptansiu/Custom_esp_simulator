// Visual SVG Renderer for Electronic Components
import { COMPONENTS } from './component-defs.js';

export function renderComponentSVG(comp) {
  const { id, type, props = {}, x = 0, y = 0 } = comp;
  const def = COMPONENTS[type] || {};

  let innerSvg = '';
  switch (type) {
    case 'led':
      innerSvg = renderLedSVG(props);
      break;
    case 'resistor':
      innerSvg = renderResistorSVG(props);
      break;
    case 'pushbutton':
      innerSvg = renderPushButtonSVG(props);
      break;
    case 'potentiometer':
      innerSvg = renderPotentiometerSVG(props);
      break;
    case 'oled-ssd1306':
      innerSvg = renderOledSVG(props, id);
      break;
    case 'dht22':
      innerSvg = renderDHT22SVG(props, id);
      break;
    case 'servo-sg90':
      innerSvg = renderServoSVG(props);
      break;
    case 'neopixel-strip':
      innerSvg = renderNeoPixelStripSVG(props);
      break;
    case 'buzzer':
      innerSvg = renderBuzzerSVG(props);
      break;
    case 'capacitor':
      innerSvg = renderCapacitorSVG(props);
      break;
    case 'inductor':
      innerSvg = renderInductorSVG(props);
      break;
    case 'transformer':
      innerSvg = renderTransformerSVG(props);
      break;
    case 'crystal':
      innerSvg = renderCrystalSVG(props);
      break;
    case 'diode':
      innerSvg = renderDiodeSVG(props);
      break;
    case 'zener':
      innerSvg = renderZenerSVG(props);
      break;
    case 'schottky':
      innerSvg = renderSchottkySVG(props);
      break;
    case 'tvs-diode':
      innerSvg = renderTvsDiodeSVG(props);
      break;
    case 'photodiode':
      innerSvg = renderPhotodiodeSVG(props);
      break;
    case 'bjt-npn':
      innerSvg = renderBjtNpnSVG(props);
      break;
    case 'bjt-pnp':
      innerSvg = renderBjtPnpSVG(props);
      break;
    case 'nmos':
      innerSvg = renderNmosSVG(props);
      break;
    case 'pmos':
      innerSvg = renderPmosSVG(props);
      break;
    case 'igbt':
      innerSvg = renderIgbtSVG(props);
      break;
    case 'scr':
      innerSvg = renderScrSVG(props);
      break;
    case 'triac':
      innerSvg = renderTriacSVG(props);
      break;
    case 'optocoupler':
      innerSvg = renderOptocouplerSVG(props);
      break;
    case 'opamp':
      innerSvg = renderOpampSVG(props);
      break;
    case 'comparator':
      innerSvg = renderComparatorSVG(props);
      break;
    case 'timer-555':
      innerSvg = renderTimer555SVG(props);
      break;
    case 'logic-gate':
      innerSvg = renderLogicGateSVG(props);
      break;
    case 'adc':
      innerSvg = renderAdcSVG(props);
      break;
    case 'dac':
      innerSvg = renderDacSVG(props);
      break;
    case 'mcu':
      innerSvg = renderMcuSVG(props);
      break;
    case 'switch':
      innerSvg = renderSwitchSVG(props);
      break;
    case 'relay':
      innerSvg = renderRelaySVG(props);
      break;
    case 'ssr':
      innerSvg = renderSsrSVG(props);
      break;
    case 'contactor':
      innerSvg = renderContactorSVG(props);
      break;
    case 'solenoid':
      innerSvg = renderSolenoidSVG(props);
      break;
    case 'dc-motor':
      innerSvg = renderDcMotorSVG(props);
      break;
    case 'stepper-motor':
      innerSvg = renderStepperMotorSVG(props);
      break;
    case 'encoder':
      innerSvg = renderEncoderSVG(props);
      break;
    case 'battery':
      innerSvg = renderBatterySVG(props);
      break;
    case 'bms':
      innerSvg = renderBmsSVG(props);
      break;
    case 'solar-panel':
      innerSvg = renderSolarPanelSVG(props);
      break;
    case 'ac-dc-adapter':
      innerSvg = renderAcDcAdapterSVG(props);
      break;
    case 'linear-regulator':
      innerSvg = renderLinearRegulatorSVG(props);
      break;
    case 'buck-converter':
      innerSvg = renderBuckConverterSVG(props);
      break;
    case 'boost-converter':
      innerSvg = renderBoostConverterSVG(props);
      break;
    case 'buck-boost':
      innerSvg = renderBuckBoostSVG(props);
      break;
    case 'inverter':
      innerSvg = renderInverterSVG(props);
      break;
    case 'ups':
      innerSvg = renderUpsSVG(props);
      break;
    case 'mppt':
      innerSvg = renderMpptSVG(props);
      break;
    case 'mcb':
      innerSvg = renderMcbSVG(props);
      break;
    case 'mccb':
      innerSvg = renderMccbSVG(props);
      break;
    case 'rccb':
      innerSvg = renderRccbSVG(props);
      break;
    case 'isolator':
      innerSvg = renderIsolatorSVG(props);
      break;
    case 'changeover':
      innerSvg = renderChangeoverSVG(props);
      break;
    case 'motor-starter':
      innerSvg = renderMotorStarterSVG(props);
      break;
    case 'vfd':
      innerSvg = renderVfdSVG(props);
      break;
    case 'busbar':
      innerSvg = renderBusbarSVG(props);
      break;
    case 'ct':
      innerSvg = renderCtSVG(props);
      break;
    case 'energy-meter':
      innerSvg = renderEnergyMeterSVG(props);
      break;
    case 'spd':
      innerSvg = renderSpdSVG(props);
      break;
    case 'earthing':
      innerSvg = renderEarthingSVG(props);
      break;
    case 'temp-sensor':
      innerSvg = renderTempSensorSVG(props);
      break;
    case 'humidity-sensor':
      innerSvg = renderHumiditySensorSVG(props);
      break;
    case 'pir-sensor':
      innerSvg = renderPirSensorSVG(props);
      break;
    case 'ultrasonic':
      innerSvg = renderUltrasonicSVG(props);
      break;
    case 'gas-sensor':
      innerSvg = renderGasSensorSVG(props);
      break;
    case 'load-cell':
      innerSvg = renderLoadCellSVG(props);
      break;
    case 'accelerometer':
      innerSvg = renderAccelerometerSVG(props);
      break;
    case 'current-sensor':
      innerSvg = renderCurrentSensorSVG(props);
      break;
    case 'rfid':
      innerSvg = renderRfidSVG(props);
      break;
    case 'gps':
      innerSvg = renderGpsSVG(props);
      break;
    case 'led-strip':
      innerSvg = renderLedStripSVG(props);
      break;
    case 'lcd-display':
      innerSvg = renderLcdDisplaySVG(props);
      break;
    case 'relay-module':
      innerSvg = renderRelayModuleSVG(props);
      break;
    case 'motor-driver':
      innerSvg = renderMotorDriverSVG(props);
      break;
    case 'stepper-driver':
      innerSvg = renderStepperDriverSVG(props);
      break;
    case 'heating-element':
      innerSvg = renderHeatingElementSVG(props);
      break;
    case 'uart':
      innerSvg = renderUartSVG(props);
      break;
    case 'i2c':
      innerSvg = renderI2cSVG(props);
      break;
    case 'spi':
      innerSvg = renderSpiSVG(props);
      break;
    case 'can-bus':
      innerSvg = renderCanBusSVG(props);
      break;
    case 'rs485':
      innerSvg = renderRs485SVG(props);
      break;
    case 'wifi-module':
      innerSvg = renderWifiModuleSVG(props);
      break;
    case 'bluetooth':
      innerSvg = renderBluetoothSVG(props);
      break;
    case 'gsm':
      innerSvg = renderGsmSVG(props);
      break;
    case 'lora':
      innerSvg = renderLoraSVG(props);
      break;
    case 'arduino-board':
      innerSvg = renderArduinoBoardSVG(props);
      break;
    case 'raspberry-pi':
      innerSvg = renderRaspberryPiSVG(props);
      break;
    case 'plc':
      innerSvg = renderPlcSVG(props);
      break;
    case 'hmi':
      innerSvg = renderHmiSVG(props);
      break;
    case 'wire':
      innerSvg = renderWireSVG(props);
      break;
    case 'terminal-block':
      innerSvg = renderTerminalBlockSVG(props);
      break;
    case 'usb-connector':
      innerSvg = renderUsbConnectorSVG(props);
      break;
    case 'battery-connector':
      innerSvg = renderBatteryConnectorSVG(props);
      break;
    case 'overcurrent':
      innerSvg = renderOvercurrentSVG(props);
      break;
    case 'overvoltage':
      innerSvg = renderOvervoltageSVG(props);
      break;
    case 'uvlo':
      innerSvg = renderUvloSVG(props);
      break;
    case 'reverse-polarity':
      innerSvg = renderReversePolaritySVG(props);
      break;
    case 'thermal-protection':
      innerSvg = renderThermalProtectionSVG(props);
      break;
    case 'emergency-stop':
      innerSvg = renderEmergencyStopSVG(props);
      break;
    default:
      innerSvg = `<rect x="0" y="0" width="${def.width || 50}" height="${def.height || 30}" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1.2"/><text x="${(def.width || 50) / 2}" y="${(def.height || 30) / 2 + 3}" fill="#94a3b8" font-size="7" font-family="'Segoe UI', sans-serif" text-anchor="middle" font-weight="bold">${def.name || type}</text>`;
  }

  // Add pin anchors
  const pinsSvg = (def.pins || []).map(p => `
    <g class="pin-anchor" data-comp-id="${id}" data-pin-id="${p.id}" transform="translate(${p.x}, ${p.y})">
      <circle cx="0" cy="0" r="7" fill="transparent" class="pin-hitbox" style="cursor: crosshair;"/>
      <circle cx="0" cy="0" r="4.5" fill="#ca8a04" stroke="#fef08a" stroke-width="1.2" class="pin-ring"/>
      <circle cx="0" cy="0" r="2.2" fill="#0f172a" class="pin-hole"/>
      <title>${p.label}: ${p.description}</title>
    </g>
  `).join('');

  return `
    <g class="component-root comp-${type}" id="comp-${id}" data-id="${id}" transform="translate(${x}, ${y})">
      ${innerSvg}
      ${pinsSvg}
    </g>
  `;
}

function renderLedSVG(props) {
  const colorName = props.color || 'red';
  const colorHex = COMPONENTS.led.colors[colorName] || '#ef4444';
  const isOn = !!props.isOn;
  const brightness = typeof props.brightness === 'number' ? props.brightness : (isOn ? 1 : 0);

  const glowRadius = isOn ? Math.round(18 * brightness) : 0;
  const opacity = isOn ? Math.max(0.4, brightness) : 0.2;

  return `
    <g class="led-art">
      <!-- Terminal leads -->
      <line x1="20" y1="50" x2="20" y2="65" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="40" y1="50" x2="40" y2="65" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>

      <!-- Glow Halo if ON -->
      ${isOn ? `
        <circle cx="30" cy="30" r="${20 + glowRadius}" fill="${colorHex}" opacity="0.35" filter="url(#blur-glow)"/>
        <circle cx="30" cy="30" r="${15 + glowRadius/2}" fill="${colorHex}" opacity="0.5"/>
      ` : ''}

      <!-- LED Base Ring (Rim) -->
      <path d="M 16 48 L 44 48 A 2 2 0 0 1 46 50 L 46 53 A 2 2 0 0 1 44 55 L 16 55 A 2 2 0 0 1 14 53 L 14 50 A 2 2 0 0 1 16 48 Z" 
            fill="${isOn ? colorHex : '#334155'}" opacity="0.9"/>

      <!-- LED Epoxy Dome -->
      <path d="M 17 48 L 17 28 A 13 13 0 0 1 43 28 L 43 48 Z" 
            fill="${colorHex}" opacity="${opacity}" stroke="${isOn ? '#ffffff' : '#64748b'}" stroke-width="1"/>

      <!-- Cathode Flat Anvil & Post internal reflection -->
      <path d="M 23 44 L 26 34 L 34 34 L 36 44" fill="none" stroke="#f8fafc" stroke-width="1.2" opacity="${isOn ? '0.85' : '0.3'}"/>

      <!-- Specular Highlight -->
      <ellipse cx="25" cy="24" rx="4" ry="7" transform="rotate(-30 25 24)" fill="#ffffff" opacity="${isOn ? '0.7' : '0.25'}"/>
    </g>
  `;
}

function renderResistorSVG(props) {
  const ohms = props.resistance || 220;
  const bands = getResistorBands(ohms);

  return `
    <g class="resistor-art">
      <!-- Leads -->
      <line x1="5" y1="17.5" x2="20" y2="17.5" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="60" y1="17.5" x2="75" y2="17.5" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>

      <!-- Ceramic Resistor Body -->
      <rect x="20" y="8" width="40" height="19" rx="7" fill="#d97706" stroke="#b45309" stroke-width="1"/>
      <path d="M 23 8 C 21 12 21 23 23 27 L 57 27 C 59 23 59 12 57 8 Z" fill="#eab308" opacity="0.6"/>

      <!-- Color Bands -->
      <rect x="26" y="8" width="4" height="19" fill="${bands[0]}"/>
      <rect x="34" y="9" width="4" height="17" fill="${bands[1]}"/>
      <rect x="42" y="9" width="4" height="17" fill="${bands[2]}"/>
      <rect x="51" y="8" width="4" height="19" fill="${bands[3]}"/> <!-- Tolerance Gold -->

      <!-- Value text below -->
      <text x="40" y="34" fill="#cbd5e1" font-size="7.5" font-family="'Segoe UI', monospace" font-weight="bold" text-anchor="middle">${formatOhms(ohms)}</text>
    </g>
  `;
}

function getResistorBands(val) {
  const colorMap = ['#000000', '#78350f', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#64748b', '#ffffff'];
  const gold = '#ca8a04';

  const str = val.toString();
  const d1 = parseInt(str[0]) || 2;
  const d2 = parseInt(str[1]) || 2;
  const zeros = Math.max(0, str.length - 2);

  return [colorMap[d1] || '#ef4444', colorMap[d2] || '#ef4444', colorMap[zeros] || '#78350f', gold];
}

function formatOhms(r) {
  if (r >= 1000000) return (r / 1000000) + ' MΩ';
  if (r >= 1000) return (r / 1000) + ' kΩ';
  return r + ' Ω';
}

function renderPushButtonSVG(props) {
  const isPressed = !!props.isPressed;

  return `
    <g class="pushbutton-art" style="cursor: pointer;">
      <!-- Corner Solder Terminals -->
      <rect x="7" y="10" width="8" height="10" rx="1" fill="#94a3b8"/>
      <rect x="7" y="40" width="8" height="10" rx="1" fill="#94a3b8"/>
      <rect x="45" y="10" width="8" height="10" rx="1" fill="#94a3b8"/>
      <rect x="45" y="40" width="8" height="10" rx="1" fill="#94a3b8"/>

      <!-- Outer Switch Base (Black Plastic) -->
      <rect x="12" y="12" width="36" height="36" rx="4" fill="#1e293b" stroke="#475569" stroke-width="1.5"/>
      
      <!-- Metal Bezel -->
      <circle cx="30" cy="30" r="14" fill="#64748b" stroke="#94a3b8" stroke-width="1"/>

      <!-- Center Button Plunger (Depresses on click) -->
      <circle cx="30" cy="30" r="${isPressed ? 9 : 10.5}" fill="${isPressed ? '#2563eb' : '#0f172a'}" stroke="#38bdf8" stroke-width="${isPressed ? 2 : 1}"/>
      <text x="30" y="58" fill="#94a3b8" font-size="7" font-family="sans-serif" text-anchor="middle">PUSH</text>
    </g>
  `;
}

function renderPotentiometerSVG(props) {
  const val = typeof props.value === 'number' ? props.value : 0.5; // 0 to 1
  const angle = -135 + (val * 270); // -135 to +135 deg
  const voltage = (val * 3.3).toFixed(2);

  return `
    <g class="potentiometer-art" style="cursor: pointer;">
      <!-- Body (Blue Enclosure) -->
      <rect x="10" y="8" width="55" height="58" rx="8" fill="#1e3a8a" stroke="#3b82f6" stroke-width="1.5"/>
      <rect x="15" y="13" width="45" height="48" rx="6" fill="#172554"/>

      <!-- Lead terminals -->
      <line x1="15" y1="66" x2="15" y2="80" stroke="#94a3b8" stroke-width="2.5"/>
      <line x1="37.5" y1="66" x2="37.5" y2="80" stroke="#94a3b8" stroke-width="2.5"/>
      <line x1="60" y1="66" x2="60" y2="80" stroke="#94a3b8" stroke-width="2.5"/>

      <!-- Rotary Dial Ring -->
      <circle cx="37.5" cy="37" r="20" fill="#0f172a" stroke="#64748b" stroke-width="1.5"/>
      <circle cx="37.5" cy="37" r="16" fill="#334155"/>

      <!-- Knob Indicator notch (Rotates) -->
      <g transform="rotate(${angle} 37.5 37)">
        <line x1="37.5" y1="37" x2="37.5" y2="23" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
        <circle cx="37.5" cy="24" r="2.5" fill="#38bdf8"/>
      </g>

      <!-- Voltage readout label -->
      <text x="37.5" y="5" fill="#38bdf8" font-size="8" font-family="'Courier New', monospace" font-weight="bold" text-anchor="middle">${voltage}V</text>
    </g>
  `;
}

function renderOledSVG(props, compId) {
  return `
    <g class="oled-art">
      <!-- Blue PCB base -->
      <rect x="10" y="2" width="120" height="94" rx="6" fill="#0369a1" stroke="#0284c7" stroke-width="1.5"/>

      <!-- Header pins at top -->
      <rect x="20" y="4" width="90" height="12" rx="2" fill="#0f172a"/>
      <text x="30" y="24" fill="#e0f2fe" font-size="6" font-family="sans-serif" text-anchor="middle">GND</text>
      <text x="55" y="24" fill="#e0f2fe" font-size="6" font-family="sans-serif" text-anchor="middle">VCC</text>
      <text x="80" y="24" fill="#e0f2fe" font-size="6" font-family="sans-serif" text-anchor="middle">SCL</text>
      <text x="105" y="24" fill="#e0f2fe" font-size="6" font-family="sans-serif" text-anchor="middle">SDA</text>

      <!-- Glass OLED Display Bezel -->
      <rect x="16" y="28" width="108" height="62" rx="3" fill="#0a0a0c" stroke="#1e293b" stroke-width="1"/>
      
      <!-- Embedded Canvas for OLED pixels -->
      <foreignObject x="18" y="30" width="104" height="58">
        <canvas id="oled-canvas-${compId}" width="128" height="64" 
                style="width: 104px; height: 58px; background: #000000; border-radius: 2px; image-rendering: pixelated; display: block;"></canvas>
      </foreignObject>
    </g>
  `;
}

function renderDHT22SVG(props, compId) {
  const temp = (props.temperature !== undefined ? props.temperature : 24.5).toFixed(1);
  const hum = (props.humidity !== undefined ? props.humidity : 48).toFixed(0);

  return `
    <g class="dht22-art">
      <!-- White Sensor Plastic Body -->
      <rect x="10" y="5" width="60" height="85" rx="5" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
      
      <!-- Sensor Grille / Mesh -->
      <rect x="16" y="12" width="48" height="35" rx="3" fill="#e2e8f0"/>
      <!-- Grille slots -->
      <line x1="20" y1="20" x2="60" y2="20" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="20" y1="26" x2="60" y2="26" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="20" y1="32" x2="60" y2="32" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="20" y1="38" x2="60" y2="38" stroke="#94a3b8" stroke-width="1.5"/>

      <!-- DHT22 Silkscreen -->
      <text x="40" y="56" fill="#1e293b" font-size="8" font-family="'Segoe UI', sans-serif" font-weight="bold" text-anchor="middle">DHT22</text>
      
      <!-- Interactive readout badges -->
      <text x="40" y="69" fill="#ef4444" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">${temp}°C</text>
      <text x="40" y="80" fill="#0284c7" font-size="7.5" font-family="monospace" font-weight="bold" text-anchor="middle">${hum}% RH</text>

      <!-- Pin leads -->
      <line x1="20" y1="90" x2="20" y2="100" stroke="#94a3b8" stroke-width="2"/>
      <line x1="40" y1="90" x2="40" y2="100" stroke="#94a3b8" stroke-width="2"/>
      <line x1="60" y1="90" x2="60" y2="100" stroke="#94a3b8" stroke-width="2"/>
    </g>
  `;
}

function renderServoSVG(props) {
  const angle = typeof props.angle === 'number' ? props.angle : 90; // 0 to 180
  const hornRot = angle - 90; // -90 to +90 relative to upright

  return `
    <g class="servo-art">
      <!-- Blue Translucent Servo Case -->
      <rect x="15" y="15" width="60" height="70" rx="4" fill="#0284c7" stroke="#0369a1" stroke-width="1.5"/>
      <rect x="8" y="32" width="74" height="8" rx="1.5" fill="#0369a1"/>
      <circle cx="11" cy="36" r="2" fill="#e0f2fe"/>
      <circle cx="79" cy="36" r="2" fill="#e0f2fe"/>

      <text x="45" y="68" fill="#e0f2fe" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">SG90 9g</text>
      <text x="45" y="78" fill="#38bdf8" font-size="7.5" font-family="monospace" text-anchor="middle">${Math.round(angle)}°</text>

      <!-- Rotating Gear Shaft & White Horn -->
      <g transform="translate(45, 25)">
        <circle cx="0" cy="0" r="10" fill="#1e293b"/>
        <!-- Horn -->
        <g transform="rotate(${hornRot})">
          <path d="M -4 0 L -2 -22 A 4 4 0 0 1 2 -22 L 4 0 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="0.8"/>
          <circle cx="0" cy="-18" r="1.5" fill="#0f172a"/>
          <circle cx="0" cy="-12" r="1.5" fill="#0f172a"/>
          <circle cx="0" cy="-6" r="1.5" fill="#0f172a"/>
          <circle cx="0" cy="0" r="4.5" fill="#94a3b8"/>
          <circle cx="0" cy="0" r="2" fill="#0f172a"/>
        </g>
      </g>

      <!-- Lead Wires -->
      <line x1="25" y1="85" x2="25" y2="95" stroke="#78350f" stroke-width="2.5"/> <!-- Brown GND -->
      <line x1="45" y1="85" x2="45" y2="95" stroke="#dc2626" stroke-width="2.5"/> <!-- Red 5V -->
      <line x1="65" y1="85" x2="65" y2="95" stroke="#f97316" stroke-width="2.5"/> <!-- Orange PWM -->
    </g>
  `;
}

function renderNeoPixelStripSVG(props) {
  const pixels = props.pixels || [
    [0,0,0], [0,0,0], [0,0,0], [0,0,0],
    [0,0,0], [0,0,0], [0,0,0], [0,0,0]
  ];

  const ledsSvg = pixels.map((rgb, i) => {
    const [r, g, b] = rgb;
    const isLit = (r > 0 || g > 0 || b > 0);
    const colorHex = `rgb(${r}, ${g}, ${b})`;
    const xPos = 55 + (i * 20);

    return `
      <!-- WS2812 SMD 5050 LED #${i} -->
      <rect x="${xPos - 7}" y="15" width="14" height="14" rx="2" fill="#ffffff" stroke="#94a3b8" stroke-width="0.6"/>
      <circle cx="${xPos}" cy="22" r="4.5" fill="${isLit ? colorHex : '#334155'}" 
              filter="${isLit ? 'url(#blur-glow)' : 'none'}"/>
      <circle cx="${xPos}" cy="22" r="2" fill="${isLit ? '#ffffff' : '#1e293b'}" opacity="0.8"/>
    `;
  }).join('');

  return `
    <g class="neopixel-art">
      <!-- Black Strip PCB -->
      <rect x="5" y="8" width="210" height="30" rx="3" fill="#0f172a" stroke="#334155" stroke-width="1.2"/>
      <text x="110" y="34" fill="#64748b" font-size="6" font-family="monospace" text-anchor="middle">WS2812B 8-Pixel Strip</text>

      ${ledsSvg}

      <!-- Terminal labels -->
      <text x="15" y="36" fill="#94a3b8" font-size="5" font-family="sans-serif">GND</text>
      <text x="30" y="36" fill="#38bdf8" font-size="5" font-family="sans-serif">DIN</text>
      <text x="45" y="36" fill="#ef4444" font-size="5" font-family="sans-serif">5V</text>
    </g>
  `;
}

function renderBuzzerSVG(props) {
  const isSounding = !!props.isSounding;
  const freq = props.frequency || 0;

  return `
    <g class="buzzer-art">
      <!-- Terminal Leads -->
      <line x1="22" y1="58" x2="22" y2="70" stroke="#94a3b8" stroke-width="2.5"/>
      <line x1="43" y1="58" x2="43" y2="70" stroke="#94a3b8" stroke-width="2.5"/>

      <!-- Buzzer Cylinder Body -->
      <circle cx="32.5" cy="30" r="26" fill="#090d16" stroke="#334155" stroke-width="1.5"/>
      <circle cx="32.5" cy="30" r="22" fill="#1e293b"/>
      
      <!-- Top Sound Hole -->
      <circle cx="32.5" cy="30" r="6" fill="#030712" stroke="#475569" stroke-width="1"/>

      <!-- Polarity Marker (+) -->
      <text x="22" y="24" fill="#ef4444" font-size="10" font-family="sans-serif" font-weight="bold">+</text>

      <!-- Sound Waves if Sounding -->
      ${isSounding ? `
        <path d="M 45 18 A 20 20 0 0 1 54 36" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
        <path d="M 50 12 A 28 28 0 0 1 62 38" fill="none" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
        <text x="32.5" y="52" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">${freq}Hz</text>
      ` : ''}
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// PASSIVE COMPONENTS
// ════════════════════════════════════════════════════════════════════════════════════════

function renderCapacitorSVG(props) {
  return `
    <g class="capacitor-art">
      <line x1="5" y1="15" x2="20" y2="15" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="30" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="20" y="10" width="3" height="10" fill="#94a3b8"/>
      <rect x="27" y="10" width="3" height="10" fill="#94a3b8"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">C</text>
    </g>
  `;
}

function renderInductorSVG(props) {
  return `
    <g class="inductor-art">
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round"/>
      <path d="M 15 15 Q 18 5 21 15 Q 24 5 27 15 Q 30 5 33 15 Q 36 5 39 15" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">L</text>
    </g>
  `;
}

function renderTransformerSVG(props) {
  return `
    <g class="transformer-art">
      <line x1="5" y1="10" x2="15" y2="10" stroke="#94a3b8" stroke-width="2"/>
      <line x1="5" y1="20" x2="15" y2="20" stroke="#94a3b8" stroke-width="2"/>
      <line x1="35" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2"/>
      <line x1="35" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2"/>
      <rect x="15" y="5" width="10" height="20" fill="#94a3b8" opacity="0.3"/>
      <rect x="25" y="5" width="10" height="20" fill="#94a3b8" opacity="0.3"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">TR</text>
    </g>
  `;
}

function renderCrystalSVG(props) {
  return `
    <g class="crystal-art">
      <line x1="5" y1="15" x2="20" y2="15" stroke="#94a3b8" stroke-width="2"/>
      <line x1="30" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2"/>
      <rect x="18" y="8" width="14" height="14" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <line x1="20" y1="12" x2="30" y2="12" stroke="#94a3b8" stroke-width="1"/>
      <line x1="20" y1="18" x2="30" y2="18" stroke="#94a3b8" stroke-width="1"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">Xtal</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SEMICONDUCTORS - DIODES
// ════════════════════════════════════════════════════════════════════════════════════════

function renderDiodeSVG(props) {
  return `
    <g class="diode-art">
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 10 L 25 15 L 15 20 Z" fill="#94a3b8"/>
      <line x1="25" y1="10" x2="25" y2="20" stroke="#475569" stroke-width="2"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">D</text>
    </g>
  `;
}

function renderZenerSVG(props) {
  return `
    <g class="zener-art">
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 10 L 25 15 L 15 20 Z" fill="#94a3b8"/>
      <path d="M 25 10 L 23 13 L 27 13 L 25 10 Z M 25 17 L 23 14 L 27 14 L 25 17 Z" fill="none" stroke="#475569" stroke-width="1.5"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">Z</text>
    </g>
  `;
}

function renderSchottkySVG(props) {
  return `
    <g class="schottky-art">
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 10 L 25 15 L 15 20 Z" fill="#94a3b8"/>
      <path d="M 25 10 L 22 13 L 25 16 L 22 19 L 25 20" fill="none" stroke="#475569" stroke-width="1.5"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">S</text>
    </g>
  `;
}

function renderTvsDiodeSVG(props) {
  return `
    <g class="tvs-art">
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 10 L 25 15 L 15 20 Z" fill="#94a3b8"/>
      <line x1="25" y1="10" x2="25" y2="20" stroke="#475569" stroke-width="2"/>
      <circle cx="25" cy="15" r="3" fill="none" stroke="#ef4444" stroke-width="1"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">TVS</text>
    </g>
  `;
}

function renderPhotodiodeSVG(props) {
  return `
    <g class="photodiode-art">
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 10 L 25 15 L 15 20 Z" fill="#94a3b8"/>
      <line x1="25" y1="10" x2="25" y2="20" stroke="#475569" stroke-width="2"/>
      <path d="M 18 5 L 22 5 M 18 25 L 22 25" stroke="#fbbf24" stroke-width="2"/>
      <text x="25" y="28" fill="#fbbf24" font-size="7" font-family="monospace" text-anchor="middle">PD</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SEMICONDUCTORS - TRANSISTORS
// ════════════════════════════════════════════════════════════════════════════════════════

function renderBjtNpnSVG(props) {
  return `
    <g class="bjt-art">
      <circle cx="25" cy="15" r="10" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 25 5 L 25 10 M 25 20 L 25 25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="15" y1="15" x2="20" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 20 15 Q 25 12 30 15" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="18" y="12" fill="#94a3b8" font-size="7" font-family="monospace">B</text>
      <text x="25" y="4" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">C</text>
      <text x="25" y="26" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">E</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">NPN</text>
    </g>
  `;
}

function renderBjtPnpSVG(props) {
  return `
    <g class="bjt-art">
      <circle cx="25" cy="15" r="10" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 25 5 L 25 10 M 25 20 L 25 25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="15" y1="15" x2="20" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 30 15 Q 25 18 20 15" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="18" y="12" fill="#94a3b8" font-size="7" font-family="monospace">E</text>
      <text x="25" y="4" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">C</text>
      <text x="25" y="26" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">B</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">PNP</text>
    </g>
  `;
}

function renderNmosSVG(props) {
  return `
    <g class="mos-art">
      <line x1="5" y1="10" x2="15" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="15" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="5" x2="45" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="25" x2="45" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 8 L 22 8 Q 25 15 22 22 L 15 22 Z" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="25" y1="15" x2="30" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="10" y="8" fill="#94a3b8" font-size="7" font-family="monospace">G</text>
      <text x="48" y="5" fill="#94a3b8" font-size="7" font-family="monospace">D</text>
      <text x="48" y="25" fill="#94a3b8" font-size="7" font-family="monospace">S</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">NMOS</text>
    </g>
  `;
}

function renderPmosSVG(props) {
  return `
    <g class="mos-art">
      <line x1="5" y1="10" x2="15" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="15" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="5" x2="45" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="25" x2="45" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 8 L 22 8 Q 25 15 22 22 L 15 22 Z" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 18 10 L 20 13 L 18 16" fill="none" stroke="#94a3b8" stroke-width="1"/>
      <line x1="25" y1="15" x2="30" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="10" y="8" fill="#94a3b8" font-size="7" font-family="monospace">G</text>
      <text x="48" y="5" fill="#94a3b8" font-size="7" font-family="monospace">S</text>
      <text x="48" y="25" fill="#94a3b8" font-size="7" font-family="monospace">D</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">PMOS</text>
    </g>
  `;
}

function renderIgbtSVG(props) {
  return `
    <g class="igbt-art">
      <line x1="5" y1="10" x2="15" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="15" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="5" x2="45" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="25" x2="45" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <rect x="15" y="8" width="10" height="14" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 20 15 L 25 15" stroke="#94a3b8" stroke-width="2"/>
      <text x="10" y="8" fill="#94a3b8" font-size="7" font-family="monospace">G</text>
      <text x="48" y="5" fill="#94a3b8" font-size="7" font-family="monospace">C</text>
      <text x="48" y="25" fill="#94a3b8" font-size="7" font-family="monospace">E</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">IGBT</text>
    </g>
  `;
}

function renderScrSVG(props) {
  return `
    <g class="scr-art">
      <line x1="5" y1="10" x2="15" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="25" y1="20" x2="25" y2="30" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 15 Q 25 5 35 15" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 35 15 Q 25 25 15 15" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="10" y="8" fill="#94a3b8" font-size="7" font-family="monospace">G</text>
      <text x="48" y="10" fill="#94a3b8" font-size="7" font-family="monospace">A</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">K</text>
      <text x="25" y="31" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">SCR</text>
    </g>
  `;
}

function renderTriacSVG(props) {
  return `
    <g class="triac-art">
      <line x1="5" y1="10" x2="15" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="25" y1="20" x2="25" y2="30" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 15 Q 25 5 35 15" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 35 15 Q 25 25 15 15" fill="none" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="10" y="8" fill="#94a3b8" font-size="7" font-family="monospace">G</text>
      <text x="48" y="10" fill="#94a3b8" font-size="7" font-family="monospace">MT1</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">MT2</text>
      <text x="25" y="31" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">TRIAC</text>
    </g>
  `;
}

function renderOptocouplerSVG(props) {
  return `
    <g class="optocoupler-art">
      <line x1="5" y1="8" x2="15" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="22" x2="15" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="55" y1="8" x2="65" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="55" y1="22" x2="65" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <rect x="15" y="5" width="10" height="20" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="20" cy="15" r="3" fill="#ef4444" opacity="0.6"/>
      <rect x="55" y="5" width="10" height="20" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <circle cx="60" cy="15" r="3" fill="#22c55e" opacity="0.6"/>
      <text x="30" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">ISO</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SEMICONDUCTORS - ICs
// ════════════════════════════════════════════════════════════════════════════════════════

function renderOpampSVG(props) {
  return `
    <g class="opamp-art">
      <path d="M 15 5 L 35 15 L 15 25 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="5" y1="8" x2="15" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="22" x2="15" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="2" x2="25" y2="2" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="28" x2="25" y2="28" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="12" y="6" fill="#94a3b8" font-size="7" font-family="monospace">IN+</text>
      <text x="12" y="24" fill="#94a3b8" font-size="7" font-family="monospace">IN-</text>
      <text x="48" y="15" fill="#94a3b8" font-size="7" font-family="monospace">OUT</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">OP-AMP</text>
    </g>
  `;
}

function renderComparatorSVG(props) {
  return `
    <g class="comparator-art">
      <path d="M 15 5 L 35 15 L 15 25 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="5" y1="8" x2="15" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="22" x2="15" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="12" y="6" fill="#94a3b8" font-size="7" font-family="monospace">IN+</text>
      <text x="12" y="24" fill="#94a3b8" font-size="7" font-family="monospace">IN-</text>
      <text x="48" y="15" fill="#94a3b8" font-size="7" font-family="monospace">OUT</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">COMP</text>
    </g>
  `;
}

function renderTimer555SVG(props) {
  return `
    <g class="timer555-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="25" x2="10" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="5" x2="45" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="25" x2="45" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="12" x2="10" y2="12" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="18" x2="10" y2="18" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="12" x2="45" y2="12" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="18" x2="45" y2="18" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="12" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">555</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">TIMER</text>
    </g>
  `;
}

function renderLogicGateSVG(props) {
  return `
    <g class="logicgate-art">
      <path d="M 15 5 L 25 10 L 15 15 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="5" y1="8" x2="15" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="22" x2="15" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="25" y1="15" x2="35" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="12" y="6" fill="#94a3b8" font-size="7" font-family="monospace">A</text>
      <text x="12" y="24" fill="#94a3b8" font-size="7" font-family="monospace">B</text>
      <text x="38" y="15" fill="#94a3b8" font-size="7" font-family="monospace">Y</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">GATE</text>
    </g>
  `;
}

function renderAdcSVG(props) {
  return `
    <g class="adc-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="15" y1="2" x2="20" y2="2" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="15" y1="28" x2="20" y2="28" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="12" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">ADC</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">DIGITAL</text>
    </g>
  `;
}

function renderDacSVG(props) {
  return `
    <g class="dac-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="15" y1="2" x2="20" y2="2" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="15" y1="28" x2="20" y2="28" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="12" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">DAC</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">ANALOG</text>
    </g>
  `;
}

function renderMcuSVG(props) {
  return `
    <g class="mcu-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="25" y="14" fill="#38bdf8" font-size="8" font-family="monospace" text-anchor="middle">MCU</text>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="25" x2="10" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="25" y1="2" x2="30" y2="2" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">MICRO</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// ELECTROMECHANICAL
// ════════════════════════════════════════════════════════════════════════════════════════

function renderSwitchSVG(props) {
  const isClosed = !!props.isClosed;
  return `
    <g class="switch-art" style="cursor: pointer;">
      <line x1="5" y1="15" x2="20" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="30" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="15" x2="${isClosed ? 30 : 25}" y2="${isClosed ? 15 : 5}" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      <circle cx="20" cy="15" r="3" fill="#94a3b8"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">${isClosed ? 'CLOSED' : 'OPEN'}</text>
    </g>
  `;
}

function renderRelaySVG(props) {
  const isEnergized = !!props.isEnergized;
  return `
    <g class="relay-art">
      <circle cx="20" cy="15" r="8" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="20" y="18" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">COIL</text>
      <rect x="30" y="8" width="15" height="14" rx="1" fill="#1e293b" stroke="#94a3b8" stroke-width="1"/>
      <line x1="20" y1="15" x2="30" y2="${isEnergized ? 8 : 15}" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      <line x1="45" y1="10" x2="55" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="45" y1="20" x2="55" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="50" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">RELAY</text>
    </g>
  `;
}

function renderSsrSVG(props) {
  return `
    <g class="ssr-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="15" cy="15" r="3" fill="#ef4444" opacity="0.6"/>
      <circle cx="25" cy="15" r="3" fill="#22c55e" opacity="0.6"/>
      <line x1="5" y1="8" x2="10" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="22" x2="10" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="8" x2="45" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="22" x2="45" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">SSR</text>
    </g>
  `;
}

function renderContactorSVG(props) {
  return `
    <g class="contactor-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="25" x2="10" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="5" x2="45" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="25" x2="45" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="14" fill="#38bdf8" font-size="8" font-family="monospace" text-anchor="middle">CONT</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">3-POLE</text>
    </g>
  `;
}

function renderSolenoidSVG(props) {
  return `
    <g class="solenoid-art">
      <rect x="15" y="5" width="20" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 25 15 L 35 15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 25 5 L 20 10 L 25 15 M 25 25 L 20 20 L 25 15" fill="none" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">SOLENOID</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// MOTORS
// ════════════════════════════════════════════════════════════════════════════════════════

function renderDcMotorSVG(props) {
  return `
    <g class="dcmotor-art">
      <circle cx="25" cy="15" r="10" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 25 10 L 28 14 L 25 18 L 22 14 Z" fill="#38bdf8"/>
      <line x1="5" y1="10" x2="15" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">DC MOTOR</text>
    </g>
  `;
}

function renderStepperMotorSVG(props) {
  return `
    <g class="steppermotor-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="25" cy="15" r="6" fill="#334155"/>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="25" x2="10" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="5" x2="45" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="25" x2="45" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">STEPPER</text>
    </g>
  `;
}

function renderEncoderSVG(props) {
  return `
    <g class="encoder-art">
      <circle cx="25" cy="15" r="10" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="25" cy="15" r="6" fill="#0f172a"/>
      <path d="M 25 5 L 25 8 M 25 22 L 25 25 M 15 15 L 12 15 M 38 15 L 35 15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">ENCODER</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// POWER
// ════════════════════════════════════════════════════════════════════════════════════════

function renderBatterySVG(props) {
  return `
    <g class="battery-art">
      <rect x="5" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="35" y="10" width="5" height="10" fill="#94a3b8"/>
      <rect x="10" y="8" width="6" height="4" fill="#ef4444" opacity="0.8"/>
      <rect x="10" y="18" width="6" height="4" fill="#22c55e" opacity="0.8"/>
      <text x="20" y="13" fill="#94a3b8" font-size="6" font-family="monospace" text-anchor="middle">+</text>
      <text x="20" y="23" fill="#94a3b8" font-size="6" font-family="monospace" text-anchor="middle">-</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">BATT</text>
    </g>
  `;
}

function renderBmsSVG(props) {
  return `
    <g class="bms-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="25" y="14" fill="#22c55e" font-size="8" font-family="monospace" text-anchor="middle">BMS</text>
      <line x1="5" y1="8" x2="10" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="22" x2="10" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="8" x2="45" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="22" x2="45" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">BATTERY MGMT</text>
    </g>
  `;
}

function renderSolarPanelSVG(props) {
  return `
    <g class="solar-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 12 8 L 28 8 M 12 22 L 28 22 M 15 5 L 15 25 M 23 5 L 23 25" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
      <text x="25" y="14" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">SOLAR</text>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">PV</text>
    </g>
  `;
}

function renderAcDcAdapterSVG(props) {
  return `
    <g class="adapter-art">
      <rect x="5" y="8" width="20" height="14" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 5 8 L 25 8 M 5 22 L 25 22" stroke="#94a3b8" stroke-width="1" opacity="0.5"/>
      <text x="15" y="16" fill="#94a3b8" font-size="6" font-family="monospace" text-anchor="middle">AC-DC</text>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">ADAPTER</text>
    </g>
  `;
}

function renderLinearRegulatorSVG(props) {
  return `
    <g class="regulator-art">
      <path d="M 15 5 L 25 15 L 15 25 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="25" y1="5" x2="30" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">LDO</text>
    </g>
  `;
}

function renderBuckConverterSVG(props) {
  return `
    <g class="buck-art">
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 10 L 25 15 L 15 20 Z" fill="#94a3b8"/>
      <line x1="25" y1="10" x2="25" y2="20" stroke="#475569" stroke-width="2"/>
      <line x1="25" y1="15" x2="35" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <rect x="35" y="10" width="3" height="10" fill="#94a3b8"/>
      <line x1="38" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">BUCK</text>
    </g>
  `;
}

function renderBoostConverterSVG(props) {
  return `
    <g class="boost-art">
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="15" y1="10" x2="15" y2="20" stroke="#94a3b8" stroke-width="2"/>
      <path d="M 15 15 Q 25 5 35 15" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <rect x="25" y="8" width="3" height="14" fill="#94a3b8"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">BOOST</text>
    </g>
  `;
}

function renderBuckBoostSVG(props) {
  return `
    <g class="buckboost-art">
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <path d="M 15 10 Q 25 2 35 10" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <line x1="35" y1="10" x2="35" y2="20" stroke="#94a3b8" stroke-width="2"/>
      <path d="M 35 20 Q 45 28 45 20" fill="none" stroke="#94a3b8" stroke-width="2"/>
      <line x1="45" y1="15" x2="55" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">BUCK-BOOST</text>
    </g>
  `;
}

function renderInverterSVG(props) {
  return `
    <g class="inverter-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 15 15 Q 25 5 35 15" fill="none" stroke="#38bdf8" stroke-width="1.5" opacity="0.6"/>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="50" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="14" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">DC-AC</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">INVERTER</text>
    </g>
  `;
}

function renderUpsSVG(props) {
  return `
    <g class="ups-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="15" cy="15" r="4" fill="#22c55e"/>
      <text x="25" y="14" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">UPS</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">UPS</text>
    </g>
  `;
}

function renderMpptSVG(props) {
  return `
    <g class="mppt-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 12 8 L 28 8 M 12 22 L 28 22" stroke="#38bdf8" stroke-width="1" opacity="0.6"/>
      <text x="25" y="14" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">MPPT</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">MPPT</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SWITCHGEAR
// ════════════════════════════════════════════════════════════════════════════════════════

function renderMcbSVG(props) {
  return `
    <g class="mcb-art">
      <rect x="15" y="5" width="10" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="17" y="8" width="6" height="4" fill="#38bdf8"/>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="25" y1="15" x2="35" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="20" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">MCB</text>
    </g>
  `;
}

function renderMccbSVG(props) {
  return `
    <g class="mccb-art">
      <rect x="10" y="5" width="20" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="15" y="8" width="10" height="4" fill="#38bdf8"/>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="30" y1="15" x2="35" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="20" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">MCCB</text>
    </g>
  `;
}

function renderRccbSVG(props) {
  return `
    <g class="rccb-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="15" cy="15" r="3" fill="#ef4444"/>
      <circle cx="25" cy="15" r="3" fill="#22c55e"/>
      <text x="25" y="14" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">RCCB</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">RCBO</text>
    </g>
  `;
}

function renderIsolatorSVG(props) {
  return `
    <g class="isolator-art">
      <line x1="5" y1="15" x2="20" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="20" y1="10" x2="20" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="30" y1="10" x2="30" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="30" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">ISOLATOR</text>
    </g>
  `;
}

function renderChangeoverSVG(props) {
  return `
    <g class="changeover-art">
      <line x1="5" y1="10" x2="15" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="15" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="15" y1="10" x2="15" y2="20" stroke="#94a3b8" stroke-width="2"/>
      <line x1="15" y1="15" x2="35" y2="15" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="5" x2="45" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="25" x2="45" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">CHANGEOVER</text>
    </g>
  `;
}

function renderMotorStarterSVG(props) {
  return `
    <g class="starter-art">
      <circle cx="20" cy="15" r="8" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <line x1="20" y1="15" x2="28" y2="15" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="25" x2="45" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="20" y="18" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">S</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">MOTOR STARTER</text>
    </g>
  `;
}

function renderVfdSVG(props) {
  return `
    <g class="vfd-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <text x="25" y="14" fill="#38bdf8" font-size="8" font-family="monospace" text-anchor="middle">VFD</text>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">VFD</text>
    </g>
  `;
}

function renderBusbarSVG(props) {
  return `
    <g class="busbar-art">
      <rect x="5" y="8" width="40" height="14" rx="1" fill="#94a3b8" opacity="0.3"/>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="15" y1="23" x2="20" y2="23" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="25" y1="23" x2="30" y2="23" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">BUSBAR</text>
    </g>
  `;
}

function renderCtSVG(props) {
  return `
    <g class="ct-art">
      <circle cx="25" cy="15" r="10" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <path d="M 25 5 L 25 10 M 25 20 L 25 25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">CT</text>
    </g>
  `;
}

function renderEnergyMeterSVG(props) {
  return `
    <g class="meter-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <circle cx="25" cy="15" r="6" fill="#38bdf8" opacity="0.3"/>
      <text x="25" y="15" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">kWh</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">ENERGY METER</text>
    </g>
  `;
}

function renderSpdSVG(props) {
  return `
    <g class="spd-art">
      <path d="M 15 10 L 25 5 L 35 10" fill="none" stroke="#ef4444" stroke-width="2" stroke-linejoin="round"/>
      <line x1="25" y1="10" x2="25" y2="20" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">SPD</text>
    </g>
  `;
}

function renderEarthingSVG(props) {
  return `
    <g class="earthing-art">
      <path d="M 25 5 L 25 15 M 20 15 L 30 15 M 17 17 L 33 17 M 14 19 L 36 19" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">EARTH</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// SENSORS
// ════════════════════════════════════════════════════════════════════════════════════════

function renderTempSensorSVG(props) {
  return `
    <g class="sensor-art">
      <rect x="15" y="5" width="20" height="20" rx="3" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
      <path d="M 20 25 L 25 20 L 30 25" fill="none" stroke="#ef4444" stroke-width="2" stroke-linejoin="round"/>
      <text x="25" y="13" fill="#ef4444" font-size="8" font-family="monospace" text-anchor="middle">TEMP</text>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">TEMP SENSOR</text>
    </g>
  `;
}

function renderHumiditySensorSVG(props) {
  return `
    <g class="sensor-art">
      <rect x="15" y="5" width="20" height="20" rx="3" fill="#1e293b" stroke="#22c55e" stroke-width="1.5"/>
      <path d="M 20 25 L 25 20 L 30 25" fill="none" stroke="#22c55e" stroke-width="2" stroke-linejoin="round"/>
      <text x="25" y="13" fill="#22c55e" font-size="8" font-family="monospace" text-anchor="middle">HUM</text>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#22c55e" font-size="7" font-family="monospace" text-anchor="middle">HUMIDITY</text>
    </g>
  `;
}

function renderPirSensorSVG(props) {
  return `
    <g class="sensor-art">
      <rect x="10" y="8" width="30" height="14" rx="4" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <path d="M 15 15 Q 25 8 35 15" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.6"/>
      <text x="25" y="14" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">PIR</text>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">PIR MOTION</text>
    </g>
  `;
}

function renderUltrasonicSVG(props) {
  return `
    <g class="sensor-art">
      <rect x="15" y="5" width="20" height="20" rx="3" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/>
      <circle cx="20" cy="15" r="4" fill="#fbbf24" opacity="0.5"/>
      <circle cx="30" cy="15" r="4" fill="#fbbf24" opacity="0.5"/>
      <text x="25" y="13" fill="#fbbf24" font-size="8" font-family="monospace" text-anchor="middle">US</text>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#fbbf24" font-size="7" font-family="monospace" text-anchor="middle">ULTRASONIC</text>
    </g>
  `;
}

function renderGasSensorSVG(props) {
  return `
    <g class="sensor-art">
      <rect x="15" y="5" width="20" height="20" rx="3" fill="#1e293b" stroke="#f97316" stroke-width="1.5"/>
      <path d="M 20 20 Q 25 10 30 20" fill="none" stroke="#f97316" stroke-width="2" opacity="0.6"/>
      <text x="25" y="13" fill="#f97316" font-size="8" font-family="monospace" text-anchor="middle">GAS</text>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#f97316" font-size="7" font-family="monospace" text-anchor="middle">GAS SENSOR</text>
    </g>
  `;
}

function renderLoadCellSVG(props) {
  return `
    <g class="sensor-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/>
      <path d="M 15 15 L 25 5 L 35 15 L 25 25 Z" fill="none" stroke="#a855f7" stroke-width="1.5"/>
      <text x="25" y="14" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">LOAD</text>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">LOAD CELL</text>
    </g>
  `;
}

function renderAccelerometerSVG(props) {
  return `
    <g class="sensor-art">
      <rect x="12" y="8" width="26" height="14" rx="2" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <path d="M 15 15 L 25 25 L 35 15" fill="none" stroke="#38bdf8" stroke-width="2"/>
      <text x="25" y="13" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">IMU</text>
      <line x1="5" y1="15" x2="12" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="38" y1="15" x2="43" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">ACCELEROMETER</text>
    </g>
  `;
}

function renderCurrentSensorSVG(props) {
  return `
    <g class="sensor-art">
      <circle cx="25" cy="15" r="10" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
      <path d="M 25 5 L 25 25" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="13" fill="#ef4444" font-size="8" font-family="monospace" text-anchor="middle">I</text>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="25" x2="10" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">CURRENT SENSOR</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMMUNICATION
// ════════════════════════════════════════════════════════════════════════════════════════

function renderUartSVG(props) {
  return `
    <g class="comm-art">
      <rect x="10" y="8" width="30" height="14" rx="2" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <text x="25" y="16" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">UART</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">UART</text>
    </g>
  `;
}

function renderI2cSVG(props) {
  return `
    <g class="comm-art">
      <rect x="10" y="8" width="30" height="14" rx="2" fill="#1e293b" stroke="#22c55e" stroke-width="1.5"/>
      <text x="25" y="16" fill="#22c55e" font-size="7" font-family="monospace" text-anchor="middle">I2C</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">I2C</text>
    </g>
  `;
}

function renderSpiSVG(props) {
  return `
    <g class="comm-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/>
      <text x="25" y="14" fill="#fbbf24" font-size="7" font-family="monospace" text-anchor="middle">SPI</text>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="25" x2="10" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">SPI</text>
    </g>
  `;
}

function renderCanBusSVG(props) {
  return `
    <g class="comm-art">
      <rect x="10" y="10" width="30" height="10" rx="2" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
      <text x="25" y="16" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">CAN</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">CAN BUS</text>
    </g>
  `;
}

function renderRs485SVG(props) {
  return `
    <g class="comm-art">
      <rect x="10" y="10" width="30" height="10" rx="2" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/>
      <text x="25" y="16" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">RS-485</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">RS-485</text>
    </g>
  `;
}

function renderWifiModuleSVG(props) {
  return `
    <g class="comm-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5"/>
      <path d="M 15 15 Q 25 8 35 15" fill="none" stroke="#38bdf8" stroke-width="2" opacity="0.6"/>
      <text x="25" y="14" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">WiFi</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">WiFi MODULE</text>
    </g>
  `;
}

function renderBluetoothSVG(props) {
  return `
    <g class="comm-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/>
      <path d="M 15 15 Q 25 10 35 15" fill="none" stroke="#a855f7" stroke-width="2" opacity="0.6"/>
      <text x="25" y="14" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">BT</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">BLUETOOTH</text>
    </g>
  `;
}

function renderGsmSVG(props) {
  return `
    <g class="comm-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
      <path d="M 20 5 L 20 25 M 10 15 L 30 15" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.6"/>
      <text x="25" y="14" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">GSM</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">GSM/LTE</text>
    </g>
  `;
}

function renderLoraSVG(props) {
  return `
    <g class="comm-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#8b5cf6" stroke-width="1.5"/>
      <path d="M 15 15 Q 25 8 35 15 M 20 20 Q 25 12 30 20" fill="none" stroke="#8b5cf6" stroke-width="2" opacity="0.6"/>
      <text x="25" y="14" fill="#8b5cf6" font-size="7" font-family="monospace" text-anchor="middle">LoRa</text>
      <line x1="5" y1="10" x2="10" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="20" x2="10" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#8b5cf6" font-size="7" font-family="monospace" text-anchor="middle">LoRa</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// COMPUTING
// ════════════════════════════════════════════════════════════════════════════════════════

function renderArduinoBoardSVG(props) {
  return `
    <g class="mcu-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#0f9d58" stroke-width="1.5"/>
      <text x="25" y="14" fill="#0f9d58" font-size="8" font-family="monospace" text-anchor="middle">ARDUINO</text>
      <line x1="5" y1="8" x2="10" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="22" x2="10" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="8" x2="45" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="22" x2="45" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#0f9d58" font-size="7" font-family="monospace" text-anchor="middle">ARDUINO BOARD</text>
    </g>
  `;
}

function renderRaspberryPiSVG(props) {
  return `
    <g class="mcu-art">
      <circle cx="25" cy="15" r="10" fill="#1e293b" stroke="#c51a1a" stroke-width="1.5"/>
      <text x="25" y="18" fill="#c51a1a" font-size="8" font-family="monospace" text-anchor="middle">Pi</text>
      <line x1="5" y1="8" x2="10" y2="8" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="22" x2="10" y2="22" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#c51a1a" font-size="7" font-family="monospace" text-anchor="middle">RASPBERRY PI</text>
    </g>
  `;
}

function renderPlcSVG(props) {
  return `
    <g class="mcu-art">
      <rect x="5" y="5" width="40" height="20" rx="2" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/>
      <text x="25" y="14" fill="#a855f7" font-size="8" font-family="monospace" text-anchor="middle">PLC</text>
      <line x1="5" y1="2" x2="10" y2="2" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="28" x2="10" y2="28" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">PLC</text>
    </g>
  `;
}

function renderHmiSVG(props) {
  return `
    <g class="mcu-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#0f172a" stroke="#38bdf8" stroke-width="1.5"/>
      <rect x="12" y="7" width="26" height="12" rx="1" fill="#020617"/>
      <text x="25" y="14" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">HMI</text>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#38bdf8" font-size="7" font-family="monospace" text-anchor="middle">HMI PANEL</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// CONNECTORS
// ════════════════════════════════════════════════════════════════════════════════════════

function renderWireSVG(props) {
  return `
    <g class="connector-art">
      <line x1="5" y1="15" x2="45" y2="15" stroke="#64748b" stroke-width="4" stroke-linecap="round" opacity="0.6"/>
      <line x1="5" y1="15" x2="45" y2="15" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">WIRE</text>
    </g>
  `;
}

function renderTerminalBlockSVG(props) {
  return `
    <g class="connector-art">
      <rect x="10" y="8" width="30" height="14" rx="1" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <rect x="15" y="5" width="3" height="8" fill="#94a3b8"/>
      <rect x="22" y="5" width="3" height="8" fill="#94a3b8"/>
      <rect x="29" y="5" width="3" height="8" fill="#94a3b8"/>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">TERMINAL</text>
    </g>
  `;
}

function renderUsbConnectorSVG(props) {
  return `
    <g class="connector-art">
      <rect x="10" y="8" width="30" height="14" rx="2" fill="#1e293b" stroke="#fbbf24" stroke-width="1.5"/>
      <rect x="12" y="10" width="6" height="10" rx="1" fill="#fbbf24" opacity="0.3"/>
      <text x="25" y="16" fill="#fbbf24" font-size="7" font-family="monospace" text-anchor="middle">USB</text>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#fbbf24" font-size="7" font-family="monospace" text-anchor="middle">USB CONNECTOR</text>
    </g>
  `;
}

function renderBatteryConnectorSVG(props) {
  return `
    <g class="connector-art">
      <rect x="10" y="10" width="30" height="10" rx="1" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
      <rect x="12" y="10" width="6" height="10" fill="#ef4444" opacity="0.3"/>
      <rect x="22" y="10" width="6" height="10" fill="#22c55e" opacity="0.3"/>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">BATT CONN</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// PROTECTION
// ════════════════════════════════════════════════════════════════════════════════════════

function renderOvercurrentSVG(props) {
  return `
    <g class="protection-art">
      <path d="M 15 10 L 25 5 L 35 10 L 25 20 Z" fill="none" stroke="#ef4444" stroke-width="2" stroke-linejoin="round"/>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">OVERCURRENT</text>
    </g>
  `;
}

function renderOvervoltageSVG(props) {
  return `
    <g class="protection-art">
      <path d="M 15 15 L 25 5 L 35 15" fill="none" stroke="#ef4444" stroke-width="2" stroke-linejoin="round"/>
      <line x1="25" y1="10" x2="25" y2="20" stroke="#ef4444" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">OVERVOLTAGE</text>
    </g>
  `;
}

function renderUvloSVG(props) {
  return `
    <g class="protection-art">
      <path d="M 15 5 L 25 15 L 35 5" fill="none" stroke="#a855f7" stroke-width="2" stroke-linejoin="round"/>
      <line x1="25" y1="10" x2="25" y2="20" stroke="#a855f7" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">UVLO</text>
    </g>
  `;
}

function renderReversePolaritySVG(props) {
  return `
    <g class="protection-art">
      <path d="M 15 10 L 25 15 L 15 20 Z" fill="#ef4444"/>
      <line x1="25" y1="10" x2="25" y2="20" stroke="#475569" stroke-width="2"/>
      <path d="M 25 10 L 35 10 M 25 20 L 35 20" stroke="#475569" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">REVERSE POLARITY</text>
    </g>
  `;
}

function renderThermalProtectionSVG(props) {
  return `
    <g class="protection-art">
      <path d="M 15 10 L 25 5 L 35 10 M 15 20 L 25 25 L 35 20" fill="none" stroke="#f97316" stroke-width="2" stroke-linejoin="round"/>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#f97316" font-size="7" font-family="monospace" text-anchor="middle">THERMAL PROT</text>
    </g>
  `;
}

function renderEmergencyStopSVG(props) {
  return `
    <g class="protection-art">
      <circle cx="25" cy="15" r="10" fill="#ef4444"/>
      <circle cx="25" cy="15" r="6" fill="#1e293b"/>
      <text x="25" y="18" fill="#ffffff" font-size="9" font-family="monospace" font-weight="bold" text-anchor="middle">STOP</text>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">E-STOP</text>
    </g>
  `;
}

// ════════════════════════════════════════════════════════════════════════════════════════
// OUTPUTS / DISPLAYS (additional)
// ════════════════════════════════════════════════════════════════════════════════════════

function renderLedStripSVG(props) {
  return `
    <g class="ledstrip-art">
      <rect x="5" y="8" width="40" height="14" rx="2" fill="#0f172a" stroke="#334155" stroke-width="1"/>
      <circle cx="10" cy="15" r="3" fill="#ef4444" opacity="0.8"/>
      <circle cx="20" cy="15" r="3" fill="#22c55e" opacity="0.8"/>
      <circle cx="30" cy="15" r="3" fill="#3b82f6" opacity="0.8"/>
      <circle cx="40" cy="15" r="3" fill="#a855f7" opacity="0.8"/>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">LED STRIP</text>
    </g>
  `;
}

function renderLcdDisplaySVG(props) {
  return `
    <g class="lcd-art">
      <rect x="5" y="8" width="40" height="14" rx="1" fill="#0f172a" stroke="#94a3b8" stroke-width="1"/>
      <rect x="8" y="10" width="34" height="10" fill="#020617"/>
      <text x="10" y="17" fill="#22c55e" font-size="6" font-family="monospace">LCD Display</text>
      <text x="25" y="28" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">LCD/OLED/TFT</text>
    </g>
  `;
}

function renderRelayModuleSVG(props) {
  return `
    <g class="relaymodule-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
      <circle cx="15" cy="15" r="3" fill="#ef4444" opacity="0.6"/>
      <text x="25" y="14" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">RELAY</text>
      <line x1="5" y1="15" x2="10" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">RELAY MODULE</text>
    </g>
  `;
}

function renderMotorDriverSVG(props) {
  return `
    <g class="motordriver-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#f97316" stroke-width="1.5"/>
      <text x="25" y="14" fill="#f97316" font-size="7" font-family="monospace" text-anchor="middle">DRIVER</text>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="25" x2="10" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="10" x2="45" y2="10" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="20" x2="45" y2="20" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#f97316" font-size="7" font-family="monospace" text-anchor="middle">MOTOR DRIVER</text>
    </g>
  `;
}

function renderStepperDriverSVG(props) {
  return `
    <g class="stepperdriver-art">
      <rect x="10" y="5" width="30" height="20" rx="2" fill="#1e293b" stroke="#a855f7" stroke-width="1.5"/>
      <text x="25" y="14" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">STEP-DRV</text>
      <line x1="5" y1="5" x2="10" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="5" y1="25" x2="10" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="5" x2="45" y2="5" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="40" y1="25" x2="45" y2="25" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#a855f7" font-size="7" font-family="monospace" text-anchor="middle">STEPPER DRV</text>
    </g>
  `;
}

function renderHeatingElementSVG(props) {
  return `
    <g class="heating-art">
      <rect x="15" y="5" width="20" height="20" rx="2" fill="#1e293b" stroke="#ef4444" stroke-width="1.5"/>
      <path d="M 17 15 Q 25 5 33 15" fill="none" stroke="#ef4444" stroke-width="2" opacity="0.6"/>
      <text x="25" y="13" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">HEAT</text>
      <line x1="5" y1="15" x2="15" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <line x1="35" y1="15" x2="45" y2="15" stroke="#94a3b8" stroke-width="2" stroke-linecap="round"/>
      <text x="25" y="28" fill="#ef4444" font-size="7" font-family="monospace" text-anchor="middle">HEATING EL.</text>
    </g>
  `;
}
