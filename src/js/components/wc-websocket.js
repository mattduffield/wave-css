/**
 * Name: wc-websocket
 * Usage:
 *   <wc-websocket
 *     src="/ws/litwall_wall?panel_id=A&token=abc"
 *     auto-reconnect
 *     reconnect-min-ms="500"
 *     reconnect-max-ms="8000"
 *     reload-on-error="#wall-state-pane"
 *     log-prefix="[litwall]">
 *   </wc-websocket>
 *
 * Consumers attach listeners:
 *   el.addEventListener('wc-ws:message', e => console.log(e.detail.msg));
 *   el.addEventListener('wc-ws:t:touch', e => console.log(e.detail.msg));
 *
 * Hyperscript:
 *   _="on wc-ws:t:score_update(msg) set #score's textContent to msg.score end"
 *
 * Description:
 *   Declarative WebSocket wrapper. Opens a WS connection from `src`,
 *   dispatches inbound messages as CustomEvents, handles reconnect with
 *   exponential backoff, client-side ping/pong keepalive, stale detection,
 *   and clean teardown on HTMX swap-out.
 *
 * Attributes:
 *   - src: WebSocket URL (relative OK — auto-derives ws/wss from page protocol)
 *   - auto-reconnect: (boolean, default true) reconnect on unexpected close
 *   - reconnect-min-ms: (int, default 500) min backoff delay
 *   - reconnect-max-ms: (int, default 8000) max backoff delay
 *   - connect-on-load: (boolean, default true) connect immediately on attach
 *   - max-reconnect-attempts: (int, default 0 = unlimited)
 *   - reload-on-error: CSS selector — trigger HTMX reload after give-up
 *   - log-prefix: string prefix for console logs
 *   - ping-interval-ms: (int, default 25000) client keepalive interval; 0 to disable
 *   - parse-json: (boolean, default true) auto-parse JSON messages
 *   - notify-on-stale: (boolean) show wc.Notify warning after N failed reconnects
 *
 * Events (all bubble):
 *   - wc-ws:open        — socket connected
 *   - wc-ws:close       — socket closed { code, reason, wasClean }
 *   - wc-ws:error       — error { phase, err }
 *   - wc-ws:reconnecting — before reconnect { attempt, delay }
 *   - wc-ws:message     — inbound message { msg }
 *   - wc-ws:t:<type>    — per-type event when msg has `t` field { msg }
 *   - wc-ws:gave-up     — after max-reconnect-attempts { attempts }
 *
 * Methods:
 *   - send(obj)       — JSON.stringify + write; returns boolean
 *   - sendRaw(str)    — write raw string; returns boolean
 *   - connect()       — manual connect
 *   - close(reason)   — close with optional reason
 *   - reconnect()     — force reconnect now
 *   - isOpen()        — readyState === OPEN
 *   - isClosing()     — readyState === CLOSING
 *
 * Slotted bindings:
 *   - data-on="wc-ws:t:score_update" — event to react to
 *   - data-bind="msg.score" — set textContent from expression
 *   - data-show-when="msg.event === 'started'" — show element
 *   - data-hide-when="msg.event === 'ended'" — hide element
 */

if (!customElements.get('wc-websocket')) {
  class WcWebSocket extends HTMLElement {
    constructor() {
      super();
      this._ws = null;
      this._reconnectAttempt = 0;
      this._reconnectTimer = null;
      this._pingTimer = null;
      this._staleTimer = null;
      this._lastMessageTime = 0;
      this._intentionalClose = false;
      this._disposed = false;

      // Hidden element — no visual footprint
      this.style.display = 'none';
    }

    connectedCallback() {
      this._disposed = false;
      const connectOnLoad = !this.hasAttribute('connect-on-load') || this.getAttribute('connect-on-load') !== 'false';
      if (connectOnLoad && this.getAttribute('src')) {
        this.connect();
      }

      // HTMX cleanup listener
      this._htmxCleanup = (e) => {
        if (e.target === this || this.contains(e.target)) {
          this._dispose();
        }
      };
      document.body.addEventListener('htmx:beforeCleanupElement', this._htmxCleanup);

      // Tab visibility — verify connection on return
      this._visibilityHandler = () => {
        if (document.visibilityState === 'visible' && this._ws) {
          if (this._ws.readyState !== WebSocket.OPEN && this._ws.readyState !== WebSocket.CONNECTING) {
            this._log('Tab visible, socket not open — reconnecting');
            this._scheduleReconnect();
          }
        }
      };
      document.addEventListener('visibilitychange', this._visibilityHandler);
    }

    disconnectedCallback() {
      this._dispose();
    }

    // ── Public API ────────────────────────────────────────────────────────

    connect() {
      if (this._ws && (this._ws.readyState === WebSocket.OPEN || this._ws.readyState === WebSocket.CONNECTING)) {
        return;
      }
      this._intentionalClose = false;
      this._openSocket();
    }

    close(reason) {
      this._intentionalClose = true;
      this._clearTimers();
      if (this._ws) {
        try { this._ws.close(1000, reason || 'client close'); } catch (_) {}
        this._ws = null;
      }
    }

    reconnect() {
      this.close('reconnect');
      this._intentionalClose = false;
      this._reconnectAttempt = 0;
      this._openSocket();
    }

    send(obj) {
      if (!this.isOpen()) return false;
      try {
        this._ws.send(JSON.stringify(obj));
        return true;
      } catch (e) {
        this._dispatch('wc-ws:error', { phase: 'send', err: e.message });
        return false;
      }
    }

    sendRaw(str) {
      if (!this.isOpen()) return false;
      try {
        this._ws.send(str);
        return true;
      } catch (e) {
        this._dispatch('wc-ws:error', { phase: 'send', err: e.message });
        return false;
      }
    }

    isOpen() {
      return this._ws && this._ws.readyState === WebSocket.OPEN;
    }

    isClosing() {
      return this._ws && this._ws.readyState === WebSocket.CLOSING;
    }

    // ── Internal: socket lifecycle ────────────────────────────────────────

    _openSocket() {
      const src = this.getAttribute('src');
      if (!src) return;

      // Derive ws/wss from page protocol
      let url;
      if (src.startsWith('ws://') || src.startsWith('wss://')) {
        url = src;
      } else {
        const proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
        url = proto + '//' + location.host + (src.startsWith('/') ? '' : '/') + src;
      }

      const subprotocol = this.getAttribute('subprotocol') || '';
      try {
        this._ws = subprotocol ? new WebSocket(url, subprotocol) : new WebSocket(url);
      } catch (e) {
        this._dispatch('wc-ws:error', { phase: 'connect', err: e.message });
        this._scheduleReconnect();
        return;
      }

      const self = this;

      this._ws.onopen = function () {
        self._reconnectAttempt = 0;
        self._lastMessageTime = Date.now();
        self._log('connected');
        self._dispatch('wc-ws:open', {});
        self._startPing();
        self._startStaleDetection();
      };

      this._ws.onclose = function (e) {
        self._clearTimers();
        self._log('closed', e.code, e.reason);
        self._dispatch('wc-ws:close', {
          code: e.code,
          reason: e.reason,
          wasClean: e.wasClean,
        });
        if (!self._intentionalClose && !self._disposed) {
          self._scheduleReconnect();
        }
      };

      this._ws.onerror = function (e) {
        self._dispatch('wc-ws:error', { phase: 'connect', err: 'WebSocket error' });
      };

      this._ws.onmessage = function (e) {
        self._lastMessageTime = Date.now();
        self._resetStaleDetection();

        const parseJson = !self.hasAttribute('parse-json') || self.getAttribute('parse-json') !== 'false';
        let msg = e.data;

        if (parseJson) {
          try {
            msg = JSON.parse(e.data);
          } catch (parseErr) {
            self._dispatch('wc-ws:error', { phase: 'parse', err: parseErr.message });
            // Still dispatch as raw string
            self._dispatch('wc-ws:message', { msg: e.data });
            self._applySlottedBindings('wc-ws:message', e.data);
            return;
          }
        }

        // Generic message event
        self._dispatch('wc-ws:message', { msg });
        self._applySlottedBindings('wc-ws:message', msg);

        // Per-type event when msg has a `t` field
        if (msg && typeof msg === 'object' && msg.t) {
          const typedEvent = 'wc-ws:t:' + msg.t;
          self._dispatch(typedEvent, { msg });
          self._applySlottedBindings(typedEvent, msg);
        }
      };
    }

    // ── Internal: reconnect ───────────────────────────────────────────────

    _shouldReconnect() {
      if (this._disposed) return false;
      if (this._intentionalClose) return false;
      if (this.hasAttribute('auto-reconnect') && this.getAttribute('auto-reconnect') === 'false') return false;
      // Default is auto-reconnect=true (attribute absent or present without value)
      return true;
    }

    _scheduleReconnect() {
      if (!this._shouldReconnect()) return;

      const maxAttempts = parseInt(this.getAttribute('max-reconnect-attempts') || '0', 10);
      if (maxAttempts > 0 && this._reconnectAttempt >= maxAttempts) {
        this._log('gave up after', this._reconnectAttempt, 'attempts');
        this._dispatch('wc-ws:gave-up', { attempts: this._reconnectAttempt });
        this._triggerReloadOnError();

        if (this.hasAttribute('notify-on-stale') && window.wc?.Prompt) {
          wc.Prompt.toast({ title: 'Connection lost', icon: 'warning' });
        }
        return;
      }

      const minMs = parseInt(this.getAttribute('reconnect-min-ms') || '500', 10);
      const maxMs = parseInt(this.getAttribute('reconnect-max-ms') || '8000', 10);
      const delay = Math.min(maxMs, minMs * Math.pow(2, this._reconnectAttempt));
      this._reconnectAttempt++;

      this._log('reconnecting in', delay, 'ms (attempt', this._reconnectAttempt + ')');
      this._dispatch('wc-ws:reconnecting', {
        attempt: this._reconnectAttempt,
        delay,
      });

      this._reconnectTimer = setTimeout(() => {
        this._reconnectTimer = null;
        if (!this._disposed && !this._intentionalClose) {
          this._openSocket();
        }
      }, delay);
    }

    _triggerReloadOnError() {
      const selector = this.getAttribute('reload-on-error');
      if (!selector || typeof htmx === 'undefined') return;
      try {
        const target = document.querySelector(selector);
        if (target) {
          const hxGet = target.getAttribute('hx-get');
          if (hxGet) {
            htmx.ajax('GET', hxGet, { target, swap: 'innerHTML' });
          }
        }
      } catch (_) {}
    }

    // ── Internal: ping / stale detection ──────────────────────────────────

    _startPing() {
      this._clearPing();
      const interval = parseInt(this.getAttribute('ping-interval-ms') || '25000', 10);
      if (interval <= 0) return;

      this._pingTimer = setInterval(() => {
        if (this.isOpen()) {
          try { this._ws.send(JSON.stringify({ t: 'ping', ts: Date.now() })); } catch (_) {}
        }
      }, interval);
    }

    _clearPing() {
      if (this._pingTimer) {
        clearInterval(this._pingTimer);
        this._pingTimer = null;
      }
    }

    _startStaleDetection() {
      this._clearStaleDetection();
      const interval = parseInt(this.getAttribute('ping-interval-ms') || '25000', 10);
      if (interval <= 0) return;

      const threshold = interval * 2;
      this._staleTimer = setInterval(() => {
        if (Date.now() - this._lastMessageTime > threshold) {
          this._log('stale connection detected — reconnecting');
          this._clearTimers();
          if (this._ws) {
            try { this._ws.close(4000, 'stale'); } catch (_) {}
            this._ws = null;
          }
          this._scheduleReconnect();
        }
      }, interval);
    }

    _resetStaleDetection() {
      // Just update timestamp — the interval check uses _lastMessageTime
      this._lastMessageTime = Date.now();
    }

    _clearStaleDetection() {
      if (this._staleTimer) {
        clearInterval(this._staleTimer);
        this._staleTimer = null;
      }
    }

    // ── Internal: slotted bindings ────────────────────────────────────────

    _applySlottedBindings(eventName, msg) {
      const children = this.querySelectorAll('[data-on]');
      for (const child of children) {
        const on = child.getAttribute('data-on');
        if (on !== eventName) continue;

        // data-bind — set textContent from expression
        const bind = child.getAttribute('data-bind');
        if (bind) {
          try {
            const fn = new Function('msg', 'return ' + bind);
            child.textContent = fn(msg) ?? '';
          } catch (_) {}
        }

        // data-show-when — show if expression is truthy
        const showWhen = child.getAttribute('data-show-when');
        if (showWhen) {
          try {
            const fn = new Function('msg', 'return ' + showWhen);
            if (fn(msg)) {
              child.removeAttribute('hidden');
              child.style.removeProperty('display');
            } else {
              child.setAttribute('hidden', '');
              child.style.display = 'none';
            }
          } catch (_) {}
        }

        // data-hide-when — hide if expression is truthy
        const hideWhen = child.getAttribute('data-hide-when');
        if (hideWhen) {
          try {
            const fn = new Function('msg', 'return ' + hideWhen);
            if (fn(msg)) {
              child.setAttribute('hidden', '');
              child.style.display = 'none';
            } else {
              child.removeAttribute('hidden');
              child.style.removeProperty('display');
            }
          } catch (_) {}
        }
      }
    }

    // ── Internal: utilities ───────────────────────────────────────────────

    _dispatch(eventName, detail) {
      this.dispatchEvent(new CustomEvent(eventName, {
        bubbles: true,
        composed: true,
        detail,
      }));
    }

    _log(...args) {
      const prefix = this.getAttribute('log-prefix');
      if (prefix) {
        console.log(prefix, ...args);
      }
    }

    _clearTimers() {
      this._clearPing();
      this._clearStaleDetection();
      if (this._reconnectTimer) {
        clearTimeout(this._reconnectTimer);
        this._reconnectTimer = null;
      }
    }

    _dispose() {
      this._disposed = true;
      this._intentionalClose = true;
      this._clearTimers();
      if (this._ws) {
        try { this._ws.close(1000, 'disposed'); } catch (_) {}
        this._ws = null;
      }
      if (this._htmxCleanup) {
        document.body.removeEventListener('htmx:beforeCleanupElement', this._htmxCleanup);
      }
      if (this._visibilityHandler) {
        document.removeEventListener('visibilitychange', this._visibilityHandler);
      }
    }
  }

  customElements.define('wc-websocket', WcWebSocket);
}
