# WC-Tree-Filter Web Component

Configuration-only child element for [wc-tree](./wc-tree.md). It renders nothing itself — it declares a filterable attribute and its possible values, which the parent tree reads to build the gear-icon filter popover.

> Related: [wc-tree](./wc-tree.md) (the parent; requires the `filterable` attribute), [wc-tree-item](./wc-tree-item.md).

## Features

- Declares one filterable attribute (a `data-*` or built-in attribute of tree items) and its selectable values
- Each value becomes a checkbox in the parent tree's filter popover
- `checked` sets whether all values start visible or hidden

## Basic Usage

```html
<wc-tree filterable>
  <wc-tree-filter field="data-kind" label="Type"
                  values="app,template,schema,lookup" checked></wc-tree-filter>
  <wc-tree-filter field="badge" label="Badge" values="system,user"></wc-tree-filter>

  <wc-tree-item label="Prospect" icon="folder" data-kind="template"></wc-tree-item>
</wc-tree>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `field` | `""` | Attribute name to filter on (e.g. `data-kind`, `badge`). Required. |
| `label` | value of `field` | Display label for the group in the filter popover |
| `values` | `""` | Comma-separated list of filterable values. Required. |
| `checked` | (absent) | If present, all values start checked (visible); if absent, all start unchecked (hidden) |

## Notes

- Configuration-only: extends `HTMLElement` (not the Wave base component), adds the `contents` class, and does no work of its own — the parent [wc-tree](./wc-tree.md) parses it.
- Requires the parent `wc-tree` to have the `filterable` attribute for the gear popover to appear.
- A tree item with no value for a filter's `field` is not subject to that filter; a parent stays visible when any descendant remains visible.
