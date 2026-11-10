// Virtual In-Simulator Web Browser
import { ICONS } from './icons.js';

export class VirtualWebBrowser {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.onRequest = options.onRequest || (() => {});
    this.currentUrl = 'http://192.168.4.1/';
    this.history = ['http://192.168.4.1/'];
    this.historyIndex = 0;
    this.isServerActive = false;
    this.isMobileView = false;
    this.isFloating = false;
    this.floatingContainer = null;
    this.lastResponse = null;

    this.initDOM();
    this.attachEvents();
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="virtual-browser flex flex-col h-full bg-[#0d1017] text-slate-200 select-none border-t border-slate-800">
        <!-- Browser Top Bar (Address bar & controls) -->
        <div class="browser-navbar h-10 bg-[#141720] border-b border-slate-800/80 px-3 flex items-center justify-between shrink-0 gap-2">
          
          <!-- Navigation buttons -->
          <div class="flex items-center space-x-1">
            <button id="wb-btn-back" class="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition" title="Back" disabled>
              <span class="w-3.5 h-3.5 inline-block">${ICONS.arrowLeft}</span>
            </button>
            <button id="wb-btn-forward" class="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded disabled:opacity-30 disabled:hover:bg-transparent transition" title="Forward" disabled>
              <span class="w-3.5 h-3.5 inline-block">${ICONS.arrowRight}</span>
            </button>
            <button id="wb-btn-refresh" class="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition" title="Reload Webpage">
              <span class="w-3.5 h-3.5 inline-block" id="wb-refresh-icon">${ICONS.rotateCw}</span>
            </button>
          </div>

          <!-- URL Address Input Bar -->
          <div class="flex-1 max-w-xl flex items-center bg-[#1b202c] border border-slate-700/80 rounded-md px-2.5 py-1 text-xs shadow-inner">
            <span class="w-3.5 h-3.5 text-emerald-400 mr-2 shrink-0" title="Simulated Local Network (192.168.4.x)">
              ${ICONS.shieldCheck}
            </span>
            <input type="text" id="wb-url-input" value="${this.currentUrl}" spellcheck="false"
                   class="flex-1 bg-transparent text-slate-200 outline-none font-mono text-[11px]"/>
            <span id="wb-status-badge" class="ml-2 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 font-semibold border border-slate-700">
              Offline
            </span>
          </div>

          <!-- View Mode Controls (Mobile View & Popout Floating Window) -->
          <div class="flex items-center space-x-1">
            <button id="wb-btn-mobile-toggle" class="px-2 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded text-xs flex items-center space-x-1 transition" title="Toggle Phone / Desktop frame">
              <span class="w-3.5 h-3.5 inline-block">${ICONS.smartphone}</span>
              <span class="text-[11px]" id="wb-view-mode-label">Mobile</span>
            </button>

            <button id="wb-btn-popout" class="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition" title="Pop out onto Workbench Canvas">
              <span class="w-3.5 h-3.5 inline-block">${ICONS.externalLink}</span>
            </button>
          </div>
        </div>

        <!-- Web Content Frame -->
        <div class="browser-viewport flex-1 overflow-auto bg-[#0a0c10] flex justify-center items-center relative" id="wb-viewport-area">
          <div id="wb-frame-wrapper" class="w-full h-full flex flex-col transition-all duration-200">
            <iframe id="wb-iframe" class="w-full h-full border-none bg-white" sandbox="allow-scripts allow-forms allow-same-origin"></iframe>
          </div>

          <!-- Offline / Empty State Banner -->
          <div id="wb-offline-splash" class="absolute inset-0 bg-[#0c0e14] flex flex-col items-center justify-center p-6 text-center z-10">
            <div class="w-14 h-14 rounded-2xl bg-sky-950/60 border border-sky-800/60 flex items-center justify-center text-sky-400 mb-4 shadow-xl">
              <span class="w-7 h-7">${ICONS.globe}</span>
            </div>
            <h3 class="font-bold text-slate-200 text-sm mb-1">ESP Web Server Simulator</h3>
            <p class="text-xs text-slate-400 max-w-sm mb-4 leading-relaxed">
              When your ESP8266 or ESP32 runs web server code (<code class="text-sky-300">server.begin()</code>), 
              the live interactive web page will appear here.
            </p>
            <div class="flex items-center space-x-2">
              <button id="wb-btn-load-web-example" class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded text-xs font-semibold shadow transition flex items-center space-x-1.5">
                <span class="w-3.5 h-3.5">${ICONS.sparkles}</span>
                <span>Load IoT Web Server Preset</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.urlInput = this.container.querySelector('#wb-url-input');
    this.statusBadge = this.container.querySelector('#wb-status-badge');
    this.iframe = this.container.querySelector('#wb-iframe');
    this.btnBack = this.container.querySelector('#wb-btn-back');
    this.btnForward = this.container.querySelector('#wb-btn-forward');
    this.btnRefresh = this.container.querySelector('#wb-btn-refresh');
    this.btnMobile = this.container.querySelector('#wb-btn-mobile-toggle');
    this.btnPopout = this.container.querySelector('#wb-btn-popout');
    this.frameWrapper = this.container.querySelector('#wb-frame-wrapper');
    this.offlineSplash = this.container.querySelector('#wb-offline-splash');
    this.btnLoadExample = this.container.querySelector('#wb-btn-load-web-example');
  }

  attachEvents() {
    // Address bar Enter
    this.urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.navigate(this.urlInput.value);
      }
    });

    // Refresh
    this.btnRefresh.addEventListener('click', () => {
      this.navigate(this.currentUrl);
    });

    // Back / Forward
    this.btnBack.addEventListener('click', () => {
      if (this.historyIndex > 0) {
        this.historyIndex--;
        this.currentUrl = this.history[this.historyIndex];
        this.urlInput.value = this.currentUrl;
        this.navigate(this.currentUrl, false);
      }
    });

    this.btnForward.addEventListener('click', () => {
      if (this.historyIndex < this.history.length - 1) {
        this.historyIndex++;
        this.currentUrl = this.history[this.historyIndex];
        this.urlInput.value = this.currentUrl;
        this.navigate(this.currentUrl, false);
      }
    });

    // Mobile viewport frame toggle
    this.btnMobile.addEventListener('click', () => {
      this.isMobileView = !this.isMobileView;
      const label = this.container.querySelector('#wb-view-mode-label');
      if (this.isMobileView) {
        this.frameWrapper.className = 'w-[375px] h-[95%] my-auto bg-slate-900 border-4 border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col';
        label.textContent = 'Desktop';
      } else {
        this.frameWrapper.className = 'w-full h-full flex flex-col transition-all duration-200';
        label.textContent = 'Mobile';
      }
    });

    // Popout to workbench floating window
    this.btnPopout.addEventListener('click', () => {
      this.toggleFloatingMode();
    });

    // Handle incoming postMessages from inside iframe (intercepted link clicks, fetch, forms)
    window.addEventListener('message', (e) => {
      if (e.data && e.data.source === 'esp-sim-iframe') {
        const { action, url, method, body } = e.data;
        if (action === 'navigate') {
          this.navigate(url);
        } else if (action === 'fetch') {
          this.sendFetchRequest(url, method, body, e.data.reqId);
        }
      }
    });
  }

  setServerActive(active, ip = '192.168.4.1', port = 80) {
    this.isServerActive = active;
    if (active) {
      this.statusBadge.textContent = '200 OK';
      this.statusBadge.className = 'ml-2 px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800';
      this.offlineSplash.classList.add('hidden');
      this.currentUrl = `http://${ip}/`;
      this.urlInput.value = this.currentUrl;
      this.navigate(this.currentUrl);
    } else {
      this.statusBadge.textContent = 'Offline';
      this.statusBadge.className = 'ml-2 px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-400 font-semibold border border-slate-700';
      this.offlineSplash.classList.remove('hidden');
    }
  }

  navigate(url, addToHistory = true) {
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'http://192.168.4.1' + (url.startsWith('/') ? url : '/' + url);
    }
    this.currentUrl = url;
    this.urlInput.value = url;

    if (addToHistory && this.history[this.historyIndex] !== url) {
      this.history = this.history.slice(0, this.historyIndex + 1);
      this.history.push(url);
      this.historyIndex = this.history.length - 1;
    }

    this.btnBack.disabled = this.historyIndex <= 0;
    this.btnForward.disabled = this.historyIndex >= this.history.length - 1;

    // Send HTTP request to simulated ESP
    const reqId = 'req_' + Math.random().toString(36).substring(2, 8);
    const parsed = new URL(url);
    const pathAndQuery = parsed.pathname + parsed.search;

    this.onRequest({
      id: reqId,
      method: 'GET',
      url: pathAndQuery,
      callback: (res) => {
        this.renderResponse(res);
      }
    });
  }

  sendFetchRequest(url, method = 'GET', body = null, fetchReqId = null) {
    let path = url;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      try { path = new URL(url).pathname + new URL(url).search; } catch {}
    }
    const reqId = fetchReqId || ('req_' + Math.random().toString(36).substring(2, 8));

    this.onRequest({
      id: reqId,
      method: method.toUpperCase(),
      url: path,
      callback: (res) => {
        // Send response back into iframe
        if (this.iframe && this.iframe.contentWindow) {
          this.iframe.contentWindow.postMessage({
            source: 'esp-sim-parent',
            reqId,
            status: res.status,
            body: res.body,
            contentType: res.contentType
          }, '*');
        }
      }
    });
  }

  renderResponse(res) {
    this.lastResponse = res;
    if (res.status === 200) {
      this.statusBadge.textContent = '200 OK';
      this.statusBadge.className = 'ml-2 px-1.5 py-0.2 rounded text-[10px] bg-emerald-950 text-emerald-400 font-semibold border border-emerald-800';
    } else {
      this.statusBadge.textContent = `${res.status}`;
      this.statusBadge.className = 'ml-2 px-1.5 py-0.2 rounded text-[10px] bg-amber-950 text-amber-400 font-semibold border border-amber-800';
    }

    this.offlineSplash.classList.add('hidden');

    let html = res.body || '';

    // Inject Interceptor Script so links and fetch calls stay inside simulator
    const interceptorScript = `
      <script>
        // Intercept all link clicks
        document.addEventListener('click', (e) => {
          const a = e.target.closest('a');
          if (a && a.href) {
            e.preventDefault();
            window.parent.postMessage({ source: 'esp-sim-iframe', action: 'navigate', url: a.getAttribute('href') }, '*');
          }
        });

        // Intercept form submissions
        document.addEventListener('submit', (e) => {
          const form = e.target;
          e.preventDefault();
          const action = form.getAttribute('action') || window.location.pathname;
          window.parent.postMessage({ source: 'esp-sim-iframe', action: 'navigate', url: action }, '*');
        });

        // Intercept window.fetch
        const origFetch = window.fetch;
        window.fetch = function(url, opts) {
          const reqId = 'fetch_' + Math.random().toString(36).substring(2, 9);
          const method = (opts && opts.method) || 'GET';
          const body = (opts && opts.body) || null;

          return new Promise((resolve) => {
            function handleMsg(ev) {
              if (ev.data && ev.data.source === 'esp-sim-parent' && ev.data.reqId === reqId) {
                window.removeEventListener('message', handleMsg);
                resolve({
                  status: ev.data.status,
                  ok: ev.data.status >= 200 && ev.data.status < 300,
                  text: () => Promise.resolve(ev.data.body),
                  json: () => Promise.resolve(JSON.parse(ev.data.body))
                });
              }
            }
            window.addEventListener('message', handleMsg);
            window.parent.postMessage({ source: 'esp-sim-iframe', action: 'fetch', url, method, body, reqId }, '*');
          });
        };
      </script>
    `;

    if (res.contentType && res.contentType.includes('application/json')) {
      html = `<pre style="font-family: monospace; padding: 15px; color: #10b981; background: #0f172a; height: 100vh; margin: 0;">${html}</pre>`;
    }

    this.iframe.srcdoc = interceptorScript + html;
  }

  toggleFloatingMode() {
    this.isFloating = !this.isFloating;
    const workbench = document.getElementById('workbench-section');

    if (this.isFloating) {
      // Create floating window overlay on canvas
      if (!this.floatingContainer) {
        this.floatingContainer = document.createElement('div');
        this.floatingContainer.id = 'floating-web-browser';
        this.floatingContainer.className = 'absolute top-12 right-6 w-[420px] h-[520px] bg-[#141720] border-2 border-slate-700 rounded-xl shadow-2xl z-30 flex flex-col overflow-hidden';
        workbench.appendChild(this.floatingContainer);
      }
      this.floatingContainer.appendChild(this.container.querySelector('.virtual-browser'));
      this.floatingContainer.classList.remove('hidden');
      this.btnPopout.innerHTML = `<span class="w-3.5 h-3.5 inline-block">${ICONS.minimize2}</span>`;
      this.btnPopout.title = 'Dock back to panel';
    } else {
      // Dock back into bottom container
      const dockedHost = document.getElementById('browser-container');
      if (dockedHost && this.floatingContainer) {
        dockedHost.appendChild(this.floatingContainer.querySelector('.virtual-browser'));
        this.floatingContainer.classList.add('hidden');
      }
      this.btnPopout.innerHTML = `<span class="w-3.5 h-3.5 inline-block">${ICONS.externalLink}</span>`;
      this.btnPopout.title = 'Pop out onto Workbench Canvas';
    }
  }
}
