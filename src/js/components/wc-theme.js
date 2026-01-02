/**
 *
 *  Name: wc-theme
 *  Usage:
 *    <wc-theme></wc-theme>
 *    <wc-theme theme="ocean"></wc-theme>
 *    <wc-theme theme="ocean dark"></wc-theme>
 *    <wc-theme theme="dark ocean"></wc-theme>
 *
 *  Attributes:
 *    - theme: Theme name and optional 'dark' or 'light' mode (e.g., "ocean", "ocean dark", "dark ocean")
 *
 *  Description:
 *    Manages the application theme by applying theme classes to the document element.
 *    - If 'theme' attribute is provided, uses that value (and saves to localStorage)
 *    - Otherwise, loads theme from localStorage (defaults to 'rose')
 *    - Supports both theme name and dark/light mode in the same attribute
 */
import { loadCSS, loadScript, loadLibrary, loadStyle } from './helper-function.js';

if (!customElements.get('wc-theme')) {

  class WcTheme extends HTMLElement {
    static get observedAttributes() {
      return ['theme'];
    }

    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      this._handleLoadTheme();
    }

    attributeChangedCallback(name, oldValue, newValue) {
      if (name === 'theme' && oldValue !== newValue && this.isConnected) {
        this._handleLoadTheme();
      }
    }

    _handleLoadTheme() {
      let themeName = null;
      let isDark = null;

      // Check if theme attribute is provided
      const themeAttr = this.getAttribute('theme');

      if (themeAttr) {
        // Parse theme attribute (e.g., "ocean dark", "dark ocean", "ocean")
        const parts = themeAttr.trim().toLowerCase().split(/\s+/);

        // Check for 'dark' or 'light' in the parts
        if (parts.includes('dark')) {
          isDark = true;
          themeName = parts.find(p => p !== 'dark' && p !== 'light') || 'rose';
        } else if (parts.includes('light')) {
          isDark = false;
          themeName = parts.find(p => p !== 'dark' && p !== 'light') || 'rose';
        } else {
          // No dark/light specified, just theme name
          themeName = parts[0] || 'rose';
        }

        // Save to localStorage for persistence
        localStorage.setItem("theme", themeName);
        if (isDark !== null) {
          localStorage.setItem("darkMode", isDark ? "true" : "false");
        }
      } else {
        // No theme attribute, load from localStorage
        themeName = localStorage.getItem("theme") || "rose";
        const savedDarkMode = localStorage.getItem("darkMode");
        if (savedDarkMode !== null) {
          isDark = savedDarkMode === "true";
        }
      }

      // Apply theme class
      const themeClass = `theme-${themeName}`;

      // Remove any current theme classes
      document.documentElement.classList.forEach(cls => {
        if (cls.startsWith('theme-')) {
          document.documentElement.classList.remove(cls);
        }
      });

      // Add the selected theme class to the documentElement
      document.documentElement.classList.add(themeClass);

      // Apply dark/light mode if specified
      if (isDark === true) {
        document.documentElement.classList.add('dark');
        document.documentElement.classList.remove('light');
      } else if (isDark === false) {
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
      }
    }

  }

  customElements.define('wc-theme', WcTheme);
}