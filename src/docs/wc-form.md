# WC-Form Web Component

`wc-form` is a custom web component that extends the native HTML form functionality, providing a more structured and feature-rich form handling experience.

## Features

- Form-associated custom element support
- Automatic attribute pass-through for common form attributes
- Built-in event handling and validation
- Support for HTMX attributes
- Seamless integration with other form-related web components

## Installation

```javascript
import { WcForm } from './wc-form.js';
// The component self-registers with customElements.define()
```

## Basic Usage

```html
<wc-form id="myForm" method="post" action="/submit">
  <!-- Form content goes here -->
</wc-form>
```

## Supported Attributes

### Pass-through Attributes
The following attributes are automatically passed through to the internal form element:

- `id` - Form identifier
- `name` - Form name
- `method` - HTTP method (GET, POST, etc.)
- `action` - Form submission URL
- `hx-post` - HTMX post URL
- `hx-put` - HTMX put URL
- `hx-target` - HTMX target selector
- `hx-swap` - HTMX swap method
- `hx-push-url` - HTMX URL pushing behavior

### Style Attributes
- `class` - CSS classes (automatically handled for proper scoping)
- `elt-class` - Classes specifically for the form element

## Events

The component handles the following events:

- `submit` - Handles form submission with special handling for disabled inputs
- Custom validation events through the form-associated behavior

## Example Usage

### Basic Form
```html
<wc-form id="simple_form" method="post" action="/submit">
  <wc-input name="username" lbl-label="Username" required></wc-input>
  <wc-input name="email" type="email" lbl-label="Email"></wc-input>
  <button type="submit">Submit</button>
</wc-form>
```

### Form with HTMX Integration
```html
<wc-form id="htmx_form" 
  hx-post="/api/submit" 
  hx-target="#result-div"
  hx-swap="outerHTML">
  <div class="row gap-4">
    <wc-input name="first_name" lbl-label="First Name"></wc-input>
    <wc-input name="last_name" lbl-label="Last Name"></wc-input>
  </div>
  <button>Save</button>
</wc-form>
```

### Form with Complex Layout
```html
<wc-form class="col p-6 gap-3" id="complex_form" method="post" action="/">
  <div class="card">
    <h2>Profile Information</h2>
    <div class="row gap-4">
      <wc-input class="col" name="first_name" lbl-label="First" required></wc-input>
      <wc-input class="col" name="last_name" lbl-label="Last" required></wc-input>
    </div>
    <div class="row gap-4 justify-end items-end">
      <button type="button">Cancel</button>
      <button type="submit">Save</button>
    </div>
  </div>
</wc-form>
```

## Integration with Other Components

The `wc-form` component is designed to work seamlessly with other form-related web components:

- `wc-input` - For input fields
- `wc-select` - For select dropdowns
- `wc-textarea` - For multiline text input
- Any other custom form elements that extend `WcBaseFormComponent`

## Styling

The component includes basic structural CSS and can be styled using regular CSS classes. The component automatically handles class management to ensure proper scoping:

```css
.wc-form {
  /* Your custom styles */
}
```

## Best Practices

1. Always provide an `id` attribute for forms that need to be referenced
2. Use semantic class names for layout (`col`, `row`, `gap-*`)
3. Group related fields using appropriate container elements
4. Utilize the built-in validation features of form-associated components
5. Take advantage of HTMX attributes for dynamic form behavior

## Technical Details

- Extends `WcBaseComponent`
- Uses Shadow DOM: No
- Form-associated: Yes
- Automatic attribute handling
- Built-in support for disabled input handling during form submission

## Browser Support

Requires browsers that support:
- Custom Elements v1
- Form-associated custom elements
- ES6 Classes and Modules

## Notes

- The component automatically handles the movement of declarative inner content
- HTMX integration is optional but supported out of the box
- Class attributes are specially handled to maintain proper styling scope
- Disabled inputs are temporarily enabled during form submission to ensure their values are included

