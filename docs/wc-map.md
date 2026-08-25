# WC-Map Web Component

A keyless, $0/mo, provider-agnostic interactive map built on MapLibre GL JS + free OpenFreeMap vector tiles. A drop-in replacement for `wc-google-map`: same attributes, pins, methods, and events — but no API key and no billing.

> Related: ./wc-google-map.md (the Google-backed sibling with an identical contract), ./wc-address.md (address type-ahead that can target this map).

## Features

- Keyless vector tiles from OpenFreeMap (`https://tiles.openfreemap.org/styles/liberty`), commercial use OK
- Single pin (`lat`/`lng`) and multiple pins (data-bound `markers` JSON and/or `<option>` children)
- `fit-bounds` auto-frames all pins (automatic for more than one)
- Per-marker `link` (rides the marker-click event so a host can navigate)
- Override tiles with `tiles` (or `map-style`) — e.g. a self-hosted PMTiles style — for a zero-third-party deployment
- Collapsible attribution (`attribution-compact`)
- Drop-in event/method compatibility with `wc-google-map`

## Basic Usage

```html
<!-- Single pin -->
<wc-map lat="40.7128" lng="-74.0060" address="New York, NY" zoom="12"></wc-map>

<!-- Multiple pins via option children -->
<wc-map zoom="10" fit-bounds>
  <option data-lat="40.7128" data-lng="-74.0060" data-title="NYC" data-address="New York, NY" data-link="/x/1"></option>
  <option data-lat="34.0522" data-lng="-118.2437" data-title="LA" data-address="Los Angeles, CA"></option>
</wc-map>

<!-- Data-bound markers array -->
<wc-map markers='[{"lat":40.7,"lng":-74,"label":"HQ","link":"/x/1"}]' fit-bounds></wc-map>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `lat` | — | Latitude for a single pin |
| `lng` | — | Longitude for a single pin |
| `address` | — | Address label for the single pin |
| `title` | — | Title for the single pin |
| `zoom` | — | Map zoom level |
| `map-type` | — | Map type |
| `center-lat` | — | Map center latitude |
| `center-lng` | — | Map center longitude |
| `draggable` | — | Enable/disable panning |
| `scrollwheel` | — | Enable/disable scroll-wheel zoom |
| `disable-default-ui` | — | Hide default UI controls |
| `markers` | — | JSON `[{lat,lng,label?,title?,address?,link?}]` (additive with single pin + `<option>` children) |
| `fit-bounds` | (absent) | Auto-frame all pins |
| `tiles` (or `map-style`) | OpenFreeMap Liberty | Tile/style URL override |
| `attribution-compact` | `true` | Collapse the mandatory credit to an ⓘ that expands on click; `false` = always-expanded box |

`api-key` is accepted but ignored — no key is needed.

## Events

Events bubble; each fires a neutral canonical name and a legacy alias.

| Event (canonical / legacy) | Detail | Fires when |
|----------------------------|--------|------------|
| `wcmaploaded` / `map-loaded` | `{ map }` | The map is ready |
| `wcpinclicked` / `pin-clicked` | `{ pin, marker, index }` | A pin is clicked |
| `wcmapmarkerclick` (+ `wcgooglemapmarkerclick`, `wc-google-map:marker-click`) | `{ index, link, pin }` | A marker is clicked (carries the per-marker `link`) |
| `wcmapclicked` / `map-clicked` | — | The map background is clicked |
| `wcmapcenterchanged` / `center-changed` | — | The center changes |
| `wcmapzoomchanged` / `zoom-changed` | — | The zoom changes |
| `wcmapboundschanged` / `bounds-changed` | `{ bounds }` | The bounds change |
| `wcmapdragstart` / `drag-start` | — | Drag starts |
| `wcmapdragging` / `dragging` | — | Dragging |
| `wcmapdragend` / `drag-end` | — | Drag ends |

## Methods

| Method | Description |
|--------|-------------|
| `updatePins(pins)` | Replace all pins with the supplied array (also updates the `markers` attribute) |
| `addPin(lat, lng, address, title)` | Add a single pin |
| `clearPins()` | Remove all pins (also clears the `markers` attribute) |
| `getMap()` | Return the underlying MapLibre map |
| `getMarkers()` | Return the current marker objects |

## Examples

Wire an address search to update the map:

```html
<wc-address geocode-url="/api/geocode" target-map="myMap" lbl-label="Search"></wc-address>
<wc-map id="myMap" zoom="12"></wc-map>
```

## Notes

- Loads MapLibre GL JS from CDN once. MapLibre uses `[lng, lat]` internally (the component converts); the reserved `style` HTML attribute is deliberately NOT used for the tiles URL.
- `disconnectedCallback` defers cleanup 1s (HTMX-swap safe).
- `clearPins()` / `updatePins()` clear the `markers` attribute too (true full replace).
- Demoed in `views/map.html` (the address part needs the `/api/geocode` proxy).
