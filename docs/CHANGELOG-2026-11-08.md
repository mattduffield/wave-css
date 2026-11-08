# Wave CSS changelog — 2026-11-08 (knowledge base 1.61.0)

## Text on the primary fill: contrast without trusting the relative-color formula

**Problem:** `--wc-on-primary` (and crisp's `--primary-color`) is `rgb(from var(--primary-bg-color) … pow() …)`.
Some Chrome versions evaluate it wrongly. On royal crisp light, `.badge-primary` gets black text at 4.27:1.

**Why not just `--on-accent`:** in crisp light, `--on-accent` (near-white) belongs with `--accent-fill-bg`, the accent
deepened about 18%. On the raw accent (L54%) it fails 12 teal/cyan themes (3.80–4.46:1). Black fails royal there,
so no single text color works for every hue. A per-theme static color can't work either, because Informa Events
tenants re-hue themes (`.theme-tenant-<slug> { --hue: N }`).

**Fix:**
- **`.crisp`:** text-on-primary elements use the `--accent-fill-bg` + `--on-accent` pair, the same as `.btn-primary`.
  It is checked for every hue, uses no formula, and follows any tenant `--hue`. In crisp light the fill is ~18%
  deeper; in crisp dark the fill is the same and the text is `--on-accent`.
- **Regular themes:** `scripts/gen-status-text.py` writes `--wc-on-primary-static` (`#000` / `#fff`, the formula's own
  answer). It does this only for the 14 themes whose fill doesn't move with `--hue`. Everywhere else the formula is
  unchanged.
- Rule shape: `background: var(--accent-fill-bg, var(--primary-bg-color)); color: var(--on-accent,
  var(--wc-on-primary-static, var(--wc-on-primary, …)))`.
- Applied to:
  - `.badge-primary` (+ hover:/focus:/focus-visible:/active:, via `scripts/generate-state-variants.js`)
  - `.accent-fill`
  - wc-table header / row number / primary row / primary th / pager buttons
  - fx-board playing pad + selected zone
  - wc-font-picker selected chip
  - wc-select chip + highlighted option
  - wc-wizard active step
  - wc-pivot zone chip
  - the generated contrast fixes for those last four (`scripts/gen-component-contrast.py`, `ON_ACCENT_FILL`)

**Two existing fx-board bugs fixed** (they failed in every browser before):
- A playing pad's key cap was the fill darkened 30% with text picked for the undarkened fill (2.25:1). It is now
  outlined in the pad's label color.
- A playing zone that isn't selected colored its name with the on-fill color on `--surface-2` (1.02:1). It now keeps
  its normal text color.

**Before → after** (`views/on-primary.html`, royal light crisp):
- Failing Chrome simulated: lowest 2.13:1 (badge-primary 4.27) → 7.21:1, all pass.
- Tenant hue 190°: lowest 2.49:1 (pivot chip 3.92) → 6.01:1.

**Verified:**
- `tests/on-primary-static-test.py`: 41/41 over 1,514 states. That's 54 themes × 6 modes × regular/crisp, an 864-state
  tenant-hue sweep (royal crisp + regular, coffee regular) and 2 no-theme states, with 20 probes.
  - Regular themes: every probe is painted identical to the committed build, except the 2 fx fixes.
  - Every probe is ≥ 4.5:1 normally and with `--wc-on-primary` forced to black. The previous build dropped to 1.53:1
    forced, and to 3.92:1 normally on a tenant hue.
- `on-primary-contrast-test` 9/9. Its hue-sweep contrast now passes; its gray check accepts crisp's near-white
  `--on-accent`.
- Other gates:

  | Gate | Result |
  |---|---|
  | component-contrast | 62/62 |
  | status-text | 77/77 |
  | badge-contrast | 14/14 |
  | accent-family | 15/15 |
  | button-contrast | PASS |
  | dropdown-grid | 35/35 |
  | crisp-contrast | 9/9 |
  | select-value | 18/18 |
  | chip-picker | 50 + 20 |
  | fx-board | 30 |
  | font-picker | 56 |
  | table-features | 61 |
  | table-htmx | 6 |

- Every `views/` page vs the committed build (pixels, 4 states):
  - Only crisp states differ, on pages with these elements: fx-board, table, test-optgroup, wizard, org-chart's Lead
    badge.
  - on-primary.html is the new demo.
  - The rest differ also build-vs-itself (nondeterministic pages).
