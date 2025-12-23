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
    script.onload = resolve;
    script.onerror = reject;
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
  return new Promise((resolve, reject) => {
    if (document.querySelector(`style#${id}`)) {
      resolve();
      return;
    }
    const style = document.createElement('style');
    style.id = id;
    style.textContent = content.trim();
    style.onload = resolve;
    style.onerror = reject;
    document.head.appendChild(style);
  });
}

export function loadStylesheet(href) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`link[href="${href}"]`)) {
      resolve();
      return;
    }
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.onload = resolve;
    link.onerror = reject;
    document.head.appendChild(link);
  });
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
  Name: waitForPropertyPolling
  Desc:
  Usage:
    const el = document.querySelector("wc-tab");
    await WaveHelpers.waitForPropertyPolling(el, "editor", 3000);
    ... now you can proceed...
*/
export function waitForPropertyPolling(el, propertyName, timeout = 3000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Function to check if property is present on the element
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
  if (!el) return;

  // Skip if already marked as hidden by this function
  if (el.dataset.hiddenByFunction === 'true') return;

  // Find responsive display classes (sm:flex, md:block, lg:grid, etc.)
  const responsiveDisplayClasses = Array.from(el.classList).filter(cls =>
    /^(sm|md|lg|xl|2xl):(flex|block|inline|inline-block|inline-flex|grid)$/.test(cls)
  );

  if (responsiveDisplayClasses.length > 0) {
    // Has responsive display classes - ONLY override with responsive hidden classes
    // Store original responsive display classes in data attribute
    el.dataset.originalResponsiveDisplay = responsiveDisplayClasses.join(' ');

    // Replace responsive display classes with responsive hidden classes
    responsiveDisplayClasses.forEach(cls => {
      const prefix = cls.split(':')[0]; // sm, md, lg, xl, 2xl
      el.classList.remove(cls);
      el.classList.add(`${prefix}:hidden`);
    });

    // Mark as hidden by function (DO NOT add base .hidden class)
    el.dataset.hiddenByFunction = 'true';
  } else {
    // No responsive classes - ONLY add base hidden
    el.classList.add('hidden');
    el.dataset.hiddenByFunction = 'true';
  }
}

export function show(selector) {
  const el = document.querySelector(selector);
  if (!el) return;

  // // Only proceed if this was hidden by the hide() function
  // if (el.dataset.hiddenByFunction !== 'true') return;

  // Find responsive hidden classes
  const responsiveHiddenClasses = Array.from(el.classList).filter(cls =>
    /^(sm|md|lg|xl|2xl):hidden$/.test(cls)
  );

  if (responsiveHiddenClasses.length > 0) {
    // Has responsive hidden classes - ONLY restore responsive display classes
    // Remove responsive hidden classes
    responsiveHiddenClasses.forEach(cls => {
      el.classList.remove(cls);
    });

    // Restore original responsive display classes if stored
    if (el.dataset.originalResponsiveDisplay) {
      const originalClasses = el.dataset.originalResponsiveDisplay.split(' ');
      originalClasses.forEach(cls => {
        el.classList.add(cls);
      });
      delete el.dataset.originalResponsiveDisplay;
    }

    // DO NOT remove base .hidden class when using responsive classes
  } else {
    // No responsive classes - ONLY remove base hidden
    el.classList.remove('hidden');
  }

  // Clear the flag
  delete el.dataset.hiddenByFunction;
}

export function hideAndShow(hideSelector, showSelector) {
  hide(hideSelector);
  show(showSelector);
}

export async function waitForThenHideAndShow(hideSelector, showSelector, timeout=3000, delay=500) {
  await waitForSelectorsPolling([hideSelector, showSelector], timeout);
  await sleep(delay);
  hideAndShow(hideSelector, showSelector);
}

export function fetchApi(url, succesCallback, errorCallback) {
  try {
    fetch(url, {
      method: 'GET'
    })
    .then(response => response.text())
    .then(text => {
      if (succesCallback) {
        succesCallback(text);
      }
    });
  } catch(ex) {
    if (errorCallback) {
      errorCallback(ex);
    }
  }
}

export function enableSortable(target) {
  if (target) {
    let options = {
      animation: 150,
      draggable: '.preview-draggable',
      // handle: '.preview-draggable::before',
      onEnd: function (evt) {
        // console.log({
        //   'event': 'onEnd',
        //   'this': this,
        //   'item': evt.item,
        //   'from': evt.from,
        //   'to': evt.to,
        //   'oldIndex': evt.oldIndex,
        //   'newIndex': evt.newIndex
        // });
        const custom = {
          e: evt,
          event: 'onEnd',
          item: evt.item,
          from: evt.from,
          to: evt.to,
          oldIndex: evt.oldIndex,
          newIndex: evt.newIndex
        };
        wc?.EventHub?.broadcast('sortable:on-end', '', '', custom);
      }
    };
    if (typeof Sortable !== 'undefined') {
      const sortable = new Sortable(target, options);
      wc.EventHub.events[target] = sortable;
    }
  }
}
export function disableSortable(target) {
  wc?.EventHub?.events[target].destroy();
}
export function updateJetTemplate(id, oldIndex, newIndex, cm) {
  let offset = 2;
  oldIndex = oldIndex - offset;
  newIndex = newIndex - offset;
  let doc = cm.editor;
  let template = doc.getValue(); // Get current Jet template content

  // Extract the <wc-form> section using a regex
  let formRegex = new RegExp(`<wc-form[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/wc-form>`);
  let match = template.match(formRegex);

  if (match) {
    let formContent = match[1]; // Extract form inner content

    // Match all divs with the class "draggable" including their inner content
    // let divRegex = /<div[^>]*class=["'][^"']*draggable[^"']*["'][^>]*>[\s\S]*?<\/div>/g;
    let divRegex = /<div[^>]*class=["'][^"']*preview-draggable[^"']*["'][^>]*>[\s\S]*?<\/div>/g;
    let elements = formContent.match(divRegex) || [];

    if (elements.length === 0) return; // No draggable divs found

    // Ensure the indices are valid
    if (oldIndex >= 0 && oldIndex < elements.length && newIndex >= 0 && newIndex < elements.length) {
        let movedElement = elements.splice(oldIndex, 1)[0]; // Remove from old position
        elements.splice(newIndex, 0, movedElement); // Insert at new position
    }

    // Replace only the draggable elements inside the form
    let updatedFormContent = formContent.replace(divRegex, () => elements.shift());

    // Update the template in CodeMirror
    let updatedTemplate = template.replace(formContent, updatedFormContent);
    doc.setValue(updatedTemplate);
  }
}
export function countElements(selector) {
  let pos = -1;
  if (selector) {
    pos = document.querySelectorAll(selector).length;
  }
  return pos
}
export function toggleIndicator(selector, show) {
  const indicator = document.querySelector(selector);
  if (indicator) {
    if (show) {
      indicator.classList.add('htmx-request');
    } else {
      indicator.classList.remove('htmx-request');
    }
  }
}
//
//TODO: Need to remove this
//
export function processJSONField(event, selector) {
  const elt = event.detail.elt;
  const form = elt.closest('form');
  const jsonField = form.querySelector(selector);
  console.log("-->Attempting to process JSON for selector: ", selector, form);
  
  if (jsonField) {
    try {
      // First, remove any previously created fields from this JSON
      const existingFields = form.querySelectorAll('input[data-json-field="true"]');
      existingFields.forEach(field => field.remove());
      
      const jsonData = JSON.parse(jsonField.value);
      console.log("-->JSON contents: ", jsonData);
      function flattenJSON(obj, prefix = '') {
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            const fieldName = prefix ? `${prefix}.${key}` : key;
            
            if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
              flattenJSON(value, fieldName);
            } else if (Array.isArray(value)) {
              value.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                  flattenJSON(item, `${fieldName}[${index}]`);
                } else {
                  const input = document.createElement('input');
                  input.type = 'hidden';
                  input.name = `${fieldName}[${index}]`;
                  input.value = item;
                  // Mark this input as created from JSON to find it later
                  input.setAttribute('data-json-field', 'true');
                  form.appendChild(input);
                  console.log('-->Appending array primitive:', input);
                }
              });
            } else {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = fieldName;
              input.value = value;
              // Mark this input as created from JSON to find it later
              input.setAttribute('data-json-field', 'true');
              form.appendChild(input);
              console.log('-->Appending primitive:', input);
            }
          }
        }
      }
      
      flattenJSON(jsonData, 'json_data');
      console.log('-->Processing complete for selector: ', selector, form);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  }
}



/**
 * Very minimal JSON-Schema check: supports const, enum,
 * minimum/maximum, minLength/maxLength, and pattern.
 * 
 * Example rule format:
 * {
 *   effect:   'HIDE' | 'SHOW' | 'ENABLE' | 'DISABLE' | 'REQUIRE' | 'UN-REQUIRE',
 *   condition: {
 *     scope:    '#/properties/foo',
 *     schema:   { minimum: 0, maxLength: 5, pattern: '^[A-Z]' },
 *     property: 'value'          // optional, defaults to checkbox/value logic
 *   },
 *   target:   '#some-container'  // CSS selector for the control wrapper
 * }
 */

export function testSchema(value, schema) {
  // Treat undefined as no-match
  if (value === undefined || value === null) {
    return false;
  }

  // const
  if ('const' in schema) {
    return value === schema.const;
  }

  // enum
  if ('enum' in schema) {
    return Array.isArray(schema.enum) && schema.enum.includes(value);
  }

  // minimum (>=)
  if ('minimum' in schema) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num) || num < schema.minimum) {
      return false;
    }
  }

  // maximum (<=)
  if ('maximum' in schema) {
    const num = typeof value === 'number' ? value : parseFloat(value);
    if (isNaN(num) || num > schema.maximum) {
      return false;
    }
  }

  // minLength (string length >=)
  if ('minLength' in schema) {
    const str = String(value);
    if (str.length < schema.minLength) {
      return false;
    }
  }

  // maxLength (string length <=)
  if ('maxLength' in schema) {
    const str = String(value);
    if (str.length > schema.maxLength) {
      return false;
    }
  }

  // pattern (RegExp match)
  if ('pattern' in schema) {
    // Note: pattern should not include delimiters like /^...$/ in JSON Schema
    const re = new RegExp(schema.pattern);
    if (typeof value !== 'string' || !re.test(value)) {
      return false;
    }
  }

  // Passed all checks we care about
  return true;
}

export function getSourcePropertyValue(srcDataId, srcSelector, srcProperty) {
  let selector = '';
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
  if (!selector) return undefined;
  
  const el = document.querySelector(selector);
  if (!el) return undefined;

  if (srcProperty && srcProperty in el) {
    return el[srcProperty];
  }
  if (el.type === 'checkbox') {
    return el.checked;
  }
  return el.value;
}

export function applyRule(rule) {
  const { effect, condition, tgtDataId, tgtSelector, tgtProperty } = rule;
  const { scope, schema, srcDataId, srcSelector, srcProperty, property } = condition;
  const value = getSourcePropertyValue(srcDataId, srcSelector, srcProperty);
  if (value == undefined) return;
  let match = false;
  if (schema) {
    match = testSchema(value, schema);
  }
  let selector = '';
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
    case 'COPY':
      targetEl[tgtProperty] = value;
      break;
    case 'COPY-TOLOWER':
      targetEl[tgtProperty] = value.toString().toLowerCase();
      break;
    case 'COPY-TOLOWER-UNDERSCORE':
      targetEl[tgtProperty] = value.toString().toLowerCase().replaceAll(' ', '_');
      break;
    case 'HIDE':
      targetEl.style.display = match ? 'none' : '';
      break;
    case 'SHOW':
      targetEl.style.display = match ? '' : 'none';
      break;
    case 'DISABLE':
      targetEl.disabled = match;
      break;
    case 'ENABLE':
      targetEl.disabled = !match;
      break;
    case 'REQUIRE':
      targetEl.required = !match;
      break;
    case 'UN-REQUIRE':
      targetEl.required = match;
      break;
    default:
      console.warn('Unknown rule effect:', effect);
  }
}

export function initRules(rules) {
  const srcDataIds = Array.from(new Set(rules.map(r => r.condition.srcDataId)));
  srcDataIds.forEach(id => {
    document
      .querySelectorAll(`[data-id="${id}"]`)
      .forEach(el => {
        const elRules = Array.from(rules).filter(r => r.condition.srcDataId == id);
        el.addEventListener('change', () => {
          elRules.forEach(applyRule)
        });
        el.addEventListener('input',  () => {
          elRules.forEach(applyRule)
        });
      });
  });
  // initial application
  rules.forEach(applyRule);
}

/**
 * Recursively extract all rule objects from a Pongo-style UI schema.
 * @param {object} node  The root of your layout JSON
 * @returns {Array}      An array of all `rule` entries found
 */
export function extractRules(nodes) {
  const rules = [];

  function traverse(obj) {
    if (!obj || typeof obj !== 'object') return;

    // if this node has a rule, grab it
    if (obj.rules) {
      rules.push(...obj.rules);
    }

    // if it has an "elements" array, recurse into each child
    if (Array.isArray(obj.elements)) {
      obj.elements.forEach(traverse);
    }
  }
  nodes.forEach(traverse);

  return rules;
}

export function extractSrcElements(nodes) {
  const result = [];
  
  function processElement(element) {
    // Extract label and scope, format as required
    const label = element.label || '';
    const scope = element.scope || '';
    const formattedLabel = scope ? `${label} (${scope})` : label;
    
    // Create the output object with the required properties
    const output = {
      'dataId': element['data-id'],
      'label': formattedLabel
    };
    
    result.push(output);
    
    // Recursively process elements if they exist
    if (element.elements && Array.isArray(element.elements)) {
      element.elements.forEach(child => processElement(child));
    }
  }
  
  // Process each top-level element in the array
  nodes.forEach(element => processElement(element));
  
  return result;
}
