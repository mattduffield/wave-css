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
        const docTitle = this.getAttribute('doc-title') || '';
        const parts = this.querySelectorAll('wc-breadcrumb-item');
        Array.from(parts).forEach((p) => {
          const lbl = p.getAttribute('label');
          if (lbl) {
            titleParts.push(lbl);
          }
        });
        const title = titleParts.join(' > ');
        if (title) {
          if (docTitle) {
            document.title = title + ' - ' + docTitle;
          } else {
            document.title = title;
          }
        }
      }, 250);
    }

    async connectedCallback() {
      super.connectedCallback();

      this._applyStyle();
    }

    getInnerContainer() {
      return this.querySelector(':scope > .wc-breadcrumb') || this;
    }

    getDesignerHTML() {
      const items = this.querySelectorAll('wc-breadcrumb-item');
      return Array.from(items).map(item => {
        const attrs = [];
        for (const attr of item.attributes) {
          if (attr.name === 'data-wc-id' || attr.name.startsWith('data-designer')) continue;
          if (attr.name === 'class' && attr.value === 'contents') continue;
          if (attr.name === 'style') continue;
          if (attr.value === '') attrs.push(attr.name);
          else attrs.push(`${attr.name}="${attr.value}"`);
        }
        return `<wc-breadcrumb-item ${attrs.join(' ')}></wc-breadcrumb-item>`;
      }).join('\n');
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
      const crumbs = this._getBreadcrumbItems();

      // In designer mode, keep wc-breadcrumb-item elements in the DOM
      // so they are selectable and their properties can be edited.
      if (WcBreadcrumb.designerMode) {
        this.componentElement.className = 'wc-breadcrumb flex flex-row items-center px-2 gap-2';
        // Move breadcrumb-item elements into the wrapper and style them
        const items = this.querySelectorAll('wc-breadcrumb-item');
        items.forEach((item, index) => {
          item.style.display = 'inline-flex';
          item.style.alignItems = 'center';
          item.style.cursor = 'pointer';
          if (index > 0) {
            const sep = document.createElement('span');
            sep.textContent = '>';
            sep.style.color = 'var(--text-6)';
            sep.style.margin = '0 2px';
            this.componentElement.appendChild(sep);
          }
          const label = item.getAttribute('label') || '';
          const link = item.getAttribute('link') || '';
          if (index === 0 && link) {
            // Home icon placeholder
            item.textContent = '🏠';
          } else {
            item.textContent = label || '…';
          }
          this.componentElement.appendChild(item);
        });
        return;
      }

      const markup = [];
      crumbs.forEach((item, index) => {
        if (index == 0) {
          markup.push(`
            <a href="${item.link}">
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
            <a href="${item.link}">
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
      this.componentElement.setAttribute('hx-boost', 'true');
      this.componentElement.setAttribute('hx-target', '#viewport');
      this.componentElement.setAttribute('hx-swap', 'innerHTML transition:true');
      this.componentElement.setAttribute('hx-push-url', 'true');
      this.componentElement.setAttribute('hx-indicator', '#content-loader');
      this.componentElement.innerHTML = html;
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

