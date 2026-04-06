# wc-split-pane

A resizable split panel component with a draggable divider. Supports horizontal and vertical layouts, collapsible panes, localStorage persistence, touch devices, keyboard navigation, and nesting for complex multi-pane layouts.

## Basic Usage

### Horizontal Split (Left/Right)

```html
<wc-split-pane initial-size="256px" min-size="200px" max-size="400px">
  <wc-split-start>
    <!-- Left panel (sidebar, tree nav, etc.) -->
  </wc-split-start>
  <wc-split-end>
    <!-- Right panel (main content) -->
  </wc-split-end>
</wc-split-pane>
```

### Vertical Split (Top/Bottom)

```html
<wc-split-pane direction="vertical" initial-size="300px" min-size="100px">
  <wc-split-start>
    <!-- Top panel (editor) -->
  </wc-split-start>
  <wc-split-end>
    <!-- Bottom panel (results) -->
  </wc-split-end>
</wc-split-pane>
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `direction` | `"horizontal"` \| `"vertical"` | `"horizontal"` | Split direction. Horizontal = left/right. Vertical = top/bottom. |
| `initial-size` | string | `"250px"` | Initial size of the start pane. Accepts `px` or `%`. |
| `min-size` | string | `"100px"` | Minimum size of the start pane. |
| `max-size` | string | `"50%"` | Maximum size of the start pane. |
| `divider-width` | string | `"4px"` | Width/height of the drag divider. |
| `collapsible` | boolean | - | Show collapse/expand button on the divider. |
| `collapsed` | boolean | - | Start with the start pane collapsed. |
| `persist-key` | string | - | localStorage key for persisting size and collapsed state. |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `split-pane:resize` | `{ size, percentage }` | Fired after drag ends. |
| `split-pane:collapse` | `{ collapsed }` | Fired when pane is collapsed or expanded. |

## Collapsible

```html
<wc-split-pane initial-size="256px" collapsible>
  <wc-split-start>Sidebar</wc-split-start>
  <wc-split-end>Content</wc-split-end>
</wc-split-pane>
```

Shows a small button on the divider. Click to toggle the start pane between its current size and collapsed (0px). Smooth 200ms animation.

## Persistence

```html
<wc-split-pane initial-size="256px" collapsible persist-key="my-sidebar">
  <wc-split-start>Sidebar</wc-split-start>
  <wc-split-end>Content</wc-split-end>
</wc-split-pane>
```

Saves pane size and collapsed state to `localStorage` under key `wc-split-pane:my-sidebar`. Restored automatically on page load.

## Nested Layouts

### Three Panes (Sidebar + Editor + Results)

```html
<wc-split-pane initial-size="256px" collapsible>
  <wc-split-start>Tree Nav</wc-split-start>
  <wc-split-end>
    <wc-split-pane direction="vertical" initial-size="60%">
      <wc-split-start>Query Editor</wc-split-start>
      <wc-split-end>Results</wc-split-end>
    </wc-split-pane>
  </wc-split-end>
</wc-split-pane>
```

### Five Panes (Full IDE Layout)

```html
<wc-split-pane initial-size="256px" collapsible>
  <wc-split-start>LEFT (tree)</wc-split-start>
  <wc-split-end>
    <wc-split-pane direction="horizontal" initial-size="calc(100% - 300px)">
      <wc-split-start>
        <wc-split-pane direction="vertical" initial-size="60%">
          <wc-split-start>CENTER TOP (editor)</wc-split-start>
          <wc-split-end>CENTER BOTTOM (output)</wc-split-end>
        </wc-split-pane>
      </wc-split-start>
      <wc-split-end>RIGHT (properties)</wc-split-end>
    </wc-split-pane>
  </wc-split-end>
</wc-split-pane>
```

Produces:
```
+----------+--------------------------+-----------+
|          |     CENTER TOP           |           |
|  LEFT    |     (editor)             |  RIGHT    |
|  (tree)  +--------------------------|  (props)  |
|          |     CENTER BOTTOM        |           |
|          |     (results)            |           |
+----------+--------------------------+-----------+
```

## Keyboard Navigation

Focus the divider (Tab or click), then:

| Key | Action |
|-----|--------|
| Arrow Left/Up | Shrink start pane by 10px |
| Arrow Right/Down | Grow start pane by 10px |
| Shift + Arrow | Resize by 50px |
| Home | Shrink to min-size |
| End | Grow to max-size |
| Enter | Toggle collapse (if collapsible) |

## CSS Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `--split-pane-divider-bg` | `var(--border-color)` | Divider background |
| `--split-pane-divider-hover-bg` | `var(--primary-color)` | Divider hover color |
| `--split-pane-divider-active-bg` | `var(--primary-color)` | Divider color during drag |

## JavaScript API

```javascript
const pane = document.querySelector('wc-split-pane');
pane.toggle();  // Toggle collapse/expand
```
