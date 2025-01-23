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
    console.log('ctor:wc-tab-item');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-tab-item');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
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
    console.log('_render:wc-tab-item');
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
        position: relative;
      }
    `.trim();
    this.loadStyle('wc-tab-item-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-tab-item', WcTabItem);
