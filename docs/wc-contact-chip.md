# WC-Contact-Chip Web Component

A compact, inline contact chip with a circular avatar, name, and a dismiss (×) button.

> Related: ./wc-contact-card.md, ./wc-article-card.md.

## Features

- Rounded pill layout with circular avatar
- Avatar selected by `gender`
- Built-in close button that hides the chip
- Theme-aware styling

## Basic Usage

```html
<wc-contact-chip gender="female" person-name="Jane Doe"></wc-contact-chip>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `gender` | — | Selects the default avatar image (`male` vs. any other value) |
| `person-name` | `John Doe` | Name shown in the chip |

## Notes

- The close (×) button adds the `hidden` class to the host to remove the chip from view.
- If you provide your own markup inside the element, it is kept as-is; otherwise a default avatar + name + close button is generated.
- Host element uses `display: contents`.
