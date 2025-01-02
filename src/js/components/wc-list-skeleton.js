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
        this.componentElement.classList.add('wc-list-skeleton');
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
      this.componentElement.className = 'm-4 p-4 space-y-4 border border-gray-200 divide-y divide-gray-200 rounded-md shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700';
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="w-5/6">
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="w-1/6 h-2.5 bg-gray-300 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="w-1/6 h-2.5 bg-gray-300 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="w-1/6 h-2.5 bg-gray-300 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="w-1/6 h-2.5 bg-gray-300 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="w-1/6 h-2.5 bg-gray-300 rounded-full dark:bg-gray-700"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }

    _applyStyle() {
      const style = `
/* Spacing */
.md\:p-6 {
  padding: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}
.mb-2\.5 {
  margin-bottom: 0.625rem;
}

/* Width and Height */
.max-w-md {
  max-width: 28rem;
}
.h-2\.5 {
  height: 0.625rem;
}

/* Background Colors */
.bg-gray-300 {
  background-color: #d1d5db;
}
.bg-gray-200 {
  background-color: #e5e7eb;
}
.dark\:bg-gray-600 {
  background-color: #4b5563;
}
.dark\:bg-gray-700 {
  background-color: #374151;
}

/* Borders */
.border {
  border-width: 1px;
  border-style: solid;
}
.border-gray-200 {
  border-color: #e5e7eb;
}
.dark\:border-gray-700 {
  border-color: #374151;
}
.divide-y > * + * {
  border-top-width: 1px;
}
.divide-gray-200 {
  border-color: #e5e7eb;
}
.dark\:divide-gray-700 > * + * {
  border-color: #374151;
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

