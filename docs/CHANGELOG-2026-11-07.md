# Wave CSS changelog — 2026-11-07 (knowledge base 1.59.0)

## New: `wc-chip-picker` — values that each carry a subset of slots

Pick several values, each limited to some slots: parts × show nights, roles × shifts. One chip = one value + its slots,
and no slots means all of them. Full reference: `docs/wc-chip-picker.md`. Demo: `views/chip-picker.html`.

- Form-associated (ElementInternals). It submits `name` = the value as a JSON string. `disabled` is not submitted;
  `readonly` is.
- Chip text: `Mary · every night`, `Angel · Fri, Sat`, or `Wise Man · 4 nights` (full list in the title). Chips use badge classes.
- `warn-overlap`: chips sharing a slot get `badge-warning` and a title such as *Mary and Angel both on Fri 12/12*.
  The choice is never blocked.
- An anchored popover (menu-surface) holds the value select, slot pills (a selected pill uses the theme's `.btn-primary`
  colors, like Save), the all-label shortcut, Remove and Done.
  Edits are a draft. The popover stays in the viewport and is full width on narrow screens. No `confirm()` / `alert()`.
- Keyboard: roving focus with the arrow keys, Home and End. Enter or Space opens a chip, Delete or Backspace removes
  it, and Escape closes the popover. The chips are a `role=group`, the popover is a `role=dialog`, and the pills use
  `aria-pressed`.
- A user edit fires `change` and `wcchippickerchange` with `detail.value`. Setting the value from outside (attribute
  or property) rebuilds the chips.
- HTMX: the component is rebuilt from its attributes and edits are reflected to `value`, so swaps and settles keep
  the latest value.

**Additive only.** The one change to an existing file is `src/js/components/index.js`, which gains
`import './wc-chip-picker.js';`. There are no changes to existing components, CSS (`src/css/main.css` is unchanged and
`dist/wave-css.min.css` is byte-identical to the previous build) or shared JS (`wc-popover.js` and the base classes are
used as they are). The component's styles are injected at runtime only when the element is used.

**Verified:**
- `tests/chip-picker-test.py`: 50/50.
- `tests/chip-picker-contrast-test.py`: 19/19 over 648 states. Every chip text, the warning chip, the pills and the
  popover text are ≥ 4.5:1 (lowest 4.60). Borders and focus rings are ≥ 3:1. A selected pill matches
  `.btn.btn-primary` exactly in every state.
- Existing `views/` pages vs the previous build (`tests/component-regression-test.py --pages-only`, base
  `/tmp/wave-part13`, 4 theme/mode states each): 97 pages compared.
  - 84 were pixel-identical on the first pass.
  - 4 more (checkin, rating, ai-bot-assistant, test-google-map-debug) were identical on a sequential re-run.
  - The other 9 (ai-bot, busy-indicator, chartjs, complete-example, cron-picker, data-cards, dependency-example,
    help-drawer, test-innerhtml) also differ when a build is compared **with itself**, so they are nondeterministic
    pages, not regressions.
  - New option `--pages a.html,b.html` limits a run to named views.

## `wc-chip-picker`: per-slot `short` text and `unique` (knowledge base 1.60.0)

Additive only. A picker that uses neither option behaves exactly as before.

- **`short` on a slot** (`{"value":"n1","label":"Dec 5 (Sat)","short":"Dec 5 (Sat)"}`) is the chip text for that slot.
  Without it, chips use the first word of the label, as before. The "· 4 nights" collapse above 3 slots and the
  full-label title are unchanged. Pills keep the full label.
- **`unique`**: each value can be on at most one chip.
  - In the editor's select, values already on another chip are disabled ("Mary (already added)"). The chip being
    edited keeps its own value, and Add preselects the first free one.
  - "+ Add" is hidden while every option is used.
  - A `value` with a repeated value is merged into the first chip: slots are combined in slot order, and "all" wins.
    No `change` event fires.
  - Overlap warnings still apply between different values.
  - Disabled option: `--text-6` on `--component-bg-color`.

**Verified:**
- `tests/chip-picker-unique-test.py`: 36/36, run twice.
  - Without the options, the same scripted session gives identical results on the previous build (`/tmp/wave-part15`,
    byte-identical to the committed build) and this one: DOM, ARIA, editor options, form values, `change` events,
    repeated values kept, and screenshots of the chips and the open editor.
  - The disabled option is ≥ 4.5:1 in 54 themes × light/dark/OS × regular/crisp (lowest 5.32).
- `chip-picker-test` 50/50 and `chip-picker-contrast-test` 20/20 are unchanged.
- The CSS bundle is still byte-identical.
