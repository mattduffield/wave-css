/**
 *
 *  Name: wc-zoom
 *  Usage:
 *    A compact status-bar zoom control: [Fit page][Fit width] − ──●── + [ 92% ]
 *    The slider is logarithmic with 100% at its midpoint (both ends stay usable); clicking the
 *    percentage opens a small menu of presets + Fit page / Fit width; the field also accepts a
 *    typed value. Optional Ctrl/⌘ + wheel, trackpad pinch and Ctrl/⌘ shortcuts over a target.
 *
 *    <wc-zoom value="92" min="10" max="800" fit-buttons target="#canvas"
 *             steps="[25,50,75,100,125,150,200,300,400]"></wc-zoom>
 *
 *  Attributes:
 *    value        zoom percent (default 100); reflected when the user changes it
 *    min / max    bounds in percent (default 10 / 800)
 *    steps        JSON array of preset stops for −/+ and the menu
 *    fit-buttons  show Fit page / Fit width buttons
 *    target       selector of the zoomable surface. Enables Ctrl/⌘ + wheel and pinch over it
 *                 (the browser's own page zoom is prevented there) and the shortcuts
 *                 Ctrl/⌘ + = / − / 0 (fit page) / 1 (100%).
 *
 *  Properties / methods:
 *    value (get/set percent; setting never fires an event), zoomIn(), zoomOut(), fit(mode)
 *
 *  Events (bubbling, composed; also broadcast through wc.EventHub with detail.custom):
 *    wczoomchange { value, previous, source, anchorX?, anchorY? }  (legacy wc-zoom:change)
 *      source: slider | button | input | menu | wheel | key. Wheel/pinch add anchorX/anchorY,
 *      the pointer position in the target's own coordinates (px from its top-left corner,
 *      not including its scroll offset), so the host can zoom toward the cursor.
 *    wczoomfit { mode: 'page' | 'width' }  (legacy wc-zoom:fit) — the host computes the fitted
 *      percentage and sets `value` back.
 */

import { WcBaseComponent } from './wc-base-component.js';
import { WcPopover } from '../utils/wc-popover.js';

const DEFAULT_STEPS = [25, 50, 75, 100, 125, 150, 200, 300, 400];
const SLIDER_MAX = 1000;

if (!customElements.get('wc-zoom')) {
  class WcZoom extends WcBaseComponent {
    static get is() {
      return 'wc-zoom';
    }

    static get observedAttributes() {
      return ['id', 'class', 'value', 'min', 'max', 'steps', 'fit-buttons', 'target'];
    }

    constructor() {
      super();
      this._value = 100;
      this._target = null;
      this._gestureStart = 100;
      this._menuIndex = -1;

      this._onClick = this._handleClick.bind(this);
      this._onSliderInput = this._handleSliderInput.bind(this);
      this._onFieldKeydown = this._handleFieldKeydown.bind(this);
      this._onFieldFocus = () => this._field.select();
      this._onFieldBlur = this._handleFieldBlur.bind(this);
      this._onWheel = this._handleWheel.bind(this);
      this._onGestureStart = this._handleGestureStart.bind(this);
      this._onGestureChange = this._handleGestureChange.bind(this);
      this._onKeydown = this._handleShortcut.bind(this);
      this._onMenuClick = this._handleMenuClick.bind(this);
      this._onSwap = () => { if (!this._target || !this._target.isConnected) this._wireTarget(); };
      this._onMenuKeydown = this._handleMenuKeydown.bind(this);
      this._popover = new WcPopover(this, {
        matchWidth: false,
        align: 'end',
        onClose: (reason) => {
          this._field?.setAttribute('aria-expanded', 'false');
          if (reason === 'escape') this._field?.focus();
        },
      });

      const compEl = this.querySelector(':scope > .wc-zoom');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-zoom');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._wireEvents();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._popover.close('disconnect');
      this._unWireEvents();
    }

    // ---- Public API ---------------------------------------------------------

    get value() { return this._value; }
    set value(v) { this._set(v, null); }

    get min() { return this._attrNum('min', 10); }
    get max() { return Math.max(this.min, this._attrNum('max', 800)); }

    get steps() {
      let list = DEFAULT_STEPS;
      const raw = this.getAttribute('steps');
      if (raw) {
        try {
          const v = JSON.parse(raw);
          if (Array.isArray(v)) list = v.map(Number).filter(Number.isFinite);
        } catch (err) {
          console.warn('[wc-zoom] invalid steps JSON', err);
        }
      }
      return [...new Set(list)].filter(s => s >= this.min && s <= this.max).sort((a, b) => a - b);
    }

    zoomIn(source = 'button') {
      const next = this.steps.find(s => s > this._value + 0.5);
      this._set(next ?? this.max, source);
    }

    zoomOut(source = 'button') {
      const prev = [...this.steps].reverse().find(s => s < this._value - 0.5);
      this._set(prev ?? this.min, source);
    }

    fit(mode) {
      const m = mode === 'width' ? 'width' : 'page';
      this._popover.close('fit');
      this._notify('wczoomfit', 'wc-zoom:fit', { mode: m });
    }

    getDesignerHTML() {
      return '';
    }

    // ---- Lifecycle ----------------------------------------------------------

    _render() {
      super._render();
      if (!this.componentElement.querySelector(':scope > .wc-zoom-slider')) {
        this._build();
      } else {
        this._bindParts();
      }
      this._value = this._clamp(this._attrNum('value', 100));
      this._sync();
    }

    _build() {
      const el = this.componentElement;
      el.innerHTML = '';
      el.setAttribute('role', 'group');
      el.setAttribute('aria-label', 'Zoom');
      const btn = (cls, label, text) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = cls;
        b.setAttribute('aria-label', label);
        b.textContent = text;
        return b;
      };
      const fits = document.createElement('span');
      fits.className = 'wc-zoom-fits';
      fits.append(btn('wc-zoom-fit', 'Fit page', 'Fit page'), btn('wc-zoom-fit', 'Fit width', 'Fit width'));
      fits.children[0].dataset.mode = 'page';
      fits.children[1].dataset.mode = 'width';

      const out = btn('wc-zoom-step', 'Zoom out', '−');
      out.dataset.dir = 'out';
      const slider = document.createElement('input');
      slider.type = 'range';
      slider.className = 'wc-zoom-slider';
      slider.min = '0';
      slider.max = String(SLIDER_MAX);
      slider.step = '10';
      slider.setAttribute('aria-label', 'Zoom level');
      const inn = btn('wc-zoom-step', 'Zoom in', '+');
      inn.dataset.dir = 'in';

      const field = document.createElement('input');
      field.type = 'text';
      field.className = 'wc-zoom-field';
      field.inputMode = 'numeric';
      field.autocomplete = 'off';
      field.spellcheck = false;
      field.setAttribute('aria-label', 'Zoom percentage');
      field.setAttribute('aria-haspopup', 'menu');
      field.setAttribute('aria-expanded', 'false');

      el.append(fits, out, slider, inn, field);
      this._bindParts();
    }

    _bindParts() {
      const el = this.componentElement;
      this._fits = el.querySelector('.wc-zoom-fits');
      this._slider = el.querySelector('.wc-zoom-slider');
      this._field = el.querySelector('.wc-zoom-field');
      this._fits.hidden = !this.hasAttribute('fit-buttons');
    }

    _handleAttributeChange(attrName, newValue, oldValue) {
      switch (attrName) {
        case 'value':
          if (newValue !== null && Number(newValue) !== this._value) this._set(newValue, null, false);
          break;
        case 'min':
        case 'max':
        case 'steps':
          this._value = this._clamp(this._value);
          this._sync();
          break;
        case 'fit-buttons':
          if (this._fits) this._fits.hidden = newValue === null;
          break;
        case 'target':
          this._wireTarget();
          break;
        case 'id':
          break;
        default:
          super._handleAttributeChange(attrName, newValue, oldValue);
      }
    }

    // ---- Value --------------------------------------------------------------

    _set(v, source, reflect = true, extra = {}) {
      const n = parseFloat(v);
      if (!Number.isFinite(n)) { this._sync(); return; }
      const next = this._clamp(Math.round(n * 10) / 10);
      const previous = this._value;
      this._value = next;
      this._sync();
      if (reflect && this.getAttribute('value') !== String(next)) this.setAttribute('value', String(next));
      if (source && next !== previous) {
        this._notify('wczoomchange', 'wc-zoom:change', { value: next, previous, source, ...extra });
      }
    }

    _clamp(v) {
      return Math.min(this.max, Math.max(this.min, v));
    }

    _sync() {
      if (!this._slider) return;
      this._slider.value = String(Math.round(this._toSlider(this._value)));
      this._slider.setAttribute('aria-valuetext', `${Math.round(this._value)}%`);
      if (document.activeElement !== this._field) this._field.value = `${Math.round(this._value)}%`;
      const [out, inn] = this.componentElement.querySelectorAll('.wc-zoom-step');
      out.disabled = this._value <= this.min;
      inn.disabled = this._value >= this.max;
    }

    // Piecewise-logarithmic: [min, 100] fills the left half, [100, max] the right, so 100% is
    // the midpoint. If 100 is outside the range, a single log scale is used.
    _toSlider(v) {
      const { min, max } = this;
      const L = Math.log;
      if (min < 100 && max > 100) {
        return v <= 100
          ? (L(v / min) / L(100 / min)) * (SLIDER_MAX / 2)
          : SLIDER_MAX / 2 + (L(v / 100) / L(max / 100)) * (SLIDER_MAX / 2);
      }
      return max === min ? 0 : (L(v / min) / L(max / min)) * SLIDER_MAX;
    }

    _fromSlider(t) {
      const { min, max } = this;
      if (min < 100 && max > 100) {
        return t <= SLIDER_MAX / 2
          ? min * Math.pow(100 / min, t / (SLIDER_MAX / 2))
          : 100 * Math.pow(max / 100, (t - SLIDER_MAX / 2) / (SLIDER_MAX / 2));
      }
      return min * Math.pow(max / min, t / SLIDER_MAX);
    }

    _attrNum(attr, fallback) {
      const v = parseFloat(this.getAttribute(attr));
      return Number.isFinite(v) && v > 0 ? v : fallback;
    }

    // ---- Controls -----------------------------------------------------------

    _handleClick(e) {
      const step = e.target.closest('.wc-zoom-step');
      if (step) {
        if (step.dataset.dir === 'in') this.zoomIn('button'); else this.zoomOut('button');
        return;
      }
      const fitBtn = e.target.closest('.wc-zoom-fit');
      if (fitBtn) { this.fit(fitBtn.dataset.mode); return; }
      if (e.target === this._field && !this._popover.isOpen) this._openMenu();
    }

    _handleSliderInput() {
      let v = this._fromSlider(Number(this._slider.value));
      // Snap to a preset when the thumb is within 1.5% of travel of it.
      const t = Number(this._slider.value);
      const near = this.steps.find(s => Math.abs(this._toSlider(s) - t) <= SLIDER_MAX * 0.015);
      if (near != null) v = near;
      this._set(Math.round(v), 'slider');
    }

    _handleFieldKeydown(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (this._popover.isOpen && this._menuIndex >= 0) { this._activateMenuItem(this._menuIndex); return; }
        this._set(this._field.value.replace('%', ''), 'input');
        this._popover.close('commit');
        this._field.value = `${Math.round(this._value)}%`;
        this._field.select();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!this._popover.isOpen) this._openMenu();
        this._moveMenu(e.key === 'ArrowDown' ? 1 : -1);
      } else if (e.key === 'Escape' && this._popover.isOpen) {
        e.preventDefault();
        this._popover.close('escape');
      } else if (e.key.length === 1 && this._popover.isOpen) {
        this._highlight(-1); // typing a value: Enter applies the text, not a menu item
      }
    }

    _handleFieldBlur() {
      // Commit a typed value when focus leaves (unless it moved into the menu).
      setTimeout(() => {
        if (this._popover.panel?.contains(document.activeElement)) return;
        const typed = parseFloat(this._field.value);
        if (Number.isFinite(typed) && typed !== Math.round(this._value)) this._set(typed, 'input');
        this._field.value = `${Math.round(this._value)}%`;
      }, 0);
    }

    // ---- Menu ---------------------------------------------------------------

    _openMenu() {
      const panel = document.createElement('div');
      panel.className = 'wc-zoom-menu';
      panel.setAttribute('role', 'menu');
      panel.setAttribute('aria-label', 'Zoom presets');
      const item = (label, data) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'wc-zoom-menu-item';
        b.tabIndex = -1;
        b.textContent = label;
        Object.assign(b.dataset, data);
        return b;
      };
      [...this.steps].reverse().forEach(s => {
        const b = item(`${s}%`, { value: String(s) });
        b.setAttribute('role', 'menuitemradio');
        b.setAttribute('aria-checked', String(Math.round(this._value) === s));
        panel.appendChild(b);
      });
      const sep = document.createElement('div');
      sep.className = 'wc-zoom-menu-sep';
      sep.setAttribute('role', 'separator');
      panel.appendChild(sep);
      const fp = item('Fit page', { mode: 'page' });
      const fw = item('Fit width', { mode: 'width' });
      fp.setAttribute('role', 'menuitem');
      fw.setAttribute('role', 'menuitem');
      panel.append(fp, fw);
      panel.addEventListener('click', this._onMenuClick);
      panel.addEventListener('keydown', this._onMenuKeydown);
      this._popover.open(this._field, panel);
      this._field.setAttribute('aria-expanded', 'true');
      this._menuIndex = -1;
    }

    _menuItems() {
      return this._popover.panel ? Array.from(this._popover.panel.querySelectorAll('.wc-zoom-menu-item')) : [];
    }

    _moveMenu(dir) {
      const items = this._menuItems();
      if (!items.length) return;
      let i = this._menuIndex;
      if (i < 0) {
        const current = items.findIndex(b => b.getAttribute('aria-checked') === 'true');
        i = current >= 0 ? current : (dir > 0 ? -1 : items.length);
        if (current >= 0) { this._highlight(current); return; }
      }
      this._highlight((i + dir + items.length) % items.length);
    }

    _highlight(i) {
      this._menuIndex = i;
      this._menuItems().forEach((b, idx) => b.classList.toggle('is-active', idx === i));
      if (i >= 0) this._menuItems()[i]?.scrollIntoView({ block: 'nearest' });
    }

    _activateMenuItem(i) {
      const b = this._menuItems()[i];
      if (!b) return;
      if (b.dataset.mode) { this.fit(b.dataset.mode); return; }
      this._popover.close('pick');
      this._set(b.dataset.value, 'menu');
      this._field.value = `${Math.round(this._value)}%`;
    }

    _handleMenuClick(e) {
      const b = e.target.closest('.wc-zoom-menu-item');
      if (!b) return;
      this._activateMenuItem(this._menuItems().indexOf(b));
      this._field.blur();
    }

    _handleMenuKeydown(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        this._moveMenu(e.key === 'ArrowDown' ? 1 : -1);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        this._activateMenuItem(this._menuIndex);
      }
    }

    // ---- Target: wheel, pinch, shortcuts -------------------------------------

    _resolveTarget() {
      const sel = this.getAttribute('target');
      if (!sel) return null;
      try { return document.querySelector(sel); } catch (err) { return null; }
    }

    _wireTarget() {
      if (this._target) {
        this._target.removeEventListener('wheel', this._onWheel);
        this._target.removeEventListener('gesturestart', this._onGestureStart);
        this._target.removeEventListener('gesturechange', this._onGestureChange);
        this._target = null;
      }
      document.removeEventListener('keydown', this._onKeydown);
      if (!this.isConnected) return;
      if (this.getAttribute('target')) document.addEventListener('keydown', this._onKeydown);
      const target = this._resolveTarget();
      if (!target) {
        // Target not in the DOM yet (rendered after the status bar): try again next frame.
        if (this.getAttribute('target') && !this._retry) {
          this._retry = requestAnimationFrame(() => { this._retry = 0; if (!this._target) this._wireTarget(); });
        }
        return;
      }
      this._target = target;
      target.addEventListener('wheel', this._onWheel, { passive: false });
      target.addEventListener('gesturestart', this._onGestureStart, { passive: false });
      target.addEventListener('gesturechange', this._onGestureChange, { passive: false });
    }

    _anchor(e) {
      const r = this._target.getBoundingClientRect();
      return { anchorX: Math.round(e.clientX - r.left), anchorY: Math.round(e.clientY - r.top) };
    }

    _handleWheel(e) {
      // Ctrl/⌘ + wheel; Chromium/Firefox also report trackpad pinch as wheel + ctrlKey.
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1;
      const delta = Math.max(-200, Math.min(200, e.deltaY * unit));
      this._set(this._value * Math.exp(-delta * 0.0025), 'wheel', true, this._anchor(e));
    }

    _handleGestureStart(e) {
      // Safari pinch
      e.preventDefault();
      this._gestureStart = this._value;
    }

    _handleGestureChange(e) {
      e.preventDefault();
      this._set(this._gestureStart * e.scale, 'wheel', true, this._anchor(e));
    }

    _handleShortcut(e) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.defaultPrevented) return;
      if (!this._target || !this._target.isConnected) this._wireTarget();
      if (!this._target) return;
      const k = e.key;
      if (k === '=' || k === '+') { e.preventDefault(); this.zoomIn('key'); }
      else if (k === '-' || k === '_') { e.preventDefault(); this.zoomOut('key'); }
      else if (k === '0') { e.preventDefault(); this.fit('page'); }
      else if (k === '1') { e.preventDefault(); this._set(100, 'key'); }
    }

    // ---- Wiring ---------------------------------------------------------------

    _wireEvents() {
      super._wireEvents();
      this._unWireEvents();
      this.componentElement.addEventListener('click', this._onClick);
      this._slider.addEventListener('input', this._onSliderInput);
      this._field.addEventListener('keydown', this._onFieldKeydown);
      this._field.addEventListener('focus', this._onFieldFocus);
      this._field.addEventListener('blur', this._onFieldBlur);
      // htmx may replace the zoom target; re-bind wheel/pinch to the new element.
      document.addEventListener('htmx:afterSwap', this._onSwap);
      this._wireTarget();
    }

    _unWireEvents() {
      super._unWireEvents();
      this.componentElement.removeEventListener('click', this._onClick);
      this._slider?.removeEventListener('input', this._onSliderInput);
      this._field?.removeEventListener('keydown', this._onFieldKeydown);
      this._field?.removeEventListener('focus', this._onFieldFocus);
      this._field?.removeEventListener('blur', this._onFieldBlur);
      if (this._target) {
        this._target.removeEventListener('wheel', this._onWheel);
        this._target.removeEventListener('gesturestart', this._onGestureStart);
        this._target.removeEventListener('gesturechange', this._onGestureChange);
        this._target = null;
      }
      document.removeEventListener('keydown', this._onKeydown);
      document.removeEventListener('htmx:afterSwap', this._onSwap);
      if (this._retry) { cancelAnimationFrame(this._retry); this._retry = 0; }
    }

    _applyStyle() {
      const style = `
        wc-zoom { display: contents; }

        @layer wc.usage {
          .wc-zoom {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            height: 24px;
            font-size: 12px;
            color: var(--text-1);
          }
          .wc-zoom-fits { display: inline-flex; gap: 0.125rem; margin-right: 0.25rem; }
          .wc-zoom-fits[hidden] { display: none; }
          .wc-zoom button {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            height: 22px;
            margin: 0;
            padding: 0 0.375rem;
            border: 1px solid transparent;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            font: inherit;
            line-height: 1;
            cursor: pointer;
          }
          .wc-zoom button:hover:not(:disabled) { background-color: var(--surface-3); border-color: var(--surface-4); }
          .wc-zoom button:disabled { opacity: 0.45; cursor: default; }
          .wc-zoom button:focus-visible,
          .wc-zoom-field:focus-visible { outline: 2px solid var(--primary-bg-color); outline-offset: 1px; }
          .wc-zoom .wc-zoom-step { width: 22px; padding: 0; font-size: 14px; }
          /* Menu lives on <body> */
          .wc-zoom-menu {
            z-index: 10000;
            display: flex;
            flex-direction: column;
            min-width: 8rem;
            max-height: min(440px, 80vh);
            overflow-y: auto;
            padding: 0.25rem;
            background-color: var(--surface-2);
            border: 1px solid var(--surface-4);
            border-radius: 0.5rem;
            box-shadow: 0 8px 24px color-mix(in srgb, var(--text-1) 22%, transparent);
            color: var(--text-1);
            font-size: 12px;
          }
          .wc-zoom-menu-item {
            margin: 0;
            padding: 0.3rem 0.625rem 0.3rem 1.5rem;
            border: 0;
            border-radius: 0.25rem;
            background: transparent;
            color: inherit;
            font: inherit;
            text-align: left;
            cursor: pointer;
            position: relative;
          }
          .wc-zoom-menu-item:hover,
          .wc-zoom-menu-item.is-active { background-color: var(--surface-4); }
          .wc-zoom-menu-item[aria-checked="true"]::before {
            content: '✓';
            position: absolute;
            left: 0.5rem;
            color: var(--primary-bg-color);
          }
          .theme-high-contrast .wc-zoom-menu-item[aria-checked="true"]::before { color: currentColor; }
          .wc-zoom-menu-sep { height: 1px; margin: 0.25rem 0.25rem; background-color: var(--surface-4); }
        }

        /* Unlayered: the wc.ui layer styles bare input (padding/border/background/font-size)
           and outranks wc.usage, so the inputs' own rules must sit outside the layers. */
        /* Track + thumb come from Wave's own input[type=range] styling (same as wc-slider). */
        .wc-zoom-slider {
          width: var(--wc-zoom-slider-width, 110px);
          margin: 0 0.125rem;
          padding: 0;
          border: 0;
          cursor: pointer;
        }
        .wc-zoom-field {
          width: 4.5em;
          height: 22px;
          margin: 0;
          padding: 0 0.375rem;
          border: 1px solid transparent;
          border-radius: 0.25rem;
          background: transparent;
          color: inherit;
          font: inherit;
          font-weight: 600;
          font-variant-numeric: tabular-nums;
          text-align: right;
          cursor: pointer;
        }
        .wc-zoom-field:hover { border-color: var(--surface-4); }
        .wc-zoom-field:focus { cursor: text; background-color: var(--surface-1); border-color: var(--surface-5, var(--surface-4)); }
      `.trim();
      this.loadStyle('wc-zoom-style', style);
    }
  }

  customElements.define('wc-zoom', WcZoom);
}
