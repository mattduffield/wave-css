import { WcBaseComponent } from './wc-base-component.js';

class WcIcon extends WcBaseComponent {
  static get observedAttributes() {
    return ['name', 'icon-style', 'size', 'color', 'primary-color', 'secondary-color', 'secondary-opacity', 'swap-opacity', 'rotate', 'flip'];
  }

  constructor() {
    super();
    this._iconRegistry = new Map();
    this._loadedIcons = new Map();
  }

  static get is() {
    return 'wc-icon';
  }

  async _render() {
    this.classList.add('contents');

    const wrapper = document.createElement('span');
    wrapper.className = 'wc-icon-wrapper';
    wrapper.innerHTML = `
            <svg class="wc-icon-svg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
                <g class="wc-icon-group"></g>
            </svg>
        `;

    this.appendChild(wrapper);
    this._svg = wrapper.querySelector('.wc-icon-svg');
    this._group = wrapper.querySelector('.wc-icon-group');

    this._applyStyles();
    await this._loadIcon();
  }

  _handleAttributeChange(name, oldValue, newValue) {
    if (name === 'name' || name === 'icon-style') {
      this._loadIcon();
    } else {
      this._applyStyles();
    }
  }

  _applyStyles() {
    if (!this._svg) return;

    const size = this.getAttribute('size') || '1em';
    const rotate = this.getAttribute('rotate');
    const flip = this.getAttribute('flip');
    const iconStyle = this.getAttribute('icon-style') || 'solid';

    this._svg.style.width = size;
    this._svg.style.height = size;

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
    if (iconStyle === 'duotone') {
      const primaryColor = this.getAttribute('primary-color') || this.getAttribute('color') || 'currentColor';
      const secondaryColor = this.getAttribute('secondary-color') || this.getAttribute('color') || 'currentColor';
      const secondaryOpacity = this.getAttribute('secondary-opacity') || '0.4';
      const swapOpacity = this.hasAttribute('swap-opacity');

      this.style.setProperty('--fa-primary-color', primaryColor);
      this.style.setProperty('--fa-secondary-color', secondaryColor);
      this.style.setProperty('--fa-primary-opacity', swapOpacity ? secondaryOpacity : '1');
      this.style.setProperty('--fa-secondary-opacity', swapOpacity ? '1' : secondaryOpacity);
    } else {
      // For non-duotone styles, use a single color
      const color = this.getAttribute('color') || 'currentColor';
      this.style.setProperty('--fa-color', color);
    }
  }

  async _loadIcon() {
    const iconName = this.getAttribute('name');
    const iconStyle = this.getAttribute('icon-style') || 'solid';

    if (!iconName || !this._group) return;

    const cacheKey = `${iconStyle}/${iconName}`;

    try {
      let iconData = this._loadedIcons.get(cacheKey);

      if (!iconData) {
        // Try to fetch from the icon registry first
        iconData = this._iconRegistry.get(cacheKey);

        if (!iconData) {
          // Try to load from file
          const response = await fetch(`/dist/assets/icons/${iconStyle}/${iconName}.svg`);
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

        if (iconStyle === 'duotone') {
          // Handle duotone icons
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