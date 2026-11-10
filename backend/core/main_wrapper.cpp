#include "esp_runtime.hpp"

// Main runner entry point
int main() {
  ESPRuntime::initIPC();

  try {
    setup();

    while (ESPRuntime::g_running) {
      loop();
      // Ensure time slice
      std::this_thread::yield();
    }
  } catch (const std::exception& e) {
    std::cerr << "Runtime Exception: " << e.what() << std::endl;
  } catch (...) {
    std::cerr << "Unknown Runtime Error" << std::endl;
  }

  return 0;
}
