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
              'page-size', 'display-member',
              'paginate', 'searchable', 'search-placeholder', 'row-numbers', 'enhance'];
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
      this._currentPage = 0;       // 0-based
      this._query = '';            // active search filter (lowercased)
      this._pageRows = [];         // rows shown on the current page (data mode) — for row-click
      this._lastTotalPages = 1;
      this._enhanceMode = false;   // light-DOM enhance mode (authored <table>)
      this._searchTimer = null;
      this._initialized = false;   // gate: ignore attr callbacks until connectedCallback finishes
      this._searchRaw = '';        // untrimmed search box text (preserved across full re-render)
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

      // Enhance mode: an authored <table> child and no url/items → enhance those rows in place
      // (reorder / show-hide / prepend a number cell) so composite cell markup is preserved.
      if (this._detectEnhanceMode()) {
        this._enhanceMode = true;
        this._initEnhance();
        this._initialized = true;
        this._setReady();
        return;
      }

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
      this._initialized = true;
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
          filterable: col.hasAttribute('filterable'),
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
          formatterDoneWhen: col.getAttribute('formatter-done-when') || '',
          formatterEventName: col.getAttribute('formatter-event-name') || '',
          formatterLivePath: col.getAttribute('formatter-live-path') || ''
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

    // Feature getters
    get paginate() { return this.hasAttribute('paginate'); }
    get searchable() { return this.hasAttribute('searchable'); }
    get rowNumbers() { return this.hasAttribute('row-numbers'); }

    _pageSizeVal() {
      if (!this.paginate) return Infinity;
      const n = parseInt(this.getAttribute('page-size'), 10);
      return Number.isFinite(n) && n > 0 ? n : 10;
    }

    _buildTableClasses() {
      const classes = ['wc-table'];
      if (this.hasAttribute('striped')) classes.push('wc-table-striped');
      if (this.hasAttribute('hoverable')) classes.push('wc-table-hover');
      if (this.hasAttribute('bordered')) classes.push('wc-table-bordered');
      if (this.hasAttribute('borderless')) classes.push('wc-table-borderless');
      if (this.hasAttribute('clickable')) classes.push('wc-table-clickable');
      const size = this.getAttribute('size');
      if (size) classes.push(`wc-table-${size}`);
      if (this.hasAttribute('fixed-header')) classes.push('wc-table-fixed-header');
      return classes.join(' ');
    }

    // Full (re)build: a persistent search toolbar + a body region that re-renders on
    // filter/sort/page (so the search input keeps focus + caret while typing).
    _renderTable() {
      const toolbar = this._buildSearchToolbarHtml();
      this.componentElement.innerHTML = toolbar + '<div class="wc-table-render"></div>';
      this._renderRegion = this.componentElement.querySelector('.wc-table-render');
      this._wireSearch();
      this._renderBody();
    }

    _buildSearchToolbarHtml() {
      if (!this.searchable) return '';
      const ph = this._escapeAttr(this.getAttribute('search-placeholder') || 'Search…');
      const val = this._escapeAttr(this._searchRaw || '');
      return `<div class="wc-table-toolbar">`
        + `<input type="search" class="wc-table-search" placeholder="${ph}" aria-label="Search table" value="${val}">`
        + `</div>`;
    }

    _wireSearch() {
      const input = this.componentElement.querySelector('.wc-table-search');
      if (!input) return;
      input.addEventListener('input', () => {
        this._searchRaw = input.value;
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => {
          this._query = input.value.trim().toLowerCase();
          this._currentPage = 0;
          this._renderBody();
          this._emitEvent('wctablefilter', 'wc-table:filter', {
            bubbles: true, detail: { query: this._query }
          });
        }, 200);
      });
    }

    // Renders only the table + pager/footer region (keeps the toolbar/search input intact).
    _renderBody() {
      if (!this._renderRegion) { this._renderTable(); return; }
      // Reset the per-render run-status row map; _renderRunStatus repopulates it as cells build.
      this._runStatusRows = {};
      const emptyMessage = this.getAttribute('empty-message') || 'No data available';
      const classes = this._buildTableClasses();
      const rowNum = this.rowNumbers;

      const { pageRows, total, totalPages, start } = this._getViewData();
      this._pageRows = pageRows;
      this._lastTotalPages = totalPages;

      const colCount = (this._columns.length || 1) + (rowNum ? 1 : 0);
      const needsResponsive = this.hasAttribute('fixed-header');

      let html = '';
      if (needsResponsive) {
        const maxH = this.getAttribute('max-height') || '500px';
        html += `<div class="wc-table-responsive" style="max-height: ${maxH}; overflow-y: auto;">`;
      }
      html += `<table class="${classes}">`;

      // Header
      if (this._columns.length > 0) {
        html += '<thead><tr>';
        if (rowNum) html += '<th class="wc-rownum">#</th>';
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
      if (pageRows.length === 0) {
        html += `<tr class="wc-table-empty"><td colspan="${colCount}" style="text-align: center; padding: 2rem; color: var(--text-6);">${emptyMessage}</td></tr>`;
      } else {
        pageRows.forEach((row, idx) => {
          html += `<tr data-row-index="${idx}">`;
          if (rowNum) html += `<td class="wc-rownum">${start + idx + 1}</td>`;
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

      // Pager (when paginating) else a plain record-count footer.
      if (this.paginate && total > 0) {
        html += this._buildPagerHtml(total, totalPages, start, pageRows.length);
      } else if (total > 0) {
        html += `<div class="wc-table-footer">${total} record${total !== 1 ? 's' : ''}</div>`;
      }

      this._renderRegion.innerHTML = html;
      this._wireTableEvents();
      this._wirePager(this._renderRegion);
      // Reconcile live run-status streams against the freshly-rendered cells (innerHTML replaced
      // the old nodes): rebind ongoing runs to their new cell, open new ones, close vanished ones.
      this._reconcileRunStreams();
    }

    // filter → sort → paginate. Returns the current page's rows + paging metadata.
    _getViewData() {
      const filtered = this._sortRows(this._getFilteredData());
      const total = filtered.length;
      const size = this._pageSizeVal();
      const totalPages = Math.max(1, size === Infinity ? 1 : Math.ceil(total / size));
      if (this._currentPage >= totalPages) this._currentPage = totalPages - 1;
      if (this._currentPage < 0) this._currentPage = 0;
      const start = this.paginate ? this._currentPage * size : 0;
      const pageRows = this.paginate ? filtered.slice(start, start + size) : filtered;
      return { pageRows, total, totalPages, start };
    }

    _getFilteredData() {
      const q = this._query;
      if (!q) return [...this._data];
      const filterable = this._columns.filter(c => c.filterable);
      const cols = filterable.length ? filterable : this._columns;
      return this._data.filter(row => {
        let hay;
        if (cols.length) hay = cols.map(c => this._stringifyVal(this._getNestedValue(row, c.field))).join(' ');
        else hay = Object.keys(row).filter(k => !k.startsWith('_')).map(k => this._stringifyVal(row[k])).join(' ');
        return hay.toLowerCase().includes(q);
      });
    }

    _stringifyVal(v) {
      if (v == null) return '';
      if (typeof v === 'object') {
        if (v.$oid) return v.$oid;
        if (v.$date) { const d = new Date(v.$date); return isNaN(d.getTime()) ? '' : d.toISOString(); }
        try { return JSON.stringify(v); } catch (e) { return ''; }
      }
      return String(v);
    }

    _sortRows(rows) {
      if (!this._sortField) return rows;
      const field = this._sortField;
      const dir = this._sortDir === 'desc' ? -1 : 1;
      return [...rows].sort((a, b) => {
        const va = this._getNestedValue(a, field);
        const vb = this._getNestedValue(b, field);
        if (va == null && vb == null) return 0;
        if (va == null) return 1;
        if (vb == null) return -1;
        if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
        return String(va).localeCompare(String(vb)) * dir;
      });
    }

    // Backward-compat: the full sorted dataset (unfiltered/unpaged).
    _getSortedData() { return this._sortRows([...this._data]); }

    // ---- Pager (shared by both modes) ---------------------------------------
    _buildPagerHtml(total, totalPages, start, shown) {
      const page = this._currentPage + 1;
      const from = total === 0 ? 0 : start + 1;
      const to = start + shown;
      let btns = '';
      this._pageNumbers(page, totalPages).forEach(n => {
        if (n === '…') { btns += `<span class="wc-table-ellipsis text-2">…</span>`; return; }
        const active = n === page ? ' wc-page-active' : '';
        const cur = n === page ? ' aria-current="page"' : '';
        btns += `<button type="button" class="btn btn-sm${active}" data-page="${n}"${cur}>${n}</button>`;
      });
      return `<div class="wc-table-pager">`
        + `<button type="button" class="btn btn-sm" data-page="prev"${page <= 1 ? ' disabled' : ''}>« Prev</button>`
        + `<span class="wc-table-pages">${btns}</span>`
        + `<button type="button" class="btn btn-sm" data-page="next"${page >= totalPages ? ' disabled' : ''}>Next »</button>`
        + `<span class="wc-table-jump text-2">Go to page `
        + `<input type="number" class="wc-table-jump-input" min="1" max="${totalPages}" value="${page}" aria-label="Go to page"></span>`
        + `<span class="wc-table-summary text-2">${from}–${to} of ${total}</span>`
        + `</div>`;
    }

    // Windowed page list with ellipses: 1 … (cur-1) cur (cur+1) … total
    _pageNumbers(current, total) {
      const wanted = new Set([1, total, current - 1, current, current + 1]);
      const valid = [...wanted].filter(n => n >= 1 && n <= total).sort((a, b) => a - b);
      const out = [];
      let prev = 0;
      valid.forEach(n => { if (n - prev > 1) out.push('…'); out.push(n); prev = n; });
      return out;
    }

    _wirePager(scope) {
      const pager = scope.querySelector('.wc-table-pager');
      if (!pager) return;
      pager.querySelectorAll('button[data-page]').forEach(btn => {
        btn.addEventListener('click', () => {
          const v = btn.dataset.page;
          let target;
          if (v === 'prev') target = this._currentPage;        // 1-based prev
          else if (v === 'next') target = this._currentPage + 2; // 1-based next
          else target = parseInt(v, 10);
          this._goToPage(target);
        });
      });
      const jump = pager.querySelector('.wc-table-jump-input');
      if (jump) {
        const go = () => { const n = parseInt(jump.value, 10); if (Number.isFinite(n)) this._goToPage(n); };
        jump.addEventListener('change', go);
        jump.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } });
      }
    }

    _goToPage(n) {
      const totalPages = this._lastTotalPages || 1;
      const clamped = Math.min(Math.max(1, n | 0), totalPages);
      this._currentPage = clamped - 1;
      if (this._enhanceMode) this._applyEnhanceView();
      else this._renderBody();
      this._emitEvent('wctablepage', 'wc-table:page', {
        bubbles: true, detail: { page: clamped, totalPages: this._lastTotalPages }
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
      // Named SSE event to bind (default `message`). For the node-playwright run stream the frames
      // are `event: step_change` (no default message event) — set formatter-event-name="step_change".
      const eventName = col.formatterEventName || 'message';
      const isRunState = eventName === 'step_change';
      // Where the display text lives: a path (e.g. stack.-1.name) or a flat key (default `status`).
      // run-state (step_change) defaults to the last stack frame's name.
      const livePath = col.formatterLivePath || (isRunState ? 'stack.-1.name' : '');
      const liveField = col.formatterLiveField || 'status';
      // Terminal: `prop` (truthy) or `prop=value` (match). run-state defaults to `event=end`
      // (the socket may stay open with heartbeats after end, so never rely on close for terminal).
      const doneWhen = col.formatterDoneWhen || (isRunState ? 'event=end' : '');
      const variant = this._safeBadgeVariant((col.formatterMap && col.formatterMap[value]) || 'info');
      const initial = (value != null && value !== '' && String(value) !== 'running') ? String(value) : 'Starting…';
      if (runId) this._runStatusRows[runId] = row;

      return `<span class="badge badge-${variant} inline-flex items-center gap-2" data-run-status`
        + ` data-events-url="${this._escapeAttr(url)}" data-run-id="${this._escapeAttr(runId)}"`
        + ` data-event-name="${this._escapeAttr(eventName)}" data-live-path="${this._escapeAttr(livePath)}"`
        + ` data-live-field="${this._escapeAttr(liveField)}" data-done-when="${this._escapeAttr(doneWhen)}">`
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
      const eventName = cell.dataset.eventName || 'message';
      const stream = {
        es, cellEl: cell, runId, url, gotData: false, done: false, retries: 0,
        eventName,
        livePath: cell.dataset.livePath || '',
        liveField: cell.dataset.liveField || 'status',
        doneWhen: cell.dataset.doneWhen || ''
      };
      this._runStreams.set(runId, stream);
      // Bind the NAMED SSE event (the run stream emits `step_change`, not the default `message`
      // event — so es.onmessage would never fire). addEventListener('message') == onmessage.
      stream._onMsg = (e) => this._onRunMessage(runId, e);
      es.addEventListener(eventName, stream._onMsg);
      es.onerror = () => this._onRunError(runId);
    }

    _onRunMessage(runId, e) {
      const stream = this._runStreams.get(runId);
      if (!stream || stream.done) return;
      let msg;
      try { msg = JSON.parse(e.data); } catch (ex) { return; }
      stream.gotData = true;
      stream.retries = 0;
      // Display text: a path (e.g. stack.-1.name — empty stack ⇒ undefined ⇒ keep current) or flat key.
      const live = stream.livePath ? this._readRunPath(msg, stream.livePath) : msg[stream.liveField];
      if (live != null && live !== '') {
        const t = stream.cellEl && stream.cellEl.querySelector('[data-run-status-text]');
        if (t) t.textContent = String(live); // text only — never inject HTML from the stream
      }
      if (this._isRunTerminal(msg, stream.doneWhen)) this._terminateRun(runId);
    }

    _onRunError(runId) {
      const stream = this._runStreams.get(runId);
      if (!stream || stream.done) return;
      if (stream.gotData) {
        // A long-lived run-state stream (payload-driven terminal via done-when) survives transient
        // drops — let EventSource auto-reconnect. Only a flat stream with NO done-when treats
        // error/close-after-data as terminal.
        if (!stream.doneWhen) this._terminateRun(runId);
        return;
      }
      // Errored before any data → EventSource auto-reconnects; bound the attempts, then give up.
      stream.retries = (stream.retries || 0) + 1;
      if (stream.retries > 5) this._closeRunStream(runId);
    }

    // Read a dotted path with negative array indices, e.g. "stack.-1.name".
    _readRunPath(obj, path) {
      if (obj == null) return undefined;
      const parts = String(path).split('.');
      let cur = obj;
      for (let i = 0; i < parts.length; i++) {
        if (cur == null) return undefined;
        const p = parts[i];
        if (Array.isArray(cur)) {
          let idx = parseInt(p, 10);
          if (isNaN(idx)) return undefined;
          if (idx < 0) idx = cur.length + idx;
          cur = cur[idx];
        } else {
          cur = cur[p];
        }
      }
      return cur;
    }

    // Terminal detection: "prop" (truthy) or "prop=value" (match, e.g. event=end).
    _isRunTerminal(msg, doneWhen) {
      if (!doneWhen) return false;
      const eq = doneWhen.indexOf('=');
      if (eq >= 0) {
        const key = doneWhen.slice(0, eq).trim();
        const val = doneWhen.slice(eq + 1).trim();
        return String(this._readRunPath(msg, key)) === val;
      }
      return !!this._readRunPath(msg, doneWhen.trim());
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
      const region = this._renderRegion || this.componentElement;
      const table = region.querySelector('table');
      if (!table) return;

      // Sort click — re-render only the body region (keeps the search input focused).
      table.querySelectorAll('th.wc-sortable').forEach(th => {
        th.addEventListener('click', () => {
          const field = th.dataset.field;
          if (!field) return;
          if (this._sortField === field) {
            this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
          } else {
            this._sortField = field;
            this._sortDir = 'asc';
          }
          this._currentPage = 0;
          this._emitEvent('wctablesort', 'table:sort', {
            bubbles: true,
            detail: { field: this._sortField, direction: this._sortDir }
          });
          this._renderBody();
        });
      });

      // Row click — index is into the current page's rows.
      table.querySelectorAll('tbody tr[data-row-index]').forEach(tr => {
        tr.addEventListener('click', () => {
          const idx = parseInt(tr.dataset.rowIndex);
          const data = this._pageRows[idx];
          this._emitEvent('wctablerowclick', 'table:row-click', {
            bubbles: true,
            detail: { row: tr, index: idx, data }
          });
        });

        tr.addEventListener('dblclick', () => {
          const idx = parseInt(tr.dataset.rowIndex);
          const data = this._pageRows[idx];
          this._emitEvent('wctablerowdblclick', 'table:row-dblclick', {
            bubbles: true,
            detail: { row: tr, index: idx, data }
          });
        });
      });
    }

    // ---- Enhance mode (light-DOM authored <table>) --------------------------

    _detectEnhanceMode() {
      if (this.hasAttribute('url') || this.hasAttribute('items')) return false;
      // An authored <table> present (not our rendered one, which doesn't exist yet in data mode).
      return !!this.querySelector('table');
    }

    _initEnhance() {
      // Drop the empty auto-created container; we enhance the authored table in place.
      if (this.componentElement && this.componentElement.classList.contains('wc-table-container')
          && !this.componentElement.hasChildNodes()) {
        this.componentElement.remove();
      }
      this._table = this.querySelector('table');
      if (!this._table) return;
      if (!this._table.classList.contains('wc-table')) this._table.classList.add('wc-table');
      this._enhanceApplyClasses();
      this._tbody = this._table.querySelector('tbody') || this._table;
      this._theadRow = this._table.querySelector('thead tr');
      this._allRows = Array.from(this._tbody.querySelectorAll(':scope > tr'));
      this._ensureRowNumberColumn();
      this._buildEnhanceChrome();
      this._wireEnhanceSort();
      this._applyEnhanceView();
    }

    _enhanceApplyClasses() {
      if (!this._table) return;
      const map = { striped: 'wc-table-striped', hoverable: 'wc-table-hover',
        bordered: 'wc-table-bordered', borderless: 'wc-table-borderless', clickable: 'wc-table-clickable' };
      Object.entries(map).forEach(([attr, cls]) => { if (this.hasAttribute(attr)) this._table.classList.add(cls); });
      const size = this.getAttribute('size');
      if (size) this._table.classList.add(`wc-table-${size}`);
    }

    _ensureRowNumberColumn() {
      if (!this.rowNumbers || !this._theadRow) return;
      let th = this._theadRow.querySelector(':scope > th.wc-rownum');
      if (!th) {
        const first = this._theadRow.querySelector(':scope > th');
        if (first && first.textContent.trim() === '#') { first.classList.add('wc-rownum'); th = first; }
        else {
          th = document.createElement('th');
          th.className = 'wc-rownum';
          th.textContent = '#';
          this._theadRow.insertBefore(th, this._theadRow.firstChild);
        }
      }
      this._allRows.forEach(tr => {
        if (!tr.querySelector(':scope > td.wc-rownum')) {
          const td = document.createElement('td');
          td.className = 'wc-rownum';
          tr.insertBefore(td, tr.firstChild);
        }
      });
    }

    _buildEnhanceChrome() {
      if (this.searchable && !this._searchEl) {
        const wrap = document.createElement('div');
        wrap.className = 'wc-table-toolbar';
        const input = document.createElement('input');
        input.type = 'search';
        input.className = 'wc-table-search';
        input.placeholder = this.getAttribute('search-placeholder') || 'Search…';
        input.setAttribute('aria-label', 'Search table');
        wrap.appendChild(input);
        this._table.parentNode.insertBefore(wrap, this._table);
        this._searchEl = input;
        input.addEventListener('input', () => {
          clearTimeout(this._searchTimer);
          this._searchTimer = setTimeout(() => {
            this._query = input.value.trim().toLowerCase();
            this._currentPage = 0;
            this._applyEnhanceView();
            this._emitEvent('wctablefilter', 'wc-table:filter', {
              bubbles: true, detail: { query: this._query }
            });
          }, 200);
        });
      }
      if (!this._chromeEl) {
        const chrome = document.createElement('div');
        chrome.className = 'wc-table-chrome';
        if (this._table.nextSibling) this._table.parentNode.insertBefore(chrome, this._table.nextSibling);
        else this._table.parentNode.appendChild(chrome);
        this._chromeEl = chrome;
      }
    }

    _wireEnhanceSort() {
      if (!this._theadRow) return;
      this._theadRow.querySelectorAll('th').forEach(th => {
        const sortable = th.classList.contains('wc-sortable') || th.hasAttribute('data-sortable');
        if (!sortable || th.classList.contains('wc-rownum')) return;
        th.classList.add('wc-sortable');
        if (th._wcSortWired) return;
        th._wcSortWired = true;
        th.addEventListener('click', () => this._enhanceSort(th));
      });
    }

    _enhanceSort(th) {
      const cells = Array.from(this._theadRow.children);
      const colIndex = cells.indexOf(th);
      if (colIndex < 0) return;
      const type = (th.dataset.type || '').toLowerCase();
      if (this._sortTh === th) this._sortDir = this._sortDir === 'asc' ? 'desc' : 'asc';
      else { this._sortTh = th; this._sortDir = 'asc'; }
      const dir = this._sortDir === 'desc' ? -1 : 1;
      const cellVal = (tr) => {
        const td = tr.children[colIndex];
        if (!td) return '';
        return (td.dataset && td.dataset.sort != null) ? td.dataset.sort : td.textContent.trim();
      };
      this._allRows = this._allRows.slice().sort((a, b) => {
        const va = cellVal(a), vb = cellVal(b);
        if (type === 'num') { const na = parseFloat(va), nb = parseFloat(vb); return ((isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb)) * dir; }
        if (type === 'date') { const da = Date.parse(va), db = Date.parse(vb); return ((isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db)) * dir; }
        return String(va).localeCompare(String(vb)) * dir;
      });
      cells.forEach(c => c.classList.remove('wc-sort-asc', 'wc-sort-desc'));
      th.classList.add(this._sortDir === 'asc' ? 'wc-sort-asc' : 'wc-sort-desc');
      this._currentPage = 0;
      this._emitEvent('wctablesort', 'table:sort', {
        bubbles: true, detail: { field: th.textContent.trim(), direction: this._sortDir }
      });
      this._applyEnhanceView();
    }

    _enhanceRowMatches(tr) {
      if (!this._query) return true;
      const hay = (tr.dataset && tr.dataset.search != null) ? tr.dataset.search : tr.textContent;
      return hay.toLowerCase().includes(this._query);
    }

    _applyEnhanceView() {
      const filtered = this._allRows.filter(tr => this._enhanceRowMatches(tr));
      const total = filtered.length;
      const size = this._pageSizeVal();
      const totalPages = Math.max(1, this.paginate ? Math.ceil(total / size) : 1);
      if (this._currentPage >= totalPages) this._currentPage = totalPages - 1;
      if (this._currentPage < 0) this._currentPage = 0;
      const start = this.paginate ? this._currentPage * size : 0;
      const pageRows = this.paginate ? filtered.slice(start, start + size) : filtered;
      this._lastTotalPages = totalPages;
      this._pageRows = pageRows;

      // Rebuild tbody with ONLY the visible page's rows (keeps nth-child striping correct;
      // non-page rows are detached but retained in this._allRows). Composite markup untouched.
      const colCount = this._theadRow ? this._theadRow.children.length : 1;
      if (pageRows.length === 0) {
        const emptyMessage = this.getAttribute('empty-message') || 'No data available';
        const tr = document.createElement('tr');
        tr.className = 'wc-table-empty';
        const td = document.createElement('td');
        td.colSpan = colCount;
        td.style.cssText = 'text-align:center; padding:2rem; color: var(--text-6);';
        td.textContent = emptyMessage;
        tr.appendChild(td);
        this._tbody.replaceChildren(tr);
      } else {
        this._tbody.replaceChildren(...pageRows);
        if (this.rowNumbers) {
          pageRows.forEach((tr, i) => {
            const td = tr.querySelector(':scope > td.wc-rownum');
            if (td) td.textContent = String(start + i + 1);
          });
        }
      }

      if (this._chromeEl) {
        if (this.paginate && total > 0) this._chromeEl.innerHTML = this._buildPagerHtml(total, totalPages, start, pageRows.length);
        else if (total > 0) this._chromeEl.innerHTML = `<div class="wc-table-footer">${total} record${total !== 1 ? 's' : ''}</div>`;
        else this._chromeEl.innerHTML = '';
        this._wirePager(this._chromeEl);
      }
    }

    _reinitEnhance() {
      // Re-apply row-number column + chrome, then re-render the view (attrs toggled at runtime).
      // this._allRows remains the authored model (paged-out rows are detached but retained there).
      this._ensureRowNumberColumn();
      this._wireEnhanceSort();
      this._buildEnhanceChrome();
      this._applyEnhanceView();
    }

    async _handleAttributeChange(attrName, newValue) {
      // Ignore callbacks fired while pending attributes are applied during connect — the
      // initial render is done explicitly at the end of connectedCallback.
      if (!this._initialized) {
        if (attrName === 'class' || attrName === 'id') super._handleAttributeChange(attrName, newValue);
        return;
      }

      if (this._enhanceMode) {
        if (['striped', 'hoverable', 'bordered', 'borderless', 'size', 'clickable'].includes(attrName)) {
          this._enhanceApplyClasses();
        } else if (['paginate', 'page-size', 'row-numbers', 'searchable', 'search-placeholder'].includes(attrName)) {
          this._currentPage = 0;
          this._reinitEnhance();
        } else {
          super._handleAttributeChange(attrName, newValue);
        }
        return;
      }

      if (attrName === 'url' && newValue) {
        await this._fetchData(newValue);
      } else if (attrName === 'items' && newValue) {
        try { this._data = JSON.parse(newValue); } catch (e) { this._data = []; }
        this._currentPage = 0;
        this._renderTable();
      } else if (['paginate', 'searchable', 'search-placeholder'].includes(attrName)) {
        this._currentPage = 0;
        this._renderTable(); // rebuild toolbar + body
      } else if (['striped', 'hoverable', 'bordered', 'borderless', 'size', 'clickable', 'page-size', 'row-numbers'].includes(attrName)) {
        this._renderBody();
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    // Public API
    get data() { return this._data; }

    set data(val) {
      this._data = Array.isArray(val) ? val : [];
      this._currentPage = 0;
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

        /* Search toolbar */
        .wc-table-toolbar { display: flex; margin-bottom: 0.5rem; }
        .wc-table-search {
          width: 100%; max-width: 22rem;
          padding: 0.4rem 0.65rem;
          border: 1px solid var(--component-border-color, var(--surface-4));
          border-radius: 0.375rem;
          background: var(--component-bg-color, var(--surface-1));
          color: var(--text-1);
          font-size: 0.9rem;
        }
        .wc-table-search:focus {
          outline: none;
          border-color: var(--primary-bg-color, #3b82f6);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-bg-color, #3b82f6) 18%, transparent);
        }

        /* Row-number column */
        .wc-table th.wc-rownum, .wc-table td.wc-rownum {
          width: 1%; white-space: nowrap; text-align: right;
          color: var(--text-2, var(--text-1)); opacity: 0.75;
          font-variant-numeric: tabular-nums;
        }

        /* Pager */
        .wc-table-pager {
          display: flex; align-items: center; flex-wrap: wrap; gap: 0.4rem;
          padding: 0.5rem 0.25rem;
          font-size: 0.85rem;
        }
        .wc-table-pager .wc-table-pages { display: inline-flex; align-items: center; gap: 0.25rem; }
        .wc-table-pager .btn.wc-page-active {
          background: var(--primary-bg-color); color: var(--primary-color);
          font-weight: 600; pointer-events: none;
        }
        .wc-table-pager .wc-table-ellipsis { padding: 0 0.15rem; opacity: 0.7; }
        .wc-table-pager .wc-table-jump { display: inline-flex; align-items: center; gap: 0.35rem; }
        .wc-table-pager .wc-table-jump-input {
          width: 3.5rem; padding: 0.25rem 0.4rem;
          border: 1px solid var(--component-border-color, var(--surface-4));
          border-radius: 0.375rem;
          background: var(--component-bg-color, var(--surface-1));
          color: var(--text-1);
        }
        .wc-table-pager .wc-table-summary { margin-left: auto; }
      `;
      this.loadStyle('wc-table-component-style', style);
    }
  }

  customElements.define('wc-table', WcTable);
}
