# Wave CSS changelog — 2026-11-01 (knowledge base 1.51.1)

Compared against the build go-kart shipped before d210a51: go-kart `e4d6238b`
(`static/js/wave-css-0.0.1/`, Wave of 2026-10-29). Generated from `diff` of the built `wave-css.css`.

## Existing tokens / selectors changed: **none**

- Lines removed or modified in `wave-css.css`: **0**. Lines added: **325**.
- `wave-critical.min.css`: **byte-identical** to 2026-10-29 (restored).
- `wave-theme-init.js`: byte-identical.
- Proof: `tests/regression-vs-baseline-test.py` — 648/648 screenshots (54 themes × forced light / forced
  dark / OS-following × OS light / OS dark × crisp / no crisp) pixel-identical; 92,664 text-token ×
  surface-token contrast values identical.

## Reverted from d210a51

| d210a51 | Now |
|---|---|
| `@media (prefers-color-scheme: dark) { .crisp:not(.light):not(:where(.light) .crisp) { …dark crisp tokens… } }` | **removed** — `.crisp` with no `.light`/`.dark` behaves exactly as on 2026-10-29 |
| `[hidden]:not([hidden="until-found"]) { display:none !important }` in `@layer wc.vars` | narrowed: `display:none` (not important) in `@layer wc.selected` — beats Wave's display classes only; inline styles and unlayered app CSS win as before |
| `wave-critical.min.css` rewritten as layered CSS | **restored** to the original; layered version is a new opt-in file `wave-critical-layered.min.css` |

## Added (new selectors / tokens only — no effect on elements that don't use them)

Selectors:
- `.success-soft-fill`, `.warning-soft-fill`, `.danger-soft-fill`, `.info-soft-fill`
  (+ `@supports (relative color + pow())` block computing their foreground ink)
- `:is(.success-soft-fill, .warning-soft-fill, .danger-soft-fill, .info-soft-fill) a:not(.btn)` and `:hover` — links take the callout color
- `.text-inherit`, `.text-inherit:hover`
- `.object-cover|contain|fill|none|scale-down`, `.object-center|top|bottom|left|right`
- `{sm,md,lg,xl,2xl}:items-start|center|end|stretch|baseline`, `:justify-start|center|end|between|around|evenly`, `:table`, `:table-row`
- `2xl:flex-wrap`, `2xl:flex-wrap-reverse`, `2xl:flex-nowrap` (sm–xl already existed; `md:flex-wrap`, `md:table-cell` already existed)
- `[hidden]:not([hidden="until-found"])` in `@layer wc.selected`

Custom properties (declared only on the soft-fill classes): `--danger-soft`, `--danger-soft-border`, `--info-soft`, `--info-soft-border`, `--on-danger-soft`, `--on-info-soft`, `--on-success-soft`, `--on-warning-soft`, `--success-soft`, `--success-soft-border`, `--warning-soft`, `--warning-soft-border`, `--wc-soft-bg`, `--wc-soft-ink`

Files: `dist/wave-critical-layered.min.css`, `dist/assets/icon-bundles/icon-index.json`, `icon-aliases.json`,
`docs/ICONS.md`; icons `shirt`, `rotate-left` (+ earlier icon additions).

### Behaviour notes for go-kart's check
- A page that ALREADY carried one of the new class names (e.g. `md:items-center`, `object-cover` copied
  from Tailwind habits) got no styling before and gets it now. Search templates for these names if a layout shifts.
- An element with the `hidden` attribute AND a Wave display class (`.col`, `.flex`, `.row`, `md:flex`…) was
  visible before (the class won) and is hidden now. Inline `style="display:…"` / unlayered CSS still show it.

## JavaScript

- **wc-theme-selector** — the "Light or Dark?" toggle now saves `localStorage.darkMode` ("true"/"false")
  and switches `.light`/`.dark` on `<html>` in plain JS (was a hyperscript handler that never saved the
  mode, so a refresh lost it — true on 2026-10-29 as well). Still sends `wcthemechange` to `<body>`.
  The toggle's initial state comes from `localStorage.darkMode`, else `.dark`/`.light` on `<html>` (was:
  dark whenever nothing was saved, so on a light page the first click did nothing visible).
- **wc-dropdown** `mode="search"` — `_handleInput` only filters for the dropdown's own
  `.dropdown-content > input.search`; the listener is bound to that input. The wrapper also carries the
  class `search` (from the mode), so the old `querySelector('.search')` bound the listener to the whole
  wrapper and a toggle inside the menu hid every item (reproduced on the 2026-10-29 build).
- **wc-fa-icon** — resolves Font Awesome's official aliases on a miss (`tshirt`→`shirt`, `undo-alt`→`rotate-left`).

---

# Wave CSS — 2026-11-01, part 2: `.crisp` rebuilt (knowledge base 1.52.0)

`.crisp` is the **one deliberate exception** to "add only". Pages **without** `.crisp` are unchanged
(pixel-identical to 2026-10-29 — `tests/regression-vs-baseline-test.py`). Pages **with** `.crisp`
change on purpose; before/after screenshots of every theme are in the approval gallery.

## Why

Crisp replaced only the surfaces and the accent. It borrowed the theme's text colors, which follow the
**OS** — while crisp's surfaces followed `.light`/`.dark`. Result: near-white text on light grays with
a dark OS and no mode class (1:1), dim hint text in some themes, text on the accent at 2.7:1 in dark,
pale-on-pale disabled buttons, a fading "muted" badge.

## What `.crisp` now sets (light block, `.dark` block, and an identical OS-dark block)

| Token / selector | Before | Now |
|---|---|---|
| `--text-1` … `--text-13` | theme's (OS-following) | crisp's own neutral ramp: 1–6 ≥ 4.5:1, 7–9 ≥ 3:1 |
| `--surface-9` … `--surface-13` | theme's (saturated) | crisp neutral |
| `--card-color`, `--container-color`, `--component-color`, `--component-placeholder-color` | theme's | re-resolved on crisp's text ramp |
| `--component-border-color` | light gray (≈1.3:1) | ≥ 3:1 form outline (inputs, checkboxes, radios, toggles) |
| `--component-focus-border-color`, `--button-focus-*` | theme's | crisp accent |
| `--component-disabled-*`, `--button-disabled-*` | theme's (pale on pale in dark) | neutral, label ≥ 3:1 |
| `--button-color` | theme's | `--text-2` (outline labels, menu/sidenav links) |
| `--primary-color`, `--button-hover-color` | fixed near-white (2.7:1 dark) | black/white from the fill's luminance |
| `.crisp :is(.wc-accordion .accordion-header, .wc-dropdown .dropbtn, .wc-ai-bot-nano-btn)` | — | `--button-color` = black/white from `--button-bg-color` |
| `--checkbox-*`, `--radio-*`, `--toggle-*`, `--slider-track`, `--secondary-bg-color` | theme's | crisp tokens |
| `--success/-danger/-warning/-info-color` (+ `-light-color`) | follow the OS | follow crisp's mode |
| `@media (prefers-color-scheme: dark) { .crisp:not(.light):not(:where(.light) .crisp) {…} }` | — | dark crisp when no `.light`/`.dark` is set and the OS is dark |

Unchanged: crisp's surface-1…8, card/container/component backgrounds, accent and accent family values.

## JavaScript

- **wc-theme-selector** ticks the saved theme when it connects (from `localStorage.theme`, else the theme
  already on `<html>`, else royal). It used to wait for hyperscript's `load` event, which stopped coming
  once the toggle's `_=` handler was replaced in part 1 — every swatch showed a tick.

## Verified

- `tests/crisp-contrast-test.py` — 79 token pairs × 54 themes × {.light, .dark, no mode} × {OS light,
  OS dark} × {on `<html>`, nested}; every visible text on `views/visual-reference.html` vs what is painted
  behind it (≥ 4.5:1, disabled ≥ 3:1); OS-dark tokens identical to `.dark`.
- `tests/regression-vs-baseline-test.py` — non-crisp pixel-identical to go-kart `e4d6238b`.
