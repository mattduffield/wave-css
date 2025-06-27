export class IconRegistry {
  constructor() {
    this.icons = new Map();
    this.baseUrl = '/dist/assets/icons';
  }

  setBaseUrl(url) {
    this.baseUrl = url;
  }

  // Register a single icon
  register(name, svgContent, style = 'solid') {
    const key = `${style}/${name}`;
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgElement = svgDoc.querySelector('svg');
    const paths = svgDoc.querySelectorAll('path');

    const iconData = {
      viewBox: svgElement?.getAttribute('viewBox') || '0 0 512 512',
      paths: Array.from(paths).map(path => ({
        d: path.getAttribute('d'),
        opacity: path.getAttribute('opacity'),
        class: path.getAttribute('class'),
        fill: path.getAttribute('fill')
      }))
    };

    this.icons.set(key, iconData);

    // Also update the global registry if wc-icon is available
    if (window.customElements.get('wc-icon')) {
      const WcIcon = window.customElements.get('wc-icon');
      WcIcon.registerIcon(name, iconData, style);
    }
  }

  // Register multiple icons from an object
  registerBatch(iconsObj, style = 'solid') {
    Object.entries(iconsObj).forEach(([name, svgContent]) => {
      this.register(name, svgContent, style);
    });
  }

  // Load icons from a JSON file containing SVG strings
  async loadFromJson(url, style = 'solid') {
    try {
      const response = await fetch(url);
      const icons = await response.json();
      this.registerBatch(icons, style);
    } catch (error) {
      console.error(`Failed to load icons from ${url}:`, error);
    }
  }

  // Preload specific icons
  async preload(iconNames, style = 'solid') {
    const promises = iconNames.map(async (name) => {
      const key = `${style}/${name}`;
      if (!this.icons.has(key)) {
        try {
          const response = await fetch(`${this.baseUrl}/${style}/${name}.svg`);
          if (response.ok) {
            const svgContent = await response.text();
            this.register(name, svgContent, style);
          }
        } catch (error) {
          console.error(`Failed to preload icon ${key}:`, error);
        }
      }
    });

    await Promise.all(promises);
  }

  // Get icon data
  get(name, style = 'solid') {
    return this.icons.get(`${style}/${name}`);
  }

  // Check if icon exists
  has(name, style = 'solid') {
    return this.icons.has(`${style}/${name}`);
  }

  // Get all registered icons
  getAll() {
    return new Map(this.icons);
  }

  // Clear registry
  clear() {
    this.icons.clear();
  }
}

// Create global instance
export const iconRegistry = new IconRegistry();

// Expose to window for easy access
if (typeof window !== 'undefined') {
  window.wc = window.wc || {};
  window.wc.iconRegistry = iconRegistry;
}