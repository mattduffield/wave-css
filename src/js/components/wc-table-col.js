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
      return ['field', 'label', 'sortable', 'align', 'width', 'format', 'class',
        'type', 'formatter', 'formatter-map', 'formatter-href', 'formatter-format',
        'formatter-active-field', 'formatter-events-url', 'formatter-live-field', 'formatter-done-when',
        'formatter-event-name', 'formatter-live-path'];
    }

    get config() {
      let formatterMap = {};
      const rawMap = this.getAttribute('formatter-map');
      if (rawMap) {
        try { const m = JSON.parse(rawMap); if (m && typeof m === 'object') formatterMap = m; }
        catch (ex) { console.warn('[wc-table-col] invalid formatter-map JSON for field', this.getAttribute('field'), ex); }
      }
      return {
        field: this.getAttribute('field') || '',
        label: this.getAttribute('label') || this.getAttribute('field') || '',
        sortable: this.hasAttribute('sortable'),
        align: this.getAttribute('align') || 'left',
        width: this.getAttribute('width') || '',
        format: this.getAttribute('format') || '',
        css: this.getAttribute('class') || '',
        // type="html" → render the field value as trusted innerHTML (caller owns the markup).
        type: this.getAttribute('type') || '',
        // formatter → named cell renderer returning HTML (badge | link | datetime).
        formatter: this.getAttribute('formatter') || '',
        formatterMap,
        formatterHref: this.getAttribute('formatter-href') || '',
        formatterFormat: this.getAttribute('formatter-format') || '',
        // run-status formatter (live SSE cell)
        formatterActiveField: this.getAttribute('formatter-active-field') || '',
        formatterEventsUrl: this.getAttribute('formatter-events-url') || '',
        formatterLiveField: this.getAttribute('formatter-live-field') || '',
        formatterDoneWhen: this.getAttribute('formatter-done-when') || '',
        // named SSE event to bind (e.g. step_change; default message) + a path extractor for the
        // display text (e.g. stack.-1.name), for run-state streams that aren't flat messages.
        formatterEventName: this.getAttribute('formatter-event-name') || '',
        formatterLivePath: this.getAttribute('formatter-live-path') || ''
      };
    }
  }

  customElements.define('wc-table-col', WcTableCol);
}
