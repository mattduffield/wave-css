/**
 * Name: wc-wizard-step
 * Usage:
 *   <wc-wizard-step label="Basics" hx-get="/step1" hx-include="#form" before-navigate="myFunc"></wc-wizard-step>
 *
 * Description:
 *   Configuration-only child element for wc-wizard.
 *   Not rendered — the parent wizard reads its attributes to configure each step.
 */

if (!customElements.get('wc-wizard-step')) {
  class WcWizardStep extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // Steps are managed by wc-wizard; no additional work needed
    }
  }

  customElements.define('wc-wizard-step', WcWizardStep);
}
