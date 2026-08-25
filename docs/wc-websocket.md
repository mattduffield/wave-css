# WC-Websocket Web Component

A declarative WebSocket wrapper. It opens a connection from `src`, dispatches inbound messages as `CustomEvent`s, handles reconnect with exponential backoff, client-side ping/pong keepalive, stale detection, and clean teardown on HTMX swap-out.

> Related: ./wc-event-stream.md for the Server-Sent Events (one-way) equivalent.

## Features

- Opens a WebSocket from `src` (relative URLs auto-derive `ws`/`wss` from the page protocol)
- Exponential-backoff auto-reconnect with configurable min/max delay and attempt cap
- Client ping keepalive and stale-connection detection (reconnect at 2× ping interval)
- Per-type events derived from an inbound message's `t` field
- Slotted `data-*` bindings for text/show/hide driven by messages
- HTMX swap-safe teardown and tab-visibility reconnect
- No visual footprint (`display: none`)

## Basic Usage

```html
<wc-websocket
  src="/ws/litwall_wall?panel_id=A&token=abc"
  auto-reconnect
  reconnect-min-ms="500"
  reconnect-max-ms="8000"
  reload-on-error="#wall-state-pane"
  log-prefix="[litwall]">
</wc-websocket>

<script>
  const el = document.querySelector('wc-websocket');
  el.addEventListener('wc-ws:message', e => console.log(e.detail.msg));
  el.addEventListener('wc-ws:t:touch', e => console.log(e.detail.msg));
</script>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `src` | — | WebSocket URL. Relative OK — `ws`/`wss` derived from the page protocol. |
| `auto-reconnect` | `true` | Reconnect on unexpected close. Set to `false` to disable. |
| `reconnect-min-ms` | `500` | Minimum backoff delay. |
| `reconnect-max-ms` | `8000` | Maximum backoff delay. |
| `connect-on-load` | `true` | Connect immediately on attach. Set to `false` to connect manually. |
| `max-reconnect-attempts` | `0` | Reconnect attempt cap (`0` = unlimited). |
| `reload-on-error` | — | CSS selector; after giving up, triggers an HTMX reload of the target's `hx-get`. |
| `log-prefix` | — | Console log prefix (logging is off unless set). |
| `ping-interval-ms` | `25000` | Client keepalive interval; `0` to disable (also disables stale detection). |
| `parse-json` | `true` | Auto-parse inbound JSON messages. Set to `false` for raw strings. |
| `subprotocol` | — | Optional WebSocket subprotocol. |
| `notify-on-stale` | — | When present, shows a `wc.Prompt` toast warning after giving up on reconnects. |

## Events

All events bubble and are composed. Emitted on the element.

| Event | Detail | Fires when |
|-------|--------|-----------|
| `wc-ws:open` | `{}` | Socket connected |
| `wc-ws:close` | `{ code, reason, wasClean }` | Socket closed |
| `wc-ws:error` | `{ phase, err }` | Error (`phase` = `connect`/`send`/`parse`) |
| `wc-ws:reconnecting` | `{ attempt, delay }` | Before a reconnect attempt |
| `wc-ws:message` | `{ msg }` | Inbound message (parsed object or raw string) |
| `wc-ws:t:<type>` | `{ msg }` | Inbound message whose `t` field equals `<type>` |
| `wc-ws:gave-up` | `{ attempts }` | After `max-reconnect-attempts` reached |

## Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `send(obj)` | `boolean` | `JSON.stringify` + send; `false` if socket not open. |
| `sendRaw(str)` | `boolean` | Send a raw string; `false` if socket not open. |
| `connect()` | — | Manual connect. |
| `close(reason)` | — | Close with an optional reason. |
| `reconnect()` | — | Force an immediate reconnect. |
| `isOpen()` | `boolean` | `readyState === OPEN`. |
| `isClosing()` | `boolean` | `readyState === CLOSING`. |

## Slotted bindings

Any descendant carrying `data-on="<eventName>"` reacts to that event:

| Attribute | Description |
|-----------|-------------|
| `data-bind="<expr>"` | Sets `textContent` from a JS expression over `msg`. |
| `data-show-when="<expr>"` | Shows the element when the expression is truthy. |
| `data-hide-when="<expr>"` | Hides the element when the expression is truthy. |

```html
<wc-websocket src="/ws/scoreboard">
  <span data-on="wc-ws:t:score_update" data-bind="msg.score">0</span>
  <div  data-on="wc-ws:t:state" data-show-when="msg.event === 'started'">Live</div>
</wc-websocket>
```

## Examples

```html
<!-- Hyperscript reacts to a typed message -->
<wc-websocket src="/ws/my_endpoint" log-prefix="[app]"
  _="on wc-ws:t:update(msg) set #status's textContent to msg.status end">
</wc-websocket>
```

```js
// Manual connection + send
const ws = document.querySelector('wc-websocket');
ws.connect();
ws.send({ t: 'join', room: 'lobby' });
```

## Notes

- The keepalive ping sends `{ t: 'ping', ts: <now> }`; stale detection reconnects if no message arrives within 2× the ping interval.
- On HTMX `htmx:beforeCleanupElement` (or disconnect) the socket and all timers/listeners are torn down cleanly.
- Returning to a visible tab verifies the socket and reconnects if it is not open/connecting.
