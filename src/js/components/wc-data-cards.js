/**
 *
 *  Name: wc-data-cards
 *  Usage:
 *    A generic, data-bound responsive card gallery. Bind an array of records and say which
 *    fields are the cover image / title / subtitle / detail subset; it renders a responsive
 *    grid of cards with click-through. The generic counterpart to wc-article-card /
 *    wc-contact-card (which are opinionated, specific cards) — composes the same `.card` look.
 *
 *    <wc-data-cards
 *        items='{{ Data.items|toJSON|safe }}'
 *        image-field="photo"
 *        title-field="name"
 *        subtitle-field="sku"
 *        fields='["price","status"]'
 *        columns="3"
 *        link-template="/x/product/{_id}">
 *    </wc-data-cards>
 *
 *  Item shape: plain record objects; field names are selected via the *-field attributes.
 *
 *  Attributes:
 *    items        (required) — JSON array of record objects
 *    image-field             — optional cover-image URL member (omitted/missing → tidy text card, no broken <img>)
 *    title-field             — title member (default "title")
 *    subtitle-field          — optional subtitle member
 *    fields                  — JSON array of detail member names rendered as .badge chips
 *    columns                 — max columns on wide screens (default 3); responsive 1 → 2 → columns
 *    link-template           — URL with {field} tokens; renders each card as <a href>
 *    id-field                — id member for the open event (default "_id")
 *
 *  Events (bubbling, composed):
 *    wcdatacardsopen — card activated (no link); detail { id }
 *    (legacy alias wc-data-cards:open also fired, deprecated)
 *
 *  htmx-safe: re-renders when items / field mappings / columns change.
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcDataCards extends WcBaseComponent {
  static get is() {
    return 'wc-data-cards';
  }

  static get observedAttributes() {
    return ['id', 'class', 'items', 'image-field', 'title-field', 'subtitle-field',
      'fields', 'columns', 'link-template', 'id-field'];
  }

  constructor() {
    super();
    this._items = [];
    this._onClick = this._handleClick.bind(this);

    const compEl = this.querySelector(':scope > .wc-data-cards');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-data-cards');
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

  get items() { return this._items.slice(); }
  set items(arr) { this.setAttribute('items', JSON.stringify(Array.isArray(arr) ? arr : [])); }
  refresh() { this._renderCards(); }

  _render() {
    super._render();
    this._readConfig();
    this._renderCards();
    this._wireEvents();
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  _readConfig() {
    this._imageField = this.getAttribute('image-field') || '';
    this._titleField = this.getAttribute('title-field') || 'title';
    this._subtitleField = this.getAttribute('subtitle-field') || '';
    this._fields = this._parseJSON('fields', []);
    this._idField = this.getAttribute('id-field') || '_id';
    this._linkTemplate = this.getAttribute('link-template') || '';
    this._columns = parseInt(this.getAttribute('columns'), 10) || 3;
    this._items = this._parseJSON('items', []);
  }

  _renderCards() {
    if (!this.componentElement) return;
    this.componentElement.style.setProperty('--wc-dc-cols', this._columns);
    this.componentElement.innerHTML = '';

    if (!this._items.length) {
      const empty = document.createElement('div');
      empty.classList.add('wc-data-cards-empty');
      empty.textContent = 'No items';
      this.componentElement.appendChild(empty);
      return;
    }

    this._items.forEach(item => this.componentElement.appendChild(this._buildCard(item)));
  }

  _buildCard(item) {
    let card;
    if (this._linkTemplate) {
      card = document.createElement('a');
      card.href = this._resolveTemplate(this._linkTemplate, item);
    } else {
      card = document.createElement('div');
      card.setAttribute('role', 'button');
      card.tabIndex = 0;
    }
    card.classList.add('card', 'wc-data-cards-card');
    const idVal = item[this._idField];
    if (idVal != null) card.dataset.id = String(idVal);

    // Cover image — only when a field is set AND the record has a value (no broken <img>)
    const imgUrl = this._imageField ? item[this._imageField] : null;
    if (imgUrl) {
      const fig = document.createElement('div');
      fig.classList.add('wc-data-cards-cover');
      const img = document.createElement('img');
      img.src = String(imgUrl);
      img.alt = item[this._titleField] != null ? String(item[this._titleField]) : '';
      img.loading = 'lazy';
      fig.appendChild(img);
      card.appendChild(fig);
    }

    const body = document.createElement('div');
    body.classList.add('wc-data-cards-body');

    const title = document.createElement('div');
    title.classList.add('wc-data-cards-title');
    title.textContent = item[this._titleField] != null ? String(item[this._titleField]) : '';
    body.appendChild(title);

    if (this._subtitleField && item[this._subtitleField] != null && String(item[this._subtitleField]).trim() !== '') {
      const sub = document.createElement('div');
      sub.classList.add('wc-data-cards-subtitle');
      sub.textContent = String(item[this._subtitleField]);
      body.appendChild(sub);
    }

    const chips = this._fields
      .map(f => item[f])
      .filter(v => v != null && String(v).trim() !== '');
    if (chips.length) {
      const meta = document.createElement('div');
      meta.classList.add('wc-data-cards-meta');
      chips.forEach(v => {
        const badge = document.createElement('span');
        badge.classList.add('badge', 'badge-muted');
        badge.textContent = String(v);
        meta.appendChild(badge);
      });
      body.appendChild(meta);
    }

    card.appendChild(body);
    return card;
  }

  _parseJSON(attr, fallback) {
    const raw = this.getAttribute(attr);
    if (!raw) return fallback;
    try { const v = JSON.parse(raw); return v != null ? v : fallback; }
    catch (ex) { console.warn(`[wc-data-cards] invalid JSON for ${attr}`, ex); return fallback; }
  }

  _resolveTemplate(tpl, obj) {
    return tpl.replace(/\{([^}]+)\}/g, (m, k) => (obj[k] != null ? encodeURIComponent(String(obj[k])) : ''));
  }

  _handleClick(e) {
    const card = e.target.closest('.wc-data-cards-card');
    if (!card || !this.componentElement.contains(card)) return;
    if (card.tagName === 'A') return; // link navigates natively
    this._emitEvent('wcdatacardsopen', 'wc-data-cards:open', {
      bubbles: true, composed: true, detail: { id: card.dataset.id }
    });
  }

  _wireEvents() {
    super._wireEvents();
    this.componentElement.removeEventListener('click', this._onClick);
    this.componentElement.addEventListener('click', this._onClick);
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.componentElement) this.componentElement.removeEventListener('click', this._onClick);
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    if (['items', 'image-field', 'title-field', 'subtitle-field', 'fields', 'columns', 'link-template', 'id-field'].includes(attrName)) {
      this._readConfig();
      this._renderCards();
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _applyStyle() {
    const style = `
      wc-data-cards { display: contents; }

      @layer wc.usage {
        .wc-data-cards {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          width: 100%;
        }
        @media (min-width: 640px) {
          .wc-data-cards { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1024px) {
          .wc-data-cards { grid-template-columns: repeat(var(--wc-dc-cols, 3), minmax(0, 1fr)); }
        }
        .wc-data-cards-card {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 0;
          text-decoration: none;
          color: var(--text-1);
          transition: box-shadow 0.15s, transform 0.15s, border-color 0.15s;
        }
        a.wc-data-cards-card,
        [role="button"].wc-data-cards-card { cursor: pointer; }
        .wc-data-cards-card:hover {
          box-shadow: 0 4px 14px rgba(0,0,0,0.18);
          border-color: var(--primary-bg-color);
          transform: translateY(-1px);
        }
        .wc-data-cards-card:focus-visible {
          outline: var(--primary-bg-color) solid 2px;
          outline-offset: 2px;
        }
        .wc-data-cards-cover {
          width: 100%;
          aspect-ratio: 16 / 9;
          overflow: hidden;
          background-color: var(--surface-3);
        }
        .wc-data-cards-cover img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }
        .wc-data-cards-body {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          padding: 0.75rem 1rem;
        }
        .wc-data-cards-title { font-weight: 600; font-size: 0.95rem; }
        .wc-data-cards-subtitle {
          font-size: 0.8rem;
          color: var(--text-2, var(--component-alt-color));
        }
        .wc-data-cards-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 0.25rem;
          margin-top: 0.375rem;
        }
        .wc-data-cards-empty {
          grid-column: 1 / -1;
          padding: 1.5rem;
          text-align: center;
          color: var(--text-3, var(--component-alt-color));
        }
      }
    `.trim();
    this.loadStyle('wc-data-cards-style', style);
  }
}

customElements.define(WcDataCards.is, WcDataCards);
export { WcDataCards };
