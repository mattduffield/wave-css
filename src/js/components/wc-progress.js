/**
 * Name: wc-progress
 * Usage:
 *   <wc-progress value="75" max="100" variant="success" size="sm" label="Storage" show-value></wc-progress>
 *   <wc-progress percent="40" variant="warning"></wc-progress>
 *   <wc-progress value="2" max="2" animate></wc-progress>
 *
 * Description:
 *   Linear progress bar component. Renders a track + fill bar from value/max
 *   or a direct percent. Supports semantic color variants, three sizes,
 *   optional label and percentage text, and animated fill transitions.
 *
 * Attributes:
 *   - value: Current value (default 0)
 *   - max: Maximum value (default 100, ignored if percent is set)
 *   - percent: Direct percentage 0-100 (overrides value/max)
 *   - variant: default, success, warning, danger, info, muted
 *   - size: sm (4px), md (8px), lg (16px)
 *   - label: Text label shown to the left
 *   - show-value: Show computed percentage text to the right
 *   - animate: Animate fill width on value changes
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-progress')) {
  class WcProgress extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'value', 'max', 'percent', 'variant', 'size', 'label', 'show-value', 'animate'];
    }

    static get is() {
      return 'wc-progress';
    }

    constructor() {
      super();
      const compEl = this.querySelector('.wc-progress');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-progress');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }

    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-progress > .wc-progress-track');
      if (innerEl) return;
      this._createInnerElement();
    }

    _getPercent() {
      if (this.hasAttribute('percent')) {
        return Math.max(0, Math.min(100, parseFloat(this.getAttribute('percent')) || 0));
      }
      const value = parseFloat(this.getAttribute('value')) || 0;
      const max = parseFloat(this.getAttribute('max')) || 100;
      if (max <= 0) return 0;
      return Math.max(0, Math.min(100, (value / max) * 100));
    }

    _createInnerElement() {
      this.componentElement.innerHTML = '';

      const variant = this.getAttribute('variant') || 'default';
      const size = this.getAttribute('size') || 'md';
      const label = this.getAttribute('label') || '';
      const showValue = this.hasAttribute('show-value');
      const animate = this.hasAttribute('animate');
      const pct = this._getPercent();

      this.componentElement.dataset.variant = variant;
      this.componentElement.dataset.size = size;

      // Label
      if (label) {
        this._labelEl = document.createElement('span');
        this._labelEl.classList.add('wc-progress-label');
        this._labelEl.textContent = label;
        this.componentElement.appendChild(this._labelEl);
      }

      // Track
      this._trackEl = document.createElement('div');
      this._trackEl.classList.add('wc-progress-track');

      // Fill
      this._fillEl = document.createElement('div');
      this._fillEl.classList.add('wc-progress-fill');
      if (animate) this._fillEl.classList.add('animated');
      this._fillEl.style.width = `${pct}%`;
      this._fillEl.setAttribute('role', 'progressbar');
      this._fillEl.setAttribute('aria-valuenow', Math.round(pct));
      this._fillEl.setAttribute('aria-valuemin', '0');
      this._fillEl.setAttribute('aria-valuemax', '100');

      this._trackEl.appendChild(this._fillEl);
      this.componentElement.appendChild(this._trackEl);

      // Value text
      if (showValue) {
        this._valueEl = document.createElement('span');
        this._valueEl.classList.add('wc-progress-value');
        this._valueEl.textContent = `${Math.round(pct)}%`;
        this.componentElement.appendChild(this._valueEl);
      }
    }

    _updateBar() {
      const pct = this._getPercent();
      if (this._fillEl) {
        this._fillEl.style.width = `${pct}%`;
        this._fillEl.setAttribute('aria-valuenow', Math.round(pct));
      }
      if (this._valueEl) {
        this._valueEl.textContent = `${Math.round(pct)}%`;
      }
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === 'value' || attrName === 'max' || attrName === 'percent') {
        this._updateBar();
      } else if (attrName === 'variant') {
        if (this.componentElement) this.componentElement.dataset.variant = newValue || 'default';
      } else if (attrName === 'size') {
        if (this.componentElement) this.componentElement.dataset.size = newValue || 'md';
      } else if (attrName === 'label') {
        if (this._labelEl) {
          this._labelEl.textContent = newValue || '';
        } else if (newValue) {
          this._labelEl = document.createElement('span');
          this._labelEl.classList.add('wc-progress-label');
          this._labelEl.textContent = newValue;
          this.componentElement.insertBefore(this._labelEl, this._trackEl);
        }
      } else if (attrName === 'show-value') {
        if (newValue !== null && !this._valueEl) {
          this._valueEl = document.createElement('span');
          this._valueEl.classList.add('wc-progress-value');
          this._valueEl.textContent = `${Math.round(this._getPercent())}%`;
          this.componentElement.appendChild(this._valueEl);
        } else if (newValue === null && this._valueEl) {
          this._valueEl.remove();
          this._valueEl = null;
        }
      } else if (attrName === 'animate') {
        if (this._fillEl) {
          this._fillEl.classList.toggle('animated', newValue !== null);
        }
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _applyStyle() {
      const style = `
        wc-progress {
          display: contents;
        }
        .wc-progress {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
        }

        /* Label */
        .wc-progress-label {
          font-size: 0.75rem;
          color: var(--text-2);
          white-space: nowrap;
          flex-shrink: 0;
        }

        /* Track */
        .wc-progress-track {
          flex: 1;
          background: var(--surface-3);
          border-radius: 9999px;
          overflow: hidden;
        }

        /* Fill */
        .wc-progress-fill {
          height: 100%;
          border-radius: 9999px;
          min-width: 0;
        }
        .wc-progress-fill.animated {
          transition: width 300ms ease;
        }

        /* Value text */
        .wc-progress-value {
          font-size: 0.6875rem;
          font-family: monospace;
          color: var(--text-4);
          white-space: nowrap;
          flex-shrink: 0;
          min-width: 2.5em;
          text-align: right;
        }

        /* Sizes */
        .wc-progress[data-size="sm"] .wc-progress-track { height: 4px; }
        .wc-progress[data-size="md"] .wc-progress-track { height: 8px; }
        .wc-progress[data-size="lg"] .wc-progress-track { height: 16px; }

        /* Variants */
        .wc-progress[data-variant="default"] .wc-progress-fill {
          background: var(--primary-bg-color);
        }
        .wc-progress[data-variant="success"] .wc-progress-fill {
          background: var(--success-color);
        }
        .wc-progress[data-variant="warning"] .wc-progress-fill {
          background: var(--warning-color);
        }
        .wc-progress[data-variant="danger"] .wc-progress-fill {
          background: var(--danger-color);
        }
        .wc-progress[data-variant="info"] .wc-progress-fill {
          background: var(--info-color);
        }
        .wc-progress[data-variant="muted"] .wc-progress-fill {
          background: var(--text-6);
        }
      `.trim();
      this.loadStyle('wc-progress-style', style);
    }
  }

  customElements.define('wc-progress', WcProgress);
}
