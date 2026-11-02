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
 *    image-upload-url       — when set, the toolbar image button opens a device file picker
 *                             (accept="image/*"), POSTs the file as multipart field `image`
 *                             (+ `csrf_token` when `csrf` is set) to this same-origin URL,
 *                             expects JSON { url }, and inserts the HOSTED url at the caret
 *                             (DOMPurify-sanitized). Absent → today's Image-URL prompt (no
 *                             regression). Email clients need hosted images, not data URIs.
 *    csrf                   — CSRF token sent as the `csrf_token` upload field (if present)
 *    fields                 — JSON list of variables the text may use, each
 *                             { token: "{first_name}", label: "First name", group?, sample? }
 *                             (or set the `fields` property to the array). Each {name} in the content
 *                             then shows as a box with its label (red, "Unknown: name", when it isn't in
 *                             the list); the toolbar gets Insert field, and typing "{" opens the same
 *                             searchable list (Esc types a plain "{"). The value keeps the plain
 *                             {name} text in both modes, so a server fills it like any message.
 *                             Absent → no change.
 *    required / readonly / disabled
 *
 *    Toolbar keys: bold, italic, underline, h2, h3, ul, ol, link, quote, code, image, table
 *    (sets: basic, full). e.g. toolbar="bold,italic,underline,h2,ul,ol,link,image".
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
  bold:      { icon: 'bold', title: 'Bold', cmd: 'bold' },
  italic:    { icon: 'italic', title: 'Italic', cmd: 'italic' },
  underline: { icon: 'underline', title: 'Underline', cmd: 'underline' },
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
  full: ['bold', 'italic', 'underline', 'h2', 'h3', 'ul', 'ol', 'link', 'quote', 'code', 'image', 'table']
};

class WcRichText extends WcBaseFormComponent {
  static get is() {
    return 'wc-rich-text';
  }

  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'mode', 'toolbar', 'lbl-label',
      'min-height', 'placeholder', 'required', 'readonly', 'disabled',
      'image-upload-url', 'csrf', 'fields'];
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
    this._onFileChosen = this._handleFileChosen.bind(this);
    this._savedRange = null;
    this._fields = null;
    this._onEditorKeyDown = this._handleEditorKeyDown.bind(this);
    // image select / resize / align (all inert until an image is clicked or keyboard-selected)
    this._onEditorClick = this._handleEditorClick.bind(this);
    this._onEditorKeyUp = this._handleEditorKeyUp.bind(this);
    this._onImgOutside = this._handleImgOutside.bind(this);
    this._onImgReposition = () => this._positionImgUi();
    this._selImg = null;
    this._onPickOutside = (e) => { if (this._pickEl && !this._pickEl.contains(e.target)) this._closePicker(false); };

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

  // ---- Variables (fields) ----------------------------------------------------

  get fields() { return this._fieldList(); }
  set fields(list) {
    this._fields = Array.isArray(list) ? list : null;
    this._refreshFields();
  }

  _fieldList() {
    if (this._fields) return this._fields;
    const raw = this.getAttribute('fields');
    if (!raw) return [];
    try { const v = JSON.parse(raw); return Array.isArray(v) ? v : []; } catch (e) { return []; }
  }

  _hasFields() { return !!this._fields || this.hasAttribute('fields'); }

  _refreshFields() {
    if (!this.toolbarEl) return;
    const want = this._hasFields(), btn = this.toolbarEl.querySelector('.wc-rich-text-field-btn');
    if (want && !btn) this.toolbarEl.appendChild(this._fieldButton());
    if (!want && btn) btn.remove();
    if (this.editorEl && this._libsReady) {
      this.editorEl.querySelectorAll('.wc-rich-text-field').forEach(c => c.replaceWith(document.createTextNode(c.dataset.field)));
      this.editorEl.normalize();
      if (want) this._chipify(this.editorEl);
    }
  }

  _fieldButton() {
    const b = document.createElement('button');
    b.type = 'button';
    b.classList.add('wc-rich-text-btn', 'wc-rich-text-field-btn');
    b.dataset.cmd = 'field';
    b.title = 'Insert field (or type {)';
    b.setAttribute('aria-label', 'Insert field');
    b.innerHTML = `<wc-fa-icon name="plus" size="0.75rem"></wc-fa-icon><span>Insert field</span>`;
    return b;
  }

  _fieldInfo(token) {
    const key = token.slice(1, -1).trim();
    const f = this._fieldList().find(x => String(x.token || '').slice(1, -1).trim() === key);
    return f ? { label: f.label || key, sample: f.sample } : { label: 'Unknown: ' + key, unknown: true };
  }

  _chip(token) {
    const c = document.createElement('span'), info = this._fieldInfo(token);
    c.className = 'wc-rich-text-field' + (info.unknown ? ' unknown' : '');
    c.contentEditable = 'false';
    c.dataset.field = token;
    c.textContent = info.label;
    c.title = token + (info.unknown ? ' — not one of this text\'s fields' : (info.sample ? ' · e.g. ' + info.sample : ''));
    return c;
  }

  // {name} in text (not in code) → boxes
  _chipify(root) {
    const re = /\{([A-Za-z_][\w.]*)\}/g;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => (n.parentElement && n.parentElement.closest('code, pre, .wc-rich-text-field')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const hits = [];
    while (walker.nextNode()) { if (re.test(walker.currentNode.nodeValue)) hits.push(walker.currentNode); re.lastIndex = 0; }
    hits.forEach(node => {
      const text = node.nodeValue, frag = document.createDocumentFragment();
      let last = 0, m;
      re.lastIndex = 0;
      while ((m = re.exec(text))) {
        if (m.index > last) frag.appendChild(document.createTextNode(text.slice(last, m.index)));
        frag.appendChild(this._chip(m[0]));
        last = m.index + m[0].length;
      }
      if (last < text.length) frag.appendChild(document.createTextNode(text.slice(last)));
      node.replaceWith(frag);
    });
    // a box that ends a line leaves the caret nowhere to go after it: give it an empty spot
    root.querySelectorAll('.wc-rich-text-field').forEach(c => { if (!c.nextSibling) c.after(document.createTextNode('\u200B')); });
  }

  // the editor's HTML with each box back as its {name} (markers keep turndown from escaping the name)
  _editorHtmlForValue(markers) {
    if (!this.editorEl.querySelector('.wc-rich-text-field')) return this.editorEl.innerHTML.replace(/\u200B/g, '');
    const clone = this.editorEl.cloneNode(true);
    clone.querySelectorAll('.wc-rich-text-field').forEach(c => {
      const tok = c.dataset.field;
      if (markers) { markers.push(tok); c.replaceWith(document.createTextNode('\uE000' + (markers.length - 1) + '\uE001')); }
      else c.replaceWith(document.createTextNode(tok));
    });
    return clone.innerHTML.replace(/\u200B/g, '');
  }

  _handleEditorKeyDown(e) {
    if (this._selImg && this._handleImgKey(e)) return;
    if (e.key !== '{' || e.ctrlKey || e.metaKey || e.altKey || !this._hasFields()) return;
    if (this.hasAttribute('readonly') || this.hasAttribute('disabled')) return;
    e.preventDefault();
    this._openPicker(true);
  }

  _openPicker(typedBrace) {
    this._closePicker(true);
    const range = this._saveSelection();
    const el = document.createElement('div');
    el.className = 'wc-rich-text-pick';
    el.innerHTML = '<input type="text" class="wc-rich-text-pick-q" placeholder="Search fields" aria-label="Search fields"><div class="wc-rich-text-pick-list" role="listbox"></div>';
    document.body.appendChild(el);
    const rect = (range && range.getClientRects()[0]) || this.editorEl.getBoundingClientRect();
    el.style.left = Math.max(8, Math.min(window.innerWidth - 300, rect.left)) + 'px';
    el.style.top = (rect.bottom + 4 + 320 > window.innerHeight ? Math.max(8, rect.top - 324) : rect.bottom + 4) + 'px';
    const q = el.querySelector('input'), list = el.querySelector('.wc-rich-text-pick-list');
    let items = [], at = 0;
    const draw = () => {
      const s = q.value.trim().toLowerCase();
      items = this._fieldList().filter(f => !s || String(f.label || '').toLowerCase().includes(s) || String(f.token || '').toLowerCase().includes(s));
      at = Math.min(at, Math.max(0, items.length - 1));
      list.textContent = '';
      let group = null;
      items.forEach((f, i) => {
        if ((f.group || '') !== group) {
          group = f.group || '';
          if (group) { const g = document.createElement('div'); g.className = 'wc-rich-text-pick-group'; g.textContent = group; list.appendChild(g); }
        }
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'wc-rich-text-pick-item' + (i === at ? ' on' : ''); b.dataset.i = String(i);
        b.setAttribute('role', 'option'); b.title = f.token;
        const lab = document.createElement('span'); lab.textContent = f.label || f.token; b.appendChild(lab);
        if (f.sample != null && f.sample !== '') { const sm = document.createElement('small'); sm.textContent = String(f.sample).slice(0, 40); b.appendChild(sm); }
        list.appendChild(b);
      });
      if (!items.length) { const n = document.createElement('div'); n.className = 'wc-rich-text-pick-none'; n.textContent = 'Nothing matches'; list.appendChild(n); }
      const on = list.querySelector('.on'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' });
    };
    const choose = (i) => { const f = items[i]; if (!f) return; this._closePicker(true); this._insertAt(range, this._chip(String(f.token))); };
    q.addEventListener('input', () => { at = 0; draw(); });
    q.addEventListener('keydown', (e) => {
      e.stopPropagation();
      if (e.key === 'ArrowDown') { e.preventDefault(); at = Math.min(items.length - 1, at + 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); at = Math.max(0, at - 1); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); choose(at); }
      else if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); this._closePicker(false); }
    });
    list.addEventListener('mousedown', (e) => e.preventDefault());
    list.addEventListener('click', (e) => { const b = e.target.closest('.wc-rich-text-pick-item'); if (b) choose(+b.dataset.i); });
    this._pickEl = el;
    this._pickCancel = () => { if (typedBrace) this._insertAt(range, document.createTextNode('{')); else { this.editorEl.focus(); this._restoreSelection(range); } };
    document.addEventListener('pointerdown', this._onPickOutside, true);
    draw();
    q.focus();
  }

  _closePicker(picked) {
    if (!this._pickEl) return;
    this._pickEl.remove();
    this._pickEl = null;
    document.removeEventListener('pointerdown', this._onPickOutside, true);
    const cancel = this._pickCancel; this._pickCancel = null;
    if (!picked && cancel) cancel();
  }

  _insertAt(range, node) {
    this.editorEl.focus();
    this._restoreSelection(range);
    const sel = window.getSelection(), r = sel.getRangeAt(0);
    r.deleteContents();
    r.insertNode(node);
    let after = node;
    if (node.nodeType === 1 && !node.nextSibling) { after = document.createTextNode('\u200B'); node.after(after); }
    const c = document.createRange();
    c.setStartAfter(after); c.collapse(true);
    sel.removeAllRanges(); sel.addRange(c);
    this._handleEditorInput();
  }

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
    if (this._hasFields()) toolbar.appendChild(this._fieldButton());
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
    if (this._hasFields()) this._chipify(this.editorEl);
    this._internals.setFormValue(this._value);
    this._pendingValue = null;
  }

  _readEditor() {
    if (this.mode === 'markdown') {
      const markers = [];
      const md = this._htmlToMd(this._editorHtmlForValue(markers));
      return md.replace(/\uE000(\d+)\uE001/g, (m, i) => markers[+i] || '');
    }
    return this._sanitize(this._editorHtmlForValue(null));
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
      let src = html;
      if (this._hasFields()) { // a copied box arrives as a span: put its {name} back
        const tmp = document.createElement('div');
        tmp.innerHTML = html;
        tmp.querySelectorAll('[data-field]').forEach(c => c.replaceWith(document.createTextNode(c.getAttribute('data-field'))));
        src = tmp.innerHTML;
      }
      const safe = this._sanitize(src);
      document.execCommand('insertHTML', false, safe);
    } else if (text != null) {
      document.execCommand('insertText', false, text);
    }
    if (this._hasFields()) { this._chipify(this.editorEl); this._handleEditorInput(); }
  }

  _handleToolbarClick(e) {
    const btn = e.target.closest('.wc-rich-text-btn');
    if (!btn || !this.toolbarEl.contains(btn)) return;
    e.preventDefault();
    const key = btn.dataset.cmd;
    if (key === 'preview') { this._togglePreview(); return; }
    if (this.hasAttribute('readonly') || this.hasAttribute('disabled')) return;
    if (key === 'field') { this._openPicker(false); return; }
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
      // With image-upload-url: pick a device file, upload, insert the HOSTED url (email
      // clients need hosted images, not data URIs). Without it: keep the URL-prompt behavior.
      if (this.getAttribute('image-upload-url')) {
        this._pickAndUploadImage();
        return; // async — _handleEditorInput runs after the insert, not now
      }
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

  // ---- Device image upload (image-upload-url) -------------------------------

  _pickAndUploadImage() {
    // Save the caret BEFORE the file dialog steals focus, so we can insert back at it.
    this._savedRange = this._saveSelection();
    if (!this._fileInput) {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.style.display = 'none';
      input.addEventListener('change', this._onFileChosen);
      this._fileInput = input;
    }
    if (!this.componentElement.contains(this._fileInput)) {
      this.componentElement.appendChild(this._fileInput);
    }
    this._fileInput.value = '';
    this._fileInput.click();
  }

  async _handleFileChosen(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    await this._uploadImage(file);
  }

  async _uploadImage(file) {
    const url = this.getAttribute('image-upload-url');
    if (!url) return;
    this._setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const csrf = this.getAttribute('csrf');
      if (csrf) fd.append('csrf_token', csrf);
      const resp = await fetch(url, { method: 'POST', body: fd, credentials: 'same-origin' });
      if (!resp.ok) throw new Error(`Upload failed (${resp.status})`);
      const data = await resp.json();
      const hostedUrl = data && data.url;
      if (!hostedUrl) throw new Error('Server did not return a url');
      this._insertImageAtCaret(hostedUrl);
    } catch (err) {
      // Fail safe: no insert on failure.
      window.alert('Image upload failed: ' + (err && err.message ? err.message : 'unknown error'));
    } finally {
      this._setUploading(false);
    }
  }

  _insertImageAtCaret(hostedUrl) {
    this.editorEl.focus();
    this._restoreSelection(this._savedRange);
    this._savedRange = null;
    // Build the <img> as an element (so the url can't break out of the attribute), then
    // sanitize with DOMPurify before inserting — keeps sanitization on the result.
    const img = document.createElement('img');
    img.src = hostedUrl;
    img.alt = '';
    const safe = this._sanitize(img.outerHTML);
    if (!safe) return;
    if (!document.execCommand('insertHTML', false, safe)) {
      document.execCommand('insertImage', false, hostedUrl);
    }
    this._handleEditorInput();
  }

  _saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      if (this.editorEl && this.editorEl.contains(range.commonAncestorContainer)) {
        return range.cloneRange();
      }
    }
    return null;
  }

  _restoreSelection(range) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    if (range) {
      sel.addRange(range);
    } else {
      // No prior caret in the editor — insert at the end.
      const r = document.createRange();
      r.selectNodeContents(this.editorEl);
      r.collapse(false);
      sel.addRange(r);
    }
  }

  _setUploading(on) {
    this._uploading = on;
    let el = this.componentElement.querySelector(':scope > .wc-rich-text-uploading');
    if (on) {
      if (!el) {
        el = document.createElement('div');
        el.classList.add('wc-rich-text-uploading');
        el.textContent = 'Inserting image…';
        this.componentElement.appendChild(el);
      }
      this.componentElement.setAttribute('aria-busy', 'true');
    } else {
      if (el) el.remove();
      this.componentElement.removeAttribute('aria-busy');
    }
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
      this.editorEl.removeEventListener('keydown', this._onEditorKeyDown);
      this.editorEl.addEventListener('keydown', this._onEditorKeyDown);
      this.editorEl.removeEventListener('click', this._onEditorClick);
      this.editorEl.addEventListener('click', this._onEditorClick);
      this.editorEl.removeEventListener('keyup', this._onEditorKeyUp);
      this.editorEl.addEventListener('keyup', this._onEditorKeyUp);
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
      this.editorEl.removeEventListener('keydown', this._onEditorKeyDown);
      this.editorEl.removeEventListener('click', this._onEditorClick);
      this.editorEl.removeEventListener('keyup', this._onEditorKeyUp);
    }
    this._deselectImg(false);
    this._closePicker(true);
    if (this._fileInput) {
      this._fileInput.removeEventListener('change', this._onFileChosen);
      this._fileInput = null;
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
    if (attrName === 'fields') { this._refreshFields(); return; }
    if (attrName === 'image-upload-url' || attrName === 'csrf') {
      // Read live at click/upload time — no rebuild, no formElement passthrough.
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

  // ---- Images: select, resize, align, alt ---------------------------------------------------
  // Nothing here touches the editor's content until the writer acts on an image: the outline,
  // handles and image toolbar live OUTSIDE the contenteditable (siblings positioned over the image)
  // and the document-level listeners exist only while an image is selected. Sizes and alignment
  // are stored as attributes + inline styles that email programs honor (no classes, no <style>).

  _imgEditable() {
    return !!this.editorEl && this.editorEl.isContentEditable && !this.hasAttribute('readonly') && !this.hasAttribute('disabled');
  }

  _handleEditorClick(e) {
    const img = e.target.closest && e.target.closest('img');
    if (img && this.editorEl.contains(img) && this._imgEditable()) {
      this._selectImg(img, { toolbar: true });
    } else if (this._selImg) {
      this._deselectImg(false);
    }
  }

  // keyboard selection: Shift+Arrow (or any selection) that wraps exactly one image selects it
  _handleEditorKeyUp() {
    if (!this._imgEditable() || this._selImg) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || sel.isCollapsed) return;
    const r = sel.getRangeAt(0);
    const frag = r.cloneContents();
    const imgs = frag.querySelectorAll('img');
    if (imgs.length !== 1 || frag.textContent.trim()) return;
    const src = imgs[0].getAttribute('src');
    const img = [...this.editorEl.querySelectorAll('img')].find(i => i.getAttribute('src') === src && r.intersectsNode(i));
    if (img) this._selectImg(img, { toolbar: false });
  }

  _selectImg(img, { toolbar = false, focusToolbar = false } = {}) {
    if (this._selImg !== img) this._deselectImg(false);
    this._selImg = img;
    // the image itself is the editor selection, so the browser's own Delete/typing act on it
    const sel = window.getSelection();
    const r = document.createRange();
    r.selectNode(img);
    sel.removeAllRanges();
    sel.addRange(r);
    this._ensureImgUi();
    this._imgUi.box.hidden = false;
    if (toolbar) this._openImgToolbar(focusToolbar);
    this._positionImgUi();
    if (!this._imgListening) {
      this._imgListening = true;
      document.addEventListener('pointerdown', this._onImgOutside, true);
      window.addEventListener('scroll', this._onImgReposition, true);
      window.addEventListener('resize', this._onImgReposition);
    }
  }

  _deselectImg(refocus, caretAfter = null) {
    const img = this._selImg;
    this._selImg = null;
    if (this._imgUi) {
      this._imgUi.box.hidden = true;
      this._imgUi.bar.hidden = true;
    }
    if (this._imgListening) {
      this._imgListening = false;
      document.removeEventListener('pointerdown', this._onImgOutside, true);
      window.removeEventListener('scroll', this._onImgReposition, true);
      window.removeEventListener('resize', this._onImgReposition);
    }
    if (refocus && this.editorEl) {
      this.editorEl.focus();
      const anchor = caretAfter || img;
      if (anchor && anchor.isConnected) {
        const sel = window.getSelection();
        const r = document.createRange();
        r.setStartAfter(anchor);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
      }
    }
  }

  _handleImgOutside(e) {
    const t = e.target;
    if (this._imgUi && (this._imgUi.box.contains(t) || this._imgUi.bar.contains(t))) return;
    if (t === this._selImg) return;
    this._deselectImg(false);
  }

  // keys while an image is selected (in the editor). Returns true when handled.
  _handleImgKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this._openImgToolbar(true);
      return true;
    }
    if (e.key === 'Escape') {
      e.preventDefault();
      this._deselectImg(true);
      return true;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      this._removeSelectedImg();
      return true;
    }
    if (e.key === 'Tab' || e.key.startsWith('Arrow') || e.key === 'Shift' || e.metaKey || e.ctrlKey) {
      if (e.key.startsWith('Arrow') && !e.shiftKey) this._deselectImg(false);
      return false;
    }
    // any other key types over the image (native behavior) — drop our selection UI first
    this._deselectImg(false);
    return false;
  }

  _removeSelectedImg() {
    const img = this._selImg;
    if (!img) return;
    const marker = document.createTextNode('');
    img.replaceWith(marker);
    this._deselectImg(true, marker);
    marker.remove();
    this._handleEditorInput();
  }

  _ensureImgUi() {
    if (this._imgUi) return;
    const box = document.createElement('div');
    box.className = 'wc-rich-text-imgsel';
    box.hidden = true;
    box.innerHTML = ['nw', 'ne', 'sw', 'se'].map(c =>
      `<span class="wc-rich-text-imgsel-handle" data-corner="${c}" aria-hidden="true"></span>`).join('');
    const bar = document.createElement('div');
    bar.className = 'wc-rich-text-imgbar';
    bar.hidden = true;
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'Image');
    bar.innerHTML = `
      <div class="wc-rich-text-imgbar-group" role="group" aria-label="Size">
        <button type="button" data-size="0.25" title="Small (25%)">S</button>
        <button type="button" data-size="0.5" title="Medium (50%)">M</button>
        <button type="button" data-size="0.75" title="Large (75%)">L</button>
        <button type="button" data-size="1" title="Original size">Original</button>
        <label class="wc-rich-text-imgbar-field">Width <input type="number" min="16" step="1" class="wc-rich-text-imgbar-width" aria-label="Width in pixels"> px</label>
      </div>
      <div class="wc-rich-text-imgbar-group" role="group" aria-label="Align">
        <button type="button" data-align="left" aria-pressed="false" title="Align left">Left</button>
        <button type="button" data-align="center" aria-pressed="false" title="Center">Center</button>
        <button type="button" data-align="right" aria-pressed="false" title="Align right">Right</button>
      </div>
      <label class="wc-rich-text-imgbar-field wc-rich-text-imgbar-alt">Alt text <input type="text" class="wc-rich-text-imgbar-alttext" placeholder="Describe the image"></label>
      <button type="button" data-remove title="Remove image (Delete)">Remove</button>`;
    // keep them out of the contenteditable: siblings right after the editor
    this.editorEl.after(box, bar);
    this._imgUi = { box, bar, width: bar.querySelector('.wc-rich-text-imgbar-width'), alt: bar.querySelector('.wc-rich-text-imgbar-alttext') };

    box.addEventListener('pointerdown', (e) => this._startImgResize(e));
    bar.addEventListener('mousedown', (e) => { if (!e.target.closest('input')) e.preventDefault(); });
    bar.addEventListener('click', (e) => {
      const b = e.target.closest('button');
      if (!b || !this._selImg) return;
      if (b.dataset.size) this._applyImgWidth(Math.round(this._naturalWidth(this._selImg) * parseFloat(b.dataset.size)));
      else if (b.dataset.align) this._applyImgAlign(b.getAttribute('aria-pressed') === 'true' ? '' : b.dataset.align);
      else if (b.hasAttribute('data-remove')) this._removeSelectedImg();
    });
    this._imgUi.width.addEventListener('change', () => {
      const n = parseInt(this._imgUi.width.value, 10);
      if (this._selImg && n >= 16) this._applyImgWidth(n);
    });
    this._imgUi.width.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this._imgUi.width.dispatchEvent(new Event('change')); }
    });
    this._imgUi.alt.addEventListener('input', () => {
      if (!this._selImg) return;
      this._selImg.setAttribute('alt', this._imgUi.alt.value);
      this._handleEditorInput();
    });
    bar.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {         // close the toolbar, back to the text with the image still selected
        e.preventDefault();
        const img = this._selImg;
        this._imgUi.bar.hidden = true;
        this.editorEl.focus();
        if (img) this._selectImg(img, { toolbar: false });
        return;
      }
      const items = [...bar.querySelectorAll('button, input')];
      const i = items.indexOf(document.activeElement);
      if ((e.key === 'ArrowRight' || e.key === 'ArrowLeft') && document.activeElement.tagName === 'BUTTON') {
        e.preventDefault();
        items[(i + (e.key === 'ArrowRight' ? 1 : -1) + items.length) % items.length].focus();
      }
    });
  }

  _openImgToolbar(focus) {
    if (!this._selImg) return;
    this._ensureImgUi();
    this._syncImgBar();
    this._imgUi.bar.hidden = false;
    this._positionImgUi();
    if (focus) this._imgUi.bar.querySelector('button').focus();
  }

  _syncImgBar() {
    const img = this._selImg, ui = this._imgUi;
    if (!img || !ui) return;
    ui.width.value = Math.round(img.getBoundingClientRect().width) || '';
    ui.alt.value = img.getAttribute('alt') || '';
    const a = this._imgAlign(img);
    ui.bar.querySelectorAll('[data-align]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.align === a)));
  }

  _positionImgUi() {
    const img = this._selImg, ui = this._imgUi;
    if (!img || !ui) return;
    if (!img.isConnected) { this._deselectImg(false); return; }
    const r = img.getBoundingClientRect(), ed = this.editorEl.getBoundingClientRect();
    // hide while the image is scrolled out of the editor's view
    const visible = r.bottom > ed.top && r.top < ed.bottom && r.width > 0;
    ui.box.style.visibility = visible ? '' : 'hidden';
    ui.box.style.left = `${r.left}px`;
    ui.box.style.top = `${r.top}px`;
    ui.box.style.width = `${r.width}px`;
    ui.box.style.height = `${r.height}px`;
    if (!ui.bar.hidden) {
      ui.bar.style.visibility = visible ? '' : 'hidden';
      const bh = ui.bar.offsetHeight, bw = ui.bar.offsetWidth;
      const below = r.bottom + 8 + bh < window.innerHeight;
      ui.bar.style.top = `${below ? r.bottom + 8 : Math.max(8, r.top - bh - 8)}px`;
      ui.bar.style.left = `${Math.max(8, Math.min(window.innerWidth - bw - 8, r.left))}px`;
    }
  }

  _naturalWidth(img) {
    return img.naturalWidth || Math.round(img.getBoundingClientRect().width) || 100;
  }

  // width attribute + inline width / max-width / height:auto — what email programs honor
  _applyImgWidth(px, commit = true) {
    const img = this._selImg;
    if (!img) return;
    const w = Math.max(16, Math.round(px));
    img.setAttribute('width', String(w));
    img.removeAttribute('height');
    img.style.width = `${w}px`;
    img.style.maxWidth = '100%';
    img.style.height = 'auto';
    this._positionImgUi();
    if (commit) { this._syncImgBar(); this._handleEditorInput(); }
  }

  _imgAlign(img) {
    const st = img.style;
    if (st.float === 'left') return 'left';
    if (st.float === 'right') return 'right';
    if (st.display === 'block' && st.marginLeft === 'auto' && st.marginRight === 'auto') return 'center';
    return '';
  }

  // left/right = float + margin (text wraps), center = block + auto margins; '' clears it
  _applyImgAlign(align) {
    const img = this._selImg;
    if (!img) return;
    const st = img.style;
    st.removeProperty('float');
    st.removeProperty('display');
    st.removeProperty('margin');
    if (align === 'center') { st.display = 'block'; st.margin = '0 auto'; }
    else if (align === 'left') { st.float = 'left'; st.margin = '0 12px 8px 0'; }
    else if (align === 'right') { st.float = 'right'; st.margin = '0 0 8px 12px'; }
    if (!img.getAttribute('style')) img.removeAttribute('style');
    this._positionImgUi();
    this._syncImgBar();
    this._handleEditorInput();
  }

  // corner handles: pointer events (mouse, touch, pen), aspect ratio kept (height:auto)
  _startImgResize(e) {
    const h = e.target.closest('.wc-rich-text-imgsel-handle');
    if (!h || !this._selImg || !e.isPrimary) return;
    e.preventDefault();
    const img = this._selImg;
    const sign = h.dataset.corner.endsWith('e') ? 1 : -1;
    const x0 = e.clientX, w0 = img.getBoundingClientRect().width;
    const maxW = this.editorEl.clientWidth - 2;
    h.setPointerCapture(e.pointerId);
    this._imgUi.box.classList.add('is-resizing');
    const move = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      this._applyImgWidth(Math.min(maxW, Math.max(16, w0 + sign * (ev.clientX - x0))), false);
    };
    const up = (ev) => {
      if (ev.pointerId !== e.pointerId) return;
      h.removeEventListener('pointermove', move);
      h.removeEventListener('pointerup', up);
      h.removeEventListener('pointercancel', up);
      this._imgUi.box.classList.remove('is-resizing');
      this._syncImgBar();
      this._handleEditorInput();
    };
    h.addEventListener('pointermove', move);
    h.addEventListener('pointerup', up);
    h.addEventListener('pointercancel', up);
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
        .wc-rich-text { position: relative; }
        .wc-rich-text-uploading {
          position: absolute;
          right: 0.5rem;
          bottom: 0.5rem;
          padding: 0.25rem 0.625rem;
          font-size: 0.8rem;
          border-radius: 0.375rem;
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
          pointer-events: none;
          z-index: 5;
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
        /* image selection: outline + corner handles in body text color (>= 3:1 on every surface) */
        .wc-rich-text-imgsel { position: fixed; z-index: 20; pointer-events: none; box-sizing: border-box;
          outline: 2px solid var(--text-1); outline-offset: 1px; }
        .wc-rich-text-imgsel-handle { position: absolute; width: 12px; height: 12px; box-sizing: border-box;
          background: var(--text-1); border: 2px solid var(--component-bg-color); border-radius: 2px;
          pointer-events: auto; touch-action: none; }
        @media (pointer: coarse) { .wc-rich-text-imgsel-handle { width: 22px; height: 22px; } }
        .wc-rich-text-imgsel-handle[data-corner="nw"] { left: 0; top: 0; transform: translate(-50%, -50%); cursor: nwse-resize; }
        .wc-rich-text-imgsel-handle[data-corner="ne"] { right: 0; top: 0; transform: translate(50%, -50%); cursor: nesw-resize; }
        .wc-rich-text-imgsel-handle[data-corner="sw"] { left: 0; bottom: 0; transform: translate(-50%, 50%); cursor: nesw-resize; }
        .wc-rich-text-imgsel-handle[data-corner="se"] { right: 0; bottom: 0; transform: translate(50%, 50%); cursor: nwse-resize; }
        .wc-rich-text-imgbar { position: fixed; z-index: 21; display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem 0.75rem;
          max-width: min(36rem, calc(100vw - 16px)); padding: 0.375rem 0.5rem; font-size: 0.8125rem;
          background: var(--component-bg-color); color: var(--text-1); border: 1px solid var(--text-8); border-radius: 0.375rem;
          box-shadow: 0 6px 20px rgb(0 0 0 / 0.2); }
        .wc-rich-text-imgbar-group { display: flex; align-items: center; gap: 0.25rem; }
        .wc-rich-text-imgbar-field { display: inline-flex; align-items: center; gap: 0.25rem; color: var(--text-1); }
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
        /* variables (fields): a box per {name}; Insert field; the searchable list */
        .wc-rich-text-btn.wc-rich-text-field-btn { width: auto; gap: 0.3rem; padding: 0 0.5rem; font-size: 0.8rem; }
        .wc-rich-text-field {
          display: inline-block; margin: 0 1px; padding: 0 0.4em; border-radius: 0.35em; line-height: 1.35;
          font-size: 0.86em; font-weight: 600; white-space: nowrap; vertical-align: baseline; cursor: default; user-select: all;
          background: color-mix(in srgb, var(--primary-bg-color) 16%, transparent);
          border: 1px solid color-mix(in srgb, var(--primary-bg-color) 55%, transparent);
        }
        .wc-rich-text-field.unknown {
          background: color-mix(in srgb, var(--danger-color) 14%, transparent); border: 1px dashed var(--danger-color);
        }
        .wc-rich-text-pick {
          position: fixed; z-index: 1000; width: 290px; max-height: 320px; display: flex; flex-direction: column; gap: 0.25rem;
          padding: 0.5rem; border-radius: 0.375rem; background: var(--surface-1); color: var(--text-1);
          border: 1px solid var(--surface-4); box-shadow: 0 8px 28px rgba(0, 0, 0, .35);
        }
        .wc-rich-text-pick-q {
          width: 100%; box-sizing: border-box; padding: 0.25rem 0.375rem; border-radius: 0.25rem; font: inherit; font-size: 0.85rem;
          color: var(--component-color); background: var(--component-bg-color); border: 1px solid var(--component-border-color);
        }
        .wc-rich-text-pick-list { overflow-y: auto; min-height: 0; display: flex; flex-direction: column; }
        .wc-rich-text-pick-group { padding: 0.375rem 0.375rem 0.125rem; font-size: 0.7rem; text-transform: uppercase; letter-spacing: .04em; color: var(--text-5, var(--text-3)); }
        .wc-rich-text-pick-item {
          display: flex; justify-content: space-between; align-items: baseline; gap: 0.5rem; width: 100%; text-align: left;
          padding: 0.25rem 0.375rem; border: 0; border-radius: 0.25rem; background: transparent; color: inherit; cursor: pointer; font-size: 0.85rem;
        }
        .wc-rich-text-pick-item small { color: var(--text-5, var(--text-3)); }
        .wc-rich-text-pick-item:hover, .wc-rich-text-pick-item.on { background: color-mix(in srgb, var(--primary-bg-color) 18%, transparent); }
        .wc-rich-text-pick-none { padding: 0.25rem 0.375rem; font-size: 0.85rem; color: var(--text-5, var(--text-3)); }
      }
    `.trim();
    this.loadStyle('wc-rich-text-style', style);
    // image toolbar buttons + inputs: unlayered and tightly scoped, because the wc.ui layer styles bare
    // buttons/inputs and outranks wc.usage (same pattern as wc-record-lookup / wc-zoom)
    this.loadStyle('wc-rich-text-imgbar-style', `
      .wc-rich-text-imgbar button { padding: 0.125rem 0.5rem; min-height: 1.75rem; border: 1px solid var(--text-9); border-radius: 0.25rem;
        background: transparent; color: var(--text-1); font: inherit; cursor: pointer; }
      .wc-rich-text-imgbar button:hover { background: var(--surface-3); }
      .wc-rich-text-imgbar button[aria-pressed="true"] { background: var(--text-1); color: var(--component-bg-color); border-color: var(--text-1); }
      .wc-rich-text-imgbar button:focus-visible, .wc-rich-text-imgbar input:focus-visible { outline: 2px solid var(--text-1); outline-offset: 1px; }
      .wc-rich-text-imgbar input { width: 4.5rem; padding: 0.125rem 0.375rem; min-height: 1.75rem; font: inherit; font-size: 0.8125rem;
        background: var(--component-bg-color); color: var(--text-1); border: 1px solid var(--text-9); border-radius: 0.25rem; }
      .wc-rich-text-imgbar .wc-rich-text-imgbar-alttext { width: 12rem; }
      .wc-rich-text-imgbar input::placeholder { color: var(--text-5); }
    `);
  }
}

customElements.define(WcRichText.is, WcRichText);
export { WcRichText };
