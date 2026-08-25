# WC-FX-Console Web Component

The MASTER console for a multi-zone FX board. It **never plays anything locally** — it remote-controls zones. Pick a zone, then its category-grouped pads (plus master volume and Stop All) SEND COMMANDs to that zone over a host-provided WebSocket.

> Related: ./wc-fx-board.md (the per-station player that executes commands and reports state).

## Features

- Zone selector; for the selected zone, the same grouped pads + master volume + Stop-All as the board — but each pad **sends a COMMAND** (never plays)
- Shows LIVE STATE from incoming STATE messages: a per-zone "playing" count (whole floor at a glance) plus a "now playing" chip list and pad highlights for the selected zone
- Requests state on zone select and on socket open
- No local playback, ever

## Basic Usage

```html
<wc-fx-console
    master-volume="80"
    zones='[{"id":"z1","name":"Main Hall","event_name":"main-hall",
             "categories":[{"name":"Crowd","icon":"users"}],
             "resources":[{"id":"a1","type":"audio","name":"Applause","category":"Crowd","file_url":"/fx/applause.mp3"}]}]'
    ws-url="/ws/fx_ws?role=master">
</wc-fx-console>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `zones` | `[]` | JSON `[{ id, name, event_name, resources:[…], categories?:[…] }]` |
| `master-volume` | `80` | Slider value for the selected zone, 0..100 |
| `ws-url` | — | Open a WebSocket the component drives |

## WebSocket Protocol

```text
COMMAND (master→zone): { type:"cmd", zone, action, resource_id?, value? }
  action ∈ "play" | "stop" | "stopAll" | "volume" | "background" | "requestState"
STATE   (zone→masters): { type:"state", zone, playing:[{id,type,is_background}], master_volume }
```

A zone's routing key is its `event_name` (falling back to `id`); `STATE.zone` is matched to it.

## Events

Events bubble and are composed. `wcfxconsolecommand` fires a lowercase canonical name and a legacy colon alias.

| Event (canonical / legacy) | Detail | Fires when |
|----------------------------|--------|------------|
| `wcfxconsolecommand` / `wc-fx-console:command` | `{ zone, action, resource_id, value }` | A pad/control sends a COMMAND |
| `message` | the outgoing protocol object | The component sends a protocol message (so a host can forward it) |

## Methods

| Method | Description |
|--------|-------------|
| `send(obj)` | Send an outgoing message (over the socket if open) AND dispatch a `message` event |
| `receive(json)` | Deliver an incoming message (object or JSON string); STATE updates the UI |
| `selectZone(idOrKey)` | Select a zone by id or routing key |

## Examples

Host-driven transport — forward commands out and feed state in:

```html
<wc-fx-console id="console"
    zones='[{"id":"z1","name":"Lobby","event_name":"lobby","resources":[{"id":"a1","type":"audio","name":"Chime","category":"UI","file_url":"/fx/chime.mp3"}]}]'>
</wc-fx-console>
<script>
  const el = document.getElementById('console');
  el.addEventListener('message', (e) => myTransport.send(e.detail));
  myTransport.onmessage = (msg) => el.receive(msg);
  el.addEventListener('wcfxconsolecommand', (e) => console.log('cmd', e.detail));
</script>
```

## Notes

- Uses Wave semantic tokens only; active states use `--primary-bg-color` + the `--wc-on-primary` auto-contrast token. CSS is scoped in `@layer wc.usage`; no third-party deps.
- Reflects `zones` changes.
- Verified in `tests/fx-board-test.py`; demoed in `views/fx-board.html`.
