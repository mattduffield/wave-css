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
 *    <!-- With hash-nav for URL tracking -->
 *    <wc-tree hash-nav>
 *      <wc-tree-item label="Welcome" data-hash="welcome" hx-get="/x/doc/welcome" hx-target="#content">
 *      </wc-tree-item>
 *    </wc-tree>
 *
 *  Description:
 *    A hierarchical tree component for navigation. Supports nested items,
 *    expand/collapse, lazy loading, search filtering, keyboard navigation,
 *    and HTMX integration.
 *
 *  Attributes:
 *    - searchable: enables search/filter input
 *    - filterable: enables gear icon with filter popover. Uses wc-tree-filter
 *      children to define filterable attributes and values.
 *    - hash-nav: enables URL hash tracking. When a tree item is clicked, updates
 *      location.hash from the item's data-hash or label attribute. On page load,
 *      auto-selects the matching item and triggers its click.
 *
 *  Events (bubble from wc-tree-item):
 *    wctreeitemclick       — { label, icon, badge, level, element }
 *    wctreeitemdblclick    — { label, icon, badge, level, element }
 *    wctreeitemcontextmenu — { label, icon, badge, level, element, x, y }
 */

import { WcBaseComponent } from "./wc-base-component.js";

if (!customElements.get("wc-tree")) {
  class WcTree extends WcBaseComponent {
    static get observedAttributes() {
      return ["id", "class", "searchable", "filterable", "hash-nav"];
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

      // Hash-nav: auto-select tree item matching URL hash on load
      if (this.hasAttribute('hash-nav')) {
        // Defer to let tree items render
        requestAnimationFrame(() => this._restoreFromHash());
      }
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
      const filterable = this.hasAttribute("filterable");

      // Parse filter definitions before moving children
      if (filterable) {
        this._parseFilters();
      }

      // Header row (search + gear)
      if (searchable || filterable) {
        const headerWrap = document.createElement("div");
        headerWrap.classList.add("tree-header-wrap");

        if (searchable) {
          const searchInput = document.createElement("input");
          searchInput.type = "search";
          searchInput.classList.add("tree-search");
          searchInput.placeholder = "Filter...";
          searchInput.setAttribute("autocomplete", "off");
          headerWrap.appendChild(searchInput);
        }

        if (filterable && this._filters && this._filters.length > 0) {
          const gearBtn = document.createElement("button");
          gearBtn.type = "button";
          gearBtn.classList.add("tree-filter-gear");
          gearBtn.title = "Filter options";
          gearBtn.innerHTML = '<wc-fa-icon name="gear" size="0.7rem"></wc-fa-icon>';
          headerWrap.appendChild(gearBtn);

          // Build popover
          this._filterPopover = document.createElement("div");
          this._filterPopover.classList.add("tree-filter-popover");
          this._buildFilterPopover();
          headerWrap.appendChild(this._filterPopover);
        }

        this.componentElement.appendChild(headerWrap);
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

    // --- Filtering ---

    _parseFilters() {
      const filterEls = this.querySelectorAll("wc-tree-filter");
      this._filters = [];
      filterEls.forEach((el) => {
        const field = el.getAttribute("field") || "";
        const label = el.getAttribute("label") || field;
        const valuesStr = el.getAttribute("values") || "";
        const checked = el.hasAttribute("checked");
        if (!field || !valuesStr) return;
        const values = valuesStr.split(",").map(v => v.trim()).filter(v => v);
        // Each value gets its own checked state
        const valueStates = {};
        values.forEach(v => { valueStates[v] = checked; });
        this._filters.push({ field, label, values, valueStates });
      });
    }

    _buildFilterPopover() {
      if (!this._filterPopover || !this._filters) return;
      this._filterPopover.innerHTML = "";

      this._filters.forEach((filter, fIdx) => {
        const group = document.createElement("div");
        group.classList.add("tree-filter-group");

        const groupLabel = document.createElement("div");
        groupLabel.classList.add("tree-filter-group-label");
        groupLabel.textContent = filter.label;
        group.appendChild(groupLabel);

        filter.values.forEach((val) => {
          const row = document.createElement("label");
          row.classList.add("tree-filter-option");

          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.checked = filter.valueStates[val];
          cb.dataset.filterIndex = fIdx;
          cb.dataset.filterValue = val;
          cb.addEventListener("change", () => {
            filter.valueStates[val] = cb.checked;
            this._applyFilters();
          });
          row.appendChild(cb);

          const span = document.createElement("span");
          span.textContent = val;
          row.appendChild(span);

          group.appendChild(row);
        });

        // Select all / none links
        const controls = document.createElement("div");
        controls.classList.add("tree-filter-controls");
        const allLink = document.createElement("a");
        allLink.href = "#";
        allLink.textContent = "all";
        allLink.addEventListener("click", (e) => {
          e.preventDefault();
          filter.values.forEach(v => { filter.valueStates[v] = true; });
          group.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = true; });
          this._applyFilters();
        });
        const noneLink = document.createElement("a");
        noneLink.href = "#";
        noneLink.textContent = "none";
        noneLink.addEventListener("click", (e) => {
          e.preventDefault();
          filter.values.forEach(v => { filter.valueStates[v] = false; });
          group.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = false; });
          this._applyFilters();
        });
        controls.appendChild(allLink);
        controls.appendChild(document.createTextNode(" / "));
        controls.appendChild(noneLink);
        group.appendChild(controls);

        this._filterPopover.appendChild(group);
      });
    }

    _applyFilters() {
      if (!this._filters || this._filters.length === 0) return;
      const items = this.querySelectorAll("wc-tree-item");

      items.forEach((item) => {
        let visible = true;

        for (const filter of this._filters) {
          const attrVal = item.getAttribute(filter.field) || "";
          if (!attrVal) continue; // No attribute = not subject to this filter
          if (!filter.valueStates[attrVal]) {
            visible = false;
            break;
          }
        }

        if (visible) {
          item.classList.remove("tree-filter-hidden");
        } else {
          item.classList.add("tree-filter-hidden");
        }
      });

      // Ensure parent items with visible children stay visible
      items.forEach((item) => {
        if (item.classList.contains("tree-filter-hidden")) {
          const hasVisibleChild = item.querySelector("wc-tree-item:not(.tree-filter-hidden)");
          if (hasVisibleChild) {
            item.classList.remove("tree-filter-hidden");
          }
        }
      });
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

    // --- Hash Navigation ---

    _getItemHash(item) {
      return item.getAttribute('data-hash') || item.getAttribute('label') || '';
    }

    _restoreFromHash() {
      const hash = window.location.hash.substring(1);
      if (!hash) return;

      const decoded = decodeURIComponent(hash);
      const items = this.querySelectorAll('wc-tree-item');
      for (const item of items) {
        if (this._getItemHash(item) === decoded) {
          // Expand all ancestors
          let parent = item.parentElement?.closest('wc-tree-item');
          while (parent) {
            parent.expand();
            parent = parent.parentElement?.closest('wc-tree-item');
          }
          // Select and trigger click
          item.select();
          const row = item.componentElement?.querySelector('.tree-item-row');
          if (row) row.click();
          break;
        }
      }
    }

    _updateHash(item) {
      // Only update hash for items that explicitly have data-hash
      if (!item.hasAttribute('data-hash')) return;
      const hash = item.getAttribute('data-hash');
      if (hash) {
        history.replaceState(null, '', '#' + encodeURIComponent(hash));
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

      // Gear button toggles filter popover
      const gearBtn = this.componentElement?.querySelector(".tree-filter-gear");
      if (gearBtn && this._filterPopover) {
        this._handleGearClick = (e) => {
          e.stopPropagation();
          this._filterPopover.classList.toggle("open");
        };
        gearBtn.addEventListener("click", this._handleGearClick);

        // Close popover on outside click
        this._handleDocClickForFilter = (e) => {
          if (this._filterPopover.classList.contains("open") &&
              !this._filterPopover.contains(e.target) &&
              e.target !== gearBtn && !gearBtn.contains(e.target)) {
            this._filterPopover.classList.remove("open");
          }
        };
        document.addEventListener("click", this._handleDocClickForFilter);
      }

      // Hash-nav: update hash when tree items are clicked
      if (this.hasAttribute('hash-nav')) {
        this._handleHashNavClick = (e) => {
          const treeItem = e.target.closest('wc-tree-item');
          if (treeItem) {
            this._updateHash(treeItem);
          }
        };
        this.addEventListener('wctreeitemclick', this._handleHashNavClick);

        this._handleHashChange = () => this._restoreFromHash();
        window.addEventListener('hashchange', this._handleHashChange);
      }
    }

    _unWireEvents() {
      const searchInput = this.componentElement?.querySelector(".tree-search");
      if (searchInput && this._handleSearch) {
        searchInput.removeEventListener("input", this._handleSearch);
      }

      if (this._handleDocClickForFilter) {
        document.removeEventListener("click", this._handleDocClickForFilter);
      }

      if (this._handleHashNavClick) {
        this.removeEventListener('wctreeitemclick', this._handleHashNavClick);
      }
      if (this._handleHashChange) {
        window.removeEventListener('hashchange', this._handleHashChange);
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

        /* Header (search + gear) */
        .tree-header-wrap {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem;
          flex-shrink: 0;
          position: relative;
        }
        .tree-search {
          flex: 1;
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

        /* Filter gear button */
        .tree-filter-gear {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.5rem;
          height: 1.5rem;
          flex-shrink: 0;
          border: none;
          border-radius: 0.25rem;
          background: transparent;
          color: var(--text-4);
          cursor: pointer;
          transition: background 0.15s, color 0.15s;
        }
        .tree-filter-gear:hover {
          background: var(--surface-4);
          color: var(--text-1);
        }

        /* Filter popover */
        .tree-filter-popover {
          display: none;
          position: absolute;
          top: 100%;
          right: 0.375rem;
          z-index: 10;
          min-width: 160px;
          padding: 0.5rem;
          background: var(--card-bg-color);
          border: 1px solid var(--component-border-color);
          border-radius: 0.375rem;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .tree-filter-popover.open {
          display: block;
        }
        .tree-filter-group {
          margin-bottom: 0.375rem;
        }
        .tree-filter-group:last-child {
          margin-bottom: 0;
        }
        .tree-filter-group-label {
          font-size: 0.625rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-4);
          margin-bottom: 0.25rem;
        }
        .tree-filter-option {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          padding: 1px 0.25rem;
          font-size: 0.75rem;
          color: var(--text-2);
          cursor: pointer;
          border-radius: 0.125rem;
        }
        .tree-filter-option:hover {
          background: var(--surface-3);
        }
        .tree-filter-option input[type="checkbox"] {
          margin: 0;
          cursor: pointer;
        }
        .tree-filter-controls {
          font-size: 0.625rem;
          padding-top: 0.125rem;
        }
        .tree-filter-controls a {
          color: var(--primary-bg-color);
          text-decoration: none;
          cursor: pointer;
        }
        .tree-filter-controls a:hover {
          text-decoration: underline;
        }

        /* Filter hidden items */
        wc-tree-item.tree-filter-hidden {
          display: none !important;
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
