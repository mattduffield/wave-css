/**
 *  wc-org-chart — event org chart: leadership tiers on top, then titled groups of stations
 *  (nodes) in a responsive grid, each with its leads and members; an optional "Not placed" pool.
 *  Directors drag members between nodes (pointer events: mouse, touch, pen) or use each member's
 *  menu (Move to… / Edit — the keyboard and phone path). Everyone else views it (`readonly`).
 *
 *  <wc-org-chart
 *    tiers='[{"title":"Co-Director","people":[{"id":"p1","name":"Ann Lee","phone":"555-0100"}]}]'
 *    groups='[{"title":"Scenes","nodes":[{"id":"n1","title":"Shepherds","href":"/station/n1",
 *              "count":6,"needed":8,"flags":["no-lead","short:2"],
 *              "leads":[{"id":"l1","name":"Bo Diaz","title":"Scene lead","phone":"555-0101"}],
 *              "members":[{"id":"m1","name":"Cy Park","sub":"Soprano","phone":"555-0102","state":"tonight-only"}]}]}]'
 *    pool='{"title":"Not placed","members":[…]}'
 *    readonly>
 *  </wc-org-chart>
 *
 *  member.state: "" | "out" (dimmed + struck through: not there tonight) | "tonight-only" (chip).
 *  flags: "no-lead" → danger badge, "short:N" → warning badge "Short N", anything else → muted badge.
 *
 *  Events (bubbling, composed):
 *    wcorgchartmove  { memberId, fromNode, toNode }  — CANCELABLE. The UI moves at once; if the event
 *                    is canceled the card returns immediately. If the save fails later, call
 *                    chart.revert(memberId) to send it back.
 *    wcorgchartedit  { memberId }                    — the member menu's Edit item.
 *  Methods: revert(memberId) → boolean, move(memberId, toNodeId) → boolean (programmatic, emits the
 *  move event), nodeOf(memberId) → nodeId | null, refresh().
 *  The pool's node id is "__pool__".
 */

import { WcBaseComponent } from './wc-base-component.js';
import { WcPopover } from '../utils/wc-popover.js';

const POOL_ID = '__pool__';
const DRAG_THRESHOLD = 5;      // px a mouse must travel before a press becomes a drag
const EDGE = 64;               // px from the viewport edge where auto-scroll starts
const MAX_SPEED = 18;          // px per frame at the very edge

class WcOrgChart extends WcBaseComponent {
  static get is() { return 'wc-org-chart'; }

  static get observedAttributes() {
    return ['id', 'class', 'tiers', 'groups', 'pool', 'readonly'];
  }

  constructor() {
    super();
    this._tiers = [];
    this._groups = [];
    this._pool = null;
    this._nodes = new Map();      // nodeId → node object (members array is live)
    this._memberNode = new Map(); // memberId → nodeId
    this._lastFrom = new Map();   // memberId → nodeId before its latest move (for revert)
    this._drag = null;
    this._menu = null;

    this._onPointerDown = this._handlePointerDown.bind(this);
    this._onPointerMove = this._handlePointerMove.bind(this);
    this._onPointerUp = this._handlePointerUp.bind(this);
    this._onPointerCancel = this._handlePointerCancel.bind(this);
    this._onClick = this._handleClick.bind(this);
    this._onKeydown = this._handleKeydown.bind(this);
  }

  async connectedCallback() {
    // the inner element is built on first connect (not in the constructor), so
    // document.createElement('wc-org-chart') works too
    if (!this.componentElement) {
      const existing = this.querySelector(':scope > .wc-org-chart');
      this.componentElement = existing || document.createElement('div');
      if (!existing) {
        this.componentElement.classList.add('wc-org-chart');
        this.appendChild(this.componentElement);
      }
    }
    super.connectedCallback();
    this._applyStyle();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
    this._endDrag(true);
    this._closeMenu();
  }

  // ---- public API -------------------------------------------------------------

  nodeOf(memberId) { return this._memberNode.get(String(memberId)) ?? null; }

  move(memberId, toNodeId) { return this._move(String(memberId), String(toNodeId), 'api'); }

  revert(memberId) {
    const id = String(memberId);
    const back = this._lastFrom.get(id);
    if (back == null || !this._nodes.has(back)) return false;
    this._lastFrom.delete(id);
    this._relocate(id, back);
    const li = this._memberEl(id);
    if (li) {
      li.classList.add('woc-reverted');
      setTimeout(() => li.classList.remove('woc-reverted'), 1200);
    }
    this._announce(`${this._memberName(id)} returned to ${this._nodeTitle(back)}`);
    return true;
  }

  refresh() { this._readConfig(); this._renderChart(); }

  // ---- render -------------------------------------------------------------------

  _render() {
    super._render();
    if (!this.componentElement) return;
    this._readConfig();
    this._renderChart();
    this._wireEvents();
  }

  _readConfig() {
    this._tiers = this._parseJSON('tiers', []);
    this._groups = this._parseJSON('groups', []);
    this._pool = this._parseJSON('pool', null);
    this._readonly = this.hasAttribute('readonly');
    this._nodes.clear();
    this._memberNode.clear();
    for (const g of this._groups) {
      for (const n of (g.nodes || [])) {
        n.id = String(n.id);
        n.members = Array.isArray(n.members) ? n.members : [];
        this._nodes.set(n.id, n);
        for (const m of n.members) this._memberNode.set(String(m.id), n.id);
      }
    }
    if (this._pool) {
      const pool = Array.isArray(this._pool) ? { members: this._pool } : this._pool;
      pool.id = POOL_ID;
      pool.title = pool.title || 'Not placed';
      pool.members = Array.isArray(pool.members) ? pool.members : [];
      this._pool = pool;
      this._nodes.set(POOL_ID, pool);
      for (const m of pool.members) this._memberNode.set(String(m.id), POOL_ID);
    }
  }

  _parseJSON(attr, fallback) {
    const raw = this.getAttribute(attr);
    if (!raw) return fallback;
    try { return JSON.parse(raw); } catch (e) {
      console.warn(`[wc-org-chart] invalid JSON in "${attr}"`, e);
      return fallback;
    }
  }

  _esc(v) {
    return String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  _phone(p) {
    if (!p) return '';
    const tel = String(p).replace(/[^\d+]/g, '');
    return `<a class="woc-phone" href="tel:${this._esc(tel)}">${this._esc(p)}</a>`;
  }

  _flagBadges(flags) {
    return (flags || []).map(f => {
      const s = String(f);
      if (s === 'no-lead') return '<span class="badge badge-danger woc-flag">No lead</span>';
      const m = s.match(/^short:(\d+)$/);
      if (m) return `<span class="badge badge-warning woc-flag">Short ${this._esc(m[1])}</span>`;
      return `<span class="badge badge-muted woc-flag">${this._esc(s)}</span>`;
    }).join('');
  }

  _memberHtml(m) {
    const state = m.state === 'out' ? 'out' : m.state === 'tonight-only' ? 'tonight-only' : '';
    const ro = this._readonly;
    const name = this._esc(m.name);
    return `<li class="woc-member${state ? ' woc-' + state : ''}" data-member-id="${this._esc(m.id)}"${state === 'out' ? ' aria-label="' + name + ', out tonight"' : ''}>
      ${ro ? '' : '<span class="woc-grip" aria-hidden="true" title="Drag to move">⠿</span>'}
      <span class="woc-member-main">
        <span class="woc-name">${name}</span>${m.sub ? `<span class="woc-sub">${this._esc(m.sub)}</span>` : ''}
        ${state === 'tonight-only' ? '<span class="badge badge-info woc-chip">Tonight only</span>' : ''}
        ${state === 'out' ? '<span class="woc-visually-hidden">(out tonight)</span>' : ''}
      </span>
      ${this._phone(m.phone)}
      <button type="button" class="woc-menu-btn" aria-haspopup="menu" aria-label="Actions for ${name}">⋯</button>
    </li>`;
  }

  _nodeHtml(n, isPool = false) {
    const members = n.members || [];
    const needed = n.needed != null ? ` / ${this._esc(n.needed)}` : '';
    const title = n.href && !isPool
      ? `<a class="woc-node-title" href="${this._esc(n.href)}">${this._esc(n.title)}</a>`
      : `<span class="woc-node-title">${this._esc(n.title)}</span>`;
    const leads = (n.leads || []).map(l => `<li class="woc-lead">
        <span class="badge badge-primary woc-lead-badge">Lead</span>
        <span class="woc-member-main"><span class="woc-name">${this._esc(l.name)}</span>${l.title ? `<span class="woc-sub">${this._esc(l.title)}</span>` : ''}</span>
        ${this._phone(l.phone)}
      </li>`).join('');
    return `<article class="woc-node${isPool ? ' woc-pool' : ''}" data-node-id="${this._esc(n.id)}" aria-label="${this._esc(n.title)}">
      <header class="woc-node-head">
        <h4 class="woc-node-heading">${title}</h4>
        <span class="woc-count" title="placed${n.needed != null ? ' / needed' : ''}"><span class="woc-count-n">${members.length}</span>${needed}</span>
      </header>
      ${(n.flags || []).length ? `<div class="woc-flags">${this._flagBadges(n.flags)}</div>` : ''}
      ${leads ? `<ul class="woc-leads" aria-label="Leads">${leads}</ul>` : ''}
      <ul class="woc-members" aria-label="Members">${members.map(m => this._memberHtml(m)).join('')}</ul>
      <p class="woc-empty"${members.length ? ' hidden' : ''}>No one placed</p>
    </article>`;
  }

  _renderChart() {
    const tiers = this._tiers.map(t => `<div class="woc-tier">
        <h3 class="woc-tier-title">${this._esc(t.title)}</h3>
        <ul class="woc-tier-people">${(t.people || []).map(p => `<li class="woc-person"><span class="woc-name">${this._esc(p.name)}</span>${this._phone(p.phone)}</li>`).join('')}</ul>
      </div>`).join('');
    const groups = this._groups.map(g => `<section class="woc-group">
        <h3 class="woc-group-title">${this._esc(g.title)}</h3>
        <div class="woc-grid">${(g.nodes || []).map(n => this._nodeHtml(n)).join('')}</div>
      </section>`).join('');
    const pool = this._pool ? `<section class="woc-group woc-pool-group"><div class="woc-grid woc-grid-pool">${this._nodeHtml(this._pool, true)}</div></section>` : '';
    this.componentElement.classList.toggle('woc-readonly', this._readonly);
    this.componentElement.innerHTML = `
      ${tiers ? `<section class="woc-tiers" aria-label="Leadership">${tiers}</section>` : ''}
      ${groups}${pool}
      <div class="woc-live" role="status" aria-live="polite"></div>`;
  }

  // ---- model / DOM moves -------------------------------------------------------------

  _memberEl(id) { return this.componentElement.querySelector(`.woc-member[data-member-id="${CSS.escape(id)}"]`); }
  _nodeEl(id) { return this.componentElement.querySelector(`.woc-node[data-node-id="${CSS.escape(id)}"]`); }
  _nodeTitle(id) { return this._nodes.get(id)?.title ?? id; }
  _memberName(id) {
    const n = this._nodes.get(this._memberNode.get(id));
    return n?.members.find(m => String(m.id) === id)?.name ?? id;
  }

  // move the model entry and the DOM row; no events
  _relocate(memberId, toNodeId) {
    const fromId = this._memberNode.get(memberId);
    const from = this._nodes.get(fromId), to = this._nodes.get(toNodeId);
    if (!from || !to || fromId === toNodeId) return false;
    const i = from.members.findIndex(m => String(m.id) === memberId);
    if (i < 0) return false;
    const [m] = from.members.splice(i, 1);
    to.members.push(m);
    this._memberNode.set(memberId, toNodeId);
    const li = this._memberEl(memberId);
    const toEl = this._nodeEl(toNodeId);
    if (li && toEl) toEl.querySelector('.woc-members').appendChild(li);
    this._syncCounts(fromId);
    this._syncCounts(toNodeId);
    return true;
  }

  _syncCounts(nodeId) {
    const el = this._nodeEl(nodeId), n = this._nodes.get(nodeId);
    if (!el || !n) return;
    el.querySelector('.woc-count-n').textContent = n.members.length;
    el.querySelector('.woc-empty').hidden = n.members.length > 0;
  }

  _move(memberId, toNodeId, source) {
    if (this._readonly) return false;
    const fromNode = this._memberNode.get(memberId);
    if (fromNode == null || fromNode === toNodeId || !this._nodes.has(toNodeId)) return false;
    this._relocate(memberId, toNodeId);      // the UI moves at once
    this._lastFrom.set(memberId, fromNode);
    const evt = new CustomEvent('wcorgchartmove', {
      bubbles: true, composed: true, cancelable: true,
      detail: { memberId, fromNode, toNode: toNodeId, source }
    });
    if (!this.dispatchEvent(evt)) {           // the page said no → back it goes
      this._lastFrom.delete(memberId);
      this._relocate(memberId, fromNode);
      this._announce(`Move of ${this._memberName(memberId)} canceled`);
      return false;
    }
    this._announce(`${this._memberName(memberId)} moved to ${this._nodeTitle(toNodeId)}`);
    return true;
  }

  _announce(text) {
    const live = this.componentElement.querySelector('.woc-live');
    if (live) live.textContent = text;
  }

  // ---- pointer drag ----------------------------------------------------------------------

  _wireEvents() {
    super._wireEvents();
    this._unWireEvents();
    const c = this.componentElement;
    c.addEventListener('pointerdown', this._onPointerDown);
    c.addEventListener('click', this._onClick);
    c.addEventListener('keydown', this._onKeydown);
  }

  _unWireEvents() {
    super._unWireEvents();
    const c = this.componentElement;
    if (!c) return;
    c.removeEventListener('pointerdown', this._onPointerDown);
    c.removeEventListener('click', this._onClick);
    c.removeEventListener('keydown', this._onKeydown);
  }

  _handlePointerDown(e) {
    if (this._readonly || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const li = e.target.closest('.woc-member');
    if (!li || e.target.closest('.woc-menu-btn, .woc-phone')) return;
    const onGrip = !!e.target.closest('.woc-grip');
    // touch and pen drag from the grip (the rest of the row scrolls the page); mouse from anywhere
    if (e.pointerType !== 'mouse' && !onGrip) return;
    if (onGrip) e.preventDefault();
    this._drag = { li, id: li.dataset.memberId, pointerId: e.pointerId, x0: e.clientX, y0: e.clientY,
                   x: e.clientX, y: e.clientY, active: onGrip, ghost: null, target: null, raf: 0, type: e.pointerType };
    try { (onGrip ? e.target.closest('.woc-grip') : li).setPointerCapture(e.pointerId); } catch (_) {}
    window.addEventListener('pointermove', this._onPointerMove, { passive: false });
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerCancel);
    if (onGrip) this._startDrag();
  }

  _startDrag() {
    const d = this._drag;
    d.active = true;
    const r = d.li.getBoundingClientRect();
    d.dx = d.x0 - r.left; d.dy = d.y0 - r.top;
    const ghost = d.li.cloneNode(true);
    ghost.classList.add('woc-ghost');
    ghost.removeAttribute('data-member-id');
    ghost.style.width = `${r.width}px`;
    this.componentElement.appendChild(ghost);
    d.ghost = ghost;
    d.li.classList.add('woc-dragging');
    this.componentElement.classList.add('woc-is-dragging');
    this._positionGhost();
    const tick = () => { if (!this._drag?.active) return; this._autoScroll(); this._trackTarget(); d.raf = requestAnimationFrame(tick); };
    d.raf = requestAnimationFrame(tick);
  }

  _handlePointerMove(e) {
    const d = this._drag;
    if (!d || e.pointerId !== d.pointerId) return;
    d.x = e.clientX; d.y = e.clientY;
    if (!d.active) {
      if (Math.hypot(d.x - d.x0, d.y - d.y0) < DRAG_THRESHOLD) return;
      this._startDrag();
    }
    e.preventDefault();
    this._positionGhost();
  }

  _positionGhost() {
    const d = this._drag;
    if (d?.ghost) d.ghost.style.transform = `translate(${d.x - d.dx}px, ${d.y - d.dy}px)`;
  }

  _trackTarget() {
    const d = this._drag;
    const el = document.elementFromPoint(d.x, d.y);
    let node = el?.closest?.('.woc-node');
    if (node && !this.componentElement.contains(node)) node = null;
    if (node === d.target) return;
    d.target?.classList.remove('woc-drop-target');
    d.target = node;
    const from = this._memberNode.get(d.id);
    if (node && node.dataset.nodeId !== from) node.classList.add('woc-drop-target');
  }

  _autoScroll() {
    const d = this._drag, h = window.innerHeight;
    let dy = 0;
    if (d.y < EDGE) dy = -Math.ceil(MAX_SPEED * (1 - Math.max(d.y, 0) / EDGE));
    else if (d.y > h - EDGE) dy = Math.ceil(MAX_SPEED * (1 - Math.max(h - d.y, 0) / EDGE));
    if (!dy) return;
    // the nearest scrollable ancestor that can still move that way, else the window
    for (let n = this.componentElement.parentElement; n && n !== document.body; n = n.parentElement) {
      const cs = getComputedStyle(n);
      if (/(auto|scroll)/.test(cs.overflowY) && n.scrollHeight > n.clientHeight) {
        const before = n.scrollTop; n.scrollTop += dy;
        if (n.scrollTop !== before) return;
      }
    }
    window.scrollBy(0, dy);
  }

  _handlePointerUp(e) {
    const d = this._drag;
    if (!d || e.pointerId !== d.pointerId) return;
    if (d.active && d.target) {
      const to = d.target.dataset.nodeId;
      this._endDrag(false);
      this._move(d.id, to, d.type === 'mouse' ? 'drag' : `drag-${d.type}`);
      this._suppressClick = true;
      setTimeout(() => { this._suppressClick = false; }, 0);
      return;
    }
    this._endDrag(false);
  }

  _handlePointerCancel(e) {
    if (this._drag && e.pointerId === this._drag.pointerId) this._endDrag(true);
  }

  _endDrag() {
    const d = this._drag;
    if (!d) return;
    cancelAnimationFrame(d.raf);
    d.ghost?.remove();
    d.li?.classList.remove('woc-dragging');
    d.target?.classList.remove('woc-drop-target');
    this.componentElement?.classList.remove('woc-is-dragging');
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerCancel);
    this._drag = null;
  }

  // ---- member menu ---------------------------------------------------------------------------

  _handleClick(e) {
    if (this._suppressClick) { e.preventDefault(); return; }
    const btn = e.target.closest('.woc-menu-btn');
    if (btn) { e.preventDefault(); this._openMenu(btn); }
  }

  _handleKeydown(e) {
    const btn = e.target.closest?.('.woc-menu-btn');
    if (btn && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      this._openMenu(btn);
    }
  }

  _openMenu(btn) {
    this._closeMenu();
    const li = btn.closest('.woc-member');
    const memberId = li.dataset.memberId;
    const current = this._memberNode.get(memberId);
    const panel = document.createElement('div');
    panel.className = 'woc-menu';
    panel.setAttribute('role', 'menu');
    panel.setAttribute('aria-label', `Actions for ${this._memberName(memberId)}`);
    let html = '';
    if (!this._readonly) {
      html += '<div class="woc-menu-label" role="presentation">Move to…</div>';
      const sections = this._groups.map(g => ({ title: g.title, nodes: g.nodes || [] }));
      if (this._pool) sections.push({ title: '', nodes: [this._pool] });
      for (const s of sections) {
        if (s.title) html += `<div class="woc-menu-group" role="presentation">${this._esc(s.title)}</div>`;
        for (const n of s.nodes) {
          const here = n.id === current;
          html += `<button type="button" role="menuitem" class="woc-menu-item" data-action="move" data-node-id="${this._esc(n.id)}"${here ? ' aria-disabled="true" aria-current="true"' : ''}>${this._esc(n.title)}${here ? ' <span class="woc-menu-here">(here)</span>' : ''}</button>`;
        }
      }
      html += '<div class="woc-menu-sep" role="separator"></div>';
    }
    html += '<button type="button" role="menuitem" class="woc-menu-item" data-action="edit">Edit…</button>';
    panel.innerHTML = html;
    const items = () => [...panel.querySelectorAll('.woc-menu-item:not([aria-disabled="true"])')];
    panel.addEventListener('click', ev => {
      const it = ev.target.closest('.woc-menu-item');
      if (!it || it.getAttribute('aria-disabled') === 'true') return;
      this._closeMenu(false);
      if (it.dataset.action === 'move') this._move(memberId, it.dataset.nodeId, 'menu');
      else this.dispatchEvent(new CustomEvent('wcorgchartedit', { bubbles: true, composed: true, detail: { memberId } }));
      // refocus AFTER the move: relocating the row (appendChild) drops focus from anything inside it
      if (btn.isConnected) btn.focus();
    });
    panel.addEventListener('keydown', ev => {
      const list = items(); const i = list.indexOf(document.activeElement);
      if (ev.key === 'ArrowDown') { ev.preventDefault(); list[(i + 1) % list.length]?.focus(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); list[(i - 1 + list.length) % list.length]?.focus(); }
      else if (ev.key === 'Home') { ev.preventDefault(); list[0]?.focus(); }
      else if (ev.key === 'End') { ev.preventDefault(); list[list.length - 1]?.focus(); }
      else if (ev.key === 'Escape' || ev.key === 'Tab') { ev.preventDefault(); this._closeMenu(true); }
    });
    this._menu = { btn, pop: new WcPopover(this, { onClose: () => { this._menu = null; }, minWidth: 220, maxHeight: 360 }) };
    this._menu.pop.open(btn, panel);
    btn.setAttribute('aria-expanded', 'true');
    items()[0]?.focus();
  }

  _closeMenu(refocus = false) {
    if (!this._menu) return;
    const { btn, pop } = this._menu;
    this._menu = null;
    btn.setAttribute('aria-expanded', 'false');
    pop.close();
    if (refocus && btn.isConnected) btn.focus();
  }

  // ---- attributes / style ----------------------------------------------------------------------

  _handleAttributeChange(attrName, newValue) {
    if (['tiers', 'groups', 'pool', 'readonly'].includes(attrName)) {
      if (!this.componentElement) return;
      this._endDrag(true);
      this._closeMenu();
      this._readConfig();
      this._renderChart();
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _applyStyle() {
    const style = `
      wc-org-chart { display: contents; }
      @layer wc.usage {
        .wc-org-chart { container-type: inline-size; display: flex; flex-direction: column; gap: 1.25rem; color: var(--text-1); }
        .wc-org-chart ul { list-style: none; margin: 0; padding: 0; }
        .wc-org-chart .woc-visually-hidden { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
        .wc-org-chart .woc-live { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }

        /* tiers: one centered row per title */
        .wc-org-chart .woc-tiers { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
        .wc-org-chart .woc-tier { display: flex; flex-direction: column; align-items: center; gap: 0.375rem; }
        .wc-org-chart .woc-tier-title { margin: 0; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-3); }
        .wc-org-chart .woc-tier-people { display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem; }
        .wc-org-chart .woc-person { display: flex; flex-direction: column; align-items: center; padding: 0.375rem 0.75rem;
          background: var(--card-bg-color); border: 1px solid var(--text-9); border-radius: 0.5rem; }

        /* groups + responsive grid: 1 column on phones, 3 on tablets, 4 on desktops */
        .wc-org-chart .woc-group-title { margin: 0 0 0.5rem; font-size: 1rem; font-weight: 700; color: var(--text-2); }
        .wc-org-chart .woc-grid { display: grid; grid-template-columns: 1fr; gap: 0.75rem; align-items: start; }
        @container (min-width: 640px) { .wc-org-chart .woc-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
        @container (min-width: 1024px) { .wc-org-chart .woc-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
        .wc-org-chart .woc-grid-pool { grid-template-columns: 1fr !important; }

        /* node (station) */
        .wc-org-chart .woc-node { display: flex; flex-direction: column; gap: 0.375rem; min-width: 0; padding: 0.625rem;
          background: var(--card-bg-color); color: var(--text-1); border: 1px solid var(--text-9); border-radius: 0.5rem; }
        .wc-org-chart .woc-node-head { display: flex; align-items: baseline; gap: 0.5rem; }
        .wc-org-chart .woc-node-heading { margin: 0; font-size: 0.9375rem; font-weight: 700; flex: 1 1 auto; min-width: 0; overflow-wrap: anywhere; }
        .wc-org-chart .woc-node-title { color: var(--text-1); text-decoration: underline; text-underline-offset: 2px; }
        .wc-org-chart span.woc-node-title { text-decoration: none; }
        .wc-org-chart .woc-count { font-size: 0.8125rem; font-variant-numeric: tabular-nums; color: var(--text-3); white-space: nowrap; }
        .wc-org-chart .woc-flags { display: flex; flex-wrap: wrap; gap: 0.25rem; }
        .wc-org-chart .woc-empty { margin: 0; font-size: 0.8125rem; font-style: italic; color: var(--text-5); }

        /* leads vs members */
        .wc-org-chart .woc-leads { display: flex; flex-direction: column; gap: 0.25rem; padding-bottom: 0.375rem; border-bottom: 1px solid var(--text-9); }
        .wc-org-chart .woc-lead, .wc-org-chart .woc-member { display: flex; align-items: center; gap: 0.375rem; min-height: 2rem; }
        .wc-org-chart .woc-member { padding: 0.125rem 0.25rem; border-radius: 0.375rem; }
        .wc-org-chart .woc-member-main { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: 0.375rem; flex: 1 1 auto; min-width: 0; }
        .wc-org-chart .woc-name { font-size: 0.875rem; font-weight: 600; color: var(--text-1); overflow-wrap: anywhere; }
        .wc-org-chart .woc-sub { font-size: 0.75rem; color: var(--text-4); }
        .wc-org-chart .woc-lead-badge, .wc-org-chart .woc-chip { flex: 0 0 auto; }
        .wc-org-chart .woc-phone { font-size: 0.75rem; color: var(--text-3); white-space: nowrap; text-decoration: none; }
        .wc-org-chart .woc-phone:hover { text-decoration: underline; color: var(--text-1); }
        /* "out": not there tonight — dimmed by a lighter text level (still >= 4.5:1) + struck through */
        .wc-org-chart .woc-out .woc-name, .wc-org-chart .woc-out .woc-sub { color: var(--text-5); text-decoration: line-through; font-weight: 400; }

        /* controls */
        .wc-org-chart .woc-grip { flex: 0 0 auto; width: 1.5rem; height: 1.75rem; display: inline-flex; align-items: center; justify-content: center;
          color: var(--text-3); cursor: grab; touch-action: none; user-select: none; border-radius: 0.25rem; }
        .wc-org-chart .woc-menu-btn { flex: 0 0 auto; width: 2rem; height: 2rem; padding: 0; border: 1px solid transparent; border-radius: 0.375rem;
          background: transparent; color: var(--text-2); font-size: 1.125rem; line-height: 1; cursor: pointer; }
        .wc-org-chart .woc-menu-btn:hover { border-color: var(--text-9); }
        .wc-org-chart .woc-menu-btn:focus-visible, .wc-org-chart .woc-node-title:focus-visible, .wc-org-chart .woc-phone:focus-visible {
          outline: 2px solid var(--text-1); outline-offset: 1px; }
        .wc-org-chart:not(.woc-readonly) .woc-member { cursor: grab; }

        /* drag */
        .wc-org-chart.woc-is-dragging, .wc-org-chart.woc-is-dragging * { cursor: grabbing !important; user-select: none; }
        .wc-org-chart .woc-dragging { opacity: 0.45; }
        .wc-org-chart .woc-ghost { position: fixed; left: 0; top: 0; z-index: 10000; pointer-events: none; margin: 0;
          background: var(--card-bg-color); border: 1px solid var(--text-9); box-shadow: 0 8px 24px rgb(0 0 0 / 0.25); }
        /* drop target: a thick outline in body text color (>= 3:1 against the page and the node in every
           theme). No background wash — tinting the node would lower the contrast of the text inside it. */
        .wc-org-chart .woc-drop-target { outline: 3px solid var(--text-1); outline-offset: 2px; }
        .wc-org-chart .woc-reverted { outline: 2px dashed var(--text-1); outline-offset: 1px; }
      }
      /* the menu lives on <body> (WcPopover) — unlayered + tightly scoped, like other Wave popovers */
      .woc-menu { display: flex; flex-direction: column; padding: 0.25rem; overflow: auto; background: var(--component-bg-color); color: var(--text-1);
        border: 1px solid var(--text-9); border-radius: 0.5rem; box-shadow: 0 10px 30px rgb(0 0 0 / 0.25); font-size: 0.875rem; }
      .woc-menu .woc-menu-label { padding: 0.375rem 0.5rem 0.125rem; font-size: 0.75rem; font-weight: 700; color: var(--text-3); }
      .woc-menu .woc-menu-group { padding: 0.375rem 0.5rem 0.125rem; font-size: 0.6875rem; letter-spacing: 0.04em; text-transform: uppercase; color: var(--text-4); }
      .woc-menu .woc-menu-item { display: block; width: 100%; text-align: left; padding: 0.375rem 0.75rem; border: 0; border-radius: 0.375rem;
        background: transparent; color: var(--text-1); font: inherit; cursor: pointer; }
      .woc-menu .woc-menu-item:hover, .woc-menu .woc-menu-item:focus-visible { background: var(--surface-3); outline: 2px solid var(--text-1); outline-offset: -2px; }
      .woc-menu .woc-menu-item[aria-disabled="true"] { cursor: default; color: var(--text-4); }
      .woc-menu .woc-menu-here { color: var(--text-4); }
      .woc-menu .woc-menu-sep { height: 1px; margin: 0.25rem 0.25rem; background: var(--text-9); }

      @media print {
        @page { size: landscape; margin: 10mm; }
        .wc-org-chart { gap: 0.5rem; font-size: 9pt; }
        .wc-org-chart .woc-grid { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; gap: 0.375rem; }
        .wc-org-chart .woc-node { break-inside: avoid; page-break-inside: avoid; padding: 0.375rem; gap: 0.125rem; }
        .wc-org-chart .woc-group-title { break-after: avoid; page-break-after: avoid; }
        .wc-org-chart .woc-lead, .wc-org-chart .woc-member { min-height: 0; }
        .wc-org-chart .woc-menu-btn, .wc-org-chart .woc-grip, .woc-menu { display: none !important; }
      }
    `.trim();
    this.loadStyle('wc-org-chart-style', style);
  }
}

customElements.define(WcOrgChart.is, WcOrgChart);
