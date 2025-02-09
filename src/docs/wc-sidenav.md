# WC Sidenav Component

The `wc-sidenav` is a customizable web component that creates a collapsible side navigation panel with support for both left and right positioning, push content functionality, and overlay effects.

## Installation

Ensure you have the following dependencies:
- Base component files (`wc-base-component.js`)
- Helper functions (`helper-function.js`)

## Basic Usage

```html
<!-- Basic left sidenav -->
<wc-sidenav open-top="48px" label="MENU">
  <a href="#">About</a>
  <a href="#">Services</a>
  <a href="#">Contact</a>
</wc-sidenav>

<!-- Right-aligned sidenav with push effect -->
<wc-sidenav 
  right-side 
  push 
  width="400px" 
  label="RIGHT MENU">
  <a href="#">About</a>
  <a href="#">Services</a>
</wc-sidenav>
```

## Attributes

| Attribute | Type | Description | Default | Required |
|-----------|------|-------------|---------|----------|
| `width` | String | Width of the expanded sidenav | '250px' | No |
| `label` | String | Text for the open button | 'Sidenav' | No |
| `open-top` | String | Top position of open button | '0' | No |
| `right-side` | Boolean | Position sidenav on the right | false | No |
| `push` | Boolean | Push main content when opened | false | No |
| `push-target` | String | Selector for content to push | '#viewport' | No |
| `overlay` | Boolean | Show overlay when opened | false | No |
| `open-vertical-text` | Boolean | Use upright vertical text | false | No |
| `auto-height` | Boolean | Use content height instead of 100% | false | No |
| `background-color` | String | Custom background color | - | No |
| `open` | Boolean | Initially open the sidenav | false | No |

## Features

### Positioning and Layout
```html
<!-- Left-side sidenav -->
<wc-sidenav open-top="48px" label="LEFT">
  <a href="#">Menu Items</a>
</wc-sidenav>

<!-- Right-side sidenav -->
<wc-sidenav right-side open-top="48px" label="RIGHT">
  <a href="#">Menu Items</a>
</wc-sidenav>
```

### Push Content Effect
```html
<!-- Push content when opened -->
<wc-sidenav push push-target="#main-content">
  <a href="#">Menu Items</a>
</wc-sidenav>
<div id="main-content">
  <!-- Content to be pushed -->
</div>
```

### Overlay Mode
```html
<!-- Show overlay when opened -->
<wc-sidenav overlay>
  <a href="#">Menu Items</a>
</wc-sidenav>
```

### Vertical Text Options
```html
<!-- Regular vertical text -->
<wc-sidenav label="MENU">
  <a href="#">Menu Items</a>
</wc-sidenav>

<!-- Upright vertical text -->
<wc-sidenav label="MENU" open-vertical-text>
  <a href="#">Menu Items</a>
</wc-sidenav>
```

## JavaScript API

The component supports event-based control:

```javascript
// Open sidenav
wc.EventHub.broadcast('wc-sidenav:open', ['[data-wc-id="your-id"]']);

// Close sidenav
wc.EventHub.broadcast('wc-sidenav:close', ['[data-wc-id="your-id"]']);

// Toggle sidenav
wc.EventHub.broadcast('wc-sidenav:toggle', ['[data-wc-id="your-id"]']);
```

## Styling

The component uses CSS variables for theming:

```css
:root {
  --button-bg-color: /* Background color for sidenav */
  --button-color: /* Text color */
  --button-hover-color: /* Text hover color */
  --button-hover-bg-color: /* Button hover background */
}
```

### Transitions
- Sidenav width: 0.5s
- Content push: 0.5s ease
- Link hover: 0.3s
- Overlay: 0.5s ease

## Examples

### Full-Featured Sidenav
```html
<wc-sidenav 
  class="theme-midnight-blue dark"
  open-top="48px" 
  label="MENU"
  width="300px"
  open-vertical-text
  push
  overlay>
  <a href="#">About</a>
  <a href="#">Services</a>
  <a href="#">Contact</a>
</wc-sidenav>
```

### Custom Width with Auto Height
```html
<wc-sidenav 
  width="100%" 
  auto-height 
  label="FULL WIDTH">
  <a href="#">Menu Items</a>
</wc-sidenav>
```

### Right-Side with Custom Background
```html
<wc-sidenav 
  background-color="#111"
  open-top="48px"
  label="RIGHT"
  width="400px"
  right-side
  push
  overlay>
  <a href="#">Menu Items</a>
</wc-sidenav>
```

## Technical Details

### Component Structure
```html
<wc-sidenav>
  <!-- Navigation container -->
  <div class="wc-sidenav sidenav">
    <button class="closebtn">×</button>
    <!-- Navigation items -->
  </div>
  
  <!-- Open button -->
  <button class="openbtn">
    <span>LABEL</span>
  </button>
  
  <!-- Optional overlay -->
  <div class="overlay"></div>
</wc-sidenav>
```

### Event Handling
- Click events for open/close buttons
- Custom events for external control
- Transition events for smooth animations
- Overlay click handling

### CSS Classes
- `.wc-sidenav.sidenav`: Main navigation container
- `.closebtn`: Close button
- `.openbtn`: Open button
- `.overlay`: Overlay background
- `.open`: Applied to opened sidenav

## Best Practices

1. Accessibility:
```html
<wc-sidenav label="Main Navigation">
  <a href="#" aria-label="About Us">About</a>
  <a href="#" aria-label="Our Services">Services</a>
</wc-sidenav>
```

2. Responsive Design:
```html
<wc-sidenav 
  width="100%"
  class="desktop-only"
  push-target="#responsive-content">
  <!-- Content -->
</wc-sidenav>
```

3. Theme Integration:
```html
<wc-sidenav class="theme-midnight-blue dark">
  <!-- Content -->
</wc-sidenav>
```
