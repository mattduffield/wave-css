# WC-Form-Array Web Component

A declarative, repeatable sub-form for an array-of-objects, designed to live inside `<wc-form>`. It renders an editable, add/remove, re-indexable set of rows and emits real native form controls named with the dotted-index convention (`${name}.${index}.${field}`) so the standard server save path reconstructs the array — no JSON serialization, no custom endpoint.

> Related: declare columns with [wc-form-array-column](./wc-form-array-column.md); lives inside [wc-form](./wc-form.md).

## Features

- Repeatable rows built from `wc-form-array-column` children
- Real native controls named `${name}.${index}.${field}` (dotted-index, no JSON payload)
- Add/remove with contiguous renumbering (`0..n-1`) after every change
- `min-rows` / `max-rows` enforcement; blank rows excluded on submit
- `table` (default) or `card` layout with responsive label-above grid
- `item-title` card-header template with `{index}` / `{index1}` / `{field}` tokens
- `readonly` static-text rendering
- Programmatic row API plus a declarative populate event
- htmx-safe

## Basic Usage

```html
<wc-form>
  <wc-form-array name="line_items" value='[]' min-rows="1" add-label="Add line item">
    <wc-form-array-column field="product_id" label="Product" type="text"></wc-form-array-column>
    <wc-form-array-column field="quantity"   label="Quantity" type="number" min="1" step="1"></wc-form-array-column>
    <wc-form-array-column field="unit_price" label="Unit Price" type="number" min="0" step="0.01"></wc-form-array-column>
  </wc-form-array>
  <button type="submit" class="btn btn-primary">Save</button>
</wc-form>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Array field name (required); used as the dotted-index prefix |
| `value` | — | JSON array of row objects (initial rows); empty/absent → `min-rows` blank rows |
| `min-rows` | 1 | Minimum number of rows (honors schema `@minItems`) |
| `max-rows` | (unlimited) | Optional maximum number of rows |
| `add-label` | `Add` | Label for the add button |
| `readonly` | — | Render rows as non-editable static text (no add/remove, no submission) |
| `layout` | `table` | `table` (one row per item + shared header) or `card` (bordered card per item) |
| `item-title` | — | Card-header title template; tokens `{index}` (0-based), `{index1}` (1-based), `{field}` (a column value) |

## Events

| Event | detail | When |
|-------|--------|------|
| `wcformarraychange` (legacy alias `wc-form-array:change`) | `{ name, rows }` | On any add/remove/edit; bubbles, composed |

The element also listens for a `wc-form-array:populate` (or `wcformarraypopulate`) CustomEvent with detail `{ rows: [ {field:value}, … ] }` to append those rows.

## Methods

| Method | Description |
|--------|-------------|
| `addRow(data?)` | Append a row pre-filled from `{ field: value }` (reindexes as usual) |
| `setRow(index, data)` | Fill/replace the row at `index` (partial data merges onto current) |
| `removeRow(rowOrIndex)` | Remove a row (honors `min-rows`) |
| `rows` (get/set) | Get/set the array of row objects |
| `value` (get/set) | Get/set the value as a JSON array of row objects |

## Examples

```html
<!-- Card layout with per-card title and a reference select column -->
<wc-form>
  <wc-form-array name="guardians" layout="card" item-title="Guardian {index1}" min-rows="1">
    <wc-form-array-column field="name"  label="Name"  type="text" required></wc-form-array-column>
    <wc-form-array-column field="phone" label="Phone" type="tel"></wc-form-array-column>
    <wc-form-array-column field="relationship" label="Relationship" type="select"
                          options='[{"key":"parent","value":"Parent"},{"key":"grandparent","value":"Grandparent"}]'></wc-form-array-column>
  </wc-form-array>
</wc-form>
```

```js
// Drive rows programmatically (e.g. from a wc-record-lookup)
formArray.addRow({ name: 'Jane Doe', phone: '555-1212' });

// Or declaratively
formArray.dispatchEvent(new CustomEvent('wc-form-array:populate', {
  detail: { rows: [{ name: 'A' }, { name: 'B' }] }
}));
```

## Notes

- Submitting the form produces controls like `line_items.0.product_id`, `line_items.1.product_id`, which the server reconstructs into `line_items: [ {…}, {…} ]`.
- Hard guarantee: after any add/remove, every control's `name` is renumbered so indices stay contiguous `0..n-1` (gaps would create null/empty holes).
- Fully-blank rows are excluded on submit (native submit capture + `htmx:configRequest`) so a trailing blank row never serializes a junk object.
- Extends `WcBaseComponent` (NOT form-associated) — its `name` is only a dotted-index prefix; the rendered native controls carry the submitted values.
- Styles live in `@layer wc.usage`.
