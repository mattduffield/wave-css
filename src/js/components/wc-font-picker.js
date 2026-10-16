/**
 *
 *  Name: wc-font-picker
 *  Usage:
 *    A form-associated, searchable font chooser that previews every font in its own face —
 *    the generalised form of the SummitMemories designer's font preview picker. The closed
 *    control looks like a wc-select and shows the current font's name in that font; the
 *    popover has a search box, category chips, and Document fonts / Recent / All fonts sections.
 *
 *    <wc-font-picker name="font" value="georgia" lbl-label="Font"
 *        fonts='[{"id":"georgia","family":"Georgia","display_name":"Georgia","category":"serif"},
 *                {"id":"lobster","family":"Lobster","category":"display",
 *                 "url":"/fonts/lobster.woff2"}]'
 *        document-fonts='["georgia"]' recent-key="ps-recent-fonts"
 *        preview-text="Follow the Star" required></wc-font-picker>
 *
 *  Font entries: { id, family, display_name, category, url?, weights?, styles?, note?, badge? }
 *    value = id (or family when there is no id). `url` fonts are registered with the FontFace
 *    API the first time their row scrolls into view (IntersectionObserver) — never all at once —
 *    with a neutral placeholder until they load. `note` adds a small muted line; `badge`
 *    ({ text, variant }) adds a .badge chip (e.g. { text: "Not on cedar", variant: "warning" }).
 *
 *  Attributes:
 *    name, value, lbl-label, placeholder, required, disabled
 *    fonts            JSON array of font entries
 *    url              fetch the same JSON (array, { results: [...] }, or results-member)
 *    results-member   key holding the array in the fetched JSON
 *    document-fonts   JSON array of font values shown first, under "Document fonts"
 *    recent-key       localStorage key; enables the "Recent" section (last 8 picks)
 *    preview-text     sample line in each row (default "The quick brown fox"; "" hides it)
 *    categories       optional JSON array overriding chip order/labels:
 *                     ["serif","sans", …] or [{ "id": "slab", "label": "Slab serif" }, …].
 *                     Default: Serif, Sans Serif, Display, Script, Monospace + any others found.
 *
 *  Properties / methods:
 *    value (get/set), fonts (get/set array), open(), close(), refresh() (re-read `fonts`)
 *    el.renderPreview = (font, text) => Node | null   optional custom preview renderer (e.g. the
 *      designer's single-line SVG pen fonts); return null to use the default text preview.
 *
 *  Keyboard: on the closed control Enter/Space/↓ opens and typing opens with the search seeded.
 *    In the panel ↑/↓ (PageUp/PageDown, Home/End) move through fonts, Enter picks, Esc closes,
 *    and typing anywhere in the panel goes to the search box. role=listbox/option with
 *    aria-activedescendant on the search box.
 *
 *  Events (bubbling, composed; also broadcast through wc.EventHub with detail.custom):
 *    wcfontchange      { value, family }  a font was picked          (legacy wc-font-picker:change)
 *    wcfontpreview     { value, family }  hovering / arrowing a font (legacy wc-font-picker:preview)
 *    wcfontpreviewend  { value, family }  panel closed without a pick; value is the unchanged
 *                                         current font so the host can revert (legacy wc-font-picker:preview-end)
 *    wcoptionsloaded   { count }          fonts loaded from `url`     (legacy optionsloaded)
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';
import { WcPopover } from '../utils/wc-popover.js';

const CATEGORY_LABELS = {
  serif: 'Serif',
  sans: 'Sans Serif',
  'sans-serif': 'Sans Serif',
  sansserif: 'Sans Serif',
  display: 'Display',
  script: 'Script',
  handwriting: 'Script',
  monospace: 'Monospace',
  mono: 'Monospace',
  slab: 'Slab Serif',
  'slab-serif': 'Slab Serif',
};
const DEFAULT_CATEGORIES = ['serif', 'sans', 'display', 'script', 'monospace'];
const ROW_H = 54;          // font row with a sample line
const ROW_H_COMPACT = 34;  // font row without a sample line
const HEADER_H = 28;
const OVERSCAN = 6;
const RECENT_MAX = 8;

// family → 'loading' | 'loaded' | 'failed'  (shared by every picker on the page)
const fontState = new Map();
const fontLoads = new Map();

function canonicalCategory(c) {
  const k = String(c || '').trim().toLowerCase();
  if (!k) return 'other';
  if (k === 'sans-serif' || k === 'sansserif') return 'sans';
  if (k === 'handwriting') return 'script';
  if (k === 'mono') return 'monospace';
  if (k === 'slab-serif') return 'slab';
  return k;
}

function categoryLabel(id) {
  if (CATEGORY_LABELS[id]) return CATEGORY_LABELS[id];
  if (id === 'other') return 'Other';
  return id.replace(/[-_]+/g, ' ').replace(/\b\w/g, m => m.toUpperCase());
}

function cssFamily(family) {
  return `"${String(family).replace(/"/g, '\\"')}"`;
}

class WcFontPicker extends WcBaseFormComponent {
  static get is() {
    return 'wc-font-picker';
  }

  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'lbl-label', 'placeholder', 'required', 'disabled',
      'fonts', 'url', 'results-member', 'document-fonts', 'recent-key', 'preview-text', 'categories'];
  }

  constructor() {
    super();
    this._value = '';
    this._fonts = [];
    this._byValue = new Map();
    this._items = [];        // flattened rows for the open list: headers + fonts
    this._offsets = [];      // top offset of each item
    this._activeIndex = -1;
    this._lastPreview = null;
    this._picked = false;
    this._query = '';
    this._category = '';
    this._uid = `wcfp-${Math.random().toString(36).slice(2, 8)}`;
    this.renderPreview = null;
    if (this.hasAttribute('url')) this._deferReady = true;

    this._onTriggerClick = () => (this._popover.isOpen ? this.close() : this.open());
    this._onTriggerKeydown = this._handleTriggerKeydown.bind(this);
    this._onSearchInput = this._handleSearchInput.bind(this);
    this._onPanelKeydown = this._handlePanelKeydown.bind(this);
    this._onPanelClick = this._handlePanelClick.bind(this);
    this._onListOver = this._handleListOver.bind(this);
    this._onListScroll = () => this._scheduleRows();
    this._popover = new WcPopover(this, {
      minWidth: 300,
      maxHeight: 440,
      onClose: (reason) => this._handleClosed(reason),
    });

    const compEl = this.querySelector(':scope > .wc-font-picker');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-font-picker');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._value = this.getAttribute('value') || '';
    this._internals.setFormValue(this._value);
    this._loadFonts();
    this._renderTrigger();
    this._updateValidity();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._popover.close('disconnect');
    this._unWireEvents();
    this._triggerObserver?.disconnect();
  }

  // ---- Value contract (FACE) ------------------------------------------------

  get value() { return this._value; }
  set value(v) {
    this._value = v == null ? '' : String(v);
    this._internals.setFormValue(this._value);
    this._renderTrigger();
    this._updateValidity();
  }

  get fonts() { return this._fonts.slice(); }
  set fonts(list) {
    this._setFonts(Array.isArray(list) ? list : []);
  }

  get previewText() {
    return this.hasAttribute('preview-text') ? this.getAttribute('preview-text') : 'The quick brown fox';
  }

  open(seed = '') {
    if (this._popover.isOpen || this.hasAttribute('disabled')) return;
    this._picked = false;
    this._lastPreview = null;
    this._query = seed;
    this._category = '';
    this._buildPanel();
  }

  close() {
    this._popover.close('api');
  }

  refresh() {
    this._loadFonts();
  }

  // ---- Lifecycle ------------------------------------------------------------

  _render() {
    super._render();
    if (!this.componentElement.querySelector(':scope > .wc-font-picker-trigger')) {
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
    } else {
      this._triggerEl = this.componentElement.querySelector(':scope > .wc-font-picker-trigger');
    }
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  _buildSkeleton() {
    const labelText = this.getAttribute('lbl-label') || '';
    if (labelText) {
      const lbl = document.createElement('label');
      lbl.textContent = labelText;
      lbl.id = `${this._uid}-label`;
      this.componentElement.appendChild(lbl);
    }
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'wc-font-picker-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');
    if (labelText) trigger.setAttribute('aria-labelledby', `${this._uid}-label ${this._uid}-current`);
    trigger.disabled = this.hasAttribute('disabled');
    this.componentElement.appendChild(trigger);
    this._triggerEl = trigger;
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    switch (attrName) {
      case 'value':
        this.value = newValue || '';
        return;
      case 'fonts':
      case 'url':
      case 'results-member':
        this._loadFonts();
        return;
      case 'document-fonts':
      case 'recent-key':
      case 'preview-text':
      case 'categories':
        if (this._popover.isOpen) this._refreshPanel();
        return;
      case 'required':
        this._updateValidity();
        return;
      case 'placeholder':
        this._renderTrigger();
        return;
      case 'lbl-label':
      case 'disabled':
        this._popover.close('rebuild');
        this.componentElement.innerHTML = '';
        this._buildSkeleton();
        this._wireEvents();
        this._renderTrigger();
        return;
      default:
        super._handleAttributeChange(attrName, newValue, oldValue);
    }
  }

  // ---- Fonts ------------------------------------------------------------------

  _loadFonts() {
    const url = this.getAttribute('url');
    if (url) {
      const token = (this._fetchToken = {});
      fetch(url, { credentials: 'same-origin' })
        .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
        .then(data => {
          if (token !== this._fetchToken) return;
          const member = this.getAttribute('results-member');
          const list = member ? data?.[member] : (Array.isArray(data) ? data : data?.results);
          this._setFonts(Array.isArray(list) ? list : []);
          this._emitEvent('wcoptionsloaded', 'optionsloaded', {
            bubbles: true, composed: true, detail: { count: this._fonts.length },
          });
          this._setReady();
        })
        .catch(err => {
          console.warn('[wc-font-picker] failed to load fonts', err);
          this._setReady();
        });
      return;
    }
    let list = [];
    const raw = this.getAttribute('fonts');
    if (raw) {
      try {
        const v = JSON.parse(raw);
        if (Array.isArray(v)) list = v;
      } catch (err) {
        console.warn('[wc-font-picker] invalid fonts JSON', err);
      }
    }
    this._setFonts(list);
  }

  _setFonts(list) {
    this._fonts = list
      .filter(f => f && (f.family || f.id))
      .map(f => {
        const family = String(f.family || f.display_name || f.id);
        return {
          ...f,
          family,
          value: String(f.id ?? family),
          label: String(f.display_name || family),
          cat: canonicalCategory(f.category),
        };
      });
    this._byValue = new Map(this._fonts.map(f => [f.value, f]));
    this._renderTrigger();
    if (this._popover.isOpen) this._refreshPanel();
  }

  // Exact value first, then a family / display-name match (so a stored family name still resolves).
  _find(value) {
    if (!value) return null;
    if (this._byValue.has(value)) return this._byValue.get(value);
    const v = String(value).toLowerCase();
    return this._fonts.find(f => f.family.toLowerCase() === v || f.label.toLowerCase() === v) || null;
  }

  _ensureFont(font) {
    if (!font || !font.url) return Promise.resolve();
    const key = `${font.family}|${font.url}`;
    if (fontLoads.has(key)) return fontLoads.get(key);
    fontState.set(font.family, 'loading');
    const desc = {};
    if (Array.isArray(font.weights) && font.weights.length) {
      const ws = font.weights.map(Number).filter(Number.isFinite);
      if (ws.length) desc.weight = ws.length > 1 ? `${Math.min(...ws)} ${Math.max(...ws)}` : String(ws[0]);
    }
    if (Array.isArray(font.styles) && font.styles.length === 1) desc.style = font.styles[0];
    const promise = (async () => {
      try {
        const face = new FontFace(font.family, `url(${JSON.stringify(font.url)})`, desc);
        document.fonts.add(face);
        await face.load();
        fontState.set(font.family, 'loaded');
      } catch (err) {
        fontState.set(font.family, 'failed');
        console.warn(`[wc-font-picker] could not load "${font.family}"`, err);
      }
      document.querySelectorAll('.wc-font-picker-face').forEach(el => {
        if (el.dataset.family === font.family) this._applyFaceState(el, font);
      });
    })();
    fontLoads.set(key, promise);
    return promise;
  }

  _applyFaceState(el, font) {
    const state = font.url ? fontState.get(font.family) || 'idle' : 'loaded';
    el.classList.toggle('is-loading', state === 'loading' || state === 'idle');
    el.classList.toggle('is-failed', state === 'failed');
  }

  _faceEl(font, text, cls) {
    const custom = typeof this.renderPreview === 'function' ? this.renderPreview(font, text) : null;
    if (custom) {
      const wrap = document.createElement('span');
      wrap.className = `${cls} wc-font-picker-custom`;
      wrap.appendChild(custom);
      return wrap;
    }
    const el = document.createElement('span');
    el.className = `${cls} wc-font-picker-face`;
    el.textContent = text;
    el.dataset.family = font.family;
    el.style.fontFamily = `${cssFamily(font.family)}, system-ui, sans-serif`;
    this._applyFaceState(el, font);
    return el;
  }

  // ---- Trigger ----------------------------------------------------------------

  _renderTrigger() {
    const t = this._triggerEl;
    if (!t) return;
    t.innerHTML = '';
    const font = this._find(this._value);
    const current = document.createElement('span');
    current.className = 'wc-font-picker-current';
    current.id = `${this._uid}-current`;
    if (font) {
      current.appendChild(this._faceEl(font, font.label, 'wc-font-picker-current-name'));
      if (font.note) {
        const note = document.createElement('span');
        note.className = 'wc-font-picker-note';
        note.textContent = font.note;
        current.appendChild(note);
      }
      this._observeTrigger(font);
    } else if (this._value) {
      // Unknown value: show it in that family (it may be installed locally).
      const el = document.createElement('span');
      el.className = 'wc-font-picker-current-name';
      el.style.fontFamily = `${cssFamily(this._value)}, system-ui, sans-serif`;
      el.textContent = this._value;
      current.appendChild(el);
    } else {
      const ph = document.createElement('span');
      ph.className = 'wc-font-picker-current-name is-placeholder';
      ph.textContent = this.getAttribute('placeholder') || 'Choose a font';
      current.appendChild(ph);
    }
    const chev = document.createElement('span');
    chev.className = 'wc-font-picker-chevron';
    chev.setAttribute('aria-hidden', 'true');
    t.append(current, chev);
  }

  _observeTrigger(font) {
    if (!font.url) return;
    this._triggerObserver?.disconnect();
    this._triggerObserver = new IntersectionObserver((entries) => {
      if (entries.some(e => e.isIntersecting)) {
        this._triggerObserver.disconnect();
        this._ensureFont(font);
      }
    });
    this._triggerObserver.observe(this._triggerEl);
  }

  _updateValidity() {
    if (this.hasAttribute('required') && !this._value) {
      this._internals.setValidity({ valueMissing: true }, 'Please choose a font.', this._triggerEl || this);
    } else {
      this._internals.setValidity({});
    }
  }

  // ---- Panel --------------------------------------------------------------------

  _categories() {
    const raw = this.getAttribute('categories');
    if (raw) {
      try {
        const v = JSON.parse(raw);
        if (Array.isArray(v) && v.length) {
          return v.map(c => (typeof c === 'string'
            ? { id: canonicalCategory(c), label: categoryLabel(canonicalCategory(c)) }
            : { id: canonicalCategory(c.id), label: c.label || categoryLabel(canonicalCategory(c.id)) }));
        }
      } catch (err) {
        console.warn('[wc-font-picker] invalid categories JSON', err);
      }
    }
    const ids = [...DEFAULT_CATEGORIES];
    this._fonts.forEach(f => { if (!ids.includes(f.cat)) ids.push(f.cat); });
    return ids.map(id => ({ id, label: categoryLabel(id) }));
  }

  _buildChips(chips) {
    chips.innerHTML = '';
    const chip = (id, label) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'wc-font-picker-chip';
      b.dataset.category = id;
      b.textContent = label;
      b.setAttribute('aria-pressed', String(this._category === id));
      return b;
    };
    chips.appendChild(chip('', 'All'));
    this._categories().forEach(c => chips.appendChild(chip(c.id, c.label)));
  }

  // Fonts or section attributes changed while open: rebuild chips + rows, keep scroll.
  _refreshPanel() {
    if (!this._listEl) return;
    const scroll = this._listEl.scrollTop;
    const activeValue = this._items[this._activeIndex]?.font?.value;
    this._buildChips(this._chipsEl);
    this._buildItems();
    this._listEl.scrollTop = scroll;
    this._activeIndex = activeValue ? this._items.findIndex(it => it.font && it.font.value === activeValue) : -1;
    this._renderRows();
    this._syncActive();
  }

  _buildPanel() {
    const panel = document.createElement('div');
    panel.className = 'wc-font-picker-panel';

    const search = document.createElement('input');
    search.type = 'text';
    search.className = 'wc-font-picker-search';
    search.placeholder = 'Search fonts…';
    search.autocomplete = 'off';
    search.spellcheck = false;
    search.setAttribute('role', 'combobox');
    search.setAttribute('aria-expanded', 'true');
    search.setAttribute('aria-controls', `${this._uid}-list`);
    search.setAttribute('aria-autocomplete', 'list');
    search.setAttribute('aria-label', 'Search fonts');
    search.value = this._query;

    const chips = document.createElement('div');
    chips.className = 'wc-font-picker-chips';
    chips.setAttribute('role', 'toolbar');
    chips.setAttribute('aria-label', 'Font categories');
    this._buildChips(chips);

    const viewport = document.createElement('div');
    viewport.className = 'wc-font-picker-viewport';
    const list = document.createElement('div');
    list.className = 'wc-font-picker-list';
    list.id = `${this._uid}-list`;
    list.setAttribute('role', 'listbox');
    list.setAttribute('aria-label', 'Fonts');
    list.tabIndex = -1;
    const spacer = document.createElement('div');
    spacer.className = 'wc-font-picker-spacer';
    list.appendChild(spacer);
    const sticky = document.createElement('div');
    sticky.className = 'wc-font-picker-sticky';
    sticky.setAttribute('aria-hidden', 'true');
    const empty = document.createElement('div');
    empty.className = 'wc-font-picker-empty';
    empty.textContent = 'No fonts match';
    empty.hidden = true;
    viewport.append(list, sticky, empty);

    panel.append(search, chips, viewport);
    panel.addEventListener('keydown', this._onPanelKeydown);
    panel.addEventListener('click', this._onPanelClick);
    search.addEventListener('input', this._onSearchInput);
    list.addEventListener('scroll', this._onListScroll, { passive: true });
    list.addEventListener('pointerover', this._onListOver);

    this._popover.open(this._triggerEl, panel);
    this._panelEl = panel;
    this._chipsEl = chips;
    this._searchEl = search;
    this._listEl = list;
    this._spacerEl = spacer;
    this._stickyEl = sticky;
    this._emptyEl = empty;
    this._triggerEl.setAttribute('aria-expanded', 'true');

    this._rowObserver?.disconnect();
    this._rowObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        this._rowObserver.unobserve(entry.target);
        const font = this._find(entry.target.dataset.value);
        if (font) this._ensureFont(font);
      });
    }, { root: list, rootMargin: '120px 0px' });

    this._buildItems();
    const current = this._find(this._value)?.value;
    this._activeIndex = this._query
      ? this._items.findIndex(it => it.font)
      : this._items.findIndex(it => it.font && it.font.value === current);
    if (this._activeIndex >= 0) this._scrollToIndex(this._activeIndex, 'center');
    this._renderRows();
    this._syncActive();
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }

  _recentValues() {
    const key = this.getAttribute('recent-key');
    if (!key) return [];
    try {
      const v = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(v) ? v.map(String) : [];
    } catch (err) {
      return [];
    }
  }

  _pushRecent(value) {
    const key = this.getAttribute('recent-key');
    if (!key || !value) return;
    const list = [value, ...this._recentValues().filter(v => v !== value)].slice(0, RECENT_MAX);
    try { localStorage.setItem(key, JSON.stringify(list)); } catch (err) { /* storage full / blocked */ }
  }

  _documentValues() {
    const raw = this.getAttribute('document-fonts');
    if (!raw) return [];
    try {
      const v = JSON.parse(raw);
      return Array.isArray(v) ? v.map(String) : [];
    } catch (err) {
      console.warn('[wc-font-picker] invalid document-fonts JSON', err);
      return [];
    }
  }

  _matches(font) {
    if (this._category && font.cat !== this._category) return false;
    if (!this._query) return true;
    const q = this._query.toLowerCase();
    return font.label.toLowerCase().includes(q) || font.family.toLowerCase().includes(q) || font.cat.includes(q);
  }

  // Flatten the sections into rows: Document fonts, Recent, then All fonts grouped by
  // category (or one flat group while searching / filtering to a category).
  _buildItems() {
    const items = [];
    const push = (label, fonts) => {
      if (!fonts.length) return;
      items.push({ header: label });
      fonts.forEach(font => items.push({ font }));
    };
    const pick = (values) => values.map(v => this._find(v)).filter(f => f && this._matches(f));
    push('Document fonts', pick(this._documentValues()));
    push('Recent', pick(this._recentValues()));
    const all = this._fonts.filter(f => this._matches(f));
    if (this._query || this._category) {
      push(this._category ? categoryLabel(this._category) : 'All fonts', all);
    } else {
      const cats = this._categories().map(c => c.id);
      const groups = new Map();
      all.forEach(f => {
        if (!groups.has(f.cat)) groups.set(f.cat, []);
        groups.get(f.cat).push(f);
      });
      [...groups.keys()].sort((a, b) => {
        const ia = cats.indexOf(a);
        const ib = cats.indexOf(b);
        return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib);
      }).forEach(cat => push(`All fonts · ${categoryLabel(cat)}`, groups.get(cat)));
    }
    const rowH = this.previewText ? ROW_H : ROW_H_COMPACT;
    let y = 0;
    this._offsets = items.map(it => {
      const top = y;
      y += it.header ? HEADER_H : rowH;
      return top;
    });
    this._items = items;
    this._totalH = y;
    this._rowH = rowH;
    this._spacerEl.style.height = `${y}px`;
    this._emptyEl.hidden = items.length > 0;
    this._listEl.querySelectorAll('.wc-font-picker-row, .wc-font-picker-header').forEach(el => el.remove());
    this._rendered = new Map();
  }

  _indexAt(y) {
    let lo = 0;
    let hi = this._offsets.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (this._offsets[mid] <= y) lo = mid; else hi = mid - 1;
    }
    return lo;
  }

  _scheduleRows() {
    if (this._rowFrame) return;
    this._rowFrame = requestAnimationFrame(() => {
      this._rowFrame = 0;
      this._renderRows();
    });
  }

  _renderRows() {
    const list = this._listEl;
    if (!list || !this._items.length) {
      if (this._stickyEl) this._stickyEl.hidden = true;
      return;
    }
    const top = list.scrollTop;
    const bottom = top + list.clientHeight;
    const first = Math.max(0, this._indexAt(top) - OVERSCAN);
    const last = Math.min(this._items.length - 1, this._indexAt(bottom) + OVERSCAN);

    // Remove rows that left the window, add the ones that entered it.
    this._rendered.forEach((el, idx) => {
      if (idx < first || idx > last) { el.remove(); this._rendered.delete(idx); }
    });
    const frag = document.createDocumentFragment();
    for (let i = first; i <= last; i++) {
      if (this._rendered.has(i)) continue;
      const el = this._rowEl(i);
      this._rendered.set(i, el);
      frag.appendChild(el);
    }
    list.appendChild(frag);

    // Sticky section label: the header at or above the top edge.
    let h = this._indexAt(top);
    while (h > 0 && !this._items[h].header) h--;
    const header = this._items[h]?.header;
    this._stickyEl.hidden = !header || top <= 0;
    if (header) this._stickyEl.textContent = header;
  }

  _rowEl(i) {
    const item = this._items[i];
    const el = document.createElement('div');
    el.style.top = `${this._offsets[i]}px`;
    if (item.header) {
      el.className = 'wc-font-picker-header';
      el.setAttribute('role', 'presentation');
      el.textContent = item.header;
      return el;
    }
    const font = item.font;
    el.className = 'wc-font-picker-row';
    el.id = `${this._uid}-opt-${i}`;
    el.dataset.index = String(i);
    el.dataset.value = font.value;
    el.setAttribute('role', 'option');
    el.setAttribute('aria-label', font.label);
    el.setAttribute('aria-selected', String(this._find(this._value)?.value === font.value));
    el.classList.toggle('is-active', i === this._activeIndex);
    el.style.height = `${this._rowH}px`;

    const line = document.createElement('span');
    line.className = 'wc-font-picker-line';
    line.appendChild(this._faceEl(font, font.label, 'wc-font-picker-name'));
    if (font.badge && font.badge.text) {
      const b = document.createElement('span');
      b.className = `badge badge-${font.badge.variant || 'muted'} wc-font-picker-badge`;
      b.textContent = font.badge.text;
      line.appendChild(b);
    }
    el.appendChild(line);
    const sample = this.previewText;
    if (sample) {
      el.appendChild(this._faceEl(font, sample, 'wc-font-picker-sample'));
    } else if (font.note) {
      el.title = font.note;
    }
    if (sample && font.note) el.title = font.note;
    if (font.url && !fontState.has(font.family)) this._rowObserver.observe(el);
    return el;
  }

  _scrollToIndex(i, block = 'nearest') {
    const list = this._listEl;
    if (!list || i < 0) return;
    const top = this._offsets[i];
    const h = this._items[i].header ? HEADER_H : this._rowH;
    const viewTop = list.scrollTop + HEADER_H; // keep clear of the sticky label
    const viewBottom = list.scrollTop + list.clientHeight;
    if (block === 'center') list.scrollTop = Math.max(0, top - (list.clientHeight - h) / 2);
    else if (top < viewTop) list.scrollTop = Math.max(0, top - HEADER_H);
    else if (top + h > viewBottom) list.scrollTop = top + h - list.clientHeight;
  }

  _moveActive(delta, absolute) {
    const n = this._items.length;
    if (!n) return;
    let i = absolute != null ? absolute : this._activeIndex;
    const dir = delta >= 0 ? 1 : -1;
    if (absolute == null) {
      if (i < 0) i = dir > 0 ? -1 : n;
      let steps = Math.abs(delta);
      while (steps > 0) {
        let next = i + dir;
        while (next >= 0 && next < n && this._items[next].header) next += dir;
        if (next < 0 || next >= n) break;
        i = next;
        steps--;
      }
    } else {
      while (i >= 0 && i < n && this._items[i].header) i += dir;
    }
    if (i < 0 || i >= n || this._items[i].header) return;
    this._activeIndex = i;
    this._scrollToIndex(i);
    this._renderRows();
    this._syncActive();
    this._preview(this._items[i].font);
  }

  _syncActive() {
    if (!this._listEl) return;
    this._rendered?.forEach((el, idx) => el.classList.toggle('is-active', idx === this._activeIndex));
    if (this._activeIndex >= 0 && this._rendered?.has(this._activeIndex)) {
      this._searchEl.setAttribute('aria-activedescendant', `${this._uid}-opt-${this._activeIndex}`);
    } else {
      this._searchEl.removeAttribute('aria-activedescendant');
    }
  }

  _preview(font) {
    if (!font || this._lastPreview === font.value) return;
    this._lastPreview = font.value;
    this._ensureFont(font);
    this._notify('wcfontpreview', 'wc-font-picker:preview', { value: font.value, family: font.family });
  }

  _pick(font) {
    if (!font) return;
    this._picked = true;
    this._value = font.value;
    this._internals.setFormValue(this._value);
    this._pushRecent(font.value);
    this._renderTrigger();
    this._updateValidity();
    this._popover.close('pick');
    this._triggerEl.focus();
    this._notify('wcfontchange', 'wc-font-picker:change', { value: font.value, family: font.family });
  }

  _handleClosed(reason) {
    this._rowObserver?.disconnect();
    if (this._rowFrame) { cancelAnimationFrame(this._rowFrame); this._rowFrame = 0; }
    this._panelEl = null;
    this._listEl = null;
    this._triggerEl?.setAttribute('aria-expanded', 'false');
    if (reason === 'escape') this._triggerEl?.focus();
    if (!this._picked && reason !== 'rebuild') {
      const current = this._find(this._value);
      this._notify('wcfontpreviewend', 'wc-font-picker:preview-end', {
        value: this._value, family: current ? current.family : this._value,
      });
    }
  }

  // ---- Interaction --------------------------------------------------------------

  _handleTriggerKeydown(e) {
    if (this.hasAttribute('disabled')) return;
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.open();
    } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // Typing on the closed control opens it with the search seeded.
      e.preventDefault();
      this.open(e.key);
    }
  }

  _handleSearchInput() {
    this._query = this._searchEl.value.trim();
    this._buildItems();
    this._listEl.scrollTop = 0;
    this._activeIndex = this._items.findIndex(it => it.font);
    this._renderRows();
    this._syncActive();
  }

  _handlePanelKeydown(e) {
    const page = Math.max(1, Math.floor((this._listEl?.clientHeight || 300) / this._rowH) - 1);
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); this._moveActive(1); return;
      case 'ArrowUp': e.preventDefault(); this._moveActive(-1); return;
      case 'PageDown': e.preventDefault(); this._moveActive(page); return;
      case 'PageUp': e.preventDefault(); this._moveActive(-page); return;
      case 'Home':
        if (e.target === this._searchEl) return;
        e.preventDefault(); this._moveActive(1, 0); return;
      case 'End':
        if (e.target === this._searchEl) return;
        e.preventDefault(); this._moveActive(-1, this._items.length - 1); return;
      case 'Enter': {
        if (e.target.classList?.contains('wc-font-picker-chip')) return;
        e.preventDefault();
        const it = this._items[this._activeIndex];
        if (it && it.font) this._pick(it.font);
        return;
      }
      case 'Tab':
        return;
      default:
        // Typing anywhere in the panel goes to the search box.
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey && e.target !== this._searchEl) {
          this._searchEl.focus();
        }
    }
  }

  _handlePanelClick(e) {
    const chip = e.target.closest('.wc-font-picker-chip');
    if (chip) {
      this._category = chip.dataset.category === this._category ? '' : chip.dataset.category;
      this._panelEl.querySelectorAll('.wc-font-picker-chip').forEach(c =>
        c.setAttribute('aria-pressed', String(c.dataset.category === this._category)));
      this._buildItems();
      this._listEl.scrollTop = 0;
      this._activeIndex = this._items.findIndex(it => it.font);
      this._renderRows();
      this._syncActive();
      this._searchEl.focus();
      return;
    }
    const row = e.target.closest('.wc-font-picker-row');
    if (row) this._pick(this._items[Number(row.dataset.index)]?.font);
  }

  _handleListOver(e) {
    const row = e.target.closest('.wc-font-picker-row');
    if (!row) return;
    const i = Number(row.dataset.index);
    if (i !== this._activeIndex) {
      this._activeIndex = i;
      this._syncActive();
    }
    this._preview(this._items[i]?.font);
  }

  // ---- Wiring ---------------------------------------------------------------------

  _wireEvents() {
    this.formElement = null; // the search input must never become the form value
    super._wireEvents();
    if (this._triggerEl) {
      this._triggerEl.removeEventListener('click', this._onTriggerClick);
      this._triggerEl.removeEventListener('keydown', this._onTriggerKeydown);
      this._triggerEl.addEventListener('click', this._onTriggerClick);
      this._triggerEl.addEventListener('keydown', this._onTriggerKeydown);
    }
  }

  _unWireEvents() {
    super._unWireEvents();
    this._triggerEl?.removeEventListener('click', this._onTriggerClick);
    this._triggerEl?.removeEventListener('keydown', this._onTriggerKeydown);
  }

  _applyStyle() {
    const style = `
      wc-font-picker { display: contents; }

      @layer wc.usage {
        .wc-font-picker { display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; }
        .wc-font-picker > label { font-weight: 500; }
        wc-font-picker[required] .wc-font-picker > label::after { content: ' *'; font-weight: bold; }
        .wc-font-picker-trigger {
          position: relative;
          display: flex;
          align-items: center;
          width: 100%;
          min-height: 2.5rem;
          margin: 0;
          padding: 0.375rem 2rem 0.375rem 0.75rem;
          background-color: var(--component-bg-color, var(--surface-1));
          border: 1px solid var(--component-border-color, var(--surface-4));
          border-radius: 4px;
          color: var(--component-color, var(--text-1));
          font: inherit;
          line-height: 1.2;
          text-align: left;
          cursor: pointer;
        }
        .wc-font-picker-trigger:focus-visible { outline: 2px solid var(--primary-bg-color); outline-offset: 1px; }
        .wc-font-picker-trigger[aria-expanded="true"] { border-color: var(--primary-bg-color); }
        .wc-font-picker-trigger:disabled { opacity: 0.6; cursor: not-allowed; }
        .wc-font-picker-current { display: flex; flex-direction: column; min-width: 0; }
        .wc-font-picker-current-name {
          display: block;
          font-size: 1.1rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wc-font-picker-current-name.is-placeholder { font-size: 0.95rem; color: var(--text-3, var(--text-2)); }
        .wc-font-picker-note { display: block; font-size: 0.7rem; font-style: italic; color: var(--text-3, var(--text-2)); }
        .wc-font-picker-chevron {
          position: absolute;
          right: 0.75rem;
          top: 50%;
          width: 0.45rem;
          height: 0.45rem;
          border-right: 2px solid currentColor;
          border-bottom: 2px solid currentColor;
          transform: translateY(-70%) rotate(45deg);
          opacity: 0.55;
        }

        /* Placeholder until a web font has loaded: a neutral bar, no fallback-font flash. */
        .wc-font-picker-face.is-loading {
          color: transparent !important;
          background-color: var(--surface-3);
          border-radius: 0.25rem;
        }
        .wc-font-picker-face.is-failed { font-family: inherit !important; font-style: italic; }

        /* Panel lives on <body> */
        .wc-font-picker-panel {
          z-index: 10000;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          height: min(440px, 70vh);
          padding: 0.5rem;
          background-color: var(--surface-1);
          border: 1px solid var(--surface-4);
          border-radius: 0.6rem;
          box-shadow: 0 8px 28px color-mix(in srgb, var(--text-1) 22%, transparent);
          color: var(--text-1);
          font-size: 0.875rem;
        }
        .wc-font-picker-chips { display: flex; gap: 0.25rem; overflow-x: auto; padding-bottom: 0.125rem; flex: none; }
        .wc-font-picker-chip {
          flex: none;
          margin: 0;
          padding: 0.2rem 0.6rem;
          border: 1px solid var(--surface-4);
          border-radius: 999px;
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 0.75rem;
          cursor: pointer;
          white-space: nowrap;
        }
        .wc-font-picker-chip:hover { background-color: var(--surface-3); }
        .wc-font-picker-chip[aria-pressed="true"] {
          background-color: var(--primary-bg-color);
          border-color: var(--primary-bg-color);
          color: var(--wc-on-primary, var(--primary-color));
        }
        .wc-font-picker-chip:focus-visible { outline: 2px solid var(--primary-bg-color); outline-offset: 1px; }
        .wc-font-picker-viewport { position: relative; flex: 1 1 auto; min-height: 0; }
        .wc-font-picker-list { position: absolute; inset: 0; overflow-y: auto; overflow-x: hidden; outline: none; }
        .wc-font-picker-spacer { width: 1px; }
        .wc-font-picker-header,
        .wc-font-picker-sticky {
          position: absolute;
          left: 0;
          right: 0;
          height: ${HEADER_H}px;
          padding: 0.6rem 0.55rem 0;
          font-size: 0.7rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--text-3, var(--text-2));
          background-color: var(--surface-1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          box-sizing: border-box;
        }
        .wc-font-picker-sticky { top: 0; right: 0.75rem; z-index: 2; pointer-events: none; }
        .wc-font-picker-sticky[hidden] { display: none; }
        .wc-font-picker-row {
          position: absolute;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0.15rem;
          padding: 0 0.55rem;
          border: 1px solid transparent;
          border-radius: 0.4rem;
          cursor: pointer;
          box-sizing: border-box;
          overflow: hidden;
        }
        .wc-font-picker-row[aria-selected="true"] { background-color: var(--surface-3); }
        .wc-font-picker-row.is-active { border-color: var(--primary-bg-color); background-color: var(--surface-2); }
        .wc-font-picker-line { display: flex; align-items: center; gap: 0.5rem; min-width: 0; }
        .wc-font-picker-name {
          font-size: 1.15rem;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }
        .wc-font-picker-badge { flex: none; font-size: 0.6rem; }
        .wc-font-picker-sample {
          align-self: flex-start;
          max-width: 100%;
          font-size: 0.85rem;
          line-height: 1.2;
          color: var(--text-2, var(--text-1));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wc-font-picker-custom { display: block; max-width: 100%; overflow: hidden; }
        .wc-font-picker-empty { padding: 1.5rem 0.5rem; text-align: center; color: var(--text-3, var(--text-2)); }
        .wc-font-picker-empty[hidden] { display: none; }
        .theme-high-contrast .wc-font-picker-row.is-active { outline: 2px solid var(--text-1); outline-offset: -2px; }
      }

      /* Unlayered: wc.ui styles bare input and outranks wc.usage. */
      .wc-font-picker-search {
        flex: none;
        width: 100%;
        margin: 0;
        padding: 0.4rem 0.6rem;
        background-color: var(--surface-2);
        border: 1px solid var(--surface-4);
        border-radius: 0.4rem;
        color: var(--text-1);
        font: inherit;
        box-sizing: border-box;
      }
    `.trim();
    this.loadStyle('wc-font-picker-style', style);
  }
}

if (!customElements.get(WcFontPicker.is)) customElements.define(WcFontPicker.is, WcFontPicker);
export { WcFontPicker };
