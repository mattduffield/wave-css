# WC-Theme Web Component

A lightweight web component that automatically applies saved theme preferences to your application, ensuring theme consistency across page loads and HTMX-based navigation.

## Features

- Automatic theme restoration from localStorage
- HTMX compatibility
- Zero configuration required
- Lightweight implementation
- Non-visual component (uses `display: contents`)

## Installation

Include the required JavaScript file:

```html
<script type="module" src="path/to/wc-theme.js"></script>
```

## Basic Usage

Simply add the component to your page, typically in the header or early in the body:

```html
<wc-theme></wc-theme>
```

## How It Works

1. On connection to the DOM, the component:
   - Retrieves the saved theme from localStorage (defaults to "rose" if none is set)
   - Removes any existing theme classes from the document root
   - Applies the saved theme class to the document root

## Theme Storage

The component expects themes to be stored in localStorage with:
- Key: `"theme"`
- Value: theme name without the `"theme-"` prefix
  - Example: `"ocean"` for `"theme-ocean"`

```javascript
// Example of how themes are stored
localStorage.setItem("theme", "ocean");
```

## Integration with HTMX

The component is specifically designed to work with HTMX partial page updates:
- Maintains theme consistency during HTMX navigation
- Re-applies themes after HTMX content swaps
- No additional configuration needed for HTMX support

## Example Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module" src="path/to/wc-theme.js"></script>
</head>
<body>
  <!-- Add early in the document -->
  <wc-theme></wc-theme>
  
  <!-- Rest of your content -->
  <div id="content">
    <!-- Your page content here -->
  </div>
</body>
</html>
```

## Best Practices

1. Place the component early in your document to minimize theme flashing
2. Use with `wc-theme-selector` for user theme selection
3. Include in your base template when using HTMX
4. One instance per page is sufficient

## Technical Details

- Extends `HTMLElement`
- Uses `display: contents` to avoid affecting page layout
- Automatically registers if not already defined
- No shadow DOM usage
- No attributes required

## Theme Class Format

The component expects themes to follow this naming convention:
- Stored in localStorage without prefix: `"ocean"`
- Applied to DOM with prefix: `"theme-ocean"`

## Dependencies

The component relies on:
- `helper-function.js` module (included but not actively used in current implementation)
- localStorage API
- Custom Elements v1

## Limitations

- Requires JavaScript to be enabled
- Depends on localStorage availability
- Must be used with compatible theme class names (`theme-` prefix)

## Integration Example with Theme Selector

```html
<!-- Theme persistence across pages -->
<wc-theme></wc-theme>

<!-- User theme selection -->
<wc-theme-selector></wc-theme-selector>
```

## Browser Support

Requires browsers that support:
- Custom Elements v1
- ES6 Modules
- localStorage API

