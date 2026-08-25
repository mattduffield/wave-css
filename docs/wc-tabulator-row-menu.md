# WC-Tabulator-Row-Menu Web Component

A **configuration-only child element** of `wc-tabulator`. It declares a row context menu that the parent `wc-tabulator` wires up. The element renders nothing on its own (it adds the `contents` class) and is managed by `wc-tabulator`.

> Related: parent [wc-tabulator](./wc-tabulator.md); sibling config children [wc-tabulator-column](./wc-tabulator-column.md), [wc-tabulator-func](./wc-tabulator-func.md).

## Basic Usage

```html
<wc-tabulator url="/api/orders">
  <wc-tabulator-row-menu>
    <!-- row menu definition consumed by wc-tabulator -->
  </wc-tabulator-row-menu>
  <wc-tabulator-column field="name" title="Name"></wc-tabulator-column>
</wc-tabulator>
```

## Notes

- Config-only child: it renders nothing itself (`class="contents"`) and performs no work in its own `connectedCallback` — it is managed by the parent `wc-tabulator`.
- Its contents/attributes are consumed by the parent `wc-tabulator` to build the per-row context menu. See [wc-tabulator](./wc-tabulator.md) for details.
