# WC-Menu Web Component

A responsive navigation menu that builds HTMX-powered links from declarative `<option>` children (or an `items` JSON array), with a mobile hamburger toggle.

> Related: ./wc-top-nav.md (deprecated top-nav variant), ./wc-sidenav.md, ./wc-breadcrumb.md.

## Features

- Declarative `<option>` children or `items` JSON array
- Generates links wired for HTMX (`hx-get`, `hx-target="#viewport"`, `hx-push-url`, `hx-select="#page-contents"`)
- Auto-marks the active link from the current URL route
- Responsive: collapses to a hamburger toggle at ≤600px
- Event-driven click via the `wcmenuclick` EventHub message

## Basic Usage

```html
<wc-menu id="menu">
  <option value="home" selected>Home</option>
  <option value="news">News</option>
  <option value="contact">Contact</option>
  <option value="about">About</option>
</wc-menu>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier for the menu |
| `class` | — | CSS classes applied to the component |
| `path` | `/static/views/` | Base path prepended to each link's `href`/`hx-get` (e.g. `${path}${name}.html`) |
| `wrap` | (absent) | When present, allows the menu items to wrap (`flex-wrap`) |

The `items` attribute is also accepted as a JSON array (`[{ "name", "label", "selected" }]`) and is consumed/removed during render.

## Events

The component listens for a broadcast event to programmatically trigger a menu link click.

| Event | Direction | Description |
|-------|-----------|-------------|
| `wcmenuclick` | listens | Broadcast via EventHub to click a menu link. Payload targets this element (selector) plus a sub-selector for the link, e.g. `[data-name="theme"]` |

```javascript
wc.EventHub.broadcast('wcmenuclick', ['[data-wc-id="..."]'], '[data-name="theme"]');
```

## Examples

```html
<!-- Custom base path -->
<wc-menu id="nav" path="/views/">
  <option value="dashboard" selected>Dashboard</option>
  <option value="reports">Reports</option>
</wc-menu>

<!-- Wrapping menu -->
<wc-menu id="nav" wrap>
  <option value="one">One</option>
  <option value="two">Two</option>
  <option value="three">Three</option>
</wc-menu>
```

## Notes

- Each generated anchor targets `#viewport` and selects `#page-contents` from the fetched page, so it is designed to work with an HTMX shell layout.
- The active link is resolved from `window.location.pathname` (last path segment, extension stripped); if no match is found the first item is marked active.
- `display: contents` is applied to the host so it does not introduce an extra box in layout.
