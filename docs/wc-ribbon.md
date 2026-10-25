# WC-Ribbon Web Components

A Fusion 360 / Microsoft Office–style ribbon that any app (CadStudio, PublishStudio, ReportStudio, …) can drop in. The ribbon stays uncluttered: each group shows a few large icon-over-label buttons for the common commands, and the group's title (**CREATE ▾**) opens a menu listing **every** command in the group, common and less-used, each with an icon, a name and a one-line description. Contextual tabs (a green **Sketch** tab while sketching) appear only when relevant.

> Related: [wc-tab](./wc-tab.md) (plain tabs), [wc-dropdown](./wc-dropdown.md) (stand-alone menus). Demo: `views/ribbon.html`. Tests: `tests/ribbon-test.py`.

## Components

| Element | Role |
|---------|------|
| `<wc-ribbon>` | The container: a tab strip + the active tab's body |
| `<wc-ribbon-tab>` | One tab (a `role="tabpanel"`) |
| `<wc-ribbon-group>` | A column of buttons with its label at the bottom; with `menu` the label opens the group menu |
| `<wc-ribbon-button>` | A large icon (or text glyph) over a small label |
| `<wc-ribbon-item>` | A command listed **only** in the group's menu (less-used), or a variant inside a split |
| `<wc-ribbon-split>` | A split button: the icon runs the main action, "Label ▾" opens its variants |
| any other element | A widget (`<select>`, range input…) rendered compactly, with an optional `caption` under it |

## Features

- Large icon-over-label buttons (`wc-fa-icon`, ~1.15rem) or text glyphs for symbols like ⊥ ∥ ◎
- Group menus list every command with icon, name and one-line description; toggles show a checked state
- Contextual tabs with an accent colour (label + underline), shown and hidden at runtime without re-rendering the other tabs
- Toggle tools (`toggle`, and `toggle-group` for one-at-a-time tools such as sketch tools)
- Split buttons, widgets with captions, menu-only commands
- **Narrow widths:** groups collapse right-to-left into a single "GROUP ▾" button that opens the same menu (widgets included), then into a ⋯ overflow menu. Never a horizontal scrollbar
- `compact`: a single-row ribbon with small icons beside labels
- Keyboard: ARIA tablist/tab/tabpanel with arrow keys; buttons in natural tab order; menus are `role="menu"` with ↑/↓, Home/End, Enter/Space, Esc and type-ahead; optional Alt key tips
- Cheap state changes: `setActive`, `setDisabled` and `showTab`/`hideTab` update in place and keep open menus stable
- Define the ribbon as data with `setModel()` (CadStudio's `CMD` + `RIBBON` shape)
- Theme-only colours (CSS variables), live theme switching, htmx-safe, no listeners left behind on removal

## Basic Usage

```html
<wc-ribbon id="rb" active="solid" keytips>
  <wc-ribbon-tab key="solid" label="Solid">
    <wc-ribbon-group label="Create" menu>
      <wc-ribbon-button command="extrude" icon="arrow-up-from-line" label="Extrude"
                        tip="Pull the selected sketch into a solid"></wc-ribbon-button>
      <wc-ribbon-button command="revolve" icon="rotate" label="Revolve"
                        tip="Spin the selected sketch around an axis"></wc-ribbon-button>
      <wc-ribbon-item command="loft" icon="layer-group" label="Loft"
                      tip="A solid through two or more sketches"></wc-ribbon-item>
    </wc-ribbon-group>
    <wc-ribbon-group label="Inspect">
      <wc-ribbon-button command="measure" icon="ruler" label="Measure" tip="Click two points" toggle></wc-ribbon-button>
      <select id="section" caption="Section">…</select>
    </wc-ribbon-group>
  </wc-ribbon-tab>

  <wc-ribbon-tab key="sketch" label="Sketch" contextual accent="success" hidden>
    <wc-ribbon-group label="Constraints" menu>
      <wc-ribbon-button command="c-perpendicular" glyph="⊥" label="Perpendicular" tip="Two lines at right angles"></wc-ribbon-button>
      <wc-ribbon-button command="sk-line" icon="minus" label="Line" toggle toggle-group="tool"></wc-ribbon-button>
    </wc-ribbon-group>
  </wc-ribbon-tab>

  <wc-ribbon-tab key="make" label="Make">
    <wc-ribbon-group label="Setup">
      <wc-ribbon-split command="tool-endmill" icon="screwdriver-wrench" label="Tool" tip="Add a cutter">
        <wc-ribbon-item command="tool-vbit" icon="screwdriver-wrench" label="V-bit" tip="A 60° V-bit"></wc-ribbon-item>
        <wc-ribbon-item command="tool-drill" icon="screwdriver-wrench" label="Drill" tip="A ⅛″ drill"></wc-ribbon-item>
      </wc-ribbon-split>
    </wc-ribbon-group>
  </wc-ribbon-tab>
</wc-ribbon>

<script type="module">
  rb.addEventListener('wcribboncommand', (e) => {
    const { command, tab, group, active } = e.detail;
    if (command === 'sketch') rb.showTab('sketch', true);
  });
</script>
```

## Attributes

### `<wc-ribbon>`

| Attribute | Default | Description |
|-----------|---------|-------------|
| `active` | first visible tab | Key of the active tab (kept in sync with `setTab`) |
| `compact` | — | Single-row ribbon: small icons beside labels |
| `keytips` | — | Alt shows key letters for tabs, then for the active tab's commands |

### `<wc-ribbon-tab>`

| Attribute | Default | Description |
|-----------|---------|-------------|
| `key` | label, lower-cased | Tab id used by `setTab` / `showTab` / `hideTab` |
| `label` | key | Tab text |
| `contextual` | — | Styled with the accent colour (label + underline); `setModel` hides contextual tabs until shown |
| `accent` | `success` when contextual | `primary` \| `success` \| `warning` \| `danger` \| `info` |
| `hidden` | — | Not shown in the strip |
| `keytip` | first free letter | Key-tip letter |

### `<wc-ribbon-group>`

| Attribute | Default | Description |
|-----------|---------|-------------|
| `label` | "" | Group title (shown uppercase under the buttons) |
| `menu` | — | The title becomes a "LABEL ▾" button that opens every command in the group |
| `icon` | first command's icon | Icon for the collapsed "GROUP ▾" button |

### `<wc-ribbon-button>`, `<wc-ribbon-item>`, `<wc-ribbon-split>`

| Attribute | Description |
|-----------|-------------|
| `command` | Command id, reported in `wcribboncommand` |
| `icon` | Font Awesome icon name (`wc-fa-icon`) |
| `glyph` | Text glyph instead of an icon (● H V ⊥ ∥ T ◎) |
| `label` | Small label under the icon (and the menu name) |
| `tip` | One-line description: the menu description and the tooltip "Label — tip" |
| `variant` | `primary` \| `success` \| `warning` \| `danger` \| `info`: accent icon + tint (e.g. G-code, Finish sketch) |
| `toggle` | A tool that stays on: `aria-pressed`, flips on click, checked state in menus |
| `toggle-group` | One-at-a-time toggles (sketch tools): turning one on turns the others in the group off |
| `active` | Toggle state |
| `disabled` | Not clickable; disabled in menus |
| `menu-only` | (`wc-ribbon-button`) list it only in the group menu |
| `keytip` | Key-tip letter |

Widgets: any other element in a group (e.g. `<select caption="Section">`, `<input type="range" caption="Cut at">`) renders as a compact control aligned with the buttons, with `caption` shown under it.

## Methods (`wc-ribbon`)

| Method | Description |
|--------|-------------|
| `setTab(key)` | Activate a tab (fires `wcribbontabchange`) |
| `showTab(key, activate = false)` | Show a (contextual) tab; optionally activate it |
| `hideTab(key)` | Hide a tab; if it was active, return to the previous tab |
| `setActive(command, bool)` | Toggle state for every button/item with that command (respects `toggle-group`) |
| `setDisabled(command, bool)` | Disable/enable every button/item with that command |
| `setModel(model)` | Replace the ribbon from data (below) |
| `closeMenus()` | Close an open menu |
| `relayout()` | Re-run the collapse layout (automatic on resize and content changes) |
| `tab(key)` | The `<wc-ribbon-tab>` element |

None of these re-render the ribbon. An open menu stays open, and its items update in place.

## Events

| Event | Alias | detail | When |
|-------|-------|--------|------|
| `wcribboncommand` | `ribbon-command` | `{ command, tab, group, source, active? }` | A button, menu item, split, or key tip ran a command. `source`: `button` \| `menu`. `active` for toggles. Bubbles from the button/item element |
| `wcribbontabchange` | `ribbon-tab-change` | `{ tab, previous, source }` | The active tab changed |

Both bubble, are composed, and are also broadcast through `wc.EventHub`: on `document.body`, with `detail.custom` = the detail above and `detail.selector` = `[data-wc-id="…"]`.

### EventHub commands (inbound)

```js
wc.EventHub.broadcast('wcribbonactivate', '#rb', 'make');     // setTab('make')
wc.EventHub.broadcast('wcribbontabshow', '#rb', 'sketch');    // showTab('sketch')
wc.EventHub.broadcast('wcribbontabhide', ['#rb'], 'sketch');  // hideTab('sketch')
```

The selector targets the ribbon; the sub-selector is the tab key.

## Defining the ribbon as data

```js
rb.setModel({
  commands: {
    sketch:  { icon: 'pen-ruler', label: 'Sketch', tip: 'Start a sketch on a plane or a face' },
    extrude: { icon: 'arrow-up-from-line', label: 'Extrude', tip: 'Pull the selected sketch into a solid' },
    loft:    { icon: 'layer-group', label: 'Loft', tip: 'A solid through two or more sketches' },
    'c-perpendicular': { glyph: '⊥', label: 'Perpendicular', tip: 'Two lines at right angles' },
    'sk-line': { icon: 'minus', label: 'Line', tip: 'Click each point', tool: true },  // toggle, toggle-group "tool"
    gcode:   { icon: 'download', label: 'G-code', tip: 'Download', primary: true,       // variant primary
               run: (detail) => downloadGCode() },                                       // optional callback
    'tool-endmill': { icon: 'screwdriver-wrench', label: 'Tool', tip: 'Add an end mill' },
    'tool-vbit':    { icon: 'screwdriver-wrench', label: 'V-bit', tip: 'A 60° V-bit' },
  },
  widgets: {
    section: { html: '<select id="section">…</select>', caption: 'Section' },  // or a Node, or () => html|Node
  },
  tabs: [
    { key: 'solid', label: 'Solid', groups: [
      { label: 'Create', main: ['sketch', 'extrude'], more: ['loft'] },          // `more` → menu-only items; menu on
      { label: 'Inspect', main: ['@section'] },                                   // '@name' → widget
      { label: 'Make', main: [{ split: 'tool-endmill', items: ['tool-endmill', 'tool-vbit'] }, 'gcode'] },
    ] },
    { key: 'sketch', label: 'Sketch', contextual: true, accent: 'success', groups: [ … ] },  // hidden until shown
  ],
});
```

Command fields: `icon` | `glyph`, `label`, `tip`, `variant` (or CadStudio's `primary` → primary, `finish` → success), `toggle`, `tool` (= toggle + `toggle-group="tool"`), `toggleGroup`, `active`, `disabled`, `keytip`, `run(detail)`.

## Menus

- Each menu opens in the **top layer** (the HTML `popover` attribute) and is anchored by JS to **its own button**, so there's no shared anchor name. It flips above or to the left near the viewport edge, caps its height at 70vh (or the space available) and scrolls.
- Because the menu stays in the ribbon's DOM, it inherits the ribbon's CSS variables and theme changes live. No colours are computed in JS.
- Closes on item click, outside click and Esc. Item click and Esc return focus to the group button.
- A collapsed group's menu also shows its widgets (moved in while the menu is open, moved back with their state on close).

## Theming

| Variable | Default | |
|----------|---------|--|
| `--wc-ribbon-bg` | `var(--surface-2)` | Ribbon background |
| `--wc-ribbon-group-border` | `var(--surface-4)` | Group dividers + strip border |
| `--wc-ribbon-button-hover` | `var(--surface-3)` | Button / tab / group-title hover |
| `--wc-ribbon-label-color` | `var(--text-2)` | Group titles and widget captions |
| `--wc-ribbon-menu-bg` | `var(--surface-2)` | Menu background |
| `--wc-ribbon-menu-width` | `300px` | Menu minimum width |
| `--wc-ribbon-accent` | `var(--primary-bg-color)` | Active tab underline, pressed toggles |

Set them on `wc-ribbon` or any ancestor, or style the stable class names (`.wc-ribbon-tab-btn`, `.wc-ribbon-group`, `.wc-ribbon-btn`, `.wc-ribbon-menu`, `.wc-ribbon-menu-item`, `.wc-ribbon-menu-desc`, …). The component styles live in `@layer wc.usage`, so unlayered app CSS wins without `!important`. Text stays WCAG AA (≥4.5:1) in light, dark, `.crisp` and `theme-high-contrast`. Contextual tab labels mix the accent toward `--text-1`, as badges do.

## Notes

- State classes are `.is-on`, not `.is-active`: Wave's global `.is-active` utility (`@layer wc.selected`) would add its accent bar.
- Light DOM only: children are moved into the ribbon's layout with `appendChild`, so ids, values and htmx/hyperscript bindings survive. The parts also work with `document.createElement` (inner elements are built on first render).
- If an ancestor has `transform`/`filter`, browsers without `popover` support position menus relative to it; current Chrome, Edge, Safari and Firefox all support `popover`.
- Demo: `views/ribbon.html`. Tests: `tests/ribbon-test.py` (70 checks).
