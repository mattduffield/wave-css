
if (!customElements.get('wc-dropdown-item')) {

  class WcDropdownItem extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // Columns are managed by wc-tabulator; no additional work needed
    }
  }

  customElements.define('wc-dropdown-item', WcDropdownItem);
}