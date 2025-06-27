import { WcBaseComponent } from './wc-base-component.js';

class WcIcon extends WcBaseComponent {
  static get observedAttributes() {
    return ['name', 'icon-style', 'size', 'color', 'primary-color', 'secondary-color', 'secondary-opacity', 'swap-opacity', 'rotate', 'flip', 'base-path'];
  }

  constructor() {
    super();
    this._iconRegistry = new Map();
    this._loadedIcons = new Map();
    this._basePath = this.getAttribute('base-path') || WcIcon.defaultBasePath || '/dist/assets/icons';
  }

  static get is() {
    return 'wc-icon';
  }

  // Static property to set default base path for all icons
  static defaultBasePath = '/dist/assets/icons';

  // Static method to configure the base path globally
  static setBasePath(path) {
    WcIcon.defaultBasePath = path;
    // Update the icon registry base URL too
    if (window.wc?.iconRegistry) {
      window.wc.iconRegistry.setBaseUrl(path);
    }
  }

  async _render() {
    // Remove contents class to allow utility classes to control display
    this.classList.remove('contents');
    
    // Create the SVG directly without wrapper to allow better control
    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this._svg.setAttribute('viewBox', '0 0 512 512');
    this._svg.setAttribute('fill', 'currentColor');
    
    this._group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    this._svg.appendChild(this._group);
    this.appendChild(this._svg);

    this._applyStyles();
    await this._loadIcon();
  }

  _handleAttributeChange(name, oldValue, newValue) {
    if (name === 'name' || name === 'icon-style') {
      this._loadIcon();
    } else if (name === 'base-path') {
      this._basePath = newValue || WcIcon.defaultBasePath;
      this._loadIcon();
    } else {
      this._applyStyles();
    }
  }

  _applyStyles() {
    if (!this._svg) return;

    const size = this.getAttribute('size');
    const rotate = this.getAttribute('rotate');
    const flip = this.getAttribute('flip');
    const iconStyle = this.getAttribute('icon-style') || 'solid';

    // Only apply size if explicitly set via attribute
    if (size) {
      this._svg.style.width = size;
      this._svg.style.height = size;
    }

    // Handle rotation
    if (rotate) {
      this._svg.style.transform = `rotate(${rotate}deg)`;
    }

    // Handle flipping
    if (flip === 'horizontal') {
      this._svg.style.transform = (this._svg.style.transform || '') + ' scaleX(-1)';
    } else if (flip === 'vertical') {
      this._svg.style.transform = (this._svg.style.transform || '') + ' scaleY(-1)';
    } else if (flip === 'both') {
      this._svg.style.transform = (this._svg.style.transform || '') + ' scale(-1)';
    }

    // Handle colors based on icon style
    if (iconStyle.includes('duotone')) {
      const primaryColor = this.getAttribute('primary-color') || this.getAttribute('color') || 'currentColor';
      const secondaryColor = this.getAttribute('secondary-color') || this.getAttribute('color') || 'currentColor';
      const secondaryOpacity = this.getAttribute('secondary-opacity') || '0.4';
      const swapOpacity = this.hasAttribute('swap-opacity');

      this.style.setProperty('--fa-primary-color', primaryColor);
      this.style.setProperty('--fa-secondary-color', secondaryColor);
      this.style.setProperty('--fa-primary-opacity', swapOpacity ? secondaryOpacity : '1');
      this.style.setProperty('--fa-secondary-opacity', swapOpacity ? '1' : secondaryOpacity);
      // Remove --fa-color for duotone icons
      this.style.removeProperty('--fa-color');
    } else {
      // For non-duotone styles, use a single color
      const color = this.getAttribute('color') || 'currentColor';
      this.style.setProperty('--fa-color', color);
      // Remove duotone properties for non-duotone icons
      this.style.removeProperty('--fa-primary-color');
      this.style.removeProperty('--fa-secondary-color');
      this.style.removeProperty('--fa-primary-opacity');
      this.style.removeProperty('--fa-secondary-opacity');
    }
  }

  async _loadIcon() {
    const iconName = this.getAttribute('name');
    const iconStyle = this.getAttribute('icon-style') || 'solid';
    const basePath = this.getAttribute('base-path') || this._basePath;

    if (!iconName || !this._group) return;

    const cacheKey = `${iconStyle}/${iconName}`;

    try {
      let iconData = this._loadedIcons.get(cacheKey);

      if (!iconData) {
        // Try to fetch from the icon registry first
        iconData = this._iconRegistry.get(cacheKey);

        if (!iconData) {
          // Try to load from file
          const response = await fetch(`${basePath}/${iconStyle}/${iconName}.svg`);
          if (!response.ok) {
            console.error(`Icon not found: ${cacheKey}`);
            return;
          }

          const svgText = await response.text();
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');
          const paths = svgDoc.querySelectorAll('path');

          // Update viewBox if present in the loaded SVG
          const viewBox = svgElement?.getAttribute('viewBox');
          if (viewBox) {
            this._svg.setAttribute('viewBox', viewBox);
          }

          iconData = {
            viewBox: viewBox,
            paths: Array.from(paths).map(path => ({
              d: path.getAttribute('d'),
              opacity: path.getAttribute('opacity'),
              class: path.getAttribute('class'),
              fill: path.getAttribute('fill')
            }))
          };

          this._loadedIcons.set(cacheKey, iconData);
        }
      }

      // Clear existing paths
      this._group.innerHTML = '';

      // Update viewBox if available
      if (iconData.viewBox) {
        this._svg.setAttribute('viewBox', iconData.viewBox);
      }

      // Add paths to the group
      iconData.paths.forEach(pathData => {
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData.d);

        if (iconStyle.includes('duotone')) {
          // Handle all duotone variants (duotone, duotone-regular, duotone-light, duotone-thin)
          if (pathData.class && pathData.class.includes('fa-secondary')) {
            path.classList.add('fa-secondary');
            path.style.fill = 'var(--fa-secondary-color)';
            path.style.opacity = 'var(--fa-secondary-opacity)';
          } else {
            path.classList.add('fa-primary');
            path.style.fill = 'var(--fa-primary-color)';
            path.style.opacity = 'var(--fa-primary-opacity)';
          }
        } else {
          // Handle all other icon styles
          path.style.fill = 'var(--fa-color, currentColor)';
          if (pathData.opacity) {
            path.style.opacity = pathData.opacity;
          }
        }

        this._group.appendChild(path);
      });

    } catch (error) {
      console.error(`Error loading icon ${cacheKey}:`, error);
    }
  }

  // Static method to register icons programmatically
  static registerIcon(name, pathData, iconStyle = 'solid') {
    if (!WcIcon._globalRegistry) {
      WcIcon._globalRegistry = new Map();
    }
    const key = `${iconStyle}/${name}`;
    WcIcon._globalRegistry.set(key, pathData);
  }

  // Static method to register multiple icons
  static registerIcons(icons, iconStyle = 'solid') {
    Object.entries(icons).forEach(([name, pathData]) => {
      WcIcon.registerIcon(name, pathData, iconStyle);
    });
  }

  connectedCallback() {
    super.connectedCallback();

    // Copy global registry to instance registry
    if (WcIcon._globalRegistry) {
      WcIcon._globalRegistry.forEach((value, key) => {
        this._iconRegistry.set(key, value);
      });
    }
  }
}

customElements.define(WcIcon.is, WcIcon);

export default WcIcon;