// src/js/components/helper-function.js
function isCustomElement(element) {
  return element.tagName.includes("-");
}
function generateUniqueId2() {
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
    script.onload = resolve;
    script.onerror = reject;
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
  return new Promise((resolve, reject) => {
    if (document.querySelector(`style#${id}`)) {
      resolve();
      return;
    }
    const style = document.createElement("style");
    style.id = id;
    style.textContent = content.trim();
    style.onload = resolve;
    style.onerror = reject;
    document.head.appendChild(style);
  });
}
function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
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
function waitForSelectorPolling(selector, timeout = 3e3, interval = 100) {
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
function waitForSelectorsPolling(selectors = [], timeout = 3e3) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];
    const checkAvailability = () => {
      const allAvailable = selectorList.every((selector) => document.querySelector(selector) !== null);
      if (allAvailable) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout: Not all selectors available after ${timeout}ms. Missing selectors: ${JSON.stringify(selectorList)}`));
      } else {
        requestAnimationFrame(checkAvailability);
      }
    };
    checkAvailability();
  });
}
function waitForPropertyPolling(el, propertyName, timeout = 3e3) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkAvailability = () => {
      const isAvailable = el[propertyName];
      if (isAvailable) {
        resolve();
      } else if (Date.now() - startTime > timeout) {
        reject(new Error(`Timeout: ${timeout}ms. Propery: ${propertyName} not available on element.`));
      } else {
        requestAnimationFrame(checkAvailability);
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
async function waitForThenHideAndShow(hideSelector, showSelector, timeout = 3e3, delay = 500) {
  await waitForSelectorsPolling([hideSelector, showSelector], timeout);
  await sleep(delay);
  hideAndShow(hideSelector, showSelector);
}
function fetchApi(url, succesCallback, errorCallback) {
  try {
    fetch(url, {
      method: "GET"
    }).then((response) => response.text()).then((text) => {
      if (succesCallback) {
        succesCallback(text);
      }
    });
  } catch (ex) {
    if (errorCallback) {
      errorCallback(ex);
    }
  }
}
function enableSortable(target) {
  if (target) {
    let options = {
      animation: 150,
      draggable: ".preview-draggable",
      // handle: '.preview-draggable::before',
      onEnd: function(evt) {
        const custom = {
          e: evt,
          event: "onEnd",
          item: evt.item,
          from: evt.from,
          to: evt.to,
          oldIndex: evt.oldIndex,
          newIndex: evt.newIndex
        };
        wc?.EventHub?.broadcast("sortable:on-end", "", "", custom);
      }
    };
    if (typeof Sortable !== "undefined") {
      const sortable = new Sortable(target, options);
      wc.EventHub.events[target] = sortable;
    }
  }
}
function disableSortable(target) {
  wc?.EventHub?.events[target].destroy();
}
function updateJetTemplate(id, oldIndex, newIndex, cm) {
  let offset = 2;
  oldIndex = oldIndex - offset;
  newIndex = newIndex - offset;
  let doc = cm.editor;
  let template = doc.getValue();
  let formRegex = new RegExp(`<wc-form[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/wc-form>`);
  let match = template.match(formRegex);
  if (match) {
    let formContent = match[1];
    let divRegex = /<div[^>]*class=["'][^"']*preview-draggable[^"']*["'][^>]*>[\s\S]*?<\/div>/g;
    let elements = formContent.match(divRegex) || [];
    if (elements.length === 0) return;
    if (oldIndex >= 0 && oldIndex < elements.length && newIndex >= 0 && newIndex < elements.length) {
      let movedElement = elements.splice(oldIndex, 1)[0];
      elements.splice(newIndex, 0, movedElement);
    }
    let updatedFormContent = formContent.replace(divRegex, () => elements.shift());
    let updatedTemplate = template.replace(formContent, updatedFormContent);
    doc.setValue(updatedTemplate);
  }
}
function countElements(selector) {
  let pos = -1;
  if (selector) {
    pos = document.querySelectorAll(selector).length;
  }
  return pos;
}
function toggleIndicator(selector, show2) {
  const indicator = document.querySelector(selector);
  if (indicator) {
    if (show2) {
      indicator.classList.add("htmx-request");
    } else {
      indicator.classList.remove("htmx-request");
    }
  }
}
function processJSONField(event, selector) {
  const elt = event.detail.elt;
  const form = elt.closest("form");
  const jsonField = form.querySelector(selector);
  console.log("-->Attempting to process JSON for selector: ", selector, form);
  if (jsonField) {
    try {
      let flattenJSON = function(obj, prefix = "") {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const fieldName = prefix ? `${prefix}.${key}` : key;
            if (value !== null && typeof value === "object" && !Array.isArray(value)) {
              flattenJSON(value, fieldName);
            } else if (Array.isArray(value)) {
              value.forEach((item, index) => {
                if (typeof item === "object" && item !== null) {
                  flattenJSON(item, `${fieldName}[${index}]`);
                } else {
                  const input2 = document.createElement("input");
                  input2.type = "hidden";
                  input2.name = `${fieldName}[${index}]`;
                  input2.value = item;
                  input2.setAttribute("data-json-field", "true");
                  form.appendChild(input2);
                  console.log("-->Appending array primitive:", input2);
                }
              });
            } else {
              const input2 = document.createElement("input");
              input2.type = "hidden";
              input2.name = fieldName;
              input2.value = value;
              input2.setAttribute("data-json-field", "true");
              form.appendChild(input2);
              console.log("-->Appending primitive:", input2);
            }
          }
        }
      };
      const existingFields = form.querySelectorAll('input[data-json-field="true"]');
      existingFields.forEach((field) => field.remove());
      const jsonData = JSON.parse(jsonField.value);
      console.log("-->JSON contents: ", jsonData);
      flattenJSON(jsonData, "json_data");
      console.log("-->Processing complete for selector: ", selector, form);
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }
}
function testSchema(value, schema) {
  if (value === void 0 || value === null) {
    return false;
  }
  if ("const" in schema) {
    return value === schema.const;
  }
  if ("enum" in schema) {
    return Array.isArray(schema.enum) && schema.enum.includes(value);
  }
  if ("minimum" in schema) {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(num) || num < schema.minimum) {
      return false;
    }
  }
  if ("maximum" in schema) {
    const num = typeof value === "number" ? value : parseFloat(value);
    if (isNaN(num) || num > schema.maximum) {
      return false;
    }
  }
  if ("minLength" in schema) {
    const str = String(value);
    if (str.length < schema.minLength) {
      return false;
    }
  }
  if ("maxLength" in schema) {
    const str = String(value);
    if (str.length > schema.maxLength) {
      return false;
    }
  }
  if ("pattern" in schema) {
    const re = new RegExp(schema.pattern);
    if (typeof value !== "string" || !re.test(value)) {
      return false;
    }
  }
  return true;
}
function getSourcePropertyValue(srcDataId, srcSelector, srcProperty) {
  let selector = "";
  if (srcDataId) {
    selector = `[data-id="${srcDataId}"]`;
    if (srcSelector) {
      selector += ` ${srcSelector}`;
    }
  } else {
    if (srcSelector) {
      selector = srcSelector;
    }
  }
  if (!selector) return void 0;
  const el = document.querySelector(selector);
  if (!el) return void 0;
  if (srcProperty && srcProperty in el) {
    return el[srcProperty];
  }
  if (el.type === "checkbox") {
    return el.checked;
  }
  return el.value;
}
function applyRule(rule) {
  const { effect, condition, tgtDataId, tgtSelector, tgtProperty } = rule;
  const { scope, schema, srcDataId, srcSelector, srcProperty, property } = condition;
  const value = getSourcePropertyValue(srcDataId, srcSelector, srcProperty);
  let match = false;
  if (schema) {
    match = testSchema(value, schema);
  }
  let selector = `[data-id="${tgtDataId}"]`;
  if (tgtSelector) {
    selector += ` ${tgtSelector}`;
  }
  let targetEl = document.querySelector(selector);
  if (!targetEl) return;
  switch (effect) {
    case "COPY":
      targetEl[tgtProperty] = value;
      break;
    case "COPY-TOLOWER":
      targetEl[tgtProperty] = value.toString().toLowerCase();
      break;
    case "COPY-TOLOWER-UNDERSCORE":
      targetEl[tgtProperty] = value.toString().toLowerCase().replaceAll(" ", "_");
      break;
    case "HIDE":
      targetEl.style.display = match ? "none" : "";
      break;
    case "SHOW":
      targetEl.style.display = match ? "" : "none";
      break;
    case "DISABLE":
      targetEl.disabled = match;
      break;
    case "ENABLE":
      targetEl.disabled = !match;
      break;
    case "REQUIRE":
      targetEl.required = !match;
      break;
    case "UN-REQUIRE":
      targetEl.required = match;
      break;
    default:
      console.warn("Unknown rule effect:", effect);
  }
}
function initRules(rules) {
  const srcDataIds = Array.from(new Set(rules.map((r) => r.condition.srcDataId)));
  srcDataIds.forEach((id) => {
    document.querySelectorAll(`[data-id="${id}"]`).forEach((el) => {
      const elRules = Array.from(rules).filter((r) => r.condition.srcDataId == id);
      el.addEventListener("change", () => {
        elRules.forEach(applyRule);
      });
      el.addEventListener("input", () => {
        elRules.forEach(applyRule);
      });
    });
  });
  rules.forEach(applyRule);
}
function extractRules(nodes) {
  const rules = [];
  function traverse(obj) {
    if (!obj || typeof obj !== "object") return;
    if (obj.rules) {
      rules.push(...obj.rules);
    }
    if (Array.isArray(obj.elements)) {
      obj.elements.forEach(traverse);
    }
  }
  nodes.forEach(traverse);
  return rules;
}
function extractSrcElements(nodes) {
  const result = [];
  function processElement(element) {
    const label = element.label || "";
    const scope = element.scope || "";
    const formattedLabel = scope ? `${label} (${scope})` : label;
    const output = {
      "dataId": element["data-id"],
      "label": formattedLabel
    };
    result.push(output);
    if (element.elements && Array.isArray(element.elements)) {
      element.elements.forEach((child) => processElement(child));
    }
  }
  nodes.forEach((element) => processElement(element));
  return result;
}

// src/js/components/wc-base-component.js
var WcBaseComponent = class extends HTMLElement {
  constructor() {
    super();
    this._wcId = generateUniqueId2();
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
      if (newValue) {
        const cls = newValue.replace("contents", "");
        const parts = cls.split(" ");
        parts.forEach((part) => {
          if (part) {
            this.componentElement.classList.add(part);
            this.classList.remove(part);
          }
        });
      }
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
    console.log("wc-base-component:_render");
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
      wc-accordion {
        display: contents;
      }

      .wc-accordion .accordion-header {
        background-color: var(--button-bg-color);
        color: var(--button-color);
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
        background-color: var(--button-hover-bg-color);
        color: var(--button-hover-color);
      }

      .wc-accordion .accordion-header:after {
        content: '+';
        color: var(--primary-color);
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

// src/js/components/wc-article-card.js
if (!customElements.get("wc-article-card")) {
  class WcArticleCard extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class", "url", "img-url", "article-type"];
    }
    constructor() {
      super();
      this.imgUrl = "";
      this.articleTypes = {
        "news": "https://images.pexels.com/photos/1755683/pexels-photo-1755683.jpeg?auto=compress&cs=tinysrgb&w=768",
        "css": "https://miro.medium.com/v2/da:true/resize:fit:768/0*1YrO9YLbwHnzExsO",
        "technology": "https://images.pexels.com/photos/2653362/pexels-photo-2653362.jpeg?auto=compress&cs=tinysrgb&w=768",
        "programming": "https://images.pexels.com/photos/6424591/pexels-photo-6424591.jpeg?auto=compress&cs=tinysrgb&w=768"
      };
      this.articleData = null;
      this.articleType = "news";
      const compEl = this.querySelector(".wc-article-card");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-article-card");
        this._createElement();
        this.appendChild(this.componentElement);
      }
    }
    async connectedCallback() {
      super.connectedCallback();
      if (this.getAttribute("url")) {
        this.fetchArticleData(this.getAttribute("url"));
      }
      await this._applyStyle();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }
    _handleAttributeChange(attrName, newValue) {
      if (attrName === "url") {
      } else if (attrName === "img-url") {
        this.imgUrl = newValue;
      } else if (attrName === "article-type") {
        this.imgUrl = this.articleTypes[newValue] || this.articleTypes["news"];
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }
    // async attributeChangedCallback(name, oldValue, newValue) {
    //   if (name === 'url' && oldValue !== newValue) {
    //     await this.fetchArticleData(newValue);
    //   }
    // }
    async fetchArticleData(url) {
      try {
        const response = await fetch(`/api/article-metadata?url=${encodeURIComponent(url)}`);
        this.articleData = await response.json();
        this._createElement();
      } catch (error) {
        console.error("Error fetching article data:", error);
      }
    }
    _createElement() {
      if (!this.articleData) return;
      const url = this.getAttribute("url");
      let { title, description, imageUrl, publishDate, domain } = this.articleData;
      if (this.imgUrl) {
        imageUrl = this.imgUrl;
      }
      this.componentElement.innerHTML = `
        <div class="article-card-image">
          <img src="${imageUrl ? imageUrl : ""}" alt="${title}">
        </div>
        <div class="article-card-content">
          <a class="article-card-title" href="${url}" target="_blank">${title}</a>
          <p class="article-card-description">${description}</p>
          <div class="article-card-meta">
            <span class="article-card-domain">${domain}</span>
            <span class="article-card-date">${new Date(publishDate).toLocaleDateString()}</span>
          </div>
        </div>
      `.trim();
    }
    _applyStyle() {
      const style = `
        wc-article-card {
          display: contents;
        }
        .articles-container {
          max-width: 1200px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
          padding: 20px;
        }
        .wc-article-card {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          box-shadow: var(--card-shadow);
          overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .wc-article-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        .wc-article-card .article-card-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          background: #e5e7eb;
        }
        .wc-article-card .article-card-content {
          padding: 16px;
        }
        .wc-article-card .article-card-title {
          margin: 0 0 8px 0;
          font-size: 1.25rem;
          color: var(--swatch-1);
          text-decoration: none;
        }
        .wc-article-card a.article-card-title:hover {
          text-shadow: var(--swatch-3) 1px 0 10px;
        }
        .wc-article-card .article-card-description {
          margin: 0 0 16px 0;
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--swatch-2);
        }
        .wc-article-card .article-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: var(--swatch-3);
        }
        .wc-article-card .article-card-source {
          font-weight: 500;
        }
      `.trim();
      this.loadStyle("wc-article-card", style);
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-article-card", WcArticleCard);
}

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
      wc-background-image {
        display: contents;
      }
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

// src/js/components/wc-breadcrumb-item.js
if (!customElements.get("wc-breadcrumb-item")) {
  class WcBreadcrumbItem extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class"];
    }
    constructor() {
      super();
      const compEl = this.querySelector(".wc-breadcrumb-item");
      if (compEl) {
      } else {
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
      this.componentElement.id = "breadcrumb-item";
      this.componentElement.className = "wc-breadcrumb-item flex flex-row px-2 gap-4";
      this.componentElement.innerHTML = `
        <a href="/v/home"
           hx-get="/v/home"
           hx-target="#viewport"
           hx-swap="innerHTML transition:true"
           hx-push-url="true"
           hx-indicator="#content-loader">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </a>
        <span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <a href="/v/screen_list/list"
          hx-get="/v/screen_list/list"
          hx-target="#viewport"
          hx-swap="innerHTML transition:true"
          hx-push-url="true"
          hx-indicator="#content-loader">
          Screens
        </a>
        <span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <span>
          screen
        </span>
      `.trim();
    }
    _applyStyle() {
      const style = `
      wc-breadcrumb-item {
        display: contents;
      }
      wc-breadcrumb-item .wc-breadcrumb-item {
        /* background-color: var(--surface-1); */
      }
      `.trim();
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-breadcrumb-item", WcBreadcrumbItem);
}

// src/js/components/wc-breadcrumb.js
if (!customElements.get("wc-breadcrumb")) {
  class WcBreadcrumb extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class", "doc-title"];
    }
    constructor() {
      super();
      const compEl = this.querySelector(".wc-breadcrumb");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this._createElement();
        this.appendChild(this.componentElement);
      }
      setTimeout(() => {
        const titleParts = [];
        const docTitle = this.getAttribute("doc-title") || "";
        const parts = this.querySelectorAll("wc-breadcrumb-item");
        Array.from(parts).forEach((p) => {
          const lbl = p.getAttribute("label");
          if (lbl) {
            titleParts.push(lbl);
          }
        });
        const title = titleParts.join(" > ");
        if (title) {
          if (docTitle) {
            document.title = title + " - " + docTitle;
          } else {
            document.title = title;
          }
        }
      }, 250);
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
    _getBreadcrumbItems() {
      let crumbs = [
        { "label": "", "link": "/v/home" },
        { "label": "Screens", "link": "/v/screen_list/list" },
        { "label": "screen", "link": "" }
      ];
      const result = [];
      const els = this.querySelectorAll("wc-breadcrumb-item");
      Array.from(els).forEach((item) => {
        const label = item.getAttribute("label") || "";
        const link = item.getAttribute("link") || "";
        result.push({ label, link });
      });
      return result;
    }
    _createElement() {
      const markup = [];
      const crumbs = this._getBreadcrumbItems();
      crumbs.forEach((item, index) => {
        if (index == 0) {
          markup.push(`
            <a href="${item.link}"
              hx-get="${item.link}"
              hx-target="#viewport"
              hx-swap="innerHTML transition:true"
              hx-push-url="true"
              hx-indicator="#content-loader">
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </a>            
          `);
        } else if (crumbs.length - 1 == index) {
          markup.push(`
            <span id="title-content">
              ${item.label}
            </span>            
          `);
        } else {
          markup.push(`
            <a href="${item.link}"
              hx-get="${item.link}"
              hx-target="#viewport"
              hx-swap="innerHTML transition:true"
              hx-push-url="true"
              hx-indicator="#content-loader">
              ${item.label}
            </a>
          `);
        }
      });
      const html = markup.join(`
        <span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
      `);
      this.componentElement.id = "breadcrumb";
      this.componentElement.className = "wc-breadcrumb flex flex-row px-2 gap-3";
      this.componentElement.innerHTML = html;
      this.componentElement.innerHTML2 = `
        <a href="/v/home"
           hx-get="/v/home"
           hx-target="#viewport"
           hx-swap="innerHTML transition:true"
           hx-push-url="true"
           hx-indicator="#content-loader">
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </a>
        <span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <a href="/v/screen_list/list"
          hx-get="/v/screen_list/list"
          hx-target="#viewport"
          hx-swap="innerHTML transition:true"
          hx-push-url="true"
          hx-indicator="#content-loader">
          Screens
        </a>
        <span>
          <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </span>
        <span>
          screen
        </span>
      `.trim();
    }
    _applyStyle() {
      const style = `
      wc-breadcrumb {
        display: contents;
      }
      wc-breadcrumb .wc-breadcrumb {
        /* background-color: var(--surface-1); */
      }
      `.trim();
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-breadcrumb", WcBreadcrumb);
}

// src/js/components/wc-canvas-dot-highlight.js
if (!customElements.get("wc-canvas-dot-highlight")) {
  class WcCanvasDotHighlight extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class"];
    }
    constructor() {
      super();
      const compEl = this.querySelector(".wc-canvas-dot-highlight");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-canvas-dot-highlight");
        this._createElement();
        this.appendChild(this.componentElement);
      }
    }
    async connectedCallback() {
      super.connectedCallback();
      this._wireEvents();
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
      const parts = Array.from(this.children).filter((p) => !p.matches("wc-canvas-dot-highlight") && !p.matches(".wc-canvas-dot-highlight"));
      const canvas = document.createElement("canvas");
      canvas.id = "dotCanvas";
      this.componentElement.appendChild(canvas);
      parts.forEach((p) => this.componentElement.appendChild(p));
    }
    _applyStyle() {
      const style = `
        wc-canvas-dot-highlight {
          display: contents;
        }
        .wc-canvas-dot-highlight {
          position: relative;
        }
        .wc-canvas-dot-highlight canvas {
          border-radius: 8px;
          border: 1px solid gray;
          border-radius: 10px;
          background-color: #111;
        }
      `.trim();
      this.loadStyle("wc-canvas-dot-highlight", style);
    }
    _wireEvents() {
      const canvas = this.componentElement.querySelector("#dotCanvas");
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth * 0.95;
      canvas.height = window.innerHeight * 0.95;
      const config = {
        dotSpacing: 20,
        dotRadius: 1.25,
        highlightRadius: 160,
        defaultColor: "#444",
        highlightColor: "#40E0D0",
        backgroundColor: "#111111",
        animationSpeed: 0.15
        // Speed of highlight movement (0-1)
      };
      const cols = Math.floor(canvas.width / config.dotSpacing);
      const rows = Math.floor(canvas.height / config.dotSpacing);
      let mouseX = canvas.width / 2;
      let mouseY = canvas.height / 2;
      let highlightX = canvas.width / 2;
      let highlightY = canvas.height / 2;
      let isMouseOnCanvas = false;
      let targetX = 0;
      let targetY = 0;
      canvas.addEventListener("mousemove", (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        if (isMouseOnCanvas) {
          targetX = mouseX;
          targetY = mouseY;
        }
      });
      canvas.addEventListener("mouseenter", (e) => {
        isMouseOnCanvas = true;
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        targetX = mouseX;
        targetY = mouseY;
      });
      canvas.addEventListener("mouseleave", () => {
        isMouseOnCanvas = false;
        targetX = 0;
        targetY = 0;
      });
      function draw() {
        ctx.fillStyle = config.backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        highlightX += (targetX - highlightX) * config.animationSpeed;
        highlightY += (targetY - highlightY) * config.animationSpeed;
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = (i + 0.5) * config.dotSpacing;
            const y = (j + 0.5) * config.dotSpacing;
            ctx.fillStyle = config.defaultColor;
            ctx.beginPath();
            ctx.arc(x, y, config.dotRadius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        const distanceToTarget = Math.sqrt(
          Math.pow(highlightX - targetX, 2) + Math.pow(highlightY - targetY, 2)
        );
        const isNearTarget = distanceToTarget < 1;
        if (!isMouseOnCanvas) {
          return requestAnimationFrame(draw);
        }
        for (let i = 0; i < cols; i++) {
          for (let j = 0; j < rows; j++) {
            const x = (i + 0.5) * config.dotSpacing;
            const y = (j + 0.5) * config.dotSpacing;
            const dx = x - highlightX;
            const dy = y - highlightY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < config.highlightRadius) {
              const intensity = Math.pow(1 - distance / config.highlightRadius, 2);
              const fadeMultiplier = isMouseOnCanvas ? 1 : Math.max(0, 1 - (isNearTarget ? 1 : 0));
              ctx.fillStyle = config.highlightColor;
              ctx.globalAlpha = intensity * fadeMultiplier;
              ctx.beginPath();
              ctx.arc(x, y, config.dotRadius, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
        ctx.globalAlpha = 1;
        requestAnimationFrame(draw);
      }
      window.addEventListener("resize", () => {
        canvas.width = window.innerWidth * 0.95;
        canvas.height = window.innerHeight * 0.95;
        if (!isMouseOnCanvas) {
          targetX = canvas.width / 2;
          targetY = canvas.height / 2;
        }
      });
      draw();
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-canvas-dot-highlight", WcCanvasDotHighlight);
}

// src/js/components/wc-code-mirror.js
if (!customElements.get("wc-code-mirror")) {
  class WcCodeMirror extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class", "height", "theme", "mode", "lbl-label", "lbl-class", "line-numbers", "line-wrapping", "fold-gutter", "tab-size", "indent-unit", "value", "disabled", "required"];
    }
    constructor() {
      super();
      this.childComponentName = "editor";
      this._isResizing = false;
      this._internals = this.attachInternals();
      this.firstContent = "";
      if (this.innerHTML.trim() != "") {
        this.firstContent = this.innerHTML.replaceAll("=&gt;", "=>");
        this.innerHTML = "";
      } else if (this.firstChild && this.firstChild.nodeName == "#text") {
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

        
        wc-code-mirror {
          display: contents;
        }

        /* Ensure that each editor fills its container */
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
          /* border: 2px solid var(--primary-bg-color); */
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
        
        .wc-code-mirror > label ~ .settings-icon {
          top: 22px;
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

        /* JavaScript highlighting in web components */
        .cm-js-keyword { color: #66d9ef !important; }
        .cm-js-variable { color: #f8f8f2 !important; }
        .cm-js-def { color: #fd971f !important; }
        .cm-js-operator { color: #f92672 !important; }
        .cm-js-string { color: #e6db74 !important; }
        .cm-js-number { color: #ae81ff !important; }
        .cm-js-comment { color: #75715e !important; }
        .cm-js-property { color: #a6e22e !important; }
        .cm-js-atom { color: #ae81ff !important; }
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
      this.addWebComponentsJsHighlighting();
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
    async refresh(timeout = 500) {
      await sleep(timeout);
      this.editor.refresh();
      this.editor.focus();
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
      if (["htmlmixed", "php", "markdown", "htmlembedded"].includes(mode)) {
        setTimeout(() => {
          this.addWebComponentsJsHighlighting();
        }, 100);
      }
    }
    _unWireEvents() {
      super._unWireEvents();
      const settingsIcon = this.querySelector(".settings-icon");
      settingsIcon.removeEventListener("click", this._handleSettingsIconClick.bind(this));
    }
    /**
     * Add JavaScript highlighting to web components
     * This approach directly scans the document for web component content
     */
    addWebComponentsJsHighlighting() {
      console.log("Adding JS highlighting to web components");
      const applyHighlighting = () => {
        console.log("Applying highlighting to editor content");
        const lines = this.editor.getValue().split("\n");
        let inComponent = false;
        let componentName = "";
        let content = [];
        let startLine = -1;
        let endLine = -1;
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!inComponent) {
            const openMatch = line.match(/<(wc-[a-zA-Z0-9-]+)(?:\s|>)/i);
            if (openMatch) {
              componentName = openMatch[1];
              inComponent = true;
              startLine = i;
              console.log(`Found opening tag at line ${i}: ${componentName}`);
            }
          } else {
            const closeMatch = line.match(new RegExp(`</${componentName}>`));
            if (closeMatch) {
              endLine = i;
              inComponent = false;
              console.log(`Found closing tag at line ${i}: ${componentName}`);
              if (startLine !== -1 && endLine !== -1) {
                const jsContent = lines.slice(startLine + 1, endLine).join("\n");
                console.log(`Processing JS content between lines ${startLine + 1} and ${endLine}`);
                this.highlightJavaScript(jsContent, startLine + 1, endLine);
              }
              startLine = -1;
              endLine = -1;
              componentName = "";
            }
          }
        }
      };
      setTimeout(() => {
        applyHighlighting();
        this.editor.on("change", () => {
          clearTimeout(this._highlightTimeout);
          this._highlightTimeout = setTimeout(() => {
            applyHighlighting();
          }, 500);
        });
        console.log("Added change listener for highlighting");
      }, 100);
    }
    /**
     * Highlight JavaScript content using markers
     */
    highlightJavaScript(jsContent, startLine, endLine) {
      console.log("Highlighting JavaScript content");
      const doc = this.editor.getDoc();
      const existingMarks = doc.findMarks(
        { line: startLine, ch: 0 },
        { line: endLine, ch: 0 }
      );
      existingMarks.forEach((mark) => mark.clear());
      const jsLines = jsContent.split("\n");
      const patterns = [
        { pattern: /\b(function|var|let|const|return|if|else|endif|for|endfor|while|switch|case|break|continue|this|new|typeof|instanceof|class|async|await|in)\b/g, className: "cm-js-keyword" },
        { pattern: /\b(true|false|null|undefined)\b/g, className: "cm-js-atom" },
        { pattern: /\b\d+(\.\d+)?\b/g, className: "cm-js-number" },
        { pattern: /(["'`])(?:[^\\]|\\.)*?\1/g, className: "cm-js-string" },
        { pattern: /[+\-*/%=&|^<>!?:;,.]/g, className: "cm-js-operator" },
        // Arrow functions
        { pattern: /=>/g, className: "cm-js-keyword" },
        // Function/property access
        { pattern: /\b\.[A-Za-z]+/g, className: "cm-js-property" }
      ];
      jsLines.forEach((line, lineIndex) => {
        doc.markText(
          { line: startLine + lineIndex, ch: 0 },
          { line: startLine + lineIndex, ch: line.length },
          { className: "cm-wc-content" }
        );
        patterns.forEach(({ pattern, className }) => {
          let match;
          pattern.lastIndex = 0;
          while ((match = pattern.exec(line)) !== null) {
            const startCh = match.index;
            const endCh = startCh + match[0].length;
            doc.markText(
              { line: startLine + lineIndex, ch: startCh },
              { line: startLine + lineIndex, ch: endCh },
              { className }
            );
          }
        });
      });
    }
  }
  customElements.define("wc-code-mirror", WcCodeMirror);
}

// src/js/components/wc-contact-card.js
var WcContactCard = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "gender", "contact-name", "contact-title"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-contact-card");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-contact-card");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-contact-card");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-contact-card");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName == "gender") {
      const img = this.querySelector("img");
      if (newValue == "male") {
        img.setAttribute("src", "https://www.w3schools.com/howto/img_avatar.png");
      } else {
        img.setAttribute("src", "https://www.w3schools.com/howto/img_avatar2.png");
      }
    } else if (attrName == "contact-name") {
      const span = this.querySelector("div.contact-card-name");
      span.innerHTML = newValue;
    } else if (attrName == "contact-title") {
      const span = this.querySelector("div.contact-card-title");
      span.innerHTML = newValue;
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-contact-card > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-contact-card");
  }
  _createInnerElement() {
    const parts = Array.from(this.children).filter((p) => !p.matches("wc-contact-card") && !p.matches(".wc-contact-card"));
    parts.forEach((p) => this.componentElement.appendChild(p));
    const img = document.createElement("img");
    img.setAttribute("src", "https://www.w3schools.com/howto/img_avatar.png");
    img.setAttribute("alt", "Person");
    img.setAttribute("width", "100%");
    const divCnt = document.createElement("div");
    divCnt.classList.add("contact-card-container");
    const divName = document.createElement("div");
    divName.classList.add("contact-card-name", "text-2xl", "font-bold");
    divName.innerHTML = "John Doe";
    const divTitle = document.createElement("div");
    divTitle.classList.add("contact-card-title", "text-lg");
    divTitle.innerHTML = "Boss";
    divCnt.appendChild(divName);
    divCnt.appendChild(divTitle);
    this.componentElement.appendChild(img);
    this.componentElement.appendChild(divCnt);
  }
  _applyStyle() {
    const style = `
      wc-contact-card {
        display: contents;
      }
      .wc-contact-card {
        box-shadow: 0 4px 8px 0 var(--card-border-color);
        transition: 0.3s;
        width: 40%;
        border-radius: 5px;
        background-color: var(--card-bg-color);
        color: var(--card-color);
      }
      .wc-contact-card:hover {
        box-shadow: 0 8px 16px 0 var(--card-border-color);
      }
      /* Add some padding inside the card container */
      .wc-contact-card .contact-card-container {
        padding: 2px 16px;
      }
      .wc-contact-card img {
        border-radius: 5px 5px 0 0;
      }
    `;
    this.loadStyle("wc-contact-card-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-contact-card", WcContactCard);

// src/js/components/wc-contact-chip.js
var WcContactChip = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "gender", "person-name"];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-contact-chip");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-contact-chip");
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-contact-chip");
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    console.log("connectedCallback:wc-contact-chip");
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName == "gender") {
      const img = this.querySelector("img");
      if (newValue == "male") {
        img.setAttribute("src", "https://www.w3schools.com/howto/img_avatar.png");
      } else {
        img.setAttribute("src", "https://www.w3schools.com/howto/img_avatar2.png");
      }
    } else if (attrName == "person-name") {
      const span = this.querySelector("span.name-content");
      span.innerHTML = newValue;
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-contact-chip > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-contact-chip");
  }
  _createInnerElement() {
    const parts = Array.from(this.children).filter((p) => !p.matches("wc-contact-chip") && !p.matches(".wc-contact-chip"));
    parts.forEach((p) => this.componentElement.appendChild(p));
    const img = document.createElement("img");
    img.setAttribute("src", "https://www.w3schools.com/howto/img_avatar.png");
    img.setAttribute("alt", "Person");
    img.setAttribute("height", "96");
    img.setAttribute("width", "96");
    const span = document.createElement("span");
    span.classList.add("name-content");
    span.innerHTML = "John Doe";
    const btn = document.createElement("span");
    btn.classList.add("close-btn");
    btn.innerHTML = "&times;";
    btn.setAttribute("onclick", `
      const cnt = this.closest('wc-contact-chip.contents');
      cnt.classList.add('hidden');
    `);
    this.componentElement.appendChild(img);
    this.componentElement.appendChild(span);
    this.componentElement.appendChild(btn);
  }
  _applyStyle() {
    const style = `
      wc-contact-chip {
        display: contents;
      }
      .wc-contact-chip {
        position: relative;
        display: inline-block;
        padding: 0 25px;
        height: 50px;
        font-size: 18px;
        line-height: 50px;
        border-radius: 25px;
        background-color: var(--card-bg-color);
        color: var(--card-color);
      }
      .wc-contact-chip img {
        float: left;
        margin: 0 0 0 -25px;
        height: 50px;
        width: 50px;
        border-radius: 50%;
      }
      .wc-contact-chip .name-content {
        margin: 0 10px;
      }
      .wc-contact-chip .close-btn {
        position: absolute;
        right: 10px;
        margin-left: 10px;
        color: var(--surface-8);
        font-weight: bold;
        font-size: 20px;
        cursor: pointer;
      }
      .wc-contact-chip .close-btn:hover {
        color: var(--surface-6);
      }
    `;
    this.loadStyle("wc-contact-chip-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-contact-chip", WcContactChip);

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
      wc-div {
        display: contents;
      }
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

// src/js/components/wc-dropdown-item.js
if (!customElements.get("wc-dropdown-item")) {
  class WcDropdownItem extends HTMLElement {
    constructor() {
      super();
      this.classList.add("contents");
    }
    connectedCallback() {
    }
  }
  customElements.define("wc-dropdown-item", WcDropdownItem);
}

// src/js/components/wc-dropdown.js
var WcDropdown = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "label", "mode", "format"];
  }
  constructor() {
    super();
    this.childComponentSelector = "a,hr,wc-input";
    this.clickModes = ["search", "click"];
    this.mode = this.getAttribute("mode") || "click";
    const compEl = this.querySelector(".wc-dropdown");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-dropdown", this.mode);
      this.appendChild(this.componentElement);
    }
    console.log("ctor:wc-dropdown");
  }
  async connectedCallback() {
    super.connectedCallback();
    await this._applyStyle();
    this.classList.add("contents");
    this.classList.remove("hidden");
    this.componentElement.classList.remove("hidden");
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
    const parts = Array.from(this.children).filter((p) => !p.matches("wc-dropdown") && !p.matches(".wc-dropdown"));
    const id = this.getAttribute("id") || "";
    const positionArea = this.getAttribute("position-area") || "bottom span-left";
    const positionTryFallbacks = this.getAttribute("position-try-fallbacks") || "--bottom-right, --bottom-left, --top-right, --top-left, --right, --left";
    const lbl = this.getAttribute("label") || "";
    const format = this.getAttribute("format") || "standard";
    const dropdownHeight = this.getAttribute("dropdown-height") || "";
    const btn = document.createElement("button");
    if (lbl && format === "standard") {
      btn.classList.add("dropbtn");
      btn.textContent = lbl;
    } else {
      if (format === "grid-round") {
        btn.classList.add("dropbtn");
        btn.classList.add("grid-round");
        btn.innerHTML = `
          <svg class="h-5 w-5 align-middle pointer-events-none"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M128 96A64 64 0 1 1 0 96a64 64 0 1 1 128 0zm0 160A64 64 0 1 1 0 256a64 64 0 1 1 128 0zM64 480a64 64 0 1 1 0-128 64 64 0 1 1 0 128zM288 96A64 64 0 1 1 160 96a64 64 0 1 1 128 0zM224 320a64 64 0 1 1 0-128 64 64 0 1 1 0 128zm64 96a64 64 0 1 1 -128 0 64 64 0 1 1 128 0zm96-256a64 64 0 1 1 0-128 64 64 0 1 1 0 128zm64 96a64 64 0 1 1 -128 0 64 64 0 1 1 128 0zM384 480a64 64 0 1 1 0-128 64 64 0 1 1 0 128z"/>
          </svg>
        `;
      } else if (format === "avatar") {
        btn.classList.add("dropbtn");
        btn.classList.add("avatar");
        btn.innerHTML = `
          <svg class="h-4 w-4 align-middle pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        `;
      }
    }
    const dropdown = document.createElement("div");
    dropdown.classList.add("dropdown");
    const dropdownContent = document.createElement("div");
    dropdownContent.classList.add("dropdown-content", "text-sm");
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
      svg.classList.add("search-svg", "h-4", "w-4", "component");
      const path = document.createElementNS(svgNS, "path");
      path.setAttribute("stroke-linecap", "round");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("d", "m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z");
      svg.appendChild(path);
      dropdownContent.appendChild(svg);
      ipt.addEventListener("input", this._handleInput.bind(this));
    }
    parts.forEach((p) => dropdownContent.appendChild(p));
    dropdown.appendChild(dropdownContent);
    dropdown.append(btn);
    this.componentElement.append(dropdown);
    if (dropdownHeight) {
      dropdownContent.style.height = dropdownHeight;
      dropdownContent.style.overflow = "auto";
    }
    if (this.clickModes.includes(this.mode)) {
      btn.addEventListener("click", this._handleClick.bind(this));
      window.addEventListener("click", this._handleWindowClick.bind(this));
    }
    const wcDropdown = this.querySelector(".wc-dropdown");
    wcDropdown.style.anchorName = `--${id}-anchor`;
    const drpContent = this.querySelector(".wc-dropdown .dropdown-content");
    drpContent.style.positionAnchor = `--${id}-anchor`;
    drpContent.style.positionArea = positionArea;
    drpContent.style.positionTryFallbacks = positionTryFallbacks;
    drpContent.style.minWidth = `${wcDropdown.offsetWidth}px`;
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
    const haltElt = target.closest(".halt-event");
    if (haltElt) return;
    const parts = this.querySelectorAll(".wc-dropdown");
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
  async _applyStyle() {
    const style = `
      wc-dropdown {
        /* display: contents; */
      }

      .wc-dropdown {
        display: flex;
        flex-direction: row;
      }

      /* Dropdown Button */
      .wc-dropdown .dropbtn {
        background-color: var(--button-bg-color);
        color: var(--button-color);
        padding: 16px;
        font-size: 16px;
        border: none;
        border-radius: 0;
      }
      .wc-dropdown .dropbtn.grid-round {
        background-color: transparent;
        padding: 4px;
      }
      .wc-dropdown .dropbtn.avatar {
        padding: 6px;
        border-radius: 50%;
        font-size: 0.825rem;
      }

      /* The container <div> - needed to position the dropdown content */
      .wc-dropdown .dropdown {
      }

      /* Dropdown Content (Hidden by Default) */
      .wc-dropdown .dropdown-content {
        display: none;
        position: absolute;
        background-color: var(--button-hover-bg-color);
        min-width: 160px;
        max-width: 250px;
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
      }

      .wc-dropdown .search {
        width: 100%;
        box-sizing: border-box;
        font-size: 12px;
        padding: 14px 20px 12px 35px;
        border-radius: 0;
      }
      .wc-dropdown .dropdown-content svg.search-svg {
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
      /* .wc-dropdown .dropdown-content .wc-input, */
      .wc-dropdown .dropdown-content a {
        color: var(--component-color);
        padding: 12px 16px;
        text-decoration: none;
        display: block;
      }

      /* Change color of dropdown links on hover */
      /* .wc-dropdown .dropdown-content .wc-input:hover, */
      .wc-dropdown .dropdown-content a:hover {
        background-color: var(--component-border-color);
      }

      /* Show the dropdown menu on hover */
      .wc-dropdown:hover:not(.click):not(.search) .dropdown .dropdown-content {
        display: block;
      }
      .wc-dropdown.show .dropdown .dropdown-content {
        display: block;
      }

      /* Change the background color of the dropdown button when the dropdown content is shown */
      .wc-dropdown:hover:not(.click):not(.search) .dropdown .dropbtn {
        background-color: var(--button-hover-bg-color);
      }
      .wc-dropdown.show .dropdown .dropbtn {
        background-color: var(--button-hover-bg-color);
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
    `.trim();
    await this.loadStyle("wc-dropdown-style", style);
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
      wc-flip-box {
        display: contents;
      }

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
        background-color: var(--card-bg-color);
        color: var(--text-1);
      }

      /* Style the back side */
      .wc-flip-box .flip-box-back {
        background-color: var(--card-bg-color);
        color: var(--text-1);
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
      wc-image {
        display: contents;
      }
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
        background-color: var(--card-bg-color);
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
        background-color: var(--card-bg-color);
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
        background-color: var(--card-bg-color);
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
        background-color: var(--card-bg-color);
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
      wc-menu {
        display: contents;
      }
      wc-menu .wc-menu {
        position: relative;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        background-color: var(--card-bg-color);
        overflow: hidden;
      }
      wc-menu .wc-menu .menu-items {
        display: flex;
        flex-direction: row;
      }
      wc-menu .wc-menu a {
        color: var(--primary-color);
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

// src/js/components/wc-page-designer.js
if (!customElements.get("wc-page-designer")) {
  class WcPageDesigner extends HTMLElement {
    static get observedAttributes() {
      return [
        "theme",
        "json-layout"
      ];
    }
    theme = "theme-royal dark";
    // Designer State
    designerState = {
      elements: [],
      selectedElement: null,
      schema: null,
      rules: [],
      editingRuleIndex: -1
    };
    // Sample Schema JSON
    sampleSchema = {
      "$defs": {
        "navitem": {
          "type": "object",
          "properties": {
            "name": { "type": "string", "minLength": 1, "default": "" },
            "slug": { "type": "string", "minLength": 1, "default": "" },
            "suffix": { "type": "string", "default": "" },
            "url": { "type": "string", "default": "" },
            "route_prefix": { "type": "string", "default": "" }
          },
          "required": ["name", "slug"]
        }
      },
      "title": "Screen",
      "type": "object",
      "properties": {
        "name": { "type": "string", "minLength": 3, "default": "" },
        "slug": { "type": "string", "minLength": 3, "default": "" },
        "navigation_items": {
          "type": "array",
          "items": { "$ref": "#/$defs/navitem" },
          "default": []
        },
        "is_active": { "type": "boolean", "default": false }
      },
      "required": ["name", "slug"]
    };
    // DOM Elements
    designerSurface = null;
    containerElements = null;
    formElements = null;
    schemaFields = null;
    previewButton = null;
    renderedPreviewButton = null;
    preRenderedPreviewButton = null;
    schemaButton = null;
    previewFrame = null;
    generateJsonButton = null;
    jsonOutput = null;
    propId = null;
    propType = null;
    propLabel = null;
    propScope = null;
    propCss = null;
    propRequired = null;
    savePropertiesButton = null;
    noSelectionPanel = null;
    elementPropertiesPanel = null;
    schemaJson = null;
    loadSchemaButton = null;
    addRuleButton = null;
    rulesList = null;
    saveRuleButton = null;
    loadDesignButton = null;
    copyDesignButton = null;
    downloadDesignButton = null;
    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);
      const compEl = this.querySelector(".wc-page-designer");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.createElement();
      }
      console.log("ctor:wc-page-designer");
    }
    async connectedCallback() {
      await this.render();
      this._applyStyle();
      this.wireEvents();
      setTimeout(() => {
        this.setup();
      }, 250);
      console.log("conntectedCallback:wc-page-designer");
    }
    disconnectedCallback() {
      this.unWireEvents();
    }
    attributeChangedCallback(attrName, oldValue, newValue) {
      if (attrName === "theme") {
        const oldTheme = this.theme;
        this.theme = newValue;
        const designer = this.querySelector(".wc-page-designer");
        designer.className = designer.className.replace(oldTheme, newValue);
        console.log("wc-page-designer:attributeChangedCallback - designer", designer.className);
      } else if (attrName === "json-layout") {
        this.jsonOutput.editor.setValue(newValue);
      }
    }
    async render() {
      await Promise.all([
        this.loadLibrary("https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js", "Sortable"),
        this.loadLibrary("https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js", "uuid")
      ]);
      wc.EventHub.broadcast("wc-page-designer:ready", "", "");
    }
    createElement() {
      const markup = `
  <div class="wc-page-designer ${this.theme} flex flex-row flex-1 h-screen">
    <!-- Left Panel - Elements -->
    <div class="left-panel flex flex-col min-h-0 overflow-scroll p-2">
      <wc-tab class="flex flex-col flex-1 min-h-0" animate>
        <wc-tab-item class="active" label="Containers">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="container-elements">
            <div class="element-item" data-element-type="wc-tab" draggable="true">WC Tab Container</div>
            <div class="element-item" data-element-type="wc-tab-item" draggable="true">WC Tab Item</div>
            <div class="element-item" data-element-type="column" draggable="true">Column</div>
            <div class="element-item" data-element-type="row" draggable="true">Row</div>
            <div class="element-item" data-element-type="fieldset" draggable="true">Fieldset</div>
            <div class="element-item" data-element-type="array" draggable="true">Array</div>
            <div class="element-item" data-element-type="wc-card" draggable="true">WC Card</div>
            <div class="element-item" data-element-type="wc-accordion" draggable="true">WC Accordion</div>
            <div class="element-item" data-element-type="wc-form" draggable="true">WC Form</div>
            <div class="element-item" data-element-type="wc-select" draggable="true">WC Select</div>
            <div class="element-item" data-element-type="wc-sidebar-left" draggable="true">WC Sidebar Left</div>
            <div class="element-item" data-element-type="wc-sidebar-right" draggable="true">WC Sidebar Right</div>
            <div class="element-item" data-element-type="wc-sidenav-left" draggable="true">WC Sidenav Left</div>
            <div class="element-item" data-element-type="wc-sidenav-right" draggable="true">WC Sidenav Right</div>
            <div class="element-item" data-element-type="wc-split-button" draggable="true">WC Split Button</div>
            <div class="element-item" data-element-type="wc-slideshow" draggable="true">WC Slideshow</div>
            <div class="element-item" data-element-type="wc-timeline" draggable="true">WC Timeline</div>
            <div class="element-item" data-element-type="wc-tabulator" draggable="true">WC Tabulator</div>
            <div class="element-item" data-element-type="wc-breadcrumb" draggable="true">WC Breadcrumb</div>
            <div class="element-item" data-element-type="option" draggable="true">Option</div>
          </div>
        </wc-tab-item>
        <wc-tab-item class="" label="Elements">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="form-elements">
            <div class="element-item" data-element-type="hr" draggable="true">Horizontal Line</div>
            <div class="element-item" data-element-type="wc-article-skeleton" draggable="true">WC Article Skeleton</div>
            <div class="element-item" data-element-type="wc-card-skeleton" draggable="true">WC Card Skeleton</div>
            <div class="element-item" data-element-type="wc-list-skeleton" draggable="true">WC List Skeleton</div>
            <div class="element-item" data-element-type="wc-table-skeleton" draggable="true">WC Table Skeleton</div>
            <div class="element-item" data-element-type="wc-input" draggable="true">WC Input</div>
            <div class="element-item" data-element-type="wc-input-checkbox" draggable="true">WC Input Checkbox</div>
            <div class="element-item" data-element-type="wc-code-mirror" draggable="true">WC Code Mirror</div>
            <div class="element-item" data-element-type="wc-textarea" draggable="true">WC Textarea</div>
            <div class="element-item" data-element-type="wc-save-button" draggable="true">WC Save Button</div>
            <div class="element-item" data-element-type="wc-save-split-button" draggable="true">WC Save Split Button</div>
            <div class="element-item" data-element-type="wc-select-option" draggable="true">WC Select Option</div>
            <div class="element-item" data-element-type="wc-slideshow-image" draggable="true">WC Slideshow Image</div>
            <div class="element-item" data-element-type="wc-tabulator-column" draggable="true">WC Tabulator Column</div>
            <div class="element-item" data-element-type="wc-tabulator-func" draggable="true">WC Tabulator Func</div>
            <div class="element-item" data-element-type="wc-tabulator-row-menu" draggable="true">WC Tabulator Row Menu</div>
            <div class="element-item" data-element-type="wc-loader" draggable="true">WC Loader</div>
            <div class="element-item" data-element-type="wc-image" draggable="true">WC Image</div>
            <div class="element-item" data-element-type="wc-contact-card" draggable="true">WC Contact Card</div>
            <div class="element-item" data-element-type="wc-contact-chip" draggable="true">WC Contact Chip</div>
            <div class="element-item" data-element-type="wc-breadcrumb-item" draggable="true">WC Breadcrumb Item</div>
            <div class="element-item" data-element-type="wc-background-image" draggable="true">WC Backgruond Image</div>
            <div class="element-item" data-element-type="wc-hotkey" draggable="true">WC Hotkey</div>
          </div>
        </wc-tab-item>
        <wc-tab-item class="" label="Fields">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="schema-fields">
            <!-- Will be populated dynamically -->
          </div>
        </wc-tab-item>
      </wc-tab>      
    </div>

    <!-- Center Panel - Designer Surface -->
    <div id="center-panel" class="flex flex-col flex-1 min-h-0 min-w-0">
      <wc-tab id="center-tab-control" class="flex flex-col flex-1 min-h-0 min-w-0 p-2" animate>
        <wc-tab-item class="active" label="Canvas">
          <div class="designer-surface flex flex-col flex-1 min-h-0 overflow-scroll" id="designer-surface"></div>
        </wc-tab-item>
        <wc-tab-item label="Schema">
          <div class="flex flex-col flex-1 min-h-0 overflow-scroll gap-2">
            <wc-code-mirror class="flex flex-col flex-1 min-h-0"
              name="schema-json"
              line-numbers
              line-wrapper
              fold-gutter
              mode="javascript"
              theme="monokai"
              tab-size="2"
              indent-unit="2">
            </wc-code-mirror>
            <div class="flex flex-row justify-end gap-2 p-2">
              <button id="load-schema" class="btn btn-primary">Load Schema</button>
            </div>
          </div>
        </wc-tab-item>
        <wc-tab-item label="Layout JSON">
          <div class="flex flex-col flex-1 min-h-0 min-w-0 overflow-scroll">
            <wc-code-mirror class="flex flex-col flex-1 min-h-0 min-w-0 w-full max-w-full box-border"
              name="jsonLayout"
              line-numbers
              line-wrapper
              fold-gutter
              mode="javascript"
              theme="monokai"
              tab-size="2"
              indent-unit="2"
              >
            </wc-code-mirror>
            <div class="flex flex-row justify-end gap-2 p-2">
              <button id="copy-design" class="btn btn-secondary">Copy to Clipboard</button>
              <button id="download-design" class="btn btn-primary">Download Design</button>
              <button id="load-design" class="btn btn-info">Apply Design</button>
            </div>
          </div>
        </wc-tab-item>
        <wc-tab-item label="Raw Preview">
          <iframe id="pre-rendered-preview" name="pre-rendered-preview" class="border-none flex flex-col flex-1 min-h-0 overflow-scroll">
          </iframe>
        </wc-tab-item>
        <wc-tab-item label="Preview">
          <iframe id="rendered-preview" name="rendered-preview" class="border-none flex flex-col flex-1 min-h-0 overflow-scroll">
          </iframe>
        </wc-tab-item>
      </wc-tab>
    </div>
    <!-- Right Panel - Properties -->
    <div class="right-panel flex flex-col min-h-0 overflow-scroll p-2">
      <wc-tab id="right-panel" class="flex flex-col flex-1 min-h-0" animate>
        <wc-tab-item class="active" label="Properties">
          <div class="col-1 gap-2 py-2 px-4">
            <div id="no-selection" class="col-1 text-center text-muted py-4">
              <p>Select an element to view and edit its properties</p>
            </div>
            <div id="element-properties" class="col-1 gap-2 hidden">
              <div class="row">
                <wc-input name="prop-id" lbl-label="ID" class="col-1" readonly></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-type" lbl-label="Type" class="col-1"></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-label" lbl-label="Label" class="col-1"></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-scope" lbl-label="Scope" class="col-1"></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-css" lbl-label="CSS" class="col-1"></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-required" lbl-label="Required" class="col" type="checkbox" toggle-switch></wc-input>
              </div>
              <div class="row">
                <button id="save-properties" class="col-1 btn btn-primary">Apply</button>
              </div>
            </div>
          </div>
        </wc-tab-item>
        <wc-tab-item class="" label="Rules">
          <div class="col-1 gap-2 py-2 px-4">
            <div id="rules-no-selection" class="text-center text-muted py-4">
              <p>Select an element to view and edit its rules</p>
            </div>
            <div id="element-rules" class="d-none">
              <div id="rules-list">
                <!-- Rules will be added here -->
              </div>
              <div class="flex flex-row justify-end mt-2">
                <button id="add-rule" class="">Add Rule</button>
              </div>
            </div>
          </div>
        </wc-tab-item>
      </wc-tab>
    </div>
  </div>
  
  <template id="rule-template">
    <swal-title class="text-sm">
      Edit Rule
    </swal-title>
    <swal-html>
      <div class="flex flex-col flex-1 gap-2 text-sm">
        <div class="flex flex-row flex-1">
          <wc-select name="rule-effect" lbl-label="Effect" class="flex-1">
            <option value="COPY">Copy Value</option>
            <option value="COPY-TOLOWER">Copy to Lowercase</option>
            <option value="COPY-TOLOWER-UNDERSCORE">Copy to Lowercase with Underscores</option>
            <option value="SHOW">Show Element</option>
            <option value="HIDE">Hide Element</option>
            <option value="ENABLE">Enable Element</option>
            <option value="DISABLE">Disable Element</option>
            <option value="REQUIRE">Make Required</option>
            <option value="UN-REQUIRE">Make Optional</option>
          </wc-select>
        </div>
        <fieldset class="flex flex-col flex-1 p-2 gap-2">
          <legend>Condition</legend>
          <div class="flex flex-row flex-1">
            <wc-input name="rule-condition-scope" lbl-label="Scope" class="flex-1">
            </wc-input>
          </div>
          <div class="flex flex-row flex-1 gap-2">
            <wc-select name="rule-schema-type" lbl-label="Rule Type" class="flex-1">
              <option value="">Choose...</option>
              <option value="minLength">Min Length</option>
              <option value="maxLength">Max Length</option>
              <option value="pattern">Pattern</option>
              <option value="minimum">Minimum</option>
              <option value="maximum">Maximum</option>
              <option value="const">Constant</option>
              <option value="enum">Enum</option>
            </wc-select>
            <wc-input name="rule-schema-value" lbl-label="Value" class="flex-1">
            </wc-input>            
          </div>
          <div class="flex flex-row flex-1">
            <wc-input name="rule-src-data-id" lbl-label="Source Element ID" class="flex-1">
            </wc-input>
          </div>
          <div class="flex flex-row flex-1 gap-2">
            <wc-input name="rule-src-selector" lbl-label="Source Selector (optional)" class="flex-1">
            </wc-input>
            <wc-input name="rule-src-property" lbl-label="Source Property (optional)" class="flex-1">
            </wc-input>
          </div>
        </fieldset>
        <fieldset class="flex flex-col flex-1 p-2 gap-2">
          <legend>Target</legend>
          <div class="flex flex-row flex-1">
            <!--
            <wc-input name="rule-tgt-data-id" lbl-label="Target Element ID" class="flex-1">
            </wc-input>
            -->
            <wc-select name="rule-tgt-data-id" lbl-label="Target Element ID" class="flex-1">
            </wc-select>
          </div>
          <div class="flex flex-row flex-1 gap-2">
            <wc-input name="rule-tgt-selector" lbl-label="Target Selector (optional)" class="flex-1">
            </wc-input>
            <wc-input name="rule-tgt-property" lbl-label="Target Property (optional)" class="flex-1">
            </wc-input>
          </div>
        </fieldset>
      </div>
    </swal-html>
    <swal-button type="cancel">
      Cancel
    </swal-button>
    <swal-button type="confirm">
      Save Rule
    </swal-button>
    <swal-param name="allowEscapeKey" value="false" />
    <swal-param name="allowOutsideClick" value="false" />
  </template>
      
      `;
      this.innerHTML = markup;
    }
    _applyStyle() {
      const style = `
        wc-page-designer {
          display: contents;
        }
        wc-page-designer .left-panel {
          width: 275px;
          border-right: 1px solid #dee2e6;
        }
        wc-page-designer .center-panel {
          flex: 1;
          background-color: #f8f9fa;
          position: relative;
        }
        wc-page-designer .right-panel {
          width: 300px;
          border-left: 1px solid #dee2e6;
        }
        wc-page-designer .element-list {
          margin-bottom: 20px;
        }
        wc-page-designer .element-item {
          padding: 8px 12px;
          margin-bottom: 5px;
          border: 1px solid var(--button-bg-color);
          border-radius: 4px;
          color: var(--button-color);
          cursor: move;
          user-select: none;
        }
        wc-page-designer .element-item:hover {
          background-color: var(--button-hover-bg-color);
        }
        wc-page-designer .designer-surface {
          padding: 20px;
          background-color: white;
        }
        /* Designer element styling */
        wc-page-designer .designer-element {
          padding: 10px;
          margin: 5px 0;
          border: 2px solid #dee2e6;
          border-radius: 4px;
          position: relative;
        }
        wc-page-designer .designer-element.selected {
          border: 2px solid var(--swatch-9);
        }
        wc-page-designer .designer-element-container {
          min-height: 50px;
          padding: 10px;
          border: 2px dashed #6c757d;
          margin: 8px 0;
          position: relative;
        }
        wc-page-designer .designer-element-container.drag-over {
          background-color: rgba(13, 110, 253, 0.1);
          border: 1px dashed #0d6efd;
        }
        wc-page-designer .designer-element-placeholder {
          height: 50px;
          margin: 8px 0;
          background-color: #f1f1f1;
          text-align: center;
          line-height: 50px;
          color: #6c757d;
        }
        wc-page-designer .container-drop-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }
        wc-page-designer .element-actions {
          position: absolute;
          top: 5px;
          right: 5px;
          display: flex;
          gap: 5px;
        }
        wc-page-designer .element-actions button {
          padding: 2px 5px;
          font-size: 12px;
        }
        wc-page-designer .element-type-header {
          font-size: 12px;
          font-weight: bold;
          color: #6c757d;
          margin-bottom: 5px;
          display: block;
        }
        wc-page-designer .element-label {
          font-weight: bold;
          color: var(--text-9);
        }
        wc-page-designer .preview-container {
          height: 100%;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          background-color: white;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }
        wc-page-designer .preview-container.hidden {
          display: none;
        }
        wc-page-designer .invisible-placeholder {
          visibility: hidden;
          height: 0;
          padding: 0;
          margin: 0;
        }


        wc-page-designer .dark .designer-surface {
          background-color: var(--surface-1);
        }
        wc-page-designer .dark .left-panel {
          border-right: 1px solid var(--surface-1);
        }
        wc-page-designer .dark .right-panel {
          border-left: 1px solid var(--surface-1);
        }
        wc-page-designer .dark .designer-element {
          border: 2px solid var(--surface-4);
        }
        wc-page-designer .dark .designer-element.selected {
          border: 2px solid var(--surface-6);
        }
        wc-page-designer .dark .designer-element-container {
          border: 2px dashed var(--surface-5);
        }
        wc-page-designer .dark .designer-element-container.drag-over {
          background-color: rgba(13, 110, 253, 0.1);
          background-color: color-mix(in oklch, var(--surface-2) 50%, transparent);
          border: 1px dashed var(--surface-5);
        }
        wc-page-designer .dark .designer-element-placeholder {
          background-color: var(--surface-3);
          color: var(--text-7);
        }          
        wc-page-designer .dark .element-type-header {
          color: var(--text-3);
        }
        wc-page-designer .dark .element-label {
          color: var(--text-5);
        }
        wc-page-designer .dark .preview-container {
          background-color: white;
        }
      `;
      this.loadStyle("wc-page-designer-style", style);
    }
    wireEvents() {
    }
    unWireEvents() {
      console.log("unWireEvents:wc-page-designer");
    }
    setup() {
      const isWired = this.hasAttribute("data-wired");
      if (isWired) return;
      this.designerSurface = document.getElementById("designer-surface");
      this.containerElements = document.getElementById("container-elements");
      this.formElements = document.getElementById("form-elements");
      this.schemaFields = document.getElementById("schema-fields");
      this.previewButton = document.querySelector('button[data-label="Preview"]');
      this.renderedPreviewButton = document.querySelector('button[data-label="Preview"]');
      this.preRenderedPreviewButton = document.querySelector('button[data-label="Raw Preview"]');
      this.schemaButton = document.querySelector('button[data-label="Schema"]');
      this.generateJsonButton = document.querySelector('button[data-label="Layout JSON"]');
      this.jsonOutput = document.querySelector('wc-code-mirror[name="jsonLayout"]');
      this.propId = document.getElementById("prop-id");
      this.propType = document.getElementById("prop-type");
      this.propLabel = document.getElementById("prop-label");
      this.propScope = document.getElementById("prop-scope");
      this.propCss = document.getElementById("prop-css");
      this.propRequired = document.getElementById("prop-required");
      this.savePropertiesButton = document.getElementById("save-properties");
      this.noSelectionPanel = document.getElementById("no-selection");
      this.elementPropertiesPanel = document.getElementById("element-properties");
      this.schemaJson = document.querySelector('wc-code-mirror[name="schema-json"]');
      this.loadSchemaButton = document.getElementById("load-schema");
      this.addRuleButton = document.getElementById("add-rule");
      this.rulesList = document.getElementById("rules-list");
      this.saveRuleButton = document.getElementById("save-rule");
      this.loadDesignButton = document.getElementById("load-design");
      this.copyDesignButton = document.getElementById("copy-design");
      this.downloadDesignButton = document.getElementById("download-design");
      this.init();
      this.setAttribute("data-wired", true);
    }
    // Initialize Designer
    init() {
      this.initDragAndDrop();
      this.initDropZone(this.designerSurface, null);
      new Sortable(this.designerSurface, {
        group: "elements",
        animation: 150,
        onEnd: (evt) => {
          this.updateTopLevelElementsOrder();
        }
      });
      this.initEventListeners();
      this.schemaJson.editor.setValue(JSON.stringify(this.sampleSchema, null, 2));
      this.loadSchema(this.sampleSchema);
    }
    // Update top-level elements order
    updateTopLevelElementsOrder() {
      const newOrder = [];
      const childElements = this.designerSurface.querySelectorAll(":scope > .designer-element");
      childElements.forEach((childNode) => {
        const childId = childNode.getAttribute("data-id");
        const child = this.findElementById(childId);
        if (child) {
          newOrder.push(child);
        }
      });
      this.designerState.elements = newOrder;
    }
    // Initialize Drag and Drop
    initDragAndDrop() {
      const elementItems = document.querySelectorAll(".element-item");
      elementItems.forEach((item) => {
        item.addEventListener("dragstart", (e) => {
          e.dataTransfer.setData("element-type", item.getAttribute("data-element-type"));
          e.dataTransfer.setData("schema-field", item.getAttribute("data-schema-field") || "");
          e.dataTransfer.effectAllowed = "copy";
        });
      });
    }
    // Initialize Drop Zone
    initDropZone(element, parentElementId = null) {
      element.setAttribute("data-drop-zone", "true");
      element.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        element.classList.add("drag-over");
      });
      element.addEventListener("dragleave", (e) => {
        element.classList.remove("drag-over");
      });
      element.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        element.classList.remove("drag-over");
        const elementType = e.dataTransfer.getData("element-type");
        const schemaField = e.dataTransfer.getData("schema-field");
        if (elementType) {
          let scope = "";
          let label = "";
          if (schemaField) {
            scope = schemaField;
            const parts = schemaField.split("/");
            if (parts.length > 0) {
              label = parts[parts.length - 1];
              if (schemaField.includes("$defs")) {
                const defName = parts[2];
                const fieldName = parts[parts.length - 1];
                if (defName && fieldName) {
                  label = defName + "." + fieldName;
                }
              }
            }
          } else {
            label = this.getDefaultLabel(elementType);
          }
          const id = this.generateUniqueId();
          const newElement = {
            id,
            "data-id": id,
            type: elementType,
            label,
            scope,
            css: "",
            required: false,
            rules: [],
            elements: []
          };
          if (parentElementId) {
            const parentElement = this.findElementById(parentElementId);
            if (parentElement) {
              if (!parentElement.elements) {
                parentElement.elements = [];
              }
              parentElement.elements.push(newElement);
            }
          } else {
            this.designerState.elements.push(newElement);
          }
          const placeholder = element.querySelector(".designer-element-placeholder");
          if (placeholder && placeholder.parentNode === element) {
            try {
              element.removeChild(placeholder);
            } catch (e2) {
              console.log("Could not remove placeholder:", e2);
            }
          }
          const elementNode = this.createElementNode(newElement);
          element.appendChild(elementNode);
          if (element.classList.contains("designer-element-container")) {
            setTimeout(() => {
              if (!element.querySelector(".designer-element-placeholder")) {
                const newPlaceholder = document.createElement("div");
                newPlaceholder.className = "designer-element-placeholder";
                newPlaceholder.textContent = "Drop more elements here";
                element.appendChild(newPlaceholder);
              }
            }, 100);
          }
          if (this.isContainerElement(elementType)) {
            const containerElements = document.querySelectorAll(".designer-element-container:not([data-drop-zone])");
            containerElements.forEach((containerElement) => {
              const containerId = containerElement.getAttribute("data-container-for");
              if (containerId) {
                this.initDropZone(containerElement, containerId);
              }
            });
          }
        }
      });
    }
    // Initialize Event Listeners
    initEventListeners() {
      this.renderedPreviewButton.addEventListener("click", this.renderPreview.bind(this));
      this.preRenderedPreviewButton.addEventListener("click", this.preRenderPreview.bind(this));
      this.schemaButton.addEventListener("click", this.setSchema.bind(this));
      this.generateJsonButton.addEventListener("click", this.generateJson.bind(this));
      this.savePropertiesButton.addEventListener("click", this.saveProperties.bind(this));
      this.loadSchemaButton.addEventListener("click", () => {
        try {
          const schema = JSON.parse(this.schemaJson.editor.getValue());
          this.loadSchema(schema);
        } catch (e) {
          alert("Invalid JSON schema");
        }
      });
      this.addRuleButton.addEventListener("click", () => {
        this.designerState.editingRuleIndex = -1;
        const promptPayload = {
          focusConfirm: false,
          template: "template#rule-template",
          didOpen: () => {
            const cnt = document.querySelector(".swal2-container");
            if (cnt) {
              if (this.designerState.selectedElement) {
                const src = document.getElementById("rule-src-data-id");
                src.value = this.designerState.selectedElement.id;
                const layout = JSON.parse(this.jsonOutput.editor.getValue());
                const srcElements = WaveHelpers.extractSrcElements(layout);
                const tgt = document.getElementById("rule-tgt-data-id");
                tgt.innerHTML = "";
                let option = document.createElement("option");
                option.value = "";
                option.textContent = "Choose...";
                tgt.appendChild(option);
                srcElements.forEach((el) => {
                  option = document.createElement("option");
                  option.value = el.dataId;
                  option.textContent = el.label;
                  tgt.appendChild(option);
                });
              }
              htmx.process(cnt);
              _hyperscript.processNode(cnt);
            }
          },
          preConfirm: () => {
            const effect = document.getElementById("rule-effect").value;
            const conditionScope = document.getElementById("rule-condition-scope").value;
            const schemaType = document.getElementById("rule-schema-type").value;
            const schemaValue = document.getElementById("rule-schema-value").value;
            const srcDataId = document.getElementById("rule-src-data-id").value;
            const srcSelector = document.getElementById("rule-src-selector").value || "";
            const srcProperty = document.getElementById("rule-src-property").value || "";
            const tgtDataId = document.getElementById("rule-tgt-data-id").value;
            const tgtSelector = document.getElementById("rule-tgt-selector").value || "";
            const tgtProperty = document.getElementById("rule-tgt-property").value || "";
            const rule = {
              effect,
              condition: {
                scope: conditionScope,
                schema: {
                  [schemaType]: schemaValue
                },
                srcDataId,
                srcSelector,
                srcProperty
              },
              tgtDataId,
              tgtSelector,
              tgtProperty
            };
            if (schemaType && schemaValue) {
              switch (schemaType) {
                case "minLength":
                case "maxLength":
                case "minimum":
                case "maximum":
                  rule.condition.schema[schemaType] = parseInt(schemaValue);
                  break;
                case "pattern":
                  rule.condition.schema[schemaType] = schemaValue;
                  break;
                case "const":
                  rule.condition.schema[schemaType] = schemaValue;
                  break;
                case "enum":
                  rule.condition.schema[schemaType] = schemaValue.split(",").map((v) => v.trim());
                  break;
              }
            }
            return rule;
          },
          callback: (result) => {
            console.log("rule-template - result:", result);
            this.saveRule(result);
          }
        };
        wc.Prompt.notifyTemplate(promptPayload);
      });
      this.jsonOutput.editor.on("change2", async () => {
        try {
          const jsonText = this.jsonOutput.editor.getValue().trim();
          const layoutData = JSON.parse(jsonText);
          this.loadDesign(layoutData);
        } catch (e) {
          alert("Invalid JSON format: " + e.message);
        }
      });
      this.loadDesignButton.addEventListener("click", () => {
        try {
          const jsonText = this.jsonOutput.editor.getValue().trim();
          if (!jsonText) {
            alert("Please paste a valid JSON layout");
            return;
          }
          const layoutData = JSON.parse(jsonText);
          this.loadDesign(layoutData);
          wc.Prompt.toast({ title: "Load Succeeded!" });
        } catch (e) {
          alert("Invalid JSON format: " + e.message);
        }
      });
      this.copyDesignButton.addEventListener("click", this.copyDesign.bind(this));
      this.downloadDesignButton.addEventListener("click", () => {
        const jsonText = this.jsonOutput.editor.getValue();
        const designName = "layout-ui-design";
        const fileName = `${designName}.json`;
        const blob = new Blob([jsonText], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }
    // Create Element Object
    createElementObject({ type, label = "", scope = "", parentElement = null, css = "", id = null }) {
      const elementId = id || this.generateUniqueId();
      const element = {
        id: elementId,
        "data-id": elementId,
        type,
        label,
        scope,
        css,
        required: false,
        rules: [],
        elements: []
      };
      if (parentElement) {
        const parent = this.findElementById(parentElement);
        if (parent) {
          parent.elements.push(element);
        }
        return element;
      } else {
        this.designerState.elements.push(element);
        return element;
      }
    }
    // Add Element to Designer
    addElementToDesigner(element, containerElement) {
      const placeholder = containerElement.querySelector(".designer-element-placeholder");
      if (placeholder) {
        containerElement.removeChild(placeholder);
      }
      const elementNode = this.createElementNode(element);
      containerElement.appendChild(elementNode);
    }
    // Create Element Node
    createElementNode(element) {
      const node = document.createElement("div");
      node.className = "designer-element";
      node.setAttribute("data-id", element.id);
      node.setAttribute("data-type", element.type);
      const typeHeader = document.createElement("span");
      typeHeader.className = "element-type-header";
      typeHeader.textContent = element.type;
      node.appendChild(typeHeader);
      if (element.label) {
        const labelElement = document.createElement("span");
        labelElement.className = "element-label";
        labelElement.textContent = element.label;
        node.appendChild(labelElement);
        if (element.scope) {
          const scopeElement = document.createElement("small");
          scopeElement.className = "ms-2 text-muted";
          scopeElement.textContent = `(${element.scope})`;
          labelElement.appendChild(scopeElement);
        }
      }
      const actions = document.createElement("div");
      actions.className = "element-actions";
      const deleteButton = document.createElement("button");
      deleteButton.className = "btn btn-sm btn-outline-danger";
      deleteButton.textContent = "Delete";
      deleteButton.addEventListener("click", (e) => {
        e.stopPropagation();
        this.removeElement(element.id);
      });
      actions.appendChild(deleteButton);
      node.appendChild(actions);
      node.addEventListener("click", (e) => {
        e.stopPropagation();
        this.selectElement(element.id);
      });
      if (this.isContainerElement(element.type)) {
        const container2 = document.createElement("div");
        container2.className = "designer-element-container";
        container2.setAttribute("data-container-for", element.id);
        if (!element.elements || element.elements.length === 0) {
          const placeholder = document.createElement("div");
          placeholder.className = "designer-element-placeholder";
          placeholder.textContent = "Drop elements here";
          container2.appendChild(placeholder);
        } else {
          element.elements.forEach((childElement) => {
            const childNode = this.createElementNode(childElement);
            container2.appendChild(childNode);
          });
        }
        this.initDropZone(container2, element.id);
        new Sortable(container2, {
          group: "elements",
          animation: 150,
          onEnd: (evt) => {
            this.updateElementsOrder(container2, element.id);
          }
        });
        node.appendChild(container2);
      }
      return node;
    }
    // Update Elements Order
    updateElementsOrder(container2, parentId) {
      const parent = this.findElementById(parentId);
      if (!parent) return;
      const newOrder = [];
      const childElements = container2.querySelectorAll(":scope > .designer-element");
      childElements.forEach((childNode) => {
        const childId = childNode.getAttribute("data-id");
        const child = this.findElementById(childId);
        if (child) {
          newOrder.push(child);
        }
      });
      parent.elements = newOrder;
    }
    // Select Element
    selectElement(elementId) {
      const selectedNodes = document.querySelectorAll(".designer-element.selected");
      selectedNodes.forEach((node2) => node2.classList.remove("selected"));
      const element = this.findElementById(elementId);
      if (!element) return;
      this.designerState.selectedElement = element;
      const node = document.querySelector(`.designer-element[data-id="${elementId}"]`);
      if (node) {
        node.classList.add("selected");
      }
      this.updateProperties(element);
      this.updateRulesPanel(element);
      this.noSelectionPanel.classList.add("hidden");
      this.elementPropertiesPanel.classList.remove("hidden");
      document.getElementById("rules-no-selection").classList.add("hidden");
      document.getElementById("element-rules").classList.remove("hidden");
    }
    // Update Properties
    updateProperties(element) {
      this.propId.value = element.id;
      this.propType.value = element.type;
      this.propLabel.value = element.label || "";
      this.propScope.value = element.scope || "";
      this.propCss.value = element.css || "";
      this.propRequired.checked = element.required || false;
    }
    // Update Rules Panel
    updateRulesPanel(element) {
      this.rulesList.innerHTML = "";
      if (!element.rules || element.rules.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "text-muted text-center";
        emptyMessage.textContent = "No rules defined";
        this.rulesList.appendChild(emptyMessage);
        return;
      }
      element.rules.forEach((rule, index) => {
        const ruleItem = document.createElement("div");
        ruleItem.className = "rule-item flex flex-col rounded border-1 border-solid gap-2 p-2";
        const ruleHeader = document.createElement("div");
        ruleHeader.className = "flex flex-col gap-2";
        const ruleTitle = document.createElement("h6");
        ruleTitle.textContent = `Rule: ${rule.effect}`;
        ruleHeader.appendChild(ruleTitle);
        const ruleActions = document.createElement("div");
        ruleActions.className = "flex flex-row justify-between align-center";
        const editButton = document.createElement("button");
        editButton.className = "theme-azure dark";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editRule(index));
        ruleActions.appendChild(editButton);
        const deleteButton = document.createElement("button");
        deleteButton.className = "theme-fire dark";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => deleteRule(index));
        ruleActions.appendChild(deleteButton);
        ruleHeader.appendChild(ruleActions);
        ruleItem.appendChild(ruleHeader);
        const ruleSummary = document.createElement("div");
        ruleSummary.className = "text-sm";
        const condition = document.createElement("div");
        condition.textContent = `When ${rule.condition.scope} ${getSchemaDescription(rule.condition.schema)}`;
        ruleSummary.appendChild(condition);
        const effect = document.createElement("div");
        effect.textContent = `${rule.effect} on ${rule.tgtDataId}`;
        ruleSummary.appendChild(effect);
        ruleItem.appendChild(ruleSummary);
        this.rulesList.appendChild(ruleItem);
      });
    }
    // Get Schema Description
    getSchemaDescription(schema) {
      if (!schema) return "";
      const descriptions = [];
      if (schema.const !== void 0) {
        descriptions.push(`equals "${schema.const}"`);
      }
      if (schema.enum) {
        descriptions.push(`is one of [${schema.enum.join(", ")}]`);
      }
      if (schema.minimum !== void 0) {
        descriptions.push(`>= ${schema.minimum}`);
      }
      if (schema.maximum !== void 0) {
        descriptions.push(`<= ${schema.maximum}`);
      }
      if (schema.minLength !== void 0) {
        descriptions.push(`length >= ${schema.minLength}`);
      }
      if (schema.maxLength !== void 0) {
        descriptions.push(`length <= ${schema.maxLength}`);
      }
      if (schema.pattern) {
        descriptions.push(`matches "${schema.pattern}"`);
      }
      return descriptions.join(" AND ");
    }
    // Edit Rule
    editRule(index) {
      if (!this.designerState.selectedElement || !this.designerState.selectedElement.rules) return;
      const rule = this.designerState.selectedElement.rules[index];
      if (!rule) return;
      this.designerState.editingRuleIndex = index;
      const promptPayload = {
        focusConfirm: false,
        template: "template#rule-template",
        didOpen: () => {
          const cnt = document.querySelector(".swal2-container");
          if (cnt) {
            document.getElementById("rule-effect").value = rule.effect;
            document.getElementById("rule-condition-scope").value = rule.condition.scope || "";
            if (rule.condition.schema) {
              const schema = rule.condition.schema;
              let schemaType = "";
              let schemaValue = "";
              if (schema.minLength !== void 0) {
                schemaType = "minLength";
                schemaValue = schema.minLength;
              } else if (schema.maxLength !== void 0) {
                schemaType = "maxLength";
                schemaValue = schema.maxLength;
              } else if (schema.pattern !== void 0) {
                schemaType = "pattern";
                schemaValue = schema.pattern;
              } else if (schema.minimum !== void 0) {
                schemaType = "minimum";
                schemaValue = schema.minimum;
              } else if (schema.maximum !== void 0) {
                schemaType = "maximum";
                schemaValue = schema.maximum;
              } else if (schema.const !== void 0) {
                schemaType = "const";
                schemaValue = schema.const;
              } else if (schema.enum !== void 0) {
                schemaType = "enum";
                schemaValue = schema.enum.join(",");
              }
              document.getElementById("rule-schema-type").value = schemaType;
              document.getElementById("rule-schema-value").value = schemaValue;
            }
            document.getElementById("rule-src-data-id").value = rule.condition.srcDataId || "";
            document.getElementById("rule-src-selector").value = rule.condition.srcSelector || "";
            document.getElementById("rule-src-property").value = rule.condition.srcProperty || "";
            document.getElementById("rule-tgt-data-id").value = rule.tgtDataId || "";
            document.getElementById("rule-tgt-selector").value = rule.tgtSelector || "";
            document.getElementById("rule-tgt-property").value = rule.tgtProperty || "";
            htmx.process(cnt);
            _hyperscript.processNode(cnt);
          }
        },
        preConfirm: () => {
          const effect = document.getElementById("rule-effect").value;
          const conditionScope = document.getElementById("rule-condition-scope").value;
          const schemaType = document.getElementById("rule-schema-type").value;
          const schemaValue = document.getElementById("rule-schema-value").value;
          const srcDataId = document.getElementById("rule-src-data-id").value;
          const srcSelector = document.getElementById("rule-src-selector").value || "";
          const srcProperty = document.getElementById("rule-src-property").value || "";
          const tgtDataId = document.getElementById("rule-tgt-data-id").value;
          const tgtSelector = document.getElementById("rule-tgt-selector").value || "";
          const tgtProperty = document.getElementById("rule-tgt-property").value || "";
          const rule2 = {
            effect,
            condition: {
              scope: conditionScope,
              schema: {
                [schemaType]: schemaValue
              },
              srcDataId,
              srcSelector,
              srcProperty
            },
            tgtDataId,
            tgtSelector,
            tgtProperty
          };
          if (schemaType && schemaValue) {
            switch (schemaType) {
              case "minLength":
              case "maxLength":
              case "minimum":
              case "maximum":
                rule2.condition.schema[schemaType] = parseInt(schemaValue);
                break;
              case "pattern":
                rule2.condition.schema[schemaType] = schemaValue;
                break;
              case "const":
                rule2.condition.schema[schemaType] = schemaValue;
                break;
              case "enum":
                rule2.condition.schema[schemaType] = schemaValue.split(",").map((v) => v.trim());
                break;
            }
          }
          return rule2;
        },
        callback: (result) => {
          console.log("rule-template - result:", result);
          this.saveRule(result);
        }
      };
      wc.Prompt.notifyTemplate(promptPayload);
    }
    // Delete Rule
    async deleteRule(index) {
      if (!this.designerState.selectedElement || !this.designerState.selectedElement.rules) return;
      const result = await wc.Prompt.question({
        title: "Confirm Delete",
        text: "Are you are you want to delete this rule?",
        showCancelButton: true
      });
      if (result) {
        this.designerState.selectedElement.rules.splice(index, 1);
        this.updateRulesPanel(this.designerState.selectedElement);
      }
    }
    // Save Rule
    saveRule(rule) {
      if (!this.designerState.selectedElement) return;
      if (this.designerState.editingRuleIndex >= 0) {
        this.designerState.selectedElement.rules[this.designerState.editingRuleIndex] = rule;
      } else {
        if (!this.designerState.selectedElement.rules) {
          this.designerState.selectedElement.rules = [];
        }
        this.designerState.selectedElement.rules.push(rule);
      }
      this.updateRulesPanel(this.designerState.selectedElement);
    }
    // Clear Rule Form
    clearRuleForm() {
      document.getElementById("rule-effect").value = "SHOW";
      document.getElementById("rule-condition-scope").value = "";
      document.getElementById("rule-schema-type").value = "minLength";
      document.getElementById("rule-schema-value").value = "";
      document.getElementById("rule-src-data-id").value = "";
      document.getElementById("rule-src-selector").value = "input";
      document.getElementById("rule-src-property").value = "value";
      document.getElementById("rule-tgt-data-id").value = "";
      document.getElementById("rule-tgt-selector").value = "";
      document.getElementById("rule-tgt-property").value = "value";
    }
    // Save Properties - Fixed to apply changes correctly
    saveProperties() {
      if (!this.designerState.selectedElement) return;
      this.designerState.selectedElement.type = this.propType.value;
      this.designerState.selectedElement.label = this.propLabel.value;
      this.designerState.selectedElement.scope = this.propScope.value;
      this.designerState.selectedElement.css = this.propCss.value;
      this.designerState.selectedElement.required = this.propRequired.checked;
      this.refreshDesigner();
      wc.Prompt.toast({ title: "Properties Updated!" });
    }
    // Refresh Designer
    refreshDesigner() {
      const selectedId = this.designerState.selectedElement ? this.designerState.selectedElement.id : null;
      this.designerSurface.innerHTML = "";
      this.designerState.elements.forEach((element) => {
        this.addElementToDesigner(element, this.designerSurface);
      });
      if (selectedId) {
        this.selectElement(selectedId);
      }
    }
    // Remove Element
    removeElement(elementId) {
      if (!confirm("Are you sure you want to delete this element?")) return;
      const element = this.findElementById(elementId);
      if (!element) return;
      const parent = this.findParentElement(elementId);
      if (parent) {
        parent.elements = parent.elements.filter((e) => e.id !== elementId);
      } else {
        this.designerState.elements = this.designerState.elements.filter((e) => e.id !== elementId);
      }
      if (this.designerState.selectedElement && this.designerState.selectedElement.id === elementId) {
        this.designerState.selectedElement = null;
        this.noSelectionPanel.classList.remove("hidden");
        this.elementPropertiesPanel.classList.add("hidden");
        document.getElementById("rules-no-selection").classList.remove("hidden");
        document.getElementById("element-rules").classList.add("hidden");
      }
      this.refreshDesigner();
    }
    // Find Element By ID
    findElementById(elementId) {
      let found = this.designerState.elements.find((e) => e.id === elementId);
      if (found) return found;
      const checkElements = (elements) => {
        if (!elements) return null;
        for (const element of elements) {
          if (element.id === elementId) return element;
          if (element.elements && element.elements.length > 0) {
            const nestedFound = checkElements(element.elements);
            if (nestedFound) return nestedFound;
          }
        }
        return null;
      };
      return checkElements(this.designerState.elements);
    }
    // Find Parent Element
    findParentElement(elementId) {
      const checkElements = (elements) => {
        if (!elements) return null;
        for (const element of elements) {
          if (element.elements && element.elements.some((e) => e.id === elementId)) {
            return element;
          }
          if (element.elements && element.elements.length > 0) {
            const nestedFound = checkElements(element.elements);
            if (nestedFound) return nestedFound;
          }
        }
        return null;
      };
      return checkElements(this.designerState.elements);
    }
    // Load Schema
    loadSchema(schema) {
      this.designerState.schema = schema;
      this.schemaFields.innerHTML = "";
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]) => {
          this.addSchemaField(`#/properties/${key}`, prop, schema.required);
        });
      }
      if (schema.$defs) {
        Object.entries(schema.$defs).forEach(([defName, def]) => {
          if (def.properties) {
            Object.entries(def.properties).forEach(([key, prop]) => {
              this.addSchemaField(`#/$defs/${defName}/${key}`, prop, def.required);
            });
          }
        });
      }
    }
    // Add Schema Field
    addSchemaField(path, prop, required) {
      const fieldItem = document.createElement("div");
      fieldItem.className = "element-item";
      fieldItem.setAttribute("draggable", "true");
      fieldItem.setAttribute("data-schema-field", path);
      let elementType = "wc-input";
      if (prop.type === "boolean") {
        elementType = "wc-input-checkbox";
      } else if (prop.type === "array") {
        elementType = "array";
      }
      fieldItem.setAttribute("data-element-type", elementType);
      const fieldName = path.split("/").pop();
      let displayName = fieldName;
      if (path.includes("$defs")) {
        const parts = path.split("/");
        if (parts.length >= 3) {
          const defName = parts[2];
          displayName = defName + "." + fieldName;
        }
      }
      fieldItem.textContent = displayName;
      if (required && required.includes(fieldName)) {
        const requiredSpan = document.createElement("span");
        requiredSpan.className = "ms-1 text-danger";
        requiredSpan.textContent = "*";
        fieldItem.appendChild(requiredSpan);
      }
      const typeSpan = document.createElement("span");
      typeSpan.className = "ms-2 text-muted small";
      typeSpan.textContent = `(${prop.type})`;
      fieldItem.appendChild(typeSpan);
      fieldItem.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("element-type", elementType);
        e.dataTransfer.setData("schema-field", path);
        e.dataTransfer.effectAllowed = "copy";
      });
      this.schemaFields.appendChild(fieldItem);
    }
    //
    // Preview
    //
    // Render Preview
    renderPreview() {
      this.generateJson();
      const iframe = document.getElementById("rendered-preview");
      iframe.addEventListener("load", () => {
        WaveHelpers.toggleIndicator("#content-loader", false);
      }, { once: true });
      WaveHelpers.toggleIndicator("#content-loader", true);
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/gen/generate_dynamic_layout";
      form.target = "rendered-preview";
      const jsonInput = document.createElement("input");
      jsonInput.type = "hidden";
      jsonInput.name = "JSONSchema";
      jsonInput.value = this.schemaJson.editor.getValue();
      form.appendChild(jsonInput);
      const layoutInput = document.createElement("input");
      layoutInput.type = "hidden";
      layoutInput.name = "UILayout";
      layoutInput.value = this.jsonOutput.editor.getValue();
      form.appendChild(layoutInput);
      document.body.appendChild(form);
      form.submit();
      form.remove();
    }
    // Pre Render Preview
    preRenderPreview() {
      this.generateJson();
      const iframe = document.getElementById("pre-rendered-preview");
      iframe.addEventListener("load", () => {
        WaveHelpers.toggleIndicator("#content-loader", false);
      }, { once: true });
      WaveHelpers.toggleIndicator("#content-loader", true);
      const form = document.createElement("form");
      form.method = "POST";
      form.action = "/gen/generate_pre_dynamic_layout";
      form.target = "pre-rendered-preview";
      const jsonInput = document.createElement("input");
      jsonInput.type = "hidden";
      jsonInput.name = "JSONSchema";
      jsonInput.value = this.schemaJson.editor.getValue();
      form.appendChild(jsonInput);
      const layoutInput = document.createElement("input");
      layoutInput.type = "hidden";
      layoutInput.name = "UILayout";
      layoutInput.value = this.jsonOutput.editor.getValue();
      form.appendChild(layoutInput);
      document.body.appendChild(form);
      form.submit();
      form.remove();
    }
    // Set Schema
    setSchema() {
      this.schemaJson.editor.setValue(JSON.stringify(this.sampleSchema, null, 2));
    }
    // Generate JSON
    generateJson() {
      const json = {
        elements: this.designerState.elements
      };
      const cleanJson = JSON.parse(JSON.stringify(json));
      const cleanIds = (elements) => {
        if (!elements) return;
        elements.forEach((element) => {
          delete element.id;
          if (element.elements) {
            cleanIds(element.elements);
          }
        });
      };
      cleanIds(cleanJson.elements);
      this.jsonOutput.editor.setValue(JSON.stringify(cleanJson.elements, null, 2));
      return cleanJson.elements;
    }
    // Copy Design to Clipboard
    copyDesign() {
      const textToCopy = this.jsonOutput.editor.getValue();
      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = this.copyDesignButton.textContent;
        this.copyDesignButton.textContent = "Copied!";
        setTimeout(() => {
          this.copyDesignButton.textContent = originalText;
        }, 2e3);
      }).catch((err) => {
        console.error("Failed to copy: ", err);
        alert("Failed to copy JSON to clipboard");
      });
    }
    // Check if element type is a container
    isContainerElement(type) {
      return [
        "wc-tab",
        "wc-tab-item",
        "column",
        "row",
        "fieldset",
        "array",
        "wc-card",
        "option",
        "wc-accordion",
        "wc-split-button",
        "wc-sidebar-left",
        "wc-sidebar-right",
        "wc-sidenav-left",
        "wc-sidenav-right",
        "wc-timeline",
        "wc-tabulator",
        "wc-slideshow",
        "wc-select",
        "wc-form",
        "wc-breadcrumb"
      ].includes(type);
    }
    // Generate Unique ID
    generateUniqueId() {
      return uuid.v4().substring(0, 12);
    }
    // Get Default Label for Element Type
    getDefaultLabel(type) {
      switch (type) {
        case "wc-tab":
          return "Tab Container";
        case "wc-tab-item":
          return "Tab Item";
        case "column":
          return "Column";
        case "row":
          return "Row";
        case "fieldset":
          return "Group";
        case "array":
          return "Array";
        case "wc-card":
          return "Card";
        case "wc-input":
          return "Input Field";
        case "wc-input-checkbox":
          return "Checkbox";
        case "hr":
          return "";
        default:
          return type;
      }
    }
    saveDesignToLocalStorage() {
      const designName = "layout-ui-design";
      const jsonText = this.jsonOutput.editor.getValue();
      try {
        let savedDesigns = JSON.parse(localStorage.getItem("savedDesigns") || "{}");
        savedDesigns[designName] = jsonText;
        localStorage.setItem("savedDesigns", JSON.stringify(savedDesigns));
        alert(`Design "${designName}" saved successfully`);
      } catch (e) {
        console.error("Error saving design to localStorage:", e);
        alert("Failed to save design to localStorage");
      }
    }
    loadDesign(layoutData) {
      try {
        let elements = Array.isArray(layoutData) ? layoutData : layoutData.elements ? layoutData.elements : null;
        if (!elements) {
          throw new Error("Invalid layout structure. Expected an array or an object with an elements property.");
        }
        this.designerState.elements = [];
        const addIds = (elements2) => {
          if (!elements2) return;
          elements2.forEach((element) => {
            if (element["data-id"]) {
              element.id = element["data-id"];
            } else {
              element.id = generateUniqueId();
            }
            if (element.elements) {
              addIds(element.elements);
            }
          });
        };
        addIds(elements);
        this.designerState.elements = elements;
        this.refreshDesigner();
        return true;
      } catch (e) {
        console.error("Error loading design:", e);
        alert("Failed to load design: " + e.message);
        return false;
      }
    }
  }
  customElements.define("wc-page-designer", WcPageDesigner);
}

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
        wc-save-button {
          display: contents;
        }
        .wc-save-button {
        }
        .wc-save-button:hover  {
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
      let beforeSend = this.getAttribute("before-send") || "";
      if (beforeSend) {
        beforeSend = `hx-on::before-send="${beforeSend}"`;
      }
      const markup = `
        <button type="button" class="save-btn btn"
          hx-${method}="${saveUrl}" ${beforeSend ? beforeSend : ""}
          data-url="${saveUrl}">Save</button>
        <div class="dropdown">
          <div class="dropdown-content text-sm">
            <a class="save-new-btn btn w-full"
              hx-${method}="${saveUrl}" ${beforeSend ? beforeSend : ""}
              data-url="${saveNewUrl}">
              Save and Add New
            </a>
            <a class="save-return-btn btn w-full"
              hx-${method}="${saveUrl}" ${beforeSend ? beforeSend : ""}
              data-url="${saveReturnUrl}">
              Save and Return
            </a>
          </div>
          <button type="button" class="btn" style="border-left:1px solid var(--component-border-color);">
            <svg class="h-3 w-3 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"
              stroke="currentColor" fill="currentColor">
              <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
            </svg>
          </button>
        </div>
      `.trim();
      this.componentElement.innerHTML = markup;
      const saveBtn = this.querySelector(".wc-save-split-button");
      saveBtn.style.anchorName = `--${id}-anchor`;
      const drpContent = this.querySelector(".dropdown-content");
      drpContent.style.positionAnchor = `--${id}-anchor`;
      drpContent.style.positionArea = positionArea;
      drpContent.style.positionTryFallbacks = positionTryFallbacks;
      drpContent.style.minWidth = `${saveBtn.offsetWidth}px`;
    }
    _handleAttributeChange(attrName, newValue) {
      super._handleAttributeChange(attrName, newValue);
    }
    _handleClick(event) {
      const method = this.getAttribute("method") || "post";
      const isSaveBtn = event.target.classList.contains("save-btn");
      let url = event.target.dataset.url;
      let hash = window.location.hash;
      if (method == "post" && isSaveBtn) {
        url = url.replace("create", "__id__");
      }
      document.body.addEventListener("htmx:configRequest", (e) => {
        e.detail.headers["Wc-Save-Redirect"] = url;
        if (hash && isSaveBtn) {
          sessionStorage.setItem("hash", hash);
        }
      }, { once: true });
      document.body.addEventListener("htmx:afterSwap", (e) => {
        const hash2 = sessionStorage.getItem("hash");
        if (hash2) {
          window.location.hash = hash2;
          sessionStorage.removeItem("hash");
        }
      }, { once: true });
    }
    _applyStyle() {
      const style = `
        wc-save-split-button {
          display: contents;
        }
        .wc-save-split-button {
          /* anchor-name: --save-anchor; */
          display: flex;
          flex-direction: row;
        }
        /* Dropdown Button */
        .wc-save-split-button .btn {
          border-right: none;
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
          background-color: var(--button-bg-color);
          border: 1px solid var(--button-border-color);
          border-top: none;
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
        .wc-save-split-button .dropdown-content a {
          color: var(--button-color);
          padding: 12px 16px;
          text-decoration: none;
          display: block;
          cursor: pointer;
        }

        /* Change color of dropdown links on hover */
        .wc-save-split-button .dropdown-content a:hover {
          background-color: var(--button-hover-bg-color);
          color: var(--button-hover-color);
        }

        /* Show the dropdown menu on hover */
        .wc-save-split-button .dropdown:hover > .dropdown-content {
          display: block;
        }
        .wc-save-split-button .dropdown-content:hover ~ button {
          background-color: var(--button-hover-bg-color);
          color: var(--button-hover-color);
        }
      `.trim();
      this.loadStyle("wc-save-split-button-style", style);
    }
    _wireEvents() {
      super._wireEvents();
      const saveBtn = this.querySelector("button.save-btn");
      saveBtn.addEventListener("click", this._handleClick.bind(this));
      const saveNewBtn = this.querySelector("a.save-new-btn");
      saveNewBtn.addEventListener("click", this._handleClick.bind(this));
      const saveReturnBtn = this.querySelector("a.save-return-btn");
      saveReturnBtn.addEventListener("click", this._handleClick.bind(this));
    }
    _unWireEvents() {
      super._unWireEvents();
      const saveBtn = this.querySelector("button.save-btn");
      saveBtn.removeEventListener("click", this._handleClick.bind(this));
      const saveNewBtn = this.querySelector("a.save-new-btn");
      saveNewBtn.removeEventListener("click", this._handleClick.bind(this));
      const saveReturnBtn = this.querySelector("a.save-return-btn");
      saveReturnBtn.removeEventListener("click", this._handleClick.bind(this));
    }
  }
  customElements.define("wc-save-split-button", WcSaveSplitButton);
}

// src/js/components/wc-split-button.js
if (!customElements.get("wc-split-button")) {
  class WcSplitButton extends WcBaseComponent {
    static get observedAttributes() {
      return ["btn-id", "btn-class", "btn-label", "split-class"];
    }
    constructor() {
      super();
      this._items = [];
      this.parts = Array.from(this.children);
      const compEl = this.querySelector(".wc-split-button");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-split-button");
        const splitClass = this.getAttribute("split-class");
        if (splitClass) {
          const splitClsParts = splitClass.split(" ");
          splitClsParts.forEach((p) => this.componentElement.classList.add(p));
        }
        this.appendChild(this.componentElement);
        this._createElement();
      }
      console.log("ctor:wc-split-button");
    }
    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
      console.log("connectedCallback:wc-split-button");
    }
    disconnectedCallback() {
      this._unWireEvents();
    }
    _createElement() {
      const id = this.getAttribute("id") || "";
      const label = this.getAttribute("label") || "";
      const positionArea = this.getAttribute("position-area") || "bottom span-right";
      const positionTryFallbacks = this.getAttribute("position-try-fallbacks") || "--bottom-right, --bottom-left, --top-right, --top-left, --right, --left";
      const markup = `
        <button id="${id}" type="button" class="btn">${label}</button>
        <div class="dropdown">
          <div class="dropdown-content text-sm">
          </div>
          <button type="button" class="btn" style="border-left:1px solid var(--component-border-color);">
            <svg class="h-3 w-3 pointer-events-none"
              xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"
              stroke="currentColor" fill="currentColor">
              <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L32 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z"/>
            </svg>
          </button>
        </div>
      `.trim();
      this.componentElement.innerHTML = markup;
      const btn = this.querySelector(".wc-split-button");
      btn.style.anchorName = `--${id}-anchor`;
      const drpContent = this.querySelector(".dropdown-content");
      drpContent.style.positionAnchor = `--${id}-anchor`;
      drpContent.style.positionArea = positionArea;
      drpContent.style.positionTryFallbacks = positionTryFallbacks;
      drpContent.style.minWidth = `calc(100% - 20px`;
      this.parts.forEach((part) => {
        drpContent.appendChild(part);
      });
      const mainBtn = this.querySelector(`button#${id}`);
      const onClick = this.getAttribute("onclick");
      if (onClick) {
        const onClickHandler = new Function(onClick);
        mainBtn.onclick = onClickHandler;
        this.removeAttribute("onclick");
      }
      this.removeAttribute("id");
      this.removeAttribute("label");
    }
    _handleAttributeChange(attrName, newValue) {
      super._handleAttributeChange(attrName, newValue);
    }
    _applyStyle() {
      const style = `
        wc-split-button {
          display: contents;
        }
        .wc-split-button {
          /* anchor-name: --anchor; */
          display: flex;
          flex-direction: row;
        }
        /* Dropdown Button */
        .wc-split-button .btn {
          border-right: none;
          outline: none;
          border-radius: 0;
        }

        /* The container <div> - needed to position the dropdown content */
        .wc-split-button .dropdown {
          /* display: inline-block; */
        }

        /* Dropdown Content (Hidden by Default) */
        .wc-split-button .dropdown-content {
          display: none;
          background-color: var(--button-bg-color);
          border: 1px solid var(--button-border-color);
          border-top: none;
          min-width: 160px;
          z-index: 1;

          position: absolute;
          position-try-fallbacks: --bottom-right, --bottom-left, --top-right, --top-left, --right, --left;
          /*
          position-anchor: --anchor;
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
        .wc-split-button .dropdown-content a {
          color: var(--button-color);
          padding: 12px 16px;
          text-decoration: none;
          display: block;
          cursor: pointer;
        }

        /* Change color of dropdown links on hover */
        .wc-split-button .dropdown-content a:hover {
          background-color: var(--button-hover-bg-color);
          color: var(--button-hover-color);
        }

        /* Show the dropdown menu on hover */
        .wc-split-button .dropdown:hover > .dropdown-content {
          display: block;
        }

        /* Change the background color of the dropdown button when the dropdown content is shown */
        /*
        .wc-split-button .btn:hover, .dropdown:hover .btn  {
          background-color: var(--primary-alt-bg-color);
        }
        */
        .wc-split-button .dropdown-content:hover ~ button {
          background-color: var(--button-hover-bg-color);
          color: var(--button-hover-color);
        }
      `.trim();
      this.loadStyle("wc-split-button-style", style);
    }
    _wireEvents() {
      super._wireEvents();
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-split-button", WcSplitButton);
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
      wc-sidebar {
        display: contents;
      }
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
        color: var(--text-5);
        display: block;
      }

      wc-sidebar .wc-sidebar a:hover {
        color: var(--text-1);
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
      wc-sidenav {
        display: contents;
      }
      wc-sidenav .wc-sidenav.sidenav {
        /* height: 100%; */
        width: 0;
        position: fixed;
        z-index: 2;
        top: 0;
        background-color: var(--button-bg-color);
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
        color: var(--button-color);
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
        color: var(--button-hover-color);
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
        background-color: var(--button-hover-bg-color);
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
      wc-slideshow-image {
        display: contents;
      }

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
      wc-slideshow {
        display: contents;
      }
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
    if (prev) {
      prev.removeEventListener("click", this._prevSlide.bind(this));
    }
    if (next) {
      next.removeEventListener("click", this._nextSlide.bind(this));
    }
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
    const parts = Array.from(this.children).filter((p) => !p.matches("wc-tab-item") && !p.matches(".wc-tab-item"));
    parts.forEach((part) => {
      this.componentElement.appendChild(part);
    });
  }
  _applyStyle() {
    const style = `
      wc-tab-item {
        display: contents;
      }
      .wc-tab-item {
        display: flex;
        flex-direction: column;
        flex: 1 1 0%;
        min-height: 0;
        min-width: 0;
        
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
    setTimeout(() => {
      const hashParts = location.hash.slice(1).split("+");
      hashParts.forEach((part) => {
        const btn = this.querySelector(`button[data-label="${decodeURI(part)}"]`);
        btn?.click();
      });
    }, 100);
    console.log("_render:wc-tab");
  }
  _createInnerElement() {
    const tabNav = document.createElement("div");
    tabNav.classList.add("tab-nav");
    const tabBody = document.createElement("div");
    tabBody.classList.add("tab-body");
    const parts = Array.from(this.children).filter((p) => !p.matches("wc-tab") && !p.matches(".wc-tab"));
    parts.forEach((p, idx) => {
      const tabItem = p.querySelector(".wc-tab-item");
      const btn = document.createElement("button");
      btn.type = "button";
      btn.classList.add("tab-link");
      btn.addEventListener("click", this._handleClick.bind(this));
      const hasActive = tabItem?.classList.contains("active");
      if (hasActive) {
        btn.classList.add("active");
      }
      btn.textContent = p.getAttribute("label") || `Label ${idx + 1}`;
      btn.dataset.label = p.getAttribute("label") || `Label ${idx + 1}`;
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
    event.stopPropagation();
    event.preventDefault();
    const { target } = event;
    const ce = target.closest(".wc-tab");
    let parts = ce.querySelectorAll(".active");
    parts.forEach((p) => {
      const parent = p.closest("wc-tab");
      if (parent == this) {
        p.classList.remove("active");
      }
    });
    target.classList.add("active");
    const label = target.textContent;
    const contents = this.querySelector(`.wc-tab-item[label='${label}']`);
    contents.classList.add("active");
    const payload = { detail: { label } };
    const custom = new CustomEvent("tabchange", payload);
    contents.dispatchEvent(custom);
    location.hash = this._buildActiveTabStringFromRoot(target);
  }
  _buildActiveTabStringFromRoot(startElement) {
    function findRootMostTab(element) {
      let current = element.closest("wc-tab");
      let root = current;
      while (current) {
        const parentTab = current.parentElement?.closest("wc-tab");
        if (!parentTab) {
          root = current;
          break;
        }
        current = parentTab;
      }
      return root;
    }
    function traverseTabs(tab) {
      let result = [];
      const tabNav = tab.querySelector(":scope > .wc-tab > .tab-nav");
      if (tabNav) {
        const activeButtons = Array.from(tabNav.querySelectorAll(":scope > button.active"));
        for (const button of activeButtons) {
          result.push(button.textContent.trim());
        }
      }
      const nestedTabs = Array.from(tab.querySelectorAll(":scope > .wc-tab > .tab-body > wc-tab-item > .wc-tab-item.active > wc-tab"));
      for (const nestedTab of nestedTabs) {
        result = result.concat(traverseTabs(nestedTab));
      }
      return result;
    }
    const rootTab = findRootMostTab(startElement);
    if (!rootTab) {
      return "";
    }
    const activeTabString = traverseTabs(rootTab).join("+");
    return activeTabString;
  }
  _applyStyle() {
    const style = `
      wc-tab {
        display: contents;
      }
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
      }
      wc-tab[vertical] .wc-tab .tab-nav {
        flex-direction: column;
        overflow: initial;
        border-right: none;
      }
      wc-tab .wc-tab .tab-nav .tab-link {
        background-color: transparent;
        border: none;
        border-bottom: 1px solid var(--card-bg-color);
        border-radius: 0;
        outline: none;
        cursor: pointer;
        padding: 10px 16px;
        user-select: none;
        transition: 0.3s;
      }
      wc-tab .wc-tab .tab-nav .tab-link.active,
      wc-tab .wc-tab .tab-nav .tab-link:hover {
        border-top-left-radius: .5rem;
        border-top-right-radius: .5rem;
        border-bottom: 1px solid var(--card-bg-color);
        background-color: var(--card-bg-color);
      }

      wc-tab .wc-tab .tab-body {
        display: flex;
        flex-direction: column;
        flex: 1 1 0%;
        min-height: 0;
        background-color: var(--card-bg-color);
      }
      wc-tab[vertical] .wc-tab .tab-body {
        border-top: 1px solid var(--card-border-color);
      }
      wc-tab .wc-tab .tab-body wc-tab-item .wc-tab-item {
        display: none;
      }
      wc-tab[animate] .wc-tab .tab-body wc-tab-item .wc-tab-item {
        animation: tab-fade 1s;
      }
      wc-tab .wc-tab .tab-body wc-tab-item .wc-tab-item.active {
        display: flex;
      }

      /* Add styling for nested tabs */
      wc-tab .wc-tab .tab-body wc-tab {
        margin-top: 1rem;
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

// src/js/components/wc-tabulator-column.js
if (!customElements.get("wc-tabulator-column")) {
  class WcTabulatorColumn extends HTMLElement {
    constructor() {
      super();
      this.classList.add("contents");
    }
    connectedCallback() {
    }
  }
  customElements.define("wc-tabulator-column", WcTabulatorColumn);
}

// src/js/components/wc-tabulator-func.js
if (!customElements.get("wc-tabulator-func")) {
  class WcTabulatorFunc extends HTMLElement {
    constructor() {
      super();
      this.classList.add("contents");
    }
    connectedCallback() {
    }
  }
  customElements.define("wc-tabulator-func", WcTabulatorFunc);
}

// src/js/components/wc-tabulator-row-menu.js
if (!customElements.get("wc-tabulator-row-menu")) {
  class WcTabulatorRowMenu extends HTMLElement {
    constructor() {
      super();
      this.classList.add("contents");
    }
    connectedCallback() {
    }
  }
  customElements.define("wc-tabulator-row-menu", WcTabulatorRowMenu);
}

// src/js/components/wc-tabulator.js
if (!customElements.get("wc-tabulator")) {
  class WcTabulator extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class"];
    }
    icons = {
      "eye": {
        "viewport": "0 0 640 512",
        "d": "M117.2 136C160.3 96 217.6 64 288 64s127.7 32 170.8 72c43.1 40 71.9 88 85.2 120c-13.3 32-42.1 80-85.2 120c-43.1 40-100.4 72-170.8 72s-127.7-32-170.8-72C74.1 336 45.3 288 32 256c13.3-32 42.1-80 85.2-120zM288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM192 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"
      },
      "eyeSlash": {
        "viewport": "0 0 640 512",
        "d": "M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zm151 118.3C226 97.7 269.5 80 320 80c65.2 0 118.8 29.6 159.9 67.7C518.4 183.5 545 226 558.6 256c-12.6 28-36.6 66.8-70.9 100.9l-53.8-42.2c9.1-17.6 14.2-37.5 14.2-58.7c0-70.7-57.3-128-128-128c-32.2 0-61.7 11.9-84.2 31.5l-46.1-36.1zM394.9 284.2l-81.5-63.9c4.2-8.5 6.6-18.2 6.6-28.3c0-5.5-.7-10.9-2-16c.7 0 1.3 0 2 0c44.2 0 80 35.8 80 80c0 9.9-1.8 19.4-5.1 28.2zm9.4 130.3C378.8 425.4 350.7 432 320 432c-65.2 0-118.8-29.6-159.9-67.7C121.6 328.5 95 286 81.4 256c8.3-18.4 21.5-41.5 39.4-64.8L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5l-41.9-33zM192 256c0 70.7 57.3 128 128 128c13.3 0 26.1-2 38.2-5.8L302 334c-23.5-5.4-43.1-21.2-53.7-42.3l-56.1-44.2c-.2 2.8-.3 5.6-.3 8.5z"
      },
      "square": {
        "viewport": "0 0 448 512",
        "d": "M384 80c8.8 0 16 7.2 16 16l0 320c0 8.8-7.2 16-16 16L64 432c-8.8 0-16-7.2-16-16L48 96c0-8.8 7.2-16 16-16l320 0zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z"
      },
      "squareCheck": {
        "viewport": "0 0 448 512",
        "d": "M64 80c-8.8 0-16 7.2-16 16l0 320c0 8.8 7.2 16 16 16l320 0c8.8 0 16-7.2 16-16l0-320c0-8.8-7.2-16-16-16L64 80zM0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
      },
      "remove": {
        "viewport": "0 0 448 512",
        "d": "M177.1 48l93.7 0c2.7 0 5.2 1.3 6.7 3.6l19 28.4-145 0 19-28.4c1.5-2.2 4-3.6 6.7-3.6zM354.2 80L317.5 24.9C307.1 9.4 289.6 0 270.9 0L177.1 0c-18.7 0-36.2 9.4-46.6 24.9L93.8 80 80.1 80 32 80l-8 0C10.7 80 0 90.7 0 104s10.7 24 24 24l11.6 0L59.6 452.7c2.5 33.4 30.3 59.3 63.8 59.3l201.1 0c33.5 0 61.3-25.9 63.8-59.3L412.4 128l11.6 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-8 0-48.1 0-13.7 0zm10.1 48L340.5 449.2c-.6 8.4-7.6 14.8-16 14.8l-201.1 0c-8.4 0-15.3-6.5-16-14.8L83.7 128l280.6 0z"
      },
      "clone": {
        "viewport": "0 0 512 512",
        "d": "M288 448L64 448l0-224 64 0 0-64-64 0c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l224 0c35.3 0 64-28.7 64-64l0-64-64 0 0 64zm-64-96l224 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L224 0c-35.3 0-64 28.7-64 64l0 224c0 35.3 28.7 64 64 64z"
      },
      "check": {
        "viewport": "0 0 448 512",
        "d": "M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
      },
      "checkDouble": {
        "viewport": "0 0 448 512",
        "d": "M337 81c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-143 143L97 127c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l80 80c9.4 9.4 24.6 9.4 33.9 0L337 81zM441 201c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-247 247L41 295c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9L143 465c9.4 9.4 24.6 9.4 33.9 0L441 201z"
      },
      "listCheck": {
        "viewport": "0 0 512 512",
        "d": "M156.3 58.2c5.7-6.8 4.7-16.9-2-22.5s-16.9-4.7-22.5 2L62.9 120.3 27.3 84.7c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6l48 48c3.2 3.2 7.5 4.9 12 4.7s8.7-2.3 11.6-5.7l80-96zm0 160c5.7-6.8 4.7-16.9-2-22.5s-16.9-4.7-22.5 2L62.9 280.3 27.3 244.7c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6l48 48c3.2 3.2 7.5 4.9 12 4.7s8.7-2.3 11.6-5.7l80-96zM192 96c0 8.8 7.2 16 16 16l288 0c8.8 0 16-7.2 16-16s-7.2-16-16-16L208 80c-8.8 0-16 7.2-16 16zm0 160c0 8.8 7.2 16 16 16l288 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-288 0c-8.8 0-16 7.2-16 16zM160 416c0 8.8 7.2 16 16 16l320 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-320 0c-8.8 0-16 7.2-16 16zm-64 0a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
      },
      "list": {
        "viewport": "0 0 512 512",
        "d": "M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM184 72c-13.3 0-24 10.7-24 24s10.7 24 24 24l304 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L184 72zm0 160c-13.3 0-24 10.7-24 24s10.7 24 24 24l304 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-304 0zm0 160c-13.3 0-24 10.7-24 24s10.7 24 24 24l304 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-304 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z"
      },
      "xmark": {
        "viewport": "0 0 384 512",
        "d": "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
      },
      "download": {
        "viewport": "0 0 512 512",
        "d": "M280 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 270.1-95-95c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9L239 369c9.4 9.4 24.6 9.4 33.9 0L409 233c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-95 95L280 24zM128.8 304L64 304c-35.3 0-64 28.7-64 64l0 80c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-80c0-35.3-28.7-64-64-64l-64.8 0-48 48L448 352c8.8 0 16 7.2 16 16l0 80c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-80c0-8.8 7.2-16 16-16l112.8 0-48-48zM432 408a24 24 0 1 0 -48 0 24 24 0 1 0 48 0z"
      }
    };
    funcs = {};
    rowMenus = [];
    rowMenu = [
      {
        label: this.createMenuLabel("Select All Rows", this.icons.listCheck),
        action: (e, row) => {
          const table = row.getTable();
          table.selectRow();
        }
      },
      {
        label: this.createMenuLabel("Un-Select Rows", this.icons.list),
        action: (e, row) => {
          const table = row.getTable();
          table.deselectRow();
        }
      },
      {
        label: this.createMenuLabel("Select Row", this.icons.check),
        action: (e, row) => {
          row.select();
        }
      },
      {
        label: this.createMenuLabel("Un-Select Row", this.icons.xmark),
        action: (e, row) => {
          row.deselect();
        }
      },
      {
        separator: true
      },
      {
        label: this.createMenuLabel("Delete Row", this.icons.remove),
        action: (e, row) => {
          console.log("Deleting row...");
          wc.Prompt.question({
            title: "Are you sure?",
            text: "This record will be deleted. Are you sure?",
            callback: (result) => {
              if (this.funcs["onDelete"]) {
                this.funcs["onDelete"](row, result);
              }
            }
          });
        }
      },
      {
        label: this.createMenuLabel("Clone Row", this.icons.clone),
        action: (e, row) => {
          const promptPayload = {
            title: "Clone Record(s)",
            icon: "info",
            focusConfirm: false,
            template: "template#clone-template",
            didOpen: () => {
              const cnt = document.querySelector(".swal2-container");
              if (cnt) {
                htmx.process(cnt);
                _hyperscript.processNode(cnt);
              }
            },
            // preConfirm: () => {
            //   if (this.funcs['onClonePreConfirm']) {
            //     const payload = this.funcs['onClonePreConfirm'](row);
            //     return payload;
            //   } else {
            //     // Fallback, to reduce redundancies.
            //     const payload = {
            //       "srcConnName": document.getElementById("srcConnName").value,
            //       "srcDbName": document.getElementById("srcDbName").value,
            //       "srcCollName": document.getElementById("srcCollName").value,
            //       "tgtConnName": document.getElementById("tgtConnName").value,
            //       "tgtDbNames": [...new Set(Array.from(document.getElementById("tgtDbNames").selectedOptions).map(m => m.value))],
            //       "tgtCollName": document.getElementById("tgtCollName").value,
            //       "recordIds": recordIds
            //     }
            //     return payload;
            //   }
            // },
            callback: (result) => {
              if (this.funcs["onClone"]) {
                this.funcs["onClone"](row, result);
              }
            }
          };
          wc.Prompt.fire(promptPayload);
        }
      },
      {
        separator: true
      },
      {
        label: this.createMenuLabel("Download Table", this.icons.download),
        action: (e, row) => {
          console.log("Download row...");
          wc.Prompt.notify({
            icon: "info",
            title: "Download Format?",
            text: "Please select the format:",
            input: "select",
            inputPlaceholder: "Select a format",
            inputOptions: { csv: "CSV", json: "JSON", html: "HTML", pdf: "PDF", xlsx: "XLSX" },
            callback: (result) => {
              const table = row.getTable();
              switch (result) {
                case "csv":
                  table.download("csv", "data.csv");
                  break;
                case "json":
                  table.download("json", "data.json");
                  break;
                case "html":
                  table.download("html", "data.html");
                  break;
                case "pdf":
                  table.download("pdf", "data.pdf");
                  break;
                case "xlsx":
                  table.download("xlsx", "data.xlsx", {});
                  break;
              }
              wc.Prompt.toast({ title: "Download in progress...", type: "success" });
            }
          });
        }
      }
    ];
    constructor() {
      super();
      this.table = null;
      this._internals = this.attachInternals();
      const compEl = this.querySelector(".wc-tabulator");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-tabulator");
        this.componentElement.id = this.getAttribute("id") || "wc-tabulator";
        this.appendChild(this.componentElement);
      }
      console.log("ctor:wc-tabulator");
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      console.log("conntectedCallback:wc-tabulator");
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }
    async _handleAttributeChange(attrName, newValue) {
      super._handleAttributeChange(attrName, newValue);
    }
    _render() {
      super._render();
      const innerEl = this.querySelector(".wc-tabulator > *");
      if (innerEl) {
      } else {
        this.componentElement.innerHTML = "";
        this._createInnerElement();
      }
      console.log("_render:wc-tabulator");
    }
    async _createInnerElement() {
      const pagination = this.hasAttribute("pagination");
      const paginationSize = this.getAttribute("pagination-size");
      const paginationCounter = this.getAttribute("pagination-counter");
      const movableColumns = this.getAttribute("movable-columns");
      const resizableColumns = this.getAttribute("resizable-columns");
      const resizableColumnGuide = this.getAttribute("resizable-column-guide");
      const movableRows = this.getAttribute("movable-rows");
      const rowHeader = this.getAttribute("row-header");
      const rowHeight = this.getAttribute("row-height");
      const rowFormatter = this.getAttribute("row-formatter");
      const resizableRows = this.getAttribute("resizable-rows");
      const resizableRowGuide = this.getAttribute("resizable-row-guide");
      const frozenRows = this.getAttribute("frozen-rows");
      const persistence = this.getAttribute("persistence");
      const headerVisible = this.getAttribute("header-visible");
      const rowContextMenu = this.getAttribute("row-context-menu");
      const placeholder = this.getAttribute("placeholder");
      const selectableRows = this.getAttribute("selectable-rows");
      const colFieldFormatter = this.getAttribute("col-field-formatter") || "{}";
      const responsiveLayout = this.getAttribute("responsive-layout");
      const groupBy = this.getAttribute("group-by");
      const initialFilter = this.getAttribute("initial-filter");
      const initialSort = this.getAttribute("initial-sort");
      const rowClick = this.getAttribute("row-click");
      const rowSelected = this.getAttribute("row-selected");
      const rowDeselected = this.getAttribute("row-deselected");
      if (colFieldFormatter) {
        let obj = JSON.parse(colFieldFormatter);
        if (obj && obj.params && obj.params.url) {
          obj.params.url = this.resolveFormatter(obj.params, obj.params.url);
        }
        if (obj && obj.formatter && obj.params) {
          obj.formatter = this.resolveFormatter(obj.params, obj.formatter);
        }
        this.colFieldFormatter = obj;
      }
      this.getFuncs();
      this.getRowMenu();
      const options = {
        columns: this.getColumnsConfig(),
        layout: this.getAttribute("layout") || "fitData",
        filterMode: "remote",
        sortMode: "remote",
        ajaxURL: this.getAttribute("ajax-url") || "",
        // URL for server-side loading
        ajaxURLGenerator: this.getAjaxURLGenerator.bind(this),
        ajaxConfig: this.getAjaxConfig(),
        ajaxResponse: this.handleAjaxResponse.bind(this)
        // Optional custom handling of server response
      };
      if (pagination) options.pagination = pagination;
      if (options.pagination) {
        options.paginationMode = "remote";
        if (paginationSize) {
          options.paginationSize = parseInt(paginationSize) || 10;
        } else {
          options.paginationSize = 10;
        }
      }
      if (paginationCounter) options.paginationCounter = paginationCounter;
      if (movableColumns) options.movableColumns = movableColumns.toLowerCase() == "true" ? true : false;
      if (resizableColumns) options.resizableColumns = resizableColumns.toLowerCase() == "true" ? true : false;
      if (resizableColumnGuide) options.resizableColumnGuide = resizableColumnGuide.toLowerCase() == "true" ? true : false;
      if (movableRows) options.movableRows = movableRows.toLowerCase() == "true" ? true : false;
      if (rowHeader) {
        const rowHeaderObj = JSON.parse(rowHeader);
        if (rowHeaderObj.cellClick) {
          rowHeaderObj.cellClick = this.resolveFunc(rowHeaderObj.cellClick);
          options.rowHeader = rowHeaderObj;
        }
      }
      if (rowFormatter) options.rowFormatter = this.resolveRowFormatter(rowFormatter);
      if (rowHeight) options.rowHeight = parseInt(rowHeight);
      if (resizableRows) options.resizableRows = resizableRows.toLowerCase() == "true" ? true : false;
      if (resizableRowGuide) options.resizableRowGuide = resizableRowGuide.toLowerCase() == "true" ? true : false;
      if (frozenRows) options.frozenRows = parseInt(frozenRows);
      if (persistence) options.persistence = persistence.toLowerCase() == "true" ? true : false;
      if (options.persistence) options.persistenceID = container.id;
      if (headerVisible) options.headerVisible = headerVisible.toLowerCase() == "true" ? true : false;
      if (rowContextMenu) {
        if (rowContextMenu == "rowContextMenu") {
          options.rowContextMenu = this.rowMenu;
        }
      }
      if (placeholder) options.placeholder = placeholder;
      if (selectableRows) {
        if (!isNaN(parseInt(selectableRows))) {
          options.selectableRows = parseInt(selectableRows);
        } else {
          options.selectableRows = selectableRows.toLowerCase() == "true" ? true : false;
        }
      }
      if (groupBy) options.groupBy = groupBy;
      if (responsiveLayout) options.responsiveLayout = responsiveLayout;
      if (initialFilter) {
        options.initialFilter = JSON.parse(initialFilter);
        this.initialFilter = options.initialFilter;
      }
      if (initialSort) {
        options.initialSort = JSON.parse(initialSort);
        this.initialSort = options.initialSort;
      }
      if (rowClick) {
        this.rowClick = this.resolveFunc(rowClick);
      }
      if (rowSelected) {
        this.rowSelected = this.resolveFunc(rowSelected);
      }
      if (rowDeselected) {
        this.rowDeselected = this.resolveFunc(rowDeselected);
      }
      await this.renderTabulator(options);
    }
    async renderTabulator(options) {
      await Promise.all([
        this.loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
        this.loadScript("https://unpkg.com/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.js"),
        this.loadScript("https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"),
        this.loadScript("https://cdn.jsdelivr.net/npm/luxon@2.3.1/build/global/luxon.min.js"),
        this.loadCSS("https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css"),
        this.loadLibrary("https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js", "Tabulator")
      ]);
      this.table = new Tabulator(this.componentElement, options);
      this.table.on("tableBuilt", async () => {
        console.log("wc-tabulator:tableBuilt - broadcasting wc-tabulator:ready");
        if ("onInit" in this.funcs) {
          this.funcs["onInit"](this.table);
        }
        wc.EventHub.broadcast("wc-tabulator:ready", [], "");
        wc.EventHub.broadcast("wc-tabulator-ready", [], "");
        if (typeof htmx !== "undefined") {
          await sleep(1e3);
          htmx.process(this);
        }
      });
      if ("onCellEdited" in this.funcs) {
        this.table.on("cellEdited", this.funcs["onCellEdited"].bind(this));
      }
      if ("onCellDblClick" in this.funcs) {
        this.table.on("cellDblClick", this.funcs["onCellDblClick"].bind(this));
      }
      if (this.rowClick) {
        this.table.on("rowClick", this.rowClick.bind(this));
      }
      if (this.rowSelected) {
        this.table.on("rowSelected", this.rowSelected.bind(this));
      }
      if (this.rowDeselected) {
        this.table.on("rowDeselected", this.rowDeselected.bind(this));
      }
      this.table.on("pageLoaded", (pageno) => {
        if (typeof htmx !== "undefined") {
          setTimeout(() => {
            htmx.process(this);
          }, 10);
        }
      });
      let isInternalFilterChange = false;
      this.table.on("dataFiltering", (filters) => {
        console.log("dataFiltering", filters);
      });
    }
    getFuncs() {
      const funcElements = this.querySelectorAll("wc-tabulator-func");
      funcElements.forEach((el) => {
        const name = el.getAttribute("name");
        const func = el.textContent;
        const value = new Function(`return (${func})`)();
        this.funcs[name] = value;
        el.innerHTML = "";
      });
    }
    getRowMenu() {
      const rowMenuElements = this.querySelectorAll("wc-tabulator-row-menu");
      rowMenuElements.forEach((el) => {
        const order = el.getAttribute("order");
        const isSeparator = el.hasAttribute("separator");
        let mnu = {};
        if (isSeparator) {
          mnu = {
            separator: true,
            order
          };
        } else {
          const label = el.getAttribute("label");
          const icon = el.getAttribute("icon");
          const func = el.textContent;
          const value = new Function(`return (${func})`)();
          mnu = {
            label: this.createMenuLabel(label, this.icons[icon]),
            action: value,
            order
          };
        }
        el.innerHTML = "";
        this.rowMenus.push(mnu);
      });
      this.rowMenus.forEach((menu) => {
        if (menu.order !== null && !isNaN(menu.order) && menu.order >= 0) {
          this.rowMenu.splice(menu.order, 0, menu);
        } else {
          this.rowMenu.push(menu);
        }
      });
    }
    getColumnsConfig() {
      const columns = [];
      const columnElements = this.querySelectorAll("wc-tabulator-column");
      columnElements.forEach((col) => {
        const field = col.getAttribute("field");
        const title = col.getAttribute("title") || field;
        const width = col.getAttribute("width");
        const widthGrow = col.getAttribute("width-grow");
        const widthShrink = col.getAttribute("width-shrink");
        const minWidth = col.getAttribute("min-width");
        const maxWidth = col.getAttribute("max-width");
        const maxInitialWidth = col.getAttribute("max-initial-width");
        const resizable = col.getAttribute("resizable");
        const editable = col.getAttribute("editable");
        const frozen = col.getAttribute("frozen");
        const responsive = col.getAttribute("responsive");
        const tooltip = col.getAttribute("tooltip");
        const cssClass = col.getAttribute("css-class");
        const rowHandle = col.getAttribute("row-handle");
        const htmlOutput = col.getAttribute("html-output");
        const print = col.getAttribute("print");
        const clipboard = col.getAttribute("clipboard");
        const titleFormatter = col.getAttribute("title-formatter");
        const formatter = col.getAttribute("formatter");
        const formatterParams = col.getAttribute("formatter-params");
        const hozAlign = col.getAttribute("hoz-align");
        const vertAlign = col.getAttribute("vert-align") || "middle";
        const headerHozAlign = col.getAttribute("header-hoz-align");
        const visible = col.getAttribute("visible");
        const headerSort = col.getAttribute("header-sort");
        const headerSortStartingDir = col.getAttribute("header-sort-starting-dir");
        const headerSortTristate = col.getAttribute("header-sort-tristate");
        const sorter = col.getAttribute("sorter");
        const sorterParams = col.getAttribute("sorter-params");
        const headerFilter = col.getAttribute("header-filter");
        const headerFilterParams = col.getAttribute("header-filter-params");
        const headerFilterPlaceholder = col.getAttribute("header-filter-placeholder");
        const headerFilterFunc = col.getAttribute("header-filter-func");
        const headerMenu = col.getAttribute("header-menu");
        const editor = col.getAttribute("editor");
        const editorParams = col.getAttribute("editor-params");
        const cellClick = col.getAttribute("cell-click");
        const bottomCalc = col.getAttribute("bottom-calc");
        const bottomCalcParams = col.getAttribute("bottom-calc-params");
        const topCalc = col.getAttribute("top-calc");
        const topCalcParams = col.getAttribute("top-calc-params");
        const column = { field, title };
        if (width) column.width = width;
        if (widthGrow) column.widthGrow = parseInt(widthGrow);
        if (widthShrink) column.widthShrink = parseInt(widthShrink);
        if (minWidth) column.minWidth = minWidth;
        if (maxWidth) column.maxWidth = maxWidth;
        if (maxInitialWidth) column.maxInitialWidth = maxInitialWidth;
        if (resizable) column.resizable = resizable.toLowerCase() == "true" ? true : false;
        if (editable) column.editable = editable.toLowerCase() == "true" ? true : false;
        if (editable) {
          if (editable.toLowerCase() == "true" || editable.toLowerCase() == "false") {
            column.editable = editable.toLowerCase() == "true" ? true : false;
          } else {
            column.editable = this.resolveFunc(editable);
          }
        }
        if (frozen) column.frozen = frozen.toLowerCase() == "true" ? true : false;
        if (responsive) column.responsive = parseInt(responsive);
        if (tooltip) column.tooltip = tooltip;
        if (cssClass) column.cssClass = cssClass;
        if (rowHandle) column.rowHandle = rowHandle.toLowerCase() == "true" ? true : false;
        if (htmlOutput) column.htmlOutput = htmlOutput;
        if (print) column.print = print.toLowerCase() == "true" ? true : false;
        if (clipboard) column.clipboard = clipboard.toLowerCase() == "true" ? true : false;
        if (headerSort) column.headerSort = headerSort.toLowerCase() == "true" ? true : false;
        if (headerSortStartingDir) column.headerSortStartingDir = headerSortStartingDir;
        if (headerSortTristate) column.headerSortTristate = headerSortTristate.toLowerCase() == "true" ? true : false;
        if (headerFilter) column.headerFilter = headerFilter;
        if (headerFilterParams) column.headerFilterParams = JSON.parse(headerFilterParams);
        if (headerFilterPlaceholder) column.headerFilterPlaceholder = headerFilterPlaceholder;
        if (headerFilterFunc) column.headerFilterFunc = headerFilterFunc;
        if (headerMenu) {
          if (headerMenu == "headerMenu") {
            column.headerMenu = this.headerMenu.bind(this);
          }
        }
        if (editor) {
          if (editor == "dateEditor") {
            column.editor = this.dateEditor.bind(this);
          } else {
            column.editor = editor;
          }
        }
        if (editorParams) column.editorParams = JSON.parse(editorParams);
        if (cellClick) {
          column.cellClick = this.resolveFunc(cellClick);
        }
        if (titleFormatter) column.titleFormatter = titleFormatter;
        if (formatter) {
          column.formatter = this.resolveCellFormatter(formatter);
        } else {
          if (field && this.colFieldFormatter?.cols?.includes(field)) {
            column.formatter = this.colFieldFormatter.formatter;
          }
        }
        if (formatterParams) {
          const fp = JSON.parse(formatterParams);
          if (fp && fp.url) {
            fp.url = this.resolveFormatter(fp, fp.url);
            column.formatterParams = fp;
          } else {
            column.formatterParams = fp;
          }
        } else {
          if (field && this.colFieldFormatter?.cols?.includes(field)) {
            column.formatterParams = this.colFieldFormatter.params;
          }
        }
        if (hozAlign) column.hozAlign = hozAlign;
        if (vertAlign) column.vertAlign = vertAlign;
        if (headerHozAlign) column.headerHozAlign = headerHozAlign;
        if (visible) column.visible = visible.toLowerCase() == "true" ? true : false;
        if (sorter) column.sorter = sorter;
        if (sorterParams) column.sorterParams = JSON.parse(sorterParams);
        if (bottomCalc) column.bottomCalc = bottomCalc;
        if (bottomCalcParams) column.bottomCalcParams = JSON.parse(bottomCalcParams);
        if (topCalc) column.topCalc = topCalc;
        if (topCalcParams) column.topCalcParams = JSON.parse(topCalcParams);
        columns.push(column);
      });
      return columns;
    }
    resolveRowFormatter(formatter) {
      try {
        if (formatter) {
          if (formatter.startsWith("function")) {
            const val = new Function("row", `return (${formatter})(row);`);
            return val;
          } else if (this[formatter]) {
            return this[formatter].bind(this);
          } else if (window[formatter]) {
            return window[formatter];
          } else {
            return formatter;
          }
        }
      } catch (error) {
        console.error(`Error resolving row formatter: ${error.message}`);
        return null;
      }
    }
    resolveFunc(func) {
      try {
        if (func.startsWith("function")) {
          return new Function(`return (${func})`)();
        } else if (func.includes("=>")) {
          return new Function(`return (${func})`)();
        } else if (this[func]) {
          return this[func];
        } else if (window[func]) {
          return window[func];
        } else {
          console.warn(`Func "${func}" not found.`);
          return null;
        }
      } catch (error) {
        console.error(`Error resolving func: ${error.message}`);
        return null;
      }
    }
    resolveFormatter(params, formatter) {
      try {
        if (formatter.startsWith("function")) {
          return new Function(`return (${formatter})`)(params);
        } else if (this[formatter]) {
          return this[formatter].bind(this);
        } else if (window[formatter]) {
          return window[formatter];
        } else {
          console.warn(`Formatter "${formatter}" not found.`);
          return null;
        }
      } catch (error) {
        console.error(`Error resolving formatter: ${error.message}`);
        return null;
      }
    }
    pageRowNum = function(cell, formatterParams, onRendered) {
      var row = cell.getRow();
      var table = cell.getTable();
      var page = table.getPage() || 1;
      var pageSize = table.getPageSize();
      var index = row.getPosition(true);
      return (page - 1) * pageSize + index;
    };
    resolveCellFormatter(formatter) {
      try {
        if (formatter) {
          if (formatter.startsWith("function")) {
            const val = new Function("cell", `return (${formatter})(cell);`);
            return val;
          } else if (this[formatter]) {
            return this[formatter].bind(this);
          } else if (window[formatter]) {
            return window[formatter];
          } else {
            return formatter;
          }
        }
      } catch (error) {
        console.error(`Error resolving formatter: ${error.message}`);
        return null;
      }
    }
    urlFormatter(cell, formatterParams, onRendered) {
      const routePrefix = cell.getColumn().getDefinition().formatterParams.routePrefix || "screen";
      const screen = cell.getColumn().getDefinition().formatterParams.screen;
      const screen_id = cell.getColumn().getDefinition().formatterParams.screen_id;
      const id_name = cell.getColumn().getDefinition().formatterParams.id_name;
      const data = cell.getData();
      const id = data._id;
      let url = "";
      if (screen) {
        url = `/${routePrefix}/${screen}/${id}`;
      } else {
        url = `/${routePrefix}/${screen_id}?${id_name}=${id}`;
      }
      return url;
    }
    // Create an extended link formatter
    linkFormatter(cell, formatterParams, onRendered) {
      var value = cell.getValue();
      var linkElement = document.createElement("a");
      const routePrefix = cell.getColumn().getDefinition().formatterParams.routePrefix || "screen";
      const screen = cell.getColumn().getDefinition().formatterParams.screen;
      const screen_id = cell.getColumn().getDefinition().formatterParams.screen_id;
      const id_name = cell.getColumn().getDefinition().formatterParams.id_name;
      const data = cell.getData();
      const id = data._id;
      let url = "";
      if (screen) {
        url = `/${routePrefix}/${screen}/${id}`;
      } else {
        url = `/${routePrefix}/${screen_id}?${id_name}=${id}`;
      }
      linkElement.setAttribute("href", url);
      if (formatterParams.target) {
        linkElement.setAttribute("target", formatterParams.target);
      }
      linkElement.innerText = formatterParams.labelField ? cell.getData()[formatterParams.labelField] : value;
      if (formatterParams.attributes && typeof formatterParams.attributes === "object") {
        Object.entries(formatterParams.attributes).forEach(([key, value2]) => {
          linkElement.setAttribute(key, value2);
        });
      }
      return linkElement;
    }
    toggleSelect(e, cell) {
      cell.getRow().toggleSelect();
    }
    headerMenu() {
      var menu = [];
      var columns = this.table.getColumns();
      let hideLabel = this.createMenuLabel("Hide Filter", this.icons.eyeSlash);
      menu.push({
        label: hideLabel,
        action: async (e) => {
          let promises = [];
          let cols = this.table.getColumns();
          e.stopPropagation();
          for (let col of cols) {
            await col.updateDefinition({ headerFilter: false });
          }
        }
      });
      let showLabel = this.createMenuLabel("Show Filter", this.icons.eye);
      menu.push({
        label: showLabel,
        action: (e) => {
          let cols = this.getColumnsConfig();
          e.stopPropagation();
          this.table.setColumns(cols);
        }
      });
      menu.push({
        separator: true
      });
      for (let column of columns) {
        let icon = this.createHeaderMenuIcon(column, this.icons.square, this.icons.squareCheck);
        let label = document.createElement("span");
        label.classList.add("flex");
        label.classList.add("flex-row");
        label.classList.add("gap-2");
        let title = document.createElement("span");
        title.textContent = " " + column.getDefinition().title;
        title.textContent = title.textContent.replace("null", "").replace("undefined", "");
        title.classList.add("pointer-events-none");
        label.appendChild(icon);
        label.appendChild(title);
        menu.push({
          label,
          action: (e) => {
            const { target } = e;
            e.stopPropagation();
            column.toggle();
            const path = target.querySelector("path");
            path.setAttribute(
              "d",
              column.isVisible() ? this.icons.squareCheck.d : this.icons.square.d
            );
            path.classList.add("pointer-events-none");
            this.table.redraw();
          }
        });
      }
      return menu;
    }
    createHeaderMenuIcon(column) {
      let icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
      icon.setAttribute("fill", "currentColor");
      icon.classList.add("h-4");
      icon.classList.add("w-4");
      icon.classList.add("align-text-top");
      icon.classList.add("pointer-events-none");
      icon.setAttribute("viewBox", this.icons.square.viewport);
      let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute(
        "d",
        column.isVisible() ? this.icons.squareCheck.d : this.icons.square.d
      );
      path.classList.add("pointer-events-none");
      icon.appendChild(path);
      return icon;
    }
    createMenuLabel(titleContent, icn) {
      let icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
      icon.setAttribute("fill", "currentColor");
      icon.classList.add("h-4");
      icon.classList.add("w-4");
      icon.classList.add("align-text-top");
      icon.classList.add("pointer-events-none");
      icon.setAttribute("viewBox", icn.viewport);
      let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", icn.d);
      path.classList.add("pointer-events-none");
      icon.appendChild(path);
      let label = document.createElement("span");
      label.classList.add("flex");
      label.classList.add("flex-row");
      label.classList.add("gap-2");
      let title = document.createElement("span");
      title.textContent = " " + titleContent;
      title.classList.add("pointer-events-none");
      label.appendChild(icon);
      label.appendChild(title);
      return label;
    }
    localdatetime(cell, formatterParams, onRendered) {
      const { format } = formatterParams;
      let value = cell.getValue();
      if (!value) return "";
      let dtFormat = luxon.DateTime.DATETIME_MED;
      switch (format) {
        case "DATE_SHORT":
          dtFormat = luxon.DateTime.DATE_SHORT;
          break;
        case "DATE_MED":
          dtFormat = luxon.DateTime.DATE_MED;
          break;
        case "DATE_MED_WITH_WEEKDAY":
          dtFormat = luxon.DateTime.DATE_MED_WITH_WEEKDAY;
          break;
        case "DATE_FULL":
          dtFormat = luxon.DateTime.DATE_FULL;
          break;
        case "DATE_HUGE":
          dtFormat = luxon.DateTime.DATE_HUGE;
          break;
        case "DATETIME_SHORT":
          dtFormat = luxon.DateTime.DATETIME_SHORT;
          break;
        case "DATETIME_STANDARD":
          dtFormat = {
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          };
          break;
        case "DATETIME_SHORT_WITH_SECONDS":
          dtFormat = luxon.DateTime.DATETIME_SHORT_WITH_SECONDS;
          break;
        case "DATETIME_MED":
          dtFormat = luxon.DateTime.DATETIME_MED;
          break;
        case "DATETIME_MED_WITH_SECONDS":
          dtFormat = luxon.DateTime.DATETIME_MED_WITH_SECONDS;
          break;
        case "DATETIME_MED_WITH_WEEKDAY":
          dtFormat = luxon.DateTime.DATETIME_MED_WITH_WEEKDAY;
          break;
        case "DATETIME_FULL":
          dtFormat = luxon.DateTime.DATETIME_FULL;
          break;
        case "DATETIME_FULL_WITH_SECONDS":
          dtFormat = luxon.DateTime.DATETIME_FULL_WITH_SECONDS;
          break;
        case "DATETIME_HUGE":
          dtFormat = luxon.DateTime.DATETIME_HUGE;
          break;
        case "DATETIME_HUGE_WITH_SECONDS":
          dtFormat = luxon.DateTime.DATETIME_HUGE_WITH_SECONDS;
          break;
      }
      let date = new Date(value);
      if (isNaN(date)) return "(Invalid Date)";
      let formattedDate = luxon.DateTime.fromISO(value, { zone: "utc" }).setZone("America/New_York").toLocaleString(dtFormat);
      return formattedDate;
    }
    linklocaldatetime(cell, formatterParams, onRendered) {
      const url = this.urlFormatter(cell, formatterParams, onRendered);
      const formattedDate = this.localdatetime(cell, formatterParams, onRendered);
      return `<a href="${url}">${formattedDate}</a>`;
    }
    dateEditor(cell, onRendered, success, cancel) {
      var cellValue = luxon.DateTime.fromFormat(cell.getValue(), "dd/MM/yyyy").toFormat("yyyy-MM-dd");
      input = document.createElement("input");
      input.setAttribute("type", "date");
      input.style.padding = "4px";
      input.style.width = "100%";
      input.style.boxSizing = "border-box";
      input.value = cellValue;
      onRendered(function() {
        input.focus();
        input.style.height = "100%";
      });
      function onChange() {
        if (input.value != cellValue) {
          success(luxon.DateTime.fromFormat(input.value, "yyyy-MM-dd").toFormat("dd/MM/yyyy"));
        } else {
          cancel();
        }
      }
      input.addEventListener("blur", onChange);
      input.addEventListener("keydown", function(e) {
        if (e.keyCode == 13) {
          onChange();
        }
        if (e.keyCode == 27) {
          cancel();
        }
      });
      return input;
    }
    getAjaxConfig() {
      return {
        method: "GET",
        // Default to GET, can be overridden
        headers: {
          "Content-Type": "application/json"
        }
      };
    }
    getAjaxURLGenerator(url, config, params) {
      let ajaxParamsParts = [];
      const ajaxParamsMap = JSON.parse(this.getAttribute("ajax-params-map") || "{}");
      for (const [key, value] of Object.entries(ajaxParamsMap)) {
        ajaxParamsParts.push(`${value}=${params[key]}`);
      }
      if (ajaxParamsParts.length === 0) {
        const { page, size } = params;
        if (page && size) {
          ajaxParamsParts.push(`page=${page}`);
          ajaxParamsParts.push(`size=${size}`);
        } else {
          const recordSize = this.getAttribute("record-size");
          if (recordSize) {
            ajaxParamsParts.push(`size=${recordSize}`);
          }
        }
      }
      const ajaxParams = JSON.parse(this.getAttribute("ajax-params") || "{}");
      for (const [key, value] of Object.entries(ajaxParams)) {
        ajaxParamsParts.push(`${key}=${value}`);
      }
      const { filter } = params;
      if (filter && filter.length > 0) {
        const effectiveFilter = this.dedupeByField(filter);
        ajaxParamsParts.push(`filter=${JSON.stringify(effectiveFilter)}`);
      }
      const { sort } = params;
      if (sort && sort.length > 0) {
        ajaxParamsParts.push(`sort=${JSON.stringify(sort)}`);
      }
      const ajaxParamsStr = ajaxParamsParts.join("&");
      if (url.includes("?")) {
        return url + `&${ajaxParamsStr}`;
      } else {
        return url + `?${ajaxParamsStr}`;
      }
    }
    /**
     * If you have multiple filters on the same `field`, keep only the first one.
     * Earlier filters always trump later ones.
     *
     * @param {Array<Object>} filters
     * @returns {Array<Object>} a new array with no duplicate‐field filters
     */
    dedupeByField(filters) {
      const seen = /* @__PURE__ */ new Set();
      return filters.filter((f) => {
        if (seen.has(f.field)) {
          return false;
        }
        seen.add(f.field);
        return true;
      });
    }
    handleAjaxResponse(url, params, response) {
      const { results } = response;
      if (this.hasAttribute("pagination")) {
        const { data, last_page, last_row } = response;
        if (data == null && last_page === 0) {
          return { last_page: 0, last_row: 0, data: [] };
        } else if (data && last_page && last_row) {
          return { last_page, last_row, data };
        } else {
          return { last_page: 10, data: results };
        }
      } else {
        return results;
      }
    }
    _applyStyle() {
      const style = `
  /* Tabulator */
  wc-tabulator {
    display: contents;
  }
  .wc-tabulator.tabulator {
    background-color: var(--card-bg-color);
    border: 1px solid var(--card-border-color);
  }
  .wc-tabulator.tabulator.rounded {
    border-radius: 10px;
  }

  /* Table Header */
  .wc-tabulator.tabulator .tabulator-header {
    border-bottom: none;
  }
  .wc-tabulator.tabulator .tabulator-header,
  .wc-tabulator.tabulator .tabulator-header .tabulator-col {
    color: var(--card-color);
    background-color: var(--card-border-color);
  }
  .wc-tabulator.tabulator .tabulator-header .tabulator-col:not(:last-of-type) {
    border-right: 1px solid var(--text-3);
  }
  .wc-tabulator.tabulator .tabulator-header .tabulator-col:last-of-type {
    border-right: 1px solid transparent;
  }
  /*Allow column header names to wrap lines*/
  .wc-tabulator.tabulator .tabulator-header .tabulator-col,
  .wc-tabulator.tabulator .tabulator-header .tabulator-col-row-handle {
    white-space: normal;
  }
  .wc-tabulator.tabulator .tabulator-header input,
  .wc-tabulator.tabulator .tabulator-row .tabulator-cell input {
    accent-color: var(--accent-color);
  }
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-headers .tabulator-col:hover {
    background-color: var(--primary-bg-color);
    color: var(--surface-1);
  }
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-headers .tabulator-col:hover input {
    color: var(--component-color);
  }

  /* Table Rows */
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-row-header.tabulator-row-handle,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd {
    color: var(--text-1);
    background-color: var(--card-bg-color);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-row-header.tabulator-row-handle,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even {
    color: var(--text-1);
    background-color: var(--surface-5);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-row-header.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-row-header.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar {
    background: var(--text-1);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row .tabulator-cell.tabulator-row-header.tabulator-row-handle {
      border-bottom: none;
  }
  .wc-tabulator .tabulator-row .tabulator-cell a {
    color: var(--text-1);
    text-decoration: underline;
    text-decoration-color: var(--text-1);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd.tabulator-selected,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even.tabulator-selected {
    background-color: var(--primary-bg-color);
    color: var(--surface-1);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd:hover:not(.tabulator-selected),
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even:hover:not(.tabulator-selected) 
  {
    background-color: var(--primary-bg-color);
    color: var(--surface-1);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd:hover:not(.tabulator-selected) a,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even:hover:not(.tabulator-selected) a 
  {
    color: var(--surface-1);
    text-decoration-color: var(--surface-1);
  }
  .wc-tabulator.tabulator.tabulator-block-select .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-placeholder {
    background-color: var(--secondary-bg-color);
  }
  .wc-tabulator .tabulator-row .tabulator-cell {
    border-right: 1px solid var(--text-3);
  }
  .wc-tabulator .tabulator-row .tabulator-cell:last-child {
    border-right: 1px solid transparent;
  }
  /*
  .wc-tabulator .tabulator-tableholder .tabulator-row .tabulator-cell {
    border-right: 1px solid var(--text-3);
  }
  */
  .wc-tabulator .tabulator-tableholder .tabulator-row .tabulator-cell:last-of-type {
    border-right: 1px solid transparent;
  }    

  /* Table Footer */
  .wc-tabulator.tabulator .tabulator-footer {
    border-top: none;
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-footer-contents {
    color: var(--card-color);
    background-color: var(--card-border-color);
    border-top: 1px solid var(--text-3);
    border-top: 1px solid transparent;
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-footer-contents .tabulator-page {
    color: var(--card-color);
    background-color: var(--card-border-color);
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-footer-contents .tabulator-page.active {
    color: var(--card-color);
    background-color: var(--card-border-color);
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-footer-contents .tabulator-page[disabled] {
    pointer-events: none;
  }

  /* Table Groups */
  .wc-tabulator.tabulator .tabulator-row.tabulator-group > span {
    color: var(--card-color);  
  }

  /* Table Calcs */
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder,
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder .tabulator-row.tabulator-calcs,
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder .tabulator-row.tabulator-calcs.tabulator-calcs-top,
  .wc-tabulator.tabulator .tabulator-footer .tabulator-calcs-holder,
  .wc-tabulator.tabulator .tabulator-footer .tabulator-calcs-holder .tabulator-row.tabulator-calcs.tabulator-calcs-bottom {
    color: var(--card-color) !important;
    background-color: var(--card-border-color) !important;

    /*
    border-color: var(--component-border-color);
    border-top: 1px solid var(--component-border-color);
    border-bottom: 1px solid var(--component-border-color);
    */
  } 
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder,
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder .tabulator-row.tabulator-calcs,
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder .tabulator-row.tabulator-calcs.tabulator-calcs-top {
    border-top: 1px solid var(--text-3);
    border-bottom: 1px solid var(--text-3);
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-calcs-holder,
  .wc-tabulator.tabulator .tabulator-footer .tabulator-calcs-holder .tabulator-row.tabulator-calcs.tabulator-calcs-bottom {
    border-top: 1px solid var(--text-3);
    border-bottom: 1px solid transparent;
  }

  
  .wc-tabulator.tabulator .tabulator-row.tabulator-unselectable.tabulator-calcs.tabulator-calcs-top,
  .wc-tabulator.tabulator .tabulator-row.tabulator-unselectable.tabulator-calcs.tabulator-calcs-bottom {
    color: var(--card-color) !important;
    background-color: var(--card-border-color) !important;
    /*
    border-color: var(--component-border-color);
    border-top: 1px solid var(--component-border-color);
    border-bottom: 1px solid var(--component-border-color);
    */
  } 

  /* Table Popup */
  .tabulator-menu.tabulator-popup-container {
    color: var(--text-1);
    background-color: var(--surface-1);
  }
  .tabulator-menu.tabulator-popup-container .tabulator-menu-item:hover {
    color: var(--card-color);
    background-color: var(--card-bg-color);
  }

  /* Tabulator Edit List / Popup Container */
  .tabulator-edit-list.tabulator-popup-container {
    color: var(--text-1);
    background-color: var(--surface-1);
  }
  .tabulator-edit-list-item.tabulator-edit-list-group-level-0 {
    color: var(--text-1);
  }
  .tabulator-edit-list-item.tabulator-edit-list-group-level-0:hover {
    color: var(--card-color);
    background-color: var(--card-bg-color);
  }
      `;
      this.loadStyle("wc-tabulator-style", style);
    }
  }
  customElements.define("wc-tabulator", WcTabulator);
}

// src/js/components/wc-template-preview.js
if (!customElements.get("wc-template-preview")) {
  class WcTemplatePreview extends WcBaseComponent {
    static get observedAttributes() {
      return [];
    }
    constructor() {
      super();
      this.childComponentSelector = "wc-input";
      const compEl = this.querySelector(".wc-template-preview");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        const cls = this.getAttribute("cls") || "";
        this.componentElement.className = `wc-template-preview ${cls}`;
        this.appendChild(this.componentElement);
        this._createElement();
      }
      console.log("ctor:wc-template-preview");
    }
    async _connectedCallback() {
      this._applyStyle();
      this._wireEvents();
      console.log("connectedCallback:wc-template-preview");
    }
    _disconnectedCallback() {
      this._unWireEvents();
      console.log("disconnectedCallback:wc-template-preview");
    }
    _createElement() {
      const record_id = this.getAttribute("record-id") || "";
      const slug = this.getAttribute("slug") || "";
      const controls = `<div class="flex flex-row justify-between">
            <wc-input name="preview_toggle" 
              class="row items-center gap-1"
              lbl-label="Preview"
              type="radio"
              radio-group-class="row modern text-2xs"
              value="off"
              >
              <option value="on">Show</option>
              <option value="off">Hide</option>
            </wc-input>
            <wc-input name="drag_toggle" 
              class="row items-center gap-1 hidden"
              lbl-label="Drag n Drop"
              type="radio"
              radio-group-class="row modern text-2xs"
              value="off"
              >
              <option value="on">Enable</option>
              <option value="off">Disable</option>
            </wc-input>
        </div>
      `;
      let src = "";
      if (record_id === "create" || record_id === "") {
        src = `/v/${slug}/create`;
      } else {
        src = `/v/${slug}/${record_id}`;
      }
      this.src = src;
      const markup = `${controls}
        <iframe class="preview hidden"
                src=""
                style="height: calc(-360px + 100vh);"
                >
        </iframe>
      `.trim();
      this.componentElement.innerHTML = markup;
    }
    _handleAttributeChange(attrName, newValue) {
      super._handleAttributeChange(attrName, newValue);
    }
    _applyStyle() {
      const style = `
        wc-template-preview {
          display: contents;
        }
        .wc-template-preview {
        }
      `.trim();
      this.loadStyle("wc-template-preview-style", style);
    }
    _wireEvents() {
      super._wireEvents();
      const previewFrame = this.querySelector("iframe.preview");
      const previewToggleInput = this.querySelector('wc-input input[name="preview_toggle"]');
      const previewToggle = previewToggleInput.closest("wc-input");
      const dragToggleInput = this.querySelector('wc-input input[name="drag_toggle"]');
      const dragToggle = dragToggleInput.closest("wc-input");
      previewToggle.addEventListener("change", (event) => {
        const { target } = event;
        const toggle = dragToggle.querySelector(".wc-input");
        if (target.value === "on") {
          previewFrame.src = this.src;
          toggle.classList.remove("hidden");
          this.componentElement.classList.add("col-1");
          previewFrame.classList.remove("hidden");
        } else {
          previewFrame.src = "";
          toggle.classList.add("hidden");
          this.componentElement.classList.remove("col-1");
          previewFrame.classList.add("hidden");
        }
      });
      dragToggle.addEventListener("change", (event) => {
        const { target } = event;
        if (target.value === "on") {
          previewFrame.contentDocument.body.classList.add("preview-frame");
          wc.EventHub.broadcast("wc-template-preview:enable-drag", "", "");
        } else {
          previewFrame.contentDocument.body.classList.remove("preview-frame");
          wc.EventHub.broadcast("wc-template-preview:disable-drag", "", "");
        }
      });
    }
    _unWireEvents() {
      super._unWireEvents();
      const previewFrame = this.querySelector("iframe.preview");
      const previewToggleInput = this.querySelector('wc-input input[name="preview_toggle"]');
      const previewToggle = previewToggleInput.closest("wc-input");
      const dragToggleInput = this.querySelector('wc-input input[name="drag_toggle"]');
      const dragToggle = dragToggleInput.closest("wc-input");
      previewToggle.removeEventListener("change", (event) => {
        const { target } = event;
        const toggle = dragToggle.querySelector(".wc-input");
        if (target.value === "on") {
          previewFrame.src = this.src;
          toggle.classList.remove("hidden");
          this.componentElement.classList.add("col-1");
          previewFrame.classList.remove("hidden");
        } else {
          previewFrame.src = "";
          toggle.classList.add("hidden");
          this.componentElement.classList.remove("col-1");
          previewFrame.classList.add("hidden");
        }
      });
      dragToggle.removeEventListener("change", (event) => {
        const { target } = event;
        if (target.value === "on") {
          previewFrame.contentDocument.body.classList.add("preview-frame");
          wc.EventHub.broadcast("wc-template-preview:enable-drag", "", "");
        } else {
          previewFrame.contentDocument.body.classList.remove("preview-frame");
          wc.EventHub.broadcast("wc-template-preview:disable-drag", "", "");
        }
      });
    }
  }
  customElements.define("wc-template-preview", WcTemplatePreview);
}

// src/js/components/wc-theme-selector.js
var WcThemeSelector = class extends WcBaseComponent {
  static get observedAttributes() {
    return ["id", "class", "theme", "mode"];
  }
  constructor() {
    super();
    this.prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    this.prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
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
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-theme-selector > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    this._wireEvents();
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
    console.log("_render:wc-theme-selector");
  }
  _createInnerElement() {
    const themes = [
      "theme-rose",
      "theme-petal",
      "theme-sunset",
      "theme-peach",
      "theme-fire",
      "theme-desert",
      "theme-golden",
      "theme-honey",
      "theme-amber",
      "theme-olive",
      "theme-moss",
      "theme-avocado",
      "theme-lime",
      "theme-fern",
      "theme-yellow",
      "theme-meadow",
      "theme-cornsilk",
      "theme-sage",
      "theme-forest",
      "theme-jungle",
      "theme-emerald",
      "theme-mint",
      "theme-turquoise",
      "theme-aqua",
      "theme-lagoon",
      "theme-ice",
      "theme-ocean",
      "theme-azure",
      "theme-sky",
      "theme-midsky",
      "theme-deepsky",
      "theme-royal",
      "theme-twilight",
      "theme-lavender",
      "theme-violet",
      "theme-grape",
      "theme-plum",
      "theme-fuchsia",
      "theme-cottoncandy",
      "theme-blush",
      "theme-bubblegum"
    ];
    const template = document.createElement("template");
    template.innerHTML = `
      <div class="relative row flex-wrap">
        ${themes.map((theme) => `
          <button class="theme-button flat h-10 w-10 rounded-t-md ${theme}" type="button" data-theme="${theme}" title="${theme}">
            <svg class="selectmark h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
              <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
            </svg>
          </button>
          `.trim()).join("")}
      </div>
      <wc-input name="theme_mode"
        class="col"
        lbl-label="Light or Dark?"
        type="checkbox"
        toggle-switch
        ${this.prefersDark ? "checked" : ""}
        _="on change
          if me.value
            remove .light from document.documentElement
            add .dark to document.documentElement
          else
            remove .dark from document.documentElement
            add .light to document.documentElement
          end
        end"
        >
      </wc-input>
      `.trim();
    this.componentElement.appendChild(template.content.cloneNode(true));
  }
  _applyStyle() {
    const style = `
      wc-theme-selector {
        display: contents;
      }
      wc-theme-selector .wc-theme-selector {

      }
      wc-theme-selector .wc-theme-selector .theme-button {
        padding: 0;
      }
      wc-theme-selector .wc-theme-selector .selectmark {
        padding: 0;
        pointer-events: none;
      }
    `;
    this.loadStyle("wc-theme-selector-style", style);
  }
  _handleThemeClick(event) {
    const { target } = event;
    console.log("target", target);
    const selectedTheme = target.getAttribute("data-theme");
    this._setTheme(target, selectedTheme);
    localStorage.setItem("theme", selectedTheme.replace("theme-", ""));
  }
  _setTheme(target, theme) {
    const themeBtns = this.componentElement.querySelectorAll("button[data-theme]");
    themeBtns.forEach((btn) => {
      btn.classList.remove("selected");
      btn.innerHTML = "";
    });
    target.classList.add("selected");
    target.innerHTML = `<svg class="selectmark h-4 w-4" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
        <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
      </svg>`.trim();
    document.documentElement.classList.forEach((cls) => {
      if (cls.startsWith("theme-")) {
        document.documentElement.classList.remove(cls);
      }
    });
    document.documentElement.classList.add(theme);
  }
  _handleLoadTheme() {
    const savedTheme = localStorage.getItem("theme") || "rose";
    const themeClass = `theme-${savedTheme}`;
    const target = this.componentElement.querySelector(`button[data-theme="${themeClass}"]`);
    this._setTheme(target, themeClass);
  }
  _wireEvents() {
    super._wireEvents();
    const themeBtns = this.componentElement.querySelectorAll("button[data-theme]");
    themeBtns.forEach((btn) => btn.addEventListener("click", this._handleThemeClick.bind(this)));
    this.componentElement.addEventListener("load", this._handleLoadTheme.bind(this));
  }
  _unWireEvents() {
    super._unWireEvents();
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
    const container2 = document.createElement("div");
    container2.classList.add("timeline-container", position);
    const card = document.createElement("div");
    card.classList.add("timeline-card");
    const header = document.createElement("h2");
    header.textContent = itemLabel;
    const content = document.createElement("p");
    content.textContent = itemContent;
    card.appendChild(header);
    card.appendChild(content);
    container2.appendChild(card);
    return container2;
  }
  _applyStyle() {
    const style = `
      wc-timeline {
        display: contents;
      }
        
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
      .wc-timeline .timeline-container {
        padding: 10px 40px;
        position: relative;
        background-color: inherit;
        width: 50%;
      }

      /* The circles on the timeline */
      .wc-timeline .timeline-container::after {
        content: '';
        position: absolute;
        width: 25px;
        height: 25px;
        right: -17px;
        background-color: var(--component-color);
        border: 4px solid var(--container-border-color);
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
        border-color: transparent transparent transparent var(--card-bg-color);
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
        border-color: transparent var(--card-bg-color); transparent transparent;
      }

      /* Fix the circle for containers on the right side */
      .wc-timeline .right::after {
        left: -16px;
      }

      /* The actual content */
      .wc-timeline .timeline-card {
        padding: 20px 30px;
        background-color: var(--card-bg-color);
        color: var(--card-color);
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
        .wc-timeline .timeline-container {
          width: 100%;
          padding-left: 70px;
          padding-right: 25px;
        }
        
        /* Make sure that all arrows are pointing leftwards */
        .wc-timeline .timeline-container::before {
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
        this._createElement();
        this.appendChild(this.componentElement);
      }
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      const payload = { detail: {} };
      const custom = new CustomEvent("load", payload);
      this.dispatchEvent(custom);
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
      this.componentElement.className = "wc-article-skeleton max-w-full m-4 border border-solid card-border-color p-4 space-y-8 animate-pulse md:space-y-0 md:space-x-8 rtl:space-x-reverse md:flex md:items-center";
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-center w-full h-48 card-bg-color rounded-md sm:w-96">
          <svg class="w-10 h-10" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 18">
            <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z"/>
          </svg>
        </div>
        <div class="w-full">
          <div class="h-2.5 card-bg-color rounded-full w-48 mb-4"></div>
          <div class="h-2 card-bg-color rounded-full max-w-[480px] mb-2.5"></div>
          <div class="h-2 card-bg-color rounded-full mb-2.5"></div>
          <div class="h-2 card-bg-color rounded-full max-w-[440px] mb-2.5"></div>
          <div class="h-2 card-bg-color rounded-full max-w-[460px] mb-2.5"></div>
          <div class="h-2 card-bg-color rounded-full max-w-[360px]"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }
    _applyStyle() {
      const style = `
wc-article-skeleton {
  display: contents;
}
wc-article-skeleton .wc-article-skeleton {
  background-color: var(--surface-1);
}
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
      `.trim();
      this.loadStyle("wc-article-skeleton", style);
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-article-skeleton", WcArticleSkeleton);
}

// src/js/components/wc-card-skeleton.js
if (!customElements.get("wc-card-skeleton")) {
  class WcCardSkeleton extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class"];
    }
    constructor() {
      super();
      const compEl = this.querySelector(".wc-card-skeleton");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
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
      this.componentElement.id = "card-skeleton";
      this.componentElement.setAttribute("role", "status");
      this.componentElement.className = "wc-card-skeleton max-w-full m-4 p-4 border border-solid card-border-color rounded-md shadow animate-pulse md:p-6";
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-center h-48 mb-4 card-bg-color rounded-md">
          <svg class="w-10 h-10" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 16 20">
              <path d="M14.066 0H7v5a2 2 0 0 1-2 2H0v11a1.97 1.97 0 0 0 1.934 2h12.132A1.97 1.97 0 0 0 16 18V2a1.97 1.97 0 0 0-1.934-2ZM10.5 6a1.5 1.5 0 1 1 0 2.999A1.5 1.5 0 0 1 10.5 6Zm2.221 10.515a1 1 0 0 1-.858.485h-8a1 1 0 0 1-.9-1.43L5.6 10.039a.978.978 0 0 1 .936-.57 1 1 0 0 1 .9.632l1.181 2.981.541-1a.945.945 0 0 1 .883-.522 1 1 0 0 1 .879.529l1.832 3.438a1 1 0 0 1-.031.988Z"/>
              <path d="M5 5V.13a2.96 2.96 0 0 0-1.293.749L.879 3.707A2.98 2.98 0 0 0 .13 5H5Z"/>
          </svg>
        </div>
        <div class="h-2.5 card-bg-color rounded-full w-48 mb-4"></div>
        <div class="h-2 card-bg-color rounded-full mb-2.5"></div>
        <div class="h-2 card-bg-color rounded-full mb-2.5"></div>
        <div class="h-2 card-bg-color rounded-full"></div>
        <div class="flex items-center mt-4">
          <svg class="text-color-2 w-10 h-10 me-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 0a10 10 0 1 0 10 10A10.011 10.011 0 0 0 10 0Zm0 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 13a8.949 8.949 0 0 1-4.951-1.488A3.987 3.987 0 0 1 9 13h2a3.987 3.987 0 0 1 3.951 3.512A8.949 8.949 0 0 1 10 18Z"/>
            </svg>
            <div>
                <div class="h-2.5 card-bg-color rounded-full w-32 mb-2"></div>
                <div class="w-48 h-2 card-bg-color rounded-full"></div>
            </div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }
    _applyStyle() {
      const style = `
      wc-card-skeleton {
        display: contents;
      }
      wc-card-skeleton .wc-card-skeleton {
        background-color: var(--surface-1);
      }
      `.trim();
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-card-skeleton", WcCardSkeleton);
}

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
      this.componentElement.className = "wc-list-skeleton m-4 p-4 space-y-4 border border-solid card-border-color rounded-md shadow animate-pulse md:p-6";
      this.componentElement.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="w-5/6">
            <div class="h-2.5 card-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 card-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 card-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 card-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 card-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 card-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 card-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 card-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-5/6">
            <div class="h-2.5 card-bg-color rounded-full w-3/6 mb-2.5"></div>
            <div class="w-5/6 h-2 card-bg-color rounded-full"></div>
          </div>
          <div class="w-1/6 h-2.5 card-bg-color rounded-full"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }
    _applyStyle() {
      const style = `
wc-list-skeleton {
  display: contents;
}
wc-list-skeleton .wc-list-skeleton {
  background-color: var(--surface-1);
}
/* Spacing */
.md:p-6 {
  padding: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Width and Height */
.max-w-md {
  max-width: 28rem;
}

/* Shadows */
.shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
}
      `.trim();
      this.loadStyle("wc-list-skeleton-style", style);
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-list-skeleton", WcListSkeleton);
}

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
      this.componentElement.className = "wc-table-skeleton max-w-full m-4 p-4 space-y-4 border border-solid card-border-color rounded-md shadow animate-pulse md:p-6";
      this.componentElement.innerHTML = `
        <!-- Table Header Skeleton -->
        <div class="flex items-center justify-between">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <!-- Table Row Skeletons -->
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <div class="flex items-center justify-between pt-4">
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
          <div class="w-1/6 h-4 card-bg-color rounded-full"></div>
        </div>
        <span class="sr-only">Loading...</span>
      `.trim();
    }
    _applyStyle() {
      const style = `
wc-table-skeleton {
  display: contents;
}
wc-table-skeleton .wc-table-skeleton {
  background-color: var(--surface-1);
}
/* Spacing */
.md:p-6 {
  padding: 1.5rem;
}
.space-y-4 > * + * {
  margin-top: 1rem;
}

/* Shadows */
.shadow {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
}
      `.trim();
      this.loadStyle("wc-table-skeleton-style", style);
    }
    _unWireEvents() {
      super._unWireEvents();
    }
  }
  customElements.define("wc-table-skeleton", WcTableSkeleton);
}

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
      wc-loader {
        display: contents;
      }

      wc-loader .wc-loader {
        border-width: 16px;
        border-style: solid;
        border-color: var(--primary-color);
        border-top-color: var(--primary-bg-color);
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
    this.classList.add("contents");
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
  applyAttributes(container2) {
    _WcBehavior.observedAttributes.forEach((attr) => {
      if (this.hasAttribute(attr)) {
        container2.setAttribute(attr, this.getAttribute(attr));
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
      this.classList.add("contents");
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
    this.classList.add("contents");
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
if (!customElements.get("wc-event-hub")) {
  class WcEventHub extends HTMLElement {
    events = {};
    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);
      console.log("ctor:wc-event-hub");
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
        this._applyStyle();
      }
      console.log("conntectedCallback:wc-event-hub");
    }
    disconnectedCallback() {
    }
    broadcast(eventName, selector, subSelector, custom) {
      const payload = { detail: { selector, subSelector, custom } };
      const customEvent = new CustomEvent(eventName, payload);
      document.body.dispatchEvent(customEvent);
      if (window.parent.document) {
        window.parent.document.body.dispatchEvent(customEvent);
      }
    }
    _applyStyle() {
      const style = `
      wc-event-hub {
        display: contents;
      }
      `;
      this.loadStyle("wc-event-hub-style", style);
    }
  }
  customElements.define("wc-event-hub", WcEventHub);
}

// src/js/components/wc-mask-hub.js
if (!customElements.get("wc-mask-hub")) {
  class WcMaskHub extends HTMLElement {
    static get observedAttributes() {
      return [];
    }
    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);
      console.log("ctor:wc-mask-hub");
    }
    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderMask();
        this._applyStyle();
      }
      console.log("conntectedCallback:wc-mask-hub");
    }
    disconnectedCallback() {
    }
    async renderMask() {
      await Promise.all([
        this.loadLibrary("https://cdnjs.cloudflare.com/ajax/libs/imask/7.6.1/imask.min.js", "IMask")
      ]);
      if (!window.wc) {
        window.wc = {};
      }
      window.wc.MaskHub = this;
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
    _applyStyle() {
      const style = `
      wc-mask-hub {
        display: contents;
      }
      `;
      this.loadStyle("wc-mask-hub-style", style);
    }
  }
  customElements.define("wc-mask-hub", WcMaskHub);
}

// src/js/components/wc-hotkey.js
if (!customElements.get("wc-hotkey")) {
  class WcHotkey extends HTMLElement {
    constructor() {
      super();
      this.classList.add("contents");
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
      this.classList.add("contents");
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
      this.classList.add("contents");
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
      this.classList.add("contents");
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

// src/js/components/wc-prompt.js
if (!customElements.get("wc-prompt")) {
  class WcPrompt extends HTMLElement {
    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);
      this.table = null;
      console.log("ctor:wc-prompt");
    }
    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderPrompt();
      }
      this._applyStyle();
      this.wireEvents();
      console.log("conntectedCallback:wc-prompt");
    }
    disconnectedCallback() {
      this.unWireEvents();
    }
    async renderPrompt() {
      await Promise.all([
        this.loadCSS("https://unpkg.com/notie/dist/notie.min.css"),
        this.loadLibrary("https://unpkg.com/notie", "notie"),
        this.loadLibrary("https://unpkg.com/sweetalert2@11.15.10/dist/sweetalert2.all.js", "Swal")
        // this.loadCSS('/static/css/notie@4.3.1.min.css'),
        // this.loadLibrary('/static/js/notie.js', 'notie'),
        // this.loadLibrary('/static/js/sweetalert2@11.15.10.js', 'Swal'),
      ]);
      if (!window.wc) {
        window.wc = {};
      }
      window.wc.Prompt = this;
      wc.EventHub.broadcast("wc-prompt:ready", "", "");
    }
    banner(c) {
      const { text = "", type = "info", stay = false, time = 3, position = "top" } = c;
      notie.alert({ type, text, stay, time, position });
    }
    toast(c) {
      const { title = "", icon = "success", position = "top-end" } = c;
      const Toast = Swal.mixin({
        toast: true,
        title,
        position,
        icon,
        showConfirmButton: false,
        timer: 3e3,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener("mouseenter", Swal.stopTimer);
          toast.addEventListener("mouseleave", Swal.resumeTimer);
        }
      });
      Toast.fire({});
    }
    async success(c) {
      const { title = "", text = "", footer = "", callback = null } = c;
      const { value: result } = await Swal.fire({ icon: "success", title, text, footer });
      return this.handleResult(c, result);
    }
    async error(c) {
      const { title = "", text = "", footer = "", callback = null } = c;
      const { value: result } = await Swal.fire({ icon: "error", title, text, footer });
      return this.handleResult(c, result);
    }
    async warning(c) {
      const { title = "", text = "", footer = "", callback = null } = c;
      const { value: result } = await Swal.fire({ icon: "warning", title, text, footer });
      return this.handleResult(c, result);
    }
    async info(c) {
      const { title = "", text = "", footer = "", callback = null } = c;
      const { value: result } = await Swal.fire({ icon: "info", title, text, footer });
      return this.handleResult(c, result);
    }
    async question(c) {
      const { title = "", text = "", footer = "", showCancelButton = true, callback = null } = c;
      const { value: result } = await Swal.fire({ icon: "question", title, text, footer, showCancelButton });
      return this.handleResult(c, result);
    }
    async notify(c) {
      const body = document.querySelector("body");
      const theme = body.dataset.theme;
      const {
        icon = "",
        title = "",
        text = "",
        showConfirmButton = true,
        input: input2 = "",
        inputOptions = {},
        inputPlaceholder = "",
        callback = null
      } = c;
      const customClass = {
        container: "",
        // popup: 'theme-midnight-slate',
        popup: theme,
        header: "",
        title: "",
        closeButton: "",
        icon: "",
        image: "",
        htmlContainer: "",
        input: "",
        inputLabel: "",
        validationMessage: "",
        actions: "",
        confirmButton: "theme-ocean-blue",
        denyButton: "",
        cancelButton: "theme-slate-storm",
        loader: "",
        footer: "",
        timerProgressBar: ""
      };
      const { value: result } = await Swal.fire({
        customClass,
        icon,
        title,
        html: text,
        input: input2,
        inputOptions,
        inputPlaceholder,
        backdrop: false,
        focusConfirm: false,
        showCancelButton: true,
        showConfirmButton,
        willOpen: () => {
          if (c.willOpen !== void 0) {
            c.willOpen();
          }
        },
        didOpen: () => {
          if (c.didOpen !== void 0) {
            c.didOpen();
          }
        }
      });
      return this.handleResult(c, result);
    }
    async notifyTemplate(c) {
      const body = document.querySelector("body");
      const theme = body.dataset.theme;
      const { template = "", didOpen = null, preConfirm = null, callback = null } = c;
      const customClass = {
        container: "",
        // popup: 'theme-midnight-slate',
        popup: theme,
        header: "",
        title: "",
        closeButton: "",
        icon: "",
        image: "",
        htmlContainer: "",
        input: "",
        inputLabel: "",
        validationMessage: "",
        actions: "",
        confirmButton: "theme-ocean-blue",
        denyButton: "",
        cancelButton: "theme-slate-storm",
        loader: "",
        footer: "",
        timerProgressBar: ""
      };
      const { value: result } = await Swal.fire({
        customClass,
        template,
        didOpen,
        preConfirm,
        callback
      });
      return this.handleResult(c, result);
    }
    async fire(c) {
      const body = document.querySelector("body");
      const theme = body.dataset.theme;
      let defaultArgs = {
        container: "",
        popup: theme,
        header: "",
        title: "",
        closeButton: "",
        icon: "",
        image: "",
        htmlContainer: "",
        input: "",
        inputLabel: "",
        validationMessage: "",
        actions: "",
        confirmButton: "theme-ocean-blue",
        denyButton: "",
        cancelButton: "theme-slate-storm",
        loader: "",
        footer: "",
        timerProgressBar: "",
        backdrop: false,
        focusConfirm: false,
        showCancelButton: true,
        showConfirmButton: true,
        willOpen: () => {
          if (c.willOpen !== void 0) {
            c.willOpen();
          }
        },
        didOpen: () => {
          if (c.didOpen !== void 0) {
            c.didOpen();
          }
        }
      };
      const customArgs = { ...defaultArgs, ...c };
      const { value: result } = await Swal.fire(customArgs);
      return this.handleResult(c, result);
    }
    handleResult(c, result) {
      if (result) {
        if (result.dismiss !== Swal.DismissReason.cancel) {
          if (result.value !== "") {
            if (c.callback !== void 0) {
              return c.callback(result);
            } else {
              return result;
            }
          } else {
            return c.callback(false);
          }
        } else {
          return c.callback(false);
        }
      }
    }
    _applyStyle() {
      const style = `
      wc-prompt {
        display: contents;
      }
      .swal2-container .swal2-popup {
        background-color: var(--surface-5);
        color: var(--text-1);
      }
      .swal2-container .swal2-popup .swal2-title {
        color: var(--text-1);
      }
      .swal2-container .swal2-popup .swal2-html-container {
        background-color: var(--surface-5);
        color: var(--text-1);
        overflow: visible;
        text-align: inherit;
        z-index: auto;
      }
      .swal2-container .swal2-popup .swal2-actions .swal2-confirm {
        background-color: var(--primary-bg-color);
      }
      .swal2-container .swal2-popup .swal2-actions .swal2-cancel {
        background-color: var(--secondary-bg-color);
      }
      .swal2-container .swal2-popup input,
      .swal2-container .swal2-popup select,
      .swal2-container .swal2-popup textarea {
        background-color: var(--component-bg-color);
        border: 1px solid var(--component-border-color);
        border-radius: 0.375rem;
        color: var(--component-color);
        padding: 0.375rem;
      }
      `;
      this.loadStyle("wc-prompt-style", style);
    }
    wireEvents() {
      document.body.addEventListener("wc-prompt:banner", (event) => {
        this.banner(event.detail);
      });
      document.body.addEventListener("wc-prompt:toast", (event) => {
        this.toast(event.detail);
      });
      document.body.addEventListener("wc-prompt:success", async (event) => {
        return this.success(event.detail);
      });
      document.body.addEventListener("wc-prompt:error", async (event) => {
        return this.error(event.detail);
      });
      document.body.addEventListener("wc-prompt:warning", async (event) => {
        return this.warning(event.detail);
      });
      document.body.addEventListener("wc-prompt:info", async (event) => {
        return this.info(event.detail);
      });
      document.body.addEventListener("wc-prompt:question", async (event) => {
        return this.question(event.detail);
      });
      document.body.addEventListener("wc-prompt:notify", async (event) => {
        return this.notify(event.detail);
      });
      document.body.addEventListener("wc-prompt:notify-template", async (event) => {
        return this.notifyTemplate(event.detail);
      });
    }
    unWireEvents() {
      document.body.removeEventListener("wc-prompt:banner", (event) => {
        this.banner(event.detail);
      });
      document.body.removeEventListener("wc-prompt:toast", (event) => {
        this.toast(event.detail);
      });
      document.body.removeEventListener("wc-prompt:success", async (event) => {
        return this.success(event.detail);
      });
      document.body.removeEventListener("wc-prompt:error", async (event) => {
        return this.error(event.detail);
      });
      document.body.removeEventListener("wc-prompt:warning", async (event) => {
        return this.warning(event.detail);
      });
      document.body.removeEventListener("wc-prompt:info", async (event) => {
        return this.info(event.detail);
      });
      document.body.removeEventListener("wc-prompt:question", async (event) => {
        return this.question(event.detail);
      });
      document.body.removeEventListener("wc-prompt:notify", async (event) => {
        return this.notify(event.detail);
      });
      document.body.removeEventListener("wc-prompt:notify-template", async (event) => {
        return this.notifyTemplate(event.detail);
      });
    }
  }
  customElements.define("wc-prompt", WcPrompt);
}

// src/js/components/wc-theme.js
if (!customElements.get("wc-theme")) {
  class WcTheme extends HTMLElement {
    constructor() {
      super();
      this.classList.add("contents");
    }
    connectedCallback() {
      this._handleLoadTheme();
    }
    _handleLoadTheme() {
      const savedTheme = localStorage.getItem("theme") || "rose";
      const themeClass = `theme-${savedTheme}`;
      document.documentElement.classList.forEach((cls) => {
        if (cls.startsWith("theme-")) {
          document.documentElement.classList.remove(cls);
        }
      });
      document.documentElement.classList.add(themeClass);
    }
  }
  customElements.define("wc-theme", WcTheme);
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
      wc-form {
        display: contents;
      }

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
      elt?.classList.add("text-2xs");
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
      wc-input {
        display: contents;
      }
      /*
      wc-input label {
        margin-bottom: 0.250rem;
      }
      wc-input input {
        background-color: var(--surface-3);
        border: 1px solid var(--surface-4);
        border-radius: 0.375rem;
        color: var(--text-1);
        padding: 0.375rem;
        width: 100%;
      }
      wc-input input:-webkit-autofill {
        background-color: var(--surface-3);
        color: var(--surface-4);
        box-shadow: 0 0 0px 1000px var(--surface-3) inset;
        -webkit-text-fill-color: var(--text-1);
        transition: background-color 5000s ease-in-out 0s;
      }
      input:focus-visible {
        outline: var(--surface-4) solid 2px;
        outline-offset: 0px;
      }
      input:user-invalid {
        outline: solid 2px var(--invalid-color);
        outline-offset: 0px;
      }
      input[type="checkbox"],
      input[type="range"] {
        background-color: var(--component-bg-color);
        border: 1px solid var(--component-border-color);
        accent-color: var(--component-bg-color);
      }
      input[type="checkbox"]:hover,
      input[type="range"]:hover {
        accent-color: var(--primary-bg-color);
      }
      input[type="button"] {
        position: relative;
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
        border: 1px solid var(--primary-bg-color);
        border: none;
        border-radius: 0.375rem;
        padding: 0.5rem;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      input[type="button"]:focus-visible {
        outline: var(--primary-bg-color) solid 2px;
        outline-offset: 2px;  
      }
      input[type="button"]:disabled {
        cursor: not-allowed;
        opacity: 0.7;
      }
      input[type="button"]:hover:not(:disabled) {
        background-color: var(--primary-alt-bg-color);
      }
      */


      div.wc-input :disabled:not(.toggle-checkbox),
      div.wc-textarea :disabled,
      div.wc-select :disabled,
      div.wc-code-mirror :disabled 
      {
        cursor: not-allowed;
        opacity: 0.7;
        font-style: italic;  
      }
      div.wc-input label:has(:disabled),
      div.wc-textarea label:has(:disabled),
      div.wc-select label:has(:disabled),
      div.wc-code-mirror label:has(:disabled)
      {
        cursor: not-allowed;
      }
      div.wc-input:has(:disabled) label,
      div.wc-textarea:has(:disabled) label,
      div.wc-select:has(:disabled) label,
      div.wc-code-mirror:has(:disabled) label
      {
        opacity: 0.7;
        font-style: italic;
      }
      div.wc-input:has(:required) label,
      div.wc-textarea:has(:required) label,
      div.wc-select:has(:required) label,
      /*div.wc-code-mirror:has(:required) label*/
      div.wc-code-mirror[required] label
      {
        font-weight: bold;
      }
      div.wc-input:has(:required) label::after,
      div.wc-textarea:has(:required) label::after,
      div.wc-select:has(:required) label::after,
      /*div.wc-code-mirror:has(:required) label::after*/
      div.wc-code-mirror[required] label::after
      {
        content: ' *';
        font-weight: bold;
      }



      wc-input input {
        width: 100%;
      }
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
        background-color: var(--toggle-off);
        border: 1px solid var(--component-border-color);
        border-radius: 25px;
        /* cursor: pointer; */
        transition: background-color 0.4s;
        pointer-events: none;
      }

      .xdark wc-input .toggle-switch {
        background-color: var(--toggle-off);
        border: 1px solid var(--component-border-color);
        transition: background-color 0.25s;
      }

      wc-input .toggle-switch::before {
        position: absolute;
        content: "";
        height: 15px;
        width: 15px;
        left: 2px;
        bottom: 2px;
        background-color: var(--primary-bg-color);
        border: 1px solid var(--toggle-off);
        border-radius: 50%;
        transition: transform 0.4s;
      }

      wc-input .toggle-checkbox:checked + .toggle-switch::before {
        border: 1px solid var(--toggle-on);
      }
      wc-input .toggle-checkbox:checked + .toggle-switch {
        background-color: var(--toggle-on);
      }
      .xdark wc-input .toggle-checkbox:checked + .toggle-switch {
        background-color: var(--component-bg-color);
      }

      wc-input .toggle-checkbox:checked + .toggle-switch::before {
        transform: translateX(27px);
      }

      wc-input .toggle-checkbox:disabled + .toggle-switch {
        opacity: 0.7;
      }




      wc-input .radio-group {
        display: inline-flex;
        min-height: 20.5px;
      }
      wc-input .radio-group:not(.modern) {
        gap: 0.875rem;
      }
      wc-input .radio-group .radio-option {
        display: inline-flex;
        align-items: center;
        position: relative;
        outline: none;
      }
      wc-input .radio-group:not(.modern) .radio-option {
        padding-left: 12px;
        align-self: center;
      }
      wc-input .radio-group.col:not(.modern) .radio-option {
        padding-left: 12px;
        align-self: self-start;
      }
      wc-input .radio-group.modern {
        border: 1px solid var(--component-bg-color);
        border-radius: 5px;
      }
      wc-input .radio-group.modern .radio-option {
        padding: 0 0.5rem;
        background-color: var(--component-bg-color);
        color: var(--primary-color);
        border-right: 1px solid var(--component-bg-color);
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
        color: var(--secondary-alt-color);
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
        top: 0;
      }
      wc-input .radio-group:not(.modern) .radio-option:has(:checked)::after {
        content: "";
        display: inline-block;
        width: 10px; /* Slightly smaller than outer circle */
        height: 10px;
        border-radius: 50%;
        background-color: var(--primary-bg-color);
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
    return ["name", "id", "class", "multiple", "value", "items", "url", "display-member", "value-member", "lbl-label", "disabled", "required", "autofocus", "elt-class"];
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
    } else if (attrName === "url") {
      if (newValue) {
        fetch(newValue).then((response) => response.json()).then((data) => {
          this._items = data;
          this._generateOptionsFromItems();
          this._items.forEach((item) => {
            if (item.selected) {
              const displayMember = this.getAttribute("display-member") || "key";
              const valueMember = this.getAttribute("value-member") || "value";
              this.addChip(item[valueMember], item[displayMember]);
            }
          });
        });
      }
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
    const size = this.getAttribute("size");
    if (size) {
      select.setAttribute("size", size);
    }
    options.forEach((opt) => {
      select.appendChild(opt);
    });
    this.formElement = select;
    if (this.getAttribute("mode") === "chip") {
      select.name = name;
      const hostContainer = document.createElement("div");
      hostContainer.classList.add("row");
      const container2 = document.createElement("div");
      container2.classList.add("chip-container");
      container2.id = "chipContainer";
      hostContainer.appendChild(container2);
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
      wc-select {
        display: contents;
      }
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
        color: var(--primary-color);
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
        color: var(--primary-color);
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
        color: var(--component-alt-color);
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
    const allowDynamic = this.hasAttribute("allow-dynamic");
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
    } else if (e.key === "Enter" && allowDynamic) {
      e.preventDefault();
      const value = e.target.value;
      this.addChip(value, value);
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
    const allowDynamic = this.hasAttribute("allow-dynamic");
    if (this.selectedOptions.includes(value)) return;
    setTimeout(() => {
      if (allowDynamic) {
        const selectElement = this.querySelector("select");
        let exists = Array.from(selectElement.options).some((option) => option.value === value);
        if (!exists) {
          const newOption = new Option(label, value);
          selectElement.add(newOption);
        }
      }
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
  _applyStyle() {
    const style = `
      wc-textarea {
        display: contents;
      }
    `.trim();
    this.loadStyle("wc-textarea-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
  }
};
customElements.define("wc-textarea", WcTextarea);
export {
  applyRule,
  checkResources,
  countElements,
  disableSortable,
  enableSortable,
  extractRules,
  extractSrcElements,
  fetchApi,
  generateUniqueId2 as generateUniqueId,
  getSourcePropertyValue,
  hide,
  hideAndShow,
  initRules,
  isCustomElement,
  loadCSS,
  loadLibrary,
  loadScript,
  loadStyle,
  loadStylesheet,
  locator,
  locatorAll,
  processJSONField,
  show,
  sleep,
  testSchema,
  toggleIndicator,
  updateJetTemplate,
  waitForPropertyPolling,
  waitForResourcePolling,
  waitForSelectorPolling,
  waitForSelectorsPolling,
  waitForThenHideAndShow
};
