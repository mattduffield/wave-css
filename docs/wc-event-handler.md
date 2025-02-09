# WC-Event-Handler Web Component

`wc-event-handler` is a utility web component that listens for custom events and performs DOM manipulations based on the event details. It provides a declarative way to handle events and modify the DOM without writing JavaScript.

## Features

- Custom event listening
- Dynamic DOM manipulation
- Class management
- Element addition and removal
- Click event simulation
- Automatic event cleanup

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

```javascript
import './wc-event-handler.js';
// The component self-registers with customElements.define()
```

## Basic Usage

```html
<!-- Basic event handler -->
<wc-event-handler 
  event-name="custom-event"
  action-target="#target-element">
</wc-event-handler>
```

## Attributes

| Attribute      | Description                              | Required | Example Values        |
|----------------|------------------------------------------|----------|----------------------|
| event-name     | Name of the event to listen for          | Yes      | "custom-event"       |
| action-target  | CSS selector for the target element      | Yes      | "#myElement"         |

## Supported Actions

The component supports the following actions through event detail:

1. Class Management:
   - `add-class`: Add a CSS class
   - `remove-class`: Remove a CSS class
   - `toggle-class`: Toggle a CSS class

2. Element Management:
   - `add-item`: Add a new DOM element
   - `remove-item`: Remove an existing DOM element

3. Event Simulation:
   - `click`: Trigger a click event on a target element

## Examples

### Class Management
```html
<!-- Setup event handler -->
<div id="menu-container">
  <wc-event-handler 
    event-name="menu-event" 
    action-target="#menu">
  </wc-event-handler>
  <nav id="menu"></nav>
</div>

<!-- Trigger events -->
<script>
// Add class
document.body.dispatchEvent(new CustomEvent("menu-event", { 
  detail: { 
    action: "add-class", 
    cls: "active" 
  }
}));

// Remove class
document.body.dispatchEvent(new CustomEvent("menu-event", { 
  detail: { 
    action: "remove-class", 
    cls: "active" 
  }
}));

// Toggle class
document.body.dispatchEvent(new CustomEvent("menu-event", { 
  detail: { 
    action: "toggle-class", 
    cls: "active" 
  }
}));
</script>
```

### Dynamic Element Management
```html
<!-- Setup event handler -->
<div class="container">
  <wc-event-handler 
    event-name="content-event" 
    action-target="#content">
  </wc-event-handler>
  <div id="content"></div>
</div>

<!-- Trigger events -->
<script>
// Add new element
document.body.dispatchEvent(new CustomEvent("content-event", { 
  detail: { 
    action: "add-item", 
    item: '<div class="new-item">New Content</div>' 
  }
}));

// Remove element
document.body.dispatchEvent(new CustomEvent("content-event", { 
  detail: { 
    action: "remove-item", 
    selector: ".new-item" 
  }
}));
</script>
```

### Click Simulation
```html
<!-- Setup event handler -->
<div class="navigation">
  <wc-event-handler 
    event-name="nav-event" 
    action-target="#nav-container">
  </wc-event-handler>
  <div id="nav-container">
    <button id="navButton">Toggle Nav</button>
  </div>
</div>

<!-- Trigger click event -->
<script>
document.body.dispatchEvent(new CustomEvent("nav-event", { 
  detail: { 
    action: "click", 
    selector: "#navButton" 
  }
}));
</script>
```

## Common Use Cases

### Sidebar Toggle
```html
<wc-event-handler 
  event-name="sidebar-event" 
  action-target="#sidebar">
</wc-event-handler>

<script>
// Toggle sidebar
document.body.dispatchEvent(new CustomEvent("sidebar-event", { 
  detail: { 
    action: "toggle-class", 
    cls: "open" 
  }
}));
</script>
```

### Dynamic Form Fields
```html
<wc-event-handler 
  event-name="form-event" 
  action-target="#dynamic-form">
</wc-event-handler>

<script>
// Add new input field
document.body.dispatchEvent(new CustomEvent("form-event", { 
  detail: { 
    action: "add-item", 
    item: '<wc-input class="dynamic-input" type="text"></wc-input>' 
  }
}));
</script>
```

## Best Practices

1. Use descriptive event names:
```html
<wc-event-handler 
  event-name="user-preference-update" 
  action-target="#preferences">
</wc-event-handler>
```

2. Target specific elements:
```html
<wc-event-handler 
  event-name="modal-event" 
  action-target="#specific-modal">
</wc-event-handler>
```

3. Clean event detail structure:
```javascript
document.body.dispatchEvent(new CustomEvent("modal-event", {
  detail: {
    action: "add-class",
    cls: "visible"
  }
}));
```

## Technical Notes

- Events must be dispatched on `document.body`
- Event listeners are automatically cleaned up on disconnection
- Actions are case-sensitive
- Target elements must exist when the action is triggered
- Invalid actions are silently ignored
- Console warnings are logged for missing event names

## Browser Support

Requires browsers that support:
- Custom Elements v1
- CustomEvent API
- classList API
- querySelector/querySelectorAll

