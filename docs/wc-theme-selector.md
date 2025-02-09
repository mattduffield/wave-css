# WC-Theme-Selector Web Component

A custom web component that provides a theme selection interface with support for light/dark mode switching. The component includes a collection of predefined color themes and respects system color scheme preferences.

## Features

- 40+ predefined color themes
- Light/Dark mode toggle
- System preference detection
- Local storage persistence
- Custom styling support
- Theme switching without page reload
- Accessible button controls

## Installation

Include the required JavaScript files:

```html
<script type="module" src="path/to/wc-theme-selector.js"></script>
```

## Basic Usage

```html
<!-- Basic usage -->
<wc-theme-selector></wc-theme-selector>

<!-- With initial theme -->
<wc-theme-selector theme="theme-ocean"></wc-theme-selector>

<!-- With specific class styling -->
<wc-theme-selector class="mb-4"></wc-theme-selector>
```

## Available Themes

The component includes the following theme options:

### Color Themes
- Rose Tones: `theme-rose`, `theme-petal`, `theme-blush`, `theme-bubblegum`
- Orange/Red Tones: `theme-sunset`, `theme-peach`, `theme-fire`, `theme-desert`
- Yellow Tones: `theme-golden`, `theme-honey`, `theme-amber`, `theme-yellow`
- Green Tones: `theme-olive`, `theme-moss`, `theme-avocado`, `theme-lime`, `theme-fern`, `theme-meadow`, `theme-sage`, `theme-forest`, `theme-jungle`, `theme-emerald`
- Blue Tones: `theme-turquoise`, `theme-aqua`, `theme-lagoon`, `theme-ocean`, `theme-azure`, `theme-sky`, `theme-midsky`, `theme-deepsky`
- Purple Tones: `theme-royal`, `theme-twilight`, `theme-lavender`, `theme-violet`, `theme-grape`, `theme-plum`
- Special Tones: `theme-mint`, `theme-ice`, `theme-fuchsia`, `theme-cottoncandy`, `theme-cornsilk`

## Attributes

| Attribute | Type    | Default | Description                    |
|-----------|---------|---------|--------------------------------|
| theme     | string  | -       | Initial theme selection        |
| mode      | string  | -       | Initial light/dark mode        |
| id        | string  | -       | Element identifier             |
| class     | string  | -       | Additional CSS classes         |

## Dark Mode Integration

The component automatically detects system color scheme preferences and includes a toggle switch for light/dark mode:

```html
<!-- The dark mode toggle is included automatically -->
<wc-theme-selector></wc-theme-selector>
```

## Theme Persistence

Themes are automatically saved to localStorage and restored on page load:

```javascript
// How themes are stored internally
localStorage.setItem("theme", "ocean"); // Stores without "theme-" prefix
```

## Styling

The component can be styled using CSS:

```css
/* Target the component wrapper */
wc-theme-selector .wc-theme-selector {
  /* Your styles here */
}

/* Target theme buttons */
wc-theme-selector .theme-button {
  /* Your styles here */
}

/* Target the selected theme indicator */
wc-theme-selector .selectmark {
  /* Your styles here */
}
```

## Default Styling

- Theme buttons are 40x40 pixels (h-10 w-10)
- Rounded top corners on buttons
- Flex layout with wrap for theme options
- Built-in selection indicator (checkmark)

## Events

The component fires the following events:

- Click events on theme buttons
- Change events on dark mode toggle
- Load event for initial theme restoration

## Full Example

```html
<!-- Complete implementation with all features -->
<wc-theme-selector 
  class="mb-4" 
  theme="theme-ocean"
  id="main-theme-selector">
</wc-theme-selector>
```

## Programmatic Control

You can programmatically change the theme by setting the theme attribute:

```javascript
const themeSelector = document.querySelector('wc-theme-selector');
themeSelector.setAttribute('theme', 'theme-ocean');
```

## Browser Support

Requires browsers that support:
- Custom Elements v1
- ES6 Modules
- localStorage
- matchMedia API for dark mode detection

## Inheritance

The component extends from `WcBaseComponent` which provides:
- Unique ID generation
- Attribute handling
- Event management
- CSS loading utilities

## Implementation Notes

1. Theme buttons are rendered as a flex grid
2. The dark mode toggle uses the built-in `wc-input` component
3. Theme selection is indicated with a checkmark icon
4. System color scheme preferences are detected on load
5. Themes are prefixed with "theme-" in the DOM but stored without prefix in localStorage

## Best Practices

1. Place the selector in an easily accessible location
2. Maintain consistent theme placement across pages
3. Consider providing a default theme for first-time users
4. Test both light and dark modes with each theme
5. Ensure sufficient contrast ratios in selected themes

