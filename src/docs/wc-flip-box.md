# WC-Flip-Box Component Documentation

The `wc-flip-box` is a web component that creates an interactive flip card effect, where content can be displayed on both front and back sides with a smooth transition on hover.

## Installation

1. Import the required files:
```javascript
import { WcFlipBox } from './wc-flip-box.js';
```

## Basic Usage

```html
<wc-flip-box class="h-40 w-40">
  <div slot="front">
    <!-- Front side content -->
    <h2>Front Side</h2>
  </div>
  <div slot="back">
    <!-- Back side content -->
    <h2>Back Side</h2>
  </div>
</wc-flip-box>
```

## Features

- Smooth 3D flip animation on hover
- Customizable dimensions through CSS classes
- Support for distinct front and back content
- Automatic perspective handling for 3D effect
- Theme support for styling variations

## Props & Attributes

The component inherits base attributes from `WcBaseComponent` and accepts the following:

- `id`: Unique identifier for the component
- `class`: CSS classes for styling
- All standard HTML attributes are supported

## Slots

1. `front`: Content to display on the front side of the flip box
2. `back`: Content to display on the back side of the flip box

## Styling

The component uses CSS custom properties for theming:

```css
--component-border-color: Border color for the flip box
--card-bg-color: Background color for both sides
--text-1: Text color for content
```

### Default Styles

- The flip box has a transparent background
- 3D perspective is set to 1000px
- Transition duration is 0.8s for smooth flipping
- Both front and back sides are absolutely positioned
- Back side is rotated 180 degrees on the Y-axis

## Examples

### Basic Example
```html
<wc-flip-box class="h-40 w-40">
  <div slot="front">
    <h2>Front Side</h2>
  </div>
  <div slot="back">
    <h2>Back Side</h2>
  </div>
</wc-flip-box>
```

### Themed Example
```html
<wc-flip-box class="h-40 w-40 mb-4">
  <div slot="front" class="theme-sunset dark">
    <h2>Front Side</h2>
  </div>
  <div slot="back" class="theme-royal light">
    <h2>Back Side</h2>
  </div>
</wc-flip-box>
```

## Dimensions

The component's size can be controlled using Tailwind CSS classes or custom CSS:

- Height: Use classes like `h-40`, `h-60`, etc.
- Width: Use classes like `w-40`, `w-60`, etc.
- Margin/Padding: Use utility classes like `mb-4`, `p-4`, etc.

## Browser Support

The component uses standard web components APIs and CSS transforms. Ensure your browser supports:

- Custom Elements v1
- CSS Custom Properties
- 3D Transforms
- `backface-visibility` property

## Technical Details

1. The component extends `WcBaseComponent`
2. Uses Shadow DOM for style encapsulation
3. Implements standard web component lifecycle methods
4. Handles attribute changes through the `attributeChangedCallback`

## Best Practices

1. Always specify dimensions using classes or CSS
2. Ensure content on both sides has similar dimensions
3. Use appropriate theme classes for better visual contrast
4. Keep content structure similar on both sides for consistent appearance

## Event Handling

The component currently handles:
- Hover events for flip animation
- Attribute changes for styling updates

## Limitations

- Content must fit within the specified dimensions
- Flip animation is currently limited to Y-axis rotation
- Animation is hover-based only
