/**
 * 
 *  Name: wc-behavior
 *  Usage:
 *    <wc-behavior
 *      hx-trigger="custom-event from:body"
 *      hx-post=""
 *      hx-confirm="Are you sure you perform the custom event?"></wc-behavior>
 * 
 */

class WcBehavior extends HTMLElement {
  static get observedAttributes() {
    // Define all HTMX-supported attributes here for observation
    return [
      'hx-get', 'hx-post', 'hx-put', 'hx-delete', 'hx-target',
      'hx-trigger', 'hx-swap', 'hx-select', 'hx-push-url',
      'hx-vals', 'hx-headers', 'hx-indicator', 'hx-params', 'hx-ext',
      'hx-prompt', 'hx-confirm', 'hx-on', 'hx-include'
    ];
  }

  constructor() {
    super();
    this.classList.add('contents');
  }

  connectedCallback() {
    // Check if a valid parent container exists
    const parentContainer = this.parentElement;
    if (parentContainer) {
      this.applyAttributes(parentContainer);
      parentContainer.addEventListener('click', this.raiseEvent.bind(this));
    } else {
      console.warn('No parent container found for HTMX attributes.');
    }
  }

  // attributeChangedCallback(name, oldValue, newValue) {
  //   // Apply the attribute to the parent container if it changes
  //   const parentContainer = this.parentElement;
  //   if (parentContainer) {
  //     parentContainer.setAttribute(name, newValue);
  //   }
  // }

  applyAttributes(container) {
    // Loop through each HTMX attribute and apply it if present on the component
    WcBehavior.observedAttributes.forEach(attr => {
      if (this.hasAttribute(attr)) {
        container.setAttribute(attr, this.getAttribute(attr));
      }
    });
    WcBehavior.observedAttributes.forEach(attr => {
      if (this.hasAttribute(attr)) {
        this.removeAttribute(attr);
      }
    });
  }

  raiseEvent(event) {
    const custom = new CustomEvent("custom-event", { detail: "hello world" });
    document.body.dispatchEvent(custom);
  }

}

customElements.define('wc-behavior', WcBehavior);
