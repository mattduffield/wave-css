/**
 *  wc-chip-picker — pick several values, each limited to a subset of "slots" (parts × show nights,
 *  roles × shifts…). One chip = one value + its slots; no slots = all slots. The same value may appear
 *  more than once with different slots.
 *
 *  <wc-chip-picker name="parts_42" add-label="Add part" all-label="every night" slot-label="Nights" warn-overlap
 *    slots='[{"value":"n1","label":"Fri 12/12"},{"value":"n2","label":"Sat 12/13"}]'
 *    value='[{"value":"Mary","slots":[]},{"value":"Angel","slots":["n1"]}]'>
 *    <option value="Mary">Mary</option><option value="Angel">Angel</option>
 *  </wc-chip-picker>
 *
 *  Chips read "Mary · every night" / "Angel · Fri, Sat" (first word of each slot label); more than 3 slots →
 *  "· 4 nights" with the full list in the title. With `warn-overlap`, chips that share a slot get the warning
 *  style and a title like "Mary and Angel both on Fri 12/12" — never blocking the choice.
 *
 *  Editing: click a chip (or "+ add-label") → an anchored popover with the value select, slot toggle pills,
 *  the all-label shortcut, Remove and Done. Changes are a draft: Done commits, Escape / clicking outside
 *  discards. Keyboard: ←/→ (↑/↓, Home/End) move between chips; Enter/Space opens; Delete/Backspace removes
 *  the focused chip; Escape closes.
 *
 *  Attributes: name, value (JSON array of {value, slots}), slots (JSON array of {value, label, short?}), add-label,
 *  all-label, slot-label, warn-overlap, readonly (chips only, no editing — still submits), disabled (not
 *  editable, not submitted), unique (each value on at most one chip). Options come from <option> children.
 *  A slot's `short` is its chip text (else the first word of its label).
 *  `unique`: a value may repeat only on slots that don't overlap ("all" overlaps everything). In the editor a value
 *  whose chips already cover every slot is a disabled option, slots another chip of that value has are disabled
 *  pills, and a remaining overlap shows a message and disables Done; "+ Add" is hidden once every option covers
 *  every slot; overlapping repeats in a value attribute are merged into the first (slots combined; "all" wins).
 *  `detail-label` (+ optional `detail-placeholder`): a per-chip free-text detail (e.g. Hours) edited under the slot
 *  pills; chips become {value, slots, detail} (detail only when non-empty) and read "Angel · Sun · 7:30–9".
 *  `readonly-hint`: an extra tooltip line on readonly chips.
 *  No slots (`slots` empty or absent): the editor has no slot section, chips read just the value (+ detail):
 *  "Angel" / "Angel · 7:30–9", and the value is [{value, detail}] (input slots may be omitted or []).
 *  Form-associated: submits `name` = the value as a JSON string. Events: `change` and `wcchippickerchange`,
 *  both with detail.value (the array). Setting the `value` attribute (or .value) rebuilds the chips.
 *  HTMX: everything is rebuilt from attributes on every connect; edits are reflected to the value attribute.
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';
import { WcPopover } from '../utils/wc-popover.js';
import { suppressAutofill } from './helper-function.js';

class WcChipPicker extends WcBaseFormComponent {
  static get is() { return 'wc-chip-picker'; }

  static get observedAttributes() {
    return ['name', 'value', 'slots', 'add-label', 'all-label', 'slot-label', 'warn-overlap', 'readonly', 'disabled', 'unique',
      'detail-label', 'detail-placeholder', 'readonly-hint'];
  }

  constructor() {
    super();
    this._chips = [];        // [{ value, slots: [] }]
    this._focusIndex = 0;
    this._pop = null;
    this._draft = null;      // { index (-1 = new), value, slots }
    this._onKeydown = this._handleKeydown.bind(this);
    this._onClick = this._handleClick.bind(this);
  }

  // ---- lifecycle: everything comes from attributes -------------------------------------------------

  async connectedCallback() {
    if (!this.componentElement || !this.contains(this.componentElement)) {
      this.componentElement = this.querySelector(':scope > .wc-chip-picker') || document.createElement('div');
      if (!this.componentElement.isConnected) {
        this.componentElement.className = 'wc-chip-picker';
        this.appendChild(this.componentElement);
      }
    }
    super.connectedCallback();
    this._applyStyle();
    this._rebuild();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._closeEditor(false);
    this._unWireEvents();
  }

  _render() {
    super._render();
    if (this.componentElement) this._rebuild();
  }

  _handleAttributeChange(attrName, newValue) {
    if (['value', 'slots', 'add-label', 'all-label', 'slot-label', 'warn-overlap', 'readonly', 'disabled', 'unique',
      'detail-label', 'detail-placeholder', 'readonly-hint'].includes(attrName)) {
      if (attrName === 'value' && this._reflecting) return;   // our own reflection
      if (this.componentElement) this._rebuild();
    } else if (attrName !== 'class' && attrName !== 'id') {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  // ---- value ----------------------------------------------------------------------------------------

  get value() {
    const noSlots = !this._slots().length;   // no slots: {value, detail}
    return this._chips.map(c => {
      const out = noSlots ? { value: c.value } : { value: c.value, slots: [...c.slots] };
      if (c.detail) out.detail = c.detail;
      return out;
    });
  }
  set value(v) {
    this._chips = this._parseValue(v);
    this._afterChange(false);
  }

  get editable() { return !this.hasAttribute('readonly') && !this.hasAttribute('disabled'); }

  _parseValue(v) {
    let arr = v;
    if (typeof v === 'string') { try { arr = v.trim() ? JSON.parse(v) : []; } catch (e) { console.warn('[wc-chip-picker] invalid value JSON', e); arr = []; } }
    if (!Array.isArray(arr)) return [];
    const chips = arr.filter(c => c && c.value != null && c.value !== '')
      .map(c => {
        const chip = { value: String(c.value), slots: Array.isArray(c.slots) ? c.slots.map(String) : [] };
        const d = c.detail == null ? '' : String(c.detail).trim();   // missing / empty = no detail
        if (d) chip.detail = d;
        return chip;
      });
    return this.hasAttribute('unique') ? this._mergeRepeats(chips) : chips;
  }

  // two slot lists overlap when they share a slot; no slots = every slot
  _slotsOverlap(a, b) { return !a.length || !b.length || a.some(x => b.includes(x)); }

  // unique: a value may repeat only on non-overlapping slots — fold each OVERLAPPING repeat into the earlier chip
  // (slots combined in slot order, any "all" → all; the first non-empty detail kept), until none overlap
  _mergeRepeats(chips) {
    const order = this._slots().map(s => s.value);
    const rank = (v) => { const i = order.indexOf(v); return i < 0 ? order.length : i; };
    const merge = (a, b) => {
      a.slots = (!a.slots.length || !b.slots.length) ? []
        : [...new Set([...a.slots, ...b.slots])].map((v, i) => [v, i]).sort((x, y) => rank(x[0]) - rank(y[0]) || x[1] - y[1]).map(x => x[0]);
      if (!a.detail && b.detail) a.detail = b.detail;
    };
    const out = [];
    for (const c of chips) {
      const chip = { ...c, slots: [...c.slots] };
      let into = out.find(o => o.value === chip.value && this._slotsOverlap(o.slots, chip.slots));
      if (!into) { out.push(chip); continue; }
      merge(into, chip);
      // the wider chip may now overlap later chips of the same value
      for (let again = true; again;) {
        again = false;
        const k = out.findIndex(o => o !== into && o.value === into.value && this._slotsOverlap(o.slots, into.slots));
        if (k >= 0) { merge(into, out[k]); out.splice(k, 1); again = true; }
      }
    }
    return out;
  }

  // unique: the slots `value` already has on chips other than `exceptIndex` ({all:true} when one covers every slot)
  _takenSlots(value, exceptIndex = -1) {
    const order = this._slots().map(s => s.value);
    const others = this._chips.filter((c, i) => i !== exceptIndex && c.value === value);
    if (others.some(c => !c.slots.length)) return { all: true, slots: order, any: true };
    const slots = order.filter(v => others.some(c => c.slots.includes(v)));
    return { all: !!others.length && (order.length === 0 || slots.length === order.length), slots, any: others.length > 0 };
  }

  _slots() {
    try { const s = JSON.parse(this.getAttribute('slots') || '[]'); return Array.isArray(s) ? s.map(x => {
      const slot = { value: String(x.value), label: String(x.label ?? x.value) };
      if (x.short != null && String(x.short).trim()) slot.short = String(x.short);
      return slot;
    }) : []; }
    catch (e) { console.warn('[wc-chip-picker] invalid slots JSON', e); return []; }
  }

  _options() {
    return [...this.querySelectorAll(':scope > option')].map(o => ({ value: o.value, label: o.textContent.trim() || o.value }));
  }

  _labelOf(value) { return this._options().find(o => o.value === value)?.label ?? value; }

  _rebuild() {
    this._chips = this._parseValue(this.getAttribute('value') || '[]');
    this._closeEditor(false);
    this._renderChips();
    this._syncForm();
    this._wireEvents();
  }

  _syncForm() {
    const json = JSON.stringify(this.value);
    this._internals.setFormValue(this.hasAttribute('disabled') ? null : json);
    this._internals.setValidity({});
  }

  // reflect to the attribute (survives an htmx settle), re-render, notify
  _afterChange(notify = true) {
    this._reflecting = true;
    this.setAttribute('value', JSON.stringify(this.value));
    this._reflecting = false;
    this._renderChips();
    this._syncForm();
    if (notify) {
      const detail = { value: this.value };
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
      this.dispatchEvent(new CustomEvent('wcchippickerchange', { bubbles: true, composed: true, detail }));
    }
  }

  // ---- chips --------------------------------------------------------------------------------------------

  _allLabel() { return this.getAttribute('all-label') || 'all'; }
  _slotWord() { return (this.getAttribute('slot-label') || 'slots').toLowerCase(); }

  _chipText(chip, slots) {
    return this._chipBase(chip, slots) + (chip.detail ? ` · ${chip.detail}` : '');
  }

  _chipBase(chip, slots) {
    const name = this._labelOf(chip.value);
    if (!slots.length) return name;            // no slots: just the value
    if (!chip.slots.length) return `${name} · ${this._allLabel()}`;
    if (chip.slots.length > 3) return `${name} · ${chip.slots.length} ${this._slotWord()}`;
    // a slot's `short` when given, else the first word of its label
    const short = chip.slots.map(v => { const s = slots.find(x => x.value === v); return s?.short ?? (s?.label ?? v).split(/\s+/)[0]; });
    return `${name} · ${short.join(', ')}`;
  }

  _detailWord() { return this.getAttribute('detail-label') || 'Detail'; }

  // chips sharing a slot (no slots = every slot) → { chipIndex: ["Mary and Angel both on Fri 12/12", …] }
  _overlaps(slots) {
    const out = new Map();
    if (!this.hasAttribute('warn-overlap')) return out;
    const all = slots.map(s => s.value);
    const covers = this._chips.map(c => (c.slots.length ? c.slots : all));
    for (const s of slots) {
      const who = this._chips.map((c, i) => (covers[i].includes(s.value) ? i : -1)).filter(i => i >= 0);
      if (who.length < 2) continue;
      const names = who.map(i => this._labelOf(this._chips[i].value));
      const list = names.length === 2 ? `${names[0]} and ${names[1]} both` : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]} all`;
      for (const i of who) {
        if (!out.has(i)) out.set(i, []);
        out.get(i).push(`${list} on ${s.label}`);
      }
    }
    return out;
  }

  _renderChips() {
    const slots = this._slots();
    const overlaps = this._overlaps(slots);
    const editable = this.editable;
    const c = this.componentElement;
    c.innerHTML = '';
    const group = document.createElement('div');
    group.className = 'wc-chip-picker-chips';
    group.setAttribute('role', 'group');
    const noun = (this.getAttribute('add-label') || '').replace(/^add\s+/i, '');
    group.setAttribute('aria-label', this.getAttribute('aria-label') || (noun ? noun.charAt(0).toUpperCase() + noun.slice(1) + 's' : 'Choices'));
    if (this.hasAttribute('disabled')) group.setAttribute('aria-disabled', 'true');
    this._chips.forEach((chip, i) => {
      const el = document.createElement(editable ? 'button' : 'span');
      if (editable) { el.type = 'button'; el.setAttribute('aria-haspopup', 'dialog'); }
      el.className = 'badge wc-chip-picker-chip' + (overlaps.has(i) ? ' badge-warning wc-chip-picker-overlap' : '');
      el.dataset.index = String(i);
      const text = this._chipText(chip, slots);
      el.textContent = text;
      const full = chip.slots.length ? chip.slots.map(v => slots.find(s => s.value === v)?.label ?? v).join(', ') : this._allLabel();
      const warn = overlaps.get(i) || [];
      const det = chip.detail ? [`${this._detailWord()}: ${chip.detail}`] : [];
      const hint = !editable && this.hasAttribute('readonly') && this.getAttribute('readonly-hint') ? [this.getAttribute('readonly-hint')] : [];
      const head = slots.length ? `${this._labelOf(chip.value)}: ${full}` : this._labelOf(chip.value);
      el.title = [head, ...det, ...warn, ...hint].join('\n');
      el.setAttribute('aria-label', `${this._labelOf(chip.value)}${slots.length ? `, ${full}` : ''}${chip.detail ? `, ${this._detailWord()} ${chip.detail}` : ''}${warn.length ? '. Warning: ' + warn.join('; ') : ''}${editable ? '. Press Enter to edit, Delete to remove' : ''}`);
      if (editable) el.tabIndex = -1;
      group.appendChild(el);
    });
    // unique: no "+ Add" once every option is on a chip
    const allUsed = this.hasAttribute('unique') && this._options().every(o => this._takenSlots(o.value).all);
    if (editable && !allUsed) {
      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'wc-chip-picker-add';
      add.setAttribute('aria-haspopup', 'dialog');
      add.textContent = `+ ${this.getAttribute('add-label') || 'Add'}`;
      add.tabIndex = -1;
      group.appendChild(add);
      // roving tabindex: one tab stop for the whole group
      const items = this._items(group);
      this._focusIndex = Math.min(this._focusIndex, items.length - 1);
      items[Math.max(0, this._focusIndex)].tabIndex = 0;
    } else if (editable && this._chips.length) {
      const items = this._items(group);
      this._focusIndex = Math.min(this._focusIndex, items.length - 1);
      items[Math.max(0, this._focusIndex)].tabIndex = 0;
    } else if (!this._chips.length) {
      const none = document.createElement('span');
      none.className = 'wc-chip-picker-empty';
      none.textContent = '—';
      group.appendChild(none);
    }
    c.appendChild(group);
  }

  _items(group = this.componentElement.querySelector('.wc-chip-picker-chips')) {
    return group ? [...group.querySelectorAll('.wc-chip-picker-chip, .wc-chip-picker-add')] : [];
  }

  _focusItem(i) {
    const items = this._items();
    if (!items.length) return;
    this._focusIndex = Math.max(0, Math.min(i, items.length - 1));
    items.forEach((it, k) => { it.tabIndex = k === this._focusIndex ? 0 : -1; });
    items[this._focusIndex].focus();
  }

  // ---- events -------------------------------------------------------------------------------------------

  _wireEvents() {
    this.formElement = null; // no native input for the base class to bind
    super._wireEvents();
    const c = this.componentElement;
    if (!c) return;
    c.removeEventListener('keydown', this._onKeydown);
    c.removeEventListener('click', this._onClick);
    c.addEventListener('keydown', this._onKeydown);
    c.addEventListener('click', this._onClick);
  }

  _unWireEvents() {
    super._unWireEvents();
    const c = this.componentElement;
    if (!c) return;
    c.removeEventListener('keydown', this._onKeydown);
    c.removeEventListener('click', this._onClick);
  }

  _handleClick(e) {
    if (!this.editable) return;
    const chip = e.target.closest('.wc-chip-picker-chip');
    const add = e.target.closest('.wc-chip-picker-add');
    if (chip) { this._focusIndex = +chip.dataset.index; this._openEditor(+chip.dataset.index, chip); }
    else if (add) { this._focusIndex = this._items().indexOf(add); this._openEditor(-1, add); }
  }

  _handleKeydown(e) {
    if (!this.editable) return;
    const items = this._items();
    const i = items.indexOf(document.activeElement);
    if (i < 0) return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); this._focusItem((i + 1) % items.length); }
    else if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); this._focusItem((i - 1 + items.length) % items.length); }
    else if (k === 'Home') { e.preventDefault(); this._focusItem(0); }
    else if (k === 'End') { e.preventDefault(); this._focusItem(items.length - 1); }
    else if (k === 'Enter' || k === ' ') { e.preventDefault(); items[i].click(); }
    else if ((k === 'Delete' || k === 'Backspace') && items[i].classList.contains('wc-chip-picker-chip')) {
      e.preventDefault();
      this._removeChip(+items[i].dataset.index);
    }
  }

  _removeChip(index) {
    if (index < 0 || index >= this._chips.length) return;
    this._chips.splice(index, 1);
    this._afterChange(true);
    this._focusItem(Math.min(index, this._items().length - 1));
  }

  // ---- popover editor ------------------------------------------------------------------------------------

  _openEditor(index, anchor) {
    this._closeEditor(false);
    const slots = this._slots();
    const opts = this._options();
    const unique = this.hasAttribute('unique');
    const full = (v) => unique && this._takenSlots(v, index).all;          // every slot of v is on another chip
    const fresh = (v) => !unique || !this._takenSlots(v, index).any;        // v isn't on any other chip
    const src = index >= 0 ? this._chips[index]
      : { value: (opts.find(o => fresh(o.value)) ?? opts.find(o => !full(o.value)) ?? opts[0])?.value ?? '', slots: [] };
    this._draft = { index, value: src.value, slots: [...src.slots], detail: src.detail || '' };
    const detailLabel = this.getAttribute('detail-label');
    const noun = this.getAttribute('add-label') ? this.getAttribute('add-label').replace(/^add\s+/i, '') : 'choice';
    const uid = `wccp-${Math.random().toString(36).slice(2, 8)}`;

    const panel = document.createElement('div');
    panel.className = 'wc-chip-picker-pop';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', index >= 0 ? `Edit ${noun}` : (this.getAttribute('add-label') || 'Add'));
    panel.innerHTML = `
      <label class="wc-chip-picker-field" for="${uid}-v"><span class="wc-chip-picker-lbl">${this._esc(noun.charAt(0).toUpperCase() + noun.slice(1))}</span>
        <select id="${uid}-v" class="wc-chip-picker-select"></select></label>
      ${slots.length ? `<div class="wc-chip-picker-field" role="group" aria-labelledby="${uid}-s">
        <span class="wc-chip-picker-lbl" id="${uid}-s">${this._esc(this.getAttribute('slot-label') || 'Slots')}</span>
        <div class="wc-chip-picker-pills">
          <button type="button" class="badge wc-chip-picker-pill wc-chip-picker-all" aria-pressed="false">${this._esc(this._allLabel())}</button>
          ${slots.map(s => `<button type="button" class="badge wc-chip-picker-pill" data-slot="${this._esc(s.value)}" aria-pressed="false">${this._esc(s.label)}</button>`).join('')}
        </div></div>` : ''}
      ${unique ? '<div class="wc-chip-picker-conflict on-surface-warning" aria-live="polite" hidden></div>\n      ' : ''}${detailLabel ? `<label class="wc-chip-picker-field" for="${uid}-d"><span class="wc-chip-picker-lbl">${this._esc(detailLabel)}</span>
        <input type="text" id="${uid}-d" class="wc-chip-picker-detail" placeholder="${this._esc(this.getAttribute('detail-placeholder') || '')}"></label>\n      ` : ''}<div class="wc-chip-picker-actions">
        ${index >= 0 ? '<button type="button" class="wc-chip-picker-remove">Remove</button>' : '<span></span>'}
        <button type="button" class="wc-chip-picker-done">Done</button>
      </div>`;
    const sel = panel.querySelector('select');
    for (const o of opts) {
      const taken = full(o.value);   // unique: every slot already on another chip (the edited chip keeps its own)
      const opt = new Option(taken ? `${o.label} (already added)` : o.label, o.value, false, o.value === this._draft.value);
      if (taken) opt.disabled = true;
      sel.add(opt);
    }
    if (!opts.some(o => o.value === this._draft.value) && this._draft.value) sel.add(new Option(this._draft.value, this._draft.value, false, true));

    const syncPills = () => {
      panel.querySelectorAll('.wc-chip-picker-pill[data-slot]').forEach(p => {
        const on = this._draft.slots.includes(p.dataset.slot);
        p.setAttribute('aria-pressed', String(on));
        p.classList.toggle('btn-primary', on);
      });
      const all = panel.querySelector('.wc-chip-picker-all');
      if (all) { const on = this._draft.slots.length === 0; all.setAttribute('aria-pressed', String(on)); all.classList.toggle('btn-primary', on); }
      if (unique) syncUnique();
    };
    // unique: slots this value already has elsewhere are disabled (unless picked — so they can be turned off);
    // a remaining overlap is named and Done is disabled until it's resolved
    const syncUnique = () => {
      const taken = this._takenSlots(this._draft.value, index);
      const label = (v) => slots.find(s => s.value === v)?.label ?? v;
      panel.querySelectorAll('.wc-chip-picker-pill').forEach(p => {
        const isAll = p.classList.contains('wc-chip-picker-all');
        const on = p.getAttribute('aria-pressed') === 'true';
        const clash = isAll ? taken.any : taken.slots.includes(p.dataset.slot);
        p.disabled = clash && !on;
        p.classList.toggle('badge-warning', clash && on);
        p.classList.toggle('wc-chip-picker-taken', clash);
        if (clash) p.title = `${this._labelOf(this._draft.value)} already has ${isAll ? taken.slots.map(label).join(', ') : label(p.dataset.slot)}`;
        else p.removeAttribute('title');
      });
      const mine = this._draft.slots.length ? this._draft.slots : slots.map(s => s.value);
      const clashes = taken.any ? mine.filter(v => taken.slots.includes(v)) : [];
      const msg = panel.querySelector('.wc-chip-picker-conflict');
      msg.hidden = !clashes.length;
      msg.textContent = clashes.length ? `${this._labelOf(this._draft.value)} is already on ${clashes.map(label).join(', ')} — choose other ${this._slotWord()}.` : '';
      const done = panel.querySelector('.wc-chip-picker-done');
      done.disabled = clashes.length > 0;
      this._draftClash = clashes.length > 0;
    };
    syncPills();
    sel.addEventListener('change', () => { this._draft.value = sel.value; if (unique) syncUnique(); });
    const det = panel.querySelector('.wc-chip-picker-detail');
    if (det) {
      suppressAutofill(det, 'off');
      det.value = this._draft.detail;
      det.addEventListener('input', () => { this._draft.detail = det.value; });
      det.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this._commitDraft(); } });
    }
    panel.addEventListener('click', (e) => {
      const pill = e.target.closest('.wc-chip-picker-pill');
      if (pill) {
        if (pill.classList.contains('wc-chip-picker-all')) this._draft.slots = [];
        else {
          const v = pill.dataset.slot;
          this._draft.slots = this._draft.slots.includes(v) ? this._draft.slots.filter(x => x !== v)
            : slots.map(s => s.value).filter(x => x === v || this._draft.slots.includes(x));   // keep slot order
        }
        syncPills();
        return;
      }
      if (e.target.closest('.wc-chip-picker-done')) this._commitDraft();
      else if (e.target.closest('.wc-chip-picker-remove')) {
        const idx = this._draft.index;
        this._closeEditor(false);
        this._removeChip(idx);
      }
    });
    // Enter on the select commits; Escape is handled by WcPopover (closes = discard)
    sel.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this._commitDraft(); } });

    this._popAnchor = anchor;
    const narrow = () => window.innerWidth < 480;
    const popOpts = { onClose: (reason) => this._onPopClosed(reason), matchWidth: false, maxHeight: Math.min(480, window.innerHeight - 16) };
    Object.defineProperty(popOpts, 'minWidth', { get: () => (narrow() ? window.innerWidth - 16 : 280) });
    this._pop = new WcPopover(this, popOpts);
    this._pop.open(anchor, panel);
    if (narrow()) panel.classList.add('wc-chip-picker-pop-full');
    this._pop.reposition();
    anchor.setAttribute('aria-expanded', 'true');
    sel.focus();
  }

  _commitDraft() {
    const d = this._draft;
    if (d && this._draftClash) return;            // unique: an overlap is still showing — Done stays disabled
    if (!d || !d.value) { this._closeEditor(true); return; }
    const chip = { value: d.value, slots: [...d.slots] };
    const detail = String(d.detail || '').trim();
    if (detail) chip.detail = detail;
    if (d.index >= 0) this._chips[d.index] = chip;
    else { this._chips.push(chip); this._focusIndex = this._chips.length - 1; }
    this._draft = null;
    this._closeEditor(false);
    this._afterChange(true);
    this._focusItem(this._focusIndex);
  }

  _onPopClosed(reason) {
    this._pop = null;
    this._draft = null;
    this._draftClash = false;
    if (this._popAnchor?.isConnected) this._popAnchor.setAttribute('aria-expanded', 'false');
    if (reason === 'escape') this._focusItem(this._focusIndex);
  }

  _closeEditor(refocus) {
    this._draftClash = false;
    if (this._pop) this._pop.close(refocus ? 'escape' : 'api');
    this._pop = null;
    this._draft = null;
  }

  _esc(v) { return String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])); }

  // ---- styles (component-scoped; tokens only) ----------------------------------------------------------------

  _applyStyle() {
    const style = `
      wc-chip-picker { display: contents; }
      wc-chip-picker > option { display: none; }
      @layer wc.usage {
        .wc-chip-picker { display: block; }
        .wc-chip-picker-chips { display: flex; flex-wrap: wrap; align-items: center; gap: 0.375rem; }
        .wc-chip-picker-empty { color: var(--text-5); }
      }
      /* buttons are unlayered + scoped: the wc.ui layer styles bare buttons/selects and outranks wc.usage */
      .wc-chip-picker .wc-chip-picker-chip { font: inherit; font-size: 0.75rem; line-height: 1.5; padding: 2px 10px; cursor: pointer; border: 0; }
      span.wc-chip-picker-chip { cursor: default; }
      .wc-chip-picker .wc-chip-picker-add { font: inherit; font-size: 0.75rem; padding: 2px 10px; border-radius: 9999px; cursor: pointer;
        background: transparent; color: var(--text-1); border: 1px dashed var(--text-8); }
      .wc-chip-picker .wc-chip-picker-add:hover { background: var(--surface-3); }
      .wc-chip-picker .wc-chip-picker-chip:focus-visible, .wc-chip-picker .wc-chip-picker-add:focus-visible,
      .wc-chip-picker-pop button:focus-visible, .wc-chip-picker-pop select:focus-visible { outline: 2px solid var(--text-1); outline-offset: 2px; }
      /* popover: the menu-surface look */
      .wc-chip-picker-pop { z-index: 10000; box-sizing: border-box; display: flex; flex-direction: column; gap: 0.75rem; padding: 0.75rem;
        overflow: auto; font-size: 0.875rem; background: var(--surface-2); color: var(--text-1); border: 1px solid var(--text-8); border-radius: 8px;
        box-shadow: 0 10px 30px color-mix(in srgb, var(--text-1) 22%, transparent); max-width: calc(100vw - 16px); }
      .wc-chip-picker-pop.wc-chip-picker-pop-full { left: 8px !important; width: calc(100vw - 16px) !important; }
      .wc-chip-picker-pop .wc-chip-picker-field { display: flex; flex-direction: column; gap: 0.25rem; margin: 0; }
      .wc-chip-picker-pop .wc-chip-picker-lbl { font-size: 0.75rem; font-weight: 600; color: var(--text-2); }
      .wc-chip-picker-pop .wc-chip-picker-select { font: inherit; padding: 0.375rem 0.5rem; border-radius: 6px;
        background: var(--component-bg-color); color: var(--text-1); border: 1px solid var(--text-8); }
      /* unique: a value already on another chip — dimmed (still ≥ 4.5:1) and labelled "(already added)" */
      .wc-chip-picker-pop .wc-chip-picker-select option:disabled { color: var(--text-6); background: var(--component-bg-color); }
      .wc-chip-picker-pop .wc-chip-picker-pills { display: flex; flex-wrap: wrap; gap: 0.375rem; }
      .wc-chip-picker-pop .wc-chip-picker-pill { font: inherit; font-size: 0.75rem; line-height: 1.5; padding: 2px 10px; border: 0; cursor: pointer; }
      /* selected is not color alone: a check mark + bold (aria-pressed carries it for assistive tech) */
      .wc-chip-picker-pop .wc-chip-picker-pill[aria-pressed="true"] { font-weight: 700; }
      /* selected = the theme's primary-button fill (.btn-primary tokens: the deepened accent + its verified label),
         so a picked night looks like Save / primary actions in every theme, crisp included */
      .wc-chip-picker-pop .wc-chip-picker-pill.btn-primary { background: var(--button-bg-color); color: var(--button-color); box-shadow: none; }
      .wc-chip-picker-pop .wc-chip-picker-pill[aria-pressed="true"]::before { content: "✓ "; }
      .wc-chip-picker-pop .wc-chip-picker-actions { display: flex; justify-content: space-between; gap: 0.5rem; }
      .wc-chip-picker-pop .wc-chip-picker-actions button { font: inherit; padding: 0.375rem 0.875rem; border-radius: 6px; cursor: pointer; }
      .wc-chip-picker-pop .wc-chip-picker-remove { background: transparent; color: var(--text-1); border: 1px solid var(--text-8); }
      .wc-chip-picker-pop .wc-chip-picker-remove:hover { background: var(--surface-3); }
      .wc-chip-picker-pop .wc-chip-picker-done { background: var(--text-1); color: var(--surface-2); border: 1px solid var(--text-1); font-weight: 600; }
      /* detail-label: the per-chip detail input (same look as the select) */
      .wc-chip-picker-pop .wc-chip-picker-detail { font: inherit; padding: 0.375rem 0.5rem; border-radius: 6px; width: 100%; box-sizing: border-box;
        background: var(--component-bg-color); color: var(--text-1); border: 1px solid var(--text-8); }
      .wc-chip-picker-pop .wc-chip-picker-detail::placeholder { color: var(--text-6); opacity: 1; }
      .wc-chip-picker-pop .wc-chip-picker-detail:focus-visible { outline: 2px solid var(--text-1); outline-offset: 2px; }
      /* unique: a slot this value already has (disabled pill), the overlap message, Done while it overlaps */
      .wc-chip-picker-pop .wc-chip-picker-pill:disabled { cursor: not-allowed; text-decoration: line-through; }
      .wc-chip-picker-pop .wc-chip-picker-conflict { font-size: 0.75rem; font-weight: 600; margin: 0; }
      .wc-chip-picker-pop .wc-chip-picker-done:disabled { background: var(--surface-3); color: var(--text-6); border-color: var(--text-8); cursor: not-allowed; }
    `;
    this.loadStyle('wc-chip-picker-style', style);
  }
}

customElements.define(WcChipPicker.is, WcChipPicker);
