# WC-Mask-Hub Component Documentation

The `wc-mask-hub` is a singleton utility component that provides input masking functionality using the IMask.js library. It supports various mask types including phone numbers, SSN, ZIP codes, dates, and currency.

## Features

- Multiple pre-configured mask types (phone, SSN, ZIP, date, currency)
- Single mask instance per input (prevents memory leaks)
- Automatic cleanup when inputs are removed from DOM
- Support for pre-filled values from database
- Generic API for custom mask configurations
- Backwards compatible with existing code
- Automatic integration with `wc-input[type="tel"]`

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

The component loads IMask.js from CDN automatically.

```html
<!-- Add once per page, typically in your main layout -->
<wc-mask-hub></wc-mask-hub>
```

## Basic Usage

### With wc-input (Automatic)

For telephone inputs, the mask is applied automatically:

```html
<wc-input
  name="phone"
  type="tel"
  lbl-label="Phone"
  value="8005551212">
</wc-input>
<!-- Automatically displays as: (800) 555-1212 -->
```

### Manual Application

You can apply masks manually using Hyperscript:

```html
<!-- Phone Mask -->
<input type="text"
       _="on load call wc.MaskHub.phoneMask(event)">

<!-- SSN Mask -->
<input type="text"
       _="on load call wc.MaskHub.ssnMask(event)">

<!-- ZIP Code Mask -->
<input type="text"
       _="on load call wc.MaskHub.zipMask(event)">
```

## Available Mask Types

### Phone Number
**Format:** `(000) 000-0000`
```javascript
wc.MaskHub.phoneMask(event)
// or
wc.MaskHub.applyMask(event, 'phone')
```

**Example:**
```html
<wc-input name="phone" type="tel" lbl-label="Phone" value="8005551212">
</wc-input>
<!-- Displays as: (800) 555-1212 -->
```

### Social Security Number
**Format:** `000-00-0000`
```javascript
wc.MaskHub.ssnMask(event)
// or
wc.MaskHub.applyMask(event, 'ssn')
```

**Example:**
```html
<input type="text"
       name="ssn"
       _="on load call wc.MaskHub.ssnMask(event)"
       value="123456789">
<!-- Displays as: 123-45-6789 -->
```

### ZIP Code
**Format:** `00000`
```javascript
wc.MaskHub.zipMask(event)
// or
wc.MaskHub.applyMask(event, 'zip')
```

**Example:**
```html
<input type="text"
       name="zip"
       _="on load call wc.MaskHub.zipMask(event)"
       value="94102">
<!-- Displays as: 94102 -->
```

### ZIP+4
**Format:** `00000-0000`
```javascript
wc.MaskHub.zipPlus4Mask(event)
// or
wc.MaskHub.applyMask(event, 'zipPlus4')
```

**Example:**
```html
<input type="text"
       name="zip"
       _="on load call wc.MaskHub.zipPlus4Mask(event)"
       value="941021234">
<!-- Displays as: 94102-1234 -->
```

### Date
**Format:** `MM/DD/YYYY` with validation
```javascript
wc.MaskHub.dateMask(event)
// or
wc.MaskHub.applyMask(event, 'date')
```

**Example:**
```html
<input type="text"
       name="date"
       _="on load call wc.MaskHub.dateMask(event)"
       value="01/15/2024">
<!-- Validates month (1-12), day (1-31), year (1900-2099) -->
```

### Currency
**Format:** Numbers with thousand separators and 2 decimal places
```javascript
wc.MaskHub.currencyMask(event)
// or
wc.MaskHub.applyMask(event, 'currency')
```

**Example:**
```html
<input type="text"
       name="amount"
       _="on load call wc.MaskHub.currencyMask(event)"
       value="1234.56">
<!-- Displays as: 1,234.56 -->
```

## Generic API

### applyMask(event, maskType)

Apply any mask type to an input element:

```javascript
// Apply phone mask
wc.MaskHub.applyMask(event, 'phone')

// Apply SSN mask
wc.MaskHub.applyMask(event, 'ssn')

// Apply custom mask (if configured)
wc.MaskHub.applyMask(event, 'custom')
```

### getUnmaskedValue(target)

Get the raw value without mask formatting:

```javascript
const input = document.querySelector('input[name="phone"]');
const unmasked = wc.MaskHub.getUnmaskedValue(input);
// Returns: "8005551212" (no formatting)
```

### updateMaskValue(target, value)

Programmatically update a masked input's value:

```javascript
const input = document.querySelector('input[name="phone"]');
wc.MaskHub.updateMaskValue(input, '5551234567');
// Updates to: (555) 123-4567
```

## Pre-filled Values

Masks automatically format pre-filled values from the database:

```html
<!-- Value from database: "8005551212" -->
<wc-input name="phone" type="tel" value="8005551212">
</wc-input>
<!-- Automatically displays as: (800) 555-1212 -->
```

## With wc-input Integration

The telephone input automatically applies phone mask:

```html
<wc-input name="phone" type="tel" lbl-label="Phone Number" value="8005551212">
</wc-input>
```

The component uses Hyperscript internally:
```html
<input type="tel" _="on load call wc.MaskHub.phoneMask(event)">
```

## Form Submission

### Masked Value
The input's `.value` property contains the **formatted** value:
```javascript
input.value // "(800) 555-1212"
```

### Unmasked Value
To get the raw value for API submission:
```javascript
const unmasked = wc.MaskHub.getUnmaskedValue(input);
// "8005551212"
```

### Example: Form Submit Handler
```javascript
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const phoneInput = form.querySelector('input[name="phone"]');
  const formData = {
    phone: wc.MaskHub.getUnmaskedValue(phoneInput) // Raw value
  };

  // Submit formData to API
});
```

## Adding Custom Masks

You can extend the mask configurations:

```javascript
// Add custom mask after component loads
document.addEventListener('DOMContentLoaded', () => {
  wc.MaskHub.maskConfigs.ein = {
    mask: '00-0000000',
    lazy: false,
    placeholderChar: '_'
  };

  // Create convenience method
  wc.MaskHub.einMask = function(event) {
    this.applyMask(event, 'ein');
  };
});

// Use in HTML
<input type="text" _="on load call wc.MaskHub.einMask(event)">
```

## Advanced: Custom Mask Configuration

For complex requirements, you can define custom IMask configurations:

```javascript
wc.MaskHub.maskConfigs.creditCard = {
  mask: '0000 0000 0000 0000',
  lazy: false
};

wc.MaskHub.maskConfigs.phoneInternational = {
  mask: [
    {
      mask: '(000) 000-0000',
      startsWith: ''
    },
    {
      mask: '+0 (000) 000-0000',
      startsWith: '1'
    }
  ],
  dispatch: function (appended, dynamicMasked) {
    const number = (dynamicMasked.value + appended).replace(/\D/g, '');
    if (number[0] === '1') {
      return dynamicMasked.compiledMasks[1];
    }
    return dynamicMasked.compiledMasks[0];
  }
};
```

## Memory Management

The component automatically:
- ✅ Prevents duplicate mask instances
- ✅ Cleans up when inputs are removed from DOM
- ✅ Uses MutationObserver for automatic cleanup
- ✅ Destroys IMask instances to prevent memory leaks

## Mask Lifecycle

1. **Initialization:** Mask created on `load` event
2. **Check:** Component checks if mask already exists (prevents duplicates)
3. **Apply:** IMask instance created and stored on input element
4. **Format:** Pre-filled values automatically formatted
5. **Cleanup:** MutationObserver watches for removal and destroys mask

## Complete Example

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="dist/wave-css.min.css">
  <script src="https://unpkg.com/hyperscript.org@0.9.12"></script>
</head>
<body>
  <wc-mask-hub></wc-mask-hub>

  <form id="contact-form">
    <div class="col gap-4 p-6">
      <!-- Phone (automatic with wc-input) -->
      <wc-input name="phone"
                type="tel"
                lbl-label="Phone"
                value="8005551212"
                required>
      </wc-input>

      <!-- SSN (manual) -->
      <div class="form-group">
        <label>Social Security Number</label>
        <input type="text"
               name="ssn"
               _="on load call wc.MaskHub.ssnMask(event)"
               value="123456789">
      </div>

      <!-- ZIP Code -->
      <div class="form-group">
        <label>ZIP Code</label>
        <input type="text"
               name="zip"
               _="on load call wc.MaskHub.zipMask(event)"
               value="94102">
      </div>

      <!-- Date -->
      <div class="form-group">
        <label>Date</label>
        <input type="text"
               name="date"
               _="on load call wc.MaskHub.dateMask(event)"
               value="01/15/2024">
      </div>

      <button type="submit" class="btn btn-primary">Submit</button>
    </div>
  </form>

  <script type="module" src="dist/wave-css.min.js"></script>
</body>
</html>
```

## Troubleshooting

### Mask not applying?
- Check that `wc-mask-hub` is on the page
- Verify Hyperscript is loaded
- Check browser console for errors
- Ensure IMask.js loaded successfully

### Pre-filled values not formatted?
- Ensure value is set before mask initialization
- Check that value format is compatible with mask
- Verify the `on load` event is firing

### Multiple masks on same input?
- This should no longer happen - component checks for existing instances
- If it does, check for duplicate Hyperscript event handlers

### Getting raw value for API?
```javascript
// Don't use input.value (formatted)
// Use this instead:
const raw = wc.MaskHub.getUnmaskedValue(input);
```

## IMask.js Reference

This component uses IMask.js v7.6.1:
- [IMask.js Documentation](https://imask.js.org/)
- [GitHub Repository](https://github.com/uNmAnNeR/imaskjs)

## Best Practices

1. **Use appropriate input types:**
   - `type="tel"` for phone numbers (auto-masked in wc-input)
   - `type="text"` for SSN, ZIP, etc.

2. **Extract unmasked values for API:**
   ```javascript
   const raw = wc.MaskHub.getUnmaskedValue(input);
   ```

3. **Store unmasked in database:**
   ```javascript
   // Store: "8005551212" (not "(800) 555-1212")
   ```

4. **Display formatted, submit unformatted:**
   - User sees: `(800) 555-1212`
   - API receives: `8005551212`

5. **Don't manually manage masks:**
   - Let component handle initialization
   - Don't create multiple IMask instances
   - Use provided methods for programmatic updates

## Browser Support

Requires browsers that support:
- Custom Elements v1
- MutationObserver
- ES6+ JavaScript
- IMask.js library
