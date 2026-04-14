/**
 * Name: wc-wizard
 * Usage:
 *   <wc-wizard id="my-wizard" form-id="my-form">
 *     <wc-wizard-step label="Basics" hx-get="/step1" hx-include="#form"></wc-wizard-step>
 *     <wc-wizard-step label="Details" hx-get="/step2" hx-include="#form" before-navigate="saveState"></wc-wizard-step>
 *   </wc-wizard>
 *
 * Description:
 *   Declarative step-by-step wizard powered by HTMX. Reads wc-wizard-step children
 *   as configuration and renders step indicators + a content area. Navigation is driven
 *   by public methods (next, back, goTo) — the consumer provides their own buttons.
 *
 * Events:
 *   - wcwizardstepchange — fires after step changes, detail: { step, totalSteps, isFirst, isLast }
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-wizard')) {
  class WcWizard extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'form-id', 'active-step'];
    }

    static get is() {
      return 'wc-wizard';
    }

    constructor() {
      super();
      this._steps = [];
      this._activeStep = 0;
      this._contentEl = null;

      const compEl = this.querySelector('.wc-wizard');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-wizard');
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-wizard > .wc-wizard-indicators');
      if (innerEl) return;

      this._readSteps();

      const activeAttr = this.getAttribute('active-step');
      if (activeAttr !== null) {
        this._activeStep = parseInt(activeAttr) || 0;
      }

      this._createInnerElement();
      this._loadStep(this._activeStep);
    }

    _readSteps() {
      this._steps = Array.from(this.querySelectorAll('wc-wizard-step')).map(el => ({
        label: el.getAttribute('label') || '',
        icon: el.getAttribute('icon') || '',
        hxGet: el.getAttribute('hx-get') || '',
        hxInclude: el.getAttribute('hx-include') || '',
        hxIndicator: el.getAttribute('hx-indicator') || '',
        beforeNavigate: el.getAttribute('before-navigate') || '',
      }));
    }

    _createInnerElement() {
      this.componentElement.innerHTML = '';

      // Indicators
      const indicators = document.createElement('div');
      indicators.classList.add('wc-wizard-indicators');

      this._steps.forEach((step, i) => {
        const indicator = document.createElement('span');
        indicator.classList.add('wc-wizard-indicator');
        if (i === this._activeStep) indicator.classList.add('active');
        indicator.dataset.step = i;

        let content = `${i + 1}. ${step.label}`;
        if (step.icon) {
          indicator.innerHTML = `<wc-fa-icon name="${step.icon}" size="0.625rem"></wc-fa-icon> ${content}`;
        } else {
          indicator.textContent = content;
        }

        indicators.appendChild(indicator);
      });

      this.componentElement.appendChild(indicators);

      // Content area
      this._contentEl = document.createElement('div');
      this._contentEl.classList.add('wc-wizard-content');
      this.componentElement.appendChild(this._contentEl);

      this._wireEvents();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    next() {
      if (this._activeStep < this._steps.length - 1) {
        this.goTo(this._activeStep + 1);
      }
    }

    back() {
      if (this._activeStep > 0) {
        this.goTo(this._activeStep - 1);
      }
    }

    goTo(stepIndex) {
      if (stepIndex < 0 || stepIndex >= this._steps.length) return;
      if (stepIndex === this._activeStep) return;

      // 1. Call before-navigate on current step
      const currentStep = this._steps[this._activeStep];
      if (currentStep.beforeNavigate) {
        const fn = window[currentStep.beforeNavigate];
        if (typeof fn === 'function') {
          fn();
        }
      }

      // 2. Sync form fields
      this._syncFormFields();

      // 3. Update active step
      this._activeStep = stepIndex;

      // 4. Update indicators
      this._updateIndicators();

      // 5. Load new step content
      this._loadStep(stepIndex);

      // 6. Dispatch event
      this._emitEvent('wcwizardstepchange', null, {
        bubbles: true,
        composed: true,
        detail: {
          step: this._activeStep,
          totalSteps: this._steps.length,
          isFirst: this.isFirst(),
          isLast: this.isLast(),
        },
      });
    }

    getCurrentStep() {
      return this._activeStep;
    }

    getTotalSteps() {
      return this._steps.length;
    }

    isFirst() {
      return this._activeStep === 0;
    }

    isLast() {
      return this._activeStep === this._steps.length - 1;
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    _updateIndicators() {
      const indicators = this.componentElement.querySelectorAll('.wc-wizard-indicator');
      indicators.forEach((el, i) => {
        el.classList.toggle('active', i === this._activeStep);
      });
    }

    _syncFormFields() {
      const formId = this.getAttribute('form-id');
      if (!formId) return;
      const form = document.getElementById(formId);
      if (!form) return;

      // Find all named elements in the content area
      const contentFields = this._contentEl.querySelectorAll(
        'input[name], select[name], textarea[name], wc-input[name], wc-select[name], wc-textarea[name], wc-cron-picker[name]'
      );

      contentFields.forEach(field => {
        const name = field.getAttribute('name');
        if (!name) return;

        // Get the value — handle both native and web component elements
        let value;
        if ('value' in field) {
          value = field.value;
        } else {
          value = field.getAttribute('value') || '';
        }

        // Find or create matching hidden input in the form
        let hidden = form.querySelector(`input[type="hidden"][name="${name}"]`);
        if (!hidden) {
          hidden = document.createElement('input');
          hidden.type = 'hidden';
          hidden.name = name;
          form.appendChild(hidden);
        }
        hidden.value = value;
      });
    }

    _loadStep(stepIndex) {
      const step = this._steps[stepIndex];
      if (!step || !step.hxGet) return;

      if (typeof htmx === 'undefined') {
        console.warn('[wc-wizard] htmx is required for step loading');
        return;
      }

      const formId = this.getAttribute('form-id');
      const formEl = formId ? document.getElementById(formId) : null;

      const ajaxOpts = {
        target: this._contentEl,
        swap: 'innerHTML',
      };

      // Use form as source so htmx includes form values as query params
      if (formEl) {
        ajaxOpts.source = formEl;
      }

      htmx.ajax('GET', step.hxGet, ajaxOpts);
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === 'active-step') {
        const step = parseInt(newValue) || 0;
        if (step !== this._activeStep && step >= 0 && step < this._steps.length) {
          this.goTo(step);
        }
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _wireEvents() {
      this._handleIndicatorClick = (e) => {
        const indicator = e.target.closest('.wc-wizard-indicator');
        if (indicator) {
          const step = parseInt(indicator.dataset.step);
          if (!isNaN(step)) {
            this.goTo(step);
          }
        }
      };

      const indicators = this.componentElement.querySelector('.wc-wizard-indicators');
      if (indicators) {
        indicators.addEventListener('click', this._handleIndicatorClick);
      }
    }

    _unWireEvents() {
      const indicators = this.componentElement?.querySelector('.wc-wizard-indicators');
      if (indicators && this._handleIndicatorClick) {
        indicators.removeEventListener('click', this._handleIndicatorClick);
      }
    }

    _applyStyle() {
      const style = `
        wc-wizard {
          display: contents;
        }
        wc-wizard-step {
          display: contents;
        }
        .wc-wizard {
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 0.5rem;
        }
        .wc-wizard-indicators {
          display: flex;
          gap: 0.25rem;
          padding: 0 0.5rem;
        }
        .wc-wizard-indicator {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.7rem;
          background: var(--surface-4);
          color: var(--text-4);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
          user-select: none;
          white-space: nowrap;
        }
        .wc-wizard-indicator.active {
          background: var(--primary-bg-color);
          color: var(--primary-text-color, #fff);
        }
        .wc-wizard-indicator:hover:not(.active) {
          background: var(--surface-5);
          color: var(--text-2);
        }
        .wc-wizard-content {
          flex: 1;
          overflow: auto;
        }
      `.trim();
      this.loadStyle('wc-wizard-style', style);
    }
  }

  customElements.define('wc-wizard', WcWizard);
}
