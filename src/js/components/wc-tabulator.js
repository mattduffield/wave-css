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
class WcTabulator extends HTMLElement {
  constructor() {
    super();
    this.table = null;
  }

  connectedCallback() {
    this.render();
  }

  render() {
    const container = document.createElement('div');
    this.appendChild(container);

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

    this.table = new Tabulator(container, options);
    this.classList.add('contents');
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
      const cellClick = col.getAttribute('cell-click');

      const column = { field, title };
      if (width) column.width = width;
      if (minWidth) column.minWidth = minWidth;
      if (maxWidth) column.maxWidth = maxWidth;
      if (maxInitialWidth) column.maxInitialWidth = maxInitialWidth;
      if (resizable) column.resizable = resizable.toLowerCase() == 'true' ? true : false;
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
      if (editor) column.editor = editor;
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

    let squareCheck = "M64 80c-8.8 0-16 7.2-16 16l0 320c0 8.8 7.2 16 16 16l320 0c8.8 0 16-7.2 16-16l0-320c0-8.8-7.2-16-16-16L64 80zM0 96C0 60.7 28.7 32 64 32l320 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z";
    let square = "M384 80c8.8 0 16 7.2 16 16l0 320c0 8.8-7.2 16-16 16L64 432c-8.8 0-16-7.2-16-16L48 96c0-8.8 7.2-16 16-16l320 0zM64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32z";

    for (let column of columns) {
      //create checkbox element using font awesome icons
      let icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      icon.setAttribute("aria-hidden", "true");
      icon.setAttribute("focusable", "false");
      icon.setAttribute("data-prefix", "fas");
      icon.setAttribute("fill", "currentColor");
      icon.classList.add("h-4");
      icon.classList.add("w-4");
      icon.classList.add("align-text-top");
      icon.setAttribute("viewBox", "0 0 448 512");

      let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute(
        "d",
        column.isVisible()
          ? squareCheck
          : square
      );
      icon.appendChild(path);

      //build label
      let label = document.createElement("span");
      let title = document.createElement("span");

      title.textContent = " " + column.getDefinition().title;
      title.textContent = title.textContent.replace("null", "");

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
              ? squareCheck
              : square
          );
        }
      });
    }
    return menu;
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
}

customElements.define('wc-tabulator', WcTabulator);
