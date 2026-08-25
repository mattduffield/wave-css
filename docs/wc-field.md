# WC-Field Web Component

A read-only informational display component that pairs an optional label with a value (or arbitrary child content). It is display-only — it does NOT participate in form submission — and supports a clickable label via `link` or HTMX attributes.

> Related: for editable fields use form components such as [wc-input](./wc-input.md).

## Features

- Optional label above a value area
- Value from the `value` attribute or from arbitrary child content (child content takes precedence)
- Clickable label via `link` (anchor) or any `hx-*` HTMX attributes
- Custom label/value CSS classes and text alignment
- Extends `WcBaseComponent` (not form-associated)

## Basic Usage

```html
<wc-field label="Status" value="Active"></wc-field>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `label` | — | Label text (renders only if present) |
| `label-class` | — | Custom CSS classes for the label |
| `value` | — | Display value (used when no child content is provided) |
| `value-class` | `text-xs text-4` | Custom CSS classes for the value area |
| `link` | — | URL that makes the label a clickable anchor |
| `text-align` | `center` | Value text alignment: `left`, `center`, or `right` |
| `hx-*` | — | HTMX attributes (`hx-get`, `hx-post`, `hx-target`, `hx-swap`, `hx-trigger`, `hx-indicator`, `hx-push-url`, `hx-vals`, `hx-include`, `hx-confirm`, etc.) applied to the clickable label |

## Examples

```html
<!-- Clickable label with a link -->
<wc-field label="Bill Plans" link="/v/bill_plans/create" value="3 plans available"></wc-field>
```

```html
<!-- HTMX-driven label -->
<wc-field
  label="Bill Plans"
  hx-get="/v/bill_plans/create?script_id=123"
  hx-target="#modal-container"
  hx-swap="innerHTML"
  hx-push-url="false"
  value="Manage plans">
</wc-field>
```

```html
<!-- Complex child content (takes precedence over value) -->
<wc-field label="Payment History">
  <table class="w-full text-xs">
    <tr><td>Jan 2025</td><td>$99.99</td></tr>
    <tr><td>Feb 2025</td><td>$99.99</td></tr>
  </table>
</wc-field>
```

```html
<!-- Custom styling -->
<wc-field
  label="Total Amount"
  label-class="font-bold text-primary"
  value="$1,234.56"
  value-class="text-2xl text-center text-success">
</wc-field>
```

## Notes

- This is a read-only display component and does NOT participate in form submission (it exposes `name`/`value` getters only for HTMX `hx-include` compatibility).
- Child content takes precedence over the `value` attribute.
- When `link` or `hx-get` is present, the label becomes an anchor and the HTMX attributes are moved onto it.
- The `value` attribute is consumed and removed after the initial render; runtime updates via `setAttribute('value', …)` update the rendered text in place (e.g. for live SSE bindings).
- The host element is `display: contents`.
