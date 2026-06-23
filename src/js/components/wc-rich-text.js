/**
 *
 *  Name: wc-rich-text
 *  Usage:
 *    A form-associated rich-text / markdown editor. Lives inside <wc-form> and submits
 *    its content as a normal named form value (FACE), so the standard server save path
 *    stores it with no special handling — exactly like a <wc-textarea>. Pairs with
 *    wc-markdown-viewer for display.
 *
 *    <wc-rich-text
 *        name="body"
 *        value="{{ Record.body }}"        <!-- initial content (markdown or html per mode) -->
 *        lbl-label="Body"
 *        mode="markdown"                   <!-- markdown | html — what gets stored/submitted -->
 *        toolbar="basic"                   <!-- basic | full | "bold,italic,link,h2,ul,ol,code" -->
 *        min-height="200px"
 *        required>
 *    </wc-rich-text>
 *
 *  Attributes:
 *    name        (required) — submitted form field name (FACE submits under this)
 *    value                  — initial content; markdown text or HTML per `mode`
 *    mode                   — markdown (default) | html — the stored/submitted format
 *    toolbar                — basic (default) | full | comma list of command keys
 *    lbl-label              — field label (matches wc-input/wc-textarea)
 *    min-height             — editor min height (default 200px)
 *    placeholder            — empty-state hint
 *    required / readonly / disabled
 *
 *  Events (bubbling, composed):
 *    wcrichtextchange — content changed; detail { name, value, mode }
 *    (legacy alias wc-rich-text:change also fired, deprecated)
 *
 *  Foundation: a contenteditable surface with an execCommand toolbar. Markdown ↔ HTML
 *  conversion and HTML sanitization are handled by lazily-loaded libraries (marked,
 *  turndown, DOMPurify) — the same CDN-load pattern wc-code-mirror uses for CodeMirror.
 *  The component sets `_deferReady` and resolves `ready` after the libs load.
 *
 *  Storage default is `markdown` (portable + wc-markdown-viewer-friendly). In `html`
 *  mode the submitted value is DOMPurify-sanitized; pasted content is sanitized in both
 *  modes. Preview (markdown mode) renders into a real wc-markdown-viewer for matching output.
 *  htmx-safe: re-seeds on value change and initializes on swap (no DOMContentLoaded).
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

const LIBS = {
  marked: { url: 'https://cdnjs.cloudflare.com/ajax/libs/marked/12.0.2/marked.min.js', global: 'marked' },
  turndown: { url: 'https://cdnjs.cloudflare.com/ajax/libs/turndown/7.1.3/turndown.min.js', global: 'TurndownService' },
  dompurify: { url: 'https://cdnjs.cloudflare.com/ajax/libs/dompurify/3.0.9/purify.min.js', global: 'DOMPurify' }
};

const TOOLBAR = {
  bold:   { icon: 'bold', title: 'Bold', cmd: 'bold' },
  italic: { icon: 'italic', title: 'Italic', cmd: 'italic' },
  h2:     { icon: 'heading', title: 'Heading', block: 'h2' },
  h3:     { icon: 'heading', title: 'Subheading', block: 'h3' },
  ul:     { icon: 'list-ul', title: 'Bullet list', cmd: 'insertUnorderedList' },
  ol:     { icon: 'list-ol', title: 'Numbered list', cmd: 'insertOrderedList' },
  link:   { icon: 'link', title: 'Link', special: 'link' },
  quote:  { icon: 'quote-right', title: 'Quote', block: 'blockquote' },
  code:   { icon: 'code', title: 'Inline code', special: 'code' },
  image:  { icon: 'image', title: 'Image', special: 'image' },
  table:  { icon: 'table', title: 'Table', special: 'table' }
};
const SETS = {
  basic: ['bold', 'italic', 'h2', 'ul', 'ol', 'link', 'quote', 'code'],
  full: ['bold', 'italic', 'h2', 'h3', 'ul', 'ol', 'link', 'quote', 'code', 'image', 'table']
};

class WcRichText extends WcBaseFormComponent {
  static get is() {
    return 'wc-rich-text';
  }

  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'mode', 'toolbar', 'lbl-label',
      'min-height', 'placeholder', 'required', 'readonly', 'disabled'];
  }

  constructor() {
    super();
    this._deferReady = true; // resolve `ready` after libs load
    this._libsReady = false;
    this._value = '';
    this._pendingValue = null;
    this._previewOn = false;

    this._onToolbarClick = this._handleToolbarClick.bind(this);
    // Preserve the editor's selection when a toolbar button is pressed — without this,
    // mousedown shifts focus to the button and execCommand has nothing to format.
    this._onToolbarMouseDown = (e) => { if (e.target.closest('.wc-rich-text-btn')) e.preventDefault(); };
    this._onEditorInput = this._handleEditorInput.bind(this);
    this._onPaste = this._handlePaste.bind(this);

    const compEl = this.querySelector(':scope > .wc-rich-text');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-rich-text', 'relative');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback(); // builds skeleton via _render, wires events
    this._applyStyle();
    await this._loadLibs();
    this._libsReady = true;
    this._seedContent();
    this._updateValidity();
    this._setReady();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  // ---- Value contract (FACE) ------------------------------------------------

  get value() { return this._value; }
  set value(v) {
    this._pendingValue = v == null ? '' : String(v);
    this._value = this._pendingValue;
    this._internals.setFormValue(this._value);
    if (this._libsReady) { this._seedContent(); this._updateValidity(); }
  }

  get mode() { return (this.getAttribute('mode') || 'markdown').toLowerCase() === 'html' ? 'html' : 'markdown'; }

  // ---- Lifecycle ------------------------------------------------------------

  _render() {
    super._render();
    const built = this.componentElement.querySelector(':scope > .wc-rich-text-editor');
    if (!built) {
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
    }
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  _buildSkeleton() {
    const name = this.getAttribute('name') || '';
    const labelText = this.getAttribute('lbl-label') || '';
    if (labelText) {
      const lbl = document.createElement('label');
      lbl.textContent = labelText;
      lbl.setAttribute('for', name);
      this.componentElement.appendChild(lbl);
    }

    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.classList.add('wc-rich-text-toolbar');
    this._toolbarKeys().forEach(key => {
      const def = TOOLBAR[key];
      if (!def) return;
      const b = document.createElement('button');
      b.type = 'button';
      b.classList.add('wc-rich-text-btn');
      b.dataset.cmd = key;
      b.title = def.title;
      b.setAttribute('aria-label', def.title);
      b.innerHTML = `<wc-fa-icon name="${def.icon}" size="0.875rem"></wc-fa-icon>`;
      toolbar.appendChild(b);
    });
    if (this.mode === 'markdown') {
      const sep = document.createElement('span');
      sep.classList.add('wc-rich-text-sep');
      toolbar.appendChild(sep);
      const pv = document.createElement('button');
      pv.type = 'button';
      pv.classList.add('wc-rich-text-btn', 'wc-rich-text-preview-toggle');
      pv.dataset.cmd = 'preview';
      pv.title = 'Toggle preview';
      pv.setAttribute('aria-label', 'Toggle preview');
      pv.innerHTML = `<wc-fa-icon name="eye" size="0.875rem"></wc-fa-icon>`;
      toolbar.appendChild(pv);
    }
    this.componentElement.appendChild(toolbar);
    this.toolbarEl = toolbar;

    // Editor (contenteditable)
    const editor = document.createElement('div');
    editor.classList.add('wc-rich-text-editor');
    editor.setAttribute('role', 'textbox');
    editor.setAttribute('aria-multiline', 'true');
    const ro = this.hasAttribute('readonly') || this.hasAttribute('disabled');
    editor.contentEditable = ro ? 'false' : 'true';
    const minH = this.getAttribute('min-height') || '200px';
    editor.style.minHeight = minH;
    const ph = this.getAttribute('placeholder');
    if (ph) editor.dataset.placeholder = ph;
    this.componentElement.appendChild(editor);
    this.editorEl = editor;

    // Preview (markdown mode) — a real wc-markdown-viewer for matching output
    if (this.mode === 'markdown') {
      const preview = document.createElement('wc-markdown-viewer');
      preview.classList.add('wc-rich-text-preview');
      preview.hidden = true;
      preview.style.minHeight = minH;
      this.componentElement.appendChild(preview);
      this.previewEl = preview;
    }
  }

  _toolbarKeys() {
    const raw = (this.getAttribute('toolbar') || 'basic').trim();
    if (SETS[raw]) return SETS[raw];
    const keys = raw.split(',').map(s => s.trim()).filter(k => TOOLBAR[k]);
    return keys.length ? keys : SETS.basic;
  }

  async _loadLibs() {
    const needed = this.mode === 'markdown'
      ? ['marked', 'turndown', 'dompurify']
      : ['dompurify'];
    await Promise.all(needed.map(k => {
      const lib = LIBS[k];
      if (window[lib.global]) return Promise.resolve();
      return this.loadLibrary(lib.url, lib.global).catch(() => {
        console.warn(`[wc-rich-text] failed to load ${k}; degraded to plain text`);
      });
    }));
    if (window.TurndownService && !this._turndown) {
      this._turndown = new window.TurndownService({
        headingStyle: 'atx', codeBlockStyle: 'fenced', bulletListMarker: '-'
      });
    }
  }

  // ---- Content conversion ---------------------------------------------------

  _sanitize(html) {
    return window.DOMPurify ? window.DOMPurify.sanitize(html) : html;
  }

  _mdToHtml(md) {
    if (window.marked) return this._sanitize(window.marked.parse(md || ''));
    // Degraded: escape + preserve newlines
    const esc = (md || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return esc.replace(/\n/g, '<br>');
  }

  _htmlToMd(html) {
    const safe = this._sanitize(html);
    if (this._turndown) return this._turndown.turndown(safe);
    // Degraded: strip tags
    const tmp = document.createElement('div');
    tmp.innerHTML = safe;
    return tmp.textContent || '';
  }

  _seedContent() {
    if (!this.editorEl) return;
    const value = this._pendingValue != null ? this._pendingValue
      : (this.getAttribute('value') || '');
    if (this.mode === 'markdown') {
      this.editorEl.innerHTML = this._mdToHtml(value);
      this._value = value;
    } else {
      const safe = this._sanitize(value);
      this.editorEl.innerHTML = safe;
      this._value = safe;
    }
    this._internals.setFormValue(this._value);
    this._pendingValue = null;
  }

  _readEditor() {
    if (this.mode === 'markdown') {
      return this._htmlToMd(this.editorEl.innerHTML);
    }
    return this._sanitize(this.editorEl.innerHTML);
  }

  _plainText() {
    return this.editorEl ? this.editorEl.textContent.trim() : '';
  }

  // ---- Validation -----------------------------------------------------------

  _updateValidity() {
    if (!this.editorEl) return;
    const empty = !this._plainText();
    if (this.hasAttribute('required') && empty) {
      this._internals.setValidity({ valueMissing: true }, 'Please fill out this field.', this.editorEl);
    } else {
      this._internals.setValidity({});
    }
  }

  // ---- Interaction ----------------------------------------------------------

  _handleEditorInput() {
    this._value = this._readEditor();
    this._internals.setFormValue(this._value);
    this._updateValidity();
    if (this._previewOn) this._renderPreview();
    this._emitEvent('wcrichtextchange', 'wc-rich-text:change', {
      bubbles: true, composed: true,
      detail: { name: this.getAttribute('name') || '', value: this._value, mode: this.mode }
    });
  }

  _handlePaste(e) {
    // Sanitize pasted content (prevents script/handler injection from the clipboard).
    e.preventDefault();
    const cd = e.clipboardData || window.clipboardData;
    const html = cd && cd.getData('text/html');
    const text = cd && cd.getData('text/plain');
    if (html) {
      const safe = this._sanitize(html);
      document.execCommand('insertHTML', false, safe);
    } else if (text != null) {
      document.execCommand('insertText', false, text);
    }
  }

  _handleToolbarClick(e) {
    const btn = e.target.closest('.wc-rich-text-btn');
    if (!btn || !this.toolbarEl.contains(btn)) return;
    e.preventDefault();
    const key = btn.dataset.cmd;
    if (key === 'preview') { this._togglePreview(); return; }
    if (this.hasAttribute('readonly') || this.hasAttribute('disabled')) return;
    this._exec(key);
  }

  _exec(key) {
    const def = TOOLBAR[key];
    if (!def) return;
    this.editorEl.focus();
    if (def.cmd) {
      document.execCommand(def.cmd, false, null);
    } else if (def.block) {
      document.execCommand('formatBlock', false, def.block);
    } else if (def.special === 'link') {
      const url = window.prompt('Link URL:');
      if (url) document.execCommand('createLink', false, url);
    } else if (def.special === 'image') {
      const url = window.prompt('Image URL:');
      if (url) document.execCommand('insertImage', false, url);
    } else if (def.special === 'code') {
      this._wrapInlineCode();
    } else if (def.special === 'table') {
      document.execCommand('insertHTML', false,
        '<table><thead><tr><th>Header</th><th>Header</th></tr></thead>' +
        '<tbody><tr><td>Cell</td><td>Cell</td></tr><tr><td>Cell</td><td>Cell</td></tr></tbody></table><p></p>');
    }
    this._handleEditorInput();
  }

  _wrapInlineCode() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const range = sel.getRangeAt(0);
    if (range.collapsed) return;
    const code = document.createElement('code');
    try {
      range.surroundContents(code);
    } catch (ex) {
      code.appendChild(range.extractContents());
      range.insertNode(code);
    }
    sel.removeAllRanges();
  }

  _togglePreview() {
    if (this.mode !== 'markdown' || !this.previewEl) return;
    this._previewOn = !this._previewOn;
    if (this._previewOn) {
      this._renderPreview();
      this.editorEl.hidden = true;
      this.previewEl.hidden = false;
    } else {
      this.editorEl.hidden = false;
      this.previewEl.hidden = true;
    }
    const btn = this.toolbarEl.querySelector('.wc-rich-text-preview-toggle');
    if (btn) btn.classList.toggle('active', this._previewOn);
  }

  _renderPreview() {
    if (!this.previewEl) return;
    // Render the stored markdown to HTML and hand it to the viewer (matching output).
    this.previewEl.innerHTML = this._mdToHtml(this._value);
  }

  // ---- Wiring ---------------------------------------------------------------

  _wireEvents() {
    super._wireEvents();
    if (this.toolbarEl) {
      this.toolbarEl.removeEventListener('mousedown', this._onToolbarMouseDown);
      this.toolbarEl.addEventListener('mousedown', this._onToolbarMouseDown);
      this.toolbarEl.removeEventListener('click', this._onToolbarClick);
      this.toolbarEl.addEventListener('click', this._onToolbarClick);
    }
    if (this.editorEl) {
      this.editorEl.removeEventListener('input', this._onEditorInput);
      this.editorEl.addEventListener('input', this._onEditorInput);
      this.editorEl.removeEventListener('paste', this._onPaste);
      this.editorEl.addEventListener('paste', this._onPaste);
    }
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.toolbarEl) {
      this.toolbarEl.removeEventListener('mousedown', this._onToolbarMouseDown);
      this.toolbarEl.removeEventListener('click', this._onToolbarClick);
    }
    if (this.editorEl) {
      this.editorEl.removeEventListener('input', this._onEditorInput);
      this.editorEl.removeEventListener('paste', this._onPaste);
    }
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'value') {
      this._pendingValue = newValue == null ? '' : String(newValue);
      this._value = this._pendingValue;
      this._internals.setFormValue(this._value);
      if (this._libsReady) { this._seedContent(); this._updateValidity(); }
      return;
    }
    if (attrName === 'required') {
      this._updateValidity();
      return;
    }
    if (['mode', 'toolbar', 'min-height', 'placeholder', 'lbl-label', 'readonly', 'disabled'].includes(attrName)) {
      // Rebuild skeleton, preserving current content.
      const current = this._libsReady ? this._value : (this.getAttribute('value') || '');
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
      this._wireEvents();
      this._pendingValue = current;
      if (this._libsReady) {
        // mode may have changed which libs are needed.
        this._loadLibs().then(() => { this._seedContent(); this._updateValidity(); });
      }
      return;
    }
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    super._handleAttributeChange(attrName, newValue);
  }

  _applyStyle() {
    const style = `
      wc-rich-text { display: contents; }

      @layer wc.usage {
        .wc-rich-text { display: flex; flex-direction: column; width: 100%; }
        .wc-rich-text > label { margin-bottom: 0.25rem; }
        .wc-rich-text:has(.wc-rich-text-editor[contenteditable="true"]):has([required]) > label::after { content: ' *'; }
        wc-rich-text[required] .wc-rich-text > label::after,
        wc-rich-text[required] > .wc-rich-text > label::after { content: ' *'; font-weight: bold; }

        .wc-rich-text-toolbar {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.125rem;
          padding: 0.25rem;
          background-color: var(--surface-3);
          border: 1px solid var(--surface-4);
          border-bottom: none;
          border-radius: 0.375rem 0.375rem 0 0;
        }
        .wc-rich-text-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.75rem;
          height: 1.75rem;
          padding: 0;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          background: none;
          color: var(--text-1);
          cursor: pointer;
        }
        .wc-rich-text-btn:hover {
          background-color: var(--surface-4);
        }
        .wc-rich-text-btn.active {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
        }
        .wc-rich-text-sep {
          width: 1px;
          height: 1.25rem;
          margin: 0 0.25rem;
          background-color: var(--surface-4);
        }
        .wc-rich-text-editor,
        .wc-rich-text-preview {
          padding: 0.5rem 0.625rem;
          background-color: var(--surface-3);
          border: 1px solid var(--surface-4);
          border-radius: 0 0 0.375rem 0.375rem;
          color: var(--text-1);
          overflow-y: auto;
          line-height: 1.6;
        }
        .wc-rich-text-editor:focus-visible {
          outline: var(--primary-bg-color) solid 2px;
          outline-offset: -1px;
        }
        .wc-rich-text-editor[contenteditable="false"] {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .wc-rich-text-editor:empty::before {
          content: attr(data-placeholder);
          color: var(--text-3, var(--component-alt-color));
          pointer-events: none;
        }
        /* In-editor formatting (mirrors viewer conventions) */
        .wc-rich-text-editor h1 { font-size: 1.5rem; font-weight: 700; margin: 0.75rem 0 0.5rem; }
        .wc-rich-text-editor h2 { font-size: 1.25rem; font-weight: 600; margin: 0.75rem 0 0.5rem; }
        .wc-rich-text-editor h3 { font-size: 1.1rem; font-weight: 600; margin: 0.5rem 0; }
        .wc-rich-text-editor p { margin: 0.375rem 0; }
        .wc-rich-text-editor ul, .wc-rich-text-editor ol { margin: 0.375rem 0; padding-left: 1.5rem; }
        .wc-rich-text-editor blockquote {
          margin: 0.5rem 0;
          padding: 0.25rem 0.75rem;
          border-left: 3px solid var(--primary-bg-color);
          background: var(--surface-2);
        }
        .wc-rich-text-editor code {
          padding: 0.0625rem 0.25rem;
          background: var(--surface-2);
          border-radius: 0.25rem;
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.85em;
        }
        .wc-rich-text-editor a { color: var(--primary-bg-color); }
        .wc-rich-text-editor table { border-collapse: collapse; margin: 0.5rem 0; }
        .wc-rich-text-editor th, .wc-rich-text-editor td {
          border: 1px solid var(--surface-5); padding: 0.25rem 0.5rem;
        }
      }
    `.trim();
    this.loadStyle('wc-rich-text-style', style);
  }
}

customElements.define(WcRichText.is, WcRichText);
export { WcRichText };
