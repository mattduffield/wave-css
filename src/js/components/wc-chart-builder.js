/**
 * Name: wc-chart-builder
 * Usage:
 *
 *   <wc-chart-builder
 *     data='[{"_id":"OR","count":42},{"_id":"WA","count":38}]'
 *     auto-detect>
 *   </wc-chart-builder>
 *
 *   <wc-chart-builder
 *     data='[...]'
 *     chart-type="line"
 *     label-field="month"
 *     value-fields="revenue,cost"
 *     show-controls="false"
 *     title="Revenue vs Cost">
 *   </wc-chart-builder>
 *
 *   <wc-chart-builder
 *     data='[{"total_users": 12847}]'
 *     chart-type="number"
 *     value-fields="total_users"
 *     title="Total Users">
 *   </wc-chart-builder>
 *
 * Renders interactive charts from arbitrary JSON data with auto-detection and
 * field picker UI. Wraps Chart.js directly.
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-chart-builder')) {

  const DEFAULT_PALETTE = [
    '#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4',
    '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#64748b',
    '#a855f7', '#10b981', '#eab308', '#e11d48', '#0ea5e9',
  ];

  const CHART_TYPES = ['bar', 'line', 'pie', 'doughnut', 'area', 'number'];

  const LABEL_PRIORITY = ['_id', 'name', 'label', 'category', 'status', 'state', 'type', 'month', 'year'];
  const VALUE_PRIORITY = ['count', 'total', 'sum', 'avg', 'amount', 'value', 'revenue', 'quantity'];

  class WcChartBuilder extends WcBaseComponent {
    static get is() { return 'wc-chart-builder'; }

    static get observedAttributes() {
      return ['id', 'class', 'data', 'auto-detect', 'chart-type', 'label-field',
              'value-fields', 'title', 'show-controls', 'height', 'colors'];
    }

    constructor() {
      super();
      this._data = [];
      this._fieldInfo = { labels: [], values: [], all: [] };
      this._chartType = 'bar';
      this._labelField = '';
      this._valueFields = [];
      this._chartInstance = null;
      this._canvas = null;
      this._isLibraryLoaded = false;

      const compEl = this.querySelector('.wc-chart-builder');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-chart-builder');
        this.appendChild(this.componentElement);
      }
      this._deferReady = true;
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      await this._loadChartLibrary();
      this._parseData();
      this._buildUI();
      this._renderChart();
      this._setReady();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._destroyChart();
    }

    async _handleAttributeChange(attrName, newValue) {
      if (attrName === 'data') {
        this._parseData();
        if (this._isLibraryLoaded) {
          this._buildUI();
          this._renderChart();
        }
      } else if (attrName === 'chart-type' || attrName === 'label-field' || attrName === 'value-fields') {
        if (this._isLibraryLoaded) {
          this._syncFromAttributes();
          this._renderChart();
        }
      } else if (attrName === 'title') {
        if (this._chartInstance) {
          this._renderChart();
        }
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _render() {
      super._render();
      // UI built in connectedCallback, not here
    }

    // ── Data property ─────────────────────────────────────────────────────────

    get data() {
      return this._data;
    }

    set data(value) {
      this._data = Array.isArray(value) ? value : [];
      this._analyzeFields();
      if (this.hasAttribute('auto-detect') || !this.getAttribute('chart-type')) {
        this._autoDetect();
      }
      this._syncFromAttributes();
      if (this._isLibraryLoaded) {
        this._buildUI();
        this._renderChart();
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
      if (this.hasAttribute('auto-detect') || !this.getAttribute('chart-type')) {
        this._autoDetect();
      }
      this._syncFromAttributes();
    }

    _analyzeFields() {
      const labels = new Map();
      const values = new Map();
      const sampleSize = Math.min(this._data.length, 100);

      for (let i = 0; i < sampleSize; i++) {
        this._collectFields(this._data[i], '', labels, values);
      }

      this._fieldInfo = {
        labels: Array.from(labels.keys()),
        values: Array.from(values.keys()),
        all: [...new Set([...labels.keys(), ...values.keys()])],
      };
    }

    _collectFields(obj, prefix, labels, values) {
      if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return;
      for (const key of Object.keys(obj)) {
        const path = prefix ? `${prefix}.${key}` : key;
        const val = obj[key];
        if (val === null || val === undefined) continue;
        if (typeof val === 'number') {
          values.set(path, true);
        } else if (typeof val === 'string') {
          if (/^\d{4}-\d{2}-\d{2}T/.test(val)) {
            labels.set(path, 'date');
          } else {
            labels.set(path, 'string');
          }
        } else if (typeof val === 'boolean') {
          labels.set(path, 'boolean');
        } else if (typeof val === 'object' && !Array.isArray(val)) {
          if (val.$oid) {
            labels.set(path, 'string');
          } else if (val.$date) {
            labels.set(path, 'date');
          } else {
            this._collectFields(val, path, labels, values);
          }
        }
        // arrays excluded
      }
    }

    _autoDetect() {
      const { labels, values } = this._fieldInfo;

      // Pick label field
      if (!this.getAttribute('label-field')) {
        this._labelField = this._pickByPriority(labels, LABEL_PRIORITY) || labels[0] || '';
      }

      // Pick value field
      if (!this.getAttribute('value-fields')) {
        const pick = this._pickByPriority(values, VALUE_PRIORITY) || values[0] || '';
        this._valueFields = pick ? [pick] : [];
      }

      // Pick chart type
      if (!this.getAttribute('chart-type')) {
        this._chartType = this._detectChartType();
      }
    }

    _syncFromAttributes() {
      const chartType = this.getAttribute('chart-type');
      if (chartType) this._chartType = chartType;

      const labelField = this.getAttribute('label-field');
      if (labelField) this._labelField = labelField;

      const valueFields = this.getAttribute('value-fields');
      if (valueFields) this._valueFields = valueFields.split(',').map(s => s.trim()).filter(Boolean);
    }

    _pickByPriority(fields, priority) {
      for (const name of priority) {
        const match = fields.find(f => {
          const last = f.includes('.') ? f.split('.').pop() : f;
          return last.toLowerCase() === name;
        });
        if (match) return match;
      }
      return null;
    }

    _detectChartType() {
      if (this._data.length === 1 && this._valueFields.length === 1) return 'number';

      // Check if label field looks like a date
      if (this._data.length > 0 && this._labelField) {
        const sample = this._getNestedValue(this._data[0], this._labelField);
        if (typeof sample === 'string' && /^\d{4}-\d{2}-\d{2}/.test(sample)) return 'line';
      }

      // Count unique labels
      const uniqueLabels = new Set();
      this._data.forEach(row => {
        const val = this._getNestedValue(row, this._labelField);
        uniqueLabels.add(this._labelToString(val));
      });
      if (uniqueLabels.size > 0 && uniqueLabels.size <= 6 && this._valueFields.length === 1) return 'pie';

      return 'bar';
    }

    _getNestedValue(obj, path) {
      if (!path) return undefined;
      const parts = path.split('.');
      let current = obj;
      for (const p of parts) {
        if (current === null || current === undefined) return undefined;
        current = current[p];
      }
      return current;
    }

    _labelToString(val) {
      if (val === null || val === undefined) return '(empty)';
      if (typeof val === 'object') {
        if (val.$oid) return val.$oid;
        if (val.$date) return new Date(val.$date).toLocaleDateString();
        return JSON.stringify(val);
      }
      const s = String(val);
      return s.length > 30 ? s.substring(0, 27) + '...' : s;
    }

    // ── Library loading ───────────────────────────────────────────────────────

    async _loadChartLibrary() {
      if (this._isLibraryLoaded) return;
      try {
        await this.loadLibrary('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 'Chart');
        if (window.Chart) {
          await this.loadLibrary('https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js', 'ChartDataLabels');
        }
        if (window.Chart && window.ChartDataLabels) {
          window.Chart.register(window.ChartDataLabels);
          window.Chart.defaults.plugins.datalabels = { display: false };
        }
        this._isLibraryLoaded = true;
      } catch (e) {
        console.error('[wc-chart-builder] Failed to load Chart.js:', e);
      }
    }

    // ── UI building ───────────────────────────────────────────────────────────

    _buildUI() {
      this.componentElement.innerHTML = '';

      const showControls = this.getAttribute('show-controls') !== 'false';

      if (showControls) {
        const bar = document.createElement('div');
        bar.classList.add('chart-builder-controls');
        bar.appendChild(this._createDropdown('Type', CHART_TYPES, this._chartType, (val) => {
          this._chartType = val;
          this._renderChart();
        }));
        bar.appendChild(this._createDropdown('Label', this._fieldInfo.labels, this._labelField, (val) => {
          this._labelField = val;
          this._renderChart();
        }));
        bar.appendChild(this._createValueControls());
        this.componentElement.appendChild(bar);
      }

      // Chart area
      const chartArea = document.createElement('div');
      chartArea.classList.add('chart-builder-area');
      const height = this.getAttribute('height');
      if (height) chartArea.style.height = height;

      this._canvas = document.createElement('canvas');
      chartArea.appendChild(this._canvas);
      this.componentElement.appendChild(chartArea);
    }

    _createDropdown(label, options, selected, onChange) {
      const group = document.createElement('div');
      group.classList.add('chart-builder-field');

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

    _createValueControls() {
      const group = document.createElement('div');
      group.classList.add('chart-builder-field', 'chart-builder-values');

      const lbl = document.createElement('label');
      lbl.textContent = 'Values';
      group.appendChild(lbl);

      const wrapper = document.createElement('div');
      wrapper.classList.add('chart-builder-value-list');

      this._valueFields.forEach((field, idx) => {
        wrapper.appendChild(this._createValueRow(field, idx));
      });

      group.appendChild(wrapper);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.classList.add('chart-builder-add-btn');
      addBtn.textContent = '+ Add';
      addBtn.addEventListener('click', () => {
        const remaining = this._fieldInfo.values.filter(f => !this._valueFields.includes(f));
        if (remaining.length === 0) return;
        this._valueFields.push(remaining[0]);
        this._buildUI();
        this._renderChart();
      });
      group.appendChild(addBtn);

      return group;
    }

    _createValueRow(field, idx) {
      const row = document.createElement('div');
      row.classList.add('chart-builder-value-row');

      const select = document.createElement('select');
      this._fieldInfo.values.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (opt === field) option.selected = true;
        select.appendChild(option);
      });
      select.addEventListener('change', () => {
        this._valueFields[idx] = select.value;
        this._renderChart();
      });
      row.appendChild(select);

      if (this._valueFields.length > 1) {
        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.classList.add('chart-builder-remove-btn');
        removeBtn.textContent = '×';
        removeBtn.title = 'Remove';
        removeBtn.addEventListener('click', () => {
          this._valueFields.splice(idx, 1);
          this._buildUI();
          this._renderChart();
        });
        row.appendChild(removeBtn);
      }

      return row;
    }

    // ── Chart rendering ───────────────────────────────────────────────────────

    _renderChart() {
      this._destroyChart();
      if (!this._canvas || !this._isLibraryLoaded || this._data.length === 0) return;

      if (this._chartType === 'number') {
        this._renderNumberChart();
        return;
      }

      const colors = this._getColors();
      const labels = this._extractLabels();
      const truncatedLabels = labels.map(l => l.length > 20 ? l.substring(0, 17) + '...' : l);
      const showWarning = labels.length > 50;
      const displayLabels = showWarning ? truncatedLabels.slice(0, 50) : truncatedLabels;

      const datasets = this._valueFields.map((field, i) => {
        let rawData = this._data.map(row => {
          const val = this._getNestedValue(row, field);
          return typeof val === 'number' ? val : (parseFloat(val) || 0);
        });
        if (showWarning) rawData = rawData.slice(0, 50);

        const isPie = this._chartType === 'pie' || this._chartType === 'doughnut';
        return {
          label: field,
          data: rawData,
          backgroundColor: isPie ? colors.slice(0, displayLabels.length) : colors[i % colors.length],
          borderColor: isPie ? '#fff' : colors[i % colors.length],
          borderWidth: isPie ? 2 : 2,
          fill: this._chartType === 'area',
          tension: 0.3,
        };
      });

      const type = this._chartType === 'area' ? 'line' : this._chartType;
      const title = this.getAttribute('title') || '';
      const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color').trim() || '#ccc';
      const gridColor = getComputedStyle(document.documentElement).getPropertyValue('--component-border-color').trim() || '#333';

      const isPie = type === 'pie' || type === 'doughnut';

      const config = {
        type: type,
        data: { labels: displayLabels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: !this.getAttribute('height'),
          animation: { duration: 400 },
          plugins: {
            title: {
              display: !!title,
              text: title + (showWarning ? ' (showing top 50)' : ''),
              color: textColor,
              font: { size: 14 },
            },
            legend: {
              display: isPie || datasets.length > 1,
              position: 'bottom',
              labels: { color: textColor, boxWidth: 12, padding: 12 },
            },
            tooltip: {
              callbacks: {
                title: (items) => {
                  if (!items.length) return '';
                  const idx = items[0].dataIndex;
                  return labels[idx] || truncatedLabels[idx];
                },
              },
            },
            datalabels: { display: false },
          },
          scales: isPie ? {} : {
            x: {
              ticks: { color: textColor, maxRotation: 45 },
              grid: { color: gridColor },
            },
            y: {
              ticks: { color: textColor },
              grid: { color: gridColor },
              beginAtZero: true,
            },
          },
          onClick: (event, elements) => {
            if (elements.length > 0) {
              const el = elements[0];
              const idx = el.index;
              const dsIdx = el.datasetIndex;
              this._emitEvent('wcchartclick', 'chart:click', {
                bubbles: true, composed: true,
                detail: {
                  label: labels[idx],
                  value: datasets[dsIdx].data[idx],
                  field: this._valueFields[dsIdx],
                  document: this._data[idx],
                },
              });
            }
          },
        },
      };

      this._chartInstance = new Chart(this._canvas, config);

      this._emitEvent('wcchartready', 'chart:ready', {
        bubbles: true, composed: true,
        detail: { chart: this._chartInstance },
      });
    }

    _renderNumberChart() {
      // Hide canvas, render KPI display
      this._canvas.style.display = 'none';

      const area = this._canvas.parentElement;
      const existing = area.querySelector('.chart-builder-number');
      if (existing) existing.remove();

      const container = document.createElement('div');
      container.classList.add('chart-builder-number');

      let value = 0;
      let label = '';

      if (this._valueFields.length > 0) {
        const field = this._valueFields[0];
        label = field;
        if (this._data.length === 1) {
          value = this._getNestedValue(this._data[0], field) || 0;
        } else {
          // Sum across all rows
          value = this._data.reduce((sum, row) => {
            const v = this._getNestedValue(row, field);
            return sum + (typeof v === 'number' ? v : 0);
          }, 0);
        }
      }

      const title = this.getAttribute('title') || label;
      const formatted = typeof value === 'number' ? value.toLocaleString() : value;

      container.innerHTML = `
        <div class="chart-builder-number-value">${formatted}</div>
        <div class="chart-builder-number-label">${title}</div>
      `;
      area.appendChild(container);

      this._emitEvent('wcchartready', 'chart:ready', {
        bubbles: true, composed: true,
        detail: { value, label: title },
      });
    }

    _extractLabels() {
      return this._data.map(row => {
        const val = this._getNestedValue(row, this._labelField);
        return this._labelToString(val);
      });
    }

    _getColors() {
      const colorsAttr = this.getAttribute('colors');
      if (colorsAttr) {
        try { return JSON.parse(colorsAttr); } catch (e) { /* fall through */ }
      }
      return DEFAULT_PALETTE;
    }

    _destroyChart() {
      if (this._chartInstance) {
        this._chartInstance.destroy();
        this._chartInstance = null;
      }
      // Clean up number display
      if (this._canvas) {
        this._canvas.style.display = '';
        const area = this._canvas.parentElement;
        if (area) {
          const num = area.querySelector('.chart-builder-number');
          if (num) num.remove();
        }
      }
    }

    // ── Styles ────────────────────────────────────────────────────────────────

    _applyStyle() {
      const style = `
        .wc-chart-builder {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
        }
        .chart-builder-controls {
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
        .chart-builder-field {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .chart-builder-field label {
          color: var(--text-6, #888);
          font-weight: 500;
          white-space: nowrap;
        }
        .chart-builder-field select {
          background: var(--surface-bg-color, #2a2a3e);
          color: var(--text-color, #ccc);
          border: 1px solid var(--component-border-color, #555);
          border-radius: 4px;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          cursor: pointer;
          min-width: 80px;
        }
        .chart-builder-field select:focus {
          outline: none;
          border-color: var(--primary-bg-color, #6366f1);
        }
        .chart-builder-values {
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }
        .chart-builder-value-list {
          display: flex;
          gap: 0.25rem;
        }
        .chart-builder-value-row {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .chart-builder-add-btn {
          background: transparent;
          color: var(--primary-bg-color, #6366f1);
          border: 1px dashed var(--primary-bg-color, #6366f1);
          border-radius: 4px;
          padding: 0.2rem 0.5rem;
          font-size: 0.6875rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .chart-builder-add-btn:hover {
          background: var(--primary-bg-color, #6366f1);
          color: var(--primary-text-color, #fff);
        }
        .chart-builder-remove-btn {
          background: transparent;
          color: var(--danger-bg-color, #ef4444);
          border: none;
          cursor: pointer;
          font-size: 0.875rem;
          line-height: 1;
          padding: 0 2px;
        }
        .chart-builder-remove-btn:hover {
          color: var(--danger-text-color, #fff);
        }
        .chart-builder-area {
          flex: 1;
          min-height: 0;
          position: relative;
          overflow: hidden;
        }
        .chart-builder-number {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 0.5rem;
        }
        .chart-builder-number-value {
          font-size: 4rem;
          font-weight: 700;
          color: var(--primary-bg-color, #6366f1);
          line-height: 1;
        }
        .chart-builder-number-label {
          font-size: 1rem;
          color: var(--text-6, #888);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `.trim();
      this.loadStyle('wc-chart-builder-style', style);
    }
  }

  customElements.define('wc-chart-builder', WcChartBuilder);
}
