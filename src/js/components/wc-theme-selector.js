/**
 * 
 *  Name: wc-theme-selector
 *  Usage:
 *    <wc-theme-selector class="mb-4" open-top="48px" open-vertical-text width="200px">
 *      <a href="#">About</a>
 *      <a href="#">Services</a>
 *      <a href="#">Clients</a>
 *      <a href="#">Contact</a>
 *    </wc-theme-selector>
 * 
 *    <wc-theme-selector class="mb-4" open-top="48px" push>
 *      <a href="#">About</a>
 *      <a href="#">Services</a>
 *      <a href="#">Clients</a>
 *      <a href="#">Contact</a>
 *    </wc-theme-selector>
 * 
 *    <wc-theme-selector class="mb-4" open-top="48px" width="100%">
 *      <a href="#">About</a>
 *      <a href="#">Services</a>
 *      <a href="#">Clients</a>
 *      <a href="#">Contact</a>
 *    </wc-theme-selector>
 * 
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcThemeSelector extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'theme', 'mode'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-theme-selector');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-theme-selector');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-theme-selector');
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log('connectedCallback:wc-theme-selector');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {    
    if (attrName === 'theme') {
      const themeButton = this.componentElement.querySelector(`button[data-theme="${newValue}"]`);
      themeButton?.click();
    } else if (attrName === 'mode') {
      const themeModeButton = this.componentElement.querySelector(`button[data-theme-mode="${newValue}"]`);
      themeModeButton?.click();    
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-theme-selector > *');
    if (innerEl) {
      // Do nothing...
      const themeModeBtns = this.componentElement.querySelectorAll('button[data-theme-mode]');
      themeModeBtns.forEach(btn => btn.addEventListener('click', this._handleThemeModeClick.bind(this)));
      const themeBtns = this.componentElement.querySelectorAll('button[data-theme]');
      themeBtns.forEach(btn => btn.addEventListener('click', this._handleThemeClick.bind(this)));
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-theme-selector');
  }

  _createInnerElement() {
    const themes = [
      "theme-coral-sunset",
      "theme-rose-gold",
      "theme-autumn-leaves",
      "theme-purple-haze",
      "theme-lavender-fields",
      "theme-dracula",
      "theme-midnight-blue",
      "theme-royal-blue",
      "theme-light",
      "theme-dark",
      "theme-solarized",
      "theme-ocean-blue",
      "theme-nord",
      "theme-emerald-mist",
      "theme-forest-green",
      "theme-spring-meadow",
      "theme-mint-fresh",
      "theme-lemon-twist",
      "theme-golden-sun",
      "theme-warm-autumn",
      "theme-burnt-orange",
      "theme-taupe-dream",
      "theme-sandy-dune",
      "theme-steel-gray",
      "theme-slate-storm",
      "theme-cool-gray",
      "theme-midnight-slate",
      "theme-midnight",
      "theme-day"
    ];
    const themeModes = [
      {"theme": "theme-midnight", "mode": "dark"},
      {"theme": "theme-day", "mode": "light"},
    ];
    const template = document.createElement('template');
      template.innerHTML = `
      <div class="row flex-wrap">
        ${themes.map(theme => `
          <button class="flat h-10 w-10 rounded-t-md ${theme}" type="button" data-theme="${theme}" title="${theme}">
            <svg class="selectmark h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
            </svg>
          </button>
          `.trim()).join('')}
      </div>
      <div class="row">
        ${themeModes.map(item => `
          <button class="flat h-10 w-10 ${item.theme}" type="button" data-theme-mode="${item.mode}">
            <svg class="selectmark h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
            </svg>
          </button>
          `.trim()).join('')}
      </div>
      `.trim();
      this.componentElement.appendChild(template.content.cloneNode(true));
      this._wireEvents();
  }

  _applyStyle() {
    const style = `
      wc-theme-selector .wc-theme-selector {

      }

      wc-theme-selector .wc-theme-selector .selectmark {
        pointer-events: none;
      }
    `;
    this.loadStyle('wc-theme-selector-style', style);
  }

  _handleThemeClick(event) {
    const {target} = event;
    const themeBtns = this.componentElement.querySelectorAll('button[data-theme]');
    const selectedTheme = target.getAttribute('data-theme');
    this.setAttribute('theme', selectedTheme);
    // Remove "selected" class from all buttons
    themeBtns.forEach(btn => btn.classList.remove('selected'));        
    // Add "selected" class to the clicked button
    target.classList.add('selected');        
    // Remove any current theme classes
    document.body.classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        document.body.classList.remove(cls);
      }
    });
    // const oldTheme = document.body.dataset.theme || selectedTheme;
    // if (oldTheme) {
    //   document.body.classList.remove(oldTheme);
    // }
    document.body.dataset.theme = selectedTheme;
    // Add the selected theme class to the body
    document.body.classList.add(selectedTheme);
  }

  _handleThemeModeClick(event) {
    const {target} = event;
    const themeModeBtns = this.componentElement.querySelectorAll('button[data-theme-mode]');
    const selectedMode = target.getAttribute('data-theme-mode');
    this.setAttribute('mode', selectedMode);
    // Remove "selected" class from all buttons
    themeModeBtns.forEach(btn => btn.classList.remove('selected'));        
    // Add "selected" class to the clicked button
    target.classList.add('selected');        
    // Remove any current theme classes
    const oldMode = document.body.dataset.themeMode || selectedMode;
    if (oldMode) {
      document.body.classList.remove(oldMode);
    }
    document.body.dataset.themeMode = selectedMode;
    // Add the selected theme class to the body
    document.body.classList.add(selectedMode);    
  }

  _wireEvents() {
    super._wireEvents();
    const themeModeBtns = this.componentElement.querySelectorAll('button[data-theme-mode]');
    themeModeBtns.forEach(btn => btn.addEventListener('click', this._handleThemeModeClick.bind(this)));
    const themeBtns = this.componentElement.querySelectorAll('button[data-theme]');
    themeBtns.forEach(btn => btn.addEventListener('click', this._handleThemeClick.bind(this)));
  }

  _unWireEvents() {
    super._unWireEvents();
    const themeModeBtns = this.componentElement.querySelectorAll('button[data-theme-mode]');
    themeModeBtns.forEach(btn => btn.removeEventListener('click', this._handleThemeModeClick.bind(this)));
    const themeBtns = this.componentElement.querySelectorAll('button[data-theme]');
    themeBtns.forEach(btn => btn.removeEventListener('click', this._handleThemeClick.bind(this)));    
  }

}

customElements.define('wc-theme-selector', WcThemeSelector);
