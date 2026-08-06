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
 *    layout                 — "table" (default) | "card". Card mode renders each item as a bordered
 *                             card with the columns in a responsive label-above grid (readable for
 *                             many-field sub-forms); table mode is the original one-row-per-item.
 *    item-title             — card-header title template; tokens {index} (0-based), {index1}
 *                             (1-based), and {field} (a column value), e.g. "Guardian {index1}"
 *
 *  Programmatic row API (so a wc-record-lookup can drive it):
 *    addRow(data)           — append a row pre-filled from { field: value } (reindexes as usual)
 *    setRow(index, data)    — fill/replace the row at index (partial data merges onto current)
 *    removeRow(rowOrIndex)  — remove a row (honors min-rows)
 *    Declarative: dispatch a `wc-form-array:populate` (or `wcformarraypopulate`) CustomEvent on the
 *    element with detail { rows: [ {field:value}, … ] } to append those rows.
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

  // Address sub-fields carried alongside the visible street (wc-address).
  static get ADDRESS_SUBFIELDS() {
    return ['formatted_address', 'city', 'state', 'postal_code', 'county', 'country', 'lat', 'lng'];
  }
  static get ADDRESS_LABELS() {
    return { street: 'Street', city: 'City', state: 'State', postal_code: 'Zip', county: 'County',
             country: 'Country', formatted_address: 'Address', lat: 'Lat', lng: 'Lng' };
  }

  // Resolve `show-fields`: null/absent → none visible; boolean ('') → City/State/Zip; else the list.
  _addressVisibleFields(showFields) {
    if (showFields == null) return [];
    const raw = String(showFields).trim();
    if (raw === '') return ['city', 'state', 'postal_code'];
    return raw.split(',').map(s => s.trim()).filter(s => WcFormArray.ADDRESS_SUBFIELDS.indexOf(s) !== -1);
  }

  static get observedAttributes() {
    return ['id', 'class', 'name', 'value', 'min-rows', 'max-rows', 'add-label', 'readonly',
            'layout', 'item-title'];
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
    this._onPopulate = this._handlePopulate.bind(this);
    this._onAddressChange = this._handleAddressChange.bind(this);
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

  get _layout() {
    return (this.getAttribute('layout') || 'table').toLowerCase() === 'card' ? 'card' : 'table';
  }

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

  /** Fill/replace the row at `index` from { field: value } (partial data merges onto current). */
  setRow(index, data = {}) {
    if (this._isReadonly() || !this.rowsEl) return null;
    const existing = this.rowsEl.querySelectorAll(':scope > .wc-form-array-row')[index];
    if (!existing) return null;
    const merged = { ...this._rowToObject(existing), ...(data || {}) };
    const fresh = this._createRow(index, merged);
    existing.replaceWith(fresh);
    this._renumber();
    this._updateControlsState();
    this._emitChange();
    return fresh;
  }

  /** Declarative populate: dispatch `wc-form-array:populate` {rows:[…]} to append those rows. */
  _handlePopulate(e) {
    if (this._isReadonly()) return;
    const rows = e && e.detail && Array.isArray(e.detail.rows) ? e.detail.rows : [];
    rows.forEach(r => this.addRow(r || {}));
  }

  // A per-row wc-address emitted a geocoded selection — fill the row's hidden address
  // sub-fields (city/state/postal_code/… ; street is the visible wc-address itself).
  _handleAddressChange(e) {
    const addrEl = e.target && e.target.closest ? e.target.closest('wc-address') : null;
    if (!addrEl) return;
    const wrap = addrEl.closest('.wc-fa-address');
    if (!wrap || !this.componentElement.contains(wrap)) return;
    const d = e.detail || {};
    // Fill BOTH hidden and visible (editable) sub-field inputs — the wc-address (street) sets
    // its own value, so it's excluded (data-col is on the host, not on any <input> here).
    wrap.querySelectorAll('input[data-col]').forEach(h => {
      const sub = h.getAttribute('data-col').split('.').pop();
      if (d[sub] != null) h.value = d[sub];
    });
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
    const card = this._layout === 'card';

    const table = document.createElement('div');
    table.classList.add('wc-form-array-table');
    if (card) table.classList.add('wc-fa-layout-card');

    // Table mode: a shared column-label header + a CSS grid template. Card mode labels each
    // field inside its own card, so it needs neither.
    if (!card) {
      const cols = `repeat(${this._columns.length}, minmax(0, 1fr)) max-content`;
      this.componentElement.style.setProperty('--wc-fa-cols', cols);

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
    }

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

  // Rebuild the skeleton in the current mode, preserving current row values.
  _rebuild() {
    const current = this._collectRows();
    this.componentElement.innerHTML = '';
    this._buildSkeleton();
    this._renderRows(current);
    this._updateControlsState();
    this._wireEvents();
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
    if (this._layout === 'card') {
      row.classList.add('wc-fa-card');
      this._buildCardRow(row, index, data || {});
    } else {
      this._buildTableRow(row, index, data || {});
    }
    return row;
  }

  _buildTableRow(row, index, data) {
    this._columns.forEach(col => {
      const cell = document.createElement('div');
      cell.classList.add('wc-form-array-cell');
      if (col.fullWidth) cell.classList.add('is-full');
      if (col.colClass) cell.classList.add(...col.colClass.split(' ').filter(Boolean));
      const rawVal = data && data[col.field] != null ? data[col.field] : '';
      cell.appendChild(this._safeCreateControl(col, index, rawVal));
      row.appendChild(cell);
    });

    // Actions cell
    const actions = document.createElement('div');
    actions.classList.add('wc-form-array-cell', 'wc-form-array-actions');
    if (!this._isReadonly()) actions.appendChild(this._makeRemoveButton());
    row.appendChild(actions);
  }

  _buildCardRow(row, index, data) {
    // Header: title + remove button.
    const header = document.createElement('div');
    header.classList.add('wc-fa-card-header');
    const title = document.createElement('span');
    title.classList.add('wc-fa-card-title');
    header.appendChild(title);
    if (!this._isReadonly()) header.appendChild(this._makeRemoveButton());
    row.appendChild(header);

    // Responsive field grid (label above each control).
    const grid = document.createElement('div');
    grid.classList.add('wc-fa-card-grid');
    this._columns.forEach(col => {
      const field = document.createElement('div');
      field.classList.add('wc-fa-field');
      if (col.fullWidth) field.classList.add('is-full');
      if (col.colClass) field.classList.add(...col.colClass.split(' ').filter(Boolean));
      if (col.required) field.classList.add('is-required');
      const ctrlId = col.type === 'address'
        ? `${this._prefix}.${index}.${col.field}.street`
        : `${this._prefix}.${index}.${col.field}`;
      const label = document.createElement('label');
      label.setAttribute('for', ctrlId);
      label.textContent = col.label;
      field.appendChild(label);
      const rawVal = data && data[col.field] != null ? data[col.field] : '';
      field.appendChild(this._safeCreateControl(col, index, rawVal));
      grid.appendChild(field);
    });
    row.appendChild(grid);

    // Title is derived from index (+ optional field tokens) — set after controls exist.
    this._updateCardTitle(row, index);
  }

  _makeRemoveButton() {
    const rm = document.createElement('button');
    rm.type = 'button';
    rm.classList.add('btn', 'btn-sm', 'wc-form-array-remove');
    rm.setAttribute('aria-label', 'Remove row');
    rm.innerHTML = '&times;';
    return rm;
  }

  // Resolve `item-title` for a card: {index} (0-based), {index1} (1-based), {field} (column value).
  _formatItemTitle(index, row) {
    const tpl = this.getAttribute('item-title') || '';
    if (!tpl) return '';
    return tpl.replace(/\{([^}]+)\}/g, (m, key) => {
      const k = key.trim();
      if (k === 'index') return String(index);
      if (k === 'index1') return String(index + 1);
      if (row) {
        const ctrl = row.querySelector(`[data-col="${k}"]`);
        if (ctrl) return 'value' in ctrl ? String(ctrl.value) : String(ctrl.dataset.value || '');
      }
      return '';
    });
  }

  _updateCardTitle(row, index) {
    if (this._layout !== 'card') return;
    const titleEl = row.querySelector(':scope > .wc-fa-card-header > .wc-fa-card-title');
    if (titleEl) titleEl.textContent = this._formatItemTitle(index, row);
  }

  // Never let one column's control creation throw out of the row loop (which would abort
  // _renderRows and blank the whole array). On failure, fall back to a plain named input so the
  // row still renders + submits, and log the cause.
  _safeCreateControl(col, index, value) {
    try {
      return this._createControl(col, index, value);
    } catch (e) {
      console.error(`[wc-form-array] failed to create control for column "${col.field}"`, e);
      if (this._isReadonly()) {
        const span = document.createElement('span');
        span.classList.add('wc-form-array-readonly');
        span.setAttribute('data-col', col.field);
        span.dataset.value = value != null && typeof value !== 'object' ? String(value) : '';
        span.textContent = span.dataset.value || '—';
        return span;
      }
      const input = document.createElement('input');
      input.type = 'text';
      input.classList.add('wc-form-array-control');
      input.setAttribute('data-col', col.field);
      input.name = `${this._prefix}.${index}.${col.field}`;
      input.id = input.name;
      input.value = value != null && typeof value !== 'object' ? value : '';
      return input;
    }
  }

  _createControl(col, index, value) {
    const name = `${this._prefix}.${index}.${col.field}`;

    // Readonly: render static text (display only — does not submit).
    if (this._isReadonly()) {
      const span = document.createElement('span');
      span.classList.add('wc-form-array-readonly');
      if (col.type === 'textarea') span.classList.add('wc-form-array-readonly-multiline');
      span.setAttribute('data-col', col.field);
      let text;
      if (col.type === 'address') {
        const a = (value && typeof value === 'object') ? value : {};
        text = a.formatted_address || [a.street, a.city, a.state, a.postal_code].filter(Boolean).join(', ') || '—';
        span.dataset.value = ''; // readonly never submits
      } else if (col.type === 'select') {
        text = this._labelForValue(col, value);
        span.dataset.value = value;
      } else {
        text = (value === '' ? '—' : String(value));
        span.dataset.value = value;
      }
      span.textContent = text;
      return span;
    }

    // Multi-line text
    if (col.type === 'textarea') {
      const ta = document.createElement('textarea');
      ta.classList.add('wc-form-array-control', 'wc-form-array-textarea');
      ta.name = name;
      ta.id = name;
      ta.setAttribute('data-col', col.field);
      const rows = parseInt(col.rows, 10);
      ta.rows = Number.isFinite(rows) && rows > 0 ? rows : 2;
      if (col.placeholder) ta.placeholder = col.placeholder;
      if (col.required) ta.required = true;
      ta.value = value;
      return ta;
    }

    // Address: a per-row <wc-address> (geocoded autocomplete) whose SELECTION fills the row's
    // address SUB-FIELDS under dotted-index names `${name}.${index}.${field}.{street,city,state,
    // postal_code,county,country,lat,lng,formatted_address}`. The visible wc-address is the
    // `street` sub-field; the rest are hidden inputs populated on `wcaddresschange`. Each control
    // carries a dotted `data-col` (`${field}.${sub}`), so _renumber/_collectRows/_isRowEmpty all
    // keep working unchanged (reindex-safe, contiguous). Built via the parser (wc-address appends
    // its wrapper in the constructor, which document.createElement disallows).
    if (col.type === 'address') {
      const a = (value && typeof value === 'object') ? value : {};
      const wrap = document.createElement('div');
      wrap.classList.add('wc-fa-address');

      const streetName = `${this._prefix}.${index}.${col.field}.street`;
      const attrs = [
        `data-col="${this._escAttr(col.field + '.street')}"`,
        `name="${this._escAttr(streetName)}"`,
        `id="${this._escAttr(streetName)}"`
      ];
      if (col.geocodeUrl) attrs.push(`geocode-url="${this._escAttr(col.geocodeUrl)}"`);
      if (col.countries) attrs.push(`countries="${this._escAttr(col.countries)}"`);
      if (col.placeholder) attrs.push(`placeholder="${this._escAttr(col.placeholder)}"`);
      if (col.required) attrs.push('required');
      if (a.street != null && a.street !== '') attrs.push(`value="${this._escAttr(String(a.street))}"`);
      const tmp = document.createElement('div');
      tmp.innerHTML = `<wc-address ${attrs.join(' ')}></wc-address>`;
      wrap.appendChild(tmp.firstElementChild);

      // Which parts are shown as VISIBLE editable inputs (else hidden). Auto-filled on geocode
      // select via _handleAddressChange, but the user can see + correct them.
      const visible = this._addressVisibleFields(col.showFields);
      let grid = null;
      if (visible.length) {
        grid = document.createElement('div');
        grid.classList.add('wc-fa-address-fields');
        visible.forEach(sub => {
          const sf = document.createElement('div');
          sf.classList.add('wc-fa-subfield');
          const subName = `${this._prefix}.${index}.${col.field}.${sub}`;
          const lbl = document.createElement('label');
          lbl.setAttribute('for', subName);
          lbl.textContent = WcFormArray.ADDRESS_LABELS[sub] || sub;
          const inp = document.createElement('input');
          inp.type = 'text';
          inp.classList.add('wc-form-array-control');
          inp.setAttribute('data-col', `${col.field}.${sub}`);
          inp.name = subName;
          inp.id = subName;
          inp.placeholder = WcFormArray.ADDRESS_LABELS[sub] || sub;
          inp.value = a[sub] != null ? a[sub] : '';
          sf.appendChild(lbl);
          sf.appendChild(inp);
          grid.appendChild(sf);
        });
        wrap.appendChild(grid);
      }

      // Remaining sub-fields stay hidden (still submit + auto-fill on geocode).
      WcFormArray.ADDRESS_SUBFIELDS.forEach(sub => {
        if (visible.indexOf(sub) !== -1) return;
        const h = document.createElement('input');
        h.type = 'hidden';
        h.setAttribute('data-col', `${col.field}.${sub}`);
        h.name = `${this._prefix}.${index}.${col.field}.${sub}`;
        h.value = a[sub] != null ? a[sub] : '';
        wrap.appendChild(h);
      });
      return wrap;
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

    // Mask via WcMaskHub — `type="tel"` implies the phone mask (matches wc-input type=tel);
    // `mask="ssn|zip|zipPlus4|date|currency|phone"` selects a named mask. Value is set above so
    // the mask picks up the pre-filled value.
    const maskType = col.mask || (col.type === 'tel' ? 'phone' : '');
    if (maskType) this._applyMask(input, maskType);

    return input;
  }

  _escAttr(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Apply a WcMaskHub mask, deferring until the hub is FULLY ready. On a full page load the
  // MaskHub sets `window.wc.MaskHub = this` BEFORE it finishes loading IMask + building its
  // `maskConfigs`, so a naive "hub exists?" check applies too early → applyMask reads
  // `this.maskConfigs[type]` on `undefined` and throws (which used to abort _renderRows and
  // blank the whole array). So require `maskConfigs`, else defer to the same `wcready`-from-
  // document signal wc-input type="tel" uses. Never throws.
  _applyMask(input, maskType) {
    const apply = () => {
      const hub = window.wc && window.wc.MaskHub;
      if (!hub || !hub.maskConfigs || typeof hub.applyMaskToElement !== 'function') return false;
      try { hub.applyMaskToElement(input, maskType); } catch (e) { console.warn('[wc-form-array] mask apply failed', e); }
      return true;
    };
    if (!apply()) document.addEventListener('wcready', () => apply(), { once: true });
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
        if (ctrl.tagName && ctrl.tagName.indexOf('-') !== -1) {
          // Custom-element control (e.g. wc-address): set the attribute and rename only the inner
          // FORM CONTROL (input/select/textarea) so the dotted-index name that actually submits
          // stays contiguous — NOT decorative named children like <wc-fa-icon name="house">.
          ctrl.setAttribute('name', name);
          ctrl.setAttribute('id', name);
          ctrl.querySelectorAll('input[name], select[name], textarea[name]')
            .forEach(inner => inner.setAttribute('name', name));
        } else {
          if ('name' in ctrl) ctrl.name = name;
          ctrl.id = name;
        }
      });
      // Keep visible address sub-field <label for> pointing at the renumbered input id.
      row.querySelectorAll('.wc-fa-subfield').forEach(sf => {
        const inp = sf.querySelector('input[data-col]');
        const lbl = sf.querySelector('label[for]');
        if (inp && lbl) lbl.setAttribute('for', inp.id);
      });
      if (this._layout === 'card') {
        // Keep <label for> in sync with the renumbered control ids, and refresh the title.
        row.querySelectorAll(':scope > .wc-fa-card-grid > .wc-fa-field > label[for]').forEach((lbl, ci) => {
          const col = this._columns[ci];
          if (col) lbl.setAttribute('for', col.type === 'address'
            ? `${this._prefix}.${i}.${col.field}.street`
            : `${this._prefix}.${i}.${col.field}`);
        });
        this._updateCardTitle(row, i);
      }
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
        rows: el.getAttribute('rows'),
        fullWidth: el.hasAttribute('full-width'),
        mask: el.getAttribute('mask') || '',
        geocodeUrl: el.getAttribute('geocode-url') || '',
        countries: el.getAttribute('countries') || '',
        showFields: el.getAttribute('show-fields'),
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
    return Array.from(rows).map(row => this._rowToObject(row));
  }

  _rowToObject(row) {
    const obj = {};
    row.querySelectorAll('[data-col]').forEach(ctrl => {
      const key = ctrl.getAttribute('data-col');
      const val = 'value' in ctrl ? ctrl.value : (ctrl.dataset.value || '');
      // Dotted data-col (e.g. "home.street") nests → { home: { street: ... } }.
      if (key.indexOf('.') !== -1) {
        const parts = key.split('.');
        let o = obj;
        for (let k = 0; k < parts.length - 1; k++) {
          if (o[parts[k]] == null || typeof o[parts[k]] !== 'object') o[parts[k]] = {};
          o = o[parts[k]];
        }
        o[parts[parts.length - 1]] = val;
      } else {
        obj[key] = val;
      }
    });
    return obj;
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
    const row = e.target.closest('.wc-form-array-row');
    if (row) {
      // Card titles may reference a {field} value — keep the header live.
      if (this._layout === 'card') this._updateCardTitle(row, parseInt(row.dataset.index, 10) || 0);
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

    // Declarative populate hook (append rows from a record lookup). Canonical + legacy names.
    this.removeEventListener('wcformarraypopulate', this._onPopulate);
    this.addEventListener('wcformarraypopulate', this._onPopulate);
    this.removeEventListener('wc-form-array:populate', this._onPopulate);
    this.addEventListener('wc-form-array:populate', this._onPopulate);

    // Per-row wc-address selections → fill hidden address sub-fields.
    this.componentElement.removeEventListener('wcaddresschange', this._onAddressChange);
    this.componentElement.addEventListener('wcaddresschange', this._onAddressChange);

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
    this.removeEventListener('wcformarraypopulate', this._onPopulate);
    this.removeEventListener('wc-form-array:populate', this._onPopulate);
    if (this.componentElement) this.componentElement.removeEventListener('wcaddresschange', this._onAddressChange);
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
    } else if (attrName === 'readonly' || attrName === 'layout') {
      // Re-render in the new mode, preserving current values.
      this._rebuild();
    } else if (attrName === 'item-title') {
      if (this._layout === 'card' && this.rowsEl) {
        this.rowsEl.querySelectorAll(':scope > .wc-form-array-row')
          .forEach((row, i) => this._updateCardTitle(row, i));
      }
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

        /* ---- Card layout (layout="card") ---- */
        .wc-form-array-table.wc-fa-layout-card {
          border: none;
          background: transparent;
          padding: 0;
          gap: 0.75rem;
        }
        .wc-fa-layout-card .wc-form-array-rows {
          gap: 0.75rem;
        }
        .wc-fa-layout-card .wc-form-array-row.wc-fa-card {
          display: block;                 /* override the table-mode grid row */
          padding: 0.75rem 0.875rem;
          border: 1px solid var(--card-border-color, var(--surface-4));
          border-radius: 0.5rem;
          background-color: var(--card-bg-color, var(--surface-1));
        }
        .wc-fa-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          margin-bottom: 0.625rem;
        }
        .wc-fa-card-title {
          font-weight: 600;
          font-size: 0.95rem;
          color: var(--text-1);
        }
        .wc-fa-card-title:empty {
          display: none;
        }
        .wc-fa-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
          gap: 0.625rem 0.75rem;
        }
        .wc-fa-field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          min-width: 0;
        }
        .wc-fa-field > label {
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-2, var(--component-alt-color));
        }
        .wc-fa-field.is-required > label::after {
          content: ' *';
          color: var(--danger-color, #ef4444);
        }
        /* full-width column → spans the whole card on its own row */
        .wc-fa-field.is-full {
          grid-column: 1 / -1;
        }

        /* Multi-line + address controls (both layouts) */
        .wc-form-array-textarea {
          min-height: 4.5rem;
          resize: vertical;
          font: inherit;
          line-height: 1.4;
        }
        .wc-form-array-readonly-multiline {
          white-space: pre-wrap;
        }
        .wc-fa-address { display: block; width: 100%; }
        .wc-form-array-cell wc-address,
        .wc-fa-field wc-address {
          display: block;
          width: 100%;
        }
        /* Visible address parts (show-fields): City / State / Zip beneath the street. */
        .wc-fa-address-fields {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
          gap: 0.375rem 0.5rem;
          margin-top: 0.375rem;
        }
        .wc-fa-subfield { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
        .wc-fa-subfield > label {
          font-size: 0.7rem; font-weight: 500;
          color: var(--text-2, var(--component-alt-color));
        }
      }
    `.trim();
    this.loadStyle('wc-form-array-style', style);
  }
}

customElements.define(WcFormArray.is, WcFormArray);
export { WcFormArray };
