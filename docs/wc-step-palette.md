# WC-Step-Palette Web Component

A vertical column of tiles, one per documented step type, that insert a `{% call step(name="", type="X") %}` skeleton at the cursor of a target `wc-code-mirror`. After insertion the cursor lands inside the empty `name=""` so the author can start typing the step name immediately.

> Related: [wc-step-outline](./wc-step-outline.md) (mirrors the same editor), `wc-code-mirror` (the target editor).

## Features

- One tile per documented step type: nav, action, input, wait, loop, group, function, screen, instrument, alert
- Click a tile to insert a step skeleton at the target editor's cursor
- Collapsible column with a toggle; collapsed state persists per `for=` target in `localStorage`
- Targets the same editor as `wc-step-outline` via the `for` attribute

## Basic Usage

```html
<wc-step-palette for="script"></wc-step-palette>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `for` | — | Required. The `name` of the target `wc-code-mirror`. Resolved via `wc-code-mirror[name="<for>"]`; waits for the editor's ready event if not yet initialized. |

## Events

| Event | Detail | Notes |
|-------|--------|-------|
| `wc-step-palette:toggle-collapsed` | `{ collapsed }` | Fired when the collapse state changes. Bubbles/composed. |

## Methods

| Method | Description |
|--------|-------------|
| `insert(type)` | Insert a step skeleton of the given type at the target editor's cursor; cursor lands inside the empty `name=""`. Returns `false` if no editor is resolved. |
| `toggleCollapsed(next?)` | Toggle the collapsed state, or set it explicitly when `next` (boolean) is passed; persists the state and emits `wc-step-palette:toggle-collapsed` |

## Examples

### Palette + outline targeting the same editor

```html
<wc-code-mirror name="script" step-gutter></wc-code-mirror>
<wc-step-palette for="script"></wc-step-palette>
<wc-step-outline for="script"></wc-step-outline>
```

## Notes

- Host element renders through an inner `.wc-step-palette`.
- Editor resolution is scoped to the closest `wc-tab-item` or `form` ancestor (falling back to `document`) so multi-tab inserts go to the correct editor.
- Collapsed state is stored under `wc-step-palette-collapsed:<for>` in `localStorage`, so each editor tab remembers independently.
- Typically laid out as a flex row alongside `wc-step-outline` inside a `wc-split-pane`.
