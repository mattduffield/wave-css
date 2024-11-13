
import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcSelectBox extends WcBaseFormComponent {
  static get observedAttributes() {
    return ['name', 'id', 'class', 'multiple', 'value', 'items', 'display-member', 'value-member', 'lbl-label', 'disabled', 'required', 'autofocus', 'elt-class'];
    // return ['mode']; // Allows switching between "multiple" and "chip" modes
  }

  constructor() {
    super();
    this.selectedOptions = [];
    this.mode = this.getAttribute('mode') || 'chip'; // Default to 'chip' mode if not specified
    this.highlightedIndex = -1;
    const compEl = this.querySelector('.wc-select-box');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-select-box', 'relative');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-select-box');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-select-box');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }


  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'autofocus') {
      this.formElement?.setAttribute('autofocus', '');
    } else if (attrName === 'items') {
      if (typeof newValue === 'string') {
        this._items = JSON.parse(newValue);
        this._generateOptionsFromItems();
      }
      this.removeAttribute('items');      
    } else if (attrName === 'disabled') {
      this.formElement?.setAttribute('disabled', '');
    } else if (attrName === 'required') {
      this.formElement?.setAttribute('required', '');
    } else if (attrName === 'multiple') {
      this.formElement?.setAttribute('multiple', '');
    } else if (attrName === 'lbl-label') {
      // Do nothing...
    } else if (attrName === 'value-member') {
      // Do nothing...
    } else if (attrName === 'display-member') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-select-box > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';

      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-select-box');
  }
  _createInnerElement() {
    const labelText = this.getAttribute('lbl-label') || '';
    const name = this.getAttribute('name');
    const options = this.querySelectorAll('option');
    if (this.hasAttribute('lbl-label')) {
      const lbl = document.createElement('label');
      lbl.textContent = labelText;
      if (this.getAttribute('mode') === 'chip') {
        lbl.setAttribute('for', 'dropdownInput');
      } else {
        lbl.setAttribute('for', name);
      }
      this.componentElement.appendChild(lbl);
    }

    const select = document.createElement('select');
    select.id = name;
    select.name = name;
    options.forEach(opt => select.appendChild(opt));
    this.formElement = select;

    if (this.getAttribute('mode') === 'chip') {
      const hostContainer = document.createElement('div');
      hostContainer.classList.add('row');

      const container = document.createElement('div');
      container.classList.add('chip-container');
      container.id = 'chipContainer';
      hostContainer.appendChild(container);

      const dropdown = document.createElement('div');
      dropdown.classList.add('dropdown');
      const ipt = document.createElement('input');
      ipt.classList.add('dropdown-input');
      ipt.id = 'dropdownInput';
      ipt.setAttribute('placeholder', 'Add or select...');
      if (this.hasAttribute('disabled')) {
        ipt.setAttribute('disabled', '');
      }
      if (this.hasAttribute('required')) {
        ipt.setAttribute('required', '');
      }
      dropdown.appendChild(ipt);

      const optionsContainer = document.createElement('div');
      optionsContainer.classList.add('options-container');
      optionsContainer.id = 'optionsContainer';
      optionsContainer.innerHTML = Array.from(options)
        .map(option => `<div class="option" data-value="${option.value}">${option.textContent}</div>`)
        .join('');
      dropdown.appendChild(optionsContainer);
      dropdown.appendChild(select);
      hostContainer.appendChild(dropdown);
      this.componentElement.appendChild(hostContainer);
    } else {
      this.componentElement.appendChild(select);
    }

    this.attachEventListeners();
  }

  _generateOptionsFromItems() {
    const displayMember = this.getAttribute('display-member') || 'key';
    const valueMember = this.getAttribute('value-member') || 'value';
    const value = this.getAttribute('value') || null;
    // Clear existing options
    this.formElement.innerHTML = '';
    this._items.forEach((item) => {
      const opt = document.createElement('option');
      if (typeof item === 'object') {
        opt.value = item[valueMember];
        opt.textContent = item[displayMember];
      } else {
        opt.value = item;
        opt.textContent = item;
      }
      if (opt.value == value) {
        opt.selected = true;
      }
      this.formElement.appendChild(opt);
    });
  }

  _applyStyle() {
    const style = `
      wc-select-box .chip-container { 
        display: none;
        flex-wrap: wrap; 
        gap: 5px; 
        margin-bottom: 5px; 
      }
      wc-select-box[mode="chip"] .chip-container { 
        display: flex; 
      }

      wc-select-box .chip { 
        display: flex; 
        align-items: center; 
        padding: 5px; 
        background-color: var(--primary-bg-color); 
        border-radius: 15px; 
        font-size: 0.75rem; /* 12px */
        line-height: 1rem; /* 16px */
      }
      wc-select-box .chip-close { 
        margin-left: 5px; 
        cursor: pointer; 
        font-weight: bold; 
      }
      wc-select-box .dropdown { 
        display: flex; 
        flex-direction: row;
        flex: 1 1 0%;
        position: relative; 
      }
      wc-select-box .dropdown-input { 
        display: none;
        width: 100%;
        min-width: 85px;
        height: 15.5px;
        padding: 0.375rem;
      }
      wc-select-box .chip-container:has(.chip) + .dropdown .dropdown-input {
        margin-left: 0.5rem;
      }
      wc-select-box[mode="chip"] .dropdown-input { 
        display: block; 
      }
      wc-select-box .options-container { 
        display: none;
        position: absolute; 
        top: 29.5px; 
        left: 0; 
        right: 0; 
        background: var(--secondary-bg-color); 
        color: var(--secondary-color);
        border: 1px solid var(--accent-bg-color); 
        max-height: 150px;
        margin-left 0.5rem;
        overflow-y: auto; 
        z-index: 10; 
      }

      wc-select-box[mode="chip"] .options-container { 
        display: block;
      }
      wc-select-box .chip-container:has(.chip) + .dropdown .options-container {
        margin-left: 0.5rem;
      }
      wc-select-box .option { 
        padding: 5px; 
        cursor: pointer; 
      }
      wc-select-box .option.highlighted { 
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-select-box .option:hover { 
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-select-box select { 
        display: block; 
        width: 100%; 
        padding: 5px; 
      }
      wc-select-box[mode="multiple"] select { 
        display: block;
      }
      wc-select-box[mode="chip"] select { 
        display: none;
      }
      wc-select-box select:disabled { 
        cursor: not-allowed;
        opacity: 0.7;
        font-style: italic;
      }
      wc-select-box select:disabled option {
        color: var(--component-color);
      }
      wc-select-box .dropdown-input:disabled {
        cursor: not-allowed;
        opacity: 0.7;
        font-style: italic;
      }
    `.trim();
    this.loadStyle('wc-select-box-style', style);
  }

  attachEventListeners() {
    const dropdownInput = this.querySelector('#dropdownInput');
    const optionsContainer = this.querySelector('#optionsContainer');
    const chipContainer = this.querySelector('#chipContainer');

    if (this.mode === 'chip') {
      if (dropdownInput) {
        dropdownInput?.addEventListener('focus', () => optionsContainer.style.display = 'block');
        dropdownInput?.addEventListener('input', () => this.filterOptions(dropdownInput.value));

        optionsContainer?.addEventListener('click', (e) => {
          if (e.target.classList.contains('option')) {
            this.addChip(e.target.getAttribute('data-value'), e.target.textContent);
            optionsContainer.style.display = 'none';
            dropdownInput.value = '';
          }
        });

        dropdownInput?.addEventListener('keydown', (e) => this.handleKeyboardNavigation(e));

        document.addEventListener('click', (e) => {
          if (!this.contains(e.target)) {
            optionsContainer.style.display = 'none';
          }
        });

        chipContainer?.addEventListener('click', (e) => {
          if (e.target.classList.contains('chip-close')) {
            const chip = e.target.closest('.chip');
            const value = chip.getAttribute('data-value');
            this.removeChip(value);
          }
        });
      }
    }
  }

  handleKeyboardNavigation(e) {
    const optionsContainer = this.querySelector('#optionsContainer');
    const options = Array.from(optionsContainer.querySelectorAll('.option')).filter(option => option.style.display !== 'none');

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex + 1) % options.length;
      this.updateHighlight(options);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.highlightedIndex = (this.highlightedIndex - 1 + options.length) % options.length;
      this.updateHighlight(options);
    } else if (e.key === 'Enter' && this.highlightedIndex >= 0) {
      e.preventDefault();
      const highlightedOption = options[this.highlightedIndex];
      this.addChip(highlightedOption.getAttribute('data-value'), highlightedOption.textContent);
      this.resetDropdown();
    } else if (e.key === 'Escape') {
      this.resetDropdown();
    }
  }

  updateHighlight(options) {
    options.forEach(option => option.classList.remove('highlighted'));
    if (this.highlightedIndex >= 0 && this.highlightedIndex < options.length) {
      options[this.highlightedIndex].classList.add('highlighted');
    }
  }

  resetDropdown() {
    const dropdownInput = this.querySelector('#dropdownInput');
    const optionsContainer = this.querySelector('#optionsContainer');
    this.highlightedIndex = -1;
    dropdownInput.value = '';
    optionsContainer.style.display = 'none';
    this.updateHighlight([]);
  }

  filterOptions(query) {
    const optionsContainer = this.querySelector('#optionsContainer');
    const options = optionsContainer.querySelectorAll('.option');
    options.forEach(option => {
      if (option.textContent.toLowerCase().includes(query.toLowerCase()) && !this.selectedOptions.includes(option.getAttribute('data-value'))) {
        option.style.display = 'block';
      } else {
        option.style.display = 'none';
      }
    });
    this.highlightedIndex = -1;
    this.updateHighlight([]);
  }

  addChip(value, label) {
    if (this.selectedOptions.includes(value)) return;

    this.selectedOptions.push(value);
    this.updateSelect();
    this.updateChips();
    this.updateDropdownOptions();

    const event = new Event('change');
    this.dispatchEvent(event);
  }

  removeChip(value) {
    this.selectedOptions = this.selectedOptions.filter(v => v !== value);
    this.updateSelect();
    this.updateChips();
    this.updateDropdownOptions();

    const event = new Event('change');
    this.dispatchEvent(event);
  }

  updateChips() {
    const chipContainer = this.querySelector('#chipContainer');
    if (this.mode === 'chip') {
      chipContainer.innerHTML = this.selectedOptions.map(value => {
        const option = Array.from(this.querySelectorAll('option')).find(opt => opt.value === value);
        const label = option ? option.textContent : value;
        return `<div class="chip" data-value="${value}">${label}<span class="chip-close">&times;</span></div>`;
      }).join('');
    }
  }

  updateSelect() {
    const selectElement = this.querySelector('select');
    selectElement.innerHTML = Array.from(this.querySelectorAll('option'))
      .map(option => `<option value="${option.value}" ${this.selectedOptions.includes(option.value) ? 'selected' : ''}>${option.textContent}</option>`)
      .join('');
  }

  updateDropdownOptions() {
    const optionsContainer = this.querySelector('#optionsContainer');
    Array.from(optionsContainer.querySelectorAll('.option')).forEach(option => {
      option.style.display = this.selectedOptions.includes(option.getAttribute('data-value')) ? 'none' : 'block';
    });
  }
}

customElements.define('wc-select-box', WcSelectBox);
