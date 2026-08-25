# WC-Fa-Icon Web Component

A Font Awesome icon wrapper that renders icons as inline SVG from bundled icon manifests (no per-icon HTTP requests). Icon styles are auto-loaded on demand from JSON bundles.

> Related: [wc-icon](./wc-icon.md) (fetches individual SVG files), [wc-icon-config](./wc-icon-config.md) (bundle/base URLs), [wc-icon-picker](./wc-icon-picker.md).

## Features

- Renders Font Awesome icons as inline SVG
- Multiple icon styles (solid, regular, light, thin, duotone, and more)
- Duotone support with independent primary/secondary colors and opacities
- Rotation, flipping, spin, and pulse animations
- Icon name aliasing (e.g. `home` → `house`)
- Bundles are loaded once and shared across all instances

## Basic Usage

```html
<wc-fa-icon name="house"></wc-fa-icon>
<wc-fa-icon name="gear" icon-style="regular" size="2rem"></wc-fa-icon>
<wc-fa-icon name="heart" color="crimson"></wc-fa-icon>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Icon name (Font Awesome glyph name; aliases resolved automatically) |
| `icon-style` | `solid` | Icon style / bundle to load (`solid`, `regular`, `light`, `thin`, `duotone`, …) |
| `size` | — | CSS size applied to width and height (e.g. `1rem`, `24px`); unset uses the SVG default |
| `color` | `currentColor` | Icon color (single-color styles) |
| `primary-color` | `color` / `currentColor` | Primary path color (duotone) |
| `secondary-color` | `color` / `currentColor` | Secondary path color (duotone) |
| `secondary-opacity` | `0.4` | Secondary path opacity (duotone) |
| `swap-opacity` | — | Boolean; swaps primary/secondary opacities (duotone) |
| `rotate` | — | Static rotation in degrees |
| `flip` | — | `horizontal`, `vertical`, or `both` |
| `spin` | — | Boolean; continuous spin animation (CSS) |
| `pulse` | — | Boolean; stepped pulse animation (CSS) |

## Methods

Static methods on `WcFaIcon`:

| Method | Description |
|--------|-------------|
| `loadBundle(bundleUrl)` | Load a single icon bundle JSON |
| `loadBundles(bundleUrls)` | Load multiple bundles |
| `registerIcon(name, pathData, iconStyle)` | Register a single icon programmatically |
| `registerIcons(icons, iconStyle)` | Register multiple icons |
| `preloadConfiguredBundles()` | Preload the bundles listed in `WcIconConfig.preloadBundles` |
| `getBundleStats()` | Inspect loaded bundle stats |
| `isIconLoaded(name, style)` | Check whether an icon is present |
| `clearBundles()` | Clear all loaded bundles |

## Examples

```html
<!-- Duotone with custom colors -->
<wc-fa-icon name="cloud" icon-style="duotone"
  primary-color="#2563eb" secondary-color="#93c5fd"></wc-fa-icon>

<!-- Animated spinner -->
<wc-fa-icon name="spinner" spin></wc-fa-icon>

<!-- Rotated and flipped -->
<wc-fa-icon name="arrow-right" rotate="45" flip="horizontal"></wc-fa-icon>
```

## Notes

- `display: contents` — the wrapper does not create its own box.
- Bundles are auto-loaded on demand per `icon-style` from `WcIconConfig.bundleBaseUrl/<style>-icons.json`; configure the base URL via [wc-icon-config](./wc-icon-config.md). An unknown icon renders a `?` placeholder and logs a warning.
- Bundle data is cached in a module-level map and shared across every instance, so repeated icons cost nothing extra.
