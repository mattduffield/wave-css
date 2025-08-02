import { WcBaseComponent } from './wc-base-component.js';
import { WcIconConfig } from './wc-icon-config.js';

if (!customElements.get('wc-fa-icon')) {
  // Global icon bundle storage
  const iconBundles = new Map();
  
  // Track which bundles are loaded or loading
  const loadedBundles = new Set();
  const loadingBundles = new Map();
  
  class WcFaIcon extends WcBaseComponent {
    static get observedAttributes() {
      return ['name', 'icon-style', 'size', 'color', 'primary-color', 'secondary-color', 'secondary-opacity', 'swap-opacity', 'rotate', 'flip', 'spin', 'pulse'];
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
      'exclamation-circle': 'circle-exclamation',
      'exclamation-triangle': 'triangle-exclamation',
      'error': 'circle-xmark',
      'times-circle': 'circle-xmark',
      'info': 'circle-info',
      'info-circle': 'circle-info',
      'question-circle': 'circle-question',
      'check-circle': 'circle-check',
      'check-square': 'square-check',
      'help': 'circle-question',
      'picture': 'image',
      'photo': 'image',
      'play-circle': 'circle-play',
      'pause-circle': 'circle-pause',
      'plus-circle': 'circle-plus',
      'file-download': 'file-arrow-down',
      'user-circle': 'circle-user',
      'allergies': 'hand-dots',
      'heartbeat': 'heart-pulse',
      'chalkboard-teacher': 'chalkboard-user',
      'phone-alt': 'phone-flip',
      'users-cog': 'users-gear',
      'user-friends': 'user-group',
      'calendar-times': 'calendar-xmark',
      'calendar-time': 'calendar-clock',
      'calendar-alt': 'calendar-days',
      'map-marker-alt': 'location-dot',
      'exchange-alt': 'right-left',
      'sticky-note': 'note-sticky',
      'phone-square': 'square-phone',
      'phone-square-alt': 'square-phone-flip',
      'phone-square-down': 'square-phone-hangup',
      'history': 'rectangle-history'
    };

    constructor() {
      super();
    }

    static get is() {
      return 'wc-fa-icon';
    }

    async _render() {
      // Remove contents class to allow utility classes to control display
      this.classList.remove('contents');
      
      // Add CSS animations for spinners
      if (!document.getElementById('wc-fa-icon-animations')) {
        const style = document.createElement('style');
        style.id = 'wc-fa-icon-animations';
        style.textContent = `
          @keyframes wc-fa-icon-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes wc-fa-icon-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          wc-fa-icon[spin] svg {
            animation: wc-fa-icon-spin 1s linear infinite;
          }
          wc-fa-icon[pulse] svg {
            animation: wc-fa-icon-pulse 2s ease-in-out infinite;
          }
        `;
        document.head.appendChild(style);
      }
      
      // Clear any existing content before rendering
      this.innerHTML = '';
      
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
      const iconName = WcFaIcon.iconAliases[requestedName] || requestedName;
      const iconStyle = this.getAttribute('icon-style') || 'solid';
      
      // Check if we need to load the bundle for this style
      if (!loadedBundles.has(iconStyle) && !loadingBundles.has(iconStyle)) {
        // Auto-load the appropriate bundle
        const bundlePath = `${WcIconConfig.bundleBaseUrl}/${iconStyle}-icons.json`;
        // console.log(`[wc-fa-icon] Auto-loading bundle for style: ${iconStyle} from: ${bundlePath}`);
        
        const loadPromise = WcFaIcon.loadBundle(bundlePath)
          .then(count => {
            loadedBundles.add(iconStyle);
            loadingBundles.delete(iconStyle);
            // console.log(`[wc-fa-icon] Auto-loaded ${count} ${iconStyle} icons`);
            return count;
          })
          .catch(err => {
            console.error(`[wc-fa-icon] Failed to auto-load ${iconStyle} bundle:`, err);
            loadingBundles.delete(iconStyle);
            // Mark as loaded to prevent repeated attempts
            loadedBundles.add(iconStyle);
            return 0;
          });
        
        loadingBundles.set(iconStyle, loadPromise);
      }
      
      // Wait for bundle to load if it's loading
      if (loadingBundles.has(iconStyle)) {
        await loadingBundles.get(iconStyle);
      }

      try {
        // Look for icon with style prefix
        const bundleKey = `${iconStyle}/${iconName}`;
        let iconData = iconBundles.get(bundleKey);
        
        // Debug: Log what we're looking for
        if (!iconData && iconStyle === 'duotone') {
          console.log(`[wc-fa-icon] Looking for duotone icon: ${iconName}`);
          console.log(`[wc-fa-icon] Loaded bundles:`, Array.from(loadedBundles));
          console.log(`[wc-fa-icon] Total icons in cache:`, iconBundles.size);
          console.log(`[wc-fa-icon] Sample keys:`, Array.from(iconBundles.keys()).slice(0, 5));
        }

        if (!iconData) {
          // Icon not found in bundles
          console.warn(`Icon not found in loaded bundles: ${iconName} (style: ${iconStyle})`);
          console.warn(`Available icons:`, iconBundles.size > 0 ? Array.from(iconBundles.keys()).slice(0, 10) : 'No icons loaded');
          console.warn(`Bundle URL was: ${WcIconConfig.bundleBaseUrl}/${iconStyle}-icons.json`);
          
          // Optional: Show a placeholder or error icon
          this._group.innerHTML = '';
          const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          text.setAttribute('x', '256');
          text.setAttribute('y', '256');
          text.setAttribute('text-anchor', 'middle');
          text.setAttribute('dominant-baseline', 'middle');
          text.setAttribute('font-size', '200');
          text.textContent = '?';
          this._group.appendChild(text);
          return;
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
        console.error(`Error loading icon ${bundleKey}:`, error);
      }
    }

    // Static method to load icon bundle from JSON
    static async loadBundle(bundleUrl) {
      try {
        const response = await fetch(bundleUrl);
        if (!response.ok) {
          throw new Error(`Failed to load icon bundle: ${bundleUrl}`);
        }
        
        const bundle = await response.json();
        let loadedCount = 0;
        
        // Store each icon in the bundle
        // Determine the style from the URL
        const match = bundleUrl.match(/\/([^\/]+)-icons\.json$/);
        const style = match ? match[1] : 'unknown';
        
        for (const [key, iconData] of Object.entries(bundle)) {
          // Store with style prefix to avoid conflicts between styles
          const storeKey = `${style}/${key}`;
          iconBundles.set(storeKey, iconData);
          loadedCount++;
        }
        
        // console.log(`[wc-fa-icon] Loaded ${loadedCount} icons from ${bundleUrl}`);
        
        // Mark the style as loaded (already determined above)
        if (style !== 'unknown') {
          loadedBundles.add(style);
          // Also remove from loading if it was there
          loadingBundles.delete(style);
        }
        
        return loadedCount;
      } catch (error) {
        console.error('[wc-fa-icon] Error loading bundle:', error);
        throw error;
      }
    }
    
    // Static method to load multiple bundles
    static async loadBundles(bundleUrls) {
      const results = await Promise.allSettled(
        bundleUrls.map(url => WcFaIcon.loadBundle(url))
      );
      
      const totalLoaded = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value, 0);
      
      const failed = results.filter(r => r.status === 'rejected').length;
      
      // console.log(`[wc-fa-icon] Bundles loaded: ${totalLoaded} icons total${failed ? `, ${failed} bundles failed` : ''}`);
      return { totalLoaded, failed };
    }

    // Static method to register icons programmatically
    static registerIcon(name, pathData, iconStyle = 'solid') {
      // Store without style prefix to match bundle format
      iconBundles.set(name, pathData);
    }

    // Static method to register multiple icons
    static registerIcons(icons, iconStyle = 'solid') {
      Object.entries(icons).forEach(([name, pathData]) => {
        WcFaIcon.registerIcon(name, pathData, iconStyle);
      });
    }

    // Static method to get bundle stats
    static getBundleStats() {
      return {
        loadedIcons: iconBundles.size,
        iconKeys: Array.from(iconBundles.keys())
      };
    }

    // Static method to clear all bundles
    static clearBundles() {
      iconBundles.clear();
    }

    // Static method to check if an icon is loaded
    static isIconLoaded(name, style = 'solid') {
      const iconName = WcFaIcon.iconAliases[name] || name;
      // Check with style prefix
      return iconBundles.has(`${style}/${iconName}`);
    }
    
    // Static method to preload configured bundles
    static async preloadConfiguredBundles() {
      if (WcIconConfig.preloadBundles && WcIconConfig.preloadBundles.length > 0) {
        // console.log('[wc-fa-icon] Preloading configured bundles:', WcIconConfig.preloadBundles);
        
        // Mark bundles as loading to prevent duplicate loads
        const loadPromises = [];
        
        for (const style of WcIconConfig.preloadBundles) {
          if (!loadedBundles.has(style) && !loadingBundles.has(style)) {
            const bundleUrl = `${WcIconConfig.bundleBaseUrl}/${style}-icons.json`;
            const loadPromise = WcFaIcon.loadBundle(bundleUrl)
              .then(count => {
                loadedBundles.add(style);
                loadingBundles.delete(style);
                return count;
              })
              .catch(err => {
                console.error(`[wc-fa-icon] Failed to preload ${style} bundle:`, err);
                loadingBundles.delete(style);
                loadedBundles.add(style); // Mark as loaded to prevent retries
                return 0;
              });
            
            loadingBundles.set(style, loadPromise);
            loadPromises.push(loadPromise);
          }
        }
        
        const results = await Promise.all(loadPromises);
        const totalLoaded = results.reduce((sum, count) => sum + count, 0);
        // console.log(`[wc-fa-icon] Preloaded ${totalLoaded} icons from ${loadPromises.length} bundles`);
        return { totalLoaded, failed: results.filter(c => c === 0).length };
      }
      return { totalLoaded: 0, failed: 0 };
    }
  }
  
  customElements.define(WcFaIcon.is, WcFaIcon);
  
  // Export for easier access
  window.WcFaIcon = WcFaIcon;
  
  // Auto-preload bundles if configured
  if (WcIconConfig.preloadBundles && WcIconConfig.preloadBundles.length > 0) {
    // Start preloading immediately
    WcFaIcon.preloadConfiguredBundles();
  }
}