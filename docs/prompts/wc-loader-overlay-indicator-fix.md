# Prompt: Make `wc-loader overlay` a proper busy-indicator out of the box (no wrapper needed)

Repo: **wave-css** (`/Users/matthewduffield/Documents/_dev/wave-css`). No Shadow DOM, ES6,
esbuild. `wc-loader` was recently upgraded (`type` ring|double-ring, `variant`, `overlay`,
self-contained styling via `_applyStyle()`). Fix a real usability bug in `overlay`.

## The bug
Using `<wc-loader overlay class="htmx-indicator">` directly as a loading indicator FAILS:
the overlay backdrop (`wc-loader[overlay] { position:absolute; inset:0; z-index:50; background }`,
layered over the default `wc-loader { display:contents }`) **stays visible and captures clicks
when idle** — the standard `.htmx-indicator { opacity:0; pointer-events:none }` does not
reliably gate it across the `contents → flex/absolute` host switch. Consumers currently must
wrap it in a plain `<div class="htmx-indicator">` to get correct hide/click-through behavior.

## Goal
`<wc-loader overlay>` used as a busy indicator must be **invisible AND fully click-through when
idle**, and appear (dimmed backdrop + spinner, blocking interaction) **only while loading** —
driven by HTMX (`.htmx-request`) and/or the existing EventHub show/hide — with **zero wrapper
markup**. `go-kart` should be able to use a bare
`<wc-loader id="content-loader" class="htmx-indicator" type="double-ring" variant="mono" overlay fixed></wc-loader>`
and have it behave correctly.

## Requirements

1. **Indicator hiding (core fix).** When the host has the `htmx-indicator` class (standard HTMX
   convention) and is NOT in an `.htmx-request` state, the overlay must be fully hidden:
   `opacity: 0`, `pointer-events: none`, and effectively inert (consider `visibility: hidden`).
   When `.htmx-request` is present on the host (HTMX adds it to `hx-indicator` targets AND the
   triggering element), show it: `opacity: 1; pointer-events: auto`. Key the show rule off the
   host itself, e.g. `wc-loader[overlay].htmx-indicator` (hidden) and
   `wc-loader[overlay].htmx-indicator.htmx-request` (shown).

2. **`pointer-events` gating (the actual regression).** The overlay backdrop must NEVER capture
   pointer events unless it is genuinely visible/active. Gate `pointer-events` together with
   visibility in EVERY hidden state (idle htmx-indicator, EventHub-hidden, a `hidden` class).
   Blocking interaction while actually shown (during a load) is intended and correct.

3. **Preserve host classes.** Ensure the component does not strip/drop `htmx-indicator` (or other
   author classes) off the host during `_render()`/attribute processing — they must stay
   effective for the CSS above. Verify the class survives a re-render.

4. **Programmatic control.** The existing `wcloadershow|wcloaderhide|wcloadertoggle` EventHub
   events must show/hide the overlay (toggling the visible + pointer-events state), independent
   of HTMX.

5. **Standalone default unchanged.** `<wc-loader overlay>` with NO `htmx-indicator` and not
   hidden = a visible loading screen (backdrop + spinner), exactly as today.

6. **Coverage / positioning.** Keep default `overlay` covering the nearest positioned ancestor
   (`position:absolute; inset:0`), and ADD a `fixed` boolean (or `overlay="fixed"`) that makes
   the backdrop viewport-fixed (`position:fixed; inset:0`, high z-index) so it can be dropped at
   `body` level with no positioned parent — this is the go-kart `#content-loader` case. Document
   the containing-block requirement for the non-fixed case.

7. **Motion.** Smooth `opacity` transition on show/hide; honor `prefers-reduced-motion`.

8. **Conventions.** All CSS via `_applyStyle()` (self-contained), Wave lifecycle, no Shadow DOM,
   self-register, `index.js` import intact. Backward compatible with existing `wc-loader` usage.

## Deliverables
1. Updated `src/js/components/wc-loader.js`.
2. `docs/wc-loader.md`: document overlay-as-indicator (`htmx-indicator`), the `fixed` option, the
   pointer-events/hide behavior, and EventHub control.
3. `views/loader.html` demo: an overlay indicator layered over interactive content — a button
   BEHIND an idle overlay must be clickable; toggling `.htmx-request` (or firing an EventHub
   show) reveals the backdrop + spinner and blocks clicks.
4. Extend `tests/loader-test.py`: assert idle overlay-indicator is not visible AND
   `pointer-events:none`; `.htmx-request` state → visible AND `pointer-events:auto`; standalone
   overlay visible; EventHub show/hide toggles it.
5. `npm run build` clean.

## Acceptance criteria
- A `<button>` positioned behind an **idle** `<wc-loader overlay class="htmx-indicator">` is
  clickable (overlay is invisible + click-through when idle).
- Adding `.htmx-request` to that loader shows the dimmed backdrop + spinner and blocks clicks.
- `wcloadershow`/`wcloaderhide` toggle the overlay correctly with matching pointer-events.
- go-kart can drop the wrapper `<div>` and use a bare
  `<wc-loader id="content-loader" class="htmx-indicator" type="double-ring" variant="mono" overlay fixed>`
  with correct idle (hidden + interactive) and active (shown + blocking) behavior.
