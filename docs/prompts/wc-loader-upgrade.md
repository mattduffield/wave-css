# Prompt: Upgrade `wc-loader` — multiple spinner styles (single + double ring), self-contained styling, theme-derived colors

Repo: **wave-css** (`/Users/matthewduffield/Documents/_dev/wave-css`). Web-component library,
**no Shadow DOM**, ES6, esbuild. Components extend `WcBaseComponent`, use
`classList.add('contents')`, **inject ALL their own CSS via `_applyStyle()`** (one scoped
`<style>` string — see `wc-busy-indicator.js` for the exact pattern), self-register with
`customElements.define(X.is, X)`, and are imported in `src/js/components/index.js`.

UPGRADE the existing `src/js/components/wc-loader.js` (currently a single-ring border spinner).
Keep its public API backward-compatible.

## Core constraint: fully self-contained styling (no external CSS)
Every style the loader needs — keyframes, single-ring rules, double-ring rules + dot accents,
the color-variant rules, overlay, reduced-motion — MUST live inside the component's
`_applyStyle()` string, scoped under the component (`.wc-loader …`). The component must render
correctly **with `main.css` NOT loaded**. This mirrors how all other Wave components self-style
and lets us delete the loader CSS from `main.css` afterward (see Cleanup).

## Goal
`wc-loader` renders only a single ring today. Extend it to offer **multiple spinner styles**
via a new `type` attribute — including the **double-ring** spinner currently used as go-kart's
`#content-loader` — and give both styles the theme-aware, multi-variant ring colors below.

## 1. `type` attribute (spinner STYLE) — default `ring`
Add `type` to `observedAttributes`:
- `ring` — the existing single-ring border spinner (DEFAULT; preserves current look/API).
- `double-ring` — dual concentric counter-rotating rings, visually identical to today's
  `#content-loader` (`.ldio-qjspg5uvdp`).

Port the double-ring markup + CSS from `src/css/main.css` (~lines 11036–11135: `@keyframes` +
`> div:nth-child()` borders and the `:before/:after` dot accents) **into the component** —
its `_render()` builds the nested `<div>` structure, and `_applyStyle()` carries the CSS under
a stable component class (e.g. `.wc-loader--double-ring`), replacing the random `qjspg5uvdp`
id. Keep the two rings driven by `--wc-spin-1` / `--wc-spin-2` (and the dot accents) exactly as
they render now.

Make it **size-scalable**: the double-ring is hardcoded (144/108/28/46/16/128/92px). Parameterize
off `size` (or a `--wc-loader-size` var) with `calc()` so `type="double-ring" size="64px"` scales.
Preserve today's look at the current ~200px default footprint.

Structure the `type` switch so more styles (`dots`, `pulse`, …) can be added later without
restructuring.

## 2. `variant` attribute (ring COLORS) — default `mono`
Add `variant`: `mono | contrast | analogous | complement | neutral`. It sets `--wc-spin-1`
(primary ring) and `--wc-spin-2` (secondary ring), applied to BOTH `type`s (for `ring`, map
`--wc-spin-1` to the moving border, `--wc-spin-2` to the track). Derive in OKLCH from the
theme's own `--hue` / `--chroma-mult` (`cm = var(--chroma-mult, 1)`):

| variant | ring-1 (light) | ring-2 (light) | ring-1 (dark) | ring-2 (dark) |
|---|---|---|---|---|
| mono       | `oklch(58% calc(.20*cm) var(--hue))` | `oklch(78% calc(.12*cm) var(--hue))` | `oklch(70% calc(.19*cm) var(--hue))` | `oklch(88% calc(.10*cm) var(--hue))` |
| contrast   | `oklch(48% calc(.22*cm) var(--hue))` | `oklch(85% calc(.09*cm) var(--hue))` | `oklch(62% calc(.21*cm) var(--hue))` | `oklch(94% calc(.06*cm) var(--hue))` |
| analogous  | `oklch(60% calc(.20*cm) var(--hue))` | `oklch(72% calc(.17*cm) calc(var(--hue) + 40))`  | `oklch(70% calc(.19*cm) var(--hue))` | `oklch(80% calc(.16*cm) calc(var(--hue) + 40))` |
| complement | `oklch(60% calc(.20*cm) var(--hue))` | `oklch(70% calc(.17*cm) calc(var(--hue) + 180))` | `oklch(70% calc(.19*cm) var(--hue))` | `oklch(78% calc(.16*cm) calc(var(--hue) + 180))` |
| neutral    | `oklch(58% calc(.20*cm) var(--hue))` | `oklch(80% .015 var(--hue))` | `oklch(70% calc(.19*cm) var(--hue))` | `oklch(42% .02 var(--hue))` |

Emit a base rule + a `.dark`-ancestor rule per variant (match Wave's existing light/dark
selector convention). `--wc-spin-1/2` set inline by a consumer must win over the variant.

## 3. Preserve existing API + overlay + a11y
- Keep `size`, `speed`, `thickness`, `data-wc-id`, EventHub `wcloadershow|wcloaderhide|wcloadertoggle`,
  and HTMX `htmx-indicator` behavior exactly. Existing `<wc-loader>` usages render unchanged
  (default `type="ring"`, `variant="mono"`).
- Add `overlay` (boolean): center the spinner over a dimmed full-area backdrop (as `#content-loader` does).
- Accessibility: `role="status"`, `aria-busy="true"`, `aria-label` (default "Loading", via `label` attr);
  honor `@media (prefers-reduced-motion: reduce)` (pause/slow the animation).

## 4. Conventions
Extend `WcBaseComponent`; implement `static get is()`, `observedAttributes`, `_render()`,
`connectedCallback()` (call super), `_handleAttributeChange()` (re-render on `type`/`variant`),
and `_applyStyle()` (ALL CSS here, scoped). No Shadow DOM. Resolve `ready` per the base pattern.
Self-register + export; ensure the `index.js` import remains.

## 5. Cleanup (after the component is self-contained + verified)
- Remove the double-ring / `loadingio-spinner-double-ring` / `.ldio-qjspg5uvdp` block from
  `src/css/main.css` (and the single-ring `.wc-loader` CSS if it lived there) — the component
  now owns it. Rebuild and confirm nothing else referenced those rules.
- Migrate go-kart's `loader` fragment (`#content-loader`) to `<wc-loader type="double-ring"
  variant="mono" overlay>` so it no longer depends on the removed `main.css` rules. (Do this in
  the go-kart repo as a follow-up; note it here for coordination.)

## Deliverables
1. Upgraded `src/js/components/wc-loader.js` — both styles + variants, all CSS via `_applyStyle()`.
2. Updated `docs/wc-loader.md`: `type`, `variant` (swatch table), `overlay`, `label`, `--wc-spin-1/2` override, and the OKLCH derivation.
3. `views/loader.html` demo: both `type`s × all 5 `variant`s in light + dark, with a theme flipper.
4. `main.css` loader rules removed (Cleanup); `npm run build` clean; existing usages unaffected.

## Acceptance criteria
- `<wc-loader type="double-ring">` is visually identical to today's `#content-loader`, honors `variant`, and renders correctly **with `main.css`'s loader rules deleted**.
- `<wc-loader>` (no attrs) looks like the current single-ring loader.
- Both styles show two distinct rings in every theme (spot-check amber/55, midsky/230, high-contrast, gray) in light + dark; muted themes (chroma-mult 0) → grayscale.
- `size` scales the double-ring; reduced-motion + a11y honored; inline `--wc-spin-1/2` overrides win.
