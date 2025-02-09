# WC-Mask-Hub Web Component

`wc-mask-hub` is a web component that provides input masking functionality using the IMask library. It acts as a centralized hub for managing input masks across your application, with built-in support for common masking patterns like phone numbers.

## Features

- Centralized mask management
- Phone number formatting
- IMask library integration
- Singleton pattern enforcement
- Lazy loading of dependencies

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

```javascript
import './wc-mask-hub.js';
// The component self-registers if not already defined
```

## Basic Usage

```html
<!-- Add the mask hub to your page (only once) -->
<wc-mask-hub></wc-mask-hub>

<!-- Apply phone mask to an input -->
<input type="tel" 
       onfocus="window.wc.MaskHub.phoneMask(event)" 
       placeholder="(123) 456-7890">
```

## API Reference

### phoneMask(event)
Applies a US phone number mask to an input element.

Format: `(000) 000-0000`

Parameters:
- `event`: The DOM event object containing the target input element

## Examples

### Phone Number Input
```html
<!-- Basic phone input with mask -->
<div class="form-group">
  <label>Phone Number:</label>
  <input type="tel" 
         class="phone-input"
         onfocus="window.wc.MaskHub.phoneMask(event)"
         placeholder="(123) 456-7890">
</div>

<!-- With additional styling -->
<div class="form-group">
  <label>Contact Phone:</label>
  <input type="tel" 
         class="form-control phone-input"
         onfocus="window.wc.MaskHub.phoneMask(event)"
         placeholder="(___) ___-____"
         required>
</div>
```

### Form Integration
```html
<form id="contact-form">
  <wc-mask-hub></wc-mask-hub>
  
  <div class="form-row">
    <label>Name:</label>
    <input type="text" name="name">
  </div>
  
  <div class="form-row">
    <label>Phone:</label>
    <input type="tel" 
           name="phone"
           onfocus="window.wc.MaskHub.phoneMask(event)"
           placeholder="(123) 456-7890">
  </div>
  
  <button type="submit">Submit</button>
</form>
```

### Multiple Phone Inputs
```html
<div class="contact-info">
  <wc-mask-hub></wc-mask-hub>
  
  <div class="phone-group">
    <label>Primary Phone:</label>
    <input type="tel" 
           onfocus="window.wc.MaskHub.phoneMask(event)"
           name="primary_phone">
  </div>
  
  <div class="phone-group">
    <label>Secondary Phone:</label>
    <input type="tel" 
           onfocus="window.wc.MaskHub.phoneMask(event)"
           name="secondary_phone">
  </div>
</div>
```

## Best Practices

1. Single Instance
```html
<!-- Include only once per page -->
<wc-mask-hub></wc-mask-hub>
```

2. Input Type Specification
```html
<!-- Always use type="tel" for phone inputs -->
<input type="tel" 
       onfocus="window.wc.MaskHub.phoneMask(event)">
```

3. Placeholder Usage
```html
<!-- Include a placeholder to show the expected format -->
<input type="tel" 
       onfocus="window.wc.MaskHub.phoneMask(event)"
       placeholder="(___) ___-____">
```

## Technical Details

### Dependencies
- IMask library (v7.6.1)
- Automatically loaded from CDN (cloudflare)

### Phone Mask Configuration
```javascript
{
  mask: '(000) 000-0000',
  startsWith: '',
  dispatch: function(appended, dynamicMasked) {
    const number = (dynamicMasked.value + appended).replace(/\D/g, '');
    return dynamicMasked.compiledMasks[0];
  }
}
```

### Component Initialization
1. Loads IMask library
2. Creates global namespace (`window.wc.MaskHub`)
3. Applies masking functionality

## Integration Examples

### With Form Validation
```html
<form onsubmit="validateForm(event)">
  <wc-mask-hub></wc-mask-hub>
  
  <input type="tel" 
         required
         pattern="\(\d{3}\) \d{3}-\d{4}"
         onfocus="window.wc.MaskHub.phoneMask(event)"
         oninvalid="this.setCustomValidity('Please enter a valid phone number')"
         oninput="this.setCustomValidity('')">
  
  <button type="submit">Submit</button>
</form>
```

### With Dynamic Content
```html
<div id="dynamic-form">
  <wc-mask-hub></wc-mask-hub>
</div>

<script>
function addPhoneInput() {
  const input = document.createElement('input');
  input.type = 'tel';
  input.placeholder = '(123) 456-7890';
  input.addEventListener('focus', (e) => window.wc.MaskHub.phoneMask(e));
  document.getElementById('dynamic-form').appendChild(input);
}
</script>
```

## Browser Support

Requires browsers that support:
- Custom Elements v1
- ES6 Classes and Modules
- Promises
- IMask library compatibility

## Notes

- Component automatically prevents multiple instances
- IMask library is loaded asynchronously
- Phone mask is applied on focus event
- Component maintains zero DOM footprint (display: contents)
- Input masks are applied automatically on focus

## Troubleshooting

1. If mask isn't applying:
   - Ensure wc-mask-hub is present in the DOM
   - Verify IMask library loaded successfully
   - Check console for errors
   - Verify the focus event is being triggered

2. If format is incorrect:
   - Verify input type is set to "tel"
   - Ensure proper event binding
   - Check for conflicting input masks

