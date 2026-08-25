# WC-File-Upload Web Component

A form-associated file/image upload field. Drop or click to pick a file; it uploads (multipart) to a configurable endpoint and submits the returned URL as a normal named form value (FACE), so the standard server save path stores the URL string under `name` with no special handling.

> Related: pairs with [wc-form](./wc-form.md); composes [wc-progress](./wc-progress.md) and [wc-fa-icon](./wc-fa-icon.md).

## Features

- Drop or click to pick; validates `accept` (mime patterns) and `max-size` (MB) client-side
- Uploads multipart via XHR with a `wc-progress` bar
- Image → thumbnail preview; non-image → file chip (icon + name + size + link)
- Single → URL string; `multiple` → JSON array of URLs
- Seeds an existing file's preview from `value` and round-trips it
- Form-associated (FACE) — submits the returned URL under the host `name`
- htmx-safe

## Basic Usage

```html
<wc-form>
  <wc-file-upload
    name="document_url"
    lbl-label="Document"
    accept="image/*,application/pdf"
    max-size="10"
    upload-url="/upload"
    category="attachments">
  </wc-file-upload>
</wc-form>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `name` | — | Form field name (required); the returned URL is submitted via FACE |
| `value` | "" | Existing file URL (single) or JSON array of URLs (multiple); seeds the preview |
| `lbl-label` | "" | Field label text |
| `accept` | — | Accepted mime patterns (e.g. `image/*,application/pdf`) |
| `max-size` | — | Maximum file size in MB (client-side check) |
| `upload-url` | `/upload` | Multipart POST endpoint |
| `category` | `attachments` | `category` field sent with the upload |
| `record-id` | `general` | `record_id` field sent with the upload |
| `extra-fields` | — | JSON object of string field→value appended to each upload (reserved keys not overridden; malformed JSON ignored) |
| `file-field` | `file` | Multipart field name for the file itself |
| `multiple` | — | Allow multiple files; value becomes a JSON array of URLs |
| `required` | — | Marks the field required |
| `disabled` | — | Disables the field |

## Events

| Event | detail | When |
|-------|--------|------|
| `wcfileuploadchange` (legacy alias `wc-file-upload:change`) | `{ value }` | On add/remove; bubbles, composed |

## Endpoint Contract

POST `multipart/form-data` to `upload-url` with fields: `file` (name overridable via `file-field`), `category`, `record_id`, plus any `extra-fields` pairs.

- Success → JSON `{ url, filename, originalName, contentType, size }`; the component reads `url`.
- Error → non-200 JSON `{ error }`; the message is surfaced and the field is left unset.

## Examples

```html
<!-- Single image seeded with an existing file -->
<wc-file-upload
  name="avatar_url"
  value="/media/avatars/user-42.png"
  lbl-label="Avatar"
  accept="image/*"
  max-size="5"
  category="avatars"
  record-id="42"
  required>
</wc-file-upload>
```

```html
<!-- Multiple files (value = JSON array of URLs) -->
<wc-file-upload name="attachments" lbl-label="Attachments" multiple upload-url="/upload"></wc-file-upload>
```

## Notes

- Only the returned URL is submitted; the internal file `<input>` has no `name` (the raw file is never submitted) and the base `formElement` is nulled so it isn't mistaken for the value.
- The host element is `display: contents`; internal styles live in `@layer wc.usage`.
- Extends `WcBaseFormComponent`.
