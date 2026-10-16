/**
 *  Shared body-level popover for Wave components (wc-font-picker, wc-zoom, wc-color).
 *
 *  The panel is appended to <body> and positioned `fixed` against its anchor, so it is
 *  never clipped by an overflow:hidden ribbon, inspector, or split pane. It flips above
 *  the anchor when there is no room below, keeps itself inside the viewport, mirrors the
 *  theme classes of the host's nearest themed ancestors (theme-*, dark, light, crisp —
 *  so a nested `.crisp` or theme container still applies on <body>), closes on outside
 *  pointerdown / Escape, and removes every listener it added when closed.
 *
 *    const pop = new WcPopover(hostEl, { onClose: () => …, minWidth: 320, maxHeight: 360 });
 *    pop.open(anchorEl, panelEl);   // panelEl is any element; it is appended to <body>
 *    pop.reposition();
 *    pop.close();                    // idempotent; also call from disconnectedCallback
 */

const THEME_CLASS = /^(theme-[\w-]+|dark|light|crisp)$/;

export function themeClassesFor(el) {
  // Nearest ancestor wins per kind: one theme-*, one dark|light, plus crisp if any.
  let theme = null;
  let scheme = null;
  let crisp = false;
  for (let node = el; node && node.nodeType === 1; node = node.parentElement) {
    node.classList.forEach(c => {
      if (!THEME_CLASS.test(c)) return;
      if (c.startsWith('theme-')) { if (!theme) theme = c; }
      else if (c === 'dark' || c === 'light') { if (!scheme) scheme = c; }
      else if (c === 'crisp') crisp = true;
    });
  }
  return [theme, scheme, crisp ? 'crisp' : null].filter(Boolean);
}

export class WcPopover {
  constructor(host, opts = {}) {
    this.host = host;
    this.opts = opts;
    this.anchor = null;
    this.panel = null;
    this._onReposition = () => this.reposition();
    this._onDocPointer = (e) => {
      if (!this.panel) return;
      if (this.panel.contains(e.target) || this.host.contains(e.target)) return;
      this.close('outside');
    };
    this._onKeydown = (e) => {
      if (e.key === 'Escape' && this.panel) {
        e.preventDefault();
        e.stopPropagation();
        this.close('escape');
      }
    };
  }

  get isOpen() {
    return !!this.panel;
  }

  open(anchor, panel) {
    if (this.panel) this.close('replace');
    this.anchor = anchor;
    this.panel = panel;
    panel.classList.add('wc-popover', ...themeClassesFor(this.host));
    document.body.appendChild(panel);
    this.reposition();
    window.addEventListener('resize', this._onReposition);
    window.addEventListener('scroll', this._onReposition, true);
    document.addEventListener('pointerdown', this._onDocPointer, true);
    panel.addEventListener('keydown', this._onKeydown);
  }

  reposition() {
    if (!this.panel || !this.anchor) return;
    if (!this.anchor.isConnected) { this.close('detached'); return; }
    const r = this.anchor.getBoundingClientRect();
    const margin = 8;
    const width = Math.max(r.width, this.opts.minWidth || 0);
    this.panel.style.position = 'fixed';
    this.panel.style.width = this.opts.matchWidth === false ? '' : `${width}px`;
    if (this.opts.maxHeight) this.panel.style.maxHeight = `${this.opts.maxHeight}px`;
    const pw = this.panel.offsetWidth;
    const ph = this.panel.offsetHeight;
    let left = this.opts.align === 'end' ? r.right - pw : r.left;
    left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));
    let top = r.bottom + 4;
    if (top + ph > window.innerHeight - margin && r.top - ph - 4 >= margin) {
      top = r.top - ph - 4; // flip above
    }
    this.panel.style.left = `${left}px`;
    this.panel.style.top = `${Math.max(margin, top)}px`;
  }

  close(reason = 'api') {
    if (!this.panel) return;
    window.removeEventListener('resize', this._onReposition);
    window.removeEventListener('scroll', this._onReposition, true);
    document.removeEventListener('pointerdown', this._onDocPointer, true);
    this.panel.removeEventListener('keydown', this._onKeydown);
    const panel = this.panel;
    this.panel = null;
    panel.remove();
    if (this.opts.onClose) this.opts.onClose(reason, panel);
  }
}
