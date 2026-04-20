/**
 * Name: wc-ref-key
 * Usage:
 *   <wc-ref-key value="DST-4002" label="Data Compare"></wc-ref-key>
 *
 * Description:
 *   Displays a reference key as a small, semi-transparent pill badge positioned
 *   at a corner of its closest positioned parent. Used by wc-help-drawer to scan
 *   for contextual help keys on the current page.
 *
 * Attributes:
 *   - value: The reference key string (e.g. "DST-4002")
 *   - label: Descriptive label shown on hover
 *   - position: Corner position — top-right (default), top-left, bottom-right, bottom-left
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-ref-key')) {
  class WcRefKey extends WcBaseComponent {
    static get observedAttributes() {
      return ['value', 'label', 'position', 'orientation'];
    }

    static get is() {
      return 'wc-ref-key';
    }

    constructor() {
      super();
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-ref-key');
      this.appendChild(this.componentElement);
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();

      // No parent positioning needed — sticky handles its own context
    }

    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-ref-key > .ref-key-badge');
      if (innerEl) return;
      this._createInnerElement();
    }

    _createInnerElement() {
      this.componentElement.innerHTML = '';

      const value = this.getAttribute('value') || '';
      const label = this.getAttribute('label') || '';
      const position = this.getAttribute('position') || 'bottom-right';

      const orientation = this.getAttribute('orientation') || 'vertical';

      this.componentElement.dataset.position = position;
      this.componentElement.dataset.orientation = orientation;

      const badge = document.createElement('span');
      badge.classList.add('ref-key-badge');
      badge.textContent = value;
      if (label) badge.title = label;
      this.componentElement.appendChild(badge);

      if (label) {
        const labelEl = document.createElement('span');
        labelEl.classList.add('ref-key-label');
        labelEl.textContent = label;
        this.componentElement.appendChild(labelEl);
      }
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === 'value') {
        const badge = this.componentElement?.querySelector('.ref-key-badge');
        if (badge) badge.textContent = newValue || '';
      } else if (attrName === 'label') {
        const badge = this.componentElement?.querySelector('.ref-key-badge');
        if (badge) badge.title = newValue || '';
        let labelEl = this.componentElement?.querySelector('.ref-key-label');
        if (newValue) {
          if (!labelEl) {
            labelEl = document.createElement('span');
            labelEl.classList.add('ref-key-label');
            this.componentElement.appendChild(labelEl);
          }
          labelEl.textContent = newValue;
        } else if (labelEl) {
          labelEl.remove();
        }
      } else if (attrName === 'position') {
        if (this.componentElement) {
          this.componentElement.dataset.position = newValue || 'bottom-right';
        }
      } else if (attrName === 'orientation') {
        if (this.componentElement) {
          this.componentElement.dataset.orientation = newValue || 'vertical';
        }
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _applyStyle() {
      const style = `
        wc-ref-key {
          display: contents;
        }
        .wc-ref-key {
          position: sticky;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2px;
          opacity: 0.35;
          transition: opacity 0.2s;
          pointer-events: auto;
          width: fit-content;
        }
        .wc-ref-key:hover {
          opacity: 1;
        }
        .wc-ref-key[data-position="top-right"] {
          top: 8px;
          margin-left: auto;
          padding-right: 6px;
        }
        .wc-ref-key[data-position="top-left"] {
          top: 8px;
          margin-right: auto;
          padding-left: 6px;
        }
        .wc-ref-key[data-position="bottom-right"] {
          bottom: 8px;
          margin-left: auto;
          padding-right: 6px;
        }
        .wc-ref-key[data-position="bottom-left"] {
          bottom: 8px;
          margin-right: auto;
          padding-left: 6px;
        }
        .ref-key-badge {
          writing-mode: vertical-rl;
          text-orientation: mixed;
          padding: 4px 2px;
          font-size: 8px;
          font-family: monospace;
          letter-spacing: 0.05em;
          background: var(--surface-3);
          color: var(--text-4);
          border-radius: 4px;
          white-space: nowrap;
          cursor: default;
          line-height: 1;
        }
        .ref-key-label {
          display: none;
          writing-mode: vertical-rl;
          text-orientation: mixed;
          padding: 2px 2px;
          font-size: 7px;
          color: var(--text-6);
          white-space: nowrap;
          line-height: 1;
        }
        .wc-ref-key:hover .ref-key-label {
          display: block;
        }
        /* Horizontal orientation */
        .wc-ref-key[data-orientation="horizontal"] {
          flex-direction: row;
        }
        .wc-ref-key[data-orientation="horizontal"] .ref-key-badge,
        .wc-ref-key[data-orientation="horizontal"] .ref-key-label {
          writing-mode: horizontal-tb;
          text-orientation: initial;
        }
      `.trim();
      this.loadStyle('wc-ref-key-style', style);
    }
  }

  customElements.define('wc-ref-key', WcRefKey);
}
