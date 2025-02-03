/**
 * 
 *  Name: wc-theme
 *  Usage:
 *    <wc-theme>
 * 
 *    </wc-theme>
 * 
 *  Description: 
 *    The purpose of this component is to allow you to add script tags regardless if this
 *    is a standard request/response or HTMX.
 */
import { loadCSS, loadScript, loadLibrary, loadStyle } from './helper-function.js';

if (!customElements.get('wc-theme')) {

  class WcTheme extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      this._handleLoadTheme();
    }

    _handleLoadTheme() {
      const savedTheme = localStorage.getItem("theme") || "rose";
      const themeClass = `theme-${savedTheme}`;
      // Remove any current theme classes
      document.documentElement.classList.forEach(cls => {
        if (cls.startsWith('theme-')) {
          document.documentElement.classList.remove(cls);
        }
      });
      // Add the selected theme class to the documentElement
      document.documentElement.classList.add(themeClass);
    }  
  
  }

  customElements.define('wc-theme', WcTheme);
}