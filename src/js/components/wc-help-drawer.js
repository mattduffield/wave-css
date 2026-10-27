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
 *   Create Ticket (form with screenshot + file attachments), and My Tickets (client-rendered list).
 *   Triggered by a "?" button or Ctrl+/ keyboard shortcut.
 *
 *   Attachments (Create Ticket): "Attach Screenshot" grabs the real tab with the browser's
 *   screen-capture API (getDisplayMedia — exact pixels, any CSS, WebGL included), falling back to
 *   html2canvas-pro (understands oklch/oklab/lab/lch/color()) when the API is missing or the user
 *   cancels. "Attach files" (any type), dropping files on the panel, or pasting an image also
 *   attach. Each file uploads straight away and STRAIGHT TO CLOUDFLARE R2 (the server never holds
 *   it): POST /api/upload/sign (urlencoded name, type, size, category=tickets; X-CSRF-Token) →
 *   { uploadUrl, method: "PUT", headers, url, originalName, contentType }, then an XHR PUT of the
 *   File itself to uploadUrl with exactly the signed headers (progress shown). Falls back to
 *   POST /api/upload (multipart FormData { file, category: "tickets" }) when signing isn't there
 *   (404/405) or the PUT fails with status 0 (bucket CORS not set / network). The limit is
 *   100 MB for tickets; the server's {error} is shown on failure (e.g. "File too large (max
 *   100MB)"). One chip per file (thumbnail or icon, name, size, ✕ — removing aborts the running
 *   request). On submit the ticket gets attachments_json = [{ url, name, content_type }, …] plus
 *   screenshot_url (older servers).
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
      this._attachments = []; // { id, name, size, content_type, url, status, error, screenshot, thumb, xhr }
      this._attachSeq = 0;
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

      // Tab panels — created once, shown/hidden on tab switch
      this._helpPanel = document.createElement("div");
      this._helpPanel.classList.add("help-drawer-content");
      this._buildHelpPanel();

      this._ticketPanel = document.createElement("div");
      this._ticketPanel.classList.add("help-drawer-content");
      this._buildTicketPanel();

      this._myTicketsPanel = document.createElement("div");
      this._myTicketsPanel.classList.add("help-drawer-content");
      this._buildMyTicketsPanel();

      this._panel.appendChild(this._helpPanel);
      this._panel.appendChild(this._ticketPanel);
      this._panel.appendChild(this._myTicketsPanel);

      // Show only active panel
      this._showActivePanel();

      // Footer
      const footer = document.createElement("div");
      footer.classList.add("help-drawer-footer");
      footer.innerHTML = `<span class="text-muted">Ctrl + / to toggle</span>`;
      this._panel.appendChild(footer);

      this.componentElement.appendChild(this._panel);

      this._wireEvents();
    }

    // ── Tab Panel Building ────────────────────────────────────────────────────

    _showActivePanel() {
      this._helpPanel.style.display = this._activeTab === "help" ? "" : "none";
      this._ticketPanel.style.display = this._activeTab === "create-ticket" ? "" : "none";
      this._myTicketsPanel.style.display = this._activeTab === "my-tickets" ? "" : "none";
    }

    _buildHelpPanel() {
      // Search row with refresh button
      const searchRow = document.createElement("div");
      searchRow.classList.add("help-drawer-search-row");

      const search = document.createElement("input");
      search.type = "search";
      search.classList.add("help-drawer-search");
      search.placeholder = "Search help articles...";
      search.autocomplete = "off";
      searchRow.appendChild(search);

      const refreshBtn = document.createElement("button");
      refreshBtn.type = "button";
      refreshBtn.classList.add("help-drawer-refresh-btn");
      refreshBtn.title = "Refresh";
      refreshBtn.innerHTML = '<wc-fa-icon name="rotate" size="0.7rem"></wc-fa-icon>';
      refreshBtn.addEventListener("click", () => {
        search.value = "";
        this._loadHelpContent("");
      });
      searchRow.appendChild(refreshBtn);

      this._helpPanel.appendChild(searchRow);

      const content = document.createElement("div");
      content.id = "help-drawer-content";
      content.classList.add("help-drawer-articles");
      this._helpPanel.appendChild(content);

      // Wire search
      search.addEventListener("input", (e) => {
        clearTimeout(this._searchTimeout);
        this._searchTimeout = setTimeout(
          () => this._loadHelpContent(e.target.value),
          300,
        );
      });
    }

    _buildTicketPanel() {
      const refKey = this.getAttribute("reference-key") || "";
      const tmplSlug = this.getAttribute("template-slug") || "";
      const username = this.getAttribute("username") || "";

      this._ticketPanel.innerHTML = `
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
          <div class="help-attach-row">
            <button type="button" class="help-ticket-screenshot-btn" title="Capture a screenshot of this page">
              <wc-fa-icon name="camera" size="0.75rem"></wc-fa-icon> Attach Screenshot
            </button>
            <button type="button" class="help-ticket-screenshot-btn help-attach-files-btn" title="Attach images, videos or documents">
              <wc-fa-icon name="paperclip" size="0.75rem"></wc-fa-icon> Attach files
            </button>
            <input type="file" class="help-attach-input" multiple hidden />
          </div>
          <span class="help-screenshot-status text-xs text-muted" aria-live="polite"></span>
          <div class="help-attach-hint text-xs">or drop files here, or paste an image</div>
          <ul class="help-attach-list" aria-label="Attachments"></ul>
          <button type="button" class="help-ticket-submit-btn">
            <wc-fa-icon name="paper-plane" size="0.75rem"></wc-fa-icon> Submit Ticket
          </button>
        </div>
      `;

      // Wire screenshot button
      const ssBtn = this._ticketPanel.querySelector(
        ".help-ticket-screenshot-btn",
      );
      ssBtn.addEventListener("click", () => this._captureScreenshot());

      // Wire file attachments: picker, drop, and the chip list's remove buttons
      const fileInput = this._ticketPanel.querySelector(".help-attach-input");
      this._ticketPanel
        .querySelector(".help-attach-files-btn")
        .addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", () => {
        this._addFiles(Array.from(fileInput.files || []));
        fileInput.value = ""; // the same file can be picked again
      });
      this._ticketPanel.addEventListener("dragover", (e) => {
        if (!Array.from(e.dataTransfer?.types || []).includes("Files")) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
        this._ticketPanel.classList.add("is-dragover");
      });
      this._ticketPanel.addEventListener("dragleave", (e) => {
        if (!this._ticketPanel.contains(e.relatedTarget)) this._ticketPanel.classList.remove("is-dragover");
      });
      this._ticketPanel.addEventListener("drop", (e) => {
        if (!e.dataTransfer?.files?.length) return;
        e.preventDefault();
        this._ticketPanel.classList.remove("is-dragover");
        this._addFiles(Array.from(e.dataTransfer.files));
      });
      this._ticketPanel
        .querySelector(".help-attach-list")
        .addEventListener("click", (e) => {
          const btn = e.target.closest(".help-attach-remove");
          if (btn) this._removeAttachment(btn.dataset.id);
        });

      // Wire submit button
      const submitBtn = this._ticketPanel.querySelector(
        ".help-ticket-submit-btn",
      );
      submitBtn.addEventListener("click", () => this._submitTicket());
    }

    _buildMyTicketsPanel() {
      const headerRow = document.createElement("div");
      headerRow.classList.add("help-drawer-search-row");

      const label = document.createElement("span");
      label.classList.add("text-xs", "font-medium");
      label.style.flex = "1";
      label.textContent = "My Tickets";
      headerRow.appendChild(label);

      const refreshBtn = document.createElement("button");
      refreshBtn.type = "button";
      refreshBtn.classList.add("help-drawer-refresh-btn");
      refreshBtn.title = "Refresh";
      refreshBtn.innerHTML = '<wc-fa-icon name="rotate" size="0.7rem"></wc-fa-icon>';
      refreshBtn.addEventListener("click", () => {
        this._myTicketsContent.innerHTML = `
          <div class="flex items-center justify-center p-4">
            <wc-fa-icon name="spinner" spin size="1rem"></wc-fa-icon>
            <span class="ml-2 text-xs text-muted">Loading tickets...</span>
          </div>
        `;
        this._myTicketsLoaded = false;
        this._loadMyTickets();
      });
      headerRow.appendChild(refreshBtn);

      this._myTicketsPanel.appendChild(headerRow);

      this._myTicketsContent = document.createElement("div");
      this._myTicketsPanel.appendChild(this._myTicketsContent);
    }

    // ── Help Content ──────────────────────────────────────────────────────────

    _collectRefKeys() {
      const refKeyElements = document.querySelectorAll("wc-ref-key");
      const refKeys = [];
      refKeyElements.forEach((el) => {
        const val = el.getAttribute("value");
        if (val && !refKeys.includes(val)) refKeys.push(val);
      });
      // Fallback to component attributes if no wc-ref-key elements found
      if (refKeys.length === 0) {
        const fallback = this.getAttribute("reference-key");
        if (fallback) refKeys.push(fallback);
      }
      return refKeys;
    }

    _updateContextBadges(refKeys) {
      const context = this._panel?.querySelector(".help-drawer-context");
      if (!context) return;
      const tmplSlug = this.getAttribute("template-slug") || "";
      context.innerHTML = "";
      refKeys.forEach((key) => {
        context.innerHTML += `<span class="help-context-badge">${key}</span>`;
      });
      if (tmplSlug && refKeys.length === 0) {
        context.innerHTML += `<span class="help-context-badge">${tmplSlug}</span>`;
      }
    }

    _loadHelpContent(query) {
      const helpUrl = this.getAttribute("help-url");
      if (!helpUrl) return;

      const refKeys = this._collectRefKeys();
      this._updateContextBadges(refKeys);

      let url = `${helpUrl}?reference_keys=${encodeURIComponent(refKeys.join(","))}`;
      const tmplSlug = this.getAttribute("template-slug") || "";
      if (tmplSlug) url += `&template_slug=${encodeURIComponent(tmplSlug)}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;

      const target = this._helpPanel.querySelector("#help-drawer-content");
      if (!target) return;

      if (typeof htmx !== "undefined") {
        htmx.ajax("GET", url, { target, swap: "innerHTML" });
      }
    }

    // ── Screenshot Capture ────────────────────────────────────────────────────

    // html2canvas-pro: a drop-in html2canvas fork that understands oklch/oklab/lab/lch/color(),
    // which Wave themes use (html2canvas 1.4.1 throws "unsupported color function oklch").
    // Loaded through Wave's loader, so WaveAssetBase serves the local mirror
    // (<base>/html2canvas-pro-2.5.2/dist/html2canvas-pro.min.js) with the CDN as fallback.
    static get HTML2CANVAS_PRO_URL() {
      return "https://cdn.jsdelivr.net/npm/html2canvas-pro@2.5.2/dist/html2canvas-pro.min.js";
    }

    _setStatus(text) {
      const statusEl = this._ticketPanel?.querySelector(".help-screenshot-status");
      if (statusEl) statusEl.textContent = text;
    }

    _hideDrawerForCapture(hide) {
      this._panel.style.display = hide ? "none" : "";
      this._overlay.style.display = hide ? "none" : "";
    }

    async _captureScreenshot() {
      // Hide the drawer first, synchronously: getDisplayMedia must be called while the click's
      // user activation is still valid, and the grab shouldn't include the drawer.
      this._setStatus("Capturing...");
      this._hideDrawerForCapture(true);
      let blob = null;
      let failure = "";
      try {
        blob = await this._grabTab();
      } catch (e) {
        // API missing, the user cancelled, or capture isn't allowed here → html2canvas-pro
        failure = e && e.name === "NotAllowedError" ? "" : (e && e.message) || "";
      }
      if (!blob) {
        try {
          await new Promise((r) => setTimeout(r, 300)); // let the page repaint without the drawer
          blob = await this._renderPage();
        } catch (e) {
          failure = (e && e.message) || failure || "unknown error";
        }
      }
      this._hideDrawerForCapture(false);
      if (!blob) {
        this._setStatus("Capture failed: " + failure);
        return;
      }
      this._setStatus("");
      this._addFiles([new File([blob], "screenshot.png", { type: "image/png" })], { screenshot: true });
    }

    // A real screenshot of this tab: exact pixels, any CSS, WebGL canvases included.
    async _grabTab() {
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getDisplayMedia !== "function") {
        throw new Error("screen capture is not available");
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: false,
        preferCurrentTab: true,
        selfBrowserSurface: "include",
        surfaceSwitching: "exclude",
      });
      try {
        const video = document.createElement("video");
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        await video.play();
        // let the page repaint without the drawer, then take a fresh frame
        await new Promise((r) => setTimeout(r, 300));
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        const c = document.createElement("canvas");
        c.width = video.videoWidth;
        c.height = video.videoHeight;
        if (!c.width || !c.height) throw new Error("no video frame");
        c.getContext("2d").drawImage(video, 0, 0);
        return await new Promise((res) => c.toBlob(res, "image/png"));
      } finally {
        stream.getTracks().forEach((t) => t.stop());
      }
    }

    // Fallback: render the visible page with html2canvas-pro.
    async _renderPage() {
      if (!window.html2canvasExports || typeof window.html2canvas !== "function") {
        this._setStatus("Loading capture library...");
        await this.loadScript(WcHelpDrawer.HTML2CANVAS_PRO_URL);
      }
      if (typeof window.html2canvas !== "function") throw new Error("capture library did not load");
      this._setStatus("Capturing...");
      const canvas = await window.html2canvas(document.body, {
        useCORS: true,
        scale: 1,
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight,
        windowWidth: document.documentElement.clientWidth,
        windowHeight: window.innerHeight,
      });
      return await new Promise((res) => canvas.toBlob(res, "image/png"));
    }

    // ── Attachments ───────────────────────────────────────────────────────────

    _addFiles(files, { screenshot = false } = {}) {
      files.filter(Boolean).forEach((file) => {
        const att = {
          id: `att-${++this._attachSeq}`,
          name: file.name || (screenshot ? "screenshot.png" : "file"),
          size: file.size || 0,
          content_type: file.type || "application/octet-stream",
          url: "",
          status: "uploading",
          progress: 0,
          error: "",
          screenshot,
          thumb: /^image\//.test(file.type || "") ? URL.createObjectURL(file) : "",
        };
        this._attachments.push(att);
        this._uploadAttachment(att, file);
      });
      this._renderAttachments();
    }

    // Each file goes straight to Cloudflare R2: ask the server for a signed link
    // (POST /api/upload/sign), then PUT the file to it — the server never holds the file.
    // Falls back to POST /api/upload when signing isn't there (404/405, older servers) or the
    // PUT can't reach R2 (status 0: the bucket's CORS rule isn't set yet, or a network error).
    _uploadAttachment(att, file) {
      const csrfToken = this.getAttribute("csrf-token") || "";
      const params = new URLSearchParams();
      params.append("name", att.name);
      params.append("type", file.type || "application/octet-stream");
      params.append("size", String(file.size));
      params.append("category", "tickets");
      this._send(att, "POST", "/api/upload/sign", params, {
        "Content-Type": "application/x-www-form-urlencoded",
        ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
      }, (xhr, data) => {
        if (xhr.status >= 200 && xhr.status < 300 && data && data.uploadUrl) {
          this._putToR2(att, file, data);
        } else if (data && (data.error || data.message)) {
          this._failAttachment(att, xhr, data);   // the server refused: 413 too large, 401 …
        } else {
          // No signing here: 404/405, or an older server answering with something that isn't
          // a signed link (an HTML page / catch-all route) → today's POST /api/upload.
          this._uploadViaServer(att, file);
        }
      });
      this._updateAttachStatus();
    }

    // PUT the File itself (not FormData) with exactly the signed headers: Content-Type and the
    // size are part of the signature, so nothing else may be added.
    _putToR2(att, file, signed) {
      const headers = signed.headers || {};
      this._send(att, signed.method || "PUT", signed.uploadUrl, file, headers, (xhr) => {
        if (xhr.status >= 200 && xhr.status < 300) {
          this._finishAttachment(att, {
            url: signed.url,
            originalName: signed.originalName,
            contentType: signed.contentType,
          });
        } else if (xhr.status === 0) {
          this._uploadViaServer(att, file); // CORS not set up on the bucket yet, or a network error
        } else {
          this._failAttachment(att, xhr, null);
        }
      }, true);
    }

    // The original path: multipart POST /api/upload (the server passes the file on to R2).
    _uploadViaServer(att, file) {
      const formData = new FormData();
      formData.append("file", file, att.name);
      formData.append("category", "tickets");
      const csrfToken = this.getAttribute("csrf-token") || "";
      this._send(att, "POST", "/api/upload", formData,
        csrfToken ? { "X-CSRF-Token": csrfToken } : {},
        (xhr, data) => {
          if (xhr.status >= 200 && xhr.status < 300 && data && (data.url || data.file_url)) {
            this._finishAttachment(att, data);
          } else {
            this._failAttachment(att, xhr, data);
          }
        }, true);
    }

    // One XHR at a time per attachment (att.xhr), so removing the chip aborts whichever request
    // is running — the sign call, the PUT or the fallback POST.
    _send(att, method, url, body, headers, done, trackProgress = false) {
      const xhr = new XMLHttpRequest();
      att.xhr = xhr;
      xhr.open(method, url);
      Object.entries(headers).forEach(([k, v]) => xhr.setRequestHeader(k, v));
      if (trackProgress) {
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable || att.xhr !== xhr) return;
          att.progress = Math.round((e.loaded / e.total) * 100);
          this._renderAttachment(att);
        };
      }
      const finish = () => {
        if (att.xhr !== xhr) return; // removed / aborted meanwhile
        att.xhr = null;
        let data = null;
        try { data = JSON.parse(xhr.responseText); } catch (e) { data = null; }
        done(xhr, data);
      };
      xhr.onload = finish;
      xhr.onerror = finish; // status 0
      xhr.send(body);
    }

    _finishAttachment(att, data) {
      att.url = data.url || data.file_url;
      att.name = data.originalName || att.name;
      att.content_type = data.contentType || att.content_type;
      att.status = "done";
      att.progress = 100;
      this._renderAttachment(att);
      this._updateAttachStatus();
    }

    // The server's JSON {error} when it refuses (e.g. 413 "File too large (max 100MB)").
    _failAttachment(att, xhr, data) {
      att.status = "error";
      att.error = (data && (data.error || data.message)) ||
        (xhr.status ? `Upload failed (${xhr.status})` : "Upload failed (network error)");
      this._renderAttachment(att);
      this._updateAttachStatus();
    }

    _removeAttachment(id) {
      const i = this._attachments.findIndex((a) => a.id === id);
      if (i < 0) return;
      const [att] = this._attachments.splice(i, 1);
      if (att.xhr) att.xhr.abort();
      if (att.thumb) URL.revokeObjectURL(att.thumb);
      this._renderAttachments();
    }

    _clearAttachments() {
      this._attachments.forEach((att) => {
        if (att.xhr) att.xhr.abort();
        if (att.thumb) URL.revokeObjectURL(att.thumb);
      });
      this._attachments = [];
      this._renderAttachments();
    }

    _updateAttachStatus() {
      const uploading = this._attachments.filter((a) => a.status === "uploading").length;
      if (uploading) this._setStatus(`Uploading ${uploading} file${uploading === 1 ? "" : "s"}...`);
      else {
        const done = this._attachments.filter((a) => a.status === "done").length;
        this._setStatus(done ? `${done} attached` : "");
      }
    }

    _fileIcon(type, name) {
      const ext = (name.split(".").pop() || "").toLowerCase();
      if (/^image\//.test(type)) return "file-image";
      if (/^video\//.test(type)) return "file-video";
      if (type === "application/pdf" || ext === "pdf") return "file-pdf";
      if (/zip|compressed|x-tar|gzip/.test(type) || ["zip", "gz", "tgz", "7z", "rar"].includes(ext)) return "file-zipper";
      if (/spreadsheet|excel|csv/.test(type) || ["xls", "xlsx", "csv"].includes(ext)) return "file-excel";
      if (/word|officedocument\.wordprocessing/.test(type) || ["doc", "docx"].includes(ext)) return "file-word";
      if (/json|javascript|xml|html/.test(type) || ["json", "js", "log", "xml", "html"].includes(ext)) return "file-code";
      if (/^text\//.test(type)) return "file-lines";
      return "file";
    }

    _formatSize(bytes) {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }

    _renderAttachments() {
      const list = this._ticketPanel?.querySelector(".help-attach-list");
      if (!list) return;
      list.innerHTML = "";
      this._attachments.forEach((att) => list.appendChild(this._attachmentChip(att)));
      list.hidden = this._attachments.length === 0;
      this._updateAttachStatus();
    }

    _renderAttachment(att) {
      const list = this._ticketPanel?.querySelector(".help-attach-list");
      const old = list?.querySelector(`[data-id="${att.id}"]`);
      if (old) old.replaceWith(this._attachmentChip(att));
    }

    _attachmentChip(att) {
      const li = document.createElement("li");
      li.className = `help-attach-chip is-${att.status}`;
      li.dataset.id = att.id;
      const pic = document.createElement("span");
      pic.className = "help-attach-pic";
      if (att.thumb) {
        const img = document.createElement("img");
        img.src = att.thumb;
        img.alt = "";
        pic.appendChild(img);
      } else {
        const icon = document.createElement("wc-fa-icon");
        icon.setAttribute("name", this._fileIcon(att.content_type, att.name));
        icon.setAttribute("size", "1rem");
        pic.appendChild(icon);
      }
      const text = document.createElement("span");
      text.className = "help-attach-text";
      const name = document.createElement("span");
      name.className = "help-attach-name";
      name.textContent = att.screenshot ? `Screenshot · ${att.name}` : att.name;
      name.title = att.name;
      const meta = document.createElement("span");
      meta.className = "help-attach-meta";
      meta.textContent =
        att.status === "uploading" ? `${this._formatSize(att.size)} · uploading ${att.progress}%`
          : att.status === "error" ? att.error
            : this._formatSize(att.size);
      text.append(name, meta);
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "help-attach-remove";
      remove.dataset.id = att.id;
      remove.title = `Remove ${att.name}`;
      remove.setAttribute("aria-label", `Remove ${att.name}`);
      remove.textContent = "×";
      li.append(pic, text, remove);
      return li;
    }

    // Paste an image (Ctrl/⌘-V) while the Create Ticket tab is open.
    _handlePasteEvent(e) {
      if (!this._isOpen || this._activeTab !== "create-ticket") return;
      const files = Array.from(e.clipboardData?.files || []).filter((f) => /^image\//.test(f.type));
      if (!files.length) return; // plain text pastes into the fields as usual
      e.preventDefault();
      this._addFiles(files.map((f, i) => (f.name && f.name !== "image.png" ? f
        : new File([f], `pasted-image-${Date.now()}${i ? "-" + i : ""}.${(f.type.split("/")[1] || "png").replace("jpeg", "jpg")}`, { type: f.type }))));
    }

    // ── Ticket Submission ─────────────────────────────────────────────────────

    async _submitTicket() {
      const ticketUrl = this.getAttribute("ticket-url");
      if (!ticketUrl) return;

      const type =
        this._ticketPanel.querySelector('[name="ticket_type"]')?.value || "bug";
      const priority =
        this._ticketPanel.querySelector('[name="ticket_priority"]')?.value ||
        "medium";
      const title =
        this._ticketPanel.querySelector('[name="ticket_title"]')?.value || "";
      const description =
        this._ticketPanel.querySelector('[name="ticket_description"]')?.value ||
        "";

      if (!title.trim()) {
        if (window.wc?.Notify) {
          wc.Notify.showWarning("Title is required");
        }
        return;
      }
      if (this._attachments.some((a) => a.status === "uploading")) {
        if (window.wc?.Notify) wc.Notify.showWarning("Wait for the attachments to finish uploading");
        this._setStatus("Wait for the attachments to finish uploading");
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
      // Every uploaded file (screenshot included) as attachments_json; failed uploads are left out.
      const done = this._attachments.filter((a) => a.status === "done" && a.url);
      if (done.length) {
        body.append("attachments_json", JSON.stringify(
          done.map((a) => ({ url: a.url, name: a.name, content_type: a.content_type })),
        ));
      }
      // Older servers read screenshot_url (the latest screenshot)
      const shot = done.filter((a) => a.screenshot).pop();
      if (shot) body.append("screenshot_url", shot.url);
      if (csrfToken) body.append("csrf_token", csrfToken);

      const submitBtn = this._ticketPanel.querySelector(
        ".help-ticket-submit-btn",
      );
      if (submitBtn) submitBtn.disabled = true;

      // Show the global busy indicator (#content-loader uses the htmx-indicator
      // pattern; this is a raw fetch, so toggle htmx-request manually).
      const loader = document.getElementById("content-loader");
      if (loader) loader.classList.add("htmx-request");

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
          if (window.wc?.Notify) {
            wc.Notify.showSuccess("Ticket submitted");
          }
          this._emitEvent("wchelpticketcreated", null, {
            bubbles: true,
            composed: true,
            detail: { ticketId: data._id || data.id || "" },
          });
          // Reset form fields and the attachment list
          this._clearAttachments();
          const titleInput = this._ticketPanel.querySelector('[name="ticket_title"]');
          const descInput = this._ticketPanel.querySelector('[name="ticket_description"]');
          const ssStatus = this._ticketPanel.querySelector('.help-screenshot-status');
          if (titleInput) titleInput.value = "";
          if (descInput) descInput.value = "";
          if (ssStatus) ssStatus.textContent = "";
        } else {
          if (window.wc?.Notify) {
            wc.Notify.showError("Failed to submit ticket");
          }
        }
      } catch (e) {
        if (window.wc?.Notify) {
          wc.Notify.showError("Error: " + e.message);
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
        if (loader) loader.classList.remove("htmx-request");
      }
    }

    // ── My Tickets ────────────────────────────────────────────────────────────

    async _loadMyTickets() {
      const username = this.getAttribute("username") || "";
      const ticketConn = this.getAttribute("ticket-conn") || "";
      const ticketDb = this.getAttribute("ticket-db") || "";
      const filter = JSON.stringify({
        "$or": [
          { "created_by": username },
          { "assignee": username },
          { "modified_by": username },
        ],
      });
      const sort = JSON.stringify([{ field: "created_date", dir: "desc" }]);
      let url = `/api/_project_ticket?filter=${encodeURIComponent(filter)}&sort=${encodeURIComponent(sort)}&size=50`;
      if (ticketConn) url += `&connName=${encodeURIComponent(ticketConn)}`;
      if (ticketDb) url += `&dbName=${encodeURIComponent(ticketDb)}`;

      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          this._myTickets = data.data || data.items || data.results || [];
          this._renderMyTicketsList();
        } else {
          this._myTicketsContent.innerHTML =
            '<div class="p-3 text-xs text-muted">Failed to load tickets.</div>';
        }
      } catch (e) {
        this._myTicketsContent.innerHTML =
          '<div class="p-3 text-xs text-muted">Error loading tickets.</div>';
      }
    }

    _renderMyTicketsList() {
      if (!this._myTickets.length) {
        this._myTicketsContent.innerHTML =
          '<div class="p-3 text-xs text-muted">No tickets found.</div>';
        return;
      }

      this._myTicketsContent.innerHTML = "";
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

      this._myTicketsContent.appendChild(list);
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

      // Always re-scan and load help content on open (fresh ref-key scan)
      if (this._activeTab === "help") {
        this._loadHelpContent("");
      }
      // Load tickets on first open to My Tickets tab
      if (this._activeTab === "my-tickets" && !this._myTicketsLoaded) {
        this._myTicketsLoaded = true;
        this._loadMyTickets();
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
          this._showActivePanel();
          // Lazy-load my tickets on first activation
          if (this._activeTab === "my-tickets" && !this._myTicketsLoaded) {
            this._myTicketsLoaded = true;
            this._loadMyTickets();
          }
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

      // Paste an image into the Create Ticket tab
      if (!this._handlePaste) this._handlePaste = (e) => this._handlePasteEvent(e);
      document.removeEventListener("paste", this._handlePaste);
      document.addEventListener("paste", this._handlePaste);
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
      if (this._handlePaste) {
        document.removeEventListener("paste", this._handlePaste);
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

        /* Search row */
        .help-drawer-search-row {
          display: flex;
          align-items: center;
          gap: 0.375rem;
          margin-bottom: 0.5rem;
        }
        .help-drawer-search-row .help-drawer-search {
          margin-bottom: 0;
        }
        .help-drawer-refresh-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 1.75rem;
          height: 1.75rem;
          flex-shrink: 0;
          border: 1px solid var(--component-border-color);
          border-radius: 0.25rem;
          background: var(--surface-3);
          color: var(--text-4);
          cursor: pointer;
          transition: background 0.2s, color 0.2s;
        }
        .help-drawer-refresh-btn:hover {
          background: var(--surface-4);
          color: var(--text-1);
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
          min-height: 1em;
        }

        /* Attachments */
        .help-attach-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .help-attach-hint {
          color: var(--text-3);
        }
        .help-drawer-content.is-dragover {
          outline: 2px dashed var(--primary-bg-color);
          outline-offset: -4px;
          background: color-mix(in srgb, var(--primary-bg-color) 8%, transparent);
        }
        .help-attach-list {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
          margin: 0;
          padding: 0;
          list-style: none;
        }
        .help-attach-list[hidden] {
          display: none;
        }
        .help-attach-chip {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.375rem;
          background: var(--surface-3);
          border: 1px solid var(--component-border-color);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: var(--text-1);
        }
        .help-attach-chip.is-error {
          border-color: var(--danger-color);
        }
        .help-attach-pic {
          flex: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 2.25rem;
          height: 2.25rem;
          border-radius: 0.25rem;
          background: var(--surface-2);
          color: var(--text-2);
          overflow: hidden;
        }
        .help-attach-pic img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .help-attach-text {
          display: flex;
          flex-direction: column;
          flex: 1 1 auto;
          min-width: 0;
        }
        .help-attach-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .help-attach-meta {
          font-size: 0.6875rem;
          color: var(--text-3);
        }
        .help-attach-chip.is-error .help-attach-meta {
          color: color-mix(in srgb, var(--danger-color) 55%, var(--text-1));
        }
        .help-attach-remove {
          flex: none;
          width: 1.5rem;
          height: 1.5rem;
          padding: 0;
          border: 0;
          border-radius: 0.25rem;
          background: transparent;
          color: var(--text-2);
          font-size: 1rem;
          line-height: 1;
          cursor: pointer;
        }
        .help-attach-remove:hover {
          background: var(--surface-4);
          color: var(--text-1);
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
