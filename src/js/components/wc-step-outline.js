/**
 * Name: wc-step-outline
 * Usage:
 *   <wc-step-outline for="script"></wc-step-outline>
 *
 * Description:
 *   Companion to wc-code-mirror[step-gutter]. Renders a hierarchical list
 *   of {% call step %} blocks parsed from the target editor's content.
 *   Each row shows a colored dot (matching the gutter palette), the step
 *   name, and indentation by nesting depth. Click a row → cursor jumps
 *   to that line in the editor and scrolls it into view.
 *
 *   Uses the SAME parser as the gutter (wc-code-mirror.parseStepBandRanges)
 *   so the two views stay in lockstep across edits. Re-renders on every
 *   editor change, debounced 150ms.
 *
 * Attributes:
 *   - for: required. The `name` attribute of the wc-code-mirror this
 *          outline mirrors. Resolution: document.querySelector(
 *          'wc-code-mirror[name="<for>"]'). The component waits for the
 *          editor to fire `wc-code-mirror:ready` if it isn't initialized
 *          yet, and re-binds if the attribute changes.
 *
 * Phase 2b of plan-pilot-authoring-evolution.md. Phase 2c will pulse the
 * row matching the currently-executing step during a Debug run.
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-step-outline')) {
  class WcStepOutline extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'for'];
    }

    static get is() {
      return 'wc-step-outline';
    }

    constructor() {
      super();
      this._targetEditor = null;     // CodeMirror instance once attached
      this._targetWcEl   = null;     // wc-code-mirror element once attached
      this._debounceTimer = null;
      this._readyHandler  = null;
      this._changeHandler = null;
      this._activeLine    = null;    // 0-indexed line for active-row highlight

      const compEl = this.querySelector('.wc-step-outline');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-step-outline');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._installReadyListener();
      // Try wiring up immediately in case the editor is already initialized
      // (DOM-order siblings, no race) — and listen for ready in case it isn't.
      this._tryWireUp();
      this._render();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._teardown();
    }

    _handleAttributeChange(attrName, newValue, oldValue) {
      if (attrName === 'for') {
        this._teardown();
        this._installReadyListener();
        this._tryWireUp();
        this._render();
      } else {
        super._handleAttributeChange(attrName, newValue, oldValue);
      }
    }

    // ── Wire-up lifecycle ────────────────────────────────────────────────

    _installReadyListener() {
      if (this._readyHandler) return;
      const self = this;
      this._readyHandler = function (e) {
        const targetName = self.getAttribute('for');
        if (!targetName) return;
        if (!e.detail || e.detail.name !== targetName) return;
        const ed = e.detail.editor;
        if (!ed || typeof ed.getWrapperElement !== 'function') return;
        const wcEl = ed.getWrapperElement().closest('wc-code-mirror');
        self._attach(wcEl, ed);
      };
      document.body.addEventListener('wc-code-mirror:ready', this._readyHandler);
    }

    _tryWireUp() {
      const targetName = this.getAttribute('for');
      if (!targetName) return;
      const wcEl = document.querySelector('wc-code-mirror[name="' + targetName + '"]');
      if (wcEl && wcEl.editor) {
        this._attach(wcEl, wcEl.editor);
      }
    }

    _attach(wcEl, editor) {
      if (!wcEl || !editor) return;
      if (this._targetEditor === editor) {
        // Already attached to this editor — just refresh in case content changed.
        this._render();
        return;
      }
      this._detach();
      this._targetEditor = editor;
      this._targetWcEl   = wcEl;
      this._render();

      const self = this;
      this._changeHandler = function () {
        clearTimeout(self._debounceTimer);
        self._debounceTimer = setTimeout(function () {
          self._render();
        }, 150);
      };
      editor.on('change', this._changeHandler);
    }

    _detach() {
      if (this._changeHandler && this._targetEditor) {
        this._targetEditor.off('change', this._changeHandler);
      }
      this._changeHandler = null;
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
      this._targetEditor  = null;
      this._targetWcEl    = null;
    }

    _teardown() {
      this._detach();
      if (this._readyHandler) {
        document.body.removeEventListener('wc-code-mirror:ready', this._readyHandler);
        this._readyHandler = null;
      }
    }

    // ── Public API ───────────────────────────────────────────────────────

    /**
     * Highlight the row matching the given line (0-indexed). Used by
     * Phase 2c's live-Debug-step pulse and by ad-hoc callers that want
     * to track "current step" externally. Pass null to clear.
     */
    setActiveLine(line) {
      this._activeLine = (typeof line === 'number') ? line : null;
      this._applyActiveRow();
    }

    /**
     * Force a re-render. Rarely needed — the component re-renders
     * automatically on editor edit. Exposed for callers that mutate the
     * editor content without going through CodeMirror (uncommon).
     */
    refresh() {
      this._render();
    }

    // ── Render ───────────────────────────────────────────────────────────

    _render() {
      const root = this.componentElement;
      if (!this._targetEditor || !this._targetWcEl) {
        root.innerHTML = '';
        return;
      }

      let ranges = [];
      if (typeof this._targetWcEl.parseStepBandRanges === 'function') {
        ranges = this._targetWcEl.parseStepBandRanges(this._targetEditor.getValue());
      }

      // Build outline fragment off-DOM, then swap in — minimizes layout thrash.
      const frag = document.createDocumentFragment();

      const header = document.createElement('div');
      header.className = 'wc-step-outline-header';
      const title = document.createElement('span');
      title.textContent = 'Steps';
      header.appendChild(title);
      const count = document.createElement('span');
      count.className = 'wc-step-outline-count';
      count.textContent = String(ranges.length);
      header.appendChild(count);
      frag.appendChild(header);

      if (ranges.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'wc-step-outline-empty';
        empty.textContent = 'No step blocks';
        frag.appendChild(empty);
        root.innerHTML = '';
        root.appendChild(frag);
        return;
      }

      const self = this;
      for (let i = 0; i < ranges.length; i++) {
        const r = ranges[i];
        const row = document.createElement('div');
        row.className = 'wc-step-outline-row';
        const depth = Math.max(0, r.depth | 0);
        row.dataset.depth = String(depth);
        row.dataset.line  = String(r.startLine);
        row.title = (r.name || '(unnamed)') + ' — line ' + (r.startLine + 1);

        const dot = document.createElement('span');
        const type = String(r.type || 'group').toLowerCase();
        dot.className = 'wc-step-outline-dot wc-step-outline-dot-' + type;
        row.appendChild(dot);

        const label = document.createElement('span');
        label.className = 'wc-step-outline-label';
        label.textContent = r.name || '(unnamed)';
        row.appendChild(label);

        row.addEventListener('click', function () {
          self._jumpToLine(r.startLine);
        });

        frag.appendChild(row);
      }

      root.innerHTML = '';
      root.appendChild(frag);
      this._applyActiveRow();
    }

    _applyActiveRow() {
      const rows = this.componentElement.querySelectorAll('.wc-step-outline-row');
      const target = (this._activeLine == null) ? '' : String(this._activeLine);
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].dataset.line === target) {
          rows[i].classList.add('is-active');
        } else {
          rows[i].classList.remove('is-active');
        }
      }
    }

    _jumpToLine(line) {
      if (!this._targetEditor) return;
      const editor = this._targetEditor;
      editor.setCursor({ line: line, ch: 0 });
      editor.focus();
      // Scroll the line into view with ~60px of context above it (the
      // step's opening tag and a bit of preceding context — easier to
      // orient than landing flush at the top).
      try {
        const top = editor.charCoords({ line: line, ch: 0 }, 'local').top;
        editor.scrollTo(null, Math.max(0, top - 60));
      } catch (e) {
        // charCoords can throw on out-of-range lines; fall back to
        // CodeMirror's built-in scrollIntoView.
        editor.scrollIntoView({ line: line, ch: 0 }, 60);
      }
      this.setActiveLine(line);
    }
  }

  customElements.define('wc-step-outline', WcStepOutline);
}
