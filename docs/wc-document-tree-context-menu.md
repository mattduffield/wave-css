# WC-Document-Tree-Context-Menu Web Component

Configuration-only child element for [wc-document-tree](./wc-document-tree.md). It renders nothing itself — it declares one right-click context-menu item (or a separator) that the parent reads to build its context menu.

> Related: [wc-document-tree](./wc-document-tree.md) (the parent).

## Features

- Declares a single context-menu item with a label, icon, and action function
- Or renders a divider line via the `separator` attribute
- The action function body is provided as the element's text content

## Basic Usage

```html
<wc-document-tree data='[{"_id":"abc","name":"Matt"}]'>
  <wc-document-tree-context-menu label="Edit Document" icon="pen-to-square">
    (e, node) => { window.dsOpenEditDocument(node.documentId); }
  </wc-document-tree-context-menu>
  <wc-document-tree-context-menu separator></wc-document-tree-context-menu>
</wc-document-tree>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `label` | `""` | Menu item display text |
| `icon` | `""` | Icon name for `wc-fa-icon` |
| `separator` | (absent) | Boolean — renders a divider line instead of an item |
| `order` | — | Numeric position of the item in the menu |

## Notes

- Configuration-only: extends `HTMLElement` (not the Wave base component), adds the `contents` class, and does no work of its own — the parent [wc-document-tree](./wc-document-tree.md) parses it.
- The element's text content must be an arrow/function expression; it is evaluated once and receives `(event, node)` where `node = { key, value, path, documentId, type }`.
