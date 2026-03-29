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
      return ['id', 'class', 'canvas-url', 'theme', 'api-base-url', 'schema'];
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

    // Edit-mode CSS — injected into iframe for designer affordances.
    // Components render naturally — their own CSS handles display.
    // Designer adds: hover outlines, drop hints, subtle labels.
    static EDIT_MODE_CSS = `
      /* === All designer elements get position for selection outline === */
      [data-designer-id] {
        position: relative !important;
      }

      /* === display:contents override — only for simple wrapper components === */
      /* Components that manage child visibility (wc-tab, wc-tab-item,
         wc-accordion, wc-dropdown) keep display:contents so their
         internal rendering works naturally (tabs switch, accordions fold). */
      div[data-designer-id].contents,
      wc-form[data-designer-id].contents,
      wc-breadcrumb[data-designer-id].contents,
      fieldset[data-designer-id].contents,
      wc-input[data-designer-id].contents,
      wc-select[data-designer-id].contents,
      wc-textarea[data-designer-id].contents,
      wc-field[data-designer-id].contents,
      wc-google-address[data-designer-id].contents {
        display: block !important;
      }

      /* === Subtle hover outline === */
      [data-designer-id]:hover {
        outline: 1px dashed var(--surface-5, #555) !important;
        outline-offset: -1px !important;
      }

      /* === Universal drop target === */
      [data-drop-target] {
        border: 1px dashed rgba(120, 160, 220, 0.4) !important;
        border-radius: 4px !important;
        padding: 8px !important;
        min-height: 40px !important;
        background: rgba(120, 160, 220, 0.03) !important;
      }
      [data-drop-target]:not(:has([data-designer-id]:not([data-designer-utility]))) {
        min-height: 100px !important;
      }
      [data-drop-target]:not(:has([data-designer-id]:not([data-designer-utility])))::after {
        content: 'Drop components here' !important;
        display: flex !important;
        justify-content: center !important;
        align-items: center !important;
        min-height: 100px !important;
        color: var(--text-6, #888) !important;
        font-size: 12px !important;
        font-family: system-ui, sans-serif !important;
        border: 1px dashed var(--surface-5, #444) !important;
        border-radius: 4px !important;
      }

      /* === Design time: hidden class should not hide content === */
      [data-designer-id].hidden {
        display: flex !important;
        visibility: visible !important;
      }

      /* Skeletons: compact static indicator in designer */
      wc-article-skeleton[data-designer-id] .wc-article-skeleton,
      wc-table-skeleton[data-designer-id] .wc-table-skeleton,
      wc-card-skeleton[data-designer-id] .wc-card-skeleton,
      wc-list-skeleton[data-designer-id] .wc-list-skeleton {
        display: none !important;
      }
      wc-article-skeleton[data-designer-id],
      wc-table-skeleton[data-designer-id],
      wc-card-skeleton[data-designer-id],
      wc-list-skeleton[data-designer-id] {
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        min-height: 32px !important;
        max-height: 32px !important;
        background: var(--surface-3, #2a2a3a) !important;
        border: 1px dashed rgba(0, 120, 255, 0.3) !important;
        border-radius: 4px !important;
        overflow: hidden !important;
        font-size: 11px !important;
        color: rgba(0, 120, 255, 0.5) !important;
        font-family: system-ui, sans-serif !important;
      }
      wc-article-skeleton[data-designer-id]::after { content: '⏳ Article Skeleton' !important; }
      wc-table-skeleton[data-designer-id]::after { content: '⏳ Table Skeleton' !important; }
      wc-card-skeleton[data-designer-id]::after { content: '⏳ Card Skeleton' !important; }
      wc-list-skeleton[data-designer-id]::after { content: '⏳ List Skeleton' !important; }

      /* === Prevent form interaction at design time — but allow:
         - tab nav buttons (.tab-link)
         - elements that ARE designer components (have data-designer-id) === */
      [data-designer-id] input:not([data-designer-id]),
      [data-designer-id] select:not([data-designer-id]),
      [data-designer-id] textarea:not([data-designer-id]) {
        pointer-events: none !important;
      }
      [data-designer-id] button:not(.tab-link):not([data-designer-id]) {
        pointer-events: none !important;
      }
      [data-designer-id] a:not([data-designer-id]) {
        pointer-events: none !important;
      }
      .tab-nav .tab-link {
        pointer-events: all !important;
        cursor: pointer !important;
      }
    `;

    // Component palette — each item defines its HTML so it renders visibly when dropped.
    // No tree objects, no incremental building. Just HTML → innerHTML → done.
    static CONTAINERS = [
      { label: 'Div', html: '<div class="col gap-2 p-2"></div>' },
      { label: 'Fieldset', html: '<fieldset class="col gap-2 p-4 border border-solid rounded-md"><legend>Fieldset</legend></fieldset>' },
      { label: 'Form', html: '<wc-form class="col gap-3" id="form" method="put"></wc-form>' },
      { label: 'Tab Container', html: '<wc-tab class="col-1" animate><wc-tab-item class="active" label="Tab 1"><div class="p-4"></div></wc-tab-item><wc-tab-item label="Tab 2"><div class="p-4"></div></wc-tab-item></wc-tab>' },
      { label: 'Tab Item', html: '<wc-tab-item label="New Tab"><div class="p-4"></div></wc-tab-item>' },
      { label: 'Accordion', html: '<wc-accordion></wc-accordion>' },
      { label: 'Dropdown', html: '<wc-dropdown label="Dropdown"></wc-dropdown>' },
      { label: 'Flip Box', html: '<wc-flip-box></wc-flip-box>' },
      { label: 'Menu', html: '<wc-menu></wc-menu>' },
      { label: 'Sidebar', html: '<wc-sidebar label="Sidebar" width="300px"></wc-sidebar>' },
      { label: 'Sidenav', html: '<wc-sidenav></wc-sidenav>' },
      { label: 'Slideshow', html: '<wc-slideshow></wc-slideshow>' },
      { label: 'Split Button', html: '<wc-split-button></wc-split-button>' },
    ];

    static ELEMENTS = [
      // Form inputs — every element has visible defaults
      { label: 'Text Input', html: '<wc-input name="field" lbl-label="Text Field"></wc-input>' },
      { label: 'Checkbox', html: '<wc-input name="is_active" lbl-label="Is Active?" type="checkbox" toggle-switch></wc-input>' },
      { label: 'Email', html: '<wc-input name="email" lbl-label="Email" type="email"></wc-input>' },
      { label: 'Phone', html: '<wc-input name="phone" lbl-label="Phone" type="tel"></wc-input>' },
      { label: 'Date', html: '<wc-input name="date" lbl-label="Date" type="date"></wc-input>' },
      { label: 'Number', html: '<wc-input name="quantity" lbl-label="Number" type="number"></wc-input>' },
      { label: 'Currency', html: '<wc-input name="amount" lbl-label="Amount" type="currency"></wc-input>' },
      { label: 'Password', html: '<wc-input name="password" lbl-label="Password" type="password"></wc-input>' },
      { label: 'Radio', html: '<wc-input name="option" lbl-label="Option" type="radio" radio-group-class="row modern"><option value="a">Option A</option><option value="b">Option B</option></wc-input>' },
      { label: 'Range', html: '<wc-input name="range" lbl-label="Range" type="range"></wc-input>' },
      { label: 'Select', html: '<wc-select name="select" lbl-label="Select"><option value="">Choose...</option><option value="a">Option A</option><option value="b">Option B</option></wc-select>' },
      { label: 'Textarea', html: '<wc-textarea name="notes" lbl-label="Notes" rows="4"></wc-textarea>' },
      // HTML basics
      { label: 'Button', html: '<button class="btn btn-primary">Button</button>' },
      { label: 'Link', html: '<a href="#" class="underline">Link text</a>' },
      { label: 'Heading 1', html: '<h1>Heading 1</h1>' },
      { label: 'Heading 2', html: '<h2>Heading 2</h2>' },
      { label: 'Heading 3', html: '<h3>Heading 3</h3>' },
      { label: 'Paragraph', html: '<p>Paragraph text goes here.</p>' },
      { label: 'Divider', html: '<hr>' },
      // Display
      { label: 'Field (display)', html: '<wc-field label="Field" value="Value"></wc-field>' },
      { label: 'FA Icon', html: '<wc-fa-icon name="star" icon-style="solid" size="1.5rem"></wc-fa-icon>' },
      { label: 'Image', html: '<wc-image src="" alt="Image" class="w-full"></wc-image>' },
      // Navigation
      { label: 'Breadcrumb', html: '<wc-breadcrumb><wc-breadcrumb-item label="Home" link="#"></wc-breadcrumb-item><wc-breadcrumb-item label="Page" link=""></wc-breadcrumb-item></wc-breadcrumb>' },
      { label: 'Breadcrumb Item', html: '<wc-breadcrumb-item label="Page" link="#"></wc-breadcrumb-item>' },
      // Buttons
      { label: 'Save Split Button', html: '<wc-save-split-button method="{{FormMethod}}"></wc-save-split-button>' },
      { label: 'Save Button', html: '<wc-save-button method="{{FormMethod}}"></wc-save-button>' },
      // Data
      { label: 'Tabulator', html: '<wc-tabulator ajax-url="/api/collection" pagination></wc-tabulator>' },
      // Skeletons
      { label: 'Article Skeleton', html: '<wc-article-skeleton></wc-article-skeleton>' },
      { label: 'Loader', html: '<wc-loader></wc-loader>' },
      // Utility
      { label: 'Hotkey', html: '<wc-hotkey keys="ctrl+s" target="button.save-btn"></wc-hotkey>' },
    ];

    // Presets — complete HTML strings, rendered via innerHTML in one paint.
    // Modeled after real production Go Kart templates.
    static PRESETS = [
      // --- Page Starters ---
      { label: 'Standard Edit Page', category: 'page', description: 'Skeleton + nav + tabs + form + hotkey',
        html: `<wc-article-skeleton _="on load\n      call WaveHelpers.waitForThenHideAndShow('wc-article-skeleton .wc-article-skeleton', '.page-content', 3000, 500)\n    end"></wc-article-skeleton>
<div class="page-content flex flex-col flex-1 py-2 px-3 gap-2 hidden">
  <div class="flex flex-row gap-3 justify-between items-center">
    <wc-breadcrumb>
      <wc-breadcrumb-item label="" link="/{{Template.RoutePrefix}}/home"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="{{Template.Name}}" link="/{{Template.RoutePrefix}}/{{Template.RoutePrevTemplateSlug}}/list"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="" link=""></wc-breadcrumb-item>
    </wc-breadcrumb>
    <div class="flex flex-row items-center gap-3">
      <wc-save-split-button method="{{FormMethod}}" hx-include="form#{{Template.Slug}}" save-url="/{{Template.RoutePrefix}}/{{Template.Slug}}/{{RecordID}}" save-new-url="/{{Template.RoutePrefix}}/{{Template.Slug}}/create" save-return-url="/{{Template.RoutePrefix}}/{{Template.RoutePrevTemplateSlug}}/list"></wc-save-split-button>
    </div>
  </div>
  <wc-tab class="col-1 mt-2 mb-4" animate>
    <wc-tab-item class="active" label="General">
      <wc-form class="col gap-3 pt-2 pb-5 px-5" method="{{FormMethod}}" id="{{Template.Slug}}" action="/{{Template.RoutePrefix}}/{{Template.Slug}}/{{RecordID}}">
        <wc-hotkey keys="ctrl+s" target="button.save-btn"></wc-hotkey>
      </wc-form>
    </wc-tab-item>
    <wc-tab-item label="Change Log">
      {% if RecordID != "create" %}
      <div id="change-log-tab"
           hx-get="/{{Template.RoutePrefix}}/change_log?collection={{Template.Slug}}&original_id={{RecordID}}"
           hx-trigger="revealed"
           hx-swap="innerHTML"
           hx-indicator="#content-loader"
           hx-push-url="false">
        <div class="flex items-center gap-2 text-gray-500 p-4">
          <wc-fa-icon name="spinner" class="fa-spin"></wc-fa-icon>
          Loading change history...
        </div>
      </div>
      {% else %}
      <div class="text-center p-4 text-muted">
        Save the record to view change history
      </div>
      {% endif %}
    </wc-tab-item>
  </wc-tab>
</div>` },
      { label: 'Simple Form Page', category: 'page', description: 'Skeleton + nav + form (no tabs)',
        html: `<wc-article-skeleton _="on load\n      call WaveHelpers.waitForThenHideAndShow('wc-article-skeleton .wc-article-skeleton', '.page-content', 3000, 500)\n    end"></wc-article-skeleton>
<div class="page-content flex flex-col flex-1 py-2 px-3 gap-2 hidden">
  <div class="flex flex-row gap-3 justify-between items-center">
    <wc-breadcrumb>
      <wc-breadcrumb-item label="" link="/{{Template.RoutePrefix}}/home"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="{{Template.Name}}" link=""></wc-breadcrumb-item>
    </wc-breadcrumb>
    <div class="flex flex-row items-center gap-3">
      <wc-save-split-button method="{{FormMethod}}" hx-include="form#{{Template.Slug}}" save-url="/{{Template.RoutePrefix}}/{{Template.Slug}}/{{RecordID}}" save-new-url="/{{Template.RoutePrefix}}/{{Template.Slug}}/create" save-return-url="/{{Template.RoutePrefix}}/{{Template.RoutePrevTemplateSlug}}/list"></wc-save-split-button>
    </div>
  </div>
  <wc-form class="col gap-3 pt-2 pb-5 px-5" method="{{FormMethod}}" id="{{Template.Slug}}" action="/{{Template.RoutePrefix}}/{{Template.Slug}}/{{RecordID}}">
    <wc-hotkey keys="ctrl+s" target="button.save-btn"></wc-hotkey>
  </wc-form>
</div>` },
      { label: 'List Page', category: 'page', description: 'Skeleton + breadcrumb + tabulator',
        html: `<wc-article-skeleton _="on load\n      call WaveHelpers.waitForThenHideAndShow('wc-article-skeleton .wc-article-skeleton', '.page-content', 3000, 500)\n    end"></wc-article-skeleton>
<div class="page-content flex flex-col flex-1 py-2 px-3 gap-2 hidden">
  <div class="flex flex-row gap-3 justify-between items-center">
    <wc-breadcrumb>
      <wc-breadcrumb-item label="" link="/{{Template.RoutePrefix}}/home"></wc-breadcrumb-item>
      <wc-breadcrumb-item label="{{Template.Name}}" link=""></wc-breadcrumb-item>
    </wc-breadcrumb>
  </div>
  <wc-tabulator ajax-url="/api/{{Template.CollectionName}}" pagination></wc-tabulator>
</div>` },
      // --- Layouts ---
      { label: '2 Column', category: 'layout', description: 'Two equal columns',
        html: '<div class="row gap-4"><div class="col-1"></div><div class="col-1"></div></div>' },
      { label: '3 Column', category: 'layout', description: 'Three equal columns',
        html: '<div class="row gap-4"><div class="col-1"></div><div class="col-1"></div><div class="col-1"></div></div>' },
      { label: '4 Column', category: 'layout', description: 'Four equal columns',
        html: '<div class="row gap-4"><div class="col-1"></div><div class="col-1"></div><div class="col-1"></div><div class="col-1"></div></div>' },
      { label: 'Sidebar + Content', category: 'layout', description: 'Left sidebar with main content',
        html: '<div class="row gap-4"><div class="flex flex-col" style="width: 250px; min-width: 200px;"></div><div class="col-1"></div></div>' },
      // --- Component Groups ---
      { label: 'Navigation Bar', category: 'group', description: 'Breadcrumb + save button row',
        html: `<div class="flex flex-row gap-3 justify-between items-center">
  <wc-breadcrumb>
    <wc-breadcrumb-item label="" link="/{{Template.RoutePrefix}}/home"></wc-breadcrumb-item>
    <wc-breadcrumb-item label="{{Template.Name}}" link=""></wc-breadcrumb-item>
  </wc-breadcrumb>
  <div class="flex flex-row items-center gap-3">
    <wc-save-split-button method="{{FormMethod}}" hx-include="form#{{Template.Slug}}" save-url="/{{Template.RoutePrefix}}/{{Template.Slug}}/{{RecordID}}" save-new-url="/{{Template.RoutePrefix}}/{{Template.Slug}}/create" save-return-url="/{{Template.RoutePrefix}}/{{Template.RoutePrevTemplateSlug}}/list"></wc-save-split-button>
  </div>
</div>` },
      { label: 'Tab with Change Log', category: 'group', description: 'Tab with General + Change Log',
        html: `<wc-tab class="col-1 mt-2 mb-4" animate><wc-tab-item class="active" label="General"><div class="col-1 gap-2 pt-2 pb-5 px-5"></div></wc-tab-item><wc-tab-item label="Change Log">{% if RecordID != "create" %}<div id="change-log-tab" hx-get="/{{Template.RoutePrefix}}/change_log?collection={{Template.Slug}}&original_id={{RecordID}}" hx-trigger="revealed" hx-swap="innerHTML" hx-indicator="#content-loader" hx-push-url="false"><div class="flex items-center gap-2 text-gray-500 p-4"><wc-fa-icon name="spinner" class="fa-spin"></wc-fa-icon> Loading change history...</div></div>{% else %}<div class="text-center p-4 text-muted">Save the record to view change history</div>{% endif %}</wc-tab-item></wc-tab>` },
      { label: 'Form', category: 'group', description: 'Form configured for HTMX',
        html: '<wc-form class="col gap-3" method="{{FormMethod}}" id="{{Template.Slug}}" action="/{{Template.RoutePrefix}}/{{Template.Slug}}/{{RecordID}}"></wc-form>' },
      { label: 'Article Skeleton', category: 'group', description: 'Loading skeleton',
        html: '<wc-article-skeleton _="on load\n      call WaveHelpers.waitForThenHideAndShow(\'wc-article-skeleton .wc-article-skeleton\', \'.page-content\', 3000, 500)\n    end"></wc-article-skeleton>' },
      // --- Form Patterns ---
      { label: 'Name Fields', category: 'form', description: 'First, M.I., Last in a row',
        html: '<div class="row gap-4"><wc-input name="first_name" lbl-label="First Name" required></wc-input><wc-input name="middle_initial" lbl-label="M.I." class="flex flex-col" style="max-width: 80px;"></wc-input><wc-input name="last_name" lbl-label="Last Name" required></wc-input></div>' },
      { label: 'Address Block', category: 'form', description: 'Street, City, State, Zip',
        html: '<div class="col gap-2"><wc-input name="street" lbl-label="Street" class="col-1"></wc-input><div class="row gap-4"><wc-input name="city" lbl-label="City" class="col-1"></wc-input><wc-input name="state" lbl-label="State" class="flex flex-col" style="max-width: 100px;"></wc-input><wc-input name="postal_code" lbl-label="Zip" class="flex flex-col" style="max-width: 120px;"></wc-input></div></div>' },
      { label: 'Contact Fields', category: 'form', description: 'Email + phone in a row',
        html: '<div class="row gap-4"><wc-input name="email" lbl-label="Email" type="email" class="col-1"></wc-input><wc-input name="phone_number" lbl-label="Phone" type="tel" class="col-1"></wc-input></div>' },
    ];

    // Tag sets for sourceDoc walking — same as canvas
    static _WC_TAGS = new Set([
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
    static _HTML_TAGS = new Set([
      'button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label', 'hr', 'img',
    ]);
    static _SKIP_TAGS = new Set(['option', 'optgroup']);
    // wc-select-safe is used in sourceDoc to preserve <option> children
    static _SAFE_TAG_MAP = { 'wc-select-safe': 'wc-select' };

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

      // Source-of-truth: DOMParser document with clean HTML + designer IDs
      this._sourceDoc = null;
      this._designerIdCounter = 0;
    }

    // =========================================================
    // SOURCE DOCUMENT — single source of truth for all attributes
    // =========================================================

    _generateDesignerId() {
      return `sd${Date.now().toString(36)}${(this._designerIdCounter++).toString(36)}`;
    }

    /**
     * Parse HTML into a DOMParser Document and stamp data-designer-id
     * on every designer-worthy element.
     */
    _initSourceDoc(html) {
      // Use safe parsing to preserve <option> inside <wc-select>.
      // Keep elements as wc-select-safe in sourceDoc — rename only on output.
      const protected_ = html
        .replace(/<wc-select\b/gi, '<wc-select-safe')
        .replace(/<\/wc-select>/gi, '</wc-select-safe>');
      const parser = new DOMParser();
      this._sourceDoc = parser.parseFromString(`<body>${protected_}</body>`, 'text/html');
      this._stampDesignerIdsOnDoc(this._sourceDoc.body);
    }

    /**
     * Walk a parent element and assign data-designer-id to all
     * designer-worthy elements that don't already have one.
     */
    _stampDesignerIdsOnDoc(parent) {
      for (const child of Array.from(parent.children)) {
        const tag = child.tagName.toLowerCase();
        if (WcLiveDesigner._SKIP_TAGS.has(tag)) continue;

        const realTag = WcLiveDesigner._SAFE_TAG_MAP[tag] || tag;
        const isWC = WcLiveDesigner._WC_TAGS.has(realTag);
        const isHTML = WcLiveDesigner._HTML_TAGS.has(realTag);
        const isDiv = realTag === 'div' || realTag === 'fieldset';

        if (isWC || isHTML || isDiv) {
          if (!child.hasAttribute('data-designer-id')) {
            child.setAttribute('data-designer-id', this._generateDesignerId());
          }
        }
        // Always recurse (designer elements can be nested at any depth)
        this._stampDesignerIdsOnDoc(child);
      }
    }

    /**
     * Safely parse HTML with DOMParser. Custom elements like wc-select
     * are temporarily renamed so the HTML parser doesn't strip <option>
     * children (which are only valid inside <select>/<datalist>).
     */
    _safeParse(html) {
      // Protect wc-select options from being stripped by HTML parser
      const protected_ = html
        .replace(/<wc-select\b/gi, '<wc-select-safe')
        .replace(/<\/wc-select>/gi, '</wc-select-safe>');
      const parser = new DOMParser();
      const doc = parser.parseFromString(`<div>${protected_}</div>`, 'text/html');
      return doc;
    }

    _safeSerialize(doc) {
      let html = doc.body.firstElementChild.innerHTML;
      return html
        .replace(/<wc-select-safe\b/gi, '<wc-select')
        .replace(/<\/wc-select-safe>/gi, '</wc-select>');
    }

    /**
     * Stamp designer IDs on an HTML string. Returns the stamped HTML.
     * Used for drag & drop — IDs are assigned before insertion.
     */
    _stampDesignerIdsOnHTML(html) {
      const doc = this._safeParse(html);
      const wrapper = doc.body.firstElementChild;
      this._stampDesignerIdsOnDoc(wrapper);
      return this._safeSerialize(doc);
    }

    /**
     * Serialize sourceDoc innerHTML with data-designer-id intact.
     * This is what gets sent to the canvas for rendering.
     */
    _sourceDocToCanvasHTML() {
      if (!this._sourceDoc) return '';
      return this._sourceDoc.body.innerHTML;
    }

    /**
     * Serialize sourceDoc innerHTML WITHOUT designer attributes.
     * This is the clean HTML for save / Source tab.
     */
    _getCleanHTMLFromSourceDoc() {
      if (!this._sourceDoc) return '';
      // Serialize and rename wc-select-safe back to wc-select
      return this._sourceDoc.body.innerHTML
        .replace(/<wc-select-safe\b/gi, '<wc-select')
        .replace(/<\/wc-select-safe>/gi, '</wc-select>');
    }

    /**
     * Find a sourceDoc node by its designer ID.
     */
    _getSourceNode(designerId) {
      if (!this._sourceDoc) return null;
      return this._sourceDoc.querySelector(`[data-designer-id="${designerId}"]`);
    }

    /**
     * Read properties from a sourceDoc node. Returns a properties object
     * in the same format as the old registry properties.
     */
    _readPropertiesFromSourceNode(designerId) {
      const el = this._getSourceNode(designerId);
      if (!el) return {};

      const tag = el.tagName.toLowerCase();
      const props = {};

      for (const attr of el.attributes) {
        const name = attr.name;
        if (name === 'data-designer-id') continue;
        if (name === 'class') {
          props.css = attr.value;
          continue;
        }
        if (name === 'data-scope') {
          props.scope = attr.value;
          continue;
        }
        props[name] = attr.value;
      }

      // For native HTML elements, get text content
      if (WcLiveDesigner._HTML_TAGS.has(tag)) {
        const textNodes = Array.from(el.childNodes).filter(n => n.nodeType === 3);
        props.content = textNodes.map(n => n.textContent).join('').trim();
      }

      return props;
    }

    /**
     * Update a property on a sourceDoc node.
     */
    _updateSourceDocProperty(designerId, propName, value) {
      const el = this._getSourceNode(designerId);
      if (!el) return;

      if (propName === 'css') {
        if (value) el.setAttribute('class', value);
        else el.removeAttribute('class');
      } else if (propName === 'scope') {
        if (value) el.setAttribute('data-scope', value);
        else el.removeAttribute('data-scope');
      } else if (propName === 'content') {
        // For native elements, update text content
        const textNode = Array.from(el.childNodes).find(n => n.nodeType === 3);
        if (textNode) textNode.textContent = value;
        else el.prepend(el.ownerDocument.createTextNode(value));
      } else {
        const attrName = propName.replace(/_/g, '-');
        if (value === '' || value === true) el.setAttribute(attrName, '');
        else if (value === false || value == null) el.removeAttribute(attrName);
        else el.setAttribute(attrName, String(value));
      }
    }

    /**
     * Remove a node from sourceDoc.
     */
    _removeSourceDocNode(designerId) {
      const el = this._getSourceNode(designerId);
      if (el) el.remove();
    }

    /**
     * Move a node up/down in sourceDoc.
     */
    _moveSourceDocNode(designerId, direction) {
      const el = this._getSourceNode(designerId);
      if (!el) return;
      if (direction === 'up' && el.previousElementSibling) {
        el.parentElement.insertBefore(el, el.previousElementSibling);
      } else if (direction === 'down' && el.nextElementSibling) {
        el.parentElement.insertBefore(el.nextElementSibling, el);
      }
    }

    /**
     * Duplicate a node in sourceDoc. Returns the new stamped HTML for canvas insertion.
     */
    _duplicateSourceDocNode(designerId) {
      const el = this._getSourceNode(designerId);
      if (!el) return null;
      const clone = el.cloneNode(true);
      // Re-stamp all designer IDs (clone has same IDs — need unique ones)
      clone.removeAttribute('data-designer-id');
      clone.querySelectorAll('[data-designer-id]').forEach(c => c.removeAttribute('data-designer-id'));
      this._stampDesignerIdsOnDoc(clone.parentElement || clone);
      // If clone has no parent (standalone), stamp it directly
      if (!clone.hasAttribute('data-designer-id')) {
        clone.setAttribute('data-designer-id', this._generateDesignerId());
      }
      el.after(clone);
      return clone.outerHTML;
    }

    /**
     * Insert HTML into sourceDoc at the specified parent/position.
     * HTML should already have designer IDs stamped.
     */
    _insertIntoSourceDoc(html, parentDesignerId, position) {
      if (!this._sourceDoc) return;
      const doc = this._safeParse(html);
      const newElements = Array.from(doc.body.firstElementChild.children);

      let parent;
      if (parentDesignerId) {
        parent = this._sourceDoc.querySelector(`[data-designer-id="${parentDesignerId}"]`);
      }
      if (!parent) parent = this._sourceDoc.body;

      const designerChildren = Array.from(parent.children).filter(c =>
        c.hasAttribute('data-designer-id')
      );

      for (const el of newElements) {
        const imported = this._sourceDoc.importNode(el, true);
        if (position != null && position < designerChildren.length) {
          parent.insertBefore(imported, designerChildren[position]);
        } else {
          parent.appendChild(imported);
        }
      }
    }

    /**
     * Build a serialized tree from sourceDoc (replaces async getTree).
     */
    _buildTreeFromSourceDoc(parent = null) {
      const root = parent || (this._sourceDoc ? this._sourceDoc.body : null);
      if (!root) return [];
      const elements = [];

      for (const child of root.children) {
        if (!child.hasAttribute('data-designer-id')) continue;
        const tag = child.tagName.toLowerCase();
        const props = {};
        for (const attr of child.attributes) {
          if (attr.name === 'data-designer-id') continue;
          if (attr.name === 'class') { props.css = attr.value; continue; }
          if (attr.name === 'data-scope') { props.scope = attr.value; continue; }
          props[attr.name] = attr.value;
        }
        if (WcLiveDesigner._HTML_TAGS.has(tag)) {
          const text = Array.from(child.childNodes).filter(n => n.nodeType === 3)
            .map(n => n.textContent).join('').trim();
          if (text) props.content = text;
        }

        const realTag = WcLiveDesigner._SAFE_TAG_MAP[tag] || tag;
        const node = { ...props, componentType: realTag, designerId: child.getAttribute('data-designer-id') };

        // Preserve <option> children for wc-select (they don't have designer IDs)
        if (realTag === 'wc-select') {
          const optionHTML = Array.from(child.children)
            .filter(c => c.tagName.toLowerCase() === 'option')
            .map(c => c.outerHTML).join('\n');
          if (optionHTML) node.innerHTML = optionHTML;
        }

        const nested = this._buildTreeFromSourceDoc(child);
        if (nested.length > 0) node.children = nested;
        elements.push(node);
      }
      return elements;
    }

    /**
     * Strip Pongo2 markup for canvas rendering.
     * The Visual canvas shows production-like output — no template tags visible.
     * Source tab and sourceDoc keep the full Pongo2 markup.
     */
    _stripPongo2ForCanvas(html) {
      let result = html;
      // Strip {% %} tags (if/else/endif/for/endfor/set/include/extends/block/endblock)
      result = result.replace(/\{%[\s\S]*?%\}/g, '');
      // Strip {{ }} expressions (Template.Name, FormMethod, RecordID, etc.)
      // These are Go Kart template variables — not needed for visual preview
      result = result.replace(/\{\{([^}]+)\}\}/g, '');
      return result;
    }

    /**
     * Render sourceDoc to the canvas iframe.
     * Strips Pongo2 markup so the Visual tab looks like production.
     */
    /**
     * Collect designer-worthy elements from a DOM tree in depth-first order.
     * Mirrors the bridge's scan() walk order so elements can be correlated by index.
     */
    _collectDesignerElements(parent, result = []) {
      for (const child of parent.children) {
        const tag = child.tagName.toLowerCase();
        if (WcLiveDesigner._SKIP_TAGS.has(tag)) continue;
        const realTag = WcLiveDesigner._SAFE_TAG_MAP[tag] || tag;
        const isWC = WcLiveDesigner._WC_TAGS.has(realTag);
        const isHTML = WcLiveDesigner._HTML_TAGS.has(realTag);
        const isDiv = realTag === 'div' || realTag === 'fieldset';
        if (isWC || isHTML || isDiv) {
          result.push(child);
        }
        // Always recurse — same as bridge scan
        this._collectDesignerElements(child, result);
      }
      return result;
    }

    _renderSourceDocToCanvas() {
      if (!this._sourceDoc || !this._canvasReady) return;
      const rawHTML = this._sourceDocToCanvasHTML();
      const cleanHTML = this._stripPongo2ForCanvas(rawHTML);
      this._postToCanvas('renderHTML', { html: cleanHTML });
    }

    async _render() {
      // Guard against multiple renders — HTMX insertion and wc-tab-item
      // reparenting can trigger connectedCallback multiple times.
      if (this._rendered) return;
      this._rendered = true;

      // Do NOT use display:contents — this component needs to be a real layout
      // box so that style="height:..." from the host page works correctly.
      this.style.display = 'flex';
      this.style.flexDirection = 'column';
      this.style.flex = '1 1 0%';
      this.style.minHeight = '0';
      const canvasUrl = this.getAttribute('canvas-url') || './live-designer-canvas.html';
      const theme = this.getAttribute('theme') || 'theme-ocean dark';

      this.innerHTML = `
        <div class="wc-live-designer flex flex-col h-full">
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
            <div class="ld-palette flex flex-col" style="width: 260px; min-width: 200px; max-width: 400px; background: var(--surface-2); overflow-y: auto; max-height: calc(100vh - 310px);">
              <wc-tab class="flex flex-col flex-1 min-h-0 text-xs" animate tab-overflow="scroll">
                <wc-tab-item class="active" label="Containers">
                  <div class="ld-palette-tab-content">
                    <input class="ld-palette-search" type="search" placeholder="Filter..." />
                    <div class="ld-palette-scroll">
                      ${WcLiveDesigner.CONTAINERS.map(c => `
                        <div class="ld-palette-item" data-html='${c.html.replace(/'/g, "&#39;")}' draggable="true">${c.label}</div>
                      `).join('')}
                    </div>
                  </div>
                </wc-tab-item>
                <wc-tab-item label="Elements">
                  <div class="ld-palette-tab-content">
                    <input class="ld-palette-search" type="search" placeholder="Filter..." />
                    <div class="ld-palette-scroll">
                      ${WcLiveDesigner.ELEMENTS.map(c => `
                        <div class="ld-palette-item" data-html='${c.html.replace(/'/g, "&#39;")}' draggable="true">${c.label}</div>
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
                <wc-tab-item label="Presets">
                  <div class="ld-palette-tab-content">
                    <input class="ld-palette-search" type="search" placeholder="Filter..." />
                    <div class="ld-presets ld-palette-scroll">
                      ${this._buildPresetItems()}
                    </div>
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
                  <div class="ld-canvas-visual flex-1 flex flex-col overflow-hidden" style="height: calc(100vh - 310px); position: relative;">
                    <div class="ld-canvas-loading" style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--surface-1, #111); z-index: 10; color: var(--text-6, #888); font-family: system-ui, sans-serif; gap: 12px;">
                      <wc-fa-icon name="spinner" spin size="48px"></wc-fa-icon>
                      <span style="font-size: 14px;">Loading preview...</span>
                    </div>
                    <iframe class="ld-canvas-iframe" data-src="${canvasUrl}" style="border: none; flex: 1 1 0%; min-height: 0; width: 100%;"></iframe>
                  </div>
                </wc-tab-item>
                <wc-tab-item label="Source">
                  <div class="ld-source-panel flex flex-col flex-1 min-h-0" style="height: 100%; overflow: hidden;"></div>
                </wc-tab-item>
              </wc-tab>
            </div>

            <!-- Right Resize Handle -->
            <div class="ld-resize-handle" data-resize="right" title="Drag to resize">⋮</div>

            <!-- Right Panel: Properties -->
            <div class="ld-properties flex flex-col" style="width: 280px; min-width: 200px; max-width: 500px; background: var(--surface-2); overflow-y: auto; max-height: calc(100vh - 310px);">
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

      // Defer iframe src — parent components (wc-tab-item) reparent children
      // during initialization which disconnects the iframe and cancels any
      // in-flight load. Wait for DOM to settle before setting src.
      const iframe = this.querySelector('.ld-canvas-iframe');
      if (iframe) {
        const src = iframe.dataset.src;
        setTimeout(() => { iframe.src = src; }, 500);
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

    _buildPresetItems() {
      const categories = { page: 'Page Starters', layout: 'Layouts', group: 'Component Groups', form: 'Form Patterns' };
      const grouped = {};
      for (const preset of WcLiveDesigner.PRESETS) {
        const cat = preset.category || 'other';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(preset);
      }

      let html = '';
      for (const [cat, label] of Object.entries(categories)) {
        if (!grouped[cat]) continue;
        html += `<div style="font-size: 10px; color: var(--text-6); font-weight: 600; padding: 6px 4px 2px; text-transform: uppercase; letter-spacing: 0.5px;">${label}</div>`;
        for (let i = 0; i < grouped[cat].length; i++) {
          const preset = grouped[cat][i];
          const idx = WcLiveDesigner.PRESETS.indexOf(preset);
          html += `<div class="ld-palette-item ld-preset-item" data-preset-index="${idx}" title="${preset.description || ''}" style="cursor: pointer;">${preset.label}</div>`;
        }
      }
      return html;
    }

    _appendPreset(presetIndex) {
      const preset = WcLiveDesigner.PRESETS[presetIndex];
      if (!preset || !preset.tree) return;
      // If a container is selected, append inside it; otherwise append to canvas root
      const parentId = this._selectedComponent?.designerId || null;
      this._postToCanvas('appendTree', { tree: preset.tree, parentId });
      // Refresh layers after a delay to let components render
      setTimeout(() => this._updateLayerTree(), 500);
    }

    _applyStyle() {
      const style = `
        wc-live-designer { display: flex; flex-direction: column; flex: 1 1 0%; min-height: 0; }
        .ld-palette-item {
          padding: 6px 10px; background: var(--surface-3); border-radius: 4px;
          cursor: grab; font-size: 12px; user-select: none;
        }
        .ld-palette-item:hover { background: var(--surface-4) !important; }
        .ld-palette-item:active { opacity: 0.6; }
        .ld-preset-item { cursor: pointer !important; border-left: 3px solid var(--primary, #3b97e3); }
        .ld-preset-item:hover { border-left-color: var(--primary-light, #5bb0f0) !important; }
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

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

        /* Source editor — must stay within the view, never overflow */
        .ld-source-panel {
          overflow: hidden !important;
        }
        .ld-source-panel .ld-source-editor {
          display: flex !important;
          flex-direction: column !important;
          flex: 1 1 0% !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        .ld-source-panel .ld-source-editor .wc-code-mirror {
          flex: 1 1 0% !important;
          min-height: 0 !important;
          overflow: hidden !important;
        }
        .ld-source-panel .ld-source-editor .wc-code-mirror .CodeMirror {
          flex: 1 1 0% !important;
          min-height: 0 !important;
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
            // Update savedContent and rebuild sourceDoc
            this._savedContent = editedHTML;
            const canvasHTML = this._reversePongo2(editedHTML);
            this._initSourceDoc(canvasHTML);
            // Reload the iframe to re-render with updated content
            // For now, use renderHTML until server POST endpoint is ready
            this._renderSourceDocToCanvas();
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

      // Palette drag — send HTML via dataTransfer, canvas inserts it
      this.querySelectorAll('.ld-palette-item:not(.ld-preset-item)').forEach(item => {
        item.addEventListener('dragstart', (e) => {
          const html = item.dataset.html;
          if (!html) return;
          const stampedHTML = this._stampDesignerIdsOnHTML(html);
          const canvasHTML = this._stripPongo2ForCanvas(stampedHTML);
          e.dataTransfer.setData('application/json', JSON.stringify({ type: 'element', html: canvasHTML, sourceHtml: stampedHTML }));
          e.dataTransfer.effectAllowed = 'copy';
          const ghost = document.createElement('div');
          ghost.textContent = item.textContent;
          ghost.style.cssText = 'position:fixed;top:-100px;left:-100px;padding:6px 12px;background:#3b97e3;color:#fff;border-radius:4px;font-size:12px;font-family:system-ui,sans-serif;z-index:9999;pointer-events:none;';
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 0, 0);
          setTimeout(() => ghost.remove(), 0);
        });
      });

      // Preset handlers — drag only (same workflow as single components)
      this.querySelectorAll('.ld-preset-item').forEach(item => {
        item.draggable = true;
        item.addEventListener('dragstart', (e) => {
          const idx = parseInt(item.dataset.presetIndex);
          const preset = WcLiveDesigner.PRESETS[idx];
          if (!preset) return;
          const stampedPresetHTML = this._stampDesignerIdsOnHTML(preset.html);
          const canvasPresetHTML = this._stripPongo2ForCanvas(stampedPresetHTML);
          e.dataTransfer.setData('application/json', JSON.stringify({ preset: true, html: canvasPresetHTML, sourceHtml: stampedPresetHTML }));
          e.dataTransfer.effectAllowed = 'copy';

          const ghost = document.createElement('div');
          ghost.textContent = preset.label;
          ghost.style.cssText = 'position:fixed;top:-100px;left:-100px;padding:6px 12px;background:#e6a23c;color:#fff;border-radius:4px;font-size:12px;font-family:system-ui,sans-serif;z-index:9999;pointer-events:none;';
          document.body.appendChild(ghost);
          e.dataTransfer.setDragImage(ghost, 0, 0);
          setTimeout(() => ghost.remove(), 0);
        });
      });

    }

    _unWireEvents() {
      window.removeEventListener('message', this._handleMessage);
    }

    /**
     * Build an HTML string from a component type and properties object.
     * Used by the Fields tab to convert schema-inferred defaults into HTML for drag-drop.
     */
    _buildElementHTML(type, props) {
      const attrs = [];
      let content = '';
      let innerHTML = '';
      for (const [key, value] of Object.entries(props)) {
        if (key === 'css') { attrs.push(`class="${value}"`); continue; }
        if (key === 'content') { content = value; continue; }
        if (key === 'innerHTML') { innerHTML = value; continue; }
        if (key === 'scope') { attrs.push(`data-scope="${value}"`); continue; }
        if (value === '' || value === true) { attrs.push(key); }
        else if (value !== false && value != null) { attrs.push(`${key}="${value}"`); }
      }
      const attrStr = attrs.length ? ' ' + attrs.join(' ') : '';
      const body = innerHTML || content;
      if (type === 'hr') return `<hr${attrStr}>`;
      return `<${type}${attrStr}>${body}</${type}>`;
    }

    disconnectedCallback() {
      // Do NOT remove the message listener here — reparenting by wc-tab-item
      // causes disconnect/reconnect, and removing the listener means we miss
      // the canvasReady message from the iframe. The bound reference prevents
      // duplicate listeners when addEventListener is called again.
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
      if (!iframe || !canvasArea) return;

      if (this._currentZoom === 'fit') {
        const areaRect = canvasArea.getBoundingClientRect();
        // Skip fit calculation if the area isn't visible yet (e.g., hidden tab)
        if (areaRect.width < 50 || areaRect.height < 50) {
          iframe.style.transform = '';
          iframe.style.transformOrigin = '';
          return;
        }
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

          // Wire drag — build HTML from type + defaults, send to canvas
          item.addEventListener('dragstart', (e) => {
            const type = item.dataset.type;
            const defaults = JSON.parse(item.dataset.defaults);
            // Build HTML tag from type and defaults
            const html = this._buildElementHTML(type, defaults);
            const stampedFieldHTML = this._stampDesignerIdsOnHTML(html);
            e.dataTransfer.setData('application/json', JSON.stringify({ type: 'element', html: stampedFieldHTML }));
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

    /**
     * Resolve anyOf patterns from LiteSpec into a flat property descriptor.
     * E.g., { anyOf: [{type:"string",format:"date-time"},{type:"string",enum:[""]}] }
     * becomes { type:"string", format:"date-time" }
     */
    _resolveAnyOf(prop) {
      if (!prop.anyOf || !Array.isArray(prop.anyOf)) return prop;
      // Pick the most descriptive variant (one with format, enum, or specific type)
      for (const variant of prop.anyOf) {
        if (variant.format) return { ...prop, ...variant, anyOf: undefined };
        if (variant.enum && variant.enum.length > 0 && !(variant.enum.length === 1 && variant.enum[0] === '')) {
          return { ...prop, ...variant, anyOf: undefined };
        }
      }
      // Fall back to first variant with a type
      for (const variant of prop.anyOf) {
        if (variant.type) return { ...prop, ...variant, anyOf: undefined };
      }
      return prop;
    }

    _inferComponentType(name, prop) {
      prop = this._resolveAnyOf(prop);
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
      prop = this._resolveAnyOf(prop);
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

    async _generateSampleFromSchema(schemaSlug) {
      try {
        const response = await fetch(`${this._getApiBase()}/api/_schema_builder/slug/${schemaSlug}/json_schema`);
        if (!response.ok) return;

        let responseData = await response.json();
        let jsonSchema = responseData.result !== undefined ? responseData.result : responseData;
        while (typeof jsonSchema === 'string') {
          try { jsonSchema = JSON.parse(jsonSchema); } catch (e) { break; }
        }
        if (!jsonSchema?.properties) return;

        const sample = {};
        for (const [name, prop] of Object.entries(jsonSchema.properties)) {
          sample[name] = this._generateFieldValue(name, prop);
        }

        this.setSampleData(sample);
      } catch (err) {
        console.warn('[wc-live-designer] Could not generate sample data:', err);
      }
    }

    _generateFieldValue(name, prop) {
      prop = this._resolveAnyOf(prop);
      // System/meta fields
      if (name === '_id') return '507f1f77bcf86cd799439011';
      if (name === 'created_by' || name === 'modified_by') return 'admin';
      if (name === 'created_date') return '2026-01-15T10:30:00Z';
      if (name === 'modified_date') return new Date().toISOString();

      // Enum — pick the first value
      if (prop.enum?.length > 0) return prop.enum[0];

      // Boolean
      if (prop.type === 'boolean') return true;

      // Number / Integer
      if (prop.type === 'integer') {
        if (name.includes('age')) return 32;
        if (name.includes('count') || name.includes('quantity')) return 5;
        if (name.includes('version')) return 1;
        return 42;
      }
      if (prop.type === 'number') {
        if (name.includes('amount') || name.includes('price') || name.includes('cost')) return 1500.00;
        if (name.includes('rate') || name.includes('percent')) return 7.5;
        return 100.00;
      }

      // Array
      if (prop.type === 'array') {
        if (prop.items?.type === 'object' && prop.items?.properties) {
          const item = {};
          for (const [k, v] of Object.entries(prop.items.properties)) {
            item[k] = this._generateFieldValue(k, v);
          }
          return [item, { ...item }];
        }
        return ['item1', 'item2'];
      }

      // Object
      if (prop.type === 'object' && prop.properties) {
        const obj = {};
        for (const [k, v] of Object.entries(prop.properties)) {
          obj[k] = this._generateFieldValue(k, v);
        }
        return obj;
      }

      // String — infer realistic values from field name
      if (prop.format === 'date-time' || name.includes('date')) return '2026-03-24';
      if (prop.format === 'email' || name.includes('email')) return 'jane.doe@example.com';
      if (name.includes('phone') || name.includes('tel')) return '(555) 123-4567';
      if (name.includes('url') || name.includes('website') || name.includes('link')) return 'https://example.com';

      // Name fields
      if (name === 'first_name') return 'Jane';
      if (name === 'last_name') return 'Doe';
      if (name === 'middle_initial' || name === 'middle_name') return 'M';
      if (name === 'name' || name === 'full_name') return 'Jane Doe';
      if (name === 'username') return 'janedoe';

      // Address fields
      if (name === 'street' || name.includes('address')) return '123 Main Street';
      if (name === 'city') return 'Charlotte';
      if (name === 'state') return 'NC';
      if (name === 'zip' || name.includes('postal')) return '28202';
      if (name === 'country') return 'US';

      // Common fields
      if (name === 'title') return 'Sample Title';
      if (name === 'slug') return 'sample-title';
      if (name === 'description' || name === 'summary') return 'This is a sample description for design-time preview.';
      if (name === 'notes' || name === 'comments' || name === 'bio') return 'Some sample notes...';
      if (name === 'category' || name === 'type') return 'general';
      if (name === 'status' || name === 'record_status') return 'active';
      if (name === 'gender') return 'female';
      if (name === 'company' || name === 'organization') return 'Acme Corp';
      if (name === 'department') return 'Engineering';
      if (name === 'role' || name === 'job_title' || name === 'position') return 'Developer';

      // Fallback — use the field name as title case
      return this._toProper(name);
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
          // Hide loading overlay
          const loadingEl = this.querySelector('.ld-canvas-loading');
          if (loadingEl) loadingEl.style.display = 'none';
          // Inherit theme from parent page if not explicitly set
          const theme = this.getAttribute('theme') ||
                        document.documentElement.className ||
                        'theme-ocean dark';
          this._postToCanvas('setTheme', { theme });
          if (Object.keys(this._sampleData).length > 0) {
            this._postToCanvas('setSampleData', { data: this._sampleData });
          }
          // Auto-load schema if attribute is set
          const schemaSlug = this.getAttribute('schema');
          if (schemaSlug) {
            const schemaSelect = this.querySelector('.ld-schema-select');
            if (schemaSelect) {
              this._loadSchemaList(schemaSelect).then(() => {
                schemaSelect.value = schemaSlug;
                this._loadSchemaFields(schemaSlug);
              });
            }
            // If no sample data was loaded from the API, generate from schema
            if (Object.keys(this._sampleData).length === 0) {
              this._generateSampleFromSchema(schemaSlug);
            }
          }
          // Build sourceDoc if not already built by setContent
          if (this._savedContent && !this._sourceDoc) {
            let canvasHTML = this._savedContent
              .replace(/\{%\s*extends\s+[^%]*%\}/g, '')
              .replace(/\{%\s*block\s+\w+\s*%\}/g, '')
              .replace(/\{%\s*endblock\s*%\}/g, '')
              .replace(/\{%\s*include\s+[^%]*%\}/g, '')
              .trim();
            canvasHTML = this._reversePongo2(canvasHTML);
            this._initSourceDoc(canvasHTML);
          } else if (this._pendingTree) {
            const html = this._treeToHTML(this._pendingTree);
            this._initSourceDoc(html);
            this._pendingTree = null;
          }
          break;

        case 'select':
          // Use properties sent by the bridge (read from rendered DOM + inner elements)
          // Falls back to sourceDoc if bridge didn't send properties
          const selectProps = e.data.properties || this._readPropertiesFromSourceNode(e.data.designerId);
          this._selectedComponent = {
            designerId: e.data.designerId,
            type: e.data.type,
            properties: selectProps
          };
          this._showPropertyPanel(e.data.type, selectProps, e.data.designerId);
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
          this._updateLayerTree();
          break;

        case 'componentRemoved':
          // Remove from sourceDoc, then refresh layer tree
          if (e.data.designerId) {
            this._removeSourceDocNode(e.data.designerId);
            // Invalidate stale Source editor content so save uses sourceDoc
            this._lastEditedSourceHTML = null;
            this._lastSourceHTML = null;
          }
          this._updateLayerTree();
          break;

        case 'componentMoved':
          // Sync move in sourceDoc
          if (e.data.designerId && e.data.direction) {
            this._moveSourceDocNode(e.data.designerId, e.data.direction);
            this._lastEditedSourceHTML = null;
            this._lastSourceHTML = null;
          }
          this._updateLayerTree();
          break;

        case 'componentInserted':
          // Sync insertion into sourceDoc
          if (e.data.html) {
            if (!this._sourceDoc) {
              const parser = new DOMParser();
              this._sourceDoc = parser.parseFromString('<body></body>', 'text/html');
            }
            this._insertIntoSourceDoc(e.data.html, e.data.parentId, e.data.position);
            // Invalidate stale Source editor content so save uses sourceDoc
            this._lastEditedSourceHTML = null;
            this._lastSourceHTML = null;
          }
          this._updateLayerTree();
          break;

        case 'duplicateRequest':
          // Handle duplication via sourceDoc
          if (e.data.designerId) {
            const cloneHTML = this._duplicateSourceDocNode(e.data.designerId);
            if (cloneHTML) {
              // Find the original element's parent and position for canvas insertion
              const origNode = this._getSourceNode(e.data.designerId);
              if (origNode) {
                const parentNode = origNode.parentElement;
                const parentId = parentNode?.getAttribute('data-designer-id') || null;
                // Clone is already inserted after original in sourceDoc
                // Tell canvas to insert the clone HTML after the original
                this._postToCanvas('insertHTML', { html: cloneHTML, parentId, position: null });
              }
            }
          }
          break;

        case 'registryBuilt':
          // Map bridge IDs to sourceDoc elements by matching walk order
          if (e.data.elements && this._sourceDoc) {
            this._bridgeToSourceMap = new Map();
            const sourceElements = this._collectDesignerElements(this._sourceDoc.body);
            const bridgeElements = e.data.elements;
            for (let i = 0; i < Math.min(sourceElements.length, bridgeElements.length); i++) {
              if (sourceElements[i].tagName.toLowerCase() === bridgeElements[i].type) {
                this._bridgeToSourceMap.set(bridgeElements[i].id, sourceElements[i]);
                // Also stamp the bridge ID on the sourceDoc element for consistency
                sourceElements[i].setAttribute('data-designer-id', bridgeElements[i].id);
              }
            }
          }
          this._updateLayerTree();
          break;
      }
    }

    // --- Source View ---

    async _updateSourceView() {
      try {
        const rawHTML = this.getHTML();
        if (!rawHTML) return;
        const pongo2HTML = this.transformToPongo2(rawHTML);
        const formattedInner = this._formatHTML(pongo2HTML);

        // Show the FULL renderable template — exactly what gets saved
        const templateType = this.getAttribute('template-type') || 'standard';
        const fullTemplate = this._wrapContent(formattedInner, templateType);
        this._lastSourceHTML = fullTemplate;

        const panel = this.querySelector('.ld-source-panel');
        if (!panel) return;

        // Create the editor once, then just update its value on subsequent calls.
        // This matches how wc-code-mirror works in Go Kart's template edit tabs.
        let cmEl = panel.querySelector('.ld-source-editor');
        if (!cmEl) {
          panel.innerHTML = `<wc-code-mirror class="ld-source-editor flex flex-col flex-1 min-h-0" name="ld-source" mode="htmlmixed" theme="monokai" line-numbers line-wrapping height="calc(100vh - 310px)" tab-size="2" value=""></wc-code-mirror>`;
          cmEl = panel.querySelector('.ld-source-editor');
        }

        const setEditorValue = () => {
          if (cmEl.editor) {
            cmEl.editor.setValue(fullTemplate);
            setTimeout(() => cmEl.editor?.refresh(), 50);
            // Track changes — only wire once
            if (!cmEl._changeWired) {
              cmEl._changeWired = true;
              cmEl.editor.on('change', () => {
                this._lastEditedSourceHTML = cmEl.editor.getValue();
              });
            }
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
     * Load HTML into the canvas — converts Pongo2 templates back to
     * canvas-friendly HTML and renders via innerHTML (V2 architecture).
     *
     * @param {string} html - HTML string, may contain Pongo2 expressions
     */
    async loadHTML(html) {
      if (!html?.trim()) return;

      // Strip Pongo2 block wrappers ({% extends %}, {% block %}, {% endblock %}, {% include %})
      // to get just the component HTML
      let canvasHTML = html
        .replace(/\{%\s*extends\s+[^%]*%\}/g, '')
        .replace(/\{%\s*block\s+\w+\s*%\}/g, '')
        .replace(/\{%\s*endblock\s*%\}/g, '')
        .replace(/\{%\s*include\s+[^%]*%\}/g, '')
        .trim();

      // Reverse Pongo2 data expressions to data-scope + sample data
      canvasHTML = this._reversePongo2(canvasHTML);

      // Build sourceDoc (source of truth) and stamp designer IDs
      this._initSourceDoc(canvasHTML);

      // Send stamped HTML to canvas for rendering
      this._renderSourceDocToCanvas();
    }

    _getSampleValue(fieldName) {
      if (!this._sampleData || !fieldName) return undefined;
      return fieldName.split('.').reduce((o, k) => (o && o[k] !== undefined) ? o[k] : undefined, this._sampleData);
    }

    // --- Form Integration ---

    /**
     * Get the generated content, code, and field rules for form submission.
     * Output is determined by templateType — the canvas content is always
     * the single source of truth (no hard-coded structure injected).
     *
     * @param {Object} options
     * @param {string} options.slug - Template slug
     * @param {string} options.collectionName - Collection name
     * @param {string} options.schemaSlug - Schema slug
     * @param {string} options.routePrefix - 'x' or 'v'
     * @param {string} options.prevTemplateSlug - Previous (list) template slug for back navigation
     * @param {string} options.nextTemplateSlug - Next (edit) template slug for record navigation
     * @param {string} options.templateType - 'standard', 'fragment', 'email', 'data', 'report'
     * @returns {Promise<{ content: string, code: string, field_rules: string, tree: string }>}
     */
    getFormData(options = {}) {
      const slug = options.slug || 'template';
      const collectionName = options.collectionName || slug;
      const schemaSlug = options.schemaSlug || slug;
      const routePrefix = options.routePrefix || 'x';
      const prevTemplateSlug = options.prevTemplateSlug || '';
      const nextTemplateSlug = options.nextTemplateSlug || '';
      const templateType = options.templateType || 'standard';

      // If Source tab was edited, use that content directly — it's already
      // the full Pongo2 template ({% extends %}, {{ Record.field }}, etc.)
      let content;
      if (this._lastEditedSourceHTML != null &&
          this._lastEditedSourceHTML !== this._lastSourceHTML) {
        content = this._lastEditedSourceHTML;
        // Also rebuild sourceDoc from the edited source
        const canvasHTML = this._reversePongo2(
          content.replace(/\{%\s*extends\s+[^%]*%\}/g, '')
            .replace(/\{%\s*block\s+\w+\s*%\}/g, '')
            .replace(/\{%\s*endblock\s*%\}/g, '')
            .replace(/\{%\s*include\s+[^%]*%\}/g, '')
            .trim()
        );
        this._initSourceDoc(canvasHTML);
      } else {
        const rawHTML = this.getHTML();
        const formHTML = this.transformToPongo2(rawHTML);
        const formatted = this._formatHTML(formHTML);
        content = this._wrapContent(formatted, templateType);
      }

      const code = this._generateCode(templateType);
      const tree = this.getTree();
      return { content, code, field_rules: '', tree: JSON.stringify(tree) };
    }

    /**
     * Wrap canvas HTML with the appropriate boilerplate for the template type.
     * The canvas content is never modified — only the wrapper changes.
     */
    _wrapContent(formHTML, templateType) {
      switch (templateType) {
        case 'fragment':
          // Fragments are raw HTML — no extends, no blocks
          return formHTML;

        case 'email':
          // Email templates are standalone HTML
          return formHTML;

        case 'data':
          // Data templates have no HTML
          return '';

        case 'report':
          // Reports use standard block wrapper
          return `{% extends "__template_name__" %}

{% block css %}
{% endblock %}

{% block pageContent %}
${formHTML}
{% endblock %}

{% block js %}
{% endblock %}`;

        case 'standard':
        default: {
          // Standard templates extend base with pageContent block.
          // Inject {% include "meta_fields" %} after every <wc-form ...> tag.
          const withMetaFields = formHTML.replace(
            /(<wc-form[^>]*>)/g,
            '$1\n  {% include "meta_fields" %}'
          );
          return `{% extends "__template_name__" %}

{% block css %}
{% endblock %}

{% block pageContent %}
${withMetaFields}
{% endblock %}

{% block js %}
{% endblock %}`;
        }
      }
    }

    /**
     * Generate the code tab based on template type.
     */
    _generateCode(templateType) {
      const now = new Date().toISOString();
      const header = `/**\n* Generated by wc-live-designer\n* Timestamp: ${now}\n*/`;

      switch (templateType) {
        case 'fragment':
          // Fragments typically have minimal or no code
          return `${header}

function runGet() {
  return {};
}`;

        case 'email':
          return `${header}

function runGet() {
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
  return {record};
}`;

        case 'data':
          return `${header}

function runGet() {
  return {};
}

function runPost() {
  return {};
}`;

        case 'report':
          return `${header}

function runGet() {
  return {};
}`;

        case 'standard':
        default:
          return `${header}

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
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, id);
  ctx.App.Session.Put(ctx.Request.Context(), "flash", "Save successful!");
  return {record};
}

function runPost() {
  let id = ctx.RecordID;
  let schemaSlug = rdx.AppData.SchemaBuilder && rdx.AppData.SchemaBuilder.Slug ? rdx.AppData.SchemaBuilder.Slug : rdx.AppData.Template.Schema;
  id = ctx.DB.SaveAndValidate(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID, form, schemaSlug, [], []);
  let record = ctx.DB.FindByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, id);
  ctx.App.Session.Put(ctx.Request.Context(), "flash", "Save successful!");
  return {id, record};
}

function runDelete() {
  ctx.DB.DeleteByID(rdx.ConnName, rdx.DBName, rdx.AppData.Template.CollectionName, ctx.RecordID);
}`;
      }
    }

    // --- Layer Tree ---

    _updateLayerTree() {
      // Build tree directly from sourceDoc — no iframe round-trip
      const tree = this._buildTreeFromSourceDoc();
      this._renderLayerTree(tree);
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
        const compType = node.componentType || node.type || '';
        const row = document.createElement('div');
        row.className = 'ld-layer-node';
        row.style.setProperty('--depth', depth);
        row.setAttribute('data-layer-id', node.designerId);

        if (this._selectedComponent?.designerId === node.designerId) {
          row.classList.add('active');
        }

        const icon = icons[compType] || '◇';
        const scope = node.scope ? `[${node.scope}]` : '';
        const typeName = compType.replace('wc-', '');

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

      // Native HTML elements vs Wave CSS components
      const nativeElements = new Set(['button', 'a', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 'label', 'img', 'hr']);
      const isNative = nativeElements.has(type);

      // Common properties — adapted for native vs web component
      const commonProps = [];
      if (!isNative) {
        commonProps.push({ name: 'scope', label: 'Data Scope', type: 'text', value: properties.scope || '' });
        commonProps.push({ name: 'name', label: 'Name', type: 'text', value: properties.name || '' });
        commonProps.push({ name: 'lbl-label', label: 'Label', type: 'text', value: properties['lbl-label'] || '' });
      } else {
        commonProps.push({ name: 'content', label: 'Text Content', type: 'text', value: properties.content || '' });
      }
      commonProps.push({ name: 'css', label: 'CSS Classes', type: 'text', value: properties.css || '' });

      // Native element-specific properties
      if (type === 'a') {
        commonProps.push({ name: 'href', label: 'URL', type: 'text', value: properties.href || '' });
        commonProps.push({ name: 'target', label: 'Target', type: 'select', value: properties.target || '', options: ['', '_blank', '_self'] });
      } else if (type === 'img') {
        commonProps.push({ name: 'src', label: 'Source URL', type: 'text', value: properties.src || '' });
        commonProps.push({ name: 'alt', label: 'Alt Text', type: 'text', value: properties.alt || '' });
      } else if (type === 'button') {
        commonProps.push({ name: 'type', label: 'Type', type: 'select', value: properties.type || 'button', options: ['button', 'submit', 'reset'] });
      }

      // Type-specific properties for web components
      // Show value as Pongo2 expression when data-scope exists (matches Source tab)
      const scopedValue = properties.scope ? `{{ Record.${properties.scope} }}` : (properties.value || '');

      if (type === 'wc-input') {
        commonProps.push({ name: 'type', label: 'Input Type', type: 'select', value: properties.type || 'text',
          options: ['text', 'email', 'tel', 'date', 'number', 'currency', 'checkbox', 'password', 'search', 'url'] });
        commonProps.push({ name: 'value', label: 'Value', type: 'text', value: scopedValue });
        commonProps.push({ name: 'placeholder', label: 'Placeholder', type: 'text', value: properties.placeholder || '' });
        commonProps.push({ name: 'required', label: 'Required', type: 'checkbox', value: properties.required != null && properties.required !== false });
        commonProps.push({ name: 'toggle-switch', label: 'Toggle Switch', type: 'checkbox', value: properties['toggle-switch'] != null && properties['toggle-switch'] !== false });
      } else if (type === 'wc-select') {
        commonProps.push({ name: 'value', label: 'Value', type: 'text', value: scopedValue });
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
        commonProps.push({ name: 'value', label: 'Value', type: 'text', value: scopedValue });
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
          const propName = input.dataset.prop;

          // When value is changed to a {{ Record.FIELD }} expression,
          // also update data-scope to match (they're linked)
          if (propName === 'value') {
            const match = val.match(/\{\{\s*Record\.(\S+)\s*\}\}/);
            if (match) {
              const newScope = match[1];
              this._updateSourceDocProperty(designerId, 'scope', newScope);
              this._postToCanvas('updateProperty', { designerId, propName: 'scope', value: newScope });
              // Update the Data Scope field in the panel if visible
              const scopeInput = fieldsEl.querySelector('[data-prop="scope"]');
              if (scopeInput) scopeInput.value = newScope;
            }
          }

          // Update sourceDoc (source of truth) first
          this._updateSourceDocProperty(designerId, propName, val);
          // Then update canvas for visual feedback
          this._postToCanvas('updateProperty', { designerId, propName, value: val });
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
     * Set the saved template content to reload into the canvas.
     * Call this before the canvas is ready — it will load when canvasReady fires.
     * @param {string} content - Full Pongo2 template content from Record.content
     */
    setContent(content) {
      this._savedContent = content;
      // Build sourceDoc from saved content — server already rendered the iframe,
      // so we DON'T send renderHTML (that would replace the server output)
      const canvasHTML = (content || '')
        .replace(/\{%\s*extends\s+[^%]*%\}/g, '')
        .replace(/\{%\s*block\s+\w+\s*%\}/g, '')
        .replace(/\{%\s*endblock\s*%\}/g, '')
        .replace(/\{%\s*include\s+[^%]*%\}/g, '')
        .trim();
      if (canvasHTML) {
        const reversed = this._reversePongo2(canvasHTML);
        this._initSourceDoc(reversed);
      }
    }

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
     * Load a saved component tree into the canvas.
     * Accepts the same JSON array returned by getTree().
     * @param {Array} tree - Serialized component tree
     */
    async loadTree(tree) {
      if (!tree || !Array.isArray(tree) || tree.length === 0) return;
      // Content is authoritative — don't overwrite with tree
      if (this._savedContent) return;

      if (!this._canvasReady) {
        this._pendingTree = tree;
        return;
      }

      // Convert tree to HTML, build sourceDoc (source of truth), then render
      const html = this._treeToHTML(tree);
      this._initSourceDoc(html);
      this._renderSourceDocToCanvas();
    }

    _treeToHTML(tree) {
      return tree.map(node => {
        const { componentType, children, css, content, scope, innerHTML, ...attrs } = node;
        const tag = componentType;

        let attrStr = '';
        if (css) attrStr += ` class="${css}"`;
        if (scope) attrStr += ` data-scope="${scope}"`;
        for (const [key, value] of Object.entries(attrs)) {
          if (key === 'componentType') continue;
          // Include designerId as data-designer-id attribute
          if (key === 'designerId') {
            if (value) attrStr += ` data-designer-id="${value}"`;
            continue;
          }
          if (value === '' || value === true) attrStr += ` ${key}`;
          else if (value !== false && value != null) attrStr += ` ${key}="${value}"`;
        }

        if (tag === 'hr') return `<${tag}${attrStr}>`;

        let childHTML = '';
        if (innerHTML) childHTML += innerHTML;
        // Generate options from data-enum if wc-select has no innerHTML
        if (tag === 'wc-select' && !innerHTML && attrs['data-enum']) {
          const enums = attrs['data-enum'].split(',');
          childHTML += '<option value="">Choose...</option>\n' +
            enums.map(v => `<option value="${v}">${v.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</option>`).join('\n');
        }
        if (children && children.length > 0) childHTML += this._treeToHTML(children);
        if (content && !innerHTML) childHTML += content;

        return `<${tag}${attrStr}>${childHTML}</${tag}>`;
      }).join('\n');
    }

    /**
     * Get the serialized component tree from the canvas.
     * @returns {Promise<Array>}
     */
    getTree() {
      // Synchronous read from sourceDoc — no iframe round-trip needed
      return this._buildTreeFromSourceDoc();
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
      // Synchronous read from sourceDoc — no iframe round-trip needed
      return this._getCleanHTMLFromSourceDoc();
    }

    /**
     * Transform raw canvas HTML into Pongo2 template content.
     * Replaces sample data values with {{ Record.field }} expressions.
     * @param {string} rawHTML - HTML from getHTML()
     * @returns {string} Pongo2 template content
     */
    transformToPongo2(rawHTML) {
      const doc = this._safeParse(rawHTML);
      const root = doc.body.firstElementChild;

      root.querySelectorAll('[data-scope]').forEach(el => {
        const scope = el.getAttribute('data-scope');
        if (!scope) return;
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
          // Keep data-source, placeholder-option, data-enum in output
          // — they're needed by the designer property panel on reload
          // and are harmless in production (wc-select ignores unknown attrs)

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

      let html = this._safeSerialize(doc);

      // Handle checkbox Pongo2 markers
      html = html.replace(/data-pongo2-checked="([^"]+)"/g, (match, pongo2) => {
        return pongo2;
      });

      return html;
    }

    /**
     * Reverse Pongo2 template expressions back to canvas-friendly HTML.
     * Converts {{ Record.field }} → data-scope="field" + sample data value.
     * Used when switching from Source tab back to Visual tab.
     * @param {string} html - HTML with Pongo2 expressions
     * @returns {string} Clean HTML with data-scope attributes and sample values
     */
    _reversePongo2(html) {
      let result = html;

      // 1. Checkbox pattern: {% if Record.FIELD %} checked {% endif %}
      result = result.replace(
        /\{%\s*if\s+Record\.(\S+)\s*%\}\s*checked\s*\{%\s*endif\s*%\}/g,
        (match, field) => {
          const sample = this._getSampleValue(field);
          return `data-scope="${field}"${sample ? ' checked' : ''}`;
        }
      );

      // 2. Currency: value="{{ Record.FIELD|floatformat:N }}"
      result = result.replace(
        /value="\{\{\s*Record\.(\S+)\|floatformat:\d+\s*\}\}"/g,
        (match, field) => {
          const sample = this._getSampleValue(field);
          return `value="${sample !== undefined ? sample : ''}" data-scope="${field}"`;
        }
      );

      // 3. Standard value: value="{{ Record.FIELD }}"
      result = result.replace(
        /value="\{\{\s*Record\.(\S+)\s*\}\}"/g,
        (match, field) => {
          const sample = this._getSampleValue(field);
          return `value="${sample !== undefined ? sample : ''}" data-scope="${field}"`;
        }
      );

      // 4. Strip Pongo2 block tags ({% set %}, {% for %}, {% endfor %}, {% extends %}, {% block %}, {% endblock %}, {% include %})
      result = result.replace(/\{%[\s\S]*?%\}/g, '');

      // 5. Strip loop variable expressions (e.g., {{item.value}}, {{tag}})
      // Preserve Go Kart template variables that start with uppercase
      // (e.g., {{Template.Name}}, {{FormMethod}}, {{RecordID}})
      result = result.replace(/\{\{([^}]+)\}\}/g, (match, content) => {
        const trimmed = content.trim();
        if (/^[A-Z]/.test(trimmed)) return match;
        return '';
      });

      return result;
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
        <div id="change-log-tab"
             hx-get="/{{Template.RoutePrefix}}/change_log?collection={{Template.Slug}}&original_id={{RecordID}}"
             hx-trigger="revealed" hx-swap="innerHTML" hx-indicator="#content-loader" hx-push-url="false">
          <div class="flex items-center gap-2 text-gray-500 p-4">
            <wc-fa-icon name="spinner" class="fa-spin"></wc-fa-icon>
            Loading change history...
          </div>
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
