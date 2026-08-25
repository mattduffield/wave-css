# WC-Table-Col Web Component

A **configuration-only child element** of `wc-table`. It renders nothing (`display: none`) and is consumed by `wc-table` during render to define a column's field mapping, label, alignment, sorting, width, and cell formatting.

> Related: parent [wc-table](./wc-table.md).

## Basic Usage

```html
<wc-table url="/api/orders">
  <wc-table-col field="name" label="Full Name" sortable align="left" width="200px"></wc-table-col>
  <wc-table-col field="total" label="Total" formatter="datetime"></wc-table-col>
</wc-table>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `field` | `""` | (required) the record member this column maps to |
| `label` | falls back to `field` | column header text |
| `sortable` | — | boolean; enables click-to-sort (sorts on the **raw** field value, not rendered HTML) |
| `filterable` | — | boolean; scopes searchable-table matching to this column |
| `align` | `left` | cell text alignment |
| `width` | `""` | column width (e.g. `200px`, `30%`) |
| `format` | `""` | value format hint |
| `class` | `""` | CSS class applied to the column's cells |
| `type` | `""` | `type="html"` renders the field value as **trusted** innerHTML (caller owns escaping) |
| `formatter` | `""` | named cell renderer: `badge` \| `link` \| `datetime` \| `run-status` (built-ins escape their own text) |
| `formatter-map` | `""` | JSON `{value:variant}` map (for `badge` / run-status variants; default `muted`) |
| `formatter-href` | `""` | `link` formatter token template (e.g. `/x/order/{_id}`; tokens URL-encoded) |
| `formatter-format` | `""` | `datetime` formatter luxon-preset NAME (e.g. `DATE_MED`, `DATETIME_MED`) |
| `formatter-active-field` | `""` | run-status: truthy row field = running |
| `formatter-events-url` | `""` | run-status: SSE URL template with `{token}` substitution (URL-encoded from the row) |
| `formatter-live-field` | `""` | run-status: flat key for the streamed display text (default `status`) |
| `formatter-done-when` | `""` | run-status: terminal condition — `prop` (truthy) or `prop=value` (e.g. `event=end`) |
| `formatter-event-name` | `""` | run-status: named SSE event to bind (default `message`; e.g. `step_change`) |
| `formatter-live-path` | `""` | run-status: dotted path to the display text, supporting negative indices (e.g. `stack.-1.name`) |

## Events

This element emits no events. It exposes a `config` getter that `wc-table` reads.

## Examples

### Badge and link formatters

```html
<wc-table items='[...]'>
  <wc-table-col field="_id" label="Order" formatter="link" formatter-href="/x/order/{_id}"></wc-table-col>
  <wc-table-col field="status" label="Status" formatter="badge"
    formatter-map='{"active":"success","pending":"warning","cancelled":"danger"}'></wc-table-col>
</wc-table>
```

### Live run-status cell (SSE)

```html
<wc-table items='[...]'>
  <wc-table-col field="status" label="Run"
    formatter="run-status"
    formatter-events-url="/x/run/{_id}/events"
    formatter-event-name="step_change"></wc-table-col>
</wc-table>
```

## Notes

- Config-only child: it renders nothing itself; all behavior is realized by the parent `wc-table`.
- `formatter` and `type="html"` are mutually exclusive — `formatter` wins (with a console warning).
- **Sorting always uses the raw field value**, not the rendered HTML. Columns with neither `type` nor `formatter` render as plain escaped text.
- Built-in formatters (`badge`, `link`, `datetime`) escape their own text and are XSS-safe on untrusted values; `type="html"` is trusted innerHTML (caller owns escaping).
- The `run-status` formatter renders a live SSE cell (spinner + streamed step text) for running rows and a `badge`-like cell when resting. When `formatter-event-name="step_change"`, `formatter-live-path` defaults to `stack.-1.name` and `formatter-done-when` to `event=end`. It emits a single `wcrunstatuscomplete` (legacy alias `wc-run-status:complete`) `{ runId, row }` per run at terminal; the host then refreshes the authoritative verdict.
