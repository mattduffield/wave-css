/*
 * Name: WcPrompt
 * Usage: 
 * 
 *  <wc-prompt></wc-prompt>
 * 
 * References:
 *  https://sweetalert2.github.io/
 *  https://github.com/jaredreich/notie
 */

import { loadCSS, loadScript, loadLibrary, loadStyle, show } from './helper-function.js';

if (!customElements.get('wc-prompt')) {
  class WcPrompt extends HTMLElement {
    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);
      this.table = null;

      console.log('ctor:wc-prompt');
    }

    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderPrompt();
      }
  
      this._applyStyle();
      this.wireEvents();
      console.log('conntectedCallback:wc-prompt');
    }

    disconnectedCallback() {      
      this.unWireEvents();
    }

    async renderPrompt() {
      await Promise.all([
        this.loadCSS('https://unpkg.com/notie/dist/notie.min.css'),
        this.loadLibrary('https://unpkg.com/notie', 'notie'),
        this.loadLibrary('https://unpkg.com/sweetalert2@11.15.10/dist/sweetalert2.all.js', 'Swal'),
        // this.loadCSS('/static/css/notie@4.3.1.min.css'),
        // this.loadLibrary('/static/js/notie.js', 'notie'),
        // this.loadLibrary('/static/js/sweetalert2@11.15.10.js', 'Swal'),
      ]);

      if (!window.wc) {
        window.wc = {};
      }
      window.wc.Prompt = this;
      wc.EventHub.broadcast('wc-prompt:ready', '', '');
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
      const {value: result} = await Swal.fire({ icon: 'success', title, text, footer });
      return this.handleResult(c, result);
    }

    async error(c) {
      const { title = '', text = '', footer = '', callback = null } = c;
      const {value: result} = await Swal.fire({ icon: 'error', title, text, footer });
      return this.handleResult(c, result);
    }

    async warning(c) {
      const { title = '', text = '', footer = '', callback = null } = c;
      const {value: result} = await Swal.fire({ icon: 'warning', title, text, footer });
      return this.handleResult(c, result);
    }

    async info(c) {
      const { title = '', text = '', footer = '', callback = null } = c;
      const {value: result} = await Swal.fire({ icon: 'info', title, text, footer });
      return this.handleResult(c, result);
    }

    async question(c) {
      const { title = '', text = '', footer = '', showCancelButton = true, callback = null } = c;
      const {value: result} = await Swal.fire({ icon: 'question', title, text, footer, showCancelButton });
      return this.handleResult(c, result);
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
      return this.handleResult(c, result);
    }

    async notifyTemplate(c) {
      const body = document.querySelector('body');
      const theme = body.dataset.theme;
      const { template = '', didOpen=null, callback=null } = c;

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
        template,
        didOpen: didOpen
      });
      return this.handleResult(c, result);
    }

    async fire(c) {
      const body = document.querySelector('body');
      const theme = body.dataset.theme;
      let defaultArgs = {
        container: '',
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
        backdrop: false,
        focusConfirm: false,
        showCancelButton: true,
        showConfirmButton: true,
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
      };
      const customArgs = { ...defaultArgs, ...c };
      const {value: result} = await Swal.fire(customArgs);
      return this.handleResult(c, result);
    }

    handleResult(c, result) {
      if (result) {
        if (result.dismiss !== Swal.DismissReason.cancel) {
          if (result.value !== '') {
            if (c.callback !== undefined) {
              return c.callback(result);
            } else {
              return result;
            }
          } else {
            return c.callback(false);
          }
        } else {
          return c.callback(false);
        }
      }
    }

    _applyStyle() {
      const style = `
      wc-prompt {
        display: contents;
      }
      .swal2-container .swal2-popup {
        background-color: var(--surface-5);
        color: var(--text-1);
      }
      .swal2-container .swal2-popup .swal2-title {
        color: var(--text-1);
      }
      .swal2-container .swal2-popup .swal2-html-container {
        background-color: var(--surface-5);
        color: var(--text-1);
        overflow: visible;
        text-align: inherit;
        z-index: auto;
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

    wireEvents() {
      document.body.addEventListener('wc-prompt:banner', (event) => {
        this.banner(event.detail);
      });
      document.body.addEventListener('wc-prompt:toast', (event) => {
        this.toast(event.detail);
      });
      document.body.addEventListener('wc-prompt:success', async (event) => {
        return this.success(event.detail);
      });
      document.body.addEventListener('wc-prompt:error', async (event) => {
        return this.error(event.detail);
      });
      document.body.addEventListener('wc-prompt:warning', async (event) => {
        return this.warning(event.detail);
      });
      document.body.addEventListener('wc-prompt:info', async (event) => {
        return this.info(event.detail);
      });
      document.body.addEventListener('wc-prompt:question', async (event) => {
        return this.question(event.detail);
      });
      document.body.addEventListener('wc-prompt:notify', async (event) => {
        return this.notify(event.detail);
      });
      document.body.addEventListener('wc-prompt:notify-template', async (event) => {
        return this.notifyTemplate(event.detail);
      });      
    }
    unWireEvents() {
      document.body.removeEventListener('wc-prompt:banner', (event) => {
        this.banner(event.detail);
      });
      document.body.removeEventListener('wc-prompt:toast', (event) => {
        this.toast(event.detail);
      });
      document.body.removeEventListener('wc-prompt:success', async (event) => {
        return this.success(event.detail);
      });
      document.body.removeEventListener('wc-prompt:error', async (event) => {
        return this.error(event.detail);
      });
      document.body.removeEventListener('wc-prompt:warning', async (event) => {
        return this.warning(event.detail);
      });
      document.body.removeEventListener('wc-prompt:info', async (event) => {
        return this.info(event.detail);
      });
      document.body.removeEventListener('wc-prompt:question', async (event) => {
        return this.question(event.detail);
      });
      document.body.removeEventListener('wc-prompt:notify', async (event) => {
        return this.notify(event.detail);
      });
      document.body.removeEventListener('wc-prompt:notify-template', async (event) => {
        return this.notifyTemplate(event.detail);
      });      
    }
  }

  customElements.define('wc-prompt', WcPrompt);
}