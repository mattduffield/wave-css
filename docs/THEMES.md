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

## 5. `.crisp` — the accent family (opt-in)

`.crisp` mode adds a hue- and theme-aware **accent** set so accent bubbles/pills/callouts need zero
hardcoded colors. It's defined in both `.crisp` light and dark blocks and sets
`--primary-bg-color: var(--accent)`.

| Token | Meaning |
|---|---|
| `--accent` | the vivid brand hue |
| `--accent-hover` | hover shade of the accent |
| `--on-accent` | legible foreground on `--accent-fill-bg` |
| `--accent-fill-bg` | the accent fill (light themes deepen it ~18% so `--on-accent` stays AA) |
| `--accent-soft` / `--on-accent-soft` | a subtle offset accent fill + its foreground |
| `--accent-border` | accent-derived border/ring that reads on a card |

Utilities: `.accent-fill`, `.accent-soft-fill`, `.accent-border-color`. All pairings are verified
WCAG AA across all hues in light & dark.

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

---

## 10. Using themes in your components (rules of thumb)

- **Never hardcode hex.** Reference role tokens: `background: var(--surface-2); color: var(--text-1);`.
  They resolve correctly in every theme and mode automatically.
- **On the accent fill**, use `--wc-on-primary` for text (not `--primary-color`, which flips and can
  fail contrast). For fills/borders/icons use `--primary-bg-color` / semantic `--*-color`.
- **Mode-specific tweaks** go in a `.dark <selector>` (ancestor) rule — `.dark` is on `<html>`.
- **Muted/neutral safety:** because color comes from `--chroma-mult`, your component is automatically
  grayscale in neutral themes — don't assume saturation.
- **No `light-dark()`.** Wave doesn't use the CSS `light-dark()` function; mode is a class, so pick
  colors via `.light`/`.dark` selectors or tokens, not `light-dark(a, b)`. (`light-dark()` resolves
  only from the OS/`color-scheme` and can't express Wave's user-chosen, nestable modes.)

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
