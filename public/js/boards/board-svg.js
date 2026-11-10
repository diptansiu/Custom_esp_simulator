// Board SVG Renderer - generates high-fidelity visual PCB boards
export function renderBoardSVG(boardId, state = {}) {
  if (boardId === 'esp8266-nodemcu') {
    return renderNodeMCUSVG(state);
  } else if (boardId === 'esp32-wroom-da') {
    return renderESP32WROOMDASVG(state);
  } else {
    return renderESP32DevKitSVG(state);
  }
}

function renderNodeMCUSVG(state) {
  const gpio2Active = state.gpio && state.gpio[2] === 0; // Active low on NodeMCU D4
  const gpio16Active = state.gpio && state.gpio[16] === 0;
  const pwrActive = state.isPowered !== false;

  return `
  <g class="board-container esp8266-nodemcu-svg" id="board-root">
    <!-- PCB Base (Matte Black with rounded corners) -->
    <rect x="0" y="0" width="200" height="420" rx="14" ry="14" fill="#14171a" stroke="#2a2e37" stroke-width="2"/>
    <rect x="3" y="3" width="194" height="414" rx="12" ry="12" fill="none" stroke="#22262e" stroke-width="1.5"/>

    <!-- Mounting Holes -->
    <circle cx="14" cy="14" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="186" cy="14" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="14" cy="406" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="186" cy="406" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>

    <!-- ESP-12E Module Outline & Ground Copper Plane -->
    <rect x="30" y="25" width="140" height="175" rx="5" fill="#1e232a" stroke="#334155" stroke-width="1.5"/>
    
    <!-- PCB Antenna Area (Top of ESP-12E) -->
    <rect x="32" y="27" width="136" height="45" rx="3" fill="#18221b"/>
    <!-- Serpentine Trace Antenna (Gold/Copper) -->
    <path d="M 45 62 L 45 36 L 60 36 L 60 58 L 75 58 L 75 36 L 90 36 L 90 58 L 105 58 L 105 36 L 120 36 L 120 58 L 135 58 L 135 36 L 155 36" 
          fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Metal Shielding Can (Silver) -->
    <rect x="34" y="76" width="132" height="120" rx="3" fill="url(#metal-gradient-nodemcu)" stroke="#94a3b8" stroke-width="1"/>
    <!-- Laser Etching Text on Shield -->
    <text x="100" y="105" fill="#cbd5e1" font-size="11" font-family="'Courier New', monospace" font-weight="bold" text-anchor="middle" letter-spacing="1">ESP8266MOD</text>
    <text x="100" y="122" fill="#94a3b8" font-size="8" font-family="sans-serif" text-anchor="middle">ISM 2.4GHz</text>
    <text x="100" y="136" fill="#94a3b8" font-size="7" font-family="sans-serif" text-anchor="middle">PA +25dBm 802.11b/g/n</text>
    <rect x="75" y="142" width="50" height="2" fill="#64748b"/>
    <text x="100" y="156" fill="#64748b" font-size="7" font-family="sans-serif" text-anchor="middle">FCC ID: 2AHMR-ESP12E</text>
    <text x="100" y="170" fill="#475569" font-size="6" font-family="sans-serif" text-anchor="middle">Ai-Thinker Technology</text>

    <!-- NodeMCU PCB Silkscreen Labels -->
    <text x="100" y="222" fill="#e2e8f0" font-size="12" font-family="'Segoe UI', Roboto, sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1.5">NodeMCU 1.0</text>
    <text x="100" y="236" fill="#94a3b8" font-size="7.5" font-family="sans-serif" text-anchor="middle">ESP8266 ESP-12E Wi-Fi DevKit</text>

    <!-- CP2102 USB-UART Bridge IC (Black QFN package with shiny text) -->
    <rect x="80" y="260" width="40" height="40" rx="2" fill="#0d1117" stroke="#30363d" stroke-width="1"/>
    <circle cx="85" cy="265" r="1.5" fill="#475569"/>
    <text x="100" y="282" fill="#64748b" font-size="6" font-family="monospace" text-anchor="middle">CP2102</text>
    <text x="100" y="292" fill="#475569" font-size="5" font-family="monospace" text-anchor="middle">SILICON LABS</text>

    <!-- Crystal Oscillator (Silver Oval) -->
    <rect x="42" y="270" width="20" height="12" rx="4" fill="#cbd5e1" stroke="#64748b" stroke-width="1"/>
    <text x="52" y="279" fill="#334155" font-size="5" font-family="monospace" text-anchor="middle">26.0</text>

    <!-- Micro-USB Port (Bottom center) -->
    <rect x="82" y="386" width="36" height="34" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
    <rect x="88" y="412" width="24" height="8" rx="1" fill="#1e293b"/>
    <rect x="91" y="414" width="18" height="4" fill="#ca8a04"/>

    <!-- RST Button (Left) -->
    <rect x="36" y="348" width="18" height="18" rx="3" fill="#cbd5e1" stroke="#64748b" stroke-width="1"/>
    <circle cx="45" cy="357" r="5" fill="#1e293b" class="interactive-btn" id="btn-nodemcu-rst" style="cursor: pointer;"/>
    <text x="45" y="377" fill="#cbd5e1" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">RST</text>

    <!-- FLASH Button (Right) -->
    <rect x="146" y="348" width="18" height="18" rx="3" fill="#cbd5e1" stroke="#64748b" stroke-width="1"/>
    <circle cx="155" cy="357" r="5" fill="#1e293b" class="interactive-btn" id="btn-nodemcu-flash" style="cursor: pointer;"/>
    <text x="155" y="377" fill="#cbd5e1" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">FLASH</text>

    <!-- Onboard Status LEDs -->
    <!-- Power LED (Red) -->
    <rect x="52" y="390" width="8" height="5" rx="1" fill="#334155" stroke="#475569" stroke-width="0.5"/>
    <circle cx="56" cy="392.5" r="3" fill="${pwrActive ? '#ef4444' : '#551111'}" filter="${pwrActive ? 'url(#glow-red)' : 'none'}"/>
    <text x="56" y="403" fill="#94a3b8" font-size="5" font-family="sans-serif" text-anchor="middle">PWR</text>

    <!-- User Blue LED on D4/GPIO2 -->
    <rect x="141" y="150" width="8" height="5" rx="1" fill="#334155" stroke="#475569" stroke-width="0.5"/>
    <circle cx="145" cy="152.5" r="3.5" fill="${gpio2Active ? '#38bdf8' : '#0c4a6e'}" filter="${gpio2Active ? 'url(#glow-blue)' : 'none'}"/>
    <text x="145" y="163" fill="#94a3b8" font-size="5" font-family="sans-serif" text-anchor="middle">D4 LED</text>

    <!-- ESP-12 Blue LED on GPIO16 -->
    <rect x="76" y="150" width="8" height="5" rx="1" fill="#334155" stroke="#475569" stroke-width="0.5"/>
    <circle cx="80" cy="152.5" r="3" fill="${gpio16Active ? '#38bdf8' : '#0c4a6e'}" filter="${gpio16Active ? 'url(#glow-blue)' : 'none'}"/>

    <!-- Header Silkscreen Labels -->
    ${renderPinHeadersSilkscreen('esp8266-nodemcu')}
  </g>
  `;
}

function renderESP32WROOMDASVG(state) {
  const gpio2Active = state.gpio && state.gpio[2] === 1; // Active high on ESP32
  const pwrActive = state.isPowered !== false;
  const activeAntenna = state.activeAntenna || 1; // 1 or 2

  return `
  <g class="board-container esp32-wroom-da-svg" id="board-root">
    <!-- PCB Base (Matte Obsidian Black) -->
    <rect x="0" y="0" width="230" height="470" rx="14" ry="14" fill="#12151a" stroke="#252b36" stroke-width="2"/>
    <rect x="3" y="3" width="224" height="464" rx="12" ry="12" fill="none" stroke="#1f242e" stroke-width="1.5"/>

    <!-- Mounting Holes -->
    <circle cx="15" cy="15" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="215" cy="15" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="15" cy="455" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="215" cy="455" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>

    <!-- DUAL ANTENNA REGION (ESP32-WROOM-DA Hallmark Feature!) -->
    <rect x="25" y="10" width="180" height="70" rx="6" fill="#101f16" stroke="#1e3a2b" stroke-width="1"/>
    
    <!-- Antenna 1 (Left Serpentine PCB Antenna) -->
    <path d="M 38 68 L 38 22 L 52 22 L 52 56 L 64 56 L 64 22 L 76 22 L 76 56 L 88 56 L 88 22 L 95 22" 
          fill="none" stroke="${activeAntenna === 1 ? '#34d399' : '#ca8a04'}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
          filter="${activeAntenna === 1 ? 'url(#glow-green)' : 'none'}"/>
    <text x="66" y="74" fill="${activeAntenna === 1 ? '#34d399' : '#94a3b8'}" font-size="7.5" font-family="'Segoe UI', sans-serif" font-weight="bold" text-anchor="middle">ANT 1 (Left)</text>

    <!-- Antenna Diversity Center Switch Symbol -->
    <circle cx="115" cy="45" r="7" fill="#1e293b" stroke="#64748b" stroke-width="1"/>
    <path d="M 111 45 L 119 45 M 115 41 L 115 49" stroke="#94a3b8" stroke-width="1.5"/>
    <text x="115" y="60" fill="#38bdf8" font-size="5.5" font-family="monospace" text-anchor="middle">DIVERSITY</text>

    <!-- Antenna 2 (Right Serpentine PCB Antenna) -->
    <path d="M 192 68 L 192 22 L 178 22 L 178 56 L 166 56 L 166 22 L 154 22 L 154 56 L 142 56 L 142 22 L 135 22" 
          fill="none" stroke="${activeAntenna === 2 ? '#38bdf8' : '#ca8a04'}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"
          filter="${activeAntenna === 2 ? 'url(#glow-blue)' : 'none'}"/>
    <text x="164" y="74" fill="${activeAntenna === 2 ? '#38bdf8' : '#94a3b8'}" font-size="7.5" font-family="'Segoe UI', sans-serif" font-weight="bold" text-anchor="middle">ANT 2 (Right)</text>

    <!-- ESP32-WROOM-DA RF Shielding Can (Silver Metal with Rounded Bevel) -->
    <rect x="34" y="90" width="162" height="135" rx="5" fill="url(#metal-gradient-esp32)" stroke="#94a3b8" stroke-width="1.2"/>
    <text x="115" y="125" fill="#f8fafc" font-size="12" font-family="'Segoe UI', sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1.2">ESPRESSIF</text>
    <text x="115" y="145" fill="#e2e8f0" font-size="10.5" font-family="'Courier New', monospace" font-weight="bold" text-anchor="middle">ESP32-WROOM-DA</text>
    <text x="115" y="162" fill="#94a3b8" font-size="7.5" font-family="sans-serif" text-anchor="middle">Dual PCB Antenna Wi-Fi + BLE MCU</text>
    <rect x="80" y="170" width="70" height="1.5" fill="#64748b"/>
    <text x="115" y="184" fill="#64748b" font-size="7" font-family="sans-serif" text-anchor="middle">FCC ID: 2AC7Z-ESPWROOMDA</text>
    <text x="115" y="198" fill="#475569" font-size="6.5" font-family="sans-serif" text-anchor="middle">Dual-Core Xtensa LX6 @ 240MHz</text>

    <!-- Development Board Silkscreen -->
    <text x="115" y="248" fill="#e2e8f0" font-size="11" font-family="'Segoe UI', sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="1">ESP32 DevKit-C DA</text>
    <text x="115" y="262" fill="#64748b" font-size="7" font-family="sans-serif" text-anchor="middle">High Reliability RF Diversity Board</text>

    <!-- CP2102N / CH9102 USB Bridge IC -->
    <rect x="92" y="295" width="46" height="46" rx="2" fill="#0d1117" stroke="#334155" stroke-width="1"/>
    <circle cx="98" cy="301" r="1.5" fill="#64748b"/>
    <text x="115" y="320" fill="#94a3b8" font-size="7" font-family="monospace" text-anchor="middle">CH9102F</text>
    <text x="115" y="330" fill="#475569" font-size="5.5" font-family="monospace" text-anchor="middle">USB-UART</text>

    <!-- Micro-USB / Type-C Connector (Bottom) -->
    <rect x="94" y="435" width="42" height="34" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>
    <rect x="100" y="462" width="30" height="8" rx="2" fill="#1e293b"/>
    <rect x="104" y="464" width="22" height="4" fill="#ca8a04"/>

    <!-- EN Button (Reset) -->
    <rect x="42" y="398" width="18" height="18" rx="3" fill="#cbd5e1" stroke="#64748b" stroke-width="1"/>
    <circle cx="51" cy="407" r="5" fill="#1e293b" class="interactive-btn" id="btn-esp32-en" style="cursor: pointer;"/>
    <text x="51" y="428" fill="#cbd5e1" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">EN</text>

    <!-- BOOT Button (GPIO0) -->
    <rect x="170" y="398" width="18" height="18" rx="3" fill="#cbd5e1" stroke="#64748b" stroke-width="1"/>
    <circle cx="179" cy="407" r="5" fill="#1e293b" class="interactive-btn" id="btn-esp32-boot" style="cursor: pointer;"/>
    <text x="179" y="428" fill="#cbd5e1" font-size="7" font-family="sans-serif" font-weight="bold" text-anchor="middle">BOOT</text>

    <!-- Power LED (Red) -->
    <rect x="54" y="438" width="8" height="5" rx="1" fill="#334155"/>
    <circle cx="58" cy="440.5" r="3.5" fill="${pwrActive ? '#ef4444' : '#551111'}" filter="${pwrActive ? 'url(#glow-red)' : 'none'}"/>
    <text x="58" y="452" fill="#94a3b8" font-size="5" font-family="sans-serif" text-anchor="middle">PWR</text>

    <!-- Built-in User LED on GPIO2 (Blue) -->
    <rect x="168" y="193" width="8" height="5" rx="1" fill="#334155"/>
    <circle cx="172" cy="195.5" r="3.5" fill="${gpio2Active ? '#38bdf8' : '#0c4a6e'}" filter="${gpio2Active ? 'url(#glow-blue)' : 'none'}"/>
    <text x="172" y="207" fill="#94a3b8" font-size="5" font-family="sans-serif" text-anchor="middle">GPIO2</text>

    <!-- Pin Headers Silkscreen Labels -->
    ${renderPinHeadersSilkscreen('esp32-wroom-da')}
  </g>
  `;
}

function renderESP32DevKitSVG(state) {
  const gpio2Active = state.gpio && state.gpio[2] === 1;
  const pwrActive = state.isPowered !== false;

  return `
  <g class="board-container esp32-devkit-svg" id="board-root">
    <!-- PCB Base -->
    <rect x="0" y="0" width="200" height="410" rx="14" ry="14" fill="#14171d" stroke="#252b36" stroke-width="2"/>
    <!-- Mounting Holes -->
    <circle cx="14" cy="14" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="186" cy="14" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="14" cy="396" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>
    <circle cx="186" cy="396" r="5" fill="#0f1115" stroke="#ca8a04" stroke-width="1.5"/>

    <!-- ESP-WROOM-32 Module -->
    <rect x="30" y="25" width="140" height="150" rx="4" fill="#1e242c" stroke="#334155" stroke-width="1.5"/>
    <!-- PCB Antenna Area (Single Antenna) -->
    <rect x="32" y="27" width="136" height="38" rx="3" fill="#142018"/>
    <path d="M 45 54 L 45 34 L 65 34 L 65 50 L 85 50 L 85 34 L 105 34 L 105 50 L 125 50 L 125 34 L 155 34" 
          fill="none" stroke="#eab308" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>

    <!-- Shield Can -->
    <rect x="34" y="68" width="132" height="102" rx="3" fill="url(#metal-gradient-esp32)" stroke="#94a3b8" stroke-width="1"/>
    <text x="100" y="98" fill="#f8fafc" font-size="11" font-family="'Segoe UI', sans-serif" font-weight="bold" text-anchor="middle">ESPRESSIF</text>
    <text x="100" y="115" fill="#cbd5e1" font-size="10" font-family="monospace" text-anchor="middle">ESP-WROOM-32</text>
    <text x="100" y="130" fill="#94a3b8" font-size="7" font-family="sans-serif" text-anchor="middle">Wi-Fi & Bluetooth Module</text>

    <text x="100" y="200" fill="#e2e8f0" font-size="11" font-family="'Segoe UI', sans-serif" font-weight="bold" text-anchor="middle">ESP32 DevKit V1</text>

    <!-- CP2102 Bridge -->
    <rect x="80" y="235" width="40" height="40" rx="2" fill="#0d1117" stroke="#30363d" stroke-width="1"/>
    <text x="100" y="258" fill="#64748b" font-size="6" font-family="monospace" text-anchor="middle">CP2102</text>

    <!-- USB Port -->
    <rect x="82" y="375" width="36" height="34" rx="2" fill="#94a3b8" stroke="#475569" stroke-width="1.5"/>

    <!-- EN & BOOT Buttons -->
    <rect x="38" y="338" width="18" height="18" rx="3" fill="#cbd5e1"/>
    <circle cx="47" cy="347" r="5" fill="#1e293b" class="interactive-btn" id="btn-esp32-en" style="cursor: pointer;"/>
    <text x="47" y="367" fill="#cbd5e1" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">EN</text>

    <rect x="144" y="338" width="18" height="18" rx="3" fill="#cbd5e1"/>
    <circle cx="153" cy="347" r="5" fill="#1e293b" class="interactive-btn" id="btn-esp32-boot" style="cursor: pointer;"/>
    <text x="153" y="367" fill="#cbd5e1" font-size="6.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">BOOT</text>

    <!-- Power & User LEDs -->
    <circle cx="50" cy="380" r="3" fill="${pwrActive ? '#ef4444' : '#551111'}" filter="${pwrActive ? 'url(#glow-red)' : 'none'}"/>
    <circle cx="150" cy="165" r="3.5" fill="${gpio2Active ? '#38bdf8' : '#0c4a6e'}" filter="${gpio2Active ? 'url(#glow-blue)' : 'none'}"/>

    ${renderPinHeadersSilkscreen('esp32-devkit-v1')}
  </g>
  `;
}

function renderPinHeadersSilkscreen(boardId) {
  // Pin labels and hit anchors are dynamically managed by CircuitCanvas
  return '';
}
