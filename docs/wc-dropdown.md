# WC-Dropdown Component Documentation

A customizable dropdown web component that supports multiple modes, formats, and positioning options.

## Features

- Multiple interaction modes (hover, click, search)
- Various visual formats (standard, grid-round, avatar)
- Customizable positioning
- Search functionality
- Event-driven API
- Customizable styling through CSS variables

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

Include the required JavaScript files:

```html
<script type="module" src="path/to/wc-dropdown.js"></script>
```

## Basic Usage

```html
<!-- Basic Dropdown -->
<wc-dropdown label="Menu">
  <a href="#">Option 1</a>
  <a href="#">Option 2</a>
  <a href="#">Option 3</a>
</wc-dropdown>

<!-- Hover Mode Dropdown -->
<wc-dropdown label="Hover Menu" mode="hover">
  <a href="#">Option 1</a>
  <a href="#">Option 2</a>
  <a href="#">Option 3</a>
</wc-dropdown>

<!-- Search Mode Dropdown -->
<wc-dropdown label="Search" mode="search">
  <a href="#">Apple</a>
  <a href="#">Banana</a>
  <a href="#">Orange</a>
</wc-dropdown>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `label` | String | "" | Text displayed on the dropdown button |
| `mode` | String | "click" | Interaction mode ("click", "hover", "search") |
| `format` | String | "standard" | Visual format ("standard", "grid-round", "avatar") |
| `position-area` | String | "bottom span-left" | Positioning of dropdown content |
| `position-try-fallbacks` | String | "--bottom-right, --bottom-left, --top-right, --top-left, --right, --left" | Fallback positions |
| `dropdown-height` | String | "" | Set a fixed height for dropdown content |
| `id` | String | "" | Unique identifier for the dropdown |

## Visual Formats

### Standard Format
```html
<wc-dropdown label="Menu" format="standard">
  <a href="#">Option 1</a>
  <a href="#">Option 2</a>
</wc-dropdown>
```

### Grid Round Format (Icon Grid)
```html
<wc-dropdown format="grid-round">
  <a href="#">Option 1</a>
  <a href="#">Option 2</a>
</wc-dropdown>
```

### Avatar Format (User Menu)
```html
<wc-dropdown format="avatar">
  <a href="#">Profile</a>
  <a href="#">Settings</a>
  <a href="#">Logout</a>
</wc-dropdown>
```

## JavaScript API

The component supports event-driven control through the following methods:

```javascript
// Open a specific dropdown
wc.EventHub.broadcast('wc-dropdown:open', ['#mydropdown']);

// Close a specific dropdown
wc.EventHub.broadcast('wc-dropdown:close', ['#mydropdown']);

// Toggle a specific dropdown
wc.EventHub.broadcast('wc-dropdown:toggle', ['#mydropdown']);
```

## Styling

The component can be styled using CSS variables:

```css
:root {
  --button-bg-color: #ffffff;
  --button-color: #000000;
  --button-hover-bg-color: #f0f0f0;
  --component-color: #333333;
  --component-border-color: #e5e5e5;
}
```

## Supported Child Elements

The dropdown content can include:
- `<a>` elements for navigation links
- `<hr>` elements for separators
- `<wc-input>` elements for form inputs

## Examples

### Searchable Dropdown
```html
<wc-dropdown mode="search" label="Search Items">
  <a href="#">Product 1</a>
  <a href="#">Product 2</a>
  <a href="#">Product 3</a>
</wc-dropdown>
```

### Custom Positioned Dropdown
```html
<wc-dropdown 
  label="Custom Position" 
  position-area="top span-right"
  position-try-fallbacks="--top-left, --bottom-right">
  <a href="#">Option 1</a>
  <a href="#">Option 2</a>
</wc-dropdown>
```

### Avatar Menu with Fixed Height
```html
<wc-dropdown 
  format="avatar" 
  dropdown-height="200px">
  <a href="#">Profile</a>
  <a href="#">Settings</a>
  <a href="#">Help</a>
  <a href="#">Logout</a>
</wc-dropdown>
```

## Anchoring, menu look and rich items (Oct 2026)

- **Each dropdown anchors to its own button.** The CSS anchor name comes from `id`, or from the instance's unique `data-wc-id` when there is no id. Before, dropdowns without an id all shared `---anchor`, so every menu opened at the last button.
- **Positioning fallback:** CSS anchor positioning is used only when the browser supports both `anchor-name` and `position-area`. Chromium 125–128 had `anchor-name` without `position-area`, so menus were never placed there; those browsers now use the JS (fixed-position) fallback.
- **Esc** closes an open menu and returns focus to the button.
- **No leaked listeners:** handlers are bound once; removing a dropdown removes its window/body listeners (previously a window click listener was added on every render and never removed).

### CSS hooks (defaults keep the original look)

| Variable | Default |
|----------|---------|
| `--wc-dropdown-bg` | `var(--button-hover-bg-color)` |
| `--wc-dropdown-color` | `inherit` |
| `--wc-dropdown-border` | `none` |
| `--wc-dropdown-radius` | `0` |
| `--wc-dropdown-min-width` | at least the button width |
| `--wc-dropdown-max-width` | `250px` |
| `--wc-dropdown-max-height` | `70vh` (surface style) |
| `--wc-dropdown-item-hover` | `var(--component-border-color)` |

`menu-style="surface"` applies the menu look used by `wc-ribbon`: `--surface-2` background, `--surface-4` border, 8px radius, min-width 300px, max-height 70vh with scrolling.

### Rich menu items (opt-in classes)

```html
<wc-dropdown label="CREATE ▾" menu-style="surface">
  <a href="#" class="wc-menu-item">
    <wc-fa-icon class="wc-menu-item-icon" name="cube" size="0.95rem"></wc-fa-icon>
    <span class="wc-menu-item-text">
      <span class="wc-menu-item-label">Box</span>
      <span class="wc-menu-item-desc">A box — no sketch needed</span>
    </span>
  </a>
</wc-dropdown>
```

`.wc-menu-item` lays out icon, then label + a one-line muted description; add `.is-checked` for a selected toggle.

## Best Practices

1. Always provide meaningful labels for accessibility
2. Use appropriate modes based on content:
   - `hover` for simple menus
   - `click` for complex menus
   - `search` for long lists of options
3. Consider mobile users when choosing positioning
4. Use appropriate format based on context:
   - `standard` for regular menus
   - `grid-round` for icon/tool menus
   - `avatar` for user menus

## Browser Support

The component uses standard Web Components APIs and should work in all modern browsers that support Custom Elements v1.
