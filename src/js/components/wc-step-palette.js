/**
 * Name: wc-step-palette
 * Usage:
 *   <wc-step-palette for="script"></wc-step-palette>
 *
 * Description:
 *   Vertical column of 10 tiles, one per documented step type
 *   (nav/action/input/wait/loop/group/function/screen/instrument/alert).
 *   Click a tile to insert a `{% call step(name="", type="X") %}` skeleton
 *   at the cursor of a sibling wc-code-mirror. The new cursor lands inside
 *   the empty name="" so the author starts typing the step name
 *   immediately.
 *
 *   Companion to wc-step-outline. Both target the same wc-code-mirror via
 *   their `for=` attribute (matches the editor's `name`). Layout is
 *   typically a flex-row inside a wc-split-pane so palette + outline
 *   collapse together.
 *
 *   Phase 3 Round 1 of plan-pilot-authoring-evolution.md. Skeleton is
 *   generic at first (just toggles the type=); per-type smart stubs are
 *   a future enhancement.
 *
 * Attributes:
 *   - for: required. The `name` of the target wc-code-mirror. Resolution
 *          is document.querySelector('wc-code-mirror[name="<for>"]').
 *          The component waits for the editor to fire wccodemirrorready
 *          if it isn't initialized yet.
 *
 * Public API:
 *   - insert(type): inserts a step skeleton of the given type at the
 *     target editor's cursor. Useful for keyboard shortcuts or external
 *     drivers.
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-step-palette')) {

  // The 10 documented step types. Order chosen to put navigation /
  // interaction types at top (most common in authoring) and meta types
  // (instrument/alert) at the bottom. Label is the short tile caption.
  const STEP_TYPES = [
    { id: 'nav',        label: 'nav'    },
    { id: 'action',     label: 'action' },
    { id: 'input',      label: 'input'  },
    { id: 'wait',       label: 'wait'   },
    { id: 'loop',       label: 'loop'   },
    { id: 'group',      label: 'group'  },
    { id: 'function',   label: 'fn'     },
    { id: 'screen',     label: 'screen' },
    { id: 'instrument', label: 'inst'   },
    { id: 'alert',      label: 'alert'  },
  ];

  class WcStepPalette extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'for'];
    }

    static get is() {
      return 'wc-step-palette';
    }

    constructor() {
      super();
      this._targetEditor = null;
      this._readyHandler = null;

      const compEl = this.querySelector('.wc-step-palette');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-step-palette');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._installReadyListener();
      this._tryWireUp();
      this._render();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._readyHandler) {
        document.body.removeEventListener('wccodemirrorready', this._readyHandler);
        this._readyHandler = null;
      }
    }

    _handleAttributeChange(attrName, newValue, oldValue) {
      if (attrName === 'for') {
        this._targetEditor = null;
        this._tryWireUp();
      } else {
        super._handleAttributeChange(attrName, newValue, oldValue);
      }
    }

    // ── Editor wire-up ───────────────────────────────────────────────────

    _findScopeRoot() {
      return this.closest('wc-tab-item') || this.closest('form') || document;
    }

    _installReadyListener() {
      if (this._readyHandler) return;
      const self = this;
      this._readyHandler = function (e) {
        const targetName = self.getAttribute('for');
        if (!targetName) return;
        if (!e.detail || e.detail.name !== targetName) return;
        if (!e.detail.editor) return;
        // Verify the ready editor lives in our scope before binding —
        // otherwise multi-tab inserts go to the wrong editor.
        const ed = e.detail.editor;
        const wcEl = (typeof ed.getWrapperElement === 'function')
          ? ed.getWrapperElement().closest('wc-code-mirror')
          : null;
        const scope = self._findScopeRoot();
        if (scope !== document && wcEl && !scope.contains(wcEl)) return;
        self._targetEditor = ed;
      };
      document.body.addEventListener('wccodemirrorready', this._readyHandler);
    }

    _tryWireUp() {
      const targetName = this.getAttribute('for');
      if (!targetName) return;
      const scope = this._findScopeRoot();
      const wcEl = scope.querySelector('wc-code-mirror[name="' + targetName + '"]');
      if (wcEl && wcEl.editor) this._targetEditor = wcEl.editor;
    }

    // ── Public API ───────────────────────────────────────────────────────

    /**
     * Insert a step skeleton of the given type at the target editor's
     * cursor. Cursor lands inside the empty name="". Public so keyboard
     * shortcuts (Cmd-Shift-I for input, etc., a future enhancement) can
     * call directly.
     */
    insert(type) {
      const editor = this._resolveEditor();
      if (!editor) return false;
      const t = String(type || 'action').toLowerCase();
      const skeleton =
        '{% call step(name="", type="' + t + '") %}\n' +
        '  \n' +
        '{% endcall %}\n';
      const start = editor.getCursor();
      editor.replaceRange(skeleton, start);
      // 19 chars from the start of the skeleton lands between the empty
      // name="" quotes — see the literal above:
      //   {% call step(name="
      //   ^                  ^
      //   start.ch           start.ch + 19
      editor.setCursor({ line: start.line, ch: start.ch + 19 });
      editor.focus();
      return true;
    }

    // ── Resolve the live editor lazily, in case the cache went stale ─────

    _resolveEditor() {
      if (this._targetEditor) return this._targetEditor;
      this._tryWireUp();
      return this._targetEditor;
    }

    // ── Render ───────────────────────────────────────────────────────────

    _render() {
      const root = this.componentElement;
      root.innerHTML = '';
      const self = this;
      for (let i = 0; i < STEP_TYPES.length; i++) {
        const t = STEP_TYPES[i];
        const tile = document.createElement('button');
        tile.type = 'button';
        tile.className = 'wc-step-palette-tile wc-step-palette-tile-' + t.id;
        tile.dataset.type = t.id;
        tile.title = 'Insert ' + t.id + ' step at cursor';

        const dot = document.createElement('span');
        dot.className = 'wc-step-palette-dot';
        tile.appendChild(dot);

        const label = document.createElement('span');
        label.className = 'wc-step-palette-label';
        label.textContent = t.label;
        tile.appendChild(label);

        tile.addEventListener('click', function () {
          self.insert(t.id);
        });
        root.appendChild(tile);
      }
    }
  }

  customElements.define('wc-step-palette', WcStepPalette);
}
