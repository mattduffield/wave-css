/**
 * Name: wc-wizard
 * Usage:
 *   <wc-wizard id="my-wizard">
 *     <wc-wizard-step label="Basics">
 *       <wc-input name="name" lbl-label="Name"></wc-input>
 *     </wc-wizard-step>
 *     <wc-wizard-step label="Details" before-navigate="saveState">
 *       <wc-select name="type" lbl-label="Type"></wc-select>
 *     </wc-wizard-step>
 *     <wc-wizard-step label="Preview">
 *       <div id="preview"></div>
 *     </wc-wizard-step>
 *   </wc-wizard>
 *
 * Description:
 *   Declarative step-by-step wizard. All step content is inline (same pattern
 *   as wc-tab). Steps are shown/hidden via CSS. If a consumer needs dynamic
 *   content, they can use hx-get with hx-trigger="load" inside the step.
 *   Navigation is driven by public methods (next, back, goTo) — the consumer
 *   provides their own buttons.
 *
 * Attributes:
 *   - active-step: Zero-based index of initially active step (default: 0)
 *
 * Events:
 *   - wcwizardstepchange — fires after step changes, detail: { step, totalSteps, isFirst, isLast }
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-wizard')) {
  class WcWizard extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'active-step'];
    }

    static get is() {
      return 'wc-wizard';
    }

    constructor() {
      super();
      this._steps = [];
      this._activeStep = 0;
      this._indicatorsEl = null;

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
      if (this._indicatorsEl) return;

      this._readSteps();

      const activeAttr = this.getAttribute('active-step');
      if (activeAttr !== null) {
        this._activeStep = parseInt(activeAttr) || 0;
      }

      this._createInnerElement();

      // Dispatch initial event so consumers can set button visibility
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

    _readSteps() {
      this._steps = Array.from(this.querySelectorAll(':scope > wc-wizard-step')).map(el => ({
        label: el.getAttribute('label') || '',
        icon: el.getAttribute('icon') || '',
        beforeNavigate: el.getAttribute('before-navigate') || '',
        element: el,
      }));
    }

    _createInnerElement() {
      // Build indicators
      this._indicatorsEl = document.createElement('div');
      this._indicatorsEl.classList.add('wc-wizard-indicators');

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

        this._indicatorsEl.appendChild(indicator);
      });

      // Insert indicators first, then move step elements into the wrapper
      this.componentElement.appendChild(this._indicatorsEl);

      this._steps.forEach((step, i) => {
        this.componentElement.appendChild(step.element);
        step.element.style.display = i === this._activeStep ? '' : 'none';
      });

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

      // 2. Hide current step
      currentStep.element.style.display = 'none';

      // 3. Update active step
      this._activeStep = stepIndex;

      // 4. Show new step
      this._steps[stepIndex].element.style.display = '';

      // 5. Update indicators
      this._updateIndicators();

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
      if (!this._indicatorsEl) return;
      const indicators = this._indicatorsEl.querySelectorAll('.wc-wizard-indicator');
      indicators.forEach((el, i) => {
        el.classList.toggle('active', i === this._activeStep);
      });
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

      if (this._indicatorsEl) {
        this._indicatorsEl.addEventListener('click', this._handleIndicatorClick);
      }
    }

    _unWireEvents() {
      if (this._indicatorsEl && this._handleIndicatorClick) {
        this._indicatorsEl.removeEventListener('click', this._handleIndicatorClick);
      }
    }

    _applyStyle() {
      const style = `
        wc-wizard {
          display: contents;
        }
        .wc-wizard {
          display: flex;
          flex-direction: column;
          flex: 1;
          gap: 0.5rem;
        }
        wc-wizard-step {
          flex: 1;
          overflow: auto;
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
      `.trim();
      this.loadStyle('wc-wizard-style', style);
    }
  }

  customElements.define('wc-wizard', WcWizard);
}
