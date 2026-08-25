# WC-Record-Lookup Web Component

A typeahead that searches an EXISTING collection via a server endpoint and, on select, either emits the chosen record or fills sibling form fields. Powers "match-at-entry" hints, "use this family", and generic attach-existing flows.

> The server is the source of truth — the component only displays what the endpoint returns (which should be tenant-scoped and display-safe) and never blocks typing.

> Related: ./wc-address.md, ./wc-form-array.md, ./wc-checkin.md.

## Features

- Debounced server-side typeahead (GET endpoint returning a JSON array)
- Three modes: `select` (emit the record), `fill` (populate sibling fields via `fill-map`), `hint` (non-blocking use-existing banner)
- Extra query params via `param-*` attributes
- Dotted-path resolution for display label and value
- Keyboard navigation (Arrow / Enter / Escape / click)
- Never blocks typing; server-authoritative

## Basic Usage

```html
<!-- match-at-entry hint on a child name -->
<wc-record-lookup mode="hint" endpoint="/x/lookup/attendee"
                  param-master_event="{{Event.master_id}}"
                  lbl-label="Child name"></wc-record-lookup>

<!-- "use this family": fill parent fields + emit for a children load -->
<wc-record-lookup mode="fill" endpoint="/x/lookup/household"
    fill-map='{"parents.0.first_name":"primary.first_name","parents.0.address_street":"address.street"}'>
</wc-record-lookup>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `endpoint` | — | GET URL returning a JSON array of result objects; the component appends `?q=<query>` plus any `param-*` attributes |
| `min-chars` | `2` | Minimum characters before searching |
| `debounce` | `300` | Milliseconds to debounce input |
| `label-field` | `label` | Result property to display (supports dotted paths) |
| `value-field` | `id` | Result property used as the selected id (supports dotted paths) |
| `mode` | `select` | `select` (emit the record), `fill` (populate fields via `fill-map`), or `hint` (suggestion banner) |
| `fill-map` | — | JSON `{ "target_field_name": "result.path" }` — used when `mode="fill"`; fills sibling fields by `name` |
| `keep-text` | (absent) | Boolean (`mode="select"`) — keep the typed text after select instead of clearing |
| `param-*` | — | Extra query params sent to the endpoint (e.g. `param-master_event="…"`) |
| `placeholder` | — | Input placeholder |
| `lbl-label` | — | Field label |
| `disabled` | (absent) | Disable the input |
| `name` | — | Standard passthrough |

## Modes

- **`select`** — emit `record:selected` with the full record; clear the input unless `keep-text`.
- **`fill`** — for each `fill-map` entry, resolve the dotted path and set the sibling field found by `name` (scoped to the closest `<form>`, else `document`) via property + `value` attr + inner control, dispatching `input` + `change`; then **also** emits `record:selected`.
- **`hint`** — non-blocking inline banner ("Looks like {label} — use existing?") with a primary action button that emits `record:selected` plus a × dismiss (no dropdown).

## Events

All events are `CustomEvent`s (bubbles + composed) fired on the element AND on `document`. Each fires a lowercase canonical name and a legacy colon alias.

| Event (canonical / legacy) | Detail | Fires when |
|----------------------------|--------|------------|
| `wcrecordselected` / `record:selected` | `{ record }` | A suggestion is selected (or the hint action is used) |
| `wcrecordsearch` / `record:search` | `{ q }` | A search is issued (optional, for logging) |

## Integration Hook

Set `el.searchHandler = async (q, params) => results[]` to route the search through your own client instead of `fetch` (used by the demo + tests). Still server-authoritative — the handler's array is displayed as-is.

```js
document.querySelector('wc-record-lookup').searchHandler = async (q, params) => {
  return await myApi.search(q, params);
};
```

## Examples

Select mode that emits the record (e.g. attach an existing person):

```html
<wc-record-lookup id="lk" mode="select" endpoint="/x/lookup/attendee"
                  lbl-label="Find attendee"></wc-record-lookup>
<script>
  document.getElementById('lk')
    .addEventListener('wcrecordselected', (e) => console.log(e.detail.record));
</script>
```

## Notes

- `display: contents`; styles are in `@layer wc.usage`; htmx-safe.
- Extends `WcBaseComponent` (NOT form-associated — it emits/fills, it does not submit its own value).
- The dropdown reuses the `wc-address` look + keyboard nav; empty results clear the dropdown/hint.
- Verified in `tests/record-lookup-test.py`; demoed in `views/record-lookup.html`.
