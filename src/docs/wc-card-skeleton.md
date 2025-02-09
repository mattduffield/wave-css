# WC Card Skeleton Component

The `wc-card-skeleton` is a custom web component that creates a loading skeleton UI for card content. It displays an animated placeholder with an image area, text lines, and an avatar section, providing a smooth loading experience while the actual card content is being fetched.

## Features

- Animated loading effect
- Responsive design
- Accessible with ARIA attributes
- Card-style layout with image placeholder
- Avatar section with user information placeholder
- Customizable through CSS variables
- Extends WcBaseComponent for consistent behavior

## Installation

1. Import the component:

```javascript
import { WcCardSkeleton } from './wc-card-skeleton.js';
```

2. The component will self-register if it hasn't been registered before.

## Usage

### Basic Usage

Add the component to your HTML:

```html
<wc-card-skeleton></wc-card-skeleton>
```

### With Custom Classes

```html
<wc-card-skeleton class="my-custom-class"></wc-card-skeleton>
```

### With Custom ID

```html
<wc-card-skeleton id="loading-card"></wc-card-skeleton>
```

## Component Structure

The skeleton card consists of:

1. Image placeholder section with icon
2. Title placeholder (wider line)
3. Three content text line placeholders
4. Avatar section with:
   - User icon
   - Two-line user information placeholder

## Styling

### CSS Variables

The component uses the following CSS variables for theming:

```css
:root {
  --surface-1: #your-background-color;
  --card-border-color: #your-border-color;
  --card-bg-color: #your-skeleton-color;
  --text-color-2: #your-icon-color;
}
```

### Default Classes

The component comes with several utility classes:

- `.max-w-full`: Full width container
- `.animate-pulse`: Loading animation
- `.card-bg-color`: Background color for skeleton elements
- `.rounded-md`: Rounded corners
- `.shadow`: Card shadow effect

## Accessibility

The component implements several accessibility features:

- `role="status"` for semantic meaning
- Screen reader text ("Loading...")
- SVG icons marked as `aria-hidden="true"`
- Proper heading hierarchy

## Attributes

Observed attributes:
- `id`: Sets the component's ID
- `class`: Applies custom classes

## Example Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <title>Card Skeleton Demo</title>
  <style>
    :root {
      --surface-1: #ffffff;
      --card-border-color: #e5e7eb;
      --card-bg-color: #f3f4f6;
      --text-color-2: #9ca3af;
    }
  </style>
</head>
<body>
  <!-- Basic card skeleton -->
  <wc-card-skeleton></wc-card-skeleton>
  
  <!-- With custom styling -->
  <wc-card-skeleton class="dark-theme"></wc-card-skeleton>

  <script type="module">
    import './wc-card-skeleton.js';
  </script>
</body>
</html>
```

## Layout Specifications

The component uses the following dimensions:

- Card padding: 1rem (16px), increases to 1.5rem (24px) on medium screens
- Image placeholder height: 12rem (192px)
- Title line height: 0.625rem (10px)
- Content line height: 0.5rem (8px)
- Avatar icon size: 2.5rem (40px)

## Best Practices

1. Use when loading card-based content
2. Match the skeleton dimensions to your actual card content
3. Implement with appropriate loading states in your application
4. Consider using multiple instances for card grids or lists

## Use Cases

- Blog post cards
- User profile cards
- Product cards
- Media content cards
- Social media post previews

## Customization Examples

### Dark Theme

```css
.dark-theme {
  --surface-1: #1f2937;
  --card-border-color: #374151;
  --card-bg-color: #374151;
  --text-color-2: #6b7280;
}
```

### Custom Spacing

```css
.custom-spacing {
  --card-padding: 2rem;
  --content-spacing: 1.5rem;
}
```

## Browser Support

Requirements:
- Custom Elements v1
- CSS Custom Properties
- Modern CSS (Flexbox, Grid)
- ES6+ JavaScript

## Dependencies

- `WcBaseComponent` (base component class)
- `helper-function.js` (utility functions)

## Troubleshooting

Common issues and solutions:

1. Skeleton not visible
   - Check CSS variable definitions
   - Verify component registration
   - Ensure proper path to dependencies

2. Animation not working
   - Verify `animate-pulse` class is present
   - Check browser support for animations
   - Confirm no CSS conflicts

3. Styling issues
   - Check CSS variable overrides
   - Verify class name conflicts
   - Inspect CSS specificity

## Performance Considerations

- Component uses minimal DOM elements
- Animations are hardware-accelerated
- Lazy loading of assets
- Efficient attribute handling
