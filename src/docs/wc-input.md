# WC-Input Component Documentation

The `wc-input` is a versatile web component that provides enhanced form input functionality with support for various input types, styling, and validation.

## Installation

```javascript
import { WcInput } from './wc-input.js';
```

## Basic Usage

```html
<wc-input 
  name="username" 
  lbl-label="Username" 
  value="johndoe" 
  required>
</wc-input>
```

## Features

- Support for all standard HTML input types
- Custom input types (currency, toggle switches)
- Radio button groups with modern styling
- Built-in validation
- Icon support for specific input types
- Label customization
- Disabled/readonly states
- Required field indication

## Props & Attributes

### Core Attributes
- `name`: Input field name (required)
- `type`: Input type (default: "text")
- `value`: Input value
- `lbl-label`: Label text
- `lbl-class`: Custom label CSS classes
- `placeholder`: Placeholder text

### State Attributes
- `disabled`: Disables the input
- `readonly`: Makes the input read-only
- `required`: Makes the field required
- `checked`: For checkbox/radio inputs
- `autofocus`: Automatically focus the input

### Validation Attributes
- `min`: Minimum value
- `max`: Maximum value
- `minlength`: Minimum text length
- `maxlength`: Maximum text length
- `pattern`: Validation pattern
- `novalidate`: Disables validation

## Input Types

### Text Input
```html
<wc-input 
  name="first_name" 
  lbl-label="First Name" 
  value="John" 
  required>
</wc-input>
```

### Email Input with Icon
```html
<wc-input 
  name="email" 
  type="email" 
  lbl-label="Email" 
  value="john@example.com">
</wc-input>
```

### Phone Input with Mask
```html
<wc-input 
  name="phone" 
  type="tel" 
  lbl-label="Phone" 
  value="8005551212">
</wc-input>
```

### Currency Input
```html
<wc-input 
  name="budget" 
  type="currency" 
  lbl-label="Budget" 
  value="1500.00" 
  step="0.01" 
  min="1" 
  max="10000">
</wc-input>
```

### Checkbox Toggle Switch
```html
<wc-input 
  name="is_active" 
  type="checkbox" 
  lbl-label="Is Active?" 
  toggle-switch>
</wc-input>
```

### Radio Button Group
```html
<wc-input 
  name="gender" 
  type="radio" 
  lbl-label="Gender" 
  radio-group-class="row" 
  value="male" 
  options='[
    {"key": "Female", "value": "female"}, 
    {"key": "Male", "value": "male"}
  ]'>
</wc-input>
```

### Modern Radio Button Group
```html
<wc-input 
  name="gender" 
  type="radio" 
  lbl-label="Gender" 
  radio-group-class="row modern" 
  value="male">
  <option value="male">Male</option>
  <option value="female">Female</option>
</wc-input>
```

## Styling

The component uses CSS custom properties for theming:

```css
--component-bg-color: Background color
--component-border-color: Border color
--primary-bg-color: Primary color for active states
--primary-color: Text color for primary state
--toggle-on: Toggle switch on state color
--toggle-off: Toggle switch off state color
```

### Radio Group Styles
- Default style: Standard radio buttons
- Modern style: Button-like appearance with `radio-group-class="modern"`
- Layout options: `row` or `col` class for horizontal/vertical alignment

## Validation and States

### Required Fields
- Add `required` attribute
- Automatically adds asterisk (*) to label
- Validates on form submission

### Disabled State
```html
<wc-input 
  name="username" 
  lbl-label="Username" 
  disabled>
</wc-input>
```

### Read-only State
```html
<wc-input 
  name="username" 
  lbl-label="Username" 
  readonly>
</wc-input>
```

## Event Handling

The component handles standard HTML input events:
- `input`
- `change`
- `focus`
- `blur`

## Best Practices

1. Form Layout:
   - Use grid/flex classes for responsive layouts
   - Group related inputs
   - Maintain consistent spacing

2. Validation:
   - Add appropriate validation attributes
   - Provide clear validation feedback
   - Use appropriate input types

3. Accessibility:
   - Always provide labels
   - Use semantic markup
   - Include proper ARIA attributes

## Example Layouts

### Two-Column Form
```html
<div class="row gap-4">
  <wc-input 
    class="col" 
    name="first_name" 
    lbl-label="First" 
    required>
  </wc-input>
  <wc-input 
    class="col" 
    name="last_name" 
    lbl-label="Last" 
    required>
  </wc-input>
</div>
```

## Browser Support

Requires browsers that support:
- Custom Elements v1
- CSS Custom Properties
- CSS Grid/Flexbox
- Standard HTML5 input types
