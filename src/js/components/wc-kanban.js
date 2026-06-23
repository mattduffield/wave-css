/**
 *
 *  Name: wc-kanban
 *  Usage:
 *    A declarative status board. Columns (lanes) come from a categorical field's
 *    options; cards are record objects grouped into lanes by `group-field`. The
 *    component owns rendering, drag/drop (native HTML5), per-lane count + optional
 *    rollup; the HOST owns persistence via bubbling events.
 *
 *    <wc-kanban
 *        group-field="status"
 *        lanes='[{"value":"backlog","label":"Backlog","color":"#64748b"},
 *                {"value":"in_progress","label":"In Progress","color":"#3b82f6"},
 *                {"value":"done","label":"Done","color":"#22c55e"}]'
 *        cards='{{ Data.cards|toJSON|safe }}'
 *        card-id-field="_id"
 *        card-title-field="title"
 *        card-fields='["priority","assignee","due_date"]'
 *        rollup-field="amount" rollup-prefix="$"
 *        card-link-template="/x/order/{_id}"
 *        quick-add>
 *    </wc-kanban>
 *
 *  Attributes:
 *    group-field        (required) — the card field whose value places a card in a lane
 *    lanes              (required) — JSON array of { value, label, color? }
 *    cards                         — JSON array of record objects
 *    card-id-field                 — id member of each card (default "_id")
 *    card-title-field              — title member shown on each card (default "title")
 *    card-fields                   — JSON array of member names rendered as .badge chips
 *    rollup-field                  — optional numeric member; lane header shows its per-lane sum
 *    rollup-prefix                 — optional string prefixed to the rollup (e.g. "$")
 *    card-link-template            — optional URL with {field} tokens; renders the card as <a href>
 *    quick-add                     — optional; adds a "+ add" input at each lane foot
 *    readonly                      — optional; no drag, no quick-add
 *
 *  Events (bubbling, composed):
 *    wckanbanchange  — drag move/reorder; detail { cardId, fromValue, toValue, groupField, toIndex }
 *    wckanbanadd     — quick-add submit;   detail { laneValue, title }
 *    wckanbanopen    — card activated (no link); detail { cardId }
 *    (legacy colon aliases wc-kanban:change / :add / :open are also fired, deprecated)
 *
 *  Persistence is the HOST's job: listen for wckanbanchange and PUT the new value;
 *  on failure, reset the `cards` attribute to roll back (the move is optimistic).
 *  htmx-safe: re-renders when `cards`/`lanes`/`group-field` change.
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcKanban extends WcBaseComponent {
  static get is() {
    return 'wc-kanban';
  }

  static get observedAttributes() {
    return [
      'id', 'class', 'group-field', 'lanes', 'cards',
      'card-id-field', 'card-title-field', 'card-fields',
      'rollup-field', 'rollup-prefix', 'card-link-template',
      'quick-add', 'readonly'
    ];
  }

  constructor() {
    super();
    this._lanes = [];
    this._cards = [];
    this._cardById = new Map();
    this._dragEl = null;
    this._dragFrom = null;

    // Bound handlers (idempotent wiring across htmx swaps).
    this._onDragStart = this._handleDragStart.bind(this);
    this._onDragOver = this._handleDragOver.bind(this);
    this._onDragEnd = this._handleDragEnd.bind(this);
    this._onDrop = this._handleDrop.bind(this);
    this._onClick = this._handleClick.bind(this);
    this._onKeydown = this._handleKeydown.bind(this);
    this._onSubmit = this._handleQuickAddSubmit.bind(this);

    const compEl = this.querySelector(':scope > .wc-kanban');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-kanban');
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

  get cards() { return this._cards.slice(); }
  set cards(arr) {
    this._cards = Array.isArray(arr) ? arr : [];
    this._indexCards();
    this._renderBoard();
  }

  get lanes() { return this._lanes.slice(); }
  set lanes(arr) {
    this._lanes = Array.isArray(arr) ? arr : [];
    this._renderBoard();
  }

  refresh() { this._renderBoard(); }

  // ---- Rendering ------------------------------------------------------------

  _render() {
    super._render();
    this._readConfig();
    this._renderBoard();
    this._wireEvents();
    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
  }

  _readConfig() {
    this._groupField = this.getAttribute('group-field') || 'status';
    this._cardIdField = this.getAttribute('card-id-field') || '_id';
    this._cardTitleField = this.getAttribute('card-title-field') || 'title';
    this._cardFields = this._parseJSON('card-fields', []);
    this._rollupField = this.getAttribute('rollup-field') || '';
    this._rollupPrefix = this.getAttribute('rollup-prefix') || '';
    this._cardLinkTemplate = this.getAttribute('card-link-template') || '';
    this._lanes = this._parseJSON('lanes', []);
    this._cards = this._parseJSON('cards', []);
    this._indexCards();
  }

  _indexCards() {
    this._cardById = new Map();
    this._cards.forEach(c => {
      if (c && c[this._cardIdField] != null) {
        this._cardById.set(String(c[this._cardIdField]), c);
      }
    });
  }

  _renderBoard() {
    if (!this.componentElement) return;
    this.componentElement.innerHTML = '';
    const readonly = this._isReadonly();

    this._lanes.forEach(lane => {
      const laneEl = document.createElement('div');
      laneEl.classList.add('wc-kanban-lane');
      laneEl.dataset.laneValue = lane.value;
      if (lane.color) laneEl.style.setProperty('--lane-color', lane.color);

      // Header
      const header = document.createElement('div');
      header.classList.add('wc-kanban-lane-header');
      const title = document.createElement('span');
      title.classList.add('wc-kanban-lane-title');
      title.textContent = lane.label != null ? lane.label : lane.value;
      header.appendChild(title);

      const meta = document.createElement('span');
      meta.classList.add('wc-kanban-lane-meta');
      const rollup = document.createElement('span');
      rollup.classList.add('wc-kanban-lane-rollup');
      const count = document.createElement('span');
      count.classList.add('wc-kanban-lane-count', 'badge', 'badge-muted');
      meta.appendChild(rollup);
      meta.appendChild(count);
      header.appendChild(meta);
      laneEl.appendChild(header);

      // Body (drop target)
      const body = document.createElement('div');
      body.classList.add('wc-kanban-lane-body');
      body.dataset.laneValue = lane.value;

      const laneCards = this._cards.filter(c => String(c[this._groupField]) === String(lane.value));
      laneCards.forEach(card => body.appendChild(this._createCard(card, lane)));

      // Empty placeholder (hidden via :has when cards exist)
      const empty = document.createElement('div');
      empty.classList.add('wc-kanban-empty');
      empty.textContent = 'Drop here';
      body.appendChild(empty);

      laneEl.appendChild(body);

      // Quick-add foot
      if (this.hasAttribute('quick-add') && !readonly) {
        const foot = document.createElement('div');
        foot.classList.add('wc-kanban-quick-add');
        const form = document.createElement('form');
        form.dataset.laneValue = lane.value;
        const input = document.createElement('input');
        input.type = 'text';
        input.classList.add('wc-kanban-quick-add-input');
        input.placeholder = '+ Add...';
        input.setAttribute('aria-label', `Add to ${lane.label || lane.value}`);
        const btn = document.createElement('button');
        btn.type = 'submit';
        btn.classList.add('btn', 'btn-sm');
        btn.textContent = '+';
        form.appendChild(input);
        form.appendChild(btn);
        foot.appendChild(form);
        laneEl.appendChild(foot);
      }

      this.componentElement.appendChild(laneEl);
      this._refreshLane(laneEl);
    });
  }

  _createCard(card, lane) {
    const id = String(card[this._cardIdField] != null ? card[this._cardIdField] : '');
    const readonly = this._isReadonly();

    // Use <a> when a link template is given (htmx-boost friendly); else a div.
    let cardEl;
    if (this._cardLinkTemplate) {
      cardEl = document.createElement('a');
      cardEl.href = this._resolveTemplate(this._cardLinkTemplate, card);
    } else {
      cardEl = document.createElement('div');
      cardEl.setAttribute('role', 'button');
      cardEl.tabIndex = 0;
    }
    cardEl.classList.add('wc-kanban-card');
    cardEl.dataset.cardId = id;
    // Set draggable explicitly: <a>/<img> default to draggable=true per HTML spec,
    // so readonly link cards must be opted OUT, not merely left unset.
    cardEl.draggable = !readonly;

    const titleEl = document.createElement('div');
    titleEl.classList.add('wc-kanban-card-title');
    titleEl.textContent = card[this._cardTitleField] != null ? card[this._cardTitleField] : '';
    cardEl.appendChild(titleEl);

    // card-fields → badge chips (skip empty values)
    const chips = this._cardFields
      .map(f => card[f])
      .filter(v => v != null && String(v).trim() !== '');
    if (chips.length) {
      const metaEl = document.createElement('div');
      metaEl.classList.add('wc-kanban-card-meta');
      chips.forEach(v => {
        const badge = document.createElement('span');
        badge.classList.add('badge', 'badge-muted');
        badge.textContent = String(v);
        metaEl.appendChild(badge);
      });
      cardEl.appendChild(metaEl);
    }

    return cardEl;
  }

  // ---- Helpers --------------------------------------------------------------

  _parseJSON(attr, fallback) {
    const raw = this.getAttribute(attr);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed != null ? parsed : fallback;
    } catch (ex) {
      console.warn(`[wc-kanban] invalid JSON for ${attr}`, ex);
      return fallback;
    }
  }

  _resolveTemplate(tpl, card) {
    return tpl.replace(/\{([^}]+)\}/g, (m, key) => {
      const v = card[key];
      return v != null ? encodeURIComponent(String(v)) : '';
    });
  }

  _isReadonly() {
    return this.hasAttribute('readonly');
  }

  _laneBody(value) {
    return this.componentElement.querySelector(`.wc-kanban-lane-body[data-lane-value="${CSS.escape(String(value))}"]`);
  }

  _refreshLane(laneEl) {
    const body = laneEl.querySelector('.wc-kanban-lane-body');
    const cards = body.querySelectorAll('.wc-kanban-card');
    const countEl = laneEl.querySelector('.wc-kanban-lane-count');
    if (countEl) countEl.textContent = String(cards.length);

    const rollupEl = laneEl.querySelector('.wc-kanban-lane-rollup');
    if (rollupEl) {
      if (this._rollupField) {
        let sum = 0;
        cards.forEach(cardEl => {
          const card = this._cardById.get(cardEl.dataset.cardId);
          const v = card ? parseFloat(card[this._rollupField]) : NaN;
          if (!Number.isNaN(v)) sum += v;
        });
        rollupEl.textContent = this._rollupPrefix + sum.toLocaleString();
        rollupEl.style.display = '';
      } else {
        rollupEl.style.display = 'none';
      }
    }
  }

  // ---- Drag & drop (native HTML5) -------------------------------------------

  _handleDragStart(e) {
    const card = e.target.closest('.wc-kanban-card');
    if (!card || this._isReadonly()) return;
    this._dragEl = card;
    this._dragFrom = card.closest('.wc-kanban-lane')?.dataset.laneValue ?? null;
    card.classList.add('dragging');
    this.componentElement.classList.add('is-dragging');
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      // Some browsers require data to be set for the drag to start.
      try { e.dataTransfer.setData('text/plain', card.dataset.cardId || ''); } catch (ex) {}
    }
  }

  _handleDragOver(e) {
    if (!this._dragEl) return;
    const body = e.target.closest('.wc-kanban-lane-body');
    if (!body) return;
    e.preventDefault(); // allow drop
    if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
    body.classList.add('drag-over');
    // Live reorder/move for SortableJS-like feedback.
    const after = this._getDragAfterElement(body, e.clientY);
    if (after == null) {
      body.insertBefore(this._dragEl, body.querySelector('.wc-kanban-empty'));
    } else {
      body.insertBefore(this._dragEl, after);
    }
  }

  _handleDrop(e) {
    if (!this._dragEl) return;
    const body = e.target.closest('.wc-kanban-lane-body');
    if (body) e.preventDefault();
    // Finalization happens in dragend (fires for both drop and drop-outside).
  }

  _handleDragEnd() {
    const card = this._dragEl;
    this.componentElement.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
    this.componentElement.classList.remove('is-dragging');
    if (!card) return;
    card.classList.remove('dragging');

    const toLane = card.closest('.wc-kanban-lane');
    const toValue = toLane?.dataset.laneValue ?? null;
    const fromValue = this._dragFrom;
    const body = toLane?.querySelector('.wc-kanban-lane-body');
    const toIndex = body ? Array.from(body.querySelectorAll('.wc-kanban-card')).indexOf(card) : -1;
    const cardId = card.dataset.cardId;

    // Update the data model so counts/rollups/re-renders reflect the move.
    const data = this._cardById.get(cardId);
    if (data && toValue != null) data[this._groupField] = toValue;

    // Refresh affected lane headers.
    this.componentElement.querySelectorAll('.wc-kanban-lane').forEach(l => this._refreshLane(l));

    this._dragEl = null;
    this._dragFrom = null;

    // Emit for cross-lane moves and within-lane reorders alike.
    this._emitEvent('wckanbanchange', 'wc-kanban:change', {
      bubbles: true,
      composed: true,
      detail: { cardId, fromValue, toValue, groupField: this._groupField, toIndex }
    });
  }

  _getDragAfterElement(body, y) {
    const els = Array.from(body.querySelectorAll('.wc-kanban-card:not(.dragging)'));
    let closest = { offset: Number.NEGATIVE_INFINITY, element: null };
    els.forEach(child => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        closest = { offset, element: child };
      }
    });
    return closest.element;
  }

  // ---- Activation & quick-add ----------------------------------------------

  _handleClick(e) {
    const card = e.target.closest('.wc-kanban-card');
    if (!card || !this.componentElement.contains(card)) return;
    // Links navigate natively — don't intercept.
    if (card.tagName === 'A') return;
    this._emitOpen(card.dataset.cardId);
  }

  _handleKeydown(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const card = e.target.closest('.wc-kanban-card');
    if (!card || card.tagName === 'A') return;
    e.preventDefault();
    this._emitOpen(card.dataset.cardId);
  }

  _emitOpen(cardId) {
    this._emitEvent('wckanbanopen', 'wc-kanban:open', {
      bubbles: true,
      composed: true,
      detail: { cardId }
    });
  }

  _handleQuickAddSubmit(e) {
    const form = e.target.closest('.wc-kanban-quick-add form');
    if (!form) return;
    e.preventDefault();
    const input = form.querySelector('.wc-kanban-quick-add-input');
    const title = (input?.value || '').trim();
    if (!title) return;
    const laneValue = form.dataset.laneValue;
    if (input) input.value = '';
    this._emitEvent('wckanbanadd', 'wc-kanban:add', {
      bubbles: true,
      composed: true,
      detail: { laneValue, title }
    });
  }

  // ---- Wiring ---------------------------------------------------------------

  _wireEvents() {
    super._wireEvents();
    const el = this.componentElement;
    // Idempotent: remove then add.
    el.removeEventListener('dragstart', this._onDragStart);
    el.addEventListener('dragstart', this._onDragStart);
    el.removeEventListener('dragover', this._onDragOver);
    el.addEventListener('dragover', this._onDragOver);
    el.removeEventListener('drop', this._onDrop);
    el.addEventListener('drop', this._onDrop);
    el.removeEventListener('dragend', this._onDragEnd);
    el.addEventListener('dragend', this._onDragEnd);
    el.removeEventListener('click', this._onClick);
    el.addEventListener('click', this._onClick);
    el.removeEventListener('keydown', this._onKeydown);
    el.addEventListener('keydown', this._onKeydown);
    el.removeEventListener('submit', this._onSubmit);
    el.addEventListener('submit', this._onSubmit);
  }

  _unWireEvents() {
    super._unWireEvents();
    const el = this.componentElement;
    if (!el) return;
    el.removeEventListener('dragstart', this._onDragStart);
    el.removeEventListener('dragover', this._onDragOver);
    el.removeEventListener('drop', this._onDrop);
    el.removeEventListener('dragend', this._onDragEnd);
    el.removeEventListener('click', this._onClick);
    el.removeEventListener('keydown', this._onKeydown);
    el.removeEventListener('submit', this._onSubmit);
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (['group-field', 'lanes', 'cards', 'card-id-field', 'card-title-field',
         'card-fields', 'rollup-field', 'rollup-prefix', 'card-link-template',
         'quick-add', 'readonly'].includes(attrName)) {
      this._readConfig();
      this._renderBoard();
    } else if (attrName === 'class') {
      super._handleAttributeChange(attrName, newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _applyStyle() {
    const style = `
      wc-kanban {
        display: contents;
      }

      @layer wc.usage {
        .wc-kanban {
          display: flex;
          flex-direction: row;
          gap: 0.75rem;
          align-items: flex-start;
          width: 100%;
          overflow-x: auto;
          padding-bottom: 0.5rem;
        }
        .wc-kanban-lane {
          display: flex;
          flex-direction: column;
          flex: 0 0 280px;
          max-height: 100%;
          background-color: var(--surface-2);
          border: 1px solid var(--surface-4);
          border-top: 3px solid var(--lane-color, var(--surface-4));
          border-radius: 0.5rem;
          overflow: hidden;
        }
        .wc-kanban-lane-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.5rem;
          padding: 0.625rem 0.75rem;
          font-weight: 600;
          border-bottom: 1px solid var(--surface-4);
        }
        .wc-kanban-lane-title {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .wc-kanban-lane-meta {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          flex: 0 0 auto;
        }
        .wc-kanban-lane-rollup {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-2, var(--component-alt-color));
        }
        .wc-kanban-lane-body {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          padding: 0.5rem;
          overflow-y: auto;
          flex: 1 1 auto;
          min-height: 80px;
        }
        .wc-kanban-lane-body.drag-over {
          background-color: color-mix(in oklab, var(--lane-color, var(--primary-bg-color)) 12%, transparent);
        }
        .wc-kanban-card {
          display: block;
          background-color: var(--card-bg-color, var(--surface-3));
          border: 1px solid var(--surface-4);
          border-radius: 0.375rem;
          padding: 0.5rem 0.625rem;
          color: var(--text-1);
          text-decoration: none;
          cursor: grab;
          transition: box-shadow 0.15s, border-color 0.15s;
        }
        .wc-kanban-card:hover {
          border-color: var(--lane-color, var(--primary-bg-color));
          box-shadow: 0 1px 4px rgba(0,0,0,0.15);
        }
        .wc-kanban-card:focus-visible {
          outline: var(--primary-bg-color) solid 2px;
          outline-offset: 1px;
        }
        .wc-kanban-card.dragging {
          opacity: 0.5;
          cursor: grabbing;
        }
        .wc-kanban-card-title {
          font-weight: 600;
          font-size: 0.875rem;
          margin-bottom: 0.25rem;
        }
        .wc-kanban-card-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
        }
        .wc-kanban-empty {
          display: none;
          padding: 0.75rem;
          text-align: center;
          font-size: 0.75rem;
          color: var(--text-3, var(--component-alt-color));
          border: 1px dashed var(--surface-4);
          border-radius: 0.375rem;
        }
        .wc-kanban-lane-body:not(:has(.wc-kanban-card)) .wc-kanban-empty {
          display: block;
        }
        .wc-kanban-lane-body.drag-over .wc-kanban-empty {
          border-color: var(--lane-color, var(--primary-bg-color));
        }
        .wc-kanban-quick-add {
          padding: 0.5rem;
          border-top: 1px solid var(--surface-4);
        }
        .wc-kanban-quick-add form {
          display: flex;
          gap: 0.5rem;
          width: 100%;
        }
        .wc-kanban-quick-add-input {
          flex: 1 1 auto;
          min-width: 0;
          padding: 0.375rem 0.5rem;
          background-color: var(--surface-3);
          border: 1px solid var(--surface-4);
          border-radius: 0.25rem;
          color: var(--text-1);
        }
        wc-kanban[readonly] .wc-kanban-card {
          cursor: default;
        }
      }
    `.trim();
    this.loadStyle('wc-kanban-style', style);
  }
}

customElements.define(WcKanban.is, WcKanban);
export { WcKanban };
