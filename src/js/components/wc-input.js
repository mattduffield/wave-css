/**
 * 
 *  Name: wc-input
 *  Usage:
 *    <wc-input name="gender" lbl-label="Gender" value="male"
 *      options='[{"key": "Female", "value": "female"}, {"key": "Male", "value": "male"}]'>
 *    </wc-input>
 *    <wc-input name="marital_status" lbl-label="Marital Status" value="married">
 *      <option value="single">Single</option>
 *      <option value="married">Married</option>
 *      <option value="divorced">Divorced</option>
 *      <option value="widowed">Widowed</option>
 *    </wc-input>
 * 
 *    <wc-input name="is_active"
 *      class="col"
 *      lbl-label="Is Active?"
 *      type="checkbox"
 *      checked>
 *    </wc-input>
 *    <wc-input name="is_enrolled"
 *      class="col"
 *      lbl-label="Is Enrolled?"
 *      type="checkbox">
 *    </wc-input>
 *    <wc-input name="is_eligible"
 *      class="col"
 *      lbl-label="Is Eligible?"
 *      type="checkbox"
 *      toggle-switch>
 *    </wc-input>
 * 
 * 
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcInput extends WcBaseFormComponent {
  static get observedAttributes() {
    return [
      'name', 'id', 'class', 'type', 'value', 'placeholder',
      'lbl-label', 'lbl-class', 'radio-group-class',
      'checked', 'disabled', 'readonly', 'required', 'autocomplete', 
      'autofocus', 'min', 'max', 'minlength', 'maxlength', 'pattern',
      'step', 'multiple', 'novalidate', 'elt-class', 'toggle-swtich'
    ];
  }
  static get icons() {
    return [
      {
        name: 'email-stroke',
        icon: `
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="0.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path>
          </svg>
        `.trim()
      },
      {
        name: 'email-fill',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="CurrentColor">
            <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/>
          </svg>
        `.trim()
      },
      {
        name: 'tel-stroke',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="0.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"></path>
          </svg>
        `.trim()
      },
      {
        name: 'tel-fill',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
            <path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"/>
          </svg>
        `.trim()
      },
      {
        name: 'currency-circle',
        icon: `
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="0.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        `.trim()
      },
      {
        name: 'currency-symbol',
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor">
            <path d="M160 0c17.7 0 32 14.3 32 32l0 35.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11l0 33.4c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-34.9c-.4-.1-.9-.1-1.3-.2l-.2 0s0 0 0 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7s0 0 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11L128 32c0-17.7 14.3-32 32-32z"/>
          </svg>
        `.trim()
      }
    ];
  }

  constructor() {
    super();
    this.passThruAttributes = [
      'autocomplete', 'placeholder', 'min', 'max', 'minlength',
      'maxlength', 'pattern', 'step', 'multiple'
    ];
    this.passThruEmptyAttributes = [
      'autofocus', 'disabled', 'readonly', 'required', 'novalidate'
    ];
    this.ignoreAttributes = [
      'lbl-label', 'toggle-switch'
    ];
    const compEl = this.querySelector('.wc-input');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-input', 'relative');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-input');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-input');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {
    if (this.passThruAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, newValue);
    }
    if (this.passThruEmptyAttributes.includes(attrName)) {
      const type = this.getAttribute('type') || 'text';
      if (type === 'radio') {
        const radios = this.querySelectorAll('input[type="radio"]');
        radios.forEach(radio => {
          radio.setAttribute(attrName, '');
        });
      } else {
        this.formElement?.setAttribute(attrName, '');
      }
    }
    if (this.ignoreAttributes.includes(attrName)) {
      // Do nothing...
    }
    if (attrName === 'lbl-class') {
      const name = this.getAttribute('name');
      const lbl = this.querySelector(`label[for="${name}"]`);
      lbl?.classList.add(newValue);
    } else if (attrName === 'radio-group-class') {
      const elt = this.querySelector('.radio-group');
      const parts = newValue.split(' ');
      parts.forEach(p => {
        if (p) {
          elt?.classList.add(p.trim());
        }
      })
      // elt?.classList.add(newValue);
    } else if (attrName === 'type') {
      this.formElement?.setAttribute('type', newValue);
      if (newValue === 'checkbox') {
        if (this.hasAttribute('checked')) {
          this.formElement?.setAttribute('checked', '');
          this.setAttribute('value', 'bool:True');
        } else {
          this.formElement?.removeAttribute('checked');
          this.setAttribute('value', 'bool:False');
        }
      } else if (newValue === 'currency') {
        this.formElement?.setAttribute('type', 'number');
      }
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-input > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-input');
  }

  _createInnerElement() {
    const labelText = this.getAttribute('lbl-label') || '';
    const name = this.getAttribute('name');
    const type = this.getAttribute('type') || 'text';
    const isToggle = this.hasAttribute('toggle-switch');
    const options = this.getAttribute('options') ? JSON.parse(this.getAttribute('options')) : [];

    if (labelText) {
      const lblEl = document.createElement('label');
      const value = this.getAttribute('value') || '';
      if (type === 'range' && value) {
        lblEl.textContent = `${labelText} (${value})`;
      } else {
        lblEl.textContent = labelText;
      }
      lblEl.setAttribute('for', name);
      this.componentElement.appendChild(lblEl);
    }

    this.formElement = document.createElement('input');
    this.formElement.setAttribute('form-element', '');
    this.formElement.setAttribute('type', type);
    
    if (type === 'radio' && options.length) {
      const radioContainer = document.createElement('div');
      radioContainer.classList.add('radio-group');

      options.forEach(option => {
        const radioLabel = document.createElement('label');
        radioLabel.classList.add('radio-option');
        radioLabel.textContent = option.key;

        const radioInput = document.createElement('input');
        radioInput.setAttribute('type', 'radio');
        radioInput.setAttribute('name', name);
        radioInput.setAttribute('value', option.value);
        if (option.value === this.getAttribute('value')) {
            radioInput.setAttribute('checked', '');
        }

        radioLabel.prepend(radioInput);
        radioContainer.appendChild(radioLabel);
      });
      this.componentElement.appendChild(radioContainer);
    } else if (type === 'checkbox' && isToggle) {
      this.formElement.classList.add('toggle-checkbox');

      const toggleWrapper = document.createElement('div');
      toggleWrapper.classList.add('toggle-wrapper');
      toggleWrapper.appendChild(this.formElement);

      const toggleSwitch = document.createElement('span');
      toggleSwitch.classList.add('toggle-switch');
      toggleWrapper.appendChild(toggleSwitch);
      this.componentElement.appendChild(toggleWrapper);
    } else if (type === 'currency') {
      this.formElement.setAttribute('type', 'number');
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'currency-symbol');
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'email') {
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'email-fill');
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === 'tel') {
      const icon = document.createElement('span');
      icon.classList.add('icon');
      const iconItem = WcInput.icons.find(f => f.name === 'tel-fill');
      icon.innerHTML = iconItem.icon;
      this.formElement.setAttribute('_', `on load or input
          call wc.MaskHub.phoneMask(event)
          me.setCustomValidity('')
        end`);
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else {
      this.componentElement.appendChild(this.formElement);
    }
  }

  _applyStyle() {
    const style = `
      wc-input .toggle-wrapper {
        position: relative;
        width: 50px;
        height: 22px;
        display: inline-block;
      }

      wc-input .toggle-checkbox {
        opacity: 0;
        width: 100%;
        height: 100%;
      }
      wc-input .toggle-checkbox:focus-visible + .toggle-switch {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 0px;
      }

      wc-input .toggle-switch {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--white-color);
        border: 1px solid var(--component-border-color);
        border-radius: 25px;
        /* cursor: pointer; */
        transition: background-color 0.4s;
        pointer-events: none;
      }

      .dark wc-input .toggle-switch {
        background-color: var(--white-color);
        border: 1px solid var(--component-border-color);
      }

      wc-input .toggle-switch::before {
        position: absolute;
        content: "";
        height: 15px;
        width: 15px;
        left: 2px;
        bottom: 2px;
        background-color: var(--accent-bg-color);
        border: 1px solid var(--secondary-bg-color);
        border-radius: 50%;
        transition: transform 0.4s;
      }
      wc-input .toggle-checkbox:hover:not(:disabled) + .toggle-switch::before {
        background-color: var(--secondary-bg-color);
      }

      wc-input .toggle-checkbox:checked + .toggle-switch {
        background-color: var(--component-bg-color);
      }
      .dark wc-input .toggle-checkbox:checked + .toggle-switch {
        background-color: var(--component-bg-color);
      }

      wc-input .toggle-checkbox:checked + .toggle-switch::before {
        transform: translateX(27px);
      }

      wc-input .toggle-checkbox:disabled + .toggle-switch {
        opacity: 0.7;
      }




      wc-input .radio-group {
        display: flex;
      }
      wc-input .radio-group:not(.modern) {
        gap: 0.5rem;
      }
      wc-input .radio-group .radio-option {
        display: inline-flex;
        align-items: center;
        position: relative;
        outline: none;
      }
      wc-input .radio-group:not(.modern) .radio-option {
        padding-left: 12px;
      }
      wc-input .radio-group.modern {
        border: 1px solid var(--accent-bg-color);
        border-radius: 5px;
      }
      wc-input .radio-group.modern .radio-option {
        padding: 0 0.5rem;
        background-color: var(--secondary-bg-color);
        color: var(--secondary-color);
        border-right: 1px solid var(--accent-bg-color);
      }
      wc-input .radio-group.modern .radio-option:first-child {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
      }
      wc-input .radio-group.modern .radio-option:last-child {
        border-right: none;
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
      }
      wc-input .radio-group .radio-option input[type="radio"] {
        opacity: 0;
        margin: 0;
      }
      wc-input .radio-group.modern .radio-option input[type="radio"] {
        position: absolute;
      }
      wc-input .radio-group.modern .radio-option:hover:not(:has(input[type="radio"]:disabled)) {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-input .radio-group.modern .radio-option:has(input[type="radio"]:checked) {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-input .radio-group.modern:has(:focus-within) {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 0px;
        border: 1px solid transparent;
      }
      wc-input .radio-group:not(.modern) .radio-option::before {
        content: "";
        display: inline-block;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid var(--component-border-color);
        background-color: var(--white-color);
        transition: border-color 0.3s;
        position: absolute;
        left: 0;
      }
      wc-input .radio-group:not(.modern) .radio-option:has(:checked)::after {
        content: "";
        display: inline-block;
        width: 10px; /* Slightly smaller than outer circle */
        height: 10px;
        border-radius: 50%;
        background-color: var(--accent-bg-color);
        position: absolute;
        left: 5px;
        top: 5px;
        transition: background-color 0.3s;
      }
      wc-input .radio-option:hover::before {
        border-color: var(--secondary-bg-color);
      }
      wc-input .radio-group:not(.modern) .radio-option:focus-within::after {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 0px;
      }




      wc-input input[type="email"] {
        padding-left: 25px;
      }
      wc-input input[type="email"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }


      wc-input input[type="tel"] {
        padding-left: 25px;
      }
      wc-input input[type="tel"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }

      wc-input[type="currency"] input[type="number"] {
        padding-left: 25px;
      }
      wc-input[type="currency"] input[type="number"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }


    `.trim();
    this.loadStyle('wc-input-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-input', WcInput);
