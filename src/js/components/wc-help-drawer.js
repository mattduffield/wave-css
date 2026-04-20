/**
 * Name: wc-help-drawer
 * Usage:
 *   <wc-help-drawer
 *     reference-key="DS-COMPARE-001"
 *     template-slug="data_studio_compare"
 *     username="mattd"
 *     user-email="matt@example.com"
 *     help-url="/x/help_drawer_content/create"
 *     ticket-url="/x/kanban_ticket_panel/create"
 *     csrf-token="abc123">
 *   </wc-help-drawer>
 *
 * Description:
 *   A slide-out help drawer with three tabs: Help (HTMX-loaded content with search),
 *   Create Ticket (form with screenshot capture), and My Tickets (client-rendered list).
 *   Triggered by a "?" button or Ctrl+/ keyboard shortcut.
 *
 * Attributes:
 *   - reference-key: Context identifier for the current screen
 *   - template-slug: Template name for context
 *   - username: Current user's username
 *   - user-email: Current user's email
 *   - help-url: URL for loading help content via HTMX
 *   - ticket-url: URL for submitting tickets
 *   - csrf-token: CSRF token for form submissions
 *
 * Events:
 *   - wchelpdraweropen
 *   - wchelpdrawerclose
 *   - wchelpticketcreated (detail: { ticketId })
 *
 * Public methods:
 *   - open(), close(), toggle()
 */

import { WcBaseComponent } from "./wc-base-component.js";

if (!customElements.get("wc-help-drawer")) {
  class WcHelpDrawer extends WcBaseComponent {
    static get observedAttributes() {
      return [
        "reference-key",
        "template-slug",
        "username",
        "user-email",
        "help-url",
        "ticket-url",
        "csrf-token",
        "ticket-conn",
        "ticket-db",
      ];
    }

    static get is() {
      return "wc-help-drawer";
    }

    constructor() {
      super();
      this._isOpen = false;
      this._activeTab = "help";
      this._screenshotUrl = "";
      this._searchTimeout = null;
      this._myTickets = [];

      const compEl = this.querySelector(".wc-help-drawer");
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement("div");
        this.componentElement.classList.add("wc-help-drawer");
        this.appendChild(this.componentElement);
      }
    }

    async connectedCallback() {
      super.connectedCallback();
      this._applyStyle();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    _render() {
      super._render();
      const innerEl = this.querySelector(
        ".wc-help-drawer > .help-drawer-trigger",
      );
      if (innerEl) return;
      this._createInnerElement();
    }

    _createInnerElement() {
      this.componentElement.innerHTML = "";

      // Trigger button
      const trigger = document.createElement("button");
      trigger.type = "button";
      trigger.classList.add("help-drawer-trigger");
      trigger.title = "Help & Support (Ctrl+/)";
      trigger.textContent = "?";
      this.componentElement.appendChild(trigger);

      // Overlay
      this._overlay = document.createElement("div");
      this._overlay.classList.add("help-drawer-overlay");
      this.componentElement.appendChild(this._overlay);

      // Drawer panel
      this._panel = document.createElement("div");
      this._panel.classList.add("help-drawer-panel");

      // Header
      const header = document.createElement("div");
      header.classList.add("help-drawer-header");
      header.innerHTML = `
        <div class="flex flex-row items-center gap-2">
          <wc-fa-icon name="circle-question" size="1rem"></wc-fa-icon>
          <span class="font-semibold">Help & Support</span>
        </div>
        <button type="button" class="help-drawer-close" title="Close">&times;</button>
      `;
      this._panel.appendChild(header);

      // Context badge
      const refKey = this.getAttribute("reference-key") || "";
      const tmplSlug = this.getAttribute("template-slug") || "";
      if (refKey || tmplSlug) {
        const context = document.createElement("div");
        context.classList.add("help-drawer-context");
        if (refKey)
          context.innerHTML += `<span class="help-context-badge">${refKey}</span>`;
        if (tmplSlug)
          context.innerHTML += `<span class="help-context-badge">${tmplSlug}</span>`;
        this._panel.appendChild(context);
      }

      // Tabs
      const tabNav = document.createElement("div");
      tabNav.classList.add("help-drawer-tabs");
      ["help", "create-ticket", "my-tickets"].forEach((tab) => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.classList.add("help-drawer-tab");
        if (tab === this._activeTab) btn.classList.add("active");
        btn.dataset.tab = tab;
        btn.textContent =
          tab === "help"
            ? "Help"
            : tab === "create-ticket"
              ? "Create Ticket"
              : "My Tickets";
        tabNav.appendChild(btn);
      });
      this._panel.appendChild(tabNav);

      // Tab content container
      this._tabContent = document.createElement("div");
      this._tabContent.classList.add("help-drawer-content");
      this._panel.appendChild(this._tabContent);

      // Footer
      const footer = document.createElement("div");
      footer.classList.add("help-drawer-footer");
      footer.innerHTML = `<span class="text-muted">Ctrl + / to toggle</span>`;
      this._panel.appendChild(footer);

      this.componentElement.appendChild(this._panel);

      this._renderActiveTab();
      this._wireEvents();
    }

    // ── Tab Rendering ─────────────────────────────────────────────────────────

    _renderActiveTab() {
      if (!this._tabContent) return;
      this._tabContent.innerHTML = "";

      switch (this._activeTab) {
        case "help":
          this._renderHelpTab();
          break;
        case "create-ticket":
          this._renderCreateTicketTab();
          break;
        case "my-tickets":
          this._renderMyTicketsTab();
          break;
      }
    }

    _renderHelpTab() {
      const search = document.createElement("input");
      search.type = "search";
      search.classList.add("help-drawer-search");
      search.placeholder = "Search help articles...";
      search.autocomplete = "off";
      this._tabContent.appendChild(search);

      const content = document.createElement("div");
      content.id = "help-drawer-content";
      content.classList.add("help-drawer-articles");
      this._tabContent.appendChild(content);

      // Wire search
      search.addEventListener("input", (e) => {
        clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(
          () => this._loadHelpContent(e.target.value),
          300,
        );
      });
    }

    _renderCreateTicketTab() {
      const refKey = this.getAttribute("reference-key") || "";
      const tmplSlug = this.getAttribute("template-slug") || "";
      const username = this.getAttribute("username") || "";

      this._tabContent.innerHTML = `
        <div class="help-ticket-context">
          <div class="help-ticket-context-row"><span class="text-muted">Screen:</span> ${refKey || "—"}</div>
          <div class="help-ticket-context-row"><span class="text-muted">Template:</span> ${tmplSlug || "—"}</div>
          <div class="help-ticket-context-row"><span class="text-muted">User:</span> ${username || "—"}</div>
          <div class="help-ticket-context-row"><span class="text-muted">URL:</span> ${window.location.pathname}</div>
        </div>
        <div class="flex flex-col gap-2 p-2">
          <label class="text-xs font-medium">Type</label>
          <select class="help-ticket-input" name="ticket_type">
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="question">Question</option>
            <option value="feedback">General Feedback</option>
          </select>
          <label class="text-xs font-medium">Priority</label>
          <select class="help-ticket-input" name="ticket_priority">
            <option value="low">Low</option>
            <option value="medium" selected>Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <label class="text-xs font-medium">Title</label>
          <input type="text" class="help-ticket-input" name="ticket_title" placeholder="Brief summary..." />
          <label class="text-xs font-medium">Description</label>
          <textarea class="help-ticket-input" name="ticket_description" rows="4" placeholder="Describe the issue or request..."></textarea>
          <div class="flex flex-row gap-2">
            <button type="button" class="help-ticket-screenshot-btn" title="Capture screenshot">
              <wc-fa-icon name="camera" size="0.75rem"></wc-fa-icon> Attach Screenshot
            </button>
            <span class="help-screenshot-status text-xs text-muted"></span>
          </div>
          <button type="button" class="help-ticket-submit-btn">
            <wc-fa-icon name="paper-plane" size="0.75rem"></wc-fa-icon> Submit Ticket
          </button>
        </div>
      `;

      // Wire screenshot button
      const ssBtn = this._tabContent.querySelector(
        ".help-ticket-screenshot-btn",
      );
      ssBtn.addEventListener("click", () => this._captureScreenshot());

      // Wire submit button
      const submitBtn = this._tabContent.querySelector(
        ".help-ticket-submit-btn",
      );
      submitBtn.addEventListener("click", () => this._submitTicket());
    }

    _renderMyTicketsTab() {
      this._tabContent.innerHTML = `
        <div class="flex items-center justify-center p-4">
          <wc-fa-icon name="spinner" spin size="1rem"></wc-fa-icon>
          <span class="ml-2 text-xs text-muted">Loading tickets...</span>
        </div>
      `;
      this._loadMyTickets();
    }

    // ── Help Content ──────────────────────────────────────────────────────────

    _loadHelpContent(query) {
      const helpUrl = this.getAttribute("help-url");
      if (!helpUrl) return;

      const refKey = this.getAttribute("reference-key") || "";
      const tmplSlug = this.getAttribute("template-slug") || "";
      let url = `${helpUrl}?reference_key=${encodeURIComponent(refKey)}&template_slug=${encodeURIComponent(tmplSlug)}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;

      const target = this._tabContent.querySelector("#help-drawer-content");
      if (!target) return;

      if (typeof htmx !== "undefined") {
        htmx.ajax("GET", url, { target, swap: "innerHTML" });
      }
    }

    // ── Screenshot Capture ────────────────────────────────────────────────────

    async _captureScreenshot() {
      const statusEl = this._tabContent.querySelector(
        ".help-screenshot-status",
      );

      // Load html2canvas if not available
      if (!window.html2canvas) {
        if (statusEl) statusEl.textContent = "Loading capture library...";
        try {
          await this.loadScript(
            "https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js",
          );
        } catch (e) {
          if (statusEl) statusEl.textContent = "Failed to load capture library";
          return;
        }
      }

      // Hide drawer, capture, show drawer
      if (statusEl) statusEl.textContent = "Capturing...";
      this._panel.style.display = "none";
      this._overlay.style.display = "none";

      await new Promise((r) => setTimeout(r, 300)); // Let UI settle

      try {
        const canvas = await html2canvas(document.body, {
          useCORS: true,
          scale: 1,
        });
        const blob = await new Promise((resolve) =>
          canvas.toBlob(resolve, "image/png"),
        );

        // Upload
        if (statusEl) statusEl.textContent = "Uploading...";
        this._panel.style.display = "";
        this._overlay.style.display = "";

        const formData = new FormData();
        formData.append("file", blob, "screenshot.png");
        formData.append("category", "tickets");

        const csrfToken = this.getAttribute("csrf-token") || "";
        const headers = {};
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch("/api/upload", {
          method: "POST",
          headers,
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          this._screenshotUrl = data.url || data.file_url || "";
          if (statusEl) statusEl.textContent = "Screenshot attached";
        } else {
          if (statusEl) statusEl.textContent = "Upload failed";
        }
      } catch (e) {
        this._panel.style.display = "";
        this._overlay.style.display = "";
        if (statusEl) statusEl.textContent = "Capture failed: " + e.message;
      }
    }

    // ── Ticket Submission ─────────────────────────────────────────────────────

    async _submitTicket() {
      const ticketUrl = this.getAttribute("ticket-url");
      if (!ticketUrl) return;

      const type =
        this._tabContent.querySelector('[name="ticket_type"]')?.value || "bug";
      const priority =
        this._tabContent.querySelector('[name="ticket_priority"]')?.value ||
        "medium";
      const title =
        this._tabContent.querySelector('[name="ticket_title"]')?.value || "";
      const description =
        this._tabContent.querySelector('[name="ticket_description"]')?.value ||
        "";

      if (!title.trim()) {
        if (window.wc?.Prompt) {
          wc.Prompt.toast({ title: "Title is required", icon: "warning" });
        }
        return;
      }

      const csrfToken = this.getAttribute("csrf-token") || "";
      const body = new URLSearchParams();
      body.append("type", type);
      body.append("priority", priority);
      body.append("title", title);
      body.append("description", description);
      body.append("reference_key", this.getAttribute("reference-key") || "");
      body.append("template_slug", this.getAttribute("template-slug") || "");
      body.append("status", "backlog");
      body.append("page_url", window.location.pathname);
      body.append("created_by", this.getAttribute("username") || "");
      body.append("user_email", this.getAttribute("user-email") || "");
      if (this._screenshotUrl)
        body.append("screenshot_url", this._screenshotUrl);
      if (csrfToken) body.append("csrf_token", csrfToken);

      const submitBtn = this._tabContent.querySelector(
        ".help-ticket-submit-btn",
      );
      if (submitBtn) submitBtn.disabled = true;

      try {
        const headers = { "Content-Type": "application/x-www-form-urlencoded" };
        if (csrfToken) headers["X-CSRF-Token"] = csrfToken;

        const response = await fetch(ticketUrl, {
          method: "POST",
          headers,
          body,
        });
        if (response.ok) {
          const data = await response.json().catch(() => ({}));
          if (window.wc?.Prompt) {
            wc.Prompt.toast({ title: "Ticket submitted", icon: "success" });
          }
          this._emitEvent("wchelpticketcreated", null, {
            bubbles: true,
            composed: true,
            detail: { ticketId: data._id || data.id || "" },
          });
          // Reset form
          this._screenshotUrl = "";
          this._renderCreateTicketTab();
        } else {
          if (window.wc?.Prompt) {
            wc.Prompt.toast({
              title: "Failed to submit ticket",
              icon: "error",
            });
          }
        }
      } catch (e) {
        if (window.wc?.Prompt) {
          wc.Prompt.toast({ title: "Error: " + e.message, icon: "error" });
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    }

    // ── My Tickets ────────────────────────────────────────────────────────────

    async _loadMyTickets() {
      const username = this.getAttribute("username") || "";
      const ticketConn = this.getAttribute("ticket-conn") || "";
      const ticketDb = this.getAttribute("ticket-db") || "";
      const filter = JSON.stringify([
        { field: "created_by", type: "=", value: username },
      ]);
      const sort = JSON.stringify([{ field: "created_date", dir: "desc" }]);
      let url = `/api/_project_ticket?filter=${encodeURIComponent(filter)}&sort=${encodeURIComponent(sort)}&size=20`;
      if (ticketConn) url += `&connName=${encodeURIComponent(ticketConn)}`;
      if (ticketDb) url += `&dbName=${encodeURIComponent(ticketDb)}`;

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          this._myTickets = data.items || data.results || data || [];
          this._renderMyTicketsList();
        } else {
          this._tabContent.innerHTML =
            '<div class="p-3 text-xs text-muted">Failed to load tickets.</div>';
        }
      } catch (e) {
        this._tabContent.innerHTML =
          '<div class="p-3 text-xs text-muted">Error loading tickets.</div>';
      }
    }

    _renderMyTicketsList() {
      if (!this._myTickets.length) {
        this._tabContent.innerHTML =
          '<div class="p-3 text-xs text-muted">No tickets found.</div>';
        return;
      }

      this._tabContent.innerHTML = "";
      const list = document.createElement("div");
      list.classList.add("help-tickets-list");

      this._myTickets.forEach((ticket) => {
        const card = document.createElement("div");
        card.classList.add("help-ticket-card");

        const statusClass = this._getStatusClass(ticket.status);
        const relTime = this._relativeTime(ticket.created_date);

        card.innerHTML = `
          <div class="flex flex-row items-center justify-between">
            <span class="help-ticket-title">${ticket.title || "Untitled"}</span>
            <span class="help-ticket-status ${statusClass}">${ticket.status || "backlog"}</span>
          </div>
          <div class="flex flex-row items-center justify-between text-muted">
            <span>${ticket.ticket_number || ""}</span>
            <span>${relTime}</span>
          </div>
        `;
        list.appendChild(card);
      });

      this._tabContent.appendChild(list);
    }

    _getStatusClass(status) {
      switch ((status || "").toLowerCase()) {
        case "open":
          return "status-open";
        case "in-progress":
        case "in progress":
          return "status-in-progress";
        case "backlog":
          return "status-backlog";
        case "closed":
        case "done":
          return "status-closed";
        default:
          return "status-backlog";
      }
    }

    _relativeTime(dateStr) {
      if (!dateStr) return "";
      const date = new Date(dateStr);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000);
      if (diff < 60) return "just now";
      if (diff < 3600) return Math.floor(diff / 60) + "m ago";
      if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
      if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
      return date.toLocaleDateString();
    }

    // ── Public API ────────────────────────────────────────────────────────────

    open() {
      if (this._isOpen) return;
      this._isOpen = true;
      this._panel.classList.add("open");
      this._overlay.classList.add("open");
      this._emitEvent("wchelpdraweropen", null, {
        bubbles: true,
        composed: true,
      });

      // Load help content on first open
      if (this._activeTab === "help") {
        requestAnimationFrame(() => {
          const content = this._tabContent.querySelector(
            "#help-drawer-content",
          );
          if (content && !content.innerHTML.trim()) {
            this._loadHelpContent("");
          }
        });
      }
    }

    close() {
      if (!this._isOpen) return;
      this._isOpen = false;
      this._panel.classList.remove("open");
      this._overlay.classList.remove("open");
      this._emitEvent("wchelpdrawerclose", null, {
        bubbles: true,
        composed: true,
      });
    }

    toggle() {
      if (this._isOpen) this.close();
      else this.open();
    }

    // ── Events ────────────────────────────────────────────────────────────────

    _wireEvents() {
      // Trigger button
      const trigger = this.componentElement.querySelector(
        ".help-drawer-trigger",
      );
      if (trigger) {
        this._handleTriggerClick = () => this.toggle();
        trigger.addEventListener("click", this._handleTriggerClick);
      }

      // Close button
      const closeBtn = this._panel?.querySelector(".help-drawer-close");
      if (closeBtn) {
        this._handleCloseClick = () => this.close();
        closeBtn.addEventListener("click", this._handleCloseClick);
      }

      // Overlay click
      if (this._overlay) {
        this._handleOverlayClick = () => this.close();
        this._overlay.addEventListener("click", this._handleOverlayClick);
      }

      // Tab clicks
      const tabNav = this._panel?.querySelector(".help-drawer-tabs");
      if (tabNav) {
        this._handleTabClick = (e) => {
          const tab = e.target.closest(".help-drawer-tab");
          if (!tab) return;
          this._activeTab = tab.dataset.tab;
          tabNav
            .querySelectorAll(".help-drawer-tab")
            .forEach((t) => t.classList.toggle("active", t === tab));
          this._renderActiveTab();
          if (this._activeTab === "my-tickets") this._loadMyTickets();
        };
        tabNav.addEventListener("click", this._handleTabClick);
      }

      // Keyboard shortcuts
      this._handleKeydown = (e) => {
        if (e.ctrlKey && e.key === "/") {
          e.preventDefault();
          this.toggle();
        } else if (e.key === "Escape" && this._isOpen) {
          this.close();
        }
      };
      document.addEventListener("keydown", this._handleKeydown);
    }

    _unWireEvents() {
      const trigger = this.componentElement?.querySelector(
        ".help-drawer-trigger",
      );
      if (trigger && this._handleTriggerClick) {
        trigger.removeEventListener("click", this._handleTriggerClick);
      }
      if (this._handleKeydown) {
        document.removeEventListener("keydown", this._handleKeydown);
      }
    }

    _handleAttributeChange(attrName, newValue) {
      if (attrName === "reference-key" || attrName === "template-slug") {
        const context = this._panel?.querySelector(".help-drawer-context");
        if (context) {
          const refKey = this.getAttribute("reference-key") || "";
          const tmplSlug = this.getAttribute("template-slug") || "";
          context.innerHTML = "";
          if (refKey)
            context.innerHTML += `<span class="help-context-badge">${refKey}</span>`;
          if (tmplSlug)
            context.innerHTML += `<span class="help-context-badge">${tmplSlug}</span>`;
        }
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    _applyStyle() {
      const style = `
        wc-help-drawer {
          display: contents;
        }
        .wc-help-drawer {
          position: relative;
        }

        /* Trigger button */
        .help-drawer-trigger {
          display: flex;
          align-items: center;
          justify-content: center;
          align-self: center;
          width: 32px;
          height: 32px;
          margin: 4px 0;
          border-radius: 50%;
          border: 2px solid var(--primary-bg-color);
          background: transparent;
          color: var(--primary-bg-color);
          font-size: 1rem;
          font-weight: 700;
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .help-drawer-trigger:hover {
          background: var(--primary-bg-color);
          color: var(--primary-text-color, #fff);
        }

        /* Overlay */
        .help-drawer-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.4);
          z-index: 9998;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }
        .help-drawer-overlay.open {
          opacity: 1;
          visibility: visible;
        }

        /* Panel */
        .help-drawer-panel {
          position: fixed;
          top: 0;
          right: 0;
          width: 420px;
          height: 100vh;
          background: var(--card-bg-color);
          color: var(--text-1);
          border-left: 1px solid var(--component-border-color);
          z-index: 9999;
          display: flex;
          flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.3s ease;
          font-size: 0.8125rem;
        }
        .help-drawer-panel.open {
          transform: translateX(0);
        }

        /* Header */
        .help-drawer-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--component-border-color);
          flex-shrink: 0;
          color: var(--text-1);
        }
        .help-drawer-close {
          background: none;
          border: none;
          color: var(--text-4);
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0 0.25rem;
          line-height: 1;
        }
        .help-drawer-close:hover {
          color: var(--text-1);
        }

        /* Context badge */
        .help-drawer-context {
          display: flex;
          gap: 0.375rem;
          padding: 0.5rem 1rem;
          flex-shrink: 0;
        }
        .help-context-badge {
          padding: 1px 8px;
          border-radius: 10px;
          font-size: 0.6875rem;
          background: var(--surface-3);
          color: var(--text-4);
          font-family: monospace;
        }

        /* Tabs */
        .help-drawer-tabs {
          display: flex;
          border-bottom: 1px solid var(--component-border-color);
          flex-shrink: 0;
        }
        .help-drawer-tab {
          flex: 1;
          padding: 0.5rem;
          background: none;
          border: none;
          border-bottom: 2px solid transparent;
          color: var(--text-4);
          font-size: 0.75rem;
          cursor: pointer;
          transition: color 0.2s, border-color 0.2s;
          text-align: center;
        }
        .help-drawer-tab:hover {
          color: var(--text-1);
        }
        .help-drawer-tab.active {
          color: var(--text-2);
          border-bottom-color: var(--primary-bg-color);
        }

        /* Content */
        .help-drawer-content {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
          color: var(--text-1);
        }

        /* Search */
        .help-drawer-search {
          width: 100%;
          padding: 0.375rem 0.625rem;
          font-size: 0.75rem;
          background: var(--surface-3);
          color: var(--text-1);
          border: 1px solid var(--component-border-color);
          border-radius: 0.25rem;
          outline: none;
          margin-bottom: 0.5rem;
        }
        .help-drawer-search::placeholder {
          color: var(--text-6);
        }
        .help-drawer-search:focus {
          border-color: var(--primary-bg-color);
        }

        /* Help articles container */
        .help-drawer-articles {
          font-size: 0.8125rem;
          line-height: 1.5;
          color: var(--text-1);
        }
        .help-drawer-articles a {
          text-decoration: none;
        }
        .help-drawer-articles a:hover {
          text-decoration: underline;
        }
        .help-drawer-articles .text-muted,
        .help-drawer-articles small,
        .help-drawer-articles [class*="muted"],
        .help-drawer-articles [class*="secondary"] {
          color: var(--text-2);
        }

        /* Ticket form */
        .help-ticket-context {
          padding: 0.5rem;
          margin-bottom: 0.5rem;
          background: var(--surface-3);
          border-radius: 0.25rem;
          font-size: 0.6875rem;
          border: 1px solid var(--component-border-color);
          color: var(--text-2);
        }
        .help-ticket-context-row {
          padding: 1px 0;
        }
        .help-ticket-context-row .text-muted {
          color: var(--text-2);
        }
        .help-drawer-content label {
          color: var(--text-3);
        }
        .help-ticket-input {
          width: 100%;
          padding: 0.375rem 0.5rem;
          font-size: 0.75rem;
          background: var(--component-bg-color);
          color: var(--text-1);
          border: 1px solid var(--component-border-color);
          border-radius: 0.25rem;
          outline: none;
          resize: vertical;
        }
        .help-ticket-input::placeholder {
          color: var(--text-4);
        }
        .help-ticket-input:focus {
          border-color: var(--primary-bg-color);
        }
        select.help-ticket-input {
          cursor: pointer;
        }
        .help-ticket-screenshot-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          padding: 0.375rem 0.75rem;
          font-size: 0.75rem;
          background: var(--surface-3);
          color: var(--text-3);
          border: 1px solid var(--component-border-color);
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .help-ticket-screenshot-btn:hover {
          background: var(--surface-4);
        }
        .help-screenshot-status {
          color: var(--text-3);
        }
        .help-ticket-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.375rem;
          width: 100%;
          padding: 0.5rem;
          font-size: 0.8125rem;
          background: var(--primary-bg-color);
          color: var(--primary-text-color, #fff);
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          transition: opacity 0.2s;
          margin-top: 0.25rem;
        }
        .help-ticket-submit-btn:hover {
          opacity: 0.9;
        }
        .help-ticket-submit-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Tickets list */
        .help-tickets-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }
        .help-ticket-card {
          padding: 0.5rem 0.625rem;
          background: var(--surface-3);
          border-radius: 0.25rem;
          cursor: pointer;
          transition: background 0.15s;
          font-size: 0.75rem;
          color: var(--text-2);
        }
        .help-ticket-card:hover {
          background: var(--surface-4);
        }
        .help-ticket-card .text-muted {
          color: var(--text-3);
        }
        .help-ticket-title {
          font-weight: 500;
          color: var(--text-1);
        }
        .help-ticket-status {
          padding: 1px 6px;
          border-radius: 8px;
          font-size: 0.625rem;
          font-weight: 500;
          text-transform: uppercase;
        }
        .status-open { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
        .status-in-progress { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .status-backlog { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
        .status-closed { background: rgba(156, 163, 175, 0.2); color: #9ca3af; }

        /* Footer */
        .help-drawer-footer {
          padding: 0.5rem 1rem;
          border-top: 1px solid var(--component-border-color);
          text-align: center;
          font-size: 0.6875rem;
          flex-shrink: 0;
          color: var(--text-4);
        }

        /* Mobile */
        @media (max-width: 480px) {
          .help-drawer-panel {
            width: 100vw;
          }
        }
      `.trim();
      this.loadStyle("wc-help-drawer-style", style);
    }
  }

  customElements.define("wc-help-drawer", WcHelpDrawer);
}
