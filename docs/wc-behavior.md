# WC-Behavior Web Component

`wc-behavior` is a specialized web component that enables HTMX behavior delegation to parent containers and handles custom event triggering. It's particularly useful for adding HTMX functionality to container elements and managing event-driven behaviors.

## Features

- Automatic HTMX attribute delegation to parent container
- Custom event triggering support
- HTMX integration
- Attribute cleanup after delegation
- Support for all standard HTMX attributes

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

```javascript
import './wc-behavior.js';
// The component self-registers with customElements.define()
```

## Basic Usage

```html
<!-- Basic HTMX behavior -->
<div class="container">
  <wc-behavior 
    hx-post="/api/endpoint"
    hx-trigger="click"
    hx-target="#result">
  </wc-behavior>
</div>

<!-- Custom event trigger -->
<div class="action-container">
  <wc-behavior
    hx-trigger="custom-event from:body"
    hx-post="/api/action"
    hx-confirm="Are you sure you want to perform this action?">
  </wc-behavior>
</div>
```

## Supported HTMX Attributes

The component supports all standard HTMX attributes:

- Core Attributes:
  - `hx-get`
  - `hx-post`
  - `hx-put`
  - `hx-delete`
  - `hx-target`
  - `hx-trigger`
  - `hx-swap`

- Additional Attributes:
  - `hx-select`
  - `hx-push-url`
  - `hx-vals`
  - `hx-headers`
  - `hx-indicator`
  - `hx-params`
  - `hx-ext`
  - `hx-prompt`
  - `hx-confirm`
  - `hx-on`
  - `hx-include`

## Examples

### Basic AJAX Request
```html
<div class="data-container">
  <wc-behavior
    hx-get="/api/data"
    hx-trigger="click"
    hx-target="#result-div"
    hx-swap="outerHTML">
  </wc-behavior>
  <div id="result-div"></div>
</div>
```

### Custom Event Handling
```html
<div class="event-container">
  <wc-behavior
    hx-trigger="custom-event from:body"
    hx-post="/api/handle-event"
    hx-confirm="Proceed with action?">
  </wc-behavior>
  
  <!-- Trigger the custom event -->
  <button onclick="
    document.body.dispatchEvent(
      new CustomEvent('custom-event', { 
        detail: 'hello world' 
      })
    )">
    Trigger Event
  </button>
</div>
```

### Form Submission
```html
<form class="data-form">
  <wc-behavior
    hx-post="/api/submit"
    hx-trigger="submit"
    hx-target="#response"
    hx-indicator="#loading">
  </wc-behavior>
  
  <input type="text" name="data">
  <div id="loading" class="htmx-indicator">Loading...</div>
  <div id="response"></div>
</form>
```

### Complex Triggers
```html
<div class="multi-trigger">
  <wc-behavior
    hx-trigger="click, keyup[key=='Enter'] from:body"
    hx-get="/api/refresh"
    hx-target="#content">
  </wc-behavior>
  <div id="content"></div>
</div>
```

## Best Practices

1. Parent Container Structure
```html
<!-- Always ensure the component has a parent container -->
<div class="wrapper">
  <wc-behavior hx-get="/api/data"></wc-behavior>
  <!-- Content here -->
</div>
```

2. Event Handling
```html
<!-- Use descriptive event names -->
<div class="action-wrapper">
  <wc-behavior
    hx-trigger="user-action from:body"
    hx-post="/api/action">
  </wc-behavior>
</div>
```

3. Error Handling
```html
<!-- Include error handling in HTMX requests -->
<div class="error-aware">
  <wc-behavior
    hx-post="/api/action"
    hx-trigger="click"
    hx-target="#error-display"
    hx-swap="outerHTML"
    hx-on="htmx:error: showError()">
  </wc-behavior>
  <div id="error-display"></div>
</div>
```

## Technical Details

### Event Flow
1. Component attaches to parent container
2. HTMX attributes are transferred to parent
3. Original attributes are removed from component
4. Parent container becomes HTMX-enabled
5. Click events trigger custom events when configured

### Custom Event Details
- Event name: `custom-event`
- Detail payload: `"hello world"`
- Dispatched to: `document.body`

## Integration with HTMX

The component works seamlessly with HTMX by:
1. Delegating all HTMX attributes to parent
2. Supporting all HTMX triggers and events
3. Maintaining HTMX's declarative programming model

## Browser Support

Requires browsers that support:
- Custom Elements v1
- CustomEvent API
- HTMX library

## Notes

- Component must be placed within a parent container
- HTMX library must be loaded before using the component
- Attributes are automatically cleaned up after delegation
- Custom events are dispatched to document.body
- Component logs warnings if parent container is missing

