/**
 *  Name: wc-tree-item
 *  Usage:
 *    <wc-tree-item label="prospect" icon="folder" badge="49197" expanded>
 *      <wc-tree-item label="child" icon="file"></wc-tree-item>
 *    </wc-tree-item>
 *
 *  Description:
 *    A node in a wc-tree hierarchy. Supports nesting, expand/collapse,
 *    icons, badges, lazy-loading via HTMX, and keyboard navigation.
 */

import { WcBaseComponent } from "./wc-base-component.js";

if (!customElements.get("wc-tree-item")) {
  class WcTreeItem extends WcBaseComponent {
    static get observedAttributes() {
      return [
        "id",
        "class",
        "label",
        "icon",
        "icon-style",
        "badge",
        "expanded",
        "selected",
        "lazy-url",
        "hx-get",
        "hx-post",
        "hx-target",
        "hx-swap",
        "hx-push-url",
        "hx-indicator",
        "hx-trigger",
        "hx-disinherit",
        "indicator-color",
      ];
    }

    static get is() {
      return "wc-tree-item";
    }

    constructor() {
      super();
      this._lazyLoaded = false;
      const compEl = this.querySelector(":scope > .wc-tree-item");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-tree-item");
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
      const label = this.getAttribute("label") || "";
      const icon = this.getAttribute("icon") || "";
      const iconStyle = this.getAttribute("icon-style") || "solid";
      const badge = this.getAttribute("badge") || "";
      const expanded = this.hasAttribute("expanded");
      const selected = this.hasAttribute("selected");
      const hasChildren =
        this.querySelectorAll(":scope > wc-tree-item").length > 0;
      const lazyUrl = this.getAttribute("lazy-url") || "";
      const hxGet = this.getAttribute("hx-get") || "";
      const hasExpandable = hasChildren || lazyUrl || hxGet;
      const isSystem = label.startsWith("_");

      // Calculate depth level
      let level = 0;
      let parent = this.parentElement?.closest("wc-tree-item");
      while (parent) {
        level++;
        parent = parent.parentElement?.closest("wc-tree-item");
      }
      this._level = level;

      // Row container
      const row = document.createElement("div");
      row.classList.add("tree-item-row");
      if (selected) row.classList.add("selected");
      if (isSystem) row.classList.add("system-item");
      row.style.paddingLeft = `${level * 1.25}rem`;
      row.setAttribute("tabindex", "0");
      row.setAttribute("role", "treeitem");
      row.setAttribute("aria-expanded", expanded ? "true" : "false");

      // Expand arrow
      const arrow = document.createElement("span");
      arrow.classList.add("tree-item-arrow");
      if (hasExpandable) {
        arrow.innerHTML = `<wc-fa-icon name="chevron-right" size="0.625rem"></wc-fa-icon>`;
        if (expanded) arrow.classList.add("expanded");
      }
      row.appendChild(arrow);

      // Indicator bar (on the .wc-tree-item container so it spans children)
      const indicatorColor = this.getAttribute("indicator-color");
      if (indicatorColor) {
        this.componentElement.style.borderLeft = `3px solid ${indicatorColor}`;
        this.componentElement.style.paddingLeft = "4px";
      }

      // Icon
      if (icon) {
        const iconEl = document.createElement("span");
        iconEl.classList.add("tree-item-icon");
        iconEl.innerHTML = `<wc-fa-icon name="${icon}" icon-style="${iconStyle}" size="0.8125rem"></wc-fa-icon>`;
        row.appendChild(iconEl);
      }

      // Label
      const labelEl = document.createElement("span");
      labelEl.classList.add("tree-item-label");
      labelEl.textContent = label;
      row.appendChild(labelEl);

      // Actions
      const actions = Array.from(this.querySelectorAll(':scope > [data-tree-action]'));
      if (actions.length > 0) {
        const actionsEl = document.createElement('span');
        actionsEl.classList.add('tree-item-actions');
        actions.forEach(a => actionsEl.appendChild(a));
        row.appendChild(actionsEl);
      }

      // Badge
      if (badge) {
        const badgeEl = document.createElement("span");
        badgeEl.classList.add("tree-item-badge");
        badgeEl.textContent = badge;
        row.appendChild(badgeEl);
      }

      this.componentElement.appendChild(row);

      // Children container
      const children = document.createElement("div");
      children.classList.add("tree-item-children");
      children.setAttribute("role", "group");
      if (!expanded) children.style.display = "none";

      // Move child wc-tree-item elements into children container
      const childItems = Array.from(
        this.querySelectorAll(":scope > wc-tree-item"),
      );
      childItems.forEach((child) => children.appendChild(child));

      this.componentElement.appendChild(children);
    }

    get level() {
      return this._level || 0;
    }

    get isExpanded() {
      return this.hasAttribute("expanded");
    }

    toggle() {
      if (this.isExpanded) {
        this.collapse();
      } else {
        this.expand();
      }
    }

    expand() {
      if (this.hasAttribute("expanded")) return; // Already expanded, prevent recursion
      this.setAttribute("expanded", "");
      this._emitEvent("wctreeitemexpand", "tree:item-expand", {
        bubbles: false,
        composed: true,
        detail: { label: this.getAttribute("label"), item: this },
      });
      const children = this.componentElement?.querySelector(
        ".tree-item-children",
      );
      const arrow = this.componentElement?.querySelector(".tree-item-arrow");
      const row = this.componentElement?.querySelector(".tree-item-row");
      if (children) children.style.display = "";
      if (arrow) arrow.classList.add("expanded");
      if (row) row.setAttribute("aria-expanded", "true");

      // Lazy load if needed
      const lazyUrl = this.getAttribute("lazy-url");
      if (lazyUrl && !this._lazyLoaded) {
        this._lazyLoad(lazyUrl, children);
      }
    }

    collapse() {
      if (!this.hasAttribute("expanded")) return; // Already collapsed, prevent recursion
      this.removeAttribute("expanded");
      this._emitEvent("wctreeitemcollapse", "tree:item-collapse", {
        bubbles: false,
        composed: true,
        detail: { label: this.getAttribute("label"), item: this },
      });
      const children = this.componentElement?.querySelector(
        ".tree-item-children",
      );
      const arrow = this.componentElement?.querySelector(".tree-item-arrow");
      const row = this.componentElement?.querySelector(".tree-item-row");
      if (children) children.style.display = "none";
      if (arrow) arrow.classList.remove("expanded");
      if (row) row.setAttribute("aria-expanded", "false");
    }

    _applyExpandedState(expanded) {
      const children = this.componentElement?.querySelector(
        ".tree-item-children",
      );
      const arrow = this.componentElement?.querySelector(".tree-item-arrow");
      const row = this.componentElement?.querySelector(".tree-item-row");
      if (expanded) {
        if (children) children.style.display = "";
        if (arrow) arrow.classList.add("expanded");
        if (row) row.setAttribute("aria-expanded", "true");

        // Lazy load if needed
        const lazyUrl = this.getAttribute("lazy-url");
        if (lazyUrl && !this._lazyLoaded) {
          this._lazyLoad(lazyUrl, children);
        }
      } else {
        if (children) children.style.display = "none";
        if (arrow) arrow.classList.remove("expanded");
        if (row) row.setAttribute("aria-expanded", "false");
      }
    }

    select() {
      if (this.hasAttribute("selected")) return; // Already selected, prevent recursion
      // Deselect siblings
      const tree = this.closest("wc-tree");
      if (tree) {
        tree
          .querySelectorAll(".tree-item-row.selected")
          .forEach((r) => r.classList.remove("selected"));
        tree.querySelectorAll("wc-tree-item[selected]").forEach((item) => {
          if (item !== this) item.removeAttribute("selected");
        });
      }
      const row = this.componentElement?.querySelector(".tree-item-row");
      if (row) row.classList.add("selected");
      this.setAttribute("selected", "");
    }

    async _lazyLoad(url, container) {
      this._lazyLoaded = true;

      // Show spinner
      const spinner = document.createElement("div");
      spinner.classList.add("tree-item-loading");
      spinner.style.paddingLeft = `${(this._level + 1) * 1.25}rem`;
      spinner.innerHTML = `<wc-fa-icon name="spinner" spin size="0.75rem"></wc-fa-icon> <span>Loading...</span>`;
      container.appendChild(spinner);
      container.style.display = "";

      try {
        const response = await fetch(url);
        if (response.ok) {
          const html = await response.text();
          spinner.remove();
          // Insert the response HTML — server decides what comes back
          const temp = document.createElement("div");
          temp.innerHTML = html;
          while (temp.firstChild) {
            container.appendChild(temp.firstChild);
          }
          // Process HTMX on new content
          if (typeof htmx !== "undefined") {
            htmx.process(container);
          }
        } else {
          spinner.innerHTML = `<span class="tree-item-error">Failed to load</span>`;
        }
      } catch (e) {
        spinner.innerHTML = `<span class="tree-item-error">Error: ${e.message}</span>`;
      }
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === "expanded") {
        // expand()/collapse() already have guards, but call the DOM update logic directly
        // to avoid the guard rejecting since the attribute is already set by the time we get here
        this._applyExpandedState(newValue !== null);
      } else if (attrName === "selected") {
        if (newValue !== null) {
          // Apply selection DOM updates directly without calling select() to avoid recursion
          const tree = this.closest("wc-tree");
          if (tree) {
            tree
              .querySelectorAll(".tree-item-row.selected")
              .forEach((r) => r.classList.remove("selected"));
            tree.querySelectorAll("wc-tree-item[selected]").forEach((item) => {
              if (item !== this) item.removeAttribute("selected");
            });
          }
          const row = this.componentElement?.querySelector(".tree-item-row");
          if (row) row.classList.add("selected");
        }
      } else if (attrName === "label") {
        const labelEl =
          this.componentElement?.querySelector(".tree-item-label");
        if (labelEl) labelEl.textContent = newValue || "";
      } else if (attrName === "badge") {
        let badgeEl = this.componentElement?.querySelector(".tree-item-badge");
        if (newValue) {
          if (!badgeEl) {
            badgeEl = document.createElement("span");
            badgeEl.classList.add("tree-item-badge");
            this.componentElement
              ?.querySelector(".tree-item-row")
              ?.appendChild(badgeEl);
          }
          badgeEl.textContent = newValue;
        } else if (badgeEl) {
          badgeEl.remove();
        }
      } else if (attrName === "indicator-color") {
        if (newValue) {
          this.componentElement.style.borderLeft = `3px solid ${newValue}`;
          this.componentElement.style.paddingLeft = "4px";
        } else {
          this.componentElement.style.borderLeft = "";
          this.componentElement.style.paddingLeft = "";
        }
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _wireEvents() {
      const row = this.componentElement?.querySelector(".tree-item-row");
      if (!row) return;

      this._handleRowClick = (e) => {
        const arrow = this.componentElement?.querySelector('.tree-item-arrow');
        const clickedArrow = arrow && (e.target === arrow || arrow.contains(e.target));

        if (clickedArrow) {
          this.toggle();
        }

        this.select();

        this._emitEvent("wctreeitemclick", "tree:item-click", {
          bubbles: true,
          composed: true,
          detail: {
            label: this.getAttribute("label"),
            icon: this.getAttribute("icon"),
            badge: this.getAttribute("badge"),
            level: this._level,
            element: this,
          },
        });
      };

      this._handleRowDblClick = (e) => {
        this._emitEvent("wctreeitemdblclick", "tree:item-dblclick", {
          bubbles: true,
          composed: true,
          detail: {
            label: this.getAttribute("label"),
            icon: this.getAttribute("icon"),
            badge: this.getAttribute("badge"),
            level: this._level,
            element: this,
          },
        });
      };

      this._handleRowContextMenu = (e) => {
        e.preventDefault();
        this.select();
        this._emitEvent("wctreeitemcontextmenu", "tree:item-context-menu", {
          bubbles: true,
          composed: true,
          detail: {
            label: this.getAttribute("label"),
            icon: this.getAttribute("icon"),
            badge: this.getAttribute("badge"),
            level: this._level,
            element: this,
            x: e.clientX,
            y: e.clientY,
          },
        });
      };

      this._handleKeydown = (e) => {
        const tree = this.closest("wc-tree");
        if (!tree) return;

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            tree._focusNext(this);
            break;
          case "ArrowUp":
            e.preventDefault();
            tree._focusPrev(this);
            break;
          case "ArrowRight":
            e.preventDefault();
            if (!this.isExpanded) this.expand();
            else tree._focusNext(this); // Move into children
            break;
          case "ArrowLeft":
            e.preventDefault();
            if (this.isExpanded) this.collapse();
            else {
              // Focus parent
              const parentItem = this.parentElement?.closest("wc-tree-item");
              if (parentItem) {
                const parentRow =
                  parentItem.componentElement?.querySelector(".tree-item-row");
                if (parentRow) parentRow.focus();
              }
            }
            break;
          case "Enter":
          case " ":
            e.preventDefault();
            this.select();
            row.click(); // Triggers HTMX if hx-get is set
            break;
        }
      };

      row.addEventListener("click", this._handleRowClick);
      row.addEventListener("dblclick", this._handleRowDblClick);
      row.addEventListener("contextmenu", this._handleRowContextMenu);
      row.addEventListener("keydown", this._handleKeydown);
    }

    _unWireEvents() {
      const row = this.componentElement?.querySelector(".tree-item-row");
      if (!row) return;
      if (this._handleRowClick)
        row.removeEventListener("click", this._handleRowClick);
      if (this._handleRowDblClick)
        row.removeEventListener("dblclick", this._handleRowDblClick);
      if (this._handleRowContextMenu)
        row.removeEventListener("contextmenu", this._handleRowContextMenu);
      if (this._handleKeydown)
        row.removeEventListener("keydown", this._handleKeydown);
    }

    _applyStyle() {
      // Styles are applied by the parent wc-tree component
    }
  }

  customElements.define("wc-tree-item", WcTreeItem);
}
