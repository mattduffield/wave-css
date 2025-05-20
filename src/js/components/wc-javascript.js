/**
 * 
 *  Name: wc-javascript
 *  Usage:
 *    <wc-javascript>
 * 
 *    </wc-javascript>
 * 
 *  Description: 
 *    The purpose of this component is to allow you to add script tags regardless if this
 *    is a standard request/response or HTMX.
 */
import { loadCSS, loadScript, loadLibrary, loadStyle } from './helper-function.js';

if (!customElements.get('wc-javascript')) {

  class WcJavascript extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      const scriptContent = this.textContent.trim(); // Get the JavaScript content

      if (scriptContent) {
        const scriptId = `wc-javascript-${this.id || this.dataset.id || crypto.randomUUID()}`;

        // Check if the script is already appended
        if (!document.getElementById(scriptId)) {
          if (!window.wc) {
            window.wc = {};
          }
          if (!window.wc.scripts) {
            window.wc.scripts = {};
          }
          window.wc.loadCSS = loadCSS;
          window.wc.loadScript = loadScript;
          window.wc.loadLibrary = loadLibrary;
          window.wc.loadStyle = loadStyle;

          const defer = this.hasAttribute('defer');
          const script = document.createElement('script');
          script.type = 'text/javascript';
          script.textContent = scriptContent; // Set the script content
          script.id = scriptId; // Add an ID to the script to prevent duplication
          if (defer) {
            script.setAttribute('defer', '');
          }
          document.head.appendChild(script); // Append the script to the document head

        } else {
          console.log('Script already exists, skipping append:', scriptId);
          const fn = window.wc.scripts[scriptId];
          if (fn) {
            console.log("Calling script function...");
            fn();
          }
        }
      }

      // Optionally clear the content to hide the script in the DOM
      this.textContent = '';  
    }
  }

  customElements.define('wc-javascript', WcJavascript);
}