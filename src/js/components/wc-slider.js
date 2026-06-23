/**
 *
 *  Name: wc-slider
 *  Usage:
 *    A form-associated bounded numeric slider. Styled range track + thumb with a value readout,
 *    optional unit + tick marks, and an optional dual-thumb range mode. Submits a normal named
 *    number value — the standard save path stores it under `name` with no special handling.
 *
 *    <wc-slider name="discount_pct" value="15" lbl-label="Discount %"
 *               min="0" max="100" step="5" show-value unit="%"
 *               marks='[0,25,50,75,100]' required></wc-slider>
 *
 *    <!-- dual-thumb range -->
 *    <wc-slider name="price_band" range value="20,80" min="0" max="200" step="10" unit="$" show-value></wc-slider>
 *
 *  Attributes:
 *    name (required), value, lbl-label, min (0), max (100), step (1),
 *    show-value, unit, marks (JSON array of numbers), range, required, disabled
 *
 *  Value encoding:
 *    single → the number as a string ("15"); range → "min,max" ("20,80"). value= accepts the
 *    same forms (range also accepts a JSON array [20,80] or {min,max}).
 *
 *  Events (bubbling, composed):
 *    wcsliderchange — on commit (change); detail { value }   (legacy alias wc-slider:change)
 *    wcsliderinput  — while dragging (input); detail { value } (legacy alias wc-slider:input)
 *
 *  `required` blocks an UNSEEDED + UNTOUCHED slider: the submitted value is empty until a `value`
 *  is provided or the user interacts (so a never-set required slider is invalid, and the server
 *  isn't handed a spurious `min`). htmx-safe; FACE setFormValue under `name`; @layer wc.usage.
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcSlider extends WcBaseFormComponent {
  static get is() {
    return 'wc-slider';
  }

  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'lbl-label', 'min', 'max', 'step',
      'show-value', 'unit', 'marks', 'range', 'required', 'disabled'];
  }

  constructor() {
    super();
    this._value = '';      // submitted value ("15" | "20,80" | "")
    this._lo = null;
    this._hi = null;
    this._touched = false;

    this._onInput = this._handleInput.bind(this);
    this._onChange = this._handleChange.bind(this);

    const compEl = this.querySelector(':scope > .wc-slider');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-slider');
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
    this._seedFromValue(v, true);
    this._reflect(false);
  }

  get range() { return this.hasAttribute('range'); }
  get min() { const n = parseFloat(this.getAttribute('min')); return isNaN(n) ? 0 : n; }
  get max() { const n = parseFloat(this.getAttribute('max')); return isNaN(n) ? 100 : n; }
  get step() { const n = parseFloat(this.getAttribute('step')); return (isNaN(n) || n <= 0) ? 1 : n; }

  // ---- Lifecycle ------------------------------------------------------------

  _render() {
    super._render();
    const built = this.componentElement.querySelector(':scope > .wc-slider-control');
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
    control.classList.add('wc-slider-control');

    const track = document.createElement('div');
    track.classList.add('wc-slider-track-wrap');
    if (this.range) track.classList.add('is-range');

    const mkInput = (cls) => {
      const i = document.createElement('input');
      i.type = 'range';
      i.classList.add('wc-slider-input', cls);
      i.min = this.min; i.max = this.max; i.step = this.step;
      if (this.hasAttribute('disabled')) i.disabled = true;
      return i;
    };

    if (this.range) {
      const rail = document.createElement('div'); rail.classList.add('wc-slider-rail');
      const fill = document.createElement('div'); fill.classList.add('wc-slider-fill');
      track.appendChild(rail);
      track.appendChild(fill);
      this.fillEl = fill;
      this.loInput = mkInput('wc-slider-lo');
      this.hiInput = mkInput('wc-slider-hi');
      track.appendChild(this.loInput);
      track.appendChild(this.hiInput);
    } else {
      this.input = mkInput('wc-slider-single');
      track.appendChild(this.input);
    }
    control.appendChild(track);
    this.trackEl = track;

    if (this.hasAttribute('show-value')) {
      const readout = document.createElement('span');
      readout.classList.add('wc-slider-readout');
      control.appendChild(readout);
      this.readoutEl = readout;
    }
    this.componentElement.appendChild(control);

    // Marks / ticks
    const marks = this._parseJSON('marks', []);
    if (marks.length) {
      const wrap = document.createElement('div');
      wrap.classList.add('wc-slider-marks');
      const span = this.max - this.min || 1;
      marks.forEach(m => {
        const num = parseFloat(m);
        if (isNaN(num)) return;
        const pct = ((num - this.min) / span) * 100;
        const tick = document.createElement('span');
        tick.classList.add('wc-slider-mark');
        tick.style.left = `${pct}%`;
        tick.textContent = String(m);
        wrap.appendChild(tick);
      });
      this.componentElement.appendChild(wrap);
    }
  }

  // ---- Value seeding / reflection ------------------------------------------

  _seedValue() {
    const raw = this.getAttribute('value');
    if (raw != null && raw !== '') {
      this._seedFromValue(raw, false);
    } else {
      // Unseeded: position thumbs at sensible defaults but keep submitted value empty.
      if (this.range) { this._lo = this.min; this._hi = this.max; }
      else { this._single = this.min; }
      this._value = '';
    }
    this._reflect(false);
  }

  _seedFromValue(raw, touched) {
    if (this.range) {
      let lo = this.min, hi = this.max;
      const parsed = this._parseRange(raw);
      if (parsed) { lo = parsed[0]; hi = parsed[1]; }
      this._lo = this._clamp(lo);
      this._hi = this._clamp(hi);
      if (this._lo > this._hi) { const t = this._lo; this._lo = this._hi; this._hi = t; }
      this._value = `${this._lo},${this._hi}`;
    } else {
      const n = this._clamp(parseFloat(raw));
      this._single = isNaN(n) ? this.min : n;
      this._value = isNaN(n) ? '' : String(this._single);
    }
    if (touched) this._touched = true;
  }

  _parseRange(raw) {
    if (raw == null) return null;
    if (Array.isArray(raw)) return [parseFloat(raw[0]), parseFloat(raw[1])];
    if (typeof raw === 'object') return [parseFloat(raw.min), parseFloat(raw.max)];
    const s = String(raw).trim();
    try {
      const j = JSON.parse(s);
      if (Array.isArray(j)) return [parseFloat(j[0]), parseFloat(j[1])];
      if (j && typeof j === 'object') return [parseFloat(j.min), parseFloat(j.max)];
    } catch (ex) { /* fall through to CSV */ }
    const parts = s.split(',').map(p => parseFloat(p.trim()));
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) return [parts[0], parts[1]];
    return null;
  }

  _clamp(n) {
    if (isNaN(n)) return n;
    n = Math.max(this.min, Math.min(this.max, n));
    const steps = Math.round((n - this.min) / this.step);
    return Math.round((this.min + steps * this.step) * 1e6) / 1e6;
  }

  // Push state into inputs + fill + readout + form value.
  _reflect(emit) {
    const span = this.max - this.min || 1;
    if (this.range) {
      if (this.loInput && this._lo != null) this.loInput.value = this._lo;
      if (this.hiInput && this._hi != null) this.hiInput.value = this._hi;
      if (this.fillEl) {
        const loPct = ((this._lo - this.min) / span) * 100;
        const hiPct = ((this._hi - this.min) / span) * 100;
        this.fillEl.style.left = `${loPct}%`;
        this.fillEl.style.right = `${100 - hiPct}%`;
      }
    } else if (this.input && this._single != null) {
      this.input.value = this._single;
      const pct = ((this._single - this.min) / span) * 100;
      this.input.style.setProperty('--wc-slider-pct', `${pct}%`);
    }

    if (this.readoutEl) this.readoutEl.textContent = this._readoutText();
    this._internals.setFormValue(this._value);
    this._updateValidity();
    if (emit) {
      this._emitEvent('wcsliderchange', 'wc-slider:change', {
        bubbles: true, composed: true, detail: { value: this._value }
      });
    }
  }

  _readoutText() {
    const u = this.getAttribute('unit') || '';
    if (this.range) return `${this._lo}${u} – ${this._hi}${u}`;
    return this._value === '' ? `${this._single}${u}` : `${this._single}${u}`;
  }

  _updateValidity() {
    if (this.hasAttribute('required') && this._value === '') {
      this._internals.setValidity({ valueMissing: true }, 'Please choose a value.', this.trackEl || this);
    } else {
      this._internals.setValidity({});
    }
  }

  _parseJSON(attr, fallback) {
    const raw = this.getAttribute(attr);
    if (!raw) return fallback;
    try { const v = JSON.parse(raw); return Array.isArray(v) ? v : fallback; }
    catch (ex) { console.warn(`[wc-slider] invalid JSON for ${attr}`, ex); return fallback; }
  }

  // ---- Interaction ----------------------------------------------------------

  _handleInput(e) {
    this._touched = true;
    if (this.range) {
      let lo = parseFloat(this.loInput.value);
      let hi = parseFloat(this.hiInput.value);
      // Prevent the thumbs from crossing.
      if (e.target === this.loInput && lo > hi) lo = hi;
      if (e.target === this.hiInput && hi < lo) hi = lo;
      this._lo = lo; this._hi = hi;
      this._value = `${lo},${hi}`;
    } else {
      this._single = parseFloat(this.input.value);
      this._value = String(this._single);
    }
    this._reflect(false);
    this._emitEvent('wcsliderinput', 'wc-slider:input', {
      bubbles: true, composed: true, detail: { value: this._value }
    });
  }

  _handleChange() {
    this._emitEvent('wcsliderchange', 'wc-slider:change', {
      bubbles: true, composed: true, detail: { value: this._value }
    });
  }

  // ---- Wiring ---------------------------------------------------------------

  _wireEvents() {
    this.formElement = null; // we own the range input(s); base must not auto-bind one
    super._wireEvents();
    const inputs = this.range ? [this.loInput, this.hiInput] : [this.input];
    inputs.forEach(i => {
      if (!i) return;
      i.removeEventListener('input', this._onInput);
      i.addEventListener('input', this._onInput);
      i.removeEventListener('change', this._onChange);
      i.addEventListener('change', this._onChange);
    });
  }

  _unWireEvents() {
    super._unWireEvents();
    [this.input, this.loInput, this.hiInput].forEach(i => {
      if (!i) return;
      i.removeEventListener('input', this._onInput);
      i.removeEventListener('change', this._onChange);
    });
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'value') {
      this._seedFromValue(newValue, false);
      this._reflect(false);
      return;
    }
    if (attrName === 'required') { this._updateValidity(); return; }
    if (['min', 'max', 'step', 'show-value', 'unit', 'marks', 'range', 'lbl-label', 'disabled'].includes(attrName)) {
      const prev = this._value;
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
      this._wireEvents();
      if (prev) this._seedFromValue(prev, this._touched);
      else this._seedValue();
      this._reflect(false);
      return;
    }
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    super._handleAttributeChange(attrName, newValue);
  }

  _applyStyle() {
    const style = `
      wc-slider { display: contents; }

      @layer wc.usage {
        .wc-slider { display: flex; flex-direction: column; gap: 0.375rem; --wc-slider-color: var(--primary-bg-color); }
        .wc-slider > label { font-weight: 500; }
        .wc-slider-control { display: flex; align-items: center; gap: 0.75rem; }
        .wc-slider-track-wrap { position: relative; flex: 1 1 auto; height: 1.5rem; display: flex; align-items: center; }

        .wc-slider-single {
          width: 100%;
          accent-color: var(--wc-slider-color);
          cursor: pointer;
        }
        .wc-slider-readout {
          flex: 0 0 auto;
          min-width: 2.5rem;
          font-variant-numeric: tabular-nums;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-1);
        }

        /* Dual-thumb range */
        .wc-slider-track-wrap.is-range { }
        .wc-slider-rail {
          position: absolute; left: 0; right: 0; height: 4px;
          background: var(--surface-4); border-radius: 999px;
        }
        .wc-slider-fill {
          position: absolute; height: 4px;
          background: var(--wc-slider-color); border-radius: 999px;
        }
        .wc-slider-track-wrap.is-range .wc-slider-input {
          position: absolute; left: 0; right: 0; width: 100%;
          margin: 0; background: none; pointer-events: none;
          -webkit-appearance: none; appearance: none;
        }
        .wc-slider-track-wrap.is-range .wc-slider-input::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          pointer-events: auto;
          width: 16px; height: 16px; border-radius: 50%;
          background: var(--wc-slider-color); border: 2px solid var(--surface-1, #fff);
          cursor: pointer; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .wc-slider-track-wrap.is-range .wc-slider-input::-moz-range-thumb {
          pointer-events: auto;
          width: 16px; height: 16px; border: 2px solid var(--surface-1, #fff); border-radius: 50%;
          background: var(--wc-slider-color); cursor: pointer;
        }
        .wc-slider-track-wrap.is-range .wc-slider-input::-webkit-slider-runnable-track { background: none; }
        .wc-slider-track-wrap.is-range .wc-slider-input::-moz-range-track { background: none; }
        .wc-slider-track-wrap.is-range .wc-slider-hi { z-index: 4; }
        .wc-slider-track-wrap.is-range .wc-slider-lo { z-index: 3; }
        .wc-slider-input:focus-visible::-webkit-slider-thumb { outline: 2px solid var(--wc-slider-color); outline-offset: 2px; }

        .wc-slider-marks {
          position: relative; height: 1rem; margin: 0 0.25rem;
        }
        .wc-slider-mark {
          position: absolute; transform: translateX(-50%);
          font-size: 0.68rem; color: var(--text-3, var(--component-alt-color));
          white-space: nowrap;
        }
        .wc-slider-mark::before {
          content: ''; position: absolute; top: -0.375rem; left: 50%;
          width: 1px; height: 0.25rem; background: var(--surface-4);
        }
        wc-slider[disabled] .wc-slider-control { opacity: 0.6; }
        wc-slider[required] .wc-slider > label::after { content: ' *'; font-weight: bold; }
      }
    `.trim();
    this.loadStyle('wc-slider-style', style);
  }
}

customElements.define(WcSlider.is, WcSlider);
export { WcSlider };
