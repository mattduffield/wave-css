# WC-Cron-Picker Web Component

A visual, dropdown-driven schedule picker that generates standard 5-field cron expressions, with a human-readable description and a collapsible syntax reference. Form-associated.

> Related: ./wc-calendar.md, ./wc-input.md.

## Features

- Dropdown frequency selection: Minute, N Minutes, Hour, N Hours, Day, Weekday (Mon–Fri), Weekend (Sat–Sun), Week, Month, Custom
- Only the relevant fields (interval / day-of-week / day-of-month / time) show per frequency
- Parses an incoming cron string back into the visual state
- Live human-readable description plus the raw cron expression display
- Collapsible cron syntax reference
- Form-associated — submits the cron expression under `name` via a hidden input

## Basic Usage

```html
<wc-cron-picker name="schedule" lbl-label="Schedule" value="0 9 * * 1"></wc-cron-picker>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `name` | — | Form field name for the submitted cron value |
| `value` | — | Initial/current cron expression (e.g. `0 9 * * 1`); round-trips |
| `lbl-label` | — | Label text shown above the controls |
| `lbl-class` | — | CSS class applied to the label |
| `disabled` | — | Boolean; disables all controls |
| `required` | — | Boolean; marks the field required (shows `*` on the label) |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `wccronchange` | `{ value }` | Fired when the cron expression changes (bubbles, composed) |

## Examples

```html
<!-- Every 15 minutes -->
<wc-cron-picker name="poll" lbl-label="Poll frequency" value="*/15 * * * *"></wc-cron-picker>

<!-- Weekdays at 9:00 AM -->
<wc-cron-picker name="digest" lbl-label="Digest" value="0 9 * * 1-5"></wc-cron-picker>
```

## Notes

- Minute intervals offered: 2, 3, 5, 10, 15, 20, 30. Hour intervals offered: 2, 3, 4, 6, 8, 12.
- An expression that doesn't map to a known frequency falls back to the Custom text input.
- The cron value is held in a hidden input for native/HTMX form submission.
- Host element uses `display: contents`.
