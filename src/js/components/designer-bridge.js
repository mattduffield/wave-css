/**
 * Designer Bridge — auto-initializes when html[data-designer] is present.
 *
 * Provides selection, drag/drop, toolbar, and postMessage communication
 * between a server-rendered page (inside an iframe) and the parent
 * wc-live-designer component.
 *
 * No separate file needed — this ships inside wave-css.js.
 * Go Kart just adds data-designer to <html> when ?designer=true.
 */
if (document.documentElement?.hasAttribute?.('data-designer')) {
  (function() {
    const WC_TAGS = new Set([
      'wc-input', 'wc-select', 'wc-textarea', 'wc-field',
      'wc-form', 'wc-tab', 'wc-tab-item', 'wc-breadcrumb', 'wc-breadcrumb-item',
      'wc-save-split-button', 'wc-save-button', 'wc-article-skeleton',
      'wc-table-skeleton', 'wc-card-skeleton', 'wc-list-skeleton',
      'wc-tabulator', 'wc-tabulator-column', 'wc-fa-icon', 'wc-image',
      'wc-hotkey', 'wc-behavior', 'wc-event-handler', 'wc-code-mirror',
      'wc-accordion', 'wc-dropdown', 'wc-flip-box', 'wc-menu',
      'wc-sidebar', 'wc-sidenav', 'wc-slideshow', 'wc-split-button',
      'wc-loader', 'wc-contact-card', 'wc-contact-chip', 'wc-article-card',
      'wc-timeline', 'wc-google-map', 'wc-google-address',
      'wc-script', 'wc-javascript', 'wc-visibility-change',
    ]);
    const HTML_TAGS = new Set([
      'button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label', 'hr', 'img',
    ]);
    const CONTAINER_TYPES = new Set([
      'div', 'fieldset', 'wc-form', 'wc-tab', 'wc-tab-item',
      'wc-accordion', 'wc-dropdown', 'wc-flip-box', 'wc-menu',
      'wc-sidebar', 'wc-sidenav', 'wc-slideshow', 'wc-split-button',
    ]);
    const UTILITY_TYPES = new Set([
      'wc-hotkey', 'wc-behavior', 'wc-event-handler', 'wc-visibility-change',
      'wc-script', 'wc-javascript', 'wc-event-hub', 'wc-mask-hub',
    ]);

    const registry = new Map();
    let selectedId = null;
    let idCounter = 0;
    let dropIndicator = null;
    let lastDropPosition = null;
    let lastDropParentId = null;

    function generateId() { return `d${Date.now().toString(36)}${(idCounter++).toString(36)}`; }
    function isDesignerTag(tag) { return WC_TAGS.has(tag) || HTML_TAGS.has(tag) || tag === 'div' || tag === 'fieldset'; }
    function isContainer(type) { return CONTAINER_TYPES.has(type); }

    function getInnerElement(el, type) {
      if (typeof el.getInnerContainer === 'function') return el.getInnerContainer();
      return el;
    }

    // --- Toolbar ---
    const toolbar = document.createElement('div');
    toolbar.id = 'designer-toolbar';
    toolbar.innerHTML = `
      <button data-action="move-up" title="Move Up">↑</button>
      <button data-action="move-down" title="Move Down">↓</button>
      <div class="sep"></div>
      <button data-action="duplicate" title="Duplicate">⧉</button>
      <button data-action="delete" title="Delete">✕</button>
    `;
    document.body.appendChild(toolbar);

    // --- Viewport: the content area to scan ---
    const viewport = document.querySelector('#viewport') || document.querySelector('main') || document.body;

    // --- Scan and Register ---
    function scanAndRegister() {
      registry.clear();

      function scan(parent, insideWC = false) {
        for (const child of parent.children) {
          const tag = child.tagName.toLowerCase();
          if (child.hasAttribute('data-designer-label-badge')) continue;

          if (WC_TAGS.has(tag)) {
            registerElement(child, tag);
            if (isContainer(tag)) {
              const inner = getInnerElement(child, tag);
              if (inner) {
                inner.setAttribute('data-drop-target', tag);
                scan(inner, tag.startsWith('wc-'));
              }
            } else if (typeof child.getDesignerHTML === 'function') {
              const inner = getInnerElement(child, tag);
              if (inner && inner !== child) scan(inner, true);
            }
          } else if (HTML_TAGS.has(tag) && !insideWC) {
            registerElement(child, tag);
          } else if (tag === 'div' || tag === 'fieldset') {
            const isInternal = Array.from(child.classList).some(c =>
              c.startsWith('wc-') || c === 'tab-nav' || c === 'tab-body' || c === 'tab-link' || c === 'dropdown' || c === 'dropdown-content' || c === 'split-dropdown'
            );
            if (!isInternal) {
              registerElement(child, tag);
              if (isContainer(tag)) {
                const inner = getInnerElement(child, tag);
                if (inner) { inner.setAttribute('data-drop-target', tag); scan(inner, false); }
              }
            } else {
              scan(child, insideWC);
            }
          } else {
            scan(child);
          }
        }
      }

      scan(viewport);
      // Send ordered list of registered elements so parent can correlate with sourceDoc
      const elements = [];
      registry.forEach((entry, id) => elements.push({ id, type: entry.type }));
      postToParent('registryBuilt', { count: registry.size, elements });
    }

    function registerElement(el, type) {
      if (registry.has(el.getAttribute('data-designer-id'))) return;

      let id = el.getAttribute('data-designer-id');
      if (!id) { id = generateId(); el.setAttribute('data-designer-id', id); }

      if (isContainer(type)) el.setAttribute('data-designer-container', 'true');
      if (UTILITY_TYPES.has(type)) el.setAttribute('data-designer-utility', '');

      if (!el.querySelector(':scope > [data-designer-label-badge]')) {
        const badge = document.createElement('span');
        badge.setAttribute('data-designer-label-badge', '');
        badge.textContent = type;
        el.appendChild(badge);
      }

      registry.set(id, { element: el, type });
    }

    // --- Selection ---
    function selectComponent(designerId) {
      deselectAll();
      const entry = registry.get(designerId);
      if (!entry) return;

      selectedId = designerId;
      entry.element.style.outline = '2px solid #3b97e3';
      entry.element.style.outlineOffset = '2px';
      entry.element.setAttribute('data-designer-selected', '');
      positionToolbar(entry.element);

      const ancestors = [];
      let el = entry.element.parentElement;
      while (el && el !== viewport && el !== document.body) {
        const pid = el.getAttribute?.('data-designer-id');
        if (pid && registry.has(pid)) ancestors.unshift({ designerId: pid, type: registry.get(pid).type });
        el = el.parentElement;
      }

      // Read properties from the element for the property panel
      const props = {};
      const el2 = entry.element;
      for (const attr of el2.attributes) {
        const n = attr.name;
        if (n.startsWith('data-designer') || n === 'data-wc-id' || n === 'data-drop-target' || n === 'style') continue;
        if (n === 'class') {
          props.css = attr.value.replace(/\bcontents\b/g, '').replace(/\bdesigner-selected\b/g, '').trim();
          continue;
        }
        if (n === 'data-scope') { props.scope = attr.value; continue; }
        props[n] = attr.value;
      }
      // 'name' is consumed by form components — read from their inner form element only
      const formTags = new Set(['wc-input', 'wc-select', 'wc-textarea', 'wc-field', 'wc-google-address']);
      if (!props.name && formTags.has(entry.type)) {
        const formEl = el2.querySelector(':scope > .wc-' + entry.type.replace('wc-', '') + ' > [form-element]')
          || el2.querySelector(':scope > * > input, :scope > * > select, :scope > * > textarea');
        if (formEl?.name) props.name = formEl.name;
      }
      // For native HTML elements, get text content
      if (HTML_TAGS.has(entry.type)) {
        const textNodes = Array.from(el2.childNodes).filter(n2 => n2.nodeType === 3);
        props.content = textNodes.map(n2 => n2.textContent).join('').trim();
      }

      postToParent('select', { designerId, type: entry.type, ancestors, properties: props });
    }

    function deselectAll() {
      if (selectedId) {
        const entry = registry.get(selectedId);
        if (entry) {
          entry.element.style.outline = '';
          entry.element.style.outlineOffset = '';
          entry.element.removeAttribute('data-designer-selected');
        }
      }
      selectedId = null;
      toolbar.classList.remove('visible');
      postToParent('deselect', {});
    }

    function positionToolbar(el) {
      const rect = el.getBoundingClientRect();
      toolbar.classList.add('visible');
      toolbar.style.left = `${rect.left + window.scrollX}px`;
      toolbar.style.top = `${rect.top + window.scrollY - 32}px`;
      if (rect.top < 40) toolbar.style.top = `${rect.bottom + window.scrollY + 4}px`;
    }

    // --- Component Operations ---
    function removeComponent(designerId) {
      const entry = registry.get(designerId);
      if (!entry) return;
      const badge = entry.element.querySelector(':scope > [data-designer-label-badge]');
      if (badge) badge.remove();
      entry.element.remove();
      registry.delete(designerId);
      if (selectedId === designerId) { selectedId = null; toolbar.classList.remove('visible'); }
      postToParent('componentRemoved', { designerId });
      postToParent('deselect', {});
    }

    function moveComponent(designerId, direction) {
      const entry = registry.get(designerId);
      if (!entry) return;
      const el = entry.element;
      if (direction === 'up' && el.previousElementSibling?.hasAttribute('data-designer-id'))
        el.parentElement.insertBefore(el, el.previousElementSibling);
      else if (direction === 'down' && el.nextElementSibling?.hasAttribute('data-designer-id'))
        el.parentElement.insertBefore(el.nextElementSibling, el);
      if (selectedId === designerId) positionToolbar(el);
      postToParent('componentMoved', { designerId, direction });
    }

    function duplicateComponent(designerId) {
      postToParent('duplicateRequest', { designerId });
    }

    function updateProperty(designerId, propName, value) {
      const entry = registry.get(designerId);
      if (!entry) return;
      const el = entry.element;
      if (propName === 'scope') el.setAttribute('data-scope', value);
      else if (propName === 'css') {
        const keep = ['contents', 'designer-selected'].filter(c => el.classList.contains(c));
        el.className = [value, ...keep].filter(Boolean).join(' ');
      } else if (propName === 'content') {
        const tn = Array.from(el.childNodes).find(n => n.nodeType === 3);
        if (tn) tn.textContent = value; else el.prepend(document.createTextNode(value));
      } else {
        const attr = propName.replace(/_/g, '-');
        if (value === '' || value === true) el.setAttribute(attr, '');
        else if (value === false || value == null) el.removeAttribute(attr);
        else el.setAttribute(attr, value);
      }
    }

    // --- Insert HTML (for drag/drop from parent palette) ---
    function insertHTMLAt(html, parentId, position, sourceHtml) {
      let parentEl;
      if (parentId) {
        const parentComp = viewport.querySelector(`[data-designer-id="${parentId}"]`);
        if (parentComp) {
          const entry = registry.get(parentId);
          parentEl = entry ? getInnerElement(parentComp, entry.type) : parentComp;
        } else parentEl = viewport;
      } else parentEl = viewport;

      const children = Array.from(parentEl.children).filter(c => c.hasAttribute('data-designer-id'));
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const newElements = Array.from(tempDiv.children);

      for (const el of newElements) {
        if (position != null && position < children.length) parentEl.insertBefore(el, children[position]);
        else parentEl.appendChild(el);
      }

      setTimeout(() => {
        for (const el of newElements) {
          const tag = el.tagName.toLowerCase();
          if (isDesignerTag(tag)) {
            registerElement(el, tag);
            if (isContainer(tag)) {
              const inner = getInnerElement(el, tag);
              if (inner) inner.setAttribute('data-drop-target', tag);
            }
          }
          scanNewChildren(el);
        }
        // Send sourceHtml (with Pongo2) to parent for sourceDoc if available
        postToParent('componentInserted', { html: sourceHtml || html, parentId, position });
      }, 500);
    }

    function scanNewChildren(parent, insideWC = false) {
      for (const child of parent.children) {
        const tag = child.tagName.toLowerCase();
        const isInternal = (tag === 'div' || tag === 'span' || tag === 'label' || tag === 'form') &&
          Array.from(child.classList).some(c => c.startsWith('wc-') || c === 'tab-nav' || c === 'tab-body');
        if (isInternal) { scanNewChildren(child, insideWC); continue; }

        const registered = registry.has(child.getAttribute('data-designer-id'));
        if (WC_TAGS.has(tag) && !registered) {
          registerElement(child, tag);
          if (isContainer(tag)) {
            const inner = getInnerElement(child, tag);
            if (inner) { inner.setAttribute('data-drop-target', tag); scanNewChildren(inner, tag.startsWith('wc-')); }
          } else if (typeof child.getDesignerHTML === 'function') {
            const inner = getInnerElement(child, tag);
            if (inner && inner !== child) scanNewChildren(inner, true);
          }
        } else if (HTML_TAGS.has(tag) && !insideWC && !registered) {
          registerElement(child, tag);
        } else if ((tag === 'div' || tag === 'fieldset') && !registered) {
          const isInt = Array.from(child.classList).some(c =>
            c.startsWith('wc-') || c === 'tab-nav' || c === 'tab-body' || c === 'tab-link' || c === 'dropdown' || c === 'dropdown-content' || c === 'split-dropdown');
          if (!isInt) {
            registerElement(child, tag);
            if (isContainer(tag)) {
              const inner = getInnerElement(child, tag);
              if (inner) { inner.setAttribute('data-drop-target', tag); scanNewChildren(inner, false); }
            }
          } else scanNewChildren(child, insideWC);
        }
      }
    }

    // --- Drag & Drop ---
    viewport.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      const target = findDropTarget(e.clientX, e.clientY);
      lastDropPosition = target.position;
      lastDropParentId = target.parentId;
      if (target.container) target.container.classList.add('drop-target');
      showDropIndicator(target.parentEl, target.position);
    });

    viewport.addEventListener('dragleave', (e) => {
      if (!viewport.contains(e.relatedTarget)) { removeDropIndicator(); clearDropTargets(); }
    });

    viewport.addEventListener('drop', (e) => {
      e.preventDefault();
      const savedPosition = lastDropPosition;
      const savedParentId = lastDropParentId;
      removeDropIndicator();
      clearDropTargets();
      const jsonData = e.dataTransfer.getData('application/json');
      if (!jsonData) return;
      try {
        const payload = JSON.parse(jsonData);
        if (payload.html) insertHTMLAt(payload.html, savedParentId, savedPosition, payload.sourceHtml);
      } catch (err) { console.error('[designer-bridge] Drop error:', err); }
    });

    function findDropTarget(clientX, clientY) {
      const elemAtPoint = document.elementFromPoint(clientX, clientY);
      let containerEl = elemAtPoint?.closest('[data-designer-container]');
      if (!containerEl && elemAtPoint) {
        const dp = elemAtPoint.closest('[data-designer-id]');
        if (dp?.hasAttribute('data-designer-container')) containerEl = dp;
      }
      let parentId = containerEl?.getAttribute('data-designer-id') || null;
      let parentEl;
      if (containerEl) {
        const entry = registry.get(parentId);
        parentEl = entry ? getInnerElement(containerEl, entry.type) : containerEl;
      } else parentEl = viewport;

      const children = Array.from(parentEl.children).filter(c => c.hasAttribute('data-designer-id'));
      let position = children.length;
      for (let i = 0; i < children.length; i++) {
        const rect = children[i].getBoundingClientRect();
        if (clientY < rect.top + rect.height / 2) { position = i; break; }
      }
      return { container: containerEl, parentEl, parentId, position };
    }

    function showDropIndicator(parentEl, position) {
      removeDropIndicator();
      dropIndicator = document.createElement('div');
      dropIndicator.className = 'drop-indicator';
      const children = Array.from(parentEl.children).filter(c => c.hasAttribute('data-designer-id'));
      if (position < children.length) parentEl.insertBefore(dropIndicator, children[position]);
      else parentEl.appendChild(dropIndicator);
    }

    function removeDropIndicator() {
      if (dropIndicator?.parentNode) dropIndicator.remove();
      dropIndicator = null;
      document.querySelectorAll('.drop-indicator').forEach(el => el.remove());
    }

    function clearDropTargets() {
      document.querySelectorAll('.drop-target').forEach(el => el.classList.remove('drop-target'));
    }

    // --- Click Handling ---
    viewport.addEventListener('click', (e) => {
      const target = e.target.closest('[data-designer-id]');
      if (target && target !== viewport) {
        e.stopPropagation();
        e.preventDefault();
        const id = target.getAttribute('data-designer-id');
        if (id && registry.has(id)) selectComponent(id);
      } else deselectAll();
    });

    // --- Toolbar Actions ---
    toolbar.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      const action = btn?.dataset.action;
      if (!action || !selectedId) return;
      e.stopPropagation();
      switch (action) {
        case 'move-up': moveComponent(selectedId, 'up'); break;
        case 'move-down': moveComponent(selectedId, 'down'); break;
        case 'duplicate': duplicateComponent(selectedId); break;
        case 'delete': removeComponent(selectedId); break;
      }
    });

    // --- Keyboard ---
    document.addEventListener('keydown', (e) => {
      if (!selectedId) return;
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); removeComponent(selectedId); }
      else if (e.key === 'Escape') deselectAll();
    });

    // --- PostMessage Bridge ---
    function postToParent(action, data) {
      if (window.parent !== window)
        window.parent.postMessage({ source: 'editor-bridge', action, ...data }, '*');
    }

    window.addEventListener('message', (e) => {
      if (!e.data || e.data.source !== 'live-designer') return;
      switch (e.data.action) {
        case 'insertHTML':
          insertHTMLAt(e.data.html, e.data.parentId || null, e.data.position || null, e.data.sourceHtml);
          break;
        case 'updateProperty':
          updateProperty(e.data.designerId, e.data.propName, e.data.value);
          break;
        case 'selectById':
          if (e.data.designerId && registry.has(e.data.designerId)) selectComponent(e.data.designerId);
          break;
        case 'clear-selection':
          deselectAll();
          break;
      }
    });

    // --- Initialize ---
    // Disable HTMX in designer mode — prevent all HTMX requests
    // (templates have hx-get/hx-trigger that would fire in the iframe)
    if (window.htmx) {
      document.body.addEventListener('htmx:beforeRequest', (e) => {
        e.preventDefault();
        e.detail.xhr?.abort();
      });
      // Remove all hx-trigger="revealed" to prevent auto-firing
      document.querySelectorAll('[hx-trigger]').forEach(el => {
        el.removeAttribute('hx-trigger');
      });
    }

    // Wait for components to render, then scan and register
    setTimeout(() => scanAndRegister(), 500);

    // Signal ready to parent
    postToParent('canvasReady', {});
  })();
}
