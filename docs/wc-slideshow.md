# WC-Slideshow Component Documentation

A lightweight, customizable slideshow web component that supports auto-play, manual navigation, and image captions.

## Features

- Image slideshow with fade transitions
- Optional autoplay with configurable intervals
- Manual navigation with previous/next buttons
- Image captions
- Slide number indicators
- Responsive design
- Pause on tab/window visibility change
- Event-driven API for external control

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

1. Import the required components:

```javascript
import './wc-slideshow.js';
import './wc-slideshow-image.js';
```

## Basic Usage

```html
<wc-slideshow class="mb-4">
  <wc-slideshow-image
    url="path/to/image1.jpg"
    caption="Caption 1">
  </wc-slideshow-image>
  <wc-slideshow-image
    url="path/to/image2.jpg"
    caption="Caption 2">
  </wc-slideshow-image>
</wc-slideshow>
```

## Attributes

### wc-slideshow Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| autoplay | boolean | false | Enables automatic slideshow |
| autoplay-interval | number | 5000 | Time between slides in milliseconds |
| max-image-height | string | "300px" | Maximum height for images |
| class | string | - | Additional CSS classes |

### wc-slideshow-image Attributes

| Attribute | Type | Description |
|-----------|------|-------------|
| url | string | URL of the image to display |
| caption | string | Caption text to show below the image |

## Examples

### Basic Slideshow
```html
<wc-slideshow class="mb-4">
  <wc-slideshow-image
    url="image1.jpg"
    caption="Caption 1">
  </wc-slideshow-image>
  <wc-slideshow-image
    url="image2.jpg"
    caption="Caption 2">
  </wc-slideshow-image>
</wc-slideshow>
```

### Autoplay Slideshow
```html
<wc-slideshow class="mb-4" autoplay autoplay-interval="3000">
  <wc-slideshow-image
    url="image1.jpg"
    caption="Caption 1">
  </wc-slideshow-image>
  <wc-slideshow-image
    url="image2.jpg"
    caption="Caption 2">
  </wc-slideshow-image>
</wc-slideshow>
```

### Custom Height Slideshow
```html
<wc-slideshow class="mb-4" max-image-height="400px">
  <wc-slideshow-image
    url="image1.jpg"
    caption="Caption 1">
  </wc-slideshow-image>
  <wc-slideshow-image
    url="image2.jpg"
    caption="Caption 2">
  </wc-slideshow-image>
</wc-slideshow>
```

## JavaScript API

The slideshow can be controlled programmatically using custom events:

```javascript
// Navigate to next slide
wc.EventHub.broadcast('wc-slideshow:next', ['[data-wc-id="slideshow-id"]']);

// Navigate to previous slide
wc.EventHub.broadcast('wc-slideshow:prev', ['[data-wc-id="slideshow-id"]']);

// Start autoplay
wc.EventHub.broadcast('wc-slideshow:start', ['[data-wc-id="slideshow-id"]']);

// Stop autoplay
wc.EventHub.broadcast('wc-slideshow:stop', ['[data-wc-id="slideshow-id"]']);
```

## Features and Behavior

1. **Automatic Playback**
   - Starts automatically when `autoplay` attribute is present
   - Pauses when tab/window loses focus
   - Resumes when tab/window regains focus
   - Stops on manual navigation

2. **Navigation**
   - Previous/Next buttons appear on hover
   - Circular navigation (loops back to first/last slide)
   - Smooth fade transitions between slides

3. **Display**
   - Slide number indicator (e.g., "1 / 4")
   - Captions overlay on images
   - Responsive image sizing
   - Customizable maximum image height

## Styling

The component comes with default styling but can be customized using CSS. Key style points:

- Images are responsive and maintain aspect ratio
- Navigation buttons use semi-transparent backgrounds
- Captions are displayed with a dark overlay
- Fade transitions are smooth (1.5s duration)

## Browser Support

Requires browsers that support:
- Custom Elements v1
- Shadow DOM v1
- ES6 Modules
- CSS Animations

## Events

The component listens for the following custom events:

| Event Name | Description |
|------------|-------------|
| wc-slideshow:next | Advances to next slide |
| wc-slideshow:prev | Returns to previous slide |
| wc-slideshow:start | Starts autoplay |
| wc-slideshow:stop | Stops autoplay |

## Best Practices

1. **Image Optimization**
   - Use appropriately sized images
   - Maintain consistent aspect ratios
   - Optimize images for web delivery

2. **Performance**
   - Limit number of slides for better performance
   - Use appropriate image formats (WebP where supported)
   - Consider lazy loading for multiple slideshows

3. **Accessibility**
   - Provide meaningful alt text for images
   - Use descriptive captions
   - Ensure sufficient color contrast for captions

## Known Limitations

- No touch/swipe support built-in
- No thumbnail navigation
- Limited animation options
- No direct slide selection
