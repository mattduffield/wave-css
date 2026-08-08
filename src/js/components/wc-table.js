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
              'paginate', 'searchable', 'search-placeholder', 'row-numbers', 'enhance',
              'search-input', 'filter-attr', 'filter-input', 'filter-value',
              'column-widths', 'fixed-columns', 'layout',
              'sync-url', 'url-key', 'url-history'];
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
      this._filterValue = '';      // active attr-filter value (filter-attr predicate; '' = off)
      this._extSearchEl = null;    // bound external search input (search-input selector)
      this._extSearchHandler = null;
      this._extFilterEl = null;    // bound external filter control (filter-input selector)
      this._extFilterHandler = null;
      this._colgroupEl = null;     // pinned-width <colgroup> (enhance + paginate/fixed-columns)
      this._resizeObs = null;      // recompute pinned widths on container resize
      this._resizeTimer = null;
      this._pinning = false;       // re-entrancy guard for width measurement
      this._restoringUrl = false;  // guard: don't write the URL while restoring from it
      this._popBound = false;
      this._onPopState = this._handlePopState.bind(this);
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

      // Bind external search/filter inputs (they live outside this element and survive swaps).
      this._seedFilters();
      this._bindExternalSearch();
      this._bindExternalFilter();
      this._restoreFromUrl();   // URL state wins over external-input seeds on load
      this._setupUrlSync();

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
      this._unbindExternalSearch();
      this._unbindExternalFilter();
      if (this._resizeObs) { this._resizeObs.disconnect(); this._resizeObs = null; }
      clearTimeout(this._resizeTimer);
      this._teardownUrlSync();
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
    get searchInputSel() { return this.getAttribute('search-input') || ''; }
    get filterAttr() { return this.getAttribute('filter-attr') || ''; }
    get filterInputSel() { return this.getAttribute('filter-input') || ''; }

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
      // No internal box when searching is driven by an external input.
      if (!this.searchable || this.searchInputSel) return '';
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
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => this.setSearch(input.value), 200);
      });
    }

    // ---- External search / filter binding (both modes) ----------------------

    _seedFilters() {
      const fv = this.getAttribute('filter-value');
      if (fv != null && fv !== '') this._filterValue = String(fv).trim();
    }

    // Public: drive the search from anywhere (equivalent to typing in the box).
    setSearch(query) {
      this._searchRaw = query == null ? '' : String(query);
      this._query = this._searchRaw.trim().toLowerCase();
      this._currentPage = 0;
      if (this._initialized) this._rerenderView();
      this._emitEvent('wctablefilter', 'wc-table:filter', {
        bubbles: true, detail: { query: this._query }
      });
      this._writeUrlState();
    }

    // Public: set the attr-filter value (filter-attr predicate). '' clears it.
    setFilter(value) {
      this._filterValue = value == null ? '' : String(value).trim();
      this._currentPage = 0;
      if (this._initialized) this._rerenderView();
      this._writeUrlState();
    }

    _rerenderView() {
      // Filter changed → recompute pinned widths over the new matching set (NOT on paging).
      if (this._enhanceMode) { this._pinColumnWidths(); this._applyEnhanceView(); }
      else this._renderBody();
    }

    // Resolve + bind the external search input named by `search-input`. Re-resolvable on
    // (re)connect so it survives an htmx swap that replaces this <wc-table> (the external
    // input lives OUTSIDE the swapped region). Seeds the current value; no internal box.
    _bindExternalSearch() {
      const sel = this.searchInputSel;
      if (!sel) return;
      const input = document.querySelector(sel);
      if (!input) return;
      if (input === this._extSearchEl) return; // already bound to this node
      this._unbindExternalSearch();
      this._extSearchEl = input;
      this._extSearchHandler = () => {
        clearTimeout(this._searchTimer);
        this._searchTimer = setTimeout(() => this.setSearch(input.value), 200);
      };
      input.addEventListener('input', this._extSearchHandler);
      input.addEventListener('search', this._extSearchHandler); // native clear (×) on type=search
      // Seed from the input's current value (no render here — the caller renders next).
      this._searchRaw = input.value || '';
      this._query = this._searchRaw.trim().toLowerCase();
    }

    _unbindExternalSearch() {
      if (this._extSearchEl && this._extSearchHandler) {
        this._extSearchEl.removeEventListener('input', this._extSearchHandler);
        this._extSearchEl.removeEventListener('search', this._extSearchHandler);
      }
      this._extSearchEl = null;
      this._extSearchHandler = null;
    }

    // Bind an external control (e.g. a <select>) named by `filter-input` to the attr-filter.
    _bindExternalFilter() {
      const sel = this.filterInputSel;
      if (!sel) return;
      const el = document.querySelector(sel);
      if (!el) return;
      if (el === this._extFilterEl) return;
      this._unbindExternalFilter();
      this._extFilterEl = el;
      this._extFilterHandler = () => this.setFilter(el.value);
      el.addEventListener('change', this._extFilterHandler);
      el.addEventListener('input', this._extFilterHandler);
      if (el.value != null && el.value !== '') this._filterValue = String(el.value).trim();
    }

    _unbindExternalFilter() {
      if (this._extFilterEl && this._extFilterHandler) {
        this._extFilterEl.removeEventListener('change', this._extFilterHandler);
        this._extFilterEl.removeEventListener('input', this._extFilterHandler);
      }
      this._extFilterEl = null;
      this._extFilterHandler = null;
    }

    // Does a row pass the attr-filter? Row attr value is a whitespace token list
    // (e.g. data-event="<id> <id>"); empty filter value = pass.
    _attrFilterPass(tokenStr) {
      if (!this._filterValue || !this.filterAttr) return true;
      const tokens = String(tokenStr || '').split(/\s+/).filter(Boolean);
      return tokens.includes(this._filterValue) || String(tokenStr || '').trim() === this._filterValue;
    }

    // ---- URL state sync (sync-url) ------------------------------------------

    get syncUrl() { return this.hasAttribute('sync-url'); }
    get urlKey() { return this.getAttribute('url-key') || ''; }
    get urlHistoryPush() { return (this.getAttribute('url-history') || '').toLowerCase() === 'push'; }
    _urlParam(name) { return this.urlKey ? `${this.urlKey}_${name}` : name; }

    // Sort as a URL token: "col:dir" (col = sort field / th label, lowercased) or '' (default).
    _currentSortToken() {
      if (this._enhanceMode) {
        if (this._sortTh && this._sortDir) return `${this._sortTh.textContent.trim().toLowerCase()}:${this._sortDir}`;
        return '';
      }
      if (this._sortField && this._sortDir) return `${this._sortField}:${this._sortDir}`;
      return '';
    }

    _setupUrlSync() {
      if (!this.syncUrl || this._popBound) return;
      this._popBound = true;
      window.addEventListener('popstate', this._onPopState);
    }
    _teardownUrlSync() {
      if (this._popBound) { window.removeEventListener('popstate', this._onPopState); this._popBound = false; }
    }

    // Write current state to the query string. Only touches this table's own params
    // (namespaced by url-key); a value at its DEFAULT is removed entirely (clean URL).
    _writeUrlState() {
      if (!this.syncUrl || this._restoringUrl || !this._initialized) return;
      const params = new URLSearchParams(window.location.search);
      const put = (name, val, def) => {
        const key = this._urlParam(name);
        if (val == null || val === '' || val === def) params.delete(key);
        else params.set(key, val);
      };
      put('page', String(this._currentPage + 1), '1');
      put('q', this._query, '');
      put('filter', this._filterValue, '');
      put('sort', this._currentSortToken(), '');
      const qs = params.toString();
      const url = window.location.pathname + (qs ? '?' + qs : '') + window.location.hash;
      try { history[this.urlHistoryPush ? 'pushState' : 'replaceState'](history.state, '', url); }
      catch (e) { /* history unavailable (sandbox) — no-op */ }
    }

    _readUrlState() {
      const params = new URLSearchParams(window.location.search);
      const get = (name) => params.get(this._urlParam(name));
      return {
        page: Math.max(1, parseInt(get('page'), 10) || 1),
        q: get('q') || '',
        filter: get('filter') || '',
        sort: get('sort') || ''
      };
    }

    // Apply parsed state to the component (no URL write). Reflects search/filter into the
    // bound external inputs (and the internal search box) so restore is two-way.
    _applyUrlState(state) {
      this._restoringUrl = true;
      try {
        this._query = (state.q || '').trim().toLowerCase();
        this._searchRaw = state.q || '';
        this._filterValue = (state.filter || '').trim();
        this._currentPage = Math.max(0, state.page - 1);
        if (this._extSearchEl) this._extSearchEl.value = state.q || '';
        if (this._extFilterEl) this._extFilterEl.value = state.filter || '';
        if (this._searchEl) this._searchEl.value = state.q || '';
        const internal = this.componentElement && this.componentElement.querySelector('.wc-table-search');
        if (internal) internal.value = state.q || '';
        if (this._enhanceMode) this._applySortTokenEnhance(state.sort);
        else this._applySortTokenData(state.sort);
      } finally { this._restoringUrl = false; }
    }

    _applySortTokenData(token) {
      if (!token) { this._sortField = ''; this._sortDir = ''; return; }
      const i = token.lastIndexOf(':');
      const field = i >= 0 ? token.slice(0, i) : token;
      const dir = i >= 0 ? token.slice(i + 1) : 'asc';
      this._sortField = field;
      this._sortDir = dir === 'desc' ? 'desc' : 'asc';
    }

    _applySortTokenEnhance(token) {
      if (this._theadRow) this._theadRow.querySelectorAll('th').forEach(c => c.classList.remove('wc-sort-asc', 'wc-sort-desc'));
      this._sortTh = null; this._sortDir = '';
      if (!token || !this._theadRow) return;
      const i = token.lastIndexOf(':');
      const name = (i >= 0 ? token.slice(0, i) : token).toLowerCase();
      const dir = (i >= 0 ? token.slice(i + 1) : 'asc') === 'desc' ? 'desc' : 'asc';
      const th = Array.from(this._theadRow.children).find(c =>
        c.classList.contains('wc-sortable') && c.textContent.trim().toLowerCase() === name);
      if (th) this._enhanceSortApply(th, dir);
    }

    _restoreFromUrl() {
      if (!this.syncUrl) return;
      this._applyUrlState(this._readUrlState());
    }

    _handlePopState() {
      if (!this.syncUrl) return;
      this._applyUrlState(this._readUrlState());
      if (this._enhanceMode) { this._pinColumnWidths(); this._applyEnhanceView(); }
      else this._renderBody();
    }

    // Public: jump to a page (1-based). Alongside setSearch/setFilter.
    goToPage(n) { this._goToPage(n); }

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
      // Hand the freshly-created DOM back to HTMX so `hx-*` on cell content (row action links,
      // drill-in <a hx-get>) is activated — innerHTML bypasses HTMX's normal processing.
      this._htmxProcess(this._renderRegion);
      // Reconcile live run-status streams against the freshly-rendered cells (innerHTML replaced
      // the old nodes): rebind ongoing runs to their new cell, open new ones, close vanished ones.
      this._reconcileRunStreams();
    }

    // Re-process a freshly-rendered subtree with HTMX (no-op when HTMX isn't loaded).
    _htmxProcess(el) {
      if (el && typeof htmx !== 'undefined' && typeof htmx.process === 'function') {
        try { htmx.process(el); } catch (e) { /* defensive: never let HTMX processing break render */ }
      }
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
      const attrOn = !!(this._filterValue && this.filterAttr);
      if (!q && !attrOn) return [...this._data];
      // In data mode the filter-attr maps to a row field (leading "data-" stripped).
      const field = attrOn ? this.filterAttr.replace(/^data-/, '') : '';
      const filterable = this._columns.filter(c => c.filterable);
      const cols = filterable.length ? filterable : this._columns;
      return this._data.filter(row => {
        if (attrOn && !this._attrFilterPass(this._stringifyVal(this._getNestedValue(row, field)))) return false;
        if (!q) return true;
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
        + `<span class="wc-table-summary text-2">${this._padNum(from, total)}–${this._padNum(to, total)} of ${total}</span>`
        + `</div>`;
    }

    // Pad a number to the digit-width of `total` with FIGURE SPACE (U+2007 = digit width under
    // tabular-nums), so the summary text is a CONSTANT width across pages — otherwise its grid
    // track (auto) would resize and shift Next/jump. e.g. "1–1 of 13" → " 1– 1 of 13".
    _padNum(n, total) {
      const w = String(Math.max(0, total)).length;
      const s = String(n);
      return String.fromCharCode(0x2007).repeat(Math.max(0, w - s.length)) + s;
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
      this._writeUrlState();
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
          this._writeUrlState();
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
      this._seedFilters();
      this._bindExternalSearch();
      this._bindExternalFilter();
      this._restoreFromUrl();        // URL state wins over external-input seeds on load
      this._setupUrlSync();
      this._applyEnhanceView();
      this._pinColumnWidths();       // pin column widths so paging can't reflow them
      this._setupResizeObserver();
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
      if (this.searchable && !this.searchInputSel && !this._searchEl) {
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
          this._searchTimer = setTimeout(() => this.setSearch(input.value), 200);
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

    // Pure reorder + header classes for an explicit direction (no emit/render/url) — shared
    // by the click handler and URL restore.
    _enhanceSortApply(th, dir) {
      const cells = Array.from(this._theadRow.children);
      const colIndex = cells.indexOf(th);
      if (colIndex < 0) return;
      const type = (th.dataset.type || '').toLowerCase();
      const mul = dir === 'desc' ? -1 : 1;
      const cellVal = (tr) => {
        const td = tr.children[colIndex];
        if (!td) return '';
        return (td.dataset && td.dataset.sort != null) ? td.dataset.sort : td.textContent.trim();
      };
      this._allRows = this._allRows.slice().sort((a, b) => {
        const va = cellVal(a), vb = cellVal(b);
        if (type === 'num') { const na = parseFloat(va), nb = parseFloat(vb); return ((isNaN(na) ? 0 : na) - (isNaN(nb) ? 0 : nb)) * mul; }
        if (type === 'date') { const da = Date.parse(va), db = Date.parse(vb); return ((isNaN(da) ? 0 : da) - (isNaN(db) ? 0 : db)) * mul; }
        return String(va).localeCompare(String(vb)) * mul;
      });
      cells.forEach(c => c.classList.remove('wc-sort-asc', 'wc-sort-desc'));
      th.classList.add(dir === 'asc' ? 'wc-sort-asc' : 'wc-sort-desc');
      this._sortTh = th;
      this._sortDir = dir;
    }

    _enhanceSort(th) {
      const dir = (this._sortTh === th && this._sortDir === 'asc') ? 'desc' : 'asc';
      this._enhanceSortApply(th, dir);
      this._currentPage = 0;
      this._emitEvent('wctablesort', 'table:sort', {
        bubbles: true, detail: { field: th.textContent.trim(), direction: this._sortDir }
      });
      this._applyEnhanceView();
      this._writeUrlState();
    }

    _enhanceRowMatches(tr) {
      // Attr-filter (e.g. filter-attr="data-event") — a second axis beyond search.
      if (this._filterValue && this.filterAttr && !this._attrFilterPass(tr.getAttribute(this.filterAttr))) {
        return false;
      }
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

      // Re-activate HTMX on the authored cells (moved/re-attached during paging) + the pager chrome,
      // so `hx-*` drill-in links keep working on the initial render and every re-render.
      this._htmxProcess(this._table);
      this._htmxProcess(this._chromeEl);
    }

    _reinitEnhance() {
      // Re-apply row-number column + chrome, then re-render the view (attrs toggled at runtime).
      // this._allRows remains the authored model (paged-out rows are detached but retained there).
      this._ensureRowNumberColumn();
      this._wireEnhanceSort();
      this._buildEnhanceChrome();
      this._applyEnhanceView();
      this._pinColumnWidths();       // reflect paginate/fixed-columns toggles
      this._setupResizeObserver();
    }

    // ---- Stable column widths (enhance + paginate / fixed-columns) -----------
    // Paged tables default to table-layout:auto, so each page's differing cell content
    // recomputes column widths and the headers visibly jump on Prev/Next. We measure the
    // natural widths once over the full matching set, pin them via a generated <colgroup>,
    // and switch to table-layout:fixed — so paging/sorting only swap row content.

    _shouldPinColumns() {
      if (!this._enhanceMode || !this._table) return false;
      const layout = (this.getAttribute('layout') || '').toLowerCase();
      if (layout === 'auto') return false;                       // explicit opt-out
      if (this.getAttribute('fixed-columns') === 'false') return false;
      return this.paginate || this.hasAttribute('fixed-columns') || layout === 'fixed';
    }

    _removeColgroup() {
      const existing = this._table && this._table.querySelector(':scope > colgroup.wc-colgroup');
      if (existing) existing.remove();
      this._colgroupEl = null;
      if (this._table) this._table.style.tableLayout = '';
    }

    // Per-column author overrides: `column-widths="120px,,30%"` (aligned to header cells,
    // including the # column) or a `<th width>` / inline th width. '' = measure it.
    _columnWidthOverrides(headers) {
      const attr = this.getAttribute('column-widths');
      const list = attr ? attr.split(',').map(s => s.trim()) : [];
      return headers.map((th, i) => {
        if (list[i]) return list[i];
        const w = th.getAttribute('width') || th.style.width;
        return w || '';
      });
    }

    _pinColumnWidths() {
      if (this._pinning) return;
      if (!this._table || !this._theadRow) return;
      if (!this._shouldPinColumns()) { this._removeColgroup(); return; }
      const headers = Array.from(this._theadRow.children);
      if (!headers.length) return;
      this._pinning = true;
      try {
        // Clean auto layout for measurement.
        this._removeColgroup();
        this._table.style.tableLayout = 'auto';
        // Lay out ALL currently-matching rows so each column sizes to its widest content.
        const filtered = this._allRows.filter(tr => this._enhanceRowMatches(tr));
        const measureRows = filtered.length ? filtered : this._allRows;
        const backup = Array.from(this._tbody.children);   // current page slice
        this._tbody.replaceChildren(...measureRows);
        const widths = headers.map(th => Math.round(th.getBoundingClientRect().width)); // forces layout
        this._tbody.replaceChildren(...backup);            // restore page slice (no paint between)
        // Pin via <colgroup>, honoring author overrides, then switch to fixed layout.
        // IMPORTANT: a display:none column (responsive breakpoint hiding) is removed from the
        // rendered rows, so we must NOT emit a <col> slot for it — otherwise every column after
        // the hidden one shifts by one and content overlaps. Emit cols only for visible headers,
        // in order, so the colgroup matches the actual visible cell set 1:1.
        const overrides = this._columnWidthOverrides(headers);
        const cg = document.createElement('colgroup');
        cg.className = 'wc-colgroup';
        headers.forEach((th, i) => {
          const cs = window.getComputedStyle(th);
          if (cs.display === 'none') return; // hidden column: no slot in the colgroup
          const col = document.createElement('col');
          col.style.width = overrides[i] || (widths[i] ? widths[i] + 'px' : '');
          cg.appendChild(col);
        });
        this._table.insertBefore(cg, this._table.firstChild);
        this._table.style.tableLayout = 'fixed';
        this._colgroupEl = cg;
      } finally {
        this._pinning = false;
      }
    }

    _setupResizeObserver() {
      if (this._resizeObs || typeof ResizeObserver === 'undefined' || !this._table) return;
      if (!this._shouldPinColumns()) return;
      const target = this._table.parentElement || this._table;
      this._resizeObs = new ResizeObserver(() => {
        clearTimeout(this._resizeTimer);
        // Recompute on resize (so responsive show/hide redistributes) — debounced.
        this._resizeTimer = setTimeout(() => { this._pinColumnWidths(); this._applyEnhanceView(); }, 150);
      });
      this._resizeObs.observe(target);
    }

    async _handleAttributeChange(attrName, newValue) {
      // Ignore callbacks fired while pending attributes are applied during connect — the
      // initial render is done explicitly at the end of connectedCallback.
      if (!this._initialized) {
        if (attrName === 'class' || attrName === 'id') super._handleAttributeChange(attrName, newValue);
        return;
      }
      // URL-sync attrs are read live via getters; the popstate listener is set at connect.
      if (['sync-url', 'url-key', 'url-history'].includes(attrName)) { this._setupUrlSync(); return; }

      if (this._enhanceMode) {
        if (['striped', 'hoverable', 'bordered', 'borderless', 'size', 'clickable'].includes(attrName)) {
          this._enhanceApplyClasses();
        } else if (['paginate', 'page-size', 'row-numbers', 'searchable', 'search-placeholder',
                    'search-input', 'filter-attr', 'filter-input', 'filter-value'].includes(attrName)) {
          this._currentPage = 0;
          this._unbindExternalSearch();
          this._unbindExternalFilter();
          this._seedFilters();
          this._bindExternalSearch();
          this._bindExternalFilter();
          this._reinitEnhance();
        } else if (['column-widths', 'fixed-columns', 'layout'].includes(attrName)) {
          this._removeColgroup();
          this._pinColumnWidths();
          this._applyEnhanceView();
          this._setupResizeObserver();
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
      } else if (['paginate', 'searchable', 'search-placeholder', 'search-input'].includes(attrName)) {
        this._currentPage = 0;
        this._unbindExternalSearch();
        this._renderTable(); // rebuild toolbar (internal or none)
        this._bindExternalSearch();
      } else if (['filter-attr', 'filter-input', 'filter-value'].includes(attrName)) {
        this._currentPage = 0;
        this._unbindExternalFilter();
        this._seedFilters();
        this._bindExternalFilter();
        this._renderBody();
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

        /* Row-number (.wc-rownum) column styling lives in src/css/main.css (themed header +
           transparent striped/hover body, centered tabular numbers) — single source of truth. */

        /* Pager — CSS grid gives each region a fixed x-position independent of content width,
           so paging (digit count / ellipses changing) never slides Prev/Next/jump/summary. */
        .wc-table-pager {
          display: grid;
          grid-template-columns: auto 1fr auto auto auto; /* prev | pages | next | jump | summary */
          align-items: center;
          gap: 0.4rem 0.6rem;
          padding: 0.5rem 0.25rem;
          font-size: 0.85rem;
        }
        .wc-table-pager [data-page="prev"] { justify-self: start; }
        .wc-table-pager .wc-table-pages    { justify-self: center; } /* re-centers in the 1fr track */
        .wc-table-pager [data-page="next"] { justify-self: start; }
        .wc-table-pager .wc-table-jump     { justify-self: start; }
        .wc-table-pager .wc-table-summary  { justify-self: end; }    /* replaces margin-left:auto */
        .wc-table-pager .wc-table-pages { display: inline-flex; align-items: center; gap: 0.25rem; }
        /* Every pager button is accent-filled; route its text through the auto-contrast
           --wc-on-primary token (black/white by the accent's luminance) so it stays WCAG AA
           in every theme, light + dark. The generic --button-color flips per-theme and fails
           on the bright accent (dark themes) and on dark earth-tone accents (light themes). */
        .wc-table-pager .btn {
          --button-bg-color: var(--primary-bg-color);
          --button-color: var(--wc-on-primary, var(--primary-color));
          --button-hover-bg-color: color-mix(in oklab, var(--primary-bg-color) 88%, #000);
          --button-hover-color: var(--wc-on-primary, var(--primary-color));
        }
        /* Uniform page-button width + tabular digits so 1- vs 2-digit buttons don't jitter. */
        .wc-table-pager .wc-table-pages .btn {
          min-width: 2rem; text-align: center;
          font-variant-numeric: tabular-nums;
        }
        .wc-table-pager .btn.wc-page-active {
          background: var(--primary-bg-color); color: var(--wc-on-primary, var(--primary-color));
          font-weight: 600; pointer-events: none;
        }
        .wc-table-pager .wc-table-ellipsis {
          display: inline-flex; align-items: center; justify-content: center;
          min-width: 1rem; padding: 0 0.15rem; opacity: 0.7;
        }
        .wc-table-pager .wc-table-jump { display: inline-flex; align-items: center; gap: 0.35rem; white-space: nowrap; }
        .wc-table-pager .wc-table-jump-input {
          width: 3.5rem; padding: 0.25rem 0.4rem;
          border: 1px solid var(--component-border-color, var(--surface-4));
          border-radius: 0.375rem;
          background: var(--component-bg-color, var(--surface-1));
          color: var(--text-1);
          font-variant-numeric: tabular-nums;
        }
        .wc-table-pager .wc-table-summary { white-space: nowrap; font-variant-numeric: tabular-nums; }
        /* Narrow screens: collapse to two rows (prev pages next / jump . summary). */
        @media (max-width: 640px) {
          .wc-table-pager {
            grid-template-columns: auto 1fr auto;
            grid-template-areas: "prev pages next" "jump . summary";
            row-gap: 0.5rem;
          }
          .wc-table-pager [data-page="prev"] { grid-area: prev; }
          .wc-table-pager .wc-table-pages    { grid-area: pages; }
          .wc-table-pager [data-page="next"] { grid-area: next; }
          .wc-table-pager .wc-table-jump     { grid-area: jump; }
          .wc-table-pager .wc-table-summary  { grid-area: summary; }
        }
      `;
      this.loadStyle('wc-table-component-style', style);
    }
  }

  customElements.define('wc-table', WcTable);
}
