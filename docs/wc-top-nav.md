# WC-Top-Nav Web Component

> **DEPRECATED.** Use [`wc-menu`](./wc-menu.md) instead.

A responsive top navigation bar that builds HTMX-powered links from declarative `<option>` children or an `items` JSON array, with a mobile hamburger toggle.

> Related: ./wc-menu.md (replacement), ./wc-sidenav.md.

## Features

- Declarative `<option>` children or `items` JSON array
- Generates links wired for HTMX (`hx-get`, `hx-target="#viewport"`, `hx-push-url`, `hx-select="#page-contents"`)
- Auto-marks the active link from the current URL route
- Responsive hamburger behavior at ≤600px

## Basic Usage

```html
<wc-top-nav id="top-nav">
  <option value="home" selected>Home</option>
  <option value="news">News</option>
  <option value="contact">Contact</option>
  <option value="about">About</option>
</wc-top-nav>
```

Or with an `items` JSON array:

```html
<wc-top-nav id="top-nav"
  items='[{"name":"home","label":"Home","selected":true},{"name":"news","label":"News","selected":false}]'>
</wc-top-nav>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `items` | `[]` | JSON array of `{ name, label, selected }`; consumed/removed during render |

## Notes

- Links target `/static/views/${name}.html` (fixed base path, unlike `wc-menu` which supports a `path` attribute).
- Active link is resolved from `window.location.pathname`; if no match, the first item is marked active.
- `display: contents` is applied to the host.
