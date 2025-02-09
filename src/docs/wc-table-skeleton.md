# WC Table Skeleton Component

The `wc-table-skeleton` is a custom web component that creates a loading skeleton UI for table content. It displays an animated placeholder that mimics a data table with headers and rows, providing a smooth loading experience while the actual table data is being fetched.

## Features

- Animated loading effect
- Five-column layout
- Header row plus four data rows
- Responsive design
- Accessible with ARIA attributes
- Equal width columns (1/6 each)
- Customizable through CSS variables
- Extends WcBaseComponent

## Installation

1. Import the component:

```javascript
import { WcTableSkeleton } from './wc-table-skeleton.js';
```

2. The component self-registers if not already registered.

## Usage

### Basic Usage

```html
<wc-table-skeleton></wc-table-skeleton>
```

### With Custom Classes

```html
<wc-table-skeleton class="my-custom-class"></wc-table-skeleton>
```

### With Custom ID

```html
<wc-table-skeleton id="loading-table"></wc-table-skeleton>
```

## Component Structure

The skeleton consists of:
1. Header row with five columns
2. Four data rows with five columns each
3. Each column takes up 1/6 of the available width
4. All cells have consistent height (1rem / 16px)

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
- `.wc-table-skeleton`: Main container
- `.card-bg-color`: Skeleton element background
- `.animate-pulse`: Loading animation
- `.space-y-4`: Vertical spacing between rows
- `.rounded-md`: Rounded corners
- `.shadow`: Container shadow

## Layout Specifications

- Container:
  - Margin: 1rem (16px)
  - Padding: 1rem (16px), increases to 1.5rem (24px) on medium screens
  - Border: 1px solid
  - Rounded corners
  - Shadow effect
- Rows:
  - Vertical spacing: 1rem (16px)
  - Top padding: 1rem (16px)
- Cells:
  - Width: 16.667% (1/6)
  - Height: 1rem (16px)
  - Rounded full corners

## Accessibility

- `role="status"` for semantic meaning
- Screen reader text ("Loading...")
- Proper spacing and contrast ratios
- Semantic structure representing table layout

## Example Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <title>Table Skeleton Demo</title>
  <style>
    :root {
      --surface-1: #ffffff;
      --card-border-color: #e5e7eb;
      --card-bg-color: #f3f4f6;
    }

    /* Optional: Dark theme */
    .dark-theme {
      --surface-1: #1f2937;
      --card-border-color: #374151;
      --card-bg-color: #374151;
    }
  </style>
</head>
<body>
  <!-- Basic table skeleton -->
  <wc-table-skeleton></wc-table-skeleton>
  
  <!-- Dark theme table skeleton -->
  <wc-table-skeleton class="dark-theme"></wc-table-skeleton>

  <script type="module">
    import './wc-table-skeleton.js';
  </script>
</body>
</html>
```

## Use Cases

Perfect for representing loading states of:
- Data tables
- Financial reports
- Analytics dashboards
- User lists
- Product tables
- Comparison charts
- Statistical data

## Best Practices

1. Use when loading tabular data
2. Match column widths to actual table layout
3. Consider responsive breakpoints
4. Implement with appropriate loading states
5. Use consistent spacing with actual table

## Integration Examples

### With Loading State

```javascript
function toggleTableLoading(isLoading) {
  const tableContent = document.querySelector('#data-table');
  const tableSkeleton = document.querySelector('#loading-table-skeleton');
  
  tableContent.style.display = isLoading ? 'none' : 'table';
  tableSkeleton.style.display = isLoading ? 'block' : 'none';
}
```

### With Async Data Fetch

```javascript
async function loadTableData() {
  const tableSkeleton = document.querySelector('wc-table-skeleton');
  tableSkeleton.style.display = 'block';
  
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    renderTable(data);
  } finally {
    tableSkeleton.style.display = 'none';
  }
}
```

## Technical Details

### Attributes

Observed attributes:
- `id`: Sets component ID
- `class`: Applies custom classes

### Browser Support

Requirements:
- Custom Elements v1
- CSS Custom Properties
- CSS Flexbox
- Modern JavaScript (ES6+)

### Dependencies

- `WcBaseComponent` (base component class)
- `helper-function.js` (utility functions)

## Performance Considerations

1. Animation Performance
   - Uses GPU-accelerated animations
   - Minimal DOM updates
   - Efficient style calculations

2. Layout Performance
   - Uses flexbox for efficient layouts
   - Minimal nesting depth
   - Optimized reflow handling

## Troubleshooting

Common issues and solutions:

1. Layout Issues
   - Check container width
   - Verify flex layout support
   - Inspect column width calculations

2. Animation Problems
   - Verify `animate-pulse` class
   - Check CSS variable definitions
   - Inspect browser support

3. Styling Conflicts
   - Check CSS specificity
   - Verify class name conflicts
   - Inspect inherited styles

## Event Handling

The component inherits event handling from `WcBaseComponent`. No additional events are implemented specifically for this component.

## CSS Customization Tips

### Modifying Animation Speed

```css
.wc-table-skeleton {
  animation-duration: 2s; /* Default is 1s */
}
```

### Custom Column Widths

```css
.wc-table-skeleton .w-1\/6 {
  width: 20%; /* Change from default 1/6 */
}
```

### Custom Spacing

```css
.wc-table-skeleton .space-y-4 > * + * {
  margin-top: 1.5rem; /* Increase row spacing */
}
```
