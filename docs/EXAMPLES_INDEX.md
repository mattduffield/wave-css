# Wave CSS Examples Index

This document provides a quick reference to all available examples in the Wave CSS library. Each example demonstrates specific component usage and integration patterns.

## Running Examples

```bash
# Start local server
python3 -m http.server 3015

# Navigate to
http://localhost:3015/examples/
```

## Example Categories

### Basic Components

#### forms.html
Demonstrates all form components and validation patterns.
- Text inputs with validation
- Select dropdowns
- Checkboxes and radio buttons
- Form submission handling
- Custom validation messages

#### icons.html
Comprehensive icon showcase.
- All icon styles (solid, regular, duotone, etc.)
- Size variations
- Animation effects
- Color customization
- Dynamic icon loading

#### modals.html
Modal dialog patterns.
- Basic modals
- Nested modals
- Programmatic control
- Custom sizes
- Event handling

#### tables.html
Data table functionality.
- Sortable columns
- Filterable data
- Pagination
- Custom cell rendering
- Dynamic data updates

### Layout Examples

#### layouts.html
Common layout patterns.
- Sidebar layouts
- Grid systems
- Flexible containers
- Responsive designs

#### navigation.html
Navigation components.
- Navbar configurations
- Menu systems
- Breadcrumbs
- Tab navigation

### Integration Examples

#### htmx-integration.html
HTMX integration patterns.
- Dynamic content loading
- Form submissions
- Component updates
- Event coordination

#### spa-example.html
Single Page Application patterns.
- Client-side routing
- Component lifecycle
- State management
- Dynamic updates

### Advanced Examples

#### custom-components.html
Creating custom components.
- Extending base classes
- Custom rendering
- Event integration
- Attribute handling

#### themes.html
Theming and customization.
- Theme switcher
- Custom themes
- CSS variable usage
- Dynamic styling

#### performance.html
Performance optimization patterns.
- Lazy loading
- Component pooling
- Event delegation
- Bundle optimization

## Code Snippets

### Quick Start
```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="/dist/wave-css.min.css">
  <script type="module" src="/dist/wave-css.min.js"></script>
</head>
<body>
  <wc-container>
    <h1>Hello Wave CSS!</h1>
    <wc-button>Click me</wc-button>
  </wc-container>
</body>
</html>
```

### Form Example
```html
<wc-form id="myForm">
  <wc-input 
    name="email" 
    type="email" 
    label="Email"
    required>
  </wc-input>
  
  <wc-select 
    name="country"
    label="Country"
    options='[{"value":"us","label":"USA"}]'>
  </wc-select>
  
  <wc-button type="submit">Submit</wc-button>
</wc-form>

<script>
document.getElementById('myForm').addEventListener('submit', (e) => {
  console.log('Form data:', e.detail);
});
</script>
```

### Dynamic Component
```javascript
// Create a modal dynamically
const modal = document.createElement('wc-modal');
modal.setAttribute('title', 'Welcome');
modal.innerHTML = `
  <p>Welcome to Wave CSS!</p>
  <wc-button onclick="this.closest('wc-modal').hide()">
    Close
  </wc-button>
`;
document.body.appendChild(modal);
modal.show();
```

## Testing Patterns

### Component Testing
```javascript
// Test component rendering
const icon = document.createElement('wc-fa-icon');
icon.setAttribute('name', 'home');
document.body.appendChild(icon);

// Wait for render
await icon.updateComplete;

// Verify
console.assert(icon.querySelector('svg'), 'Icon should render SVG');
```

### Event Testing
```javascript
// Test event broadcasting
let received = false;
wc.EventHub.subscribe('test:event', () => {
  received = true;
});

wc.EventHub.broadcast('test:event');
console.assert(received, 'Event should be received');
```

## Troubleshooting

### Component Not Rendering
1. Check console for errors
2. Verify script is loaded as module
3. Ensure component is registered
4. Check for attribute typos

### Styling Issues
1. Verify CSS is loaded
2. Check theme variables
3. Inspect computed styles
4. Review CSS specificity

### Event Issues
1. Check event names
2. Verify selectors
3. Review event data
4. Test in isolation

## Best Practices

1. **Always use semantic HTML** inside components
2. **Leverage CSS variables** for consistent theming
3. **Use EventHub** for loose coupling
4. **Test components** in isolation
5. **Document custom components** thoroughly
6. **Follow naming conventions** (wc- prefix)
7. **Minimize inline styles** - use classes
8. **Handle errors gracefully** in components