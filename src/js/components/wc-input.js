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
    console.log('conntectCallback:wc-input');
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
      wc-input .radio-group.modern .radio-option:hover {
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



      /*
      wc-input .radio-group .radio-option::before {
        content: "";
        display: inline-block;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid var(--component-border-color);
        margin-right: 8px;
        background-color: var(--white-color);
        transition: border-color 0.3s;
      }
      wc-input .radio-option:hover::before {
        border-color: var(--secondary-bg-color);
      }
      wc-input .radio-group .radio-option:has(:checked)::before {
        background-color: var(--accent-bg-color);
        border-color: var(--accent-bg-color);
      }
      */


    `.trim();
    this.loadStyle('wc-input-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-input', WcInput);
