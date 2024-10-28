/**
 * 
 *  Name: wc-div
 *  Usage:
 *    <wc-div caption="SCROLL DOWN"
 *      img-url="https://www.w3schools.com/howto/img_parallax.jpg">
 *    </wc-div>
 *    <wc-div caption="LESS HEIGHT"
 *      img-url="https://www.w3schools.com/howto/img_parallax2.jpg"
 *      min-height="400px">
 *    </wc-div>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcDiv extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-div');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-div');
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
      if (typeof newValue === 'string') {
        this._items = JSON.parse(newValue);
      }
      this.removeAttribute('items');
    } else if (attrName === 'caption') {
      // Do nothing...
    } else if (attrName === 'img-url') {
      // Do nothing...
    } else if (attrName === 'min-height') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerParts = this.querySelectorAll('.wc-div > *');
    if (innerParts.length > 0) {
      this.componentElement.innerHTML = '';
      innerParts.forEach(p => this.componentElement.appendChild(p));
    } else {
      this.componentElement.innerHTML = '';
      this._moveDeclarativeInner();
      // const el = this._createElement();
      // this.componentElement.appendChild(el);
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  _moveDeclarativeInner() {
    const innerParts = this.querySelectorAll('wc-div > *:not(.wc-div)');
    if (innerParts.length > 0) {
      innerParts.forEach(p => this.componentElement.appendChild(p));
    }
    // Array.from(options).forEach(option => option.remove());
  }

  _applyStyle() {
    const style = `
      .wc-div {
        position: relative;
        display: block;
      }
    `.trim();
    this.loadStyle('wc-div-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-div', WcDiv);
