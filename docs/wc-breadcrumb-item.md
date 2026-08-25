# WC-Breadcrumb-Item Web Component

An individual breadcrumb entry. This is a lightweight semantic wrapper element used as a child of [`wc-breadcrumb`](./wc-breadcrumb.md); the parent reads it to build the breadcrumb trail. It renders `display: contents` and adds no visual box of its own.

> Related: ./wc-breadcrumb.md (parent).

## Basic Usage

```html
<wc-breadcrumb>
  <wc-breadcrumb-item label="Home" link="/"></wc-breadcrumb-item>
  <wc-breadcrumb-item label="Library" link="/library"></wc-breadcrumb-item>
  <wc-breadcrumb-item label="Data"></wc-breadcrumb-item>
</wc-breadcrumb>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the item |
| `label` | — | Display text for the breadcrumb entry (read by the parent) |
| `link` | — | Destination URL for the entry (read by the parent) |

## Notes

- Config/child element: it declares data for `wc-breadcrumb` and performs no rendering itself.
- `observedAttributes` on the element are `id` and `class`; `label` and `link` are consumed by the parent `wc-breadcrumb`.
