# WC-Tabulator-Column Web Component

A **configuration-only child element** of `wc-tabulator`. It defines a table column. The element renders nothing on its own (it adds the `contents` class) and is read/managed by the parent `wc-tabulator` during setup.

> Related: parent [wc-tabulator](./wc-tabulator.md); sibling config children [wc-tabulator-func](./wc-tabulator-func.md), [wc-tabulator-row-menu](./wc-tabulator-row-menu.md).

## Basic Usage

```html
<wc-tabulator url="/api/orders">
  <wc-tabulator-column field="name" title="Name"></wc-tabulator-column>
  <wc-tabulator-column field="amount" title="Amount"></wc-tabulator-column>
</wc-tabulator>
```

## Notes

- Config-only child: it renders nothing itself (`class="contents"`) and performs no work in its own `connectedCallback` — "columns are managed by `wc-tabulator`."
- Declares no `observedAttributes` of its own in this element; the parent `wc-tabulator` reads the element's attributes to build its column definitions. See [wc-tabulator](./wc-tabulator.md) for column configuration details.
