var WaveHelpers = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // src/js/components/helper-function.js
  var helper_function_exports = {};
  __export(helper_function_exports, {
    applyRule: () => applyRule,
    checkResources: () => checkResources,
    countElements: () => countElements,
    disableSortable: () => disableSortable,
    enableSortable: () => enableSortable,
    extractRules: () => extractRules,
    extractSrcElements: () => extractSrcElements,
    fetchApi: () => fetchApi,
    generateUniqueId: () => generateUniqueId,
    getSourcePropertyValue: () => getSourcePropertyValue,
    hide: () => hide,
    hideAndShow: () => hideAndShow,
    initRules: () => initRules,
    isCustomElement: () => isCustomElement,
    loadCSS: () => loadCSS,
    loadLibrary: () => loadLibrary,
    loadScript: () => loadScript,
    loadStyle: () => loadStyle,
    loadStylesheet: () => loadStylesheet,
    locator: () => locator,
    locatorAll: () => locatorAll,
    processJSONField: () => processJSONField,
    show: () => show,
    sleep: () => sleep,
    testSchema: () => testSchema,
    toggleIndicator: () => toggleIndicator,
    updateJetTemplate: () => updateJetTemplate,
    waitForPropertyPolling: () => waitForPropertyPolling,
    waitForResourcePolling: () => waitForResourcePolling,
    waitForSelectorPolling: () => waitForSelectorPolling,
    waitForSelectorsPolling: () => waitForSelectorsPolling,
    waitForThenHideAndShow: () => waitForThenHideAndShow
  });
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
                    const input = document.createElement("input");
                    input.type = "hidden";
                    input.name = `${fieldName}[${index}]`;
                    input.value = item;
                    input.setAttribute("data-json-field", "true");
                    form.appendChild(input);
                    console.log("-->Appending array primitive:", input);
                  }
                });
              } else {
                const input = document.createElement("input");
                input.type = "hidden";
                input.name = fieldName;
                input.value = value;
                input.setAttribute("data-json-field", "true");
                form.appendChild(input);
                console.log("-->Appending primitive:", input);
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
        "data-id": element["data-id"],
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
  return __toCommonJS(helper_function_exports);
})();
