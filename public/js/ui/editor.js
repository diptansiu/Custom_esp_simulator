// Code Editor with VS Code-style Syntax Highlighting & Multi-File Support
export class CodeEditor {
  constructor(containerEl, options = {}) {
    this.container = containerEl;
    this.language = options.language || 'cpp'; // 'cpp' | 'python'
    this.value = options.initialValue || '';
    this.onChange = options.onChange || (() => {});
    this.onFileChange = options.onFileChange || (() => {});

    // Multi-file state
    this.files = new Map();
    this.activeFileId = null;

    // Default file
    if (this.value) {
      this.activeFileId = 'file_1';
      this.files.set('file_1', {
        id: 'file_1',
        name: 'main.ino',
        language: this.language,
        content: this.value
      });
    }

    this.initDOM();
    this.attachEvents();
    this.setValue(this.value);
  }

  initDOM() {
    this.container.innerHTML = `
      <div class="code-editor-root flex flex-col h-full bg-[#080d14] text-slate-300 font-mono text-sm leading-relaxed">
        <!-- Editor Header & Tab Bar -->
        <div class="editor-header flex flex-col shrink-0">
          <!-- Title Bar -->
          <div class="h-8 bg-[#0d1420] border-b border-[#26374a] flex items-center justify-between px-3 shrink-0">
            <div class="flex items-center space-x-3">
              <div class="w-5 h-5 rounded-lg bg-gradient-to-tr from-sky-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <svg class="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="10 13 8 15 10 17"/><polyline points="14 13 16 15 14 17"/>
                </svg>
              </div>
              <div class="flex items-center space-x-2">
                <span class="font-bold text-sm text-slate-200 whitespace-nowrap" id="editor-filename">main.ino</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-[#00d5ff]/20 text-[#00d5ff] border border-[#00d5ff]/40 font-semibold">v1.0</span>
                <span class="text-[10px] text-slate-500 mx-1">|</span>
                <span class="text-[10px] text-slate-500" id="editor-language">CPP</span>
              </div>
              <div class="flex items-center space-x-1">
                <button id="btn-new-file" class="p-1 hover:bg-[#1f2430] text-slate-400 hover:text-white rounded transition" title="New File (Ctrl+N)">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                </button>
                <button id="btn-copy-code" class="p-1 hover:bg-[#1f2430] text-slate-400 hover:text-white rounded transition" title="Copy Code (Ctrl+C)">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                  </svg>
                </button>
                <button id="btn-paste-code" class="p-1 hover:bg-[#1f2430] text-slate-400 hover:text-white rounded transition" title="Paste Code (Ctrl+V)">
                  <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Tab Bar -->
          <div class="h-9 bg-[#111b29] border-b border-[#26374a]/60 flex items-center shrink-0 px-2 overflow-x-auto" id="editor-tab-bar">
            <div class="flex items-center gap-1" id="editor-tab-list">
              <!-- Tabs injected here -->
            </div>
            <button id="btn-tab-close" class="p-1 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded transition hidden" title="Close Tab">
              <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Code View Area -->
        <div class="editor-body flex-1 relative flex overflow-hidden">
          <!-- Line Numbers -->
          <div class="line-numbers py-3 px-2 text-right text-[#91a4ba] bg-[#0d2132] select-none border-r border-[#26374a] text-xs font-mono" id="line-gutter">
            1
          </div>

          <!-- Editor Content Area -->
          <div class="editor-content-area flex-1 relative overflow-auto bg-[#080d14]">
            <!-- Highlighted Backdrop -->
            <pre class="highlight-backdrop absolute inset-0 m-0 py-3 px-4 pointer-events-none whitespace-pre font-mono text-sm leading-relaxed tab-size-4" id="code-highlight"></pre>

            <!-- Editable Textarea -->
            <textarea class="editor-textarea absolute inset-0 m-0 py-3 px-4 w-full h-full bg-transparent text-transparent caret-[#00d5ff] font-mono text-sm leading-relaxed resize-none outline-none whitespace-pre border-none z-10 tab-size-4"
                      spellcheck="false" autocomplete="off" autocapitalize="off" id="editor-textarea"
                      draggable="true"></textarea>
          </div>
        </div>
      </div>
    `;

    this.textarea = this.container.querySelector('#editor-textarea');
    this.highlightEl = this.container.querySelector('#code-highlight');
    this.gutterEl = this.container.querySelector('#line-gutter');
    this.tabBarEl = this.container.querySelector('#editor-tab-list');
    this.filenameEl = this.container.querySelector('#editor-filename');
    this.languageEl = this.container.querySelector('#editor-language');
    this.tabCloseBtn = this.container.querySelector('#btn-tab-close');
  }

  // ── Multi-File API ──────────────────────────────────────

  addFile(fileId, fileName, language = 'cpp', content = '') {
    this.files.set(fileId, {
      id: fileId,
      name: fileName,
      language,
      content
    });
    this.renderTabBar();
    if (!this.activeFileId) {
      this.switchFile(fileId);
    }
    return fileId;
  }

  switchFile(fileId) {
    const file = this.files.get(fileId);
    if (!file) return;

    this.activeFileId = fileId;
    this.language = file.language;
    this.value = file.content;

    // Update UI
    this.textarea.value = file.content;
    this.updateHighlight();
    this.updateLineNumbers();
    this.updateTabBar();
    this.updateHeader();

    this.onChange(this.value);
    this.onFileChange(file);
  }

  closeFile(fileId) {
    if (this.files.size <= 1) return; // Keep at least one file
    if (this.activeFileId === fileId) {
      const nextId = this.files.keys().next().value;
      this.switchFile(nextId);
    }
    this.files.delete(fileId);
    this.updateTabBar();
  }

  getActiveFile() {
    return this.activeFileId ? this.files.get(this.activeFileId) : null;
  }

  renderTabBar() {
    this.tabBarEl.innerHTML = '';
    for (const [fileId, file] of this.files.entries()) {
      const isActive = fileId === this.activeFileId;
      const tab = document.createElement('div');
      tab.className = `flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition ${
        isActive
          ? 'bg-[#162233] text-slate-200 border-b-2 border-sky-500'
          : 'text-slate-400 hover:bg-[#1e232c] hover:text-slate-200'
      }`;
      tab.dataset.fileId = fileId;
      tab.innerHTML = `
        <span class="font-semibold truncate max-w-[120px]">${file.name}</span>
        <button class="p-1 hover:bg-red-600/20 text-slate-400 hover:text-red-400 rounded-md ml-1" data-action="close-tab" title="Close">
          <svg class="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      tab.addEventListener('click', (e) => {
        if (e.target.closest('[data-action="close-tab"]')) {
          e.stopPropagation();
          this.closeFile(fileId);
        } else {
          this.switchFile(fileId);
        }
      });
      this.tabBarEl.appendChild(tab);
    }
    this.tabCloseBtn.classList.toggle('hidden', this.files.size <= 1 || !this.activeFileId);
  }

  updateTabBar() {
    const tabs = this.tabBarEl.querySelectorAll('[data-file-id]');
    tabs.forEach(tab => {
      const isActive = tab.dataset.fileId === this.activeFileId;
      if (isActive) {
        tab.className = 'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition bg-[#162233] text-slate-200 border-b-2 border-sky-500';
      } else {
        tab.className = 'flex items-center gap-1 px-2 py-1.5 rounded-md text-xs transition text-slate-400 hover:bg-[#1e232c] hover:text-slate-200';
      }
    });
  }

  updateHeader() {
    const file = this.files.get(this.activeFileId);
    if (file) {
      this.filenameEl.textContent = file.name;
      this.languageEl.textContent = file.language.toUpperCase();
    }
  }

  // ── Existing Methods (updated to use shared state) ──

  setLanguage(lang) {
    this.language = lang;
    if (this.activeFileId) {
      this.files.get(this.activeFileId).language = lang;
    }
    this.updateHighlight();
  }

  setValue(val) {
    this.value = val;
    this.textarea.value = val;
    if (this.activeFileId) {
      this.files.get(this.activeFileId).content = val;
    }
    this.updateHighlight();
    this.updateLineNumbers();
  }

  getValue() {
    return this.textarea.value;
  }

  attachEvents() {
    // Ensure textarea can receive focus for copy/paste/drag
    this.textarea.tabIndex = 0;

    // Sync textarea with highlight and line numbers
    this.textarea.addEventListener('input', () => {
      this.value = this.textarea.value;
      if (this.activeFileId) {
        this.files.get(this.activeFileId).content = this.value;
      }
      this.updateHighlight();
      this.updateLineNumbers();
      this.onChange(this.value);
    });

    // Handle paste events - intercept and insert text properly
    this.textarea.addEventListener('paste', (e) => {
      e.preventDefault();
      const text = (e.clipboardData || window.clipboardData).getData('text/plain');
      if (!text) return;
      const start = this.textarea.selectionStart;
      const end = this.textarea.selectionEnd;
      const val = this.textarea.value;
      this.textarea.value = val.substring(0, start) + text + val.substring(end);
      this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
      this.value = this.textarea.value;
      if (this.activeFileId) {
        this.files.get(this.activeFileId).content = this.value;
      }
      this.updateHighlight();
      this.updateLineNumbers();
      this.onChange(this.value);
    });

    // Handle cut events
    this.textarea.addEventListener('cut', () => {
      setTimeout(() => {
        this.value = this.textarea.value;
        if (this.activeFileId) {
          this.files.get(this.activeFileId).content = this.value;
        }
        this.updateHighlight();
        this.updateLineNumbers();
        this.onChange(this.value);
      }, 0);
    });

    // Handle copy - ensure selection is properly copied (native handles it)
    this.textarea.addEventListener('copy', (e) => {
      // Native copy already works, but we can ensure the data is set
      const selected = this.textarea.value.substring(
        this.textarea.selectionStart,
        this.textarea.selectionEnd
      );
      if (selected) {
        e.clipboardData.setData('text/plain', selected);
      }
    });

    // Sync scrolling
    this.textarea.addEventListener('scroll', () => {
      this.highlightEl.scrollTop = this.textarea.scrollTop;
      this.highlightEl.scrollLeft = this.textarea.scrollLeft;
      this.gutterEl.scrollTop = this.textarea.scrollTop;
    });

    // Drag and drop support for files
    const editorArea = this.container.querySelector('.editor-content-area');
    if (editorArea) {
      editorArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
        editorArea.classList.add('drag-over');
      });
      editorArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        editorArea.classList.remove('drag-over');
      });
      editorArea.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        editorArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
          const file = files[0];
          const reader = new FileReader();
          reader.onload = (ev) => {
            const newFileId = 'file_' + Date.now();
            this.addFile(newFileId, file.name, 'cpp', ev.target.result);
            this.switchFile(newFileId);
          };
          reader.readAsText(file);
        } else {
          // Handle dropped text
          const text = e.dataTransfer.getData('text/plain');
          if (text) {
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            const val = this.textarea.value;
            this.textarea.value = val.substring(0, start) + text + val.substring(end);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
            this.value = this.textarea.value;
            if (this.activeFileId) {
              this.files.get(this.activeFileId).content = this.value;
            }
            this.updateHighlight();
            this.updateLineNumbers();
            this.onChange(this.value);
          }
        }
      });
    }

    // Paste button click handler
    const pasteBtn = this.container.querySelector('#btn-paste-code');
    if (pasteBtn) {
      pasteBtn.addEventListener('click', async () => {
        try {
          const text = await navigator.clipboard.readText();
          if (text) {
            const start = this.textarea.selectionStart;
            const end = this.textarea.selectionEnd;
            const val = this.textarea.value;
            this.textarea.value = val.substring(0, start) + text + val.substring(end);
            this.textarea.selectionStart = this.textarea.selectionEnd = start + text.length;
            this.value = this.textarea.value;
            if (this.activeFileId) {
              this.files.get(this.activeFileId).content = this.value;
            }
            this.updateHighlight();
            this.updateLineNumbers();
            this.onChange(this.value);
          }
        } catch (err) {
          // Fallback: focus textarea and let user use Ctrl+V
          this.textarea.focus();
        }
      });
    }

    // Copy button click handler
    const copyBtn = this.container.querySelector('#btn-copy-code');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        const selected = this.textarea.value.substring(
          this.textarea.selectionStart,
          this.textarea.selectionEnd
        );
        const textToCopy = selected || this.textarea.value;
        navigator.clipboard.writeText(textToCopy).catch(() => {});
      });
    }

    // New file button
    const newFileBtn = this.container.querySelector('#btn-new-file');
    if (newFileBtn) {
      newFileBtn.addEventListener('click', () => {
        const fileId = 'file_' + Date.now();
        const fileName = 'untitled_' + (this.files.size + 1) + '.ino';
        this.addFile(fileId, fileName, 'cpp', '');
        this.switchFile(fileId);
      });
    }

    // Tab close button
    if (this.tabCloseBtn) {
      this.tabCloseBtn.addEventListener('click', () => {
        if (this.activeFileId) {
          this.closeFile(this.activeFileId);
        }
      });
    }

    // Select All (Ctrl+A / Cmd+A)
    this.textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        this.textarea.select();
        return;
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        const start = this.textarea.selectionStart;
        const end = this.textarea.selectionEnd;
        const val = this.textarea.value;

        this.textarea.value = val.substring(0, start) + '  ' + val.substring(end);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + 2;
        this.value = this.textarea.value;
        if (this.activeFileId) {
          this.files.get(this.activeFileId).content = this.value;
        }
        this.updateHighlight();
        this.updateLineNumbers();
        this.onChange(this.value);
      } else if (e.key === 'Enter') {
        const start = this.textarea.selectionStart;
        const val = this.textarea.value;
        const curLine = val.substring(0, start).split('\n').pop();
        const indentMatch = curLine.match(/^\s*/);
        const indent = indentMatch ? indentMatch[0] : '';

        let extra = '';
        if (curLine.trim().endsWith('{') || curLine.trim().endsWith(':')) {
          extra = '  ';
        }

        e.preventDefault();
        const insertText = '\n' + indent + extra;
        this.textarea.value = val.substring(0, start) + insertText + val.substring(this.textarea.selectionEnd);
        this.textarea.selectionStart = this.textarea.selectionEnd = start + insertText.length;
        this.value = this.textarea.value;
        if (this.activeFileId) {
          this.files.get(this.activeFileId).content = this.value;
        }
        this.updateHighlight();
        this.updateLineNumbers();
        this.onChange(this.value);
      }
    });
  }

  updateLineNumbers() {
    const lines = this.value.split('\n').length;
    let numbers = '';
    for (let i = 1; i <= lines; i++) {
      numbers += i + '<br/>';
    }
    this.gutterEl.innerHTML = numbers;
  }

  updateHighlight() {
    let code = this.value;

    if (this.language === 'cpp') {
      code = highlightCpp(code);
    } else {
      code = highlightPython(code);
    }

    // Ensure ending newline renders properly
    if (this.value.endsWith('\n')) {
      code += ' ';
    }

    this.highlightEl.innerHTML = code;
  }
}

/* ---------- VS Code Dark+ inspired syntax highlighting ---------- */

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };
function esc(t) { return t.replace(/[&<>"']/g, (m) => ESC[m]); }

// Token master pattern: comments, strings, preprocessor, numbers, identifiers, operators, whitespace, catch-all
// Order matters: longer/more specific patterns first
const CPP_TOKEN_RE = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|#\s*[a-zA-Z_][^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(0x[0-9a-fA-F]+[lu]?|0b[01]+[lu]?|\d+\.\d+[fL]?|\d+[lu]?)\b|[a-zA-Z_][a-zA-Z0-9_]*|[\+\-\*\/%=&|^!<>~?:,;{}()\[\]]|\s|.)/g;

const CPP_TYPES = new Set(['int','float','double','long','char','byte','boolean','bool','void','size_t','uint8_t','uint16_t','uint32_t','int8_t','int16_t','int32_t','String','word']);
const CPP_KEYWORDS = new Set(['if','else','for','while','do','switch','case','break','continue','return','goto','const','constexpr','static','extern','volatile','register','auto','true','false','NULL','nullptr','class','struct','union','enum','namespace','template','typename','public','private','protected','virtual','override','final','new','delete','this','operator','friend','inline','explicit','mutable','try','catch','throw','noexcept','assert','sizeof','typedef','using','static_assert','AND','OR','NOT','bitand','bitor','compl','xor','xor_eq']);
const CPP_HW = new Set(['HIGH','LOW','OUTPUT','INPUT','INPUT_PULLUP','LED_BUILTIN','pinMode','digitalWrite','digitalRead','analogRead','analogWrite','ledcSetup','ledcAttachPin','ledcWrite','delay','delayMicroseconds','millis','micros','tone','noTone','yield','Serial','Serial1','Serial2','WiFi','Wire','SPI','DHT','Adafruit_SSD1306','Adafruit_NeoPixel','Servo','attachInterrupt','detachInterrupt','digitalPinToInterrupt','begin','end','print','println','available','read','write','flush','peek','attach','detach','readMicroseconds','writeMicroseconds','setPixelColor','show','clear','Color','readTemperature','readHumidity','beginTransmission','requestFrom','endTransmission','connect','disconnect','status','localIP','softAP','mode','config','setSleepMode','random','randomSeed','map','constrain','lowByte','highByte','bitRead','bitWrite','bitSet','bitClear','bit']);

function highlightCpp(code) {
  let out = '';
  let lastIndex = 0;
  CPP_TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = CPP_TOKEN_RE.exec(code)) !== null) {
    const token = m[0];
    const type = classifyCppToken(token);
    out += esc(code.slice(lastIndex, m.index)); // gap (shouldn't happen with . catch-all, but safe)
    out += wrap(token, type);
    lastIndex = CPP_TOKEN_RE.lastIndex;
  }
  out += esc(code.slice(lastIndex));
  return out;
}

function classifyCppToken(tok) {
  if (tok.startsWith('/*') || tok.startsWith('//')) return 'comment';
  if (tok.startsWith('#')) return 'preprocessor';
  if (tok.startsWith('"') || tok.startsWith("'")) return 'string';
  if (/^\b(0x[0-9a-fA-F]+[lu]?|0b[01]+[lu]?|\d+\.\d+[fL]?|\d+[lu]?)\b$/.test(tok)) return 'number';
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tok)) {
    if (CPP_HW.has(tok)) return 'hw';
    if (CPP_KEYWORDS.has(tok)) return 'keyword';
    if (CPP_TYPES.has(tok)) return 'type';
    return 'ident';
  }
  if (/^[\+\-\*\/%=&|^!<>~?:,;{}()\[\]]$/.test(tok)) return 'operator';
  return 'text';
}

function wrap(tok, type) {
  const t = esc(tok);
  const cls = {
    comment: 'text-[#6a9955] italic',
    preprocessor: 'text-[#c586c0]',
    string: 'text-[#ce9178]',
    number: 'text-[#b5cea8]',
    type: 'text-[#4ec9b0]',
    keyword: 'text-[#569cd6] font-semibold',
    hw: 'text-[#dcdcaa]',
    ident: 'text-[#9cdcfe]',
    operator: 'text-[#d4d4d4]',
    text: '',
  }[type] || '';
  return cls ? `<span class="${cls}">${t}</span>` : t;
}

// ---------- Python ----------

const PY_TOKEN_RE = /(\/\/[^\n]*|#[^\n]*|"""(?:[\s\S]*?)"""|'''(?:[\s\S]*?)'''|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(0x[0-9a-fA-F]+[lu]?|0b[01]+[lu]?|\d+\.\d+[fL]?|\d+[lu]?)\b|[a-zA-Z_][a-zA-Z0-9_]*|[\+\-\*\/%=&|^!<>~?:,;{}()\[\]]|\s|.)/g;

const PY_TYPES = new Set(['int','float','complex','bool','str','list','tuple','dict','set','frozenset','bytes','bytearray','object','None','True','False','range','enumerate','zip','map','filter','super','property','staticmethod','classmethod']);
const PY_KEYWORDS = new Set(['import','from','as','def','class','if','elif','else','while','for','in','not','and','or','is','with','assert','break','continue','del','global','lambda','nonlocal','pass','raise','return','try','except','finally','yield','await','async']);
const PY_HW = new Set(['Pin','ADC','PWM','I2C','time','sleep','sleep_ms','ticks_ms','ticks_us','value','duty','freq','read','read_u16','readinto','write','write_readinto','print','on','off','init','deinit','attach','detach','irq','begin','end','scan','readfrom','readfrom_mem','writeto','writeto_mem','start','stop','soft_reset','freq','reset_cause','bootloader','main','idle','sleep','deepsleep','mount','umount','chdir','getcwd','listdir','mkdir','remove','rmdir','rename','stat','statvfs','open','flush','seek','tell','readline','readlines','writelines','isatty','setblocking','settimeout','connect','bind','listen','accept','send','recv','sendto','recvfrom','setsockopt','getsockopt','makefile','getaddrinfo']);

function highlightPython(code) {
  let out = '';
  let lastIndex = 0;
  PY_TOKEN_RE.lastIndex = 0;
  let m;
  while ((m = PY_TOKEN_RE.exec(code)) !== null) {
    const token = m[0];
    const type = classifyPyToken(token);
    out += esc(code.slice(lastIndex, m.index));
    out += wrapPy(token, type);
    lastIndex = PY_TOKEN_RE.lastIndex;
  }
  out += esc(code.slice(lastIndex));
  return out;
}

function classifyPyToken(tok) {
  if (tok.startsWith('#')) return 'comment';
  if (tok.startsWith('"""') || tok.startsWith("'''") || tok.startsWith('"') || tok.startsWith("'")) return 'string';
  if (/^\b(0x[0-9a-fA-F]+[lu]?|0b[01]+[lu]?|\d+\.\d+[fL]?|\d+[lu]?)\b$/.test(tok)) return 'number';
  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(tok)) {
    if (PY_HW.has(tok)) return 'hw';
    if (PY_KEYWORDS.has(tok)) return 'keyword';
    if (PY_TYPES.has(tok)) return 'type';
    return 'ident';
  }
  if (/^[\+\-\*\/%=&|^!<>~?:,;{}()\[\]]$/.test(tok)) return 'operator';
  return 'text';
}

function wrapPy(tok, type) {
  const t = esc(tok);
  const cls = {
    comment: 'text-[#6a9955] italic',
    string: 'text-[#ce9178]',
    number: 'text-[#b5cea8]',
    type: 'text-[#4ec9b0]',
    keyword: 'text-[#569cd6] font-semibold',
    hw: 'text-[#dcdcaa]',
    ident: 'text-[#9cdcfe]',
    operator: 'text-[#d4d4d4]',
    text: '',
  }[type] || '';
  return cls ? `<span class="${cls}">${t}</span>` : t;
}