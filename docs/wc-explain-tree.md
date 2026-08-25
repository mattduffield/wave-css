# WC-Explain-Tree Web Component

A visual MongoDB explain-plan viewer that renders explain output as a stage-by-stage flow diagram with color-coded stages, branching, aggregation-pipeline support, and click-to-expand detail.

> Related: [wc-document-tree](./wc-document-tree.md).

## Features

- Renders MongoDB explain-plan output as a bottom-to-top stage flow diagram with connectors
- Color-coded stage nodes (e.g. COLLSCAN = red, IXSCAN = green, FETCH = blue, SORT = yellow; branching stages like `$or`/`AND_HASH` highlighted)
- Summary bar highlighting scans, documents/keys examined, and index used
- Branching layout for `$or` queries and aggregation-pipeline stages
- Click a stage to expand its raw JSON detail inline
- Accepts a plain explain object or the Go Kart `{ raw, summary }` wrapper

## Basic Usage

```html
<wc-explain-tree
  data='{"queryPlanner":{"winningPlan":{"stage":"FETCH","inputStage":{"stage":"IXSCAN","indexName":"status_1"}}}}'
  height="100%">
</wc-explain-tree>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `data` | — | JSON string of the explain-plan output |
| `height` | — | CSS height applied to the inner container |

## Properties

| Property | Description |
|----------|-------------|
| `data` | Get/set the explain data as an object or JSON string; setting rebuilds the diagram. Unwraps the Go Kart `{ raw, summary }` wrapper when present. |

## Examples

### Set data via property

```html
<wc-explain-tree id="et" height="500px"></wc-explain-tree>
<script>
  document.getElementById('et').data = {
    queryPlanner: { winningPlan: { stage: 'COLLSCAN' } },
    executionStats: { totalDocsExamined: 10000, nReturned: 3 }
  };
</script>
```

## Notes

- Host element is `display: contents`.
- Does not emit any custom events.
- The `data` property setter accepts an object or a JSON string and unwraps the `{ raw, summary }` shape emitted by Go Kart.
