/**
 * Name: wc-tree-filter
 * Usage:
 *   <wc-tree-filter field="data-kind" label="Type" values="app,template,schema,lookup" checked></wc-tree-filter>
 *   <wc-tree-filter field="badge" label="Badge" values="system,user"></wc-tree-filter>
 *
 * Attributes:
 *   - field: Attribute name to filter on (e.g. "data-kind", "badge")
 *   - label: Display label in the filter popover
 *   - values: Comma-separated list of filterable values
 *   - checked: If present, all values start checked (visible). If absent, all start unchecked (hidden).
 *
 * Description:
 *   Configuration-only child element for wc-tree. Declares a filterable
 *   attribute and its possible values. The parent tree reads these to
 *   build the gear popover filter UI.
 */

if (!customElements.get('wc-tree-filter')) {
  class WcTreeFilter extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // Filters are managed by wc-tree; no additional work needed
    }
  }

  customElements.define('wc-tree-filter', WcTreeFilter);
}
