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
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-event-stream')) {
  class WcEventStream extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'src', 'events'];
    }

    static get is() {
      return 'wc-event-stream';
    }

    constructor() {
      super();
      this.source = null;
      this._listeners = []; // [{ name, fn }] so we can remove on close

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

      const self = this;
      es.onopen = function () {
        self._dispatch('wc-event-stream:open', { src: src });
      };
      es.onerror = function (e) {
        // Browser will attempt reconnect; surfacing the error lets
        // consumers show a "reconnecting" UI if they want.
        self._dispatch('wc-event-stream:error', {
          readyState: es.readyState,
          src: src,
        });
      };
      // Default "message" channel (events without an `event:` line).
      es.onmessage = function (msg) {
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
      return raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    }

    _bindNamedEvents() {
      if (!this.source) return;
      const self = this;
      this._listeners = [];
      const names = this._eventNames();
      for (let i = 0; i < names.length; i++) {
        const name = names[i];
        const fn = function (msg) {
          self._dispatch('wc-event-stream:' + name, self._parsePayload(msg.data));
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
  }

  customElements.define('wc-event-stream', WcEventStream);
}
