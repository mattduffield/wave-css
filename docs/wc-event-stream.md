# WC-Event-Stream Web Component

A thin declarative wrapper around the browser `EventSource` (Server-Sent Events) API. It opens a stream from `src`, re-dispatches each named event as a `CustomEvent` on the element, and optionally applies live "run-state" DOM bindings to slotted children.

> Related: ./wc-websocket.md for the WebSocket equivalent.

## Features

- Opens/closes an `EventSource` from the `src` attribute (lifecycle-managed)
- Re-dispatches every named stream event as `wc-event-stream:<eventName>` with the parsed JSON payload in `detail`
- Relies on the browser's built-in `EventSource` reconnect (no custom retry layer)
- `mode="run-state"` — declarative `data-*` bindings that apply snapshot/delta/complete payloads to slotted DOM (text, attributes, counts, pulse, show/hide)
- Cold-recovery HTMX reload if the connection never succeeds within 10s
- No visual footprint (inert hidden element)

## Basic Usage

```html
<wc-event-stream id="run-events"
  src="/automate/events?run_id=abc123"
  events="step_change,run_complete"></wc-event-stream>

<script>
  document.getElementById('run-events')
    .addEventListener('wc-event-stream:step_change', e => {
      console.log(e.detail); // parsed JSON payload
    });
</script>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `src` | — | Required. `EventSource` URL. Changing it closes the prior stream and opens a new one. |
| `events` | — | Comma-separated list of event types to subscribe to. If omitted, subscribes to the default `message` event plus anything added via `setSubscribedEvents()`. |
| `mode` | — | Set to `run-state` to enable declarative snapshot/delta/complete DOM bindings (auto-subscribes to `run_update` and `not_found`). |
| `scope` | parent element | CSS selector limiting the DOM walk for run-state bindings. Defaults to the component's parent element. |
| `reload-on-error` | — | CSS selector; if the stream stays in error state >10s before any successful event, fires the `reload-trigger-event` on this selector via HTMX (cold recovery). |
| `reload-target` | — | CSS selector; on a `complete` run-state event, fires `reload-trigger-event` here (re-render the panel). |
| `reload-trigger-event` | — | HTMX event name fired on `reload-on-error` / `reload-target`. |

## Events

All events bubble and are composed. Emitted on the element.

| Event | Detail | Fires when |
|-------|--------|-----------|
| `wc-event-stream:open` | `{ src }` | `EventSource` transitioned to OPEN |
| `wc-event-stream:error` | `{ readyState, src }` | `EventSource` errored (browser will retry) |
| `wc-event-stream:close` | `{}` | `close()` was called |
| `wc-event-stream:message` | parsed payload | Default `message` channel event arrived |
| `wc-event-stream:<eventName>` | parsed payload | A named stream event in `events` arrived (raw string if not JSON) |
| `wc-event-stream:run-update` | `{ event, run_id, fields, ts }` | run-state mode: any snapshot/delta/complete |

## Methods

| Method | Description |
|--------|-------------|
| `open()` | Open the `EventSource` against the current `src` (no-op if already open). |
| `close()` | Close the `EventSource`; can be reopened with `open()`. |
| `setSubscribedEvents(list)` | Set the subscribed event-type list at runtime (array or comma string); re-binds listeners. |

The underlying `EventSource` is exposed as `this.source` for lower-level access.

## Run-state binding attributes

When `mode="run-state"`, elements within `scope` can carry:

| Attribute | Description |
|-----------|-------------|
| `data-bind-field="<path>"` | Bind text/value to a dot-path field. With `data-bind-attr="<attr>"` sets that attribute instead; on `wc-*` elements sets both `value` attribute and property. |
| `data-bind-status` | Mirrors the `status` field onto `dataset.status` (CSS hook). |
| `data-bind-count="<field>"` | Sets textContent to a numeric count; optional `data-pulse-attr` / `data-pulse-class` toggle when count > 0. |
| `data-pulse-when-field="<field>"` | Toggle `data-pulse-attr` / `data-pulse-class` when field > 0 WITHOUT touching textContent (for icons). |
| `data-show-when-field="<path>"` | Toggle visibility. `data-show-when-op` = `set`/`unset`/`eq`/`neq`/`gt`/`lt`/`gte`/`lte`/`in`/`nin` (default `set`); `data-show-when-value` supplies the comparand (`in`/`nin` use a pipe-separated list). |

## Examples

```html
<!-- Live run-detail panel with declarative bindings -->
<div id="run-detail">
  <span data-bind-field="status" data-bind-status></span>
  <span data-bind-count="error_count" data-pulse-class="pulsing"></span>
  <div data-show-when-field="status" data-show-when-op="in"
       data-show-when-value="Run complete!|failed|terminated">Done</div>
</div>

<wc-event-stream
  mode="run-state"
  scope="#run-detail"
  src="/automate/events?run_id=abc123"
  reload-target="#run-detail"
  reload-trigger-event="refresh"></wc-event-stream>
```

## Notes

- Payloads are `JSON.parse`d; a non-JSON body is delivered as the raw string.
- In run-state mode, a `not_found` event closes the stream and clears `src` (no auto-resurrection) so the browser stops reconnecting to a dead run.
- Auto-reconnect is the browser's native `EventSource` behavior; this component does not add its own backoff (unlike `wc-websocket`).
