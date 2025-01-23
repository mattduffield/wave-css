import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-list-skeleton')) {
  class WcListSkeleton extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    constructor() {
      super();
      const compEl = this.querySelector('.wc-list-skeleton');
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
      this.componentElement.id = 'list-skeleton';
      this.componentElement.setAttribute('role', 'status');
      this.componentElement.className = 'wc-list-skeleton m-4 p-4 space-y-4 border border-solid component-bg-border-color rounded-md shadow animate-pulse md:p-6';
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="w-5/6">
            <div class="h-2.5 component-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 component-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 component-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 component-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 component-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 component-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 component-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 component-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 component-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 component-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 component-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 component-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 component-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 component-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 component-bg-color rounded-full"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }

    _applyStyle() {
      const style = `
wc-list-skeleton {
  display: contents;
}

/* Spacing */
.md\:p-6 {
  padding: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Width and Height */
.max-w-md {
  max-width: 28rem;
}

/* Shadows */
.shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
}
      `.trim();
      this.loadStyle('wc-list-skeleton-style', style);
    }

    _unWireEvents() {
      super._unWireEvents();
    }
  }

  customElements.define('wc-list-skeleton', WcListSkeleton);
}

