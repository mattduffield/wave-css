/**
 *
 *  Name: wc-address
 *  Usage:
 *    <wc-address
 *      name="address.street"
 *      lbl-label="Street Address"
 *      address-group="address"
 *      target-map="map1"
 *      countries="us"
 *      geocode-url="/api/geocode"
 *      required>
 *    </wc-address>
 *
 *  Provider-agnostic address type-ahead — a drop-in replacement for wc-google-address that
 *  talks to the app's own geocode PROXY instead of Google Places, so there's no API key in
 *  the browser and no Google billing. The proxy (default `/api/geocode`) adapts LocationIQ /
 *  Nominatim server-side, caches results, and keeps ToS attribution in one place.
 *
 *  Proxy contract (see `geocode-url`):
 *    GET  ${geocode-url}/autocomplete?q=<partial>  -> [{ id, label, lat, lng }]
 *    GET  ${geocode-url}/details?id=<id>           -> { street, city, state, postal_code,
 *                                                       county, country, lat, lng,
 *                                                       formatted_address, source, approximate }
 *
 *  Attributes: name, id, class, value, placeholder, lbl-label, lbl-class, elt-class,
 *    disabled, readonly, required, autocomplete, address-group, target-map, countries,
 *    types, icon-name, tooltip, tooltip-position, and geocode-url (default /api/geocode).
 *    (api-key / fields are accepted but ignored — no provider key is needed.)
 *
 *  Events (all fired on the element AND document): wcaddresschange (canonical) +
 *    wc-address:change + google-address:change + wcgoogleaddresschange (aliases), detail:
 *    { addressGroup, street, city, state, postal_code, county, country, lat, lng,
 *      formatted_address, formatted_address_encoded, formatted_address_slug, place_id,
 *      source, approximate }.
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcAddress extends WcBaseFormComponent {
  static get is() {
    return 'wc-address';
  }

  static get observedAttributes() {
    return [
      'name', 'id', 'class', 'value', 'placeholder',
      'lbl-label', 'lbl-class', 'elt-class',
      'disabled', 'readonly', 'required', 'autocomplete',
      'geocode-url', 'address-group', 'target-map',
      'countries', 'types', 'icon-name',
      'api-key', 'fields',
      'data-lat', 'data-lng', 'data-address',
      'onchange', 'oninput', 'onblur', 'onfocus',
      'tooltip', 'tooltip-position'
    ];
  }

  constructor() {
    super();

    this.passThruAttributes = ['id', 'value', 'placeholder', 'autocomplete'];
    this.passThruEmptyAttributes = ['disabled', 'readonly', 'required'];
    this.ignoreAttributes = ['lbl-class', 'lbl-label',
                             'geocode-url', 'address-group', 'target-map',
                             'countries', 'types', 'icon-name',
                             'api-key', 'fields',
                             'data-lat', 'data-lng', 'data-address'];
    this.eventAttributes = ['onchange', 'oninput', 'onblur', 'onfocus'];

    const compEl = this.querySelector('.wc-address');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-address', 'relative');
      this.appendChild(this.componentElement);
    }

    this.selectedPlace = null;
  }

  connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._updateMapFromInitialData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
    this.selectedPlace = null;
  }

  _geocodeBase() {
    return (this.getAttribute('geocode-url') || '/api/geocode').replace(/\/$/, '');
  }

  _wireEvents() {
    super._wireEvents();
    if (!this.formElement) return;

    if (this._autocompleteEventsWired) return;
    this._autocompleteEventsWired = true;

    this._suggestionsContainer = this.querySelector('.address-suggestions');
    if (!this._suggestionsContainer) {
      this._suggestionsContainer = document.createElement('div');
      this._suggestionsContainer.classList.add('address-suggestions', 'hidden');
      this.componentElement.appendChild(this._suggestionsContainer);
    }

    let debounceTimer;
    const debounce = (func, delay) => (...args) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => func.apply(this, args), delay);
    };

    this._handleInputDebounced = debounce((e) => {
      const input = e.target.value.trim();
      if (input.length < 3) {
        this._hideSuggestions(this._suggestionsContainer);
        return;
      }
      this._fetchSuggestions(input, this._suggestionsContainer);
    }, 300);
    this.formElement.addEventListener('input', this._handleInputDebounced);

    this._handleKeydown = (e) => {
      const suggestions = this._suggestionsContainer.querySelectorAll('.address-suggestion-item');
      if (suggestions.length === 0) return;

      const currentIndex = Array.from(suggestions).findIndex(item => item.classList.contains('highlighted'));

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          let nextIndex;
          if (currentIndex === -1) nextIndex = 0;
          else if (currentIndex < suggestions.length - 1) nextIndex = currentIndex + 1;
          else nextIndex = 0;
          this._highlightSuggestion(suggestions, nextIndex);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          let prevIndex;
          if (currentIndex === -1) prevIndex = suggestions.length - 1;
          else if (currentIndex > 0) prevIndex = currentIndex - 1;
          else prevIndex = suggestions.length - 1;
          this._highlightSuggestion(suggestions, prevIndex);
          break;
        }
        case 'Enter':
          if (currentIndex >= 0) {
            e.preventDefault();
            const item = suggestions[currentIndex];
            this._selectPlace(item.dataset.placeId, item);
            this._hideSuggestions(this._suggestionsContainer);
          }
          break;
        case 'Escape':
          e.preventDefault();
          this._hideSuggestions(this._suggestionsContainer);
          break;
      }
    };
    this.formElement.addEventListener('keydown', this._handleKeydown);

    this._handleDocumentClick = (e) => {
      if (!this.contains(e.target)) this._hideSuggestions(this._suggestionsContainer);
    };
    document.addEventListener('click', this._handleDocumentClick);

    this._handleBlur = () => {
      setTimeout(() => {
        if (!this.querySelector('.address-suggestions:hover')) {
          this._hideSuggestions(this._suggestionsContainer);
        }
      }, 200);
    };
    this.formElement.addEventListener('blur', this._handleBlur);
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.formElement) {
      if (this._handleInputDebounced) this.formElement.removeEventListener('input', this._handleInputDebounced);
      if (this._handleKeydown) this.formElement.removeEventListener('keydown', this._handleKeydown);
      if (this._handleBlur) this.formElement.removeEventListener('blur', this._handleBlur);
    }
    if (this._handleDocumentClick) document.removeEventListener('click', this._handleDocumentClick);
    if (this._suggestionsContainer) {
      this._suggestionsContainer.remove();
      this._suggestionsContainer = null;
    }
    this._autocompleteEventsWired = false;
  }

  async _fetchSuggestions(input, container) {
    const params = new URLSearchParams({ q: input });
    const countries = this.getAttribute('countries');
    if (countries) params.set('countries', countries);
    const url = `${this._geocodeBase()}/autocomplete?${params.toString()}`;

    try {
      const resp = await fetch(url, { headers: { accept: 'application/json' } });
      if (!resp.ok) { this._hideSuggestions(container); return; }
      const data = await resp.json();
      const suggestions = Array.isArray(data) ? data : (data && Array.isArray(data.results) ? data.results : []);
      if (!suggestions.length) { this._hideSuggestions(container); return; }
      this._displaySuggestions(suggestions, container);
    } catch (error) {
      console.error('wc-address: Error fetching suggestions:', error);
      this._hideSuggestions(container);
    }
  }

  _displaySuggestions(suggestions, container) {
    container.innerHTML = '';
    container.classList.remove('hidden');

    suggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.classList.add('address-suggestion-item');
      item.textContent = suggestion.label || suggestion.formatted_address || '';
      item.dataset.placeId = suggestion.id != null ? String(suggestion.id) : '';
      if (suggestion.lat != null) item.dataset.lat = suggestion.lat;
      if (suggestion.lng != null) item.dataset.lng = suggestion.lng;

      // mousedown fires before blur so the pick isn't lost to the blur handler.
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._selectPlace(item.dataset.placeId, item);
        this._hideSuggestions(container);
      });

      container.appendChild(item);
    });
  }

  _hideSuggestions(container) {
    if (!container) return;
    container.classList.add('hidden');
    container.innerHTML = '';
  }

  _highlightSuggestion(suggestions, index) {
    suggestions.forEach(item => item.classList.remove('highlighted'));
    if (suggestions[index]) {
      suggestions[index].classList.add('highlighted');
      suggestions[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  async _selectPlace(id, item) {
    const url = `${this._geocodeBase()}/details?id=${encodeURIComponent(id)}`;
    try {
      const resp = await fetch(url, { headers: { accept: 'application/json' } });
      if (resp.ok) {
        const detail = await resp.json();
        this._processResult(detail, id);
        return;
      }
    } catch (error) {
      console.error('wc-address: Error fetching place details:', error);
    }
    // Fallback: use the suggestion's own label + lat/lng if details couldn't resolve.
    if (item) {
      this._processResult({
        formatted_address: item.textContent || '',
        lat: item.dataset.lat != null ? parseFloat(item.dataset.lat) : null,
        lng: item.dataset.lng != null ? parseFloat(item.dataset.lng) : null
      }, id);
    }
  }

  _processResult(detail, id) {
    const addressData = this._toAddressData(detail, id);

    if (this.formElement) {
      this.formElement.value = addressData.street || addressData.formatted_address || this.formElement.value;
    }

    this.selectedPlace = addressData;
    this._broadcastAddressChange(addressData);

    const targetMap = this.getAttribute('target-map');
    if (targetMap) this._updateMap(targetMap, addressData);

    if (this.formElement) {
      this.formElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  _toAddressData(d, id) {
    d = d || {};
    const formattedAddress = d.formatted_address || '';
    return {
      addressGroup: this.getAttribute('address-group') || 'address',
      street: d.street || '',
      city: d.city || '',
      state: d.state || '',
      postal_code: d.postal_code || '',
      county: d.county || '',
      country: d.country || '',
      lat: d.lat != null ? d.lat : null,
      lng: d.lng != null ? d.lng : null,
      formatted_address: formattedAddress,
      formatted_address_encoded: encodeURIComponent(formattedAddress),
      formatted_address_slug: this._createAddressSlug(formattedAddress),
      place_id: id != null ? String(id) : '',
      source: d.source || '',
      approximate: d.approximate != null ? d.approximate : undefined
    };
  }

  _createAddressSlug(formattedAddress) {
    if (!formattedAddress) return '';
    return formattedAddress
      .replace(/,?\s*(USA|United States|US)$/i, '')
      .replace(/,/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\s/g, '-');
  }

  _broadcastAddressChange(addressData) {
    // Canonical lowercase event + colon aliases (incl. the old google-address:change so
    // existing consumers work after a find-replace of the tag name). Fired on element + document.
    const names = ['wcaddresschange', 'wc-address:change', 'wcgoogleaddresschange', 'google-address:change'];
    names.forEach(name => {
      this.dispatchEvent(new CustomEvent(name, { detail: addressData, bubbles: true, composed: true }));
      document.dispatchEvent(new CustomEvent(name, { detail: addressData, bubbles: true, composed: true }));
    });
    if (window.wc?.EventHub) {
      wc.EventHub.broadcast('wcaddresschange', [], addressData);
    }
  }

  _updateMap(targetMapId, addressData) {
    if (addressData.lat == null || addressData.lng == null) return;
    const mapElement = document.getElementById(targetMapId);
    if (!mapElement) {
      console.warn(`wc-address: Map element with id "${targetMapId}" not found`);
      return;
    }
    const tag = mapElement.tagName.toLowerCase();
    if (tag !== 'wc-map' && tag !== 'wc-google-map') {
      console.warn(`wc-address: target-map "${targetMapId}" is not a wc-map/wc-google-map`);
      return;
    }
    mapElement.setAttribute('lat', addressData.lat);
    mapElement.setAttribute('lng', addressData.lng);
    mapElement.setAttribute('address', addressData.formatted_address);
  }

  _updateMapFromInitialData() {
    const lat = this.getAttribute('data-lat');
    const lng = this.getAttribute('data-lng');
    const targetMap = this.getAttribute('target-map');
    if (!lat || !lng || !targetMap) return;

    const mapElement = document.getElementById(targetMap);
    if (!mapElement) return;

    const pins = [{
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      title: this.getAttribute('data-address') || this.getAttribute('value') || ''
    }];

    if (mapElement.updatePins) {
      mapElement.updatePins(pins);
    } else {
      mapElement.addEventListener('map-loaded', () => {
        if (mapElement.updatePins) mapElement.updatePins(pins);
      }, { once: true });
    }
  }

  _handleAttributeChange(attrName, newValue) {
    if (this.eventAttributes.includes(attrName)) {
      if (this.formElement && newValue) {
        const eventHandler = new Function('event', `
          const element = event.target;
          const value = element.value;
          with (element) {
            ${newValue}
          }
        `);
        const eventName = attrName.substring(2);
        this.formElement.addEventListener(eventName, eventHandler);
      }
      return;
    }

    if (this.passThruAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, newValue);
      return;
    }
    if (this.passThruEmptyAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, '');
      return;
    }
    if (this.ignoreAttributes.includes(attrName)) {
      return;
    }
    if (attrName === 'tooltip' || attrName === 'tooltip-position') {
      this._createTooltipElement();
      return;
    }
    if (attrName === 'lbl-class') {
      const name = this.getAttribute('name');
      const lbl = this.querySelector(`label[for="${name}"]`);
      lbl?.classList.add(newValue);
      return;
    }

    super._handleAttributeChange(attrName, newValue);
  }

  _render() {
    const name = this.getAttribute('name') || 'address';
    const lblLabel = this.getAttribute('lbl-label') || '';
    const placeholder = this.getAttribute('placeholder') || 'Start typing an address...';
    const value = this.getAttribute('value') || '';

    this.componentElement.innerHTML = '';

    if (lblLabel) {
      const label = document.createElement('label');
      label.setAttribute('for', name);
      label.textContent = lblLabel;
      this.componentElement.appendChild(label);
    }

    this.formElement = document.createElement('input');
    this.formElement.setAttribute('type', 'text');
    this.formElement.setAttribute('name', name);
    this.formElement.setAttribute('id', name);
    this.formElement.setAttribute('form-element', '');
    this.formElement.setAttribute('class', 'form-control');
    this.formElement.setAttribute('placeholder', placeholder);
    this.formElement.setAttribute('autocomplete', 'off');
    if (value) this.formElement.value = value;

    const eltClass = this.getAttribute('elt-class');
    if (eltClass) this.formElement.setAttribute('class', eltClass);

    this.componentElement.appendChild(this.formElement);

    const iconName = this.getAttribute('icon-name') || 'house';
    const icon = document.createElement('wc-fa-icon');
    icon.setAttribute('name', iconName);
    icon.setAttribute('icon-style', 'solid');
    icon.setAttribute('size', '1rem');
    icon.classList.add('address-icon');
    this.componentElement.appendChild(icon);

    this.labelElement = this.componentElement.querySelector('label');
  }

  _applyStyle() {
    const style = `
      wc-address {
        display: contents;
      }
      wc-address input[type="text"] {
        padding-left: 30px;
        min-width: 120px;
      }
      wc-address wc-fa-icon.address-icon {
        position: absolute;
        top: 50%;
        left: 5px;
        pointer-events: none;
        align-items: center;
        justify-content: center;
      }
      wc-address input:focus {
        outline: none;
        border-color: var(--component-border-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
      .address-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 2px;
        background: var(--component-bg-color, #fff);
        color: var(--component-color, #1f2937);
        border-radius: 0.375rem;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }
      .address-suggestions.hidden {
        display: none;
      }
      .address-suggestion-item {
        padding: 0.875rem 1rem;
        cursor: pointer;
        border-bottom: 1px solid var(--component-border-color, #e5e7eb);
        transition: all 0.15s ease;
        font-size: 0.95rem;
        color: var(--component-color, #1f2937);
      }
      .address-suggestion-item:last-child {
        border-bottom: none;
      }
      .address-suggestion-item:hover {
        background-color: var(--surface-2, #f3f4f6);
      }
      .address-suggestion-item.highlighted {
        background-color: var(--primary-bg-color, #3b82f6);
        color: var(--primary-color, #fff);
        font-weight: 500;
      }
      /* Attribution required by LocationIQ / provider ToS — the app surfaces this once
         near the field (e.g. "Search by LocationIQ"); component keeps markup minimal. */
    `.trim();

    this.loadStyle('wc-address-style', style);
  }

  get value() {
    return this.formElement?.value || '';
  }

  set value(val) {
    if (this.formElement) this.formElement.value = val;
  }

  getPlaceData() {
    return this.selectedPlace;
  }
}

customElements.define(WcAddress.is, WcAddress);

export { WcAddress };
