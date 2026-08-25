# WC-Rating Web Component

A form-associated icon rating field. It renders `max` icons using three distinct `wc-fa-icon` glyphs — empty, half, and full — so a partial value shows a visually distinct half glyph rather than a CSS-clipped full icon. It can be editable or readonly and submits a number under `name`.

> Related: composes [wc-fa-icon](./wc-fa-icon.md); pairs with [wc-form](./wc-form.md).

## Features

- Three distinct glyphs for empty / half / full states (per-state name and style overridable)
- Optional half-step ratings (`allow-half`)
- Editable (click, left-half → .5, hover preview, arrow/Home/End keys) or `readonly`
- Optional `show-value` and `count` suffix for list/detail display
- Configurable `color` and `size`
- Form-associated (FACE) — submits the number under the host `name`
- htmx-safe (re-renders on attribute change, initializes on swap)

## Basic Usage

```html
<wc-form>
  <wc-rating name="satisfaction" value="3.5" lbl-label="Satisfaction" max="5" allow-half></wc-rating>
</wc-form>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Form field name (required); submitted via FACE |
| `value` | 0 | Initial numeric rating (seeds + round-trips) |
| `lbl-label` | "" | Field label text |
| `max` | 5 | Number of icons |
| `allow-half` | — | Enable .5 steps |
| `icon-empty` | `star` | Icon name for the empty state |
| `icon-half` | `star-half-stroke` | Icon name for the half state |
| `icon-full` | `star` | Icon name for the full state |
| `icon-empty-style` | `regular` | Icon style for the empty state |
| `icon-half-style` | `regular` | Icon style for the half state |
| `icon-full-style` | `solid` | Icon style for the full state |
| `color` | `--warning-color` | Icon fill color |
| `size` | `1.25rem` | Icon size |
| `readonly` | — | Non-interactive (same fill, no editing) |
| `required` | — | Invalid at 0/unset |
| `disabled` | — | Disables the field |
| `show-value` | — | Append the numeric value as a suffix |
| `count` | — | Append ` (N)` as a suffix (handy in list/detail display) |

## Events

| Event | detail | When |
|-------|--------|------|
| `wcratingchange` (legacy alias `wc-rating:change`) | `{ value }` | On change (click or keyboard); bubbles, composed |

## Examples

```html
<!-- Editable half-value stars -->
<wc-rating name="rating" value="4.5" lbl-label="Rating" max="5" allow-half color="#f59e0b" required></wc-rating>
```

```html
<!-- Whole-value hearts variant -->
<wc-rating
  name="love"
  value="3"
  lbl-label="Love it"
  icon-empty="heart" icon-half="heart" icon-full="heart"
  color="#ef4444">
</wc-rating>
```

```html
<!-- Readonly display with value + count -->
<wc-rating value="4" max="5" readonly show-value count="128"></wc-rating>
```

## Notes

- The empty vs full distinction is by icon style as much as name (e.g. `star` regular outline vs `star` solid).
- Hover only previews; the stored value changes on click/keyboard.
- The host element is `display: contents`; internal styles live in `@layer wc.usage`.
- Extends `WcBaseFormComponent` — no native input; the component calls `setFormValue` under the host `name`.
