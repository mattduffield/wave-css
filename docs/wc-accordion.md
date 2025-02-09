# WC-Accordion Component Documentation

A customizable accordion web component that provides collapsible content sections with smooth animations and flexible configuration options.

## Features

- Multiple content sections with expand/collapse functionality
- Smooth animations for section transitions
- Support for both declarative and programmatic content definition
- Allow single or multiple sections to be open simultaneously
- Event-driven API for external control
- Customizable styling through CSS variables

## Demo
[wc-accordion](../views/accordion.html)

## Installation

Include the required JavaScript file:

```html
<script type="module" src="path/to/wc-accordion.js"></script>
```

## Basic Usage

### Declarative Approach
```html
<wc-accordion class="mb-4">
  <option value="Section 1" selected>
    This is the content for section 1. It will be expanded by default.
  </option>
  <option value="Section 2">
    This is the content for section 2.
  </option>
</wc-accordion>
```

### JSON Configuration Approach
```html
<wc-accordion id="my-accordion"
  items='[
    {
      "label": "Section 1",
      "content": "This is the content for section 1.",
      "selected": true
    },
    {
      "label": "Section 2",
      "content": "This is the content for section 2.",
      "selected": false
    }
  ]'>
</wc-accordion>
```

## Component Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | String | null | Unique identifier for the accordion |
| `class` | String | null | CSS classes to apply to the component |
| `items` | String (JSON) | [] | JSON array of accordion items |
| `allow-many` | Boolean | false | Allow multiple sections to be open simultaneously |

## Item Structure

When using the JSON configuration approach, each item should have the following structure:

```javascript
{
  "label": String,     // The header text for the section
  "content": String,   // The HTML content for the section
  "selected": Boolean  // Whether the section should be expanded by default
}
```

## JavaScript API

The component provides an event-driven API for external control:

### Opening a Section
```javascript
wc.EventHub.broadcast('wc-accordion:open', 
  ['[data-wc-id="accordion-id"]'], 
  '.accordion-header:nth-of-type(1)'
);
```

### Closing a Section
```javascript
wc.EventHub.broadcast('wc-accordion:close', 
  ['[data-wc-id="accordion-id"]'], 
  '.accordion-header:nth-of-type(1)'
);
```

### Toggling a Section
```javascript
wc.EventHub.broadcast('wc-accordion:toggle', 
  ['[data-wc-id="accordion-id"]'], 
  '.accordion-header:nth-of-type(2)'
);
```

## Styling

The component can be styled using CSS variables:

```css
:root {
  --button-bg-color: #f4f4f4;
  --button-color: #444;
  --button-hover-bg-color: #ddd;
  --button-hover-color: #222;
  --primary-color: #2196F3;
  --component-bg-color: #fff;
  --component-color: #333;
}
```

### CSS Classes

- `.wc-accordion`: Main container class
- `.accordion-header`: Section header buttons
- `.accordion-panel`: Content panels
- `.active`: Applied to currently active/expanded sections

## Examples

### Basic Accordion with Multiple Sections
```html
<wc-accordion>
  <option value="Personal Information">
    <form>
      <label>Name:</label>
      <input type="text">
    </form>
  </option>
  <option value="Payment Details">
    <form>
      <label>Card Number:</label>
      <input type="text">
    </form>
  </option>
</wc-accordion>
```

### Allow Multiple Open Sections
```html
<wc-accordion allow-many>
  <option value="Section 1">
    Content for section 1
  </option>
  <option value="Section 2">
    Content for section 2
  </option>
</wc-accordion>
```

### Programmatically Controlled Accordion
```html
<wc-accordion id="dynamic-accordion"
  items='[
    {
      "label": "Dynamic Content 1",
      "content": "<div>Content loaded dynamically</div>",
      "selected": true
    }
  ]'>
</wc-accordion>

<script>
// Open first section
wc.EventHub.broadcast('wc-accordion:open', 
  ['#dynamic-accordion'], 
  '.accordion-header:first-child'
);
</script>
```

## Best Practices

1. Use meaningful section labels that clearly indicate the content
2. Keep content concise and focused within each section
3. Use the `selected` attribute to define the initial state
4. Consider using `allow-many` for related but independent content sections
5. Ensure content is accessible when using HTML in the content area
6. Use CSS variables for consistent styling across your application
7. Consider mobile responsiveness when adding content to sections

## Browser Support

The component uses standard Web Components APIs and should work in all modern browsers that support Custom Elements v1.

## Technical Details

- Transitions are handled using CSS max-height property for smooth animations
- Section state is managed internally using the active class
- Content panels use overflow: hidden for clean transitions
- Headers use flexbox for proper layout of text and indicators
- The component extends WcBaseComponent for consistent behavior

