# WC-Event-Hub Web Component

`wc-event-hub` is a centralized event management component that facilitates cross-component communication and event broadcasting. It provides a global event hub accessible through the `window.wc.EventHub` namespace.

## Features

- Centralized event broadcasting
- Cross-frame event propagation
- Singleton pattern enforcement
- Resource loading utilities
- Global event management

## Installation

```javascript
import './wc-event-hub.js';
// The component self-registers if not already defined
```

## Basic Usage

```html
<!-- Add the event hub to your page (only once) -->
<wc-event-hub></wc-event-hub>

<!-- Access in JavaScript -->
<script>
  // Broadcast an event
  window.wc.EventHub.broadcast(
    'user-action',            // Event name
    '#target-element',        // Target selector
    '.sub-element',           // Sub-selector (optional)
    { data: 'custom-data' }   // Custom payload (optional)
  );
</script>
```

## API Reference

### broadcast(eventName, selector, subSelector, custom)

Broadcasts a custom event to both the current document and parent frame (if available).

Parameters:
- `eventName` (string): Name of the event to broadcast
- `selector` (string): CSS selector for target element(s)
- `subSelector` (string, optional): Additional CSS selector for nested targeting
- `custom` (any, optional): Custom data payload

## Examples

### Basic Event Broadcasting
```javascript
// Simple event broadcast
window.wc.EventHub.broadcast(
  'menu-toggle',
  '#main-menu'
);

// Listen for the event
document.body.addEventListener('menu-toggle', (event) => {
  const { selector, subSelector, custom } = event.detail;
  // Handle the event
});
```

### With Custom Data
```javascript
// Broadcast with custom data
window.wc.EventHub.broadcast(
  'data-update',
  '#data-container',
  null,
  {
    action: 'refresh',
    timestamp: Date.now()
  }
);

// Listen for the event
document.body.addEventListener('data-update', (event) => {
  const { custom } = event.detail;
  console.log('Action:', custom.action);
  console.log('Timestamp:', custom.timestamp);
});
```

### Cross-Component Communication
```javascript
// Component A: Trigger an update
function triggerUpdate() {
  window.wc.EventHub.broadcast(
    'component-update',
    '#component-b',
    '.update-section',
    { status: 'updated' }
  );
}

// Component B: Listen for updates
document.body.addEventListener('component-update', (event) => {
  const { selector, subSelector, custom } = event.detail;
  // Update component based on event data
});
```

### Resource Loading
```javascript
// Load external CSS
window.wc.EventHub.loadCSS('https://cdn.example.com/styles.css');

// Load external script
window.wc.EventHub.loadScript('https://cdn.example.com/script.js');

// Load library with global object
window.wc.EventHub.loadLibrary(
  'https://cdn.example.com/chart.js',
  'Chart'
);

// Add inline styles
window.wc.EventHub.loadStyle(
  'custom-styles',
  '.my-class { color: blue; }'
);
```

## Common Use Cases

### Modal Management
```javascript
// Open modal
window.wc.EventHub.broadcast(
  'modal-action',
  '#app-modal',
  null,
  { action: 'open' }
);

// Close modal
window.wc.EventHub.broadcast(
  'modal-action',
  '#app-modal',
  null,
  { action: 'close' }
);
```

### Form State Management
```javascript
// Update form state
window.wc.EventHub.broadcast(
  'form-state',
  '#user-form',
  null,
  {
    isValid: true,
    changes: ['name', 'email']
  }
);
```

### Theme Switching
```javascript
// Change theme
window.wc.EventHub.broadcast(
  'theme-change',
  'body',
  null,
  { theme: 'dark' }
);
```

## Best Practices

1. Single Instance
```html
<!-- Only include once per page -->
<wc-event-hub></wc-event-hub>
```

2. Consistent Event Names
```javascript
// Use descriptive, consistent event names
window.wc.EventHub.broadcast(
  'user-preferences-update',
  '#preferences'
);
```

3. Structured Custom Data
```javascript
// Use well-structured custom data
window.wc.EventHub.broadcast(
  'data-action',
  '#target',
  null,
  {
    action: 'update',
    payload: {
      id: 123,
      status: 'active'
    }
  }
);
```

## Technical Notes

- Component enforces singleton pattern
- Events propagate to parent frames automatically
- Resource loading utilities are Promise-based
- Component automatically adds itself to window.wc namespace
- CSS display is set to 'contents' for zero DOM footprint

## Browser Support

Requires browsers that support:
- Custom Elements v1
- CustomEvent API
- Promises
- ES6 Classes and Modules

## Notes

- The component automatically prevents multiple instances
- Resource loading methods are bound to the component instance
- Events are dispatched on document.body
- Parent frame events are dispatched when available
- The component is designed to be invisible in the DOM

