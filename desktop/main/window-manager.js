// Window Manager
// Handles Electron BrowserWindow creation, state, and management

const { BrowserWindow, screen, dialog, ipcMain, app, shell } = require('electron');
const path = require('path');
const fs = require('fs');

const LOADING_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>ESP Simulator Studio</title>
<style>
  html,body{height:100%;margin:0;background:#0c0e12;color:#e2e8f0;
    font-family:'Segoe UI',system-ui,sans-serif;display:flex;align-items:center;justify-content:center}
  .box{text-align:center}
  .spinner{width:38px;height:38px;margin:0 auto 18px;border-radius:50%;
    border:3px solid #1e293b;border-top-color:#38bdf8;animation:spin 0.8s linear infinite}
  @keyframes spin{to{transform:rotate(360deg)}}
  h1{font-size:16px;font-weight:600;margin:0 0 6px}
  p{font-size:12px;color:#94a3b8;margin:0}
</style></head>
<body><div class="box"><div class="spinner"></div>
<h1>ESP Simulator Studio</h1><p>Starting local simulation engine&hellip;</p>
</div></body></html>`;

class WindowManager {
  constructor(backendManager, runtimeManager, settingsManager) {
    this.backendManager = backendManager;
    this.runtimeManager = runtimeManager;
    this.settingsManager = settingsManager;
    this.mainWindow = null;
    this.windows = new Map();
    this.isAppMode = false;
  }

  createMainWindow(options = {}) {
    let { width = 1250, height = 850, show = true, appMode = false } = options;

    // Test-only window sizing hook, inert unless ESP_SIM_WINDOW_SIZE is set
    // (for example "1280x720"). Used to verify responsive layout in the real
    // Electron window at multiple resolutions.
    const sizeOverride = process.env.ESP_SIM_WINDOW_SIZE;
    if (sizeOverride && /^\d{3,5}x\d{3,5}$/.test(sizeOverride)) {
      const [w, h] = sizeOverride.split('x').map(Number);
      width = w;
      height = h;
    }

    this.isAppMode = appMode;

    const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

    // Center window on screen
    const x = Math.max(0, (screenWidth - width) / 2);
    const y = Math.max(0, (screenHeight - height) / 2);

    const windowOptions = {
      x,
      y,
      width,
      height,
      minWidth: 900,
      minHeight: 600,
      show,
      frame: !appMode, // Frameless for app mode
      transparent: appMode,
      titleBarStyle: appMode ? 'hidden' : 'default',
      webPreferences: {
        preload: path.join(__dirname, '..', 'preload', 'preload.js'),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        webSecurity: true,
        allowRunningInsecureContent: false,
        experimentalFeatures: false
      },
      icon: path.join(__dirname, '..', 'resources', 'icons', 'icon.png'),
      title: 'ESP Simulator Studio',
      ...options
    };

    this.mainWindow = new BrowserWindow(windowOptions);

    // Track window
    this.windows.set(this.mainWindow.webContents.id, this.mainWindow);

    this.attachDiagnostics(this.mainWindow);
    this.registerNavigationGuards(this.mainWindow);
    this.attachCaptureHook(this.mainWindow);
    this.attachLayoutProbe(this.mainWindow);

    // Load the frontend
    this.loadFrontend();

    // Window event handlers
    this.mainWindow.on('closed', () => {
      if (this.backendRetryTimer) {
        clearInterval(this.backendRetryTimer);
        this.backendRetryTimer = null;
      }
      this.windows.delete(this.mainWindow.webContents.id);
      this.mainWindow = null;
    });

    this.mainWindow.on('ready-to-show', () => {
      if (show) {
        this.mainWindow.show();
        if (appMode) {
          this.mainWindow.focus();
        }
      }
    });

    this.mainWindow.on('blur', () => {
      if (appMode) {
        // In app mode, minimize instead of hiding when blurred
        // This keeps it in taskbar but out of focus
      }
    });

    return this.mainWindow;
  }

  // Development-only diagnostics. Never registered in packaged builds.
  attachDiagnostics(win) {
    if (app.isPackaged) return;

    const wc = win.webContents;

    wc.on('console-message', (event, level, message, line, sourceId) => {
      const levels = ['verbose', 'info', 'warning', 'error'];
      console.log(`[Renderer:${levels[level] || level}] ${message} (${sourceId}:${line})`);
    });

    wc.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      console.error(`[Renderer] did-fail-load ${errorCode} ${errorDescription} url=${validatedURL} mainFrame=${isMainFrame}`);
    });

    wc.on('preload-error', (event, preloadPath, error) => {
      console.error(`[Renderer] preload-error ${preloadPath}: ${error && error.message}`);
    });

    wc.on('render-process-gone', (event, details) => {
      console.error(`[Renderer] render-process-gone: ${JSON.stringify(details)}`);
    });

    wc.on('did-finish-load', async () => {
      try {
        const info = await wc.executeJavaScript(`(() => {
          const sheets = Array.from(document.styleSheets).map((s) => {
            let rules = null;
            try { rules = s.cssRules ? s.cssRules.length : null; } catch (e) { rules = 'blocked'; }
            return { href: s.href || 'inline', rules };
          });
          return {
            url: location.href,
            viewport: [window.innerWidth, window.innerHeight],
            bodyRect: [document.body.offsetWidth, document.body.offsetHeight],
            sheets,
            tailwindLoaded: typeof tailwind !== 'undefined',
            desktopAPI: !!window.desktopAPI,
            apiBase: window.API_BASE_URL || '',
            bodyHasBgClass: document.body.classList.contains('bg-[#0c0e12]'),
            computedBodyBg: getComputedStyle(document.body).backgroundColor,
            computedHeaderDisplay: getComputedStyle(document.querySelector('header')).display,
            renderedModals: Array.from(document.querySelectorAll('[id$="-modal"]')).map((m) => ({ id: m.id, display: getComputedStyle(m).display }))
          };
        })()`);
        console.log('[Renderer] diagnostics:', JSON.stringify(info));
      } catch (err) {
        console.error('[Renderer] diagnostics failed:', err.message);
      }
    });
  }

  // Prevent the renderer from navigating away from the local application
  // origin. External links open in the user's default browser instead.
  registerNavigationGuards(win) {
    const wc = win.webContents;

    wc.setWindowOpenHandler(({ url }) => {
      this.openExternalUrl(url);
      return { action: 'deny' };
    });

    wc.on('will-navigate', (event, targetUrl) => {
      if (!this.isInternalUrl(targetUrl)) {
        event.preventDefault();
        this.openExternalUrl(targetUrl);
      }
    });

    wc.on('will-attach-webview', (event) => {
      event.preventDefault();
    });
  }

  isInternalUrl(targetUrl) {
    if (!this.appOrigin) return false;
    try {
      return new URL(targetUrl).origin === this.appOrigin;
    } catch {
      return false;
    }
  }

  openExternalUrl(targetUrl) {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        shell.openExternal(targetUrl).catch(() => {});
      }
    } catch {
      // Ignore malformed URLs
    }
  }

  // Test-only layout probe. Inert unless ESP_SIM_LAYOUT_PROBE is set.
  // Writes viewport/panel geometry to a JSON file so responsive behavior can
  // be verified objectively without relying on visual inspection alone.
  attachLayoutProbe(win) {
    const probePath = process.env.ESP_SIM_LAYOUT_PROBE;
    if (!probePath) return;

    win.webContents.on('did-finish-load', () => {
      if (!/^https?:/i.test(win.webContents.getURL())) return;
      setTimeout(async () => {
        try {
          if (win.isDestroyed()) return;
          const info = await win.webContents.executeJavaScript(`(() => {
            const rect = (el) => {
              if (!el) return null;
              const r = el.getBoundingClientRect();
              return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
            };
            const q = (sel) => document.querySelector(sel);
            const palette = q('main > aside:first-child');
            const workbench = q('#workbench-section');
            const editor = q('main > aside:last-child');
            const overlaps = (a, b) => {
              if (!a || !b) return false;
              return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y);
            };
            const pr = rect(palette), wr = rect(workbench), er = rect(editor);
            return {
              url: location.href,
              viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
              documentSize: { w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight },
              overflowX: document.documentElement.scrollWidth > window.innerWidth,
              overflowY: document.documentElement.scrollHeight > window.innerHeight,
              header: rect(q('header')),
              palette: pr,
              workbench: wr,
              editor: er,
              serial: rect(q('#serial-container')),
              inspector: rect(q('#inspector-container')),
              canvas: rect(q('#canvas-container')),
              runButton: rect(q('#btn-run-sim')),
              runButtonInViewport: (() => {
                const el = q('#btn-run-sim');
                if (!el) return false;
                const r = el.getBoundingClientRect();
                return r.width > 0 && r.height > 0 && r.left >= 0 && r.top >= 0 &&
                  r.right <= window.innerWidth + 1 && r.bottom <= window.innerHeight + 1;
              })(),
              overlaps: {
                paletteWorkbench: overlaps(pr, wr),
                workbenchEditor: overlaps(wr, er),
                paletteEditor: overlaps(pr, er)
              },
              modalsVisible: Array.from(document.querySelectorAll('[id$="-modal"]'))
                .filter((m) => getComputedStyle(m).display !== 'none')
                .map((m) => m.id),
              tailwindLoaded: typeof tailwind !== 'undefined',
              desktopAPI: !!window.desktopAPI
            };
          })()`);
          fs.mkdirSync(path.dirname(probePath), { recursive: true });
          fs.writeFileSync(probePath, JSON.stringify(info, null, 2));
          console.log(`[Diagnostics] Layout probe written to ${probePath}`);
        } catch (err) {
          console.error('[Diagnostics] Layout probe failed:', err.message);
        }
      }, 3000);
    });
  }

  // Test-only screenshot hook. Inert unless ESP_SIM_CAPTURE_PATH is set.
  // Used to verify the real Electron renderer (and packaged build) without
  // relying on OS screen capture, which cannot see Chromium's GPU surface.
  attachCaptureHook(win) {
    const capturePath = process.env.ESP_SIM_CAPTURE_PATH;
    if (!capturePath) return;

    win.webContents.on('did-finish-load', () => {
      if (!/^https?:/i.test(win.webContents.getURL())) return;
      setTimeout(async () => {
        try {
          if (win.isDestroyed()) return;
          const image = await win.webContents.capturePage();
          fs.mkdirSync(path.dirname(capturePath), { recursive: true });
          fs.writeFileSync(capturePath, image.toPNG());
          console.log(`[Diagnostics] Captured renderer to ${capturePath}`);
        } catch (err) {
          console.error('[Diagnostics] Capture failed:', err.message);
        }
      }, 3000);
    });
  }

  loadFrontend() {
    // Serve the frontend from the local backend HTTP server so the desktop
    // app uses exactly the same origin, relative paths and API URLs as the
    // browser/PWA version. This avoids custom-protocol asset resolution
    // problems (module scripts, relative CSS, fonts, EventSource, CORS).
    const backendUrl = this.backendManager && this.backendManager.getBackendUrl();
    if (backendUrl && this.backendManager.isBackendRunning()) {
      this.loadApp(backendUrl);
      return;
    }

    // Backend is still starting: show a lightweight loading page and retry.
    this.mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(LOADING_HTML));

    let attempts = 0;
    this.backendRetryTimer = setInterval(() => {
      if (!this.mainWindow || this.mainWindow.isDestroyed() || ++attempts > 80) {
        clearInterval(this.backendRetryTimer);
        this.backendRetryTimer = null;
        return;
      }
      const url = this.backendManager && this.backendManager.getBackendUrl();
      if (url && this.backendManager.isBackendRunning()) {
        clearInterval(this.backendRetryTimer);
        this.backendRetryTimer = null;
        this.loadApp(url);
      }
    }, 250);
  }

  loadApp(backendUrl) {
    try {
      this.appOrigin = new URL(backendUrl).origin;
    } catch {
      this.appOrigin = backendUrl;
    }
    this.mainWindow.loadURL(`${backendUrl}/index.html`);
  }

  focusMainWindow() {
    if (this.mainWindow) {
      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
    }
  }

  getMainWindow() {
    return this.mainWindow;
  }

  getWindowCount() {
    return this.windows.size;
  }

  showErrorDialog(title, message) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      dialog.showMessageBox(this.mainWindow, {
        type: 'error',
        title,
        message,
        buttons: ['OK']
      });
    } else {
      console.error(`${title}: ${message}`);
    }
  }

  showInfoDialog(title, message) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title,
        message,
        buttons: ['OK']
      });
    }
  }

  openFileDialog(options = {}) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return dialog.showOpenDialog(this.mainWindow, {
        title: options.title || 'Open File',
        defaultPath: options.defaultPath,
        filters: options.filters || [],
        properties: options.properties || ['openFile']
      });
    }
    return Promise.resolve({ canceled: true, filePaths: [] });
  }

  saveFileDialog(options = {}) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return dialog.showSaveDialog(this.mainWindow, {
        title: options.title || 'Save File',
        defaultPath: options.defaultPath,
        filters: options.filters || []
      });
    }
    return Promise.resolve({ canceled: true, filePath: undefined });
  }

  openFolderDialog(options = {}) {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      return dialog.showOpenDialog(this.mainWindow, {
        title: options.title || 'Open Folder',
        defaultPath: options.defaultPath,
        properties: ['openDirectory']
      });
    }
    return Promise.resolve({ canceled: true, filePaths: [] });
  }

  closeAllWindows() {
    for (const [id, win] of this.windows) {
      if (!win.isDestroyed()) {
        win.close();
      }
    }
    this.windows.clear();
    this.mainWindow = null;
  }
}

module.exports = { WindowManager };
