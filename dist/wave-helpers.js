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
    checkResources: () => checkResources,
    enableSortable: () => enableSortable,
    fetchApi: () => fetchApi,
    generateUniqueId: () => generateUniqueId,
    hide: () => hide,
    hideAndShow: () => hideAndShow,
    isCustomElement: () => isCustomElement,
    loadCSS: () => loadCSS,
    loadLibrary: () => loadLibrary,
    loadScript: () => loadScript,
    loadStyle: () => loadStyle,
    locator: () => locator,
    locatorAll: () => locatorAll,
    show: () => show,
    sleep: () => sleep,
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
        new Sortable(target, options);
      }
    }
  }
  return __toCommonJS(helper_function_exports);
})();
