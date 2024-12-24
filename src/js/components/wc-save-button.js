/**
 * 
 *  Name: wc-save-button
 *  Usage:
 *    <wc-save-button
 *      save-url="/screen/contact/123"
 *      save-new-url="/screen/contact/create"
 *      save-return-url="/screen/contact_list/list">
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
        this.classList.add("contents");
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-save-button');
        this.componentElement.setAttribute('hx-target', '#viewport');
        this.componentElement.setAttribute('hx-swap', 'innerHTML transition:true');
        this.componentElement.setAttribute('hx-indicator', '#content-loader');
        this.componentElement.setAttribute('hx-push-url', 'true');
        this.componentElement.setAttribute('hx-boost', 'true');
        this.appendChild(this.componentElement);
        this._createElement();
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

    _createElement() {
      const saveUrl = this.getAttribute('save-url') || '';
      const saveNewUrl = this.getAttribute('save-new-url') || '';
      const saveReturnUrl = this.getAttribute('save-return-url') || '';
      
      const markup = `
        <button class="btn"
          hx-get="${saveUrl}">Save</button>
        <div class="dropdown">
          <button class="btn" style="border-left:1px solid var(--component-border-color);">
          >
          </button>
          <div class="dropdown-content">
            <a href="${saveNewUrl}">Save and Add New</a>
            <a href="${saveReturnUrl}">Save and Return</a>
          </div>
        </div>
      `.trim();
      this.componentElement.innerHTML = markup;
    }

    _handleAttributeChange(attrName, newValue) {    
      if (attrName === 'items') {
        // if (typeof newValue === 'string') {
        //   this._items = JSON.parse(newValue);
        // }
        // this.removeAttribute('items');
      } else {
        super._handleAttributeChange(attrName, newValue);  
      }
    }



    _applyStyle() {
      const style = `
        /* Dropdown Button */
        .wc-save-button .btn {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          border: none;
          outline: none;
          border-radius: 0;
        }

        /* The container <div> - needed to position the dropdown content */
        .wc-save-button .dropdown {
          position: absolute;
          display: inline-block;
        }

        /* Dropdown Content (Hidden by Default) */
        .wc-save-button .dropdown-content {
          display: none;
          position: absolute;
          background-color: var(--primary-bg-color);
          min-width: 160px;
          z-index: 1;
        }

        /* Links inside the dropdown */
        .wc-save-button .dropdown-content a {
          color: var(--primary-color);
          padding: 12px 16px;
          text-decoration: none;
          display: block;
        }

        /* Change color of dropdown links on hover */
        .wc-save-button .dropdown-content a:hover {
          background-color: var(--primary-hover-color);
        }

        /* Show the dropdown menu on hover */
        .wc-save-button .dropdown:hover .dropdown-content {
          display: block;
        }

        /* Change the background color of the dropdown button when the dropdown content is shown */
        .wc-save-button .btn:hover, .dropdown:hover .btn  {
          background-color: var(--primary-hover-color);
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