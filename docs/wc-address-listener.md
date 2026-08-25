# WC-Address-Listener Web Component

A helper that listens for address-change events and updates child form fields based on their `name` attribute. Pair it with `wc-address` (or `wc-google-address`) so selecting an address auto-fills City / State / ZIP / County / etc.

> Related: ./wc-address.md (emits the change event this component listens for).

## Features

- Wrap form fields, or apply the `address-listener` attribute directly to an individual field
- Filters events by matching `address-group`
- Maps address parts to fields by the suffix of their `name` (e.g. `address.city` ← `city`)
- Listens for `wcgoogleaddresschange` (fired by both `wc-address` and `wc-google-address`)

## Basic Usage

```html
<!-- Wrap form fields that should respond to address changes -->
<wc-address-listener address-group="address">
  <wc-input name="address.city" lbl-label="City" required></wc-input>
  <wc-select name="address.state" lbl-label="State" required>
    <option value="">Choose...</option>
    <option value="CA">CA</option>
    <option value="NY">NY</option>
  </wc-select>
  <wc-input name="address.postal_code" lbl-label="ZIP" required></wc-input>
  <wc-input name="address.county" lbl-label="County"></wc-input>
</wc-address-listener>

<!-- Or apply directly to individual fields -->
<wc-input name="address.city" lbl-label="City" address-listener="address"></wc-input>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `address-group` | — | The address group to listen for (must match the `wc-address` / `wc-google-address` `address-group`) |

### Direct field attribute (alternative)

| Attribute | Description |
|-----------|-------------|
| `address-listener` | Add directly to a `wc-input` / `wc-select` to make it listen (value = the address group) |

## Field Mapping

A field is updated by the suffix of its `name`:

| Field name suffix | Filled from |
|-------------------|-------------|
| `*.street` | `street` |
| `*.apt_suite` | (not auto-filled — user enters manually) |
| `*.city` | `city` |
| `*.state` | `state` |
| `*.postal_code` | `postal_code` |
| `*.zip` | `postal_code` (alias) |
| `*.county` | `county` |
| `*.country` | `country` |
| `*.lat` | `lat` |
| `*.lng` | `lng` |
| `*.formatted_address` | `formatted_address` |
| `*.formatted_address_encoded` | `formatted_address_encoded` |
| `*.formatted_address_slug` | `formatted_address_slug` |
| `*.place_id` | `place_id` |

## How It Works

1. Listens for `wcgoogleaddresschange` events.
2. Filters events by matching `addressGroup`.
3. Updates child form fields based on their `name` attribute.
4. On update, dispatches a bubbling `change` event on each field.

## Notes

- Extends `WcBaseComponent`.
- Works with `wc-address` (keyless) and `wc-google-address` — both emit the `wcgoogleaddresschange` alias.
