# WC-Textarea Web Component

A custom web component that provides an enhanced textarea input with form association capabilities and additional features.

## Features

- Form-associated custom element
- Support for validation
- Label integration
- Disabled/readonly states
- Placeholder text
- Custom styling support
- Value handling for both attribute and content
- Standard textarea attributes support (rows, cols, etc.)

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

Include the required JavaScript files:

```html
<script type="module" src="path/to/wc-textarea.js"></script>
```

## Basic Usage

```html
<!-- Basic usage with value attribute -->
<wc-textarea 
  class="col-1"
  name="comments"
  value="Initial comment..."
  placeholder="Enter comments here...">
</wc-textarea>

<!-- Usage with label and content -->
<wc-textarea 
  class="col-1"
  lbl-label="Notes"
  name="notes"
  placeholder="Enter notes here...">
  Initial content goes here...
</wc-textarea>
```

## Attributes

| Attribute    | Type    | Default | Description                                    |
|--------------|---------|---------|------------------------------------------------|
| name         | string  | -       | Input name for form submission                 |
| id           | string  | -       | Element identifier                             |
| value        | string  | ''      | Initial value (overrides content)              |
| rows         | number  | -       | Number of visible text lines                   |
| cols         | number  | -       | Width of the textarea in characters            |
| placeholder  | string  | -       | Placeholder text                               |
| lbl-label    | string  | -       | Label text shown above the textarea            |
| disabled     | boolean | false   | Disables user input                            |
| readonly     | boolean | false   | Makes the textarea read-only                   |
| required     | boolean | false   | Makes the field required                       |
| autofocus    | boolean | false   | Automatically focuses the textarea             |
| elt-class    | string  | -       | Additional classes for the textarea element    |
| class        | string  | -       | Classes for the component wrapper              |

## Value Handling

The component handles values in two ways:
1. Through the `value` attribute
2. Through content within the tags

**Priority**: If both a `value` attribute and content are provided, the `value` attribute takes precedence.

```html
<!-- Value attribute takes precedence -->
<wc-textarea 
  name="notes" 
  value="This will be shown">
  This content will be ignored
</wc-textarea>

<!-- Content is used when no value attribute exists -->
<wc-textarea name="notes">
  This content will be shown
</wc-textarea>
```

## States

### Disabled State
```html
<wc-textarea 
  name="comments"
  disabled>
</wc-textarea>
```

### Read-only State
```html
<wc-textarea 
  name="comments"
  readonly>
</wc-textarea>
```

### Required Field
```html
<wc-textarea 
  name="comments"
  required>
</wc-textarea>
```

## Styling

The component uses a contents display mode and includes basic styling. You can customize the appearance using CSS:

```css
/* Target the textarea element */
wc-textarea textarea {
  /* Your styles here */
}

/* Target the label */
wc-textarea label {
  /* Your styles here */
}
```

## Form Integration

The component is form-associated and works with standard form submission and validation:

```html
<form>
  <wc-textarea 
    name="comments" 
    required>
  </wc-textarea>
  <button type="submit">Submit</button>
</form>
```

## Full Example

```html
<wc-textarea 
  class="col-1"
  lbl-label="Project Notes"
  name="project_notes"
  rows="10"
  placeholder="Enter project notes here..."
  required
  autofocus>
  10/30/2024 - Project kickoff meeting completed
  10/28/2024 - Initial requirements gathered
</wc-textarea>
```

## Browser Support

Requires browsers that support:
- Custom Elements v1
- Shadow DOM v1
- ES6 Modules
- Form-associated custom elements

## Inheritance

The component extends from `WcBaseFormComponent` which provides core form functionality including:
- Form association
- Value handling
- Validation
- Event handling

## Events

The component fires standard input events:
- `input`: When the value changes
- `change`: When the value is committed

## Notes

1. The component automatically generates a unique ID if none is provided
2. Form validation is handled through the native constraint validation API
3. The component maintains proper form association for use in standard HTML forms
4. Label positioning and styling can be customized through CSS
