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
        <button type="button" class="btn"
          hx-post="${saveUrl}"
          data-url="${saveUrl}">Save</button>
        <input type="hidden" name="redirect-url">
        <div class="dropdown">
          <button type="button" class="btn" style="border-left:1px solid var(--component-border-color);">
            <svg class="h-3 w-3 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"
              stroke="currentColor" fill="currentColor">
              <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
            </svg>
          </button>
          <div class="dropdown-content">
            <button type="button" class="btn w-full"
              hx-post="${saveNewUrl}"
              data-url="${saveNewUrl}">Save and Add New</button>
            <button type="button" class="btn w-full"
              hx-post="${saveReturnUrl}"
              data-url="${saveReturnUrl}">Save and Return</button>
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
        .wc-save-button .dropdown-content button {
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
      this.componentElement.addEventListener('click', (e) => {
        const url = e.target.dataset.url;
        const ipt = this.componentElement.querySelector('input[name="redirect-url"]');
        ipt.value = url;
        console.log('wc-save-button:click', e, e.target.dataset.url);
        const form = this.componentElement.closest('form');
        if (form) {
          console.log('wc-save-button:click - form', form);
          htmx.trigger(form, 'click');
        }
      });
    }

    _unWireEvents() {
      super._unWireEvents();
    }

  }

  customElements.define('wc-save-button', WcSaveButton);
}