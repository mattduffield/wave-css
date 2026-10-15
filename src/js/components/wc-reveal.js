/**
 *
 *  Name: wc-reveal
 *  Usage:
 *    <wc-reveal label="Adjust size, alignment & lines">
 *      <div class="line-row">
 *        <wc-input name="size" type="number" lbl-label="Size"></wc-input>
 *        <select name="align"><option>left</option><option>center</option></select>
 *      </div>
 *      <div class="field">
 *        <wc-select name="lines" lbl-label="Decorative lines">...</wc-select>
 *      </div>
 *    </wc-reveal>
 *
 *    <!-- Rich summary instead of a label attribute -->
 *    <wc-reveal open>
 *      <span slot="summary"><wc-fa-icon name="sliders"></wc-fa-icon> Advanced</span>
 *      ...live form controls...
 *    </wc-reveal>
 *
 *    <!-- Accordion-style: opening one closes the others in the same group -->
 *    <wc-reveal label="Shipping" data-group="checkout">...</wc-reveal>
 *    <wc-reveal label="Billing" data-group="checkout">...</wc-reveal>
 *
 *  A single animated collapsible that hosts arbitrary light-DOM content. Unlike
 *  wc-accordion (which rebuilds sections from <option>/items HTML strings), the
 *  host's existing child nodes are MOVED (appendChild — never innerHTML/clone) into
 *  the panel, so form state, `name`s, htmx and hyperscript bindings all survive.
 *  The summary comes from the `label` attribute or a child marked [slot="summary"]
 *  (or [data-summary]); every other child becomes the collapsible body. Children
 *  appended after render (htmx beforeend, JS) are moved into the panel too.
 *
 *  Height animates with the grid-template-rows 0fr → 1fr technique, so the panel
 *  tracks its true auto height (e.g. an inner select revealing sub-controls) with no
 *  JS remeasuring. Once fully open the panel stops clipping so inner dropdowns can
 *  overflow it. Honors prefers-reduced-motion; `no-animate` opts out. A required but
 *  invalid control inside a closed panel opens it, so native validation can focus it.
 *
 *  Attributes:
 *    label       - summary text (ignored when a [slot="summary"] child exists)
 *    open        - expanded (reflected; toggled by the header)
 *    disabled    - header can't be toggled
 *    no-animate  - no height/caret transition
 *    data-group  - reveals sharing a group behave accordion-style
 *
 *  Events (bubbling, detail { open }) — notifications, past tense:
 *    wcrevealopened, wcrevealclosed, wcrevealtoggled
 *    (legacy aliases: wc:reveal:open, wc:reveal:close, wc:reveal:toggle)
 *  The present-tense names below are inbound EventHub COMMANDS, not notifications.
 *
 *  API:
 *    el.open = true | false;  el.toggle();
 *    wc.EventHub.broadcast('wcrevealopen', '#myReveal')
 *    wc.EventHub.broadcast('wcrevealclose', ['wc-reveal[data-group="checkout"]'])
 *    wc.EventHub.broadcast('wcrevealtoggle', '#myReveal')
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-reveal')) {
  // State classes this component puts on its own host; never forwarded to the
  // inner container by the base class's `class` handling.
  const STATE_CLASSES = ['contents', 'wc-reveal-open', 'wc-reveal-closed'];

  class WcReveal extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'label', 'open', 'disabled', 'no-animate'];
    }

    constructor() {
      super();
      this._rendered = false;
      this._isOpen = false;
      this._summaryEl = null;
      this._observer = null;
      this._settleTimer = null;
      this._onHeaderClick = this._onHeaderClick.bind(this);
      this._onInvalid = this._onInvalid.bind(this);
      this._onTransitionEnd = this._onTransitionEnd.bind(this);
      this._onOpenCmd = (e) => this._handleCommand(e, 'open');
      this._onCloseCmd = (e) => this._handleCommand(e, 'close');
      this._onToggleCmd = (e) => this._handleCommand(e, 'toggle');

      const compEl = this.querySelector(':scope > .wc-reveal');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-reveal');
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

    get open() {
      return this.hasAttribute('open');
    }

    set open(value) {
      this.toggleAttribute('open', !!value);
    }

    toggle() {
      this.open = !this.open;
    }

    getInnerContainer() {
      return this.querySelector(':scope > .wc-reveal .wc-reveal-content') || this;
    }

    getDesignerHTML() {
      // Rendered DOM wraps the declared children; return them unwrapped.
      const parts = [];
      if (this._summaryEl) parts.push(this._summaryEl.outerHTML);
      const content = this.getInnerContainer();
      if (content !== this) {
        Array.from(content.childNodes).forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) parts.push(node.outerHTML);
          else if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) parts.push(node.textContent.trim());
        });
      }
      return parts.join('\n');
    }

    _handleAttributeChange(attrName, newValue, oldValue) {
      if (attrName === 'label') {
        this._renderLabel();
      } else if (attrName === 'open') {
        this._applyOpen(newValue !== null);
      } else if (attrName === 'disabled') {
        if (this._header) this._header.disabled = newValue !== null;
      } else if (attrName === 'no-animate') {
        // Styled off the host attribute; nothing to do.
      } else if (attrName === 'id') {
        // Keep the id on the host only (header/body ids derive from it at render).
      } else if (attrName === 'class') {
        const cls = (newValue || '').split(' ').filter(c => c && !STATE_CLASSES.includes(c)).join(' ');
        if (cls) super._handleAttributeChange(attrName, cls, oldValue);
      } else {
        super._handleAttributeChange(attrName, newValue, oldValue);
      }
    }

    _render() {
      super._render();

      if (!this._header) {
        // Reuse already-rendered markup (re-connect / htmx swap of rendered HTML).
        this._header = this.componentElement.querySelector(':scope > .wc-reveal-header');
        this._body = this.componentElement.querySelector(':scope > .wc-reveal-body');
        this._content = this._body?.querySelector('.wc-reveal-content');
        this._labelEl = this._header?.querySelector('.wc-reveal-label');
        this._summaryEl = this._labelEl?.querySelector(':scope > [slot="summary"], :scope > [data-summary]') || null;
      }
      if (!this._header || !this._body || !this._content || !this._labelEl) {
        this._createInnerElement();
      }

      this._adoptChildren();
      this._renderLabel();
      this._header.disabled = this.hasAttribute('disabled');

      this._isOpen = this.hasAttribute('open');
      this._syncOpenState(this._isOpen);
      this._setSettled(this._isOpen);
      this._rendered = true;

      if (typeof htmx !== 'undefined') {
        htmx.process(this);
      }
    }

    _createInnerElement() {
      this.componentElement.innerHTML = '';
      const baseId = this.id || `wc-reveal-${this.wcId}`;
      const headerId = `${baseId}-header`;
      const bodyId = `${baseId}-body`;

      const header = document.createElement('button');
      header.type = 'button'; // Never submit an enclosing form
      header.classList.add('wc-reveal-header');
      header.id = headerId;
      header.setAttribute('aria-controls', bodyId);
      header.setAttribute('aria-expanded', 'false');

      const label = document.createElement('span');
      label.classList.add('wc-reveal-label');
      header.appendChild(label);

      const caret = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      caret.setAttribute('class', 'wc-reveal-caret');
      caret.setAttribute('viewBox', '0 0 16 16');
      caret.setAttribute('aria-hidden', 'true');
      caret.setAttribute('focusable', 'false');
      caret.innerHTML = '<path d="M3.5 6l4.5 4.5L12.5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>';
      header.appendChild(caret);

      const body = document.createElement('div');
      body.classList.add('wc-reveal-body');
      body.id = bodyId;
      body.setAttribute('role', 'region');
      body.setAttribute('aria-labelledby', headerId);

      const inner = document.createElement('div');
      inner.classList.add('wc-reveal-inner');
      const content = document.createElement('div');
      content.classList.add('wc-reveal-content', 'px-3', 'py-2');
      inner.appendChild(content);
      body.appendChild(inner);

      this.componentElement.appendChild(header);
      this.componentElement.appendChild(body);

      this._header = header;
      this._labelEl = label;
      this._body = body;
      this._content = content;
    }

    // Move the host's own child nodes (everything but the .wc-reveal container) into
    // the panel — appendChild only, so live form state and bindings are preserved.
    _adoptChildren() {
      const strays = Array.from(this.childNodes).filter(n => n !== this.componentElement);
      strays.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE && node.matches('[slot="summary"], [data-summary]')) {
          if (this._summaryEl && this._summaryEl !== node) this._summaryEl.remove();
          this._summaryEl = node;
          this._labelEl.textContent = '';
          this._labelEl.appendChild(node);
        } else if (node.nodeType === Node.TEXT_NODE && !node.textContent.trim()) {
          node.remove();
        } else {
          this._content.appendChild(node);
        }
      });
    }

    _renderLabel() {
      if (!this._labelEl || this._summaryEl) return;
      this._labelEl.textContent = this.getAttribute('label') || '';
    }

    _applyOpen(open) {
      if (!this._rendered || open === this._isOpen) return;
      this._isOpen = open;
      this._syncOpenState(open);
      this._animateSettle(open);

      const opts = { bubbles: true, composed: true, detail: { open } };
      if (open) this._emitEvent('wcrevealopened', 'wc:reveal:open', opts);
      else this._emitEvent('wcrevealclosed', 'wc:reveal:close', opts);
      this._emitEvent('wcrevealtoggled', 'wc:reveal:toggle', opts);

      if (open) this._closeGroupSiblings();
    }

    _syncOpenState(open) {
      this.classList.toggle('wc-reveal-open', open);
      this.classList.toggle('wc-reveal-closed', !open);
      this._header.setAttribute('aria-expanded', String(open));
      // Collapsed content is out of the tab order / a11y tree, but still submits.
      this._body.toggleAttribute('inert', !open);
    }

    // While animating the panel clips its content; once fully open it stops clipping
    // so inner dropdowns/popovers can extend past the panel.
    _animateSettle(open) {
      clearTimeout(this._settleTimer);
      if (!open) {
        this._setSettled(false);
        return;
      }
      const duration = parseFloat(getComputedStyle(this._body).transitionDuration) || 0;
      if (duration === 0) {
        this._setSettled(true);
      } else {
        // transitionend is the primary signal; the timer covers an interrupted transition.
        this._settleTimer = setTimeout(() => this._setSettled(this._isOpen), duration * 1000 + 100);
      }
    }

    _setSettled(settled) {
      this._body?.classList.toggle('wc-reveal-settled', settled);
    }

    _onTransitionEnd(e) {
      if (e.target !== this._body || e.propertyName !== 'grid-template-rows') return;
      clearTimeout(this._settleTimer);
      this._setSettled(this._isOpen);
    }

    _onHeaderClick() {
      if (this.hasAttribute('disabled')) return;
      this.toggle();
    }

    // A control inside a closed panel failed native validation: reveal it so the
    // browser can focus it (it can't focus a control inside an inert region).
    _onInvalid(e) {
      if (!this._isOpen && this._content?.contains(e.target)) {
        this.open = true;
      }
    }

    _closeGroupSiblings() {
      const group = this.dataset.group;
      if (!group) return;
      const selector = `wc-reveal[data-group="${CSS.escape(group)}"]:not([data-wc-id="${this.wcId}"])`;
      if (window.wc?.EventHub) {
        window.wc.EventHub.broadcast('wcrevealclose', selector);
      } else {
        document.body.dispatchEvent(new CustomEvent('wcrevealclose', { detail: { selector } }));
      }
    }

    _handleCommand(event, mode) {
      // EventHub.broadcast dispatches the same event on window.parent's body too,
      // which is this body at top level — handle each event once (toggle would undo).
      if (event === this._lastCommand) return;
      this._lastCommand = event;
      const selector = event.detail?.selector;
      if (!selector) return;
      let targeted = false;
      if (typeof selector === 'string' || Array.isArray(selector)) {
        try {
          targeted = this.matches(Array.isArray(selector) ? selector.join(',') : selector);
        } catch (err) {
          targeted = false;
        }
      } else {
        targeted = selector === this;
      }
      if (!targeted) return;
      if (mode === 'open') this.open = true;
      else if (mode === 'close') this.open = false;
      else this.toggle();
    }

    _applyStyle() {
      const style = `
        wc-reveal {
          display: contents;
        }

        @layer wc.usage {
          .wc-reveal {
            display: flex;
            flex-direction: column;
            border: 1px solid var(--component-border-color);
            border-radius: var(--wc-reveal-radius, 0.5rem);
            background-color: var(--component-bg-color);
            color: var(--component-color, var(--text-1));
          }

          .wc-reveal-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.5rem;
            width: 100%;
            margin: 0;
            padding: 0.625rem 0.75rem;
            border: none;
            border-radius: inherit;
            background: transparent;
            color: inherit;
            font: inherit;
            font-weight: 600;
            text-align: left;
            cursor: pointer;
          }

          .wc-reveal-header:hover:not(:disabled) {
            background-color: var(--wc-reveal-hover-bg, var(--surface-3));
          }

          .wc-reveal-header:focus-visible {
            outline: 2px solid var(--primary-bg-color);
            outline-offset: -2px;
          }

          .wc-reveal-header:disabled {
            cursor: not-allowed;
            opacity: 0.6;
          }

          .wc-reveal-label {
            flex: 1 1 auto;
            min-width: 0;
          }

          /* Unsized icons in a rich summary match the text (an explicit size wins inline). */
          .wc-reveal-label svg {
            width: 1em;
            height: 1em;
            vertical-align: -0.125em;
          }

          .wc-reveal-caret {
            flex: 0 0 auto;
            width: 1rem;
            height: 1rem;
            color: var(--wc-reveal-caret-color, currentColor);
            transition: transform 0.25s ease;
          }

          wc-reveal.wc-reveal-open .wc-reveal-caret {
            transform: rotate(180deg);
          }

          .wc-reveal-body {
            display: grid;
            grid-template-rows: 0fr;
            transition: grid-template-rows 0.25s ease;
          }

          /* Collapsed content is clipped by the 0fr row and made unreachable by
             [inert]; no visibility toggle, since Wave's inputs transition 'all' and
             would stay hidden (unfocusable) for a moment after opening. */
          wc-reveal.wc-reveal-open .wc-reveal-body {
            grid-template-rows: 1fr;
          }

          .wc-reveal-inner {
            min-height: 0;
            overflow: hidden;
          }

          .wc-reveal-body.wc-reveal-settled .wc-reveal-inner {
            overflow: visible;
          }

          wc-reveal.wc-reveal-open .wc-reveal-content {
            border-top: 1px solid var(--component-border-color);
          }

          wc-reveal[no-animate] .wc-reveal-body,
          wc-reveal[no-animate] .wc-reveal-caret {
            transition: none;
          }

          @media (prefers-reduced-motion: reduce) {
            .wc-reveal-body,
            .wc-reveal-caret {
              transition: none;
            }
          }
        }
      `.trim();
      this.loadStyle('wc-reveal-style', style);
    }

    _wireEvents() {
      super._wireEvents();
      this._header?.addEventListener('click', this._onHeaderClick);
      this._body?.addEventListener('transitionend', this._onTransitionEnd);
      // `invalid` doesn't bubble — listen in the capture phase.
      this.addEventListener('invalid', this._onInvalid, true);

      document.body.addEventListener('wcrevealopen', this._onOpenCmd);
      document.body.addEventListener('wcrevealclose', this._onCloseCmd);
      document.body.addEventListener('wcrevealtoggle', this._onToggleCmd);

      // Children added after render (htmx beforeend, JS appendChild) join the panel.
      if (!this._observer) {
        this._observer = new MutationObserver(() => {
          if (this._content) this._adoptChildren();
        });
      }
      this._observer.observe(this, { childList: true });
    }

    _unWireEvents() {
      super._unWireEvents();
      this._header?.removeEventListener('click', this._onHeaderClick);
      this._body?.removeEventListener('transitionend', this._onTransitionEnd);
      this.removeEventListener('invalid', this._onInvalid, true);

      document.body.removeEventListener('wcrevealopen', this._onOpenCmd);
      document.body.removeEventListener('wcrevealclose', this._onCloseCmd);
      document.body.removeEventListener('wcrevealtoggle', this._onToggleCmd);

      this._observer?.disconnect();
      clearTimeout(this._settleTimer);
    }
  }

  customElements.define('wc-reveal', WcReveal);
}
