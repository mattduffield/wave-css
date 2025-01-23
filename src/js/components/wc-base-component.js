import { generateUniqueId, loadCSS, loadScript, loadLibrary, loadStyle } from './helper-function.js';


export class WcBaseComponent extends HTMLElement {

  constructor() {
    super();
    this._wcId = generateUniqueId();
    this.loadCSS = loadCSS.bind(this);
    this.loadScript = loadScript.bind(this);
    this.loadLibrary = loadLibrary.bind(this);
    this.loadStyle = loadStyle.bind(this);
    this.childComponent = null; // This is used to detect when a third-party object is created, e.g. Code Mirror editor object.
    this.childComponentSelector = ''; // This is used to detect when child web components are loaded.
    this._pendingAttributes = {};
    this._isConnected = false;
    this.componentElement = null; // This is the standard component or wrapper for form elements.
    this.formElement = null; // This is any form element: input, select, etc.
  }

  get wcId() {
    return this._wcId;
  }

  connectedCallback() {
    // The following is used to ensure any child web components render prior to allowing
    // this component to render.
    if (this.childComponentSelector) {
      console.log('connectedCallback:waiting for ', this.childComponentSelector, ' to be loaded...');
      this._waitForChildren(this.childComponentSelector).then(() => {
        this._connectedCallback();
      });
    } else {
      this._connectedCallback();
    }
  }

  _connectedCallback() {
    this._render();
    this.dataset.wcId = this.wcId;
    if (this.childComponentName) {
      this._waitForChild(() => this[this.childComponentName]).then(() => {
        this._isConnected = true;
        this._applyPendingAttributes();
      });
    } else {
      this._isConnected = true;
      this._applyPendingAttributes();
    }
  }

  disconnectedCallback() {
    
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
    } else if (attrName === 'elt-class') {
      const fe = this.querySelector('[form-element]');
      if (fe) {
        fe.setAttribute('class', newValue);
      }
    } else if (attrName === 'class') {
      const cls = newValue.replace('contents', '');
      const parts = cls.split(' ');
      parts.forEach(part => {
        if (part) {
          this.componentElement.classList.add(part);
          this.classList.remove(part);
        }
      })
    } else {
      this.componentElement.setAttribute(attrName, newValue);
    }
  }

  _handleNameToIdLinkage(nameValue) {
    if (nameValue) {
      if (this.formElement && !this.formElement.hasAttribute('id')) {
        this.formElement.setAttribute('id', nameValue);
        this.formElement.setAttribute('name', nameValue);
        this.removeAttribute('name');
      }      
    }
  }

  _render() {
    this.classList.add('contents');
    console.log('wc-base-component:_render');
  }

  async _waitForChild(childRef) {
    return new Promise((resolve) => {
      const checkIfReady = setInterval(() => {
        if (childRef()) {
          clearInterval(checkIfReady);
          resolve();
        }
      }, 50); // Check every 50ms, adjust interval as needed
    });
  }
  async _waitForChildren(selector) {
    const children = Array.from(this.querySelectorAll(selector));

    // // Wait until all components are defined and upgraded
    // await Promise.all(
    //   children.map((child) =>
    //     customElements.whenDefined(selector)
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

  _applyStyle() {
    // Handle any base styles.
  }

  _wireEvents() {
    // Handle any base events.
  }

  _unWireEvents() {
    // Remove any base events.
  }

}
