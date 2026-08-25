# WC-Base-Template Web Component

A minimal structural wrapper used as a container/host for template infrastructure (e.g. a top-nav shell). It relocates its declarative children into an inner `.wc-base-template` container and integrates with the Wave CSS base component lifecycle. The host element is `display: contents`.

## Features

- Wraps declarative children in an inner `.wc-base-template` container
- Standard Wave CSS attribute handling for `id` / `class`
- Re-processes injected content with HTMX when available
- `display: contents` host so it doesn't affect layout

## Basic Usage

```html
<wc-base-template id="top-nav"></wc-base-template>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier for the component. |
| `class` | — | CSS classes applied to the component. |

## Notes

- This is infrastructure plumbing rather than a visual component: it defines no styling of its own beyond `display: contents` on the host.
- `_handleAttributeChange` is intentionally a no-op in the current source.
