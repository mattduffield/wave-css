/**
 *
 *  Name: wc-color
 *  Usage:
 *    A form-associated color picker field. Shows a swatch + the text value; clicking opens the
 *    native color picker (hex); optional preset swatches allow one-click selection. Submits a
 *    normal named form value in the chosen `format` (hex by default) — the standard save path
 *    stores it under `name` with no special handling.
 *
 *    <wc-color
 *        name="label_color"
 *        value="{{ Record.label_color }}"   <!-- e.g. "#3b82f6" -->
 *        lbl-label="Label Color"
 *        format="hex"                        <!-- hex | rgb | hsl -->
 *        swatches='["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7"]'
 *        allow-custom                        <!-- default true; allow-custom="false" → presets only -->
 *        required>
 *    </wc-color>
 *
 *  Attributes:
 *    name (required), value, lbl-label, format (hex|rgb|hsl), swatches (JSON array of colors),
 *    allow-custom (default true), required, disabled
 *
 *  Events (bubbling, composed):
 *    wccolorchange — on change; detail { value }  (legacy alias wc-color:change)
 *
 *  Foundation: the native <input type="color"> handles picking (hex). The stored/submitted value
 *  is converted to `format` (rgb/hsl computed from the picked hex); any incoming color string
 *  (hex / rgb() / hsl()) is parsed back to hex to seed the swatch. Alpha is not supported by the
 *  native picker (out of scope). htmx-safe: re-seeds on value change; initializes on swap.
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcColor extends WcBaseFormComponent {
  static get is() {
    return 'wc-color';
  }

  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'lbl-label', 'format', 'swatches', 'allow-custom', 'required', 'disabled'];
  }

  constructor() {
    super();
    this._hex = '';     // canonical internal value (#rrggbb)
    this._value = '';   // submitted value (in `format`)

    this._onSwatchClick = this._handleSwatchClick.bind(this);
    this._onNativeInput = this._handleNativeInput.bind(this);
    this._onPresetClick = this._handlePresetClick.bind(this);

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
    this._unWireEvents();
  }

  // ---- Value contract (FACE) ------------------------------------------------

  get value() { return this._value; }
  set value(v) {
    this._setFromString(v);
    this._reflect(false);
  }

  get format() {
    const f = (this.getAttribute('format') || 'hex').toLowerCase();
    return ['hex', 'rgb', 'hsl'].includes(f) ? f : 'hex';
  }

  get allowCustom() {
    return this.getAttribute('allow-custom') !== 'false';
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
    if (!this.allowCustom) swatch.classList.add('is-locked');
    control.appendChild(swatch);
    this.swatchEl = swatch;

    const valueText = document.createElement('span');
    valueText.classList.add('wc-color-value');
    control.appendChild(valueText);
    this.valueEl = valueText;

    // Hidden native picker (the actual color chooser)
    const native = document.createElement('input');
    native.type = 'color';
    native.classList.add('wc-color-native');
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');
    if (this.hasAttribute('disabled')) native.disabled = true;
    control.appendChild(native);
    this.nativeEl = native;

    this.componentElement.appendChild(control);

    // Preset swatches
    const swatches = this._parseJSON('swatches', []);
    if (swatches.length) {
      const presets = document.createElement('div');
      presets.classList.add('wc-color-presets');
      swatches.forEach(c => {
        const hex = this._toHex(String(c));
        if (!hex) return;
        const b = document.createElement('button');
        b.type = 'button';
        b.classList.add('wc-color-preset');
        b.dataset.hex = hex;
        b.style.backgroundColor = hex;
        b.title = String(c);
        b.setAttribute('aria-label', String(c));
        presets.appendChild(b);
      });
      this.componentElement.appendChild(presets);
      this.presetsEl = presets;
    }
  }

  // ---- Value seeding / reflection ------------------------------------------

  _seedValue() {
    this._setFromString(this.getAttribute('value'));
    this._reflect(false);
  }

  _setFromString(str) {
    const hex = this._toHex(str);
    this._hex = hex || '';
    this._value = hex ? this._toFormat(hex) : '';
  }

  // Push current state into the DOM + form value.
  _reflect(emit) {
    if (this.swatchEl) {
      if (this._hex) {
        this.swatchEl.style.backgroundColor = this._hex;
        this.swatchEl.classList.remove('is-empty');
      } else {
        this.swatchEl.style.backgroundColor = '';
        this.swatchEl.classList.add('is-empty');
      }
    }
    if (this.valueEl) this.valueEl.textContent = this._value || 'No color';
    if (this.nativeEl && this._hex) this.nativeEl.value = this._hex;
    if (this.presetsEl) {
      this.presetsEl.querySelectorAll('.wc-color-preset').forEach(b => {
        b.classList.toggle('is-active', b.dataset.hex.toLowerCase() === this._hex.toLowerCase());
      });
    }
    this._internals.setFormValue(this._value);
    this._updateValidity();
    if (emit) {
      this._emitEvent('wccolorchange', 'wc-color:change', {
        bubbles: true, composed: true, detail: { value: this._value }
      });
    }
  }

  _setHex(hex, emit) {
    const norm = this._toHex(hex);
    if (!norm) return;
    this._hex = norm;
    this._value = this._toFormat(norm);
    this._reflect(emit);
  }

  _updateValidity() {
    if (this.hasAttribute('required') && !this._value) {
      this._internals.setValidity({ valueMissing: true }, 'Please choose a color.', this.swatchEl || this);
    } else {
      this._internals.setValidity({});
    }
  }

  // ---- Interaction ----------------------------------------------------------

  _handleSwatchClick(e) {
    if (this.hasAttribute('disabled') || !this.allowCustom) return;
    this.nativeEl.click();
  }

  _handleNativeInput() {
    this._setHex(this.nativeEl.value, true);
  }

  _handlePresetClick(e) {
    const b = e.target.closest('.wc-color-preset');
    if (!b || this.hasAttribute('disabled')) return;
    this._setHex(b.dataset.hex, true);
  }

  // ---- Color conversion -----------------------------------------------------

  _toHex(str) {
    if (str == null) return null;
    let s = String(str).trim().toLowerCase();
    if (!s) return null;
    let m;
    if ((m = s.match(/^#([0-9a-f]{3})$/))) {
      const c = m[1];
      return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}`;
    }
    if ((m = s.match(/^#([0-9a-f]{6})$/))) return s;
    if ((m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/))) {
      return this._rgbToHex(+m[1], +m[2], +m[3]);
    }
    if ((m = s.match(/^hsla?\(\s*([\d.]+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%/))) {
      const { r, g, b } = this._hslToRgb(+m[1], +m[2], +m[3]);
      return this._rgbToHex(r, g, b);
    }
    return null;
  }

  _toFormat(hex) {
    const fmt = this.format;
    if (fmt === 'hex') return hex;
    const { r, g, b } = this._hexToRgb(hex);
    if (fmt === 'rgb') return `rgb(${r}, ${g}, ${b})`;
    const { h, s, l } = this._rgbToHsl(r, g, b);
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  _hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
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
      this._reflect(false);
      return;
    }
    if (attrName === 'required') { this._updateValidity(); return; }
    if (['format', 'swatches', 'allow-custom', 'lbl-label', 'disabled'].includes(attrName)) {
      const hex = this._hex;
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
      this._wireEvents();
      this._hex = hex;
      this._value = hex ? this._toFormat(hex) : '';
      this._reflect(false);
      return;
    }
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    super._handleAttributeChange(attrName, newValue);
  }

  _applyStyle() {
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
          background-image:
            linear-gradient(45deg, var(--surface-4) 25%, transparent 25%),
            linear-gradient(-45deg, var(--surface-4) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, var(--surface-4) 75%),
            linear-gradient(-45deg, transparent 75%, var(--surface-4) 75%);
          background-size: 10px 10px;
          background-position: 0 0, 0 5px, 5px -5px, -5px 0;
        }
        .wc-color-swatch:not(.is-empty) { background-image: none; }
        .wc-color-swatch:focus-visible { outline: var(--primary-bg-color) solid 2px; outline-offset: 1px; }
        .wc-color-swatch.is-locked { cursor: default; }
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
        .wc-color-presets { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .wc-color-preset {
          width: 1.5rem; height: 1.5rem;
          padding: 0;
          border: 1px solid var(--surface-4);
          border-radius: 0.25rem;
          cursor: pointer;
        }
        .wc-color-preset:hover { transform: scale(1.1); }
        .wc-color-preset.is-active {
          outline: 2px solid var(--text-1);
          outline-offset: 1px;
        }
        wc-color[required] .wc-color > label::after { content: ' *'; font-weight: bold; }
      }
    `.trim();
    this.loadStyle('wc-color-style', style);
  }
}

customElements.define(WcColor.is, WcColor);
export { WcColor };
