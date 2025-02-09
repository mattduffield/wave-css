# WC-Tab Component Documentation

A flexible and customizable tab system that supports both horizontal and vertical layouts, animations, and nested tabs.

## Features

- Horizontal and vertical tab layouts
- Animated tab transitions
- Nested tab support
- URL hash-based navigation
- Custom event handling
- Responsive design
- Theme support

## Installation

Import the required components:

```javascript
import './wc-tab.js';
import './wc-tab-item.js';
```

## Basic Usage

```html
<wc-tab class="p-4" animate>
  <wc-tab-item class="active" label="Tab 1">
    <div class="p-4">
      <h3>Tab 1 Content</h3>
      <p>Content for first tab...</p>
    </div>
  </wc-tab-item>
  <wc-tab-item label="Tab 2">
    <div class="p-4">
      <h3>Tab 2 Content</h3>
      <p>Content for second tab...</p>
    </div>
  </wc-tab-item>
</wc-tab>
```

## Component Attributes

### wc-tab Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| animate | boolean | false | Enables fade animation for tab transitions |
| vertical | boolean | false | Switches to vertical tab layout |
| class | string | - | Additional CSS classes |

### wc-tab-item Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| label | string | required | The text shown in the tab button |
| class | string | - | Additional CSS classes |
| active | boolean | false | Sets the tab as initially active |

## Examples

### Basic Horizontal Tabs
```html
<wc-tab class="p-4" animate>
  <wc-tab-item class="active" label="Tab 1">
    <div class="p-4">Content 1</div>
  </wc-tab-item>
  <wc-tab-item label="Tab 2">
    <div class="p-4">Content 2</div>
  </wc-tab-item>
</wc-tab>
```

### Vertical Tabs
```html
<wc-tab class="p-4" animate vertical>
  <wc-tab-item class="active" label="Tab 1">
    <div class="p-4">Content 1</div>
  </wc-tab-item>
  <wc-tab-item label="Tab 2">
    <div class="p-4">Content 2</div>
  </wc-tab-item>
</wc-tab>
```

### Nested Tabs
```html
<wc-tab class="p-4" animate>
  <wc-tab-item class="active" label="Parent 1">
    <wc-tab class="p-4">
      <wc-tab-item label="Child 1">
        <div class="p-4">Nested content 1</div>
      </wc-tab-item>
      <wc-tab-item label="Child 2">
        <div class="p-4">Nested content 2</div>
      </wc-tab-item>
    </wc-tab>
  </wc-tab-item>
  <wc-tab-item label="Parent 2">
    <div class="p-4">Parent content 2</div>
  </wc-tab-item>
</wc-tab>
```

## JavaScript API

The tabs can be controlled programmatically using custom events:

```javascript
// Switch to specific tab
wc.EventHub.broadcast('wc-tab:click', 
  ['[data-wc-id="tab-id"]'], 
  '.tab-link:nth-of-type(2)'
);
```

## Events

### Custom Events

| Event Name | Detail | Description |
|------------|--------|-------------|
| tabchange | { label: string } | Fired when tab selection changes |

### Event Handling Example
```javascript
document.querySelector('wc-tab-item').addEventListener('tabchange', (e) => {
  console.log('Tab changed to:', e.detail.label);
});
```

## URL Hash Navigation

The component supports URL hash-based navigation for maintaining tab state:

- Single level: `#Tab1`
- Nested tabs: `#Parent1+Child1`

## Styling

The component uses CSS custom properties for theming:

```css
:root {
  --card-bg-color: /* Tab content background */
  --card-border-color: /* Border color */
}
```

### CSS Classes

- `.tab-nav`: Tab button container
- `.tab-link`: Individual tab buttons
- `.tab-body`: Tab content container
- `.active`: Active tab styling

## Best Practices

1. **Structure**
   - Use semantic HTML within tab content
   - Keep tab labels concise
   - Consider mobile viewport when using nested tabs

2. **Performance**
   - Lazy load heavy content
   - Use animations sparingly on mobile
   - Consider content height for vertical tabs

3. **Accessibility**
   - Provide meaningful tab labels
   - Maintain proper heading hierarchy within tabs
   - Consider keyboard navigation patterns

4. **Nested Tabs**
   - Limit nesting to 2-3 levels for usability
   - Consider alternative layouts for deep nesting
   - Maintain consistent styling across levels

## Integration Examples

### With Code Editor
```html
<wc-tab-item label="Editor">
  <wc-code-mirror
    _="on tabchange from me.closest('.wc-tab-item')
      call me.editor.refresh()
    end"
    name="content"
    mode="javascript"
    theme="monokai"
    value="// Your code here">
  </wc-code-mirror>
</wc-tab-item>
```

### With Theme Support
```html
<wc-tab class="theme-lagoon dark" animate>
  <wc-tab-item label="Themed Tab">
    <div class="p-4">Themed content...</div>
  </wc-tab-item>
</wc-tab>
```

## Browser Support

Requires browsers that support:
- Custom Elements v1
- Shadow DOM v1
- CSS Custom Properties
- ES6 Modules

## Known Limitations

- No built-in keyboard navigation
- Limited mobile touch support for nested tabs
- Vertical tabs require explicit height setting
- URL hash navigation may conflict with other components using hash

## Additional Notes

- Tabs automatically handle cleanup on disconnection
- Animation can be enabled/disabled per instance
- Supports dynamic content updates
- Maintains tab state across page refreshes via URL hash
