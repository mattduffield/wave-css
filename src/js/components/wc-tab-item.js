/**
 *
 *  Name: wc-tab-item
 *  Usage:
 *  <wc-tab-item class="active" label="London">
 *    <div class="col-1 gap-2 pt-2 pb-10 px-10">
 *      <h3>London</h3>
 *      <p>
 *        Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
 *      </p>
 *    </div>
 *  </wc-tab-item>
 *  <wc-tab-item label="New York">
 *    <div class="col-1 gap-2 pt-2 pb-10 px-10">
 *      <h3>New York</h3>
 *      <p>
 *        Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
 *      </p>
 *    </div>
 *  </wc-tab-item>
 *
 *  API:
 *  // Programmatically activate a tab
 *  const tabItem = document.querySelector('wc-tab-item[label="New York"]');
 *  tabItem.activate();
 *
 *  // Or simply click the wc-tab-item element
 *  tabItem.click();
 *
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcTabItem extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'label', 'active'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-tab-item');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-tab-item');
      this.appendChild(this.componentElement);      
    }
    // console.log('ctor:wc-tab-item');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    this._wireEvents();
    // console.log('connectedCallback:wc-tab-item');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  /**
   * Activate this tab item by clicking its corresponding button
   */
  activate() {
    const label = this.getAttribute('label');
    if (!label) return;

    const parentTab = this.closest('wc-tab');
    if (!parentTab) return;

    const btn = parentTab.querySelector(`button.tab-link[data-label="${label}"]`);
    if (btn) {
      btn.click();
    }
  }

  _handleAttributeChange(attrName, newValue) {    
    if (attrName === 'test') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-tab-item > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    // console.log('_render:wc-tab-item');
  }

  _createInnerElement() {
    // const parts = this.querySelectorAll('wc-tab-item > *:not(.wc-tab-item)');
    const parts = Array.from(this.children).filter(p => !p.matches('wc-tab-item') && !p.matches('.wc-tab-item')); // Exclude nested wc-tab elements
    parts.forEach(part => {
      this.componentElement.appendChild(part);
    });
  }

  _applyStyle() {
    const style = `
      wc-tab-item {
        display: contents;
      }
      .wc-tab-item {
        display: flex;
        flex-direction: column;
        flex: 1 1 0%;
        min-height: 0;
        min-width: 0;
        
        position: relative;
      }
    `.trim();
    this.loadStyle('wc-tab-item-style', style);
  }

  _wireEvents() {
    super._wireEvents();
    // Add click listener to make the tab item clickable
    this.addEventListener('click', this._handleClick.bind(this));
  }

  _unWireEvents() {
    super._unWireEvents();
    this.removeEventListener('click', this._handleClick.bind(this));
  }

  _handleClick(event) {
    // Only activate if clicking directly on wc-tab-item, not on child elements
    // This prevents interference with buttons/links inside the tab content
    if (event.target === this || event.target === this.componentElement) {
      this.activate();
    }
  }

}

customElements.define('wc-tab-item', WcTabItem);
