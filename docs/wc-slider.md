# WC-Slider Web Component

A form-associated bounded numeric slider. It renders a styled range track and thumb with a value readout, optional unit and tick marks, and an optional dual-thumb range mode. It submits a normal named number value, so the standard save path stores it under `name` with no special handling.

> Related: pairs with [wc-form](./wc-form.md); for an unbounded number use [wc-input](./wc-input.md) `type="number"`.

## Features

- Styled native `<input type="range">` honoring `min`/`max`/`step`
- Optional value readout (`show-value`) with an optional `unit`
- Optional tick `marks` (JSON array of numbers)
- Drag plus keyboard (arrows = step, Home/End = min/max)
- Dual-thumb `range` mode (thumbs clamped so they can't cross), submitting `"min,max"`
- Form-associated (FACE) — submits under the host `name`
- htmx-safe

## Basic Usage

```html
<wc-form>
  <wc-slider name="discount_pct" value="15" lbl-label="Discount %"
             min="0" max="100" step="5" show-value unit="%"></wc-slider>
</wc-form>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Form field name (required); submitted via FACE |
| `value` | "" | Initial value; a number for single, `"min,max"` (or a JSON array `[20,80]` / `{min,max}`) for range |
| `lbl-label` | "" | Field label text |
| `min` | 0 | Minimum value |
| `max` | 100 | Maximum value |
| `step` | 1 | Step increment |
| `show-value` | — | Show the numeric readout |
| `unit` | "" | Unit appended to the readout (e.g. `%`, `$`) |
| `marks` | — | JSON array of numbers rendered as ticks/labels, e.g. `'[0,25,50,75,100]'` |
| `range` | — | Dual-thumb range mode; submits `"min,max"` |
| `required` | — | Blocks an unseeded + untouched slider (submitted value stays empty until set) |
| `disabled` | — | Disables the field |

## Events

| Event | detail | When |
|-------|--------|------|
| `wcsliderchange` (legacy alias `wc-slider:change`) | `{ value }` | On commit (change); bubbles, composed |
| `wcsliderinput` (legacy alias `wc-slider:input`) | `{ value }` | While dragging (input); bubbles, composed |

## Examples

```html
<!-- Single slider with unit, marks, and step snapping -->
<wc-slider name="volume" value="40" lbl-label="Volume"
           min="0" max="100" step="10" show-value unit="%"
           marks='[0,25,50,75,100]' required></wc-slider>
```

```html
<!-- Dual-thumb range submitting "20,80" -->
<wc-slider name="price_band" range value="20,80"
           min="0" max="200" step="10" unit="$" show-value></wc-slider>
```

## Notes

- Value encoding: single → the number as a string (`"15"`); range → `"min,max"` (`"20,80"`).
- `required` intentionally keeps the submitted value empty until a `value` is provided or the user interacts, so a never-set required slider is invalid and the server isn't handed a spurious `min`.
- The host element is `display: contents`; internal styles live in `@layer wc.usage`.
- Extends `WcBaseFormComponent` — calls `setFormValue` under the host `name`.
