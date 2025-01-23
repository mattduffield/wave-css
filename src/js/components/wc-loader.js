/**
 * 
 *  Name: wc-loader
 *  Usage:
 *    <wc-loader size="20px" speed="0.5s" thickness="4px"></wc-loader>
 *    <wc-loader size="45px" speed="0.75s" thickness="8px"></wc-loader>
 *    <wc-loader size="90px" speed="1s" thickness="12px"></wc-loader>
 *    <wc-loader></wc-loader>
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-loader:show', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wc-loader:hide', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wc-loader:toggle', ['[data-wc-id="0982-a544-98da-b3da"]'])
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcLoader extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'size', 'speed', 'thickness'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-loader');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-loader');
      this.appendChild(this.componentElement);      
    }
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    this._wireEvents();
    console.log('connectedCallback:wc-loader');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {    
    if (attrName === 'size') {
      this.componentElement.style.height = newValue;
      this.componentElement.style.width = newValue;
    } else if (attrName === 'speed') {
      this.componentElement.style.animationDuration = newValue;
    } else if (attrName === 'thickness') {
      this.componentElement.style.borderWidth = newValue;
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerParts = this.querySelectorAll('.wc-loader > *');
    if (innerParts.length > 0) {
      this.componentElement.innerHTML = '';
      innerParts.forEach(p => this.componentElement.appendChild(p));
    } else {
      // Do nothing...
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  _applyStyle() {
    const style = `
      wc-loader {
        display: contents;
      }

      wc-loader .wc-loader {
        border-width: 16px;
        border-style: solid;
        border-color: var(--color);
        border-top-color: var(--primary-bg-color);
        /*
        border: 16px solid var(--color);
        border-top: 16px solid var(--primary-bg-color);
        */
        border-radius: 50%;
        width: 120px;
        height: 120px;
        animation: loader-spin 2s linear infinite;
      }

      @keyframes loader-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `.trim();
    this.loadStyle('wc-loader-style', style);
  }

  _handleHelper(event, mode='show') {
    const {detail} = event;
    const {selector} = detail;
    const isArray = Array.isArray(selector);
    if (typeof selector === 'string' || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach(tgt => {
        if (tgt === this) {
          if (mode === 'show') {
            this.componentElement.classList.remove('hidden');
          } else if (mode === 'hide') {
            this.componentElement.classList.add('hidden');
          } else if (mode === 'toggle') {
            this.componentElement.classList.toggle('hidden');
          }
        }
      });
    } else {
      const tgt = document.querySelector(selector);
      if (tgt === this) {
        if (mode === 'show') {
          this.componentElement.classList.remove('hidden');
        } else if (mode === 'hide') {
          this.componentElement.classList.add('hidden');
        } else if (mode === 'toggle') {
          this.componentElement.classList.toggle('hidden');
        }
      }
    }
  }

  _handleShow(event) {
    this._handleHelper(event, 'show');
  }

  _handleHide(event) {
    this._handleHelper(event, 'hide');
  }

  _handleToggle(event) {
    this._handleHelper(event, 'toggle');
  }

  _wireEvents() {
    super._wireEvents();
    document.body.addEventListener('wc-loader:show', this._handleShow.bind(this));
    document.body.addEventListener('wc-loader:hide', this._handleHide.bind(this));
    document.body.addEventListener('wc-loader:toggle', this._handleToggle.bind(this));
  }


  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener('wc-loader:show', this._handleShow.bind(this));
    document.body.removeEventListener('wc-loader:hide', this._handleHide.bind(this));
    document.body.removeEventListener('wc-loader:toggle', this._handleToggle.bind(this));
  }

}

customElements.define('wc-loader', WcLoader);
