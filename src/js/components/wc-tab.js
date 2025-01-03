/**
 * 
 *  Name: wc-tab
 *  Usage:
 *  <wc-tab class="p-4" animate>
 *    <wc-tab-item class="active" label="London">
 *      <div class="col-1 gap-2 pt-2 pb-10 px-10">
 *        <h3>London</h3>
 *        <p>
 *          Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
 *        </p>
 *      </div>
 *    </wc-tab-item>
 *    <wc-tab-item label="New York">
 *      <div class="col-1 gap-2 pt-2 pb-10 px-10">
 *        <h3>New York</h3>
 *        <p>
 *          Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
 *        </p>
 *      </div>
 *    </wc-tab-item>
 *    <wc-tab-item label="Miami">
 *      <div class="col-1 gap-2 pt-2 pb-10 px-10">
 *        <h3>Miami</h3>
 *        <p>
 *          Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
 *        </p>
 *      </div>
 *    </wc-tab-item>
 *  </wc-tab>
 * 
 *  <wc-tab class="p-4 h-64" animate vertical>
 *    <wc-tab-item label="London">
 *      <div class="col-1 gap-2 pt-2 pb-10 px-10">
 *        <h3>London</h3>
 *        <p>
 *          Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
 *        </p>
 *      </div>
 *    </wc-tab-item>
 *    <wc-tab-item class="active" label="New York">
 *      <div class="col-1 gap-2 pt-2 pb-10 px-10">
 *        <h3>New York</h3>
 *        <p>
 *          Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
 *        </p>
 *      </div>
 *    </wc-tab-item>
 *    <wc-tab-item label="Miami">
 *      <div class="col-1 gap-2 pt-2 pb-10 px-10">
 *        <h3>Miami</h3>
 *        <p>
 *          Lorem ipsum dolor sit amet, illum definitiones no quo, maluisset concludaturque et eum, altera fabulas ut quo. Atqui causae gloriatur ius te, id agam omnis evertitur eum. Affert laboramus repudiandae nec et. Inciderint efficiantur his ad. Eum no molestiae voluptatibus.
 *        </p>
 *      </div>
 *    </wc-tab-item>
 *  </wc-tab>
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-tab:click', ['[data-wc-id="b2d9-5bf2-e24c-6391"]'], '.tab-link:nth-of-type(2)')
 *    wc.EventHub.broadcast('wc-tab:click', ['[data-wc-id="b2d9-5bf2-e24c-6391"]'], '.tab-link:nth-of-type(3)')
 *    wc.EventHub.broadcast('wc-tab:click', ['[data-wc-id="b2d9-5bf2-e24c-6391"]'], '.tab-link:nth-of-type(1)')
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcTab extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'animate', 'vertical'];
  }

  constructor() {
    super();
    this.childComponentSelector = 'wc-tab-item';
    const compEl = this.querySelector('.wc-tab');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-tab');
      this.appendChild(this.componentElement);      
    }
    console.log('ctor:wc-tab');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    this._wireEvents();
    console.log('connectedCallback:wc-tab');
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  _handleAttributeChange(attrName, newValue) {    
    if (attrName === 'animate') {
      // Do nothing...
    } else if (attrName === 'vertical') {
      // Do nothing...
    } else {
      super._handleAttributeChange(attrName, newValue);  
    }
  }

  _render() {
    super._render();
    const innerEl = this.querySelector('.wc-tab > *');
    if (innerEl) {
      const btns = this.querySelectorAll('.tab-link');
      btns.forEach(btn => btn.addEventListener('click', this._handleClick.bind(this)));      
    } else {
      this.componentElement.innerHTML = '';
      this._createInnerElement();
    }

    if (typeof htmx !== 'undefined') {
      htmx.process(this);

      // // Process HTMX for nested tabs
      // const nestedTabs = this.querySelectorAll('wc-tab');
      // nestedTabs.forEach(tab => htmx.process(tab));
    }

    // setTimeout(() => {
    //   const hashParts = location.hash.slice(1).split('+');
    //   hashParts.forEach(part => {
    //     const btn = this.querySelector(`button[data-label="${part}"]`);
    //     btn?.click();  
    //   });
    // }, 100);

    // // Render nested tabs
    // const nestedTabs = this.querySelectorAll('wc-tab');
    // nestedTabs.forEach(tab => tab._render());

    console.log('_render:wc-tab');
  }

  _createInnerElement() {
    const tabNav = document.createElement('div');
    tabNav.classList.add('tab-nav');
    const tabBody = document.createElement('div');
    tabBody.classList.add('tab-body');
    // const parts = this.querySelectorAll('wc-tab > *:not(.wc-tab)');
    const parts = Array.from(this.children).filter(p => !p.matches('wc-tab') && !p.matches('.wc-tab')); // Exclude nested wc-tab elements

    parts.forEach((p, idx) => {
      const tabItem = p.querySelector('.wc-tab-item');
      const btn = document.createElement('button');
      btn.type = "button";
      btn.classList.add('tab-link');
      btn.addEventListener('click', this._handleClick.bind(this));
      const hasActive = tabItem?.classList.contains('active');
      if (hasActive) {
        btn.classList.add('active');
      }
      btn.textContent = p.getAttribute('label') || `Label ${idx + 1}`;
      btn.dataset.label = p.getAttribute('label') || `Label ${idx + 1}`;
      tabNav.appendChild(btn);
    });
    parts.forEach(p => {
      tabBody.appendChild(p);
    });
    this.componentElement.appendChild(tabNav);
    this.componentElement.appendChild(tabBody);
  }

  _handleHelper(event, mode='click') {
    const {detail} = event;
    const {selector, subSelector} = detail;
    const isArray = Array.isArray(selector);
    if (typeof selector === 'string' || isArray) {
      const tgts = document.querySelectorAll(selector);
      tgts.forEach(tgt => {
        if (tgt === this) {
          if (mode === 'click') {
            const elt = this.querySelector(subSelector);
            elt?.click();
          }
        }
      });
    } else {
      if (selector === this) {
        if (mode === 'click') {
          const elt = this.querySelector(subSelector);
          elt?.click();
        }
      }
    }
  }

  _handleOnClick(event) {
    this._handleHelper(event, 'click');
  }

  _handleClick(event) {
    console.log('event', event, 'target', event.target);
    event.stopPropagation();
    event.preventDefault();
    const {target} = event;
    let parts = this.componentElement.querySelectorAll('.active');
    parts.forEach(p => {
      const parent = p.closest('wc-tab');
      if (parent == this) {
        p.classList.remove('active')
      }
    });

    // let parts = document.querySelectorAll(`wc-tab[id="${this.id}"] > .wc-tab > .tab-nav > .active`)
    // parts.forEach(p => {
    //   p.classList.remove('active')
    // });
    
    // parts = document.querySelectorAll(`wc-tab[id="${this.id}"] > .wc-tab > .tab-body > wc-tab-item > .active`)
    // parts.forEach(p => {
    //   p.classList.remove('active')
    // });

    target.classList.add('active');
    const label = target.textContent;
    const contents = this.querySelector(`.wc-tab-item[label='${label}']`);
    contents.classList.add('active');
    const payload = { detail: { label }};
    const custom = new CustomEvent('tabchange', payload);
    contents.dispatchEvent(custom);
    // location.hash = target.dataset.label;    
    location.hash = this._buildTabPathFromInnermost(target);
  }

  /**
   * Recursively builds a '+' separated string of active tabs starting from the innermost clicked tab.
   *
   * @param {Element} element - The innermost clicked tab element (e.g., the button inside .tab-nav).
   * @returns {string} - A '+' separated string of active tab names up to the outermost.
   */
  _buildTabPathFromInnermost(element) {
    function traverseToOuter(tabElement) {
        if (!tabElement || !tabElement.closest('wc-tab')) {
            return '';
        }

        const currentTab = tabElement.closest('wc-tab');
        const tabNav = currentTab.querySelector('.tab-nav');

        let tabName = '';

        if (tabNav) {
            const activeButton = tabNav.querySelector('button.active');

            if (activeButton) {
                tabName = activeButton.textContent.trim();
            }
        }

        const outerPath = traverseToOuter(currentTab.parentElement.closest('wc-tab'));

        return outerPath ? `${outerPath}+${tabName}` : tabName;
    }

    return traverseToOuter(element);
  }

  _applyStyle() {
    const style = `
      wc-tab .wc-tab {
        position: relative;
        overflow: hidden;
      }
      wc-tab[vertical] .wc-tab {
        display: flex;
        flex-direction: row;
      }
      wc-tab .wc-tab .tab-nav {
        position: relative;
        display: flex;
        flex-direction: row;
        overflow: hidden;
        border: 1px solid var(--accent-bg-color);
        background-color: var(--secondary-bg-color);
      }
      wc-tab[vertical] .wc-tab .tab-nav {
        flex-direction: column;
        overflow: initial;
        border-right: none;
      }
      wc-tab .wc-tab .tab-nav .tab-link {
        background-color: var(--secondary-bg-color);
        border: none;
        border-radius: 0;
        outline: none;
        cursor: pointer;
        padding: 14px 16px;
        user-select: none;
        transition: 0.3s;
      }
      wc-tab .wc-tab .tab-nav .tab-link.active,
      wc-tab .wc-tab .tab-nav .tab-link:hover {
        background-color: var(--primary-bg-color);
      }

      wc-tab .wc-tab .tab-body {
        display: flex;
        flex-direction: column;
        flex: 1 1 0%;
        
        border: 1px solid var(--accent-bg-color);
        border-top: none;
      }
      wc-tab[vertical] .wc-tab .tab-body {
        border-top: 1px solid var(--accent-bg-color);
      }
      wc-tab .wc-tab .tab-body wc-tab-item .wc-tab-item {
        display: none;
      }
      wc-tab[animate] .wc-tab .tab-body wc-tab-item .wc-tab-item {
        animation: tab-fade 1s;
      }
      wc-tab .wc-tab .tab-body wc-tab-item .wc-tab-item.active {
        display: block;
      }

      /* Add styling for nested tabs */
      wc-tab .wc-tab .tab-body wc-tab {
        margin-top: 1rem;
      }
      
      @keyframes tab-fade {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
    `.trim();
    this.loadStyle('wc-tab-style', style);
  }

  _wireEvents() {
    super._wireEvents();

    document.body.addEventListener('wc-tab:click', this._handleOnClick.bind(this));
  }

  _unWireEvents() {
    super._unWireEvents();
    document.body.removeEventListener('wc-tab:click', this._handleOnClick.bind(this));
    const btns = this.querySelectorAll('.tab-link');
    btns.forEach(btn => btn.removeEventListener('click', this._handleClick.bind(this)));
  }
}

customElements.define('wc-tab', WcTab);
