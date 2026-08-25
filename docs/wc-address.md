# WC-Address Web Component

A keyless, $0/mo, provider-agnostic address type-ahead — a drop-in replacement for `wc-google-address`. It talks to the app's own geocode PROXY instead of Google Places, so there's no API key in the browser and no Google billing.

> Related: ./wc-address-listener.md (fills sibling fields from the change event), ./wc-map.md and ./wc-google-map.md (targetable via `target-map`).

## Features

- Debounced address autocomplete (≥3 chars) with a keyboard-navigable dropdown (↑/↓/Enter/Esc)
- Calls the app's own geocode proxy (default `/api/geocode`) that adapts LocationIQ / Nominatim server-side, caches, and keeps the key/attribution in one place
- Form-associated (FACE) — submits under the host `name`
- Emits a rich address-change event (canonical + several legacy aliases) on the element AND `document`
- `target-map` pushes lat/lng/address to a `wc-map` OR `wc-google-map` by id
- Autofill suppression on the input

## Basic Usage

```html
<wc-address
  name="address.street"
  lbl-label="Street Address"
  address-group="address"
  target-map="map1"
  countries="us"
  geocode-url="/api/geocode"
  required>
</wc-address>
```

## Proxy Contract

```text
GET  ${geocode-url}/autocomplete?q=<partial>  ->  [{ id, label, lat, lng }]
GET  ${geocode-url}/details?id=<id>           ->  { street, city, state, postal_code,
                                                    county, country, lat, lng,
                                                    formatted_address, source, approximate }
```

A details-404 falls back to the suggestion's own label + lat/lng.

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Submitted field name (FACE, host-owned) |
| `value` | — | Seed / round-trip value |
| `placeholder` | — | Input placeholder |
| `lbl-label` | — | Field label |
| `lbl-class` | — | Class applied to the label |
| `elt-class` | — | Class applied to the inner control |
| `disabled` | (absent) | Disable the input |
| `readonly` | (absent) | Make the input read-only |
| `required` | (absent) | Participate in form validity |
| `autocomplete` | — | Autocomplete hint (autofill is suppressed) |
| `geocode-url` | `/api/geocode` | Base URL of the geocode proxy |
| `address-group` | — | Group id echoed in the change event (paired with `wc-address-listener`) |
| `target-map` | — | id of a `wc-map`/`wc-google-map` to push the selection to |
| `countries` | — | Restrict results by country code(s) |
| `types` | — | Restrict result types |
| `icon-name` | — | Leading icon name |
| `tooltip` / `tooltip-position` | — | Tooltip text/position |

`api-key` / `fields` are accepted but ignored — no provider key is needed.

## Events

All events fire on the element AND `document` with the same detail. `wcaddresschange` is canonical; `wc-address:change`, `google-address:change`, and `wcgoogleaddresschange` are aliases (for drop-in compatibility with existing screens / `wc-address-listener`).

| Event | Detail |
|-------|--------|
| `wcaddresschange` (+ `wc-address:change`, `google-address:change`, `wcgoogleaddresschange`) | `{ addressGroup, street, city, state, postal_code, county, country, lat, lng, formatted_address, formatted_address_encoded, formatted_address_slug, place_id, source, approximate }` |

## Methods

| Method | Description |
|--------|-------------|
| `getPlaceData()` | Return the last selected place data |

The `value` property getter/setter reflects the current input value.

## Examples

Autofill sibling fields on selection via `wc-address-listener`:

```html
<wc-address name="address.street" lbl-label="Street" address-group="address"
            geocode-url="/api/geocode" countries="us"></wc-address>

<wc-address-listener address-group="address">
  <wc-input name="address.city" lbl-label="City"></wc-input>
  <wc-input name="address.state" lbl-label="State"></wc-input>
  <wc-input name="address.postal_code" lbl-label="ZIP"></wc-input>
</wc-address-listener>
```

## Notes

- Extends `WcBaseFormComponent` (form-associated).
- Requires a visible "Search by LocationIQ" attribution per provider ToS.
- Demoed in `views/map.html` (needs the `/api/geocode` proxy running).
