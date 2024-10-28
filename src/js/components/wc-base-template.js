/**
 * 
 *  Name: wc-base-template
 *  Usage:
 *    <wc-base-template id="top-nav"></wc-base-template>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcBaseTemplate extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-base-template');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-base-template');
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
    // if (attrName === 'items') {
    //   if (typeof newValue === 'string') {
    //     this._items = JSON.parse(newValue);
    //   }
    //   this.removeAttribute('items');
    // } else {
    //   super._handleAttributeChange(attrName, newValue);  
    // }
  }

  _render() {
    super._render();
    const innerParts = this.querySelectorAll('.wc-base-template > *');
    if (innerParts.length > 0) {
      this.componentElement.innerHTML = '';
      innerParts.forEach(p => this.componentElement.appendChild(p));
    } else {
      this._moveDeclarativeOptions();
      this.componentElement.innerHTML = '';
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  _applyStyle() {
    const style = `.wc-base-template {

    }`.trim();
    this.loadStyle('wc-base-template-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-base-template', WcBaseTemplate);
