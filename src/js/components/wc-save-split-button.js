/**
 * 
 *  Name: wc-save-split-button
 *  Usage:
 *    <wc-save-split-button
 *      save-url="/screen/contact/123"
 *      save-new-url="/screen/contact/create"
 *      save-return-url="/screen/contact_list/list">
 *    </wc-save-split-button>
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-accordion:open', ['[data-wc-id="0982-a544-98da-b3da"]'], '.accordion-header:nth-of-type(1)')
 *    wc.EventHub.broadcast('wc-accordion:close', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(1)'])
 *    wc.EventHub.broadcast('wc-accordion:toggle', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(2)'])
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-save-split-button')) {

  class WcSaveSplitButton extends WcBaseComponent {
    static get observedAttributes() {
      return [];
    }

    constructor() {
      super();
      this._items = [];
      const compEl = this.querySelector('.wc-save-split-button');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-save-split-button');
        this.componentElement.setAttribute('hx-target', '#viewport');
        this.componentElement.setAttribute('hx-swap', 'innerHTML transition:true');
        this.componentElement.setAttribute('hx-indicator', '#content-loader');
        this.componentElement.setAttribute('hx-push-url', 'true');
        this.componentElement.setAttribute('hx-boost', 'true');
        this.appendChild(this.componentElement);
        this._createElement();
      }
      console.log('ctor:wc-save-split-button');
    }

    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
      console.log('connectedCallback:wc-save-split-button');
    }

    disconnectedCallback() {
      this._unWireEvents();
    }

    _createElement() {
      const id = this.getAttribute('id') || '';
      const method = this.getAttribute('method') || 'post';
      const saveUrl = this.getAttribute('save-url') || '';
      const saveNewUrl = this.getAttribute('save-new-url') || '';
      const saveReturnUrl = this.getAttribute('save-return-url') || '';
      const positionArea = this.getAttribute('position-area') || 'bottom span-left';
      const positionTryFallbacks = this.getAttribute('position-try-fallbacks') || '--bottom-right, --bottom-left, --top-right, --top-left, --right, --left';
      
      const markup = `
        <button type="button" class="save-btn btn"
          hx-${method}="${saveUrl}"
          data-url="${saveUrl}">Save</button>
        <div class="dropdown">
          <button type="button" class="btn" style="border-left:1px solid var(--component-border-color);">
            <svg class="h-3 w-3 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"
              stroke="currentColor" fill="currentColor">
              <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
            </svg>
          </button>
          <div class="dropdown-content">
            <button type="button" class="save-new-btn btn w-full"
              hx-${method}="${saveUrl}"
              data-url="${saveNewUrl}">Save and Add New</button>
            <button type="button" class="save-return-btn btn w-full"
              hx-${method}="${saveUrl}"
              data-url="${saveReturnUrl}">Save and Return</button>
          </div>
        </div>
      `.trim();
      this.componentElement.innerHTML = markup;
      const saveBtn = this.querySelector('.wc-save-split-button');
      saveBtn.style.anchorName = `--${id}-anchor`;
      const drpContent = this.querySelector('.dropdown-content');
      drpContent.style.positionAnchor = `--${id}-anchor`;
      drpContent.style.positionArea = positionArea;
      drpContent.style.positionTryFallbacks = positionTryFallbacks;
    }

    _handleAttributeChange(attrName, newValue) {    
      super._handleAttributeChange(attrName, newValue);  
    }

    _handleClick(event) {
      const method = this.getAttribute('method') || 'post';
      const isSaveBtn = event.target.classList.contains('save-btn');
      let url = event.target.dataset.url;
      let hash = window.location.hash;
      //
      // The following is necessary to distinguish between a create and
      // return back to the new created record. Otherwise, it would
      // always go to a new create screen upon save.
      //
      if (method == 'post' && isSaveBtn) {
        url = url.replace('create', '__id__')
      }
      console.log('wc-save-split-button:click', event, url);
      document.body.addEventListener('htmx:configRequest', (e) => {
        console.log('wc-save-split-button:htmx:configRequest', e, url);
        e.detail.headers['Wc-Save-Redirect'] = url;
        if (hash && isSaveBtn) {
          sessionStorage.setItem('hash', hash);
        }
      }, {once: true});
      document.body.addEventListener('htmx:afterSwap', (e) => {
        console.log('wc-save-split-button:htmx:afterSwap', e);
        const hash = sessionStorage.getItem('hash');
        if (hash) {
          window.location.hash = hash;
          sessionStorage.removeItem('hash');
        }
      }, {once: true});
    }

    _applyStyle() {
      const style = `
        wc-save-split-button {
          display: contents;
        }
        .wc-save-split-button {
          /* anchor-name: --save-anchor; */
          display: flex;
          flex-direction: row;
        }
        /* Dropdown Button */
        .wc-save-split-button .btn {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          border: none;
          outline: none;
          border-radius: 0;
        }

        /* The container <div> - needed to position the dropdown content */
        .wc-save-split-button .dropdown {
          /* display: inline-block; */
        }

        /* Dropdown Content (Hidden by Default) */
        .wc-save-split-button .dropdown-content {
          display: none;
          background-color: var(--primary-bg-color);
          min-width: 160px;
          z-index: 1;

          position: absolute;
          position-try-fallbacks: --bottom-right, --bottom-left, --top-right, --top-left, --right, --left;
          /*
          position-anchor: --save-anchor;
          position-area: bottom span-left;
          */
        }

        @position-try --bottom-left {
          position-area: bottom span-left;
        }
        @position-try --bottom-right {
          position-area: bottom span-right;
        }
        @position-try --top-left {
          position-area: top span-left;
        }
        @position-try --top-right {
          position-area: top span-right;
        }
        @position-try --right {
          position-area: right;
        }
        @position-try --left {
          position-area: left;
        }

        /* Links inside the dropdown */
        .wc-save-split-button .dropdown-content button {
          color: var(--primary-color);
          padding: 12px 16px;
          text-decoration: none;
          display: block;
        }

        /* Change color of dropdown links on hover */
        .wc-save-split-button .dropdown-content a:hover {
          background-color: var(--primary-alt-bg-color);
        }

        /* Show the dropdown menu on hover */
        .wc-save-split-button .dropdown:hover > .dropdown-content {
          display: block;
        }

        /* Change the background color of the dropdown button when the dropdown content is shown */
        .wc-save-split-button .btn:hover, .dropdown:hover .btn  {
          background-color: var(--primary-alt-bg-color);
        }
      `.trim();
      this.loadStyle('wc-save-split-button-style', style);
    }

    _wireEvents() {
      super._wireEvents();
      const saveBtn = this.querySelector('button.save-btn');
      saveBtn.addEventListener('click', this._handleClick.bind(this));
      const saveNewBtn = this.querySelector('button.save-new-btn');
      saveNewBtn.addEventListener('click', this._handleClick.bind(this));
      const saveReturnBtn = this.querySelector('button.save-return-btn');
      saveReturnBtn.addEventListener('click', this._handleClick.bind(this));
    }

    _unWireEvents() {
      super._unWireEvents();
      const saveBtn = this.querySelector('button.save-btn');
      saveBtn.removeEventListener('click', this._handleClick.bind(this));
      const saveNewBtn = this.querySelector('button.save-new-btn');
      saveNewBtn.removeEventListener('click', this._handleClick.bind(this));
      const saveReturnBtn = this.querySelector('button.save-return-btn');
      saveReturnBtn.removeEventListener('click', this._handleClick.bind(this));
    }

  }

  customElements.define('wc-save-split-button', WcSaveSplitButton);
}