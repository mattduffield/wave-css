// Global configuration for Wave CSS icon components
export const WcIconConfig = {
  // Base URL for icon assets - can be overridden by applications
  iconBaseUrl: '/dist/assets/icons',
  bundleBaseUrl: '/dist/assets/icon-bundles',
  
  // CDN example:
  // iconBaseUrl: 'https://cdn.example.com/wave-css/icons',
  // bundleBaseUrl: 'https://cdn.example.com/wave-css/icon-bundles',
  
  // Configure icon base URLs
  setIconBaseUrl(url) {
    this.iconBaseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  },
  
  setBundleBaseUrl(url) {
    this.bundleBaseUrl = url.replace(/\/$/, ''); // Remove trailing slash
  },
  
  // Configure both at once
  setBaseUrl(url) {
    const baseUrl = url.replace(/\/$/, '');
    this.iconBaseUrl = `${baseUrl}/icons`;
    this.bundleBaseUrl = `${baseUrl}/icon-bundles`;
  }
};

// Allow global configuration
window.WcIconConfig = WcIconConfig;