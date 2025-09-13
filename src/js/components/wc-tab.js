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
    // console.log('ctor:wc-tab');
  }

  async connectedCallback() {
    super.connectedCallback();

    this._applyStyle();
    this._wireEvents();
    // console.log('connectedCallback:wc-tab');
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
    }

    setTimeout(() => {
      const hashParts = location.hash.slice(1).split('+');
      hashParts.forEach(part => {
        const btn = this.querySelector(`button[data-label="${decodeURI(part)}"]`);
        btn?.click();  
      });
    }, 200);

    // console.log('_render:wc-tab');
  }

  _createInnerElement() {
    const tabNav = document.createElement('div');
    tabNav.classList.add('tab-nav');
    const tabBody = document.createElement('div');
    tabBody.classList.add('tab-body');
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
    event.stopPropagation();
    event.preventDefault();
    const {target} = event;
    const ce = target.closest('.wc-tab');
    let parts = ce.querySelectorAll('.active');
    parts.forEach(p => {
      const parent = p.closest('wc-tab');
      if (parent == this) {
        p.classList.remove('active')
      }
    });

    target.classList.add('active');
    const label = target.textContent;
    const contents = this.querySelector(`.wc-tab-item[label='${label}']`);
    contents.classList.add('active');
    const payload = { detail: { label }};
    const custom = new CustomEvent('tabchange', payload);
    contents.dispatchEvent(custom);
    location.hash = this._buildActiveTabStringFromRoot(target);
  }

  _buildActiveTabStringFromRoot(startElement) {
    // Helper function to find the root-most wc-tab
    function findRootMostTab(element) {
        let current = element.closest('wc-tab');
        let root = current;

        while (current) {
            const parentTab = current.parentElement?.closest('wc-tab');
            if (!parentTab) {
                root = current;
                break;
            }
            current = parentTab;
        }

        return root;
    }

    // Recursive function to traverse wc-tab components and collect active buttons
    function traverseTabs(tab) {
        let result = [];

        const tabNav = tab.querySelector(':scope > .wc-tab > .tab-nav');
        if (tabNav) {
            // Find all buttons with the 'active' class in this tab
            const activeButtons = Array.from(tabNav.querySelectorAll(':scope > button.active'));
            for (const button of activeButtons) {
                result.push(button.textContent.trim());
            }
        }

        // Find all nested wc-tab components directly inside this tab
        const nestedTabs = Array.from(tab.querySelectorAll(':scope > .wc-tab > .tab-body > wc-tab-item > .wc-tab-item.active > wc-tab'));
        for (const nestedTab of nestedTabs) {
            result = result.concat(traverseTabs(nestedTab));
        }

        return result;
    }

    // Start by finding the root-most wc-tab
    const rootTab = findRootMostTab(startElement);
    if (!rootTab) {
        return ''; // Return an empty string if no wc-tab is found
    }

    // Traverse from the root-most tab and join the results with '+'
    const activeTabString = traverseTabs(rootTab).join('+');
    return activeTabString;
  }

  _applyStyle() {
    const style = `
      wc-tab {
        display: contents;
      }
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
      }
      wc-tab[vertical] .wc-tab .tab-nav {
        flex-direction: column;
        overflow: initial;
        border-right: none;
      }
      wc-tab .wc-tab .tab-nav .tab-link {
        background-color: transparent;
        border: none;
        border-bottom: 1px solid var(--card-bg-color);
        border-radius: 0;
        outline: none;
        cursor: pointer;
        padding: 10px 16px;
        user-select: none;
        transition: 0.3s;
      }
      wc-tab .wc-tab .tab-nav .tab-link.active,
      wc-tab .wc-tab .tab-nav .tab-link:hover {
        border-top-left-radius: .5rem;
        border-top-right-radius: .5rem;
        border-bottom: 1px solid var(--card-bg-color);
        background-color: var(--card-bg-color);
      }

      wc-tab .wc-tab .tab-body {
        display: flex;
        flex-direction: column;
        flex: 1 1 0%;
        min-height: 0;
        background-color: var(--card-bg-color);
      }
      wc-tab[vertical] .wc-tab .tab-body {
        border-top: 1px solid var(--card-border-color);
      }
      wc-tab .wc-tab .tab-body wc-tab-item .wc-tab-item {
        display: none;
      }
      wc-tab[animate] .wc-tab .tab-body wc-tab-item .wc-tab-item {
        animation: tab-fade 1s;
      }
      wc-tab .wc-tab .tab-body wc-tab-item .wc-tab-item.active {
        display: flex;
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
