/**
 *
 *  Name: wc-field
 *  Usage:
 *    <!-- Simple usage with value attribute -->
 *    <wc-field label="Status" value="Active"></wc-field>
 *
 *    <!-- With link -->
 *    <wc-field
 *      label="Bill Plans"
 *      link="/v/bill_plans/create"
 *      value="3 plans available">
 *    </wc-field>
 *
 *    <!-- With HTMX attributes -->
 *    <wc-field
 *      label="Bill Plans"
 *      link="/v/bill_plans/create"
 *      hx-get="/v/bill_plans/create?script_id=123"
 *      hx-target="#modal-container"
 *      hx-swap="innerHTML"
 *      hx-push-url="false"
 *      value="Manage plans">
 *    </wc-field>
 *
 *    <!-- Complex content using child elements -->
 *    <wc-field label="Bill Plans">
 *      <div class="text-center text-xs text-4">
 *        {{Record.data.bill_plan}}
 *      </div>
 *    </wc-field>
 *
 *    <!-- Without label (just display content) -->
 *    <wc-field value="Information without label"></wc-field>
 *
 *    <!-- Custom styling -->
 *    <wc-field
 *      label="Total Amount"
 *      label-class="font-bold text-primary"
 *      value="$1,234.56"
 *      value-class="text-2xl text-center text-success">
 *    </wc-field>
 *
 *    <!-- Complex nested content -->
 *    <wc-field label="Payment History">
 *      <table class="w-full text-xs">
 *        <tr><td>Jan 2025</td><td>$99.99</td></tr>
 *        <tr><td>Feb 2025</td><td>$99.99</td></tr>
 *      </table>
 *    </wc-field>
 *
 *  Attributes:
 *    - label: Label text (optional - only renders if present)
 *    - label-class: Custom CSS classes for label
 *    - value: Display value (if not using child content)
 *    - value-class: Custom CSS classes for value area
 *    - link: URL for clickable label (makes label an anchor)
 *    - text-align: Text alignment (left, center, right)
 *    - hx-*: Any HTMX attributes for dynamic behavior
 *
 *  Notes:
 *    - This is a read-only informational component
 *    - Does NOT participate in form submission
 *    - Extends WcBaseComponent (not WcBaseFormComponent)
 *    - Child content takes precedence over value attribute
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcField extends WcBaseComponent {
  static get observedAttributes() {
    return [
      'id', 'class', 'label', 'label-class', 'value', 'value-class',
      'link', 'text-align',
      'hx-get', 'hx-post', 'hx-put', 'hx-delete', 'hx-patch',
      'hx-target', 'hx-swap', 'hx-trigger', 'hx-indicator',
      'hx-push-url', 'hx-vals', 'hx-include', 'hx-confirm'
    ];
  }

  constructor() {
    super();

    const compEl = this.querySelector('.wc-field');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-field', 'col');
      this.appendChild(this.componentElement);
    }
    // console.log('ctor:wc-field');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    // console.log('connectedCallback:wc-field');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'label') {
      // Re-render when label changes
      this._render();
    } else if (attrName === 'label-class') {
      // Do nothing - handled in render
    } else if (attrName === 'value') {
      // Re-render when value changes
      this._render();
    } else if (attrName === 'value-class') {
      // Do nothing - handled in render
    } else if (attrName === 'link') {
      // Re-render when link changes
      this._render();
    } else if (attrName === 'text-align') {
      // Do nothing - handled in CSS
    } else if (attrName.startsWith('hx-')) {
      // HTMX attributes - will be processed by htmx.process()
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _render() {
    super._render();

    // Check if there's existing inner content (non wc-field elements)
    const innerEl = this.querySelector('.wc-field > *');
    if (innerEl) {
      // Already rendered, don't re-render
      return;
    }

    // Check for user-provided content
    const userContent = Array.from(this.children).filter(
      child => !child.classList.contains('wc-field')
    );

    this.componentElement.innerHTML = '';

    if (userContent.length > 0) {
      // User provided content - use it
      this._renderWithContent(userContent);
    } else {
      // No content - use value attribute
      this._renderWithValue();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }

    // console.log('_render:wc-field');
  }

  _renderWithContent(userContent) {
    // Render label if present
    this._renderLabel();

    // Create value container and append user content
    const valueContainer = document.createElement('div');
    valueContainer.classList.add('wc-field-value');

    // Add custom value classes if provided
    const valueClass = this.getAttribute('value-class');
    if (valueClass) {
      valueClass.split(' ').forEach(cls => {
        if (cls.trim()) valueContainer.classList.add(cls.trim());
      });
    } else {
      // Default classes
      valueContainer.classList.add('text-xs', 'text-4');
    }

    // Add text alignment if specified
    const textAlign = this.getAttribute('text-align');
    if (textAlign) {
      valueContainer.classList.add(`text-${textAlign}`);
    } else {
      valueContainer.classList.add('text-center');
    }

    // Move user content into value container
    userContent.forEach(child => {
      valueContainer.appendChild(child);
    });

    this.componentElement.appendChild(valueContainer);

    // Remove value-class attribute from wc-field after using it
    if (valueClass) {
      this.removeAttribute('value-class');
    }
  }

  _renderWithValue() {
    // Render label if present
    this._renderLabel();

    // Always render value container (even if no value attribute exists)
    const value = this.getAttribute('value') || '';
    const valueContainer = document.createElement('div');
    valueContainer.classList.add('wc-field-value');

    // Add custom value classes if provided
    const valueClass = this.getAttribute('value-class');
    if (valueClass) {
      valueClass.split(' ').forEach(cls => {
        if (cls.trim()) valueContainer.classList.add(cls.trim());
      });
    } else {
      // Default classes
      valueContainer.classList.add('text-xs', 'text-4');
    }

    // Add text alignment if specified
    const textAlign = this.getAttribute('text-align');
    if (textAlign) {
      valueContainer.classList.add(`text-${textAlign}`);
    } else {
      valueContainer.classList.add('text-center');
    }

    valueContainer.textContent = value;
    this.componentElement.appendChild(valueContainer);

    // Remove value and value-class attributes from wc-field after using them
    if (this.hasAttribute('value')) {
      this.removeAttribute('value');
    }
    if (valueClass) {
      this.removeAttribute('value-class');
    }
  }

  _renderLabel() {
    const label = this.getAttribute('label');
    if (!label) return; // Don't render label if not provided

    const link = this.getAttribute('link');
    const hxGet = this.getAttribute('hx-get');
    const labelClass = this.getAttribute('label-class');

    // Create anchor if link is provided OR if hx-get is present
    if (link || hxGet) {
      // Create clickable anchor with label
      const anchor = document.createElement('a');
      anchor.classList.add('wc-field-label', 'cursor-pointer', 'underline');

      // Use link if provided, otherwise fall back to hx-get
      anchor.href = link || hxGet;

      // Add HTMX attributes if present (this will remove them from wc-field)
      this._addHtmxAttributes(anchor);

      // Add custom label classes if provided
      if (labelClass) {
        labelClass.split(' ').forEach(cls => {
          if (cls.trim()) anchor.classList.add(cls.trim());
        });
      }

      // Set text directly on anchor (no need for nested label element)
      anchor.textContent = label;

      this.componentElement.appendChild(anchor);

      // Remove link attribute from wc-field after applying to anchor
      if (link) {
        this.removeAttribute('link');
      }
    } else {
      // Create plain label
      const labelElement = document.createElement('label');
      labelElement.classList.add('wc-field-label');

      // Add custom label classes if provided
      if (labelClass) {
        labelClass.split(' ').forEach(cls => {
          if (cls.trim()) labelElement.classList.add(cls.trim());
        });
      }

      labelElement.textContent = label;
      this.componentElement.appendChild(labelElement);
    }

    // Remove label-class attribute after using it
    if (labelClass) {
      this.removeAttribute('label-class');
    }
  }

  _addHtmxAttributes(element) {
    // Copy HTMX attributes from wc-field to the anchor, then remove from wc-field
    const htmxAttrs = [
      'hx-get', 'hx-post', 'hx-put', 'hx-delete', 'hx-patch',
      'hx-target', 'hx-swap', 'hx-trigger', 'hx-indicator',
      'hx-push-url', 'hx-vals', 'hx-include', 'hx-confirm'
    ];

    htmxAttrs.forEach(attr => {
      const value = this.getAttribute(attr);
      if (value !== null) {
        element.setAttribute(attr, value);
        // Remove from wc-field to prevent duplicate HTMX bindings
        this.removeAttribute(attr);
      }
    });
  }

  _applyStyle() {
    const style = `
      wc-field {
        display: contents;
      }

      wc-field .wc-field {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
      }

      wc-field .wc-field-label {
        display: block;
        font-weight: 500;
      }

      /* Only show pointer and hover effect on anchors (which only exist when link/hx-get is present) */
      wc-field a.wc-field-label {
        cursor: pointer;
      }

      wc-field a.wc-field-label:hover {
        opacity: 0.8;
      }

      wc-field .wc-field-value {
        word-wrap: break-word;
        overflow-wrap: break-word;
        min-height: 1.5em;
      }

      /* Text alignment utilities (if not using utility classes) */
      wc-field[text-align="left"] .wc-field-value {
        text-align: left;
      }

      wc-field[text-align="center"] .wc-field-value {
        text-align: center;
      }

      wc-field[text-align="right"] .wc-field-value {
        text-align: right;
      }
    `.trim();
    this.loadStyle('wc-field-style', style);
  }
}

customElements.define('wc-field', WcField);
