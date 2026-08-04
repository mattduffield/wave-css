/**
 *  Name: wc-record-lookup
 *  Usage:
 *    <!-- match-at-entry hint on a child name -->
 *    <wc-record-lookup mode="hint" endpoint="/x/lookup/attendee"
 *                      param-master_event="{{Event.master_id}}" lbl-label="Child name"></wc-record-lookup>
 *
 *    <!-- "use this family": fill parent fields + emit for a children load -->
 *    <wc-record-lookup mode="fill" endpoint="/x/lookup/household"
 *        fill-map='{"parents.0.first_name":"primary.first_name","parents.0.address_street":"address.street"}'>
 *    </wc-record-lookup>
 *
 *  Description:
 *    A typeahead that searches an EXISTING collection via a server endpoint and, on select,
 *    either emits the chosen record or fills sibling form fields. Powers "match-at-entry" hints,
 *    "use this family", and generic attach-existing flows. THE SERVER IS THE SOURCE OF TRUTH —
 *    the component only displays what the endpoint returns (which should be tenant-scoped and
 *    display-safe). Never blocks typing.
 *
 *  Attributes (observed):
 *    - endpoint     : GET URL returning a JSON array of result objects; the component appends
 *                     `?q=<query>` plus any `param-*` attributes as query params.
 *    - min-chars    : min characters before searching (default 2)
 *    - debounce     : ms to debounce input (default 300)
 *    - label-field  : result property to display (default "label"; supports dotted paths)
 *    - value-field  : result property used as the selected id (default "id"; dotted paths)
 *    - mode         : "select" (emit the record) | "fill" (populate fields via fill-map)
 *                     | "hint" (non-blocking suggestion banner with an action button)
 *    - fill-map     : JSON { "target_field_name": "result.path" } — used when mode="fill";
 *                     fills sibling fields by `name` (wc-input or plain input: value + input/change)
 *    - keep-text    : boolean (mode="select") — keep the typed text after select instead of clearing
 *    - param-*      : extra query params sent to the endpoint (e.g. param-master_event="…")
 *    - placeholder, lbl-label, disabled, name, class (+ standard passthrough)
 *
 *  Events (CustomEvent, bubbles+composed, fired on the element AND on document):
 *    - wcrecordselected / record:selected — detail { record }
 *    - wcrecordsearch   / record:search   — detail { q }  (optional, for logging)
 *
 *  Integration hook (optional): set `el.searchHandler = async (q, params) => results[]` to route
 *    the search through your own client instead of fetch (used by the demo + tests). Still
 *    server-authoritative — the handler's array is displayed as-is.
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-record-lookup')) {
  class WcRecordLookup extends WcBaseComponent {
    static get observedAttributes() {
      return ['endpoint', 'min-chars', 'debounce', 'label-field', 'value-field', 'mode',
              'fill-map', 'keep-text', 'placeholder', 'lbl-label', 'disabled', 'name', 'class'];
    }

    constructor() {
      super();
      // Don't append children in the constructor — append on connect (see wc-barcode).
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-record-lookup', 'relative');

      this._lastResults = [];
      this._debTimer = null;

      this._onInput = this._handleInput.bind(this);
      this._onKeydown = this._handleKeydown.bind(this);
      this._onDocClick = this._handleDocClick.bind(this);
      this._onBlur = this._handleBlur.bind(this);
    }

    connectedCallback() {
      const existing = this.querySelector(':scope > .wc-record-lookup');
      if (existing) this.componentElement = existing;
      else if (!this.contains(this.componentElement)) this.appendChild(this.componentElement);
      super.connectedCallback();      // → _render()
      this._applyStyle();
      this._wireEvents();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
      if (this._debTimer) clearTimeout(this._debTimer);
    }

    // ---- Config getters -------------------------------------------------------

    get mode() {
      const m = (this.getAttribute('mode') || 'select').toLowerCase();
      return ['select', 'fill', 'hint'].includes(m) ? m : 'select';
    }
    get minChars() {
      const n = parseInt(this.getAttribute('min-chars'), 10);
      return Number.isFinite(n) && n >= 0 ? n : 2;
    }
    get debounceMs() {
      const n = parseInt(this.getAttribute('debounce'), 10);
      return Number.isFinite(n) && n >= 0 ? n : 300;
    }
    get labelField() { return this.getAttribute('label-field') || 'label'; }
    get valueField() { return this.getAttribute('value-field') || 'id'; }

    // ---- Rendering ------------------------------------------------------------

    _render() {
      super._render();
      const el = this.componentElement;
      el.innerHTML = '';

      const name = this.getAttribute('name') || `rl-${this.wcId}`;
      const lbl = this.getAttribute('lbl-label');
      if (lbl) {
        const label = document.createElement('label');
        label.setAttribute('for', name);
        label.textContent = lbl;
        el.appendChild(label);
      }

      const input = document.createElement('input');
      input.type = 'text';
      input.id = name;
      input.setAttribute('autocomplete', 'off');
      input.classList.add('form-control', 'rl-input');
      input.placeholder = this.getAttribute('placeholder') || 'Search…';
      if (this.hasAttribute('disabled')) input.disabled = true;
      el.appendChild(input);
      this._input = input;

      const icon = document.createElement('wc-fa-icon');
      icon.setAttribute('name', 'magnifying-glass');
      icon.setAttribute('icon-style', 'solid');
      icon.setAttribute('size', '0.9rem');
      icon.classList.add('rl-icon');
      el.appendChild(icon);

      const sugg = document.createElement('div');
      sugg.classList.add('rl-suggestions', 'hidden');
      el.appendChild(sugg);
      this._suggestions = sugg;

      const hint = document.createElement('div');
      hint.classList.add('rl-hint', 'hidden');
      el.appendChild(hint);
      this._hint = hint;

      if (typeof htmx !== 'undefined') htmx.process(this);
    }

    // ---- Events ---------------------------------------------------------------

    _fire(canonical, alias, detail) {
      [canonical, alias].forEach(name => {
        this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
        document.dispatchEvent(new CustomEvent(name, { detail, bubbles: true, composed: true }));
      });
    }

    _handleInput() {
      if (this._debTimer) clearTimeout(this._debTimer);
      const q = (this._input.value || '').trim();
      if (q.length < this.minChars) { this._clearResults(); return; }
      this._debTimer = setTimeout(() => this._search(q), this.debounceMs);
    }

    _handleKeydown(e) {
      const items = this._suggestions.querySelectorAll('.rl-suggestion-item');
      if (!items.length) {
        if (e.key === 'Escape') { this._clearResults(); }
        return;
      }
      const cur = Array.from(items).findIndex(i => i.classList.contains('highlighted'));
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          this._highlight(items, cur < 0 || cur === items.length - 1 ? 0 : cur + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._highlight(items, cur <= 0 ? items.length - 1 : cur - 1);
          break;
        case 'Enter':
          if (cur >= 0) {
            e.preventDefault();
            this._selectRecord(this._lastResults[parseInt(items[cur].dataset.index, 10)]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          this._clearResults();
          break;
      }
    }

    _handleDocClick(e) {
      if (!this.contains(e.target)) this._clearResults();
    }

    _handleBlur() {
      setTimeout(() => {
        if (!this.componentElement.querySelector('.rl-suggestions:hover, .rl-hint:hover')) {
          this._hideSuggestions();
        }
      }, 200);
    }

    // ---- Search ---------------------------------------------------------------

    _extraParams() {
      const params = {};
      for (const attr of Array.from(this.attributes)) {
        if (attr.name.startsWith('param-')) params[attr.name.slice(6)] = attr.value;
      }
      return params;
    }

    async _search(q) {
      this._fire('wcrecordsearch', 'record:search', { q });
      const params = this._extraParams();
      let results;
      try {
        if (typeof this.searchHandler === 'function') {
          results = await this.searchHandler(q, params);
        } else {
          const endpoint = this.getAttribute('endpoint');
          if (!endpoint) { this._clearResults(); return; }
          const url = new URL(endpoint, window.location.origin);
          url.searchParams.set('q', q);
          Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
          const resp = await fetch(url.toString(), { headers: { accept: 'application/json' } });
          if (!resp.ok) { this._clearResults(); return; }
          results = await resp.json();
        }
      } catch (err) {
        console.error('[wc-record-lookup]', err);
        this._clearResults();
        return;
      }
      const list = Array.isArray(results) ? results
        : (results && Array.isArray(results.results) ? results.results : []);
      // Empty → clear the dropdown/hint. Never block typing.
      if (!list.length) { this._clearResults(); return; }
      this._lastResults = list;
      if (this.mode === 'hint') this._showHint(list[0]);
      else this._showSuggestions(list);
    }

    // ---- Suggestions dropdown (select / fill) --------------------------------

    _showSuggestions(results) {
      this._hideHint();
      const c = this._suggestions;
      c.innerHTML = '';
      c.classList.remove('hidden');
      results.forEach((rec, idx) => {
        const item = document.createElement('div');
        item.classList.add('rl-suggestion-item');
        item.dataset.index = String(idx);
        item.textContent = this._displayLabel(rec);
        // mousedown fires before blur so the pick isn't lost.
        item.addEventListener('mousedown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this._selectRecord(rec);
        });
        c.appendChild(item);
      });
    }

    _highlight(items, index) {
      items.forEach(i => i.classList.remove('highlighted'));
      if (items[index]) {
        items[index].classList.add('highlighted');
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }

    _hideSuggestions() {
      if (!this._suggestions) return;
      this._suggestions.classList.add('hidden');
      this._suggestions.innerHTML = '';
    }

    // ---- Hint banner (hint) ---------------------------------------------------

    _showHint(record) {
      this._hideSuggestions();
      const label = this._displayLabel(record);
      const h = this._hint;
      h.innerHTML = '';
      h.classList.remove('hidden');

      const text = document.createElement('span');
      text.classList.add('rl-hint-text');
      text.append('Looks like ');
      const strong = document.createElement('strong');
      strong.textContent = label;
      text.append(strong, ' — use existing?');

      const use = document.createElement('button');
      use.type = 'button';
      use.classList.add('rl-hint-use');
      use.textContent = 'Use existing';
      use.addEventListener('click', () => this._selectRecord(record));

      const dismiss = document.createElement('button');
      dismiss.type = 'button';
      dismiss.classList.add('rl-hint-dismiss');
      dismiss.setAttribute('aria-label', 'Dismiss');
      dismiss.textContent = '×';
      dismiss.addEventListener('click', () => this._hideHint());

      h.append(text, use, dismiss);
    }

    _hideHint() {
      if (!this._hint) return;
      this._hint.classList.add('hidden');
      this._hint.innerHTML = '';
    }

    _clearResults() {
      this._lastResults = [];
      this._hideSuggestions();
      this._hideHint();
    }

    // ---- Selection ------------------------------------------------------------

    _selectRecord(record) {
      if (!record) return;
      if (this.mode === 'fill') {
        this._applyFill(record);
      } else if (this.mode === 'select' && !this.hasAttribute('keep-text')) {
        this._input.value = '';
      }
      this._clearResults();
      this._fire('wcrecordselected', 'record:selected', { record });
    }

    _applyFill(record) {
      const map = this._parseJSON('fill-map', {});
      const scope = this.closest('form') || document;
      Object.entries(map).forEach(([target, path]) => {
        const val = this._getPath(record, path);
        this._setField(scope, target, val == null ? '' : val);
      });
    }

    // Set a sibling field's value by `name` — works for wc-input / plain input / select /
    // textarea: property + attribute + inner control, dispatching input & change.
    _setField(scope, name, val) {
      const el = scope.querySelector(`[name="${name}"]`);
      if (!el) return false;
      try { el.value = val; } catch (_) { /* some hosts guard value */ }
      if (el.setAttribute) el.setAttribute('value', String(val));
      const isNative = el.matches('input, select, textarea');
      const inner = isNative ? null : el.querySelector('input, select, textarea, [form-element]');
      if (inner) {
        try { inner.value = val; } catch (_) {}
        inner.dispatchEvent(new Event('input', { bubbles: true }));
        inner.dispatchEvent(new Event('change', { bubbles: true }));
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }

    // ---- Helpers --------------------------------------------------------------

    _displayLabel(rec) {
      const v = this._getPath(rec, this.labelField);
      if (v != null && v !== '') return String(v);
      // sensible fallbacks
      return String(rec.label != null ? rec.label : (this._getPath(rec, this.valueField) ?? ''));
    }

    _getPath(obj, path) {
      if (obj == null || !path) return undefined;
      if (Object.prototype.hasOwnProperty.call(obj, path)) return obj[path]; // literal key first
      return String(path).split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
    }

    _parseJSON(attr, fallback) {
      const raw = this.getAttribute(attr);
      if (!raw) return fallback;
      try { const v = JSON.parse(raw); return v && typeof v === 'object' ? v : fallback; }
      catch (ex) { console.warn(`[wc-record-lookup] invalid JSON for ${attr}`, ex); return fallback; }
    }

    // ---- Wiring ---------------------------------------------------------------

    _wireEvents() {
      super._wireEvents();
      if (!this._input) return;
      this._input.addEventListener('input', this._onInput);
      this._input.addEventListener('keydown', this._onKeydown);
      this._input.addEventListener('blur', this._onBlur);
      document.addEventListener('click', this._onDocClick);
    }

    _unWireEvents() {
      super._unWireEvents();
      if (this._input) {
        this._input.removeEventListener('input', this._onInput);
        this._input.removeEventListener('keydown', this._onKeydown);
        this._input.removeEventListener('blur', this._onBlur);
      }
      document.removeEventListener('click', this._onDocClick);
    }

    _handleAttributeChange(attrName, newValue, oldValue) {
      if (attrName === 'class') { super._handleAttributeChange(attrName, newValue, oldValue); return; }
      if (attrName === 'disabled') {
        if (this._input) this._input.disabled = this.hasAttribute('disabled');
        return;
      }
      if (['mode', 'lbl-label', 'placeholder', 'name'].includes(attrName)) {
        // Structural — rebuild the surface and re-wire.
        if (this._isConnected) {
          this._unWireEvents();
          this._render();
          this._wireEvents();
        }
        return;
      }
      // endpoint / min-chars / debounce / label-field / value-field / fill-map / keep-text
      // are read live on each search — no rebuild needed.
    }

    _applyStyle() {
      const style = `
        wc-record-lookup { display: contents; }

        @layer wc.usage {
          .wc-record-lookup { display: block; }
          .wc-record-lookup.relative { position: relative; }
          .wc-record-lookup > label { display: block; font-weight: 500; margin-bottom: 0.25rem; }
          .wc-record-lookup .rl-input { width: 100%; padding-left: 2rem; }
          .wc-record-lookup .rl-icon {
            position: absolute; left: 0.6rem; bottom: 0.7rem;
            pointer-events: none; color: var(--text-2, var(--text-1)); opacity: 0.7;
          }
          .wc-record-lookup .rl-input:focus {
            outline: none;
            border-color: var(--primary-bg-color, #3b82f6);
            box-shadow: 0 0 0 3px color-mix(in srgb, var(--primary-bg-color, #3b82f6) 18%, transparent);
          }

          /* Suggestions dropdown */
          .wc-record-lookup .rl-suggestions {
            position: absolute; top: 100%; left: 0; right: 0;
            margin-top: 2px;
            background: var(--component-bg-color, var(--surface-1, #fff));
            border: 1px solid var(--component-border-color, var(--surface-4, #e5e7eb));
            border-radius: 0.375rem;
            max-height: 300px; overflow-y: auto;
            z-index: 1000;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
          }
          .wc-record-lookup .rl-suggestions.hidden,
          .wc-record-lookup .rl-hint.hidden { display: none; }
          .wc-record-lookup .rl-suggestion-item {
            padding: 0.75rem 1rem;
            cursor: pointer;
            border-bottom: 1px solid var(--surface-3, #eef0f2);
            font-size: 0.95rem;
            /* Learned lesson: color suggestion text explicitly — don't rely on inherited color. */
            color: var(--text-1, #1f2937);
          }
          .wc-record-lookup .rl-suggestion-item:last-child { border-bottom: none; }
          .wc-record-lookup .rl-suggestion-item:hover { background: var(--surface-2, #f3f4f6); }
          .wc-record-lookup .rl-suggestion-item.highlighted {
            background: var(--primary-bg-color, #3b82f6);
            color: var(--primary-color, #fff);
            font-weight: 500;
          }

          /* Hint banner */
          .wc-record-lookup .rl-hint {
            display: flex; align-items: center; gap: 0.6rem; flex-wrap: wrap;
            margin-top: 0.4rem;
            padding: 0.6rem 0.75rem;
            background: var(--surface-2, #f3f4f6);
            border: 1px solid var(--primary-bg-color, #3b82f6);
            border-radius: 0.5rem;
            color: var(--text-1, #1f2937);
          }
          .wc-record-lookup .rl-hint-text { flex: 1 1 auto; font-size: 0.95rem; color: var(--text-1, #1f2937); }
          .wc-record-lookup .rl-hint-text strong { color: var(--text-1, #1f2937); }
          .wc-record-lookup .rl-hint-use {
            min-height: 2.25rem; padding: 0.4rem 1rem;
            border: 1px solid transparent; border-radius: 0.375rem;
            font-weight: 600; cursor: pointer;
            background: var(--primary-bg-color, #3b82f6);
            color: var(--primary-color, #fff);
          }
          .wc-record-lookup .rl-hint-use:focus-visible { outline: 2px solid var(--text-1); outline-offset: 2px; }
          .wc-record-lookup .rl-hint-dismiss {
            border: none; background: transparent; cursor: pointer;
            font-size: 1.25rem; line-height: 1; padding: 0 0.25rem;
            color: var(--text-1, #1f2937);
          }
        }
      `.trim();
      this.loadStyle('wc-record-lookup-style', style);
    }
  }

  customElements.define('wc-record-lookup', WcRecordLookup);
  window.WcRecordLookup = WcRecordLookup;
}
