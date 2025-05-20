/**
 * 
 *  Name: wc-split-button
 *  Usage:
 *    <wc-split-button id="generate-code" label="Generate Code"
 *      onclick="console.log('tests');">
 *      <a id="generate-detail" class="btn">
 *        Generate Detail
 *      </a>
 *      <a id="generate-table" class="btn">
 *        Generate Table
 *      </a>
 *    </wc-split-button>  
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-accordion:open', ['[data-wc-id="0982-a544-98da-b3da"]'], '.accordion-header:nth-of-type(1)')
 *    wc.EventHub.broadcast('wc-accordion:close', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(1)'])
 *    wc.EventHub.broadcast('wc-accordion:toggle', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(2)'])
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-split-button')) {

  class WcSplitButton extends WcBaseComponent {
    static get observedAttributes() {
      return ["btn-id", "btn-class", "btn-label", "split-class"];
    }

    constructor() {
      super();
      this._items = [];
      this.parts = Array.from(this.children);

      const compEl = this.querySelector('.wc-split-button');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-split-button');
        const splitClass = this.getAttribute('split-class');
        if (splitClass) {
          const splitClsParts = splitClass.split(' ');
          splitClsParts.forEach(p => this.componentElement.classList.add(p));  
        }
        this.appendChild(this.componentElement);
        this._createElement();
      }
      console.log('ctor:wc-split-button');
    }

    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
      console.log('connectedCallback:wc-split-button');
    }

    disconnectedCallback() {
      this._unWireEvents();
    }

    _createElement() {
      const id = this.getAttribute('id') || '';
      const label = this.getAttribute('label') || '';
      const positionArea = this.getAttribute('position-area') || 'bottom span-right';
      const positionTryFallbacks = this.getAttribute('position-try-fallbacks') || '--bottom-right, --bottom-left, --top-right, --top-left, --right, --left';

      const markup = `
        <button id="${id}" type="button" class="btn">${label}</button>
        <div class="dropdown">
          <div class="dropdown-content text-sm">
          </div>
          <button type="button" class="btn" style="border-left:1px solid var(--component-border-color);">
            <svg class="h-3 w-3 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"
              stroke="currentColor" fill="currentColor">
              <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
            </svg>
          </button>
        </div>
      `.trim();
      this.componentElement.innerHTML = markup;
      const btn = this.querySelector('.wc-split-button');
      btn.style.anchorName = `--${id}-anchor`;
      const drpContent = this.querySelector('.dropdown-content');
      drpContent.style.positionAnchor = `--${id}-anchor`;
      drpContent.style.positionArea = positionArea;
      drpContent.style.positionTryFallbacks = positionTryFallbacks;
      // drpContent.style.minWidth = `${btn.offsetWidth}px`;
      drpContent.style.minWidth = `calc(100% - 20px`;

      this.parts.forEach(part => {
        drpContent.appendChild(part);
      });
      const mainBtn = this.querySelector(`button#${id}`);
      const onClick = this.getAttribute('onclick');
      if (onClick) {
        const onClickHandler = new Function(onClick);
        mainBtn.onclick = onClickHandler;
        this.removeAttribute('onclick');
      }
      this.removeAttribute('id');
      this.removeAttribute('label');
    }

    _handleAttributeChange(attrName, newValue) {    
      super._handleAttributeChange(attrName, newValue);  
    }

    _applyStyle() {
      const style = `
        wc-split-button {
          display: contents;
        }
        .wc-split-button {
          display: flex;
          flex-direction: row;
        }
        /* Dropdown Button */
        .wc-split-button .btn {
          border-right: none;
          outline: none;
          border-radius: 0;
        }

        /* The container <div> - needed to position the dropdown content */
        .wc-split-button .dropdown {
          /* display: inline-block; */
        }

        /* Dropdown Content (Hidden by Default) */
        .wc-split-button .dropdown-content {
          display: none;
          background-color: var(--button-bg-color);
          border: 1px solid var(--button-border-color);
          border-top: none;
          min-width: 160px;
          z-index: 1;

          position: absolute;
          position-try-fallbacks: --bottom-right, --bottom-left, --top-right, --top-left, --right, --left;
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
        .wc-split-button .dropdown-content a {
          color: var(--button-color);
          padding: 12px 16px;
          text-decoration: none;
          display: block;
          cursor: pointer;
        }

        /* Change color of dropdown links on hover */
        .wc-split-button .dropdown-content a:hover {
          background-color: var(--button-hover-bg-color);
          color: var(--button-hover-color);
        }

        /* Show the dropdown menu on hover */
        .wc-split-button .dropdown:hover > .dropdown-content {
          display: block;
        }

        /* Change the background color of the dropdown button when the dropdown content is shown */
        .wc-split-button .dropdown-content:hover ~ button {
          background-color: var(--button-hover-bg-color);
          color: var(--button-hover-color);
        }
      `.trim();
      this.loadStyle('wc-split-button-style', style);
    }

    _wireEvents() {
      super._wireEvents();
    }

    _unWireEvents() {
      super._unWireEvents();
    }

  }

  customElements.define('wc-split-button', WcSplitButton);
}