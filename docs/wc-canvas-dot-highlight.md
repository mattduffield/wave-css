# WC-Canvas-Dot-Highlight Web Component

A custom web component that creates an interactive dot matrix animation with mouse-following highlight effects. Perfect for creating engaging background animations and interactive UI elements.

## Features

- Responsive canvas sizing
- Mouse-following highlight effect
- Smooth animations
- Configurable dot matrix
- Customizable colors and dimensions
- Automatic resizing
- Mobile-friendly


## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)


## Installation

Include the required JavaScript file:

```html
<script type="module" src="path/to/wc-canvas-dot-highlight.js"></script>
```

## Basic Usage

```html
<wc-canvas-dot-highlight>
  <!-- Optional overlay content -->
  <div class="content">
    Your content here
  </div>
</wc-canvas-dot-highlight>
```

## Configuration

The component comes with default configuration that can be modified:

```javascript
const config = {
  dotSpacing: 20,          // Space between dots
  dotRadius: 1.25,         // Size of each dot
  highlightRadius: 160,    // Radius of highlight effect
  defaultColor: '#444',    // Color of inactive dots
  highlightColor: '#40E0D0', // Color of highlighted dots
  backgroundColor: '#111111', // Canvas background color
  animationSpeed: 0.15     // Speed of highlight movement (0-1)
};
```

## Examples

### Basic Implementation
```html
<wc-canvas-dot-highlight></wc-canvas-dot-highlight>
```

### With Overlay Content
```html
<wc-canvas-dot-highlight>
  <div class="content">
    <h1>Welcome</h1>
    <p>This content will appear over the dot animation</p>
  </div>
</wc-canvas-dot-highlight>
```

### Video Overlay Example
```html
<wc-canvas-dot-highlight>
  <div class="video">
    <iframe class="aspect-video"
      src="https://www.youtube.com/embed/your-video-id">
    </iframe>
  </div>
  <div class="message">
    <p>Your message here</p>
  </div>
</wc-canvas-dot-highlight>
```

## Styling

### Component CSS
```css
wc-canvas-dot-highlight {
  display: contents;
}

.wc-canvas-dot-highlight {
  position: relative;
}

.wc-canvas-dot-highlight canvas {
  border-radius: 8px;
  border: 1px solid gray;
  border-radius: 10px;
  background-color: #111;
}
```

### Overlay Content Styling
```css
/* Example styling for overlay content */
.video {
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid gray;
  border-radius: 10px;
  padding: .5rem;
  width: 684px;
}

.message {
  position: absolute;
  color: white;
  font-size: 2rem;
  padding: 2rem;
  text-align: center;
  pointer-events: none;
}
```

## Animation Behavior

The component provides several interactive behaviors:

1. **Mouse Following**
   - Highlight follows mouse movement
   - Smooth animation transition
   - Fade out when mouse leaves canvas

2. **Responsive Sizing**
   - Automatically adjusts to window size
   - Maintains dot spacing ratio
   - Recalculates matrix on resize

3. **Performance Optimization**
   - Uses requestAnimationFrame
   - Two-pass rendering system
   - Efficient canvas clearing

## Technical Details

### Canvas Setup
```javascript
const canvas = document.createElement('canvas');
canvas.width = window.innerWidth * 0.95;
canvas.height = window.innerHeight * 0.95;
const ctx = canvas.getContext('2d');
```

### Event Handling
```javascript
// Mouse movement tracking
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseX = e.clientX - rect.left;
  mouseY = e.clientY - rect.top;
});

// Window resize handling
window.addEventListener('resize', () => {
  canvas.width = window.innerWidth * 0.95;
  canvas.height = window.innerHeight * 0.95;
});
```

## Best Practices

1. **Performance**
   - Keep overlay content minimal
   - Use `pointer-events: none` for purely visual overlays
   - Avoid excessive DOM updates

2. **Responsiveness**
   - Use relative positioning for overlays
   - Calculate positions based on canvas size
   - Test on different screen sizes

3. **Accessibility**
   - Provide alternative content when needed
   - Ensure overlay content is accessible
   - Consider reduced motion preferences

## Browser Support

Requires browsers that support:
- Custom Elements v1
- Canvas API
- requestAnimationFrame
- ES6 Modules

## Limitations

- High CPU usage with large dot matrices
- No touch optimization for mobile
- Canvas content not searchable/accessible

## Troubleshooting

1. **Performance Issues**
   - Reduce dot density (increase spacing)
   - Decrease highlight radius
   - Reduce canvas size

2. **Visual Glitches**
   - Ensure canvas size calculations are correct
   - Check z-index of overlays
   - Verify CSS positioning

3. **Overlay Positioning**
   - Use absolute positioning relative to canvas
   - Calculate positions based on canvas dimensions
   - Test with different content sizes

