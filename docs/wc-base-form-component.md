# WcBaseFormComponent Base Class

A foundational base class for creating form-associated web components. This class extends `WcBaseComponent` and adds comprehensive form functionality including value handling, validation, and form association.

## Features

- Form association support
- Built-in validation handling
- Value management
- Checkbox state handling
- Error display modes
- Form element event binding
- Required state management

## Demo
[Demo Site](https://mattduffield.github.io/wave-css/views/)


## Usage

Extend this class to create form-related web components:

```javascript
import { WcBaseFormComponent } from './wc-base-form-component.js';

class MyFormComponent extends WcBaseFormComponent {
  static get observedAttributes() {
    return ['id', 'class', 'value', 'required'];
  }

  constructor() {
    super();
    this.componentElement = document.createElement('div');
    this.componentElement.classList.add('my-form-component');
    this.appendChild(this.componentElement);
  }

  _render() {
    super._render();
    this.componentElement.innerHTML = `
      <input type="text" form-element>
    `;
  }
}

customElements.define('my-form-component', MyFormComponent);
```

## Properties

### Value Management

```javascript
// Get the current value
get value() {
  const component = document.querySelector('my-form-component');
  console.log(component.value);
}

// Set a new value
set value(newValue) {
  const component = document.querySelector('my-form-component');
  component.value = newValue;
}
```

### Required State

```javascript
// Check if required
get required() {
  return this.hasAttribute('required');
}

// Set required state
set required(isRequired) {
  if (isRequired) {
    this.setAttribute('required', '');
  } else {
    this.removeAttribute('required');
  }
}
```

### Checkbox State

```javascript
// Get checked state
get checked() {
  return this.formElement?.checked || false;
}

// Set checked state
set checked(isChecked) {
  if (this._isCheckbox()) {
    this.formElement.checked = isChecked;
    this._internals.setFormValue(isChecked ? 'bool:True' : 'bool:False');
  }
}
```

## Validation

### Methods

```javascript
// Check validity without UI feedback
checkValidity() {
  return this._internals.checkValidity();
}

// Check validity with UI feedback
reportValidity() {
  return this._internals.reportValidity();
}

// Access validation state
get validity() {
  return this._internals.validity;
}

// Get validation message
get validationMessage() {
  return this._internals.validationMessage;
}

// Check if element will validate
get willValidate() {
  return this._internals.willValidate;
}
```

## Error Display Modes

The component supports two error display modes: tooltip and span

```javascript
// Tooltip mode
_handleValidation() {
  if (errorMode === 'tooltip') {
    if (!this.formElement?.validity.valid) {
      this.formElement?.setAttribute('data-error', this.formElement?.validationMessage);
    } else {
      this.formElement?.removeAttribute('data-error');
    }
  }
}

// Span mode
_handleValidation() {
  if (errorMode === 'span') {
    if (!this.formElement?.validity.valid) {
      const span = document.createElement('span');
      span.classList.add('error-message');
      span.textContent = this.formElement?.validationMessage;
      this.componentElement.appendChild(span);
    }
  }
}
```

## Event Handling

The component automatically handles input and change events:

```javascript
_wireEvents() {
  super._wireEvents();
  if (this.formElement) {
    this.formElement.addEventListener('input', this._handleInputChange.bind(this));
    this.formElement.addEventListener('change', this._handleInputChange.bind(this));
  }
}
```

## Implementation Example

Here's a complete example of a custom form component:

```javascript
import { WcBaseFormComponent } from './wc-base-form-component.js';

class CustomInput extends WcBaseFormComponent {
  static get observedAttributes() {
    return ['id', 'class', 'value', 'required', 'placeholder'];
  }

  constructor() {
    super();
    this.componentElement = document.createElement('div');
    this.componentElement.classList.add('custom-input');
    this.appendChild(this.componentElement);
  }

  _render() {
    super._render();
    this.componentElement.innerHTML = `
      <label if="label"></label>
      <input type="text" form-element>
      <span class="error-message"></span>
    `;
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'placeholder') {
      this.formElement?.setAttribute('placeholder', newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }
}

customElements.define('custom-input', CustomInput);
```

## Special Types Support

### Checkbox Handling

```javascript
_isCheckbox() {
  return this.formElement?.type === 'checkbox';
}

// Special value handling for checkboxes
if (this._isCheckbox()) {
  this.formElement.value = target.checked ? "bool:True" : "bool:False";
}
```

### Range Input Support

```javascript
_isRange() {
  return this.formElement?.type === 'range';
}

// Special label handling for range inputs
if (this._isRange()) {
  const label = this.querySelector('label');
  label.textContent = `${this.getAttribute('lbl-label')} (${value})`;
}
```

## Best Practices

1. Always define `formElement` in your components:
   ```javascript
   this.formElement = this.querySelector('[form-element]');
   ```

2. Handle validation appropriately:
   ```javascript
   _handleValidation() {
     super._handleValidation();
     // Custom validation logic
   }
   ```

3. Clean up event listeners:
   ```javascript
   disconnectedCallback() {
     this._unWireEvents();
     super.disconnectedCallback();
   }
   ```

4. Properly handle attribute changes:
   ```javascript
   _handleAttributeChange(attrName, newValue) {
     if (attrName === 'custom-attr') {
       // Handle custom attribute
     } else {
       super._handleAttributeChange(attrName, newValue);
     }
   }
   ```

## Browser Support

Requires browsers that support:
- Custom Elements v1
- Form-associated custom elements
- ElementInternals API

