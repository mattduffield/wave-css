/*
 * Name: WcEventHub
 * Usage: 
 * 
 *  <wc-event-hub></wc-event-hub>
 * 
 * References:
 * 
 */

import { loadCSS, loadScript, loadLibrary, loadStyle } from './helper-function.js';

if (!customElements.get('wc-event-hub')) {
  class WcEventHub extends HTMLElement {
    events = {};
    
    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);

      // console.log('ctor:wc-event-hub');
    }

    connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        if (!window.wc) {
          window.wc = {};
        }
        window.wc.EventHub = this;
        this._applyStyle();
      }
      // console.log('conntectedCallback:wc-event-hub');
    }
    disconnectedCallback() {
    }

    broadcast(eventName, selector, subSelector, custom) {
      const payload = { detail: { selector, subSelector, custom }};
      const customEvent = new CustomEvent(eventName, payload);
      document.body.dispatchEvent(customEvent);
      if (window.parent.document) {
        window.parent.document.body.dispatchEvent(customEvent);
      }
    }
    
    _applyStyle() {
      const style = `
      wc-event-hub {
        display: contents;
      }
      `;
      this.loadStyle('wc-event-hub-style', style);
    }
  }

  customElements.define('wc-event-hub', WcEventHub);
}