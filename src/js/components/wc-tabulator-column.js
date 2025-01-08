
if (!customElements.get('wc-tabulator-column')) {

  class WcTabulatorColumn extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // Columns are managed by wc-tabulator; no additional work needed
    }
  }

  customElements.define('wc-tabulator-column', WcTabulatorColumn);
}