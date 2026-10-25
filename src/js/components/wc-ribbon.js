/**
 *
 *  Name: wc-ribbon (+ wc-ribbon-tab, wc-ribbon-group, wc-ribbon-button, wc-ribbon-item, wc-ribbon-split)
 *  Usage:
 *    A Fusion 360 / Microsoft Office–style ribbon. Each group shows a few large icon-over-label
 *    buttons; the group's title opens a menu listing EVERY command in the group (common + less-used)
 *    with an icon, a name and a one-line description. Contextual tabs appear only when relevant.
 *
 *    <wc-ribbon active="solid" keytips>
 *      <wc-ribbon-tab key="solid" label="Solid">
 *        <wc-ribbon-group label="Create" menu>
 *          <wc-ribbon-button command="extrude" icon="arrow-up-from-line" label="Extrude"
 *                            tip="Pull the selected sketch into a solid"></wc-ribbon-button>
 *          <wc-ribbon-item command="loft" icon="layer-group" label="Loft" tip="…"></wc-ribbon-item>
 *        </wc-ribbon-group>
 *        <wc-ribbon-group label="Inspect">
 *          <select caption="Section">…</select>          <!-- any other element = a widget -->
 *        </wc-ribbon-group>
 *      </wc-ribbon-tab>
 *      <wc-ribbon-tab key="sketch" label="Sketch" contextual accent="success" hidden>…</wc-ribbon-tab>
 *    </wc-ribbon>
 *
 *  wc-ribbon         active (tab key), compact (single row), keytips (Alt shows key letters)
 *    methods         setTab(key), showTab(key, activate?), hideTab(key), setActive(command, bool),
 *                    setDisabled(command, bool), setModel(model), closeMenus(), relayout()
 *    events          wcribboncommand {command, tab, group, active?, source}  (alias ribbon-command)
 *                    wcribbontabchange {tab, previous}                        (alias ribbon-tab-change)
 *                    both also broadcast through wc.EventHub (detail.custom)
 *    EventHub in     wcribbonactivate / wcribbontabshow / wcribbontabhide — selector = the ribbon,
 *                    subSelector = the tab key (e.g. broadcast('wcribbontabshow', '#rb', 'sketch'))
 *  wc-ribbon-tab     key, label, contextual, accent (primary|success|warning|danger|info), hidden, keytip
 *  wc-ribbon-group   label, menu (title opens a menu of every command), icon (shown when collapsed)
 *  wc-ribbon-button  command, icon | glyph, label, tip, variant (primary|success|warning|danger|info),
 *                    toggle, toggle-group, active, disabled, menu-only, keytip
 *  wc-ribbon-item    same attributes — listed only in the group's menu (or a split's menu)
 *  wc-ribbon-split   same attributes for the main action; child wc-ribbon-items are its variants
 *  widgets           any other element in a group renders as a compact control; `caption` attr
 *                    adds a caption under it
 *
 *  Narrow widths: groups collapse right-to-left into one "GROUP ▾" button that opens the same menu,
 *  then into a ⋯ overflow menu — never a horizontal scrollbar. Menus open in the top layer
 *  (popover) anchored to their own button, flip up/left near the viewport edge, and stay in the
 *  ribbon's DOM so they inherit CSS variables and theme changes live.
 *
 *  CSS variables: --wc-ribbon-bg, --wc-ribbon-group-border, --wc-ribbon-button-hover,
 *    --wc-ribbon-label-color, --wc-ribbon-menu-bg, --wc-ribbon-menu-width, --wc-ribbon-accent
 */

import { WcBaseComponent } from './wc-base-component.js';

const ACCENTS = ['primary', 'success', 'warning', 'danger', 'info'];
const ACCENT_VAR = {
  primary: 'var(--primary-bg-color)',
  success: 'var(--success-color)',
  warning: 'var(--warning-color)',
  danger: 'var(--danger-color)',
  info: 'var(--info-color)',
};
const COMMAND_TAGS = 'wc-ribbon-button, wc-ribbon-item, wc-ribbon-split';
const OWN_TAGS = /^WC-RIBBON-(BUTTON|ITEM|SPLIT)$/;
let uidSeq = 0;

// Tabs may not be upgraded yet when the ribbon renders (it is defined first), so read attributes.
const tabKey = (t) => t.getAttribute('key') || (t.getAttribute('label') || '').toLowerCase();
const tabLabel = (t) => t.getAttribute('label') || t.getAttribute('key') || '';

const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
};

// Picture for a command: a text glyph (⊥ ∥ ◎) or a Font Awesome icon via wc-fa-icon.
function pictureFor(host, size) {
  const glyph = host.getAttribute('glyph');
  if (glyph) {
    const g = el('span', 'wc-ribbon-glyph', glyph);
    g.setAttribute('aria-hidden', 'true');
    return g;
  }
  const icon = host.getAttribute('icon');
  if (icon) {
    const i = document.createElement('wc-fa-icon');
    i.setAttribute('name', icon);
    i.setAttribute('size', size);
    i.classList.add('wc-ribbon-icon');
    i.setAttribute('aria-hidden', 'true');
    return i;
  }
  const blank = el('span', 'wc-ribbon-glyph is-blank');
  blank.setAttribute('aria-hidden', 'true');
  return blank;
}

function titleFor(host) {
  const label = host.getAttribute('label') || host.getAttribute('command') || '';
  const tip = host.getAttribute('tip');
  return tip ? `${label} — ${tip}` : label;
}

// Inner element: reuse a rendered one (htmx swap of rendered markup) or create it. Done on first
// render, not in the constructor, so document.createElement('wc-ribbon-…') works too (a custom
// element constructor may not add children).
function ensureInner(host, tag, cls) {
  if (!host.componentElement) {
    host.componentElement = host.querySelector(`:scope > .${cls.split(' ')[0]}`) || el(tag, cls);
    if (!host.componentElement.parentNode) host.appendChild(host.componentElement);
  }
  return host.componentElement;
}

// ---------------------------------------------------------------------------------------------
// Command hosts: wc-ribbon-button / wc-ribbon-item / wc-ribbon-split
// ---------------------------------------------------------------------------------------------

class WcRibbonCommandBase extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'command', 'icon', 'glyph', 'label', 'tip', 'variant', 'toggle',
      'toggle-group', 'active', 'disabled', 'menu-only', 'keytip', 'hidden'];
  }

  get command() { return this.getAttribute('command') || ''; }
  get label() { return this.getAttribute('label') || this.command; }
  get active() { return this.hasAttribute('active'); }
  set active(v) { this.toggleAttribute('active', !!v); }
  get disabled() { return this.hasAttribute('disabled'); }
  set disabled(v) { this.toggleAttribute('disabled', !!v); }

  getDesignerHTML() { return null; }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'class') {
      if (this.componentElement) super._handleAttributeChange(attrName, newValue, oldValue);
      return;
    }
    if (attrName === 'id') return;
    this._sync(attrName);
    // keep an open menu in step without rebuilding it
    this.closest('wc-ribbon')?._syncMenuItem?.(this);
    if (attrName === 'hidden' || attrName === 'menu-only') this.closest('wc-ribbon')?.relayout?.();
  }

  _sync() {}
}

class WcRibbonButton extends WcRibbonCommandBase {
  static get is() { return 'wc-ribbon-button'; }

  _render() {
    super._render();
    const b = ensureInner(this, 'button', 'wc-ribbon-btn');
    b.type = 'button';
    b.dataset.role = 'command';
    if (!b.querySelector(':scope > .wc-ribbon-btn-label')) this._build(); // idempotent when moved
    else this._sync();
  }

  _build() {
    const b = this.componentElement;
    b.textContent = '';
    b.append(pictureFor(this, '1.15rem'), el('span', 'wc-ribbon-btn-label', this.label));
    this._sync();
  }

  _sync(attr) {
    const b = this.componentElement;
    if (!b) return;
    if (attr === 'icon' || attr === 'glyph' || attr === 'label') { this._build(); return; }
    b.title = titleFor(this);
    b.disabled = this.disabled;
    b.dataset.command = this.command;
    const variant = this.getAttribute('variant');
    if (ACCENTS.includes(variant)) b.dataset.variant = variant; else delete b.dataset.variant;
    if (this.hasAttribute('toggle')) b.setAttribute('aria-pressed', String(this.active));
    else b.removeAttribute('aria-pressed');
    b.classList.toggle('is-on', this.active);
  }
}

class WcRibbonItem extends WcRibbonCommandBase {
  static get is() { return 'wc-ribbon-item'; }
  // Menu-only: renders nothing in the group; the menu reads its attributes.
  _render() {}
}

class WcRibbonSplit extends WcRibbonCommandBase {
  static get is() { return 'wc-ribbon-split'; }

  _render() {
    super._render();
    ensureInner(this, 'div', 'wc-ribbon-split');
    if (!this._main) {
      this._main = this.componentElement.querySelector('.wc-ribbon-btn') || el('button', 'wc-ribbon-btn wc-ribbon-split-main');
      this._arrow = this.componentElement.querySelector('.wc-ribbon-split-arrow') || el('button', 'wc-ribbon-split-arrow');
      this._main.type = 'button';
      this._main.dataset.role = 'command';
      this._arrow.type = 'button';
      this._arrow.dataset.role = 'split-menu';
      this._arrow.setAttribute('aria-haspopup', 'menu');
      this._arrow.setAttribute('aria-expanded', 'false');
      this.componentElement.append(this._main, this._arrow);
      this._build();
    } else {
      this._sync();
    }
  }

  get variants() {
    return Array.from(this.querySelectorAll(':scope > wc-ribbon-item'));
  }

  _build() {
    if (!this._main) return;
    this._main.textContent = '';
    this._main.append(pictureFor(this, '1.15rem'));
    this._arrow.textContent = '';
    this._arrow.append(el('span', 'wc-ribbon-btn-label', this.label), el('span', 'wc-ribbon-caret', '▾'));
    this._sync();
  }

  _sync(attr) {
    if (!this._main) return;
    if (attr === 'icon' || attr === 'glyph' || attr === 'label') { this._build(); return; }
    this._main.title = titleFor(this);
    this._main.setAttribute('aria-label', this.label);
    this._arrow.title = `${this.label} — more options`;
    this._arrow.setAttribute('aria-label', `${this.label} options`);
    this._main.disabled = this._arrow.disabled = this.disabled;
    this._main.dataset.command = this.command;
    const variant = this.getAttribute('variant');
    if (ACCENTS.includes(variant)) this.componentElement.dataset.variant = variant;
    else delete this.componentElement.dataset.variant;
    if (this.hasAttribute('toggle')) this._main.setAttribute('aria-pressed', String(this.active));
    this.componentElement.classList.toggle('is-on', this.active);
  }
}

// ---------------------------------------------------------------------------------------------
// wc-ribbon-group
// ---------------------------------------------------------------------------------------------

class WcRibbonGroup extends WcBaseComponent {
  static get is() { return 'wc-ribbon-group'; }

  static get observedAttributes() {
    return ['id', 'class', 'label', 'menu', 'icon', 'hidden'];
  }

  get label() { return this.getAttribute('label') || ''; }

  getDesignerHTML() { return null; }

  _render() {
    super._render();
    const g = ensureInner(this, 'div', 'wc-ribbon-group');
    g.setAttribute('role', 'group');
    this._items = g.querySelector(':scope > .wc-ribbon-group-items');
    if (!this._items) {
      this._items = el('div', 'wc-ribbon-group-items');
      this._collapse = el('button', 'wc-ribbon-btn wc-ribbon-collapse');
      this._collapse.type = 'button';
      this._collapse.dataset.role = 'group-menu';
      this._collapse.setAttribute('aria-haspopup', 'menu');
      this._collapse.setAttribute('aria-expanded', 'false');
      this._title = el('div', 'wc-ribbon-group-label');
      g.append(this._items, this._collapse, this._title);
    } else {
      this._collapse = g.querySelector(':scope > .wc-ribbon-collapse');
      this._title = g.querySelector(':scope > .wc-ribbon-group-label');
    }
    this._adopt();
    this._renderTitle();
  }

  // Move the host's own children into the items row (appendChild keeps their state/bindings).
  _adopt() {
    Array.from(this.childNodes).forEach(node => {
      if (node === this.componentElement) return;
      if (node.nodeType === Node.TEXT_NODE) {
        if (!node.textContent.trim()) node.remove();
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      if (OWN_TAGS.test(node.tagName)) {
        this._items.appendChild(node);
      } else {
        // any other element is a widget, shown compactly with an optional caption
        const wrap = el('div', 'wc-ribbon-widget');
        this._items.appendChild(wrap);
        wrap.appendChild(node);
        const caption = node.getAttribute('caption');
        if (caption) wrap.appendChild(el('span', 'wc-ribbon-caption', caption));
      }
    });
    if (this._title) this._renderTitle();
  }

  _renderTitle() {
    const label = this.label;
    this.componentElement.setAttribute('aria-label', label);
    const menu = this.hasAttribute('menu');
    let title = this._title;
    const wantTag = menu ? 'BUTTON' : 'DIV';
    if (title.tagName !== wantTag) {
      const next = el(menu ? 'button' : 'div', 'wc-ribbon-group-label');
      title.replaceWith(next);
      this._title = title = next;
    }
    title.textContent = '';
    if (menu) {
      title.type = 'button';
      title.dataset.role = 'group-menu';
      title.setAttribute('aria-haspopup', 'menu');
      title.setAttribute('aria-expanded', 'false');
      title.title = `All ${label} commands`;
      title.append(el('span', 'wc-ribbon-group-name', label), el('span', 'wc-ribbon-caret', '▾'));
    } else {
      title.append(el('span', 'wc-ribbon-group-name', label));
    }
    // collapsed form: the group's icon (or its first command's) + "LABEL ▾"
    const c = this._collapse;
    c.textContent = '';
    const first = this.querySelector('wc-ribbon-button:not([menu-only]), wc-ribbon-split');
    const pic = this.getAttribute('icon')
      ? pictureFor(this, '1.15rem')
      : (first ? pictureFor(first, '1.15rem') : pictureFor(this, '1.15rem'));
    const lbl = el('span', 'wc-ribbon-btn-label');
    lbl.append(el('span', 'wc-ribbon-group-name', label), el('span', 'wc-ribbon-caret', '▾'));
    c.append(pic, lbl);
    c.title = `${label} — all commands`;
  }

  get commandHosts() {
    return Array.from(this.querySelectorAll(COMMAND_TAGS)).filter(h => !h.hidden);
  }

  get widgets() {
    return Array.from(this._items ? this._items.querySelectorAll(':scope > .wc-ribbon-widget') : []);
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue, oldValue); return; }
    if (attrName === 'id') return;
    if (attrName === 'hidden') { this.closest('wc-ribbon')?.relayout?.(); return; }
    if (this._title) this._renderTitle();
    this.closest('wc-ribbon')?.relayout?.();
  }

  _wireEvents() {
    super._wireEvents();
    if (!this._observer) this._observer = new MutationObserver(() => { if (this._items) this._adopt(); });
    this._observer.observe(this, { childList: true });
  }

  _unWireEvents() {
    super._unWireEvents();
    this._observer?.disconnect();
  }

  async connectedCallback() {
    super.connectedCallback();
    this._wireEvents();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }
}

// ---------------------------------------------------------------------------------------------
// wc-ribbon-tab
// ---------------------------------------------------------------------------------------------

class WcRibbonTab extends WcBaseComponent {
  static get is() { return 'wc-ribbon-tab'; }

  static get observedAttributes() {
    return ['id', 'class', 'key', 'label', 'contextual', 'accent', 'hidden', 'keytip'];
  }

  get key() { return tabKey(this); }
  get label() { return tabLabel(this); }

  getDesignerHTML() { return null; }

  _render() {
    super._render();
    const p = ensureInner(this, 'div', 'wc-ribbon-panel');
    p.setAttribute('role', 'tabpanel');
    this._adopt();
    this._syncAccent();
    this.closest('wc-ribbon')?._syncTabButton?.(this);
  }

  _adopt() {
    if (!this.componentElement) return;
    Array.from(this.childNodes).forEach(node => {
      if (node === this.componentElement) return;
      if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) { node.remove(); return; }
      this.componentElement.appendChild(node);
    });
  }

  _syncAccent() {
    if (!this.componentElement) return;
    const accent = this.getAttribute('accent');
    const value = ACCENT_VAR[accent] || (this.hasAttribute('contextual') ? ACCENT_VAR.success : '');
    if (value) this.componentElement.style.setProperty('--wc-ribbon-tab-accent', value);
    else this.componentElement.style.removeProperty('--wc-ribbon-tab-accent');
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue, oldValue); return; }
    if (attrName === 'id') return;
    if (attrName === 'accent' || attrName === 'contextual') this._syncAccent();
    this.closest('wc-ribbon')?._syncTabButton?.(this);
  }

  async connectedCallback() {
    super.connectedCallback();
    if (!this._observer) this._observer = new MutationObserver(() => this._adopt());
    this._observer.observe(this, { childList: true });
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._observer?.disconnect();
  }
}

// ---------------------------------------------------------------------------------------------
// wc-ribbon
// ---------------------------------------------------------------------------------------------

class WcRibbon extends WcBaseComponent {
  static get is() { return 'wc-ribbon'; }

  static get observedAttributes() {
    return ['id', 'class', 'active', 'compact', 'keytips'];
  }

  constructor() {
    super();
    this._uid = `wcrb${++uidSeq}`;
    this._active = '';
    this._menu = null;          // { panel, opener, kind, restore: [] }
    this._commands = {};        // model command defs (run callbacks)
    this._layoutFrame = 0;
    this._keytipMode = null;

    this._onClick = this._handleClick.bind(this);
    this._onTabKeydown = this._handleTabKeydown.bind(this);
    this._onMenuKeydown = this._handleMenuKeydown.bind(this);
    this._onMenuClick = this._handleMenuClick.bind(this);
    this._onDocPointer = this._handleDocPointer.bind(this);
    this._onReposition = () => this._positionMenu();
    this._onActivateCmd = (e) => this._hubCommand(e, 'activate');
    this._onShowCmd = (e) => this._hubCommand(e, 'show');
    this._onHideCmd = (e) => this._hubCommand(e, 'hide');
    this._onKeyDown = this._handleKeytipKeydown.bind(this);
    this._onKeyUp = this._handleKeytipKeyup.bind(this);
  }

  async connectedCallback() {
    super.connectedCallback();
    this._applyStyle();
    this._wireEvents();
    this.relayout();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.closeMenus(true);
    this._exitKeytips();
    this._unWireEvents();
  }

  getDesignerHTML() { return null; }

  // ---- Public API -----------------------------------------------------------------------------

  get tabs() {
    return this._body ? Array.from(this._body.querySelectorAll(':scope > wc-ribbon-tab')) : [];
  }

  get active() { return this._active; }

  tab(key) {
    return this.tabs.find(t => tabKey(t) === key) || null;
  }

  setTab(key, source = 'api') {
    const tab = this.tab(key);
    if (!tab || tab.hidden) return false;
    const previous = this._active;
    this._active = key;
    if (this.getAttribute('active') !== key) {
      this._settingActive = true;
      this.setAttribute('active', key);
      this._settingActive = false;
    }
    this.closeMenus(true);
    this._syncPanels();
    this.relayout();
    if (previous !== key && source !== 'init') this._emit('wcribbontabchange', 'ribbon-tab-change', { tab: key, previous, source });
    return true;
  }

  showTab(key, activate = false) {
    const tab = this.tab(key);
    if (!tab) return;
    if (tab.hidden) tab.hidden = false;   // only this tab's strip button changes (via _syncTabButton)
    if (activate) this.setTab(key);
  }

  hideTab(key) {
    const tab = this.tab(key);
    if (!tab) return;
    if (!tab.hidden) tab.hidden = true;   // only this tab's strip button changes
    this._ensureActiveVisible();
  }

  // The active tab was hidden: fall back to the previous tab, else the first visible one.
  _ensureActiveVisible() {
    const active = this.tab(this._active);
    if (active && !active.hidden) return;
    const prev = this._previousTab && this.tab(this._previousTab);
    const fallback = prev && !prev.hidden ? this._previousTab : tabKey(this.tabs.find(t => !t.hidden) || document.createElement('i'));
    if (fallback) this.setTab(fallback, 'hide');
  }

  setActive(command, on = true) {
    this._commandHosts(command).forEach(h => {
      if (on && h.getAttribute('toggle-group')) {
        const group = h.getAttribute('toggle-group');
        this.querySelectorAll(`[toggle-group="${CSS.escape(group)}"][active]`).forEach(o => { if (o !== h) o.active = false; });
      }
      h.active = on;
    });
  }

  setDisabled(command, on = true) {
    this._commandHosts(command).forEach(h => { h.disabled = on; });
  }

  closeMenus(silent = false) {
    this._closeMenu(silent ? 'silent' : 'api');
  }

  relayout() {
    if (!this.isConnected || this._layoutFrame) return;
    this._layoutFrame = requestAnimationFrame(() => {
      this._layoutFrame = 0;
      this._layout();
    });
  }

  /**
   * Define the ribbon as data:
   *  { tabs: [{ key, label, contextual, accent, hidden, groups: [{ label, menu, icon,
   *            main: [id | '@widget' | { split: id, items: [id…] } | { html|element, caption }],
   *            more: [id…] }] }],
   *    commands: { id: { icon | glyph, label, tip, variant, primary, finish, toggle, tool,
   *                      toggleGroup, active, disabled, keytip, run(detail) } },
   *    widgets: { name: html | Node | () => html|Node | { html|element, caption } } }
   */
  setModel(model = {}) {
    this.closeMenus(true);
    this._commands = model.commands || {};
    const widgets = model.widgets || {};
    this.tabs.forEach(t => t.remove());
    const cmdEl = (tag, id) => {
      const c = this._commands[id] || {};
      const e = document.createElement(tag);
      e.setAttribute('command', id);
      const attrs = {
        icon: c.icon, glyph: c.glyph, label: c.label || id, tip: c.tip, keytip: c.keytip,
        variant: c.variant || (c.primary ? 'primary' : c.finish ? 'success' : null),
        'toggle-group': c.toggleGroup || (c.tool ? 'tool' : null),
      };
      Object.entries(attrs).forEach(([k, v]) => { if (v != null && v !== '') e.setAttribute(k, v); });
      if (c.toggle || c.tool || c.toggleGroup) e.setAttribute('toggle', '');
      if (c.active) e.setAttribute('active', '');
      if (c.disabled) e.setAttribute('disabled', '');
      return e;
    };
    const widgetEl = (spec) => {
      let w = spec;
      if (typeof w === 'function') w = w();
      let caption = null;
      if (w && !(w instanceof Node) && typeof w === 'object') { caption = w.caption; w = w.element || w.html; }
      let node = w;
      if (typeof w === 'string') {
        const t = document.createElement('template');
        t.innerHTML = w.trim();
        node = t.content.firstElementChild;
      }
      if (node && caption && !node.hasAttribute('caption')) node.setAttribute('caption', caption);
      return node;
    };
    (model.tabs || []).forEach(t => {
      const tab = document.createElement('wc-ribbon-tab');
      tab.setAttribute('key', t.key);
      tab.setAttribute('label', t.label || t.key);
      if (t.contextual) tab.setAttribute('contextual', '');
      if (t.accent) tab.setAttribute('accent', t.accent);
      if (t.keytip) tab.setAttribute('keytip', t.keytip);
      if (t.hidden != null ? t.hidden : t.contextual) tab.hidden = true;   // contextual tabs start hidden
      (t.groups || []).forEach(g => {
        const group = document.createElement('wc-ribbon-group');
        group.setAttribute('label', g.label || g.name || '');
        if (g.icon) group.setAttribute('icon', g.icon);
        if (g.menu || (g.menu !== false && g.more && g.more.length)) group.setAttribute('menu', '');
        (g.main || []).forEach(entry => {
          if (typeof entry === 'string' && entry[0] === '@') {
            const w = widgetEl(widgets[entry.slice(1)]);
            if (w) group.appendChild(w);
          } else if (typeof entry === 'string') {
            group.appendChild(cmdEl('wc-ribbon-button', entry));
          } else if (entry && entry.split) {
            const split = cmdEl('wc-ribbon-split', entry.split);
            (entry.items || []).forEach(id => split.appendChild(cmdEl('wc-ribbon-item', id)));
            group.appendChild(split);
          } else if (entry) {
            const w = widgetEl(entry);
            if (w) group.appendChild(w);
          }
        });
        (g.more || []).forEach(id => group.appendChild(cmdEl('wc-ribbon-item', id)));
        tab.appendChild(group);
      });
      this._body.appendChild(tab);
    });
    this._syncStrip();
    const wanted = model.active || this.getAttribute('active');
    const first = this.tabs.find(t => !t.hidden);
    this._active = '';
    if (!this.setTab(wanted) && first) this.setTab(tabKey(first));
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  // ---- Rendering ------------------------------------------------------------------------------

  _render() {
    super._render();
    const root = ensureInner(this, 'div', 'wc-ribbon');
    this._strip = root.querySelector(':scope > .wc-ribbon-tabs');
    this._body = root.querySelector(':scope > .wc-ribbon-body');
    this._layer = root.querySelector(':scope > .wc-ribbon-layer');
    if (!this._strip) {
      this._strip = el('div', 'wc-ribbon-tabs');
      this._strip.setAttribute('role', 'tablist');
      this._body = el('div', 'wc-ribbon-body');
      this._more = el('button', 'wc-ribbon-btn wc-ribbon-more');
      this._more.type = 'button';
      this._more.dataset.role = 'overflow';
      this._more.hidden = true;
      this._more.setAttribute('aria-haspopup', 'menu');
      this._more.setAttribute('aria-expanded', 'false');
      this._more.setAttribute('aria-label', 'More commands');
      this._more.title = 'More commands';
      this._more.append(el('span', 'wc-ribbon-glyph', '⋯'), el('span', 'wc-ribbon-btn-label', 'More'));
      this._layer = el('div', 'wc-ribbon-layer');
      root.append(this._strip, this._body, this._more, this._layer);
    } else {
      this._more = root.querySelector(':scope > .wc-ribbon-more');
    }
    root.classList.toggle('is-compact', this.hasAttribute('compact'));
    this._adoptTabs();
    this._syncStrip();
    const wanted = this.getAttribute('active');
    const fallback = this.tabs.find(t => !t.hidden);
    if (!this.setTab(wanted, 'init') && fallback) this.setTab(tabKey(fallback), 'init');
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  _adoptTabs() {
    Array.from(this.childNodes).forEach(node => {
      if (node === this.componentElement) return;
      if (node.nodeType === Node.ELEMENT_NODE && node.tagName === 'WC-RIBBON-TAB') this._body.appendChild(node);
      else if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) node.remove();
    });
  }

  _syncStrip() {
    const tabs = this.tabs;
    const existing = new Map(Array.from(this._strip.children).map(b => [b.dataset.key, b]));
    tabs.forEach(t => {
      const key = tabKey(t);
      let b = existing.get(key);
      if (!b) {
        b = el('button', 'wc-ribbon-tab-btn');
        b.type = 'button';
        b.setAttribute('role', 'tab');
        b.dataset.key = key;
      }
      existing.delete(key);
      this._strip.appendChild(b); // keeps strip order = tab order
      this._syncTabButton(t, b);
    });
    existing.forEach(b => b.remove());
    this._syncPanels();
  }

  _syncTabButton(tab, button) {
    if (!this._strip) return;
    const key = tabKey(tab);
    const b = button || this._strip.querySelector(`[data-key="${CSS.escape(key)}"]`);
    if (!b) { this._syncStrip(); return; }
    const panelId = `${this._uid}-panel-${key}`;
    const tabId = `${this._uid}-tab-${key}`;
    b.id = tabId;
    b.textContent = tabLabel(tab);
    b.hidden = tab.hidden;
    b.setAttribute('aria-controls', panelId);
    b.classList.toggle('is-contextual', tab.hasAttribute('contextual'));
    const accent = tab.getAttribute('accent');
    const value = ACCENT_VAR[accent] || (tab.hasAttribute('contextual') ? ACCENT_VAR.success : '');
    if (value) b.style.setProperty('--wc-ribbon-tab-accent', value); else b.style.removeProperty('--wc-ribbon-tab-accent');
    if (tab.componentElement) {
      tab.componentElement.id = panelId;
      tab.componentElement.setAttribute('aria-labelledby', tabId);
    }
    if (!button) {
      if (tab.hidden && this._active === key) this._ensureActiveVisible();
      this._syncPanels();
    }
  }

  _syncPanels() {
    if (!this._strip) return;
    this.tabs.forEach(t => {
      const key = tabKey(t);
      const on = key === this._active && !t.hidden;
      if (t.componentElement) t.componentElement.hidden = !on;
      const b = this._strip.querySelector(`[data-key="${CSS.escape(key)}"]`);
      if (b) {
        b.setAttribute('aria-selected', String(on));
        b.tabIndex = on ? 0 : -1;
        b.classList.toggle('is-on', on);
      }
    });
    if (this._active && this._active !== this._lastActive) {
      if (this._lastActive) this._previousTab = this._lastActive;
      this._lastActive = this._active;
    }
  }

  _commandHosts(command) {
    return Array.from(this.querySelectorAll(`[command="${CSS.escape(command)}"]`))
      .filter(h => h.matches(COMMAND_TAGS));
  }

  // ---- Collapse at narrow widths ----------------------------------------------------------------

  _activePanel() {
    return this.tab(this._active)?.componentElement || null;
  }

  _layout() {
    const panel = this._activePanel();
    if (!panel || !this._body) return;
    const groups = Array.from(panel.querySelectorAll(':scope > wc-ribbon-group')).filter(g => !g.hidden && g.componentElement);
    groups.forEach(g => g.componentElement.classList.remove('is-collapsed', 'is-overflowed'));
    this._more.hidden = true;
    this._overflowed = [];
    const fits = () => this._body.scrollWidth <= this._body.clientWidth + 1;
    if (fits()) return;
    // 1) collapse groups right-to-left into a single "GROUP ▾" button
    for (let i = groups.length - 1; i >= 0 && !fits(); i--) groups[i].componentElement.classList.add('is-collapsed');
    if (fits()) return;
    // 2) then move collapsed groups into the ⋯ overflow menu, right-to-left
    this._more.hidden = false;
    for (let i = groups.length - 1; i >= 0 && !fits(); i--) {
      groups[i].componentElement.classList.add('is-overflowed');
      this._overflowed.unshift(groups[i]);
    }
  }

  // ---- Menus ------------------------------------------------------------------------------------

  _menuItem(host, { indent = false } = {}) {
    const b = el('button', 'wc-ribbon-menu-item');
    b.type = 'button';
    b.tabIndex = -1;
    b.dataset.command = host.command;
    b._host = host;
    const toggle = host.hasAttribute('toggle');
    b.setAttribute('role', toggle ? 'menuitemcheckbox' : 'menuitem');
    if (indent) b.classList.add('is-variant');
    const pic = el('span', 'wc-ribbon-menu-pic');
    pic.appendChild(pictureFor(host, '0.95rem'));
    const text = el('span', 'wc-ribbon-menu-text');
    text.append(el('span', 'wc-ribbon-menu-label', host.label));
    const tip = host.getAttribute('tip');
    if (tip) text.append(el('span', 'wc-ribbon-menu-desc', tip));
    b.append(pic, text);
    if (toggle) b.append(el('span', 'wc-ribbon-menu-check', '✓'));
    b.title = titleFor(host);
    this._syncMenuItem(host, b);
    return b;
  }

  // Update an open menu's item for a command host in place (setActive / setDisabled while open).
  _syncMenuItem(host, item) {
    const items = item ? [item] : (this._menu ? Array.from(this._menu.panel.querySelectorAll('.wc-ribbon-menu-item')).filter(i => i._host === host) : []);
    items.forEach(i => {
      i.setAttribute('aria-disabled', String(host.disabled));
      i.classList.toggle('is-disabled', host.disabled);
      if (host.hasAttribute('toggle')) i.setAttribute('aria-checked', String(host.active));
      const variant = host.getAttribute('variant');
      if (ACCENTS.includes(variant)) i.dataset.variant = variant; else delete i.dataset.variant;
    });
  }

  _groupEntries(group, withWidgets) {
    const entries = [];
    group.commandHosts.forEach(h => {
      if (h.tagName === 'WC-RIBBON-ITEM' && h.parentElement?.tagName === 'WC-RIBBON-SPLIT') return; // listed under its split
      entries.push({ host: h });
      if (h.tagName === 'WC-RIBBON-SPLIT') h.variants.forEach(v => { if (!v.hidden) entries.push({ host: v, indent: true }); });
    });
    if (withWidgets && group.widgets.length) entries.push({ widgets: group.widgets });
    return entries;
  }

  _openMenu(opener, kind, source, viaKeyboard = false) {
    if (this._menu && this._menu.opener === opener) { this._closeMenu('toggle'); return; }
    this._closeMenu('replace');
    const panel = el('div', 'wc-ribbon-menu');
    panel.setAttribute('role', 'menu');
    panel.tabIndex = -1;
    panel.id = `${this._uid}-menu`;
    const restore = [];
    const addEntries = (entries) => entries.forEach(e => {
      if (e.header) {
        const h = el('div', 'wc-ribbon-menu-header', e.header);
        h.setAttribute('role', 'presentation');
        panel.appendChild(h);
      } else if (e.widgets) {
        // a collapsed group's widgets move into its menu while it is open, then move back
        const box = el('div', 'wc-ribbon-menu-widgets');
        box.setAttribute('role', 'presentation');
        e.widgets.forEach(w => { restore.push([w, w.parentNode, w.nextSibling]); box.appendChild(w); });
        panel.appendChild(box);
      } else {
        panel.appendChild(this._menuItem(e.host, { indent: e.indent }));
      }
    });
    let label = '';
    if (kind === 'group') {
      const group = source;
      label = group.label;
      addEntries(this._groupEntries(group, group.componentElement.classList.contains('is-collapsed')));
    } else if (kind === 'split') {
      label = source.label;
      addEntries([{ host: source }, ...source.variants.filter(v => !v.hidden).map(v => ({ host: v }))]);
    } else if (kind === 'overflow') {
      label = 'More commands';
      this._overflowed.forEach(g => addEntries([{ header: g.label }, ...this._groupEntries(g, true)]));
    }
    panel.setAttribute('aria-label', label);
    if (!panel.children.length) {
      const empty = el('div', 'wc-ribbon-menu-empty', 'No commands');
      panel.appendChild(empty);
    }
    panel.addEventListener('keydown', this._onMenuKeydown);
    panel.addEventListener('click', this._onMenuClick);
    this._layer.appendChild(panel);
    this._menu = { panel, opener, kind, restore };
    opener.setAttribute('aria-expanded', 'true');
    opener.setAttribute('aria-controls', panel.id);
    if (typeof panel.showPopover === 'function') {
      panel.setAttribute('popover', 'manual');
      try { panel.showPopover(); } catch (err) { /* already open */ }
    }
    this._positionMenu();
    window.addEventListener('resize', this._onReposition);
    window.addEventListener('scroll', this._onReposition, true);
    document.addEventListener('pointerdown', this._onDocPointer, true);
    // keyboard: focus the first command; mouse: focus the menu itself (arrows still work)
    const first = this._menuItems().find(i => !i.classList.contains('is-disabled')) || this._menuItems()[0];
    if (viaKeyboard && first) first.focus({ preventScroll: true });
    else panel.focus({ preventScroll: true });
  }

  _menuItems() {
    return this._menu ? Array.from(this._menu.panel.querySelectorAll('.wc-ribbon-menu-item')) : [];
  }

  // Under its own button, left-aligned; flips left/up near the right/bottom edge; capped height.
  _positionMenu() {
    if (!this._menu) return;
    const { panel, opener } = this._menu;
    if (!opener.isConnected || !opener.getClientRects().length) { this._closeMenu('detached'); return; }
    const r = opener.getBoundingClientRect();
    const m = 8;
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    panel.style.maxHeight = '';
    const below = vh - r.bottom - 4 - m;
    const above = r.top - 4 - m;
    const natural = Math.min(panel.scrollHeight + 2, vh * 0.7);
    const up = natural > below && above > below;
    const h = Math.min(natural, up ? above : below);
    panel.style.maxHeight = `${Math.max(120, h)}px`;
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    let left = r.left;
    if (left + pw > vw - m) left = r.right - pw;          // flip left
    left = Math.max(m, Math.min(left, vw - pw - m));
    let top = up ? r.top - 4 - ph : r.bottom + 4;
    top = Math.max(m, Math.min(top, vh - ph - m));
    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }

  _closeMenu(reason) {
    if (!this._menu) return;
    const { panel, opener, restore } = this._menu;
    this._menu = null;
    window.removeEventListener('resize', this._onReposition);
    window.removeEventListener('scroll', this._onReposition, true);
    document.removeEventListener('pointerdown', this._onDocPointer, true);
    panel.removeEventListener('keydown', this._onMenuKeydown);
    panel.removeEventListener('click', this._onMenuClick);
    restore.forEach(([node, parent, next]) => { if (parent) parent.insertBefore(node, next && next.parentNode === parent ? next : null); });
    if (panel.matches(':popover-open')) { try { panel.hidePopover(); } catch (err) { /* */ } }
    panel.remove();
    opener.setAttribute('aria-expanded', 'false');
    opener.removeAttribute('aria-controls');
    if ((reason === 'escape' || reason === 'pick') && opener.isConnected) opener.focus({ preventScroll: true });
  }

  _handleMenuClick(e) {
    const item = e.target.closest('.wc-ribbon-menu-item');
    if (!item) return;
    if (item.classList.contains('is-disabled')) return;
    this._invoke(item._host, 'menu');
  }

  _handleMenuKeydown(e) {
    const items = this._menuItems();
    const i = items.indexOf(document.activeElement);
    const go = (n) => { e.preventDefault(); items[(n + items.length) % items.length]?.focus(); };
    switch (e.key) {
      case 'ArrowDown': go(i + 1); break;
      case 'ArrowUp': go(i < 0 ? items.length - 1 : i - 1); break;
      case 'Home': go(0); break;
      case 'End': go(items.length - 1); break;
      case 'Escape': e.preventDefault(); e.stopPropagation(); this._closeMenu('escape'); break;
      case 'Tab': this._closeMenu('tab'); break;
      case 'Enter':
      case ' ':
        if (i >= 0) { e.preventDefault(); if (!items[i].classList.contains('is-disabled')) this._invoke(items[i]._host, 'menu'); }
        break;
      default:
        // type-ahead: jump to the next item starting with the letter
        if (e.key.length === 1 && /\S/.test(e.key) && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const k = e.key.toLowerCase();
          const order = [...items.slice(i + 1), ...items.slice(0, i + 1)];
          const hit = order.find(it => (it._host.label || '').toLowerCase().startsWith(k));
          if (hit) { e.preventDefault(); hit.focus(); }
        }
    }
  }

  _handleDocPointer(e) {
    if (!this._menu) return;
    if (this._menu.panel.contains(e.target) || this._menu.opener.contains(e.target)) return;
    this._closeMenu('outside');
  }

  // ---- Commands ---------------------------------------------------------------------------------

  _invoke(host, source) {
    if (!host || host.disabled) return;
    const fromMenu = source === 'menu';
    if (fromMenu) this._closeMenu('pick');
    if (host.hasAttribute('toggle')) {
      const group = host.getAttribute('toggle-group');
      if (group) this.setActive(host.command, true);   // radio: this one on, the rest off
      else host.active = !host.active;
    }
    const tab = host.closest('wc-ribbon-tab');
    const group = host.closest('wc-ribbon-group');
    const detail = { command: host.command, tab: tab ? tab.key : '', group: group ? group.label : '', source };
    if (host.hasAttribute('toggle')) detail.active = host.active;
    const def = this._commands[host.command];
    this._emit('wcribboncommand', 'ribbon-command', detail, host);
    if (def && typeof def.run === 'function') {
      try { def.run(detail); } catch (err) { console.error('[wc-ribbon] command failed', host.command, err); }
    }
  }

  _emit(name, alias, detail, from = this) {
    const opts = { bubbles: true, composed: true, detail };
    from.dispatchEvent(new CustomEvent(name, opts));
    from.dispatchEvent(new CustomEvent(alias, opts));
    window.wc?.EventHub?.broadcast(name, `[data-wc-id="${this.wcId}"]`, '', detail);
  }

  _handleClick(e) {
    const t = e.target.closest('button');
    if (!t || !this.componentElement.contains(t) || this._menu?.panel.contains(t)) return;
    if (t.classList.contains('wc-ribbon-tab-btn')) { this.setTab(t.dataset.key, 'click'); return; }
    switch (t.dataset.role) {
      case 'command':
        this._invoke(t.closest('wc-ribbon-button, wc-ribbon-split'), 'button');
        break;
      case 'group-menu':
        this._openMenu(t, 'group', t.closest('wc-ribbon-group'), e.detail === 0);
        break;
      case 'split-menu':
        this._openMenu(t, 'split', t.closest('wc-ribbon-split'), e.detail === 0);
        break;
      case 'overflow':
        this._openMenu(t, 'overflow', null, e.detail === 0);
        break;
      default:
    }
  }

  _handleTabKeydown(e) {
    const t = e.target.closest('.wc-ribbon-tab-btn');
    if (!t) return;
    const visible = Array.from(this._strip.children).filter(b => !b.hidden);
    const i = visible.indexOf(t);
    let next = null;
    if (e.key === 'ArrowRight') next = visible[(i + 1) % visible.length];
    else if (e.key === 'ArrowLeft') next = visible[(i - 1 + visible.length) % visible.length];
    else if (e.key === 'Home') next = visible[0];
    else if (e.key === 'End') next = visible[visible.length - 1];
    if (!next) return;
    e.preventDefault();
    this.setTab(next.dataset.key, 'key');
    next.focus();
  }

  _hubCommand(e, mode) {
    const selector = e.detail?.selector;
    if (!selector) return;
    let targeted = false;
    try {
      targeted = selector === this || (typeof selector === 'string' || Array.isArray(selector))
        && this.matches(Array.isArray(selector) ? selector.join(',') : selector);
    } catch (err) { targeted = false; }
    if (!targeted) return;
    const key = e.detail.subSelector || e.detail.custom?.key || e.detail.custom;
    if (typeof key !== 'string') return;
    if (mode === 'activate') this.setTab(key, 'eventhub');
    else if (mode === 'show') this.showTab(key, !!e.detail.custom?.activate);
    else this.hideTab(key);
  }

  // ---- Key tips (Alt) -----------------------------------------------------------------------------

  _handleKeytipKeydown(e) {
    if (this._keytipMode) {
      if (e.key === 'Escape') { e.preventDefault(); this._exitKeytips(); return; }
      if (e.key === 'Alt') { e.preventDefault(); this._exitKeytips(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const k = e.key.toUpperCase();
        const hit = this._keytipMode.map.get(k);
        if (!hit) return;
        if (this._keytipMode.level === 'tabs') {
          this.setTab(hit.dataset.key, 'keytip');
          this._showKeytips('commands');
        } else {
          this._exitKeytips();
          hit.focus();
          hit.click();
        }
      }
      return;
    }
    this._altAlone = e.key === 'Alt' && !e.ctrlKey && !e.metaKey && !e.shiftKey;
  }

  _handleKeytipKeyup(e) {
    if (e.key === 'Alt' && this._altAlone && !this._keytipMode) {
      e.preventDefault();
      this._showKeytips('tabs');
    }
    this._altAlone = false;
  }

  _showKeytips(level) {
    this._clearKeytipBadges();
    const map = new Map();
    const used = new Set();
    const pick = (node, label, explicit) => {
      let k = (explicit || '').toUpperCase();
      if (!k || used.has(k)) k = Array.from((label || '').toUpperCase()).find(ch => /[A-Z0-9]/.test(ch) && !used.has(ch)) || '';
      if (!k) k = '123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').find(ch => !used.has(ch)) || '';
      if (!k) return;
      used.add(k);
      map.set(k, node);
      const badge = el('span', 'wc-ribbon-keytip', k);
      badge.setAttribute('aria-hidden', 'true');
      node.appendChild(badge);
    };
    if (level === 'tabs') {
      Array.from(this._strip.children).filter(b => !b.hidden).forEach(b => pick(b, b.textContent, this.tab(b.dataset.key)?.getAttribute('keytip')));
    } else {
      const panel = this._activePanel();
      const targets = Array.from(panel.querySelectorAll('.wc-ribbon-btn, .wc-ribbon-split-arrow, button.wc-ribbon-group-label'))
        .filter(b => b.getClientRects().length && !b.disabled);
      targets.forEach(b => {
        const host = b.closest(COMMAND_TAGS);
        const label = host ? host.label : b.textContent;
        pick(b, label, host?.getAttribute('keytip'));
      });
    }
    this._keytipMode = { level, map };
    this.componentElement.classList.add('is-keytips');
  }

  _clearKeytipBadges() {
    this.componentElement.querySelectorAll('.wc-ribbon-keytip').forEach(b => b.remove());
  }

  _exitKeytips() {
    if (!this._keytipMode || !this.componentElement) return;
    this._keytipMode = null;
    this._clearKeytipBadges();
    this.componentElement.classList.remove('is-keytips');
  }

  // ---- Attributes / wiring ------------------------------------------------------------------------

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue, oldValue); return; }
    if (attrName === 'id') return;
    if (attrName === 'active') {
      if (!this._settingActive && newValue) this.setTab(newValue, 'attribute');
    } else if (attrName === 'compact') {
      this.componentElement.classList.toggle('is-compact', newValue !== null);
      this.relayout();
    } else if (attrName === 'keytips') {
      this._wireKeytips();
    }
  }

  _wireKeytips() {
    document.removeEventListener('keydown', this._onKeyDown, true);
    document.removeEventListener('keyup', this._onKeyUp, true);
    if (this.hasAttribute('keytips') && this.isConnected) {
      document.addEventListener('keydown', this._onKeyDown, true);
      document.addEventListener('keyup', this._onKeyUp, true);
    } else {
      this._exitKeytips();
    }
  }

  _wireEvents() {
    super._wireEvents();
    this._unWireEvents();
    this.componentElement.addEventListener('click', this._onClick);
    this._strip.addEventListener('keydown', this._onTabKeydown);
    document.body.addEventListener('wcribbonactivate', this._onActivateCmd);
    document.body.addEventListener('wcribbontabshow', this._onShowCmd);
    document.body.addEventListener('wcribbontabhide', this._onHideCmd);
    this._resizeObserver = new ResizeObserver(() => this.relayout());
    this._resizeObserver.observe(this._body);
    // new tabs (setModel / htmx beforeend) are adopted; anything inside that changes relayouts
    this._childObserver = new MutationObserver(() => { this._adoptTabs(); this._syncStrip(); this.relayout(); });
    this._childObserver.observe(this, { childList: true });
    this._wireKeytips();
  }

  _unWireEvents() {
    super._unWireEvents();
    this.componentElement?.removeEventListener('click', this._onClick);
    this._strip?.removeEventListener('keydown', this._onTabKeydown);
    document.body.removeEventListener('wcribbonactivate', this._onActivateCmd);
    document.body.removeEventListener('wcribbontabshow', this._onShowCmd);
    document.body.removeEventListener('wcribbontabhide', this._onHideCmd);
    document.removeEventListener('keydown', this._onKeyDown, true);
    document.removeEventListener('keyup', this._onKeyUp, true);
    this._resizeObserver?.disconnect();
    this._childObserver?.disconnect();
    if (this._layoutFrame) { cancelAnimationFrame(this._layoutFrame); this._layoutFrame = 0; }
  }

  _applyStyle() {
    const style = `
      wc-ribbon, wc-ribbon-tab, wc-ribbon-group, wc-ribbon-button, wc-ribbon-split { display: contents; }

      @layer wc.usage {
        /* State classes avoid .is-active: Wave's global .is-active utility (@layer wc.selected)
           would add its left accent bar and ring. This component uses .is-on. */
        .wc-ribbon {
          --wc-ribbon-accent: var(--primary-bg-color);
          position: relative;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto auto;
          background-color: var(--wc-ribbon-bg, var(--surface-2));
          border-bottom: 1px solid var(--wc-ribbon-group-border, var(--surface-4));
          color: var(--text-1);
          font-size: 12px;
          line-height: 1.2;
          min-width: 0;
        }
        .wc-ribbon-tabs {
          grid-column: 1 / -1;
          display: flex;
          gap: 2px;
          padding: 0 0.5rem;
          border-bottom: 1px solid var(--wc-ribbon-group-border, var(--surface-4));
          overflow: hidden;
        }
        .wc-ribbon-tab-btn {
          position: relative;
          margin: 0 0 -1px;
          padding: 0.4rem 0.8rem 0.35rem;
          border: 0;
          border-bottom: 2px solid transparent;
          background: transparent;
          color: var(--text-2, var(--text-1));
          font: inherit;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.03em;
          cursor: pointer;
          white-space: nowrap;
        }
        .wc-ribbon-tab-btn:hover { color: var(--text-1); background-color: var(--wc-ribbon-button-hover, var(--surface-3)); }
        .wc-ribbon-tab-btn.is-on {
          color: var(--text-1);
          border-bottom-color: var(--wc-ribbon-tab-accent, var(--wc-ribbon-accent));
        }
        /* contextual tabs: accent label (mixed toward --text-1 so it stays AA) + accent underline */
        .wc-ribbon-tab-btn.is-contextual {
          color: color-mix(in srgb, var(--wc-ribbon-tab-accent) 55%, var(--text-1));
          background-color: color-mix(in srgb, var(--wc-ribbon-tab-accent) 10%, transparent);
          border-radius: 4px 4px 0 0;
        }
        .wc-ribbon-tab-btn.is-contextual.is-on { border-bottom-color: var(--wc-ribbon-tab-accent); }
        .wc-ribbon-tab-btn:focus-visible { outline: 2px solid var(--primary-bg-color); outline-offset: -2px; }

        .wc-ribbon-body {
          grid-column: 1;
          display: flex;
          min-width: 0;
          min-height: 80px;
          overflow: hidden;
        }
        .wc-ribbon-panel {
          display: flex;
          align-items: stretch;
          flex: 0 0 auto;
          padding: 4px 4px 0;
        }
        .wc-ribbon-panel[hidden] { display: none; }
        .wc-ribbon-panel[style*="--wc-ribbon-tab-accent"] { box-shadow: inset 0 2px 0 var(--wc-ribbon-tab-accent); }

        .wc-ribbon-group {
          display: flex;
          flex-direction: column;
          flex: 0 0 auto;
          padding: 0 4px;
          border-right: 1px solid var(--wc-ribbon-group-border, var(--surface-4));
        }
        .wc-ribbon-group-items { display: flex; align-items: flex-start; gap: 2px; flex: 1 1 auto; }
        .wc-ribbon-group-label {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          margin: 0;
          padding: 2px 6px 3px;
          border: 0;
          border-radius: 4px;
          background: transparent;
          color: var(--wc-ribbon-label-color, var(--text-2, var(--text-1)));
          font: inherit;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          white-space: nowrap;
        }
        button.wc-ribbon-group-label { cursor: pointer; }
        button.wc-ribbon-group-label:hover,
        button.wc-ribbon-group-label[aria-expanded="true"] { background-color: var(--wc-ribbon-button-hover, var(--surface-3)); color: var(--text-1); }
        .wc-ribbon-caret { font-size: 0.8em; opacity: 0.8; }

        .wc-ribbon-btn {
          position: relative;
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          min-width: 46px;
          max-width: 78px;
          margin: 0;
          padding: 6px 6px 4px;
          border: 1px solid transparent;
          border-radius: 6px;
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 11px;
          line-height: 1.15;
          text-align: center;
          cursor: pointer;
        }
        .wc-ribbon-btn:hover:not(:disabled) { background-color: var(--wc-ribbon-button-hover, var(--surface-3)); }
        .wc-ribbon-btn:focus-visible,
        .wc-ribbon-split-arrow:focus-visible,
        .wc-ribbon-group-label:focus-visible { outline: 2px solid var(--primary-bg-color); outline-offset: -1px; }
        .wc-ribbon-btn:disabled { opacity: 0.45; cursor: default; }
        .wc-ribbon-btn.is-on,
        .wc-ribbon-split.is-on .wc-ribbon-split-main {
          background-color: color-mix(in srgb, var(--wc-ribbon-accent) 18%, transparent);
          border-color: color-mix(in srgb, var(--wc-ribbon-accent) 60%, transparent);
        }
        .wc-ribbon-btn-label {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .wc-ribbon-icon, .wc-ribbon-glyph {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          flex: none;
        }
        .wc-ribbon-glyph { font-size: 1.05rem; font-weight: 600; line-height: 1; font-family: ui-sans-serif, system-ui, sans-serif; }
        [data-variant] .wc-ribbon-icon, [data-variant] .wc-ribbon-glyph,
        [data-variant] > .wc-ribbon-split-main .wc-ribbon-icon {
          color: color-mix(in srgb, var(--wc-ribbon-variant) 65%, var(--text-1));
        }
        .wc-ribbon-btn[data-variant], .wc-ribbon-split[data-variant] > .wc-ribbon-split-main {
          background-color: color-mix(in srgb, var(--wc-ribbon-variant) 12%, transparent);
        }
        [data-variant="primary"] { --wc-ribbon-variant: var(--primary-bg-color); }
        [data-variant="success"] { --wc-ribbon-variant: var(--success-color); }
        [data-variant="warning"] { --wc-ribbon-variant: var(--warning-color); }
        [data-variant="danger"] { --wc-ribbon-variant: var(--danger-color); }
        [data-variant="info"] { --wc-ribbon-variant: var(--info-color); }

        /* split button: icon on top runs the command, "Label ▾" below opens the variants */
        .wc-ribbon-split { display: inline-flex; flex-direction: column; align-items: stretch; border-radius: 6px; }
        .wc-ribbon-split .wc-ribbon-split-main { border-radius: 6px 6px 0 0; padding-bottom: 2px; width: 100%; max-width: none; }
        .wc-ribbon-split-arrow {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 2px;
          margin: 0;
          padding: 2px 6px 4px;
          border: 1px solid transparent;
          border-radius: 0 0 6px 6px;
          background: transparent;
          color: inherit;
          font: inherit;
          font-size: 11px;
          cursor: pointer;
          white-space: nowrap;
        }
        .wc-ribbon-split:hover .wc-ribbon-btn:not(:disabled),
        .wc-ribbon-split:hover .wc-ribbon-split-arrow:not(:disabled) { border-color: var(--wc-ribbon-group-border, var(--surface-4)); }
        .wc-ribbon-split-arrow:hover:not(:disabled),
        .wc-ribbon-split-arrow[aria-expanded="true"] { background-color: var(--wc-ribbon-button-hover, var(--surface-3)); }
        .wc-ribbon-split-arrow:disabled { opacity: 0.45; cursor: default; }

        /* widgets: compact controls with an optional caption, aligned with the buttons */
        .wc-ribbon-widget {
          display: inline-flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
          align-self: stretch;
          padding: 4px;
        }
        .wc-ribbon-caption { font-size: 10px; color: var(--wc-ribbon-label-color, var(--text-2, var(--text-1))); text-align: center; }

        /* collapsed group: one "GROUP ▾" button opening the group's menu */
        .wc-ribbon-collapse { display: none; }
        .wc-ribbon-group.is-collapsed > .wc-ribbon-group-items,
        .wc-ribbon-group.is-collapsed > .wc-ribbon-group-label { display: none; }
        .wc-ribbon-group.is-collapsed > .wc-ribbon-collapse { display: inline-flex; align-self: flex-start; margin-top: 2px; }
        .wc-ribbon-collapse .wc-ribbon-group-name { text-transform: uppercase; font-size: 10px; font-weight: 600; letter-spacing: 0.04em; }
        .wc-ribbon-group.is-overflowed { display: none; }
        .wc-ribbon-more {
          grid-column: 2;
          grid-row: 2;
          align-self: start;
          margin: 4px 4px 0;
        }
        .wc-ribbon-more[hidden] { display: none; }

        /* compact: a single row, small icons beside labels */
        .wc-ribbon.is-compact .wc-ribbon-body { min-height: 0; }
        .wc-ribbon.is-compact .wc-ribbon-panel { padding: 2px 4px; }
        .wc-ribbon.is-compact .wc-ribbon-group { flex-direction: row; align-items: center; gap: 2px; padding: 0 4px; }
        .wc-ribbon.is-compact .wc-ribbon-group-items { align-items: center; }
        .wc-ribbon.is-compact .wc-ribbon-btn,
        .wc-ribbon.is-compact .wc-ribbon-split { flex-direction: row; max-width: none; padding: 3px 6px; gap: 5px; white-space: nowrap; }
        .wc-ribbon.is-compact .wc-ribbon-split { padding: 0; }
        .wc-ribbon.is-compact .wc-ribbon-split .wc-ribbon-split-main { border-radius: 6px 0 0 6px; padding: 3px 4px 3px 6px; width: auto; }
        .wc-ribbon.is-compact .wc-ribbon-split-arrow { border-radius: 0 6px 6px 0; padding: 3px 6px 3px 2px; }
        .wc-ribbon.is-compact .wc-ribbon-btn-label { display: block; }
        .wc-ribbon.is-compact .wc-ribbon-icon, .wc-ribbon.is-compact .wc-ribbon-glyph { width: 1rem; height: 1rem; font-size: 0.9rem; }
        .wc-ribbon.is-compact .wc-ribbon-widget { flex-direction: row; align-items: center; padding: 2px 4px; }
        .wc-ribbon.is-compact .wc-ribbon-group-label { padding: 2px 4px; }
        .wc-ribbon.is-compact .wc-ribbon-group.is-collapsed > .wc-ribbon-collapse { margin-top: 0; align-self: center; }
        .wc-ribbon.is-compact .wc-ribbon-more { grid-row: 2; align-self: center; margin: 0 4px; flex-direction: row; }

        /* menus: top layer (popover), anchored by JS to their own button */
        .wc-ribbon-menu {
          position: fixed;
          inset: auto;
          z-index: 10000;
          margin: 0;
          min-width: var(--wc-ribbon-menu-width, 300px);
          max-width: min(480px, calc(100vw - 16px));
          max-height: 70vh;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 4px;
          background-color: var(--wc-ribbon-menu-bg, var(--surface-2));
          border: 1px solid var(--surface-4);
          border-radius: 8px;
          box-shadow: 0 10px 30px color-mix(in srgb, var(--text-1) 22%, transparent);
          color: var(--text-1);
          font-size: 13px;
          line-height: 1.25;
        }
        .wc-ribbon-menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          margin: 0;
          padding: 6px 10px;
          border: 0;
          border-radius: 6px;
          background: transparent;
          color: inherit;
          font: inherit;
          text-align: left;
          cursor: pointer;
        }
        .wc-ribbon-menu-item:hover,
        .wc-ribbon-menu-item:focus { background-color: var(--surface-3); outline: none; }
        .wc-ribbon-menu-item:focus-visible { box-shadow: inset 0 0 0 2px var(--primary-bg-color); }
        .wc-ribbon-menu-item.is-variant { padding-left: 26px; }
        .wc-ribbon-menu-item.is-disabled { opacity: 0.45; cursor: default; }
        .wc-ribbon-menu-item[aria-checked="true"] { background-color: color-mix(in srgb, var(--wc-ribbon-accent) 14%, transparent); }
        .wc-ribbon-menu-pic { display: inline-flex; justify-content: center; width: 1.25rem; flex: none; }
        .wc-ribbon-menu-pic .wc-ribbon-icon, .wc-ribbon-menu-pic .wc-ribbon-glyph { width: 1.1rem; height: 1.1rem; font-size: 0.95rem; }
        .wc-ribbon-menu-item[data-variant] .wc-ribbon-icon, .wc-ribbon-menu-item[data-variant] .wc-ribbon-glyph {
          color: color-mix(in srgb, var(--wc-ribbon-variant) 65%, var(--text-1));
        }
        .wc-ribbon-menu-text { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
        .wc-ribbon-menu-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wc-ribbon-menu-desc {
          font-size: 11px;
          color: var(--text-2, var(--text-1));
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .wc-ribbon-menu-check { flex: none; visibility: hidden; color: var(--text-1); }
        .wc-ribbon-menu-item[aria-checked="true"] .wc-ribbon-menu-check { visibility: visible; }
        .wc-ribbon-menu-header {
          padding: 8px 10px 3px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text-2, var(--text-1));
        }
        .wc-ribbon-menu-widgets {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          padding: 6px 10px;
          border-top: 1px solid var(--surface-4);
          margin-top: 4px;
        }
        .wc-ribbon-menu-empty { padding: 10px; color: var(--text-2, var(--text-1)); }

        /* key tips (Alt) */
        .wc-ribbon-keytip {
          position: absolute;
          left: 50%;
          bottom: -4px;
          transform: translateX(-50%);
          z-index: 2;
          min-width: 1.1rem;
          padding: 1px 4px;
          border: 1px solid var(--surface-5, var(--surface-4));
          border-radius: 3px;
          background-color: var(--text-1);
          color: var(--surface-1);
          font: 600 10px/1.2 ui-sans-serif, system-ui, sans-serif;
          text-align: center;
          pointer-events: none;
        }

        .theme-high-contrast .wc-ribbon-btn.is-on,
        .theme-high-contrast .wc-ribbon-menu-item[aria-checked="true"] { outline: 2px solid var(--text-1); outline-offset: -2px; }
      }

      /* Unlayered: [hidden] must beat .contents (wc.utility), and widget inputs must beat the
         wc.ui bare input/select rules (padding, font-size 1rem). */
      wc-ribbon-tab[hidden], wc-ribbon-group[hidden], wc-ribbon-button[hidden],
      wc-ribbon-split[hidden], wc-ribbon-button[menu-only], wc-ribbon-item { display: none; }
      .wc-ribbon-widget > select,
      .wc-ribbon-widget > input:not([type="range"]):not([type="checkbox"]):not([type="radio"]) {
        height: 26px;
        padding: 0 0.4rem;
        font-size: 12px;
        min-width: 7rem;
      }
      .wc-ribbon-widget > input[type="range"] { width: 7.5rem; margin: 6px 0; }
      .wc-ribbon-menu-widgets > select,
      .wc-ribbon-menu-widgets > input:not([type="range"]) { height: 26px; padding: 0 0.4rem; font-size: 12px; }
    `.trim();
    this.loadStyle('wc-ribbon-style', style);
  }
}

// Outer elements first: the ribbon adopts its tabs (and tabs their groups) before the inner
// parts upgrade, so most children are moved once, before they render.
[WcRibbon, WcRibbonTab, WcRibbonGroup, WcRibbonButton, WcRibbonItem, WcRibbonSplit].forEach(C => {
  if (!customElements.get(C.is)) customElements.define(C.is, C);
});

export { WcRibbon, WcRibbonTab, WcRibbonGroup, WcRibbonButton, WcRibbonItem, WcRibbonSplit };
