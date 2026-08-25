# WC-Busy-Indicator Web Component

A themeable loading/busy indicator with many animation styles — chart-flavored SVG animations plus classic spinner, pulse, dots, and skeleton.

> Related: ./wc-progress.md, ./wc-loader.md.

## Features

- Multiple indicator types (chart bars, line, ECG, pie, doughnut, connector, spinner, pulse, dots, skeleton)
- Optional caption text below the animation
- Three sizes (small / medium / large)
- Theme-driven colors with configurable multi-color variation for chart types
- `show()` / `hide()` methods

## Basic Usage

```html
<wc-busy-indicator></wc-busy-indicator>
<wc-busy-indicator type="chart-bar" text="Loading chart data..."></wc-busy-indicator>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `type` | `spinner` | Indicator style: `chart-bar`, `chart-line`, `chart-ecg`, `horizontal-bar`, `chart-connector`, `chart-pie`, `chart-doughnut`, `spinner`, `pulse`, `dots`, `skeleton` |
| `text` | — | Optional caption shown below the indicator |
| `size` | `medium` | `small`, `medium`, or `large` |
| `color` | theme primary | Custom color (falls back to the theme primary color) |
| `color-variation` | see notes | Multi-color mode for chart types: `standard`, `subtle`, `off` |
| `color-levels` | `4,6,7,8,10` | Comma-separated `--surface-*` levels used in `standard` variation mode |

## Methods

| Method | Description |
|--------|-------------|
| `show()` | Show the indicator (clears inline `display`) |
| `hide()` | Hide the indicator (`display: none`) |

## Examples

```html
<wc-busy-indicator type="chart-doughnut" size="large"></wc-busy-indicator>
<wc-busy-indicator type="dots" text="Please wait…"></wc-busy-indicator>
<wc-busy-indicator type="chart-bar" color-variation="subtle"></wc-busy-indicator>
```

## Notes

- `color-variation` defaults to `standard` for `chart-bar`, `chart-pie`, and `chart-doughnut`; it defaults to `off` for all other types.
- Chart-type indicators derive their palette from the theme's `--surface-*` variables (or HSL lightness steps in `subtle` mode).
- Host element uses `display: contents`.
