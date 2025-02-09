# WC-Hotkey Web Component

`wc-hotkey` is a lightweight web component that enables keyboard shortcuts (hotkeys) for any clickable element on your page. It provides an easy way to add keyboard mnemonics to improve user efficiency.

## Features

- Simple key combination configuration
- Support for modifier keys (Ctrl, Shift, Alt, Cmd)
- Automatic event cleanup
- Target element selection via CSS selectors
- Case-insensitive key matching

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)

## Installation

```javascript
import './wc-hotkey.js';
// The component self-registers if not already defined
```

## Basic Usage

```html
<!-- Basic shortcut -->
<wc-hotkey keys="ctrl+s" target="#saveButton"></wc-hotkey>

<!-- With multiple modifier keys -->
<wc-hotkey keys="ctrl+shift+a" target=".action-button"></wc-hotkey>
```

## Attributes

| Attribute | Description | Required | Example Values |
|-----------|-------------|----------|----------------|
| keys      | Key combination to trigger the action | Yes | "ctrl+s", "shift+a" |
| target    | CSS selector for the target element | Yes | "#saveButton", ".submit-btn" |

## Supported Key Combinations

### Modifier Keys
- `ctrl` - Control key
- `shift` - Shift key
- `alt` - Alt key
- `cmd` - Command key (Mac)

### Regular Keys
- Any single character (a-z, 0-9)
- Special keys (enter, space, etc.)

## Examples

### Form Submission
```html
<!-- Submit form with Ctrl+Enter -->
<form id="myForm">
  <input type="text" name="username">
  <button type="submit" id="submitBtn">Submit</button>
  <wc-hotkey keys="ctrl+enter" target="#submitBtn"></wc-hotkey>
</form>
```

### Modal Actions
```html
<!-- Close modal with Escape -->
<div class="modal">
  <button class="close-modal">Close</button>
  <wc-hotkey keys="esc" target=".close-modal"></wc-hotkey>
</div>
```

### Multiple Actions
```html
<!-- Multiple hotkeys for different actions -->
<div class="editor">
  <button id="save">Save</button>
  <button id="copy">Copy</button>
  <button id="paste">Paste</button>

  <wc-hotkey keys="ctrl+s" target="#save"></wc-hotkey>
  <wc-hotkey keys="ctrl+c" target="#copy"></wc-hotkey>
  <wc-hotkey keys="ctrl+v" target="#paste"></wc-hotkey>
</div>
```

### Complex Key Combinations
```html
<!-- Multiple modifier keys -->
<div class="application">
  <button id="specialAction">Special Action</button>
  <wc-hotkey keys="ctrl+shift+a" target="#specialAction"></wc-hotkey>
</div>
```

## Common Use Cases

### Save Operations
```html
<div class="editor">
  <button type="button" id="saveButton">Save</button>
  <wc-hotkey keys="ctrl+s" target="#saveButton"></wc-hotkey>
</div>
```

### Navigation
```html
<nav>
  <button class="nav-home">Home</button>
  <wc-hotkey keys="alt+h" target=".nav-home"></wc-hotkey>
</nav>
```

### Form Controls
```html
<form>
  <button type="submit" id="submit">Submit</button>
  <button type="reset" id="reset">Reset</button>
  
  <wc-hotkey keys="ctrl+enter" target="#submit"></wc-hotkey>
  <wc-hotkey keys="ctrl+r" target="#reset"></wc-hotkey>
</form>
```

## Best Practices

1. Use intuitive key combinations:
```html
<!-- Standard combinations users expect -->
<wc-hotkey keys="ctrl+s" target="#save"></wc-hotkey>
<wc-hotkey keys="ctrl+p" target="#print"></wc-hotkey>
```

2. Ensure target elements exist:
```html
<!-- Make sure the target element is in the DOM -->
<button id="actionButton">Action</button>
<wc-hotkey keys="ctrl+a" target="#actionButton"></wc-hotkey>
```

3. Avoid conflicting shortcuts:
```html
<!-- Don't use the same combination for different actions -->
<wc-hotkey keys="ctrl+s" target="#save"></wc-hotkey>
<!-- DON'T: <wc-hotkey keys="ctrl+s" target="#something-else"></wc-hotkey> -->
```

4. Consider platform differences:
```html
<!-- Use ctrl for Windows/Linux and cmd for Mac -->
<wc-hotkey keys="ctrl+s" target="#save"></wc-hotkey>
<wc-hotkey keys="cmd+s" target="#save"></wc-hotkey>
```

## Technical Details

- Automatic event listener cleanup
- Case-insensitive key matching
- Prevents default browser actions when hotkey is triggered
- No Shadow DOM usage
- Minimal footprint

## Browser Support

Requires browsers that support:
- Custom Elements v1
- ES6 Classes
- KeyboardEvent API

## Notes

- The component automatically prevents default browser actions for configured key combinations
- Event listeners are automatically cleaned up when the component is removed
- Key combinations are case-insensitive
- Target elements must exist when the component is connected
- Multiple hotkeys can target the same element
- Component logs errors if required attributes are missing or target elements aren't found

