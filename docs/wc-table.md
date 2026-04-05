# wc-table — CSS Table Utility Classes

Wave CSS provides a comprehensive set of CSS classes for styling standard HTML `<table>` elements. These are **not a web component** — they're utility classes applied directly to tables.

## Base Table

```html
<table class="wc-table">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Status</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Jane Smith</td>
      <td>jane@acme.com</td>
      <td>Active</td>
    </tr>
  </tbody>
</table>
```

## Variants

### Striped Rows
```html
<table class="wc-table wc-table-striped">
```
Alternating row backgrounds for readability.

### Hover
```html
<table class="wc-table wc-table-hover">
```
Row highlight on mouse hover.

### Bordered
```html
<table class="wc-table wc-table-bordered">
```
Borders on all cells.

### Borderless
```html
<table class="wc-table wc-table-borderless">
```
Remove all borders.

### Dark Theme
```html
<table class="wc-table wc-table-dark">
```
Dark background with light text.

### Clickable Rows
```html
<table class="wc-table wc-table-clickable">
```
Pointer cursor on rows — indicates rows are interactive.

## Size Variants

| Class | Description |
|-------|-------------|
| `.wc-table-sm` | Compact padding (0.25rem) — data-dense views |
| `.wc-table-md` | Medium padding (0.5rem) — default |
| `.wc-table-lg` | Spacious padding (0.75rem) |

```html
<table class="wc-table wc-table-sm wc-table-striped">
```

## Fixed Header

```html
<div class="wc-table-responsive" style="max-height: 400px;">
  <table class="wc-table wc-table-fixed-header">
    <thead>
      <tr><th>Name</th><th>Email</th></tr>
    </thead>
    <tbody>
      <!-- Scrollable body, sticky header -->
    </tbody>
  </table>
</div>
```

## Responsive Wrapper

```html
<div class="wc-table-responsive">
  <table class="wc-table">
    <!-- Horizontally scrollable on small screens -->
  </table>
</div>
```

## Row/Cell Status Colors

Apply to `<tr>` or `<td>` elements:

| Class | Color |
|-------|-------|
| `.wc-table-active` | Active/selected highlight |
| `.wc-table-success` | Green — success |
| `.wc-table-warning` | Yellow — warning |
| `.wc-table-error` | Red — error |
| `.wc-table-info` | Blue — informational |
| `.wc-table-primary` | Primary theme color |

```html
<tr class="wc-table-success">
  <td>Completed</td>
  <td>All checks passed</td>
</tr>
```

## Text Alignment

| Class | Alignment |
|-------|-----------|
| `.wc-text-left` | Left-aligned |
| `.wc-text-center` | Center-aligned |
| `.wc-text-right` | Right-aligned |

```html
<th class="wc-text-right">Amount</th>
```

## Sortable Headers

| Class | Description |
|-------|-------------|
| `.wc-sortable` | Indicates column is sortable (shows cursor) |
| `.wc-sort-asc` | Currently sorted ascending (shows ▲ indicator) |
| `.wc-sort-desc` | Currently sorted descending (shows ▼ indicator) |

```html
<th class="wc-sortable wc-sort-asc">Name</th>
<th class="wc-sortable">Email</th>
```

## Empty State

```html
<table class="wc-table">
  <tbody>
    <tr class="wc-table-empty">
      <td colspan="3">No records found</td>
    </tr>
  </tbody>
</table>
```

## Nested Tables

```html
<table class="wc-table">
  <tr>
    <td>Parent Row</td>
    <td>
      <table class="wc-table wc-table-nested wc-table-sm">
        <tr><td>Child 1</td></tr>
        <tr><td>Child 2</td></tr>
      </table>
    </td>
  </tr>
</table>
```

## Full Example — Data-Dense Table

```html
<div class="wc-table-responsive" style="max-height: 500px;">
  <table class="wc-table wc-table-sm wc-table-striped wc-table-hover wc-table-fixed-header wc-table-clickable">
    <thead>
      <tr>
        <th class="wc-sortable wc-sort-asc">Name</th>
        <th class="wc-sortable">Email</th>
        <th class="wc-sortable wc-text-right">Amount</th>
        <th class="wc-text-center">Status</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Jane Smith</td>
        <td>jane@acme.com</td>
        <td class="wc-text-right">$12,500</td>
        <td class="wc-text-center wc-table-success">Active</td>
      </tr>
      <tr>
        <td>John Doe</td>
        <td>john@example.com</td>
        <td class="wc-text-right">$8,200</td>
        <td class="wc-text-center wc-table-warning">Pending</td>
      </tr>
      <tr>
        <td>Bob Wilson</td>
        <td>bob@corp.io</td>
        <td class="wc-text-right">$0</td>
        <td class="wc-text-center wc-table-error">Inactive</td>
      </tr>
    </tbody>
  </table>
</div>
```

## CSS Variables

The table classes use Wave CSS theme variables automatically. No additional configuration needed — tables adapt to the active theme.

## Combining Classes

Classes can be freely combined:

```html
<!-- Compact, striped, hoverable, with fixed header -->
<table class="wc-table wc-table-sm wc-table-striped wc-table-hover wc-table-fixed-header">

<!-- Bordered, dark, large padding -->
<table class="wc-table wc-table-bordered wc-table-dark wc-table-lg">

<!-- Clickable rows with responsive wrapper -->
<div class="wc-table-responsive">
  <table class="wc-table wc-table-hover wc-table-clickable">
</div>
```
