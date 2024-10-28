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