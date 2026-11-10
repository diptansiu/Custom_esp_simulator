// Application Lifecycle Manager
// Coordinates startup, shutdown, and cleanup across all managers

class LifecycleManager {
  constructor(app, windowManager, backendManager, runtimeManager,
              storageManager, menuManager, settingsManager) {
    this.app = app;
    this.windowManager = windowManager;
    this.backendManager = backendManager;
    this.runtimeManager = runtimeManager;
    this.storageManager = storageManager;
    this.menuManager = menuManager;
    this.settingsManager = settingsManager;
    this.isShuttingDown = false;
  }

  prepareQuit() {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    console.log('[Lifecycle] Preparing application shutdown...');

    // 1. Stop all active simulation sessions
    if (this.backendManager) {
      this.backendManager.stopAllSessions();
    }

    // 2. Stop the backend server
    if (this.backendManager) {
      this.backendManager.stopBackend();
    }

    // 3. Save application settings
    if (this.settingsManager) {
      this.settingsManager.saveSettings();
    }

    // 4. Save user data
    if (this.storageManager) {
      this.storageManager.flush();
    }

    console.log('[Lifecycle] Shutdown complete.');
  }

  getStatus() {
    return {
      isShuttingDown: this.isShuttingDown,
      backendRunning: this.backendManager ? this.backendManager.isBackendRunning() : false,
      activeSessions: this.backendManager ? this.backendManager.getActiveSessionCount() : 0,
      windowCount: this.windowManager ? this.windowManager.getWindowCount() : 0
    };
  }
}

module.exports = { LifecycleManager };
