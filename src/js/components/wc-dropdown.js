/**
 * 
 *  Name: wc-dropdown
 *  Usage:
 *    <wc-dropdown class="mb-4">
 *      <a href="#">Link 1</a>
 *      <a href="#">Link 2</a>
 *      <a href="#">Link 3</a>
 *    </wc-dropdown>
 * 
 *    <wc-dropdown class="mb-4" hover-mode>
 *      <a href="#">Link 1</a>
 *      <a href="#">Link 2</a>
 *      <a href="#">Link 3</a>
 *    </wc-dropdown>
 * 
 *    <!-- Surface menu look + rich items (icon, label, one-line description) -->
 *    <wc-dropdown label="CREATE ▾" menu-style="surface">
 *      <a href="#" class="wc-menu-item">
 *        <wc-fa-icon class="wc-menu-item-icon" name="cube"></wc-fa-icon>
 *        <span class="wc-menu-item-text"><span class="wc-menu-item-label">Box</span>
 *          <span class="wc-menu-item-desc">A box — no sketch needed</span></span>
 *      </a>
 *    </wc-dropdown>
 *
 *  Each dropdown anchors its menu to its own button: the CSS anchor name comes from `id`, or
 *  from the instance's unique data-wc-id when there is no id (they no longer share "---anchor").
 *  Esc closes and returns focus to the button.
 *
 *  CSS hooks (defaults keep the original look): --wc-dropdown-bg, --wc-dropdown-color,
 *  --wc-dropdown-border, --wc-dropdown-radius, --wc-dropdown-min-width, --wc-dropdown-max-width,
 *  --wc-dropdown-max-height, --wc-dropdown-item-hover; menu-style="surface" applies the surface
 *  look (surface-2 / surface-4 border / 8px radius / min-width 300px / max-height 70vh).
 *
 *  API:
 *    wc.EventHub.broadcast('wcdropdownopen', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wcdropdownclose', ['[data-wc-id="0982-a544-98da-b3da"]'])
 *    wc.EventHub.broadcast('wcdropdowntoggle', ['[data-wc-id="0982-a544-98da-b3da"]'])
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcDropdown extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'label', 'mode', 'format', 'dropdown-class', 'btn-class', 'menu-style'];
  }

  constructor() {
    super();
    this.childComponentSelector = 'a,hr,wc-input';
    this.clickModes = ['search', 'click'];
    this.mode = this.getAttribute('mode') || 'click';
    this._boundReposition = null;
    this._isOpen = false;
    this._isMobile = false;
    // Bound once, so every removeEventListener really removes what was added
    // (a fresh .bind() per call never matched, and a window listener leaked per render).
    this._onClick = this._handleClick.bind(this);
    this._onWindowClick = this._handleWindowClick.bind(this);
    this._onInput = this._handleInput.bind(this);
    this._onOpen = this._handleOpen.bind(this);
    this._onClose = this._handleClose.bind(this);
    this._onToggle = this._handleToggle.bind(this);
    this._onKeydown = this._handleKeydown.bind(this);
    const compEl = this.querySelector('.wc-dropdown');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-dropdown', this.mode);
      this.appendChild(this.componentElement);      
    }
    // console.log('ctor:wc-dropdown');
  }

  async connectedCallback() {
    super.connectedCallback();

    await this._applyStyle();
    this.classList.add('contents');
    this.classList.remove('hidden');
    this.componentElement.classList.remove('hidden');
    this._wireEvents();
    // console.log('connectedCallback:wc-dropdown');
  }

  getInnerContainer() {
    return this.querySelector(':scope > .wc-dropdown') || this;
  }

  getDesignerHTML() {
    const dropdownContent = this.querySelector('.dropdown-content');
    if (!dropdownContent) return null;
    const children = dropdownContent.querySelectorAll(':scope > *:not(.component)');
    if (children.length === 0) return null;
    return Array.from(children).map(child => {
      const tag = child.tagName.toLowerCase();
      const attrs = [];
      for (const attr of child.attributes) {
        if (attr.name === 'data-wc-id' || attr.name.startsWith('data-designer')) continue;
        if (attr.name === 'class' && attr.value === 'contents') continue;
        if (attr.name === 'style') continue;
        if (attr.value === '') attrs.push(attr.name);
        else attrs.push(`${attr.name}="${attr.value}"`);
      }
      const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
      if (tag === 'hr') return `<hr${attrStr}>`;
      return `<${tag}${attrStr}>${child.textContent}</${tag}>`;
    }).join('\n');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {
    if (attrName === 'label') {
      // Do nothing...
    } else if (attrName === 'menu-style') {
      this._applyMenuStyle();
    } else if (attrName === 'id') {
      // keep the anchor in step with a late id (the base would copy id onto the inner element)
      const wcDropdown = this.querySelector('.wc-dropdown');
      const content = this.querySelector('.wc-dropdown .dropdown-content');
      if (wcDropdown && content) {
        wcDropdown.style.anchorName = this._anchorName();
        content.style.positionAnchor = this._anchorName();
      }
      super._handleAttributeChange(attrName, newValue);
    } else if (attrName === 'dropdown-class') {
      this._updateDropdownClass(newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-dropdown > *');
    if (!innerEl) {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }
    // listeners are added in _wireEvents and removed in _unWireEvents. Render can run after
    // connectedCallback (it waits for child components), so wire again here — idempotent.
    this._applyMenuStyle();
    if (this.isConnected) this._wireEvents();

    if (typeof htmx !== 'undefined') {
      htmx.process(this);
    }
    // console.log('_render:wc-dropdown');
  }

  _createInnerElement() {
    const parts = Array.from(this.children).filter(p => !p.matches('wc-dropdown') && !p.matches('.wc-dropdown')); // Exclude nested wc-tab elements

    // Unique per instance: the id, else this instance's data-wc-id. (With no id every dropdown
    // used to share "---anchor", so all menus opened at the last button.)
    const anchor = this._anchorName();
    const positionArea = this.getAttribute('position-area') || 'bottom span-left';
    const positionTryFallbacks = this.getAttribute('position-try-fallbacks') || '--bottom-right, --bottom-left, --top-right, --top-left, --right, --left';    
    const lbl = this.getAttribute('label') || '';
    const format = this.getAttribute('format') || 'standard';
    const dropdownHeight = this.getAttribute('dropdown-height') || '';
    const btn = document.createElement('button');
    const btnClass = this.getAttribute('btn-class');
    if (lbl && format === 'standard') {
      btn.classList.add('dropbtn');
      if (btnClass) btn.classList.add(...btnClass.split(' ').filter(c => c));
      btn.textContent = lbl;
    } else {
      if (format === 'grid-round') {
        btn.classList.add('dropbtn');
        btn.classList.add('grid-round');
        if (btnClass) btn.classList.add(...btnClass.split(' ').filter(c => c));
        btn.innerHTML = `
          <svg class="h-5 w-5 align-middle pointer-events-none"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
            <path d="M128 96A64 64 0 1 1 0 96a64 64 0 1 1 128 0zm0 160A64 64 0 1 1 0 256a64 64 0 1 1 128 0zM64 480a64 64 0 1 1 0-128 64 64 0 1 1 0 128zM288 96A64 64 0 1 1 160 96a64 64 0 1 1 128 0zM224 320a64 64 0 1 1 0-128 64 64 0 1 1 0 128zm64 96a64 64 0 1 1 -128 0 64 64 0 1 1 128 0zm96-256a64 64 0 1 1 0-128 64 64 0 1 1 0 128zm64 96a64 64 0 1 1 -128 0 64 64 0 1 1 128 0zM384 480a64 64 0 1 1 0-128 64 64 0 1 1 0 128z"/>
          </svg>
        `;  
      } else if (format === 'avatar') {
        btn.classList.add('dropbtn');
        btn.classList.add('avatar');
        if (btnClass) btn.classList.add(...btnClass.split(' ').filter(c => c));
        btn.innerHTML = `
          <svg class="h-4 w-4 align-middle pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        `;  
      }
    }
    const dropdown = document.createElement('div');
    dropdown.classList.add('dropdown');
    const dropdownClass = this.getAttribute('dropdown-class');
    if (dropdownClass) {
      dropdown.classList.add(...dropdownClass.split(' ').filter(c => c));
    }
    const dropdownContent = document.createElement('div');
    dropdownContent.classList.add('dropdown-content', 'text-sm');
    if (this.mode === 'search') {
      const ipt = document.createElement('input');
      ipt.classList.add('search', 'component');
      ipt.type = 'search';
      ipt.setAttribute('placeholder', 'Search...');
      dropdownContent.appendChild(ipt);
      const svgNS = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNS, 'svg');
      svg.setAttribute('xmlns', svgNS);
      svg.setAttribute('fill', 'none');
      svg.setAttribute('viewBox', '0 0 24 24');
      svg.setAttribute('stroke-width', '1.5');
      svg.setAttribute('stroke', 'currentColor');
      svg.classList.add('search-svg', 'h-4', 'w-4', 'component');
      const path = document.createElementNS(svgNS, 'path');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      path.setAttribute('d', 'm21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z');
      svg.appendChild(path);      
      dropdownContent.appendChild(svg);
    }
    parts.forEach(p => dropdownContent.appendChild(p));
    dropdown.appendChild(dropdownContent);
    dropdown.append(btn);
    this.componentElement.append(dropdown);
    if (dropdownHeight) {
      dropdownContent.style.height = dropdownHeight;
      dropdownContent.style.overflow = 'auto';
    }
    const wcDropdown = this.querySelector('.wc-dropdown');
    wcDropdown.style.anchorName = anchor;
    const drpContent = this.querySelector('.wc-dropdown .dropdown-content');
    drpContent.style.positionAnchor = anchor;
    drpContent.style.positionArea = positionArea;
    drpContent.style.positionTryFallbacks = positionTryFallbacks;
    // at least the button's width (as before); --wc-dropdown-min-width can raise it
    drpContent.style.minWidth = `max(${wcDropdown.offsetWidth}px, var(--wc-dropdown-min-width, 0px))`;    
  }

  _anchorName() {
    const base = (this.getAttribute('id') || `wcdd-${this.wcId}`).replace(/[^a-zA-Z0-9_-]/g, '-');
    return `--${base}-anchor`;
  }

  _applyMenuStyle() {
    this.componentElement.classList.toggle('menu-surface', this.getAttribute('menu-style') === 'surface');
  }

  _handleKeydown(event) {
    if (event.key !== 'Escape') return;
    const shown = this.querySelector('.wc-dropdown.show');
    if (!shown) return;
    event.preventDefault();
    shown.classList.remove('show');
    this._isOpen = false;
    this.querySelector('.dropbtn')?.focus();
  }

  _handleHelper(event, mode='open') {
    const {detail} = event;
    const {selector} = detail;
    const triggerSelector = '.wc-dropdown';
    const isArray = Array.isArray(selector);
    if (typeof selector === 'string' || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach(tgt => {
        if (tgt === this) {
          const elt = tgt?.querySelector(triggerSelector);
          if (mode === 'open') {
            elt?.classList.add('show');
            this._applyPositioningIfNeeded();
          } else if (mode === 'close') {
            elt?.classList.remove('show');
            this._isOpen = false;
          } else if (mode === 'toggle') {
            elt?.classList.toggle('show');
            if (elt?.classList.contains('show')) {
              this._applyPositioningIfNeeded();
            } else {
              this._isOpen = false;
            }
          }
        }
      });
    } else {
      const elt = selector?.querySelector(triggerSelector);
      if (mode === 'open') {
        elt?.classList.add('show');
        this._applyPositioningIfNeeded();
      } else if (mode === 'close') {
        elt?.classList.remove('show');
        this._isOpen = false;
      } else if (mode === 'toggle') {
        elt?.classList.toggle('show');
        if (elt?.classList.contains('show')) {
          this._applyPositioningIfNeeded();
        } else {
          this._isOpen = false;
        }
      }
    }
  }
  
  _applyPositioningIfNeeded() {
    const dropdownContent = this.querySelector('.dropdown-content');
    const button = this.querySelector('.dropbtn');
    if (dropdownContent && button) {
      requestAnimationFrame(() => {
        this._positionDropdown(dropdownContent, button);
        this._isOpen = true;
      });
    }
  }

  _handleOpen(event) {
    this._handleHelper(event, 'open');
  }

  _handleClose(event) {
    this._handleHelper(event, 'close');
  }

  _handleToggle(event) {
    this._handleHelper(event, 'toggle');
  }

  _handleClick(event) {
    const {target} = event;
    const parent = target.closest('.wc-dropdown');
    const wasShown = parent.classList.contains('show');
    parent.classList.toggle('show');
    
    // Apply positioning for mobile or non-supported browsers
    if (!wasShown) {
      const dropdownContent = this.querySelector('.dropdown-content');
      const button = this.querySelector('.dropbtn');
      if (dropdownContent && button) {
        // Use requestAnimationFrame to ensure DOM has updated
        requestAnimationFrame(() => {
          this._positionDropdown(dropdownContent, button);
          this._isOpen = true;
        });
      }
    } else {
      this._isOpen = false;
    }
  }

  _handleWindowClick(event) {
    const {target} = event;
    if (target.matches('.dropbtn') || target.matches('.search')) return;
    const haltElt = target.closest('.halt-event');
    if (haltElt) return;
    const parts = this.querySelectorAll('.wc-dropdown');
    parts.forEach(p => {
      p.classList.remove('show');
      this._isOpen = false;
    });
  }

  _handleInput(event) {
    const {target} = event;
    const filter = target.value.toLowerCase();
    const parts = this.querySelectorAll('.dropdown-content > *:not(.component)');
    parts.forEach(p => {
      if (p.textContent.toLowerCase().includes(filter)) {
        p.style.display = "block";
      } else {
        p.style.display = "none";
      }
    });
  }

  _updateDropdownClass(newValue) {
    const dropdown = this.querySelector('.dropdown');
    if (!dropdown) return;
    
    // Remove all classes except 'dropdown'
    dropdown.className = 'dropdown';
    
    // Add new classes if provided
    if (newValue) {
      dropdown.classList.add(...newValue.split(' ').filter(c => c));
    }
  }

  _detectMobile() {
    // Check for mobile device based on viewport width and touch capability
    return window.innerWidth <= 768 || 'ontouchstart' in window;
  }

  _checkAnchorPositioningSupport() {
    // CSS anchor positioning needs BOTH anchor-name and position-area. Chromium 125–128 shipped
    // anchor-name with the older inset-area name, so checking anchor-name alone skipped the JS
    // fallback there and the menu was never placed (it sat on top of its button).
    return CSS.supports('anchor-name', '--test') && CSS.supports('position-area', 'bottom');
  }

  _positionDropdown(dropdownContent, button) {
    // Even when CSS Anchor Positioning handles placement, cap maxHeight
    // so dynamic content can't push the dropdown past the viewport edge.
    if (!this._detectMobile() && this._checkAnchorPositioningSupport()) {
      if (!this.getAttribute('dropdown-height')) {
        const buttonRect = button.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const dropdownRect = dropdownContent.getBoundingClientRect();
        const opensUpward = dropdownRect.top < buttonRect.top;
        const available = opensUpward
          ? (buttonRect.top - 10)
          : (viewportHeight - dropdownRect.top - 10);
        if (available > 0) {
          dropdownContent.style.maxHeight = `${available}px`;
          dropdownContent.style.overflowY = 'auto';
        }
      }
      return; // Let CSS handle the rest of positioning
    }

    // Get button and viewport dimensions
    const buttonRect = button.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    // Calculate available space
    const spaceBelow = viewportHeight - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    // Reset inline styles for fresh calculation
    dropdownContent.style.position = 'fixed';
    dropdownContent.style.width = 'auto';
    dropdownContent.style.maxWidth = '';
    dropdownContent.style.left = '';
    dropdownContent.style.right = '';
    dropdownContent.style.top = '';
    dropdownContent.style.bottom = '';
    
    // Temporarily show to get dimensions
    const originalDisplay = dropdownContent.style.display;
    dropdownContent.style.display = 'block';
    const dropdownRect = dropdownContent.getBoundingClientRect();
    const dropdownWidth = Math.min(dropdownRect.width, viewportWidth - 20); // Leave 10px margin on each side
    const dropdownHeight = dropdownRect.height;
    dropdownContent.style.display = originalDisplay;
    
    // Set max width for mobile
    if (this._detectMobile()) {
      dropdownContent.style.maxWidth = `${Math.min(dropdownWidth, viewportWidth - 20)}px`;
    }
    
    // Determine vertical position
    let top = buttonRect.bottom;
    if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
      // Position above if more space
      top = buttonRect.top - dropdownHeight;
    }
    
    // Determine horizontal position
    let left = buttonRect.left;
    
    // Check if dropdown would overflow right edge
    if (left + dropdownWidth > viewportWidth - 10) {
      // Align to right edge of button or viewport
      left = Math.max(10, Math.min(buttonRect.right - dropdownWidth, viewportWidth - dropdownWidth - 10));
    }
    
    // Check if dropdown would overflow left edge
    if (left < 10) {
      left = 10;
    }
    
    // Apply calculated position
    dropdownContent.style.position = 'fixed';
    dropdownContent.style.left = `${left}px`;
    dropdownContent.style.top = `${top}px`;
    dropdownContent.style.width = `${dropdownWidth}px`;
    
    // Always cap at available viewport space so dynamic content (accordion
    // expand, htmx swap, etc.) can't push the dropdown past the screen edge.
    // Skip if dropdown-height is explicitly set (forced height with its own overflow).
    if (!this.getAttribute('dropdown-height')) {
      const opensUpward = top < buttonRect.top;
      const available = opensUpward
        ? (buttonRect.top - 10)
        : (viewportHeight - top - 10);
      dropdownContent.style.maxHeight = `${available}px`;
      dropdownContent.style.overflowY = 'auto';
    }
  }

  _repositionOnScroll() {
    const dropdownContent = this.querySelector('.dropdown-content');
    const button = this.querySelector('.dropbtn');
    
    if (dropdownContent && button && dropdownContent.style.display === 'block') {
      this._positionDropdown(dropdownContent, button);
    }
  }

  async _applyStyle() {
    const style = `
      wc-dropdown {
        /* display: contents; */
      }

      .wc-dropdown {
        display: flex;
        flex-direction: row;
      }

      /* Dropdown Button */
      .wc-dropdown .dropbtn {
        background-color: var(--button-bg-color);
        color: var(--button-color);
        padding: 16px;
        font-size: 16px;
        border: none;
        border-radius: 0;
      }
      .wc-dropdown .dropbtn.grid-round {
        background-color: transparent;
        padding: 4px;
      }
      .wc-dropdown .dropbtn.avatar {
        padding: 6px;
        border-radius: 50%;
        font-size: 0.825rem;
      }

      /* The container <div> - needed to position the dropdown content */
      .wc-dropdown .dropdown {
      }

      /* Dropdown Content (Hidden by Default) */
      .wc-dropdown .dropdown-content {
        display: none;
        position: absolute;
        background-color: var(--wc-dropdown-bg, var(--button-hover-bg-color));
        color: var(--wc-dropdown-color, inherit);
        border: var(--wc-dropdown-border, none);
        border-radius: var(--wc-dropdown-radius, 0);
        min-width: var(--wc-dropdown-min-width, 160px);
        max-width: var(--wc-dropdown-max-width, 250px);
        box-shadow: 0px 8px 16px 0px rgba(0,0,0,0.2);
        z-index: 1;
      }
      .wc-dropdown .dropdown-content:where([style*="max-height"]) { overflow-y: auto; }

      /* menu-style="surface": the ribbon/menu look (opt-in; the default look is unchanged) */
      .wc-dropdown.menu-surface .dropdown-content {
        --wc-dropdown-bg: var(--surface-2);
        --wc-dropdown-color: var(--text-1);
        --wc-dropdown-border: 1px solid var(--surface-4);
        --wc-dropdown-radius: 8px;
        --wc-dropdown-min-width: 300px;
        --wc-dropdown-max-width: min(480px, calc(100vw - 16px));
        --wc-dropdown-item-hover: var(--surface-3);
        max-height: var(--wc-dropdown-max-height, 70vh);
        overflow-y: auto;
        padding: 4px;
        box-shadow: 0 10px 30px color-mix(in srgb, var(--text-1) 22%, transparent);
      }
      .wc-dropdown.menu-surface .dropdown-content a { color: var(--text-1); border-radius: 6px; }

      /* Rich menu items (opt-in classes): icon, then label + one-line muted description */
      .wc-dropdown .dropdown-content .wc-menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 10px;
      }
      .wc-menu-item-icon { flex: none; width: 1.25rem; display: inline-flex; justify-content: center; }
      .wc-menu-item-text { display: flex; flex-direction: column; min-width: 0; flex: 1 1 auto; }
      .wc-menu-item-label { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .wc-menu-item-desc {
        font-size: 0.85em;
        color: var(--text-2, inherit);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .wc-dropdown .dropdown-content .wc-menu-item.is-checked {
        background-color: color-mix(in srgb, var(--primary-bg-color) 14%, transparent);
      }

      .wc-dropdown .search {
        width: 100%;
        box-sizing: border-box;
        font-size: 12px;
        padding: 14px 20px 12px 35px;
        border-radius: 0;
      }
      .wc-dropdown .dropdown-content svg.search-svg {
        position: absolute;
        left: 8px;
        top: 20px;
        transform: translateY(-50%);
        width: 20px;
        height: 20px;
        stroke: var(--component-color);
        pointer-events: none;
      }

      /* Links inside the dropdown */
      /* .wc-dropdown .dropdown-content .wc-input, */
      .wc-dropdown .dropdown-content a {
        color: var(--component-color);
        padding: 12px 16px;
        text-decoration: none;
        display: block;
      }

      /* Change color of dropdown links on hover */
      /* .wc-dropdown .dropdown-content .wc-input:hover, */
      .wc-dropdown .dropdown-content a:hover {
        background-color: var(--wc-dropdown-item-hover, var(--component-border-color));
      }

      /* Show the dropdown menu on hover */
      .wc-dropdown:hover:not(.click):not(.search) .dropdown .dropdown-content {
        display: block;
      }
      .wc-dropdown.show .dropdown .dropdown-content {
        display: block;
      }

      /* Change the background color of the dropdown button when the dropdown content is shown */
      .wc-dropdown:hover:not(.click):not(.search) .dropdown .dropbtn {
        background-color: var(--button-hover-bg-color);
      }
      .wc-dropdown.show .dropdown .dropbtn {
        background-color: var(--button-hover-bg-color);
      }

      @position-try --bottom-left {
        position-area: bottom span-left;
      }
      @position-try --bottom-right {
        position-area: bottom span-right;
      }
      @position-try --top-left {
        position-area: top span-left;
      }
      @position-try --top-right {
        position-area: top span-right;
      }
      @position-try --right {
        position-area: right;
      }
      @position-try --left {
        position-area: left;
      }
      
      /* Mobile-specific styles */
      @media (max-width: 768px) {
        .wc-dropdown .dropdown-content {
          max-width: calc(100vw - 20px) !important;
        }
      }
      
      /* Fallback for browsers without (complete) anchor positioning */
      @supports not ((anchor-name: --test) and (position-area: bottom)) {
        .wc-dropdown .dropdown-content {
          position: fixed !important;
        }
      }
    `.trim();
    await this.loadStyle('wc-dropdown-style', style);
  }

  _wireEvents() {
    super._wireEvents();
    this._unWireEvents();
    if (this.clickModes.includes(this.mode)) {
      document.body.addEventListener('wcdropdownopen', this._onOpen);
      document.body.addEventListener('wcdropdownclose', this._onClose);
      document.body.addEventListener('wcdropdowntoggle', this._onToggle);
      this.querySelector('.dropbtn')?.addEventListener('click', this._onClick);
      window.addEventListener('click', this._onWindowClick);
      this.querySelector('.search')?.addEventListener('input', this._onInput);
    }
    this.componentElement.addEventListener('keydown', this._onKeydown);
    
    // Add scroll and resize listeners for mobile positioning
    this._boundReposition = this._repositionOnScroll.bind(this);
    window.addEventListener('scroll', this._boundReposition, { passive: true });
    window.addEventListener('resize', this._boundReposition, { passive: true });
  }

  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener('wcdropdownopen', this._onOpen);
    document.body.removeEventListener('wcdropdownclose', this._onClose);
    document.body.removeEventListener('wcdropdowntoggle', this._onToggle);
    this.querySelector('.dropbtn')?.removeEventListener('click', this._onClick);
    window.removeEventListener('click', this._onWindowClick);
    this.querySelector('.search')?.removeEventListener('input', this._onInput);
    this.componentElement?.removeEventListener('keydown', this._onKeydown);
    
    // Remove scroll and resize listeners
    if (this._boundReposition) {
      window.removeEventListener('scroll', this._boundReposition);
      window.removeEventListener('resize', this._boundReposition);
      this._boundReposition = null;
    }
  }

}

customElements.define('wc-dropdown', WcDropdown);
