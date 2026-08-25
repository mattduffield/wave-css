# WC-Google-Map Web Component

A Google Maps integration with single or multiple pins. Supports a data-bound `markers` array, `<option>` pin children, and a rich set of map events.

> Related: ./wc-map.md (a keyless, $0/mo drop-in with an identical contract), ./wc-address.md (address type-ahead that can target this map).

## Features

- Single pin (`lat`/`lng`) and multiple pins (data-bound `markers` JSON and/or `<option>` children)
- `fit-bounds` auto-frames all pins (automatic for more than one)
- Per-marker `link` rendered as an `<a>` in the info window and carried on the marker-click event
- Full map interaction events (load, click, center/zoom/bounds change, drag)
- HTMX-swap safe

## Basic Usage

```html
<!-- Single pin -->
<wc-google-map
  api-key="YOUR_API_KEY"
  lat="40.7128" lng="-74.0060"
  address="New York, NY" zoom="12" map-type="roadmap">
</wc-google-map>

<!-- Multiple pins using option elements -->
<wc-google-map api-key="YOUR_API_KEY" zoom="10" map-type="roadmap">
  <option data-lat="40.7128" data-lng="-74.0060" data-address="New York, NY" data-title="Location 1"></option>
  <option data-lat="34.0522" data-lng="-118.2437" data-address="Los Angeles, CA" data-title="Location 2"></option>
</wc-google-map>

<!-- Data-bound markers array -->
<wc-google-map api-key="YOUR_API_KEY" markers='[{"lat":40.7,"lng":-74,"title":"HQ","link":"/x/1"}]' fit-bounds></wc-google-map>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `api-key` | — | Google Maps API key |
| `lat` | — | Latitude for a single pin |
| `lng` | — | Longitude for a single pin |
| `address` | — | Address label for the single pin |
| `title` | — | Title for the single pin |
| `zoom` | — | Map zoom level |
| `map-type` | — | Map type (e.g. `roadmap`) |
| `center-lat` | — | Map center latitude |
| `center-lng` | — | Map center longitude |
| `draggable` | — | Enable/disable panning |
| `scrollwheel` | — | Enable/disable scroll-wheel zoom |
| `disable-default-ui` | — | Hide default UI controls |
| `markers` | — | JSON `[{lat,lng,label?,title?,address?,link?}]` (additive with single pin + `<option>` children) |
| `fit-bounds` | (absent) | Auto-frame all pins |

`<option>` children accept `data-lat`, `data-lng`, `data-title`, `data-address`, and `data-link`.

## Events

Events bubble; each fires a canonical name and a legacy alias.

| Event (canonical / legacy) | Detail | Fires when |
|----------------------------|--------|------------|
| `wcmaploaded` / `map-loaded` | `{ map }` | The map is ready |
| `wcpinclicked` / `pin-clicked` | `{ pin, marker, index }` | A pin is clicked |
| `wcgooglemapmarkerclick` / `wc-google-map:marker-click` | `{ index, link, pin }` | A marker is clicked (carries the per-marker `link`) |
| `wcmapclicked` / `map-clicked` | — | The map background is clicked |
| `wcmapcenterchanged` / `center-changed` | — | The center changes |
| `wcmapzoomchanged` / `zoom-changed` | — | The zoom changes |
| `wcmapboundschanged` / `bounds-changed` | — | The bounds change |
| `wcmapdragstart` / `drag-start` | — | Drag starts |
| `wcmapdragging` / `dragging` | — | Dragging |
| `wcmapdragend` / `drag-end` | — | Drag ends |

## Methods

| Method | Description |
|--------|-------------|
| `updatePins(pins)` | Replace all pins with the supplied array |
| `addPin(lat, lng, address, title)` | Add a single pin |
| `clearPins()` | Remove all pins |
| `getMap()` | Return the underlying Google map |
| `getMarkers()` | Return the current marker objects |

## Examples

Data-bound markers with per-marker links and click handling:

```html
<wc-google-map id="map" api-key="YOUR_API_KEY" fit-bounds
  markers='[{"lat":40.7,"lng":-74,"title":"HQ","link":"/x/1"},
            {"lat":34.05,"lng":-118.24,"title":"West","link":"/x/2"}]'>
</wc-google-map>
<script>
  document.getElementById('map')
    .addEventListener('wcgooglemapmarkerclick', (e) => {
      if (e.detail.link) location.href = e.detail.link;
    });
</script>
```

## Notes

- Loads the Google Maps API once (globally tracked); HTMX-swap safe.
- For a keyless, no-billing alternative with the same attributes/methods/events, use `wc-map`.
