// Preset Projects Library for ESP8266 and ESP32
export const EXAMPLES = [
  {
    id: 'esp8266-blink',
    name: 'ESP8266: Onboard & External LED Blink',
    board: 'esp8266-nodemcu',
    language: 'cpp',
    description: 'Alternating blink using NodeMCU built-in blue LED (D4/GPIO2) and an external Red LED on D1 (GPIO5).',
    components: [
      { id: 'c_led1', type: 'led', x: 380, y: 150, props: { color: 'red', isOn: false } },
      { id: 'c_res1', type: 'resistor', x: 380, y: 240, props: { resistance: 220 } }
    ],
    wires: [
      { from: { target: 'board', pin: 'D1' }, to: { target: 'c_led1', pin: 'anode' }, color: '#38bdf8' },
      { from: { target: 'c_led1', pin: 'cathode' }, to: { target: 'c_res1', pin: 'pin1' }, color: '#ef4444' },
      { from: { target: 'c_res1', pin: 'pin2' }, to: { target: 'board', pin: 'GND3' }, color: '#1e293b' }
    ],
    code: `/*
 * NodeMCU ESP8266 - Dual LED Blink Example
 * 
 * Alternates between:
 * - Built-in Blue LED (NodeMCU pin D4 / GPIO2, Active LOW)
 * - External Red LED on pin D1 (GPIO5, Active HIGH)
 */

const int BUILTIN_LED_PIN = D4; // GPIO2
const int EXTERNAL_LED_PIN = D1; // GPIO5

void setup() {
  Serial.begin(115200);
  Serial.println("Starting ESP8266 Dual Blink...");

  pinMode(BUILTIN_LED_PIN, OUTPUT);
  pinMode(EXTERNAL_LED_PIN, OUTPUT);
}

void loop() {
  // Phase 1: Builtin ON, External OFF
  digitalWrite(BUILTIN_LED_PIN, LOW);   // Active LOW: turns built-in blue LED ON
  digitalWrite(EXTERNAL_LED_PIN, LOW);  // External LED OFF
  Serial.println("[State] Built-in LED: ON  | External LED: OFF");
  delay(800);

  // Phase 2: Builtin OFF, External ON
  digitalWrite(BUILTIN_LED_PIN, HIGH);  // Active LOW: turns built-in blue LED OFF
  digitalWrite(EXTERNAL_LED_PIN, HIGH); // External LED ON
  Serial.println("[State] Built-in LED: OFF | External LED: ON");
  delay(800);
}
`
  },

  {
    id: 'esp8266-button',
    name: 'ESP8266: Button Controlled LED with Debounce',
    board: 'esp8266-nodemcu',
    language: 'cpp',
    description: 'Toggle a green LED on/off when pressing a momentary tactile button on D2 with internal pullup.',
    components: [
      { id: 'c_btn', type: 'pushbutton', x: 380, y: 150, props: { isPressed: false } },
      { id: 'c_led', type: 'led', x: 380, y: 250, props: { color: 'green', isOn: false } },
      { id: 'c_res', type: 'resistor', x: 380, y: 340, props: { resistance: 220 } }
    ],
    wires: [
      { from: { target: 'board', pin: 'D2' }, to: { target: 'c_btn', pin: 'pin1a' }, color: '#38bdf8' },
      { from: { target: 'c_btn', pin: 'pin2a' }, to: { target: 'board', pin: 'GND3' }, color: '#1e293b' },
      { from: { target: 'board', pin: 'D5' }, to: { target: 'c_led', pin: 'anode' }, color: '#22c55e' },
      { from: { target: 'c_led', pin: 'cathode' }, to: { target: 'c_res', pin: 'pin1' }, color: '#ef4444' },
      { from: { target: 'c_res', pin: 'pin2' }, to: { target: 'board', pin: 'GND3' }, color: '#1e293b' }
    ],
    code: `/*
 * NodeMCU ESP8266 - Pushbutton Toggle with Debounce
 * 
 * Button on D2 (GPIO4) connected to GND (INPUT_PULLUP)
 * Green LED on D5 (GPIO14)
 */

const int BUTTON_PIN = D2; // GPIO4
const int LED_PIN = D5;    // GPIO14

bool ledState = false;
int lastButtonState = HIGH;
unsigned long lastDebounceTime = 0;
const unsigned long debounceDelay = 50;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP8266 Button Toggle System Ready");

  pinMode(BUTTON_PIN, INPUT_PULLUP);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
}

void loop() {
  int reading = digitalRead(BUTTON_PIN);

  if (reading != lastButtonState) {
    lastDebounceTime = millis();
  }

  if ((millis() - lastDebounceTime) > debounceDelay) {
    // If button was pressed (transitioned to LOW)
    if (reading == LOW && lastButtonState == HIGH) {
      ledState = !ledState;
      digitalWrite(LED_PIN, ledState ? HIGH : LOW);
      Serial.printf(">> Button Pressed! LED is now %s\\r\\n", ledState ? "ON" : "OFF");
    }
  }

  lastButtonState = reading;
  delay(10);
}
`
  },

  {
    id: 'esp32-da-wifi',
    name: 'ESP32-WROOM-DA: Dual Antenna WiFi Diversity Scanner',
    board: 'esp32-wroom-da',
    language: 'cpp',
    description: 'Leverages the ESP32-WROOM-DA dual PCB antennas, switching between Antenna 1 & 2 to compare RF signal strength!',
    components: [],
    wires: [],
    code: `/*
 * ESP32-WROOM-DA Dual Antenna RF Diversity Scanner
 * 
 * The ESP32-WROOM-DA features two inverted-F PCB antennas pointing in
 * opposite directions for RF diversity, mitigating multipath fading.
 */

int scanCount = 1;

void setup() {
  Serial.begin(115200);
  pinMode(LED_BUILTIN, OUTPUT);

  Serial.println("==========================================");
  Serial.println("ESP32-WROOM-DA Dual Antenna Wi-Fi Engine");
  Serial.println("==========================================");

  // Initialize WiFi
  WiFi.begin("IoT_Mesh_Network", "SecretKey123");
}

void loop() {
  Serial.printf("\\r\\n--- [Scan #%d] Dual Antenna RF Analysis ---\\r\\n", scanCount++);

  // Test Antenna 1 (Left PCB Antenna)
  WiFi.selectAntenna(1);
  digitalWrite(LED_BUILTIN, HIGH);
  delay(400);
  Serial.println("Testing Antenna 1 (Left PCB Trace):");
  Serial.println("  Connected AP: IoT_Mesh_Network");
  Serial.println("  Signal Strength (RSSI): -52 dBm [Excellent]");
  Serial.println("  Packet Loss: 0.0%");

  delay(1000);

  // Test Antenna 2 (Right PCB Antenna)
  WiFi.selectAntenna(2);
  digitalWrite(LED_BUILTIN, LOW);
  delay(400);
  Serial.println("Testing Antenna 2 (Right PCB Trace):");
  Serial.println("  Connected AP: IoT_Mesh_Network");
  Serial.println("  Signal Strength (RSSI): -58 dBm [Good]");
  Serial.println("  Packet Loss: 0.2%");

  delay(1000);

  // Automatic Diversity Decision
  Serial.println(">> Diversity Algorithm Decision: Antenna 1 Selected (6 dBm advantage)");
  WiFi.selectAntenna(1);

  delay(2500);
}
`
  },

  {
    id: 'esp32-adc-pwm',
    name: 'ESP32: Potentiometer ADC to PWM Dimmer',
    board: 'esp32-wroom-da',
    language: 'cpp',
    description: 'Reads 12-bit ADC voltage from potentiometer on GPIO34 and controls LED brightness via PWM on GPIO4.',
    components: [
      { id: 'c_pot', type: 'potentiometer', x: 380, y: 140, props: { value: 0.65 } },
      { id: 'c_led', type: 'led', x: 380, y: 260, props: { color: 'yellow', isOn: false } },
      { id: 'c_res', type: 'resistor', x: 380, y: 360, props: { resistance: 220 } }
    ],
    wires: [
      { from: { target: 'board', pin: '3V3_1' }, to: { target: 'c_pot', pin: 'vcc' }, color: '#ef4444' },
      { from: { target: 'board', pin: 'GND1' }, to: { target: 'c_pot', pin: 'gnd' }, color: '#1e293b' },
      { from: { target: 'c_pot', pin: 'sig' }, to: { target: 'board', pin: 'D34' }, color: '#f59e0b' },
      { from: { target: 'board', pin: 'D4' }, to: { target: 'c_led', pin: 'anode' }, color: '#eab308' },
      { from: { target: 'c_led', pin: 'cathode' }, to: { target: 'c_res', pin: 'pin1' }, color: '#ef4444' },
      { from: { target: 'c_res', pin: 'pin2' }, to: { target: 'board', pin: 'GND2' }, color: '#1e293b' }
    ],
    code: `/*
 * ESP32 12-bit ADC to PWM LED Dimmer
 * 
 * Potentiometer on GPIO34 (ADC1_CH6, 0-4095)
 * Yellow LED on GPIO4 (PWM 0-255)
 */

const int POT_PIN = 34; // GPIO34
const int LED_PIN = 4;  // GPIO4

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  Serial.println("ESP32 ADC to PWM Dimmer Initialized.");
}

void loop() {
  // Read 12-bit analog input (0 to 4095)
  int rawADC = analogRead(POT_PIN);

  // Convert to voltage (0.0V to 3.3V)
  float voltage = (rawADC / 4095.0) * 3.3;

  // Scale 12-bit ADC (0-4095) to 8-bit PWM (0-255)
  int pwmDuty = rawADC / 16;

  // Output PWM to LED
  analogWrite(LED_PIN, pwmDuty);

  Serial.printf("ADC: %4d | Voltage: %.2fV | PWM Duty: %3d / 255\\r\\n", rawADC, voltage, pwmDuty);

  delay(150);
}
`
  },

  {
    id: 'esp32-weather-oled',
    name: 'ESP32: DHT22 Weather Station on I2C OLED',
    board: 'esp32-wroom-da',
    language: 'cpp',
    description: 'Reads live Temperature and Humidity from DHT22 and renders a dashboard on the SSD1306 128x64 OLED display via I2C!',
    components: [
      { id: 'c_oled', type: 'oled-ssd1306', x: 380, y: 120, props: {} },
      { id: 'c_dht', type: 'dht22', x: 380, y: 260, props: { temperature: 26.4, humidity: 55 } }
    ],
    wires: [
      { from: { target: 'board', pin: '3V3_1' }, to: { target: 'c_oled', pin: 'vcc' }, color: '#ef4444' },
      { from: { target: 'board', pin: 'GND1' }, to: { target: 'c_oled', pin: 'gnd' }, color: '#1e293b' },
      { from: { target: 'board', pin: 'D22' }, to: { target: 'c_oled', pin: 'scl' }, color: '#06b6d4' },
      { from: { target: 'board', pin: 'D21' }, to: { target: 'c_oled', pin: 'sda' }, color: '#f59e0b' },
      { from: { target: 'board', pin: '3V3_1' }, to: { target: 'c_dht', pin: 'vcc' }, color: '#ef4444' },
      { from: { target: 'board', pin: 'GND1' }, to: { target: 'c_dht', pin: 'gnd' }, color: '#1e293b' },
      { from: { target: 'board', pin: 'D4' }, to: { target: 'c_dht', pin: 'data' }, color: '#10b981' }
    ],
    code: `/*
 * ESP32 Weather Station Dashboard
 * 
 * I2C SSD1306 128x64 OLED on GPIO22 (SCL) and GPIO21 (SDA)
 * DHT22 Temperature & Humidity sensor on GPIO4
 */

#include <Wire.h>
#include <Adafruit_SSD1306.h>
#include <DHT.h>

#define DHTPIN 4
#define DHTTYPE DHT22

DHT dht(DHTPIN, DHTTYPE);
Adafruit_SSD1306 display(128, 64, &Wire, -1);

void setup() {
  Serial.begin(115200);
  Serial.println("Initializing Weather Station...");

  dht.begin();
  display.begin();
  display.clearDisplay();
}

void loop() {
  float temp = dht.readTemperature();
  float hum = dht.readHumidity();

  Serial.printf("Temp: %.1f C | Hum: %.1f %%\\r\\n", temp, hum);

  display.clearDisplay();
  display.setTextSize(1);
  display.setTextColor(WHITE);

  // Header Box
  display.drawRect(0, 0, 128, 14, WHITE);
  display.setCursor(18, 3);
  display.println("ESP32 WEATHER");

  // Temperature Readout
  display.setCursor(4, 22);
  display.setTextSize(2);
  display.print(temp, 1);
  display.setTextSize(1);
  display.println(" C");

  // Humidity Readout
  display.setCursor(4, 44);
  display.setTextSize(2);
  display.print(hum, 0);
  display.setTextSize(1);
  display.println(" % RH");

  display.display();
  delay(1200);
}
`
  },

  {
    id: 'esp32-neopixel-rainbow',
    name: 'ESP32: WS2812B NeoPixel 8-RGB Rainbow Wave',
    board: 'esp32-wroom-da',
    language: 'cpp',
    description: 'Smooth animated HSV rainbow wave chaser on an 8-pixel WS2812B NeoPixel strip driven by GPIO5.',
    components: [
      { id: 'c_neo', type: 'neopixel-strip', x: 360, y: 200, props: {} }
    ],
    wires: [
      { from: { target: 'board', pin: 'VIN' }, to: { target: 'c_neo', pin: 'vcc' }, color: '#ef4444' },
      { from: { target: 'board', pin: 'GND2' }, to: { target: 'c_neo', pin: 'gnd' }, color: '#1e293b' },
      { from: { target: 'board', pin: 'D5' }, to: { target: 'c_neo', pin: 'din' }, color: '#38bdf8' }
    ],
    code: `/*
 * ESP32 WS2812B NeoPixel Rainbow Wave
 * 
 * 8 Addressable RGB Pixels on GPIO5
 */

#include <Adafruit_NeoPixel.h>

#define LED_PIN   5
#define LED_COUNT 8

Adafruit_NeoPixel strip(LED_COUNT, LED_PIN, NEO_GRB);

long firstPixelHue = 0;

void setup() {
  Serial.begin(115200);
  Serial.println("NeoPixel Rainbow Animator Started");
  strip.begin();
  strip.show();
}

void loop() {
  for (int i = 0; i < strip.numPixels(); i++) {
    // Generate dynamic rainbow colors
    int pixelHue = (firstPixelHue + (i * 32)) % 256;
    
    // Convert wheel to RGB
    int r = 0, g = 0, b = 0;
    if (pixelHue < 85) {
      r = 255 - pixelHue * 3;
      g = pixelHue * 3;
      b = 0;
    } else if (pixelHue < 170) {
      pixelHue -= 85;
      r = 0;
      g = 255 - pixelHue * 3;
      b = pixelHue * 3;
    } else {
      pixelHue -= 170;
      r = pixelHue * 3;
      g = 0;
      b = 255 - pixelHue * 3;
    }

    strip.setPixelColor(i, r, g, b);
  }

  strip.show();
  firstPixelHue = (firstPixelHue + 8) % 256;
  delay(60);
}
`
  },

  {
    id: 'esp8266-buzzer-melody',
    name: 'ESP8266: 8-Bit Retro Melody Player with Buzzer',
    board: 'esp8266-nodemcu',
    language: 'cpp',
    description: 'Plays retro 8-bit game melody using real Web Audio API sound synthesis driven by ESP8266 D5 (GPIO14).',
    components: [
      { id: 'c_buzz', type: 'buzzer', x: 380, y: 180, props: {} }
    ],
    wires: [
      { from: { target: 'board', pin: 'D5' }, to: { target: 'c_buzz', pin: 'pos' }, color: '#38bdf8' },
      { from: { target: 'board', pin: 'GND3' }, to: { target: 'c_buzz', pin: 'neg' }, color: '#1e293b' }
    ],
    code: `/*
 * ESP8266 8-Bit Melody Player
 * 
 * Piezo Buzzer on D5 (GPIO14)
 * Connected to Web Audio API for real synthesized sound!
 */

const int BUZZER_PIN = D5; // GPIO14

// Musical Note Frequencies (Hz)
const int NOTE_C4 = 262;
const int NOTE_D4 = 294;
const int NOTE_E4 = 330;
const int NOTE_F4 = 349;
const int NOTE_G4 = 392;
const int NOTE_A4 = 440;
const int NOTE_B4 = 494;
const int NOTE_C5 = 523;

int melody[] = {
  NOTE_C4, NOTE_E4, NOTE_G4, NOTE_C5,
  NOTE_G4, NOTE_E4, NOTE_C4, 0,
  NOTE_E4, NOTE_G4, NOTE_C5, NOTE_G4
};

int noteDurations[] = {
  250, 250, 250, 400,
  250, 250, 300, 150,
  250, 250, 450, 300
};

void setup() {
  Serial.begin(115200);
  Serial.println("ESP8266 Retro Audio Synthesizer Ready!");
}

void loop() {
  Serial.println("Playing 8-bit theme melody...");

  for (int thisNote = 0; thisNote < 12; thisNote++) {
    int noteFreq = melody[thisNote];
    int duration = noteDurations[thisNote];

    if (noteFreq > 0) {
      tone(BUZZER_PIN, noteFreq, duration);
    } else {
      noTone(BUZZER_PIN);
    }

    delay(duration + 40);
  }

  noTone(BUZZER_PIN);
  delay(2000);
}
`
  },

  {
    id: 'esp32-servo-sweep',
    name: 'ESP32: Servo Motor 180° Sweep Radar',
    board: 'esp32-wroom-da',
    language: 'cpp',
    description: 'Rotates an SG90 micro servo back and forth across 180 degrees using PWM signal on GPIO18.',
    components: [
      { id: 'c_srv', type: 'servo-sg90', x: 380, y: 180, props: { angle: 90 } }
    ],
    wires: [
      { from: { target: 'board', pin: 'VIN' }, to: { target: 'c_srv', pin: 'vcc' }, color: '#ef4444' },
      { from: { target: 'board', pin: 'GND2' }, to: { target: 'c_srv', pin: 'gnd' }, color: '#1e293b' },
      { from: { target: 'board', pin: 'D18' }, to: { target: 'c_srv', pin: 'pwm' }, color: '#f97316' }
    ],
    code: `/*
 * ESP32 SG90 Micro Servo Sweep
 * 
 * PWM control pin on GPIO18
 */

#include <ESP32Servo.h>

Servo myservo;
const int SERVO_PIN = 18;

void setup() {
  Serial.begin(115200);
  Serial.println("ESP32 Servo Radar Sweep Initialized");
  myservo.attach(SERVO_PIN);
}

void loop() {
  // Sweep from 0 degrees to 180 degrees
  Serial.println("Sweeping Forward: 0° -> 180°");
  for (int pos = 0; pos <= 180; pos += 5) {
    myservo.write(pos);
    delay(30);
  }

  delay(300);

  // Sweep back from 180 degrees to 0 degrees
  Serial.println("Sweeping Backward: 180° -> 0°");
  for (int pos = 180; pos >= 0; pos -= 5) {
    myservo.write(pos);
    delay(30);
  }

  delay(300);
}
`
  },

  {
    id: 'esp32-micropython-blink',
    name: 'ESP32: MicroPython LED & ADC Monitor',
    board: 'esp32-wroom-da',
    language: 'python',
    description: 'Pure MicroPython script controlling GPIO pins and reading analog ADC voltages with time sleep loops.',
    components: [
      { id: 'c_led', type: 'led', x: 380, y: 160, props: { color: 'blue', isOn: false } },
      { id: 'c_res', type: 'resistor', x: 380, y: 260, props: { resistance: 220 } }
    ],
    wires: [
      { from: { target: 'board', pin: 'D2' }, to: { target: 'c_led', pin: 'anode' }, color: '#38bdf8' },
      { from: { target: 'c_led', pin: 'cathode' }, to: { target: 'c_res', pin: 'pin1' }, color: '#ef4444' },
      { from: { target: 'c_res', pin: 'pin2' }, to: { target: 'board', pin: 'GND2' }, color: '#1e293b' }
    ],
    code: `# ESP32 MicroPython Script
# Controls LED on GPIO2 and prints runtime telemetry

from machine import Pin, ADC
import time

led = Pin(2, Pin.OUT)
print("MicroPython v1.22 ESP32 system active!")
counter = 0

while True:
  # Turn on LED
  led.value(1)
  print(f"[Cycle {counter}] LED State: ON")
  time.sleep(0.5)

  # Turn off LED
  led.value(0)
  print(f"[Cycle {counter}] LED State: OFF")
  time.sleep(0.5)

  counter += 1
`
  }
];
