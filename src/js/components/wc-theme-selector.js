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
    return ['id', 'class', 'theme', 'mode', 'extra-themes'];
  }

  constructor() {
    super();
    // Toggle starts from the saved mode; with nothing saved, from the mode the page is showing
    // (.dark / .light on <html>), else dark (the original default).
    const savedDarkMode = localStorage.getItem("darkMode");
    const htmlCls = document.documentElement.classList;
    this.prefersDark = savedDarkMode !== null ? savedDarkMode === "true"
      : htmlCls.contains('dark') ? true : htmlCls.contains('light') ? false : true;
    this.prefersLight = !this.prefersDark;

    const compEl = this.querySelector('.wc-theme-selector');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-theme-selector');
      this.appendChild(this.componentElement);      
    }
    // console.log('ctor:wc-theme-selector');
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    // console.log('connectedCallback:wc-theme-selector');
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
    // console.log('_render:wc-theme-selector');
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
      "theme-gold",
      "theme-yellow",
      "theme-lemon",
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
      "theme-sienna",
      "theme-chocolate",
      "theme-coffee",
      "theme-tan",
      "theme-silver",
      "theme-gray",
      "theme-charcoal",
      "theme-designer",
      "theme-high-contrast",
    ]

    // Append extra themes from attribute
    const extraAttr = this.getAttribute('extra-themes');
    if (extraAttr) {
      const extras = extraAttr.split(/[\s,]+/).filter(t => t);
      extras.forEach(t => {
        if (!themes.includes(t)) themes.push(t);
      });
    }

    const template = document.createElement('template');
      template.innerHTML = `
      <div class="relative row flex-wrap">
        ${themes.map(theme => `
          <button class="theme-button flat h-10 w-10 rounded-t-md ${theme}" type="button" data-theme="${theme}" title="${theme}">
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
      wc-theme-selector .wc-theme-selector .theme-button {
        background-color: var(--primary-bg-color);
        padding: 0;
      }
      /* Neutral themes override --primary-bg-color to a colored accent (so CTAs pop),
         which would make all three swatches look identically blue here. Show a
         representative neutral tone instead — light/mid/dark so they read distinctly. */
      wc-theme-selector .wc-theme-selector .theme-button.theme-silver {
        background-color: var(--swatch-4);
      }
      wc-theme-selector .wc-theme-selector .theme-button.theme-gray {
        background-color: var(--swatch-7);
      }
      wc-theme-selector .wc-theme-selector .theme-button.theme-charcoal {
        background-color: var(--swatch-10);
      }
      /* Designer: its slate (#2c3e50) rather than the accent it gives buttons. */
      wc-theme-selector .wc-theme-selector .theme-button.theme-designer {
        background-color: var(--swatch-7);
      }
      /* High-contrast: show a fixed black/white split so the swatch reads as
         "high contrast" and never inherits the active theme's color. */
      wc-theme-selector .wc-theme-selector .theme-button.theme-high-contrast {
        background: linear-gradient(135deg, #fff 0 50%, #000 50% 100%);
      }
      wc-theme-selector .wc-theme-selector .selectmark {
        padding: 0;
        pointer-events: none;
      }
    `;
    this.loadStyle('wc-theme-selector-style', style);
  }

  _handleThemeClick(event) {
    const {target} = event;
    // console.log('target', target);
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
    // Add "selected" class to the clicked button. A saved theme with no swatch here (a site's own default,
    // e.g. one set by the page before this selector loads) has no button: it is still applied, just not ticked.
    if (target) {
      target.classList.add('selected');
      target.innerHTML = `<svg class="selectmark h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
        <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
      </svg>`.trim();
    }
    // Remove any current theme classes
    document.documentElement.classList.forEach(cls => {
      if (cls.startsWith('theme-')) {
        document.documentElement.classList.remove(cls);
      }
    });
    // Add the selected theme class to the documentElement
    document.documentElement.classList.add(theme);
    
    // Broadcast theme change event
    if (window.wc && window.wc.EventHub) {
      window.wc.EventHub.broadcast('wcthemechange', '', { theme });
    }
  }

  // "Light or Dark?" toggle: switch .light/.dark on <html>, remember it in localStorage.darkMode
  // ("true"/"false" — read back by wave-theme-init.js on the next page load) and send
  // wcthemechange to <body> (as the old hyperscript did). Plain JS, so it works without hyperscript.
  _handleModeChange(event) {
    const toggle = event.target.closest?.('wc-input[name="theme_mode"]');
    if (!toggle || !this.componentElement.contains(toggle)) return;
    const box = toggle.querySelector('input[type="checkbox"]');
    const isDark = box ? box.checked : !!toggle.value;
    const html = document.documentElement;
    const changed = html.classList.contains(isDark ? 'light' : 'dark') || !html.classList.contains(isDark ? 'dark' : 'light');
    html.classList.remove(isDark ? 'light' : 'dark');
    html.classList.add(isDark ? 'dark' : 'light');
    localStorage.setItem('darkMode', isDark ? 'true' : 'false');
    if (changed) {
      document.body.dispatchEvent(new CustomEvent('wcthemechange', { bubbles: true, cancelable: true, detail: { dark: isDark } }));
    }
  }

  _handleLoadTheme() {
    // Don't override if wc-theme component is controlling the theme
    if (document.documentElement.dataset.themeControlledBy === 'wc-theme') {
      return;
    }

    const savedTheme = localStorage.getItem("theme") || "royal";
    const themeClass = `theme-${savedTheme}`;
    const target = this.componentElement.querySelector(`button[data-theme="${themeClass}"]`);
    this._setTheme(target, themeClass);
  }

  _wireEvents() {
    super._wireEvents();
    const themeBtns = this.componentElement.querySelectorAll('button[data-theme]');
    themeBtns.forEach(btn => btn.addEventListener('click', this._handleThemeClick.bind(this)));
    this.componentElement.addEventListener('load', this._handleLoadTheme.bind(this));
    this._onModeChange = this._onModeChange || this._handleModeChange.bind(this);
    this.componentElement.addEventListener('change', this._onModeChange);
  }

  _unWireEvents() {
    super._unWireEvents();
    const themeBtns = this.componentElement.querySelectorAll('button[data-theme]');
    themeBtns.forEach(btn => btn.removeEventListener('click', this._handleThemeClick.bind(this)));
    if (this._onModeChange) this.componentElement.removeEventListener('change', this._onModeChange);
  }

}

customElements.define('wc-theme-selector', WcThemeSelector);
