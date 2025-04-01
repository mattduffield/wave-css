import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-article-skeleton')) {
  class WcArticleSkeleton extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    constructor() {
      super();
      const compEl = this.querySelector('.wc-article-skeleton');
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

      const payload = { detail: {} };
      const custom = new CustomEvent('load', payload);
      this.dispatchEvent(custom);
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
      this.componentElement.id = 'article-skeleton';
      this.componentElement.setAttribute('role', 'status');
      this.componentElement.className = 'wc-article-skeleton max-w-full m-4 border border-solid card-border-color p-4 space-y-8 animate-pulse md:space-y-0 md:space-x-8 rtl:space-x-reverse md:flex md:items-center';
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-center w-full h-48 card-bg-color rounded-md sm:w-96">
          <svg class="w-10 h-10" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
          </svg>
        </div>
        <div class="w-full">
          <div class="h-2.5 card-bg-color rounded-full w-48 mb-4"></div>
          <div class="h-2 card-bg-color rounded-full max-w-[480px] mb-2.5"></div>
          <div class="h-2 card-bg-color rounded-full mb-2.5"></div>
          <div class="h-2 card-bg-color rounded-full max-w-[440px] mb-2.5"></div>
          <div class="h-2 card-bg-color rounded-full max-w-[460px] mb-2.5"></div>
          <div class="h-2 card-bg-color rounded-full max-w-[360px]"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }

    _applyStyle() {
      const style = `
wc-article-skeleton {
  display: contents;
}
wc-article-skeleton .wc-article-skeleton {
  background-color: var(--surface-1);
}
/* Space Utilities */
.space-y-8 > * + * {
  margin-top: 2rem;
}
.md\:space-y-0 > * + * {
  margin-top: 0;
}
.md\:space-x-8 > * + * {
  margin-left: 2rem;
}
.rtl\:space-x-reverse > * + * {
  margin-left: 0;
  margin-right: 2rem;
}

.sm\:w-96 {
  width: 24rem;
}
.max-w-\[480px\] {
  max-width: 480px;
}
.max-w-\[440px\] {
  max-width: 440px;
}
.max-w-\[460px\] {
  max-width: 460px;
}
.max-w-\[360px\] {
  max-width: 360px;
}
      `.trim();
      this.loadStyle('wc-article-skeleton', style);
    }

    _unWireEvents() {
      super._unWireEvents();
    }
  }

  customElements.define('wc-article-skeleton', WcArticleSkeleton);
}

