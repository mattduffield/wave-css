/**
 * Name: wc-document-tree-context-menu
 * Usage:
 *   <wc-document-tree-context-menu label="Edit Document" icon="pen-to-square">
 *     (e, node) => { window.dsOpenEditDocument(node.documentId); }
 *   </wc-document-tree-context-menu>
 *   <wc-document-tree-context-menu separator></wc-document-tree-context-menu>
 *
 * Attributes:
 *   - label: Menu item display text
 *   - icon: Icon name for wc-fa-icon
 *   - separator: Boolean — renders a divider line
 *   - order: Numeric position in the menu
 *
 * Description:
 *   Configuration-only child element for wc-document-tree.
 *   The parent reads these to build a right-click context menu.
 *   Action function receives (event, node) where node contains:
 *   { key, value, path, documentId, type }
 */

if (!customElements.get('wc-document-tree-context-menu')) {
  class WcDocumentTreeContextMenu extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // Menu items are managed by wc-document-tree; no additional work needed
    }
  }

  customElements.define('wc-document-tree-context-menu', WcDocumentTreeContextMenu);
}
