/**
 * 
 *  Name: wc-menu
 *  Usage:
 *  <wc-menu id="menu">
 *    <option value="home" selected>Home</option>
 *    <option value="news">News</option>
 *    <option value="contact">Contact</option>
 *    <option value="about">About</option>
 *    <option value="sidebar">Sidebar</option>
 *    <option value="tab">Tab</option>
 *    <option value="menu">Menu</option>
 *  </wc-menu>
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-menu:click', ['[data-wc-id="e58b-dbed-4eb4-6776"]'], '[data-name="theme"]')
 *    wc.EventHub.broadcast('wc-menu:click', ['[data-wc-id="e58b-dbed-4eb4-6776"]'], '[data-name="accordion"]')
 *    wc.EventHub.broadcast('wc-menu:click', ['[data-wc-id="e58b-dbed-4eb4-6776"]'], '[data-name="form-states"]')
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcMenu extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'path', 'wrap'];
  }

  constructor() {
    super();
    this._items = [];
    // this.childComponentSelector = 'wc-menu-item';
    const compEl = this.querySelector('.wc-menu');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-menu');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-menu');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    this._wireEvents();
    console.log('connectedCallback:wc-menu');
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
    } else if (attrName === 'wrap') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-menu > *');
    if (innerEl) {
      // Do nothing...
      const links = this.querySelectorAll('.menu-link');
      links.forEach(link => link.addEventListener('click', this._handleClick.bind(this)));
      const menuIcon = this.querySelector('.menu-toggle');
      menuIcon.addEventListener('click', this._handleMenuToggle.bind(this));      
      this._setActiveLink();
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();

      this._setActiveLink();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-menu');
  }

  _createInnerElement() {
    this._moveDeclarativeOptions();

    const menuDiv = document.createElement('div');
    menuDiv.classList.add('menu-items');
    if (this.hasAttribute('wrap')) {
      menuDiv.classList.add('flex-wrap');
    }
    this._items.forEach(item => {
      const link = this._createAnchor(item.name, item.label, item.selected);
      menuDiv.appendChild(link);
    });
    const hamburgerDiv = document.createElement('div');
    hamburgerDiv.classList.add('menu-toggle');
    const menuIcon = document.createElement('a');
    menuIcon.href = 'javascript:void(0);';
    menuIcon.classList.add('icon', 'row');
    menuIcon.id = 'menuIcon';
    menuIcon.innerHTML = `
        <svg class="h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
        </svg>
    `.trim();
    menuIcon.addEventListener('click', this._handleMenuToggle.bind(this));

    this.componentElement.appendChild(menuDiv);
    hamburgerDiv.appendChild(menuIcon);
    this.componentElement.appendChild(hamburgerDiv);
  }

  _moveDeclarativeOptions() {
    const options = this.querySelectorAll('option');
    if (options.length > 0) {
      this._items = [];
    }
    options.forEach(option => {
      const item = {
        name: option.value,
        label: option.textContent.trim(),
        selected: option.hasAttribute('selected') || false
      };
      this._items.push(item);
    });
    Array.from(options).forEach(option => option.remove());
  }

  _createAnchor(viewName, viewLabel, selected) {
    const path = this.getAttribute('path') || '/static/views/';
    const el = document.createElement('a');
    el.classList.add('menu-link');
    if (selected) {
      el.classList.add('active');
    }
    el.dataset.name = viewName;
    el.textContent = viewLabel;
    el.setAttribute('href', `${path}${viewName}.html`);
    el.setAttribute('hx-get', `${path}${viewName}.html`);
    el.setAttribute('hx-trigger', 'click');
    el.setAttribute('hx-target', '#viewport');
    el.setAttribute('hx-swap', 'innerHTML transition:true');
    el.setAttribute('hx-push-url', `${path}${viewName}.html`);
    el.setAttribute('hx-select', '#page-contents');
    el.addEventListener('click', this._handleClick.bind(this));
    return el;
  }

  _setActiveLink() {
    const selectedName = this._getCurrentRoute();
    const anchors = this.querySelectorAll('.wc-menu a');
    if (selectedName) {
      anchors.forEach(anchor => {
        if (anchor.dataset.name === selectedName) {
          anchor.classList.add('active');
        } else {
          anchor.classList.remove('active');
        }
      });
    } else {
      if (anchors.length > 0) {
        anchors.forEach(anchor => anchor.classList.remove('active'));
        anchors[0].classList.add('active');
      }
    }
  }

  _getCurrentRoute() {
    // Get the current URL path, which could be "/static/views/home.html"
    const path = window.location.pathname;

    // Extract the last part of the URL (e.g., "home.html")
    const page = path.split('/').pop();

    // Remove the file extension (e.g., ".html")
    const pageWithoutExtension = page.split('.').shift();

    return pageWithoutExtension;
  }

  _handleHelper(event, mode='click') {
    const {detail} = event;
    const {selector, subSelector} = detail;
    const isArray = Array.isArray(selector);
    if (typeof selector === 'string' || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach(tgt => {
        if (tgt === this) {
          if (mode === 'click') {
            const menu = this.querySelector(subSelector);
            menu?.click();
          }
        }
      });
    } else {
      if (selector === this) {
        if (mode === 'click') {
          const menu = this.querySelector(subSelector);
          menu?.click();
        }
      }
    }
  }

  _handleOnClick(event) {
    this._handleHelper(event, 'click');
  }

  _handleClick(event) {
    const {target} = event;
    const anchors = this.querySelectorAll('.wc-menu a:not(.icon)');
    anchors.forEach(a => a.classList.remove('active'));
    target.classList.add('active');
  }

  _handleMenuToggle(event) {
    const {target} = event;
    target.classList.toggle('open');
    const menu = this.querySelector('wc-menu .wc-menu');
    menu.classList.toggle('open');
  }

  _applyStyle() {
    const style = `
      wc-menu {
        display: contents;
      }
      wc-menu .wc-menu {
        position: relative;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
      }
      wc-menu .wc-menu .menu-items {
        display: flex;
        flex-direction: row;
      }
      wc-menu .wc-menu a {
        color: var(--primary-color);
        text-align: center;
        padding: 14px 16px;
        text-decoration: none;
        font-size: 17px;
        opacity: 0.75;
        user-select: none;
      }
      wc-menu .wc-menu a:hover {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
        opacity: 1;
      }
      wc-menu .wc-menu a.active {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
        opacity: 1;
      }
      wc-menu .wc-menu a.icon {
        display: none;
      }
      @media (max-width: 600px) {
        wc-menu .wc-menu a:not(.active) {
          display: none;
        }
        wc-menu .wc-menu a.icon {
          display: block;
        }
      }
      @media (max-width: 600px) {
        wc-menu .wc-menu.open {
          position: relative;
        }
        wc-menu .wc-menu.open .menu-items {
          flex-direction: column;
          flex: 1 1 0%;
        }
        wc-menu .wc-menu.open a:active {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          opacity: 1;
        }
        wc-menu .wc-menu.open .icon {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          opacity: 1;
          position: absolute;
          right: 0;
          top: 0;
        }
        wc-menu .wc-menu.open a {
          float: none;
          display: block;
          text-align: left;
        }
      }
    `.trim();
    this.loadStyle('wc-menu-style', style);
  }

  _wireEvents() {
    super._wireEvents();

    document.body.addEventListener('wc-menu:click', this._handleOnClick.bind(this));
  }

  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener('wc-menu:click', this._handleOnClick.bind(this));
    const links = this.querySelectorAll('.menu-link');
    links.forEach(link => link.removeEventListener('click', this._handleClick.bind(this)));
    const menuIcon = this.querySelector('.menu-toggle');
    menuIcon.removeEventListener('click', this._handleMenuToggle.bind(this));
  }
}

customElements.define('wc-menu', WcMenu);
