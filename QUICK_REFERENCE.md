# Wave CSS Quick Reference

## Installation
```html
<link rel="stylesheet" href="https://your-cdn/wave-css.min.css">
<script type="module" src="https://your-cdn/wave-css.min.js"></script>
```

## Component Cheat Sheet

### Forms
```html
<wc-input name="text" type="text" placeholder="Enter text" required></wc-input>
<wc-select name="choice" options='[{"value":"1","label":"Option 1"}]'></wc-select>
<wc-checkbox name="agree" label="I agree"></wc-checkbox>
<wc-radio name="option" value="a" label="Option A"></wc-radio>
<wc-textarea name="message" rows="4"></wc-textarea>
<wc-button type="submit">Submit</wc-button>
```

### Icons
```html
<wc-fa-icon name="home"></wc-fa-icon>
<wc-fa-icon name="user" size="2x" color="blue"></wc-fa-icon>
<wc-fa-icon name="spinner" spin></wc-fa-icon>
<wc-fa-icon name="bell" icon-style="duotone"></wc-fa-icon>
```

### Layout
```html
<wc-container>Content</wc-container>
<wc-flex gap="2" align="center">Flex items</wc-flex>
<wc-grid cols="3" gap="4">Grid items</wc-grid>
```

### Modals
```html
<wc-modal id="modal1" title="My Modal">
  Content here
</wc-modal>
<wc-button onclick="document.getElementById('modal1').show()">Open</wc-button>
```

## EventHub Commands
```javascript
// Subscribe
wc.EventHub.subscribe('event:name', (data) => { });

// Broadcast
wc.EventHub.broadcast('event:name', ['selector'], data);

// Unsubscribe
wc.EventHub.unsubscribe('event:name', handler);
```

## Common Attributes

| Attribute | Components | Description |
|-----------|------------|-------------|
| `name` | Form components | Field name |
| `value` | Form components | Field value |
| `disabled` | Form components | Disable input |
| `required` | Form components | Required field |
| `placeholder` | Input, Select | Placeholder text |
| `label` | Form components | Field label |
| `size` | Icons, Modals | Component size |
| `color` | Icons, Buttons | Color value |
| `variant` | Buttons, Alerts | Style variant |

## CSS Variables
```css
--hue: 210;
--color-primary: hsl(var(--hue), 100%, 50%);
--border-radius: 0.25rem;
--transition-speed: 200ms;
```

## Keyboard Shortcuts
- `ESC` - Close modals
- `Tab` - Navigate form fields
- `Enter` - Submit forms
- `Space` - Toggle checkboxes

## Debug Commands
```javascript
// List all components
document.querySelectorAll('[data-wc-id]')

// Get component instance
document.querySelector('wc-input').wcId

// Check loaded icons
WcFaIcon.isIconLoaded('home', 'solid')
```