# WC-Icon-Picker Web Component

A form-associated, searchable visual icon picker. The trigger shows the selected icon (a `wc-fa-icon` preview + name); clicking it opens a popover with a search box and a grid of icon previews. Typing filters by name; clicking a glyph selects it. The picker submits the icon **name string** under `name`.

> Related: [wc-fa-icon](./wc-fa-icon.md) (renders the previews), [wc-icon-config](./wc-icon-config.md) (bundle source), [wc-icon](./wc-icon.md).

## Features

- Form-associated (FACE): submits the selected icon name via `setFormValue` under the host `name`
- Icon list sourced internally from Wave's own bundle manifest — the host supplies no names
- Substring search by icon name
- Keyboard navigation: ArrowDown from search enters the grid; arrows navigate; Enter selects; Escape closes
- Popover appended to `<body>` (never clipped by overflow ancestors), flips when low on space, mirrors the page theme classes
- Preview SVGs lazy-render via IntersectionObserver for smooth open/filter across the full set
- `variant` selects the icon bundle and preview style
- Optional clear control; integrates with form validity when `required`

## Basic Usage

```html
<wc-form>
  <wc-icon-picker name="icon" value="cart-shopping" lbl-label="App Icon"
    variant="solid" placeholder="Search icons…" columns="8" clearable required>
  </wc-icon-picker>
</wc-form>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Field name (required); the icon name submits under this |
| `value` | — | Selected icon name; seeds the field and round-trips |
| `lbl-label` | — | Field label |
| `variant` | `solid` | Bundle/style to source and preview (`solid`, `regular`, `light`, `thin`, `duotone`, …) |
| `placeholder` | — | Search box placeholder text |
| `columns` | `8` | Number of columns in the preview grid (also arrow-key step) |
| `clearable` | — | Boolean; shows a clear control (auto-hidden when `required`) |
| `required` | — | Boolean; sets form validity (`valueMissing` when empty) |
| `disabled` | — | Boolean; disables the picker |
| `id` | — | Element id |
| `class` | — | CSS classes |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `wciconpickerchange` (alias `wc-icon-picker:change`) | `{ value }` | Fired on select or clear; bubbling and composed |

## Examples

```html
<!-- Regular-style icons, not clearable -->
<wc-icon-picker name="nav_icon" variant="regular" lbl-label="Nav Icon"></wc-icon-picker>

<!-- Listen for changes -->
<wc-icon-picker id="picker" name="icon"></wc-icon-picker>
<script>
  document.getElementById('picker')
    .addEventListener('wciconpickerchange', (e) => console.log(e.detail.value));
</script>
```

## Notes

- Extends `WcBaseFormComponent`; `display: contents`; htmx-safe.
- The icon list is fetched from `WcIconConfig.bundleBaseUrl/<variant>-icons.json` (bundle keys are icon names) and cached per variant across instances — configure the URL via [wc-icon-config](./wc-icon-config.md).
- Search matches icon names only (the manifest carries no synonyms/aliases).
- The submitted value is the plain icon name string, exactly what `wc-fa-icon` / `_app.icon` / `navigation_items[].icon` expect — no transform needed on save.
