# WC Article Skeleton Component

The `wc-article-skeleton` is a custom web component that creates a loading skeleton UI for article content. It provides an animated placeholder that can be used while the actual article content is being loaded, improving the perceived performance of your application.

## Features

- Responsive design that adapts to different screen sizes
- Built-in animation for loading effect
- Accessible with proper ARIA attributes
- Customizable through CSS variables
- Inherits from WcBaseComponent for consistent behavior

## Installation

1. Import the required dependencies:

```javascript
import { WcArticleSkeleton } from './wc-article-skeleton.js';
```

2. The component will automatically register itself if it hasn't been registered before.

## Usage

### Basic Usage

Simply add the component to your HTML:

```html
<wc-article-skeleton></wc-article-skeleton>
```

### With Custom Classes

You can add custom classes to modify the appearance:

```html
<wc-article-skeleton class="my-custom-class"></wc-article-skeleton>
```

### With Custom ID

```html
<wc-article-skeleton id="loading-article"></wc-article-skeleton>
```

## Styling

The component uses CSS variables for theming. You can customize the appearance by overriding these variables:

```css
:root {
  --surface-1: #your-background-color;
  --card-border-color: #your-border-color;
  --card-bg-color: #your-skeleton-color;
}
```

### CSS Classes

The component includes several utility classes for spacing and responsiveness:

- `.space-y-8`: Adds vertical spacing between elements
- `.md:space-y-0`: Removes vertical spacing on medium screens
- `.md:space-x-8`: Adds horizontal spacing on medium screens
- `.rtl:space-x-reverse`: Supports right-to-left layouts
- `.sm:w-96`: Sets width on small screens
- Various max-width utilities (e.g., `.max-w-[480px]`)

## Structure

The skeleton consists of:
1. An image placeholder with an SVG icon
2. Multiple text line placeholders with varying widths
3. Proper accessibility attributes including `role="status"` and screen reader text

## Accessibility

The component includes:
- `role="status"` for proper ARIA semantics
- A hidden "Loading..." text for screen readers
- Animated elements for visual feedback

## Events

The component inherits event handling from `WcBaseComponent`. No additional events are implemented specifically for this component.

## Attributes

The component observes and responds to the following attributes:
- `id`: Sets the component's ID
- `class`: Applies custom classes to the component

## Example Implementation

```html
<!DOCTYPE html>
<html>
<head>
  <title>Article Skeleton Demo</title>
</head>
<body>
  <main>
    <!-- Basic usage -->
    <wc-article-skeleton></wc-article-skeleton>
    
    <!-- With custom styling -->
    <wc-article-skeleton class="custom-theme"></wc-article-skeleton>
  </main>

  <script type="module">
    import './wc-article-skeleton.js';
  </script>
</body>
</html>
```

## Browser Support

This component uses modern web technologies including:
- Custom Elements v1
- Shadow DOM
- ES6 Modules
- CSS Custom Properties

Ensure your target browsers support these features or provide appropriate polyfills.

## Dependencies

The component extends `WcBaseComponent` and requires:
- helper-function.js (for utility functions)
- wc-base-component.js (base component class)

## Best Practices

1. Use the skeleton while loading actual content to improve perceived performance
2. Place the skeleton in the same location where the actual content will appear
3. Match the skeleton's dimensions to your actual content for a smooth transition
4. Consider using multiple instances for loading lists or grids of articles

## Troubleshooting

If the skeleton doesn't appear:
1. Ensure all required files are properly imported
2. Check if the custom element is properly registered
3. Verify that CSS variables are properly defined in your application
4. Check browser console for any potential errors
