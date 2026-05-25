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
      return ['id', 'class', 'for', 'events-from'];
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
      this._activeStack   = [];      // runtime stack from setActiveStack()
      this._activeLine    = null;    // 0-indexed line for active-row highlight
      this._lastActiveLine = null;   // for flash-on-transition logic
      this._eventStreamEl  = null;   // wc-event-stream subscribed to (if any)
      this._stepChangeHandler = null;
      this._flashTimer     = null;
      this._currentRanges  = [];     // memoized last-parsed ranges

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
      this._subscribeToEventStream();
      this._render();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._teardown();
      this._unsubscribeFromEventStream();
    }

    _handleAttributeChange(attrName, newValue, oldValue) {
      if (attrName === 'for') {
        this._teardown();
        this._installReadyListener();
        this._tryWireUp();
        this._render();
      } else if (attrName === 'events-from') {
        this._unsubscribeFromEventStream();
        this._subscribeToEventStream();
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
      // Wave CSS emits both `wccodemirrorready` (canonical) and
      // `wc-code-mirror:ready` (deprecated). Use the canonical name to
      // avoid the deprecation-warning console noise.
      document.body.addEventListener('wccodemirrorready', this._readyHandler);
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
        document.body.removeEventListener('wccodemirrorready', this._readyHandler);
        this._readyHandler = null;
      }
    }

    // ── Event-stream subscription ────────────────────────────────────────
    // Optional pairing with a sibling <wc-event-stream> for live updates.
    // The event stream is expected to emit step_change events with
    // CustomEvent.detail = { event: "snapshot"|"start"|"end", stack: [...] }
    // matching the /automate/events SSE payload contract from
    // node-playwright (Phase 2c of pilot-authoring evolution).

    _subscribeToEventStream() {
      const id = this.getAttribute('events-from');
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) {
        // Try again after document is more fully assembled — the event
        // stream element may be a later sibling not yet parsed.
        const self = this;
        setTimeout(function () {
          if (!self._eventStreamEl && self.isConnected) self._subscribeToEventStream();
        }, 50);
        return;
      }
      this._eventStreamEl = el;
      const self = this;
      this._stepChangeHandler = function (e) {
        const detail = e.detail || {};
        self.setActiveStack(Array.isArray(detail.stack) ? detail.stack : []);
      };
      el.addEventListener('wc-event-stream:step_change', this._stepChangeHandler);
    }

    _unsubscribeFromEventStream() {
      if (this._eventStreamEl && this._stepChangeHandler) {
        this._eventStreamEl.removeEventListener('wc-event-stream:step_change', this._stepChangeHandler);
      }
      this._eventStreamEl = null;
      this._stepChangeHandler = null;
    }

    // ── Public API ───────────────────────────────────────────────────────

    /**
     * Highlight the row matching the given line (0-indexed). Used by
     * click-to-jump for an immediate visual confirmation. Pass null to
     * clear. NB: setActiveStack() is the richer runtime-driven path —
     * this is the simple "highlight one row by line" entry point.
     */
    setActiveLine(line) {
      this._activeLine = (typeof line === 'number') ? line : null;
      this._activeStack = []; // line-driven highlights take precedence over stack
      this._applyActiveRow();
    }

    /**
     * Set the runtime step stack — typically pumped in from a paired
     * wc-event-stream subscribed to /automate/events. Stack shape:
     *   [{ name, type, iteration, started_at? }, ...]
     * outermost first.
     *
     * Resolution against the parsed editor tree walks the stack from
     * depth 0; for each frame, the first parsed range with matching
     * name AND matching depth AND inside the previously-matched parent
     * range becomes the match for that level. The DEEPEST matched range
     * is highlighted as `is-active`; all matched ranges get an
     * iteration badge if their stack frame's iteration > 1.
     *
     * Passing an empty stack clears the active highlight (the runtime
     * is between steps or the run ended).
     */
    setActiveStack(stack) {
      this._activeStack = Array.isArray(stack) ? stack.slice() : [];
      this._activeLine = null; // stack overrides line-only state
      // Re-render — outline rows need iteration badges updated.
      this._render();
    }

    // ── Stack ↔ ranges matching ──────────────────────────────────────────

    _matchStackToRanges(stack, ranges) {
      const matched = [];
      let parent = null;
      for (let i = 0; i < stack.length; i++) {
        const frame = stack[i];
        let found = null;
        for (let j = 0; j < ranges.length; j++) {
          const r = ranges[j];
          if (r.depth !== i) continue;
          if (r.name !== frame.name) continue;
          if (parent) {
            if (r.startLine < parent.startLine || r.endLine > parent.endLine) continue;
          }
          found = r;
          break;
        }
        matched.push(found);
        if (!found) break;
        parent = found;
      }
      return matched;
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
        this._currentRanges = [];
        return;
      }

      let ranges = [];
      if (typeof this._targetWcEl.parseStepBandRanges === 'function') {
        ranges = this._targetWcEl.parseStepBandRanges(this._targetEditor.getValue());
      }
      this._currentRanges = ranges;

      // Compute per-range iteration counts from the active stack so each
      // row's label can show e.g. "[3]" when the runtime is on the 3rd
      // iteration of that step.
      const matched = this._matchStackToRanges(this._activeStack || [], ranges);
      const iterationByLine = {};
      for (let i = 0; i < matched.length; i++) {
        const m = matched[i];
        if (m && this._activeStack[i]) {
          iterationByLine[m.startLine] = this._activeStack[i].iteration || 1;
        }
      }
      // The DEEPEST matched range is the currently-active step.
      let activeLine = null;
      for (let i = matched.length - 1; i >= 0; i--) {
        if (matched[i]) { activeLine = matched[i].startLine; break; }
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

        // Iteration badge — visible only when the runtime stack is on a
        // 2nd+ iteration of this step. Hidden otherwise to keep the
        // outline visually quiet on plain (non-loop) runs.
        const iter = iterationByLine[r.startLine];
        if (typeof iter === 'number' && iter > 1) {
          const badge = document.createElement('span');
          badge.className = 'wc-step-outline-iter';
          badge.textContent = '×' + iter;
          row.appendChild(badge);
        }

        // Line-only click path stores the line in _activeLine for
        // setActiveLine; we let setActiveLine handle the highlight.
        row.addEventListener('click', function () {
          self._jumpToLine(r.startLine);
        });

        frag.appendChild(row);
      }

      root.innerHTML = '';
      root.appendChild(frag);

      // Apply runtime-driven active state from the stack, OR
      // line-only state from setActiveLine (clicks).
      const lineToHighlight = (activeLine != null) ? activeLine
                            : (this._activeLine != null) ? this._activeLine
                            : null;
      this._applyActiveHighlight(lineToHighlight);

      // Mirror the active step into the gutter as well — the editor's
      // bands get an `is-active` glow on the matching line range so the
      // user sees the same step highlighted in both the outline and the
      // code area. The deepest matched range is the source of truth.
      if (this._targetWcEl && typeof this._targetWcEl.setActiveStepRange === 'function') {
        let activeRange = null;
        for (let i = matched.length - 1; i >= 0; i--) {
          if (matched[i]) { activeRange = matched[i]; break; }
        }
        if (activeRange) {
          this._targetWcEl.setActiveStepRange(activeRange.startLine, activeRange.endLine);
        } else if (this._activeLine != null) {
          // Click-driven highlight — find a range starting on this line.
          const click = ranges.find(function (r) { return r.startLine === self._activeLine; });
          if (click) this._targetWcEl.setActiveStepRange(click.startLine, click.endLine);
          else this._targetWcEl.setActiveStepRange(null);
        } else {
          this._targetWcEl.setActiveStepRange(null);
        }
      }
    }

    _applyActiveHighlight(line) {
      const rows = this.componentElement.querySelectorAll('.wc-step-outline-row');
      const target = (line == null) ? '' : String(line);
      let activated = null;
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].dataset.line === target) {
          rows[i].classList.add('is-active');
          activated = rows[i];
        } else {
          rows[i].classList.remove('is-active');
          rows[i].classList.remove('is-active-flash');
        }
      }
      // Flash only on TRANSITION — when the active line changes from
      // the previous one. Steady-state (same step still running) gets
      // the solid highlight without re-flashing.
      if (activated && line !== this._lastActiveLine) {
        activated.classList.add('is-active-flash');
        clearTimeout(this._flashTimer);
        const self = this;
        this._flashTimer = setTimeout(function () {
          activated.classList.remove('is-active-flash');
        }, 250);
      }
      this._lastActiveLine = line;
    }

    // Backwards-compat shim — used by older render path. The new
    // _applyActiveHighlight() takes the line as an argument instead.
    _applyActiveRow() {
      this._applyActiveHighlight(this._activeLine);
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
