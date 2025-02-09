# WC Code Mirror Component

The `wc-code-mirror` is a custom web component that wraps CodeMirror 5, providing a feature-rich code editor with syntax highlighting, line numbers, code folding, and other advanced editing capabilities.

## Features

- CodeMirror 5 integration
- Multiple themes and language modes
- Line numbering
- Code folding
- Line wrapping
- Settings popover for configuration
- Form-associable component
- Sublime keybindings
- Show invisible characters
- Custom tab handling
- Bracket matching
- HTMX integration
- Responsive design

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

1. Import the component and its dependencies:

```javascript
import { WcCodeMirror } from './wc-code-mirror.js';
```

2. Include required CodeMirror 5 CDN resources (automatically handled by the component).

## Basic Usage

```html
<wc-code-mirror
  name="code-editor"
  line-numbers
  mode="javascript"
  theme="monokai"
  value="console.log('Hello World!');"
  tab-size="2"
  indent-unit="2">
</wc-code-mirror>
```

## Attributes

| Attribute       | Description                              | Default     |
|----------------|------------------------------------------|-------------|
| `name`         | *Required* Unique identifier              | -           |
| `mode`         | Programming language mode                 | javascript  |
| `theme`        | Editor color theme                       | default     |
| `line-numbers` | Show line numbers (boolean)              | false       |
| `line-wrapping`| Enable line wrapping (boolean)           | false       |
| `fold-gutter`  | Enable code folding (boolean)            | false       |
| `tab-size`     | Number of spaces per tab                 | 4           |
| `indent-unit`  | Number of spaces for indentation         | 2           |
| `value`        | Initial editor content                   | ""          |
| `disabled`     | Disable editing (boolean)                | false       |
| `required`     | Mark as required form field (boolean)    | false       |
| `height`       | Editor height                            | auto        |
| `lbl-label`    | Label text                              | -           |
| `lbl-class`    | Label CSS class                         | -           |

## Available Modes

The component supports all CodeMirror 5 language modes, including:
- javascript
- html
- css
- python
- java
- xml
- markdown
- sql
- json
- yaml
- And many more...

## Available Themes

Includes all CodeMirror 5 themes:
- monokai
- dracula
- material
- solarized
- nord
- eclipse
- And many more...

## Component Structure

```html
<wc-code-mirror>
  <div class="wc-code-mirror">
    <!-- Optional label -->
    <label for="editor-name">Label Text</label>
    
    <!-- Settings button -->
    <button class="settings-icon">...</button>
    
    <!-- CodeMirror instance -->
    <div class="CodeMirror">...</div>
    
    <!-- Settings popover -->
    <div class="settings-popover" popover="manual">...</div>
  </div>
</wc-code-mirror>
```

## Example Implementations

### Basic Code Editor

```html
<wc-code-mirror
  name="basic-editor"
  line-numbers
  mode="javascript"
  theme="monokai">
</wc-code-mirror>
```

### HTML Editor with Code Folding

```html
<wc-code-mirror
  name="html-editor"
  line-numbers
  fold-gutter
  mode="htmlmixed"
  theme="material"
  line-wrapping>
</wc-code-mirror>
```

### Form Integration

```html
<form id="codeForm">
  <wc-code-mirror
    name="code-input"
    required
    line-numbers
    mode="javascript"
    theme="dracula">
  </wc-code-mirror>
  <button type="submit">Submit</button>
</form>
```

## JavaScript API

### Properties

- `value`: Get or set editor content
- `editor`: Access to CodeMirror instance

### Methods

```javascript
const editor = document.querySelector('wc-code-mirror');

// Refresh editor layout
await editor.refresh();

// Load specific theme
await editor.loadTheme('dracula');

// Load language mode
await editor.loadMode('python');

// Get current value
const code = editor.value;

// Set new value
editor.value = 'const x = 42;';
```

## Settings Popover

The component includes a settings popover that allows users to modify:
- Theme
- Language mode
- Line numbers
- Line wrapping
- Code folding
- Tab size
- Indent unit

## Styling

### Default Styles

```css
.wc-code-mirror {
  position: relative;
  width: 100%;
  display: flex;
  flex-direction: column;
  min-height: 10em;
  border: 2px solid transparent;
}

.CodeMirror {
  height: auto;
  min-height: 150px;
  width: 100%;
}
```

### Customization Examples

```css
/* Custom editor height */
.wc-code-mirror {
  min-height: 20em;
}

/* Custom settings icon */
.settings-icon {
  color: #666;
}

/* Custom focus state */
.wc-code-mirror:focus-within {
  border-color: #007bff;
}
```

## Form Integration

The component implements the `FormAssociated` interface and supports:
- Form submission
- Form reset
- Form validation
- Disabled state
- Required field

```javascript
// Access form data
const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const formData = new FormData(form);
  const code = formData.get('editor-name');
});
```

## Event Handling

### Editor Events

```javascript
const editor = document.querySelector('wc-code-mirror');

// Access CodeMirror instance
editor.editor.on('change', () => {
  console.log('Content changed:', editor.value);
});
```

## Best Practices

1. Performance
   - Use appropriate language modes
   - Load only required addons
   - Consider lazy loading for multiple editors

2. Accessibility
   - Always provide labels
   - Use meaningful names
   - Maintain keyboard navigation

3. Form Integration
   - Use unique names
   - Handle form submissions appropriately
   - Validate input when required

4. Error Handling
   - Check for required attributes
   - Handle loading failures gracefully
   - Provide feedback for user actions

## Browser Support

Requirements:
- Modern browsers with Custom Elements v1
- Support for Popover API
- ES6+ features
- CSS Grid and Flexbox

## Dependencies

- CodeMirror 5.65.5+
- WcBaseComponent base class
- helper-function.js utilities

## Troubleshooting

Common issues and solutions:

1. Editor Not Loading
   - Check CDN availability
   - Verify required attributes
   - Check console for errors

2. Styling Issues
   - Verify theme loading
   - Check CSS specificity
   - Inspect container dimensions

3. Mode/Theme Loading
   - Check network requests
   - Verify CDN paths
   - Check mode dependencies
