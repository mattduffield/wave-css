/**
 *  Name: wc-context-menu
 *  Usage (declarative):
 *    <wc-context-menu id="my-menu">
 *      <wc-context-menu-item label="Query" icon="magnifying-glass" action="doQuery()"></wc-context-menu-item>
 *      <wc-context-menu-item divider></wc-context-menu-item>
 *      <wc-context-menu-item label="Delete" icon="trash" action="doDelete()" disabled></wc-context-menu-item>
 *    </wc-context-menu>
 *
 *  Usage (programmatic):
 *    WcContextMenu.show(x, y, [
 *      { label: 'Query', icon: 'magnifying-glass', action: () => doQuery() },
 *      { divider: true },
 *      { label: 'Delete', icon: 'trash', action: () => doDelete(), disabled: true },
 *    ]);
 *
 *  Description:
 *    Reusable context menu component. Supports declarative child items or
 *    programmatic show/hide via static methods. Only one context menu is
 *    visible at a time (singleton pattern).
 */

import { WcBaseComponent } from './wc-base-component.js';

// ── Lightweight child element ────────────────────────────────────────────────
if (!customElements.get('wc-context-menu-item')) {
  class WcContextMenuItem extends HTMLElement {
    constructor() { super(); }
  }
  customElements.define('wc-context-menu-item', WcContextMenuItem);
}

// ── Main component ───────────────────────────────────────────────────────────
if (!customElements.get('wc-context-menu')) {

  // Singleton reference
  let _singleton = null;

  class WcContextMenu extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    static get is() { return 'wc-context-menu'; }

    constructor() {
      super();
      this._items = [];
      this._onOutsideClick = null;
      this._onEscape = null;
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._removeListeners();
    }

    _render() {
      super._render();
      const compEl = this.querySelector('.wc-context-menu');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-context-menu');
        this.appendChild(this.componentElement);
      }
      // Hide by default until show() is called
      this.componentElement.style.display = 'none';
    }

    // ── Public instance methods ──────────────────────────────────────────────

    /**
     * Show this menu instance at x/y with the given items.
     * If items is omitted, reads from declarative wc-context-menu-item children.
     */
    open(x, y, items) {
      if (items) {
        this._items = items;
      } else {
        this._items = this._readDeclarativeItems();
      }
      this._buildMenu();
      this._position(x, y);
      this.componentElement.style.display = '';
      this._addListeners();
    }

    /** Hide this menu instance. */
    close() {
      this.componentElement.style.display = 'none';
      this.componentElement.innerHTML = '';
      this._removeListeners();
    }

    // ── Static singleton API ─────────────────────────────────────────────────

    /**
     * Show a context menu at x/y with the given items array.
     * Creates/reuses a singleton element on document.body.
     * @param {number} x - clientX position
     * @param {number} y - clientY position
     * @param {Array} items - menu item descriptors
     * @returns {WcContextMenu} the singleton instance
     */
    static show(x, y, items) {
      if (!_singleton) {
        _singleton = document.createElement('wc-context-menu');
        _singleton.id = '__wc-context-menu-singleton';
        document.body.appendChild(_singleton);
      }
      // Close any existing menu first
      _singleton.close();
      _singleton.open(x, y, items);
      return _singleton;
    }

    /** Hide the singleton context menu. */
    static hide() {
      if (_singleton) {
        _singleton.close();
      }
    }

    // ── Internal ─────────────────────────────────────────────────────────────

    _readDeclarativeItems() {
      const children = this.querySelectorAll(':scope > wc-context-menu-item');
      return Array.from(children).map(child => {
        if (child.hasAttribute('divider')) {
          return { divider: true };
        }
        const actionStr = child.getAttribute('action') || '';
        return {
          label: child.getAttribute('label') || '',
          icon: child.getAttribute('icon') || '',
          disabled: child.hasAttribute('disabled'),
          action: actionStr ? () => new Function(actionStr)() : null,
        };
      });
    }

    _buildMenu() {
      this.componentElement.innerHTML = '';

      this._items.forEach(item => {
        if (item.divider) {
          const div = document.createElement('div');
          div.classList.add('wc-context-menu-divider');
          this.componentElement.appendChild(div);
          return;
        }

        const el = document.createElement('div');
        el.classList.add('wc-context-menu-item');

        if (item.disabled) {
          el.classList.add('disabled');
        }

        // Icon
        if (item.icon) {
          const iconEl = document.createElement('wc-fa-icon');
          iconEl.setAttribute('name', item.icon);
          iconEl.setAttribute('size', '0.8125rem');
          el.appendChild(iconEl);
        }

        // Label
        const labelEl = document.createElement('span');
        labelEl.textContent = item.label || '';
        el.appendChild(labelEl);

        // Click handler
        if (!item.disabled && item.action) {
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            this.close();
            item.action();
          });
        }

        this.componentElement.appendChild(el);
      });
    }

    _position(x, y) {
      const el = this.componentElement;
      el.style.position = 'fixed';
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;

      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const margin = 4;
        if (rect.right > window.innerWidth - margin) {
          el.style.left = `${window.innerWidth - rect.width - margin}px`;
        }
        if (rect.bottom > window.innerHeight - margin) {
          el.style.top = `${window.innerHeight - rect.height - margin}px`;
        }
      });
    }

    _addListeners() {
      this._removeListeners();

      this._onOutsideClick = (e) => {
        if (!this.componentElement.contains(e.target)) {
          this.close();
        }
      };
      this._onEscape = (e) => {
        if (e.key === 'Escape') {
          this.close();
        }
      };

      document.addEventListener('mousedown', this._onOutsideClick, true);
      document.addEventListener('keydown', this._onEscape, true);
    }

    _removeListeners() {
      if (this._onOutsideClick) {
        document.removeEventListener('mousedown', this._onOutsideClick, true);
        this._onOutsideClick = null;
      }
      if (this._onEscape) {
        document.removeEventListener('keydown', this._onEscape, true);
        this._onEscape = null;
      }
    }

    _applyStyle() {
      const style = `
        wc-context-menu { display: contents; }

        .wc-context-menu {
          z-index: 10000;
          min-width: 180px;
          background: var(--card-bg-color, #1e1e2e);
          border: 1px solid var(--card-border-color, #444);
          border-radius: 6px;
          padding: 4px 0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
          font-size: 13px;
          position: fixed;
        }

        .wc-context-menu .wc-context-menu-item {
          padding: 6px 14px;
          cursor: pointer;
          white-space: nowrap;
          color: var(--text-color, #ccc);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wc-context-menu .wc-context-menu-item:hover {
          background: var(--primary-bg-color, #4466ff);
          color: var(--primary-text-color, #fff);
        }
        .wc-context-menu .wc-context-menu-item.disabled {
          opacity: 0.35;
          cursor: default;
          pointer-events: none;
        }

        .wc-context-menu .wc-context-menu-divider {
          height: 1px;
          margin: 4px 0;
          background: var(--card-border-color, #444);
        }
      `;
      this.loadStyle('wc-context-menu-style', style);
    }
  }

  customElements.define('wc-context-menu', WcContextMenu);
}
