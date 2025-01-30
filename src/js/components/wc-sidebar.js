/**
 * 
 *  Name: wc-sidebar
 *  Usage:
 *  <wc-sidebar class="theme-midnight-blue dark">
 *    <a href="#">About</a>
 *    <a href="#">Services</a>
 *    <a href="#">Clients</a>
 *    <a href="#">Contact</a>
 *  </wc-sidebar>
 * 
 *  <wc-sidebar width="200px" background-color="#111" right-side>
 *    <a href="#">About</a>
 *    <a href="#">Services</a>
 *    <a href="#">Clients</a>
 *    <a href="#">Contact</a>
 *  </wc-sidebar>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcSidebar extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'width', 'push-target', 'right-side', 'auto-height', 'background-color'];
  }

  constructor() {
    super();
    if (!this.hasAttribute('right-side')) {
      this.setAttribute('left-side', '');
    }
    const compEl = this.querySelector('.wc-sidebar');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-sidebar');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-sidebar');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-sidebar');
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
    } else if (attrName === 'push-target') {
      // Do nothing...
    } else if (attrName === 'right-side') {
      // Do nothing...
    } else if (attrName === 'width') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-sidebar > *');
    if (innerEl) {
      // Do nothing...
      const pushSelector = this.getAttribute('push-target') || 'body';
      const pushTarget = document.querySelector(pushSelector);
      const isRight = this.hasAttribute('right-side');
      const width = this.getAttribute('width') || '150px';
      if (pushTarget) {
        if (isRight) {
          pushTarget.style.marginRight = width;
        } else {
          pushTarget.style.marginLeft = width;
        }
      }
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-sidebar');
  }

  _createInnerElement() {
    const parts = this.querySelectorAll('wc-sidebar > *:not(.wc-sidebar');
    parts.forEach(p => this.componentElement.appendChild(p));
    const autoHeight = this.hasAttribute('auto-height');
    if (autoHeight) {
      this.componentElement.style.height = 'auto';
    } else {
      this.componentElement.style.height = '100%';
    }
    const pushSelector = this.getAttribute('push-target') || 'body';
    const isRight = this.hasAttribute('right-side');
    const width = this.getAttribute('width') || '150px';
    if (this.hasAttribute('background-color')) {
      // const body = document.body;
      // const bgColor = getComputedStyle(body).getPropertyValue('--background-color').trim();
      const bgColor = this.getAttribute('background-color');
      this.componentElement.style.setProperty('--background-color', bgColor);
    }
    this.componentElement.style.width = width;
    if (pushSelector) {
      const pushTarget = document.querySelector(pushSelector);
      if (pushTarget) {
        pushTarget.style.setProperty('transition', 'margin-left 0.5s ease, margin-right 0.5s ease');
        if (isRight) {
          pushTarget.style.marginRight = width;
        } else {
          pushTarget.style.marginLeft = width;
        }
      }
    }
  }

  _applyStyle() {
    const style = `
      wc-sidebar {
        display: contents;
      }
      wc-sidebar .wc-sidebar {
        /* height: 100%; */
        position: fixed;
        z-index: 1;
        top: 0;
        background-color: var(--bg-color);
        overflow-x: hidden;
        padding-top: 20px;
        padding-bottom: 20px;
      }
      wc-sidebar[left-side] .wc-sidebar {
        left: 0;
      }
      wc-sidebar[right-side] .wc-sidebar {
        right: 0;
      }

      wc-sidebar .wc-sidebar a {
        padding: 6px 8px 6px 16px;
        text-decoration: none;
        font-size: 25px;
        color: var(--text-5);
        display: block;
      }

      wc-sidebar .wc-sidebar a:hover {
        color: var(--text-1);
      }
    `;
    this.loadStyle('wc-sidebar-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
    const pushSelector = this.getAttribute('push-target') || 'body';
    const pushTarget = document.querySelector(pushSelector);
    const isRight = this.hasAttribute('right-side');
    if (pushTarget) {
      if (isRight) {
        pushTarget.style.marginRight = '0';
      } else {
        pushTarget.style.marginLeft = '0';
      }
    }
  }
}

customElements.define('wc-sidebar', WcSidebar);
