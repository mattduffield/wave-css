/**
 * wc-live-designer — Visual page builder with live iframe canvas.
 *
 * Renders real Wave CSS components inside an iframe.
 * Users drag components from the palette, see them render with sample data,
 * and the output saves as standard _template_builder HTML with Pongo2 expressions.
 *
 * Usage:
 *   <wc-live-designer canvas-url="./live-designer-canvas.html" theme="theme-ocean dark"></wc-live-designer>
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-live-designer')) {
  class WcLiveDesigner extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'canvas-url', 'theme', 'api-base-url'];
    }

    static get is() {
      return 'wc-live-designer';
    }

    // Chrome DevTools-style device presets
    static DEVICE_PRESETS = [
      { name: 'Responsive', width: 0, height: 0, dpr: 1, type: 'responsive' },
      // Phones
      { name: 'iPhone SE', width: 375, height: 667, dpr: 2, type: 'phone' },
      { name: 'iPhone XR', width: 414, height: 896, dpr: 2, type: 'phone' },
      { name: 'iPhone 12 Pro', width: 390, height: 844, dpr: 3, type: 'phone' },
      { name: 'iPhone 14 Pro Max', width: 430, height: 932, dpr: 3, type: 'phone' },
      { name: 'iPhone 15 Pro', width: 393, height: 852, dpr: 3, type: 'phone' },
      { name: 'iPhone 16 Pro Max', width: 440, height: 956, dpr: 3, type: 'phone' },
      { name: 'Pixel 7', width: 412, height: 915, dpr: 2.625, type: 'phone' },
      { name: 'Pixel 9 Pro XL', width: 412, height: 924, dpr: 2.625, type: 'phone' },
      { name: 'Samsung Galaxy S8+', width: 360, height: 740, dpr: 4, type: 'phone' },
      { name: 'Samsung Galaxy S20 Ultra', width: 412, height: 915, dpr: 3.5, type: 'phone' },
      { name: 'Samsung Galaxy A51/71', width: 412, height: 914, dpr: 2.625, type: 'phone' },
      // Tablets
      { name: 'iPad Mini', width: 768, height: 1024, dpr: 2, type: 'tablet' },
      { name: 'iPad Air', width: 820, height: 1180, dpr: 2, type: 'tablet' },
      { name: 'iPad Pro', width: 1024, height: 1366, dpr: 2, type: 'tablet' },
      { name: 'Surface Pro 7', width: 912, height: 1368, dpr: 2, type: 'tablet' },
      { name: 'Surface Duo', width: 540, height: 720, dpr: 2.5, type: 'tablet' },
      { name: 'Galaxy Tab S4', width: 712, height: 1138, dpr: 2.25, type: 'tablet' },
      { name: 'Galaxy Z Fold 5', width: 344, height: 882, dpr: 3, type: 'tablet' },
      { name: 'Asus Zenbook Fold', width: 853, height: 1280, dpr: 2, type: 'tablet' },
      // Other
      { name: 'Nest Hub', width: 1024, height: 600, dpr: 2, type: 'other' },
      { name: 'Nest Hub Max', width: 1280, height: 800, dpr: 2, type: 'other' },
    ];

    // Edit-mode CSS — injected into iframe to make containers visible
    static EDIT_MODE_CSS = `
      /* === CRITICAL: Override display:contents on ALL designer elements === */
      /* The .contents class is added by WcBaseComponent to every component */
      [data-designer-id].contents {
        display: block !important;
      }

      /* === Container styling === */
      wc-form[data-designer-id],
      wc-div[data-designer-id],
      wc-tab[data-designer-id],
      wc-tab-item[data-designer-id],
      wc-accordion[data-designer-id],
      wc-dropdown[data-designer-id],
      wc-sidebar[data-designer-id],
      wc-sidenav[data-designer-id],
      wc-slideshow[data-designer-id],
      wc-split-button[data-designer-id],
      wc-flip-box[data-designer-id],
      wc-menu[data-designer-id],
      div[data-designer-id],
      fieldset[data-designer-id] {
        display: block !important;
        min-height: 120px !important;
        border: 1px dashed rgba(0, 120, 255, 0.3) !important;
        border-radius: 4px !important;
        padding: 28px 12px 12px 12px !important;
        position: relative !important;
        box-sizing: border-box !important;
        background: rgba(0, 120, 255, 0.02) !important;
      }

      /* Container inner elements (like <form class="wc-form">) also need block display */
      wc-form[data-designer-id] > .wc-form,
      wc-div[data-designer-id] > .wc-div {
        display: block !important;
        min-height: 80px !important;
      }

      /* Containers without designer children show a hint */
      wc-form[data-designer-id]:not(:has(> [data-designer-id])),
      wc-div[data-designer-id]:not(:has(> [data-designer-id])),
      wc-tab[data-designer-id]:not(:has(> [data-designer-id])),
      wc-tab-item[data-designer-id]:not(:has(> [data-designer-id])),
      div[data-designer-id]:not(:has(> [data-designer-id])),
      fieldset[data-designer-id]:not(:has(> [data-designer-id])) {
        min-height: 120px !important;
      }
      /* The inner form/div also gets the hint */
      wc-form[data-designer-id]:not(:has([data-designer-id])) > .wc-form::after,
      wc-div[data-designer-id]:not(:has([data-designer-id])) > .wc-div::after {
        content: 'Drop components here' !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        min-height: 60px !important;
        color: rgba(0, 120, 255, 0.3) !important;
        font-size: 12px !important;
        font-family: system-ui, sans-serif !important;
      }

      /* === Container type labels via ::before === */
      wc-form[data-designer-id]::before { content: "FORM" !important; }
      wc-div[data-designer-id]::before { content: "DIV" !important; }
      wc-tab[data-designer-id]::before { content: "TABS" !important; }
      wc-tab-item[data-designer-id]::before { content: "TAB ITEM" !important; }
      wc-accordion[data-designer-id]::before { content: "ACCORDION" !important; }
      wc-dropdown[data-designer-id]::before { content: "DROPDOWN" !important; }
      wc-sidebar[data-designer-id]::before { content: "SIDEBAR" !important; }
      wc-sidenav[data-designer-id]::before { content: "SIDENAV" !important; }
      wc-slideshow[data-designer-id]::before { content: "SLIDESHOW" !important; }
      wc-split-button[data-designer-id]::before { content: "SPLIT BUTTON" !important; }
      wc-flip-box[data-designer-id]::before { content: "FLIP BOX" !important; }
      wc-menu[data-designer-id]::before { content: "MENU" !important; }
      div[data-designer-id]::before { content: "DIV" !important; }
      fieldset[data-designer-id]::before { content: "FIELDSET" !important; }

      /* Label style for all containers */
      wc-form[data-designer-id]::before, wc-div[data-designer-id]::before,
      wc-tab[data-designer-id]::before, wc-tab-item[data-designer-id]::before,
      wc-accordion[data-designer-id]::before, wc-dropdown[data-designer-id]::before,
      wc-sidebar[data-designer-id]::before, wc-sidenav[data-designer-id]::before,
      wc-slideshow[data-designer-id]::before, wc-split-button[data-designer-id]::before,
      wc-flip-box[data-designer-id]::before, wc-menu[data-designer-id]::before,
      div[data-designer-id]::before, fieldset[data-designer-id]::before {
        position: absolute !important;
        top: 6px !important;
        left: 8px !important;
        font-size: 10px !important;
        font-weight: 600 !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        letter-spacing: 0.5px !important;
        text-transform: uppercase !important;
        color: rgba(0, 120, 255, 0.6) !important;
        background: #ffffff !important;
        padding: 1px 6px !important;
        line-height: 16px !important;
        border-radius: 2px !important;
        pointer-events: none !important;
        z-index: 1 !important;
      }

      /* === Non-container elements render normally === */
      wc-input[data-designer-id], wc-select[data-designer-id],
      wc-textarea[data-designer-id], wc-field[data-designer-id],
      wc-fa-icon[data-designer-id], wc-icon[data-designer-id],
      wc-image[data-designer-id], wc-loader[data-designer-id],
      wc-save-button[data-designer-id], wc-save-split-button[data-designer-id],
      wc-hotkey[data-designer-id], wc-code-mirror[data-designer-id],
      wc-tabulator[data-designer-id], wc-chart[data-designer-id],
      wc-chartjs[data-designer-id], wc-google-map[data-designer-id],
      wc-ai-bot[data-designer-id], wc-breadcrumb[data-designer-id],
      hr[data-designer-id] {
        display: revert !important;
        min-height: revert !important;
        border: revert !important;
        padding: revert !important;
        background: revert !important;
        position: relative !important;
      }
      wc-input[data-designer-id]::before, wc-select[data-designer-id]::before,
      wc-textarea[data-designer-id]::before, wc-field[data-designer-id]::before,
      wc-fa-icon[data-designer-id]::before, wc-icon[data-designer-id]::before,
      hr[data-designer-id]::before, wc-save-button[data-designer-id]::before,
      wc-save-split-button[data-designer-id]::before {
        display: none !important;
      }

      /* === Prevent form interaction at design time === */
      [data-designer-id] input,
      [data-designer-id] select,
      [data-designer-id] textarea,
      [data-designer-id] button {
        pointer-events: none !important;
      }
    `;

    // Component palette items
    static CONTAINERS = [
      { type: 'div', label: 'Div' },
      { type: 'fieldset', label: 'Fieldset' },
      { type: 'wc-form', label: 'Form' },
      { type: 'wc-tab', label: 'Tab Container' },
      { type: 'wc-tab-item', label: 'Tab Item' },
      { type: 'wc-accordion', label: 'Accordion' },
      { type: 'wc-dropdown', label: 'Dropdown' },
      { type: 'wc-flip-box', label: 'Flip Box' },
      { type: 'wc-menu', label: 'Menu' },
      { type: 'wc-sidebar', label: 'Sidebar' },
      { type: 'wc-sidenav', label: 'Sidenav' },
      { type: 'wc-slideshow', label: 'Slideshow' },
      { type: 'wc-split-button', label: 'Split Button' },
    ];

    static ELEMENTS = [
      // Form inputs
      { type: 'wc-input', label: 'Input' },
      { type: 'wc-input', label: 'Checkbox', defaults: { type: 'checkbox', 'toggle-switch': '' } },
      { type: 'wc-input', label: 'Email', defaults: { type: 'email' } },
      { type: 'wc-input', label: 'Phone', defaults: { type: 'tel' } },
      { type: 'wc-input', label: 'Date', defaults: { type: 'date' } },
      { type: 'wc-input', label: 'Number', defaults: { type: 'number' } },
      { type: 'wc-input', label: 'Currency', defaults: { type: 'currency' } },
      { type: 'wc-input', label: 'Password', defaults: { type: 'password' } },
      { type: 'wc-input', label: 'Radio', defaults: { type: 'radio', 'radio-group-class': 'row modern' } },
      { type: 'wc-input', label: 'Range', defaults: { type: 'range' } },
      { type: 'wc-select', label: 'Select' },
      { type: 'wc-textarea', label: 'Textarea' },
      // Display
      { type: 'wc-field', label: 'Field (display)' },
      { type: 'wc-fa-icon', label: 'FA Icon' },
      { type: 'wc-icon', label: 'Icon' },
      { type: 'wc-image', label: 'Image' },
      { type: 'wc-background-image', label: 'Background Image' },
      { type: 'wc-contact-card', label: 'Contact Card' },
      { type: 'wc-contact-chip', label: 'Contact Chip' },
      { type: 'wc-article-card', label: 'Article Card' },
      // Navigation
      { type: 'wc-breadcrumb', label: 'Breadcrumb' },
      { type: 'wc-breadcrumb-item', label: 'Breadcrumb Item' },
      { type: 'wc-dropdown-item', label: 'Dropdown Item' },
      { type: 'wc-slideshow-image', label: 'Slideshow Image' },
      { type: 'wc-accordion-option', label: 'Accordion Option' },
      { type: 'wc-timeline', label: 'Timeline' },
      { type: 'wc-timeline-option', label: 'Timeline Option' },
      // Buttons
      { type: 'wc-save-split-button', label: 'Save Split Button' },
      { type: 'wc-save-button', label: 'Save Button' },
      // Data
      { type: 'wc-tabulator', label: 'Tabulator' },
      { type: 'wc-tabulator-column', label: 'Tabulator Column' },
      { type: 'wc-chart', label: 'Chart' },
      { type: 'wc-chartjs', label: 'ChartJS' },
      // Code & editors
      { type: 'wc-code-mirror', label: 'Code Mirror' },
      // Maps & address
      { type: 'wc-google-map', label: 'Google Map' },
      { type: 'wc-google-address', label: 'Google Address' },
      // Skeletons & loading
      { type: 'wc-article-skeleton', label: 'Article Skeleton' },
      { type: 'wc-table-skeleton', label: 'Table Skeleton' },
      { type: 'wc-card-skeleton', label: 'Card Skeleton' },
      { type: 'wc-list-skeleton', label: 'List Skeleton' },
      { type: 'wc-loader', label: 'Loader' },
      { type: 'wc-busy-indicator', label: 'Busy Indicator' },
      // Utility
      { type: 'hr', label: 'Divider' },
      { type: 'wc-hotkey', label: 'Hotkey' },
      { type: 'wc-behavior', label: 'Behavior' },
      { type: 'wc-event-handler', label: 'Event Handler' },
      { type: 'wc-visibility-change', label: 'Visibility Change' },
      { type: 'wc-emoji', label: 'Emoji' },
      { type: 'wc-script', label: 'Script' },
      { type: 'wc-javascript', label: 'JavaScript' },
      // Specialized
      { type: 'wc-vin-decoder', label: 'VIN Decoder' },
      { type: 'wc-address-listener', label: 'Address Listener' },
      { type: 'wc-ai-bot', label: 'AI Bot' },
      { type: 'wc-theme-selector', label: 'Theme Selector' },
    ];

    constructor() {
      super();
      this._canvasReady = false;
      this._selectedComponent = null;
      this._sampleData = {};
      this._currentDevice = WcLiveDesigner.DEVICE_PRESETS[0]; // Responsive
      this._currentZoom = 'fit';
      this._rotated = false;

      this._handleMessage = this._handleMessage.bind(this);
      this._lastSourceHTML = '';
      this._lastEditedSourceHTML = '';
      this._sourceEditorReady = false;
    }

    async _render() {
      this.classList.add('contents');
      const canvasUrl = this.getAttribute('canvas-url') || './live-designer-canvas.html';
      const theme = this.getAttribute('theme') || 'theme-ocean dark';

      this.innerHTML = `
        <div class="wc-live-designer flex flex-col h-screen">
          <!-- Slim Toolbar -->
          <div class="ld-toolbar flex items-center gap-2 px-3 py-1" style="background: var(--surface-2); border-bottom: 1px solid var(--surface-5); min-height: 32px;">
            <button class="ld-settings-btn" title="Responsive Settings" style="background: var(--surface-3); border: 1px solid var(--surface-5); border-radius: 4px; padding: 2px 8px; cursor: pointer; color: var(--text-1); font-size: 11px; display: flex; align-items: center; gap: 4px;">
              <span style="font-size: 14px;">📱</span>
              <span class="ld-device-label">Responsive</span>
              <span class="ld-size-label" style="color: var(--text-6);"></span>
            </button>
            <select class="ld-zoom-select" style="background: var(--surface-3); color: var(--text-1); border: 1px solid var(--surface-5); border-radius: 4px; padding: 2px 8px; font-size: 11px;">
              <option value="fit">Fit</option>
              <option value="50">50%</option>
              <option value="75">75%</option>
              <option value="100" selected>100%</option>
              <option value="125">125%</option>
              <option value="150">150%</option>
            </select>
            <div style="flex: 1;"></div>
            <div class="ld-breakpoints flex items-center gap-1" style="font-size: 10px; color: var(--text-6);">
              <span class="ld-bp" data-width="640" style="padding: 1px 4px; border-radius: 2px; cursor: pointer; background: var(--surface-3);">sm</span>
              <span class="ld-bp" data-width="768" style="padding: 1px 4px; border-radius: 2px; cursor: pointer; background: var(--surface-3);">md</span>
              <span class="ld-bp" data-width="1024" style="padding: 1px 4px; border-radius: 2px; cursor: pointer; background: var(--surface-3);">lg</span>
              <span class="ld-bp" data-width="1280" style="padding: 1px 4px; border-radius: 2px; cursor: pointer; background: var(--surface-3);">xl</span>
              <span class="ld-bp" data-width="1536" style="padding: 1px 4px; border-radius: 2px; cursor: pointer; background: var(--surface-3);">2xl</span>
            </div>
          </div>

          <!-- Responsive Settings Dialog (hidden by default) -->
          <div class="ld-settings-dialog hidden" style="position: absolute; top: 36px; left: 8px; z-index: 100; background: var(--surface-2); border: 1px solid var(--surface-5); border-radius: 8px; padding: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.4); width: 320px; font-size: 12px;">
            <div style="font-weight: 600; margin-bottom: 8px; color: var(--text-2);">Responsive Settings</div>
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2">
                <label style="width: 60px; color: var(--text-5);">Device</label>
                <select class="ld-device-select flex-1" style="background: var(--surface-3); color: var(--text-1); border: 1px solid var(--surface-5); border-radius: 4px; padding: 4px 8px; font-size: 12px;">
                  ${this._buildDeviceOptions()}
                </select>
              </div>
              <div class="flex items-center gap-2">
                <label style="width: 60px; color: var(--text-5);">Size</label>
                <input class="ld-width-input" type="number" placeholder="W" style="width: 70px; background: var(--surface-3); color: var(--text-1); border: 1px solid var(--surface-5); border-radius: 4px; padding: 4px 6px; font-size: 12px; text-align: center;" />
                <span style="color: var(--text-6);">×</span>
                <input class="ld-height-input" type="number" placeholder="H" style="width: 70px; background: var(--surface-3); color: var(--text-1); border: 1px solid var(--surface-5); border-radius: 4px; padding: 4px 6px; font-size: 12px; text-align: center;" />
                <button class="ld-rotate-btn" title="Rotate" style="background: var(--surface-3); border: 1px solid var(--surface-5); border-radius: 4px; padding: 4px 8px; cursor: pointer; color: var(--text-1); font-size: 14px;">↻</button>
              </div>
            </div>
          </div>

          <!-- Main Content -->
          <div class="flex flex-row flex-1 min-h-0">
            <!-- Left Panel: Palette -->
            <div class="ld-palette flex flex-col" style="width: 260px; min-width: 200px; max-width: 400px; background: var(--surface-2); overflow: hidden;">
              <wc-tab class="flex flex-col flex-1 min-h-0 text-xs" animate tab-overflow="scroll">
                <wc-tab-item class="active" label="Containers">
                  <div class="ld-palette-tab-content">
                    <input class="ld-palette-search" type="search" placeholder="Filter..." />
                    <div class="ld-palette-scroll">
                      ${WcLiveDesigner.CONTAINERS.map(c => `
                        <div class="ld-palette-item" data-type="${c.type}" draggable="true">${c.label}</div>
                      `).join('')}
                    </div>
                  </div>
                </wc-tab-item>
                <wc-tab-item label="Elements">
                  <div class="ld-palette-tab-content">
                    <input class="ld-palette-search" type="search" placeholder="Filter..." />
                    <div class="ld-palette-scroll">
                      ${WcLiveDesigner.ELEMENTS.map(c => `
                        <div class="ld-palette-item" data-type="${c.type}" ${c.defaults ? `data-defaults='${JSON.stringify(c.defaults)}'` : ''} draggable="true">${c.label}</div>
                      `).join('')}
                    </div>
                  </div>
                </wc-tab-item>
                <wc-tab-item label="Fields">
                  <div class="ld-palette-tab-content">
                    <select class="ld-schema-select" style="width: 100%; margin-bottom: 4px;">
                      <option value="">Select a schema...</option>
                    </select>
                    <div class="ld-fields ld-palette-scroll"></div>
                  </div>
                </wc-tab-item>
                <wc-tab-item label="Layers">
                  <div class="ld-palette-tab-content">
                    <div class="ld-layer-tree ld-palette-scroll"></div>
                  </div>
                </wc-tab-item>
              </wc-tab>
            </div>

            <!-- Left Resize Handle -->
            <div class="ld-resize-handle" data-resize="left" title="Drag to resize">⋮</div>

            <!-- Center: Visual + Source tabs -->
            <div class="ld-canvas-area flex flex-col flex-1 overflow-hidden" style="background: var(--surface-1);">
              <wc-tab class="ld-center-tabs flex flex-col flex-1 min-h-0" animate>
                <wc-tab-item class="active" label="Visual">
                  <div class="ld-canvas-visual flex-1 flex items-center justify-start overflow-auto" style="height: 100%;">
                    <iframe class="ld-canvas-iframe" data-src="${canvasUrl}" style="border: none; box-shadow: 0 1px 8px rgba(0,0,0,0.15); margin: 8px; transition: width 0.3s, height 0.3s;"></iframe>
                  </div>
                </wc-tab-item>
                <wc-tab-item label="Source">
                  <div class="ld-source-panel flex flex-col flex-1 min-h-0" style="height: 100%;"></div>
                </wc-tab-item>
              </wc-tab>
            </div>

            <!-- Right Resize Handle -->
            <div class="ld-resize-handle" data-resize="right" title="Drag to resize">⋮</div>

            <!-- Right Panel: Properties -->
            <div class="ld-properties flex flex-col" style="width: 280px; min-width: 200px; max-width: 500px; background: var(--surface-2); overflow-y: auto;">
              <div>
                <div class="ld-props-empty p-4 text-center" style="color: var(--text-6); font-size: 12px;">
                  Select a component to edit its properties
                </div>
                <div class="ld-props-panel hidden flex flex-col gap-2 p-3" style="font-size: 12px;">
                  <div style="font-weight: 600; color: var(--text-2);" class="ld-props-type"></div>
                  <div class="ld-props-id" style="color: var(--text-6); font-size: 10px;"></div>
                  <hr style="border-color: var(--surface-5);" />
                  <div class="ld-props-fields flex flex-col gap-2"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Breadcrumb bar -->
          <div class="ld-breadcrumb" style="background: var(--surface-2); border-top: 1px solid var(--surface-5); padding: 4px 12px; font-size: 11px; font-family: system-ui, sans-serif; color: var(--text-6); min-height: 24px; display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
          </div>
        </div>
      `;

      this._applyStyle();
      this._wireEvents();

      // Defer iframe load until the component is visible — if it's inside a
      // hidden tab, the browser cancels the request.
      const iframe = this.querySelector('.ld-canvas-iframe');
      if (iframe) {
        const src = iframe.dataset.src;
        const loadIframe = () => {
          if (iframe.getAttribute('src') === src) return; // Already loaded
          iframe.src = src;
        };

        // Check if visible by walking up to see if any ancestor is hidden
        const isVisible = () => {
          let el = iframe;
          while (el) {
            const style = getComputedStyle(el);
            if (style.display === 'none') return false;
            el = el.parentElement;
          }
          return true;
        };

        if (isVisible()) {
          loadIframe();
        } else {
          // Listen for any tabchange event that might reveal this component
          const onTabChange = () => {
            setTimeout(() => {
              if (isVisible()) {
                document.removeEventListener('tabchange', onTabChange, true);
                loadIframe();
              }
            }, 50);
          };
          document.addEventListener('tabchange', onTabChange, true);
        }
      }

      // Set initial responsive mode
      this._applyDevice(this._currentDevice);
    }

    _buildDeviceOptions() {
      const groups = { responsive: [], phone: [], tablet: [], other: [] };
      for (const d of WcLiveDesigner.DEVICE_PRESETS) {
        groups[d.type].push(d);
      }

      let html = '';
      html += `<option value="0">Responsive</option>`;
      html += `<optgroup label="Phones">`;
      for (const d of groups.phone) {
        html += `<option value="${d.name}">${d.name} (${d.width}×${d.height})</option>`;
      }
      html += `</optgroup>`;
      html += `<optgroup label="Tablets">`;
      for (const d of groups.tablet) {
        html += `<option value="${d.name}">${d.name} (${d.width}×${d.height})</option>`;
      }
      html += `</optgroup>`;
      html += `<optgroup label="Other">`;
      for (const d of groups.other) {
        html += `<option value="${d.name}">${d.name} (${d.width}×${d.height})</option>`;
      }
      html += `</optgroup>`;
      return html;
    }

    _applyStyle() {
      const style = `
        wc-live-designer { display: contents; }
        .ld-palette-item {
          padding: 6px 10px; background: var(--surface-3); border-radius: 4px;
          cursor: grab; font-size: 12px; user-select: none;
        }
        .ld-palette-item:hover { background: var(--surface-4) !important; }
        .ld-palette-item:active { opacity: 0.6; }
        .ld-bp:hover { background: var(--surface-4) !important; color: var(--text-2) !important; }
        .ld-settings-btn:hover { background: var(--surface-4) !important; }
        .ld-canvas-dragover { outline: 2px dashed #3b82f6; outline-offset: -4px; background: rgba(59, 130, 246, 0.03) !important; }
        .ld-props-panel .ld-prop-row { display: flex; flex-direction: column; gap: 2px; }
        .ld-props-panel .ld-prop-row label { font-size: 11px; color: var(--text-5); font-weight: 500; }
        .ld-props-panel .ld-prop-row input,
        .ld-props-panel .ld-prop-row select,
        .ld-props-panel .ld-prop-row textarea {
          background: var(--surface-3); color: var(--text-1); border: 1px solid var(--surface-5);
          border-radius: 4px; padding: 4px 8px; font-size: 12px; font-family: inherit;
        }
        /* Palette tab content — flex column, search stays fixed, items scroll */
        .ld-palette-tab-content {
          display: flex; flex-direction: column;
          height: 100%; min-height: 0; overflow: hidden;
          padding: 4px; gap: 4px;
        }
        .ld-palette-search {
          flex-shrink: 0;
          padding: 4px 8px; font-size: 11px;
          background: var(--surface-3); color: var(--text-1);
          border: 1px solid var(--surface-5); border-radius: 4px;
        }
        .ld-palette-scroll {
          flex: 1; overflow-y: auto; min-height: 0;
          display: flex; flex-direction: column; gap: 1px; padding: 2px 0;
        }
        .ld-schema-select {
          flex-shrink: 0;
          background: var(--surface-3); color: var(--text-1);
          border: 1px solid var(--surface-5); border-radius: 4px;
          padding: 4px 8px; font-size: 11px;
        }

        /* Layer tree */
        .ld-layer-tree { font-size: 12px; }
        .ld-layer-node {
          display: flex; align-items: center; gap: 4px;
          padding: 4px 4px 4px calc(8px + var(--depth, 0) * 16px);
          cursor: pointer; border-radius: 3px; white-space: nowrap;
          color: var(--text-3); user-select: none;
        }
        .ld-layer-node:hover { background: var(--surface-3); }
        .ld-layer-node.active { background: rgba(59, 151, 227, 0.15); color: #3b97e3; }
        .ld-layer-node .ld-layer-icon { font-size: 10px; width: 14px; text-align: center; opacity: 0.6; }
        .ld-layer-node .ld-layer-type { font-weight: 500; }
        .ld-layer-node .ld-layer-scope { color: var(--text-6); font-size: 10px; }

        /* Breadcrumb */
        .ld-breadcrumb a { color: var(--text-5); text-decoration: none; cursor: pointer; }
        .ld-breadcrumb a:hover { color: #3b97e3; text-decoration: underline; }
        .ld-breadcrumb .ld-bc-current { color: #3b97e3; font-weight: 600; }
        .ld-breadcrumb .ld-bc-sep { color: var(--text-8); margin: 0 2px; }

        /* Drag resize handles */
        .ld-resize-handle {
          width: 8px;
          cursor: col-resize;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          user-select: none;
          color: var(--text-8);
          font-size: 14px;
          letter-spacing: -2px;
          transition: color 0.2s, background 0.2s;
        }
        .ld-resize-handle:hover {
          color: var(--text-4);
          background: var(--surface-4);
        }
        .ld-resize-handle:active {
          color: var(--text-2);
          background: var(--surface-5);
        }
      `;
      this.loadStyle('wc-live-designer-style', style);
    }

    _wireEvents() {
      // Listen for messages from iframe
      window.addEventListener('message', this._handleMessage);

      // Settings dialog toggle
      const settingsBtn = this.querySelector('.ld-settings-btn');
      const settingsDialog = this.querySelector('.ld-settings-dialog');
      settingsBtn?.addEventListener('click', () => {
        settingsDialog.classList.toggle('hidden');
      });
      // Close dialog when clicking outside
      document.addEventListener('click', (e) => {
        if (settingsDialog && !settingsDialog.classList.contains('hidden') &&
            !settingsDialog.contains(e.target) && !settingsBtn.contains(e.target)) {
          settingsDialog.classList.add('hidden');
        }
      });

      // Device dropdown (inside dialog)
      const deviceSelect = this.querySelector('.ld-device-select');
      deviceSelect?.addEventListener('change', (e) => {
        const preset = WcLiveDesigner.DEVICE_PRESETS.find(d => d.name === e.target.value) || WcLiveDesigner.DEVICE_PRESETS[0];
        this._rotated = false;
        this._currentDevice = preset;
        this._applyDevice(preset);
      });

      // Width/Height inputs (inside dialog)
      const widthInput = this.querySelector('.ld-width-input');
      const heightInput = this.querySelector('.ld-height-input');
      widthInput?.addEventListener('change', () => this._applyCustomSize());
      heightInput?.addEventListener('change', () => this._applyCustomSize());

      // Rotate button (inside dialog)
      this.querySelector('.ld-rotate-btn')?.addEventListener('click', () => {
        this._rotated = !this._rotated;
        const w = this.querySelector('.ld-width-input');
        const h = this.querySelector('.ld-height-input');
        const tmpW = w.value;
        w.value = h.value;
        h.value = tmpW;
        this._applyCustomSize();
      });

      // Zoom select (in toolbar)
      this.querySelector('.ld-zoom-select')?.addEventListener('change', (e) => {
        this._currentZoom = e.target.value;
        this._applyZoom();
      });

      // Breakpoint quick-select
      this.querySelectorAll('.ld-bp').forEach(bp => {
        bp.addEventListener('click', () => {
          const w = parseInt(bp.dataset.width);
          this.querySelector('.ld-device-select').value = '0'; // Responsive
          this.querySelector('.ld-width-input').value = w;
          this.querySelector('.ld-height-input').value = '';
          this._currentDevice = WcLiveDesigner.DEVICE_PRESETS[0];
          this._applyCustomSize();
          this._updateDeviceLabel('Responsive', `${w}px`);
        });
      });

      // Resize handles for left and right panels
      this.querySelectorAll('.ld-resize-handle').forEach(handle => {
        let startX, startWidth, targetPanel;
        const iframe = this.querySelector('.ld-canvas-iframe');

        handle.addEventListener('mousedown', (e) => {
          e.preventDefault();
          startX = e.clientX;
          const side = handle.dataset.resize;
          targetPanel = side === 'left'
            ? this.querySelector('.ld-palette')
            : this.querySelector('.ld-properties');
          startWidth = targetPanel.offsetWidth;

          // Disable iframe pointer events so it can't steal the mouse
          iframe.style.pointerEvents = 'none';
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';

          const onMouseMove = (e) => {
            const delta = e.clientX - startX;
            const newWidth = side === 'left' ? startWidth + delta : startWidth - delta;
            const min = parseInt(targetPanel.style.minWidth) || 160;
            const max = parseInt(targetPanel.style.maxWidth) || 500;
            targetPanel.style.width = Math.max(min, Math.min(max, newWidth)) + 'px';
          };

          const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            iframe.style.pointerEvents = '';
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
          };

          document.addEventListener('mousemove', onMouseMove);
          document.addEventListener('mouseup', onMouseUp);
        });
      });

      // Visual ↔ Source tab sync
      const centerArea = this.querySelector('.ld-canvas-area');
      centerArea?.addEventListener('tabchange', async (e) => {
        const label = e.detail?.label;
        if (label === 'Source') {
          // Clear selection and property panel when switching to Source
          this._selectedComponent = null;
          this._hidePropertyPanel();
          this._clearBreadcrumb();
          this._postToCanvas('clear-selection', {});
          await this._updateSourceView();
        } else if (label === 'Visual') {
          // Use the last tracked value from the editor's change event
          const editedHTML = this._lastEditedSourceHTML;
          if (editedHTML?.trim() && editedHTML.trim() !== this._lastSourceHTML?.trim()) {
            this._lastSourceHTML = editedHTML;
            await this.loadHTML(editedHTML);
          }
        }
      });

      // Palette search filters (one per tab)
      this.querySelectorAll('.ld-palette-search').forEach(search => {
        search.addEventListener('input', (e) => {
          const query = e.target.value.trim().toLowerCase();
          const panel = e.target.closest('wc-tab-item');
          if (!panel) return;
          panel.querySelectorAll('.ld-palette-item').forEach(item => {
            const text = item.textContent.trim().toLowerCase();
            item.style.display = (!query || text.includes(query)) ? '' : 'none';
          });
        });
      });

      // Schema selector
      const schemaSelect = this.querySelector('.ld-schema-select');
      if (schemaSelect) {
        this._loadSchemaList(schemaSelect);
        schemaSelect.addEventListener('change', (e) => {
          if (e.target.value) {
            this._loadSchemaFields(e.target.value);
          }
        });
      }

      // Palette drag start — disable iframe pointer events so parent gets drag/drop
      // Palette drag — create custom drag image and let iframe handle the drop
      this.querySelectorAll('.ld-palette-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
          const type = item.dataset.type;
          const defaults = item.dataset.defaults ? JSON.parse(item.dataset.defaults) : {};
          e.dataTransfer.setData('application/json', JSON.stringify({ type, defaults }));
          e.dataTransfer.effectAllowed = 'copy';

          // Create a custom drag image at document level (avoids clipping)
          const ghost = document.createElement('div');
          ghost.textContent = item.textContent;
          ghost.style.cssText = 'position:fixed;top:-100px;left:-100px;padding:6px 12px;background:#3b97e3;color:#fff;border-radius:4px;font-size:12px;font-family:system-ui,sans-serif;z-index:9999;pointer-events:none;';
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 0, 0);
          setTimeout(() => ghost.remove(), 0);

          // Keep iframe pointer-events ENABLED so it receives the drop
        });
      });

    }

    _unWireEvents() {
      window.removeEventListener('message', this._handleMessage);
    }

    disconnectedCallback() {
      this._unWireEvents();
    }

    // --- Responsive Controls ---

    _updateDeviceLabel(name, size) {
      const label = this.querySelector('.ld-device-label');
      const sizeLabel = this.querySelector('.ld-size-label');
      if (label) label.textContent = name;
      if (sizeLabel) sizeLabel.textContent = size ? `(${size})` : '';
    }

    _applyDevice(device) {
      const iframe = this.querySelector('.ld-canvas-iframe');
      const widthInput = this.querySelector('.ld-width-input');
      const heightInput = this.querySelector('.ld-height-input');

      if (device.type === 'responsive') {
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        widthInput.value = '';
        heightInput.value = '';
        widthInput.disabled = false;
        heightInput.disabled = false;
        this._updateDeviceLabel('Responsive', '');
      } else {
        const w = this._rotated ? device.height : device.width;
        const h = this._rotated ? device.width : device.height;
        widthInput.value = w;
        heightInput.value = h;
        widthInput.disabled = true;
        heightInput.disabled = true;
        iframe.style.width = w + 'px';
        iframe.style.height = h + 'px';
        this._updateDeviceLabel(device.name, `${w}×${h}`);
      }

      this._applyZoom();
    }

    _applyCustomSize() {
      const iframe = this.querySelector('.ld-canvas-iframe');
      const w = this.querySelector('.ld-width-input').value;
      const h = this.querySelector('.ld-height-input').value;

      iframe.style.width = w ? w + 'px' : '100%';
      iframe.style.height = h ? h + 'px' : '100%';
      this._applyZoom();
    }

    _applyZoom() {
      const iframe = this.querySelector('.ld-canvas-iframe');
      const canvasArea = this.querySelector('.ld-canvas-area');

      if (this._currentZoom === 'fit') {
        const areaRect = canvasArea.getBoundingClientRect();
        const iframeW = parseInt(iframe.style.width) || areaRect.width;
        const iframeH = parseInt(iframe.style.height) || areaRect.height;
        const scaleX = (areaRect.width - 32) / iframeW;
        const scaleY = (areaRect.height - 32) / iframeH;
        const scale = Math.min(scaleX, scaleY, 1);
        iframe.style.transform = `scale(${scale})`;
        iframe.style.transformOrigin = 'top center';
      } else {
        const scale = parseInt(this._currentZoom) / 100;
        iframe.style.transform = `scale(${scale})`;
        iframe.style.transformOrigin = 'top center';
      }
    }

    // --- Schema Loading ---

    _getApiBase() {
      return this.getAttribute('api-base-url') || '';
    }

    async _loadSchemaList(selectEl) {
      try {
        const response = await fetch(`${this._getApiBase()}/api/_schema_builder?size=100&page=1`);
        if (!response.ok) return;
        const data = await response.json();
        const schemas = (data.data || []).sort((a, b) =>
          (a.name || a.slug).localeCompare(b.name || b.slug)
        );
        for (const schema of schemas) {
          const opt = document.createElement('option');
          opt.value = schema.slug;
          opt.textContent = schema.name || schema.slug;
          selectEl.appendChild(opt);
        }
      } catch (err) {
        console.warn('[wc-live-designer] Could not load schemas:', err);
      }
    }

    async _loadSchemaFields(schemaSlug) {
      const fieldsContainer = this.querySelector('.ld-fields');
      if (!fieldsContainer) return;

      fieldsContainer.innerHTML = '<div style="color: var(--text-6); padding: 4px;">Loading...</div>';

      try {
        // Use the slug endpoint to get just the json_schema field
        const response = await fetch(`${this._getApiBase()}/api/_schema_builder/slug/${schemaSlug}/json_schema`);
        if (!response.ok) {
          fieldsContainer.innerHTML = '<div style="color: var(--text-6);">Failed to load schema</div>';
          return;
        }

        let responseData = await response.json();

        // Unwrap {result: "..."} wrapper if present
        let jsonSchema = responseData.result !== undefined ? responseData.result : responseData;

        // Parse if it's a string (may be double-encoded)
        while (typeof jsonSchema === 'string') {
          try { jsonSchema = JSON.parse(jsonSchema); } catch (e) { break; }
        }

        if (typeof jsonSchema === 'string') {
          fieldsContainer.innerHTML = '<div style="color: var(--text-6);">Invalid schema JSON</div>';
          return;
        }

        if (!jsonSchema || !jsonSchema.properties) {
          fieldsContainer.innerHTML = '<div style="color: var(--text-6);">No properties in schema</div>';
          return;
        }

        // Build draggable field items
        const required = new Set(jsonSchema.required || []);
        fieldsContainer.innerHTML = '';

        for (const [name, prop] of Object.entries(jsonSchema.properties)) {
          const item = document.createElement('div');
          item.className = 'ld-palette-item';
          item.draggable = true;
          item.dataset.type = this._inferComponentType(name, prop);
          item.dataset.defaults = JSON.stringify(this._inferDefaults(name, prop, required.has(name)));

          const typeLabel = prop.type || 'string';
          const reqLabel = required.has(name) ? ' *' : '';
          item.textContent = `${this._toProper(name)}${reqLabel}`;
          item.title = `${name}: ${typeLabel}`;

          // Wire drag — custom drag image, let iframe handle drop
          item.addEventListener('dragstart', (e) => {
            const type = item.dataset.type;
            const defaults = JSON.parse(item.dataset.defaults);
            e.dataTransfer.setData('application/json', JSON.stringify({ type, defaults }));
            e.dataTransfer.effectAllowed = 'copy';

            const ghost = document.createElement('div');
            ghost.textContent = item.textContent;
            ghost.style.cssText = 'position:fixed;top:-100px;left:-100px;padding:6px 12px;background:#3b97e3;color:#fff;border-radius:4px;font-size:12px;font-family:system-ui,sans-serif;z-index:9999;pointer-events:none;';
            document.body.appendChild(ghost);
            e.dataTransfer.setDragImage(ghost, 0, 0);
            setTimeout(() => ghost.remove(), 0);
          });

          fieldsContainer.appendChild(item);
        }

      } catch (err) {
        fieldsContainer.innerHTML = `<div style="color: var(--text-6);">Error: ${err.message}</div>`;
      }
    }

    _inferComponentType(name, prop) {
      // System fields
      if (['_id', 'created_by', 'created_date', 'modified_by', 'modified_date'].includes(name)) return 'wc-input';
      if (prop.type === 'boolean') return 'wc-input';
      if (prop.type === 'integer') return 'wc-input';
      if (prop.type === 'number') return 'wc-input';
      if (prop.type === 'array') return 'wc-select';
      if (prop.enum && prop.enum.length > 0) return 'wc-select';
      if (prop.format === 'email' || name.includes('email')) return 'wc-input';
      if (prop.format === 'date-time' || name.includes('date')) return 'wc-input';
      if (name.includes('phone') || name.includes('tel')) return 'wc-input';
      if (name.includes('description') || name.includes('notes') || name.includes('bio')) return 'wc-textarea';
      if (prop.type === 'object') return 'fieldset';
      return 'wc-input';
    }

    _inferDefaults(name, prop, isRequired) {
      const defaults = { name, 'lbl-label': this._toProper(name) };
      if (isRequired) defaults.required = '';

      if (prop.type === 'boolean') {
        defaults.type = 'checkbox';
        defaults['toggle-switch'] = '';
      } else if (prop.type === 'integer') {
        defaults.type = 'number';
      } else if (prop.type === 'number') {
        defaults.type = 'currency';
      } else if (prop.format === 'email' || name.includes('email')) {
        defaults.type = 'email';
      } else if (prop.format === 'date-time' || name.includes('date')) {
        defaults.type = 'date';
      } else if (name.includes('phone') || name.includes('tel')) {
        defaults.type = 'tel';
      } else if (prop.enum && prop.enum.length > 0) {
        // Build options: value as-is, display in title case (underscores → spaces)
        const options = prop.enum.map(v =>
          `<option value="${v}">${this._toProper(v)}</option>`
        ).join('\n          ');
        defaults.innerHTML = `<option value="">Choose...</option>\n          ${options}`;
        // Store enum values for property panel
        defaults['data-enum'] = prop.enum.join(',');
      } else if (prop.type === 'array' && prop.items?.type === 'string') {
        defaults.mode = 'chip';
        defaults.multiple = '';
        defaults['allow-dynamic'] = '';
      }

      // Auto-set scope
      defaults.scope = name;

      return defaults;
    }

    _toProper(name) {
      return name.replace(/_/g, ' ').replace(/\./g, ' ')
        .split(/\s+/)
        .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(' ');
    }

    // --- iframe Communication ---

    _postToCanvas(action, data = {}) {
      const iframe = this.querySelector('.ld-canvas-iframe');
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage({ source: 'live-designer', action, ...data }, '*');
      }
    }

    _handleMessage(e) {
      if (!e.data || e.data.source !== 'editor-bridge') return;
      const { action } = e.data;

      switch (action) {
        case 'canvasReady':
          this._canvasReady = true;
          const theme = this.getAttribute('theme') || 'theme-ocean dark';
          this._postToCanvas('setTheme', { theme });
          if (Object.keys(this._sampleData).length > 0) {
            this._postToCanvas('setSampleData', { data: this._sampleData });
          }
          break;

        case 'select':
          this._selectedComponent = {
            designerId: e.data.designerId,
            type: e.data.type,
            properties: e.data.properties
          };
          this._showPropertyPanel(e.data.type, e.data.properties, e.data.designerId);
          this._updateBreadcrumb(e.data.ancestors || [], e.data.designerId, e.data.type);
          // Highlight in layer tree
          this.querySelectorAll('.ld-layer-node.active').forEach(n => n.classList.remove('active'));
          const activeNode = this.querySelector(`.ld-layer-node[data-layer-id="${e.data.designerId}"]`);
          if (activeNode) activeNode.classList.add('active');
          break;

        case 'deselect':
          this._selectedComponent = null;
          this._hidePropertyPanel();
          this._clearBreadcrumb();
          this.querySelectorAll('.ld-layer-node.active').forEach(n => n.classList.remove('active'));
          break;

        case 'componentAdded':
        case 'componentRemoved':
          // Refresh layer tree
          this._updateLayerTree();
          break;

        case 'treeResponse':
          // Render the layer tree
          this._renderLayerTree(e.data.tree || []);
          // Also handle the getTree() promise callback
          if (this._treeCallback) {
            this._treeCallback(e.data.tree);
            this._treeCallback = null;
          }
          break;

        case 'htmlResponse':
          if (this._htmlCallback) {
            this._htmlCallback(e.data.html);
            this._htmlCallback = null;
          }
          break;
      }
    }

    // --- Source View ---

    async _updateSourceView() {
      try {
        // Wait for the Source tab to become visible — wc-tab propagates the
        // active class to the inner div asynchronously via attributeChangedCallback,
        // and CodeMirror needs a visible container to initialize properly.
        await new Promise(r => setTimeout(r, 50));

        const rawHTML = await this.getHTML();
        if (!rawHTML) return;
        const pongo2HTML = this.transformToPongo2(rawHTML);
        const formattedHTML = this._formatHTML(pongo2HTML);
        this._lastSourceHTML = formattedHTML;

        const panel = this.querySelector('.ld-source-panel');
        if (!panel) return;

        // Recreate editor each time — wc-code-mirror loses its editor instance
        // when the tab hides because _render/connectedCallback may re-trigger
        panel.innerHTML = `<wc-code-mirror class="ld-source-editor" name="ld-source" mode="htmlmixed" theme="monokai" line-numbers line-wrapping height="calc(100vh - 120px)" tab-size="2" value=""></wc-code-mirror>`;
        const cmEl = panel.querySelector('.ld-source-editor');

        const setEditorValue = () => {
          if (cmEl.editor) {
            cmEl.editor.setValue(formattedHTML);
            setTimeout(() => cmEl.editor?.refresh(), 50);
            // Track changes in the editor so we always have the latest value
            cmEl.editor.on('change', () => {
              this._lastEditedSourceHTML = cmEl.editor.getValue();
            });
          } else {
            setTimeout(setEditorValue, 100);
          }
        };
        setEditorValue();
      } catch (err) {
        console.error('[wc-live-designer] Error updating source view:', err);
      }
    }

    _formatHTML(html) {
      const tab = '  ';
      let indent = 0;
      let formatted = '';
      const inlineTags = new Set(['option', 'span', 'label', 'a', 'strong', 'em', 'b', 'i']);
      const maxLineLength = 100; // Break attributes to new lines if tag exceeds this length

      // Split on tag boundaries
      const tokens = html.replace(/>\s*</g, '>\n<').split('\n');

      for (let token of tokens) {
        token = token.trim();
        if (!token) continue;

        // Closing tag
        if (token.match(/^<\/\w/)) {
          indent = Math.max(0, indent - 1);
          formatted += tab.repeat(indent) + token + '\n';
        }
        // Self-closing tag
        else if (token.match(/\/>$/)) {
          formatted += this._formatTag(token, indent, tab, maxLineLength) + '\n';
        }
        // Opening tag
        else if (token.match(/^<\w/)) {
          const tagMatch = token.match(/^<(\w[\w-]*)/);
          const tagName = tagMatch ? tagMatch[1].toLowerCase() : '';

          // Inline tags with content + closing tag on same line (e.g. <option value="">Text</option>)
          // Output as-is with indentation — don't run through _formatTag which mangles text content
          if (tagName && token.includes(`</${tagName}>`)) {
            formatted += tab.repeat(indent) + token + '\n';
          } else {
            formatted += this._formatTag(token, indent, tab, maxLineLength) + '\n';
            if (tagName && !inlineTags.has(tagName)) {
              indent++;
            }
          }
        }
        // Text content
        else {
          formatted += tab.repeat(indent) + token + '\n';
        }
      }

      return formatted.trim();
    }

    _formatTag(tag, indent, tab, maxLineLength) {
      // Extract tag name and attributes
      const match = tag.match(/^(<\/?[\w-]+)([\s\S]*?)(\/?>)$/);
      if (!match) return tab.repeat(indent) + tag;

      const tagOpen = match[1];
      const attrStr = match[2].trim();
      const tagClose = match[3];

      if (!attrStr) return tab.repeat(indent) + tagOpen + tagClose;

      // Parse attributes
      const attrs = [];
      const attrRegex = /([\w][\w:.-]*)(?:="([^"]*)")?/g;
      let m;
      while ((m = attrRegex.exec(attrStr)) !== null) {
        attrs.push(m[2] !== undefined ? `${m[1]}="${m[2]}"` : m[1]);
      }

      // Try single line first
      const singleLine = tab.repeat(indent) + tagOpen + ' ' + attrs.join(' ') + tagClose;
      if (singleLine.length <= maxLineLength) {
        return singleLine;
      }

      // Multi-line: pack attributes into lines that fit within maxLineLength
      const contIndent = tab.repeat(indent + 2);
      const lines = [];
      let currentLine = tab.repeat(indent) + tagOpen;

      for (const attr of attrs) {
        const test = currentLine + ' ' + attr;
        if (test.length > maxLineLength && currentLine !== tab.repeat(indent) + tagOpen) {
          // Current line is full, start a new continuation line
          lines.push(currentLine);
          currentLine = contIndent + attr;
        } else {
          currentLine += ' ' + attr;
        }
      }
      lines.push(currentLine + tagClose);

      return lines.join('\n');
    }

    async _applySourceToCanvas() {
      // Read current value from wc-code-mirror using its value getter
      const cmEl = this.querySelector('.ld-source-editor');
      if (!cmEl) return;

      const html = cmEl.value; // Uses the getter: this.editor?.getValue()
      if (!html?.trim()) return;

      // Only rebuild if the source was actually changed
      if (html.trim() === this._lastSourceHTML?.trim()) {
        return; // No changes — skip rebuild
      }

      // Source was edited — update stored HTML and rebuild canvas
      this._lastSourceHTML = html;
      await this.loadHTML(html);
    }

    /**
     * Load HTML into the canvas — parses component tags and creates them.
     * Handles both raw HTML (from Source tab) and Pongo2 templates (from _template_builder).
     * Converts {{ Record.field }} expressions to data-scope + sample data.
     *
     * @param {string} html - HTML string with Wave CSS component tags
     */
    async loadHTML(html) {
      // Clear the canvas and wait for it to complete
      this._postToCanvas('clear', {});
      await new Promise(r => setTimeout(r, 300));

      // Parse HTML into DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
      const root = doc.body.firstElementChild;

      if (!root) return;

      // Walk the DOM tree and create components
      await this._loadChildren(root, null);
    }

    async _loadChildren(parentEl, parentDesignerId) {
      for (const child of parentEl.children) {
        const tag = child.tagName.toLowerCase();

        // Skip non-component elements (text nodes, labels, etc.)
        // Only process known Wave CSS components and HTML containers
        if (!this._isDesignerComponent(tag)) continue;

        // Extract properties from attributes
        const properties = {};
        for (const attr of child.attributes) {
          const name = attr.name;
          // Skip style and Wave CSS internal attributes
          if (name === 'style' || name === 'data-wc-id') continue;
          if (name === 'class') {
            const cls = attr.value.replace(/\bcontents\b/g, '').trim();
            if (cls) properties.css = cls;
            continue;
          }

          let value = attr.value;

          // Convert Pongo2 expressions to data-scope
          const pongo2Match = value.match(/\{\{\s*Record\.(\S+)\s*\}\}/);
          if (pongo2Match) {
            const fieldName = pongo2Match[1];
            properties.scope = fieldName;
            // Replace with sample data if available
            const sampleValue = this._getSampleValue(fieldName);
            if (sampleValue !== undefined && sampleValue !== '') {
              value = String(sampleValue);
            }
          }

          // Also check for floatformat filter: {{ Record.field|floatformat:2 }}
          const floatMatch = value.match(/\{\{\s*Record\.(\S+)\|floatformat:\d+\s*\}\}/);
          if (floatMatch) {
            properties.scope = floatMatch[1];
            const sampleValue = this._getSampleValue(floatMatch[1]);
            if (sampleValue !== undefined) value = String(sampleValue);
          }

          // Convert Pongo2 conditional checked: {% if Record.field %} checked {% endif %}
          if (name === 'checked' || value.includes('{% if Record.')) {
            // This is a boolean binding — skip the Pongo2, set scope
            const boolMatch = value.match(/Record\.(\S+)/);
            if (boolMatch) {
              properties.scope = boolMatch[1];
              const sampleValue = this._getSampleValue(boolMatch[1]);
              if (sampleValue) properties.checked = '';
            }
            continue;
          }

          // Skip Pongo2 template tags that aren't values
          if (value.includes('{%') || value.includes('{{')) continue;

          if (value === '') {
            properties[name] = '';
          } else {
            properties[name] = value;
          }
        }

        // Extract data-scope if explicitly set
        if (child.hasAttribute('data-scope')) {
          properties.scope = child.getAttribute('data-scope');
        }

        // For wc-select with options, extract innerHTML
        if (tag === 'wc-select' && child.children.length > 0) {
          const options = [];
          for (const opt of child.querySelectorAll('option')) {
            // Skip Pongo2 loop options
            if (opt.textContent.includes('{{')) continue;
            options.push(opt.outerHTML);
          }
          if (options.length > 0) {
            properties.innerHTML = options.join('\n');
          }
        }

        // For wc-input with type="radio" and option children
        if (tag === 'wc-input' && child.querySelectorAll('option').length > 0) {
          const options = [];
          for (const opt of child.querySelectorAll('option')) {
            if (opt.textContent.includes('{{')) continue;
            options.push(opt.outerHTML);
          }
          if (options.length > 0) {
            properties.innerHTML = options.join('\n');
          }
        }

        // Determine the component type
        const type = tag;
        const isContainer = [
          'div', 'fieldset', 'wc-form', 'wc-tab', 'wc-tab-item',
          'wc-accordion', 'wc-dropdown', 'wc-flip-box', 'wc-menu',
          'wc-sidebar', 'wc-sidenav', 'wc-slideshow', 'wc-split-button',
        ].includes(type);

        // Send to iframe
        this._postToCanvas('addComponent', {
          type,
          parentId: parentDesignerId,
          position: null,
          properties,
        });

        // Wait for component to be created
        await new Promise(r => setTimeout(r, 150));

        // If container, get its designerId and recurse into children
        if (isContainer && child.children.length > 0) {
          // Get the latest tree to find the designerId of the just-created component
          const tree = await this.getTree();
          const lastComponent = this._findLastComponentInTree(tree, type);
          if (lastComponent) {
            await this._loadChildren(child, lastComponent.designerId);
          }
        }
      }

      // Refresh layer tree
      this._updateLayerTree();
    }

    _isDesignerComponent(tag) {
      if (tag.startsWith('wc-')) return true;
      if (['div', 'fieldset', 'hr'].includes(tag)) return true;
      return false;
    }

    _getSampleValue(fieldName) {
      if (!this._sampleData || !fieldName) return undefined;
      return fieldName.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, this._sampleData);
    }

    _findLastComponentInTree(tree, type) {
      // Walk the tree depth-first and find the last component matching the type
      let found = null;
      function walk(nodes) {
        for (const node of nodes) {
          if (node.type === type) found = node;
          if (node.children) walk(node.children);
        }
      }
      walk(tree);
      return found;
    }

    // --- Form Integration ---

    /**
     * Get the generated content, code, and field rules for form submission.
     * Call this before the template form submits to inject the designer's output.
     *
     * @param {Object} options
     * @param {string} options.slug - Template slug (for form ID, URLs)
     * @param {string} options.collectionName - Collection name
     * @param {string} options.schemaSlug - Schema slug
     * @param {string} options.routePrefix - 'x' or 'v'
     * @param {string} options.prevTemplateSlug - List template slug
     * @returns {Promise<{ content: string, code: string, field_rules: string }>}
     */
    async getFormData(options = {}) {
      const rawHTML = await this.getHTML();
      const formHTML = this.transformToPongo2(rawHTML);

      const slug = options.slug || 'template';
      const collectionName = options.collectionName || slug;
      const schemaSlug = options.schemaSlug || slug;
      const routePrefix = options.routePrefix || 'x';
      const prevTemplateSlug = options.prevTemplateSlug || `${slug}_list`;

      // Wrap in standard template structure
      const content = `{% extends "__template_name__" %}

{% block css %}
{% endblock %}

{% block pageContent %}
<wc-article-skeleton
  _="on load
      WaveHelpers.waitForThenHideAndShow('#article-skeleton', '.page-content', 3000, 500)
    end">
</wc-article-skeleton>

<div class="page-content flex flex-col flex-1 py-2 px-3 gap-2 hidden">
  <div class="flex flex-row gap-3 justify-between items-center">
    <wc-breadcrumb>
      <wc-breadcrumb-item label="" link="/{{Template.RoutePrefix}}/home"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="${this._toProper(slug)}" link="/{{Template.RoutePrefix}}/${prevTemplateSlug}/list"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="" link=""></wc-breadcrumb-item>
    </wc-breadcrumb>
    <div class="flex flex-row items-center gap-3">
      <wc-save-split-button
        method="{{FormMethod}}"
        form="form#${slug}"
        hx-include="form#${slug}"
        save-url="/{{Template.RoutePrefix}}/${slug}/{{RecordID}}"
        save-new-url="/{{Template.RoutePrefix}}/${slug}/create"
        save-return-url="/{{Template.RoutePrefix}}/${prevTemplateSlug}/list">
      </wc-save-split-button>
    </div>
  </div>

  <wc-tab class="col-1 mt-2 mb-4" animate="">
    <wc-tab-item class="active" label="General">
      <div class="col-1 gap-2 pt-2 pb-5 px-5">
        <wc-form class="col gap-3"
          method="{{FormMethod}}"
          id="${slug}"
          action="/{{Template.RoutePrefix}}/${slug}/{{RecordID}}"
          hx-{{FormMethod}}="/{{Template.RoutePrefix}}/${slug}/{{RecordID}}">
          {% include "meta_fields" %}
          ${formHTML}
          <wc-hotkey keys="ctrl+s" target="button.save-btn"></wc-hotkey>
        </wc-form>
      </div>
    </wc-tab-item>
    <wc-tab-item label="Change Log">
      <div class="col-1 gap-2 pt-2 pb-5 px-5">
        {% if RecordID != "create" %}
        <div hx-get="/{{Template.RoutePrefix}}/change_log?collection=${collectionName}&original_id={{RecordID}}"
             hx-trigger="revealed" hx-swap="innerHTML" hx-indicator="#content-loader" hx-push-url="false">
          Loading change history...
        </div>
        {% else %}
        <div class="text-center p-4 text-muted">Save the record to view change history</div>
        {% endif %}
      </div>
    </wc-tab-item>
  </wc-tab>
</div>
{% endblock %}

{% block js %}
{% endblock %}`;

      // Generate code tab
      const now = new Date().toISOString();
      const code = `/**
* Generated by wc-live-designer
* Timestamp: ${now}
*/

function runGet() {
  if (ctx.RecordID == "create") {
    let schemaSlug = rdx.AppData.SchemaBuilder && rdx.AppData.SchemaBuilder.Slug ? rdx.AppData.SchemaBuilder.Slug : rdx.AppData.Template.Schema;
    let record = ctx.DB.CreateNew(rdx.ConnName, rdx.DBName, schemaSlug);
    return {record};
  } else {
    let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
    return {record};
  }
}

function runPut() {
  let id = ctx.RecordID;
  let schemaSlug = rdx.AppData.SchemaBuilder && rdx.AppData.SchemaBuilder.Slug ? rdx.AppData.SchemaBuilder.Slug : rdx.AppData.Template.Schema;
  id = ctx.DB.SaveAndValidate(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID, form, schemaSlug, [], []);
  if (id === "") { id = ctx.RecordID; }
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
  ctx.App.Session.Put(ctx.Request.Context(), "flash", "Save successful!");
  return {record};
}

function runPost() {
  let id = ctx.RecordID;
  let schemaSlug = rdx.AppData.SchemaBuilder && rdx.AppData.SchemaBuilder.Slug ? rdx.AppData.SchemaBuilder.Slug : rdx.AppData.Template.Schema;
  id = ctx.DB.SaveAndValidate(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID, form, schemaSlug, [], []);
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
  ctx.App.Session.Put(ctx.Request.Context(), "flash", "Save successful!");
  return {record};
}

function runDelete() {
  ctx.DB.DeleteByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
}`;

      return { content, code, field_rules: '' };
    }

    // --- Layer Tree ---

    _updateLayerTree() {
      // Request tree from iframe
      this._postToCanvas('getTree', {});
    }

    _renderLayerTree(tree) {
      const container = this.querySelector('.ld-layer-tree');
      if (!container) return;
      container.innerHTML = '';
      this._renderLayerNodes(container, tree, 0);
    }

    _renderLayerNodes(container, nodes, depth) {
      const icons = {
        'wc-form': '📋', 'wc-input': '⌸', 'wc-select': '▤', 'wc-textarea': '📝',
        'wc-field': '🏷', 'wc-tab': '📑', 'wc-tab-item': '📄', 'div': '□',
        'fieldset': '▢', 'wc-accordion': '▦', 'wc-dropdown': '▾',
        'wc-fa-icon': '★', 'wc-icon': '★', 'wc-image': '🖼',
        'wc-tabulator': '▦', 'wc-code-mirror': '⌨', 'hr': '―',
        'wc-save-button': '💾', 'wc-save-split-button': '💾',
        'wc-breadcrumb': '›', 'wc-loader': '⟳', 'wc-hotkey': '⌘',
      };

      for (const node of nodes) {
        const row = document.createElement('div');
        row.className = 'ld-layer-node';
        row.style.setProperty('--depth', depth);
        row.setAttribute('data-layer-id', node.designerId);

        if (this._selectedComponent?.designerId === node.designerId) {
          row.classList.add('active');
        }

        const icon = icons[node.type] || '◇';
        const scope = node.scope ? `[${node.scope}]` : '';
        const typeName = node.type.replace('wc-', '');

        row.innerHTML = `
          <span class="ld-layer-icon">${icon}</span>
          <span class="ld-layer-type">${typeName}</span>
          <span class="ld-layer-scope">${scope}</span>
        `;

        row.addEventListener('click', (e) => {
          e.stopPropagation();
          this._postToCanvas('selectById', { designerId: node.designerId });
        });

        container.appendChild(row);

        // Recurse into children
        if (node.children && node.children.length > 0) {
          this._renderLayerNodes(container, node.children, depth + 1);
        }
      }
    }

    // --- Breadcrumb ---

    _updateBreadcrumb(ancestors, currentId, currentType) {
      const bar = this.querySelector('.ld-breadcrumb');
      if (!bar) return;

      let html = '';
      for (const anc of ancestors) {
        const label = anc.scope ? `${anc.type}[${anc.scope}]` : anc.type;
        const isCurrent = anc.designerId === currentId;
        if (isCurrent) {
          html += `<span class="ld-bc-current">${label}</span>`;
        } else {
          html += `<a data-select-id="${anc.designerId}">${label}</a><span class="ld-bc-sep">›</span>`;
        }
      }
      bar.innerHTML = html;

      // Wire click-to-select on breadcrumb segments
      bar.querySelectorAll('a[data-select-id]').forEach(a => {
        a.addEventListener('click', () => {
          // Tell iframe to select this ancestor
          // For now, just post a click simulation
          this._postToCanvas('selectById', { designerId: a.dataset.selectId });
        });
      });
    }

    _clearBreadcrumb() {
      const bar = this.querySelector('.ld-breadcrumb');
      if (bar) bar.innerHTML = '';
    }

    // --- Property Panel ---

    _showPropertyPanel(type, properties, designerId) {
      const emptyPanel = this.querySelector('.ld-props-empty');
      const propsPanel = this.querySelector('.ld-props-panel');
      const typeEl = this.querySelector('.ld-props-type');
      const idEl = this.querySelector('.ld-props-id');
      const fieldsEl = this.querySelector('.ld-props-fields');

      emptyPanel?.classList.add('hidden');
      propsPanel?.classList.remove('hidden');

      typeEl.textContent = type;
      idEl.textContent = designerId;

      // Build property fields
      fieldsEl.innerHTML = '';

      // Common properties
      const commonProps = [
        { name: 'scope', label: 'Data Scope', type: 'text', value: properties.scope || '' },
        { name: 'name', label: 'Name', type: 'text', value: properties.name || '' },
        { name: 'lbl-label', label: 'Label', type: 'text', value: properties['lbl-label'] || '' },
        { name: 'css', label: 'CSS Classes', type: 'text', value: properties.css || '' },
      ];

      // Type-specific properties
      if (type === 'wc-input') {
        commonProps.push({ name: 'type', label: 'Input Type', type: 'select', value: properties.type || 'text',
          options: ['text', 'email', 'tel', 'date', 'number', 'currency', 'checkbox', 'password', 'search', 'url'] });
        commonProps.push({ name: 'placeholder', label: 'Placeholder', type: 'text', value: properties.placeholder || '' });
        commonProps.push({ name: 'required', label: 'Required', type: 'checkbox', value: properties.required != null && properties.required !== false });
        commonProps.push({ name: 'toggle-switch', label: 'Toggle Switch', type: 'checkbox', value: properties['toggle-switch'] != null && properties['toggle-switch'] !== false });
      } else if (type === 'wc-select') {
        commonProps.push({ name: 'required', label: 'Required', type: 'checkbox', value: properties.required != null && properties.required !== false });

        // Determine current data source from what's set
        let dataSource = 'enum';
        if (properties.url) dataSource = 'url';
        else if (properties['data-lookup']) dataSource = 'lookup';
        else if (properties.items) dataSource = 'items';
        else if (properties['data-url-template']) dataSource = 'url-template';

        commonProps.push({ name: 'data-source', label: 'Data Source', type: 'select', value: dataSource,
          options: ['enum', 'lookup', 'collection', 'url', 'url-template', 'items'] });
        commonProps.push({ name: 'placeholder-option', label: 'Placeholder', type: 'text', value: properties['placeholder-option'] || 'Choose...' });
        commonProps.push({ name: 'mode', label: 'Mode', type: 'select', value: properties.mode || '', options: ['', 'chip'] });
        commonProps.push({ name: 'multiple', label: 'Multiple', type: 'checkbox', value: properties.multiple != null && properties.multiple !== false });
        commonProps.push({ name: 'allow-dynamic', label: 'Allow Dynamic', type: 'checkbox', value: properties['allow-dynamic'] != null && properties['allow-dynamic'] !== false });

        // Source-specific fields
        commonProps.push({ name: 'data-lookup', label: 'Lookup Name', type: 'text', value: properties['data-lookup'] || '' });
        commonProps.push({ name: 'url', label: 'URL', type: 'text', value: properties.url || '' });
        commonProps.push({ name: 'display-member', label: 'Display Member', type: 'text', value: properties['display-member'] || '' });
        commonProps.push({ name: 'value-member', label: 'Value Member', type: 'text', value: properties['value-member'] || '' });
        commonProps.push({ name: 'data-url-template', label: 'URL Template', type: 'text', value: properties['data-url-template'] || '' });
        commonProps.push({ name: 'data-url-depends', label: 'Depends On', type: 'text', value: properties['data-url-depends'] || '' });
        commonProps.push({ name: 'items', label: 'Items (JSON)', type: 'text', value: properties.items || '' });
        commonProps.push({ name: 'data-enum', label: 'Enum Values', type: 'text', value: properties['data-enum'] || '' });
      } else if (type === 'wc-textarea') {
        commonProps.push({ name: 'rows', label: 'Rows', type: 'number', value: properties.rows || '4' });
        commonProps.push({ name: 'required', label: 'Required', type: 'checkbox', value: properties.required != null && properties.required !== false });
      } else if (type === 'wc-field') {
        commonProps.push({ name: 'label', label: 'Label', type: 'text', value: properties.label || '' });
        commonProps.push({ name: 'value', label: 'Value', type: 'text', value: properties.value || '' });
        commonProps.push({ name: 'link', label: 'Link', type: 'text', value: properties.link || '' });
      } else if (type === 'wc-fa-icon') {
        commonProps.push({ name: 'name', label: 'Icon Name', type: 'text', value: properties.name || '' });
        commonProps.push({ name: 'icon-style', label: 'Style', type: 'select', value: properties['icon-style'] || 'solid',
          options: ['solid', 'regular', 'light', 'thin', 'duotone', 'brands'] });
        commonProps.push({ name: 'size', label: 'Size', type: 'text', value: properties.size || '1rem' });
      } else if (type === 'wc-tabulator') {
        commonProps.push({ name: 'ajax-url', label: 'AJAX URL', type: 'text', value: properties['ajax-url'] || '' });
        commonProps.push({ name: 'pagination', label: 'Pagination', type: 'checkbox', value: properties.pagination != null });
      } else if (type === 'fieldset') {
        commonProps.splice(2, 0, { name: 'legend', label: 'Legend', type: 'text', value: properties.legend || '' });
      }

      for (const prop of commonProps) {
        const row = document.createElement('div');
        row.className = 'ld-prop-row';

        if (prop.type === 'checkbox') {
          row.innerHTML = `
            <label><input type="checkbox" data-prop="${prop.name}" ${prop.value ? 'checked' : ''} /> ${prop.label}</label>
          `;
        } else if (prop.type === 'select') {
          row.innerHTML = `
            <label>${prop.label}</label>
            <select data-prop="${prop.name}">
              ${(prop.options || []).map(o => `<option value="${o}" ${o === prop.value ? 'selected' : ''}>${o || '(none)'}</option>`).join('')}
            </select>
          `;
        } else if (prop.type === 'number') {
          row.innerHTML = `
            <label>${prop.label}</label>
            <input type="number" data-prop="${prop.name}" value="${prop.value}" />
          `;
        } else {
          row.innerHTML = `
            <label>${prop.label}</label>
            <input type="text" data-prop="${prop.name}" value="${prop.value}" />
          `;
        }

        // Wire change events
        const input = row.querySelector('[data-prop]');
        // Use 'input' for text fields (fires on every keystroke) and 'change' for selects/checkboxes
        const eventType = (input?.type === 'checkbox' || input?.tagName === 'SELECT') ? 'change' : 'input';
        input?.addEventListener(eventType, () => {
          const val = input.type === 'checkbox' ? input.checked : input.value;
          this._postToCanvas('updateProperty', {
            designerId,
            propName: input.dataset.prop,
            value: val
          });
        });

        fieldsEl.appendChild(row);
      }
    }

    _hidePropertyPanel() {
      this.querySelector('.ld-props-empty')?.classList.remove('hidden');
      this.querySelector('.ld-props-panel')?.classList.add('hidden');
    }

    // --- Public API ---

    /**
     * Set sample data for design-time preview.
     */
    setSampleData(data) {
      this._sampleData = data;
      if (this._canvasReady) {
        this._postToCanvas('setSampleData', { data });
      }
    }

    /**
     * Get the serialized component tree from the canvas.
     * @returns {Promise<Array>}
     */
    getTree() {
      return new Promise((resolve) => {
        this._treeCallback = resolve;
        this._postToCanvas('getTree', {});
        // Timeout fallback
        setTimeout(() => {
          if (this._treeCallback) {
            this._treeCallback([]);
            this._treeCallback = null;
          }
        }, 2000);
      });
    }

    /**
     * Clear the canvas.
     */
    clear() {
      this._postToCanvas('clear', {});
      this._hidePropertyPanel();
    }

    /**
     * Get raw HTML from the canvas (with editor attributes stripped).
     * @returns {Promise<string>}
     */
    getHTML() {
      return new Promise((resolve) => {
        this._htmlCallback = resolve;
        this._postToCanvas('getHTML', {});
        setTimeout(() => {
          if (this._htmlCallback) {
            this._htmlCallback('');
            this._htmlCallback = null;
          }
        }, 2000);
      });
    }

    /**
     * Transform raw canvas HTML into Pongo2 template content.
     * Replaces sample data values with {{ Record.field }} expressions.
     * @param {string} rawHTML - HTML from getHTML()
     * @returns {string} Pongo2 template content
     */
    transformToPongo2(rawHTML) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${rawHTML}</div>`, 'text/html');
      const root = doc.body.firstElementChild;

      root.querySelectorAll('[data-scope]').forEach(el => {
        const scope = el.getAttribute('data-scope');
        const tag = el.tagName.toLowerCase();
        const fieldName = scope.split('.').pop();

        if (tag === 'wc-input') {
          const inputType = el.getAttribute('type');

          if (inputType === 'checkbox') {
            // Boolean: {% if Record.field %} checked {% endif %}
            el.removeAttribute('checked');
            el.setAttribute('data-pongo2-checked', `{% if Record.${scope} %} checked {% endif %}`);

          } else if (inputType === 'currency') {
            // Currency: {{ Record.field|floatformat:2 }}
            el.setAttribute('value', `{{ Record.${scope}|floatformat:2 }}`);

          } else if (inputType === 'radio') {
            // Radio with lookup
            const lookup = el.getAttribute('data-lookup');
            if (lookup) {
              el.setAttribute('value', `{{Record.${scope}}}`);
              el.innerHTML = `\n{% set ${fieldName} = coalesce(Record, "${scope}", "") %}\n{% for item in Lookups.${lookup}.item_list %}\n<option value="{{item.value}}"{% if ${fieldName} == item.value %} checked{% endif %}>{{item.key}}</option>\n{% endfor %}`;
            } else {
              el.setAttribute('value', `{{ Record.${scope} }}`);
            }

          } else {
            // Standard input: {{ Record.field }}
            el.setAttribute('value', `{{ Record.${scope} }}`);
          }

        } else if (tag === 'wc-select') {
          // Determine data source from attributes
          const dataSource = el.getAttribute('data-source') || '';
          const lookup = el.getAttribute('data-lookup');
          const url = el.getAttribute('url');
          const urlTemplate = el.getAttribute('data-url-template');
          const items = el.getAttribute('items');
          const mode = el.getAttribute('mode');
          const allowDynamic = el.hasAttribute('allow-dynamic');
          const placeholder = el.getAttribute('placeholder-option') || 'Choose...';

          if (url || dataSource === 'url') {
            // Pattern 2: Collection URL — wc-select handles natively
            el.setAttribute('value', `{{ Record.${scope} }}`);
            // Remove sample options, keep url/display-member/value-member attributes

          } else if (urlTemplate || dataSource === 'url-template') {
            // Pattern 7: Chip + URL Template (dependent select)
            // Keep data-url-template and data-url-depends attributes as-is

          } else if (lookup || dataSource === 'lookup') {
            // Pattern 1: Lookup — most common
            el.removeAttribute('value');
            el.innerHTML = `\n<option value="">${placeholder}</option>\n{% set ${fieldName} = Record.${scope} %}\n{% for item in Lookups.${lookup}.item_list %}\n<option value="{{item.value}}"{% if ${fieldName} == item.value %} selected{% endif %}>{{item.key}}</option>\n{% endfor %}`;

          } else if (dataSource === 'collection') {
            // Pattern 3: Collection Loop via TemplateCollections
            const collection = el.getAttribute('data-collection') || '';
            const displayMember = el.getAttribute('display-member') || 'name';
            const valueMember = el.getAttribute('value-member') || 'slug';
            el.removeAttribute('value');
            el.innerHTML = `\n<option value="">${placeholder}</option>\n{% set ${fieldName} = Record.${scope} %}\n{% for item in TemplateCollections.${collection} %}\n<option value="{{item.${valueMember}}}"{% if ${fieldName} == item.${valueMember} %} selected{% endif %}>{{item.${displayMember}}}</option>\n{% endfor %}`;

          } else if (items || dataSource === 'items') {
            // Pattern 5: Items JSON — keep items attribute as-is
            el.setAttribute('value', `{{ Record.${scope} }}`);

          } else if (mode === 'chip' && allowDynamic) {
            // Pattern 6: Chip + Dynamic (tags)
            el.removeAttribute('value');
            el.innerHTML = `\n{% for tag in Record.${scope} %}\n<option value="{{tag}}" selected>{{tag}}</option>\n{% endfor %}`;

          } else if (mode === 'chip') {
            // Chip with lookup
            if (lookup) {
              el.removeAttribute('value');
              el.innerHTML = `\n{% set ${fieldName} = Record.${scope} %}\n{% for item in Lookups.${lookup}.item_list %}\n<option value="{{item.value}}"{% if ${fieldName} == item.value %} selected{% endif %}>{{item.value}}</option>\n{% endfor %}`;
            } else {
              el.setAttribute('value', `{{ Record.${scope} }}`);
            }

          } else {
            // Pattern 4: Static enum — keep existing options, add value binding
            el.setAttribute('value', `{{ Record.${scope} }}`);
          }

          // Clean up designer-only attributes from output
          el.removeAttribute('data-source');
          el.removeAttribute('placeholder-option');
          el.removeAttribute('data-enum');

        } else if (tag === 'wc-textarea') {
          el.setAttribute('value', `{{ Record.${scope} }}`);

        } else if (tag === 'wc-field') {
          el.setAttribute('value', `{{ Record.${scope} }}`);

        } else {
          el.setAttribute('value', `{{ Record.${scope} }}`);
        }

        // Remove data-scope from output — it's a designer-only attribute
        el.removeAttribute('data-scope');
      });

      let html = root.innerHTML;

      // Handle checkbox Pongo2 markers
      html = html.replace(/data-pongo2-checked="([^"]+)"/g, (match, pongo2) => {
        return pongo2;
      });

      return html;
    }

    /**
     * Generate a complete _template_builder document from the current canvas state.
     * @param {Object} options
     * @param {string} options.name - Template display name
     * @param {string} options.slug - Template slug
     * @param {string} options.collectionName - MongoDB collection name
     * @param {string} options.schemaSlug - Schema slug
     * @param {string} [options.routePrefix='x'] - Route prefix
     * @param {string} [options.prevTemplateSlug=''] - Previous template slug (list view)
     * @returns {Promise<Object>} Complete _template_builder document
     */
    async generateTemplateDocument(options) {
      const {
        name, slug, collectionName, schemaSlug,
        routePrefix = 'x',
        prevTemplateSlug = `${slug}_list`,
      } = options;

      // Get raw HTML from canvas
      const rawHTML = await this.getHTML();

      // Transform to Pongo2
      const formHTML = this.transformToPongo2(rawHTML);

      // Wrap in standard template structure
      const content = `{% extends "__template_name__" %}

{% block css %}
{% endblock %}

{% block pageContent %}
<wc-article-skeleton
  _="on load
      WaveHelpers.waitForThenHideAndShow('#article-skeleton', '.page-content', 3000, 500)
    end">
</wc-article-skeleton>

<div class="page-content flex flex-col flex-1 py-2 px-3 gap-2 hidden">
  <div class="flex flex-row gap-3 justify-between items-center">
    <wc-breadcrumb>
      <wc-breadcrumb-item label="" link="/{{Template.RoutePrefix}}/home"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="${name}" link="/{{Template.RoutePrefix}}/${prevTemplateSlug}/list"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="" link=""></wc-breadcrumb-item>
    </wc-breadcrumb>
    <div class="flex flex-row items-center gap-3">
      <wc-save-split-button
        method="{{FormMethod}}"
        form="form#${slug}"
        hx-include="form#${slug}"
        save-url="/{{Template.RoutePrefix}}/${slug}/{{RecordID}}"
        save-new-url="/{{Template.RoutePrefix}}/${slug}/create"
        save-return-url="/{{Template.RoutePrefix}}/${prevTemplateSlug}/list">
      </wc-save-split-button>
    </div>
  </div>

  <wc-tab class="col-1 mt-2 mb-4" animate="">
    <wc-tab-item class="active" label="General">
      <div class="col-1 gap-2 pt-2 pb-5 px-5">
        <wc-form class="col gap-3"
          method="{{FormMethod}}"
          id="${slug}"
          action="/{{Template.RoutePrefix}}/${slug}/{{RecordID}}"
          hx-{{FormMethod}}="/{{Template.RoutePrefix}}/${slug}/{{RecordID}}">
          {% include "meta_fields" %}
          ${formHTML}
          <wc-hotkey keys="ctrl+s" target="button.save-btn"></wc-hotkey>
        </wc-form>
      </div>
    </wc-tab-item>
    <wc-tab-item label="Change Log">
      <div class="col-1 gap-2 pt-2 pb-5 px-5">
        {% if RecordID != "create" %}
        <div hx-get="/{{Template.RoutePrefix}}/change_log?collection=${collectionName}&original_id={{RecordID}}"
             hx-trigger="revealed" hx-swap="innerHTML" hx-indicator="#content-loader" hx-push-url="false">
          Loading change history...
        </div>
        {% else %}
        <div class="text-center p-4 text-muted">Save the record to view change history</div>
        {% endif %}
      </div>
    </wc-tab-item>
  </wc-tab>
</div>
{% endblock %}

{% block js %}
{% endblock %}`;

      // Generate code tab
      const now = new Date().toISOString();
      const code = `/**
* Generated by wc-live-designer
* Timestamp: ${now}
*/

function runGet() {
  if (ctx.RecordID == "create") {
    let schemaSlug = rdx.AppData.SchemaBuilder && rdx.AppData.SchemaBuilder.Slug ? rdx.AppData.SchemaBuilder.Slug : rdx.AppData.Template.Schema;
    let record = ctx.DB.CreateNew(rdx.ConnName, rdx.DBName, schemaSlug);
    return {record};
  } else {
    let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
    return {record};
  }
}

function runPut() {
  let id = ctx.RecordID;
  let schemaSlug = rdx.AppData.SchemaBuilder && rdx.AppData.SchemaBuilder.Slug ? rdx.AppData.SchemaBuilder.Slug : rdx.AppData.Template.Schema;
  id = ctx.DB.SaveAndValidate(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID, form, schemaSlug, [], []);
  if (id === "") { id = ctx.RecordID; }
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
  ctx.App.Session.Put(ctx.Request.Context(), "flash", "Save successful!");
  return {record};
}

function runPost() {
  let id = ctx.RecordID;
  let schemaSlug = rdx.AppData.SchemaBuilder && rdx.AppData.SchemaBuilder.Slug ? rdx.AppData.SchemaBuilder.Slug : rdx.AppData.Template.Schema;
  id = ctx.DB.SaveAndValidate(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID, form, schemaSlug, [], []);
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
  ctx.App.Session.Put(ctx.Request.Context(), "flash", "Save successful!");
  return {record};
}

function runDelete() {
  ctx.DB.DeleteByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
}`;

      return {
        name,
        slug,
        collection_name: collectionName,
        schema: schemaSlug,
        schema_slug: schemaSlug,
        template_type: 'standard',
        screen_type: 'standard',
        route_prefix: routePrefix,
        route_record_id: 'true',
        route_next_template_slug: '',
        route_next_screen_slug: '',
        route_prev_template_slug: prevTemplateSlug,
        route_prev_screen_slug: prevTemplateSlug,
        depend_full_request: 'base',
        depend_partial_request: 'partial-base',
        depends: ['base', 'loader', 'partial-base'],
        collections: [],
        lookups: [],
        content,
        code,
        field_rules: '',
        reference_key: collectionName,
        record_status: 'Development',
        version_number: '0.01',
        designed_with: 'visual',
        is_base: false,
        is_core: false,
        is_active: true,
        preview_toggle: 'off',
        drag_toggle: 'off',
        created_by: '',
        created_date: now,
        modified_by: '',
        modified_date: now,
      };
    }

    /**
     * Save the designed template to the server via the configured API base URL.
     * @param {Object} options - Same as generateTemplateDocument options
     * @param {string} [endpoint='/api/update-field-by-id/_template_builder'] - API endpoint path
     * @returns {Promise<Object>} API response
     */
    async save(options, endpoint = '/api/update-field-by-id/_template_builder') {
      const doc = await this.generateTemplateDocument(options);
      const apiBase = this._getApiBase();

      const response = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc),
      });

      return { success: response.ok, document: doc };
    }

    _handleAttributeChange(name, newValue) {
      if (name === 'theme' && this._canvasReady) {
        this._postToCanvas('setTheme', { theme: newValue });
      }
    }
  }

  customElements.define(WcLiveDesigner.is, WcLiveDesigner);
}
