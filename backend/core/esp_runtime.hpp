#pragma once

#include <iostream>
#include <string>
#include <vector>
#include <chrono>
#include <thread>
#include <mutex>
#include <atomic>
#include <sstream>
#include <cmath>
#include <cstdint>
#include <cstdarg>
#include <map>
#include <functional>

// ==========================================
// Arduino & ESP Types & Constants
// ==========================================
typedef uint8_t byte;
typedef bool boolean;
typedef std::string String;

#define HIGH 1
#define LOW 0
#define INPUT 0
#define OUTPUT 1
#define INPUT_PULLUP 2

// NodeMCU Pin Mapping
#define D0 16
#define D1 5
#define D2 4
#define D3 0
#define D4 2
#define D5 14
#define D6 12
#define D7 13
#define D8 15
#define RX 3
#define TX 1
#define A0 100
#ifndef LED_BUILTIN
#define LED_BUILTIN 2
#endif

#define WHITE 1
#define BLACK 0
#define INVERSE 2

#define WL_CONNECTED 3
#define WL_IDLE_STATUS 0
#define WL_NO_SSID_AVAIL 1

#define DHT11 11
#define DHT22 22
#define AM2302 22

#define NEO_GRB 0

// ==========================================
// Runtime Global State & IPC Engine
// ==========================================
namespace ESPRuntime {
  struct HttpRequest {
    std::string id;
    std::string method;
    std::string url;
  };

  static auto g_startTime = std::chrono::steady_clock::now();
  static std::atomic<bool> g_running(true);
  static std::mutex g_ioMutex;

  // Pin states
  static std::map<int, int> g_digitalInputs;
  static std::map<int, int> g_analogInputs;
  static std::string g_serialInputBuffer;
  static float g_dhtTemperature = 24.5f;
  static float g_dhtHumidity = 48.0f;
  static std::vector<HttpRequest> g_pendingHttpRequests;

  inline void emitEvent(const std::string& json) {
    std::lock_guard<std::mutex> lock(g_ioMutex);
    std::cout << json << std::endl;
  }

  inline void initIPC() {
    // Background thread to listen to stdin from parent server
    std::thread([]() {
      std::string line;
      while (g_running && std::getline(std::cin, line)) {
        if (line.empty()) continue;
        // Parse simple JSON commands: {"event":"pin_in","pin":4,"val":0}
        if (line.find("\"event\":\"stop\"") != std::string::npos) {
          g_running = false;
          std::exit(0);
        } else if (line.find("\"event\":\"pin_in\"") != std::string::npos) {
          int pin = 0, val = 0;
          auto pPin = line.find("\"pin\":");
          auto pVal = line.find("\"val\":");
          if (pPin != std::string::npos && pVal != std::string::npos) {
            pin = std::stoi(line.substr(pPin + 6));
            val = std::stoi(line.substr(pVal + 6));
            std::lock_guard<std::mutex> lock(g_ioMutex);
            g_digitalInputs[pin] = val;
          }
        } else if (line.find("\"event\":\"adc_in\"") != std::string::npos) {
          int pin = 0, val = 0;
          auto pPin = line.find("\"pin\":");
          auto pVal = line.find("\"val\":");
          if (pPin != std::string::npos && pVal != std::string::npos) {
            pin = std::stoi(line.substr(pPin + 6));
            val = std::stoi(line.substr(pVal + 6));
            std::lock_guard<std::mutex> lock(g_ioMutex);
            g_analogInputs[pin] = val;
          }
        } else if (line.find("\"event\":\"dht_in\"") != std::string::npos) {
          auto pT = line.find("\"temp\":");
          auto pH = line.find("\"hum\":");
          if (pT != std::string::npos && pH != std::string::npos) {
            std::lock_guard<std::mutex> lock(g_ioMutex);
            g_dhtTemperature = std::stof(line.substr(pT + 7));
            g_dhtHumidity = std::stof(line.substr(pH + 6));
          }
        } else if (line.find("\"event\":\"serial_in\"") != std::string::npos) {
          auto pTxt = line.find("\"text\":\"");
          if (pTxt != std::string::npos) {
            auto endTxt = line.find("\"", pTxt + 8);
            if (endTxt != std::string::npos) {
              std::lock_guard<std::mutex> lock(g_ioMutex);
              g_serialInputBuffer += line.substr(pTxt + 8, endTxt - (pTxt + 8));
            }
          }
        } else if (line.find("\"event\":\"http_req\"") != std::string::npos) {
          std::string reqId, method = "GET", url = "/";
          auto pId = line.find("\"id\":\"");
          if (pId != std::string::npos) {
            auto endId = line.find("\"", pId + 6);
            if (endId != std::string::npos) reqId = line.substr(pId + 6, endId - (pId + 6));
          }
          auto pMet = line.find("\"method\":\"");
          if (pMet != std::string::npos) {
            auto endMet = line.find("\"", pMet + 10);
            if (endMet != std::string::npos) method = line.substr(pMet + 10, endMet - (pMet + 10));
          }
          auto pUrl = line.find("\"url\":\"");
          if (pUrl != std::string::npos) {
            auto endUrl = line.find("\"", pUrl + 7);
            if (endUrl != std::string::npos) url = line.substr(pUrl + 7, endUrl - (pUrl + 7));
          }
          if (!reqId.empty()) {
            std::lock_guard<std::mutex> lock(g_ioMutex);
            g_pendingHttpRequests.push_back({ reqId, method, url });
          }
        }
      }
    }).detach();
  }
}

// ==========================================
// Standard Timing Functions
// ==========================================
inline unsigned long millis() {
  auto now = std::chrono::steady_clock::now();
  return std::chrono::duration_cast<std::chrono::milliseconds>(now - ESPRuntime::g_startTime).count();
}

inline unsigned long micros() {
  auto now = std::chrono::steady_clock::now();
  return std::chrono::duration_cast<std::chrono::microseconds>(now - ESPRuntime::g_startTime).count();
}

inline void delay(unsigned long ms) {
  unsigned long remaining = ms;
  while (remaining > 0 && ESPRuntime::g_running) {
    unsigned long step = std::min(remaining, 20ul);
    std::this_thread::sleep_for(std::chrono::milliseconds(step));
    remaining -= step;
  }
}

inline void delayMicroseconds(unsigned int us) {
  std::this_thread::sleep_for(std::chrono::microseconds(us));
}

// ==========================================
// GPIO Hardware Functions
// ==========================================
inline void pinMode(int pin, int mode) {
  std::string modeStr = (mode == OUTPUT) ? "OUTPUT" : (mode == INPUT_PULLUP ? "INPUT_PULLUP" : "INPUT");
  ESPRuntime::emitEvent("{\"type\":\"pinMode\",\"pin\":" + std::to_string(pin) + ",\"mode\":\"" + modeStr + "\"}");
}

inline void digitalWrite(int pin, int val) {
  int level = val ? 1 : 0;
  ESPRuntime::emitEvent("{\"type\":\"digitalWrite\",\"pin\":" + std::to_string(pin) + ",\"val\":" + std::to_string(level) + "}");
}

inline int digitalRead(int pin) {
  std::lock_guard<std::mutex> lock(ESPRuntime::g_ioMutex);
  if (ESPRuntime::g_digitalInputs.find(pin) != ESPRuntime::g_digitalInputs.end()) {
    return ESPRuntime::g_digitalInputs[pin];
  }
  return 0;
}

inline int analogRead(int pin) {
  std::lock_guard<std::mutex> lock(ESPRuntime::g_ioMutex);
  if (ESPRuntime::g_analogInputs.find(pin) != ESPRuntime::g_analogInputs.end()) {
    return ESPRuntime::g_analogInputs[pin];
  }
  return 0;
}

inline void analogWrite(int pin, int val) {
  int duty = std::max(0, std::min(255, val));
  ESPRuntime::emitEvent("{\"type\":\"pwm\",\"pin\":" + std::to_string(pin) + ",\"duty\":" + std::to_string(duty) + "}");
}

inline void ledcSetup(int channel, int freq, int res) {}
inline void ledcAttachPin(int pin, int channel) {}
inline void ledcWrite(int channel, int val) {
  analogWrite(channel, val);
}

inline void tone(int pin, unsigned int freq, unsigned long duration = 0) {
  ESPRuntime::emitEvent("{\"type\":\"tone\",\"pin\":" + std::to_string(pin) + ",\"freq\":" + std::to_string(freq) + "}");
}

inline void noTone(int pin) {
  ESPRuntime::emitEvent("{\"type\":\"noTone\",\"pin\":" + std::to_string(pin) + "}");
}

// ==========================================
// Serial Subsystem
// ==========================================
class HardwareSerial {
public:
  void begin(long baud) {
    ESPRuntime::emitEvent("{\"type\":\"serial\",\"text\":\"[Serial Initialized @ " + std::to_string(baud) + " baud]\\r\\n\"}");
  }

  void print(const String& s) { sendText(s); }
  void print(const char* s) { sendText(std::string(s)); }
  void print(int n) { sendText(std::to_string(n)); }
  void print(long n) { sendText(std::to_string(n)); }
  void print(unsigned int n) { sendText(std::to_string(n)); }
  void print(unsigned long n) { sendText(std::to_string(n)); }
  void print(double n, int prec = 2) {
    std::ostringstream ss;
    ss.precision(prec);
    ss << std::fixed << n;
    sendText(ss.str());
  }

  void println() { sendText("\r\n"); }
  void println(const String& s) { sendText(s + "\r\n"); }
  void println(const char* s) { sendText(std::string(s) + "\r\n"); }
  void println(int n) { sendText(std::to_string(n) + "\r\n"); }
  void println(long n) { sendText(std::to_string(n) + "\r\n"); }
  void println(unsigned int n) { sendText(std::to_string(n) + "\r\n"); }
  void println(unsigned long n) { sendText(std::to_string(n) + "\r\n"); }
  void println(double n, int prec = 2) {
    std::ostringstream ss;
    ss.precision(prec);
    ss << std::fixed << n << "\r\n";
    sendText(ss.str());
  }

  void printf(const char* format, ...) {
    char buffer[1024];
    va_list args;
    va_start(args, format);
    vsnprintf(buffer, sizeof(buffer), format, args);
    va_end(args);
    sendText(std::string(buffer));
  }

  int available() {
    std::lock_guard<std::mutex> lock(ESPRuntime::g_ioMutex);
    return ESPRuntime::g_serialInputBuffer.length();
  }

  int read() {
    std::lock_guard<std::mutex> lock(ESPRuntime::g_ioMutex);
    if (!ESPRuntime::g_serialInputBuffer.empty()) {
      char c = ESPRuntime::g_serialInputBuffer[0];
      ESPRuntime::g_serialInputBuffer.erase(0, 1);
      return (int)c;
    }
    return -1;
  }

private:
  void sendText(const std::string& text) {
    // Escape string for JSON
    std::string escaped;
    for (char c : text) {
      if (c == '"') escaped += "\\\"";
      else if (c == '\\') escaped += "\\\\";
      else if (c == '\n') escaped += "\\n";
      else if (c == '\r') escaped += "\\r";
      else if (c == '\t') escaped += "\\t";
      else escaped += c;
    }
    ESPRuntime::emitEvent("{\"type\":\"serial\",\"text\":\"" + escaped + "\"}");
  }
};

static HardwareSerial Serial;

// ==========================================
// WiFi & Dual Antenna Simulation
// ==========================================
class WiFiClass {
public:
  void begin(const char* ssid, const char* pass = nullptr) {
    ESPRuntime::emitEvent("{\"type\":\"serial\",\"text\":\"[WiFi] Connecting to \\\"" + std::string(ssid) + "\\\"...\\r\\n\"}");
    std::thread([ssid]() {
      std::this_thread::sleep_for(std::chrono::milliseconds(1200));
      ESPRuntime::emitEvent("{\"type\":\"serial\",\"text\":\"[WiFi] Connected to \\\"" + std::string(ssid) + "\\\"! IP: 192.168.4.15\\r\\n\"}");
    }).detach();
  }

  int status() { return WL_CONNECTED; }
  String localIP() { return "192.168.4.15"; }

  void selectAntenna(int antNum) {
    ESPRuntime::emitEvent("{\"type\":\"antenna\",\"id\":" + std::to_string(antNum) + "}");
  }

  void setDualAntennaConfig(int mode) {
    selectAntenna(mode);
  }
};

static WiFiClass WiFi;

// ==========================================
// Adafruit SSD1306 OLED Display Emulation
// ==========================================
class Adafruit_SSD1306 {
public:
  Adafruit_SSD1306(int w = 128, int h = 64, void* wire = nullptr, int rst = -1)
    : width(w), height(h), cursorX(0), cursorY(0), textSize(1), textColor(1) {
    pixels.resize(w * h, 0);
  }

  bool begin(int switchvcc = 0, int i2caddr = 0x3C) {
    clearDisplay();
    return true;
  }

  void clearDisplay() {
    std::fill(pixels.begin(), pixels.end(), 0);
    cursorX = cursorY = 0;
  }

  void setTextSize(int s) { textSize = std::max(1, s); }
  void setTextColor(int c) { textColor = c; }
  void setCursor(int x, int y) { cursorX = x; cursorY = y; }

  void print(const String& s) { drawText(s); }
  void print(const char* s) { drawText(std::string(s)); }
  void print(int n) { drawText(std::to_string(n)); }
  void print(double n, int prec = 1) {
    std::ostringstream ss;
    ss.precision(prec);
    ss << std::fixed << n;
    drawText(ss.str());
  }

  void println(const String& s = "") {
    drawText(s);
    cursorX = 0;
    cursorY += 8 * textSize;
  }
  void println(const char* s) { println(std::string(s)); }
  void println(int n) { println(std::to_string(n)); }

  void drawPixel(int x, int y, int color) {
    if (x >= 0 && x < width && y >= 0 && y < height) {
      pixels[y * width + x] = color ? 1 : 0;
    }
  }

  void drawRect(int x, int y, int w, int h, int color) {
    for (int i = x; i < x + w; ++i) { drawPixel(i, y, color); drawPixel(i, y + h - 1, color); }
    for (int j = y; j < y + h; ++j) { drawPixel(x, j, color); drawPixel(x + w - 1, j, color); }
  }

  void fillRect(int x, int y, int w, int h, int color) {
    for (int j = y; j < y + h; ++j) {
      for (int i = x; i < x + w; ++i) {
        drawPixel(i, j, color);
      }
    }
  }

  void display() {
    // Emit RLE or serialized pixels
    std::string json = "{\"type\":\"oled\",\"pixels\":[";
    for (size_t i = 0; i < pixels.size(); ++i) {
      json += std::to_string((int)pixels[i]);
      if (i + 1 < pixels.size()) json += ",";
    }
    json += "]}";
    ESPRuntime::emitEvent(json);
  }

private:
  int width, height;
  int cursorX, cursorY, textSize, textColor;
  std::vector<uint8_t> pixels;

  void drawText(const std::string& s) {
    for (char c : s) {
      // Basic 5x7 glyph render
      int ascii = (int)c;
      for (int row = 0; row < 7; ++row) {
        for (int col = 0; col < 5; ++col) {
          bool lit = ((ascii * (row + 1) * (col + 2)) % 3 != 0);
          if (lit) {
            for (int dx = 0; dx < textSize; ++dx) {
              for (int dy = 0; dy < textSize; ++dy) {
                drawPixel(cursorX + col * textSize + dx, cursorY + row * textSize + dy, textColor);
              }
            }
          }
        }
      }
      cursorX += 6 * textSize;
    }
  }
};

// ==========================================
// DHT Sensor Emulation
// ==========================================
class DHT {
public:
  DHT(int pin, int type) : m_pin(pin), m_type(type) {}
  void begin() {}
  float readTemperature() {
    std::lock_guard<std::mutex> lock(ESPRuntime::g_ioMutex);
    return ESPRuntime::g_dhtTemperature;
  }
  float readHumidity() {
    std::lock_guard<std::mutex> lock(ESPRuntime::g_ioMutex);
    return ESPRuntime::g_dhtHumidity;
  }
private:
  int m_pin, m_type;
};

// ==========================================
// Adafruit NeoPixel WS2812B Emulation
// ==========================================
class Adafruit_NeoPixel {
public:
  Adafruit_NeoPixel(int n, int p, int t = 0) : numPixels(n), pin(p) {
    colors.resize(n * 3, 0);
  }
  void begin() { clear(); }
  void clear() {
    std::fill(colors.begin(), colors.end(), 0);
    show();
  }
  void setPixelColor(int i, int r, int g, int b) {
    if (i >= 0 && i < numPixels) {
      colors[i * 3 + 0] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }
  }
  static uint32_t Color(uint8_t r, uint8_t g, uint8_t b) {
    return ((uint32_t)r << 16) | ((uint32_t)g << 8) | b;
  }
  void show() {
    std::string json = "{\"type\":\"neopixel\",\"colors\":[";
    for (int i = 0; i < numPixels; ++i) {
      json += "[" + std::to_string(colors[i * 3]) + "," +
                    std::to_string(colors[i * 3 + 1]) + "," +
                    std::to_string(colors[i * 3 + 2]) + "]";
      if (i + 1 < numPixels) json += ",";
    }
    json += "]}";
    ESPRuntime::emitEvent(json);
  }
private:
  int numPixels, pin;
  std::vector<int> colors;
};

// ==========================================
// Servo Motor Emulation
// ==========================================
class Servo {
public:
  Servo() : m_pin(-1), m_angle(90) {}
  void attach(int pin) {
    m_pin = pin;
    write(m_angle);
  }
  void write(int angle) {
    m_angle = std::max(0, std::min(180, angle));
    ESPRuntime::emitEvent("{\"type\":\"servo\",\"angle\":" + std::to_string(m_angle) + "}");
  }
  int read() { return m_angle; }
private:
  int m_pin, m_angle;
};

// ==========================================
// WebServer & ESP8266WebServer Emulation
// ==========================================
enum HTTPMethod {
  HTTP_ANY = 0,
  HTTP_GET = 1,
  HTTP_POST = 2,
  HTTP_PUT = 3,
  HTTP_PATCH = 4,
  HTTP_DELETE = 5,
  HTTP_OPTIONS = 6
};

class WebServer {
public:
  typedef std::function<void()> THandlerFunction;

  WebServer(int port = 80) : m_port(port), m_activeReqId(""), m_currentUri("/"), m_currentMethod(HTTP_GET) {}

  void on(const String& uri, THandlerFunction handler) {
    m_routes[uri] = handler;
  }

  void on(const String& uri, HTTPMethod method, THandlerFunction handler) {
    m_routes[uri] = handler;
  }

  void onNotFound(THandlerFunction handler) {
    m_notFoundHandler = handler;
  }

  void begin() {
    ESPRuntime::emitEvent("{\"type\":\"server_begin\",\"ip\":\"192.168.4.1\",\"port\":" + std::to_string(m_port) + "}");
  }

  String uri() const { return m_currentUri; }
  HTTPMethod method() const { return m_currentMethod; }

  void send(int code, const String& contentType, const String& content) {
    std::string escaped;
    for (char c : content) {
      if (c == '"') escaped += "\\\"";
      else if (c == '\\') escaped += "\\\\";
      else if (c == '\n') escaped += "\\n";
      else if (c == '\r') escaped += "\\r";
      else if (c == '\t') escaped += "\\t";
      else escaped += c;
    }
    ESPRuntime::emitEvent("{\"type\":\"http_res\",\"id\":\"" + m_activeReqId + "\",\"status\":" + std::to_string(code) + ",\"contentType\":\"" + contentType + "\",\"body\":\"" + escaped + "\"}");
  }

  void handleClient() {
    std::vector<ESPRuntime::HttpRequest> reqs;
    {
      std::lock_guard<std::mutex> lock(ESPRuntime::g_ioMutex);
      if (!ESPRuntime::g_pendingHttpRequests.empty()) {
        reqs = ESPRuntime::g_pendingHttpRequests;
        ESPRuntime::g_pendingHttpRequests.clear();
      }
    }

    for (const auto& req : reqs) {
      m_activeReqId = req.id;
      m_currentUri = req.url;
      m_currentMethod = (req.method == "POST") ? HTTP_POST : HTTP_GET;

      std::string path = req.url;
      auto qPos = path.find('?');
      if (qPos != std::string::npos) {
        path = path.substr(0, qPos);
      }

      if (m_routes.find(path) != m_routes.end()) {
        m_routes[path]();
      } else if (m_notFoundHandler) {
        m_notFoundHandler();
      } else {
        send(404, "text/plain", "404 Not Found on Simulated ESP");
      }
    }
  }

private:
  int m_port;
  std::string m_activeReqId;
  std::string m_currentUri;
  HTTPMethod m_currentMethod;
  std::map<std::string, THandlerFunction> m_routes;
  THandlerFunction m_notFoundHandler;
};

typedef WebServer ESP8266WebServer;

// Wire placeholder
namespace Wire {
  inline void begin() {}
}

// User-defined prototypes
void setup();
void loop();
