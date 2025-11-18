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
  if (value == void 0) return;
  let match = false;
  if (schema) {
    match = testSchema(value, schema);
  }
  let selector = "";
  if (tgtDataId) {
    selector = `[data-id="${tgtDataId}"]`;
    if (tgtSelector) {
      selector += ` ${tgtSelector}`;
    }
  } else if (tgtSelector) {
    selector = tgtSelector;
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

// src/js/utils/icon-registry.js
var IconRegistry = class {
  constructor() {
    this.icons = /* @__PURE__ */ new Map();
    this.baseUrl = "/dist/assets/icons";
  }
  setBaseUrl(url) {
    this.baseUrl = url;
  }
  // Register a single icon
  register(name, svgContent, style = "solid") {
    const key = `${style}/${name}`;
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, "image/svg+xml");
    const svgElement = svgDoc.querySelector("svg");
    const paths = svgDoc.querySelectorAll("path");
    const iconData = {
      viewBox: svgElement?.getAttribute("viewBox") || "0 0 512 512",
      paths: Array.from(paths).map((path) => ({
        d: path.getAttribute("d"),
        opacity: path.getAttribute("opacity"),
        class: path.getAttribute("class"),
        fill: path.getAttribute("fill")
      }))
    };
    this.icons.set(key, iconData);
    if (window.customElements.get("wc-icon")) {
      const WcIcon = window.customElements.get("wc-icon");
      WcIcon.registerIcon(name, iconData, style);
    }
  }
  // Register multiple icons from an object
  registerBatch(iconsObj, style = "solid") {
    Object.entries(iconsObj).forEach(([name, svgContent]) => {
      this.register(name, svgContent, style);
    });
  }
  // Load icons from a JSON file containing SVG strings
  async loadFromJson(url, style = "solid") {
    try {
      const response = await fetch(url);
      const icons = await response.json();
      this.registerBatch(icons, style);
    } catch (error) {
      console.error(`Failed to load icons from ${url}:`, error);
    }
  }
  // Preload specific icons
  async preload(iconNames, style = "solid") {
    const promises = iconNames.map(async (name) => {
      const key = `${style}/${name}`;
      if (!this.icons.has(key)) {
        try {
          const response = await fetch(`${this.baseUrl}/${style}/${name}.svg`);
          if (response.ok) {
            const svgContent = await response.text();
            this.register(name, svgContent, style);
          }
        } catch (error) {
          console.error(`Failed to preload icon ${key}:`, error);
        }
      }
    });
    await Promise.all(promises);
  }
  // Get icon data
  get(name, style = "solid") {
    return this.icons.get(`${style}/${name}`);
  }
  // Check if icon exists
  has(name, style = "solid") {
    return this.icons.has(`${style}/${name}`);
  }
  // Get all registered icons
  getAll() {
    return new Map(this.icons);
  }
  // Clear registry
  clear() {
    this.icons.clear();
  }
};
var iconRegistry = new IconRegistry();
if (typeof window !== "undefined") {
  window.wc = window.wc || {};
  window.wc.iconRegistry = iconRegistry;
}

// src/js/utils/dependency-manager.js
var WcDependencyManager = class {
  constructor() {
    this._dependencies = /* @__PURE__ */ new Map();
    this._registeredDependencies = /* @__PURE__ */ new Set();
    this._readyPromise = null;
    this._readyResolve = null;
    this._readyReject = null;
    this._dependencyConfigs = {
      "IMask": {
        url: "https://cdnjs.cloudflare.com/ajax/libs/imask/7.6.1/imask.min.js",
        globalName: "IMask",
        timeout: 1e4
      },
      "CodeMirror": {
        urls: [
          "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css",
          "https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.js"
        ],
        globalName: "CodeMirror",
        timeout: 15e3
      },
      "Tabulator": {
        urls: [
          "https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js",
          "https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css"
        ],
        globalName: "Tabulator",
        timeout: 15e3
      }
    };
    this._initializeReadyPromise();
  }
  /**
   * Initialize the ready promise that applications can await
   */
  _initializeReadyPromise() {
    this._readyPromise = new Promise((resolve, reject) => {
      this._readyResolve = resolve;
      this._readyReject = reject;
    });
  }
  /**
   * Register a dependency as required (called by components during construction)
   * This lets us know what needs to load before we're "ready"
   */
  register(dependencyName) {
    this._registeredDependencies.add(dependencyName);
  }
  /**
   * Load a dependency (returns promise that resolves when loaded)
   * Handles deduplication - multiple calls return the same promise
   */
  async load(dependencyName, customConfig = null) {
    if (this._dependencies.has(dependencyName)) {
      return this._dependencies.get(dependencyName);
    }
    const config = customConfig || this._dependencyConfigs[dependencyName];
    if (!config) {
      const error = new Error(`Unknown dependency: ${dependencyName}. Please provide a configuration.`);
      console.error(error);
      return Promise.reject(error);
    }
    const loadingPromise = this._loadDependency(dependencyName, config);
    this._dependencies.set(dependencyName, loadingPromise);
    return loadingPromise;
  }
  /**
   * Internal method to actually load a dependency
   */
  async _loadDependency(dependencyName, config) {
    if (config.globalName && window[config.globalName]) {
      console.log(`\u2713 ${dependencyName} already loaded`);
      return window[config.globalName];
    }
    console.log(`\u23F3 Loading ${dependencyName}...`);
    const urls = Array.isArray(config.urls) ? config.urls : [config.url];
    const timeout = config.timeout || 1e4;
    try {
      const loadPromises = urls.map(
        (url) => this._loadResource(url, timeout)
      );
      await Promise.all(loadPromises);
      if (config.globalName && !window[config.globalName]) {
        throw new Error(`${dependencyName} loaded but ${config.globalName} not found on window`);
      }
      console.log(`\u2713 ${dependencyName} loaded successfully`);
      this._checkIfReady();
      return config.globalName ? window[config.globalName] : true;
    } catch (error) {
      console.error(`\u2717 Failed to load ${dependencyName}:`, error);
      this._dependencies.delete(dependencyName);
      throw error;
    }
  }
  /**
   * Load a single resource (JS or CSS) with timeout
   */
  _loadResource(url, timeout) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout loading ${url} after ${timeout}ms`));
      }, timeout);
      const isCSS = url.endsWith(".css");
      if (isCSS) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = url;
        link.onload = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        link.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to load CSS: ${url}`));
        };
        document.head.appendChild(link);
      } else {
        const script = document.createElement("script");
        script.src = url;
        script.onload = () => {
          clearTimeout(timeoutId);
          resolve();
        };
        script.onerror = () => {
          clearTimeout(timeoutId);
          reject(new Error(`Failed to load script: ${url}`));
        };
        document.head.appendChild(script);
      }
    });
  }
  /**
   * Check if all registered dependencies are loaded
   */
  _checkIfReady() {
    if (this._registeredDependencies.size === 0) {
      return;
    }
    const allLoaded = Array.from(this._registeredDependencies).every((dep) => {
      const promise = this._dependencies.get(dep);
      const config = this._dependencyConfigs[dep];
      return config && config.globalName && window[config.globalName];
    });
    if (allLoaded && this._readyResolve) {
      console.log("\u2713 All Wave CSS dependencies ready!");
      this._readyResolve();
      this._readyResolve = null;
      document.dispatchEvent(new CustomEvent("wc:ready", {
        detail: { dependencies: Array.from(this._registeredDependencies) }
      }));
    }
  }
  /**
   * Get the ready promise
   */
  get ready() {
    return this._readyPromise;
  }
  /**
   * Check if the system is already ready
   */
  get isReady() {
    if (this._registeredDependencies.size === 0) {
      return false;
    }
    return Array.from(this._registeredDependencies).every((dep) => {
      const config = this._dependencyConfigs[dep];
      return config && config.globalName && window[config.globalName];
    });
  }
  /**
   * Trigger initialization for an element (for HTMX partial loads)
   * This dispatches wc:ready to a specific element if dependencies are already loaded
   */
  triggerReadyForElement(element) {
    if (this.isReady) {
      element.dispatchEvent(new CustomEvent("wc:ready", {
        bubbles: false,
        detail: { dependencies: Array.from(this._registeredDependencies) }
      }));
    }
  }
  /**
   * Check if a specific dependency is loaded
   */
  isLoaded(dependencyName) {
    const config = this._dependencyConfigs[dependencyName];
    if (!config) return false;
    if (config.globalName) {
      return !!window[config.globalName];
    }
    return this._dependencies.has(dependencyName);
  }
  /**
   * Get status of all dependencies
   */
  getStatus() {
    const status = {};
    for (const [name, config] of Object.entries(this._dependencyConfigs)) {
      status[name] = {
        registered: this._registeredDependencies.has(name),
        loaded: this.isLoaded(name),
        globalAvailable: config.globalName ? !!window[config.globalName] : null
      };
    }
    return status;
  }
  /**
   * Add a custom dependency configuration
   */
  addDependency(name, config) {
    this._dependencyConfigs[name] = config;
  }
};
var dependencyManager = new WcDependencyManager();
if (!window.wc) {
  window.wc = {};
}
window.wc.DependencyManager = dependencyManager;
window.wc.ready = dependencyManager.ready;
if (typeof window !== "undefined") {
  document.addEventListener("htmx:afterSwap", (event) => {
    if (dependencyManager.isReady) {
      const target = event.detail.target;
      dependencyManager.triggerReadyForElement(target);
      target.querySelectorAll('[_*="wc:ready"]').forEach((el) => {
        dependencyManager.triggerReadyForElement(el);
      });
    }
  });
}

// src/js/components/wc-icon-config.js
var existingConfig = window.WcIconConfig || {};
var WcIconConfig = {
  // Base URL for icon assets - can be overridden by applications
  iconBaseUrl: existingConfig.iconBaseUrl || "/dist/assets/icons",
  bundleBaseUrl: existingConfig.bundleBaseUrl || "/dist/assets/icon-bundles",
  // Bundles to preload on initialization
  preloadBundles: existingConfig.preloadBundles || [],
  // CDN example:
  // iconBaseUrl: 'https://cdn.example.com/wave-css/icons',
  // bundleBaseUrl: 'https://cdn.example.com/wave-css/icon-bundles',
  // Configure icon base URLs
  setIconBaseUrl(url) {
    this.iconBaseUrl = url.replace(/\/$/, "");
  },
  setBundleBaseUrl(url) {
    this.bundleBaseUrl = url.replace(/\/$/, "");
  },
  // Configure both at once
  setBaseUrl(url) {
    const baseUrl = url.replace(/\/$/, "");
    this.iconBaseUrl = `${baseUrl}/icons`;
    this.bundleBaseUrl = `${baseUrl}/icon-bundles`;
  },
  // Set bundles to preload
  setPreloadBundles(bundles) {
    this.preloadBundles = bundles;
  }
};
if (!window.WcIconConfig) {
  window.WcIconConfig = WcIconConfig;
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
      this._handleAttributeChange(attrName, newValue, oldValue);
    }
  }
  _applyPendingAttributes() {
    Object.keys(this._pendingAttributes).forEach((attrName) => {
      const value = this._pendingAttributes[attrName];
      this._handleAttributeChange(attrName, value, null);
    });
    this._pendingAttributes = {};
  }
  _handleAttributeChange(attrName, newValue, oldValue) {
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
if (!customElements.get("wc-accordion")) {
  class WcAccordion extends WcBaseComponent {
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
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._wireEvents();
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
    }
    _createHeader(label, selected) {
      const allowMany = this.hasAttribute("allow-many");
      const el = document.createElement("button");
      el.type = "button";
      el.classList.add("accordion-header");
      if (selected) {
        el.classList.add("accordion-active");
      }
      if (allowMany) {
        el.setAttribute("_", `on click
          toggle .accordion-active on me
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
              remove .accordion-active from x
              set panel to x.nextElementSibling
              set panel.style.maxHeight to null
            end
          end
          toggle .accordion-active on me
          set panel to me.nextElementSibling
          if panel.style.maxHeight then
            set panel.style.maxHeight to null
          else
            set panel.style.maxHeight to panel.scrollHeight + 'px'
          end
        `);
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
    _moveDeclarativeOptions() {
      const options = this.querySelectorAll("option");
      if (options.length > 0) {
        this._items = [];
      }
      options.forEach((option) => {
        const item = {
          label: option.value,
          content: option.innerHTML.trim(),
          selected: option.hasAttribute("selected")
        };
        this._items.push(item);
      });
      Array.from(options).forEach((option) => option.remove());
    }
    _setActive() {
      setTimeout(() => {
        const anchors = this.querySelectorAll(".wc-accordion .accordion-header.accordion-active");
        anchors.forEach((anchor) => {
          const panel = anchor.nextElementSibling;
          panel.style.maxHeight = panel.scrollHeight + "px";
        });
      }, 50);
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

        .wc-accordion .accordion-active,
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

        .wc-accordion .accordion-active:after {
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
              if (btn?.classList.contains("accordion-active")) {
              } else {
                btn?.click();
              }
            } else if (mode === "close") {
              if (!btn?.classList.contains("accordion-active")) {
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
  }
  customElements.define("wc-accordion", WcAccordion);
}

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
      return [
        "id",
        "class",
        "height",
        "theme",
        "mode",
        "lbl-label",
        "lbl-class",
        "line-numbers",
        "line-wrapping",
        "fold-gutter",
        "tab-size",
        "indent-unit",
        "value",
        "disabled",
        "required",
        "fetch"
      ];
    }
    constructor() {
      super();
      this.childComponentName = "editor";
      this._isResizing = false;
      this._internals = this.attachInternals();
      this.firstContent = "";
      dependencyManager.register("CodeMirror");
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
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }
    async _handleAttributeChange(attrName, newValue, oldValue) {
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
      } else if (attrName === "fetch") {
        if (!oldValue) return;
        if (this.editor) {
          this.fetchUrl = newValue;
          this.handleFetch(this.fetchUrl);
        }
      } else {
        super._handleAttributeChange(attrName, newValue, oldValue);
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
      await dependencyManager.load("CodeMirror");
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
      const payload = {
        detail: { name: this.getAttribute("name"), editor: this.editor },
        bubbles: true,
        composed: true
      };
      const customEvent = new CustomEvent("wc-code-mirror:ready", payload);
      this.dispatchEvent(customEvent);
      document.body.dispatchEvent(customEvent);
      const url = this.getAttribute("fetch");
      this.handleFetch(url);
    }
    // This is required to inform the form that the component can be form-associated
    static get formAssociated() {
      return true;
    }
    handleFetch(url) {
      try {
        if (url) {
          fetch(url, {
            method: "GET"
          }).then((response) => response.json()).then((json) => {
            this.editor.setValue(json.result);
            const payload = {
              detail: { name: this.getAttribute("name"), editor: this.editor },
              bubbles: true,
              composed: true
            };
            const customEvent = new CustomEvent("fetch-complete", payload);
            this.dispatchEvent(customEvent);
          });
        }
      } catch (ex) {
        console.error("Error encountered while trying to fetch wc-code-mirror data!", ex);
      }
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
      const applyHighlighting = () => {
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
            }
          } else {
            const closeMatch = line.match(new RegExp(`</${componentName}>`));
            if (closeMatch) {
              endLine = i;
              inComponent = false;
              if (startLine !== -1 && endLine !== -1) {
                const jsContent = lines.slice(startLine + 1, endLine).join("\n");
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
      }, 100);
    }
    /**
     * Highlight JavaScript content using markers
     */
    highlightJavaScript(jsContent, startLine, endLine) {
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
    return ["id", "class", "label", "mode", "format", "dropdown-class"];
  }
  constructor() {
    super();
    this.childComponentSelector = "a,hr,wc-input";
    this.clickModes = ["search", "click"];
    this.mode = this.getAttribute("mode") || "click";
    this._boundReposition = null;
    this._isOpen = false;
    this._isMobile = false;
    const compEl = this.querySelector(".wc-dropdown");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-dropdown", this.mode);
      this.appendChild(this.componentElement);
    }
  }
  async connectedCallback() {
    super.connectedCallback();
    await this._applyStyle();
    this.classList.add("contents");
    this.classList.remove("hidden");
    this.componentElement.classList.remove("hidden");
    this._wireEvents();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "label") {
    } else if (attrName === "dropdown-class") {
      this._updateDropdownClass(newValue);
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
    const dropdownClass = this.getAttribute("dropdown-class");
    if (dropdownClass) {
      dropdown.classList.add(...dropdownClass.split(" ").filter((c) => c));
    }
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
            this._applyPositioningIfNeeded();
          } else if (mode === "close") {
            elt?.classList.remove("show");
            this._isOpen = false;
          } else if (mode === "toggle") {
            elt?.classList.toggle("show");
            if (elt?.classList.contains("show")) {
              this._applyPositioningIfNeeded();
            } else {
              this._isOpen = false;
            }
          }
        }
      });
    } else {
      const elt = selector?.querySelector(triggerSelector);
      if (mode === "open") {
        elt?.classList.add("show");
        this._applyPositioningIfNeeded();
      } else if (mode === "close") {
        elt?.classList.remove("show");
        this._isOpen = false;
      } else if (mode === "toggle") {
        elt?.classList.toggle("show");
        if (elt?.classList.contains("show")) {
          this._applyPositioningIfNeeded();
        } else {
          this._isOpen = false;
        }
      }
    }
  }
  _applyPositioningIfNeeded() {
    const dropdownContent = this.querySelector(".dropdown-content");
    const button = this.querySelector(".dropbtn");
    if (dropdownContent && button) {
      requestAnimationFrame(() => {
        this._positionDropdown(dropdownContent, button);
        this._isOpen = true;
      });
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
    const wasShown = parent.classList.contains("show");
    parent.classList.toggle("show");
    if (!wasShown) {
      const dropdownContent = this.querySelector(".dropdown-content");
      const button = this.querySelector(".dropbtn");
      if (dropdownContent && button) {
        requestAnimationFrame(() => {
          this._positionDropdown(dropdownContent, button);
          this._isOpen = true;
        });
      }
    } else {
      this._isOpen = false;
    }
  }
  _handleWindowClick(event) {
    const { target } = event;
    if (target.matches(".dropbtn") || target.matches(".search")) return;
    const haltElt = target.closest(".halt-event");
    if (haltElt) return;
    const parts = this.querySelectorAll(".wc-dropdown");
    parts.forEach((p) => {
      p.classList.remove("show");
      this._isOpen = false;
    });
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
  _updateDropdownClass(newValue) {
    const dropdown = this.querySelector(".dropdown");
    if (!dropdown) return;
    dropdown.className = "dropdown";
    if (newValue) {
      dropdown.classList.add(...newValue.split(" ").filter((c) => c));
    }
  }
  _detectMobile() {
    return window.innerWidth <= 768 || "ontouchstart" in window;
  }
  _checkAnchorPositioningSupport() {
    return CSS.supports("anchor-name", "--test");
  }
  _positionDropdown(dropdownContent, button) {
    if (!this._detectMobile() && this._checkAnchorPositioningSupport()) {
      return;
    }
    const buttonRect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    dropdownContent.style.position = "fixed";
    dropdownContent.style.width = "auto";
    dropdownContent.style.maxWidth = "";
    dropdownContent.style.left = "";
    dropdownContent.style.right = "";
    dropdownContent.style.top = "";
    dropdownContent.style.bottom = "";
    const originalDisplay = dropdownContent.style.display;
    dropdownContent.style.display = "block";
    const dropdownRect = dropdownContent.getBoundingClientRect();
    const dropdownWidth = Math.min(dropdownRect.width, viewportWidth - 20);
    const dropdownHeight = dropdownRect.height;
    dropdownContent.style.display = originalDisplay;
    if (this._detectMobile()) {
      dropdownContent.style.maxWidth = `${Math.min(dropdownWidth, viewportWidth - 20)}px`;
    }
    let top = buttonRect.bottom;
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      top = buttonRect.top - dropdownHeight;
    }
    let left = buttonRect.left;
    if (left + dropdownWidth > viewportWidth - 10) {
      left = Math.max(10, Math.min(buttonRect.right - dropdownWidth, viewportWidth - dropdownWidth - 10));
    }
    if (left < 10) {
      left = 10;
    }
    dropdownContent.style.position = "fixed";
    dropdownContent.style.left = `${left}px`;
    dropdownContent.style.top = `${top}px`;
    dropdownContent.style.width = `${dropdownWidth}px`;
    if (top + dropdownHeight > viewportHeight - 10) {
      dropdownContent.style.maxHeight = `${viewportHeight - top - 10}px`;
      dropdownContent.style.overflowY = "auto";
    }
  }
  _repositionOnScroll() {
    const dropdownContent = this.querySelector(".dropdown-content");
    const button = this.querySelector(".dropbtn");
    if (dropdownContent && button && dropdownContent.style.display === "block") {
      this._positionDropdown(dropdownContent, button);
    }
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
      
      /* Mobile-specific styles */
      @media (max-width: 768px) {
        .wc-dropdown .dropdown-content {
          max-width: calc(100vw - 20px) !important;
        }
      }
      
      /* Fallback for browsers without anchor positioning */
      @supports not (anchor-name: --test) {
        .wc-dropdown .dropdown-content {
          position: fixed !important;
        }
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
    this._boundReposition = this._repositionOnScroll.bind(this);
    window.addEventListener("scroll", this._boundReposition, { passive: true });
    window.addEventListener("resize", this._boundReposition, { passive: true });
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
    if (this._boundReposition) {
      window.removeEventListener("scroll", this._boundReposition);
      window.removeEventListener("resize", this._boundReposition);
      this._boundReposition = null;
    }
  }
};
customElements.define("wc-dropdown", WcDropdown);

// src/js/components/wc-field.js
var WcField = class extends WcBaseComponent {
  static get observedAttributes() {
    return [
      "id",
      "class",
      "label",
      "label-class",
      "value",
      "value-class",
      "link",
      "text-align",
      "hx-get",
      "hx-post",
      "hx-put",
      "hx-delete",
      "hx-patch",
      "hx-target",
      "hx-swap",
      "hx-trigger",
      "hx-indicator",
      "hx-push-url",
      "hx-vals",
      "hx-include",
      "hx-confirm"
    ];
  }
  constructor() {
    super();
    const compEl = this.querySelector(".wc-field");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-field", "col");
      this.appendChild(this.componentElement);
    }
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "label") {
      this._render();
    } else if (attrName === "label-class") {
    } else if (attrName === "value") {
      this._render();
    } else if (attrName === "value-class") {
    } else if (attrName === "link") {
      this._render();
    } else if (attrName === "text-align") {
    } else if (attrName.startsWith("hx-")) {
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-field > *");
    if (innerEl) {
      return;
    }
    const userContent = Array.from(this.children).filter(
      (child) => !child.classList.contains("wc-field")
    );
    this.componentElement.innerHTML = "";
    if (userContent.length > 0) {
      this._renderWithContent(userContent);
    } else {
      this._renderWithValue();
    }
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
  }
  _renderWithContent(userContent) {
    this._renderLabel();
    const valueContainer = document.createElement("div");
    valueContainer.classList.add("wc-field-value");
    const valueClass = this.getAttribute("value-class");
    if (valueClass) {
      valueClass.split(" ").forEach((cls) => {
        if (cls.trim()) valueContainer.classList.add(cls.trim());
      });
    } else {
      valueContainer.classList.add("text-xs", "text-4");
    }
    const textAlign = this.getAttribute("text-align");
    if (textAlign) {
      valueContainer.classList.add(`text-${textAlign}`);
    } else {
      valueContainer.classList.add("text-center");
    }
    userContent.forEach((child) => {
      valueContainer.appendChild(child);
    });
    this.componentElement.appendChild(valueContainer);
    if (valueClass) {
      this.removeAttribute("value-class");
    }
  }
  _renderWithValue() {
    this._renderLabel();
    const value = this.getAttribute("value") || "";
    const valueContainer = document.createElement("div");
    valueContainer.classList.add("wc-field-value");
    const valueClass = this.getAttribute("value-class");
    if (valueClass) {
      valueClass.split(" ").forEach((cls) => {
        if (cls.trim()) valueContainer.classList.add(cls.trim());
      });
    } else {
      valueContainer.classList.add("text-xs", "text-4");
    }
    const textAlign = this.getAttribute("text-align");
    if (textAlign) {
      valueContainer.classList.add(`text-${textAlign}`);
    } else {
      valueContainer.classList.add("text-center");
    }
    valueContainer.textContent = value;
    this.componentElement.appendChild(valueContainer);
    if (this.hasAttribute("value")) {
      this.removeAttribute("value");
    }
    if (valueClass) {
      this.removeAttribute("value-class");
    }
  }
  _renderLabel() {
    const label = this.getAttribute("label");
    if (!label) return;
    const link = this.getAttribute("link");
    const hxGet = this.getAttribute("hx-get");
    const labelClass = this.getAttribute("label-class");
    if (link || hxGet) {
      const anchor = document.createElement("a");
      anchor.classList.add("wc-field-label", "cursor-pointer", "underline");
      anchor.href = link || hxGet;
      this._addHtmxAttributes(anchor);
      if (labelClass) {
        labelClass.split(" ").forEach((cls) => {
          if (cls.trim()) anchor.classList.add(cls.trim());
        });
      }
      anchor.textContent = label;
      this.componentElement.appendChild(anchor);
      if (link) {
        this.removeAttribute("link");
      }
    } else {
      const labelElement = document.createElement("label");
      labelElement.classList.add("wc-field-label");
      if (labelClass) {
        labelClass.split(" ").forEach((cls) => {
          if (cls.trim()) labelElement.classList.add(cls.trim());
        });
      }
      labelElement.textContent = label;
      this.componentElement.appendChild(labelElement);
    }
    if (labelClass) {
      this.removeAttribute("label-class");
    }
  }
  _addHtmxAttributes(element) {
    const htmxAttrs = [
      "hx-get",
      "hx-post",
      "hx-put",
      "hx-delete",
      "hx-patch",
      "hx-target",
      "hx-swap",
      "hx-trigger",
      "hx-indicator",
      "hx-push-url",
      "hx-vals",
      "hx-include",
      "hx-confirm"
    ];
    htmxAttrs.forEach((attr) => {
      const value = this.getAttribute(attr);
      if (value !== null) {
        element.setAttribute(attr, value);
        this.removeAttribute(attr);
      }
    });
  }
  _applyStyle() {
    const style = `
      wc-field {
        display: contents;
      }

      wc-field .wc-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
        min-width: 0; /* Required for truncation to work in flex/grid containers */
      }

      wc-field .wc-field-label {
        display: block;
        font-weight: 500;
      }

      /* Only show pointer and hover effect on anchors (which only exist when link/hx-get is present) */
      wc-field a.wc-field-label {
        cursor: pointer;
      }

      wc-field a.wc-field-label:hover {
        opacity: 0.8;
      }

      wc-field .wc-field-value {
        min-height: 1.5em;
      }

      /* Default wrapping behavior - only when truncate is NOT applied */
      wc-field .wc-field-value:not(.truncate) {
        word-wrap: break-word;
        overflow-wrap: break-word;
      }

      /* Text alignment utilities (if not using utility classes) */
      wc-field[text-align="left"] .wc-field-value {
        text-align: left;
      }

      wc-field[text-align="center"] .wc-field-value {
        text-align: center;
      }

      wc-field[text-align="right"] .wc-field-value {
        text-align: right;
      }
    `.trim();
    this.loadStyle("wc-field-style", style);
  }
};
customElements.define("wc-field", WcField);

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
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
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

// src/js/components/wc-google-map.js
var WcGoogleMap = class _WcGoogleMap extends WcBaseComponent {
  static get observedAttributes() {
    return [
      "api-key",
      "lat",
      "lng",
      "address",
      "title",
      "zoom",
      "map-type",
      "center-lat",
      "center-lng",
      "draggable",
      "scrollwheel",
      "disable-default-ui",
      "class",
      "elt-class"
    ];
  }
  // Track if Google Maps API is loaded globally
  static isGoogleMapsLoaded = false;
  static googleMapsLoadPromise = null;
  constructor() {
    super();
    this.map = null;
    this.markers = [];
    this.infoWindows = [];
    this.mapElement = null;
    const compEl = this.querySelector(".wc-google-map");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-google-map");
      this.appendChild(this.componentElement);
    }
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    if (this._disconnectTimeout) {
      clearTimeout(this._disconnectTimeout);
      this._disconnectTimeout = null;
    }
    this._setupResizeHandling();
    if (this.map) {
      return;
    }
    try {
      await this._ensureGoogleMapsLoaded();
      await new Promise((resolve) => setTimeout(resolve, 100));
      await this._initializeMap();
    } catch (error) {
      console.error("wc-google-map: Error initializing map:", error);
      this._showError("Failed to load Google Maps. Please check your API key.");
    }
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._disconnectTimeout = setTimeout(() => {
      this._cleanup();
    }, 1e3);
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "api-key") {
      if (this.map) {
        this._initializeMap();
      }
    } else if (["lat", "lng", "address", "title"].includes(attrName)) {
      if (this.map) {
        this._updateSinglePin();
      }
    } else if (["zoom", "map-type", "center-lat", "center-lng"].includes(attrName)) {
      if (this.map) {
        this._updateMapConfig();
      }
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _render() {
    super._render();
    if (!this.mapElement) {
      this.mapElement = document.createElement("div");
      this.mapElement.classList.add("map-container");
      this.componentElement.innerHTML = "";
      this.componentElement.appendChild(this.mapElement);
    }
  }
  /**
   * Ensures Google Maps API is loaded only once across all instances
   */
  async _ensureGoogleMapsLoaded() {
    if (window.google && window.google.maps) {
      _WcGoogleMap.isGoogleMapsLoaded = true;
      return Promise.resolve();
    }
    if (_WcGoogleMap.googleMapsLoadPromise) {
      return _WcGoogleMap.googleMapsLoadPromise;
    }
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      _WcGoogleMap.googleMapsLoadPromise = new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkLoaded);
            _WcGoogleMap.isGoogleMapsLoaded = true;
            resolve();
          }
        }, 100);
      });
      return _WcGoogleMap.googleMapsLoadPromise;
    }
    const apiKey = this.getAttribute("api-key");
    if (!apiKey) {
      console.error("wc-google-map: api-key attribute is required");
      return Promise.reject("API key is required");
    }
    _WcGoogleMap.googleMapsLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=marker,places&loading=async&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        _WcGoogleMap.isGoogleMapsLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error("Failed to load Google Maps API"));
      };
      document.head.appendChild(script);
    });
    return _WcGoogleMap.googleMapsLoadPromise;
  }
  /**
   * Initialize the Google Map
   */
  async _initializeMap() {
    if (!window.google || !window.google.maps) {
      console.error("wc-google-map: Google Maps API not loaded");
      return;
    }
    if (!this.mapElement) {
      console.error("wc-google-map: Map container element not found");
      return;
    }
    const dimensions = {
      width: this.mapElement.offsetWidth,
      height: this.mapElement.offsetHeight
    };
    if (dimensions.width === 0 || dimensions.height === 0) {
      return;
    }
    const zoom = parseInt(this.getAttribute("zoom")) || 12;
    const mapType = this.getAttribute("map-type") || "roadmap";
    const draggable = this.hasAttribute("draggable") ? this.getAttribute("draggable") !== "false" : true;
    const scrollwheel = this.hasAttribute("scrollwheel") ? this.getAttribute("scrollwheel") !== "false" : true;
    const disableDefaultUI = this.hasAttribute("disable-default-ui");
    let center = { lat: 0, lng: 0 };
    const centerLat = this.getAttribute("center-lat");
    const centerLng = this.getAttribute("center-lng");
    if (centerLat && centerLng) {
      center = { lat: parseFloat(centerLat), lng: parseFloat(centerLng) };
    } else {
      const pins = this._getPins();
      if (pins.length > 0) {
        center = { lat: pins[0].lat, lng: pins[0].lng };
      }
    }
    const mapOptions = {
      center,
      zoom,
      mapTypeId: mapType,
      draggable,
      scrollwheel,
      disableDefaultUI,
      mapId: "WAVE_CSS_MAP"
      // Required for AdvancedMarkerElement
    };
    try {
      this.map = new google.maps.Map(this.mapElement, mapOptions);
      this.dispatchEvent(new CustomEvent("map-loaded", {
        detail: { map: this.map },
        bubbles: true
      }));
      this._addMapEventListeners();
      this._addPins();
    } catch (error) {
      console.error("wc-google-map: Error creating map:", error);
      this._showError("Error creating map: " + error.message);
    }
  }
  /**
   * Get pins from attributes or child option elements
   */
  _getPins() {
    const pins = [];
    const lat = this.getAttribute("lat");
    const lng = this.getAttribute("lng");
    if (lat && lng) {
      pins.push({
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: this.getAttribute("address") || "",
        title: this.getAttribute("title") || this.getAttribute("address") || "Location"
      });
    }
    const options = this.querySelectorAll("option");
    options.forEach((option) => {
      const optLat = option.getAttribute("data-lat");
      const optLng = option.getAttribute("data-lng");
      if (optLat && optLng) {
        pins.push({
          lat: parseFloat(optLat),
          lng: parseFloat(optLng),
          address: option.getAttribute("data-address") || "",
          title: option.getAttribute("data-title") || option.getAttribute("data-address") || "Location"
        });
      }
    });
    return pins;
  }
  /**
   * Add pins to the map
   */
  _addPins() {
    if (!this.map) return;
    this._clearMarkers();
    const pins = this._getPins();
    if (pins.length === 0) {
      return;
    }
    pins.forEach((pin, index) => {
      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: pin.lat, lng: pin.lng },
        map: this.map,
        title: pin.title
      });
      this.markers.push(marker);
      const infoWindow = new google.maps.InfoWindow({
        content: `<div class="map-info-window">
          ${pin.title ? `<strong>${pin.title}</strong><br>` : ""}
          ${pin.address || ""}
        </div>`
      });
      this.infoWindows.push(infoWindow);
      marker.addListener("click", () => {
        this.infoWindows.forEach((iw) => iw.close());
        infoWindow.open(this.map, marker);
        this.dispatchEvent(new CustomEvent("pin-clicked", {
          detail: {
            pin,
            marker,
            index
          },
          bubbles: true
        }));
      });
    });
    if (pins.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      pins.forEach((pin) => {
        bounds.extend({ lat: pin.lat, lng: pin.lng });
      });
      this.map.fitBounds(bounds);
    } else if (pins.length === 1) {
      this.map.setCenter({ lat: pins[0].lat, lng: pins[0].lng });
    }
  }
  /**
   * Clear all markers from the map
   */
  _clearMarkers() {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers = [];
    this.infoWindows.forEach((iw) => iw.close());
    this.infoWindows = [];
  }
  /**
   * Update single pin (when attributes change)
   */
  _updateSinglePin() {
    this._addPins();
  }
  /**
   * Update map configuration
   */
  _updateMapConfig() {
    if (!this.map) return;
    const zoom = parseInt(this.getAttribute("zoom"));
    const mapType = this.getAttribute("map-type");
    const centerLat = this.getAttribute("center-lat");
    const centerLng = this.getAttribute("center-lng");
    if (zoom && !isNaN(zoom)) {
      this.map.setZoom(zoom);
    }
    if (mapType) {
      this.map.setMapTypeId(mapType);
    }
    if (centerLat && centerLng) {
      this.map.setCenter({
        lat: parseFloat(centerLat),
        lng: parseFloat(centerLng)
      });
    }
  }
  /**
   * Add event listeners for map interactions
   */
  _addMapEventListeners() {
    if (!this.map) return;
    this.map.addListener("click", (e) => {
      this.dispatchEvent(new CustomEvent("map-clicked", {
        detail: {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
          event: e
        },
        bubbles: true
      }));
    });
    this.map.addListener("center_changed", () => {
      const center = this.map.getCenter();
      this.dispatchEvent(new CustomEvent("center-changed", {
        detail: {
          lat: center.lat(),
          lng: center.lng()
        },
        bubbles: true
      }));
    });
    this.map.addListener("zoom_changed", () => {
      this.dispatchEvent(new CustomEvent("zoom-changed", {
        detail: {
          zoom: this.map.getZoom()
        },
        bubbles: true
      }));
    });
    this.map.addListener("bounds_changed", () => {
      const bounds = this.map.getBounds();
      if (bounds) {
        this.dispatchEvent(new CustomEvent("bounds-changed", {
          detail: {
            bounds
          },
          bubbles: true
        }));
      }
    });
    this.map.addListener("dragstart", () => {
      this.dispatchEvent(new CustomEvent("drag-start", {
        bubbles: true
      }));
    });
    this.map.addListener("drag", () => {
      this.dispatchEvent(new CustomEvent("dragging", {
        bubbles: true
      }));
    });
    this.map.addListener("dragend", () => {
      this.dispatchEvent(new CustomEvent("drag-end", {
        bubbles: true
      }));
    });
  }
  /**
   * Public API: Add a pin dynamically
   */
  addPin(lat, lng, address, title) {
    const option = document.createElement("option");
    option.setAttribute("data-lat", lat);
    option.setAttribute("data-lng", lng);
    option.setAttribute("data-address", address || "");
    option.setAttribute("data-title", title || address || "Location");
    this.appendChild(option);
    if (this.map) {
      this._addPins();
    }
  }
  /**
   * Public API: Clear all pins
   */
  clearPins() {
    this.querySelectorAll("option").forEach((opt) => opt.remove());
    this.removeAttribute("lat");
    this.removeAttribute("lng");
    this.removeAttribute("address");
    this.removeAttribute("title");
    this._clearMarkers();
  }
  /**
   * Public API: Update pins programmatically
   * @param {Array} pins - Array of pin objects with lat, lng, title, address properties
   */
  updatePins(pins) {
    if (!Array.isArray(pins)) {
      console.error("wc-google-map: updatePins expects an array of pin objects");
      return;
    }
    this.clearPins();
    if (pins.length === 1) {
      const pin = pins[0];
      this.setAttribute("lat", pin.lat);
      this.setAttribute("lng", pin.lng);
      if (pin.title) this.setAttribute("title", pin.title);
      if (pin.address) this.setAttribute("address", pin.address);
    } else if (pins.length > 1) {
      pins.forEach((pin) => {
        const option = document.createElement("option");
        option.setAttribute("data-lat", pin.lat);
        option.setAttribute("data-lng", pin.lng);
        if (pin.title) option.setAttribute("data-title", pin.title);
        if (pin.address) option.setAttribute("data-address", pin.address);
        this.appendChild(option);
      });
    }
    if (this.map) {
      this._addPins();
    }
  }
  /**
   * Public API: Get current map instance
   */
  getMap() {
    return this.map;
  }
  /**
   * Public API: Get all markers
   */
  getMarkers() {
    return this.markers;
  }
  /**
   * Cleanup
   */
  _cleanup() {
    this._clearMarkers();
    this.map = null;
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
  }
  /**
   * Setup resize handling for HTMX and dynamic content
   */
  _setupResizeHandling() {
    if (typeof ResizeObserver !== "undefined" && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this._handleResize();
      });
      this.resizeObserver.observe(this.mapElement);
    }
    document.body.addEventListener("htmx:afterSettle", () => {
      setTimeout(() => this._handleResize(), 50);
    });
    if (typeof IntersectionObserver !== "undefined") {
      const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            this._handleResize();
          }
        });
      });
      visibilityObserver.observe(this);
    }
  }
  /**
   * Handle map resize
   */
  _handleResize() {
    const width = this.mapElement.offsetWidth;
    const height = this.mapElement.offsetHeight;
    if (!this.map && width > 0 && height > 0) {
      this._initializeMap();
      return;
    }
    if (this.map && width > 0 && height > 0) {
      google.maps.event.trigger(this.map, "resize");
      const center = this.map.getCenter();
      if (center) {
        this.map.setCenter(center);
      }
    }
  }
  /**
   * Show error message in map container
   */
  _showError(message) {
    if (this.mapElement) {
      this.mapElement.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; height: 100%; padding: 2rem; text-align: center; background: var(--surface-2); color: var(--text-1);">
          <div>
            <p style="font-weight: bold; margin-bottom: 0.5rem;">\u26A0\uFE0F Map Error</p>
            <p>${message}</p>
          </div>
        </div>
      `;
    }
  }
  _applyStyle() {
    const style = `
      wc-google-map {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 150px;
      }

      wc-google-map .wc-google-map {
        width: 100%;
        height: 100%;
        min-height: 150px;
        position: relative;
      }

      wc-google-map .map-container {
        width: 100%;
        height: 100%;
        border-radius: 0.375rem;
        overflow: hidden;
      }

      /* Info window styling */
      .map-info-window {
        padding: 0.5rem;
        font-family: inherit;
        color: var(--text-1);
      }

      .map-info-window strong {
        display: block;
        margin-bottom: 0.25rem;
        color: var(--text-1);
      }

      /* Hide option elements */
      wc-google-map option {
        display: none;
      }
    `.trim();
    this.loadStyle("wc-google-map-style", style);
  }
};
customElements.define("wc-google-map", WcGoogleMap);

// src/js/components/wc-google-address.js
var WcGoogleAddress = class _WcGoogleAddress extends WcBaseFormComponent {
  static get is() {
    return "wc-google-address";
  }
  static get observedAttributes() {
    return [
      "name",
      "id",
      "class",
      "value",
      "placeholder",
      "lbl-label",
      "lbl-class",
      "elt-class",
      "disabled",
      "readonly",
      "required",
      "autocomplete",
      "api-key",
      "address-group",
      "target-map",
      "countries",
      "types",
      "fields",
      "icon-name",
      "data-lat",
      "data-lng",
      "data-address",
      "onchange",
      "oninput",
      "onblur",
      "onfocus",
      "tooltip",
      "tooltip-position"
    ];
  }
  // Static property to track if Google Places API is loaded
  static isGooglePlacesLoaded = false;
  static googlePlacesLoadPromise = null;
  constructor() {
    super();
    this.passThruAttributes = ["name", "id", "value", "placeholder", "autocomplete"];
    this.passThruEmptyAttributes = ["disabled", "readonly", "required"];
    this.ignoreAttributes = [
      "lbl-class",
      "lbl-label",
      "api-key",
      "address-group",
      "target-map",
      "countries",
      "types",
      "fields",
      "icon-name",
      "data-lat",
      "data-lng",
      "data-address"
    ];
    this.eventAttributes = ["onchange", "oninput", "onblur", "onfocus"];
    const compEl = this.querySelector(".wc-google-address");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-google-address", "relative");
      this.appendChild(this.componentElement);
    }
    this.sessionToken = null;
    this.selectedPlace = null;
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    const apiKey = this.getAttribute("api-key");
    if (!apiKey) {
      console.error("wc-google-address: api-key attribute is required");
      return;
    }
    await this._loadGooglePlacesAPI(apiKey);
    this._initializeAutocomplete();
    this._updateMapFromInitialData();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
    this.sessionToken = null;
    this.selectedPlace = null;
  }
  async _loadGooglePlacesAPI(apiKey) {
    if (window.google?.maps) {
      if (window.google.maps.places) {
        _WcGoogleAddress.isGooglePlacesLoaded = true;
        return Promise.resolve();
      }
      console.warn("wc-google-address: Google Maps API is loaded but places library is missing. You may need to include libraries=places in the initial load.");
      return Promise.resolve();
    }
    if (_WcGoogleAddress.isGooglePlacesLoaded) {
      return Promise.resolve();
    }
    if (_WcGoogleAddress.googlePlacesLoadPromise) {
      return _WcGoogleAddress.googlePlacesLoadPromise;
    }
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      _WcGoogleAddress.googlePlacesLoadPromise = new Promise((resolve) => {
        const checkLoaded = setInterval(() => {
          if (window.google?.maps) {
            clearInterval(checkLoaded);
            _WcGoogleAddress.isGooglePlacesLoaded = true;
            resolve();
          }
        }, 100);
      });
      return _WcGoogleAddress.googlePlacesLoadPromise;
    }
    _WcGoogleAddress.googlePlacesLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,marker&loading=async&v=weekly`;
      script.async = true;
      script.defer = true;
      script.onload = () => {
        const checkPlacesReady = setInterval(() => {
          if (window.google?.maps?.places) {
            clearInterval(checkPlacesReady);
            _WcGoogleAddress.isGooglePlacesLoaded = true;
            resolve();
          }
        }, 50);
        setTimeout(() => {
          clearInterval(checkPlacesReady);
          if (!_WcGoogleAddress.isGooglePlacesLoaded) {
            reject(new Error("Timeout waiting for Google Places API"));
          }
        }, 1e4);
      };
      script.onerror = () => {
        const error = new Error("Failed to load Google Places API");
        console.error("\u274C", error);
        reject(error);
      };
      document.head.appendChild(script);
    });
    return _WcGoogleAddress.googlePlacesLoadPromise;
  }
  _initializeAutocomplete() {
    if (!window.google?.maps?.places) {
      setTimeout(() => this._initializeAutocomplete(), 100);
      return;
    }
    this.sessionToken = new google.maps.places.AutocompleteSessionToken();
    this._autocompleteInitialized = true;
  }
  _wireEvents() {
    super._wireEvents();
    if (!this.formElement) return;
    if (this._autocompleteEventsWired) return;
    this._autocompleteEventsWired = true;
    this._suggestionsContainer = this.querySelector(".address-suggestions");
    if (!this._suggestionsContainer) {
      this._suggestionsContainer = document.createElement("div");
      this._suggestionsContainer.classList.add("address-suggestions");
      this.componentElement.appendChild(this._suggestionsContainer);
    }
    let debounceTimer;
    const debounce = (func, delay) => {
      return (...args) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => func.apply(this, args), delay);
      };
    };
    this._handleInputDebounced = debounce((e) => {
      const input2 = e.target.value.trim();
      if (input2.length < 3) {
        this._hideSuggestions(this._suggestionsContainer);
        return;
      }
      this._fetchSuggestions(input2, this._suggestionsContainer);
    }, 300);
    this.formElement.addEventListener("input", this._handleInputDebounced);
    this._handleKeydown = (e) => {
      const suggestions = this._suggestionsContainer.querySelectorAll(".address-suggestion-item");
      if (suggestions.length === 0) return;
      const currentIndex = Array.from(suggestions).findIndex(
        (item) => item.classList.contains("highlighted")
      );
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          let nextIndex;
          if (currentIndex === -1) {
            nextIndex = 0;
          } else if (currentIndex < suggestions.length - 1) {
            nextIndex = currentIndex + 1;
          } else {
            nextIndex = 0;
          }
          this._highlightSuggestion(suggestions, nextIndex);
          break;
        case "ArrowUp":
          e.preventDefault();
          let prevIndex;
          if (currentIndex === -1) {
            prevIndex = suggestions.length - 1;
          } else if (currentIndex > 0) {
            prevIndex = currentIndex - 1;
          } else {
            prevIndex = suggestions.length - 1;
          }
          this._highlightSuggestion(suggestions, prevIndex);
          break;
        case "Enter":
          if (currentIndex >= 0) {
            e.preventDefault();
            const placeId = suggestions[currentIndex].dataset.placeId;
            this._selectPlace(placeId);
            this._hideSuggestions(this._suggestionsContainer);
          }
          break;
        case "Escape":
          e.preventDefault();
          this._hideSuggestions(this._suggestionsContainer);
          break;
      }
    };
    this.formElement.addEventListener("keydown", this._handleKeydown);
    this._handleDocumentClick = (e) => {
      if (!this.contains(e.target)) {
        this._hideSuggestions(this._suggestionsContainer);
      }
    };
    document.addEventListener("click", this._handleDocumentClick);
    this._handleBlur = () => {
      setTimeout(() => {
        if (!this.querySelector(".address-suggestions:hover")) {
          this._hideSuggestions(this._suggestionsContainer);
        }
      }, 200);
    };
    this.formElement.addEventListener("blur", this._handleBlur);
  }
  _unWireEvents() {
    super._unWireEvents();
    if (this.formElement) {
      if (this._handleInputDebounced) {
        this.formElement.removeEventListener("input", this._handleInputDebounced);
      }
      if (this._handleKeydown) {
        this.formElement.removeEventListener("keydown", this._handleKeydown);
      }
      if (this._handleBlur) {
        this.formElement.removeEventListener("blur", this._handleBlur);
      }
    }
    if (this._handleDocumentClick) {
      document.removeEventListener("click", this._handleDocumentClick);
    }
    if (this._suggestionsContainer) {
      this._suggestionsContainer.remove();
      this._suggestionsContainer = null;
    }
    this._autocompleteEventsWired = false;
  }
  async _fetchSuggestions(input2, container2) {
    const request = {
      input: input2,
      sessionToken: this.sessionToken
    };
    const countries = this.getAttribute("countries");
    if (countries) {
      request.includedRegionCodes = countries.split(",").map((c) => c.trim());
    }
    const types = this.getAttribute("types");
    if (types && types !== "address") {
      request.includedPrimaryTypes = types.split(",").map((t) => t.trim()).filter((t) => t !== "address");
      if (request.includedPrimaryTypes.length === 0) {
        delete request.includedPrimaryTypes;
      }
    }
    try {
      const { suggestions } = await google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
      if (!suggestions || suggestions.length === 0) {
        this._hideSuggestions(container2);
        return;
      }
      this._displaySuggestions(suggestions, container2);
    } catch (error) {
      console.error("wc-google-address: Error fetching suggestions:", error);
      this._hideSuggestions(container2);
    }
  }
  _displaySuggestions(suggestions, container2) {
    container2.innerHTML = "";
    container2.classList.remove("hidden");
    suggestions.forEach((suggestion) => {
      const item = document.createElement("div");
      item.classList.add("address-suggestion-item");
      item.textContent = suggestion.placePrediction.text;
      item.dataset.placeId = suggestion.placePrediction.placeId;
      item.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this._selectPlace(suggestion.placePrediction.placeId);
        this._hideSuggestions(container2);
      });
      container2.appendChild(item);
    });
  }
  _hideSuggestions(container2) {
    container2.classList.add("hidden");
    container2.innerHTML = "";
  }
  _highlightSuggestion(suggestions, index) {
    suggestions.forEach((item) => item.classList.remove("highlighted"));
    if (suggestions[index]) {
      suggestions[index].classList.add("highlighted");
      suggestions[index].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }
  async _selectPlace(placeId) {
    const fields = this.getAttribute("fields") || "addressComponents,formattedAddress,location,displayName";
    try {
      const place = new google.maps.places.Place({
        id: placeId,
        requestedLanguage: "en",
        requestedRegion: "US"
      });
      const fieldsList = fields.split(",").map((f) => f.trim());
      await place.fetchFields({
        fields: fieldsList
      });
      if (!place) {
        console.error("wc-google-address: Failed to get place details");
        return;
      }
      this.sessionToken = new google.maps.places.AutocompleteSessionToken();
      this._processPlaceResult(place);
    } catch (error) {
      console.error("wc-google-address: Error fetching place details:", error);
    }
  }
  _processPlaceResult(place) {
    const addressData = this._parseAddressComponents(place);
    if (this.formElement) {
      this.formElement.value = addressData.street;
    }
    this.selectedPlace = addressData;
    this._broadcastAddressChange(addressData);
    const targetMap = this.getAttribute("target-map");
    if (targetMap) {
      this._updateMap(targetMap, addressData);
    }
    if (this.formElement) {
      this.formElement.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  _parseAddressComponents(place) {
    const components = place.addressComponents || [];
    const location2 = place.location;
    const formattedAddress = place.formattedAddress || "";
    const addressData = {
      addressGroup: this.getAttribute("address-group") || "address",
      street: "",
      city: "",
      state: "",
      postal_code: "",
      county: "",
      country: "",
      lat: location2 ? location2.lat() : null,
      lng: location2 ? location2.lng() : null,
      formatted_address: formattedAddress,
      formatted_address_encoded: encodeURIComponent(formattedAddress),
      formatted_address_slug: this._createAddressSlug(formattedAddress),
      place_id: place.id || ""
    };
    let streetNumber = "";
    let route = "";
    components.forEach((component) => {
      const types = component.types;
      if (types.includes("street_number")) {
        streetNumber = component.longText;
      }
      if (types.includes("route")) {
        route = component.longText;
      }
      if (types.includes("locality")) {
        addressData.city = component.longText;
      }
      if (types.includes("administrative_area_level_1")) {
        addressData.state = component.shortText;
      }
      if (types.includes("administrative_area_level_2")) {
        addressData.county = component.longText;
      }
      if (types.includes("postal_code")) {
        addressData.postal_code = component.longText;
      }
      if (types.includes("country")) {
        addressData.country = component.shortText;
      }
    });
    addressData.street = [streetNumber, route].filter(Boolean).join(" ");
    return addressData;
  }
  _createAddressSlug(formattedAddress) {
    if (!formattedAddress) return "";
    return formattedAddress.replace(/,?\s*(USA|United States|US)$/i, "").replace(/,/g, "").replace(/\s+/g, " ").trim().replace(/\s/g, "-");
  }
  _broadcastAddressChange(addressData) {
    const event = "google-address:change";
    const customEvent = new CustomEvent(event, {
      detail: addressData,
      bubbles: true,
      composed: true
    });
    document.dispatchEvent(customEvent);
    if (window.wc?.EventHub) {
      wc.EventHub.broadcast(event, [], addressData);
    }
  }
  _updateMap(targetMapId, addressData) {
    if (!addressData.lat || !addressData.lng) return;
    const mapElement = document.getElementById(targetMapId);
    if (!mapElement || mapElement.tagName.toLowerCase() !== "wc-google-map") {
      console.warn(`wc-google-address: Map element with id "${targetMapId}" not found`);
      return;
    }
    mapElement.setAttribute("lat", addressData.lat);
    mapElement.setAttribute("lng", addressData.lng);
    mapElement.setAttribute("address", addressData.formatted_address);
  }
  _updateMapFromInitialData() {
    const lat = this.getAttribute("data-lat");
    const lng = this.getAttribute("data-lng");
    const targetMap = this.getAttribute("target-map");
    if (!lat || !lng || !targetMap) {
      return;
    }
    const mapElement = document.getElementById(targetMap);
    if (!mapElement) {
      return;
    }
    const pins = [{
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      title: this.getAttribute("data-address") || this.getAttribute("value") || ""
    }];
    mapElement.addEventListener("map-loaded", () => {
      if (mapElement.updatePins) {
        mapElement.updatePins(pins);
      }
    }, { once: true });
  }
  _handleAttributeChange(attrName, newValue) {
    if (this.eventAttributes.includes(attrName)) {
      if (this.formElement && newValue) {
        const eventHandler = new Function("event", `
          const element = event.target;
          const value = element.value;
          with (element) {
            ${newValue}
          }
        `);
        const eventName = attrName.substring(2);
        this.formElement.addEventListener(eventName, eventHandler);
      }
      return;
    }
    if (this.passThruAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, newValue);
      return;
    }
    if (this.passThruEmptyAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, "");
      return;
    }
    if (this.ignoreAttributes.includes(attrName)) {
      return;
    }
    if (attrName === "tooltip" || attrName === "tooltip-position") {
      this._createTooltipElement();
      return;
    }
    if (attrName === "lbl-class") {
      const name = this.getAttribute("name");
      const lbl = this.querySelector(`label[for="${name}"]`);
      lbl?.classList.add(newValue);
      return;
    }
    if (attrName === "api-key") {
      this._loadGooglePlacesAPI(newValue).then(() => {
        this._initializeAutocomplete();
      });
      return;
    }
    super._handleAttributeChange(attrName, newValue);
  }
  _render() {
    const name = this.getAttribute("name") || "address";
    const lblLabel = this.getAttribute("lbl-label") || "";
    const placeholder = this.getAttribute("placeholder") || "Start typing an address...";
    const value = this.getAttribute("value") || "";
    this.componentElement.innerHTML = "";
    if (lblLabel) {
      const label = document.createElement("label");
      label.setAttribute("for", name);
      label.textContent = lblLabel;
      this.componentElement.appendChild(label);
    }
    this.formElement = document.createElement("input");
    this.formElement.setAttribute("type", "text");
    this.formElement.setAttribute("name", name);
    this.formElement.setAttribute("id", name);
    this.formElement.setAttribute("form-element", "");
    this.formElement.setAttribute("class", "form-control");
    this.formElement.setAttribute("placeholder", placeholder);
    this.formElement.setAttribute("autocomplete", "off");
    if (value) {
      this.formElement.value = value;
    }
    const eltClass = this.getAttribute("elt-class");
    if (eltClass) {
      this.formElement.setAttribute("class", eltClass);
    }
    this.componentElement.appendChild(this.formElement);
    const iconName = this.getAttribute("icon-name") || "house";
    const icon = document.createElement("wc-fa-icon");
    icon.setAttribute("name", iconName);
    icon.setAttribute("icon-style", "solid");
    icon.setAttribute("size", "1rem");
    icon.classList.add("address-icon");
    this.componentElement.appendChild(icon);
    this.labelElement = this.componentElement.querySelector("label");
  }
  _applyStyle() {
    const style = `
      wc-google-address {
        display: contents;
      }

      /* Match wc-input styling with icon */
      wc-google-address input[type="text"] {
        padding-left: 30px;
        min-width: 120px;
      }

      wc-google-address wc-fa-icon.address-icon {
        position: absolute;
        top: 50%;
        left: 5px;
        pointer-events: none;
        align-items: center;
        justify-content: center;
      }

      /* Match wc-input focus styling exactly */
      wc-google-address input:focus {
        outline: none;
        border-color: var(--focus-border-color, #3b82f6);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }

      /* Dropdown suggestions - improved visibility */
      .address-suggestions {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        margin-top: 2px;
        background: white;
        /* border: 2px solid var(--focus-border-color, #3b82f6); */
        border-radius: 0.375rem;
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      }

      .address-suggestions.hidden {
        display: none;
      }

      /* Suggestion items - improved contrast */
      .address-suggestion-item {
        padding: 0.875rem 1rem;
        cursor: pointer;
        border-bottom: 1px solid var(--border-color, #e5e7eb);
        transition: all 0.15s ease;
        font-size: 0.95rem;
        color: #1f2937;
      }

      .address-suggestion-item:last-child {
        border-bottom: none;
      }

      .address-suggestion-item:hover {
        background-color: var(--hover-bg-color, #f3f4f6);
      }

      /* Highlighted state for keyboard navigation - more prominent */
      .address-suggestion-item.highlighted {
        background-color: var(--highlight-bg-color, #3b82f6);
        color: white;
        font-weight: 500;
      }
    `.trim();
    this.loadStyle("wc-google-address-style", style);
  }
  // Getter for form value
  get value() {
    return this.formElement?.value || "";
  }
  // Setter for form value
  set value(val) {
    if (this.formElement) {
      this.formElement.value = val;
    }
  }
  // Get full selected place data
  getPlaceData() {
    return this.selectedPlace;
  }
};
customElements.define(WcGoogleAddress.is, WcGoogleAddress);

// src/js/components/wc-address-listener.js
var WcAddressListener = class extends WcBaseComponent {
  static get is() {
    return "wc-address-listener";
  }
  static get observedAttributes() {
    return ["address-group"];
  }
  constructor() {
    super();
    this.boundHandleAddressChange = this._handleAddressChange.bind(this);
  }
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("google-address:change", this.boundHandleAddressChange);
    this._setupDirectListeners();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("google-address:change", this.boundHandleAddressChange);
  }
  _setupDirectListeners() {
    const listenableElements = this.querySelectorAll("[address-listener]");
    listenableElements.forEach((element) => {
      if (!element._addressListenerSetup) {
        element._addressListenerSetup = true;
        element._handleDirectAddressChange = (event) => {
          const listenerGroup = element.getAttribute("address-listener");
          const addressData = event.detail;
          if (addressData.addressGroup === listenerGroup) {
            this._updateFieldValue(element, addressData);
          }
        };
        document.addEventListener("google-address:change", element._handleDirectAddressChange);
      }
    });
  }
  _handleAddressChange(event) {
    const addressData = event.detail;
    const targetGroup = this.getAttribute("address-group");
    if (!targetGroup || addressData.addressGroup !== targetGroup) {
      return;
    }
    this._updateChildFields(addressData);
  }
  _updateChildFields(addressData) {
    const formFields = this.querySelectorAll("wc-input, wc-select, input, select");
    formFields.forEach((field) => {
      this._updateFieldValue(field, addressData);
    });
  }
  _updateFieldValue(field, addressData) {
    const fieldName = field.getAttribute("name");
    if (!fieldName) return;
    const fieldMapping = this._getFieldMapping(fieldName);
    if (!fieldMapping) return;
    const newValue = addressData[fieldMapping];
    if (newValue === void 0 || newValue === null) return;
    if (field.tagName.toLowerCase() === "wc-input" || field.tagName.toLowerCase() === "wc-select") {
      field.value = newValue;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    } else if (field.tagName.toLowerCase() === "input" || field.tagName.toLowerCase() === "select") {
      field.value = newValue;
      field.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  _getFieldMapping(fieldName) {
    const parts = fieldName.split(".");
    const fieldKey = parts[parts.length - 1];
    const mappings = {
      "street": "street",
      "address": "street",
      "address1": "street",
      "address_1": "street",
      "apt": "apt_suite",
      "apt_suite": "apt_suite",
      "suite": "apt_suite",
      "address2": "apt_suite",
      "address_2": "apt_suite",
      "city": "city",
      "state": "state",
      "province": "state",
      "postal_code": "postal_code",
      "postalcode": "postal_code",
      "zip": "postal_code",
      "zipcode": "postal_code",
      "zip_code": "postal_code",
      "county": "county",
      "country": "country",
      "lat": "lat",
      "latitude": "lat",
      "lng": "lng",
      "lon": "lng",
      "longitude": "lng",
      "formatted_address": "formatted_address",
      "formatted_address_encoded": "formatted_address_encoded",
      "formatted_address_slug": "formatted_address_slug",
      "formattedaddress": "formatted_address",
      "formattedaddressencoded": "formatted_address_encoded",
      "formattedaddressslug": "formatted_address_slug",
      "place_id": "place_id",
      "placeid": "place_id"
    };
    return mappings[fieldKey.toLowerCase()] || null;
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "address-group") {
    }
  }
  _render() {
    if (!this.querySelector("slot")) {
      const slot = document.createElement("slot");
      this.appendChild(slot);
    }
  }
};
customElements.define(WcAddressListener.is, WcAddressListener);

// src/js/components/wc-vin-decoder.js
var WcVinDecoder = class _WcVinDecoder extends WcBaseFormComponent {
  static get is() {
    return "wc-vin-decoder";
  }
  static get observedAttributes() {
    return [
      "name",
      "value",
      "api-url",
      "database-endpoint",
      "lbl-label",
      "lbl-class",
      "placeholder",
      "required",
      "disabled",
      "readonly",
      "tooltip",
      "tooltip-position",
      "class",
      "elt-class",
      "vehicle-type",
      "autocomplete",
      "autocapitalize",
      "spellcheck",
      "inputmode",
      "pattern",
      "minlength",
      "maxlength",
      "onchange",
      "oninput",
      "onblur",
      "onfocus"
    ];
  }
  static get icons() {
    return [
      {
        name: "auto",
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path d="M199.2 181.4L173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160C215.8 160 203.7 168.6 199.2 181.4zM103.6 260.8L138.8 160.3C152.3 121.8 188.6 96 229.4 96L410.6 96C451.4 96 487.7 121.8 501.2 160.3L536.4 260.8C559.6 270.4 576 293.3 576 320L576 512C576 529.7 561.7 544 544 544L512 544C494.3 544 480 529.7 480 512L480 480L160 480L160 512C160 529.7 145.7 544 128 544L96 544C78.3 544 64 529.7 64 512L64 320C64 293.3 80.4 270.4 103.6 260.8zM192 368C192 350.3 177.7 336 160 336C142.3 336 128 350.3 128 368C128 385.7 142.3 400 160 400C177.7 400 192 385.7 192 368zM480 400C497.7 400 512 385.7 512 368C512 350.3 497.7 336 480 336C462.3 336 448 350.3 448 368C448 385.7 462.3 400 480 400z"/>
          </svg>
        `.trim()
      },
      {
        name: "auto-dualtone",
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path opacity=".4" d="M64 480L64 512C64 529.7 78.3 544 96 544L128 544C145.7 544 160 529.7 160 512L160 480L64 480zM173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160C215.8 160 203.7 168.6 199.2 181.4L173.1 256zM480 480L480 512C480 529.7 494.3 544 512 544L544 544C561.7 544 576 529.7 576 512L576 480L480 480z"/><path d="M160 480L64 480L64 320C64 293.3 80.4 270.4 103.6 260.8L138.8 160.3C152.3 121.8 188.6 96 229.4 96L410.6 96C451.4 96 487.7 121.8 501.2 160.3L536.4 260.8C559.6 270.4 576 293.3 576 320L576 480L160 480zM229.4 160C215.8 160 203.7 168.6 199.2 181.4L173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160zM160 400C177.7 400 192 385.7 192 368C192 350.3 177.7 336 160 336C142.3 336 128 350.3 128 368C128 385.7 142.3 400 160 400zM512 368C512 350.3 497.7 336 480 336C462.3 336 448 350.3 448 368C448 385.7 462.3 400 480 400C497.7 400 512 385.7 512 368z"/>
          </svg>
        `.trim()
      },
      {
        name: "motorcycle",
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path d="M280 80C266.7 80 256 90.7 256 104C256 117.3 266.7 128 280 128L336.6 128L359.1 176.7L264 248C230.6 222.9 189 208 144 208L88 208C74.7 208 64 218.7 64 232C64 245.3 74.7 256 88 256L144 256C222.5 256 287.2 315.6 295.2 392L269.8 392C258.6 332.8 206.5 288 144 288C73.3 288 16 345.3 16 416C16 486.7 73.3 544 144 544C206.5 544 258.5 499.2 269.8 440L320 440C333.3 440 344 429.3 344 416L344 393.5C344 348.4 369.7 308.1 409.5 285.8L421.6 311.9C389.2 335.1 368.1 373.1 368.1 416C368.1 486.7 425.4 544 496.1 544C566.8 544 624.1 486.7 624.1 416C624.1 345.3 566.8 288 496.1 288C485.4 288 475.1 289.3 465.2 291.8L433.8 224L488 224C501.3 224 512 213.3 512 200L512 152C512 138.7 501.3 128 488 128L434.7 128C427.8 128 421 130.2 415.5 134.4L398.4 147.2L373.8 93.9C369.9 85.4 361.4 80 352 80L280 80zM445.8 364.4L474.2 426C479.8 438 494 443.3 506 437.7C518 432.1 523.3 417.9 517.7 405.9L489.2 344.3C491.4 344.1 493.6 344 495.9 344C535.7 344 567.9 376.2 567.9 416C567.9 455.8 535.7 488 495.9 488C456.1 488 423.9 455.8 423.9 416C423.9 395.8 432.2 377.5 445.7 364.4zM144 488C104.2 488 72 455.8 72 416C72 376.2 104.2 344 144 344C175.3 344 202 364 211.9 392L144 392C130.7 392 120 402.7 120 416C120 429.3 130.7 440 144 440L211.9 440C202 468 175.3 488 144 488z"/>
          </svg>
        `.trim()
      },
      {
        name: "motorcycle-dualtone",
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path opacity=".4" d="M16 416C16 345.3 73.3 288 144 288C206.5 288 258.5 332.8 269.8 392L211.9 392C202 364 175.3 344 144 344C104.2 344 72 376.2 72 416C72 455.8 104.2 488 144 488C175.3 488 202 468 211.9 440L269.8 440C258.6 499.2 206.5 544 144 544C73.3 544 16 486.7 16 416zM368 416C368 373.1 389.1 335.1 421.5 311.9L445.7 364.4C432.3 377.5 423.9 395.8 423.9 416C423.9 455.8 456.1 488 495.9 488C535.7 488 567.9 455.8 567.9 416C567.9 376.2 535.7 344 495.9 344C493.7 344 491.4 344.1 489.2 344.3L464.9 291.8C474.8 289.3 485.2 288 495.8 288C566.5 288 623.8 345.3 623.8 416C623.8 486.7 566.5 544 495.8 544C425.1 544 367.8 486.7 367.8 416z"/><path d="M256 104C256 90.7 266.7 80 280 80L352 80C361.4 80 369.9 85.4 373.8 93.9L398.4 147.2L415.5 134.4C421 130.2 427.8 128 434.7 128L488 128C501.3 128 512 138.7 512 152L512 200C512 213.3 501.3 224 488 224L433.8 224L517.8 405.9C523.4 417.9 518.1 432.2 506.1 437.7C494.1 443.2 479.8 438 474.3 426L409.5 285.8C369.7 308.1 344 348.4 344 393.5L344 416C344 429.3 333.3 440 320 440L144 440C130.7 440 120 429.3 120 416C120 402.7 130.7 392 144 392L295.2 392C287.2 315.6 222.6 256 144 256L88 256C74.7 256 64 245.3 64 232C64 218.7 74.7 208 88 208L144 208C189 208 230.6 222.9 264 248L359.1 176.7L336.6 128L280 128C266.7 128 256 117.3 256 104z"/>
          </svg>
        `.trim()
      }
    ];
  }
  constructor() {
    super();
    this.passThruAttributes = [
      "placeholder",
      "autocomplete",
      "autocapitalize",
      "spellcheck",
      "inputmode",
      "pattern",
      "minlength",
      "maxlength"
    ];
    this.passThruEmptyAttributes = [
      "required",
      "disabled",
      "readonly",
      "autofocus"
    ];
    this.ignoreAttributes = [
      "api-url",
      "database-endpoint",
      "tooltip",
      "tooltip-position",
      "lbl-label",
      "lbl-class",
      "elt-class",
      "vehicle-type"
    ];
    this.eventAttributes = [
      "onchange",
      "oninput",
      "onblur",
      "onfocus"
    ];
    const compEl = this.querySelector(".wc-vin-decoder");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-vin-decoder", "relative");
      this.appendChild(this.componentElement);
    }
    this.apiUrl = "https://vin-decoder-ligipcg4jq-uc.a.run.app";
    this.databaseEndpoint = null;
    this.isDecoding = false;
    this.lastDecodedVin = null;
    this.cachedData = null;
    this.formElement = null;
    this.spinnerIcon = null;
    this.labelElement = null;
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _render() {
    super._render();
    const innerEl = this.querySelector(".wc-vin-decoder > *");
    if (innerEl) {
    } else {
      this.componentElement.innerHTML = "";
      this._createInnerElement();
    }
    this.eventAttributes.forEach((attr) => {
      const value = this.getAttribute(attr);
      if (value) {
        this._handleAttributeChange(attr, value);
      }
    });
    this._createTooltipElement();
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
  }
  _createInnerElement() {
    const labelText = this.getAttribute("lbl-label");
    const name = this.getAttribute("name");
    if (labelText) {
      const label = document.createElement("label");
      label.setAttribute("for", name);
      label.textContent = labelText;
      const lblClass = this.getAttribute("lbl-class");
      if (lblClass) {
        lblClass.split(" ").forEach((cls) => {
          if (cls.trim()) {
            label.classList.add(cls.trim());
          }
        });
      }
      this.componentElement.appendChild(label);
    }
    const inputWrapper = document.createElement("div");
    inputWrapper.classList.add("relative", "flex", "items-center");
    this.formElement = document.createElement("input");
    this.formElement.setAttribute("type", "text");
    this.formElement.setAttribute("form-element", "");
    this.formElement.setAttribute("name", name);
    this.formElement.setAttribute("id", name);
    const eltClass = this.getAttribute("elt-class");
    if (eltClass) {
      eltClass.split(" ").forEach((cls) => {
        if (cls.trim()) {
          this.formElement.classList.add(cls.trim());
        }
      });
    }
    this.passThruAttributes.forEach((attr) => {
      const value = this.getAttribute(attr);
      if (value !== null) {
        this.formElement.setAttribute(attr, value);
      }
    });
    this.passThruEmptyAttributes.forEach((attr) => {
      if (this.hasAttribute(attr)) {
        this.formElement.setAttribute(attr, "");
      }
    });
    const vehicleType = this.getAttribute("vehicle-type") || "auto";
    const iconData = _WcVinDecoder.icons.find((i) => i.name === vehicleType);
    if (iconData) {
      const vehicleIcon = document.createElement("span");
      vehicleIcon.classList.add("icon", "vehicle-icon");
      vehicleIcon.innerHTML = iconData.icon;
      inputWrapper.appendChild(vehicleIcon);
    }
    inputWrapper.appendChild(this.formElement);
    this.spinnerIcon = document.createElement("wc-fa-icon");
    this.spinnerIcon.setAttribute("name", "circle-notch");
    this.spinnerIcon.setAttribute("icon-style", "solid");
    this.spinnerIcon.setAttribute("size", "1.25rem");
    this.spinnerIcon.classList.add("absolute", "right-3", "text-primary", "animate-spin", "hidden");
    inputWrapper.appendChild(this.spinnerIcon);
    this.componentElement.appendChild(inputWrapper);
    this.labelElement = this.componentElement.querySelector("label");
  }
  _wireEvents() {
    super._wireEvents();
    if (!this.formElement) return;
    this._handleChangeForVin = (e) => {
      this._handleVinChange(e);
    };
    this.formElement.addEventListener("change", this._handleChangeForVin);
  }
  _unWireEvents() {
    super._unWireEvents();
    if (this.formElement && this._handleChangeForVin) {
      this.formElement.removeEventListener("change", this._handleChangeForVin);
      this._handleChangeForVin = null;
    }
  }
  _handleAttributeChange(attrName, newValue) {
    if (this.eventAttributes.includes(attrName)) {
      if (this.formElement && newValue) {
        const eventHandler = new Function("event", `
          const element = event.target;
          const value = element.value;
          with (element) {
            ${newValue}
          }
        `);
        const eventName = attrName.substring(2);
        this.formElement.addEventListener(eventName, eventHandler);
      }
      return;
    }
    if (this.passThruAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, newValue);
    }
    if (this.passThruEmptyAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, "");
    }
    if (this.ignoreAttributes.includes(attrName)) {
      if (attrName === "api-url") {
        this.apiUrl = newValue || this.apiUrl;
      } else if (attrName === "database-endpoint") {
        this.databaseEndpoint = newValue;
      }
      return;
    }
    if (attrName === "tooltip" || attrName === "tooltip-position") {
      this._createTooltipElement();
      return;
    }
    if (attrName === "lbl-class") {
      const name = this.getAttribute("name");
      const lbl = this.querySelector(`label[for="${name}"]`);
      lbl?.classList.add(newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  get value() {
    return this.formElement?.value || "";
  }
  set value(val) {
    if (this.formElement) {
      this.formElement.value = val;
    }
  }
  async _handleVinChange(event) {
    const vin = this.value.trim().toUpperCase();
    this.value = vin;
    if (vin.length !== 17) {
      this._broadcastError("VIN must be 17 characters");
      return;
    }
    if (vin === this.lastDecodedVin && this.cachedData) {
      this._broadcastChange(this.cachedData);
      return;
    }
    await this._decodeVin(vin);
  }
  async _decodeVin(vin) {
    if (this.isDecoding) return;
    this.isDecoding = true;
    this._showSpinner();
    try {
      let data = null;
      if (this.databaseEndpoint) {
        data = await this._checkDatabase(vin);
      }
      if (!data) {
        data = await this._callVinDecoderApi(vin);
      }
      if (data) {
        this.lastDecodedVin = vin;
        this.cachedData = data;
        this._broadcastChange(data);
      }
    } catch (error) {
      console.error("wc-vin-decoder: Error decoding VIN:", error);
      this._broadcastError(error.message || "Failed to decode VIN");
    } finally {
      this.isDecoding = false;
      this._hideSpinner();
    }
  }
  async _checkDatabase(vin) {
    try {
      const url = `${this.databaseEndpoint}/${vin}`;
      const response = await fetch(url);
      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Database check failed: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.warn("wc-vin-decoder: Database check failed, will use API:", error);
      return null;
    }
  }
  async _callVinDecoderApi(vin) {
    try {
      const url = `${this.apiUrl}/api/vin/${vin}`;
      const response = await fetch(url, {
        mode: "cors",
        headers: {
          "Accept": "application/json"
        }
      });
      if (!response.ok) {
        throw new Error(`VIN decoder API failed: ${response.statusText}`);
      }
      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.errorText || "Failed to decode VIN");
      }
      return result.data;
    } catch (error) {
      throw new Error(`Failed to decode VIN: ${error.message}`);
    }
  }
  _showSpinner() {
    this.spinnerIcon?.classList.remove("hidden");
  }
  _hideSpinner() {
    this.spinnerIcon?.classList.add("hidden");
  }
  _broadcastChange(data) {
    const event = new CustomEvent("vin-decoder:change", {
      bubbles: true,
      composed: true,
      detail: {
        vin: this.value,
        data
      }
    });
    this.dispatchEvent(event);
  }
  _broadcastError(message) {
    const event = new CustomEvent("vin-decoder:error", {
      bubbles: true,
      composed: true,
      detail: {
        vin: this.value,
        error: message
      }
    });
    this.dispatchEvent(event);
  }
  _createTooltipElement() {
    const tooltip = this.getAttribute("tooltip");
    if (!tooltip) return;
    const existingTooltip = this.querySelector("wc-tooltip");
    if (existingTooltip) {
      existingTooltip.remove();
    }
    const tooltipElement = document.createElement("wc-tooltip");
    tooltipElement.textContent = tooltip;
    const position = this.getAttribute("tooltip-position") || "top";
    tooltipElement.setAttribute("position", position);
    if (this.formElement) {
      this.formElement.parentNode.insertBefore(tooltipElement, this.formElement.nextSibling);
    }
  }
  _applyStyle() {
    const style = `
      wc-vin-decoder {
        display: contents;
      }

      wc-vin-decoder input {
        width: 100%;
        padding-left: 25px;
        min-width: 130px;
      }

      wc-vin-decoder input:disabled {
        cursor: not-allowed;
        opacity: 0.7;
        font-style: italic;
      }

      wc-vin-decoder .vehicle-icon {
        position: absolute;
        top: 50%;
        left: 5px;
        transform: translateY(-50%);
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      wc-vin-decoder wc-fa-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }

      wc-vin-decoder wc-fa-icon.hidden {
        display: none !important;
      }

      /* Required field - bold label with asterisk */
      div.wc-vin-decoder:has(:required) > label {
        font-weight: bold;
      }

      div.wc-vin-decoder:has(:required) > label::after {
        content: ' *';
        font-weight: bold;
      }
    `;
    if (!document.getElementById("wc-vin-decoder-style")) {
      const styleTag = document.createElement("style");
      styleTag.id = "wc-vin-decoder-style";
      styleTag.textContent = style;
      document.head.appendChild(styleTag);
    }
  }
};
customElements.define(WcVinDecoder.is, WcVinDecoder);

// src/js/components/wc-vin-listener.js
var WcVinListener = class extends WcBaseComponent {
  static get is() {
    return "wc-vin-listener";
  }
  static get observedAttributes() {
    return ["vin-group", "array-fields"];
  }
  constructor() {
    super();
    this.boundHandleVinChange = this._handleVinChange.bind(this);
    const compEl = this.querySelector(".wc-vin-listener");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-vin-listener");
      this.appendChild(this.componentElement);
    }
  }
  connectedCallback() {
    super.connectedCallback();
    document.addEventListener("vin-decoder:change", this.boundHandleVinChange);
    this._setupDirectListeners();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener("vin-decoder:change", this.boundHandleVinChange);
  }
  _setupDirectListeners() {
    const listenableElements = this.querySelectorAll("[vin-listener]");
    listenableElements.forEach((element) => {
      if (!element._vinListenerSetup) {
        element._vinListenerSetup = true;
        element._handleDirectVinChange = (event) => {
          const listenerGroup = element.getAttribute("vin-listener");
          const vinData = event.detail;
          if (vinData.vinGroup === listenerGroup) {
            this._updateFieldValue(element, vinData.data);
          }
        };
        document.addEventListener("vin-decoder:change", element._handleDirectVinChange);
      }
    });
  }
  _handleVinChange(event) {
    const vinData = event.detail;
    const targetGroup = this.getAttribute("vin-group");
    if (targetGroup && vinData.vinGroup && targetGroup !== vinData.vinGroup) {
      return;
    }
    this._updateFields(vinData.data);
  }
  _updateFields(data) {
    this._cleanupDynamicArrayInputs();
    const formElements = this.querySelectorAll("[name]");
    formElements.forEach((element) => {
      this._updateFieldValue(element, data);
    });
    this._createMissingArrayFields(data);
  }
  _cleanupDynamicArrayInputs() {
    const arrayFieldsAttr = this.getAttribute("array-fields");
    if (!arrayFieldsAttr) return;
    const arrayFieldNames = arrayFieldsAttr.split(",").map((f) => f.trim());
    arrayFieldNames.forEach((fieldKey) => {
      const arrayInputs = this.querySelectorAll(`input[type="hidden"][name*=".${fieldKey}."]`);
      arrayInputs.forEach((input2) => {
        const name = input2.getAttribute("name");
        const pattern = new RegExp(`\\.${fieldKey}\\.\\d+$`);
        if (pattern.test(name)) {
          input2.remove();
        }
      });
    });
  }
  _createMissingArrayFields(data) {
    const arrayFieldsAttr = this.getAttribute("array-fields");
    if (!arrayFieldsAttr) return;
    const arrayFieldNames = arrayFieldsAttr.split(",").map((f) => f.trim());
    const baseName = this._inferBaseName();
    arrayFieldNames.forEach((fieldKey) => {
      const value = data[fieldKey];
      if (!Array.isArray(value) || value.length === 0) return;
      const existingPlaceholder = this.querySelector(`[name$=".${fieldKey}"]`);
      const existingIndexed = this.querySelector(`[name$=".${fieldKey}.0"]`);
      if (existingPlaceholder || existingIndexed) {
        return;
      }
      value.forEach((item, index) => {
        const indexedInput = document.createElement("input");
        indexedInput.type = "hidden";
        indexedInput.name = `${baseName}.${fieldKey}.${index}`;
        indexedInput.value = item;
        this.componentElement.appendChild(indexedInput);
      });
    });
  }
  _inferBaseName() {
    const fieldsWithNames = this.querySelectorAll("[name]");
    for (let field of fieldsWithNames) {
      const name = field.getAttribute("name");
      if (!name) continue;
      const parts = name.split(".");
      if (parts.length >= 2) {
        parts.pop();
        return parts.join(".");
      }
    }
    return this.getAttribute("vin-group") || "vehicle";
  }
  _updateFieldValue(element, data) {
    const fieldName = element.getAttribute("name");
    if (!fieldName) return;
    const fieldKey = this._extractFieldKey(fieldName);
    if (!fieldKey) return;
    const mappedField = this._getFieldMapping(fieldKey);
    if (!mappedField) return;
    let value = data[mappedField];
    if (value === void 0 || value === null) return;
    if (Array.isArray(value)) {
      this._handleArrayValue(element, fieldName, value);
      return;
    }
    value = this._transformValue(value, mappedField);
    if (element.tagName.toLowerCase().startsWith("wc-")) {
      element.value = value;
    } else if (element.tagName === "INPUT" || element.tagName === "SELECT" || element.tagName === "TEXTAREA") {
      element.value = value;
    }
    element.dispatchEvent(new Event("change", { bubbles: true }));
  }
  _handleArrayValue(element, fieldName, arrayValue) {
    const baseName = fieldName.replace(/\.\d+$/, "");
    const existingArrayInputs = this.querySelectorAll(`[name^="${baseName}."]`);
    existingArrayInputs.forEach((input2) => {
      if (input2 !== element && /\.\d+$/.test(input2.getAttribute("name"))) {
        input2.remove();
      }
    });
    const parent = element.parentNode;
    const nextSibling = element.nextSibling;
    element.remove();
    arrayValue.forEach((item, index) => {
      const indexedInput = document.createElement("input");
      indexedInput.type = "hidden";
      indexedInput.name = `${baseName}.${index}`;
      indexedInput.value = item;
      if (nextSibling) {
        parent.insertBefore(indexedInput, nextSibling);
      } else {
        parent.appendChild(indexedInput);
      }
    });
  }
  _transformValue(value, mappedField) {
    if (mappedField === "msrp" || mappedField === "basePrice") {
      if (typeof value === "string") {
        return value.replace(/[$,\s]/g, "");
      }
    }
    return value;
  }
  _extractFieldKey(fieldName) {
    const parts = fieldName.split(".");
    return parts[parts.length - 1];
  }
  _getFieldMapping(fieldKey) {
    const mappings = {
      "year": "year",
      "make": "make",
      "model": "model",
      "trim": "trim",
      "series": "series",
      "msrp": "msrp",
      "price": "msrp",
      "baseprice": "basePrice",
      "base_price": "basePrice",
      "bodyclass": "bodyClass",
      "body_class": "bodyClass",
      "bodytype": "bodyClass",
      "body_type": "bodyClass",
      "doors": "doors",
      "wheels": "wheels",
      "seats": "seats",
      "vehicletype": "vehicleType",
      "vehicle_type": "vehicleType",
      "enginecylinders": "engineCylinders",
      "engine_cylinders": "engineCylinders",
      "cylinders": "engineCylinders",
      "displacementcc": "displacementCC",
      "displacement_cc": "displacementCC",
      "displacementci": "displacementCI",
      "displacement_ci": "displacementCI",
      "displacementl": "displacementL",
      "displacement_l": "displacementL",
      "displacement": "displacementL",
      "transmissionstyle": "transmissionStyle",
      "transmission_style": "transmissionStyle",
      "transmission": "transmissionStyle",
      "transmissionspeeds": "transmissionSpeeds",
      "transmission_speeds": "transmissionSpeeds",
      "drivetype": "driveType",
      "drive_type": "driveType",
      "drivetrain": "driveType",
      "axles": "axles",
      "fueltype": "fuelType",
      "fuel_type": "fuelType",
      "fuel": "fuelType",
      "manufacturername": "manufacturerName",
      "manufacturer_name": "manufacturerName",
      "manufacturer": "manufacturerName",
      "enginemanufacturer": "engineManufacturer",
      "engine_manufacturer": "engineManufacturer",
      "plantcompanyname": "plantCompanyName",
      "plant_company_name": "plantCompanyName",
      "plant": "plantCompanyName",
      "plantcountry": "plantCountry",
      "plant_country": "plantCountry",
      "plantstate": "plantState",
      "plant_state": "plantState",
      "brakesystemtype": "brakeSystemType",
      "brake_system_type": "brakeSystemType",
      "brakesystem": "brakeSystemType",
      "brake_system": "brakeSystemType",
      "brakes": "brakeSystemType",
      "antilockbrakingsystem": "antilockBrakingSystem",
      "antilock_braking_system": "antilockBrakingSystem",
      "abs": "antilockBrakingSystem",
      "vin": "vin",
      "errorcode": "errorCode",
      "error_code": "errorCode",
      "errortext": "errorText",
      "error_text": "errorText",
      "errormessage": "errorText",
      "error_message": "errorText",
      "images": "images",
      "msrpsource": "msrpSource",
      "msrp_source": "msrpSource",
      "timestamp": "timestamp"
    };
    const normalizedKey = fieldKey.toLowerCase().replace(/[-_]/g, "");
    return mappings[normalizedKey] || null;
  }
};
customElements.define(WcVinListener.is, WcVinListener);

// src/js/components/wc-icon.js
if (!customElements.get("wc-icon")) {
  const globalIconCache = /* @__PURE__ */ new Map();
  const pendingRequests = /* @__PURE__ */ new Map();
  class WcIcon extends WcBaseComponent {
    static get observedAttributes() {
      return ["name", "icon-style", "size", "color", "primary-color", "secondary-color", "secondary-opacity", "swap-opacity", "rotate", "flip", "base-path", "spin", "pulse"];
    }
    // Font Awesome icon aliases mapping
    static iconAliases = {
      "home": "house",
      "search": "magnifying-glass",
      "edit": "pen-to-square",
      "save": "floppy-disk",
      "undo": "arrow-rotate-left",
      "redo": "arrow-rotate-right",
      "sign-out": "right-from-bracket",
      "sign-in": "right-to-bracket",
      "sign-out-alt": "arrow-right-from-bracket",
      "sign-in-alt": "arrow-right-to-bracket",
      "settings": "gear",
      "cog": "gear",
      "cogs": "gears",
      "trash-alt": "trash-can",
      "delete": "trash",
      "remove": "xmark",
      "clear": "eraser",
      "close": "xmark",
      "times": "xmark",
      "search-plus": "magnifying-glass-plus",
      "search-minus": "magnifying-glass-minus",
      "zoom-in": "magnifying-glass-plus",
      "zoom-out": "magnifying-glass-minus",
      "power-off": "power-off",
      "log-out": "right-from-bracket",
      "log-in": "right-to-bracket",
      "shopping-cart": "cart-shopping",
      "chart-bar": "chart-column",
      "bar-chart": "chart-column",
      "line-chart": "chart-line",
      "area-chart": "chart-area",
      "pie-chart": "chart-pie",
      "refresh": "arrows-rotate",
      "sync": "arrows-rotate",
      "mail": "envelope",
      "email": "envelope",
      "warning": "triangle-exclamation",
      "exclamation-triangle": "triangle-exclamation",
      "error": "circle-xmark",
      "times-circle": "circle-xmark",
      "info": "circle-info",
      "info-circle": "circle-info",
      "question-circle": "circle-question",
      "help": "circle-question",
      "picture": "image",
      "photo": "image"
    };
    constructor() {
      super();
      this._basePath = this.getAttribute("base-path") || WcIcon.defaultBasePath || "/dist/assets/icons";
    }
    static get is() {
      return "wc-icon";
    }
    // Static property to set default base path for all icons
    static defaultBasePath = "/dist/assets/icons";
    // Static method to configure the base path globally
    static setBasePath(path) {
      WcIcon.defaultBasePath = path;
      if (window.wc?.iconRegistry) {
        window.wc.iconRegistry.setBaseUrl(path);
      }
    }
    async _render() {
      this.classList.remove("contents");
      if (!document.getElementById("wc-icon-animations")) {
        const style = document.createElement("style");
        style.id = "wc-icon-animations";
        style.textContent = `
          @keyframes wc-icon-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes wc-icon-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          wc-icon[spin] svg {
            animation: wc-icon-spin 1s linear infinite;
          }
          wc-icon[pulse] svg {
            animation: wc-icon-pulse 2s ease-in-out infinite;
          }
        `;
        document.head.appendChild(style);
      }
      this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      this._svg.setAttribute("viewBox", "0 0 512 512");
      this._svg.setAttribute("fill", "currentColor");
      this._group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this._svg.appendChild(this._group);
      this.appendChild(this._svg);
      this._applyStyles();
      await this._loadIcon();
    }
    _handleAttributeChange(name, oldValue, newValue) {
      if (name === "name" || name === "icon-style") {
        this._loadIcon();
      } else if (name === "base-path") {
        this._basePath = newValue || WcIcon.defaultBasePath;
        this._loadIcon();
      } else if (name === "spin" || name === "pulse") {
        return;
      } else {
        this._applyStyles();
      }
    }
    _applyStyles() {
      if (!this._svg) return;
      const size = this.getAttribute("size");
      const rotate = this.getAttribute("rotate");
      const flip = this.getAttribute("flip");
      const iconStyle = this.getAttribute("icon-style") || "solid";
      if (size) {
        this._svg.style.width = size;
        this._svg.style.height = size;
      }
      let transform = "";
      if (rotate && !this.hasAttribute("spin")) {
        transform += `rotate(${rotate}deg)`;
      }
      if (flip === "horizontal") {
        transform += " scaleX(-1)";
      } else if (flip === "vertical") {
        transform += " scaleY(-1)";
      } else if (flip === "both") {
        transform += " scale(-1)";
      }
      if (transform) {
        this._svg.style.transform = transform.trim();
      } else {
        this._svg.style.removeProperty("transform");
      }
      if (iconStyle.includes("duotone")) {
        const primaryColor = this.getAttribute("primary-color") || this.getAttribute("color") || "currentColor";
        const secondaryColor = this.getAttribute("secondary-color") || this.getAttribute("color") || "currentColor";
        const secondaryOpacity = this.getAttribute("secondary-opacity") || "0.4";
        const swapOpacity = this.hasAttribute("swap-opacity");
        this.style.setProperty("--fa-primary-color", primaryColor);
        this.style.setProperty("--fa-secondary-color", secondaryColor);
        this.style.setProperty("--fa-primary-opacity", swapOpacity ? secondaryOpacity : "1");
        this.style.setProperty("--fa-secondary-opacity", swapOpacity ? "1" : secondaryOpacity);
        this.style.removeProperty("--fa-color");
      } else {
        const color = this.getAttribute("color") || "currentColor";
        this.style.setProperty("--fa-color", color);
        this.style.removeProperty("--fa-primary-color");
        this.style.removeProperty("--fa-secondary-color");
        this.style.removeProperty("--fa-primary-opacity");
        this.style.removeProperty("--fa-secondary-opacity");
      }
    }
    async _loadIcon() {
      const requestedName = this.getAttribute("name");
      if (!requestedName || !this._group) return;
      const iconName = WcIcon.iconAliases[requestedName] || requestedName;
      const iconStyle = this.getAttribute("icon-style") || "solid";
      const basePath = this.getAttribute("base-path") || this._basePath;
      const cacheKey = `${basePath}/${iconStyle}/${iconName}`;
      try {
        let iconData = globalIconCache.get(cacheKey);
        if (!iconData) {
          let pendingRequest = pendingRequests.get(cacheKey);
          if (pendingRequest) {
            iconData = await pendingRequest;
          } else {
            const requestPromise = (async () => {
              if (WcIcon._globalRegistry?.has(`${iconStyle}/${iconName}`)) {
                const data = WcIcon._globalRegistry.get(`${iconStyle}/${iconName}`);
                globalIconCache.set(cacheKey, data);
                return data;
              }
              const response = await fetch(`${basePath}/${iconStyle}/${iconName}.svg`);
              if (!response.ok) {
                console.error(`Icon not found: ${iconStyle}/${iconName}`);
                return null;
              }
              const svgText = await response.text();
              const parser = new DOMParser();
              const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
              const svgElement = svgDoc.querySelector("svg");
              const paths = svgDoc.querySelectorAll("path");
              const iconData2 = {
                viewBox: svgElement?.getAttribute("viewBox"),
                paths: Array.from(paths).map((path) => ({
                  d: path.getAttribute("d"),
                  opacity: path.getAttribute("opacity"),
                  class: path.getAttribute("class"),
                  fill: path.getAttribute("fill")
                }))
              };
              globalIconCache.set(cacheKey, iconData2);
              return iconData2;
            })();
            pendingRequests.set(cacheKey, requestPromise);
            try {
              iconData = await requestPromise;
            } finally {
              pendingRequests.delete(cacheKey);
            }
          }
        }
        if (!iconData) return;
        this._group.innerHTML = "";
        if (iconData.viewBox) {
          this._svg.setAttribute("viewBox", iconData.viewBox);
        }
        iconData.paths.forEach((pathData) => {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", pathData.d);
          if (iconStyle.includes("duotone")) {
            if (pathData.class && pathData.class.includes("fa-secondary")) {
              path.classList.add("fa-secondary");
              path.style.fill = "var(--fa-secondary-color)";
              path.style.opacity = "var(--fa-secondary-opacity)";
            } else {
              path.classList.add("fa-primary");
              path.style.fill = "var(--fa-primary-color)";
              path.style.opacity = "var(--fa-primary-opacity)";
            }
          } else {
            path.style.fill = "var(--fa-color, currentColor)";
            if (pathData.opacity) {
              path.style.opacity = pathData.opacity;
            }
          }
          this._group.appendChild(path);
        });
      } catch (error) {
        console.error(`Error loading icon ${cacheKey}:`, error);
      }
    }
    // Static method to register icons programmatically
    static registerIcon(name, pathData, iconStyle = "solid") {
      if (!WcIcon._globalRegistry) {
        WcIcon._globalRegistry = /* @__PURE__ */ new Map();
      }
      const key = `${iconStyle}/${name}`;
      WcIcon._globalRegistry.set(key, pathData);
    }
    // Static method to register multiple icons
    static registerIcons(icons, iconStyle = "solid") {
      Object.entries(icons).forEach(([name, pathData]) => {
        WcIcon.registerIcon(name, pathData, iconStyle);
      });
    }
    // Static method to preload icons
    static async preloadIcons(iconList) {
      const promises = iconList.map(async (iconConfig) => {
        const { name, style = "solid", basePath = WcIcon.defaultBasePath } = typeof iconConfig === "string" ? { name: iconConfig } : iconConfig;
        const iconName = WcIcon.iconAliases[name] || name;
        const cacheKey = `${basePath}/${style}/${iconName}`;
        if (globalIconCache.has(cacheKey)) return;
        if (pendingRequests.has(cacheKey)) {
          return pendingRequests.get(cacheKey);
        }
        const requestPromise = (async () => {
          if (WcIcon._globalRegistry?.has(`${style}/${iconName}`)) {
            const data = WcIcon._globalRegistry.get(`${style}/${iconName}`);
            globalIconCache.set(cacheKey, data);
            return data;
          }
          const response = await fetch(`${basePath}/${style}/${iconName}.svg`);
          if (!response.ok) {
            console.error(`Icon not found: ${style}/${iconName}`);
            return null;
          }
          const svgText = await response.text();
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgText, "image/svg+xml");
          const svgElement = svgDoc.querySelector("svg");
          const paths = svgDoc.querySelectorAll("path");
          const iconData = {
            viewBox: svgElement?.getAttribute("viewBox"),
            paths: Array.from(paths).map((path) => ({
              d: path.getAttribute("d"),
              opacity: path.getAttribute("opacity"),
              class: path.getAttribute("class"),
              fill: path.getAttribute("fill")
            }))
          };
          globalIconCache.set(cacheKey, iconData);
          return iconData;
        })();
        pendingRequests.set(cacheKey, requestPromise);
        try {
          return await requestPromise;
        } finally {
          pendingRequests.delete(cacheKey);
        }
      });
      await Promise.all(promises);
    }
    // Static method to clear cache (useful for testing or memory management)
    static clearCache() {
      globalIconCache.clear();
      pendingRequests.clear();
    }
    // Static method to get cache stats
    static getCacheStats() {
      return {
        cachedIcons: globalIconCache.size,
        pendingRequests: pendingRequests.size,
        cacheKeys: Array.from(globalIconCache.keys())
      };
    }
  }
  customElements.define(WcIcon.is, WcIcon);
}

// src/js/components/wc-fa-icon.js
if (!customElements.get("wc-fa-icon")) {
  const iconBundles = /* @__PURE__ */ new Map();
  const loadedBundles = /* @__PURE__ */ new Set();
  const loadingBundles = /* @__PURE__ */ new Map();
  class WcFaIcon extends WcBaseComponent {
    static get observedAttributes() {
      return ["name", "icon-style", "size", "color", "primary-color", "secondary-color", "secondary-opacity", "swap-opacity", "rotate", "flip", "spin", "pulse"];
    }
    // Font Awesome icon aliases mapping
    static iconAliases = {
      "home": "house",
      "search": "magnifying-glass",
      "edit": "pen-to-square",
      "save": "floppy-disk",
      "undo": "arrow-rotate-left",
      "redo": "arrow-rotate-right",
      "sign-out": "right-from-bracket",
      "sign-in": "right-to-bracket",
      "sign-out-alt": "arrow-right-from-bracket",
      "sign-in-alt": "arrow-right-to-bracket",
      "settings": "gear",
      "cog": "gear",
      "cogs": "gears",
      "trash-alt": "trash-can",
      "delete": "trash",
      "remove": "xmark",
      "clear": "eraser",
      "close": "xmark",
      "times": "xmark",
      "search-plus": "magnifying-glass-plus",
      "search-minus": "magnifying-glass-minus",
      "zoom-in": "magnifying-glass-plus",
      "zoom-out": "magnifying-glass-minus",
      "power-off": "power-off",
      "log-out": "right-from-bracket",
      "log-in": "right-to-bracket",
      "shopping-cart": "cart-shopping",
      "chart-bar": "chart-column",
      "bar-chart": "chart-column",
      "line-chart": "chart-line",
      "area-chart": "chart-area",
      "pie-chart": "chart-pie",
      "refresh": "arrows-rotate",
      "sync": "arrows-rotate",
      "mail": "envelope",
      "email": "envelope",
      "warning": "triangle-exclamation",
      "exclamation-circle": "circle-exclamation",
      "exclamation-triangle": "triangle-exclamation",
      "error": "circle-xmark",
      "times-circle": "circle-xmark",
      "info": "circle-info",
      "info-circle": "circle-info",
      "question-circle": "circle-question",
      "check-circle": "circle-check",
      "check-square": "square-check",
      "help": "circle-question",
      "picture": "image",
      "photo": "image",
      "play-circle": "circle-play",
      "pause-circle": "circle-pause",
      "plus-circle": "circle-plus",
      "file-download": "file-arrow-down",
      "user-circle": "circle-user",
      "allergies": "hand-dots",
      "heartbeat": "heart-pulse",
      "chalkboard-teacher": "chalkboard-user",
      "phone-alt": "phone-flip",
      "users-cog": "users-gear",
      "user-friends": "user-group",
      "calendar-times": "calendar-xmark",
      "calendar-time": "calendar-clock",
      "calendar-alt": "calendar-days",
      "map-marker-alt": "location-dot",
      "exchange-alt": "right-left",
      "sticky-note": "note-sticky",
      "phone-square": "square-phone",
      "phone-square-alt": "square-phone-flip",
      "phone-square-down": "square-phone-hangup",
      "history": "rectangle-history",
      "birthday-cake": "cake-candles",
      "medkit": "suitcase-medical",
      "shield-alt": "shield-halved",
      "volume-up": "volume-high",
      "volume-down": "volume-low"
    };
    constructor() {
      super();
    }
    static get is() {
      return "wc-fa-icon";
    }
    async _render() {
      this.classList.remove("contents");
      if (!document.getElementById("wc-fa-icon-animations")) {
        const style = document.createElement("style");
        style.id = "wc-fa-icon-animations";
        style.textContent = `
          @keyframes wc-fa-icon-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes wc-fa-icon-pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
          wc-fa-icon[spin] svg {
            animation: wc-fa-icon-spin 1s linear infinite;
          }
          wc-fa-icon[pulse] svg {
            animation: wc-fa-icon-pulse 2s ease-in-out infinite;
          }
        `;
        document.head.appendChild(style);
      }
      this.innerHTML = "";
      this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      this._svg.setAttribute("viewBox", "0 0 512 512");
      this._svg.setAttribute("fill", "currentColor");
      this._group = document.createElementNS("http://www.w3.org/2000/svg", "g");
      this._svg.appendChild(this._group);
      this.appendChild(this._svg);
      this._applyStyles();
      await this._loadIcon();
    }
    _handleAttributeChange(name, oldValue, newValue) {
      if (name === "name" || name === "icon-style") {
        this._loadIcon();
      } else if (name === "spin" || name === "pulse") {
        return;
      } else {
        this._applyStyles();
      }
    }
    _applyStyles() {
      if (!this._svg) return;
      const size = this.getAttribute("size");
      const rotate = this.getAttribute("rotate");
      const flip = this.getAttribute("flip");
      const iconStyle = this.getAttribute("icon-style") || "solid";
      if (size) {
        this._svg.style.width = size;
        this._svg.style.height = size;
      }
      let transform = "";
      if (rotate && !this.hasAttribute("spin")) {
        transform += `rotate(${rotate}deg)`;
      }
      if (flip === "horizontal") {
        transform += " scaleX(-1)";
      } else if (flip === "vertical") {
        transform += " scaleY(-1)";
      } else if (flip === "both") {
        transform += " scale(-1)";
      }
      if (transform) {
        this._svg.style.transform = transform.trim();
      } else {
        this._svg.style.removeProperty("transform");
      }
      if (iconStyle.includes("duotone")) {
        const primaryColor = this.getAttribute("primary-color") || this.getAttribute("color") || "currentColor";
        const secondaryColor = this.getAttribute("secondary-color") || this.getAttribute("color") || "currentColor";
        const secondaryOpacity = this.getAttribute("secondary-opacity") || "0.4";
        const swapOpacity = this.hasAttribute("swap-opacity");
        this.style.setProperty("--fa-primary-color", primaryColor);
        this.style.setProperty("--fa-secondary-color", secondaryColor);
        this.style.setProperty("--fa-primary-opacity", swapOpacity ? secondaryOpacity : "1");
        this.style.setProperty("--fa-secondary-opacity", swapOpacity ? "1" : secondaryOpacity);
        this.style.removeProperty("--fa-color");
      } else {
        const color = this.getAttribute("color") || "currentColor";
        this.style.setProperty("--fa-color", color);
        this.style.removeProperty("--fa-primary-color");
        this.style.removeProperty("--fa-secondary-color");
        this.style.removeProperty("--fa-primary-opacity");
        this.style.removeProperty("--fa-secondary-opacity");
      }
    }
    async _loadIcon() {
      const requestedName = this.getAttribute("name");
      if (!requestedName || !this._group) return;
      const iconName = WcFaIcon.iconAliases[requestedName] || requestedName;
      const iconStyle = this.getAttribute("icon-style") || "solid";
      if (!loadedBundles.has(iconStyle) && !loadingBundles.has(iconStyle)) {
        const bundlePath = `${WcIconConfig.bundleBaseUrl}/${iconStyle}-icons.json`;
        const loadPromise = WcFaIcon.loadBundle(bundlePath).then((count) => {
          loadedBundles.add(iconStyle);
          loadingBundles.delete(iconStyle);
          return count;
        }).catch((err) => {
          console.error(`[wc-fa-icon] Failed to auto-load ${iconStyle} bundle:`, err);
          loadingBundles.delete(iconStyle);
          loadedBundles.add(iconStyle);
          return 0;
        });
        loadingBundles.set(iconStyle, loadPromise);
      }
      if (loadingBundles.has(iconStyle)) {
        await loadingBundles.get(iconStyle);
      }
      try {
        const bundleKey2 = `${iconStyle}/${iconName}`;
        let iconData = iconBundles.get(bundleKey2);
        if (!iconData && iconStyle === "duotone") {
          console.log(`[wc-fa-icon] Looking for duotone icon: ${iconName}`);
          console.log(`[wc-fa-icon] Loaded bundles:`, Array.from(loadedBundles));
          console.log(`[wc-fa-icon] Total icons in cache:`, iconBundles.size);
          console.log(`[wc-fa-icon] Sample keys:`, Array.from(iconBundles.keys()).slice(0, 5));
        }
        if (!iconData) {
          console.warn(`Icon not found in loaded bundles: ${iconName} (style: ${iconStyle})`);
          console.warn(`Available icons:`, iconBundles.size > 0 ? Array.from(iconBundles.keys()).slice(0, 10) : "No icons loaded");
          console.warn(`Bundle URL was: ${WcIconConfig.bundleBaseUrl}/${iconStyle}-icons.json`);
          this._group.innerHTML = "";
          const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
          text.setAttribute("x", "256");
          text.setAttribute("y", "256");
          text.setAttribute("text-anchor", "middle");
          text.setAttribute("dominant-baseline", "middle");
          text.setAttribute("font-size", "200");
          text.textContent = "?";
          this._group.appendChild(text);
          return;
        }
        this._group.innerHTML = "";
        if (iconData.viewBox) {
          this._svg.setAttribute("viewBox", iconData.viewBox);
        }
        iconData.paths.forEach((pathData) => {
          const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
          path.setAttribute("d", pathData.d);
          if (iconStyle.includes("duotone")) {
            if (pathData.class && pathData.class.includes("fa-secondary")) {
              path.classList.add("fa-secondary");
              path.style.fill = "var(--fa-secondary-color)";
              path.style.opacity = "var(--fa-secondary-opacity)";
            } else {
              path.classList.add("fa-primary");
              path.style.fill = "var(--fa-primary-color)";
              path.style.opacity = "var(--fa-primary-opacity)";
            }
          } else {
            path.style.fill = "var(--fa-color, currentColor)";
            if (pathData.opacity) {
              path.style.opacity = pathData.opacity;
            }
          }
          this._group.appendChild(path);
        });
      } catch (error) {
        console.error(`Error loading icon ${bundleKey}:`, error);
      }
    }
    // Static method to load icon bundle from JSON
    static async loadBundle(bundleUrl) {
      try {
        const response = await fetch(bundleUrl);
        if (!response.ok) {
          throw new Error(`Failed to load icon bundle: ${bundleUrl}`);
        }
        const bundle = await response.json();
        let loadedCount = 0;
        const match = bundleUrl.match(/\/([^\/]+)-icons\.json$/);
        const style = match ? match[1] : "unknown";
        for (const [key, iconData] of Object.entries(bundle)) {
          const storeKey = `${style}/${key}`;
          iconBundles.set(storeKey, iconData);
          loadedCount++;
        }
        if (style !== "unknown") {
          loadedBundles.add(style);
          loadingBundles.delete(style);
        }
        return loadedCount;
      } catch (error) {
        console.error("[wc-fa-icon] Error loading bundle:", error);
        throw error;
      }
    }
    // Static method to load multiple bundles
    static async loadBundles(bundleUrls) {
      const results = await Promise.allSettled(
        bundleUrls.map((url) => WcFaIcon.loadBundle(url))
      );
      const totalLoaded = results.filter((r) => r.status === "fulfilled").reduce((sum, r) => sum + r.value, 0);
      const failed = results.filter((r) => r.status === "rejected").length;
      return { totalLoaded, failed };
    }
    // Static method to register icons programmatically
    static registerIcon(name, pathData, iconStyle = "solid") {
      iconBundles.set(name, pathData);
    }
    // Static method to register multiple icons
    static registerIcons(icons, iconStyle = "solid") {
      Object.entries(icons).forEach(([name, pathData]) => {
        WcFaIcon.registerIcon(name, pathData, iconStyle);
      });
    }
    // Static method to get bundle stats
    static getBundleStats() {
      return {
        loadedIcons: iconBundles.size,
        iconKeys: Array.from(iconBundles.keys())
      };
    }
    // Static method to clear all bundles
    static clearBundles() {
      iconBundles.clear();
    }
    // Static method to check if an icon is loaded
    static isIconLoaded(name, style = "solid") {
      const iconName = WcFaIcon.iconAliases[name] || name;
      return iconBundles.has(`${style}/${iconName}`);
    }
    // Static method to preload configured bundles
    static async preloadConfiguredBundles() {
      if (WcIconConfig.preloadBundles && WcIconConfig.preloadBundles.length > 0) {
        const loadPromises = [];
        for (const style of WcIconConfig.preloadBundles) {
          if (!loadedBundles.has(style) && !loadingBundles.has(style)) {
            const bundleUrl = `${WcIconConfig.bundleBaseUrl}/${style}-icons.json`;
            const loadPromise = WcFaIcon.loadBundle(bundleUrl).then((count) => {
              loadedBundles.add(style);
              loadingBundles.delete(style);
              return count;
            }).catch((err) => {
              console.error(`[wc-fa-icon] Failed to preload ${style} bundle:`, err);
              loadingBundles.delete(style);
              loadedBundles.add(style);
              return 0;
            });
            loadingBundles.set(style, loadPromise);
            loadPromises.push(loadPromise);
          }
        }
        const results = await Promise.all(loadPromises);
        const totalLoaded = results.reduce((sum, count) => sum + count, 0);
        return { totalLoaded, failed: results.filter((c) => c === 0).length };
      }
      return { totalLoaded: 0, failed: 0 };
    }
  }
  customElements.define(WcFaIcon.is, WcFaIcon);
  window.WcFaIcon = WcFaIcon;
  if (WcIconConfig.preloadBundles && WcIconConfig.preloadBundles.length > 0) {
    WcFaIcon.preloadConfiguredBundles();
  }
}

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
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
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
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
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
        "json-layout",
        "json-layout-fetch-url",
        "json-schema-fetch-url"
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
    // DOM Elements
    designerSurface = null;
    containerElements = null;
    formElements = null;
    schemaFields = null;
    previewButton = null;
    renderedPreviewButton = null;
    preRenderedPreviewButton = null;
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
      this.elementCustomProperties = {
        "a": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "href", label: "Href", type: "string", isSubLabel: true },
          { name: "target", label: "Target", type: "string-enum", defaultValue: "_self", enum: ["", "_blank", "_parent", "_self", "_top"] }
        ],
        "column": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" }
        ],
        "data-array": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "has_add_new", label: "Has Add New?", type: "boolean" }
        ],
        "data-item": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true }
        ],
        "div": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" }
        ],
        "fieldset": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Legend", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" }
        ],
        "hr": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" }
        ],
        "option": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "value", label: "Value", type: "string" },
          { name: "content", label: "Content", type: "multiline-string" },
          { name: "is_selected", label: "Is Selected?", type: "boolean" }
        ],
        "row": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" }
        ],
        "wc-accordion-option": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "value", label: "Value", type: "string", isLabel: true },
          { name: "content", label: "Content", type: "multiline-string" },
          { name: "is_selected", label: "Is Selected?", type: "boolean" }
        ],
        "wc-accordion": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "allow_many", label: "Allow Many?", type: "boolean" }
        ],
        "wc-article-skeleton": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true }
        ],
        "wc-breadcrumb": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "title", label: "Title", type: "string", isLabel: true }
        ],
        "wc-breadcrumb-item": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Legend", type: "string", isLabel: true },
          { name: "link", label: "Link", type: "string" }
        ],
        "wc-background-image": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "caption", label: "Caption", type: "string", isLabel: true },
          { name: "url", label: "URL", type: "string", isSubLabel: true }
        ],
        "wc-card-skeleton": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true }
        ],
        "wc-code-mirror": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "name", label: "Name", type: "string" },
          { name: "label", label: "Legend", type: "string", isLabel: true },
          { name: "theme", label: "Theme", type: "string-enum", defaultValue: "", enum: [
            "",
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
          ] },
          { name: "mode", label: "Mode", type: "string-enum", isSubLabel: true, defaultValue: "", enum: [
            "",
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
          ] },
          { name: "height", label: "Height", type: "string" },
          { name: "has_line_numbers", label: "Has Line Numbers?", type: "boolean" },
          { name: "has_line_wrapping", label: "Has Line Wrapping?", type: "boolean" },
          { name: "has_fold_gutter", label: "Has Fold Gutter?", type: "boolean" },
          { name: "lbl_css", label: "Label Class", type: "string" },
          { name: "tab_size", label: "Tab Size", type: "number" },
          { name: "indent_unit", label: "Indent Unit", type: "number" },
          { name: "value", label: "Value", type: "multiline-string" },
          { name: "url", label: "Fetch URL", type: "string" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "script", label: "Hyperscript", type: "multiline-string" }
        ],
        "wc-contact-card": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "contact_name", label: "Name", type: "string", isLabel: true },
          { name: "contact_title", label: "Title", type: "string", isSubLabel: true },
          { name: "contact_gender", label: "Gender", type: "string-radio-modern", defaultValue: "", enum: ["male", "female"] }
        ],
        "wc-contact-chip": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "contact_name", label: "Name", type: "string", isLabel: true },
          { name: "contact_gender", label: "Gender", type: "string-radio-modern", defaultValue: "", enum: ["male", "female"] }
        ],
        "wc-form": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "method", label: "Method", type: "string-radio-modern", isLabel: true, defaultValue: "", enum: ["get", "post"] },
          { name: "action", label: "Action", type: "string", isSubLabel: true }
        ],
        "wc-hotkey": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "keys", label: "Keys", type: "string", isLabel: true },
          { name: "target", label: "Target", type: "string" }
        ],
        "wc-image": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "url", label: "URL", type: "string" },
          { name: "caption", label: "Caption", type: "string" },
          { name: "hover_overlay", label: "Hover Overlay?", type: "boolean" },
          { name: "hover_mode", label: "Hover Mode", type: "string-radio-modern", defaultValue: "", enum: ["left", "top", "right", "bottom"] },
          { name: "modal", label: "Modal?", type: "boolean" },
          { name: "overlay_content", label: "Overlay Content", type: "multiline-string" }
        ],
        "wc-input": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "minlength", label: "Min Length", type: "string" },
          { name: "maxlength", label: "Max Length", type: "string" },
          { name: "placeholder", label: "Placeholder", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-checkbox": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "is_toggle", label: "Is Toggle?", type: "boolean" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-currency": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "min", label: "Min", type: "string" },
          { name: "max", label: "Max", type: "string" },
          { name: "step", label: "Step", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-date": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "min", label: "Min", type: "string" },
          { name: "max", label: "Max", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-email": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "minlength", label: "Min Length", type: "string" },
          { name: "maxlength", label: "Max Length", type: "string" },
          { name: "placeholder", label: "Placeholder", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-month": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "min", label: "Min", type: "string" },
          { name: "max", label: "Max", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-number": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "min", label: "Min", type: "string" },
          { name: "max", label: "Max", type: "string" },
          { name: "step", label: "Step", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-range": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "min", label: "Min", type: "string" },
          { name: "max", label: "Max", type: "string" },
          { name: "step", label: "Step", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-tel": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "minlength", label: "Min Length", type: "string" },
          { name: "maxlength", label: "Max Length", type: "string" },
          { name: "placeholder", label: "Placeholder", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-time": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "min", label: "Min", type: "string" },
          { name: "max", label: "Max", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-week": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "min", label: "Min", type: "string" },
          { name: "max", label: "Max", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-radio-collection": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "collName", label: "Collection Name", type: "string" },
          { name: "collCSS", label: "Collection CSS", type: "string" },
          { name: "collDisplayMember", label: "Display Member", type: "string" },
          { name: "collValueMember", label: "Value Member", type: "string" },
          { name: "group_class", label: "Radio Group Class", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-radio-lookup": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "lookupName", label: "Lookup Name", type: "string" },
          { name: "lookupCSS", label: "Lookup CSS", type: "string" },
          { name: "group_class", label: "Radio Group Class", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-input-radio": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "group_class", label: "Radio Group Class", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-javascript": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "content", label: "Content", type: "multiline-string" },
          { name: "has_defer", label: "Defer?", type: "boolean" }
        ],
        "wc-list-skeleton": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true }
        ],
        "wc-loader": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "size", label: "Size", type: "string" },
          { name: "speed", label: "Speed", type: "string" },
          { name: "thickness", label: "Thickness", type: "string" }
        ],
        "wc-option": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "value", label: "Value", type: "string" },
          { name: "is_selected", label: "Is Selected?", type: "boolean" }
        ],
        "wc-save-button": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "saveUrl", label: "Save URL", type: "string" }
        ],
        "wc-save-split-button": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "positionArea", label: "Position Area", type: "string-enum", defaultValue: "", enum: [
            // Single keyword values
            "none",
            "top",
            "bottom",
            "left",
            "right",
            "start",
            "end",
            "self-start",
            "self-end",
            "center",
            // Two-value combinations (block-axis inline-axis)
            "top left",
            "top center",
            "top right",
            "top start",
            "top end",
            "top self-start",
            "top self-end",
            "center left",
            "center center",
            "center right",
            "center start",
            "center end",
            "center self-start",
            "center self-end",
            "bottom left",
            "bottom center",
            "bottom right",
            "bottom start",
            "bottom end",
            "bottom self-start",
            "bottom self-end",
            "start left",
            "start center",
            "start right",
            "start start",
            "start end",
            "start self-start",
            "start self-end",
            "end left",
            "end center",
            "end right",
            "end start",
            "end end",
            "end self-start",
            "end self-end",
            "self-start left",
            "self-start center",
            "self-start right",
            "self-start start",
            "self-start end",
            "self-start self-start",
            "self-start self-end",
            "self-end left",
            "self-end center",
            "self-end right",
            "self-end start",
            "self-end end",
            "self-end self-start",
            "self-end self-end",
            // Additional block-axis values with inline-axis
            "left top",
            "left center",
            "left bottom",
            "left start",
            "left end",
            "left self-start",
            "left self-end",
            "right top",
            "right center",
            "right bottom",
            "right start",
            "right end",
            "right self-start",
            "right self-end"
          ] },
          { name: "saveUrl", label: "Save URL", type: "string" },
          { name: "saveNewUrl", label: "Save New URL", type: "string" },
          { name: "saveReturnUrl", label: "Save Return URL", type: "string" }
        ],
        "wc-script": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "src", label: "Src", type: "string" }
        ],
        "wc-select-multiple-collection": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "mode", label: "Mode", type: "string-enum", defaultValue: "", enum: ["", "chip", "multiple"] },
          { name: "collName", label: "Collection Name", type: "string" },
          { name: "collCSS", label: "Collection CSS", type: "string" },
          { name: "collDisplayMember", label: "Display Member", type: "string" },
          { name: "collValueMember", label: "Value Member", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" },
          { name: "allow_dynamic", label: "Allow Dynamic?", type: "boolean" }
        ],
        "wc-select-multiple-lookup": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "mode", label: "Mode", type: "string-enum", defaultValue: "", enum: ["", "chip", "multiple"] },
          { name: "lookupName", label: "Lookup Name", type: "string" },
          { name: "lookupCSS", label: "Lookup CSS", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" },
          { name: "allow_dynamic", label: "Allow Dynamic?", type: "boolean" }
        ],
        "wc-select-multiple": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "mode", label: "Mode", type: "string-enum", defaultValue: "", enum: ["", "chip", "multiple"] },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" },
          { name: "allow_dynamic", label: "Allow Dynamic?", type: "boolean" }
        ],
        "wc-select-collection": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "collName", label: "Collection Name", type: "string" },
          { name: "collCSS", label: "Collection CSS", type: "string" },
          { name: "collDisplayMember", label: "Display Member", type: "string" },
          { name: "collValueMember", label: "Value Member", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-select-lookup": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "lookupName", label: "Lookup Name", type: "string" },
          { name: "lookupCSS", label: "Lookup CSS", type: "string" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-select": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-sidebar": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "width", label: "Width", type: "string" },
          { name: "background_color", label: "Background Color", type: "string" },
          { name: "push_target", label: "Push Target", type: "string" },
          { name: "is_auto_height", label: "Is Auto Height?", type: "boolean" },
          { name: "is_right_side", label: "Is Right Side?", type: "boolean" }
        ],
        "wc-sidenav": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "width", label: "Width", type: "string" },
          { name: "open_top", label: "Open Top", type: "string" },
          { name: "open_btn_css", label: "Open Button CSS", type: "string" },
          { name: "close_btn_css", label: "Close Button CSS", type: "string" },
          { name: "background_color", label: "Background Color", type: "string" },
          { name: "is_push", label: "Is Push?", type: "boolean" },
          { name: "push_target", label: "Push Target", type: "string" },
          { name: "is_open", label: "Is Open?", type: "boolean" },
          { name: "is_auto_height", label: "Is Auto Height?", type: "boolean" },
          { name: "has_open_vertical_text", label: "Has Open Vertical Text?", type: "boolean" },
          { name: "is_right_side", label: "Is Right Side?", type: "boolean" },
          { name: "is_overlay", label: "Is Overlay?", type: "boolean" }
        ],
        "wc-slideshow": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "autoplay", label: "Autoplay?", type: "boolean" },
          { name: "autoplay_interval", label: "Autoplay Interval", type: "number" },
          { name: "max_image_height", label: "Max Image Height", type: "string" }
        ],
        "wc-slideshow-image": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "url", label: "URL", type: "string" },
          { name: "caption", label: "Caption", type: "string" },
          { name: "numbertext", label: "Number Text", type: "string" }
        ],
        "wc-split-button": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "positionArea", label: "Position Area", type: "string-enum", defaultValue: "", enum: [
            // Single keyword values
            "none",
            "top",
            "bottom",
            "left",
            "right",
            "start",
            "end",
            "self-start",
            "self-end",
            "center",
            // Two-value combinations (block-axis inline-axis)
            "top left",
            "top center",
            "top right",
            "top start",
            "top end",
            "top self-start",
            "top self-end",
            "center left",
            "center center",
            "center right",
            "center start",
            "center end",
            "center self-start",
            "center self-end",
            "bottom left",
            "bottom center",
            "bottom right",
            "bottom start",
            "bottom end",
            "bottom self-start",
            "bottom self-end",
            "start left",
            "start center",
            "start right",
            "start start",
            "start end",
            "start self-start",
            "start self-end",
            "end left",
            "end center",
            "end right",
            "end start",
            "end end",
            "end self-start",
            "end self-end",
            "self-start left",
            "self-start center",
            "self-start right",
            "self-start start",
            "self-start end",
            "self-start self-start",
            "self-start self-end",
            "self-end left",
            "self-end center",
            "self-end right",
            "self-end start",
            "self-end end",
            "self-end self-start",
            "self-end self-end",
            // Additional block-axis values with inline-axis
            "left top",
            "left center",
            "left bottom",
            "left start",
            "left end",
            "left self-start",
            "left self-end",
            "right top",
            "right center",
            "right bottom",
            "right start",
            "right end",
            "right self-start",
            "right self-end"
          ] }
        ],
        "wc-tab": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" }
        ],
        "wc-tab-item": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" }
        ],
        "wc-table-skeleton": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true }
        ],
        "wc-tabulator": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "ajax_url", label: "AJAX URL", type: "string" },
          { name: "ajax_params", label: "AJAX Params", type: "multiline-string" },
          { name: "ajax_params_map", label: "AJAX Params Map", type: "multiline-string" },
          { name: "filter_mode", label: "Filter Mode", type: "string-enum", defaultValue: "", enum: ["", "remote"] },
          { name: "initial_filter", label: "Initial Filter", type: "multiline-string" },
          { name: "sort_mode", label: "Sort Mode", type: "string-enum", defaultValue: "", enum: ["", "remote"] },
          { name: "initial_sort", label: "Initial Sort", type: "multiline-string" },
          { name: "data_placeholder", label: "Placeholder", type: "string" },
          { name: "row_context_menu", label: "Row Context Menu", type: "string" },
          { name: "row_header", label: "Row Header", type: "multiline-string" },
          { name: "row_height", label: "Row Height", type: "number" },
          { name: "row_formatter", label: "Row Formatter", type: "multiline-string" },
          { name: "row_click", label: "Row Click", type: "multiline-string" },
          { name: "row_selected", label: "Row Selected", type: "multiline-string" },
          { name: "row_deselected", label: "Row Deselected", type: "multiline-string" },
          { name: "frozen_rows", label: "Frozen Rows", type: "number" },
          { name: "pagination", label: "Pagination?", type: "boolean" },
          { name: "pagination_size", label: "Pagination Size", type: "number" },
          { name: "pagination_counter", label: "Pagination Counter", type: "string" },
          { name: "header_visible", label: "Header Visible?", type: "boolean" },
          { name: "movable_columns", label: "Movable Columns?", type: "boolean" },
          { name: "resizable_columns", label: "Resizable Columns?", type: "boolean" },
          { name: "resizable_column_guide", label: "Resizable Column Guide?", type: "boolean" },
          { name: "movable_rows", label: "Movable Rows?", type: "boolean" },
          { name: "resizable_rows", label: "Resizable Rows?", type: "boolean" },
          { name: "resizable_row_guide", label: "Resizable Row Guide?", type: "boolean" },
          { name: "selectable_rows", label: "Selectable Rows", type: "string" },
          // Can be bool or number
          { name: "persistence", label: "Persistence?", type: "boolean" },
          { name: "layout", label: "Layout", type: "string-enum", defaultValue: "", enum: ["", "fitData", "fitDataFill", "fitDataStretch", "fitDataTable", "fitColumns"] },
          { name: "col_field_formatter", label: "Col Field Formatter", type: "multiline-string" },
          { name: "group_by", label: "Group By", type: "string" },
          { name: "responsive_layout", label: "Responsive Layout", type: "string" },
          { name: "record_size", label: "Record Size", type: "number" }
        ],
        "wc-tabulator-column": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "field", label: "Field", type: "string" },
          { name: "title", label: "Title", type: "string" },
          { name: "title_formatter", label: "Title Formatter", type: "string-datalist", defaultValue: "", enum: [
            "plaintext",
            "textarea",
            "html",
            "money",
            "image",
            "link",
            "datetime",
            "datetimediff",
            "tickCross",
            "color",
            "star",
            "traffic",
            "progress",
            "array",
            "lookup",
            "json",
            "toggle",
            "buttonTick",
            "buttonCross",
            "adaptable",
            "rownum",
            "handle",
            "rowSelection",
            "responsiveCollapse",
            "pageRowNum",
            "urlFormatter",
            "linkFormatter",
            "localdatetime",
            "linklocaldatetime"
          ] },
          { name: "header_filter", label: "Header Filter", type: "string", defaultValue: "" },
          { name: "header_filter_params", label: "Header Filter Params", type: "multiline-string" },
          { name: "header_filter_placeholder", label: "Header Filter Placeholder", type: "string" },
          { name: "header_filter_func", label: "Header Filter Func", type: "string-datalist", defaultValue: "", enum: [
            "=",
            "!=",
            "like",
            "keywords",
            "starts",
            "ends",
            "<",
            "<=",
            ">",
            ">=",
            "in",
            "regex"
          ] },
          { name: "header_hoz_align", label: "Header Horizontal Alignment", type: "string-radio-modern", defaultValue: "", enum: ["left", "center", "right"] },
          { name: "header_menu", label: "Header Menu", type: "string" },
          { name: "header_sort", label: "Header Sort?", type: "boolean" },
          { name: "header_sort_starting_dir", label: "Header Sort Starting Dir", type: "string" },
          { name: "header_sort_tristate", label: "Header Sort Tristate?", type: "boolean" },
          { name: "formatter", label: "Formatter", type: "string-datalist", defaultValue: "", enum: [
            "plaintext",
            "textarea",
            "html",
            "money",
            "image",
            "link",
            "datetime",
            "datetimediff",
            "tickCross",
            "color",
            "star",
            "traffic",
            "progress",
            "array",
            "lookup",
            "json",
            "toggle",
            "buttonTick",
            "buttonCross",
            "adaptable",
            "rownum",
            "handle",
            "rowSelection",
            "responsiveCollapse",
            "pageRowNum",
            "urlFormatter",
            "linkFormatter",
            "localdatetime",
            "linklocaldatetime"
          ] },
          { name: "formatter_params", label: "Formatter Params", type: "multiline-string" },
          { name: "visible", label: "Visible?", type: "boolean" },
          { name: "resizable", label: "Resizable?", type: "boolean" },
          { name: "editable", label: "Editable?", type: "boolean" },
          // Can be boolean or string
          { name: "frozen", label: "Frozen?", type: "boolean" },
          { name: "responsive", label: "Responsive?", type: "boolean" },
          { name: "tooltip", label: "Tooltip", type: "string" },
          { name: "row_handle", label: "Row Handle?", type: "boolean" },
          { name: "html_output", label: "HTML Output", type: "multiline-string" },
          { name: "print", label: "Print?", type: "boolean" },
          { name: "clipboard", label: "Clipboard?", type: "boolean" },
          { name: "width", label: "Width", type: "string" },
          { name: "width_grow", label: "Width Grow", type: "number" },
          { name: "width_shrink", label: "Width Shrink", type: "number" },
          { name: "min_width", label: "Min Width", type: "string" },
          { name: "max_width", label: "Max Width", type: "string" },
          { name: "max_initial_width", label: "Max Initial Width", type: "string" },
          { name: "top_calc", label: "Top Calc", type: "string" },
          { name: "top_calc_params", label: "Top Calc Params", type: "multiline-string" },
          { name: "bottom_calc", label: "Bottom Calc", type: "string" },
          { name: "bottom_cal_params", label: "Bottom Calc Params", type: "multiline-string" },
          { name: "editor", label: "Editor", type: "string-enum", defaultValue: "", enum: ["", "input", "textarea", "number", "range", "tickCross", "star", "progress", "date", "time", "datetime", "list"] },
          { name: "editor_params", label: "Editor Params", type: "multiline-string" },
          { name: "sorter", label: "Sorter", type: "string" },
          { name: "sorter_params", label: "Sorter Params", type: "multiline-string" },
          { name: "hoz_align", label: "Horizontal Alignment", type: "string-radio-modern", defaultValue: "", enum: ["left", "center", "right"] },
          { name: "vert_align", label: "Vertical Alignment", type: "string-radio-modern", defaultValue: "", enum: ["top", "middle", "bottom"] },
          { name: "cell_click", label: "Cell Click", type: "multiline-string" }
        ],
        "wc-tabulator-func": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "name", label: "Name", type: "string" },
          { name: "value", label: "Value", type: "multiline-string" }
        ],
        "wc-tabulator-row-menu": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "order", label: "Order", type: "number" },
          { name: "icon", label: "Icon", type: "string" },
          { name: "value", label: "Value", type: "multiline-string" }
        ],
        "wc-textarea": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "label", label: "Label", type: "string", isLabel: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "scope", label: "Scope", type: "string", isSubLabel: true },
          { name: "placeholder", label: "Placeholder", type: "string" },
          { name: "rows", label: "Rows", type: "number" },
          { name: "is_readonly", label: "Is Readonly?", type: "boolean" },
          { name: "is_disabled", label: "Is Disabled?", type: "boolean" },
          { name: "is_required", label: "Is Required?", type: "boolean" }
        ],
        "wc-theme-selector": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "theme", label: "Theme", type: "string-datalist", defaultValue: "", enum: [
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
          ] },
          { name: "mode", label: "Mode", type: "string-radio-modern", defaultValue: "", enum: ["light", "dark"] }
        ],
        "wc-timeline": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" }
        ],
        "wc-timeline-option": [
          { name: "id", label: "ID", type: "string", isReadonly: true },
          { name: "type", label: "Type", type: "string", isReadonly: true },
          { name: "css", label: "CSS", type: "string" },
          { name: "value", label: "Value", type: "string" },
          { name: "content", label: "Content", type: "multiline-string" }
        ]
      };
      this.floatingToolbar = null;
      this.currentHoveredElement = null;
      this.toolbarVisible = false;
      const compEl = this.querySelector(".wc-page-designer");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.createElement();
      }
    }
    async connectedCallback() {
      await this.render();
      this._applyStyle();
      this.wireEvents();
      setTimeout(() => {
        this.setup();
      }, 250);
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
      } else if (attrName === "json-layout") {
        this.jsonLayout = newValue;
      } else if (attrName === "json-layout-fetch-url") {
        this.jsonLayoutFetchUrl = newValue;
        const layoutEditor = this.querySelector('wc-code-mirror[name="jsonLayout"]');
        layoutEditor.setAttribute("fetch", this.jsonLayoutFetchUrl);
      } else if (attrName === "json-schema-fetch-url") {
        this.jsonSchemaFetchUrl = newValue;
        const schemaJson = this.querySelector('wc-code-mirror[name="jsonSchema"]');
        schemaJson.setAttribute("fetch", this.jsonSchemaFetchUrl);
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
  <div class="wc-page-designer ${this.theme} flex flex-row flex-1 min-h-0 h-screen">
    <!-- Left Panel - Elements -->
    <div class="left-panel flex flex-col min-h-0 overflow-scroll p-2">
      <wc-tab class="flex flex-col flex-1 min-h-0" animate>
        <wc-tab-item class="active" label="Containers">
          <input class="sticky mx-2 mt-2 mb-2" type="search" id="element_filter" placeholder="Containers..."
            oninput="
            const query = this.value.trim().toLowerCase();
            const elements = this.parentElement.querySelectorAll('.element-list .element-item');
            elements.forEach(el => {
              const text = el.textContent.trim().toLowerCase();
              if (query === '' || text.startsWith(query)) {
                el.classList.remove('hidden');
              } else {
                el.classList.add('hidden');
              }
            });
          ">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="container-elements">
            <div class="element-item" data-element-type="div" draggable="true">Div</div>
            <div class="element-item" data-element-type="column" draggable="true">Column</div>
            <div class="element-item" data-element-type="row" draggable="true">Row</div>
            <div class="element-item" data-element-type="data-array" draggable="true">Data Array</div>
            <div class="element-item" data-element-type="data-item" draggable="true">Data Item</div>
            <div class="element-item" data-element-type="fieldset" draggable="true">Fieldset</div>
            <div class="element-item" data-element-type="wc-accordion" draggable="true">WC Accordion</div>
            <div class="element-item" data-element-type="wc-breadcrumb" draggable="true">WC Breadcrumb</div>
            <div class="element-item" data-element-type="wc-form" draggable="true">WC Form</div>
            <div class="element-item" data-element-type="wc-input-radio" draggable="true">WC Input Radio</div>
            <div class="element-item" data-element-type="wc-select-multiple" draggable="true">WC Select Multiple</div>
            <div class="element-item" data-element-type="wc-select" draggable="true">WC Select</div>
            <div class="element-item" data-element-type="wc-sidebar" draggable="true">WC Sidebar</div>
            <div class="element-item" data-element-type="wc-sidenav" draggable="true">WC Sidenav</div>
            <div class="element-item" data-element-type="wc-slideshow" draggable="true">WC Slideshow</div>
            <div class="element-item" data-element-type="wc-split-button" draggable="true">WC Split Button</div>
            <div class="element-item" data-element-type="wc-tab" draggable="true">WC Tab Container</div>
            <div class="element-item" data-element-type="wc-tab-item" draggable="true">WC Tab Item</div>
            <div class="element-item" data-element-type="wc-tabulator" draggable="true">WC Tabulator</div>
            <div class="element-item" data-element-type="wc-timeline" draggable="true">WC Timeline</div>
          </div>
        </wc-tab-item>
        <wc-tab-item class="" label="Elements">
          <input class="sticky mx-2 mt-2 mb-2" type="search" id="element_filter" placeholder="Elements..."
            oninput="
            const query = this.value.trim().toLowerCase();
            const elements = this.parentElement.querySelectorAll('.element-list .element-item');
            elements.forEach(el => {
              const text = el.textContent.trim().toLowerCase();
              if (query === '' || text.startsWith(query)) {
                el.classList.remove('hidden');
              } else {
                el.classList.add('hidden');
              }
            });
          ">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="form-elements">
            <div class="element-item" data-element-type="a" draggable="true">Anchor</div>
            <div class="element-item" data-element-type="hr" draggable="true">Horizontal Line</div>
            <div class="element-item" data-element-type="wc-article-skeleton" draggable="true">WC Article Skeleton</div>
            <div class="element-item" data-element-type="wc-card-skeleton" draggable="true">WC Card Skeleton</div>
            <div class="element-item" data-element-type="wc-list-skeleton" draggable="true">WC List Skeleton</div>
            <div class="element-item" data-element-type="wc-table-skeleton" draggable="true">WC Table Skeleton</div>
            <div class="element-item" data-element-type="wc-accordion-option" draggable="true">WC Accordion Option</div>
            <div class="element-item" data-element-type="wc-background-image" draggable="true">WC Backgruond Image</div>
            <div class="element-item" data-element-type="wc-breadcrumb-item" draggable="true">WC Breadcrumb Item</div>
            <div class="element-item" data-element-type="wc-code-mirror" draggable="true">WC Code Mirror</div>
            <div class="element-item" data-element-type="wc-contact-card" draggable="true">WC Contact Card</div>
            <div class="element-item" data-element-type="wc-contact-chip" draggable="true">WC Contact Chip</div>
            <div class="element-item" data-element-type="wc-hotkey" draggable="true">WC Hotkey</div>
            <div class="element-item" data-element-type="wc-image" draggable="true">WC Image</div>
            <div class="element-item" data-element-type="wc-input" draggable="true">WC Input</div>
            <div class="element-item" data-element-type="wc-input-checkbox" draggable="true">WC Input Checkbox</div>
            <div class="element-item" data-element-type="wc-input-currency" draggable="true">WC Input Currency</div>
            <div class="element-item" data-element-type="wc-input-date" draggable="true">WC Input Date</div>
            <div class="element-item" data-element-type="wc-input-email" draggable="true">WC Input Email</div>
            <div class="element-item" data-element-type="wc-input-month" draggable="true">WC Input Month</div>
            <div class="element-item" data-element-type="wc-input-number" draggable="true">WC Input Number</div>
            <div class="element-item" data-element-type="wc-input-radio-collection" draggable="true">WC Input Radio Collection</div>
            <div class="element-item" data-element-type="wc-input-radio-lookup" draggable="true">WC Input Radio Lookup</div>
            <div class="element-item" data-element-type="wc-input-range" draggable="true">WC Input Range</div>
            <div class="element-item" data-element-type="wc-input-tel" draggable="true">WC Input Phone</div>
            <div class="element-item" data-element-type="wc-input-time" draggable="true">WC Input Time</div>
            <div class="element-item" data-element-type="wc-input-week" draggable="true">WC Input Week</div>
            <div class="element-item" data-element-type="wc-loader" draggable="true">WC Loader</div>
            <div class="element-item" data-element-type="wc-option" draggable="true">WC Option</div>
            <div class="element-item" data-element-type="wc-save-button" draggable="true">WC Save Button</div>
            <div class="element-item" data-element-type="wc-save-split-button" draggable="true">WC Save Split Button</div>
            <div class="element-item" data-element-type="wc-script" draggable="true">WC Script</div>
            <div class="element-item" data-element-type="wc-select-multiple-collection" draggable="true">WC Select Multiple Collection</div>
            <div class="element-item" data-element-type="wc-select-multiple-lookup" draggable="true">WC Select Multiple Lookup</div>
            <div class="element-item" data-element-type="wc-select-collection" draggable="true">WC Select Collection</div>
            <div class="element-item" data-element-type="wc-select-lookup" draggable="true">WC Select Lookup</div>
            <div class="element-item" data-element-type="wc-slideshow-image" draggable="true">WC Slideshow Image</div>
            <div class="element-item" data-element-type="wc-tabulator-column" draggable="true">WC Tabulator Column</div>
            <div class="element-item" data-element-type="wc-tabulator-func" draggable="true">WC Tabulator Func</div>
            <div class="element-item" data-element-type="wc-tabulator-row-menu" draggable="true">WC Tabulator Row Menu</div>
            <div class="element-item" data-element-type="wc-textarea" draggable="true">WC Textarea</div>
            <div class="element-item" data-element-type="wc-theme-selector" draggable="true">WC Theme Selector</div>
            <div class="element-item" data-element-type="wc-timeline-option" draggable="true">WC Timeline Option</div>
          </div>
        </wc-tab-item>
        <wc-tab-item class="" label="Fields">
          <input class="sticky mx-2 mt-2 mb-2" type="search" id="element_filter" placeholder="Fields..."
            oninput="
            const query = this.value.trim().toLowerCase();
            const elements = this.parentElement.querySelectorAll('.element-list .element-item');
            elements.forEach(el => {
              const text = el.textContent.trim().toLowerCase();
              if (query === '' || text.startsWith(query)) {
                el.classList.remove('hidden');
              } else {
                el.classList.add('hidden');
              }
            });
          ">
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
              _="install HandleCodeMirrorTabChange end"
              name="jsonSchema"
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
              _="install HandleCodeMirrorTabChange end"
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
          <div class="flex flex-col flex-1 min-h-0 min-w-0 overflow-scroll gap-2 py-2 px-4">
            <div id="no-selection" class="col-1 text-center text-muted py-4">
              <p>Select an element to view and edit its properties</p>
            </div>
            <div id="element-properties" class="col-1 gap-2 hidden">
              <!-- Custom properties will be dynamically added here -->
              <div id="custom-properties-container" class="mt-3">
                <div id="custom-properties" class="col-1 gap-2"></div>
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
              <div id="rules-list" class="flex flex-col gap-2">
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


        /* Floating toolbar styles */
        wc-page-designer .floating-element-toolbar {
          position: absolute;
          background: var(--surface-1, white);
          border: 1px solid var(--surface-4, #dee2e6);
          border-radius: 4px;
          display: flex;
          gap: 1px;
          padding: 2px;
          z-index: 9999;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s ease, visibility 0.2s ease;
          pointer-events: none;
        }
        
        wc-page-designer .floating-element-toolbar.visible {
          opacity: 1;
          visibility: visible;
          pointer-events: auto;
        }
        
        wc-page-designer .floating-element-toolbar .toolbar-btn {
          width: 18px;
          height: 18px;
          border: none;
          border-radius: 2px;
          background: var(--button-bg-color, #f8f9fa);
          color: var(--button-color, #495057);
          font-size: 10px;
          font-weight: bold;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.2s ease;
          line-height: 1;
        }
        
        wc-page-designer .floating-element-toolbar .toolbar-btn:hover {
          background: var(--button-hover-bg-color, #e9ecef);
        }
        
        wc-page-designer .floating-element-toolbar .toolbar-btn.delete-element {
          background: #dc3545;
          color: white;
        }
        
        wc-page-designer .floating-element-toolbar .toolbar-btn.delete-element:hover {
          background: #c82333;
        }
        
        wc-page-designer .floating-element-toolbar .toolbar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        wc-page-designer .floating-element-toolbar .toolbar-btn.clone-element {
          background: #17a2b8;
          color: white;
        }

        wc-page-designer .floating-element-toolbar .toolbar-btn.clone-element:hover {
          background: #138496;
        }
        
        /* Dark mode support */
        wc-page-designer .dark .floating-element-toolbar {
          background: var(--surface-2);
          border-color: var(--surface-5);
        }
        
        wc-page-designer .dark .floating-element-toolbar .toolbar-btn {
          background: var(--surface-3);
          color: var(--text-1);
        }
        
        wc-page-designer .dark .floating-element-toolbar .toolbar-btn:hover {
          background: var(--surface-4);
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
      this.schemaJson = document.querySelector('wc-code-mirror[name="jsonSchema"]');
      this.loadSchemaButton = document.getElementById("load-schema");
      this.addRuleButton = document.getElementById("add-rule");
      this.rulesList = document.getElementById("rules-list");
      this.saveRuleButton = document.getElementById("save-rule");
      this.loadDesignButton = document.getElementById("load-design");
      this.copyDesignButton = document.getElementById("copy-design");
      this.downloadDesignButton = document.getElementById("download-design");
      this.init();
      this.createFloatingToolbar();
      this.setupFloatingToolbar();
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
          const id = this.generateUniqueId();
          const newElement = {
            id,
            "data-id": id,
            type: elementType,
            elements: []
          };
          const customProps = this.elementCustomProperties[elementType];
          if (customProps && customProps.length > 0) {
            customProps.forEach((prop) => {
              if (prop.type === "boolean") {
                newElement[prop.name] = false;
              } else if (prop.type === "number") {
                newElement[prop.name] = null;
              } else {
                if (prop.name === "id") {
                  newElement[prop.name] = id;
                } else if (prop.name === "type") {
                  newElement[prop.name] = elementType;
                } else if (prop.name === "label" && schemaField) {
                  const parts = schemaField.split("/");
                  let label = parts[parts.length - 1];
                  if (schemaField.includes("$defs")) {
                    const defName = parts[2];
                    const fieldName = parts[parts.length - 1];
                    if (defName && fieldName) {
                      label = defName + "." + fieldName;
                    }
                  }
                  newElement[prop.name] = label;
                } else if (prop.name === "scope" && schemaField) {
                  newElement[prop.name] = schemaField;
                } else if (prop.defaultValue !== void 0) {
                  newElement[prop.name] = prop.defaultValue;
                } else {
                  newElement[prop.name] = "";
                }
              }
            });
          }
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
              console.warn("Could not remove placeholder:", e2);
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
      element.addEventListener("drop2", (e) => {
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
          const customProps = this.elementCustomProperties[elementType];
          if (customProps && customProps.length > 0) {
            customProps.forEach((prop) => {
              if (prop.type === "boolean") {
                newElement[prop.name] = false;
              } else if (prop.type === "number") {
                newElement[prop.name] = null;
              } else {
                if (prop.name === "id") {
                  newElement[prop.name] = id;
                } else if (prop.name === "type") {
                  newElement[prop.name] = elementType;
                } else if (prop.name === "label") {
                  newElement[prop.name] = label;
                } else if (prop.name === "scope") {
                  newElement[prop.name] = scope;
                } else {
                  if (prop.defaultValue) {
                    newElement[prop.name] = prop.defaultValue;
                  } else {
                    newElement[prop.name] = "";
                  }
                }
              }
            });
          }
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
              console.warn("Could not remove placeholder:", e2);
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
      this.schemaJson.addEventListener("fetch-complete", (e) => {
        try {
          const schema = JSON.parse(this.schemaJson.editor.getValue());
          this.loadSchema(schema);
        } catch (e2) {
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
            this.saveRule(result);
          }
        };
        wc.Prompt.notifyTemplate(promptPayload);
      });
      this.jsonOutput.addEventListener("wc-code-mirror:ready", () => {
        this.jsonOutput.editor.on("change2", async () => {
          try {
            const jsonText = this.jsonOutput.editor.getValue().trim();
            const layoutData = JSON.parse(jsonText);
            this.loadDesign(layoutData);
          } catch (e) {
            alert("Invalid JSON format: " + e.message);
          }
        });
      });
      this.jsonOutput.addEventListener("fetch-complete", (e) => {
        const jsonText = this.jsonOutput.editor.getValue().trim();
        const layoutData = JSON.parse(jsonText);
        this.loadDesign(layoutData);
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
        elements: []
      };
      const customProps = this.elementCustomProperties[type];
      if (customProps && customProps.length > 0) {
        customProps.forEach((prop) => {
          if (prop.type === "boolean") {
            element[prop.name] = false;
          } else if (prop.type === "number") {
            element[prop.name] = null;
          } else {
            if (prop.defaultValue !== void 0) {
              element[prop.name] = prop.defaultValue;
            } else {
              element[prop.name] = "";
            }
          }
        });
      }
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
      const labelElement = document.createElement("span");
      labelElement.className = "element-label";
      node.appendChild(labelElement);
      const subLabelElement = document.createElement("small");
      subLabelElement.className = "ms-2 text-muted";
      const customProps = this.elementCustomProperties[element.type];
      if (customProps && customProps.length > 0) {
        let hasLabel = false;
        let subLabelText = "";
        customProps.forEach((prop) => {
          if (prop.isLabel && element[prop.name]) {
            labelElement.textContent = element[prop.name];
            hasLabel = true;
          } else if (prop.isSubLabel) {
            const subLabelValue = element[prop.name];
            if (subLabelValue && subLabelValue.trim() !== "") {
              subLabelText = `(${subLabelValue})`;
            }
          }
        });
        if (!hasLabel) {
          labelElement.textContent = element.type;
        }
        if (subLabelText) {
          subLabelElement.textContent = subLabelText;
          labelElement.appendChild(subLabelElement);
        }
      } else {
        labelElement.textContent = element.type;
      }
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
      const customPropertiesContainer = document.getElementById("custom-properties");
      customPropertiesContainer.innerHTML = "";
      document.getElementById("custom-properties-container").style.display = "block";
      const customProps = this.elementCustomProperties[element.type];
      if (customProps && customProps.length > 0) {
        customProps.forEach((prop) => {
          const value = element[prop.name] !== void 0 ? element[prop.name] : prop.type === "boolean" ? false : prop.type === "number" ? null : prop.defaultValue || "";
          const propInput = this.createCustomPropertyInput(prop, value);
          customPropertiesContainer.appendChild(propInput);
        });
      } else {
        const noPropsMessage = document.createElement("p");
        noPropsMessage.className = "text-muted text-center";
        noPropsMessage.textContent = "No custom properties defined for this element type";
        customPropertiesContainer.appendChild(noPropsMessage);
      }
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
        editButton.addEventListener("click", () => this.editRule(index));
        ruleActions.appendChild(editButton);
        const deleteButton = document.createElement("button");
        deleteButton.className = "theme-fire dark";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", async () => this.deleteRule(index));
        ruleActions.appendChild(deleteButton);
        ruleHeader.appendChild(ruleActions);
        ruleItem.appendChild(ruleHeader);
        const ruleSummary = document.createElement("div");
        ruleSummary.className = "text-sm";
        const condition = document.createElement("div");
        condition.textContent = `When ${rule.condition.scope} ${this.getSchemaDescription(rule.condition.schema)}`;
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
      const customProps = this.elementCustomProperties[this.designerState.selectedElement.type];
      if (customProps && customProps.length > 0) {
        customProps.forEach((prop) => {
          if (prop.isReadonly) {
            return;
          }
          let value;
          const chk = document.querySelector(`input[type="radio"][name="prop-custom-${prop.name}"]:checked`);
          if (chk) {
            value = chk.value;
            this.designerState.selectedElement[prop.name] = value;
          } else {
            const input2 = document.getElementById(`prop-custom-${prop.name}`);
            if (input2) {
              if (prop.type === "boolean") {
                value = input2.checked;
              } else if (prop.type === "number") {
                value = input2.value !== "" ? Number(input2.value) : null;
              } else {
                value = input2.value;
              }
              this.designerState.selectedElement[prop.name] = value;
            }
          }
        });
      }
      this.generateJson();
      this.refreshDesigner();
      wc.Prompt.toast({ title: "Properties Updated!" });
    }
    // Refresh Designer
    refreshDesigner() {
      const selectedId = this.designerState.selectedElement ? this.designerState.selectedElement.id : null;
      const wasToolbarVisible = this.toolbarVisible;
      const currentHoveredElementId = this.currentHoveredElementData ? this.currentHoveredElementData.id : null;
      this.hideToolbar();
      this.designerSurface.innerHTML = "";
      this.floatingToolbar = null;
      this.createFloatingToolbar();
      this.designerState.elements.forEach((element) => {
        this.addElementToDesigner(element, this.designerSurface);
      });
      if (selectedId) {
        this.selectElement(selectedId);
      }
      if (wasToolbarVisible && currentHoveredElementId) {
        setTimeout(() => {
          const elementNode = document.querySelector(`.designer-element[data-id="${currentHoveredElementId}"]`);
          if (elementNode) {
            this.showToolbarForElement(elementNode);
          }
        }, 100);
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
      const _id = document.querySelector('input[name="_id"]').value;
      form.method = "GET";
      form.action = `/view/${_id}`;
      form.target = "rendered-preview";
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
      const _id = document.querySelector('input[name="_id"]').value;
      form.method = "GET";
      form.action = `/view/pre/${_id}`;
      form.target = "pre-rendered-preview";
      document.body.appendChild(form);
      form.submit();
      form.remove();
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
        "div",
        "column",
        "row",
        "data-array",
        "data-item",
        "fieldset",
        "option",
        "wc-accordion",
        "wc-breadcrumb",
        "wc-form",
        "wc-input-radio",
        "wc-select",
        "wc-select-multiple",
        "wc-sidebar",
        "wc-sidenav",
        "wc-slideshow",
        "wc-split-button",
        "wc-timeline",
        "wc-tab",
        "wc-tab-item",
        "wc-tabulator"
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
    //
    // Custom Properties
    //
    createCustomPropertyInput(property, value) {
      const row = document.createElement("div");
      row.className = "row mb-2";
      let input2;
      const propId = `prop-custom-${property.name}`;
      if (property.type === "boolean") {
        input2 = new (customElements.get("wc-input"))();
        input2.setAttribute("name", propId);
        input2.setAttribute("lbl-label", property.label);
        input2.setAttribute("class", "col");
        input2.setAttribute("type", "checkbox");
        input2.setAttribute("toggle-switch", "");
        if (value === true) {
          input2.setAttribute("checked", "");
          setTimeout(() => {
            input2.checked = true;
          }, 10);
        }
        if (property.isReadonly) {
          input2.setAttribute("disabled", "");
        }
      } else if (property.type === "number") {
        input2 = new (customElements.get("wc-input"))();
        input2.setAttribute("name", propId);
        input2.setAttribute("lbl-label", property.label);
        input2.setAttribute("class", "col-1");
        input2.setAttribute("type", "number");
        input2.setAttribute("value", value !== void 0 ? value : 0);
        if (property.isReadonly) {
          input2.setAttribute("readonly", "");
        }
      } else if (property.type === "multiline-string") {
        input2 = new (customElements.get("wc-textarea"))();
        input2.setAttribute("name", propId);
        input2.setAttribute("lbl-label", property.label);
        input2.setAttribute("class", "col-1");
        input2.setAttribute("value", value !== void 0 ? value : "");
        if (property.isReadonly) {
          input2.setAttribute("readonly", "");
        }
      } else if (property.type === "string-datalist") {
        input2 = new (customElements.get("wc-input"))();
        input2.setAttribute("name", propId);
        input2.setAttribute("lbl-label", property.label);
        input2.setAttribute("class", "col-1");
        input2.setAttribute("value", value !== void 0 ? value : "");
        input2.setAttribute("list", `${propId}_list`);
        if (property.isReadonly) {
          input2.setAttribute("readonly", "");
        }
        const datalist = document.createElement("datalist");
        datalist.id = `${propId}_list`;
        property.enum.forEach((value2) => {
          const option = document.createElement("option");
          option.value = value2;
          option.textContent = value2;
          datalist.appendChild(option);
        });
        row.appendChild(datalist);
      } else if (property.type === "string-enum") {
        input2 = new (customElements.get("wc-select"))();
        input2.setAttribute("name", propId);
        input2.setAttribute("lbl-label", property.label);
        input2.setAttribute("class", "col-1");
        input2.setAttribute("value", value !== void 0 ? value : "");
        const items = property.enum.map((m) => `{"key": "${m}", "value": "${m}"}`);
        input2.setAttribute("items", `[${items}]`);
        if (property.isReadonly) {
          input2.setAttribute("disabled", "");
        }
      } else if (property.type === "string-radio-modern") {
        input2 = new (customElements.get("wc-input"))();
        input2.setAttribute("name", propId);
        input2.setAttribute("lbl-label", property.label);
        input2.setAttribute("type", "radio");
        input2.setAttribute("class", "col-1");
        input2.setAttribute("radio-group-class", "row modern");
        input2.setAttribute("value", value !== void 0 ? value : "");
        const options = property.enum.map((m) => `{"key": "${m}", "value": "${m}"}`);
        input2.setAttribute("options", `[${options}]`);
        if (property.isReadonly) {
          input2.setAttribute("disabled", "");
        }
      } else if (property.type === "string-radio") {
        input2 = new (customElements.get("wc-input"))();
        input2.setAttribute("name", propId);
        input2.setAttribute("lbl-label", property.label);
        input2.setAttribute("type", "radio");
        input2.setAttribute("class", "col-1");
        input2.setAttribute("radio-group-class", "row");
        input2.setAttribute("value", value !== void 0 ? value : "");
        const options = property.enum.map((m) => `{"key": "${m}", "value": "${m}"}`);
        input2.setAttribute("options", `[${options}]`);
        if (property.isReadonly) {
          input2.setAttribute("disabled", "");
        }
      } else {
        input2 = new (customElements.get("wc-input"))();
        input2.setAttribute("name", propId);
        input2.setAttribute("lbl-label", property.label);
        input2.setAttribute("class", "col-1");
        input2.setAttribute("value", value !== void 0 ? value : "");
        if (property.isReadonly) {
          input2.setAttribute("readonly", "");
        }
      }
      input2.dataset.propertyName = property.name;
      input2.dataset.propertyType = property.type;
      input2.dataset.isReadonly = property.isReadonly ? "true" : "false";
      row.appendChild(input2);
      return row;
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
    //
    // Floating Toolbar
    //
    createFloatingToolbar() {
      if (this.floatingToolbar) {
        this.floatingToolbar.remove();
        this.floatingToolbar = null;
      }
      const toolbar = document.createElement("div");
      toolbar.className = "floating-element-toolbar";
      toolbar.innerHTML = `
        <button class="toolbar-btn move-up" title="Move Up">\u2191</button>
        <button class="toolbar-btn move-down" title="Move Down">\u2193</button>
        <button class="toolbar-btn move-out" title="Move Out">\u2190</button>
        <button class="toolbar-btn clone-element" title="Clone">\u29C9</button>
        <button class="toolbar-btn delete-element" title="Delete">\xD7</button>
      `;
      toolbar.querySelector(".move-up").addEventListener("click", (e) => {
        e.stopPropagation();
        this.moveElementUp();
      });
      toolbar.querySelector(".move-down").addEventListener("click", (e) => {
        e.stopPropagation();
        this.moveElementDown();
      });
      toolbar.querySelector(".move-out").addEventListener("click", (e) => {
        e.stopPropagation();
        this.moveElementOut();
      });
      toolbar.querySelector(".clone-element").addEventListener("click", (e) => {
        e.stopPropagation();
        this.cloneCurrentElement();
      });
      toolbar.querySelector(".delete-element").addEventListener("click", (e) => {
        e.stopPropagation();
        this.deleteCurrentElement();
      });
      this.designerSurface.appendChild(toolbar);
      this.floatingToolbar = toolbar;
    }
    setupFloatingToolbar() {
      this.designerSurface.addEventListener("click", (e) => {
        const designerElement = e.target.closest(".designer-element");
        if (designerElement) {
          e.stopPropagation();
          if (this.currentHoveredElement === designerElement && this.toolbarVisible) {
            this.hideToolbar();
            return;
          }
          this.showToolbarForElement(designerElement);
          const elementId = designerElement.getAttribute("data-id");
          this.selectElement(elementId);
        }
      });
      document.addEventListener("click", (e) => {
        if (!this.floatingToolbar?.contains(e.target) && !e.target.closest(".designer-element") && !e.target.closest(".designer-surface")) {
          this.hideToolbar();
        }
      });
    }
    // Add method to show toolbar for specific element
    showToolbarForElement(elementNode) {
      const elementId = elementNode.getAttribute("data-id");
      const element = this.findElementById(elementId);
      if (!element) return;
      this.currentHoveredElement = elementNode;
      this.currentHoveredElementData = element;
      this.updateToolbarButtonStates(element);
      this.positionToolbarOnElement(elementNode);
      this.floatingToolbar.classList.add("visible");
      this.toolbarVisible = true;
    }
    // Add method to hide toolbar
    hideToolbar() {
      if (this.floatingToolbar) {
        this.floatingToolbar.classList.remove("visible");
        this.toolbarVisible = false;
        this.currentHoveredElement = null;
        this.currentHoveredElementData = null;
      }
    }
    // Add method to position toolbar on element
    positionToolbarOnElement(elementNode) {
      if (!this.floatingToolbar || !elementNode) return;
      const elementRect = elementNode.getBoundingClientRect();
      const surfaceRect = this.designerSurface.getBoundingClientRect();
      const left = elementRect.right - surfaceRect.left - 207;
      const top = elementRect.top - surfaceRect.top + 5;
      this.floatingToolbar.style.left = `${left}px`;
      this.floatingToolbar.style.top = `${top}px`;
    }
    // Add method to update button states
    updateToolbarButtonStates(element) {
      if (!this.floatingToolbar || !element) return;
      const moveUpBtn = this.floatingToolbar.querySelector(".move-up");
      const moveDownBtn = this.floatingToolbar.querySelector(".move-down");
      const moveOutBtn = this.floatingToolbar.querySelector(".move-out");
      const canMoveUp = this.canMoveElementUp(element);
      moveUpBtn.disabled = !canMoveUp;
      const canMoveDown = this.canMoveElementDown(element);
      moveDownBtn.disabled = !canMoveDown;
      const canMoveOut = this.canMoveElementOut(element);
      moveOutBtn.disabled = !canMoveOut;
    }
    // Add helper methods to check movement possibilities
    canMoveElementUp(element) {
      const parent = this.findParentElement(element.id);
      const siblings = parent ? parent.elements : this.designerState.elements;
      const currentIndex = siblings.findIndex((e) => e.id === element.id);
      return currentIndex > 0;
    }
    canMoveElementDown(element) {
      const parent = this.findParentElement(element.id);
      const siblings = parent ? parent.elements : this.designerState.elements;
      const currentIndex = siblings.findIndex((e) => e.id === element.id);
      return currentIndex < siblings.length - 1;
    }
    canMoveElementOut(element) {
      return this.findParentElement(element.id) !== null;
    }
    // Add movement methods
    moveElementUp() {
      if (!this.currentHoveredElementData) return;
      const element = this.currentHoveredElementData;
      const parent = this.findParentElement(element.id);
      const siblings = parent ? parent.elements : this.designerState.elements;
      const currentIndex = siblings.findIndex((e) => e.id === element.id);
      if (currentIndex > 0) {
        [siblings[currentIndex - 1], siblings[currentIndex]] = [siblings[currentIndex], siblings[currentIndex - 1]];
        this.refreshDesigner();
        this.hideToolbar();
      }
    }
    moveElementDown() {
      if (!this.currentHoveredElementData) return;
      const element = this.currentHoveredElementData;
      const parent = this.findParentElement(element.id);
      const siblings = parent ? parent.elements : this.designerState.elements;
      const currentIndex = siblings.findIndex((e) => e.id === element.id);
      if (currentIndex < siblings.length - 1) {
        [siblings[currentIndex], siblings[currentIndex + 1]] = [siblings[currentIndex + 1], siblings[currentIndex]];
        this.refreshDesigner();
        this.hideToolbar();
      }
    }
    moveElementOut() {
      if (!this.currentHoveredElementData) return;
      const element = this.currentHoveredElementData;
      const parent = this.findParentElement(element.id);
      if (!parent) return;
      const grandParent = this.findParentElement(parent.id);
      const parentSiblings = grandParent ? grandParent.elements : this.designerState.elements;
      const parentIndex = parentSiblings.findIndex((e) => e.id === parent.id);
      parent.elements = parent.elements.filter((e) => e.id !== element.id);
      parentSiblings.splice(parentIndex + 1, 0, element);
      this.refreshDesigner();
      this.hideToolbar();
    }
    cloneCurrentElement() {
      if (!this.currentHoveredElementData) return;
      const element = this.currentHoveredElementData;
      const clonedElement = this.deepCloneElement(element);
      const parent = this.findParentElement(element.id);
      const siblings = parent ? parent.elements : this.designerState.elements;
      const currentIndex = siblings.findIndex((e) => e.id === element.id);
      siblings.splice(currentIndex + 1, 0, clonedElement);
      this.refreshDesigner();
      this.hideToolbar();
      setTimeout(() => {
        this.selectElement(clonedElement.id);
      }, 100);
    }
    deepCloneElement(element) {
      const cloned = JSON.parse(JSON.stringify(element));
      this.regenerateIds(cloned);
      return cloned;
    }
    regenerateIds(element) {
      const newId = this.generateUniqueId();
      element.id = newId;
      element["data-id"] = newId;
      if (element.elements && element.elements.length > 0) {
        element.elements.forEach((child) => {
          this.regenerateIds(child);
        });
      }
    }
    deleteCurrentElement() {
      if (!this.currentHoveredElementData) return;
      this.removeElement(this.currentHoveredElementData.id);
      this.hideToolbar();
    }
  }
  customElements.define("wc-page-designer", WcPageDesigner);
}

// src/js/components/wc-save-button.js
if (!customElements.get("wc-save-button")) {
  class WcSaveButton extends WcBaseComponent {
    static get observedAttributes() {
      return ["form", "hx-include"];
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
        const label = this.getAttribute("label") || "Save";
        const hxInclude = this.getAttribute("hx-include") || "";
        this.componentElement = document.createElement("button");
        this.componentElement.type = "button";
        this.componentElement.id = id;
        this.removeAttribute("id");
        this.componentElement.textContent = label;
        this.componentElement.classList.add("wc-save-button", "btn");
        this.componentElement.setAttribute("hx-target", "#viewport");
        this.componentElement.setAttribute("hx-swap", "innerHTML transition:true");
        this.componentElement.setAttribute("hx-indicator", "#content-loader");
        this.componentElement.setAttribute("hx-post", saveUrl);
        this.componentElement.setAttribute("hx-trigger", "validated");
        this.removeAttribute("save-url");
        this.componentElement.setAttribute("hx-push-url", "true");
        if (hxInclude) {
          this.componentElement.setAttribute("hx-include", hxInclude);
        }
        this.appendChild(this.componentElement);
      }
    }
    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
    }
    disconnectedCallback() {
      this._unWireEvents();
    }
    _handleAttributeChange(attrName, newValue) {
      if (attrName === "hx-include") {
        if (newValue) {
          this.componentElement.setAttribute("hx-include", newValue);
        } else {
          this.componentElement.removeAttribute("hx-include");
        }
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }
    _validateForm() {
      const formSelector = this.getAttribute("form") || this.getAttribute("hx-include");
      if (!formSelector) {
        return true;
      }
      const form = document.querySelector(formSelector);
      if (!form || form.tagName !== "FORM") {
        return true;
      }
      const isValid = form.checkValidity();
      if (!isValid) {
        const firstInvalidField = form.querySelector(":invalid");
        if (firstInvalidField) {
          const isHidden = firstInvalidField.offsetParent === null;
          if (isHidden) {
            const accordion = firstInvalidField.closest("wc-accordion");
            if (accordion) {
              const accordionItem = firstInvalidField.closest(".accordion-item");
              if (accordionItem) {
                const header = accordionItem.querySelector(".accordion-header");
                if (header && !header.classList.contains("selected")) {
                  header.click();
                  setTimeout(() => {
                    firstInvalidField.focus();
                    form.reportValidity();
                  }, 100);
                  return false;
                }
              }
            }
            const tab = firstInvalidField.closest("wc-tab-item");
            if (tab) {
              const tabId = tab.getAttribute("tab-id");
              const tabHeader = document.querySelector(`[tab-id="${tabId}"]`);
              if (tabHeader && !tabHeader.classList.contains("active")) {
                tabHeader.click();
                setTimeout(() => {
                  firstInvalidField.focus();
                  form.reportValidity();
                }, 100);
                return false;
              }
            }
          }
          try {
            firstInvalidField.focus();
            form.reportValidity();
          } catch (e) {
            alert("Please fill out all required fields before saving.");
          }
        } else {
          form.reportValidity();
        }
        return false;
      }
      return true;
    }
    _handleClick(event) {
      if (!this._validateForm()) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      htmx.trigger(this.componentElement, "validated");
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
      this.componentElement.addEventListener("click", this._handleClick.bind(this));
    }
    _unWireEvents() {
      super._unWireEvents();
      this.componentElement.removeEventListener("click", this._handleClick.bind(this));
    }
  }
  customElements.define("wc-save-button", WcSaveButton);
}

// src/js/components/wc-save-split-button.js
if (!customElements.get("wc-save-split-button")) {
  class WcSaveSplitButton extends WcBaseComponent {
    static get observedAttributes() {
      return ["form", "hx-include"];
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
    }
    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
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
      const hxInclude = this.getAttribute("hx-include") || "";
      const hxIncludeAttr = hxInclude ? `hx-include="${hxInclude}"` : "";
      const markup = `
        <button type="button" class="save-btn btn"
          hx-${method}="${saveUrl}" hx-trigger="validated" ${beforeSend ? beforeSend : ""} ${hxIncludeAttr}
          data-url="${saveUrl}">Save</button>
        <div class="dropdown">
          <div class="dropdown-content text-sm">
            <a class="save-new-btn btn w-full"
              hx-${method}="${saveUrl}" hx-trigger="validated" ${beforeSend ? beforeSend : ""} ${hxIncludeAttr}
              data-url="${saveNewUrl}">
              Save and Add New
            </a>
            <a class="save-return-btn btn w-full"
              hx-${method}="${saveUrl}" hx-trigger="validated" ${beforeSend ? beforeSend : ""} ${hxIncludeAttr}
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
      if (attrName === "hx-include") {
        const buttons = this.querySelectorAll(".save-btn, .save-new-btn, .save-return-btn");
        buttons.forEach((btn) => {
          if (newValue) {
            btn.setAttribute("hx-include", newValue);
          } else {
            btn.removeAttribute("hx-include");
          }
        });
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }
    _validateForm() {
      const formSelector = this.getAttribute("form") || this.getAttribute("hx-include");
      if (!formSelector) {
        return true;
      }
      const form = document.querySelector(formSelector);
      if (!form || form.tagName !== "FORM") {
        return true;
      }
      const isValid = form.checkValidity();
      if (!isValid) {
        const firstInvalidField = form.querySelector(":invalid");
        if (firstInvalidField) {
          const isHidden = firstInvalidField.offsetParent === null;
          if (isHidden) {
            const accordion = firstInvalidField.closest("wc-accordion");
            if (accordion) {
              const accordionItem = firstInvalidField.closest(".accordion-item");
              if (accordionItem) {
                const header = accordionItem.querySelector(".accordion-header");
                if (header && !header.classList.contains("selected")) {
                  header.click();
                  setTimeout(() => {
                    firstInvalidField.focus();
                    form.reportValidity();
                  }, 100);
                  return false;
                }
              }
            }
            const tab = firstInvalidField.closest("wc-tab-item");
            if (tab) {
              const tabId = tab.getAttribute("tab-id");
              const tabHeader = document.querySelector(`[tab-id="${tabId}"]`);
              if (tabHeader && !tabHeader.classList.contains("active")) {
                tabHeader.click();
                setTimeout(() => {
                  firstInvalidField.focus();
                  form.reportValidity();
                }, 100);
                return false;
              }
            }
          }
          try {
            firstInvalidField.focus();
            form.reportValidity();
          } catch (e) {
            alert("Please fill out all required fields before saving.");
          }
        } else {
          form.reportValidity();
        }
        return false;
      }
      return true;
    }
    _handleClick(event) {
      const button = event.target.closest("button, a");
      if (!button) return;
      if (!this._validateForm()) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
      const method = this.getAttribute("method") || "post";
      const isSaveBtn = button.classList.contains("save-btn");
      let url = button.dataset.url;
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
      htmx.trigger(button, "validated");
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
    }
    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
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
        --background-color: var(--primary-bg-color);
        display: contents;
      }
      wc-sidebar .wc-sidebar {
        /* height: 100%; */
        position: fixed;
        z-index: 1;
        top: 0;
        background-color: var(--background-color);
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
if (!customElements.get("wc-sidenav")) {
  class WcSidenav extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class", "label", "width", "open-btn-class", "open", "open-top", "open-vertical-text", "push", "push-target", "overlay", "background-color", "auto-height", "relative"];
    }
    constructor() {
      super();
      this._boundCloseNav = this._closeNav.bind(this);
      this._boundToggleNav = this._toggleNav.bind(this);
      this._boundHandleOpen = this._handleOpen.bind(this);
      this._boundHandleClose = this._handleClose.bind(this);
      this._boundHandleToggle = this._handleToggle.bind(this);
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
        this.appendChild(this.componentElement);
        if (isOpen) {
          this._openNav({ target: null });
        }
      }
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._wireEvents();
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
      } else if (attrName === "open-btn-class") {
      } else if (attrName === "open-top") {
      } else if (attrName === "open") {
      } else if (attrName === "overlay") {
      } else if (attrName === "push-target") {
      } else if (attrName === "push") {
      } else if (attrName === "width") {
      } else if (attrName === "relative") {
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }
    _render() {
      super._render();
      const innerEl = this.querySelector(".wc-sidenav > *");
      if (innerEl) {
        const closeBtn = this.querySelector(".closebtn");
        closeBtn.addEventListener("click", this._boundCloseNav);
        const openBtn = this.querySelector(".openbtn");
        openBtn.addEventListener("click", this._boundToggleNav);
      } else {
        this.componentElement.innerHTML = "";
        this._createInnerElement();
      }
      if (typeof htmx !== "undefined") {
        htmx.process(this);
      }
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
      const closeBtn = document.createElement("div");
      const closeBtnCss = this.getAttribute("close-btn-css") || "primary-bg-color text-sm w-5 h-5 rounded-full";
      closeBtn.setAttribute("class", `closebtn cursor-pointer ${closeBtnCss}`);
      closeBtn.innerHTML = "&times;";
      closeBtn.addEventListener("click", this._boundCloseNav);
      this.componentElement.appendChild(closeBtn);
      const openBtn = document.createElement("div");
      const openBtnCss = this.getAttribute("open-btn-css") || "primary-bg-color text-xs px-2 py-3";
      openBtn.setAttribute("class", `openbtn cursor-pointer ${openBtnCss}`);
      openBtn.style.top = this.getAttribute("open-top") || "0";
      openBtn.addEventListener("click", this._boundToggleNav);
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
    _toggleNav(event) {
      const side = this.querySelector(".wc-sidenav");
      if (side && side.classList.contains("open")) {
        this._closeNav(event);
      } else {
        this._openNav(event);
      }
    }
    _openNav(event) {
      const width = this.getAttribute("width") || "250px";
      const pushSelector = this.getAttribute("push-target") || "#viewport";
      const side = this.querySelector(".wc-sidenav");
      const openBtn = this.querySelector(".openbtn");
      const isRight = this.hasAttribute("right-side");
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
      } else {
        if (openBtn) {
          if (isRight) {
            openBtn.style.transform = `translateX(-${width})`;
          } else {
            openBtn.style.transform = `translateX(${width})`;
          }
        }
      }
    }
    _closeNav(event) {
      const pushSelector = this.getAttribute("push-target") || "#viewport";
      const side = this.querySelector(".wc-sidenav");
      const openBtn = this.querySelector(".openbtn");
      const isRight = this.hasAttribute("right-side");
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
      } else {
        if (openBtn) {
          openBtn.style.transform = "translateX(0)";
        }
      }
    }
    _applyStyle() {
      const style = `
        wc-sidenav {
          --background-color: var(--primary-bg-color);
          display: contents;
        }
        /* Default mode: Fixed positioning (global/full screen) */
        wc-sidenav:not([relative]) .wc-sidenav.sidenav {
          /* height: 100%; */
          width: 0;
          position: fixed;
          z-index: 2;
          top: 0;
          background-color: var(--background-color);
          overflow-x: hidden;
          text-align: center;
          transition: 0.5s;
        }
        /* Relative mode: Absolute positioning (scoped to parent container) */
        wc-sidenav[relative] .wc-sidenav.sidenav {
          width: 0;
          position: absolute;
          z-index: 2;
          top: 0;
          bottom: 0;
          height: 100%;
          background-color: var(--background-color);
          overflow-x: hidden;
          text-align: center;
          transition: 0.5s;
        }
        wc-sidenav[left-side] .wc-sidenav.sidenav {
          left: 0;
        }
        wc-sidenav[right-side] .wc-sidenav.sidenav {
          right: 0;
        }
        /*
        wc-sidenav .wc-sidenav.sidenav a {
          text-decoration: none;
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
        */
        wc-sidenav .wc-sidenav.sidenav a:hover {
          color: var(--button-hover-color);
        }
        wc-sidenav .wc-sidenav.sidenav .closebtn {
          position: absolute;
          top: 5px;
          z-index: 3;
        }
        wc-sidenav[left-side] .wc-sidenav.sidenav .closebtn {
          right: 5px;
        }
        wc-sidenav[right-side] .wc-sidenav.sidenav .closebtn {
          left: 5px;
        }
        wc-sidenav .openbtn {
          position: absolute;
          z-index: 2;
          transition: transform 0.5s ease;
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
          /* line-height: 2; */
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

        /* Default mode: Fixed overlay (covers entire viewport) */
        wc-sidenav:not([relative]) .overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          background-color: transparent;
          transition: background-color 0.5s ease;
        }
        wc-sidenav:not([relative]) .overlay.open {
          background-color: rgba(0,0,0,0.6);
          z-index: 1;
        }

        /* Relative mode: Absolute overlay (scoped to parent container) */
        wc-sidenav[relative] .overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: transparent;
          transition: background-color 0.5s ease;
        }
        wc-sidenav[relative] .overlay.open {
          background-color: rgba(0,0,0,0.6);
          z-index: 1;
        }
      `;
      this.loadStyle("wc-sidenav-style", style);
    }
    _wireEvents() {
      super._wireEvents();
      document.body.addEventListener("wc-sidenav:open", this._boundHandleOpen);
      document.body.addEventListener("wc-sidenav:close", this._boundHandleClose);
      document.body.addEventListener("wc-sidenav:toggle", this._boundHandleToggle);
    }
    _unWireEvents() {
      super._unWireEvents();
      const closeBtn = this.querySelector(".closebtn");
      if (closeBtn) {
        closeBtn.removeEventListener("click", this._boundCloseNav);
      }
      const openBtn = this.querySelector(".openbtn");
      if (openBtn) {
        openBtn.removeEventListener("click", this._boundToggleNav);
      }
      document.body.removeEventListener("wc-sidenav:open", this._boundHandleOpen);
      document.body.removeEventListener("wc-sidenav:close", this._boundHandleClose);
      document.body.removeEventListener("wc-sidenav:toggle", this._boundHandleToggle);
    }
  }
  customElements.define("wc-sidenav", WcSidenav);
}

// src/js/components/wc-slideshow-image.js
if (!customElements.get("wc-slideshow-image")) {
  class WcSlideshowImage extends WcBaseComponent {
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
  }
  customElements.define("wc-slideshow-image", WcSlideshowImage);
}

// src/js/components/wc-slideshow.js
if (!customElements.get("wc-slideshow")) {
  class WcSlideshow extends WcBaseComponent {
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
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._wireEvents();
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
      } else {
        this.componentElement.innerHTML = "";
        this._createInnerElement();
      }
    }
    _createInnerElement() {
      const els = this.querySelectorAll("wc-slideshow > *:not(.wc-slideshow)");
      els.forEach((el) => {
        this.componentElement.appendChild(el);
      });
      const prev = document.createElement("a");
      prev.classList.add("prev");
      prev.textContent = "\u276E";
      const next = document.createElement("a");
      next.textContent = "\u276F";
      next.classList.add("next");
      const play = document.createElement("a");
      play.classList.add("play");
      play.textContent = "\u25B6";
      const pause = document.createElement("a");
      pause.classList.add("pause");
      pause.textContent = "\u23F8";
      this.componentElement.appendChild(prev);
      this.componentElement.appendChild(next);
      this.componentElement.appendChild(play);
      this.componentElement.appendChild(pause);
    }
    _handleHelper(event, mode = "next") {
      const { detail } = event;
      const { selector = this } = detail;
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
              this.componentElement.classList.add("is-playing");
              this._startSlideshow();
            } else if (mode === "stop") {
              this.removeAttribute("autoplay");
              this.isPaused = true;
              this.componentElement.classList.remove("is-playing");
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
            this.componentElement.classList.add("is-playing");
            this._startSlideshow();
          } else if (mode === "stop") {
            this.removeAttribute("autoplay");
            this.isPaused = true;
            this.componentElement.classList.remove("is-playing");
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
        this.componentElement.classList.remove("is-playing");
        clearInterval(this.slideshowInterval);
      }
      this.slideIndex -= 1;
      this._showSlide();
    }
    _nextSlide(event) {
      if (event?.target) {
        this.isPaused = true;
        this.componentElement.classList.remove("is-playing");
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
        this.componentElement.classList.add("is-playing");
      }
      this._showSlide();
    }
    _handleVisibilityChange() {
      if (document.hidden) {
        this.isPaused = true;
        this.componentElement.classList.remove("is-playing");
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
        .wc-slideshow .play,
        .wc-slideshow .pause {
          cursor: pointer;
          position: absolute;
          top: calc(50% - 36px);
          left: calc(50% - 30px);
          width: auto;
          padding: 16px;
          color: white;
          font-weight: bold;
          font-size: 36px;
          transition: 0.6s ease;
          border-radius: 0 3px 3px 0;
          user-select: none;

          display: none;
        }
        .wc-slideshow.is-playing:hover .pause {
          display: block;
        }
        .wc-slideshow:not(.is-playing):hover .play {
          display: block;
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
          right: 16px;
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
      const isWired = this.hasAttribute("data-wired");
      if (isWired) return;
      this.setAttribute("data-wired", true);
      setTimeout(() => {
        const prev = this.querySelector(".prev");
        const next = this.querySelector(".next");
        const play = this.querySelector(".play");
        const pause = this.querySelector(".pause");
        prev.addEventListener("click", this._prevSlide.bind(this));
        next.addEventListener("click", this._nextSlide.bind(this));
        play.addEventListener("click", this._handleStart.bind(this));
        pause.addEventListener("click", this._handleStop.bind(this));
        this._startSlideshow();
      }, 50);
      document.addEventListener("visibilitychange", this._handleVisibilityChange.bind(this));
      document.body.addEventListener("wc-slideshow:next", this._handleNext.bind(this));
      document.body.addEventListener("wc-slideshow:prev", this._handlePrev.bind(this));
      document.body.addEventListener("wc-slideshow:start", this._handleStart.bind(this));
      document.body.addEventListener("wc-slideshow:stop", this._handleStop.bind(this));
    }
    _unWireEvents() {
      super._unWireEvents();
      document.removeEventListener("visibilitychange", this._handleVisibilityChange.bind(this));
      document.body.removeEventListener("wc-slideshow:next", this._handleNext.bind(this));
      document.body.removeEventListener("wc-slideshow:prev", this._handlePrev.bind(this));
      document.body.removeEventListener("wc-slideshow:start", this._handleStart.bind(this));
      document.body.removeEventListener("wc-slideshow:stop", this._handleStop.bind(this));
      const prev = this.querySelector(".prev");
      const next = this.querySelector(".next");
      const play = this.querySelector(".play");
      const pause = this.querySelector(".pause");
      prev?.removeEventListener("click", this._prevSlide.bind(this));
      next?.removeEventListener("click", this._nextSlide.bind(this));
      play?.removeEventListener("click", this._handleStart.bind(this));
      pause?.removeEventListener("click", this._handleStop.bind(this));
    }
  }
  customElements.define("wc-slideshow", WcSlideshow);
}

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
    return ["id", "class", "animate", "vertical", "contrast"];
  }
  constructor() {
    super();
    this.childComponentSelector = "wc-tab-item";
    this.nestingLevel = 0;
    let parent = this.parentElement;
    while (parent) {
      const parentTab = parent.closest("wc-tab");
      if (parentTab) {
        this.nestingLevel++;
        parent = parentTab.parentElement;
      } else {
        break;
      }
    }
    const compEl = this.querySelector(".wc-tab");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-tab");
      this.appendChild(this.componentElement);
    }
    this._updateContrast(this.getAttribute("contrast"));
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
  _handleAttributeChange(attrName, newValue) {
    if (attrName === "animate") {
    } else if (attrName === "vertical") {
    } else if (attrName === "contrast") {
      this._updateContrast(newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
  _updateContrast(contrastValue) {
    this.removeAttribute("data-contrast");
    this.removeAttribute("data-nesting-level");
    if (contrastValue && contrastValue !== "auto") {
      this.setAttribute("data-contrast", contrastValue);
    } else {
      if (this.nestingLevel > 0) {
        this.setAttribute("data-nesting-level", this.nestingLevel);
      }
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
    this._restoreTabsWhenReady();
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
  async _restoreTabsWhenReady() {
    try {
      const allElements = Array.from(this.querySelectorAll("*"));
      const allComponents = allElements.filter((el) => el.tagName.toLowerCase().startsWith("wc-"));
      await Promise.all(
        allComponents.map((component) => {
          return new Promise((resolve) => {
            if (component._isConnected || component.isConnected) {
              resolve();
            } else {
              const checkConnected = setInterval(() => {
                if (component._isConnected || component.isConnected) {
                  clearInterval(checkConnected);
                  resolve();
                }
              }, 50);
              setTimeout(() => {
                clearInterval(checkConnected);
                resolve();
              }, 500);
            }
          });
        })
      );
      setTimeout(() => {
        this._restoreTabsFromHash();
      }, 250);
    } catch (error) {
      console.warn("Error waiting for components:", error);
      this._restoreTabsFromHash();
    }
  }
  _restoreTabsFromHash() {
    const hashParts = location.hash.slice(1).split("+");
    hashParts.forEach((part) => {
      const btn = this.querySelector(`button[data-label="${decodeURI(part)}"]`);
      btn?.click();
    });
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

      /* Nested tab color variations - automatically adjust colors based on nesting level */
      /* Darken background for contrast without borders */
      wc-tab[data-nesting-level="1"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }
      wc-tab[data-nesting-level="1"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }
      wc-tab[data-nesting-level="1"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-nesting-level="1"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }

      wc-tab[data-nesting-level="2"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }
      wc-tab[data-nesting-level="2"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }
      wc-tab[data-nesting-level="2"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-nesting-level="2"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }

      /* Manual contrast control - overrides auto-nesting detection */
      /* none - no contrast adjustment, use base colors */
      wc-tab[data-contrast="none"] .wc-tab .tab-body {
        background-color: var(--card-bg-color);
      }
      wc-tab[data-contrast="none"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: var(--card-bg-color);
      }
      wc-tab[data-contrast="none"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="none"] .wc-tab .tab-nav .tab-link:hover {
        background-color: var(--card-bg-color);
        border-bottom-color: var(--card-bg-color);
      }

      /* light-10 - lighten by 10% */
      wc-tab[data-contrast="light-10"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 90%, #fff 10%);
      }
      wc-tab[data-contrast="light-10"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 90%, #fff 10%);
      }
      wc-tab[data-contrast="light-10"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="light-10"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 90%, #fff 10%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 90%, #fff 10%);
      }

      /* light-15 - lighten by 15% */
      wc-tab[data-contrast="light-15"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #fff 15%);
      }
      wc-tab[data-contrast="light-15"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #fff 15%);
      }
      wc-tab[data-contrast="light-15"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="light-15"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #fff 15%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #fff 15%);
      }

      /* light-20 - lighten by 20% */
      wc-tab[data-contrast="light-20"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 80%, #fff 20%);
      }
      wc-tab[data-contrast="light-20"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 80%, #fff 20%);
      }
      wc-tab[data-contrast="light-20"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="light-20"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 80%, #fff 20%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 80%, #fff 20%);
      }

      /* light-25 - lighten by 25% */
      wc-tab[data-contrast="light-25"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 75%, #fff 25%);
      }
      wc-tab[data-contrast="light-25"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 75%, #fff 25%);
      }
      wc-tab[data-contrast="light-25"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="light-25"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 75%, #fff 25%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 75%, #fff 25%);
      }

      /* light-30 - lighten by 30% */
      wc-tab[data-contrast="light-30"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #fff 30%);
      }
      wc-tab[data-contrast="light-30"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #fff 30%);
      }
      wc-tab[data-contrast="light-30"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="light-30"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #fff 30%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #fff 30%);
      }

      /* light-35 - lighten by 35% */
      wc-tab[data-contrast="light-35"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 65%, #fff 35%);
      }
      wc-tab[data-contrast="light-35"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 65%, #fff 35%);
      }
      wc-tab[data-contrast="light-35"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="light-35"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 65%, #fff 35%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 65%, #fff 35%);
      }

      /* light-40 - lighten by 40% */
      wc-tab[data-contrast="light-40"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 60%, #fff 40%);
      }
      wc-tab[data-contrast="light-40"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 60%, #fff 40%);
      }
      wc-tab[data-contrast="light-40"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="light-40"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 60%, #fff 40%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 60%, #fff 40%);
      }

      /* dark-10 - darken by 10% */
      wc-tab[data-contrast="dark-10"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 90%, #000 10%);
      }
      wc-tab[data-contrast="dark-10"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 90%, #000 10%);
      }
      wc-tab[data-contrast="dark-10"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="dark-10"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 90%, #000 10%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 90%, #000 10%);
      }

      /* dark-15 - darken by 15% (matches nesting level 1) */
      wc-tab[data-contrast="dark-15"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }
      wc-tab[data-contrast="dark-15"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }
      wc-tab[data-contrast="dark-15"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="dark-15"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }

      /* dark-20 - darken by 20% */
      wc-tab[data-contrast="dark-20"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 80%, #000 20%);
      }
      wc-tab[data-contrast="dark-20"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 80%, #000 20%);
      }
      wc-tab[data-contrast="dark-20"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="dark-20"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 80%, #000 20%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 80%, #000 20%);
      }

      /* dark-25 - darken by 25% */
      wc-tab[data-contrast="dark-25"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 75%, #000 25%);
      }
      wc-tab[data-contrast="dark-25"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 75%, #000 25%);
      }
      wc-tab[data-contrast="dark-25"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="dark-25"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 75%, #000 25%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 75%, #000 25%);
      }

      /* dark-30 - darken by 30% (matches nesting level 2) */
      wc-tab[data-contrast="dark-30"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }
      wc-tab[data-contrast="dark-30"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }
      wc-tab[data-contrast="dark-30"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="dark-30"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }

      /* dark-35 - darken by 35% */
      wc-tab[data-contrast="dark-35"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 65%, #000 35%);
      }
      wc-tab[data-contrast="dark-35"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 65%, #000 35%);
      }
      wc-tab[data-contrast="dark-35"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="dark-35"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 65%, #000 35%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 65%, #000 35%);
      }

      /* dark-40 - darken by 40% */
      wc-tab[data-contrast="dark-40"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 60%, #000 40%);
      }
      wc-tab[data-contrast="dark-40"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 60%, #000 40%);
      }
      wc-tab[data-contrast="dark-40"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="dark-40"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 60%, #000 40%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 60%, #000 40%);
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
      return ["id", "class", "data"];
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
                const dependentSelects = cnt.querySelectorAll("wc-select[data-url-template]");
                dependentSelects.forEach((wcSelect) => {
                  const urlTemplate = wcSelect.getAttribute("data-url-template");
                  const dependsOn = wcSelect.getAttribute("data-url-depends");
                  if (urlTemplate && dependsOn) {
                    const sourceSelect = cnt.querySelector(`select[name="${dependsOn}"]`) || cnt.querySelector(`input[name="${dependsOn}"]`);
                    if (sourceSelect) {
                      const updateUrl = () => {
                        const value = sourceSelect.value;
                        const newUrl = urlTemplate.replace(/\{value\}/g, value);
                        wcSelect.setAttribute("url", newUrl);
                      };
                      updateUrl();
                      sourceSelect.addEventListener("change", updateUrl);
                    }
                  }
                });
                _hyperscript.processNode(cnt);
              }
            },
            preConfirm: () => {
              if (this.funcs["onClonePreConfirm"]) {
                const payload = this.funcs["onClonePreConfirm"](row);
                return payload;
              } else {
                const srcConnName = document.querySelector('[name="srcConnName"]')?.value;
                const srcDbName = document.querySelector('[name="srcDbName"]')?.value;
                const srcCollName = document.querySelector('[name="srcCollName"]')?.value;
                const tgtConnName = document.querySelector('[name="tgtConnName"]')?.value;
                let tgtDbNames = [];
                const tgtDbNamesSelect = document.querySelector('select[name="tgtDbNames"]');
                const wcSelectTgtDb = tgtDbNamesSelect?.closest("wc-select");
                if (wcSelectTgtDb) {
                  const chips = wcSelectTgtDb.querySelectorAll(".chip");
                  if (chips.length > 0) {
                    tgtDbNames = Array.from(chips).map((chip) => chip.getAttribute("data-value"));
                  }
                  if (tgtDbNames.length === 0) {
                    const selectElement = wcSelectTgtDb.querySelector("select");
                    if (selectElement && selectElement.options.length > 0) {
                      tgtDbNames = Array.from(selectElement.options).filter((opt) => opt.selected).map((opt) => opt.value);
                    }
                  }
                  if (tgtDbNames.length === 0 && wcSelectTgtDb.selectedOptions) {
                    tgtDbNames = wcSelectTgtDb.selectedOptions;
                  }
                } else if (tgtDbNamesSelect && tgtDbNamesSelect.selectedOptions) {
                  tgtDbNames = Array.from(tgtDbNamesSelect.selectedOptions).map((opt) => opt.value);
                }
                const tgtCollName = document.querySelector('[name="tgtCollName"]')?.value;
                const payload = {
                  srcConnName,
                  srcDbName,
                  srcCollName,
                  tgtConnName,
                  tgtDbNames: [...new Set(tgtDbNames)],
                  // Remove duplicates
                  tgtCollName
                };
                return payload;
              }
            },
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
      this.editorOptionsCache = {};
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
      this.getFuncs();
      this.getRowMenu();
    }
    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._setupFormSync();
    }
    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
      if (this._syncHandler) {
        if (this._syncForm) {
          this._syncForm.removeEventListener("htmx:configRequest", this._syncHandler);
        }
        document.body.removeEventListener("htmx:configRequest", this._syncHandler);
      }
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
      const height = this.getAttribute("height");
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
      const dataAttr = this.getAttribute("data");
      let inlineData = null;
      if (dataAttr) {
        try {
          inlineData = JSON.parse(dataAttr);
        } catch (e) {
          console.error("Error parsing data attribute:", e);
        }
      }
      const options = {
        columns: this.getColumnsConfig(),
        layout: this.getAttribute("layout") || "fitData",
        filterMode: inlineData ? "local" : "remote",
        // Local filtering if using inline data
        sortMode: inlineData ? "local" : "remote",
        // Local sorting if using inline data
        ajaxURL: this.getAttribute("ajax-url") || "",
        // URL for server-side loading
        ajaxURLGenerator: this.getAjaxURLGenerator.bind(this),
        ajaxConfig: this.getAjaxConfig(),
        ajaxResponse: this.handleAjaxResponse.bind(this)
        // Optional custom handling of server response
      };
      if (inlineData) {
        options.data = inlineData;
      }
      if (pagination) options.pagination = pagination;
      if (options.pagination) {
        options.paginationMode = inlineData ? "local" : "remote";
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
      if (height) options.height = height;
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
      });
    }
    getFuncs() {
      const funcElements = this.querySelectorAll("wc-tabulator-func");
      funcElements.forEach((el) => {
        const name = el.getAttribute("name");
        const func = el.textContent.trim();
        if (!func) {
          return;
        }
        try {
          const value = new Function(`return (${func})`)();
          this.funcs[name] = value;
        } catch (e) {
          console.error(`Error parsing wc-tabulator-func "${name}":`, e);
          console.error("Function content:", func);
          console.error("Attempted to create:", `return (${func})`);
        }
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
          const func = el.textContent.trim();
          if (!func) {
            return;
          }
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
          } else if (editor == "selectEditor") {
            column.editor = this.selectEditor.bind(this);
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
    pageFormatter(cell, formatterParams, onRendered) {
      const page_id = cell.getColumn().getDefinition().formatterParams.page_id;
      const data = cell.getData();
      const id = data._id;
      const url = `/view/${page_id}?record_id=${id}`;
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
      if (formatterParams.queryParams && typeof formatterParams.queryParams === "object") {
        const queryParts = [];
        Object.entries(formatterParams.queryParams).forEach(([key, paramValue]) => {
          let resolvedValue;
          if (typeof paramValue === "string" && paramValue.startsWith("$")) {
            const fieldPath = paramValue.substring(1);
            resolvedValue = fieldPath.split(".").reduce((obj, prop) => {
              return obj && obj[prop] !== void 0 ? obj[prop] : void 0;
            }, data);
          } else {
            resolvedValue = paramValue;
          }
          if (resolvedValue !== null && resolvedValue !== void 0) {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(resolvedValue)}`);
          }
        });
        if (queryParts.length > 0) {
          const separator = url.includes("?") ? "&" : "?";
          url += separator + queryParts.join("&");
        }
      }
      linkElement.setAttribute("href", url);
      if (formatterParams.target) {
        linkElement.setAttribute("target", formatterParams.target);
      }
      let displayText = formatterParams.labelField ? cell.getData()[formatterParams.labelField] : value;
      if (formatterParams.filter && displayText) {
        switch (formatterParams.filter) {
          case "upper":
          case "uppercase":
            displayText = String(displayText).toUpperCase();
            break;
          case "lower":
          case "lowercase":
            displayText = String(displayText).toLowerCase();
            break;
          case "title":
          case "titlecase":
            displayText = String(displayText).toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
            break;
          case "capitalize":
            displayText = String(displayText).charAt(0).toUpperCase() + String(displayText).slice(1).toLowerCase();
            break;
        }
      }
      linkElement.innerText = displayText;
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
    phone(cell, formatterParams, onRendered) {
      const value = cell.getValue();
      if (!value) return "";
      const cleaned = ("" + value).replace(/\D/g, "");
      if (cleaned.length === 10) {
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return "(" + match[1] + ") " + match[2] + "-" + match[3];
        }
      } else if (cleaned.length === 11 && cleaned[0] === "1") {
        const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
        if (match) {
          return "+1 (" + match[1] + ") " + match[2] + "-" + match[3];
        }
      }
      return value;
    }
    linkphone(cell, formatterParams, onRendered) {
      const value = cell.getValue();
      if (!value) return "";
      const formattedPhone = this.phone(cell, formatterParams, onRendered);
      const cleaned = ("" + value).replace(/\D/g, "");
      return `<a href="tel:+1${cleaned}">${formattedPhone}</a>`;
    }
    linkPhoneFormatter(cell, formatterParams, onRendered) {
      const formattedPhone = this.phone(cell, formatterParams, onRendered);
      if (!formattedPhone) return "";
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
      if (formatterParams.queryParams && typeof formatterParams.queryParams === "object") {
        const queryParts = [];
        Object.entries(formatterParams.queryParams).forEach(([key, paramValue]) => {
          let resolvedValue;
          if (typeof paramValue === "string" && paramValue.startsWith("$")) {
            const fieldPath = paramValue.substring(1);
            resolvedValue = fieldPath.split(".").reduce((obj, prop) => {
              return obj && obj[prop] !== void 0 ? obj[prop] : void 0;
            }, data);
          } else {
            resolvedValue = paramValue;
          }
          if (resolvedValue !== null && resolvedValue !== void 0) {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(resolvedValue)}`);
          }
        });
        if (queryParts.length > 0) {
          const separator = url.includes("?") ? "&" : "?";
          url += separator + queryParts.join("&");
        }
      }
      var linkElement = document.createElement("a");
      linkElement.setAttribute("href", url);
      if (formatterParams.target) {
        linkElement.setAttribute("target", formatterParams.target);
      }
      linkElement.innerText = formattedPhone;
      if (formatterParams.attributes && typeof formatterParams.attributes === "object") {
        Object.entries(formatterParams.attributes).forEach(([key, value]) => {
          linkElement.setAttribute(key, value);
        });
      }
      return linkElement;
    }
    linkDateTimeFormatter(cell, formatterParams, onRendered) {
      const value = cell.getValue();
      if (!value) return "";
      const date = new Date(value);
      let formattedDate;
      const dateFormat = formatterParams.dateFormat || "shortWithTime";
      switch (dateFormat) {
        case "short":
          formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit"
          });
          break;
        case "shortWithTime":
          formattedDate = date.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          });
          break;
        case "full":
          formattedDate = date.toLocaleString("en-US");
          break;
        case "long":
          formattedDate = date.toLocaleString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          });
          break;
        case "iso":
          formattedDate = date.toISOString().slice(0, 19).replace("T", " ");
          break;
        case "relative":
          const now = /* @__PURE__ */ new Date();
          const diffMs = now - date;
          const diffMins = Math.floor(diffMs / 6e4);
          const diffHours = Math.floor(diffMs / 36e5);
          const diffDays = Math.floor(diffMs / 864e5);
          if (diffMins < 1) {
            formattedDate = "Just now";
          } else if (diffMins < 60) {
            formattedDate = `${diffMins} min${diffMins !== 1 ? "s" : ""} ago`;
          } else if (diffHours < 24) {
            formattedDate = `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
          } else if (diffDays < 7) {
            formattedDate = `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
          } else {
            formattedDate = date.toLocaleDateString("en-US");
          }
          break;
        default:
          formattedDate = date.toLocaleString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "numeric",
            minute: "2-digit",
            hour12: true
          });
      }
      const routePrefix = formatterParams.routePrefix || "screen";
      const screen = formatterParams.screen;
      const screen_id = formatterParams.screen_id;
      const id_name = formatterParams.id_name;
      const data = cell.getData();
      const id = data._id;
      let url = "";
      if (screen) {
        url = `/${routePrefix}/${screen}/${id}`;
      } else {
        url = `/${routePrefix}/${screen_id}?${id_name}=${id}`;
      }
      if (formatterParams.queryParams && typeof formatterParams.queryParams === "object") {
        const queryParts = [];
        Object.entries(formatterParams.queryParams).forEach(([key, paramValue]) => {
          let resolvedValue;
          if (typeof paramValue === "string" && paramValue.startsWith("$")) {
            const fieldPath = paramValue.substring(1);
            resolvedValue = fieldPath.split(".").reduce((obj, prop) => {
              return obj && obj[prop] !== void 0 ? obj[prop] : void 0;
            }, data);
          } else {
            resolvedValue = paramValue;
          }
          if (resolvedValue !== null && resolvedValue !== void 0) {
            queryParts.push(`${encodeURIComponent(key)}=${encodeURIComponent(resolvedValue)}`);
          }
        });
        if (queryParts.length > 0) {
          const separator = url.includes("?") ? "&" : "?";
          url += separator + queryParts.join("&");
        }
      }
      var linkElement = document.createElement("a");
      linkElement.setAttribute("href", url);
      if (formatterParams.target) {
        linkElement.setAttribute("target", formatterParams.target);
      }
      linkElement.innerText = formattedDate;
      if (formatterParams.attributes && typeof formatterParams.attributes === "object") {
        Object.entries(formatterParams.attributes).forEach(([key, value2]) => {
          linkElement.setAttribute(key, value2);
        });
      }
      return linkElement;
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
    selectEditor(cell, onRendered, success, cancel, editorParams) {
      const cellValue = cell.getValue();
      const field = cell.getColumn().getField();
      const self = this;
      const select = document.createElement("select");
      select.style.width = "100%";
      select.style.padding = "4px";
      select.style.boxSizing = "border-box";
      const valueField = editorParams?.valueField || "value";
      const textField = editorParams?.textField || "text";
      const populateOptions = (options) => {
        select.innerHTML = "";
        let sortedOptions = options;
        if (editorParams?.sort && Array.isArray(options)) {
          sortedOptions = [...options].sort((a, b) => {
            const aVal = a[textField];
            const bVal = b[textField];
            if (editorParams.sort === "asc") {
              return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            } else if (editorParams.sort === "desc") {
              return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
            }
            return 0;
          });
        }
        if (editorParams?.allowEmpty) {
          const emptyOption = document.createElement("option");
          emptyOption.value = "";
          emptyOption.textContent = editorParams.emptyText || "(None)";
          select.appendChild(emptyOption);
        }
        if (editorParams?.placeholder) {
          const placeholderOption = document.createElement("option");
          placeholderOption.value = "";
          placeholderOption.textContent = editorParams.placeholder;
          placeholderOption.disabled = true;
          select.appendChild(placeholderOption);
        }
        if (Array.isArray(sortedOptions)) {
          sortedOptions.forEach((option) => {
            const optionElement = document.createElement("option");
            optionElement.value = option[valueField];
            optionElement.textContent = option[textField];
            if (option[valueField] == cellValue) {
              optionElement.selected = true;
            }
            select.appendChild(optionElement);
          });
        }
        if (cellValue !== null && cellValue !== void 0) {
          select.value = cellValue;
        }
      };
      if (editorParams) {
        if (editorParams.url) {
          const cacheKey = editorParams.url;
          if (self.editorOptionsCache[cacheKey]) {
            populateOptions(self.editorOptionsCache[cacheKey]);
          } else {
            const loadingOption = document.createElement("option");
            loadingOption.textContent = "Loading...";
            loadingOption.disabled = true;
            loadingOption.selected = true;
            select.appendChild(loadingOption);
            fetch(editorParams.url).then((response) => response.json()).then((data) => {
              let options = data;
              if (data.results && Array.isArray(data.results)) {
                options = data.results;
              } else if (data.data && Array.isArray(data.data)) {
                options = data.data;
              } else if (!Array.isArray(data)) {
                console.warn("Select editor: Expected array or object with results/data property, got:", data);
                options = [];
              }
              self.editorOptionsCache[cacheKey] = options;
              populateOptions(options);
            }).catch((error) => {
              console.error("Error loading select options:", error);
              select.innerHTML = "<option disabled selected>Error loading options</option>";
            });
          }
        } else if (editorParams.options) {
          const cacheKey = `static_${field}`;
          if (!self.editorOptionsCache[cacheKey]) {
            self.editorOptionsCache[cacheKey] = editorParams.options;
          }
          populateOptions(self.editorOptionsCache[cacheKey]);
        }
      }
      onRendered(function() {
        select.focus();
        select.style.height = "100%";
      });
      function onChange() {
        if (select.value != cellValue) {
          success(select.value);
        } else {
          cancel();
        }
      }
      select.addEventListener("change", onChange);
      select.addEventListener("blur", onChange);
      select.addEventListener("keydown", function(e) {
        if (e.key === "Enter") {
          onChange();
        }
        if (e.key === "Escape") {
          cancel();
        }
      });
      return select;
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
    _setupFormSync() {
      const formSyncId = this.getAttribute("form-sync");
      if (!formSyncId) {
        return;
      }
      const formField = this.getAttribute("form-field");
      if (!formField) {
        throw new Error(`wc-tabulator: 'form-field' attribute is required when using 'form-sync'. Please specify the field name for the array (e.g., form-field="users").`);
      }
      const form = document.getElementById(formSyncId);
      if (!form) {
        console.warn(`wc-tabulator: Form with id="${formSyncId}" not found. Form sync will not work.`);
        return;
      }
      this._syncForm = form;
      this._syncFormField = formField;
      const syncHandler = (event) => {
        const targetElement = event.detail?.elt;
        if (targetElement) {
          const hxInclude = targetElement.getAttribute("hx-include");
          const isOurForm = targetElement.closest(`#${formSyncId}`) || hxInclude === `#${formSyncId}` || hxInclude === `form#${formSyncId}`;
          if (isOurForm) {
            this._syncToForm(formField, event);
          }
        }
      };
      form.addEventListener("htmx:configRequest", syncHandler);
      document.body.addEventListener("htmx:configRequest", syncHandler);
      this._syncHandler = syncHandler;
    }
    _syncToForm(formField, event) {
      const excludeFieldsAttr = this.getAttribute("form-exclude-fields") || "";
      const excludeFields = excludeFieldsAttr.split(",").map((f) => f.trim()).filter((f) => f);
      if (!this.table) {
        return;
      }
      const data = this.table.getData();
      const parameters = event.detail.parameters;
      data.forEach((row, index) => {
        const isEmptyRow = Object.values(row).every(
          (value) => value === "" || value === null || value === void 0
        );
        if (isEmptyRow) {
          return;
        }
        Object.keys(row).forEach((field) => {
          if (excludeFields.includes(field)) {
            return;
          }
          const value = row[field];
          const paramName = `${formField}.${index}.${field}`;
          const paramValue = value !== null && value !== void 0 ? value : "";
          parameters[paramName] = paramValue;
        });
      });
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
    }
    async _connectedCallback() {
      this._applyStyle();
      this._wireEvents();
    }
    _disconnectedCallback() {
      this._unWireEvents();
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
            send theme:change to <body/>
          else
            remove .dark from document.documentElement
            add .light to document.documentElement
            send theme:change to <body/>
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
        background-color: var(--primary-bg-color);
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
    if (window.wc && window.wc.EventHub) {
      window.wc.EventHub.broadcast("theme:change", "", { theme });
    }
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

// src/js/components/wc-ai-bot.js
if (!customElements.get("wc-ai-bot")) {
  let webllmModule = null;
  let markedModule = null;
  const loadedModels = /* @__PURE__ */ new Map();
  const modelLoadingPromises = /* @__PURE__ */ new Map();
  class WcAiBot extends WcBaseComponent {
    static get observedAttributes() {
      return [
        "bot-id",
        "model",
        "system-prompt",
        "title",
        "placeholder",
        "theme",
        "position",
        "auto-open",
        "max-height",
        "temperature",
        "max-tokens",
        "debug",
        "check-gpu-compatibility",
        "force-enable"
      ];
    }
    // Known hardware configurations
    static KNOWN_CAPABLE_CONFIGS = [
      // Apple Silicon - excellent WebLLM support
      { gpu: /Apple M[1-4]/, capability: "high", name: "Apple Silicon" },
      // High-end NVIDIA GPUs (RTX 30/40 series)
      { gpu: /RTX [34]0[6-9]0/, capability: "high", name: "NVIDIA RTX High-end" },
      { gpu: /RTX [34]0[7-8]0/, capability: "high", name: "NVIDIA RTX High-end" },
      // Mid-range NVIDIA GPUs
      { gpu: /RTX [34]0[5-6]0/, capability: "medium", name: "NVIDIA RTX Mid-range" },
      { gpu: /RTX 20[7-8]0/, capability: "medium", name: "NVIDIA RTX 20 Series" },
      { gpu: /GTX 16[6-8]0/, capability: "low", name: "NVIDIA GTX 16 Series" },
      // AMD GPUs (limited WebGPU support)
      { gpu: /Radeon RX 6[7-9]00/, capability: "medium", name: "AMD Radeon RX 6000" },
      { gpu: /Radeon RX 7[7-9]00/, capability: "medium", name: "AMD Radeon RX 7000" },
      // Known problematic hardware
      { gpu: /Intel.*HD Graphics/, capability: "none", name: "Intel HD Graphics" },
      { gpu: /Intel.*UHD Graphics/, capability: "none", name: "Intel UHD Graphics" },
      { gpu: /Intel.*Iris/, capability: "low", name: "Intel Iris" },
      { gpu: /Radeon Vega/, capability: "low", name: "AMD Radeon Vega" },
      { gpu: /GeForce MX/, capability: "none", name: "NVIDIA GeForce MX" }
    ];
    constructor() {
      super();
      this._messages = [];
      this._isLoading = false;
      this._isModelReady = false;
      this._isMinimized = true;
      this._error = null;
      this._engine = null;
      this._modelProgress = 0;
      this._isUnsupported = false;
      this._unsupportedReason = "";
      this._handleSend = this._handleSend.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleToggle = this._handleToggle.bind(this);
      this._handleClose = this._handleClose.bind(this);
    }
    static get is() {
      return "wc-ai-bot";
    }
    async _render() {
      this.classList.add("contents");
      const checkGPU = this.getAttribute("check-gpu-compatibility") !== "false";
      if (checkGPU && !await this._checkSystemCapabilities()) {
        this._renderUnsupportedUI();
        return;
      }
      const title = this.getAttribute("title") || "AI Assistant";
      const placeholder = this.getAttribute("placeholder") || "Type your message...";
      this._container = document.createElement("div");
      this._container.className = "wc-ai-bot-container";
      const header = document.createElement("div");
      header.className = "wc-ai-bot-header";
      header.innerHTML = `
        <div class="wc-ai-bot-header-title">
          <wc-fa-icon name="robot" icon-style="solid" size="1.2rem" class="mr-2"></wc-fa-icon>
          <span>${title}</span>
        </div>
        <div class="wc-ai-bot-header-actions">
          <button class="wc-ai-bot-toggle" aria-label="Toggle chat">
            <wc-fa-icon name="minus" icon-style="solid" size="1rem"></wc-fa-icon>
          </button>
          <button class="wc-ai-bot-close" aria-label="Close chat">
            <wc-fa-icon name="xmark" icon-style="solid" size="1rem"></wc-fa-icon>
          </button>
        </div>
      `;
      this._messagesContainer = document.createElement("div");
      this._messagesContainer.className = "wc-ai-bot-messages";
      const inputContainer = document.createElement("div");
      inputContainer.className = "wc-ai-bot-input-container";
      this._input = document.createElement("textarea");
      this._input.className = "wc-ai-bot-input";
      this._input.placeholder = placeholder;
      this._input.rows = 2;
      this._sendButton = document.createElement("button");
      this._sendButton.className = "wc-ai-bot-send";
      this._sendButton.innerHTML = '<wc-fa-icon name="paper-plane" icon-style="solid" size="1rem"></wc-fa-icon>';
      this._sendButton.disabled = true;
      inputContainer.appendChild(this._input);
      inputContainer.appendChild(this._sendButton);
      this._container.appendChild(header);
      this._container.appendChild(this._messagesContainer);
      this._container.appendChild(inputContainer);
      this._statusBar = document.createElement("div");
      this._statusBar.className = "wc-ai-bot-status";
      this._container.appendChild(this._statusBar);
      this.appendChild(this._container);
      if (this.getAttribute("theme") === "bubble" || !this.getAttribute("theme")) {
        this._fab = document.createElement("button");
        this._fab.className = "wc-ai-bot-fab";
        this._fab.setAttribute("aria-label", "Open chat");
        this._fab.innerHTML = '<wc-fa-icon name="message" icon-style="solid" size="1.5rem"></wc-fa-icon>';
        this._fab.addEventListener("click", () => {
          this._isMinimized = false;
          this.classList.add("wc-ai-bot--open");
          this._fab.style.display = "none";
          setTimeout(() => this._input.focus(), 100);
        });
        this.appendChild(this._fab);
      }
      this._applyStyles();
      this._sendButton.addEventListener("click", this._handleSend);
      this._input.addEventListener("keydown", this._handleKeydown);
      this._input.addEventListener("input", () => this._adjustInputHeight());
      const toggleBtn = this._container.querySelector(".wc-ai-bot-toggle");
      if (toggleBtn) toggleBtn.addEventListener("click", this._handleToggle);
      const closeBtn = this._container.querySelector(".wc-ai-bot-close");
      if (closeBtn) closeBtn.addEventListener("click", this._handleClose);
      await this._initializeModel();
      if (!markedModule) {
        try {
          const module = await import("https://cdn.jsdelivr.net/npm/marked@4/lib/marked.esm.js");
          markedModule = module;
          console.log("[wc-ai-bot] Marked module loaded successfully");
        } catch (error) {
          console.error("[wc-ai-bot] Failed to load marked module:", error);
        }
      }
      if (this.getAttribute("auto-open") === "true") {
        this._isMinimized = false;
        this.classList.add("wc-ai-bot--open");
        if (this._fab) {
          this._fab.style.display = "none";
        }
      }
      this._addMessage("bot", this._getWelcomeMessage());
    }
    _applyStyles() {
      const style = `
        wc-ai-bot {
          display: contents;
        }

        /* Base container styles */
        .wc-ai-bot-container {
          display: flex;
          flex-direction: column;
          background: var(--component-bg-color);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        /* Header styles */
        .wc-ai-bot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--primary-bg-color);
          color: var(--primary-color);
        }

        .wc-ai-bot-header-title {
          display: flex;
          align-items: center;
          font-weight: 600;
        }

        .wc-ai-bot-header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .wc-ai-bot-header button {
          background: transparent;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: opacity 0.2s;
        }

        .wc-ai-bot-header button:hover {
          opacity: 0.8;
        }

        /* Messages container */
        .wc-ai-bot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          min-height: 200px;
          max-height: 400px;
          background: var(--component-bg-color);
        }

        /* Message styles */
        .wc-ai-bot-message {
          margin-bottom: 1rem;
          display: flex;
        }

        .wc-ai-bot-message--user {
          justify-content: flex-end;
        }

        .wc-ai-bot-message--bot {
          justify-content: flex-start;
        }

        .wc-ai-bot-message-bubble {
          max-width: 80%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .wc-ai-bot-message--user .wc-ai-bot-message-bubble {
          background: var(--primary-color);
          color: var(--primary-bg-color);
        }

        .wc-ai-bot-message--bot .wc-ai-bot-message-bubble {
          background: var(--primary-bg-color);
          color: var(--primary-color);
        }

        /* Markdown content styling */
        .wc-ai-bot-message-bubble p {
          margin: 0 0 0.5rem 0;
        }
        
        .wc-ai-bot-message-bubble p:last-child {
          margin-bottom: 0;
        }
        
        .wc-ai-bot-message-bubble ul,
        .wc-ai-bot-message-bubble ol {
          margin: 0 0 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .wc-ai-bot-message-bubble li {
          margin-bottom: 0.25rem;
        }
        
        .wc-ai-bot-message-bubble pre {
          background: var(--code-bg-color, rgba(0,0,0,0.1));
          padding: 0.5rem;
          border-radius: 0.25rem;
          overflow-x: auto;
          margin: 0.5rem 0;
        }
        
        .wc-ai-bot-message-bubble code {
          background: var(--code-bg-color, rgba(0,0,0,0.1));
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
          font-size: 0.875em;
        }
        
        .wc-ai-bot-message-bubble pre code {
          background: none;
          padding: 0;
        }

        /* Transparent background for loading bubbles */
        .wc-ai-bot-message-bubble--loading {
          background: transparent !important;
          padding: 0 !important;
          display: flex;
          flex: 1 1 0%;
          justify-content: center;
          align-items: center;
          min-width: 100px;
          min-height: 60px;
        }

        /* Input container */
        .wc-ai-bot-input-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0 1rem 1rem;
          border-top: 1px solid var(--border-color);
          background: var(--component-bg-color);
        }

        .wc-ai-bot-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          background: var(--input-bg-color);
          color: var(--input-color);
          resize: none;
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.25rem;
          min-height: 3.5rem;
          max-height: 120px;
        }

        .wc-ai-bot-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-color-alpha);
        }

        .wc-ai-bot-send {
          padding: 0.5rem 0.75rem;
          /*
          background: var(--primary-color);
          color: var(--primary-contrast-color);
          */
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: center;
          flex-shrink: 0;
          height: 2.5rem;
        }

        .wc-ai-bot-send:hover:not(:disabled) {
          opacity: 0.9;
        }

        .wc-ai-bot-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Status bar */
        .wc-ai-bot-status {
          display: none;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          background: var(--primary-bg-color);
          color: var(--primary-color);
          border-top: 1px solid var(--border-color);
        }

        .wc-ai-bot-status--error {
          background: var(--danger-color);
          color: var(--danger-contrast-color);
        }

        .wc-ai-bot-status--warning {
          background: var(--warning-color, #f59e0b);
          color: var(--warning-contrast-color, white);
        }

        /* FAB Button */
        .wc-ai-bot-fab {
          position: fixed;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary-bg-color);
          color: var(--primary-color);
          border: none;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wc-ai-bot-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
        }

        /* FAB positions based on bot position */
        .wc-ai-bot--bubble.wc-ai-bot--bottom-right .wc-ai-bot-fab {
          bottom: 1rem;
          right: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--bottom-left .wc-ai-bot-fab {
          bottom: 1rem;
          left: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--top-right .wc-ai-bot-fab {
          top: 1rem;
          right: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--top-left .wc-ai-bot-fab {
          top: 1rem;
          left: 1rem;
        }

        /* Hide FAB for non-bubble themes */
        .wc-ai-bot--minimal .wc-ai-bot-fab,
        .wc-ai-bot--sidebar .wc-ai-bot-fab {
          display: none !important;
        }

        /* Theme: Bubble */
        .wc-ai-bot--bubble .wc-ai-bot-container {
          position: fixed;
          width: 350px;
          height: 500px;
          z-index: 1000;
          transition: opacity 0.3s, transform 0.3s;
          opacity: 0;
          transform: scale(0.95);
          pointer-events: none;
        }

        .wc-ai-bot--bubble.wc-ai-bot--open .wc-ai-bot-container {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        /* Bubble positions */
        .wc-ai-bot--bubble.wc-ai-bot--bottom-right .wc-ai-bot-container {
          bottom: 1rem;
          right: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--bottom-left .wc-ai-bot-container {
          bottom: 1rem;
          left: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--top-right .wc-ai-bot-container {
          top: 1rem;
          right: 1rem;
        }

        .wc-ai-bot--bubble.wc-ai-bot--top-left .wc-ai-bot-container {
          top: 1rem;
          left: 1rem;
        }

        /* Theme: Minimal */
        .wc-ai-bot--minimal .wc-ai-bot-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
          box-shadow: none;
        }

        .wc-ai-bot--minimal .wc-ai-bot-header {
          background: transparent;
          color: var(--color);
          border-bottom: 1px solid var(--border-color);
        }

        .wc-ai-bot--minimal .wc-ai-bot-header button {
          color: var(--color);
        }

        /* Theme: Sidebar */
        .wc-ai-bot--sidebar .wc-ai-bot-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
        }

        .wc-ai-bot--sidebar .wc-ai-bot-messages {
          max-height: none;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .wc-ai-bot--bubble .wc-ai-bot-container {
            width: calc(100vw - 2rem);
            height: calc(100vh - 2rem);
            max-width: 350px;
            max-height: 500px;
          }
        }

        /* Unsupported UI */
        .wc-ai-bot-container--unsupported {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .wc-ai-bot-unsupported {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
        }

        .wc-ai-bot-unsupported-icon {
          color: var(--warning-color, #f59e0b);
          margin-bottom: 1rem;
        }

        .wc-ai-bot-unsupported-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--color);
        }

        .wc-ai-bot-unsupported-message {
          color: var(--muted-color);
          margin-bottom: 1rem;
        }

        .wc-ai-bot-unsupported-help {
          font-size: 0.875rem;
          color: var(--muted-color);
        }
      `.trim();
      this.loadStyle("wc-ai-bot-style", style);
      const theme = this.getAttribute("theme") || "bubble";
      const position = this.getAttribute("position") || "bottom-right";
      const maxHeight = this.getAttribute("max-height");
      this.classList.remove("wc-ai-bot--bubble", "wc-ai-bot--minimal", "wc-ai-bot--sidebar");
      this.classList.remove(
        "wc-ai-bot--bottom-right",
        "wc-ai-bot--bottom-left",
        "wc-ai-bot--top-right",
        "wc-ai-bot--top-left"
      );
      this.classList.add(`wc-ai-bot--${theme}`);
      if (theme === "bubble" && position) {
        this.classList.add(`wc-ai-bot--${position}`);
      }
      if (maxHeight && theme !== "bubble" && this._container) {
        this._container.style.maxHeight = maxHeight;
      } else if (this._container) {
        this._container.style.maxHeight = "";
      }
      if (this._container) {
        const toggleBtn = this._container.querySelector(".wc-ai-bot-toggle");
        if (toggleBtn) {
          toggleBtn.style.display = theme === "bubble" ? "block" : "none";
        }
      }
    }
    async _initializeModel() {
      let modelName = this.getAttribute("model");
      if (!modelName && this._detectedCapability) {
        if (this._detectedCapability === "high" || this._detectedCapability === "medium") {
          modelName = "Llama-3.2-3B-Instruct-q4f32_1-MLC";
        } else {
          modelName = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
        }
        if (this.getAttribute("debug") === "true") {
          console.log(`[wc-ai-bot] Auto-selected model ${modelName} based on ${this._detectedCapability} capability`);
        }
      }
      if (!modelName) {
        modelName = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
      }
      const botId = this.getAttribute("bot-id") || "default";
      try {
        this._updateStatus("Initializing AI model...");
        if (!webllmModule) {
          this._updateStatus("Loading WebLLM...");
          webllmModule = await import("https://esm.run/@mlc-ai/web-llm");
        }
        if (loadedModels.has(modelName)) {
          this._engine = loadedModels.get(modelName);
          this._isModelReady = true;
          this._sendButton.disabled = false;
          this._updateStatus("");
          this._emitEvent("bot:ready", { botId, model: modelName });
          return;
        }
        if (modelLoadingPromises.has(modelName)) {
          this._updateStatus("Waiting for model to load...");
          this._engine = await modelLoadingPromises.get(modelName);
          this._isModelReady = true;
          this._sendButton.disabled = false;
          this._updateStatus("");
          this._emitEvent("bot:ready", { botId, model: modelName });
          return;
        }
        const loadPromise = this._loadModel(modelName);
        modelLoadingPromises.set(modelName, loadPromise);
        this._engine = await loadPromise;
        loadedModels.set(modelName, this._engine);
        modelLoadingPromises.delete(modelName);
        this._isModelReady = true;
        this._sendButton.disabled = false;
        this._updateStatus("");
        this._emitEvent("bot:ready", { botId, model: modelName });
        localStorage.setItem("wc-ai-bot-success", "true");
      } catch (error) {
        console.error("[wc-ai-bot] Failed to initialize model:", error);
        this._error = error.message;
        this._updateStatus(`Error: ${error.message}`, "error");
        this._emitEvent("bot:error", { botId, error: error.message });
        if (this.getAttribute("force-enable") !== "true") {
          localStorage.setItem("wc-ai-bot-failure", "true");
        }
      }
    }
    async _loadModel(modelName) {
      const engine = new webllmModule.MLCEngine();
      let lastProgress = 0;
      let progressTimeout = null;
      engine.setInitProgressCallback((progress) => {
        const percentage = Math.round(progress.progress * 100);
        this._modelProgress = percentage;
        if (progress.text) {
          this._updateStatus(`${progress.text} ${percentage}%`);
        } else {
          this._updateStatus(`Loading model: ${percentage}%`);
        }
        if (progressTimeout) clearTimeout(progressTimeout);
        lastProgress = percentage;
        progressTimeout = setTimeout(() => {
          if (lastProgress < 100) {
            this._updateStatus(`Download may be stalled at ${lastProgress}%. Check network connection.`, "warning");
          }
        }, 3e4);
      });
      try {
        await engine.reload(modelName);
        if (progressTimeout) clearTimeout(progressTimeout);
        return engine;
      } catch (error) {
        if (progressTimeout) clearTimeout(progressTimeout);
        throw error;
      }
    }
    _handleAttributeChange(name, newValue, oldValue) {
      if (name === "system-prompt" && this._isModelReady) {
      } else if (name === "theme" || name === "position" || name === "max-height") {
        this._applyStyles();
      } else if (name === "title" && this._container) {
        const titleEl = this._container.querySelector(".wc-ai-bot-header-title span");
        if (titleEl) titleEl.textContent = newValue;
      } else if (name === "placeholder" && this._input) {
        this._input.placeholder = newValue || "Type your message...";
      }
    }
    _handleSend() {
      const message = this._input.value.trim();
      if (!message || !this._isModelReady || this._isLoading) return;
      this._sendMessage(message);
    }
    _handleKeydown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    }
    _handleToggle() {
      this._isMinimized = !this._isMinimized;
      this.classList.toggle("wc-ai-bot--open", !this._isMinimized);
      if (!this._isMinimized) {
        this._input.focus();
        if (this._fab) {
          this._fab.style.display = "none";
        }
      } else {
        if (this._fab) {
          this._fab.style.display = "flex";
        }
      }
    }
    _handleClose() {
      if (this.getAttribute("theme") === "bubble") {
        this._isMinimized = true;
        this.classList.remove("wc-ai-bot--open");
        if (this._fab) {
          this._fab.style.display = "flex";
        }
      } else {
        this._emitEvent("bot:closed", { botId: this.getAttribute("bot-id") });
      }
    }
    async _sendMessage(message) {
      const botId = this.getAttribute("bot-id") || "default";
      this._addMessage("user", message);
      this._input.value = "";
      this._adjustInputHeight();
      this._emitEvent("bot:message-sent", { botId, message });
      this._isLoading = true;
      this._sendButton.disabled = true;
      const loadingId = this._addMessage("bot", "...", true);
      try {
        const messages = this._prepareMessages(message);
        const temperature = parseFloat(this.getAttribute("temperature") || "0.7");
        const maxTokens = parseInt(this.getAttribute("max-tokens") || "1000");
        const completion = await this._engine.chat.completions.create({
          messages,
          temperature,
          max_tokens: maxTokens,
          stream: true
        });
        let response = "";
        for await (const chunk of completion) {
          const delta = chunk.choices[0].delta.content || "";
          response += delta;
          this._updateMessage(loadingId, response);
        }
        if (this.getAttribute("debug") === "true") {
          console.log("[wc-ai-bot] Raw LLM response:", response);
        }
        this._emitEvent("bot:response-received", { botId, response });
      } catch (error) {
        console.error("[wc-ai-bot] Failed to get response:", error);
        this._updateMessage(loadingId, `Error: ${error.message}`);
        this._emitEvent("bot:error", { botId, error: error.message });
      } finally {
        this._isLoading = false;
        this._sendButton.disabled = false;
        this._input.focus();
      }
    }
    _prepareMessages(userMessage) {
      const systemPrompt = this.getAttribute("system-prompt") || "You are a helpful AI assistant. Be concise and friendly in your responses.";
      const messages = [
        { role: "system", content: systemPrompt }
      ];
      const history = this._messages.slice(-10);
      history.forEach((msg) => {
        if (msg.role !== "system") {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content
          });
        }
      });
      messages.push({ role: "user", content: userMessage });
      return messages;
    }
    _addMessage(role, content, isLoading = false) {
      const messageId = Date.now().toString();
      const message = { id: messageId, role, content, timestamp: /* @__PURE__ */ new Date(), isLoading };
      this._messages.push(message);
      const messageEl = document.createElement("div");
      messageEl.className = `wc-ai-bot-message wc-ai-bot-message--${role}`;
      messageEl.dataset.messageId = messageId;
      const bubbleEl = document.createElement("div");
      bubbleEl.className = "wc-ai-bot-message-bubble";
      if (isLoading) {
        bubbleEl.classList.add("wc-ai-bot-message-bubble--loading");
        bubbleEl.innerHTML = '<wc-loader size="90px" speed="1s" thickness="12px"></wc-loader>';
      } else {
        if (role === "bot" && markedModule && markedModule.marked) {
          const html = markedModule.marked.parse(content);
          bubbleEl.innerHTML = html;
          if (this.getAttribute("debug") === "true") {
            console.log("[wc-ai-bot] Parsed HTML:", html);
          }
        } else {
          bubbleEl.textContent = content;
        }
      }
      messageEl.appendChild(bubbleEl);
      this._messagesContainer.appendChild(messageEl);
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
      return messageId;
    }
    _updateMessage(messageId, content) {
      const messageEl = this._messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
      if (messageEl) {
        const bubbleEl = messageEl.querySelector(".wc-ai-bot-message-bubble");
        if (bubbleEl) {
          bubbleEl.classList.remove("wc-ai-bot-message-bubble--loading");
          if (markedModule && markedModule.marked) {
            const html = markedModule.marked.parse(content);
            bubbleEl.innerHTML = html;
            if (this.getAttribute("debug") === "true") {
              console.log("[wc-ai-bot] Updated HTML:", html);
            }
          } else {
            bubbleEl.textContent = content;
          }
        }
      }
      const message = this._messages.find((m) => m.id === messageId);
      if (message) {
        message.content = content;
        message.isLoading = false;
      }
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
    }
    _updateStatus(status, type = "info") {
      if (this._statusBar) {
        this._statusBar.textContent = status;
        this._statusBar.className = `wc-ai-bot-status wc-ai-bot-status--${type}`;
        this._statusBar.style.display = status ? "block" : "none";
      }
    }
    _adjustInputHeight() {
      this._input.style.height = "auto";
      this._input.style.height = Math.min(this._input.scrollHeight, 120) + "px";
    }
    _getWelcomeMessage() {
      const title = this.getAttribute("title") || "AI Assistant";
      return `Hello! I'm ${title}. How can I help you today?`;
    }
    _emitEvent(eventName, detail) {
      this.dispatchEvent(new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true
      }));
      const botId = this.getAttribute("bot-id");
      if (botId && window.wc && window.wc.EventHub) {
        window.wc.EventHub.broadcast(eventName, [`[bot-id="${botId}"]`], detail);
      }
    }
    // Public methods
    async sendMessage(text) {
      if (this._isModelReady && !this._isLoading) {
        this._input.value = text;
        await this._sendMessage(text);
      }
    }
    static async getAvailableModels() {
      if (!webllmModule) {
        webllmModule = await import("https://esm.run/@mlc-ai/web-llm");
      }
      if (webllmModule.prebuiltAppConfig && webllmModule.prebuiltAppConfig.model_list) {
        return webllmModule.prebuiltAppConfig.model_list.map((model) => ({
          model_id: model.model_id,
          model: model.model,
          description: model.description || ""
        }));
      }
      return [];
    }
    clearConversation() {
      this._messages = [];
      this._messagesContainer.innerHTML = "";
      this._addMessage("bot", this._getWelcomeMessage());
      this._emitEvent("bot:conversation-cleared", {
        botId: this.getAttribute("bot-id")
      });
    }
    exportConversation() {
      return {
        botId: this.getAttribute("bot-id"),
        model: this.getAttribute("model"),
        messages: this._messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }))
      };
    }
    setContext(context) {
      this.setAttribute("system-prompt", context);
    }
    toggleMinimize() {
      if (this.getAttribute("theme") === "bubble") {
        this._handleToggle();
      }
    }
    async _checkSystemCapabilities() {
      try {
        if (this.getAttribute("force-enable") === "true") {
          console.warn("[wc-ai-bot] Force-enabled, skipping capability checks");
          return true;
        }
        const previousSuccess = localStorage.getItem("wc-ai-bot-success");
        const previousFailure = localStorage.getItem("wc-ai-bot-failure");
        if (previousFailure === "true" && previousSuccess !== "true") {
          this._unsupportedReason = 'AI models previously failed to load on this device. Use force-enable="true" to retry.';
          return false;
        }
        const hasWebGPU = "gpu" in navigator;
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        const hasWebGL = !!gl;
        if (!hasWebGPU && !hasWebGL) {
          this._unsupportedReason = "WebGPU and WebGL are not available. A modern browser with GPU support is required.";
          return false;
        }
        let renderer = "unknown";
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
        let detectedConfig = null;
        for (const config of WcAiBot.KNOWN_CAPABLE_CONFIGS) {
          if (config.gpu.test(renderer)) {
            detectedConfig = config;
            break;
          }
        }
        if (this.getAttribute("debug") === "true") {
          console.log("[wc-ai-bot] Hardware detection:", {
            renderer,
            detectedConfig,
            hasWebGPU,
            hasWebGL,
            previousSuccess,
            previousFailure
          });
        }
        if (detectedConfig) {
          if (detectedConfig.capability === "none") {
            this._unsupportedReason = `${detectedConfig.name} is not capable of running AI models efficiently. This would cause your browser to freeze.`;
            return false;
          }
          if (detectedConfig.capability === "low") {
            const requiredPerformance = this.getAttribute("required-performance") || "low";
            if (requiredPerformance !== "low") {
              this._unsupportedReason = `${detectedConfig.name} can only run small AI models. Set required-performance="low" to proceed.`;
              return false;
            }
          }
          this._detectedCapability = detectedConfig.capability;
          return true;
        }
        if (previousSuccess === "true") {
          return true;
        }
        this._unsupportedReason = `Unable to verify GPU compatibility (${renderer}). To protect your browsing experience, AI models are disabled. Add force-enable="true" to try anyway.`;
        return false;
      } catch (error) {
        console.error("[wc-ai-bot] Error checking system capabilities:", error);
        this._unsupportedReason = "Error detecting system capabilities. AI models are disabled for safety.";
        return false;
      }
    }
    _renderUnsupportedUI() {
      this._isUnsupported = true;
      const theme = this.getAttribute("theme") || "bubble";
      const title = this.getAttribute("title") || "AI Assistant";
      if (theme === "bubble") {
        this.style.display = "none";
        this._emitEvent("bot:unsupported", {
          botId: this.getAttribute("bot-id"),
          reason: this._unsupportedReason
        });
        return;
      }
      this._container = document.createElement("div");
      this._container.className = "wc-ai-bot-container wc-ai-bot-container--unsupported";
      this._container.innerHTML = `
        <div class="wc-ai-bot-unsupported">
          <div class="wc-ai-bot-unsupported-icon">
            <wc-fa-icon name="triangle-exclamation" icon-style="solid" size="2rem"></wc-fa-icon>
          </div>
          <h3 class="wc-ai-bot-unsupported-title">${title} Unavailable</h3>
          <p class="wc-ai-bot-unsupported-message">${this._unsupportedReason}</p>
          <p class="wc-ai-bot-unsupported-help">
            For the best experience, please use a modern browser on a device with at least 
            ${this.getAttribute("min-memory-gb") || "4"}GB of memory.
          </p>
        </div>
      `;
      this.appendChild(this._container);
      this._applyStyles();
      this._emitEvent("bot:unsupported", {
        botId: this.getAttribute("bot-id"),
        reason: this._unsupportedReason
      });
    }
    static async checkSystemSupport() {
      try {
        const previousSuccess = localStorage.getItem("wc-ai-bot-success") === "true";
        const previousFailure = localStorage.getItem("wc-ai-bot-failure") === "true";
        const hasWebGPU = "gpu" in navigator;
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        const hasWebGL = !!gl;
        if (!hasWebGPU && !hasWebGL) {
          return {
            supported: false,
            reason: "No WebGPU or WebGL support",
            hasWebGPU,
            hasWebGL
          };
        }
        let renderer = "unknown";
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
        let detectedConfig = null;
        for (const config of WcAiBot.KNOWN_CAPABLE_CONFIGS) {
          if (config.gpu.test(renderer)) {
            detectedConfig = config;
            break;
          }
        }
        const result = {
          renderer,
          hasWebGPU,
          hasWebGL,
          previousSuccess,
          previousFailure
        };
        if (detectedConfig) {
          result.hardware = detectedConfig.name;
          result.capability = detectedConfig.capability;
          result.supported = detectedConfig.capability !== "none";
          if (detectedConfig.capability === "high") {
            result.recommendation = "Excellent hardware for AI models. Can run large models smoothly.";
            result.suggestedModel = "Llama-3.2-3B-Instruct-q4f32_1-MLC";
          } else if (detectedConfig.capability === "medium") {
            result.recommendation = "Good hardware for AI models. Suitable for medium-sized models.";
            result.suggestedModel = "Llama-3.2-3B-Instruct-q4f32_1-MLC";
          } else if (detectedConfig.capability === "low") {
            result.recommendation = "Limited hardware. Only small AI models recommended.";
            result.suggestedModel = "Llama-3.2-1B-Instruct-q4f32_1-MLC";
          } else {
            result.recommendation = "This hardware cannot run AI models efficiently.";
            result.suggestedModel = null;
          }
        } else {
          result.hardware = "Unknown";
          result.capability = "unknown";
          result.supported = previousSuccess && !previousFailure;
          result.recommendation = previousSuccess ? "This hardware has successfully run AI models before." : 'Unknown hardware. Use force-enable="true" to try at your own risk.';
        }
        return result;
      } catch (error) {
        return {
          supported: false,
          error: error.message,
          recommendation: "Error detecting hardware capabilities."
        };
      }
    }
    static clearStoredPreferences() {
      localStorage.removeItem("wc-ai-bot-success");
      localStorage.removeItem("wc-ai-bot-failure");
    }
  }
  customElements.define(WcAiBot.is, WcAiBot);
}

// src/js/components/wc-hf-bot.js
if (!customElements.get("wc-hf-bot")) {
  let transformersModule = null;
  let markedModule = null;
  const loadedModels = /* @__PURE__ */ new Map();
  const modelLoadingPromises = /* @__PURE__ */ new Map();
  class WcHfBot extends WcBaseComponent {
    static get observedAttributes() {
      return [
        "bot-id",
        "model",
        "system-prompt",
        "title",
        "placeholder",
        "theme",
        "position",
        "auto-open",
        "max-height",
        "temperature",
        "max-tokens",
        "debug",
        "check-gpu-compatibility",
        "force-enable"
      ];
    }
    // Known hardware configurations (same as wc-ai-bot)
    static KNOWN_CAPABLE_CONFIGS = [
      // Apple Silicon - excellent support
      { gpu: /Apple M[1-4]/, capability: "high", name: "Apple Silicon" },
      // High-end NVIDIA GPUs (RTX 30/40 series)
      { gpu: /RTX [34]0[6-9]0/, capability: "high", name: "NVIDIA RTX High-end" },
      { gpu: /RTX [34]0[7-8]0/, capability: "high", name: "NVIDIA RTX High-end" },
      // Mid-range NVIDIA GPUs
      { gpu: /RTX [34]0[5-6]0/, capability: "medium", name: "NVIDIA RTX Mid-range" },
      { gpu: /RTX 20[7-8]0/, capability: "medium", name: "NVIDIA RTX 20 Series" },
      { gpu: /GTX 16[6-8]0/, capability: "low", name: "NVIDIA GTX 16 Series" },
      // AMD GPUs (limited WebGPU support)
      { gpu: /Radeon RX 6[7-9]00/, capability: "medium", name: "AMD Radeon RX 6000" },
      { gpu: /Radeon RX 7[7-9]00/, capability: "medium", name: "AMD Radeon RX 7000" },
      // Known problematic hardware
      { gpu: /Intel.*HD Graphics/, capability: "none", name: "Intel HD Graphics" },
      { gpu: /Intel.*UHD Graphics/, capability: "none", name: "Intel UHD Graphics" },
      { gpu: /Intel.*Iris/, capability: "low", name: "Intel Iris" },
      { gpu: /Radeon Vega/, capability: "low", name: "AMD Radeon Vega" },
      { gpu: /GeForce MX/, capability: "none", name: "NVIDIA GeForce MX" }
    ];
    constructor() {
      super();
      this._messages = [];
      this._isLoading = false;
      this._isModelReady = false;
      this._isMinimized = true;
      this._error = null;
      this._tokenizer = null;
      this._model = null;
      this._modelProgress = 0;
      this._isUnsupported = false;
      this._unsupportedReason = "";
      this._currentMessageId = null;
      this._currentResponse = "";
      this._handleSend = this._handleSend.bind(this);
      this._handleKeydown = this._handleKeydown.bind(this);
      this._handleToggle = this._handleToggle.bind(this);
      this._handleClose = this._handleClose.bind(this);
    }
    static get is() {
      return "wc-hf-bot";
    }
    async _render() {
      this.classList.add("contents");
      const checkGPU = this.getAttribute("check-gpu-compatibility") !== "false";
      if (checkGPU && !await this._checkSystemCapabilities()) {
        this._renderUnsupportedUI();
        return;
      }
      const title = this.getAttribute("title") || "HF Assistant";
      const placeholder = this.getAttribute("placeholder") || "Type your message...";
      this._container = document.createElement("div");
      this._container.className = "wc-hf-bot-container";
      const header = document.createElement("div");
      header.className = "wc-hf-bot-header";
      header.innerHTML = `
        <div class="wc-hf-bot-header-title">
          <wc-fa-icon name="robot" icon-style="solid" size="1.2rem" class="mr-2"></wc-fa-icon>
          <span>${title}</span>
        </div>
        <div class="wc-hf-bot-header-actions">
          <button class="wc-hf-bot-toggle" aria-label="Toggle chat">
            <wc-fa-icon name="minus" icon-style="solid" size="1rem"></wc-fa-icon>
          </button>
          <button class="wc-hf-bot-close" aria-label="Close chat">
            <wc-fa-icon name="xmark" icon-style="solid" size="1rem"></wc-fa-icon>
          </button>
        </div>
      `;
      this._messagesContainer = document.createElement("div");
      this._messagesContainer.className = "wc-hf-bot-messages";
      const inputContainer = document.createElement("div");
      inputContainer.className = "wc-hf-bot-input-container";
      this._input = document.createElement("textarea");
      this._input.className = "wc-hf-bot-input";
      this._input.placeholder = placeholder;
      this._input.rows = 2;
      this._sendButton = document.createElement("button");
      this._sendButton.className = "wc-hf-bot-send";
      this._sendButton.innerHTML = '<wc-fa-icon name="paper-plane" icon-style="solid" size="1rem"></wc-fa-icon>';
      this._sendButton.disabled = true;
      inputContainer.appendChild(this._input);
      inputContainer.appendChild(this._sendButton);
      this._container.appendChild(header);
      this._container.appendChild(this._messagesContainer);
      this._container.appendChild(inputContainer);
      this._statusBar = document.createElement("div");
      this._statusBar.className = "wc-hf-bot-status";
      this._container.appendChild(this._statusBar);
      this.appendChild(this._container);
      if (this.getAttribute("theme") === "bubble" || !this.getAttribute("theme")) {
        this._fab = document.createElement("button");
        this._fab.className = "wc-hf-bot-fab";
        this._fab.setAttribute("aria-label", "Open chat");
        this._fab.innerHTML = '<wc-fa-icon name="message" icon-style="solid" size="1.5rem"></wc-fa-icon>';
        this._fab.addEventListener("click", () => {
          this._isMinimized = false;
          this.classList.add("wc-hf-bot--open");
          this._fab.style.display = "none";
          setTimeout(() => this._input.focus(), 100);
        });
        this.appendChild(this._fab);
      }
      this._applyStyles();
      this._sendButton.addEventListener("click", this._handleSend);
      this._input.addEventListener("keydown", this._handleKeydown);
      this._input.addEventListener("input", () => this._adjustInputHeight());
      const toggleBtn = this._container.querySelector(".wc-hf-bot-toggle");
      if (toggleBtn) toggleBtn.addEventListener("click", this._handleToggle);
      const closeBtn = this._container.querySelector(".wc-hf-bot-close");
      if (closeBtn) closeBtn.addEventListener("click", this._handleClose);
      await this._initializeModel();
      if (!markedModule) {
        try {
          const module = await import("https://cdn.jsdelivr.net/npm/marked@4/lib/marked.esm.js");
          markedModule = module;
          console.log("[wc-hf-bot] Marked module loaded successfully");
        } catch (error) {
          console.error("[wc-hf-bot] Failed to load marked module:", error);
        }
      }
      if (this.getAttribute("auto-open") === "true") {
        this._isMinimized = false;
        this.classList.add("wc-hf-bot--open");
        if (this._fab) {
          this._fab.style.display = "none";
        }
      }
      this._addMessage("bot", this._getWelcomeMessage());
    }
    _applyStyles() {
      const style = `
        wc-hf-bot {
          display: contents;
        }

        /* Base container styles */
        .wc-hf-bot-container {
          display: flex;
          flex-direction: column;
          background: var(--component-bg-color);
          border: 1px solid var(--border-color);
          border-radius: 0.5rem;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        /* Header styles */
        .wc-hf-bot-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.75rem 1rem;
          background: var(--primary-bg-color);
          color: var(--primary-color);
        }

        .wc-hf-bot-header-title {
          display: flex;
          align-items: center;
          font-weight: 600;
        }

        .wc-hf-bot-header-actions {
          display: flex;
          gap: 0.5rem;
        }

        .wc-hf-bot-header button {
          background: transparent;
          border: none;
          color: var(--primary-color);
          cursor: pointer;
          padding: 0.25rem;
          border-radius: 0.25rem;
          transition: opacity 0.2s;
        }

        .wc-hf-bot-header button:hover {
          opacity: 0.8;
        }

        /* Messages container */
        .wc-hf-bot-messages {
          flex: 1;
          overflow-y: auto;
          padding: 1rem;
          min-height: 200px;
          max-height: 400px;
          background: var(--component-bg-color);
        }

        /* Message styles */
        .wc-hf-bot-message {
          margin-bottom: 1rem;
          display: flex;
        }

        .wc-hf-bot-message--user {
          justify-content: flex-end;
        }

        .wc-hf-bot-message--bot {
          justify-content: flex-start;
        }

        .wc-hf-bot-message-bubble {
          max-width: 80%;
          padding: 0.75rem;
          border-radius: 0.5rem;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .wc-hf-bot-message--user .wc-hf-bot-message-bubble {
          background: var(--primary-color);
          color: var(--primary-bg-color);
        }

        .wc-hf-bot-message--bot .wc-hf-bot-message-bubble {
          background: var(--primary-bg-color);
          color: var(--primary-color);
        }

        /* Markdown content styling */
        .wc-hf-bot-message-bubble p {
          margin: 0 0 0.5rem 0;
        }
        
        .wc-hf-bot-message-bubble p:last-child {
          margin-bottom: 0;
        }
        
        .wc-hf-bot-message-bubble ul,
        .wc-hf-bot-message-bubble ol {
          margin: 0 0 0.5rem 0;
          padding-left: 1.5rem;
        }
        
        .wc-hf-bot-message-bubble li {
          margin-bottom: 0.25rem;
        }
        
        .wc-hf-bot-message-bubble pre {
          background: var(--code-bg-color, rgba(0,0,0,0.1));
          padding: 0.5rem;
          border-radius: 0.25rem;
          overflow-x: auto;
          margin: 0.5rem 0;
        }
        
        .wc-hf-bot-message-bubble code {
          background: var(--code-bg-color, rgba(0,0,0,0.1));
          padding: 0.125rem 0.25rem;
          border-radius: 0.125rem;
          font-size: 0.875em;
        }
        
        .wc-hf-bot-message-bubble pre code {
          background: none;
          padding: 0;
        }

        /* Transparent background for loading bubbles */
        .wc-hf-bot-message-bubble--loading {
          background: transparent !important;
          padding: 0 !important;
          display: flex;
          flex: 1 1 0%;
          justify-content: center;
          align-items: center;
          min-width: 100px;
          min-height: 60px;
        }

        /* Input container */
        .wc-hf-bot-input-container {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem 0 1rem 1rem;
          border-top: 1px solid var(--border-color);
          background: var(--component-bg-color);
        }

        .wc-hf-bot-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--border-color);
          border-radius: 0.375rem;
          background: var(--input-bg-color);
          color: var(--input-color);
          resize: none;
          font-family: inherit;
          font-size: 0.875rem;
          line-height: 1.25rem;
          min-height: 3.5rem;
          max-height: 120px;
        }

        .wc-hf-bot-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-color-alpha);
        }

        .wc-hf-bot-send {
          padding: 0.5rem 0.75rem;
          border: none;
          border-radius: 0.375rem;
          cursor: pointer;
          transition: opacity 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: center;
          flex-shrink: 0;
          height: 2.5rem;
        }

        .wc-hf-bot-send:hover:not(:disabled) {
          opacity: 0.9;
        }

        .wc-hf-bot-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Status bar */
        .wc-hf-bot-status {
          display: none;
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          background: var(--primary-bg-color);
          color: var(--primary-color);
          border-top: 1px solid var(--border-color);
        }

        .wc-hf-bot-status--error {
          background: var(--danger-color);
          color: var(--danger-contrast-color);
        }

        .wc-hf-bot-status--warning {
          background: var(--warning-color, #f59e0b);
          color: var(--warning-contrast-color, white);
        }

        /* FAB Button */
        .wc-hf-bot-fab {
          position: fixed;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--primary-bg-color);
          color: var(--primary-color);
          border: none;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          z-index: 999;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wc-hf-bot-fab:hover {
          transform: scale(1.05);
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05);
        }

        /* FAB positions based on bot position */
        .wc-hf-bot--bubble.wc-hf-bot--bottom-right .wc-hf-bot-fab {
          bottom: 1rem;
          right: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--bottom-left .wc-hf-bot-fab {
          bottom: 1rem;
          left: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--top-right .wc-hf-bot-fab {
          top: 1rem;
          right: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--top-left .wc-hf-bot-fab {
          top: 1rem;
          left: 1rem;
        }

        /* Hide FAB for non-bubble themes */
        .wc-hf-bot--minimal .wc-hf-bot-fab,
        .wc-hf-bot--sidebar .wc-hf-bot-fab {
          display: none !important;
        }

        /* Theme: Bubble */
        .wc-hf-bot--bubble .wc-hf-bot-container {
          position: fixed;
          width: 350px;
          height: 500px;
          z-index: 1000;
          transition: opacity 0.3s, transform 0.3s;
          opacity: 0;
          transform: scale(0.95);
          pointer-events: none;
        }

        .wc-hf-bot--bubble.wc-hf-bot--open .wc-hf-bot-container {
          opacity: 1;
          transform: scale(1);
          pointer-events: auto;
        }

        /* Bubble positions */
        .wc-hf-bot--bubble.wc-hf-bot--bottom-right .wc-hf-bot-container {
          bottom: 1rem;
          right: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--bottom-left .wc-hf-bot-container {
          bottom: 1rem;
          left: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--top-right .wc-hf-bot-container {
          top: 1rem;
          right: 1rem;
        }

        .wc-hf-bot--bubble.wc-hf-bot--top-left .wc-hf-bot-container {
          top: 1rem;
          left: 1rem;
        }

        /* Theme: Minimal */
        .wc-hf-bot--minimal .wc-hf-bot-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
          box-shadow: none;
        }

        .wc-hf-bot--minimal .wc-hf-bot-header {
          background: transparent;
          color: var(--color);
          border-bottom: 1px solid var(--border-color);
        }

        .wc-hf-bot--minimal .wc-hf-bot-header button {
          color: var(--color);
        }

        /* Theme: Sidebar */
        .wc-hf-bot--sidebar .wc-hf-bot-container {
          width: 100%;
          height: 100%;
          border-radius: 0;
        }

        .wc-hf-bot--sidebar .wc-hf-bot-messages {
          max-height: none;
        }

        /* Responsive */
        @media (max-width: 640px) {
          .wc-hf-bot--bubble .wc-hf-bot-container {
            width: calc(100vw - 2rem);
            height: calc(100vh - 2rem);
            max-width: 350px;
            max-height: 500px;
          }
        }

        /* Unsupported UI */
        .wc-hf-bot-container--unsupported {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 300px;
        }

        .wc-hf-bot-unsupported {
          text-align: center;
          padding: 2rem;
          max-width: 400px;
        }

        .wc-hf-bot-unsupported-icon {
          color: var(--warning-color, #f59e0b);
          margin-bottom: 1rem;
        }

        .wc-hf-bot-unsupported-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.75rem;
          color: var(--color);
        }

        .wc-hf-bot-unsupported-message {
          color: var(--muted-color);
          margin-bottom: 1rem;
        }

        .wc-hf-bot-unsupported-help {
          font-size: 0.875rem;
          color: var(--muted-color);
        }
      `.trim();
      this.loadStyle("wc-hf-bot-style", style);
      const theme = this.getAttribute("theme") || "bubble";
      const position = this.getAttribute("position") || "bottom-right";
      const maxHeight = this.getAttribute("max-height");
      this.classList.remove("wc-hf-bot--bubble", "wc-hf-bot--minimal", "wc-hf-bot--sidebar");
      this.classList.remove(
        "wc-hf-bot--bottom-right",
        "wc-hf-bot--bottom-left",
        "wc-hf-bot--top-right",
        "wc-hf-bot--top-left"
      );
      this.classList.add(`wc-hf-bot--${theme}`);
      if (theme === "bubble" && position) {
        this.classList.add(`wc-hf-bot--${position}`);
      }
      if (maxHeight && theme !== "bubble" && this._container) {
        this._container.style.maxHeight = maxHeight;
      } else if (this._container) {
        this._container.style.maxHeight = "";
      }
      if (this._container) {
        const toggleBtn = this._container.querySelector(".wc-hf-bot-toggle");
        if (toggleBtn) {
          toggleBtn.style.display = theme === "bubble" ? "block" : "none";
        }
      }
    }
    async _initializeModel() {
      let modelName = this.getAttribute("model");
      if (!modelName && this._detectedCapability) {
        if (this._detectedCapability === "high" || this._detectedCapability === "medium") {
          modelName = "Xenova/gpt2";
        } else {
          modelName = "Xenova/distilgpt2";
        }
        if (this.getAttribute("debug") === "true") {
          console.log(`[wc-hf-bot] Auto-selected model ${modelName} based on ${this._detectedCapability} capability`);
        }
      }
      if (!modelName) {
        modelName = "Xenova/distilgpt2";
      }
      const botId = this.getAttribute("bot-id") || "default";
      try {
        this._updateStatus("Initializing AI model...");
        if (!transformersModule) {
          this._updateStatus("Loading Transformers.js...");
          transformersModule = await import("https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.5.0");
        }
        if (loadedModels.has(modelName)) {
          const cached = loadedModels.get(modelName);
          this._tokenizer = cached.tokenizer;
          this._model = cached.model;
          this._isModelReady = true;
          this._sendButton.disabled = false;
          this._updateStatus("");
          this._emitEvent("bot:ready", { botId, model: modelName });
          return;
        }
        if (modelLoadingPromises.has(modelName)) {
          this._updateStatus("Waiting for model to load...");
          const cached = await modelLoadingPromises.get(modelName);
          this._tokenizer = cached.tokenizer;
          this._model = cached.model;
          this._isModelReady = true;
          this._sendButton.disabled = false;
          this._updateStatus("");
          this._emitEvent("bot:ready", { botId, model: modelName });
          return;
        }
        const loadPromise = this._loadModel(modelName);
        modelLoadingPromises.set(modelName, loadPromise);
        const loaded = await loadPromise;
        this._tokenizer = loaded.tokenizer;
        this._model = loaded.model;
        loadedModels.set(modelName, loaded);
        modelLoadingPromises.delete(modelName);
        this._isModelReady = true;
        this._sendButton.disabled = false;
        this._updateStatus("");
        this._emitEvent("bot:ready", { botId, model: modelName });
        localStorage.setItem("wc-hf-bot-success", "true");
      } catch (error) {
        console.error("[wc-hf-bot] Failed to initialize model:", error);
        this._error = error.message;
        this._updateStatus(`Error: ${error.message}`, "error");
        this._emitEvent("bot:error", { botId, error: error.message });
        if (this.getAttribute("force-enable") !== "true") {
          localStorage.setItem("wc-hf-bot-failure", "true");
        }
      }
    }
    async _loadModel(modelName) {
      const { AutoTokenizer, AutoModelForCausalLM, TextStreamer, InterruptableStoppingCriteria, env } = transformersModule;
      const progressCallback = (progress) => {
        if (progress.status === "progress" && progress.file) {
          const percentage = Math.round((progress.progress || 0) * 100);
          this._modelProgress = percentage;
          this._updateStatus(`Downloading ${progress.file}: ${percentage}%`);
        } else if (progress.status === "done") {
          this._updateStatus("Model loaded, initializing...");
        }
      };
      try {
        this._updateStatus("Loading tokenizer...");
        const tokenizer = await AutoTokenizer.from_pretrained(modelName, {
          progress_callback: progressCallback
        });
        this._updateStatus("Loading model...");
        const hasWebGPU = "gpu" in navigator;
        const hasFloat16 = typeof Float16Array !== "undefined";
        const modelOptions = {
          progress_callback: progressCallback
        };
        if (hasWebGPU && hasFloat16) {
          modelOptions.dtype = "q4f16";
          modelOptions.device = "webgpu";
        } else if (hasWebGPU) {
          modelOptions.dtype = "q4";
          modelOptions.device = "webgpu";
        } else {
          modelOptions.dtype = "q4";
        }
        if (this.getAttribute("debug") === "true") {
          console.log("[wc-hf-bot] Model loading config:", {
            hasWebGPU,
            hasFloat16,
            modelOptions
          });
        }
        const model = await AutoModelForCausalLM.from_pretrained(modelName, modelOptions);
        return { tokenizer, model };
      } catch (error) {
        throw error;
      }
    }
    _handleAttributeChange(name, newValue, oldValue) {
      if (name === "system-prompt" && this._isModelReady) {
      } else if (name === "theme" || name === "position" || name === "max-height") {
        this._applyStyles();
      } else if (name === "title" && this._container) {
        const titleEl = this._container.querySelector(".wc-hf-bot-header-title span");
        if (titleEl) titleEl.textContent = newValue;
      } else if (name === "placeholder" && this._input) {
        this._input.placeholder = newValue || "Type your message...";
      }
    }
    _handleSend() {
      const message = this._input.value.trim();
      if (!message || !this._isModelReady || this._isLoading) return;
      this._sendMessage(message);
    }
    _handleKeydown(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this._handleSend();
      }
    }
    _handleToggle() {
      this._isMinimized = !this._isMinimized;
      this.classList.toggle("wc-hf-bot--open", !this._isMinimized);
      if (!this._isMinimized) {
        this._input.focus();
        if (this._fab) {
          this._fab.style.display = "none";
        }
      } else {
        if (this._fab) {
          this._fab.style.display = "flex";
        }
      }
    }
    _handleClose() {
      if (this.getAttribute("theme") === "bubble") {
        this._isMinimized = true;
        this.classList.remove("wc-hf-bot--open");
        if (this._fab) {
          this._fab.style.display = "flex";
        }
      } else {
        this._emitEvent("bot:closed", { botId: this.getAttribute("bot-id") });
      }
    }
    async _sendMessage(message) {
      const botId = this.getAttribute("bot-id") || "default";
      this._addMessage("user", message);
      this._input.value = "";
      this._adjustInputHeight();
      this._emitEvent("bot:message-sent", { botId, message });
      this._isLoading = true;
      this._sendButton.disabled = true;
      const loadingId = this._addMessage("bot", "...", true);
      this._currentMessageId = loadingId;
      this._currentResponse = "";
      try {
        const messages = this._prepareMessages(message);
        let inputs;
        if (this._tokenizer.apply_chat_template) {
          const text = this._tokenizer.apply_chat_template(messages, {
            tokenize: false,
            add_generation_prompt: true
          });
          inputs = await this._tokenizer(text);
        } else {
          const recentMessages = messages.slice(-5);
          const text = recentMessages.map((m) => {
            if (m.role === "system") return m.content;
            if (m.role === "user") return `User: ${m.content}`;
            return `Assistant: ${m.content}`;
          }).join("\n") + "\nAssistant:";
          inputs = await this._tokenizer(text);
        }
        const temperature = parseFloat(this.getAttribute("temperature") || "0.7");
        const maxTokens = parseInt(this.getAttribute("max-tokens") || "1000");
        const { TextStreamer } = transformersModule;
        const streamer = new TextStreamer(this._tokenizer, {
          skip_prompt: true,
          skip_special_tokens: true,
          callback_function: (text) => {
            this._currentResponse += text;
            this._updateMessage(this._currentMessageId, this._currentResponse);
          }
        });
        const output = await this._model.generate({
          ...inputs,
          max_new_tokens: maxTokens,
          temperature,
          do_sample: temperature > 0,
          streamer,
          return_dict_in_generate: true
        });
        if (this.getAttribute("debug") === "true") {
          console.log("[wc-hf-bot] Raw response:", this._currentResponse);
        }
        this._emitEvent("bot:response-received", { botId, response: this._currentResponse });
      } catch (error) {
        console.error("[wc-hf-bot] Failed to get response:", error);
        this._updateMessage(loadingId, `Error: ${error.message}`);
        this._emitEvent("bot:error", { botId, error: error.message });
      } finally {
        this._isLoading = false;
        this._sendButton.disabled = false;
        this._input.focus();
      }
    }
    _prepareMessages(userMessage) {
      const systemPrompt = this.getAttribute("system-prompt") || "You are a helpful AI assistant. Be concise and friendly in your responses.";
      const messages = [
        { role: "system", content: systemPrompt }
      ];
      const history = this._messages.slice(-10);
      history.forEach((msg) => {
        if (msg.role !== "system") {
          messages.push({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content
          });
        }
      });
      messages.push({ role: "user", content: userMessage });
      return messages;
    }
    _addMessage(role, content, isLoading = false) {
      const messageId = Date.now().toString();
      const message = { id: messageId, role, content, timestamp: /* @__PURE__ */ new Date(), isLoading };
      this._messages.push(message);
      const messageEl = document.createElement("div");
      messageEl.className = `wc-hf-bot-message wc-hf-bot-message--${role}`;
      messageEl.dataset.messageId = messageId;
      const bubbleEl = document.createElement("div");
      bubbleEl.className = "wc-hf-bot-message-bubble";
      if (isLoading) {
        bubbleEl.classList.add("wc-hf-bot-message-bubble--loading");
        bubbleEl.innerHTML = '<wc-loader size="90px" speed="1s" thickness="12px"></wc-loader>';
      } else {
        if (role === "bot" && markedModule && markedModule.marked) {
          const html = markedModule.marked.parse(content);
          bubbleEl.innerHTML = html;
          if (this.getAttribute("debug") === "true") {
            console.log("[wc-hf-bot] Parsed HTML:", html);
          }
        } else {
          bubbleEl.textContent = content;
        }
      }
      messageEl.appendChild(bubbleEl);
      this._messagesContainer.appendChild(messageEl);
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
      return messageId;
    }
    _updateMessage(messageId, content) {
      const messageEl = this._messagesContainer.querySelector(`[data-message-id="${messageId}"]`);
      if (messageEl) {
        const bubbleEl = messageEl.querySelector(".wc-hf-bot-message-bubble");
        if (bubbleEl) {
          bubbleEl.classList.remove("wc-hf-bot-message-bubble--loading");
          if (markedModule && markedModule.marked) {
            const html = markedModule.marked.parse(content);
            bubbleEl.innerHTML = html;
            if (this.getAttribute("debug") === "true") {
              console.log("[wc-hf-bot] Updated HTML:", html);
            }
          } else {
            bubbleEl.textContent = content;
          }
        }
      }
      const message = this._messages.find((m) => m.id === messageId);
      if (message) {
        message.content = content;
        message.isLoading = false;
      }
      this._messagesContainer.scrollTop = this._messagesContainer.scrollHeight;
    }
    _updateStatus(status, type = "info") {
      if (this._statusBar) {
        this._statusBar.textContent = status;
        this._statusBar.className = `wc-hf-bot-status wc-hf-bot-status--${type}`;
        this._statusBar.style.display = status ? "block" : "none";
      }
    }
    _adjustInputHeight() {
      this._input.style.height = "auto";
      this._input.style.height = Math.min(this._input.scrollHeight, 120) + "px";
    }
    _getWelcomeMessage() {
      const title = this.getAttribute("title") || "HF Assistant";
      return `Hello! I'm ${title} powered by Hugging Face. How can I help you today?`;
    }
    _emitEvent(eventName, detail) {
      this.dispatchEvent(new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true
      }));
      const botId = this.getAttribute("bot-id");
      if (botId && window.wc && window.wc.EventHub) {
        window.wc.EventHub.broadcast(eventName, [`[bot-id="${botId}"]`], detail);
      }
    }
    async _checkSystemCapabilities() {
      try {
        if (this.getAttribute("force-enable") === "true") {
          console.warn("[wc-hf-bot] Force-enabled, skipping capability checks");
          return true;
        }
        const previousSuccess = localStorage.getItem("wc-hf-bot-success");
        const previousFailure = localStorage.getItem("wc-hf-bot-failure");
        if (previousFailure === "true" && previousSuccess !== "true") {
          this._unsupportedReason = 'AI models previously failed to load on this device. Use force-enable="true" to retry.';
          return false;
        }
        const hasWebGPU = "gpu" in navigator;
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        const hasWebGL = !!gl;
        if (!hasWebGPU && !hasWebGL) {
          this._unsupportedReason = "WebGPU and WebGL are not available. A modern browser with GPU support is required.";
          return false;
        }
        let renderer = "unknown";
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
        let detectedConfig = null;
        for (const config of WcHfBot.KNOWN_CAPABLE_CONFIGS) {
          if (config.gpu.test(renderer)) {
            detectedConfig = config;
            break;
          }
        }
        if (this.getAttribute("debug") === "true") {
          console.log("[wc-hf-bot] Hardware detection:", {
            renderer,
            detectedConfig,
            hasWebGPU,
            hasWebGL,
            previousSuccess,
            previousFailure
          });
        }
        if (detectedConfig) {
          if (detectedConfig.capability === "none") {
            this._unsupportedReason = `${detectedConfig.name} is not capable of running AI models efficiently. This would cause your browser to freeze.`;
            return false;
          }
          if (detectedConfig.capability === "low") {
            console.warn("[wc-hf-bot] Low capability hardware detected. Performance may be poor.");
          }
          this._detectedCapability = detectedConfig.capability;
          return true;
        }
        if (previousSuccess === "true") {
          return true;
        }
        this._unsupportedReason = `Unable to verify GPU compatibility (${renderer}). To protect your browsing experience, AI models are disabled. Add force-enable="true" to try anyway.`;
        return false;
      } catch (error) {
        console.error("[wc-hf-bot] Error checking system capabilities:", error);
        this._unsupportedReason = "Error detecting system capabilities. AI models are disabled for safety.";
        return false;
      }
    }
    _renderUnsupportedUI() {
      this._isUnsupported = true;
      const theme = this.getAttribute("theme") || "bubble";
      const title = this.getAttribute("title") || "HF Assistant";
      if (theme === "bubble") {
        this.style.display = "none";
        this._emitEvent("bot:unsupported", {
          botId: this.getAttribute("bot-id"),
          reason: this._unsupportedReason
        });
        return;
      }
      this._container = document.createElement("div");
      this._container.className = "wc-hf-bot-container wc-hf-bot-container--unsupported";
      this._container.innerHTML = `
        <div class="wc-hf-bot-unsupported">
          <div class="wc-hf-bot-unsupported-icon">
            <wc-fa-icon name="triangle-exclamation" icon-style="solid" size="2rem"></wc-fa-icon>
          </div>
          <h3 class="wc-hf-bot-unsupported-title">${title} Unavailable</h3>
          <p class="wc-hf-bot-unsupported-message">${this._unsupportedReason}</p>
          <p class="wc-hf-bot-unsupported-help">
            For the best experience, please use a modern browser on a device with GPU support.
          </p>
        </div>
      `;
      this.appendChild(this._container);
      this._applyStyles();
      this._emitEvent("bot:unsupported", {
        botId: this.getAttribute("bot-id"),
        reason: this._unsupportedReason
      });
    }
    // Public methods
    async sendMessage(text) {
      if (this._isModelReady && !this._isLoading) {
        this._input.value = text;
        await this._sendMessage(text);
      }
    }
    static async getAvailableModels() {
      if (!transformersModule) {
        transformersModule = await import("https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2");
      }
      return [
        { model_id: "Xenova/distilgpt2", description: "DistilGPT2 - Tiny model for testing (~250MB)" },
        { model_id: "Xenova/gpt2", description: "GPT-2 Small - Classic model (~500MB)" },
        { model_id: "Xenova/gpt2-medium", description: "GPT-2 Medium - Better quality (~1.5GB)" },
        { model_id: "Xenova/DialoGPT-small", description: "DialoGPT - Optimized for conversations (~350MB)" },
        { model_id: "Xenova/DialoGPT-medium", description: "DialoGPT Medium - Better conversations (~1.5GB)" },
        { model_id: "Xenova/bloom-560m", description: "BLOOM 560M - Multilingual model (~1.1GB)" }
      ];
    }
    static async checkSystemSupport() {
      try {
        const previousSuccess = localStorage.getItem("wc-hf-bot-success") === "true";
        const previousFailure = localStorage.getItem("wc-hf-bot-failure") === "true";
        const hasWebGPU = "gpu" in navigator;
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
        const hasWebGL = !!gl;
        if (!hasWebGPU && !hasWebGL) {
          return {
            supported: false,
            reason: "No WebGPU or WebGL support",
            hasWebGPU,
            hasWebGL
          };
        }
        let renderer = "unknown";
        if (gl) {
          const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
          if (debugInfo) {
            renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
          }
        }
        let detectedConfig = null;
        for (const config of WcHfBot.KNOWN_CAPABLE_CONFIGS) {
          if (config.gpu.test(renderer)) {
            detectedConfig = config;
            break;
          }
        }
        const result = {
          renderer,
          hasWebGPU,
          hasWebGL,
          previousSuccess,
          previousFailure
        };
        if (detectedConfig) {
          result.hardware = detectedConfig.name;
          result.capability = detectedConfig.capability;
          result.supported = detectedConfig.capability !== "none";
          if (detectedConfig.capability === "high") {
            result.recommendation = "Excellent hardware for AI models. Can run large models smoothly.";
            result.suggestedModel = "Xenova/gpt2-medium";
          } else if (detectedConfig.capability === "medium") {
            result.recommendation = "Good hardware for AI models. Suitable for medium-sized models.";
            result.suggestedModel = "Xenova/gpt2";
          } else if (detectedConfig.capability === "low") {
            result.recommendation = "Limited hardware. Only small AI models recommended.";
            result.suggestedModel = "Xenova/distilgpt2";
          } else {
            result.recommendation = "This hardware cannot run AI models efficiently.";
            result.suggestedModel = null;
          }
        } else {
          result.hardware = "Unknown";
          result.capability = "unknown";
          result.supported = previousSuccess && !previousFailure;
          result.recommendation = previousSuccess ? "This hardware has successfully run AI models before." : 'Unknown hardware. Use force-enable="true" to try at your own risk.';
        }
        return result;
      } catch (error) {
        return {
          supported: false,
          error: error.message,
          recommendation: "Error detecting hardware capabilities."
        };
      }
    }
    static clearStoredPreferences() {
      localStorage.removeItem("wc-hf-bot-success");
      localStorage.removeItem("wc-hf-bot-failure");
    }
    clearConversation() {
      this._messages = [];
      this._messagesContainer.innerHTML = "";
      this._addMessage("bot", this._getWelcomeMessage());
      this._emitEvent("bot:conversation-cleared", {
        botId: this.getAttribute("bot-id")
      });
    }
    exportConversation() {
      return {
        botId: this.getAttribute("bot-id"),
        model: this.getAttribute("model"),
        messages: this._messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: m.timestamp
        }))
      };
    }
    setContext(context) {
      this.setAttribute("system-prompt", context);
    }
    toggleMinimize() {
      if (this.getAttribute("theme") === "bubble") {
        this._handleToggle();
      }
    }
  }
  customElements.define(WcHfBot.is, WcHfBot);
}

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
      this.componentElement.className = "wc-article-skeleton max-w-full m-4 border border-solid card-border-color p-4 space-y-8 animate-pulse md:space-y-0 md:space-x-8 rtl:space-x-reverse md:flex md:flex-1 md:items-center";
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
      this.loadStyle = loadStyle.bind(this);
      dependencyManager.register("IMask");
    }
    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderMask();
        this._applyStyle();
      }
    }
    disconnectedCallback() {
    }
    async renderMask() {
      await dependencyManager.load("IMask");
      if (!window.wc) {
        window.wc = {};
      }
      window.wc.MaskHub = this;
      this.maskConfigs = {
        phone: {
          mask: "(000) 000-0000",
          lazy: false,
          placeholderChar: "_"
        },
        ssn: {
          mask: "000-00-0000",
          lazy: false,
          placeholderChar: "_"
        },
        zip: {
          mask: "00000",
          lazy: false,
          placeholderChar: "_"
        },
        zipPlus4: {
          mask: "00000-0000",
          lazy: false,
          placeholderChar: "_"
        },
        date: {
          mask: Date,
          pattern: "m/d/Y",
          lazy: false,
          blocks: {
            m: {
              mask: IMask.MaskedRange,
              from: 1,
              to: 12,
              maxLength: 2
            },
            d: {
              mask: IMask.MaskedRange,
              from: 1,
              to: 31,
              maxLength: 2
            },
            Y: {
              mask: IMask.MaskedRange,
              from: 1900,
              to: 2099,
              maxLength: 4
            }
          }
        },
        currency: {
          mask: Number,
          scale: 2,
          thousandsSeparator: ",",
          padFractionalZeros: true,
          normalizeZeros: true,
          radix: ".",
          mapToRadix: ["."],
          min: 0
        }
      };
    }
    /**
     * Generic method to apply any mask type to an input
     * @param {Event} event - The event object with target input element
     * @param {string} maskType - The type of mask to apply (phone, ssn, etc.)
     */
    applyMask(event, maskType = "phone") {
      const { target } = event;
      if (target._imaskInstance) {
        return;
      }
      const maskConfig = this.maskConfigs[maskType];
      if (!maskConfig) {
        console.error(`WcMaskHub: Unknown mask type "${maskType}". Available types:`, Object.keys(this.maskConfigs));
        return;
      }
      target._imaskInstance = IMask(target, maskConfig);
      target._maskType = maskType;
      if (target.value) {
        target._imaskInstance.value = target.value;
      }
      if (!target._maskCleanupRegistered) {
        target._maskCleanupRegistered = true;
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.removedNodes.forEach((node) => {
              if (node === target || node.contains(target)) {
                this._destroyMask(target);
                observer.disconnect();
              }
            });
          });
        });
        if (target.parentNode) {
          observer.observe(target.parentNode, { childList: true, subtree: true });
        }
      }
    }
    /**
     * Convenience method for phone mask (backwards compatibility)
     */
    phoneMask(event) {
      this.applyMask(event, "phone");
    }
    /**
     * Convenience method for SSN mask
     */
    ssnMask(event) {
      this.applyMask(event, "ssn");
    }
    /**
     * Convenience method for ZIP code mask
     */
    zipMask(event) {
      this.applyMask(event, "zip");
    }
    /**
     * Convenience method for ZIP+4 mask
     */
    zipPlus4Mask(event) {
      this.applyMask(event, "zipPlus4");
    }
    /**
     * Convenience method for date mask
     */
    dateMask(event) {
      this.applyMask(event, "date");
    }
    /**
     * Convenience method for currency mask
     */
    currencyMask(event) {
      this.applyMask(event, "currency");
    }
    /**
     * Destroy mask instance and cleanup
     */
    _destroyMask(target) {
      if (target._imaskInstance) {
        target._imaskInstance.destroy();
        target._imaskInstance = null;
        target._maskType = null;
      }
    }
    /**
     * Public method to get the unmasked value
     * @param {HTMLElement} target - The input element
     * @returns {string} The unmasked value
     */
    getUnmaskedValue(target) {
      if (target._imaskInstance) {
        return target._imaskInstance.unmaskedValue;
      }
      return target.value;
    }
    /**
     * Public method to update mask value programmatically
     * @param {HTMLElement} target - The input element
     * @param {string} value - The value to set
     */
    updateMaskValue(target, value) {
      if (target._imaskInstance) {
        target._imaskInstance.value = value;
      } else {
        target.value = value;
      }
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
            window.wc.linksLoaded[url] = true;
            document.body.dispatchEvent(new CustomEvent("link-loaded", {
              detail: { url },
              bubbles: true,
              composed: true
            }));
          };
          link.onerror = () => {
            document.body.dispatchEvent(new CustomEvent("link-error", {
              detail: { url },
              bubbles: true,
              composed: true
            }));
          };
          document.head.appendChild(link);
        } else {
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
        } else {
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
          const defer = this.hasAttribute("defer");
          const script = document.createElement("script");
          script.type = "text/javascript";
          script.textContent = scriptContent;
          script.id = scriptId;
          if (defer) {
            script.setAttribute("defer", "");
          }
          document.head.appendChild(script);
        } else {
          const fn = window.wc.scripts[scriptId];
          if (fn) {
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

// src/js/components/wc-notify.js
if (!customElements.get("wc-notify")) {
  class WcNotify extends HTMLElement {
    static get observedAttributes() {
      return ["delay", "position"];
    }
    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);
      this._defaultDelay = 3e3;
      this._notifications = [];
      this._position = "top-right";
    }
    async connectedCallback() {
      if (document.querySelector(this.tagName) !== this) {
        console.warn(`${this.tagName} is already present on the page.`);
        this.remove();
      } else {
        await this.renderNotify();
      }
      this._applyStyle();
    }
    disconnectedCallback() {
    }
    attributeChangedCallback(name, oldValue, newValue) {
      if (name === "delay") {
        this._defaultDelay = parseInt(newValue) || 3e3;
      } else if (name === "position") {
        const validPositions = ["top-right", "top-left", "bottom-right", "bottom-left"];
        if (validPositions.includes(newValue)) {
          this._position = newValue;
        }
      }
    }
    get delay() {
      return this._defaultDelay;
    }
    get position() {
      return this._position;
    }
    async renderNotify() {
      if (!window.wc) {
        window.wc = {};
      }
      window.wc.Notify = this;
      wc.EventHub.broadcast("wc-notify:ready", "", "");
    }
    showSuccess(message, delay, persist = false) {
      this.showNotification(message, "success", delay, persist);
    }
    showError(message, delay, persist = false) {
      this.showNotification(message, "error", delay, persist);
    }
    showInfo(message, delay, persist = false) {
      this.showNotification(message, "info", delay, persist);
    }
    showWarning(message, delay, persist = false) {
      this.showNotification(message, "warning", delay, persist);
    }
    showNotification(message, type = "info", delay, persist = false) {
      const notificationDelay = delay !== void 0 ? delay : this.delay;
      const notification = document.createElement("div");
      notification.className = `notification ${type} ${this.position}`;
      let notificationContent = `
        <wc-fa-icon name="${type === "success" ? "circle-check" : type === "error" ? "circle-exclamation" : type === "warning" ? "triangle-exclamation" : "circle-info"}" icon-style="duotone" size="1rem" class="flex">
        </wc-fa-icon>
        <span class="notification-message">${message}</span>
      `;
      if (persist) {
        notificationContent += `
          <button class="notification-close" aria-label="Close notification">
            <wc-fa-icon name="xmark" size="1rem"></wc-fa-icon>
          </button>
        `;
      }
      notification.innerHTML = notificationContent;
      if (persist) {
        const closeBtn = notification.querySelector(".notification-close");
        closeBtn.addEventListener("click", () => {
          this._removeNotification(notification);
        });
      }
      this._notifications.push(notification);
      this._updateNotificationPositions();
      document.body.appendChild(notification);
      setTimeout(() => notification.classList.add("show"), 10);
      if (!persist) {
        setTimeout(() => {
          this._removeNotification(notification);
        }, notificationDelay);
      }
    }
    _removeNotification(notification) {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
        const index = this._notifications.indexOf(notification);
        if (index > -1) {
          this._notifications.splice(index, 1);
          this._updateNotificationPositions();
        }
      }, 300);
    }
    _updateNotificationPositions() {
      const spacing = 10;
      const isBottom = this.position.includes("bottom");
      let currentPosition = 20;
      this._notifications.forEach((notification) => {
        if (isBottom) {
          notification.style.bottom = `${currentPosition}px`;
          notification.style.top = "auto";
        } else {
          notification.style.top = `${currentPosition}px`;
          notification.style.bottom = "auto";
        }
        if (notification.offsetHeight) {
          currentPosition += notification.offsetHeight + spacing;
        } else {
          currentPosition += 60 + spacing;
        }
      });
    }
    _applyStyle() {
      const style = `
        wc-notify {
          display: contents;
        }
        /* Notifications */
        .notification {
            position: fixed;
            background: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            display: flex;
            align-items: center;
            gap: 0.75rem;
            transition: transform 0.3s, top 0.3s ease-out, bottom 0.3s ease-out;
            z-index: 2000;
            max-width: 400px;
        }

        .notification-message {
            flex: 1;
        }

        .notification-close {
          position: absolute;
          top: 0.25rem;
          right: 0.25rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0.25rem;
          color: #666;
          transition: color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-close:hover {
            color: #333;
        }

        /* Position-specific styles */
        .notification.top-right {
            right: 20px;
            transform: translateX(400px);
        }

        .notification.top-left {
            left: 20px;
            transform: translateX(-400px);
        }

        .notification.bottom-right {
            right: 20px;
            transform: translateX(400px);
        }

        .notification.bottom-left {
            left: 20px;
            transform: translateX(-400px);
        }

        .notification.show {
            transform: translateX(0);
        }

        .notification.success {
          border-left: 4px solid #2ecc71;
          background-color: #c6edd7ff;
          color: #063218ff;
        }

        .notification.success svg {
          color: #149048ff;
        }

        .notification.error {
          border-left: 4px solid #e74c3c;
          background-color: #ecd3d1ff;
          color: #44140fff;
        }

        .notification.error svg {
          color: #c03020ff;
        }

        .notification.info {
          border-left: 4px solid #3498db;
          background-color: #bad5e7ff;
          color: #0b4973ff;
        }

        .notification.info svg {
          color: #1c85cbff;
        }

        .notification.warning {
          border-left: 4px solid #f39c12;
          background-color: #ffeaa7;
          color: #7d4f00;
        }

        .notification.warning svg {
          color: #f39c12;
        }
      `;
      this.loadStyle("wc-notify-style", style);
    }
  }
  customElements.define("wc-notify", WcNotify);
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

// src/js/components/wc-chart.js
var WcChart = class _WcChart extends WcBaseComponent {
  static get is() {
    return "wc-chart";
  }
  static get observedAttributes() {
    return [
      "type",
      "labels",
      "data",
      "label",
      "datasets",
      "title",
      "height",
      "width",
      "colors",
      "show-legend",
      "show-data-labels",
      "padding-top",
      "responsive",
      "maintain-aspect-ratio",
      "x-axis-title",
      "y-axis-title",
      "stacked",
      "tension",
      "fill",
      "point-radius",
      "border-width",
      "text-color",
      "grid-color",
      "class"
    ];
  }
  constructor() {
    super();
    this.chart = null;
    this.chartInstance = null;
    this.canvas = null;
    this.isLibraryLoaded = false;
    this.pendingChartConfig = null;
    this.defaultColors = [
      "--primary-bg-color",
      "--success-bg-color",
      "--warning-bg-color",
      "--danger-bg-color",
      "--info-bg-color",
      "--secondary-bg-color"
    ];
    this.componentElement = document.createElement("div");
    this.componentElement.classList.add("wc-chart", "relative", "w-full");
    this.appendChild(this.componentElement);
  }
  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    await this._initChart();
    this._wireEvents();
  }
  disconnectedCallback() {
    super.disconnectedCallback();
    this._destroyChart();
    this._unWireEvents();
  }
  async _initChart() {
    if (!this.isLibraryLoaded) {
      await this._loadChartLibrary();
    }
    this._createCanvas();
    this._createChart();
  }
  async _loadChartLibrary() {
    try {
      await this.loadLibrary("https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js", "Chart");
      if (window.Chart) {
        await this.loadLibrary("https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.2.0/dist/chartjs-plugin-datalabels.min.js", "ChartDataLabels");
      }
      if (window.Chart && window.ChartDataLabels) {
        window.Chart.register(window.ChartDataLabels);
        window.Chart.defaults.plugins.datalabels = {
          display: false
        };
        const textColor = this._getThemeColor("text-color", "--primary-color");
        const gridColor = this._getThemeColor("grid-color", "--component-border-color");
        window.Chart.defaults.color = textColor;
        window.Chart.defaults.borderColor = gridColor;
      }
      this.isLibraryLoaded = true;
      if (window.wc && window.wc.EventHub) {
        window.wc.EventHub.broadcast("wc-chart:library-loaded", "", { Chart: window.Chart });
      }
    } catch (error) {
      console.error("Failed to load Chart.js library:", error);
    }
  }
  _createCanvas() {
    if (this.canvas) return;
    const wrapper = document.createElement("div");
    wrapper.classList.add("chart-wrapper", "relative");
    const height = this.getAttribute("height") || "400";
    const width = this.getAttribute("width") || "auto";
    if (width !== "auto") {
      wrapper.style.width = `${width}px`;
    }
    wrapper.style.height = `${height}px`;
    this.canvas = document.createElement("canvas");
    this.canvas.setAttribute("role", "img");
    this.canvas.setAttribute("aria-label", this.getAttribute("title") || "Chart");
    wrapper.appendChild(this.canvas);
    this.componentElement.appendChild(wrapper);
  }
  _createChart() {
    if (!window.Chart || !this.canvas) {
      this.pendingChartConfig = this._buildChartConfig();
      return;
    }
    this._destroyChart();
    const config = this._buildChartConfig();
    if (!config) return;
    try {
      this.chartInstance = new window.Chart(this.canvas, config);
      this.dispatchEvent(new CustomEvent("chart-created", {
        detail: { chart: this.chartInstance },
        bubbles: true
      }));
    } catch (error) {
      console.error("Failed to create chart:", error);
    }
  }
  _buildChartConfig() {
    const type = this.getAttribute("type") || "bar";
    const labels = this._parseJSON(this.getAttribute("labels"), []);
    const datasets = this._buildDatasets();
    if (!datasets || datasets.length === 0) {
      return null;
    }
    const config = {
      type,
      data: {
        labels,
        datasets
      },
      options: this._buildChartOptions(type)
    };
    return config;
  }
  _buildDatasets() {
    const datasetsAttr = this.getAttribute("datasets");
    if (datasetsAttr) {
      const datasets = this._parseJSON(datasetsAttr, []);
      return datasets.map((dataset, index) => this._formatDataset(dataset, index));
    }
    const data = this._parseJSON(this.getAttribute("data"), []);
    const label = this.getAttribute("label") || "Dataset";
    if (!data || data.length === 0) {
      return [];
    }
    return [this._formatDataset({ label, data }, 0)];
  }
  _formatDataset(dataset, index) {
    const type = this.getAttribute("type") || "bar";
    const colors = this._parseJSON(this.getAttribute("colors"), this.defaultColors);
    let color = colors[index % colors.length];
    color = this._resolveColor(color);
    const rgbColor = this._cssVarToRgb(color);
    const formattedDataset = {
      label: dataset.label,
      data: dataset.data,
      backgroundColor: type === "line" ? `rgba(${rgbColor}, 0.2)` : color,
      borderColor: color,
      borderWidth: parseInt(this.getAttribute("border-width") || "2")
    };
    if (type === "line") {
      formattedDataset.tension = parseFloat(this.getAttribute("tension") || "0.1");
      formattedDataset.fill = this.getAttribute("fill") !== "false";
      formattedDataset.pointRadius = parseInt(this.getAttribute("point-radius") || "3");
      formattedDataset.pointBackgroundColor = color;
    } else if (type === "pie" || type === "doughnut") {
      formattedDataset.backgroundColor = dataset.data.map((_, i) => {
        const segmentColor = colors[i % colors.length];
        return this._resolveColor(segmentColor);
      });
      formattedDataset.borderColor = "#fff";
    } else if (type === "radar") {
      formattedDataset.backgroundColor = `rgba(${rgbColor}, 0.2)`;
      formattedDataset.borderColor = color;
      Object.assign(formattedDataset, {
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointHoverBackgroundColor: "#fff",
        pointHoverBorderColor: color
      });
    } else if (type === "polarArea") {
      formattedDataset.backgroundColor = `rgba(${rgbColor}, 0.2)`;
      formattedDataset.borderColor = color;
    }
    return formattedDataset;
  }
  _buildChartOptions(type) {
    const showLegend = this.getAttribute("show-legend") !== "false";
    const showDataLabels = this.getAttribute("show-data-labels") === "true";
    const responsive = this.getAttribute("responsive") !== "false";
    const maintainAspectRatio = this.getAttribute("maintain-aspect-ratio") !== "false";
    const title = this.getAttribute("title");
    const xAxisTitle = this.getAttribute("x-axis-title");
    const yAxisTitle = this.getAttribute("y-axis-title");
    const stacked = this.getAttribute("stacked") === "true";
    const paddingTop = parseInt(this.getAttribute("padding-top") || (showDataLabels && type === "bar" ? "30" : "0"));
    const textColor = this._getThemeColor("text-color", "--primary-color");
    const gridColor = this._getThemeColor("grid-color", "--component-border-color");
    const options = {
      responsive,
      maintainAspectRatio,
      plugins: {
        legend: {
          display: showLegend,
          position: "top",
          labels: {
            color: textColor
          }
        },
        title: {
          display: !!title,
          text: title,
          color: textColor,
          font: {
            size: 16
          }
        },
        tooltip: {
          enabled: true,
          callbacks: {}
        },
        datalabels: {
          display: showDataLabels,
          anchor: "end",
          align: "top",
          formatter: (value) => value,
          color: textColor,
          font: {
            weight: "bold"
          }
        }
      },
      layout: {
        padding: {
          top: paddingTop
        }
      }
    };
    if (type !== "pie" && type !== "doughnut" && type !== "radar" && type !== "polarArea") {
      options.scales = {
        x: {
          display: true,
          stacked,
          title: {
            display: !!xAxisTitle,
            text: xAxisTitle,
            color: textColor
          },
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor,
            borderColor: gridColor
          }
        },
        y: {
          display: true,
          stacked,
          beginAtZero: true,
          title: {
            display: !!yAxisTitle,
            text: yAxisTitle,
            color: textColor
          },
          ticks: {
            color: textColor
          },
          grid: {
            color: gridColor,
            borderColor: gridColor
          }
        }
      };
    } else if (type === "radar") {
      options.scales = {
        r: {
          angleLines: {
            color: gridColor
          },
          grid: {
            color: gridColor
          },
          pointLabels: {
            color: textColor
          },
          ticks: {
            color: textColor,
            backdropColor: "transparent"
          }
        }
      };
    } else if (type === "polarArea") {
      options.scales = {
        r: {
          grid: {
            color: gridColor
          },
          ticks: {
            color: textColor,
            backdropColor: "transparent"
          }
        }
      };
    }
    if (type === "pie" || type === "doughnut") {
      options.plugins.tooltip.callbacks.label = function(context) {
        const label = context.label || "";
        const value = context.parsed || 0;
        const total = context.dataset.data.reduce((a, b) => a + b, 0);
        const percentage = (value / total * 100).toFixed(1);
        return `${label}: ${value} (${percentage}%)`;
      };
    }
    return options;
  }
  _handleAttributeChange(attrName, newValue, oldValue) {
    if (_WcChart.observedAttributes.includes(attrName)) {
      if (this.chartInstance) {
        this._createChart();
      }
    } else {
      super._handleAttributeChange(attrName, newValue, oldValue);
    }
  }
  _destroyChart() {
    if (this.chartInstance) {
      this.chartInstance.destroy();
      this.chartInstance = null;
    }
  }
  _parseJSON(jsonString, defaultValue) {
    if (!jsonString) return defaultValue;
    try {
      return JSON.parse(jsonString.replace(/'/g, '"'));
    } catch (e) {
      console.warn("Failed to parse JSON:", jsonString, e);
      return defaultValue;
    }
  }
  _cssVarToRgb(color) {
    if (color && color.startsWith("#")) {
      const hex = color.replace("#", "");
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `${r}, ${g}, ${b}`;
    }
    if (color && (color.startsWith("rgb(") || color.startsWith("rgba("))) {
      const match = color.match(/\d+/g);
      if (match && match.length >= 3) {
        return `${match[0]}, ${match[1]}, ${match[2]}`;
      }
    }
    return "52, 152, 219";
  }
  _resolveColor(color) {
    if (!color) return "#3498db";
    if (color.startsWith("#") || color.startsWith("rgb")) {
      return color;
    }
    let varName = color;
    if (!varName.startsWith("--")) {
      varName = `--${color}`;
    }
    let resolved = getComputedStyle(this).getPropertyValue(varName).trim();
    if (!resolved) {
      resolved = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    }
    if (resolved) {
      return resolved;
    }
    if (color.startsWith("var(")) {
      const match = color.match(/var\((--[^,)]+)(?:,\s*(.+))?\)/);
      if (match) {
        const cssVar = match[1];
        const fallback = match[2];
        const value = getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
        return value || fallback || "#3498db";
      }
    }
    const fallbackColors = {
      "chart-primary": "#3498db",
      "chart-success": "#2ecc71",
      "chart-warning": "#f39c12",
      "chart-danger": "#e74c3c",
      "chart-info": "#9b59b6",
      "chart-secondary": "#95a5a6"
    };
    const colorKey = color.replace("--", "").replace("-bg-color", "");
    return fallbackColors[colorKey] || fallbackColors[`chart-${colorKey}`] || "#3498db";
  }
  _getThemeColor(attrName, cssVar) {
    const attrValue = this.getAttribute(attrName);
    if (attrValue) return attrValue;
    let computedStyle = getComputedStyle(this);
    let value = computedStyle.getPropertyValue(cssVar).trim();
    if (value) {
      return value;
    }
    computedStyle = getComputedStyle(document.documentElement);
    value = computedStyle.getPropertyValue(cssVar).trim();
    if (value) {
      return value;
    }
    const fallbacks = {
      "--color": "#000000",
      "--component-border-color": "#ced4da"
    };
    return fallbacks[cssVar] || "#666666";
  }
  _wireEvents() {
    this._handleThemeChange = () => {
      setTimeout(() => {
        this.refresh();
      }, 100);
    };
    document.body.addEventListener("theme:change", this._handleThemeChange);
    if (this.canvas) {
      this.canvas.addEventListener("click", (event) => {
        if (!this.chartInstance) return;
        const points = this.chartInstance.getElementsAtEventForMode(
          event,
          "nearest",
          { intersect: true },
          false
        );
        if (points.length) {
          const firstPoint = points[0];
          const label = this.chartInstance.data.labels[firstPoint.index];
          const value = this.chartInstance.data.datasets[firstPoint.datasetIndex].data[firstPoint.index];
          this.dispatchEvent(new CustomEvent("chart-click", {
            detail: {
              label,
              value,
              datasetIndex: firstPoint.datasetIndex,
              index: firstPoint.index
            },
            bubbles: true
          }));
        }
      });
    }
    if (window.htmx) {
      document.body.addEventListener("htmx:afterSwap", (event) => {
        if (this.contains(event.target) || event.target.contains(this)) {
          setTimeout(() => this._createChart(), 100);
        }
      });
    }
  }
  _unWireEvents() {
    if (this._handleThemeChange) {
      document.body.removeEventListener("theme:change", this._handleThemeChange);
    }
  }
  _applyStyle() {
  }
  // Public methods
  refresh() {
    if (this.chartInstance) {
      this._createChart();
    }
  }
  updateData(newData) {
    if (!this.chartInstance) return;
    if (Array.isArray(newData)) {
      this.chartInstance.data.datasets[0].data = newData;
    } else if (newData.datasets) {
      this.chartInstance.data.datasets = newData.datasets.map(
        (ds, i) => this._formatDataset(ds, i)
      );
    }
    if (newData.labels) {
      this.chartInstance.data.labels = newData.labels;
    }
    this.chartInstance.update();
  }
  updateOptions(newOptions) {
    if (!this.chartInstance) return;
    Object.assign(this.chartInstance.options, newOptions);
    this.chartInstance.update();
  }
  toImage() {
    if (!this.chartInstance) return null;
    return this.chartInstance.toBase64Image();
  }
  getChart() {
    return this.chartInstance;
  }
  // Static method to refresh all charts on the page
  static refreshAll() {
    const charts = document.querySelectorAll("wc-chart");
    charts.forEach((chart) => {
      if (chart.refresh && typeof chart.refresh === "function") {
        chart.refresh();
      }
    });
  }
};
if (!customElements.get(WcChart.is)) {
  customElements.define(WcChart.is, WcChart);
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
      "toggle-swtich",
      "list",
      "auto-flex",
      "onchange",
      "oninput",
      "onblur",
      "onfocus",
      "onkeydown",
      "onkeyup",
      "onkeypress",
      "onclick",
      "tooltip",
      "tooltip-position"
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
      },
      {
        name: "eye",
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor">
            <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64c-7.1 0-13.9-1.2-20.3-3.3c-5.5-1.8-11.9 1.6-11.7 7.4c.3 6.9 1.3 13.8 3.2 20.7c13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3z"/>
          </svg>
        `.trim()
      },
      {
        name: "eye-slash",
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" fill="currentColor">
            <path d="M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zM223.1 149.5C248.6 126.2 282.7 112 320 112c79.5 0 144 64.5 144 144c0 24.9-6.3 48.3-17.4 68.7L408 294.5c8.4-19.3 10.6-41.4 4.8-63.3c-11.1-41.5-47.8-69.4-88.6-71.1c-5.8-.2-9.2 6.1-7.4 11.7c2.1 6.4 3.3 13.2 3.3 20.3c0 10.2-2.4 19.8-6.6 28.3l-90.3-70.8zM373 389.9c-16.4 6.5-34.3 10.1-53 10.1c-79.5 0-144-64.5-144-144c0-6.9 .5-13.6 1.4-20.2L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5L373 389.9z"/>
          </svg>
        `.trim()
      },
      {
        name: "lock",
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" fill="currentColor">
            <path d="M144 144l0 48 160 0 0-48c0-44.2-35.8-80-80-80s-80 35.8-80 80zM80 192l0-48C80 64.5 144.5 0 224 0s144 64.5 144 144l0 48 16 0c35.3 0 64 28.7 64 64l0 192c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 256c0-35.3 28.7-64 64-64l16 0z"/>
          </svg>
        `.trim()
      },
      {
        name: "lock-open",
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" fill="currentColor">
            <path d="M352 144c0-44.2 35.8-80 80-80s80 35.8 80 80l0 48c0 17.7 14.3 32 32 32s32-14.3 32-32l0-48C576 64.5 511.5 0 432 0S288 64.5 288 144l0 48L64 192c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64l-32 0 0-48z"/>
          </svg>
        `.trim()
      },
      {
        name: "magnifying-glass",
        icon: `
          <svg class="h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z"/>
          </svg>
        `.trim()
      },
      {
        name: "auto",
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <path d="M199.2 181.4L173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160C215.8 160 203.7 168.6 199.2 181.4zM103.6 260.8L138.8 160.3C152.3 121.8 188.6 96 229.4 96L410.6 96C451.4 96 487.7 121.8 501.2 160.3L536.4 260.8C559.6 270.4 576 293.3 576 320L576 512C576 529.7 561.7 544 544 544L512 544C494.3 544 480 529.7 480 512L480 480L160 480L160 512C160 529.7 145.7 544 128 544L96 544C78.3 544 64 529.7 64 512L64 320C64 293.3 80.4 270.4 103.6 260.8zM192 368C192 350.3 177.7 336 160 336C142.3 336 128 350.3 128 368C128 385.7 142.3 400 160 400C177.7 400 192 385.7 192 368zM480 400C497.7 400 512 385.7 512 368C512 350.3 497.7 336 480 336C462.3 336 448 350.3 448 368C448 385.7 462.3 400 480 400z"/>
          </svg>
        `.trim()
      },
      {
        name: "auto-dualtone",
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <!--!Font Awesome Pro v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc.-->
            <path opacity=".4" d="M64 480L64 512C64 529.7 78.3 544 96 544L128 544C145.7 544 160 529.7 160 512L160 480L64 480zM173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160C215.8 160 203.7 168.6 199.2 181.4L173.1 256zM480 480L480 512C480 529.7 494.3 544 512 544L544 544C561.7 544 576 529.7 576 512L576 480L480 480z"/><path d="M160 480L64 480L64 320C64 293.3 80.4 270.4 103.6 260.8L138.8 160.3C152.3 121.8 188.6 96 229.4 96L410.6 96C451.4 96 487.7 121.8 501.2 160.3L536.4 260.8C559.6 270.4 576 293.3 576 320L576 480L160 480zM229.4 160C215.8 160 203.7 168.6 199.2 181.4L173.1 256L466.9 256L440.8 181.4C436.3 168.6 424.2 160 410.6 160L229.4 160zM160 400C177.7 400 192 385.7 192 368C192 350.3 177.7 336 160 336C142.3 336 128 350.3 128 368C128 385.7 142.3 400 160 400zM512 368C512 350.3 497.7 336 480 336C462.3 336 448 350.3 448 368C448 385.7 462.3 400 480 400C497.7 400 512 385.7 512 368z"/>
          </svg>
        `.trim()
      },
      {
        name: "motorcycle",
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <!--!Font Awesome Free v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license/free Copyright 2025 Fonticons, Inc.-->
            <path d="M280 80C266.7 80 256 90.7 256 104C256 117.3 266.7 128 280 128L336.6 128L359.1 176.7L264 248C230.6 222.9 189 208 144 208L88 208C74.7 208 64 218.7 64 232C64 245.3 74.7 256 88 256L144 256C222.5 256 287.2 315.6 295.2 392L269.8 392C258.6 332.8 206.5 288 144 288C73.3 288 16 345.3 16 416C16 486.7 73.3 544 144 544C206.5 544 258.5 499.2 269.8 440L320 440C333.3 440 344 429.3 344 416L344 393.5C344 348.4 369.7 308.1 409.5 285.8L421.6 311.9C389.2 335.1 368.1 373.1 368.1 416C368.1 486.7 425.4 544 496.1 544C566.8 544 624.1 486.7 624.1 416C624.1 345.3 566.8 288 496.1 288C485.4 288 475.1 289.3 465.2 291.8L433.8 224L488 224C501.3 224 512 213.3 512 200L512 152C512 138.7 501.3 128 488 128L434.7 128C427.8 128 421 130.2 415.5 134.4L398.4 147.2L373.8 93.9C369.9 85.4 361.4 80 352 80L280 80zM445.8 364.4L474.2 426C479.8 438 494 443.3 506 437.7C518 432.1 523.3 417.9 517.7 405.9L489.2 344.3C491.4 344.1 493.6 344 495.9 344C535.7 344 567.9 376.2 567.9 416C567.9 455.8 535.7 488 495.9 488C456.1 488 423.9 455.8 423.9 416C423.9 395.8 432.2 377.5 445.7 364.4zM144 488C104.2 488 72 455.8 72 416C72 376.2 104.2 344 144 344C175.3 344 202 364 211.9 392L144 392C130.7 392 120 402.7 120 416C120 429.3 130.7 440 144 440L211.9 440C202 468 175.3 488 144 488z"/>
          </svg>
        `.trim()
      },
      {
        name: "motorcycle-dualtone",
        icon: `
          <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="CurrentColor">
            <!--!Font Awesome Pro v7.1.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2025 Fonticons, Inc.-->
            <path opacity=".4" d="M16 416C16 345.3 73.3 288 144 288C206.5 288 258.5 332.8 269.8 392L211.9 392C202 364 175.3 344 144 344C104.2 344 72 376.2 72 416C72 455.8 104.2 488 144 488C175.3 488 202 468 211.9 440L269.8 440C258.6 499.2 206.5 544 144 544C73.3 544 16 486.7 16 416zM368 416C368 373.1 389.1 335.1 421.5 311.9L445.7 364.4C432.3 377.5 423.9 395.8 423.9 416C423.9 455.8 456.1 488 495.9 488C535.7 488 567.9 455.8 567.9 416C567.9 376.2 535.7 344 495.9 344C493.7 344 491.4 344.1 489.2 344.3L464.9 291.8C474.8 289.3 485.2 288 495.8 288C566.5 288 623.8 345.3 623.8 416C623.8 486.7 566.5 544 495.8 544C425.1 544 367.8 486.7 367.8 416z"/><path d="M256 104C256 90.7 266.7 80 280 80L352 80C361.4 80 369.9 85.4 373.8 93.9L398.4 147.2L415.5 134.4C421 130.2 427.8 128 434.7 128L488 128C501.3 128 512 138.7 512 152L512 200C512 213.3 501.3 224 488 224L433.8 224L517.8 405.9C523.4 417.9 518.1 432.2 506.1 437.7C494.1 443.2 479.8 438 474.3 426L409.5 285.8C369.7 308.1 344 348.4 344 393.5L344 416C344 429.3 333.3 440 320 440L144 440C130.7 440 120 429.3 120 416C120 402.7 130.7 392 144 392L295.2 392C287.2 315.6 222.6 256 144 256L88 256C74.7 256 64 245.3 64 232C64 218.7 74.7 208 88 208L144 208C189 208 230.6 222.9 264 248L359.1 176.7L336.6 128L280 128C266.7 128 256 117.3 256 104z"/>
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
      "multiple",
      "list"
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
      "toggle-switch",
      "tooltip",
      "tooltip-position",
      "select-on-focus",
      "auto-flex"
    ];
    this.eventAttributes = [
      "onchange",
      "oninput",
      "onblur",
      "onfocus",
      "onkeydown",
      "onkeyup",
      "onkeypress",
      "onclick"
    ];
    const compEl = this.querySelector(".wc-input");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-input", "relative");
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
    if (this.eventAttributes.includes(attrName)) {
      if (this.formElement) {
        if (newValue) {
          const eventHandler = new Function("event", `
            const element = event.target;
            const value = element.value;
            const checked = element.checked;
            with (element) {
              ${newValue}
            }
          `);
          const eventName = attrName.substring(2);
          this.formElement.addEventListener(eventName, eventHandler);
        }
      }
      return;
    }
    if (this.passThruAttributes.includes(attrName)) {
      this.formElement?.setAttribute(attrName, newValue);
    }
    if (this.passThruEmptyAttributes.includes(attrName)) {
      const type = this.getAttribute("type") || "text";
      if (type === "radio") {
        if (attrName === "required") {
          const radios = this.querySelectorAll('input[type="radio"]');
          if (radios.length > 0) {
            radios[0].setAttribute(attrName, "");
          }
        } else {
          const radios = this.querySelectorAll('input[type="radio"]');
          radios.forEach((radio) => {
            radio.setAttribute(attrName, "");
          });
        }
      } else {
        this.formElement?.setAttribute(attrName, "");
        if (attrName === "autofocus" && this.formElement) {
          setTimeout(() => {
            this.formElement?.focus();
          }, 100);
        }
      }
    }
    if (this.ignoreAttributes.includes(attrName)) {
    }
    if (attrName === "tooltip" || attrName === "tooltip-position") {
      this._createTooltipElement();
      return;
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
      const customTypeMap = {
        "currency": "number",
        "auto": "text",
        "auto-dualtone": "text",
        "motorcycle": "text",
        "motorcycle-dualtone": "text"
      };
      const actualType = customTypeMap[newValue] || newValue;
      this.formElement?.setAttribute("type", actualType);
      if (newValue === "checkbox") {
        if (this.hasAttribute("checked")) {
          this.formElement?.setAttribute("checked", "");
          this.formElement?.setAttribute("value", "bool:True");
        } else {
          this.formElement?.removeAttribute("checked");
          this.formElement?.setAttribute("value", "bool:False");
        }
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
    this.eventAttributes.forEach((attr) => {
      const value = this.getAttribute(attr);
      if (value) {
        this._handleAttributeChange(attr, value);
      }
    });
    this._createTooltipElement();
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
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
        const flex = f.getAttribute("data-flex");
        const option = { "key": key, "value": value };
        if (flex) {
          option.flex = flex;
        }
        options.push(option);
      });
      optionList.forEach((f) => f.remove());
      if (options.length == 0) {
        options = this.getAttribute("options") ? JSON.parse(this.getAttribute("options")) : [];
      }
      if (this.hasAttribute("auto-flex") && options.length > 0) {
        const lengths = options.map((opt) => opt.key.length);
        const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
        options.forEach((opt, idx) => {
          if (!opt.flex) {
            const ratio = lengths[idx] / avgLength;
            if (ratio > 1.5) {
              opt.flex = "2";
            } else {
              opt.flex = "1";
            }
          }
        });
      }
      const radioContainer = document.createElement("div");
      radioContainer.classList.add("radio-group");
      options.forEach((option) => {
        const radioLabel = document.createElement("label");
        radioLabel.classList.add("radio-option");
        radioLabel.textContent = option.key;
        if (option.flex) {
          radioLabel.style.flex = option.flex;
        }
        const radioInput = document.createElement("input");
        radioInput.setAttribute("type", "radio");
        radioInput.setAttribute("name", name);
        radioInput.setAttribute("value", option.value);
        if (option.value === this.getAttribute("value")) {
          radioInput.setAttribute("checked", "");
        }
        this.eventAttributes.forEach((attr) => {
          const value = this.getAttribute(attr);
          if (value) {
            const eventName = attr.substring(2);
            const eventHandler = new Function("event", `
              const element = event.target;
              const value = element.value;
              const checked = element.checked;
              with (element) {
                ${value}
              }
            `);
            radioInput.addEventListener(eventName, eventHandler);
          }
        });
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
    } else if (type === "auto-dualtone") {
      this.formElement.setAttribute("type", "text");
      const icon = document.createElement("span");
      icon.classList.add("icon");
      const iconItem = _WcInput.icons.find((f) => f.name === "auto-dualtone");
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === "auto") {
      this.formElement.setAttribute("type", "text");
      const icon = document.createElement("span");
      icon.classList.add("icon");
      const iconItem = _WcInput.icons.find((f) => f.name === "auto");
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === "motorcycle-dualtone") {
      this.formElement.setAttribute("type", "text");
      const icon = document.createElement("span");
      icon.classList.add("icon");
      const iconItem = _WcInput.icons.find((f) => f.name === "motorcycle-dualtone");
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === "motorcycle") {
      this.formElement.setAttribute("type", "text");
      const icon = document.createElement("span");
      icon.classList.add("icon");
      const iconItem = _WcInput.icons.find((f) => f.name === "motorcycle");
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
    } else if (type === "search") {
      const icon = document.createElement("span");
      icon.classList.add("icon");
      const iconItem = _WcInput.icons.find((f) => f.name === "magnifying-glass");
      icon.innerHTML = iconItem.icon;
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === "tel") {
      const icon = document.createElement("span");
      icon.classList.add("icon");
      const iconItem = _WcInput.icons.find((f) => f.name === "tel-fill");
      icon.innerHTML = iconItem.icon;
      this.formElement.setAttribute("_", `on wc:ready
          call wc.MaskHub.phoneMask(event)
          me.setCustomValidity('')
        end`);
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(icon);
    } else if (type === "password") {
      const lockIcon = document.createElement("span");
      lockIcon.classList.add("icon");
      const lockIconItem = _WcInput.icons.find((f) => f.name === "lock");
      lockIcon.innerHTML = lockIconItem.icon;
      const eyeIcon = document.createElement("span");
      eyeIcon.classList.add("icon", "icon-right");
      const eyeIconItem = _WcInput.icons.find((f) => f.name === "eye");
      eyeIcon.innerHTML = eyeIconItem.icon;
      eyeIcon.style.cursor = "pointer";
      eyeIcon.addEventListener("click", () => this._togglePasswordVisibility());
      this.componentElement.appendChild(this.formElement);
      this.componentElement.appendChild(lockIcon);
      this.componentElement.appendChild(eyeIcon);
    } else {
      this.componentElement.appendChild(this.formElement);
    }
    if (this.hasAttribute("select-on-focus") && this.formElement) {
      this.formElement.addEventListener("focus", (e) => {
        setTimeout(() => {
          e.target.select();
        }, 0);
      });
    }
  }
  _createTooltipElement() {
    const existingTooltip = this.querySelector(".wc-tooltip");
    if (existingTooltip) {
      existingTooltip.remove();
    }
    const tooltipText = this.getAttribute("tooltip");
    if (!tooltipText) return;
    const tooltip = document.createElement("div");
    tooltip.className = "wc-tooltip";
    tooltip.textContent = tooltipText;
    const position = this.getAttribute("tooltip-position") || "top";
    tooltip.setAttribute("data-position", position);
    if (this.formElement) {
      this.formElement.style.anchorName = `--anchor-${this.getAttribute("name")}`;
      tooltip.style.positionAnchor = `--anchor-${this.getAttribute("name")}`;
    }
    this.componentElement.appendChild(tooltip);
    this._wireTooltipEvents();
  }
  _wireTooltipEvents() {
    const tooltip = this.querySelector(".wc-tooltip");
    if (!tooltip) return;
    const showTooltip = () => {
      if ("showPopover" in HTMLElement.prototype) {
        if (!tooltip.hasAttribute("popover")) {
          tooltip.setAttribute("popover", "manual");
        }
        try {
          if (tooltip.isConnected && !tooltip.matches(":popover-open")) {
            tooltip.showPopover();
          }
        } catch (e) {
          tooltip.classList.add("show");
        }
      } else {
        tooltip.classList.add("show");
      }
    };
    const hideTooltip = () => {
      if ("hidePopover" in HTMLElement.prototype && tooltip.hasAttribute("popover")) {
        try {
          if (tooltip.matches(":popover-open")) {
            tooltip.hidePopover();
          }
        } catch (e) {
          tooltip.classList.remove("show");
        }
      } else {
        tooltip.classList.remove("show");
      }
    };
    if (this.formElement) {
      this.formElement.addEventListener("mouseenter", showTooltip);
      this.formElement.addEventListener("mouseleave", hideTooltip);
      this.formElement.addEventListener("focus", showTooltip);
      this.formElement.addEventListener("blur", hideTooltip);
    }
    if (this.getAttribute("type") === "radio") {
      const radioGroup = this.querySelector(".radio-group");
      if (radioGroup) {
        radioGroup.addEventListener("mouseenter", showTooltip);
        radioGroup.addEventListener("mouseleave", hideTooltip);
        radioGroup.style.anchorName = `--anchor-${this.getAttribute("name")}`;
        tooltip.style.positionAnchor = `--anchor-${this.getAttribute("name")}`;
      }
    }
  }
  _togglePasswordVisibility() {
    if (!this.formElement) return;
    const currentType = this.formElement.getAttribute("type");
    const icon = this.componentElement.querySelector(".icon-right");
    if (currentType === "password") {
      this.formElement.setAttribute("type", "text");
      const eyeSlashIcon = _WcInput.icons.find((f) => f.name === "eye-slash");
      icon.innerHTML = eyeSlashIcon.icon;
    } else {
      this.formElement.setAttribute("type", "password");
      const eyeIcon = _WcInput.icons.find((f) => f.name === "eye");
      icon.innerHTML = eyeIcon.icon;
    }
  }
  _applyStyle() {
    const style = `
      wc-input {
        display: contents;
      }

      /* Autofill styles to prevent dark background */
      wc-input input:-webkit-autofill,
      wc-input input:-webkit-autofill:hover,
      wc-input input:-webkit-autofill:focus,
      wc-input input:-webkit-autofill:active {
        -webkit-background-clip: text;
        -webkit-text-fill-color: var(--text-1);
        transition: background-color 5000s ease-in-out 0s;
        box-shadow: inset 0 0 20px 20px var(--surface-3);
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
      div.wc-input:has(:required) > label,
      div.wc-textarea:has(:required) label,
      div.wc-select:has(:required) label,
      /*div.wc-code-mirror:has(:required) label*/
      div.wc-code-mirror[required] label
      {
        font-weight: bold;
      }
      div.wc-input:has(:required) > label::after,
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
        margin-top: 0.25rem;
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
        min-height: 34.5px;
      }
      wc-input .radio-group:not(.row):not(.row-1):not(.col):not(.col-1) {
        display: inline-flex;
      }
      wc-input .radio-group:not(.modern) {
        gap: 0.875rem;
      }
      wc-input .radio-group .radio-option {
        display: inline-flex;
        flex: 1 1 0%;
        align-items: center;
        justify-content: center;
        position: relative;
        outline: none;
        text-align: center;
      }
      wc-input .radio-group:not(.modern) .radio-option {
        padding-left: 12px;
        align-self: center;
        justify-content: left;
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
        border-right: 1px solid var(--radio-checked-bg);
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
        background-color: var(--radio-checked-bg);
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



      wc-input[type="auto"] input {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input[type="auto"] input + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }
      wc-input[type="auto-dualtone"] input {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input[type="auto-dualtone"] input + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }

      wc-input[type="motorcycle"] input {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input[type="motorcycle"] input + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }
      wc-input[type="motorcycle-dualtone"] input {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input[type="motorcycle-dualtone"] input + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }


      wc-input input[type="email"] {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input input[type="email"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }

      wc-input input[type="search"] {
        padding-left: 25px;
        min-width: 120px;
      }
      wc-input input[type="search"] + .icon {
        position: absolute;
        left: 5px;
      }
      wc-input label + input[type="search"] + .icon {
        top: 25px;
      }
      wc-input input[type="search"] + .icon {
        top: 10px;
      }

      wc-input input[type="tel"] {
        padding-left: 25px;
        min-width: 120px;
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

      wc-input input[type="password"] {
        padding-left: 25px;
        padding-right: 30px;
      }
      wc-input input[type="password"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }
      wc-input input[type="password"] ~ .icon-right {
        position: absolute;
        top: 25px;
        right: 8px;
      }
      
      /* When password is toggled to text, maintain the padding and icon positions */
      wc-input:has(.icon-right) input[type="text"] {
        padding-left: 25px;
        padding-right: 30px;
      }
      wc-input:has(.icon-right) input[type="text"] + .icon {
        position: absolute;
        top: 25px;
        left: 5px;
      }
      wc-input input[type="text"] ~ .icon-right {
        position: absolute;
        top: 25px;
        right: 8px;
      }






    /* Tooltip styles with Anchor Positioning API */
      wc-input .wc-tooltip {
        position: absolute;
        background-color: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 0.75rem;
        white-space: normal;
        word-wrap: break-word;
        pointer-events: none;
        z-index: 10000;
        max-width: 250px;
        margin: 0;
        border: 0;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.2s, visibility 0.2s;
      }

      /* Show states */
      wc-input .wc-tooltip.show,
      wc-input .wc-tooltip:popover-open {
        opacity: 1;
        visibility: visible;
      }

      /* Popover specific resets */
      wc-input .wc-tooltip[popover] {
        inset: unset;
      }

      /* Anchor positioning when supported */
      @supports (anchor-name: --test) {
        wc-input .wc-tooltip {
          position-try-options: flip-block, flip-inline, flip-block flip-inline;
        }

        wc-input .wc-tooltip.show {
          opacity: 1;
          visibility: visible;
        }
      }

      /* Popover API styles */
      wc-input .wc-tooltip[popover] {
        margin: 0;
        border: 0;
        padding: 6px 12px;
        overflow: visible;
      }

      wc-input .wc-tooltip:popover-open {
        opacity: 1;
        visibility: visible;
      }

      /* Position variations using anchor positioning */
      wc-input .wc-tooltip[data-position="top"] {
        bottom: anchor(top);
        left: anchor(center);
        translate: -50% -8px;

        /* Fallback for position-try */
        position-try-fallbacks:
          bottom-then-top,
          snap-to-edge;
      }

      wc-input .wc-tooltip[data-position="bottom"] {
        top: anchor(bottom);
        left: anchor(center);
        translate: -50% 8px;

        position-try-fallbacks:
          top-then-bottom,
          snap-to-edge;
      }

      wc-input .wc-tooltip[data-position="left"] {
        right: anchor(left);
        top: anchor(center);
        translate: -8px -50%;

        position-try-fallbacks:
          right-then-left,
          snap-to-edge;
      }

      wc-input .wc-tooltip[data-position="right"] {
        left: anchor(right);
        top: anchor(center);
        translate: 8px -50%;

        position-try-fallbacks:
          left-then-right,
          snap-to-edge;
      }

      /* Try to keep tooltip in viewport */
      @position-try bottom-then-top {
        bottom: auto;
        top: anchor(bottom);
        translate: -50% 8px;
      }

      @position-try top-then-bottom {
        top: auto;
        bottom: anchor(top);
        translate: -50% -8px;
      }

      @position-try right-then-left {
        right: auto;
        left: anchor(right);
        translate: 8px -50%;
      }

      @position-try left-then-right {
        left: auto;
        right: anchor(left);
        translate: -8px -50%;
      }

      @position-try snap-to-edge {
        position: absolute;
        inset: auto;
        top: 0;
        left: 0;
      }

      /* Arrow styles - hidden when position changes */
      wc-input .wc-tooltip::before {
        content: '';
        position: absolute;
        width: 0;
        height: 0;
        border: 6px solid transparent;
      }

      wc-input .wc-tooltip[data-position="top"]::before {
        border-top-color: rgba(0, 0, 0, 0.9);
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
      }

      wc-input .wc-tooltip[data-position="bottom"]::before {
        border-bottom-color: rgba(0, 0, 0, 0.9);
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
      }

      wc-input .wc-tooltip[data-position="left"]::before {
        border-left-color: rgba(0, 0, 0, 0.9);
        right: -12px;
        top: 50%;
        transform: translateY(-50%);
      }

      wc-input .wc-tooltip[data-position="right"]::before {
        border-right-color: rgba(0, 0, 0, 0.9);
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
      }

      /* Fallback positioning for older browsers */
      @supports not (anchor-name: --test) {
        wc-input .wc-tooltip[data-position="top"] {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-bottom: 8px;
        }

        wc-input .wc-tooltip[data-position="bottom"] {
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          margin-top: 8px;
        }

        wc-input .wc-tooltip[data-position="left"] {
          position: absolute;
          right: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-right: 8px;
        }

        wc-input .wc-tooltip[data-position="right"] {
          position: absolute;
          left: 100%;
          top: 50%;
          transform: translateY(-50%);
          margin-left: 8px;
        }
      }

    `.trim();
    this.loadStyle("wc-input-style", style);
  }
  _unWireEvents() {
    super._unWireEvents();
    const tooltip = this.querySelector(".wc-tooltip");
    if (tooltip) {
      if (tooltip.popover && tooltip.matches(":popover-open")) {
        tooltip.hidePopover();
      }
      tooltip.remove();
    }
    if (this.formElement) {
      this.formElement.style.anchorName = "";
    }
    const radioGroup = this.querySelector(".radio-group");
    if (radioGroup) {
      radioGroup.style.anchorName = "";
    }
  }
};
customElements.define("wc-input", WcInput);

// src/js/components/wc-select.js
var WcSelect = class extends WcBaseFormComponent {
  static get observedAttributes() {
    return [
      "name",
      "id",
      "class",
      "multiple",
      "value",
      "items",
      "url",
      "display-member",
      "value-member",
      "lbl-label",
      "disabled",
      "required",
      "autofocus",
      "autocomplete",
      "elt-class",
      "onchange",
      "oninput",
      "onblur",
      "onfocus",
      "onkeydown",
      "onkeyup",
      "onkeypress",
      "onclick",
      "tooltip",
      "tooltip-position"
    ];
  }
  constructor() {
    super();
    this.selectedOptions = [];
    this.mode = this.getAttribute("mode") || "chip";
    if (!this.hasAttribute("mode")) {
      this.mode = "standard";
    }
    this.highlightedIndex = -1;
    this.eventAttributes = [
      "onchange",
      "oninput",
      "onblur",
      "onfocus",
      "onkeydown",
      "onkeyup",
      "onkeypress",
      "onclick"
    ];
    const compEl = this.querySelector(".wc-select");
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement("div");
      this.componentElement.classList.add("wc-select", "relative");
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
    if (attrName === "tooltip" || attrName === "tooltip-position") {
      this._createTooltipElement();
      return;
    }
    if (this.eventAttributes.includes(attrName)) {
      if (this.formElement && newValue) {
        const eventName = attrName.substring(2);
        if (!this._eventHandlers) {
          this._eventHandlers = {};
        }
        if (this._eventHandlers[eventName]) {
          this.formElement.removeEventListener(eventName, this._eventHandlers[eventName]);
        }
        const eventHandler = new Function("event", `
          const element = event.target;
          const value = element.value;
          with (element) {
            ${newValue}
          }
        `);
        this._eventHandlers[eventName] = eventHandler;
        this.formElement.addEventListener(eventName, eventHandler);
      }
      return;
    }
    if (this.eventAttributes.includes(attrName)) {
      if (this.formElement && newValue) {
        const eventHandler = new Function("event", `
          const element = event.target;
          const value = element.value;
          with (element) {
            ${newValue}
          }
        `);
        const eventName = attrName.substring(2);
        this.formElement.addEventListener(eventName, eventHandler);
      }
      return;
    }
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
              if (!this.selectedOptions.includes(item[valueMember])) {
                this.addChip(item[valueMember], item[displayMember]);
              }
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
      if (this.mode === "chip") {
        const options = this.querySelectorAll("option[selected]");
        options.forEach((opt) => {
          if (!this.selectedOptions.includes(opt.value)) {
            this.addChip(opt.value, opt.textContent);
          }
        });
      }
    }
    this.eventAttributes.forEach((attr) => {
      const value = this.getAttribute(attr);
      if (value) {
        this._handleAttributeChange(attr, value);
      }
    });
    this._createTooltipElement();
    if (typeof htmx !== "undefined") {
      htmx.process(this);
    }
  }
  _createInnerElement() {
    const labelText = this.getAttribute("lbl-label") || "";
    const name = this.getAttribute("name");
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
    const autocomplete = this.getAttribute("autocomplete");
    if (autocomplete) {
      select.setAttribute("autocomplete", autocomplete);
    }
    const children = Array.from(this.children);
    children.forEach((child) => {
      if (child.tagName === "OPTION") {
        select.appendChild(child.cloneNode(true));
      } else if (child.tagName === "OPTGROUP") {
        const optgroup = child.cloneNode(false);
        const groupOptions = child.querySelectorAll("option");
        groupOptions.forEach((opt) => {
          optgroup.appendChild(opt.cloneNode(true));
        });
        select.appendChild(optgroup);
      }
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
      const autocomplete2 = this.getAttribute("autocomplete");
      if (autocomplete2) {
        ipt.setAttribute("autocomplete", autocomplete2);
      }
      this.eventAttributes.forEach((attr) => {
        const value = this.getAttribute(attr);
        if (value && attr !== "onchange") {
          const eventName = attr.substring(2);
          const eventHandler = new Function("event", `
            const element = event.target;
            const value = element.value;
            with (element) {
              ${value}
            }
          `);
          ipt.addEventListener(eventName, eventHandler);
        }
      });
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
      let optionsHTML = "";
      children.forEach((child) => {
        if (child.tagName === "OPTION") {
          optionsHTML += `<div class="option" data-value="${child.value}">${child.textContent}</div>`;
        } else if (child.tagName === "OPTGROUP") {
          const label = child.getAttribute("label") || "";
          optionsHTML += `<div class="optgroup-label">${label}</div>`;
          const groupOptions = child.querySelectorAll("option");
          groupOptions.forEach((opt) => {
            optionsHTML += `<div class="option optgroup-option" data-value="${opt.value}">${opt.textContent}</div>`;
          });
        }
      });
      optionsContainer.innerHTML = optionsHTML;
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
    const isChipMode = this.getAttribute("mode") === "chip";
    this.formElement.innerHTML = "";
    let optionsHTML = "";
    this._items.forEach((item) => {
      if (item.optgroup && Array.isArray(item.options)) {
        const optgroup = document.createElement("optgroup");
        optgroup.label = item.label || item.optgroup;
        if (isChipMode) {
          optionsHTML += `<div class="optgroup-label">${optgroup.label}</div>`;
        }
        item.options.forEach((opt) => {
          const option = document.createElement("option");
          if (typeof opt === "object") {
            option.value = opt[valueMember];
            option.textContent = opt[displayMember];
          } else {
            option.value = opt;
            option.textContent = opt;
          }
          if (option.value == value) {
            option.selected = true;
          }
          optgroup.appendChild(option);
          if (isChipMode) {
            optionsHTML += `<div class="option optgroup-option" data-value="${option.value}">${option.textContent}</div>`;
          }
        });
        this.formElement.appendChild(optgroup);
      } else {
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
        if (isChipMode) {
          optionsHTML += `<div class="option" data-value="${opt.value}">${opt.textContent}</div>`;
        }
      }
    });
    const optionsContainer = this.querySelector(".options-container");
    if (optionsContainer && isChipMode) {
      optionsContainer.innerHTML = optionsHTML;
    }
  }
  _createTooltipElement() {
    const existingTooltip = this.querySelector(".wc-tooltip");
    if (existingTooltip) {
      existingTooltip.remove();
    }
    const tooltipText = this.getAttribute("tooltip");
    if (!tooltipText) return;
    const tooltip = document.createElement("div");
    tooltip.className = "wc-tooltip";
    tooltip.textContent = tooltipText;
    const position = this.getAttribute("tooltip-position") || "top";
    tooltip.setAttribute("data-position", position);
    const anchorName = `--anchor-${this.getAttribute("name") || Date.now()}`;
    if (this.formElement) {
      this.formElement.style.anchorName = anchorName;
      tooltip.style.positionAnchor = anchorName;
    }
    this.componentElement.appendChild(tooltip);
    this._wireTooltipEvents();
  }
  _wireTooltipEvents() {
    const tooltip = this.querySelector(".wc-tooltip");
    if (!tooltip) return;
    const showTooltip = () => {
      if ("showPopover" in HTMLElement.prototype) {
        if (!tooltip.hasAttribute("popover")) {
          tooltip.setAttribute("popover", "manual");
        }
        try {
          if (tooltip.isConnected && !tooltip.matches(":popover-open")) {
            tooltip.showPopover();
          }
        } catch (e) {
          tooltip.classList.add("show");
        }
      } else {
        tooltip.classList.add("show");
      }
    };
    const hideTooltip = () => {
      if ("hidePopover" in HTMLElement.prototype && tooltip.hasAttribute("popover")) {
        try {
          if (tooltip.matches(":popover-open")) {
            tooltip.hidePopover();
          }
        } catch (e) {
          tooltip.classList.remove("show");
        }
      } else {
        tooltip.classList.remove("show");
      }
    };
    if (this.formElement) {
      this.formElement.addEventListener("mouseenter", showTooltip);
      this.formElement.addEventListener("mouseleave", hideTooltip);
      this.formElement.addEventListener("focus", showTooltip);
      this.formElement.addEventListener("blur", hideTooltip);
    }
    if (this.mode === "chip") {
      const dropdownInput = this.querySelector("#dropdownInput");
      if (dropdownInput) {
        dropdownInput.addEventListener("mouseenter", showTooltip);
        dropdownInput.addEventListener("mouseleave", hideTooltip);
        dropdownInput.addEventListener("focus", showTooltip);
        dropdownInput.addEventListener("blur", hideTooltip);
      }
    }
  }
  _applyStyle() {
    const style = `
      wc-select {
        display: contents;
      }
      wc-select > option,
      wc-select > optgroup {
        display: none;
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
      wc-select .optgroup-label {
        padding: 8px 5px 5px 5px;
        font-weight: bold;
        font-size: 0.875rem;
        color: var(--component-alt-color);
        background-color: var(--accent-bg-color);
        cursor: default;
        border-bottom: 1px solid var(--border-color);
      }
      wc-select .optgroup-option {
        padding-left: 20px;
      }
      wc-select .optgroup-label:not(:first-child) {
        margin-top: 4px;
      }
      wc-select select { 
        display: block; 
        width: 100%; 
        padding: 0.45rem 0.75rem 0.45rem 0.25rem;  
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



      

      /* Tooltip styles with Anchor Positioning API */
        wc-select .wc-tooltip {
          position: absolute;
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 0.75rem;
          white-space: normal;
          word-wrap: break-word;
          pointer-events: none;
          z-index: 10000;
          max-width: 250px;
          margin: 0;
          border: 0;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
        }

        /* Show states */
        wc-select .wc-tooltip.show,
        wc-select .wc-tooltip:popover-open {
          opacity: 1;
          visibility: visible;
        }

        /* Popover specific resets */
        wc-select .wc-tooltip[popover] {
          inset: unset;
        }

        /* Anchor positioning when supported */
        @supports (anchor-name: --test) {
          wc-select .wc-tooltip {
            position-try-options: flip-block, flip-inline, flip-block flip-inline;
          }

          wc-select .wc-tooltip.show {
            opacity: 1;
            visibility: visible;
          }
        }

        /* Popover API styles */
        wc-select .wc-tooltip[popover] {
          margin: 0;
          border: 0;
          padding: 6px 12px;
          overflow: visible;
        }

        wc-select .wc-tooltip:popover-open {
          opacity: 1;
          visibility: visible;
        }

        /* Position variations using anchor positioning */
        wc-select .wc-tooltip[data-position="top"] {
          bottom: anchor(top);
          left: anchor(center);
          translate: -50% -8px;

          /* Fallback for position-try */
          position-try-fallbacks:
            bottom-then-top,
            snap-to-edge;
        }

        wc-select .wc-tooltip[data-position="bottom"] {
          top: anchor(bottom);
          left: anchor(center);
          translate: -50% 8px;

          position-try-fallbacks:
            top-then-bottom,
            snap-to-edge;
        }

        wc-select .wc-tooltip[data-position="left"] {
          right: anchor(left);
          top: anchor(center);
          translate: -8px -50%;

          position-try-fallbacks:
            right-then-left,
            snap-to-edge;
        }

        wc-select .wc-tooltip[data-position="right"] {
          left: anchor(right);
          top: anchor(center);
          translate: 8px -50%;

          position-try-fallbacks:
            left-then-right,
            snap-to-edge;
        }

        /* Try to keep tooltip in viewport */
        @position-try bottom-then-top {
          bottom: auto;
          top: anchor(bottom);
          translate: -50% 8px;
        }

        @position-try top-then-bottom {
          top: auto;
          bottom: anchor(top);
          translate: -50% -8px;
        }

        @position-try right-then-left {
          right: auto;
          left: anchor(right);
          translate: 8px -50%;
        }

        @position-try left-then-right {
          left: auto;
          right: anchor(left);
          translate: -8px -50%;
        }

        @position-try snap-to-edge {
          position: absolute;
          inset: auto;
          top: 0;
          left: 0;
        }

        /* Arrow styles - hidden when position changes */
        wc-select .wc-tooltip::before {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border: 6px solid transparent;
        }

        wc-select .wc-tooltip[data-position="top"]::before {
          border-top-color: rgba(0, 0, 0, 0.9);
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
        }

        wc-select .wc-tooltip[data-position="bottom"]::before {
          border-bottom-color: rgba(0, 0, 0, 0.9);
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
        }

        wc-select .wc-tooltip[data-position="left"]::before {
          border-left-color: rgba(0, 0, 0, 0.9);
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
        }

        wc-select .wc-tooltip[data-position="right"]::before {
          border-right-color: rgba(0, 0, 0, 0.9);
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
        }

        /* Fallback positioning for older browsers */
        @supports not (anchor-name: --test) {
          wc-select .wc-tooltip[data-position="top"] {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 8px;
          }

          wc-select .wc-tooltip[data-position="bottom"] {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 8px;
          }

          wc-select .wc-tooltip[data-position="left"] {
            position: absolute;
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 8px;
          }

          wc-select .wc-tooltip[data-position="right"] {
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 8px;
          }
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
    const options = Array.from(optionsContainer.querySelectorAll(".option")).filter(
      (option) => option.style.display !== "none" && !option.classList.contains("optgroup-label")
    );
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
    const optgroupLabels = optionsContainer.querySelectorAll(".optgroup-label");
    options.forEach((option) => {
      if (option.textContent.toLowerCase().includes(query.toLowerCase()) && !this.selectedOptions.includes(option.getAttribute("data-value"))) {
        option.style.display = "block";
      } else {
        option.style.display = "none";
      }
    });
    optgroupLabels.forEach((label) => {
      let hasVisibleOption = false;
      let sibling = label.nextElementSibling;
      while (sibling && sibling.classList.contains("optgroup-option")) {
        if (sibling.style.display !== "none") {
          hasVisibleOption = true;
          break;
        }
        sibling = sibling.nextElementSibling;
      }
      label.style.display = hasVisibleOption ? "block" : "none";
    });
    this.highlightedIndex = -1;
    this.updateHighlight([]);
  }
  addChip(value, label) {
    const allowDynamic = this.hasAttribute("allow-dynamic");
    if (this.selectedOptions.includes(value)) return;
    this.selectedOptions.push(value);
    setTimeout(() => {
      if (allowDynamic) {
        const selectElement = this.querySelector("select");
        let exists = Array.from(selectElement.options).some((option) => option.value === value);
        if (!exists) {
          const newOption = new Option(label, value);
          selectElement.add(newOption);
        }
      }
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
    const allowDynamic = this.hasAttribute("allow-dynamic");
    const existingDynamicOptions = [];
    if (allowDynamic) {
      Array.from(selectElement.options).forEach((opt) => {
        const isOriginal = Array.from(this.children).some((child) => {
          if (child.tagName === "OPTION") {
            return child.value === opt.value;
          } else if (child.tagName === "OPTGROUP") {
            return Array.from(child.querySelectorAll("option")).some((groupOpt) => groupOpt.value === opt.value);
          }
          return false;
        });
        if (!isOriginal) {
          existingDynamicOptions.push({ value: opt.value, label: opt.textContent });
        }
      });
    }
    selectElement.innerHTML = "";
    const children = Array.from(this.children);
    children.forEach((child) => {
      if (child.tagName === "OPTION") {
        const opt = child.cloneNode(true);
        opt.selected = this.selectedOptions.includes(opt.value);
        selectElement.appendChild(opt);
      } else if (child.tagName === "OPTGROUP") {
        const optgroup = child.cloneNode(false);
        const groupOptions = child.querySelectorAll("option");
        groupOptions.forEach((opt) => {
          const option = opt.cloneNode(true);
          option.selected = this.selectedOptions.includes(option.value);
          optgroup.appendChild(option);
        });
        selectElement.appendChild(optgroup);
      }
    });
    if (allowDynamic) {
      existingDynamicOptions.forEach(({ value, label }) => {
        const newOption = new Option(label, value);
        newOption.selected = this.selectedOptions.includes(value);
        selectElement.add(newOption);
      });
    }
  }
  updateDropdownOptions() {
    const optionsContainer = this.querySelector("#optionsContainer");
    if (optionsContainer) {
      Array.from(optionsContainer.querySelectorAll(".option")).forEach((option) => {
        option.style.display = this.selectedOptions.includes(option.getAttribute("data-value")) ? "none" : "block";
      });
    }
  }
  _unWireEvents() {
    super._unWireEvents();
    const tooltip = this.querySelector(".wc-tooltip");
    if (tooltip) {
      if (tooltip.popover && tooltip.matches(":popover-open")) {
        tooltip.hidePopover();
      }
      tooltip.remove();
    }
    if (this.formElement) {
      this.formElement.style.anchorName = "";
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
  dependencyManager as DependencyManager,
  WcIconConfig,
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
  iconRegistry,
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
