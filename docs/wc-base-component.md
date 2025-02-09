# WcBaseComponent Base Class

A foundational base class for creating web components with common functionality for attribute handling, child component management, styling, and event handling.

## Features

- Unique ID generation
- Attribute management with pending queue
- Child component lifecycle handling
- Resource loading utilities
- Standardized rendering pipeline
- Event handling infrastructure
- Style management

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)


## Usage

Extend this class to create new web components:

```javascript
import { WcBaseComponent } from './wc-base-component.js';

class MyCustomComponent extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'custom-attr'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.my-custom-component');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('my-custom-component');
      this.appendChild(this.componentElement);
    }
  }

  _render() {
    super._render();
    // Your rendering logic here
  }
}

customElements.define('my-custom-component', MyCustomComponent);
```

## Protected Properties

| Property               | Type     | Description                                    |
|-----------------------|----------|------------------------------------------------|
| _wcId                 | string   | Unique component identifier                    |
| componentElement      | Element  | Main wrapper element for the component         |
| formElement           | Element  | Form element if component is form-related      |
| childComponent        | any      | Reference to third-party component instance    |
| childComponentSelector| string   | Selector for child web components             |
| _pendingAttributes    | Object   | Queue for attributes before connection         |
| _isConnected          | boolean  | Connection state of the component             |

## Inherited Methods

### Lifecycle Methods

```javascript
connectedCallback()
// Handles component connection to DOM
// Manages child component rendering
// Applies pending attributes

disconnectedCallback()
// Cleanup when component is removed

attributeChangedCallback(attrName, oldValue, newValue)
// Handles attribute changes with pending queue
```

### Utility Methods

```javascript
loadCSS(url)
// Load external CSS file
// Returns Promise

loadScript(url)
// Load external JavaScript file
// Returns Promise

loadLibrary(url, globalObjectName)
// Load external library and wait for global object
// Returns Promise

loadStyle(id, content)
// Apply inline styles
// Returns Promise
```

### Protected Methods

```javascript
_render()
// Base rendering method
// Adds 'contents' class
// Should be extended by child classes

_handleAttributeChange(attrName, newValue)
// Process attribute changes
// Handles special cases for 'name', 'elt-class', 'class'

_applyStyle()
// Apply component-specific styles
// Should be extended by child classes

_wireEvents()
// Set up event listeners
// Should be extended by child classes

_unWireEvents()
// Clean up event listeners
// Should be extended by child classes
```

## Child Component Management

The base class provides robust handling of child components:

```javascript
// In your component class
constructor() {
  super();
  this.childComponentSelector = 'child-component';
  // or
  this.childComponent = null; // For third-party components
}
```

### Waiting for Children

```javascript
async _waitForChildren(selector)
// Waits for child components to be connected
// Returns Promise

async _waitForChild(childRef)
// Waits for specific child component
// Returns Promise
```

## Attribute Handling

The base class provides sophisticated attribute management:

```javascript
// Define observed attributes
static get observedAttributes() {
  return ['id', 'class', 'custom-attr'];
}

// Handle specific attribute changes
_handleAttributeChange(attrName, newValue) {
  super._handleAttributeChange(attrName, newValue);
  // Your custom attribute handling
}
```

## Styling

Components inherit style management:

```javascript
_applyStyle() {
  const style = `
    my-component {
      display: contents;
    }
  `;
  this.loadStyle('my-component-style', style);
}
```

## Best Practices

1. **Component Structure**
   ```javascript
   constructor() {
     super();
     this.componentElement = document.createElement('div');
     this.componentElement.classList.add('my-component');
     this.appendChild(this.componentElement);
   }
   ```

2. **Attribute Handling**
   ```javascript
   _handleAttributeChange(attrName, newValue) {
     if (attrName === 'custom-attr') {
       // Handle custom attribute
     } else {
       super._handleAttributeChange(attrName, newValue);
     }
   }
   ```

3. **Event Management**
   ```javascript
   _wireEvents() {
     super._wireEvents();
     this.componentElement.addEventListener('click', this._handleClick.bind(this));
   }

   _unWireEvents() {
     super._unWireEvents();
     this.componentElement.removeEventListener('click', this._handleClick.bind(this));
   }
   ```

## Example Implementation

```javascript
import { WcBaseComponent } from './wc-base-component.js';

class MyComponent extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'custom-value'];
  }

  constructor() {
    super();
    this.componentElement = document.createElement('div');
    this.componentElement.classList.add('my-component');
    this.appendChild(this.componentElement);
  }

  _render() {
    super._render();
    this.componentElement.innerHTML = `
      <div class="content">
        <slot></slot>
      </div>
    `;
  }

  _applyStyle() {
    const style = `
      my-component {
        display: contents;
      }
      .my-component {
        /* component styles */
      }
    `;
    this.loadStyle('my-component-style', style);
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'custom-value') {
      // Handle custom attribute
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
}

customElements.define('my-component', MyComponent);
```

