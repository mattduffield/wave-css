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

## Notes

- Lazily loads `marked`, `turndown`, and `DOMPurify` (same CDN-load pattern as `wc-code-mirror`); it sets `_deferReady`, so **await `.ready`** before reading or setting `value`.
- Storage defaults to `markdown` (portable and `wc-markdown-viewer`-friendly). In `html` mode the submitted value is DOMPurify-sanitized; pasted content is sanitized in both modes.
- The image upload posts same-origin, expects JSON `{ url }`, and inserts the hosted URL (DOMPurify-sanitized) at the saved caret; email clients need hosted images, not data URIs.
- The host element is `display: contents`; internal styles live in `@layer wc.usage`.
- Extends `WcBaseFormComponent`.
