# WC-Loader Web Component

`wc-loader` is a customizable loading spinner. It offers multiple spinner **styles** (a single-ring
border spinner and a dual concentric **double-ring**), theme-derived multi-**variant** ring colors,
an optional dimmed **overlay**, and accessibility built in. It is **fully self-styled** — every rule
(keyframes, both styles, color variants, overlay, reduced-motion) is injected by the component via
`_applyStyle()`, so it renders correctly even with `main.css` not loaded.

## Features

- Two spinner styles via `type`: `ring` (default) and `double-ring`
- Five theme-derived color variants via `variant`, computed in OKLCH from `--hue` / `--chroma-mult`
- Size-scalable double-ring (`size` / `--wc-loader-size`)
- Backward-compatible `size` / `speed` / `thickness` API and EventHub show/hide/toggle
- Optional full-area dimmed `overlay`
- Accessible: `role="status"`, `aria-busy`, `aria-label`; honors `prefers-reduced-motion`
- HTMX compatible; No Shadow DOM

## Basic Usage

```html
<!-- Single-ring border spinner (DEFAULT — unchanged look/API) -->
<wc-loader></wc-loader>
<wc-loader size="45px" speed="0.75s" thickness="8px"></wc-loader>

<!-- Double-ring spinner (the go-kart #content-loader look), size-scalable -->
<wc-loader type="double-ring"></wc-loader>
<wc-loader type="double-ring" size="64px"></wc-loader>

<!-- Theme-derived ring colors -->
<wc-loader variant="contrast"></wc-loader>
<wc-loader type="double-ring" variant="complement"></wc-loader>

<!-- Dimmed overlay over a positioned ancestor -->
<div style="position: relative">
  …content…
  <wc-loader type="double-ring" variant="mono" overlay label="Loading"></wc-loader>
</div>
```

## Attributes

| Attribute   | Description                                                              | Default        | Values |
|-------------|--------------------------------------------------------------------------|----------------|--------|
| `type`      | Spinner **style**                                                        | `ring`         | `ring`, `double-ring` |
| `variant`   | Ring **colors** (sets `--wc-spin-1/2`)                                   | `mono`         | `mono`, `contrast`, `analogous`, `complement`, `neutral` |
| `size`      | Footprint (ring circle / double-ring box). Also `--wc-loader-size`.      | 120px / 200px  | `"64px"`, `"4rem"` |
| `speed`     | Animation duration                                                       | 2s / 1s        | `"0.5s"`, `"1s"` |
| `thickness` | Ring border width (**ring** only)                                        | 16px           | `"4px"`, `"8px"` |
| `overlay`   | Center the spinner over a dimmed full-area backdrop (boolean)            | off            | — |
| `fixed`     | Make the overlay `position:fixed` over the viewport (boolean, or `overlay="fixed"`) | off | — |
| `label`     | Accessible label (`aria-label`)                                          | `"Loading"`    | any string |
| `class`     | Extra CSS classes (`htmx-indicator` turns the overlay into a busy indicator — see below) | —  | — |

## Spinner styles (`type`)

- **`ring`** (default) — the classic single border spinner. Preserves the original look + API.
  `--wc-spin-1` paints the moving arc (the `border-top`), `--wc-spin-2` the track.
- **`double-ring`** — dual concentric counter-rotating rings + dot accents (the spinner formerly
  shipped as go-kart's `#content-loader` / `.ldio-*`). Outer ring + dots use `--wc-spin-1`, inner
  ring + dots use `--wc-spin-2`. Fully **size-scalable**: the whole geometry scales off
  `size` (default footprint 200px) via `calc()`, so `type="double-ring" size="64px"` shrinks cleanly.

The `type` switch is structured so more styles (`dots`, `pulse`, …) can be added later.

## Color variants (`variant`)

Ring colors are derived at render time from the **theme's own** `--hue` and `--chroma-mult`
(`cm = var(--chroma-mult, 1)`), so they track the active theme and go **grayscale automatically in
muted themes** (`--chroma-mult: 0`). Each variant sets `--wc-spin-1` (primary ring) and `--wc-spin-2`
(secondary ring), with distinct light and dark values (a base rule + a `.dark`-ancestor rule):

| variant      | ring-1 (light)                          | ring-2 (light)                                       | ring-1 (dark)                           | ring-2 (dark)                                        |
|--------------|-----------------------------------------|------------------------------------------------------|-----------------------------------------|------------------------------------------------------|
| `mono`       | `oklch(58% calc(.20*cm) H)`             | `oklch(78% calc(.12*cm) H)`                          | `oklch(70% calc(.19*cm) H)`             | `oklch(88% calc(.10*cm) H)`                          |
| `contrast`   | `oklch(48% calc(.22*cm) H)`             | `oklch(85% calc(.09*cm) H)`                          | `oklch(62% calc(.21*cm) H)`             | `oklch(94% calc(.06*cm) H)`                          |
| `analogous`  | `oklch(60% calc(.20*cm) H)`             | `oklch(72% calc(.17*cm) calc(H + 40))`               | `oklch(70% calc(.19*cm) H)`             | `oklch(80% calc(.16*cm) calc(H + 40))`               |
| `complement` | `oklch(60% calc(.20*cm) H)`             | `oklch(70% calc(.17*cm) calc(H + 180))`              | `oklch(70% calc(.19*cm) H)`             | `oklch(78% calc(.16*cm) calc(H + 180))`              |
| `neutral`    | `oklch(58% calc(.20*cm) H)`             | `oklch(80% .015 H)`                                  | `oklch(70% calc(.19*cm) H)`             | `oklch(42% .02 H)`                                   |

`H = var(--hue)`, `cm = var(--chroma-mult, 1)`. `mono` is also the fallback for an unset/unknown variant.

### Overriding the ring colors

Set `--wc-spin-1` / `--wc-spin-2` inline on the element — an inline value **always wins** over the
variant (it beats the variant's attribute-selector rule):

```html
<wc-loader style="--wc-spin-1:#ff0080; --wc-spin-2:#00c2ff"></wc-loader>
<wc-loader type="double-ring" style="--wc-spin-1:#ff0080; --wc-spin-2:#00c2ff"></wc-loader>
```

## Overlay

`overlay` turns the host into a flex-centered, dimmed backdrop
(`background: color-mix(in srgb, var(--surface-1) 50%, transparent)`) that covers an area and
centers the spinner. Two positioning modes:

- **default** — `position: absolute; inset: 0`, covering the **nearest positioned ancestor**. Give
  that ancestor `position: relative` (otherwise it escapes up to the nearest positioned block or the
  viewport).
- **`fixed`** (or `overlay="fixed"`) — `position: fixed; inset: 0` (high `z-index`), covering the
  **viewport**. Use this when dropping the loader at `<body>` level with no positioned parent — the
  go-kart `#content-loader` case.

A **standalone** `overlay` (no `htmx-indicator`, not hidden) is a visible, interaction-blocking
loading screen.

### Overlay as a busy indicator (no wrapper markup)

Add `class="htmx-indicator"` to use the overlay directly as an HTMX/EventHub-driven busy indicator —
**no wrapper `<div>` needed**:

```html
<wc-loader id="content-loader" class="htmx-indicator" type="double-ring" variant="mono" overlay fixed></wc-loader>
```

- **Idle** (no `.htmx-request`): the overlay is `opacity:0; visibility:hidden; pointer-events:none`
  — fully invisible **and click-through** (elements behind it stay interactive).
- **Loading** (`.htmx-request` on the host — HTMX adds it to `hx-indicator` targets during a
  request): the dimmed backdrop + spinner appear and **block interaction**.

This is self-contained: the component sets `pointer-events`/`visibility` itself, because the stock
`.htmx-indicator { opacity: 0 }` rule leaves an absolutely-positioned backdrop still capturing
clicks while idle (that was the bug this fixes). The host class is kept **on the host** (not
relocated to the inner element) so the gating works, and it survives re-renders. Show/hide uses a
smooth `opacity` transition (disabled under `prefers-reduced-motion`).

## Accessibility

- The visible spinner carries `role="status"`, `aria-busy="true"`, and `aria-label` (from `label`, default `"Loading"`).
- Under `@media (prefers-reduced-motion: reduce)` the animation is slowed way down rather than frozen.

## Event API (EventHub)

```javascript
wc.EventHub.broadcast('wcloadershow',   ['#content-loader']);   // or ['[data-wc-id="…"]']
wc.EventHub.broadcast('wcloaderhide',   ['#content-loader']);
wc.EventHub.broadcast('wcloadertoggle', ['#content-loader']);
```

These drive the **host** (so an `overlay` backdrop shows/hides, not just the inner spinner) and work
**independently of HTMX**:
- **show** removes `.hidden` and adds `.wc-loader-show` — force-reveals the overlay (visible +
  `pointer-events:auto`) even for an idle `htmx-indicator`.
- **hide** adds `.hidden` → the host is `display:none` (fully removed + inert).
- **toggle** flips between the two.

## Technical Details

- Extends `WcBaseComponent`; No Shadow DOM; self-registers + exports `WcLoader`.
- All CSS is injected via `_applyStyle()` under a single `<style id="wc-loader-style">` — no dependency on `main.css`.
- Keyframes: `wc-loader-spin` (ring) and `wc-loader-dr-spin` (double-ring).

## Browser Support

Requires Custom Elements v1, CSS Animations, CSS Custom Properties, `oklch()`, and `color-mix()`
(matching the rest of the Wave CSS library).
