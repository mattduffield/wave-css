/**
 *
 *  Name: wc-rating
 *  Usage:
 *    A form-associated icon rating field. Renders `max` icons using THREE distinct wc-fa-icon
 *    glyphs — empty / half / full — so a partial value shows a visually distinct half glyph
 *    (not a CSS-clipped full icon). Editable or readonly; submits a number under `name`.
 *
 *    <wc-rating
 *        name="satisfaction" value="3.5" lbl-label="Satisfaction"
 *        max="5" allow-half
 *        icon-empty="star" icon-half="star-half-stroke" icon-full="star"
 *        color="#f59e0b" size="1.25rem" required>
 *    </wc-rating>
 *
 *  The empty vs full distinction is by ICON STYLE as much as name (e.g. `star` regular outline
 *  vs `star` solid). Per-state style defaults: empty/half → regular, full → solid; override with
 *  icon-empty-style / icon-half-style / icon-full-style.
 *
 *  Attributes:
 *    name (required), value (number), lbl-label, max (default 5), allow-half,
 *    icon-empty (default star), icon-half (default star-half-stroke), icon-full (default star),
 *    icon-empty-style (regular), icon-half-style (regular), icon-full-style (solid),
 *    color, size (default 1.25rem), readonly, required, disabled,
 *    show-value (append the numeric value), count (append " (N)" — handy in list/detail display)
 *
 *  Events (bubbling, composed):
 *    wcratingchange — on change; detail { value }  (legacy alias wc-rating:change)
 *
 *  Submits the number via FACE setFormValue under the host `name`. value seeds + round-trips;
 *  required → invalid at 0/unset. htmx-safe: re-renders on attribute change; inits on swap.
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcRating extends WcBaseFormComponent {
  static get is() {
    return 'wc-rating';
  }

  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'lbl-label', 'max', 'allow-half',
      'icon-empty', 'icon-half', 'icon-full',
      'icon-empty-style', 'icon-half-style', 'icon-full-style',
      'color', 'size', 'readonly', 'required', 'disabled', 'show-value', 'count'];
  }

  constructor() {
    super();
    this._value = 0;

    this._onClick = this._handleClick.bind(this);
    this._onMove = this._handleMove.bind(this);
    this._onLeave = this._handleLeave.bind(this);
    this._onKeydown = this._handleKeydown.bind(this);

    const compEl = this.querySelector(':scope > .wc-rating');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-rating');
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
    this._value = this._clamp(parseFloat(v));
    this._renderStars(this._value);
    this._reflect(false);
  }

  get max() { return Math.max(1, parseInt(this.getAttribute('max'), 10) || 5); }
  get allowHalf() { return this.hasAttribute('allow-half'); }
  get step() { return this.allowHalf ? 0.5 : 1; }
  get interactive() { return !this.hasAttribute('readonly') && !this.hasAttribute('disabled'); }

  // ---- Lifecycle ------------------------------------------------------------

  _render() {
    super._render();
    const built = this.componentElement.querySelector(':scope > .wc-rating-stars');
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

    const row = document.createElement('div');
    row.classList.add('wc-rating-row');

    const stars = document.createElement('div');
    stars.classList.add('wc-rating-stars');
    stars.setAttribute('role', 'slider');
    stars.setAttribute('aria-valuemin', '0');
    stars.setAttribute('aria-valuemax', String(this.max));
    if (this.interactive) stars.tabIndex = 0;
    if (this.hasAttribute('readonly')) stars.setAttribute('aria-readonly', 'true');

    const color = this.getAttribute('color');
    if (color) this.componentElement.style.setProperty('--wc-rating-color', color);
    const size = this.getAttribute('size') || '1.25rem';

    for (let i = 1; i <= this.max; i++) {
      const star = document.createElement('span');
      star.classList.add('wc-rating-star');
      star.dataset.pos = String(i);
      const icon = document.createElement('wc-fa-icon');
      icon.setAttribute('size', size);
      star.appendChild(icon);
      stars.appendChild(star);
    }
    row.appendChild(stars);
    this.starsEl = stars;

    const suffix = document.createElement('span');
    suffix.classList.add('wc-rating-suffix');
    row.appendChild(suffix);
    this.suffixEl = suffix;

    this.componentElement.appendChild(row);
  }

  // ---- State / rendering ----------------------------------------------------

  _seedValue() {
    this._value = this._clamp(parseFloat(this.getAttribute('value')));
    this._renderStars(this._value);
    this._reflect(false);
  }

  _clamp(v) {
    if (isNaN(v)) return 0;
    v = Math.max(0, Math.min(this.max, v));
    // snap to step
    const step = this.step;
    return Math.round(v / step) * step;
  }

  // Paint each position for a given display value using the three distinct glyphs.
  _renderStars(displayValue) {
    if (!this.starsEl) return;
    const full = Math.floor(displayValue);
    const hasHalf = this.allowHalf && (displayValue - full >= 0.5);
    const emptyName = this.getAttribute('icon-empty') || 'star';
    const halfName = this.getAttribute('icon-half') || 'star-half-stroke';
    const fullName = this.getAttribute('icon-full') || 'star';
    const emptyStyle = this.getAttribute('icon-empty-style') || 'regular';
    const halfStyle = this.getAttribute('icon-half-style') || 'regular';
    const fullStyle = this.getAttribute('icon-full-style') || 'solid';

    const stars = this.starsEl.querySelectorAll('.wc-rating-star');
    stars.forEach((star, idx) => {
      const pos = idx + 1;
      const icon = star.querySelector('wc-fa-icon');
      let state, name, iconStyle;
      if (pos <= full) { state = 'full'; name = fullName; iconStyle = fullStyle; }
      else if (hasHalf && pos === full + 1) { state = 'half'; name = halfName; iconStyle = halfStyle; }
      else { state = 'empty'; name = emptyName; iconStyle = emptyStyle; }
      star.classList.toggle('is-full', state === 'full');
      star.classList.toggle('is-half', state === 'half');
      star.classList.toggle('is-empty', state === 'empty');
      // setAttribute only re-renders wc-fa-icon when the value actually changes.
      if (icon.getAttribute('name') !== name) icon.setAttribute('name', name);
      if (icon.getAttribute('icon-style') !== iconStyle) icon.setAttribute('icon-style', iconStyle);
    });
  }

  _reflect(emit) {
    if (this.starsEl) this.starsEl.setAttribute('aria-valuenow', String(this._value));
    if (this.suffixEl) {
      let txt = '';
      if (this.hasAttribute('show-value')) txt += String(this._value);
      if (this.hasAttribute('count')) txt += `${txt ? ' ' : ''}(${this.getAttribute('count')})`;
      this.suffixEl.textContent = txt;
      this.suffixEl.hidden = !txt;
    }
    this._internals.setFormValue(String(this._value));
    this._updateValidity();
    if (emit) {
      this._emitEvent('wcratingchange', 'wc-rating:change', {
        bubbles: true, composed: true, detail: { value: this._value }
      });
    }
  }

  _setValue(v, emit) {
    const nv = this._clamp(v);
    this._value = nv;
    this._renderStars(nv);
    this._reflect(emit);
  }

  _updateValidity() {
    if (this.hasAttribute('required') && !(this._value > 0)) {
      this._internals.setValidity({ valueMissing: true }, 'Please choose a rating.', this.starsEl || this);
    } else {
      this._internals.setValidity({});
    }
  }

  // ---- Interaction ----------------------------------------------------------

  _valueFromPointer(e) {
    const star = e.target.closest('.wc-rating-star');
    if (!star || !this.starsEl.contains(star)) return null;
    const pos = parseInt(star.dataset.pos, 10);
    if (this.allowHalf) {
      const r = star.getBoundingClientRect();
      return (e.clientX - r.left) < r.width / 2 ? pos - 0.5 : pos;
    }
    return pos;
  }

  _handleMove(e) {
    if (!this.interactive) return;
    const v = this._valueFromPointer(e);
    if (v != null) this._renderStars(v); // preview only — does not change _value
  }

  _handleLeave() {
    if (!this.interactive) return;
    this._renderStars(this._value); // restore actual
  }

  _handleClick(e) {
    if (!this.interactive) return;
    const v = this._valueFromPointer(e);
    if (v != null) this._setValue(v, true);
  }

  _handleKeydown(e) {
    if (!this.interactive) return;
    let handled = true;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') this._setValue(this._value + this.step, true);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') this._setValue(this._value - this.step, true);
    else if (e.key === 'Home') this._setValue(0, true);
    else if (e.key === 'End') this._setValue(this.max, true);
    else handled = false;
    if (handled) e.preventDefault();
  }

  // ---- Wiring ---------------------------------------------------------------

  _wireEvents() {
    this.formElement = null; // no native input; nothing for the base to bind
    super._wireEvents();
    if (!this.starsEl) return;
    this.starsEl.removeEventListener('click', this._onClick);
    this.starsEl.addEventListener('click', this._onClick);
    this.starsEl.removeEventListener('mousemove', this._onMove);
    this.starsEl.addEventListener('mousemove', this._onMove);
    this.starsEl.removeEventListener('mouseleave', this._onLeave);
    this.starsEl.addEventListener('mouseleave', this._onLeave);
    this.starsEl.removeEventListener('keydown', this._onKeydown);
    this.starsEl.addEventListener('keydown', this._onKeydown);
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.starsEl) {
      this.starsEl.removeEventListener('click', this._onClick);
      this.starsEl.removeEventListener('mousemove', this._onMove);
      this.starsEl.removeEventListener('mouseleave', this._onLeave);
      this.starsEl.removeEventListener('keydown', this._onKeydown);
    }
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'value') {
      this._value = this._clamp(parseFloat(newValue));
      this._renderStars(this._value);
      this._reflect(false);
      return;
    }
    if (attrName === 'required') { this._updateValidity(); return; }
    if (['max', 'allow-half', 'icon-empty', 'icon-half', 'icon-full',
         'icon-empty-style', 'icon-half-style', 'icon-full-style',
         'color', 'size', 'readonly', 'disabled', 'lbl-label', 'show-value', 'count'].includes(attrName)) {
      const v = this._value;
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
      this._wireEvents();
      this._value = this._clamp(v);
      this._renderStars(this._value);
      this._reflect(false);
      return;
    }
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    super._handleAttributeChange(attrName, newValue);
  }

  _applyStyle() {
    const style = `
      wc-rating { display: contents; }

      @layer wc.usage {
        .wc-rating { display: flex; flex-direction: column; gap: 0.25rem; --wc-rating-color: var(--warning-color, #f59e0b); }
        .wc-rating > label { font-weight: 500; }
        .wc-rating-row { display: inline-flex; align-items: center; gap: 0.5rem; }
        .wc-rating-stars {
          display: inline-flex;
          align-items: center;
          gap: 0.125rem;
          line-height: 1;
        }
        .wc-rating-stars:focus-visible {
          outline: var(--primary-bg-color) solid 2px;
          outline-offset: 2px;
          border-radius: 0.25rem;
        }
        .wc-rating-star {
          display: inline-flex;
          color: var(--wc-rating-color);
        }
        .wc-rating-star.is-empty {
          color: var(--text-3, var(--component-alt-color));
          opacity: 0.55;
        }
        wc-rating:not([readonly]):not([disabled]) .wc-rating-star { cursor: pointer; }
        wc-rating[disabled] .wc-rating-stars { opacity: 0.6; cursor: not-allowed; }
        .wc-rating-suffix {
          font-size: 0.85rem;
          color: var(--text-2, var(--component-alt-color));
        }
        wc-rating[required] .wc-rating > label::after { content: ' *'; font-weight: bold; }
      }
    `.trim();
    this.loadStyle('wc-rating-style', style);
  }
}

customElements.define(WcRating.is, WcRating);
export { WcRating };
