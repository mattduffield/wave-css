# WC-Context-Menu Web Component

A reusable context (right-click) menu. Supports declarative child items or a programmatic static API. Only one menu is visible at a time (singleton pattern), it auto-closes on outside click or Escape, and it repositions to stay within the viewport.

> Related: ./wc-tab.md (uses this internally for removable-tab menus), ./wc-code-mirror.md, ./wc-dropdown.md.

## Features

- Declarative `wc-context-menu-item` children **or** programmatic `WcContextMenu.show(x, y, items)`
- Singleton: showing a new menu closes any open one
- Items support label, icon (a `wc-fa-icon` name), action, disabled, and divider
- Auto-positions to stay inside the viewport
- Closes on click outside or the Escape key

## Basic Usage

### Programmatic

```javascript
import { WcContextMenu } from './wc-context-menu.js';

element.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  WcContextMenu.show(e.clientX, e.clientY, [
    { label: 'Edit', icon: 'pen', action: () => edit() },
    { divider: true },
    { label: 'Delete', icon: 'trash', action: () => remove(), disabled: true },
  ]);
});
```

### Declarative

```html
<wc-context-menu id="my-menu">
  <wc-context-menu-item label="Query" icon="magnifying-glass" action="doQuery()"></wc-context-menu-item>
  <wc-context-menu-item divider></wc-context-menu-item>
  <wc-context-menu-item label="Delete" icon="trash" action="doDelete()" disabled></wc-context-menu-item>
</wc-context-menu>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |

### `wc-context-menu-item` (child)

| Attribute | Default | Description |
|-----------|---------|-------------|
| `label` | `""` | Menu item text |
| `icon` | `""` | `wc-fa-icon` icon name shown before the label |
| `action` | — | JS expression run on click (e.g. `doQuery()`) |
| `disabled` | (absent) | Renders the item disabled (non-clickable) |
| `divider` | (absent) | Renders a divider line instead of an item |

## Item Descriptor (programmatic)

Each item passed to `show()`/`open()` is an object:

```javascript
{ label: String, icon: String, action: Function, disabled: Boolean }
// or a divider:
{ divider: true }
```

## Methods

### Static

| Method | Description |
|--------|-------------|
| `WcContextMenu.show(x, y, items)` | Show the singleton menu at `x`/`y` (clientX/clientY) with the given items array; returns the singleton instance |
| `WcContextMenu.hide()` | Hide the singleton menu |

### Instance

| Method | Description |
|--------|-------------|
| `open(x, y, items)` | Show this instance at `x`/`y`. If `items` is omitted, reads declarative `wc-context-menu-item` children |
| `close()` | Hide this instance and clear its contents |

## Notes

- `wc-context-menu-item` is a config-only child element; its attributes are read to build the menu.
- Declarative `action` strings are executed via `new Function(actionStr)()`.
- The static API creates/reuses a single `wc-context-menu` element appended to `document.body`.
