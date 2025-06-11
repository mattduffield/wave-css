/**
 * 
 *  Name: wc-select
 *  Usage:
 *    <wc-select name="gender" lbl-label="Gender" value="male"
 *      items='[{"key": "Female", "value": "female"}, {"key": "Male", "value": "male"}]'>
 *    </wc-select>
 *    <wc-select name="marital_status" lbl-label="Marital Status" value="married">
 *      <option value="single">Single</option>
 *      <option value="married" selected>Married</option>
 *      <option value="divorced">Divorced</option>
 *      <option value="widowed">Widowed</option>
 *    </wc-select>
 *    <wc-select name="gender"
 *      class="col-1"
 *      lbl-label="Gender"
 *      value="male"
 *      display-member="label"
 *      value-member="value"
 *      items='[{"label": "Female", "value": "female"}, {"label": "Male", "value": "male"}]'>
 *    </wc-select>
 * 
 *  Note: A SELECT with the multiple attribute will always send the first 
 *        option in a Form post regardless if it is selected or not.
 */


import { WcBaseFormComponent } from './wc-base-form-component.js';

class WcSelect extends WcBaseFormComponent {
  static get observedAttributes() {
    return ['name', 'id', 'class', 'multiple', 'value', 'items', 'url', 'display-member', 'value-member',
      'lbl-label', 'disabled', 'required', 'autofocus', 'elt-class',
      'onchange', 'oninput', 'onblur', 'onfocus', 'onkeydown', 'onkeyup',
      'onkeypress', 'onclick',
      'tooltip', 'tooltip-position'];
    // return ['mode']; // Allows switching between "multiple" and "chip" modes
  }

  constructor() {
    super();
    this.selectedOptions = [];
    this.mode = this.getAttribute('mode') || 'chip'; // Default to 'chip' mode if not specified
     // Add this line to fix the mode when not specified
    if (!this.hasAttribute('mode')) {
      this.mode = 'standard'; // Use 'standard' for regular select behavior
    }
    this.highlightedIndex = -1;
    this.eventAttributes = [
      'onchange', 'oninput', 'onblur', 'onfocus', 'onkeydown', 'onkeyup',
      'onkeypress', 'onclick'
    ];
    const compEl = this.querySelector('.wc-select');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-select', 'relative');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-select');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    console.log('connectedCallback:wc-select');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }


  _handleAttributeChange(attrName, newValue) {
    // Add this block before the existing event handling
    if (attrName === 'tooltip' || attrName === 'tooltip-position') {
      this._createTooltipElement();
      return;
    }
    if (this.eventAttributes.includes(attrName)) {
      if (this.formElement && newValue) {
        // Remove any existing event listener first
        const eventName = attrName.substring(2);

        // Store the handler so we can remove it later
        if (!this._eventHandlers) {
          this._eventHandlers = {};
        }

        // Remove previous handler if it exists
        if (this._eventHandlers[eventName]) {
          this.formElement.removeEventListener(eventName, this._eventHandlers[eventName]);
        }

        // Create new handler
        const eventHandler = new Function('event', `
          const element = event.target;
          const value = element.value;
          with (element) {
            ${newValue}
          }
        `);

        // Store and add the new handler
        this._eventHandlers[eventName] = eventHandler;
        this.formElement.addEventListener(eventName, eventHandler);
      }
      return;
    }    
    if (this.eventAttributes.includes(attrName)) {
      if (this.formElement && newValue) {
        // Create a function that properly binds 'this' to the form element
        const eventHandler = new Function('event', `
          const element = event.target;
          const value = element.value;
          with (element) {
            ${newValue}
          }
        `);
        // Remove 'on' prefix to get event name
        const eventName = attrName.substring(2);
        this.formElement.addEventListener(eventName, eventHandler);
      }
      return;
    }    
    if (attrName === 'autofocus') {
      this.formElement?.setAttribute('autofocus', '');
    } else if (attrName === 'url') {
      if (newValue) {
        fetch(newValue).then(response => response.json())
          .then(data => {
            this._items = data;  
            this._generateOptionsFromItems();
            this._items.forEach(item => {
              if (item.selected) {
                const displayMember = this.getAttribute('display-member') || 'key';
                const valueMember = this.getAttribute('value-member') || 'value';
                this.addChip(item[valueMember], item[displayMember]);
              }
            });
          });
      }           
    } else if (attrName === 'items') {
      if (typeof newValue === 'string') {
        this._items = JSON.parse(newValue);
        this._generateOptionsFromItems();
        this._items.forEach(item => {
          if (item.selected) {
            const displayMember = this.getAttribute('display-member') || 'key';
            const valueMember = this.getAttribute('value-member') || 'value';
            this.addChip(item[valueMember], item[displayMember]);
          }
        });
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
    const innerEl = this.querySelector('.wc-select > *');
    if (innerEl) {
      // Do nothing...
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();

      // Only process selected options for chip mode
      if (this.mode === 'chip') {
        const options = this.querySelectorAll('option[selected]');
        options.forEach(opt => {
          this.addChip(opt.value, opt.textContent);
        });
      }
    }

    this.eventAttributes.forEach(attr => {
      const value = this.getAttribute(attr);
      if (value) {
        this._handleAttributeChange(attr, value);
      }
    });

    // Create tooltip after element creation
    this._createTooltipElement();

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    console.log('_render:wc-select');
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
    if (this.getAttribute('multiple')) {
      select.multiple = true;
      select.setAttribute('multiple', '');
    }
    const size = this.getAttribute('size');
    if (size) {
      select.setAttribute('size', size);
    }
    options.forEach(opt => {
      select.appendChild(opt)
    });
    this.formElement = select;

    if (this.getAttribute('mode') === 'chip') {
      select.name = name;
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

      // Add event wiring for the dropdown input
      this.eventAttributes.forEach(attr => {
        const value = this.getAttribute(attr);
        if (value && attr !== 'onchange') { // onchange is handled by select element
          const eventName = attr.substring(2);
          const eventHandler = new Function('event', `
            const element = event.target;
            const value = element.value;
            with (element) {
              ${value}
            }
          `);
          ipt.addEventListener(eventName, eventHandler);
        }
      });

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

    this.removeAttribute('name');

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
    const optionsContainer = this.querySelector('.options-container');
    if (optionsContainer) {
      const options = this.formElement.querySelectorAll('option');
      optionsContainer.innerHTML = Array.from(options)
        .map(option => `<div class="option" data-value="${option.value}">${option.textContent}</div>`)
        .join('');      
    }
  }

  _createTooltipElement() {
    // Remove any existing tooltip
    const existingTooltip = this.querySelector('.wc-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }

    const tooltipText = this.getAttribute('tooltip');
    if (!tooltipText) return;

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'wc-tooltip';
    tooltip.textContent = tooltipText;

    const position = this.getAttribute('tooltip-position') || 'top';
    tooltip.setAttribute('data-position', position);

    // Add anchor name to the form element
    const anchorName = `--anchor-${this.getAttribute('name') || Date.now()}`;
    if (this.formElement) {
      this.formElement.style.anchorName = anchorName;
      tooltip.style.positionAnchor = anchorName;
    }

    this.componentElement.appendChild(tooltip);

    // Wire up tooltip events
    this._wireTooltipEvents();
  }

  _wireTooltipEvents() {
    const tooltip = this.querySelector('.wc-tooltip');
    if (!tooltip) return;

    const showTooltip = () => {
      // Check if popover API is supported
      if ('showPopover' in HTMLElement.prototype) {
        // Set popover attribute only when showing
        if (!tooltip.hasAttribute('popover')) {
          tooltip.setAttribute('popover', 'manual');
        }

        try {
          // Check if element is connected and not already showing
          if (tooltip.isConnected && !tooltip.matches(':popover-open')) {
            tooltip.showPopover();
          }
        } catch (e) {
          // Fallback to class-based approach
          tooltip.classList.add('show');
        }
      } else {
        // Fallback for browsers without popover support
        tooltip.classList.add('show');
      }
    };

    const hideTooltip = () => {
      if ('hidePopover' in HTMLElement.prototype && tooltip.hasAttribute('popover')) {
        try {
          if (tooltip.matches(':popover-open')) {
            tooltip.hidePopover();
          }
        } catch (e) {
          tooltip.classList.remove('show');
        }
      } else {
        tooltip.classList.remove('show');
      }
    };

    // Add events to form element
    if (this.formElement) {
      this.formElement.addEventListener('mouseenter', showTooltip);
      this.formElement.addEventListener('mouseleave', hideTooltip);
      this.formElement.addEventListener('focus', showTooltip);
      this.formElement.addEventListener('blur', hideTooltip);
    }

    // For chip mode, also add to dropdown input
    if (this.mode === 'chip') {
      const dropdownInput = this.querySelector('#dropdownInput');
      if (dropdownInput) {
        dropdownInput.addEventListener('mouseenter', showTooltip);
        dropdownInput.addEventListener('mouseleave', hideTooltip);
        dropdownInput.addEventListener('focus', showTooltip);
        dropdownInput.addEventListener('blur', hideTooltip);
      }
    }
  }

  _applyStyle() {
    const style = `
      wc-select {
        display: contents;
      }
      wc-select .chip-container { 
        display: none;
        flex-wrap: wrap; 
        gap: 5px; 
        margin-bottom: 5px; 
      }
      wc-select[mode="chip"] .chip-container { 
        display: flex; 
      }

      wc-select .chip { 
        display: flex; 
        align-items: center; 
        padding: 5px; 
        background-color: var(--primary-bg-color); 
        color: var(--primary-color);
        border-radius: 15px; 
        font-size: 0.75rem; /* 12px */
        line-height: 1rem; /* 16px */
      }
      wc-select .chip-close { 
        margin-left: 5px; 
        cursor: pointer; 
        font-weight: bold; 
      }
      wc-select:has(:disabled) .chip {
        opacity: 0.7;
        font-style: italic;
      }
      wc-select:has(:disabled) .chip .chip-close {
        display: none;
      }
      wc-select .dropdown { 
        display: flex; 
        flex-direction: row;
        flex: 1 1 0%;
        position: relative; 
      }
      wc-select .dropdown-input { 
        display: none;
        width: 100%;
        min-width: 85px;
        padding: 0.375rem;
      }
      wc-select .chip-container:has(.chip) + .dropdown .dropdown-input {
        margin-left: 0.5rem;
      }
      wc-select[mode="chip"] .dropdown-input { 
        display: block; 
      }
      wc-select .options-container { 
        display: none;
        position: absolute; 
        top: 29.5px; 
        left: 0; 
        right: 0; 
        background: var(--secondary-bg-color); 
        color: var(--primary-color);
        border: 1px solid var(--accent-bg-color); 
        max-height: 150px;
        margin-left 0.5rem;
        overflow-y: auto; 
        z-index: 10; 
      }

      wc-select[mode="chip"] .options-container { 
        display: none;
      }
      wc-select .chip-container:has(.chip) + .dropdown .options-container {
        margin-left: 0.5rem;
      }
      wc-select .option { 
        padding: 5px; 
        cursor: pointer; 
      }
      wc-select .option.highlighted { 
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-select .option:hover { 
        background-color: var(--primary-bg-color);
        color: var(--primary-color);
      }
      wc-select select { 
        display: block; 
        width: 100%; 
        padding: 5px; 
      }
      wc-select[mode="multiple"] select { 
        display: block;
      }
      wc-select[mode="chip"] select { 
        display: none;
      }
      wc-select select:disabled { 
        cursor: not-allowed;
        opacity: 0.7;
        font-style: italic;
      }
      wc-select select:disabled option {
        color: var(--component-alt-color);
      }
      wc-select .dropdown-input:disabled {
        cursor: not-allowed;
        opacity: 0.7;
        font-style: italic;
      }



      

      /* Tooltip styles with Anchor Positioning API */
        wc-select .wc-tooltip {
          position: absolute;
          background-color: rgba(0, 0, 0, 0.9);
          color: white;
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 0.75rem;
          white-space: normal;
          word-wrap: break-word;
          pointer-events: none;
          z-index: 10000;
          max-width: 250px;
          margin: 0;
          border: 0;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.2s, visibility 0.2s;
        }

        /* Show states */
        wc-select .wc-tooltip.show,
        wc-select .wc-tooltip:popover-open {
          opacity: 1;
          visibility: visible;
        }

        /* Popover specific resets */
        wc-select .wc-tooltip[popover] {
          inset: unset;
        }

        /* Anchor positioning when supported */
        @supports (anchor-name: --test) {
          wc-select .wc-tooltip {
            position-try-options: flip-block, flip-inline, flip-block flip-inline;
          }

          wc-select .wc-tooltip.show {
            opacity: 1;
            visibility: visible;
          }
        }

        /* Popover API styles */
        wc-select .wc-tooltip[popover] {
          margin: 0;
          border: 0;
          padding: 6px 12px;
          overflow: visible;
        }

        wc-select .wc-tooltip:popover-open {
          opacity: 1;
          visibility: visible;
        }

        /* Position variations using anchor positioning */
        wc-select .wc-tooltip[data-position="top"] {
          bottom: anchor(top);
          left: anchor(center);
          translate: -50% -8px;

          /* Fallback for position-try */
          position-try-fallbacks:
            bottom-then-top,
            snap-to-edge;
        }

        wc-select .wc-tooltip[data-position="bottom"] {
          top: anchor(bottom);
          left: anchor(center);
          translate: -50% 8px;

          position-try-fallbacks:
            top-then-bottom,
            snap-to-edge;
        }

        wc-select .wc-tooltip[data-position="left"] {
          right: anchor(left);
          top: anchor(center);
          translate: -8px -50%;

          position-try-fallbacks:
            right-then-left,
            snap-to-edge;
        }

        wc-select .wc-tooltip[data-position="right"] {
          left: anchor(right);
          top: anchor(center);
          translate: 8px -50%;

          position-try-fallbacks:
            left-then-right,
            snap-to-edge;
        }

        /* Try to keep tooltip in viewport */
        @position-try bottom-then-top {
          bottom: auto;
          top: anchor(bottom);
          translate: -50% 8px;
        }

        @position-try top-then-bottom {
          top: auto;
          bottom: anchor(top);
          translate: -50% -8px;
        }

        @position-try right-then-left {
          right: auto;
          left: anchor(right);
          translate: 8px -50%;
        }

        @position-try left-then-right {
          left: auto;
          right: anchor(left);
          translate: -8px -50%;
        }

        @position-try snap-to-edge {
          position: absolute;
          inset: auto;
          top: 0;
          left: 0;
        }

        /* Arrow styles - hidden when position changes */
        wc-select .wc-tooltip::before {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border: 6px solid transparent;
        }

        wc-select .wc-tooltip[data-position="top"]::before {
          border-top-color: rgba(0, 0, 0, 0.9);
          bottom: -12px;
          left: 50%;
          transform: translateX(-50%);
        }

        wc-select .wc-tooltip[data-position="bottom"]::before {
          border-bottom-color: rgba(0, 0, 0, 0.9);
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
        }

        wc-select .wc-tooltip[data-position="left"]::before {
          border-left-color: rgba(0, 0, 0, 0.9);
          right: -12px;
          top: 50%;
          transform: translateY(-50%);
        }

        wc-select .wc-tooltip[data-position="right"]::before {
          border-right-color: rgba(0, 0, 0, 0.9);
          left: -12px;
          top: 50%;
          transform: translateY(-50%);
        }

        /* Fallback positioning for older browsers */
        @supports not (anchor-name: --test) {
          wc-select .wc-tooltip[data-position="top"] {
            position: absolute;
            bottom: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-bottom: 8px;
          }

          wc-select .wc-tooltip[data-position="bottom"] {
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            margin-top: 8px;
          }

          wc-select .wc-tooltip[data-position="left"] {
            position: absolute;
            right: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-right: 8px;
          }

          wc-select .wc-tooltip[data-position="right"] {
            position: absolute;
            left: 100%;
            top: 50%;
            transform: translateY(-50%);
            margin-left: 8px;
          }
        }
    `.trim();
    this.loadStyle('wc-select-style', style);
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
    const allowDynamic = this.hasAttribute('allow-dynamic');

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
    } else if (e.key === 'Enter' && allowDynamic) {
      e.preventDefault();
      const value = e.target.value;
      this.addChip(value, value);
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
    const allowDynamic = this.hasAttribute('allow-dynamic');
    if (this.selectedOptions.includes(value)) return;

    setTimeout(() => {
      if (allowDynamic) {
        const selectElement = this.querySelector('select');
        let exists = Array.from(selectElement.options).some(option => option.value === value);
        if (!exists) {
          const newOption = new Option(label, value);
          selectElement.add(newOption);
        }
      }
      this.selectedOptions.push(value);
      this.updateSelect();
      this.updateChips();
      this.updateDropdownOptions();

      const event = new Event('change');
      this.dispatchEvent(event);
    }, 10);
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
    if (chipContainer) {
      if (this.mode === 'chip') {
        chipContainer.innerHTML = this.selectedOptions.map(value => {
          const option = Array.from(this.querySelectorAll('option')).find(opt => opt.value === value);
          const label = option ? option.textContent : value;
          return `<div class="chip" data-value="${value}">${label}<span class="chip-close">&times;</span></div>`;
        }).join('');
      }      
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
    if (optionsContainer) {
      Array.from(optionsContainer.querySelectorAll('.option')).forEach(option => {
        option.style.display = this.selectedOptions.includes(option.getAttribute('data-value')) ? 'none' : 'block';
      });      
    }
  }

  _unWireEvents() {
    super._unWireEvents();

    // Remove tooltip element
    const tooltip = this.querySelector('.wc-tooltip');
    if (tooltip) {
      if (tooltip.popover && tooltip.matches(':popover-open')) {
        tooltip.hidePopover();
      }
      tooltip.remove();
    }

    // Clean up anchor names
    if (this.formElement) {
      this.formElement.style.anchorName = '';
    }
  }
}

customElements.define('wc-select', WcSelect);
