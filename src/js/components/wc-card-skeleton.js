import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-card-skeleton')) {
  class WcCardSkeleton extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    constructor() {
      super();
      const compEl = this.querySelector('.wc-card-skeleton');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this._createElement();
        this.appendChild(this.componentElement);      
      }
    }

    async connectedCallback() {
      super.connectedCallback();

      this._applyStyle();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    _handleAttributeChange(attrName, newValue) {    
      if (attrName === 'items') {
        // Do nothing...
      } else {
        super._handleAttributeChange(attrName, newValue);  
      }
    }

    _createElement() {
      this.componentElement.id = 'card-skeleton';
      this.componentElement.setAttribute('role', 'status');
      this.componentElement.className = 'wc-card-skeleton max-w-full m-4 p-4 border border-solid card-border-color rounded-md shadow animate-pulse md:p-6';
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-center h-48 mb-4 card-bg-color rounded-md">
          <svg class="w-10 h-10" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 20">
              <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z"/>
              <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z"/>
          </svg>
        </div>
        <div class="h-2.5 card-bg-color rounded-full w-48 mb-4"></div>
        <div class="h-2 card-bg-color rounded-full mb-2.5"></div>
        <div class="h-2 card-bg-color rounded-full mb-2.5"></div>
        <div class="h-2 card-bg-color rounded-full"></div>
        <div class="flex items-center mt-4">
          <svg class="text-color-2 w-10 h-10 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>
            </svg>
            <div>
                <div class="h-2.5 card-bg-color rounded-full w-32 mb-2"></div>
                <div class="w-48 h-2 card-bg-color rounded-full"></div>
            </div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }

    _applyStyle() {
      const style = `
      wc-card-skeleton {
        display: contents;
      }
      wc-card-skeleton .wc-card-skeleton {
        background-color: var(--surface-1);
      }
      `.trim();
      // this.loadStyle('wc-card-skeleton', style);
    }

    _unWireEvents() {
      super._unWireEvents();
    }
  }

  customElements.define('wc-card-skeleton', WcCardSkeleton);
}

