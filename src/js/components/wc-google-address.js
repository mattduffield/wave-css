/**
 *
 *  Name: wc-google-address
 *  Usage:
 *    <wc-google-address
 *      name="address.street"
 *      lbl-label="Street Address"
 *      api-key="YOUR_API_KEY"
 *      address-group="address"
 *      target-map="map1"
 *      countries="us"
 *      types="address"
 *      required>
 *    </wc-google-address>
 *
 *  Attributes:
 *    - api-key: Google Maps API key (required)
 *    - address-group: Group identifier for related address fields (default: "address")
 *    - target-map: ID of wc-google-map to update when address is selected
 *    - countries: Comma-separated country codes to restrict results (e.g., "us" or "us,ca,mx")
 *    - types: Place types to search (default: "address"). Options: "address", "geocode", "establishment", etc.
 *    - fields: Comma-separated fields to return from Places API (default: "address_components,formatted_address,geometry,name")
 *    - Plus all standard form attributes: name, lbl-label, placeholder, required, disabled, readonly, etc.
 *
 *  Events:
 *    - google-address:change - Broadcasts when address is selected with structured address data
 *
 *  Event Data Structure:
 *    {
 *      addressGroup: "address",
 *      street: "123 Main St",
 *      apt_suite: "",
 *      city: "San Francisco",
 *      state: "CA",
 *      postal_code: "94102",
 *      county: "San Francisco County",
 *      country: "US",
 *      lat: 37.7749,
 *      lng: -122.4194,
 *      formatted_address: "123 Main St, San Francisco, CA 94102, USA",
 *      place_id: "ChIJIQBpAG2ahYAR_6128GcTUEo"
 *    }
 *
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcGoogleAddress extends WcBaseFormComponent {
  static get is() {
    return 'wc-google-address';
  }

  static get observedAttributes() {
    return [
      'name', 'id', 'class', 'value', 'placeholder',
      'lbl-label', 'lbl-class', 'elt-class',
      'disabled', 'readonly', 'required', 'autocomplete',
      'api-key', 'address-group', 'target-map',
      'countries', 'types', 'fields',
      'data-lat', 'data-lng', 'data-address',
      'onchange', 'oninput', 'onblur', 'onfocus',
      'tooltip', 'tooltip-position'
    ];
  }

  // Static property to track if Google Places API is loaded
  static isGooglePlacesLoaded = false;
  static googlePlacesLoadPromise = null;

  constructor() {
    super();

    this.passThruAttributes = ['name', 'id', 'value', 'placeholder', 'autocomplete'];
    this.passThruEmptyAttributes = ['disabled', 'readonly', 'required'];
    this.ignoreAttributes = ['lbl-class', 'lbl-label',
                             'api-key', 'address-group', 'target-map',
                             'countries', 'types', 'fields',
                             'data-lat', 'data-lng', 'data-address'];
    this.eventAttributes = ['onchange', 'oninput', 'onblur', 'onfocus'];

    const compEl = this.querySelector('.wc-google-address');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-google-address', 'relative');
      this.appendChild(this.componentElement);
    }

    // Using new API - no service objects needed
    this.sessionToken = null;
    this.selectedPlace = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();

    const apiKey = this.getAttribute('api-key');
    if (!apiKey) {
      console.error('wc-google-address: api-key attribute is required');
      return;
    }

    await this._loadGooglePlacesAPI(apiKey);
    this._initializeAutocomplete();
    this._updateMapFromInitialData();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();

    // Clean up session token
    this.sessionToken = null;
    this.selectedPlace = null;
  }

  async _loadGooglePlacesAPI(apiKey) {
    // Check if Google Maps API is already loaded (by any component)
    if (window.google?.maps) {
      // Check if places library is available
      if (window.google.maps.places) {
        WcGoogleAddress.isGooglePlacesLoaded = true;
        return Promise.resolve();
      }

      // Google Maps is loaded but places library is not
      console.warn('wc-google-address: Google Maps API is loaded but places library is missing. You may need to include libraries=places in the initial load.');
      // We'll try to continue anyway and see if it works
      return Promise.resolve();
    }

    // If already loaded by us, return immediately
    if (WcGoogleAddress.isGooglePlacesLoaded) {
      return Promise.resolve();
    }

    // If currently loading, wait for that promise
    if (WcGoogleAddress.googlePlacesLoadPromise) {
      return WcGoogleAddress.googlePlacesLoadPromise;
    }

    // Check if script tag already exists (loaded by another component)
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      //console.log('wc-google-address: Google Maps script already exists, waiting for it to load...');
      WcGoogleAddress.googlePlacesLoadPromise = new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkLoaded);
            WcGoogleAddress.isGooglePlacesLoaded = true;
            resolve();
          }
        }, 100);
      });
      return WcGoogleAddress.googlePlacesLoadPromise;
    }

    // Start loading (no existing script found)
    WcGoogleAddress.googlePlacesLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async&v=weekly`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // With loading=async, we need to wait for the places library to be fully available
        const checkPlacesReady = setInterval(() => {
          if (window.google?.maps?.places) {
            clearInterval(checkPlacesReady);
            WcGoogleAddress.isGooglePlacesLoaded = true;
            //console.log('✅ Google Places API loaded successfully');
            resolve();
          }
        }, 50);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkPlacesReady);
          if (!WcGoogleAddress.isGooglePlacesLoaded) {
            reject(new Error('Timeout waiting for Google Places API'));
          }
        }, 10000);
      };

      script.onerror = () => {
        const error = new Error('Failed to load Google Places API');
        console.error('❌', error);
        reject(error);
      };

      document.head.appendChild(script);
    });

    return WcGoogleAddress.googlePlacesLoadPromise;
  }

  _initializeAutocomplete() {
    if (!window.google?.maps?.places) {
      // Places API not ready yet, wait and retry
      setTimeout(() => this._initializeAutocomplete(), 100);
      return;
    }

    // Create a new session token for billing optimization
    this.sessionToken = new google.maps.places.AutocompleteSessionToken();

    // Note: Using new API - no service initialization needed
    // - AutocompleteSuggestion.fetchAutocompleteSuggestions() for suggestions
    // - Place.fetchFields() for place details

    // Mark as initialized
    this._autocompleteInitialized = true;
  }

  _wireEvents() {
    super._wireEvents();

    if (!this.formElement) return;

    // Prevent duplicate event listeners
    if (this._autocompleteEventsWired) return;
    this._autocompleteEventsWired = true;

    this._suggestionsContainer = this.querySelector('.address-suggestions');
    if (!this._suggestionsContainer) {
      this._suggestionsContainer = document.createElement('div');
      this._suggestionsContainer.classList.add('address-suggestions');
      this.componentElement.appendChild(this._suggestionsContainer);
    }

    // Debounce function for input
    let debounceTimer;
    const debounce = (func, delay) => {
      return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
      };
    };

    // Store handler references for cleanup
    this._handleInputDebounced = debounce((e) => {
      const input = e.target.value.trim();

      if (input.length < 3) {
        this._hideSuggestions(this._suggestionsContainer);
        return;
      }

      this._fetchSuggestions(input, this._suggestionsContainer);
    }, 300);

    this.formElement.addEventListener('input', this._handleInputDebounced);

    // Keyboard navigation for suggestions
    this._handleKeydown = (e) => {
      const suggestions = this._suggestionsContainer.querySelectorAll('.address-suggestion-item');
      if (suggestions.length === 0) return;

      const currentIndex = Array.from(suggestions).findIndex(item =>
        item.classList.contains('highlighted')
      );

      switch(e.key) {
        case 'ArrowDown':
          e.preventDefault();
          // Move DOWN the list (increase index)
          let nextIndex;
          if (currentIndex === -1) {
            // No selection - go to first item
            nextIndex = 0;
          } else if (currentIndex < suggestions.length - 1) {
            // Move to next item
            nextIndex = currentIndex + 1;
          } else {
            // At end - wrap to beginning
            nextIndex = 0;
          }
          this._highlightSuggestion(suggestions, nextIndex);
          break;

        case 'ArrowUp':
          e.preventDefault();
          // Move UP the list (decrease index)
          let prevIndex;
          if (currentIndex === -1) {
            // No selection - go to last item
            prevIndex = suggestions.length - 1;
          } else if (currentIndex > 0) {
            // Move to previous item
            prevIndex = currentIndex - 1;
          } else {
            // At beginning - wrap to end
            prevIndex = suggestions.length - 1;
          }
          this._highlightSuggestion(suggestions, prevIndex);
          break;

        case 'Enter':
          if (currentIndex >= 0) {
            e.preventDefault();
            const placeId = suggestions[currentIndex].dataset.placeId;
            this._selectPlace(placeId);
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

    // Hide suggestions when clicking outside
    this._handleDocumentClick = (e) => {
      if (!this.contains(e.target)) {
        this._hideSuggestions(this._suggestionsContainer);
      }
    };
    document.addEventListener('click', this._handleDocumentClick);

    // Handle blur - slight delay to allow click on suggestions
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

    // Remove event listeners
    if (this.formElement) {
      if (this._handleInputDebounced) {
        this.formElement.removeEventListener('input', this._handleInputDebounced);
      }
      if (this._handleKeydown) {
        this.formElement.removeEventListener('keydown', this._handleKeydown);
      }
      if (this._handleBlur) {
        this.formElement.removeEventListener('blur', this._handleBlur);
      }
    }

    if (this._handleDocumentClick) {
      document.removeEventListener('click', this._handleDocumentClick);
    }

    // Clean up suggestions container
    if (this._suggestionsContainer) {
      this._suggestionsContainer.remove();
      this._suggestionsContainer = null;
    }

    // Reset flags
    this._autocompleteEventsWired = false;
  }

  async _fetchSuggestions(input, container) {
    const request = {
      input: input,
      sessionToken: this.sessionToken
    };

    // Add country restrictions if specified
    const countries = this.getAttribute('countries');
    if (countries) {
      request.includedRegionCodes = countries.split(',').map(c => c.trim());
    }

    // Add types if specified
    // Note: The new API doesn't support 'address' type. For addresses, omit the type.
    // Valid types: https://developers.google.com/maps/documentation/places/web-service/place-types
    const types = this.getAttribute('types');
    if (types && types !== 'address') {
      request.includedPrimaryTypes = types.split(',').map(t => t.trim()).filter(t => t !== 'address');
      // Only add if there are valid types after filtering
      if (request.includedPrimaryTypes.length === 0) {
        delete request.includedPrimaryTypes;
      }
    }

    try {
      // Use new API: AutocompleteSuggestion.fetchAutocompleteSuggestions()
      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);

      if (!suggestions || suggestions.length === 0) {
        this._hideSuggestions(container);
        return;
      }

      this._displaySuggestions(suggestions, container);
    } catch (error) {
      console.error('wc-google-address: Error fetching suggestions:', error);
      this._hideSuggestions(container);
    }
  }

  _displaySuggestions(suggestions, container) {
    container.innerHTML = '';
    container.classList.remove('hidden');

    suggestions.forEach(suggestion => {
      const item = document.createElement('div');
      item.classList.add('address-suggestion-item');
      // New API uses placePrediction.text instead of description
      item.textContent = suggestion.placePrediction.text;
      // Store the place ID
      item.dataset.placeId = suggestion.placePrediction.placeId;

      // Use mousedown instead of click to fire before blur event
      item.addEventListener('mousedown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._selectPlace(suggestion.placePrediction.placeId);
        this._hideSuggestions(container);
      });

      container.appendChild(item);
    });
  }

  _hideSuggestions(container) {
    container.classList.add('hidden');
    container.innerHTML = '';
  }

  _highlightSuggestion(suggestions, index) {
    // Remove highlight from all suggestions
    suggestions.forEach(item => item.classList.remove('highlighted'));

    // Add highlight to the selected suggestion
    if (suggestions[index]) {
      suggestions[index].classList.add('highlighted');
      // Scroll into view if needed
      suggestions[index].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }

  async _selectPlace(placeId) {
    const fields = this.getAttribute('fields') || 'addressComponents,formattedAddress,location,displayName';

    try {
      // Use new API: Create Place instance first, then fetch fields
      const place = new google.maps.places.Place({
        id: placeId,
        requestedLanguage: 'en',
        requestedRegion: 'US'
      });

      // Fetch the fields we need
      const fieldsList = fields.split(',').map(f => f.trim());
      await place.fetchFields({
        fields: fieldsList
      });

      if (!place) {
        console.error('wc-google-address: Failed to get place details');
        return;
      }

      // Reset session token after place selection
      this.sessionToken = new google.maps.places.AutocompleteSessionToken();

      this._processPlaceResult(place);
    } catch (error) {
      console.error('wc-google-address: Error fetching place details:', error);
    }
  }

  _processPlaceResult(place) {
    // Parse address components
    const addressData = this._parseAddressComponents(place);

    // Set the input value to the street address
    if (this.formElement) {
      this.formElement.value = addressData.street;
    }

    // Store the selected place data
    this.selectedPlace = addressData;

    // Broadcast event to update other fields
    this._broadcastAddressChange(addressData);

    // Update map if target specified
    const targetMap = this.getAttribute('target-map');
    if (targetMap) {
      this._updateMap(targetMap, addressData);
    }

    // Trigger change event on the input
    if (this.formElement) {
      this.formElement.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }

  _parseAddressComponents(place) {
    // New API uses addressComponents array (camelCase)
    const components = place.addressComponents || [];
    const location = place.location;

    const addressData = {
      addressGroup: this.getAttribute('address-group') || 'address',
      street: '',
      city: '',
      state: '',
      postal_code: '',
      county: '',
      country: '',
      lat: location ? location.lat() : null,
      lng: location ? location.lng() : null,
      formatted_address: place.formattedAddress || '',
      place_id: place.id || ''
    };

    // Build street address from street number and route
    let streetNumber = '';
    let route = '';

    components.forEach(component => {
      const types = component.types;

      if (types.includes('street_number')) {
        streetNumber = component.longText;
      }
      if (types.includes('route')) {
        route = component.longText;
      }
      if (types.includes('locality')) {
        addressData.city = component.longText;
      }
      if (types.includes('administrative_area_level_1')) {
        addressData.state = component.shortText;
      }
      if (types.includes('administrative_area_level_2')) {
        addressData.county = component.longText;
      }
      if (types.includes('postal_code')) {
        addressData.postal_code = component.longText;
      }
      if (types.includes('country')) {
        addressData.country = component.shortText;
      }
    });

    // Combine street number and route
    addressData.street = [streetNumber, route].filter(Boolean).join(' ');

    return addressData;
  }

  _broadcastAddressChange(addressData) {
    const event = 'google-address:change';

    // Create custom event with detail
    const customEvent = new CustomEvent(event, {
      detail: addressData,
      bubbles: true,
      composed: true
    });

    // Dispatch on document
    document.dispatchEvent(customEvent);

    // Also use EventHub if available
    if (window.wc?.EventHub) {
      wc.EventHub.broadcast(event, [], addressData);
    }
  }

  _updateMap(targetMapId, addressData) {
    if (!addressData.lat || !addressData.lng) return;

    const mapElement = document.getElementById(targetMapId);
    if (!mapElement || mapElement.tagName.toLowerCase() !== 'wc-google-map') {
      console.warn(`wc-google-address: Map element with id "${targetMapId}" not found`);
      return;
    }

    // Update map attributes
    mapElement.setAttribute('lat', addressData.lat);
    mapElement.setAttribute('lng', addressData.lng);
    mapElement.setAttribute('address', addressData.formatted_address);
  }

  _updateMapFromInitialData() {
    const lat = this.getAttribute('data-lat');
    const lng = this.getAttribute('data-lng');
    const targetMap = this.getAttribute('target-map');

    if (!lat || !lng || !targetMap) {
      return;
    }

    const mapElement = document.getElementById(targetMap);
    if (!mapElement) {
      return;
    }

    const pins = [{
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      title: this.getAttribute('data-address') || this.getAttribute('value') || ''
    }];

    // Listen for map-loaded event
    mapElement.addEventListener('map-loaded', () => {
      if (mapElement.updatePins) {
        mapElement.updatePins(pins);
      }
    }, { once: true });
  }

  _handleAttributeChange(attrName, newValue) {
    // Handle event attributes
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

    // Handle pass-through attributes
    if (this.passThruAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, newValue);
      return;
    }

    if (this.passThruEmptyAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, '');
      return;
    }

    if (this.ignoreAttributes.includes(attrName)) {
      // Do nothing...
      return;
    }

    // Handle tooltip
    if (attrName === 'tooltip' || attrName === 'tooltip-position') {
      this._createTooltipElement();
      return;
    }

    // Handle label class
    if (attrName === 'lbl-class') {
      const name = this.getAttribute('name');
      const lbl = this.querySelector(`label[for="${name}"]`);
      lbl?.classList.add(newValue);
      return;
    }

    // Handle API configuration changes
    if (attrName === 'api-key') {
      // If API key changes, reload
      this._loadGooglePlacesAPI(newValue).then(() => {
        this._initializeAutocomplete();
      });
      return;
    }

    // Let base component handle everything else (including 'class' and 'elt-class')
    super._handleAttributeChange(attrName, newValue);
  }

  _render() {
    const name = this.getAttribute('name') || 'address';
    const lblLabel = this.getAttribute('lbl-label') || '';
    const placeholder = this.getAttribute('placeholder') || 'Start typing an address...';
    const value = this.getAttribute('value') || '';

    // Clear component element
    this.componentElement.innerHTML = '';

    // Create label if specified
    if (lblLabel) {
      const label = document.createElement('label');
      label.setAttribute('for', name);
      label.textContent = lblLabel;
      this.componentElement.appendChild(label);
    }

    // Create input element
    this.formElement = document.createElement('input');
    this.formElement.setAttribute('type', 'text');
    this.formElement.setAttribute('name', name);
    this.formElement.setAttribute('id', name);
    this.formElement.setAttribute('form-element', '');
    this.formElement.setAttribute('class', 'form-control');
    this.formElement.setAttribute('placeholder', placeholder);
    this.formElement.setAttribute('autocomplete', 'off');
    if (value) {
      this.formElement.value = value;
    }

    // Apply elt-class if provided
    const eltClass = this.getAttribute('elt-class');
    if (eltClass) {
      this.formElement.setAttribute('class', eltClass);
    }

    this.componentElement.appendChild(this.formElement);

    // Add address icon using wc-fa-icon (same pattern as wc-vin-decoder)
    const icon = document.createElement('wc-fa-icon');
    icon.setAttribute('name', 'house');
    icon.setAttribute('icon-style', 'solid');
    icon.setAttribute('size', '1rem');
    icon.classList.add('address-icon');
    this.componentElement.appendChild(icon);

    this.labelElement = this.componentElement.querySelector('label');
  }

  _applyStyle() {
    const style = `
      wc-google-address {
        display: contents;
      }

      /* Match wc-input styling with icon */
      wc-google-address input[type="text"] {
        padding-left: 30px;
        min-width: 120px;
      }

      wc-google-address wc-fa-icon.address-icon {
        position: absolute;
        top: 50%;
        left: 5px;
        pointer-events: none;
        align-items: center;
        justify-content: center;
      }

      /* Match wc-input focus styling exactly */
      wc-google-address input:focus {
        outline: none;
        border-color: var(--focus-border-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      /* Dropdown suggestions - improved visibility */
      .address-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 2px;
        background: white;
        border: 2px solid var(--focus-border-color, #3b82f6);
        border-radius: 0.375rem;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }

      .address-suggestions.hidden {
        display: none;
      }

      /* Suggestion items - improved contrast */
      .address-suggestion-item {
        padding: 0.875rem 1rem;
        cursor: pointer;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        transition: all 0.15s ease;
        font-size: 0.95rem;
        color: #1f2937;
      }

      .address-suggestion-item:last-child {
        border-bottom: none;
      }

      .address-suggestion-item:hover {
        background-color: var(--hover-bg-color, #f3f4f6);
      }

      /* Highlighted state for keyboard navigation - more prominent */
      .address-suggestion-item.highlighted {
        background-color: var(--highlight-bg-color, #3b82f6);
        color: white;
        font-weight: 500;
      }
    `.trim();

    this.loadStyle('wc-google-address-style', style);
  }

  // Getter for form value
  get value() {
    return this.formElement?.value || '';
  }

  // Setter for form value
  set value(val) {
    if (this.formElement) {
      this.formElement.value = val;
    }
  }

  // Get full selected place data
  getPlaceData() {
    return this.selectedPlace;
  }
}

customElements.define(WcGoogleAddress.is, WcGoogleAddress);

export { WcGoogleAddress };
