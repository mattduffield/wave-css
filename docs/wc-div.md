# WC-Div Web Component

An enhanced `<div>` wrapper. It relocates its declarative child content into an inner `.wc-div` container and integrates with the Wave CSS base component lifecycle (class/id handling, HTMX processing). The host element itself is `display: contents`.

## Features

- Wraps declarative children in a positioned `.wc-div` container
- Standard Wave CSS attribute handling for `id` / `class`
- Re-processes injected content with HTMX when available
- `display: contents` host so it doesn't affect layout

## Basic Usage

```html
<wc-div class="p-4">
  <!-- content -->
</wc-div>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier for the component. |
| `class` | — | CSS classes applied to the component. |

## Methods

| Method | Description |
|--------|-------------|
| `getInnerContainer()` | Returns the inner `.wc-div` element (or the host if not found). |

## Examples

```html
<wc-div class="p-4 rounded shadow">
  <h2>Panel</h2>
  <p>Enhanced div content moved into the inner container.</p>
</wc-div>
```

## Notes

- The inner `.wc-div` is `position: relative; display: block`; the `wc-div` host is `display: contents`.
- Only `id` and `class` are honored. (Earlier `caption` / `img-url` / `min-height` parallax attributes were never implemented — their handlers are no-ops — and have been dropped from the component's documentation.)
