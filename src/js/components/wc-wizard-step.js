/**
 * Name: wc-wizard-step
 * Usage:
 *   <wc-wizard-step label="Basics">
 *     <wc-input name="name" lbl-label="Name"></wc-input>
 *   </wc-wizard-step>
 *   <wc-wizard-step label="Details" icon="cog" before-navigate="saveState">
 *     <wc-select name="type" lbl-label="Type"></wc-select>
 *   </wc-wizard-step>
 *
 * Attributes:
 *   - label: Display label shown in the step indicator pill
 *   - icon: (optional) Icon name for wc-fa-icon in the step indicator
 *   - before-navigate: (optional) Name of a window function to call before navigating away
 *
 * Description:
 *   Child element for wc-wizard. Contains inline step content that is shown/hidden
 *   by the parent wizard. Same pattern as wc-tab-item.
 */

if (!customElements.get('wc-wizard-step')) {
  class WcWizardStep extends HTMLElement {
    constructor() {
      super();
    }

    connectedCallback() {
      // Steps are managed by wc-wizard
    }
  }

  customElements.define('wc-wizard-step', WcWizardStep);
}
