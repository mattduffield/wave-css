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
    this.prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;

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
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-theme-selector > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    this._wireEvents();

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-theme-selector');
  }

  _createInnerElement() {
    const themes = [
      "theme-rose",
      "theme-petal",
      "theme-sunset",
      "theme-peach",
      "theme-fire",
      "theme-desert",
      "theme-golden",
      "theme-honey",
      "theme-amber",
      "theme-olive",
      "theme-moss",
      "theme-avocado",
      "theme-lime",
      "theme-fern",
      "theme-yellow",
      "theme-meadow",
      "theme-cornsilk",
      "theme-sage",
      "theme-forest",
      "theme-jungle",
      "theme-emerald",
      "theme-mint",
      "theme-turquoise",
      "theme-aqua",
      "theme-lagoon",
      "theme-ice",
      "theme-ocean",
      "theme-azure",
      "theme-sky",
      "theme-midsky",
      "theme-deepsky",
      "theme-royal",
      "theme-twilight",
      "theme-lavender",
      "theme-violet",
      "theme-grape",
      "theme-plum",
      "theme-fuchsia",
      "theme-cottoncandy",
      "theme-blush",
      "theme-bubblegum",
    ]
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
      <wc-input name="theme_mode"
        class="col"
        lbl-label="Light or Dark?"
        type="checkbox"
        toggle-switch
        ${this.prefersDark ? 'checked' : ''}
        _="on change
          if me.value
            remove .light from document.documentElement
            add .dark to document.documentElement
          else
            remove .dark from document.documentElement
            add .light to document.documentElement
          end
        end"
        >
      </wc-input>
      `.trim();
      this.componentElement.appendChild(template.content.cloneNode(true));
  }

  _applyStyle() {
    const style = `
      wc-theme-selector {
        display: contents;
      }
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
    const selectedTheme = target.getAttribute('data-theme');
    this._setTheme(target, selectedTheme);
    localStorage.setItem("theme", selectedTheme.replace('theme-', ''));
  }

  _setTheme(target, theme) {
    const themeBtns = this.componentElement.querySelectorAll('button[data-theme]');
    // Remove "selected" class from all buttons
    themeBtns.forEach(btn => {
      btn.classList.remove('selected')
      btn.innerHTML = '';
    });
    // Add "selected" class to the clicked button
    target.classList.add('selected');
    target.innerHTML = `<svg class="selectmark h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
        <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
      </svg>`.trim();
    // Remove any current theme classes
    document.documentElement.classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        document.documentElement.classList.remove(cls);
      }
    });
    // Add the selected theme class to the documentElement
    document.documentElement.classList.add(theme);
  }

  _handleLoadTheme() {
    const savedTheme = localStorage.getItem("theme") || "rose";
    const themeClass = `theme-${savedTheme}`;
    const target = this.componentElement.querySelector(`button[data-theme="${themeClass}"]`);
    this._setTheme(target, themeClass);
  }

  _wireEvents() {
    super._wireEvents();
    const themeBtns = this.componentElement.querySelectorAll('button[data-theme]');
    themeBtns.forEach(btn => btn.addEventListener('click', this._handleThemeClick.bind(this)));
    this.componentElement.addEventListener('load', this._handleLoadTheme.bind(this));
  }

  _unWireEvents() {
    super._unWireEvents();
    const themeBtns = this.componentElement.querySelectorAll('button[data-theme]');
    themeBtns.forEach(btn => btn.removeEventListener('click', this._handleThemeClick.bind(this)));    
  }

}

customElements.define('wc-theme-selector', WcThemeSelector);
