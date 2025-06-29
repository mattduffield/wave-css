/**
 * 
 *  Name: wc-visibility-change
 *  Usage:
 *    <wc-visibility-change
 *      hx-verb="GET"
 *      hx-url="/"
 *      hx-target="#targetSelector"
 *      hx-swap="outerHTML"
 *      hx-indicator="#content-loader"
 *      ></wc-visibility-change>
 * 
 *  Description: 
 *    The purpose of this component is to allow you to wire up the visibilitychange event
 *    and respond by issuing an HTMX ajax request based on the attributes provided.
 *    The visibilitychange event fires when you go to a new tab or when you come back to 
 *    the current tab. This component will issue the AJAX request when the property 
 *    document.hidden is false.
 */

if (!customElements.get('wc-visibility-change')) {
  class WcVisibilityChange extends HTMLElement {
    static get observedAttributes() {
      return ['hx-verb', 'hx-url', 'hx-target', 'hx-swap', 'hx-indicator', 'hx-push-url', 'hx-select'];
    }

    constructor() {
      super();
      this.classList.add('contents');
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this._pendingAttributes = {};
      this._isConnected = false;
    }

    async connectedCallback() {
      if (!this._isConnected) {
        // console.log('Initial visibility state:', document.visibilityState);
        // console.log('Is document hidden?', document.hidden);

        document.addEventListener('visibilitychange', this.handleVisibilityChange);
      }
      this._isConnected = true;
      this._applyPendingAttributes();
    }

    disconnectedCallback() {
      if (this.form) {
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      }
    }

    handleVisibilityChange() {
      if (document.hidden) {
        // console.log('Tab is in the background');
      } else {
        const verb = this.getAttribute('hx-verb') || 'GET';
        const url = this.getAttribute('hx-url') || '';
        const target = this.getAttribute('hx-target') || '';
        const swap = this.getAttribute('hx-swap') || '';
        const indicator = this.getAttribute('hx-indicator') || '';
        const pushUrl = this.getAttribute('hx-push-url') || '';
        const select = this.getAttribute('hx-select') || '';

        if (htmx) {
          if (verb && url && target && swap) {
            htmx.ajax(verb, url, { target, swap, indicator, pushUrl, select });
          }
        }          

        // console.log('Tab is in the foreground');
      }    
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
      if (!this._isConnected) {
        this._pendingAttributes[attrName] = newValue;
      } else {
        this._handleAttributeChange(attrName, newValue);
      }
    }

    _applyPendingAttributes() {
      Object.keys(this._pendingAttributes).forEach((attrName) => {
        const value = this._pendingAttributes[attrName];
        this._handleAttributeChange(attrName, value);
      });
      this._pendingAttributes = {};
    }

    _handleAttributeChange(attrName, newValue) {
      // Default implementation to be overridden in child components
    }

  }

  customElements.define('wc-visibility-change', WcVisibilityChange);
}