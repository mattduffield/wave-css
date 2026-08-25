# Wave CSS — Component & Documentation Index

Every component in `src/js/components/` has a reference page here. Start with the guides, then jump to a component. Categories mirror `CLAUDE.md`.

## Guides & references

- [THEMES.md](./THEMES.md) — How theming works — hue/chroma, light/dark, crisp, tokens, cascade layers
- [COLORS.md](./COLORS.md) — Color & CSS-variable token reference
- [COMPONENT_API.md](./COMPONENT_API.md) — Base classes, event system, theming, AI-bot chooser
- [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) — Quick reference
- [REFERENCE-GUIDE.md](./REFERENCE-GUIDE.md) — Reference guide
- [EXAMPLES_INDEX.md](./EXAMPLES_INDEX.md) — Index of example views
- [DEPENDENCY-MANAGEMENT.md](./DEPENDENCY-MANAGEMENT.md) — Self-hosting / lazy-loaded third-party deps
- [wc-base-component.md](./wc-base-component.md) — Base class for all components
- [wc-base-form-component.md](./wc-base-form-component.md) — Base class for form components

## Components by category

### Layout Components

- [`wc-sidebar`](./wc-sidebar.md) — The wc-sidebar is a customizable web component that creates a fixed sidebar navigation with support for both left and right positioning, the.
- [`wc-sidenav`](./wc-sidenav.md) — The wc-sidenav is a customizable web component that creates a collapsible side navigation panel with support for both left and right positio.
- [`wc-split-pane`](./wc-split-pane.md) — A resizable split panel component with a draggable divider.

### Form Components (extend WcBaseFormComponent)

- [`wc-form`](./wc-form.md) — wc-form is a custom web component that extends the native HTML form functionality, providing a more structured and feature-rich form handlin.
- [`wc-input`](./wc-input.md) — The wc-input is a versatile web component that provides enhanced form input functionality with support for various input types, styling, and.
- [`wc-select`](./wc-select.md) — The wc-select is a customizable web component that provides enhanced select/dropdown functionality with support for both single and multiple.
- [`wc-combobox`](./wc-combobox.md) — A single-value combobox: type free text AND/OR pick from DB-loaded suggestions.
- [`wc-textarea`](./wc-textarea.md) — A custom web component that provides an enhanced textarea input with form association capabilities and additional features.
- [`wc-record-lookup`](./wc-record-lookup.md) — A typeahead that searches an EXISTING collection via a server endpoint and, on select, either emits the chosen record or fills sibling form .
- [`wc-icon-picker`](./wc-icon-picker.md) — A form-associated, searchable visual icon picker.
- [`wc-slider`](./wc-slider.md) — A form-associated bounded numeric slider.
- [`wc-rating`](./wc-rating.md) — A form-associated icon rating field.
- [`wc-color`](./wc-color.md) — A form-associated color picker field.
- [`wc-cron-picker`](./wc-cron-picker.md) — A visual, dropdown-driven schedule picker that generates standard 5-field cron expressions, with a human-readable description and a collapsi.
- [`wc-form-array`](./wc-form-array.md) — A declarative, repeatable sub-form for an array-of-objects, designed to live inside <wc-form>.
- [`wc-form-array-column`](./wc-form-array-column.md) — A configuration-only child of <wc-form-array>.
- [`wc-file-upload`](./wc-file-upload.md) — A form-associated file/image upload field.
- [`wc-rich-text`](./wc-rich-text.md) — A form-associated rich-text / markdown editor — the editable counterpart to wc-markdown-viewer.

### Display Components

- [`wc-accordion`](./wc-accordion.md) — A customizable accordion web component that provides collapsible content sections with smooth animations and flexible configuration options.
- [`wc-article-card`](./wc-article-card.md) — A card that fetches article metadata (title, description, image, publish date, domain) from a URL and renders it as a linked preview card.
- [`wc-contact-card`](./wc-contact-card.md) — A contact information card with an avatar image, name, and title, composing the shared .card look.
- [`wc-contact-chip`](./wc-contact-chip.md) — A compact, inline contact chip with a circular avatar, name, and a dismiss (×) button.
- [`wc-flip-box`](./wc-flip-box.md) — The wc-flip-box is a web component that creates an interactive flip card effect, where content can be displayed on both front and back sides.
- [`wc-google-map`](./wc-google-map.md) — A Google Maps integration with single or multiple pins.
- [`wc-map`](./wc-map.md) — A keyless, $0/mo, provider-agnostic interactive map built on MapLibre GL JS + free OpenFreeMap vector tiles.
- [`wc-address`](./wc-address.md) — A keyless, $0/mo, provider-agnostic address type-ahead — a drop-in replacement for wc-google-address.
- [`wc-data-cards`](./wc-data-cards.md) — A generic, data-bound responsive card gallery.
- [`wc-barcode`](./wc-barcode.md) — Renders a scannable code (QR by default, Code128 optional) plus the human-readable value, as crisp print-quality SVG.
- [`wc-checkin`](./wc-checkin.md) — A touch-friendly scan-to-check-in / check-out station for a staffed tablet.
- [`wc-image`](./wc-image.md) — The wc-image is a versatile web component that provides enhanced image display capabilities, including modal viewing and hover overlay effec.
- [`wc-background-image`](./wc-background-image.md) — The wc-background-image is a custom web component that creates a parallax background image effect with an optional caption.

### Content Components

- [`wc-markdown-viewer`](./wc-markdown-viewer.md) — Enhances server-rendered (goldmark) markdown HTML with Prism.js syntax highlighting and copy-to-clipboard buttons on code blocks.

### Icon Components

- [`wc-fa-icon`](./wc-fa-icon.md) — A Font Awesome icon wrapper that renders icons as inline SVG from bundled icon manifests (no per-icon HTTP requests).
- [`wc-icon`](./wc-icon.md) — A basic SVG icon component that fetches individual Font Awesome SVG files by name from a configurable base path.

### Navigation Components

- [`wc-menu`](./wc-menu.md) — A responsive navigation menu that builds HTMX-powered links from declarative <option> children (or an items JSON array), with a mobile hambu.
- [`wc-breadcrumb`](./wc-breadcrumb.md) — The wc-breadcrumb is a custom web component that creates a navigation breadcrumb trail with HTMX integration.
- [`wc-breadcrumb-item`](./wc-breadcrumb-item.md) — An individual breadcrumb entry.
- [`wc-tab`](./wc-tab.md) — A flexible and customizable tab system that supports both horizontal and vertical layouts, animations, and nested tabs.
- [`wc-tab-item`](./wc-tab-item.md) — An individual tab content panel used inside wc-tab.
- [`wc-dropdown`](./wc-dropdown.md) — A customizable dropdown web component that supports multiple modes, formats, and positioning options.
- [`wc-dropdown-item`](./wc-dropdown-item.md) — A lightweight semantic wrapper for a single dropdown entry, used inside wc-dropdown.
- [`wc-wizard`](./wc-wizard.md) — A declarative step-by-step wizard.
- [`wc-wizard-step`](./wc-wizard-step.md) — A child element for wc-wizard that holds one step's inline content.
- [`wc-tree`](./wc-tree.md) — A hierarchical tree component for navigation.
- [`wc-tree-filter`](./wc-tree-filter.md) — Configuration-only child element for wc-tree.
- [`wc-tree-item`](./wc-tree-item.md) — A node in a wc-tree hierarchy.

### Data Components

- [`wc-tabulator`](./wc-tabulator.md) — A powerful and flexible table/data grid web component built on top of the Tabulator library, offering features like pagination, sorting, fil.
- [`wc-tabulator-column`](./wc-tabulator-column.md) — A configuration-only child element of wc-tabulator.
- [`wc-tabulator-func`](./wc-tabulator-func.md) — A configuration-only child element of wc-tabulator.
- [`wc-tabulator-row-menu`](./wc-tabulator-row-menu.md) — A configuration-only child element of wc-tabulator.
- [`wc-timeline`](./wc-timeline.md) — A custom web component that creates a responsive, vertical timeline with alternating left and right entries.
- [`wc-gantt`](./wc-gantt.md) — A horizontal Gantt / swimlane chart.
- [`wc-document-tree`](./wc-document-tree.md) — A MongoDB document viewer that renders documents as an expandable/collapsible key-value tree with type badges, click-to-copy values, and an .
- [`wc-explain-tree`](./wc-explain-tree.md) — A visual MongoDB explain-plan viewer that renders explain output as a stage-by-stage flow diagram with color-coded stages, branching, aggreg.
- [`wc-pivot`](./wc-pivot.md) — A full-featured cross-tabulation pivot table built from arbitrary JSON data.
- [`wc-table`](./wc-table.md) — Wave CSS provides a comprehensive set of CSS classes for styling standard HTML <table> elements.
- [`wc-table-col`](./wc-table-col.md) — A configuration-only child element of wc-table.
- [`wc-kanban`](./wc-kanban.md) — A declarative status board.
- [`wc-calendar`](./wc-calendar.md) — Binds an array of record-like events onto a date grid with month / week / day / agenda views.

### Interactive Components

- [`wc-slideshow`](./wc-slideshow.md) — A lightweight, customizable slideshow web component that supports auto-play, manual navigation, and image captions.
- [`wc-slideshow-image`](./wc-slideshow-image.md) — A single image slide used inside a wc-slideshow.
- [`wc-chart-builder`](./wc-chart-builder.md) — An interactive chart renderer that builds charts from arbitrary JSON data with auto-detection and an optional field-picker UI.
- [`wc-code-mirror`](./wc-code-mirror.md) — The wc-code-mirror is a custom web component that wraps CodeMirror 5, providing a feature-rich code editor with syntax highlighting, line nu.
- [`wc-canvas-dot-highlight`](./wc-canvas-dot-highlight.md) — A custom web component that creates an interactive dot matrix animation with mouse-following highlight effects.
- [`wc-context-menu`](./wc-context-menu.md) — A reusable context (right-click) menu.

### Multi-zone FX Board (station player + master console)

- [`wc-fx-board`](./wc-fx-board.md) — A per-station player for a multi-zone sound/vision board.
- [`wc-fx-console`](./wc-fx-console.md) — The MASTER console for a multi-zone FX board.

### Button Components

- [`wc-save-button`](./wc-save-button.md) — The wc-save-button is a custom web component that creates a standardized save button with built-in HTMX functionality for handling form subm.
- [`wc-save-split-button`](./wc-save-split-button.md) — The wc-save-split-button is a custom web component that creates a split button with a primary save action and a dropdown menu containing add.
- [`wc-split-button`](./wc-split-button.md) — A customizable split button web component that combines a primary action button with a dropdown menu for additional options.

### AI/Bot Components

- [`wc-ai-bot`](./wc-ai-bot.md) — wc-ai-bot is a chat assistant that runs a Large Language Model in the browser (no server.
- [`wc-hf-bot`](./wc-hf-bot.md) — wc-hf-bot is a chat assistant that runs a Hugging Face Transformers.js model entirely in.

### Data Display Components

- [`wc-progress`](./wc-progress.md) — A lightweight linear progress bar that renders a track and fill from value/max or a direct percent, with semantic color variants and sizes.

### Skeleton/Loading Components

- [`wc-loader`](./wc-loader.md) — wc-loader is a customizable loading spinner.
- [`wc-article-skeleton`](./wc-article-skeleton.md) — The wc-article-skeleton is a custom web component that creates a loading skeleton UI for article content.
- [`wc-card-skeleton`](./wc-card-skeleton.md) — The wc-card-skeleton is a custom web component that creates a loading skeleton UI for card content.
- [`wc-list-skeleton`](./wc-list-skeleton.md) — The wc-list-skeleton is a custom web component that creates a loading skeleton UI for list content.
- [`wc-table-skeleton`](./wc-table-skeleton.md) — The wc-table-skeleton is a custom web component that creates a loading skeleton UI for table content.

### Support Components

- [`wc-help-drawer`](./wc-help-drawer.md) — A slide-out help drawer with three tabs — Help (HTMX-loaded content with search), Create Ticket (form with screenshot capture), and My Ticke.

### Utility Components

- [`wc-theme-selector`](./wc-theme-selector.md) — A custom web component that provides a theme selection interface with support for light/dark mode switching.
- [`wc-theme`](./wc-theme.md) — A lightweight web component that automatically applies saved theme preferences to your application, ensuring theme consistency across page l.
- [`wc-prompt`](./wc-prompt.md) — wc-prompt is a versatile notification and prompt component that integrates SweetAlert2 and notie libraries to provide a comprehensive suite .
- [`wc-notify`](./wc-notify.md) — A toast notification system with stacking, auto-dismiss, and persistent (manually-dismissible) options.
- [`wc-live-designer`](./wc-live-designer.md) — A visual page builder with a live iframe canvas.
- [`wc-template-preview`](./wc-template-preview.md) — An in-page preview harness that renders a screen template inside an <iframe> with toggles to show/hide the preview and to enable/disable dra.

### Non-UI Components

- [`wc-event-hub`](./wc-event-hub.md) — wc-event-hub is a centralized event management component that facilitates cross-component communication and event broadcasting.
- [`wc-event-handler`](./wc-event-handler.md) — wc-event-handler is a utility web component that listens for custom events and performs DOM manipulations based on the event details.
- [`wc-event-stream`](./wc-event-stream.md) — A thin declarative wrapper around the browser EventSource (Server-Sent Events) API.
- [`wc-websocket`](./wc-websocket.md) — A declarative WebSocket wrapper.
- [`wc-mask-hub`](./wc-mask-hub.md) — The wc-mask-hub is a singleton utility component that provides input masking functionality using the IMask.js library.
- [`wc-behavior`](./wc-behavior.md) — wc-behavior is a specialized web component that enables HTMX behavior delegation to parent containers and handles custom event triggering.
- [`wc-visibility-change`](./wc-visibility-change.md) — A custom web component that enables automatic HTMX requests when a user switches between browser tabs.
- [`wc-hotkey`](./wc-hotkey.md) — wc-hotkey is a lightweight web component that enables keyboard shortcuts (hotkeys) for any clickable element on your page.
- [`wc-link`](./wc-link.md) — A dynamic CSS stylesheet loader.
- [`wc-script`](./wc-script.md) — A dynamic JavaScript loader.
- [`wc-javascript`](./wc-javascript.md) — wc-javascript is a specialized web component designed to handle JavaScript code insertion in both traditional web pages and HTMX-powered app.
- [`wc-div`](./wc-div.md) — An enhanced <div> wrapper.

### Other / base & config elements

- [`wc-address-listener`](./wc-address-listener.md) — A helper that listens for address-change events and updates child form fields based on their name attribute.
- [`wc-base-component`](./wc-base-component.md) — A foundational base class for creating web components with common functionality for attribute handling, child component management, styling,.
- [`wc-base-form-component`](./wc-base-form-component.md) — A foundational base class for creating form-associated web components.
- [`wc-base-template`](./wc-base-template.md) — A minimal structural wrapper used as a container/host for template infrastructure (e.g.
- [`wc-busy-indicator`](./wc-busy-indicator.md) — A themeable loading/busy indicator with many animation styles — chart-flavored SVG animations plus classic spinner, pulse, dots, and skeleto.
- [`wc-chart`](./wc-chart.md) — A declarative Chart.js wrapper that renders bar, line, and other chart types from JSON attributes.
- [`wc-chartjs`](./wc-chartjs.md) — An extension of wc-chart that loads its data from a URL via AJAX, with loading/error states, auto-refresh, and an expand/collapse button.
- [`wc-code-mirror-context-menu`](./wc-code-mirror-context-menu.md) — A configuration-only child element for wc-code-mirror.
- [`wc-document-tree-context-menu`](./wc-document-tree-context-menu.md) — Configuration-only child element for wc-document-tree.
- [`wc-emoji`](./wc-emoji.md) — An emoji reaction bar with an expandable, categorized emoji picker.
- [`wc-field`](./wc-field.md) — A read-only informational display component that pairs an optional label with a value (or arbitrary child content).
- [`wc-google-address`](./wc-google-address.md) — The wc-google-address is a web component that provides Google Places Autocomplete functionality for address input, with automatic address pa.
- [`wc-icon-config`](./wc-icon-config.md) — Global configuration object for the Wave CSS icon components.
- [`wc-ref-key`](./wc-ref-key.md) — Displays a reference key as a small, semi-transparent pill badge fixed to a corner of the viewport (out of flow, so it never affects page la.
- [`wc-step-outline`](./wc-step-outline.md) — A companion to wc-code-mirror (with step-gutter) that renders a hierarchical list of {% call step %} blocks parsed from a target editor's co.
- [`wc-step-palette`](./wc-step-palette.md) — A vertical column of tiles, one per documented step type, that insert a {% call step(name="", type="X") %} skeleton at the cursor of a targe.
- [`wc-top-nav`](./wc-top-nav.md) — A responsive top navigation bar that builds HTMX-powered links from declarative <option> children or an items JSON array, with a mobile hamb.
- [`wc-vin-decoder`](./wc-vin-decoder.md) — wc-vin-decoder is a form-associated text input for a vehicle VIN that automatically.
- [`wc-vin-listener`](./wc-vin-listener.md) — wc-vin-listener wraps a group of form fields (and/or links) that should auto-populate when a.

---

_116 component pages · index generated from CLAUDE.md categories._
