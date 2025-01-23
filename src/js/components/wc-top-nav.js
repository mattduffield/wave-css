/**
 * 
 *  DEPRECATED!!
 * 
 *  Name: wc-top-nav
 *  Usage:
 *    <wc-top-nav id="top-nav"
 *      items='[{"name": "home", "label": "Home", "selected": true}, {"name": "news", "label": "News", "selected": false}, {"name": "contact", "label": "Contact", "selected": false}, {"name": "about", "label": "About", "selected": false}]'
 *    ></wc-top-nav>
 *    <wc-top-nav id="top-nav">
 *      <option value="home" selected>Home</option>
 *      <option value="news">News</option>
 *      <option value="contact">Contact</option>
 *      <option value="about">About</option>
 *    </wc-top-nav>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcTopNav extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'items'];
  }

  constructor() {
    super();
    this._items = [];
    const compEl = this.querySelector('.wc-top-nav');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-top-nav', 'row', 'justify-between');
      this.appendChild(this.componentElement);      
    }
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
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
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerParts = this.querySelectorAll('.wc-top-nav > *');
    if (innerParts.length > 0) {
      this.componentElement.innerHTML = '';
      innerParts.forEach(p => this.componentElement.appendChild(p));
    } else {
      this._moveDeclarativeOptions();
      this.componentElement.innerHTML = '';

      const menuDiv = document.createElement('div');
      menuDiv.classList.add('row');
      this._items.forEach(item => {
        const link = this._createAnchor(item.name, item.label, item.selected);
        menuDiv.appendChild(link);
      })
      const hamburgerDiv = document.createElement('div');
      hamburgerDiv.classList.add('row');
      const menuIcon = document.createElement('a');
      menuIcon.href = 'javascript:void(0);';
      menuIcon.classList.add('icon', 'row');
      menuIcon.id = 'menuIcon';
      menuIcon.innerHTML = `
          <svg class="h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
          </svg>
      `.trim();

      this.componentElement.appendChild(menuDiv);
      hamburgerDiv.appendChild(menuIcon);
      this.componentElement.appendChild(hamburgerDiv);      
    }

    this._setActiveLink();

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  _createAnchor(viewName, viewLabel, selected) {
    const el = document.createElement('a');
    // el.classList.add('row');
    if (selected) {
      el.classList.add('active');
    }
    el.dataset.name = viewName;
    el.textContent = viewLabel;
    el.setAttribute('href', `/static/views/${viewName}.html`);
    el.setAttribute('hx-get', `/static/views/${viewName}.html`);
    el.setAttribute('hx-trigger', 'click');
    el.setAttribute('hx-target', '#viewport');
    el.setAttribute('hx-swap', 'innerHTML transition:true');
    el.setAttribute('hx-push-url', `/static/views/${viewName}.html`);
    el.setAttribute('hx-select', '#page-contents');
    el.addEventListener('click', this._handleClick.bind(this));
    return el;
  }

  _applyStyle() {
    const style = `
    wc-top-nav {
      display: contents;
    }

    .wc-top-nav {
      position: relative;
      background-color: var(--secondary-bg-color);
      opacity: 0.75;
    }

    .wc-top-nav a {
      color: var(--secondary-color);
      text-align: center;
      padding: 14px 16px;
      text-decoration: none;
      font-size: 17px;
    }
    .wc-top-nav a svg {
      color: var(--secondary-color);
    }

    .wc-top-nav a:hover {
      background-color: var(--primary-bg-color);
      color: var(--primary-color);
    }

    .wc-top-nav a.active {
      background-color: var(--primary-bg-color);
      color: var(--primary-color);
      opacity: 1;
    }

    @media screen and (max-width: 600px) {
      .wc-top-nav a:not(:first-child) {display: none;}
      .wc-top-nav a.icon {
        float: right;
        display: block;
      }
    }

    @media screen and (max-width: 600px) {
      .wc-top-nav.responsive {position: relative;}
      .wc-top-nav.responsive .icon {
        position: absolute;
        right: 0;
        top: 0;
      }
      .wc-top-nav.responsive a {
        float: none;
        display: block;
        text-align: left;
      }
    }`.trim();
    this.loadStyle('wc-top-nav-style', style);
  }

  _unWireEvents() {
    super._unWireEvents();
    const anchors = this.querySelectorAll('.wc-top-nav a:not(.icon)');
    anchors.forEach(a => {
      a.removeEventListener('click', this._handleClick);
    });
  }

  _handleClick(e) {
    const {target} = e;
    const anchors = this.querySelectorAll('.wc-top-nav a:not(.icon)');
    anchors.forEach(a => a.classList.remove('active'));
    target.classList.add('active');
    // this.dataset.selected = target.name;
  }

  _moveDeclarativeOptions() {
    // const value = this.getAttribute('value', null);
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

  _setActiveLink() {
    const selectedName = this._getCurrentRoute();
    const anchors = this.querySelectorAll('.wc-top-nav a');
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

}

customElements.define('wc-top-nav', WcTopNav);
