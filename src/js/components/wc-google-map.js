/**
 *
 *  Name: wc-google-map
 *  Usage:
 *    <!-- Single pin -->
 *    <wc-google-map
 *      api-key="YOUR_API_KEY"
 *      lat="40.7128"
 *      lng="-74.0060"
 *      address="New York, NY"
 *      zoom="12"
 *      map-type="roadmap">
 *    </wc-google-map>
 *
 *    <!-- Multiple pins using option elements -->
 *    <wc-google-map
 *      api-key="YOUR_API_KEY"
 *      zoom="10"
 *      map-type="roadmap">
 *      <option data-lat="40.7128" data-lng="-74.0060" data-address="New York, NY" data-title="Location 1"></option>
 *      <option data-lat="34.0522" data-lng="-118.2437" data-address="Los Angeles, CA" data-title="Location 2"></option>
 *      <option data-lat="41.8781" data-lng="-87.6298" data-address="Chicago, IL" data-title="Location 3"></option>
 *    </wc-google-map>
 *
 */

import { WcBaseComponent } from './wc-base-component.js';

// console.log('🗺️ wc-google-map.js loaded - Version 2.0 with HTMX fix');

class WcGoogleMap extends WcBaseComponent {
  static get observedAttributes() {
    return [
      'api-key', 'lat', 'lng', 'address', 'title',
      'zoom', 'map-type', 'center-lat', 'center-lng',
      'draggable', 'scrollwheel', 'disable-default-ui',
      'class', 'elt-class'
    ];
  }

  // Track if Google Maps API is loaded globally
  static isGoogleMapsLoaded = false;
  static googleMapsLoadPromise = null;

  constructor() {
    super();

    this.map = null;
    this.markers = [];
    this.infoWindows = [];
    this.mapElement = null;

    const compEl = this.querySelector('.wc-google-map');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-google-map');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    console.log('🗺️ connectedCallback called, map exists:', !!this.map);
    super.connectedCallback();
    this._applyStyle();

    // Cancel any pending cleanup - component is reconnecting
    if (this._disconnectTimeout) {
      console.log('🗺️ Clearing disconnect timeout - component reconnected');
      clearTimeout(this._disconnectTimeout);
      this._disconnectTimeout = null;
    }

    // Setup resize observer first - it will handle initialization when dimensions are available
    this._setupResizeHandling();

    // If map already exists (was just moved), we're done
    if (this.map) {
      console.log('🗺️ Map already exists, skipping initialization');
      return;
    }

    // Load Google Maps API if needed, then try to initialize map
    try {
      await this._ensureGoogleMapsLoaded();
      // Wait for HTMX-loaded content to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Try to initialize - if no dimensions, ResizeObserver will handle it later
      await this._initializeMap();
    } catch (error) {
      console.error('wc-google-map: Error initializing map:', error);
      this._showError('Failed to load Google Maps. Please check your API key.');
    }
  }

  disconnectedCallback() {
    console.log('🗺️ disconnectedCallback called');
    super.disconnectedCallback();

    // Don't destroy the map immediately - it might just be getting moved
    // Schedule cleanup only if component isn't reconnected quickly
    this._disconnectTimeout = setTimeout(() => {
      console.log('🗺️ Cleanup timeout fired - component not reconnected');
      this._cleanup();
    }, 1000);
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'api-key') {
      // API key changed, may need to reload
      if (this.map) {
        this._initializeMap();
      }
    } else if (['lat', 'lng', 'address', 'title'].includes(attrName)) {
      // Single pin attributes changed
      if (this.map) {
        this._updateSinglePin();
      }
    } else if (['zoom', 'map-type', 'center-lat', 'center-lng'].includes(attrName)) {
      // Map configuration changed
      if (this.map) {
        this._updateMapConfig();
      }
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _render() {
    super._render();

    // Create map container
    if (!this.mapElement) {
      this.mapElement = document.createElement('div');
      this.mapElement.classList.add('map-container');
      this.componentElement.innerHTML = '';
      this.componentElement.appendChild(this.mapElement);
    }
  }

  /**
   * Ensures Google Maps API is loaded only once across all instances
   */
  async _ensureGoogleMapsLoaded() {
    // Check if already loaded
    if (window.google && window.google.maps) {
      WcGoogleMap.isGoogleMapsLoaded = true;
      return Promise.resolve();
    }

    // If already loading, wait for that promise
    if (WcGoogleMap.googleMapsLoadPromise) {
      return WcGoogleMap.googleMapsLoadPromise;
    }

    // Check if script tag already exists (loaded by wc-google-address)
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // console.log('wc-google-map: Google Maps script already exists, waiting for it to load...');
      WcGoogleMap.googleMapsLoadPromise = new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkLoaded);
            WcGoogleMap.isGoogleMapsLoaded = true;
            resolve();
          }
        }, 100);
      });
      return WcGoogleMap.googleMapsLoadPromise;
    }

    // Start loading
    const apiKey = this.getAttribute('api-key');
    if (!apiKey) {
      console.error('wc-google-map: api-key attribute is required');
      return Promise.reject('API key is required');
    }

    WcGoogleMap.googleMapsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // Load with both marker and places libraries for compatibility with wc-google-address
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places&loading=async&v=weekly`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        WcGoogleMap.isGoogleMapsLoaded = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load Google Maps API'));
      };

      document.head.appendChild(script);
    });

    return WcGoogleMap.googleMapsLoadPromise;
  }

  /**
   * Initialize the Google Map
   */
  async _initializeMap() {
    console.log('🗺️ _initializeMap called');

    if (!window.google || !window.google.maps) {
      console.error('wc-google-map: Google Maps API not loaded');
      return;
    }

    if (!this.mapElement) {
      console.error('wc-google-map: Map container element not found');
      return;
    }

    // Check dimensions before initializing
    const dimensions = {
      width: this.mapElement.offsetWidth,
      height: this.mapElement.offsetHeight
    };

    console.log('🗺️ Container dimensions:', dimensions);

    if (dimensions.width === 0 || dimensions.height === 0) {
      console.log('🗺️ No dimensions yet, will wait for ResizeObserver');
      return;
    }

    // Get map configuration
    const zoom = parseInt(this.getAttribute('zoom')) || 12;
    const mapType = this.getAttribute('map-type') || 'roadmap';
    const draggable = this.hasAttribute('draggable') ? this.getAttribute('draggable') !== 'false' : true;
    const scrollwheel = this.hasAttribute('scrollwheel') ? this.getAttribute('scrollwheel') !== 'false' : true;
    const disableDefaultUI = this.hasAttribute('disable-default-ui');

    // Determine center point
    let center = { lat: 0, lng: 0 };

    // Check for explicit center
    const centerLat = this.getAttribute('center-lat');
    const centerLng = this.getAttribute('center-lng');

    if (centerLat && centerLng) {
      center = { lat: parseFloat(centerLat), lng: parseFloat(centerLng) };
    } else {
      // Use first pin location or default
      const pins = this._getPins();
      if (pins.length > 0) {
        center = { lat: pins[0].lat, lng: pins[0].lng };
      }
    }

    // Create map with mapId for AdvancedMarkerElement support
    const mapOptions = {
      center: center,
      zoom: zoom,
      mapTypeId: mapType,
      draggable: draggable,
      scrollwheel: scrollwheel,
      disableDefaultUI: disableDefaultUI,
      mapId: 'WAVE_CSS_MAP' // Required for AdvancedMarkerElement
    };

    try {
      this.map = new google.maps.Map(this.mapElement, mapOptions);
      // console.log('wc-google-map: Map created successfully', this.map);

      // Emit map-loaded event
      this.dispatchEvent(new CustomEvent('map-loaded', {
        detail: { map: this.map },
        bubbles: true
      }));

      // Add map event listeners
      this._addMapEventListeners();

      // Add pins
      this._addPins();

      // console.log('wc-google-map: Initialization complete');
    } catch (error) {
      console.error('wc-google-map: Error creating map:', error);
      this._showError('Error creating map: ' + error.message);
    }
  }

  /**
   * Get pins from attributes or child option elements
   */
  _getPins() {
    const pins = [];

    // Check for single pin via attributes
    const lat = this.getAttribute('lat');
    const lng = this.getAttribute('lng');

    if (lat && lng) {
      pins.push({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: this.getAttribute('address') || '',
        title: this.getAttribute('title') || this.getAttribute('address') || 'Location'
      });
    }

    // Check for multiple pins via option elements
    const options = this.querySelectorAll('option');
    options.forEach(option => {
      const optLat = option.getAttribute('data-lat');
      const optLng = option.getAttribute('data-lng');

      if (optLat && optLng) {
        pins.push({
          lat: parseFloat(optLat),
          lng: parseFloat(optLng),
          address: option.getAttribute('data-address') || '',
          title: option.getAttribute('data-title') || option.getAttribute('data-address') || 'Location'
        });
      }
    });

    return pins;
  }

  /**
   * Add pins to the map
   */
  _addPins() {
    if (!this.map) return;

    // Clear existing markers and info windows
    this._clearMarkers();

    const pins = this._getPins();

    // console.log('wc-google-map: Adding pins:', pins.length, pins);

    if (pins.length === 0) {
      // console.warn('wc-google-map: No pins to add');
      return;
    }

    pins.forEach((pin, index) => {
      // Create marker using new AdvancedMarkerElement
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: pin.lat, lng: pin.lng },
        map: this.map,
        title: pin.title
      });

      this.markers.push(marker);

      // Create info window
      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="map-info-window">
          ${pin.title ? `<strong>${pin.title}</strong><br>` : ''}
          ${pin.address || ''}
        </div>`
      });

      this.infoWindows.push(infoWindow);

      // Add click listener to marker
      marker.addListener('click', () => {
        // Close all other info windows
        this.infoWindows.forEach(iw => iw.close());

        // Open this info window
        infoWindow.open(this.map, marker);

        // Emit custom event
        this.dispatchEvent(new CustomEvent('pin-clicked', {
          detail: {
            pin: pin,
            marker: marker,
            index: index
          },
          bubbles: true
        }));
      });
    });

    // Auto-fit bounds if multiple pins
    if (pins.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      pins.forEach(pin => {
        bounds.extend({ lat: pin.lat, lng: pin.lng });
      });
      this.map.fitBounds(bounds);
    } else if (pins.length === 1) {
      // Center on single pin
      this.map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
    }
  }

  /**
   * Clear all markers from the map
   */
  _clearMarkers() {
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
    this.infoWindows.forEach(iw => iw.close());
    this.infoWindows = [];
  }

  /**
   * Update single pin (when attributes change)
   */
  _updateSinglePin() {
    this._addPins();
  }

  /**
   * Update map configuration
   */
  _updateMapConfig() {
    if (!this.map) return;

    const zoom = parseInt(this.getAttribute('zoom'));
    const mapType = this.getAttribute('map-type');
    const centerLat = this.getAttribute('center-lat');
    const centerLng = this.getAttribute('center-lng');

    if (zoom && !isNaN(zoom)) {
      this.map.setZoom(zoom);
    }

    if (mapType) {
      this.map.setMapTypeId(mapType);
    }

    if (centerLat && centerLng) {
      this.map.setCenter({
        lat: parseFloat(centerLat),
        lng: parseFloat(centerLng)
      });
    }
  }

  /**
   * Add event listeners for map interactions
   */
  _addMapEventListeners() {
    if (!this.map) return;

    // Click event
    this.map.addListener('click', (e) => {
      this.dispatchEvent(new CustomEvent('map-clicked', {
        detail: {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          event: e
        },
        bubbles: true
      }));
    });

    // Center changed
    this.map.addListener('center_changed', () => {
      const center = this.map.getCenter();
      this.dispatchEvent(new CustomEvent('center-changed', {
        detail: {
          lat: center.lat(),
          lng: center.lng()
        },
        bubbles: true
      }));
    });

    // Zoom changed
    this.map.addListener('zoom_changed', () => {
      this.dispatchEvent(new CustomEvent('zoom-changed', {
        detail: {
          zoom: this.map.getZoom()
        },
        bubbles: true
      }));
    });

    // Bounds changed
    this.map.addListener('bounds_changed', () => {
      const bounds = this.map.getBounds();
      if (bounds) {
        this.dispatchEvent(new CustomEvent('bounds-changed', {
          detail: {
            bounds: bounds
          },
          bubbles: true
        }));
      }
    });

    // Drag events
    this.map.addListener('dragstart', () => {
      this.dispatchEvent(new CustomEvent('drag-start', {
        bubbles: true
      }));
    });

    this.map.addListener('drag', () => {
      this.dispatchEvent(new CustomEvent('dragging', {
        bubbles: true
      }));
    });

    this.map.addListener('dragend', () => {
      this.dispatchEvent(new CustomEvent('drag-end', {
        bubbles: true
      }));
    });
  }

  /**
   * Public API: Add a pin dynamically
   */
  addPin(lat, lng, address, title) {
    const option = document.createElement('option');
    option.setAttribute('data-lat', lat);
    option.setAttribute('data-lng', lng);
    option.setAttribute('data-address', address || '');
    option.setAttribute('data-title', title || address || 'Location');
    this.appendChild(option);

    if (this.map) {
      this._addPins();
    }
  }

  /**
   * Public API: Clear all pins
   */
  clearPins() {
    // Remove option elements
    this.querySelectorAll('option').forEach(opt => opt.remove());

    // Clear single pin attributes
    this.removeAttribute('lat');
    this.removeAttribute('lng');
    this.removeAttribute('address');
    this.removeAttribute('title');

    // Clear markers
    this._clearMarkers();
  }

  /**
   * Public API: Update pins programmatically
   * @param {Array} pins - Array of pin objects with lat, lng, title, address properties
   */
  updatePins(pins) {
    if (!Array.isArray(pins)) {
      console.error('wc-google-map: updatePins expects an array of pin objects');
      return;
    }

    // Clear existing pins
    this.clearPins();

    // If single pin, set as attributes
    if (pins.length === 1) {
      const pin = pins[0];
      this.setAttribute('lat', pin.lat);
      this.setAttribute('lng', pin.lng);
      if (pin.title) this.setAttribute('title', pin.title);
      if (pin.address) this.setAttribute('address', pin.address);
    } else if (pins.length > 1) {
      // Multiple pins, create option elements
      pins.forEach(pin => {
        const option = document.createElement('option');
        option.setAttribute('data-lat', pin.lat);
        option.setAttribute('data-lng', pin.lng);
        if (pin.title) option.setAttribute('data-title', pin.title);
        if (pin.address) option.setAttribute('data-address', pin.address);
        this.appendChild(option);
      });
    }

    // Re-render pins
    if (this.map) {
      this._addPins();
    }
  }

  /**
   * Public API: Get current map instance
   */
  getMap() {
    return this.map;
  }

  /**
   * Public API: Get all markers
   */
  getMarkers() {
    return this.markers;
  }

  /**
   * Cleanup
   */
  _cleanup() {
    this._clearMarkers();
    this.map = null;

    // Cleanup resize observer
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  /**
   * Setup resize handling for HTMX and dynamic content
   */
  _setupResizeHandling() {
    // Set up ResizeObserver even if map doesn't exist yet
    // It will help initialize the map when dimensions become available
    if (typeof ResizeObserver !== 'undefined' && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this._handleResize();
      });
      this.resizeObserver.observe(this.mapElement);
    }

    // Also listen for HTMX events
    document.body.addEventListener('htmx:afterSettle', () => {
      // Delay slightly to ensure layout is complete
      setTimeout(() => this._handleResize(), 50);
    });

    // Listen for visibility changes (in case map is in a tab or modal)
    if (typeof IntersectionObserver !== 'undefined') {
      const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            this._handleResize();
          }
        });
      });
      visibilityObserver.observe(this);
    }
  }

  /**
   * Handle map resize
   */
  _handleResize() {
    const width = this.mapElement.offsetWidth;
    const height = this.mapElement.offsetHeight;

    console.log('🗺️ _handleResize called, dimensions:', { width, height }, 'map exists:', !!this.map);

    // If map doesn't exist yet but container now has dimensions, initialize it
    if (!this.map && width > 0 && height > 0) {
      console.log('🗺️ Container now has dimensions, initializing map');
      this._initializeMap();
      return;
    }

    // Only resize if map exists and container has dimensions
    if (this.map && width > 0 && height > 0) {
      google.maps.event.trigger(this.map, 'resize');

      // Re-center the map if it was centered before
      const center = this.map.getCenter();
      if (center) {
        this.map.setCenter(center);
      }

      console.log('🗺️ Map resized', { width, height });
    }
  }

  /**
   * Show error message in map container
   */
  _showError(message) {
    if (this.mapElement) {
      this.mapElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center; background: var(--surface-2); color: var(--text-1);">
          <div>
            <p style="font-weight: bold; margin-bottom: 0.5rem;">⚠️ Map Error</p>
            <p>${message}</p>
          </div>
        </div>
      `;
    }
  }

  _applyStyle() {
    const style = `
      wc-google-map {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 150px;
      }

      wc-google-map .wc-google-map {
        width: 100%;
        height: 100%;
        min-height: 150px;
        position: relative;
      }

      wc-google-map .map-container {
        width: 100%;
        height: 100%;
        border-radius: 0.375rem;
        overflow: hidden;
      }

      /* Info window styling */
      .map-info-window {
        padding: 0.5rem;
        font-family: inherit;
        color: var(--text-1);
      }

      .map-info-window strong {
        display: block;
        margin-bottom: 0.25rem;
        color: var(--text-1);
      }

      /* Hide option elements */
      wc-google-map option {
        display: none;
      }
    `.trim();

    this.loadStyle('wc-google-map-style', style);
  }
}

customElements.define('wc-google-map', WcGoogleMap);

export { WcGoogleMap };
