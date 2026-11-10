# Wave CSS changelog — 2026-11-09 (knowledge base 1.63.0)

## wc-select chip mode: the list reopens without leaving the field; the input stays wide enough

**Problem:**
- The chip-mode options list was shown only on the input's `focus` event.
- After a pick (click or Enter) or Escape, the list was hidden and the input cleared, but focus stayed in the input.
- So typing filtered a hidden list, and nothing appeared until the user left the field and came back.
- A mouse pick also blurred the input.
- As chips filled the row, the input and its list (which matches the input's width) shrank to 85px.

**Fix (additive, `src/js/components/wc-select.js`, chip mode only):**
- Reopen when the list is closed:
  - on typing (`input`)
  - on a click of the already-focused input (also covers `no-filter`, where the input is read-only)
  - on ↓, which opens it with the first option highlighted
  - The list is re-filtered by the current text when it reopens.
- A mouse pick no longer blurs the input (`mousedown` `preventDefault` on options), so the next name can be typed at
  once.
- The chip row wraps and the input keeps at least 9rem. When the chips leave less room, it moves to its own
  full-width line instead of shrinking. With a few chips it stays beside them as before.

**Unchanged:**
- Focus opens the list.
- Escape and an outside click close it.
- Chip removal.
- The inner `<select multiple>` keeps the name, so the form post sends every value.
- Standard and multiple modes.
- The list's styling and position.

**Proof:** `tests/select-chip-reopen-test.py` (33/33) on `views/select-chip.html` (250 options), each scenario also
run on the committed build:

| Scenario | Committed build | New build |
|---|---|---|
| Type → click pick → type | list stays closed | opens, filtered, focus stays |
| Type → ↓ → Enter → type | list stays closed | opens, filtered |
| ↓ on the closed list | stays closed | opens, first option highlighted |
| Escape → type (reported) | list stays closed | opens, filtered |
| no-filter: pick, click the input again | reopens | reopens; the pick no longer blurs |
| Input width with many chips | 85px | full row (334–844px) |

- Outside click still closes the list.
- The form post sends all chosen values under the inner select's name.
- Chip removal returns the option to the list.
- The list text is ≥ 17:1 and the highlighted option ≥ 5.4:1 in royal (light/dark/crisp), lemon, coffee dark and
  designer.

## wc-chip-picker: per-chip detail, unique by overlap, readonly-hint, no-slots pickers (knowledge base 1.64.0)

Additive. Pickers that use none of these options behave exactly as before. The exceptions are a picker with no
`slots` (now as specified below) and `unique` (now by overlap, as requested).

- **`detail-label` (+ `detail-placeholder`):** a per-chip text detail under the slot pills.
  - Done (or Enter) commits it; Escape discards it.
  - Chips become `{value, slots, detail}`, with `detail` only when non-empty, so values without details produce the
    same JSON as before.
  - Chip text: `Angel · Sun · 7:30–9`. Title, aria-label, form post and `change` / `wcchippickerchange` include it.
- **No slots** (`slots` empty or absent):
  - The editor has no slot section.
  - Chips read `Angel · 7:30–9` or `Angel`. Before, they read `Angel · all`.
  - The value is `[{value, detail}]`. Before, it was `[{value, slots: []}]`. Input `slots` may be omitted or `[]`.
- **`unique` by value + slots overlap:**
  - The same value may repeat on slots that don't overlap.
  - Taken slots are disabled pills. A remaining overlap is named, and Done/Enter is disabled until it's resolved.
  - A value covering every slot is a disabled option.
  - "+ Add" is hidden only when every option covers every slot.
  - Only overlapping repeats in a value merge (chained, "all" wins).
  - Before, a value could appear only once.
- **`readonly-hint`:** an extra last tooltip line on readonly chips.

**Bug fixed during testing:** a value that already had an "every night" chip wasn't counted as present, so "+ Add"
preselected it although it was disabled.

**Proof:**
- `tests/chip-picker-detail-test.py` 34/34:
  - detail editing and Escape
  - events, attribute reflection and form post
  - value round-trip, with values without detail identical to the committed build
  - readonly-hint and no slots
  - the 25 × 7 grid of 175 no-slots pickers: rendered 159 ms after navigation, longest task 62 ms, 12 ms total
    blocking, editor opening in 10 ms
- `chip-picker-unique-test.py` 41/41 (rewritten for the overlap rule). Pickers without the new options still match
  the committed build exactly: DOM, ARIA, editor, events and pixels.
- `chip-picker-test.py` 50/50. Two expectations changed: the readonly check now targets the display table, and a
  no-slots probe now posts `{"value":"a"}`.
- `chip-picker-contrast-test.py` 28/28 over 648 states, including the new detail input (text, placeholder 5.32:1,
  label, border), the overlap message (6.51:1), taken pills, the clashing pill and the disabled Done.
- Screenshots in light and dark at 1200px and 375px.

## wc-prompt: Cancel is readable in light themes (knowledge base 1.65.0)

**Problem:** `.swal2-cancel` set only `background-color: var(--secondary-bg-color)`, so its label stayed SweetAlert's
`#fff`. In light themes that's white on a near-white fill: 1.02:1 (lemon light), 1.03:1 (royal / designer light
crisp).

**Fix (additive, `wc-prompt.js` `_applyStyle()`):** Cancel looks like `.btn-secondary`.
- **Normal:** label `var(--component-color, var(--text-1))`; border `1px solid var(--component-border-color,
  var(--secondary-bg-color))`. The 1px comes out of the padding, so Cancel keeps Confirm's height.
- **Hover:** `background-color: var(--surface-3, …)`, the same label, `background-image: none` (no SweetAlert
  darkening).
- **Keyboard focus (`:focus-visible`):** the same 3px ring SweetAlert draws on Confirm, in Cancel's label color.

**Unchanged:** Confirm, Deny, the dialog surface, title and text colors, and toasts. All are computed identical to
the committed build in every state.

**Proof:** `tests/prompt-cancel-test.py` 8/8 over 840 states. That's 54 themes × forced light / forced dark / light on
dark OS / dark on light OS / follow the OS (light, dark) × regular / crisp, plus a tenant-hue sweep of royal (regular
+ crisp, every 15°).

| Check | New build | Committed build |
|---|---|---|
| Cancel label, normal | ≥ 16.94:1 | as low as 1.02:1 |
| Cancel label, hover | ≥ 9.17:1 | as low as 1.02:1 |
| Focus ring vs dialog | ≥ 5.17:1 | — |
| Border at each theme's own hue | ≥ 3.05:1 | — |

- Cancel's height matches Confirm's in every state, and hover has no gradient.
- Screenshots of question(), fire() with Deny, error() and warning() in light crisp and dark, plus Cancel hover /
  focus. Demo: `views/prompt.html`.
- The specified border token (`--component-border-color`, `.btn-secondary`'s border) is guaranteed 3:1 at each
  theme's own hue. At a tenant hue it can drop (2.46:1 for royal dark re-hued to 30°). The label stays ≥ 9:1 there.

**Found, not changed:**
- wc-prompt needs `<wc-event-hub>` on the page. Without it, `renderPrompt()` throws on `wc.EventHub.broadcast` and
  none of the prompt styles are injected.
- In regular themes re-hued by a tenant, the lighter text steps (`--text-6` / `--text-8`) can lose their margin on
  some surfaces (`--text-6` ~2.96:1 on the dialog for royal dark at 30°). Their per-theme limits are generated for the
  theme's own hue.
