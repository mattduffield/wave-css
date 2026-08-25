# WC-Tree Web Component

A hierarchical tree component for navigation. Supports nested items, expand/collapse, lazy loading, search filtering, structured attribute filtering, keyboard navigation, hash-based URL tracking, and HTMX integration.

> Related: [wc-tree-item](./wc-tree-item.md) (the nodes), [wc-tree-filter](./wc-tree-filter.md) (declares filterable attributes for the gear popover).

## Features

- Nested `wc-tree-item` children with expand/collapse
- Optional search input that filters items by label and auto-expands matching branches
- Optional gear popover with structured filters declared via `wc-tree-filter` children
- Full keyboard navigation (arrow keys, Enter, Space)
- Hash-based URL tracking (`hash-nav`) that restores and selects the matching item on load
- HTMX integration for server-driven interactions

## Basic Usage

```html
<wc-tree id="my-tree" searchable>
  <wc-tree-item label="Development" icon="server" expanded>
    <wc-tree-item label="wec-dev" icon="database">
      <wc-tree-item label="prospect" icon="folder" badge="49197"
                    hx-get="/x/data-explorer/prospect"
                    hx-target="#content" hx-swap="innerHTML">
      </wc-tree-item>
    </wc-tree-item>
  </wc-tree-item>
</wc-tree>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier for the tree |
| `class` | — | CSS classes applied to the component |
| `searchable` | (absent) | Renders a search/filter input that filters items by label |
| `filterable` | (absent) | Renders a gear icon with a filter popover; reads `wc-tree-filter` children to build the filter UI |
| `hash-nav` | (absent) | Enables URL hash tracking. On click, updates `location.hash` from the item's `data-hash` (or `label`); on load, auto-selects and clicks the matching item |

## Events

Events bubble up from `wc-tree-item` children. See [wc-tree-item](./wc-tree-item.md) for details.

| Event | Detail | Notes |
|-------|--------|-------|
| `wctreeitemclick` / `tree:item-click` | `{ label, icon, badge, level, element }` | Fired on item click |
| `wctreeitemdblclick` / `tree:item-dblclick` | `{ label, icon, badge, level, element }` | Fired on double-click |
| `wctreeitemcontextmenu` / `tree:item-context-menu` | `{ label, icon, badge, level, element, x, y }` | Fired on right-click (default prevented) |
| `wctreeitemexpand` / `tree:item-expand` | `{ label, item }` | Does not bubble |
| `wctreeitemcollapse` / `tree:item-collapse` | `{ label, item }` | Does not bubble |

Both the lowercase canonical name and the legacy colon-separated alias are dispatched.

## Methods

| Method | Description |
|--------|-------------|
| `getInnerContainer()` | Returns the inner `.tree-content` container (or the element itself) |

## Examples

### Searchable tree

```html
<wc-tree searchable>
  <wc-tree-item label="Documents" icon="folder" expanded>
    <wc-tree-item label="Resume.pdf" icon="file"></wc-tree-item>
    <wc-tree-item label="Cover Letter.docx" icon="file"></wc-tree-item>
  </wc-tree-item>
</wc-tree>
```

### Filterable tree with structured filters

```html
<wc-tree filterable searchable>
  <wc-tree-filter field="data-kind" label="Type"
                  values="app,template,schema,lookup" checked></wc-tree-filter>

  <wc-tree-item label="Prospect" icon="folder" data-kind="template"></wc-tree-item>
  <wc-tree-item label="Users" icon="folder" data-kind="schema"></wc-tree-item>
</wc-tree>
```

### Hash-nav tree

```html
<wc-tree hash-nav>
  <wc-tree-item label="Welcome" data-hash="welcome"
                hx-get="/x/doc/welcome" hx-target="#content">
  </wc-tree-item>
</wc-tree>
```

## Notes

- Host element is `display: contents` — the tree renders through an inner `.wc-tree` element.
- HTMX-safe: `htmx.process()` is called on the tree after render (guarded to run once).
- Search filtering matches item labels case-insensitively and expands parent branches so matches stay visible.
- Attribute filters keep a parent visible when any descendant is visible; an item with no value for a filter's `field` is not subject to that filter.
