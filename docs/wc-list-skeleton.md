# WC List Skeleton Component

The `wc-list-skeleton` is a custom web component that creates a loading skeleton UI for list content. It displays an animated placeholder for a list with multiple items, each containing a title, description, and a side value, making it perfect for representing loading states of lists, tables, or feeds.

## Features

- Animated loading effect
- Responsive list layout
- Five placeholder items by default
- Two-line content for each item
- Right-aligned value placeholder for each item
- Accessible design with ARIA attributes
- Customizable through CSS variables
- Extends WcBaseComponent

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

1. Import the component:

```javascript
import { WcListSkeleton } from './wc-list-skeleton.js';
```

2. The component self-registers if not already registered.

## Usage

### Basic Usage

```html
<wc-list-skeleton></wc-list-skeleton>
```

### With Custom Classes

```html
<wc-list-skeleton class="my-custom-class"></wc-list-skeleton>
```

### With Custom ID

```html
<wc-list-skeleton id="my-loading-list"></wc-list-skeleton>
```

## Component Structure

Each list item in the skeleton contains:
1. Left section (5/6 width):
   - Title placeholder (3/6 width)
   - Description placeholder (5/6 width)
2. Right section (1/6 width):
   - Value placeholder

## Styling

### CSS Variables

The component uses these CSS variables for theming:

```css
:root {
  --surface-1: #your-background-color;
  --card-border-color: #your-border-color;
  --card-bg-color: #your-skeleton-color;
}
```

### Built-in Classes

Key utility classes:
- `.wc-list-skeleton`: Main container
- `.card-bg-color`: Skeleton element background
- `.animate-pulse`: Loading animation
- `.space-y-4`: Vertical spacing between items
- `.rounded-md`: Rounded corners
- `.shadow`: Container shadow

## Layout Specifications

- Container padding: 1rem (16px), increases to 1.5rem (24px) on medium screens
- Vertical spacing between items: 1rem (16px)
- Item structure:
  - Main content: 83.333% width (w-5/6)
  - Side value: 16.667% width (w-1/6)
  - Title height: 0.625rem (10px)
  - Description height: 0.5rem (8px)

## Accessibility

- `role="status"` for semantic meaning
- Screen reader text for loading state
- Proper spacing and contrast ratios
- Semantic HTML structure

## Example Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <title>List Skeleton Demo</title>
  <style>
    :root {
      --surface-1: #ffffff;
      --card-border-color: #e5e7eb;
      --card-bg-color: #f3f4f6;
    }
  </style>
</head>
<body>
  <!-- Basic list skeleton -->
  <wc-list-skeleton></wc-list-skeleton>
  
  <!-- Dark theme example -->
  <wc-list-skeleton class="dark-theme"></wc-list-skeleton>

  <script type="module">
    import './wc-list-skeleton.js';
  </script>
</body>
</html>
```

## Use Cases

Perfect for representing loading states of:
- Data tables
- Settings lists
- Transaction histories
- Activity feeds
- Comment sections
- Menu items
- Configuration lists

## Customization Examples

### Dark Theme

```css
.dark-theme {
  --surface-1: #1f2937;
  --card-border-color: #374151;
  --card-bg-color: #374151;
}
```

### Custom Spacing

```css
.custom-spacing {
  --list-item-spacing: 2rem;
  --container-padding: 2rem;
}
```

## Best Practices

1. Use when loading list-based content
2. Match skeleton dimensions to actual content
3. Maintain consistent spacing with loaded content
4. Consider using with error boundaries
5. Implement with appropriate loading states

## Technical Details

### Attributes

Observed attributes:
- `id`: Sets component ID
- `class`: Applies custom classes

### CSS Classes Structure

```css
.wc-list-skeleton {
  /* Container styles */
}

.space-y-4 > * + * {
  /* Vertical spacing */
}

.md\:p-6 {
  /* Responsive padding */
}

.shadow {
  /* Shadow effects */
}
```

## Browser Support

Requirements:
- Custom Elements v1
- CSS Custom Properties
- CSS Flexbox
- Modern JavaScript (ES6+)

## Dependencies

- `WcBaseComponent` (base component class)
- `helper-function.js` (utility functions)

## Performance Considerations

1. Efficient DOM structure
   - Minimal nesting
   - Reusable elements
   - Optimized class structure

2. Animation Performance
   - Hardware-accelerated animations
   - Minimal repaints
   - Efficient transforms

3. Resource Loading
   - Lazy loading capability
   - Minimal initial footprint
   - Efficient style application

## Troubleshooting

Common issues and solutions:

1. Animation not visible
   - Check `animate-pulse` class presence
   - Verify CSS variable definitions
   - Check for animation conflicts

2. Layout issues
   - Verify container width constraints
   - Check flex layout compatibility
   - Inspect CSS variable overrides

3. Style conflicts
   - Check CSS specificity
   - Verify class name conflicts
   - Inspect inherited styles

## Code Examples

### Integration with Loading State

```javascript
function toggleLoading(isLoading) {
  const content = document.querySelector('#content');
  const skeleton = document.querySelector('#loading-skeleton');
  
  if (isLoading) {
    content.style.display = 'none';
    skeleton.style.display = 'block';
  } else {
    skeleton.style.display = 'none';
    content.style.display = 'block';
  }
}
```
