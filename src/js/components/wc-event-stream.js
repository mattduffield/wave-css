/**
 * Name: wc-event-stream
 * Usage:
 *   <wc-event-stream id="run-events"
 *                    src="/automate/events?run_id=abc123"
 *                    events="step_change,run_complete"></wc-event-stream>
 *
 * Consumers attach listeners on the element:
 *   document.getElementById('run-events')
 *     .addEventListener('wc-event-stream:step_change', e => {
 *       console.log(e.detail); // parsed JSON payload
 *     });
 *
 * Description:
 *   Thin declarative wrapper around the browser EventSource API. Opens
 *   a server-sent event stream from `src`; each named event arriving on
 *   the stream is re-dispatched as a CustomEvent named
 *   `wc-event-stream:<eventName>` on this element, with the parsed JSON
 *   payload in CustomEvent.detail (raw string if not JSON-parseable).
 *
 *   Auto-reconnects on error via the browser's built-in EventSource
 *   reconnect — we don't layer our own retry policy on top.
 *
 *   Lifecycle:
 *     - connectedCallback: opens the stream when `src` is set
 *     - `src` attribute change: closes prior stream, opens new
 *     - disconnectedCallback: closes the stream
 *
 * Attributes:
 *   - src: required. EventSource URL.
 *   - events: optional comma-separated list of event types to subscribe.
 *             If omitted, the component subscribes to the default
 *             "message" event AND any other named events it's told about
 *             via setSubscribedEvents() at runtime.
 *
 * Special CustomEvents (always emitted regardless of `events`):
 *   - wc-event-stream:open       — EventSource readyState transitioned to OPEN
 *   - wc-event-stream:error      — EventSource errored (browser will retry)
 *   - wc-event-stream:close      — explicit close() called
 *
 * Lower-level escape hatch: this.source is the underlying EventSource.
 *
 * ───────────────────────────────────────────────────────────────────────
 *  mode="run-state" — declarative bindings for live run-detail panels
 * ───────────────────────────────────────────────────────────────────────
 *  When `mode="run-state"` is set, the component automatically subscribes
 *  to the `run_update` event (in addition to anything in `events=""`)
 *  and applies snapshot/delta/complete payloads to slotted DOM children
 *  via data-* binding attributes. This replaces the old HTMX-polling
 *  pattern on the Run Detail panel.
 *
 *  Run-state binding attributes (applied to any element in `scope`):
 *
 *   data-bind-field="<path>"
 *      Bind this element's text / value / attribute to the named field
 *      on the run record. `path` is a dot-separated path
 *      (e.g. "status", "setup.status", "elapsed_time").
 *      • If `data-bind-attr="<attr>"` is also present, the field's value
 *        becomes that attribute on the element.
 *      • If the element has a `value` property (wc-field, wc-input, etc.)
 *        the value attribute AND property are set.
 *      • Otherwise the textContent is replaced.
 *
 *   data-bind-status
 *      Mirrors the `status` field onto `dataset.status` for CSS hooks.
 *
 *   data-bind-count="<countField>"
 *      Bind the element's textContent to the numeric count. Use this on
 *      a span/div/text element — NOT on a wc-fa-icon (the icon's contents
 *      would be replaced with the number).
 *      Optional companions:
 *        data-pulse-attr="<attr>"   — set this attribute when count > 0
 *        data-pulse-class="<class>" — toggle this class when count > 0
 *
 *   data-pulse-when-field="<countField>"
 *      Just toggle attribute/class when the field is > 0, WITHOUT touching
 *      textContent. Use this on wc-fa-icons whose visual indication is the
 *      pulse animation, not a numeric badge.
 *      Required companion (one or both):
 *        data-pulse-attr="<attr>"   — set this attribute when count > 0
 *        data-pulse-class="<class>" — toggle this class when count > 0
 *
 *   data-show-when-field="<path>"
 *      Toggle the element's `hidden` attribute based on a condition.
 *      Optional companions:
 *        data-show-when-op="set|unset|eq|neq|gt|lt|gte|lte|in|nin"   default "set"
 *        data-show-when-value="<value>"
 *          - eq/neq/gt/lt/gte/lte: scalar
 *          - in/nin: pipe-separated list, e.g. "Run complete!|failed|terminated"
 *
 *  Custom event surface (in addition to existing wc-event-stream:* events):
 *
 *   wc-event-stream:run-update  — fires for every snapshot/delta/complete
 *     event.detail = { event: "snapshot"|"delta"|"complete",
 *                      run_id, fields, ts }
 *     Consumers can hook this for complex bindings (screenshot thumbnails,
 *     lifecycle phase subdocs) that aren't expressible with the data-bind-*
 *     declarations.
 *
 *  Reload behavior:
 *
 *   reload-on-error="<selector>"
 *      When the EventSource stays in error state for >10s (lost server),
 *      fire the named HTMX trigger event on the selector to re-render
 *      the panel via HTMX (cold-recovery). The component re-arms after
 *      each successful event.
 *
 *   reload-target="<selector>" + reload-trigger-event="<eventName>"
 *      When `complete` is received, fire the named event on the selector
 *      (typically the run-detail container). This lets the server re-render
 *      the button section (Run/Debug/Kill) for the new terminal state.
 *      Defaults: no auto-reload on complete (consumer must opt in).
 *
 *  scope="<selector>"
 *      Limits the DOM walk to the given selector (typically the run-detail
 *      container). Defaults to the component's parent element so each
 *      tabbed panel binds to its own scope without cross-talk.
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-event-stream')) {
  class WcEventStream extends WcBaseComponent {
    static get observedAttributes() {
      return [
        'id', 'src', 'events',
        // run-state mode + behavior knobs
        'mode', 'scope',
        'reload-on-error', 'reload-target', 'reload-trigger-event',
      ];
    }

    static get is() {
      return 'wc-event-stream';
    }

    constructor() {
      super();
      this.source = null;
      this._listeners = []; // [{ name, fn }] so we can remove on close
      // run-state mode internals
      this._errorReloadTimer = null;
      // Set true the first time we get a successful event (onopen OR named
      // event) on the current EventSource. Reset on close. Used to suppress
      // the reload-on-error timer for transient browser onerror calls that
      // happen during legitimate idle periods (e.g. paused pilot runs) —
      // we only want the cold-recovery reload if we NEVER had a working
      // connection.
      this._hadSuccessfulEvent = false;
      // Local mirror of the last snapshot fields so deltas can be merged
      // and counts compared (e.g. "count went from 0 to 1 → pulse").
      this._runState = {};

      // WcBaseComponent's default attribute handling (class, id, etc.)
      // expects this.componentElement to exist — without it we get a
      // null-setAttribute crash during _applyPendingAttributes. Use an
      // existing child with our class if present (live-designer scenario),
      // otherwise create a hidden inert div so the component has a body
      // but no visual footprint.
      const compEl = this.querySelector('.wc-event-stream');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-event-stream');
        this.componentElement.style.display = 'none';
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      if (this.getAttribute('src')) this.open();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._clearErrorReloadTimer();
      this.close();
    }

    _handleAttributeChange(attrName, newValue, oldValue) {
      if (attrName === 'src') {
        this.close();
        if (newValue) this.open();
      } else if (attrName === 'events') {
        // Re-bind named-event listeners against the new event list.
        if (this.source) {
          this._unbindNamedEvents();
          this._bindNamedEvents();
        }
      } else {
        super._handleAttributeChange(attrName, newValue, oldValue);
      }
    }

    /**
     * Open the EventSource against the current `src`. No-op if already open.
     */
    open() {
      if (this.source) return;
      const src = this.getAttribute('src');
      if (!src) return;

      const es = new EventSource(src);
      this.source = es;
      this._hadSuccessfulEvent = false;

      const self = this;
      es.onopen = function () {
        self._hadSuccessfulEvent = true;
        self._clearErrorReloadTimer();
        self._dispatch('wc-event-stream:open', { src: src });
      };
      es.onerror = function (e) {
        // Browser will attempt reconnect; surfacing the error lets
        // consumers show a "reconnecting" UI if they want.
        self._dispatch('wc-event-stream:error', {
          readyState: es.readyState,
          src: src,
        });
        // Cold-recovery path: ONLY arm if we've never had a successful
        // event on this connection. Once we've opened successfully and
        // started receiving data, transient onerror calls (e.g. the
        // browser closing an idle keepalive after the server's heartbeat
        // interval, or any other benign reconnect blip) MUST NOT fire
        // an HTMX reload — that would tear down a healthy panel during
        // a paused run with no events flowing.
        if (self._isRunStateMode() && !self._hadSuccessfulEvent) {
          self._armErrorReloadTimer();
        }
      };
      // Default "message" channel (events without an `event:` line).
      es.onmessage = function (msg) {
        self._hadSuccessfulEvent = true;
        self._clearErrorReloadTimer();
        self._dispatch('wc-event-stream:message', self._parsePayload(msg.data));
      };

      this._bindNamedEvents();
    }

    /**
     * Close the EventSource. Subsequent calls to open() can reopen it.
     */
    close() {
      if (!this.source) return;
      this._unbindNamedEvents();
      try { this.source.close(); } catch (_) {}
      this.source = null;
      this._hadSuccessfulEvent = false;
      this._dispatch('wc-event-stream:close', {});
    }

    /**
     * Set the subscribed event-type list at runtime (alternative to the
     * `events` attribute). Re-binds listeners against the new list.
     */
    setSubscribedEvents(list) {
      const names = Array.isArray(list) ? list.join(',') : String(list || '');
      this.setAttribute('events', names);
    }

    // ── Internals ─────────────────────────────────────────────────────────

    _eventNames() {
      const raw = this.getAttribute('events') || '';
      const list = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
      // In run-state mode, always subscribe to run_update so consumers
      // don't have to remember to include it in events="".
      if (this._isRunStateMode() && list.indexOf('run_update') === -1) {
        list.push('run_update');
      }
      return list;
    }

    _bindNamedEvents() {
      if (!this.source) return;
      const self = this;
      this._listeners = [];
      const names = this._eventNames();
      // run-state mode also subscribes to `not_found` so we can stop
      // EventSource auto-reconnect when the server reports the run is gone.
      // Without this the browser keeps reconnecting forever to a dead
      // run_id and the reload-on-error timer fires in a loop.
      if (this._isRunStateMode() && names.indexOf('not_found') === -1) {
        names.push('not_found');
      }
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const fn = function (msg) {
          self._hadSuccessfulEvent = true;
          self._clearErrorReloadTimer();
          const payload = self._parsePayload(msg.data);
          self._dispatch('wc-event-stream:' + name, payload);
          // run-state mode: intercept run_update events to merge state +
          // apply DOM bindings on top of the generic CustomEvent dispatch.
          if (name === 'run_update' && self._isRunStateMode()) {
            self._applyRunUpdate(payload);
          }
          // Server reports the run is gone — stop trying. Clear src so
          // the EventSource is torn down AND a subsequent `setAttribute
          // ('src', ...)` is required to reconnect (no auto-resurrection).
          if (name === 'not_found' && self._isRunStateMode()) {
            self._clearErrorReloadTimer();
            self.close();
            self.removeAttribute('src');
          }
        };
        this.source.addEventListener(name, fn);
        this._listeners.push({ name: name, fn: fn });
      }
    }

    _unbindNamedEvents() {
      if (!this.source) return;
      for (let i = 0; i < this._listeners.length; i++) {
        try { this.source.removeEventListener(this._listeners[i].name, this._listeners[i].fn); }
        catch (_) {}
      }
      this._listeners = [];
    }

    _parsePayload(raw) {
      if (raw == null) return null;
      try { return JSON.parse(raw); }
      catch (_) { return raw; }
    }

    _dispatch(eventName, detail) {
      this.dispatchEvent(new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail: detail,
      }));
    }

    // ── Run-state mode ────────────────────────────────────────────────────

    _isRunStateMode() {
      return this.getAttribute('mode') === 'run-state';
    }

    _scopeRoot() {
      const sel = this.getAttribute('scope');
      if (sel) {
        const found = document.querySelector(sel);
        if (found) return found;
      }
      // Default: walk from the component's parent so a tabbed Studio with
      // multiple panels keeps bindings scoped to their own subtree.
      return this.parentElement || document;
    }

    _applyRunUpdate(payload) {
      if (!payload || typeof payload !== 'object') return;
      const fields = payload.fields || {};
      const kind = payload.event;

      // Snapshot replaces the local mirror entirely so deltas merging on top
      // are anchored to known truth (count-pulse comparisons in particular).
      if (kind === 'snapshot') {
        this._runState = Object.assign({}, fields);
      } else if (kind === 'delta' || kind === 'complete') {
        // Merge fields:
        //   • *_appended aliases — consumed as event hooks, not stored.
        //   • dotted keys (e.g. "data.bill_plan") — walk into the nested
        //     mirror and set just that leaf, preserving siblings. This is
        //     what makes customer-specific bindings auto-work: the server
        //     emits whatever propName the pilot script writes via
        //     setProp/setObjectId, and the client merges it deep without
        //     a hardcoded field list.
        //   • flat keys — assign at top level (matches snapshot replace).
        for (const k of Object.keys(fields)) {
          if (k.endsWith('_appended')) continue;
          if (k.indexOf('.') >= 0) {
            this._setPath(this._runState, k, fields[k]);
          } else {
            this._runState[k] = fields[k];
          }
        }
      }

      // High-level event for consumers (screenshots, lifecycle subdocs,
      // anything not expressible declaratively).
      this._dispatch('wc-event-stream:run-update', payload);

      // Apply DOM bindings against the merged mirror.
      this._applyDomBindings(fields);

      // Terminal handling: optionally re-render the panel so the server-
      // rendered button section reflects the final status.
      if (kind === 'complete') {
        const target = this.getAttribute('reload-target');
        const evt = this.getAttribute('reload-trigger-event');
        if (target && evt && window.htmx) {
          try { window.htmx.trigger(target, evt); } catch (_) {}
        }
        // Final close; the server already res.end()'d, but be explicit so
        // the browser doesn't try to reconnect.
        this.close();
      }
    }

    // Walk the scope subtree and apply each declarative binding kind.
    // `fields` is the payload's fields object — used for *_appended sub-
    // events that aren't reflected in the mirror.
    _applyDomBindings(fields) {
      const root = this._scopeRoot();
      if (!root || !root.querySelectorAll) return;

      // data-bind-field — scalar value display
      const bindFieldEls = root.querySelectorAll('[data-bind-field]');
      for (let i = 0; i < bindFieldEls.length; i++) {
        this._applyBindField(bindFieldEls[i]);
      }

      // data-bind-status — mirror status onto dataset.status (CSS hook)
      const statusEls = root.querySelectorAll('[data-bind-status]');
      for (let i = 0; i < statusEls.length; i++) {
        if (this._runState.status != null) {
          statusEls[i].dataset.status = String(this._runState.status);
        }
      }

      // data-bind-count — number badges with optional pulse-when-gt-0
      const countEls = root.querySelectorAll('[data-bind-count]');
      for (let i = 0; i < countEls.length; i++) {
        this._applyBindCount(countEls[i]);
      }

      // data-pulse-when-field — pulse attribute/class toggle WITHOUT
      // touching textContent (for icons whose UI cue is the pulse).
      const pulseEls = root.querySelectorAll('[data-pulse-when-field]');
      for (let i = 0; i < pulseEls.length; i++) {
        this._applyPulseWhen(pulseEls[i]);
      }

      // data-show-when-field — visibility toggles
      const showEls = root.querySelectorAll('[data-show-when-field]');
      for (let i = 0; i < showEls.length; i++) {
        this._applyShowWhen(showEls[i]);
      }
    }

    _readPath(obj, path) {
      if (obj == null) return undefined;
      const parts = String(path).split('.');
      let cur = obj;
      for (let i = 0; i < parts.length; i++) {
        if (cur == null) return undefined;
        cur = cur[parts[i]];
      }
      return cur;
    }

    // Walk a dotted path, creating intermediate objects as needed, and set
    // the leaf to `value`. Counterpart to _readPath. Used by the delta merge
    // so a server emit of `{"data.bill_plan": "12-Pay"}` lands as
    // `_runState.data.bill_plan = "12-Pay"` without clobbering siblings.
    _setPath(obj, path, value) {
      if (obj == null) return;
      const parts = String(path).split('.');
      let cur = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const k = parts[i];
        if (cur[k] == null || typeof cur[k] !== 'object') {
          cur[k] = {};
        }
        cur = cur[k];
      }
      cur[parts[parts.length - 1]] = value;
    }

    _applyBindField(el) {
      const path = el.getAttribute('data-bind-field');
      if (!path) return;
      const value = this._readPath(this._runState, path);
      const attr = el.getAttribute('data-bind-attr');
      if (attr) {
        if (value == null || value === '') el.removeAttribute(attr);
        else el.setAttribute(attr, String(value));
        return;
      }
      // wc-field / wc-input style: prefer setting `value` attribute AND
      // property so both the rendered DOM and the component state stay
      // in sync.
      if (el.tagName && el.tagName.toLowerCase().indexOf('wc-') === 0) {
        if (value == null) el.setAttribute('value', '');
        else el.setAttribute('value', String(value));
        try { el.value = (value == null ? '' : value); } catch (_) {}
        return;
      }
      el.textContent = (value == null ? '' : String(value));
    }

    _applyBindCount(el) {
      const path = el.getAttribute('data-bind-count');
      if (!path) return;
      const value = Number(this._readPath(this._runState, path) || 0);
      el.textContent = String(value);
      const pulseAttr = el.getAttribute('data-pulse-attr');
      const pulseClass = el.getAttribute('data-pulse-class');
      const shouldPulse = value > 0;
      if (pulseAttr) {
        if (shouldPulse) el.setAttribute(pulseAttr, '');
        else el.removeAttribute(pulseAttr);
      }
      if (pulseClass) {
        if (shouldPulse) el.classList.add(pulseClass);
        else el.classList.remove(pulseClass);
      }
    }

    _applyPulseWhen(el) {
      const path = el.getAttribute('data-pulse-when-field');
      if (!path) return;
      const value = Number(this._readPath(this._runState, path) || 0);
      const pulseAttr = el.getAttribute('data-pulse-attr');
      const pulseClass = el.getAttribute('data-pulse-class');
      const shouldPulse = value > 0;
      if (pulseAttr) {
        if (shouldPulse) el.setAttribute(pulseAttr, '');
        else el.removeAttribute(pulseAttr);
      }
      if (pulseClass) {
        if (shouldPulse) el.classList.add(pulseClass);
        else el.classList.remove(pulseClass);
      }
    }

    _applyShowWhen(el) {
      const path = el.getAttribute('data-show-when-field');
      if (!path) return;
      const op = (el.getAttribute('data-show-when-op') || 'set').toLowerCase();
      const value = this._readPath(this._runState, path);
      const cmp = el.getAttribute('data-show-when-value');
      let show;
      switch (op) {
        case 'set':   show = value != null && value !== ''; break;
        case 'unset': show = value == null || value === '';  break;
        case 'eq':    show = String(value) === String(cmp);  break;
        case 'neq':   show = String(value) !== String(cmp);  break;
        case 'gt':    show = Number(value) >  Number(cmp);   break;
        case 'gte':   show = Number(value) >= Number(cmp);   break;
        case 'lt':    show = Number(value) <  Number(cmp);   break;
        case 'lte':   show = Number(value) <= Number(cmp);   break;
        case 'in': {
          const list = String(cmp || '').split('|');
          show = list.indexOf(String(value)) >= 0;
          break;
        }
        case 'nin': {
          const list = String(cmp || '').split('|');
          show = list.indexOf(String(value)) < 0;
          break;
        }
        default:      show = value != null && value !== '';  break;
      }
      // Use inline `display: none` because attribute [hidden] has lower CSS
      // specificity than a class selector (e.g. Tailwind `.flex`), so an
      // element with `class="flex" hidden` still renders. Inline style wins.
      if (show) {
        el.removeAttribute('hidden');
        el.style.removeProperty('display');
      } else {
        el.setAttribute('hidden', '');
        el.style.display = 'none';
      }
    }

    // ── Error-reload defense ──────────────────────────────────────────────
    // EventSource auto-reconnects on transient drops. If the server stays
    // unreachable past the browser's retry interval (or the run record was
    // deleted), the panel can sit stale forever. Arm a one-shot HTMX
    // reload of the configured target if we don't see ANY successful
    // event for 10 seconds after first error.

    _armErrorReloadTimer() {
      if (this._errorReloadTimer) return;
      const target = this.getAttribute('reload-on-error');
      if (!target) return;
      const self = this;
      this._errorReloadTimer = setTimeout(function () {
        self._errorReloadTimer = null;
        const evt = self.getAttribute('reload-trigger-event');
        if (target && evt && window.htmx) {
          try { window.htmx.trigger(target, evt); } catch (_) {}
        }
      }, 10000);
    }

    _clearErrorReloadTimer() {
      if (this._errorReloadTimer) {
        clearTimeout(this._errorReloadTimer);
        this._errorReloadTimer = null;
      }
    }
  }

  customElements.define('wc-event-stream', WcEventStream);
}
