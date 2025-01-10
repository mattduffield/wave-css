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

import { loadCSS, loadScript, loadLibrary, loadStyle } from './helper-function.js';
// import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-prompt')) {
  // class WcPrompt extends WcBaseComponent {
  class WcPrompt extends HTMLElement {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);
      this.table = null;

      // const compEl = this.querySelector('.wc-prompt');
      // if (compEl) {
      //   this.componentElement = compEl;
      // } else {
      //   this.componentElement = document.createElement('div');
      //   this.componentElement.classList.add('wc-prompt');
      //   this.componentElement.id = this.getAttribute('id') || 'wc-prompt';
      //   this.appendChild(this.componentElement);      
      // }
      console.log('ctor:wc-prompt');
    }

    async connectedCallback() {
      // super.connectedCallback();

      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderPrompt();
      }
  
      this._applyStyle();
      console.log('conntectedCallback:wc-prompt');
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      // this._unWireEvents();
    }

    // async _handleAttributeChange(attrName, newValue) {
    //   super._handleAttributeChange(attrName, newValue); 
    // }

    // _render() {
    //   super._render();
    //   const innerEl = this.querySelector('.wc-prompt > *');
    //   if (innerEl) {
    //     // Do nothing...
    //   } else {
    //     this.componentElement.innerHTML = '';
    //     this._createInnerElement();
    //   }

    //   if (typeof htmx !== 'undefined') {
    //     htmx.process(this);
    //   }
    //   console.log('_render:wc-prompt');
    // }

    // async _createInnerElement() {
    //   await this.renderPrompt();
    //   this.classList.add('contents');
    // }

    async renderPrompt() {
      await Promise.all([
        this.loadCSS('https://unpkg.com/notie/dist/notie.min.css'),
        this.loadLibrary('https://unpkg.com/notie', 'notie'),
        this.loadLibrary('https://unpkg.com/sweetalert2@11.15.10/dist/sweetalert2.all.js', 'Swal'),
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
      const { title = '', icon = 'success', position = 'top-end' } = c;
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

    async success(c) {
      const { title = '', text = '', footer = '', callback = null } = c;
      const {value: result} = await Swal.fire({ icon: 'success', title, text, footer, callback });
      this.handleResult(c, result);
    }

    async error(c) {
      const { title = '', text = '', footer = '', callback = null } = c;
      const {value: result} = await Swal.fire({ icon: 'error', title, text, footer, callback });
      this.handleResult(c, result);
    }

    async warning(c) {
      const { title = '', text = '', footer = '', callback = null } = c;
      const {value: result} = await Swal.fire({ icon: 'warning', title, text, footer, callback });
      this.handleResult(c, result);
    }

    async info(c) {
      const { title = '', text = '', footer = '', callback = null } = c;
      const {value: result} = await Swal.fire({ icon: 'info', title, text, footer, callback });
      this.handleResult(c, result);
    }

    async question(c) {
      const { title = '', text = '', footer = '', showCancelButton = true, callback = null } = c;
      const {value: result} = await Swal.fire({ icon: 'question', title, text, footer, showCancelButton, callback });
      this.handleResult(c, result);
    }

    async notify(c) {
      const body = document.querySelector('body');
      const theme = body.dataset.theme;
      const { icon = '', title = '', text = '', showConfirmButton = true,
          input='', inputOptions = {}, inputPlaceholder='', callback=null } = c;

      const customClass = {
        container: '',
        // popup: 'theme-midnight-slate',
        popup: theme,
        header: '',
        title: '',
        closeButton: '',
        icon: '',
        image: '',
        htmlContainer: '',
        input: '',
        inputLabel: '',
        validationMessage: '',
        actions: '',
        confirmButton: 'theme-ocean-blue',
        denyButton: '',
        cancelButton: 'theme-slate-storm',
        loader: '',
        footer: '',
        timerProgressBar: '',
      };
      const {value: result} = await Swal.fire({
        customClass,
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
      this.handleResult(c, result);
    }

    handleResult(c, result) {
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
      wc-prompt {
        display: none;
      }
      .swal2-container .swal2-popup {
        background-color: var(--secondary-bg-color);
      }
      .swal2-container .swal2-popup .swal2-title {
        color: var(--secondary-color);
      }
      .swal2-container .swal2-popup .swal2-html-container {
        color: var(--secondary-color);
      }
      .swal2-container .swal2-popup .swal2-actions .swal2-confirm {
        background-color: var(--primary-bg-color);
      }
      .swal2-container .swal2-popup .swal2-actions .swal2-cancel {
        background-color: var(--secondary-bg-color);
      }
      .swal2-container .swal2-popup input,
      .swal2-container .swal2-popup select,
      .swal2-container .swal2-popup textarea {
        background-color: var(--component-bg-color);
        border: 1px solid var(--component-border-color);
        border-radius: 0.375rem;
        color: var(--component-color);
        padding: 0.375rem;
      }
      `;
      this.loadStyle('wc-prompt-style', style);
    }

  }

  customElements.define('wc-prompt', WcPrompt);
}