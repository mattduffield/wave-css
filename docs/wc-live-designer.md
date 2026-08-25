# WC-Live-Designer Web Component

A visual page builder with a live iframe canvas. It renders real Wave CSS components inside a server-rendered iframe (loaded with `?designer=true`), lets users drag components from a palette, edit properties from the rendered DOM, and saves output as standard `_template_builder` HTML with Pongo2 expressions.

> Related: ./wc-template-preview.md for the lightweight preview harness.

## Features

- Server-rendered iframe canvas for production-accurate preview
- Chrome DevTools-style responsive device presets (phones, tablets, others)
- Drag/drop component insertion, selection outlines, and drop hints (injected edit-mode CSS)
- A `sourceDoc` (DOMParser `Document`) maintained by the parent as the source of truth for save
- Property panel reads from the rendered DOM via a `postMessage` bridge; shows Pongo2 value bindings
- Source tab exposes the full Pongo2 template
- Layout/component presets (edit page, form, list, multi-column, nav bar, field patterns)

## Basic Usage

```html
<wc-live-designer
  canvas-url="/x/article/create?designer=true"
  schema="article"
  theme="theme-ocean dark"></wc-live-designer>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier for the component. |
| `class` | — | CSS classes applied to the component. |
| `canvas-url` | — | URL of the server-rendered page to load in the iframe canvas (Go Kart adds `data-designer` to `<html>` when `?designer=true`). |
| `theme` | — | Theme class(es) applied to the canvas (e.g. `theme-ocean dark`). |
| `api-base-url` | — | Base URL for designer API calls. |
| `schema` | — | Schema/entity name driving sample data and bindings. |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `getFormData(options)` | `Promise<{ content, code, field_rules, tree }>` | Builds the saveable template payload (content HTML, code, field rules, serialized tree) from the current design. |
| `setContent(content)` | — | Set saved Pongo2 template content to reload into the canvas (applies when the canvas is ready). |
| `setSampleData(data)` | — | Set sample data for design-time preview. |
| `getTree()` | `Promise<Array>` | Serialized component tree (read synchronously from `sourceDoc`). |
| `getHTML()` | `Promise<string>` | Raw canvas HTML with editor attributes stripped. |
| `clear()` | — | Clear the canvas. |
| `transformToPongo2(rawHTML)` | `string` | Replace sample-data values in HTML with `{{ Record.field }}` Pongo2 expressions. |

## postMessage protocol

The parent and iframe bridge communicate via `postMessage`:

- **iframe → parent** (`source: "editor-bridge"`): `canvasReady`, `select`, `deselect`, `componentRemoved`, `componentMoved`, `componentInserted`, `duplicateRequest`, `registryBuilt`
- **parent → iframe** (`source: "live-designer"`): `insertHTML`, `updateProperty`, `selectById`, `clear-selection`

## Notes

- The iframe bridge (`src/js/components/designer-bridge.js`) auto-initializes when `html[data-designer]` is detected; it handles selection, drag/drop, toolbar, and `postMessage`.
- Designer CSS is scoped under `html[data-designer]` in `wave-css.css` (selection outlines, drop targets, skeleton indicators, interaction blocking).
- `data-designer-id` attributes persist across save/reload so the `sourceDoc` stays authoritative.
- This component emits no `CustomEvent`s of its own; coordination happens through the `postMessage` bridge.
