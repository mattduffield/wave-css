# wc-live-designer — Implementation Plan

## Overview

A new web component (`wc-live-designer`) that provides a Weebly-like visual design experience for building Go Kart screens. Users drag real Wave CSS components onto a live canvas, see them render with sample/real data, and the output is stored as standard HTML in `_template_builder.content` — identical to hand-coded templates.

## Core Architecture

### The Key Insight

**The visual designer produces the same HTML you'd hand-code.** There is no JSON intermediate format. The output is a standard `_template_builder` record with `content` (HTML+Pongo2), `code` (JavaScript), and `field_rules` (JSON) — the same format every existing template uses.

### Rendering Stack

```
┌──────────────────────────────────────────────────────────────────┐
│  wc-live-designer (parent window)                                │
│  ┌────────────┐  ┌─────────────────────────────┐  ┌──────────┐  │
│  │ Left Panel  │  │  Canvas Iframe               │  │ Right    │  │
│  │             │  │  ┌─────────────────────────┐ │  │ Panel    │  │
│  │ Containers  │  │  │ wave-css.min.css        │ │  │          │  │
│  │ Elements    │  │  │ wave-css.min.js          │ │  │ Properti │  │
│  │ Fields      │  │  │ editor-bridge.js         │ │  │ es       │  │
│  │ (from       │  │  │                          │ │  │          │  │
│  │  schema)    │  │  │ Real components render:  │ │  │ Field    │  │
│  │             │  │  │ ┌──────┐ ┌──────┐       │ │  │ Rules    │  │
│  │             │→ │  │ │Jane  │ │Doe   │       │ │→ │          │  │
│  │             │  │  │ └──────┘ └──────┘       │ │  │ Source   │  │
│  │             │  │  │ ┌──────────────────┐    │ │  │ View     │  │
│  │             │  │  │ │jane@example.com  │    │ │  │          │  │
│  │             │  │  │ └──────────────────┘    │ │  │          │  │
│  │             │  │  └─────────────────────────┘ │  │          │  │
│  └────────────┘  └────────────↕──────────────────┘  └──────────┘  │
│                          postMessage                              │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Design Time:
  Schema → sample data (or real record via ID)
  User drags components → real web components render in iframe
  Components show sample/real data values

Save Time:
  Iframe DOM → extract HTML
  Replace sample values with Pongo2 expressions based on data-scope
  Wrap in {% extends "__template_name__" %} + {% block pageContent %}
  Store in _template_builder.content

Runtime:
  Pongo2 renders HTML with real data from MongoDB
  Identical behavior to hand-coded templates

Re-edit:
  Load content from _template_builder
  Parse HTML, find data-scope attributes
  Replace Pongo2 expressions with sample/real data
  Render in iframe — user continues editing
```

## Storage: _template_builder Record

The visual designer produces a standard `_template_builder` document:

```json
{
  "name": "Invoice",
  "slug": "invoice",
  "collection_name": "invoice",
  "schema": "invoice",
  "schema_slug": "invoice",
  "template_type": "standard",
  "screen_type": "standard",
  "route_prefix": "x",
  "route_record_id": "true",
  "route_prev_template_slug": "invoice_list",
  "route_next_template_slug": "",
  "depend_full_request": "base",
  "depend_partial_request": "partial-base",
  "depends": ["base", "loader", "partial-base"],
  "collections": ["_web_pilot"],
  "lookups": ["us_states", "status_type"],
  "content": "{% extends \"__template_name__\" %}\n{% block pageContent %}...\n{% endblock %}",
  "code": "function runGet() { ... }\nfunction runPut() { ... }",
  "field_rules": "{ \"prior_coverage\": { \"visible\": ... } }",
  "designed_with": "visual",
  "is_active": true,
  "record_status": "Development",
  "version_number": "0.01"
}
```

The `designed_with: "visual"` flag tells the system to open `wc-live-designer` for re-editing instead of the Code Mirror editor.

## Pongo2 Binding Transformation Rules

At save time, the designer transforms live components into Pongo2 templates:

### Simple Fields
```
Design:  <wc-input name="first_name" value="Jane" data-scope="first_name">
Saved:   <wc-input name="first_name" value="{{ Record.first_name }}" data-scope="first_name">
```

### Nested Object Fields
```
Design:  <wc-input name="address.street" value="123 Main" data-scope="address.street">
Saved:   <wc-input name="address.street" value="{{ Record.address.street }}" data-scope="address.street">
```

### Boolean (Checkbox/Toggle)
```
Design:  <wc-input type="checkbox" toggle-switch checked data-scope="is_active">
Saved:   <wc-input type="checkbox" toggle-switch {% if Record.is_active %} checked {% endif %} data-scope="is_active">
```

### Select with Enum
```
Design:  <wc-select name="status" data-scope="status" data-enum="active,inactive,pending">
           <option value="">Choose...</option>
           <option value="active" selected>Active</option>
           <option value="inactive">Inactive</option>
           <option value="pending">Pending</option>
         </wc-select>
Saved:   <wc-select name="status" data-scope="status">
           <option value="">Choose...</option>
           <option value="active">Active</option>
           <option value="inactive">Inactive</option>
           <option value="pending">Pending</option>
         </wc-select>
```

### Select with Lookup
```
Design:  <wc-select name="address.state" data-scope="address.state" data-lookup="us_states">
           <option value="NC">North Carolina (sample)</option>
         </wc-select>
Saved:   <wc-select name="address.state" data-scope="address.state">
           <option value="">Choose...</option>
           {% set state = Record.address.state %}
           {% for item in Lookups.us_states.item_list %}
           <option value="{{item.value}}"{% if state == item.value %} selected{% endif %}>{{item.key}}</option>
           {% endfor %}
         </wc-select>
```

### Select with Collection
```
Design:  <wc-select name="script_id" data-scope="script_id" data-collection="_web_pilot"
           data-display-member="name" data-value-member="_id">
           <option>Nat Gen (sample)</option>
         </wc-select>
Saved:   <wc-select name="script_id" data-scope="script_id"
           url="/api/_web_pilot" display-member="name" value-member="_id"
           results-member="results" sort="asc">
         </wc-select>
```

### Array of Objects (Fieldset Card)
```
Design:  Shows ONE card with sample member data
         <div class="card-host">
           <div class="card-item" data-scope-array="household_members">
             <wc-input name="household_members.0.first_name" value="Jane" data-scope="first_name">
           </div>
         </div>

Saved:   {% if Record.household_members %}
         <div class="card-host flex flex-wrap gap-4">
           {% for item in Record.household_members %}
           <div class="card-item flex flex-col p-4 gap-4 border border-solid rounded-md primary-border-color card relative">
             <wc-input name="household_members.{{ forloop.Counter0 }}.first_name" value="{{ item.first_name }}">
             ...delete button...
           </div>
           {% endfor %}
         {% else %}
           <div class="no-data">NO DATA</div>
         {% endif %}
         </div>
```

### Currency/Number
```
Design:  <wc-input type="currency" value="1500.00" data-scope="household_income">
Saved:   <wc-input type="currency" value="{{ Record.household_income|floatformat:2 }}" data-scope="household_income">
```

## Design-Time Data Loading

### Option 1: Sample Data from Schema Defaults
The schema's `default` values populate fields. For strings: `""`, booleans: `true/false`, numbers: `0`. The designer can generate richer sample data from field names (e.g., "first_name" → "Jane", "email" → "jane@example.com").

### Option 2: Load a Real Record by ID
The designer has a "Load Record" control where the user enters a record ID (or picks from a list). The designer fetches:
```
GET /api/{collection_name}/{record_id}
```
The real record data populates all bound components. This gives the most accurate preview.

### Option 3: Auto-Generate from Schema
TemplateCraft-style inference generates meaningful sample data from field types and names.

The designer supports all three — defaulting to Option 3, with Option 2 available via the properties panel.

## Resource Auto-Discovery

### Lookups
When the user binds a `wc-select` to a field and configures it as "lookup" mode, the designer:
1. Fetches available lookups: `GET /api/_lookup?size=100`
2. Shows a dropdown of lookup names in the property panel
3. When selected, fetches the lookup's `item_list` and populates the select options
4. Stores `data-lookup="lookup_name"` on the element
5. At save time, adds the lookup name to `_template_builder.lookups[]`

### Collections
When the user binds a `wc-select` to a field and configures it as "collection" mode, the designer:
1. Fetches available collections: `GET /api/list-collections`
2. Shows a dropdown in the property panel
3. User selects collection, display-member, value-member
4. Stores `data-collection`, `data-display-member`, `data-value-member` on the element
5. At save time, adds the collection to `_template_builder.collections[]`

### Depends
The designer always includes `["base", "loader", "partial-base"]` as depends. If the user adds `{% include "fragment_slug" %}` via the Source View, the designer detects includes and adds them to depends.

### Schema
When a schema is selected/loaded, the designer:
1. Fetches schema list: `GET /api/_schema_builder?size=100`
2. User picks a schema → the Fields palette populates from schema properties
3. The schema slug is stored in `_template_builder.schema`

## Component Palette

### Containers Tab
Same as current wc-page-designer: div, row, column, fieldset, wc-form, wc-tab, wc-tab-item, wc-accordion, wc-dropdown, etc.

### Elements Tab
Same as current: all wc-input variants, wc-select variants, wc-textarea, wc-field, wc-fa-icon, skeletons, etc.

### Fields Tab (Schema-Driven)
When a schema is loaded, each schema property becomes a draggable item that creates a **pre-configured component**:
- `string` → `wc-input` with scope, label, required pre-set
- `string @email` → `wc-input type="email"`
- `string @format(date-time)` → `wc-input type="date"`
- `string @enum(...)` → `wc-select` with options pre-populated
- `boolean` → `wc-input type="checkbox" toggle-switch`
- `number` → `wc-input type="currency"` (or number)
- `object @ref(Address)` → `fieldset` with nested fields
- `array(@ref(Member))` → `fieldset-card` with add/delete pattern
- `array(string)` → `wc-select mode="chip" allow-dynamic`

This inference logic already exists in TemplateCraft's `inferControl()`.

## Code Tab Generation

When saving, the designer auto-generates the code tab using TemplateCraft's `generateEditCode()`:
- `runGet()` with `CreateNew` for "create" or `FindByID` for existing
- `runPut()` / `runPost()` with `SaveAndValidate`, array detection
- `runDelete()` with array item deletion support

Users can customize the code tab via the Source View.

## Field Rules Generation

When saving, the designer auto-generates basic field rules from schema `allOf` conditionals using TemplateCraft's `generateFieldRules()`. Users can customize via the Rules panel (already exists in wc-page-designer) or via Source View.

## Editor Bridge (iframe script)

The `editor-bridge.js` script runs inside the iframe and handles:

### Selection
- Click a component → highlight with overlay border
- Show resize handles for containers
- Send `componentSelected` message to parent with component type + properties

### Drag & Drop
- Accept drops from parent palette (via drag events or postMessage)
- Show drop indicator (blue line) between components
- Use SortableJS for reordering within containers

### Component Registry
- Map of `designerId` → DOM element + metadata
- Each component gets a `data-designer-id` attribute
- Tracks scope bindings, container relationships

### Overlay Layer
- Transparent div overlay that shows selection rectangles
- Floating toolbar on selected component (delete, duplicate, move up/down)
- Hover outlines on components
- Drop indicators during drag

### Sample Data Resolution
- Receives sample/real data from parent via postMessage
- When a component's scope is set, populates its value from the data
- Handles nested paths: `address.street` → `data.address.street`

## Source View Toggle

A tab or split-pane that shows the raw HTML+Pongo2 alongside the visual canvas. Changes in either view sync to the other:
- Edit in visual → HTML updates in source view
- Edit in source → visual canvas re-renders (with sample data)

The source view uses `wc-code-mirror` with HTML/Pongo2 syntax highlighting — the same editor used in the current template Content tab.

## Responsive Preview (Chrome DevTools Style)

The designer includes a responsive toolbar above the iframe canvas, matching Chrome DevTools' device emulation pattern:

### Toolbar Layout
```
[ Device Dropdown ▼ ] [ 375 ] x [ 667 ] [ ↻ Rotate ] [ Zoom: Fit ▼ ]
```

### Controls
1. **Device Dropdown** — select preset or "Responsive" (free-form)
2. **Width × Height inputs** — editable in Responsive mode, read-only for presets
3. **Rotate button** — swaps width/height (portrait ↔ landscape)
4. **Zoom dropdown** — 50%, 75%, 100%, 125%, 150%, "Fit to window"
5. **Draggable edges** — in Responsive mode, drag the right/bottom edges of the iframe to resize freely

### Device Presets

```javascript
static DEVICE_PRESETS = [
  // Responsive (free-form)
  { name: 'Responsive', width: 0, height: 0, dpr: 1, type: 'responsive', icon: 'desktop' },

  // Phones
  { name: 'iPhone SE', width: 375, height: 667, dpr: 2, type: 'phone' },
  { name: 'iPhone XR', width: 414, height: 896, dpr: 2, type: 'phone' },
  { name: 'iPhone 12 Pro', width: 390, height: 844, dpr: 3, type: 'phone' },
  { name: 'iPhone 14 Pro Max', width: 430, height: 932, dpr: 3, type: 'phone' },
  { name: 'iPhone 15 Pro', width: 393, height: 852, dpr: 3, type: 'phone' },
  { name: 'iPhone 16 Pro Max', width: 440, height: 956, dpr: 3, type: 'phone' },
  { name: 'Pixel 7', width: 412, height: 915, dpr: 2.625, type: 'phone' },
  { name: 'Pixel 9 Pro XL', width: 412, height: 924, dpr: 2.625, type: 'phone' },
  { name: 'Samsung Galaxy S8+', width: 360, height: 740, dpr: 4, type: 'phone' },
  { name: 'Samsung Galaxy S20 Ultra', width: 412, height: 915, dpr: 3.5, type: 'phone' },
  { name: 'Samsung Galaxy A51/71', width: 412, height: 914, dpr: 2.625, type: 'phone' },

  // Tablets
  { name: 'iPad Mini', width: 768, height: 1024, dpr: 2, type: 'tablet' },
  { name: 'iPad Air', width: 820, height: 1180, dpr: 2, type: 'tablet' },
  { name: 'iPad Pro', width: 1024, height: 1366, dpr: 2, type: 'tablet' },
  { name: 'Surface Pro 7', width: 912, height: 1368, dpr: 2, type: 'tablet' },
  { name: 'Surface Duo', width: 540, height: 720, dpr: 2.5, type: 'tablet' },
  { name: 'Galaxy Tab S4', width: 712, height: 1138, dpr: 2.25, type: 'tablet' },
  { name: 'Galaxy Z Fold 5', width: 344, height: 882, dpr: 3, type: 'tablet' },
  { name: 'Asus Zenbook Fold', width: 853, height: 1280, dpr: 2, type: 'tablet' },

  // Other
  { name: 'Nest Hub', width: 1024, height: 600, dpr: 2, type: 'other' },
  { name: 'Nest Hub Max', width: 1280, height: 800, dpr: 2, type: 'other' },
];
```

### Dropdown Grouping
The device dropdown groups presets with separators:
```
─ Responsive
──────────
Phones
  iPhone SE (375 × 667)
  iPhone XR (414 × 896)
  iPhone 12 Pro (390 × 844)
  ...
──────────
Tablets
  iPad Mini (768 × 1024)
  iPad Air (820 × 1180)
  iPad Pro (1024 × 1366)
  ...
──────────
Other
  Nest Hub (1024 × 600)
  Nest Hub Max (1280 × 800)
```

### Behavior
- **Responsive mode**: iframe fills available space, edges are draggable, width/height editable
- **Device preset**: iframe snaps to exact dimensions, centered in the canvas area with a background grid. Width/height inputs show preset values (read-only).
- **Rotate**: swaps width ↔ height. Works for both presets and custom.
- **Zoom**: scales the iframe visually (CSS transform) without changing the CSS pixel dimensions. "Fit to window" calculates the best scale to show the full viewport.

### Wave CSS Responsive Classes
Since Wave CSS uses breakpoint prefixes (`sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`, `2xl:1536px`), resizing the iframe triggers real responsive behavior. Components with `sm:grid-2 md:grid-4` reflow exactly as they would on a real device.

### Optional: Media Query Bar
Like Chrome, an optional bar above the viewport shows colored indicators at Wave CSS breakpoint widths:
- `sm:640px` | `md:768px` | `lg:1024px` | `xl:1280px` | `2xl:1536px`
Clicking a breakpoint snaps the viewport to that width.

## Implementation Phases

### Phase 1: Proof of Concept — Live Preview Tab
- Add a new "Live Preview" tab to the existing wc-page-designer
- Load current page's JSON layout as real components in an iframe with sample data
- Read-only — just for seeing what it looks like
- **Validates the iframe + Wave CSS rendering approach**

### Phase 2: New Component — wc-live-designer
- Create `wc-live-designer` as a new component
- Iframe canvas with editor-bridge.js
- Component palette (Containers, Elements, Fields)
- Property panel with data binding controls
- Drag-and-drop from palette to canvas
- Selection + floating toolbar in iframe
- Sample data resolution

### Phase 3: Save/Load Pipeline
- Save: extract iframe DOM → transform to Pongo2 → store in _template_builder
- Load: read content from _template_builder → replace Pongo2 with sample data → render in iframe
- Code tab auto-generation via TemplateCraft
- Field rules auto-generation from schema

### Phase 4: Advanced Features
- Source View toggle (live HTML editing alongside visual canvas)
- Load real record by ID for design-time binding
- Responsive breakpoint preview
- Undo/redo
- Schema Fields palette with inference-based component creation
- Auto-discover lookups and collections from API

### Phase 5: Integration
- Add "designed_with: visual" flag to _template_builder
- Template list shows visual vs hand-coded indicator
- "Edit in Designer" button opens wc-live-designer
- "Edit Source" button opens current Code Mirror editor
- TemplateCraft's `/generate` command can optionally open in the designer

## File Structure

```
src/js/components/
  wc-live-designer.js          — Main component (parent frame)
  wc-live-designer-bridge.js   — Editor bridge (runs in iframe)

views/
  live-designer.html           — Demo/test page
  live-designer-canvas.html    — Iframe canvas document

docs/
  LIVE-DESIGNER-PLAN.md        — This document
```

## Questions Resolved

1. ✅ HTML-native approach (no JSON intermediate)
2. ✅ Store in _template_builder with `designed_with: "visual"` flag
3. ✅ Auto-discover lookups via `/api/_lookup`, collections via `/api/list-collections`
4. ✅ Array bindings show one card with sample data; real record loadable by ID
5. ✅ Source View toggle for advanced users

## Dependencies

- **Wave CSS** — component library (loaded in iframe)
- **TemplateCraft** — inference engine for Fields palette + code/field-rules generation
- **LiteSpec** — schema parsing for Fields palette
- **Go Kart API** — lookup/collection/schema/record data at design time
- **SortableJS** — drag-and-drop (already used by wc-page-designer)
