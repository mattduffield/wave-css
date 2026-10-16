# WC-Zoom Web Component

A compact status-bar zoom control: optional Fit page / Fit width buttons, then − slider + and an editable percentage. The slider is logarithmic with 100% at its midpoint, so both the low and high ranges are usable. Clicking the percentage opens a small menu of presets plus Fit page / Fit width. With a `target`, it also handles Ctrl/⌘ + wheel, trackpad pinch and keyboard shortcuts over that element.

> Related: pairs with [wc-ruler](./wc-ruler.md). Used by Publish Studio, Template Studio, and the SummitMemories designer.

## Features

- − / + step through preset stops (`steps`)
- Logarithmic slider: `[min, 100]` fills the left half and `[100, max]` the right; snaps to a nearby preset
- Editable percentage field (type a value + Enter), with a presets menu (`role="menu"`, arrow keys + Enter)
- Fit page / Fit width: the host calculates the value and sets it back (no event loop)
- Ctrl/⌘ + wheel and trackpad pinch over `target`, reporting an anchor point so the host can zoom toward the cursor. The browser's own page zoom is prevented there
- Ctrl/⌘ + `=` / `-` / `0` (fit page) / `1` (100%) when `target` is set
- Fits a 30px status bar (24px tall)
- htmx-safe: re-binds when htmx replaces the target; no leaked listeners on removal

## Basic Usage

```html
<div class="statusbar">
  <span>Page 1 of 4</span>
  <wc-zoom id="zoom" value="92" target="#canvas" fit-buttons></wc-zoom>
</div>

<script type="module">
  zoom.addEventListener('wczoomchange', (e) => {
    const { value, anchorX, anchorY } = e.detail;   // anchor only for wheel/pinch
    canvas.setZoom(value / 100, anchorX, anchorY);
  });
  zoom.addEventListener('wczoomfit', (e) => {
    zoom.value = e.detail.mode === 'width' ? computeFitWidth() : computeFitPage();
    canvas.setZoom(zoom.value / 100);  // setting .value fires no event
  });
</script>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `value` | `100` | Zoom as a percentage. Reflected when the user changes it; clamped to `[min, max]` |
| `min` | `10` | Lowest zoom (%) |
| `max` | `800` | Highest zoom (%) |
| `steps` | `[25,50,75,100,125,150,200,300,400]` | JSON array of presets for −/+ and the menu (outside `[min,max]` ignored) |
| `fit-buttons` | — | Shows Fit page / Fit width buttons |
| `target` | — | Selector of the zoomable surface. Enables Ctrl/⌘ + wheel, pinch and shortcuts |

## Properties / Methods

| Member | Description |
|--------|-------------|
| `value` | Get/set the percentage. **Setting never fires an event**, so hosts can set it from `wczoomfit` safely |
| `zoomIn(source?)` / `zoomOut(source?)` | Step to the next / previous preset |
| `fit(mode)` | Fire `wczoomfit` for `'page'` or `'width'` |
| `min`, `max`, `steps` | Resolved bounds and presets |

## Events

Both events bubble and are composed, and are also broadcast through `wc.EventHub` (on `document.body`, with `detail.custom`).

| Event | Legacy alias | detail | When |
|-------|--------------|--------|------|
| `wczoomchange` | `wc-zoom:change` | `{ value, previous, source, anchorX?, anchorY? }` | The user changed the zoom. `source`: `slider` \| `button` \| `input` \| `menu` \| `wheel` \| `key` |
| `wczoomfit` | `wc-zoom:fit` | `{ mode: 'page' \| 'width' }` | Fit button, menu item, or Ctrl/⌘ + 0 |

`anchorX` / `anchorY` (wheel and pinch only) are the pointer position in the **target's own coordinates**: px from its top-left border-box corner, not including its scroll offset. To keep the point under the cursor fixed, scale `scrollLeft + anchorX` by `new / old` and subtract `anchorX` (see `views/zoom.html`).

## Keyboard

| Where | Keys |
|-------|------|
| Percentage field | Type a number + Enter; ↓/↑ open the menu and move through it; Esc closes |
| Menu | ↑/↓, Enter, Esc |
| Anywhere (when `target` is set) | Ctrl/⌘ + `=` zoom in, `-` zoom out, `0` fit page, `1` 100% |

## Wheel and pinch

- **Ctrl/⌘ + mouse wheel**: exponential steps (one notch ≈ 22%).
- **Trackpad pinch**: Chrome, Edge and Firefox report it as wheel + `ctrlKey` with small deltas, so it zooms smoothly. Safari reports `gesturestart`/`gesturechange` with `scale`, which is handled too.
- A plain wheel (no modifier) keeps scrolling normally.

## Notes

- The track and thumb come from Wave's own `input[type=range]` styling (the same look as `wc-slider`). Input rules sit outside the cascade layers because the `wc.ui` layer styles bare inputs.
- The presets menu is attached to `<body>` (never clipped) and carries the host's theme classes (`theme-*`, `dark`/`light`, `crisp`).
- The host element is `display: contents`; styles live in `@layer wc.usage`.
- Extends `WcBaseComponent`; `ready` resolves on connect.
- Demo: `views/zoom.html` (and `views/ruler.html`). Tests: `tests/zoom-test.py`.
