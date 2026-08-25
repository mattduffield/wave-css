# WC-Data-Cards Web Component

A generic, data-bound responsive card gallery. Bind an array of records plus field mappings (cover image / title / subtitle / detail subset) and it renders a responsive grid of `.card` elements with click-through. The generic counterpart to the opinionated `wc-article-card` / `wc-contact-card`; composes the same `.card` look.

> Related: [wc-kanban](./wc-kanban.md), [wc-calendar](./wc-calendar.md), and [wc-gantt](./wc-gantt.md) are other data-bound collection views. Generation rule: an entity with an image field → gallery.

## Features

- Responsive grid: 1 → 2 (≥640px) → `columns` (≥1024px)
- Optional cover image; degrades to a tidy text card when absent (no broken `<img>`)
- Title, optional subtitle, and a subset of fields rendered as `.badge` chips
- Card activation via link template (`<a href>`) or an open event
- Empty-state message
- htmx-safe: re-renders on attribute changes

## Basic Usage

```html
<wc-data-cards
    items='[{"_id":"1","name":"Widget","sku":"W-100","photo":"/img/w.jpg","price":"$9","status":"active"},
            {"_id":"2","name":"Gadget","sku":"G-200","price":"$19","status":"draft"}]'
    image-field="photo"
    title-field="name"
    subtitle-field="sku"
    fields='["price","status"]'
    columns="3">
</wc-data-cards>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `items` | `[]` | (required) JSON array of record objects |
| `image-field` | `""` | optional cover-image URL member; omitted/missing value → tidy text card (no broken `<img>`) |
| `title-field` | `title` | title member |
| `subtitle-field` | `""` | optional subtitle member |
| `fields` | `[]` | JSON array of detail member names rendered as `.badge .badge-muted` chips (empty values skipped) |
| `columns` | `3` | max columns on wide screens (responsive 1 → 2 → columns) |
| `link-template` | `""` | URL with `{field}` tokens; renders each card as an `<a href>` |
| `id-field` | `_id` | id member used for the open event |

## Events

Bubbles and is composed.

| Event | detail | When |
|-------|--------|------|
| `wcdatacardsopen` (legacy alias `wc-data-cards:open`) | `{ id }` | non-link card activated (click / Enter / Space) |

## Methods

| Method | Description |
|--------|-------------|
| `refresh()` | Re-renders the gallery |
| `items` (get/set) | Get a copy of / replace the items array (serializes to the `items` attribute) |

## Examples

### Image gallery with link-through cards

```html
<wc-data-cards
    items='{{ Data.items|toJSON|safe }}'
    image-field="photo"
    title-field="name"
    fields='["price"]'
    columns="4"
    link-template="/x/product/{_id}">
</wc-data-cards>
```

### Text-only cards with an open handler

```html
<wc-data-cards id="gallery"
    items='[{"_id":"a","name":"No image record","status":"active"}]'
    title-field="name"
    fields='["status"]'>
</wc-data-cards>

<script>
  document.getElementById('gallery').addEventListener('wcdatacardsopen', (e) => {
    console.log('open', e.detail.id);
  });
</script>
```

## Notes

- Extends `WcBaseComponent`.
- Host element is `display: contents`; styles live in `@layer wc.usage`.
- If `image-field` is absent OR a record lacks a value for it, the card renders without an `<img>` (degrades to a tidy text card).
- Cover images use `loading="lazy"` and a 16:9 aspect ratio.
- htmx-safe: re-renders when `items` / field mappings / `columns` change.
