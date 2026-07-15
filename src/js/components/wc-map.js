/**
 *
 *  Name: wc-map
 *  Usage:
 *    <!-- Single pin (keyless — OpenFreeMap tiles by default) -->
 *    <wc-map lat="40.7128" lng="-74.0060" address="New York, NY" zoom="12"></wc-map>
 *
 *    <!-- Multiple pins via option children -->
 *    <wc-map zoom="10" fit-bounds>
 *      <option data-lat="40.7128" data-lng="-74.0060" data-title="NYC" data-address="New York, NY" data-link="/x/1"></option>
 *      <option data-lat="34.0522" data-lng="-118.2437" data-title="LA" data-address="Los Angeles, CA"></option>
 *    </wc-map>
 *
 *    <!-- Data-bound markers array -->
 *    <wc-map markers='[{"lat":40.7,"lng":-74,"label":"HQ","link":"/x/1"}]' fit-bounds></wc-map>
 *
 *  Provider-agnostic interactive map built on MapLibre GL JS + free, keyless OpenFreeMap
 *  vector tiles (https://tiles.openfreemap.org/styles/liberty). A drop-in replacement for
 *  wc-google-map: same attributes / pins / methods / events, but $0/mo and no API key.
 *  Override tiles with `style` (or `tiles`) — e.g. a self-hosted PMTiles style — for a
 *  zero-third-party-dependency deployment.
 *
 *  Attributes: lat, lng, address, title, zoom, map-type, center-lat, center-lng,
 *    draggable, scrollwheel, disable-default-ui, markers, fit-bounds, tiles (or map-style),
 *    attribution-compact (default true — the ⓘ collapses the credit; "false" = expanded box).
 *    (api-key is accepted but ignored — no key is needed.)
 *  Methods: updatePins(pins), addPin(lat,lng,address,title), clearPins(), getMap(), getMarkers().
 *  Events (neutral + legacy aliases, bubbling): map-loaded/wcmaploaded, pin-clicked/wcpinclicked,
 *    wcmapmarkerclick (+ wc-google-map:marker-click / wcgooglemapmarkerclick), map-clicked/wcmapclicked,
 *    center-changed, zoom-changed, bounds-changed, drag-start/drag/drag-end.
 */

import { WcBaseComponent } from './wc-base-component.js';

const MAPLIBRE_JS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js';
const MAPLIBRE_CSS = 'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css';
const DEFAULT_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

class WcMap extends WcBaseComponent {
  static get observedAttributes() {
    return [
      'api-key', 'lat', 'lng', 'address', 'title',
      'zoom', 'map-type', 'center-lat', 'center-lng',
      'draggable', 'scrollwheel', 'disable-default-ui',
      'markers', 'fit-bounds', 'tiles', 'map-style', 'attribution-compact',
      'class', 'elt-class'
    ];
  }

  static maplibreLoadPromise = null;

  constructor() {
    super();

    this.map = null;
    this.markers = [];
    this.mapElement = null;

    const compEl = this.querySelector('.wc-map');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-map');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();

    if (this._disconnectTimeout) {
      clearTimeout(this._disconnectTimeout);
      this._disconnectTimeout = null;
    }

    this._setupResizeHandling();

    // If map already exists (was just moved), we're done
    if (this.map) return;

    try {
      await this._ensureMapLibreLoaded();
      await new Promise(resolve => setTimeout(resolve, 100)); // let HTMX-swapped content settle
      await this._initializeMap();
    } catch (error) {
      console.error('wc-map: Error initializing map:', error);
      this._showError('Failed to load the map library.');
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    // Defer cleanup — the node may just be getting moved (HTMX/tab swap).
    this._disconnectTimeout = setTimeout(() => this._cleanup(), 1000);
  }

  _handleAttributeChange(attrName, newValue) {
    if (['lat', 'lng', 'address', 'title', 'markers', 'fit-bounds'].includes(attrName)) {
      if (this.map) this._addPins();
    } else if (['zoom', 'map-type', 'center-lat', 'center-lng'].includes(attrName)) {
      if (this.map) this._updateMapConfig();
    } else if (attrName === 'api-key') {
      // Accepted for drop-in compatibility with wc-google-map; no key is needed.
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _render() {
    super._render();
    if (!this.mapElement) {
      this.mapElement = document.createElement('div');
      this.mapElement.classList.add('map-container');
      this.componentElement.innerHTML = '';
      this.componentElement.appendChild(this.mapElement);
    }
  }

  /** Load MapLibre GL JS + CSS once across all instances (skips if already present). */
  async _ensureMapLibreLoaded() {
    if (window.maplibregl) return Promise.resolve();
    if (WcMap.maplibreLoadPromise) return WcMap.maplibreLoadPromise;

    WcMap.maplibreLoadPromise = (async () => {
      // CSS is required for markers/controls to position correctly.
      try { await this.loadCSS(MAPLIBRE_CSS); } catch (e) { /* non-fatal */ }
      await this.loadLibrary(MAPLIBRE_JS, 'maplibregl');
    })();
    return WcMap.maplibreLoadPromise;
  }

  _styleUrl() {
    // Explicit tiles/map-style override wins; otherwise the free, keyless OpenFreeMap style.
    // NB: we deliberately do NOT read the reserved `style` attribute (inline CSS).
    return this.getAttribute('tiles') || this.getAttribute('map-style') || this.getAttribute('style-url') || DEFAULT_STYLE;
  }

  async _initializeMap() {
    if (!window.maplibregl || !this.mapElement) return;
    // Guard against a double-init race: connectedCallback awaits a settle delay while the
    // ResizeObserver/IntersectionObserver may also call this — only build the map once.
    if (this.map) return;

    // Wait for real dimensions — ResizeObserver re-runs this once the container has size.
    if (this.mapElement.offsetWidth === 0 || this.mapElement.offsetHeight === 0) return;

    const zoom = parseInt(this.getAttribute('zoom')) || 12;
    const disableDefaultUI = this.hasAttribute('disable-default-ui');
    const draggable = this.hasAttribute('draggable') ? this.getAttribute('draggable') !== 'false' : true;
    const scrollwheel = this.hasAttribute('scrollwheel') ? this.getAttribute('scrollwheel') !== 'false' : true;
    // Compact attribution by default — a small ⓘ that expands on click, so it doesn't cover
    // small maps. attribution-compact="false" forces the always-expanded credit box.
    const attributionCompact = this.getAttribute('attribution-compact') !== 'false';

    // Center: explicit center-* → first pin → [0,0]. MapLibre uses [lng, lat] order.
    let center = [0, 0];
    const centerLat = this.getAttribute('center-lat');
    const centerLng = this.getAttribute('center-lng');
    if (centerLat && centerLng) {
      center = [parseFloat(centerLng), parseFloat(centerLat)];
    } else {
      const pins = this._getPins();
      if (pins.length > 0) center = [pins[0].lng, pins[0].lat];
    }

    try {
      this.map = new maplibregl.Map({
        container: this.mapElement,
        style: this._styleUrl(),
        center,
        zoom,
        // Keep the mandatory OpenFreeMap/OpenMapTiles/OSM credit visible — compact by default.
        attributionControl: { compact: attributionCompact }
      });

      if (!disableDefaultUI && maplibregl.NavigationControl) {
        try { this.map.addControl(new maplibregl.NavigationControl(), 'top-right'); } catch (e) { /* ignore */ }
      }
      if (!draggable && this.map.dragPan) this.map.dragPan.disable();
      if (!scrollwheel && this.map.scrollZoom) this.map.scrollZoom.disable();

      const onReady = () => {
        this._emitEvent('wcmaploaded', 'map-loaded', { detail: { map: this.map }, bubbles: true });
        this._addMapEventListeners();
        this._addPins();
      };
      // 'load' fires once the style is ready; fall back if already loaded.
      if (typeof this.map.on === 'function') this.map.on('load', onReady);
      if (typeof this.map.loaded === 'function' && this.map.loaded()) onReady();
    } catch (error) {
      console.error('wc-map: Error creating map:', error);
      this._showError('Error creating map: ' + error.message);
    }
  }

  /** Pins from single lat/lng attrs, <option> children, and/or a markers JSON array (additive). */
  _getPins() {
    const pins = [];

    const lat = this.getAttribute('lat');
    const lng = this.getAttribute('lng');
    if (lat && lng) {
      pins.push({
        lat: parseFloat(lat), lng: parseFloat(lng),
        address: this.getAttribute('address') || '',
        title: this.getAttribute('title') || this.getAttribute('address') || 'Location'
      });
    }

    this.querySelectorAll('option').forEach(option => {
      const optLat = option.getAttribute('data-lat');
      const optLng = option.getAttribute('data-lng');
      if (optLat && optLng) {
        pins.push({
          lat: parseFloat(optLat), lng: parseFloat(optLng),
          address: option.getAttribute('data-address') || '',
          title: option.getAttribute('data-title') || option.getAttribute('data-address') || 'Location',
          link: option.getAttribute('data-link') || ''
        });
      }
    });

    const markersAttr = this.getAttribute('markers');
    if (markersAttr) {
      try {
        const arr = JSON.parse(markersAttr);
        if (Array.isArray(arr)) {
          arr.forEach(m => {
            if (m && m.lat != null && m.lng != null) {
              pins.push({
                lat: parseFloat(m.lat), lng: parseFloat(m.lng),
                address: m.address || '',
                title: m.label || m.title || m.address || 'Location',
                label: m.label || '',
                link: m.link || ''
              });
            }
          });
        }
      } catch (ex) {
        console.warn('wc-map: invalid markers JSON', ex);
      }
    }

    return pins;
  }

  _escape(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  _addPins() {
    if (!this.map) return;
    this._clearMarkers();

    const pins = this._getPins();
    if (pins.length === 0) return;

    pins.forEach((pin, index) => {
      const popupHtml = `<div class="map-info-window">
          ${pin.title ? `<strong>${this._escape(pin.title)}</strong><br>` : ''}
          ${this._escape(pin.address)}
          ${pin.link ? `<div><a href="${this._escape(pin.link)}">View</a></div>` : ''}
        </div>`;

      const popup = new maplibregl.Popup({ offset: 24 }).setHTML(popupHtml);
      const marker = new maplibregl.Marker()
        .setLngLat([pin.lng, pin.lat])
        .setPopup(popup)
        .addTo(this.map);

      this.markers.push(marker);

      // MapLibre markers have no native 'click' — listen on the marker element.
      const el = typeof marker.getElement === 'function' ? marker.getElement() : null;
      if (el) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
          this._emitEvent('wcpinclicked', 'pin-clicked', {
            detail: { pin, marker, index }, bubbles: true
          });
          // Neutral marker-click + legacy wc-google-map aliases (drop-in for existing consumers).
          const detail = { index, link: pin.link || null, pin };
          const opts = { detail, bubbles: true };
          this.dispatchEvent(new CustomEvent('wcmapmarkerclick', opts));
          this.dispatchEvent(new CustomEvent('wcgooglemapmarkerclick', opts));
          this.dispatchEvent(new CustomEvent('wc-google-map:marker-click', opts));
        });
      }
    });

    const fitBounds = this.hasAttribute('fit-bounds');
    if (pins.length > 1 || (fitBounds && pins.length >= 1)) {
      const bounds = new maplibregl.LngLatBounds();
      pins.forEach(pin => bounds.extend([pin.lng, pin.lat]));
      this.map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
    } else if (pins.length === 1) {
      this.map.setCenter([pins[0].lng, pins[0].lat]);
    }
  }

  _clearMarkers() {
    this.markers.forEach(marker => { try { marker.remove(); } catch (e) { /* ignore */ } });
    this.markers = [];
  }

  _updateMapConfig() {
    if (!this.map) return;
    const zoom = parseInt(this.getAttribute('zoom'));
    const centerLat = this.getAttribute('center-lat');
    const centerLng = this.getAttribute('center-lng');
    if (zoom && !isNaN(zoom) && this.map.setZoom) this.map.setZoom(zoom);
    if (centerLat && centerLng && this.map.setCenter) {
      this.map.setCenter([parseFloat(centerLng), parseFloat(centerLat)]);
    }
  }

  _addMapEventListeners() {
    if (!this.map || typeof this.map.on !== 'function') return;

    this.map.on('click', (e) => {
      const ll = e.lngLat || {};
      this._emitEvent('wcmapclicked', 'map-clicked', {
        detail: { lat: ll.lat, lng: ll.lng, event: e }, bubbles: true
      });
    });

    this.map.on('move', () => {
      const c = this.map.getCenter();
      this._emitEvent('wcmapcenterchanged', 'center-changed', {
        detail: { lat: c.lat, lng: c.lng }, bubbles: true
      });
    });

    this.map.on('zoom', () => {
      this._emitEvent('wcmapzoomchanged', 'zoom-changed', {
        detail: { zoom: this.map.getZoom() }, bubbles: true
      });
    });

    this.map.on('moveend', () => {
      const bounds = this.map.getBounds ? this.map.getBounds() : null;
      if (bounds) {
        this._emitEvent('wcmapboundschanged', 'bounds-changed', { detail: { bounds }, bubbles: true });
      }
    });

    this.map.on('dragstart', () => this._emitEvent('wcmapdragstart', 'drag-start', { bubbles: true }));
    this.map.on('drag', () => this._emitEvent('wcmapdragging', 'dragging', { bubbles: true }));
    this.map.on('dragend', () => this._emitEvent('wcmapdragend', 'drag-end', { bubbles: true }));
  }

  /** Public API: add a pin dynamically (as an <option> child). */
  addPin(lat, lng, address, title) {
    const option = document.createElement('option');
    option.setAttribute('data-lat', lat);
    option.setAttribute('data-lng', lng);
    option.setAttribute('data-address', address || '');
    option.setAttribute('data-title', title || address || 'Location');
    this.appendChild(option);
    if (this.map) this._addPins();
  }

  /** Public API: clear ALL pin sources (option children + single-pin attrs + markers JSON). */
  clearPins() {
    this.querySelectorAll('option').forEach(opt => opt.remove());
    this.removeAttribute('lat');
    this.removeAttribute('lng');
    this.removeAttribute('address');
    this.removeAttribute('title');
    this.removeAttribute('markers'); // so updatePins() is a true full replace, not additive
    this._clearMarkers();
  }

  /** Public API: replace pins with an array of {lat,lng,title?,address?} objects. */
  updatePins(pins) {
    if (!Array.isArray(pins)) {
      console.error('wc-map: updatePins expects an array of pin objects');
      return;
    }
    this.clearPins();

    if (pins.length === 1) {
      const pin = pins[0];
      this.setAttribute('lat', pin.lat);
      this.setAttribute('lng', pin.lng);
      if (pin.title) this.setAttribute('title', pin.title);
      if (pin.address) this.setAttribute('address', pin.address);
    } else if (pins.length > 1) {
      pins.forEach(pin => {
        const option = document.createElement('option');
        option.setAttribute('data-lat', pin.lat);
        option.setAttribute('data-lng', pin.lng);
        if (pin.title) option.setAttribute('data-title', pin.title);
        if (pin.address) option.setAttribute('data-address', pin.address);
        this.appendChild(option);
      });
    }

    if (this.map) this._addPins();
  }

  getMap() { return this.map; }
  getMarkers() { return this.markers; }

  _cleanup() {
    this._clearMarkers();
    if (this.map && typeof this.map.remove === 'function') {
      try { this.map.remove(); } catch (e) { /* ignore */ }
    }
    this.map = null;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }

  _setupResizeHandling() {
    if (typeof ResizeObserver !== 'undefined' && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this._handleResize());
      this.resizeObserver.observe(this.mapElement);
    }
    document.body.addEventListener('htmx:afterSettle', () => setTimeout(() => this._handleResize(), 50));
    if (typeof IntersectionObserver !== 'undefined') {
      const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0) this._handleResize();
        });
      });
      visibilityObserver.observe(this);
    }
  }

  _handleResize() {
    const width = this.mapElement.offsetWidth;
    const height = this.mapElement.offsetHeight;
    if (!this.map && width > 0 && height > 0) {
      this._initializeMap();
      return;
    }
    if (this.map && width > 0 && height > 0 && typeof this.map.resize === 'function') {
      this.map.resize();
    }
  }

  _showError(message) {
    if (this.mapElement) {
      this.mapElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center; background: var(--surface-2); color: var(--text-1);">
          <div>
            <p style="font-weight: bold; margin-bottom: 0.5rem;">⚠️ Map Error</p>
            <p>${this._escape(message)}</p>
          </div>
        </div>`;
    }
  }

  _applyStyle() {
    const style = `
      wc-map {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 150px;
      }
      wc-map .wc-map {
        width: 100%;
        height: 100%;
        min-height: 150px;
        position: relative;
      }
      wc-map .map-container {
        width: 100%;
        height: 100%;
        border-radius: 0.375rem;
        overflow: hidden;
      }
      .map-info-window {
        padding: 0.25rem;
        font-family: inherit;
        color: var(--text-1);
      }
      .map-info-window strong {
        display: block;
        margin-bottom: 0.25rem;
        color: var(--text-1);
      }
      wc-map option {
        display: none;
      }
    `.trim();

    this.loadStyle('wc-map-style', style);
  }
}

customElements.define('wc-map', WcMap);

export { WcMap };
