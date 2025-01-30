/*
 * Name: WcTabulator
 *
 * 
 * 
 * 
 * References:
 *  https://tabulator.info/docs/6.3/data#ajax-headers
 *  https://randomuser.me/documentation#howto
 */

import { sleep } from './helper-function.js';
import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-tabulator')) {
  class WcTabulator extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class'];
    }

    icons = {
      "eye": {
        "viewport": "0 0 640 512",
        "d": "M117.2 136C160.3 96 217.6 64 288 64s127.7 32 170.8 72c43.1 40 71.9 88 85.2 120c-13.3 32-42.1 80-85.2 120c-43.1 40-100.4 72-170.8 72s-127.7-32-170.8-72C74.1 336 45.3 288 32 256c13.3-32 42.1-80 85.2-120zM288 32c-80.8 0-145.5 36.8-192.6 80.6C48.6 156 17.3 208 2.5 243.7c-3.3 7.9-3.3 16.7 0 24.6C17.3 304 48.6 356 95.4 399.4C142.5 443.2 207.2 480 288 480s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C433.5 68.8 368.8 32 288 32zM192 256a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zm224 0a128 128 0 1 0 -256 0 128 128 0 1 0 256 0z"
      },
      "eyeSlash": {
        "viewport": "0 0 640 512",
        "d": "M38.8 5.1C28.4-3.1 13.3-1.2 5.1 9.2S-1.2 34.7 9.2 42.9l592 464c10.4 8.2 25.5 6.3 33.7-4.1s6.3-25.5-4.1-33.7L525.6 386.7c39.6-40.6 66.4-86.1 79.9-118.4c3.3-7.9 3.3-16.7 0-24.6c-14.9-35.7-46.2-87.7-93-131.1C465.5 68.8 400.8 32 320 32c-68.2 0-125 26.3-169.3 60.8L38.8 5.1zm151 118.3C226 97.7 269.5 80 320 80c65.2 0 118.8 29.6 159.9 67.7C518.4 183.5 545 226 558.6 256c-12.6 28-36.6 66.8-70.9 100.9l-53.8-42.2c9.1-17.6 14.2-37.5 14.2-58.7c0-70.7-57.3-128-128-128c-32.2 0-61.7 11.9-84.2 31.5l-46.1-36.1zM394.9 284.2l-81.5-63.9c4.2-8.5 6.6-18.2 6.6-28.3c0-5.5-.7-10.9-2-16c.7 0 1.3 0 2 0c44.2 0 80 35.8 80 80c0 9.9-1.8 19.4-5.1 28.2zm9.4 130.3C378.8 425.4 350.7 432 320 432c-65.2 0-118.8-29.6-159.9-67.7C121.6 328.5 95 286 81.4 256c8.3-18.4 21.5-41.5 39.4-64.8L83.1 161.5C60.3 191.2 44 220.8 34.5 243.7c-3.3 7.9-3.3 16.7 0 24.6c14.9 35.7 46.2 87.7 93 131.1C174.5 443.2 239.2 480 320 480c47.8 0 89.9-12.9 126.2-32.5l-41.9-33zM192 256c0 70.7 57.3 128 128 128c13.3 0 26.1-2 38.2-5.8L302 334c-23.5-5.4-43.1-21.2-53.7-42.3l-56.1-44.2c-.2 2.8-.3 5.6-.3 8.5z"
      },
      "square": {
        "viewport": "0 0 448 512",
        "d": "M384 80c8.8 0 16 7.2 16 16l0 320c0 8.8-7.2 16-16 16L64 432c-8.8 0-16-7.2-16-16L48 96c0-8.8 7.2-16 16-16l320 0zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z"
      },
      "squareCheck": {
        "viewport": "0 0 448 512",
        "d": "M64 80c-8.8 0-16 7.2-16 16l0 320c0 8.8 7.2 16 16 16l320 0c8.8 0 16-7.2 16-16l0-320c0-8.8-7.2-16-16-16L64 80zM0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z"
      },
      "remove": {
        "viewport": "0 0 448 512",
        "d": "M177.1 48l93.7 0c2.7 0 5.2 1.3 6.7 3.6l19 28.4-145 0 19-28.4c1.5-2.2 4-3.6 6.7-3.6zM354.2 80L317.5 24.9C307.1 9.4 289.6 0 270.9 0L177.1 0c-18.7 0-36.2 9.4-46.6 24.9L93.8 80 80.1 80 32 80l-8 0C10.7 80 0 90.7 0 104s10.7 24 24 24l11.6 0L59.6 452.7c2.5 33.4 30.3 59.3 63.8 59.3l201.1 0c33.5 0 61.3-25.9 63.8-59.3L412.4 128l11.6 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-8 0-48.1 0-13.7 0zm10.1 48L340.5 449.2c-.6 8.4-7.6 14.8-16 14.8l-201.1 0c-8.4 0-15.3-6.5-16-14.8L83.7 128l280.6 0z"
      },
      "clone": {
        "viewport": "0 0 512 512",
        "d": "M288 448L64 448l0-224 64 0 0-64-64 0c-35.3 0-64 28.7-64 64L0 448c0 35.3 28.7 64 64 64l224 0c35.3 0 64-28.7 64-64l0-64-64 0 0 64zm-64-96l224 0c35.3 0 64-28.7 64-64l0-224c0-35.3-28.7-64-64-64L224 0c-35.3 0-64 28.7-64 64l0 224c0 35.3 28.7 64 64 64z"
      },
      "check": {
        "viewport": "0 0 448 512",
        "d": "M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"
      },
      "checkDouble": {
        "viewport": "0 0 448 512",
        "d": "M337 81c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-143 143L97 127c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9l80 80c9.4 9.4 24.6 9.4 33.9 0L337 81zM441 201c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-247 247L41 295c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9L143 465c9.4 9.4 24.6 9.4 33.9 0L441 201z"
      },
      "listCheck": {
        "viewport": "0 0 512 512",
        "d": "M156.3 58.2c5.7-6.8 4.7-16.9-2-22.5s-16.9-4.7-22.5 2L62.9 120.3 27.3 84.7c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6l48 48c3.2 3.2 7.5 4.9 12 4.7s8.7-2.3 11.6-5.7l80-96zm0 160c5.7-6.8 4.7-16.9-2-22.5s-16.9-4.7-22.5 2L62.9 280.3 27.3 244.7c-6.2-6.2-16.4-6.2-22.6 0s-6.2 16.4 0 22.6l48 48c3.2 3.2 7.5 4.9 12 4.7s8.7-2.3 11.6-5.7l80-96zM192 96c0 8.8 7.2 16 16 16l288 0c8.8 0 16-7.2 16-16s-7.2-16-16-16L208 80c-8.8 0-16 7.2-16 16zm0 160c0 8.8 7.2 16 16 16l288 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-288 0c-8.8 0-16 7.2-16 16zM160 416c0 8.8 7.2 16 16 16l320 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-320 0c-8.8 0-16 7.2-16 16zm-64 0a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"
      },
      "list": {
        "viewport": "0 0 512 512",
        "d": "M40 48C26.7 48 16 58.7 16 72l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24L40 48zM184 72c-13.3 0-24 10.7-24 24s10.7 24 24 24l304 0c13.3 0 24-10.7 24-24s-10.7-24-24-24L184 72zm0 160c-13.3 0-24 10.7-24 24s10.7 24 24 24l304 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-304 0zm0 160c-13.3 0-24 10.7-24 24s10.7 24 24 24l304 0c13.3 0 24-10.7 24-24s-10.7-24-24-24l-304 0zM16 232l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0c-13.3 0-24 10.7-24 24zM40 368c-13.3 0-24 10.7-24 24l0 48c0 13.3 10.7 24 24 24l48 0c13.3 0 24-10.7 24-24l0-48c0-13.3-10.7-24-24-24l-48 0z"
      },
      "xmark": {
        "viewport": "0 0 384 512",
        "d": "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
      },
      "download": {
        "viewport": "0 0 512 512",
        "d": "M280 24c0-13.3-10.7-24-24-24s-24 10.7-24 24l0 270.1-95-95c-9.4-9.4-24.6-9.4-33.9 0s-9.4 24.6 0 33.9L239 369c9.4 9.4 24.6 9.4 33.9 0L409 233c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-95 95L280 24zM128.8 304L64 304c-35.3 0-64 28.7-64 64l0 80c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-80c0-35.3-28.7-64-64-64l-64.8 0-48 48L448 352c8.8 0 16 7.2 16 16l0 80c0 8.8-7.2 16-16 16L64 464c-8.8 0-16-7.2-16-16l0-80c0-8.8 7.2-16 16-16l112.8 0-48-48zM432 408a24 24 0 1 0 -48 0 24 24 0 1 0 48 0z"
      }
    }
    funcs = {};
    rowMenu = [
      {
        label: this.createMenuLabel('Select All Rows', this.icons.listCheck),
        action: (e, row) => {
          const table = row.getTable();
          table.selectRow();
        }
      },
      {
        label: this.createMenuLabel('Un-Select Rows', this.icons.list),
        action: (e, row) => {
          const table = row.getTable();
          table.deselectRow();
        }
      },
      {
        label: this.createMenuLabel('Select Row', this.icons.check),
        action: (e, row) => {
          row.select();
        }
      },
      {
        label: this.createMenuLabel('Un-Select Row', this.icons.xmark),
        action: (e, row) => {
          row.deselect();
        }
      },
      {
        separator:true,
      },
      {
        label: this.createMenuLabel('Delete Row', this.icons.remove),
        action: (e, row) => {
          // row.delete();
          console.log("Deleting row...");
          wc.Prompt.question({title: 'Are you sure?', 
            text: 'This record will be deleted. Are you sure?',
            callback: (result) => {
              if (this.funcs['onDelete']) {
                this.funcs['onDelete'](result);
              }
            }
          });
        }
      },
      {
        label: this.createMenuLabel('Clone Row', this.icons.clone),
        action: (e, row) => {
          console.log("Cloning row...");
          wc.Prompt.notifyTemplate({
            template: '#clone-template',
            callback: (result) => {
              if (this.funcs['onClone']) {
                this.funcs['onClone'](result);
              }
            }
          });
        }
      },
      {
        separator:true,
      },
      {
        label: this.createMenuLabel('Download Table', this.icons.download),
        action: (e, row) => {
          console.log('Download row...');
          // wc.Prompt.banner({text: 'hello world 2', type: 'success'});
          // wc.Prompt.toast({title: 'Save successful!', type: 'success'});
          // wc.Prompt.success({title: 'Save successful!', text: 'The records have been saved successfuly!'});
          // wc.Prompt.question({title: 'Are you sure?', text: 'This record will be deleted. Are you sure?'});
          // wc.Prompt.notify({icon: 'question', title: 'Are you sure?', text: 'This record will be deleted. Are you sure?'});
          wc.Prompt.notify({icon: 'info', title: 'Download Format?',
            text: 'Please select the format:', input: 'select',
            inputPlaceholder: 'Select a format',
            inputOptions: {csv: 'CSV', json: 'JSON', html: 'HTML', pdf: 'PDF', xlsx: 'XLSX'},
            callback: (result) => {
              const table = row.getTable();
              switch(result) {
                case 'csv':
                  table.download("csv", "data.csv");
                  break;
                case 'json':
                  table.download("json", "data.json");
                  break;
                case 'html':
                  table.download("html", "data.html");
                  break;
                case 'pdf':
                  table.download("pdf", "data.pdf");
                  break;
                case 'xlsx':
                  table.download("xlsx", "data.xlsx", {});
                  break;
              }
              wc.Prompt.toast({title: 'Download in progress...', type: 'success'});
            }
          });
        }
      }
    ];

    constructor() {
      super();
      this.table = null;

      this._internals = this.attachInternals();
      const compEl = this.querySelector('.wc-tabulator');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-tabulator');
        this.componentElement.id = this.getAttribute('id') || 'wc-tabulator';
        this.appendChild(this.componentElement);      
      }
      console.log('ctor:wc-tabulator');
    }

    async connectedCallback() {
      super.connectedCallback();

      this._applyStyle();
      console.log('conntectedCallback:wc-tabulator');
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    async _handleAttributeChange(attrName, newValue) {
      super._handleAttributeChange(attrName, newValue); 
    }

    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-tabulator > *');
      if (innerEl) {
        // Do nothing...
      } else {
        this.componentElement.innerHTML = '';
        this._createInnerElement();
      }

      console.log('_render:wc-tabulator');
    }

    async _createInnerElement() {
      // const container = document.createElement('div');
      // container.id = this.getAttribute('id') || 'wc-tabulator';
      // this.appendChild(container);
      const pagination = this.hasAttribute('pagination');
      const paginationSize = this.getAttribute('pagination-size');
      const paginationCounter = this.getAttribute('pagination-counter');
      const movableColumns = this.getAttribute('movable-columns');
      const resizableColumns = this.getAttribute('resizable-columns');
      const resizableColumnGuide = this.getAttribute('resizable-column-guide');
      const movableRows = this.getAttribute('movable-rows');
      const rowHeader = this.getAttribute('row-header');
      const rowHeight = this.getAttribute('row-height');
      const resizableRows = this.getAttribute('resizable-rows');
      const resizableRowGuide = this.getAttribute('resizable-row-guide');
      const frozenRows = this.getAttribute('frozen-rows');
      const persistence = this.getAttribute('persistence');
      const headerVisible = this.getAttribute('header-visible');
      const rowContextMenu = this.getAttribute('row-context-menu');
      const placeholder = this.getAttribute('placeholder');
      const selectableRows = this.getAttribute('selectable-rows');
      const colFieldFormatter = this.getAttribute('col-field-formatter') || '{}';
      const responsiveLayout = this.getAttribute('responsive-layout');
      const groupBy = this.getAttribute('group-by');

      // Process any column field formatters.
      if (colFieldFormatter) {
        let obj = JSON.parse(colFieldFormatter);
        if (obj && obj.params && obj.params.url) {
          obj.params.url = this.resolveFormatter(obj.params, obj.params.url);
        }
        this.colFieldFormatter = obj;
      } 

      this.getFuncs();
      const options = {
        columns: this.getColumnsConfig(),
        layout: this.getAttribute('layout') || 'fitData',
        filterMode: 'remote',
        sortMode: 'remote',
        ajaxURL: this.getAttribute('ajax-url') || '', // URL for server-side loading
        ajaxURLGenerator: this.getAjaxURLGenerator.bind(this),
        ajaxConfig: this.getAjaxConfig(),
        ajaxResponse: this.handleAjaxResponse.bind(this), // Optional custom handling of server response
      };

      if (pagination) options.pagination = pagination;
      if (options.pagination) {
        options.paginationMode = 'remote';
        if (paginationSize) {
          options.paginationSize = parseInt(paginationSize) || 10;
        } else {
          options.paginationSize = 10;
        }
      }

      if (paginationCounter) options.paginationCounter = paginationCounter;
      if (movableColumns) options.movableColumns = movableColumns.toLowerCase() == 'true' ? true : false;
      if (resizableColumns) options.resizableColumns = resizableColumns.toLowerCase() == 'true' ? true : false;
      if (resizableColumnGuide) options.resizableColumnGuide = resizableColumnGuide.toLowerCase() == 'true' ? true : false;
      if (movableRows) options.movableRows = movableRows.toLowerCase() == 'true' ? true : false;
      if (rowHeader) options.rowHeader = JSON.parse(rowHeader);
      if (rowHeight) options.rowHeight = parseInt(rowHeight);
      if (resizableRows) options.resizableRows = resizableRows.toLowerCase() == 'true' ? true : false;
      if (resizableRowGuide) options.resizableRowGuide = resizableRowGuide.toLowerCase() == 'true' ? true : false;
      if (frozenRows) options.frozenRows = parseInt(frozenRows);
      if (persistence) options.persistence = persistence.toLowerCase() == 'true' ? true : false;
      if (options.persistence) options.persistenceID = container.id;
      if (headerVisible) options.headerVisible = headerVisible.toLowerCase() == 'true' ? true : false;
      if (rowContextMenu) {
        if (rowContextMenu == 'rowContextMenu') {
          options.rowContextMenu = this.rowMenu;
        }
      }
      if (placeholder) options.placeholder = placeholder;
      if (selectableRows) {
        if (!isNaN(parseInt(selectableRows))) {
          options.selectableRows = parseInt(selectableRows);
        } else {
          options.selectableRows = selectableRows.toLowerCase() == 'true' ? true : false;
        }
      }
      if (groupBy) options.groupBy = groupBy;
      if (responsiveLayout) options.responsiveLayout = responsiveLayout;

      await this.renderTabulator(options);
    }

    async renderTabulator(options) {
      await Promise.all([
        this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
        this.loadScript('https://unpkg.com/jspdf-autotable@3.8.4/dist/jspdf.plugin.autotable.js'),
        this.loadScript('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js'),
        this.loadScript('https://cdn.jsdelivr.net/npm/luxon@2.3.1/build/global/luxon.min.js'),
        this.loadCSS('https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css'),
        this.loadLibrary('https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js', 'Tabulator'),
      ]);
        
      this.table = new Tabulator(this.componentElement, options);
      this.table.on("tableBuilt", async () => {
        console.log('wc-tabulator:tableBuilt - broadcasting wc-tabulator:ready');
        wc.EventHub.broadcast('wc-tabulator:ready', [], '');
        if (typeof htmx !== 'undefined') {
          await sleep(1000);
          htmx.process(this);
        }
      });
      this.table.on("rowClick", (e, row) => {
        //e - the click event object
        //row - row component
        var rowData = row.getData();
        var rowIndex = row.getIndex();
        var rowPosition = row.getPosition();
        const custom = { e, row, rowData, rowIndex, rowPosition };
        wc.EventHub.broadcast('wc-tabulator:row-click', '', '', custom);
    });
    }

    getFuncs() {
      const funcElements = this.querySelectorAll('wc-tabulator-func');
      funcElements.forEach((el) => {
        const name = el.getAttribute('name');
        const func = el.getAttribute('value');
        const value = new Function(`return (${func})`)(); // Inline function
        this.funcs[name] = value;
      });
    }

    getColumnsConfig() {
      const columns = [];
      const columnElements = this.querySelectorAll('wc-tabulator-column');

      columnElements.forEach((col) => {
        const field = col.getAttribute('field');
        const title = col.getAttribute('title') || field;
        const width = col.getAttribute('width');
        const widthGrow = col.getAttribute('width-grow');
        const widthShrink = col.getAttribute('width-shrink');
        const minWidth = col.getAttribute('min-width');
        const maxWidth = col.getAttribute('max-width');
        const maxInitialWidth = col.getAttribute('max-initial-width');
        const resizable = col.getAttribute('resizable');
        const editable = col.getAttribute('editable');
        const frozen = col.getAttribute('frozen');
        const responsive = col.getAttribute('responsive');
        const tooltip = col.getAttribute('tooltip');
        const cssClass = col.getAttribute('css-class');
        const rowHandle = col.getAttribute('row-handle');
        const htmlOutput = col.getAttribute('html-output');
        const print = col.getAttribute('print');
        const clipboard = col.getAttribute('clipboard');
        const titleFormatter = col.getAttribute('title-formatter');
        const formatter = col.getAttribute('formatter');
        const formatterParams = col.getAttribute('formatter-params');
        const hozAlign = col.getAttribute('hoz-align');
        const vertAlign = col.getAttribute('vert-align') || 'middle';
        const headerHozAlign = col.getAttribute('header-hoz-align');
        const visible = col.getAttribute('visible');
        const headerSort = col.getAttribute('header-sort');
        const headerSortStartingDir = col.getAttribute('header-sort-starting-dir');
        const headerSortTristate = col.getAttribute('header-sort-tristate');
        const sorter = col.getAttribute('sorter');
        const sorterParams = col.getAttribute('sorter-params');
        const headerFilter = col.getAttribute('header-filter');
        const headerFilterParams = col.getAttribute('header-filter-params');
        const headerFilterPlaceholder = col.getAttribute('header-filter-placeholder');
        const headerFilterFunc = col.getAttribute('header-filter-func');
        const headerMenu = col.getAttribute('header-menu');
        const editor = col.getAttribute('editor');
        const editorParams = col.getAttribute('editor-params');
        const cellClick = col.getAttribute('cell-click');
        const bottomCalc = col.getAttribute('bottom-calc');
        const bottomCalcParams = col.getAttribute('bottom-calc-params');
        const topCalc = col.getAttribute('top-calc');
        const topCalcParams = col.getAttribute('top-calc-params');

        const column = { field, title };
        if (width) column.width = width;
        if (widthGrow) column.widthGrow = parseInt(widthGrow);
        if (widthShrink) column.widthShrink = parseInt(widthShrink);
        if (minWidth) column.minWidth = minWidth;
        if (maxWidth) column.maxWidth = maxWidth;
        if (maxInitialWidth) column.maxInitialWidth = maxInitialWidth;
        if (resizable) column.resizable = resizable.toLowerCase() == 'true' ? true : false;
        if (editable) column.editable = editable.toLowerCase() == 'true' ? true : false;
        if (frozen) column.frozen = frozen.toLowerCase() == 'true' ? true : false;
        if (responsive) column.responsive = parseInt(responsive);
        if (tooltip) column.tooltip = tooltip;
        if (cssClass) column.cssClass = cssClass;
        if (rowHandle) column.rowHandle = rowHandle.toLowerCase() == 'true' ? true : false;
        if (htmlOutput) column.htmlOutput = htmlOutput;
        if (print) column.print = print.toLowerCase() == 'true' ? true : false;
        if (clipboard) column.clipboard = clipboard.toLowerCase() == 'true' ? true : false;
        if (headerSort) column.headerSort = headerSort.toLowerCase() == 'true' ? true : false;
        if (headerSortStartingDir) column.headerSortStartingDir = headerSortStartingDir;
        if (headerSortTristate) column.headerSortTristate = headerSortTristate.toLowerCase() == 'true' ? true : false;
        if (headerFilter) column.headerFilter = headerFilter;
        if (headerFilterParams) column.headerFilterParams = JSON.parse(headerFilterParams);
        if (headerFilterPlaceholder) column.headerFilterPlaceholder = headerFilterPlaceholder;
        if (headerFilterFunc) column.headerFilterFunc = headerFilterFunc;
        if (headerMenu) {
          if (headerMenu == 'headerMenu') {
            column.headerMenu = this.headerMenu.bind(this);
          }
        }
        if (editor) {
          if (editor == 'dateEditor') {
            column.editor = this.dateEditor.bind(this);
          } else {
            column.editor = editor;
          }
        } 
        if (editorParams) column.editorParams = JSON.parse(editorParams);
        if (cellClick) {
          column.cellClick = this.resolveFunc(cellClick);
        }
        if (titleFormatter) column.titleFormatter = titleFormatter;

        if (formatter) {
          column.formatter = this.resolveCellFormatter(formatter);
        } else {
          // {"cols": ["first_name", "last_name"], "formatter": "link", "params": {"routePrefix": "screen", "screen": "contact", "url": "urlFormatter"}}
          if (field && this.colFieldFormatter?.cols?.includes(field)) {
            column.formatter = this.colFieldFormatter.formatter;                        
          }
        }
        if (formatterParams) {
          const fp = JSON.parse(formatterParams);
          if (fp && fp.url) {
            fp.url = this.resolveFormatter(fp, fp.url);
            column.formatterParams = fp;
          }
        } else {
          // {"cols": ["first_name", "last_name"], "formatter": "link", "params": {"routePrefix": "screen", "screen": "contact", "url": "urlFormatter"}}
          if (field && this.colFieldFormatter?.cols?.includes(field)) {
            column.formatterParams = this.colFieldFormatter.params;
          }
        }
        if (hozAlign) column.hozAlign = hozAlign; // left|center|right
        if (vertAlign) column.vertAlign = vertAlign; // top|middle|bottom
        if (headerHozAlign) column.headerHozAlign = headerHozAlign; // left|center|right
        if (visible) column.visible = visible.toLowerCase() == 'true' ? true : false;
        if (sorter) column.sorter = sorter;
        if (sorterParams) column.sorterParams = JSON.parse(sorterParams);
        if (bottomCalc) column.bottomCalc = bottomCalc;
        if (bottomCalcParams) column.bottomCalcParams = JSON.parse(bottomCalcParams);
        if (topCalc) column.topCalc = topCalc;
        if (topCalcParams) column.topCalcParams = JSON.parse(topCalcParams);

        columns.push(column);
      });

      return columns;
    }

    resolveFunc(func) {
      try {
        if (func.startsWith('function')) {
          return new Function(`return (${func})`)(); // Inline function
        } else if (this[func]) {
          return this[func]; // Class function
        } else if (window[func]) {
          return window[func]; // Global function
        } else {
          console.warn(`Func "${func}" not found.`);
          return null;
        }
      } catch (error) {
        console.error(`Error resolving func: ${error.message}`);
        return null;
      }
    }

    resolveFormatter(params, formatter) {
      try {
        // Check if formatter is an inline function or a global function name
        if (formatter.startsWith('function')) {
          return new Function(`return (${formatter})`)(params); // Inline function
        } else if (this[formatter]) {
          return this[formatter]; // Class function
        } else if (window[formatter]) {
          return window[formatter]; // Global function
        } else {
          console.warn(`Formatter "${formatter}" not found.`);
          return null;
        }
      } catch (error) {
        console.error(`Error resolving formatter: ${error.message}`);
        return null;
      }
    }

    pageRowNum = function(cell, formatterParams, onRendered) {
      var row = cell.getRow();
      var table = cell.getTable(); // Get reference to the table
      var page = table.getPage() || 1; // Get current page (defaults to 1)
      var pageSize = table.getPageSize(); // Get pagination size
      var index = row.getPosition(true); // Get index position in the data set
      return (page - 1) * pageSize + index; // Compute correct row number
    }

    resolveCellFormatter(formatter) {
      try {
        // Check if formatter is an inline function or a global function name
        if (formatter) {
          if (formatter.startsWith('function')) {
            const val = new Function('cell', `return (${formatter})(cell);`);
            return val;
            // return new Function(`return (${formatter})`)(cell, formatterParams, onRendered); // Inline function
          } else if (this[formatter]) {
            return this[formatter]; // Class function
          } else if (window[formatter]) {
            return window[formatter]; // Global function
          } else {
            return formatter;
          }
        }
      } catch (error) {
        console.error(`Error resolving formatter: ${error.message}`);
        return null;
      }
    }

    urlFormatter (cell, formatterParams, onRendered) {
      const routePrefix = cell.getColumn().getDefinition().formatterParams.routePrefix || 'screen';
      const screen = cell.getColumn().getDefinition().formatterParams.screen;
      const screen_id = cell.getColumn().getDefinition().formatterParams.screen_id;
      const id_name = cell.getColumn().getDefinition().formatterParams.id_name;
      const data = cell.getData();
      const id = data._id;
      let url = '';
      if (screen) {
        url = `/${routePrefix}/${screen}/${id}`;
      } else {
        // /x/64f525ffbe4a5f4c9cf79afb?macro_builder_id=65a5c4b71443ccf68de9e55a
        url = `/${routePrefix}/${screen_id}?${id_name}=${id}`;
      }
      return url;
    }

    toggleSelect(e, cell) {
      cell.getRow().toggleSelect();
    }

    headerMenu() {
      var menu = [];
      var columns = this.table.getColumns();

      let hideLabel = this.createMenuLabel('Hide Filter', this.icons.eyeSlash);
      menu.push({
        label:hideLabel,
        action: async (e) => {
          let promises = [];
          let cols = this.table.getColumns();
          //prevent menu closing
          e.stopPropagation();
          for (let col of cols) {
            await col.updateDefinition({headerFilter:false});
          }
        }
      });
      let showLabel = this.createMenuLabel('Show Filter', this.icons.eye);
      menu.push({
        label:showLabel,
        action: (e) => {
          let cols = this.getColumnsConfig();
          //prevent menu closing
          e.stopPropagation();
          this.table.setColumns(cols)
        }
      });
      menu.push({
        separator:true,
      });


      for (let column of columns) {
        let icon = this.createHeaderMenuIcon(column, this.icons.square, this.icons.squareCheck);
        let label = document.createElement("span");
        label.classList.add("flex");
        label.classList.add("flex-row");
        label.classList.add("gap-2");

        let title = document.createElement("span");
        title.textContent = " " + column.getDefinition().title;
        title.textContent = title.textContent.replace("null", "").replace("undefined", "");
        title.classList.add("pointer-events-none");

        label.appendChild(icon);
        label.appendChild(title);

        //create menu item
        menu.push({
          label:label,
          action: (e) => {
            const {target} = e;
            //prevent menu closing
            e.stopPropagation();
            //toggle current column visibility
            column.toggle();
            // Update menu item icon
            const path = target.querySelector("path");
            path.setAttribute(
              "d",
              column.isVisible()
                ? this.icons.squareCheck.d
                : this.icons.square.d
            );
            path.classList.add("pointer-events-none");
            this.table.redraw();
          }
        });
      }
      return menu;
    }

    createHeaderMenuIcon(column) {
      //create checkbox element using font awesome icons
      let icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
      icon.setAttribute("fill", "currentColor");
      icon.classList.add("h-4");
      icon.classList.add("w-4");
      icon.classList.add("align-text-top");
      icon.classList.add("pointer-events-none");
      icon.setAttribute("viewBox", this.icons.square.viewport);

      let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute(
        "d",
        column.isVisible()
          ? this.icons.squareCheck.d
          : this.icons.square.d
      );
      path.classList.add("pointer-events-none");
      icon.appendChild(path);
      return icon;    
    }

    createMenuLabel(titleContent, icn) {
      //create checkbox element using font awesome icons
      let icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
      icon.setAttribute("fill", "currentColor");
      icon.classList.add("h-4");
      icon.classList.add("w-4");
      icon.classList.add("align-text-top");
      icon.classList.add("pointer-events-none");
      icon.setAttribute("viewBox", icn.viewport);
      let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", icn.d);
      path.classList.add("pointer-events-none");
      icon.appendChild(path);
      let label = document.createElement("span");
      label.classList.add("flex");
      label.classList.add("flex-row");
      label.classList.add("gap-2");
      let title = document.createElement("span");
      title.textContent = " " + titleContent;
      title.classList.add("pointer-events-none");
      label.appendChild(icon);
      label.appendChild(title);
      return label;
    }

    localdatetime(cell, formatterParams, onRendered) {
      let value = cell.getValue(); // Get the cell value
      
      // if (!value) return "(No Date)"; // Handle null/undefined values
      if (!value) return ""; // Handle null/undefined values
      
      let date = new Date(value); // Convert string/ISODate to Date object
      
      if (isNaN(date)) return "(Invalid Date)"; // Handle invalid dates
      
      // Format as "MM/DD/YYYY HH:mm AM/PM"
      return date.toLocaleString("en-US", {
          month: "2-digit",
          day: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
      });
    }

    dateEditor(cell, onRendered, success, cancel) {
      //cell - the cell component for the editable cell
      //onRendered - function to call when the editor has been rendered
      //success - function to call to pass thesuccessfully updated value to Tabulator
      //cancel - function to call to abort the edit and return to a normal cell

      //create and style input
      var cellValue = luxon.DateTime.fromFormat(cell.getValue(), "dd/MM/yyyy").toFormat("yyyy-MM-dd");
      input = document.createElement("input");

      input.setAttribute("type", "date");

      input.style.padding = "4px";
      input.style.width = "100%";
      input.style.boxSizing = "border-box";

      input.value = cellValue;

      onRendered(function() {
        input.focus();
        input.style.height = "100%";
      });

      function onChange() {
        if(input.value != cellValue) {
          success(luxon.DateTime.fromFormat(input.value, "yyyy-MM-dd").toFormat("dd/MM/yyyy"));
        }else{
          cancel();
        }
      }

      //submit new value on blur or change
      input.addEventListener("blur", onChange);

      //submit new value on enter
      input.addEventListener("keydown", function(e) {
        if(e.keyCode == 13){
          onChange();
        }
        if(e.keyCode == 27){
          cancel();
        }
      });

      return input;
    }

    getAjaxConfig() {
      // Custom configuration for AJAX requests
      return {
        method: 'GET', // Default to GET, can be overridden
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }

    getAjaxURLGenerator(url, config, params) {
      //url - the url from the ajaxURL property or setData function
      //config - the request config object from the ajaxConfig property
      //params - the params object from the ajaxParams property, this will also include any pagination, filter and sorting properties based on table setup

      let ajaxParamsParts = [];
      const ajaxParamsMap = JSON.parse(this.getAttribute('ajax-params-map') || '{}');
      for (const [key, value] of Object.entries(ajaxParamsMap)) {
        ajaxParamsParts.push(`${value}=${params[key]}`);
      }
      if (ajaxParamsParts.length === 0) {
        const {page, size} = params;
        if (page && size) {
          ajaxParamsParts.push(`page=${page}`);
          ajaxParamsParts.push(`size=${size}`);
        } else {
          const recordSize = this.getAttribute('record-size');
          if (recordSize) {
            ajaxParamsParts.push(`size=${recordSize}`);
          }
        }
      }

      const ajaxParams = JSON.parse(this.getAttribute('ajax-params') || '{}');
      for (const [key, value] of Object.entries(ajaxParams)) {
        ajaxParamsParts.push(`${key}=${value}`);
      }

      const {filter} = params;
      if (filter && filter.length > 0) {
        // const [first] = filter;
        // ajaxParamsParts.push(`filter=${first.value}`);
        ajaxParamsParts.push(`filter=${JSON.stringify(filter)}`);
      }

      const {sort} = params;
      if (sort && sort.length > 0) {
        ajaxParamsParts.push(`sort=${JSON.stringify(sort)}`);
      }

      const ajaxParamsStr = ajaxParamsParts.join("&");

      if (url.includes('?')) {
        return url + `&${ajaxParamsStr}`;
      } else {
        return url + `?${ajaxParamsStr}`;
      }

      // return url + `?page=${page}&results=${size}&${ajaxParamsStr}`;
      // return url + "?params=" + encodeURI(JSON.stringify(params)); //encode parameters as a json object
    }

    handleAjaxResponse(url, params, response) {
      // Custom response processing if needed
      // For example, adapting to a specific API format
      const {results} = response;
      if (this.hasAttribute('pagination')) {
        const {data, last_page} = response;
        if (data == null && last_page === 0) {
          return {last_page: 0, data: []};  
        }
        else if (data && last_page) {
          return {last_page, data};  
        } else {
          return {last_page: 10, data: results};
        }  
      } else {
        return results;
      }
    }

    _applyStyle() {
      const style = `
  /* Tabulator */
  wc-tabulator {
    display: contents;
  }
  .wc-tabulator.tabulator {
    background-color: var(--card-bg-color);
    border: 1px solid var(--card-border-color);
  }
  .wc-tabulator.tabulator.rounded {
    border-radius: 10px;
  }

  /* Table Header */
  .wc-tabulator.tabulator .tabulator-header {
    border-bottom: none;
  }
  .wc-tabulator.tabulator .tabulator-header,
  .wc-tabulator.tabulator .tabulator-header .tabulator-col {
    color: var(--card-color);
    background-color: var(--card-border-color);
  }
  .wc-tabulator.tabulator .tabulator-header .tabulator-col:not(:last-of-type) {
    border-right: 1px solid var(--text-3);
  }
  .wc-tabulator.tabulator .tabulator-header .tabulator-col:last-of-type {
    border-right: 1px solid transparent;
  }
  /*Allow column header names to wrap lines*/
  .wc-tabulator.tabulator .tabulator-header .tabulator-col,
  .wc-tabulator.tabulator .tabulator-header .tabulator-col-row-handle {
    white-space: normal;
  }
  .wc-tabulator.tabulator .tabulator-header input,
  .wc-tabulator.tabulator .tabulator-row .tabulator-cell input {
    accent-color: var(--accent-color);
  }
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-headers .tabulator-col:hover {
    background-color: var(--primary-bg-color);
    color: var(--surface-1);
  }

  /* Table Rows */
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-row-header.tabulator-row-handle,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd {
    color: var(--text-1);
    background-color: var(--card-bg-color);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-row-header.tabulator-row-handle,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even {
    color: var(--text-1);
    background-color: var(--surface-5);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd .tabulator-cell.tabulator-row-header.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even .tabulator-cell.tabulator-row-header.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar {
    background: var(--text-1);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd.tabulator-selected,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even.tabulator-selected {
    background-color: var(--primary-bg-color);
    color: var(--surface-1);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd:hover:not(.tabulator-selected),
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even:hover:not(.tabulator-selected) 
  {
    background-color: var(--primary-bg-color);
    color: var(--surface-1);
  }
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-odd:hover:not(.tabulator-selected) a,
  .wc-tabulator.tabulator .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-even:hover:not(.tabulator-selected) a 
  {
    color: var(--surface-1);
  }
  .wc-tabulator.tabulator.tabulator-block-select .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-placeholder {
    background-color: var(--secondary-bg-color);
  }
  .wc-tabulator .tabulator-row .tabulator-cell {
    border-right: 1px solid var(--text-3);
  }
  .wc-tabulator .tabulator-row .tabulator-cell:last-child {
    border-right: 1px solid transparent;
  }
  /*
  .wc-tabulator .tabulator-tableholder .tabulator-row .tabulator-cell {
    border-right: 1px solid var(--text-3);
  }
  */
  .wc-tabulator .tabulator-tableholder .tabulator-row .tabulator-cell:last-of-type {
    border-right: 1px solid transparent;
  }

  /* Table Footer */
  .wc-tabulator.tabulator .tabulator-footer {
    border-top: none;
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-footer-contents {
    color: var(--card-color);
    background-color: var(--card-border-color);
    border-top: 1px solid var(--text-3);
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-footer-contents .tabulator-page {
    color: var(--card-color);
    background-color: var(--card-border-color);
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-footer-contents .tabulator-page.active {
    color: var(--card-color);
    background-color: var(--card-border-color);
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-footer-contents .tabulator-page[disabled] {
    pointer-events: none;
  }

  /* Table Groups */
  .wc-tabulator.tabulator .tabulator-row.tabulator-group > span {
    color: var(--card-color);  
  }

  /* Table Calcs */
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder,
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder .tabulator-row.tabulator-calcs,
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder .tabulator-row.tabulator-calcs.tabulator-calcs-top,
  .wc-tabulator.tabulator .tabulator-footer .tabulator-calcs-holder,
  .wc-tabulator.tabulator .tabulator-footer .tabulator-calcs-holder .tabulator-row.tabulator-calcs.tabulator-calcs-bottom {
    color: var(--card-color) !important;
    background-color: var(--card-border-color) !important;

    /*
    border-color: var(--component-border-color);
    border-top: 1px solid var(--component-border-color);
    border-bottom: 1px solid var(--component-border-color);
    */
  } 
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder,
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder .tabulator-row.tabulator-calcs,
  .wc-tabulator.tabulator .tabulator-header .tabulator-header-contents .tabulator-calcs-holder .tabulator-row.tabulator-calcs.tabulator-calcs-top {
    border-top: 1px solid var(--text-3);
    border-bottom: 1px solid var(--text-3);
  }
  .wc-tabulator.tabulator .tabulator-footer .tabulator-calcs-holder,
  .wc-tabulator.tabulator .tabulator-footer .tabulator-calcs-holder .tabulator-row.tabulator-calcs.tabulator-calcs-bottom {
    border-top: 1px solid var(--text-3);
    border-bottom: 1px solid transparent;
  }

  
  .wc-tabulator.tabulator .tabulator-row.tabulator-unselectable.tabulator-calcs.tabulator-calcs-top,
  .wc-tabulator.tabulator .tabulator-row.tabulator-unselectable.tabulator-calcs.tabulator-calcs-bottom {
    color: var(--card-color) !important;
    background-color: var(--card-border-color) !important;
    /*
    border-color: var(--component-border-color);
    border-top: 1px solid var(--component-border-color);
    border-bottom: 1px solid var(--component-border-color);
    */
  } 

  /* Table Popup */
  .tabulator-menu.tabulator-popup-container {
    color: var(--text-1);
    background-color: var(--surface-1);
  }
  .tabulator-menu.tabulator-popup-container .tabulator-menu-item:hover {
    color: var(--card-color);
    background-color: var(--card-bg-color);
  }
      `;
      this.loadStyle('wc-tabulator-style', style);
    }

  }

  customElements.define('wc-tabulator', WcTabulator);
}