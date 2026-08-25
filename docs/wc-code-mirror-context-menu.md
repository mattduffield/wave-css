# WC-Code-Mirror-Context-Menu Web Component

A configuration-only child element for [`wc-code-mirror`](./wc-code-mirror.md). Each one declares a single entry (or divider) in the editor's right-click context menu. It renders nothing itself (`display: contents`) — the parent reads these children to build the menu.

> Related: ./wc-code-mirror.md (parent), ./wc-context-menu.md.

## Basic Usage

```html
<wc-code-mirror mode="javascript">
  <wc-code-mirror-context-menu label="Edit Document" icon="pen-to-square">
    (e, info) => { window.dsOpenEditDocument(info); }
  </wc-code-mirror-context-menu>
  <wc-code-mirror-context-menu separator></wc-code-mirror-context-menu>
  <wc-code-mirror-context-menu label="Format" icon="wand-magic-sparkles" order="2">
    (e, info) => { window.formatCode(info); }
  </wc-code-mirror-context-menu>
</wc-code-mirror>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `label` | — | Menu item display text |
| `icon` | — | `wc-fa-icon` icon name |
| `separator` | (absent) | Boolean — renders a divider line instead of an item |
| `order` | — | Numeric position of the item within the menu |

## Notes

- Config/child element: no observed attributes, events, or public methods of its own.
- The item's action is supplied as the element's text content — a function `(event, info) => {...}` where `info` contains `{ cursor, selection, lineText, editor }`.
