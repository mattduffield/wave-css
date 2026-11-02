# WC-Rich-Text Web Component

A form-associated rich-text / markdown editor — the editable counterpart to `wc-markdown-viewer`. It lives inside `<wc-form>` and submits its content as a normal named form value (FACE), so the standard server save path stores it with no special handling, exactly like a `wc-textarea`.

> Related: display content with [wc-markdown-viewer](./wc-markdown-viewer.md); pairs with [wc-form](./wc-form.md).

## Features

- Markdown mode (default, submits Markdown) or HTML mode (submits DOMPurify-sanitized HTML)
- Configurable toolbar (`basic`, `full`, or a comma list of command keys)
- Sanitizes on input and paste in both modes
- Markdown-mode preview toggle renders into a real `wc-markdown-viewer`
- Optional device image upload (`image-upload-url`) that inserts a hosted URL at the caret
- Form-associated (FACE) — submits under the host `name`
- htmx-safe

## Basic Usage

```html
<wc-form>
  <wc-rich-text name="body" lbl-label="Body" mode="markdown" toolbar="basic"></wc-rich-text>
</wc-form>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Form field name (required); submitted via FACE |
| `value` | "" | Initial content (Markdown text or HTML per `mode`); seeds + round-trips |
| `mode` | `markdown` | Stored/submitted format: `markdown` or `html` |
| `toolbar` | `basic` | `basic`, `full`, or a comma list of keys (bold, italic, underline, h2, h3, ul, ol, link, quote, code, image, table) |
| `lbl-label` | "" | Field label text |
| `min-height` | `200px` | Editor minimum height |
| `placeholder` | "" | Empty-state hint |
| `image-upload-url` | — | When set, the image button opens a device file picker and POSTs the file as multipart field `image`, expecting JSON `{ url }`; absent → legacy Image-URL prompt |
| `csrf` | — | CSRF token sent as the `csrf_token` upload field |
| `required` | — | Integrates with form validity (valueMissing) |
| `readonly` | — | Non-editable |
| `disabled` | — | Disables the field |

## Events

| Event | detail | When |
|-------|--------|------|
| `wcrichtextchange` (legacy alias `wc-rich-text:change`) | `{ name, value, mode }` | Content changed; bubbles, composed |

## Examples

```html
<!-- Markdown mode with a full toolbar -->
<wc-rich-text name="description" lbl-label="Description" mode="markdown" toolbar="full" min-height="300px" required></wc-rich-text>
```

```html
<!-- HTML mode with device image upload -->
<wc-rich-text
  name="email_body"
  lbl-label="Email Body"
  mode="html"
  toolbar="bold,italic,underline,h2,ul,ol,link,image"
  image-upload-url="/api/upload-image"
  csrf="{{ csrf_token }}">
</wc-rich-text>
```

```js
// Await .ready before reading/setting value (libs load lazily)
await richText.ready;
richText.value = markdownString;
```

## Images: select, resize, align, alt text

Click an image (or put the caret next to it and press **Shift+Arrow**) to select it: a 2px outline and four corner
handles appear, plus a small image toolbar.

| Control | What it stores |
|---|---|
| Corner handles (mouse, touch, pen — pointer events; the aspect ratio is kept) | `width="N"` + inline `width: Npx; max-width: 100%; height: auto` |
| **S / M / L / Original** (25% / 50% / 75% / 100% of the natural width) | same |
| **Width** box (pixels; Enter or leaving the box applies it) | same |
| **Left / Center / Right** (click the active one again to clear) | left: `float: left; margin: 0 12px 8px 0` · center: `display: block; margin: 0 auto` · right: `float: right; margin: 0 0 8px 12px` |
| **Alt text** | `alt="…"` |
| **Remove** (or Delete) | removes the image |

Everything is an attribute or an inline style — no classes, no `<style>` — so it survives email programs
(verified in a bare, CSS-free render at 600px and in a 320px column, where `max-width: 100%` shrinks large
images and `height: auto` keeps their shape).

**Keyboard:** with an image selected, **Enter** or **Space** opens the image toolbar (focus on its first control;
←/→ move between buttons), **Esc** closes it and returns to the text with the image still selected, **Esc** again
deselects, **Delete**/**Backspace** removes the image. Focus always returns to the text.

**Saving:** each change fires the normal `wcrichtextchange` (once per resize — on release) and updates the form value.
In `mode="html"` size, alignment and alt survive DOMPurify, the form value and a save-and-reopen round trip. In
`mode="markdown"` they are dropped, exactly as before (Markdown has no image size/alignment; the alt text becomes the
Markdown alt).

The outline, handles and toolbar sit outside the editable area, so selecting an image never changes the value, and
their page-level listeners exist only while an image is selected. `readonly` / `disabled` editors don't select images.
On touch screens the handles grow to 22px. Contrast in every theme and mode: outline and handles ≥ 3:1 against the
editor and the image, toolbar text ≥ 4.5:1, its borders and focus ring ≥ 3:1.

## Notes

- Lazily loads `marked`, `turndown`, and `DOMPurify` (same CDN-load pattern as `wc-code-mirror`); it sets `_deferReady`, so **await `.ready`** before reading or setting `value`.
- Storage defaults to `markdown` (portable and `wc-markdown-viewer`-friendly). In `html` mode the submitted value is DOMPurify-sanitized; pasted content is sanitized in both modes.
- The image upload posts same-origin, expects JSON `{ url }`, and inserts the hosted URL (DOMPurify-sanitized) at the saved caret; email clients need hosted images, not data URIs.
- The host element is `display: contents`; internal styles live in `@layer wc.usage`.
- Extends `WcBaseFormComponent`.
