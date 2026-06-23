/**
 *
 *  Name: wc-gantt
 *  Usage:
 *    Horizontal Gantt / swimlane chart. Items with a start + end render as duration bars
 *    on a time axis, grouped into swimlanes by `group-field`. Zero-duration items (no end)
 *    render as milestone diamonds. The component owns rendering, scale/zoom, and pointer
 *    drag-to-move / resize; the HOST owns persistence via bubbling events.
 *
 *    <wc-gantt
 *        items='[{"id":"t1","label":"Design","start":"2026-06-01","end":"2026-06-10","lane":"Phase 1","color":"#3b82f6"}]'
 *        group-field="lane"
 *        scale="week"                 <!-- day | week | month -->
 *        link-template="/x/task/{id}">
 *    </wc-gantt>
 *
 *  Item shape (shared with wc-calendar / wc-kanban): { id, label, start, end?, <group-field>?, color? }.
 *  A two-date entity maps directly: start/end fields → start/end, a status/owner field → group-field.
 *
 *  Attributes:
 *    items        (required) — JSON array of items
 *    group-field             — swimlane grouping member (default "lane")
 *    scale                   — day | week | month (default week)
 *    link-template           — URL with {field} tokens; renders bars as <a href>
 *    readonly                — disable drag/resize
 *    label-field             — bar label member (default "label")
 *    id-field                — id member (default "id")
 *
 *  Events (bubbling, composed):
 *    wcganttchange — drag move/resize; detail { id, newStart, newEnd }  (ISO UTC, day-snapped)
 *    wcganttopen   — bar activated (no link); detail { id }
 *    (legacy colon aliases wc-gantt:change / :open also fired, deprecated)
 *
 *  NOTE: this is a sibling to wc-timeline (a vertical narrative timeline), NOT a mode of it —
 *  the two share no layout. Dependency arrows are intentionally out of scope for v1 (follow-up).
 *  htmx-safe: re-renders on items/scale/group-field change; initializes on dynamic insert.
 */

import { WcBaseComponent } from './wc-base-component.js';

const SCALES = {
  day: { pxPerDay: 34 },
  week: { pxPerDay: 20 },
  month: { pxPerDay: 6 }
};
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BAR_H = 22;
const ROW_GAP = 6;
const DRAG_THRESHOLD = 4;

class WcGantt extends WcBaseComponent {
  static get is() {
    return 'wc-gantt';
  }

  static get observedAttributes() {
    return ['id', 'class', 'items', 'group-field', 'scale', 'link-template', 'readonly', 'label-field', 'id-field'];
  }

  constructor() {
    super();
    this._items = [];
    this._drag = null;
    this._suppressClick = false;

    this._onClick = this._handleClick.bind(this);
    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);

    const compEl = this.querySelector(':scope > .wc-gantt');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-gantt');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  // ---- Public API -----------------------------------------------------------

  get items() { return this._items.map(i => i._raw); }
  set items(arr) { this.setAttribute('items', JSON.stringify(Array.isArray(arr) ? arr : [])); }
  get scale() { return SCALES[this.getAttribute('scale')] ? this.getAttribute('scale') : 'week'; }
  set scale(v) { this.setAttribute('scale', v); }
  refresh() { this._renderGantt(); }

  // ---- Lifecycle ------------------------------------------------------------

  _render() {
    super._render();
    this._readConfig();
    this._renderGantt();
    this._wireEvents();
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  _readConfig() {
    this._groupField = this.getAttribute('group-field') || 'lane';
    this._labelField = this.getAttribute('label-field') || 'label';
    this._idField = this.getAttribute('id-field') || 'id';
    this._linkTemplate = this.getAttribute('link-template') || '';
    this._prepareItems();
  }

  // ---- Date helpers (day-number math, UTC-noon anchored) --------------------

  _toDay(str) {
    if (!str) return null;
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(str) ? str + 'T12:00:00Z' : str);
    if (isNaN(d.getTime())) return null;
    return Math.floor(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12) / 86400000);
  }
  _dayToISO(dayNum) {
    return new Date(dayNum * 86400000).toISOString();
  }
  _dayParts(dayNum) {
    const d = new Date(dayNum * 86400000);
    return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), dow: d.getUTCDay() };
  }

  _prepareItems(rawList) {
    // Derive from an explicit raw list (after an optimistic drag) or the attribute —
    // re-parsing the stale attribute would revert an in-progress move/resize.
    const arr = rawList || this._parseJSON('items', []);
    this._items = arr.filter(it => it && it.start != null).map(it => {
      const s = this._toDay(String(it.start));
      let e = it.end != null ? this._toDay(String(it.end)) : null;
      const milestone = e == null || e <= s;
      if (milestone) e = s;
      return {
        _raw: it,
        id: it[this._idField] != null ? String(it[this._idField]) : '',
        label: it[this._labelField] != null ? String(it[this._labelField]) : '',
        lane: it[this._groupField] != null ? String(it[this._groupField]) : '—',
        color: it.color || '',
        _s: s, _e: e, milestone
      };
    }).filter(it => it._s != null);

    // Axis range (snapped to scale boundary), with one unit of padding.
    if (this._items.length) {
      const minS = Math.min(...this._items.map(i => i._s));
      const maxE = Math.max(...this._items.map(i => i._e));
      this._axisStart = this._snapStart(minS);
      this._axisEnd = this._snapEnd(maxE);
    } else {
      const today = this._toDay(new Date().toISOString());
      this._axisStart = this._snapStart(today);
      this._axisEnd = this._snapEnd(today + 14);
    }
  }

  _snapStart(dayNum) {
    const scale = this.scale;
    if (scale === 'day') return dayNum - 1;
    if (scale === 'week') return dayNum - this._dayParts(dayNum).dow; // back to Sunday
    const p = this._dayParts(dayNum); // month → first of month
    return Math.floor(Date.UTC(p.y, p.m, 1, 12) / 86400000);
  }
  _snapEnd(dayNum) {
    const scale = this.scale;
    if (scale === 'day') return dayNum + 1;
    if (scale === 'week') return dayNum + (6 - this._dayParts(dayNum).dow);
    const p = this._dayParts(dayNum); // month → last day of month
    return Math.floor(Date.UTC(p.y, p.m + 1, 0, 12) / 86400000);
  }

  _pxPerDay() { return SCALES[this.scale].pxPerDay; }
  _totalDays() { return this._axisEnd - this._axisStart + 1; }
  _totalWidth() { return this._totalDays() * this._pxPerDay(); }

  // ---- Rendering ------------------------------------------------------------

  _renderGantt() {
    if (!this.componentElement) return;
    this.componentElement.innerHTML = '';
    const px = this._pxPerDay();
    const totalWidth = this._totalWidth();

    // Header: lane-label spacer + axis ticks
    const header = document.createElement('div');
    header.classList.add('wc-gantt-header');
    const corner = document.createElement('div');
    corner.classList.add('wc-gantt-corner');
    header.appendChild(corner);
    const axis = document.createElement('div');
    axis.classList.add('wc-gantt-axis');
    axis.style.width = totalWidth + 'px';
    this._buildTicks().forEach(t => {
      const tick = document.createElement('div');
      tick.classList.add('wc-gantt-tick');
      tick.style.left = t.left + 'px';
      tick.style.width = t.width + 'px';
      tick.textContent = t.label;
      axis.appendChild(tick);
    });
    header.appendChild(axis);
    this.componentElement.appendChild(header);

    // Body: one swimlane per group, in first-seen order
    const body = document.createElement('div');
    body.classList.add('wc-gantt-body');

    const lanes = [];
    const laneMap = new Map();
    this._items.forEach(it => {
      if (!laneMap.has(it.lane)) { laneMap.set(it.lane, []); lanes.push(it.lane); }
      laneMap.get(it.lane).push(it);
    });

    lanes.forEach(laneName => {
      const laneItems = laneMap.get(laneName);
      const { rowCount } = this._packRows(laneItems);
      const trackHeight = rowCount * (BAR_H + ROW_GAP) + ROW_GAP;

      const lane = document.createElement('div');
      lane.classList.add('wc-gantt-lane');

      const label = document.createElement('div');
      label.classList.add('wc-gantt-lane-label');
      label.textContent = laneName;
      label.style.height = trackHeight + 'px';
      lane.appendChild(label);

      const track = document.createElement('div');
      track.classList.add('wc-gantt-lane-track');
      track.style.width = totalWidth + 'px';
      track.style.height = trackHeight + 'px';
      track.dataset.lane = laneName;

      laneItems.forEach(it => track.appendChild(this._buildBar(it, px)));
      lane.appendChild(track);
      body.appendChild(lane);
    });

    if (!lanes.length) {
      const empty = document.createElement('div');
      empty.classList.add('wc-gantt-empty');
      empty.textContent = 'No items';
      body.appendChild(empty);
    }

    this.componentElement.appendChild(body);
  }

  // Greedy row packing: each item in the first row whose last bar ends before it starts.
  _packRows(items) {
    const sorted = items.slice().sort((a, b) => a._s - b._s);
    const rowEnds = [];
    sorted.forEach(it => {
      let placed = false;
      for (let r = 0; r < rowEnds.length; r++) {
        if (it._s > rowEnds[r]) { it._row = r; rowEnds[r] = it._e; placed = true; break; }
      }
      if (!placed) { it._row = rowEnds.length; rowEnds.push(it._e); }
    });
    return { rowCount: Math.max(rowEnds.length, 1) };
  }

  _buildBar(it, px) {
    const left = (it._s - this._axisStart) * px;
    const top = ROW_GAP + it._row * (BAR_H + ROW_GAP);

    let bar;
    if (this._linkTemplate) {
      bar = document.createElement('a');
      bar.href = this._resolveTemplate(this._linkTemplate, it._raw);
    } else {
      bar = document.createElement('div');
      bar.setAttribute('role', 'button');
      bar.tabIndex = 0;
    }
    bar.dataset.id = it.id;
    // Pointer-based drag — disable native HTML5 drag (<a>/<img> default to draggable=true,
    // which would otherwise hijack the pointer interaction).
    bar.draggable = false;
    bar.style.left = left + 'px';
    bar.style.top = top + 'px';
    if (it.color) bar.style.setProperty('--bar-color', it.color);

    if (it.milestone) {
      bar.classList.add('wc-gantt-milestone');
      bar.title = it.label;
    } else {
      bar.classList.add('wc-gantt-bar');
      bar.style.width = Math.max((it._e - it._s + 1) * px, 6) + 'px';
      const lbl = document.createElement('span');
      lbl.classList.add('wc-gantt-bar-label');
      lbl.textContent = it.label;
      bar.appendChild(lbl);
      if (!this.hasAttribute('readonly')) {
        const lh = document.createElement('span');
        lh.classList.add('wc-gantt-handle', 'wc-gantt-handle-l');
        const rh = document.createElement('span');
        rh.classList.add('wc-gantt-handle', 'wc-gantt-handle-r');
        bar.appendChild(lh);
        bar.appendChild(rh);
      }
    }
    return bar;
  }

  _buildTicks() {
    const px = this._pxPerDay();
    const ticks = [];
    const scale = this.scale;
    let cur = this._axisStart;
    while (cur <= this._axisEnd) {
      const p = this._dayParts(cur);
      let span, label;
      if (scale === 'day') {
        span = 1;
        label = `${p.m + 1}/${p.d}`;
      } else if (scale === 'week') {
        span = 7;
        label = `${MONTHS[p.m]} ${p.d}`;
      } else {
        span = this._dayParts(Math.floor(Date.UTC(p.y, p.m + 1, 0, 12) / 86400000)).d; // days in month
        label = `${MONTHS[p.m]} ${String(p.y).slice(2)}`;
      }
      ticks.push({ left: (cur - this._axisStart) * px, width: span * px, label });
      cur += span;
    }
    return ticks;
  }

  // ---- Helpers --------------------------------------------------------------

  _parseJSON(attr, fallback) {
    const raw = this.getAttribute(attr);
    if (!raw) return fallback;
    try { const v = JSON.parse(raw); return v != null ? v : fallback; }
    catch (ex) { console.warn(`[wc-gantt] invalid JSON for ${attr}`, ex); return fallback; }
  }
  _resolveTemplate(tpl, obj) {
    return tpl.replace(/\{([^}]+)\}/g, (m, k) => (obj[k] != null ? encodeURIComponent(String(obj[k])) : ''));
  }

  // ---- Interaction: activate ------------------------------------------------

  _handleClick(e) {
    if (this._suppressClick) { this._suppressClick = false; e.preventDefault(); return; }
    const bar = e.target.closest('.wc-gantt-bar, .wc-gantt-milestone');
    if (!bar || !this.componentElement.contains(bar)) return;
    if (bar.tagName === 'A') return; // link navigates natively
    this._emitEvent('wcganttopen', 'wc-gantt:open', {
      bubbles: true, composed: true, detail: { id: bar.dataset.id }
    });
  }

  // ---- Interaction: pointer drag / resize -----------------------------------

  _handlePointerDown(e) {
    if (this.hasAttribute('readonly') || e.button !== 0) return;
    const bar = e.target.closest('.wc-gantt-bar, .wc-gantt-milestone');
    if (!bar) return;
    const it = this._items.find(x => x.id === bar.dataset.id);
    if (!it) return;
    let mode = 'move';
    if (e.target.classList.contains('wc-gantt-handle-l')) mode = 'resize-l';
    else if (e.target.classList.contains('wc-gantt-handle-r')) mode = 'resize-r';
    this._drag = { it, bar, mode, startX: e.clientX, origS: it._s, origE: it._e, moved: false };
    document.addEventListener('pointermove', this._onPointerMove);
    document.addEventListener('pointerup', this._onPointerUp);
  }

  _handlePointerMove(e) {
    const d = this._drag;
    if (!d) return;
    const dx = e.clientX - d.startX;
    if (!d.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
    d.moved = true;
    const px = this._pxPerDay();
    const deltaDays = Math.round(dx / px);
    let s = d.origS, ed = d.origE;
    if (d.mode === 'move') { s = d.origS + deltaDays; ed = d.origE + deltaDays; }
    else if (d.mode === 'resize-l') { s = Math.min(d.origS + deltaDays, d.origE); }
    else if (d.mode === 'resize-r') { ed = Math.max(d.origE + deltaDays, d.origS); }
    // Live visual feedback
    d.bar.style.left = (s - this._axisStart) * px + 'px';
    if (!d.it.milestone) d.bar.style.width = Math.max((ed - s + 1) * px, 6) + 'px';
    d._s = s; d._e = ed;
  }

  _handlePointerUp() {
    const d = this._drag;
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
    this._drag = null;
    if (!d || !d.moved) return;
    this._suppressClick = true; // a drag occurred — swallow the trailing click

    const it = d.it;
    it._s = d._s != null ? d._s : it._s;
    it._e = d._e != null ? d._e : it._e;
    if (it.milestone) it._e = it._s;

    const newStart = this._dayToISO(it._s);
    const newEnd = it.milestone ? null : this._dayToISO(it._e);

    // Optimistic model update (host rolls back by resetting `items`), then re-render.
    it._raw.start = newStart;
    if (!it.milestone) it._raw.end = newEnd;
    this._prepareItems(this._items.map(x => x._raw));
    this._renderGantt();

    this._emitEvent('wcganttchange', 'wc-gantt:change', {
      bubbles: true, composed: true, detail: { id: it.id, newStart, newEnd }
    });
  }

  // ---- Wiring ---------------------------------------------------------------

  _wireEvents() {
    super._wireEvents();
    const el = this.componentElement;
    el.removeEventListener('click', this._onClick);
    el.addEventListener('click', this._onClick);
    el.removeEventListener('pointerdown', this._onPointerDown);
    el.addEventListener('pointerdown', this._onPointerDown);
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.componentElement) {
      this.componentElement.removeEventListener('click', this._onClick);
      this.componentElement.removeEventListener('pointerdown', this._onPointerDown);
    }
    document.removeEventListener('pointermove', this._onPointerMove);
    document.removeEventListener('pointerup', this._onPointerUp);
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    if (['items', 'group-field', 'scale', 'link-template', 'readonly', 'label-field', 'id-field'].includes(attrName)) {
      this._readConfig();
      this._renderGantt();
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _applyStyle() {
    const style = `
      wc-gantt { display: contents; }

      @layer wc.usage {
        .wc-gantt {
          display: block;
          width: 100%;
          overflow-x: auto;
          background-color: var(--surface-2);
          border: 1px solid var(--surface-4);
          border-radius: 0.5rem;
          --wc-gantt-label-w: 140px;
        }
        .wc-gantt-header {
          display: flex;
          position: sticky;
          top: 0;
          z-index: 3;
          background-color: var(--surface-3);
          border-bottom: 1px solid var(--surface-4);
        }
        .wc-gantt-corner {
          flex: 0 0 var(--wc-gantt-label-w);
          position: sticky;
          left: 0;
          z-index: 4;
          background-color: var(--surface-3);
          border-right: 1px solid var(--surface-4);
        }
        .wc-gantt-axis { position: relative; height: 1.75rem; }
        .wc-gantt-tick {
          position: absolute;
          top: 0;
          height: 100%;
          display: flex;
          align-items: center;
          padding-left: 0.25rem;
          font-size: 0.7rem;
          color: var(--text-2, var(--component-alt-color));
          border-left: 1px solid var(--surface-4);
          white-space: nowrap;
          overflow: hidden;
        }
        .wc-gantt-body { display: flex; flex-direction: column; }
        .wc-gantt-lane { display: flex; border-bottom: 1px solid var(--surface-4); }
        .wc-gantt-lane-label {
          flex: 0 0 var(--wc-gantt-label-w);
          position: sticky;
          left: 0;
          z-index: 2;
          display: flex;
          align-items: center;
          padding: 0 0.5rem;
          font-size: 0.8rem;
          font-weight: 600;
          background-color: var(--surface-2);
          border-right: 1px solid var(--surface-4);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .wc-gantt-lane-track { position: relative; flex: 1 1 auto; }
        .wc-gantt-bar {
          position: absolute;
          height: ${BAR_H}px;
          display: flex;
          align-items: center;
          padding: 0 0.5rem;
          font-size: 0.72rem;
          color: var(--primary-color);
          background-color: var(--bar-color, var(--primary-bg-color));
          border-radius: 0.25rem;
          cursor: grab;
          text-decoration: none;
          overflow: hidden;
          user-select: none;
          touch-action: none;
        }
        .wc-gantt-bar:focus-visible,
        .wc-gantt-milestone:focus-visible {
          outline: 2px solid var(--text-1);
          outline-offset: 1px;
        }
        .wc-gantt-bar-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; pointer-events: none; }
        .wc-gantt-handle {
          position: absolute;
          top: 0;
          width: 6px;
          height: 100%;
          cursor: ew-resize;
        }
        .wc-gantt-handle-l { left: 0; }
        .wc-gantt-handle-r { right: 0; }
        .wc-gantt-milestone {
          position: absolute;
          width: ${BAR_H}px;
          height: ${BAR_H}px;
          background-color: var(--bar-color, var(--warning-color, #f59e0b));
          transform: translateX(-50%) rotate(45deg);
          border-radius: 3px;
          cursor: grab;
          touch-action: none;
        }
        wc-gantt[readonly] .wc-gantt-bar,
        wc-gantt[readonly] .wc-gantt-milestone { cursor: pointer; }
        .wc-gantt-empty {
          padding: 1.5rem;
          text-align: center;
          color: var(--text-3, var(--component-alt-color));
        }
      }
    `.trim();
    this.loadStyle('wc-gantt-style', style);
  }
}

customElements.define(WcGantt.is, WcGantt);
export { WcGantt };
