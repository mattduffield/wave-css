import { generateUniqueId, loadCSS, loadScript, loadLibrary, loadStyle } from './helper-function.js';


export class WcBaseComponent extends HTMLElement {
  constructor() {
    super();
    this.generateUniqueId = generateUniqueId.bind(this);
    this.loadCSS = loadCSS.bind(this);
    this.loadScript = loadScript.bind(this);
    this.loadLibrary = loadLibrary.bind(this);
    this.loadStyle = loadStyle.bind(this);
    this.childComponentSelector = '';
    this._pendingAttributes = {};
    this._isConnected = false;
    this.componentWrapper = null; // This is any wrapper over the component.
    this.componentElement = null; // This will be the input, select, etc. (set by child components)
  }

  connectedCallback() {
    // The following is used to ensure any child web components render prior to allowing
    // this component to render.
    if (this.childComponentSelector) {
      this._waitForChildren(this.childComponentSelector).then(() => {
        this._connectedCallback();
      })
    } else {
      this._connectedCallback();
    }
  }

  _connectedCallback() {
    this._isConnected = true;
    this._applyPendingAttributes();
    window.addEventListener('popstate', this._handlePopState.bind(this));
    this._render();          
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._handlePopState);
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
    if (attrName === 'name') {
      this._handleNameToIdLinkage(newValue);
    } else if (attrName === 'wpr-class') {
      const wpr = this.querySelector('.wrapper');
      if (wpr) {
        wpr.setAttribute('class', newValue);
      }
    } else if (attrName === 'class') {
      const parts = newValue.split(' ');
      parts.forEach(p => {
        const cls = p.replace('contents', '');
        if (cls) {
          this.componentElement.classList.add(cls);
        }
      })
    } else {
      this.componentElement.setAttribute(attrName, newValue);
    }
  }

  _handleNameToIdLinkage(nameValue) {
    if (!this.formElement.hasAttribute('id')) {
      this.formElement.setAttribute('id', nameValue);
    }
  }

  _handlePopState(event) {
    // Handle back navigation logic, we call the _render function.
    // It is important that the _render logic is idempotent.
    // this._render();
  }

  _render() {
    this.className = 'contents';
    // this.classList.add('contents');
  }

  async _waitForChildren(selector) {
    const children = Array.from(this.querySelectorAll(selector));

    // // Wait until all wc-slideshow-image components are defined and upgraded
    // await Promise.all(
    //   children.map((child) =>
    //     customElements.whenDefined('wc-slideshow-image')
    //   )
    // );

    // Optionally: wait until all children are rendered (e.g., after connectedCallback is called)
    await Promise.all(
      children.map((child) => {
        return new Promise((resolve) => {
          if (child.isConnected) {
            resolve();
          } else {
            child.addEventListener('connected', resolve, { once: true });
          }
        });
      })
    );
  }

  _wireEvents() {
    // Handle any base events.
  }

  _unWireEvents() {
    // Remove any base events.
  }

}
