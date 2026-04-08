/**
 *  Name: wc-tree
 *  Usage:
 *    <wc-tree id="my-tree" searchable>
 *      <wc-tree-item label="Development" icon="server" expanded>
 *        <wc-tree-item label="wec-dev" icon="database">
 *          <wc-tree-item label="prospect" icon="folder" badge="49197"
 *                        hx-get="/x/data-explorer/prospect"
 *                        hx-target="#content" hx-swap="innerHTML">
 *          </wc-tree-item>
 *        </wc-tree-item>
 *      </wc-tree-item>
 *    </wc-tree>
 *
 *  Description:
 *    A hierarchical tree component for navigation. Supports nested items,
 *    expand/collapse, lazy loading, search filtering, keyboard navigation,
 *    and HTMX integration.
 *
 *  Events (bubble from wc-tree-item):
 *    tree:item-click    — { label, icon, badge, level, element }
 *    tree:item-dblclick — { label, icon, badge, level, element }
 *    tree:item-context-menu — { label, icon, badge, level, element, x, y }
 */

import { WcBaseComponent } from "./wc-base-component.js";

if (!customElements.get("wc-tree")) {
  class WcTree extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class", "searchable"];
    }

    static get is() {
      return "wc-tree";
    }

    constructor() {
      super();
      const compEl = this.querySelector(":scope > .wc-tree");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-tree");
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
      this._wireEvents();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    _render() {
      if (this._rendered) return;
      this._rendered = true;
      super._render();
      this._createElement();

      if (typeof htmx !== "undefined" && !this._htmxProcessed) {
        this._htmxProcessed = true;
        htmx.process(this);
      }
    }

    _createElement() {
      const searchable = this.hasAttribute("searchable");

      // Search input
      if (searchable) {
        const searchWrap = document.createElement("div");
        searchWrap.classList.add("tree-search-wrap");
        const searchInput = document.createElement("input");
        searchInput.type = "search";
        searchInput.classList.add("tree-search");
        searchInput.placeholder = "Filter...";
        searchInput.setAttribute("autocomplete", "off");
        searchWrap.appendChild(searchInput);
        this.componentElement.appendChild(searchWrap);
      }

      // Tree content container
      const content = document.createElement("div");
      content.classList.add("tree-content");
      content.setAttribute("role", "tree");

      // Move child wc-tree-item elements into content
      const items = Array.from(this.querySelectorAll(":scope > wc-tree-item"));
      items.forEach((item) => content.appendChild(item));

      this.componentElement.appendChild(content);
    }

    getInnerContainer() {
      return this.querySelector(":scope > .wc-tree > .tree-content") || this;
    }

    // --- Keyboard Navigation ---

    _getVisibleRows() {
      return Array.from(this.querySelectorAll(".tree-item-row")).filter(
        (row) => {
          // Check if the row is visible (not inside a collapsed parent)
          let el = row.closest("wc-tree-item");
          let parent = el?.parentElement?.closest("wc-tree-item");
          while (parent) {
            if (!parent.isExpanded) return false;
            parent = parent.parentElement?.closest("wc-tree-item");
          }
          // Check if filtered out by search
          if (row.closest(".tree-filtered-out")) return false;
          return true;
        },
      );
    }

    _focusNext(currentItem) {
      const rows = this._getVisibleRows();
      const currentRow =
        currentItem.componentElement?.querySelector(".tree-item-row");
      const idx = rows.indexOf(currentRow);
      if (idx < rows.length - 1) {
        rows[idx + 1].focus();
      }
    }

    _focusPrev(currentItem) {
      const rows = this._getVisibleRows();
      const currentRow =
        currentItem.componentElement?.querySelector(".tree-item-row");
      const idx = rows.indexOf(currentRow);
      if (idx > 0) {
        rows[idx - 1].focus();
      }
    }

    // --- Search ---

    _filterItems(query) {
      const items = this.querySelectorAll("wc-tree-item");
      const lowerQuery = query.toLowerCase();

      items.forEach((item) => {
        const label = (item.getAttribute("label") || "").toLowerCase();
        const matches = !query || label.includes(lowerQuery);

        if (matches) {
          item.classList.remove("tree-filtered-out");
          // Expand parents so the match is visible
          if (query) {
            let parent = item.parentElement?.closest("wc-tree-item");
            while (parent) {
              parent.classList.remove("tree-filtered-out");
              parent.expand();
              parent = parent.parentElement?.closest("wc-tree-item");
            }
          }
        } else {
          item.classList.add("tree-filtered-out");
        }
      });
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === "searchable") {
        this._render();
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _wireEvents() {
      const searchInput = this.componentElement?.querySelector(".tree-search");
      if (searchInput) {
        this._handleSearch = (e) => {
          this._filterItems(e.target.value.trim());
        };
        searchInput.addEventListener("input", this._handleSearch);
      }
    }

    _unWireEvents() {
      const searchInput = this.componentElement?.querySelector(".tree-search");
      if (searchInput && this._handleSearch) {
        searchInput.removeEventListener("input", this._handleSearch);
      }
    }

    _applyStyle() {
      const style = `
        wc-tree {
          display: contents;
        }
        .wc-tree {
          display: flex;
          flex-direction: column;
          font-size: 0.8125rem;
          overflow-y: auto;
          user-select: none;
        }

        /* Search */
        .tree-search-wrap {
          padding: 0.375rem;
          flex-shrink: 0;
        }
        .tree-search {
          width: 100%;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          background: var(--surface-3, #2a2a2a);
          color: var(--text-1, #eee);
          border: 1px solid var(--surface-5, #444);
          border-radius: 0.25rem;
          outline: none;
        }
        .tree-search:focus {
          border-color: var(--primary-color, #3b97e3);
        }

        /* Tree content */
        .tree-content {
          flex: 1;
          overflow-y: auto;
        }

        /* Tree item */
        wc-tree-item {
          display: contents;
        }
        .wc-tree-item {
          display: flex;
          flex-direction: column;
        }

        /* Row */
        .tree-item-row {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          cursor: pointer;
          border-left: 2px solid transparent;
          transition: background-color 0.15s, border-color 0.15s;
          outline: none;
          min-height: 1.625rem;
        }
        .tree-item-row:hover {
          background: var(--surface-3, rgba(255,255,255,0.05));
        }
        .tree-item-row:focus-visible {
          border-left-color: var(--primary-color, #3b97e3);
          background: var(--surface-3, rgba(255,255,255,0.05));
        }
        .tree-item-row.selected {
          background: rgba(59, 151, 227, 0.15);
          border-left-color: var(--primary-color, #3b97e3);
        }

        /* System items (names starting with _) */
        .tree-item-row.system-item .tree-item-label {
          font-style: italic;
          opacity: 0.7;
        }

        /* Arrow */
        .tree-item-arrow {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 0.875rem;
          height: 0.875rem;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .tree-item-arrow.expanded {
          transform: rotate(90deg);
        }

        /* Icon */
        .tree-item-icon {
          display: flex;
          align-items: center;
          flex-shrink: 0;
          opacity: 0.8;
        }

        /* Label */
        .tree-item-label {
          flex: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Actions (hover-reveal buttons) */
        .tree-item-actions {
          display: flex;
          align-items: center;
          gap: 2px;
          margin-left: auto;
          padding-left: 0.25rem;
          opacity: 0;
          transition: opacity 0.15s ease;
        }
        .tree-item-row:hover .tree-item-actions {
          opacity: 1;
        }
        .tree-item-action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.25rem;
          height: 1.25rem;
          border: none;
          border-radius: 3px;
          background: transparent;
          color: var(--text-6, #888);
          cursor: pointer;
          padding: 0;
        }
        .tree-item-action-btn:hover {
          background: var(--surface-3, #333);
          color: var(--text-1, #e0e0e0);
        }

        /* Badge */
        .tree-item-badge {
          font-size: 0.625rem;
          color: var(--text-1, #e0e0e0);
          background: var(--surface-3, #333);
          border-radius: 9999px;
          padding: 0.0625rem 0.375rem;
          min-width: 1.25rem;
          text-align: center;
          flex-shrink: 0;
          margin-left: auto;
        }
        .tree-item-actions + .tree-item-badge {
          margin-left: 0;
          padding-left: 0.25rem;
        }

        /* Children */
        .tree-item-children {
          display: flex;
          flex-direction: column;
        }

        /* Loading */
        .tree-item-loading {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
          color: var(--text-6, #888);
        }
        .tree-item-error {
          color: var(--error-color, #e53935);
          font-size: 0.75rem;
        }

        /* Filtered out */
        .tree-filtered-out {
          display: none !important;
        }
      `;
      this.loadStyle("wc-tree-style", style);
    }
  }

  customElements.define("wc-tree", WcTree);
}
