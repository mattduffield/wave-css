# WC-Slideshow-Image Web Component

A single image slide used inside a `wc-slideshow`. It renders an image with an optional caption and a slide-number label.

> Related: `wc-slideshow` (the containing slideshow).

## Features

- Image with optional caption overlay
- Optional slide-number label (e.g. "1 / 3")
- Designed to be nested inside `wc-slideshow`

## Basic Usage

```html
<wc-slideshow class="mb-4" autoplay autoplay-interval="3000">
  <wc-slideshow-image
    url="https://www.w3schools.com/howto/img_nature_wide.jpg"
    caption="Caption 1"></wc-slideshow-image>
  <wc-slideshow-image
    url="https://www.w3schools.com/howto/img_snow_wide.jpg"
    caption="Caption 2"></wc-slideshow-image>
</wc-slideshow>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `url` | — | Image source URL |
| `caption` | — | Caption text shown over the bottom of the image |
| `numbertext` | — | Slide-number label shown at the top (e.g. "1 / 3") |
| `id` | — | Element id |
| `class` | — | CSS classes |

## Examples

```html
<wc-slideshow-image
  url="/images/hero.jpg"
  caption="Our latest release"
  numbertext="1 / 4"></wc-slideshow-image>
```

## Notes

- Extends `WcBaseComponent`; `display: contents`.
- htmx-safe: calls `htmx.process` on its content when HTMX is present.
- Images are capped at `max-height: 300px` with `object-fit: cover`.
- Meant to be used as a child of `wc-slideshow`, which handles navigation and autoplay.
