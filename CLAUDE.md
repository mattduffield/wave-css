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
# Note: build automatically runs copy-fa-pro-svgs before bundling
# and auto-syncs dist/wave-css-0.0.1/ versioned folder including icon bundles
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

- `WcBaseComponent`: Foundation for all components, handles lifecycle, attributes, rendering, and `ready` promise
- `WcBaseFormComponent`: Extends base with form-specific functionality (value, name, validation)

### Ready Promise

All components expose `ready` (Promise) and `isReady` (boolean) for knowing when a component is fully initialized. Simple components resolve automatically at the end of `_connectedCallback()`. Async components (wc-tabulator, wc-code-mirror, wc-chart, wc-chart-builder, wc-pivot, wc-select with url, wc-table with url, wc-article-card with url) set `this._deferReady = true` in their constructor and call `this._setReady()` when truly ready.

```javascript
// JavaScript
await myComponent.ready;
myComponent.data = myData;

// Hyperscript
_="on load wait for me.ready set my.data to window.myData end"
```

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

### CSS Grid Utilities

Tailwind-compatible CSS grid classes are available: `grid-cols-1` through `grid-cols-12`, `grid-rows`, `col-span`, `row-span`, and `grid-flow` classes at all breakpoints (base + sm/md/lg/xl/2xl).

## Component Categories

### Layout Components
- `wc-sidebar`: Sidebar navigation component
- `wc-sidenav`: Side navigation menu
- `wc-split-pane`: Resizable split panel with draggable divider, horizontal/vertical layouts, collapsible, localStorage persistence
- `wc-split-start`: Start pane content wrapper for wc-split-pane
- `wc-split-end`: End pane content wrapper for wc-split-pane

### Form Components (extend WcBaseFormComponent)
- `wc-form`: Form wrapper with validation
- `wc-input`: Text input field
- `wc-select`: Dropdown select; `wcoptionsloaded` event fires after URL options load
- `wc-textarea`: Multi-line text input
- `wc-cron-picker`: Visual cron schedule picker; generates 5-field cron expressions; frequencies: minute, N minutes, hour, N hours, day, weekday, weekend, week, month, custom; `wccronchange` event; collapsible syntax reference

### Display Components
- `wc-accordion`: Collapsible content sections
- `wc-article-card`: Article card display
- `wc-contact-card`: Contact information card
- `wc-contact-chip`: Compact contact display
- `wc-flip-box`: Flippable content box
- `wc-google-map`: Google Maps integration with single/multiple pins
- `wc-image`: Enhanced image component
- `wc-background-image`: Background image container

### Content Components
- `wc-markdown-viewer`: Enhances goldmark-rendered markdown HTML with Prism.js syntax highlighting and copy-to-clipboard buttons on code blocks; auto-processes on connect and after HTMX swaps; supports json, javascript, sql, bash, go, html, python, ruby, and more

### Icon Components
- `wc-fa-icon`: Font Awesome icon wrapper
- `wc-icon`: Basic icon component

### Navigation Components
- `wc-menu`: Menu system with HTMX support
- `wc-breadcrumb`: Breadcrumb navigation
- `wc-breadcrumb-item`: Individual breadcrumb item
- `wc-tab`: Tab container (supports right-click context menu on removable tabs with Close, Close Others, Close All, Close to Right, Close to Left; public methods: `closeOthers(label)`, `closeAll()`, `closeToRight(label)`, `closeToLeft(label)`; uses wc-context-menu internally; `no-hash` attribute suppresses URL hash updates on tab click)
- `wc-tab-item`: Individual tab item
- `wc-dropdown`: Dropdown menu; `btn-class` attribute for trigger button styling
- `wc-dropdown-item`: Dropdown menu item
- `wc-wizard`: Step-by-step wizard (same pattern as wc-tab); inline step content shown/hidden via CSS; `next()`, `back()`, `goTo(n)` public methods; `wcwizardstepchange` event; consumer provides navigation buttons externally
- `wc-wizard-step`: Child element for wc-wizard containing inline step content (label, icon, before-navigate)

### Data Components
- `wc-tabulator`: Advanced data table; supports `auto-columns` attribute for auto-generating columns from data, `data` attribute for inline JSON arrays
- `wc-tabulator-column`: Table column definition
- `wc-tabulator-func`: Table function helpers
- `wc-tabulator-row-menu`: Row context menu
- `wc-timeline`: Timeline visualization
- `wc-explain-tree`: Visual MongoDB explain plan viewer with stage flow diagram, color-coded stages, branching, aggregation pipeline support, click-to-expand detail
- `wc-pivot`: Cross-tabulation pivot table with four-zone field panel (Rows/Columns/Values/Filters), value filters, drill-down with inline detail tables, heatmap, column sorting, date grouping (year/quarter/month/day/datetime), compact layout toggle, config save/load (`getConfig()`/`loadConfig()`), CSV export

### Interactive Components
- `wc-slideshow`: Image slideshow
- `wc-slideshow-image`: Slideshow image item
- `wc-chart-builder`: Interactive chart renderer from raw JSON with auto-detection, field pickers, supports bar/line/pie/doughnut/area/number types
- `wc-code-mirror`: Code editor integration; `hint-words` and `hint-url` attributes for autocomplete support with JSON-context-aware quote wrapping; Pongo2/Django template syntax overlay for htmlmixed mode; pre-loads mode scripts before editor creation; editor always initialized (never null); `display()` method for refresh; supports python, go, ruby, rust, sql, shell, yaml, swift, clike-based MIME types; sublime keymap with find/replace (Cmd+F find, Cmd+D select next occurrence, Cmd+Alt+F replace)
- `wc-canvas-dot-highlight`: Canvas animation effect
- `wc-context-menu`: Reusable context menu with static `WcContextMenu.show(x, y, items)` / `WcContextMenu.hide()` API
- `wc-context-menu-item`: Declarative menu item for wc-context-menu

### Button Components
- `wc-save-button`: Save action button
- `wc-save-split-button`: Split button with save options; `btn-class` attribute for save button styling
- `wc-split-button`: Generic split button; `btn-class` attribute for trigger button styling

### Navigation Components
- `wc-tree`: Hierarchical tree with nested items, icons, badges, search, lazy-url, HTMX support, `hash-nav` attribute for URL hash tracking (auto-select from hash on load, update hash on click, uses `data-hash` or `label`)
- `wc-tree-item`: Tree node (label, icon, badge, expanded, selected, lazy-url); emits `wctreeitemexpand` / `wctreeitemcollapse` events (bubbles: false); supports `data-tree-action` attribute for hover-reveal action buttons; `hx-trigger` and `hx-disinherit` in observedAttributes; click behavior: only arrow toggles expand/collapse, clicking elsewhere selects

### Data Components
- `wc-table`: Lightweight data-driven table (url, items, sorting, formatting, events)
- `wc-table-col`: Column definition for wc-table (field, label, sortable, align, format)

### AI/Bot Components
- `wc-ai-bot`: AI chatbot interface
- `wc-hf-bot`: Hugging Face bot interface

### Skeleton/Loading Components
- `wc-loader`: Loading spinner
- `wc-article-skeleton`: Article loading skeleton
- `wc-card-skeleton`: Card loading skeleton
- `wc-list-skeleton`: List loading skeleton
- `wc-table-skeleton`: Table loading skeleton

### Support Components
- `wc-help-drawer`: Slide-out help drawer with Help (HTMX-loaded), Create Ticket (with screenshot capture), and My Tickets tabs; triggered by "?" button or Ctrl+/; events: `wchelpdraweropen`, `wchelpdrawerclose`, `wchelpticketcreated`

### Utility Components
- `wc-theme-selector`: Theme switcher
- `wc-theme`: Theme manager
- `wc-prompt`: User prompt dialog
- `wc-notify`: Notification system
- `wc-live-designer`: Visual page builder with server-rendered iframe preview
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
- `views/split-pane.html` - Split pane examples
- `views/context-menu.html` - Context menu examples
- `views/tab.html` - Tab component with dynamic tabs and context menu testing
- `views/chart-builder.html` - Chart Builder demos with auto-detect, KPI numbers, dynamic data
- `views/pivot.html` - Pivot table demos with heatmap, sorting, cell click events, CSV export
- `views/explain-tree.html` - MongoDB explain plan viewer demos
- `views/cron-picker.html` - Cron picker demos with all frequency options, form integration, events

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

## Knowledge Bases

Structured JSON knowledge bases exist for this project and its related projects. Read the relevant ones when generating code, answering questions, or using slash commands.

- **Wave CSS**: `docs/wave-css-knowledge.json` (37.7 KB) — component catalog, attributes, CSS utilities, themes
- **Go Kart**: `/Users/matthewduffield/Documents/_learn/go-kart/docs/go-kart-knowledge.json` (38.7 KB) — template system, code tab patterns, field rules, web pilots
- **LiteSpec**: `/Users/matthewduffield/Documents/_dev/lite-spec/docs/lite-spec-knowledge.json` (16.5 KB) — schema DSL syntax, attributes, conditional validation

### Real Production Examples (read for accurate pattern matching)
- **Template examples**: `/Users/matthewduffield/Documents/_learn/go-kart/docs/template-examples.json` — 10 real templates (prospect, kanban, credential vault)
- **Template fragments**: `/Users/matthewduffield/Documents/_learn/go-kart/docs/template-fragments.json` — 11 reusable fragments (base, meta_fields, prospect_general)
- **Web pilot examples**: `/Users/matthewduffield/Documents/_learn/go-kart/docs/web-pilot-examples.json` — Full NC Auto chain (11 Playwright scripts)

### When to read knowledge bases
- `/create-schema` — reads LiteSpec knowledge
- `/create-template` — reads Go Kart + Wave CSS + real examples
- `/create-screen` — reads all three + real examples
- `/create-component` — reads Wave CSS knowledge + base component source
- `/create-web-pilot` — reads Go Kart knowledge + web pilot examples

### Project relationships
- **Go Kart** uses Wave CSS components for its frontend UI
- **Go Kart** uses LiteSpec to define schemas that drive dynamic form/table generation
- **Wave CSS** is the standalone component library
- **LiteSpec** is the standalone schema DSL (consumed by Go Kart's schema builder)