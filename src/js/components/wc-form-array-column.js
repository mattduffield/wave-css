/**
 *
 *  Name: wc-form-array-column
 *  Usage:
 *    Configuration-only child of <wc-form-array>. Declares one column of the
 *    repeatable sub-form. Renders nothing itself — the parent <wc-form-array>
 *    reads these attributes to build each row's controls.
 *
 *    <wc-form-array name="line_items" value='[...]'>
 *      <wc-form-array-column field="product_id" label="Product" type="select"
 *                            options='[{"_id":"a","name":"Widget"}]'
 *                            option-value="_id" option-label="name"></wc-form-array-column>
 *      <wc-form-array-column field="quantity"   label="Quantity"   type="number" min="1" step="1"></wc-form-array-column>
 *      <wc-form-array-column field="unit_price" label="Unit Price" type="number" min="0" step="0.01"></wc-form-array-column>
 *    </wc-form-array>
 *
 *  Attributes:
 *    field         (required) — the object key this column maps to (the `sub` in `${name}.${index}.${sub}`)
 *    label                    — column header text (defaults to field)
 *    type                     — text | number | date | select  (default: text)
 *    options                  — JSON array for `select` columns. Inline option list OR a
 *                               collection of records (reference column).
 *    option-value             — for `select`: which member of each option object is the stored value (e.g. "_id")
 *    option-label             — for `select`: which member is the visible label (e.g. "name")
 *    placeholder              — placeholder text for text/number/date inputs
 *    min / max / step         — passed through to number/date inputs
 *    required                 — mark the per-row control required
 *    col-class                — extra class(es) applied to this column's cells (width/align)
 *
 *  Note: this element is purely declarative configuration. It is hidden and never
 *        participates in form submission; only the controls <wc-form-array> renders do.
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcFormArrayColumn extends WcBaseComponent {
  static get is() {
    return 'wc-form-array-column';
  }

  static get observedAttributes() {
    return [
      'field', 'label', 'type', 'options', 'option-value', 'option-label',
      'placeholder', 'min', 'max', 'step', 'required', 'col-class'
    ];
  }

  constructor() {
    super();
    // No componentElement / no inner DOM — this is config-only.
  }

  connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    // Notify the parent (if already rendered) that column config changed so it
    // can re-read. Bubbles so wc-form-array can listen on itself.
    this.dispatchEvent(new CustomEvent('wcformarraycolumnchange', { bubbles: true }));
  }

  // Override base render — this element produces no visible output.
  _render() {
    this.classList.add('contents');
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    // Config-only: never mirror attributes onto a componentElement (there is none).
    // Re-notify the parent so it can rebuild affected rows.
    if (this._isConnected) {
      this.dispatchEvent(new CustomEvent('wcformarraycolumnchange', { bubbles: true }));
    }
  }

  /**
   * Return a plain config object the parent uses to build controls.
   */
  getConfig() {
    const type = (this.getAttribute('type') || 'text').toLowerCase();
    let options = [];
    const optionsAttr = this.getAttribute('options');
    if (optionsAttr) {
      try {
        const parsed = JSON.parse(optionsAttr);
        if (Array.isArray(parsed)) options = parsed;
      } catch (ex) {
        console.warn('[wc-form-array-column] invalid options JSON for field', this.getAttribute('field'), ex);
      }
    }
    return {
      field: this.getAttribute('field') || '',
      label: this.getAttribute('label') || this.getAttribute('field') || '',
      type,
      options,
      optionValue: this.getAttribute('option-value') || 'value',
      optionLabel: this.getAttribute('option-label') || 'key',
      placeholder: this.getAttribute('placeholder') || '',
      min: this.getAttribute('min'),
      max: this.getAttribute('max'),
      step: this.getAttribute('step'),
      required: this.hasAttribute('required'),
      colClass: this.getAttribute('col-class') || ''
    };
  }

  _applyStyle() {
    const style = `
      wc-form-array-column {
        display: none;
      }
    `.trim();
    this.loadStyle('wc-form-array-column-style', style);
  }
}

customElements.define(WcFormArrayColumn.is, WcFormArrayColumn);
export { WcFormArrayColumn };
