// src/js/components/helper-function.js
function isCustomElement(element) {
  return element.tagName.includes("-");
}
function generateUniqueId() {
  return "xxxx-xxxx-xxxx-xxxx".replace(/[x]/g, () => {
    return (Math.random() * 16 | 0).toString(16);
  });
}
function loadCSS(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[rel="stylesheet"][href="${url}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    link.onload = () => resolve();
    link.onerror = (error) => reject(error);
    document.head.appendChild(link);
    const checkCSSLoaded = setInterval(() => {
      if (getComputedStyle(document.body).getPropertyValue("display")) {
        clearInterval(checkCSSLoaded);
        resolve();
      }
    }, 50);
  });
}
function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => {
      resolve();
      return;
    };
    script.onerror = (error) => {
      reject(error);
      return;
    };
    document.head.appendChild(script);
  });
}
function loadLibrary(url, globalObjectName) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      if (globalObjectName && window[globalObjectName]) {
        resolve();
      } else {
        const checkGlobalObject = setInterval(() => {
          if (window[globalObjectName]) {
            clearInterval(checkGlobalObject);
            resolve();
          }
        }, 50);
      }
      return;
    }
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => {
      if (globalObjectName && !window[globalObjectName]) {
        const checkGlobalObject = setInterval(() => {
          if (window[globalObjectName]) {
            clearInterval(checkGlobalObject);
            resolve();
          }
        }, 50);
      } else {
        resolve();
      }
    };
    script.onerror = (error) => {
      reject(error);
    };
    document.head.appendChild(script);
  });
}
function loadStyle(id, content) {
  if (!document.getElementById(id)) {
    const style = document.createElement("style");
    style.id = id;
    style.textContent = content.trim();
    document.head.appendChild(style);
  }
}
function locator(root, selector) {
  if (root.matches && root.matches(selector)) {
    return root;
  }
  const element = root.querySelector(selector);
  if (element) {
    return element;
  }
  const shadowHosts = root.querySelectorAll("*");
  for (const shadowHost of shadowHosts) {
    if (shadowHost.shadowRoot) {
      const foundInShadow = this.locator(shadowHost.shadowRoot, selector);
      if (foundInShadow) {
        return foundInShadow;
      }
    }
  }
}
function locatorAll(root, selector) {
  let elements = [];
  if (root.matches && root.matches(selector)) {
    elements.push(root);
  }
  elements.push(...root.querySelectorAll(selector));
  const shadowHosts = root.querySelectorAll("*");
  for (const shadowHost of shadowHosts) {
    if (shadowHost.shadowRoot) {
      elements.push(...this.locatorAll(shadowHost.shadowRoot, selector));
    }
  }
  return elements;
}
function waitForSelectorPolling(selector, timeout = 5e3, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkVisibility = () => {
      const element = document.querySelector(selector);
      if (element && element.offsetParent !== null) {
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout: Selector "${selector}" not found or not visible after ${timeout}ms`));
      } else {
        setTimeout(checkVisibility, interval);
      }
    };
    checkVisibility();
  });
}
function checkResources(link, script) {
  let result = false;
  result = wc.linksLoaded[link] && wc.scriptsLoaded[script];
  return result;
}
function waitForResourcePolling(scriptDependencies = [], linkDependencies = [], timeout = 5e3, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const scriptList = Array.isArray(scriptDependencies) ? scriptDependencies : [scriptDependencies];
    const linkList = Array.isArray(linkDependencies) ? linkDependencies : [linkDependencies];
    const checkAvailability = () => {
      const scriptsAvailable = scriptList.length === 0 || scriptList.every((dep) => window.wc?.scriptsLoaded?.[dep] === true);
      const linksAvailable = linkList.length === 0 || linkList.every((dep) => window.wc?.linksLoaded?.[dep] === true);
      if (scriptsAvailable && linksAvailable) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout: Dependencies not available after ${timeout}ms. Scripts: ${JSON.stringify(scriptList)}, Links: ${JSON.stringify(linkList)}`));
      } else {
        setTimeout(checkAvailability, interval);
      }
    };
    checkAvailability();
  });
}
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function hide(selector) {
  const el = document.querySelector(selector);
  el.classList.add("hidden");
}
function show(selector) {
  const el = document.querySelector(selector);
  el.classList.remove("hidden");
}
function hideAndShow(hideSelector, showSelector) {
  hide(hideSelector);
  show(showSelector);
}

// src/js/components/wc-base-component.js
var WcBaseComponent = class extends HTMLElement {
  constructor() {
    super();
    this._wcId = generateUniqueId();
    this.loadCSS = loadCSS.bind(this);
    this.loadScript = loadScript.bind(this);
    this.loadLibrary = loadLibrary.bind(this);
    this.loadStyle = loadStyle.bind(this);
    this.childComponent = null;
    this.childComponentSelector = "";
    this._pendingAttributes = {};
    this._isConnected = false;
    this.componentElement = null;
    this.formElement = null;
  }
  get wcId() {
    return this._wcId;
  }
  connectedCallback() {
    if (this.childComponentSelector) {
      console.log("connectedCallback:waiting for ", this.childComponentSelector, " to be loaded...");
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
    if (attrName === "name") {
      this._handleNameToIdLinkage(newValue);
    } else if (attrName === "elt-class") {
      const fe = this.querySelector("[form-element]");
      if (fe) {
        fe.setAttribute("class", newValue);
      }
    } else if (attrName === "class") {
      const cls = newValue.replace("contents", "");
      const parts = cls.split(" ");
      parts.forEach((part) => {
        if (part) {
          this.componentElement.classList.add(part);
          this.classList.remove(part);
        }
      });
    } else {
      this.componentElement.setAttribute(attrName, newValue);
    }
  }
  _handleNameToIdLinkage(nameValue) {
    if (nameValue) {
      if (this.formElement && !this.formElement.hasAttribute("id")) {
        this.formElement.setAttribute("id", nameValue);
        this.formElement.setAttribute("name", nameValue);
        this.removeAttribute("name");
      }
    }
  }
  _render() {
    this.classList.add("contents");
  }
  async _waitForChild(childRef) {
    return new Promise((resolve) => {
      const checkIfReady = setInterval(() => {
        if (childRef()) {
          clearInterval(checkIfReady);
          resolve();
        }
      }, 50);
    });
  }
  async _waitForChildren(selector) {
    const children = Array.from(this.querySelectorAll(selector));
    await Promise.all(
      children.map((child) => {
        return new Promise((resolve) => {
          if (child.isConnected) {
            resolve();
          } else {
            child.addEventListener("connected", resolve, { once: true });
          }
        });
      })
    );
  }
  _applyStyle() {
  }
  _wireEvents() {
  }
  _unWireEvents() {
  }
};

// src/js/components/wc-article-skeleton.js
if (!customElements.get("wc-article-skeleton")) {
  class WcArticleSkeleton extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class"];
    }
    constructor() {
      super();
      const compEl = this.querySelector(".wc-article-skeleton");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classarticle.add("wc-article-skeleton");
        this._createElement();
        this.appendChild(this.componentElement);
      }
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }
    _handleAttributeChange(attrName, newValue) {
      if (attrName === "items") {
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }
    _createElement() {
      this.componentElement.id = "article-skeleton";
      this.componentElement.setAttribute("role", "status");
      this.componentElement.className = "space-y-8 animate-pulse md:space-y-0 md:space-x-8 rtl:space-x-reverse md:flex md:items-center";
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-center w-full h-48 bg-gray-300 rounded sm:w-96 dark:bg-gray-700">
          <svg class="w-10 h-10 text-gray-200 dark:text-gray-600" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
          </svg>
        </div>
        <div class="w-full">
          <div class="h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 w-48 mb-4"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[480px] mb-2.5"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 mb-2.5"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[440px] mb-2.5"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[460px] mb-2.5"></div>
          <div class="h-2 bg-gray-200 rounded-full dark:bg-gray-700 max-w-[360px]"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }
    _applyStyle() {
      const style = `
/* Space Utilities */
.space-y-8 > * + * {
  margin-top: 2rem;
}
.md:space-y-0 > * + * {
  margin-top: 0;
}
.md:space-x-8 > * + * {
  margin-left: 2rem;
}
.rtl:space-x-reverse > * + * {
  margin-left: 0;
  margin-right: 2rem;
}

/* Flexbox Utilities */
.md:flex {
  display: flex;
}
.md:items-center {
  align-items: center;
}

.sm:w-96 {
  width: 24rem;
}
.max-w-[480px] {
  max-width: 480px;
}
.max-w-[440px] {
  max-width: 440px;
}
.max-w-[460px] {
  max-width: 460px;
}
.max-w-[360px] {
  max-width: 360px;
}

/* Background Colors */
.bg-gray-300 {
  background-color: #d1d5db;
}
.bg-gray-200 {
  background-color: #e5e7eb;
}
.dark:bg-gray-700 {
  background-color: #374151;
}
.dark:text-gray-600 {
  color: #4b5563;
}
.text-gray-200 {
  color: #e5e7eb;
}

/* Rounded Corners */
.rounded {
  border-radius: 0.375rem;
}
.rounded-full {
  border-radius: 9999px;
}

/* Margins */
.mb-4 {
  margin-bottom: 1rem;
}
.mb-2.5 {
  margin-bottom: 0.625rem;
}

/* Accessibility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

/* Animation */
.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
      `.trim();
      this.loadStyle("wc-article-skeleton", style);
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-article-skeleton", WcArticleSkeleton);
}

// src/js/components/wc-base-form-component.js
var WcBaseFormComponent = class extends WcBaseComponent {
  static formAssociated = true;
  // Required to enable form-associated behavior
  constructor() {
    super();
    this._internals = this.attachInternals();
    this._value = "";
  }
  // Value getter and setter
  get value() {
    return this._isCheckbox() ? this.checked : this._value;
  }
  set value(newValue) {
    if (this._isCheckbox()) {
      this.checked = newValue;
    } else {
      this._value = newValue;
      this._internals.setFormValue(this._value);
    }
  }
  // Required attribute getter and setter
  get required() {
    return this.hasAttribute("required");
  }
  set required(isRequired) {
    if (isRequired) {
      this.setAttribute("required", "");
    } else {
      this.removeAttribute("required");
    }
  }
  get checked() {
    return this.formElement?.checked || false;
  }
  set checked(isChecked) {
    if (this._isCheckbox()) {
      this.formElement.checked = isChecked;
      this._internals.setFormValue(isChecked ? "bool:True" : "bool:False");
    }
  }
  // Validation handling
  get validity() {
    return this._internals.validity;
  }
  get validationMessage() {
    return this._internals.validationMessage;
  }
  get willValidate() {
    return this._internals.willValidate;
  }
  checkValidity() {
    return this._internals.checkValidity();
  }
  reportValidity() {
    return this._internals.reportValidity();
  }
  // Apply any default validations here, if necessary
  _handleValidation() {
    const errorMode = "";
    if (errorMode === "span") {
      if (!this.formElement?.validity.valid) {
        const span = document.createElement("span");
        span.classList.add("error-message");
        span.textContent = this.formElement?.validationMessage;
        this.componentElement.appendChild(span);
      } else {
        const span = this.componentElement.querySelector(".error-message");
        span?.remove();
      }
    } else if (errorMode === "tooltip") {
      if (!this.formElement?.validity.valid) {
        const msg = this.formElement?.validationMessage;
        this.formElement?.setAttribute("data-error", msg);
        this.formElement?.setAttribute("data-has-title", this.formElement?.getAttribute("title") || "");
        this.formElement?.setAttribute("title", "");
      } else {
        this.formElement?.removeAttribute("data-error");
        this.formElement?.setAttribute("title", this.formElement?.getAttribute("data-has-title"));
        this.formElement?.removeAttribute("data-has-title");
      }
    }
    this._internals.setValidity(this.formElement?.validity, this.formElement?.validationMessage);
  }
  connectedCallback() {
    super.connectedCallback();
    this.formElement = this.querySelector("input, select, textarea");
    console.log("wc-base-form-component:connectedCallback - formElement", this.formElement);
    this._wireEvents();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "value") {
      if (this._isCheckbox()) {
        this.checked = newValue !== null && newValue !== "false" && newValue !== "bool:False";
      } else {
        if (this.formElement) {
          this.formElement?.setAttribute("value", newValue);
          if ("value" in this.formElement) {
            this.formElement.value = newValue;
          }
        }
        this.value = newValue;
      }
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _handleInputChange(event) {
    const { target } = event;
    if (this._isCheckbox()) {
      if (target.checked) {
        this.formElement.value = "bool:True";
      } else {
        this.formElement.value = "bool:False";
      }
      this.checked = target.checked;
    } else {
      this.value = target.value;
    }
    if (this._isRange()) {
      const label = this.querySelector("label");
      const lbl = this.getAttribute("lbl-label") || "";
      if (label && lbl) {
        label.textContent = `${lbl} (${target.value})`;
      }
    }
    this._handleValidation();
  }
  _isCheckbox() {
    return this.formElement?.type === "checkbox";
  }
  _isRange() {
    return this.formElement?.type === "range";
  }
  _wireEvents() {
    super._wireEvents();
    if (this.formElement) {
      this.formElement.addEventListener("input", this._handleInputChange.bind(this));
      this.formElement.addEventListener("change", this._handleInputChange.bind(this));
    }
  }
  _unWireEvents() {
    super._unWireEvents();
    if (this.formElement) {
      this.formElement.removeEventListener("input", this._handleInputChange.bind(this));
      this.formElement.removeEventListener("change", this._handleInputChange.bind(this));
    }
  }
};

// src/js/components/wc-accordion.js
var WcAccordion = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "items", "allow-many"];
  }
  constructor() {
    super();
    this._items = [];
    const compEl = this.querySelector(".wc-accordion");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-accordion");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-accordion");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
    console.log("connectedCallback:wc-accordion");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "items") {
      if (typeof newValue === "string") {
        this._items = JSON.parse(newValue);
      }
      this.removeAttribute("items");
    } else if (attrName === "allow-many") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerParts = this.querySelectorAll(".wc-accordion > *");
    if (innerParts.length > 0) {
      this.componentElement.innerHTML = "";
      innerParts.forEach((p) => this.componentElement.appendChild(p));
    } else {
      this._moveDeclarativeOptions();
      this.componentElement.innerHTML = "";
      this._items.forEach((item) => {
        const header = this._createHeader(item.label, item.selected);
        this.componentElement.appendChild(header);
        const panel = this._createPanel(item.content);
        this.componentElement.appendChild(panel);
      });
    }
    this._setActive();
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-accordion");
  }
  _createHeader(label, selected) {
    const allowMany = this.hasAttribute("allow-many");
    const el = document.createElement("button");
    el.classList.add("accordion-header");
    if (allowMany) {
      el.setAttribute("_", `on click
        toggle .active on me
        set panel to me.nextElementSibling
        if panel.style.maxHeight then
          set panel.style.maxHeight to null
        else
          set panel.style.maxHeight to panel.scrollHeight + 'px'
        end
      `);
    } else {
      el.setAttribute("_", `on click
        set hdrs to .accordion-header in my parentElement
        repeat for x in hdrs
          if x is not me then
            remove .active from x
            set panel to x.nextElementSibling
            set panel.style.maxHeight to null
          end
        end
        toggle .active on me
        set panel to me.nextElementSibling
        if panel.style.maxHeight then
          set panel.style.maxHeight to null
        else
          set panel.style.maxHeight to panel.scrollHeight + 'px'
        end
      `);
    }
    if (selected) {
      el.classList.add("active");
    }
    el.textContent = label;
    return el;
  }
  _createPanel(content) {
    const el = document.createElement("div");
    el.classList.add("accordion-panel");
    const p = document.createElement("p");
    p.innerHTML = content;
    el.appendChild(p);
    return el;
  }
  // _handleClick(e) {
  //   const {target} = e;
  //   const anchors = this.querySelectorAll('.wc-accordion .accordion-header');
  //   target.classList.toggle('active');
  //   const panel = target.nextElementSibling;
  //   if (panel.style.maxHeight) {
  //     panel.style.maxHeight = null;
  //   } else {
  //     panel.style.maxHeight = panel.scrollHeight + "px";
  //   }
  // }
  _moveDeclarativeOptions() {
    const options = this.querySelectorAll("option");
    if (options.length > 0) {
      this._items = [];
    }
    options.forEach((option) => {
      const item = {
        label: option.value,
        content: option.innerHTML.trim(),
        selected: option.hasAttribute("selected") || false
      };
      this._items.push(item);
    });
    Array.from(options).forEach((option) => option.remove());
  }
  _setActive() {
    setTimeout(() => {
      const anchors = this.querySelectorAll(".wc-accordion .accordion-header");
      anchors.forEach((anchor) => {
        if (anchor.classList.contains("active")) {
          const panel = anchor.nextElementSibling;
          panel.style.maxHeight = panel.scrollHeight + "px";
        }
      });
    }, 10);
  }
  _applyStyle() {
    const style = `
      .wc-accordion .accordion-header {
        background-color: var(--secondary-bg-color);
        color: var(--secondary-color);
        cursor: pointer;
        padding: 18px;
        width: 100%;
        border: none;
        border-radius: 0;
        text-align: left;
        outline: none;
        font-size: 15px;
        transition: 0.4s;
      }

      .wc-accordion .active,
      .wc-accordion .accordion-header:hover {
        background-color: var(--primary-bg-color);
      }

      .wc-accordion .accordion-header:after {
        content: '+';
        color: var(--secondary-color);
        font-weight: bold;
        float: right;
        margin-left: 5px;
        font-size: 18px;
        line-height: 1;
        text-align: center;
        width: 20px;
        height: 20px;
      }

      .wc-accordion .active:after {
        content: '-';
        color: var(--primary-color);
        font-size: 20px;
      }

      .wc-accordion .accordion-panel {
        padding: 0 18px;
        background-color: var(--component-bg-color);
        color: var(--component-color);
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.2s ease-out;
      }
    `.trim();
    this.loadStyle("wc-accordion-style", style);
  }
  _handleHelper(event, mode = "open") {
    const { detail } = event;
    const { selector, subSelector } = detail;
    const headerSelector = subSelector || ".accordion-header";
    const isArray = Array.isArray(selector);
    if (typeof selector === "string" || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach((tgt) => {
        if (tgt === this) {
          const btn = tgt?.querySelector(headerSelector);
          if (mode === "open") {
            if (btn?.classList.contains("active")) {
            } else {
              btn?.click();
            }
          } else if (mode === "close") {
            if (!btn?.classList.contains("active")) {
            } else {
              btn?.click();
            }
          } else if (mode === "toggle") {
            btn?.click();
          }
        }
      });
    } else {
      const btn = selector?.querySelector(headerSelector);
      btn?.click();
    }
  }
  _handleOpen(event) {
    this._handleHelper(event, "open");
  }
  _handleClose(event) {
    this._handleHelper(event, "close");
  }
  _handleToggle(event) {
    this._handleHelper(event, "toggle");
  }
  _wireEvents() {
    super._wireEvents();
    document.body.addEventListener("wc-accordion:open", this._handleOpen.bind(this));
    document.body.addEventListener("wc-accordion:close", this._handleClose.bind(this));
    document.body.addEventListener("wc-accordion:toggle", this._handleToggle.bind(this));
  }
  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener("wc-accordion:open", this._handleOpen.bind(this));
    document.body.removeEventListener("wc-accordion:close", this._handleClose.bind(this));
    document.body.removeEventListener("wc-accordion:toggle", this._handleToggle.bind(this));
  }
};
customElements.define("wc-accordion", WcAccordion);

// src/js/components/wc-background-image.js
var WcBackgroundImage = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "caption", "img-url", "min-height"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-background-image");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-background-image");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-background-image");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-background-image");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "items") {
      if (typeof newValue === "string") {
        this._items = JSON.parse(newValue);
      }
      this.removeAttribute("items");
    } else if (attrName === "caption") {
    } else if (attrName === "img-url") {
    } else if (attrName === "min-height") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerParts = this.querySelectorAll(".wc-background-image > *");
    if (innerParts.length > 0) {
      this.componentElement.innerHTML = "";
      innerParts.forEach((p) => this.componentElement.appendChild(p));
    } else {
      this.componentElement.innerHTML = "";
      const imgUrl = this.getAttribute("img-url") || "";
      const minHeight = this.getAttribute("min-height") || "100%";
      this.componentElement.style.backgroundImage = `url("${imgUrl}")`;
      this.componentElement.style.minHeight = minHeight;
      const el = this._createElement();
      this.componentElement.appendChild(el);
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-background-image");
  }
  _createElement() {
    const captionText = this.getAttribute("caption") || "";
    const caption = document.createElement("div");
    caption.classList.add("caption");
    const border = document.createElement("span");
    border.classList.add("border");
    border.textContent = captionText;
    caption.appendChild(border);
    return caption;
  }
  _applyStyle() {
    const style = `
      .wc-background-image {
        position: relative;
        opacity: 0.65;
        background-attachment: fixed;
        background-position: center;
        background-repeat: no-repeat;
        background-size: cover;
      }
      .wc-background-image .caption {
        position: absolute;
        left: 0;
        top: 50%;
        width: 100%;
        text-align: center;
        color: #000;
      }
      .wc-background-image .caption span.border {
        background-color: #111;
        color: #fff;
        padding: 18px;
        font-size: 25px;
        letter-spacing: 10px;
      }
      /* Turn off parallax scrolling for tablets and phones */
      /* @media only screen and (max-device-width: 1024px) { */
      @media (max-device-width: 768px) {
        .wc-background-image {
          background-attachment: scroll;
        }
      }      
    `.trim();
    this.loadStyle("wc-background-image-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-background-image", WcBackgroundImage);

// src/js/components/wc-code-mirror.js
var WcCodeMirror = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "height", "theme", "mode", "lbl-label", "lbl-class", "line-numbers", "line-wrapping", "fold-gutter", "tab-size", "indent-unit", "value", "disabled", "required"];
  }
  constructor() {
    super();
    this.childComponentName = "editor";
    this._isResizing = false;
    this._internals = this.attachInternals();
    this.firstContent = "";
    if (this.firstChild && this.firstChild.nodeName == "#text") {
      this.firstContent = this.firstChild.textContent;
      this.removeChild(this.firstChild);
    }
    const compEl = this.querySelector(".wc-code-mirror");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-code-mirror");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-code-mirror");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("conntectedCallback:wc-code-mirror");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  async _handleAttributeChange(attrName, newValue) {
    if (attrName === "lbl-class") {
      const name = this.getAttribute("name");
      const lbl = this.querySelector(`label[for="${name}"]`);
      lbl?.classList.add(newValue);
    } else if (attrName === "theme") {
      await this.loadTheme(newValue);
    } else if (attrName === "mode") {
      await this.loadMode(newValue);
    } else if (attrName === "height") {
      if (newValue) {
        this.editor.setSize(null, newValue);
      }
    } else if (attrName === "line-numbers") {
      if (newValue || newValue == "") {
        this.editor.setOption("lineNumbers", true);
      } else {
        this.editor.setOption("lineNumbers", false);
      }
      const gutters = await this.getGutters();
      this.editor.setOption("gutters", gutters);
    } else if (attrName === "line-wrapping") {
      if (newValue || newValue == "") {
        this.editor.setOption("lineWrapping", true);
      } else {
        this.editor.setOption("lineWrapping", false);
      }
    } else if (attrName === "fold-gutter") {
      if (newValue || newValue == "") {
        this.editor.setOption("foldGutter", true);
      } else {
        this.editor.setOption("foldGutter", false);
      }
      const gutters = await this.getGutters();
      this.editor.setOption("gutters", gutters);
    } else if (attrName === "tab-size") {
      this.editor.setOption("tabSize", parseInt(newValue, 10));
    } else if (attrName === "indent-unit") {
      this.editor.setOption("indentUnit", parseInt(newValue, 10));
    } else if (attrName === "value") {
      this.editor.setValue(newValue);
    } else if (attrName === "disabled") {
      if (this.hasAttribute("disabled")) {
        this.editor.setOption("readOnly", "nocursor");
      } else {
        this.editor.setOption("readOnly", false);
      }
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-code-mirror > *");
    if (innerEl) {
      const settingsIcon = this.querySelector(".settings-icon");
      settingsIcon.addEventListener("click", this._handleSettingsIconClick.bind(this));
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-code-mirror");
  }
  async _createInnerElement() {
    const labelText = this.getAttribute("lbl-label") || "";
    const name = this.getAttribute("name") || "";
    if (!name) {
      throw new Error("Name attribute must be provided.");
    }
    if (labelText) {
      const lblEl = document.createElement("label");
      const value = this.getAttribute("value") || "";
      lblEl.textContent = labelText;
      lblEl.setAttribute("for", name);
      this.componentElement.appendChild(lblEl);
    }
    this.editor = null;
    this.popoverId = `settings-popover-${this.getAttribute("name") || "wc-code-mirror"}`;
    const settingsIcon = document.createElement("button");
    settingsIcon.type = "button";
    settingsIcon.innerHTML = `
      <svg class="h-3 w-3" fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512">
        <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
      </svg>
    `.trim();
    settingsIcon.className = "settings-icon";
    settingsIcon.setAttribute("popovertarget", this.popoverId);
    settingsIcon.addEventListener("click", this._handleSettingsIconClick.bind(this));
    this.componentElement.appendChild(settingsIcon);
    const settingsPopover = document.createElement("div");
    settingsPopover.classList.add("settings-popover");
    settingsPopover.id = this.popoverId;
    settingsPopover.setAttribute("popover", "manual");
    this.componentElement.appendChild(settingsPopover);
    const initialValue = this.getAttribute("value") || this.firstContent || "";
    await Promise.all([
      this.loadCSS("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css"),
      this.loadLibrary("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.js", "CodeMirror")
    ]);
    await this.renderEditor(initialValue);
    this._internals.setFormValue(initialValue);
  }
  _handleSettingsIconClick(event) {
    const settingsPopover = this.querySelector(".settings-popover");
    this._buildSettingsPopover(settingsPopover);
  }
  _buildSettingsPopover(settingsPopover) {
    const hasLineNumbers = this.hasAttribute("line-numbers");
    const hasLineWrapper = this.hasAttribute("line-wrapper");
    const hasFoldGutter = this.hasAttribute("fold-gutter");
    const modes = [
      "apl",
      "asciiarmor",
      "asn.1",
      "asterisk",
      "brainfuck",
      "clike",
      "clojure",
      "cmake",
      "cobol",
      "coffeescript",
      "commonlisp",
      "crystal",
      "css",
      "cypher",
      "d",
      "dart",
      "diff",
      "django",
      "dockerfile",
      "dtd",
      "dylan",
      "ebnf",
      "ecl",
      "eiffel",
      "elm",
      "erlang",
      "factor",
      "fcl",
      "forth",
      "fortran",
      "gas",
      "gfm",
      "gherkin",
      "go",
      "groovy",
      "haml",
      "handlebars",
      "haskell",
      "haxe",
      "htmlembedded",
      "htmlmixed",
      "http",
      "idl",
      "javascript",
      "jinja2",
      "julia",
      "kotlin",
      "litespec",
      "livescript",
      "lua",
      "markdown",
      "mathematica",
      "mbox",
      "mirc",
      "mllike",
      "modelica",
      "mscgen",
      "mumps",
      "nginx",
      "nsis",
      "ntriples",
      "octave",
      "oz",
      "pascal",
      "perl",
      "php",
      "pig",
      "powershell",
      "properties",
      "protobuf",
      "pug",
      "puppet",
      "python",
      "q",
      "r",
      "rpm",
      "rst",
      "ruby",
      "rust",
      "sas",
      "sass",
      "scheme",
      "shell",
      "sieve",
      "slim",
      "smalltalk",
      "smarty",
      "solr",
      "soy",
      "sparql",
      "spreadsheet",
      "sql",
      "stex",
      "stylus",
      "swift",
      "tcl",
      "textile",
      "tiddlywiki",
      "tiki",
      "toml",
      "tornado",
      "troff",
      "ttcn",
      "ttcn-cfg",
      "turtle",
      "twig",
      "vb",
      "vbscript",
      "velocity",
      "verilog",
      "vhdl",
      "vue",
      "xml",
      "xquery",
      "yaml",
      "yaml-frontmatter",
      "z80"
    ];
    const themes = [
      "3024-day",
      "3024-night",
      "abcdef",
      "ambiance",
      "ayu-dark",
      "ayu-mirage",
      "base16-dark",
      "base16-light",
      "bespin",
      "blackboard",
      "cobalt",
      "colorforth",
      "default",
      "darcula",
      "dracula",
      "duotone-dark",
      "duotone-light",
      "eclipse",
      "elegant",
      "erlang-dark",
      "gruvbox-dark",
      "hopscotch",
      "icecoder",
      "idea",
      "isotope",
      "lesser-dark",
      "liquibyte",
      "lucario",
      "material",
      "material-darker",
      "material-palenight",
      "material-ocean",
      "mbo",
      "mdn-like",
      "midnight",
      "monokai",
      "moxer",
      "neat",
      "neo",
      "night",
      "nord",
      "oceanic-next",
      "panda-syntax",
      "paraiso-dark",
      "paraiso-light",
      "pastel-on-dark",
      "railscasts",
      "rubyblue",
      "seti",
      "shadowfox",
      "solarized",
      "ssms",
      "the-matrix",
      "tomorrow-night-bright",
      "tomorrow-night-eighties",
      "ttcn",
      "twilight",
      "vibrant-ink",
      "xq-dark",
      "xq-light",
      "yeti",
      "yonce",
      "zenburn"
    ];
    settingsPopover.innerHTML = `
      <div id="popover-form" class="popover-form col gap-3">
        <button id="closeButton" class="close-btn" type="button"
          popovertarget="${this.popoverId}" popovertargetaction="hide"
          >
          <span aria-hidden="true">X</span>
          <span class="sr-only">Close</span>
        </button>
        <div class="row gap-2">
          <wc-select class="col-1" name="theme-select" lbl-label="Theme" autofocus elt-class="w-full">
            ${themes.map((theme) => `<option value="${theme}" ${theme == this.getAttribute("theme") ? "selected" : ""}>${theme}</option>`).join("")}
          </wc-select>
          <wc-select class="col-1" name="mode-select" lbl-label="Mode" elt-class="w-full">
            ${modes.map((mode) => `<option value="${mode}" ${mode == this.getAttribute("mode") ? "selected" : ""}>${mode}</option>`).join("")}
          </wc-select>
        </div>
        <div class="row gap-2">
          <wc-input class="col-1" name="line-numbers" lbl-label="Line Numbers" ${hasLineNumbers ? "checked " : ""}type="checkbox"></wc-input>
          <wc-input class="col-1" name="line-wrapper" lbl-label="Line Wrapper" ${hasLineWrapper ? "checked " : ""}type="checkbox"></wc-input>
          <wc-input class="col-1" name="fold-gutter" lbl-label="Fold Gutter" ${hasFoldGutter ? "checked " : ""}type="checkbox"></wc-input>
        </div>
        <div class="row gap-2">
          <wc-input class="col-1" name="tab-size" lbl-label="Tab Size" value="${this.getAttribute("tab-size")}" type="number"></wc-input>
          <wc-input class="col-1" name="indent-unit" lbl-label="Indent Unit" value="${this.getAttribute("indent-unit")}" type="number"></wc-input>
        </div>
        <div class="row gap-2 justify-end gap-x-4">
          <button class="" id="apply-settings" type="submit">
            Apply
          </button>
          <button class="btn-clear" id="cancel-settings" type="button">
            Cancel
          </button>
        </div>
      </div>
    `;
    settingsPopover.querySelector("#closeButton").addEventListener("click", this._handleSettingsClose.bind(this), { once: true });
    settingsPopover.querySelector("#apply-settings").addEventListener("click", this._handleSettingsApply.bind(this), { once: true });
    settingsPopover.querySelector("#cancel-settings").addEventListener("click", this._handleSettingsClose.bind(this), { once: true });
  }
  _handleSettingsApply(event) {
    const settingsPopover = this.querySelector(".settings-popover");
    const close = settingsPopover.querySelector("#closeButton");
    const theme = settingsPopover.querySelector("#theme-select").value;
    const mode = settingsPopover.querySelector("#mode-select").value;
    const lineNumbers = settingsPopover.querySelector("#line-numbers").checked;
    const lineWrapper = settingsPopover.querySelector("#line-wrapper").checked;
    const foldGutter = settingsPopover.querySelector("#fold-gutter").checked;
    const tabSize = settingsPopover.querySelector("#tab-size").value;
    const indentUnit = settingsPopover.querySelector("#indent-unit").value;
    this.setAttribute("theme", theme);
    this.setAttribute("mode", mode);
    if (lineNumbers) {
      this.setAttribute("line-numbers", "");
    } else {
      this.removeAttribute("line-numbers");
    }
    if (lineWrapper) {
      this.setAttribute("line-wrapper", "");
    } else {
      this.removeAttribute("line-wrapper");
    }
    if (foldGutter) {
      this.setAttribute("fold-gutter", "");
    } else {
      this.removeAttribute("fold-gutter");
    }
    this.setAttribute("tab-size", tabSize);
    this.setAttribute("indent-unit", indentUnit);
    this._handleSettingsClose(event);
  }
  _handleSettingsClose(event) {
    event.preventDefault();
    const settingsPopover = this.querySelector(".settings-popover");
    settingsPopover.togglePopover();
    while (settingsPopover.firstChild) {
      settingsPopover.removeChild(settingsPopover.firstChild);
    }
  }
  get value() {
    return this.editor?.getValue() || "";
  }
  set value(val) {
    if (this.editor) {
      this.editor.setValue(val);
      this._internals.setFormValue(val);
    }
  }
  _applyStyle() {
    const style = `
      /* Container using flex or grid layout */
      .editor-container-flex {
        display: flex;
        gap: 10px;
        height: calc(100vh - 60px); /* Adjust for the header height */
        width: 100%;
        flex-wrap: wrap;
      }

      .editor-container-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 10px;
        height: calc(100vh - 60px); /* Adjust for the header height */
        width: 100%;
      }

      /* Ensure that each editor fills its container */
      wc-code-mirror {
        display: block;
        height: 100%;
        width: 100%;
      }

      .wc-code-mirror {
        position: relative;
        width: 100%;
        display: flex;
        flex-direction: column;
        border: 2px solid transparent;

        overflow: hidden;
        resize: vertical;
  
        min-height: 10em;        
      }
      .wc-code-mirror:focus-within {
        border: 2px solid var(--primary-bg-color);
      }

      .CodeMirror {
        height: auto;
        min-height: 150px;
        width: 100%;
        box-sizing: border-box; /* Avoid overflow caused by padding or borders */
        overflow: auto; /* Scroll within the editor */
      }
      
      .settings-icon {
        background: none;
        border: none;
        position: absolute;
        top: 2px;
        right: 5px;
        padding: 0;
        cursor: pointer;
        color: gray;
        font-size: 1.5em;
        z-index: 1;
      }

      .settings-popover {
        background: transparent;
        position: absolute;
        left: 0;
        right: 0;
        padding: 0;
        margin: 0 auto;
        height: 100%;
        width: 100%;
        border: none;
        display: flex;
        justify-items: center;
        align-items: center;
      }


      .settings-popover::backdrop {
        background: rgb(190 190 190 / 50%);
      }


      #popover-form {
        position: relative;
        padding: 20px;
        margin: 0 auto;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .close-btn {
        color: gray;
        border: none;
        background: none;
        position: absolute;
        right: 0.5rem;
        top: 0.5rem;
        padding: 0;
        cursor: pointer;
      }

      .sr-only:not(:focus):not(:active) {
        clip: rect(0 0 0 0); 
        clip-path: inset(50%);
        height: 1px;
        overflow: hidden;
        position: absolute;
        white-space: nowrap; 
        width: 1px;
      }
    `.trim();
    this.loadStyle("wc-code-mirror-style", style);
  }
  async renderEditor(initialValue) {
    await Promise.all([
      this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/search/searchcursor.min.js"),
      this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/keymap/sublime.min.js"),
      this.loadScript("https://cdn.jsdelivr.net/npm/cm-show-invisibles@3.1.0/lib/show-invisibles.min.js")
    ]);
    const gutters = await this.getGutters();
    this.editor = CodeMirror(this.componentElement, {
      mode: this.getAttribute("mode") || "javascript",
      theme: this.getAttribute("theme") || "default",
      lineNumbers: this.hasAttribute("line-numbers"),
      lineWrapper: this.hasAttribute("line-wrapper"),
      foldGutter: this.hasAttribute("fold-gutter"),
      gutters,
      extraKeys: {
        "Ctrl-Q": function(cm) {
          cm.foldCode(cm.getCursor());
        },
        "Tab": (cm) => {
          if (cm.somethingSelected()) {
            cm.indentSelection("add");
          } else {
            var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
            cm.replaceSelection(spaces);
          }
        }
      },
      value: initialValue,
      tabSize: parseInt(this.getAttribute("tab-size"), 10) || 4,
      indentUnit: parseInt(this.getAttribute("indent-unit"), 10) || 2,
      matchBrackets: true,
      keyMap: "sublime",
      showInvisibles: true
    });
    await this.loadAssets(this.getAttribute("theme"), this.getAttribute("mode"));
    this.editor.on("change", async () => {
      const value = this.editor.getValue();
      this._internals.setFormValue(value);
      const gutters2 = await this.getGutters();
      this.editor.setOption("gutters", gutters2);
    });
  }
  // This is required to inform the form that the component can be form-associated
  static get formAssociated() {
    return true;
  }
  // Method called when the form is reset
  formResetCallback() {
    this.editor.setValue("");
  }
  // Method called when the form state is restored (for example, after back/forward navigation)
  formStateRestoreCallback(state) {
    if (state) {
      this.editor.setValue(state);
    }
  }
  // Optional: Handle disabled state when the form element is disabled
  formDisabledCallback(isDisabled) {
    if (this.editor) {
      this.editor.setOption("readOnly", isDisabled);
    }
  }
  async getGutters() {
    if (this.hasAttribute("fold-gutter")) {
      await this.loadCSS("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldgutter.min.css"), await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldcode.min.js"), await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldgutter.min.js"), await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/brace-fold.min.js"), await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/comment-fold.min.js"), await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/indent-fold.min.js"), await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/xml-fold.min.js"), await this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/edit/matchbrackets.min.js");
    }
    let gutters = [];
    const hasLineNumbers = this.hasAttribute("line-numbers");
    const hasFoldGutter = this.hasAttribute("fold-gutter");
    if (hasLineNumbers && hasFoldGutter) {
      gutters = ["CodeMirror-linenumbers", "CodeMirror-foldgutter"];
    } else if (hasFoldGutter) {
      gutters = ["CodeMirror-foldgutter"];
    }
    return gutters;
  }
  async loadAssets(theme, mode) {
    if (theme && theme !== "default") {
      await this.loadTheme(theme);
    }
    if (mode) {
      await this.loadMode(mode);
    }
  }
  async loadTheme(theme) {
    if (!theme || theme === "default") return;
    const themeUrl = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/${theme}.min.css`;
    if (!document.querySelector(`link[href="${themeUrl}"]`)) {
      await this.loadCSS(themeUrl);
    }
    this.editor.setOption("theme", theme);
  }
  async loadMode(mode) {
    const modeDependencies = {
      "htmlmixed": ["xml", "css", "javascript"],
      "php": ["htmlmixed", "xml", "css", "javascript"],
      "htmlembedded": ["xml", "javascript"],
      "markdown": ["htmlmixed", "xml", "css", "javascript"]
    };
    const dependencies = modeDependencies[mode];
    if (dependencies && dependencies.length > 0) {
      for (const modeName of dependencies) {
        await this.loadScript(`https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/${modeName}/${modeName}.min.js`);
      }
    }
    if (mode === "litespec") {
      CodeMirror.registerHelper("fold", "litespec", function(cm, start) {
        var line = start.line;
        var lineText = cm.getLine(line);
        var startChar = lineText.indexOf("{");
        if (startChar === -1) return;
        var tokenType = cm.getTokenTypeAt(CodeMirror.Pos(line, startChar + 1));
        if (tokenType !== "brace") return;
        var match = cm.findMatchingBracket(CodeMirror.Pos(line, startChar + 1));
        if (!match || !match.match || match.to === null) return;
        const result = {
          from: CodeMirror.Pos(line, startChar + 1),
          // Fold start
          to: match.to
          // Fold end        
        };
        return result;
      });
      this.editor.setOption("foldOptions", { widget: "\u2194" });
      const addonModeDependencies = {
        "litespec": ["simple"]
      };
      const addonDependencies = addonModeDependencies[mode];
      if (addonDependencies && addonDependencies.length > 0) {
        for (const modeName of addonDependencies) {
          await this.loadScript(`https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/mode/${modeName}.min.js`);
        }
      }
      const customModes = ["litespec"];
      if (customModes.includes(mode)) {
        const modeUrl2 = "https://mattduffield.github.io/lite-spec/dist/highlighters/litespec.mode.cm.js";
        await this.loadScript(modeUrl2);
        this.editor.setOption("mode", mode);
        return;
      }
    }
    const modeUrl = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/${mode}/${mode}.min.js`;
    if (!document.querySelector(`script[src="${modeUrl}"]`)) {
      await this.loadScript(modeUrl);
    }
    this.editor.setOption("mode", mode);
  }
  _unWireEvents() {
    super._unWireEvents();
    const settingsIcon = this.querySelector(".settings-icon");
    settingsIcon.removeEventListener("click", this._handleSettingsIconClick.bind(this));
  }
};
customElements.define("wc-code-mirror", WcCodeMirror);

// src/js/components/wc-div.js
var WcDiv = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-div");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-div");
      this.appendChild(this.componentElement);
    }
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "items") {
      if (typeof newValue === "string") {
        this._items = JSON.parse(newValue);
      }
      this.removeAttribute("items");
    } else if (attrName === "caption") {
    } else if (attrName === "img-url") {
    } else if (attrName === "min-height") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerParts = this.querySelectorAll(".wc-div > *");
    if (innerParts.length > 0) {
      this.componentElement.innerHTML = "";
      innerParts.forEach((p) => this.componentElement.appendChild(p));
    } else {
      this.componentElement.innerHTML = "";
      this._moveDeclarativeInner();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
  }
  _moveDeclarativeInner() {
    const innerParts = this.querySelectorAll("wc-div > *:not(.wc-div)");
    if (innerParts.length > 0) {
      innerParts.forEach((p) => this.componentElement.appendChild(p));
    }
  }
  _applyStyle() {
    const style = `
      .wc-div {
        position: relative;
        display: block;
      }
    `.trim();
    this.loadStyle("wc-div-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-div", WcDiv);

// src/js/components/wc-dropdown.js
var WcDropdown = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "label", "mode"];
  }
  constructor() {
    super();
    this.clickModes = ["search", "click"];
    this.mode = this.getAttribute("mode") || "click";
    const compEl = this.querySelector(".wc-dropdown");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-dropdown", "dropdown", this.mode);
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-dropdown");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
    console.log("connectedCallback:wc-dropdown");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "label") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-dropdown > *");
    if (innerEl) {
      const btn = this.querySelector(".dropbtn");
      if (this.clickModes.includes(this.mode)) {
        btn.addEventListener("click", this._handleClick.bind(this));
        window.addEventListener("click", this._handleWindowClick.bind(this));
        const ipt = this.querySelector(".search");
        if (ipt) {
          ipt.addEventListener("input", this._handleInput.bind(this));
        }
      }
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-dropdown");
  }
  _createInnerElement() {
    const lbl = this.getAttribute("label") || "Dropdown";
    const btn = document.createElement("button");
    btn.classList.add("dropbtn");
    btn.textContent = lbl;
    this.componentElement.appendChild(btn);
    const dropdownContent = document.createElement("div");
    dropdownContent.classList.add("dropdown-content");
    if (this.mode === "search") {
      const ipt = document.createElement("input");
      ipt.classList.add("search", "component");
      ipt.type = "search";
      ipt.setAttribute("placeholder", "Search...");
      dropdownContent.appendChild(ipt);
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, "svg");
      svg.setAttribute("xmlns", svgNS);
      svg.setAttribute("fill", "none");
      svg.setAttribute("viewBox", "0 0 24 24");
      svg.setAttribute("stroke-width", "1.5");
      svg.setAttribute("stroke", "currentColor");
      svg.classList.add("h-4", "w-4", "component");
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("d", "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z");
      svg.appendChild(path);
      dropdownContent.appendChild(svg);
      ipt.addEventListener("input", this._handleInput.bind(this));
    }
    const parts = this.querySelectorAll("a");
    parts.forEach((p) => dropdownContent.appendChild(p));
    this.componentElement.appendChild(dropdownContent);
    if (this.clickModes.includes(this.mode)) {
      btn.addEventListener("click", this._handleClick.bind(this));
      window.addEventListener("click", this._handleWindowClick.bind(this));
    }
  }
  _handleHelper(event, mode = "open") {
    const { detail } = event;
    const { selector } = detail;
    const triggerSelector = ".wc-dropdown";
    const isArray = Array.isArray(selector);
    if (typeof selector === "string" || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach((tgt) => {
        if (tgt === this) {
          const elt = tgt?.querySelector(triggerSelector);
          if (mode === "open") {
            elt?.classList.add("show");
          } else if (mode === "close") {
            elt?.classList.remove("show");
          } else if (mode === "toggle") {
            elt?.classList.toggle("show");
          }
        }
      });
    } else {
      const elt = selector?.querySelector(triggerSelector);
      if (mode === "open") {
        elt?.classList.add("show");
      } else if (mode === "close") {
        elt?.classList.remove("show");
      } else if (mode === "toggle") {
        elt?.classList.toggle("show");
      }
    }
  }
  _handleOpen(event) {
    this._handleHelper(event, "open");
  }
  _handleClose(event) {
    this._handleHelper(event, "close");
  }
  _handleToggle(event) {
    this._handleHelper(event, "toggle");
  }
  _handleClick(event) {
    const { target } = event;
    const parent = target.closest(".wc-dropdown");
    parent.classList.toggle("show");
  }
  _handleWindowClick(event) {
    const { target } = event;
    if (target.matches(".dropbtn") || target.matches(".search")) return;
    const parts = this.querySelectorAll(".dropdown");
    parts.forEach((p) => p.classList.remove("show"));
  }
  _handleInput(event) {
    const { target } = event;
    const filter = target.value.toLowerCase();
    const parts = this.querySelectorAll(".dropdown-content > *:not(.component)");
    parts.forEach((p) => {
      if (p.textContent.toLowerCase().includes(filter)) {
        p.style.display = "block";
      } else {
        p.style.display = "none";
      }
    });
  }
  _applyStyle() {
    const style = `
      /* Dropdown Button */
      .wc-dropdown .dropbtn {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
        padding: 16px;
        font-size: 16px;
        border: none;
        border-radius: 0;
      }

      /* The container <div> - needed to position the dropdown content */
      .wc-dropdown.dropdown {
        position: relative;
        display: inline-block;
      }

      /* Dropdown Content (Hidden by Default) */
      .wc-dropdown .dropdown-content {
        display: none;
        position: absolute;
        background-color: var(--component-bg-color);
        min-width: 160px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
      }

      .wc-dropdown .search {
        width: 100%;
        box-sizing: border-box;
        font-size: 12px;
        padding: 14px 20px 12px 35px;
      }
      .wc-dropdown svg {
        position: absolute;
        left: 8px;
        top: 20px;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        stroke: var(--component-color);
        pointer-events: none;
      }

      /* Links inside the dropdown */
      .wc-dropdown .dropdown-content a {
        color: var(--component-color);
        padding: 12px 16px;
        text-decoration: none;
        display: block;
      }

      /* Change color of dropdown links on hover */
      .wc-dropdown .dropdown-content a:hover {
        background-color: var(--component-border-color);
      }

      /* Show the dropdown menu on hover */
      .wc-dropdown.dropdown:hover:not(.click):not(.search) .dropdown-content {
        display: block;
      }
      .wc-dropdown.dropdown.show .dropdown-content {
        display: block;
      }

      /* Change the background color of the dropdown button when the dropdown content is shown */
      .wc-dropdown.dropdown:hover:not(.click):not(.search) .dropbtn {
        background-color: var(--secondary-bg-color);
      }
      .wc-dropdown.dropdown.show .dropbtn {
        background-color: var(--secondary-bg-color);
      }
    `.trim();
    this.loadStyle("wc-dropdown-style", style);
  }
  _wireEvents() {
    super._wireEvents();
    if (this.clickModes.includes(this.mode)) {
      document.body.addEventListener("wc-dropdown:open", this._handleOpen.bind(this));
      document.body.addEventListener("wc-dropdown:close", this._handleClose.bind(this));
      document.body.addEventListener("wc-dropdown:toggle", this._handleToggle.bind(this));
    }
  }
  _unWireEvents() {
    super._unWireEvents();
    if (this.clickModes.includes(this.mode)) {
      document.body.removeEventListener("wc-dropdown:open", this._handleOpen.bind(this));
      document.body.removeEventListener("wc-dropdown:close", this._handleClose.bind(this));
      document.body.removeEventListener("wc-dropdown:toggle", this._handleToggle.bind(this));
      const btn = this.querySelector(".dropbtn");
      btn.removeEventListener("click", this._handleClick.bind(this));
      window.removeEventListener("click", this._handleWindowClick.bind(this));
      const ipt = this.querySelector(".search");
      if (ipt) {
        ipt.removeEventListener("input", this._handleInput.bind(this));
      }
    }
  }
};
customElements.define("wc-dropdown", WcDropdown);

// src/js/components/wc-flip-box.js
var WcFlipBox = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-flip-box");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-flip-box");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-flip-box");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-flip-box");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  // _handleAttributeChange(attrName, newValue) {    
  //   if (attrName === 'height') {
  //     this.height = newValue;
  //   } else if (attrName === 'width') {
  //     this.width = newValue;
  //   } else {
  //     super._handleAttributeChange(attrName, newValue);  
  //   }
  // }
  _render() {
    super._render();
    const innerEl = this.querySelector(".flip-box-inner");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      const innerEl2 = this._createInnerElement();
      this.componentElement.appendChild(innerEl2);
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-flip-box");
  }
  _createInnerElement() {
    const flipBoxInner = document.createElement("div");
    flipBoxInner.classList.add("flip-box-inner");
    const front = this.querySelector('[slot="front"]');
    const back = this.querySelector('[slot="back"]');
    if (front) {
      front.classList.add("flip-box-front");
      flipBoxInner.appendChild(front);
    }
    if (back) {
      back.classList.add("flip-box-back");
      flipBoxInner.appendChild(back);
    }
    this.componentElement.appendChild(flipBoxInner);
    return flipBoxInner;
  }
  _applyStyle() {
    const style = `
      /* The flip box container - set the width and height to whatever you want. We have added the border property to demonstrate that the flip itself goes out of the box on hover (remove perspective if you don't want the 3D effect */
      .wc-flip-box {
        background-color: transparent;
        /*
        width: 300px;
        height: 200px;
        */
        border: 1px solid var(--component-border-color);
        perspective: 1000px; /* Remove this if you don't want the 3D effect */
      }

      /* This container is needed to position the front and back side */
      .wc-flip-box .flip-box-inner {
        position: relative;
        width: 100%;
        height: 100%;
        text-align: center;
        transition: transform 0.8s;
        transform-style: preserve-3d;
      }

      /* Do an horizontal flip when you move the mouse over the flip box container */
      .wc-flip-box:hover .flip-box-inner {
        transform: rotateY(180deg);
      }

      /* Position the front and back side */
      .wc-flip-box .flip-box-front,
      .wc-flip-box .flip-box-back {
        position: absolute;
        width: 100%;
        height: 100%;
        -webkit-backface-visibility: hidden; /* Safari */
        backface-visibility: hidden;
      }

      /* Style the front side */
      .wc-flip-box .flip-box-front {
        background-color: var(--bg-color);
        color: var(--color);
      }

      /* Style the back side */
      .wc-flip-box .flip-box-back {
        background-color: var(--bg-color);
        color: var(--color);
        transform: rotateY(180deg);
      }`.trim();
    this.loadStyle("wc-flip-box-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-flip-box", WcFlipBox);

// src/js/components/wc-image.js
var WcImage = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "url", "caption", "modal", "hover-overlay", "hover-mode"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-image");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-image");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-image");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
    console.log("connectedCallback:wc-image");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "url") {
    } else if (attrName === "caption") {
    } else if (attrName === "modal") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-image > *");
    if (innerEl) {
      if (this.hasAttribute("modal")) {
        const imgEl = this.querySelector(".img");
        imgEl.addEventListener("click", this._showModal.bind(this));
        const closeBtn = this.querySelector(".overlay .closebtn");
        closeBtn.addEventListener("click", this._hideModal.bind(this));
      }
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-image");
  }
  _createInnerElement() {
    const caption = this.getAttribute("caption") || "";
    const imgEl = document.createElement("img");
    imgEl.classList.add("img");
    imgEl.src = this.getAttribute("url") || "";
    imgEl.alt = caption;
    const captionEl = document.createElement("div");
    captionEl.textContent = caption;
    captionEl.classList.add("img-text");
    this.componentElement.appendChild(imgEl);
    this.componentElement.appendChild(captionEl);
    if (this.hasAttribute("hover-overlay")) {
      const hoverMode = this.getAttribute("hover-mode") || "bottom";
      const hoverOverlay = document.createElement("div");
      hoverOverlay.classList.add("hover-overlay", hoverMode);
      const parts = this.querySelectorAll("wc-image > *:not(.wc-image");
      parts.forEach((p) => hoverOverlay.appendChild(p));
      this.componentElement.appendChild(hoverOverlay);
    }
    const overlay = document.createElement("div");
    overlay.classList.add("overlay", "hidden");
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("closebtn");
    closeBtn.innerHTML = "&times;";
    overlay.appendChild(closeBtn);
    const overlayImg = document.createElement("img");
    overlayImg.classList.add("overlay-img");
    overlayImg.alt = caption;
    overlay.appendChild(overlayImg);
    const overlayCaption = document.createElement("div");
    overlayCaption.textContent = caption;
    overlayCaption.classList.add("overlay-img-text");
    overlay.appendChild(overlayCaption);
    this.appendChild(overlay);
    if (this.hasAttribute("modal")) {
      imgEl.addEventListener("click", this._showModal.bind(this));
      closeBtn.addEventListener("click", this._hideModal.bind(this));
    }
  }
  _handleHelper(event, mode = "show") {
    const { detail } = event;
    const { selector } = detail;
    const isArray = Array.isArray(selector);
    if (typeof selector === "string" || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach((tgt) => {
        if (tgt === this) {
          if (mode === "show") {
            this._showModal({ target: this });
          } else if (mode === "hide") {
            this._hideModal({ target: this });
          }
        }
      });
    } else {
      if (selector === this) {
        if (mode === "show") {
          this._showModal({ target: this });
        } else if (mode === "hide") {
          this._hideModal({ target: this });
        }
      }
    }
  }
  _handleShow(event) {
    this._handleHelper(event, "show");
  }
  _handleHide(event) {
    this._handleHelper(event, "hide");
  }
  _showModal(event) {
    const { target } = event;
    const overlay = this.querySelector(".overlay");
    if (overlay) {
      const img = this.querySelector("img:not(.overlay-img)");
      const overlayImg = this.querySelector(".overlay-img");
      overlayImg.src = img.src;
      overlay.classList.remove("hidden");
      overlay.classList.add("show");
    }
  }
  _hideModal(event) {
    const { target } = event;
    const overlay = this.querySelector(".overlay");
    if (overlay) {
      overlay.classList.remove("show");
      overlay.classList.add("hidden");
    }
  }
  _applyStyle() {
    const style = `
      wc-image .wc-image {
        position: relative;
      }
      wc-image .wc-image .img {
        max-height: 300px;
        width: 100%;
        height: auto;
        object-fit: cover;
        transition: 0.3s;
      }
      wc-image[modal]:not([hover-overlay]) .wc-image .img {
        cursor: pointer;
      }
      wc-image[modal]:not([hover-overlay]) .wc-image .img:hover {
        opacity: 0.7;
      }
      wc-image .wc-image .img-text {
        color: #f2f2f2;
        font-size: 15px;
        padding: 8px 12px;
        position: absolute;
        bottom: 8px;
        width: 100%;
        text-align: center;
      }
      /* Overlay */
      wc-image .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        padding-top: 100px;
        background-color: transparent;
        transition: background-color 0.5s ease;
      }
      wc-image .overlay.show {
        background-color: rgba(0,0,0,0.8);
        z-index: 1;
      }
      wc-image .overlay .closebtn {
        position: absolute;
        top: 10px;
        right: 10px;
        font-size: 40px;
        background-color: transparent;
      }
      wc-image .overlay .overlay-img {
        margin: auto;
        display: block;
        width: 80%;
        max-width: 700px;
      }
      wc-image .overlay .overlay-img-text {
        color: #f2f2f2;
        font-size: 36px;
        padding: 8px 12px;
        position: absolute;
        width: 100%;
        text-align: center;
      }
      wc-image .overlay .overlay-img,
      wc-image .overlay .overlay-img-text {
        animation-name: img-zoom;
        animation-duration: 0.6s;
      }
      /* Hover Overlay */
      wc-image[hover-overlay] .hover-overlay.top {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
        width: 100%;
        height:0;
        transition: .5s ease;
      }
      wc-image[hover-overlay] .wc-image:hover .hover-overlay.top {
        top: 0;
        height: 100%;
      }
      wc-image[hover-overlay] .hover-overlay.bottom {
        position: absolute;
        bottom: 100%;
        left: 0;
        right: 0;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
        width: 100%;
        height:0;
        transition: .5s ease;
      }
      wc-image[hover-overlay] .wc-image:hover .hover-overlay.bottom {
        bottom: 0;
        height: 100%;
      }
      wc-image[hover-overlay] .hover-overlay.left {
        position: absolute;
        bottom: 0;
        left: 100%;
        right: 0;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
        width: 0;
        height: 100%;
        transition: .5s ease;
      }
      wc-image[hover-overlay] .wc-image:hover .hover-overlay.left {
        left: 0;
        width: 100%;
      }
      wc-image[hover-overlay] .hover-overlay.right {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 100%;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
        width: 0;
        height: 100%;
        transition: .5s ease;
      }
      wc-image[hover-overlay] .wc-image:hover .hover-overlay.right {
        right: 0;
        width: 100%;
      }

      @keyframes img-zoom {
        from { transform: scale(0); }
        to { transform: scale(1); }
      }
    `.trim();
    this.loadStyle("wc-image-style", style);
  }
  _wireEvents() {
    super._wireEvents();
    if (this.hasAttribute("modal")) {
      document.body.addEventListener("wc-image:show", this._handleShow.bind(this));
      document.body.addEventListener("wc-image:hide", this._handleHide.bind(this));
    }
  }
  _unWireEvents() {
    super._unWireEvents();
    if (this.hasAttribute("modal")) {
      document.body.removeEventListener("wc-image:show", this._handleShow.bind(this));
      document.body.removeEventListener("wc-image:hide", this._handleHide.bind(this));
      const imgEl = this.querySelector(".img");
      imgEl.removeEventListener("click", this._showModal.bind(this));
      const closeBtn = this.querySelector(".overlay .closebtn");
      closeBtn.removeEventListener("click", this._hideModal.bind(this));
    }
  }
};
customElements.define("wc-image", WcImage);

// src/js/components/wc-list-skeleton.js
if (!customElements.get("wc-list-skeleton")) {
  class WcListSkeleton extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class"];
    }
    constructor() {
      super();
      const compEl = this.querySelector(".wc-list-skeleton");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-list-skeleton");
        this._createElement();
        this.appendChild(this.componentElement);
      }
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }
    _handleAttributeChange(attrName, newValue) {
      if (attrName === "items") {
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }
    _createElement() {
      this.componentElement.id = "list-skeleton";
      this.componentElement.setAttribute("role", "status");
      this.componentElement.className = "max-w-md p-4 space-y-4 border border-gray-200 divide-y divide-gray-200 rounded shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700";
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div>
            <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-600 w-24 mb-2.5"></div>
            <div class="w-32 h-2 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          </div>
          <div class="h-2.5 bg-gray-300 rounded-full dark:bg-gray-700 w-12"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }
    _applyStyle() {
      const style = `
        .wc-div {
          position: relative;
          display: block;
        }
      `.trim();
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-list-skeleton", WcListSkeleton);
}

// src/js/components/wc-menu.js
var WcMenu = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "path", "wrap"];
  }
  constructor() {
    super();
    this._items = [];
    const compEl = this.querySelector(".wc-menu");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-menu");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-menu");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
    console.log("connectedCallback:wc-menu");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "items") {
      if (typeof newValue === "string") {
        this._items = JSON.parse(newValue);
      }
      this.removeAttribute("items");
    } else if (attrName === "wrap") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-menu > *");
    if (innerEl) {
      const links = this.querySelectorAll(".menu-link");
      links.forEach((link) => link.addEventListener("click", this._handleClick.bind(this)));
      const menuIcon = this.querySelector(".menu-toggle");
      menuIcon.addEventListener("click", this._handleMenuToggle.bind(this));
      this._setActiveLink();
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
      this._setActiveLink();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-menu");
  }
  _createInnerElement() {
    this._moveDeclarativeOptions();
    const menuDiv = document.createElement("div");
    menuDiv.classList.add("menu-items");
    if (this.hasAttribute("wrap")) {
      menuDiv.classList.add("flex-wrap");
    }
    this._items.forEach((item) => {
      const link = this._createAnchor(item.name, item.label, item.selected);
      menuDiv.appendChild(link);
    });
    const hamburgerDiv = document.createElement("div");
    hamburgerDiv.classList.add("menu-toggle");
    const menuIcon = document.createElement("a");
    menuIcon.href = "javascript:void(0);";
    menuIcon.classList.add("icon", "row");
    menuIcon.id = "menuIcon";
    menuIcon.innerHTML = `
        <svg class="h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z"/>
        </svg>
    `.trim();
    menuIcon.addEventListener("click", this._handleMenuToggle.bind(this));
    this.componentElement.appendChild(menuDiv);
    hamburgerDiv.appendChild(menuIcon);
    this.componentElement.appendChild(hamburgerDiv);
  }
  _moveDeclarativeOptions() {
    const options = this.querySelectorAll("option");
    if (options.length > 0) {
      this._items = [];
    }
    options.forEach((option) => {
      const item = {
        name: option.value,
        label: option.textContent.trim(),
        selected: option.hasAttribute("selected") || false
      };
      this._items.push(item);
    });
    Array.from(options).forEach((option) => option.remove());
  }
  _createAnchor(viewName, viewLabel, selected) {
    const path = this.getAttribute("path") || "/static/views/";
    const el = document.createElement("a");
    el.classList.add("menu-link");
    if (selected) {
      el.classList.add("active");
    }
    el.dataset.name = viewName;
    el.textContent = viewLabel;
    el.setAttribute("href", `${path}${viewName}.html`);
    el.setAttribute("hx-get", `${path}${viewName}.html`);
    el.setAttribute("hx-trigger", "click");
    el.setAttribute("hx-target", "#viewport");
    el.setAttribute("hx-swap", "innerHTML transition:true");
    el.setAttribute("hx-push-url", `${path}${viewName}.html`);
    el.setAttribute("hx-select", "#page-contents");
    el.addEventListener("click", this._handleClick.bind(this));
    return el;
  }
  _setActiveLink() {
    const selectedName = this._getCurrentRoute();
    const anchors = this.querySelectorAll(".wc-menu a");
    if (selectedName) {
      anchors.forEach((anchor) => {
        if (anchor.dataset.name === selectedName) {
          anchor.classList.add("active");
        } else {
          anchor.classList.remove("active");
        }
      });
    } else {
      if (anchors.length > 0) {
        anchors.forEach((anchor) => anchor.classList.remove("active"));
        anchors[0].classList.add("active");
      }
    }
  }
  _getCurrentRoute() {
    const path = window.location.pathname;
    const page = path.split("/").pop();
    const pageWithoutExtension = page.split(".").shift();
    return pageWithoutExtension;
  }
  _handleHelper(event, mode = "click") {
    const { detail } = event;
    const { selector, subSelector } = detail;
    const isArray = Array.isArray(selector);
    if (typeof selector === "string" || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach((tgt) => {
        if (tgt === this) {
          if (mode === "click") {
            const menu = this.querySelector(subSelector);
            menu?.click();
          }
        }
      });
    } else {
      if (selector === this) {
        if (mode === "click") {
          const menu = this.querySelector(subSelector);
          menu?.click();
        }
      }
    }
  }
  _handleOnClick(event) {
    this._handleHelper(event, "click");
  }
  _handleClick(event) {
    const { target } = event;
    const anchors = this.querySelectorAll(".wc-menu a:not(.icon)");
    anchors.forEach((a) => a.classList.remove("active"));
    target.classList.add("active");
  }
  _handleMenuToggle(event) {
    const { target } = event;
    target.classList.toggle("open");
    const menu = this.querySelector("wc-menu .wc-menu");
    menu.classList.toggle("open");
  }
  _applyStyle() {
    const style = `
      wc-menu .wc-menu {
        position: relative;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        background-color: var(--secondary-bg-color);
        overflow: hidden;
      }
      wc-menu .wc-menu .menu-items {
        display: flex;
        flex-direction: row;
      }
      wc-menu .wc-menu a {
        color: var(--secondary-color);
        text-align: center;
        padding: 14px 16px;
        text-decoration: none;
        font-size: 17px;
        opacity: 0.75;
        user-select: none;
      }
      wc-menu .wc-menu a:hover {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
        opacity: 1;
      }
      wc-menu .wc-menu a.active {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
        opacity: 1;
      }
      wc-menu .wc-menu a.icon {
        display: none;
      }
      @media (max-width: 600px) {
        wc-menu .wc-menu a:not(.active) {
          display: none;
        }
        wc-menu .wc-menu a.icon {
          display: block;
        }
      }
      @media (max-width: 600px) {
        wc-menu .wc-menu.open {
          position: relative;
        }
        wc-menu .wc-menu.open .menu-items {
          flex-direction: column;
          flex: 1 1 0%;
        }
        wc-menu .wc-menu.open a:active {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          opacity: 1;
        }
        wc-menu .wc-menu.open .icon {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          opacity: 1;
          position: absolute;
          right: 0;
          top: 0;
        }
        wc-menu .wc-menu.open a {
          float: none;
          display: block;
          text-align: left;
        }
      }
    `.trim();
    this.loadStyle("wc-menu-style", style);
  }
  _wireEvents() {
    super._wireEvents();
    document.body.addEventListener("wc-menu:click", this._handleOnClick.bind(this));
  }
  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener("wc-menu:click", this._handleOnClick.bind(this));
    const links = this.querySelectorAll(".menu-link");
    links.forEach((link) => link.removeEventListener("click", this._handleClick.bind(this)));
    const menuIcon = this.querySelector(".menu-toggle");
    menuIcon.removeEventListener("click", this._handleMenuToggle.bind(this));
  }
};
customElements.define("wc-menu", WcMenu);

// src/js/components/wc-save-button.js
if (!customElements.get("wc-save-button")) {
  class WcSaveButton extends WcBaseComponent {
    static get observedAttributes() {
      return [];
    }
    constructor() {
      super();
      this._items = [];
      const compEl = this.querySelector(".wc-save-button");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        const id = this.getAttribute("id") || "";
        const saveUrl = this.getAttribute("save-url") || "";
        this.classList.add("contents");
        this.componentElement = document.createElement("button");
        this.componentElement.id = id;
        this.removeAttribute("id");
        this.componentElement.textContent = "Save";
        this.componentElement.classList.add("wc-save-button");
        this.componentElement.setAttribute("hx-target", "#viewport");
        this.componentElement.setAttribute("hx-swap", "innerHTML transition:true");
        this.componentElement.setAttribute("hx-indicator", "#content-loader");
        this.componentElement.setAttribute("hx-post", saveUrl);
        this.removeAttribute("save-url");
        this.componentElement.setAttribute("hx-push-url", "true");
        this.appendChild(this.componentElement);
      }
      console.log("ctor:wc-save-button");
    }
    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
      console.log("connectedCallback:wc-save-button");
    }
    disconnectedCallback() {
      this._unWireEvents();
    }
    _handleAttributeChange(attrName, newValue) {
      super._handleAttributeChange(attrName, newValue);
    }
    _applyStyle() {
      const style = `
        .wc-save-button {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          border: none;
          outline: none;
          border-radius: 0.375rem;
        }
        .wc-save-button:hover  {
          background-color: var(--primary-hover-color);
        }
      `.trim();
      this.loadStyle("wc-save-button-style", style);
    }
    _wireEvents() {
      super._wireEvents();
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-save-button", WcSaveButton);
}

// src/js/components/wc-save-split-button.js
if (!customElements.get("wc-save-split-button")) {
  class WcSaveSplitButton extends WcBaseComponent {
    static get observedAttributes() {
      return [];
    }
    constructor() {
      super();
      this._items = [];
      const compEl = this.querySelector(".wc-save-split-button");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.classList.add("contents");
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-save-split-button");
        this.componentElement.setAttribute("hx-target", "#viewport");
        this.componentElement.setAttribute("hx-swap", "innerHTML transition:true");
        this.componentElement.setAttribute("hx-indicator", "#content-loader");
        this.componentElement.setAttribute("hx-push-url", "true");
        this.componentElement.setAttribute("hx-boost", "true");
        this.appendChild(this.componentElement);
        this._createElement();
      }
      console.log("ctor:wc-save-split-button");
    }
    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
      console.log("connectedCallback:wc-save-split-button");
    }
    disconnectedCallback() {
      this._unWireEvents();
    }
    _createElement() {
      const id = this.getAttribute("id") || "";
      const method = this.getAttribute("method") || "post";
      const saveUrl = this.getAttribute("save-url") || "";
      const saveNewUrl = this.getAttribute("save-new-url") || "";
      const saveReturnUrl = this.getAttribute("save-return-url") || "";
      const positionArea = this.getAttribute("position-area") || "bottom span-left";
      const positionTryFallbacks = this.getAttribute("position-try-fallbacks") || "--bottom-right, --bottom-left, --top-right, --top-left, --right, --left";
      const markup = `
        <button type="button" class="save-btn btn"
          hx-${method}="${saveUrl}"
          data-url="${saveUrl}">Save</button>
        <div class="dropdown">
          <button type="button" class="btn" style="border-left:1px solid var(--component-border-color);">
            <svg class="h-3 w-3 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"
              stroke="currentColor" fill="currentColor">
              <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
            </svg>
          </button>
          <div class="dropdown-content">
            <button type="button" class="save-new-btn btn w-full"
              hx-${method}="${saveUrl}"
              data-url="${saveNewUrl}">Save and Add New</button>
            <button type="button" class="save-return-btn btn w-full"
              hx-${method}="${saveUrl}"
              data-url="${saveReturnUrl}">Save and Return</button>
          </div>
        </div>
      `.trim();
      this.componentElement.innerHTML = markup;
      const saveBtn = this.querySelector(".wc-save-split-button");
      saveBtn.style.anchorName = `--${id}-anchor`;
      const drpContent = this.querySelector(".dropdown-content");
      drpContent.style.positionAnchor = `--${id}-anchor`;
      drpContent.style.positionArea = positionArea;
      drpContent.style.positionTryFallbacks = positionTryFallbacks;
    }
    _handleAttributeChange(attrName, newValue) {
      super._handleAttributeChange(attrName, newValue);
    }
    _handleClick(event) {
      const method = this.getAttribute("method") || "post";
      let url = event.target.dataset.url;
      if (method == "post" && event.target.classList.contains("save-btn")) {
        url = url.replace("create", "__id__");
      }
      console.log("wc-save-split-button:click", event, url);
      document.body.addEventListener("htmx:configRequest", (e) => {
        console.log("wc-save-split-button:htmx:configRequest", e, url);
        e.detail.headers["Wc-Save-Redirect"] = url;
      }, { once: true });
    }
    _applyStyle() {
      const style = `
        .wc-save-split-button {
          /* anchor-name: --save-anchor; */
          display: flex;
          flex-direction: row;
        }
        /* Dropdown Button */
        .wc-save-split-button .btn {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          border: none;
          outline: none;
          border-radius: 0;
        }

        /* The container <div> - needed to position the dropdown content */
        .wc-save-split-button .dropdown {
          /* display: inline-block; */
        }

        /* Dropdown Content (Hidden by Default) */
        .wc-save-split-button .dropdown-content {
          display: none;
          background-color: var(--primary-bg-color);
          min-width: 160px;
          z-index: 1;

          position: absolute;
          position-try-fallbacks: --bottom-right, --bottom-left, --top-right, --top-left, --right, --left;
          /*
          position-anchor: --save-anchor;
          position-area: bottom span-left;
          */
        }

        @position-try --bottom-left {
          position-area: bottom span-left;
        }
        @position-try --bottom-right {
          position-area: bottom span-right;
        }
        @position-try --top-left {
          position-area: top span-left;
        }
        @position-try --top-right {
          position-area: top span-right;
        }
        @position-try --right {
          position-area: right;
        }
        @position-try --left {
          position-area: left;
        }

        /* Links inside the dropdown */
        .wc-save-split-button .dropdown-content button {
          color: var(--primary-color);
          padding: 12px 16px;
          text-decoration: none;
          display: block;
        }

        /* Change color of dropdown links on hover */
        .wc-save-split-button .dropdown-content a:hover {
          background-color: var(--primary-hover-color);
        }

        /* Show the dropdown menu on hover */
        .wc-save-split-button .dropdown:hover > .dropdown-content {
          display: block;
        }

        /* Change the background color of the dropdown button when the dropdown content is shown */
        .wc-save-split-button .btn:hover, .dropdown:hover .btn  {
          background-color: var(--primary-hover-color);
        }
      `.trim();
      this.loadStyle("wc-save-split-button-style", style);
    }
    _wireEvents() {
      super._wireEvents();
      const saveBtn = this.querySelector("button.save-btn");
      saveBtn.addEventListener("click", this._handleClick.bind(this));
      const saveNewBtn = this.querySelector("button.save-new-btn");
      saveNewBtn.addEventListener("click", this._handleClick.bind(this));
      const saveReturnBtn = this.querySelector("button.save-return-btn");
      saveReturnBtn.addEventListener("click", this._handleClick.bind(this));
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-save-split-button", WcSaveSplitButton);
}

// src/js/components/wc-sidebar.js
var WcSidebar = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "width", "push-target", "right-side", "auto-height", "background-color"];
  }
  constructor() {
    super();
    if (!this.hasAttribute("right-side")) {
      this.setAttribute("left-side", "");
    }
    const compEl = this.querySelector(".wc-sidebar");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-sidebar");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-sidebar");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-sidebar");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "label") {
    } else if (attrName === "auto-height") {
    } else if (attrName === "background-color") {
    } else if (attrName === "push-target") {
    } else if (attrName === "right-side") {
    } else if (attrName === "width") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-sidebar > *");
    if (innerEl) {
      const pushSelector = this.getAttribute("push-target") || "body";
      const pushTarget = document.querySelector(pushSelector);
      const isRight = this.hasAttribute("right-side");
      const width = this.getAttribute("width") || "150px";
      if (pushTarget) {
        if (isRight) {
          pushTarget.style.marginRight = width;
        } else {
          pushTarget.style.marginLeft = width;
        }
      }
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-sidebar");
  }
  _createInnerElement() {
    const parts = this.querySelectorAll("wc-sidebar > *:not(.wc-sidebar");
    parts.forEach((p) => this.componentElement.appendChild(p));
    const autoHeight = this.hasAttribute("auto-height");
    if (autoHeight) {
      this.componentElement.style.height = "auto";
    } else {
      this.componentElement.style.height = "100%";
    }
    const pushSelector = this.getAttribute("push-target") || "body";
    const isRight = this.hasAttribute("right-side");
    const width = this.getAttribute("width") || "150px";
    if (this.hasAttribute("background-color")) {
      const bgColor = this.getAttribute("background-color");
      this.componentElement.style.setProperty("--background-color", bgColor);
    }
    this.componentElement.style.width = width;
    if (pushSelector) {
      const pushTarget = document.querySelector(pushSelector);
      if (pushTarget) {
        pushTarget.style.setProperty("transition", "margin-left 0.5s ease, margin-right 0.5s ease");
        if (isRight) {
          pushTarget.style.marginRight = width;
        } else {
          pushTarget.style.marginLeft = width;
        }
      }
    }
  }
  _applyStyle() {
    const style = `
      wc-sidebar .wc-sidebar {
        /* height: 100%; */
        position: fixed;
        z-index: 1;
        top: 0;
        background-color: var(--bg-color);
        overflow-x: hidden;
        padding-top: 20px;
        padding-bottom: 20px;
      }
      wc-sidebar[left-side] .wc-sidebar {
        left: 0;
      }
      wc-sidebar[right-side] .wc-sidebar {
        right: 0;
      }

      wc-sidebar .wc-sidebar a {
        padding: 6px 8px 6px 16px;
        text-decoration: none;
        font-size: 25px;
        color: var(--component-color);
        display: block;
      }

      wc-sidebar .wc-sidebar a:hover {
        color: var(--accent-bg-color);
      }
    `;
    this.loadStyle("wc-sidebar-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
    const pushSelector = this.getAttribute("push-target") || "body";
    const pushTarget = document.querySelector(pushSelector);
    const isRight = this.hasAttribute("right-side");
    if (pushTarget) {
      if (isRight) {
        pushTarget.style.marginRight = "0";
      } else {
        pushTarget.style.marginLeft = "0";
      }
    }
  }
};
customElements.define("wc-sidebar", WcSidebar);

// src/js/components/wc-sidenav.js
var WcSidenav = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "label", "width", "open", "open-top", "open-vertical-text", "push", "push-target", "overlay", "background-color", "auto-height"];
  }
  constructor() {
    super();
    if (!this.hasAttribute("right-side")) {
      this.setAttribute("left-side", "");
    }
    const compEl = this.querySelector(".wc-sidenav");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      const isOpen = this.hasAttribute("open");
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-sidenav", "sidenav");
      if (isOpen) {
        this.componentElement.classList.add("open");
      }
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-sidenav");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
    console.log("connectedCallback:wc-sidenav");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "label") {
    } else if (attrName === "auto-height") {
    } else if (attrName === "background-color") {
    } else if (attrName === "open-vertical-text") {
    } else if (attrName === "open-top") {
    } else if (attrName === "open") {
    } else if (attrName === "overlay") {
    } else if (attrName === "push-target") {
    } else if (attrName === "push") {
    } else if (attrName === "width") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-sidenav > *");
    if (innerEl) {
      const closeBtn = this.querySelector(".closebtn");
      closeBtn.addEventListener("click", this._closeNav.bind(this));
      const openBtn = this.querySelector(".openbtn");
      openBtn.addEventListener("click", this._openNav.bind(this));
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-sidenav");
  }
  _createInnerElement() {
    const parts = this.querySelectorAll("wc-sidenav > *:not(.wc-sidenav");
    const autoHeight = this.hasAttribute("auto-height");
    if (autoHeight) {
      this.componentElement.style.height = "auto";
    } else {
      this.componentElement.style.height = "100%";
    }
    const overlay = document.createElement("div");
    overlay.classList.add("overlay", "hidden");
    this.appendChild(overlay);
    if (this.hasAttribute("background-color")) {
      const bgColor = this.getAttribute("background-color");
      this.componentElement.style.setProperty("--background-color", bgColor);
    }
    const lbl = this.getAttribute("label") || "Sidenav";
    const closeBtn = document.createElement("button");
    closeBtn.classList.add("closebtn");
    closeBtn.innerHTML = "&times;";
    closeBtn.addEventListener("click", this._closeNav.bind(this));
    this.componentElement.appendChild(closeBtn);
    const openBtn = document.createElement("button");
    openBtn.classList.add("openbtn");
    openBtn.style.top = this.getAttribute("open-top") || "0";
    openBtn.addEventListener("click", this._openNav.bind(this));
    const openSpan = document.createElement("span");
    openSpan.textContent = lbl;
    openBtn.appendChild(openSpan);
    this.appendChild(openBtn);
    parts.forEach((p) => this.componentElement.appendChild(p));
    const pushSelector = this.getAttribute("push-target") || "#viewport";
    if (pushSelector) {
      const pushTarget = document.querySelector(pushSelector);
      if (pushTarget) {
        pushTarget.style.setProperty("transition", "margin-left 0.5s ease, margin-right 0.5s ease");
      }
    }
  }
  _handleHelper(event, btnSelector) {
    const { detail } = event;
    const { selector } = detail;
    const isArray = Array.isArray(selector);
    if (typeof selector === "string" || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach((tgt) => {
        if (tgt === this) {
          if (btnSelector === "toggle") {
            const side = this.querySelector(".wc-sidenav");
            if (side.classList.contains("open")) {
              btnSelector = ".closebtn";
            } else {
              btnSelector = ".openbtn";
            }
          }
          const btn = tgt?.querySelector(btnSelector);
          btn?.click();
        }
      });
    } else {
      const btn = selector?.querySelector(btnSelector);
      btn?.click();
    }
  }
  _handleOpen(event) {
    this._handleHelper(event, ".openbtn");
  }
  _handleClose(event) {
    this._handleHelper(event, ".closebtn");
  }
  _handleToggle(event) {
    this._handleHelper(event, "toggle");
  }
  _openNav(event) {
    const { target } = event;
    const width = this.getAttribute("width") || "250px";
    const pushSelector = this.getAttribute("push-target") || "#viewport";
    const side = this.querySelector(".wc-sidenav");
    side.classList.add("open");
    side.style.width = width;
    if (this.hasAttribute("overlay")) {
      const overlay = this.querySelector(".overlay");
      if (overlay) {
        overlay.classList.add("open");
        overlay.classList.remove("hidden");
      }
    }
    if (this.hasAttribute("push")) {
      const isRight = this.hasAttribute("right-side");
      if (pushSelector) {
        const pushTarget = document.querySelector(pushSelector);
        if (pushTarget) {
          if (isRight) {
            pushTarget.style.marginRight = width;
          } else {
            pushTarget.style.marginLeft = width;
          }
        }
      }
    }
  }
  _closeNav(event) {
    const { target } = event;
    const pushSelector = this.getAttribute("push-target") || "#viewport";
    const side = target.closest(".wc-sidenav");
    side.classList.remove("open");
    side.style.width = "0";
    if (this.hasAttribute("overlay")) {
      const overlay = this.querySelector(".overlay");
      if (overlay) {
        overlay.classList.remove("open");
        overlay.classList.add("hidden");
      }
    }
    if (this.hasAttribute("push")) {
      const isRight = this.hasAttribute("right-side");
      if (pushSelector) {
        const pushTarget = document.querySelector(pushSelector);
        if (pushTarget) {
          if (isRight) {
            pushTarget.style.marginRight = "0";
          } else {
            pushTarget.style.marginLeft = "0";
          }
        }
      }
    }
  }
  _applyStyle() {
    const style = `
      wc-sidenav .wc-sidenav.sidenav {
        /* height: 100%; */
        width: 0;
        position: fixed;
        z-index: 2;
        top: 0;
        background-color: var(--bg-color);
        overflow-x: hidden;
        padding-top: 60px;
        padding-bottom: 20px;
        text-align: center;
        transition: 0.5s;
      }
      wc-sidenav[left-side] .wc-sidenav.sidenav {
        left: 0;
      }
      wc-sidenav[right-side] .wc-sidenav.sidenav {
        right: 0;
      }
      wc-sidenav .wc-sidenav.sidenav a {
        text-decoration: none;
        font-size: 25px;
        color: var(--component-color);
        display: block;
        transition: 0.3s;
      }
      wc-sidenav[left-side] .wc-sidenav.sidenav a {
        padding: 8px 8px 8px 32px;
      }
      wc-sidenav[right-side] .wc-sidenav.sidenav a {
        padding: 8px 32px 8px 8px;
      }
      wc-sidenav .wc-sidenav.sidenav.open a {
        padding: 8px 8px;
      }
      wc-sidenav .wc-sidenav.sidenav a:hover {
        color: var(--accent-bg-color);
      }
      wc-sidenav .wc-sidenav.sidenav .closebtn {
        position: absolute;
        top: 0;
        font-size: 36px;
        background-color: transparent;
      }
      wc-sidenav[left-side] .wc-sidenav.sidenav .closebtn {
        right: 10px;
      }
      wc-sidenav[right-side] .wc-sidenav.sidenav .closebtn {
        left: 10px;
      }
      wc-sidenav .openbtn {
        position: absolute;
        z-index: 1;
      }
      wc-sidenav[left-side] .openbtn {
        left: 0;
        border-radius: 0 0.375rem 0.375rem 0;
      }
      wc-sidenav[right-side] .openbtn {
        right: 0;
        border-radius: 0.375rem 0 0 0.375rem;
      }
      wc-sidenav .openbtn span {
        writing-mode: vertical-rl;
        display: inline-block;
        line-height: 2;
      }
      wc-sidenav[open-vertical-text] .openbtn span {
        text-orientation: upright;
        letter-spacing: 2px;
      }
      wc-sidenav:not([open-vertical-text]) .openbtn span {
        text-orientation: sideways;
        letter-spacing: 4px;
      }
      wc-sidenav .openbtn:hover {
        background-color: var(--secondary-bg-color);
      }

      .overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background-color: transparent;
        transition: background-color 0.5s ease;
      }
      .overlay.open {
        background-color: rgba(0,0,0,0.6);
        z-index: 1;
      }
    `;
    this.loadStyle("wc-sidenav-style", style);
  }
  _wireEvents() {
    super._wireEvents();
    document.body.addEventListener("wc-sidenav:open", this._handleOpen.bind(this));
    document.body.addEventListener("wc-sidenav:close", this._handleClose.bind(this));
    document.body.addEventListener("wc-sidenav:toggle", this._handleToggle.bind(this));
  }
  _unWireEvents() {
    super._unWireEvents();
    const closeBtn = this.querySelector(".closebtn");
    closeBtn.removeEventListener("click", this._closeNav.bind(this));
    const openBtn = this.querySelector(".openbtn");
    openBtn.removeEventListener("click", this._openNav.bind(this));
    document.body.removeEventListener("wc-sidenav-open", this._handleOpen.bind(this));
    document.body.removeEventListener("wc-sidenav-close", this._handleClose.bind(this));
    document.body.removeEventListener("wc-sidenav:toggle", this._handleToggle.bind(this));
  }
};
customElements.define("wc-sidenav", WcSidenav);

// src/js/components/wc-slideshow-image.js
var WcSlideshowImage = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "url", "caption", "numbertext"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-slideshow-image");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-slideshow-image", "slide", "fade");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-slideshow-image");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-slideshow-image");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "numbertext") {
      const numTextEl = this.querySelector(".numbertext");
      if (numTextEl) {
        numTextEl.textContent = newValue;
      }
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-slideshow-image > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-slideshow-image");
  }
  _createInnerElement() {
    const numTextEl = document.createElement("div");
    numTextEl.textContent = this.getAttribute("numbertext") || "";
    numTextEl.classList.add("numbertext");
    const imgEl = document.createElement("img");
    imgEl.src = this.getAttribute("url") || "";
    const captionEl = document.createElement("div");
    captionEl.textContent = this.getAttribute("caption") || "";
    captionEl.classList.add("text");
    this.componentElement.appendChild(numTextEl);
    this.componentElement.appendChild(imgEl);
    this.componentElement.appendChild(captionEl);
  }
  _applyStyle() {
    const style = `
      .wc-slideshow-image {
        position: relative;
      }

      .wc-slideshow-image img {
        max-height: 300px;
        width: 100%;
        height: auto;
        object-fit: cover;
      }
      
      /* Caption text */
      .wc-slideshow-image .text {
        color: #f2f2f2;
        font-size: 15px;
        padding: 8px 12px;
        position: absolute;
        bottom: 8px;
        width: 100%;
        text-align: center;
      }

      /* Number text (1/3 etc) */
      .wc-slideshow-image .numbertext {
        color: #f2f2f2;
        font-size: 12px;
        padding: 8px 12px;
        position: absolute;
        top: 0;
      }      
`.trim();
    this.loadStyle("wc-slideshow-image-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-slideshow-image", WcSlideshowImage);

// src/js/components/wc-slideshow.js
var WcSlideshow = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "max-image-height", "autoplay", "autoplay-interval"];
  }
  constructor() {
    super();
    this.slides = [];
    this.slideshowInterval = null;
    this.isPaused = false;
    this.slideIndex = 1;
    this.childComponentSelector = "wc-slideshow-image";
    const compEl = this.querySelector(".wc-slideshow");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-slideshow", "container");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-slideshow");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
    console.log("connectedCallback:wc-slideshow");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  // _handleAttributeChange(attrName, newValue) {    
  //   if (attrName === 'height') {
  //     this.height = newValue;
  //   } else if (attrName === 'width') {
  //     this.width = newValue;
  //   } else {
  //     super._handleAttributeChange(attrName, newValue);  
  //   }
  // }
  _render() {
    super._render();
    const wcSlideshowImages = this.querySelectorAll("wc-slideshow-image");
    wcSlideshowImages.forEach((w, idx) => {
      w.setAttribute("numbertext", `${idx + 1} / ${wcSlideshowImages.length}`);
      const imgs = w.querySelectorAll("img");
      imgs.forEach((i) => i.style.maxHeight = this.getAttribute("max-image-height") || "300px");
    });
    this.slides = this.querySelectorAll(".wc-slideshow-image.slide");
    const innerEl = this.querySelector(".wc-slideshow > *");
    if (innerEl) {
      this.slideIndex = parseInt(this.dataset.slideIndex || 1);
      const prev = this.querySelector(".prev");
      const next = this.querySelector(".next");
      prev.addEventListener("click", this._prevSlide.bind(this));
      next.addEventListener("click", this._nextSlide.bind(this));
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    this._startSlideshow();
    document.addEventListener("visibilitychange", this._handleVisibilityChange.bind(this));
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-slideshow");
  }
  _createInnerElement() {
    const els = this.querySelectorAll("wc-slideshow > *:not(.wc-slideshow)");
    els.forEach((el) => {
      this.componentElement.appendChild(el);
    });
    const prev = document.createElement("a");
    prev.classList.add("prev");
    prev.textContent = "\u276E";
    prev.addEventListener("click", this._prevSlide.bind(this));
    const next = document.createElement("a");
    next.textContent = "\u276F";
    next.classList.add("next");
    next.addEventListener("click", this._nextSlide.bind(this));
    this.componentElement.appendChild(prev);
    this.componentElement.appendChild(next);
  }
  _handleHelper(event, mode = "next") {
    const { detail } = event;
    const { selector } = detail;
    const isArray = Array.isArray(selector);
    if (typeof selector === "string" || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach((tgt) => {
        if (tgt === this) {
          if (mode === "next") {
            this._nextSlide({ target: this });
          } else if (mode === "prev") {
            this._prevSlide({ target: this });
          } else if (mode === "start") {
            this.setAttribute("autoplay", "");
            this.isPaused = false;
            this._startSlideshow();
          } else if (mode === "stop") {
            this.removeAttribute("autoplay");
            this.isPaused = true;
            clearInterval(this.slideshowInterval);
          }
        }
      });
    } else {
      if (selector === this) {
        if (mode === "next") {
          this._nextSlide({ target: this });
        } else if (mode === "prev") {
          this._prevSlide({ target: this });
        } else if (mode === "start") {
          this.setAttribute("autoplay", "");
          this.isPaused = false;
          this._startSlideshow();
        } else if (mode === "stop") {
          this.removeAttribute("autoplay");
          this.isPaused = true;
          clearInterval(this.slideshowInterval);
        }
      }
    }
  }
  _handleNext(event) {
    this._handleHelper(event, "next");
  }
  _handlePrev(event) {
    this._handleHelper(event, "prev");
  }
  _handleStart(event) {
    this._handleHelper(event, "start");
  }
  _handleStop(event) {
    this._handleHelper(event, "stop");
  }
  _prevSlide(event) {
    if (event?.target) {
      this.isPaused = true;
      clearInterval(this.slideshowInterval);
    }
    this.slideIndex -= 1;
    this._showSlide();
  }
  _nextSlide(event) {
    if (event?.target) {
      this.isPaused = true;
      clearInterval(this.slideshowInterval);
    }
    this.slideIndex += 1;
    this._showSlide();
  }
  _showSlide() {
    if (this.slideIndex > this.slides.length) {
      this.slideIndex = 1;
    }
    if (this.slideIndex < 1) {
      this.slideIndex = this.slides.length;
    }
    this.slides.forEach((s) => s.style.display = "none");
    this.slides[this.slideIndex - 1].style.display = "block";
    this.dataset.slideIndex = this.slideIndex;
  }
  _startSlideshow() {
    if (this.hasAttribute("autoplay") && !this.isPaused) {
      const interval = parseInt(this.getAttribute("autoplay-interval")) || 5e3;
      this.slideshowInterval = setInterval(() => this._nextSlide(), interval);
    }
    this._showSlide();
  }
  _handleVisibilityChange() {
    if (document.hidden) {
      this.isPaused = true;
      clearInterval(this.slideshowInterval);
    } else {
      this.isPaused = false;
      this._startSlideshow();
    }
  }
  _applyStyle() {
    const style = `
      .wc-slideshow {

      }
      /* Slideshow container */
      .wc-slideshow.container {
        max-width: 1000px;
        position: relative;
        margin: auto;
      }

      /* Hide the images by default */
      .wc-slideshow .slide {
        display: none;
      }

      /* Next & previous buttons */
      .wc-slideshow .prev,
      .wc-slideshow .next {
        cursor: pointer;
        position: absolute;
        top: 50%;
        width: auto;
        margin-top: -22px;
        padding: 16px;
        color: white;
        font-weight: bold;
        font-size: 18px;
        transition: 0.6s ease;
        border-radius: 0 3px 3px 0;
        user-select: none;
      }

      /* Position the "next button" to the right */
      .wc-slideshow .next {
        right: 0;
        border-radius: 3px 0 0 3px;
      }

      /* On hover, add a black background color with a little bit see-through */
      .wc-slideshow .prev:hover,
      .wc-slideshow .next:hover {
        background-color: rgba(0,0,0,0.8);
      }

      .wc-slideshow .active {
        background-color: #717171;
      }

      /* Fading animation */
      .wc-slideshow .fade {
        animation-name: slideshow-fade;
        animation-duration: 1.5s;
      }

      @keyframes slideshow-fade {
        from {
          opacity: .4;
        }
        to {
          opacity: 1;
        }
      }
`.trim();
    this.loadStyle("wc-slideshow-style", style);
  }
  _wireEvents() {
    super._wireEvents();
    document.body.addEventListener("wc-slideshow:next", this._handleNext.bind(this));
    document.body.addEventListener("wc-slideshow:prev", this._handlePrev.bind(this));
    document.body.addEventListener("wc-slideshow:start", this._handleStart.bind(this));
    document.body.addEventListener("wc-slideshow:stop", this._handleStop.bind(this));
  }
  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener("wc-slideshow:next", this._handleNext.bind(this));
    document.body.removeEventListener("wc-slideshow:prev", this._handlePrev.bind(this));
    document.body.removeEventListener("wc-slideshow:start", this._handleStart.bind(this));
    document.body.removeEventListener("wc-slideshow:stop", this._handleStop.bind(this));
    const prev = this.querySelector(".prev");
    const next = this.querySelector(".next");
    prev.removeEventListener("click", this._prevSlide.bind(this));
    next.removeEventListener("click", this._nextSlide.bind(this));
    document.removeEventListener("visibilitychange", this._handleVisibilityChange.bind(this));
  }
};
customElements.define("wc-slideshow", WcSlideshow);

// src/js/components/wc-tab-item.js
var WcTabItem = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "label", "active"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-tab-item");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-tab-item");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-tab-item");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-tab-item");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "test") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-tab-item > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-tab-item");
  }
  _createInnerElement() {
    const parts = this.querySelectorAll("wc-tab-item > *:not(.wc-tab-item)");
    parts.forEach((part) => {
      this.componentElement.appendChild(part);
    });
  }
  _applyStyle() {
    const style = `
      .wc-tab-item {
        position: relative;
      }
    `.trim();
    this.loadStyle("wc-tab-item-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-tab-item", WcTabItem);

// src/js/components/wc-tab.js
var WcTab = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "animate", "vertical"];
  }
  constructor() {
    super();
    this.childComponentSelector = "wc-tab-item";
    const compEl = this.querySelector(".wc-tab");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-tab");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-tab");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
    console.log("connectedCallback:wc-tab");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "animate") {
    } else if (attrName === "vertical") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-tab > *");
    if (innerEl) {
      const btns = this.querySelectorAll(".tab-link");
      btns.forEach((btn) => btn.addEventListener("click", this._handleClick.bind(this)));
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-tab");
  }
  _createInnerElement() {
    const tabNav = document.createElement("div");
    tabNav.classList.add("tab-nav");
    const tabBody = document.createElement("div");
    tabBody.classList.add("tab-body");
    const parts = this.querySelectorAll("wc-tab > *:not(.wc-tab)");
    parts.forEach((p, idx) => {
      const tabItem = p.querySelector(".wc-tab-item");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.classList.add("tab-link");
      btn.addEventListener("click", this._handleClick.bind(this));
      const hasActive = tabItem.classList.contains("active");
      if (hasActive) {
        btn.classList.add("active");
      }
      btn.textContent = p.getAttribute("label") || `Label ${idx + 1}`;
      tabNav.appendChild(btn);
    });
    parts.forEach((p) => {
      tabBody.appendChild(p);
    });
    this.componentElement.appendChild(tabNav);
    this.componentElement.appendChild(tabBody);
  }
  _handleHelper(event, mode = "click") {
    const { detail } = event;
    const { selector, subSelector } = detail;
    const isArray = Array.isArray(selector);
    if (typeof selector === "string" || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach((tgt) => {
        if (tgt === this) {
          if (mode === "click") {
            const elt = this.querySelector(subSelector);
            elt?.click();
          }
        }
      });
    } else {
      if (selector === this) {
        if (mode === "click") {
          const elt = this.querySelector(subSelector);
          elt?.click();
        }
      }
    }
  }
  _handleOnClick(event) {
    this._handleHelper(event, "click");
  }
  _handleClick(event) {
    const { target } = event;
    const parts = this.querySelectorAll(".active");
    parts.forEach((p) => p.classList.remove("active"));
    target.classList.add("active");
    const label = target.textContent;
    const contents = this.querySelector(`.wc-tab-item[label='${label}']`);
    contents.classList.add("active");
    const payload = { detail: { label } };
    const custom = new CustomEvent("tabchange", payload);
    contents.dispatchEvent(custom);
  }
  _applyStyle() {
    const style = `
      wc-tab .wc-tab {
        position: relative;
        overflow: hidden;
      }
      wc-tab[vertical] .wc-tab {
        display: flex;
        flex-direction: row;
      }
      wc-tab .wc-tab .tab-nav {
        position: relative;
        display: flex;
        flex-direction: row;
        overflow: hidden;
        border: 1px solid var(--accent-bg-color);
        background-color: var(--secondary-bg-color);
      }
      wc-tab[vertical] .wc-tab .tab-nav {
        flex-direction: column;
        overflow: initial;
        border-right: none;
      }
      wc-tab .wc-tab .tab-nav .tab-link {
        background-color: var(--secondary-bg-color);
        border: none;
        border-radius: 0;
        outline: none;
        cursor: pointer;
        padding: 14px 16px;
        user-select: none;
        transition: 0.3s;
      }
      wc-tab .wc-tab .tab-nav .tab-link.active,
      wc-tab .wc-tab .tab-nav .tab-link:hover {
        background-color: var(--primary-bg-color);
      }

      wc-tab .wc-tab .tab-body {
        display: flex;
        flex-direction: column;
        flex: 1 1 0%;
        
        border: 1px solid var(--accent-bg-color);
        border-top: none;
      }
      wc-tab[vertical] .wc-tab .tab-body {
        border-top: 1px solid var(--accent-bg-color);
      }
      wc-tab .wc-tab .tab-body wc-tab-item .wc-tab-item {
        display: none;
      }
      wc-tab[animate] .wc-tab .tab-body wc-tab-item .wc-tab-item {
        animation: tab-fade 1s;
      }
      wc-tab .wc-tab .tab-body wc-tab-item .wc-tab-item.active {
        display: block;
      }

      @keyframes tab-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `.trim();
    this.loadStyle("wc-tab-style", style);
  }
  _wireEvents() {
    super._wireEvents();
    document.body.addEventListener("wc-tab:click", this._handleOnClick.bind(this));
  }
  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener("wc-tab:click", this._handleOnClick.bind(this));
    const btns = this.querySelectorAll(".tab-link");
    btns.forEach((btn) => btn.removeEventListener("click", this._handleClick.bind(this)));
  }
};
customElements.define("wc-tab", WcTab);

// src/js/components/wc-table-skeleton.js
if (!customElements.get("wc-table-skeleton")) {
  class WcTableSkeleton extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class"];
    }
    constructor() {
      super();
      const compEl = this.querySelector(".wc-table-skeleton");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-table-skeleton");
        this._createElement();
        this.appendChild(this.componentElement);
      }
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }
    _handleAttributeChange(attrName, newValue) {
      if (attrName === "items") {
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }
    _createElement() {
      this.componentElement.id = "table-skeleton";
      this.componentElement.setAttribute("role", "status");
      this.componentElement.className = "max-w-full p-4 space-y-4 border border-gray-200 divide-y divide-gray-200 rounded shadow animate-pulse dark:divide-gray-700 md:p-6 dark:border-gray-700";
      this.componentElement.innerHTML = `
        <!-- Table Header Skeleton -->
        <div class="flex items-center justify-between">
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
          <div class="w-1/6 h-4 bg-gray-300 rounded-full dark:bg-gray-600"></div>
        </div>
        <!-- Table Row Skeletons -->
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
          <div class="w-1/6 h-4 bg-gray-200 rounded-full dark:bg-gray-700"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }
    _applyStyle() {
      const style = `
        .wc-div {
          position: relative;
          display: block;
        }
      `.trim();
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-table-skeleton", WcTableSkeleton);
}

// src/js/components/wc-theme-selector.js
var WcThemeSelector = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "theme", "mode"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-theme-selector");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-theme-selector");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-theme-selector");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-theme-selector");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "theme") {
      const themeButton = this.componentElement.querySelector(`button[data-theme="${newValue}"]`);
      themeButton?.click();
    } else if (attrName === "mode") {
      const themeModeButton = this.componentElement.querySelector(`button[data-theme-mode="${newValue}"]`);
      themeModeButton?.click();
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-theme-selector > *");
    if (innerEl) {
      const themeModeBtns = this.componentElement.querySelectorAll("button[data-theme-mode]");
      themeModeBtns.forEach((btn) => btn.addEventListener("click", this._handleThemeModeClick.bind(this)));
      const themeBtns = this.componentElement.querySelectorAll("button[data-theme]");
      themeBtns.forEach((btn) => btn.addEventListener("click", this._handleThemeClick.bind(this)));
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-theme-selector");
  }
  _createInnerElement() {
    const themes = [
      "theme-coral-sunset",
      "theme-rose-gold",
      "theme-autumn-leaves",
      "theme-purple-haze",
      "theme-lavender-fields",
      "theme-dracula",
      "theme-midnight-blue",
      "theme-royal-blue",
      "theme-light",
      "theme-dark",
      "theme-solarized",
      "theme-ocean-blue",
      "theme-nord",
      "theme-emerald-mist",
      "theme-forest-green",
      "theme-spring-meadow",
      "theme-mint-fresh",
      "theme-lemon-twist",
      "theme-golden-sun",
      "theme-warm-autumn",
      "theme-burnt-orange",
      "theme-taupe-dream",
      "theme-sandy-dune",
      "theme-steel-gray",
      "theme-slate-storm",
      "theme-cool-gray",
      "theme-midnight-slate",
      "theme-midnight",
      "theme-day"
    ];
    const themeModes = [
      { "theme": "theme-midnight", "mode": "dark" },
      { "theme": "theme-day", "mode": "light" }
    ];
    const template = document.createElement("template");
    template.innerHTML = `
      <div class="row flex-wrap">
        ${themes.map((theme) => `
          <button class="flat h-10 w-10 rounded-t-md ${theme}" type="button" data-theme="${theme}" title="${theme}">
            <svg class="selectmark h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
            </svg>
          </button>
          `.trim()).join("")}
      </div>
      <div class="row">
        ${themeModes.map((item) => `
          <button class="flat h-10 w-10 ${item.theme}" type="button" data-theme-mode="${item.mode}">
            <svg class="selectmark h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
            </svg>
          </button>
          `.trim()).join("")}
      </div>
      `.trim();
    this.componentElement.appendChild(template.content.cloneNode(true));
    this._wireEvents();
  }
  _applyStyle() {
    const style = `
      wc-theme-selector .wc-theme-selector {

      }

      wc-theme-selector .wc-theme-selector .selectmark {
        pointer-events: none;
      }
    `;
    this.loadStyle("wc-theme-selector-style", style);
  }
  _handleThemeClick(event) {
    const { target } = event;
    const themeBtns = this.componentElement.querySelectorAll("button[data-theme]");
    const selectedTheme = target.getAttribute("data-theme");
    this.setAttribute("theme", selectedTheme);
    themeBtns.forEach((btn) => btn.classList.remove("selected"));
    target.classList.add("selected");
    document.body.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) {
        document.body.classList.remove(cls);
      }
    });
    document.body.dataset.theme = selectedTheme;
    document.body.classList.add(selectedTheme);
  }
  _handleThemeModeClick(event) {
    const { target } = event;
    const themeModeBtns = this.componentElement.querySelectorAll("button[data-theme-mode]");
    const selectedMode = target.getAttribute("data-theme-mode");
    this.setAttribute("mode", selectedMode);
    themeModeBtns.forEach((btn) => btn.classList.remove("selected"));
    target.classList.add("selected");
    const oldMode = document.body.dataset.themeMode || selectedMode;
    if (oldMode) {
      document.body.classList.remove(oldMode);
    }
    document.body.dataset.themeMode = selectedMode;
    document.body.classList.add(selectedMode);
  }
  _wireEvents() {
    super._wireEvents();
    const themeModeBtns = this.componentElement.querySelectorAll("button[data-theme-mode]");
    themeModeBtns.forEach((btn) => btn.addEventListener("click", this._handleThemeModeClick.bind(this)));
    const themeBtns = this.componentElement.querySelectorAll("button[data-theme]");
    themeBtns.forEach((btn) => btn.addEventListener("click", this._handleThemeClick.bind(this)));
  }
  _unWireEvents() {
    super._unWireEvents();
    const themeModeBtns = this.componentElement.querySelectorAll("button[data-theme-mode]");
    themeModeBtns.forEach((btn) => btn.removeEventListener("click", this._handleThemeModeClick.bind(this)));
    const themeBtns = this.componentElement.querySelectorAll("button[data-theme]");
    themeBtns.forEach((btn) => btn.removeEventListener("click", this._handleThemeClick.bind(this)));
  }
};
customElements.define("wc-theme-selector", WcThemeSelector);

// src/js/components/wc-timeline.js
var WcTimeline = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "items"];
  }
  constructor() {
    super();
    this._items = [];
    const compEl = this.querySelector(".wc-timeline");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-timeline");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-timeline");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-timeline");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "items") {
      if (typeof newValue === "string") {
        this._items = JSON.parse(newValue);
      }
      this.removeAttribute("items");
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-timeline > *");
    if (innerEl) {
    } else {
      this._moveDeclarativeOptions();
      this.componentElement.innerHTML = "";
      this._items.forEach((item, idx) => {
        const el = this._createElement(item.label, item.content, idx);
        this.componentElement.appendChild(el);
      });
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-timeline");
  }
  _createElement(itemLabel, itemContent, idx) {
    let position = "left";
    if (idx % 2 !== 0) {
      position = "right";
    }
    const container = document.createElement("div");
    container.classList.add("container", position);
    const card = document.createElement("div");
    card.classList.add("card");
    const header = document.createElement("h2");
    header.textContent = itemLabel;
    const content = document.createElement("p");
    content.textContent = itemContent;
    card.appendChild(header);
    card.appendChild(content);
    container.appendChild(card);
    return container;
  }
  _applyStyle() {
    const style = `
      .wc-timeline,
      .wc-timeline * {
        box-sizing: border-box;
      }

      .wc-timeline {
        position: relative;
        max-width: 1200px;
        margin: 0 auto;
      }

      /* The actual timeline (the vertical ruler) */
      .wc-timeline::after {
        content: '';
        position: absolute;
        width: 6px;
        background-color: var(--primary-bg-color);
        top: 0;
        bottom: 0;
        left: 50%;
        margin-left: -3px;
      }

      /* Container around content */
      .wc-timeline .container {
        padding: 10px 40px;
        position: relative;
        background-color: inherit;
        width: 50%;
      }

      /* The circles on the timeline */
      .wc-timeline .container::after {
        content: '';
        position: absolute;
        width: 25px;
        height: 25px;
        right: -17px;
        background-color: var(--component-color);
        border: 4px solid var(--accent-bg-color);
        top: 15px;
        border-radius: 50%;
        z-index: 1;
      }

      /* Place the container to the left */
      .wc-timeline .left {
        left: 0;
      }

      /* Place the container to the right */
      .wc-timeline .right {
        left: 50%;
      }

      /* Add arrows to the left container (pointing right) */
      .wc-timeline .left::before {
        content: " ";
        height: 0;
        position: absolute;
        top: 22px;
        width: 0;
        z-index: 1;
        right: 30px;
        border: medium solid white;
        border-width: 10px 0 10px 10px;
        border-color: transparent transparent transparent var(--component-bg-color);
      }

      /* Add arrows to the right container (pointing left) */
      .wc-timeline .right::before {
        content: " ";
        height: 0;
        position: absolute;
        top: 22px;
        width: 0;
        z-index: 1;
        left: 30px;
        border: medium solid white;
        border-width: 10px 10px 10px 0;
        border-color: transparent var(--component-bg-color); transparent transparent;
      }

      /* Fix the circle for containers on the right side */
      .wc-timeline .right::after {
        left: -16px;
      }

      /* The actual content */
      .wc-timeline .card {
        padding: 20px 30px;
        background-color: var(--component-bg-color);
        color: var(--input-color);
        position: relative;
        border-radius: 6px;
      }
      /* Media queries - Responsive timeline on screens less than 600px wide */
      @media screen and (max-width: 600px) {
        /* Place the timelime to the left */
        .wc-timeline::after {
          left: 31px;
        }
        
        /* Full-width containers */
        .wc-timeline .container {
          width: 100%;
          padding-left: 70px;
          padding-right: 25px;
        }
        
        /* Make sure that all arrows are pointing leftwards */
        .wc-timeline .container::before {
          left: 60px;
          border: medium solid white;
          border-width: 10px 10px 10px 0;
          border-color: transparent white transparent transparent;
        }

        /* Make sure all circles are at the same spot */
        .wc-timeline .left::after,
        .wc-timeline .right::after {
          left: 15px;
        }
        
        /* Make all right containers behave like the left ones */
        .wc-timeline .right {
          left: 0%;
        }
      }`.trim();
    this.loadStyle("wc-timeline-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
  _moveDeclarativeOptions() {
    const options = this.querySelectorAll("option");
    if (options.length > 0) {
      this._items = [];
    }
    options.forEach((option, idx) => {
      const item = {
        label: option.value,
        content: option.textContent.trim()
      };
      this._items.push(item);
    });
    Array.from(options).forEach((option) => option.remove());
  }
};
customElements.define("wc-timeline", WcTimeline);

// src/js/components/wc-loader.js
var WcLoader = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "size", "speed", "thickness"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-loader");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-loader");
      this.appendChild(this.componentElement);
    }
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
    console.log("connectedCallback:wc-loader");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "size") {
      this.componentElement.style.height = newValue;
      this.componentElement.style.width = newValue;
    } else if (attrName === "speed") {
      this.componentElement.style.animationDuration = newValue;
    } else if (attrName === "thickness") {
      this.componentElement.style.borderWidth = newValue;
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerParts = this.querySelectorAll(".wc-loader > *");
    if (innerParts.length > 0) {
      this.componentElement.innerHTML = "";
      innerParts.forEach((p) => this.componentElement.appendChild(p));
    } else {
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
  }
  _applyStyle() {
    const style = `
      wc-loader .wc-loader {
        border-width: 16px;
        border-style: solid;
        border-color: var(--color);
        border-top-color: var(--primary-bg-color);
        /*
        border: 16px solid var(--color);
        border-top: 16px solid var(--primary-bg-color);
        */
        border-radius: 50%;
        width: 120px;
        height: 120px;
        animation: loader-spin 2s linear infinite;
      }

      @keyframes loader-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `.trim();
    this.loadStyle("wc-loader-style", style);
  }
  _handleHelper(event, mode = "show") {
    const { detail } = event;
    const { selector } = detail;
    const isArray = Array.isArray(selector);
    if (typeof selector === "string" || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach((tgt) => {
        if (tgt === this) {
          if (mode === "show") {
            this.componentElement.classList.remove("hidden");
          } else if (mode === "hide") {
            this.componentElement.classList.add("hidden");
          } else if (mode === "toggle") {
            this.componentElement.classList.toggle("hidden");
          }
        }
      });
    } else {
      const tgt = document.querySelector(selector);
      if (tgt === this) {
        if (mode === "show") {
          this.componentElement.classList.remove("hidden");
        } else if (mode === "hide") {
          this.componentElement.classList.add("hidden");
        } else if (mode === "toggle") {
          this.componentElement.classList.toggle("hidden");
        }
      }
    }
  }
  _handleShow(event) {
    this._handleHelper(event, "show");
  }
  _handleHide(event) {
    this._handleHelper(event, "hide");
  }
  _handleToggle(event) {
    this._handleHelper(event, "toggle");
  }
  _wireEvents() {
    super._wireEvents();
    document.body.addEventListener("wc-loader:show", this._handleShow.bind(this));
    document.body.addEventListener("wc-loader:hide", this._handleHide.bind(this));
    document.body.addEventListener("wc-loader:toggle", this._handleToggle.bind(this));
  }
  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener("wc-loader:show", this._handleShow.bind(this));
    document.body.removeEventListener("wc-loader:hide", this._handleHide.bind(this));
    document.body.removeEventListener("wc-loader:toggle", this._handleToggle.bind(this));
  }
};
customElements.define("wc-loader", WcLoader);

// src/js/components/wc-behavior.js
var WcBehavior = class _WcBehavior extends HTMLElement {
  static get observedAttributes() {
    return [
      "hx-get",
      "hx-post",
      "hx-put",
      "hx-delete",
      "hx-target",
      "hx-trigger",
      "hx-swap",
      "hx-select",
      "hx-push-url",
      "hx-vals",
      "hx-headers",
      "hx-indicator",
      "hx-params",
      "hx-ext",
      "hx-prompt",
      "hx-confirm",
      "hx-on",
      "hx-include"
    ];
  }
  constructor() {
    super();
  }
  connectedCallback() {
    const parentContainer = this.parentElement;
    if (parentContainer) {
      this.applyAttributes(parentContainer);
      parentContainer.addEventListener("click", this.raiseEvent.bind(this));
    } else {
      console.warn("No parent container found for HTMX attributes.");
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
    _WcBehavior.observedAttributes.forEach((attr) => {
      if (this.hasAttribute(attr)) {
        container.setAttribute(attr, this.getAttribute(attr));
      }
    });
    _WcBehavior.observedAttributes.forEach((attr) => {
      if (this.hasAttribute(attr)) {
        this.removeAttribute(attr);
      }
    });
  }
  raiseEvent(event) {
    const custom = new CustomEvent("custom-event", { detail: "hello world" });
    document.body.dispatchEvent(custom);
  }
};
customElements.define("wc-behavior", WcBehavior);

// src/js/components/wc-visibility-change.js
if (!customElements.get("wc-visibility-change")) {
  class WcVisibilityChange extends HTMLElement {
    static get observedAttributes() {
      return ["hx-verb", "hx-url", "hx-target", "hx-swap", "hx-indicator", "hx-push-url", "hx-select"];
    }
    constructor() {
      super();
      this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
      this._pendingAttributes = {};
      this._isConnected = false;
    }
    async connectedCallback() {
      if (!this._isConnected) {
        console.log("Initial visibility state:", document.visibilityState);
        console.log("Is document hidden?", document.hidden);
        document.addEventListener("visibilitychange", this.handleVisibilityChange);
      }
      this._isConnected = true;
      this._applyPendingAttributes();
    }
    disconnectedCallback() {
      if (this.form) {
        document.removeEventListener("visibilitychange", this.handleVisibilityChange);
      }
    }
    handleVisibilityChange() {
      if (document.hidden) {
        console.log("Tab is in the background");
      } else {
        const verb = this.getAttribute("hx-verb") || "GET";
        const url = this.getAttribute("hx-url") || "";
        const target = this.getAttribute("hx-target") || "";
        const swap = this.getAttribute("hx-swap") || "";
        const indicator = this.getAttribute("hx-indicator") || "";
        const pushUrl = this.getAttribute("hx-push-url") || "";
        const select = this.getAttribute("hx-select") || "";
        if (htmx) {
          if (verb && url && target && swap) {
            htmx.ajax(verb, url, { target, swap, indicator, pushUrl, select });
          }
        }
        console.log("Tab is in the foreground");
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
    }
  }
  customElements.define("wc-visibility-change", WcVisibilityChange);
}

// src/js/components/wc-event-handler.js
var WcEventHandler = class extends HTMLElement {
  static get observedAttributes() {
    return [
      "event-name",
      "action",
      "action-target"
    ];
  }
  constructor() {
    super();
  }
  connectedCallback() {
    const eventName = this.getAttribute("event-name") || "";
    if (eventName) {
      document.body.addEventListener(eventName, this._handleEvent.bind(this));
    } else {
      console.warn("No event-name provided!");
    }
  }
  disconnectedCallback() {
    const eventName = this.getAttribute("event-name") || "";
    if (eventName) {
      document.body.removeEventListener(eventName, this._handleEvent.bind(this));
    }
  }
  _handleEvent(event) {
    const { target, detail } = event;
    const actionTarget = this.getAttribute("action-target") || "";
    const elt = document.querySelector(actionTarget);
    if (elt) {
      const { cls, action, item, selector } = detail;
      if (action === "add-class") {
        elt.classList.add(cls);
      } else if (action === "remove-class") {
        elt.classList.remove(cls);
      } else if (action === "toggle-class") {
        elt.classList.toggle(cls);
      } else if (action === "add-item") {
        const d = document.createElement("div");
        d.innerHTML = item;
        elt.appendChild(d.firstChild);
      } else if (action === "remove-item") {
        const tgt = document.querySelector(selector);
        tgt.remove();
      } else if (action === "click") {
        const tgt = document.querySelector(selector);
        tgt.click();
      } else {
      }
    }
    console.log("_handleEvent:target", target, "detail:", detail, "actionTarget:", actionTarget);
  }
};
customElements.define("wc-event-handler", WcEventHandler);

// src/js/components/wc-event-hub.js
var WcEventHub = class extends HTMLElement {
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
  broadcast(eventName, selector, subSelector) {
    const payload = { detail: { selector, subSelector } };
    const custom = new CustomEvent(eventName, payload);
    document.body.dispatchEvent(custom);
  }
};
customElements.define("wc-event-hub", WcEventHub);

// src/js/components/wc-mask-hub.js
var WcMaskHub = class extends HTMLElement {
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
    const { target } = event;
    const phoneMask = IMask(target, {
      mask: [
        {
          mask: "(000) 000-0000",
          startsWith: ""
          // lazy: false,
          // eager: true
        }
      ],
      dispatch: function(appended, dynamicMasked) {
        const number = (dynamicMasked.value + appended).replace(/\D/g, "");
        return dynamicMasked.compiledMasks[0];
      }
    });
  }
};
customElements.define("wc-mask-hub", WcMaskHub);

// src/js/components/wc-hotkey.js
if (!customElements.get("wc-hotkey")) {
  class WcHotkey extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      const keyCombination = this.getAttribute("keys") || "";
      const targetSelector = this.getAttribute("target") || "";
      if (!keyCombination || !targetSelector) {
        console.error('WcHotkey requires "keys" and "target" attributes.');
        return;
      }
      const targetElement = document.querySelector(targetSelector);
      if (!targetElement) {
        console.error(`Target element not found for selector: ${targetSelector}`);
        return;
      }
      const keys = keyCombination.split("+");
      const keyMap = {
        metaKey: keys.includes("cmd"),
        ctrlKey: keys.includes("ctrl"),
        shiftKey: keys.includes("shift"),
        altKey: keys.includes("alt"),
        key: keys.find((k) => !["cmd", "ctrl", "shift", "alt"].includes(k)) || ""
      };
      const handleKeydown = (event) => {
        if (keyMap.metaKey === event.metaKey && keyMap.ctrlKey === event.ctrlKey && keyMap.shiftKey === event.shiftKey && keyMap.altKey === event.altKey && keyMap.key.toLowerCase() === event.key.toLowerCase()) {
          event.preventDefault();
          targetElement.click();
        }
      };
      document.addEventListener("keydown", handleKeydown);
      this.cleanup = () => {
        document.removeEventListener("keydown", handleKeydown);
      };
    }
    disconnectedCallback() {
      if (this.cleanup) this.cleanup();
    }
  }
  customElements.define("wc-hotkey", WcHotkey);
}

// src/js/components/wc-link.js
if (!customElements.get("wc-link")) {
  class WcLink extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      const url = this.getAttribute("url");
      if (url) {
        const linkId = `wc-link-${this.id || this.dataset.id || crypto.randomUUID()}`;
        if (!window.wc) {
          window.wc = {};
        }
        if (!window.wc.scriptsLoaded) {
          window.wc["linksLoaded"] = {};
        }
        if (!document.getElementById(linkId)) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = url;
          link.id = linkId;
          link.onload = () => {
            console.log(`Link loaded: ${url}`);
            window.wc.linksLoaded[url] = true;
            document.body.dispatchEvent(new CustomEvent("link-loaded", {
              detail: { url },
              bubbles: true,
              composed: true
            }));
          };
          link.onerror = () => {
            console.error(`Failed to load link: ${url}`);
            document.body.dispatchEvent(new CustomEvent("link-error", {
              detail: { url },
              bubbles: true,
              composed: true
            }));
          };
          document.head.appendChild(link);
          console.log(`Added link: ${url}`);
        } else {
          console.log(`Link already exists, skipping append: ${url}`);
          document.body.dispatchEvent(new CustomEvent("link-loaded", {
            detail: { url },
            bubbles: true,
            composed: true
          }));
        }
      } else {
        console.warn("No URL provided for wc-link component.");
      }
      this.remove();
    }
  }
  customElements.define("wc-link", WcLink);
}

// src/js/components/wc-script.js
if (!customElements.get("wc-script")) {
  class WcScript extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      const src = this.getAttribute("src");
      if (!window.wc) {
        window.wc = {};
      }
      if (!window.wc.scriptsLoaded) {
        window.wc["scriptsLoaded"] = {};
      }
      if (src) {
        const scriptId = `wc-script-${this.id || this.dataset.id || crypto.randomUUID()}`;
        if (!document.getElementById(scriptId)) {
          const script = document.createElement("script");
          script.type = "text/javascript";
          script.src = src;
          script.id = scriptId;
          script.onload = () => {
            console.log(`Script loaded: ${src}`);
            window.wc.scriptsLoaded[src] = true;
            document.body.dispatchEvent(new CustomEvent("script-loaded", {
              detail: { src },
              bubbles: true,
              composed: true
            }));
          };
          script.onerror = () => {
            console.error(`Failed to load script: ${src}`);
            document.body.dispatchEvent(new CustomEvent("script-error", {
              detail: { src },
              bubbles: true,
              composed: true
            }));
          };
          document.head.appendChild(script);
          console.log(`Added script: ${src}`);
        } else {
          console.log(`Script already exists, skipping append: ${src}`);
          document.body.dispatchEvent(new CustomEvent("script-loaded", {
            detail: { src },
            bubbles: true,
            composed: true
          }));
        }
      } else {
        console.warn("No src provided for wc-script component.");
      }
      this.remove();
    }
  }
  customElements.define("wc-script", WcScript);
}

// src/js/components/wc-javascript.js
if (!customElements.get("wc-javascript")) {
  class WcJavascript extends HTMLElement {
    constructor() {
      super();
    }
    connectedCallback() {
      const scriptContent = this.textContent.trim();
      if (scriptContent) {
        const scriptId = `wc-javascript-${this.id || this.dataset.id || crypto.randomUUID()}`;
        if (!document.getElementById(scriptId)) {
          if (!window.wc) {
            window.wc = {};
          }
          if (!window.wc.scripts) {
            window.wc.scripts = {};
          }
          window.wc.loadCSS = loadCSS;
          window.wc.loadScript = loadScript;
          window.wc.loadLibrary = loadLibrary;
          window.wc.loadStyle = loadStyle;
          const script = document.createElement("script");
          script.type = "text/javascript";
          script.textContent = scriptContent;
          script.id = scriptId;
          document.head.appendChild(script);
        } else {
          console.log("Script already exists, skipping append:", scriptId);
          const fn = window.wc.scripts[scriptId];
          if (fn) {
            console.log("Calling script function...");
            fn();
          }
        }
      }
      this.textContent = "";
    }
  }
  customElements.define("wc-javascript", WcJavascript);
}

// src/js/components/wc-form.js
var WcForm = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["class"];
  }
  constructor() {
    super();
    this.passThruAttributes = [
      "id",
      "name",
      "method",
      "action",
      "hx-post",
      "hx-put",
      "hx-target",
      "hx-swap",
      "hx-push-url"
    ];
    this.passThruEmptyAttributes = [];
    this.ignoreAttributes = [];
    const compEl = this.querySelector(".wc-form");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("form");
      this.componentElement.classList.add("wc-form");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-form");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-form");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "test") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-form > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this.passThruAttributes.forEach((p) => {
        if (this.hasAttribute(p)) {
          const v = this.getAttribute(p);
          this.componentElement?.setAttribute(p, v);
        }
      });
      this.passThruAttributes.forEach((p) => {
        this.removeAttribute(p);
      });
      this._moveDeclarativeInner();
      this._wireEvents();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-form");
  }
  _moveDeclarativeInner() {
    const innerParts = this.querySelectorAll("wc-form > *:not(.wc-form)");
    if (innerParts.length > 0) {
      innerParts.forEach((p) => this.componentElement.appendChild(p));
    }
  }
  _handleSubmit(event) {
    event.preventDefault();
    const { target } = event;
    const disabledInputs = this.componentElement.querySelectorAll("[disabled]");
    disabledInputs.forEach((elt) => elt.disabled = false);
    disabledInputs.forEach((elt) => elt.removeAttribute("disabled"));
    target.submit();
    disabledInputs.forEach((elt) => elt.disabled = true);
    disabledInputs.forEach((elt) => elt.setAttribute("disabled", ""));
  }
  _applyStyle() {
    const style = `
      .wc-form {
        position: relative;
      }
    `.trim();
    this.loadStyle("wc-form-style", style);
  }
  _wireEvents() {
    super._wireEvents();
    this.componentElement.addEventListener("submit", this._handleSubmit.bind(this));
  }
  _unWireEvents() {
    super._unWireEvents();
    this.componentElement.removeEventListener("submit", this._handleSubmit.bind(this));
  }
};
customElements.define("wc-form", WcForm);

// src/js/components/wc-input.js
var WcInput = class _WcInput extends WcBaseFormComponent {
  static get observedAttributes() {
    return [
      "name",
      "id",
      "class",
      "type",
      "value",
      "placeholder",
      "lbl-label",
      "lbl-class",
      "radio-group-class",
      "checked",
      "disabled",
      "readonly",
      "required",
      "autocomplete",
      "autofocus",
      "min",
      "max",
      "minlength",
      "maxlength",
      "pattern",
      "step",
      "multiple",
      "novalidate",
      "elt-class",
      "toggle-swtich"
    ];
  }
  static get icons() {
    return [
      {
        name: "email-stroke",
        icon: `
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="0.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"></path>
          </svg>
        `.trim()
      },
      {
        name: "email-fill",
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="CurrentColor">
            <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48L48 64zM0 176L0 384c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-208L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z"/>
          </svg>
        `.trim()
      },
      {
        name: "tel-stroke",
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="0.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"></path>
          </svg>
        `.trim()
      },
      {
        name: "tel-fill",
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="currentColor">
            <path d="M164.9 24.6c-7.7-18.6-28-28.5-47.4-23.2l-88 24C12.1 30.2 0 46 0 64C0 311.4 200.6 512 448 512c18 0 33.8-12.1 38.6-29.5l24-88c5.3-19.4-4.6-39.7-23.2-47.4l-96-40c-16.3-6.8-35.2-2.1-46.3 11.6L304.7 368C234.3 334.7 177.3 277.7 144 207.3L193.3 167c13.7-11.2 18.4-30 11.6-46.3l-40-96z"/>
          </svg>
        `.trim()
      },
      {
        name: "currency-circle",
        icon: `
          <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke-width="0.75" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        `.trim()
      },
      {
        name: "currency-symbol",
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" fill="currentColor">
            <path d="M160 0c17.7 0 32 14.3 32 32l0 35.7c1.6 .2 3.1 .4 4.7 .7c.4 .1 .7 .1 1.1 .2l48 8.8c17.4 3.2 28.9 19.9 25.7 37.2s-19.9 28.9-37.2 25.7l-47.5-8.7c-31.3-4.6-58.9-1.5-78.3 6.2s-27.2 18.3-29 28.1c-2 10.7-.5 16.7 1.2 20.4c1.8 3.9 5.5 8.3 12.8 13.2c16.3 10.7 41.3 17.7 73.7 26.3l2.9 .8c28.6 7.6 63.6 16.8 89.6 33.8c14.2 9.3 27.6 21.9 35.9 39.5c8.5 17.9 10.3 37.9 6.4 59.2c-6.9 38-33.1 63.4-65.6 76.7c-13.7 5.6-28.6 9.2-44.4 11l0 33.4c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-34.9c-.4-.1-.9-.1-1.3-.2l-.2 0s0 0 0 0c-24.4-3.8-64.5-14.3-91.5-26.3c-16.1-7.2-23.4-26.1-16.2-42.2s26.1-23.4 42.2-16.2c20.9 9.3 55.3 18.5 75.2 21.6c31.9 4.7 58.2 2 76-5.3c16.9-6.9 24.6-16.9 26.8-28.9c1.9-10.6 .4-16.7-1.3-20.4c-1.9-4-5.6-8.4-13-13.3c-16.4-10.7-41.5-17.7-74-26.3l-2.8-.7s0 0 0 0C119.4 279.3 84.4 270 58.4 253c-14.2-9.3-27.5-22-35.8-39.6c-8.4-17.9-10.1-37.9-6.1-59.2C23.7 116 52.3 91.2 84.8 78.3c13.3-5.3 27.9-8.9 43.2-11L128 32c0-17.7 14.3-32 32-32z"/>
          </svg>
        `.trim()
      }
    ];
  }
  constructor() {
    super();
    this.passThruAttributes = [
      "autocomplete",
      "placeholder",
      "min",
      "max",
      "minlength",
      "maxlength",
      "pattern",
      "step",
      "multiple"
    ];
    this.passThruEmptyAttributes = [
      "autofocus",
      "disabled",
      "readonly",
      "required",
      "novalidate"
    ];
    this.ignoreAttributes = [
      "lbl-label",
      "toggle-switch"
    ];
    const compEl = this.querySelector(".wc-input");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-input", "relative");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-input");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-input");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (this.passThruAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, newValue);
    }
    if (this.passThruEmptyAttributes.includes(attrName)) {
      const type = this.getAttribute("type") || "text";
      if (type === "radio") {
        const radios = this.querySelectorAll('input[type="radio"]');
        radios.forEach((radio) => {
          radio.setAttribute(attrName, "");
        });
      } else {
        this.formElement?.setAttribute(attrName, "");
      }
    }
    if (this.ignoreAttributes.includes(attrName)) {
    }
    if (attrName === "lbl-class") {
      const name = this.getAttribute("name");
      const lbl = this.querySelector(`label[for="${name}"]`);
      lbl?.classList.add(newValue);
    } else if (attrName === "radio-group-class") {
      const elt = this.querySelector(".radio-group");
      const parts = newValue.split(" ");
      parts.forEach((p) => {
        if (p) {
          elt?.classList.add(p.trim());
        }
      });
    } else if (attrName === "type") {
      this.formElement?.setAttribute("type", newValue);
      if (newValue === "checkbox") {
        if (this.hasAttribute("checked")) {
          this.formElement?.setAttribute("checked", "");
          this.formElement?.setAttribute("value", "bool:True");
        } else {
          this.formElement?.removeAttribute("checked");
          this.formElement?.setAttribute("value", "bool:False");
        }
      } else if (newValue === "currency") {
        this.formElement?.setAttribute("type", "number");
      }
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-input > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-input");
  }
  _createInnerElement() {
    const labelText = this.getAttribute("lbl-label") || "";
    const name = this.getAttribute("name");
    const type = this.getAttribute("type") || "text";
    const isToggle = this.hasAttribute("toggle-switch");
    if (labelText) {
      const lblEl = document.createElement("label");
      const value = this.getAttribute("value") || "";
      if (type === "range" && value) {
        lblEl.textContent = `${labelText} (${value})`;
      } else {
        lblEl.textContent = labelText;
      }
      lblEl.setAttribute("for", name);
      this.componentElement.appendChild(lblEl);
    }
    this.formElement = document.createElement("input");
    this.formElement.setAttribute("form-element", "");
    this.formElement.setAttribute("type", type);
    if (type === "radio") {
      let options = [];
      let optionList = this.querySelectorAll("option");
      optionList.forEach((f) => {
        const key = f.textContent.trim();
        const value = f.value.trim();
        options.push({ "key": key, "value": value });
      });
      optionList.forEach((f) => f.remove());
      if (options.length == 0) {
        options = this.getAttribute("options") ? JSON.parse(this.getAttribute("options")) : [];
      }
      const radioContainer = document.createElement("div");
      radioContainer.classList.add("radio-group");
      options.forEach((option) => {
        const radioLabel = document.createElement("label");
        radioLabel.classList.add("radio-option");
        radioLabel.textContent = option.key;
        const radioInput = document.createElement("input");
        radioInput.setAttribute("type", "radio");
        radioInput.setAttribute("name", name);
        radioInput.setAttribute("value", option.value);
        if (option.value === this.getAttribute("value")) {
          radioInput.setAttribute("checked", "");
        }
        radioLabel.prepend(radioInput);
        radioContainer.appendChild(radioLabel);
      });
      this.componentElement.appendChild(radioContainer);
    } else if (type === "checkbox" && isToggle) {
      this.formElement.classList.add("toggle-checkbox");
      const toggleWrapper = document.createElement("div");
      toggleWrapper.classList.add("toggle-wrapper");
      toggleWrapper.appendChild(this.formElement);
      const toggleSwitch = document.createElement("span");
      toggleSwitch.classList.add("toggle-switch");
      toggleWrapper.appendChild(toggleSwitch);
      this.componentElement.appendChild(toggleWrapper);
      const hiddenCheckbox = document.createElement("input");
      hiddenCheckbox.name = name;
      hiddenCheckbox.type = "hidden";
      hiddenCheckbox.checked = true;
      hiddenCheckbox.value = "bool:False";
      this.componentElement.appendChild(hiddenCheckbox);
    } else if (type === "currency") {
      this.formElement.setAttribute("type", "number");
      const icon = document.createElement("span");
      icon.classList.add("icon");
      const iconItem = _WcInput.icons.find((f) => f.name === "currency-symbol");
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === "email") {
      const icon = document.createElement("span");
      icon.classList.add("icon");
      const iconItem = _WcInput.icons.find((f) => f.name === "email-fill");
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === "tel") {
      const icon = document.createElement("span");
      icon.classList.add("icon");
      const iconItem = _WcInput.icons.find((f) => f.name === "tel-fill");
      icon.innerHTML = iconItem.icon;
      this.formElement.setAttribute("_", `on load or input
          call wc.MaskHub.phoneMask(event)
          me.setCustomValidity('')
        end`);
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else {
      this.componentElement.appendChild(this.formElement);
    }
  }
  _applyStyle() {
    const style = `
      wc-input .toggle-wrapper {
        position: relative;
        width: 50px;
        height: 22px;
        display: inline-block;
      }

      wc-input .toggle-checkbox {
        opacity: 0;
        width: 100%;
        height: 100%;
      }
      wc-input .toggle-checkbox:focus-visible + .toggle-switch {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 0px;
      }

      wc-input .toggle-switch {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: var(--white-color);
        border: 1px solid var(--component-border-color);
        border-radius: 25px;
        /* cursor: pointer; */
        transition: background-color 0.4s;
        pointer-events: none;
      }

      .dark wc-input .toggle-switch {
        background-color: var(--white-color);
        border: 1px solid var(--component-border-color);
      }

      wc-input .toggle-switch::before {
        position: absolute;
        content: "";
        height: 15px;
        width: 15px;
        left: 2px;
        bottom: 2px;
        background-color: var(--accent-bg-color);
        border: 1px solid var(--secondary-bg-color);
        border-radius: 50%;
        transition: transform 0.4s;
      }
      wc-input .toggle-checkbox:hover:not(:disabled) + .toggle-switch::before {
        background-color: var(--secondary-bg-color);
      }

      wc-input .toggle-checkbox:checked + .toggle-switch {
        background-color: var(--component-bg-color);
      }
      .dark wc-input .toggle-checkbox:checked + .toggle-switch {
        background-color: var(--component-bg-color);
      }

      wc-input .toggle-checkbox:checked + .toggle-switch::before {
        transform: translateX(27px);
      }

      wc-input .toggle-checkbox:disabled + .toggle-switch {
        opacity: 0.7;
      }




      wc-input .radio-group {
        display: flex;
        height: 29.5px;
      }
      wc-input .radio-group:not(.modern) {
        gap: 0.5rem;
      }
      wc-input .radio-group .radio-option {
        display: inline-flex;
        align-items: center;
        position: relative;
        outline: none;
      }
      wc-input .radio-group:not(.modern) .radio-option {
        padding-left: 12px;
      }
      wc-input .radio-group.modern {
        border: 1px solid var(--accent-bg-color);
        border-radius: 5px;
      }
      wc-input .radio-group.modern .radio-option {
        padding: 0 0.5rem;
        background-color: var(--secondary-bg-color);
        color: var(--secondary-color);
        border-right: 1px solid var(--accent-bg-color);
      }
      wc-input .radio-group.modern .radio-option:first-child {
        border-top-left-radius: 5px;
        border-bottom-left-radius: 5px;
      }
      wc-input .radio-group.modern .radio-option:last-child {
        border-right: none;
        border-top-right-radius: 5px;
        border-bottom-right-radius: 5px;
      }
      wc-input .radio-group .radio-option input[type="radio"] {
        opacity: 0;
        margin: 0;
      }
      wc-input .radio-group.modern .radio-option input[type="radio"] {
        position: absolute;
      }
      wc-input .radio-group.modern .radio-option:hover:not(:has(input[type="radio"]:disabled)) {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-input .radio-group.modern .radio-option:has(input[type="radio"]:checked) {
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-input .radio-group.modern:has(:focus-within) {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 0px;
        border: 1px solid transparent;
      }
      wc-input .radio-group:not(.modern) .radio-option::before {
        content: "";
        display: inline-block;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 2px solid var(--component-border-color);
        background-color: var(--white-color);
        transition: border-color 0.3s;
        position: absolute;
        left: 0;
      }
      wc-input .radio-group:not(.modern) .radio-option:has(:checked)::after {
        content: "";
        display: inline-block;
        width: 10px; /* Slightly smaller than outer circle */
        height: 10px;
        border-radius: 50%;
        background-color: var(--accent-bg-color);
        position: absolute;
        left: 5px;
        top: 5px;
        transition: background-color 0.3s;
      }
      wc-input .radio-option:hover::before {
        border-color: var(--secondary-bg-color);
      }
      wc-input .radio-group:not(.modern) .radio-option:focus-within::after {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 0px;
      }




      wc-input input[type="email"] {
        padding-left: 25px;
        min-width: 130px;
      }
      wc-input input[type="email"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }


      wc-input input[type="tel"] {
        padding-left: 25px;
        min-width: 130px;
      }
      wc-input input[type="tel"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }

      wc-input[type="currency"] input[type="number"] {
        padding-left: 25px;
      }
      wc-input[type="currency"] input[type="number"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }


    `.trim();
    this.loadStyle("wc-input-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-input", WcInput);

// src/js/components/wc-select.js
var WcSelect = class extends WcBaseFormComponent {
  static get observedAttributes() {
    return ["name", "id", "class", "multiple", "value", "items", "display-member", "value-member", "lbl-label", "disabled", "required", "autofocus", "elt-class"];
  }
  constructor() {
    super();
    this.selectedOptions = [];
    this.mode = this.getAttribute("mode") || "chip";
    this.highlightedIndex = -1;
    const compEl = this.querySelector(".wc-select");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-select", "relative");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-select");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-select");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "autofocus") {
      this.formElement?.setAttribute("autofocus", "");
    } else if (attrName === "items") {
      if (typeof newValue === "string") {
        this._items = JSON.parse(newValue);
        this._generateOptionsFromItems();
        this._items.forEach((item) => {
          if (item.selected) {
            const displayMember = this.getAttribute("display-member") || "key";
            const valueMember = this.getAttribute("value-member") || "value";
            this.addChip(item[valueMember], item[displayMember]);
          }
        });
      }
      this.removeAttribute("items");
    } else if (attrName === "disabled") {
      this.formElement?.setAttribute("disabled", "");
    } else if (attrName === "required") {
      this.formElement?.setAttribute("required", "");
    } else if (attrName === "multiple") {
      this.formElement?.setAttribute("multiple", "");
    } else if (attrName === "lbl-label") {
    } else if (attrName === "value-member") {
    } else if (attrName === "display-member") {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-select > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
      const options = this.querySelectorAll("option[selected]");
      options.forEach((opt) => {
        this.addChip(opt.value, opt.textContent);
      });
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-select");
  }
  _createInnerElement() {
    const labelText = this.getAttribute("lbl-label") || "";
    const name = this.getAttribute("name");
    const options = this.querySelectorAll("option");
    if (this.hasAttribute("lbl-label")) {
      const lbl = document.createElement("label");
      lbl.textContent = labelText;
      if (this.getAttribute("mode") === "chip") {
        lbl.setAttribute("for", "dropdownInput");
      } else {
        lbl.setAttribute("for", name);
      }
      this.componentElement.appendChild(lbl);
    }
    const select = document.createElement("select");
    select.id = name;
    select.name = name;
    if (this.getAttribute("multiple")) {
      select.multiple = true;
      select.setAttribute("multiple", "");
    }
    options.forEach((opt) => {
      select.appendChild(opt);
    });
    this.formElement = select;
    if (this.getAttribute("mode") === "chip") {
      select.name = name;
      const hostContainer = document.createElement("div");
      hostContainer.classList.add("row");
      const container = document.createElement("div");
      container.classList.add("chip-container");
      container.id = "chipContainer";
      hostContainer.appendChild(container);
      const dropdown = document.createElement("div");
      dropdown.classList.add("dropdown");
      const ipt = document.createElement("input");
      ipt.classList.add("dropdown-input");
      ipt.id = "dropdownInput";
      ipt.setAttribute("placeholder", "Add or select...");
      if (this.hasAttribute("disabled")) {
        ipt.setAttribute("disabled", "");
      }
      if (this.hasAttribute("required")) {
        ipt.setAttribute("required", "");
      }
      dropdown.appendChild(ipt);
      const optionsContainer = document.createElement("div");
      optionsContainer.classList.add("options-container");
      optionsContainer.id = "optionsContainer";
      optionsContainer.innerHTML = Array.from(options).map((option) => `<div class="option" data-value="${option.value}">${option.textContent}</div>`).join("");
      dropdown.appendChild(optionsContainer);
      dropdown.appendChild(select);
      hostContainer.appendChild(dropdown);
      this.componentElement.appendChild(hostContainer);
    } else {
      this.componentElement.appendChild(select);
    }
    this.removeAttribute("name");
    this.attachEventListeners();
  }
  _generateOptionsFromItems() {
    const displayMember = this.getAttribute("display-member") || "key";
    const valueMember = this.getAttribute("value-member") || "value";
    const value = this.getAttribute("value") || null;
    this.formElement.innerHTML = "";
    this._items.forEach((item) => {
      const opt = document.createElement("option");
      if (typeof item === "object") {
        opt.value = item[valueMember];
        opt.textContent = item[displayMember];
      } else {
        opt.value = item;
        opt.textContent = item;
      }
      if (opt.value == value) {
        opt.selected = true;
      }
      this.formElement.appendChild(opt);
    });
    const optionsContainer = this.querySelector(".options-container");
    if (optionsContainer) {
      const options = this.formElement.querySelectorAll("option");
      optionsContainer.innerHTML = Array.from(options).map((option) => `<div class="option" data-value="${option.value}">${option.textContent}</div>`).join("");
    }
  }
  _applyStyle() {
    const style = `
      wc-select .chip-container { 
        display: none;
        flex-wrap: wrap; 
        gap: 5px; 
        margin-bottom: 5px; 
      }
      wc-select[mode="chip"] .chip-container { 
        display: flex; 
      }

      wc-select .chip { 
        display: flex; 
        align-items: center; 
        padding: 5px; 
        background-color: var(--primary-bg-color); 
        border-radius: 15px; 
        font-size: 0.75rem; /* 12px */
        line-height: 1rem; /* 16px */
      }
      wc-select .chip-close { 
        margin-left: 5px; 
        cursor: pointer; 
        font-weight: bold; 
      }
      wc-select:has(:disabled) .chip {
        opacity: 0.7;
        font-style: italic;
      }
      wc-select:has(:disabled) .chip .chip-close {
        display: none;
      }
      wc-select .dropdown { 
        display: flex; 
        flex-direction: row;
        flex: 1 1 0%;
        position: relative; 
      }
      wc-select .dropdown-input { 
        display: none;
        width: 100%;
        min-width: 85px;
        padding: 0.375rem;
      }
      wc-select .chip-container:has(.chip) + .dropdown .dropdown-input {
        margin-left: 0.5rem;
      }
      wc-select[mode="chip"] .dropdown-input { 
        display: block; 
      }
      wc-select .options-container { 
        display: none;
        position: absolute; 
        top: 29.5px; 
        left: 0; 
        right: 0; 
        background: var(--secondary-bg-color); 
        color: var(--secondary-color);
        border: 1px solid var(--accent-bg-color); 
        max-height: 150px;
        margin-left 0.5rem;
        overflow-y: auto; 
        z-index: 10; 
      }

      wc-select[mode="chip"] .options-container { 
        display: none;
      }
      wc-select .chip-container:has(.chip) + .dropdown .options-container {
        margin-left: 0.5rem;
      }
      wc-select .option { 
        padding: 5px; 
        cursor: pointer; 
      }
      wc-select .option.highlighted { 
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-select .option:hover { 
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-select select { 
        display: block; 
        width: 100%; 
        padding: 5px; 
      }
      wc-select[mode="multiple"] select { 
        display: block;
      }
      wc-select[mode="chip"] select { 
        display: none;
      }
      wc-select select:disabled { 
        cursor: not-allowed;
        opacity: 0.7;
        font-style: italic;
      }
      wc-select select:disabled option {
        color: var(--component-color);
      }
      wc-select .dropdown-input:disabled {
        cursor: not-allowed;
        opacity: 0.7;
        font-style: italic;
      }
    `.trim();
    this.loadStyle("wc-select-style", style);
  }
  attachEventListeners() {
    const dropdownInput = this.querySelector("#dropdownInput");
    const optionsContainer = this.querySelector("#optionsContainer");
    const chipContainer = this.querySelector("#chipContainer");
    if (this.mode === "chip") {
      if (dropdownInput) {
        dropdownInput?.addEventListener("focus", () => optionsContainer.style.display = "block");
        dropdownInput?.addEventListener("input", () => this.filterOptions(dropdownInput.value));
        optionsContainer?.addEventListener("click", (e) => {
          if (e.target.classList.contains("option")) {
            this.addChip(e.target.getAttribute("data-value"), e.target.textContent);
            optionsContainer.style.display = "none";
            dropdownInput.value = "";
          }
        });
        dropdownInput?.addEventListener("keydown", (e) => this.handleKeyboardNavigation(e));
        document.addEventListener("click", (e) => {
          if (!this.contains(e.target)) {
            optionsContainer.style.display = "none";
          }
        });
        chipContainer?.addEventListener("click", (e) => {
          if (e.target.classList.contains("chip-close")) {
            const chip = e.target.closest(".chip");
            const value = chip.getAttribute("data-value");
            this.removeChip(value);
          }
        });
      }
    }
  }
  handleKeyboardNavigation(e) {
    const optionsContainer = this.querySelector("#optionsContainer");
    const options = Array.from(optionsContainer.querySelectorAll(".option")).filter((option) => option.style.display !== "none");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex + 1) % options.length;
      this.updateHighlight(options);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex - 1 + options.length) % options.length;
      this.updateHighlight(options);
    } else if (e.key === "Enter" && this.highlightedIndex >= 0) {
      e.preventDefault();
      const highlightedOption = options[this.highlightedIndex];
      this.addChip(highlightedOption.getAttribute("data-value"), highlightedOption.textContent);
      this.resetDropdown();
    } else if (e.key === "Escape") {
      this.resetDropdown();
    }
  }
  updateHighlight(options) {
    options.forEach((option) => option.classList.remove("highlighted"));
    if (this.highlightedIndex >= 0 && this.highlightedIndex < options.length) {
      options[this.highlightedIndex].classList.add("highlighted");
    }
  }
  resetDropdown() {
    const dropdownInput = this.querySelector("#dropdownInput");
    const optionsContainer = this.querySelector("#optionsContainer");
    this.highlightedIndex = -1;
    dropdownInput.value = "";
    optionsContainer.style.display = "none";
    this.updateHighlight([]);
  }
  filterOptions(query) {
    const optionsContainer = this.querySelector("#optionsContainer");
    const options = optionsContainer.querySelectorAll(".option");
    options.forEach((option) => {
      if (option.textContent.toLowerCase().includes(query.toLowerCase()) && !this.selectedOptions.includes(option.getAttribute("data-value"))) {
        option.style.display = "block";
      } else {
        option.style.display = "none";
      }
    });
    this.highlightedIndex = -1;
    this.updateHighlight([]);
  }
  addChip(value, label) {
    if (this.selectedOptions.includes(value)) return;
    setTimeout(() => {
      this.selectedOptions.push(value);
      this.updateSelect();
      this.updateChips();
      this.updateDropdownOptions();
      const event = new Event("change");
      this.dispatchEvent(event);
    }, 10);
  }
  removeChip(value) {
    this.selectedOptions = this.selectedOptions.filter((v) => v !== value);
    this.updateSelect();
    this.updateChips();
    this.updateDropdownOptions();
    const event = new Event("change");
    this.dispatchEvent(event);
  }
  updateChips() {
    const chipContainer = this.querySelector("#chipContainer");
    if (chipContainer) {
      if (this.mode === "chip") {
        chipContainer.innerHTML = this.selectedOptions.map((value) => {
          const option = Array.from(this.querySelectorAll("option")).find((opt) => opt.value === value);
          const label = option ? option.textContent : value;
          return `<div class="chip" data-value="${value}">${label}<span class="chip-close">&times;</span></div>`;
        }).join("");
      }
    }
  }
  updateSelect() {
    const selectElement = this.querySelector("select");
    selectElement.innerHTML = Array.from(this.querySelectorAll("option")).map((option) => `<option value="${option.value}" ${this.selectedOptions.includes(option.value) ? "selected" : ""}>${option.textContent}</option>`).join("");
  }
  updateDropdownOptions() {
    const optionsContainer = this.querySelector("#optionsContainer");
    if (optionsContainer) {
      Array.from(optionsContainer.querySelectorAll(".option")).forEach((option) => {
        option.style.display = this.selectedOptions.includes(option.getAttribute("data-value")) ? "none" : "block";
      });
    }
  }
};
customElements.define("wc-select", WcSelect);

// src/js/components/wc-textarea.js
var WcTextarea = class extends WcBaseFormComponent {
  static get observedAttributes() {
    return ["name", "id", "class", "value", "rows", "cols", "placeholder", "lbl-label", "disabled", "readonly", "required", "autofocus", "elt-class"];
  }
  constructor() {
    super();
    this.firstContent = "";
    if (this.firstChild && this.firstChild.nodeName == "#text") {
      this.firstContent = this.firstChild.textContent;
      this.removeChild(this.firstChild);
    }
    const compEl = this.querySelector(".wc-textarea");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-textarea", "relative");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-textarea");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-textarea");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "autofocus") {
      this.formElement?.setAttribute("autofocus", "");
    } else if (attrName === "lbl-label") {
    } else if (attrName === "disabled") {
      this.formElement?.setAttribute("disabled", "");
    } else if (attrName === "readonly") {
      this.formElement?.setAttribute("readonly", "");
    } else if (attrName === "required") {
      this.formElement?.setAttribute("required", "");
    } else if (attrName === "placeholder") {
      this.formElement?.setAttribute("placeholder", newValue);
    } else if (attrName === "cols") {
      this.formElement?.setAttribute("cols", newValue);
    } else if (attrName === "rows") {
      this.formElement?.setAttribute("rows", newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-textarea > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-textarea");
  }
  _createInnerElement() {
    const labelText = this.getAttribute("lbl-label") || "";
    const name = this.getAttribute("name");
    if (labelText) {
      const lblEl = document.createElement("label");
      lblEl.textContent = labelText;
      lblEl.setAttribute("for", name);
      this.componentElement.appendChild(lblEl);
    }
    this.formElement = document.createElement("textarea");
    this.formElement.setAttribute("form-element", "");
    this.componentElement.appendChild(this.formElement);
    const value = this.getAttribute("value") || "";
    if (this.firstContent && !value) {
      this.setAttribute("value", this.firstContent.trim());
    }
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-textarea", WcTextarea);
export {
  checkResources,
  generateUniqueId,
  hide,
  hideAndShow,
  isCustomElement,
  loadCSS,
  loadLibrary,
  loadScript,
  loadStyle,
  locator,
  locatorAll,
  show,
  sleep,
  waitForResourcePolling,
  waitForSelectorPolling
};
