/**
 *
 *  Name: wc-icon-picker
 *  Usage:
 *    A form-associated, searchable visual icon picker. The trigger shows the selected icon
 *    (preview + name); clicking it opens a popover with a search box and a grid of icon previews
 *    (rendered with wc-fa-icon). Typing filters by name; clicking a glyph selects it. Submits the
 *    icon NAME string under `name` — exactly what wc-fa-icon / _app.icon / navigation_items[].icon
 *    expect, so the standard save path stores it with no transform.
 *
 *    <wc-icon-picker name="icon" value="cart-shopping" lbl-label="App Icon"
 *                    variant="solid" placeholder="Search icons…" columns="8" clearable required>
 *    </wc-icon-picker>
 *
 *  The icon list is sourced INTERNALLY from Wave's own bundle manifest
 *  (WcIconConfig.bundleBaseUrl/<variant>-icons.json) — the host never supplies names.
 *
 *  Attributes:
 *    name (required), value (icon name), lbl-label, variant (solid|regular|light|thin|duotone…; default solid),
 *    placeholder, columns (grid columns, default 8), clearable, required, disabled
 *
 *  Events (bubbling, composed):
 *    wciconpickerchange — on select/clear; detail { value }  (legacy alias wc-icon-picker:change)
 *
 *  Performance: the panel is appended to <body> (never clipped by overflow ancestors) and
 *  positioned fixed; preview SVGs are lazy-rendered via IntersectionObserver so opening/filtering
 *  stays smooth across the full ~579-icon set. htmx-safe; FACE setFormValue under `name`.
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';
import { WcIconConfig } from './wc-icon-config.js';

class WcIconPicker extends WcBaseFormComponent {
  static get is() {
    return 'wc-icon-picker';
  }

  // variant -> Promise<string[]> (shared across instances)
  static _lists = new Map();

  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'lbl-label', 'variant', 'placeholder',
      'columns', 'clearable', 'required', 'disabled'];
  }

  constructor() {
    super();
    this._value = '';
    this._open = false;
    this._list = [];
    this._observer = null;

    this._onTriggerClick = this._handleTriggerClick.bind(this);
    this._onClearClick = this._handleClearClick.bind(this);
    this._onSearchInput = this._handleSearchInput.bind(this);
    this._onPanelClick = this._handlePanelClick.bind(this);
    this._onKeydown = this._handleKeydown.bind(this);
    this._onDocPointer = this._handleDocPointer.bind(this);
    this._onReposition = () => { if (this._open) this._positionPanel(); };

    const compEl = this.querySelector(':scope > .wc-icon-picker');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-icon-picker');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._value = this.getAttribute('value') || '';
    this._internals.setFormValue(this._value);
    this._renderTrigger();
    this._updateValidity();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._closePanel(true);   // tear down the body-appended panel
    this._unWireEvents();
  }

  // ---- Value contract (FACE) ------------------------------------------------

  get value() { return this._value; }
  set value(v) {
    this._value = v == null ? '' : String(v);
    this._internals.setFormValue(this._value);
    this._renderTrigger();
    this._updateValidity();
  }

  get variant() { return this.getAttribute('variant') || 'solid'; }
  get clearable() { return this.hasAttribute('clearable') && !this.hasAttribute('required'); }

  // ---- Lifecycle ------------------------------------------------------------

  _render() {
    super._render();
    const built = this.componentElement.querySelector(':scope > .wc-icon-picker-trigger');
    if (!built) {
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
    }
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  _buildSkeleton() {
    const labelText = this.getAttribute('lbl-label') || '';
    if (labelText) {
      const lbl = document.createElement('label');
      lbl.textContent = labelText;
      this.componentElement.appendChild(lbl);
    }

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.classList.add('wc-icon-picker-trigger');
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    if (this.hasAttribute('disabled')) trigger.disabled = true;
    this.componentElement.appendChild(trigger);
    this.triggerEl = trigger;
  }

  _renderTrigger() {
    if (!this.triggerEl) return;
    const v = this._value;
    const placeholder = this.getAttribute('placeholder') || 'Select an icon…';
    this.triggerEl.innerHTML = '';

    const preview = document.createElement('span');
    preview.classList.add('wc-icon-picker-preview');
    if (v) {
      const icon = document.createElement('wc-fa-icon');
      icon.setAttribute('name', v);
      icon.setAttribute('icon-style', this.variant);
      icon.setAttribute('size', '1.1rem');
      preview.appendChild(icon);
    } else {
      preview.classList.add('is-empty');
    }
    this.triggerEl.appendChild(preview);

    const text = document.createElement('span');
    text.classList.add('wc-icon-picker-text');
    text.textContent = v || placeholder;
    if (!v) text.classList.add('is-placeholder');
    this.triggerEl.appendChild(text);

    if (this.clearable && v) {
      const clear = document.createElement('span');
      clear.classList.add('wc-icon-picker-clear');
      clear.setAttribute('role', 'button');
      clear.setAttribute('aria-label', 'Clear');
      clear.innerHTML = '&times;';
      this.triggerEl.appendChild(clear);
    }

    const chev = document.createElement('span');
    chev.classList.add('wc-icon-picker-chevron');
    chev.textContent = '▾';
    this.triggerEl.appendChild(chev);
  }

  // ---- Icon list (internal) -------------------------------------------------

  _loadList(variant) {
    if (!WcIconPicker._lists.has(variant)) {
      const url = `${WcIconConfig.bundleBaseUrl}/${variant}-icons.json`;
      const promise = fetch(url)
        .then(r => r.ok ? r.json() : {})
        .then(bundle => Object.keys(bundle || {}).sort())
        .catch(err => { console.warn(`[wc-icon-picker] failed to load ${variant} bundle`, err); return []; });
      WcIconPicker._lists.set(variant, promise);
    }
    return WcIconPicker._lists.get(variant);
  }

  // ---- Open / close ---------------------------------------------------------

  async _openPanel() {
    if (this._open || this.hasAttribute('disabled')) return;
    this._open = true;
    this.triggerEl.setAttribute('aria-expanded', 'true');

    const panel = document.createElement('div');
    panel.classList.add('wc-icon-picker-panel');
    panel.style.setProperty('--wc-ip-cols', parseInt(this.getAttribute('columns'), 10) || 8);
    // mirror theme classes so the popover honors the active theme even though it's on <body>
    panel.className += ' ' + this._themeClasses();

    const search = document.createElement('input');
    search.type = 'text';
    search.classList.add('wc-icon-picker-search');
    search.placeholder = this.getAttribute('placeholder') || 'Search icons…';
    panel.appendChild(search);

    const grid = document.createElement('div');
    grid.classList.add('wc-icon-picker-grid');
    panel.appendChild(grid);

    const status = document.createElement('div');
    status.classList.add('wc-icon-picker-status');
    status.textContent = 'Loading…';
    panel.appendChild(status);

    document.body.appendChild(panel);
    this.panelEl = panel;
    this.searchEl = search;
    this.gridEl = grid;
    this.statusEl = status;

    panel.addEventListener('click', this._onPanelClick);
    panel.addEventListener('keydown', this._onKeydown);
    search.addEventListener('input', this._onSearchInput);

    this._positionPanel();
    window.addEventListener('resize', this._onReposition);
    window.addEventListener('scroll', this._onReposition, true);
    document.addEventListener('pointerdown', this._onDocPointer, true);

    this._list = await this._loadList(this.variant);
    if (!this._open) return; // closed while loading
    this.statusEl.remove();
    this._renderGrid('');
    search.focus();
  }

  _closePanel(silent) {
    if (this._observer) { this._observer.disconnect(); this._observer = null; }
    window.removeEventListener('resize', this._onReposition);
    window.removeEventListener('scroll', this._onReposition, true);
    document.removeEventListener('pointerdown', this._onDocPointer, true);
    if (this.panelEl) {
      this.panelEl.removeEventListener('click', this._onPanelClick);
      this.panelEl.removeEventListener('keydown', this._onKeydown);
      this.panelEl.remove();
      this.panelEl = null;
    }
    this._open = false;
    if (this.triggerEl) this.triggerEl.setAttribute('aria-expanded', 'false');
    if (!silent && this.triggerEl) this.triggerEl.focus();
  }

  _themeClasses() {
    // Carry forward theme-* / .dark / .crisp from the html element so the body-level panel matches.
    const out = [];
    const html = document.documentElement;
    html.classList.forEach(c => { if (c.startsWith('theme-') || c === 'dark' || c === 'crisp') out.push(c); });
    return out.join(' ');
  }

  _positionPanel() {
    if (!this.panelEl || !this.triggerEl) return;
    const r = this.triggerEl.getBoundingClientRect();
    const width = Math.max(r.width, 320);
    const maxH = 360;
    let left = Math.min(r.left, window.innerWidth - width - 8);
    left = Math.max(8, left);
    let top = r.bottom + 4;
    if (top + maxH > window.innerHeight && r.top - maxH - 4 > 0) {
      top = r.top - maxH - 4; // flip above
    }
    this.panelEl.style.position = 'fixed';
    this.panelEl.style.left = `${left}px`;
    this.panelEl.style.top = `${top}px`;
    this.panelEl.style.width = `${width}px`;
  }

  // ---- Grid (filter + lazy render) ------------------------------------------

  _renderGrid(filter) {
    if (!this.gridEl) return;
    const q = (filter || '').trim().toLowerCase();
    const matches = q ? this._list.filter(n => n.includes(q)) : this._list;

    if (this._observer) this._observer.disconnect();
    this.gridEl.innerHTML = '';

    if (!matches.length) {
      const empty = document.createElement('div');
      empty.classList.add('wc-icon-picker-empty');
      empty.textContent = 'No icons match';
      this.gridEl.appendChild(empty);
      return;
    }

    const frag = document.createDocumentFragment();
    matches.forEach(name => {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.classList.add('wc-icon-picker-cell');
      cell.dataset.name = name;
      cell.title = name;
      cell.setAttribute('aria-label', name);
      if (name === this._value) cell.classList.add('is-selected');
      const cap = document.createElement('span');
      cap.classList.add('wc-icon-picker-cap');
      cap.textContent = name;
      cell.appendChild(cap);
      frag.appendChild(cell);
    });
    this.gridEl.appendChild(frag);

    // Lazy-render the preview SVGs only as cells scroll into view.
    this._observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const cell = entry.target;
        this._observer.unobserve(cell);
        if (cell.querySelector('wc-fa-icon')) return;
        const icon = document.createElement('wc-fa-icon');
        icon.setAttribute('name', cell.dataset.name);
        icon.setAttribute('icon-style', this.variant);
        icon.setAttribute('size', '1.25rem');
        cell.insertBefore(icon, cell.firstChild);
      });
    }, { root: this.gridEl, rootMargin: '120px' });
    this.gridEl.querySelectorAll('.wc-icon-picker-cell').forEach(c => this._observer.observe(c));
  }

  // ---- Selection ------------------------------------------------------------

  _select(name) {
    this._value = name;
    this._internals.setFormValue(this._value);
    this._renderTrigger();
    this._updateValidity();
    this._closePanel();
    this._emitChange();
  }

  _clear() {
    this._value = '';
    this._internals.setFormValue('');
    this._renderTrigger();
    this._updateValidity();
    this._emitChange();
  }

  _emitChange() {
    this._emitEvent('wciconpickerchange', 'wc-icon-picker:change', {
      bubbles: true, composed: true, detail: { value: this._value }
    });
  }

  _updateValidity() {
    if (this.hasAttribute('required') && !this._value) {
      this._internals.setValidity({ valueMissing: true }, 'Please choose an icon.', this.triggerEl || this);
    } else {
      this._internals.setValidity({});
    }
  }

  // ---- Interaction ----------------------------------------------------------

  _handleTriggerClick(e) {
    if (e.target.closest('.wc-icon-picker-clear')) { e.preventDefault(); this._clear(); return; }
    if (this._open) this._closePanel(); else this._openPanel();
  }

  _handleClearClick() { this._clear(); }

  _handleSearchInput() { this._renderGrid(this.searchEl.value); }

  _handlePanelClick(e) {
    const cell = e.target.closest('.wc-icon-picker-cell');
    if (cell) this._select(cell.dataset.name);
  }

  _handleDocPointer(e) {
    // close on outside click (panel is on body, trigger is in the component)
    if (this.panelEl && this.panelEl.contains(e.target)) return;
    if (this.componentElement.contains(e.target)) return;
    this._closePanel(true);
  }

  _handleKeydown(e) {
    if (e.key === 'Escape') { e.preventDefault(); this._closePanel(); return; }
    const cells = Array.from(this.gridEl ? this.gridEl.querySelectorAll('.wc-icon-picker-cell') : []);
    if (!cells.length) return;
    const cols = parseInt(this.getAttribute('columns'), 10) || 8;
    const inGrid = e.target.classList.contains('wc-icon-picker-cell');
    const idx = inGrid ? cells.indexOf(e.target) : -1;

    if (e.target === this.searchEl && e.key === 'ArrowDown') {
      e.preventDefault(); cells[0].focus(); return;
    }
    if (!inGrid) return;
    let next = null;
    if (e.key === 'ArrowRight') next = idx + 1;
    else if (e.key === 'ArrowLeft') next = idx - 1;
    else if (e.key === 'ArrowDown') next = idx + cols;
    else if (e.key === 'ArrowUp') next = (idx - cols >= 0) ? idx - cols : -2; // -2 → back to search
    else if (e.key === 'Enter') { e.preventDefault(); this._select(e.target.dataset.name); return; }
    else return;
    e.preventDefault();
    if (next === -2) { this.searchEl.focus(); return; }
    if (next >= 0 && next < cells.length) cells[next].focus();
  }

  // ---- Wiring ---------------------------------------------------------------

  _wireEvents() {
    this.formElement = null; // the search input must not be treated as the form value
    super._wireEvents();
    if (this.triggerEl) {
      this.triggerEl.removeEventListener('click', this._onTriggerClick);
      this.triggerEl.addEventListener('click', this._onTriggerClick);
    }
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.triggerEl) this.triggerEl.removeEventListener('click', this._onTriggerClick);
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'value') {
      this._value = newValue || '';
      this._internals.setFormValue(this._value);
      this._renderTrigger();
      this._updateValidity();
      return;
    }
    if (attrName === 'required') { this._renderTrigger(); this._updateValidity(); return; }
    if (['variant', 'placeholder', 'columns', 'clearable', 'lbl-label', 'disabled'].includes(attrName)) {
      this._closePanel(true);
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
      this._wireEvents();
      this._renderTrigger();
      return;
    }
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    super._handleAttributeChange(attrName, newValue);
  }

  _applyStyle() {
    const style = `
      wc-icon-picker { display: contents; }

      @layer wc.usage {
        .wc-icon-picker { display: flex; flex-direction: column; gap: 0.375rem; }
        .wc-icon-picker > label { font-weight: 500; }
        .wc-icon-picker-trigger {
          display: flex; align-items: center; gap: 0.5rem; width: 100%;
          padding: 0.375rem 0.625rem;
          background-color: var(--surface-3);
          border: 1px solid var(--surface-4);
          border-radius: 0.375rem;
          color: var(--text-1); cursor: pointer; text-align: left;
        }
        .wc-icon-picker-trigger:focus-visible { outline: var(--primary-bg-color) solid 2px; outline-offset: 1px; }
        .wc-icon-picker-preview { display: inline-flex; width: 1.25rem; justify-content: center; }
        .wc-icon-picker-preview.is-empty::before {
          content: ''; width: 1.1rem; height: 1.1rem; border: 1px dashed var(--surface-5); border-radius: 0.25rem;
        }
        .wc-icon-picker-text { flex: 1 1 auto; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          font-family: 'SF Mono','Fira Code',monospace; font-size: 0.85rem; }
        .wc-icon-picker-text.is-placeholder { color: var(--text-3, var(--component-alt-color)); font-family: inherit; }
        .wc-icon-picker-clear { padding: 0 0.25rem; cursor: pointer; opacity: 0.6; }
        .wc-icon-picker-clear:hover { opacity: 1; }
        .wc-icon-picker-chevron { opacity: 0.6; font-size: 0.75rem; }
        wc-icon-picker[required] .wc-icon-picker > label::after { content: ' *'; font-weight: bold; }

        /* Panel lives on <body> — style by class (not descendant of wc-icon-picker) */
        .wc-icon-picker-panel {
          position: fixed; z-index: 10000;
          display: flex; flex-direction: column; gap: 0.5rem;
          max-height: 360px; padding: 0.5rem;
          background-color: var(--surface-2, var(--card-bg-color));
          border: 1px solid var(--surface-4);
          border-radius: 0.5rem;
          box-shadow: 0 8px 28px rgba(0,0,0,0.28);
          color: var(--text-1);
        }
        .wc-icon-picker-search {
          width: 100%; padding: 0.375rem 0.5rem;
          background-color: var(--surface-3); border: 1px solid var(--surface-4);
          border-radius: 0.25rem; color: var(--text-1);
        }
        .wc-icon-picker-grid {
          display: grid; grid-template-columns: repeat(var(--wc-ip-cols, 8), 1fr);
          gap: 0.25rem; overflow-y: auto; flex: 1 1 auto; min-height: 0;
        }
        .wc-icon-picker-cell {
          display: flex; flex-direction: column; align-items: center; gap: 0.125rem;
          padding: 0.375rem 0.125rem;
          background: none; border: 1px solid transparent; border-radius: 0.375rem;
          color: var(--text-1); cursor: pointer; min-width: 0;
        }
        .wc-icon-picker-cell:hover { background-color: var(--surface-3); }
        .wc-icon-picker-cell:focus-visible { outline: var(--primary-bg-color) solid 2px; outline-offset: -1px; }
        .wc-icon-picker-cell.is-selected {
          border-color: var(--primary-bg-color);
          background-color: color-mix(in oklab, var(--primary-bg-color) 14%, transparent);
        }
        .wc-icon-picker-cap {
          font-size: 0.55rem; line-height: 1.1; max-width: 100%;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
          color: var(--text-3, var(--component-alt-color));
        }
        .wc-icon-picker-status, .wc-icon-picker-empty {
          padding: 1rem; text-align: center; color: var(--text-3, var(--component-alt-color));
        }
      }
    `.trim();
    this.loadStyle('wc-icon-picker-style', style);
  }
}

customElements.define(WcIconPicker.is, WcIconPicker);
export { WcIconPicker };
