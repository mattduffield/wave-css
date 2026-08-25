# WC-Calendar Web Component

Binds an array of record-like events onto a date grid with month / week / day / agenda views. The component owns rendering, prev/today/next navigation, view switching, native HTML5 drag-to-reschedule, per-event color, and "+N more" overflow. The **host owns persistence** via bubbling events.

> Related: [wc-gantt](./wc-gantt.md) (two-date duration view) and [wc-kanban](./wc-kanban.md) share the same record shape. Scaffold rule: **one date field → `wc-calendar`; two date fields → `wc-gantt`.**

## Features

- Four views: `month`, `week`, `day`, `agenda`
- Nav bar: prev / today / next + view switcher, with a period label
- Single all-day events and multi-day spans (with span-start/mid/end styling)
- Native HTML5 drag to reschedule (whole-day shift preserving time-of-day and duration)
- Selectable empty days (add event)
- Per-event `color`; month cells cap at 3 chips then "+N more" (drills into day view)
- Timezone-aware bucketing (floating date-only vs. zoned datetimes)
- htmx-safe: re-renders on attribute changes

## Basic Usage

```html
<wc-calendar
    events='[{"id":"1","title":"Kickoff","start":"2026-06-23"},
             {"id":"2","title":"Sprint","start":"2026-06-24","end":"2026-06-27","color":"#3b82f6"}]'
    view="month"
    initial-date="2026-06-23">
</wc-calendar>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `events` | `[]` | (required) JSON array of `{ id, title, start, end?, color? }` with ISO dates |
| `view` | `month` | `month` \| `week` \| `day` \| `agenda` |
| `initial-date` | today | `YYYY-MM-DD` focal date; preserved across view switches |
| `week-starts-on` | `0` | `0` (Sun) or `1` (Mon) |
| `timezone` | `local` | `local` \| `utc` \| an IANA zone name (e.g. `America/Chicago`) |
| `event-link-template` | `""` | URL with `{field}` tokens; renders each event as an `<a href>` |
| `selectable` | — | boolean; clicking an empty day fires `wccalendaradd` |
| `readonly` | — | boolean; disables drag-to-reschedule |

## Events

All events bubble and are composed.

| Event | detail | When |
|-------|--------|------|
| `wccalendarchange` (legacy alias `wc-calendar:change`) | `{ id, newStart, newEnd }` | drag reschedule (ISO UTC strings; `newEnd` null if none) |
| `wccalendaradd` (legacy alias `wc-calendar:add`) | `{ date }` | selectable empty-day click (`YYYY-MM-DD`) |
| `wccalendaropen` (legacy alias `wc-calendar:open`) | `{ id }` | non-link event activated (click / Enter / Space) |
| `wccalendarviewchange` | `{ view, date }` | view switch or period navigation |

## Methods

| Method | Description |
|--------|-------------|
| `refresh()` | Re-renders the calendar |
| `events` (get/set) | Get the raw events / set them (serializes to the `events` attribute) |
| `view` (get/set) | Get / set the current view |

## Examples

### Drag-to-reschedule with host persistence

```html
<wc-calendar id="cal"
    events='[{"id":"42","title":"Demo","start":"2026-06-25T14:00:00Z"}]'
    view="week" selectable>
</wc-calendar>

<script>
  const cal = document.getElementById('cal');
  cal.addEventListener('wccalendarchange', async (e) => {
    const { id, newStart, newEnd } = e.detail;
    await fetch(`/x/appointment/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ start: newStart, end: newEnd })
    });
    // reset cal.events on failure to roll back
  });
  cal.addEventListener('wccalendaradd', (e) => console.log('add on', e.detail.date));
</script>
```

### Read-only agenda with link-through events

```html
<wc-calendar
    events='[{"id":"1","title":"Review","start":"2026-06-30T09:00:00Z"}]'
    view="agenda"
    event-link-template="/x/appointment/{id}"
    readonly>
</wc-calendar>
```

## Notes

- Extends `WcBaseComponent` (display/interactive — **not** form-associated).
- Host element is `display: contents`; styles live in `@layer wc.usage`.
- **Timezone behavior:** date-only values (`YYYY-MM-DD` or a UTC-midnight `...T00:00:00Z`) are treated as **floating** dates — bucketed by their literal calendar date with no zone conversion (correct for UTC-native business date fields; avoids off-by-one drift west of UTC). Datetime values are bucketed by their date in the configured `timezone` (browser-local by default).
- Reschedule is a **whole-day shift** preserving the original time-of-day and duration, emitting ISO UTC strings (date-only events emit `...T00:00:00.000Z`). Hour-precise drag is future work.
- Moves are **optimistic**: the host persists and rolls back by resetting the `events` attribute.
- week/day place timed events as a time-ordered list per day column (all-day/spans first, then chronological) — not an absolute hour grid.
- htmx-safe: re-renders when `events` / `view` / `initial-date` / `timezone` / `week-starts-on` change. Pair with `wc-sidenav` host-side for a detail panel.
