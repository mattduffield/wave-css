// Global configuration for Wave CSS icon components
// Check if already configured via window
const existingConfig = window.WcIconConfig || {};

export const WcIconConfig = {
  // Base URL for icon assets - can be overridden by applications
  iconBaseUrl: existingConfig.iconBaseUrl || '/dist/assets/icons',
  bundleBaseUrl: existingConfig.bundleBaseUrl || '/dist/assets/icon-bundles',
  
  // Bundles to preload on initialization
  preloadBundles: existingConfig.preloadBundles || [],
  
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
  },
  
  // Set bundles to preload
  setPreloadBundles(bundles) {
    this.preloadBundles = bundles;
  }
};

// Make it available globally (only if not already set)
if (!window.WcIconConfig) {
  window.WcIconConfig = WcIconConfig;
}