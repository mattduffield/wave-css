import { WcBaseComponent } from './wc-base-component.js';

export class WcBaseFormComponent extends WcBaseComponent {
  static formAssociated = true; // Required to enable form-associated behavior

  constructor() {
    super();
    this._internals = this.attachInternals(); // Attaches FormAssociated internals
    this._value = ''; // Internal value for form element
  }

  // Value getter and setter
  get value() {
    return this._isCheckbox() ? this.checked : this._value;
  }
  
  set value(newValue) {
    if (this._isCheckbox()) {
      this.checked = newValue;
    } else {
      this._value = newValue;
      this._internals.setFormValue(this._value); // Set the form value to submit
    }
  }

  // Required attribute getter and setter
  get required() {
    return this.hasAttribute('required');
  }

  set required(isRequired) {
    if (isRequired) {
      this.setAttribute('required', '');
    } else {
      this.removeAttribute('required');
    }
  }

  get checked() {
    return this.formElement?.checked || false;
  }

  set checked(isChecked) {
    if (this._isCheckbox()) {
      this.formElement.checked = isChecked;
      this._internals.setFormValue(isChecked ? 'bool:True' : 'bool:False');
    }
  }

  // Validation handling
  get validity() {
    return this._internals.validity;
  }

  get validationMessage() {
    return this._internals.validationMessage;
  }

  get willValidate() {
    return this._internals.willValidate;
  }

  checkValidity() {
    return this._internals.checkValidity();
  }

  reportValidity() {
    return this._internals.reportValidity();
  }

  // Apply any default validations here, if necessary
  _handleValidation() {
    const errorMode = ''; // tooltip or span
    if (errorMode === 'span') {
      if (!this.formElement?.validity.valid) {
        const span = document.createElement('span');
        span.classList.add('error-message');
        span.textContent = this.formElement?.validationMessage;
        this.componentElement.appendChild(span);
      } else {
        const span = this.componentElement.querySelector('.error-message');
        span?.remove();
      }      
    } else if (errorMode === 'tooltip') {
      if (!this.formElement?.validity.valid) {
        const msg = this.formElement?.validationMessage;
        this.formElement?.setAttribute('data-error', msg);
        this.formElement?.setAttribute('data-has-title', this.formElement?.getAttribute('title') || '');
        this.formElement?.setAttribute('title', '');
      } else {
        this.formElement?.removeAttribute('data-error');
        this.formElement?.setAttribute('title', this.formElement?.getAttribute('data-has-title'));
        this.formElement?.removeAttribute('data-has-title');
      }
    }
    this._internals.setValidity(this.formElement?.validity, this.formElement?.validationMessage);
  }

  connectedCallback() {
    super.connectedCallback();
    this.formElement = this.querySelector('input, select, textarea'); // Define form element
    console.log('wc-base-form-component:connectedCallback - formElement', this.formElement);
    this._wireEvents();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'value') {
      if (this._isCheckbox()) {
        this.checked = newValue !== null && newValue !== 'false' && newValue !== 'bool:False';
      } else {
        if (this.formElement) {
          this.formElement?.setAttribute('value', newValue);
          if ('value' in this.formElement) {
            this.formElement.value = newValue;
          }
        }
        this.value = newValue;
      }
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _handleInputChange(event) {
    const {target} = event;
    if (this._isCheckbox()) {
      this.checked = target.checked;
    } else {
      this.value = target.value;
    }
    if (this._isRange()) {
      const label = this.querySelector('label');
      const lbl = this.getAttribute('lbl-label') || '';
      if (label && lbl) {
        label.textContent = `${lbl} (${target.value})`;
      }
    }
    this._handleValidation();
  }

  _isCheckbox() {
    return this.formElement?.type === 'checkbox';
  }

  _isRange() {
    return this.formElement?.type === 'range';
  }

  _wireEvents() {
    super._wireEvents();
    if (this.formElement) {
      this.formElement.addEventListener('input', this._handleInputChange.bind(this));
      this.formElement.addEventListener('change', this._handleInputChange.bind(this));
    }
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.formElement) {
      this.formElement.removeEventListener('input', this._handleInputChange.bind(this));
      this.formElement.removeEventListener('change', this._handleInputChange.bind(this));
    }
  }
}
