# WC-VIN-Listener Web Component

`wc-vin-listener` wraps a group of form fields (and/or links) that should **auto-populate when a
matching [`wc-vin-decoder`](./wc-vin-decoder.md) decodes a VIN**. When a decode fires for the same
`vin-group`, the listener fills its child controls (by `name`) with the decoded values and can
create indexed array fields and update templated anchor `href`s.

> Related: [`wc-vin-decoder`](./wc-vin-decoder.md) (the source of the decoded data), [`wc-input`](./wc-input.md).

## Features

- Fills child form controls (`wc-input`/`wc-select`, matched by `name`) from decoded VIN data when
  the decoder's `vin-group` matches.
- Creates **dynamic array fields** (indexed hidden inputs, e.g. `vehicle.images.0`, `vehicle.images.1`)
  from a comma list via `array-fields`.
- Updates **anchor `href`s** from a `href-template` using `${field}` placeholders on VIN change
  (with a server-rendered `href` for the initial value).
- Alternative to wrapping: add the `vin-listener="<group>"` attribute directly to an individual
  `wc-input`/`wc-select`.

## Basic Usage

```html
<wc-vin-listener vin-group="vehicle" array-fields="images">
  <wc-input name="vehicle.year"  lbl-label="Year"  required></wc-input>
  <wc-input name="vehicle.make"  lbl-label="Make"  required></wc-input>
  <wc-input name="vehicle.model" lbl-label="Model" required></wc-input>
  <wc-input name="vehicle.trim"  lbl-label="Trim"></wc-input>
  <wc-input name="vehicle.msrp"  lbl-label="MSRP"></wc-input>
</wc-vin-listener>
```

## Attributes

| Attribute | Default | Description |
|---|---|---|
| `vin-group` | — | The VIN group to listen for; must match a `wc-vin-decoder`'s `vin-group`. |
| `array-fields` | — | Comma-separated list of array fields to create dynamically as indexed hidden inputs (e.g. `"images"` or `"images,photos"` → `…images.0`, `…images.1`). |

**Direct-field alternative:** instead of wrapping, put `vin-listener="<group>"` on any `wc-input` /
`wc-select` to make just that field respond.

## Examples

```html
<!-- Direct-field mode: no wrapper, each field opts in -->
<wc-input name="vehicle.year"  lbl-label="Year"  vin-listener="vehicle"></wc-input>
<wc-input name="vehicle.make"  lbl-label="Make"  vin-listener="vehicle"></wc-input>
```

```html
<!-- Templated link that updates with decoded values.
     Use `href` for the server-rendered initial value; `href-template` with ${field}
     placeholders is rewritten client-side when the VIN changes. -->
<wc-vin-listener vin-group="vehicle">
  <wc-input name="vehicle.year" lbl-label="Year"></wc-input>
  <a name="vehicle.search"
     href="https://google.com/search?q={{vehicle.year}}+{{vehicle.make}}+{{vehicle.model}}"
     href-template="https://google.com/search?q=${year}+${make}+${model}"
     target="_blank">Search this vehicle</a>
</wc-vin-listener>
```

## Notes

- Purely reactive: it emits no custom events of its own — it *listens* for the matching
  `wc-vin-decoder` decode and writes values into its child controls (dispatching `input`/`change`
  so bindings/validation update).
- `${field}` in `href-template` avoids server-side template collision (Pongo2 doesn't process `${}`),
  so both server-rendered (`href`) and live-updated (`href-template`) values coexist.
- Pairs with [`wc-vin-decoder`](./wc-vin-decoder.md) via a shared `vin-group`.
