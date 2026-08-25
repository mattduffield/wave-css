# WC-Script Web Component

A dynamic JavaScript loader. It appends a `<script>` tag to the document head from the `src` attribute if one isn't already present, dispatches a load/error event, then removes itself from the DOM.

> Related: ./wc-link.md for the stylesheet equivalent.

## Features

- Injects an external script into `<head>` on connect
- De-duplicates by a generated id (won't append the same script twice)
- Records loaded scripts in `window.wc.scriptsLoaded`
- Dispatches load/error events on `document.body`
- Removes itself from the DOM after appending

## Basic Usage

```html
<wc-script src="https://example.com/script.js"></wc-script>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `src` | — | Required. URL of the script to load. If omitted, a console warning is logged and nothing loads. |

## Events

Both events bubble, are composed, and are dispatched on `document.body`.

| Event | Legacy alias | Detail | Fires when |
|-------|--------------|--------|-----------|
| `wcscriptloaded` | `script-loaded` | `{ src }` | Script finished loading (or already present) |
| `wcscripterror` | `script-error` | `{ src }` | Script failed to load |

## Examples

```html
<wc-script src="/static/js/analytics.js"></wc-script>

<script>
  document.body.addEventListener('wcscriptloaded', e => {
    console.log('loaded', e.detail.src);
  });
</script>
```

## Notes

- Duplicate detection uses `wc-script-<id|data-id|randomUUID>`; already-present scripts still fire `wcscriptloaded`.
- The element removes itself after running, so it leaves no markup behind.
