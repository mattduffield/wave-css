/**
 * 
 *  Name: wc-textarea
 *  Usage:
 *    <wc-textarea class="col-1"
 *      rows="10"
 *      name="comments"
 *      value="10/10/2024 - First comment..."
 *      placeholder="Enter comments here..."></wc-textarea>
 *    <wc-textarea class="col-1"
 *      lbl-label="Notes"
 *      rows="10"
 *      name="notes"
 *      placeholder="Enter comments here...">
 *  10/30/2024 - Had a call with the client. They want to move forward.
 *  10/28/2024 - Had initial call with the client. They want to think about it.
 *    </wc-textarea>
 * 
 *  Note:
 *    If you provide both a value attribute and also inner text content. It will
 *    always take the value attribute and disregard the inner text.
 * 
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcTextarea extends WcBaseFormComponent {
  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'rows', 'cols', 'placeholder', 'lbl-label', 'disabled', 'readonly', 'required', 'autofocus', 'elt-class'];
  }

  constructor() {
    super();
    this.firstContent = '';
    if (this.firstChild && this.firstChild.nodeName == '#text') {
      this.firstContent = this.firstChild.textContent;
      this.removeChild(this.firstChild);
    }
    const compEl = this.querySelector('.wc-textarea');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-textarea', 'relative');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-textarea');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-textarea');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'autofocus') {
      this.formElement?.setAttribute('autofocus', '');
    } else if (attrName === 'lbl-label') {
      // Do nothing...
    } else if (attrName === 'disabled') {
      this.formElement?.setAttribute('disabled', '');
    } else if (attrName === 'readonly') {
      this.formElement?.setAttribute('readonly', '');
    } else if (attrName === 'required') {
      this.formElement?.setAttribute('required', '');
    } else if (attrName === 'placeholder') {
      this.formElement?.setAttribute('placeholder', newValue);
    } else if (attrName === 'cols') {
      this.formElement?.setAttribute('cols', newValue);
    } else if (attrName === 'rows') {
      this.formElement?.setAttribute('rows', newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-textarea > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-textarea');
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
    this.formElement = document.createElement('textarea');
    this.formElement.setAttribute('form-element', '');
    this.componentElement.appendChild(this.formElement);
    const value = this.getAttribute('value') || '';
    if (this.firstContent && !value) {
      this.setAttribute('value', this.firstContent.trim());
      // this.value = this.firstContent;
    }
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-textarea', WcTextarea);
