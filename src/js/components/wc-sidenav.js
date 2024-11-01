/**
 * 
 *  Name: wc-sidenav
 *  Usage:
 *    <wc-sidenav class="mb-4" open-top="48px" open-vertical-text width="200px">
 *      <a href="#">About</a>
 *      <a href="#">Services</a>
 *      <a href="#">Clients</a>
 *      <a href="#">Contact</a>
 *    </wc-sidenav>
 * 
 *    <wc-sidenav class="mb-4" open-top="48px" push>
 *      <a href="#">About</a>
 *      <a href="#">Services</a>
 *      <a href="#">Clients</a>
 *      <a href="#">Contact</a>
 *    </wc-sidenav>
 * 
 *    <wc-sidenav class="mb-4" open-top="48px" width="100%">
 *      <a href="#">About</a>
 *      <a href="#">Services</a>
 *      <a href="#">Clients</a>
 *      <a href="#">Contact</a>
 *    </wc-sidenav>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcSidenav extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'label', 'width', 'open', 'open-top', 'open-vertical-text', 'push', 'push-target', 'overlay', 'background-color', 'auto-height'];
  }

  constructor() {
    super();
    if (!this.hasAttribute('right-side')) {
      this.setAttribute('left-side', '');
    }
    const compEl = this.querySelector('.wc-sidenav');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      const isOpen = this.hasAttribute('open');
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-sidenav', 'sidenav');
      if (isOpen) {
        this.componentElement.classList.add('open');
      }
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-sidenav');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('conntectCallback:wc-sidenav');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {    
    if (attrName === 'label') {
      // Do nothing...
    } else if (attrName === 'auto-height') {
      // Do nothing...
    } else if (attrName === 'background-color') {
      // Do nothing...
    } else if (attrName === 'open-vertical-text') {
      // Do nothing...
    } else if (attrName === 'open-top') {
      // Do nothing...
    } else if (attrName === 'open') {
      // Do nothing...
    } else if (attrName === 'overlay') {
      // Do nothing...
    } else if (attrName === 'push-target') {
      // Do nothing...
    } else if (attrName === 'push') {
      // Do nothing...
    } else if (attrName === 'width') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-sidenav > *');
    if (innerEl) {
      const closeBtn = this.querySelector('.closebtn');
      closeBtn.addEventListener('click', this._closeNav.bind(this));
      const openBtn = this.querySelector('.openbtn');
      openBtn.addEventListener('click', this._openNav.bind(this));
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-sidenav');
  }

  _createInnerElement() {
    const parts = this.querySelectorAll('wc-sidenav > *:not(.wc-sidenav');

    const autoHeight = this.hasAttribute('auto-height');
    if (autoHeight) {
      this.componentElement.style.height = 'auto';
    } else {
      this.componentElement.style.height = '100%';
    }

    const overlay = document.createElement('div');
    overlay.classList.add('overlay', 'hidden');
    this.appendChild(overlay);

    if (this.hasAttribute('background-color')) {
      // const body = document.body;
      // const bgColor = getComputedStyle(body).getPropertyValue('--background-color').trim();
      const bgColor = this.getAttribute('background-color');
      this.componentElement.style.setProperty('--background-color', bgColor);
    }

    const lbl = this.getAttribute('label') || 'Sidenav';
    const closeBtn = document.createElement('button');    
    closeBtn.classList.add('closebtn');
    closeBtn.innerHTML = '&times;';
    closeBtn.addEventListener('click', this._closeNav.bind(this));
    this.componentElement.appendChild(closeBtn);
    const openBtn = document.createElement('button');    
    openBtn.classList.add('openbtn');
    openBtn.style.top = this.getAttribute('open-top') || '0';
    openBtn.addEventListener('click', this._openNav.bind(this));
    const openSpan = document.createElement('span');
    openSpan.textContent = lbl;
    openBtn.appendChild(openSpan);
    this.appendChild(openBtn);
    parts.forEach(p => this.componentElement.appendChild(p));
    const pushSelector = this.getAttribute('push-target') || '#viewport';
    if (pushSelector) {
      const pushTarget = document.querySelector(pushSelector);
        if (pushTarget) {
          pushTarget.style.setProperty('transition', 'margin-left 0.5s ease, margin-right 0.5s ease');
        }
    }
  }

  _openNav(event) {
    const {target} = event;
    const width = this.getAttribute('width') || '250px';
    const pushSelector = this.getAttribute('push-target') || '#viewport';
    const side = this.querySelector('.wc-sidenav');
    side.classList.add('open');
    side.style.width = width;
    
    if (this.hasAttribute('overlay')) {
      const overlay = this.querySelector('.overlay');
      if (overlay) {
        overlay.classList.add('open');
        overlay.classList.remove('hidden');
      }
    }

    if (this.hasAttribute('push')) {
      const isRight = this.hasAttribute('right-side');
      if (pushSelector) {
        const pushTarget = document.querySelector(pushSelector);
        if (pushTarget) {
          if (isRight) {
            pushTarget.style.marginRight = width;
          } else {
            pushTarget.style.marginLeft = width;
          }
        }
      }
    }
  }

  _closeNav(event) {
    const {target} = event;
    const pushSelector = this.getAttribute('push-target') || '#viewport';
    const side = target.closest('.wc-sidenav');
    side.classList.remove('open');
    side.style.width = '0';

    if (this.hasAttribute('overlay')) {
      const overlay = this.querySelector('.overlay');
      if (overlay) {
        overlay.classList.remove('open');
        overlay.classList.add('hidden');
      }
    }

    if (this.hasAttribute('push')) {
      const isRight = this.hasAttribute('right-side');
      if (pushSelector) {
        const pushTarget = document.querySelector(pushSelector);
        if (pushTarget) {
          if (isRight) {
            pushTarget.style.marginRight = '0';
          } else {
            pushTarget.style.marginLeft = '0';
          }
        }
      }

    }
  }

  _applyStyle() {
    const style = `
      wc-sidenav .wc-sidenav.sidenav {
        /* height: 100%; */
        width: 0;
        position: fixed;
        z-index: 2;
        top: 0;
        background-color: var(--bg-color);
        overflow-x: hidden;
        padding-top: 60px;
        padding-bottom: 20px;
        text-align: center;
        transition: 0.5s;
      }
      wc-sidenav[left-side] .wc-sidenav.sidenav {
        left: 0;
      }
      wc-sidenav[right-side] .wc-sidenav.sidenav {
        right: 0;
      }
      wc-sidenav .wc-sidenav.sidenav a {
        text-decoration: none;
        font-size: 25px;
        color: var(--component-color);
        display: block;
        transition: 0.3s;
      }
      wc-sidenav[left-side] .wc-sidenav.sidenav a {
        padding: 8px 8px 8px 32px;
      }
      wc-sidenav[right-side] .wc-sidenav.sidenav a {
        padding: 8px 32px 8px 8px;
      }
      wc-sidenav .wc-sidenav.sidenav.open a {
        padding: 8px 8px;
      }
      wc-sidenav .wc-sidenav.sidenav a:hover {
        color: var(--accent-bg-color);
      }
      wc-sidenav .wc-sidenav.sidenav .closebtn {
        position: absolute;
        top: 0;
        font-size: 36px;
        background-color: transparent;
      }
      wc-sidenav[left-side] .wc-sidenav.sidenav .closebtn {
        right: 10px;
      }
      wc-sidenav[right-side] .wc-sidenav.sidenav .closebtn {
        left: 10px;
      }
      wc-sidenav .openbtn {
        position: absolute;
        z-index: 1;
      }
      wc-sidenav[left-side] .openbtn {
        left: 0;
        border-radius: 0 0.375rem 0.375rem 0;
      }
      wc-sidenav[right-side] .openbtn {
        right: 0;
        border-radius: 0.375rem 0 0 0.375rem;
      }
      wc-sidenav .openbtn span {
        writing-mode: vertical-rl;
        display: inline-block;
        line-height: 2;
      }
      wc-sidenav[open-vertical-text] .openbtn span {
        text-orientation: upright;
        letter-spacing: 2px;
      }
      wc-sidenav:not([open-vertical-text]) .openbtn span {
        text-orientation: sideways;
        letter-spacing: 4px;
      }
      wc-sidenav .openbtn:hover {
        background-color: var(--secondary-bg-color);
      }

      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: transparent;
        transition: background-color 0.5s ease;
      }
      .overlay.open {
        background-color: rgba(0,0,0,0.6);
        z-index: 1;
      }
    `;
    this.loadStyle('wc-sidenav-style', style);
  }


  _unWireEvents() {
    super._unWireEvents();
    const closeBtn = this.querySelector('.closebtn');
    closeBtn.removeEventListener('click', this._closeNav.bind(this));
    const openBtn = this.querySelector('.openbtn');
    openBtn.removeEventListener('click', this._openNav.bind(this));
  }

}

customElements.define('wc-sidenav', WcSidenav);
