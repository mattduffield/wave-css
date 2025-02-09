# WC-Tabulator Component Documentation

A powerful and flexible table/data grid web component built on top of the Tabulator library, offering features like pagination, sorting, filtering, and row manipulation.

## Features

- Remote data loading with AJAX support
- Pagination with customizable page sizes
- Column management (hiding, resizing, reordering)
- Row selection and manipulation
- Context menus for rows and headers
- Advanced filtering and sorting
- Column formatters and editors
- Row grouping
- Responsive layouts
- Export capabilities (CSV, JSON, HTML, PDF, XLSX)

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

Include the required JavaScript files:

```html
<script type="module" src="path/to/wc-tabulator.js"></script>
<script type="module" src="path/to/wc-tabulator-column.js"></script>
<script type="module" src="path/to/wc-tabulator-func.js"></script>
```

## Basic Usage

```html
<wc-tabulator 
  id="my-table"
  ajax-url="/api/data"
  pagination
  pagination-size="10">
  
  <wc-tabulator-column 
    field="id" 
    title="ID"
    width="100">
  </wc-tabulator-column>
  
  <wc-tabulator-column 
    field="name" 
    title="Name"
    formatter="link"
    formatter-params='{"url": "urlFormatter", "routePrefix": "screen", "screen": "user"}'>
  </wc-tabulator-column>
</wc-tabulator>
```

## Component Attributes

### Main Component (wc-tabulator)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `ajax-url` | String | "" | URL for remote data loading |
| `ajax-params` | String (JSON) | {} | Additional parameters for AJAX requests |
| `ajax-params-map` | String (JSON) | {} | Map table parameters to custom API parameters |
| `pagination` | Boolean | false | Enable pagination |
| `pagination-size` | Number | 10 | Number of rows per page |
| `pagination-counter` | String | "" | Custom pagination counter format |
| `movable-columns` | Boolean | false | Allow column reordering |
| `resizable-columns` | Boolean | false | Allow column resizing |
| `movable-rows` | Boolean | false | Allow row reordering |
| `row-height` | Number | null | Fixed row height |
| `frozen-rows` | Number | null | Number of frozen rows |
| `persistence` | Boolean | false | Enable column state persistence |
| `header-visible` | Boolean | true | Show/hide header |
| `row-context-menu` | String | null | Enable right-click context menu |
| `selectable-rows` | Boolean/Number | false | Enable row selection |
| `group-by` | String | null | Field to group rows by |
| `initial-filter` | String (JSON) | null | Initial filter conditions |

### Column Component (wc-tabulator-column)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `field` | String | Required | Data field name |
| `title` | String | field value | Column header text |
| `width` | Number/String | null | Column width |
| `formatter` | String | null | Cell formatter function |
| `formatter-params` | String (JSON) | null | Parameters for formatter |
| `editor` | String | null | Cell editor type |
| `editor-params` | String (JSON) | null | Parameters for editor |
| `header-filter` | String | null | Header filter type |
| `header-sort` | Boolean | true | Enable column sorting |
| `frozen` | Boolean | false | Freeze column |
| `responsive` | Number | null | Responsive visibility priority |
| `visible` | Boolean | true | Column visibility |

## Custom Functions (wc-tabulator-func)

```html
<wc-tabulator-func name="customFormatter" value="function(cell) { 
  return '<span class="badge">' + cell.getValue() + '</span>'; 
}"></wc-tabulator-func>
```

## Built-in Formatters

- `pageRowNum`: Displays row numbers with pagination support
- `localdatetime`: Formats datetime values
- `urlFormatter`: Creates URL links with custom routing

## Event Handling

The component supports various events:

```javascript
// Row click handler
<wc-tabulator row-click="handleRowClick">
  <!-- columns -->
</wc-tabulator>

// Row selection handlers
<wc-tabulator 
  row-selected="handleRowSelected"
  row-deselected="handleRowDeselected">
  <!-- columns -->
</wc-tabulator>
```

## Data Export

The component supports exporting data in multiple formats:
- CSV
- JSON
- HTML
- PDF
- XLSX

Access via the row context menu or programmatically:

```javascript
const table = document.querySelector('wc-tabulator');
table.table.download("csv", "data.csv");
```

## Ajax Configuration

### Custom URL Parameters

```html
<wc-tabulator 
  ajax-url="/api/data"
  ajax-params='{"type": "user", "status": "active"}'
  ajax-params-map='{"page": "pageNum", "size": "pageSize"}'>
  <!-- columns -->
</wc-tabulator>
```

### Response Format

The component expects the following response format for paginated data:

```json
{
  "data": [...],  // Array of row data
  "last_page": 10 // Total number of pages
}
```

## Server Response Format

The component expects specific data structures from the server depending on whether pagination is enabled or not.

### Non-Paginated Data

For tables without pagination, the server should return an array of objects directly under a `results` key:

```json
{
  "results": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "status": "inactive"
    }
  ]
}
```

### Paginated Data

For paginated tables, the server should return a response with the following structure:

```json
{
  "data": [
    {
      "id": 1,
      "name": "John Doe",
      "email": "john@example.com",
      "status": "active"
    },
    {
      "id": 2,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "status": "inactive"
    }
  ],
  "last_page": 10  // Total number of available pages
}
```

If there's no data available, the server should return:

```json
{
  "data": null,
  "last_page": 0
}
```

### Server-side Parameters

When the component makes requests to the server, it sends the following parameters:

#### Pagination Parameters
- `page`: Current page number (1-based)
- `size`: Number of records per page

Example URL: `/api/data?page=1&size=10`

#### Sorting Parameters
Sent as a JSON string in the `sort` parameter:

```json
[
  {
    "field": "name",
    "dir": "asc"
  }
]
```

Example URL: `/api/data?sort=[{"field":"name","dir":"asc"}]`

#### Filtering Parameters
Sent as a JSON string in the `filter` parameter:

```json
[
  {
    "field": "name",
    "type": "like",
    "value": "john"
  }
]
```

Example URL: `/api/data?filter=[{"field":"name","type":"like","value":"john"}]`

### Custom Parameter Mapping

You can map these default parameters to match your API requirements using the `ajax-params-map` attribute:

```html
<wc-tabulator 
  ajax-url="/api/data"
  ajax-params-map='{
    "page": "pageNumber",
    "size": "pageSize",
    "sort": "sortBy",
    "filter": "filterBy"
  }'>
</wc-tabulator>
```

This would transform the request to: `/api/data?pageNumber=1&pageSize=10`

### Additional Parameters

You can add fixed parameters to every request using the `ajax-params` attribute:

```html
<wc-tabulator 
  ajax-url="/api/data"
  ajax-params='{
    "type": "user",
    "status": "active"
  }'>
</wc-tabulator>
```

This would add to the request: `/api/data?type=user&status=active`

### Complete Request Example

A full request URL might look like:

```
/api/data?page=1&size=10&sort=[{"field":"name","dir":"asc"}]&filter=[{"field":"status","type":"eq","value":"active"}]&type=user
```

### Error Handling

The server should return appropriate HTTP status codes:
- 200: Successful request
- 400: Bad request (invalid parameters)
- 401: Unauthorized
- 403: Forbidden
- 404: Not found
- 500: Server error



## Styling

The component uses CSS variables for theming:

```css
:root {
  --card-bg-color: #ffffff;
  --card-border-color: #e5e5e5;
  --card-color: #333333;
  --primary-bg-color: #4a90e2;
  --surface-1: #ffffff;
  --surface-5: #f5f5f5;
  --text-1: #333333;
  --text-3: #999999;
  --accent-color: #4a90e2;
}
```

## Examples

### Searchable Table with Custom Formatting

```html
<wc-tabulator 
  id="users-table"
  ajax-url="/api/users"
  pagination
  pagination-size="20"
  selectable-rows>
  
  <wc-tabulator-func name="nameFormatter" value="function(cell) {
    return `<strong>${cell.getValue()}</strong>`;
  }"></wc-tabulator-func>
  
  <wc-tabulator-column 
    field="id" 
    title="ID"
    width="80">
  </wc-tabulator-column>
  
  <wc-tabulator-column 
    field="name" 
    title="Name"
    formatter="nameFormatter"
    header-filter="input">
  </wc-tabulator-column>
  
  <wc-tabulator-column 
    field="created_at" 
    title="Created"
    formatter="localdatetime">
  </wc-tabulator-column>
</wc-tabulator>
```

### Grouped Table with Row Actions

```html
<wc-tabulator 
  id="orders-table"
  ajax-url="/api/orders"
  group-by="status"
  row-context-menu="rowContextMenu">
  
  <wc-tabulator-column 
    field="order_id" 
    title="Order ID">
  </wc-tabulator-column>
  
  <wc-tabulator-column 
    field="status" 
    title="Status"
    formatter="badge">
  </wc-tabulator-column>
  
  <wc-tabulator-column 
    field="total" 
    title="Total"
    formatter="money"
    hozAlign="right">
  </wc-tabulator-column>
</wc-tabulator>
```

## Best Practices

1. Always specify column widths for better initial rendering
2. Use appropriate formatters for data types (dates, currency, etc.)
3. Enable pagination for large datasets
4. Implement proper error handling for AJAX requests
5. Use responsive layouts for mobile compatibility
6. Set appropriate header filters for searchable columns
7. Consider row height for dense data displays
8. Use column freezing for wide tables
9. Implement proper sorting for formatted columns

## Browser Support

The component relies on modern web components and the Tabulator library. It should work in all modern browsers that support Custom Elements v1.



