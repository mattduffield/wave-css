# WC-Gantt Web Component

A horizontal Gantt / swimlane chart. Items with a start + end render as duration bars on a time axis, grouped into swimlanes by `group-field` (greedy row-packing per lane); zero-duration items render as milestone diamonds. The component owns rendering, scale/zoom, and pointer drag-to-move / resize. The **host owns persistence** via bubbling events.

> Related: sibling to [wc-timeline](./wc-timeline.md) (a **vertical** narrative timeline) — NOT a mode of it; the two share no layout. Shares its item shape with [wc-calendar](./wc-calendar.md) and [wc-kanban](./wc-kanban.md). Scaffold rule: **one date field → `wc-calendar`; two date fields → `wc-gantt`.**

## Features

- Duration bars on a time axis, grouped into swimlanes
- Greedy row-packing so overlapping bars in a lane stack onto separate rows
- Zero-duration items render as milestone diamonds
- `day` / `week` / `month` scale (zoom + axis ticks)
- Pointer-based drag-to-move + left/right edge-handle resize (day-snapped)
- Bar activation via link template (`<a href>`) or an open event
- Sticky lane labels and axis header; horizontal scroll for long ranges
- htmx-safe: re-renders on attribute changes

## Basic Usage

```html
<wc-gantt
    items='[{"id":"t1","label":"Design","start":"2026-06-01","end":"2026-06-10","lane":"Phase 1","color":"#3b82f6"},
            {"id":"t2","label":"Build","start":"2026-06-08","end":"2026-06-20","lane":"Phase 1"},
            {"id":"m1","label":"Launch","start":"2026-06-21","lane":"Phase 2"}]'
    group-field="lane"
    scale="week">
</wc-gantt>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `items` | `[]` | (required) JSON array of `{ id, label, start, end?, <group-field>?, color? }` |
| `group-field` | `lane` | swimlane grouping member (lanes rendered in first-seen order) |
| `scale` | `week` | `day` \| `week` \| `month` (pixels-per-day + axis ticks) |
| `link-template` | `""` | URL with `{field}` tokens; renders each bar as an `<a href>` |
| `readonly` | — | boolean; disables drag/resize |
| `label-field` | `label` | bar label member |
| `id-field` | `id` | id member |

## Events

All events bubble and are composed.

| Event | detail | When |
|-------|--------|------|
| `wcganttchange` (legacy alias `wc-gantt:change`) | `{ id, newStart, newEnd }` | drag move / resize (ISO UTC, day-snapped; `newEnd` null for milestones) |
| `wcganttopen` (legacy alias `wc-gantt:open`) | `{ id }` | non-link bar activated (a trailing click after a drag is suppressed) |

## Methods

| Method | Description |
|--------|-------------|
| `refresh()` | Re-renders the chart |
| `items` (get/set) | Get the raw items / set them (serializes to the `items` attribute) |
| `scale` (get/set) | Get / set the scale |

## Examples

### Drag / resize with host persistence

```html
<wc-gantt id="plan"
    items='[{"id":"t1","label":"Design","start":"2026-06-01","end":"2026-06-10","lane":"Phase 1"}]'
    scale="day">
</wc-gantt>

<script>
  document.getElementById('plan').addEventListener('wcganttchange', async (e) => {
    const { id, newStart, newEnd } = e.detail;
    await fetch(`/x/task/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: newStart, end: newEnd })
    });
    // reset plan.items on failure to roll back
  });
</script>
```

### Read-only with link-through bars

```html
<wc-gantt
    items='[{"id":"t1","label":"Rollout","start":"2026-07-01","end":"2026-07-31","lane":"Ops"}]'
    scale="month"
    link-template="/x/task/{id}"
    readonly>
</wc-gantt>
```

## Notes

- Extends `WcBaseComponent` (display/interactive — **not** form-associated).
- Host element is `display: contents`; styles live in `@layer wc.usage`.
- A bar with no `end` (or `end <= start`) renders as a milestone diamond; milestone `newEnd` is null.
- Interaction is **pointer-based**, so native HTML5 drag is disabled on bars (`draggable=false`). Drag move shifts start+end together; edge handles resize one end. Both snap to whole days.
- Moves are **optimistic**: the host persists and rolls back by resetting the `items` attribute.
- Dependency arrows are intentionally out of scope for v1 (documented follow-up); milestones ARE supported.
- htmx-safe: re-renders on `items` / `scale` / `group-field` change and initializes on dynamic insert.
