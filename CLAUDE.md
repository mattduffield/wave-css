# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

- **Project Type**: Web Component Library (Custom Elements, no Shadow DOM)
- **Language**: JavaScript ES6+
- **Build Tool**: esbuild
- **CSS Framework**: Custom CSS with extensive theming
- **Testing**: [Add your testing framework here]
- **Package Manager**: npm

## Build Commands

```bash
# Build all assets (JS and CSS bundles)
# Note: build automatically runs copy-fa-pro-svgs before bundling
# and auto-syncs dist/wave-css-0.0.1/ versioned folder including icon bundles
npm run build

# View components locally
python3 -m http.server 3015
```

## Architecture Overview

Wave CSS is a web component library that uses native Custom Elements without Shadow DOM. This design choice allows seamless integration with third-party libraries and frameworks.

### Core Architecture Principles

1. **No Shadow DOM**: Components use regular DOM with `classList.add('contents')` for CSS containment
2. **Inheritance-based**: All components extend `WcBaseComponent` or `WcBaseFormComponent`
3. **CSS Variables**: Extensive theming system using CSS custom properties
4. **Event-driven**: Custom EventHub for inter-component communication

### Component Lifecycle

1. Constructor → `_render()` → `connectedCallback()` → `_handleAttributeChange()`
2. Pending attributes are stored until component is ready
3. Child components are detected and awaited before initialization completes

### Key Base Classes

- `WcBaseComponent`: Foundation for all components, handles lifecycle, attributes, rendering, and `ready` promise
- `WcBaseFormComponent`: Extends base with form-specific functionality (value, name, validation)

### Ready Promise

All components expose `ready` (Promise) and `isReady` (boolean) for knowing when a component is fully initialized. Simple components resolve automatically at the end of `_connectedCallback()`. Async components (wc-tabulator, wc-code-mirror, wc-chart, wc-chart-builder, wc-pivot, wc-select with url, wc-table with url, wc-article-card with url) set `this._deferReady = true` in their constructor and call `this._setReady()` when truly ready.

```javascript
// JavaScript
await myComponent.ready;
myComponent.data = myData;

// Hyperscript
_="on load wait for me.ready set my.data to window.myData end"
```

### Event Communication Pattern

```javascript
// Broadcasting events
wc.EventHub.broadcast('component:action', [selector], data);

// Example: Form submission
wc.EventHub.broadcast('form:submit', ['wc-form#myForm'], formData);
```

### Attribute Handling

- Use `observedAttributes` static getter to define reactive attributes
- Special attributes: `class`, `name`, `elt-class` get special handling
- Complex attributes can be JSON strings that get parsed automatically

### Build Output

The build process (esbuild.config.js) generates:
- `wave-css.min.js` / `wave-css.js` - ESM bundles
- `wave-helpers.js` - IIFE bundle with helper functions
- `wave-css.min.css` / `wave-css.css` - CSS bundles with all themes

### Self-hosting third-party assets (`window.WaveAssetBase`)

Wave lazy-loads third-party libs (chart.js, CodeMirror, maplibre, dompurify, marked, prism, jspdf, luxon, transformers, …) from public CDNs. To self-host them (CDN-outage resilience) set a **single global before the bundle runs**:

```html
<script>window.WaveAssetBase = '/static/js';</script>
<script type="module" src="/static/js/wave-css-0.0.1/wave-css.min.js"></script>
```

- **Unset (default):** every asset loads from its original CDN URL — **no behavior change**.
- **Set:** each asset tries `${WaveAssetBase}/<lib>-<version>/<path-after-cdn-version>` **first**, and on any load failure (script `onerror`, stylesheet error/non-2xx, or `import()` rejection) **falls back to the original CDN URL** with one `console.warn` naming the missing local file. Covers all three load mechanisms; preserves lazy-loading + skip-if-already-present guards. Implemented centrally in `helper-function.js` (`waveLocalAssetUrl` + `loadScript`/`loadCSS`/`loadLibrary`/`waveImport`) so **progressively-loaded** files (e.g. CodeMirror modes/themes/addons pulled in as you use new languages) resolve locally too — and the loader dedups on **both** the local and CDN src, so a component's own CDN-url dedup check (wc-code-mirror does this) can't cause a double-load.

**Path rule:** normalize `<pkg>@<ver>` (jsdelivr/unpkg) and `<pkg>/<ver>` (cdnjs) both to `<pkg>-<ver>/`, keep the rest (no `vendor/` subfolder). `cdn.sheetjs.com` (xlsx export) is also recognized — its path already starts with the versioned folder, so it's mirrored verbatim under the base. e.g. `cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js` → `${base}/chart.js-4.4.1/dist/chart.umd.min.js`; `cdnjs…/codemirror/5.65.13/addon/dialog/dialog.min.js` → `${base}/codemirror-5.65.13/addon/dialog/dialog.min.js`. Unversioned URLs (unpkg `notie`), same-origin paths, and unknown hosts (`esm.run` web-llm) are left on their given URL. The same fallback also covers the **`WcDependencyManager`** loader (`src/js/utils/dependency-manager.js`) — which is how **IMask** (phone/date/currency masking in `wc-input` via `wc-mask-hub`), **CodeMirror core**, and **Tabulator core** load — not just the `helper-function.js` loaders. **Pinned versions to mirror** (folder → key file): `imask-7.6.1/imask.min.js`, `chart.js-4.4.1/dist/chart.umd.min.js`, `chartjs-plugin-datalabels-2.2.0/dist/…`, `codemirror-5.65.13/**` (whole tree — core `codemirror.min.js`/`.css` + addons/modes/themes/keymap), `cm-show-invisibles-3.1.0/lib/…`, `dompurify-3.0.9/purify.min.js`, `html2canvas-1.4.1/html2canvas.min.js`, `jspdf-2.5.1/jspdf.umd.min.js`, `jspdf-autotable-3.8.4/dist/…`, `luxon-2.3.1/build/global/luxon.min.js`, `maplibre-gl-4.7.1/dist/{maplibre-gl.js,maplibre-gl.css}`, `marked-12.0.2/marked.min.js`, `marked-4/lib/marked.esm.js`, `prism-1.29.0/**` (prism.min.js + components/ + themes/), `sweetalert2-11.15.10/dist/sweetalert2.all.js`, `tabulator-tables-6.3.0/dist/{js,css}/…`, `xlsx-0.20.3/package/dist/xlsx.full.min.js` (sheetjs — tabulator xlsx export), `turndown-7.1.3/turndown.min.js`, `@huggingface/transformers-3.5.0/`, `@xenova/transformers-2.17.2/`. Helpers exposed for hosts: `window.wc.waveLocalAssetUrl(url)` and `window.wc.waveImport(url)`.

### Theme System

- 40+ predefined color themes using CSS variables
- Themes modify `--hue` and related color variables
- `--chroma-mult` (default 1) is a saturation multiplier baked into the swatch ramp (`oklch(L calc(C * var(--chroma-mult,1)) var(--hue))`). Set it to 0 for a neutral/gray theme or a small value (e.g. 0.15) for a muted tint — a second axis beyond hue, so neutrals are possible
- Neutral themes: `theme-gray` (pure), `theme-silver` (cool), `theme-charcoal` (warm graphite) — gray surfaces via `--chroma-mult`, but keep a colored accent (`--primary-bg-color` overridden) so CTAs pop; they flip with light/dark (whitewashed ↔ charcoal). Vivid yellows: `theme-gold`, `theme-lemon`. Earth tones: `theme-sienna`, `theme-chocolate`, `theme-coffee`, `theme-tan` — hand-tuned warm low-lightness/muted ramps (browns can't come from the generator's vivid ramp); their own swatch-5 stays the accent
- Yellow & earth-tone themes use hand-tuned explicit swatch ramps (in the theme block) rather than the generator, because those colors need lightness/chroma outside the shared ramp. The colored-accent override for neutral + high-contrast themes lives LAST in `@layer wc.themes` so it wins over the `.light`/`.dark` surface mappings
- Components automatically adapt to the selected theme
- Theme selector component (`wc-theme-selector`) for runtime switching
- `theme-high-contrast` accessibility theme with WCAG AAA-level saturated semantic colors
- `prefers-color-scheme: light` auto-adjusts semantic colors one shade darker for white backgrounds

### Semantic State Colors

Four semantic color families with CSS variables and utility classes:
- **Success**: `--success-color` (#22c55e), `--success-light-color` — classes: `success-color`, `success-light-color`, `success-bg-color`, `success-border-color`
- **Danger**: `--danger-color` (#ef4444), `--danger-light-color` — classes: `danger-color`, `danger-light-color`, `danger-bg-color`, `danger-border-color`
- **Warning**: `--warning-color` (#f59e0b), `--warning-light-color` — classes: `warning-color`, `warning-light-color`, `warning-bg-color`, `warning-border-color`
- **Info**: `--info-color` (#3b82f6), `--info-light-color` — classes: `info-color`, `info-light-color`, `info-bg-color`, `info-border-color`

**Badge variants** — semantic status pills: `badge badge-success`, `badge badge-warning`, `badge badge-danger`, `badge badge-info`, `badge badge-muted`, `badge badge-primary`. Badge **foreground** is the accent mixed 55% toward `--text-1` (`color-mix(in srgb, var(--success-color) 55%, var(--text-1))`), so it stays WCAG AA (≥4.5:1) on both light and dark surfaces — the raw `--*-color` accent is a fill color and fails as text on a light surface (≈1.9:1). The mix is inlined per rule (not routed through an inherited `:root` token, which would bake in the page-root `--text-1` and go stale inside a nested theme).

**On-surface foreground utilities** — legible foreground for any accent in the current theme (same mix-toward-`--text-1` mechanism): `.on-surface-accent` (set `--accent` inline/parent, e.g. `<span class="on-surface-accent" style="--accent:#8b5cf6">`) plus semantic conveniences `.on-surface-success` / `.on-surface-danger` / `.on-surface-warning` / `.on-surface-info`. Use these (not the raw `--*-color`) whenever an accent is rendered as **text/icon on a surface**; keep `--*-color` / `.success-color` for **fills** (backgrounds, borders, filled icons).

**Button color variants** — compose with `.btn` (e.g. `class="btn btn-primary"`; also works with `.btn-sm`). Each variant just reassigns the shared `--button-*` tokens, so the base `.btn` structure/hover/active/focus/disabled is reused (no per-variant state selectors). Available: `.btn-primary`, `.btn-secondary`, `.btn-cancel`, `.btn-success`, `.btn-danger`, `.btn-warning`, `.btn-info`. **These were previously "phantom" classes** — used in templates (`wc-form-array`, `wc-chartjs`, …) but never defined in any CSS, so they rendered as a plain neutral `.btn`; now they're real. All verified WCAG AA (≥4.5:1 label vs fill) across all themes in both light & dark via `tests/button-variants-test.py`. Details: `primary`/`secondary`/`cancel` **track theme tokens**; `success`/`danger`/`warning`/`info` are **fixed semantic fills** deepened just enough that white text is AA in every theme (the raw `--*-color` accents are too light for white). `.btn-primary` deepens `--primary-bg-color` 60% toward black + white label (the theme's own `--primary-color` isn't reliably AA — `--primary-bg-color` spans bright-yellow→dark-coffee across themes); in `.crisp` it uses the lighter per-hue `--accent-fill-bg`/`--on-accent` via fallback. **`.btn-cancel`** is the dark/"opposite-of-primary" dismiss button (like the swal cancel): `--text-1` fill (black-ish in light themes, a light chip in dark) with a `--surface-1` label — always maximal contrast. (The swal cancel button itself still styles via `--secondary-bg-color` in `wc-prompt.js`; `.btn-secondary` matches that neutral look for regular buttons.)

**Accent fill family (`.crisp` mode)** — completes the `--accent` family so accent bubbles/pills/callouts need zero hardcoded colors. Tokens (defined wherever `--accent` is, i.e. both `.crisp` light & dark blocks, hue- + theme-aware): `--on-accent` (legible fg on the accent fill), `--accent-fill-bg` (the fill background — in **light** themes this is `--accent` deepened ~18% via `color-mix(in oklab, var(--accent) 82%, #000)` so `--on-accent` clears WCAG AA on **every** hue; in **dark** themes the L64% accent is light enough that `--accent-fill-bg` = raw `--accent` with a near-black `--on-accent`), `--accent-soft` (subtle **offset** accent fill, distinct from the card in both themes — not the pale `--primary-bg-color` wash that vanishes on light cards), `--on-accent-soft` (fg on `--accent-soft`), `--accent-border` (accent-derived border/ring that reads on the card). Utilities: `.accent-fill` (`background: var(--accent-fill-bg); color: var(--on-accent)`), `.accent-soft-fill` (`background: var(--accent-soft); color: var(--on-accent-soft)`), `.accent-border-color`. **Why the light-theme deepening:** the full-saturation `--accent` at L54% is too mid-toned for a single AA foreground across all hues (white fails cyan, black fails red) — verified per-hue; deepening the fill ~18% is what makes white universally AA. Prefer `.accent-soft-fill` for chat bubbles/callouts (loud full accent is heavy). All pairings verified WCAG AA (≥4.5:1) across all 45 theme hues in both light & dark via `tests/accent-family-test.py`.

**Secondary background** — `.secondary-bg-color` uses `--secondary-bg-color`

### CSS Grid Utilities

Tailwind-compatible CSS grid classes are available: `grid-cols-1` through `grid-cols-12`, `grid-rows`, `col-span`, `row-span`, and `grid-flow` classes at all breakpoints (base + sm/md/lg/xl/2xl).

### Modal Flex Fill

`.modal-flex-fill` — composable utility for fixed-pixel modals (`w-700 h-650`). Establishes a flex column chain so `.modal-body` fills the space between header and footer, and children like `wc-code-mirror` can use `flex-1 min-h-0 height="100%"` to fill. Usage: `{% block modalContentCss %}modal-flex-fill w-700 h-650{% endblock %}`

## Scaffold Component Selection (schema field → component)

The AI Builder picks components by field type/shape. Full detail (with notes, decision order, and conventions) lives in `scaffoldHints` in `docs/wave-css-knowledge.json`. Quick reference:

**Form fields (edit one record, inside `<wc-form>`):**
- string / number / boolean / single date → `wc-input` (type=text|number|checkbox|date…)
- bounded number (min AND max) → `wc-slider` (range mode → `"min,max"`); unbounded number → `wc-input type=number`
- long-text / richtext / markdown → `wc-rich-text` (display with `wc-markdown-viewer`)
- multi-line plain text → `wc-textarea`
- enum / fixed options → `wc-select`; enum + free text → `wc-combobox`; reference/FK → `wc-select` (url)
- color / `*_color` → `wc-color`
- bounded score / `rating`/`score`/`stars` → `wc-rating`
- icon field (app icon, nav item, icon-typed) → `wc-icon-picker` (submits the FA name string)
- file / image / attachment → `wc-file-upload`
- cron / schedule → `wc-cron-picker`
- array of sub-objects → `wc-form-array` (+ `wc-form-array-column`)

**Collection views (render an array of records) — pick by salient field, in priority:**
- status/enum field → `wc-kanban` · two date fields → `wc-gantt` · one date field → `wc-calendar` · image field → `wc-data-cards` · geo/address → `wc-map` (markers; keyless — prefer over `wc-google-map`) · else → `wc-table`/`wc-tabulator` (or `wc-pivot` for cross-tab)

**Conventions:** lowercase events (+ deprecated colon alias); pure-UI components persist via events (host rolls back by resetting the source attribute); form fields submit under `name` via FACE/named control; `wc-calendar`/`wc-kanban`/`wc-gantt`/`wc-data-cards` share `{id, label|title, start, end?, color?}`; await `.ready` before setting `value` on lazy-loading fields (`wc-rich-text`).

## Component Categories

### Layout Components
- `wc-sidebar`: Sidebar navigation component
- `wc-sidenav`: Side navigation menu
- `wc-split-pane`: Resizable split panel with draggable divider, horizontal/vertical layouts, collapsible, localStorage persistence
- `wc-split-start`: Start pane content wrapper for wc-split-pane
- `wc-split-end`: End pane content wrapper for wc-split-pane

### Form Components (extend WcBaseFormComponent)
> **FACE convention:** form components are form-associated — the **host keeps `name`** and submits via `setFormValue` (native forms + HTMX); inner controls carry an `id` (for `<label for>`) but no name. `wc-input`/`wc-select`/`wc-textarea` were migrated to this from the older "relocate name to the inner control" pattern (behavior identical: same name, same submitted value). Exception: `wc-select` **`multiple`/chip** keep the name on the inner `<select>` for robust native multi-value submission (incl. HTMX `selectedOptions`).

- `wc-form`: Form wrapper with validation
- `wc-input`: Text input field
- `wc-select`: Dropdown select; `wcoptionsloaded` event fires after URL options load
- `wc-combobox`: Single-value combobox — type free text AND/OR pick a DB-loaded suggestion (always allows custom values). Loads options via `url` + `display-member`/`value-member`/`results-member`/`sort` (load-once + client filter), or server-side search when `url` contains a `{query}` placeholder (or `search-param`) with `min-chars`/`debounce`. Form-associated: submits the option's value-member or the raw typed text (display text ≠ stored value); visible input has no `name`. Events: `wccomboboxchange`, `wccomboboxinput`, `wcoptionsloaded`. **`select-first`** (opt-in boolean): after options load, if the value is still empty and ≥1 option exists, default to the first option (post-`sort`) and emit `wccomboboxchange` so dependent pickers cascade — **never overrides an already-set value** (server-rendered/restored/user-picked); re-defaults on a later reload when empty. Use for cascading connection→database→collection pickers. **`depends-on="a b"`** (multi-parent, declarative cascade): the dependent won't fetch until every named parent has a value, substitutes each parent's value into its own `url` via `{name}` placeholders (URL-encoded), and re-fetches on any parent change (reacts to bubbling `wccomboboxchange` via delegation — htmx-safe). Parents matched by `name`/`data-name`, resolved to the **nearest** match — explicit scope ancestor (`[data-combobox-scope]`/`form`/`dialog`/`wc-tab-item`) first, else the lowest ancestor containing a match (so repeated picker sets with **identical names and no wrapper** self-scope to their own group), else global. No cross-wiring between tabs even with clean stable names. A parent going empty clears the dependent + cascades the collapse; a parent change re-picks via `select-first`; a server/restored value is preserved on first load. Pairs with `select-first` to express conn→db→collection chains with **zero hyperscript** (replaces the old per-template `setAttribute('url', …)` wiring)
- `wc-textarea`: Multi-line text input
- `wc-icon-picker`: Form-associated searchable visual icon picker. Trigger shows the selected icon (`wc-fa-icon` preview + name); click opens a `<body>`-appended popover (never clipped; `z-index:10000`, flips, mirrors theme classes) with a search box + grid of previews sourced **internally** from Wave's own bundle manifest (`WcIconConfig.bundleBaseUrl/<variant>-icons.json` keys — host supplies no names). Substring search; click/Enter selects → submits the icon **name string** under `name` via FACE (what `wc-fa-icon`/`_app.icon` expect). Arrows navigate grid, Esc closes → focus trigger. `variant` (solid default) switches bundle; `columns` grid width; `value` seeds + round-trips; `required` → validity; `clearable` empties (auto-hidden when required). Previews **lazy-render** via IntersectionObserver (smooth across ~579). htmx-safe; `@layer wc.usage`. Event `wciconpickerchange` `{value}` (legacy `wc-icon-picker:change`). Generation: any icon field (default value = the Builder's validated auto-pick)
- `wc-slider`: Form-associated bounded numeric slider. Styled native `<input type=range>` honoring `min`/`max`/`step`; `show-value` readout (+ optional `unit`), optional `marks` (JSON array → ticks/labels). Drag + keyboard (arrows = step, Home/End = min/max). `range` (dual-thumb: two overlaid inputs + fill, clamped so thumbs can't cross) submits **`"min,max"`**; single submits the number. `value` seeds + round-trips; `required` blocks an unseeded+untouched slider (submitted value empty until set). FACE `setFormValue` under host `name` (base `formElement` nulled). htmx-safe; `@layer wc.usage`. Events `wcsliderchange` `{value}` (commit) + `wcsliderinput` `{value}` (dragging) (legacy `wc-slider:change`/`:input`). Generation: numeric field with BOTH `@minimum` and `@maximum` (unbounded → `wc-input type=number`)
- `wc-rating`: Form-associated icon rating field. Renders `max` icons using THREE distinct `wc-fa-icon` glyphs — `icon-empty`/`icon-half`/`icon-full` (default `star` regular / `star-half-stroke` regular / `star` solid; per-state `icon-*-style` overridable) — so a partial value shows a distinct half glyph, not a clipped icon. `allow-half` enables .5 steps; editable (click; left-half→.5; hover preview; arrow/Home/End keys) or `readonly` (same fill, non-interactive, optional `show-value`/`count` suffix for list display). Submits the **number** under `name` via FACE; `value` seeds + round-trips; `required` invalid at 0. `color`/`size` attrs. htmx-safe; `@layer wc.usage`. Event `wcratingchange` `{value}` (legacy `wc-rating:change`). Generation: bounded-int fields (0–5) or names `rating`/`score`/`stars`
- `wc-color`: Form-associated color picker field. Swatch + text value; clicking opens the native `<input type=color>` (hex); optional preset `swatches` (one-click); `allow-custom="false"` → presets only. Stores/submits in `format` (`hex` default / `rgb` / `hsl`) — picked hex is converted to the format, and any incoming color string is parsed back to hex to seed; `value` round-trips. `required` → form validity. Native input nulled out of base `formElement` so it isn't auto-bound (component converts + `setFormValue` under host `name`). No alpha (native limitation). htmx-safe; `@layer wc.usage`. Event `wccolorchange` `{value}` (legacy `wc-color:change`). Generation: `color`-typed fields or names ending `_color`
- `wc-cron-picker`: Visual cron schedule picker; generates 5-field cron expressions; frequencies: minute, N minutes, hour, N hours, day, weekday, weekend, week, month, custom; `wccronchange` event; collapsible syntax reference
- `wc-form-array`: Declarative repeatable sub-form for an **array-of-objects**, lives inside `<wc-form>`. Extends `WcBaseComponent` (NOT form-associated — its `name` is only a dotted-index prefix). Renders native form controls named `${name}.${index}.${field}` (e.g. `line_items.0.product_id`) so the server's dotted-index save path reconstructs the array — no JSON serialization, no custom endpoint. Columns declared via `wc-form-array-column` children; `value` is a JSON array of row objects. **Hard guarantee: after any add/remove, every control name is renumbered so indices stay contiguous `0..n-1`** (gaps create null/empty array holes). `min-rows`/`max-rows` enforced; empty rows are excluded on submit (native `submit` capture + `htmx:configRequest`) so a blank trailing row never serializes a junk object. `readonly` renders non-editable static text (select shows the option label). htmx-swap-safe; styles in `@layer wc.usage`. Event: `wcformarraychange` (detail `{ name, rows }`; legacy alias `wc-form-array:change`). Public API: `addRow(data?)`, `removeRow(rowOrIndex)`, `rows` get/set, `value` get/set
- `wc-form-array-column`: Configuration-only child of `wc-form-array` (renders nothing, never submits). Attributes: `field` (required — the object key / dotted `sub`), `label`, `type` (text/number/date/select), `options` (JSON array — inline `{key,value}` or a collection of records for a reference/FK column), `option-value`/`option-label` (which members are stored value vs visible label), `min`/`max`/`step`/`placeholder`/`required`, `col-class` (width/align). One `wc-form-array-column` per schema `def` field — generation-friendly
- `wc-file-upload`: Form-associated file/image upload field. Drop/click → validates `accept` (mime patterns) + `max-size` (MB) client-side → multipart `POST` (`file`/`category`/`record_id`) to `upload-url` (default `/upload` → R2) via XHR with a `wc-progress` bar → submits the returned `url` as a normal named value (FACE `setFormValue` under host `name`). Single → URL string; `multiple` → JSON array of urls. `value` seeds an existing file's preview + round-trips. Image → thumbnail, non-image → file chip (icon + name + size + link); remove clears. `required` → form validity. The internal file `<input>` has NO `name` (raw file never submitted — only the url); base `formElement` nulled so it isn't mistaken for the value. htmx-safe; `@layer wc.usage`. Event `wcfileuploadchange` `{value}` (legacy `wc-file-upload:change`). Generation: file/image/attachment fields → `category`=entity, `record-id`=record id
- `wc-rich-text`: Form-associated rich-text / markdown EDITOR (the editable counterpart to `wc-markdown-viewer`). Lives in `<wc-form>` and submits its content as a normal named value (FACE — `setFormValue` under the host `name`), so the standard save path stores it like a `wc-textarea`. `mode="markdown"` (default, submits Markdown) or `"html"` (submits DOMPurify-sanitized HTML). `value` seeds + round-trips. `toolbar` = `basic`/`full`/comma-list (bold,italic,h2,h3,ul,ol,link,quote,code,image,table) via `wc-fa-icon`. `required` integrates with form validity (`setValidity`/valueMissing). Lazily loads marked/turndown/DOMPurify from cdnjs (like `wc-code-mirror`); sets `_deferReady` → **await `.ready`** before reading/setting `value`. Sanitizes on input + paste in both modes. Markdown-mode preview toggle renders into a real `wc-markdown-viewer`. htmx-safe; styles in `@layer wc.usage`. Event: `wcrichtextchange` `{name, value, mode}` (legacy `wc-rich-text:change`). Default to `markdown` storage for long-text/richtext schema fields

### Display Components
- `wc-accordion`: Collapsible content sections
- `wc-article-card`: Article card display
- `wc-contact-card`: Contact information card
- `wc-contact-chip`: Compact contact display
- `wc-flip-box`: Flippable content box
- `wc-google-map`: Google Maps integration with single/multiple pins. **Markers mode (data-bound):** declarative `markers` JSON attribute (`[{lat,lng,label?,title?,address?,link?}]`) drops a pin per entry — additive, combines with single-location `lat`/`lng` and `<option data-lat data-lng data-title data-address data-link>` children. `fit-bounds` auto-frames all pins (already automatic for >1). Per-marker `link` renders an `<a>` in the info window and rides `wcgooglemapmarkerclick` `{index, link, pin}` (legacy `wc-google-map:marker-click`); existing `wcpinclicked` + single-location usage unchanged
- `wc-map`: **keyless, $0/mo drop-in for `wc-google-map`** (de-Google) — MapLibre GL JS + free **OpenFreeMap** vector tiles (`https://tiles.openfreemap.org/styles/liberty`, no key, commercial OK). Same public contract as `wc-google-map`: attributes `lat`/`lng`/`address`/`title`/`zoom`/`center-lat`/`center-lng`/`draggable`/`scrollwheel`/`disable-default-ui`/`markers`/`fit-bounds` + `<option data-lat data-lng data-title data-address data-link>` children; methods `updatePins()`/`addPin()`/`clearPins()`/`getMap()`/`getMarkers()`; events `map-loaded`/`wcmaploaded`, `pin-clicked`/`wcpinclicked`, `wcmapmarkerclick` (+ legacy `wc-google-map:marker-click`/`wcgooglemapmarkerclick`), `map-clicked`, `center-changed`, `zoom-changed`, `bounds-changed`, drag events. Override tiles with `tiles` (or `map-style`) — e.g. a self-hosted PMTiles style — for zero third-party dependency. `attribution-compact` (default `true`) collapses the mandatory OpenFreeMap/OpenMapTiles/OSM credit to a small ⓘ that expands on click (so it doesn't cover small maps); `attribution-compact="false"` forces the always-expanded box. NB MapLibre uses `[lng,lat]` internally (the component converts); the reserved `style` HTML attribute is deliberately NOT used for the tiles URL. `api-key` accepted but ignored. `clearPins()`/`updatePins()` clear the `markers` attr too (true full replace). Loads MapLibre from CDN once; `disconnectedCallback` defers cleanup 1s (HTMX-swap safe)
- `wc-address`: **keyless, $0/mo drop-in for `wc-google-address`** — address type-ahead that calls the app's own **geocode PROXY** (default `geocode-url="/api/geocode"`; the proxy adapts LocationIQ/Nominatim server-side, caches, hides the key). Same UX (debounced ≥3 chars, dropdown, ↑/↓/Enter/Esc) and output. Proxy contract: `GET {geocode-url}/autocomplete?q=` → `[{id,label,lat,lng}]`; on select `GET {geocode-url}/details?id=` → `{street,city,state,postal_code,county,country,lat,lng,formatted_address,source,approximate}`. Emits `wcaddresschange` (canonical) + aliases `wc-address:change`/`google-address:change`/`wcgoogleaddresschange` on the element AND document, detail `{addressGroup,street,city,state,postal_code,county,country,lat,lng,formatted_address,formatted_address_encoded,formatted_address_slug,place_id,source,approximate}` — so `wc-address-listener` (listens for `wcgoogleaddresschange`) and existing screens work after a find-replace. `target-map` pushes lat/lng/address to a `wc-map` OR `wc-google-map` by id. Attributes: `name`/`value`/`placeholder`/`lbl-label`/`countries`/`types`/`target-map`/`address-group`/`icon-name` + `geocode-url`. `api-key`/`fields` accepted but ignored. Details-404 falls back to the suggestion's own label + lat/lng. Requires a visible "Search by LocationIQ" attribution per provider ToS
- `wc-data-cards`: Generic data-bound responsive card gallery (the generic counterpart to `wc-article-card`/`wc-contact-card`; composes `.card`). `items` JSON → grid; `image-field` (optional cover — absent/missing value degrades to a tidy text card, no broken `<img>`), `title-field`, `subtitle-field`, `fields` subset → `.badge` chips, `columns` (responsive max: 1 → 2 → columns), `link-template` `<a href>` (htmx-boost) else `wcdatacardsopen` `{id}` (from `id-field`, default `_id`). htmx-safe; styles in `@layer wc.usage`. Generation: entity with an image field → gallery view
- `wc-image`: Enhanced image component
- `wc-background-image`: Background image container

### Content Components
- `wc-markdown-viewer`: Enhances goldmark-rendered markdown HTML with Prism.js syntax highlighting and copy-to-clipboard buttons on code blocks; auto-processes on connect and after HTMX swaps; supports json, javascript, sql, bash, go, html, python, ruby, and more

### Icon Components
- `wc-fa-icon`: Font Awesome icon wrapper
- `wc-icon`: Basic icon component

### Navigation Components
- `wc-menu`: Menu system with HTMX support
- `wc-breadcrumb`: Breadcrumb navigation
- `wc-breadcrumb-item`: Individual breadcrumb item
- `wc-tab`: Tab container (supports right-click context menu on removable tabs with Close, Close Others, Close All, Close to Right, Close to Left; public methods: `closeOthers(label)`, `closeAll()`, `closeToRight(label)`, `closeToLeft(label)`; uses wc-context-menu internally; `no-hash` attribute suppresses URL hash updates on tab click). Active tab is shown by an **accent indicator** (inset underline, `--wc-tab-indicator-color` → `--accent`/`--primary-bg-color`) + bolder label — legible regardless of background contrast (`.crisp` light/dark, or a strip on a `.card`); hover is a separate subtle highlight. Theme-tunable tokens (with fallbacks): `--wc-tab-active-bg`, `--wc-tab-hover-bg`, `--wc-tab-body-bg`, `--wc-tab-indicator-color`, `--wc-tab-active-color`, and nested depth `--wc-tab-body-bg-1`/`-2` (default `--surface-3`/`--surface-4` — nesting steps through surfaces, not `#000`-mix, so it works in light themes)
- `wc-tab-item`: Individual tab item
- `wc-dropdown`: Dropdown menu; `btn-class` attribute for trigger button styling
- `wc-dropdown-item`: Dropdown menu item
- `wc-wizard`: Step-by-step wizard (same pattern as wc-tab); inline step content shown/hidden via CSS; `next()`, `back()`, `goTo(n)` public methods; `wcwizardstepchange` event; consumer provides navigation buttons externally
- `wc-wizard-step`: Child element for wc-wizard containing inline step content (label, icon, before-navigate)

### Data Components
- `wc-tabulator`: Advanced data table; supports `auto-columns` attribute for auto-generating columns from data, `data` attribute for inline JSON arrays. **Dynamic server-side (remote) pagination:** public method `setRemoteData(url)` switches the table to a new remote query at runtime — sets `ajaxURL`, flips `paginationMode`/`filterMode`/`sortMode` to `'remote'`, clears inline data, and reloads from page 1 (`this.table.setData(url)`); works even after inline `data` was set (flips local→remote). `ajax-url` is an observed attribute — setting it non-empty calls `setRemoteData` (empty/removed = no-op). The endpoint returns `{data, last_page, last_row}` and the built-in First/Prev/Next/Last controls fetch each page. Counterpart `setLocalData(data)` reverses the switch — flips `paginationMode`/`sortMode`/`filterMode` back to `'local'`, clears the ajax URL, and loads the supplied in-memory dataset (a JSON string or array, same shapes as the `data` setter) paged locally. **Per-response transform:** `ajax-response-transform="fnName"` (resolved via the `wc-tabulator-func` funcs mechanism, then class/global/inline) passes `response.data` (the rows array) through `(rows) => rows` before render, preserving `last_page`/`last_row` — use it to convert Extended-JSON to plain values. Existing inline-`data` local-pagination tables are unaffected
- `wc-tabulator-column`: Table column definition
- `wc-tabulator-func`: Table function helpers
- `wc-tabulator-row-menu`: Row context menu
- `wc-timeline`: Timeline visualization (vertical, alternating narrative cards; item shape `{label, content}` — for a horizontal duration/Gantt view use `wc-gantt`)
- `wc-gantt`: Horizontal Gantt / swimlane chart — `items` JSON (`[{id,label,start,end?,lane?,color?}]`, same shape as `wc-calendar`/`wc-kanban`) rendered as duration bars on a time axis, grouped into swimlanes by `group-field` (greedy row-packing). `scale` = `day`/`week`/`month` (zoom + axis ticks); zero-duration items (no `end`) render as milestone diamonds. **Pointer-based** drag to move + left/right edge handles to resize → `wcganttchange` `{id, newStart, newEnd}` (ISO UTC, day-snapped, optimistic — reset `items=` to roll back); activate → `link-template` `<a href>` or `wcganttopen` `{id}`. `readonly` disables drag. Sticky lane labels + axis header, horizontal scroll. Sibling to `wc-timeline` (NOT a mode — they share no layout); dependency arrows are a documented v1 follow-up. htmx-safe; styles in `@layer wc.usage`. Scaffold rule: **one date field → `wc-calendar`; two date fields → `wc-gantt`**. Legacy aliases `wc-gantt:change`/`:open`
- `wc-document-tree`: MongoDB document viewer with expandable/collapsible tree; declarative context menu via `wc-document-tree-context-menu` children (action receives `(e, node)` with key/value/path/documentId/type)
- `wc-explain-tree`: Visual MongoDB explain plan viewer with stage flow diagram, color-coded stages, branching, aggregation pipeline support, click-to-expand detail
- `wc-pivot`: Cross-tabulation pivot table with four-zone field panel (Rows/Columns/Values/Filters), value filters, drill-down with inline detail tables, heatmap, column sorting, date grouping (year/quarter/month/day/datetime), compact layout toggle, config save/load (`getConfig()`/`loadConfig()`), CSV export

### Interactive Components
- `wc-slideshow`: Image slideshow
- `wc-slideshow-image`: Slideshow image item
- `wc-chart-builder`: Interactive chart renderer from raw JSON with auto-detection, field pickers, supports bar/line/pie/doughnut/area/number types
- `wc-code-mirror`: Code editor integration; declarative context menu via `wc-code-mirror-context-menu` children (label, icon, separator, action receives `(e, info)` with cursor/selection/lineText/editor); `hint-words` and `hint-url` attributes for autocomplete support with JSON-context-aware quote wrapping; Pongo2/Django template syntax overlay for htmlmixed mode; pre-loads mode scripts before editor creation; editor always initialized (never null); `display()` method for refresh; supports python, go, ruby, rust, sql, shell, yaml, swift, clike-based MIME types; sublime keymap with find/replace (Cmd+F find, Cmd+D select next occurrence, Cmd+Alt+F replace)
- `wc-canvas-dot-highlight`: Canvas animation effect
- `wc-context-menu`: Reusable context menu with static `WcContextMenu.show(x, y, items)` / `WcContextMenu.hide()` API
- `wc-context-menu-item`: Declarative menu item for wc-context-menu

### Button Components
- `wc-save-button`: Save action button
- `wc-save-split-button`: Split button with save options; `btn-class` attribute for save button styling
- `wc-split-button`: Generic split button; `btn-class` attribute for trigger button styling

### Navigation Components
- `wc-tree`: Hierarchical tree with nested items, icons, badges, search, lazy-url, HTMX support, `hash-nav` for URL hash tracking, `filterable` for gear popover with structured filters via `wc-tree-filter` children
- `wc-tree-filter`: Configuration-only child for wc-tree (field, label, values, checked); declares filterable attributes for the gear popover
- `wc-tree-item`: Tree node (label, icon, badge, expanded, selected, lazy-url); emits `wctreeitemexpand` / `wctreeitemcollapse` events (bubbles: false); supports `data-tree-action` attribute for hover-reveal action buttons; `hx-trigger` and `hx-disinherit` in observedAttributes; click behavior: only arrow toggles expand/collapse, clicking elsewhere selects

### Data Components
- `wc-table`: Lightweight data-driven table (url, items, sorting, formatting, events)
- `wc-table-col`: Column definition for wc-table (field, label, sortable, align, format). **Rich cells:** `type="html"` (trusted innerHTML — caller owns escaping) or `formatter="badge|link|datetime"` (built-ins escape their own text → XSS-safe). `badge` → `.badge .badge-{variant}` via `formatter-map` (`{value:variant}` JSON, default `muted`); `link` → `<a href>` from `formatter-href` token template (e.g. `/x/order/{_id}`, tokens URL-encoded, htmx-boost friendly); `datetime` → `formatter-format` luxon-preset name (`DATE_MED`/`DATETIME_MED`/…) via Intl, consistent with `wc-tabulator`. `formatter` wins over `type="html"` (+ warning). **Sorting uses the raw field value**, not the rendered HTML; columns with neither attr are unchanged (plain escaped text). **`formatter="run-status"`** — live SSE cell: an active/running row shows a spinner + step text streaming from `formatter-events-url` (`{token}` template, URL-encoded), a resting row renders identical to `badge`. `formatter-active-field` (row field = running), `formatter-event-name` (NAMED SSE event — default `message`; the run stream emits `step_change`), `formatter-live-path` (dotted path w/ negative indices, e.g. `stack.-1.name`) or `formatter-live-field` (flat key, default `status`; text only), `formatter-done-when` (`prop` truthy or `prop=value`, e.g. `event=end`). With `formatter-event-name="step_change"`, live-path defaults to `stack.-1.name` and done-when to `event=end` (run-state defaults); terminal is payload-driven (socket may stay open with heartbeats after `end`). The component **owns the EventSource lifecycle** — reconciled by run id across re-renders (rebind/close/no-reopen), all closed on items/url re-set, row removal, or disconnect (no leaks). Emits one `wcrunstatuscomplete` (`wc-run-status:complete`) `{runId, row}` per run at terminal; the host then refreshes the authoritative verdict
- `wc-kanban`: Declarative status board — lanes from a categorical/enum field's options (`lanes` JSON of `{value,label,color}`), cards from record objects (`cards` JSON) grouped by `group-field`. Native HTML5 drag/drop between lanes (+ within-lane reorder), per-lane count, optional `rollup-field` sum (with `rollup-prefix`). Shows `card-title-field` + `card-fields` subset as `.badge` chips. Host owns persistence via events: `wckanbanchange` `{cardId, fromValue, toValue, groupField, toIndex}` (optimistic move — reset `cards=` to roll back), `wckanbanadd` `{laneValue, title}` (when `quick-add`), `wckanbanopen` `{cardId}` (or `card-link-template` renders a real `<a href>` with `{field}` tokens). `readonly` disables drag/add. htmx-safe (re-renders on attr change); styles in `@layer wc.usage`; pair with `wc-sidenav` host-side for a detail panel. Legacy aliases `wc-kanban:change`/`:add`/`:open`
- `wc-calendar`: Records on a date grid — `events` JSON (`[{id,title,start,end?,color?}]`, ISO dates) placed by `start` (spanning to `end`). Views: `month`/`week`/`day`/`agenda` via `view`; nav bar (prev/today/next + switcher) with period label; `initial-date`, `week-starts-on` (0/1). **Timezone:** date-only / UTC-midnight values are floating (bucketed by literal calendar date — no shift, avoids drift for UTC-native business dates); datetimes render in browser-local zone by default, pinnable via `timezone` (`utc` or IANA). Native HTML5 drag to reschedule (whole-day shift preserving time/duration) → `wccalendarchange` `{id, newStart, newEnd}` (optimistic — reset `events=` to roll back); `selectable` empty-day click → `wccalendaradd` `{date}`; activate → `event-link-template` `<a href>` or `wccalendaropen` `{id}`; `wccalendarviewchange` `{view, date}` on nav. Per-event `color` (→ `--event-color`), month cells cap at 3 chips then `+N more` (drills to day view). `readonly` disables drag. htmx-safe; styles in `@layer wc.usage`; pair with `wc-sidenav` host-side. Legacy aliases `wc-calendar:change`/`:add`/`:open`

### AI/Bot Components
- `wc-ai-bot`: AI chatbot interface (WebLLM in-browser or `provider="server"` SSE backend). Bubble-theme panel size is configurable via `panel-width`/`panel-height` attributes or `--wc-ai-bot-panel-width`/`--wc-ai-bot-panel-height` CSS custom properties, clamped to 92vw/85vh (`calc(100v*-2rem)` on ≤640px viewports); defaults unchanged at 350×500, `panel-height` is the preferred alias for the bubble height (falls back to `max-height`). Markdown rendering is compact and table-friendly: GFM tables render bordered/padded with a shaded header and scroll horizontally on overflow; lists are tightly spaced (`li { margin: .15rem 0 }`), long tokens wrap (`overflow-wrap: anywhere`); fenced code scrolls; theme-safe via `color-mix(in srgb, currentColor N%, transparent)`. Only the user bubble keeps `white-space: pre-wrap` (bot bubbles use `normal` so marked's inter-element newlines don't render as gaps). Message bubbles use theme surface tokens with on-surface text (bot=`--surface-2`, user=accent-tinted `--surface-3`, text=`--text-1`, links=`--accent`) so contrast follows the active light/dark theme. Server-mode reliability: busy state clears on the SSE `done` event (reader is cancelled so a heartbeat-held socket can't hang the turn), on EOF, and on `error`; each turn has an `AbortController` and a new send while busy supersedes the in-flight/wedged one (preserving its partial answer) instead of no-op'ing; markdown render is throw-safe (a failing rich answer degrades to plain text and still finishes the turn); message ids are unique (`Date.now()`+seq — a bare `Date.now()` collided between the user and bot-loading bubble and streamed the answer into the user's bubble)
- `wc-hf-bot`: Hugging Face bot interface

### Data Display Components
- `wc-progress`: Linear progress bar; `value`/`max` or `percent`; variants: default, success, warning, danger, info, muted; sizes: sm, md, lg; optional `label`, `show-value`, `animate`

### Skeleton/Loading Components
- `wc-loader`: Loading spinner
- `wc-article-skeleton`: Article loading skeleton
- `wc-card-skeleton`: Card loading skeleton
- `wc-list-skeleton`: List loading skeleton
- `wc-table-skeleton`: Table loading skeleton

### Support Components
- `wc-help-drawer`: Slide-out help drawer with Help (HTMX-loaded), Create Ticket (with screenshot capture), and My Tickets tabs; triggered by "?" button or Ctrl+/; events: `wchelpdraweropen`, `wchelpdrawerclose`, `wchelpticketcreated`

### Utility Components
- `wc-theme-selector`: Theme switcher
- `wc-theme`: Theme manager
- `wc-prompt`: User prompt dialog
- `wc-notify`: Notification system
- `wc-live-designer`: Visual page builder with server-rendered iframe preview
- `wc-template-preview`: Template preview

### Non-UI Components
- `wc-event-hub`: Event broadcasting system
- `wc-event-handler`: Event handling
- `wc-event-stream`: SSE wrapper with declarative bindings, run-state mode, auto-reconnect
- `wc-websocket`: WebSocket wrapper; auto-reconnect with exponential backoff, client ping/pong keepalive, stale detection, per-type events (`wc-ws:t:<type>`), slotted bindings (`data-on`/`data-bind`/`data-show-when`/`data-hide-when`), HTMX swap-safe teardown, tab visibility reconnect
- `wc-mask-hub`: Mask/overlay management
- `wc-behavior`: Behavior attachment
- `wc-visibility-change`: Visibility change detection
- `wc-hotkey`: Keyboard shortcut handler
- `wc-link`: Enhanced link component
- `wc-script`: Script loader
- `wc-javascript`: JavaScript executor
- `wc-div`: Enhanced div wrapper

## Common Patterns

### Creating a New Component

1. Extend from `WcBaseComponent` or `WcBaseFormComponent`
2. Define `static get is()` with component name
3. Override `_render()` for initial DOM setup
4. Define `static get observedAttributes()` for reactive attributes
5. Implement `_handleAttributeChange()` for attribute changes

### Component Communication

```javascript
// Listen for events
this.addEventListener('component:action', (e) => {
  // Handle event
});

// Broadcast to specific components
wc.EventHub.broadcast('action:name', ['wc-component#id'], data);
```

### Form Integration

Form components automatically:
- Participate in form submission
- Support validation
- Handle disabled/readonly states
- Provide value getters/setters

## Debugging Tips

1. Check browser console for component registration
2. Use `data-wc-id` attribute to identify component instances
3. Components emit lifecycle events for debugging
4. Check `_pendingAttributes` for attribute timing issues

## File Structure

```
src/
├── js/
│   ├── components/      # All web components
│   │   ├── wc-*.js     # Individual component files
│   │   └── index.js    # Component exports
│   └── utils/          # Utility functions
├── css/
│   ├── base.css        # Base styles
│   ├── color.css       # Color system
│   └── main.css        # Main styles
views/                   # Example HTML files
├── index.html          # Main entry with HTMX navigation
├── form-elements.html  # Form component examples
├── icon.html           # Icon showcase
├── theme.html          # Theme selector
└── [40+ example files] # Component demonstrations
dist/                    # Built files
├── wave-css.js         # ESM bundle
├── wave-css.min.js     # Minified ESM
├── wave-helpers.js     # IIFE helpers
├── wave-css.css        # Full CSS
└── wave-css.min.css    # Minified CSS
```

## Viewing Examples

```bash
# Start local server
python3 -m http.server 3015

# Navigate to examples
http://localhost:3015/views/

# Main entry point with navigation
http://localhost:3015/views/index.html
```

### Key Example Files

- `views/complete-example.html` - **START HERE** - Comprehensive standalone example
- `views/index.html` - Main navigation hub using HTMX
- `views/form-elements.html` - All form components showcase
- `views/icon.html` - Comprehensive icon examples
- `views/theme.html` - Theme switcher and color showcase
- `views/tabulator.html` - Data table examples
- `views/ai-bot.html` - AI chatbot interface example
- `views/split-pane.html` - Split pane examples
- `views/context-menu.html` - Context menu examples
- `views/tab.html` - Tab component with dynamic tabs and context menu testing
- `views/chart-builder.html` - Chart Builder demos with auto-detect, KPI numbers, dynamic data
- `views/pivot.html` - Pivot table demos with heatmap, sorting, cell click events, CSV export
- `views/explain-tree.html` - MongoDB explain plan viewer demos
- `views/cron-picker.html` - Cron picker demos with all frequency options, form integration, events
- `views/form-array.html` - wc-form-array demos: edit with prefilled rows + reference select, create with min-rows blanks, readonly display, live derived total via `wcformarraychange`, dotted-index submit payload
- `views/kanban.html` - wc-kanban demos: drag between lanes, per-lane count + `$` rollup, quick-add, open event, and a readonly board with `card-link-template` `<a>` cards
- `views/calendar.html` - wc-calendar demos: month grid with all-day + multi-day spans, drag-reschedule, selectable add, per-event color, `+N more` overflow, and a readonly agenda view with `event-link-template` `<a>` events
- `views/rich-text.html` - wc-rich-text demos: markdown mode with full toolbar + preview and FACE submit payload, plus an HTML mode editor that sanitizes on input/paste
- `views/gantt.html` - wc-gantt demos: duration bars in swimlanes, day/week/month scale switch, milestone diamond, pointer drag-move + edge-resize firing `wcganttchange`, `link-template` `<a>` bars
- `views/data-cards.html` - wc-data-cards demos: image gallery with `link-template` + responsive columns, and graceful no-image text cards with the open event
- `views/file-upload.html` - wc-file-upload demos: single image seeded with an existing file + FACE submit payload, and a multiple-file field (value = JSON array of urls)
- `views/color.html` - wc-color demos: hex with presets + seeded value, rgb-format conversion, and a presets-only field
- `views/rating.html` - wc-rating demos: editable half-value stars + a whole-value hearts variant, and a readonly display with `show-value` + `count`
- `views/slider.html` - wc-slider demos: single with unit + marks + step snapping, and a dual-thumb range submitting `"min,max"`
- `views/icon-picker.html` - wc-icon-picker demo: searchable grid of the full solid bundle with lazy previews, clearable, submits the icon name string
- `views/google-map.html` - wc-google-map demos: single pin, `<option>` multi-pin, and the data-bound `markers` array mode with `fit-bounds` + per-marker `link`
- `views/map.html` - wc-map (keyless OpenFreeMap) single pin, markers-array + fit-bounds, and wc-address type-ahead wired to a target map (address part needs the `/api/geocode` proxy)

### Quick Start Example

```html
<!DOCTYPE html>
<html lang="en" class="theme-ocean">
<head>
  <link rel="stylesheet" href="dist/wave-css.min.css">
</head>
<body>
  <div class="container mx-auto p-6">
    <h1>Hello Wave CSS!</h1>
    <button class="btn btn-primary" onclick="alert('Clicked!')">Click Me</button>
    
    <!-- Example with Wave CSS components -->
    <wc-form>
      <wc-input name="name" lbl-label="Name" required></wc-input>
      <button type="submit" class="btn btn-primary">Submit</button>
    </wc-form>
  </div>
  
  <script type="module" src="dist/wave-css.min.js"></script>
</body>
</html>
```

## Common Issues & Solutions

### Issue: Component not rendering
- Check if component is registered in index.js
- Verify base class is correctly extended
- Ensure _render() is called

### Issue: Attributes not updating
- Verify attribute is in observedAttributes array
- Check _handleAttributeChange implementation
- Look for typos in attribute names

### Issue: Events not firing
- Ensure EventHub is imported
- Check selector syntax in broadcast
- Verify event listener registration

## Contributing Guidelines

1. Follow existing naming conventions (wc- prefix)
2. Maintain no-Shadow-DOM principle
3. Use CSS variables for theming
4. Document complex logic with comments
5. Add examples for new components

## Knowledge Bases

Structured JSON knowledge bases exist for this project and its related projects. Read the relevant ones when generating code, answering questions, or using slash commands.

- **Wave CSS**: `docs/wave-css-knowledge.json` — component catalog, attributes, CSS utilities, themes, and a `scaffoldHints` decision table (schema field type/shape → component)
- **Go Kart**: `/Users/matthewduffield/Documents/_learn/go-kart/docs/go-kart-knowledge.json` (38.7 KB) — template system, code tab patterns, field rules, web pilots
- **LiteSpec**: `/Users/matthewduffield/Documents/_dev/lite-spec/docs/lite-spec-knowledge.json` (16.5 KB) — schema DSL syntax, attributes, conditional validation

### Real Production Examples (read for accurate pattern matching)
- **Template examples**: `/Users/matthewduffield/Documents/_learn/go-kart/docs/template-examples.json` — 10 real templates (prospect, kanban, credential vault)
- **Template fragments**: `/Users/matthewduffield/Documents/_learn/go-kart/docs/template-fragments.json` — 11 reusable fragments (base, meta_fields, prospect_general)
- **Web pilot examples**: `/Users/matthewduffield/Documents/_learn/go-kart/docs/web-pilot-examples.json` — Full NC Auto chain (11 Playwright scripts)

### When to read knowledge bases
- `/create-schema` — reads LiteSpec knowledge
- `/create-template` — reads Go Kart + Wave CSS + real examples
- `/create-screen` — reads all three + real examples
- `/create-component` — reads Wave CSS knowledge + base component source
- `/create-web-pilot` — reads Go Kart knowledge + web pilot examples

### Project relationships
- **Go Kart** uses Wave CSS components for its frontend UI
- **Go Kart** uses LiteSpec to define schemas that drive dynamic form/table generation
- **Wave CSS** is the standalone component library
- **LiteSpec** is the standalone schema DSL (consumed by Go Kart's schema builder)