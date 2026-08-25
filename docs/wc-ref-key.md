# WC-Ref-Key Web Component

Displays a reference key as a small, semi-transparent pill badge fixed to a corner of the viewport (out of flow, so it never affects page layout). Used by `wc-help-drawer` to scan for contextual help keys on the current page.

## Features

- Fixed-position, out-of-flow corner badge (never reserves layout space)
- Semi-transparent by default, becomes fully opaque on hover
- Optional descriptive label shown on hover
- Configurable corner and text orientation (vertical or horizontal)

## Basic Usage

```html
<wc-ref-key value="DST-4002" label="Data Compare"></wc-ref-key>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `value` | `""` | The reference key string (e.g. `DST-4002`), shown in the badge |
| `label` | `""` | Descriptive label shown on hover (also set as the badge's tooltip) |
| `position` | `bottom-right` | Corner position: `top-right`, `top-left`, `bottom-right`, `bottom-left` |
| `orientation` | `vertical` | Text orientation: `vertical` or `horizontal` |

## Examples

### Top-left, horizontal

```html
<wc-ref-key value="HELP-100" label="Getting Started"
            position="top-left" orientation="horizontal"></wc-ref-key>
```

## Notes

- Host element is `display: contents`; the inner `.wc-ref-key` is `position: fixed` (not sticky) so it floats out of normal flow and never steals space from flex siblings.
- Does not emit any custom events.
- Intended to be discovered on the page by `wc-help-drawer` for contextual help.
