/**
 * Name: wc-chart
 * Usage:
 * 
 *   <wc-chart 
 *     type="bar"
 *     labels='["Q1", "Q2", "Q3", "Q4"]'
 *     data='[65, 59, 80, 81]'
 *     label="Sales"
 *     title="Quarterly Sales"
 *     height="300"
 *     width="auto"
 *     colors='["#3498db"]'
 *     show-legend="true"
 *     show-data-labels="false">
 *   </wc-chart>
 * 
 *   <wc-chart
 *     type="line"
 *     labels='["Jan", "Feb", "Mar", "Apr"]'
 *     datasets='[{"label": "2023", "data": [10,20,30,40]}, {"label": "2024", "data": [15,25,35,45]}]'
 *     title="Monthly Revenue">
 *   </wc-chart>
 * 
 * References:
 *   https://www.chartjs.org/
 *   https://cdn.jsdelivr.net/npm/chart.js@4.4.1
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcChart extends WcBaseComponent {
  static get is() {
    return 'wc-chart';
  }

  static get observedAttributes() {
    return [
      'type', 'labels', 'data', 'label', 'datasets',
      'title', 'height', 'width', 'colors',
      'show-legend', 'show-data-labels', 'padding-top',
      'responsive', 'maintain-aspect-ratio',
      'x-axis-title', 'y-axis-title', 'stacked',
      'tension', 'fill', 'point-radius', 'border-width',
      'text-color', 'grid-color', 'class'
    ];
  }

  constructor() {
    super();
    this.chart = null;
    this.chartInstance = null;
    this.canvas = null;
    this.isLibraryLoaded = false;
    this.pendingChartConfig = null;
    
    // Default color palette - will be resolved from CSS variables
    this.defaultColors = [
      '--primary-bg-color',
      '--success-bg-color', 
      '--warning-bg-color',
      '--danger-bg-color',
      '--info-bg-color',
      '--secondary-bg-color'
    ];

    // Create the component structure
    this.componentElement = document.createElement('div');
    this.componentElement.classList.add('wc-chart', 'relative', 'w-full');
    this.appendChild(this.componentElement);
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();  // Apply styles first to ensure CSS variables are available
    await this._initChart();
    this._wireEvents();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._destroyChart();
    this._unWireEvents();
  }

  async _initChart() {
    // Load Chart.js library if not already loaded
    if (!this.isLibraryLoaded) {
      await this._loadChartLibrary();
    }

    // Create canvas element
    this._createCanvas();

    // Initialize chart with current attributes
    this._createChart();
  }

  async _loadChartLibrary() {
    try {
      // Load Chart.js first
      await this.loadLibrary('https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js', 'Chart');
      
      // Then load the plugin after Chart.js is available
      if (window.Chart) {
        await this.loadLibrary('https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js', 'ChartDataLabels');
      }
      
      // Register the datalabels plugin globally but disable by default
      if (window.Chart && window.ChartDataLabels) {
        window.Chart.register(window.ChartDataLabels);
        window.Chart.defaults.plugins.datalabels = {
          display: false
        };
        
        // Set global Chart.js defaults to use Wave CSS theme colors
        const textColor = this._getThemeColor('text-color', '--primary-color');
        const gridColor = this._getThemeColor('grid-color', '--component-border-color');
        
        // Set global defaults for all charts
        window.Chart.defaults.color = textColor;
        window.Chart.defaults.borderColor = gridColor;
      }
      
      this.isLibraryLoaded = true;
      
      // Dispatch event when Chart.js is ready
      if (window.wc && window.wc.EventHub) {
        window.wc.EventHub.broadcast('wc-chart:library-loaded', '', { Chart: window.Chart });
      }
    } catch (error) {
      console.error('Failed to load Chart.js library:', error);
    }
  }

  _createCanvas() {
    if (this.canvas) return;

    const wrapper = document.createElement('div');
    wrapper.classList.add('chart-wrapper', 'relative');
    
    // Set dimensions
    const height = this.getAttribute('height') || '400';
    const width = this.getAttribute('width') || 'auto';
    
    if (width !== 'auto') {
      wrapper.style.width = `${width}px`;
    }
    wrapper.style.height = `${height}px`;

    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('role', 'img');
    this.canvas.setAttribute('aria-label', this.getAttribute('title') || 'Chart');
    
    wrapper.appendChild(this.canvas);
    this.componentElement.appendChild(wrapper);
  }

  _createChart() {
    if (!window.Chart || !this.canvas) {
      // Store config to create chart when library is loaded
      this.pendingChartConfig = this._buildChartConfig();
      return;
    }

    // Destroy existing chart if any
    this._destroyChart();

    const config = this._buildChartConfig();
    if (!config) return;

    try {
      this.chartInstance = new window.Chart(this.canvas, config);
      
      // Dispatch event when chart is created
      this.dispatchEvent(new CustomEvent('chart-created', {
        detail: { chart: this.chartInstance },
        bubbles: true
      }));
    } catch (error) {
      console.error('Failed to create chart:', error);
    }
  }

  _buildChartConfig() {
    const type = this.getAttribute('type') || 'bar';
    const labels = this._parseJSON(this.getAttribute('labels'), []);
    const datasets = this._buildDatasets();
    
    if (!datasets || datasets.length === 0) {
      return null;
    }

    const config = {
      type: type,
      data: {
        labels: labels,
        datasets: datasets
      },
      options: this._buildChartOptions(type)
    };

    return config;
  }

  _buildDatasets() {
    // Check if datasets attribute is provided
    const datasetsAttr = this.getAttribute('datasets');
    if (datasetsAttr) {
      const datasets = this._parseJSON(datasetsAttr, []);
      return datasets.map((dataset, index) => this._formatDataset(dataset, index));
    }

    // Build single dataset from data and label attributes
    const data = this._parseJSON(this.getAttribute('data'), []);
    const label = this.getAttribute('label') || 'Dataset';
    
    if (!data || data.length === 0) {
      return [];
    }

    return [this._formatDataset({ label, data }, 0)];
  }

  _formatDataset(dataset, index) {
    const type = this.getAttribute('type') || 'bar';
    const colors = this._parseJSON(this.getAttribute('colors'), this.defaultColors);
    let color = colors[index % colors.length];
    
    // Resolve CSS variable to actual color
    color = this._resolveColor(color);
    
    // Parse color to get RGB values for transparency
    const rgbColor = this._cssVarToRgb(color);
    
    const formattedDataset = {
      label: dataset.label,
      data: dataset.data,
      backgroundColor: type === 'line' ? `rgba(${rgbColor}, 0.2)` : color,
      borderColor: color,
      borderWidth: parseInt(this.getAttribute('border-width') || '2'),
    };

    // Type-specific formatting
    if (type === 'line') {
      formattedDataset.tension = parseFloat(this.getAttribute('tension') || '0.1');
      formattedDataset.fill = this.getAttribute('fill') !== 'false';
      formattedDataset.pointRadius = parseInt(this.getAttribute('point-radius') || '3');
      formattedDataset.pointBackgroundColor = color;
    } else if (type === 'pie' || type === 'doughnut') {
      // For pie/doughnut, use multiple colors for segments
      formattedDataset.backgroundColor = dataset.data.map((_, i) => {
        const segmentColor = colors[i % colors.length];
        return this._resolveColor(segmentColor);
      });
      formattedDataset.borderColor = '#fff';
    } else if (type === 'radar') {
      formattedDataset.backgroundColor = `rgba(${rgbColor}, 0.2)`;
      formattedDataset.borderColor = color;
      // Add radar-specific properties
      Object.assign(formattedDataset, {
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: color
      });
    } else if (type === 'polarArea') {
      formattedDataset.backgroundColor = `rgba(${rgbColor}, 0.2)`;
      formattedDataset.borderColor = color;
    }

    return formattedDataset;
  }

  _buildChartOptions(type) {
    const showLegend = this.getAttribute('show-legend') !== 'false';
    const showDataLabels = this.getAttribute('show-data-labels') === 'true';
    const responsive = this.getAttribute('responsive') !== 'false';
    const maintainAspectRatio = this.getAttribute('maintain-aspect-ratio') !== 'false';
    const title = this.getAttribute('title');
    const xAxisTitle = this.getAttribute('x-axis-title');
    const yAxisTitle = this.getAttribute('y-axis-title');
    const stacked = this.getAttribute('stacked') === 'true';
    const paddingTop = parseInt(this.getAttribute('padding-top') || (showDataLabels && type === 'bar' ? '30' : '0'));
    
    // Get Wave CSS theme colors
    const textColor = this._getThemeColor('text-color', '--primary-color');
    const gridColor = this._getThemeColor('grid-color', '--component-border-color');

    const options = {
      responsive: responsive,
      maintainAspectRatio: maintainAspectRatio,
      plugins: {
        legend: {
          display: showLegend,
          position: 'top',
          labels: {
            color: textColor
          }
        },
        title: {
          display: !!title,
          text: title,
          color: textColor,
          font: {
            size: 16
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {}
        },
        datalabels: {
          display: showDataLabels,
          anchor: 'end',
          align: 'top',
          formatter: (value) => value,
          color: textColor,
          font: {
            weight: 'bold'
          }
        }
      },
      layout: {
        padding: {
          top: paddingTop
        }
      }
    };

    // Configure scales for chart types that support them
    if (type !== 'pie' && type !== 'doughnut' && type !== 'radar' && type !== 'polarArea') {
      options.scales = {
        x: {
          display: true,
          stacked: stacked,
          title: {
            display: !!xAxisTitle,
            text: xAxisTitle,
            color: textColor
          },
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor,
            borderColor: gridColor
          }
        },
        y: {
          display: true,
          stacked: stacked,
          beginAtZero: true,
          title: {
            display: !!yAxisTitle,
            text: yAxisTitle,
            color: textColor
          },
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor,
            borderColor: gridColor
          }
        }
      };
    } else if (type === 'radar') {
      options.scales = {
        r: {
          angleLines: {
            color: gridColor
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor
          },
          ticks: {
            color: textColor,
            backdropColor: 'transparent'
          }
        }
      };
    } else if (type === 'polarArea') {
      options.scales = {
        r: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            backdropColor: 'transparent'
          }
        }
      };
    }

    // Special handling for pie/doughnut charts
    if (type === 'pie' || type === 'doughnut') {
      options.plugins.tooltip.callbacks.label = function(context) {
        const label = context.label || '';
        const value = context.parsed || 0;
        const total = context.dataset.data.reduce((a, b) => a + b, 0);
        const percentage = ((value / total) * 100).toFixed(1);
        return `${label}: ${value} (${percentage}%)`;
      };
    }

    return options;
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    // Skip default base class handling for our attributes
    if (WcChart.observedAttributes.includes(attrName)) {
      // Recreate chart when relevant attributes change
      if (this.chartInstance) {
        this._createChart();
      }
    } else {
      super._handleAttributeChange(attrName, newValue, oldValue);
    }
  }

  _destroyChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }

  _parseJSON(jsonString, defaultValue) {
    if (!jsonString) return defaultValue;
    try {
      return JSON.parse(jsonString.replace(/'/g, '"'));
    } catch (e) {
      console.warn('Failed to parse JSON:', jsonString, e);
      return defaultValue;
    }
  }

  _cssVarToRgb(color) {
    // Convert hex to RGB
    if (color && color.startsWith('#')) {
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `${r}, ${g}, ${b}`;
    }
    
    // Try to parse rgb/rgba
    if (color && (color.startsWith('rgb(') || color.startsWith('rgba('))) {
      const match = color.match(/\d+/g);
      if (match && match.length >= 3) {
        return `${match[0]}, ${match[1]}, ${match[2]}`;
      }
    }
    
    // Default fallback
    return '52, 152, 219';
  }

  _resolveColor(color) {
    if (!color) return '#3498db';
    
    // If it's already a color value, return it
    if (color.startsWith('#') || color.startsWith('rgb')) {
      return color;
    }
    
    // If it's a CSS variable name (with or without --)
    let varName = color;
    if (!varName.startsWith('--')) {
      varName = `--${color}`;
    }
    
    // Try to resolve from CSS variable - first from element, then from document
    let resolved = getComputedStyle(this).getPropertyValue(varName).trim();
    if (!resolved) {
      resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    if (resolved) {
      return resolved;
    }
    
    // If it's a var() function
    if (color.startsWith('var(')) {
      const match = color.match(/var\((--[^,)]+)(?:,\s*(.+))?\)/); 
      if (match) {
        const cssVar = match[1];
        const fallback = match[2];
        const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
        return value || fallback || '#3498db';
      }
    }
    
    // Fallback colors for common names
    const fallbackColors = {
      'chart-primary': '#3498db',
      'chart-success': '#2ecc71',
      'chart-warning': '#f39c12',
      'chart-danger': '#e74c3c',
      'chart-info': '#9b59b6',
      'chart-secondary': '#95a5a6'
    };
    
    // Try to match the color name with fallback colors
    const colorKey = color.replace('--', '').replace('-bg-color', '');
    return fallbackColors[colorKey] || fallbackColors[`chart-${colorKey}`] || '#3498db';
  }

  _getThemeColor(attrName, cssVar) {
    // First check if attribute is set
    const attrValue = this.getAttribute(attrName);
    if (attrValue) return attrValue;
    
    // Try to get the CSS variable from the component itself first
    // This allows setting theme classes directly on the chart
    let computedStyle = getComputedStyle(this);
    let value = computedStyle.getPropertyValue(cssVar).trim();
    
    if (value) {
      return value;
    }
    
    // Fall back to document element if not found on component
    computedStyle = getComputedStyle(document.documentElement);
    value = computedStyle.getPropertyValue(cssVar).trim();
    
    if (value) {
      return value;
    }
    
    // Fallback values if CSS variable is not set
    const fallbacks = {
      '--color': '#000000',
      '--component-border-color': '#ced4da'
    };
    
    return fallbacks[cssVar] || '#666666';
  }

  _wireEvents() {
    // Listen for theme changes
    this._handleThemeChange = () => {
      // Delay to ensure CSS variables are updated
      setTimeout(() => {
        this.refresh();
      }, 100);
    };
    
    document.body.addEventListener('theme:change', this._handleThemeChange);
    
    // Add click handler
    if (this.canvas) {
      this.canvas.addEventListener('click', (event) => {
        if (!this.chartInstance) return;
        
        const points = this.chartInstance.getElementsAtEventForMode(
          event, 
          'nearest', 
          { intersect: true }, 
          false
        );
        
        if (points.length) {
          const firstPoint = points[0];
          const label = this.chartInstance.data.labels[firstPoint.index];
          const value = this.chartInstance.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
          
          this.dispatchEvent(new CustomEvent('chart-click', {
            detail: {
              label,
              value,
              datasetIndex: firstPoint.datasetIndex,
              index: firstPoint.index
            },
            bubbles: true
          }));
        }
      });
    }

    // Listen for HTMX events if available
    if (window.htmx) {
      document.body.addEventListener('htmx:afterSwap', (event) => {
        if (this.contains(event.target) || event.target.contains(this)) {
          setTimeout(() => this._createChart(), 100);
        }
      });
    }
  }

  _unWireEvents() {
    // Clean up event listeners if needed
    if (this._handleThemeChange) {
      document.body.removeEventListener('theme:change', this._handleThemeChange);
    }
  }

  _applyStyle() {
    // Apply any custom styles if needed
    // No need to inject styles - we use theme colors directly
  }

  // Public methods
  refresh() {
    // Re-render the chart with current theme colors
    if (this.chartInstance) {
      this._createChart();
    }
  }

  updateData(newData) {
    if (!this.chartInstance) return;
    
    if (Array.isArray(newData)) {
      // Update single dataset
      this.chartInstance.data.datasets[0].data = newData;
    } else if (newData.datasets) {
      // Update multiple datasets
      this.chartInstance.data.datasets = newData.datasets.map((ds, i) => 
        this._formatDataset(ds, i)
      );
    }
    
    if (newData.labels) {
      this.chartInstance.data.labels = newData.labels;
    }
    
    this.chartInstance.update();
  }

  updateOptions(newOptions) {
    if (!this.chartInstance) return;
    
    Object.assign(this.chartInstance.options, newOptions);
    this.chartInstance.update();
  }

  toImage() {
    if (!this.chartInstance) return null;
    return this.chartInstance.toBase64Image();
  }

  getChart() {
    return this.chartInstance;
  }

  // Static method to refresh all charts on the page
  static refreshAll() {
    const charts = document.querySelectorAll('wc-chart');
    charts.forEach(chart => {
      if (chart.refresh && typeof chart.refresh === 'function') {
        chart.refresh();
      }
    });
  }
}

// Register the component
if (!customElements.get(WcChart.is)) {
  customElements.define(WcChart.is, WcChart);
}

export { WcChart };