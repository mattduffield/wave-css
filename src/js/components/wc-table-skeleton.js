import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-table-skeleton')) {
  class WcTableSkeleton extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    constructor() {
      super();
      const compEl = this.querySelector('.wc-table-skeleton');
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
      this.componentElement.id = 'table-skeleton';
      this.componentElement.setAttribute('role', 'status');
      this.componentElement.className = 'wc-table-skeleton max-w-full m-4 p-4 space-y-4 border border-solid card-border-color rounded-md shadow animate-pulse md:p-6';
      this.componentElement.innerHTML = `
        <!-- Table Header Skeleton -->
        <div class="flex items-center justify-between">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <!-- Table Row Skeletons -->
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }

    _applyStyle() {
      const style = `
wc-table-skeleton {
  display: contents;
}
wc-table-skeleton .wc-table-skeleton {
  background-color: var(--surface-1);
}
/* Spacing */
.md\:p-6 {
  padding: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Shadows */
.shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
}
      `.trim();
      this.loadStyle('wc-table-skeleton-style', style);
    }

    _unWireEvents() {
      super._unWireEvents();
    }
  }

  customElements.define('wc-table-skeleton', WcTableSkeleton);
}

