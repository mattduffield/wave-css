/*
 * Name: WcPageDesigner
 * Usage: 
 * 
 *  <wc-page-designer></wc-page-designer>
 * 
 * References:
 *  https://sweetalert2.github.io/
 *  https://github.com/jaredreich/notie
 */

import { loadCSS, loadScript, loadLibrary, loadStyle, show } from './helper-function.js';

if (!customElements.get('wc-page-designer')) {
  class WcPageDesigner extends HTMLElement {
    static get observedAttributes() {
      return [
        'theme', 
        'json-layout', 'json-layout-fetch-url',
        'json-schema-fetch-url'
      ];
    }
    theme = 'theme-royal dark';
    // Designer State
    designerState = {
      elements: [],
      selectedElement: null,
      schema: null,
      rules: [],
      editingRuleIndex: -1
    };

    // DOM Elements
    designerSurface = null;
    containerElements = null;
    formElements = null;
    schemaFields = null;
    previewButton = null;
    renderedPreviewButton = null;
    preRenderedPreviewButton = null;
    previewFrame = null;
    generateJsonButton = null;
    jsonOutput = null;
    propId = null;
    propType = null;
    propLabel = null;
    propScope = null;
    propCss = null;
    propRequired = null;
    savePropertiesButton = null;
    noSelectionPanel = null;
    elementPropertiesPanel = null;
    schemaJson = null;
    loadSchemaButton = null;
    addRuleButton = null;
    rulesList = null;
    saveRuleButton = null;

    loadDesignButton = null;
    copyDesignButton = null;
    downloadDesignButton = null;

    constructor() {
      super();
      this.loadCSS = loadCSS.bind(this);
      this.loadScript = loadScript.bind(this);
      this.loadLibrary = loadLibrary.bind(this);
      this.loadStyle = loadStyle.bind(this);

      const compEl = this.querySelector('.wc-page-designer');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.createElement();
      }
      console.log('ctor:wc-page-designer');
    }

    async connectedCallback() {
      await this.render();  
      this._applyStyle();
      this.wireEvents();

      setTimeout(() => {
        this.setup();
      }, 250);
      
      console.log('conntectedCallback:wc-page-designer');
    }

    disconnectedCallback() {      
      this.unWireEvents();
    }

    attributeChangedCallback(attrName, oldValue, newValue) {
      if (attrName === 'theme') {
        const oldTheme = this.theme;
        this.theme = newValue;
        const designer = this.querySelector('.wc-page-designer');
        designer.className = designer.className.replace(oldTheme, newValue);
        console.log('wc-page-designer:attributeChangedCallback - designer', designer.className);
      } else if (attrName === 'json-layout') {
        this.jsonLayout = newValue;
        console.log('wc-page-designer:attributeChangedCallback - json-layout', this.jsonLayout);
      } else if (attrName === 'json-layout-fetch-url') {
        this.jsonLayoutFetchUrl = newValue;
        const layoutEditor = this.querySelector('wc-code-mirror[name="jsonLayout"]');
        layoutEditor.setAttribute('fetch', this.jsonLayoutFetchUrl);
        console.log('wc-page-designer:attributeChangedCallback - json-layout-fetch-url', this.jsonLayoutFetchUrl);
      } else if (attrName === 'json-schema-fetch-url') {
        this.jsonSchemaFetchUrl = newValue;
        const schemaJson = this.querySelector('wc-code-mirror[name="jsonSchema"]');
        schemaJson.setAttribute('fetch', this.jsonSchemaFetchUrl);
        console.log('wc-page-designer:attributeChangedCallback - json-schema-fetch-url', this.jsonSchemaFetchUrl);
      }
    }
  

    async render() {
      await Promise.all([
        this.loadLibrary('https://cdn.jsdelivr.net/npm/sortablejs@latest/Sortable.min.js', 'Sortable'),
        this.loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/uuid/8.3.2/uuid.min.js', 'uuid'),
      ]);

      // this.createElement();
      wc.EventHub.broadcast('wc-page-designer:ready', '', '');
    }

    createElement() {
      const markup = `
  <div class="wc-page-designer ${this.theme} flex flex-row flex-1 h-screen">
    <!-- Left Panel - Elements -->
    <div class="left-panel flex flex-col min-h-0 overflow-scroll p-2">
      <wc-tab class="flex flex-col flex-1 min-h-0" animate>
        <wc-tab-item class="active" label="Containers">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="container-elements">
            <div class="element-item" data-element-type="wc-tab" draggable="true">WC Tab Container</div>
            <div class="element-item" data-element-type="wc-tab-item" draggable="true">WC Tab Item</div>
            <div class="element-item" data-element-type="column" draggable="true">Column</div>
            <div class="element-item" data-element-type="row" draggable="true">Row</div>
            <div class="element-item" data-element-type="fieldset" draggable="true">Fieldset</div>
            <div class="element-item" data-element-type="array" draggable="true">Array</div>
            <div class="element-item" data-element-type="wc-card" draggable="true">WC Card</div>
            <div class="element-item" data-element-type="wc-accordion" draggable="true">WC Accordion</div>
            <div class="element-item" data-element-type="wc-form" draggable="true">WC Form</div>
            <div class="element-item" data-element-type="wc-select" draggable="true">WC Select</div>
            <div class="element-item" data-element-type="wc-sidebar-left" draggable="true">WC Sidebar Left</div>
            <div class="element-item" data-element-type="wc-sidebar-right" draggable="true">WC Sidebar Right</div>
            <div class="element-item" data-element-type="wc-sidenav-left" draggable="true">WC Sidenav Left</div>
            <div class="element-item" data-element-type="wc-sidenav-right" draggable="true">WC Sidenav Right</div>
            <div class="element-item" data-element-type="wc-split-button" draggable="true">WC Split Button</div>
            <div class="element-item" data-element-type="wc-slideshow" draggable="true">WC Slideshow</div>
            <div class="element-item" data-element-type="wc-timeline" draggable="true">WC Timeline</div>
            <div class="element-item" data-element-type="wc-tabulator" draggable="true">WC Tabulator</div>
            <div class="element-item" data-element-type="wc-breadcrumb" draggable="true">WC Breadcrumb</div>
            <div class="element-item" data-element-type="option" draggable="true">Option</div>
          </div>
        </wc-tab-item>
        <wc-tab-item class="" label="Elements">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="form-elements">
            <div class="element-item" data-element-type="hr" draggable="true">Horizontal Line</div>
            <div class="element-item" data-element-type="wc-article-skeleton" draggable="true">WC Article Skeleton</div>
            <div class="element-item" data-element-type="wc-card-skeleton" draggable="true">WC Card Skeleton</div>
            <div class="element-item" data-element-type="wc-list-skeleton" draggable="true">WC List Skeleton</div>
            <div class="element-item" data-element-type="wc-table-skeleton" draggable="true">WC Table Skeleton</div>
            <div class="element-item" data-element-type="wc-input" draggable="true">WC Input</div>
            <div class="element-item" data-element-type="wc-input-checkbox" draggable="true">WC Input Checkbox</div>
            <div class="element-item" data-element-type="wc-code-mirror" draggable="true">WC Code Mirror</div>
            <div class="element-item" data-element-type="wc-textarea" draggable="true">WC Textarea</div>
            <div class="element-item" data-element-type="wc-save-button" draggable="true">WC Save Button</div>
            <div class="element-item" data-element-type="wc-save-split-button" draggable="true">WC Save Split Button</div>
            <div class="element-item" data-element-type="wc-select-option" draggable="true">WC Select Option</div>
            <div class="element-item" data-element-type="wc-slideshow-image" draggable="true">WC Slideshow Image</div>
            <div class="element-item" data-element-type="wc-tabulator-column" draggable="true">WC Tabulator Column</div>
            <div class="element-item" data-element-type="wc-tabulator-func" draggable="true">WC Tabulator Func</div>
            <div class="element-item" data-element-type="wc-tabulator-row-menu" draggable="true">WC Tabulator Row Menu</div>
            <div class="element-item" data-element-type="wc-loader" draggable="true">WC Loader</div>
            <div class="element-item" data-element-type="wc-image" draggable="true">WC Image</div>
            <div class="element-item" data-element-type="wc-contact-card" draggable="true">WC Contact Card</div>
            <div class="element-item" data-element-type="wc-contact-chip" draggable="true">WC Contact Chip</div>
            <div class="element-item" data-element-type="wc-breadcrumb-item" draggable="true">WC Breadcrumb Item</div>
            <div class="element-item" data-element-type="wc-background-image" draggable="true">WC Backgruond Image</div>
            <div class="element-item" data-element-type="wc-hotkey" draggable="true">WC Hotkey</div>
          </div>
        </wc-tab-item>
        <wc-tab-item class="" label="Fields">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="schema-fields">
            <!-- Will be populated dynamically -->
          </div>
        </wc-tab-item>
      </wc-tab>      
    </div>

    <!-- Center Panel - Designer Surface -->
    <div id="center-panel" class="flex flex-col flex-1 min-h-0 min-w-0">
      <wc-tab id="center-tab-control" class="flex flex-col flex-1 min-h-0 min-w-0 p-2" animate>
        <wc-tab-item class="active" label="Canvas">
          <div class="designer-surface flex flex-col flex-1 min-h-0 overflow-scroll" id="designer-surface"></div>
        </wc-tab-item>
        <wc-tab-item label="Schema">
          <div class="flex flex-col flex-1 min-h-0 overflow-scroll gap-2">
            <wc-code-mirror class="flex flex-col flex-1 min-h-0"
              _="install HandleCodeMirrorTabChange end"
              name="jsonSchema"
              line-numbers
              line-wrapper
              fold-gutter
              mode="javascript"
              theme="monokai"
              tab-size="2"
              indent-unit="2">
            </wc-code-mirror>
            <div class="flex flex-row justify-end gap-2 p-2">
              <button id="load-schema" class="btn btn-primary">Load Schema</button>
            </div>
          </div>
        </wc-tab-item>
        <wc-tab-item label="Layout JSON">
          <div class="flex flex-col flex-1 min-h-0 min-w-0 overflow-scroll">
            <wc-code-mirror class="flex flex-col flex-1 min-h-0 min-w-0 w-full max-w-full box-border"
              _="install HandleCodeMirrorTabChange end"
              name="jsonLayout"
              line-numbers
              line-wrapper
              fold-gutter
              mode="javascript"
              theme="monokai"
              tab-size="2"
              indent-unit="2"
              >
            </wc-code-mirror>
            <div class="flex flex-row justify-end gap-2 p-2">
              <button id="copy-design" class="btn btn-secondary">Copy to Clipboard</button>
              <button id="download-design" class="btn btn-primary">Download Design</button>
              <button id="load-design" class="btn btn-info">Apply Design</button>
            </div>
          </div>
        </wc-tab-item>
        <wc-tab-item label="Raw Preview">
          <iframe id="pre-rendered-preview" name="pre-rendered-preview" class="border-none flex flex-col flex-1 min-h-0 overflow-scroll">
          </iframe>
        </wc-tab-item>
        <wc-tab-item label="Preview">
          <iframe id="rendered-preview" name="rendered-preview" class="border-none flex flex-col flex-1 min-h-0 overflow-scroll">
          </iframe>
        </wc-tab-item>
      </wc-tab>
    </div>
    <!-- Right Panel - Properties -->
    <div class="right-panel flex flex-col min-h-0 overflow-scroll p-2">
      <wc-tab id="right-panel" class="flex flex-col flex-1 min-h-0" animate>
        <wc-tab-item class="active" label="Properties">
          <div class="col-1 gap-2 py-2 px-4">
            <div id="no-selection" class="col-1 text-center text-muted py-4">
              <p>Select an element to view and edit its properties</p>
            </div>
            <div id="element-properties" class="col-1 gap-2 hidden">
              <div class="row">
                <wc-input name="prop-id" lbl-label="ID" class="col-1" readonly></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-type" lbl-label="Type" class="col-1"></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-label" lbl-label="Label" class="col-1"></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-scope" lbl-label="Scope" class="col-1"></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-css" lbl-label="CSS" class="col-1"></wc-input>
              </div>
              <div class="row">
                <wc-input name="prop-required" lbl-label="Required" class="col" type="checkbox" toggle-switch></wc-input>
              </div>
              <div class="row">
                <button id="save-properties" class="col-1 btn btn-primary">Apply</button>
              </div>
            </div>
          </div>
        </wc-tab-item>
        <wc-tab-item class="" label="Rules">
          <div class="col-1 gap-2 py-2 px-4">
            <div id="rules-no-selection" class="text-center text-muted py-4">
              <p>Select an element to view and edit its rules</p>
            </div>
            <div id="element-rules" class="d-none">
              <div id="rules-list">
                <!-- Rules will be added here -->
              </div>
              <div class="flex flex-row justify-end mt-2">
                <button id="add-rule" class="">Add Rule</button>
              </div>
            </div>
          </div>
        </wc-tab-item>
      </wc-tab>
    </div>
  </div>
  
  <template id="rule-template">
    <swal-title class="text-sm">
      Edit Rule
    </swal-title>
    <swal-html>
      <div class="flex flex-col flex-1 gap-2 text-sm">
        <div class="flex flex-row flex-1">
          <wc-select name="rule-effect" lbl-label="Effect" class="flex-1">
            <option value="COPY">Copy Value</option>
            <option value="COPY-TOLOWER">Copy to Lowercase</option>
            <option value="COPY-TOLOWER-UNDERSCORE">Copy to Lowercase with Underscores</option>
            <option value="SHOW">Show Element</option>
            <option value="HIDE">Hide Element</option>
            <option value="ENABLE">Enable Element</option>
            <option value="DISABLE">Disable Element</option>
            <option value="REQUIRE">Make Required</option>
            <option value="UN-REQUIRE">Make Optional</option>
          </wc-select>
        </div>
        <fieldset class="flex flex-col flex-1 p-2 gap-2">
          <legend>Condition</legend>
          <div class="flex flex-row flex-1">
            <wc-input name="rule-condition-scope" lbl-label="Scope" class="flex-1">
            </wc-input>
          </div>
          <div class="flex flex-row flex-1 gap-2">
            <wc-select name="rule-schema-type" lbl-label="Rule Type" class="flex-1">
              <option value="">Choose...</option>
              <option value="minLength">Min Length</option>
              <option value="maxLength">Max Length</option>
              <option value="pattern">Pattern</option>
              <option value="minimum">Minimum</option>
              <option value="maximum">Maximum</option>
              <option value="const">Constant</option>
              <option value="enum">Enum</option>
            </wc-select>
            <wc-input name="rule-schema-value" lbl-label="Value" class="flex-1">
            </wc-input>            
          </div>
          <div class="flex flex-row flex-1">
            <wc-input name="rule-src-data-id" lbl-label="Source Element ID" class="flex-1">
            </wc-input>
          </div>
          <div class="flex flex-row flex-1 gap-2">
            <wc-input name="rule-src-selector" lbl-label="Source Selector (optional)" class="flex-1">
            </wc-input>
            <wc-input name="rule-src-property" lbl-label="Source Property (optional)" class="flex-1">
            </wc-input>
          </div>
        </fieldset>
        <fieldset class="flex flex-col flex-1 p-2 gap-2">
          <legend>Target</legend>
          <div class="flex flex-row flex-1">
            <!--
            <wc-input name="rule-tgt-data-id" lbl-label="Target Element ID" class="flex-1">
            </wc-input>
            -->
            <wc-select name="rule-tgt-data-id" lbl-label="Target Element ID" class="flex-1">
            </wc-select>
          </div>
          <div class="flex flex-row flex-1 gap-2">
            <wc-input name="rule-tgt-selector" lbl-label="Target Selector (optional)" class="flex-1">
            </wc-input>
            <wc-input name="rule-tgt-property" lbl-label="Target Property (optional)" class="flex-1">
            </wc-input>
          </div>
        </fieldset>
      </div>
    </swal-html>
    <swal-button type="cancel">
      Cancel
    </swal-button>
    <swal-button type="confirm">
      Save Rule
    </swal-button>
    <swal-param name="allowEscapeKey" value="false" />
    <swal-param name="allowOutsideClick" value="false" />
  </template>
      
      `;
      this.innerHTML = markup;
    }

    _applyStyle() {
      const style = `
        wc-page-designer {
          display: contents;
        }
        wc-page-designer .left-panel {
          width: 275px;
          border-right: 1px solid #dee2e6;
        }
        wc-page-designer .center-panel {
          flex: 1;
          background-color: #f8f9fa;
          position: relative;
        }
        wc-page-designer .right-panel {
          width: 300px;
          border-left: 1px solid #dee2e6;
        }
        wc-page-designer .element-list {
          margin-bottom: 20px;
        }
        wc-page-designer .element-item {
          padding: 8px 12px;
          margin-bottom: 5px;
          border: 1px solid var(--button-bg-color);
          border-radius: 4px;
          color: var(--button-color);
          cursor: move;
          user-select: none;
        }
        wc-page-designer .element-item:hover {
          background-color: var(--button-hover-bg-color);
        }
        wc-page-designer .designer-surface {
          padding: 20px;
          background-color: white;
        }
        /* Designer element styling */
        wc-page-designer .designer-element {
          padding: 10px;
          margin: 5px 0;
          border: 2px solid #dee2e6;
          border-radius: 4px;
          position: relative;
        }
        wc-page-designer .designer-element.selected {
          border: 2px solid var(--swatch-9);
        }
        wc-page-designer .designer-element-container {
          min-height: 50px;
          padding: 10px;
          border: 2px dashed #6c757d;
          margin: 8px 0;
          position: relative;
        }
        wc-page-designer .designer-element-container.drag-over {
          background-color: rgba(13, 110, 253, 0.1);
          border: 1px dashed #0d6efd;
        }
        wc-page-designer .designer-element-placeholder {
          height: 50px;
          margin: 8px 0;
          background-color: #f1f1f1;
          text-align: center;
          line-height: 50px;
          color: #6c757d;
        }
        wc-page-designer .container-drop-indicator {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: -1;
        }
        wc-page-designer .element-actions {
          position: absolute;
          top: 5px;
          right: 5px;
          display: flex;
          gap: 5px;
        }
        wc-page-designer .element-actions button {
          padding: 2px 5px;
          font-size: 12px;
        }
        wc-page-designer .element-type-header {
          font-size: 12px;
          font-weight: bold;
          color: #6c757d;
          margin-bottom: 5px;
          display: block;
        }
        wc-page-designer .element-label {
          font-weight: bold;
          color: var(--text-9);
        }
        wc-page-designer .preview-container {
          height: 100%;
          width: 100%;
          position: absolute;
          top: 0;
          left: 0;
          background-color: white;
          z-index: 1000;
          padding: 20px;
          overflow-y: auto;
        }
        wc-page-designer .preview-container.hidden {
          display: none;
        }
        wc-page-designer .invisible-placeholder {
          visibility: hidden;
          height: 0;
          padding: 0;
          margin: 0;
        }


        wc-page-designer .dark .designer-surface {
          background-color: var(--surface-1);
        }
        wc-page-designer .dark .left-panel {
          border-right: 1px solid var(--surface-1);
        }
        wc-page-designer .dark .right-panel {
          border-left: 1px solid var(--surface-1);
        }
        wc-page-designer .dark .designer-element {
          border: 2px solid var(--surface-4);
        }
        wc-page-designer .dark .designer-element.selected {
          border: 2px solid var(--surface-6);
        }
        wc-page-designer .dark .designer-element-container {
          border: 2px dashed var(--surface-5);
        }
        wc-page-designer .dark .designer-element-container.drag-over {
          background-color: rgba(13, 110, 253, 0.1);
          background-color: color-mix(in oklch, var(--surface-2) 50%, transparent);
          border: 1px dashed var(--surface-5);
        }
        wc-page-designer .dark .designer-element-placeholder {
          background-color: var(--surface-3);
          color: var(--text-7);
        }          
        wc-page-designer .dark .element-type-header {
          color: var(--text-3);
        }
        wc-page-designer .dark .element-label {
          color: var(--text-5);
        }
        wc-page-designer .dark .preview-container {
          background-color: white;
        }
      `;
      this.loadStyle('wc-page-designer-style', style);
    }

    wireEvents() {
    }
    unWireEvents() {
      console.log('unWireEvents:wc-page-designer');
    }





    setup() {
      const isWired = this.hasAttribute('data-wired');
      if (isWired) return;
      // DOM Elements
      this.designerSurface = document.getElementById('designer-surface');
      this.containerElements = document.getElementById('container-elements');
      this.formElements = document.getElementById('form-elements');
      this.schemaFields = document.getElementById('schema-fields');
      this.previewButton = document.querySelector('button[data-label="Preview"]');
      this.renderedPreviewButton = document.querySelector('button[data-label="Preview"]');
      this.preRenderedPreviewButton = document.querySelector('button[data-label="Raw Preview"]');
      this.generateJsonButton = document.querySelector('button[data-label="Layout JSON"]');
      this.jsonOutput = document.querySelector('wc-code-mirror[name="jsonLayout"]');
      this.propId = document.getElementById('prop-id');
      this.propType = document.getElementById('prop-type');
      this.propLabel = document.getElementById('prop-label');
      this.propScope = document.getElementById('prop-scope');
      this.propCss = document.getElementById('prop-css');
      this.propRequired = document.getElementById('prop-required');
      this.savePropertiesButton = document.getElementById('save-properties');
      this.noSelectionPanel = document.getElementById('no-selection');
      this.elementPropertiesPanel = document.getElementById('element-properties');
      this.schemaJson = document.querySelector('wc-code-mirror[name="jsonSchema"]');
      this.loadSchemaButton = document.getElementById('load-schema');
      this.addRuleButton = document.getElementById('add-rule');
      this.rulesList = document.getElementById('rules-list');
      this.saveRuleButton = document.getElementById('save-rule');

      this.loadDesignButton = document.getElementById('load-design');
      this.copyDesignButton = document.getElementById('copy-design');
      this.downloadDesignButton = document.getElementById('download-design');
      
      this.init();

      this.setAttribute('data-wired', true);
    }

    // Initialize Designer
    init() {
      this.initDragAndDrop();
      
      // Initialize the main designer surface as a drop zone
      this.initDropZone(this.designerSurface, null);
      
      // Make the designer surface sortable
      new Sortable(this.designerSurface, {
        group: 'elements',
        animation: 150,
        onEnd: (evt) => {
          // Update the order of top-level elements
          this.updateTopLevelElementsOrder();
        }
      });
      
      this.initEventListeners();
    }

    // Update top-level elements order
    updateTopLevelElementsOrder() {
      const newOrder = [];
      const childElements = this.designerSurface.querySelectorAll(':scope > .designer-element');
      
      childElements.forEach(childNode => {
        const childId = childNode.getAttribute('data-id');
        const child = this.findElementById(childId);
        if (child) {
          newOrder.push(child);
        }
      });
      
      this.designerState.elements = newOrder;
    }

    // Initialize Drag and Drop
    initDragAndDrop() {
      const elementItems = document.querySelectorAll('.element-item');
      
      elementItems.forEach(item => {
        item.addEventListener('dragstart', e => {
          e.dataTransfer.setData('element-type', item.getAttribute('data-element-type'));
          e.dataTransfer.setData('schema-field', item.getAttribute('data-schema-field') || '');
          e.dataTransfer.effectAllowed = 'copy';
        });
      });
    }

    // Initialize Drop Zone
    initDropZone(element, parentElementId = null) {
      // Add a data attribute to mark this as a drop zone
      element.setAttribute('data-drop-zone', 'true');
      
      element.addEventListener('dragover', e => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
        // Add a visual indicator for valid drop target
        element.classList.add('drag-over');
      });
      
      element.addEventListener('dragleave', e => {
        // Remove visual indicator
        element.classList.remove('drag-over');
      });
      
      element.addEventListener('drop', e => {
        e.preventDefault();
        e.stopPropagation(); // Stop event propagation to prevent multiple drops
        
        // Remove visual indicator
        element.classList.remove('drag-over');
        
        const elementType = e.dataTransfer.getData('element-type');
        const schemaField = e.dataTransfer.getData('schema-field');
        
        if (elementType) {
          let scope = '';
          let label = '';
          
          if (schemaField) {
            scope = schemaField;
            
            // Format the label based on the schema field
            const parts = schemaField.split('/');
            if (parts.length > 0) {
              label = parts[parts.length - 1];
              
              // Handle nested $defs elements
              if (schemaField.includes('$defs')) {
                // For $defs items, we need to add parent prefix
                const defName = parts[2]; // The definition name
                const fieldName = parts[parts.length - 1]; // The property name
                
                // Format as parent.field if it's from a $defs
                if (defName && fieldName) {
                  label = defName + '.' + fieldName;
                }
              }
            }
          } else {
            label = this.getDefaultLabel(elementType);
          }
          
          // Create the element object in the data model
          const id = this.generateUniqueId();
          const newElement = {
            id: id,
            "data-id": id,
            type: elementType,
            label,
            scope,
            css: '',
            required: false,
            rules: [],
            elements: []
          };
          
          // Add to parent in the data model
          if (parentElementId) {
            const parentElement = this.findElementById(parentElementId);
            if (parentElement) {
              if (!parentElement.elements) {
                parentElement.elements = [];
              }
              parentElement.elements.push(newElement);
            }
          } else {
            this.designerState.elements.push(newElement);
          }
          
          // If dropping into a container, safely remove placeholder if it exists
          const placeholder = element.querySelector('.designer-element-placeholder');
          if (placeholder && placeholder.parentNode === element) {
            try {
              element.removeChild(placeholder);
            } catch (e) {
              console.log('Could not remove placeholder:', e);
            }
          }
          
          // Create the DOM element
          const elementNode = this.createElementNode(newElement);
          element.appendChild(elementNode);
          
          // Add a new placeholder after a short delay to ensure proper rendering
          if (element.classList.contains('designer-element-container')) {
            setTimeout(() => {
              // Only add a placeholder if there isn't one already
              if (!element.querySelector('.designer-element-placeholder')) {
                const newPlaceholder = document.createElement('div');
                newPlaceholder.className = 'designer-element-placeholder';
                newPlaceholder.textContent = 'Drop more elements here';
                element.appendChild(newPlaceholder);
              }
            }, 100);
          }
          
          // Refresh drop zone initialization for newly added containers
          if (this.isContainerElement(elementType)) {
            const containerElements = document.querySelectorAll('.designer-element-container:not([data-drop-zone])');
            containerElements.forEach(containerElement => {
              const containerId = containerElement.getAttribute('data-container-for');
              if (containerId) {
                this.initDropZone(containerElement, containerId);
              }
            });
          }
        }
      });
    }

    // Initialize Event Listeners
    initEventListeners() {
      // Rendered Preview Button
      this.renderedPreviewButton.addEventListener('click', this.renderPreview.bind(this));

      // Pre Rendered Preview Button
      this.preRenderedPreviewButton.addEventListener('click', this.preRenderPreview.bind(this));

      // Generate JSON Button
      this.generateJsonButton.addEventListener('click', this.generateJson.bind(this));
      
      // Save Properties Button
      this.savePropertiesButton.addEventListener('click', this.saveProperties.bind(this));
      
      // Load Schema Button
      this.loadSchemaButton.addEventListener('click', () => {
        try {
          const schema = JSON.parse(this.schemaJson.editor.getValue());
          this.loadSchema(schema);
        } catch (e) {
          alert('Invalid JSON schema');
        }
      });

      this.schemaJson.addEventListener('fetch-complete', (e) => {
        try {
          const schema = JSON.parse(this.schemaJson.editor.getValue());
          this.loadSchema(schema);
          console.log('wc-page-designer:schemaJson - fetch-complete');
        } catch (e) {
          alert('Invalid JSON schema');
        }
      });

      // Add Rule Button
      this.addRuleButton.addEventListener('click', () => {
        this.designerState.editingRuleIndex = -1;
        const promptPayload = {
          focusConfirm: false,
          template: 'template#rule-template',
          didOpen: () => {
            const cnt = document.querySelector(".swal2-container");
            if (cnt) {
              if (this.designerState.selectedElement) {
                const src = document.getElementById('rule-src-data-id');
                src.value = this.designerState.selectedElement.id;

                const layout = JSON.parse(this.jsonOutput.editor.getValue());
                const srcElements = WaveHelpers.extractSrcElements(layout);
                const tgt = document.getElementById('rule-tgt-data-id');
                tgt.innerHTML = '';
                let option = document.createElement('option');
                option.value = '';
                option.textContent = 'Choose...';
                tgt.appendChild(option);
                srcElements.forEach(el => {
                  option = document.createElement('option');
                  option.value = el.dataId;
                  option.textContent = el.label;
                  tgt.appendChild(option);
                });
              }
              htmx.process(cnt);
              _hyperscript.processNode(cnt);
            }
          },
          preConfirm: () => {
            const effect = document.getElementById('rule-effect').value;
            const conditionScope = document.getElementById('rule-condition-scope').value;
            const schemaType = document.getElementById('rule-schema-type').value;
            const schemaValue = document.getElementById('rule-schema-value').value;
            const srcDataId = document.getElementById('rule-src-data-id').value;
            const srcSelector = document.getElementById('rule-src-selector').value || '';
            const srcProperty = document.getElementById('rule-src-property').value || '';
            const tgtDataId = document.getElementById('rule-tgt-data-id').value;
            const tgtSelector = document.getElementById('rule-tgt-selector').value || '';
            const tgtProperty = document.getElementById('rule-tgt-property').value || '';

            const rule = {
              effect: effect,
              condition: {
                scope: conditionScope,
                schema: {
                  [schemaType]: schemaValue
                },
                srcDataId: srcDataId,
                srcSelector: srcSelector,
                srcProperty: srcProperty
              },
              tgtDataId: tgtDataId,
              tgtSelector: tgtSelector,
              tgtProperty: tgtProperty
            };

            if (schemaType && schemaValue) {
              switch (schemaType) {
                case 'minLength':
                case 'maxLength':
                case 'minimum':
                case 'maximum':
                  rule.condition.schema[schemaType] = parseInt(schemaValue);
                  break;
                case 'pattern':
                  rule.condition.schema[schemaType] = schemaValue;
                  break;
                case 'const':
                  rule.condition.schema[schemaType] = schemaValue;
                  break;
                case 'enum':
                  rule.condition.schema[schemaType] = schemaValue.split(',').map(v => v.trim());
                  break;
              }
            }
            return rule;
          },
          callback: (result) => {
            console.log('rule-template - result:', result);
            this.saveRule(result);
          }
        };
        wc.Prompt.notifyTemplate(promptPayload);
      });
      
      // Load Design Button
      this.jsonOutput.editor.on('change2', async () => {
        try {
          const jsonText = this.jsonOutput.editor.getValue().trim();
          const layoutData = JSON.parse(jsonText);
          this.loadDesign(layoutData);
        } catch (e) {
          alert('Invalid JSON format: ' + e.message);
        }
      });

      this.jsonOutput.addEventListener('fetch-complete', (e) => {
        const jsonText = this.jsonOutput.editor.getValue().trim();
        const layoutData = JSON.parse(jsonText);
        this.loadDesign(layoutData);
      });

      this.loadDesignButton.addEventListener('click', () => {
        try {
          const jsonText = this.jsonOutput.editor.getValue().trim();
          if (!jsonText) {
            alert('Please paste a valid JSON layout');
            return;
          }
          const layoutData = JSON.parse(jsonText);
          this.loadDesign(layoutData);
          wc.Prompt.toast({title: 'Load Succeeded!'});
        } catch (e) {
          alert('Invalid JSON format: ' + e.message);
        }
      });

      // Copy Design Button
      this.copyDesignButton.addEventListener('click', this.copyDesign.bind(this));

      // Download Design JSON Button
      this.downloadDesignButton.addEventListener('click', () => {
        const jsonText = this.jsonOutput.editor.getValue();
        const designName = 'layout-ui-design';
        const fileName = `${designName}.json`;
        
        // Create a blob with the JSON content
        const blob = new Blob([jsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Create download link and click it
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
    }

    // Create Element Object
    createElementObject({ type, label = '', scope = '', parentElement = null, css = '', id = null }) {
      const elementId = id || this.generateUniqueId();
      
      const element = {
        id: elementId,
        "data-id": elementId,
        type,
        label,
        scope,
        css,
        required: false,
        rules: [],
        elements: []
      };
      
      if (parentElement) {
        const parent = this.findElementById(parentElement);
        if (parent) {
          parent.elements.push(element);
        }
        return element;
      } else {
        this.designerState.elements.push(element);
        return element;
      }
    }

    // Add Element to Designer
    addElementToDesigner(element, containerElement) {
      // Only remove placeholder if present
      const placeholder = containerElement.querySelector('.designer-element-placeholder');
      if (placeholder) {
        containerElement.removeChild(placeholder);
      }
      
      // Create and append the new element node
      const elementNode = this.createElementNode(element);
      containerElement.appendChild(elementNode);
    }

    // Create Element Node
    createElementNode(element) {
      const node = document.createElement('div');
      node.className = 'designer-element';
      node.setAttribute('data-id', element.id);
      node.setAttribute('data-type', element.type);
      
      // Add element type header
      const typeHeader = document.createElement('span');
      typeHeader.className = 'element-type-header';
      typeHeader.textContent = element.type;
      node.appendChild(typeHeader);
      
      // Add label if present
      if (element.label) {
        const labelElement = document.createElement('span');
        labelElement.className = 'element-label';
        labelElement.textContent = element.label;
        node.appendChild(labelElement);
        
        // Add scope if present
        if (element.scope) {
          const scopeElement = document.createElement('small');
          scopeElement.className = 'ms-2 text-muted';
          scopeElement.textContent = `(${element.scope})`;
          labelElement.appendChild(scopeElement);
        }
      }
      
      // Add element actions
      const actions = document.createElement('div');
      actions.className = 'element-actions';
      
      const deleteButton = document.createElement('button');
      deleteButton.className = 'btn btn-sm btn-outline-danger';
      deleteButton.textContent = 'Delete';
      deleteButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent selection when deleting
        this.removeElement(element.id);
      });
      actions.appendChild(deleteButton);
      
      node.appendChild(actions);
      
      // Make the element selectable
      node.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectElement(element.id);
      });
      
      // Add container for child elements if needed
      if (this.isContainerElement(element.type)) {
        const container = document.createElement('div');
        container.className = 'designer-element-container';
        container.setAttribute('data-container-for', element.id);
        
        // If empty, add a placeholder
        if (!element.elements || element.elements.length === 0) {
          const placeholder = document.createElement('div');
          placeholder.className = 'designer-element-placeholder';
          placeholder.textContent = 'Drop elements here';
          container.appendChild(placeholder);
        } else {
          // Add existing child elements
          element.elements.forEach(childElement => {
            const childNode = this.createElementNode(childElement);
            container.appendChild(childNode);
          });
        }
        
        // Make the container a drop zone
        this.initDropZone(container, element.id);
        
        // Initialize sortable for the container
        new Sortable(container, {
          group: 'elements',
          animation: 150,
          onEnd: (evt) => {
            this.updateElementsOrder(container, element.id);
          }
        });
        
        node.appendChild(container);
      }
      
      return node;
    }

    // Update Elements Order
    updateElementsOrder(container, parentId) {
      const parent = this.findElementById(parentId);
      if (!parent) return;
      
      const newOrder = [];
      const childElements = container.querySelectorAll(':scope > .designer-element');
      
      childElements.forEach(childNode => {
        const childId = childNode.getAttribute('data-id');
        const child = this.findElementById(childId);
        if (child) {
          newOrder.push(child);
        }
      });
      
      parent.elements = newOrder;
    }

    // Select Element
    selectElement(elementId) {
      // Clear previous selection
      const selectedNodes = document.querySelectorAll('.designer-element.selected');
      selectedNodes.forEach(node => node.classList.remove('selected'));
      
      // Find the element by ID
      const element = this.findElementById(elementId);
      if (!element) return;
      
      // Set as selected in state
      this.designerState.selectedElement = element;
      
      // Mark the node as selected
      const node = document.querySelector(`.designer-element[data-id="${elementId}"]`);
      if (node) {
        node.classList.add('selected');
      }
      
      // Update properties
      this.updateProperties(element);
      
      // Update rules panel
      this.updateRulesPanel(element);
      
      // Show properties panel
      this.noSelectionPanel.classList.add('hidden');
      this.elementPropertiesPanel.classList.remove('hidden');
      
      // Show rules panel
      document.getElementById('rules-no-selection').classList.add('hidden');
      document.getElementById('element-rules').classList.remove('hidden');
    }

    // Update Properties
    updateProperties(element) {
      this.propId.value = element.id;
      this.propType.value = element.type;
      this.propLabel.value = element.label || '';
      this.propScope.value = element.scope || '';
      this.propCss.value = element.css || '';
      this.propRequired.checked = element.required || false;
    }

    // Update Rules Panel
    updateRulesPanel(element) {
      this.rulesList.innerHTML = '';
      
      if (!element.rules || element.rules.length === 0) {
        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'text-muted text-center';
        emptyMessage.textContent = 'No rules defined';
        this.rulesList.appendChild(emptyMessage);
        return;
      }
      
      element.rules.forEach((rule, index) => {
        const ruleItem = document.createElement('div');
        ruleItem.className = 'rule-item flex flex-col rounded border-1 border-solid gap-2 p-2';
        
        const ruleHeader = document.createElement('div');
        ruleHeader.className = 'flex flex-col gap-2';
        
        const ruleTitle = document.createElement('h6');
        ruleTitle.textContent = `Rule: ${rule.effect}`;
        ruleHeader.appendChild(ruleTitle);
        
        const ruleActions = document.createElement('div');
        ruleActions.className = 'flex flex-row justify-between align-center';
        
        const editButton = document.createElement('button');
        editButton.className = 'theme-azure dark';
        editButton.textContent = 'Edit';
        editButton.addEventListener('click', () => editRule(index));
        ruleActions.appendChild(editButton);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'theme-fire dark';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => deleteRule(index));
        ruleActions.appendChild(deleteButton);
        
        ruleHeader.appendChild(ruleActions);
        ruleItem.appendChild(ruleHeader);
        
        // Rule summary
        const ruleSummary = document.createElement('div');
        ruleSummary.className = 'text-sm';
        
        const condition = document.createElement('div');
        condition.textContent = `When ${rule.condition.scope} ${this.getSchemaDescription(rule.condition.schema)}`;
        ruleSummary.appendChild(condition);
        
        const effect = document.createElement('div');
        effect.textContent = `${rule.effect} on ${rule.tgtDataId}`;
        ruleSummary.appendChild(effect);
        
        ruleItem.appendChild(ruleSummary);
        this.rulesList.appendChild(ruleItem);
      });
    }

    // Get Schema Description
    getSchemaDescription(schema) {
      if (!schema) return '';
      
      const descriptions = [];
      
      if (schema.const !== undefined) {
        descriptions.push(`equals "${schema.const}"`);
      }
      
      if (schema.enum) {
        descriptions.push(`is one of [${schema.enum.join(', ')}]`);
      }
      
      if (schema.minimum !== undefined) {
        descriptions.push(`>= ${schema.minimum}`);
      }
      
      if (schema.maximum !== undefined) {
        descriptions.push(`<= ${schema.maximum}`);
      }
      
      if (schema.minLength !== undefined) {
        descriptions.push(`length >= ${schema.minLength}`);
      }
      
      if (schema.maxLength !== undefined) {
        descriptions.push(`length <= ${schema.maxLength}`);
      }
      
      if (schema.pattern) {
        descriptions.push(`matches "${schema.pattern}"`);
      }
      
      return descriptions.join(' AND ');
    }

    // Edit Rule
    editRule(index) {
      if (!this.designerState.selectedElement || !this.designerState.selectedElement.rules) return;
      
      const rule = this.designerState.selectedElement.rules[index];
      if (!rule) return;
      
      this.designerState.editingRuleIndex = index;

      const promptPayload = {
        focusConfirm: false,
        template: 'template#rule-template',
        didOpen: () => {
          const cnt = document.querySelector(".swal2-container");
          if (cnt) {
            // Fill the form with rule data
            document.getElementById('rule-effect').value = rule.effect;
            document.getElementById('rule-condition-scope').value = rule.condition.scope || '';
            
            // Set schema values
            if (rule.condition.schema) {
              const schema = rule.condition.schema;
              let schemaType = '';
              let schemaValue = '';
              
              if (schema.minLength !== undefined) {
                schemaType = 'minLength';
                schemaValue = schema.minLength;
              } else if (schema.maxLength !== undefined) {
                schemaType = 'maxLength';
                schemaValue = schema.maxLength;
              } else if (schema.pattern !== undefined) {
                schemaType = 'pattern';
                schemaValue = schema.pattern;
              } else if (schema.minimum !== undefined) {
                schemaType = 'minimum';
                schemaValue = schema.minimum;
              } else if (schema.maximum !== undefined) {
                schemaType = 'maximum';
                schemaValue = schema.maximum;
              } else if (schema.const !== undefined) {
                schemaType = 'const';
                schemaValue = schema.const;
              } else if (schema.enum !== undefined) {
                schemaType = 'enum';
                schemaValue = schema.enum.join(',');
              }
              
              document.getElementById('rule-schema-type').value = schemaType;
              document.getElementById('rule-schema-value').value = schemaValue;
            }
            
            document.getElementById('rule-src-data-id').value = rule.condition.srcDataId || '';
            document.getElementById('rule-src-selector').value = rule.condition.srcSelector || '';
            document.getElementById('rule-src-property').value = rule.condition.srcProperty || '';
            document.getElementById('rule-tgt-data-id').value = rule.tgtDataId || '';
            document.getElementById('rule-tgt-selector').value = rule.tgtSelector || '';
            document.getElementById('rule-tgt-property').value = rule.tgtProperty || '';
            
            htmx.process(cnt);
            _hyperscript.processNode(cnt);
          }
        },
        preConfirm: () => {
          const effect = document.getElementById('rule-effect').value;
          const conditionScope = document.getElementById('rule-condition-scope').value;
          const schemaType = document.getElementById('rule-schema-type').value;
          const schemaValue = document.getElementById('rule-schema-value').value;
          const srcDataId = document.getElementById('rule-src-data-id').value;
          const srcSelector = document.getElementById('rule-src-selector').value || '';
          const srcProperty = document.getElementById('rule-src-property').value || '';
          const tgtDataId = document.getElementById('rule-tgt-data-id').value;
          const tgtSelector = document.getElementById('rule-tgt-selector').value || '';
          const tgtProperty = document.getElementById('rule-tgt-property').value || '';

          const rule = {
            effect: effect,
            condition: {
              scope: conditionScope,
              schema: {
                [schemaType]: schemaValue
              },
              srcDataId: srcDataId,
              srcSelector: srcSelector,
              srcProperty: srcProperty
            },
            tgtDataId: tgtDataId,
            tgtSelector: tgtSelector,
            tgtProperty: tgtProperty
          };

          if (schemaType && schemaValue) {
            switch (schemaType) {
              case 'minLength':
              case 'maxLength':
              case 'minimum':
              case 'maximum':
                rule.condition.schema[schemaType] = parseInt(schemaValue);
                break;
              case 'pattern':
                rule.condition.schema[schemaType] = schemaValue;
                break;
              case 'const':
                rule.condition.schema[schemaType] = schemaValue;
                break;
              case 'enum':
                rule.condition.schema[schemaType] = schemaValue.split(',').map(v => v.trim());
                break;
            }
          }
          return rule;
        },
        callback: (result) => {
          console.log('rule-template - result:', result);
          this.saveRule(result);
        }
      };
      wc.Prompt.notifyTemplate(promptPayload);
    }

    // Delete Rule
    async deleteRule(index) {
      if (!this.designerState.selectedElement || !this.designerState.selectedElement.rules) return;
      
      const result = await wc.Prompt.question({
        title: 'Confirm Delete',
        text: 'Are you are you want to delete this rule?',
        showCancelButton: true
      });
      if (result) {
        this.designerState.selectedElement.rules.splice(index, 1);
        this.updateRulesPanel(this.designerState.selectedElement);
      }
    }

    // Save Rule
    saveRule(rule) {
      if (!this.designerState.selectedElement) return;
        
      // Save rule
      if (this.designerState.editingRuleIndex >= 0) {
        this.designerState.selectedElement.rules[this.designerState.editingRuleIndex] = rule;
      } else {
        if (!this.designerState.selectedElement.rules) {
          this.designerState.selectedElement.rules = [];
        }
        this.designerState.selectedElement.rules.push(rule);
      }
      
      // Update rules panel
      this.updateRulesPanel(this.designerState.selectedElement);
    }

    // Clear Rule Form
    clearRuleForm() {
      document.getElementById('rule-effect').value = 'SHOW';
      document.getElementById('rule-condition-scope').value = '';
      document.getElementById('rule-schema-type').value = 'minLength';
      document.getElementById('rule-schema-value').value = '';
      document.getElementById('rule-src-data-id').value = '';
      document.getElementById('rule-src-selector').value = 'input';
      document.getElementById('rule-src-property').value = 'value';
      document.getElementById('rule-tgt-data-id').value = '';
      document.getElementById('rule-tgt-selector').value = '';
      document.getElementById('rule-tgt-property').value = 'value';
    }

    // Save Properties - Fixed to apply changes correctly
    saveProperties() {
      if (!this.designerState.selectedElement) return;
      
      // Update element properties in the data model
      this.designerState.selectedElement.type = this.propType.value;
      this.designerState.selectedElement.label = this.propLabel.value;
      this.designerState.selectedElement.scope = this.propScope.value;
      this.designerState.selectedElement.css = this.propCss.value;
      this.designerState.selectedElement.required = this.propRequired.checked;
      
      // Refresh the designer to show the changes
      this.refreshDesigner();
      wc.Prompt.toast({title: 'Properties Updated!'});
    }

    // Refresh Designer
    refreshDesigner() {
      // Save the current selection
      const selectedId = this.designerState.selectedElement ? this.designerState.selectedElement.id : null;
      
      // Clear the designer surface
      this.designerSurface.innerHTML = '';
      
      // Re-add all top-level elements
      this.designerState.elements.forEach(element => {
        this.addElementToDesigner(element, this.designerSurface);
      });
      
      // Re-select the previously selected element
      if (selectedId) {
        this.selectElement(selectedId);
      }
    }

    // Remove Element
    removeElement(elementId) {
      if (!confirm('Are you sure you want to delete this element?')) return;
      
      // Find the element
      const element = this.findElementById(elementId);
      if (!element) return;
      
      // Find the parent element
      const parent = this.findParentElement(elementId);
      
      if (parent) {
        // Remove from parent
        parent.elements = parent.elements.filter(e => e.id !== elementId);
      } else {
        // Remove from top level
        this.designerState.elements = this.designerState.elements.filter(e => e.id !== elementId);
      }
      
      // Clear selection if the removed element was selected
      if (this.designerState.selectedElement && this.designerState.selectedElement.id === elementId) {
        this.designerState.selectedElement = null;
        this.noSelectionPanel.classList.remove('hidden');
        this.elementPropertiesPanel.classList.add('hidden');
        document.getElementById('rules-no-selection').classList.remove('hidden');
        document.getElementById('element-rules').classList.add('hidden');
      }
      
      // Refresh the designer
      this.refreshDesigner();
    }

    // Find Element By ID
    findElementById(elementId) {
      // First check top-level elements
      let found = this.designerState.elements.find(e => e.id === elementId);
      if (found) return found;
      
      // Check nested elements recursively
      const checkElements = (elements) => {
        if (!elements) return null;
        
        for (const element of elements) {
          if (element.id === elementId) return element;
          
          if (element.elements && element.elements.length > 0) {
            const nestedFound = checkElements(element.elements);
            if (nestedFound) return nestedFound;
          }
        }
        return null;
      };
      
      return checkElements(this.designerState.elements);
    }

    // Find Parent Element
    findParentElement(elementId) {
      const checkElements = (elements) => {
        if (!elements) return null;
        
        for (const element of elements) {
          if (element.elements && element.elements.some(e => e.id === elementId)) {
            return element;
          }
          
          if (element.elements && element.elements.length > 0) {
            const nestedFound = checkElements(element.elements);
            if (nestedFound) return nestedFound;
          }
        }
        return null;
      };
      
      return checkElements(this.designerState.elements);
    }

    // Load Schema
    loadSchema(schema) {
      this.designerState.schema = schema;
      
      // Populate schema fields
      this.schemaFields.innerHTML = '';
      
      // Process top-level properties
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]) => {
          this.addSchemaField(`#/properties/${key}`, prop, schema.required);
        });
      }
      
      // Process definitions
      if (schema.$defs) {
        Object.entries(schema.$defs).forEach(([defName, def]) => {
          if (def.properties) {
            Object.entries(def.properties).forEach(([key, prop]) => {
              this.addSchemaField(`#/$defs/${defName}/${key}`, prop, def.required);
            });
          }
        });
      }
    }

    // Add Schema Field
    addSchemaField(path, prop, required) {
      const fieldItem = document.createElement('div');
      fieldItem.className = 'element-item';
      fieldItem.setAttribute('draggable', 'true');
      fieldItem.setAttribute('data-schema-field', path);
      
      // Set appropriate element type based on property type
      let elementType = 'wc-input';
      if (prop.type === 'boolean') {
        elementType = 'wc-input-checkbox';
      } else if (prop.type === 'array') {
        elementType = 'array';
      }
      
      fieldItem.setAttribute('data-element-type', elementType);
      
      // Field name
      const fieldName = path.split('/').pop();
      
      // Format display name based on path
      let displayName = fieldName;
      
      // If it's a $defs schema field, format it with parent.fieldName
      if (path.includes('$defs')) {
        const parts = path.split('/');
        if (parts.length >= 3) {
          const defName = parts[2]; // Get the definition name
          displayName = defName + '.' + fieldName;
        }
      }
      
      fieldItem.textContent = displayName;
      
      // Add required indicator
      if (required && required.includes(fieldName)) {
        const requiredSpan = document.createElement('span');
        requiredSpan.className = 'ms-1 text-danger';
        requiredSpan.textContent = '*';
        fieldItem.appendChild(requiredSpan);
      }
      
      // Add type indicator
      const typeSpan = document.createElement('span');
      typeSpan.className = 'ms-2 text-muted small';
      typeSpan.textContent = `(${prop.type})`;
      fieldItem.appendChild(typeSpan);
      
      // Set up drag event
      fieldItem.addEventListener('dragstart', e => {
        e.dataTransfer.setData('element-type', elementType);
        e.dataTransfer.setData('schema-field', path);
        e.dataTransfer.effectAllowed = 'copy';
      });
      
      this.schemaFields.appendChild(fieldItem);
    }

    //
    // Preview
    //

    // Render Preview
    renderPreview() {
      this.generateJson();

      const iframe = document.getElementById('rendered-preview')
      // listen *before* you submit
      iframe.addEventListener('load', () => {
        WaveHelpers.toggleIndicator('#content-loader', false);
      }, { once: true });
      WaveHelpers.toggleIndicator('#content-loader', true);

      // 1. Create a form targeting the iframe
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/gen/generate_dynamic_layout';
      form.target = 'rendered-preview';

      // 2. Add any parameters
      const jsonInput = document.createElement('input');
      jsonInput.type = 'hidden';
      jsonInput.name = 'JSONSchema';
      jsonInput.value = this.schemaJson.editor.getValue();
      form.appendChild(jsonInput);

      const layoutInput = document.createElement('input');
      layoutInput.type = 'hidden';
      layoutInput.name = 'UILayout';
      layoutInput.value = this.jsonOutput.editor.getValue();
      form.appendChild(layoutInput);

      // 3. Add the form to the document, submit it, then remove it
      document.body.appendChild(form);
      form.submit();
      form.remove();
    }

    // Pre Render Preview
    preRenderPreview() {
      this.generateJson();

      const iframe = document.getElementById('pre-rendered-preview')
      // listen *before* you submit
      iframe.addEventListener('load', () => {
        WaveHelpers.toggleIndicator('#content-loader', false);
      }, { once: true });
      WaveHelpers.toggleIndicator('#content-loader', true);

      // 1. Create a form targeting the iframe
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = '/gen/generate_pre_dynamic_layout';
      form.target = 'pre-rendered-preview';

      // 2. Add any parameters
      const jsonInput = document.createElement('input');
      jsonInput.type = 'hidden';
      jsonInput.name = 'JSONSchema';
      jsonInput.value = this.schemaJson.editor.getValue();
      form.appendChild(jsonInput);

      const layoutInput = document.createElement('input');
      layoutInput.type = 'hidden';
      layoutInput.name = 'UILayout';
      layoutInput.value = this.jsonOutput.editor.getValue();
      form.appendChild(layoutInput);

      // 3. Add the form to the document, submit it, then remove it
      document.body.appendChild(form);
      form.submit();
      form.remove();
    }

    // Generate JSON
    generateJson() {
      const json = {
        elements: this.designerState.elements
      };
      
      // Remove temporary IDs from final JSON
      const cleanJson = JSON.parse(JSON.stringify(json)); // Deep clone to avoid reference issues
      
      const cleanIds = (elements) => {
        if (!elements) return;
        
        elements.forEach(element => {
          delete element.id;
          if (element.elements) {
            cleanIds(element.elements);
          }
        });
      };
      
      cleanIds(cleanJson.elements);
      this.jsonOutput.editor.setValue(JSON.stringify(cleanJson.elements, null, 2));

      return cleanJson.elements;
    }

    // Copy Design to Clipboard
    copyDesign() {
      const textToCopy = this.jsonOutput.editor.getValue();
      
      navigator.clipboard.writeText(textToCopy)
        .then(() => {
          const originalText = this.copyDesignButton.textContent;
          this.copyDesignButton.textContent = 'Copied!';
          
          setTimeout(() => {
            this.copyDesignButton.textContent = originalText;
          }, 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
          alert('Failed to copy JSON to clipboard');
        });
    }

    // Check if element type is a container
    isContainerElement(type) {
      return [
        'wc-tab', 'wc-tab-item', 'column', 'row', 'fieldset', 'array', 'wc-card', 'option',
        'wc-accordion', 'wc-split-button', 'wc-sidebar-left', 'wc-sidebar-right', 'wc-sidenav-left', 'wc-sidenav-right',
        'wc-timeline', 'wc-tabulator', 'wc-slideshow', 'wc-select', 'wc-form', 'wc-breadcrumb'

      ].includes(type);
    }

    // Generate Unique ID
    generateUniqueId() {
      return uuid.v4().substring(0, 12);
    }

    // Get Default Label for Element Type
    getDefaultLabel(type) {
      switch (type) {
        case 'wc-tab':
          return 'Tab Container';
        case 'wc-tab-item':
          return 'Tab Item';
        case 'column':
          return 'Column';
        case 'row':
          return 'Row';
        case 'fieldset':
          return 'Group';
        case 'array':
          return 'Array';
        case 'wc-card':
          return 'Card';
        case 'wc-input':
          return 'Input Field';
        case 'wc-input-checkbox':
          return 'Checkbox';
        case 'hr':
          return '';
        default:
          return type;
      }
    }



    saveDesignToLocalStorage() {
      const designName = 'layout-ui-design';
      const jsonText = this.jsonOutput.editor.getValue();
      
      try {
        // Get existing saved designs
        let savedDesigns = JSON.parse(localStorage.getItem('savedDesigns') || '{}');
        
        // Add/update this design
        savedDesigns[designName] = jsonText;
        
        // Save back to localStorage
        localStorage.setItem('savedDesigns', JSON.stringify(savedDesigns));
        
        alert(`Design "${designName}" saved successfully`);
      } catch (e) {
        console.error('Error saving design to localStorage:', e);
        alert('Failed to save design to localStorage');
      }
    }

    loadDesign(layoutData) {
      try {
        // Verify the data is an array (elements) or has an elements property
        let elements = Array.isArray(layoutData) ? layoutData : 
                      (layoutData.elements ? layoutData.elements : null);
        
        if (!elements) {
          throw new Error('Invalid layout structure. Expected an array or an object with an elements property.');
        }
        
        // Clear the current elements
        this.designerState.elements = [];
        
        // Recursively add IDs to all elements
        const addIds = (elements) => {
          if (!elements) return;
          
          elements.forEach(element => {
            if (element['data-id']) {
              element.id = element['data-id'];
            } else {
              element.id = generateUniqueId();
            }
            if (element.elements) {
              addIds(element.elements);
            }
          });
        };
        
        // Add IDs to all elements
        addIds(elements);
        
        // Update the designer state
        this.designerState.elements = elements;
        
        // Rebuild the designer surface
        this.refreshDesigner();
            
        return true;
      } catch (e) {
        console.error('Error loading design:', e);
        alert('Failed to load design: ' + e.message);
        return false;
      }
    }
  }

  customElements.define('wc-page-designer', WcPageDesigner);
}