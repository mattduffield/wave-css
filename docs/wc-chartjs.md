# WC-Chartjs Web Component

An extension of `wc-chart` that loads its data from a URL via AJAX, with loading/error states, auto-refresh, and an expand/collapse button. Supports all `wc-chart` attributes.

> Related: ./wc-chart.md (base chart), ./wc-busy-indicator.md (loading indicator), ./wc-chart-builder.md.

## Features

- Fetches chart data from a URL endpoint (returns `{labels, datasets, title?, type?}`)
- Configurable HTTP method, query params, and headers
- Auto-refresh interval
- Loading state via text or an embedded `wc-busy-indicator`
- Error state display
- Optional expand/collapse to a target container
- Inherits every `wc-chart` attribute and behavior

## Basic Usage

```html
<wc-chartjs
  url="/api/prospect-quotes/chart-data?num_days=14"
  type="bar"
  height="400"
  show-legend="true"
  legend-position="top">
</wc-chartjs>
```

## Attributes

Inherits all [wc-chart](./wc-chart.md) attributes, plus:

| Attribute | Default | Description |
|-----------|---------|-------------|
| `url` | — | Endpoint to fetch chart data from |
| `ajax-method` | `GET` | HTTP method |
| `url-params` | — | Additional query parameters as a JSON string |
| `ajax-headers` | `{"Content-Type":"application/json"}` | Custom request headers as a JSON string |
| `auto-refresh` | — | Auto-refresh interval in milliseconds |
| `loading-text` | `Loading chart...` | Text shown while loading |
| `busy-indicator` | `false` | Use a `wc-busy-indicator` instead of `loading-text` (`true`/`false`) |
| `busy-indicator-type` | — | Busy indicator type (`chart-bar`, `chart-line`, `chart-pie`, `spinner`, etc.) |
| `busy-color-variation` | — | Busy indicator color variation (`standard`, `subtle`, `off`) |
| `busy-color-levels` | — | Comma-separated surface levels for the busy indicator (e.g. `4,6,7,8,10`) |
| `expand-selector` | `#viewport` | CSS selector for the expand target; enables an expand/collapse button |

## Events

Inherits `wc-chart` events, plus:

| Event | Detail | Description |
|-------|--------|-------------|
| `wcchartjsloading` / `chartjs:loading` | `{ url }` | Fired when the data fetch starts (bubbles) |
| `wcchartjsloaded` / `chartjs:loaded` | `{ data }` | Fired when data loads successfully (bubbles) |
| `wcchartjserror` / `chartjs:error` | `{ error }` | Fired when the data fetch fails (bubbles) |

## Methods

Inherits `wc-chart` methods, plus:

| Method | Description |
|--------|-------------|
| `reload()` | Re-fetch data from the current URL |
| `setUrl(url)` | Set a new URL and reload |
| `setParams(params)` | Update the query parameters |

## API Response Format

```json
{
  "labels": ["Q1", "Q2", "Q3"],
  "datasets": [
    { "label": "Sales", "data": [100, 200, 300], "backgroundColor": "#3498db", "borderColor": "#2980b9" }
  ],
  "title": "Quarterly Sales",
  "type": "bar"
}
```

## Examples

```html
<!-- Static inline data (behaves like wc-chart) -->
<wc-chartjs
  type="line"
  labels='["Jan", "Feb", "Mar"]'
  datasets='[{"label": "2024", "data": [10,20,30]}]'
  title="Monthly Sales">
</wc-chartjs>

<!-- Auto-refreshing with a busy indicator -->
<wc-chartjs url="/api/live-metrics" type="line" auto-refresh="5000" busy-indicator="true" busy-indicator-type="chart-line"></wc-chartjs>
```

## Notes

- Chart.js is lazy-loaded from CDN by the base component (self-hostable via `window.WaveAssetBase`).
- `title` and `type` in the response are optional and override the corresponding attributes.
- Host element uses `display: contents`.
