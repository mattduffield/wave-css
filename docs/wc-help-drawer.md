# WC-Help-Drawer Web Component

A slide-out help drawer with three tabs — Help (HTMX-loaded content with search), Create Ticket (form with screenshot and file attachments), and My Tickets (client-rendered list). Triggered by a "?" button or the `Ctrl+/` keyboard shortcut.

## Features

- Fixed 420px right-hand panel with an overlay (full width under 480px)
- Three tabs: Help, Create Ticket, My Tickets
- Help tab loads content via HTMX with a debounced search
- Create Ticket tab attaches a real screenshot of the tab (screen-capture API, html2canvas-pro fallback) and any files (picker, drop, paste), then submits a ticket
- My Tickets tab fetches the current user's tickets
- Opens via a "?" button, `Ctrl+/`, or the public API; `Escape` closes

## Basic Usage

```html
<wc-help-drawer
  reference-key="DS-COMPARE-001"
  template-slug="data_studio_compare"
  username="mattd"
  user-email="matt@example.com"
  help-url="/x/help_drawer_content/create"
  ticket-url="/x/kanban_ticket_panel/create"
  csrf-token="abc123">
</wc-help-drawer>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `reference-key` | — | Context identifier for the current screen. |
| `template-slug` | — | Template name for context. |
| `username` | — | Current user's username (used to filter My Tickets). |
| `user-email` | — | Current user's email. |
| `help-url` | — | URL for loading help content via HTMX. |
| `ticket-url` | — | URL for submitting tickets. |
| `csrf-token` | — | CSRF token for form submissions. |
| `ticket-conn` | — | Ticket data-store connection (observed). |
| `ticket-db` | — | Ticket database (observed). |

## Events

Emitted on the element; bubble and composed.

| Event | Detail | Fires when |
|-------|--------|-----------|
| `wchelpdraweropen` | — | The drawer opens |
| `wchelpdrawerclose` | — | The drawer closes |
| `wchelpticketcreated` | `{ ticketId }` | A ticket is successfully submitted |

## Methods

| Method | Description |
|--------|-------------|
| `open()` | Open the drawer. |
| `close()` | Close the drawer. |
| `toggle()` | Toggle open/closed. |

## Attachments (Create Ticket)

**Attach Screenshot**
1. A real screenshot of this tab with the browser's screen-capture API —
   `navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "browser" }, audio: false, preferCurrentTab: true, selfBrowserSurface: "include", surfaceSwitching: "exclude" })`.
   Exact pixels, any CSS (oklch, color-mix…), WebGL canvases included (CAD Studio's model). Chrome and Edge offer
   "this tab" first: one permission click. The drawer and overlay are hidden while it grabs one frame; the capture
   tracks are stopped straight after. Needs a secure context (HTTPS or localhost).
2. **Fallback** — the API is missing, or the user cancels: **html2canvas-pro 2.5.2** renders the visible page.
   Unlike html2canvas 1.4.1 (which threw *Attempting to parse an unsupported color function "oklch"*), it understands
   `oklch`/`oklab`/`lab`/`lch`/`color()`. Loaded on demand through Wave's loader, so with `window.WaveAssetBase` set it
   comes from `<base>/html2canvas-pro-2.5.2/dist/html2canvas-pro.min.js` first, with jsDelivr as fallback.

**Attach files** — any type (the file input has no `accept` filter, `multiple`), **drop** files onto the ticket panel,
or **paste** an image (Ctrl/⌘-V; pasted text still goes into the fields).

Each file uploads straight away, **straight to Cloudflare R2** (the server never holds the file):

1. `POST /api/upload/sign` — `application/x-www-form-urlencoded` `name`, `type` (`file.type` or
   `application/octet-stream`), `size`, `category=tickets`, with the `X-CSRF-Token` header when `csrf-token` is set.
   → `{ uploadUrl, method: "PUT", headers, url, originalName, contentType }` (the link works for 15 minutes, for
   that file only: its size and Content-Type are part of the signature).
2. `PUT` the `File` itself (not FormData) to `uploadUrl` with **exactly** the returned `headers` — nothing added.
   Progress shows on the chip ("uploading 42%"). On 2xx the attachment takes `url`, `originalName` and `contentType`
   from the sign response.
3. If signing is refused, its JSON `{error}` is shown (e.g. 413 "File too large (max 100MB)", 401 …) — before
   anything is sent.
4. **Fallback** to the multipart `POST /api/upload` (`FormData { file, category: "tickets" }`, response
   `{ url, originalName, contentType, … }`) when the sign endpoint isn't there (404/405, or an older server answering
   with something that isn't a signed link) or the PUT fails with status 0 (the bucket's CORS rule isn't set yet, or
   a network error).

Tickets may be up to **100 MB** (go-kart). Removing a chip aborts whichever request is running — the sign call, the
PUT or the fallback POST. One request per file at a time.

R2 bucket CORS (once per bucket): `[{ "AllowedOrigins": ["*"], "AllowedMethods": ["PUT"], "AllowedHeaders": ["Content-Type"], "MaxAgeSeconds": 3600 }]`.

Each attachment is a chip: an image thumbnail or a file-type icon, the name, the size, and ✕ to remove it before
submitting. Screenshots join the same list.

On submit (held until every upload has finished) the ticket form also gets:

| Field | Value |
|-------|-------|
| `attachments_json` | `JSON.stringify([{ url, name, content_type }, …])` — every uploaded file, screenshots included; failed uploads are left out |
| `screenshot_url` | the latest screenshot's URL (for older servers) |

The list is cleared after a successful submit.

## Examples

```html
<wc-help-drawer id="help"
  reference-key="DS-001"
  template-slug="data_studio"
  username="mattd"
  help-url="/x/help/create"
  ticket-url="/x/ticket/create"
  csrf-token="abc"></wc-help-drawer>

<script>
  document.getElementById('help')
    .addEventListener('wchelpticketcreated', e => {
      console.log('ticket', e.detail.ticketId);
    });
</script>
```

## Notes

- The Help tab search is debounced (~300ms) and re-scans the reference key on each open.
- Screenshot capture uses the screen-capture API first and lazy-loads html2canvas-pro as the fallback; on submit a success is surfaced via `wc.Notify` when available and the form fields + attachment list reset.
- Tests: `tests/help-drawer-test.py` (real tab capture incl. a WebGL canvas, the oklch fallback, signed direct-to-R2 uploads + both fallbacks, the 100 MB refusal, abort on remove, drop, paste, submit payload).
- My Tickets loads on first open of that tab, filtered by `username`.
