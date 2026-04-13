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
    }

    _render() {
      super._render();
    }

    _parseColumns() {
      const cols = this.querySelectorAll('wc-table-col');
      this._columns = Array.from(cols).map(col => {
        // Handle case where wc-table-col isn't upgraded yet
        if (typeof col.config === 'object') return col.config;
        return {
          field: col.getAttribute('field') || '',
          label: col.getAttribute('label') || col.getAttribute('field') || '',
          sortable: col.hasAttribute('sortable'),
          align: col.getAttribute('align') || 'left',
          width: col.getAttribute('width') || '',
          format: col.getAttribute('format') || '',
          css: col.getAttribute('class') || ''
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
              const formatted = this._formatValue(value, col.format);
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
