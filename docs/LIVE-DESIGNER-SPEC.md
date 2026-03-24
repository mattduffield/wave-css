# wc-live-designer — Technical Specification

This is the definitive specification for building the live designer. Every implementation decision follows this document. No guessing.

---

## Architecture: Three-Layer System

### Layer 1: Edit-Mode CSS (inside iframe)
CSS injected into the iframe that overrides `display: contents` containers to `display: block` with dashed borders and `::before` labels. This makes invisible containers visible and interactive at design time.

### Layer 2: Overlays (outside iframe, in parent)
Absolutely-positioned overlay divs in the parent window that sit on top of the iframe for hover highlighting, selection outlines, the floating toolbar, and the drop insertion line. These are positioned by reading `getBoundingClientRect()` from iframe elements and translating to parent coordinates.

### Layer 3: Navigation (Layer Panel + Breadcrumb)
A tree view (Layer Panel) in the left panel showing all elements hierarchically. A breadcrumb bar at the bottom showing the nesting path of the selected element. Both are click-to-select and work for ALL elements including invisible containers.

```
┌─────────────────────────────────────────────────────────────────────┐
│  Toolbar: [📱 Responsive] [100% ▼]              [sm] [md] [lg]     │
├───────────┬─────────────────────────────────────────┬───────────────┤
│  Left     │                                         │  Right        │
│  Panel    │        Canvas (iframe)                   │  Panel        │
│  W: 240px │   ┌──────────────────────────┐          │  W: 280px     │
│           │   │                          │          │               │
│  Palette  │   │  Page card (white)       │ ← Layer 1│  Properties   │
│  ───────  │   │  with edit-mode CSS      │  (iframe) │               │
│  Layers   │   │  injected                │          │  Component    │
│  ───────  │   │                          │          │  properties   │
│  Tree     │   │  ┌─ Form ─────────────┐ │          │  and binding  │
│  view     │   │  │ ┌ Title ─────────┐ │ │          │               │
│  of all   │   │  │ │ Sample Article │ │ │          │               │
│  elements │   │  │ └────────────────┘ │ │          │               │
│           │   │  │ ┌ Category ──────┐ │ │          │               │
│           │   │  │ │ Choose...      │ │ │          │               │
│           │   │  │ └────────────────┘ │ │          │               │
│           │   │  └────────────────────┘ │          │               │
│           │   │                          │          │               │
│           │   └──────────────────────────┘          │               │
│           │                                         │               │
│           │   Hover/selection overlays ← Layer 2    │               │
│           │   (parent window, on top of iframe)     │               │
│           │                                         │               │
├───────────┴─────────────────────────────────────────┴───────────────┤
│  Body > wc-form > wc-input[title]                    ← Layer 3     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Edit-Mode CSS Injection

### What Gets Injected

When the iframe's `canvasReady` message fires, the parent injects a `<style id="editor-mode-css">` into the iframe's `<head>`:

```css
/* ============================================
   EDIT MODE CSS — injected into iframe
   Forces display:contents containers to be visible
   Removed at save/preview time
   ============================================ */

/* Force all Wave CSS containers to generate a box */
wc-form[data-designer-id],
wc-div[data-designer-id],
wc-tab[data-designer-id],
wc-tab-item[data-designer-id],
wc-accordion[data-designer-id],
wc-dropdown[data-designer-id],
wc-sidebar[data-designer-id],
wc-sidenav[data-designer-id],
wc-slideshow[data-designer-id],
wc-split-button[data-designer-id],
wc-flip-box[data-designer-id],
wc-menu[data-designer-id],
div[data-designer-id],
fieldset[data-designer-id] {
  display: block !important;
  min-height: 40px !important;
  border: 1px dashed rgba(0, 120, 255, 0.25) !important;
  border-radius: 3px !important;
  padding: 24px 8px 8px 8px !important;
  position: relative !important;
  box-sizing: border-box !important;
}

/* Empty container gets more height for drop target */
wc-form[data-designer-id]:empty,
wc-div[data-designer-id]:empty,
wc-tab[data-designer-id]:empty,
wc-tab-item[data-designer-id]:empty,
div[data-designer-id]:empty,
fieldset[data-designer-id]:empty {
  min-height: 100px !important;
}

/* Container type labels via ::before */
wc-form[data-designer-id]::before { content: "FORM"; }
wc-div[data-designer-id]::before { content: "DIV"; }
wc-tab[data-designer-id]::before { content: "TABS"; }
wc-tab-item[data-designer-id]::before { content: "TAB ITEM"; }
wc-accordion[data-designer-id]::before { content: "ACCORDION"; }
wc-dropdown[data-designer-id]::before { content: "DROPDOWN"; }
wc-sidebar[data-designer-id]::before { content: "SIDEBAR"; }
wc-sidenav[data-designer-id]::before { content: "SIDENAV"; }
wc-slideshow[data-designer-id]::before { content: "SLIDESHOW"; }
wc-split-button[data-designer-id]::before { content: "SPLIT BUTTON"; }
wc-flip-box[data-designer-id]::before { content: "FLIP BOX"; }
wc-menu[data-designer-id]::before { content: "MENU"; }
div[data-designer-id]::before { content: "DIV"; }
fieldset[data-designer-id]::before { content: attr(data-editor-label); }

/* Style for all ::before labels */
wc-form[data-designer-id]::before,
wc-div[data-designer-id]::before,
wc-tab[data-designer-id]::before,
wc-tab-item[data-designer-id]::before,
wc-accordion[data-designer-id]::before,
wc-dropdown[data-designer-id]::before,
wc-sidebar[data-designer-id]::before,
wc-sidenav[data-designer-id]::before,
wc-slideshow[data-designer-id]::before,
wc-split-button[data-designer-id]::before,
wc-flip-box[data-designer-id]::before,
wc-menu[data-designer-id]::before,
div[data-designer-id]::before,
fieldset[data-designer-id]::before {
  position: absolute !important;
  top: 4px !important;
  left: 8px !important;
  font-size: 9px !important;
  font-family: system-ui, -apple-system, sans-serif !important;
  letter-spacing: 0.5px !important;
  text-transform: uppercase !important;
  color: rgba(0, 120, 255, 0.5) !important;
  background: var(--surface-1, #fff) !important;
  padding: 0 4px !important;
  line-height: 16px !important;
  pointer-events: none !important;
  z-index: 1 !important;
}

/* Hover: highlight container border */
[data-designer-id]:hover {
  border-color: rgba(0, 120, 255, 0.5) !important;
}
[data-designer-id]:hover::before {
  color: rgba(0, 120, 255, 0.8) !important;
}

/* Non-container elements don't get the container treatment */
wc-input[data-designer-id],
wc-select[data-designer-id],
wc-textarea[data-designer-id],
wc-field[data-designer-id],
wc-fa-icon[data-designer-id],
wc-icon[data-designer-id],
wc-image[data-designer-id],
wc-loader[data-designer-id],
hr[data-designer-id] {
  display: revert !important;
  min-height: revert !important;
  border: revert !important;
  border-radius: revert !important;
  padding: revert !important;
  position: relative !important;
}
wc-input[data-designer-id]::before,
wc-select[data-designer-id]::before,
wc-textarea[data-designer-id]::before,
wc-field[data-designer-id]::before,
wc-fa-icon[data-designer-id]::before,
wc-icon[data-designer-id]::before,
wc-image[data-designer-id]::before,
wc-loader[data-designer-id]::before,
hr[data-designer-id]::before {
  display: none !important;
}

/* Prevent actual interaction with form elements at design time */
[data-designer-id] input,
[data-designer-id] select,
[data-designer-id] textarea,
[data-designer-id] button:not([data-editor-action]) {
  pointer-events: none !important;
}
```

### Why This Approach Works

- The CSS uses `[data-designer-id]` as the selector — only elements created by the designer are affected
- `!important` overrides Wave CSS's `.contents { display: contents !important; }`
- `::before` pseudo-elements provide labels without adding DOM elements that would appear in extractHTML()
- Non-container elements (wc-input, etc.) use `display: revert` to restore their normal rendering
- Form inputs have `pointer-events: none` so clicking them triggers selection, not focus

### At Save Time

The `<style id="editor-mode-css">` is NOT part of the component DOM — it's injected into the iframe head. The `extractHTML()` function only reads `#editor-canvas` innerHTML, so the edit-mode CSS is automatically excluded.

---

## Layer 2: Overlays (Parent Window)

### Overlay Structure (in parent, NOT in iframe)

```html
<div class="ld-overlay-container" style="position: absolute; top: 0; left: 0; pointer-events: none; z-index: 10;">
  <!-- Hover highlight — single reusable div -->
  <div class="ld-hover-overlay" style="display: none;"></div>

  <!-- Selection highlight — single reusable div -->
  <div class="ld-select-overlay" style="display: none;"></div>

  <!-- Element badge — shows type name -->
  <div class="ld-badge" style="display: none;"></div>

  <!-- Floating toolbar — actions for selected element -->
  <div class="ld-floating-toolbar" style="display: none;">
    <button data-action="move-up" title="Move Up">↑</button>
    <button data-action="move-down" title="Move Down">↓</button>
    <span class="separator"></span>
    <button data-action="duplicate" title="Duplicate">⧉</button>
    <button data-action="delete" title="Delete">✕</button>
  </div>

  <!-- Drop insertion line -->
  <div class="ld-drop-line" style="display: none;"></div>
</div>
```

### Overlay Positioning

Overlays are positioned in the **parent window's coordinate space** by translating iframe element coordinates:

```javascript
function getOverlayPosition(iframeElement) {
  const iframe = document.querySelector('.ld-canvas-iframe');
  const iframeRect = iframe.getBoundingClientRect();
  const elementRect = iframeElement.getBoundingClientRect();

  return {
    top: iframeRect.top + elementRect.top,
    left: iframeRect.left + elementRect.left,
    width: elementRect.width,
    height: elementRect.height
  };
}
```

### Overlay Styles

```css
/* Hover overlay */
.ld-hover-overlay {
  position: absolute;
  pointer-events: none;
  outline: 1px solid #3b97e3;
  z-index: 11;
  transition: all 0.1s ease;
}

/* Selection overlay */
.ld-select-overlay {
  position: absolute;
  pointer-events: none;
  outline: 2px solid #3b97e3;
  z-index: 12;
}

/* Badge */
.ld-badge {
  position: absolute;
  background: #3b97e3;
  color: #fff;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 2px;
  font-family: system-ui, sans-serif;
  white-space: nowrap;
  z-index: 13;
  pointer-events: none;
}

/* Floating toolbar */
.ld-floating-toolbar {
  position: absolute;
  background: #ffffff;
  border-radius: 6px;
  padding: 4px;
  display: flex;
  gap: 2px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.15);
  z-index: 14;
  pointer-events: all;
}
.ld-floating-toolbar button {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 14px;
  color: #555;
}
.ld-floating-toolbar button:hover {
  background: #f0f0f0;
  color: #3b97e3;
}
.ld-floating-toolbar .separator {
  width: 1px;
  background: #e0e0e0;
  margin: 2px 4px;
}

/* Drop line */
.ld-drop-line {
  position: absolute;
  height: 2px;
  background: #3b97e3;
  pointer-events: none;
  z-index: 15;
  border-radius: 1px;
}
.ld-drop-line::before,
.ld-drop-line::after {
  content: '';
  position: absolute;
  top: -3px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b97e3;
}
.ld-drop-line::before { left: -4px; }
.ld-drop-line::after { right: -4px; }
```

### How Overlays Interact with the Iframe

The parent listens for postMessage events from the iframe:

**Hover:** iframe detects mouseover on a `[data-designer-id]` element → sends `{ action: 'hover', designerId, rect: { top, left, width, height } }` → parent positions hover overlay.

**Selection:** iframe detects click → sends `{ action: 'select', designerId, type, properties, rect, ancestors }` → parent positions selection overlay + badge + toolbar, updates property panel, updates breadcrumb.

**Dehover:** iframe detects mouseout → sends `{ action: 'dehover' }` → parent hides hover overlay.

**Deselect:** iframe detects click on canvas background → sends `{ action: 'deselect' }` → parent hides selection overlay + badge + toolbar.

---

## Layer 3: Navigation

### Layer Panel (Tree View)

Located in the left panel, below the palette tabs (or as a fourth tab). Shows all elements in a hierarchical tree.

```
▼ 📄 wc-form
  ├ ⌸ wc-input [title] *
  ├ 📝 wc-textarea [description] *
  ├ 📅 wc-input [release_date]
  └ ▤ wc-select [category] *
```

**Each row shows:**
- Expand/collapse triangle (containers only)
- Type icon (small, 14px) — different per component type
- Component name or `[data-scope]` if set
- `*` indicator for required fields
- Indent: 16px per nesting level

**Row interactions:**
- Hover → highlight row + highlight element on canvas
- Click → select element (syncs canvas selection + property panel)
- Drag → reorder within parent container
- Right-click → context menu (duplicate, delete, move up/down)

**Row height:** 28px
**Font:** 12px, monospace for element names

### Breadcrumb Bar

Fixed at the bottom of the designer, full width, 28px height.

```
Body > wc-form > wc-input[title]
```

**Each segment:**
- Clickable — selects that ancestor
- Shows: element tag name (e.g., `wc-form`) or tag + scope (e.g., `wc-input[title]`)
- Separator: ` › ` (thin chevron)
- Last segment (selected): bold, blue text
- Other segments: gray text, blue on hover, underline on hover
- Font: 11px system-ui

---

## Canvas Area Specification

### Background
- Color: `var(--surface-3)` in dark mode, `#e5e5e5` in light mode
- No dot grid pattern — clean background

### Page Card (iframe)
- Background: `var(--surface-1)` (the actual page background)
- Shadow: `0 2px 20px rgba(0,0,0,0.1)`
- No border-radius (represents a browser viewport)
- Margin: 16px from canvas area edges
- Width: responsive to device preset or 100%
- Scrolls independently from the designer shell

---

## Drop Targeting

### The Flow

1. User starts dragging from palette → iframe's pointer-events set to `none`
2. Parent detects drop on canvas area → sends `addComponent` to iframe
3. OR: for nested container drops, overlay rects for containers have `pointer-events: all` during drag and accept drops
4. The iframe creates the real component, assigns `data-designer-id`, and reports back

### Nested Container Detection

When the parent receives a drop event during drag-over, it needs to determine which container to target. Since the overlay is disabled during drag (to allow the canvas to receive events), the parent uses the currently selected component as the drop target if it's a container.

Alternative: Before drag starts, the parent requests a "container map" from the iframe — a list of all container elements with their bounding rects. During drag-over, the parent hit-tests against this map to determine the deepest container under the cursor.

### Drop Indicator

The blue insertion line shows between siblings:
- Horizontal line with small circles at each end
- Positioned between elements based on cursor Y position
- Snaps to the gap between the nearest siblings

---

## Property Panel

### When Nothing Selected
Shows: "Select a component to edit its properties"

### When Selected
Shows:
- **Component type** (bold, e.g., "wc-input")
- **Designer ID** (small, gray)
- **Separator line**
- **Common properties:** Data Scope, Name, Label, CSS Classes
- **Type-specific properties:** based on component type (see existing implementation)
- **Data binding section:** scope field + sample data indicator

### Property Changes
When a property changes, the parent sends `updateProperty` to the iframe, which updates the real component's attributes.

---

## Save Pipeline

### Step 1: Extract HTML
Request iframe's `extractHTML()` which:
- Clones `#editor-canvas`
- Removes the `<style id="editor-mode-css">` (it's in `<head>`, not in canvas)
- Removes `data-designer-id` attributes from all elements
- Returns clean HTML

### Step 2: Transform to Pongo2
For each element with `data-scope`:
- String fields: `value="Jane"` → `value="{{ Record.first_name }}"`
- Booleans: `checked` → `{% if Record.is_active %} checked {% endif %}`
- Selects with lookup: replace options with `{% for %}` loop
- Currency: add `|floatformat:2` filter

### Step 3: Wrap in Template
```html
{% extends "__template_name__" %}
{% block css %}{% endblock %}
{% block pageContent %}
<wc-article-skeleton ...></wc-article-skeleton>
<div class="page-content ...">
  <wc-breadcrumb>...</wc-breadcrumb>
  <wc-save-split-button ...></wc-save-split-button>
  <wc-tab animate>
    <wc-tab-item class="active" label="General">
      <wc-form ...>
        {% include "meta_fields" %}
        ${transformedHTML}
        <wc-hotkey keys="ctrl+s" target="button.save-btn"></wc-hotkey>
      </wc-form>
    </wc-tab-item>
    <wc-tab-item label="Change Log">...</wc-tab-item>
  </wc-tab>
</div>
{% endblock %}
```

### Step 4: Generate Code Tab
Using TemplateCraft or inline generation — runGet, runPut, runPost, runDelete.

### Step 5: Save
POST to `{api-base-url}/api/...` with complete `_template_builder` document.

---

## Color Scheme

| Purpose | Color | Usage |
|---------|-------|-------|
| Hover outline | `#3b97e3` 1px solid | Hovering any element |
| Selection outline | `#3b97e3` 2px solid | Selected element |
| Badge background | `#3b97e3` | Element type badge |
| Container dashed border | `rgba(0,120,255,0.25)` | Edit-mode container hint |
| Container label | `rgba(0,120,255,0.5)` | `::before` label text |
| Drop insertion line | `#3b97e3` | Drop position indicator |
| Floating toolbar bg | `#ffffff` | White with shadow |
| Floating toolbar icons | `#555` / `#3b97e3` hover | Gray default, blue hover |
| Canvas background | `var(--surface-3)` | Workspace behind page |
| Breadcrumb bg | `var(--surface-2)` | Bottom bar |
| Layer panel selected | `rgba(59,151,227,0.15)` | Selected row |

---

## Implementation Order

### Phase A: Edit-Mode CSS Injection
1. Create the edit-mode CSS string
2. On `canvasReady`, inject it into iframe `<head>` via postMessage
3. Verify containers are visible with dashed borders and labels
4. Verify non-container elements render normally

### Phase B: Overlay System in Parent
1. Add overlay container div to parent (outside iframe)
2. Implement hover overlay positioning (iframe sends rect on mouseover)
3. Implement selection overlay + badge + toolbar
4. Wire toolbar actions (move up/down, duplicate, delete)

### Phase C: Layer Panel
1. Add tree view to left panel
2. Build tree from iframe's component registry
3. Sync selection between tree and canvas
4. Support drag-to-reorder in tree

### Phase D: Breadcrumb Bar
1. Add breadcrumb bar at bottom of designer
2. On selection, build ancestor path from iframe
3. Click segment to select ancestor

### Phase E: Drop Targeting
1. Palette drag disables iframe pointer-events (existing)
2. Drop on canvas creates component (existing)
3. Add container-aware drop targeting using selected component or container map
4. Show drop insertion line

### Phase F: Save/Load Pipeline
1. extractHTML with scope transformation
2. Template wrapping
3. Code tab generation
4. Save to API

### Phase G: Polish
1. Keyboard shortcuts
2. Undo/redo (optional)
3. Source view toggle
4. Real record loading by ID

---

## Files

| File | Purpose |
|------|---------|
| `src/js/components/wc-live-designer.js` | Parent component — overlays, panels, toolbar, save |
| `views/live-designer-canvas.html` | Iframe document — edit-mode CSS, component creation, event forwarding |
| `views/live-designer-test.html` | Standalone test page |
| `docs/LIVE-DESIGNER-SPEC.md` | This specification |
