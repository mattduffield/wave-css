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
 *   <wc-busy-indicator type="chart-ecg"></wc-busy-indicator>
 *   <wc-busy-indicator type="horizontal-bar"></wc-busy-indicator>
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
 *   - type: Type of indicator (chart-bar, chart-line, chart-ecg, horizontal-bar, chart-pie, spinner, pulse, dots, skeleton)
 *   - text: Optional text to display below indicator
 *   - size: Size of indicator (small, medium, large) - default: medium
 *   - color: Custom color (defaults to theme primary color)
 *   - color-variation: Color variation mode (standard, subtle, off) - defaults to standard for chart-bar/chart-doughnut, off for others
 *   - color-levels: Comma-separated surface levels for standard mode (e.g. "3,5,7,9,11") - defaults to "4,6,7,8,10"
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcBusyIndicator extends WcBaseComponent {
  static get is() {
    return 'wc-busy-indicator';
  }

  static get observedAttributes() {
    return ['type', 'text', 'size', 'color', 'color-variation', 'color-levels'];
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
    if (['type', 'text', 'size', 'color', 'color-variation', 'color-levels'].includes(attrName)) {
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
      case 'chart-ecg':
        return this._createChartEcgIndicator(dimensions);
      case 'horizontal-bar':
        return this._createHorizontalBarIndicator(dimensions);
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

  _getColorVariationMode() {
    // Get the color-variation attribute
    const attr = this.getAttribute('color-variation');

    // If explicitly set, use that value
    if (attr !== null && ['standard', 'subtle', 'off'].includes(attr)) {
      return attr;
    }

    // Default behavior varies by type
    const type = this.getAttribute('type') || 'spinner';
    const variationTypes = ['chart-bar', 'chart-pie', 'chart-doughnut'];
    return variationTypes.includes(type) ? 'standard' : 'off';
  }

  _getThemeColorVariations(count) {
    const mode = this._getColorVariationMode();
    const variations = [];

    if (mode === 'off') {
      // All same color
      const primaryColor = this._getPrimaryColor();
      for (let i = 0; i < count; i++) {
        variations.push(primaryColor);
      }
      return variations;
    }

    if (mode === 'standard') {
      // Use --surface-x variables for strong, visible differences
      // Get custom levels from attribute or use defaults
      const customLevels = this.getAttribute('color-levels');
      let surfaceLevels;

      if (customLevels) {
        // Parse comma-separated values
        surfaceLevels = customLevels.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n));
      }

      // Fallback to defaults if no valid custom levels
      if (!surfaceLevels || surfaceLevels.length === 0) {
        surfaceLevels = [4, 6, 7, 8, 10];
      }

      for (let i = 0; i < count; i++) {
        const level = surfaceLevels[i % surfaceLevels.length];
        const color = getComputedStyle(document.documentElement)
          .getPropertyValue(`--surface-${level}`)
          .trim();

        if (color) {
          variations.push(color);
        } else {
          // Fallback if surface variables don't exist
          const primaryColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--primary-bg-color')
            .trim() || '#3498db';
          const step = (i - Math.floor(count / 2)) * 40; // Large steps for visibility
          variations.push(this._adjustColorLightness(primaryColor, step));
        }
      }
      return variations;
    }

    if (mode === 'subtle') {
      // Use HSL adjustments with moderate steps
      const primaryColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--primary-bg-color')
        .trim() || '#3498db';

      // Subtle steps: -20%, -10%, 0%, +10%, +20%, +30%
      const steps = [-20, -10, 0, 10, 20, 30];

      for (let i = 0; i < count; i++) {
        const step = steps[i % steps.length];
        variations.push(this._adjustColorLightness(primaryColor, step));
      }
      return variations;
    }

    return variations;
  }

  _getPrimaryColor() {
    return getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-500')
      .trim() || getComputedStyle(document.documentElement)
      .getPropertyValue('--primary-bg-color')
      .trim() || '#3498db';
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

    // Get colors based on color-variation mode
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
    // Animated line chart like Dribbble example - line graph with moving dots
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', dims.width);
    svg.setAttribute('height', dims.height);
    svg.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);

    const primaryColor = this._getPrimaryColor();
    const numPoints = 8;
    const padding = 10;

    // Generate random-ish data points for the line
    const points = [];
    for (let i = 0; i < numPoints; i++) {
      const x = padding + (i / (numPoints - 1)) * (dims.width - padding * 2);
      const normalizedPos = i / (numPoints - 1);
      // Create a wave-like pattern
      const baseY = dims.height * 0.5;
      const variation = Math.sin(normalizedPos * Math.PI * 2) * (dims.height * 0.25);
      const y = baseY + variation;
      points.push({ x, y });
    }

    // Create the line path
    let pathData = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpX = (prev.x + curr.x) / 2;
      pathData += ` Q ${cpX} ${curr.y} ${curr.x} ${curr.y}`;
    }

    // Background line (static)
    const bgPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    bgPath.setAttribute('d', pathData);
    bgPath.setAttribute('fill', 'none');
    bgPath.setAttribute('stroke', primaryColor);
    bgPath.setAttribute('stroke-width', '3');
    bgPath.setAttribute('opacity', '0.2');
    svg.appendChild(bgPath);

    // Animated line (draws in)
    const animPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    animPath.setAttribute('d', pathData);
    animPath.setAttribute('fill', 'none');
    animPath.setAttribute('stroke', primaryColor);
    animPath.setAttribute('stroke-width', '3');
    animPath.setAttribute('class', 'busy-indicator-chart-line-path');
    svg.appendChild(animPath);

    // Add animated dots at each point
    points.forEach((point, i) => {
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', point.x);
      circle.setAttribute('cy', point.y);
      circle.setAttribute('r', '5');
      circle.setAttribute('fill', primaryColor);
      circle.setAttribute('class', 'busy-indicator-chart-line-dot');
      circle.style.animationDelay = `${i * 0.15}s`;
      svg.appendChild(circle);
    });

    return svg;
  }

  _createHorizontalBarIndicator(dims) {
    // Simple parallax scrolling horizontal bars - like a 2D background pattern
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', dims.width);
    svg.setAttribute('height', dims.height);
    svg.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);

    const numLines = 5;
    const lineSpacing = dims.height / (numLines + 1);
    const primaryColor = this._getPrimaryColor();

    for (let i = 0; i < numLines; i++) {
      const y = lineSpacing * (i + 1);

      // Create thicker horizontal line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('x2', dims.width);
      line.setAttribute('y1', y);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', primaryColor);
      line.setAttribute('stroke-width', '4'); // Increased from 2 to 4
      line.setAttribute('stroke-linecap', 'round');
      line.setAttribute('class', 'busy-indicator-horizontal-bar');
      line.setAttribute('opacity', 0.3 + (i * 0.15)); // Varying opacity for depth

      // Different animation delays and durations for parallax effect
      line.style.animationDelay = `${i * 0.2}s`;
      line.style.animationDuration = `${3 + (i * 0.5)}s`;

      svg.appendChild(line);
    }

    return svg;
  }

  _createChartEcgIndicator(dims) {
    // Live dashboard style - continuous wavy line that animates like ECG/heartbeat monitor
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', dims.width);
    svg.setAttribute('height', dims.height);
    svg.setAttribute('viewBox', `0 0 ${dims.width} ${dims.height}`);

    // Create smooth wavy path with multiple points for realistic line chart look
    const numPoints = 30;
    const amplitude = dims.height * 0.35;
    const centerY = dims.height / 2;

    // Generate smooth wave path using quadratic curves
    let pathData = '';
    for (let i = 0; i <= numPoints; i++) {
      const x = (i / numPoints) * dims.width;
      const normalizedX = i / numPoints;

      // Create wave pattern with varying frequency for live dashboard effect
      const wave1 = Math.sin(normalizedX * Math.PI * 4) * 0.5;
      const wave2 = Math.sin(normalizedX * Math.PI * 8) * 0.3;
      const y = centerY + (wave1 + wave2) * amplitude;

      if (i === 0) {
        pathData = `M ${x} ${y}`;
      } else {
        // Use quadratic curves for smooth interpolation
        const prevX = ((i - 1) / numPoints) * dims.width;
        const controlX = (prevX + x) / 2;
        pathData += ` Q ${controlX} ${y} ${x} ${y}`;
      }
    }

    // Create glow effect layer (underneath)
    const glowPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    glowPath.setAttribute('d', pathData);
    glowPath.setAttribute('class', 'busy-indicator-ecg-line-glow');
    glowPath.setAttribute('stroke-width', '6');
    glowPath.setAttribute('fill', 'none');
    glowPath.setAttribute('opacity', '0.3');
    svg.appendChild(glowPath);

    // Create main animated path (on top)
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('class', 'busy-indicator-ecg-line');
    path.setAttribute('stroke-width', '3');
    path.setAttribute('fill', 'none');
    svg.appendChild(path);

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

    // Create 4 pie segments with color variations like doughnut
    const segments = 4;
    const mode = this._getColorVariationMode();
    const colors = this._getThemeColorVariations(segments);

    for (let i = 0; i < segments; i++) {
      const startAngle = (i * 360 / segments) - 90;
      const endAngle = ((i + 1) * 360 / segments) - 90;

      const path = this._createPieSegment(centerX, centerY, radius, startAngle, endAngle);
      path.setAttribute('fill', colors[i]);

      // If mode is 'off', add opacity variation to show segments
      if (mode === 'off') {
        path.setAttribute('opacity', 0.4 + (i * 0.15));
      }

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

    // Create 4 doughnut segments
    const segments = 4;
    const mode = this._getColorVariationMode();
    const colors = this._getThemeColorVariations(segments);

    for (let i = 0; i < segments; i++) {
      const startAngle = (i * 360 / segments) - 90;
      const endAngle = ((i + 1) * 360 / segments) - 90;

      const path = this._createDoughnutSegment(centerX, centerY, outerRadius, innerRadius, startAngle, endAngle);
      path.setAttribute('fill', colors[i]);

      // If mode is 'off', add opacity variation to show segments
      if (mode === 'off') {
        path.setAttribute('opacity', 0.4 + (i * 0.15));
      }

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

      /* Chart Line Animation - Animated line graph with dots */
      .busy-indicator-chart-line-path {
        stroke-dasharray: 1000;
        stroke-dashoffset: 1000;
        animation: chart-line-draw 2.5s ease-in-out infinite;
      }

      .busy-indicator-chart-line-dot {
        animation: chart-line-dot-pulse 1.5s ease-in-out infinite;
      }

      @keyframes chart-line-draw {
        0% {
          stroke-dashoffset: 1000;
          opacity: 0.3;
        }
        50% {
          stroke-dashoffset: 0;
          opacity: 1;
        }
        100% {
          stroke-dashoffset: -1000;
          opacity: 0.3;
        }
      }

      @keyframes chart-line-dot-pulse {
        0%, 100% {
          r: 4;
          opacity: 0.5;
        }
        50% {
          r: 6;
          opacity: 1;
        }
      }

      /* Horizontal Bar Animation - Simple Parallax Scrolling */
      .busy-indicator-horizontal-bar {
        animation: horizontal-bar-scroll 3s linear infinite;
      }

      @keyframes horizontal-bar-scroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }

      /* Chart ECG Animation - Live Dashboard ECG Style */
      .busy-indicator-ecg-line {
        stroke: var(--primary-500, var(--primary-bg-color, #3498db));
        stroke-dasharray: 1000;
        stroke-dashoffset: 0;
        animation: ecg-line-flow 2.5s ease-in-out infinite;
      }

      .busy-indicator-ecg-line-glow {
        stroke: var(--primary-400, var(--primary-bg-color, #3498db));
        filter: blur(3px);
        animation: ecg-line-glow 2.5s ease-in-out infinite;
      }

      @keyframes ecg-line-flow {
        0% {
          stroke-dashoffset: 0;
          opacity: 1;
        }
        50% {
          stroke-dashoffset: -200;
          opacity: 0.9;
        }
        100% {
          stroke-dashoffset: -400;
          opacity: 1;
        }
      }

      @keyframes ecg-line-glow {
        0%, 100% {
          opacity: 0.2;
        }
        50% {
          opacity: 0.5;
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
