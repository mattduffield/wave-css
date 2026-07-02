/**
 *  Name: wc-table
 *  Usage:
 *    <!-- Data-driven via URL -->
 *    <wc-table url="/api/prospects?limit=10" striped hoverable>
 *      <wc-table-col field="first_name" label="First Name" sortable></wc-table-col>
 *      <wc-table-col field="last_name" label="Last Name" sortable></wc-table-col>
 *      <wc-table-col field="email" label="Email"></wc-table-col>
 *      <wc-table-col field="status" label="Status" align="center"></wc-table-col>
 *    </wc-table>
 *
 *    <!-- Static data via items attribute -->
 *    <wc-table items='[{"name":"Jane","email":"jane@acme.com"}]' striped>
 *      <wc-table-col field="name" label="Name" sortable></wc-table-col>
 *      <wc-table-col field="email" label="Email"></wc-table-col>
 *    </wc-table>
 *
 *    <!-- Auto-columns from data (no wc-table-col needed) -->
 *    <wc-table url="/api/prospects?limit=5" striped hoverable auto-columns></wc-table>
 *
 *  Description:
 *    A lightweight data-driven table component. Uses the existing wc-table
 *    CSS classes internally. Supports URL fetching, static data, column
 *    definitions, sorting, empty state, and click events.
 *
 *  Events:
 *    table:row-click  - { row, index, data }
 *    table:row-dblclick - { row, index, data }
 *    table:sort - { field, direction }
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-table')) {
  class WcTable extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'url', 'items', 'striped', 'hoverable', 'bordered', 'borderless',
              'size', 'fixed-header', 'clickable', 'auto-columns', 'empty-message',
              'page-size', 'display-member'];
    }

    static get is() {
      return 'wc-table';
    }

    constructor() {
      super();
      this._data = [];
      this._columns = [];
      this._sortField = '';
      this._sortDir = '';
      this._currentPage = 0;
      // run-status formatter: live SSE streams keyed by run id
      this._runStreams = new Map();   // runId -> { es, cellEl, gotData, done, retries, liveField, doneField }
      this._runStatusRows = {};       // runId -> row object (for the complete event detail)
      this._completedRuns = new Set(); // runs that terminated but whose cell may still show active

      const compEl = this.querySelector(':scope > .wc-table-container');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-table-container');
        this.appendChild(this.componentElement);
      }
      if (this.hasAttribute('url')) {
        this._deferReady = true;
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();

      // Parse column definitions from child wc-table-col elements
      this._parseColumns();

      // Load data
      const url = this.getAttribute('url');
      const items = this.getAttribute('items');
      if (url) {
        await this._fetchData(url);
      } else if (items) {
        try {
          this._data = JSON.parse(items);
        } catch (e) {
          console.error('[wc-table] Invalid items JSON:', e);
          this._data = [];
        }
        this._renderTable();
      } else {
        this._renderTable();
      }
      this._setReady();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._closeAllRunStreams();
    }

    _render() {
      super._render();
    }

    _parseColumns() {
      const cols = this.querySelectorAll('wc-table-col');
      this._columns = Array.from(cols).map(col => {
        // Handle case where wc-table-col isn't upgraded yet
        if (typeof col.config === 'object') return col.config;
        let formatterMap = {};
        const rawMap = col.getAttribute('formatter-map');
        if (rawMap) { try { const m = JSON.parse(rawMap); if (m && typeof m === 'object') formatterMap = m; } catch (ex) {} }
        return {
          field: col.getAttribute('field') || '',
          label: col.getAttribute('label') || col.getAttribute('field') || '',
          sortable: col.hasAttribute('sortable'),
          align: col.getAttribute('align') || 'left',
          width: col.getAttribute('width') || '',
          format: col.getAttribute('format') || '',
          css: col.getAttribute('class') || '',
          type: col.getAttribute('type') || '',
          formatter: col.getAttribute('formatter') || '',
          formatterMap,
          formatterHref: col.getAttribute('formatter-href') || '',
          formatterFormat: col.getAttribute('formatter-format') || '',
          formatterActiveField: col.getAttribute('formatter-active-field') || '',
          formatterEventsUrl: col.getAttribute('formatter-events-url') || '',
          formatterLiveField: col.getAttribute('formatter-live-field') || '',
          formatterDoneWhen: col.getAttribute('formatter-done-when') || ''
        };
      }).filter(c => c.field);

      // Auto-columns from display-member attribute
      if (this._columns.length === 0) {
        const displayMember = this.getAttribute('display-member');
        if (displayMember) {
          this._columns = displayMember.split(',').map(f => {
            const field = f.trim();
            return {
              field,
              label: field.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
              sortable: true,
              align: 'left',
              width: '',
              format: '',
              css: ''
            };
          });
        }
      }
    }

    async _fetchData(url) {
      this.componentElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; padding: 2rem; gap: 0.5rem; color: var(--text-6);">
          <wc-fa-icon name="spinner" spin size="1rem"></wc-fa-icon> Loading...
        </div>`;

      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        this._data = Array.isArray(data) ? data : (data.items || data.results || data.data || [data]);
      } catch (e) {
        console.error('[wc-table] Fetch error:', e);
        this._data = [];
        this.componentElement.innerHTML = `
          <div style="padding: 1rem; color: var(--error-color, #e53935); font-size: 0.875rem;">
            Failed to load data: ${e.message}
          </div>`;
        return;
      }

      // Auto-generate columns from data keys if needed
      if (this._columns.length === 0 && this._data.length > 0 && this.hasAttribute('auto-columns')) {
        const keys = Object.keys(this._data[0]).filter(k => !k.startsWith('_'));
        this._columns = keys.map(field => ({
          field,
          label: field.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          sortable: true,
          align: 'left',
          width: '',
          format: '',
          css: ''
        }));
      }

      this._renderTable();
    }

    _renderTable() {
      const data = this._getSortedData();
      const emptyMessage = this.getAttribute('empty-message') || 'No data available';
      // Reset the per-render run-status row map; _renderRunStatus repopulates it as cells build.
      this._runStatusRows = {};

      // Build CSS classes
      const classes = ['wc-table'];
      if (this.hasAttribute('striped')) classes.push('wc-table-striped');
      if (this.hasAttribute('hoverable')) classes.push('wc-table-hover');
      if (this.hasAttribute('bordered')) classes.push('wc-table-bordered');
      if (this.hasAttribute('borderless')) classes.push('wc-table-borderless');
      if (this.hasAttribute('clickable')) classes.push('wc-table-clickable');
      const size = this.getAttribute('size');
      if (size) classes.push(`wc-table-${size}`);
      if (this.hasAttribute('fixed-header')) classes.push('wc-table-fixed-header');

      // Responsive wrapper
      const needsResponsive = this.hasAttribute('fixed-header');

      let html = '';
      if (needsResponsive) {
        const maxH = this.getAttribute('max-height') || '500px';
        html += `<div class="wc-table-responsive" style="max-height: ${maxH}; overflow-y: auto;">`;
      }

      html += `<table class="${classes.join(' ')}">`;

      // Header
      if (this._columns.length > 0) {
        html += '<thead><tr>';
        this._columns.forEach(col => {
          const alignClass = col.align !== 'left' ? ` wc-text-${col.align}` : '';
          const sortClass = col.sortable ? ' wc-sortable' : '';
          const sortDirClass = (col.field === this._sortField)
            ? (this._sortDir === 'asc' ? ' wc-sort-asc' : ' wc-sort-desc')
            : '';
          const widthStyle = col.width ? ` style="width: ${col.width}"` : '';
          html += `<th class="${alignClass}${sortClass}${sortDirClass}" data-field="${col.field}"${widthStyle}>${col.label}</th>`;
        });
        html += '</tr></thead>';
      }

      // Body
      html += '<tbody>';
      if (data.length === 0) {
        const colspan = this._columns.length || 1;
        html += `<tr class="wc-table-empty"><td colspan="${colspan}" style="text-align: center; padding: 2rem; color: var(--text-6);">${emptyMessage}</td></tr>`;
      } else {
        data.forEach((row, idx) => {
          html += `<tr data-row-index="${idx}">`;
          if (this._columns.length > 0) {
            this._columns.forEach(col => {
              const value = this._getNestedValue(row, col.field);
              const formatted = this._renderCell(value, col, row);
              const alignClass = col.align !== 'left' ? ` class="wc-text-${col.align}"` : '';
              const cssClass = col.css ? ` class="${col.css}"` : '';
              const cls = alignClass || cssClass;
              html += `<td${cls}>${formatted}</td>`;
            });
          } else {
            // No columns defined — dump all values
            Object.entries(row).forEach(([key, value]) => {
              if (!key.startsWith('_')) {
                html += `<td>${this._escapeHtml(String(value ?? ''))}</td>`;
              }
            });
          }
          html += '</tr>';
        });
      }
      html += '</tbody></table>';

      if (needsResponsive) html += '</div>';

      // Footer with record count
      if (data.length > 0) {
        html += `<div class="wc-table-footer">${data.length} record${data.length !== 1 ? 's' : ''}</div>`;
      }

      this.componentElement.innerHTML = html;
      this._wireTableEvents();
      // Reconcile live run-status streams against the freshly-rendered cells (innerHTML replaced
      // the old nodes): rebind ongoing runs to their new cell, open new ones, close vanished ones.
      this._reconcileRunStreams();
    }

    _getSortedData() {
      if (!this._sortField) return [...this._data];
      const field = this._sortField;
      const dir = this._sortDir === 'desc' ? -1 : 1;
      return [...this._data].sort((a, b) => {
        const va = this._getNestedValue(a, field);
        const vb = this._getNestedValue(b, field);
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb)) * dir;
      });
    }

    _getNestedValue(obj, path) {
      if (!path) return '';
      return path.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : '', obj);
    }

    _formatValue(value, format) {
      if (value == null || value === '') return '';
      if (format === 'currency') {
        const num = parseFloat(value);
        return isNaN(num) ? value : `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
      if (format === 'date') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleDateString();
      }
      if (format === 'datetime') {
        const d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleString();
      }
      if (format === 'number') {
        const num = parseFloat(value);
        return isNaN(num) ? value : num.toLocaleString();
      }
      if (format === 'boolean') {
        return value ? 'Yes' : 'No';
      }
      // Handle ObjectId
      if (typeof value === 'object') {
        if (value.$oid) return value.$oid;
        if (value.$date) return new Date(value.$date).toLocaleString();
        return JSON.stringify(value);
      }
      return this._escapeHtml(String(value));
    }

    _escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    // Escape for an HTML attribute value (double-quoted context).
    _escapeAttr(str) {
      return String(str ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // Decide how a cell renders: formatter > type="html" > legacy escaped/format text.
    // NOTE: sorting always uses the RAW field value (_getSortedData), never this output.
    _renderCell(value, col, row) {
      if (col.formatter) {
        if (col.type === 'html') {
          console.warn(`[wc-table-col] field "${col.field}": both type="html" and formatter set — formatter wins.`);
        }
        return this._applyFormatter(col.formatter, value, col, row);
      }
      if (col.type === 'html') {
        // Trusted markup — caller owns escaping of any interpolated user data.
        return value == null ? '' : String(value);
      }
      return this._formatValue(value, col.format);
    }

    // Built-in formatters return an HTML string and ESCAPE their own text content
    // (so they're XSS-safe even on untrusted values). Mirrors wc-tabulator's formatters.
    _applyFormatter(name, value, col, row) {
      switch (name) {
        case 'badge': {
          if (value == null || value === '') return '';
          const variant = this._safeBadgeVariant((col.formatterMap && col.formatterMap[value]) || 'muted');
          return `<span class="badge badge-${variant}">${this._escapeHtml(String(value))}</span>`;
        }
        case 'link': {
          if (value == null || value === '') return '';
          const href = this._resolveTokens(col.formatterHref || '#', row);
          return `<a href="${this._escapeAttr(href)}">${this._escapeHtml(String(value))}</a>`;
        }
        case 'datetime':
          return this._formatDateTime(value, col.formatterFormat);
        case 'run-status':
          return this._renderRunStatus(value, col, row);
        default:
          console.warn(`[wc-table] unknown formatter "${name}" — rendering as text.`);
          return this._escapeHtml(String(value ?? ''));
      }
    }

    _safeBadgeVariant(v) {
      const s = String(v).toLowerCase();
      return /^[a-z0-9-]+$/.test(s) ? s : 'muted';
    }

    // Replace {field} tokens in a href template with URL-encoded row values.
    _resolveTokens(tpl, row) {
      return String(tpl).replace(/\{([^}]+)\}/g, (m, key) => {
        const v = this._getNestedValue(row, key.trim());
        return v == null || v === '' ? '' : encodeURIComponent(String(v));
      });
    }

    // datetime formatter — luxon-style preset NAMES (consistent with wc-tabulator) mapped to
    // Intl.DateTimeFormat options, so wc-table stays dependency-free.
    _formatDateTime(value, fmt) {
      if (value == null || value === '') return '';
      const raw = (value && typeof value === 'object' && value.$date) ? value.$date : value;
      const d = new Date(raw);
      if (isNaN(d.getTime())) return this._escapeHtml(String(value));
      const PRESETS = {
        DATE_SHORT: { year: 'numeric', month: 'numeric', day: 'numeric' },
        DATE_MED: { year: 'numeric', month: 'short', day: 'numeric' },
        DATE_MED_WITH_WEEKDAY: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' },
        DATE_FULL: { year: 'numeric', month: 'long', day: 'numeric' },
        DATE_HUGE: { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' },
        DATETIME_SHORT: { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' },
        DATETIME_SHORT_WITH_SECONDS: { year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' },
        DATETIME_STANDARD: { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: true },
        DATETIME_MED: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' },
        DATETIME_MED_WITH_SECONDS: { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric' },
        DATETIME_MED_WITH_WEEKDAY: { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' },
        DATETIME_FULL: { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric' }
      };
      const opts = PRESETS[fmt] || PRESETS.DATETIME_MED;
      return this._escapeHtml(d.toLocaleString(undefined, opts));
    }

    // ---- run-status formatter: live SSE cell -------------------------------------------------
    // Renders a spinner + streaming step text for an ACTIVE (running) row, or the same resting
    // badge as formatter="badge" otherwise. The cell markup carries data-* the reconciler reads
    // after innerHTML is set. The stream lifecycle is owned by _reconcileRunStreams (below).

    _tokensResolve(tpl, row) {
      const tokens = String(tpl || '').match(/\{[^}]+\}/g) || [];
      if (!tokens.length) return false;
      return tokens.every(tok => {
        const v = this._getNestedValue(row, tok.slice(1, -1).trim());
        return v != null && v !== '';
      });
    }

    _runStatusRunId(col, row) {
      const m = String(col.formatterEventsUrl || '').match(/\{([^}]+)\}/);
      if (m) {
        const v = this._getNestedValue(row, m[1].trim());
        if (v != null && v !== '') return String(v);
      }
      return this._resolveTokens(col.formatterEventsUrl || '', row);
    }

    _renderRunStatus(value, col, row) {
      const activeField = col.formatterActiveField;
      const active = activeField
        ? !!this._getNestedValue(row, activeField)
        : (String(value) === 'running' && this._tokensResolve(col.formatterEventsUrl, row));

      if (!active) {
        // Resting cell — byte-identical to formatter="badge".
        return this._applyFormatter('badge', value, col, row);
      }

      const url = this._resolveTokens(col.formatterEventsUrl || '', row);
      const runId = this._runStatusRunId(col, row);
      const liveField = col.formatterLiveField || 'status';
      const doneField = col.formatterDoneWhen || '';
      const variant = this._safeBadgeVariant((col.formatterMap && col.formatterMap[value]) || 'info');
      const initial = (value != null && value !== '' && String(value) !== 'running') ? String(value) : 'Starting…';
      if (runId) this._runStatusRows[runId] = row;

      return `<span class="badge badge-${variant} inline-flex items-center gap-2" data-run-status`
        + ` data-events-url="${this._escapeAttr(url)}" data-run-id="${this._escapeAttr(runId)}"`
        + ` data-live-field="${this._escapeAttr(liveField)}" data-done-field="${this._escapeAttr(doneField)}">`
        + `<wc-fa-icon name="spinner" icon-style="solid" size="1rem" spin></wc-fa-icon>`
        + `<span data-run-status-text>${this._escapeHtml(initial)}</span></span>`;
    }

    // Reconcile open streams against the current run-status cells (called after every render).
    _reconcileRunStreams() {
      const cells = this.componentElement.querySelectorAll('[data-run-status]');
      const activeNow = new Map();
      cells.forEach(cell => { const id = cell.dataset.runId; if (id) activeNow.set(id, cell); });

      // Close streams for runs no longer shown as active (removed row / items re-set / went resting).
      for (const runId of Array.from(this._runStreams.keys())) {
        if (!activeNow.has(runId)) this._closeRunStream(runId);
      }
      // Forget completed markers once the run is no longer displayed active.
      for (const runId of Array.from(this._completedRuns)) {
        if (!activeNow.has(runId)) this._completedRuns.delete(runId);
      }

      activeNow.forEach((cell, runId) => {
        if (this._completedRuns.has(runId)) {
          // Already terminated but the host hasn't re-set the row yet — don't reopen; stop spinning.
          const icon = cell.querySelector('wc-fa-icon');
          if (icon) icon.removeAttribute('spin');
          return;
        }
        const existing = this._runStreams.get(runId);
        if (existing) {
          existing.cellEl = cell; // innerHTML recreated the node — rebind so live text targets it
        } else {
          this._openRunStream(runId, cell);
        }
      });
    }

    _openRunStream(runId, cell) {
      const url = cell.dataset.eventsUrl;
      if (!url || typeof EventSource === 'undefined') return;
      let es;
      try { es = new EventSource(url); }
      catch (ex) { console.warn('[wc-table] run-status: EventSource failed', ex); return; }
      const stream = {
        es, cellEl: cell, runId, url, gotData: false, done: false, retries: 0,
        liveField: cell.dataset.liveField || 'status', doneField: cell.dataset.doneField || ''
      };
      this._runStreams.set(runId, stream);
      es.onmessage = (e) => this._onRunMessage(runId, e);
      es.onerror = () => this._onRunError(runId);
    }

    _onRunMessage(runId, e) {
      const stream = this._runStreams.get(runId);
      if (!stream || stream.done) return;
      let msg;
      try { msg = JSON.parse(e.data); } catch (ex) { return; }
      stream.gotData = true;
      stream.retries = 0;
      const live = msg[stream.liveField];
      if (live != null) {
        const t = stream.cellEl && stream.cellEl.querySelector('[data-run-status-text]');
        if (t) t.textContent = String(live); // text only — never inject HTML from the stream
      }
      if (stream.doneField && msg[stream.doneField]) this._terminateRun(runId);
    }

    _onRunError(runId) {
      const stream = this._runStreams.get(runId);
      if (!stream || stream.done) return;
      if (stream.gotData) {
        // Errored/closed after receiving data → treat as terminal.
        this._terminateRun(runId);
        return;
      }
      // Errored before any data → EventSource auto-reconnects; bound the attempts, then give up.
      stream.retries = (stream.retries || 0) + 1;
      if (stream.retries > 5) this._closeRunStream(runId);
    }

    _terminateRun(runId) {
      const stream = this._runStreams.get(runId);
      if (!stream || stream.done) return;
      stream.done = true;
      this._completedRuns.add(runId);
      const icon = stream.cellEl && stream.cellEl.querySelector('wc-fa-icon');
      if (icon) icon.removeAttribute('spin');
      const row = this._runStatusRows ? (this._runStatusRows[runId] || null) : null;
      // Exactly one complete event per run. Host uses it to refresh the authoritative verdict.
      this._emitEvent('wcrunstatuscomplete', 'wc-run-status:complete', {
        bubbles: true, composed: true, detail: { runId, row }
      });
      this._closeRunStream(runId);
    }

    _closeRunStream(runId) {
      const stream = this._runStreams.get(runId);
      if (stream) {
        try { stream.es.close(); } catch (ex) { /* noop */ }
        this._runStreams.delete(runId);
      }
    }

    _closeAllRunStreams() {
      if (!this._runStreams) return;
      for (const runId of Array.from(this._runStreams.keys())) this._closeRunStream(runId);
      if (this._completedRuns) this._completedRuns.clear();
    }

    _wireTableEvents() {
      const table = this.componentElement.querySelector('table');
      if (!table) return;

      // Sort click
      table.querySelectorAll('th.wc-sortable').forEach(th => {
        th.addEventListener('click', () => {
          const field = th.dataset.field;
          if (this._sortField === field) {
            this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
          } else {
            this._sortField = field;
            this._sortDir = 'asc';
          }
          this._emitEvent('wctablesort', 'table:sort', {
            bubbles: true,
            detail: { field: this._sortField, direction: this._sortDir }
          });
          this._renderTable();
        });
      });

      // Row click
      table.querySelectorAll('tbody tr[data-row-index]').forEach(tr => {
        tr.addEventListener('click', () => {
          const idx = parseInt(tr.dataset.rowIndex);
          const data = this._getSortedData()[idx];
          this._emitEvent('wctablerowclick', 'table:row-click', {
            bubbles: true,
            detail: { row: tr, index: idx, data }
          });
        });

        tr.addEventListener('dblclick', () => {
          const idx = parseInt(tr.dataset.rowIndex);
          const data = this._getSortedData()[idx];
          this._emitEvent('wctablerowdblclick', 'table:row-dblclick', {
            bubbles: true,
            detail: { row: tr, index: idx, data }
          });
        });
      });
    }

    async _handleAttributeChange(attrName, newValue) {
      if (attrName === 'url' && newValue) {
        await this._fetchData(newValue);
      } else if (attrName === 'items' && newValue) {
        try {
          this._data = JSON.parse(newValue);
        } catch (e) {
          this._data = [];
        }
        this._renderTable();
      } else if (['striped', 'hoverable', 'bordered', 'borderless', 'size', 'clickable'].includes(attrName)) {
        this._renderTable();
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    // Public API
    get data() { return this._data; }

    set data(val) {
      this._data = Array.isArray(val) ? val : [];
      this._renderTable();
    }

    refresh() {
      const url = this.getAttribute('url');
      if (url) this._fetchData(url);
      else this._renderTable();
    }

    _applyStyle() {
      const style = `
        wc-table { display: contents; }
        .wc-table-container { display: flex; flex-direction: column; }
        .wc-table-footer {
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          color: var(--text-6, #888);
          border-top: 1px solid var(--component-border-color);
          background: var(--surface-2);
        }
        .wc-table-fixed-header thead th {
          position: sticky;
          top: 0;
          z-index: 1;
          background: var(--primary-bg-color);
        }
      `;
      this.loadStyle('wc-table-component-style', style);
    }
  }

  customElements.define('wc-table', WcTable);
}
