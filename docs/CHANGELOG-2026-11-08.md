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

## Second pass: every other text on the primary fill (knowledge base 1.62.0)

The same treatment for the rest of Wave's text-on-primary-fill: about 55 rules in 24 components. Their text was
`--primary-color`, an undefined `--primary-text-color` (so always `#fff`), or `--surface-1`.

**Measured before:** in regular themes, on the fill at the theme's own hue:
- `--primary-color` fails in 108 of 216 theme × mode states (mostly dark mode, down to 1.77:1).
- `#fff` fails in 202.
- `--surface-1` fails in 118.

Those menus, nav links, hovers and chips were unreadable in every browser. In crisp, `--primary-color` is the
relative-color formula, so a broken Chrome breaks them all.

**Rule shape:** `background: var(--accent-fill-bg, <original>)`; `color: var(--on-accent,
var(--wc-on-primary-text | -white | -surface | -text1 | -text5, <original>))`.
- **Crisp:** the `.btn-primary` pair. It's formula-free and follows a tenant `--hue`.
- **Regular themes:** `scripts/gen-status-text.py` writes each token (black or white) only for theme × mode states
  where that original color fails on the fill, at the theme's hue or at any tenant hue (swept every 10°).
  - The value must pass at every hue and uses no formula. The formula's own pick is preferred.
  - Where the original passes, the token is unset and the pixels don't change.
  - No state needed a formula fallback.

**Components:**
- menu (active / hover / mobile `.open`)
- calendar today cell + view button
- address / combobox / record-lookup / emoji / textarea-emoji items
- context menu
- rich-text buttons
- ai-bot + hf-bot header / status / FAB / bot bubble
- article card
- modern radio hover
- pivot buttons, popover items, filter apply, grand total
- help-drawer trigger hover + submit
- chart-builder add hover
- split-pane collapse
- tabulator header hover + selected / hovered rows
- doc-tree toast
- `.popover-form`
- `.wc-fx-video-close`
- swal confirm (`#fff` kept except crisp / failing themes)
- fixed table header
- sidebar / sidenav links + open/close buttons on their default fill. An app `background-color` keeps the original
  colors; the generated link fixes then pick from that color.

**Generated fixes that also hit fill states:**
- The menu-link, help-trigger, chart-builder-add and tabulator-header fixes were measured at rest but also applied on
  hover / active, over the fill: 1.00–1.31:1. `scripts/fill-state-split.py`, which `gen-component-contrast.py` now
  runs, narrows them (`:not(:hover)`, `:not(.active)`) only in the 850 theme states where their color fails on the
  fill. Elsewhere they're unchanged.
- The pivot grand-total fix reads `--on-accent` first.

**Not changed:**
- wc-input's `input[type="button"]` rule never applies. An existing unbalanced block in wc-input's stylesheet
  swallows it, in the committed build too.
- wc-top-nav isn't in the bundle (commented out in `index.js`). Its rules were updated but aren't shipped.
- A sidebar with an app-chosen background isn't the primary fill. Its link contrast is reported in the test (1.03:1
  with `#111` in designer), not changed.

**Tests:**
- `tests/on-primary-static-test.py` now covers both passes:
  - every stylesheet rule that paints the primary fill and sets a text color (63, read live after loading every
    component's styles), plus real elements, with `:hover` / `:active` rewritten to classes so hover fills are
    measured
  - the formula forced to black (`--wc-on-primary`, and crisp's `--primary-color`)
  - regular themes: pixel-identical except where the committed build was under 4.5:1 at the theme's hue or a tenant
    hue
- Demo `views/on-primary.html` adds a menu, sidenav, calendar, tabulator header/row and pivot grand total, plus a
  live table of every rule on the fill.
