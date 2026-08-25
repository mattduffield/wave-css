# WC-Progress Web Component

A lightweight linear progress bar that renders a track and fill from `value`/`max` or a direct `percent`, with semantic color variants and sizes.

> Related: ./wc-busy-indicator.md, ./wc-loader.md.

## Features

- Progress from `value`/`max` or a direct `percent` (0–100)
- Six semantic color variants
- Three sizes (sm / md / lg)
- Optional left-aligned label and right-aligned percentage text
- Optional animated fill transition on value changes
- Accessible: `role="progressbar"` with `aria-valuenow`/`min`/`max`

## Basic Usage

```html
<wc-progress value="75" max="100" variant="success" size="sm" label="Storage" show-value></wc-progress>
<wc-progress percent="40" variant="warning"></wc-progress>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `value` | `0` | Current value |
| `max` | `100` | Maximum value (ignored when `percent` is set) |
| `percent` | — | Direct percentage 0–100; overrides `value`/`max` |
| `variant` | `default` | Fill color: `default` (primary), `success`, `warning`, `danger`, `info`, `muted` |
| `size` | `md` | Track height: `sm` (4px), `md` (8px), `lg` (16px) |
| `label` | — | Text label shown to the left |
| `show-value` | — | Boolean; show the computed percentage text to the right |
| `animate` | — | Boolean; animate fill width on value changes (300ms) |

## Examples

```html
<!-- Animated, at max -->
<wc-progress value="2" max="2" animate></wc-progress>

<!-- Large info bar with label and value -->
<wc-progress percent="62" variant="info" size="lg" label="Upload" show-value></wc-progress>
```

## Notes

- The percentage is clamped to 0–100; if `max <= 0` the percent is 0.
- Host element uses `display: contents`.
