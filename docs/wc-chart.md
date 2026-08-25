# WC-Chart Web Component

A declarative Chart.js wrapper that renders bar, line, and other chart types from JSON attributes. Chart.js is lazy-loaded on demand.

> Related: ./wc-chartjs.md (adds URL/AJAX data loading), ./wc-chart-builder.md (interactive builder UI).

## Features

- Renders charts from `labels` + `data`/`datasets` JSON attributes
- Configurable legend, titles, axis titles, colors, and data labels
- Line styling controls (tension, fill, point radius, border width)
- Stacked and responsive/aspect-ratio options
- Theme-aware text and grid colors
- Lazy-loads Chart.js (+ datalabels plugin) from CDN on first render
- Public methods to refresh, update data/options, export, and access the raw chart

## Basic Usage

```html
<wc-chart
  type="bar"
  labels='["Q1", "Q2", "Q3", "Q4"]'
  data='[65, 59, 80, 81]'
  label="Sales"
  title="Quarterly Sales">
</wc-chart>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `type` | `bar` | Chart type (`bar`, `line`, `pie`, `doughnut`, etc.) |
| `labels` | — | JSON array of category labels |
| `data` | — | JSON array of values (single-dataset shorthand) |
| `label` | — | Dataset label used with the `data` shorthand |
| `datasets` | — | JSON array of Chart.js dataset objects (multi-series) |
| `title` | — | Chart title text |
| `height` | `400` | Canvas height |
| `width` | `auto` | Canvas width |
| `colors` | — | JSON array of colors (supports CSS variables) |
| `show-legend` | `true` | Show the legend (`false` to hide) |
| `legend-position` | `top` | `top`, `bottom`, `left`, or `right` |
| `show-data-labels` | `false` | Show value labels on data points (`true` to enable) |
| `padding-top` | — | Extra top padding for the chart layout |
| `responsive` | `true` | Chart.js responsive mode (`false` to disable) |
| `maintain-aspect-ratio` | `true` | Maintain aspect ratio (`false` to disable) |
| `x-axis-title` | — | X-axis title |
| `y-axis-title` | — | Y-axis title |
| `stacked` | `false` | Stack datasets (`true` to enable) |
| `tension` | `0.1` | Line tension (line charts) |
| `fill` | `true` | Fill area under lines (`false` to disable) |
| `point-radius` | `3` | Point radius (line charts) |
| `border-width` | `2` | Dataset border width |
| `text-color` | theme | Chart text color |
| `grid-color` | theme | Grid line color |
| `class` | — | CSS classes applied to the component |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `wcchartcreated` / `chart-created` | `{ chart }` | Fired after the chart instance is created (bubbles) |
| `wcchartclick` / `chart-click` | `{ label, value, datasetIndex, index }` | Fired when a data point is clicked (bubbles) |

## Methods

| Method | Description |
|--------|-------------|
| `refresh()` | Re-create the chart from current attributes |
| `updateData(newData)` | Update the chart's data |
| `updateOptions(newOptions)` | Update the chart's options |
| `toImage()` | Return the chart as an image data URL |
| `getChart()` | Return the underlying Chart.js instance |

## Examples

```html
<!-- Multi-series line chart -->
<wc-chart
  type="line"
  labels='["Jan", "Feb", "Mar", "Apr"]'
  datasets='[{"label": "2023", "data": [10,20,30,40]}, {"label": "2024", "data": [15,25,35,45]}]'
  title="Monthly Revenue"
  legend-position="right">
</wc-chart>
```

## Notes

- Chart.js `4.4.1` and the datalabels plugin `2.2.0` are lazy-loaded from CDN on first render; with `window.WaveAssetBase` set they resolve from your self-hosted copy first (CDN fallback).
- Setting an observed attribute after render re-creates the chart.
- Host element uses `display: contents`.
