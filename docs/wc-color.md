# WC-Color Web Component

A form-associated color picker field. It shows a color swatch plus the text value; clicking the swatch opens the native color picker (hex), and optional preset swatches allow one-click selection. It submits a normal named form value in the chosen `format`, so the standard save path stores it under `name` with no special handling.

> Related: pairs with [wc-form](./wc-form.md) and the other form fields such as [wc-input](./wc-input.md).

## Features

- Native hex color picker behind a themed swatch
- Optional preset swatches for one-click selection
- Stores/submits in `hex`, `rgb`, or `hsl` format
- Parses incoming color strings (hex / `rgb()` / `hsl()`) back to hex to seed the swatch
- `allow-custom="false"` locks the field to presets only
- Form-associated (FACE) — submits under the host `name`
- htmx-safe (re-seeds on value change, initializes on swap)

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

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Form field name (required); submitted via FACE |
| `value` | "" | Initial color; accepts hex, `rgb()`, or `hsl()` — parsed to hex to seed |
| `lbl-label` | "" | Field label text |
| `format` | `hex` | Stored/submitted format: `hex`, `rgb`, or `hsl` |
| `swatches` | [] | JSON array of preset colors, e.g. `'["#ef4444","#22c55e"]'` |
| `allow-custom` | `true` | When `false`, only presets can be chosen (native picker disabled) |
| `required` | — | Marks the field required for form validity |
| `disabled` | — | Disables the field |

## Events

| Event | detail | When |
|-------|--------|------|
| `wccolorchange` (legacy alias `wc-color:change`) | `{ value }` | On change (native pick or preset click); bubbles, composed |

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

## Notes

- The picked value is always converted to `format`; any incoming color string is parsed back to hex to seed the swatch.
- Alpha is not supported (native `<input type="color">` limitation).
- The host element is `display: contents`; internal styles live in `@layer wc.usage`.
- Extends `WcBaseFormComponent` — the native input is nulled out of the base `formElement` so the component converts and calls `setFormValue` under the host `name` itself.
