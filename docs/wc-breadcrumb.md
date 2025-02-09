# WC Breadcrumb Component

The `wc-breadcrumb` is a custom web component that creates a navigation breadcrumb trail with HTMX integration. It consists of a main container component (`wc-breadcrumb`) and individual items (`wc-breadcrumb-item`), providing an intuitive way to show hierarchical navigation.

## Features

- HTMX-powered navigation
- SVG icons for home and separators
- Responsive design
- Flexible item structure
- Customizable through CSS
- Extends WcBaseComponent

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

1. Import the components:

```javascript
import { WcBreadcrumb } from './wc-breadcrumb.js';
import { WcBreadcrumbItem } from './wc-breadcrumb-item.js';
```

2. The components self-register if not already registered.

## Usage

### Basic Usage

```html
<wc-breadcrumb>
  <wc-breadcrumb-item label="Home" link="/v/home"></wc-breadcrumb-item>
  <wc-breadcrumb-item label="Screens" link="/v/screen_list/list"></wc-breadcrumb-item>
  <wc-breadcrumb-item label="Current Page"></wc-breadcrumb-item>
</wc-breadcrumb>
```

### With Custom Classes

```html
<wc-breadcrumb class="my-custom-breadcrumb">
  <wc-breadcrumb-item label="Home" link="/v/home"></wc-breadcrumb-item>
  <wc-breadcrumb-item label="Current" link=""></wc-breadcrumb-item>
</wc-breadcrumb>
```

## Component Structure

### WcBreadcrumb

The main container component that:
- Manages the overall breadcrumb structure
- Handles item rendering
- Provides navigation functionality
- Renders separators between items

### WcBreadcrumbItem

Individual breadcrumb items that:
- Hold label and link information
- Support HTMX attributes
- Can be either links or text-only (for current page)

## Attributes

### WcBreadcrumb Attributes
| Attribute | Description          | Default |
|-----------|---------------------|---------|
| `id`      | Component ID        | -       |
| `class`   | Additional classes  | -       |

### WcBreadcrumbItem Attributes
| Attribute | Description        | Default |
|-----------|-------------------|---------|
| `label`   | Item text         | `""`    |
| `link`    | Navigation URL    | `""`    |
| `id`      | Component ID      | -       |
| `class`   | Additional classes| -       |

## HTMX Integration

The component includes HTMX attributes for dynamic navigation:

```html
<a href="/path"
   hx-get="/path"
   hx-target="#viewport"
   hx-swap="innerHTML transition:true"
   hx-push-url="true"
   hx-indicator="#content-loader">
   Label
</a>
```

## Styling

### Default Classes

```css
.wc-breadcrumb {
  display: flex;
  flex-direction: row;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  gap: 0.75rem;
}
```

### Customization Examples

#### Custom Colors

```css
.wc-breadcrumb a {
  color: #4a5568;
}

.wc-breadcrumb a:hover {
  color: #2d3748;
}

.wc-breadcrumb span {
  color: #718096;
}
```

#### Custom Separator

```css
.wc-breadcrumb svg {
  width: 1.25rem;
  height: 1.25rem;
  stroke: currentColor;
}
```

## Example Implementations

### Basic Navigation

```html
<wc-breadcrumb>
  <wc-breadcrumb-item label="" link="/v/home"></wc-breadcrumb-item>
  <wc-breadcrumb-item label="Products" link="/products"></wc-breadcrumb-item>
  <wc-breadcrumb-item label="Category" link="/products/category"></wc-breadcrumb-item>
  <wc-breadcrumb-item label="Item Name"></wc-breadcrumb-item>
</wc-breadcrumb>
```

### With Custom Icons

```html
<style>
  .custom-breadcrumb svg {
    width: 1rem;
    height: 1rem;
  }
</style>

<wc-breadcrumb class="custom-breadcrumb">
  <!-- Breadcrumb items -->
</wc-breadcrumb>
```

## Best Practices

1. Structure
   - Keep breadcrumb trails logical and hierarchical
   - Use clear, concise labels
   - Include home icon for root navigation
   - Make current page non-clickable

2. Implementation
   - Ensure HTMX targets exist in the DOM
   - Maintain consistent styling across pages
   - Consider mobile responsiveness
   - Use meaningful URLs in link attributes

3. Accessibility
   - Maintain proper contrast ratios
   - Use semantic HTML
   - Include proper ARIA attributes
   - Ensure keyboard navigation support

## Technical Details

### Component Logic

The breadcrumb component:
1. Collects items from child elements
2. Generates navigation structure
3. Handles HTMX integration
4. Manages separator icons

### Event Handling

The component inherits event handling from `WcBaseComponent`. No additional events are implemented specifically for this component.

## Browser Support

Requirements:
- Custom Elements v1
- CSS Flexbox
- Modern JavaScript (ES6+)
- HTMX library

## Dependencies

- `WcBaseComponent` (base component class)
- `helper-function.js` (utility functions)
- HTMX library for dynamic navigation

## Troubleshooting

Common issues and solutions:

1. Navigation Not Working
   - Verify HTMX installation
   - Check target element existence
   - Inspect network requests
   - Verify URL paths

2. Styling Issues
   - Check CSS specificity
   - Verify class application
   - Inspect flex layout
   - Check icon rendering

3. Item Rendering
   - Verify label attributes
   - Check link paths
   - Inspect DOM structure
   - Verify item creation

## Performance Considerations

- Minimal DOM manipulation
- Efficient attribute handling
- Optimized SVG usage
- Smart update detection

## Security Notes

- URLs are rendered as-is
- Consider URL sanitization
- Validate navigation paths
- Implement proper access controls
