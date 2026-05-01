/**
 * Name: wc-code-mirror-context-menu
 * Usage:
 *   <wc-code-mirror-context-menu label="Edit Document" icon="pen-to-square">
 *     (e, info) => { window.dsOpenEditDocument(info); }
 *   </wc-code-mirror-context-menu>
 *   <wc-code-mirror-context-menu separator></wc-code-mirror-context-menu>
 *
 * Attributes:
 *   - label: Menu item display text
 *   - icon: Icon name for wc-fa-icon
 *   - separator: Boolean — renders a divider line
 *   - order: Numeric position in the menu
 *
 * Description:
 *   Configuration-only child element for wc-code-mirror.
 *   The parent reads these to build a right-click context menu.
 *   Action function receives (event, info) where info contains:
 *   { cursor, selection, lineText, editor }
 */

if (!customElements.get('wc-code-mirror-context-menu')) {
  class WcCodeMirrorContextMenu extends HTMLElement {
    constructor() {
      super();
      this.classList.add('contents');
    }

    connectedCallback() {
      // Menu items are managed by wc-code-mirror; no additional work needed
    }
  }

  customElements.define('wc-code-mirror-context-menu', WcCodeMirrorContextMenu);
}
