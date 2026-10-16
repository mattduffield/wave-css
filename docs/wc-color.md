# WC-Color Web Component

A form-associated color picker field. It shows a color swatch plus the text value. By default clicking the swatch opens the native color picker (hex), and optional preset swatches allow one-click selection. With `alpha` (or `picker="custom"`) it opens Wave's own picker instead, adding transparency, labelled swatch groups, a "no colour" option, an eyedropper and CMYK entry. It submits a normal named form value in the chosen `format`, so the standard save path stores it under `name` with no special handling.

> Related: pairs with [wc-form](./wc-form.md) and the other form fields such as [wc-input](./wc-input.md).

## Features

- Native hex color picker behind a themed swatch (default; unchanged)
- Optional preset swatches for one-click selection, plus **labelled swatch groups** (Document colours, Brand kit, Recent)
- Stores/submits in `hex`, `rgb`, or `hsl` format, with **transparency** as `#rrggbbaa` / `rgba()` / `hsla()` when `alpha` is set
- Parses incoming color strings: `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()`/`rgba()`, `hsl()`/`hsla()` (comma or space syntax)
- **Custom picker** popover: saturation/value square, hue slider, transparency slider, hex + R/G/B (or H/S/L) fields, screen **eyedropper** (where the `EyeDropper` API exists)
- **"None"** swatch (`allow-none`) for "no fill" and "no border"
- **CMYK** tab (`cmyk`) reporting the exact entered print values
- Live **`wccolorinput`** while dragging (preview without filling undo history) plus a committed **`wccolorchange`**
- `allow-custom="false"` locks the field to presets only
- Form-associated (FACE): submits under the host `name`
- htmx-safe (re-seeds on value change, initialises on swap, removes its popover on disconnect)

## Basic Usage

```html
<wc-form>
  <wc-color
    name="label_color"
    value="#3b82f6"
    lbl-label="Label Color"
    format="hex">
  </wc-color>
</wc-form>
```

```html
<!-- Publisher-style fill: transparency, document swatches, None, recent colours, CMYK -->
<wc-color name="fill" lbl-label="Fill" alpha allow-none cmyk recent-key="ps-recent-colors"
  value="#1a2a4acc"
  swatch-groups='[{"label":"Document colours","colors":["#1a2a4a","#c9a84c","#e8d5a3"]},
                  {"label":"Brand kit","colors":["#2c4a7c","#c9a84c80"]}]'>
</wc-color>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Form field name (required); submitted via FACE |
| `value` | "" | Initial color in any supported syntax; parsed to hex (+ alpha) to seed |
| `lbl-label` | "" | Field label text |
| `format` | `hex` | Stored/submitted format: `hex`, `rgb`, or `hsl` |
| `swatches` | [] | JSON array of preset colors, e.g. `'["#ef4444","#22c55e"]'`. Rendered as one unlabelled row |
| `swatch-groups` | [] | JSON array of `{ label, colors: [...] }`, rendered as labelled rows after `swatches` |
| `recent-key` | — | localStorage key; keeps a **Recent** row of the last 8 committed colors |
| `allow-none` | — | Adds a "no colour" swatch (a light square with a red diagonal) that sets the value to `""` |
| `alpha` | — | Transparency slider (0–100%); values become `#rrggbbaa` / `rgba()` / `hsla()`. Implies the custom picker |
| `picker` | `native` | `native` or `custom`. `custom` uses Wave's popover even without `alpha` |
| `cmyk` | — | Adds a CMYK tab (C, M, Y, K 0–100) to the custom popover |
| `allow-custom` | `true` | When `false`, only presets can be chosen (no picker) |
| `required` | — | Marks the field required for form validity |
| `disabled` | — | Disables the field |

The defaults keep the original behaviour: without `alpha`, `picker="custom"`, `allow-none`, `swatch-groups` or `cmyk`, it is the same native-picker field as before.

## Value formats

| `format` | without `alpha` | with `alpha` |
|----------|-----------------|--------------|
| `hex` | `#1a2a4a` | `#1a2a4acc` (always 8 digits) |
| `rgb` | `rgb(26, 42, 74)` | `rgba(26, 42, 74, 0.8)` |
| `hsl` | `hsl(218, 48%, 20%)` | `hsla(218, 48%, 20%, 0.8)` |

None (`allow-none`) submits an empty string. Without `alpha`, an incoming 8-digit value keeps its color and drops the transparency (the previous behaviour).

## Properties

| Member | Description |
|--------|-------------|
| `value` | Get/set the value (any supported syntax) |
| `alpha` | Current transparency 0–1 |
| `format`, `hasAlpha`, `usesCustomPicker`, `allowCustom` | Resolved settings |

## Events

| Event | Legacy alias | detail | When |
|-------|--------------|--------|------|
| `wccolorchange` | `wc-color:change` | `{ value, alpha, cmyk? }` | Committed change: preset/None click, drag release, field Enter/blur, eyedropper pick, CMYK entry. Native mode keeps its original timing (it fires as the native picker moves) |
| `wccolorinput` | `wc-color:input` | `{ value, alpha, cmyk? }` | Continuous while dragging or typing in the custom popover (and on native input). Use this for live preview; record undo history on `wccolorchange` |

`alpha` is 0–1 (0 for None). `cmyk` is `[c, m, y, k]` (0–100) **only** when the user entered CMYK, so the host can store the exact print values alongside the RGB value.

Both events bubble and are composed.

## Custom picker popover

- **Saturation/value square**: drag or click; ←/→/↑/↓ (Shift = ×10)
- **Hue** and **transparency** sliders: drag or click; arrow keys (Shift = ×10)
- **Hex** field (accepts 3/4/6/8 digits; a 6-digit entry keeps the current transparency), **R/G/B** fields, and an **RGB/HSL** toggle. Typing streams `wccolorinput`; Enter or blur commits
- **Eyedropper**: shown only where `window.EyeDropper` exists (Chromium); hidden elsewhere
- **CMYK tab** (`cmyk`): 0–100 fields
- Swatch rows (including None and Recent) also appear at the bottom of the popover
- Esc or an outside click closes it; the popover is attached to `<body>` and carries the host's theme classes

## CMYK

CMYK ↔ RGB uses the naive device formula (`r = 255 × (1 − c) × (1 − k)`, …). It is fine for entry and a rough on-screen preview, but it is **not colour-managed**: no ICC profiles and no rendering intent, so screen colors won't match a press proof. Store `detail.cmyk` from `wccolorchange` for print output instead of converting the RGB value back.

## Examples

```html
<!-- Hex with presets, seeded value -->
<wc-color
  name="brand_color"
  value="#22c55e"
  lbl-label="Brand Color"
  swatches='["#ef4444","#f59e0b","#22c55e","#3b82f6","#a855f7"]'
  required>
</wc-color>
```

```html
<!-- Store as rgb() instead of hex -->
<wc-color name="bg" lbl-label="Background" format="rgb" value="rgb(59, 130, 246)"></wc-color>
```

```html
<!-- Presets only (no custom picking) -->
<wc-color
  name="status_color"
  lbl-label="Status Color"
  allow-custom="false"
  swatches='["#ef4444","#f59e0b","#22c55e"]'>
</wc-color>
```

```html
<!-- Border colour with transparency in rgba(), plus "no border" -->
<wc-color name="border" lbl-label="Border" alpha allow-none format="rgb" value="rgba(201, 168, 76, 0.5)"></wc-color>
```

```js
// Live preview on input, commit (undo step) on change
fill.addEventListener('wccolorinput',  (e) => canvas.previewFill(e.detail.value));
fill.addEventListener('wccolorchange', (e) => canvas.commitFill(e.detail.value, e.detail.cmyk));
```

## Notes

- The picked value is always converted to `format`; any incoming color string is parsed back to hex + alpha to seed the swatch.
- A preset without its own transparency keeps the current transparency (fill opacity is separate from fill colour, as in Publisher); a preset like `#c9a84c80` applies its own.
- Translucent colors are drawn over a checkerboard (swatch, presets and popover preview).
- The saturation/value square, hue and transparency tracks use literal black/white and spectrum gradients: those are colour-space data, not UI chrome. All chrome uses theme tokens.
- The host element is `display: contents`; internal styles live in `@layer wc.usage` (popover input rules are unlayered because the `wc.ui` layer styles bare inputs).
- Extends `WcBaseFormComponent`. The native input is nulled out of the base `formElement`, so the component converts and calls `setFormValue` under the host `name` itself.
- Demo: `views/color.html`. Tests: `tests/color-test.py`.
