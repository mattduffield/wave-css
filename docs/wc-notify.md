# WC-Notify Web Component

A toast notification system with stacking, auto-dismiss, and persistent (manually-dismissible) options. Place one `<wc-notify>` on the page; it registers itself as `wc.Notify` for programmatic use.

## Features

- Four notification types: success, error, info, warning (each with a duotone icon)
- Configurable auto-dismiss delay
- Persistent notifications with a close button
- Automatic stacking with position-aware spacing
- Four screen positions
- Slide-in / slide-out animations

## Basic Usage

Add the element once, then call the API:

```html
<wc-notify></wc-notify>

<script>
  wc.Notify.showSuccess('Saved!', 3000);
  wc.Notify.showError('Failed!', 5000, true); // persistent
</script>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `delay` | `3000` | Default auto-dismiss delay in milliseconds |
| `position` | `top-right` | One of `top-right`, `top-left`, `bottom-right`, `bottom-left` |

## Events

| Event | Description |
|-------|-------------|
| `wcnotifyready` | Broadcast via EventHub when the component has registered itself as `wc.Notify` |

## Methods

| Method | Description |
|--------|-------------|
| `showSuccess(message, delay, persist)` | Show a success toast |
| `showError(message, delay, persist)` | Show an error toast |
| `showInfo(message, delay, persist)` | Show an info toast |
| `showWarning(message, delay, persist)` | Show a warning toast |
| `showNotification(message, type, delay, persist)` | Show a toast of an explicit type (`success`/`error`/`info`/`warning`) |

For every method: `delay` is optional (falls back to the component's `delay`), and `persist` (default `false`) keeps the toast until the user clicks its close button instead of auto-dismissing.

## Examples

```html
<wc-notify position="bottom-left" delay="4000"></wc-notify>

<script>
  wc.Notify.showInfo('Sync started');
  wc.Notify.showWarning('Low disk space', 6000);
  wc.Notify.showError('Upload failed', undefined, true); // stays until dismissed
</script>
```

## Notes

- `display: contents`.
- Only one `wc-notify` should exist per page; a second instance detects the duplicate, warns, and removes itself.
- On connect it assigns itself to `window.wc.Notify` and broadcasts `wcnotifyready`.
- Toasts are appended to `document.body` (position `fixed`) so they float above page content, and remaining toasts reflow their positions as others dismiss.
