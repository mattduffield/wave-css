# WC-Icon-Config

Global configuration object for the Wave CSS icon components. It defines where icon assets and icon bundles are loaded from, and which bundles to preload. It is exported as `WcIconConfig` and also exposed on `window.WcIconConfig`.

> Related: [wc-fa-icon](./wc-fa-icon.md) (reads `bundleBaseUrl`), [wc-icon](./wc-icon.md) (reads `iconBaseUrl`), [wc-icon-picker](./wc-icon-picker.md) (reads `bundleBaseUrl`).

This is a configuration module, not a custom element — there is no `<wc-icon-config>` tag.

## Features

- Central place to point the icon components at your asset host or CDN
- Separate URLs for individual SVG icons (`iconBaseUrl`) and JSON icon bundles (`bundleBaseUrl`)
- Can be pre-seeded from `window.WcIconConfig` before the bundle loads
- Optional list of bundles to preload

## Properties

| Property | Default | Description |
|----------|---------|-------------|
| `iconBaseUrl` | `/dist/assets/icons` | Base URL for individual SVG icon files (used by `wc-icon`) |
| `bundleBaseUrl` | `/dist/assets/icon-bundles` | Base URL for JSON icon bundles (used by `wc-fa-icon` and `wc-icon-picker`) |
| `preloadBundles` | `[]` | Array of bundle names/URLs to preload |

## Methods

| Method | Description |
|--------|-------------|
| `setIconBaseUrl(url)` | Set the SVG icon base URL (trailing slash stripped) |
| `setBundleBaseUrl(url)` | Set the bundle base URL (trailing slash stripped) |
| `setBaseUrl(url)` | Set both at once — `<url>/icons` and `<url>/icon-bundles` |
| `setPreloadBundles(bundles)` | Set the list of bundles to preload |

## Examples

Configure before the bundle loads by setting the global:

```html
<script>
  window.WcIconConfig = {
    iconBaseUrl: 'https://cdn.example.com/wave-css/icons',
    bundleBaseUrl: 'https://cdn.example.com/wave-css/icon-bundles',
    preloadBundles: ['solid', 'regular']
  };
</script>
<script type="module" src="/dist/wave-css.min.js"></script>
```

Configure at runtime via the API:

```javascript
import { WcIconConfig } from './wc-icon-config.js';

// Point both at one host
WcIconConfig.setBaseUrl('https://cdn.example.com/wave-css');

// Or set individually
WcIconConfig.setBundleBaseUrl('/static/icon-bundles');
```

## Notes

- If `window.WcIconConfig` is already set when the module loads, those values seed the defaults; otherwise the module assigns itself to `window.WcIconConfig`.
- Set the global before the Wave CSS bundle runs so the icon components pick up your URLs on first use.
