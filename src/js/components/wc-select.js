/**
 * 
 *  Name: wc-select
 *  Usage:
 *    <wc-select name="gender" lbl-label="Gender" value="male"
 *      items='[{"key": "Female", "value": "female"}, {"key": "Male", "value": "male"}]'>
 *    </wc-select>
 *    <wc-select name="marital_status" lbl-label="Marital Status" value="married">
 *      <option value="single">Single</option>
 *      <option value="married" selected>Married</option>
 *      <option value="divorced">Divorced</option>
 *      <option value="widowed">Widowed</option>
 *    </wc-select>
 *    <wc-select name="gender"
 *      class="col-1"
 *      lbl-label="Gender"
 *      value="male"
 *      display-member="label"
 *      value-member="value"
 *      items='[{"label": "Female", "value": "female"}, {"label": "Male", "value": "male"}]'>
 *    </wc-select>
 * 
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcSelect extends WcBaseFormComponent {
  static get observedAttributes() {
    return ['name', 'id', 'class', 'multiple', 'value', 'items', 'display-member', 'value-member', 'lbl-label', 'disabled', 'required', 'autofocus', 'elt-class'];
  }

  constructor() {
    super();
    this._items = [];
    const compEl = this.querySelector('.wc-select');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-select', 'relative');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-select');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('conntectCallback:wc-select');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'autofocus') {
      this.formElement?.setAttribute('autofocus', '');
    } else if (attrName === 'items') {
      if (typeof newValue === 'string') {
        this._items = JSON.parse(newValue);
        this._generateOptionsFromItems();
      }
      this.removeAttribute('items');
    } else if (attrName === 'disabled') {
      this.formElement?.setAttribute('disabled', '');
    } else if (attrName === 'required') {
      this.formElement?.setAttribute('required', '');
    } else if (attrName === 'lbl-label') {
      // Do nothing...
    } else if (attrName === 'value-member') {
      // Do nothing...
    } else if (attrName === 'display-member') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-select > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-select');
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
    this.formElement.setAttribute('form-element', '');
    const options = this.querySelectorAll('option');
    options.forEach(opt => this.formElement.appendChild(opt));
    this.componentElement.appendChild(this.formElement);
  }

  _generateOptionsFromItems() {
    const displayMember = this.getAttribute('display-member') || 'key';
    const valueMember = this.getAttribute('value-member') || 'value';
    const value = this.getAttribute('value') || null;
    // Clear existing options
    this.formElement.innerHTML = '';
    this._items.forEach((item) => {
      const opt = document.createElement('option');
      if (typeof item === 'object') {
        opt.value = item[valueMember];
        opt.textContent = item[displayMember];
      } else {
        opt.value = item;
        opt.textContent = item;
      }
      if (opt.value == value) {
        opt.selected = true;
      }
      this.formElement.appendChild(opt);
    });
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-select', WcSelect);
