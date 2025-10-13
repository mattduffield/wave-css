# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

- **Project Type**: Web Component Library (Custom Elements, no Shadow DOM)
- **Language**: JavaScript ES6+
- **Build Tool**: esbuild
- **CSS Framework**: Custom CSS with extensive theming
- **Testing**: [Add your testing framework here]
- **Package Manager**: npm

## Build Commands

```bash
# Build all assets (JS and CSS bundles)
npm run build

# View components locally
python3 -m http.server 3015
```

## Architecture Overview

Wave CSS is a web component library that uses native Custom Elements without Shadow DOM. This design choice allows seamless integration with third-party libraries and frameworks.

### Core Architecture Principles

1. **No Shadow DOM**: Components use regular DOM with `classList.add('contents')` for CSS containment
2. **Inheritance-based**: All components extend `WcBaseComponent` or `WcBaseFormComponent`
3. **CSS Variables**: Extensive theming system using CSS custom properties
4. **Event-driven**: Custom EventHub for inter-component communication

### Component Lifecycle

1. Constructor → `_render()` → `connectedCallback()` → `_handleAttributeChange()`
2. Pending attributes are stored until component is ready
3. Child components are detected and awaited before initialization completes

### Key Base Classes

- `WcBaseComponent`: Foundation for all components, handles lifecycle, attributes, and rendering
- `WcBaseFormComponent`: Extends base with form-specific functionality (value, name, validation)

### Event Communication Pattern

```javascript
// Broadcasting events
wc.EventHub.broadcast('component:action', [selector], data);

// Example: Form submission
wc.EventHub.broadcast('form:submit', ['wc-form#myForm'], formData);
```

### Attribute Handling

- Use `observedAttributes` static getter to define reactive attributes
- Special attributes: `class`, `name`, `elt-class` get special handling
- Complex attributes can be JSON strings that get parsed automatically

### Build Output

The build process (esbuild.config.js) generates:
- `wave-css.min.js` / `wave-css.js` - ESM bundles
- `wave-helpers.js` - IIFE bundle with helper functions
- `wave-css.min.css` / `wave-css.css` - CSS bundles with all themes

### Theme System

- 40+ predefined color themes using CSS variables
- Themes modify `--hue` and related color variables
- Components automatically adapt to the selected theme
- Theme selector component (`wc-theme-selector`) for runtime switching

## Component Categories

### Layout Components
- `wc-sidebar`: Sidebar navigation component
- `wc-sidenav`: Side navigation menu

### Form Components (extend WcBaseFormComponent)
- `wc-form`: Form wrapper with validation
- `wc-input`: Text input field
- `wc-select`: Dropdown select
- `wc-textarea`: Multi-line text input

### Display Components
- `wc-accordion`: Collapsible content sections
- `wc-article-card`: Article card display
- `wc-contact-card`: Contact information card
- `wc-contact-chip`: Compact contact display
- `wc-flip-box`: Flippable content box
- `wc-google-map`: Google Maps integration with single/multiple pins
- `wc-image`: Enhanced image component
- `wc-background-image`: Background image container

### Icon Components
- `wc-fa-icon`: Font Awesome icon wrapper
- `wc-icon`: Basic icon component

### Navigation Components
- `wc-menu`: Menu system with HTMX support
- `wc-breadcrumb`: Breadcrumb navigation
- `wc-breadcrumb-item`: Individual breadcrumb item
- `wc-tab`: Tab container
- `wc-tab-item`: Individual tab item
- `wc-dropdown`: Dropdown menu
- `wc-dropdown-item`: Dropdown menu item

### Data Components
- `wc-tabulator`: Advanced data table
- `wc-tabulator-column`: Table column definition
- `wc-tabulator-func`: Table function helpers
- `wc-tabulator-row-menu`: Row context menu
- `wc-timeline`: Timeline visualization

### Interactive Components
- `wc-slideshow`: Image slideshow
- `wc-slideshow-image`: Slideshow image item
- `wc-code-mirror`: Code editor integration
- `wc-canvas-dot-highlight`: Canvas animation effect

### Button Components
- `wc-save-button`: Save action button
- `wc-save-split-button`: Split button with save options
- `wc-split-button`: Generic split button

### AI/Bot Components
- `wc-ai-bot`: AI chatbot interface
- `wc-hf-bot`: Hugging Face bot interface

### Skeleton/Loading Components
- `wc-loader`: Loading spinner
- `wc-article-skeleton`: Article loading skeleton
- `wc-card-skeleton`: Card loading skeleton
- `wc-list-skeleton`: List loading skeleton
- `wc-table-skeleton`: Table loading skeleton

### Utility Components
- `wc-theme-selector`: Theme switcher
- `wc-theme`: Theme manager
- `wc-prompt`: User prompt dialog
- `wc-notify`: Notification system
- `wc-page-designer`: Page design tool
- `wc-template-preview`: Template preview

### Non-UI Components
- `wc-event-hub`: Event broadcasting system
- `wc-event-handler`: Event handling
- `wc-mask-hub`: Mask/overlay management
- `wc-behavior`: Behavior attachment
- `wc-visibility-change`: Visibility change detection
- `wc-hotkey`: Keyboard shortcut handler
- `wc-link`: Enhanced link component
- `wc-script`: Script loader
- `wc-javascript`: JavaScript executor
- `wc-div`: Enhanced div wrapper

## Common Patterns

### Creating a New Component

1. Extend from `WcBaseComponent` or `WcBaseFormComponent`
2. Define `static get is()` with component name
3. Override `_render()` for initial DOM setup
4. Define `static get observedAttributes()` for reactive attributes
5. Implement `_handleAttributeChange()` for attribute changes

### Component Communication

```javascript
// Listen for events
this.addEventListener('component:action', (e) => {
  // Handle event
});

// Broadcast to specific components
wc.EventHub.broadcast('action:name', ['wc-component#id'], data);
```

### Form Integration

Form components automatically:
- Participate in form submission
- Support validation
- Handle disabled/readonly states
- Provide value getters/setters

## Debugging Tips

1. Check browser console for component registration
2. Use `data-wc-id` attribute to identify component instances
3. Components emit lifecycle events for debugging
4. Check `_pendingAttributes` for attribute timing issues

## File Structure

```
src/
├── js/
│   ├── components/      # All web components
│   │   ├── wc-*.js     # Individual component files
│   │   └── index.js    # Component exports
│   └── utils/          # Utility functions
├── css/
│   ├── base.css        # Base styles
│   ├── color.css       # Color system
│   └── main.css        # Main styles
views/                   # Example HTML files
├── index.html          # Main entry with HTMX navigation
├── form-elements.html  # Form component examples
├── icon.html           # Icon showcase
├── theme.html          # Theme selector
└── [40+ example files] # Component demonstrations
dist/                    # Built files
├── wave-css.js         # ESM bundle
├── wave-css.min.js     # Minified ESM
├── wave-helpers.js     # IIFE helpers
├── wave-css.css        # Full CSS
└── wave-css.min.css    # Minified CSS
```

## Viewing Examples

```bash
# Start local server
python3 -m http.server 3015

# Navigate to examples
http://localhost:3015/views/

# Main entry point with navigation
http://localhost:3015/views/index.html
```

### Key Example Files

- `views/complete-example.html` - **START HERE** - Comprehensive standalone example
- `views/index.html` - Main navigation hub using HTMX
- `views/form-elements.html` - All form components showcase
- `views/icon.html` - Comprehensive icon examples
- `views/theme.html` - Theme switcher and color showcase
- `views/tabulator.html` - Data table examples
- `views/ai-bot.html` - AI chatbot interface example

### Quick Start Example

```html
<!DOCTYPE html>
<html lang="en" class="theme-ocean">
<head>
  <link rel="stylesheet" href="dist/wave-css.min.css">
</head>
<body>
  <div class="container mx-auto p-6">
    <h1>Hello Wave CSS!</h1>
    <button class="btn btn-primary" onclick="alert('Clicked!')">Click Me</button>
    
    <!-- Example with Wave CSS components -->
    <wc-form>
      <wc-input name="name" lbl-label="Name" required></wc-input>
      <button type="submit" class="btn btn-primary">Submit</button>
    </wc-form>
  </div>
  
  <script type="module" src="dist/wave-css.min.js"></script>
</body>
</html>
```

## Common Issues & Solutions

### Issue: Component not rendering
- Check if component is registered in index.js
- Verify base class is correctly extended
- Ensure _render() is called

### Issue: Attributes not updating
- Verify attribute is in observedAttributes array
- Check _handleAttributeChange implementation
- Look for typos in attribute names

### Issue: Events not firing
- Ensure EventHub is imported
- Check selector syntax in broadcast
- Verify event listener registration

## Contributing Guidelines

1. Follow existing naming conventions (wc- prefix)
2. Maintain no-Shadow-DOM principle
3. Use CSS variables for theming
4. Document complex logic with comments
5. Add examples for new components