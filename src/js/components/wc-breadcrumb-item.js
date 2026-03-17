import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-breadcrumb-item')) {
  class WcBreadcrumbItem extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    constructor() {
      super();
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

    _applyStyle() {
      const style = `
      wc-breadcrumb-item {
        display: contents;
      }
      wc-breadcrumb-item .wc-breadcrumb-item {
        /* background-color: var(--surface-1); */
      }
      `.trim();
      // this.loadStyle('wc-breadcrumb-item', style);
    }

    _unWireEvents() {
      super._unWireEvents();
    }
  }

  customElements.define('wc-breadcrumb-item', WcBreadcrumbItem);
}

