/**
 * 
 *  Name: wc-form
 *  Usage:
 *    <wc-form caption="SCROLL DOWN"
 *      img-url="https://www.w3schools.com/howto/img_parallax.jpg">
 *    </wc-form>
 *    <wc-form caption="LESS HEIGHT"
 *      img-url="https://www.w3schools.com/howto/img_parallax2.jpg"
 *      min-height="400px">
 *    </wc-form>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcForm extends WcBaseComponent {
  static get observedAttributes() {
    return ['class'];
  }

  constructor() {
    super();
    this.passThruAttributes = [
      'id', 'name', 'mode', 'action'
    ];
    this.passThruEmptyAttributes = [];
    this.ignoreAttributes = [];
    const compEl = this.querySelector('.wc-form');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('form');
      this.componentElement.classList.add('wc-form');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-form');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-form');
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
    const innerEl = this.querySelector('.wc-form > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';
      this.passThruAttributes.forEach(p => {
        if (this.hasAttribute(p)) {
          const v = this.getAttribute(p);
          this.componentElement?.setAttribute(p, v);
        }
      });
      this.passThruAttributes.forEach(p => {
        this.removeAttribute(p);
      });

      this._moveDeclarativeInner();
      this._wireEvents();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-form');
  }

  _moveDeclarativeInner() {
    const innerParts = this.querySelectorAll('wc-form > *:not(.wc-form)');
    if (innerParts.length > 0) {
      innerParts.forEach(p => this.componentElement.appendChild(p));
    }
  }

  _handleSubmit(event) {
    event.preventDefault();
    const {target} = event;
    const disabledInputs = this.componentElement.querySelectorAll("[disabled]");
    disabledInputs.forEach(elt => elt.disabled = false);
    disabledInputs.forEach(elt => elt.removeAttribute('disabled'));      

    target.submit();

    disabledInputs.forEach(elt => elt.disabled = true);
    disabledInputs.forEach(elt => elt.setAttribute('disabled', ''));    
  }

  _applyStyle() {
    const style = `
      .wc-form {
        position: relative;
      }
    `.trim();
    this.loadStyle('wc-form-style', style);
  }

  _wireEvents() {
    super._wireEvents();
    this.componentElement.addEventListener("submit", this._handleSubmit.bind(this));
  }

  _unWireEvents() {
    super._unWireEvents();
    this.componentElement.removeEventListener("submit", this._handleSubmit.bind(this));
  }

}

customElements.define('wc-form', WcForm);
