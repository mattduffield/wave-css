# WC-Help-Drawer Web Component

A slide-out help drawer with three tabs — Help (HTMX-loaded content with search), Create Ticket (form with screenshot capture), and My Tickets (client-rendered list). Triggered by a "?" button or the `Ctrl+/` keyboard shortcut.

## Features

- Fixed 420px right-hand panel with an overlay (full width under 480px)
- Three tabs: Help, Create Ticket, My Tickets
- Help tab loads content via HTMX with a debounced search
- Create Ticket tab captures a screenshot (via `html2canvas`, loaded on demand) and submits a ticket
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
- Screenshot capture lazy-loads `html2canvas`; on submit a success is surfaced via `wc.Notify` when available and the form fields reset.
- My Tickets loads on first open of that tab, filtered by `username`.
