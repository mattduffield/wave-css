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
      return ['value', 'label', 'position'];
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

      // Ensure parent is positioned
      const parent = this.parentElement;
      if (parent) {
        const parentPos = getComputedStyle(parent).position;
        if (parentPos === 'static') {
          parent.style.position = 'relative';
        }
      }
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
      const position = this.getAttribute('position') || 'top-right';

      this.componentElement.dataset.position = position;

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
          this.componentElement.dataset.position = newValue || 'top-right';
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
          position: absolute;
          z-index: 1;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 1px;
          opacity: 0.35;
          transition: opacity 0.2s;
          pointer-events: auto;
        }
        .wc-ref-key:hover {
          opacity: 1;
        }
        .wc-ref-key[data-position="top-right"] {
          top: 4px;
          right: 4px;
          align-items: flex-end;
        }
        .wc-ref-key[data-position="top-left"] {
          top: 4px;
          left: 4px;
          align-items: flex-start;
        }
        .wc-ref-key[data-position="bottom-right"] {
          bottom: 4px;
          right: 4px;
          align-items: flex-end;
        }
        .wc-ref-key[data-position="bottom-left"] {
          bottom: 4px;
          left: 4px;
          align-items: flex-start;
        }
        .ref-key-badge {
          padding: 0px 5px;
          font-size: 9px;
          font-family: monospace;
          letter-spacing: 0.03em;
          background: var(--surface-3);
          color: var(--text-4);
          border-radius: 6px;
          white-space: nowrap;
          cursor: default;
          line-height: 1.5;
        }
        .ref-key-label {
          display: none;
          padding: 0px 5px;
          font-size: 8px;
          color: var(--text-6);
          white-space: nowrap;
          line-height: 1.4;
        }
        .wc-ref-key:hover .ref-key-label {
          display: block;
        }
      `.trim();
      this.loadStyle('wc-ref-key-style', style);
    }
  }

  customElements.define('wc-ref-key', WcRefKey);
}
