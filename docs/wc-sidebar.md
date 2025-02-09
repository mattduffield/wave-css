# WC Sidebar Component

The `wc-sidebar` is a customizable web component that creates a fixed sidebar navigation with support for both left and right positioning, theme customization, and content pushing capabilities.

## Features



## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

Ensure you have the following dependencies:
- Base component files (`wc-base-component.js`)
- Helper functions (`helper-function.js`)

## Basic Usage

```html
<!-- Basic left sidebar -->
<wc-sidebar>
  <a href="#">About</a>
  <a href="#">Services</a>
  <a href="#">Clients</a>
  <a href="#">Contact</a>
</wc-sidebar>

<!-- Right-aligned sidebar with custom width -->
<wc-sidebar width="200px" right-side>
  <a href="#">About</a>
  <a href="#">Services</a>
  <a href="#">Contact</a>
</wc-sidebar>
```

## Attributes

| Attribute | Type | Description | Default | Required |
|-----------|------|-------------|---------|----------|
| `width` | String | Width of the sidebar | '150px' | No |
| `right-side` | Boolean | Position sidebar on the right | false | No |
| `push-target` | String | Selector for content to push | 'body' | No |
| `auto-height` | Boolean | Use content height instead of 100% | false | No |
| `background-color` | String | Custom background color | - | No |
| `class` | String | CSS classes for theming | - | No |

### Positioning
- Left-side positioning (default)
- Right-side positioning
- Fixed positioning with scrollable content
- Adjustable width
- Content pushing capability

### Theming
1. Using CSS Variables:
```html
<wc-sidebar class="theme-midnight-blue dark">
  <a href="#">About</a>
  <a href="#">Services</a>
</wc-sidebar>
```

2. Using Direct Background Color:
```html
<wc-sidebar background-color="#111">
  <a href="#">About</a>
  <a href="#">Services</a>
</wc-sidebar>
```

### Height Control
```html
<!-- Full height sidebar -->
<wc-sidebar>
  <a href="#">About</a>
</wc-sidebar>

<!-- Auto height based on content -->
<wc-sidebar auto-height>
  <a href="#">About</a>
</wc-sidebar>
```

### Content Pushing
```html
<!-- Push specific content -->
<wc-sidebar push-target="#main-content" width="200px">
  <a href="#">About</a>
</wc-sidebar>
<div id="main-content">
  <!-- Content to be pushed -->
</div>
```

## Styling

The component uses CSS variables for theming:

```css
:root {
  --bg-color: /* Background color for sidebar */
  --text-5: /* Default link color */
  --text-1: /* Hover link color */
}
```

### CSS Classes
- `.wc-sidebar`: Main container
- Links within sidebar automatically styled with:
  - Padding: `6px 8px 6px 16px`
  - Font size: `25px`
  - Hover effects
  - Block display

## Examples

### Basic Dark Theme Sidebar
```html
<wc-sidebar class="theme-midnight-blue dark">
  <a href="#">About</a>
  <a href="#">Services</a>
  <a href="#">Clients</a>
  <a href="#">Contact</a>
</wc-sidebar>
```

### Right-Aligned Custom Sidebar
```html
<wc-sidebar 
  width="200px" 
  background-color="#111" 
  auto-height 
  right-side>
  <a href="#">About</a>
  <a href="#">Services</a>
  <a href="#">Clients</a>
  <a href="#">Contact</a>
</wc-sidebar>
```

### Sidebar with Custom Content Push
```html
<wc-sidebar 
  width="250px"
  push-target="#main-area">
  <a href="#">Navigation</a>
</wc-sidebar>
<div id="main-area">
  <!-- Main content -->
</div>
```

## Technical Details

### Animation
- Smooth transitions for push/pull effects
- 0.5s ease transition for margin changes

### Layout Behavior
- Fixed positioning
- Z-index: 1 (can be overridden with CSS)
- Overflow handling for x-axis
- Default padding top/bottom: 20px

### Browser Support
Requires browsers with support for:
- Custom Elements v1
- CSS Variables
- Modern CSS Features (Fixed positioning, Transitions)

## Best Practices

1. Content Organization:
```html
<wc-sidebar>
  <!-- Primary navigation -->
  <a href="#">Main Menu</a>
  
  <!-- Secondary links -->
  <a href="#">Settings</a>
  <a href="#">Help</a>
</wc-sidebar>
```

2. Responsive Design:
```html
<style>
@media (max-width: 768px) {
  wc-sidebar {
    /* Mobile adjustments */
  }
}
</style>
```

3. Theme Integration:
```html
<!-- Using system themes -->
<wc-sidebar class="theme-midnight-blue dark">
  <!-- Content -->
</wc-sidebar>
```

4. Accessibility Considerations:
- Use semantic HTML within the sidebar
- Ensure sufficient color contrast
- Maintain readable font sizes
