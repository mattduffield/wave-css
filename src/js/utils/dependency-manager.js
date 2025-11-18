/**
 * WcDependencyManager - Centralized dependency loading for Wave CSS
 *
 * Solves race conditions by:
 * - Loading each library only once (deduplication)
 * - Providing promises that multiple components can await
 * - Tracking overall ready state for application consumption
 * - Handling timeouts and errors gracefully
 *
 * Usage:
 *
 * // In components:
 * await wc.DependencyManager.load('IMask');
 *
 * // In application code:
 * await wc.ready;
 * console.log('All Wave CSS dependencies loaded!');
 */

class WcDependencyManager {
  constructor() {
    // Track loading state for each dependency
    this._dependencies = new Map();

    // Track all registered dependencies that need to load
    this._registeredDependencies = new Set();

    // Overall ready state
    this._readyPromise = null;
    this._readyResolve = null;
    this._readyReject = null;

    // Configuration for each dependency
    this._dependencyConfigs = {
      'IMask': {
        url: 'https://cdnjs.cloudflare.com/ajax/libs/imask/7.6.1/imask.min.js',
        globalName: 'IMask',
        timeout: 10000
      },
      'CodeMirror': {
        urls: [
          'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css',
          'https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.js'
        ],
        globalName: 'CodeMirror',
        timeout: 15000
      },
      'Tabulator': {
        urls: [
          'https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js',
          'https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css'
        ],
        globalName: 'Tabulator',
        timeout: 15000
      }
    };

    // Initialize ready promise
    this._initializeReadyPromise();
  }

  /**
   * Initialize the ready promise that applications can await
   */
  _initializeReadyPromise() {
    this._readyPromise = new Promise((resolve, reject) => {
      this._readyResolve = resolve;
      this._readyReject = reject;
    });
  }

  /**
   * Register a dependency as required (called by components during construction)
   * This lets us know what needs to load before we're "ready"
   */
  register(dependencyName) {
    this._registeredDependencies.add(dependencyName);
  }

  /**
   * Load a dependency (returns promise that resolves when loaded)
   * Handles deduplication - multiple calls return the same promise
   */
  async load(dependencyName, customConfig = null) {
    // Check if already loaded
    if (this._dependencies.has(dependencyName)) {
      return this._dependencies.get(dependencyName);
    }

    // Get configuration
    const config = customConfig || this._dependencyConfigs[dependencyName];
    if (!config) {
      const error = new Error(`Unknown dependency: ${dependencyName}. Please provide a configuration.`);
      console.error(error);
      return Promise.reject(error);
    }

    // Create loading promise
    const loadingPromise = this._loadDependency(dependencyName, config);

    // Store the promise so other calls can reuse it
    this._dependencies.set(dependencyName, loadingPromise);

    return loadingPromise;
  }

  /**
   * Internal method to actually load a dependency
   */
  async _loadDependency(dependencyName, config) {
    // Check if already globally available
    if (config.globalName && window[config.globalName]) {
      console.log(`✓ ${dependencyName} already loaded`);
      return window[config.globalName];
    }

    console.log(`⏳ Loading ${dependencyName}...`);

    // Normalize URLs to array
    const urls = Array.isArray(config.urls) ? config.urls : [config.url];
    const timeout = config.timeout || 10000;

    try {
      // Load all URLs in parallel with timeout
      const loadPromises = urls.map(url =>
        this._loadResource(url, timeout)
      );

      await Promise.all(loadPromises);

      // Verify the global is now available
      if (config.globalName && !window[config.globalName]) {
        throw new Error(`${dependencyName} loaded but ${config.globalName} not found on window`);
      }

      console.log(`✓ ${dependencyName} loaded successfully`);

      // Check if all registered dependencies are now loaded
      this._checkIfReady();

      return config.globalName ? window[config.globalName] : true;

    } catch (error) {
      console.error(`✗ Failed to load ${dependencyName}:`, error);
      this._dependencies.delete(dependencyName); // Allow retry
      throw error;
    }
  }

  /**
   * Load a single resource (JS or CSS) with timeout
   */
  _loadResource(url, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading ${url} after ${timeout}ms`));
      }, timeout);

      const isCSS = url.endsWith('.css');

      if (isCSS) {
        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = url;
        link.onload = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        link.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to load CSS: ${url}`));
        };
        document.head.appendChild(link);
      } else {
        // Load JavaScript
        const script = document.createElement('script');
        script.src = url;
        script.onload = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        script.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to load script: ${url}`));
        };
        document.head.appendChild(script);
      }
    });
  }

  /**
   * Check if all registered dependencies are loaded
   */
  _checkIfReady() {
    // If no dependencies registered yet, we're not ready
    if (this._registeredDependencies.size === 0) {
      return;
    }

    // Check if all registered dependencies are loaded
    const allLoaded = Array.from(this._registeredDependencies).every(dep => {
      const promise = this._dependencies.get(dep);
      // A dependency is loaded if its promise exists and isn't pending
      // We check by seeing if the global exists
      const config = this._dependencyConfigs[dep];
      return config && config.globalName && window[config.globalName];
    });

    if (allLoaded && this._readyResolve) {
      console.log('✓ All Wave CSS dependencies ready!');
      this._readyResolve();
      this._readyResolve = null; // Prevent multiple calls
    }
  }

  /**
   * Get the ready promise
   */
  get ready() {
    return this._readyPromise;
  }

  /**
   * Check if a specific dependency is loaded
   */
  isLoaded(dependencyName) {
    const config = this._dependencyConfigs[dependencyName];
    if (!config) return false;

    if (config.globalName) {
      return !!window[config.globalName];
    }

    return this._dependencies.has(dependencyName);
  }

  /**
   * Get status of all dependencies
   */
  getStatus() {
    const status = {};
    for (const [name, config] of Object.entries(this._dependencyConfigs)) {
      status[name] = {
        registered: this._registeredDependencies.has(name),
        loaded: this.isLoaded(name),
        globalAvailable: config.globalName ? !!window[config.globalName] : null
      };
    }
    return status;
  }

  /**
   * Add a custom dependency configuration
   */
  addDependency(name, config) {
    this._dependencyConfigs[name] = config;
  }
}

// Create singleton instance
const dependencyManager = new WcDependencyManager();

// Export for ES modules
export { dependencyManager as DependencyManager };

// Also attach to window.wc for global access
if (!window.wc) {
  window.wc = {};
}
window.wc.DependencyManager = dependencyManager;

// Create the wc.ready promise
window.wc.ready = dependencyManager.ready;

// Export default
export default dependencyManager;
