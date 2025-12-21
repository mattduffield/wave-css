/**
 * Name: wc-busy-indicator
 * Usage:
 *
 *   <!-- Basic usage -->
 *   <wc-busy-indicator></wc-busy-indicator>
 *
 *   <!-- With specific type -->
 *   <wc-busy-indicator type="chart-bar"></wc-busy-indicator>
 *   <wc-busy-indicator type="chart-line"></wc-busy-indicator>
 *   <wc-busy-indicator type="chart-connector"></wc-busy-indicator>
 *   <wc-busy-indicator type="chart-pie"></wc-busy-indicator>
 *   <wc-busy-indicator type="chart-doughnut"></wc-busy-indicator>
 *   <wc-busy-indicator type="spinner"></wc-busy-indicator>
 *   <wc-busy-indicator type="pulse"></wc-busy-indicator>
 *   <wc-busy-indicator type="dots"></wc-busy-indicator>
 *
 *   <!-- With custom text -->
 *   <wc-busy-indicator type="chart-bar" text="Loading chart data..."></wc-busy-indicator>
 *
 *   <!-- With custom size -->
 *   <wc-busy-indicator type="chart-bar" size="large"></wc-busy-indicator>
 *
 * Attributes:
 *   - type: Type of indicator (chart-bar, chart-line, chart-pie, spinner, pulse, dots, skeleton)
 *   - text: Optional text to display below indicator
 *   - size: Size of indicator (small, medium, large) - default: medium
 *   - color: Custom color (defaults to theme primary color)
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcBusyIndicator extends WcBaseComponent {
  static get is() {
    return 'wc-busy-indicator';
  }

  static get observedAttributes() {
    return ['type', 'text', 'size', 'color'];
  }

  constructor() {
    super();
  }

  _render() {
    this.classList.add('contents');
    this.componentElement = document.createElement('div');
    this.componentElement.classList.add('wc-busy-indicator', 'flex', 'flex-col', 'items-center', 'justify-center', 'p-8');
    this.appendChild(this.componentElement);
  }

  connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._renderIndicator();
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (['type', 'text', 'size', 'color'].includes(attrName)) {
      if (this.componentElement) {
        this._renderIndicator();
      }
    } else {
      super._handleAttributeChange(attrName, newValue, oldValue);
    }
  }

  _renderIndicator() {
    const type = this.getAttribute('type') || 'spinner';
    const text = this.getAttribute('text') || '';
    const size = this.getAttribute('size') || 'medium';

    this.componentElement.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.classList.add('busy-indicator-wrapper', 'flex', 'flex-col', 'items-center', 'gap-4');

    const indicator = this._createIndicator(type, size);
    wrapper.appendChild(indicator);

    if (text) {
      const textEl = document.createElement('div');
      textEl.classList.add('busy-indicator-text', 'text-sm', 'text-gray-600', 'dark:text-gray-400');
      textEl.textContent = text;
      wrapper.appendChild(textEl);
    }

    this.componentElement.appendChild(wrapper);
  }

  _createIndicator(type, size) {
    const container = document.createElement('div');
    container.classList.add('busy-indicator-animation');

    const sizeMap = {
      small: { width: 60, height: 40, barWidth: 8 },
      medium: { width: 120, height: 80, barWidth: 12 },
      large: { width: 180, height: 120, barWidth: 18 }
    };

    const dimensions = sizeMap[size] || sizeMap.medium;

    switch (type) {
      case 'chart-bar':
        return this._createChartBarIndicator(dimensions);
      case 'chart-line':
        return this._createChartLineIndicator(dimensions);
      case 'chart-connector':
        return this._createChartConnectorIndicator(dimensions);
      case 'chart-pie':
        return this._createChartPieIndicator(dimensions);
      case 'chart-doughnut':
        return this._createChartDoughnutIndicator(dimensions);
      case 'spinner':
        return this._createSpinnerIndicator(dimensions);
      case 'pulse':
        return this._createPulseIndicator(dimensions);
      case 'dots':
        return this._createDotsIndicator(dimensions);
      case 'skeleton':
        return this._createSkeletonIndicator(dimensions);
      default:
        return this._createSpinnerIndicator(dimensions);
    }
  }

  _getThemeColorVariations(count) {
    // Get the primary color from CSS variable
    const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary-bg-color').trim() || '#3498db';

    // Convert to HSL and create variations
    const variations = [];
    const step = 20; // Lightness variation step

    for (let i = 0; i < count; i++) {
      // Adjust lightness: darker to lighter
      const adjustment = (i - Math.floor(count / 2)) * step;
      variations.push(this._adjustColorLightness(primaryColor, adjustment));
    }

    return variations;
  }

  _adjustColorLightness(color, percent) {
    // Convert hex to RGB
    let r, g, b;
    if (color.startsWith('#')) {
      const hex = color.replace('#', '');
      r = parseInt(hex.substr(0, 2), 16);
      g = parseInt(hex.substr(2, 2), 16);
      b = parseInt(hex.substr(4, 2), 16);
    } else if (color.startsWith('rgb')) {
      const match = color.match(/\d+/g);
      if (match && match.length >= 3) {
        r = parseInt(match[0]);
        g = parseInt(match[1]);
        b = parseInt(match[2]);
      } else {
        return color;
      }
    } else {
      return color;
    }

    // Convert to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    // Adjust lightness
    l = Math.max(0, Math.min(1, l + percent / 100));

    // Convert back to RGB
    let r2, g2, b2;
    if (s === 0) {
      r2 = g2 = b2 = l;
    } else {
      const hue2rgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1/6) return p + (q - p) * 6 * t;
        if (t < 1/2) return q;
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r2 = hue2rgb(p, q, h + 1/3);
      g2 = hue2rgb(p, q, h);
      b2 = hue2rgb(p, q, h - 1/3);
    }

    return `rgb(${Math.round(r2 * 255)}, ${Math.round(g2 * 255)}, ${Math.round(b2 * 255)})`;
  }

  _createChartBarIndicator(dims) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', dims.width);
    svg.setAttribute('height', dims.height);
    svg.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);

    const barWidth = dims.barWidth;
    const gap = barWidth / 2;
    const numBars = 5;
    const totalWidth = (barWidth * numBars) + (gap * (numBars - 1));
    const startX = (dims.width - totalWidth) / 2;

    // Get theme color variations
    const colors = this._getThemeColorVariations(numBars);

    for (let i = 0; i < numBars; i++) {
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      const x = startX + (i * (barWidth + gap));
      rect.setAttribute('x', x);
      rect.setAttribute('width', barWidth);
      rect.setAttribute('rx', barWidth / 4);
      rect.setAttribute('class', 'busy-indicator-bar');
      rect.setAttribute('fill', colors[i]);
      rect.style.animationDelay = `${i * 0.1}s`;
      svg.appendChild(rect);
    }

    return svg;
  }

  _createChartLineIndicator(dims) {
    // Mountain silhouette - vertical lines that grow/shrink
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', dims.width);
    svg.setAttribute('height', dims.height);
    svg.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);

    const lineWidth = 4; // Medium thickness - visible but not thick
    const gap = lineWidth * 1.5;
    const numLines = Math.floor(dims.width / (lineWidth + gap));
    const totalWidth = (lineWidth * numLines) + (gap * (numLines - 1));
    const startX = (dims.width - totalWidth) / 2;

    // Get theme color variations
    const colors = this._getThemeColorVariations(numLines);

    for (let i = 0; i < numLines; i++) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      const x = startX + (i * (lineWidth + gap)) + (lineWidth / 2);

      line.setAttribute('x1', x);
      line.setAttribute('x2', x);
      line.setAttribute('y1', dims.height);
      line.setAttribute('y2', dims.height / 2);
      line.setAttribute('stroke', colors[i % colors.length]);
      line.setAttribute('stroke-width', lineWidth);
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('class', 'busy-indicator-mountain-line');
      line.style.animationDelay = `${i * 0.08}s`;
      svg.appendChild(line);
    }

    return svg;
  }

  _createChartConnectorIndicator(dims) {
    // Original line animation - wavy line with dots
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', dims.width);
    svg.setAttribute('height', dims.height);
    svg.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const points = 8;
    let d = '';

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * dims.width;
      const y = dims.height / 2;
      d += i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`;
    }

    path.setAttribute('d', d);
    path.setAttribute('class', 'busy-indicator-connector-line');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);

    // Add animated dots
    for (let i = 0; i <= points; i++) {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      const x = (i / points) * dims.width;
      const y = dims.height / 2;
      circle.setAttribute('cx', x);
      circle.setAttribute('cy', y);
      circle.setAttribute('r', '4');
      circle.setAttribute('class', 'busy-indicator-connector-dot');
      circle.style.animationDelay = `${i * 0.1}s`;
      svg.appendChild(circle);
    }

    return svg;
  }

  _createChartPieIndicator(dims) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const size = Math.min(dims.width, dims.height);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size * 0.4;

    // Create 4 pie segments
    const segments = 4;
    for (let i = 0; i < segments; i++) {
      const startAngle = (i * 360 / segments) - 90;
      const endAngle = ((i + 1) * 360 / segments) - 90;

      const path = this._createPieSegment(centerX, centerY, radius, startAngle, endAngle);
      path.setAttribute('class', 'busy-indicator-pie-segment');
      path.style.animationDelay = `${i * 0.15}s`;
      svg.appendChild(path);
    }

    return svg;
  }

  _createChartDoughnutIndicator(dims) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const size = Math.min(dims.width, dims.height);
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', `0 0 ${size} ${size}`);

    const centerX = size / 2;
    const centerY = size / 2;
    const outerRadius = size * 0.4;
    const innerRadius = size * 0.2; // Hole in the middle

    // Create 4 doughnut segments with theme color variations
    const segments = 4;
    const colors = this._getThemeColorVariations(segments);

    for (let i = 0; i < segments; i++) {
      const startAngle = (i * 360 / segments) - 90;
      const endAngle = ((i + 1) * 360 / segments) - 90;

      const path = this._createDoughnutSegment(centerX, centerY, outerRadius, innerRadius, startAngle, endAngle);
      path.setAttribute('fill', colors[i]);
      path.setAttribute('class', 'busy-indicator-doughnut-segment');
      path.style.animationDelay = `${i * 0.15}s`;
      svg.appendChild(path);
    }

    return svg;
  }

  _createPieSegment(cx, cy, r, startAngle, endAngle) {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    path.setAttribute('d', d);

    return path;
  }

  _createDoughnutSegment(cx, cy, outerR, innerR, startAngle, endAngle) {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Outer arc points
    const x1 = cx + outerR * Math.cos(startRad);
    const y1 = cy + outerR * Math.sin(startRad);
    const x2 = cx + outerR * Math.cos(endRad);
    const y2 = cy + outerR * Math.sin(endRad);

    // Inner arc points
    const x3 = cx + innerR * Math.cos(endRad);
    const y3 = cy + innerR * Math.sin(endRad);
    const x4 = cx + innerR * Math.cos(startRad);
    const y4 = cy + innerR * Math.sin(startRad);

    const largeArc = endAngle - startAngle > 180 ? 1 : 0;

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = `
      M ${x1} ${y1}
      A ${outerR} ${outerR} 0 ${largeArc} 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerR} ${innerR} 0 ${largeArc} 0 ${x4} ${y4}
      Z
    `;
    path.setAttribute('d', d);

    return path;
  }

  _createSpinnerIndicator(dims) {
    const div = document.createElement('div');
    div.classList.add('busy-indicator-spinner');
    div.style.width = `${dims.height}px`;
    div.style.height = `${dims.height}px`;
    return div;
  }

  _createPulseIndicator(dims) {
    const div = document.createElement('div');
    div.classList.add('busy-indicator-pulse');
    div.style.width = `${dims.height}px`;
    div.style.height = `${dims.height}px`;
    return div;
  }

  _createDotsIndicator(dims) {
    const container = document.createElement('div');
    container.classList.add('flex', 'gap-2');

    for (let i = 0; i < 3; i++) {
      const dot = document.createElement('div');
      dot.classList.add('busy-indicator-dot-bounce');
      dot.style.animationDelay = `${i * 0.15}s`;
      container.appendChild(dot);
    }

    return container;
  }

  _createSkeletonIndicator(dims) {
    const container = document.createElement('div');
    container.classList.add('flex', 'flex-col', 'gap-2', 'w-full');
    container.style.maxWidth = `${dims.width}px`;

    for (let i = 0; i < 3; i++) {
      const bar = document.createElement('div');
      bar.classList.add('busy-indicator-skeleton-bar');
      bar.style.height = '16px';
      bar.style.width = `${70 + (i * 10)}%`;
      container.appendChild(bar);
    }

    return container;
  }

  _applyStyle() {
    const style = `
      wc-busy-indicator {
        display: contents;
      }

      /* Chart Bar Animation - now uses inline colors from theme variations */
      .busy-indicator-bar {
        transform-origin: bottom;
        animation: bar-pulse 1.2s ease-in-out infinite;
      }

      @keyframes bar-pulse {
        0%, 100% {
          y: 60%;
          height: 40%;
          opacity: 0.7;
        }
        50% {
          y: 20%;
          height: 80%;
          opacity: 1;
        }
      }

      /* Chart Line Animation - Mountain Silhouette */
      .busy-indicator-mountain-line {
        animation: mountain-grow 1.5s ease-in-out infinite;
      }

      @keyframes mountain-grow {
        0%, 100% {
          y2: 80%;
          opacity: 0.6;
        }
        50% {
          y2: 10%;
          opacity: 1;
        }
      }

      /* Chart Connector Animation - Wavy line with dots */
      .busy-indicator-connector-line {
        stroke: var(--primary-bg-color, #3498db);
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: connector-draw 2s ease-in-out infinite;
      }

      @keyframes connector-draw {
        0% {
          stroke-dashoffset: 1000;
        }
        50% {
          stroke-dashoffset: 0;
        }
        100% {
          stroke-dashoffset: -1000;
        }
      }

      .busy-indicator-connector-dot {
        fill: var(--primary-bg-color, #3498db);
        animation: connector-dot-pulse 1.5s ease-in-out infinite;
      }

      @keyframes connector-dot-pulse {
        0%, 100% {
          r: 3;
          opacity: 0.5;
        }
        50% {
          r: 6;
          opacity: 1;
        }
      }

      /* Chart Pie Animation */
      .busy-indicator-pie-segment {
        fill: var(--primary-bg-color, #3498db);
        transform-origin: center;
        animation: pie-rotate 1.5s ease-in-out infinite;
      }

      @keyframes pie-rotate {
        0%, 100% {
          opacity: 0.3;
          transform: scale(0.95);
        }
        50% {
          opacity: 1;
          transform: scale(1.05);
        }
      }

      /* Chart Doughnut Animation - uses inline colors from theme variations */
      .busy-indicator-doughnut-segment {
        transform-origin: center;
        animation: doughnut-pulse 1.5s ease-in-out infinite;
      }

      @keyframes doughnut-pulse {
        0%, 100% {
          opacity: 0.6;
          transform: scale(0.98);
        }
        50% {
          opacity: 1;
          transform: scale(1.02);
        }
      }

      /* Spinner Animation */
      .busy-indicator-spinner {
        border: 4px solid rgba(0, 0, 0, 0.1);
        border-top-color: var(--primary-bg-color, #3498db);
        border-radius: 50%;
        animation: spinner-rotate 1s linear infinite;
      }

      @keyframes spinner-rotate {
        to {
          transform: rotate(360deg);
        }
      }

      /* Pulse Animation */
      .busy-indicator-pulse {
        background-color: var(--primary-bg-color, #3498db);
        border-radius: 50%;
        animation: pulse-scale 1.5s ease-in-out infinite;
      }

      @keyframes pulse-scale {
        0%, 100% {
          opacity: 0.6;
          transform: scale(0.8);
        }
        50% {
          opacity: 1;
          transform: scale(1.2);
        }
      }

      /* Dots Animation */
      .busy-indicator-dot-bounce {
        width: 12px;
        height: 12px;
        background-color: var(--primary-bg-color, #3498db);
        border-radius: 50%;
        animation: dot-bounce 1.4s ease-in-out infinite;
      }

      @keyframes dot-bounce {
        0%, 80%, 100% {
          transform: translateY(0);
          opacity: 0.6;
        }
        40% {
          transform: translateY(-20px);
          opacity: 1;
        }
      }

      /* Skeleton Animation */
      .busy-indicator-skeleton-bar {
        background: linear-gradient(
          90deg,
          var(--component-bg-color, #e0e0e0) 25%,
          var(--component-hover-bg-color, #f0f0f0) 50%,
          var(--component-bg-color, #e0e0e0) 75%
        );
        background-size: 200% 100%;
        border-radius: 4px;
        animation: skeleton-shimmer 1.5s ease-in-out infinite;
      }

      @keyframes skeleton-shimmer {
        0% {
          background-position: 200% 0;
        }
        100% {
          background-position: -200% 0;
        }
      }

      /* Dark mode support */
      .dark .busy-indicator-spinner {
        border-color: rgba(255, 255, 255, 0.1);
        border-top-color: var(--primary-bg-color, #3498db);
      }

      .dark .busy-indicator-skeleton-bar {
        background: linear-gradient(
          90deg,
          var(--component-bg-color, #374151) 25%,
          var(--component-hover-bg-color, #4b5563) 50%,
          var(--component-bg-color, #374151) 75%
        );
        background-size: 200% 100%;
      }
    `.trim();

    this.loadStyle('wc-busy-indicator-style', style);
  }

  // Public methods
  show() {
    this.style.display = '';
  }

  hide() {
    this.style.display = 'none';
  }

  remove() {
    super.remove();
  }
}

// Register the component
if (!customElements.get(WcBusyIndicator.is)) {
  customElements.define(WcBusyIndicator.is, WcBusyIndicator);
}

export { WcBusyIndicator };
