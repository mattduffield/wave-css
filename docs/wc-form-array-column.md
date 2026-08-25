# WC-Form-Array-Column Web Component

A configuration-only child of `<wc-form-array>`. It declares one column of the repeatable sub-form and renders nothing itself — the parent `wc-form-array` reads these attributes to build each row's controls. One `wc-form-array-column` per schema field.

> Related: parent [wc-form-array](./wc-form-array.md).

## Config-only element

This element is purely declarative configuration. It is hidden, never renders visible UI on its own, and never participates in form submission — only the controls `wc-form-array` renders do.

## Basic Usage

```html
<wc-form-array name="line_items" value='[...]'>
  <wc-form-array-column field="product_id" label="Product" type="select"
                        options='[{"_id":"a","name":"Widget"}]'
                        option-value="_id" option-label="name"></wc-form-array-column>
  <wc-form-array-column field="quantity"   label="Quantity"   type="number" min="1" step="1"></wc-form-array-column>
  <wc-form-array-column field="unit_price" label="Unit Price" type="number" min="0" step="0.01"></wc-form-array-column>
</wc-form-array>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `field` | — | The object key this column maps to (the `sub` in `${name}.${index}.${sub}`); required |
| `label` | (field) | Column header text |
| `type` | `text` | `text`, `number`, `date`, `select`, `textarea`, `tel`, or `address` |
| `control` | — | Render ANY Wave form component instead of the fixed types; every non-reserved attribute is passed through |
| `options` | — | JSON array for `select` (inline `{key,value}` list OR a collection of records) |
| `option-value` | — | For `select`: which member is the stored value (e.g. `_id`) |
| `option-label` | — | For `select`: which member is the visible label (e.g. `name`) |
| `placeholder` | — | Placeholder for text/number/date inputs |
| `min` / `max` / `step` | — | Passed through to number/date inputs |
| `rows` | 3 | For `type="textarea"`: visible row count |
| `full-width` | — | Column spans the whole card on its own row (card layout) |
| `mask` | — | WcMaskHub mask: `phone`, `ssn`, `zip`, `zipPlus4`, `date`, or `currency` (`type="tel"` implies `mask="phone"`) |
| `geocode-url` | — | For `type="address"`: geocode proxy URL passed to the per-row `wc-address` |
| `countries` | — | For `type="address"`: country filter passed to `wc-address` |
| `show-fields` | — | For `type="address"`: render parts as visible editable inputs (boolean → City/State/Zip; or a comma list) |
| `icon` | (by type) | Leading decorative `wc-fa-icon` inside the input (defaults: `tel`→phone, `email`→envelope; for `address` it becomes the inner `wc-address`'s `icon-name`) |
| `required` | — | Mark the per-row control required (renders a `*` on the label) |
| `col-class` | — | Extra class(es) applied to this column's cells (width/align) |

Reserved attributes (not passed through when using `control`): `field`, `label`, `type`, `control`, `full-width`, `col-class`, `required`, `icon`.

## Examples

```html
<!-- Multi-line full-width textarea column (card layout) -->
<wc-form-array-column field="notes" label="Notes" type="textarea" rows="4" full-width></wc-form-array-column>
```

```html
<!-- Phone column with mask + icon (type=tel implies mask=phone) -->
<wc-form-array-column field="phone" label="Phone" type="tel"></wc-form-array-column>
```

```html
<!-- Address column filling nested sub-fields, with visible parts -->
<wc-form-array-column field="location" label="Address" type="address"
                      geocode-url="/api/geocode" show-fields></wc-form-array-column>
```

```html
<!-- Generic control passthrough: list + custom chips -->
<wc-form-array-column field="tags" label="Tags"
                      control="wc-select" multiple mode="chip" allow-custom></wc-form-array-column>
```

## Notes

- For `type="address"`, on select the geocoded parts fill the row's address sub-fields under `${name}.${index}.${field}.{street,city,state,postal_code,county,country,lat,lng,formatted_address}` (the visible `wc-address` is `street`; the rest are hidden inputs), so the server reconstructs a nested address object. Value pre-fill accepts that same object shape.
- `control="<tag>"` renders any Wave form component and passes through every non-reserved attribute (`options`/`option-value`/`option-label` become `<option>` children); a control with an inner `<select multiple>` makes the column value an array.
- Extends `WcBaseComponent`. It exposes a `getConfig()` method (used by the parent) and emits an internal `wcformarraycolumnchange` event when its attributes change.
