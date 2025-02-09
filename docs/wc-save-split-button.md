# WC Save Split Button Component

The `wc-save-split-button` is a custom web component that creates a split button with a primary save action and a dropdown menu containing additional save options. It includes built-in HTMX functionality for handling form submissions and page transitions.

## Features

- Split button design with primary save action and dropdown menu
- Three save options:
  - Save: Simple save action
  - Save and Add New: Saves and redirects to create new item
  - Save and Return: Saves and redirects to list view
- Built-in HTMX integration
- Automatic position management for dropdown menu
- Hash preservation across navigation
- Customizable styling through CSS variables

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

Ensure you have the following dependencies in your project:
- HTMX library
- Base component files (`wc-base-component.js` and `helper-function.js`)

## Basic Usage

```html
<wc-save-split-button
  save-url="/screen/contact/123"
  save-new-url="/screen/contact/create"
  save-return-url="/screen/contact_list/list">
</wc-save-split-button>
```

## Attributes

| Attribute | Type | Description | Required |
|-----------|------|-------------|-----------|
| `save-url` | String | The endpoint URL for the primary save action | Yes |
| `save-new-url` | String | The URL to navigate to after saving to create a new item | Yes |
| `save-return-url` | String | The URL to navigate to after saving to return to list | Yes |
| `method` | String | HTTP method for the save action (default: 'post') | No |
| `id` | String | Optional ID for the button element | No |
| `position-area` | String | Position of the dropdown (default: 'bottom span-left') | No |
| `position-try-fallbacks` | String | Fallback positions for the dropdown | No |


## Default HTMX Configuration

The component automatically sets up the following HTMX attributes:
- `hx-target="#viewport"`
- `hx-swap="innerHTML transition:true"`
- `hx-indicator="#content-loader"`
- `hx-push-url="true"`
- `hx-boost="true"`

## CSS Variables

The component uses the following CSS variables for styling:
```css
:root {
  --component-border-color: /* Border color for split button divider */
  --button-bg-color: /* Background color for buttons */
  --button-border-color: /* Border color for buttons */
  --button-color: /* Text color for buttons */
  --button-hover-bg-color: /* Background color on hover */
  --button-hover-color: /* Text color on hover */
}
```

## Examples

### Basic Split Save Button
```html
<wc-save-split-button
  save-url="/api/save-contact"
  save-new-url="/screen/contact/create"
  save-return-url="/contacts">
</wc-save-split-button>
```

### Custom Position and Method
```html
<wc-save-split-button
  method="put"
  save-url="/api/save-contact"
  save-new-url="/screen/contact/create"
  save-return-url="/contacts"
  position-area="top span-right"
  position-try-fallbacks="--top-right, --bottom-right, --right">
</wc-save-split-button>
```

### Custom Styling
```html
<style>
  :root {
    --button-bg-color: #4a90e2;
    --button-color: white;
    --button-hover-bg-color: #357abd;
    --button-hover-color: white;
    --button-border-color: #357abd;
  }
</style>
<wc-save-split-button
  save-url="/api/save-contact"
  save-new-url="/screen/contact/create"
  save-return-url="/contacts">
</wc-save-split-button>
```

## Technical Details

### DOM Structure
When rendered, the component creates the following structure:

```html
<wc-save-split-button class="contents">
  <div class="wc-save-split-button">
    <button type="button" class="save-btn btn">Save</button>
    <div class="dropdown">
      <div class="dropdown-content">
        <a class="save-new-btn btn w-full">Save and Add New</a>
        <a class="save-return-btn btn w-full">Save and Return</a>
      </div>
      <button type="button" class="btn">▼</button>
    </div>
  </div>
</wc-save-split-button>
```

### Event Handling

The component handles several events:
- Click events on all save buttons
- HTMX configuration request for redirect handling
- HTMX after-swap event for hash preservation
- Hover events for dropdown display

### Special Behaviors

1. Hash Preservation:
   - Maintains URL hash across navigation
   - Stores hash in sessionStorage during transitions
   - Restores hash after page load

2. URL Handling:
   - Automatically handles create/edit URL patterns
   - Supports custom redirect headers
   - Manages state between create and edit modes

## Browser Support

This component relies on:
- Custom Elements v1
- CSS Position API
- HTMX
- Modern CSS Features (CSS Variables, Flexbox)

Ensure your target browsers support these features or provide appropriate polyfills.
