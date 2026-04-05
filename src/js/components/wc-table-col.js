/**
 *  Name: wc-table-col
 *  Usage:
 *    <wc-table-col field="name" label="Name" sortable></wc-table-col>
 *
 *  Description:
 *    Column definition for wc-table. Defines field mapping, label,
 *    alignment, sorting, and formatting for a table column.
 *    This element is consumed by wc-table during render and not displayed.
 */

if (!customElements.get('wc-table-col')) {
  class WcTableCol extends HTMLElement {
    constructor() {
      super();
      this.style.display = 'none';
    }

    static get observedAttributes() {
      return ['field', 'label', 'sortable', 'align', 'width', 'format', 'class'];
    }

    get config() {
      return {
        field: this.getAttribute('field') || '',
        label: this.getAttribute('label') || this.getAttribute('field') || '',
        sortable: this.hasAttribute('sortable'),
        align: this.getAttribute('align') || 'left',
        width: this.getAttribute('width') || '',
        format: this.getAttribute('format') || '',
        css: this.getAttribute('class') || ''
      };
    }
  }

  customElements.define('wc-table-col', WcTableCol);
}
