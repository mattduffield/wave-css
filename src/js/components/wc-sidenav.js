/**
 *
 *  Name: wc-sidenav
 *  Usage:
 *    <!-- Default: Fixed positioning (global/full screen) -->
 *    <wc-sidenav class="mb-4" open-top="48px" open-vertical-text width="200px">
 *      <a href="#">About</a>
 *      <a href="#">Services</a>
 *      <a href="#">Clients</a>
 *      <a href="#">Contact</a>
 *    </wc-sidenav>
 *
 *    <wc-sidenav class="mb-4" open-top="48px" push push-target="#viewport">
 *      <a href="#">About</a>
 *      <a href="#">Services</a>
 *      <a href="#">Clients</a>
 *      <a href="#">Contact</a>
 *    </wc-sidenav>
 *
 *    <wc-sidenav class="mb-4" open-top="48px" width="100%" overlay>
 *      <a href="#">About</a>
 *      <a href="#">Services</a>
 *      <a href="#">Clients</a>
 *      <a href="#">Contact</a>
 *    </wc-sidenav>
 *
 *    <!-- NEW: Relative positioning (scoped to parent container) -->
 *    <!-- Parent container must have: position: relative, overflow: hidden -->
 *    <div class="relative overflow-hidden h-screen">
 *      <wc-sidenav relative push push-target=".content" width="250px" overlay>
 *        <a href="#">About</a>
 *        <a href="#">Services</a>
 *        <a href="#">Clients</a>
 *        <a href="#">Contact</a>
 *      </wc-sidenav>
 *      <div class="content">
 *        <!-- Your content here - will be pushed when sidenav opens -->
 *      </div>
 *    </div>
 *
 *    <!-- Relative mode with right side -->
 *    <div class="relative overflow-hidden h-96">
 *      <wc-sidenav relative right-side push push-target=".content" width="200px">
 *        <a href="#">Link 1</a>
 *        <a href="#">Link 2</a>
 *      </wc-sidenav>
 *      <div class="content">
 *        <!-- Content -->
 *      </div>
 *    </div>
 *
 *  Attributes:
 *    - relative: Enable relative positioning mode (scoped to parent container)
 *    - push: Push content when opening (requires push-target)
 *    - push-target: CSS selector for element to push (default: "#viewport")
 *    - overlay: Show overlay when open
 *    - width: Width of sidenav (default: "250px")
 *    - open-top: Top position for open button
 *    - right-side: Position on right side (default is left)
 *    - open-vertical-text: Use upright vertical text in open button
 *
 *  API:
 *    wc.EventHub.broadcast('wc-sidenav:open', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wc-sidenav:close', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wc-sidenav:toggle', ['[data-wc-id="0982-a544-98da-b3da"]'])
 */


import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-sidenav')) {
  class WcSidenav extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'label', 'width', 'open-btn-class', 'open', 'open-top', 'open-vertical-text', 'push', 'push-target', 'overlay', 'background-color', 'auto-height', 'relative'];
    }

    constructor() {
      super();

      // Bind methods once to maintain function references
      this._boundCloseNav = this._closeNav.bind(this);
      this._boundToggleNav = this._toggleNav.bind(this);
      this._boundHandleOpen = this._handleOpen.bind(this);
      this._boundHandleClose = this._handleClose.bind(this);
      this._boundHandleToggle = this._handleToggle.bind(this);

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
        this.appendChild(this.componentElement);
        if (isOpen) {
          this._openNav({target:null});
          // this.componentElement.classList.add('open');
        }
      }
      // console.log('ctor:wc-sidenav');
    }

    async connectedCallback() {
      super.connectedCallback();

      this._applyStyle();
      this._wireEvents();
      // console.log('connectedCallback:wc-sidenav');
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
      } else if (attrName === 'open-btn-class') {
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
      } else if (attrName === 'relative') {
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
        closeBtn.addEventListener('click', this._boundCloseNav);
        const openBtn = this.querySelector('.openbtn');
        openBtn.addEventListener('click', this._boundToggleNav);
      } else {
        this.componentElement.innerHTML = '';
        this._createInnerElement();
      }

      if (typeof htmx !== 'undefined') {
        htmx.process(this);
      }
      // console.log('_render:wc-sidenav');
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
        const bgColor = this.getAttribute('background-color');
        this.componentElement.style.setProperty('--background-color', bgColor);
      }

      const lbl = this.getAttribute('label') || 'Sidenav';
      const closeBtn = document.createElement('div');
      const closeBtnCss = this.getAttribute('close-btn-css') || 'primary-bg-color text-sm w-5 h-5 rounded-full';
      closeBtn.setAttribute('class', `closebtn cursor-pointer ${closeBtnCss}`);
      closeBtn.innerHTML = '&times;';
      closeBtn.addEventListener('click', this._boundCloseNav);
      this.componentElement.appendChild(closeBtn);
      const openBtn = document.createElement('div');
      const openBtnCss = this.getAttribute('open-btn-css') || 'primary-bg-color text-xs px-2 py-3';
      openBtn.setAttribute('class', `openbtn cursor-pointer ${openBtnCss}`);
      openBtn.style.top = this.getAttribute('open-top') || '0';
      openBtn.addEventListener('click', this._boundToggleNav);
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

    _handleHelper(event, btnSelector) {
      const {detail} = event;
      const {selector} = detail;
      const isArray = Array.isArray(selector);
      if (typeof selector === 'string' || isArray) {
        const tgts = document.querySelectorAll(selector);
        tgts.forEach(tgt => {
          if (tgt === this) {
            if (btnSelector === 'toggle') {
              const side = this.querySelector('.wc-sidenav');
              if (side.classList.contains('open')) {
                btnSelector = '.closebtn';
              } else {
                btnSelector = '.openbtn';
              }
            }
            const btn = tgt?.querySelector(btnSelector);
            btn?.click();
          }
        });      
      } else {
        const btn = selector?.querySelector(btnSelector);
        btn?.click();
      }    
    }

    _handleOpen(event) {
      this._handleHelper(event, '.openbtn');
    }

    _handleClose(event) {
      this._handleHelper(event, '.closebtn');
    }

    _handleToggle(event) {
      this._handleHelper(event, 'toggle');
    }

    _toggleNav(event) {
      const side = this.querySelector('.wc-sidenav');
      if (side && side.classList.contains('open')) {
        this._closeNav(event);
      } else {
        this._openNav(event);
      }
    }

    _openNav(event) {
      const width = this.getAttribute('width') || '250px';
      const pushSelector = this.getAttribute('push-target') || '#viewport';
      const side = this.querySelector('.wc-sidenav');
      const openBtn = this.querySelector('.openbtn');
      const isRight = this.hasAttribute('right-side');

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
      } else {
        // Only move the open button if NOT pushing content
        if (openBtn) {
          if (isRight) {
            openBtn.style.transform = `translateX(-${width})`;
          } else {
            openBtn.style.transform = `translateX(${width})`;
          }
        }
      }

      // Dispatch custom event
      this.dispatchEvent(new CustomEvent('sidenav:opened', {
        bubbles: true,
        composed: true,
        detail: { width }
      }));
    }

    _closeNav(event) {
      const pushSelector = this.getAttribute('push-target') || '#viewport';
      const side = this.querySelector('.wc-sidenav');
      const openBtn = this.querySelector('.openbtn');
      const isRight = this.hasAttribute('right-side');

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
      } else {
        // Only move the open button back if NOT pushing content
        if (openBtn) {
          openBtn.style.transform = 'translateX(0)';
        }
      }

      // Dispatch custom event
      this.dispatchEvent(new CustomEvent('sidenav:closed', {
        bubbles: true,
        composed: true
      }));
    }

    _applyStyle() {
      const style = `
        wc-sidenav {
          --background-color: var(--primary-bg-color);
          display: contents;
        }
        /* Default mode: Fixed positioning (global/full screen) */
        wc-sidenav:not([relative]) .wc-sidenav.sidenav {
          /* height: 100%; */
          width: 0;
          position: fixed;
          z-index: 2;
          top: 0;
          background-color: var(--background-color);
          overflow-x: hidden;
          transition: 0.5s;
        }
        /* Relative mode: Absolute positioning (scoped to parent container) */
        wc-sidenav[relative] .wc-sidenav.sidenav {
          width: 0;
          position: absolute;
          z-index: 2;
          top: 0;
          bottom: 0;
          height: 100%;
          background-color: var(--background-color);
          overflow-x: hidden;
          transition: 0.5s;
        }
        wc-sidenav[left-side] .wc-sidenav.sidenav {
          left: 0;
        }
        wc-sidenav[right-side] .wc-sidenav.sidenav {
          right: 0;
        }
        /*
        wc-sidenav .wc-sidenav.sidenav a {
          text-decoration: none;
          color: var(--button-color);
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
        */
        wc-sidenav .wc-sidenav.sidenav a:hover {
          color: var(--button-hover-color);
        }
        wc-sidenav .wc-sidenav.sidenav .closebtn {
          position: absolute;
          top: 5px;
          text-align: center;
          z-index: 3;
        }
        wc-sidenav[left-side] .wc-sidenav.sidenav .closebtn {
          right: 5px;
        }
        wc-sidenav[right-side] .wc-sidenav.sidenav .closebtn {
          left: 5px;
        }
        wc-sidenav .openbtn {
          position: absolute;
          z-index: 2;
          transition: transform 0.5s ease;
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
          /* line-height: 2; */
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
          background-color: var(--button-hover-bg-color);
        }

        /* Default mode: Fixed overlay (covers entire viewport) */
        wc-sidenav:not([relative]) .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: transparent;
          transition: background-color 0.5s ease;
        }
        wc-sidenav:not([relative]) .overlay.open {
          background-color: rgba(0,0,0,0.6);
          z-index: 1;
        }

        /* Relative mode: Absolute overlay (scoped to parent container) */
        wc-sidenav[relative] .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: transparent;
          transition: background-color 0.5s ease;
        }
        wc-sidenav[relative] .overlay.open {
          background-color: rgba(0,0,0,0.6);
          z-index: 1;
        }
      `;
      this.loadStyle('wc-sidenav-style', style);
    }

    _wireEvents() {
      super._wireEvents();

      document.body.addEventListener('wc-sidenav:open', this._boundHandleOpen);
      document.body.addEventListener('wc-sidenav:close', this._boundHandleClose);
      document.body.addEventListener('wc-sidenav:toggle', this._boundHandleToggle);
    }

    _unWireEvents() {
      super._unWireEvents();
      const closeBtn = this.querySelector('.closebtn');
      if (closeBtn) {
        closeBtn.removeEventListener('click', this._boundCloseNav);
      }
      const openBtn = this.querySelector('.openbtn');
      if (openBtn) {
        openBtn.removeEventListener('click', this._boundToggleNav);
      }
      document.body.removeEventListener('wc-sidenav:open', this._boundHandleOpen);
      document.body.removeEventListener('wc-sidenav:close', this._boundHandleClose);
      document.body.removeEventListener('wc-sidenav:toggle', this._boundHandleToggle);
    }

  }

  customElements.define('wc-sidenav', WcSidenav);
}