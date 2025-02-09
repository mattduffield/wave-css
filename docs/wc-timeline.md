# WC-Timeline Web Component

A custom web component that creates a responsive, vertical timeline with alternating left and right entries. The timeline includes visual elements like connecting lines, dots, and cards for content display.

## Features

- Responsive design
- Alternating left/right layout
- Mobile-friendly view
- CSS customizable
- Two ways to define timeline items
- Automatic card creation
- HTMX compatible

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

Include the required JavaScript file:

```html
<script type="module" src="path/to/wc-timeline.js"></script>
```

## Basic Usage

There are two ways to create a timeline:

### 1. Using Option Elements (Declarative)

```html
<wc-timeline id="timeline">
  <option value="2023">
    Content for 2023 goes here. This will be displayed in a card.
  </option>
  <option value="2022">
    Content for 2022 goes here. This will be displayed in a card.
  </option>
</wc-timeline>
```

### 2. Using JSON Items Attribute (Programmatic)

```html
<wc-timeline id="timeline"
  items='[
    {
      "label": "2023",
      "content": "Content for 2023 goes here"
    },
    {
      "label": "2022",
      "content": "Content for 2022 goes here"
    }
  ]'>
</wc-timeline>
```

## Attributes

| Attribute | Type   | Default | Description                    |
|-----------|--------|---------|--------------------------------|
| id        | string | -       | Element identifier             |
| class     | string | -       | Additional CSS classes         |
| items     | string | -       | JSON string of timeline items  |

## Timeline Item Structure

When using the items attribute, each item should have this structure:

```javascript
{
  "label": "string",    // The header text for the timeline entry
  "content": "string"   // The content text for the timeline entry
}
```

## Styling

The component uses CSS custom properties for theming:

```css
:root {
  --primary-bg-color: #color;        /* Timeline line color */
  --component-color: #color;         /* Timeline dot color */
  --container-border-color: #color;  /* Timeline dot border color */
  --card-bg-color: #color;          /* Card background color */
  --card-color: #color;             /* Card text color */
}
```

### CSS Classes

- `.wc-timeline` - Main timeline container
- `.timeline-container` - Individual entry container
- `.timeline-card` - Content card
- `.left` - Left-side entry
- `.right` - Right-side entry

## Responsive Behavior

The timeline automatically adjusts for different screen sizes:
- Desktop: Alternating left/right layout
- Mobile (<600px): Single column layout with all entries on the left

## Example Implementation

```html
<wc-timeline id="company-history">
  <option value="2023">
    Launched new product line and expanded to international markets.
  </option>
  <option value="2022">
    Achieved record sales and opened three new offices.
  </option>
  <option value="2021">
    Company founded with initial seed funding.
  </option>
</wc-timeline>
```

## Styling Examples

### Custom Timeline Colors

```css
.wc-timeline {
  --primary-bg-color: #e0e0e0;
  --component-color: #2196f3;
  --container-border-color: #ffffff;
  --card-bg-color: #f5f5f5;
  --card-color: #333333;
}
```

### Custom Card Styling

```css
.wc-timeline .timeline-card {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  border-radius: 8px;
}
```

## Technical Details

- Extends `WcBaseComponent`
- Uses standard DOM elements (no Shadow DOM)
- Automatically processes HTMX if available
- Responsive design using CSS media queries
- Option elements are processed and removed from DOM

## Browser Support

Requires browsers that support:
- Custom Elements v1
- ES6 Modules
- CSS Grid/Flexbox
- CSS Custom Properties

## Best Practices

1. Use consistent content lengths for balanced appearance
2. Provide meaningful labels for timeline entries
3. Consider mobile viewing when writing content
4. Test with various content lengths
5. Use CSS custom properties for theming

## Limitations

- Content is static after initialization
- Timeline entries must have both label and content
- No built-in animations (can be added via CSS)
- All entries have the same visual style

