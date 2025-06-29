/*
 * Name: WcMaskHub
 * Usage: 
 * 
 *  <wc-mask-hub></wc-mask-hub>
 * 
 * References:
 *  https://github.com/uNmAnNeR/imaskjs
 */

import { loadCSS, loadScript, loadLibrary, loadStyle } from './helper-function.js';

if (!customElements.get('wc-mask-hub')) {
  class WcMaskHub extends HTMLElement {
    static get observedAttributes() {
      return [];
    }

    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);

      // console.log('ctor:wc-mask-hub');
    }

    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderMask();
        this._applyStyle();
      }
      // console.log('conntectedCallback:wc-mask-hub');
    }
    disconnectedCallback() {
    }

    async renderMask() {
      await Promise.all([
        this.loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/imask/7.6.1/imask.min.js', 'IMask'),
      ]);

      if (!window.wc) {
        window.wc = {};
      }
      window.wc.MaskHub = this;
    }

    phoneMask(event) {
      const {target} = event;
      const phoneMask = IMask(target, {
        mask: [
          {
            mask: '(000) 000-0000',
            startsWith: '',
            // lazy: false,
            // eager: true
          }
        ],
        dispatch: function (appended, dynamicMasked) {
          const number = (dynamicMasked.value + appended).replace(/\D/g, '');
          return dynamicMasked.compiledMasks[0];
        }
      });
    }

    _applyStyle() {
      const style = `
      wc-mask-hub {
        display: contents;
      }
      `;
      this.loadStyle('wc-mask-hub-style', style);
    }
  }

  customElements.define('wc-mask-hub', WcMaskHub);
}
