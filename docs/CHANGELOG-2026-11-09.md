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
