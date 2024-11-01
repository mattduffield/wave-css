/**
 * 
 *  Name: wc-image
 *  Usage:
 * 
 *  <wc-image
 *    url="https://images.pexels.com/photos/866398/pexels-photo-866398.jpeg?auto=compress&cs=tinysrgb&w=800&h=375"
 *    caption="Image">
 *  </wc-image>
 * 
 *  <wc-image modal
 *    url="https://images.pexels.com/photos/866398/pexels-photo-866398.jpeg?auto=compress&cs=tinysrgb&w=800&h=375"
 *    caption="Image">
 *  </wc-image>
 * 
 *  <wc-image hover-overlay hover-mode="left"
 *    url="https://images.pexels.com/photos/866398/pexels-photo-866398.jpeg?auto=compress&cs=tinysrgb&w=800&h=375"
 *    caption="Image">
 *    <div class="col-1 gap-2 p-10">
 *      <p>
 *        Some text to enable scrolling.. Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
 *      </p>
 *    </div>
 *  </wc-image>
 * 
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcImage extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'url', 'caption', 'modal', 'hover-overlay', 'hover-mode'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-image');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-image');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-image');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('conntectCallback:wc-image');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {    
    if (attrName === 'url') {
      // Do nothing...
    } else if (attrName === 'caption') {
      // Do nothing...
    } else if (attrName === 'modal') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-image > *');
    if (innerEl) {
      // Do nothing...
      if (this.hasAttribute('modal')) {
        const imgEl = this.querySelector('.img');
        imgEl.addEventListener('click', this._showModal.bind(this));
        const closeBtn = this.querySelector('.overlay .closebtn');
        closeBtn.addEventListener('click', this._hideModal.bind(this));        
      }
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-image');
  }

  _createInnerElement() {
    const caption = this.getAttribute('caption') || '';
    const imgEl = document.createElement('img');
    imgEl.classList.add('img');
    imgEl.src = this.getAttribute('url') || '';
    imgEl.alt = caption;
    const captionEl = document.createElement('div');
    captionEl.textContent = caption;
    captionEl.classList.add('img-text');
    this.componentElement.appendChild(imgEl);
    this.componentElement.appendChild(captionEl);
    if (this.hasAttribute('hover-overlay')) {
      const hoverMode = this.getAttribute('hover-mode') || 'bottom';
      const hoverOverlay = document.createElement('div');
      hoverOverlay.classList.add('hover-overlay', hoverMode);
      const parts = this.querySelectorAll('wc-image > *:not(.wc-image');
      parts.forEach(p => hoverOverlay.appendChild(p));
      this.componentElement.appendChild(hoverOverlay);
    }

    const overlay = document.createElement('div');
    overlay.classList.add('overlay', 'hidden');
    const closeBtn = document.createElement('button');    
    closeBtn.classList.add('closebtn');
    closeBtn.innerHTML = '&times;';
    overlay.appendChild(closeBtn);
    const overlayImg = document.createElement('img');
    overlayImg.classList.add('overlay-img');
    overlayImg.alt = caption;
    overlay.appendChild(overlayImg);
    const overlayCaption = document.createElement('div');
    overlayCaption.textContent = caption;
    overlayCaption.classList.add('overlay-img-text');
    overlay.appendChild(overlayCaption);
    this.appendChild(overlay);

    if (this.hasAttribute('modal')) {
      imgEl.addEventListener('click', this._showModal.bind(this));
      closeBtn.addEventListener('click', this._hideModal.bind(this));      
    }
  }

  _showModal(event) {
    const {target} = event;
    const overlay = this.querySelector('.overlay');
    if (overlay) {
      const img = this.querySelector('img:not(.overlay-img)');
      const overlayImg = this.querySelector('.overlay-img');
      overlayImg.src = img.src;
      overlay.classList.remove('hidden');
      overlay.classList.add('show');
    }
  }

  _hideModal(event) {
    const {target} = event;
    const overlay = this.querySelector('.overlay');
    if (overlay) {
      overlay.classList.remove('show');
      overlay.classList.add('hidden');
    }
  }

  _applyStyle() {
    const style = `
      wc-image .wc-image {
        position: relative;
      }
      wc-image .wc-image .img {
        max-height: 300px;
        width: 100%;
        height: auto;
        object-fit: cover;
        transition: 0.3s;
      }
      wc-image[modal]:not([hover-overlay]) .wc-image .img {
        cursor: pointer;
      }
      wc-image[modal]:not([hover-overlay]) .wc-image .img:hover {
        opacity: 0.7;
      }
      wc-image .wc-image .img-text {
        color: #f2f2f2;
        font-size: 15px;
        padding: 8px 12px;
        position: absolute;
        bottom: 8px;
        width: 100%;
        text-align: center;
      }
      /* Overlay */
      wc-image .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        padding-top: 100px;
        background-color: transparent;
        transition: background-color 0.5s ease;
      }
      wc-image .overlay.show {
        background-color: rgba(0,0,0,0.8);
        z-index: 1;
      }
      wc-image .overlay .closebtn {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 40px;
        background-color: transparent;
      }
      wc-image .overlay .overlay-img {
        margin: auto;
        display: block;
        width: 80%;
        max-width: 700px;
      }
      wc-image .overlay .overlay-img-text {
        color: #f2f2f2;
        font-size: 36px;
        padding: 8px 12px;
        position: absolute;
        width: 100%;
        text-align: center;
      }
      wc-image .overlay .overlay-img,
      wc-image .overlay .overlay-img-text {
        animation-name: img-zoom;
        animation-duration: 0.6s;
      }
      /* Hover Overlay */
      wc-image[hover-overlay] .hover-overlay.top {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
        width: 100%;
        height:0;
        transition: .5s ease;
      }
      wc-image[hover-overlay] .wc-image:hover .hover-overlay.top {
        top: 0;
        height: 100%;
      }
      wc-image[hover-overlay] .hover-overlay.bottom {
        position: absolute;
        bottom: 100%;
        left: 0;
        right: 0;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
        width: 100%;
        height:0;
        transition: .5s ease;
      }
      wc-image[hover-overlay] .wc-image:hover .hover-overlay.bottom {
        bottom: 0;
        height: 100%;
      }
      wc-image[hover-overlay] .hover-overlay.left {
        position: absolute;
        bottom: 0;
        left: 100%;
        right: 0;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
        width: 0;
        height: 100%;
        transition: .5s ease;
      }
      wc-image[hover-overlay] .wc-image:hover .hover-overlay.left {
        left: 0;
        width: 100%;
      }
      wc-image[hover-overlay] .hover-overlay.right {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 100%;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
        width: 0;
        height: 100%;
        transition: .5s ease;
      }
      wc-image[hover-overlay] .wc-image:hover .hover-overlay.right {
        right: 0;
        width: 100%;
      }

      @keyframes img-zoom {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
    `.trim();
    this.loadStyle('wc-image-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.hasAttribute('modal')) {
      const imgEl = this.querySelector('.img');
      imgEl.removeEventListener('click', this._showModal.bind(this));
      const closeBtn = this.querySelector('.overlay .closebtn');
      closeBtn.removeEventListener('click', this._hideModal.bind(this));
    }
  }

}

customElements.define('wc-image', WcImage);
