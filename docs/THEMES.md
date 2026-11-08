# Wave CSS Theming — How It Works

Wave CSS themes are **generated in OKLCH from two knobs plus a mode**, not hand-authored per
color. Understand these four things and you understand the whole system:

| Knob | What it does | Default |
|---|---|---|
| **`--hue`** | The color wheel angle (0–360) the whole palette is built around. | `0` |
| **`--chroma-mult`** | Saturation multiplier baked into the swatch ramp. `1` = full color, `0` = grayscale, `0.15` = muted tint. | `1` |
| **light / dark mode** | Which surface/text mapping applies (`.light` / `.dark` on `<html>`). | follows `prefers-color-scheme` until set |
| **`.crisp` (optional)** | Opt-in "accent family" for vivid, AA-safe accent fills/pills/bubbles. | off |

A theme like `theme-ocean` is essentially just **"`--hue: 230`"**. Everything else — the swatch
ramp, surfaces, text, borders, primary color — is computed from hue + chroma-mult + mode.

> **Related:** [`COLORS.md`](./COLORS.md) — the full token reference (swatches, surfaces, text,
> semantic, accent family). [`wc-theme.md`](./wc-theme.md) / [`wc-theme-selector.md`](./wc-theme-selector.md)
> — the components that apply/switch themes.

---

## 1. Applying a theme

A theme is expressed as **classes on `<html>`**: a `theme-<name>` class, a `light` **or** `dark`
class, and optionally `crisp`.

```html
<html class="theme-ocean dark">          <!-- ocean hue, dark mode -->
<html class="theme-emerald light crisp"> <!-- emerald hue, light mode, crisp accents -->
```

Three ways to set them:

1. **`wc-theme`** — declarative + persistent. Applies the theme/mode to `<html>` and saves to
   `localStorage`. Reads the `theme` / `mode` attributes, else restores from storage.
   ```html
   <wc-theme theme="theme-ocean" mode="dark"></wc-theme>
   ```
   - localStorage keys: **`theme`** (e.g. `theme-ocean`) and **`darkMode`** (`"true"`/`"false"`).
   - With no attribute + nothing stored, it falls back to **`royal`**.
2. **`wc-theme-selector`** — a swatch-grid UI (all built-in themes) with a light/dark toggle;
   persists the same way. Attributes: `theme`, `mode`, `extra-themes`.
   ```html
   <wc-theme-selector theme="theme-ocean" mode="light"></wc-theme-selector>
   ```
3. **Manually** — just put the classes on `<html>` (SSR, tests, static pages).

> Wave controls mode with an explicit `.light`/`.dark` **class**, *not* the CSS `light-dark()`
> function — so a user can pick a mode independent of the OS, mix it with 50+ hue themes, and nest
> light/dark regions on one page. See §10.

---

## 2. The two axes: hue and chroma

Every `.theme-*` block does two things: set `--hue`, and re-assert `--chroma-mult`.

```css
.theme-ocean  { --hue: 230; --chroma-mult: 1; }   /* blue, full saturation */
.theme-amber  { --hue: 55;  --chroma-mult: 1; }   /* amber */
.theme-gray   { --hue: 250; --chroma-mult: 0; }   /* neutral: grayscale ramp */
```

- **`--hue`** picks the color family. ~52 built-in themes each assign a hue (red≈0–20, amber≈55,
  green≈120–140, cyan/blue≈200–250, purple≈290–320, magenta≈340).
- **`--chroma-mult`** scales saturation. `1` is full; **`0` makes a neutral/gray theme**; a small
  value (e.g. `0.15`) makes a muted tint — a *second axis* beyond hue, so grays are possible.

> **Gotcha — chroma inheritance.** `--chroma-mult` inherits. If a neutral theme sets it to `0` on
> `<html>`, that would bleed into nested chromatic theme classes (e.g. the colored swatch buttons in
> `wc-theme-selector`). So **every chromatic `.theme-*` block re-asserts `--chroma-mult: 1`**, and
> neutral themes set `0` again in their own (later) block.

---

## 3. The swatch ramp (the generated palette)

From hue + chroma-mult, Wave generates a 13-step ramp `--swatch-1 … --swatch-13`, light → dark, in
OKLCH:

```css
--swatch-1:  oklch(99% calc(0.05 * var(--chroma-mult, 1)) var(--hue));  /* lightest */
--swatch-5:  oklch(80% calc(0.20 * var(--chroma-mult, 1)) var(--hue));
--swatch-7:  oklch(67% calc(0.31 * var(--chroma-mult, 1)) var(--hue));  /* vivid accent */
--swatch-8:  oklch(50% calc(0.27 * var(--chroma-mult, 1)) var(--hue));
--swatch-12: oklch(10% calc(0.19 * var(--chroma-mult, 1)) var(--hue));  /* darkest */
```

Lightness is fixed per step; **chroma is `baseC * --chroma-mult`** (so `--chroma-mult: 0` zeros
chroma → pure gray) and **hue is `var(--hue)`**. Because the ramp is shared, a new theme only needs
to change `--hue` (yellow/earth tones are the exception — see §8).

---

## 4. Light vs dark (surfaces & text)

The swatch ramp is hue color; the **usable tokens** (surfaces, text, borders, component/card/
container backgrounds, primary color) are mapped **from swatches per mode**:

- `@layer wc.theme-light` maps swatches → light-mode surface/text tokens.
- `@layer wc.theme-dark` maps swatches → dark-mode tokens (surfaces get darker, text lighter).
- `.light` / `.dark` on `<html>` select which mapping wins.
- `@layer wc.prefers-light` / `wc.prefers-dark` (`@media (prefers-color-scheme: …)`) auto-nudge
  semantic colors one shade for readability when no explicit mode is set.

So a component **never** cares about the raw swatches; it reads **role tokens** like `--surface-2`,
`--text-1`, `--primary-bg-color`, which resolve correctly in both modes automatically.

The token families you use in components (full list in [`COLORS.md`](./COLORS.md)):

- **Surfaces:** `--surface-1 … --surface-13` (page → elevated).
- **Text:** `--text-1 … --text-13` (`--text-1` = strongest).
- **Component/card/container:** `--component-bg-color`, `--card-bg-color`, `--container-bg-color`, `*-border-color`, `*-color`.
- **Primary:** `--primary-bg-color` (the accent fill), `--primary-color` (its on-color), `--primary-hover-color`.
- **Secondary:** `--secondary-bg-color`.
- **Semantic (fixed hex in `:root`, mode-nudged):** `--success/danger/warning/info(-light)-color`.

---

## 4b. Contrast standard (regular themes too)

Every theme, light and dark (forced or OS-following), with or without `.crisp`:

| What | Minimum |
|---|---|
| `--text-1`…`--text-6` on every text surface | 4.5:1 |
| `--text-7`…`--text-9` (icons, separators, disabled) | 3:1 |
| Form outlines (inputs, checkboxes, radios, toggles) | 3:1 |
| Text on colored fills (buttons, primary badge, accent) | 4.5:1 |
| Disabled labels | 3:1 |

Regular themes build text from their own swatch ramp, so the muted levels used to land on the same hue
and lightness as the panels (light `--text-6` failed in every theme). Now a generated block
(`scripts/gen-text-contrast.py`, in `@layer wc.colors`) clamps each level per theme and mode — same hue and
tint, only darker (light) or lighter (dark) where needed. It also sets form outlines to `--text-9`, makes the
status colors follow the page's mode, and lightens the light-mode card surface of coffee, sienna, chocolate,
designer and designer-blue (too dark for any dark text). Text on fills uses `--wc-on-primary` and other
black/white picks from the fill's luminance. **After changing a theme's swatches, re-run the generator.**
Gate: `tests/text-contrast-test.py`.

---

## 5. `.crisp` — neutral surfaces, the theme as the accent (complete mode, Nov 2026)

Without `.crisp`, a theme tints the **whole page** with its hue (royal light = cyan surfaces, royal dark
= navy). With `.crisp`, backgrounds become **near-neutral gray** (light) or **charcoal** (dark) with a
faint cast of the theme's hue, and the theme's color moves to the **accent**: buttons, primary badges,
toggles, focus rings, the selected row, accent callouts. Every theme works; the theme selector and the
Light/Dark toggle work unchanged. Use it once, on `<html>`: `<html class="theme-royal light crisp">`.

**Crisp owns every color it shows** (since Nov 2026 — before, it replaced only the surfaces and accent
and borrowed the theme's text, which follows the OS, so a dark OS could put near-white text on crisp's
light grays, 1:1):

| Group | Tokens | Guarantee (every theme, light + dark) |
|---|---|---|
| Surfaces | `--surface-1`…`-13`, card / container / component backgrounds | neutral, hue-tinted |
| Text ramp | `--text-1`…`--text-6` | ≥ 4.5:1 on every text surface (`--text-1`–`3` also on `--surface-4`) |
| | `--text-7`…`--text-9` | ≥ 3:1 (icons, separators, disabled) |
| | `--text-10`…`--text-13` | fade toward the page (decorative) |
| Component text | `--card-color`, `--container-color`, `--component-color`, `--component-placeholder-color` | ≥ 4.5:1 |
| Form outlines | `--component-border-color` (inputs, checkboxes, radios, toggles) | ≥ 3:1 on the field and the page (WCAG 1.4.11) |
| Accent | `--accent`, `--accent-hover`, `--accent-fill-bg`/`--on-accent`, `--accent-soft`/`--on-accent-soft`, `--accent-border` | accent ≥ 3:1 on the page; text on it ≥ 4.5:1 |
| Text on fills | `--primary-color` (on `--primary-bg-color`), `--button-hover-color`, labels of accordion headers / dropdown triggers | **black or white picked from the fill's own luminance** → ≥ 4.5:1 on any hue |
| Buttons | `--button-color` (outline labels, menu links), disabled set | ≥ 4.5:1 on the page; disabled ≥ 3:1 and neutral |
| Status colors | `--success/-danger/-warning/-info-color` (+ `-light-color`) | follow crisp's mode (deeper set in light, bright set in dark) |

**Mode:** `.dark` (on `<html>`, an ancestor or the element) → dark crisp; `.light` → light crisp;
**neither → the OS**. Surfaces and text come from the same block, so they can't disagree. A nested
`.crisp` takes the page's mode.

Utilities: `.accent-fill`, `.accent-soft-fill`, `.accent-border-color`.
Gate: `tests/crisp-contrast-test.py` (79 token pairs × every theme × light/dark/OS-following ×
OS light/dark × on `<html>`/nested, plus every visible text on `views/visual-reference.html` measured
against what's painted behind it).

---

## 6. `--wc-on-primary` — auto-contrast text on the accent

Text placed on `--primary-bg-color` (table headers, primary cells, FX board pads, active pager
buttons) uses **`--wc-on-primary`**, which picks **black or white by the accent's WCAG luminance**
(crossover Y≈0.179) so it stays AA in every theme, light + dark:

```css
.wc-table thead { background: var(--primary-bg-color); color: var(--wc-on-primary); }
```

Implementation: an `@supports` block computes it with relative-color syntax + `pow()` (clamped
channels to survive out-of-gamut accents); a `:where(.dark)` `#000` fallback + `--primary-color`
cover browsers without that math. The same mechanism backs bare `.btn` auto-contrast
(`--button-color`). See `src/css/main.css` (search `--wc-on-primary`).

**Don't trust the formula alone (Nov 2026).** Some Chrome versions evaluate it wrongly (black on royal's
crisp accent, 4.27:1). Text-on-primary elements therefore read, in order:

```css
.badge-primary {
  background: var(--accent-fill-bg, var(--primary-bg-color));
  color: var(--on-accent, var(--wc-on-primary-static, var(--wc-on-primary, var(--primary-color))));
}
```

- **`.crisp`:** `--accent-fill-bg` + `--on-accent`, the pair `.btn-primary` uses, checked for every hue with no
  formula, so it also follows a tenant `--hue`. The crisp-light fill is about 18% deeper than the raw accent. The raw
  accent at L54% can't carry one text color on every hue: white fails teal, black fails royal.
- **Regular themes:** `--wc-on-primary-static` (`#000`/`#fff`, the formula's own answer) is written by
  `scripts/gen-status-text.py` **only for themes whose fill doesn't move with `--hue`**. Those are the 14 hand-tuned
  ones: earth tones, designer*, neutrals, yellows, high-contrast. A static pick for one hue would be wrong for an
  app's re-hued theme. Everywhere else the formula stays, unchanged.
- Applies to `.badge-primary` (+ state variants), `.accent-fill`, wc-table header / row number / primary row /
  pager, fx-board pads and zones, the font-picker selected chip, wc-select chips + highlighted option, the active
  wc-wizard step and wc-pivot zone chips. Gate: `tests/on-primary-static-test.py`, which covers every theme × mode ×
  crisp, a tenant hue sweep, and `--wc-on-primary` forced to black. Demo: `views/on-primary.html`.

---

## 7. Neutral themes

`theme-gray` (pure), `theme-silver` (cool), `theme-charcoal` (warm) achieve gray **surfaces** via
`--chroma-mult: 0`, but keep a **colored accent** (they override `--primary-bg-color`) so CTAs still
pop. The colored-accent override lives **last** in `@layer wc.themes` so it wins over the light/dark
surface mappings. They flip with light/dark (whitewashed ↔ charcoal).

---

## 8. Adding a new theme

For a standard hue theme, you only need a new `--hue`:

```css
@layer wc.themes {
  .theme-marine { --hue: 210; --chroma-mult: 1; }   /* re-assert chroma-mult! */
}
```

Then register it in `wc-theme-selector`'s theme list (or pass it via `extra-themes`) so it appears
in the picker.

Exceptions that need **hand-tuned explicit swatch ramps** (the generator's vivid ramp can't reach
these): **yellows** (`gold`, `lemon`) and **earth tones** (`sienna`, `chocolate`, `coffee`, `tan`)
override `--swatch-*` directly with hand-picked low-lightness/muted values.

---

## 9. Cascade layers (why order matters)

Wave declares an explicit `@layer` order up front:

```
wc.vars, wc.themes, wc.prefers-light, wc.prefers-dark, wc.theme-light, wc.theme-dark,
wc.colors, wc.classes, wc.utility, wc.external, wc.usage, wc.tables, wc.palette, wc.ui,
wc.responsive, wc.main, wc.hover, wc.state, wc.selected
```

Consequences:
- **Later layers win regardless of specificity.** Theme/surface layers come **before** component
  layers, so components can freely override token *usage* without fighting the theme.
- **Unlayered rules beat every layer.** Components that inject CSS via `loadStyle()` are unlayered
  by default (or scope into `@layer wc.usage`), so their styles reliably apply.
- Per-mode overrides are written as explicit `.light` / `.dark` (ancestor) rules within the theme
  layers.
- **App CSS:** unlayered page CSS (e.g. an inline critical snippet copying `.flex` / `.col` / `.hidden`)
  beats **every** Wave class, `md:*` included — `class="hidden md:flex"` then never shows. The original
  `dist/wave-critical.min.css` is unlayered (unchanged); inline the opt-in
  `dist/wave-critical-layered.min.css` instead, or wrap copies in `@layer wc.utility { }`.
- **`[hidden]`** is `display: none` in the last layer (`wc.selected`) — it beats Wave's display classes
  (`<div class="col" hidden>` stays hidden) but not inline styles or unlayered app CSS.

---

## 10. Using themes in your components (rules of thumb)

- **Never hardcode hex.** Reference role tokens: `background: var(--surface-2); color: var(--text-1);`.
  They resolve correctly in every theme and mode automatically.
- **On the accent fill**, use `background: var(--accent-fill-bg, var(--primary-bg-color))` with
  `color: var(--on-accent, var(--wc-on-primary-static, var(--wc-on-primary)))` (section 6), not `--primary-color`, which
  flips and can fail contrast. For borders/icons use `--primary-bg-color` / semantic `--*-color`.
- **Mode-specific tweaks** go in a `.dark <selector>` (ancestor) rule — `.dark` is on `<html>`.
- **Muted/neutral safety:** because color comes from `--chroma-mult`, your component is automatically
  grayscale in neutral themes — don't assume saturation.
- **No `light-dark()`.** Wave doesn't use the CSS `light-dark()` function; mode is a class, so pick
  colors via `.light`/`.dark` selectors or tokens, not `light-dark(a, b)`. (`light-dark()` resolves
  only from the OS/`color-scheme` and can't express Wave's user-chosen, nestable modes.)

- **One `theme-*` per page**, on `<html>` or `<wc-theme>`. Never put a `theme-*` on an element to tint
  it: forced modes match only `.light.theme-x` / `.dark.theme-x` on the same element, so a nested theme
  follows the OS (forced-light page + dark OS → near-white text inside).
- **Put `.crisp` once, on `<html>`**, with the theme (and `.light`/`.dark`, which wave-theme-init.js adds
  from `localStorage.darkMode`). Crisp is a page mode, not a way to tint one panel.
- **Tint a block with tokens:** status → `.success/.warning/.danger/.info-soft-fill`; neutral →
  `.accent-soft-fill`. Both are AA in every theme and mode with no theme class on the element.
- **Categorical colors** (markers, legends, series): indigo, lime, fuchsia, emerald, pink, violet,
  green, slate — never the status hues. Shades in `themes.categoricalColors` (knowledge base) / CLAUDE.md.
  Demo: `views/theming-utilities.html`.

---

## Quick reference

```
Apply:     <html class="theme-<name> light|dark [crisp]">  (or <wc-theme> / <wc-theme-selector>)
Two knobs: --hue (0–360)   --chroma-mult (1 full · 0 gray · 0.15 muted)
Palette:   --swatch-1..13  = oklch(fixed-L, baseC*chroma-mult, hue)
Use:       --surface-*, --text-*, --primary-bg-color, --wc-on-primary, --success/danger/warning/info-color
Accents:   add `crisp` → --accent, --on-accent, --accent-fill-bg, --accent-soft, --accent-border
Persist:   localStorage "theme" + "darkMode"  (managed by wc-theme / wc-theme-selector)
```
