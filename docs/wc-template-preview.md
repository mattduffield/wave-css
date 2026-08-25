# WC-Template-Preview Web Component

An in-page preview harness that renders a screen template inside an `<iframe>` with toggles to show/hide the preview and to enable/disable drag-and-drop editing in the previewed frame. Used by the template/screen editing workflow.

> Related: ./wc-live-designer.md for the full visual page builder.

## Features

- Renders the target screen in an iframe (`/v/<slug>/<record-id>` or `/v/<slug>/create`)
- "Preview" radio toggle shows/hides the iframe and loads its `src` on demand
- "Drag n Drop" radio toggle enables/disables the previewed frame's editing mode (adds/removes `preview-frame` class on the iframe body)
- Broadcasts drag enable/disable via the Wave `EventHub`
- `display: contents` host

## Basic Usage

```html
<wc-template-preview
  url="/screen/contact/123"
  new-url="/screen/contact/create"
  return-url="/screen/contact_list/list">
</wc-template-preview>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `slug` | `""` | Screen/template slug used to build the iframe `src`. |
| `record-id` | `""` | Record id for the previewed screen; `create` or empty loads the create view (`/v/<slug>/create`). |
| `cls` | `""` | Extra CSS classes applied to the inner `.wc-template-preview` container. |

## Events

Broadcast through `wc.EventHub` (no selector/data payload) when the drag toggle changes:

| Event | Fires when |
|-------|-----------|
| `wctemplatepreviewenabledrag` | Drag-and-drop toggle set to "Enable" |
| `wctemplatepreviewdisabledrag` | Drag-and-drop toggle set to "Disable" |

## Notes

- The preview iframe height is `calc(-360px + 100vh)`; it stays hidden (empty `src`) until the Preview toggle is set to "Show".
- The Drag n Drop toggle is itself hidden until the preview is shown.
- The `url` / `new-url` / `return-url` attributes appear in the usage example; the iframe `src` is derived from `slug` + `record-id`.
