# WC-Image Component Documentation

The `wc-image` is a versatile web component that provides enhanced image display capabilities, including modal viewing and hover overlay effects.

## Features

- Basic image display with captions
- Modal view support
- Hover overlay effects with multiple animation directions
- Custom content overlay support
- Event-driven control for modal display

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

1. Import the required files:
```javascript
import { WcImage } from './wc-image.js';
```

## Basic Usage

```html
<wc-image
  url="path/to/image.jpg"
  caption="Image Caption">
</wc-image>
```

## Props & Attributes

1. `url` (required): URL of the image to display
2. `caption`: Caption text for the image
3. `modal`: Enable modal view functionality
4. `hover-overlay`: Enable hover overlay effects
5. `hover-mode`: Direction of hover animation ("left", "right", "top", "bottom")

## Usage Examples

### Basic Image with Caption
```html
<wc-image
  url="path/to/image.jpg"
  caption="Simple Image">
</wc-image>
```

### Modal Image
```html
<wc-image
  modal
  url="path/to/image.jpg"
  caption="Click to Enlarge">
</wc-image>
```

### Hover Overlay with Custom Content
```html
<wc-image
  hover-overlay
  hover-mode="left"
  url="path/to/image.jpg"
  caption="Hover for Details">
  <div class="col-1 gap-2 p-10">
    <p>Custom overlay content goes here</p>
  </div>
</wc-image>
```

## Hover Overlay Modes

The component supports four hover animation directions:

1. `left`: Overlay slides in from the left
```html
<wc-image hover-overlay hover-mode="left" ...>
```

2. `right`: Overlay slides in from the right
```html
<wc-image hover-overlay hover-mode="right" ...>
```

3. `top`: Overlay slides in from the top
```html
<wc-image hover-overlay hover-mode="top" ...>
```

4. `bottom`: Overlay slides in from the bottom (default)
```html
<wc-image hover-overlay hover-mode="bottom" ...>
```

## JavaScript API

The component can be controlled programmatically through events:

```javascript
// Show modal
wc.EventHub.broadcast('wc-image:show', ['[data-wc-id="component-id"]']);

// Hide modal
wc.EventHub.broadcast('wc-image:hide', ['[data-wc-id="component-id"]']);
```

## Styling

The component uses CSS custom properties for theming:

```css
--card-bg-color: Background color for overlay content
```

### Default Styling Features:

- Maximum image height: 300px
- Responsive width (100%)
- Object-fit: cover
- Smooth transitions (0.3s)
- Modal overlay with semi-transparent black background
- Zoom animation for modal images

## Layout and Grid Integration

The component works well with grid and flex layouts:

```html
<div class="row gap-4 p-6">
  <wc-image ...></wc-image>
  <wc-image ...></wc-image>
</div>
```

## Technical Details

1. Modal Features:
   - Full-screen overlay
   - Close button
   - Click-to-zoom animation
   - Caption support in modal view

2. Hover Overlay Features:
   - Smooth transitions (0.5s)
   - Customizable content
   - Direction-based animations
   - Overflow handling

## Event Handling

The component listens for:
- Click events for modal toggling
- Custom events for programmatic control
- Hover events for overlay effects

## Accessibility

- Images include alt text (using caption value)
- Modal can be closed via button
- Keyboard navigation support in modal view

## Best Practices

1. Image Optimization:
   - Use appropriate image sizes
   - Consider loading performance
   - Provide meaningful captions

2. Overlay Content:
   - Keep content concise
   - Ensure readable contrast
   - Consider mobile viewports

3. Modal Usage:
   - Use for detailed image viewing
   - Provide clear exit options
   - Consider loading indicators for large images

## Browser Support

The component uses standard web component APIs and requires:
- Custom Elements v1
- CSS Transitions
- CSS Transform
- Event Handling

## Limitations

- Maximum image height is fixed at 300px by default
- Modal view requires JavaScript
- Single image support (no galleries)
