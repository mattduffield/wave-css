# WC-Tabulator-Func Web Component

A **configuration-only child element** of `wc-tabulator`. It declares a helper/function (e.g. a formatter, sorter, or transform) that the parent `wc-tabulator` resolves by name. The element renders nothing on its own (it adds the `contents` class) and is managed by `wc-tabulator`.

> Related: parent [wc-tabulator](./wc-tabulator.md); sibling config children [wc-tabulator-column](./wc-tabulator-column.md), [wc-tabulator-row-menu](./wc-tabulator-row-menu.md).

## Basic Usage

```html
<wc-tabulator url="/api/orders">
  <wc-tabulator-func>
    <!-- function definition consumed by wc-tabulator -->
  </wc-tabulator-func>
  <wc-tabulator-column field="name" title="Name"></wc-tabulator-column>
</wc-tabulator>
```

## Notes

- Config-only child: it renders nothing itself (`class="contents"`) and performs no work in its own `connectedCallback` — "funcs are managed by `wc-tabulator`."
- Its contents/attributes are consumed by the parent `wc-tabulator`. See [wc-tabulator](./wc-tabulator.md) for the funcs mechanism (e.g. `ajax-response-transform="fnName"` resolves a function declared this way).
