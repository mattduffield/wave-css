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
        this.componentElement.classList.add('wc-table-skeleton');
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
      this.componentElement.className = 'max-w-full p-4 space-y-4 border border-gray-200 divide-y divide-gray-200 rounded shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700';
      this.componentElement.innerHTML = `
        <!-- Table Header Skeleton -->
        <div class="flex items-center justify-between">
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
        </div>
        <!-- Table Row Skeletons -->
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }

    // _render() {
    //   super._render();
    //   const innerParts = this.querySelectorAll('.wc-div > *');
    //   if (innerParts.length > 0) {
    //     this.componentElement.innerHTML = '';
    //     innerParts.forEach(p => this.componentElement.appendChild(p));
    //   } else {
    //     this.componentElement.innerHTML = '';
    //     this._moveDeclarativeInner();
    //     // const el = this._createElement();
    //     // this.componentElement.appendChild(el);
    //   }

    //   if (typeof htmx !== 'undefined') {
    //     htmx.process(this);
    //   }
    // }

    _applyStyle() {
      const style = `
        .wc-div {
          position: relative;
          display: block;
        }
      `.trim();
      // this.loadStyle('wc-div-style', style);
    }

    _unWireEvents() {
      super._unWireEvents();
    }
  }

  customElements.define('wc-table-skeleton', WcTableSkeleton);
}

