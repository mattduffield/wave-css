/**
 * 
 *  Name: wc-background-image
 *  Usage:
 *    <wc-background-image caption="SCROLL DOWN"
 *      img-url="https://www.w3schools.com/howto/img_parallax.jpg">
 *    </wc-background-image>
 *    <wc-background-image caption="LESS HEIGHT"
 *      img-url="https://www.w3schools.com/howto/img_parallax2.jpg"
 *      min-height="400px">
 *    </wc-background-image>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcBackgroundImage extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'caption', 'img-url', 'min-height'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-background-image');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-background-image');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-background-image');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-background-image');
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
    const innerParts = this.querySelectorAll('.wc-background-image > *');
    if (innerParts.length > 0) {
      this.componentElement.innerHTML = '';
      innerParts.forEach(p => this.componentElement.appendChild(p));
    } else {
      this.componentElement.innerHTML = '';
      const imgUrl = this.getAttribute('img-url') || '';
      const minHeight = this.getAttribute('min-height') || '100%';
      this.componentElement.style.backgroundImage = `url("${imgUrl}")`;
      this.componentElement.style.minHeight = minHeight;
      const el = this._createElement();
      this.componentElement.appendChild(el);
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-background-image');
  }

  _createElement() {
    const captionText = this.getAttribute('caption') || '';
    const caption = document.createElement('div');
    caption.classList.add('caption');
    const border = document.createElement('span');
    border.classList.add('border');
    border.textContent = captionText;
    caption.appendChild(border);
    return caption;
  }

  _applyStyle() {
    const style = `
      .wc-background-image {
        position: relative;
        opacity: 0.65;
        background-attachment: fixed;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
      }
      .wc-background-image .caption {
        position: absolute;
        left: 0;
        top: 50%;
        width: 100%;
        text-align: center;
        color: #000;
      }
      .wc-background-image .caption span.border {
        background-color: #111;
        color: #fff;
        padding: 18px;
        font-size: 25px;
        letter-spacing: 10px;
      }
      /* Turn off parallax scrolling for tablets and phones */
      /* @media only screen and (max-device-width: 1024px) { */
      @media (max-device-width: 768px) {
        .wc-background-image {
          background-attachment: scroll;
        }
      }      
    `.trim();
    this.loadStyle('wc-background-image-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-background-image', WcBackgroundImage);
