/**
 *
 *  Name: wc-address-listener
 *  Usage:
 *    <!-- Wrap form fields that should respond to address changes -->
 *    <wc-address-listener address-group="address">
 *      <wc-input name="address.city" lbl-label="City" required></wc-input>
 *      <wc-select name="address.state" lbl-label="State" required>
 *        <option value="">Choose...</option>
 *        <option value="CA">CA</option>
 *        <option value="NY">NY</option>
 *      </wc-select>
 *      <wc-input name="address.postal_code" lbl-label="ZIP" required></wc-input>
 *      <wc-input name="address.county" lbl-label="County"></wc-input>
 *    </wc-address-listener>
 *
 *    <!-- Or apply directly to individual fields -->
 *    <wc-input name="address.city" lbl-label="City" address-listener="address"></wc-input>
 *
 *  Attributes:
 *    - address-group: The address group to listen for (must match wc-google-address address-group)
 *
 *  Direct Field Attribute (alternative approach):
 *    - address-listener: Add this attribute directly to wc-input/wc-select to make it listen
 *
 *  How it works:
 *    1. Listens for 'google-address:change' events
 *    2. Filters events by matching addressGroup
 *    3. Updates child form fields based on their name attribute
 *    4. Supports mapping: name="address.city" gets updated from addressData.city
 *
 *  Field Mapping:
 *    - *.street -> street
 *    - *.apt_suite -> apt_suite (not auto-filled, user enters manually)
 *    - *.city -> city
 *    - *.state -> state
 *    - *.postal_code -> postal_code
 *    - *.zip -> postal_code (alias)
 *    - *.county -> county
 *    - *.country -> country
 *
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcAddressListener extends WcBaseComponent {
  static get is() {
    return 'wc-address-listener';
  }

  static get observedAttributes() {
    return ['address-group'];
  }

  constructor() {
    super();
    this.boundHandleAddressChange = this._handleAddressChange.bind(this);
  }

  connectedCallback() {
    super.connectedCallback();

    // Listen for address change events
    document.addEventListener('google-address:change', this.boundHandleAddressChange);

    // Also check if any child elements have the address-listener attribute
    this._setupDirectListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('google-address:change', this.boundHandleAddressChange);
  }

  _setupDirectListeners() {
    // Find all form elements with address-listener attribute within this element
    const listenableElements = this.querySelectorAll('[address-listener]');

    listenableElements.forEach(element => {
      if (!element._addressListenerSetup) {
        element._addressListenerSetup = true;
        element._handleDirectAddressChange = (event) => {
          const listenerGroup = element.getAttribute('address-listener');
          const addressData = event.detail;

          if (addressData.addressGroup === listenerGroup) {
            this._updateFieldValue(element, addressData);
          }
        };

        document.addEventListener('google-address:change', element._handleDirectAddressChange);
      }
    });
  }

  _handleAddressChange(event) {
    const addressData = event.detail;

    // Get the address group this listener is watching
    const targetGroup = this.getAttribute('address-group');

    // Only process if this event is for our group
    if (!targetGroup || addressData.addressGroup !== targetGroup) {
      return;
    }

    // console.log(`🎯 wc-address-listener: Received address data for group "${targetGroup}":`, addressData);

    // Find and update all child form fields
    this._updateChildFields(addressData);
  }

  _updateChildFields(addressData) {
    // Find all wc-input and wc-select elements within this listener
    const formFields = this.querySelectorAll('wc-input, wc-select, input, select');

    formFields.forEach(field => {
      this._updateFieldValue(field, addressData);
    });
  }

  _updateFieldValue(field, addressData) {
    const fieldName = field.getAttribute('name');
    if (!fieldName) return;

    // Parse the field name to determine which address component it maps to
    const fieldMapping = this._getFieldMapping(fieldName);
    if (!fieldMapping) return;

    const newValue = addressData[fieldMapping];
    if (newValue === undefined || newValue === null) return;

    // Update the field value based on its type
    if (field.tagName.toLowerCase() === 'wc-input' || field.tagName.toLowerCase() === 'wc-select') {
      // Custom web component - use the value property
      field.value = newValue;

      // Also trigger change event
      field.dispatchEvent(new Event('change', { bubbles: true }));

      // console.log(`  ✓ Updated ${fieldName} = "${newValue}"`);
    } else if (field.tagName.toLowerCase() === 'input' || field.tagName.toLowerCase() === 'select') {
      // Native HTML element
      field.value = newValue;

      // Trigger change event
      field.dispatchEvent(new Event('change', { bubbles: true }));

      // console.log(`  ✓ Updated ${fieldName} = "${newValue}"`);
    }
  }

  _getFieldMapping(fieldName) {
    // Extract the last part of the field name after the last dot
    // e.g., "address.city" -> "city", "billing.postal_code" -> "postal_code"
    const parts = fieldName.split('.');
    const fieldKey = parts[parts.length - 1];

    // Map common variations to our address data keys
    const mappings = {
      'street': 'street',
      'address': 'street',
      'address1': 'street',
      'address_1': 'street',
      'apt': 'apt_suite',
      'apt_suite': 'apt_suite',
      'suite': 'apt_suite',
      'address2': 'apt_suite',
      'address_2': 'apt_suite',
      'city': 'city',
      'state': 'state',
      'province': 'state',
      'postal_code': 'postal_code',
      'postalcode': 'postal_code',
      'zip': 'postal_code',
      'zipcode': 'postal_code',
      'zip_code': 'postal_code',
      'county': 'county',
      'country': 'country',
      'lat': 'lat',
      'latitude': 'lat',
      'lng': 'lng',
      'lon': 'lng',
      'longitude': 'lng',
      'formatted_address': 'formatted_address',
      'formatted_address_encoded': 'formatted_address_encoded',
      'formattedaddress': 'formatted_address',
      'formattedaddressencoded': 'formatted_address_encoded',
      'place_id': 'place_id',
      'placeid': 'place_id'
    };

    return mappings[fieldKey.toLowerCase()] || null;
  }

  _handleAttributeChange(attrName, newValue) {
    // If address-group changes, we'll just rely on the next event to use the new group
    if (attrName === 'address-group') {
      // console.log(`wc-address-listener: Now listening for address group "${newValue}"`);
    }
  }

  _render() {
    // This component doesn't render anything, it just wraps children
    // Use slot to display children
    if (!this.querySelector('slot')) {
      const slot = document.createElement('slot');
      this.appendChild(slot);
    }
  }
}

customElements.define(WcAddressListener.is, WcAddressListener);

export { WcAddressListener };
