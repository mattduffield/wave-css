/**
 *
 *  Name: wc-loader
 *  Usage:
 *    <!-- Single-ring border spinner (DEFAULT — unchanged look/API) -->
 *    <wc-loader></wc-loader>
 *    <wc-loader size="45px" speed="0.75s" thickness="8px"></wc-loader>
 *
 *    <!-- Double-ring spinner (the go-kart #content-loader look), size-scalable -->
 *    <wc-loader type="double-ring"></wc-loader>
 *    <wc-loader type="double-ring" size="64px"></wc-loader>
 *
 *    <!-- Theme-derived ring colors (default variant "mono") -->
 *    <wc-loader variant="contrast"></wc-loader>
 *    <wc-loader type="double-ring" variant="complement"></wc-loader>
 *
 *    <!-- Full-area dimmed overlay (covers the nearest POSITIONED ancestor) -->
 *    <wc-loader type="double-ring" variant="mono" overlay></wc-loader>
 *
 *    <!-- Overlay AS AN HTMX BUSY INDICATOR — no wrapper needed. Idle = invisible + click-through;
 *         shown (dimmed backdrop + spinner, blocking clicks) only while .htmx-request is present.
 *         `fixed` makes it viewport-fixed so it can sit at <body> level with no positioned parent. -->
 *    <wc-loader id="content-loader" class="htmx-indicator" type="double-ring" variant="mono" overlay fixed></wc-loader>
 *
 *    <!-- Consumer color override (wins over the variant) -->
 *    <wc-loader style="--wc-spin-1:#ff0080; --wc-spin-2:#00c2ff"></wc-loader>
 *
 *  Attributes:
 *    type       ring (default) | double-ring   — spinner STYLE (structured for more later)
 *    variant    mono (default) | contrast | analogous | complement | neutral — ring COLORS,
 *               derived in OKLCH from the theme's --hue / --chroma-mult; sets --wc-spin-1/2
 *    size       CSS length; ring footprint (default 120px) / double-ring footprint (default 200px)
 *    speed      animation duration (ring default 2s, double-ring default 1s)
 *    thickness  ring border width (default 16px; ring only)
 *    overlay    boolean; center the spinner over a dimmed full-area backdrop.
 *               • Standalone (no htmx-indicator) → a visible blocking loading screen.
 *               • class="htmx-indicator" → idle is invisible + click-through + inert; the backdrop
 *                 appears + blocks only while the host has .htmx-request (HTMX adds it). No wrapper.
 *    fixed      boolean (or overlay="fixed"); make the overlay position:fixed over the viewport
 *               (drop at <body> level, no positioned parent needed). Non-fixed covers the nearest
 *               positioned ancestor — give that ancestor position:relative.
 *    label      aria-label text (default "Loading")
 *
 *  Color tokens (override inline to win over the variant):
 *    --wc-spin-1  primary ring (ring: moving arc; double-ring: outer ring + dot accents)
 *    --wc-spin-2  secondary ring (ring: track; double-ring: inner ring + dot accents)
 *    --wc-loader-size  alternative to `size` (same effect)
 *
 *  API (EventHub):
 *    wc.EventHub.broadcast('wcloadershow',   ['[data-wc-id="…"]'])
 *    wc.EventHub.broadcast('wcloaderhide',   ['[data-wc-id="…"]'])
 *    wc.EventHub.broadcast('wcloadertoggle', ['[data-wc-id="…"]'])
 *
 *  Fully self-styled: ALL CSS (keyframes, both styles, variants, overlay, reduced-motion)
 *  is injected via _applyStyle() — renders correctly with main.css NOT loaded.
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcLoader extends WcBaseComponent {
  static get is() {
    return 'wc-loader';
  }

  static get observedAttributes() {
    return ['id', 'class', 'type', 'variant', 'size', 'speed', 'thickness', 'overlay', 'fixed', 'label'];
  }

  constructor() {
    super();
    const compEl = this.querySelector('.wc-loader');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-loader');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _render() {
    super._render();
    this._buildStructure();
    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  // Build the inner DOM for the current `type`. Colors/size are driven by CSS vars, so a
  // structure rebuild is only needed when `type` changes.
  _buildStructure() {
    const el = this.componentElement;
    if (!el) return;
    const type = (this.getAttribute('type') || 'ring').toLowerCase();
    if (type === 'double-ring') {
      // Ported from the legacy #content-loader (.ldio) markup — 4 children: outer ring,
      // inner ring, and two dot-accent layers (each an inner <div> carrying :before/:after).
      el.innerHTML =
        '<div class="wc-loader-dr">' +
          '<div></div>' +
          '<div></div>' +
          '<div><div></div></div>' +
          '<div><div></div></div>' +
        '</div>';
    } else {
      el.innerHTML = '';
    }
    el.setAttribute('role', 'status');
    el.setAttribute('aria-busy', 'true');
    el.setAttribute('aria-label', this.getAttribute('label') || 'Loading');
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'type') {
      this._buildStructure();
    } else if (attrName === 'size') {
      this._setVar('--wc-loader-size', newValue);
    } else if (attrName === 'speed') {
      this._setVar('--wc-loader-speed', newValue);
    } else if (attrName === 'thickness') {
      this._setVar('--wc-loader-thickness', newValue);
    } else if (attrName === 'label') {
      this.componentElement?.setAttribute('aria-label', newValue || 'Loading');
    } else if (attrName === 'class') {
      // Keep author classes (htmx-indicator, hidden, …) ON THE HOST — the overlay/indicator CSS
      // keys off the host (wc-loader[overlay].htmx-indicator{…}). The base would relocate them to
      // the inner element and strip them off the host, silently breaking the indicator gating.
    } else if (attrName === 'variant' || attrName === 'overlay' || attrName === 'fixed') {
      // Styling reacts to the host attribute via CSS — nothing to stamp on the inner element.
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  // Size/speed/thickness are set as inherited custom properties on the HOST so a consumer's
  // inline overrides compose, and both `type`s consume them.
  _setVar(name, value) {
    if (value == null || value === '') this.style.removeProperty(name);
    else this.style.setProperty(name, value);
  }

  _applyStyle() {
    const cm = 'var(--chroma-mult, 1)';
    const h = 'var(--hue)';
    // Double-ring geometry scales off --s (default 200px): every legacy px is calc(n * --s / 200).
    const dr = (n) => `calc(${n} * var(--s) / 200)`;

    const style = `
      wc-loader { display: contents; }

      /* Full-area dimmed backdrop. Overrides display:contents so the host becomes the backdrop
         box. Non-fixed: covers the nearest POSITIONED ancestor (give that position:relative).
         A visible overlay intentionally blocks interaction (pointer-events default: auto). */
      wc-loader[overlay] {
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        inset: 0;
        background: color-mix(in srgb, var(--surface-1) 50%, transparent);
        z-index: 50;
        transition: opacity 0.2s ease, visibility 0s;
      }

      /* fixed → viewport-fixed backdrop so it can be dropped at <body> level with no positioned
         parent (the go-kart #content-loader case). Supports the fixed boolean or overlay=fixed. */
      wc-loader[overlay][fixed],
      wc-loader[overlay="fixed"] {
        position: fixed;
        z-index: 1000;
      }

      /* ── overlay AS AN HTMX BUSY INDICATOR ──────────────────────────────────────────────────
         Self-contained gating (htmx's own .htmx-indicator sets opacity ONLY — an idle absolute
         backdrop at opacity:0 still EATS clicks). Idle: invisible + click-through + inert.
         Shown only while .htmx-request is on the host (htmx adds it to hx-indicator targets). */
      wc-loader[overlay].htmx-indicator {
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.2s ease, visibility 0s linear 0.2s;
      }
      wc-loader[overlay].htmx-indicator.htmx-request {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
        transition: opacity 0.2s ease, visibility 0s;
      }

      /* ── Programmatic (EventHub) control — independent of HTMX ──────────────────────────────
         .hidden fully removes the loader (backdrop + spinner) → invisible + inert. .wc-loader-show
         force-reveals an overlay even when it's an idle htmx-indicator. */
      wc-loader.hidden { display: none !important; }
      wc-loader[overlay].wc-loader-show {
        opacity: 1 !important;
        visibility: visible !important;
        pointer-events: auto !important;
        /* Override the htmx-indicator's delayed visibility transition so a programmatic show
           reveals immediately (not after the 0.2s opacity fade). */
        transition: opacity 0.2s ease, visibility 0s !important;
      }

      /* ── Ring COLORS: --wc-spin-1/2 derived in OKLCH from the theme's --hue/--chroma-mult.
         :where() base = mono (0 specificity → also the fallback for an unknown variant);
         explicit variants + their .dark counterparts override it; inline --wc-spin-* wins. ── */
      :where(wc-loader)      { --wc-spin-1: oklch(58% calc(0.20 * ${cm}) ${h}); --wc-spin-2: oklch(78% calc(0.12 * ${cm}) ${h}); }
      :where(.dark wc-loader){ --wc-spin-1: oklch(70% calc(0.19 * ${cm}) ${h}); --wc-spin-2: oklch(88% calc(0.10 * ${cm}) ${h}); }

      wc-loader[variant="contrast"]        { --wc-spin-1: oklch(48% calc(0.22 * ${cm}) ${h}); --wc-spin-2: oklch(85% calc(0.09 * ${cm}) ${h}); }
      .dark wc-loader[variant="contrast"]  { --wc-spin-1: oklch(62% calc(0.21 * ${cm}) ${h}); --wc-spin-2: oklch(94% calc(0.06 * ${cm}) ${h}); }

      wc-loader[variant="analogous"]       { --wc-spin-1: oklch(60% calc(0.20 * ${cm}) ${h}); --wc-spin-2: oklch(72% calc(0.17 * ${cm}) calc(${h} + 40)); }
      .dark wc-loader[variant="analogous"] { --wc-spin-1: oklch(70% calc(0.19 * ${cm}) ${h}); --wc-spin-2: oklch(80% calc(0.16 * ${cm}) calc(${h} + 40)); }

      wc-loader[variant="complement"]      { --wc-spin-1: oklch(60% calc(0.20 * ${cm}) ${h}); --wc-spin-2: oklch(70% calc(0.17 * ${cm}) calc(${h} + 180)); }
      .dark wc-loader[variant="complement"]{ --wc-spin-1: oklch(70% calc(0.19 * ${cm}) ${h}); --wc-spin-2: oklch(78% calc(0.16 * ${cm}) calc(${h} + 180)); }

      wc-loader[variant="neutral"]         { --wc-spin-1: oklch(58% calc(0.20 * ${cm}) ${h}); --wc-spin-2: oklch(80% 0.015 ${h}); }
      .dark wc-loader[variant="neutral"]   { --wc-spin-1: oklch(70% calc(0.19 * ${cm}) ${h}); --wc-spin-2: oklch(42% 0.02 ${h}); }

      /* ── type="ring" (default): single border spinner. --wc-spin-1 = moving arc, --wc-spin-2 = track ── */
      wc-loader:not([type]) .wc-loader,
      wc-loader[type="ring"] .wc-loader {
        box-sizing: border-box;
        width: var(--wc-loader-size, 120px);
        height: var(--wc-loader-size, 120px);
        border-radius: 50%;
        border-style: solid;
        border-width: var(--wc-loader-thickness, 16px);
        border-color: var(--wc-spin-2);
        border-top-color: var(--wc-spin-1);
        animation: wc-loader-spin var(--wc-loader-speed, 2s) linear infinite;
      }

      /* ── type="double-ring": dual concentric counter-rotating rings + dot accents ── */
      wc-loader[type="double-ring"] .wc-loader {
        --s: var(--wc-loader-size, 200px);
        box-sizing: border-box;
        width: var(--s);
        height: var(--s);
        display: inline-block;
        overflow: hidden;
        background: none;
      }
      wc-loader[type="double-ring"] .wc-loader-dr {
        width: 100%;
        height: 100%;
        position: relative;
        transform: translateZ(0) scale(1);
        backface-visibility: hidden;
        transform-origin: 0 0;
      }
      wc-loader[type="double-ring"] .wc-loader-dr div { box-sizing: border-box; }
      wc-loader[type="double-ring"] .wc-loader-dr > div {
        position: absolute;
        width: ${dr(144)};
        height: ${dr(144)};
        top: ${dr(28)};
        left: ${dr(28)};
        border-radius: 50%;
        border: ${dr(16)} solid transparent;
        border-color: var(--wc-spin-1) transparent var(--wc-spin-1) transparent;
        animation: wc-loader-dr-spin var(--wc-loader-speed, 1s) linear infinite;
      }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(2),
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(4) {
        width: ${dr(108)};
        height: ${dr(108)};
        top: ${dr(46)};
        left: ${dr(46)};
        animation: wc-loader-dr-spin var(--wc-loader-speed, 1s) linear infinite reverse;
      }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(2) {
        border-color: transparent var(--wc-spin-2) transparent var(--wc-spin-2);
      }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(3) { border-color: transparent; }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(3) div {
        position: absolute; width: 100%; height: 100%; transform: rotate(45deg);
      }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(3) div:before,
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(3) div:after {
        content: ""; display: block; position: absolute;
        width: ${dr(16)}; height: ${dr(16)};
        top: ${dr(-16)}; left: ${dr(48)};
        background: var(--wc-spin-1); border-radius: 50%;
        box-shadow: 0 ${dr(128)} 0 0 var(--wc-spin-1);
      }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(3) div:after {
        left: ${dr(-16)}; top: ${dr(48)};
        box-shadow: ${dr(128)} 0 0 0 var(--wc-spin-1);
      }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(4) { border-color: transparent; }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(4) div {
        position: absolute; width: 100%; height: 100%; transform: rotate(45deg);
      }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(4) div:before,
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(4) div:after {
        content: ""; display: block; position: absolute;
        width: ${dr(16)}; height: ${dr(16)};
        top: ${dr(-16)}; left: ${dr(30)};
        background: var(--wc-spin-2); border-radius: 50%;
        box-shadow: 0 ${dr(92)} 0 0 var(--wc-spin-2);
      }
      wc-loader[type="double-ring"] .wc-loader-dr > div:nth-child(4) div:after {
        left: ${dr(-16)}; top: ${dr(30)};
        box-shadow: ${dr(92)} 0 0 0 var(--wc-spin-2);
      }

      /* Legacy: hiding the inner spinner element (kept for back-compat; EventHub now hides the host). */
      wc-loader .wc-loader.hidden { display: none !important; }

      @keyframes wc-loader-spin { to { transform: rotate(360deg); } }
      @keyframes wc-loader-dr-spin { 0% { transform: rotate(0); } 100% { transform: rotate(360deg); } }

      /* Respect reduced-motion: slow the animation right down rather than freezing it, and drop
         the overlay's opacity transition (show/hide snaps). */
      @media (prefers-reduced-motion: reduce) {
        wc-loader:not([type]) .wc-loader,
        wc-loader[type="ring"] .wc-loader,
        wc-loader[type="double-ring"] .wc-loader-dr > div {
          animation-duration: 6s !important;
        }
        wc-loader[overlay] { transition: none; }
      }
    `.trim();
    this.loadStyle('wc-loader-style', style);
  }

  _handleHelper(event, mode = 'show') {
    const { detail } = event;
    const { selector } = detail;
    const apply = (tgt) => {
      if (tgt !== this) return;
      // Drive the HOST so the overlay backdrop (not just the inner spinner) shows/hides, with
      // matching pointer-events. `.wc-loader-show` force-reveals even an idle htmx-indicator.
      if (mode === 'show') {
        this.classList.remove('hidden');
        this.classList.add('wc-loader-show');
      } else if (mode === 'hide') {
        this.classList.remove('wc-loader-show');
        this.classList.add('hidden');
      } else if (mode === 'toggle') {
        if (this.classList.contains('hidden')) {
          this.classList.remove('hidden');
          this.classList.add('wc-loader-show');
        } else {
          this.classList.remove('wc-loader-show');
          this.classList.add('hidden');
        }
      }
    };
    if (typeof selector === 'string' || Array.isArray(selector)) {
      document.querySelectorAll(selector).forEach(apply);
    } else {
      apply(document.querySelector(selector));
    }
  }

  _handleShow(event) { this._handleHelper(event, 'show'); }
  _handleHide(event) { this._handleHelper(event, 'hide'); }
  _handleToggle(event) { this._handleHelper(event, 'toggle'); }

  _wireEvents() {
    super._wireEvents();
    // Bind once so removeEventListener works on disconnect.
    this._onShow = this._handleShow.bind(this);
    this._onHide = this._handleHide.bind(this);
    this._onToggle = this._handleToggle.bind(this);
    document.body.addEventListener('wcloadershow', this._onShow);
    document.body.addEventListener('wcloaderhide', this._onHide);
    document.body.addEventListener('wcloadertoggle', this._onToggle);
  }

  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener('wcloadershow', this._onShow);
    document.body.removeEventListener('wcloaderhide', this._onHide);
    document.body.removeEventListener('wcloadertoggle', this._onToggle);
  }
}

customElements.define(WcLoader.is, WcLoader);
export { WcLoader };
