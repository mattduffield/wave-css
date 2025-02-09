# WC-Visibility-Change Web Component

A custom web component that enables automatic HTMX requests when a user switches between browser tabs. This component monitors the document's visibility state and triggers HTMX AJAX requests when the user returns to the tab.

## Features

- Automatic tab visibility monitoring
- HTMX integration
- Configurable AJAX requests
- Zero visual footprint
- Support for all HTMX swap methods
- Customizable indicators and targets

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

Include the required JavaScript file:

```html
<script type="module" src="path/to/wc-visibility-change.js"></script>
```

## Basic Usage

```html
<wc-visibility-change
  hx-verb="GET"
  hx-url="/api/refresh-data"
  hx-target="#content-area"
  hx-swap="outerHTML">
</wc-visibility-change>
```

## Attributes

| Attribute     | Type   | Default | Description                                    |
|--------------|---------|---------|------------------------------------------------|
| hx-verb      | string  | 'GET'   | HTTP method for the AJAX request              |
| hx-url       | string  | -       | URL endpoint for the AJAX request             |
| hx-target    | string  | -       | CSS selector for the target element           |
| hx-swap      | string  | -       | HTMX swap method                              |
| hx-indicator | string  | -       | CSS selector for loading indicator            |
| hx-push-url  | string  | -       | URL to push to browser history               |
| hx-select    | string  | -       | CSS selector for content to swap              |

## Use Cases

### 1. Auto-Refresh Dashboard

```html
<!-- Refresh dashboard data when returning to tab -->
<wc-visibility-change
  hx-verb="GET"
  hx-url="/api/dashboard/refresh"
  hx-target="#dashboard-content"
  hx-swap="innerHTML"
  hx-indicator="#loading-spinner">
</wc-visibility-change>
```

### 2. Update Notifications

```html
<!-- Check for new notifications when tab becomes visible -->
<wc-visibility-change
  hx-verb="GET"
  hx-url="/api/notifications"
  hx-target="#notification-panel"
  hx-swap="outerHTML">
</wc-visibility-change>
```

### 3. Real-time Data Updates

```html
<!-- Update real-time data when returning to tab -->
<wc-visibility-change
  hx-verb="GET"
  hx-url="/api/live-data"
  hx-target="#real-time-feed"
  hx-swap="innerHTML"
  hx-select="#updated-content">
</wc-visibility-change>
```

## Integration with HTMX

The component requires HTMX to be present in your application. It uses the following HTMX features:
- AJAX requests
- Swap strategies
- Target selection
- Loading indicators
- History management

## Technical Details

### Event Handling

The component:
1. Listens for the document's `visibilitychange` event
2. Checks `document.hidden` state
3. Triggers HTMX request when tab becomes visible

### Browser States

- Tab Active: `document.hidden = false`
- Tab Inactive: `document.hidden = true`

## Best Practices

1. **Error Handling**
   ```html
   <!-- Include error handling in your endpoint -->
   <wc-visibility-change
     hx-verb="GET"
     hx-url="/api/data"
     hx-target="#content"
     hx-indicator="#error-message">
   </wc-visibility-change>
   ```

2. **Loading States**
   ```html
   <!-- Show loading indicator during updates -->
   <div id="loading-spinner" class="htmx-indicator">
     Loading...
   </div>
   <wc-visibility-change
     hx-verb="GET"
     hx-url="/api/data"
     hx-target="#content"
     hx-indicator="#loading-spinner">
   </wc-visibility-change>
   ```

3. **Selective Updates**
   ```html
   <!-- Only update specific content -->
   <wc-visibility-change
     hx-verb="GET"
     hx-url="/api/data"
     hx-target="#content"
     hx-select="#updated-section">
   </wc-visibility-change>
   ```

## Browser Support

Requires browsers that support:
- Custom Elements v1
- Page Visibility API
- HTMX library

## Limitations

- Requires HTMX library
- Only triggers on tab visibility changes
- No offline support
- Single request per visibility change

## Debug Information

The component logs visibility state changes to the console:
```javascript
// When tab becomes hidden
"Tab is in the background"

// When tab becomes visible
"Tab is in the foreground"
```

## Examples

### Basic Data Refresh
```html
<wc-visibility-change
  hx-verb="GET"
  hx-url="/api/refresh"
  hx-target="#main-content"
  hx-swap="outerHTML">
</wc-visibility-change>
```

### With History Management
```html
<wc-visibility-change
  hx-verb="GET"
  hx-url="/api/data"
  hx-target="#content"
  hx-push-url="true"
  hx-swap="innerHTML">
</wc-visibility-change>
```

### Partial Content Update
```html
<wc-visibility-change
  hx-verb="GET"
  hx-url="/api/partial"
  hx-target="#container"
  hx-select="#updated-part"
  hx-swap="innerHTML">
</wc-visibility-change>
```

