# WC-Javascript Web Component

`wc-javascript` is a specialized web component designed to handle JavaScript code insertion in both traditional web pages and HTMX-powered applications. It ensures that scripts are properly loaded and executed, even in dynamic content updates.

## Features

- Safe script execution in both traditional and HTMX contexts
- Automatic script deduplication using unique IDs
- Support for global helper functions through the `window.wc` namespace
- Clean DOM rendering with script content removal after execution

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

```javascript
// The component self-registers if not already defined
import './wc-javascript.js';
```

## Basic Usage

```html
<wc-javascript id="my-script">
  function sayHello() {
    console.log("Hello, World!");
  }
  sayHello();
</wc-javascript>
```

## Advanced Usage

### With Helper Functions

```html
<wc-javascript id="load-resources">
  // Using built-in helper functions
  async function loadDependencies() {
    await wc.loadCSS('https://cdn.example.com/styles.css');
    await wc.loadScript('https://cdn.example.com/script.js');
    
    // Load a library and wait for its global object
    await wc.loadLibrary('https://cdn.example.com/chart.js', 'Chart');
    
    // Load inline styles
    await wc.loadStyle('custom-styles', `
      .my-class { color: blue; }
    `);
  }
  
  loadDependencies();
</wc-javascript>
```

### With HTMX Integration

```html
<div hx-get="/api/content" hx-trigger="click">
  <wc-javascript id="dynamic-script">
    function handleDynamicContent() {
      // Your code here
      console.log("Dynamic content loaded!");
    }
    handleDynamicContent();
  </wc-javascript>
</div>
```

## API Reference

### Attributes

- `id` (optional) - Unique identifier for the script. If not provided, a UUID will be generated.
- `data-id` (optional) - Alternative way to provide an identifier.

### Global Namespace (`window.wc`)

The component provides several utility functions through the `window.wc` namespace:

- `wc.loadCSS(url)` - Load a CSS file asynchronously
- `wc.loadScript(url)` - Load a JavaScript file asynchronously
- `wc.loadLibrary(url, globalObjectName)` - Load a JavaScript library and wait for its global object
- `wc.loadStyle(id, content)` - Add inline styles with a specific ID

## Best Practices

1. Always provide an ID for scripts that may need to be referenced or prevented from duplicate execution:
```html
<wc-javascript id="initialization">
  function init() {
    // Initialization code
  }
  init();
</wc-javascript>
```

2. Use helper functions for resource loading:
```html
<wc-javascript id="resource-loader">
  async function loadResources() {
    await wc.loadCSS('/styles/custom.css');
    await wc.loadScript('/js/utilities.js');
  }
  loadResources();
</wc-javascript>
```

3. Group related functionality:
```html
<wc-javascript id="user-management">
  const UserManager = {
    init() {
      this.bindEvents();
      this.loadInitialData();
    },
    bindEvents() {
      // Event binding code
    },
    loadInitialData() {
      // Data loading code
    }
  };
  
  UserManager.init();
</wc-javascript>
```

## Technical Details

- Script execution: Scripts are executed immediately after being added to the document head
- Deduplication: Scripts with the same ID will not be re-added to the DOM
- DOM cleanup: Script content is removed from the component after execution
- HTMX compatibility: Works seamlessly with HTMX partial page updates

## Limitations

- Scripts are executed in the global scope
- No support for module scripts (`type="module"`)
- Script execution order is not guaranteed when loading multiple scripts

## Example Scenarios

### Form Validation
```html
<wc-javascript id="form-validation">
  function validateForm(formId) {
    const form = document.getElementById(formId);
    form.addEventListener('submit', (e) => {
      // Validation logic
    });
  }
  validateForm('myForm');
</wc-javascript>
```

### Dynamic Chart Creation
```html
<wc-javascript id="chart-init">
  async function initChart() {
    await wc.loadLibrary('https://cdn.chartjs.org/chart.js', 'Chart');
    const ctx = document.getElementById('myChart');
    new Chart(ctx, {
      // Chart configuration
    });
  }
  initChart();
</wc-javascript>
```

### Event Handling
```html
<wc-javascript id="event-handlers">
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.action-button');
    buttons.forEach(button => {
      button.addEventListener('click', handleClick);
    });
  });
  
  function handleClick(e) {
    console.log('Button clicked:', e.target);
  }
</wc-javascript>
```

