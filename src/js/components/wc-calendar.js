/**
 *
 *  Name: wc-calendar
 *  Usage:
 *    Binds an array of record-like events onto a date grid (month / week / day /
 *    agenda). The component owns rendering, navigation, drag-to-reschedule and
 *    overflow; the HOST owns persistence via bubbling events.
 *
 *    <wc-calendar
 *        events='{{ Data.events|toJSON|safe }}'   <!-- [{id,title,start,end?,color?}], ISO dates -->
 *        view="month"                              <!-- month | week | day | agenda -->
 *        initial-date="2026-06-23"                 <!-- defaults to today -->
 *        week-starts-on="0"                        <!-- 0=Sun, 1=Mon -->
 *        timezone="local"                          <!-- local | utc | IANA name -->
 *        event-link-template="/x/appointment/{id}"
 *        selectable>
 *    </wc-calendar>
 *
 *  Attributes:
 *    events              (required) — JSON array of { id, title, start, end?, color? }
 *    view                           — month | week | day | agenda (default month)
 *    initial-date                   — YYYY-MM-DD focal date (default today)
 *    week-starts-on                 — 0 (Sun) or 1 (Mon); default 0
 *    timezone                       — local (default) | utc | IANA zone (e.g. America/Chicago)
 *    event-link-template            — URL with {field} tokens; renders events as <a href>
 *    selectable                     — clicking an empty day fires wccalendaradd
 *    readonly                       — no drag-to-reschedule
 *
 *  Events (bubbling, composed):
 *    wccalendarchange — drag reschedule; detail { id, newStart, newEnd }  (ISO strings; newEnd null if none)
 *    wccalendaradd    — selectable empty-day click; detail { date }       (YYYY-MM-DD)
 *    wccalendaropen   — event activated (no link); detail { id }
 *    wccalendarviewchange — view or period navigation; detail { view, date }
 *    (legacy colon aliases wc-calendar:change / :add / :open are also fired, deprecated)
 *
 *  TIMEZONE (documented behavior):
 *    Dates arrive as ISO UTC. Two rendering modes, chosen per-event:
 *      • Date-only values ("YYYY-MM-DD" or a UTC-midnight "...T00:00:00Z") are treated
 *        as FLOATING all-day dates — bucketed by their literal calendar date with NO
 *        zone conversion. This is correct for UTC-native business date fields (order_date,
 *        due_date) and avoids the classic off-by-one drift in zones west of UTC.
 *      • Datetime values are bucketed by their date in the configured `timezone`
 *        (browser-local by default; set timezone="utc" or an IANA name to pin).
 *    Reschedule shifts by whole days, preserving the original time-of-day and duration,
 *    and emits ISO UTC strings.
 *
 *  htmx-safe: re-renders when events / view / initial-date / timezone / week-starts-on change.
 *  Detail panel is host-side (pair with wc-sidenav). Per-view scope note: week/day place
 *  timed events as a time-ordered list within each day column (not an absolute hour grid);
 *  drag reschedules to a new DAY (time-of-day preserved). Hour-precise drag is future work.
 */

import { WcBaseComponent } from './wc-base-component.js';

const MAX_CHIPS = 3; // month-cell event chips before "+N more"
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DOW_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const pad2 = (n) => String(n).padStart(2, '0');

class WcCalendar extends WcBaseComponent {
  static get is() {
    return 'wc-calendar';
  }

  static get observedAttributes() {
    return [
      'id', 'class', 'events', 'view', 'initial-date', 'week-starts-on',
      'timezone', 'event-link-template', 'selectable', 'readonly'
    ];
  }

  constructor() {
    super();
    this._events = [];
    this._cursorKey = '';   // focal date YYYY-MM-DD
    this._dragId = null;

    this._onClick = this._handleClick.bind(this);
    this._onDragStart = this._handleDragStart.bind(this);
    this._onDragOver = this._handleDragOver.bind(this);
    this._onDrop = this._handleDrop.bind(this);
    this._onDragEnd = this._handleDragEnd.bind(this);

    const compEl = this.querySelector(':scope > .wc-calendar');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-calendar');
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

  get events() { return this._events.map(e => e._raw); }
  set events(arr) {
    this.setAttribute('events', JSON.stringify(Array.isArray(arr) ? arr : []));
  }
  get view() { return this.getAttribute('view') || 'month'; }
  set view(v) { this.setAttribute('view', v); }
  refresh() { this._renderCalendar(); }

  // ---- Lifecycle ------------------------------------------------------------

  _render() {
    super._render();
    this._readConfig();
    this._renderCalendar();
    this._wireEvents();
    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  _readConfig() {
    this._tz = this.getAttribute('timezone') || 'local';
    this._weekStart = this.getAttribute('week-starts-on') === '1' ? 1 : 0;
    this._linkTemplate = this.getAttribute('event-link-template') || '';
    this._prepareEvents();
    if (!this._cursorKey) {
      const init = this.getAttribute('initial-date');
      this._cursorKey = (init && /^\d{4}-\d{2}-\d{2}$/.test(init)) ? init : this._todayKey();
    }
  }

  // ---- Date / timezone helpers ---------------------------------------------

  _zoneParts(date) {
    const tz = this._tz;
    if (tz === 'utc') {
      return { y: date.getUTCFullYear(), m: date.getUTCMonth() + 1, d: date.getUTCDate(), hh: date.getUTCHours(), mm: date.getUTCMinutes() };
    }
    if (!tz || tz === 'local') {
      return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), hh: date.getHours(), mm: date.getMinutes() };
    }
    // IANA zone via Intl
    try {
      const f = new Intl.DateTimeFormat('en-US', {
        timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', hour12: false
      });
      const p = Object.fromEntries(f.formatToParts(date).map(x => [x.type, x.value]));
      return { y: +p.year, m: +p.month, d: +p.day, hh: +p.hour % 24, mm: +p.minute };
    } catch (ex) {
      return { y: date.getFullYear(), m: date.getMonth() + 1, d: date.getDate(), hh: date.getHours(), mm: date.getMinutes() };
    }
  }

  _zoneKey(date) {
    const p = this._zoneParts(date);
    return `${p.y}-${pad2(p.m)}-${pad2(p.d)}`;
  }

  _todayKey() { return this._zoneKey(new Date()); }

  // Calendar-date arithmetic anchored at UTC noon (DST-safe, zone-independent grid).
  _addDays(key, n) {
    const t = Date.parse(key + 'T12:00:00Z') + n * 86400000;
    const d = new Date(t);
    return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
  }
  _dow(key) { return new Date(key + 'T12:00:00Z').getUTCDay(); }
  _daysBetween(aKey, bKey) {
    return Math.round((Date.parse(bKey + 'T12:00:00Z') - Date.parse(aKey + 'T12:00:00Z')) / 86400000);
  }

  _isDateOnly(raw) {
    return /^\d{4}-\d{2}-\d{2}$/.test(raw) || /T00:00:00(\.0+)?Z?$/.test(raw);
  }

  _prepareEvents(rawList) {
    // Derive from an explicit raw list (after an optimistic drag) or the attribute.
    const arr = rawList || this._parseJSON('events', []);
    this._events = arr.filter(e => e && e.start != null).map(e => {
      const startRaw = String(e.start);
      const dateOnly = this._isDateOnly(startRaw);
      const startDate = new Date(/^\d{4}-\d{2}-\d{2}$/.test(startRaw) ? startRaw + 'T00:00:00Z' : startRaw);
      const startKey = dateOnly ? startRaw.slice(0, 10) : this._zoneKey(startDate);
      let endDate = null, endKey = startKey;
      if (e.end != null) {
        const endRaw = String(e.end);
        endDate = new Date(/^\d{4}-\d{2}-\d{2}$/.test(endRaw) ? endRaw + 'T00:00:00Z' : endRaw);
        endKey = this._isDateOnly(endRaw) ? endRaw.slice(0, 10) : this._zoneKey(endDate);
        if (endKey < startKey) endKey = startKey;
      }
      return {
        _raw: e, id: e.id != null ? String(e.id) : '', title: e.title != null ? String(e.title) : '',
        color: e.color || '', dateOnly, startDate, endDate, startKey, endKey,
        time: dateOnly ? '' : this._formatTime(startDate)
      };
    });
  }

  _formatTime(date) {
    const p = this._zoneParts(date);
    const h12 = ((p.hh + 11) % 12) + 1;
    const ampm = p.hh < 12 ? 'a' : 'p';
    return p.mm ? `${h12}:${pad2(p.mm)}${ampm}` : `${h12}${ampm}`;
  }

  _eventsForKey(key) {
    return this._events
      .filter(e => key >= e.startKey && key <= e.endKey)
      .sort((a, b) => {
        // All-day / multi-day spans render first, then timed events chronologically.
        const aAll = a.dateOnly ? 0 : 1, bAll = b.dateOnly ? 0 : 1;
        if (aAll !== bAll) return aAll - bAll;
        if (aAll === 1) {
          const t = a.startDate.getTime() - b.startDate.getTime();
          if (t) return t;
        }
        return a.title.localeCompare(b.title);
      });
  }

  // ---- Rendering ------------------------------------------------------------

  _renderCalendar() {
    if (!this.componentElement) return;
    const view = this.view;
    this.componentElement.innerHTML = '';
    this.componentElement.dataset.view = view;
    this.componentElement.appendChild(this._buildToolbar(view));

    const body = document.createElement('div');
    body.classList.add('wc-calendar-body');
    if (view === 'month') this._buildMonth(body);
    else if (view === 'week') this._buildDays(body, this._weekKeys(), 'week');
    else if (view === 'day') this._buildDays(body, [this._cursorKey], 'day');
    else this._buildAgenda(body);
    this.componentElement.appendChild(body);
  }

  _buildToolbar(view) {
    const bar = document.createElement('div');
    bar.classList.add('wc-calendar-toolbar');

    const nav = document.createElement('div');
    nav.classList.add('wc-calendar-nav');
    const mk = (cls, label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-sm';
      b.classList.add(cls);
      b.textContent = label;
      return b;
    };
    nav.appendChild(mk('wc-calendar-prev', '‹'));
    nav.appendChild(mk('wc-calendar-today', 'Today'));
    nav.appendChild(mk('wc-calendar-next', '›'));
    bar.appendChild(nav);

    const label = document.createElement('div');
    label.classList.add('wc-calendar-label');
    label.textContent = this._periodLabel(view);
    bar.appendChild(label);

    const switcher = document.createElement('div');
    switcher.classList.add('wc-calendar-views');
    ['month', 'week', 'day', 'agenda'].forEach(v => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-sm wc-calendar-view-btn';
      b.dataset.view = v;
      b.textContent = v.charAt(0).toUpperCase() + v.slice(1);
      if (v === view) b.classList.add('active');
      switcher.appendChild(b);
    });
    bar.appendChild(switcher);
    return bar;
  }

  _periodLabel(view) {
    const [y, m, d] = this._cursorKey.split('-').map(Number);
    if (view === 'month') return `${MONTHS[m - 1]} ${y}`;
    if (view === 'day') return `${DOW_LONG[this._dow(this._cursorKey)]}, ${MONTHS[m - 1]} ${d}, ${y}`;
    if (view === 'agenda') return 'Agenda';
    // week
    const keys = this._weekKeys();
    const [sy, sm, sd] = keys[0].split('-').map(Number);
    const [ey, em, ed] = keys[6].split('-').map(Number);
    if (sm === em) return `${MONTHS[sm - 1]} ${sd} – ${ed}, ${ey}`;
    return `${MONTHS[sm - 1]} ${sd} – ${MONTHS[em - 1]} ${ed}, ${ey}`;
  }

  _weekKeys() {
    const start = this._addDays(this._cursorKey, -(((this._dow(this._cursorKey) - this._weekStart) + 7) % 7));
    return Array.from({ length: 7 }, (_, i) => this._addDays(start, i));
  }

  _buildWeekdayHeader(parent, keys) {
    const head = document.createElement('div');
    head.classList.add('wc-calendar-weekdays');
    const order = Array.from({ length: 7 }, (_, i) => (this._weekStart + i) % 7);
    const labels = keys ? keys.map(k => `${DOW[this._dow(k)]} ${k.split('-')[2]}`) : order.map(i => DOW[i]);
    labels.forEach(l => {
      const c = document.createElement('div');
      c.classList.add('wc-calendar-weekday');
      c.textContent = l;
      head.appendChild(c);
    });
    parent.appendChild(head);
  }

  _buildMonth(parent) {
    this._buildWeekdayHeader(parent);
    const [y, m] = this._cursorKey.split('-').map(Number);
    const firstKey = `${y}-${pad2(m)}-01`;
    const gridStart = this._addDays(firstKey, -(((this._dow(firstKey) - this._weekStart) + 7) % 7));
    const today = this._todayKey();

    const grid = document.createElement('div');
    grid.classList.add('wc-calendar-grid');
    for (let i = 0; i < 42; i++) {
      const key = this._addDays(gridStart, i);
      const inMonth = +key.split('-')[1] === m;
      const cell = this._buildCell(key, { compact: true, today, inMonth });
      grid.appendChild(cell);
      if (i % 7 === 6 && i >= 27 && this._addDays(gridStart, i).split('-')[1] != pad2(m) && i >= 34) {
        // (rows beyond the month are still rendered to keep a stable 6-row grid)
      }
    }
    parent.appendChild(grid);
  }

  _buildDays(parent, keys, mode) {
    this._buildWeekdayHeader(parent, keys);
    const today = this._todayKey();
    const grid = document.createElement('div');
    grid.classList.add('wc-calendar-grid', mode === 'day' ? 'is-day' : 'is-week');
    keys.forEach(key => grid.appendChild(this._buildCell(key, { compact: false, today, inMonth: true })));
    parent.appendChild(grid);
  }

  _buildCell(key, { compact, today, inMonth }) {
    const cell = document.createElement('div');
    cell.classList.add('wc-calendar-cell');
    cell.dataset.date = key;
    if (!inMonth) cell.classList.add('is-out');
    if (key === today) cell.classList.add('is-today');
    if (this.hasAttribute('selectable')) cell.classList.add('is-selectable');

    if (compact) {
      const num = document.createElement('div');
      num.classList.add('wc-calendar-daynum');
      num.textContent = key.split('-')[2];
      cell.appendChild(num);
    }

    const list = document.createElement('div');
    list.classList.add('wc-calendar-events');
    const evts = this._eventsForKey(key);
    const limit = compact ? MAX_CHIPS : evts.length;
    evts.slice(0, limit).forEach(e => list.appendChild(this._buildEventChip(e, key)));
    if (compact && evts.length > limit) {
      const more = document.createElement('button');
      more.type = 'button';
      more.className = 'wc-calendar-more';
      more.dataset.date = key;
      more.textContent = `+${evts.length - limit} more`;
      list.appendChild(more);
    }
    cell.appendChild(list);
    return cell;
  }

  _buildEventChip(e, cellKey) {
    let chip;
    if (this._linkTemplate) {
      chip = document.createElement('a');
      chip.href = this._resolveTemplate(this._linkTemplate, e._raw);
    } else {
      chip = document.createElement('div');
      chip.setAttribute('role', 'button');
      chip.tabIndex = 0;
    }
    chip.classList.add('wc-calendar-event');
    chip.dataset.id = e.id;
    chip.draggable = !this.hasAttribute('readonly');
    if (e.color) {
      chip.style.setProperty('--event-color', e.color);
      chip.classList.add('has-color');
    }
    // span continuity classes
    if (e.startKey !== e.endKey) {
      chip.classList.add('is-span');
      if (cellKey === e.startKey) chip.classList.add('is-span-start');
      else if (cellKey === e.endKey) chip.classList.add('is-span-end');
      else chip.classList.add('is-span-mid');
    }
    if (e.time && cellKey === e.startKey) {
      const t = document.createElement('span');
      t.className = 'wc-calendar-event-time';
      t.textContent = e.time;
      chip.appendChild(t);
    }
    const title = document.createElement('span');
    title.className = 'wc-calendar-event-title';
    title.textContent = e.title;
    chip.appendChild(title);
    return chip;
  }

  _buildAgenda(parent) {
    const list = document.createElement('div');
    list.classList.add('wc-calendar-agenda');
    const sorted = this._events.slice().sort((a, b) =>
      (a.startKey + (a.time || '')).localeCompare(b.startKey + (b.time || '')));
    if (!sorted.length) {
      const empty = document.createElement('div');
      empty.classList.add('wc-calendar-empty');
      empty.textContent = 'No events';
      list.appendChild(empty);
      parent.appendChild(list);
      return;
    }
    let lastKey = null;
    sorted.forEach(e => {
      if (e.startKey !== lastKey) {
        lastKey = e.startKey;
        const [yy, mm, dd] = e.startKey.split('-').map(Number);
        const h = document.createElement('div');
        h.classList.add('wc-calendar-agenda-date');
        h.textContent = `${DOW[this._dow(e.startKey)]} ${MONTHS[mm - 1]} ${dd}, ${yy}`;
        list.appendChild(h);
      }
      const row = document.createElement('div');
      row.classList.add('wc-calendar-agenda-row');
      row.appendChild(this._buildEventChip(e, e.startKey));
      list.appendChild(row);
    });
    parent.appendChild(list);
  }

  // ---- Helpers --------------------------------------------------------------

  _parseJSON(attr, fallback) {
    const raw = this.getAttribute(attr);
    if (!raw) return fallback;
    try {
      const v = JSON.parse(raw);
      return v != null ? v : fallback;
    } catch (ex) {
      console.warn(`[wc-calendar] invalid JSON for ${attr}`, ex);
      return fallback;
    }
  }

  _resolveTemplate(tpl, obj) {
    return tpl.replace(/\{([^}]+)\}/g, (m, key) => {
      const v = obj[key];
      return v != null ? encodeURIComponent(String(v)) : '';
    });
  }

  // ---- Navigation -----------------------------------------------------------

  _navigate(dir) {
    const view = this.view;
    if (view === 'month' || view === 'agenda') {
      let [y, m, d] = this._cursorKey.split('-').map(Number);
      m += dir;
      if (m < 1) { m = 12; y--; } else if (m > 12) { m = 1; y++; }
      const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
      d = Math.min(d, lastDay);
      this._cursorKey = `${y}-${pad2(m)}-${pad2(d)}`;
    } else if (view === 'week') {
      this._cursorKey = this._addDays(this._cursorKey, dir * 7);
    } else {
      this._cursorKey = this._addDays(this._cursorKey, dir);
    }
    this._renderCalendar();
    this._emitViewChange();
  }

  _goToday() {
    this._cursorKey = this._todayKey();
    this._renderCalendar();
    this._emitViewChange();
  }

  _setView(v) {
    this.setAttribute('view', v); // triggers re-render via attribute change
  }

  _emitViewChange() {
    this._emitEvent('wccalendarviewchange', 'wc-calendar:viewchange', {
      bubbles: true, composed: true, detail: { view: this.view, date: this._cursorKey }
    });
  }

  // ---- Interaction ----------------------------------------------------------

  _handleClick(e) {
    const viewBtn = e.target.closest('.wc-calendar-view-btn');
    if (viewBtn) { this._setView(viewBtn.dataset.view); return; }
    if (e.target.closest('.wc-calendar-prev')) { this._navigate(-1); return; }
    if (e.target.closest('.wc-calendar-next')) { this._navigate(1); return; }
    if (e.target.closest('.wc-calendar-today')) { this._goToday(); return; }

    const more = e.target.closest('.wc-calendar-more');
    if (more) {
      this._cursorKey = more.dataset.date;
      this._setView('day');
      return;
    }

    const chip = e.target.closest('.wc-calendar-event');
    if (chip) {
      if (chip.tagName === 'A') return; // link navigates natively
      this._emitEvent('wccalendaropen', 'wc-calendar:open', {
        bubbles: true, composed: true, detail: { id: chip.dataset.id }
      });
      return;
    }

    // empty-day click → add (selectable)
    const cell = e.target.closest('.wc-calendar-cell');
    if (cell && this.hasAttribute('selectable')) {
      this._emitEvent('wccalendaradd', 'wc-calendar:add', {
        bubbles: true, composed: true, detail: { date: cell.dataset.date }
      });
    }
  }

  _handleKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const chip = e.target.closest('.wc-calendar-event');
    if (!chip || chip.tagName === 'A') return;
    e.preventDefault();
    this._emitEvent('wccalendaropen', 'wc-calendar:open', {
      bubbles: true, composed: true, detail: { id: chip.dataset.id }
    });
  }

  _handleDragStart(e) {
    const chip = e.target.closest('.wc-calendar-event');
    if (!chip || this.hasAttribute('readonly')) return;
    this._dragId = chip.dataset.id;
    chip.classList.add('dragging');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      try { e.dataTransfer.setData('text/plain', chip.dataset.id || ''); } catch (ex) {}
    }
  }

  _handleDragOver(e) {
    if (this._dragId == null) return;
    const cell = e.target.closest('.wc-calendar-cell');
    if (!cell) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    this.componentElement.querySelectorAll('.wc-calendar-cell.drag-over')
      .forEach(c => c.classList.remove('drag-over'));
    cell.classList.add('drag-over');
  }

  _handleDrop(e) {
    if (this._dragId == null) return;
    const cell = e.target.closest('.wc-calendar-cell');
    if (!cell) return;
    e.preventDefault();
    const targetKey = cell.dataset.date;
    const evt = this._events.find(x => x.id === this._dragId);
    if (!evt) return;
    const delta = this._daysBetween(evt.startKey, targetKey);
    if (delta !== 0) this._reschedule(evt, delta);
  }

  _handleDragEnd() {
    this.componentElement.querySelectorAll('.drag-over').forEach(c => c.classList.remove('drag-over'));
    const chip = this.componentElement.querySelector('.wc-calendar-event.dragging');
    if (chip) chip.classList.remove('dragging');
    this._dragId = null;
  }

  _reschedule(evt, dayDelta) {
    const ms = dayDelta * 86400000;
    const newStartDate = new Date(evt.startDate.getTime() + ms);
    const newEndDate = evt.endDate ? new Date(evt.endDate.getTime() + ms) : null;
    const newStart = evt.dateOnly
      ? `${this._addDays(evt.startKey, dayDelta)}T00:00:00.000Z`
      : newStartDate.toISOString();
    const newEnd = newEndDate
      ? (evt.dateOnly ? `${this._addDays(evt.endKey, dayDelta)}T00:00:00.000Z` : newEndDate.toISOString())
      : null;

    // Optimistic update of the in-memory model + raw object, then re-render.
    // Re-derive from the current raws (NOT the stale `events` attribute), so the
    // move sticks until the host either accepts it or rolls back by resetting `events`.
    evt._raw.start = newStart;
    if (newEnd != null) evt._raw.end = newEnd;
    this._prepareEvents(this._events.map(x => x._raw));
    this._renderCalendar();

    this._emitEvent('wccalendarchange', 'wc-calendar:change', {
      bubbles: true, composed: true, detail: { id: evt.id, newStart, newEnd }
    });
  }

  // ---- Wiring ---------------------------------------------------------------

  _wireEvents() {
    super._wireEvents();
    const el = this.componentElement;
    const pairs = [
      ['click', this._onClick], ['keydown', this._onKeydownBound || (this._onKeydownBound = this._handleKeydown.bind(this))],
      ['dragstart', this._onDragStart], ['dragover', this._onDragOver],
      ['drop', this._onDrop], ['dragend', this._onDragEnd]
    ];
    pairs.forEach(([type, fn]) => { el.removeEventListener(type, fn); el.addEventListener(type, fn); });
  }

  _unWireEvents() {
    super._unWireEvents();
    const el = this.componentElement;
    if (!el) return;
    [['click', this._onClick], ['keydown', this._onKeydownBound],
     ['dragstart', this._onDragStart], ['dragover', this._onDragOver],
     ['drop', this._onDrop], ['dragend', this._onDragEnd]]
      .forEach(([type, fn]) => fn && el.removeEventListener(type, fn));
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    if (['events', 'view', 'initial-date', 'week-starts-on', 'timezone',
         'event-link-template', 'selectable', 'readonly'].includes(attrName)) {
      if (attrName === 'initial-date' && newValue && /^\d{4}-\d{2}-\d{2}$/.test(newValue)) {
        this._cursorKey = newValue;
      }
      this._readConfig();
      this._renderCalendar();
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _applyStyle() {
    const style = `
      wc-calendar { display: contents; }

      @layer wc.usage {
        .wc-calendar {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          width: 100%;
          background-color: var(--surface-2);
          border: 1px solid var(--surface-4);
          border-radius: 0.5rem;
          padding: 0.75rem;
        }
        .wc-calendar-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .wc-calendar-nav { display: inline-flex; gap: 0.25rem; }
        .wc-calendar-label { font-weight: 600; font-size: 1rem; flex: 1 1 auto; text-align: center; }
        .wc-calendar-views { display: inline-flex; gap: 0.25rem; }
        .wc-calendar-view-btn.active {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
        }
        .wc-calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 1px;
        }
        .wc-calendar-weekday {
          padding: 0.25rem;
          font-size: 0.7rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
          color: var(--text-2, var(--component-alt-color));
          text-align: center;
        }
        .wc-calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 1px;
          background-color: var(--surface-4);
          border: 1px solid var(--surface-4);
          border-radius: 0.375rem;
          overflow: hidden;
        }
        .wc-calendar-grid.is-week { grid-auto-rows: minmax(180px, auto); }
        .wc-calendar-grid.is-day { grid-template-columns: 1fr; grid-auto-rows: minmax(360px, auto); }
        .wc-calendar-cell {
          background-color: var(--surface-2);
          min-height: 92px;
          padding: 0.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }
        .wc-calendar-grid.is-week .wc-calendar-cell,
        .wc-calendar-grid.is-day .wc-calendar-cell { overflow-y: auto; }
        .wc-calendar-cell.is-out { background-color: var(--surface-1, var(--surface-3)); opacity: 0.55; }
        .wc-calendar-cell.is-today .wc-calendar-daynum {
          background-color: var(--primary-bg-color);
          color: var(--primary-color);
          border-radius: 999px;
        }
        .wc-calendar-cell.is-selectable { cursor: pointer; }
        .wc-calendar-cell.drag-over { outline: 2px dashed var(--primary-bg-color); outline-offset: -2px; }
        .wc-calendar-daynum {
          align-self: flex-end;
          font-size: 0.75rem;
          min-width: 1.25rem;
          height: 1.25rem;
          line-height: 1.25rem;
          text-align: center;
        }
        .wc-calendar-events { display: flex; flex-direction: column; gap: 0.125rem; min-width: 0; }
        .wc-calendar-event {
          display: flex;
          align-items: baseline;
          gap: 0.25rem;
          padding: 0.0625rem 0.375rem;
          font-size: 0.75rem;
          border-radius: 0.25rem;
          background-color: var(--event-color, var(--primary-bg-color));
          color: var(--primary-color);
          text-decoration: none;
          cursor: grab;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wc-calendar-event.dragging { opacity: 0.5; cursor: grabbing; }
        .wc-calendar-event:focus-visible { outline: 2px solid var(--text-1); outline-offset: 1px; }
        .wc-calendar-event.is-span-mid,
        .wc-calendar-event.is-span-end { border-top-left-radius: 0; border-bottom-left-radius: 0; }
        .wc-calendar-event.is-span-start,
        .wc-calendar-event.is-span-mid { border-top-right-radius: 0; border-bottom-right-radius: 0; }
        .wc-calendar-event-time { font-weight: 600; opacity: 0.85; }
        .wc-calendar-event-title { overflow: hidden; text-overflow: ellipsis; }
        .wc-calendar-more {
          font-size: 0.7rem;
          color: var(--text-2, var(--component-alt-color));
          background: none;
          border: none;
          cursor: pointer;
          text-align: left;
          padding: 0 0.375rem;
        }
        .wc-calendar-more:hover { color: var(--primary-bg-color); text-decoration: underline; }
        .wc-calendar-agenda { display: flex; flex-direction: column; gap: 0.25rem; }
        .wc-calendar-agenda-date {
          font-weight: 600;
          font-size: 0.8rem;
          margin-top: 0.5rem;
          padding-bottom: 0.125rem;
          border-bottom: 1px solid var(--surface-4);
          color: var(--text-2, var(--component-alt-color));
        }
        .wc-calendar-agenda-row .wc-calendar-event { white-space: normal; }
        .wc-calendar-empty {
          padding: 1.5rem;
          text-align: center;
          color: var(--text-3, var(--component-alt-color));
        }
        wc-calendar[readonly] .wc-calendar-event { cursor: default; }

        @media (max-width: 640px) {
          .wc-calendar-label { order: -1; width: 100%; }
          .wc-calendar-cell { min-height: 64px; }
        }
      }
    `.trim();
    this.loadStyle('wc-calendar-style', style);
  }
}

customElements.define(WcCalendar.is, WcCalendar);
export { WcCalendar };
