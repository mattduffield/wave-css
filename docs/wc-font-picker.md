# WC-Font-Picker Web Component

A form-associated, searchable font chooser that previews every font in its own face. It is the general-purpose version of the SummitMemories designer's font preview picker, keeping its look: the closed control shows the font in its face, and the popover has rows with the name plus a line of the customer's own text, sticky uppercase section labels, per-font notes and warning badges. The closed control looks like a `wc-select`. The popover adds a search box, category chips, and **Document fonts**, **Recent** and **All fonts** sections.

> Related: pairs with [wc-form](./wc-form.md). Used by Publish Studio, Template Studio, and the SummitMemories designer.

## Features

- Every font rendered in its own face, with an optional sample line (`preview-text`)
- Web fonts (`url`) register lazily through the **FontFace API** when their row scrolls into view (IntersectionObserver), with a neutral placeholder until loaded. Registrations are shared by every picker on the page
- Search filters as you type; category chips; Document fonts, Recent (localStorage, last 8) and All fonts grouped by category
- **Virtualised** list: smooth with 1,500+ fonts (only a viewport of rows is in the DOM)
- Keyboard: type-to-open, ↑/↓/PageUp/PageDown/Home/End, Enter, Esc; `role="listbox"`/`option` with `aria-activedescendant`
- Live hover preview events, plus a preview-end event when the panel closes without a pick
- Load fonts inline (`fonts`) or from an endpoint (`url`, the `wc-select url` pattern)
- `renderPreview` hook for custom previews (e.g. the designer's single-line SVG pen fonts)
- Form-associated (FACE): submits the font id under `name`; `required` validity
- htmx-safe: initialises on swap; the popover is torn down on removal

## Basic Usage

```html
<wc-form>
  <wc-font-picker name="font" lbl-label="Font" value="georgia"
      fonts='[{"id":"georgia","family":"Georgia","display_name":"Georgia","category":"serif"},
              {"id":"lobster","family":"Lobster","category":"display","url":"/fonts/lobster.woff2"}]'
      document-fonts='["georgia"]'
      recent-key="ps-recent-fonts"
      preview-text="Follow the Star"
      required>
  </wc-font-picker>
</wc-form>
```

## Font entries

```json
{ "id": "lobster", "family": "Lobster", "display_name": "Lobster", "category": "display",
  "url": "/fonts/lobster.woff2", "weights": [400], "styles": ["normal"],
  "note": "Best at 14pt and larger", "badge": { "text": "Heavy", "variant": "warning" } }
```

| Field | Description |
|-------|-------------|
| `id` | Stored value. If absent, `family` is the value |
| `family` | CSS `font-family` name (also the FontFace family when `url` is set) |
| `display_name` | Label (defaults to `family`) |
| `category` | `serif`, `sans` (or `sans-serif`), `display`, `script` (or `handwriting`), `monospace` (or `mono`), `slab`, or any custom category |
| `url` | Web-font file. Registered lazily with `FontFace` the first time the font is shown |
| `weights` / `styles` | Optional FontFace descriptors (e.g. `[400, 700]` → weight range `400 700`) |
| `note` | Small muted line under the name in the closed control (tooltip on rows) |
| `badge` | `{ text, variant }` → a `.badge badge-{variant}` chip on the row |

A `value` given as a family or display name also resolves (useful for older records).

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Form field name; submitted via FACE |
| `value` | "" | Selected font id (or family) |
| `lbl-label` | "" | Field label |
| `placeholder` | `Choose a font` | Closed-state text when empty |
| `required` | — | `valueMissing` until a font is picked |
| `disabled` | — | Disables the control |
| `fonts` | `[]` | JSON array of font entries |
| `url` | — | Fetch the font list: a JSON array, `{ results: [...] }`, or `results-member` |
| `results-member` | — | Key holding the array in the fetched JSON |
| `document-fonts` | `[]` | JSON array of font values shown first, under "Document fonts" |
| `recent-key` | — | localStorage key; enables the "Recent" section (last 8 picks) |
| `preview-text` | `The quick brown fox` | Sample line in each row. `""` hides it (compact rows) |
| `categories` | Serif, Sans Serif, Display, Script, Monospace + others found | Optional JSON chip order and labels: `["script","serif"]` or `[{"id":"slab","label":"Slab serif"}]` |

## Properties / Methods

| Member | Description |
|--------|-------------|
| `value` | Get/set the selected font value |
| `fonts` | Get/set the font list as an array (an alternative to the attribute for large lists) |
| `open(seed?)` / `close()` | Open the panel (optionally seeding the search) / close it |
| `refresh()` | Re-read `fonts` / re-fetch `url` |
| `renderPreview` | `(font, text) => Node \| null`. Return a node to replace the default text preview for that font, or `null` for the default |
| `ready` / `isReady` | With `url`, resolves after the list loads |

## Events

Events bubble and are composed, and are also broadcast through `wc.EventHub` (on `document.body`, with `detail.custom`), except `wcoptionsloaded`.

| Event | Legacy alias | detail | When |
|-------|--------------|--------|------|
| `wcfontchange` | `wc-font-picker:change` | `{ value, family }` | A font was picked |
| `wcfontpreview` | `wc-font-picker:preview` | `{ value, family }` | Hovering or arrowing onto a font: preview it live in the host |
| `wcfontpreviewend` | `wc-font-picker:preview-end` | `{ value, family }` (the unchanged current font) | The panel closed without a pick (Esc, outside click), so the host reverts |
| `wcoptionsloaded` | `optionsloaded` | `{ count }` | Fonts loaded from `url` |

## Keyboard

| Where | Keys |
|-------|------|
| Closed control | Enter / Space / ↓ open; typing a character opens with the search seeded |
| Panel | ↑/↓ move, PageUp/PageDown jump, Home/End (outside the search box), Enter picks, Esc closes; typing anywhere goes to the search box |

## Switching the SummitMemories designer to this component

The designer's `enhanceFontPickers()` maps one-to-one:

| Designer | wc-font-picker |
|----------|----------------|
| `<option value="{{ f._id }}" data-cat data-note>` | font entry `{ id: f._id, family: "smf-" + f._id, url: f.file_path, category, note, display_name }` |
| `@font-face { font-family: "smf-<id>" }` block | not needed: `url` is registered lazily (or keep the block and omit `url`) |
| `previewTextFor(sel)` (the line's own words) | set `preview-text` on input |
| "Not recommended on cedar" chip | `badge: { text, variant: "warning" }` (recompute and reset `fonts` when the board changes) |
| single-line SVG pen preview | `el.renderPreview = (font, text) => strokePreview(font.id, text)` |
| `CAT` / `ORDER` | `categories='["script","serif",{"id":"slab","label":"Slab serif"},"sans","display"]'` |

## Notes

- Placeholder: a web font that hasn't loaded shows a neutral bar (no flash of a fallback face). A font that fails to load falls back to the default face in italics.
- The panel is attached to `<body>` (never clipped by a ribbon or inspector) and carries the host's theme classes.
- The search input's rules sit outside the cascade layers because the `wc.ui` layer styles bare inputs.
- The host element is `display: contents`; styles live in `@layer wc.usage`.
- Extends `WcBaseFormComponent` (the search input is nulled out of the base `formElement`).
- Demo: `views/font-picker.html`. Tests: `tests/font-picker-test.py`.
