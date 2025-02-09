# WC-Split-Button Component Documentation

A customizable split button web component that combines a primary action button with a dropdown menu for additional options.

## Features

- Primary action button with custom click handler
- Dropdown menu for additional actions
- Customizable positioning for dropdown menu
- Flexible styling options
- Support for multiple dropdown items
- Smart fallback positioning

## Installation

Import the required component:

```javascript
import './wc-split-button.js';
```

## Basic Usage

```html
<wc-split-button id="my-button" label="Primary Action">
  <a id="option1" class="btn">Option 1</a>
  <a id="option2" class="btn">Option 2</a>
</wc-split-button>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| id | string | - | Unique identifier for the button |
| label | string | - | Text displayed on the primary button |
| position-area | string | "bottom span-right" | Position of the dropdown menu |
| position-try-fallbacks | string | "--bottom-right, --bottom-left, --top-right, --top-left, --right, --left" | Fallback positions for the dropdown |
| onclick | string | - | JavaScript code to execute when primary button is clicked |
| split-class | string | - | Additional CSS classes for the split button container |

## Dropdown Position Options

The component supports various positioning options through the `position-area` attribute:

- `bottom span-right`: Dropdown appears below, aligned to right
- `bottom span-left`: Dropdown appears below, aligned to left
- `top span-right`: Dropdown appears above, aligned to right
- `top span-left`: Dropdown appears above, aligned to left
- `right`: Dropdown appears to the right
- `left`: Dropdown appears to the left

## Examples

### Basic Split Button
```html
<wc-split-button id="basic-button" label="Actions">
  <a id="action1" class="btn">Action 1</a>
  <a id="action2" class="btn">Action 2</a>
</wc-split-button>
```

### Split Button with Click Handler
```html
<wc-split-button 
  id="generate-code" 
  label="Generate Code"
  onclick="handleGenerateCode();">
  <a id="generate-detail" class="btn">Generate Detail</a>
  <a id="generate-table" class="btn">Generate Table</a>
</wc-split-button>
```

### Custom Positioned Split Button
```html
<wc-split-button 
  id="custom-position" 
  label="Options"
  position-area="top span-left">
  <a id="option1" class="btn">Option 1</a>
  <a id="option2" class="btn">Option 2</a>
</wc-split-button>
```

### Split Button with Custom Styling
```html
<wc-split-button 
  id="styled-button" 
  label="Actions"
  split-class="theme-primary custom-width">
  <a id="action1" class="btn">Action 1</a>
  <a id="action2" class="btn">Action 2</a>
</wc-split-button>
```

## Styling

The component uses CSS custom properties for theming:

```css
:root {
  --button-bg-color: /* Button background color */
  --button-color: /* Button text color */
  --button-border-color: /* Button border color */
  --button-hover-bg-color: /* Button hover background color */
  --button-hover-color: /* Button hover text color */
  --component-border-color: /* Border color for split line */
}
```

### CSS Classes

- `.wc-split-button`: Main container
- `.btn`: Button styles
- `.dropdown`: Dropdown container
- `.dropdown-content`: Dropdown menu content

## Event Handling

### Primary Button
- Set click handler using the `onclick` attribute
- Handler is executed when the main button is clicked

### Dropdown Items
- Add click handlers to individual dropdown items using standard event listeners
- Use the `id` attribute to target specific items

```javascript
document.querySelector('#action1').addEventListener('click', () => {
  // Handle action1 click
});
```

## Best Practices

1. **Unique IDs**
   - Always provide unique IDs for split buttons and dropdown items
   - Use descriptive IDs that reflect the action

2. **Positioning**
   - Consider the button's location when choosing dropdown position
   - Provide fallback positions for better usability
   - Test dropdown visibility in different container contexts

3. **Styling**
   - Use provided CSS custom properties for consistent theming
   - Apply split-class for custom styling without affecting other components

4. **Accessibility**
   - Provide clear, descriptive labels
   - Ensure sufficient color contrast
   - Consider keyboard navigation patterns

## Browser Support

Requires browsers that support:
- Custom Elements v1
- CSS Custom Properties
- CSS Position API
- ES6 Modules

## Known Limitations

- No built-in keyboard navigation
- Limited mobile touch support
- Dropdown positioning may need adjustment in complex layouts
- No support for nested dropdowns

## Additional Notes

- The dropdown appears on hover by default
- The split line is automatically added between the main button and dropdown trigger
- The component handles its own cleanup on disconnection
- The dropdown width automatically matches the button width
