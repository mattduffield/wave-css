# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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