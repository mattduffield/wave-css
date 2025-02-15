
if (!customElements.get('wc-tabulator-template')) {

  class WcTabulatorTemplate extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // Templates are managed by wc-tabulator; no additional work needed
    }
  }

  customElements.define('wc-tabulator-template', WcTabulatorTemplate);
}