/**
 *
 *  Name: wc-color
 *  Usage:
 *    A form-associated color picker field. Shows a swatch + the text value; clicking opens the
 *    native color picker (hex) — or, with `alpha` / `picker="custom"`, Wave's own popover with a
 *    saturation/value square, hue + alpha sliders, hex and R/G/B (or H/S/L) fields, an eyedropper
 *    and an optional CMYK tab. Preset swatches (`swatches`, or labelled `swatch-groups`) allow
 *    one-click selection. Submits a normal named form value in the chosen `format`.
 *
 *    <wc-color
 *        name="label_color"
 *        value="{{ Record.label_color }}"   <!-- e.g. "#3b82f6" or "#3b82f680" -->
 *        lbl-label="Label Color"
 *        format="hex"                        <!-- hex | rgb | hsl -->
 *        swatches='["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7"]'
 *        allow-custom                        <!-- default true; allow-custom="false" → presets only -->
 *        required>
 *    </wc-color>
 *
 *    <wc-color name="fill" alpha allow-none cmyk recent-key="ps-recent-colors"
 *        swatch-groups='[{"label":"Document colours","colors":["#1a2a4a","#c9a84c"]},
 *                        {"label":"Brand kit","colors":["#2c4a7c","#e8d5a3"]}]'></wc-color>
 *
 *  Attributes:
 *    name (required), value, lbl-label, format (hex|rgb|hsl), swatches (JSON array of colors),
 *    allow-custom (default true), required, disabled,
 *    alpha          transparency slider; values become #rrggbbaa / rgba() / hsla()
 *    picker         native (default) | custom — custom is implied by `alpha`
 *    swatch-groups  JSON [{ label, colors: [...] }] — labelled swatch rows
 *    recent-key     localStorage key; keeps a "Recent" swatch row (last 8 committed colors)
 *    allow-none     adds a "no colour" swatch that sets the value to ""
 *    cmyk           adds a CMYK tab (0–100 fields) to the custom popover
 *
 *  Events (bubbling, composed):
 *    wccolorchange — committed change; detail { value, alpha, cmyk? }  (legacy alias wc-color:change)
 *      cmyk = [c,m,y,k] (0–100) only when the user entered CMYK, so the host can store exact
 *      print values. Native picker mode keeps today's behaviour (fires while the native picker drags).
 *    wccolorinput — continuous while dragging / typing in the custom popover; detail as above
 *      (legacy alias wc-color:input). Preview with this; record undo history on wccolorchange.
 *
 *  Foundation: the stored/submitted value is converted to `format`; incoming color strings
 *  (#rgb, #rgba, #rrggbb, #rrggbbaa, rgb()/rgba(), hsl()/hsla(), incl. space syntax) are parsed
 *  back to hex + alpha. CMYK ↔ RGB uses the naive formula — display/entry only, NOT colour-managed.
 *  htmx-safe: re-seeds on value change; initializes on swap; the popover is torn down on removal.
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';
import { WcPopover } from '../utils/wc-popover.js';

const RECENT_MAX = 8;

class WcColor extends WcBaseFormComponent {
  static get is() {
    return 'wc-color';
  }

  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'lbl-label', 'format', 'swatches', 'allow-custom', 'required', 'disabled',
      'alpha', 'picker', 'swatch-groups', 'recent-key', 'allow-none', 'cmyk'];
  }

  constructor() {
    super();
    this._hex = '';     // canonical color (#rrggbb), '' = no color
    this._alpha = 1;    // 0..1 (only output when the `alpha` attribute is set)
    this._value = '';   // submitted value (in `format`)
    this._cmyk = null;  // last user-entered CMYK for the current color
    this._hsv = { h: 0, s: 0, v: 0 }; // popover working state (keeps hue when s or v is 0)

    this._onSwatchClick = this._handleSwatchClick.bind(this);
    this._onNativeInput = this._handleNativeInput.bind(this);
    this._onPresetClick = this._handlePresetClick.bind(this);
    this._popover = new WcPopover(this, {
      matchWidth: false,
      onClose: (reason) => {
        this.swatchEl?.setAttribute('aria-expanded', 'false');
        if (reason === 'escape') this.swatchEl?.focus();
        this._pop = null;
      },
    });

    const compEl = this.querySelector(':scope > .wc-color');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-color');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._seedValue();
    this._updateValidity();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._popover.close('disconnect');
    this._unWireEvents();
  }

  // ---- Value contract (FACE) ------------------------------------------------

  get value() { return this._value; }
  set value(v) {
    this._setFromString(v);
    this._cmyk = null;
    this._reflect(false);
  }

  get alpha() { return this._alpha; }

  get format() {
    const f = (this.getAttribute('format') || 'hex').toLowerCase();
    return ['hex', 'rgb', 'hsl'].includes(f) ? f : 'hex';
  }

  get allowCustom() {
    return this.getAttribute('allow-custom') !== 'false';
  }

  get hasAlpha() {
    return this.hasAttribute('alpha') && this.getAttribute('alpha') !== 'false';
  }

  get usesCustomPicker() {
    return this.hasAlpha || this.getAttribute('picker') === 'custom';
  }

  // ---- Lifecycle ------------------------------------------------------------

  _render() {
    super._render();
    const built = this.componentElement.querySelector(':scope > .wc-color-control');
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

    const control = document.createElement('div');
    control.classList.add('wc-color-control');

    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.classList.add('wc-color-swatch');
    swatch.setAttribute('aria-label', 'Choose color');
    if (this.usesCustomPicker) {
      swatch.setAttribute('aria-haspopup', 'dialog');
      swatch.setAttribute('aria-expanded', 'false');
    }
    if (this.hasAlpha) swatch.classList.add('has-alpha');
    if (!this.allowCustom) swatch.classList.add('is-locked');
    if (this.hasAttribute('disabled')) swatch.disabled = true;
    control.appendChild(swatch);
    this.swatchEl = swatch;

    const valueText = document.createElement('span');
    valueText.classList.add('wc-color-value');
    control.appendChild(valueText);
    this.valueEl = valueText;

    // Hidden native picker (the chooser when the custom popover isn't used)
    const native = document.createElement('input');
    native.type = 'color';
    native.classList.add('wc-color-native');
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');
    if (this.hasAttribute('disabled')) native.disabled = true;
    control.appendChild(native);
    this.nativeEl = native;

    this.componentElement.appendChild(control);

    // Preset swatches: the unlabelled `swatches` row (+ None), then labelled groups.
    const rows = this._swatchRows();
    if (rows.length) {
      const presets = document.createElement('div');
      presets.classList.add('wc-color-presets');
      rows.forEach(row => presets.appendChild(this._swatchRowEl(row)));
      this.componentElement.appendChild(presets);
      this.presetsEl = presets;
    } else {
      this.presetsEl = null;
    }
  }

  // [{ label|null, colors: [{hex, alpha, raw}], none: bool }]
  _swatchRows() {
    const rows = [];
    const toEntries = list => list.map(c => {
      const p = this._parse(String(c));
      return p ? { hex: p.hex, alpha: p.alpha, raw: String(c) } : null;
    }).filter(Boolean);
    const flat = toEntries(this._parseJSON('swatches', []));
    const allowNone = this.hasAttribute('allow-none');
    if (flat.length || allowNone) rows.push({ label: null, colors: flat, none: allowNone });
    this._parseJSON('swatch-groups', []).forEach(g => {
      if (!g || !Array.isArray(g.colors)) return;
      const colors = toEntries(g.colors);
      if (colors.length) rows.push({ label: String(g.label || ''), colors, none: false });
    });
    const recent = toEntries(this._recent());
    if (recent.length) rows.push({ label: 'Recent', colors: recent, none: false, recent: true });
    return rows;
  }

  _swatchRowEl(row) {
    const wrap = document.createElement('div');
    wrap.className = 'wc-color-swatch-row';
    if (row.recent) wrap.classList.add('is-recent');
    if (row.label) {
      const lbl = document.createElement('span');
      lbl.className = 'wc-color-swatch-label';
      lbl.textContent = row.label;
      wrap.appendChild(lbl);
    }
    const list = document.createElement('div');
    list.className = 'wc-color-swatch-list';
    if (row.none) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wc-color-preset wc-color-none';
      b.dataset.none = '1';
      b.title = 'No colour';
      b.setAttribute('aria-label', 'No colour');
      list.appendChild(b);
    }
    row.colors.forEach(c => {
      const b = document.createElement('button');
      b.type = 'button';
      b.classList.add('wc-color-preset');
      if (c.alpha < 1) b.classList.add('has-alpha');
      b.dataset.hex = c.hex;
      b.dataset.alpha = String(c.alpha);
      b.style.setProperty('--wc-color-chip', this._css(c.hex, c.alpha));
      b.style.backgroundColor = c.alpha < 1 ? '' : c.hex;
      b.title = c.raw;
      b.setAttribute('aria-label', c.raw);
      list.appendChild(b);
    });
    wrap.appendChild(list);
    return wrap;
  }

  // ---- Value seeding / reflection ------------------------------------------

  _seedValue() {
    this._setFromString(this.getAttribute('value'));
    this._reflect(false);
  }

  _setFromString(str) {
    const p = this._parse(str);
    this._hex = p ? p.hex : '';
    if (p) this._alpha = this.hasAlpha ? p.alpha : 1;
    this._value = this._hex ? this._toFormat(this._hex, this._alpha) : '';
  }

  _reflect(emit, eventName = 'wccolorchange') {
    if (this.swatchEl) {
      const none = !this._hex;
      this.swatchEl.classList.toggle('is-empty', none);
      this.swatchEl.classList.toggle('is-none', none && this.hasAttribute('allow-none'));
      if (none) {
        this.swatchEl.style.backgroundColor = '';
        this.swatchEl.style.removeProperty('--wc-color-chip');
      } else if (this.hasAlpha) {
        this.swatchEl.style.backgroundColor = '';
        this.swatchEl.style.setProperty('--wc-color-chip', this._css(this._hex, this._alpha));
      } else {
        this.swatchEl.style.backgroundColor = this._hex;
      }
    }
    if (this.valueEl) {
      this.valueEl.textContent = this._value || (this.hasAttribute('allow-none') ? 'None' : 'No color');
    }
    if (this.nativeEl && this._hex) this.nativeEl.value = this._hex;
    this.componentElement.querySelectorAll('.wc-color-preset').forEach(b => this._markPreset(b));
    if (this._pop) this._pop.querySelectorAll('.wc-color-preset').forEach(b => this._markPreset(b));
    this._internals.setFormValue(this._value);
    this._updateValidity();
    if (emit) {
      const detail = { value: this._value, alpha: this._hex ? this._alpha : 0 };
      if (emit === 'cmyk' && this._cmyk) detail.cmyk = this._cmyk.slice();
      if (eventName === 'wccolorinput') {
        this._emitEvent('wccolorinput', 'wc-color:input', { bubbles: true, composed: true, detail });
      } else {
        this._emitEvent('wccolorchange', 'wc-color:change', { bubbles: true, composed: true, detail });
        if (emit !== 'live') this._pushRecent();
      }
    }
  }

  _markPreset(b) {
    let active;
    if (b.dataset.none) active = !this._hex;
    else {
      active = !!this._hex && b.dataset.hex.toLowerCase() === this._hex.toLowerCase()
        && (!this.hasAlpha || Math.abs(Number(b.dataset.alpha) - this._alpha) < 0.005);
    }
    b.classList.toggle('is-active', active);
    b.setAttribute('aria-pressed', String(active));
  }

  _setHex(hex, emit, alpha) {
    const p = this._parse(hex);
    if (!p) return;
    this._hex = p.hex;
    if (this.hasAlpha && alpha != null) this._alpha = alpha;
    this._value = this._toFormat(this._hex, this._alpha);
    this._reflect(emit);
  }

  _updateValidity() {
    if (this.hasAttribute('required') && !this._value) {
      this._internals.setValidity({ valueMissing: true }, 'Please choose a color.', this.swatchEl || this);
    } else {
      this._internals.setValidity({});
    }
  }

  // ---- Recent ---------------------------------------------------------------

  _recent() {
    const key = this.getAttribute('recent-key');
    if (!key) return [];
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v : [];
    } catch (err) {
      return [];
    }
  }

  _pushRecent() {
    const key = this.getAttribute('recent-key');
    if (!key || !this._hex) return;
    const entry = this.hasAlpha && this._alpha < 1 ? this._hex8(this._hex, this._alpha) : this._hex;
    const list = [entry, ...this._recent().filter(c => String(c).toLowerCase() !== entry)].slice(0, RECENT_MAX);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (err) { /* blocked */ }
    this._refreshRecentRows();
  }

  _refreshRecentRows() {
    const rebuild = (container) => {
      if (!container) return;
      container.querySelector(':scope > .wc-color-swatch-row.is-recent')?.remove();
      const recent = this._swatchRows().find(r => r.recent);
      if (recent) container.appendChild(this._swatchRowEl(recent));
    };
    if (this.presetsEl) rebuild(this.presetsEl);
    else if (this._recent().length) {
      // first recent color: create the presets container
      const presets = document.createElement('div');
      presets.classList.add('wc-color-presets');
      this.componentElement.appendChild(presets);
      this.presetsEl = presets;
      this.presetsEl.addEventListener('click', this._onPresetClick);
      rebuild(presets);
    }
    rebuild(this._pop?.querySelector('.wc-color-pop-swatches'));
    this.componentElement.querySelectorAll('.wc-color-preset').forEach(b => this._markPreset(b));
  }

  // ---- Interaction ----------------------------------------------------------

  _handleSwatchClick() {
    if (this.hasAttribute('disabled') || !this.allowCustom) return;
    if (this.usesCustomPicker) {
      if (this._popover.isOpen) this._popover.close('toggle');
      else this._openPopover();
      return;
    }
    this.nativeEl.click();
  }

  _handleNativeInput(e) {
    this._cmyk = null;
    this._setHex(this.nativeEl.value, false);
    this._reflect(true, 'wccolorinput');
    // Native mode keeps today's contract: wccolorchange as the native picker moves. Only the
    // final 'change' is a commit for the Recent row.
    this._reflect(e && e.type === 'change' ? true : 'live');
  }

  _handlePresetClick(e) {
    const b = e.target.closest('.wc-color-preset');
    if (!b || this.hasAttribute('disabled')) return;
    this._cmyk = null;
    if (b.dataset.none) {
      this._hex = '';
      this._value = '';
      this._reflect('preset');
    } else {
      const a = Number(b.dataset.alpha);
      // A preset without its own transparency keeps the current alpha (fill opacity is separate).
      this._setHex(b.dataset.hex, 'preset', a < 1 ? a : (this._hex ? this._alpha : 1));
    }
    if (this._pop) this._syncPopover();
  }

  // ---- Custom popover --------------------------------------------------------

  _openPopover() {
    const pop = document.createElement('div');
    pop.className = 'wc-color-pop';
    pop.setAttribute('role', 'dialog');
    pop.setAttribute('aria-label', this.getAttribute('lbl-label') || 'Choose color');
    const cmyk = this.hasAttribute('cmyk');
    const eyedropper = typeof window.EyeDropper === 'function';

    pop.innerHTML = `
      ${cmyk ? `<div class="wc-color-pop-tabs" role="tablist">
        <button type="button" role="tab" class="wc-color-pop-tab" data-tab="picker" aria-selected="true">Picker</button>
        <button type="button" role="tab" class="wc-color-pop-tab" data-tab="cmyk" aria-selected="false">CMYK</button>
      </div>` : ''}
      <div class="wc-color-pop-pane" data-pane="picker">
        <div class="wc-color-sv" role="slider" tabindex="0" aria-label="Saturation and brightness">
          <div class="wc-color-sv-thumb"></div>
        </div>
        <div class="wc-color-pop-row">
          <div class="wc-color-pop-sliders">
            <div class="wc-color-track wc-color-hue" role="slider" tabindex="0" aria-label="Hue" aria-valuemin="0" aria-valuemax="360"><div class="wc-color-track-thumb"></div></div>
            ${this.hasAlpha ? `<div class="wc-color-track wc-color-alpha" role="slider" tabindex="0" aria-label="Transparency" aria-valuemin="0" aria-valuemax="100"><div class="wc-color-track-thumb"></div></div>` : ''}
          </div>
          <div class="wc-color-pop-preview" aria-hidden="true"></div>
          ${eyedropper ? `<button type="button" class="wc-color-eyedropper" title="Pick a colour from the screen" aria-label="Pick a colour from the screen">
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M10.5 2.5l3 3-1.6 1.6-.7-.7-5.6 5.6H3.5v-2.1L9.1 4.3l-.7-.7 2.1-2.1z" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/></svg>
          </button>` : ''}
        </div>
        <div class="wc-color-pop-fields${this.hasAlpha ? ' has-alpha' : ''}">
          <label class="wc-color-field wc-color-field-hex"><span>Hex</span><input type="text" data-field="hex" spellcheck="false" autocomplete="off"></label>
          <button type="button" class="wc-color-mode" title="Switch RGB / HSL">RGB</button>
          <label class="wc-color-field"><span data-label="0">R</span><input type="number" data-field="0" min="0" max="255"></label>
          <label class="wc-color-field"><span data-label="1">G</span><input type="number" data-field="1" min="0" max="255"></label>
          <label class="wc-color-field"><span data-label="2">B</span><input type="number" data-field="2" min="0" max="255"></label>
          ${this.hasAlpha ? `<label class="wc-color-field"><span>A%</span><input type="number" data-field="a" min="0" max="100"></label>` : ''}
        </div>
      </div>
      ${cmyk ? `<div class="wc-color-pop-pane" data-pane="cmyk" hidden>
        <div class="wc-color-cmyk">
          ${['C', 'M', 'Y', 'K'].map((l, i) => `<label class="wc-color-field"><span>${l}</span><input type="number" data-cmyk="${i}" min="0" max="100"></label>`).join('')}
        </div>
        <p class="wc-color-cmyk-note">Approximate on screen — CMYK isn't colour-managed here.</p>
      </div>` : ''}
      <div class="wc-color-pop-swatches"></div>
    `;
    const swatches = pop.querySelector('.wc-color-pop-swatches');
    this._swatchRows().forEach(row => swatches.appendChild(this._swatchRowEl(row)));
    if (!swatches.children.length) swatches.remove();

    this._pop = pop;
    this._mode = 'rgb';
    this._wirePopover(pop);
    this._popover.open(this.swatchEl, pop);
    this.swatchEl.setAttribute('aria-expanded', 'true');
    const p = this._hex ? this._hexToRgb(this._hex) : { r: 255, g: 255, b: 255 };
    this._hsv = this._rgbToHsv(p.r, p.g, p.b);
    this._syncPopover();
    pop.querySelector('.wc-color-sv').focus();
  }

  _wirePopover(pop) {
    const sv = pop.querySelector('.wc-color-sv');
    const hue = pop.querySelector('.wc-color-hue');
    const alpha = pop.querySelector('.wc-color-alpha');

    this._drag(sv, (x, y) => {
      this._hsv.s = x; this._hsv.v = 1 - y;
      this._applyHsv('input');
    });
    this._drag(hue, (x) => { this._hsv.h = x * 360; this._applyHsv('input'); });
    if (alpha) this._drag(alpha, (x) => { this._alpha = Math.round(x * 100) / 100; this._applyHsv('input'); });

    const keyNudge = (el, fn) => el.addEventListener('keydown', (e) => {
      const big = e.shiftKey ? 10 : 1;
      const map = { ArrowLeft: [-big, 0], ArrowRight: [big, 0], ArrowUp: [0, big], ArrowDown: [0, -big] };
      if (!map[e.key]) return;
      e.preventDefault();
      fn(...map[e.key]);
      this._applyHsv('commit');
    });
    keyNudge(sv, (dx, dy) => {
      this._hsv.s = Math.min(1, Math.max(0, this._hsv.s + dx / 100));
      this._hsv.v = Math.min(1, Math.max(0, this._hsv.v + dy / 100));
    });
    keyNudge(hue, (dx, dy) => { this._hsv.h = (this._hsv.h + (dx || dy) + 360) % 360; });
    if (alpha) keyNudge(alpha, (dx, dy) => { this._alpha = Math.min(1, Math.max(0, this._alpha + (dx || dy) / 100)); });

    pop.addEventListener('input', (e) => this._handleFieldInput(e, false));
    pop.addEventListener('change', (e) => this._handleFieldInput(e, true));
    pop.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.matches('input')) { e.preventDefault(); this._handleFieldInput(e, true); }
    });
    pop.addEventListener('click', (e) => {
      if (e.target.closest('.wc-color-preset')) { this._handlePresetClick(e); return; }
      const tab = e.target.closest('.wc-color-pop-tab');
      if (tab) { this._showTab(tab.dataset.tab); return; }
      if (e.target.closest('.wc-color-mode')) {
        this._mode = this._mode === 'rgb' ? 'hsl' : 'rgb';
        this._syncPopover();
        return;
      }
      if (e.target.closest('.wc-color-eyedropper')) this._eyedrop();
    });
  }

  // Pointer drag on a track/area → callback with x,y in 0..1; commits on release.
  _drag(el, onMove) {
    const at = (e) => {
      const r = el.getBoundingClientRect();
      onMove(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)),
        Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)));
    };
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      el.focus();
      el.setPointerCapture(e.pointerId);
      at(e);
      const move = (ev) => at(ev);
      const up = () => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        this._applyHsv('commit');
      };
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    });
  }

  // Push the popover's HSV(+alpha) into the value. phase: 'input' (live) | 'commit'.
  _applyHsv(phase) {
    const { r, g, b } = this._hsvToRgb(this._hsv.h, this._hsv.s, this._hsv.v);
    this._cmyk = null;
    this._hex = this._rgbToHex(r, g, b);
    this._value = this._toFormat(this._hex, this._alpha);
    if (phase === 'commit') this._reflect(true);
    else this._reflect(true, 'wccolorinput');
    this._syncPopover(true);
  }

  _handleFieldInput(e, commit) {
    const t = e.target;
    if (!t.matches('input')) return;
    const phase = commit ? 'commit' : 'input';
    if (t.dataset.field === 'hex') {
      const p = this._parse(t.value.startsWith('#') ? t.value : `#${t.value}`);
      if (!p) return;
      this._hex = p.hex;
      if (this.hasAlpha && /^#?([0-9a-f]{4}|[0-9a-f]{8})$/i.test(t.value.trim())) this._alpha = p.alpha;
      this._hsv = this._rgbToHsv(...Object.values(this._hexToRgb(p.hex)));
    } else if (t.dataset.field === 'a') {
      const a = Number(t.value);
      if (!Number.isFinite(a)) return;
      this._alpha = Math.min(1, Math.max(0, a / 100));
    } else if (t.dataset.field != null) {
      const vals = [0, 1, 2].map(i => Number(this._pop.querySelector(`[data-field="${i}"]`).value));
      if (vals.some(v => !Number.isFinite(v))) return;
      let rgb;
      if (this._mode === 'rgb') rgb = { r: vals[0], g: vals[1], b: vals[2] };
      else rgb = this._hslToRgb(vals[0], vals[1], vals[2]);
      this._hex = this._rgbToHex(rgb.r, rgb.g, rgb.b);
      this._hsv = this._rgbToHsv(...Object.values(this._hexToRgb(this._hex)));
    } else if (t.dataset.cmyk != null) {
      const cmyk = [0, 1, 2, 3].map(i => Number(this._pop.querySelector(`[data-cmyk="${i}"]`).value));
      if (cmyk.some(v => !Number.isFinite(v))) return;
      const clamped = cmyk.map(v => Math.min(100, Math.max(0, v)));
      const { r, g, b } = this._cmykToRgb(...clamped);
      this._hex = this._rgbToHex(r, g, b);
      this._hsv = this._rgbToHsv(r, g, b);
      this._value = this._toFormat(this._hex, this._alpha);
      this._cmyk = clamped;
      if (commit) this._reflect('cmyk'); else this._reflect('cmyk', 'wccolorinput');
      this._syncPopover(true, t);
      return;
    } else {
      return;
    }
    this._cmyk = null;
    this._value = this._toFormat(this._hex, this._alpha);
    if (commit) this._reflect(true); else this._reflect(true, 'wccolorinput');
    this._syncPopover(true, t);
  }

  _showTab(name) {
    if (!this._pop) return;
    this._pop.querySelectorAll('.wc-color-pop-tab').forEach(t => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
    this._pop.querySelectorAll('.wc-color-pop-pane').forEach(p => { p.hidden = p.dataset.pane !== name; });
    this._syncPopover();
    this._popover.reposition();
  }

  async _eyedrop() {
    try {
      const result = await new window.EyeDropper().open();
      const p = this._parse(result.sRGBHex);
      if (!p) return;
      this._hex = p.hex;
      this._hsv = this._rgbToHsv(...Object.values(this._hexToRgb(p.hex)));
      this._applyHsv('commit');
    } catch (err) {
      // user cancelled
    }
  }

  // Reflect state into the popover. `skipEl` keeps the field being typed in untouched.
  _syncPopover(fromDrag = false, skipEl = null) {
    const pop = this._pop;
    if (!pop) return;
    if (!fromDrag && this._hex) {
      const cur = this._hsvToRgb(this._hsv.h, this._hsv.s, this._hsv.v);
      if (this._rgbToHex(cur.r, cur.g, cur.b) !== this._hex) {
        this._hsv = this._rgbToHsv(...Object.values(this._hexToRgb(this._hex)));
      }
    }
    const { h, s, v } = this._hsv;
    const hueCss = `hsl(${Math.round(h)} 100% 50%)`;
    const sv = pop.querySelector('.wc-color-sv');
    sv.style.setProperty('--wc-color-hue', hueCss);
    sv.setAttribute('aria-valuetext', `saturation ${Math.round(s * 100)}%, brightness ${Math.round(v * 100)}%`);
    const thumb = pop.querySelector('.wc-color-sv-thumb');
    thumb.style.left = `${s * 100}%`;
    thumb.style.top = `${(1 - v) * 100}%`;
    const hue = pop.querySelector('.wc-color-hue');
    hue.querySelector('.wc-color-track-thumb').style.left = `${(h / 360) * 100}%`;
    hue.setAttribute('aria-valuenow', String(Math.round(h)));
    const rgb = this._hsvToRgb(h, s, v);
    const opaque = this._rgbToHex(rgb.r, rgb.g, rgb.b);
    const alpha = pop.querySelector('.wc-color-alpha');
    if (alpha) {
      alpha.style.setProperty('--wc-color-opaque', opaque);
      alpha.querySelector('.wc-color-track-thumb').style.left = `${this._alpha * 100}%`;
      alpha.setAttribute('aria-valuenow', String(Math.round(this._alpha * 100)));
    }
    pop.querySelector('.wc-color-pop-preview').style.setProperty('--wc-color-chip',
      this._hex ? this._css(this._hex, this._alpha) : 'transparent');

    const set = (sel, val) => {
      const el = pop.querySelector(sel);
      if (el && el !== skipEl) el.value = val;
    };
    const hexOut = this._hex ? (this.hasAlpha && this._alpha < 1 ? this._hex8(this._hex, this._alpha) : this._hex) : '';
    set('[data-field="hex"]', hexOut);
    pop.querySelector('.wc-color-mode').textContent = this._mode.toUpperCase();
    const labels = this._mode === 'rgb' ? ['R', 'G', 'B'] : ['H', 'S%', 'L%'];
    const maxes = this._mode === 'rgb' ? [255, 255, 255] : [360, 100, 100];
    const vals = this._mode === 'rgb'
      ? [rgb.r, rgb.g, rgb.b]
      : Object.values(this._rgbToHsl(rgb.r, rgb.g, rgb.b));
    [0, 1, 2].forEach(i => {
      pop.querySelector(`[data-label="${i}"]`).textContent = labels[i];
      const input = pop.querySelector(`[data-field="${i}"]`);
      input.max = String(maxes[i]);
      if (input !== skipEl) input.value = this._hex ? String(vals[i]) : '';
    });
    set('[data-field="a"]', String(Math.round(this._alpha * 100)));
    const cmyk = this._cmyk || (this._hex ? this._rgbToCmyk(rgb.r, rgb.g, rgb.b) : null);
    [0, 1, 2, 3].forEach(i => set(`[data-cmyk="${i}"]`, cmyk ? String(cmyk[i]) : ''));
  }

  // ---- Color conversion -----------------------------------------------------

  // → { hex: '#rrggbb', alpha: 0..1 } | null
  _parse(str) {
    if (str == null) return null;
    const s = String(str).trim().toLowerCase();
    if (!s) return null;
    let m;
    if ((m = s.match(/^#([0-9a-f]{3,4})$/))) {
      const c = m[1];
      const hex = `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
      return { hex, alpha: c.length === 4 ? parseInt(c[3] + c[3], 16) / 255 : 1 };
    }
    if ((m = s.match(/^#([0-9a-f]{6})([0-9a-f]{2})?$/))) {
      return { hex: `#${m[1]}`, alpha: m[2] ? Math.round((parseInt(m[2], 16) / 255) * 1000) / 1000 : 1 };
    }
    const num = (v, scale) => (v.endsWith('%') ? (parseFloat(v) / 100) * scale : parseFloat(v));
    const alphaOf = (v) => (v == null ? 1 : Math.min(1, Math.max(0, v.endsWith('%') ? parseFloat(v) / 100 : parseFloat(v))));
    if ((m = s.match(/^rgba?\(\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)\s*[,\s]\s*([\d.]+%?)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/))) {
      return { hex: this._rgbToHex(num(m[1], 255), num(m[2], 255), num(m[3], 255)), alpha: alphaOf(m[4]) };
    }
    if ((m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/))) {
      const { r, g, b } = this._hslToRgb(+m[1], +m[2], +m[3]);
      return { hex: this._rgbToHex(r, g, b), alpha: alphaOf(m[4]) };
    }
    return null;
  }

  // Kept for backward compatibility (returns '#rrggbb' or null).
  _toHex(str) {
    const p = this._parse(str);
    return p ? p.hex : null;
  }

  _toFormat(hex, alpha = 1) {
    const fmt = this.format;
    const a = Math.round(alpha * 100) / 100;
    if (fmt === 'hex') return this.hasAlpha ? this._hex8(hex, alpha) : hex;
    const { r, g, b } = this._hexToRgb(hex);
    if (fmt === 'rgb') return this.hasAlpha ? `rgba(${r}, ${g}, ${b}, ${a})` : `rgb(${r}, ${g}, ${b})`;
    const { h, s, l } = this._rgbToHsl(r, g, b);
    return this.hasAlpha ? `hsla(${h}, ${s}%, ${l}%, ${a})` : `hsl(${h}, ${s}%, ${l}%)`;
  }

  _hex8(hex, alpha) {
    return `${hex}${Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0')}`;
  }

  _css(hex, alpha) {
    const { r, g, b } = this._hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  _hexToRgb(hex) {
    const n = parseInt(hex.slice(1, 7), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  _rgbToHex(r, g, b) {
    const c = v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
    return `#${c(r)}${c(g)}${c(b)}`;
  }
  _rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0; const l = (max + min) / 2;
    const d = max - min;
    if (d !== 0) {
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (max === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
  }
  _hslToRgb(h, s, l) {
    h /= 360; s /= 100; l /= 100;
    if (s === 0) { const v = Math.round(l * 255); return { r: v, g: v, b: v }; }
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    return {
      r: Math.round(hue2rgb(p, q, h + 1 / 3) * 255),
      g: Math.round(hue2rgb(p, q, h) * 255),
      b: Math.round(hue2rgb(p, q, h - 1 / 3) * 255)
    };
  }
  _rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) {
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      else if (max === g) h = ((b - r) / d + 2) * 60;
      else h = ((r - g) / d + 4) * 60;
    } else {
      h = this._hsv ? this._hsv.h : 0; // keep the hue for grays
    }
    return { h, s: max ? d / max : 0, v: max };
  }
  _hsvToRgb(h, s, v) {
    const f = (n) => {
      const k = (n + h / 60) % 6;
      return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
    };
    return { r: Math.round(f(5) * 255), g: Math.round(f(3) * 255), b: Math.round(f(1) * 255) };
  }
  // Naive device conversion (not colour-managed).
  _rgbToCmyk(r, g, b) {
    const R = r / 255, G = g / 255, B = b / 255;
    const k = 1 - Math.max(R, G, B);
    if (k >= 1) return [0, 0, 0, 100];
    const c = (1 - R - k) / (1 - k), m = (1 - G - k) / (1 - k), y = (1 - B - k) / (1 - k);
    return [c, m, y, k].map(v => Math.round(v * 100));
  }
  _cmykToRgb(c, m, y, k) {
    const K = 1 - k / 100;
    return { r: 255 * (1 - c / 100) * K, g: 255 * (1 - m / 100) * K, b: 255 * (1 - y / 100) * K };
  }

  _parseJSON(attr, fallback) {
    const raw = this.getAttribute(attr);
    if (!raw) return fallback;
    try { const v = JSON.parse(raw); return Array.isArray(v) ? v : fallback; }
    catch (ex) { console.warn(`[wc-color] invalid JSON for ${attr}`, ex); return fallback; }
  }

  // ---- Wiring ---------------------------------------------------------------

  _wireEvents() {
    // The native <input type=color> would be auto-bound by the base as the value source;
    // null formElement so the base leaves it alone (we convert hex → format ourselves).
    this.formElement = null;
    super._wireEvents();
    if (this.swatchEl) {
      this.swatchEl.removeEventListener('click', this._onSwatchClick);
      this.swatchEl.addEventListener('click', this._onSwatchClick);
    }
    if (this.nativeEl) {
      this.nativeEl.removeEventListener('input', this._onNativeInput);
      this.nativeEl.addEventListener('input', this._onNativeInput);
      this.nativeEl.removeEventListener('change', this._onNativeInput);
      this.nativeEl.addEventListener('change', this._onNativeInput);
    }
    if (this.presetsEl) {
      this.presetsEl.removeEventListener('click', this._onPresetClick);
      this.presetsEl.addEventListener('click', this._onPresetClick);
    }
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.swatchEl) this.swatchEl.removeEventListener('click', this._onSwatchClick);
    if (this.nativeEl) {
      this.nativeEl.removeEventListener('input', this._onNativeInput);
      this.nativeEl.removeEventListener('change', this._onNativeInput);
    }
    if (this.presetsEl) this.presetsEl.removeEventListener('click', this._onPresetClick);
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'value') {
      this._setFromString(newValue);
      this._cmyk = null;
      this._reflect(false);
      if (this._pop) this._syncPopover();
      return;
    }
    if (attrName === 'required') { this._updateValidity(); return; }
    if (['format', 'swatches', 'allow-custom', 'lbl-label', 'disabled', 'alpha', 'picker',
      'swatch-groups', 'recent-key', 'allow-none', 'cmyk'].includes(attrName)) {
      const hex = this._hex;
      this._popover.close('rebuild');
      this._unWireEvents();
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
      this._wireEvents();
      this._hex = hex;
      if (!this.hasAlpha) this._alpha = 1;
      this._value = hex ? this._toFormat(hex, this._alpha) : '';
      this._reflect(false);
      return;
    }
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    super._handleAttributeChange(attrName, newValue);
  }

  _applyStyle() {
    const checker = `
          background-image:
            linear-gradient(45deg, var(--surface-4) 25%, transparent 25%),
            linear-gradient(-45deg, var(--surface-4) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, var(--surface-4) 75%),
            linear-gradient(-45deg, transparent 75%, var(--surface-4) 75%);
          background-size: 10px 10px;
          background-position: 0 0, 0 5px, 5px -5px, -5px 0;`;
    // Checkerboard under a solid layer of the chip color (for translucent colors).
    const chipOverChecker = `
          background-image:
            linear-gradient(var(--wc-color-chip, transparent), var(--wc-color-chip, transparent)),
            linear-gradient(45deg, var(--surface-4) 25%, transparent 25%),
            linear-gradient(-45deg, var(--surface-4) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, var(--surface-4) 75%),
            linear-gradient(-45deg, transparent 75%, var(--surface-4) 75%);
          background-size: 100% 100%, 10px 10px, 10px 10px, 10px 10px, 10px 10px;
          background-position: 0 0, 0 0, 0 5px, 5px -5px, -5px 0;
          background-color: var(--surface-1);`;
    // "No colour": a light square crossed by a danger-colored diagonal.
    const noneStyle = `
          background-color: var(--surface-1);
          background-image: linear-gradient(to top right, transparent calc(50% - 1px), var(--danger-color) calc(50% - 1px), var(--danger-color) calc(50% + 1px), transparent calc(50% + 1px));
          background-size: 100% 100%;`;
    const style = `
      wc-color { display: contents; }

      @layer wc.usage {
        .wc-color { display: flex; flex-direction: column; gap: 0.375rem; }
        .wc-color > label { font-weight: 500; }
        .wc-color-control { display: flex; align-items: center; gap: 0.5rem; }
        .wc-color-swatch {
          width: 2rem; height: 2rem;
          flex: 0 0 auto;
          padding: 0;
          border: 1px solid var(--surface-4);
          border-radius: 0.375rem;
          cursor: pointer;
          /* checkerboard shows through when empty */
          ${checker}
        }
        .wc-color-swatch:not(.is-empty) { background-image: none; }
        .wc-color-swatch.has-alpha:not(.is-empty) { ${chipOverChecker} }
        .wc-color-swatch.is-none { ${noneStyle} }
        .wc-color-swatch:focus-visible { outline: var(--primary-bg-color) solid 2px; outline-offset: 1px; }
        .wc-color-swatch.is-locked { cursor: default; }
        .wc-color-swatch:disabled { cursor: not-allowed; opacity: 0.6; }
        .wc-color-value {
          font-family: 'SF Mono', 'Fira Code', monospace;
          font-size: 0.85rem;
          color: var(--text-1);
        }
        .wc-color-native {
          position: absolute;
          width: 1px; height: 1px;
          opacity: 0;
          pointer-events: none;
        }
        .wc-color-presets { display: flex; flex-direction: column; gap: 0.375rem; }
        .wc-color-swatch-row { display: flex; flex-direction: column; gap: 0.2rem; }
        .wc-color-swatch-label { font-size: 0.7rem; color: var(--text-2, var(--text-1)); }
        .wc-color-swatch-list { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .wc-color-preset {
          width: 1.5rem; height: 1.5rem;
          padding: 0;
          border: 1px solid var(--surface-4);
          border-radius: 0.25rem;
          cursor: pointer;
        }
        .wc-color-preset.has-alpha { ${chipOverChecker} }
        .wc-color-preset.wc-color-none { ${noneStyle} }
        .wc-color-preset:hover { transform: scale(1.1); }
        .wc-color-preset:focus-visible { outline: 2px solid var(--primary-bg-color); outline-offset: 1px; }
        .wc-color-preset.is-active {
          outline: 2px solid var(--text-1);
          outline-offset: 1px;
        }
        wc-color[required] .wc-color > label::after { content: ' *'; font-weight: bold; }

        /* Custom popover (lives on <body>) */
        .wc-color-pop {
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
          width: 248px;
          padding: 0.6rem;
          background-color: var(--surface-2);
          border: 1px solid var(--surface-4);
          border-radius: 0.6rem;
          box-shadow: 0 8px 28px color-mix(in srgb, var(--text-1) 22%, transparent);
          color: var(--text-1);
          font-size: 0.75rem;
        }
        .wc-color-pop-pane { display: flex; flex-direction: column; gap: 0.6rem; }
        .wc-color-pop-pane[hidden] { display: none; }
        .wc-color-pop-tabs { display: flex; gap: 0.25rem; border-bottom: 1px solid var(--surface-4); }
        .wc-color-pop-tab {
          margin: 0 0 -1px; padding: 0.3rem 0.6rem;
          border: 0; border-bottom: 2px solid transparent;
          background: transparent; color: var(--text-2, var(--text-1)); font: inherit; cursor: pointer;
        }
        .wc-color-pop-tab[aria-selected="true"] { color: var(--text-1); border-bottom-color: var(--primary-bg-color); font-weight: 600; }
        /* The saturation/value square is colour-space data, so it uses literal black/white. */
        .wc-color-sv {
          position: relative;
          height: 150px;
          border-radius: 0.375rem;
          background:
            linear-gradient(to top, #000, transparent),
            linear-gradient(to right, #fff, var(--wc-color-hue, red));
          cursor: crosshair;
          touch-action: none;
        }
        .wc-color-sv-thumb {
          position: absolute;
          width: 12px; height: 12px;
          margin: -6px 0 0 -6px;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 0 1px #000;
          pointer-events: none;
        }
        .wc-color-pop-row { display: flex; align-items: center; gap: 0.5rem; }
        .wc-color-pop-sliders { flex: 1 1 auto; display: flex; flex-direction: column; gap: 0.5rem; }
        .wc-color-track {
          position: relative;
          height: 12px;
          border-radius: 6px;
          cursor: pointer;
          touch-action: none;
        }
        .wc-color-hue {
          background: linear-gradient(to right, #f00, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00);
        }
        .wc-color-alpha {
          ${checker}
          background-size: 8px 8px;
          background-color: var(--surface-1);
        }
        .wc-color-alpha::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(to right, transparent, var(--wc-color-opaque, var(--text-1)));
        }
        .wc-color-track-thumb {
          position: absolute;
          top: 50%;
          z-index: 1;
          width: 14px; height: 14px;
          margin: -7px 0 0 -7px;
          border: 2px solid #fff;
          border-radius: 50%;
          box-shadow: 0 0 0 1px #000;
          pointer-events: none;
        }
        .wc-color-sv:focus-visible,
        .wc-color-track:focus-visible { outline: 2px solid var(--primary-bg-color); outline-offset: 2px; }
        .wc-color-pop-preview {
          flex: none;
          width: 30px; height: 30px;
          border: 1px solid var(--surface-4);
          border-radius: 0.375rem;
          ${chipOverChecker}
        }
        .wc-color-eyedropper,
        .wc-color-mode {
          flex: none;
          display: inline-flex; align-items: center; justify-content: center;
          margin: 0;
          border: 1px solid var(--surface-4);
          border-radius: 0.25rem;
          background: transparent; color: inherit; font: inherit;
          cursor: pointer;
        }
        .wc-color-eyedropper { width: 30px; height: 30px; padding: 0; }
        .wc-color-eyedropper svg { width: 16px; height: 16px; }
        .wc-color-mode { align-self: end; height: 26px; padding: 0 0.375rem; font-size: 0.65rem; font-weight: 600; }
        .wc-color-eyedropper:hover, .wc-color-mode:hover { background-color: var(--surface-3); }
        /* [Hex ··· ][mode] over [R][G][B] — or [Hex ··· ··· ][mode] over [R][G][B][A%] */
        .wc-color-pop-fields { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.375rem; }
        .wc-color-pop-fields.has-alpha { grid-template-columns: repeat(4, 1fr); }
        .wc-color-field { display: flex; flex-direction: column; gap: 0.125rem; margin: 0; min-width: 0; font-weight: 400; }
        .wc-color-field > span { font-size: 0.65rem; color: var(--text-2, var(--text-1)); }
        .wc-color-field-hex { grid-column: span 2; }
        .wc-color-pop-fields.has-alpha .wc-color-field-hex { grid-column: span 3; }
        .wc-color-cmyk { display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.375rem; }
        .wc-color-cmyk-note { margin: 0; font-size: 0.65rem; color: var(--text-2, var(--text-1)); }
        .wc-color-pop-swatches { display: flex; flex-direction: column; gap: 0.375rem; border-top: 1px solid var(--surface-4); padding-top: 0.5rem; }
      }

      /* Unlayered: the wc.ui layer styles bare input and outranks wc.usage. */
      .wc-color-pop .wc-color-field input {
        width: 100%;
        min-width: 0;
        height: 26px;
        margin: 0;
        padding: 0 0.3rem;
        background-color: var(--surface-1);
        border: 1px solid var(--surface-4);
        border-radius: 0.25rem;
        color: var(--text-1);
        font: inherit;
        font-size: 0.75rem;
        font-variant-numeric: tabular-nums;
        box-sizing: border-box;
        -moz-appearance: textfield;
      }
      .wc-color-pop .wc-color-field input::-webkit-inner-spin-button,
      .wc-color-pop .wc-color-field input::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    `.trim();
    this.loadStyle('wc-color-style', style);
  }
}

if (!customElements.get(WcColor.is)) customElements.define(WcColor.is, WcColor);
export { WcColor };
