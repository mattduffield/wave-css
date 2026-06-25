/**
 *
 *  Name: wc-combobox
 *  A single-value combobox: type free text AND/OR pick from DB-loaded suggestions.
 *  Like wc-select it can load options from a URL (display-member / value-member /
 *  results-member / sort) but, unlike wc-select, it always allows the user to keep
 *  whatever they type (true combobox behavior).
 *
 *  Usage:
 *    <!-- declarative options -->
 *    <wc-combobox name="status" lbl-label="Status" value="open">
 *      <option value="open">Open</option>
 *      <option value="closed">Closed</option>
 *    </wc-combobox>
 *
 *    <!-- DB-loaded options, client-side filter -->
 *    <wc-combobox name="manufacturer" lbl-label="Manufacturer"
 *      url="/api/manufacturers" display-member="name" value-member="id"
 *      value="{{ Record.manufacturer }}"></wc-combobox>
 *
 *    <!-- server-side search for large datasets ({query} placeholder) -->
 *    <wc-combobox name="city" lbl-label="City"
 *      url="/api/cities?q={query}" display-member="name" value-member="code"
 *      min-chars="2" debounce="250"></wc-combobox>
 *
 *  Form saving:
 *    Form-associated. The SUBMITTED value is the selected option's value-member, or
 *    the raw typed text when the user enters a custom value. The visible <input>
 *    only holds DISPLAY text and carries no name, so the host's setFormValue() is the
 *    single value submitted (native forms and HTMX hx-include alike).
 *
 *  Events (all lowercase): wccomboboxinput, wccomboboxchange, wcoptionsloaded
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

if (!customElements.get('wc-combobox')) {
  class WcCombobox extends WcBaseFormComponent {
    static get observedAttributes() {
      return ['name', 'id', 'class', 'value', 'items', 'url', 'display-member',
        'value-member', 'results-member', 'sort', 'search-param', 'min-chars',
        'debounce', 'placeholder', 'lbl-label', 'disabled', 'required', 'autofocus',
        'elt-class'];
    }

    constructor() {
      super();
      this._items = [];              // normalized [{ value, label }]
      this._highlightedIndex = -1;
      this._isOpen = false;
      this._focusValue = '';         // value at focus time, to detect real changes
      this._debounceTimer = null;

      const compEl = this.querySelector('.wc-combobox');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-combobox', 'relative');
        this.appendChild(this.componentElement);
      }

      // Defer the `ready` promise only for load-once URLs (we wait for the fetch).
      // Server-search URLs have nothing to load up front, so they're ready immediately.
      if (this.hasAttribute('url') && !this._isServerSearch()) {
        this._deferReady = true;
      }
    }

    static get is() {
      return 'wc-combobox';
    }

    // --- Member/config helpers ---
    _displayMember() { return this.getAttribute('display-member') || 'key'; }
    _valueMember() { return this.getAttribute('value-member') || 'value'; }

    _isServerSearch() {
      const url = this.getAttribute('url') || '';
      return url.includes('{query}') || this.hasAttribute('search-param');
    }

    _minChars() { return parseInt(this.getAttribute('min-chars') || '1', 10); }
    _debounceMs() { return parseInt(this.getAttribute('debounce') || '250', 10); }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }

    // --- Value handling (display text != stored value) ---
    get value() {
      return this._value;
    }

    set value(newValue) {
      this._setValue(newValue, true);
    }

    // Core value commit. `syncDisplay` updates the visible input from the value
    // (used for programmatic/record loads); during typing we keep display as-is.
    _setValue(v, syncDisplay = true) {
      this._value = v == null ? '' : v;
      this._internals.setFormValue(this._value);
      if (syncDisplay) this._syncDisplayFromValue(this._value);
      this._updateValidity();
    }

    // Show the matching option's label for a value, else the raw value (custom).
    _syncDisplayFromValue(v) {
      if (!this._input) return;
      const match = this._items.find(i => String(i.value) === String(v));
      this._input.value = match ? match.label : (v == null ? '' : v);
    }

    _updateValidity() {
      if (!this._input) return;
      if (this.required && !this._value) {
        this._internals.setValidity({ valueMissing: true }, 'Please fill out this field.', this._input);
      } else {
        this._internals.setValidity({}, '', this._input);
      }
    }

    // --- Render ---
    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-combobox > *');
      if (!innerEl) {
        this.componentElement.innerHTML = '';
        this._createInnerElement();
      }
      if (typeof htmx !== 'undefined') {
        htmx.process(this);
      }
    }

    _createInnerElement() {
      const labelText = this.getAttribute('lbl-label') || '';
      const name = this.getAttribute('name') || '';

      if (labelText) {
        const lbl = document.createElement('label');
        lbl.textContent = labelText;
        lbl.setAttribute('for', `${name}-combobox-input`);
        this.componentElement.appendChild(lbl);
      }

      // Pull any declarative <option> children into the item list.
      const declarative = [];
      this.querySelectorAll('option').forEach(opt => {
        declarative.push({ value: opt.getAttribute('value') ?? opt.textContent, label: opt.textContent.trim() });
      });
      this.querySelectorAll('option').forEach(opt => opt.remove());
      if (declarative.length) this._items = declarative;

      // Visible input: display/typing only — NO name, so it never submits.
      // The host (form-associated) submits the resolved value via setFormValue.
      const input = document.createElement('input');
      input.setAttribute('form-element', '');
      input.setAttribute('type', 'text');
      input.classList.add('wc-combobox-input');
      input.id = `${name}-combobox-input`;
      input.setAttribute('autocomplete', 'off');
      input.setAttribute('role', 'combobox');
      input.setAttribute('aria-autocomplete', 'list');
      input.setAttribute('aria-expanded', 'false');
      const placeholder = this.getAttribute('placeholder');
      if (placeholder) input.setAttribute('placeholder', placeholder);
      if (this.hasAttribute('disabled')) input.setAttribute('disabled', '');
      if (this.hasAttribute('autofocus')) input.setAttribute('autofocus', '');
      this._input = input;
      this.formElement = input;

      // Relative control wraps the input, the dropdown chevron, and the list so they
      // position together independent of the (column-stacked) label.
      const control = document.createElement('div');
      control.classList.add('wc-combobox-control');

      const arrow = document.createElement('span');
      arrow.classList.add('wc-combobox-arrow');
      arrow.setAttribute('aria-hidden', 'true');
      arrow.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>';

      const list = document.createElement('ul');
      list.classList.add('wc-combobox-list');
      list.setAttribute('role', 'listbox');
      list.style.display = 'none';
      this._list = list;

      control.appendChild(input);
      control.appendChild(arrow);
      control.appendChild(list);
      this.componentElement.appendChild(control);

      // Combobox-specific listeners (base wires input/change → _handleInputChange).
      input.addEventListener('focus', () => this._onFocus());
      input.addEventListener('blur', () => this._onBlur());
      input.addEventListener('keydown', (e) => this._onKeydown(e));
      // Use mousedown so selection fires before the input's blur closes the list.
      list.addEventListener('mousedown', (e) => {
        const li = e.target.closest('.wc-combobox-option');
        if (!li) return;
        e.preventDefault();
        this._selectByIndex(parseInt(li.dataset.index, 10));
      });
    }

    // Base form wiring calls this on the input's 'input'/'change' events. We only act
    // on typing; commit-on-leave is handled by _onBlur / explicit selection.
    _handleInputChange(event) {
      if (event.type === 'input') {
        this._onType(this._input.value);
      }
    }

    _onType(query) {
      // Keep the form value in sync with the typed (custom) text as the user types.
      this._setValue(query, false);
      this._emitEvent('wccomboboxinput', 'combobox:input', { detail: { query } });

      if (this._isServerSearch()) {
        clearTimeout(this._debounceTimer);
        if (query.length < this._minChars()) { this._closeDropdown(); return; }
        this._debounceTimer = setTimeout(() => this._serverSearch(query), this._debounceMs());
      } else {
        this._renderSuggestions(this._filter(query));
      }
    }

    _filter(query) {
      const q = (query || '').toLowerCase();
      if (!q) return this._items;
      return this._items.filter(i =>
        i.label.toLowerCase().includes(q) || String(i.value).toLowerCase().includes(q));
    }

    _renderSuggestions(list) {
      this._list.innerHTML = '';
      this._highlightedIndex = -1;
      if (!list || list.length === 0) {
        this._closeDropdown();
        return;
      }
      list.forEach((item, idx) => {
        const li = document.createElement('li');
        li.classList.add('wc-combobox-option');
        li.setAttribute('role', 'option');
        li.dataset.index = String(idx);
        li.dataset.value = item.value;
        li.textContent = item.label;
        this._list.appendChild(li);
      });
      this._visible = list;
      this._openDropdown();
    }

    _openDropdown() {
      this._list.style.display = '';
      this._isOpen = true;
      this._input.setAttribute('aria-expanded', 'true');
    }

    _closeDropdown() {
      this._list.style.display = 'none';
      this._isOpen = false;
      this._highlightedIndex = -1;
      this._input.setAttribute('aria-expanded', 'false');
    }

    _highlight(index) {
      const options = this._list.querySelectorAll('.wc-combobox-option');
      if (!options.length) return;
      this._highlightedIndex = (index + options.length) % options.length;
      options.forEach((o, i) => o.classList.toggle('is-active', i === this._highlightedIndex));
      options[this._highlightedIndex].scrollIntoView({ block: 'nearest' });
    }

    _selectByIndex(index) {
      const item = (this._visible || [])[index];
      if (!item) return;
      this._input.value = item.label;          // display = label
      this._setValue(item.value, false);       // submit = value
      this._closeDropdown();
      this._emitChange(item, false);
    }

    _onFocus() {
      this._focusValue = this._value;
      if (!this._isServerSearch()) {
        this._renderSuggestions(this._filter(this._input.value));
      }
    }

    _onBlur() {
      // Delay so a click on an option (mousedown) registers before we close.
      setTimeout(() => {
        this._closeDropdown();
        // Commit: if the typed text exactly matches an option's label, snap to that
        // option's value; otherwise keep the custom text (already the current value).
        const typed = this._input.value;
        const match = this._items.find(i => i.label.toLowerCase() === typed.toLowerCase());
        if (match) {
          this._setValue(match.value, false);
        } else {
          this._setValue(typed, false);
        }
        if (this._value !== this._focusValue) {
          this._emitChange(match || { value: this._value, label: typed }, !match);
        }
      }, 150);
    }

    _onKeydown(e) {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          if (!this._isOpen && !this._isServerSearch()) this._renderSuggestions(this._filter(this._input.value));
          else this._highlight(this._highlightedIndex + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          this._highlight(this._highlightedIndex - 1);
          break;
        case 'Enter':
          if (this._isOpen && this._highlightedIndex >= 0) {
            e.preventDefault();
            this._selectByIndex(this._highlightedIndex);
          }
          break;
        case 'Escape':
          this._closeDropdown();
          break;
        default:
          break;
      }
    }

    _emitChange(item, custom) {
      this._emitEvent('wccomboboxchange', 'combobox:change', {
        detail: { value: this._value, label: item ? item.label : this._input.value, custom }
      });
      this.dispatchEvent(new Event('change', { bubbles: true }));
      this._focusValue = this._value;
    }

    // --- Data loading ---
    _normalizeItems(raw) {
      const dm = this._displayMember();
      const vm = this._valueMember();
      if (!Array.isArray(raw)) return [];
      return raw.map(item => {
        if (item == null) return null;
        if (typeof item !== 'object') return { value: item, label: String(item) };
        return { value: item[vm], label: String(item[dm] ?? item[vm] ?? '') };
      }).filter(Boolean);
    }

    _setItems(raw) {
      this._items = this._normalizeItems(raw);
      const sortAttr = this.getAttribute('sort');
      if (sortAttr !== null) {
        const dir = sortAttr === 'desc' ? -1 : 1;
        this._items.sort((a, b) => {
          const av = a.label.toLowerCase(), bv = b.label.toLowerCase();
          return av < bv ? -1 * dir : av > bv ? 1 * dir : 0;
        });
      }
      // Re-resolve display in case value was set before items arrived.
      if (this._value) this._syncDisplayFromValue(this._value);

      // select-first (opt-in): when enabled AND no value is set yet AND options exist,
      // default to the first option (post-sort, so it honors `sort`). Goes through the
      // normal commit + change path so dependent comboboxes cascade. NEVER clobbers a
      // value that's already set (server-rendered, restored, or user-picked). Applies on
      // every empty-at-load (initial + later reloads), so a parent change re-defaults children.
      let autoSelected = null;
      if (this.hasAttribute('select-first') && !this._value && this._items.length > 0) {
        autoSelected = this._items[0];
        this._setValue(autoSelected.value, true);
      }

      this._emitEvent('wcoptionsloaded', 'optionsloaded', {
        bubbles: true, composed: true,
        detail: { value: this._value, optionCount: this._items.length }
      });

      // Emit a normal change AFTER wcoptionsloaded so `on change or wccomboboxchange`
      // cascade wiring fires exactly as it would for a user selection.
      if (autoSelected) this._emitChange(autoSelected, false);
    }

    _extractResults(data) {
      if (data == null) return [];
      const rm = this.getAttribute('results-member');
      if (rm) return data[rm] || [];
      return Array.isArray(data) ? data : (data.results || []);
    }

    _loadFromUrlOnce(url) {
      fetch(url)
        .then(r => r.json())
        .then(data => {
          this._setItems(this._extractResults(data));
          this._setReady();
        })
        .catch(err => {
          console.error('[wc-combobox] Failed to load options from URL:', err);
          this._setReady();
        });
    }

    _serverSearch(query) {
      const tmpl = this.getAttribute('url') || '';
      let url;
      if (tmpl.includes('{query}')) {
        url = tmpl.replace('{query}', encodeURIComponent(query));
      } else {
        const param = this.getAttribute('search-param');
        const sep = tmpl.includes('?') ? '&' : '?';
        url = `${tmpl}${sep}${encodeURIComponent(param)}=${encodeURIComponent(query)}`;
      }
      fetch(url)
        .then(r => r.json())
        .then(data => {
          this._setItems(this._extractResults(data));
          // Keep the user's typed value; just show fresh suggestions.
          this._renderSuggestions(this._items);
        })
        .catch(err => console.error('[wc-combobox] Search request failed:', err));
    }

    // --- Attribute changes ---
    _handleAttributeChange(attrName, newValue) {
      if (attrName === 'value') {
        this._setValue(newValue, true);
      } else if (attrName === 'url') {
        if (newValue && !this._isServerSearch()) {
          this._loadFromUrlOnce(newValue);
        }
        // Server-search URLs load on demand (in _serverSearch), nothing to do here.
      } else if (attrName === 'items') {
        if (typeof newValue === 'string' && newValue.trim()) {
          try { this._setItems(JSON.parse(newValue)); }
          catch (e) { console.warn('[wc-combobox] Invalid items JSON:', e); }
        }
      } else if (attrName === 'disabled') {
        if (this._input) this._input.disabled = this.hasAttribute('disabled');
      } else if (attrName === 'placeholder') {
        if (this._input) this._input.placeholder = newValue || '';
      } else if (attrName === 'required') {
        this._updateValidity();
      } else if (attrName === 'lbl-label') {
        const lbl = this.componentElement.querySelector('label');
        if (lbl) lbl.textContent = newValue || '';
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _applyStyle() {
      const style = `
        wc-combobox { display: contents; }

        .wc-combobox {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }
        .wc-combobox label {
          font-size: 0.875rem;
        }
        /* The input intentionally inherits the library's global input styling
           (border, background, height, focus glow) so it matches wc-input / wc-select.
           Only width + room for the chevron are component-specific. */
        .wc-combobox-control {
          position: relative;
          width: 100%;
        }
        .wc-combobox-input {
          width: 100%;
          padding-right: 2rem;
          /* Inputs inherit line-height (selects don't), which can make them render
             taller than the adjacent native <select>. Pin to normal so the height
             matches wc-select regardless of any inherited line-height. */
          line-height: normal;
        }
        .wc-combobox-arrow {
          position: absolute;
          top: 50%;
          right: 0.75rem;
          transform: translateY(-50%);
          display: inline-flex;
          pointer-events: none;
          color: var(--component-color);
        }
        .wc-combobox-list {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          z-index: 50;
          margin: 0.125rem 0 0;
          padding: 0.25rem;
          list-style: none;
          max-height: 16rem;
          overflow-y: auto;
          background: var(--component-bg-color);
          color: var(--component-color);
          border: 1px solid var(--component-border-color);
          border-radius: 4px;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        .wc-combobox-option {
          padding: 0.4rem 0.6rem;
          border-radius: 0.25rem;
          cursor: pointer;
          color: var(--component-color);
          font-size: 0.9rem;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wc-combobox-option:hover,
        .wc-combobox-option.is-active {
          background: var(--primary-bg-color);
          color: var(--primary-color);
        }
      `.trim();
      this.loadStyle('wc-combobox-style', style);
    }
  }

  customElements.define(WcCombobox.is, WcCombobox);
}
