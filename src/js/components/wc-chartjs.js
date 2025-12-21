/**
 * Name: wc-chartjs
 * Usage:
 *
 *   <!-- Fetch data from URL -->
 *   <wc-chartjs
 *     url="/api/prospect-quotes/chart-data?num_days=14"
 *     type="bar"
 *     height="400"
 *     show-legend="true"
 *     legend-position="top">
 *   </wc-chartjs>
 *
 *   <!-- With static inline data (works like wc-chart) -->
 *   <wc-chartjs
 *     type="line"
 *     labels='["Jan", "Feb", "Mar"]'
 *     datasets='[{"label": "2024", "data": [10,20,30]}]'
 *     title="Monthly Sales">
 *   </wc-chartjs>
 *
 * Attributes:
 *   - url: URL to fetch chart data from (returns {labels, datasets, title?, type?})
 *   - ajax-method: HTTP method (default: "GET")
 *   - url-params: Additional query parameters as JSON string
 *   - ajax-headers: Custom headers as JSON string
 *   - auto-refresh: Auto-refresh interval in milliseconds
 *   - loading-text: Text to show while loading (default: "Loading chart...")
 *   - busy-indicator: Use wc-busy-indicator instead of loading-text ("true" or "false")
 *   - busy-indicator-type: Type of busy indicator (chart-bar, chart-line, chart-pie, spinner, etc.)
 *   - All wc-chart attributes (type, labels, data, datasets, title, height, etc.)
 *
 * Events:
 *   - chartjs:loading - Fired when data fetch starts
 *   - chartjs:loaded - Fired when data is successfully loaded
 *   - chartjs:error - Fired when data fetch fails
 *
 * API Response Format:
 *   {
 *     "labels": ["Q1", "Q2", "Q3"],
 *     "datasets": [
 *       {
 *         "label": "Sales",
 *         "data": [100, 200, 300],
 *         "backgroundColor": "#3498db",
 *         "borderColor": "#2980b9"
 *       }
 *     ],
 *     "title": "Quarterly Sales",  // Optional
 *     "type": "bar"                 // Optional
 *   }
 */

import { WcChart } from './wc-chart.js';

class WcChartjs extends WcChart {
  static get is() {
    return 'wc-chartjs';
  }

  static get observedAttributes() {
    return [
      ...WcChart.observedAttributes,
      'url',
      'ajax-method',
      'url-params',
      'ajax-headers',
      'auto-refresh',
      'loading-text',
      'busy-indicator',
      'busy-indicator-type'
    ];
  }

  constructor() {
    super();
    this.autoRefreshInterval = null;
    this.isLoading = false;
    this.loadingIndicator = null;
    this._initialFetchDone = false;
  }

  async connectedCallback() {
    // Don't call parent connectedCallback yet if we have url
    const url = this.getAttribute('url');

    if (url) {
      // Show loading state
      this._showLoading();

      // Fetch data first
      await this._fetchChartData();
      this._initialFetchDone = true;

      // Then initialize the chart with fetched data
      await super.connectedCallback();

      // Setup auto-refresh if specified
      this._setupAutoRefresh();
    } else {
      // No url, work like regular wc-chart
      await super.connectedCallback();
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._clearAutoRefresh();
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'url' && this._isConnected && this._initialFetchDone) {
      // URL changed after initial load, refetch data
      // Only refetch if this is a real change (oldValue exists and is different)
      if (oldValue !== null && oldValue !== newValue) {
        this._fetchChartData();
      }
    } else if (attrName === 'url-params' && this._isConnected && this._initialFetchDone) {
      // Params changed after initial load, refetch data
      if (oldValue !== null && oldValue !== newValue) {
        this._fetchChartData();
      }
    } else if (attrName === 'auto-refresh') {
      // Auto-refresh interval changed
      this._setupAutoRefresh();
    } else {
      // Let parent handle other attributes
      super._handleAttributeChange(attrName, newValue, oldValue);
    }
  }

  async _fetchChartData() {
    const url = this.getAttribute('url');
    if (!url) return;

    this.isLoading = true;
    this._showLoading();

    // Dispatch loading event
    this.dispatchEvent(new CustomEvent('chartjs:loading', {
      bubbles: true,
      detail: { url: url }
    }));

    try {
      // Build URL with params
      const requestUrl = this._buildRequestUrl(url);

      // Get method and headers
      const method = this.getAttribute('ajax-method') || 'GET';
      const headers = this._parseJSON(this.getAttribute('ajax-headers'), {
        'Content-Type': 'application/json'
      });

      // Fetch data
      const response = await fetch(requestUrl, {
        method: method,
        headers: headers
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Update component attributes with fetched data
      this._applyFetchedData(data);

      this.isLoading = false;
      this._hideLoading();

      // Dispatch loaded event
      this.dispatchEvent(new CustomEvent('chartjs:loaded', {
        bubbles: true,
        detail: { data }
      }));

    } catch (error) {
      console.error('Failed to fetch chart data:', error);
      this.isLoading = false;
      this._showError(error.message);

      // Dispatch error event
      this.dispatchEvent(new CustomEvent('chartjs:error', {
        bubbles: true,
        detail: { error: error.message }
      }));
    }
  }

  _buildRequestUrl(baseUrl) {
    const urlParams = this._parseJSON(this.getAttribute('url-params'), {});

    // If no params, return base URL
    if (Object.keys(urlParams).length === 0) {
      return baseUrl;
    }

    // Build query string
    const url = new URL(baseUrl, window.location.origin);
    Object.entries(urlParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  _applyFetchedData(data) {
    // Apply labels
    if (data.labels) {
      this.setAttribute('labels', JSON.stringify(data.labels));
    }

    // Apply datasets or single data array
    if (data.datasets) {
      this.setAttribute('datasets', JSON.stringify(data.datasets));
      // Remove single data attribute if it exists
      this.removeAttribute('data');
      this.removeAttribute('label');
    } else if (data.data) {
      // Single dataset
      this.setAttribute('data', JSON.stringify(data.data));
      if (data.label) {
        this.setAttribute('label', data.label);
      }
      // Remove datasets attribute if it exists
      this.removeAttribute('datasets');
    }

    // Apply optional properties
    if (data.title) {
      this.setAttribute('title', data.title);
    }
    // Only apply type from API if not already set in HTML
    if (data.type && !this.hasAttribute('type')) {
      this.setAttribute('type', data.type);
    }
    if (data.colors) {
      this.setAttribute('colors', JSON.stringify(data.colors));
    }
    if (data.legendPosition) {
      this.setAttribute('legend-position', data.legendPosition);
    }
    if (data.showLegend !== undefined) {
      this.setAttribute('show-legend', String(data.showLegend));
    }
    if (data.showDataLabels !== undefined) {
      this.setAttribute('show-data-labels', String(data.showDataLabels));
    }
    if (data.xAxisTitle) {
      this.setAttribute('x-axis-title', data.xAxisTitle);
    }
    if (data.yAxisTitle) {
      this.setAttribute('y-axis-title', data.yAxisTitle);
    }
    if (data.stacked !== undefined) {
      this.setAttribute('stacked', String(data.stacked));
    }
  }

  _showLoading() {
    if (this.loadingIndicator) return;

    const useBusyIndicator = this.getAttribute('busy-indicator') === 'true';
    const loadingText = this.getAttribute('loading-text') || '';

    if (useBusyIndicator) {
      // Use wc-busy-indicator component
      const chartType = this.getAttribute('type') || 'bar';
      const busyType = this.getAttribute('busy-indicator-type') || `chart-${chartType}`;
      const size = this.getAttribute('height') > 400 ? 'large' : 'medium';

      this.loadingIndicator = document.createElement('wc-busy-indicator');
      this.loadingIndicator.setAttribute('type', busyType);
      if (loadingText) {
        this.loadingIndicator.setAttribute('text', loadingText);
      }
      this.loadingIndicator.setAttribute('size', size);
      this.loadingIndicator.style.minHeight = this.getAttribute('height') ? `${this.getAttribute('height')}px` : '400px';
    } else {
      // Use simple loading text (original behavior)
      const text = loadingText || 'Loading chart...';
      this.loadingIndicator = document.createElement('div');
      this.loadingIndicator.classList.add('wc-chartjs-loading', 'flex', 'items-center', 'justify-center', 'p-8');
      this.loadingIndicator.style.minHeight = this.getAttribute('height') ? `${this.getAttribute('height')}px` : '400px';

      this.loadingIndicator.innerHTML = `
        <div class="text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mb-2"></div>
          <div class="text-gray-600 dark:text-gray-400">${text}</div>
        </div>
      `;
    }

    // Insert at the beginning
    if (this.componentElement) {
      this.componentElement.insertBefore(this.loadingIndicator, this.componentElement.firstChild);
    } else {
      this.appendChild(this.loadingIndicator);
    }
  }

  _hideLoading() {
    if (this.loadingIndicator) {
      this.loadingIndicator.remove();
      this.loadingIndicator = null;
    }
  }

  _showError(message) {
    this._hideLoading();

    const errorElement = document.createElement('div');
    errorElement.classList.add('wc-chartjs-error', 'flex', 'items-center', 'justify-center', 'p-8', 'bg-red-50', 'dark:bg-red-900', 'rounded');
    errorElement.style.minHeight = this.getAttribute('height') ? `${this.getAttribute('height')}px` : '400px';

    errorElement.innerHTML = `
      <div class="text-center">
        <svg class="inline-block w-12 h-12 text-red-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div class="text-red-600 dark:text-red-400 font-semibold">Failed to load chart data</div>
        <div class="text-red-500 dark:text-red-300 text-sm mt-1">${message}</div>
        <button class="btn btn-sm btn-danger mt-4" onclick="this.closest('wc-chartjs').reload()">Retry</button>
      </div>
    `;

    if (this.componentElement) {
      this.componentElement.appendChild(errorElement);
    } else {
      this.appendChild(errorElement);
    }
  }

  _setupAutoRefresh() {
    // Clear existing interval
    this._clearAutoRefresh();

    const autoRefresh = this.getAttribute('auto-refresh');
    if (autoRefresh) {
      const interval = parseInt(autoRefresh);
      if (interval > 0) {
        this.autoRefreshInterval = setInterval(() => {
          this._fetchChartData();
        }, interval);
      }
    }
  }

  _clearAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
    }
  }

  _applyStyle() {
    // Call parent style first (for wc-chart styles)
    super._applyStyle();

    // Add wc-chartjs specific styles
    const style = `
      wc-chartjs {
        display: contents;
      }
    `.trim();
    this.loadStyle('wc-chartjs-style', style);
  }

  // Public methods
  reload() {
    // Remove any error messages
    const errorElements = this.querySelectorAll('.wc-chartjs-error');
    errorElements.forEach(el => el.remove());

    // Fetch data again
    return this._fetchChartData();
  }

  setUrl(url) {
    this.setAttribute('url', url);
  }

  setParams(params) {
    this.setAttribute('url-params', JSON.stringify(params));
  }
}

// Register the component
if (!customElements.get(WcChartjs.is)) {
  customElements.define(WcChartjs.is, WcChartjs);
}

export { WcChartjs };
