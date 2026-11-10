# wc-chip-picker

Pick several values where **each one is limited to some slots**: parts × show nights, roles × shifts. One chip = one
value + its slots; a chip with **no slots means every slot**. The same value may appear twice with different slots
(Angel on Fri + Sat, and Angel again on the following Fri).

Demo: `views/chip-picker.html`. Tests: `tests/chip-picker-test.py` (behavior, 50 checks) and
`tests/chip-picker-contrast-test.py` (648 theme/mode states), `tests/chip-picker-unique-test.py` (`short`, `unique`,
and the proof that pickers without them are unchanged).

```html
<wc-chip-picker name="parts_42" add-label="Add part" all-label="every night" slot-label="Nights" warn-overlap
  slots='[{"value":"n1","label":"Fri 12/12"},{"value":"n2","label":"Sat 12/13"},{"value":"n3","label":"Sun 12/14"}]'
  value='[{"value":"Mary","slots":[]},{"value":"Angel","slots":["n1"]}]'>
  <option value="Mary">Mary</option>
  <option value="Angel">Angel</option>
</wc-chip-picker>
```

## Attributes

| Attribute | Meaning |
|---|---|
| `name` | Form field name. Submits the value as **one JSON string**. |
| `value` | JSON array `[{"value": "...", "slots": ["slotValue", ...]}]`. `slots: []` = every slot. Setting it from outside rebuilds the chips. |
| `slots` | JSON array `[{"value", "label", "short"?}]`. Their order is kept in chips and pills. `short` (optional) is the slot's chip text; pills and titles always use `label`. |
| `<option>` children | The choices for the value select (hidden; label = option text). |
| `add-label` | Text of the add button (`+ Add part`) and of the dialog (`Add part` / `Edit part`). Default `Add`. |
| `all-label` | Chip suffix and pill for "no slots" (`every night`). Default `all`. |
| `slot-label` | Heading of the slot pills (`Nights`); its lowercase form is used in counts (`4 nights`). Default `Slots`. |
| `warn-overlap` | Chips that share a slot get the warning style plus a title naming who and when. Never blocks. |
| `unique` | Each value can be on at most one chip. See [unique](#unique). |
| `readonly` | Chips only (spans), no editing. Still submits. Use for display tables. |
| `disabled` | Chips only, not focusable, `aria-disabled`, **not submitted**. |
| `detail-label` | Turns on a per-chip free-text detail (e.g. `Hours`), edited under the slot pills. See [Detail](#detail). |
| `detail-placeholder` | Placeholder for the detail input (e.g. `all night, or 6-7:30`). |
| `readonly-hint` | With `readonly`: an extra last line in each chip's tooltip (e.g. where to edit). |
| `aria-label` | Label of the chip group. Default: the plural of `add-label`'s noun (`Parts`), else `Choices`. |

## Chips

- `Mary · every night` (no slots), `Angel · Fri, Sat` (up to 3 slots: each slot's `short`, else the first word of its
  label, e.g. `Herod · Dec 4 (Thu), Dec 5 (Fri)`), `Wise Man · 4 nights`
  (more than 3; every slot label is in the title).
- Badge classes: `.badge`, and `.badge-warning` for an overlap. The title reads e.g. *Mary and Angel both on Fri 12/12*
  (*Mary, Angel and Wise Man all on Fri 12/12* for three or more). A no-slots chip shares every slot.

## unique

- In the editor's select, values already on **another** chip are disabled and read "Mary (already added)". The chip
  being edited keeps its own value. Add preselects the first free value.
- **+ add-label** is hidden while every option is on a chip and returns when one is removed. The chips stay one tab stop.
- A `value` (attribute or `.value`) that repeats a value is **merged into the first chip**: slots combined in slot
  order, and if any of the repeats is "all" (`slots: []`) the result is "all". No `change` event.
- Overlap warnings (`warn-overlap`) still apply between different values.
- Disabled options: `--text-6` on `--component-bg-color`, ≥ 4.5:1 in every theme and mode (lowest 5.32). That color
  applies where the browser draws the list in the page (Windows, Linux, a listbox). macOS Chrome/Safari draw the
  open list natively in their own gray; the "(already added)" text says it either way.

Without `unique` (and without `short`) a picker behaves exactly as before: a repeated value stays two chips.

## Detail

With `detail-label="Hours"` the editor shows a labeled text input under the slot pills (`detail-placeholder` optional).
**Done** commits it with the rest of the draft, and Enter in the input commits too. **Escape** discards it.

- **Value:** each chip is `{value, slots, detail}`. `detail` is a trimmed string and is written only when it's
  non-empty, so a picker with no details produces exactly the same JSON as before. Missing, empty or blank all mean
  no detail.
- **Chip text:** the detail is appended: `Angel · Sun · 7:30–9`, `Mary · every night · 6–7:30`,
  `Wise Man · 4 nights · all night`.
- **Title and aria-label** add `Hours: 7:30–9`.
- **Form post and events:** the post and `change` / `wcchippickerchange` (`detail.value`) include it.
- **Without `detail-label`:** a `detail` already in the value is still shown and kept on edit. There's just no input.

## No slots

When `slots` is empty or absent:
- The editor has no slot section.
- Chips read just the value plus the detail: `Angel · 7:30–9` or `Angel`, with no "all".
- The value is `[{value, detail}]`. Input `slots` may be omitted or `[]`.

With `unique`, there's one chip per value, since any repeat overlaps.

## unique

Changed Nov 9: unique is now per value + slots overlap, not per value.

- A value may appear more than once only on slots that don't overlap. A chip with no slots covers every slot.
- In the editor:
  - Slots the value already has on another chip are disabled pills (crossed out).
  - If the draft still overlaps (for example, you switched the value after picking slots), a message names the
    overlap and **Done** (and Enter) is disabled until you pick other slots.
  - A selected pill that overlaps stays clickable, so you can turn it off.
- A value whose chips already cover every slot is a disabled option, "(already added)".
- **+ add-label** is hidden only when every option covers every slot.
- Repeats in a `value` that overlap are merged into the earlier chip: slots combined in order, "all" wins, the first
  detail kept. Merges chain, and no `change` event fires. Repeats that don't overlap are kept.
- Without `unique`, behavior is unchanged.

## Editing

Click a chip, or **+ add-label**, to open an anchored popover (menu-surface look, `role="dialog"`):

1. the value select
2. slot toggle pills (`aria-pressed`; a selected pill has the theme's primary-button colors, the same fill and label as
   `.btn-primary`, plus ✓ and bold, so it isn't marked by color alone)
3. the all-label shortcut (clears the slots)
4. **Remove** (when editing an existing chip), then **Done**

Edits are a draft. **Done** commits them. **Escape** or a click outside discards them, and a new chip exists only after Done.
The popover is appended to `<body>` with the page's theme classes, stays inside the viewport, and is full width under
480px. It never uses `confirm()` or `alert()`.

## Keyboard

The chips and the add button are one tab stop (roving tabindex) inside `role="group"`.

| Key | Action |
|---|---|
| ← → ↑ ↓, Home, End | Move between chips |
| Enter, Space | Open the editor |
| Delete, Backspace | Remove the focused chip |
| Escape | Close the editor; focus returns to the chip |
| Enter in the value select | Done |

Each chip's `aria-label` lists the value, every slot label, any overlap warning, and "Press Enter to edit".

## Form, events, HTMX

- **Form-associated** (ElementInternals): `FormData` gets `name` = `JSON.stringify(value)`.
- A user edit fires **`change`** and **`wcchippickerchange`** (both bubble; `detail.value` = the array). Setting `value`
  (attribute or property) from outside rebuilds the chips **without** an event.
- `el.value` returns a copy of the array; `el.value = [...]` (or a JSON string) sets it.
- **HTMX:** all state is built from attributes on connect and on attribute change, and every edit is written back to
  the `value` attribute, so an outerHTML/innerHTML swap or a settle shows the latest value. Removing the element with the
  editor open closes the popover and removes its listeners.

## Styling and contrast

Wave tokens only: `--text-1`/`--text-2`/`--text-8`, `--surface-2`, `--component-bg-color`, and badge classes. There are
no hex values and no inline colors. Layout is in `@layer wc.usage`. Chip and popover control rules are unlayered and
scoped by class, because `wc.ui` styles bare buttons and selects.

Measured on a canvas, with translucent backgrounds composited, in 54 themes × {forced light, forced dark, follow the OS} ×
{OS light, OS dark} × {regular, `.crisp`}:

- chip, warning chip, readonly chip, add label, labels, select text, pills (off / on / all) and Remove / Done: ≥ 4.5:1
  (lowest: a selected pill at 4.60, the same as the theme's `.btn-primary`)
- borders and focus rings: ≥ 3:1
- the disabled label: ≥ 3:1
