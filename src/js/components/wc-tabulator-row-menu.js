
if (!customElements.get('wc-tabulator-row-menu')) {

  class WcTabulatorRowMenu extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // funcs are managed by wc-tabulator; no additional work needed
    }
  }

  customElements.define('wc-tabulator-row-menu', WcTabulatorRowMenu);
}