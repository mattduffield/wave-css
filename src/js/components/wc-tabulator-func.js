
if (!customElements.get('wc-tabulator-func')) {

  class WcTabulatorFunc extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // funcs are managed by wc-tabulator; no additional work needed
    }
  }

  customElements.define('wc-tabulator-func', WcTabulatorFunc);
}