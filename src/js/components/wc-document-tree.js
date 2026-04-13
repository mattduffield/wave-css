/**
 * Name: wc-document-tree
 * Usage:
 *
 *   <wc-document-tree
 *     data='[{"_id":"abc123","name":"Matt","address":{"city":"Portland"}}]'
 *     height="100%"
 *     expand-level="2">
 *   </wc-document-tree>
 *
 * Renders MongoDB documents as an expandable/collapsible tree viewer.
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-document-tree')) {

  class WcDocumentTree extends WcBaseComponent {
    static get is() { return 'wc-document-tree'; }

    static get observedAttributes() {
      return ['id', 'class', 'data', 'height', 'expand-level'];
    }

    constructor() {
      super();
      this._data = null;
      this._expandLevel = 1;

      const compEl = this.querySelector('.wc-document-tree');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-document-tree');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._expandLevel = parseInt(this.getAttribute('expand-level')) || 1;
      this._parseData();
      this._buildUI();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
    }

    _render() {
      super._render();
    }

    set data(val) {
      if (typeof val === 'string') {
        try { val = JSON.parse(val); } catch (e) { val = null; }
      }
      this._data = val;
      this._buildUI();
    }

    get data() {
      return this._data;
    }

    async _handleAttributeChange(attrName, newValue) {
      if (attrName === 'data') {
        this._parseData();
        this._buildUI();
      } else if (attrName === 'expand-level') {
        this._expandLevel = parseInt(newValue) || 1;
        this._buildUI();
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _parseData() {
      const raw = this.getAttribute('data');
      if (!raw) { this._data = null; return; }
      try {
        this._data = JSON.parse(raw);
      } catch (e) {
        this._data = null;
      }
    }

    // ── Type detection ────────────────────────────────────────────────────────

    _getType(val) {
      if (val === null || val === undefined) return 'null';
      if (Array.isArray(val)) return 'array';
      if (typeof val === 'boolean') return 'boolean';
      if (typeof val === 'number') return 'number';
      if (typeof val === 'string') {
        if (/^[a-f0-9]{24}$/i.test(val)) return 'objectid';
        if (/^\d{4}-\d{2}-\d{2}T/.test(val)) return 'date';
        return 'string';
      }
      if (typeof val === 'object') {
        if (val.$oid) return 'objectid';
        if (val.$date) return 'date';
        return 'object';
      }
      return 'string';
    }

    _formatValue(val, type) {
      switch (type) {
        case 'null': return 'null';
        case 'boolean': return String(val);
        case 'number': return String(val);
        case 'string': {
          const display = val.length > 100 ? val.substring(0, 97) + '...' : val;
          return `"${display}"`;
        }
        case 'objectid': {
          const id = typeof val === 'object' && val.$oid ? val.$oid : val;
          return `ObjectId("${id.substring(0, 8)}...")`;
        }
        case 'date': {
          const dateStr = typeof val === 'object' && val.$date ? val.$date : val;
          try {
            const d = new Date(dateStr);
            return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
              + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
          } catch (e) { return String(dateStr); }
        }
        case 'object': return `{${Object.keys(val).length} fields}`;
        case 'array': return `[${val.length} items]`;
        default: return String(val);
      }
    }

    _getFullValue(val, type) {
      if (type === 'string') return val;
      if (type === 'objectid') return typeof val === 'object' && val.$oid ? val.$oid : val;
      if (type === 'date') return typeof val === 'object' && val.$date ? val.$date : val;
      if (type === 'object' || type === 'array') return JSON.stringify(val);
      return String(val);
    }

    _getTypeBadge(type) {
      const labels = {
        'string': 'String', 'number': 'Number', 'boolean': 'Bool',
        'null': 'Null', 'objectid': 'ObjectId', 'date': 'Date',
        'object': 'Object', 'array': 'Array'
      };
      return labels[type] || type;
    }

    // ── UI building ───────────────────────────────────────────────────────────

    _buildUI() {
      this.componentElement.innerHTML = '';

      const height = this.getAttribute('height');
      if (height) this.componentElement.style.height = height;

      if (!this._data) {
        this.componentElement.innerHTML = '<div class="doctree-empty">No data. Set the <code>data</code> attribute or property.</div>';
        return;
      }

      const docs = Array.isArray(this._data) ? this._data : [this._data];

      const tree = document.createElement('div');
      tree.classList.add('doctree-container');

      docs.forEach((doc, idx) => {
        const label = doc._id
          ? (typeof doc._id === 'object' && doc._id.$oid ? doc._id.$oid.substring(0, 12) + '...' : String(doc._id))
          : `Document ${idx}`;
        const node = this._buildNode(`Document ${idx}`, label, doc, 'object', '', 0);
        tree.appendChild(node);
      });

      this.componentElement.appendChild(tree);
    }

    _buildNode(key, displayKey, val, type, path, depth) {
      const isExpandable = type === 'object' || type === 'array';
      const isExpanded = depth < this._expandLevel;

      const row = document.createElement('div');
      row.classList.add('doctree-row');
      row.style.paddingLeft = `${depth * 16 + 4}px`;

      // Arrow
      const arrow = document.createElement('span');
      arrow.classList.add('doctree-arrow');
      if (isExpandable) {
        arrow.textContent = isExpanded ? '▼' : '▶';
        arrow.classList.add('doctree-arrow-active');
      }
      row.appendChild(arrow);

      // Key
      const keyEl = document.createElement('span');
      keyEl.classList.add('doctree-key');
      keyEl.textContent = displayKey || key;
      if (isExpandable) keyEl.classList.add('doctree-key-expandable');
      row.appendChild(keyEl);

      // Colon
      if (key !== displayKey || !isExpandable) {
        const colon = document.createElement('span');
        colon.classList.add('doctree-colon');
        colon.textContent = ': ';
        row.appendChild(colon);
      }

      // Value (for leaf nodes or summary for expandable)
      const valEl = document.createElement('span');
      valEl.classList.add('doctree-value', `doctree-type-${type}`);
      if (isExpandable) {
        valEl.textContent = ' ' + this._formatValue(val, type);
      } else {
        valEl.textContent = this._formatValue(val, type);
      }
      if (type === 'string' && val.length > 100) {
        valEl.title = val;
      }
      row.appendChild(valEl);

      // Type badge
      const badge = document.createElement('span');
      badge.classList.add('doctree-badge');
      badge.textContent = this._getTypeBadge(type);
      row.appendChild(badge);

      // Click to copy value (leaf nodes)
      if (!isExpandable) {
        valEl.classList.add('doctree-value-clickable');
        valEl.addEventListener('click', (e) => {
          e.stopPropagation();
          const full = this._getFullValue(val, type);
          navigator.clipboard.writeText(full).then(() => {
            this._showCopyToast(valEl);
            this._emitEvent('wcdocumenttreecopy', 'document-tree:copy', {
              bubbles: true, composed: true,
              detail: { path, value: full, type }
            });
          }).catch(() => {});
        });
      }

      // Right-click to copy path
      row.addEventListener('contextmenu', (e) => {
        if (path) {
          e.preventDefault();
          navigator.clipboard.writeText(path).then(() => {
            this._showCopyToast(keyEl, 'Path copied');
          }).catch(() => {});
        }
      });

      // Select event on click
      row.addEventListener('click', (e) => {
        if (!isExpandable) {
          this._emitEvent('wcdocumenttreeselect', 'document-tree:select', {
            bubbles: true, composed: true,
            detail: { path, value: val, type }
          });
        }
      });

      const wrapper = document.createElement('div');
      wrapper.classList.add('doctree-node');
      wrapper.appendChild(row);

      // Children container
      if (isExpandable) {
        const children = document.createElement('div');
        children.classList.add('doctree-children');
        if (!isExpanded) children.classList.add('doctree-collapsed');

        if (type === 'object') {
          const entries = Object.entries(val);
          entries.forEach(([k, v]) => {
            if (k === '_id' && depth === 0) return; // Already shown in root label
            const childType = this._getType(v);
            const childPath = path ? `${path}.${k}` : k;
            children.appendChild(this._buildNode(k, k, v, childType, childPath, depth + 1));
          });
        } else if (type === 'array') {
          val.forEach((item, i) => {
            const childType = this._getType(item);
            const childPath = path ? `${path}[${i}]` : `[${i}]`;
            const label = childType === 'object'
              ? (item._id ? `[${i}] ${typeof item._id === 'object' && item._id.$oid ? item._id.$oid.substring(0, 8) : item._id}` : `[${i}]`)
              : `[${i}]`;
            children.appendChild(this._buildNode(`[${i}]`, label, item, childType, childPath, depth + 1));
          });
        }

        wrapper.appendChild(children);

        // Toggle expand/collapse
        const toggle = (e) => {
          e.stopPropagation();
          const collapsed = children.classList.toggle('doctree-collapsed');
          arrow.textContent = collapsed ? '▶' : '▼';
        };
        arrow.addEventListener('click', toggle);
        keyEl.addEventListener('click', toggle);
      }

      return wrapper;
    }

    _showCopyToast(anchorEl, message) {
      const toast = document.createElement('span');
      toast.classList.add('doctree-copy-toast');
      toast.textContent = message || 'Copied';
      anchorEl.style.position = 'relative';
      anchorEl.appendChild(toast);
      setTimeout(() => toast.remove(), 1200);
    }

    // ── Styles ────────────────────────────────────────────────────────────────

    _applyStyle() {
      const style = `
        wc-document-tree {
          display: contents;
        }
        .wc-document-tree {
          display: flex;
          flex-direction: column;
          height: 100%;
          width: 100%;
          overflow: auto;
          font-family: 'SF Mono', 'Cascadia Code', 'Fira Code', monospace;
          font-size: 0.75rem;
          line-height: 1.6;
        }
        .doctree-container {
          padding: 0.25rem 0;
        }
        .doctree-node {
          /* no extra styles needed */
        }
        .doctree-row {
          display: flex;
          align-items: center;
          gap: 0;
          min-height: 22px;
          padding-right: 0.5rem;
          border-radius: 3px;
          cursor: default;
          white-space: nowrap;
        }
        .doctree-row:hover {
          background: var(--surface-bg-color, rgba(255,255,255,0.04));
        }
        .doctree-arrow {
          width: 14px;
          flex-shrink: 0;
          text-align: center;
          font-size: 0.5rem;
          color: var(--text-6, #666);
          user-select: none;
        }
        .doctree-arrow-active {
          cursor: pointer;
          color: var(--text-color, #ccc);
        }
        .doctree-arrow-active:hover {
          color: var(--primary-bg-color, #6366f1);
        }
        .doctree-key {
          color: var(--text-color, #e0e0e0);
          font-weight: 500;
          flex-shrink: 0;
        }
        .doctree-key-expandable {
          cursor: pointer;
        }
        .doctree-key-expandable:hover {
          color: var(--primary-bg-color, #6366f1);
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .doctree-colon {
          color: var(--text-6, #888);
          flex-shrink: 0;
        }
        .doctree-value {
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }
        .doctree-value-clickable {
          cursor: pointer;
        }
        .doctree-value-clickable:hover {
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        .doctree-type-string { color: #a6e22e; }
        .doctree-type-number { color: #66d9ef; }
        .doctree-type-boolean { color: #e6db74; }
        .doctree-type-null { color: #75715e; font-style: italic; }
        .doctree-type-objectid { color: #ae81ff; }
        .doctree-type-date { color: #6366f1; }
        .doctree-type-object { color: var(--text-6, #888); }
        .doctree-type-array { color: var(--text-6, #888); }

        .doctree-badge {
          margin-left: auto;
          padding-left: 0.5rem;
          font-size: 0.5625rem;
          color: var(--text-6, #555);
          flex-shrink: 0;
          user-select: none;
        }
        .doctree-children {
          overflow: hidden;
          transition: max-height 0.2s ease;
        }
        .doctree-collapsed {
          display: none;
        }
        .doctree-copy-toast {
          position: absolute;
          top: -18px;
          left: 0;
          background: var(--primary-bg-color, #6366f1);
          color: var(--primary-text-color, #fff);
          font-size: 0.5625rem;
          padding: 1px 6px;
          border-radius: 3px;
          pointer-events: none;
          animation: doctreeToastFade 1.2s ease forwards;
          z-index: 10;
        }
        @keyframes doctreeToastFade {
          0% { opacity: 1; transform: translateY(0); }
          70% { opacity: 1; transform: translateY(-4px); }
          100% { opacity: 0; transform: translateY(-8px); }
        }
        .doctree-empty {
          padding: 2rem;
          text-align: center;
          color: var(--text-6, #888);
          font-size: 0.875rem;
          font-family: inherit;
        }
        .doctree-empty code {
          background: var(--surface-bg-color, #2a2a3e);
          padding: 0.125rem 0.375rem;
          border-radius: 3px;
          font-size: 0.8125rem;
        }
      `.trim();
      this.loadStyle('wc-document-tree-style', style);
    }
  }

  customElements.define('wc-document-tree', WcDocumentTree);
}
