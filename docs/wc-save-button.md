# WC Save Button Component

The `wc-save-button` is a custom web component that creates a standardized save button with built-in HTMX functionality for handling form submissions and page transitions.

## Installation

Ensure you have the following dependencies in your project:
- HTMX library
- Base component files (`wc-base-component.js` and `helper-function.js`)

## Basic Usage

```html
<wc-save-button save-url="/screen/contact/123">
</wc-save-button>
```

## Attributes

| Attribute | Type | Description | Required |
|-----------|------|-------------|-----------|
| `save-url` | String | The endpoint URL where the form data will be submitted via POST request | Yes |
| `id` | String | Optional ID for the button element | No |

## Features

- Automatically creates a button element with "Save" text
- Built-in HTMX integration with the following defaults:
  - POST request to specified `save-url`
  - Updates `#viewport` target
  - Uses innerHTML swap with transition
  - Shows `#content-loader` during request
  - Pushes URL to browser history

## Default HTMX Configuration

The component automatically sets up the following HTMX attributes:
- `hx-target="#viewport"`
- `hx-swap="innerHTML transition:true"`
- `hx-indicator="#content-loader"`
- `hx-push-url="true"`
- `hx-post={save-url}`

## Styling

The component provides basic styling hooks through CSS classes:

```css
.wc-save-button {
  /* Your custom styles */
}

.wc-save-button:hover {
  /* Your hover styles */
}
```

## Examples

### Basic Save Button
```html
<wc-save-button save-url="/api/save-contact"></wc-save-button>
```

### Save Button with Custom ID
```html
<wc-save-button id="contact-save" save-url="/api/save-contact"></wc-save-button>
```

### Save Button with Custom Styling
```html
<style>
  .wc-save-button {
    background-color: blue;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
  }
</style>
<wc-save-button save-url="/api/save-contact"></wc-save-button>
```

## Technical Details

### Component Inheritance
The component extends `WcBaseComponent`, inheriting base functionality for:
- Unique ID generation
- CSS/Script loading
- Attribute handling
- Component lifecycle management

### DOM Structure
When rendered, the component creates the following structure:

```html
<wc-save-button class="contents">
  <button class="wc-save-button" hx-target="#viewport" hx-swap="innerHTML transition:true" 
          hx-indicator="#content-loader" hx-post="/your-save-url" hx-push-url="true">
    Save
  </button>
</wc-save-button>
```

### Events
The component utilizes the standard web component lifecycle events:
- `connectedCallback`: Initializes styles and event listeners
- `disconnectedCallback`: Cleans up event listeners
- `attributeChangedCallback`: Handles attribute updates

## Browser Support

This component relies on:
- Custom Elements v1
- Shadow DOM v1
- ES6 Modules
- HTMX

Ensure your target browsers support these features or provide appropriate polyfills.
