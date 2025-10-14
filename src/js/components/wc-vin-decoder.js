import { WcBaseFormComponent } from './wc-base-form-component.js';

/**
 * WcVinDecoder - VIN decoder input component with automatic decoding
 *
 * @element wc-vin-decoder
 *
 * @attr {string} name - Input name for form submission
 * @attr {string} value - Current VIN value
 * @attr {string} api-url - VIN decoder API URL (default: https://vin-decoder-ligipcg4jq-uc.a.run.app)
 * @attr {string} database-endpoint - Optional endpoint to check database first
 * @attr {string} lbl-label - Label text
 * @attr {string} placeholder - Input placeholder
 * @attr {boolean} required - Whether input is required
 * @attr {boolean} disabled - Whether input is disabled
 * @attr {boolean} readonly - Whether input is readonly
 *
 * @fires vin-decoder:change - Fired when VIN is decoded successfully
 * @fires vin-decoder:error - Fired when decoding fails
 *
 * @example
 * <wc-vin-decoder
 *   name="vin"
 *   lbl-label="VIN Number"
 *   api-url="https://vin-decoder-ligipcg4jq-uc.a.run.app"
 *   database-endpoint="/api/vehicles/vin"
 *   required>
 * </wc-vin-decoder>
 */
export default class WcVinDecoder extends WcBaseFormComponent {
  static get is() {
    return 'wc-vin-decoder';
  }

  static get observedAttributes() {
    return [
      'name',
      'value',
      'api-url',
      'database-endpoint',
      'lbl-label',
      'lbl-class',
      'placeholder',
      'required',
      'disabled',
      'readonly',
      'tooltip',
      'tooltip-position',
      'class',
      'elt-class',
      ...this.eventAttributes
    ];
  }

  static get eventAttributes() {
    return ['onchange', 'oninput', 'onblur', 'onfocus'];
  }

  constructor() {
    super();
    this.classList.add('contents');

    // Default API URL
    this.apiUrl = 'https://vin-decoder-ligipcg4jq-uc.a.run.app';
    this.databaseEndpoint = null;
    this.isDecoding = false;
    this.lastDecodedVin = null;
    this.cachedData = null;
  }

  get passThruAttributes() {
    return [
      'placeholder',
      'autocomplete',
      'autocapitalize',
      'spellcheck',
      'inputmode',
      'pattern',
      'minlength',
      'maxlength',
      'size',
      'form',
      'list',
      'data-lpignore',
      'data-form-type'
    ];
  }

  get passThruEmptyAttributes() {
    return ['required', 'disabled', 'readonly', 'autofocus'];
  }

  get ignoreAttributes() {
    return ['api-url', 'database-endpoint', 'tooltip', 'tooltip-position', 'lbl-label', 'lbl-class', 'elt-class'];
  }

  get value() {
    return this.formElement?.value || '';
  }

  set value(val) {
    if (this.formElement) {
      this.formElement.value = val;
    }
  }

  _render() {
    if (!this.componentElement) {
      // Create wrapper div
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('contents');

      // Create label if lbl-label is set
      const labelText = this.getAttribute('lbl-label');
      if (labelText) {
        const label = document.createElement('label');
        const name = this.getAttribute('name');
        label.setAttribute('for', name);
        label.textContent = labelText;

        const lblClass = this.getAttribute('lbl-class');
        if (lblClass) {
          label.classList.add(lblClass);
        }

        this.componentElement.appendChild(label);
      }

      // Create input wrapper for icon positioning
      const inputWrapper = document.createElement('div');
      inputWrapper.classList.add('relative', 'flex', 'items-center');

      // Create input element
      this.formElement = document.createElement('input');
      this.formElement.setAttribute('type', 'text');
      this.formElement.setAttribute('form-element', '');

      const name = this.getAttribute('name');
      if (name) {
        this.formElement.setAttribute('name', name);
        this.formElement.setAttribute('id', name);
      }

      // Apply elt-class if present
      const eltClass = this.getAttribute('elt-class');
      if (eltClass) {
        eltClass.split(' ').forEach(cls => {
          if (cls.trim()) {
            this.formElement.classList.add(cls.trim());
          }
        });
      }

      // Create spinner icon (hidden by default)
      this.spinnerIcon = document.createElement('wc-fa-icon');
      this.spinnerIcon.setAttribute('icon', 'circle-notch');
      this.spinnerIcon.setAttribute('icon-style', 'solid');
      this.spinnerIcon.classList.add('absolute', 'right-3', 'text-primary', 'animate-spin', 'hidden');

      // Add change listener for VIN decoding
      this.formElement.addEventListener('change', (e) => {
        this._handleVinChange(e);
      });

      inputWrapper.appendChild(this.formElement);
      inputWrapper.appendChild(this.spinnerIcon);
      this.componentElement.appendChild(inputWrapper);

      // Apply pass-through attributes
      this.passThruAttributes.forEach(attr => {
        const value = this.getAttribute(attr);
        if (value !== null) {
          this.formElement.setAttribute(attr, value);
        }
      });

      this.passThruEmptyAttributes.forEach(attr => {
        if (this.hasAttribute(attr)) {
          this.formElement.setAttribute(attr, '');
        }
      });

      // Create tooltip if needed
      this._createTooltipElement();

      this.appendChild(this.componentElement);
    }
  }

  async _handleVinChange(event) {
    const vin = this.value.trim().toUpperCase();

    // Update the input with uppercase VIN
    this.value = vin;

    // Validate VIN length (standard VIN is 17 characters)
    if (vin.length !== 17) {
      this._broadcastError('VIN must be 17 characters');
      return;
    }

    // Don't decode the same VIN twice
    if (vin === this.lastDecodedVin && this.cachedData) {
      this._broadcastChange(this.cachedData);
      return;
    }

    await this._decodeVin(vin);
  }

  async _decodeVin(vin) {
    if (this.isDecoding) return;

    this.isDecoding = true;
    this._showSpinner();

    try {
      let data = null;

      // Check database first if endpoint is provided
      if (this.databaseEndpoint) {
        data = await this._checkDatabase(vin);
      }

      // If not in database, call the VIN decoder API
      if (!data) {
        data = await this._callVinDecoderApi(vin);
      }

      if (data) {
        this.lastDecodedVin = vin;
        this.cachedData = data;
        this._broadcastChange(data);
      }
    } catch (error) {
      console.error('wc-vin-decoder: Error decoding VIN:', error);
      this._broadcastError(error.message || 'Failed to decode VIN');
    } finally {
      this.isDecoding = false;
      this._hideSpinner();
    }
  }

  async _checkDatabase(vin) {
    try {
      const url = `${this.databaseEndpoint}/${vin}`;
      const response = await fetch(url);

      if (!response.ok) {
        // Not found in database, return null to trigger API call
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Database check failed: ${response.statusText}`);
      }

      const result = await response.json();

      // Expect same format: { success: true, data: {...} }
      if (result.success && result.data) {
        return result.data;
      }

      return null;
    } catch (error) {
      console.warn('wc-vin-decoder: Database check failed, will use API:', error);
      return null;
    }
  }

  async _callVinDecoderApi(vin) {
    try {
      const url = `${this.apiUrl}/api/vin/${vin}`;
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`VIN decoder API failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (!result.success || !result.data) {
        throw new Error(result.errorText || 'Failed to decode VIN');
      }

      return result.data;
    } catch (error) {
      throw new Error(`Failed to decode VIN: ${error.message}`);
    }
  }

  _showSpinner() {
    this.spinnerIcon?.classList.remove('hidden');
  }

  _hideSpinner() {
    this.spinnerIcon?.classList.add('hidden');
  }

  _broadcastChange(data) {
    const event = new CustomEvent('vin-decoder:change', {
      bubbles: true,
      composed: true,
      detail: {
        vin: this.value,
        data: data
      }
    });
    this.dispatchEvent(event);
  }

  _broadcastError(message) {
    const event = new CustomEvent('vin-decoder:error', {
      bubbles: true,
      composed: true,
      detail: {
        vin: this.value,
        error: message
      }
    });
    this.dispatchEvent(event);
  }

  _handleAttributeChange(attrName, newValue) {
    // Handle event attributes
    if (WcVinDecoder.eventAttributes.includes(attrName)) {
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
      if (this.formElement) {
        this.formElement.setAttribute(attrName, newValue);
      }
      return;
    }

    if (this.passThruEmptyAttributes.includes(attrName)) {
      if (this.formElement) {
        this.formElement.setAttribute(attrName, '');
      }
      return;
    }

    if (this.ignoreAttributes.includes(attrName)) {
      // Handle API configuration
      if (attrName === 'api-url') {
        this.apiUrl = newValue || this.apiUrl;
      } else if (attrName === 'database-endpoint') {
        this.databaseEndpoint = newValue;
      }
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

    // Let base component handle everything else (including 'class' and 'elt-class')
    super._handleAttributeChange(attrName, newValue);
  }

  _createTooltipElement() {
    const tooltip = this.getAttribute('tooltip');
    if (!tooltip) return;

    // Remove existing tooltip if any
    const existingTooltip = this.querySelector('wc-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    // Create new tooltip
    const tooltipElement = document.createElement('wc-tooltip');
    tooltipElement.textContent = tooltip;

    const position = this.getAttribute('tooltip-position') || 'top';
    tooltipElement.setAttribute('position', position);

    if (this.formElement) {
      this.formElement.parentNode.insertBefore(tooltipElement, this.formElement.nextSibling);
    }
  }
}

customElements.define(WcVinDecoder.is, WcVinDecoder);
