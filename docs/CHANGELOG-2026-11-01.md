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

---

# Wave CSS — 2026-11-01, part 3: contrast for REGULAR themes (knowledge base 1.53.0)

Approved: change regular (non-crisp) colors where needed so light and dark both honor the contrast
standard. Each theme keeps its backgrounds and tint; only failing pieces move.

## Why

Regular themes build text from the same swatch ramp as their backgrounds (light `--text-N` =
`--swatch-(14-N)`, dark `--text-N` = `--swatch-N`). The muted levels land in the middle of that ramp —
same hue, similar lightness as the panels. Measured before: light `--text-6` failed in 52/52 themes
(midsky 2.71:1, `--text-7` 1.45:1), dark `--text-5` in 19, body text in coffee/sienna/chocolate/lemon;
input borders 1.09:1; text on some accents 1.77:1; disabled buttons 1.17:1.

## What changed (generated block in `@layer wc.colors`, `scripts/gen-text-contrast.py`)

| Token / selector | Change |
|---|---|
| `--text-1` … `--text-6` (every theme, light + dark, forced + OS-following) | `oklch(from var(--swatch-K) min(l, var(--wc-text-lim)) c h)` (light; `max` in dark) — same hue/chroma, only darker/lighter where it would fail; ≥ 4.5:1 on surface-1…5, card, container, component |
| `--text-7` … `--text-9` | same, against `--wc-text-lim-ui` — ≥ 3:1 on page/card/field |
| `--wc-text-lim`, `--wc-text-lim-ui` | NEW per theme × mode (measured) |
| `--surface-5` (light, coffee / sienna / chocolate / designer / designer-blue) | lightened (cards were too dark for any dark text: coffee 4.06:1 even with black) |
| `--component-border-color`, `--checkbox-border`, `--radio-border` | `var(--text-9)` — form outlines ≥ 3:1 |
| `--success/-danger/-warning/-info-color` (+ `-light-color`) | follow the page's mode (deeper set light, bright set dark; high-contrast keeps its own bright set in dark) |
| `--wc-on-primary` | now defined on every theme scope and `.crisp` (was only wc-table / fx / font-picker) |
| `--button-hover-color` | black/white from `--button-hover-bg-color` |
| `--button-disabled-color` | that ink eased 25% toward the fill (≥ 3:1, still reads disabled) |
| `:is(.wc-accordion .accordion-header, .wc-dropdown .dropbtn, .wc-ai-bot-nano-btn)` | `--button-color` = black/white from `--button-bg-color` (was crisp-only in part 2) |
| `.badge-primary` (+ hover/focus/active variants) | `color: var(--wc-on-primary, var(--primary-color))` |
| `.accent-fill` | `color: var(--on-accent, var(--wc-on-primary, #fff))` |
| `.btn-primary` | outside crisp, label + hover label = black/white from its own fill (designer light was 4.13:1); crisp keeps `--on-accent` |

All new values sit inside `@supports` (relative color / `pow()`); older browsers keep the original colors.
Unchanged: every background except the five light card surfaces above, swatches, accents, button fills.

## Verified

- `tests/text-contrast-test.py` → `crisp-contrast-test.py --regular` + crisp: token pairs × 54 themes ×
  {.light, .dark, no mode} × {OS light, OS dark}, and every visible text on `views/visual-reference.html`
  vs what is painted behind it (≥ 4.5:1; disabled ≥ 3:1). Both PASS.
- All component suites pass; persistence + search-dropdown checks pass.


---

# Wave CSS — 2026-11-01, part 4: component contrast fixes (additive)

Scope: every Wave component on `views/visual-reference.html` (58 components + page chrome + probes for
unexercised variants), audited in 54 themes × {forced light, forced dark, follow the OS} × {OS light,
OS dark} × {regular, .crisp} = 648 states. Before: 24 of 60 components failed somewhere; after: 0.

## How (additive only — no component code changed)

`scripts/gen-component-contrast.py` measures each element with its ORIGINAL color in every state and, only
where it fails (text < 4.5:1; icons, borders, chip × < 3:1), tries candidates in order and keeps the first
that passes for every instance. It writes one unlayered rule per (element, chosen value):

    :is(<the exact failing theme+mode+family states>) <element> { color: <value> !important; }

So passing states match no rule and keep their exact color. Candidates follow the established patterns:
text ON an accent/colored fill → black/white from that fill (`--wc-on-primary`, or the component's own
fill token, e.g. a calendar event's `--event-color`); accent/state/syntax-colored text ON a surface → the
`.on-surface-accent` mix (55%, else 30%, toward `--text-1`); fixed gray fallbacks → `--text-2`/`--text-1`.
`!important` because some originals are `!important` or inline. A failure in all 648 states collapses to one
unconditional rule (CodeMirror monokai keyword, Prism operator).

## Changed — each component and element, worst ratio before → after

| Component | Element | Property | States changed (of 648) | Worst before | Worst after (need) | Replacement used |
|---|---|---|---|---|---|---|
| badges (global) | `.badge-info` | color | 1 | 1.0:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, color(srgb 0.079894 0.214357 0.508651) 55%, var(--text-1))` |
| wc-calendar | `.wc-calendar-event` | color | 306 | 1.32:1 | 4.54:1 (≥ 4.5) | `rgb(from var(--event-color, var(--primary-bg-color)) INK)` |
| wc-chart-builder | `.chart-builder-add-btn` | color | 432 | 1:1 | 4.51:1 (≥ 4.5) | `3 per-state values, e.g. var(--text-1)` |
| wc-code-mirror | `.cm-s-monokai span.cm-keyword` | color | 648 | 3.93:1 | 5.89:1 (≥ 4.5) | `2 per-state values, e.g. #ffffff` |
| wc-contact-chip | `.wc-contact-chip .close-btn` | color | 611 | 2.11:1 | 4.52:1 (≥ 4.5) | `var(--text-5)` |
| wc-cron-picker | `.cron-expression` | color | 303 | 1.0:1 | 6.83:1 (≥ 4.5) | `3 per-state values, e.g. color-mix(in srgb, color(srgb 0 0 0) 30%, var(--text-1))` |
| wc-cron-picker | `wc-cron-picker select` | border-color | 642 | 1.1:1 | 3.32:1 (≥ 3) | `var(--text-9)` |
| wc-document-tree | `.doctree-type-boolean` | color | 324 | 1.19:1 | 8.18:1 (≥ 4.5) | `color-mix(in srgb, rgb(230, 219, 116) 30%, var(--text-1))` |
| wc-document-tree | `.doctree-type-date` | color | 381 | 3.74:1 | 4.5:1 (≥ 4.5) | `color-mix(in srgb, rgb(99, 102, 241) 55%, var(--text-1))` |
| wc-document-tree | `.doctree-type-null` | color | 538 | 4.09:1 | 4.53:1 (≥ 4.5) | `color-mix(in srgb, rgb(117, 113, 94) 55%, var(--text-1))` |
| wc-document-tree | `.doctree-type-number` | color | 324 | 1.38:1 | 4.55:1 (≥ 4.5) | `2 per-state values, e.g. color-mix(in srgb, rgb(102, 217, 239) 30%, var(--text-1))` |
| wc-document-tree | `.doctree-type-string` | color | 324 | 1.3:1 | 4.5:1 (≥ 4.5) | `2 per-state values, e.g. color-mix(in srgb, rgb(166, 226, 46) 30%, var(--text-1))` |
| wc-document-tree | `:is(.doctree-key, .doctree-arrow-active)` | color | 324 | 1.11:1 | 12.49:1 (≥ 4.5) | `var(--text-2)` |
| wc-document-tree-variants | `.doctree-type-objectid` | color | 324 | 2.38:1 | 6.29:1 (≥ 4.5) | `color-mix(in srgb, rgb(174, 129, 255) 55%, var(--text-1))` |
| wc-explain-tree | `.explain-summary-good` | color | 324 | 1.72:1 | 4.84:1 (≥ 4.5) | `color-mix(in srgb, rgb(34, 197, 94) 55%, var(--text-1))` |
| wc-explain-tree | `:is(.explain-node-name, .explain-metric-value)` | color | 324 | 1.01:1 | 11.06:1 (≥ 4.5) | `var(--text-2)` |
| wc-explain-tree-variants | `.explain-summary-danger` | color | 324 | 2.63:1 | 4.62:1 (≥ 4.5) | `color-mix(in srgb, rgb(239, 68, 68) 55%, var(--text-1))` |
| wc-explain-tree-variants | `.explain-summary-neutral` | color | 333 | 1.0:1 | 4.53:1 (≥ 4.5) | `3 per-state values, e.g. var(--text-1)` |
| wc-explain-tree-variants | `.explain-summary-warn` | color | 324 | 1.64:1 | 4.69:1 (≥ 4.5) | `color-mix(in srgb, rgb(245, 158, 11) 55%, var(--text-1))` |
| wc-file-upload | `.wc-file-upload-browse` | color | 501 | 1.17:1 | 4.55:1 (≥ 4.5) | `3 per-state values, e.g. var(--text-1)` |
| wc-gantt | `.wc-gantt-bar .wc-gantt-bar-label` | color | 324 | 1.8:1 | 5.01:1 (≥ 4.5) | `rgb(from var(--bar-color, var(--primary-bg-color)) INK)` |
| wc-help-drawer | `.help-drawer-trigger` | border-color | 153 | 1:1 | 3.14:1 (≥ 3) | `color-mix(in srgb, var(--primary-bg-color) 55%, var(--text-1))` |
| wc-help-drawer | `.help-drawer-trigger` | color | 246 | 1:1 | 4.52:1 (≥ 4.5) | `2 per-state values, e.g. color-mix(in srgb, var(--primary-bg-color) 30%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.boolean` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(153, 0, 85) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.class-name` | color | 330 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(221, 74, 104) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.comment` | color | 330 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(112, 128, 144) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.constant` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(153, 0, 85) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.function` | color | 330 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(221, 74, 104) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.interpolation` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(0, 0, 0) 30%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.interpolation-punctuation` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(153, 153, 153) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.keyword` | color | 645 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(0, 119, 170) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.null` | color | 645 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(0, 119, 170) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.number` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(153, 0, 85) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.operator` | color | 648 | 1:1 | 4.52:1 (≥ 4.5) | `2 per-state values, e.g. #000000` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.parameter` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(0, 0, 0) 30%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.property` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(153, 0, 85) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.punctuation` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(153, 153, 153) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.string` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(102, 153, 0) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer .token.template-punctuation` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `color-mix(in srgb, rgb(102, 153, 0) 55%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer a` | color | 246 | 1:1 | 4.52:1 (≥ 4.5) | `2 per-state values, e.g. color-mix(in srgb, var(--primary-bg-color) 30%, var(--text-1))` |
| wc-markdown-viewer | `.wc-markdown-viewer code[class*="language-"]` | color | 324 | 1:1 | 4.52:1 (≥ 4.5) | `var(--text-1)` |
| wc-menu | `wc-menu .wc-menu a` | color | 303 | 1.01:1 | 4.58:1 (≥ 4.5) | `3 per-state values, e.g. color-mix(in srgb, color(srgb 0 0 0) 30%, var(--text-1))` |
| wc-pivot | `.pivot-panel-field-type` | color | 330 | 1.0:1 | 4.5:1 (≥ 4.5) | `#ffffff` |
| wc-pivot | `.pivot-panel-field-zone` | color | 432 | 1.0:1 | 4.51:1 (≥ 4.5) | `3 per-state values, e.g. var(--text-1)` |
| wc-pivot | `.pivot-table .pivot-grand-total` | color | 498 | 1.0:1 | 4.53:1 (≥ 4.5) | `3 per-state values, e.g. #000000` |
| wc-pivot | `.pivot-table :is(.pivot-row-total, .pivot-col-total, .pivot-total-label, .pivot-total-header)` | color | 333 | 1.0:1 | 4.88:1 (≥ 4.5) | `var(--text-2)` |
| wc-pivot | `.pivot-table td.pivot-cell` | color | 324 | 1.0:1 | 4.88:1 (≥ 4.5) | `var(--text-2)` |
| wc-pivot | `.pivot-table th.pivot-row-header` | color | 333 | 1.0:1 | 4.88:1 (≥ 4.5) | `var(--text-2)` |
| wc-pivot | `.pivot-table th:not(.pivot-total-header):not(.pivot-row-header)` | color | 333 | 1.0:1 | 4.88:1 (≥ 4.5) | `var(--text-2)` |
| wc-pivot | `.pivot-zone-chip` | color | 498 | 1.0:1 | 4.6:1 (≥ 4.5) | `var(--wc-on-primary)` |
| wc-pivot | `:is(.pivot-panel-header, .pivot-panel-field)` | color | 333 | 1.0:1 | 4.88:1 (≥ 4.5) | `var(--text-2)` |
| wc-rating | `.wc-rating-star` | color | 324 | 1.8:1 | 5.16:1 (≥ 3) | `color-mix(in srgb, rgb(245, 158, 11) 55%, var(--text-1))` |
| wc-select-chip | `wc-select .chip` | color | 162 | 1.77:1 | 4.54:1 (≥ 3) | `var(--wc-on-primary)` |
| wc-sidebar | `wc-sidebar .wc-sidebar a` | color | 507 | 1.33:1 | 4.54:1 (≥ 4.5) | `rgb(from var(--background-color) INK)` |
| wc-sidenav | `wc-sidenav .wc-sidenav.sidenav a` | color | 441 | 1.88:1 | 4.53:1 (≥ 4.5) | `rgb(from var(--background-color) INK)` |
| wc-sidenav | `wc-sidenav :is(.closebtn, .openbtn)` | color | 441 | 1.88:1 | 4.53:1 (≥ 4.5) | `var(--wc-on-primary)` |
| wc-split-pane | `.wc-split-grip` | color | 159 | 1.66:1 | 3.03:1 (≥ 3) | `2 per-state values, e.g. #000000` |
| wc-tabulator | `.wc-tabulator.tabulator .tabulator-header .tabulator-col` | color | 49 | 2.69:1 | 4.57:1 (≥ 4.5) | `rgb(from var(--card-border-color) INK)` |
| wc-wizard | `.wc-wizard-indicator.active` | color | 498 | 1.06:1 | 4.6:1 (≥ 3) | `var(--wc-on-primary)` |

"Worst before" is the lowest ratio over the states that failed; "worst after" over all 648 states.
`INK` = black or white picked from the fill's luminance; "per-state values" = the measured original mixed
toward `--text-1`, so the hue is kept where possible.

## Findings recorded, not changed

- **Undefined tokens.** pivot, document-tree, explain-tree, split-pane use `var(--text-color, #ccc)`,
  `--surface-bg-color`, `--primary-text-color` — not Wave tokens, so the fixed fallback always applied.
  Fixed per state above; replacing them in the components with real tokens would be a follow-up.
- **Not measurable on a static page (no state rendered, hover-only, or needs a service):** hover/focus
  colors (e.g. `.wc-calendar-more:hover`, `.pivot-sortable:hover`, `.help-drawer-trigger:hover`); wc-ai-bot,
  wc-hf-bot (download models), wc-map/wc-google-map/wc-google-address (tiles/API key), wc-live-designer
  (iframe), wc-chart/wc-chartjs/wc-ruler/wc-canvas-dot-highlight (text drawn on canvas), wc-prompt,
  wc-notify, wc-context-menu (on demand); help-drawer `.status-closed` (#9ca3af) and wc-notify (#666)
  fixed grays sit inside on-demand UI.
- **Text over photos** (wc-slideshow captions/arrows, wc-image overlay) has no single background to measure.
- Same 7 page errors on the reference page in both builds (pre-existing demo snippets).

## Verified

- `tests/component-contrast-test.py` — 60/60 components pass in all 648 states (text ≥ 4.5:1; icons,
  borders, chip × ≥ 3:1). On the previous build: 36/60.
- `tests/component-regression-test.py` — (1) every element's box identical in all 648 states (2,815
  elements); 106,401 element-state color changes, all inside an active fix rule, 0 elsewhere; (2)
  every untouched `views/*.html` page pixel-identical in 4 states.


---

# Wave CSS — 2026-11-01, part 5: readable status text classes

`.success-color`, `.danger-color`, `.warning-color`, `.info-color`, their `-light-color` versions and every
`hover:` / `focus:` / `focus-visible:` / `active:` variant set `color: var(--success-color)` — the FILL
color. As text that failed badly (e.g. "connected" 1.64:1 on royal light). They now render the readable
`.on-surface-*` value, ≥ 4.5:1 on `--surface-1`…`5`, `--card-bg-color` and `--container-bg-color` in all
54 themes × forced light / forced dark / follow the OS × OS light / OS dark × regular / `.crisp`.

**Changed**
- `.success|danger|warning|info-color` → `color-mix(in srgb, var(--X-color) var(--wc-on-surface-X-mix, 55%), var(--text-1, #111))`
- `.X-light-color` → the same from `var(--X-light-color)` with `--wc-on-surface-X-light-mix` (stays the lighter tint).
- The 32 `hover:`/`focus:`/`focus-visible:`/`active:` variants — via `scripts/generate-state-variants.js`, which
  **rewrites those variant rules in main.css on every build** (editing them in main.css alone is undone).
- `.on-surface-success|danger|warning|info` — the same per-theme share. 55% (the old value) is NOT readable
  everywhere (2.45:1 danger on lemon dark), so `scripts/gen-status-text.py` writes, per theme × mode × family,
  the largest share ≤ 55% that clears 4.6:1 — only where 55% fails (`@layer wc.colors`); elsewhere the class is
  byte-for-byte what it was.
- NEW tokens: `--wc-on-surface-{success,danger,warning,info}[-light]-mix` (lowest: danger/info 9%, success 14%).

**Unchanged:** `--success-color`/… and `-light-color` tokens, every `-bg-color` fill, `-border-color` border and
badge background — verified identical in all 648 states.

| Class | Worst before | Worst after |
|---|---|---|
| `.active:danger-color` | 1.4:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.active:danger-light-color` | 1.13:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.active:info-color` | 1.44:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.active:info-light-color` | 1.1:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.active:success-color` | 1.01:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.active:success-light-color` | 1.0:1 (theme-honey light/OS-light regular) | 4.6:1 |
| `.active:warning-color` | 1.05:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.active:warning-light-color` | 1.0:1 (theme-violet light/OS-light regular) | 4.6:1 |
| `.danger-color` | 1.4:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.danger-light-color` | 1.13:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.focus-visible:danger-color` | 1.4:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.focus-visible:danger-light-color` | 1.13:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.focus-visible:info-color` | 1.44:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.focus-visible:info-light-color` | 1.1:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.focus-visible:success-color` | 1.01:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.focus-visible:success-light-color` | 1.0:1 (theme-honey light/OS-light regular) | 4.6:1 |
| `.focus-visible:warning-color` | 1.05:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.focus-visible:warning-light-color` | 1.0:1 (theme-violet light/OS-light regular) | 4.6:1 |
| `.focus:danger-color` | 1.4:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.focus:danger-light-color` | 1.13:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.focus:info-color` | 1.44:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.focus:info-light-color` | 1.1:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.focus:success-color` | 1.01:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.focus:success-light-color` | 1.0:1 (theme-honey light/OS-light regular) | 4.6:1 |
| `.focus:warning-color` | 1.05:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.focus:warning-light-color` | 1.0:1 (theme-violet light/OS-light regular) | 4.6:1 |
| `.hover:danger-color` | 1.4:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.hover:danger-light-color` | 1.13:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.hover:info-color` | 1.44:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.hover:info-light-color` | 1.1:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.hover:success-color` | 1.01:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.hover:success-light-color` | 1.0:1 (theme-honey light/OS-light regular) | 4.6:1 |
| `.hover:warning-color` | 1.05:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.hover:warning-light-color` | 1.0:1 (theme-violet light/OS-light regular) | 4.6:1 |
| `.info-color` | 1.44:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.info-light-color` | 1.1:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.on-surface-danger` | 2.45:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.on-surface-info` | 2.63:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.on-surface-success` | 2.51:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.on-surface-warning` | 2.46:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.success-color` | 1.01:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.success-light-color` | 1.0:1 (theme-honey light/OS-light regular) | 4.6:1 |
| `.warning-color` | 1.05:1 (theme-designer auto/OS-light regular) | 4.6:1 |
| `.warning-light-color` | 1.0:1 (theme-violet light/OS-light regular) | 4.6:1 |

---

# Wave CSS — 2026-11-01, part 6: badge text ≥ 4.5:1 ("System" badge, 3.66:1 in designer light)

`.badge-success/-warning/-danger/-info` mixed 55% toward `--text-1` over a 15% tint of the state color —
2.42–2.62:1 at worst; the `hover:`/`focus:`/`focus-visible:`/`active:` badge variants used the raw fill color
(down to 1.01:1); `hover:badge-primary` etc. used `--primary-color` (1.77:1).

**Changed** (badge backgrounds and outlines untouched — verified identical in all 648 states)
- `.badge-X` text → `color-mix(in srgb, var(--X-color) var(--wc-badge-X-mix, 55%), var(--wc-badge-X-ink, var(--text-1, #111)))`.
  `scripts/gen-status-text.py` measures the share against the badge's own tint over every surface, only where
  55% fails. Where even pure `--text-1` can't reach 4.5:1 (warning on lemon dark's card: the tint lands at the
  black/white crossover — pure white is 4.56:1), it sets `--wc-badge-X-ink` to pure black/white (2 states).
- `hover:`/`focus:`/`focus-visible:`/`active:badge-*` (generated) → the same expressions; `…:badge-primary` →
  `var(--wc-on-primary, var(--primary-color))` (the part-3 change to these was being overwritten by the
  variant generator on every build — now in the generator).
- NEW tokens: `--wc-badge-{success,warning,danger,info}-mix`, `--wc-badge-{…}-ink`.

| Badge | Worst before | Worst after |
|---|---|---|
| `.active:badge-danger` | 1.35:1 (theme-designer auto/OS-light regular) | 4.57:1 |
| `.active:badge-info` | 1.43:1 (theme-lemon dark/OS-dark regular) | 4.56:1 |
| `.active:badge-muted` | 5.19:1 (theme-designer dark/OS-dark regular) | 5.19:1 |
| `.active:badge-primary` | 1.77:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.active:badge-success` | 1.03:1 (theme-designer auto/OS-light regular) | 4.54:1 |
| `.active:badge-warning` | 1.01:1 (theme-designer auto/OS-light regular) | 4.52:1 |
| `.badge` | 6.24:1 (theme-designer auto/OS-light regular) | 6.24:1 |
| `.badge-danger` | 2.42:1 (theme-lemon dark/OS-dark regular) | 4.57:1 |
| `.badge-info` | 2.62:1 (theme-lemon dark/OS-dark regular) | 4.56:1 |
| `.badge-muted` | 5.19:1 (theme-designer dark/OS-dark regular) | 5.19:1 |
| `.badge-primary` | 4.6:1 (theme-designer-gray dark/OS-dark regular) | 4.6:1 |
| `.badge-success` | 2.62:1 (theme-designer auto/OS-light regular) | 4.54:1 |
| `.badge-warning` | 2.59:1 (theme-designer auto/OS-light regular) | 4.52:1 |
| `.focus-visible:badge-danger` | 1.35:1 (theme-designer auto/OS-light regular) | 4.57:1 |
| `.focus-visible:badge-info` | 1.43:1 (theme-lemon dark/OS-dark regular) | 4.56:1 |
| `.focus-visible:badge-muted` | 5.19:1 (theme-designer dark/OS-dark regular) | 5.19:1 |
| `.focus-visible:badge-primary` | 1.77:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.focus-visible:badge-success` | 1.03:1 (theme-designer auto/OS-light regular) | 4.54:1 |
| `.focus-visible:badge-warning` | 1.01:1 (theme-designer auto/OS-light regular) | 4.52:1 |
| `.focus:badge-danger` | 1.35:1 (theme-designer auto/OS-light regular) | 4.57:1 |
| `.focus:badge-info` | 1.43:1 (theme-lemon dark/OS-dark regular) | 4.56:1 |
| `.focus:badge-muted` | 5.19:1 (theme-designer dark/OS-dark regular) | 5.19:1 |
| `.focus:badge-primary` | 1.77:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.focus:badge-success` | 1.03:1 (theme-designer auto/OS-light regular) | 4.54:1 |
| `.focus:badge-warning` | 1.01:1 (theme-designer auto/OS-light regular) | 4.52:1 |
| `.hover:badge-danger` | 1.35:1 (theme-designer auto/OS-light regular) | 4.57:1 |
| `.hover:badge-info` | 1.43:1 (theme-lemon dark/OS-dark regular) | 4.56:1 |
| `.hover:badge-muted` | 5.19:1 (theme-designer dark/OS-dark regular) | 5.19:1 |
| `.hover:badge-primary` | 1.77:1 (theme-lemon dark/OS-dark regular) | 4.6:1 |
| `.hover:badge-success` | 1.03:1 (theme-designer auto/OS-light regular) | 4.54:1 |
| `.hover:badge-warning` | 1.01:1 (theme-designer auto/OS-light regular) | 4.52:1 |

**Verified** (`tests/status-text-test.py`, 77/77): every status text class, `.on-surface-*` and badge class —
with the real `:hover`/`:focus`/`:focus-visible`/`:active` forced through DevTools — ≥ 4.5:1 in all 648 states;
each base class equals its `.on-surface-*` value; tokens, fills, borders, badge backgrounds/outlines identical
to the previous build. `tests/component-contrast-test.py` still 60/60. Pixel screenshots: see below.

**Pixel proof (parts 4–6)** — `tests/component-regression-test.py --pages-only` on every `views/*.html` page,
4 states each, previous build vs new:
- Part 4 (component fixes): pages with a fixed component are covered element-by-element instead (2,815 elements ×
  648 states: identical boxes; every color change inside an active fix rule).
- Parts 5–6 (status text + badges): 8 pages use those classes; of the 96 that don't, 93 are pixel-identical and
  3 are non-deterministic in BOTH builds (chartjs animation, dependency-example, test-google-map-debug — Google API
  race), proven by rendering each build twice. busy-indicator / vin-decoder differences were timing flakes
  (identical on re-render).

**Test fixes** — `on-primary-contrast-test.py` disables transitions (`.btn` has `transition: all .2s`; the hue
sweep could measure a half-transitioned label — flaky, not a CSS change); `crisp-contrast-test.py` skips text
drawn over an `<img>` (components added to the reference page in part 4). Contrast gate: PASS (regular + crisp).
