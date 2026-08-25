# WC-Pivot Web Component

A full-featured cross-tabulation pivot table built from arbitrary JSON data. Supports auto-detection, a four-zone field panel, value filters, drill-down detail rows, date grouping, heatmap, sorting, config save/load, compact layout, and CSV export.

## Features

- Cross-tabulate arbitrary JSON with `row-field` / `col-field` / `value-field` + aggregate
- Auto-detection of row / column / value fields (`auto-detect`)
- Four-zone field panel (Rows / Columns / Values / Filters) with click-to-assign popovers
- Value filters with checkbox list, search, and All/None/Apply
- Drill-down: click a cell to expand an inline detail table of matching source documents
- Date grouping (year / quarter / month / year-month / day / datetime)
- Heatmap, sortable column headers, subtotals/totals
- Compact layout toggle
- Config save/load (`getConfig()` / `loadConfig()`) and declarative `config` attribute
- CSV export

## Basic Usage

```html
<wc-pivot
    data='[{"state":"OR","status":"active","amount":100},
           {"state":"WA","status":"active","amount":250}]'
    auto-detect
    show-heatmap>
</wc-pivot>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `data` | `[]` | JSON array of source records |
| `auto-detect` | — | boolean; selects `row-field`, `col-field`, and `value-field` from the data |
| `row-field` | — | field placed in the Rows zone |
| `col-field` | — | field placed in the Columns zone |
| `value-field` | — | field aggregated in the Values zone |
| `aggregate` | — | `count` \| `sum` \| `avg` \| `min` \| `max` |
| `show-controls` | — | boolean; shows configuration dropdowns |
| `show-totals` | — | boolean; row/column grand totals |
| `show-subtotals` | — | boolean; subtotal rows |
| `show-heatmap` | — | boolean; color intensity per cell by value |
| `number-format` | — | `integer` \| `decimal` \| `currency` \| `percent` |
| `sort-rows` | — | `asc` \| `desc` \| `value-asc` \| `value-desc` |
| `max-columns` | — | limits the number of column values displayed |
| `height` | — | table height |
| `show-field-panel` | — | boolean; opens the four-zone field panel sidebar |
| `compact-layout` | — | boolean; reduces padding/font for dense display |
| `config` | — | JSON (object or string) for declarative pre-configuration |

## Events

Each event fires a lowercase canonical name plus a legacy colon-form alias.

| Event | Legacy alias | When |
|-------|--------------|------|
| `wcpivotready` | `pivot:ready` | pivot has rendered / is ready |
| `wcpivotcellclick` | `pivot:cell-click` | a pivot cell is clicked |
| `wcpivotconfigchange` | `pivot:config-change` | configuration changes |
| `wcpivotfilterchange` | `pivot:filter-change` | a value filter changes |
| `wcpivotzonechange` | `pivot:zone-change` | a field is added/removed/moved between zones |
| `wcpivotdrilldown` | `pivot:drill-down` | a cell is expanded/collapsed (`{ row, column, expanded, documents }`) |

## Methods

| Method | Description |
|--------|-------------|
| `getConfig()` | Returns the full pivot state as a config object (zones, filters, dateGrouping, sort, layout, formatting) |
| `loadConfig(config)` | Restores from a config object or JSON string |
| `exportCSV()` | Exports the current pivot to CSV |

## Examples

### Explicit configuration

```html
<wc-pivot
    data='[{"region":"East","product":"Widget","sales":100}]'
    row-field="region"
    col-field="product"
    value-field="sales"
    aggregate="sum"
    number-format="currency"
    show-totals>
</wc-pivot>
```

### Field panel + save/restore config

```html
<wc-pivot id="pv"
    data='{{ Data.rows|toJSON|safe }}'
    auto-detect show-field-panel show-heatmap>
</wc-pivot>

<script>
  const pv = document.getElementById('pv');
  // Save the current view
  const saved = pv.getConfig();
  // ...later, restore it
  pv.loadConfig(saved);
  // Export
  document.querySelector('#export').addEventListener('click', () => pv.exportCSV());
</script>
```

## Notes

- Extends `WcBaseComponent`; host element uses `display: contents` for proper flex layout participation.
- This is an **async component**: it sets `_deferReady` in the constructor and resolves `ready` after the initial build. Await `.ready` before reading/setting derived state.
- Sticky headers and row labels; column headers are sortable.
- When a date field is placed in Rows or Columns, grouping auto-defaults to month; a calendar icon on the chip opens the grouping popover.
- Drill-down slides open an inline detail table of matching source documents; dates there are formatted human-readably.
- The `config` attribute (and `loadConfig`) accept both an object and a JSON string.
