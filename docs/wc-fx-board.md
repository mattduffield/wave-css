# WC-FX-Board Web Component

A per-station player for a multi-zone sound/vision board. It renders category-grouped pads from a typed resource list and plays audio/video **locally** on the station device.

> Related: ./wc-fx-console.md (the master console that remote-controls zones).

## Features

- Category-grouped pads driven by a JSON resource list
- **Audio** effects overlap/retrigger (a fresh element per trigger); **video** plays into a single inline surface
- **Background is exclusive** — a new background stops the previous one and honors `loop`; a background pad toggles off when re-clicked
- Effective volume = `master(0..1) × resource.volume`; the master slider live-adjusts playing media
- Optional keyboard shortcuts (number keys 1..9 or a resource's `shortcut_key`)
- Optional `controllable` mode: executes remote COMMANDs for its `zone` and emits STATE on change
- `type:"light"` pads are reserved (rendered as a disabled "coming soon" pad)
- Fail-soft on a bad `file_url` (pad → error state)

## Basic Usage

```html
<wc-fx-board
    zone="main-hall" controllable show-shortcuts
    master-volume="80" columns="4"
    resources='[{"id":"a1","type":"audio","name":"Applause","category":"Crowd","file_url":"/fx/applause.mp3","volume":0.9,"loop":false,"is_background":false,"shortcut_key":"1","order":0}]'
    categories='[{"name":"Crowd","icon":"users","color":"#3b82f6"}]'
    ws-url="/ws/fx_ws?role=station&zone=main-hall">
</wc-fx-board>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `resources` | `[]` | JSON array of resource objects (required) |
| `categories` | — | Optional JSON `[{ name, icon, color }]` for group order/label/accent |
| `master-volume` | `80` | Master volume, 0..100 |
| `show-shortcuts` | (absent) | Boolean; assign number keys 1..9 to the first nine pads |
| `zone` | — | This station's zone id (matched against `COMMAND.zone`) |
| `controllable` | (absent) | Boolean; execute remote COMMANDs for this zone + emit STATE on change |
| `columns` | — | Fixed pad columns per group (else responsive auto-fill) |
| `ws-url` | — | Open a WebSocket the component drives |

## Resource Shape

```json
{ "id": "a1", "type": "audio", "name": "Applause", "category": "Crowd",
  "file_url": "/fx/applause.mp3", "shortcut_key": "1", "volume": 0.9,
  "loop": false, "is_background": false, "order": 0 }
```

`type` is `audio` | `video` | `light` (`light` is reserved — no playback).

## WebSocket Protocol

```text
COMMAND (master→zone): { type:"cmd", zone, action, resource_id?, value? }
  action ∈ "play" | "stop" | "stopAll" | "volume" | "background" | "requestState"
STATE   (zone→masters): { type:"state", zone, playing:[{id,type,is_background}], master_volume }
  master_volume is a 0..1 fraction.
```

## Events

Events bubble and are composed. `wcfxboardplay`/`wcfxboardstop` each fire a lowercase canonical name and a legacy colon alias.

| Event (canonical / legacy) | Detail | Fires when |
|----------------------------|--------|------------|
| `wcfxboardplay` / `wc-fx-board:play` | `{ id, type, zone }` | A resource starts playing |
| `wcfxboardstop` / `wc-fx-board:stop` | `{ id, type, zone }` | A resource stops |
| `message` | the outgoing protocol object | The component sends a protocol message (so a host can forward it) |

## Methods

| Method | Description |
|--------|-------------|
| `send(obj)` | Send an outgoing protocol message (over the socket if open) AND dispatch a `message` event |
| `receive(json)` | Deliver an incoming protocol message (object or JSON string); a `cmd` for this zone is executed (only when `controllable`) |
| `play(id)` | Play the resource by id |
| `stop(id)` | Stop the resource by id |
| `stopAll()` | Stop everything |
| `setMasterVolume(v)` | Set the master volume (0..100) |

## Examples

Host-driven transport (no `ws-url`) — forward outgoing messages and feed incoming ones:

```html
<wc-fx-board id="board" zone="lobby" controllable
             resources='[{"id":"a1","type":"audio","name":"Chime","category":"UI","file_url":"/fx/chime.mp3"}]'></wc-fx-board>
<script>
  const board = document.getElementById('board');
  board.addEventListener('message', (e) => myTransport.send(e.detail));
  myTransport.onmessage = (msg) => board.receive(msg);
</script>
```

## Notes

- Uses Wave semantic tokens only (no hardcoded colors); active/playing states use `--primary-bg-color` + the `--wc-on-primary` auto-contrast token. CSS is scoped in `@layer wc.usage`; no third-party deps.
- Construct declaratively (HTML/parser or `insertAdjacentHTML`), not via `document.createElement` — the wrapper is appended in the constructor.
- Reflects `resources` changes (HTMX-swap safe); clean disconnect stops media, closes the socket, removes listeners.
- Verified in `tests/fx-board-test.py`; demoed in `views/fx-board.html`.
