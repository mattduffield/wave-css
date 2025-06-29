/**
 * 
 *  Name: wc-contact-card
 *  Usage:
 *  <wc-contact-card name="card1" gender="male" contact-name="Duncan Duffield">
 *  </wc-contact-card>
 *  <wc-contact-chip name="card2" gender="female" contact-name="Erica Duffield">
 *  </wc-contact-card>
 * </div>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcContactCard extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'gender', 'contact-name', 'contact-title'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-contact-card');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-contact-card');
      this.appendChild(this.componentElement);      
    }
    // console.log('ctor:wc-contact-card');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    // console.log('connectedCallback:wc-contact-card');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {   
    if (attrName == 'gender') {
      const img = this.querySelector('img');
      if (newValue == 'male') {
        img.setAttribute('src', 'https://www.w3schools.com/howto/img_avatar.png');
      } else {
        img.setAttribute('src', 'https://www.w3schools.com/howto/img_avatar2.png');
      }
    } else if (attrName == 'contact-name') {
      const span = this.querySelector('div.contact-card-name');
      span.innerHTML = newValue;
    } else if (attrName == 'contact-title') {
      const span = this.querySelector('div.contact-card-title');
      span.innerHTML = newValue;
    } else {
    super._handleAttributeChange(attrName, newValue);
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-contact-card > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    // console.log('_render:wc-contact-card');
  }

  _createInnerElement() {
    const parts = Array.from(this.children).filter(p => !p.matches('wc-contact-card') && !p.matches('.wc-contact-card'));
    parts.forEach(p => this.componentElement.appendChild(p));
    const img = document.createElement('img');
    img.setAttribute('src', 'https://www.w3schools.com/howto/img_avatar.png');
    img.setAttribute('alt', 'Person');
    img.setAttribute('width', '100%');
    const divCnt = document.createElement('div');
    divCnt.classList.add('contact-card-container');
    const divName = document.createElement('div');
    divName.classList.add('contact-card-name', 'text-2xl', 'font-bold');
    divName.innerHTML = 'John Doe';
    const divTitle = document.createElement('div');
    divTitle.classList.add('contact-card-title', 'text-lg');
    divTitle.innerHTML = 'Boss';
    divCnt.appendChild(divName);
    divCnt.appendChild(divTitle);
    this.componentElement.appendChild(img);
    this.componentElement.appendChild(divCnt);
  }

  _applyStyle() {
    const style = `
      wc-contact-card {
        display: contents;
      }
      .wc-contact-card {
        box-shadow: 0 4px 8px 0 var(--card-border-color);
        transition: 0.3s;
        width: 40%;
        border-radius: 5px;
        background-color: var(--card-bg-color);
        color: var(--card-color);
      }
      .wc-contact-card:hover {
        box-shadow: 0 8px 16px 0 var(--card-border-color);
      }
      /* Add some padding inside the card container */
      .wc-contact-card .contact-card-container {
        padding: 2px 16px;
      }
      .wc-contact-card img {
        border-radius: 5px 5px 0 0;
      }
    `;
    this.loadStyle('wc-contact-card-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }
}

customElements.define('wc-contact-card', WcContactCard);
