# WC-Chart-Builder Web Component

An interactive chart renderer that builds charts from arbitrary JSON data with auto-detection and an optional field-picker UI. Wraps Chart.js directly.

> Related: ./wc-chart.md, ./wc-chartjs.md, ./wc-pivot.md.

## Features

- Renders from arbitrary JSON records (array of objects)
- `auto-detect` chooses chart type, label field, and value field(s) automatically
- Optional controls bar (Type / Label / Values pickers) for user-driven configuration
- Chart types: `bar`, `line`, `pie`, `doughnut`, `area`, and a KPI `number` display
- Custom color palette
- Lazy-loads Chart.js (+ datalabels plugin) from CDN
- Emits ready and click events

## Basic Usage

```html
<wc-chart-builder
  data='[{"_id":"OR","count":42},{"_id":"WA","count":38}]'
  auto-detect>
</wc-chart-builder>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `data` | — | JSON array of record objects to chart |
| `auto-detect` | — | Boolean; analyze data to pick chart type, label field, and value fields |
| `chart-type` | `bar` | Chart type: `bar`, `line`, `pie`, `doughnut`, `area`, `number` |
| `label-field` | — | Field used for category labels |
| `value-fields` | — | Comma-separated field name(s) used for values/series |
| `title` | — | Chart title |
| `show-controls` | — | Show the configuration bar (Type / Label / Values dropdowns) |
| `height` | — | Chart height; when set, `maintainAspectRatio` is `false` (fills container) |
| `colors` | — | JSON array of hex colors for the palette |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `wcchartready` / `chart:ready` | `{ chart }` or `{ value, label }` (number type) | Fired after the chart/KPI renders (bubbles, composed) |
| `wcchartclick` / `chart:click` | `{ label, value, field, document }` | Fired when a data point is clicked (bubbles, composed) |

## Examples

```html
<!-- Explicit multi-series configuration -->
<wc-chart-builder
  data='[...]'
  chart-type="line"
  label-field="month"
  value-fields="revenue,cost"
  show-controls="false"
  title="Revenue vs Cost">
</wc-chart-builder>

<!-- KPI number display -->
<wc-chart-builder
  data='[{"total_users": 12847}]'
  chart-type="number"
  value-fields="total_users"
  title="Total Users">
</wc-chart-builder>
```

## Notes

- With no `height`, the chart uses Chart.js's default aspect ratio; setting `height` fills the container (`maintainAspectRatio: false`).
- The `chart:click` detail includes the source `document` (the original data row) for drill-through.
- Chart.js `4.4.1` and the datalabels plugin `2.2.0` are lazy-loaded from CDN (self-hostable via `window.WaveAssetBase`).
- This is an async component — it sets `_deferReady`; await `.ready` before reading/setting data programmatically.
- Host element uses `display: contents`.
