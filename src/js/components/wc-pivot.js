/**
 * Name: wc-pivot
 * Usage:
 *
 *   <wc-pivot
 *     data='[{"state":"OR","status":"active","amount":100}]'
 *     auto-detect
 *     show-heatmap>
 *   </wc-pivot>
 *
 *   <wc-pivot
 *     data='[...]'
 *     row-field="salesperson"
 *     col-field="quarter"
 *     value-field="revenue"
 *     aggregate="sum"
 *     number-format="currency"
 *     show-totals
 *     show-heatmap
 *     sort-rows="value-desc"
 *     show-field-panel>
 *   </wc-pivot>
 *
 * Renders cross-tabulation pivot tables from arbitrary JSON data with
 * auto-detection, four-zone field panel, value filters, heatmap, sorting,
 * and CSV export.
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-pivot')) {

  const AGGREGATES = ['count', 'sum', 'avg', 'min', 'max'];
  const COL_PRIORITY = ['status', 'type', 'category', 'is_active', 'active'];

  class WcPivot extends WcBaseComponent {
    static get is() { return 'wc-pivot'; }

    static get observedAttributes() {
      return ['id', 'class', 'data', 'auto-detect', 'row-field', 'col-field',
              'value-field', 'aggregate', 'show-controls', 'show-totals',
              'show-heatmap', 'number-format', 'sort-rows', 'max-columns',
              'height', 'show-field-panel', 'show-subtotals', 'compact-layout',
              'config'];
    }

    constructor() {
      super();
      this._data = [];
      this._fieldInfo = { rows: [], cols: [], values: [], _rowMeta: [], _colMeta: [], _allFields: [] };
      this._sortCol = null;
      this._sortDir = 'asc';
      this._pivotResult = null;
      this._panelOpen = false;
      this._valueFilters = {};
      this._zones = {
        rows: [],
        columns: [],
        values: [],    // [{ field, aggregate }]
        filters: [],
      };
      this._activePopover = null;
      this._activeFilterDropdown = null;
      this._outsideClickHandler = null;
      this._drillDown = null; // { row, col } or null
      this._compactLayout = false;
      this._dateGrouping = {}; // { fieldPath: 'year'|'month'|'quarter'|'year-month' }

      const compEl = this.querySelector('.wc-pivot');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-pivot');
        this.appendChild(this.componentElement);
      }
      this._deferReady = true;
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      if (this.hasAttribute('show-field-panel')) this._panelOpen = true;
      if (this.hasAttribute('compact-layout')) this._compactLayout = true;
      if (this.hasAttribute('config')) {
        try { this.loadConfig(JSON.parse(this.getAttribute('config'))); } catch (e) { /* ignore */ }
      }
      this._parseData();
      this._buildUI();
      this._outsideClickHandler = (e) => this._handleOutsideClick(e);
      document.addEventListener('click', this._outsideClickHandler, true);
      this._setReady();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._outsideClickHandler) {
        document.removeEventListener('click', this._outsideClickHandler, true);
        this._outsideClickHandler = null;
      }
    }

    async _handleAttributeChange(attrName, newValue) {
      if (attrName === 'data') {
        this._parseData();
        this._buildUI();
      } else if (attrName === 'show-field-panel') {
        this._panelOpen = newValue !== null;
        this._buildUI();
      } else if (attrName === 'compact-layout') {
        this._compactLayout = newValue !== null;
        this._buildUI();
      } else if (attrName === 'config') {
        if (newValue) {
          try { this.loadConfig(JSON.parse(newValue)); } catch (e) { /* ignore */ }
        }
      } else if (['row-field', 'col-field', 'value-field', 'aggregate',
                   'show-heatmap', 'number-format', 'sort-rows',
                   'show-totals', 'show-subtotals'].includes(attrName)) {
        this._syncFromAttributes();
        this._syncZonesFromFields();
        this._buildUI();
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _render() {
      super._render();
      // UI built in connectedCallback, not here
    }

    // ── Derived properties from zones ─────────────────────────────────────────

    get _rowField() { return this._zones.rows[0] || ''; }
    set _rowField(v) { this._zones.rows = v ? [v] : []; }

    get _colField() { return this._zones.columns[0] || ''; }
    set _colField(v) { this._zones.columns = v ? [v] : []; }

    get _valueField() {
      return this._zones.values[0]?.field || '';
    }
    set _valueField(v) {
      if (this._zones.values.length > 0) {
        this._zones.values[0].field = v;
      } else if (v) {
        this._zones.values.push({ field: v, aggregate: 'sum' });
      }
    }

    get _aggregate() {
      return this._zones.values[0]?.aggregate || 'count';
    }
    set _aggregate(v) {
      if (this._zones.values.length > 0) {
        this._zones.values[0].aggregate = v;
      } else if (v !== 'count') {
        // Can't set aggregate without a value field
      }
    }

    // ── Data parsing ──────────────────────────────────────────────────────────

    _parseData() {
      const raw = this.getAttribute('data');
      if (!raw) { this._data = []; return; }
      try {
        const parsed = JSON.parse(raw);
        this._data = Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        this._data = [];
      }
      this._analyzeFields();
      if (this.hasAttribute('auto-detect') || (!this.getAttribute('row-field') && !this.getAttribute('col-field'))) {
        this._autoDetect();
      }
      this._syncFromAttributes();
      this._syncZonesFromFields();
    }

    _analyzeFields() {
      const stringFields = new Map();
      const boolFields = [];
      const numFields = [];
      const dateFields = [];
      const sampleSize = Math.min(this._data.length, 200);

      for (let i = 0; i < sampleSize; i++) {
        this._collectFields(this._data[i], '', stringFields, boolFields, numFields, dateFields);
      }

      const rows = [];
      const cols = [];
      for (const [path, uniques] of stringFields) {
        if (uniques.size < 50) {
          rows.push({ path, cardinality: uniques.size });
          cols.push({ path, cardinality: uniques.size });
        }
      }
      boolFields.forEach(path => {
        if (!cols.find(c => c.path === path)) cols.push({ path, cardinality: 2 });
        if (!rows.find(r => r.path === path)) rows.push({ path, cardinality: 2 });
      });
      // Date fields can be row/col candidates (they get grouped)
      dateFields.forEach(path => {
        if (!rows.find(r => r.path === path)) rows.push({ path, cardinality: 12 }); // estimate
        if (!cols.find(c => c.path === path)) cols.push({ path, cardinality: 12 });
      });

      // Build unified field list with type info
      const allFields = [];
      const seen = new Set();
      const addField = (path, type) => {
        if (!seen.has(path)) { seen.add(path); allFields.push({ path, type }); }
      };
      for (const [path] of stringFields) addField(path, 'string');
      boolFields.forEach(p => addField(p, 'boolean'));
      numFields.forEach(p => addField(p, 'number'));
      dateFields.forEach(p => addField(p, 'date'));
      allFields.sort((a, b) => a.path.localeCompare(b.path));

      this._fieldInfo = {
        rows: rows.map(r => r.path),
        cols: cols.map(c => c.path),
        values: [...new Set(numFields)],
        dates: dateFields,
        _rowMeta: rows,
        _colMeta: cols,
        _allFields: allFields,
      };
    }

    _collectFields(obj, prefix, stringFields, boolFields, numFields, dateFields) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
      for (const key of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];
        if (val === null || val === undefined) continue;
        if (typeof val === 'number') {
          if (!numFields.includes(path)) numFields.push(path);
        } else if (typeof val === 'boolean') {
          if (!boolFields.includes(path)) boolFields.push(path);
          if (!stringFields.has(path)) stringFields.set(path, new Set());
          stringFields.get(path).add(String(val));
        } else if (typeof val === 'string') {
          if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
            if (!dateFields.includes(path)) dateFields.push(path);
          } else {
            if (!stringFields.has(path)) stringFields.set(path, new Set());
            stringFields.get(path).add(val);
          }
        } else if (typeof val === 'object' && !Array.isArray(val)) {
          if (val.$date) {
            if (!dateFields.includes(path)) dateFields.push(path);
          } else if (val.$oid) {
            // Skip ObjectIDs
          } else {
            this._collectFields(val, path, stringFields, boolFields, numFields, dateFields);
          }
        }
      }
    }

    _autoDetect() {
      const { _rowMeta, _colMeta, values } = this._fieldInfo;

      if (!this.getAttribute('row-field')) {
        const candidate = _rowMeta
          .filter(r => r.cardinality >= 2 && r.cardinality <= 30)
          .sort((a, b) => b.cardinality - a.cardinality)[0];
        this._rowField = candidate ? candidate.path : (_rowMeta[0]?.path || '');
      }

      // Auto-set date grouping for row field
      if (this._rowField && this._fieldInfo.dates?.includes(this._rowField) && !this._dateGrouping[this._rowField]) {
        this._dateGrouping[this._rowField] = 'month';
      }

      if (!this.getAttribute('col-field')) {
        const available = _colMeta.filter(c => c.path !== this._rowField && c.cardinality >= 2 && c.cardinality <= 10);
        let pick = null;
        for (const name of COL_PRIORITY) {
          pick = available.find(c => {
            const last = c.path.includes('.') ? c.path.split('.').pop() : c.path;
            return last.toLowerCase() === name;
          });
          if (pick) break;
        }
        if (!pick) pick = available[0];
        this._colField = pick ? pick.path : '';
      }

      // Auto-set date grouping for col field
      if (this._colField && this._fieldInfo.dates?.includes(this._colField) && !this._dateGrouping[this._colField]) {
        this._dateGrouping[this._colField] = 'month';
      }

      if (!this.getAttribute('value-field') && !this.getAttribute('aggregate')) {
        if (values.length > 0) {
          this._zones.values = [{ field: values[0], aggregate: 'sum' }];
        } else {
          this._zones.values = [];
        }
      }
    }

    _syncFromAttributes() {
      const r = this.getAttribute('row-field');
      if (r) {
        this._rowField = r;
        if (this._fieldInfo.dates?.includes(r) && !this._dateGrouping[r]) {
          this._dateGrouping[r] = 'month';
        }
      }
      const c = this.getAttribute('col-field');
      if (c) {
        this._colField = c;
        if (this._fieldInfo.dates?.includes(c) && !this._dateGrouping[c]) {
          this._dateGrouping[c] = 'month';
        }
      }
      const v = this.getAttribute('value-field');
      const a = this.getAttribute('aggregate');
      if (v) {
        this._zones.values = [{ field: v, aggregate: a || 'sum' }];
      } else if (a === 'count') {
        this._zones.values = [];
      }
    }

    _syncZonesFromFields() {
      // Ensure zones reflect current field selections (for backward compat)
      // Only seed if zones are empty (first parse)
    }

    // ── Filtering ─────────────────────────────────────────────────────────────

    _getFilteredData() {
      const filters = this._valueFilters;
      const filterFields = Object.keys(filters);
      if (filterFields.length === 0) return this._data;

      return this._data.filter(doc => {
        for (const field of filterFields) {
          const excluded = filters[field];
          if (!excluded || excluded.size === 0) continue;
          const val = this._valToString(this._getNestedValue(doc, field));
          if (excluded.has(val)) return false;
        }
        return true;
      });
    }

    // ── Zone management ───────────────────────────────────────────────────────

    _getFieldZone(field) {
      if (this._zones.rows.includes(field)) return 'rows';
      if (this._zones.columns.includes(field)) return 'columns';
      if (this._zones.values.some(v => v.field === field)) return 'values';
      if (this._zones.filters.includes(field)) return 'filters';
      return null;
    }

    _addFieldToZone(field, zone) {
      // Remove from current zone first
      this._removeFieldFromAnyZone(field);

      if (zone === 'values') {
        const fieldType = this._fieldInfo._allFields.find(f => f.path === field)?.type;
        const agg = fieldType === 'number' ? 'sum' : 'count';
        this._zones.values.push({ field, aggregate: agg });
      } else {
        this._zones[zone].push(field);
        // Auto-set date grouping when a date field is placed in rows or columns
        if ((zone === 'rows' || zone === 'columns') && this._fieldInfo.dates?.includes(field) && !this._dateGrouping[field]) {
          this._dateGrouping[field] = 'month';
        }
      }

      this._sortCol = null;
      this._buildUI();
      this._fireConfigChange();
      this._emitEvent('wcpivotzonechange', 'pivot:zone-change', {
        bubbles: true, composed: true,
        detail: { zone, field, action: 'add', zones: this._zones },
      });
    }

    _removeFieldFromZone(field, zone) {
      if (zone === 'values') {
        this._zones.values = this._zones.values.filter(v => v.field !== field);
      } else {
        this._zones[zone] = this._zones[zone].filter(f => f !== field);
      }
      // Also clear any value filter for this field
      delete this._valueFilters[field];

      this._sortCol = null;
      this._buildUI();
      this._fireConfigChange();
      this._emitEvent('wcpivotzonechange', 'pivot:zone-change', {
        bubbles: true, composed: true,
        detail: { zone, field, action: 'remove', zones: this._zones },
      });
    }

    _removeFieldFromAnyZone(field) {
      this._zones.rows = this._zones.rows.filter(f => f !== field);
      this._zones.columns = this._zones.columns.filter(f => f !== field);
      this._zones.values = this._zones.values.filter(v => v.field !== field);
      this._zones.filters = this._zones.filters.filter(f => f !== field);
    }

    // ── Pivot computation ─────────────────────────────────────────────────────

    _computePivot() {
      if (!this._rowField || !this._colField || this._data.length === 0) {
        this._pivotResult = null;
        return;
      }

      const maxCols = parseInt(this.getAttribute('max-columns')) || 20;
      const rowField = this._rowField;
      const colField = this._colField;
      const valueField = this._valueField;
      const aggregate = this._aggregate;
      const filteredData = this._getFilteredData();

      const rowSet = new Set();
      const colSet = new Set();
      const buckets = {};

      for (const doc of filteredData) {
        const rv = this._valToString(this._getGroupedValue(doc, rowField));
        const cv = this._valToString(this._getGroupedValue(doc, colField));
        rowSet.add(rv);
        colSet.add(cv);
        const key = rv + '\0' + cv;
        if (!buckets[key]) buckets[key] = [];
        if (valueField) {
          const num = Number(this._getNestedValue(doc, valueField));
          if (!isNaN(num)) buckets[key].push(num);
        } else {
          buckets[key].push(1);
        }
      }

      let colValues = Array.from(colSet).sort();
      let hasOther = false;
      if (colValues.length > maxCols) {
        colValues = colValues.slice(0, maxCols);
        hasOther = true;
      }

      let rowValues = Array.from(rowSet).sort();
      const matrix = {};
      const rowTotals = {};
      const colTotals = {};

      for (const rv of rowValues) {
        matrix[rv] = {};
        const rowBuckets = [];
        for (const cv of colValues) {
          const vals = buckets[rv + '\0' + cv] || [];
          matrix[rv][cv] = this._applyAggregate(vals, aggregate);
          rowBuckets.push(...vals);
        }
        if (hasOther) {
          for (const cv of colSet) {
            if (!colValues.includes(cv)) rowBuckets.push(...(buckets[rv + '\0' + cv] || []));
          }
        }
        rowTotals[rv] = this._applyAggregate(rowBuckets, aggregate);
      }

      for (const cv of colValues) {
        const colBuckets = [];
        for (const rv of rowValues) colBuckets.push(...(buckets[rv + '\0' + cv] || []));
        colTotals[cv] = this._applyAggregate(colBuckets, aggregate);
      }

      const allVals = [];
      for (const doc of filteredData) {
        if (valueField) {
          const num = Number(this._getNestedValue(doc, valueField));
          if (!isNaN(num)) allVals.push(num);
        } else {
          allVals.push(1);
        }
      }
      const grandTotal = this._applyAggregate(allVals, aggregate);

      const sortRows = this.getAttribute('sort-rows') || 'asc';
      rowValues = this._sortRowValues(rowValues, rowTotals, matrix, sortRows);

      let maxVal = 0;
      for (const rv of rowValues) {
        for (const cv of colValues) {
          const v = Math.abs(matrix[rv][cv] || 0);
          if (v > maxVal) maxVal = v;
        }
      }

      this._pivotResult = { rowValues, colValues, matrix, rowTotals, colTotals, grandTotal, maxVal, hasOther };
    }

    _applyAggregate(values, aggregate) {
      if (values.length === 0) return 0;
      switch (aggregate) {
        case 'count': return values.length;
        case 'sum': return values.reduce((a, b) => a + b, 0);
        case 'avg': return values.reduce((a, b) => a + b, 0) / values.length;
        case 'min': return Math.min(...values);
        case 'max': return Math.max(...values);
        default: return values.length;
      }
    }

    _sortRowValues(rowValues, rowTotals, matrix, sortMode) {
      const sorted = [...rowValues];
      if (this._sortCol !== null) {
        const col = this._sortCol;
        const dir = this._sortDir === 'desc' ? -1 : 1;
        if (col === '__total') sorted.sort((a, b) => ((rowTotals[a] || 0) - (rowTotals[b] || 0)) * dir);
        else if (col === '__label') sorted.sort((a, b) => a.localeCompare(b) * dir);
        else sorted.sort((a, b) => (((matrix[a] || {})[col] || 0) - ((matrix[b] || {})[col] || 0)) * dir);
        return sorted;
      }
      switch (sortMode) {
        case 'desc': return sorted.sort((a, b) => b.localeCompare(a));
        case 'value-asc': return sorted.sort((a, b) => (rowTotals[a] || 0) - (rowTotals[b] || 0));
        case 'value-desc': return sorted.sort((a, b) => (rowTotals[b] || 0) - (rowTotals[a] || 0));
        default: return sorted.sort((a, b) => a.localeCompare(b));
      }
    }

    _getNestedValue(obj, path) {
      if (!path) return undefined;
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : null, obj);
    }

    _getGroupedValue(doc, field) {
      const raw = this._getNestedValue(doc, field);
      const grouping = this._dateGrouping[field];
      if (!grouping || raw === null || raw === undefined) return raw;
      return this._applyDateGrouping(raw, grouping);
    }

    _applyDateGrouping(value, level) {
      let dateStr = value;
      if (typeof value === 'object' && value.$date) dateStr = value.$date;
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return String(value);

      const year = d.getFullYear();
      const month = d.getMonth(); // 0-based
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      switch (level) {
        case 'year': return String(year);
        case 'quarter': return `Q${Math.floor(month / 3) + 1} ${year}`;
        case 'month': return `${monthNames[month]} ${year}`;
        case 'year-month': return `${year}-${String(month + 1).padStart(2, '0')}`;
        case 'day': return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
        case 'datetime': return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        default: return String(value);
      }
    }

    _valToString(val) {
      if (val === null || val === undefined) return '(empty)';
      if (typeof val === 'object') {
        if (val.$oid) return val.$oid;
        return JSON.stringify(val);
      }
      return String(val);
    }

    // ── UI building ───────────────────────────────────────────────────────────

    _buildUI() {
      this.componentElement.innerHTML = '';
      this._closePopovers();

      if (this._data.length === 0) {
        this.componentElement.innerHTML = '<div class="pivot-empty">No data to pivot. Provide a <code>data</code> attribute with an array of objects.</div>';
        return;
      }

      // Always render in row layout with panel (collapsed or open)
      this.componentElement.classList.add('pivot-with-panel');
      const panel = this._buildPanel();
      if (!this._panelOpen) {
        panel.classList.add('pivot-panel-collapsed');
      }
      this.componentElement.appendChild(panel);

      const main = document.createElement('div');
      main.classList.add('pivot-main');

      const showControls = this.getAttribute('show-controls') !== 'false';
      if (showControls) {
        main.appendChild(this._createControls());
      }

      this._computePivot();

      if (!this._pivotResult) {
        const empty = document.createElement('div');
        empty.classList.add('pivot-empty');
        empty.textContent = 'Select row and column fields to generate the pivot table.';
        main.appendChild(empty);
      } else {
        const tableWrapper = document.createElement('div');
        tableWrapper.classList.add('pivot-table-wrapper');
        const height = this.getAttribute('height');
        if (height) tableWrapper.style.maxHeight = height;
        tableWrapper.appendChild(this._renderTable());
        main.appendChild(tableWrapper);
      }

      this.componentElement.appendChild(main);

      if (this._pivotResult) {
        this._emitEvent('wcpivotready', 'pivot:ready', {
          bubbles: true, composed: true,
          detail: { pivot: this._pivotResult },
        });
      }
    }

    // ── Controls bar ──────────────────────────────────────────────────────────

    _createControls() {
      const bar = document.createElement('div');
      bar.classList.add('pivot-controls');

      // Panel toggle button
      const toggleBtn = document.createElement('button');
      toggleBtn.type = 'button';
      toggleBtn.classList.add('pivot-panel-toggle');
      toggleBtn.title = this._panelOpen ? 'Hide field panel' : 'Show field panel';
      toggleBtn.textContent = '☰';
      toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._panelOpen = !this._panelOpen;
        const panel = this.componentElement.querySelector('.pivot-panel');
        if (panel) {
          if (this._panelOpen) {
            panel.classList.remove('pivot-panel-collapsed');
          } else {
            panel.classList.add('pivot-panel-collapsed');
          }
        } else {
          this._buildUI();
        }
        toggleBtn.title = this._panelOpen ? 'Hide field panel' : 'Show field panel';
      });
      bar.appendChild(toggleBtn);

      // Dropdowns (stay in sync with zones)
      bar.appendChild(this._createDropdown('Rows', this._fieldInfo.rows, this._rowField, (val) => {
        this._rowField = val;
        this._sortCol = null;
        this._buildUI();
        this._fireConfigChange();
      }));

      const colOptions = this._fieldInfo.cols.filter(c => c !== this._rowField);
      bar.appendChild(this._createDropdown('Columns', colOptions, this._colField, (val) => {
        this._colField = val;
        this._sortCol = null;
        this._buildUI();
        this._fireConfigChange();
      }));

      const valOptions = ['(count)', ...this._fieldInfo.values];
      const currentVal = this._aggregate === 'count' && !this._valueField ? '(count)' : this._valueField;
      bar.appendChild(this._createDropdown('Values', valOptions, currentVal, (val) => {
        if (val === '(count)') {
          this._zones.values = [];
        } else {
          this._zones.values = [{ field: val, aggregate: this._aggregate === 'count' ? 'sum' : this._aggregate }];
        }
        this._buildUI();
        this._fireConfigChange();
      }));

      const aggOptions = this._valueField ? AGGREGATES : ['count'];
      bar.appendChild(this._createDropdown('Aggregate', aggOptions, this._aggregate, (val) => {
        if (this._zones.values.length > 0) this._zones.values[0].aggregate = val;
        this._buildUI();
        this._fireConfigChange();
      }));

      // Compact toggle
      const compactBtn = document.createElement('button');
      compactBtn.type = 'button';
      compactBtn.classList.add('pivot-panel-toggle');
      compactBtn.textContent = this._compactLayout ? '▦' : '▤';
      compactBtn.title = this._compactLayout ? 'Switch to standard layout' : 'Switch to compact layout';
      compactBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._compactLayout = !this._compactLayout;
        this._buildUI();
      });
      bar.appendChild(compactBtn);

      // Export button
      const exportBtn = document.createElement('button');
      exportBtn.type = 'button';
      exportBtn.classList.add('pivot-export-btn');
      exportBtn.textContent = 'CSV';
      exportBtn.title = 'Export as CSV';
      exportBtn.addEventListener('click', () => this.exportCSV());
      bar.appendChild(exportBtn);

      return bar;
    }

    _createDropdown(label, options, selected, onChange) {
      const group = document.createElement('div');
      group.classList.add('pivot-field');
      const lbl = document.createElement('label');
      lbl.textContent = label;
      group.appendChild(lbl);
      const select = document.createElement('select');
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === selected) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener('change', () => onChange(select.value));
      group.appendChild(select);
      return group;
    }

    // ── Field panel ───────────────────────────────────────────────────────────

    _buildPanel() {
      const panel = document.createElement('div');
      panel.classList.add('pivot-panel');

      // Header
      const header = document.createElement('div');
      header.classList.add('pivot-panel-header');
      const title = document.createElement('span');
      title.textContent = 'Fields';
      header.appendChild(title);
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.classList.add('pivot-panel-close');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => {
        this._panelOpen = false;
        panel.classList.add('pivot-panel-collapsed');
      });
      header.appendChild(closeBtn);
      panel.appendChild(header);

      // Field list
      const fieldList = document.createElement('div');
      fieldList.classList.add('pivot-panel-fields');

      for (const f of this._fieldInfo._allFields) {
        const currentZone = this._getFieldZone(f.path);
        const fieldEl = document.createElement('div');
        fieldEl.classList.add('pivot-panel-field');
        if (currentZone) fieldEl.classList.add('pivot-panel-field-assigned');

        const nameEl = document.createElement('span');
        nameEl.classList.add('pivot-panel-field-name');
        nameEl.textContent = f.path;
        fieldEl.appendChild(nameEl);

        const typeEl = document.createElement('span');
        typeEl.classList.add('pivot-panel-field-type');
        typeEl.textContent = f.type === 'number' ? '#' : f.type === 'boolean' ? 'T/F' : f.type === 'date' ? '📅' : 'Abc';
        fieldEl.appendChild(typeEl);

        if (currentZone) {
          const zoneTag = document.createElement('span');
          zoneTag.classList.add('pivot-panel-field-zone');
          zoneTag.textContent = currentZone.charAt(0).toUpperCase() + currentZone.slice(1);
          fieldEl.appendChild(zoneTag);
        }

        fieldEl.addEventListener('click', (e) => {
          e.stopPropagation();
          this._showFieldPopover(f.path, f.type, fieldEl);
        });

        fieldList.appendChild(fieldEl);
      }
      panel.appendChild(fieldList);

      // Zones
      const zonesEl = document.createElement('div');
      zonesEl.classList.add('pivot-panel-zones');

      ['filters', 'rows', 'columns', 'values'].forEach(zone => {
        zonesEl.appendChild(this._buildZone(zone));
      });

      panel.appendChild(zonesEl);
      return panel;
    }

    _buildZone(zoneName) {
      const zone = document.createElement('div');
      zone.classList.add('pivot-zone');

      const header = document.createElement('div');
      header.classList.add('pivot-zone-header');
      header.textContent = zoneName.charAt(0).toUpperCase() + zoneName.slice(1);
      zone.appendChild(header);

      const chips = document.createElement('div');
      chips.classList.add('pivot-zone-chips');

      if (zoneName === 'values') {
        this._zones.values.forEach(v => {
          chips.appendChild(this._buildValueChip(v, zoneName));
        });
      } else {
        this._zones[zoneName].forEach(field => {
          chips.appendChild(this._buildChip(field, zoneName));
        });
      }

      if (chips.children.length === 0) {
        const hint = document.createElement('span');
        hint.classList.add('pivot-zone-hint');
        hint.textContent = 'Drop fields here';
        chips.appendChild(hint);
      }

      zone.appendChild(chips);
      return zone;
    }

    _buildChip(field, zone) {
      const chip = document.createElement('span');
      chip.classList.add('pivot-zone-chip');

      const hasFilter = this._valueFilters[field] && this._valueFilters[field].size > 0;
      if (hasFilter) chip.classList.add('pivot-filter-active');

      const isDate = this._fieldInfo.dates?.includes(field);
      const grouping = this._dateGrouping[field];

      const label = document.createElement('span');
      label.classList.add('pivot-zone-chip-label');
      label.textContent = this._toTitle(field) + (grouping ? ` (${grouping})` : '');
      chip.appendChild(label);

      // Date grouping selector
      if (isDate && (zone === 'rows' || zone === 'columns')) {
        const dateBtn = document.createElement('span');
        dateBtn.classList.add('pivot-zone-chip-date');
        dateBtn.textContent = '📅';
        dateBtn.title = 'Change date grouping';
        dateBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this._showDateGroupingPopover(field, chip);
        });
        chip.appendChild(dateBtn);
      }

      // Filter icon
      const filterBtn = document.createElement('span');
      filterBtn.classList.add('pivot-zone-chip-filter');
      filterBtn.textContent = '⧫';
      filterBtn.title = 'Filter values';
      filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showFilterDropdown(field, chip);
      });
      chip.appendChild(filterBtn);

      // Remove button
      const removeBtn = document.createElement('span');
      removeBtn.classList.add('pivot-zone-chip-remove');
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeFieldFromZone(field, zone);
      });
      chip.appendChild(removeBtn);

      return chip;
    }

    _buildValueChip(valueEntry, zone) {
      const chip = document.createElement('span');
      chip.classList.add('pivot-zone-chip');

      const label = document.createElement('span');
      label.classList.add('pivot-zone-chip-label');
      label.textContent = `${valueEntry.aggregate.charAt(0).toUpperCase() + valueEntry.aggregate.slice(1)} of ${this._toTitle(valueEntry.field)}`;
      label.style.cursor = 'pointer';
      label.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showAggregatePopover(valueEntry, chip);
      });
      chip.appendChild(label);

      const removeBtn = document.createElement('span');
      removeBtn.classList.add('pivot-zone-chip-remove');
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove';
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._removeFieldFromZone(valueEntry.field, zone);
      });
      chip.appendChild(removeBtn);

      return chip;
    }

    // ── Popovers ──────────────────────────────────────────────────────────────

    _showFieldPopover(field, type, anchorEl) {
      this._closePopovers();

      const currentZone = this._getFieldZone(field);

      const popover = document.createElement('div');
      popover.classList.add('pivot-field-popover');
      this._activePopover = popover;

      const zones = ['rows', 'columns', 'values', 'filters'];
      zones.forEach(zone => {
        const item = document.createElement('div');
        item.classList.add('pivot-field-popover-item');
        if (zone === currentZone) item.classList.add('pivot-field-popover-active');

        const label = zone === 'values'
          ? (type === 'number' ? `Add to Values (Sum)` : `Add to Values (Count)`)
          : `Add to ${zone.charAt(0).toUpperCase() + zone.slice(1)}`;
        item.textContent = label;

        if (zone === currentZone) {
          item.textContent = `✓ ${label}`;
        }

        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this._closePopovers();
          if (zone === currentZone) {
            this._removeFieldFromZone(field, zone);
          } else {
            this._addFieldToZone(field, zone);
          }
        });
        popover.appendChild(item);
      });

      // Remove option if assigned
      if (currentZone) {
        const divider = document.createElement('div');
        divider.classList.add('pivot-field-popover-divider');
        popover.appendChild(divider);

        const removeItem = document.createElement('div');
        removeItem.classList.add('pivot-field-popover-item', 'pivot-field-popover-remove');
        removeItem.textContent = 'Remove from ' + currentZone;
        removeItem.addEventListener('click', (e) => {
          e.stopPropagation();
          this._closePopovers();
          this._removeFieldFromZone(field, currentZone);
        });
        popover.appendChild(removeItem);
      }

      // Position relative to anchor
      document.body.appendChild(popover);
      const rect = anchorEl.getBoundingClientRect();
      popover.style.top = rect.bottom + 2 + 'px';
      popover.style.left = rect.left + 'px';

      // Viewport check
      requestAnimationFrame(() => {
        const pr = popover.getBoundingClientRect();
        if (pr.right > window.innerWidth - 4) {
          popover.style.left = (window.innerWidth - pr.width - 4) + 'px';
        }
        if (pr.bottom > window.innerHeight - 4) {
          popover.style.top = (rect.top - pr.height - 2) + 'px';
        }
      });
    }

    _showAggregatePopover(valueEntry, anchorEl) {
      this._closePopovers();

      const popover = document.createElement('div');
      popover.classList.add('pivot-field-popover');
      this._activePopover = popover;

      AGGREGATES.forEach(agg => {
        const item = document.createElement('div');
        item.classList.add('pivot-field-popover-item');
        if (agg === valueEntry.aggregate) item.classList.add('pivot-field-popover-active');
        item.textContent = (agg === valueEntry.aggregate ? '✓ ' : '') + agg.charAt(0).toUpperCase() + agg.slice(1);
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this._closePopovers();
          valueEntry.aggregate = agg;
          this._buildUI();
          this._fireConfigChange();
        });
        popover.appendChild(item);
      });

      document.body.appendChild(popover);
      const rect = anchorEl.getBoundingClientRect();
      popover.style.top = rect.bottom + 2 + 'px';
      popover.style.left = rect.left + 'px';
    }

    _showDateGroupingPopover(field, anchorEl) {
      this._closePopovers();

      const popover = document.createElement('div');
      popover.classList.add('pivot-field-popover');
      this._activePopover = popover;

      const levels = ['year', 'quarter', 'month', 'year-month', 'day', 'datetime'];
      const current = this._dateGrouping[field] || null;

      // "None" option
      const noneItem = document.createElement('div');
      noneItem.classList.add('pivot-field-popover-item');
      if (!current) noneItem.classList.add('pivot-field-popover-active');
      noneItem.textContent = (!current ? '✓ ' : '') + 'No grouping (raw)';
      noneItem.addEventListener('click', (e) => {
        e.stopPropagation();
        delete this._dateGrouping[field];
        this._closePopovers();
        this._drillDown = null;
        this._buildUI();
        this._fireConfigChange();
      });
      popover.appendChild(noneItem);

      levels.forEach(level => {
        const item = document.createElement('div');
        item.classList.add('pivot-field-popover-item');
        if (level === current) item.classList.add('pivot-field-popover-active');
        item.textContent = (level === current ? '✓ ' : '') + level.charAt(0).toUpperCase() + level.slice(1);
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          this._dateGrouping[field] = level;
          this._closePopovers();
          this._drillDown = null;
          this._buildUI();
          this._fireConfigChange();
        });
        popover.appendChild(item);
      });

      document.body.appendChild(popover);
      const rect = anchorEl.getBoundingClientRect();
      popover.style.top = rect.bottom + 2 + 'px';
      popover.style.left = rect.left + 'px';

      requestAnimationFrame(() => {
        const pr = popover.getBoundingClientRect();
        if (pr.right > window.innerWidth - 4) popover.style.left = (window.innerWidth - pr.width - 4) + 'px';
        if (pr.bottom > window.innerHeight - 4) popover.style.top = (rect.top - pr.height - 2) + 'px';
      });
    }

    // ── Filter dropdown ───────────────────────────────────────────────────────

    _showFilterDropdown(field, anchorEl) {
      this._closePopovers();

      // Collect unique values
      const uniqueVals = new Set();
      const limit = 500;
      for (const doc of this._data) {
        const val = this._valToString(this._getNestedValue(doc, field));
        uniqueVals.add(val);
        if (uniqueVals.size >= limit) break;
      }
      const sortedVals = Array.from(uniqueVals).sort();
      const excluded = this._valueFilters[field] || new Set();

      const dropdown = document.createElement('div');
      dropdown.classList.add('pivot-filter-dropdown');
      this._activeFilterDropdown = dropdown;

      // Search
      const searchWrap = document.createElement('div');
      searchWrap.classList.add('pivot-filter-search');
      const searchInput = document.createElement('input');
      searchInput.type = 'text';
      searchInput.placeholder = 'Search...';
      searchInput.addEventListener('input', () => {
        const q = searchInput.value.toLowerCase();
        optionEls.forEach(el => {
          el.style.display = el.dataset.val.toLowerCase().includes(q) ? '' : 'none';
        });
      });
      searchWrap.appendChild(searchInput);
      dropdown.appendChild(searchWrap);

      // Options
      const optionsWrap = document.createElement('div');
      optionsWrap.classList.add('pivot-filter-options');
      const optionEls = [];

      sortedVals.forEach(val => {
        const option = document.createElement('label');
        option.classList.add('pivot-filter-option');
        option.dataset.val = val;

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !excluded.has(val);
        option.appendChild(cb);

        const span = document.createElement('span');
        span.textContent = val;
        option.appendChild(span);

        optionEls.push(option);
        optionsWrap.appendChild(option);
      });
      dropdown.appendChild(optionsWrap);

      // Actions
      const actions = document.createElement('div');
      actions.classList.add('pivot-filter-actions');

      const selectAllBtn = document.createElement('button');
      selectAllBtn.type = 'button';
      selectAllBtn.textContent = 'All';
      selectAllBtn.addEventListener('click', () => {
        optionEls.forEach(el => { el.querySelector('input').checked = true; });
      });
      actions.appendChild(selectAllBtn);

      const clearBtn = document.createElement('button');
      clearBtn.type = 'button';
      clearBtn.textContent = 'None';
      clearBtn.addEventListener('click', () => {
        optionEls.forEach(el => { el.querySelector('input').checked = false; });
      });
      actions.appendChild(clearBtn);

      const applyBtn = document.createElement('button');
      applyBtn.type = 'button';
      applyBtn.classList.add('pivot-filter-apply');
      applyBtn.textContent = 'Apply';
      applyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const newExcluded = new Set();
        optionEls.forEach(el => {
          if (!el.querySelector('input').checked) {
            newExcluded.add(el.dataset.val);
          }
        });
        if (newExcluded.size > 0) {
          this._valueFilters[field] = newExcluded;
        } else {
          delete this._valueFilters[field];
        }
        this._closePopovers();
        this._buildUI();
        this._fireConfigChange();
        this._emitEvent('wcpivotfilterchange', 'pivot:filter-change', {
          bubbles: true, composed: true,
          detail: {
            field,
            excluded: Array.from(newExcluded),
            included: sortedVals.filter(v => !newExcluded.has(v)),
          },
        });
      });
      actions.appendChild(applyBtn);
      dropdown.appendChild(actions);

      // Position
      document.body.appendChild(dropdown);
      const rect = anchorEl.getBoundingClientRect();
      dropdown.style.top = rect.bottom + 2 + 'px';
      dropdown.style.left = rect.left + 'px';

      requestAnimationFrame(() => {
        const dr = dropdown.getBoundingClientRect();
        if (dr.right > window.innerWidth - 4) {
          dropdown.style.left = (window.innerWidth - dr.width - 4) + 'px';
        }
        if (dr.bottom > window.innerHeight - 4) {
          dropdown.style.top = (rect.top - dr.height - 2) + 'px';
        }
      });

      searchInput.focus();
    }

    _closePopovers() {
      if (this._activePopover) {
        this._activePopover.remove();
        this._activePopover = null;
      }
      if (this._activeFilterDropdown) {
        this._activeFilterDropdown.remove();
        this._activeFilterDropdown = null;
      }
    }

    _handleOutsideClick(e) {
      if (this._activePopover && !this._activePopover.contains(e.target)) {
        this._activePopover.remove();
        this._activePopover = null;
      }
      if (this._activeFilterDropdown && !this._activeFilterDropdown.contains(e.target)) {
        this._activeFilterDropdown.remove();
        this._activeFilterDropdown = null;
      }
    }

    // ── Config ────────────────────────────────────────────────────────────────

    getConfig() {
      return {
        zones: JSON.parse(JSON.stringify(this._zones)),
        valueFilters: Object.fromEntries(
          Object.entries(this._valueFilters).map(([k, v]) => [k, Array.from(v)])
        ),
        dateGrouping: { ...this._dateGrouping },
        showTotals: this.getAttribute('show-totals') !== 'false',
        showHeatmap: this.hasAttribute('show-heatmap'),
        numberFormat: this.getAttribute('number-format') || 'integer',
        sortRows: this.getAttribute('sort-rows') || 'asc',
        sortCol: this._sortCol,
        sortDir: this._sortDir,
        compactLayout: this._compactLayout,
      };
    }

    loadConfig(config) {
      if (!config || typeof config !== 'object') return;
      if (typeof config === 'string') {
        try { config = JSON.parse(config); } catch (e) { return; }
      }
      if (config.zones) {
        this._zones = JSON.parse(JSON.stringify(config.zones));
      }
      if (config.valueFilters) {
        this._valueFilters = {};
        for (const [k, v] of Object.entries(config.valueFilters)) {
          this._valueFilters[k] = new Set(v);
        }
      }
      if (config.dateGrouping) {
        this._dateGrouping = { ...config.dateGrouping };
      }
      if (config.sortCol !== undefined) this._sortCol = config.sortCol;
      if (config.sortDir !== undefined) this._sortDir = config.sortDir;
      if (config.compactLayout !== undefined) this._compactLayout = config.compactLayout;
      if (config.showTotals !== undefined) {
        if (config.showTotals) this.setAttribute('show-totals', '');
        else this.removeAttribute('show-totals');
      }
      if (config.showHeatmap !== undefined) {
        if (config.showHeatmap) this.setAttribute('show-heatmap', '');
        else this.removeAttribute('show-heatmap');
      }
      if (config.numberFormat) this.setAttribute('number-format', config.numberFormat);
      if (config.sortRows) this.setAttribute('sort-rows', config.sortRows);

      this._drillDown = null;
      this._buildUI();
    }

    _fireConfigChange() {
      this._emitEvent('wcpivotconfigchange', 'pivot:config-change', {
        bubbles: true, composed: true,
        detail: this.getConfig(),
      });
    }

    // ── Table rendering ───────────────────────────────────────────────────────

    _renderTable() {
      const { rowValues, colValues, matrix, rowTotals, colTotals, grandTotal, maxVal } = this._pivotResult;
      const showTotals = this.getAttribute('show-totals') !== 'false';
      const showHeatmap = this.hasAttribute('show-heatmap');
      const fmt = this._getFormatter();
      const filteredData = this._getFilteredData();

      const table = document.createElement('table');
      table.classList.add('pivot-table');
      if (this._compactLayout) table.classList.add('pivot-compact');

      // Head
      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');

      const rowHeader = document.createElement('th');
      rowHeader.classList.add('pivot-row-header', 'pivot-sortable');
      rowHeader.textContent = this._toTitle(this._rowField);
      if (this._sortCol === '__label') rowHeader.classList.add('pivot-sorted');
      rowHeader.addEventListener('click', () => this._handleSort('__label'));
      headRow.appendChild(rowHeader);

      colValues.forEach(cv => {
        const th = document.createElement('th');
        th.classList.add('pivot-col-header', 'pivot-sortable');
        th.textContent = cv;
        th.dataset.col = cv;
        if (this._sortCol === cv) th.classList.add('pivot-sorted');
        th.addEventListener('click', () => this._handleSort(cv));
        headRow.appendChild(th);
      });

      if (showTotals) {
        const totalTh = document.createElement('th');
        totalTh.classList.add('pivot-total-header', 'pivot-sortable');
        totalTh.textContent = 'TOTAL';
        if (this._sortCol === '__total') totalTh.classList.add('pivot-sorted');
        totalTh.addEventListener('click', () => this._handleSort('__total'));
        headRow.appendChild(totalTh);
      }
      thead.appendChild(headRow);
      table.appendChild(thead);

      // Body
      const totalColSpan = colValues.length + 1 + (showTotals ? 1 : 0);
      const tbody = document.createElement('tbody');
      rowValues.forEach((rv, idx) => {
        const tr = document.createElement('tr');
        if (idx % 2 === 1) tr.classList.add('pivot-stripe');

        const rowLabel = document.createElement('td');
        rowLabel.classList.add('pivot-row-label');
        rowLabel.textContent = rv;
        tr.appendChild(rowLabel);

        colValues.forEach(cv => {
          const td = document.createElement('td');
          td.classList.add('pivot-cell');
          const isExpanded = this._drillDown && this._drillDown.row === rv && this._drillDown.col === cv;
          if (isExpanded) td.classList.add('pivot-cell-expanded');
          const val = matrix[rv]?.[cv] || 0;
          td.textContent = fmt(val);
          td.dataset.value = val;

          if (showHeatmap && maxVal > 0 && val > 0) {
            const intensity = Math.min(val / maxVal, 1) * 0.6;
            td.style.backgroundColor = `rgba(99, 102, 241, ${intensity})`;
            if (intensity > 0.35) td.style.color = '#fff';
          }

          td.addEventListener('click', () => {
            this._toggleDrillDown(rv, cv, filteredData, totalColSpan, tbody, tr);
          });

          tr.appendChild(td);
        });

        if (showTotals) {
          const totalTd = document.createElement('td');
          totalTd.classList.add('pivot-row-total');
          totalTd.textContent = fmt(rowTotals[rv] || 0);
          tr.appendChild(totalTd);
        }
        tbody.appendChild(tr);

        // Render drill-down row if this row+col is expanded
        if (this._drillDown && this._drillDown.row === rv) {
          const ddRow = this._renderDrillDownRow(rv, this._drillDown.col, filteredData, totalColSpan);
          if (ddRow) tbody.appendChild(ddRow);
        }
      });
      table.appendChild(tbody);

      // Footer
      if (showTotals) {
        const tfoot = document.createElement('tfoot');
        const footRow = document.createElement('tr');

        const totalLabel = document.createElement('td');
        totalLabel.classList.add('pivot-total-label');
        totalLabel.textContent = 'TOTAL';
        footRow.appendChild(totalLabel);

        colValues.forEach(cv => {
          const td = document.createElement('td');
          td.classList.add('pivot-col-total');
          td.textContent = fmt(colTotals[cv] || 0);
          footRow.appendChild(td);
        });

        const grandTd = document.createElement('td');
        grandTd.classList.add('pivot-grand-total');
        grandTd.textContent = fmt(grandTotal);
        footRow.appendChild(grandTd);

        tfoot.appendChild(footRow);
        table.appendChild(tfoot);
      }

      return table;
    }

    // ── Drill-down ──────────────────────────────────────────────────────────

    _toggleDrillDown(row, col, filteredData, colSpan, tbody, afterTr) {
      const matches = filteredData.filter(d =>
        this._valToString(this._getGroupedValue(d, this._rowField)) === row &&
        this._valToString(this._getGroupedValue(d, this._colField)) === col
      );

      // Always dispatch the cell-click event
      this._emitEvent('wcpivotcellclick', 'pivot:cell-click', {
        bubbles: true, composed: true,
        detail: { row, column: col, value: matches.length, documents: matches },
      });

      // Toggle drill-down
      const wasExpanded = this._drillDown && this._drillDown.row === row && this._drillDown.col === col;

      // Remove expanded class from any cell
      tbody.querySelectorAll('.pivot-cell-expanded').forEach(el => el.classList.remove('pivot-cell-expanded'));

      // Animate out existing drill-down row
      const existingDd = tbody.querySelector('.pivot-drilldown-row');
      if (existingDd) {
        const wrapper = existingDd.querySelector('.pivot-drilldown-wrapper');
        if (wrapper) {
          wrapper.classList.add('pivot-drilldown-closing');
          wrapper.addEventListener('animationend', () => existingDd.remove(), { once: true });
        } else {
          existingDd.remove();
        }
      }

      if (wasExpanded) {
        this._drillDown = null;
        this._emitEvent('wcpivotdrilldown', 'pivot:drill-down', {
          bubbles: true, composed: true,
          detail: { row, column: col, expanded: false, documents: [] },
        });
        return;
      }

      this._drillDown = { row, col };

      // Mark the clicked cell
      const cells = afterTr.querySelectorAll('.pivot-cell');
      const colIdx = this._pivotResult.colValues.indexOf(col);
      if (colIdx >= 0 && cells[colIdx]) cells[colIdx].classList.add('pivot-cell-expanded');

      // Insert drill-down row
      const ddRow = this._renderDrillDownRow(row, col, filteredData, colSpan);
      if (ddRow) afterTr.after(ddRow);

      this._emitEvent('wcpivotdrilldown', 'pivot:drill-down', {
        bubbles: true, composed: true,
        detail: { row, column: col, expanded: true, documents: matches },
      });
    }

    _renderDrillDownRow(row, col, filteredData, colSpan) {
      const matches = filteredData.filter(d =>
        this._valToString(this._getGroupedValue(d, this._rowField)) === row &&
        this._valToString(this._getGroupedValue(d, this._colField)) === col
      );
      if (matches.length === 0) return null;

      const tr = document.createElement('tr');
      tr.classList.add('pivot-drilldown-row');

      const td = document.createElement('td');
      td.colSpan = colSpan;

      const wrapper = document.createElement('div');
      wrapper.classList.add('pivot-drilldown-wrapper');

      // Header
      const ddHeader = document.createElement('div');
      ddHeader.classList.add('pivot-drilldown-header');
      const ddTitle = document.createElement('span');
      ddTitle.textContent = `${row} / ${col} — ${matches.length} record${matches.length !== 1 ? 's' : ''}`;
      ddHeader.appendChild(ddTitle);
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.classList.add('pivot-drilldown-close');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._drillDown = null;
        const tbody = this.componentElement.querySelector('.pivot-table tbody');
        if (tbody) tbody.querySelectorAll('.pivot-cell-expanded').forEach(el => el.classList.remove('pivot-cell-expanded'));
        wrapper.classList.add('pivot-drilldown-closing');
        wrapper.addEventListener('animationend', () => tr.remove(), { once: true });
      });
      ddHeader.appendChild(closeBtn);
      wrapper.appendChild(ddHeader);

      // Detail table
      const detailTable = document.createElement('table');
      detailTable.classList.add('pivot-drilldown-table');

      // Collect all field keys from matching documents
      const allKeys = new Set();
      matches.forEach(doc => {
        this._flattenKeys(doc, '', allKeys);
      });
      const keys = Array.from(allKeys).sort();

      const thead = document.createElement('thead');
      const headRow = document.createElement('tr');
      keys.forEach(k => {
        const th = document.createElement('th');
        th.textContent = k;
        headRow.appendChild(th);
      });
      thead.appendChild(headRow);
      detailTable.appendChild(thead);

      const tbody = document.createElement('tbody');
      matches.forEach(doc => {
        const row = document.createElement('tr');
        keys.forEach(k => {
          const cell = document.createElement('td');
          const val = this._getNestedValue(doc, k);
          if (val === null || val === undefined) {
            cell.textContent = '';
            cell.classList.add('pivot-drilldown-null');
          } else if (typeof val === 'object') {
            if (val.$oid) {
              cell.textContent = val.$oid;
            } else if (val.$date) {
              cell.textContent = this._formatDate(val.$date);
            } else {
              cell.textContent = JSON.stringify(val);
            }
          } else if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(val)) {
            cell.textContent = this._formatDate(val);
          } else {
            cell.textContent = String(val);
          }
          row.appendChild(cell);
        });
        tbody.appendChild(row);
      });
      detailTable.appendChild(tbody);

      wrapper.appendChild(detailTable);
      td.appendChild(wrapper);
      tr.appendChild(td);
      return tr;
    }

    _flattenKeys(obj, prefix, keys) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
      for (const key of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];
        if (val !== null && typeof val === 'object' && !Array.isArray(val) && !val.$oid && !val.$date) {
          this._flattenKeys(val, path, keys);
        } else {
          keys.add(path);
        }
      }
    }

    // ── Sorting ───────────────────────────────────────────────────────────────

    _handleSort(col) {
      if (this._sortCol === col) {
        this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this._sortCol = col;
        this._sortDir = col === '__label' ? 'asc' : 'desc';
      }
      this._buildUI();
    }

    // ── Formatting ────────────────────────────────────────────────────────────

    _getFormatter() {
      const format = this.getAttribute('number-format') || 'integer';
      switch (format) {
        case 'decimal': return (v) => v === 0 ? '0' : Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        case 'currency': return (v) => v === 0 ? '$0' : '$' + Number(v).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        case 'percent': return (v) => v === 0 ? '0%' : (Number(v) * 100).toFixed(1) + '%';
        default: return (v) => v === 0 ? '0' : Number(v).toLocaleString(undefined, { maximumFractionDigits: 0 });
      }
    }

    _formatDate(val) {
      try {
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val);
        return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
          + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
      } catch (e) {
        return String(val);
      }
    }

    _toTitle(path) {
      if (!path) return '';
      return path.split(/[._]/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    }

    // ── Export ────────────────────────────────────────────────────────────────

    exportCSV() {
      if (!this._pivotResult) return;
      const { rowValues, colValues, matrix, rowTotals, colTotals, grandTotal } = this._pivotResult;
      const showTotals = this.getAttribute('show-totals') !== 'false';
      const fmt = this._getFormatter();
      const esc = (v) => '"' + String(v).replace(/"/g, '""') + '"';

      const lines = [];
      const header = [esc(this._toTitle(this._rowField)), ...colValues.map(esc)];
      if (showTotals) header.push(esc('TOTAL'));
      lines.push(header.join(','));

      rowValues.forEach(rv => {
        const row = [esc(rv)];
        colValues.forEach(cv => row.push(fmt(matrix[rv]?.[cv] || 0)));
        if (showTotals) row.push(fmt(rowTotals[rv] || 0));
        lines.push(row.join(','));
      });

      if (showTotals) {
        const totRow = [esc('TOTAL')];
        colValues.forEach(cv => totRow.push(fmt(colTotals[cv] || 0)));
        totRow.push(fmt(grandTotal));
        lines.push(totRow.join(','));
      }

      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pivot_${this._rowField}_by_${this._colField}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }

    // ── Styles ────────────────────────────────────────────────────────────────

    _applyStyle() {
      const style = `
        .wc-pivot {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        .wc-pivot.pivot-with-panel {
          flex-direction: row;
        }

        /* ── Panel ─────────────────────────────────────────────────── */
        .pivot-panel {
          width: 240px;
          flex-shrink: 0;
          border-right: 1px solid var(--card-border-color, #444);
          background: var(--card-bg-color, #1e1e2e);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-size: 0.75rem;
          border-radius: 6px 0 0 6px;
          transition: width 0.25s ease, opacity 0.2s ease, border-right-width 0.25s ease;
          opacity: 1;
        }
        .pivot-panel.pivot-panel-collapsed {
          width: 0;
          opacity: 0;
          border-right-width: 0;
          pointer-events: none;
        }
        .pivot-panel-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.5rem 0.75rem;
          border-bottom: 1px solid var(--card-border-color, #444);
          font-weight: 600;
          color: var(--text-color, #ccc);
        }
        .pivot-panel-close {
          background: transparent;
          border: none;
          color: var(--text-6, #888);
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          padding: 0;
        }
        .pivot-panel-close:hover { color: var(--text-color, #ccc); }

        .pivot-panel-fields {
          flex: 1;
          overflow-y: auto;
          padding: 0.375rem;
          border-bottom: 1px solid var(--card-border-color, #444);
        }
        .pivot-panel-field {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          cursor: pointer;
          color: var(--text-color, #ccc);
        }
        .pivot-panel-field:hover {
          background: var(--surface-bg-color, #2a2a3e);
        }
        .pivot-panel-field-assigned {
          opacity: 0.6;
        }
        .pivot-panel-field-name {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pivot-panel-field-type {
          font-size: 0.5625rem;
          color: var(--text-6, #888);
          background: var(--surface-bg-color, #2a2a3e);
          padding: 1px 4px;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .pivot-panel-field-zone {
          font-size: 0.5625rem;
          color: var(--primary-bg-color, #6366f1);
          flex-shrink: 0;
        }

        .pivot-panel-zones {
          padding: 0.5rem;
          overflow-y: auto;
        }
        .pivot-zone {
          margin-bottom: 0.5rem;
        }
        .pivot-zone-header {
          font-weight: 600;
          font-size: 0.625rem;
          color: var(--text-6, #888);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          margin-bottom: 0.25rem;
        }
        .pivot-zone-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          min-height: 28px;
          border: 1px dashed var(--component-border-color, #555);
          border-radius: 4px;
          padding: 4px;
          align-items: center;
        }
        .pivot-zone-hint {
          color: var(--text-6, #666);
          font-size: 0.625rem;
          font-style: italic;
        }
        .pivot-zone-chip {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: var(--primary-bg-color, #6366f1);
          color: var(--primary-text-color, #fff);
          font-size: 0.625rem;
          padding: 2px 6px;
          border-radius: 10px;
          white-space: nowrap;
          max-width: 100%;
        }
        .pivot-zone-chip-label {
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pivot-zone-chip-filter,
        .pivot-zone-chip-remove {
          cursor: pointer;
          opacity: 0.7;
          font-size: 0.625rem;
          flex-shrink: 0;
        }
        .pivot-zone-chip-filter:hover,
        .pivot-zone-chip-remove:hover { opacity: 1; }
        .pivot-zone-chip-date {
          cursor: pointer;
          font-size: 0.75rem;
          flex-shrink: 0;
          filter: brightness(1.5);
          transition: transform 0.15s;
        }
        .pivot-zone-chip-date:hover {
          transform: scale(1.3);
        }
        .pivot-filter-active {
          outline: 2px solid var(--warning-bg-color, #f59e0b);
          outline-offset: -1px;
        }

        /* ── Popovers ──────────────────────────────────────────────── */
        .pivot-field-popover {
          position: fixed;
          z-index: 10000;
          background: var(--card-bg-color, #1e1e2e);
          border: 1px solid var(--card-border-color, #444);
          border-radius: 6px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          min-width: 170px;
          padding: 4px 0;
          font-size: 0.75rem;
        }
        .pivot-field-popover-item {
          padding: 6px 14px;
          cursor: pointer;
          color: var(--text-color, #ccc);
          white-space: nowrap;
        }
        .pivot-field-popover-item:hover {
          background: var(--primary-bg-color, #6366f1);
          color: var(--primary-text-color, #fff);
        }
        .pivot-field-popover-active {
          color: var(--primary-bg-color, #6366f1);
        }
        .pivot-field-popover-remove {
          color: var(--danger-bg-color, #ef4444);
        }
        .pivot-field-popover-divider {
          height: 1px;
          margin: 4px 0;
          background: var(--card-border-color, #444);
        }

        /* ── Filter dropdown ───────────────────────────────────────── */
        .pivot-filter-dropdown {
          position: fixed;
          z-index: 10000;
          width: 220px;
          background: var(--card-bg-color, #1e1e2e);
          border: 1px solid var(--card-border-color, #444);
          border-radius: 6px;
          box-shadow: 0 4px 16px rgba(0,0,0,0.3);
          font-size: 0.75rem;
        }
        .pivot-filter-search {
          padding: 6px;
          border-bottom: 1px solid var(--card-border-color, #444);
        }
        .pivot-filter-search input {
          width: 100%;
          padding: 4px 8px;
          font-size: 0.75rem;
          border: 1px solid var(--component-border-color, #555);
          border-radius: 4px;
          background: var(--surface-bg-color, #2a2a3e);
          color: var(--text-color, #ccc);
          outline: none;
          box-sizing: border-box;
        }
        .pivot-filter-search input:focus {
          border-color: var(--primary-bg-color, #6366f1);
        }
        .pivot-filter-options {
          max-height: 250px;
          overflow-y: auto;
          padding: 4px;
        }
        .pivot-filter-option {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 3px 8px;
          cursor: pointer;
          border-radius: 3px;
          color: var(--text-color, #ccc);
        }
        .pivot-filter-option:hover {
          background: var(--surface-bg-color, #2a2a3e);
        }
        .pivot-filter-option input[type="checkbox"] {
          margin: 0;
          cursor: pointer;
        }
        .pivot-filter-actions {
          display: flex;
          gap: 4px;
          padding: 6px 8px;
          border-top: 1px solid var(--card-border-color, #444);
          justify-content: flex-end;
        }
        .pivot-filter-actions button {
          background: var(--surface-bg-color, #2a2a3e);
          color: var(--text-color, #ccc);
          border: 1px solid var(--component-border-color, #555);
          border-radius: 4px;
          padding: 3px 8px;
          font-size: 0.6875rem;
          cursor: pointer;
        }
        .pivot-filter-actions button:hover {
          background: var(--primary-bg-color, #6366f1);
          color: var(--primary-text-color, #fff);
          border-color: var(--primary-bg-color, #6366f1);
        }
        .pivot-filter-apply {
          background: var(--primary-bg-color, #6366f1) !important;
          color: var(--primary-text-color, #fff) !important;
          border-color: var(--primary-bg-color, #6366f1) !important;
        }

        /* ── Main area ─────────────────────────────────────────────── */
        .pivot-main {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
        }
        .pivot-controls {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.75rem;
          padding: 0.5rem 0.75rem;
          background: var(--card-bg-color, #1e1e2e);
          border: 1px solid var(--card-border-color, #444);
          border-radius: 6px;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
        }
        .pivot-panel-toggle {
          background: var(--surface-bg-color, #2a2a3e);
          color: var(--text-color, #ccc);
          border: 1px solid var(--component-border-color, #555);
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
          line-height: 1;
        }
        .pivot-panel-toggle:hover {
          background: var(--primary-bg-color, #6366f1);
          color: var(--primary-text-color, #fff);
          border-color: var(--primary-bg-color, #6366f1);
        }
        .pivot-field {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .pivot-field label {
          color: var(--text-6, #888);
          font-weight: 500;
          white-space: nowrap;
        }
        .pivot-field select {
          background: var(--surface-bg-color, #2a2a3e);
          color: var(--text-color, #ccc);
          border: 1px solid var(--component-border-color, #555);
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
          min-width: 80px;
        }
        .pivot-field select:focus {
          outline: none;
          border-color: var(--primary-bg-color, #6366f1);
        }
        .pivot-export-btn {
          margin-left: auto;
          background: var(--surface-bg-color, #2a2a3e);
          color: var(--text-color, #ccc);
          border: 1px solid var(--component-border-color, #555);
          border-radius: 4px;
          padding: 0.25rem 0.625rem;
          font-size: 0.6875rem;
          cursor: pointer;
          font-weight: 500;
        }
        .pivot-export-btn:hover {
          background: var(--primary-bg-color, #6366f1);
          color: var(--primary-text-color, #fff);
          border-color: var(--primary-bg-color, #6366f1);
        }

        /* ── Table ─────────────────────────────────────────────────── */
        .pivot-table-wrapper {
          flex: 1;
          overflow: auto;
          border: 1px solid var(--card-border-color, #444);
          border-radius: 6px;
        }
        .pivot-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.75rem;
          white-space: nowrap;
        }
        .pivot-table thead {
          position: sticky;
          top: 0;
          z-index: 2;
        }
        .pivot-table th {
          background: var(--card-bg-color, #1e1e2e);
          color: var(--text-color, #ccc);
          padding: 0.5rem 0.75rem;
          text-align: right;
          border-bottom: 2px solid var(--card-border-color, #444);
          font-weight: 600;
          user-select: none;
        }
        .pivot-row-header {
          text-align: left !important;
          position: sticky;
          left: 0;
          z-index: 3;
          background: var(--card-bg-color, #1e1e2e) !important;
        }
        .pivot-sortable { cursor: pointer; }
        .pivot-sortable:hover { color: var(--primary-bg-color, #6366f1); }
        .pivot-sorted {
          color: var(--primary-bg-color, #6366f1) !important;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .pivot-table td {
          padding: 0.375rem 0.75rem;
          border-bottom: 1px solid var(--card-border-color, #333);
          text-align: right;
          color: var(--text-color, #ccc);
        }
        .pivot-row-label {
          text-align: left !important;
          font-weight: 500;
          position: sticky;
          left: 0;
          z-index: 1;
          background: var(--bg-color, #141422);
        }
        .pivot-stripe .pivot-row-label {
          background: var(--surface-bg-color, #1a1a2e);
        }
        .pivot-stripe td {
          background: var(--surface-bg-color, #1a1a2e);
        }
        .pivot-cell {
          cursor: pointer;
          transition: background-color 0.1s;
          position: relative;
        }
        .pivot-cell:hover {
          outline: 2px solid var(--primary-bg-color, #6366f1);
          outline-offset: -2px;
        }
        .pivot-cell:hover::after {
          content: '⤢';
          position: absolute;
          top: 2px;
          right: 3px;
          font-size: 0.75rem;
          color: var(--primary-bg-color, #6366f1);
          opacity: 1;
          pointer-events: none;
          font-weight: 700;
        }
        .pivot-row-total,
        .pivot-col-total,
        .pivot-total-label,
        .pivot-total-header {
          font-weight: 700;
          background: var(--card-bg-color, #1e1e2e) !important;
          color: var(--text-color, #ccc);
        }
        .pivot-grand-total {
          font-weight: 700;
          background: var(--primary-bg-color, #6366f1) !important;
          color: var(--primary-text-color, #fff) !important;
        }
        .pivot-total-label {
          text-align: left !important;
          position: sticky;
          left: 0;
          z-index: 1;
        }
        .pivot-table tfoot {
          position: sticky;
          bottom: 0;
          z-index: 2;
        }
        .pivot-table tfoot td {
          border-top: 2px solid var(--card-border-color, #444);
          border-bottom: none;
        }
        /* ── Compact layout ─────────────────────────────────────── */
        .pivot-table.pivot-compact th {
          padding: 0.25rem 0.5rem;
          font-size: 0.6875rem;
        }
        .pivot-table.pivot-compact td {
          padding: 0.25rem 0.5rem;
          font-size: 0.6875rem;
        }
        .pivot-table.pivot-compact .pivot-row-label {
          font-size: 0.6875rem;
        }

        /* ── Drill-down ────────────────────────────────────────── */
        .pivot-cell-expanded {
          outline: 2px solid var(--primary-bg-color, #6366f1) !important;
          outline-offset: -2px;
          background: rgba(99, 102, 241, 0.15) !important;
        }
        .pivot-drilldown-row td {
          padding: 0 !important;
          background: var(--surface-bg-color, #1a1a2e) !important;
          border-bottom: 2px solid var(--primary-bg-color, #6366f1);
        }
        .pivot-drilldown-wrapper {
          padding: 0.75rem;
          max-height: 300px;
          overflow: auto;
          animation: pivotDrillSlide 0.2s ease-out;
        }
        @keyframes pivotDrillSlide {
          from { max-height: 0; opacity: 0; padding: 0 0.75rem; }
          to { max-height: 300px; opacity: 1; padding: 0.75rem; }
        }
        .pivot-drilldown-closing {
          animation: pivotDrillClose 0.2s ease-in forwards;
          overflow: hidden;
        }
        @keyframes pivotDrillClose {
          from { max-height: 300px; opacity: 1; padding: 0.75rem; }
          to { max-height: 0; opacity: 0; padding: 0 0.75rem; }
        }
        .pivot-drilldown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-color, #ccc);
        }
        .pivot-drilldown-close {
          background: transparent;
          border: none;
          color: var(--text-6, #888);
          cursor: pointer;
          font-size: 1rem;
          line-height: 1;
          padding: 0 4px;
        }
        .pivot-drilldown-close:hover { color: var(--text-color, #ccc); }
        .pivot-drilldown-table {
          width: 100%;
          font-size: 0.6875rem;
          border-collapse: collapse;
        }
        .pivot-drilldown-table th {
          text-align: left;
          padding: 4px 8px;
          border-bottom: 1px solid var(--card-border-color, #444);
          font-weight: 600;
          color: var(--text-color, #ccc);
          background: transparent;
          position: static;
          white-space: nowrap;
        }
        .pivot-drilldown-table td {
          text-align: left;
          padding: 3px 8px;
          border-bottom: 1px solid var(--card-border-color, #333);
          color: var(--text-color, #ccc);
          background: transparent;
          position: static;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .pivot-drilldown-null {
          color: var(--text-6, #666);
          font-style: italic;
        }

        .pivot-empty {
          padding: 2rem;
          text-align: center;
          color: var(--text-6, #888);
          font-size: 0.875rem;
        }
        .pivot-empty code {
          background: var(--surface-bg-color, #2a2a3e);
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          font-size: 0.8125rem;
        }
      `.trim();
      this.loadStyle('wc-pivot-style', style);
    }
  }

  customElements.define('wc-pivot', WcPivot);
}
