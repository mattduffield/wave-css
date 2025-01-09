/*
 * Name: WcPrompt
 *
 * 
 * 
 * 
 * References:
 *  https://sweetalert2.github.io/
 *  https://github.com/jaredreich/notie
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-prompt')) {
  class WcPrompt extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    constructor() {
      super();
      this.table = null;

      const compEl = this.querySelector('.wc-prompt');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-prompt');
        this.componentElement.id = this.getAttribute('id') || 'wc-prompt';
        this.appendChild(this.componentElement);      
      }
      console.log('ctor:wc-prompt');
    }

    async connectedCallback() {
      super.connectedCallback();

      this._applyStyle();
      console.log('conntectedCallback:wc-prompt');
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    async _handleAttributeChange(attrName, newValue) {
      super._handleAttributeChange(attrName, newValue); 
    }

    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-prompt > *');
      if (innerEl) {
        // Do nothing...
      } else {
        this.componentElement.innerHTML = '';
        this._createInnerElement();
      }

      if (typeof htmx !== 'undefined') {
        htmx.process(this);
      }
      console.log('_render:wc-prompt');
    }

    async _createInnerElement() {
      await this.renderPrompt();
      this.classList.add('contents');
    }

    async renderPrompt() {
      await Promise.all([
        this.loadCSS('https://unpkg.com/notie/dist/notie.min.css'),
        this.loadLibrary('https://unpkg.com/notie', 'notie'),
        this.loadLibrary('https://cdn.jsdelivr.net/npm/sweetalert2@11', 'Swal'),
      ]);

      if (!window.wc) {
        window.wc = {};
      }
      window.wc.Prompt = this;
    }

    banner(c) {
      const { text = '', type = 'info', stay = false, time = 3, position = 'top' } = c;
      notie.alert({ type, text, stay, time, position });
    }

    toast(c) {
      const { title = '', icon = 'success', position = 'top-end', } = c;
      const Toast = Swal.mixin({
        toast: true,
        title: title,
        position: position,
        icon: icon,
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
      });

      Toast.fire({});
    }

    success(c) {
      const { title = '', text = '', footer = '', } = c;
      Swal.fire({ icon: 'success', title, text, footer });
    }

    error(c) {
      const { title = '', text = '', footer = '', } = c;
      Swal.fire({ icon: 'error', title, text, footer });
    }

    warning(c) {
      const { title = '', text = '', footer = '', } = c;
      Swal.fire({ icon: 'warning', title, text, footer });
    }

    info(c) {
      const { title = '', text = '', footer = '', } = c;
      Swal.fire({ icon: 'info', title, text, footer });
    }

    question(c) {
      const { title = '', text = '', footer = '', showCancelButton = true } = c;
      Swal.fire({ icon: 'question', title, text, footer, showCancelButton });
    }

    async notify(c) {
      const { icon = '', title = '', text = '', showConfirmButton = true,
          input='', inputOptions = {}, inputPlaceholder='', callback=null } = c;
      const {value: result} = await Swal.fire({
        icon: icon,
        title: title,
        html: text,
        input: input,
        inputOptions: inputOptions,
        inputPlaceholder: inputPlaceholder,
        callback: callback,
        backdrop: false,
        focusConfirm: false,
        showCancelButton: true,
        showConfirmButton: showConfirmButton,
        willOpen: () => {
          if (c.willOpen !== undefined) {
            c.willOpen();
          }
        },
        didOpen: () => {
          if (c.didOpen !== undefined) {
            c.didOpen();
          }
        }
      });

      if (result) {
        if (result.dismiss !== Swal.DismissReason.cancel) {
          if (result.value !== '') {
            if (c.callback !== undefined) {
              c.callback(result);
            }
          } else {
            c.callback(false);
          }
        } else {
          c.callback(false);
        }
      }
    }

    _applyStyle() {
      const style = `

      `;
      this.loadStyle('wc-prompt-style', style);
    }

  }

  customElements.define('wc-prompt', WcPrompt);
}