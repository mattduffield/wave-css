# WC-Ruler Web Component

A horizontal or vertical ruler for a zoomable canvas, in the style of Publisher, InDesign, or PowerPoint. It is drawn on a `<canvas>`, so it stays crisp at any devicePixelRatio and is cheap to redraw on every scroll or zoom frame. Per-frame updates never touch the DOM: they change internal state and schedule one `requestAnimationFrame` paint.

> Related: pairs with [wc-zoom](./wc-zoom.md) for the status-bar zoom control. Used by Publish Studio, Template Studio, and the SummitMemories designer.

## Features

- Units: `in`, `cm`, `mm`, `pt`, `pc` (picas), `px`
- Automatic tick density for the zoom: labelled major ticks, plus minor ticks and sub-ticks (½ ¼ ⅛ ¹⁄₁₆ for inches and picas, ½ and tenths for metric units); labels never overlap
- Tracks a scrolled, centred page via `origin` (the screen offset of 0)
- Shades the area off the page (`length`)
- Highlighted band for the selected object's extent (`selection`)
- Guide markers; drag a guide out into the canvas, or double-click a ruler position
- Optional cursor hairline (`cursor-tracking`)
- Vertical-ruler labels are rotated to read top to bottom
- Re-renders on resize, on a DPR change (moving to another display), and on a theme change
- htmx-safe (initialises on swap; removes every window and document listener on disconnect)

## Basic Usage

```html
<div style="display:grid; grid-template-columns:22px 1fr; grid-template-rows:22px 1fr;">
  <button class="corner">in</button>
  <wc-ruler id="hr" orientation="horizontal" unit="in" length="612" partner="#vr" cursor-tracking></wc-ruler>
  <wc-ruler id="vr" orientation="vertical"   unit="in" length="792" partner="#hr" cursor-tracking></wc-ruler>
  <div id="scroller" style="overflow:auto"> …page… </div>
</div>

<script type="module">
  // On every scroll / zoom frame: just the page's screen offset and the zoom.
  scroller.addEventListener('scroll', () => {
    const page = document.querySelector('#page').getBoundingClientRect();
    hr.setOrigin(page.left - hr.querySelector('canvas').getBoundingClientRect().left);
    vr.setOrigin(page.top  - vr.querySelector('canvas').getBoundingClientRect().top);
  }, { passive: true });
</script>
```

All positions are in **points** (1pt = 1/72in). At zoom 1, one point is 96/72 CSS px.

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `orientation` | `horizontal` | `horizontal` or `vertical` |
| `unit` | `in` | `in`, `cm`, `mm`, `pt`, `pc`, `px`. Sets the labels and tick subdivisions |
| `zoom` | `1` | Scale factor (1 = 100%) |
| `origin` | `0` | CSS px from the ruler's start edge where 0pt sits |
| `length` | `0` | Page extent in points. `[0, length]` is drawn as on-page and the rest is shaded |
| `selection` | — | JSON `[start, end]` in points. Drawn as a highlighted band |
| `guides` | `[]` | JSON array of guide positions (points) along this ruler's axis |
| `partner` | — | Selector of the perpendicular ruler (see Guides) |
| `cursor-tracking` | — | Draws a hairline that follows the pointer anywhere on the page |

## Methods

Each method updates state without touching attributes, so it is safe to call every frame.

| Method | Description |
|--------|-------------|
| `setOrigin(px)` | Move 0 to this offset (CSS px from the ruler's start edge) |
| `setZoom(z)` | Change the zoom (1 = 100%) |
| `setSelection(start, end)` | Highlight `[start, end]` (points). Call with no arguments to clear |
| `trackCursor(clientX \| clientY)` | Draw the hairline at a client coordinate; `null` hides it |
| `setGuides(array)` | Replace the guide positions |
| `clientToPoints(clientCoord)` | Convert a client X (horizontal) or Y (vertical) to points |
| `refreshTheme()` | Re-read the colour tokens (automatic for class changes on `<html>`/`<body>`) |

Read-only properties: `zoom`, `origin`, `guides`, `selection`, `unit`, `vertical`.

## Guides

A guide dragged down out of the **top** ruler is a *horizontal* guide, so its position is a **y** coordinate, measured on the vertical axis. With `partner` pointing at the perpendicular ruler, the drag reports positions in page points on the partner's axis, and the partner shows a live marker while you drag. Without a partner, the reported position is the distance from the ruler's edge.

Double-clicking a ruler adds a guide at that position on the ruler's **own** axis.

`wcrulerguidecreate` is **cancelable**. By default the ruler adds the guide to the ruler that owns that axis: the partner for a drag-out, or itself for a double-click. A host that keeps its own guide model calls `preventDefault()` and sets `guides` itself.

## Events

All events bubble and are composed, and are also broadcast through `wc.EventHub`. The EventHub copy is dispatched on `document.body` with `detail.custom` set to the detail below and `detail.selector` = `[data-wc-id="…"]`.

| Event | Legacy alias | detail | When |
|-------|--------------|--------|------|
| `wcrulerguidedrag` | `wc-ruler:guide-drag` | `{ position, axis, clientX, clientY }` | While a guide is dragged out over the canvas |
| `wcrulerguidecreate` | `wc-ruler:guide-create` | `{ position, axis, source }` (`source`: `drag` \| `dblclick`) | On release outside the ruler, or on double-click. Cancelable |
| `wcrulerguidecancel` | `wc-ruler:guide-cancel` | `{ axis }` | A drag left the ruler and was released back over it |

`axis` is `'x'` for vertical guides (x positions) and `'y'` for horizontal guides.

## Theming

The canvas colours are read from CSS custom properties, which all default to Wave tokens:

| Property | Default |
|----------|---------|
| `--wc-ruler-bg` | `var(--surface-2)` (off-page) |
| `--wc-ruler-page-bg` | `var(--surface-1)` (on-page) |
| `--wc-ruler-tick` | `var(--text-3)` |
| `--wc-ruler-text` | `var(--text-2)` |
| `--wc-ruler-accent` | `var(--primary-bg-color)` (selection band, drawn at 28% alpha) |
| `--wc-ruler-guide` | `var(--info-color)` |
| `--wc-ruler-size` | `22px` (thickness) |
| `--wc-ruler-font-size` | `10px` |

`theme-high-contrast` switches ticks and labels to `--text-1`. Labels measure ≥ 16:1 in light, dark, `.crisp` and high-contrast themes.

## Notes

- Labels show the absolute distance from 0 (Publisher style), so positions above or left of the page read `0.5, 1, …`.
- The host element is `display: contents`; styles live in `@layer wc.usage`.
- Extends `WcBaseComponent`; `ready` resolves on connect.
- Demo: `views/ruler.html`. Tests: `tests/ruler-test.py`.
