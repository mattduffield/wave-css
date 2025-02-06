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
    return ['id', 'class', 'label', 'mode', 'format'];
  }

  constructor() {
    super();
    this.childComponentSelector = 'a,hr,wc-input';
    this.classList.add('contents');
    this.clickModes = ['search', 'click'];
    this.mode = this.getAttribute('mode') || 'click';
    const compEl = this.querySelector('.wc-dropdown');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-dropdown', this.mode);
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
    const parts = Array.from(this.children).filter(p => !p.matches('wc-dropdown') && !p.matches('.wc-dropdown')); // Exclude nested wc-tab elements

    const id = this.getAttribute('id') || '';
    const positionArea = this.getAttribute('position-area') || 'bottom span-left';
    const positionTryFallbacks = this.getAttribute('position-try-fallbacks') || '--bottom-right, --bottom-left, --top-right, --top-left, --right, --left';    
    const lbl = this.getAttribute('label') || '';
    const format = this.getAttribute('format') || 'standard';
    const dropdownHeight = this.getAttribute('dropdown-height') || '';
    const btn = document.createElement('button');    
    if (lbl && format === 'standard') {
      btn.classList.add('dropbtn');
      btn.textContent = lbl;
    } else {
      if (format === 'grid-round') {
        btn.classList.add('dropbtn');
        btn.classList.add('grid-round');
        btn.innerHTML = `
          <svg class="h-5 w-5 align-middle pointer-events-none"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M128 96A64 64 0 1 1 0 96a64 64 0 1 1 128 0zm0 160A64 64 0 1 1 0 256a64 64 0 1 1 128 0zM64 480a64 64 0 1 1 0-128 64 64 0 1 1 0 128zM288 96A64 64 0 1 1 160 96a64 64 0 1 1 128 0zM224 320a64 64 0 1 1 0-128 64 64 0 1 1 0 128zm64 96a64 64 0 1 1 -128 0 64 64 0 1 1 128 0zm96-256a64 64 0 1 1 0-128 64 64 0 1 1 0 128zm64 96a64 64 0 1 1 -128 0 64 64 0 1 1 128 0zM384 480a64 64 0 1 1 0-128 64 64 0 1 1 0 128z"/>
          </svg>
        `;  
      } else if (format === 'avatar') {
        btn.classList.add('dropbtn');
        btn.classList.add('avatar');
        btn.innerHTML = `
          <svg class="h-4 w-4 align-middle pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        `;  
      }
    }
    const dropdown = document.createElement('div');
    dropdown.classList.add('dropdown');
    const dropdownContent = document.createElement('div');
    dropdownContent.classList.add('dropdown-content', 'text-sm');
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
      svg.classList.add('search-svg', 'h-4', 'w-4', 'component');
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('d', 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z');
      svg.appendChild(path);      
      dropdownContent.appendChild(svg);
      ipt.addEventListener('input', this._handleInput.bind(this));
    }
    parts.forEach(p => dropdownContent.appendChild(p));
    dropdown.appendChild(dropdownContent);
    dropdown.append(btn);
    this.componentElement.append(dropdown);
    if (dropdownHeight) {
      dropdownContent.style.height = dropdownHeight;
      dropdownContent.style.overflow = 'auto';
    }
    if (this.clickModes.includes(this.mode)) {
      btn.addEventListener('click', this._handleClick.bind(this));
      window.addEventListener('click', this._handleWindowClick.bind(this));
    }

    const wcDropdown = this.querySelector('.wc-dropdown');
    wcDropdown.style.anchorName = `--${id}-anchor`;
    const drpContent = this.querySelector('.wc-dropdown .dropdown-content');
    drpContent.style.positionAnchor = `--${id}-anchor`;
    drpContent.style.positionArea = positionArea;
    drpContent.style.positionTryFallbacks = positionTryFallbacks;
    drpContent.style.minWidth = `${wcDropdown.offsetWidth}px`;    
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
    const haltElt = target.closest('.halt-event');
    if (haltElt) return;
    const parts = this.querySelectorAll('.wc-dropdown');
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
      wc-dropdown {
        display: contents;
      }

      .wc-dropdown {
        display: flex;
        flex-direction: row;
      }

      /* Dropdown Button */
      .wc-dropdown .dropbtn {
        background-color: var(--button-bg-color);
        color: var(--button-color);
        padding: 16px;
        font-size: 16px;
        border: none;
        border-radius: 0;
      }
      .wc-dropdown .dropbtn.grid-round {
        background-color: transparent;
        padding: 4px;
      }
      .wc-dropdown .dropbtn.avatar {
        padding: 6px;
        border-radius: 50%;
        font-size: 0.825rem;
      }

      /* The container <div> - needed to position the dropdown content */
      .wc-dropdown .dropdown {
      }

      /* Dropdown Content (Hidden by Default) */
      .wc-dropdown .dropdown-content {
        display: none;
        position: absolute;
        background-color: var(--button-hover-bg-color);
        min-width: 160px;
        max-width: 250px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
      }

      .wc-dropdown .search {
        width: 100%;
        box-sizing: border-box;
        font-size: 12px;
        padding: 14px 20px 12px 35px;
        border-radius: 0;
      }
      .wc-dropdown .dropdown-content svg.search-svg {
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
      /* .wc-dropdown .dropdown-content .wc-input, */
      .wc-dropdown .dropdown-content a {
        color: var(--component-color);
        padding: 12px 16px;
        text-decoration: none;
        display: block;
      }

      /* Change color of dropdown links on hover */
      /* .wc-dropdown .dropdown-content .wc-input:hover, */
      .wc-dropdown .dropdown-content a:hover {
        background-color: var(--component-border-color);
      }

      /* Show the dropdown menu on hover */
      .wc-dropdown:hover:not(.click):not(.search) .dropdown .dropdown-content {
        display: block;
      }
      .wc-dropdown.show .dropdown .dropdown-content {
        display: block;
      }

      /* Change the background color of the dropdown button when the dropdown content is shown */
      .wc-dropdown:hover:not(.click):not(.search) .dropdown .dropbtn {
        background-color: var(--button-hover-bg-color);
      }
      .wc-dropdown.show .dropdown .dropbtn {
        background-color: var(--button-hover-bg-color);
      }

      @position-try --bottom-left {
        position-area: bottom span-left;
      }
      @position-try --bottom-right {
        position-area: bottom span-right;
      }
      @position-try --top-left {
        position-area: top span-left;
      }
      @position-try --top-right {
        position-area: top span-right;
      }
      @position-try --right {
        position-area: right;
      }
      @position-try --left {
        position-area: left;
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
