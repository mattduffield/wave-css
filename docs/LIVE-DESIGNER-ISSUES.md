# wc-live-designer — Open Issues

Status as of 2026-03-23. Updated with resolved items.

## Resolved
- ✅ Drag ghost clipping — fixed with custom drag image at document.body level
- ✅ Fields drop outside containers — fixed with inner wrapper resolution in findDropTarget
- ✅ Form layout shifts — fixed by moving overlays inside iframe
- ✅ Canvas background — dark theme, edit chrome with sufficient contrast
- ✅ Component input dark background — respects theme
- ✅ Drop position ordering — fixed by saving position during dragover
- ✅ Required checkbox not showing — fixed boolean attribute comparison
- ✅ Elements tab not scrolling — fixed with flex-based layout
- ✅ Preview mode — per-element toggle via inline pointer-events (not CSS classes)
- ✅ Container visibility — edit-mode CSS with data-designer-container attribute
- ✅ Schema fields alphabetically sorted
- ✅ wc-select all 7 binding patterns documented and property panel updated

## Critical Issues

### 1. Drag ghost clipped by panel boundaries
**What happens:** When dragging a palette item (e.g., "Form"), the browser's semi-transparent drag ghost and the blue dashed canvas-dragover indicator get clipped at the panel edges.
**Root cause:** The parent layout uses flex panels with overflow constraints. The drag ghost is a browser-native feature that renders relative to the drag source element — if the source is inside a panel with `overflow: hidden` or clipping, the ghost is clipped.
**Fix needed:** Either use a custom drag image positioned at the document level, or ensure no ancestor of the palette items clips overflow during drag. May need to set `overflow: visible` on all ancestors during drag start and restore on drag end.

### 2. Fields drop outside containers (not nested correctly)
**What happens:** Dropping Title from Fields tab lands it as a sibling of the Form, not inside it. The Title appears below the Form's dashed boundary.
**Root cause:** The iframe's drop handler uses `document.elementFromPoint(e.clientX, e.clientY)` which may hit the inner `<form class="wc-form">` element (created by the component's constructor), not the outer `<wc-form data-designer-id="...">`. The `closest('[data-designer-id]')` traversal may not reach the right container. Also, the parent's drop handler sends `parentId: null` unless a container is explicitly selected.
**Fix needed:** The drop handler must walk up from `elementFromPoint` result to find the nearest `[data-designer-id]` ancestor that is a container type. If found, use that as the parentId. The field should be appended to the inner form element (`.wc-form`) since that's where children actually render at runtime.

### 3. Form "morphs" / layout shifts on click/deselect
**What happens:** After dropping the Title outside the Form, clicking the canvas causes the Title to jump inside the Form. The Form's visual boundary changes size unexpectedly.
**Root cause:** The selection overlay (positioned in the parent) adds/removes visual outlines that affect perceived layout. Also, the edit-mode CSS `min-height: 120px` on the container conflicts with the component's natural sizing once it has children. The `:not(:has([data-designer-id]))` selector may be recalculating as events fire.
**Fix needed:** The edit-mode CSS should not use min-height that exceeds the natural content height once children are present. The container should grow naturally with its children. The overlay positioning should not cause visual jumps.

### 4. Canvas background — dark vs light
**What happens:** User prefers dark background but containers and components need to be clearly visible.
**Decision needed:** Either:
- Use dark canvas with components that have their own background (the Wave CSS theme handles this)
- Use light canvas workspace with dark sidebar panels (like Webflow)
- Let the user's selected theme apply to the canvas, but ensure edit-mode chrome (dashed borders, labels) has sufficient contrast
**User preference:** Dark background preferred. The edit-mode CSS dashed borders and labels need to be visible on dark backgrounds. Use colors with sufficient contrast: lighter blue borders `rgba(100, 160, 255, 0.5)`, brighter labels.

### 5. wc-input renders with dark background
**What happens:** The wc-input component renders with `var(--component-bg-color)` which in the ocean dark theme is very dark. On a white canvas it looks like a black bar. On a dark canvas it's invisible.
**Root cause:** The iframe loads Wave CSS which applies the theme. Components render according to the theme.
**Fix needed:** The canvas should use the same theme the user has selected. The edit-mode CSS should ensure edit chrome (borders, labels) contrasts with whatever theme is active. Don't force white or dark — respect the theme.

## Architecture Issues

### 6. Edit-mode CSS complexity
The current edit-mode CSS is large and fragile. It needs to handle:
- Every container type
- The `.contents` class override
- Inner elements created by constructors (e.g., `<form class="wc-form">`)
- `:empty` vs `:not(:has(...))` for detecting empty containers
- Non-container elements reverting to normal display
- Form input pointer-events blocking

Each new component type requires updating the CSS. This doesn't scale.

**Better approach:** Instead of listing every component type, use a more generic approach:
```css
/* Any element with designer-id that has the contents class */
[data-designer-id].contents {
  display: block !important;
}
/* Any element marked as a container */
[data-designer-id][data-designer-container] {
  min-height: 40px;
  border: 1px dashed ...;
}
```
Have the addComponent function set `data-designer-container` on container types. This way the CSS doesn't need to know component names.

### 7. Drop targeting needs iframe-side intelligence
The parent window cannot accurately determine drop targets inside the iframe because:
- It can't call `elementFromPoint` on the iframe's document
- It doesn't know the iframe's scroll position
- The iframe's internal DOM structure (inner wrappers like `.wc-form`) isn't visible to the parent

**Better approach:** The iframe should handle ALL drop targeting. The parent sends a `dragEnter` / `dragMove` / `dragDrop` message with coordinates, and the iframe determines the container + position and creates the component. The parent doesn't need to know about container nesting.

OR: During drag, completely disable the parent's drop handling and let the iframe receive native drag events. The current approach of disabling iframe pointer-events and catching drops in the parent is fighting the browser's native behavior.

### 8. Overlay positioning is unreliable
The parent overlays (hover, selection, badge, toolbar) are positioned by reading `getBoundingClientRect()` from the iframe and translating to parent coordinates. This breaks when:
- The iframe scrolls
- The canvas area scrolls
- The zoom level changes
- Components re-render and change size

**Better approach:** Consider putting the overlays back inside the iframe (where GrapesJS puts them) but as a separate overlay div layer — NOT as modifications to the components. This eliminates the coordinate translation problem entirely.

## UX Issues

### 9. No visual feedback when dragging over containers
When dragging a field over the Form container, there's no visual indication that the Form will receive the drop. Need:
- Container highlight (background tint + border color change)
- Insertion line showing where the component will land
- Both inside the iframe, not in the parent

### 10. Property panel shows wrong data
When selecting the Form, Name and Label are empty. The property panel needs to be smarter about what properties to show for each component type.

### 11. No Layer Panel (tree view)
Phase C from the spec is not implemented. Without a tree view, users can't:
- See the nesting hierarchy
- Select invisible containers
- Reorder components
- Understand the structure of their design

### 12. Breadcrumb works but isn't tested
The breadcrumb bar at the bottom was added but not verified. Click-to-select-ancestor functionality needs the iframe to support a `selectById` message.

## Files

| File | Lines | Purpose |
|------|-------|---------|
| `src/js/components/wc-live-designer.js` | ~1200 | Parent component |
| `views/live-designer-canvas.html` | ~300 | Iframe canvas |
| `views/live-designer-test.html` | ~50 | Test page |
| `docs/LIVE-DESIGNER-SPEC.md` | ~400 | Architecture spec |
| `docs/LIVE-DESIGNER-ISSUES.md` | This file |

## Recommended Next Steps

1. **Revert canvas to dark theme** — respect user preference
2. **Fix drop targeting** — move ALL drop logic to iframe side
3. **Fix drag ghost clipping** — custom drag image or overflow fix
4. **Add `data-designer-container` attribute** — simplify edit-mode CSS
5. **Build Layer Panel** — this is the single most impactful UX improvement
6. **Test one complete flow end-to-end** before adding more features
