# WC Select Component

The `wc-select` is a customizable web component that provides enhanced select/dropdown functionality with support for both single and multiple selections, including a modern chip-based interface.

## Features

- Support for standard HTML select
- Multiple support
- Chip support
- Disabled/readonly states
- Required field indication


## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

Ensure you have the following dependencies:
- Base component files (`wc-base-component.js` and `wc-base-form-component.js`)
- Helper functions (`helper-function.js`)

## Basic Usage

### Single Selection
```html
<!-- Basic select with static options -->
<wc-select name="gender" lbl-label="Gender" value="male">
  <option value="male">Male</option>
  <option value="female">Female</option>
</wc-select>

<!-- Using items attribute with key-value pairs -->
<wc-select name="gender" 
  lbl-label="Gender"
  value="male"
  items='[{"key": "Female", "value": "female"}, {"key": "Male", "value": "male"}]'>
</wc-select>

<!-- Using custom display/value members -->
<wc-select name="gender"
  lbl-label="Gender"
  value="male"
  display-member="label"
  value-member="value"
  items='[{"label": "Female", "value": "female"}, {"label": "Male", "value": "male"}]'>
</wc-select>
```

### Multiple Selection
```html
<!-- Multiple selection with chip mode -->
<wc-select name="favorite_fruit"
  mode="chip"
  lbl-label="Favorite Fruits"
  multiple>
  <option value="apple" selected>Apple</option>
  <option value="banana">Banana</option>
  <option value="cherry">Cherry</option>
</wc-select>

<!-- Multiple selection with traditional select -->
<wc-select name="favorite_fruit"
  mode="multiple"
  lbl-label="Favorite Fruits"
  multiple>
  <option value="apple" selected>Apple</option>
  <option value="banana">Banana</option>
  <option value="cherry">Cherry</option>
</wc-select>
```

## Attributes

| Attribute | Type | Description | Default | Required |
|-----------|------|-------------|---------|----------|
| `name` | String | Form field name | - | Yes |
| `lbl-label` | String | Label text | - | No |
| `value` | String | Selected value | - | No |
| `items` | JSON Array | Data items for options | - | No |
| `display-member` | String | Property name for display text | 'key' | No |
| `value-member` | String | Property name for value | 'value' | No |
| `mode` | String | Select mode ('chip' or 'multiple') | - | No |
| `multiple` | Boolean | Enable multiple selection | false | No |
| `disabled` | Boolean | Disable the select | false | No |
| `required` | Boolean | Make the field required | false | No |
| `class` | String | CSS classes | - | No |
| `autofocus` | Boolean | Automatically focus the select | false | No |

### Chip Mode
- Modern interface for multiple selections
- Interactive chips for selected items
- Search/filter functionality
- Keyboard navigation
- Removable chips
- Dropdown with remaining options

### Multiple Select Mode
- Traditional multi-select interface
- Native browser behavior
- Keyboard navigation

### Data Binding
1. Static Options:
```html
<wc-select name="color" lbl-label="Color">
  <option value="red">Red</option>
  <option value="blue">Blue</option>
</wc-select>
```

2. JSON Items:
```html
<wc-select name="color" 
  lbl-label="Color"
  items='[
    {"key": "Red", "value": "red"},
    {"key": "Blue", "value": "blue"}
  ]'>
</wc-select>
```

3. Custom Display/Value Members:
```html
<wc-select name="color"
  lbl-label="Color"
  display-member="label"
  value-member="id"
  items='[
    {"label": "Red", "id": "1"},
    {"label": "Blue", "id": "2"}
  ]'>
</wc-select>
```

## Styling

The component uses CSS variables for theming:

```css
:root {
  --primary-bg-color: /* Background color for chips and highlights */
  --primary-color: /* Text color for chips and highlights */
  --secondary-bg-color: /* Background color for dropdown */
  --accent-bg-color: /* Border color for dropdown */
  --button-hover-bg-color: /* Background color for hover states */
  --button-hover-color: /* Text color for hover states */
}
```

### CSS Classes
- `.wc-select`: Main container
- `.chip-container`: Container for chips
- `.chip`: Individual chip
- `.dropdown`: Dropdown container
- `.dropdown-input`: Search input
- `.options-container`: Options list container
- `.option`: Individual option

## Events

The component dispatches standard events:
- `change`: When selection changes
- `input`: When search input changes (chip mode)

## Form Integration

The component is form-associated and supports:
- Form validation
- Required field validation
- Disabled state
- Form submission with proper values
- Multiple selection values

## Browser Support

Requires browsers with support for:
- Custom Elements v1
- Shadow DOM v1
- Form-associated Custom Elements
- Modern CSS Features (CSS Variables, Flexbox)

## Examples

### Required Select with Validation
```html
<wc-select name="country" 
  lbl-label="Country"
  required>
  <option value="">Select a country...</option>
  <option value="us">United States</option>
  <option value="uk">United Kingdom</option>
</wc-select>
```

### Disabled Select
```html
<wc-select name="category"
  lbl-label="Category"
  value="books"
  disabled>
  <option value="books">Books</option>
  <option value="movies">Movies</option>
</wc-select>
```

### Multiple Selection with Pre-selected Values
```html
<wc-select name="hobbies"
  mode="chip"
  lbl-label="Hobbies"
  multiple>
  <option value="reading" selected>Reading</option>
  <option value="gaming" selected>Gaming</option>
  <option value="cooking">Cooking</option>
</wc-select>
```
