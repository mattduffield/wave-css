import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-icon')) {
  // Global icon cache shared across all instances
  const globalIconCache = new Map();
  const pendingRequests = new Map();
  
  class WcIcon extends WcBaseComponent {
    static get observedAttributes() {
      return ['name', 'icon-style', 'size', 'color', 'primary-color', 'secondary-color', 'secondary-opacity', 'swap-opacity', 'rotate', 'flip', 'base-path', 'spin', 'pulse'];
    }

    // Font Awesome icon aliases mapping
    static iconAliases = {
      'home': 'house',
      'search': 'magnifying-glass',
      'edit': 'pen-to-square',
      'save': 'floppy-disk',
      'undo': 'arrow-rotate-left',
      'redo': 'arrow-rotate-right',
      'sign-out': 'right-from-bracket',
      'sign-in': 'right-to-bracket',
      'sign-out-alt': 'arrow-right-from-bracket',
      'sign-in-alt': 'arrow-right-to-bracket',
      'settings': 'gear',
      'cog': 'gear',
      'cogs': 'gears',
      'trash-alt': 'trash-can',
      'delete': 'trash',
      'remove': 'xmark',
      'clear': 'eraser',
      'close': 'xmark',
      'times': 'xmark',
      'search-plus': 'magnifying-glass-plus',
      'search-minus': 'magnifying-glass-minus',
      'zoom-in': 'magnifying-glass-plus',
      'zoom-out': 'magnifying-glass-minus',
      'power-off': 'power-off',
      'log-out': 'right-from-bracket',
      'log-in': 'right-to-bracket',
      'shopping-cart': 'cart-shopping',
      'chart-bar': 'chart-column',
      'bar-chart': 'chart-column',
      'line-chart': 'chart-line',
      'area-chart': 'chart-area',
      'pie-chart': 'chart-pie',
      'refresh': 'arrows-rotate',
      'sync': 'arrows-rotate',
      'mail': 'envelope',
      'email': 'envelope',
      'warning': 'triangle-exclamation',
      'exclamation-triangle': 'triangle-exclamation',
      'error': 'circle-xmark',
      'times-circle': 'circle-xmark',
      'info': 'circle-info',
      'info-circle': 'circle-info',
      'question-circle': 'circle-question',
      'help': 'circle-question',
      'picture': 'image',
      'photo': 'image',
    };

    constructor() {
      super();
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
      
      // Add CSS animations for spinners
      if (!document.getElementById('wc-icon-animations')) {
        const style = document.createElement('style');
        style.id = 'wc-icon-animations';
        style.textContent = `
          @keyframes wc-icon-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes wc-icon-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          wc-icon[spin] svg {
            animation: wc-icon-spin 1s linear infinite;
          }
          wc-icon[pulse] svg {
            animation: wc-icon-pulse 2s ease-in-out infinite;
          }
        `;
        document.head.appendChild(style);
      }
      
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
      } else if (name === 'spin' || name === 'pulse') {
        // Animation attributes are handled by CSS, no JS needed
        return;
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

      // Handle rotation and flipping
      let transform = '';
      
      // Note: When spin is active, the CSS animation handles rotation
      // Only apply static rotation if spin is not active
      if (rotate && !this.hasAttribute('spin')) {
        transform += `rotate(${rotate}deg)`;
      }

      // Handle flipping
      if (flip === 'horizontal') {
        transform += ' scaleX(-1)';
      } else if (flip === 'vertical') {
        transform += ' scaleY(-1)';
      } else if (flip === 'both') {
        transform += ' scale(-1)';
      }
      
      if (transform) {
        this._svg.style.transform = transform.trim();
      } else {
        this._svg.style.removeProperty('transform');
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
      const requestedName = this.getAttribute('name');
      if (!requestedName || !this._group) return;
      
      // Resolve alias to actual icon name
      const iconName = WcIcon.iconAliases[requestedName] || requestedName;
      const iconStyle = this.getAttribute('icon-style') || 'solid';
      const basePath = this.getAttribute('base-path') || this._basePath;

      const cacheKey = `${basePath}/${iconStyle}/${iconName}`;

      try {
        // Check global cache first
        let iconData = globalIconCache.get(cacheKey);

        if (!iconData) {
          // Check if there's already a pending request for this icon
          let pendingRequest = pendingRequests.get(cacheKey);
          
          if (pendingRequest) {
            // Wait for the existing request to complete
            iconData = await pendingRequest;
          } else {
            // Create and immediately store the pending request to prevent race conditions
            const requestPromise = (async () => {
              // Check static registry first
              if (WcIcon._globalRegistry?.has(`${iconStyle}/${iconName}`)) {
                const data = WcIcon._globalRegistry.get(`${iconStyle}/${iconName}`);
                globalIconCache.set(cacheKey, data);
                return data;
              }

              // Fetch from network
              const response = await fetch(`${basePath}/${iconStyle}/${iconName}.svg`);
              if (!response.ok) {
                console.error(`Icon not found: ${iconStyle}/${iconName}`);
                return null;
              }

              const svgText = await response.text();
              const parser = new DOMParser();
              const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
              const svgElement = svgDoc.querySelector('svg');
              const paths = svgDoc.querySelectorAll('path');

              const iconData = {
                viewBox: svgElement?.getAttribute('viewBox'),
                paths: Array.from(paths).map(path => ({
                  d: path.getAttribute('d'),
                  opacity: path.getAttribute('opacity'),
                  class: path.getAttribute('class'),
                  fill: path.getAttribute('fill')
                }))
              };

              // Store in global cache
              globalIconCache.set(cacheKey, iconData);
              return iconData;
            })();

            // Store the pending request IMMEDIATELY to prevent race conditions
            pendingRequests.set(cacheKey, requestPromise);

            try {
              iconData = await requestPromise;
            } finally {
              // Clean up the pending request
              pendingRequests.delete(cacheKey);
            }
          }
        }

        // If icon data couldn't be loaded, exit
        if (!iconData) return;

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

    // Static method to preload icons
    static async preloadIcons(iconList) {
      const promises = iconList.map(async (iconConfig) => {
        const { name, style = 'solid', basePath = WcIcon.defaultBasePath } = 
          typeof iconConfig === 'string' ? { name: iconConfig } : iconConfig;
        
        const iconName = WcIcon.iconAliases[name] || name;
        const cacheKey = `${basePath}/${style}/${iconName}`;
        
        // Skip if already cached
        if (globalIconCache.has(cacheKey)) return;
        
        // Skip if there's already a pending request
        if (pendingRequests.has(cacheKey)) {
          return pendingRequests.get(cacheKey);
        }
        
        // Create the request directly without creating a component
        const requestPromise = (async () => {
          // Check static registry first
          if (WcIcon._globalRegistry?.has(`${style}/${iconName}`)) {
            const data = WcIcon._globalRegistry.get(`${style}/${iconName}`);
            globalIconCache.set(cacheKey, data);
            return data;
          }

          // Fetch from network
          const response = await fetch(`${basePath}/${style}/${iconName}.svg`);
          if (!response.ok) {
            console.error(`Icon not found: ${style}/${iconName}`);
            return null;
          }

          const svgText = await response.text();
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');
          const paths = svgDoc.querySelectorAll('path');

          const iconData = {
            viewBox: svgElement?.getAttribute('viewBox'),
            paths: Array.from(paths).map(path => ({
              d: path.getAttribute('d'),
              opacity: path.getAttribute('opacity'),
              class: path.getAttribute('class'),
              fill: path.getAttribute('fill')
            }))
          };

          // Store in global cache
          globalIconCache.set(cacheKey, iconData);
          return iconData;
        })();

        // Store the pending request
        pendingRequests.set(cacheKey, requestPromise);

        try {
          return await requestPromise;
        } finally {
          // Clean up the pending request
          pendingRequests.delete(cacheKey);
        }
      });
      
      await Promise.all(promises);
    }

    // Static method to clear cache (useful for testing or memory management)
    static clearCache() {
      globalIconCache.clear();
      pendingRequests.clear();
    }

    // Static method to get cache stats
    static getCacheStats() {
      return {
        cachedIcons: globalIconCache.size,
        pendingRequests: pendingRequests.size,
        cacheKeys: Array.from(globalIconCache.keys())
      };
    }

  }
  
  customElements.define(WcIcon.is, WcIcon);
}

