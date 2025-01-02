export function isCustomElement(element) {
  return element.tagName.includes('-');
}

export function generateUniqueId() {
  return 'xxxx-xxxx-xxxx-xxxx'.replace(/[x]/g, () => {
    return (Math.random() * 16 | 0).toString(16);
  });
}

export function loadCSS(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[rel="stylesheet"][href="${url}"]`)) {
      resolve();
      return;
    }

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.onload = () => resolve();
    link.onerror = (error) => reject(error);
    document.head.appendChild(link);

    // Polling mechanism to check if CSS is applied
    const checkCSSLoaded = setInterval(() => {
      if (getComputedStyle(document.body).getPropertyValue('display')) {
        clearInterval(checkCSSLoaded);
        resolve();
      }
    }, 50);
  });
}

export function loadScript(url) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${url}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      resolve();
      return;
    };
    script.onerror = (error) => {
      reject(error);
      return;
    }
    document.head.appendChild(script);
  });
}

export function loadLibrary(url, globalObjectName) {
  return new Promise((resolve, reject) => {
    // If the script is already loaded, resolve immediately
    if (document.querySelector(`script[src="${url}"]`)) {
      if (globalObjectName && window[globalObjectName]) {
        resolve();
      } else {
        // Poll to check if the global object becomes available
        const checkGlobalObject = setInterval(() => {
          if (window[globalObjectName]) {
            clearInterval(checkGlobalObject);
            resolve();
          }
        }, 50);
      }
      return;
    }

    const script = document.createElement('script');
    script.src = url;
    script.onload = () => {
      // Poll to check if the global object becomes available
      if (globalObjectName && !window[globalObjectName]) {
        const checkGlobalObject = setInterval(() => {
          if (window[globalObjectName]) {
            clearInterval(checkGlobalObject);
            resolve();
          }
        }, 50); // Check every 50ms
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

export function loadStyle(id, content) {
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.textContent = content.trim();
    document.head.appendChild(style);
  }
}

export function locator(root, selector) {
  // Check if the root itself matches the selector
  if (root.matches && root.matches(selector)) {
    return root;
  }

  // Use standard querySelector for normal DOM elements
  const element = root.querySelector(selector);
  if (element) {
    return element;
  }

  // Traverse shadow DOMs, if present
  const shadowHosts = root.querySelectorAll('*');
  for (const shadowHost of shadowHosts) {
    // Check if the element has a shadow root
    if (shadowHost.shadowRoot) {
      // Recursively search in the shadow DOM
      const foundInShadow = this.locator(shadowHost.shadowRoot, selector);
      if (foundInShadow) {
        return foundInShadow;
      }
    }
  }
}

export function locatorAll(root, selector) {
  let elements = [];
  // Check if the root itself matches the selector
  if (root.matches && root.matches(selector)) {
    elements.push(root);
  }
  // Add all elements from the light DOM that match the selector
  elements.push(...root.querySelectorAll(selector));
  // Traverse shadow DOMs, if present
  const shadowHosts = root.querySelectorAll('*');
  for (const shadowHost of shadowHosts) {
    if (shadowHost.shadowRoot) {
      // Recursively search in the shadow DOM
      elements.push(...this.locatorAll(shadowHost.shadowRoot, selector));
    }
  }
  return elements;
}

/*
  Name: waitForSelectorPolling
  Desc:
  Usage:
    const selector = "#table-main";
    await WaveHelpers.waitForSelectorPolling(selectors, 1000);
    ... now you can proceed...
*/
export function waitForSelectorPolling(selector, timeout = 3000, interval = 100) {
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

/*
  Name: checkResources
  Desc:
  Usage:
      const link = "https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css";
      const script = "https://cdn.jsdelivr.net/npm/simple-datatables@latest";
      if (WaveHelpers.checkResources(link, script)) {
        ...
      }
*/
export function checkResources(link, script) {
  let result = false;
  result = wc.linksLoaded[link] && wc.scriptsLoaded[script];
  return result;
}

/*
  Name: waitForResourcePolling
  Desc:
  Usage:
      const link = "https://cdn.jsdelivr.net/npm/simple-datatables@latest/dist/style.css";
      const script = "https://cdn.jsdelivr.net/npm/simple-datatables@latest";
      await WaveHelpers.waitForResourcePolling(link, script);
      ... now you can proceed...
*/
export function waitForResourcePolling(scriptDependencies = [], linkDependencies = [], timeout = 5000, interval = 100) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Ensure dependencies are arrays
    const scriptList = Array.isArray(scriptDependencies) ? scriptDependencies : [scriptDependencies];
    const linkList = Array.isArray(linkDependencies) ? linkDependencies : [linkDependencies];

    // Check if all dependencies are available
    const checkAvailability = () => {
      const scriptsAvailable = scriptList.length === 0 || scriptList.every(dep => window.wc?.scriptsLoaded?.[dep] === true);
      const linksAvailable = linkList.length === 0 || linkList.every(dep => window.wc?.linksLoaded?.[dep] === true);

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

/*
  Name: waitForSelectorsPolling
  Desc:
  Usage:
    const selectors = ["#table-main", ".page-content"];
    await WaveHelpers.waitForSelectorsPolling(selectors, 3000);
    ... now you can proceed...
*/
export function waitForSelectorsPolling(selectors = [], timeout = 3000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Ensure selectors is an array
    const selectorList = Array.isArray(selectors) ? selectors : [selectors];

    // Function to check if all selectors are present in the DOM
    const checkAvailability = () => {
      const allAvailable = selectorList.every(selector => document.querySelector(selector) !== null);

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


/*
  Name: sleep
  Desc:
  Usage:
    ...
    await sleep(100); // Wait for 100 milliseconds
    ...
*/
export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function hide(selector) {
  const el = document.querySelector(selector);
  el.classList.add('hidden');
}

export function show(selector) {
  const el = document.querySelector(selector);
  el.classList.remove('hidden');
}

export function hideAndShow(hideSelector, showSelector) {
  hide(hideSelector);
  show(showSelector);
}

export async function waitForThenHideAndShow(hideSelector, showSelector, timeout=3000, delay=1000) {
  await waitForSelectorsPolling([hideSelector, showSelector], timeout);
  await sleep(delay);
  hideAndShow(hideSelector, showSelector);
}