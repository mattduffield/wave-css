# WC-Tree-Item Web Component

A node in a [wc-tree](./wc-tree.md) hierarchy. Supports nesting, expand/collapse, icons, badges, hover-reveal action buttons, lazy-loading via `lazy-url`, HTMX attributes, and keyboard navigation.

> Related: [wc-tree](./wc-tree.md) (the container).

## Features

- Nesting via child `wc-tree-item` elements
- Expand/collapse with an animated chevron arrow
- Icon (via `wc-fa-icon`) and count badge
- Hover-reveal action buttons declared with `data-tree-action`
- Lazy child loading from a URL (`lazy-url`) with a spinner
- Left indicator bar spanning the item and its children (`indicator-color`)
- HTMX attributes for server-driven navigation

## Basic Usage

```html
<wc-tree-item label="prospect" icon="folder" badge="49197" expanded>
  <wc-tree-item label="child" icon="file"></wc-tree-item>
</wc-tree-item>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `label` | `""` | Text shown for the node |
| `icon` | `""` | Font Awesome icon name (rendered via `wc-fa-icon`) |
| `icon-style` | `solid` | Icon style passed to `wc-fa-icon` |
| `badge` | `""` | Count/label pill shown at the end of the row |
| `expanded` | (absent) | Whether the node starts expanded |
| `selected` | (absent) | Whether the node starts selected (selection is exclusive within a tree) |
| `leaf` | (absent) | Forces the node to be non-expandable (no arrow) |
| `lazy-url` | `""` | URL fetched on first expand; response HTML is appended as children |
| `indicator-color` | — | Renders a colored left bar on the item and its children |
| `hx-get` / `hx-post` | — | HTMX request attributes |
| `hx-target` / `hx-swap` | — | HTMX target/swap attributes |
| `hx-push-url` / `hx-indicator` | — | HTMX URL push / indicator attributes |
| `hx-trigger` / `hx-disinherit` | — | HTMX trigger / disinherit attributes |

## Events

All events are emitted with both the lowercase canonical name and the legacy colon-separated alias.

| Event | Detail | Bubbles | Notes |
|-------|--------|---------|-------|
| `wctreeitemclick` / `tree:item-click` | `{ label, icon, badge, level, element }` | yes | Fired on row click |
| `wctreeitemdblclick` / `tree:item-dblclick` | `{ label, icon, badge, level, element }` | yes | Fired on double-click |
| `wctreeitemcontextmenu` / `tree:item-context-menu` | `{ label, icon, badge, level, element, x, y }` | yes | Right-click; default prevented |
| `wctreeitemexpand` / `tree:item-expand` | `{ label, item }` | no | Fired on expand |
| `wctreeitemcollapse` / `tree:item-collapse` | `{ label, item }` | no | Fired on collapse |

## Methods

| Method | Description |
|--------|-------------|
| `toggle()` | Expand if collapsed, collapse if expanded |
| `expand()` | Expand the node (triggers lazy load if `lazy-url` is set) |
| `collapse()` | Collapse the node |
| `select()` | Select this node, deselecting any sibling selection in the tree |

| Property | Description |
|----------|-------------|
| `level` | Read-only depth (0-based) of this item in the tree |
| `isExpanded` | Read-only boolean reflecting the `expanded` attribute |

## Examples

### Node with hover action buttons

```html
<wc-tree-item label="Document" icon="file">
  <button data-tree-action onclick="editDoc()">Edit</button>
  <button data-tree-action onclick="deleteDoc()">Delete</button>
</wc-tree-item>
```

### Lazy-loaded branch

```html
<wc-tree-item label="Vacation" icon="folder" lazy-url="/api/photos/vacation">
</wc-tree-item>
```

## Notes

- Host element is `display: contents`; styling is provided by the parent [wc-tree](./wc-tree.md).
- Click behavior: only clicking the arrow toggles expand/collapse — clicking elsewhere on the row selects the item.
- Selection is exclusive: selecting a node clears the `selected` state of all other items in the same tree.
- Labels starting with `_` render as italic/dimmed "system" items.
- HTMX-safe: `htmx.process()` runs after render and after lazy-loaded content is inserted.
