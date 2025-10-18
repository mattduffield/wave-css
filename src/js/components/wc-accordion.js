/**
 * 
 *  Name: wc-accordion
 *  Usage:
 *    <wc-accordion id="accordion"
 *      items='[{"label": "Section 1", "content": "Lorem ipsum...", "selected": true}, {"label": "Section 2", "content": "Lorem ipsum...", "selected": false}]'
 *    ></wc-accordion>
 *    <wc-accordion class="mb-4">
 *      <option value="Section 1" selected>
 *        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
 *      </option>
 *      <option value="Section 2">
 *        Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
 *      </option>
 *    </wc-accordion>
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-accordion:open', ['[data-wc-id="0982-a544-98da-b3da"]'], '.accordion-header:nth-of-type(1)')
 *    wc.EventHub.broadcast('wc-accordion:close', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(1)'])
 *    wc.EventHub.broadcast('wc-accordion:toggle', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(2)'])
 */


import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-accordion')) {
  class WcAccordion extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'items', 'allow-many'];
    }

    constructor() {
      super();
      this._items = [];
      const compEl = this.querySelector('.wc-accordion');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-accordion');
        this.appendChild(this.componentElement);      
      }
      // console.log('ctor:wc-accordion');
    }

    async connectedCallback() {
      super.connectedCallback();

      this._applyStyle();
      this._wireEvents();
      // console.log('connectedCallback:wc-accordion', this._items);
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    _handleAttributeChange(attrName, newValue) {    
      if (attrName === 'items') {
        if (typeof newValue === 'string') {
          this._items = JSON.parse(newValue);
        }
        this.removeAttribute('items');
      } else if (attrName === 'allow-many') {
        // Do nothing...
      } else {
        super._handleAttributeChange(attrName, newValue);  
      }
    }

    _render() {
      super._render();
      const innerParts = this.querySelectorAll('.wc-accordion > *');
      if (innerParts.length > 0) {
        this.componentElement.innerHTML = '';
        innerParts.forEach(p => this.componentElement.appendChild(p));
      } else {
        this._moveDeclarativeOptions();
        this.componentElement.innerHTML = '';

        this._items.forEach(item => {
          const header = this._createHeader(item.label, item.selected);
          this.componentElement.appendChild(header);
          const panel = this._createPanel(item.content);
          this.componentElement.appendChild(panel);
        });
      }

      this._setActive();

      if (typeof htmx !== 'undefined') {
        htmx.process(this);
      }
      // console.log('_render:wc-accordion');
    }

    _createHeader(label, selected) {
      const allowMany = this.hasAttribute('allow-many');
      const el = document.createElement('button');
      el.type = 'button'; // Prevent form submission
      el.classList.add('accordion-header');
      if (selected) {
        el.classList.add('accordion-active');
      }
      if (allowMany) {
        el.setAttribute('_', `on click
          toggle .accordion-active on me
          set panel to me.nextElementSibling
          if panel.style.maxHeight then
            set panel.style.maxHeight to null
          else
            set panel.style.maxHeight to panel.scrollHeight + 'px'
          end
        `);
      } else {
        el.setAttribute('_', `on click
          set hdrs to .accordion-header in my parentElement
          repeat for x in hdrs
            if x is not me then
              remove .accordion-active from x
              set panel to x.nextElementSibling
              set panel.style.maxHeight to null
            end
          end
          toggle .accordion-active on me
          set panel to me.nextElementSibling
          if panel.style.maxHeight then
            set panel.style.maxHeight to null
          else
            set panel.style.maxHeight to panel.scrollHeight + 'px'
          end
        `);      
      }
      el.textContent = label;
      return el;
    }

    _createPanel(content) {
      const el = document.createElement('div');
      el.classList.add('accordion-panel');
      const p = document.createElement('p');
      p.innerHTML = content;
      el.appendChild(p);
      return el;
    }

    _moveDeclarativeOptions() {
      const options = this.querySelectorAll('option');
      if (options.length > 0) {
        this._items = [];
      }
      options.forEach(option => {
        const item = {
          label: option.value,
          content: option.innerHTML.trim(),
          selected: option.hasAttribute('selected')
        };
        this._items.push(item);
      });
      Array.from(options).forEach(option => option.remove());
    }

    _setActive() {
      setTimeout(() => {
        const anchors = this.querySelectorAll('.wc-accordion .accordion-header.accordion-active');
        anchors.forEach(anchor => {
          const panel = anchor.nextElementSibling;
          panel.style.maxHeight = panel.scrollHeight + "px";
        });
      }, 50);
    }

    _applyStyle() {
      const style = `
        wc-accordion {
          display: contents;
        }

        .wc-accordion .accordion-header {
          background-color: var(--button-bg-color);
          color: var(--button-color);
          cursor: pointer;
          padding: 18px;
          width: 100%;
          border: none;
          border-radius: 0;
          text-align: left;
          outline: none;
          font-size: 15px;
          transition: 0.4s;
        }

        .wc-accordion .accordion-active,
        .wc-accordion .accordion-header:hover {
          background-color: var(--button-hover-bg-color);
          color: var(--button-hover-color);
        }

        .wc-accordion .accordion-header:after {
          content: '+';
          color: var(--primary-color);
          font-weight: bold;
          float: right;
          margin-left: 5px;
          font-size: 18px;
          line-height: 1;
          text-align: center;
          width: 20px;
          height: 20px;
        }

        .wc-accordion .accordion-active:after {
          content: '-';
          color: var(--primary-color);
          font-size: 20px;
        }

        .wc-accordion .accordion-panel {
          padding: 0 18px;
          background-color: var(--component-bg-color);
          color: var(--component-color);
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.2s ease-out;
        }
      `.trim();
      this.loadStyle('wc-accordion-style', style);
    }

    _handleHelper(event, mode='open') {
      const {detail} = event;
      const {selector, subSelector} = detail;
      const headerSelector = subSelector || '.accordion-header';
      const isArray = Array.isArray(selector);
      if (typeof selector === 'string' || isArray) {
        const tgts = document.querySelectorAll(selector);
        tgts.forEach(tgt => {
          if (tgt === this) {
            const btn = tgt?.querySelector(headerSelector);
            if (mode === 'open') {
              if (btn?.classList.contains('accordion-active')) {
                // Do nothing...
              } else {
                btn?.click();
              }
            } else if (mode === 'close') {
              if (!btn?.classList.contains('accordion-active')) {
                // Do nothing...
              } else {
                btn?.click();
              }
            } else if (mode === 'toggle') {
              btn?.click();
            }
          }
        });
      } else {
        const btn = selector?.querySelector(headerSelector);
        btn?.click();
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

    _wireEvents() {
      super._wireEvents();

      document.body.addEventListener('wc-accordion:open', this._handleOpen.bind(this));
      document.body.addEventListener('wc-accordion:close', this._handleClose.bind(this));
      document.body.addEventListener('wc-accordion:toggle', this._handleToggle.bind(this));
    }

    _unWireEvents() {
      super._unWireEvents();
      document.body.removeEventListener('wc-accordion:open', this._handleOpen.bind(this));
      document.body.removeEventListener('wc-accordion:close', this._handleClose.bind(this));
      document.body.removeEventListener('wc-accordion:toggle', this._handleToggle.bind(this));
    }

  }

  customElements.define('wc-accordion', WcAccordion);
}