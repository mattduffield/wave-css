/**
 *
 *  Name: wc-save-button
 *  Usage:
 *    <wc-save-button
 *      form="form#myForm"
 *      hx-include="form#myForm"
 *      save-url="/screen/contact/123">
 *    </wc-save-button>
 *
 *  Attributes:
 *    - form: CSS selector for the form to validate (e.g., "form#myForm")
 *            If not provided, falls back to hx-include for backwards compatibility
 *    - hx-include: Form elements to include in HTMX request
 *    - save-url: URL for the save action
 *    - label: Button label (default: "Save")
 *
 *  API:
 *    wc.EventHub.broadcast('wc-accordion:open', ['[data-wc-id="0982-a544-98da-b3da"]'], '.accordion-header:nth-of-type(1)')
 *    wc.EventHub.broadcast('wc-accordion:close', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(1)'])
 *    wc.EventHub.broadcast('wc-accordion:toggle', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(2)'])
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-save-button')) {
  class WcSaveButton extends WcBaseComponent {
    static get observedAttributes() {
      return ['form', 'hx-include'];
    }

    constructor() {
      super();
      this._items = [];
      const compEl = this.querySelector('.wc-save-button');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        const id = this.getAttribute('id') || '';
        const saveUrl = this.getAttribute('save-url') || '';
        const label = this.getAttribute('label') || 'Save';
        const hxInclude = this.getAttribute('hx-include') || '';

        this.componentElement = document.createElement('button');
        this.componentElement.type = 'button';
        this.componentElement.id = id;
        this.removeAttribute('id');
        this.componentElement.textContent = label;
        this.componentElement.classList.add('wc-save-button', 'btn');
        this.componentElement.setAttribute('hx-target', '#viewport');
        this.componentElement.setAttribute('hx-swap', 'innerHTML transition:true');
        this.componentElement.setAttribute('hx-indicator', '#content-loader');
        this.componentElement.setAttribute('hx-post', saveUrl);
        this.componentElement.setAttribute('hx-trigger', 'validated');
        this.removeAttribute('save-url');
        this.componentElement.setAttribute('hx-push-url', 'true');
        if (hxInclude) {
          this.componentElement.setAttribute('hx-include', hxInclude);
        }
        this.appendChild(this.componentElement);
      }
      // console.log('ctor:wc-save-button');
    }

    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
      // console.log('connectedCallback:wc-save-button');
    }

    disconnectedCallback() {
      this._unWireEvents();
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === 'hx-include') {
        // Update button with the new hx-include value
        if (newValue) {
          this.componentElement.setAttribute('hx-include', newValue);
        } else {
          this.componentElement.removeAttribute('hx-include');
        }
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _validateForm() {
      // Get the form to validate - prefer dedicated 'form' attribute, fall back to 'hx-include'
      const formSelector = this.getAttribute('form') || this.getAttribute('hx-include');
      if (!formSelector) {
        return true; // No form to validate
      }

      const form = document.querySelector(formSelector);
      if (!form || form.tagName !== 'FORM') {
        return true; // Form not found or not a form element
      }

      // Check if form is valid using browser's built-in validation
      const isValid = form.checkValidity();

      if (!isValid) {
        // Find the first invalid field
        const firstInvalidField = form.querySelector(':invalid');

        if (firstInvalidField) {
          // Check if field is hidden (in a collapsed accordion, hidden tab, etc.)
          const isHidden = firstInvalidField.offsetParent === null;

          if (isHidden) {
            // Field is hidden - try to make it visible
            // Look for parent accordion or tab and open it
            const accordion = firstInvalidField.closest('wc-accordion');
            if (accordion) {
              // Find the accordion item containing this field
              const accordionItem = firstInvalidField.closest('.accordion-item');
              if (accordionItem) {
                const header = accordionItem.querySelector('.accordion-header');
                if (header && !header.classList.contains('selected')) {
                  header.click();
                  // Wait a bit for animation
                  setTimeout(() => {
                    firstInvalidField.focus();
                    form.reportValidity();
                  }, 100);
                  return false;
                }
              }
            }

            // Look for parent tab
            const tab = firstInvalidField.closest('wc-tab-item');
            if (tab) {
              const tabId = tab.getAttribute('tab-id');
              const tabHeader = document.querySelector(`[tab-id="${tabId}"]`);
              if (tabHeader && !tabHeader.classList.contains('active')) {
                tabHeader.click();
                setTimeout(() => {
                  firstInvalidField.focus();
                  form.reportValidity();
                }, 100);
                return false;
              }
            }
          }

          // Try to focus and show validation message
          try {
            firstInvalidField.focus();
            form.reportValidity();
          } catch (e) {
            // If focus fails, just show alert
            alert('Please fill out all required fields before saving.');
          }
        } else {
          // No specific invalid field found, just report
          form.reportValidity();
        }

        return false;
      }

      return true;
    }

    _handleClick(event) {
      // Validate form first
      if (!this._validateForm()) {
        // Form is invalid - don't trigger the validated event
        event.preventDefault();
        event.stopPropagation();
        return false;
      }

      // Form is valid - trigger the custom 'validated' event for HTMX to process
      htmx.trigger(this.componentElement, 'validated');
    }

    _applyStyle() {
      const style = `
        wc-save-button {
          display: contents;
        }
        .wc-save-button {
        }
        .wc-save-button:hover  {
        }
      `.trim();
      this.loadStyle('wc-save-button-style', style);
    }

    _wireEvents() {
      super._wireEvents();
      this.componentElement.addEventListener('click', this._handleClick.bind(this));
    }

    _unWireEvents() {
      super._unWireEvents();
      this.componentElement.removeEventListener('click', this._handleClick.bind(this));
    }

  }

  customElements.define('wc-save-button', WcSaveButton);
}