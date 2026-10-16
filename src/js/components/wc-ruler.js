/**
 *
 *  Name: wc-ruler
 *  Usage:
 *    A horizontal or vertical ruler for a zoomable canvas (Publisher / InDesign style),
 *    drawn on a <canvas> so it stays crisp at any devicePixelRatio and cheap to redraw on
 *    every scroll / zoom frame (no DOM re-layout — state changes just schedule one rAF paint).
 *
 *    <wc-ruler id="hr" orientation="horizontal" unit="in" zoom="1" origin="40"
 *              length="612" selection="[72,216]" guides="[36,576]"
 *              partner="#vr" cursor-tracking></wc-ruler>
 *    <wc-ruler id="vr" orientation="vertical" unit="in" zoom="1" origin="24"
 *              length="792" partner="#hr" cursor-tracking></wc-ruler>
 *
 *  All positions are in POINTS (1pt = 1/72in). At zoom 1 a point is 96/72 CSS px.
 *
 *  Attributes:
 *    orientation      horizontal (default) | vertical
 *    unit             in (default) | cm | mm | pt | pc | px — labels + tick subdivisions
 *    zoom             scale factor, 1 = 100%
 *    origin           CSS px from the ruler's start edge where 0pt sits (track a scrolled page)
 *    length           page extent in points; [0, length] is drawn as "on page", the rest shaded
 *    selection        JSON [start, end] in points — highlighted band (selected object's extent)
 *    guides           JSON array of guide positions (points) along this ruler's axis
 *    partner          selector of the perpendicular ruler. Dragging a guide out of this ruler
 *                     measures it on the partner's axis (a guide dragged down from the top
 *                     ruler is a horizontal guide at a y position). Without a partner the
 *                     reported position is the distance from this ruler's edge.
 *    cursor-tracking  draw a hairline at the pointer position (follows pointermove on the page)
 *
 *  Methods (per-frame safe; update state without touching attributes):
 *    setOrigin(px), setZoom(z), setSelection(start, end) (no args clears),
 *    trackCursor(clientX | clientY) (null hides), setGuides(array),
 *    clientToPoints(clientCoord) → points along this ruler's axis, refreshTheme()
 *
 *  Events (bubbling, composed; also broadcast through wc.EventHub with detail.custom):
 *    wcrulerguidedrag    { position, axis, clientX, clientY }      while dragging a guide out
 *                        (legacy wc-ruler:guide-drag)
 *    wcrulerguidecreate  { position, axis, source: 'drag'|'dblclick' } on release / dblclick
 *                        (legacy wc-ruler:guide-create). Cancelable: unless the host calls
 *                        preventDefault(), the guide is added to the ruler that owns that axis
 *                        (the partner for a drag-out, this ruler for a double-click).
 *    wcrulerguidecancel  { axis }  a guide drag released back over the ruler (legacy wc-ruler:guide-cancel)
 *
 *  Theming: colors come from CSS custom properties resolved once per theme change
 *  (--wc-ruler-bg, --wc-ruler-page-bg, --wc-ruler-tick, --wc-ruler-text, --wc-ruler-accent,
 *  --wc-ruler-guide), all defaulting to Wave tokens. Size: --wc-ruler-size (default 22px).
 */

import { WcBaseComponent } from './wc-base-component.js';

const UNIT_PTS = { in: 72, cm: 72 / 2.54, mm: 72 / 25.4, pt: 1, pc: 12, px: 0.75 };
const PT_TO_PX = 96 / 72;
const COLOR_VARS = {
  bg: '--wc-ruler-bg',
  page: '--wc-ruler-page-bg',
  tick: '--wc-ruler-tick',
  text: '--wc-ruler-text',
  accent: '--wc-ruler-accent',
  guide: '--wc-ruler-guide',
};

if (!customElements.get('wc-ruler')) {
  class WcRuler extends WcBaseComponent {
    static get is() {
      return 'wc-ruler';
    }

    static get observedAttributes() {
      return ['id', 'class', 'orientation', 'unit', 'zoom', 'origin', 'length', 'selection',
        'guides', 'partner', 'cursor-tracking'];
    }

    constructor() {
      super();
      this._zoom = 1;
      this._origin = 0;
      this._length = 0;
      this._selection = null;
      this._guides = [];
      this._cursor = null;      // local CSS px along the axis, or null
      this._dragGuide = null;   // points; live marker for a guide being dragged (from partner)
      this._size = { w: 0, h: 0 };
      this._colors = null;
      this._frame = 0;
      this._drag = null;

      this._onResize = () => this._measure();
      this._onPointerDown = this._handlePointerDown.bind(this);
      this._onPointerMove = this._handlePointerMove.bind(this);
      this._onPointerUp = this._handlePointerUp.bind(this);
      this._onDblClick = this._handleDblClick.bind(this);
      this._onPagePointer = (e) => this.trackCursor(this.vertical ? e.clientY : e.clientX);
      this._onPageLeave = () => this.trackCursor(null);
      this._onThemeChange = () => this.refreshTheme();

      const compEl = this.querySelector(':scope > .wc-ruler');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-ruler');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._wireEvents();
      this._measure();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    // ---- Public API ---------------------------------------------------------

    get vertical() {
      return this.getAttribute('orientation') === 'vertical';
    }

    get unit() {
      const u = (this.getAttribute('unit') || 'in').toLowerCase();
      return UNIT_PTS[u] ? u : 'in';
    }

    get zoom() { return this._zoom; }
    get origin() { return this._origin; }
    get guides() { return this._guides.slice(); }
    get selection() { return this._selection ? this._selection.slice() : null; }

    setOrigin(px) {
      const v = Number(px);
      if (!Number.isFinite(v) || v === this._origin) return;
      this._origin = v;
      this._schedule();
    }

    setZoom(z) {
      const v = Number(z);
      if (!Number.isFinite(v) || v <= 0 || v === this._zoom) return;
      this._zoom = v;
      this._schedule();
    }

    setSelection(start, end) {
      const s = Number(start);
      const e = Number(end);
      this._selection = (Number.isFinite(s) && Number.isFinite(e)) ? [Math.min(s, e), Math.max(s, e)] : null;
      this._schedule();
    }

    setGuides(list) {
      this._guides = Array.isArray(list) ? list.map(Number).filter(Number.isFinite) : [];
      this._schedule();
    }

    trackCursor(clientCoord) {
      if (clientCoord == null || !this._canvas) {
        if (this._cursor === null) return;
        this._cursor = null;
      } else {
        const r = this._canvas.getBoundingClientRect();
        this._cursor = clientCoord - (this.vertical ? r.top : r.left);
      }
      this._schedule();
    }

    clientToPoints(clientCoord) {
      const r = this._canvas.getBoundingClientRect();
      const local = clientCoord - (this.vertical ? r.top : r.left);
      return this._pxToPts(local);
    }

    refreshTheme() {
      this._colors = null;
      this._schedule();
    }

    getDesignerHTML() {
      return '';
    }

    // ---- Lifecycle ----------------------------------------------------------

    _render() {
      super._render();
      // Styles first: pending attributes (e.g. orientation) can paint synchronously, and the
      // canvas colors are resolved from the CSS custom properties defined there.
      this._applyStyle();
      this._canvas = this.componentElement.querySelector(':scope > canvas');
      if (!this._canvas) {
        this._canvas = document.createElement('canvas');
        this._canvas.setAttribute('aria-hidden', 'true');
        this.componentElement.appendChild(this._canvas);
      }
      this._probe = this.componentElement.querySelector(':scope > .wc-ruler-probe');
      if (!this._probe) {
        this._probe = document.createElement('span');
        this._probe.className = 'wc-ruler-probe';
        this.componentElement.appendChild(this._probe);
      }
      this._ctx = this._canvas.getContext('2d');
      this.componentElement.setAttribute('role', 'presentation');
      this._syncOrientation();
      this._zoom = this._num('zoom', 1, v => v > 0);
      this._origin = this._num('origin', 0);
      this._length = this._num('length', 0, v => v >= 0);
      this._selection = this._parseSelection(this.getAttribute('selection'));
      this._guides = this._parseList(this.getAttribute('guides'));
    }

    _handleAttributeChange(attrName, newValue, oldValue) {
      switch (attrName) {
        case 'orientation':
          this._syncOrientation();
          this._measure();
          break;
        case 'unit':
          this._schedule();
          break;
        case 'zoom':
          this.setZoom(newValue == null ? 1 : newValue);
          break;
        case 'origin':
          this.setOrigin(newValue == null ? 0 : newValue);
          break;
        case 'length':
          this._length = Math.max(0, Number(newValue) || 0);
          this._schedule();
          break;
        case 'selection':
          this._selection = this._parseSelection(newValue);
          this._schedule();
          break;
        case 'guides':
          this._guides = this._parseList(newValue);
          this._schedule();
          break;
        case 'cursor-tracking':
          this._wireCursorTracking();
          if (newValue === null) this.trackCursor(null);
          break;
        case 'partner':
        case 'id':
          break;
        default:
          super._handleAttributeChange(attrName, newValue, oldValue);
      }
    }

    _syncOrientation() {
      this.componentElement.classList.toggle('wc-ruler-vertical', this.vertical);
      this.componentElement.classList.toggle('wc-ruler-horizontal', !this.vertical);
    }

    // ---- Geometry -----------------------------------------------------------

    get _scale() {
      return PT_TO_PX * this._zoom; // CSS px per point
    }

    _ptsToPx(pts) {
      return this._origin + pts * this._scale;
    }

    _pxToPts(px) {
      return (px - this._origin) / this._scale;
    }

    _measure() {
      if (!this._canvas) return;
      // The canvas sits inside the ruler's border — size the backing store to the canvas box.
      const r = this._canvas.getBoundingClientRect();
      this._size = { w: r.width, h: r.height };
      this._resizeCanvas();
    }

    _resizeCanvas() {
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.round(this._size.w * dpr));
      const h = Math.max(1, Math.round(this._size.h * dpr));
      if (this._canvas.width !== w) this._canvas.width = w;
      if (this._canvas.height !== h) this._canvas.height = h;
      this._dpr = dpr;
      this._paint(); // synchronous on resize so there's never a blank frame
    }

    _schedule() {
      if (this._frame || !this._ctx) return;
      this._frame = requestAnimationFrame(() => {
        this._frame = 0;
        this._paint();
      });
    }

    // Choose the labelled (major) step in units so labels never overlap, then how many
    // subdivisions fit (binary for inches/picas, decimal for metric/pt/px).
    _tickPlan(labelPx) {
      const unit = this.unit;
      const pxPerUnit = UNIT_PTS[unit] * this._scale;
      const binary = unit === 'in' || unit === 'pc';
      // Labels never overlap (label width + padding); inches/picas also prefer whole-unit
      // labels with fractional ticks between them, like Publisher.
      const minMajorPx = Math.max(labelPx + 14, binary ? 56 : 32);
      const candidates = [];
      if (binary) {
        [0.125, 0.25, 0.5].forEach(s => candidates.push(s));
      }
      for (let exp = -2; exp <= 6; exp++) {
        const p = Math.pow(10, exp);
        [1, 2, 5].forEach(m => candidates.push(m * p));
      }
      candidates.sort((a, b) => a - b);
      const major = candidates.find(s => s * pxPerUnit >= minMajorPx) || candidates[candidates.length - 1];
      const majorPx = major * pxPerUnit;

      // Subdivision levels, each halving (binary) or splitting the parent step.
      const levels = [];
      const minSubPx = binary ? 5 : 3.5; // metric rulers show mm ticks at 100% (≈3.8px apart)
      if (binary && major <= 1) {
        let div = 2;
        while (majorPx / div >= minSubPx && div <= 16) { levels.push(div); div *= 2; }
      } else {
        const lead = Math.round(major / Math.pow(10, Math.floor(Math.log10(major))));
        const splits = lead === 5 ? [5, 10] : lead === 2 ? (binary ? [2, 4, 8] : [2, 4]) : [2, 10];
        splits.forEach(div => { if (majorPx / div >= minSubPx) levels.push(div); });
      }
      return { major, majorPx, levels };
    }

    _formatLabel(units) {
      const v = Math.abs(units);
      if (Math.abs(v - Math.round(v)) < 1e-6) return String(Math.round(v));
      return String(parseFloat(v.toFixed(3)));
    }

    _resolveColors() {
      const out = {};
      Object.entries(COLOR_VARS).forEach(([key, prop]) => {
        this._probe.style.color = `var(${prop})`;
        out[key] = getComputedStyle(this._probe).color;
      });
      this._probe.style.color = '';
      const cs = getComputedStyle(this.componentElement);
      out.font = `${cs.getPropertyValue('--wc-ruler-font-size').trim() || '10px'} ${cs.fontFamily || 'system-ui, sans-serif'}`;
      return out;
    }

    _paint() {
      const ctx = this._ctx;
      if (!ctx) return;
      if (!this._colors) this._colors = this._resolveColors();
      const c = this._colors;
      const dpr = this._dpr || 1;
      const vertical = this.vertical;
      const len = vertical ? this._size.h : this._size.w;     // along the axis (CSS px)
      const thick = vertical ? this._size.w : this._size.h;   // across the axis
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, this._size.w, this._size.h);
      if (len <= 0 || thick <= 0) return;

      // Draw in axis space: x runs along the ruler, y across it (0 = outer edge).
      if (vertical) ctx.setTransform(0, dpr, dpr, 0, 0, 0); // swap axes: along → down

      const snap = (v) => Math.round(v * dpr) / dpr;
      const band = (from, to, color, alpha = 1) => {
        const a = Math.max(0, from);
        const b = Math.min(len, to);
        if (b <= a) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        ctx.fillRect(snap(a), 0, snap(b) - snap(a), thick);
        ctx.globalAlpha = 1;
      };

      band(0, len, c.bg);
      if (this._length > 0) band(this._ptsToPx(0), this._ptsToPx(this._length), c.page);
      if (this._selection) band(this._ptsToPx(this._selection[0]), this._ptsToPx(this._selection[1]), c.accent, 0.28);

      // Ticks + labels
      ctx.font = c.font;
      const unitPts = UNIT_PTS[this.unit];
      const sample = this._formatLabel(Math.max(Math.abs(this._pxToPts(0)), Math.abs(this._pxToPts(len))) / unitPts);
      const labelPx = Math.max(ctx.measureText(sample).width, ctx.measureText('00').width);
      const plan = this._tickPlan(labelPx);
      const stepPts = plan.major * unitPts;
      const firstPts = this._pxToPts(0);
      const lastPts = this._pxToPts(len);
      const startIdx = Math.floor(firstPts / stepPts) - 1;
      const endIdx = Math.ceil(lastPts / stepPts) + 1;
      const heights = [0.5, 0.35, 0.25, 0.18];
      const edge = thick; // ticks grow from the inner edge (bottom / right)

      ctx.fillStyle = c.tick;
      for (let i = startIdx; i <= endIdx; i++) {
        const base = this._ptsToPx(i * stepPts);
        if (base >= -plan.majorPx && base <= len + plan.majorPx) {
          // major tick: full height
          const x = snap(base);
          if (x >= 0 && x <= len) ctx.fillRect(x, 0, 1 / dpr * Math.max(1, Math.round(dpr)), thick);
          // subdivisions: the finest level first so coarser ticks overdraw it
          for (let l = plan.levels.length - 1; l >= 0; l--) {
            const div = plan.levels[l];
            const h = thick * heights[Math.min(l, heights.length - 1)];
            for (let k = 1; k < div; k++) {
              const sx = snap(base + (plan.majorPx * k) / div);
              if (sx < 0 || sx > len) continue;
              ctx.fillRect(sx, edge - h, 1 / dpr * Math.max(1, Math.round(dpr)), h);
            }
          }
        }
      }

      // Labels. The vertical axis-swap above is a reflection, so text gets its own
      // transform there: rotated 90° clockwise, reading top to bottom.
      ctx.fillStyle = c.text;
      if (vertical) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.textBaseline = vertical ? 'bottom' : 'top';
      for (let i = startIdx; i <= endIdx; i++) {
        const x = this._ptsToPx(i * stepPts);
        if (x < -labelPx || x > len) continue;
        const text = this._formatLabel((i * stepPts) / unitPts);
        if (vertical) {
          ctx.save();
          ctx.translate(2, Math.round(x) + 3);
          ctx.rotate(Math.PI / 2);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        } else {
          ctx.fillText(text, Math.round(x) + 3, 2);
        }
      }
      if (vertical) ctx.setTransform(0, dpr, dpr, 0, 0, 0);

      // Guides (and a live marker for a guide being dragged toward this ruler's axis)
      const marker = (px, color, alpha = 1) => {
        if (px < 0 || px > len) return;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = color;
        const x = snap(px);
        ctx.fillRect(x - 1 / dpr, 0, 2 / dpr * Math.max(1, Math.round(dpr)), thick);
        ctx.beginPath();
        ctx.moveTo(x - 4, thick);
        ctx.lineTo(x + 4, thick);
        ctx.lineTo(x, thick - 5);
        ctx.closePath();
        ctx.fill();
        ctx.globalAlpha = 1;
      };
      this._guides.forEach(g => marker(this._ptsToPx(g), c.guide));
      if (this._dragGuide != null) marker(this._ptsToPx(this._dragGuide), c.guide, 0.6);

      if (this._cursor != null && this._cursor >= 0 && this._cursor <= len) {
        ctx.fillStyle = c.text;
        ctx.fillRect(snap(this._cursor), 0, 1 / dpr * Math.max(1, Math.round(dpr)), thick);
      }
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    // ---- Guides -------------------------------------------------------------

    get _partner() {
      const sel = this.getAttribute('partner');
      if (!sel) return null;
      try {
        const el = document.querySelector(sel);
        return el && el !== this && typeof el.clientToPoints === 'function' ? el : null;
      } catch (err) {
        return null;
      }
    }

    _crossAxis() {
      return this.vertical ? 'x' : 'y'; // a guide dragged out of a vertical ruler is vertical (an x position)
    }

    _dragPosition(e) {
      const partner = this._partner;
      if (partner) return partner.clientToPoints(this.vertical ? e.clientX : e.clientY);
      const r = this._canvas.getBoundingClientRect();
      const offset = this.vertical ? e.clientX - r.right : e.clientY - r.bottom;
      return offset / this._scale;
    }

    _handlePointerDown(e) {
      if (e.button !== 0) return;
      e.preventDefault();
      this._canvas.setPointerCapture(e.pointerId);
      this._drag = { id: e.pointerId, out: false, everOut: false };
    }

    _handlePointerMove(e) {
      if (!this._drag || e.pointerId !== this._drag.id) return;
      const r = this._canvas.getBoundingClientRect();
      const outside = this.vertical ? e.clientX > r.right : e.clientY > r.bottom;
      if (!outside && !this._drag.out) return; // still on the ruler
      this._drag.out = outside;
      if (outside) this._drag.everOut = true;
      const position = this._dragPosition(e);
      const partner = this._partner;
      if (partner) partner._setDragGuide(outside ? position : null);
      if (!outside) return;
      this._notify('wcrulerguidedrag', 'wc-ruler:guide-drag', {
        position, axis: this._crossAxis(), clientX: e.clientX, clientY: e.clientY,
      });
    }

    _handlePointerUp(e) {
      if (!this._drag || e.pointerId !== this._drag.id) return;
      const { out: wasOut, everOut } = this._drag;
      this._drag = null;
      const partner = this._partner;
      if (partner) partner._setDragGuide(null);
      if (!wasOut) {
        // Dragged out and back onto the ruler = cancel. A plain click is not a drag.
        if (everOut) this._notify('wcrulerguidecancel', 'wc-ruler:guide-cancel', { axis: this._crossAxis() });
        return;
      }
      const position = this._dragPosition(e);
      this._createGuide(position, this._crossAxis(), 'drag', partner);
    }

    _handleDblClick(e) {
      const position = this.clientToPoints(this.vertical ? e.clientY : e.clientX);
      this._createGuide(position, this.vertical ? 'y' : 'x', 'dblclick', this);
    }

    _createGuide(position, axis, source, owner) {
      const detail = { position: Math.round(position * 100) / 100, axis, source };
      const evt = new CustomEvent('wcrulerguidecreate', { bubbles: true, composed: true, cancelable: true, detail });
      this.dispatchEvent(evt);
      this.dispatchEvent(new CustomEvent('wc-ruler:guide-create', { bubbles: true, composed: true, detail }));
      window.wc?.EventHub?.broadcast('wcrulerguidecreate', `[data-wc-id="${this.wcId}"]`, '', detail);
      if (!evt.defaultPrevented && owner) owner.setGuides([...owner.guides, detail.position]);
    }

    _setDragGuide(pts) {
      this._dragGuide = pts;
      this._schedule();
    }

    // ---- Helpers --------------------------------------------------------------

    _num(attr, fallback, valid = () => true) {
      const v = parseFloat(this.getAttribute(attr));
      return Number.isFinite(v) && valid(v) ? v : fallback;
    }

    _parseList(raw) {
      if (!raw) return [];
      try {
        const v = JSON.parse(raw);
        return Array.isArray(v) ? v.map(Number).filter(Number.isFinite) : [];
      } catch (err) {
        console.warn('[wc-ruler] invalid guides JSON', err);
        return [];
      }
    }

    _parseSelection(raw) {
      const list = this._parseList(raw);
      return list.length >= 2 ? [Math.min(list[0], list[1]), Math.max(list[0], list[1])] : null;
    }

    // ---- Wiring ---------------------------------------------------------------

    _wireCursorTracking() {
      window.removeEventListener('pointermove', this._onPagePointer);
      document.documentElement.removeEventListener('pointerleave', this._onPageLeave);
      if (this.hasAttribute('cursor-tracking') && this.isConnected) {
        window.addEventListener('pointermove', this._onPagePointer, { passive: true });
        document.documentElement.addEventListener('pointerleave', this._onPageLeave);
      }
    }

    _wireEvents() {
      super._wireEvents();
      this._unWireEvents();
      this._resizeObserver = new ResizeObserver(this._onResize);
      this._resizeObserver.observe(this.componentElement);
      // Re-render crisply when the window moves to a display with a different DPR.
      this._dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      this._onDprChange = () => { this._measure(); this._dprQuery.removeEventListener('change', this._onDprChange); this._wireDpr(); };
      this._dprQuery.addEventListener('change', this._onDprChange);
      // Canvas colors are resolved once; refresh when the theme classes change.
      this._themeObserver = new MutationObserver(this._onThemeChange);
      this._themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
      if (document.body) this._themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
      this._schemeQuery = matchMedia('(prefers-color-scheme: dark)');
      this._schemeQuery.addEventListener('change', this._onThemeChange);

      this._canvas.addEventListener('pointerdown', this._onPointerDown);
      this._canvas.addEventListener('pointermove', this._onPointerMove);
      this._canvas.addEventListener('pointerup', this._onPointerUp);
      this._canvas.addEventListener('pointercancel', this._onPointerUp);
      this._canvas.addEventListener('dblclick', this._onDblClick);
      this._wireCursorTracking();
    }

    _wireDpr() {
      this._dprQuery = matchMedia(`(resolution: ${window.devicePixelRatio || 1}dppx)`);
      this._dprQuery.addEventListener('change', this._onDprChange);
    }

    _unWireEvents() {
      super._unWireEvents();
      this._resizeObserver?.disconnect();
      this._themeObserver?.disconnect();
      this._dprQuery?.removeEventListener('change', this._onDprChange);
      this._schemeQuery?.removeEventListener('change', this._onThemeChange);
      if (this._canvas) {
        this._canvas.removeEventListener('pointerdown', this._onPointerDown);
        this._canvas.removeEventListener('pointermove', this._onPointerMove);
        this._canvas.removeEventListener('pointerup', this._onPointerUp);
        this._canvas.removeEventListener('pointercancel', this._onPointerUp);
        this._canvas.removeEventListener('dblclick', this._onDblClick);
      }
      window.removeEventListener('pointermove', this._onPagePointer);
      document.documentElement.removeEventListener('pointerleave', this._onPageLeave);
      if (this._frame) { cancelAnimationFrame(this._frame); this._frame = 0; }
    }

    _applyStyle() {
      const style = `
        wc-ruler { display: contents; }

        @layer wc.usage {
          .wc-ruler {
            --wc-ruler-bg: var(--surface-2);
            --wc-ruler-page-bg: var(--surface-1);
            --wc-ruler-tick: var(--text-3, var(--text-2));
            --wc-ruler-text: var(--text-2, var(--text-1));
            --wc-ruler-accent: var(--primary-bg-color);
            --wc-ruler-guide: var(--info-color, var(--primary-bg-color));
            position: relative;
            overflow: hidden;
            user-select: none;
            touch-action: none;
            font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
            color: var(--wc-ruler-text);
          }
          .wc-ruler-horizontal {
            width: 100%;
            height: var(--wc-ruler-size, 22px);
            border-bottom: 1px solid var(--surface-4);
            cursor: s-resize;
          }
          .wc-ruler-vertical {
            width: var(--wc-ruler-size, 22px);
            height: 100%;
            border-right: 1px solid var(--surface-4);
            cursor: e-resize;
          }
          .wc-ruler > canvas {
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            display: block;
          }
          .wc-ruler-probe {
            position: absolute;
            width: 0;
            height: 0;
            overflow: hidden;
            pointer-events: none;
          }
          .theme-high-contrast .wc-ruler {
            --wc-ruler-tick: var(--text-1);
            --wc-ruler-text: var(--text-1);
          }
        }
      `.trim();
      this.loadStyle('wc-ruler-style', style);
    }
  }

  customElements.define('wc-ruler', WcRuler);
}
