/**
 * 
 *  Name: wc-save-button
 *  Usage:
 *    <wc-save-button save-url="/screen/contact/123">
 *    </wc-save-button>
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-accordion:open', ['[data-wc-id="0982-a544-98da-b3da"]'], '.accordion-header:nth-of-type(1)')
 *    wc.EventHub.broadcast('wc-accordion:close', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(1)'])
 *    wc.EventHub.broadcast('wc-accordion:toggle', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(2)'])
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-save-button')) {

  class WcSaveButton extends WcBaseComponent {
    static get observedAttributes() {
      return [];
    }

    constructor() {
      super();
      this._items = [];
      const compEl = this.querySelector('.wc-save-button');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        const id = this.getAttribute('id') || '';
        const saveUrl = this.getAttribute('save-url') || '';
  
        this.componentElement = document.createElement('button');
        this.componentElement.id = id;
        this.removeAttribute('id');
        this.componentElement.textContent = "Save";
        this.componentElement.classList.add('wc-save-button');
        this.componentElement.setAttribute('hx-target', '#viewport');
        this.componentElement.setAttribute('hx-swap', 'innerHTML transition:true');
        this.componentElement.setAttribute('hx-indicator', '#content-loader');
        this.componentElement.setAttribute('hx-post', saveUrl);
        this.removeAttribute('save-url');
        this.componentElement.setAttribute('hx-push-url', 'true');
        this.appendChild(this.componentElement);
      }
      console.log('ctor:wc-save-button');
    }

    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
      console.log('connectedCallback:wc-save-button');
    }

    disconnectedCallback() {
      this._unWireEvents();
    }

    _handleAttributeChange(attrName, newValue) {    
      super._handleAttributeChange(attrName, newValue);  
    }

    _applyStyle() {
      const style = `
        wc-save-button {
          display: contents;
        }
        .wc-save-button {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          border: none;
          outline: none;
          border-radius: 0.375rem;
        }
        .wc-save-button:hover  {
          background-color: var(--primary-alt-bg-color);
        }
      `.trim();
      this.loadStyle('wc-save-button-style', style);
    }

    _wireEvents() {
      super._wireEvents();
    }

    _unWireEvents() {
      super._unWireEvents();
    }

  }

  customElements.define('wc-save-button', WcSaveButton);
}