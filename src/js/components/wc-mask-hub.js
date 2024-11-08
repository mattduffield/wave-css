class WcMaskHub extends HTMLElement {
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
      window.wc.MaskHub = this;
    }
  }
  disconnectedCallback() {
  }

  phoneMask(event) {
    const {target} = event;
    const phoneMask = IMask(target, {
      mask: [
        {
          mask: '(000) 000-0000',
          startsWith: '',
          // lazy: false,
          // eager: true
        }
      ],
      dispatch: function (appended, dynamicMasked) {
        const number = (dynamicMasked.value + appended).replace(/\D/g, '');
        return dynamicMasked.compiledMasks[0];
      }
    });
  }

}

customElements.define('wc-mask-hub', WcMaskHub);
