# WC-Step-Outline Web Component

A companion to `wc-code-mirror` (with `step-gutter`) that renders a hierarchical list of `{% call step %}` blocks parsed from a target editor's content. Each row shows a colored dot matching the gutter palette, the step name, and indentation by nesting depth. Clicking a row jumps the editor cursor to that line and scrolls it into view.

> Related: [wc-step-palette](./wc-step-palette.md) (insert step skeletons), `wc-code-mirror` (the target editor).

## Features

- Mirrors the `{% call step %}` blocks of a target `wc-code-mirror`, re-rendering on every edit (debounced ~150ms)
- Click a step row to jump the editor cursor to that line and scroll it into view
- Lists `{% include %}` / `{% from %}` / `{% import %}` / `{% extends %}` fragments in an "Includes" section (click to request the host open that fragment)
- Per-step pause-breakpoint toggle, persisted per-pilot in `localStorage` when `storage-key` is set
- Optional live runtime highlighting driven by a paired `wc-event-stream` (`events-from`), including iteration badges for looped steps
- Mirrors the active step back into the editor gutter as an `is-active` glow

## Basic Usage

```html
<wc-step-outline for="script"></wc-step-outline>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `for` | — | Required. The `name` of the `wc-code-mirror` this outline mirrors. Resolved via `wc-code-mirror[name="<for>"]`; waits for the editor's ready event if not yet initialized. |
| `events-from` | — | `id` of a sibling `wc-event-stream` to subscribe to for live `step_change` updates |
| `storage-key` | — | `localStorage` key used to persist per-step pause breakpoints |

## Events

| Event | Detail | Notes |
|-------|--------|-------|
| `wc-step-outline:open-include` | `{ slug, kind, line }` | Fired when an Includes row is clicked. Bubbles/composed. If no host handler calls `preventDefault()`, the outline falls back to jumping the cursor to that line. |

## Methods

| Method | Description |
|--------|-------------|
| `setActiveLine(line)` | Highlight the row matching the given 0-indexed line (pass `null` to clear) |
| `setActiveStack(stack)` | Set the runtime step stack (`[{ name, type, iteration, started_at? }, ...]`, outermost first); the deepest matched range is highlighted as active |
| `getPausedStepNames()` | Return the array of step names that have the pause toggle on |
| `refresh()` | Force a re-render (rarely needed; the outline re-renders automatically on editor edit) |

## Examples

### With a live event stream

```html
<wc-code-mirror name="script" step-gutter></wc-code-mirror>
<wc-step-outline for="script" events-from="run-events"
                 storage-key="pilot-breakpoints:my-pilot"></wc-step-outline>
<wc-event-stream id="run-events" url="/automate/events"></wc-event-stream>
```

## Notes

- Host element renders through an inner `.wc-step-outline`.
- Editor resolution is scoped to the closest `wc-tab-item` or `form` ancestor (falling back to `document`) so multi-tab layouts don't cross-bind outlines to other tabs' editors.
- Uses the same parser as the gutter (`wc-code-mirror.parseStepBandRanges`) so the outline and gutter stay in lockstep.
- Pause-breakpoint state persists only when `storage-key` is set.
