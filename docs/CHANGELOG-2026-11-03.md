# Wave CSS changelog — 2026-11-03 (knowledge base 1.58.0)

## wc-dropdown `format="grid-round"`: grid icon visible again in dark mode

**Cause:** on 2026-11-01 (regular-theme contrast, part 3) `.wc-dropdown .dropbtn` got a black/white `--button-color`
picked from the button's fill, so labels on filled dropdown buttons read. The grid-round button has a **transparent**
background but still used that color: in themes with a bright fill it resolved to black — dark dots on a dark header
(Pegram, Informa Events in prod; midsky dark measured 1.04:1). Light mode showed them black; before Nov 1 they showed
the theme color.

**Changed (grid-round only):**
- `.wc-dropdown .dropbtn.grid-round { color: var(--wc-dropdown-grid-color, var(--wc-dropdown-grid-auto, var(--primary-bg-color))) }`
  — NEW hook `--wc-dropdown-grid-color`; by default the theme's primary color.
- NEW `--wc-dropdown-grid-auto`, written by `scripts/gen-status-text.py` **only** in theme × mode × family states where the
  plain `--primary-bg-color` is under 3:1 on a header surface (`--surface-1`, `--surface-2`, `--component-bg-color`,
  `--container-bg-color`, `--card-bg-color`): the primary mixed toward `--text-1` at the largest share that reaches 3:1.
  396 of 648 states keep the exact primary color; 252 use the mix (lowest share 27%).
- Open / hovered (the button gets a fill): the icon uses `--button-hover-color`, the label color picked for that fill.

**Unchanged:** standard, avatar and other dropdown formats (computed colors identical to the previous build in all
states); every existing status / badge share the generator writes (only the new declarations were added).

**Verified:** `tests/dropdown-grid-test.py` 35/35 — the resting icon ≥ 3:1 on all five header backgrounds in all
54 themes × light / dark / light-on-dark-OS / dark-on-light-OS / follow-the-OS (light, dark) × regular / `.crisp`
(lowest 3.10:1); the open button's icon vs its fill ≥ 4.60:1; the icon is the theme's primary wherever that reads; the
hook overrides it; midsky dark 1.04:1 → 7.90:1. `ribbon-test` 70/70, `status-text-test` 77/77,
`component-contrast-test` 62/62.
