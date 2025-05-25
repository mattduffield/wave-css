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
      // Define custom properties for different element types
      this.elementCustomProperties = {
        'a': [
          { name: 'href', label: 'Href', type: 'string' },
          { name: 'target', label: 'Target', type: 'string-enum', defaultValue: '', enum: ['', '_blank', '_parent', '_self', '_top'] }
        ],
        'data-array': [
          { name: 'has_add_new', label: 'Has Add New?', type: 'boolean' },
        ],
        'data-item': [
        ],
        'option': [
          { name: 'value', label: 'Value', type: 'string' },
          { name: 'content', label: 'Content', type: 'multiline-string' },
          { name: 'is_selected', label: 'Is Selected?', type: 'boolean' }
        ],
        'wc-accordion-option': [
          { name: 'value', label: 'Value', type: 'string' },
          { name: 'content', label: 'Content', type: 'multiline-string' },
          { name: 'is_selected', label: 'Is Selected?', type: 'boolean' }
        ],
        'wc-accordion': [
          { name: 'allow_many', label: 'Allow Many?', type: 'boolean' }
        ],
        'wc-breadcrumb': [
          { name: 'title', label: 'Title', type: 'string' },
        ],
        'wc-breadcrumb-item': [
          { name: 'link', label: 'Link', type: 'string' },
        ],
        'wc-code-mirror': [
          { name: 'name', label: 'Name', type: 'string' },
          { name: 'theme', label: 'Theme', type: 'string-enum', defaultValue: '', enum: [
            "", "3024-day", "3024-night", "abcdef", "ambiance", "ayu-dark", "ayu-mirage",
            "base16-dark", "base16-light", "bespin", "blackboard", "cobalt", "colorforth",
            "default", "darcula", "dracula", "duotone-dark", "duotone-light", "eclipse", "elegant",
            "erlang-dark", "gruvbox-dark", "hopscotch", "icecoder", "idea", "isotope",
            "lesser-dark", "liquibyte", "lucario", "material", "material-darker",
            "material-palenight", "material-ocean", "mbo", "mdn-like", "midnight",
            "monokai", "moxer", "neat", "neo", "night", "nord", "oceanic-next", "panda-syntax",
            "paraiso-dark", "paraiso-light", "pastel-on-dark", "railscasts", "rubyblue",
            "seti", "shadowfox", "solarized", "ssms", "the-matrix", "tomorrow-night-bright",
            "tomorrow-night-eighties", "ttcn", "twilight", "vibrant-ink", "xq-dark",
            "xq-light", "yeti", "yonce", "zenburn"
          ] },
          { name: 'mode', label: 'Mode', type: 'string-enum', defaultValue: '', enum: [
            "", "apl", "asciiarmor", "asn.1", "asterisk", "brainfuck", "clike", "clojure",
            "cmake", "cobol", "coffeescript", "commonlisp", "crystal", "css", "cypher",
            "d", "dart", "diff", "django", "dockerfile", "dtd", "dylan", "ebnf", "ecl",
            "eiffel", "elm", "erlang", "factor", "fcl", "forth", "fortran", "gas", "gfm",
            "gherkin", "go", "groovy", "haml", "handlebars", "haskell", "haxe", "htmlembedded",
            "htmlmixed", "http", "idl", "javascript", "jinja2", "julia", "kotlin", "litespec",
            "livescript",
            "lua", "markdown", "mathematica", "mbox", "mirc", "mllike", "modelica", "mscgen",
            "mumps", "nginx", "nsis", "ntriples", "octave", "oz", "pascal", "perl", "php",
            "pig", "powershell", "properties", "protobuf", "pug", "puppet", "python", "q",
            "r", "rpm", "rst", "ruby", "rust", "sas", "sass", "scheme", "shell", "sieve",
            "slim", "smalltalk", "smarty", "solr", "soy", "sparql", "spreadsheet", "sql",
            "stex", "stylus", "swift", "tcl", "textile", "tiddlywiki", "tiki", "toml", "tornado",
            "troff", "ttcn", "ttcn-cfg", "turtle", "twig", "vb", "vbscript", "velocity",
            "verilog", "vhdl", "vue", "xml", "xquery", "yaml", "yaml-frontmatter", "z80"
          ] },
          { name: 'height', label: 'Height', type: 'string' },
          { name: 'has_line_numbers', label: 'Has Line Numbers?', type: 'boolean' },
          { name: 'has_line_wrapping', label: 'Has Line Wrapping?', type: 'boolean' },
          { name: 'has_fold_gutter', label: 'Has Fold Gutter?', type: 'boolean' },
          { name: 'lbl_css', label: 'Label Class', type: 'string' },
          { name: 'tab_size', label: 'Tab Size', type: 'number' },
          { name: 'indent_unit', label: 'Indent Unit', type: 'number' },
          { name: 'value', label: 'Value', type: 'multiline-string' },
          { name: 'url', label: 'Fetch URL', type: 'string' },
          { name: 'is_disabled', label: 'Is Disabled?', type: 'boolean' },
          { name: 'script', label: 'Hyperscript', type: 'multiline-string' },
        ],
        'wc-contact-card': [
          { name: 'contact_name', label: 'Name', type: 'string' },
          { name: 'contact_title', label: 'Title', type: 'string' },
          { name: 'contact_gender', label: 'Gender', type: 'string-radio-modern', defaultValue: '', enum: ['male', 'female'] },
        ],
        'wc-contact-chip': [
          { name: 'contact_name', label: 'Name', type: 'string' },
          { name: 'contact_gender', label: 'Gender', type: 'string-radio-modern', defaultValue: '', enum: ['male', 'female'] },
        ],
        'wc-form': [
          { name: 'method', label: 'Method', type: 'string-radio-modern', defaultValue: '', enum: ['get', 'post'] },
          { name: 'action', label: 'Action', type: 'string' },
        ],
        'wc-hotkey': [
          { name: 'keys', label: 'Keys', type: 'string' },
          { name: 'target', label: 'Target', type: 'string' },
        ],
        'wc-image': [
          { name: 'url', label: 'URL', type: 'string' },
          { name: 'caption', label: 'Caption', type: 'string' },
          { name: 'hover_overlay', label: 'Hover Overlay?', type: 'boolean' },
          { name: 'hover_mode', label: 'Hover Mode', type: 'string-radio-modern', defaultValue: '', enum: ['left', 'top', 'right', 'bottom'] },
          { name: 'modal', label: 'Modal?', type: 'boolean' },
          { name: 'overlay_content', label: 'Overlay Content', type: 'multiline-string' },
        ],
        'wc-input': [
          { name: 'minlength', label: 'Min Length', type: 'string' },
          { name: 'maxlength', label: 'Max Length', type: 'string' },
          { name: 'placeholder', label: 'Placeholder', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-checkbox': [
          { name: 'is_toggle', label: 'Is Toggle', type: 'boolean' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-currency': [
          { name: 'min', label: 'Min', type: 'string' },
          { name: 'max', label: 'Max', type: 'string' },
          { name: 'step', label: 'Step', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-date': [
          { name: 'min', label: 'Min', type: 'string' },
          { name: 'max', label: 'Max', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-email': [
          { name: 'minlength', label: 'Min Length', type: 'string' },
          { name: 'maxlength', label: 'Max Length', type: 'string' },
          { name: 'placeholder', label: 'Placeholder', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-month': [
          { name: 'min', label: 'Min', type: 'string' },
          { name: 'max', label: 'Max', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-number': [
          { name: 'min', label: 'Min', type: 'string' },
          { name: 'max', label: 'Max', type: 'string' },
          { name: 'step', label: 'Step', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-range': [
          { name: 'min', label: 'Min', type: 'string' },
          { name: 'max', label: 'Max', type: 'string' },
          { name: 'step', label: 'Step', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-tel': [
          { name: 'minlength', label: 'Min Length', type: 'string' },
          { name: 'maxlength', label: 'Max Length', type: 'string' },
          { name: 'placeholder', label: 'Placeholder', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-time': [
          { name: 'min', label: 'Min', type: 'string' },
          { name: 'max', label: 'Max', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-week': [
          { name: 'min', label: 'Min', type: 'string' },
          { name: 'max', label: 'Max', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-radio-collection': [
          { name: 'collName', label: 'Collection Name', type: 'string' },
          { name: 'collCSS', label: 'Collection CSS', type: 'string' },
          { name: 'collDisplayMember', label: 'Display Member', type: 'string' },
          { name: 'collValueMember', label: 'Value Member', type: 'string' },
          { name: 'group_class', label: 'Radio Group Class', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-radio-lookup': [
          { name: 'lookupName', label: 'Lookup Name', type: 'string' },
          { name: 'lookupCSS', label: 'Lookup CSS', type: 'string' },
          { name: 'group_class', label: 'Radio Group Class', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-input-radio': [
          { name: 'group_class', label: 'Radio Group Class', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-javascript': [
          { name: 'content', label: 'Content', type: 'multiline-string' },
          { name: 'has_defer', label: 'Defer?', type: 'boolean' }
        ],
        'wc-loader': [
          { name: 'size', label: 'Size', type: 'string' },
          { name: 'speed', label: 'Speed', type: 'string' },
          { name: 'thickness', label: 'Thickness', type: 'string' }
        ],
        'wc-option': [
          { name: 'value', label: 'Value', type: 'string' },
          { name: 'is_selected', label: 'Is Selected?', type: 'boolean' }
        ],
        'wc-save-button': [
          { name: 'saveUrl', label: 'Save URL', type: 'string' }
        ],
        'wc-save-split-button': [
          { name: 'positionArea', label: 'Position Area', type: 'string-enum', defaultValue: '', enum: [
            // Single keyword values
            "none",
            "top",
            "bottom",
            "left", 
            "right",
            "start",
            "end",
            "self-start",
            "self-end",
            "center",
            
            // Two-value combinations (block-axis inline-axis)
            "top left",
            "top center", 
            "top right",
            "top start",
            "top end",
            "top self-start",
            "top self-end",
            
            "center left",
            "center center",
            "center right", 
            "center start",
            "center end",
            "center self-start",
            "center self-end",
            
            "bottom left",
            "bottom center",
            "bottom right",
            "bottom start", 
            "bottom end",
            "bottom self-start",
            "bottom self-end",
            
            "start left",
            "start center",
            "start right",
            "start start",
            "start end", 
            "start self-start",
            "start self-end",
            
            "end left",
            "end center", 
            "end right",
            "end start",
            "end end",
            "end self-start",
            "end self-end",
            
            "self-start left",
            "self-start center",
            "self-start right", 
            "self-start start",
            "self-start end",
            "self-start self-start",
            "self-start self-end",
            
            "self-end left",
            "self-end center",
            "self-end right",
            "self-end start", 
            "self-end end",
            "self-end self-start", 
            "self-end self-end",
            
            // Additional block-axis values with inline-axis
            "left top",
            "left center",
            "left bottom",
            "left start",
            "left end",
            "left self-start", 
            "left self-end",
            
            "right top",
            "right center",
            "right bottom", 
            "right start",
            "right end",
            "right self-start",
            "right self-end"
          ] },
          { name: 'saveUrl', label: 'Save URL', type: 'string' },
          { name: 'saveNewUrl', label: 'Save New URL', type: 'string' },
          { name: 'saveReturnUrl', label: 'Save Return URL', type: 'string' },
        ],
        'wc-script': [
          { name: 'src', label: 'Src', type: 'string' }
        ],
        'wc-select-multiple-collection': [
          { name: 'mode', label: 'Mode', type: 'string-enum', defaultValue: '', enum: ['', 'chip', 'multiple'] },
          { name: 'collName', label: 'Collection Name', type: 'string' },
          { name: 'collCSS', label: 'Collection CSS', type: 'string' },
          { name: 'collDisplayMember', label: 'Display Member', type: 'string' },
          { name: 'collValueMember', label: 'Value Member', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' },
          { name: 'allow_dynamic', label: 'Allow Dynamic', type: 'boolean' }
        ],
        'wc-select-multiple-lookup': [
          { name: 'mode', label: 'Mode', type: 'string-enum', defaultValue: '', enum: ['', 'chip', 'multiple'] },
          { name: 'lookupName', label: 'Lookup Name', type: 'string' },
          { name: 'lookupCSS', label: 'Lookup CSS', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' },
          { name: 'allow_dynamic', label: 'Allow Dynamic', type: 'boolean' }
        ],
        'wc-select-multiple': [
          { name: 'mode', label: 'Mode', type: 'string-enum', defaultValue: '', enum: ['', 'chip', 'multiple'] },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' },
          { name: 'allow_dynamic', label: 'Allow Dynamic', type: 'boolean' }
        ],
        'wc-select-collection': [
          { name: 'collName', label: 'Collection Name', type: 'string' },
          { name: 'collCSS', label: 'Collection CSS', type: 'string' },
          { name: 'collDisplayMember', label: 'Display Member', type: 'string' },
          { name: 'collValueMember', label: 'Value Member', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' },
        ],
        'wc-select-lookup': [
          { name: 'lookupName', label: 'Lookup Name', type: 'string' },
          { name: 'lookupCSS', label: 'Lookup CSS', type: 'string' },
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' },
        ],
        'wc-select': [
          { name: 'is_readonly', label: 'Is Readonly', type: 'boolean' },
          { name: 'is_disabled', label: 'Is Disabled', type: 'boolean' }
        ],
        'wc-sidebar': [
          { name: 'width', label: 'Width', type: 'string' },
          { name: 'background_color', label: 'Background Color', type: 'string' },
          { name: 'push_target', label: 'Push Target', type: 'string' },
          { name: 'is_auto_height', label: 'Is Auto Height?', type: 'boolean' },
          { name: 'is_right_side', label: 'Is Right Side?', type: 'boolean' },
        ],
        'wc-sidenav': [
          { name: 'width', label: 'Width', type: 'string' },
          { name: 'open_top', label: 'Open Top', type: 'string' },
          { name: 'open_btn_css', label: 'Open Button CSS', type: 'string' },
          { name: 'close_btn_css', label: 'Close Button CSS', type: 'string' },
          { name: 'background_color', label: 'Background Color', type: 'string' },
          { name: 'is_push', label: 'Is Push?', type: 'boolean' },
          { name: 'push_target', label: 'Push Target', type: 'string' },
          { name: 'is_open', label: 'Is Open?', type: 'boolean' },
          { name: 'is_auto_height', label: 'Is Auto Height?', type: 'boolean' },
          { name: 'has_open_vertical_text', label: 'Has Open Vertical Text?', type: 'boolean' },
          { name: 'is_right_side', label: 'Is Right Side?', type: 'boolean' },
          { name: 'is_overlay', label: 'Is Overlay?', type: 'boolean' },
        ],
        'wc-slideshow': [
          { name: 'autoplay', label: 'Autoplay?', type: 'boolean' },
          { name: 'autoplay_interval', label: 'Autoplay Interval', type: 'number' },
          { name: 'max_image_height', label: 'Max Image Height', type: 'string' }
        ],
        'wc-slideshow-image': [
          { name: 'url', label: 'URL', type: 'string' },
          { name: 'caption', label: 'Caption', type: 'string' },
          { name: 'numbertext', label: 'Number Text', type: 'string' }
        ],
        'wc-split-button': [
          { name: 'positionArea', label: 'Position Area', type: 'string-enum', defaultValue: '', enum: [
            // Single keyword values
            "none",
            "top",
            "bottom",
            "left", 
            "right",
            "start",
            "end",
            "self-start",
            "self-end",
            "center",
            
            // Two-value combinations (block-axis inline-axis)
            "top left",
            "top center", 
            "top right",
            "top start",
            "top end",
            "top self-start",
            "top self-end",
            
            "center left",
            "center center",
            "center right", 
            "center start",
            "center end",
            "center self-start",
            "center self-end",
            
            "bottom left",
            "bottom center",
            "bottom right",
            "bottom start", 
            "bottom end",
            "bottom self-start",
            "bottom self-end",
            
            "start left",
            "start center",
            "start right",
            "start start",
            "start end", 
            "start self-start",
            "start self-end",
            
            "end left",
            "end center", 
            "end right",
            "end start",
            "end end",
            "end self-start",
            "end self-end",
            
            "self-start left",
            "self-start center",
            "self-start right", 
            "self-start start",
            "self-start end",
            "self-start self-start",
            "self-start self-end",
            
            "self-end left",
            "self-end center",
            "self-end right",
            "self-end start", 
            "self-end end",
            "self-end self-start", 
            "self-end self-end",
            
            // Additional block-axis values with inline-axis
            "left top",
            "left center",
            "left bottom",
            "left start",
            "left end",
            "left self-start", 
            "left self-end",
            
            "right top",
            "right center",
            "right bottom", 
            "right start",
            "right end",
            "right self-start",
            "right self-end"
          ] }
        ],
        'wc-tabulator': [
          { name: 'ajax_url', label: 'AJAX URL', type: 'string' },
          { name: 'ajax_params', label: 'AJAX Params', type: 'multiline-string' },
          { name: 'ajax_params_map', label: 'AJAX Params Map', type: 'multiline-string' },
          { name: 'filter_mode', label: 'Filter Mode', type: 'string-enum', defaultValue: '', enum: ['', 'remote'] },
          { name: 'initial_filter', label: 'Initial Filter', type: 'multiline-string' },
          { name: 'sort_mode', label: 'Sort Mode', type: 'string-enum', defaultValue: '', enum: ['', 'remote'] },
          { name: 'initial_sort', label: 'Initial Sort', type: 'multiline-string' },
          { name: 'data_placeholder', label: 'Placeholder', type: 'string' },
          { name: 'row_context_menu', label: 'Row Context Menu', type: 'string' },
          { name: 'row_header', label: 'Row Header', type: 'multiline-string' },
          { name: 'row_height', label: 'Row Height', type: 'number' },
          { name: 'row_formatter', label: 'Row Formatter', type: 'multiline-string' },
          { name: 'row_click', label: 'Row Click', type: 'multiline-string' },
          { name: 'row_selected', label: 'Row Selected', type: 'multiline-string' },
          { name: 'row_deselected', label: 'Row Deselected', type: 'multiline-string' },
          { name: 'frozen_rows', label: 'Frozen Rows', type: 'number' },
          { name: 'pagination', label: 'Pagination?', type: 'boolean' },
          { name: 'pagination_size', label: 'Pagination Size', type: 'number' },
          { name: 'pagination_counter', label: 'Pagination Counter', type: 'string' },
          { name: 'header_visible', label: 'Header Visible?', type: 'boolean' },
          { name: 'movable_columns', label: 'Movable Columns?', type: 'boolean' },
          { name: 'resizable_columns', label: 'Resizable Columns?', type: 'boolean' },
          { name: 'resizable_column_guide', label: 'Resizable Column Guide?', type: 'boolean' },
          { name: 'movable_rows', label: 'Movable Rows?', type: 'boolean' },
          { name: 'resizable_rows', label: 'Resizable Rows?', type: 'boolean' },
          { name: 'resizable_row_guide', label: 'Resizable Row Guide?', type: 'boolean' },
          { name: 'selectable_rows', label: 'Selectable Rows', type: 'string' }, // Can be bool or number
          { name: 'persistence', label: 'Persistence?', type: 'boolean' },
          { name: 'layout', label: 'Layout', type: 'string-enum', defaultValue: '', enum: ['', 'fitData', 'fitDataFill', 'fitDataStretch', 'fitDataTable', 'fitColumns'] },
          { name: 'col_field_formatter', label: 'Col Field Formatter', type: 'multiline-string' },
          { name: 'group_by', label: 'Group By', type: 'string' },
          { name: 'responsive_layout', label: 'Responsive Layout', type: 'string' },
          { name: 'record_size', label: 'Record Size', type: 'number' },
        ],
        'wc-tabulator-column': [
          { name: 'field', label: 'Field', type: 'string' },
          { name: 'title', label: 'Title', type: 'string' },
          { name: 'title_formatter', label: 'Title Formatter', type: 'string-datalist', defaultValue: '', enum: [
            'plaintext',
            'textarea',
            'html',
            'money',
            'image',
            'link',
            'datetime',
            'datetimediff',
            'tickCross',
            'color',
            'star',
            'traffic',
            'progress',
            'array',
            'lookup',
            'json',
            'toggle',
            'buttonTick',
            'buttonCross',
            'adaptable',
            'rownum',
            'handle',
            'rowSelection',
            'responsiveCollapse',
            'pageRowNum',
            'urlFormatter',
            'linkFormatter',
            'localdatetime',
            'linklocaldatetime',
          ] },

          { name: 'header_filter', label: 'Header Filter', type: 'string', defaultValue: '' },
          { name: 'header_filter_params', label: 'Header Filter Params', type: 'multiline-string' },
          { name: 'header_filter_placeholder', label: 'Header Filter Placeholder', type: 'string' },
          { name: 'header_filter_func', label: 'Header Filter Func', type: 'string-datalist', defaultValue: '', enum: [
            '=',
            '!=',
            'like',
            'keywords',
            'starts',
            'ends',
            '<',
            '<=',
            '>',
            '>=',
            'in',
            'regex',
          ] },
          { name: 'header_hoz_align', label: 'Header Horizontal Alignment', type: 'string-radio-modern', defaultValue: '', enum: ['left', 'center', 'right'] },
          { name: 'header_menu', label: 'Header Menu', type: 'string' },
          { name: 'header_sort', label: 'Header Sort?', type: 'boolean' },
          { name: 'header_sort_starting_dir', label: 'Header Sort Starting Dir', type: 'string' },
          { name: 'header_sort_tristate', label: 'Header Sort Tristate?', type: 'boolean' },

          { name: 'formatter', label: 'Formatter', type: 'string-datalist', defaultValue: '', enum: [
            'plaintext',
            'textarea',
            'html',
            'money',
            'image',
            'link',
            'datetime',
            'datetimediff',
            'tickCross',
            'color',
            'star',
            'traffic',
            'progress',
            'array',
            'lookup',
            'json',
            'toggle',
            'buttonTick',
            'buttonCross',
            'adaptable',
            'rownum',
            'handle',
            'rowSelection',
            'responsiveCollapse',
            'pageRowNum',
            'urlFormatter',
            'linkFormatter',
            'localdatetime',
            'linklocaldatetime',
          ] },
          { name: 'formatter_params', label: 'Formatter Params', type: 'multiline-string' },
          { name: 'visible', label: 'Visible?', type: 'boolean' },
          { name: 'resizable', label: 'Resizable?', type: 'boolean' },
          { name: 'editable', label: 'Editable?', type: 'boolean' }, // Can be boolean or string
          { name: 'frozen', label: 'Frozen?', type: 'boolean' },
          { name: 'responsive', label: 'Responsive?', type: 'boolean' },
          { name: 'tooltip', label: 'Tooltip', type: 'string' },
          { name: 'row_handle', label: 'Row Handle?', type: 'boolean' },
          { name: 'html_output', label: 'HTML Output', type: 'multiline-string' },
          { name: 'print', label: 'Print?', type: 'boolean' },
          { name: 'clipboard', label: 'Clipboard?', type: 'boolean' },
          { name: 'width', label: 'Width', type: 'string' },
          { name: 'width_grow', label: 'Width Grow', type: 'number' },
          { name: 'width_shrink', label: 'Width Shrink', type: 'number' },
          { name: 'min_width', label: 'Min Width', type: 'string' },
          { name: 'max_width', label: 'Max Width', type: 'string' },
          { name: 'max_initial_width', label: 'Max Initial Width', type: 'string' },
          { name: 'top_calc', label: 'Top Calc', type: 'string' },
          { name: 'top_calc_params', label: 'Top Calc Params', type: 'multiline-string' },
          { name: 'bottom_calc', label: 'Bottom Calc', type: 'string' },
          { name: 'bottom_cal_params', label: 'Bottom Calc Params', type: 'multiline-string' },
          { name: 'editor', label: 'Editor', type: 'string-enum', defaultValue: '', enum: ['', 'input', 'textarea', 'number', 'range', 'tickCross', 'star', 'progress', 'date', 'time', 'datetime', 'list'] },
          { name: 'editor_params', label: 'Editor Params', type: 'multiline-string' },
          { name: 'sorter', label: 'Sorter', type: 'string' },
          { name: 'sorter_params', label: 'Sorter Params', type: 'multiline-string' },
          { name: 'hoz_align', label: 'Horizontal Alignment', type: 'string-radio-modern', defaultValue: '', enum: ['left', 'center', 'right'] },
          { name: 'vert_align', label: 'Vertical Alignment', type: 'string-radio-modern', defaultValue: '', enum: ['top', 'middle', 'bottom'] },
          { name: 'cell_click', label: 'Cell Click', type: 'multiline-string' },
        ],
        'wc-tabulator-func': [
          { name: 'name', label: 'Name', type: 'string' },
          { name: 'value', label: 'Value', type: 'multiline-string' },
        ],
        'wc-tabulator-row-menu': [
          { name: 'order', label: 'Order', type: 'number' },
          { name: 'icon', label: 'Icon', type: 'string' },
          { name: 'value', label: 'Value', type: 'multiline-string' },
        ],
        'wc-textarea': [
          { name: 'placeholder', label: 'Placeholder', type: 'string' },
          { name: 'rows', label: 'Rows', type: 'number' }
        ],
        'wc-theme-selector': [
          { name: 'theme', label: 'Theme', type: 'string-datalist', defaultValue: '', enum: [
            "theme-rose",
            "theme-petal",
            "theme-sunset",
            "theme-peach",
            "theme-fire",
            "theme-desert",
            "theme-golden",
            "theme-honey",
            "theme-amber",
            "theme-olive",
            "theme-moss",
            "theme-avocado",
            "theme-lime",
            "theme-fern",
            "theme-yellow",
            "theme-meadow",
            "theme-cornsilk",
            "theme-sage",
            "theme-forest",
            "theme-jungle",
            "theme-emerald",
            "theme-mint",
            "theme-turquoise",
            "theme-aqua",
            "theme-lagoon",
            "theme-ice",
            "theme-ocean",
            "theme-azure",
            "theme-sky",
            "theme-midsky",
            "theme-deepsky",
            "theme-royal",
            "theme-twilight",
            "theme-lavender",
            "theme-violet",
            "theme-grape",
            "theme-plum",
            "theme-fuchsia",
            "theme-cottoncandy",
            "theme-blush",
            "theme-bubblegum",
          ] },
          { name: 'mode', label: 'Mode', type: 'string-radio-modern', defaultValue: '', enum: ['light', 'dark'] },
        ],
        'wc-timeline-option': [
          { name: 'value', label: 'Value', type: 'string' },
          { name: 'content', label: 'Content', type: 'multiline-string' },
        ],
      };

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
  <div class="wc-page-designer ${this.theme} flex flex-row flex-1 min-h-0 h-screen">
    <!-- Left Panel - Elements -->
    <div class="left-panel flex flex-col min-h-0 overflow-scroll p-2">
      <wc-tab class="flex flex-col flex-1 min-h-0" animate>
        <wc-tab-item class="active" label="Containers">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="container-elements">
            <div class="element-item" data-element-type="div" draggable="true">Div</div>
            <div class="element-item" data-element-type="column" draggable="true">Column</div>
            <div class="element-item" data-element-type="row" draggable="true">Row</div>
            <div class="element-item" data-element-type="data-array" draggable="true">Data Array</div>
            <div class="element-item" data-element-type="data-item" draggable="true">Data Item</div>
            <div class="element-item" data-element-type="fieldset" draggable="true">Fieldset</div>
            <div class="element-item" data-element-type="wc-accordion" draggable="true">WC Accordion</div>
            <div class="element-item" data-element-type="wc-breadcrumb" draggable="true">WC Breadcrumb</div>
            <div class="element-item" data-element-type="wc-form" draggable="true">WC Form</div>
            <div class="element-item" data-element-type="wc-input-radio" draggable="true">WC Input Radio</div>
            <div class="element-item" data-element-type="wc-select-multiple" draggable="true">WC Select Multiple</div>
            <div class="element-item" data-element-type="wc-select" draggable="true">WC Select</div>
            <div class="element-item" data-element-type="wc-sidebar" draggable="true">WC Sidebar</div>
            <div class="element-item" data-element-type="wc-sidenav" draggable="true">WC Sidenav</div>
            <div class="element-item" data-element-type="wc-slideshow" draggable="true">WC Slideshow</div>
            <div class="element-item" data-element-type="wc-split-button" draggable="true">WC Split Button</div>
            <div class="element-item" data-element-type="wc-tab" draggable="true">WC Tab Container</div>
            <div class="element-item" data-element-type="wc-tab-item" draggable="true">WC Tab Item</div>
            <div class="element-item" data-element-type="wc-tabulator" draggable="true">WC Tabulator</div>
            <div class="element-item" data-element-type="wc-timeline" draggable="true">WC Timeline</div>
          </div>
        </wc-tab-item>
        <wc-tab-item class="" label="Elements">
          <div class="element-list p-2 flex flex-col min-h-0 overflow-scroll" id="form-elements">
            <div class="element-item" data-element-type="a" draggable="true">Anchor</div>
            <div class="element-item" data-element-type="hr" draggable="true">Horizontal Line</div>
            <div class="element-item" data-element-type="wc-article-skeleton" draggable="true">WC Article Skeleton</div>
            <div class="element-item" data-element-type="wc-card-skeleton" draggable="true">WC Card Skeleton</div>
            <div class="element-item" data-element-type="wc-list-skeleton" draggable="true">WC List Skeleton</div>
            <div class="element-item" data-element-type="wc-table-skeleton" draggable="true">WC Table Skeleton</div>
            <div class="element-item" data-element-type="wc-accordion-option" draggable="true">WC Accordion Option</div>
            <div class="element-item" data-element-type="wc-background-image" draggable="true">WC Backgruond Image</div>
            <div class="element-item" data-element-type="wc-breadcrumb-item" draggable="true">WC Breadcrumb Item</div>
            <div class="element-item" data-element-type="wc-code-mirror" draggable="true">WC Code Mirror</div>
            <div class="element-item" data-element-type="wc-contact-card" draggable="true">WC Contact Card</div>
            <div class="element-item" data-element-type="wc-contact-chip" draggable="true">WC Contact Chip</div>
            <div class="element-item" data-element-type="wc-hotkey" draggable="true">WC Hotkey</div>
            <div class="element-item" data-element-type="wc-image" draggable="true">WC Image</div>
            <div class="element-item" data-element-type="wc-input" draggable="true">WC Input</div>
            <div class="element-item" data-element-type="wc-input-checkbox" draggable="true">WC Input Checkbox</div>
            <div class="element-item" data-element-type="wc-input-currency" draggable="true">WC Input Currency</div>
            <div class="element-item" data-element-type="wc-input-date" draggable="true">WC Input Date</div>
            <div class="element-item" data-element-type="wc-input-email" draggable="true">WC Input Email</div>
            <div class="element-item" data-element-type="wc-input-month" draggable="true">WC Input Month</div>
            <div class="element-item" data-element-type="wc-input-number" draggable="true">WC Input Number</div>
            <div class="element-item" data-element-type="wc-input-radio-collection" draggable="true">WC Input Radio Collection</div>
            <div class="element-item" data-element-type="wc-input-radio-lookup" draggable="true">WC Input Radio Lookup</div>
            <div class="element-item" data-element-type="wc-input-range" draggable="true">WC Input Range</div>
            <div class="element-item" data-element-type="wc-input-tel" draggable="true">WC Input Phone</div>
            <div class="element-item" data-element-type="wc-input-time" draggable="true">WC Input Time</div>
            <div class="element-item" data-element-type="wc-input-week" draggable="true">WC Input Week</div>
            <div class="element-item" data-element-type="wc-loader" draggable="true">WC Loader</div>
            <div class="element-item" data-element-type="wc-option" draggable="true">WC Option</div>
            <div class="element-item" data-element-type="wc-save-button" draggable="true">WC Save Button</div>
            <div class="element-item" data-element-type="wc-save-split-button" draggable="true">WC Save Split Button</div>
            <div class="element-item" data-element-type="wc-script" draggable="true">WC Script</div>
            <div class="element-item" data-element-type="wc-select-multiple-collection" draggable="true">WC Select Multiple Collection</div>
            <div class="element-item" data-element-type="wc-select-multiple-lookup" draggable="true">WC Select Multiple Lookup</div>
            <div class="element-item" data-element-type="wc-select-collection" draggable="true">WC Select Collection</div>
            <div class="element-item" data-element-type="wc-select-lookup" draggable="true">WC Select Lookup</div>
            <div class="element-item" data-element-type="wc-slideshow-image" draggable="true">WC Slideshow Image</div>
            <div class="element-item" data-element-type="wc-tabulator-column" draggable="true">WC Tabulator Column</div>
            <div class="element-item" data-element-type="wc-tabulator-func" draggable="true">WC Tabulator Func</div>
            <div class="element-item" data-element-type="wc-tabulator-row-menu" draggable="true">WC Tabulator Row Menu</div>
            <div class="element-item" data-element-type="wc-textarea" draggable="true">WC Textarea</div>
            <div class="element-item" data-element-type="wc-theme-selector" draggable="true">WC Theme Selector</div>
            <div class="element-item" data-element-type="wc-timeline-option" draggable="true">WC Timeline Option</div>
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
          <div class="flex flex-col flex-1 min-h-0 min-w-0 overflow-scroll gap-2 py-2 px-4">
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
              <!-- Custom properties will be dynamically added here -->
              <div id="custom-properties-container" class="mt-3">
                <h6 class="text-muted mb-2 element-type-header">Custom Properties</h6>
                <div id="custom-properties" class="col-1 gap-2"></div>
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
              <div id="rules-list" class="flex flex-col gap-2">
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

          // Initialize custom properties with default values if this element type has custom properties
          const customProps = this.elementCustomProperties[elementType];
          if (customProps && customProps.length > 0) {
            customProps.forEach(prop => {
              if (prop.type === 'boolean') {
                newElement[prop.name] = false;
              } else if (prop.type === 'number') {
                newElement[prop.name] = null;
              } else {
                newElement[prop.name] = '';
              }
            });
          }
          
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
      
      this.jsonOutput.addEventListener('wc-code-mirror:ready', () => {
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
      // const placeholder = containerElement.querySelector('.designer-element-placeholder');
      // if (placeholder) {
        // containerElement.removeChild(placeholder);
      // }
      
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
      // if (element.label) {
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
      // }


      // Add indicator for custom properties
      const customProps = this.elementCustomProperties[element.type];
      if (customProps && customProps.length > 0) {
        // Check if any custom properties have non-empty values
        const hasCustomValues = customProps.some(prop => {
          const value = element[prop.name];
          if (prop.type === 'boolean') {
            return value === true;
          } else if (prop.type === 'number') {
            return value !== null && value !== undefined;
          } else {
            return value && value.trim() !== '';
          }
        });
        
        if (hasCustomValues) {
          const customPropsIndicator = document.createElement('small');
          customPropsIndicator.className = 'ms-2 text-primary';
          customPropsIndicator.textContent = '(*)';
          customPropsIndicator.title = 'Has custom properties';
          labelElement.appendChild(customPropsIndicator);
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
      
      // Clear existing custom properties
      const customPropertiesContainer = document.getElementById('custom-properties');
      customPropertiesContainer.innerHTML = '';
      
      // Hide the custom properties section by default
      document.getElementById('custom-properties-container').style.display = 'none';
      
      // Check if this element type has custom properties
      const customProps = this.elementCustomProperties[element.type];
      if (customProps && customProps.length > 0) {
        // Show the custom properties section
        document.getElementById('custom-properties-container').style.display = 'block';
        
        // Add custom property inputs
        customProps.forEach(prop => {
          const propValue = element[prop.name];
          const value = element[prop.name] !== undefined ? element[prop.name] : 
               (prop.type === 'boolean' ? false : 
                prop.type === 'number' ? null : '');
          const propInput = this.createCustomPropertyInput(prop, value);
          customPropertiesContainer.appendChild(propInput);
        });
      }      
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
        editButton.addEventListener('click', () => this.editRule(index));
        ruleActions.appendChild(editButton);
        
        const deleteButton = document.createElement('button');
        deleteButton.className = 'theme-fire dark';
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', async () => this.deleteRule(index));
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
      
      // Update custom properties
      const customProps = this.elementCustomProperties[this.designerState.selectedElement.type];
      if (customProps && customProps.length > 0) {
        customProps.forEach(prop => {
          const input = document.getElementById(`prop-custom-${prop.name}`);
          if (input) {
            let value;
            if (prop.type === 'boolean') {
              value = input.checked;
            } else if (prop.type === 'number') {
              value = input.value !== '' ? Number(input.value) : null;
            } else {
              value = input.value;
            }
            
            // Save the custom property value to the element
            this.designerState.selectedElement[prop.name] = value;
          }
        });
      }

      // Update layout JSON
      this.generateJson();

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
      const _id = document.querySelector('input[name="_id"]').value;
      // form.method = 'POST';
      // form.action = '/gen/generate_dynamic_layout';
      form.method = 'GET';
      form.action = `/view/${_id}`;
      form.target = 'rendered-preview';

      // 2. Add any parameters
      // const jsonInput = document.createElement('input');
      // jsonInput.type = 'hidden';
      // jsonInput.name = 'JSONSchema';
      // jsonInput.value = this.schemaJson.editor.getValue();
      // form.appendChild(jsonInput);

      // const layoutInput = document.createElement('input');
      // layoutInput.type = 'hidden';
      // layoutInput.name = 'UILayout';
      // layoutInput.value = this.jsonOutput.editor.getValue();
      // form.appendChild(layoutInput);

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
      const _id = document.querySelector('input[name="_id"]').value;
      // form.method = 'POST';
      // form.action = '/gen/generate_pre_dynamic_layout';
      form.method = 'GET';
      form.action = `/view/pre/${_id}`;
      form.target = 'pre-rendered-preview';

      // // 2. Add any parameters
      // const jsonInput = document.createElement('input');
      // jsonInput.type = 'hidden';
      // jsonInput.name = 'JSONSchema';
      // jsonInput.value = this.schemaJson.editor.getValue();
      // form.appendChild(jsonInput);

      // const layoutInput = document.createElement('input');
      // layoutInput.type = 'hidden';
      // layoutInput.name = 'UILayout';
      // layoutInput.value = this.jsonOutput.editor.getValue();
      // form.appendChild(layoutInput);

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
        'div',
        'column',
        'row',
        'data-array',
        'data-item',
        'fieldset',
        'option',
        'wc-accordion',
        'wc-breadcrumb',
        'wc-form',
        'wc-input-radio',
        'wc-select',
        'wc-select-multiple',
        'wc-sidebar',
        'wc-sidenav',
        'wc-slideshow',
        'wc-split-button',
        'wc-timeline',
        'wc-tab',
        'wc-tab-item',
        'wc-tabulator',
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


    //
    // Custom Properties
    //

    createCustomPropertyInput(property, value) {
      const row = document.createElement('div');
      row.className = 'row mb-2';
      
      // Create input element based on property type
      let input;
      const propId = `prop-custom-${property.name}`;
      
      if (property.type === 'boolean') {
        input = new (customElements.get('wc-input'))();
        input.setAttribute('name', propId);
        input.setAttribute('lbl-label', property.label);
        input.setAttribute('class', 'col');
        input.setAttribute('type', 'checkbox');
        input.setAttribute('toggle-switch', '');
        if (value === true) {
          input.setAttribute('checked', '');
          setTimeout(() => {
            input.checked = true;
          }, 10);
        }
      } else if (property.type === 'number') {
        input = new (customElements.get('wc-input'))();
        input.setAttribute('name', propId);
        input.setAttribute('lbl-label', property.label);
        input.setAttribute('class', 'col-1');
        input.setAttribute('type', 'number');
        input.setAttribute('value', value !== undefined ? value : 0);
        // input.value = value !== undefined ? value : '';
      } else if (property.type === 'multiline-string') {
        input = new (customElements.get('wc-textarea'))();
        input.setAttribute('name', propId);
        input.setAttribute('lbl-label', property.label);
        input.setAttribute('class', 'col-1');
        input.setAttribute('value', value !== undefined ? value : '');
      } else if (property.type === 'string-datalist') {
        input = new (customElements.get('wc-input'))();
        input.setAttribute('name', propId);
        input.setAttribute('lbl-label', property.label);
        input.setAttribute('class', 'col-1');
        input.setAttribute('value', value !== undefined ? value : '');
        input.setAttribute('list', propId);
        const datalist = document.createElement('datalist');
        datalist.id = propId;
        property.enum.forEach(value => {
          const option = document.createElement('option');
          option.value = value;
          option.textContent = value;
          datalist.appendChild(option);
        });
        row.appendChild(datalist);
      } else if (property.type === 'string-enum') {
        input = new (customElements.get('wc-select'))();
        input.setAttribute('name', propId);
        input.setAttribute('lbl-label', property.label);
        input.setAttribute('class', 'col-1');
        input.setAttribute('value', value !== undefined ? value : '');
        const items = property.enum.map(m => `{"key": "${m}", "value": "${m}"}`);
        input.setAttribute('items', `[${items}]`);
      } else if (property.type === 'string-radio-modern') {
        input = new (customElements.get('wc-input'))();
        input.setAttribute('name', propId);
        input.setAttribute('lbl-label', property.label);
        input.setAttribute('type', 'radio');
        input.setAttribute('class', 'col-1');
        input.setAttribute('radio-group-class', 'row modern');
        input.setAttribute('value', value !== undefined ? value : '');
        const options = property.enum.map(m => `{"key": "${m}", "value": "${m}"}`);
        input.setAttribute('options', `[${options}]`);
      } else if (property.type === 'string-radio') {
        input = new (customElements.get('wc-input'))();
        input.setAttribute('name', propId);
        input.setAttribute('lbl-label', property.label);
        input.setAttribute('type', 'radio');
        input.setAttribute('class', 'col-1');
        input.setAttribute('radio-group-class', 'row');
        input.setAttribute('value', value !== undefined ? value : '');
        const options = property.enum.map(m => `{"key": "${m}", "value": "${m}"}`);
        input.setAttribute('options', `[${options}]`);
      } else {
        // Default to string type
        input = new (customElements.get('wc-input'))();
        input.setAttribute('name', propId);
        input.setAttribute('lbl-label', property.label);
        input.setAttribute('class', 'col-1');
        input.setAttribute('value', value !== undefined ? value : '');
        // input.value = value !== undefined ? value : '';
      }
      
      // Store a reference to the property name for later retrieval
      input.dataset.propertyName = property.name;
      input.dataset.propertyType = property.type;
      
      row.appendChild(input);
      return row;
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