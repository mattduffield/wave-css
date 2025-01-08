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

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-tabulator')) {
  class WcTabulator extends WcBaseComponent {
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
      "xmark": {
        "viewport": "0 0 384 512",
        "d": "M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"
      }
    }
    rowMenu = [
      {
        label: this.createMenuLabel('Select Row', this.icons.check),
        action: function(e, row) {
          row.select();
        }
      },
      {
        label: this.createMenuLabel('Un-Select Row', this.icons.xmark),
        action: function(e, row) {
          row.deselect();
        }
      },
      {
        separator:true,
      },
      {
        label: this.createMenuLabel('Delete Row', this.icons.remove),
        action: function(e, row) {
          // row.delete();
          console.log("Deleting row...");
        }
      },
      {
        label: this.createMenuLabel('Clone Row', this.icons.clone),
        action: function(e, row) {
          console.log("Cloning row...");
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

      if (typeof htmx !== 'undefined') {
        htmx.process(this);
      }
      console.log('_render:wc-code-mirror');
    }

    async _createInnerElement() {
      // const container = document.createElement('div');
      // container.id = this.getAttribute('id') || 'wc-tabulator';
      // this.appendChild(container);
      const paginationCounter = this.getAttribute('pagination-counter');
      const movableColumns = this.getAttribute('movable-columns');
      const resizableColumns = this.getAttribute('resizable-columns');
      const resizableColumnGuide = this.getAttribute('resizable-column-guide');
      const movableRows = this.getAttribute('movable-rows');
      const rowHeader = this.getAttribute('row-header');
      const resizableRows = this.getAttribute('resizable-rows');
      const resizableRowGuide = this.getAttribute('resizable-row-guide');
      const frozenRows = this.getAttribute('frozen-rows');
      const persistence = this.getAttribute('persistence');
      const headerVisible = this.getAttribute('header-visible');
      const rowContextMenu = this.getAttribute('row-context-menu');

      const options = {
        columns: this.getColumnsConfig(),
        layout: this.getAttribute('layout') || 'fitData',
        pagination: this.hasAttribute('pagination'),
        paginationMode: 'remote',
        filterMode: 'remote',
        sortMode: 'remote',
        ajaxURL: this.getAttribute('ajax-url') || '', // URL for server-side loading
        ajaxURLGenerator: this.getAjaxURLGenerator.bind(this),
        ajaxConfig: this.getAjaxConfig(),
        ajaxResponse: this.handleAjaxResponse.bind(this), // Optional custom handling of server response
        paginationSize: parseInt(this.getAttribute('pagination-size')) || 10,
      };

      if (paginationCounter) options.paginationCounter = paginationCounter;
      if (movableColumns) options.movableColumns = movableColumns.toLowerCase() == 'true' ? true : false;
      if (resizableColumns) options.resizableColumns = resizableColumns.toLowerCase() == 'true' ? true : false;
      if (resizableColumnGuide) options.resizableColumnGuide = resizableColumnGuide.toLowerCase() == 'true' ? true : false;
      if (movableRows) options.movableRows = movableRows.toLowerCase() == 'true' ? true : false;
      if (rowHeader) options.rowHeader = JSON.parse(rowHeader);
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
      await this.renderTabulator(options);
      this.classList.add('contents');
    }

    async renderTabulator(options) {
      await Promise.all([
        this.loadScript('https://cdn.jsdelivr.net/npm/luxon@2.3.1/build/global/luxon.min.js'),
        this.loadCSS('https://unpkg.com/tabulator-tables@6.3.0/dist/css/tabulator.min.css'),
        this.loadLibrary('https://unpkg.com/tabulator-tables@6.3.0/dist/js/tabulator.min.js', 'Tabulator'),
      ]);
        
      this.table = new Tabulator(this.componentElement, options);
      this.table.on("tableBuilt", () => {
        console.log('wc-tabulator:tableBiult - broadcasting wc-tabulator:ready');
        wc.EventHub.broadcast('wc-tabulator:ready', [], '')
      });
    }

    getColumnsConfig() {
      const columns = [];
      const columnElements = this.querySelectorAll('wc-tabulator-column');

      columnElements.forEach((col) => {
        const field = col.getAttribute('field');
        const title = col.getAttribute('title') || field;
        const width = col.getAttribute('width');
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
        const vertAlign = col.getAttribute('vert-align') || 'top';
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
          // column.headerMenu = headerMenu;
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
        if (formatter) column.formatter = formatter;
        if (formatterParams) column.formatterParams = JSON.parse(formatterParams);
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

    resolveFormatter(formatter) {
      try {
        // Check if formatter is an inline function or a global function name
        if (formatter.startsWith('function')) {
          return new Function(`return (${formatter})`)(); // Inline function
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
        let title = document.createElement("span");

        title.textContent = " " + column.getDefinition().title;
        title.textContent = title.textContent.replace("null", "").replace("undefined", "");

        label.appendChild(icon);
        label.appendChild(title);

        //create menu item
        menu.push({
          label:label,
          action: function(e) {
            //prevent menu closing
            e.stopPropagation();
            //toggle current column visibility
            column.toggle();
            // Update menu item icon
            path.setAttribute(
              "d",
              column.isVisible()
                ? this.icons.squareCheck.d
                : this.icons.square.d
            );
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
      icon.setAttribute("viewBox", this.icons.square.viewport);

      let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute(
        "d",
        column.isVisible()
          ? this.icons.squareCheck.d
          : this.icons.square.d
      );
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
      icon.setAttribute("viewBox", icn.viewport);
      let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", icn.d);
      icon.appendChild(path);
      let label = document.createElement("span");
      let title = document.createElement("span");
      title.textContent = " " + titleContent;
      label.appendChild(icon);
      label.appendChild(title);
      return label;
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
        ajaxParamsParts.push(`page=${page}`);
        ajaxParamsParts.push(`size=${size}`);
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

      return url + `?${ajaxParamsStr}`;

      // return url + `?page=${page}&results=${size}&${ajaxParamsStr}`;
      // return url + "?params=" + encodeURI(JSON.stringify(params)); //encode parameters as a json object
    }

    handleAjaxResponse(url, params, response) {
      // Custom response processing if needed
      // For example, adapting to a specific API format
      const {results} = response;
      const {data, last_page} = response;
      if (data == null && last_page === 0) {
        return {last_page: 0, data: []};  
      }
      else if (data && last_page) {
        return {last_page, data};  
      } else {
        return {last_page: 10, data: results};
      }
    }

    _applyStyle() {
      const style = `
  /*Theme the Tabulator element*/
  .tabulator {
    background-color: var(--component-bg-color);
    border: 1px solid var(--component-border-color);
    border-radius: 10px;
  }

  /*Theme the header*/
  .tabulator .tabulator-header,
  .tabulator .tabulator-header .tabulator-col {
    background-color: var(--component-bg-color);
    color: var(--component-color);
  }

  /*Allow column header names to wrap lines*/
  .tabulator .tabulator-header .tabulator-col,
  .tabulator .tabulator-header .tabulator-col-row-handle {
    white-space: normal;
  }

  /*Color the table rows*/
  .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row {
    /* color:#fff; */
    /* background-color: #666; */
    color: var(--component-color);
    background-color: var(--component-bg-color);
  }

  /*Color even rows*/
  .tabulator .tabulator-row.tabulator-row-even {
    color: var(--component-color);
    background-color: var(--component-bg-color);
  }
  .tabulator .tabulator-row.tabulator-row-odd {
    color: var(--component-color);
    background-color: var(--component-bg-color);
  }
  .tabulator .tabulator-header-filter {
    color: black;
  }
  .tabulator .tabulator-row.tabulator-row-even:hover,
  .tabulator .tabulator-row.tabulator-row-even:hover * {
    color: var(--component-color);
    background-color: var(--component-bg-hover-color);
    transition: all 300ms ease-in-out;
  }
  .tabulator .tabulator-row.tabulator-row-odd:hover,
  .tabulator .tabulator-row.tabulator-row-odd:hover * {
    color: var(--component-color);
    background-color: var(--component-bg-hover-color);
    transition: all 300ms ease-in-out;
  }
  .tabulator .tabulator-header input,
  .tabulator .tabulator-row .tabulator-cell input {
    accent-color: var(--accent-color);
  }

  .tabulator .tabulator-row .tabulator-cell.tabulator-editing {
    border: 1px solid var(--primary_400);
    outline: none;
    padding: 0;
  }
  .tabulator .tabulator-row .tabulator-cell.tabulator-editing input,
  .tabulator .tabulator-row .tabulator-cell.tabulator-editing select {
    border: 1px;
    background: white;
    color: black;
    outline: none;
  }

  .tabulator-header .tabulator-col:hover {
    background-color: var(--component-bg-hover-color) !important;
  }

  .tabulator .tabulator-footer {
    background-color: var(--component-bg-color) !important;
    color: var(--component-color) !important;
  }

  .tabulator .tabulator-footer .tabulator-page {
    color: black;
    background-color: var(--component-bg-color) !important;
  }

  .tabulator .tabulator-footer .tabulator-page.active {
    color: white;
    background-color: var(--component-bg-color) !important;
  }

  .tabulator .tabulator-footer .tabulator-page[disabled] {
    pointer-events: none;
  }


  /* Dark Theme */
  /*Theme the Tabulator element*/
  .dark .tabulator {
    background-color: var(--component-bg-color);
    border: 1px solid var(--component-border-color);
    border-radius: 10px;
  }

  /*Theme the header*/
  .dark .tabulator .tabulator-header,
  .dark .tabulator .tabulator-header .tabulator-col {
    background-color: var(--component-bg-color);
    color: var(--component-color);
  }

  /*Allow column header names to wrap lines*/
  .dark .tabulator .tabulator-header .tabulator-col,
  .dark .tabulator .tabulator-header .tabulator-col-row-handle {
    background-color: var(--component-bg-color);
    color: var(--component-color);
    white-space: normal;
  }

  .dark .tabulator .tabulator-header .tabulator-col:hover {
    background-color: var(--component-bg-hover-color) !important;
  }

  .dark .tabulator .tabulator-footer {
    background-color: var(--component-bg-color);
    color: var(--component-color);
  }

  .dark .tabulator .tabulator-footer .tabulator-page {
    color: black;
    background-color: var(--component-bg-color) !important;  
  }

  .dark .tabulator .tabulator-footer .tabulator-page.active {
    color: white;
    background-color: var(--component-bg-color) !important;  
  }

  .dark .tabulator .tabulator-footer .tabulator-page[disabled] {
    pointer-events: none;
  }

  /*Color the table rows*/
  .dark .tabulator .tabulator-tableHolder .tabulator-table .tabulator-row {
    /* color:#fff; */
    /* background-color: #666; */
    color: var(--component-color);
    background-color: var(--component-bg-color);
  }

  /*Color even rows*/
  .dark .tabulator .tabulator-row.tabulator-row-even {
    color: var(--component-color);
    background-color: var(--component-bg-color);
  }
  .dark .tabulator .tabulator-row.tabulator-row-odd {
    color: var(--component-color);
    background-color: var(--component-bg-color);
  }
  .dark .tabulator .tabulator-header-filter {
    color: black;
  }
  .dark .tabulator .tabulator-row.tabulator-row-even:hover,
  .dark .tabulator .tabulator-row.tabulator-row-even:hover * {
    color: var(--component-color);
    background-color: var(--component-bg-hover-color);
  }
  .dark .tabulator .tabulator-row.tabulator-row-odd:hover,
  .dark .tabulator .tabulator-row.tabulator-row-odd:hover * {
    color: var(--component-color);
    background-color: var(--component-bg-hover-color);
  }
  .dark .tabulator .tabulator-header input,
  .dark .tabulator .tabulator-row .tabulator-cell input {
    accent-color: var(--accent-color);
  }

  .dark .tabulator .tabulator-row .tabulator-cell.tabulator-editing {
    border: 1px solid var(--primary_400);
    outline: none;
    padding: 0;
  }
  .dark .tabulator .tabulator-row .tabulator-cell.tabulator-editing input,
  .dark .tabulator .tabulator-row .tabulator-cell.tabulator-editing select {
    border: 1px;
    background: #111827;
    color: #e5e7eb;
    outline: none;
  }

  .dark .tabulator .tabulator-header input,
  .dark .tabulator .tabulator-header select {
    border: 1px;
    background: #1f2937;
    color: #9ca3af;
    outline: none;
  }

  .dark .tabulator-menu {
    background-color: #111827;
    color: #9ca3af;
  }
  .dark .tabulator-menu .tabulator-menu-item:hover {
    background-color: #374151;
    color: #e5e7eb;
  }
  .dark .tabulator-alert .tabulator-alert-msg {
    background-color: #111827;
    border-color: #4b5563;
  }
  .dark .tabulator-alert .tabulator-alert-msg.tabulator-alert-state-msg {
    color: #9ca3af;
  }
  .dark .tabulator-edit-list {
    background-color: #111827;
    color: #9ca3af;
  }
  .dark .tabulator-edit-list .tabulator-edit-list-item {
    color: #9ca3af;
  }
  .dark .tabulator-edit-list .tabulator-edit-list-item:hover {
    background-color: var(--primary_500);
    color: #e5e7eb;
  }

  .tabulator .tabulator-row.tabulator-selected.tabulator-row-even,
  .tabulator .tabulator-row.tabulator-selected.tabulator-row-odd,
  .dark .tabulator .tabulator-row.tabulator-selected.tabulator-row-even,
  .dark .tabulator .tabulator-row.tabulator-selected.tabulator-row-odd {
    color: var(--accent-color);
    background-color: var(--accent-bg-color);
    transition: all 300ms ease-in-out;
  }

  .tabulator .tabulator-header .tabulator-row .tabulator-cell,
  .tabulator .tabulator-footer .tabulator-row .tabulator-cell {
    color: var(--component-color);
    background-color: var(--component-bg-color);
  }

  .tabulator .tabulator-row .tabulator-row-header.tabulator-cell.tabulator-row-handle,
  .tabulator .tabulator-row .tabulator-row-header.tabulator-cell.tabulator-row-handle .tabulator-row-handle-box {
    color: var(--component-color);
    background-color: var(--component-bg-color);
  }
  .tabulator .tabulator-row .tabulator-row-header.tabulator-cell.tabulator-row-handle .tabulator-row-handle-box .tabulator-row-handle-bar {
    background: var(--bg-color);
    background: var(--component-color);
  }
  .tabulator .tabulator-tableholder .tabulator-table,
  .tabulator .tabulator-tableholder .tabulator-table .tabulator-row {
    background-color: var(--component-bg-color);
  }
  .tabulator.tabulator-block-select .tabulator-tableholder .tabulator-table .tabulator-row.tabulator-row-placeholder {
    background-color: var(--secondary-bg-color);
  }
        
      `;
      this.loadStyle('wc-tabulator-style', style);
    }

  }

  customElements.define('wc-tabulator', WcTabulator);
}