# wc-chip-picker

Pick several values where **each one is limited to some slots**: parts × show nights, roles × shifts. One chip = one
value + its slots; a chip with **no slots means every slot**. The same value may appear twice with different slots
(Angel on Fri + Sat, and Angel again on the following Fri).

Demo: `views/chip-picker.html`. Tests: `tests/chip-picker-test.py` (behavior, 50 checks) and
`tests/chip-picker-contrast-test.py` (648 theme/mode states).

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
| `slots` | JSON array `[{"value", "label"}]`. Their order is kept in chips and pills. |
| `<option>` children | The choices for the value select (hidden; label = option text). |
| `add-label` | Text of the add button (`+ Add part`) and of the dialog (`Add part` / `Edit part`). Default `Add`. |
| `all-label` | Chip suffix and pill for "no slots" (`every night`). Default `all`. |
| `slot-label` | Heading of the slot pills (`Nights`); its lowercase form is used in counts (`4 nights`). Default `Slots`. |
| `warn-overlap` | Chips that share a slot get the warning style plus a title naming who and when. Never blocks. |
| `readonly` | Chips only (spans), no editing. Still submits. Use for display tables. |
| `disabled` | Chips only, not focusable, `aria-disabled`, **not submitted**. |
| `aria-label` | Label of the chip group. Default: the plural of `add-label`'s noun (`Parts`), else `Choices`. |

## Chips

- `Mary · every night` (no slots), `Angel · Fri, Sat` (up to 3 slots: first word of each label), `Wise Man · 4 nights`
  (more than 3; every slot label is in the title).
- Badge classes: `.badge`, and `.badge-warning` for an overlap. The title reads e.g. *Mary and Angel both on Fri 12/12*
  (*Mary, Angel and Wise Man all on Fri 12/12* for three or more). A no-slots chip shares every slot.

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
