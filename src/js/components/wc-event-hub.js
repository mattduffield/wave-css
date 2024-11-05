class WcEventHub extends HTMLElement {
  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();
  }

  connectedCallback() {
    if (document.querySelector(this.tagName) !== this) {
      console.warn(`${this.tagName} is already present on the page.`);
      this.remove();
    } else {
      if (!window.wc) {
        window.wc = {};
      }
      window.wc.EventHub = this;
    }
  }
  disconnectedCallback() {
  }

  broadcast(eventName, selector) {
    const custom = new CustomEvent(eventName, { detail: { selector: selector }});
    document.body.dispatchEvent(custom);
  }

}

customElements.define('wc-event-hub', WcEventHub);
