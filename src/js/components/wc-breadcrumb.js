import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-breadcrumb')) {
  class WcBreadcrumb extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'doc-title'];
    }

    constructor() {
      super();
      const compEl = this.querySelector('.wc-breadcrumb');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this._createElement();
        this.appendChild(this.componentElement);
      }
      setTimeout(() => {
        const titleParts = [];
        const origTitle = document.title;
        const docTitle = this.getAttribute('doc-title') || origTitle;
        const parts = this.querySelectorAll('wc-breadcrumb-item');
        Array.from(parts).forEach((p) => {
          const lbl = p.getAttribute('label');
          if (lbl) {
            titleParts.push(lbl);
          }
        });
        const title = titleParts.join(' > ');
        if (title) {
          document.title = title + ' - ' + docTitle;
        }
      }, 250);
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

    _getBreadcrumbItems() {
      let crumbs = [
        { "label": "", "link": "/v/home" },
        { "label": "Screens", "link": "/v/screen_list/list" },
        { "label": "screen", "link": "" }
      ]; 
      const result = [];
      const els = this.querySelectorAll('wc-breadcrumb-item');
      Array.from(els).forEach((item) => {
        const label = item.getAttribute('label') || ''; 
        const link = item.getAttribute('link') || '';
        result.push({label, link});
      });
      return result;
    }

    _createElement() {
      const markup = [];
      const crumbs = this._getBreadcrumbItems();
      crumbs.forEach((item, index) => {
        if (index == 0) {
          markup.push(`
            <a href="${item.link}"
              hx-get="${item.link}"
              hx-target="#viewport"
              hx-swap="innerHTML transition:true"
              hx-push-url="true"
              hx-indicator="#content-loader">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </a>            
          `);
        } else if ((crumbs.length - 1) == index) {
          markup.push(`
            <span id="title-content">
              ${item.label}
            </span>            
          `);
        } else {
          markup.push(`
            <a href="${item.link}"
              hx-get="${item.link}"
              hx-target="#viewport"
              hx-swap="innerHTML transition:true"
              hx-push-url="true"
              hx-indicator="#content-loader">
              ${item.label}
            </a>
          `);
        }
      });
      const html = markup.join(`
        <span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      `);
      this.componentElement.id = 'breadcrumb';
      this.componentElement.className = 'wc-breadcrumb flex flex-row px-2 gap-3';
      this.componentElement.innerHTML = html;
      this.componentElement.innerHTML2 = `
        <a href="/v/home"
           hx-get="/v/home"
           hx-target="#viewport"
           hx-swap="innerHTML transition:true"
           hx-push-url="true"
           hx-indicator="#content-loader">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </a>
        <span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <a href="/v/screen_list/list"
          hx-get="/v/screen_list/list"
          hx-target="#viewport"
          hx-swap="innerHTML transition:true"
          hx-push-url="true"
          hx-indicator="#content-loader">
          Screens
        </a>
        <span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <span>
          screen
        </span>
      `.trim();
    }

    _applyStyle() {
      const style = `
      wc-breadcrumb {
        display: contents;
      }
      wc-breadcrumb .wc-breadcrumb {
        /* background-color: var(--surface-1); */
      }
      `.trim();
      // this.loadStyle('wc-breadcrumb', style);
    }

    _unWireEvents() {
      super._unWireEvents();
    }
  }

  customElements.define('wc-breadcrumb', WcBreadcrumb);
}

