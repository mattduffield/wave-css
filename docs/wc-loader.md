# WC-Loader Web Component

`wc-loader` is a customizable loading spinner component that provides visual feedback during loading states. It features a circular animation with configurable size, speed, and thickness.

## Features

- Customizable size, speed, and thickness
- CSS variable integration for theming
- Event-based show/hide control
- HTMX compatibility
- Responsive and scalable design

## Installation

```javascript
import { WcLoader } from './wc-loader.js';
// The component self-registers with customElements.define()
```

## Basic Usage

```html
<!-- Default loader -->
<wc-loader></wc-loader>

<!-- Customized loader -->
<wc-loader size="45px" speed="0.75s" thickness="8px"></wc-loader>
```

## Attributes

| Attribute  | Description                          | Default   | Example Values |
|-----------|--------------------------------------|-----------|----------------|
| size      | Width and height of the loader       | 120px     | "20px", "4rem" |
| speed     | Animation rotation duration          | 2s        | "0.5s", "1s"   |
| thickness | Border width of the loader circle    | 16px      | "4px", "8px"   |
| class     | CSS classes for styling              | -         | "custom-loader"|

## Event API

The loader can be controlled through custom events using the `wc.EventHub`:

```javascript
// Show loader
wc.EventHub.broadcast('wc-loader:show', ['[data-wc-id="your-loader-id"]']);

// Hide loader
wc.EventHub.broadcast('wc-loader:hide', ['[data-wc-id="your-loader-id"]']);

// Toggle loader visibility
wc.EventHub.broadcast('wc-loader:toggle', ['[data-wc-id="your-loader-id"]']);
```

## Styling

The component uses CSS variables for theming:

```css
:root {
  --primary-color: #007bff;      /* Loader border color */
  --primary-bg-color: #ffffff;   /* Loader spinning section color */
}
```

## Examples

### Basic Sizes
```html
<!-- Small loader -->
<wc-loader size="20px" speed="0.5s" thickness="4px"></wc-loader>

<!-- Medium loader -->
<wc-loader size="45px" speed="0.75s" thickness="8px"></wc-loader>

<!-- Large loader -->
<wc-loader size="90px" speed="1s" thickness="12px"></wc-loader>
```

### With HTMX Integration
```html
<div hx-get="/api/data" hx-trigger="load">
  <wc-loader id="data-loader" size="45px"></wc-loader>
</div>
```

### Programmatic Control
```html
<wc-loader id="dynamic-loader" size="45px" class="hidden"></wc-loader>

<script>
  // Show loader before operation
  wc.EventHub.broadcast('wc-loader:show', ['#dynamic-loader']);
  
  // Perform async operation
  await someAsyncOperation();
  
  // Hide loader after completion
  wc.EventHub.broadcast('wc-loader:hide', ['#dynamic-loader']);
</script>
```

### Multiple Loaders
```html
<div class="loading-container">
  <wc-loader data-wc-id="loader1" size="30px"></wc-loader>
  <wc-loader data-wc-id="loader2" size="30px"></wc-loader>
  
  <script>
    // Control multiple loaders simultaneously
    wc.EventHub.broadcast('wc-loader:show', ['[data-wc-id="loader1"], [data-wc-id="loader2"]']);
  </script>
</div>
```

## Best Practices

1. Always provide an ID or data-wc-id when using event control:
```html
<wc-loader data-wc-id="main-loader"></wc-loader>
```

2. Use appropriate sizes for different contexts:
```html
<!-- Small inline loader -->
<wc-loader size="16px" speed="0.5s" thickness="2px"></wc-loader>

<!-- Full section loader -->
<wc-loader size="90px" speed="1s" thickness="12px"></wc-loader>
```

3. Adjust animation speed based on size:
```html
<!-- Faster for small loaders -->
<wc-loader size="20px" speed="0.5s"></wc-loader>

<!-- Slower for large loaders -->
<wc-loader size="90px" speed="1.5s"></wc-loader>
```

## Technical Details

- Extends `WcBaseComponent`
- Uses Shadow DOM: No
- CSS Animation based
- Event-driven visibility control
- HTMX compatible

## CSS Animation

The loader uses a CSS keyframe animation for rotation:

```css
@keyframes loader-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
```

## Browser Support

Requires browsers that support:
- Custom Elements v1
- CSS Animations
- CSS Variables (Custom Properties)

## Notes

- The loader is hidden by adding the `hidden` class
- Animation continues even when hidden (for performance reasons)
- Event listeners are automatically cleaned up on disconnect
- Supports dynamic attribute updates
- Works with CSS theme variables for consistent styling

