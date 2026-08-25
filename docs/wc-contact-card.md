# WC-Contact-Card Web Component

A contact information card with an avatar image, name, and title, composing the shared `.card` look.

> Related: ./wc-contact-chip.md, ./wc-article-card.md, ./wc-data-cards.md.

## Features

- Avatar image selected by `gender`
- Name and title display
- Theme-aware card styling with hover elevation
- Accepts custom child markup (preserved) or auto-generates default content

## Basic Usage

```html
<wc-contact-card gender="male" contact-name="John Smith" contact-title="Manager"></wc-contact-card>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `gender` | — | Selects the default avatar image (`male` vs. any other value) |
| `contact-name` | `John Doe` | Name shown in the card body |
| `contact-title` | `Boss` | Title/role shown beneath the name |

## Examples

```html
<wc-contact-card gender="female" contact-name="Erica Duffield" contact-title="Designer"></wc-contact-card>
```

## Notes

- If you provide your own markup inside the element, it is kept as-is; otherwise the component builds a default avatar + name + title layout.
- Default avatar images are loaded from `w3schools.com` sample URLs.
- Host element uses `display: contents`.
