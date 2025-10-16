/**
 *
 *  Name: wc-vin-listener
 *  Usage:
 *    <!-- Wrap form fields that should respond to VIN decoder changes -->
 *    <wc-vin-listener vin-group="vehicle">
 *      <wc-input name="vehicle.year" lbl-label="Year" required></wc-input>
 *      <wc-input name="vehicle.make" lbl-label="Make" required></wc-input>
 *      <wc-input name="vehicle.model" lbl-label="Model" required></wc-input>
 *      <wc-input name="vehicle.trim" lbl-label="Trim"></wc-input>
 *      <wc-input name="vehicle.msrp" lbl-label="MSRP"></wc-input>
 *    </wc-vin-listener>
 *
 *    <!-- Or apply directly to individual fields -->
 *    <wc-input name="vehicle.year" lbl-label="Year" vin-listener="vehicle"></wc-input>
 *
 *  Attributes:
 *    - vin-group: The VIN group to listen for (must match wc-vin-decoder vin-group)
 *
 *  Direct Field Attribute (alternative approach):
 *    - vin-listener: Add this attribute directly to wc-input/wc-select to make it listen
 *
 *  How it works:
 *    1. Listens for 'vin-decoder:change' events
 *    2. Filters events by matching vinGroup
 *    3. Updates child form fields based on their name attribute
 *    4. Supports mapping: name="vehicle.year" gets updated from vinData.year
 *
 *  Field Mapping:
 *    Supports all VIN decoder response fields:
 *    - *.year -> year
 *    - *.make -> make
 *    - *.model -> model
 *    - *.trim -> trim
 *    - *.series -> series
 *    - *.msrp -> msrp
 *    - *.basePrice -> basePrice
 *    - *.bodyClass -> bodyClass
 *    - *.doors -> doors
 *    - *.wheels -> wheels
 *    - *.seats -> seats
 *    - *.vehicleType -> vehicleType
 *    - *.engineCylinders -> engineCylinders
 *    - *.displacementCC -> displacementCC
 *    - *.displacementCI -> displacementCI
 *    - *.displacementL -> displacementL
 *    - *.transmissionStyle -> transmissionStyle
 *    - *.transmissionSpeeds -> transmissionSpeeds
 *    - *.driveType -> driveType
 *    - *.axles -> axles
 *    - *.fuelType -> fuelType
 *    - *.manufacturerName -> manufacturerName
 *    - *.engineManufacturer -> engineManufacturer
 *    - *.plantCompanyName -> plantCompanyName
 *    - *.plantCountry -> plantCountry
 *    - *.plantState -> plantState
 *
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcVinListener extends WcBaseComponent {
  static get is() {
    return 'wc-vin-listener';
  }

  static get observedAttributes() {
    return ['vin-group'];
  }

  constructor() {
    super();
    this.boundHandleVinChange = this._handleVinChange.bind(this);

    // Create component wrapper element
    const compEl = this.querySelector('.wc-vin-listener');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-vin-listener');
      this.appendChild(this.componentElement);
    }
  }

  connectedCallback() {
    super.connectedCallback();

    // Listen for VIN decoder change events
    document.addEventListener('vin-decoder:change', this.boundHandleVinChange);

    // Also check if any child elements have the vin-listener attribute
    this._setupDirectListeners();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('vin-decoder:change', this.boundHandleVinChange);
  }

  _setupDirectListeners() {
    // Find all form elements with vin-listener attribute within this element
    const listenableElements = this.querySelectorAll('[vin-listener]');

    listenableElements.forEach(element => {
      if (!element._vinListenerSetup) {
        element._vinListenerSetup = true;
        element._handleDirectVinChange = (event) => {
          const listenerGroup = element.getAttribute('vin-listener');
          const vinData = event.detail;

          if (vinData.vinGroup === listenerGroup) {
            this._updateFieldValue(element, vinData.data);
          }
        };

        document.addEventListener('vin-decoder:change', element._handleDirectVinChange);
      }
    });
  }

  _handleVinChange(event) {
    const vinData = event.detail;

    // Get the VIN group this listener is watching
    const targetGroup = this.getAttribute('vin-group');

    // If this listener is watching a specific group and it doesn't match, ignore
    if (targetGroup && vinData.vinGroup && targetGroup !== vinData.vinGroup) {
      return;
    }

    // Update all child form fields
    this._updateFields(vinData.data);
  }

  _updateFields(data) {
    // Find all form elements within this listener
    const formElements = this.querySelectorAll('[name]');

    formElements.forEach(element => {
      this._updateFieldValue(element, data);
    });
  }

  _updateFieldValue(element, data) {
    const fieldName = element.getAttribute('name');
    if (!fieldName) return;

    // Extract the field key from the name
    // Supports patterns like "vehicle.year" or just "year"
    const fieldKey = this._extractFieldKey(fieldName);
    if (!fieldKey) return;

    // Get the mapped field name
    const mappedField = this._getFieldMapping(fieldKey);
    if (!mappedField) return;

    // Get the value from the VIN data
    let value = data[mappedField];
    if (value === undefined || value === null) return;

    // Handle array values by creating multiple indexed inputs
    if (Array.isArray(value)) {
      this._handleArrayValue(element, fieldName, value);
      return;
    }

    // Transform value based on field type
    value = this._transformValue(value, mappedField);

    // Update the field value
    if (element.tagName.toLowerCase().startsWith('wc-')) {
      // Custom web component (wc-input, wc-select, etc.)
      element.value = value;
    } else if (element.tagName === 'INPUT' || element.tagName === 'SELECT' || element.tagName === 'TEXTAREA') {
      // Native form element
      element.value = value;
    }

    // Trigger change event so other listeners can react
    element.dispatchEvent(new Event('change', { bubbles: true }));
  }

  _handleArrayValue(element, fieldName, arrayValue) {
    // For array values (like images), create multiple indexed hidden inputs
    // Example: name="vehicle.images" becomes vehicle.images.0, vehicle.images.1, etc.

    // Remove any previously created array inputs
    const baseName = fieldName.replace(/\.\d+$/, ''); // Remove any existing index
    const existingArrayInputs = this.querySelectorAll(`[name^="${baseName}."]`);
    existingArrayInputs.forEach(input => {
      if (input !== element && /\.\d+$/.test(input.getAttribute('name'))) {
        input.remove();
      }
    });

    // Store reference to parent and next sibling before removing element
    const parent = element.parentNode;
    const nextSibling = element.nextSibling;

    // Remove the placeholder element so it doesn't get posted
    element.remove();

    // Create indexed inputs for each array item
    arrayValue.forEach((item, index) => {
      const indexedInput = document.createElement('input');
      indexedInput.type = 'hidden';
      indexedInput.name = `${baseName}.${index}`;
      indexedInput.value = item;

      // Insert where the original element was
      if (nextSibling) {
        parent.insertBefore(indexedInput, nextSibling);
      } else {
        parent.appendChild(indexedInput);
      }
    });
  }

  _transformValue(value, mappedField) {
    // Strip dollar signs and commas from price/currency fields
    if (mappedField === 'msrp' || mappedField === 'basePrice') {
      if (typeof value === 'string') {
        // Remove $, commas, and any whitespace
        return value.replace(/[$,\s]/g, '');
      }
    }

    return value;
  }

  _extractFieldKey(fieldName) {
    // Extract the last part after the last dot
    // "vehicle.year" -> "year"
    // "year" -> "year"
    const parts = fieldName.split('.');
    return parts[parts.length - 1];
  }

  _getFieldMapping(fieldKey) {
    // Map common field name variations to VIN decoder response fields
    const mappings = {
      'year': 'year',
      'make': 'make',
      'model': 'model',
      'trim': 'trim',
      'series': 'series',
      'msrp': 'msrp',
      'price': 'msrp',
      'baseprice': 'basePrice',
      'base_price': 'basePrice',
      'bodyclass': 'bodyClass',
      'body_class': 'bodyClass',
      'bodytype': 'bodyClass',
      'body_type': 'bodyClass',
      'doors': 'doors',
      'wheels': 'wheels',
      'seats': 'seats',
      'vehicletype': 'vehicleType',
      'vehicle_type': 'vehicleType',
      'enginecylinders': 'engineCylinders',
      'engine_cylinders': 'engineCylinders',
      'cylinders': 'engineCylinders',
      'displacementcc': 'displacementCC',
      'displacement_cc': 'displacementCC',
      'displacementci': 'displacementCI',
      'displacement_ci': 'displacementCI',
      'displacementl': 'displacementL',
      'displacement_l': 'displacementL',
      'displacement': 'displacementL',
      'transmissionstyle': 'transmissionStyle',
      'transmission_style': 'transmissionStyle',
      'transmission': 'transmissionStyle',
      'transmissionspeeds': 'transmissionSpeeds',
      'transmission_speeds': 'transmissionSpeeds',
      'drivetype': 'driveType',
      'drive_type': 'driveType',
      'drivetrain': 'driveType',
      'axles': 'axles',
      'fueltype': 'fuelType',
      'fuel_type': 'fuelType',
      'fuel': 'fuelType',
      'manufacturername': 'manufacturerName',
      'manufacturer_name': 'manufacturerName',
      'manufacturer': 'manufacturerName',
      'enginemanufacturer': 'engineManufacturer',
      'engine_manufacturer': 'engineManufacturer',
      'plantcompanyname': 'plantCompanyName',
      'plant_company_name': 'plantCompanyName',
      'plant': 'plantCompanyName',
      'plantcountry': 'plantCountry',
      'plant_country': 'plantCountry',
      'plantstate': 'plantState',
      'plant_state': 'plantState',
      'brakesystemtype': 'brakeSystemType',
      'brake_system_type': 'brakeSystemType',
      'brakesystem': 'brakeSystemType',
      'brake_system': 'brakeSystemType',
      'brakes': 'brakeSystemType',
      'antilockbrakingsystem': 'antilockBrakingSystem',
      'antilock_braking_system': 'antilockBrakingSystem',
      'abs': 'antilockBrakingSystem',
      'vin': 'vin',
      'errorcode': 'errorCode',
      'error_code': 'errorCode',
      'errortext': 'errorText',
      'error_text': 'errorText',
      'errormessage': 'errorText',
      'error_message': 'errorText',
      'images': 'images',
      'msrpsource': 'msrpSource',
      'msrp_source': 'msrpSource',
      'timestamp': 'timestamp'
    };

    const normalizedKey = fieldKey.toLowerCase().replace(/[-_]/g, '');
    return mappings[normalizedKey] || null;
  }
}

customElements.define(WcVinListener.is, WcVinListener);

export default WcVinListener;
