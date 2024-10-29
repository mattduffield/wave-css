/**
 * 
 *  Name: textarea-box
 *  Usage:
 *    <wc-combo-box name="gender" lbl-label="Gender" value="male"
 *      options='[{"key": "Female", "value": "female"}, {"key": "Male", "value": "male"}]'>
 *    </wc-combo-box>
 *    <wc-combo-box name="marital_status" lbl-label="Marital Status" value="married">
 *      <option value="single">Single</option>
 *      <option value="married">Married</option>
 *      <option value="divorced">Divorced</option>
 *      <option value="widowed">Widowed</option>
 *    </wc-combo-box>
 * 
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcComboBox extends WcBaseComponent {
  static get observedAttributes() {
    return ['name', 'id', 'class', 'multiple', 'value', 'options', 'display-member', 'value-member', 'lbl-label', 'disabled', 'autofocus'];
  }

  constructor() {
    super();
    this._items = [];
    this.value = '';
    const compEl = this.querySelector('.wc-combo-box');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-combo-box');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-combo-box');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('conntectCallback:wc-combo-box');

    // this.value = this.getAttribute('value') || '';

    // this.formElement.addEventListener('change', () => {
    //   this.value = this.formElement.value;
    // });    
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'items') {
      if (typeof newValue === 'string') {
        this._items = JSON.parse(newValue);
      }
      this.removeAttribute('items');
    } else if (attrName === 'autofocus') {
      this.formElement?.setAttribute('autofocus', '');
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-combo-box > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-combo-box');
  }

  _createInnerElement() {
    const labelText = this.getAttribute('lbl-label') || '';
    const name = this.getAttribute('name');
    if (labelText) {
      const lblEl = document.createElement('label');
      lblEl.textContent = labelText;
      lblEl.setAttribute('for', name);
      this.componentElement.appendChild(lblEl);
    }
    this.formElement = document.createElement('select');
    this.formElement.setAttribute('name', name);
    const options = this.querySelectorAll('option');
    options.forEach(opt => this.formElement.appendChild(opt));
    this.componentElement.appendChild(this.formElement);
  }


  // _handleAttributeChange(attrName, newValue) {
  //   if (newValue !== null) {
  //     if (attrName == 'options') {
  //       console.log('options', newValue);
  //       this.jsonOptions = newValue;
  //     } else {
  //       this.formElement.setAttribute(attrName, newValue);
  //     }
  //   } else {
  //     this.formElement.removeAttribute(attrName);
  //   }
  // }

  // _render() {
  //   super._render();
  //   // If options are passed as a JSON string property, generate options
  //   if (this.jsonOptions) {
  //     this._generateOptionsFromJSON();
  //   }
  //   this._moveDeclarativeOptions();

  //   super._render();
  // }

  // // Support for options passed via a property (JSON format)
  // set jsonOptions(value) {
  //   this._jsonOptions = value;
  //   if (typeof value === 'string') {
  //     try {
  //       const parsedOptions = JSON.parse(value);
  //       if (Array.isArray(parsedOptions)) {
  //         this._options = parsedOptions;
  //         this._generateOptionsFromJSON();
  //       } else {
  //         throw new Error('jsonOptions should be an array of option objects');
  //       }
  //     } catch (error) {
  //       console.error('Error parsing jsonOptions:', error);
  //     }
  //   }
  // }

  // get jsonOptions() {
  //   return this._jsonOptions;
  // }

  // _generateOptionsFromJSON() {
  //   const displayMember = this.getAttribute('display-member') || 'key';
  //   const valueMember = this.getAttribute('value-member') || 'value';
  //   const value = this.getAttribute('value') || null;
  //   // Clear existing options
  //   this.formElement.innerHTML = '';

  //   // Add options passed via JSON
  //   this._options.forEach((opt) => {
  //     const optionElement = document.createElement('option');
  //     if (typeof opt === 'object') {
  //       optionElement.value = opt[valueMember];
  //       optionElement.textContent = opt[displayMember];
  //     } else {
  //       optionElement.value = opt;
  //       optionElement.textContent = opt;
  //     }
  //     if (optionElement.value == value) {
  //       optionElement.selected = true;
  //     }
  //     this.formElement.appendChild(optionElement);
  //   });
  // }

  // _moveDeclarativeOptions() {
  //   const value = this.getAttribute('value', null);
  //   const options = this.querySelectorAll('option');
  //   options.forEach(option => {
  //     const el = option.cloneNode(true);
  //     if (el.value == value) {
  //       el.selected = true;
  //     }
  //     this.formElement.appendChild(el);
  //   });
  //   Array.from(options).forEach(option => option.remove());
  // }
}

customElements.define('wc-combo-box', WcComboBox);
