# WC-Icon Web Component

A basic SVG icon component that fetches individual Font Awesome SVG files by name from a configurable base path. Icons are cached and shared across all instances.

> Related: [wc-fa-icon](./wc-fa-icon.md) (loads from bundled JSON manifests instead of per-file fetches), [wc-icon-config](./wc-icon-config.md), [wc-icon-picker](./wc-icon-picker.md).

## Features

- Renders icons as inline SVG fetched from `<base-path>/<style>/<name>.svg`
- Multiple icon styles (solid, regular, light, thin, duotone, and more)
- Duotone support with independent primary/secondary colors and opacities
- Rotation, flipping, spin, and pulse animations
- Icon name aliasing (e.g. `home` → `house`)
- Global icon cache with in-flight request de-duplication

## Basic Usage

```html
<wc-icon name="home"></wc-icon>
<wc-icon name="gear" icon-style="regular" size="2rem"></wc-icon>
<wc-icon name="heart" color="crimson"></wc-icon>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Icon name (aliases resolved automatically) |
| `icon-style` | `solid` | Icon style / subfolder (`solid`, `regular`, `light`, `thin`, `duotone`, …) |
| `size` | — | CSS size applied to width and height (e.g. `1rem`, `24px`) |
| `color` | `currentColor` | Icon color (single-color styles) |
| `primary-color` | `color` / `currentColor` | Primary path color (duotone) |
| `secondary-color` | `color` / `currentColor` | Secondary path color (duotone) |
| `secondary-opacity` | `0.4` | Secondary path opacity (duotone) |
| `swap-opacity` | — | Boolean; swaps primary/secondary opacities (duotone) |
| `rotate` | — | Static rotation in degrees |
| `flip` | — | `horizontal`, `vertical`, or `both` |
| `base-path` | `/dist/assets/icons` | Base URL to fetch SVG files from |
| `spin` | — | Boolean; continuous spin animation (CSS) |
| `pulse` | — | Boolean; stepped pulse animation (CSS) |

## Methods

Static methods on `WcIcon`:

| Method | Description |
|--------|-------------|
| `setBasePath(path)` | Set the default base path for all instances |
| `registerIcon(name, pathData, iconStyle)` | Register a single icon programmatically |
| `registerIcons(icons, iconStyle)` | Register multiple icons |
| `preloadIcons(iconList)` | Preload a list of icons into the cache |
| `clearCache()` | Clear the icon cache |
| `getCacheStats()` | Inspect cache stats |

## Examples

```html
<!-- Custom base path -->
<wc-icon name="user" base-path="/static/icons"></wc-icon>

<!-- Duotone with custom colors -->
<wc-icon name="cloud" icon-style="duotone"
  primary-color="#2563eb" secondary-color="#93c5fd"></wc-icon>

<!-- Animated -->
<wc-icon name="spinner" spin></wc-icon>
```

## Notes

- `display: contents` — the wrapper does not create its own box.
- SVGs are fetched individually over the network (one request per unique icon); results are cached in a module-level map shared across all instances, with pending requests de-duplicated. For zero-request rendering from a preloaded manifest, use [wc-fa-icon](./wc-fa-icon.md).
- The default base path can also be configured via [wc-icon-config](./wc-icon-config.md) (`iconBaseUrl`).
