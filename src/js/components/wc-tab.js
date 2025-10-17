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
 *  Contrast Control:
 *  <!-- Auto contrast (default - darkens nested tabs automatically) -->
 *  <wc-tab>
 *    <wc-tab-item label="Tab 1">
 *      <wc-tab><!-- Auto-darkens --></wc-tab>
 *    </wc-tab-item>
 *  </wc-tab>
 *
 *  <!-- Manual contrast override -->
 *  <wc-tab contrast="darker"><!-- Always darker, even at root level --></wc-tab>
 *  <wc-tab contrast="lighter"><!-- Lighter background --></wc-tab>
 *  <wc-tab contrast="none"><!-- Disable auto-darkening --></wc-tab>
 *
 *  Contrast values (from lightest to darkest):
 *  - none: No contrast adjustment, use base colors
 *  - light: Lighten by 10%
 *  - extra-light: Lighten by 15%
 *  - lighter: Lighten by 20%
 *  - ultra-light: Lighten by 25%
 *  - lightest: Lighten by 30%
 *  - super-light: Lighten by 35%
 *  - dark: Darken by 10%
 *  - darker: Darken by 15% (matches auto nesting level 1)
 *  - extra-dark: Darken by 20%
 *  - ultra-dark: Darken by 25%
 *  - darkest: Darken by 30% (matches auto nesting level 2)
 *  - super-dark: Darken by 35%
 *  - auto: Default, uses nesting level for automatic contrast
 *
 *  API:
 *    wc.EventHub.broadcast('wc-tab:click', ['[data-wc-id="b2d9-5bf2-e24c-6391"]'], '.tab-link:nth-of-type(2)')
 *    wc.EventHub.broadcast('wc-tab:click', ['[data-wc-id="b2d9-5bf2-e24c-6391"]'], '.tab-link:nth-of-type(3)')
 *    wc.EventHub.broadcast('wc-tab:click', ['[data-wc-id="b2d9-5bf2-e24c-6391"]'], '.tab-link:nth-of-type(1)')
 */


import { WcBaseComponent } from './wc-base-component.js';

class WcTab extends WcBaseComponent {
  static get observedAttributes() {
    return ['id', 'class', 'animate', 'vertical', 'contrast'];
  }

  constructor() {
    super();
    this.childComponentSelector = 'wc-tab-item';

    // Detect nesting level
    this.nestingLevel = 0;
    let parent = this.parentElement;
    while (parent) {
      const parentTab = parent.closest('wc-tab');
      if (parentTab) {
        this.nestingLevel++;
        parent = parentTab.parentElement;
      } else {
        break;
      }
    }

    const compEl = this.querySelector('.wc-tab');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-tab');
      this.appendChild(this.componentElement);
    }

    // Initialize contrast (manual override takes precedence over auto-detection)
    this._updateContrast(this.getAttribute('contrast'));

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
    } else if (attrName === 'contrast') {
      this._updateContrast(newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  _updateContrast(contrastValue) {
    // Remove any existing data-contrast or data-nesting-level attributes
    this.removeAttribute('data-contrast');
    this.removeAttribute('data-nesting-level');

    if (contrastValue && contrastValue !== 'auto') {
      // Manual contrast specified - use it regardless of nesting level
      this.setAttribute('data-contrast', contrastValue);
    } else {
      // Auto mode or no contrast specified - use nesting level detection
      if (this.nestingLevel > 0) {
        this.setAttribute('data-nesting-level', this.nestingLevel);
      }
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

    this._restoreTabsWhenReady();

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

  async _restoreTabsWhenReady() {
    try {
      // Wait for all wc- components within this tab to be ready
      // Find all elements whose tag name starts with 'wc-'
      const allElements = Array.from(this.querySelectorAll('*'));
      const allComponents = allElements.filter(el => el.tagName.toLowerCase().startsWith('wc-'));
      
      // Wait for each component to be connected
      await Promise.all(
        allComponents.map((component) => {
          return new Promise((resolve) => {
            // Check if component is already connected
            if (component._isConnected || component.isConnected) {
              resolve();
            } else {
              // Wait for the component to be connected
              const checkConnected = setInterval(() => {
                if (component._isConnected || component.isConnected) {
                  clearInterval(checkConnected);
                  resolve();
                }
              }, 50);
              
              // Timeout after 1 second for this component
              setTimeout(() => {
                clearInterval(checkConnected);
                resolve(); // Resolve anyway after timeout
              }, 500);
            }
          });
        })
      );
      
      // All components ready or timed out, add small delay then restore tabs
      setTimeout(() => {
        this._restoreTabsFromHash();
      }, 250);
    } catch (error) {
      console.warn('Error waiting for components:', error);
      // Fallback: restore tabs anyway
      this._restoreTabsFromHash();
    }
  }

  _restoreTabsFromHash() {
    const hashParts = location.hash.slice(1).split('+');
    hashParts.forEach(part => {
      const btn = this.querySelector(`button[data-label="${decodeURI(part)}"]`);
      btn?.click();  
    });
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

      /* Nested tab color variations - automatically adjust colors based on nesting level */
      /* Darken background for contrast without borders */
      wc-tab[data-nesting-level="1"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }
      wc-tab[data-nesting-level="1"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }
      wc-tab[data-nesting-level="1"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-nesting-level="1"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }

      wc-tab[data-nesting-level="2"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }
      wc-tab[data-nesting-level="2"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }
      wc-tab[data-nesting-level="2"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-nesting-level="2"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }

      /* Manual contrast control - overrides auto-nesting detection */
      /* none - no contrast adjustment, use base colors */
      wc-tab[data-contrast="none"] .wc-tab .tab-body {
        background-color: var(--card-bg-color);
      }
      wc-tab[data-contrast="none"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: var(--card-bg-color);
      }
      wc-tab[data-contrast="none"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="none"] .wc-tab .tab-nav .tab-link:hover {
        background-color: var(--card-bg-color);
        border-bottom-color: var(--card-bg-color);
      }

      /* light - lighten by 10% */
      wc-tab[data-contrast="light"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 90%, #fff 10%);
      }
      wc-tab[data-contrast="light"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 90%, #fff 10%);
      }
      wc-tab[data-contrast="light"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="light"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 90%, #fff 10%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 90%, #fff 10%);
      }

      /* extra-light - lighten by 15% */
      wc-tab[data-contrast="extra-light"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #fff 15%);
      }
      wc-tab[data-contrast="extra-light"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #fff 15%);
      }
      wc-tab[data-contrast="extra-light"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="extra-light"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #fff 15%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #fff 15%);
      }

      /* lighter - lighten by 20% */
      wc-tab[data-contrast="lighter"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 80%, #fff 20%);
      }
      wc-tab[data-contrast="lighter"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 80%, #fff 20%);
      }
      wc-tab[data-contrast="lighter"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="lighter"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 80%, #fff 20%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 80%, #fff 20%);
      }

      /* ultra-light - lighten by 25% */
      wc-tab[data-contrast="ultra-light"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 75%, #fff 25%);
      }
      wc-tab[data-contrast="ultra-light"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 75%, #fff 25%);
      }
      wc-tab[data-contrast="ultra-light"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="ultra-light"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 75%, #fff 25%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 75%, #fff 25%);
      }

      /* lightest - lighten by 30% */
      wc-tab[data-contrast="lightest"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #fff 30%);
      }
      wc-tab[data-contrast="lightest"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #fff 30%);
      }
      wc-tab[data-contrast="lightest"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="lightest"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #fff 30%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #fff 30%);
      }

      /* super-light - lighten by 35% */
      wc-tab[data-contrast="super-light"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 65%, #fff 35%);
      }
      wc-tab[data-contrast="super-light"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 65%, #fff 35%);
      }
      wc-tab[data-contrast="super-light"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="super-light"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 65%, #fff 35%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 65%, #fff 35%);
      }

      /* dark - darken by 10% */
      wc-tab[data-contrast="dark"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 90%, #000 10%);
      }
      wc-tab[data-contrast="dark"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 90%, #000 10%);
      }
      wc-tab[data-contrast="dark"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="dark"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 90%, #000 10%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 90%, #000 10%);
      }

      /* darker - darken by 15% (matches nesting level 1) */
      wc-tab[data-contrast="darker"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }
      wc-tab[data-contrast="darker"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }
      wc-tab[data-contrast="darker"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="darker"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 85%, #000 15%);
      }

      /* extra-dark - darken by 20% */
      wc-tab[data-contrast="extra-dark"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 80%, #000 20%);
      }
      wc-tab[data-contrast="extra-dark"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 80%, #000 20%);
      }
      wc-tab[data-contrast="extra-dark"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="extra-dark"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 80%, #000 20%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 80%, #000 20%);
      }

      /* ultra-dark - darken by 25% */
      wc-tab[data-contrast="ultra-dark"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 75%, #000 25%);
      }
      wc-tab[data-contrast="ultra-dark"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 75%, #000 25%);
      }
      wc-tab[data-contrast="ultra-dark"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="ultra-dark"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 75%, #000 25%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 75%, #000 25%);
      }

      /* darkest - darken by 30% (matches nesting level 2) */
      wc-tab[data-contrast="darkest"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }
      wc-tab[data-contrast="darkest"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }
      wc-tab[data-contrast="darkest"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="darkest"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 70%, #000 30%);
      }

      /* super-dark - darken by 35% */
      wc-tab[data-contrast="super-dark"] .wc-tab .tab-body {
        background-color: color-mix(in srgb, var(--card-bg-color) 65%, #000 35%);
      }
      wc-tab[data-contrast="super-dark"] .wc-tab .tab-nav .tab-link {
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 65%, #000 35%);
      }
      wc-tab[data-contrast="super-dark"] .wc-tab .tab-nav .tab-link.active,
      wc-tab[data-contrast="super-dark"] .wc-tab .tab-nav .tab-link:hover {
        background-color: color-mix(in srgb, var(--card-bg-color) 65%, #000 35%);
        border-bottom-color: color-mix(in srgb, var(--card-bg-color) 65%, #000 35%);
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
