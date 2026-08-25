
if (!customElements.get('wc-dropdown-item')) {

  class WcDropdownItem extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // Declarative menu item — rendering/behavior is handled by the parent wc-dropdown.
    }
  }

  customElements.define('wc-dropdown-item', WcDropdownItem);
}