# WC Background Image Component

The `wc-background-image` is a custom web component that creates a parallax background image effect with an optional caption. It provides a responsive, full-width background image that remains fixed during scroll, creating an engaging visual effect.

## Features

- Parallax scrolling effect
- Customizable image source
- Optional centered caption text
- Adjustable minimum height
- Responsive design with mobile fallback
- Opacity control
- Letter-spaced caption styling
- Extends WcBaseComponent

## Installation

1. Import the component:

```javascript
import { WcBackgroundImage } from './wc-background-image.js';
```

2. The component self-registers with the browser.

## Usage

### Basic Usage

```html
<wc-background-image
  caption="SCROLL DOWN"
  img-url="https://example.com/image.jpg">
</wc-background-image>
```

### With Custom Height

```html
<wc-background-image
  caption="LESS HEIGHT"
  img-url="https://example.com/image.jpg"
  min-height="400px">
</wc-background-image>
```

## Attributes

| Attribute    | Description                              | Default |
|-------------|------------------------------------------|---------|
| `caption`    | Text to display in the center overlay    | `""`    |
| `img-url`    | URL of the background image             | `""`    |
| `min-height` | Minimum height of the component          | `"100%"` |
| `id`         | Component ID                            | -       |
| `class`      | Additional CSS classes                  | -       |

## Styling

### Default Styles

The component comes with these built-in styles:

```css
.wc-background-image {
  position: relative;
  opacity: 0.65;
  background-attachment: fixed;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.caption {
  position: absolute;
  left: 0;
  top: 50%;
  width: 100%;
  text-align: center;
  color: #000;
}

.caption span.border {
  background-color: #111;
  color: #fff;
  padding: 18px;
  font-size: 25px;
  letter-spacing: 10px;
}
```

### Customization Examples

#### Custom Caption Styling

```css
.wc-background-image .caption span.border {
  background-color: #2a4365;
  color: #ffffff;
  font-size: 2rem;
  letter-spacing: 0.5em;
  border-radius: 4px;
}
```

#### Adjust Opacity

```css
.wc-background-image {
  opacity: 0.8;
}
```

## Mobile Responsiveness

The component automatically switches to standard scroll behavior on devices with a max-width of 768px:

```css
@media (max-device-width: 768px) {
  .wc-background-image {
    background-attachment: scroll;
  }
}
```

## Example Implementations

### Basic Parallax Section

```html
<wc-background-image
  caption="WELCOME"
  img-url="/images/hero.jpg"
  min-height="500px">
</wc-background-image>
```

### Multiple Sections

```html
<!-- Hero Section -->
<wc-background-image
  caption="WELCOME"
  img-url="/images/hero.jpg"
  min-height="100vh">
</wc-background-image>

<!-- Content Section -->
<div class="content">
  <h2>Your Content Here</h2>
  <p>Regular content section...</p>
</div>

<!-- Secondary Background -->
<wc-background-image
  caption="DISCOVER MORE"
  img-url="/images/secondary.jpg"
  min-height="400px">
</wc-background-image>
```

## Best Practices

1. Image Optimization
   - Use appropriately sized images
   - Optimize images for web use
   - Consider providing different sizes for responsive loading

2. Performance
   - Be mindful of image file sizes
   - Limit the number of parallax sections
   - Consider lazy loading for images

3. Design
   - Ensure sufficient contrast between caption and image
   - Use appropriate min-height for content
   - Consider mobile user experience

## Use Cases

- Hero sections
- Section breaks
- Story narratives
- Portfolio presentations
- Product showcases
- Testimonial backgrounds

## Technical Considerations

### Browser Support

- Modern browsers with Custom Elements v1 support
- CSS `background-attachment: fixed` support
- Mobile devices fall back to standard scroll

### Performance

The component:
- Uses GPU acceleration where possible
- Implements mobile-specific optimizations
- Handles cleanup in disconnectedCallback

### HTMX Integration

The component includes HTMX support:
```javascript
if (typeof htmx !== 'undefined') {
  htmx.process(this);
}
```

## Troubleshooting

Common issues and solutions:

1. Image Not Showing
   - Verify img-url is correct and accessible
   - Check network requests for image loading
   - Ensure image path is relative to deployment location

2. Parallax Not Working
   - Verify browser support
   - Check if device width triggers mobile fallback
   - Ensure container allows scrolling

3. Caption Issues
   - Verify caption attribute is set
   - Check contrast with background image
   - Inspect CSS overrides

## Event Handling

The component inherits event handling from `WcBaseComponent`. No additional events are implemented specifically for this component.

## Advanced Usage

### Dynamic Content Example

```javascript
const bgImage = document.querySelector('wc-background-image');
bgImage.setAttribute('caption', 'New Caption');
bgImage.setAttribute('img-url', '/new-image.jpg');
```

### Integration with Scroll Effects

```javascript
document.addEventListener('scroll', () => {
  const bgImages = document.querySelectorAll('wc-background-image');
  bgImages.forEach(img => {
    // Apply custom scroll effects
    const rect = img.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      // Element is visible
      // Add custom effects
    }
  });
});
```
