# WC-VIN-Decoder Web Component

`wc-vin-decoder` is a form-associated text input for a vehicle **VIN** that **automatically
decodes** the VIN (year/make/model/trim/…) as soon as a valid one is entered, and broadcasts the
result to any matching [`wc-vin-listener`](./wc-vin-listener.md) fields. It extends
`WcBaseFormComponent`, so it submits its VIN value like a normal named form control.

> Related: [`wc-vin-listener`](./wc-vin-listener.md) (consumes the decoded data), [`wc-input`](./wc-input.md).

## Features

- Decodes a VIN via a decoder API (default `https://vin.pegramins.com`), optionally checking a
  local database endpoint first (`database-endpoint`).
- Broadcasts decoded fields to `wc-vin-listener` components that share the same `vin-group`.
- Form-associated (submits `value` under `name`); supports `required`/`disabled`/`readonly`.
- Standard input ergonomics: label, placeholder, tooltip, `pattern`/`minlength`/`maxlength`,
  `inputmode`, and inline `on*` handlers.

## Basic Usage

```html
<wc-vin-decoder
  name="vin"
  lbl-label="VIN Number"
  vin-group="vehicle-0"
  api-url="https://vin.pegramins.com"
  database-endpoint="/api/vehicles/vin"
  required>
</wc-vin-decoder>
```

## Attributes

| Attribute | Default | Description |
|---|---|---|
| `name` | — | Form field name the VIN value submits under. |
| `value` | — | Current VIN value (round-trips). |
| `api-url` | `https://vin.pegramins.com` | VIN decoder API base URL. |
| `database-endpoint` | — | Optional endpoint checked **first**; if it returns a match, the API call is skipped. |
| `vin-group` | — | Group id used to target specific `wc-vin-listener` components. |
| `vehicle-type` | — | Hint passed through to the decode (e.g. auto/motorcycle). |
| `lbl-label` / `lbl-class` | — | Label text / label CSS class. |
| `placeholder` | — | Input placeholder. |
| `tooltip` / `tooltip-position` | — | Tooltip text / placement. |
| `required` / `disabled` / `readonly` | — | Standard form states. |
| `pattern`, `minlength`, `maxlength`, `inputmode` | — | Native input validation/entry hints. |
| `autocomplete`, `autocapitalize`, `spellcheck` | — | Native input behavior. |
| `class` / `elt-class` | — | Host class / inner control class. |
| `onchange`, `oninput`, `onblur`, `onfocus` | — | Inline event handler passthrough. |

## Events

Dispatched on the element (lowercase canonical + legacy colon alias):

| Event (canonical / legacy) | detail | When |
|---|---|---|
| `wcvindecoderchange` / `vin-decoder:change` | `{ …decoded fields, vinGroup, source }` | A VIN was decoded successfully (`source` indicates database vs API). |
| `wcvindecodererror` / `vin-decoder:error` | `{ error, … }` | Decoding failed. |

## Examples

```html
<!-- Decoder + listener pair: the decoder fills the listener's fields on a successful decode -->
<wc-vin-decoder name="vehicle.vin" lbl-label="VIN" vin-group="vehicle" required></wc-vin-decoder>

<wc-vin-listener vin-group="vehicle">
  <wc-input name="vehicle.year"  lbl-label="Year"  required></wc-input>
  <wc-input name="vehicle.make"  lbl-label="Make"  required></wc-input>
  <wc-input name="vehicle.model" lbl-label="Model" required></wc-input>
  <wc-input name="vehicle.trim"  lbl-label="Trim"></wc-input>
</wc-vin-listener>
```

```html
<!-- Check a local DB first, then fall back to the decoder API -->
<wc-vin-decoder name="vin" vin-group="v0"
  database-endpoint="/api/vehicles/vin"
  api-url="https://vin.pegramins.com"></wc-vin-decoder>
```

## Notes

- Extends `WcBaseFormComponent` — participates in native forms + HTMX (`value` submitted under `name`).
- Pair `vin-group` with one or more `wc-vin-listener` (or fields carrying `vin-listener="<group>"`)
  to auto-populate related fields on decode.
- Example view: `views/vin-decoder.html` (and `views/vin-decoder-debug.html`).
