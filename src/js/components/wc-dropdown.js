/**
 * 
 *  Name: wc-dropdown
 *  Usage:
 *    <wc-dropdown class="mb-4">
 *      <a href="#">Link 1</a>
 *      <a href="#">Link 2</a>
 *      <a href="#">Link 3</a>
 *    </wc-dropdown>
 * 
 *    <wc-dropdown class="mb-4" hover-mode>
 *      <a href="#">Link 1</a>
 *      <a href="#">Link 2</a>
 *      <a href="#">Link 3</a>
 *    </wc-dropdown>
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-dropdown:open', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wc-dropdown:close', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wc-dropdown:toggle', ['[data-wc-id="0982-a544-98da-b3da"]'])
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcDropdown extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'label', 'mode'];
  }

  constructor() {
    super();
    this.clickModes = ['search', 'click'];
    this.mode = this.getAttribute('mode') || 'click';
    const compEl = this.querySelector('.wc-dropdown');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-dropdown', 'dropdown', this.mode);
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-dropdown');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    this._wireEvents();
    console.log('connectedCallback:wc-dropdown');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {    
    if (attrName === 'label') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-dropdown > *');
    if (innerEl) {
      const btn = this.querySelector('.dropbtn');
      if (this.clickModes.includes(this.mode)) {
        btn.addEventListener('click', this._handleClick.bind(this));
        window.addEventListener('click', this._handleWindowClick.bind(this));  
        const ipt = this.querySelector('.search');
        if (ipt) {
          ipt.addEventListener('input', this._handleInput.bind(this));
        }
      }
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-dropdown');
  }

  _createInnerElement() {
    const lbl = this.getAttribute('label') || 'Dropdown';
    const btn = document.createElement('button');    
    btn.classList.add('dropbtn');
    btn.textContent = lbl;
    this.componentElement.appendChild(btn);
    const dropdownContent = document.createElement('div');
    dropdownContent.classList.add('dropdown-content');
    if (this.mode === 'search') {
      const ipt = document.createElement('input');
      ipt.classList.add('search', 'component');
      ipt.type = 'search';
      ipt.setAttribute('placeholder', 'Search...');
      dropdownContent.appendChild(ipt);
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('xmlns', svgNS);
      svg.setAttribute('fill', 'none');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('stroke-width', '1.5');
      svg.setAttribute('stroke', 'currentColor');
      svg.classList.add('h-4', 'w-4', 'component');
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('d', 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z');
      svg.appendChild(path);      
      dropdownContent.appendChild(svg);
      ipt.addEventListener('input', this._handleInput.bind(this));
    }
    const parts = this.querySelectorAll('a');
    parts.forEach(p => dropdownContent.appendChild(p));
    this.componentElement.appendChild(dropdownContent);
    if (this.clickModes.includes(this.mode)) {
      btn.addEventListener('click', this._handleClick.bind(this));
      window.addEventListener('click', this._handleWindowClick.bind(this));
    }
  }

  _handleHelper(event, mode='open') {
    const {detail} = event;
    const {selector} = detail;
    const triggerSelector = '.wc-dropdown';
    const isArray = Array.isArray(selector);
    if (typeof selector === 'string' || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach(tgt => {
        if (tgt === this) {
          const elt = tgt?.querySelector(triggerSelector);
          if (mode === 'open') {
            elt?.classList.add('show');
          } else if (mode === 'close') {
            elt?.classList.remove('show');
          } else if (mode === 'toggle') {
            elt?.classList.toggle('show');
          }
        }
      });
    } else {
      const elt = selector?.querySelector(triggerSelector);
      if (mode === 'open') {
        elt?.classList.add('show');
      } else if (mode === 'close') {
        elt?.classList.remove('show');
      } else if (mode === 'toggle') {
        elt?.classList.toggle('show');
      }
    }
  }

  _handleOpen(event) {
    this._handleHelper(event, 'open');
  }

  _handleClose(event) {
    this._handleHelper(event, 'close');
  }

  _handleToggle(event) {
    this._handleHelper(event, 'toggle');
  }

  _handleClick(event) {
    const {target} = event;
    const parent = target.closest('.wc-dropdown');
    parent.classList.toggle('show');
  }

  _handleWindowClick(event) {
    const {target} = event;
    if (target.matches('.dropbtn') || target.matches('.search')) return;
    const parts = this.querySelectorAll('.dropdown');
    parts.forEach(p => p.classList.remove('show'));
  }

  _handleInput(event) {
    const {target} = event;
    const filter = target.value.toLowerCase();
    const parts = this.querySelectorAll('.dropdown-content > *:not(.component)');
    parts.forEach(p => {
      if (p.textContent.toLowerCase().includes(filter)) {
        p.style.display = "block";
      } else {
        p.style.display = "none";
      }
    });
  }

  _applyStyle() {
    const style = `
      /* Dropdown Button */
      .wc-dropdown .dropbtn {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
        padding: 16px;
        font-size: 16px;
        border: none;
        border-radius: 0;
      }

      /* The container <div> - needed to position the dropdown content */
      .wc-dropdown.dropdown {
        position: relative;
        display: inline-block;
      }

      /* Dropdown Content (Hidden by Default) */
      .wc-dropdown .dropdown-content {
        display: none;
        position: absolute;
        background-color: var(--component-bg-color);
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
      }

      .wc-dropdown .search {
        width: 100%;
        box-sizing: border-box;
        font-size: 12px;
        padding: 14px 20px 12px 35px;
      }
      .wc-dropdown svg {
        position: absolute;
        left: 8px;
        top: 20px;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        stroke: var(--component-color);
        pointer-events: none;
      }

      /* Links inside the dropdown */
      .wc-dropdown .dropdown-content a {
        color: var(--component-color);
        padding: 12px 16px;
        text-decoration: none;
        display: block;
      }

      /* Change color of dropdown links on hover */
      .wc-dropdown .dropdown-content a:hover {
        background-color: var(--component-border-color);
      }

      /* Show the dropdown menu on hover */
      .wc-dropdown.dropdown:hover:not(.click):not(.search) .dropdown-content {
        display: block;
      }
      .wc-dropdown.dropdown.show .dropdown-content {
        display: block;
      }

      /* Change the background color of the dropdown button when the dropdown content is shown */
      .wc-dropdown.dropdown:hover:not(.click):not(.search) .dropbtn {
        background-color: var(--secondary-bg-color);
      }
      .wc-dropdown.dropdown.show .dropbtn {
        background-color: var(--secondary-bg-color);
      }
    `.trim();
    this.loadStyle('wc-dropdown-style', style);
  }

  _wireEvents() {
    super._wireEvents();

    if (this.clickModes.includes(this.mode)) {
      document.body.addEventListener('wc-dropdown:open', this._handleOpen.bind(this));
      document.body.addEventListener('wc-dropdown:close', this._handleClose.bind(this));
      document.body.addEventListener('wc-dropdown:toggle', this._handleToggle.bind(this));
    }
  }

  _unWireEvents() {
    super._unWireEvents();

    if (this.clickModes.includes(this.mode)) {
      document.body.removeEventListener('wc-dropdown:open', this._handleOpen.bind(this));
      document.body.removeEventListener('wc-dropdown:close', this._handleClose.bind(this));
      document.body.removeEventListener('wc-dropdown:toggle', this._handleToggle.bind(this));

      const btn = this.querySelector('.dropbtn');
      btn.removeEventListener('click', this._handleClick.bind(this));
      window.removeEventListener('click', this._handleWindowClick.bind(this));
      const ipt = this.querySelector('.search');
      if (ipt) {
        ipt.removeEventListener('input', this._handleInput.bind(this));
      }
    }
  }

}

customElements.define('wc-dropdown', WcDropdown);
