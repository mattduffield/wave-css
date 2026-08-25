# WC-Document-Tree Web Component

A MongoDB document viewer that renders documents as an expandable/collapsible key-value tree with type badges, click-to-copy values, and an optional declarative right-click context menu.

> Related: [wc-document-tree-context-menu](./wc-document-tree-context-menu.md) (declares context-menu items), [wc-explain-tree](./wc-explain-tree.md).

## Features

- Renders one or many documents (`data` is a single object or an array) as nested trees
- Type detection with color-coded values and a type badge per node (String, Number, Bool, Null, ObjectId, Date, Object, Array)
- Recognizes MongoDB Extended JSON (`$oid`, `$date`) and formats ObjectId/date values
- Expand/collapse per node; initial depth controlled by `expand-level`
- Click a leaf value to copy it to the clipboard (with a brief toast)
- Right-click copies the field path by default, or opens a custom context menu when `wc-document-tree-context-menu` children are present

## Basic Usage

```html
<wc-document-tree
  data='[{"_id":"abc123","name":"Matt","address":{"city":"Portland"}}]'
  height="100%"
  expand-level="2">
</wc-document-tree>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `data` | — | JSON string of a document object or an array of documents |
| `height` | — | CSS height applied to the inner tree container |
| `expand-level` | `1` | Depth to which nodes start expanded |

## Events

Both the lowercase canonical name and the legacy colon alias are dispatched; both bubble.

| Event | Detail | Notes |
|-------|--------|-------|
| `wcdocumenttreecopy` / `document-tree:copy` | `{ path, value, type }` | Fired when a leaf value is clicked and copied |
| `wcdocumenttreeselect` / `document-tree:select` | `{ path, value, type }` | Fired when a leaf node is clicked |

## Properties

| Property | Description |
|----------|-------------|
| `data` | Get/set the document data as an object or JSON string; setting rebuilds the tree |

## Examples

### With a declarative context menu

```html
<wc-document-tree data='[{"_id":"abc","name":"Matt"}]' height="100%" expand-level="2">
  <wc-document-tree-context-menu label="Edit Document" icon="pen-to-square">
    (e, node) => { window.dsOpenEditDocument(node.documentId); }
  </wc-document-tree-context-menu>
  <wc-document-tree-context-menu separator></wc-document-tree-context-menu>
</wc-document-tree>
```

### Set data via property

```html
<wc-document-tree id="dt" height="400px"></wc-document-tree>
<script>
  document.getElementById('dt').data = [{ _id: 'abc', name: 'Matt' }];
</script>
```

## Notes

- Host element is `display: contents`; the inner `.wc-document-tree` renders the tree in a monospace font.
- Context-menu children are parsed once — the action function text is consumed on first parse. The action receives `(event, node)` where `node = { key, value, path, documentId, type }`.
- Without any context-menu children, right-click copies the node's field path.
- The custom context menu is shown via `wc-context-menu` (only appears if that component is registered).
