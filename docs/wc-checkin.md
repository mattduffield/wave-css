# WC-Checkin Web Component

A touch-friendly scan-to-check-in / check-out station for a staffed tablet. It captures a scanned code (USB keyboard-wedge scanner and/or camera), POSTs it to a server endpoint, and renders the server's allow/deny verdict in big, glanceable states.

> The server is authoritative — the component never decides allow/deny, never caches or infers authorization, and never receives the authorized barcodes (only display names + a yes/no).

> Related: ./wc-record-lookup.md, ./wc-barcode.md.

## Features

- Two flows: single-scan **check-IN** and two-step **check-OUT** (identify the child, then authorize a pickup)
- Scan capture via **USB keyboard-wedge** and/or **camera** (`scan-source`)
- Camera decoding prefers the native `BarcodeDetector` API; falls back to a lazily-loaded ZXing decoder on browsers without it (Safari/Firefox)
- Fail-safe: any network/parse error shows an ERROR state and never shows ALLOWED
- Optional admin **Override** on a denied check-out
- Optional success/fail beep (WebAudio, no asset)
- Server-authoritative — displays only what the server returns

## Basic Usage

```html
<!-- Check-in station -->
<wc-checkin mode="in" scan-source="both" endpoint="/x/checkin"
            event-id="EVT-1" session-id="SES-1" csrf="{{CSRFToken}}"></wc-checkin>

<!-- Check-out station with admin override -->
<wc-checkin mode="out" scan-source="usb" endpoint="/x/checkin"
            event-id="EVT-1" allow-override></wc-checkin>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `mode` | `in` | Flow: `in` (single scan) or `out` (two-step check-out) |
| `scan-source` | `usb` | Capture source: `usb`, `camera`, or `both` |
| `endpoint` | — | Server URL to POST each scan to |
| `event-id` | — | Passed through on every request |
| `session-id` | — | Passed through on every request |
| `csrf` | — | CSRF token — sent as the `X-CSRF-Token` header AND `csrf_token` in the body |
| `allow-override` | (absent) | Boolean; show an admin Override on a denied check-out (only when the response carries `override_allowed:true`) |
| `beep` | `true` | Success/fail tone; set `beep="false"` to disable |

## Request / Response Contract

Request body (JSON, POSTed on each scan):

```json
{ "mode": "out", "scanned_barcode": "…", "event_id": "EVT-1", "session_id": "SES-1",
  "step": "identify", "attendee_id": "…", "csrf_token": "…", "override": false }
```

`step` is `identify` on the first scan and `authorize` on the check-out pickup scan.

Response (rendered as-is; the server decides):

```json
{ "allowed": true, "reason": "…", "attendee": { "id": "…", "name": "…", "photo": "…" },
  "authorized_names": ["…"], "requires_pickup_scan": true,
  "recorded_id": "…", "override_allowed": true }
```

## Events

All events are `CustomEvent`s (bubbles + composed) fired on the element AND on `document`. Each fires a lowercase canonical name and a legacy colon alias.

| Event (canonical / legacy) | Detail | Fires when |
|----------------------------|--------|------------|
| `wccheckinscanned` / `checkin:scanned` | `{ code, source, step }` | A scan is captured |
| `wccheckinresult` / `checkin:result` | full server response | A verdict is received |
| `wccheckinerror` / `checkin:error` | `{ message }` | A network/parse error occurs |

## Integration Hook

Set `el.requestHandler = async (payload) => response` to route the POST through your own client instead of the built-in `fetch` (used by the demo + tests). This does not change the contract — the handler's response is still authoritative.

```js
document.querySelector('wc-checkin').requestHandler = async (payload) => {
  return await myApi.post('/checkin', payload);
};
```

## Examples

Two-step check-out with camera capture and event logging:

```html
<wc-checkin id="station" mode="out" scan-source="camera"
            endpoint="/x/checkin" event-id="EVT-1" allow-override></wc-checkin>
<script>
  const s = document.getElementById('station');
  s.addEventListener('wccheckinresult', (e) => console.log('verdict', e.detail));
  s.addEventListener('wccheckinerror', (e) => console.warn(e.detail.message));
</script>
```

## Notes

- `display: contents` and htmx-safe (`htmx.process` runs after render).
- **USB wedge:** buffers rapid keystrokes ending in Enter; an inter-keystroke gap over ~60ms resets the buffer (distinguishing a scanner burst from human typing), with a minimum length of 3 chars.
- **Camera fallback:** the ZXing decoder loads via Wave's shared loader, so `WaveAssetBase` self-hosting + CDN fallback apply (mirror folder `@zxing/library-0.21.3/umd/index.min.js`); it is only fetched the first time a fallback browser opens the camera. If neither the native API nor ZXing is available, the camera control shows a "use a USB scanner" message.
- Verified in `tests/checkin-test.py`; demoed in `views/checkin.html`.
