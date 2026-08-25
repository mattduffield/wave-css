# WC-Link Web Component

A dynamic CSS stylesheet loader. It appends a `<link rel="stylesheet">` tag to the document head from the `url` attribute if one isn't already present, dispatches a load/error event, then removes itself from the DOM.

> Related: ./wc-script.md for the JavaScript equivalent.

## Features

- Injects an external stylesheet into `<head>` on connect
- De-duplicates by a generated id (won't append the same link twice)
- Records loaded links in `window.wc.linksLoaded`
- Dispatches load/error events on `document.body`
- Removes itself from the DOM after appending

## Basic Usage

```html
<wc-link url="https://example.com/styles.css"></wc-link>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `url` | — | Required. `href` of the stylesheet to load. If omitted, a console warning is logged and nothing loads. |

## Events

Both events bubble, are composed, and are dispatched on `document.body`.

| Event | Legacy alias | Detail | Fires when |
|-------|--------------|--------|-----------|
| `wclinkloaded` | `link-loaded` | `{ url }` | Stylesheet finished loading (or already present) |
| `wclinkerror` | `link-error` | `{ url }` | Stylesheet failed to load |

## Examples

```html
<wc-link url="/static/css/print.css"></wc-link>

<script>
  document.body.addEventListener('wclinkloaded', e => {
    console.log('stylesheet loaded', e.detail.url);
  });
</script>
```

## Notes

- Duplicate detection uses `wc-link-<id|data-id|randomUUID>`; already-present links still fire `wclinkloaded`.
- The element removes itself after running, so it leaves no markup behind.
