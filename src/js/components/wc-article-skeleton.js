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
        this.componentElement.classarticle.add('wc-article-skeleton');
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
      this.componentElement.id = 'article-skeleton';
      this.componentElement.setAttribute('role', 'status');
      this.componentElement.className = 'space-y-8 animate-pulse md:space-y-0 md:space-x-8 rtl:space-x-reverse md:flex md:items-center';
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-center w-full h-48 bg-gray-300 rounded sm:w-96 dark:bg-gray-700">
          <svg class="w-10 h-10 text-gray-200 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
          </svg>
        </div>
        <div class="w-full">
          <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[480px] mb-2.5"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[440px] mb-2.5"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[460px] mb-2.5"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }

    _applyStyle() {
      const style = `
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

/* Flexbox Utilities */
.md\:flex {
  display: flex;
}
.md\:items-center {
  align-items: center;
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

/* Background Colors */
.bg-gray-300 {
  background-color: #d1d5db;
}
.bg-gray-200 {
  background-color: #e5e7eb;
}
.dark\:bg-gray-700 {
  background-color: #374151;
}
.dark\:text-gray-600 {
  color: #4b5563;
}
.text-gray-200 {
  color: #e5e7eb;
}

/* Rounded Corners */
.rounded {
  border-radius: 0.375rem;
}
.rounded-full {
  border-radius: 9999px;
}

/* Margins */
.mb-4 {
  margin-bottom: 1rem;
}
.mb-2\.5 {
  margin-bottom: 0.625rem;
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Animation */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
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

