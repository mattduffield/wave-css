/**
 *
 *  Name: wc-form-array
 *  Usage:
 *    A declarative, repeatable sub-form for an array-of-objects, designed to live
 *    INSIDE <wc-form>. It renders an editable, add/remove, re-indexable set of rows
 *    and emits REAL native form controls named with the dotted-index convention
 *    (`${name}.${index}.${field}`) so the standard server save path reconstructs the
 *    array — no JSON serialization, no custom endpoint.
 *
 *    <wc-form>
 *      <wc-form-array name="line_items"
 *          value='{{ Record.line_items|toJSON|safe }}'
 *          min-rows="1" max-rows="" add-label="Add line item">
 *        <wc-form-array-column field="product_id" label="Product" type="select"
 *                              options='{{ Data.product_options|toJSON|safe }}'
 *                              option-value="_id" option-label="name"></wc-form-array-column>
 *        <wc-form-array-column field="quantity"   label="Quantity"   type="number" min="1" step="1"></wc-form-array-column>
 *        <wc-form-array-column field="unit_price" label="Unit Price" type="number" min="0" step="0.01"></wc-form-array-column>
 *      </wc-form-array>
 *      <button type="submit" class="btn btn-primary">Save</button>
 *    </wc-form>
 *
 *    Submitting the form produces:
 *      line_items.0.product_id, line_items.0.quantity, line_items.0.unit_price
 *      line_items.1.product_id, line_items.1.quantity, line_items.1.unit_price
 *    which the server (GeneratePayload) reconstructs into:
 *      line_items: [ {product_id, quantity, unit_price}, {…} ]
 *
 *  Attributes:
 *    name        (required) — array field name; used as the dotted-index prefix
 *    value                  — JSON array of row objects (initial rows). Empty/absent → min-rows blank rows
 *    min-rows               — minimum number of rows (default 1); honors schema @minItems
 *    max-rows               — optional maximum number of rows (blank = unlimited)
 *    add-label              — label for the add button (default "Add")
 *    readonly               — render rows as non-editable static text (no add/remove, no submission)
 *
 *  Events (bubbling, composed):
 *    wcformarraychange      — fired on any add/remove/edit; detail = { name, rows }
 *                             (legacy alias `wc-form-array:change` also fired, deprecated)
 *
 *  Hard guarantee:
 *    After ANY add or remove, every control's `name` is renumbered so indices stay
 *    contiguous 0..n-1. Gaps would create null/empty holes in the saved array.
 *
 *  Empty-row handling:
 *    On submission (native submit OR htmx:configRequest), fully-blank rows are excluded
 *    from the payload so a trailing blank row never serializes a junk empty object.
 *    The server pads any positional gap with an empty object, so non-trailing blanks keep
 *    their position. The DOM itself always stays contiguous.
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcFormArray extends WcBaseComponent {
  static get is() {
    return 'wc-form-array';
  }

  static get observedAttributes() {
    return ['id', 'class', 'name', 'value', 'min-rows', 'max-rows', 'add-label', 'readonly'];
  }

  constructor() {
    super();
    this._columns = [];
    this._prefix = this.getAttribute('name') || '';
    // Bound handlers (stored so wiring stays idempotent across htmx swaps / reparents).
    this._onClick = this._handleClick.bind(this);
    this._onInput = this._handleRowInput.bind(this);
    this._onSubmitCapture = this._handleFormSubmitCapture.bind(this);
    this._onHtmxConfig = this._handleHtmxConfigRequest.bind(this);
    this._guardForm = null;

    const compEl = this.querySelector(':scope > .wc-form-array');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-form-array');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  // ---- Public API -----------------------------------------------------------

  get rows() {
    return this._collectRows();
  }

  set rows(arr) {
    this._renderRows(Array.isArray(arr) ? arr : []);
    this._updateControlsState();
    this._emitChange();
  }

  /** Convenience JSON view (parity with form components). */
  get value() {
    return JSON.stringify(this._collectRows());
  }

  set value(v) {
    let arr = [];
    try { arr = JSON.parse(v); } catch (ex) { arr = []; }
    this.rows = Array.isArray(arr) ? arr : [];
  }

  addRow(data = {}) {
    if (this._isReadonly()) return;
    const max = this._maxRows();
    if (max !== null && this._rowCount() >= max) return;
    const row = this._createRow(this._rowCount(), data);
    this.rowsEl.appendChild(row);
    this._renumber();
    this._updateControlsState();
    this._emitChange();
    const firstCtrl = row.querySelector('[data-col]');
    if (firstCtrl && typeof firstCtrl.focus === 'function') firstCtrl.focus();
    return row;
  }

  removeRow(rowOrIndex) {
    if (this._isReadonly()) return;
    let row = rowOrIndex;
    if (typeof rowOrIndex === 'number') {
      row = this.rowsEl.querySelectorAll(':scope > .wc-form-array-row')[rowOrIndex];
    }
    if (!row) return;
    if (this._rowCount() <= this._minRows()) return; // honor min-rows
    row.remove();
    this._renumber();
    this._updateControlsState();
    this._emitChange();
  }

  // ---- Rendering ------------------------------------------------------------

  _render() {
    super._render();
    this._prefix = this.getAttribute('name') || '';
    this._columns = this._parseColumns();

    const alreadyBuilt = this.componentElement.querySelector(':scope > .wc-form-array-table');
    if (!alreadyBuilt) {
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
      this._renderRows(this._parseValue());
      this._updateControlsState();
    }
    this._wireEvents();

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  _buildSkeleton() {
    // CSS grid template: one flexible track per column + a max-content actions track.
    const cols = `repeat(${this._columns.length}, minmax(0, 1fr)) max-content`;
    this.componentElement.style.setProperty('--wc-fa-cols', cols);

    const table = document.createElement('div');
    table.classList.add('wc-form-array-table');

    // Header
    const head = document.createElement('div');
    head.classList.add('wc-form-array-head');
    this._columns.forEach(col => {
      const hcell = document.createElement('div');
      hcell.classList.add('wc-form-array-hcell');
      if (col.colClass) hcell.classList.add(...col.colClass.split(' ').filter(Boolean));
      hcell.textContent = col.label;
      if (col.required) hcell.classList.add('is-required');
      head.appendChild(hcell);
    });
    const actionsHead = document.createElement('div');
    actionsHead.classList.add('wc-form-array-hcell', 'wc-form-array-actions-col');
    head.appendChild(actionsHead);
    table.appendChild(head);

    // Rows container
    const rows = document.createElement('div');
    rows.classList.add('wc-form-array-rows');
    table.appendChild(rows);
    this.rowsEl = rows;

    this.componentElement.appendChild(table);

    // Footer with Add button (hidden in readonly mode)
    const footer = document.createElement('div');
    footer.classList.add('wc-form-array-footer');
    if (!this._isReadonly()) {
      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.classList.add('btn', 'btn-sm', 'wc-form-array-add');
      addBtn.textContent = this.getAttribute('add-label') || 'Add';
      footer.appendChild(addBtn);
    }
    this.componentElement.appendChild(footer);
    this.footerEl = footer;
  }

  _renderRows(rowData) {
    if (!this.rowsEl) return;
    this.rowsEl.innerHTML = '';
    let data = Array.isArray(rowData) ? rowData.slice() : [];
    // Pad up to min-rows with blank rows (create defaults to min-rows blanks).
    const min = this._minRows();
    while (data.length < min) data.push({});
    data.forEach((obj, i) => {
      this.rowsEl.appendChild(this._createRow(i, obj || {}));
    });
    this._renumber();
  }

  _createRow(index, data) {
    const row = document.createElement('div');
    row.classList.add('wc-form-array-row');
    row.dataset.index = index;

    this._columns.forEach(col => {
      const cell = document.createElement('div');
      cell.classList.add('wc-form-array-cell');
      if (col.colClass) cell.classList.add(...col.colClass.split(' ').filter(Boolean));
      const rawVal = data && data[col.field] != null ? data[col.field] : '';
      cell.appendChild(this._createControl(col, index, rawVal));
      row.appendChild(cell);
    });

    // Actions cell
    const actions = document.createElement('div');
    actions.classList.add('wc-form-array-cell', 'wc-form-array-actions');
    if (!this._isReadonly()) {
      const rm = document.createElement('button');
      rm.type = 'button';
      rm.classList.add('btn', 'btn-sm', 'wc-form-array-remove');
      rm.setAttribute('aria-label', 'Remove row');
      rm.innerHTML = '&times;';
      actions.appendChild(rm);
    }
    row.appendChild(actions);
    return row;
  }

  _createControl(col, index, value) {
    const name = `${this._prefix}.${index}.${col.field}`;

    // Readonly: render static text (display only — does not submit).
    if (this._isReadonly()) {
      const span = document.createElement('span');
      span.classList.add('wc-form-array-readonly');
      span.setAttribute('data-col', col.field);
      span.dataset.value = value;
      span.textContent = col.type === 'select' ? this._labelForValue(col, value) : (value === '' ? '—' : String(value));
      return span;
    }

    if (col.type === 'select') {
      const select = document.createElement('select');
      select.classList.add('wc-form-array-control');
      select.name = name;
      select.id = name;
      select.setAttribute('data-col', col.field);
      if (col.required) select.required = true;

      // Blank placeholder so a row can be intentionally unselected.
      const blank = document.createElement('option');
      blank.value = '';
      blank.textContent = col.placeholder || '';
      select.appendChild(blank);

      col.options.forEach(opt => {
        const o = document.createElement('option');
        if (opt != null && typeof opt === 'object') {
          o.value = opt[col.optionValue] != null ? opt[col.optionValue] : '';
          o.textContent = opt[col.optionLabel] != null ? opt[col.optionLabel] : o.value;
        } else {
          o.value = opt;
          o.textContent = opt;
        }
        if (String(o.value) === String(value)) o.selected = true;
        select.appendChild(o);
      });
      // Ensure the current value is selected even if not present in options
      if (value !== '' && !Array.from(select.options).some(o => String(o.value) === String(value))) {
        const o = document.createElement('option');
        o.value = value;
        o.textContent = String(value);
        o.selected = true;
        select.appendChild(o);
      }
      select.value = String(value);
      return select;
    }

    // text | number | date (and any other native input type)
    const input = document.createElement('input');
    input.classList.add('wc-form-array-control');
    input.type = ['number', 'date', 'text', 'email', 'tel', 'time', 'datetime-local'].includes(col.type) ? col.type : 'text';
    input.name = name;
    input.id = name;
    input.setAttribute('data-col', col.field);
    input.value = value;
    if (col.placeholder) input.placeholder = col.placeholder;
    if (col.min != null) input.min = col.min;
    if (col.max != null) input.max = col.max;
    if (col.step != null) input.step = col.step;
    if (col.required) input.required = true;
    return input;
  }

  /**
   * THE critical correctness routine. Renumbers every control so indices are
   * contiguous 0..n-1 after any structural change.
   */
  _renumber() {
    const rows = this.rowsEl.querySelectorAll(':scope > .wc-form-array-row');
    rows.forEach((row, i) => {
      row.dataset.index = i;
      row.querySelectorAll('[data-col]').forEach(ctrl => {
        const field = ctrl.getAttribute('data-col');
        const name = `${this._prefix}.${i}.${field}`;
        if ('name' in ctrl) ctrl.name = name;
        ctrl.id = name;
      });
    });
  }

  // ---- Helpers --------------------------------------------------------------

  _parseColumns() {
    // Read attributes directly off the column elements. This is independent of
    // custom-element upgrade order (the parent upgrades before its children),
    // so it works even before <wc-form-array-column> has its methods.
    const els = this.querySelectorAll(':scope > wc-form-array-column');
    return Array.from(els).map(el => {
      let options = [];
      const optionsAttr = el.getAttribute('options');
      if (optionsAttr) {
        try {
          const parsed = JSON.parse(optionsAttr);
          if (Array.isArray(parsed)) options = parsed;
        } catch (ex) {
          console.warn('[wc-form-array] invalid options JSON for column', el.getAttribute('field'), ex);
        }
      }
      return {
        field: el.getAttribute('field') || '',
        label: el.getAttribute('label') || el.getAttribute('field') || '',
        type: (el.getAttribute('type') || 'text').toLowerCase(),
        options,
        optionValue: el.getAttribute('option-value') || 'value',
        optionLabel: el.getAttribute('option-label') || 'key',
        placeholder: el.getAttribute('placeholder') || '',
        min: el.getAttribute('min'),
        max: el.getAttribute('max'),
        step: el.getAttribute('step'),
        required: el.hasAttribute('required'),
        colClass: el.getAttribute('col-class') || ''
      };
    }).filter(c => c.field);
  }

  _parseValue() {
    const raw = this.getAttribute('value');
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (ex) {
      console.warn('[wc-form-array] invalid value JSON', ex);
      return [];
    }
  }

  _labelForValue(col, value) {
    if (value === '' || value == null) return '—';
    if (col.type === 'select') {
      const match = col.options.find(opt =>
        opt != null && typeof opt === 'object'
          ? String(opt[col.optionValue]) === String(value)
          : String(opt) === String(value)
      );
      if (match) {
        return typeof match === 'object' ? String(match[col.optionLabel]) : String(match);
      }
    }
    return String(value);
  }

  _collectRows() {
    if (!this.rowsEl) return [];
    const rows = this.rowsEl.querySelectorAll(':scope > .wc-form-array-row');
    return Array.from(rows).map(row => {
      const obj = {};
      row.querySelectorAll('[data-col]').forEach(ctrl => {
        const field = ctrl.getAttribute('data-col');
        obj[field] = 'value' in ctrl ? ctrl.value : (ctrl.dataset.value || '');
      });
      return obj;
    });
  }

  _isRowEmpty(row) {
    const ctrls = row.querySelectorAll('[data-col]');
    return Array.from(ctrls).every(ctrl => {
      const v = 'value' in ctrl ? ctrl.value : (ctrl.dataset.value || '');
      return v == null || String(v).trim() === '';
    });
  }

  _rowCount() {
    return this.rowsEl ? this.rowsEl.querySelectorAll(':scope > .wc-form-array-row').length : 0;
  }

  _minRows() {
    const v = parseInt(this.getAttribute('min-rows'), 10);
    return Number.isFinite(v) && v >= 0 ? v : 1;
  }

  _maxRows() {
    const raw = this.getAttribute('max-rows');
    if (raw == null || raw === '') return null;
    const v = parseInt(raw, 10);
    return Number.isFinite(v) && v > 0 ? v : null;
  }

  _isReadonly() {
    return this.hasAttribute('readonly');
  }

  _updateControlsState() {
    if (this._isReadonly()) return;
    const count = this._rowCount();
    const max = this._maxRows();
    const min = this._minRows();

    const addBtn = this.componentElement.querySelector('.wc-form-array-add');
    if (addBtn) addBtn.disabled = (max !== null && count >= max);

    // Disable remove buttons when at the floor so the user can't drop below min.
    const atFloor = count <= min;
    this.componentElement.querySelectorAll('.wc-form-array-remove').forEach(btn => {
      btn.disabled = atFloor;
    });
  }

  _emitChange() {
    this._emitEvent('wcformarraychange', 'wc-form-array:change', {
      bubbles: true,
      composed: true,
      detail: { name: this._prefix, rows: this._collectRows() }
    });
  }

  // ---- Events ---------------------------------------------------------------

  _handleClick(e) {
    const addBtn = e.target.closest('.wc-form-array-add');
    if (addBtn && this.componentElement.contains(addBtn)) {
      e.preventDefault();
      this.addRow();
      return;
    }
    const rmBtn = e.target.closest('.wc-form-array-remove');
    if (rmBtn && this.componentElement.contains(rmBtn)) {
      e.preventDefault();
      const row = rmBtn.closest('.wc-form-array-row');
      this.removeRow(row);
    }
  }

  _handleRowInput(e) {
    if (e.target.closest('.wc-form-array-row')) {
      this._emitChange();
    }
  }

  // Native form submit: temporarily disable controls of fully-blank rows so they
  // are not serialized. Re-enable on the next tick (covers SPA/no-navigation).
  _handleFormSubmitCapture() {
    if (this._isReadonly() || !this.rowsEl) return;
    const disabled = [];
    this.rowsEl.querySelectorAll(':scope > .wc-form-array-row').forEach(row => {
      if (this._isRowEmpty(row)) {
        row.querySelectorAll('[data-col]').forEach(ctrl => {
          if (!ctrl.disabled) { ctrl.disabled = true; disabled.push(ctrl); }
        });
      }
    });
    if (disabled.length) {
      setTimeout(() => disabled.forEach(ctrl => { ctrl.disabled = false; }), 0);
    }
  }

  // htmx submit: prune blank-row keys from the outgoing parameters.
  _handleHtmxConfigRequest(e) {
    if (this._isReadonly() || !this.rowsEl || !e.detail || !e.detail.parameters) return;
    const params = e.detail.parameters;
    this.rowsEl.querySelectorAll(':scope > .wc-form-array-row').forEach(row => {
      if (this._isRowEmpty(row)) {
        const idx = row.dataset.index;
        this._columns.forEach(col => {
          const key = `${this._prefix}.${idx}.${col.field}`;
          if (typeof params.delete === 'function') {
            params.delete(key); // FormData-like
          } else {
            delete params[key]; // plain object
          }
        });
      }
    });
  }

  _wireEvents() {
    super._wireEvents();
    // Click + input delegation on the component (idempotent: remove then add).
    this.componentElement.removeEventListener('click', this._onClick);
    this.componentElement.addEventListener('click', this._onClick);
    this.componentElement.removeEventListener('input', this._onInput);
    this.componentElement.addEventListener('input', this._onInput);
    this.componentElement.removeEventListener('change', this._onInput);
    this.componentElement.addEventListener('change', this._onInput);

    // Submit guards on the enclosing form (re-resolve each time — the form
    // ancestor can change when wc-form reparents us into its <form>).
    this._unwireFormGuard();
    const form = this.closest('form');
    if (form) {
      this._guardForm = form;
      form.addEventListener('submit', this._onSubmitCapture, true);
      form.addEventListener('htmx:configRequest', this._onHtmxConfig);
    }
  }

  _unwireFormGuard() {
    if (this._guardForm) {
      this._guardForm.removeEventListener('submit', this._onSubmitCapture, true);
      this._guardForm.removeEventListener('htmx:configRequest', this._onHtmxConfig);
      this._guardForm = null;
    }
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.componentElement) {
      this.componentElement.removeEventListener('click', this._onClick);
      this.componentElement.removeEventListener('input', this._onInput);
      this.componentElement.removeEventListener('change', this._onInput);
    }
    this._unwireFormGuard();
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'name') {
      this._prefix = newValue || '';
      if (this.rowsEl) this._renumber();
    } else if (attrName === 'value') {
      this._columns = this._parseColumns();
      this._renderRows(this._parseValue());
      this._updateControlsState();
    } else if (attrName === 'min-rows' || attrName === 'max-rows') {
      // Pad up to the new minimum if needed, then refresh button state.
      const min = this._minRows();
      while (this._rowCount() < min) {
        this.rowsEl.appendChild(this._createRow(this._rowCount(), {}));
      }
      this._renumber();
      this._updateControlsState();
    } else if (attrName === 'add-label') {
      const addBtn = this.componentElement.querySelector('.wc-form-array-add');
      if (addBtn) addBtn.textContent = newValue || 'Add';
    } else if (attrName === 'readonly') {
      // Re-render in the new mode, preserving current values.
      const current = this._collectRows();
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
      this._renderRows(current);
      this._updateControlsState();
      this._wireEvents();
    } else if (attrName === 'class') {
      super._handleAttributeChange(attrName, newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _applyStyle() {
    const style = `
      wc-form-array {
        display: contents;
      }

      @layer wc.usage {
        .wc-form-array {
          display: block;
          width: 100%;
        }
        .wc-form-array-table {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          border: 1px solid var(--card-border-color, var(--surface-4));
          border-radius: 0.375rem;
          background-color: var(--card-bg-color, var(--surface-2));
          padding: 0.5rem;
        }
        .wc-form-array-head,
        .wc-form-array-row {
          display: grid;
          grid-template-columns: var(--wc-fa-cols, 1fr max-content);
          gap: 0.5rem;
          align-items: center;
        }
        .wc-form-array-head {
          padding: 0 0.25rem 0.375rem 0.25rem;
          border-bottom: 1px solid var(--surface-4);
        }
        .wc-form-array-hcell {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-2, var(--component-alt-color));
        }
        .wc-form-array-hcell.is-required::after {
          content: ' *';
          color: var(--danger-color, #ef4444);
        }
        .wc-form-array-rows {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .wc-form-array-row {
          padding: 0.125rem 0.25rem;
        }
        .wc-form-array-cell {
          min-width: 0;
        }
        .wc-form-array-control {
          width: 100%;
          padding: 0.375rem 0.5rem;
          background-color: var(--surface-3);
          border: 1px solid var(--surface-4);
          border-radius: 0.25rem;
          color: var(--text-1);
        }
        .wc-form-array-control:focus-visible {
          outline: var(--primary-bg-color) solid 2px;
          outline-offset: 0px;
        }
        .wc-form-array-control:user-invalid {
          outline: solid 2px var(--invalid-color, var(--danger-color, #ef4444));
          outline-offset: 0px;
        }
        .wc-form-array-readonly {
          display: inline-block;
          width: 100%;
          padding: 0.375rem 0.25rem;
          color: var(--text-1);
        }
        .wc-form-array-actions-col,
        .wc-form-array-actions {
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 2rem;
        }
        .wc-form-array-remove {
          line-height: 1;
          padding: 0.25rem 0.5rem;
          font-size: 1rem;
        }
        .wc-form-array-footer {
          margin-top: 0.5rem;
        }
        .wc-form-array-footer:empty {
          display: none;
        }
      }
    `.trim();
    this.loadStyle('wc-form-array-style', style);
  }
}

customElements.define(WcFormArray.is, WcFormArray);
export { WcFormArray };
