# wc-live-designer — Go Kart Integration Guide

## Overview

The `wc-live-designer` replaces the `wc-code-mirror` in the Template edit view's Content tab. Users design screens visually, and the designer outputs the same HTML that would be hand-coded.

## Files Needed in Go Kart

1. **`wave-css.min.js` / `wave-css.min.css`** — already loaded
2. **`live-designer-canvas.html`** — copy from `wave-css/views/live-designer-canvas.html` to Go Kart's `static/views/` directory

## Usage in Template Edit View

Replace the Content tab's `wc-code-mirror` with:

```html
<wc-live-designer
  canvas-url="/static/views/live-designer-canvas.html"
  api-base-url=""
  theme="{{ Theme }}">
</wc-live-designer>
```

- `canvas-url` — path to the canvas HTML file in Go Kart's static directory
- `api-base-url` — empty string since Go Kart serves its own API (same origin)
- `theme` — pass the current theme from Go Kart's template context

## Form Integration

Before the template form submits (HTMX POST), call `getFormData()` to get the generated content:

```javascript
// In the template edit view's save handler
const designer = document.querySelector('wc-live-designer');
const { content, code, field_rules } = await designer.getFormData({
  slug: Record.slug,
  collectionName: Record.collection_name,
  schemaSlug: Record.schema,
  routePrefix: Record.route_prefix || 'x',
  prevTemplateSlug: Record.route_prev_template_slug || `${Record.slug}_list`,
});

// Set the form fields before submission
document.querySelector('[name="content"]').value = content;
document.querySelector('[name="code"]').value = code;
document.querySelector('[name="field_rules"]').value = field_rules;
```

Or use Hyperscript to wire this to the save button:

```html
<wc-save-split-button
  _="on click
    set designer to first <wc-live-designer/>
    set formData to await designer.getFormData({
      slug: '{{ Record.slug }}',
      collectionName: '{{ Record.collection_name }}',
      schemaSlug: '{{ Record.schema }}',
      routePrefix: '{{ Record.route_prefix }}',
      prevTemplateSlug: '{{ Record.route_prev_template_slug }}'
    })
    set first <[name='content']/>.value to formData.content
    set first <[name='code']/>.value to formData.code
    set first <[name='field_rules']/>.value to formData.field_rules
  end">
</wc-save-split-button>
```

## What getFormData() Returns

```javascript
{
  content: "{% extends '__template_name__' %}...",  // Complete Pongo2 template
  code: "function runGet() {...}...",               // JavaScript code tab
  field_rules: ""                                    // Field rules JSON (empty for now)
}
```

The `content` includes:
- `{% extends "__template_name__" %}`
- `{% block pageContent %}`
- `wc-article-skeleton` with loading transition
- `wc-breadcrumb` with navigation
- `wc-save-split-button`
- `wc-tab` with "General" and "Change Log" tabs
- `wc-form` with `{% include "meta_fields" %}`
- All designed components with Pongo2 bindings
- `wc-hotkey keys="ctrl+s"`

## Loading Existing Templates

When editing an existing template that was created with the designer (`designed_with: "visual"`), the content needs to be loaded back into the canvas. This requires:

1. Reading the `content` field from the template record
2. Parsing the Pongo2 HTML to extract the designed components
3. Replacing `{{ Record.field }}` expressions with sample data
4. Rendering the components in the canvas

This is the load pipeline (still pending implementation).

## Sample Data

The test page loads sample data via `designer.setSampleData(data)`. In Go Kart, you would load a real record:

```javascript
// Load a sample record for design-time preview
const response = await fetch(`/api/${collection_name}?size=1`);
const data = await response.json();
if (data.data && data.data[0]) {
  designer.setSampleData(data.data[0]);
}
```

## Schema Loading

The Fields tab loads schemas from the API automatically via `api-base-url`. In Go Kart with same-origin, schemas load from `/api/_schema_builder`.
