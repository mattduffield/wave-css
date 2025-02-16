/**
 * 
 *  Name: wc-contact-chip
 *  Usage:
 *  <wc-contact-chip class="theme-midnight-blue dark">
 *    <a href="#">About</a>
 *    <a href="#">Services</a>
 *    <a href="#">Clients</a>
 *    <a href="#">Contact</a>
 *  </wc-contact-chip>
 * 
 *  <wc-contact-chip width="200px" background-color="#111" right-side>
 *    <a href="#">About</a>
 *    <a href="#">Services</a>
 *    <a href="#">Clients</a>
 *    <a href="#">Contact</a>
 *  </wc-contact-chip>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcContactChip extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'gender', 'person-name'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-contact-chip');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-contact-chip');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-contact-chip');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-contact-chip');
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
    } else if (attrName == 'person-name') {
        const span = this.querySelector('span.name-content');
        span.innerHTML = newValue;
      } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-contact-chip > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-contact-chip');
  }

  _createInnerElement() {
    const parts = Array.from(this.children).filter(p => !p.matches('wc-contact-chip') && !p.matches('.wc-contact-chip'));
    parts.forEach(p => this.componentElement.appendChild(p));
    const img = document.createElement('img');
    img.setAttribute('src', 'https://www.w3schools.com/howto/img_avatar.png');
    img.setAttribute('alt', 'Person');
    img.setAttribute('height', '96');
    img.setAttribute('width', '96');
    const span = document.createElement('span');
    span.classList.add('name-content');
    span.innerHTML = 'John Doe';
    const btn = document.createElement('span');
    btn.classList.add('close-btn');
    btn.innerHTML = '&times;';
    btn.setAttribute('onclick', `
      const cnt = this.closest('wc-contact-chip.contents');
      cnt.classList.add('hidden');
    `);
    this.componentElement.appendChild(img);
    this.componentElement.appendChild(span);
    this.componentElement.appendChild(btn);
  }

  _applyStyle() {
    const style = `
      wc-contact-chip {
        display: contents;
      }
      .wc-contact-chip {
        position: relative;
        display: inline-block;
        padding: 0 25px;
        height: 50px;
        font-size: 18px;
        line-height: 50px;
        border-radius: 25px;
        background-color: var(--card-bg-color);
        color: var(--card-color);
      }
      .wc-contact-chip img {
        float: left;
        margin: 0 0 0 -25px;
        height: 50px;
        width: 50px;
        border-radius: 50%;
      }
      .wc-contact-chip .name-content {
        margin: 0 10px;
      }
      .wc-contact-chip .close-btn {
        position: absolute;
        right: 10px;
        margin-left: 10px;
        color: var(--surface-8);
        font-weight: bold;
        font-size: 20px;
        cursor: pointer;
      }
      .wc-contact-chip .close-btn:hover {
        color: var(--surface-6);
      }
    `;
    this.loadStyle('wc-contact-chip-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }
}

customElements.define('wc-contact-chip', WcContactChip);
