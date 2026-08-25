# WC-Kanban Web Component

A declarative status board. Lanes come from a categorical/enum field's options; cards are record objects grouped into lanes by `group-field`. The component owns rendering, native HTML5 drag/drop (between lanes and within-lane reorder), per-lane count, and an optional numeric rollup. The **host owns persistence** via bubbling events.

> Related: [wc-calendar](./wc-calendar.md), [wc-gantt](./wc-gantt.md), and [wc-data-cards](./wc-data-cards.md) share the same `{id, title/label, start, end?, color?}`-style record shape and host-owns-persistence pattern.

## Features

- Lanes generated from a JSON array of `{ value, label, color? }`
- Cards placed into lanes by matching `group-field`
- Native HTML5 drag/drop between lanes and within-lane reorder (no DnD library)
- Per-lane card count badge and optional per-lane rollup sum
- Card title + a subset of fields rendered as `.badge` chips
- Optional quick-add input per lane
- Card activation via link template (`<a href>`) or an open event
- Optimistic moves; host rolls back by resetting `cards`
- htmx-safe: re-renders on attribute changes

## Basic Usage

```html
<wc-kanban
    group-field="status"
    lanes='[{"value":"backlog","label":"Backlog","color":"#64748b"},
            {"value":"in_progress","label":"In Progress","color":"#3b82f6"},
            {"value":"done","label":"Done","color":"#22c55e"}]'
    cards='[{"_id":"1","title":"Draft spec","status":"backlog","priority":"High"},
            {"_id":"2","title":"Build API","status":"in_progress","assignee":"Sam"}]'
    card-id-field="_id"
    card-title-field="title"
    card-fields='["priority","assignee"]'>
</wc-kanban>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `group-field` | `status` | (required) card member whose value places a card in a lane |
| `lanes` | `[]` | (required) JSON array of `{ value, label, color? }`, rendered in order; `color` accents the lane header |
| `cards` | `[]` | JSON array of record objects |
| `card-id-field` | `_id` | id member of each card |
| `card-title-field` | `title` | title member shown on each card |
| `card-fields` | `[]` | JSON array of member names rendered as `.badge .badge-muted` chips (empty values skipped) |
| `rollup-field` | `""` | optional numeric member; the lane header shows its per-lane sum |
| `rollup-prefix` | `""` | optional string prefixed to the rollup (e.g. `$`) |
| `card-link-template` | `""` | optional URL with `{field}` tokens; renders each card as an `<a href>` |
| `quick-add` | — | boolean; adds a "+ Add..." input at each lane foot |
| `readonly` | — | boolean; disables drag and hides quick-add (links/activation still work) |

## Events

All events bubble and are composed.

| Event | detail | When |
|-------|--------|------|
| `wckanbanchange` (legacy alias `wc-kanban:change`) | `{ cardId, fromValue, toValue, groupField, toIndex }` | drag move to another lane, or within-lane reorder (`fromValue === toValue`) |
| `wckanbanadd` (legacy alias `wc-kanban:add`) | `{ laneValue, title }` | quick-add submit (when `quick-add` is set) |
| `wckanbanopen` (legacy alias `wc-kanban:open`) | `{ cardId }` | non-link card activated (click / Enter / Space) |

## Methods

| Method | Description |
|--------|-------------|
| `refresh()` | Re-renders the board |
| `cards` (get/set) | Get a copy of / replace the cards array |
| `lanes` (get/set) | Get a copy of / replace the lanes array |

## Examples

### Rollup total per lane

```html
<wc-kanban
    group-field="status"
    lanes='[{"value":"open","label":"Open"},{"value":"won","label":"Won"}]'
    cards='[{"_id":"a","title":"Acme deal","status":"open","amount":1200},
            {"_id":"b","title":"Globex deal","status":"won","amount":3400}]'
    rollup-field="amount" rollup-prefix="$">
</wc-kanban>
```

### Quick-add plus link cards, with host persistence

```html
<wc-kanban id="board"
    group-field="status"
    lanes='[{"value":"todo","label":"To Do"},{"value":"done","label":"Done"}]'
    cards='[{"_id":"1","title":"First task","status":"todo"}]'
    card-link-template="/x/task/{_id}"
    quick-add>
</wc-kanban>

<script>
  document.getElementById('board').addEventListener('wckanbanchange', async (e) => {
    const { cardId, toValue } = e.detail;
    const res = await fetch(`/x/task/${cardId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: toValue })
    });
    // On failure, roll back by resetting the cards attribute.
    // if (!res.ok) document.getElementById('board').cards = originalCards;
  });
</script>
```

## Notes

- Extends `WcBaseComponent` (display/interactive — **not** form-associated).
- Host element is `display: contents`; styles live in `@layer wc.usage` so `.btn` / `.badge` / utilities win.
- Moves are **optimistic**: the in-memory model updates immediately. The host persists (htmx/fetch) and rolls back by resetting the `cards` attribute.
- `lane.color` is the only allowed hard color (it is passed in) and accents the lane header.
- Empty lanes show a subtle "Drop here" placeholder (CSS `:has`).
- Because `<a>`/`<img>` default to `draggable=true`, `readonly` explicitly sets `draggable=false` on cards.
- htmx-safe: re-renders when `group-field` / `lanes` / `cards` (etc.) change and initializes on dynamic insert.
- The detail panel is host-side — pair with `wc-sidenav`.
