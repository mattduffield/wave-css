/**
 * 
 *  Name: wc-slideshow-image
 *  Usage:
 *    <wc-slideshow class="mb-4" autoplay autoplay-interval="3000">
 *      <wc-slideshow-image
 *        url="https://www.w3schools.com/howto/img_nature_wide.jpg"
 *        caption="Caption 1"></wc-slideshow-image>
 *      <wc-slideshow-image
 *        url="https://www.w3schools.com/howto/img_snow_wide.jpg"
 *        caption="Caption 2"></wc-slideshow-image>
 *      <wc-slideshow-image
 *        url="https://www.w3schools.com/howto/img_lights_wide.jpg"
 *        caption="Caption 3"></wc-slideshow-image>
 *      <wc-slideshow-image
 *        url="https://www.w3schools.com/howto/img_mountains_wide.jpg"
 *        caption="Caption 4"></wc-slideshow-image>
 *    </wc-slideshow>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcSlideshowImage extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'url', 'caption', 'numbertext'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-slideshow-image');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-slideshow-image', 'slide', 'fade');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-slideshow-image');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-slideshow-image');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {    
    if (attrName === 'numbertext') {
      const numTextEl = this.querySelector('.numbertext');
      if (numTextEl) {
        numTextEl.textContent = newValue;
      }
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-slideshow-image > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-slideshow-image');
  }

  _createInnerElement() {
    const numTextEl = document.createElement('div');
    numTextEl.textContent = this.getAttribute('numbertext') || '';
    numTextEl.classList.add('numbertext');
    const imgEl = document.createElement('img');
    imgEl.src = this.getAttribute('url') || '';
    const captionEl = document.createElement('div');
    captionEl.textContent = this.getAttribute('caption') || '';
    captionEl.classList.add('text');
    this.componentElement.appendChild(numTextEl);
    this.componentElement.appendChild(imgEl);
    this.componentElement.appendChild(captionEl);
  }

  _applyStyle() {
    const style = `
      wc-slideshow-image {
        display: contents;
      }

      .wc-slideshow-image {
        position: relative;
      }

      .wc-slideshow-image img {
        max-height: 300px;
        width: 100%;
        height: auto;
        object-fit: cover;
      }
      
      /* Caption text */
      .wc-slideshow-image .text {
        color: #f2f2f2;
        font-size: 15px;
        padding: 8px 12px;
        position: absolute;
        bottom: 8px;
        width: 100%;
        text-align: center;
      }

      /* Number text (1/3 etc) */
      .wc-slideshow-image .numbertext {
        color: #f2f2f2;
        font-size: 12px;
        padding: 8px 12px;
        position: absolute;
        top: 0;
      }      
`.trim();
    this.loadStyle('wc-slideshow-image-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
  }

}

customElements.define('wc-slideshow-image', WcSlideshowImage);
