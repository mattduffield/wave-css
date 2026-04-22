/**
 *  Name: wc-split-pane
 *  Usage:
 *    <wc-split-pane initial-size="256px" min-size="200px" max-size="400px" collapsible>
 *      <wc-split-start>Left panel (sized)</wc-split-start>
 *      <wc-split-end>Right panel (flex)</wc-split-end>
 *    </wc-split-pane>
 *
 *    <!-- Right-side collapsible panel -->
 *    <wc-split-pane initial-size="380px" collapsible collapse-side="end">
 *      <wc-split-start>Main content (flex)</wc-split-start>
 *      <wc-split-end>Inspector panel (sized, collapsible)</wc-split-end>
 *    </wc-split-pane>
 *
 *  Attributes:
 *    - collapse-side: "start" (default) or "end" — which pane is sized/collapsible
 *
 *  Description:
 *    Resizable split panel with draggable divider. Supports horizontal (left/right)
 *    and vertical (top/bottom) layouts, collapsible panes on either side,
 *    localStorage persistence, and nesting for complex layouts.
 */

import { WcBaseComponent } from './wc-base-component.js';

// Simple wrapper components
if (!customElements.get('wc-split-start')) {
  class WcSplitStart extends HTMLElement {
    constructor() { super(); }
    connectedCallback() {
      if (!this.classList.contains('wc-split-start')) {
        this.classList.add('wc-split-start');
      }
    }
  }
  customElements.define('wc-split-start', WcSplitStart);
}

if (!customElements.get('wc-split-end')) {
  class WcSplitEnd extends HTMLElement {
    constructor() { super(); }
    connectedCallback() {
      if (!this.classList.contains('wc-split-end')) {
        this.classList.add('wc-split-end');
      }
    }
  }
  customElements.define('wc-split-end', WcSplitEnd);
}

if (!customElements.get('wc-split-pane')) {
  class WcSplitPane extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'direction', 'initial-size', 'min-size', 'max-size',
              'divider-width', 'collapsible', 'collapsed', 'persist-key', 'collapse-side'];
    }

    static get is() { return 'wc-split-pane'; }

    constructor() {
      super();
      this.childComponentSelector = 'wc-split-start';
      this._isDragging = false;
      this._currentSize = 0;
      this._isCollapsed = false;

      const compEl = this.querySelector(':scope > .wc-split-pane');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-split-pane');
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

    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-split-pane > .wc-split-divider');
      if (innerEl) {
        // Already rendered — rebind references
        this._divider = innerEl;
        this._startEl = this.querySelector(':scope > .wc-split-pane > wc-split-start');
        this._endEl = this.querySelector(':scope > .wc-split-pane > wc-split-end');
        this._collapseSide = this.getAttribute('collapse-side') || 'start';
        this._targetEl = this._collapseSide === 'end' ? this._endEl : this._startEl;
        this._collapseBtn = innerEl.querySelector('.wc-split-collapse-btn');
      } else {
        this.componentElement.innerHTML = '';
        this._createInnerElement();
      }
      // Wire events after DOM is built and _divider exists
      this._wireEvents();
    }

    _createInnerElement() {
      const direction = this.getAttribute('direction') || 'horizontal';
      const isHorizontal = direction === 'horizontal';
      const dividerWidth = parseInt(this.getAttribute('divider-width') || '6', 10);
      const collapsible = this.hasAttribute('collapsible');
      const startCollapsed = this.hasAttribute('collapsed');
      const collapseSide = this.getAttribute('collapse-side') || 'start';

      // Determine initial size
      let initialSize = this.getAttribute('initial-size') || '250px';
      const persistKey = this.getAttribute('persist-key');
      if (persistKey) {
        const saved = localStorage.getItem(`wc-split-pane:${persistKey}`);
        if (saved) {
          try {
            const state = JSON.parse(saved);
            initialSize = state.size || initialSize;
            if (state.collapsed !== undefined) this._isCollapsed = state.collapsed;
          } catch (e) { /* ignore */ }
        }
      }
      if (startCollapsed) this._isCollapsed = true;

      this._initialSizeStr = initialSize;
      this._direction = direction;
      this._dividerWidth = dividerWidth;
      this._persistKey = persistKey;
      this._collapseSide = collapseSide;

      // Container
      this.componentElement.style.display = 'flex';
      this.componentElement.style.flexDirection = isHorizontal ? 'row' : 'column';
      this.componentElement.style.width = '100%';
      this.componentElement.style.height = '100%';
      this.componentElement.style.overflow = 'hidden';

      // Find start and end pane elements
      const startEl = this.querySelector(':scope > wc-split-start') || this.querySelector('wc-split-start');
      const endEl = this.querySelector(':scope > wc-split-end') || this.querySelector('wc-split-end');

      if (!startEl || !endEl) {
        console.error('[wc-split-pane] Requires <wc-split-start> and <wc-split-end> children.');
        return;
      }

      this._startEl = startEl;
      this._endEl = endEl;

      // Determine which pane is the sized/collapsible one vs the flex one
      const targetEl = collapseSide === 'end' ? endEl : startEl;
      const flexEl = collapseSide === 'end' ? startEl : endEl;
      this._targetEl = targetEl;

      // Style the sized (collapsible) pane
      targetEl.style.overflow = 'auto';
      targetEl.style.flexShrink = '0';
      targetEl.style.display = 'flex';
      targetEl.style.flexDirection = 'column';
      if (isHorizontal) {
        targetEl.style.width = this._isCollapsed ? '0px' : initialSize;
        targetEl.style.height = '100%';
      } else {
        targetEl.style.height = this._isCollapsed ? '0px' : initialSize;
        targetEl.style.width = '100%';
      }
      if (this._isCollapsed) targetEl.style.overflow = 'hidden';

      // Create divider
      const divider = document.createElement('div');
      divider.classList.add('wc-split-divider');
      divider.setAttribute('role', 'separator');
      divider.setAttribute('aria-orientation', isHorizontal ? 'vertical' : 'horizontal');
      divider.setAttribute('tabindex', '0');

      if (isHorizontal) {
        divider.style.width = `${dividerWidth}px`;
        divider.style.cursor = 'col-resize';
      } else {
        divider.style.height = `${dividerWidth}px`;
        divider.style.cursor = 'row-resize';
      }

      // Add grip icon to divider
      const grip = document.createElement('wc-fa-icon');
      grip.classList.add('wc-split-grip');
      grip.setAttribute('name', isHorizontal ? 'grip-dots-vertical' : 'grip-dots');
      grip.setAttribute('size', '0.75rem');
      divider.appendChild(grip);

      // Collapse button
      if (collapsible) {
        const collapseBtn = document.createElement('button');
        collapseBtn.classList.add('wc-split-collapse-btn');
        collapseBtn.type = 'button';
        collapseBtn.setAttribute('aria-label', 'Toggle panel');
        this._updateCollapseIcon(collapseBtn);
        divider.appendChild(collapseBtn);
        this._collapseBtn = collapseBtn;
      }

      this._divider = divider;

      // Style the flex pane
      flexEl.style.flex = '1';
      flexEl.style.overflow = 'auto';
      flexEl.style.display = 'flex';
      flexEl.style.flexDirection = 'column';
      flexEl.style.minWidth = '0';
      flexEl.style.minHeight = '0';

      // Assemble: move children into componentElement
      this.componentElement.appendChild(startEl);
      this.componentElement.appendChild(divider);
      this.componentElement.appendChild(endEl);

      // Store initial pixel size after layout
      requestAnimationFrame(() => {
        const isH = this._direction === 'horizontal';
        this._currentSize = isH ? targetEl.offsetWidth : targetEl.offsetHeight;
        this._updateAria();
      });
    }

    _updateCollapseIcon(btn) {
      const isH = this._direction === 'horizontal';
      const isEnd = this._collapseSide === 'end';
      if (this._isCollapsed) {
        // Expand: arrow points toward the collapsed pane
        if (isH) {
          btn.innerHTML = isEnd ? '&#9664;' : '&#9654;'; // ◄ or ►
        } else {
          btn.innerHTML = isEnd ? '&#9650;' : '&#9660;'; // ▲ or ▼
        }
        btn.title = 'Expand panel';
      } else {
        // Collapse: arrow points away from the pane
        if (isH) {
          btn.innerHTML = isEnd ? '&#9654;' : '&#9664;'; // ► or ◄
        } else {
          btn.innerHTML = isEnd ? '&#9660;' : '&#9650;'; // ▼ or ▲
        }
        btn.title = 'Collapse panel';
      }
    }

    _updateAria() {
      if (!this._divider) return;
      const minSize = parseInt(this.getAttribute('min-size') || '100', 10);
      const maxSize = this._getMaxSizePx();
      this._divider.setAttribute('aria-valuenow', Math.round(this._currentSize));
      this._divider.setAttribute('aria-valuemin', minSize);
      this._divider.setAttribute('aria-valuemax', maxSize);
    }

    _getMaxSizePx() {
      const maxStr = this.getAttribute('max-size') || '50%';
      const isH = this._direction === 'horizontal';
      const containerSize = isH ? this.componentElement.offsetWidth : this.componentElement.offsetHeight;
      if (maxStr.endsWith('%')) {
        return containerSize * parseFloat(maxStr) / 100;
      }
      return parseInt(maxStr, 10);
    }

    _clampSize(size) {
      const minSize = parseInt(this.getAttribute('min-size') || '100', 10);
      const maxSize = this._getMaxSizePx();
      return Math.max(minSize, Math.min(maxSize, size));
    }

    _setSize(size, animate = false) {
      if (!this._targetEl) return;
      const isH = this._direction === 'horizontal';
      const prop = isH ? 'width' : 'height';
      const clamped = this._clampSize(size);
      this._currentSize = clamped;

      if (animate) {
        this._targetEl.style.transition = `${prop} 200ms ease`;
        setTimeout(() => { this._targetEl.style.transition = ''; }, 250);
      }

      this._targetEl.style[prop] = `${clamped}px`;
      this._targetEl.style.overflow = 'auto';
      this._isCollapsed = false;
      this._updateAria();
      if (this._collapseBtn) this._updateCollapseIcon(this._collapseBtn);
    }

    _collapse(animate = true) {
      if (!this._targetEl) return;
      const isH = this._direction === 'horizontal';
      const prop = isH ? 'width' : 'height';

      if (!this._isCollapsed) {
        this._sizeBeforeCollapse = this._currentSize;
      }

      if (animate) {
        this._targetEl.style.transition = `${prop} 200ms ease`;
        setTimeout(() => { this._targetEl.style.transition = ''; }, 250);
      }

      this._targetEl.style[prop] = '0px';
      this._targetEl.style.overflow = 'hidden';
      this._isCollapsed = true;
      if (this._collapseBtn) this._updateCollapseIcon(this._collapseBtn);
      this._persist();

      this._emitEvent('wcsplitpanecollapse', 'split-pane:collapse', {
        bubbles: true, detail: { collapsed: true }
      });
    }

    _expand(animate = true) {
      const size = this._sizeBeforeCollapse || parseInt(this._initialSizeStr, 10) || 250;
      this._setSize(size, animate);
      this._isCollapsed = false;
      if (this._collapseBtn) this._updateCollapseIcon(this._collapseBtn);
      this._persist();

      this._emitEvent('wcsplitpanecollapse', 'split-pane:collapse', {
        bubbles: true, detail: { collapsed: false }
      });
    }

    toggle() {
      if (this._isCollapsed) this._expand();
      else this._collapse();
    }

    _persist() {
      if (!this._persistKey) return;
      const state = {
        size: `${this._currentSize}px`,
        collapsed: this._isCollapsed
      };
      localStorage.setItem(`wc-split-pane:${this._persistKey}`, JSON.stringify(state));
    }

    _wireEvents() {
      if (!this._divider) return;
      // Prevent double-wiring
      if (this._eventsWired) return;
      this._eventsWired = true;

      // Drag
      this._onMouseDown = (e) => {
        if (e.target.closest('.wc-split-collapse-btn')) return;
        e.preventDefault();
        this._isDragging = true;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = this._direction === 'horizontal' ? 'col-resize' : 'row-resize';
        this._divider.classList.add('active');

        this._dragStartPos = (this._direction === 'horizontal') ? e.clientX : e.clientY;
        this._dragStartSize = this._currentSize;
      };

      this._onMouseMove = (e) => {
        if (!this._isDragging) return;
        const isH = this._direction === 'horizontal';
        const currentPos = isH ? e.clientX : e.clientY;
        const delta = currentPos - this._dragStartPos;
        const sign = this._collapseSide === 'end' ? -1 : 1;
        const newSize = this._dragStartSize + (delta * sign);
        this._setSize(newSize);
      };

      this._onMouseUp = () => {
        if (!this._isDragging) return;
        this._isDragging = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        this._divider.classList.remove('active');
        this._persist();

        const containerSize = this._direction === 'horizontal'
          ? this.componentElement.offsetWidth
          : this.componentElement.offsetHeight;
        const percentage = ((this._currentSize / containerSize) * 100).toFixed(1);

        this._emitEvent('wcsplitpaneresize', 'split-pane:resize', {
          bubbles: true,
          detail: { size: `${this._currentSize}px`, percentage: `${percentage}%` }
        });
      };

      // Collapse button
      if (this._collapseBtn) {
        this._onCollapseClick = (e) => {
          e.stopPropagation();
          this.toggle();
        };
        this._collapseBtn.addEventListener('click', this._onCollapseClick);
      }

      // Keyboard
      this._onKeyDown = (e) => {
        const step = e.shiftKey ? 50 : 10;
        const isH = this._direction === 'horizontal';
        const sign = this._collapseSide === 'end' ? -1 : 1;
        switch (e.key) {
          case 'ArrowLeft':
            if (isH) { e.preventDefault(); this._setSize(this._currentSize - (step * sign)); this._persist(); }
            break;
          case 'ArrowRight':
            if (isH) { e.preventDefault(); this._setSize(this._currentSize + (step * sign)); this._persist(); }
            break;
          case 'ArrowUp':
            if (!isH) { e.preventDefault(); this._setSize(this._currentSize - (step * sign)); this._persist(); }
            break;
          case 'ArrowDown':
            if (!isH) { e.preventDefault(); this._setSize(this._currentSize + (step * sign)); this._persist(); }
            break;
          case 'Home':
            e.preventDefault();
            this._setSize(parseInt(this.getAttribute('min-size') || '100', 10));
            this._persist();
            break;
          case 'End':
            e.preventDefault();
            this._setSize(this._getMaxSizePx());
            this._persist();
            break;
          case 'Enter':
            if (this.hasAttribute('collapsible')) {
              e.preventDefault();
              this.toggle();
            }
            break;
        }
      };

      // Touch support
      this._onTouchStart = (e) => {
        if (e.target.closest('.wc-split-collapse-btn')) return;
        const touch = e.touches[0];
        this._isDragging = true;
        const isH = this._direction === 'horizontal';
        this._dragStartPos = isH ? touch.clientX : touch.clientY;
        this._dragStartSize = this._currentSize;
        this._divider.classList.add('active');
      };

      this._onTouchMove = (e) => {
        if (!this._isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        const isH = this._direction === 'horizontal';
        const currentPos = isH ? touch.clientX : touch.clientY;
        const delta = currentPos - this._dragStartPos;
        const sign = this._collapseSide === 'end' ? -1 : 1;
        this._setSize(this._dragStartSize + (delta * sign));
      };

      this._onTouchEnd = () => {
        if (!this._isDragging) return;
        this._isDragging = false;
        this._divider.classList.remove('active');
        this._persist();
      };

      this._divider.addEventListener('mousedown', this._onMouseDown);
      document.addEventListener('mousemove', this._onMouseMove);
      document.addEventListener('mouseup', this._onMouseUp);
      this._divider.addEventListener('keydown', this._onKeyDown);
      this._divider.addEventListener('touchstart', this._onTouchStart, { passive: false });
      document.addEventListener('touchmove', this._onTouchMove, { passive: false });
      document.addEventListener('touchend', this._onTouchEnd);
    }

    _unWireEvents() {
      this._eventsWired = false;
      if (this._onMouseMove) document.removeEventListener('mousemove', this._onMouseMove);
      if (this._onMouseUp) document.removeEventListener('mouseup', this._onMouseUp);
      if (this._onTouchMove) document.removeEventListener('touchmove', this._onTouchMove);
      if (this._onTouchEnd) document.removeEventListener('touchend', this._onTouchEnd);
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === 'collapsed') {
        if (newValue !== null) this._collapse(false);
        else this._expand(false);
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _applyStyle() {
      const style = `
        wc-split-pane { display: contents; }

        .wc-split-pane {
          display: flex;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }

        .wc-split-divider {
          flex-shrink: 0;
          background: var(--component-border-color);
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background-color 0.15s;
          z-index: 1;
        }
        .wc-split-divider:hover {
          background: var(--primary-bg-color);
        }
        .wc-split-divider.active {
          background: var(--primary-bg-color);
        }
        .wc-split-divider:focus-visible {
          outline: 2px solid var(--primary-bg-color);
          outline-offset: -2px;
        }

        .wc-split-grip {
          pointer-events: none;
          color: var(--text-color);
          opacity: 0.4;
          font-size: 14px;
          line-height: 1;
          user-select: none;
        }
        .wc-split-divider:hover .wc-split-grip {
          opacity: 0.9;
          color: var(--primary-text-color, #fff);
        }

        .wc-split-collapse-btn {
          position: absolute;
          background: var(--card-bg-color);
          border: 1px solid var(--card-border-color);
          color: var(--text-color);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 3px;
          padding: 0;
          line-height: 1;
          z-index: 2;
          transition: background-color 0.15s, color 0.15s;
        }
        .wc-split-collapse-btn:hover {
          background: var(--primary-bg-color);
          color: var(--primary-text-color, #fff);
          border-color: var(--primary-bg-color);
        }

        /* Horizontal divider collapse button */
        .wc-split-pane[style*="flex-direction: row"] > .wc-split-divider .wc-split-collapse-btn,
        .wc-split-pane:not([style*="flex-direction"]) > .wc-split-divider .wc-split-collapse-btn {
          width: 12px;
          height: 28px;
          font-size: 8px;
        }

        /* Vertical divider collapse button */
        .wc-split-pane[style*="flex-direction: column"] > .wc-split-divider .wc-split-collapse-btn {
          width: 28px;
          height: 12px;
          font-size: 8px;
        }

        wc-split-start, wc-split-end {
          display: flex;
          flex-direction: column;
          min-width: 0;
          min-height: 0;
        }
      `;
      this.loadStyle('wc-split-pane-style', style);
    }
  }

  customElements.define('wc-split-pane', WcSplitPane);
}
