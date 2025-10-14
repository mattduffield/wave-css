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
      'vehicle-type',
      'autocomplete',
      'autocapitalize',
      'spellcheck',
      'inputmode',
      'pattern',
      'minlength',
      'maxlength',
      'onchange',
      'oninput',
      'onblur',
      'onfocus'
    ];
  }

  static get icons() {
    return [
      {
        name: 'auto',
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path d="M199.2 181.4L173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160C215.8 160 203.7 168.6 199.2 181.4zM103.6 260.8L138.8 160.3C152.3 121.8 188.6 96 229.4 96L410.6 96C451.4 96 487.7 121.8 501.2 160.3L536.4 260.8C559.6 270.4 576 293.3 576 320L576 512C576 529.7 561.7 544 544 544L512 544C494.3 544 480 529.7 480 512L480 480L160 480L160 512C160 529.7 145.7 544 128 544L96 544C78.3 544 64 529.7 64 512L64 320C64 293.3 80.4 270.4 103.6 260.8zM192 368C192 350.3 177.7 336 160 336C142.3 336 128 350.3 128 368C128 385.7 142.3 400 160 400C177.7 400 192 385.7 192 368zM480 400C497.7 400 512 385.7 512 368C512 350.3 497.7 336 480 336C462.3 336 448 350.3 448 368C448 385.7 462.3 400 480 400z"/>
          </svg>
        `.trim()
      },
      {
        name: 'auto-dualtone',
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path opacity=".4" d="M64 480L64 512C64 529.7 78.3 544 96 544L128 544C145.7 544 160 529.7 160 512L160 480L64 480zM173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160C215.8 160 203.7 168.6 199.2 181.4L173.1 256zM480 480L480 512C480 529.7 494.3 544 512 544L544 544C561.7 544 576 529.7 576 512L576 480L480 480z"/><path d="M160 480L64 480L64 320C64 293.3 80.4 270.4 103.6 260.8L138.8 160.3C152.3 121.8 188.6 96 229.4 96L410.6 96C451.4 96 487.7 121.8 501.2 160.3L536.4 260.8C559.6 270.4 576 293.3 576 320L576 480L160 480zM229.4 160C215.8 160 203.7 168.6 199.2 181.4L173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160zM160 400C177.7 400 192 385.7 192 368C192 350.3 177.7 336 160 336C142.3 336 128 350.3 128 368C128 385.7 142.3 400 160 400zM512 368C512 350.3 497.7 336 480 336C462.3 336 448 350.3 448 368C448 385.7 462.3 400 480 400C497.7 400 512 385.7 512 368z"/>
          </svg>
        `.trim()
      },
      {
        name: 'motorcycle',
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path d="M280 80C266.7 80 256 90.7 256 104C256 117.3 266.7 128 280 128L336.6 128L359.1 176.7L264 248C230.6 222.9 189 208 144 208L88 208C74.7 208 64 218.7 64 232C64 245.3 74.7 256 88 256L144 256C222.5 256 287.2 315.6 295.2 392L269.8 392C258.6 332.8 206.5 288 144 288C73.3 288 16 345.3 16 416C16 486.7 73.3 544 144 544C206.5 544 258.5 499.2 269.8 440L320 440C333.3 440 344 429.3 344 416L344 393.5C344 348.4 369.7 308.1 409.5 285.8L421.6 311.9C389.2 335.1 368.1 373.1 368.1 416C368.1 486.7 425.4 544 496.1 544C566.8 544 624.1 486.7 624.1 416C624.1 345.3 566.8 288 496.1 288C485.4 288 475.1 289.3 465.2 291.8L433.8 224L488 224C501.3 224 512 213.3 512 200L512 152C512 138.7 501.3 128 488 128L434.7 128C427.8 128 421 130.2 415.5 134.4L398.4 147.2L373.8 93.9C369.9 85.4 361.4 80 352 80L280 80zM445.8 364.4L474.2 426C479.8 438 494 443.3 506 437.7C518 432.1 523.3 417.9 517.7 405.9L489.2 344.3C491.4 344.1 493.6 344 495.9 344C535.7 344 567.9 376.2 567.9 416C567.9 455.8 535.7 488 495.9 488C456.1 488 423.9 455.8 423.9 416C423.9 395.8 432.2 377.5 445.7 364.4zM144 488C104.2 488 72 455.8 72 416C72 376.2 104.2 344 144 344C175.3 344 202 364 211.9 392L144 392C130.7 392 120 402.7 120 416C120 429.3 130.7 440 144 440L211.9 440C202 468 175.3 488 144 488z"/>
          </svg>
        `.trim()
      },
      {
        name: 'motorcycle-dualtone',
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path opacity=".4" d="M16 416C16 345.3 73.3 288 144 288C206.5 288 258.5 332.8 269.8 392L211.9 392C202 364 175.3 344 144 344C104.2 344 72 376.2 72 416C72 455.8 104.2 488 144 488C175.3 488 202 468 211.9 440L269.8 440C258.6 499.2 206.5 544 144 544C73.3 544 16 486.7 16 416zM368 416C368 373.1 389.1 335.1 421.5 311.9L445.7 364.4C432.3 377.5 423.9 395.8 423.9 416C423.9 455.8 456.1 488 495.9 488C535.7 488 567.9 455.8 567.9 416C567.9 376.2 535.7 344 495.9 344C493.7 344 491.4 344.1 489.2 344.3L464.9 291.8C474.8 289.3 485.2 288 495.8 288C566.5 288 623.8 345.3 623.8 416C623.8 486.7 566.5 544 495.8 544C425.1 544 367.8 486.7 367.8 416z"/><path d="M256 104C256 90.7 266.7 80 280 80L352 80C361.4 80 369.9 85.4 373.8 93.9L398.4 147.2L415.5 134.4C421 130.2 427.8 128 434.7 128L488 128C501.3 128 512 138.7 512 152L512 200C512 213.3 501.3 224 488 224L433.8 224L517.8 405.9C523.4 417.9 518.1 432.2 506.1 437.7C494.1 443.2 479.8 438 474.3 426L409.5 285.8C369.7 308.1 344 348.4 344 393.5L344 416C344 429.3 333.3 440 320 440L144 440C130.7 440 120 429.3 120 416C120 402.7 130.7 392 144 392L295.2 392C287.2 315.6 222.6 256 144 256L88 256C74.7 256 64 245.3 64 232C64 218.7 74.7 208 88 208L144 208C189 208 230.6 222.9 264 248L359.1 176.7L336.6 128L280 128C266.7 128 256 117.3 256 104z"/>
          </svg>
        `.trim()
      }
    ];
  }

  constructor() {
    super();

    // Define attribute handling arrays as instance properties
    this.passThruAttributes = [
      'placeholder',
      'autocomplete',
      'autocapitalize',
      'spellcheck',
      'inputmode',
      'pattern',
      'minlength',
      'maxlength'
    ];
    this.passThruEmptyAttributes = [
      'required',
      'disabled',
      'readonly',
      'autofocus'
    ];
    this.ignoreAttributes = [
      'api-url',
      'database-endpoint',
      'tooltip',
      'tooltip-position',
      'lbl-label',
      'lbl-class',
      'elt-class',
      'vehicle-type'
    ];
    this.eventAttributes = [
      'onchange',
      'oninput',
      'onblur',
      'onfocus'
    ];

    // Create component wrapper
    const compEl = this.querySelector('.wc-vin-decoder');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-vin-decoder', 'relative');
      this.appendChild(this.componentElement);
    }

    // Default API URL and state
    this.apiUrl = 'https://vin-decoder-ligipcg4jq-uc.a.run.app';
    this.databaseEndpoint = null;
    this.isDecoding = false;
    this.lastDecodedVin = null;
    this.cachedData = null;
    this.formElement = null;
    this.spinnerIcon = null;
    this.labelElement = null;
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-vin-decoder > *');
    if (innerEl) {
      // Elements already exist
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    // Wire events after element creation
    this.eventAttributes.forEach(attr => {
      const value = this.getAttribute(attr);
      if (value) {
        this._handleAttributeChange(attr, value);
      }
    });

    // Create tooltip after element creation
    this._createTooltipElement();

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  _createInnerElement() {
    const labelText = this.getAttribute('lbl-label');
    const name = this.getAttribute('name');

    // Create label if specified
    if (labelText) {
      const label = document.createElement('label');
      label.setAttribute('for', name);
      label.textContent = labelText;

      const lblClass = this.getAttribute('lbl-class');
      if (lblClass) {
        lblClass.split(' ').forEach(cls => {
          if (cls.trim()) {
            label.classList.add(cls.trim());
          }
        });
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
    this.formElement.setAttribute('name', name);
    this.formElement.setAttribute('id', name);

    // Apply elt-class if present
    const eltClass = this.getAttribute('elt-class');
    if (eltClass) {
      eltClass.split(' ').forEach(cls => {
        if (cls.trim()) {
          this.formElement.classList.add(cls.trim());
        }
      });
    }

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

    // Create vehicle icon (on the left)
    const vehicleType = this.getAttribute('vehicle-type') || 'auto';
    const iconData = WcVinDecoder.icons.find(i => i.name === vehicleType);
    if (iconData) {
      const vehicleIcon = document.createElement('span');
      vehicleIcon.classList.add('icon', 'vehicle-icon');
      vehicleIcon.innerHTML = iconData.icon;
      inputWrapper.appendChild(vehicleIcon);
    }

    // Append input
    inputWrapper.appendChild(this.formElement);

    // Create spinner icon (hidden by default, on the right)
    this.spinnerIcon = document.createElement('wc-fa-icon');
    this.spinnerIcon.setAttribute('name', 'circle-notch');
    this.spinnerIcon.setAttribute('icon-style', 'solid');
    this.spinnerIcon.setAttribute('size', '1.25rem');
    this.spinnerIcon.classList.add('absolute', 'right-3', 'text-primary', 'animate-spin', 'hidden');
    inputWrapper.appendChild(this.spinnerIcon);

    // Add change listener for VIN decoding
    this.formElement.addEventListener('change', (e) => {
      this._handleVinChange(e);
    });

    this.componentElement.appendChild(inputWrapper);

    this.labelElement = this.componentElement.querySelector('label');
  }

  _unWireEvents() {
    // Cleanup if needed
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
    }

    if (this.passThruEmptyAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, '');
    }

    if (this.ignoreAttributes.includes(attrName)) {
      // Handle API configuration
      if (attrName === 'api-url') {
        this.apiUrl = newValue || this.apiUrl;
      } else if (attrName === 'database-endpoint') {
        this.databaseEndpoint = newValue;
      }
      // Do nothing else
      return;
    }

    // Handle tooltip
    if (attrName === 'tooltip' || attrName === 'tooltip-position') {
      this._createTooltipElement();
      return;
    }

    // Handle label class - use else-if/else pattern like wc-input
    if (attrName === 'lbl-class') {
      const name = this.getAttribute('name');
      const lbl = this.querySelector(`label[for="${name}"]`);
      lbl?.classList.add(newValue);
    } else {
      // Let base component handle all other attributes (following wc-input pattern)
      super._handleAttributeChange(attrName, newValue);
    }
  }

  get value() {
    return this.formElement?.value || '';
  }

  set value(val) {
    if (this.formElement) {
      this.formElement.value = val;
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

  _applyStyle() {
    const style = `
      wc-vin-decoder {
        display: contents;
      }

      wc-vin-decoder input {
        width: 100%;
        padding-left: 30px;
        min-width: 130px;
      }

      wc-vin-decoder .vehicle-icon {
        position: absolute;
        top: 50%;
        left: 5px;
        transform: translateY(-50%);
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      wc-vin-decoder wc-fa-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }

      wc-vin-decoder wc-fa-icon.hidden {
        display: none !important;
      }
    `;

    if (!document.getElementById('wc-vin-decoder-style')) {
      const styleTag = document.createElement('style');
      styleTag.id = 'wc-vin-decoder-style';
      styleTag.textContent = style;
      document.head.appendChild(styleTag);
    }
  }
}

customElements.define(WcVinDecoder.is, WcVinDecoder);
