/**
 * 
 *  Name: wc-code-mirror
 *  Usage:
 *    <wc-code-mirror
 *       name="code"
 *       line-numbers
 *       mode="javascript"
 *       theme="monokai"
 *       value="class Customer { }"
 *       tab-size="2"
 *       indent-unit="2">
 *    </wc-code-mirror>
 * 
 *  Note: 
 *  - This component doesn't use ShadowRoot since it loads CSS Themes dynamically and uses the Popover API.
 *    Due to these to uses, it is simply better to define it without ShadowRoot.
 *  - This component requires a `name` attribute in order to use it with the Popover API. Each instance 
 *    must have a unique name.
 * 
 */

import { sleep } from './helper-function.js';
import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-code-mirror')) {
  class WcCodeMirror extends WcBaseComponent {
    static get observedAttributes() {
      return ['id', 'class', 'height', 'theme', 'mode', 'lbl-label', 'lbl-class', 'line-numbers', 'line-wrapping', 'fold-gutter', 'tab-size', 'indent-unit', 'value', 'disabled', 'required'
        , 'fetch'
      ];
    }

    constructor() {
      super();
      this.childComponentName = 'editor';
      this._isResizing = false;
      this._internals = this.attachInternals();
      this.firstContent = '';
      if (this.innerHTML.trim() != "") {
        this.firstContent = this.innerHTML.replaceAll('=&gt;', '=>');
        this.innerHTML = "";
      } else if (this.firstChild && this.firstChild.nodeName == '#text') {
        this.firstContent = this.firstChild.textContent;
        this.removeChild(this.firstChild);
      }
      const compEl = this.querySelector('.wc-code-mirror');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.componentElement = document.createElement('div');
        this.componentElement.classList.add('wc-code-mirror');
        this.appendChild(this.componentElement);      
      }
      // console.log('ctor:wc-code-mirror');
    }

    async connectedCallback() {
      super.connectedCallback();

      this._applyStyle();
      // console.log('conntectedCallback:wc-code-mirror');
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
    }

    async _handleAttributeChange(attrName, newValue, oldValue) {
      if (attrName === 'lbl-class') {
        const name = this.getAttribute('name');
        const lbl = this.querySelector(`label[for="${name}"]`);
        lbl?.classList.add(newValue);
      } else if (attrName === 'theme') {
        await this.loadTheme(newValue);
      } else if (attrName === 'mode') {
        await this.loadMode(newValue);
      } else if (attrName === 'height') {
        if (newValue) {
          this.editor.setSize(null, newValue)
        }
      } else if (attrName === 'line-numbers') {
        if (newValue || newValue == '') {
          this.editor.setOption('lineNumbers', true);
        } else {
          this.editor.setOption('lineNumbers', false);
        }
        const gutters = await this.getGutters();
        this.editor.setOption('gutters', gutters);
      } else if (attrName === 'line-wrapping') {
        if (newValue || newValue == '') {
          this.editor.setOption('lineWrapping', true);
        } else {
          this.editor.setOption('lineWrapping', false);
        }      
      } else if (attrName === 'fold-gutter') {
        if (newValue || newValue == '') {
          this.editor.setOption('foldGutter', true);
        } else {
          this.editor.setOption('foldGutter', false);
        }      
        const gutters = await this.getGutters();
        this.editor.setOption('gutters', gutters);
      } else if (attrName === 'tab-size') {
        this.editor.setOption('tabSize', parseInt(newValue, 10));
      } else if (attrName === 'indent-unit') {
        this.editor.setOption('indentUnit', parseInt(newValue, 10));
      } else if (attrName === 'value') {
        this.editor.setValue(newValue);
      } else if (attrName === 'disabled') {
        if (this.hasAttribute('disabled')) {
          this.editor.setOption('readOnly', 'nocursor');
        } else {
          this.editor.setOption('readOnly', false);
        }
      } else if (attrName === 'fetch') {
        if (!oldValue) return;
        if (this.editor) {
          this.fetchUrl = newValue;
          this.handleFetch(this.fetchUrl);
        }
      } else {
        super._handleAttributeChange(attrName, newValue, oldValue);  
      }
    }

    _render() {
      super._render();
      const innerEl = this.querySelector('.wc-code-mirror > *');
      if (innerEl) {
        const settingsIcon = this.querySelector('.settings-icon');
        settingsIcon.addEventListener('click', this._handleSettingsIconClick.bind(this));
      } else {
        this.componentElement.innerHTML = '';

        this._createInnerElement();
      }

      if (typeof htmx !== 'undefined') {
        htmx.process(this);
      }
      // console.log('_render:wc-code-mirror');
    }

    async _createInnerElement() {
      const labelText = this.getAttribute('lbl-label') || '';
      const name = this.getAttribute('name') || '';
      if (!name) {
        throw new Error("Name attribute must be provided.");
      }
      if (labelText) {
        const lblEl = document.createElement('label');
        const value = this.getAttribute('value') || '';
        lblEl.textContent = labelText;
        lblEl.setAttribute('for', name);
        this.componentElement.appendChild(lblEl);
      }    
      this.editor = null;
      this.popoverId = `settings-popover-${this.getAttribute('name') || 'wc-code-mirror'}`;
      // Create a settings icon
      const settingsIcon = document.createElement('button');
      settingsIcon.type = 'button';
      settingsIcon.innerHTML = `
        <svg class="h-3 w-3" fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512">
          <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z"/>
        </svg>
      `.trim();
      settingsIcon.className = 'settings-icon';
      settingsIcon.setAttribute('popovertarget', this.popoverId);
      settingsIcon.addEventListener('click', this._handleSettingsIconClick.bind(this));
      this.componentElement.appendChild(settingsIcon);

      // Create the popover for settings using the Popover API
      const settingsPopover = document.createElement('div');
      settingsPopover.classList.add('settings-popover');
      settingsPopover.id = this.popoverId;
      settingsPopover.setAttribute('popover', 'manual');
      this.componentElement.appendChild(settingsPopover);

      // Set the initial value from the attribute if provided
      const initialValue = this.getAttribute('value') || this.firstContent || '';

      await Promise.all([
        this.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.css'),
        this.loadLibrary('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.5/codemirror.min.js', 'CodeMirror')
      ]);

      // Render the editor and pass the initial value
      await this.renderEditor(initialValue);

      // Set the initial form value to the value from the attribute
      this._internals.setFormValue(initialValue);
    }

    _handleSettingsIconClick(event) {
      const settingsPopover = this.querySelector('.settings-popover');
      this._buildSettingsPopover(settingsPopover);
    }

    _buildSettingsPopover(settingsPopover) {
      const hasLineNumbers = this.hasAttribute('line-numbers');
      const hasLineWrapper = this.hasAttribute('line-wrapper');
      const hasFoldGutter = this.hasAttribute('fold-gutter');
      const modes = [
        "apl", "asciiarmor", "asn.1", "asterisk", "brainfuck", "clike", "clojure",
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
      ];
      const themes = [
        "3024-day", "3024-night", "abcdef", "ambiance", "ayu-dark", "ayu-mirage",
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
      ];
      // HTML for the popover (to change theme, mode, line numbers)
      settingsPopover.innerHTML = `
        <div id="popover-form" class="popover-form col gap-3">
          <button id="closeButton" class="close-btn" type="button"
            popovertarget="${this.popoverId}" popovertargetaction="hide"
            >
            <span aria-hidden="true">X</span>
            <span class="sr-only">Close</span>
          </button>
          <div class="row gap-2">
            <wc-select class="col-1" name="theme-select" lbl-label="Theme" autofocus elt-class="w-full">
              ${themes.map(theme => `<option value="${theme}" ${theme == this.getAttribute('theme') ? 'selected' : ''}>${theme}</option>`).join('')}
            </wc-select>
            <wc-select class="col-1" name="mode-select" lbl-label="Mode" elt-class="w-full">
              ${modes.map(mode => `<option value="${mode}" ${mode == this.getAttribute('mode') ? 'selected' : ''}>${mode}</option>`).join('')}
            </wc-select>
          </div>
          <div class="row gap-2">
            <wc-input class="col-1" name="line-numbers" lbl-label="Line Numbers" ${hasLineNumbers ? 'checked ' : '' }type="checkbox"></wc-input>
            <wc-input class="col-1" name="line-wrapper" lbl-label="Line Wrapper" ${hasLineWrapper ? 'checked ' : ''}type="checkbox"></wc-input>
            <wc-input class="col-1" name="fold-gutter" lbl-label="Fold Gutter" ${hasFoldGutter ? 'checked ' : '' }type="checkbox"></wc-input>
          </div>
          <div class="row gap-2">
            <wc-input class="col-1" name="tab-size" lbl-label="Tab Size" value="${this.getAttribute('tab-size')}" type="number"></wc-input>
            <wc-input class="col-1" name="indent-unit" lbl-label="Indent Unit" value="${this.getAttribute('indent-unit')}" type="number"></wc-input>
          </div>
          <div class="row gap-2 justify-end gap-x-4">
            <button class="" id="apply-settings" type="submit">
              Apply
            </button>
            <button class="btn-clear" id="cancel-settings" type="button">
              Cancel
            </button>
          </div>
        </div>
      `;

      // Add functionality to apply settings
      settingsPopover.querySelector('#closeButton').addEventListener('click', this._handleSettingsClose.bind(this), { once: true });
      settingsPopover.querySelector('#apply-settings').addEventListener('click', this._handleSettingsApply.bind(this), { once: true });
      settingsPopover.querySelector('#cancel-settings').addEventListener('click', this._handleSettingsClose.bind(this), { once: true });
    }

    _handleSettingsApply(event) {
      const settingsPopover = this.querySelector('.settings-popover');
      const close = settingsPopover.querySelector('#closeButton');
      const theme = settingsPopover.querySelector('#theme-select').value;
      const mode = settingsPopover.querySelector('#mode-select').value;
      const lineNumbers = settingsPopover.querySelector('#line-numbers').checked;
      const lineWrapper = settingsPopover.querySelector('#line-wrapper').checked;
      const foldGutter = settingsPopover.querySelector('#fold-gutter').checked;
      const tabSize = settingsPopover.querySelector('#tab-size').value;
      const indentUnit = settingsPopover.querySelector('#indent-unit').value;

      // Update CodeMirror editor with new settings
      this.setAttribute('theme', theme);
      this.setAttribute('mode', mode);
      if (lineNumbers) {
        this.setAttribute('line-numbers', '');
      } else {
        this.removeAttribute('line-numbers');
      }
      if (lineWrapper) {
        this.setAttribute('line-wrapper', '');
      } else {
        this.removeAttribute('line-wrapper');
      }
      if (foldGutter) {
        this.setAttribute('fold-gutter', '');
      } else {
        this.removeAttribute('fold-gutter');
      }    
      this.setAttribute('tab-size', tabSize);
      this.setAttribute('indent-unit', indentUnit);
      this._handleSettingsClose(event);
    }
    _handleSettingsClose(event) {
      event.preventDefault();  // Prevent form submission
      const settingsPopover = this.querySelector('.settings-popover');
      settingsPopover.togglePopover();
      while (settingsPopover.firstChild) {
        settingsPopover.removeChild(settingsPopover.firstChild);
      }
    }

    get value() {
      return this.editor?.getValue() || ''; // Get the value from the form element (input, select, textarea, etc.)
    }

    set value(val) {
      if (this.editor) {
        this.editor.setValue(val);
        this._internals.setFormValue(val); // Set the form value in ElementInternals
      }
    }
    
    _applyStyle() {
      const style = `
        /* Container using flex or grid layout */
        .editor-container-flex {
          display: flex;
          gap: 10px;
          height: calc(100vh - 60px); /* Adjust for the header height */
          width: 100%;
          flex-wrap: wrap;
        }

        .editor-container-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 10px;
          height: calc(100vh - 60px); /* Adjust for the header height */
          width: 100%;
        }

        
        wc-code-mirror {
          display: contents;
        }

        /* Ensure that each editor fills its container */
        .wc-code-mirror {
          position: relative;
          width: 100%;
          display: flex;
          flex-direction: column;
          border: 2px solid transparent;

          overflow: hidden;
          resize: vertical;
    
          min-height: 10em;        
        }
        .wc-code-mirror:focus-within {
          /* border: 2px solid var(--primary-bg-color); */
        }

        .CodeMirror {
          height: auto;
          min-height: 150px;
          width: 100%;
          box-sizing: border-box; /* Avoid overflow caused by padding or borders */
          overflow: auto; /* Scroll within the editor */
        }
        
        .settings-icon {
          background: none;
          border: none;
          position: absolute;
          top: 2px;
          right: 5px;
          padding: 0;
          cursor: pointer;
          color: gray;
          font-size: 1.5em;
          z-index: 1;
        }
        
        .wc-code-mirror > label ~ .settings-icon {
          top: 22px;
        }

        .settings-popover {
          background: transparent;
          position: absolute;
          left: 0;
          right: 0;
          padding: 0;
          margin: 0 auto;
          height: 100%;
          width: 100%;
          border: none;
          display: flex;
          justify-items: center;
          align-items: center;
        }


        .settings-popover::backdrop {
          background: rgb(190 190 190 / 50%);
        }


        #popover-form {
          position: relative;
          padding: 20px;
          margin: 0 auto;
          border-radius: 5px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
        }

        .close-btn {
          color: gray;
          border: none;
          background: none;
          position: absolute;
          right: 0.5rem;
          top: 0.5rem;
          padding: 0;
          cursor: pointer;
        }

        .sr-only:not(:focus):not(:active) {
          clip: rect(0 0 0 0); 
          clip-path: inset(50%);
          height: 1px;
          overflow: hidden;
          position: absolute;
          white-space: nowrap; 
          width: 1px;
        }

        /* JavaScript highlighting in web components */
        .cm-js-keyword { color: #66d9ef !important; }
        .cm-js-variable { color: #f8f8f2 !important; }
        .cm-js-def { color: #fd971f !important; }
        .cm-js-operator { color: #f92672 !important; }
        .cm-js-string { color: #e6db74 !important; }
        .cm-js-number { color: #ae81ff !important; }
        .cm-js-comment { color: #75715e !important; }
        .cm-js-property { color: #a6e22e !important; }
        .cm-js-atom { color: #ae81ff !important; }
      `.trim();
      this.loadStyle('wc-code-mirror-style', style);
    }
    
    async renderEditor(initialValue) {
      await Promise.all([
        this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/search/searchcursor.min.js'),
        this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/keymap/sublime.min.js'),
        this.loadScript('https://cdn.jsdelivr.net/npm/cm-show-invisibles@3.1.0/lib/show-invisibles.min.js')
      ]);

      const gutters = await this.getGutters();

      // Initialize CodeMirror editor
      this.editor = CodeMirror(this.componentElement, {
        mode: this.getAttribute('mode') || 'javascript',
        theme: this.getAttribute('theme') || 'default',
        lineNumbers: this.hasAttribute('line-numbers'),
        lineWrapper: this.hasAttribute('line-wrapper'),
        foldGutter: this.hasAttribute('fold-gutter'),
        gutters: gutters,
        extraKeys: {
          "Ctrl-Q": function(cm){ cm.foldCode(cm.getCursor()); },
          "Tab": (cm) => {
            if (cm.somethingSelected()) {
              cm.indentSelection("add");
            } else {
              var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
              cm.replaceSelection(spaces);
            }
          }        
        },
        value: initialValue,
        tabSize: parseInt(this.getAttribute('tab-size'), 10) || 4,
        indentUnit: parseInt(this.getAttribute('indent-unit'), 10) || 2,
        matchBrackets: true,
        keyMap: "sublime",
        showInvisibles: true
      });

      // Load theme and mode dynamically
      await this.loadAssets(this.getAttribute('theme'), this.getAttribute('mode'));
      

      // Apply JavaScript highlighting to web components
      this.addWebComponentsJsHighlighting();

      // Sync editor value with the internal form value
      this.editor.on('change', async () => {
        const value = this.editor.getValue();
        this._internals.setFormValue(value);
        const gutters = await this.getGutters();
        this.editor.setOption('gutters', gutters);
      });

      const payload = { 
        detail: { name: this.getAttribute('name'), editor: this.editor },
        bubbles: true,
        composed: true
      };
      const customEvent = new CustomEvent('wc-code-mirror:ready', payload);
      this.dispatchEvent(customEvent);
      document.body.dispatchEvent(customEvent);
      // console.log('----> broadcasting event: wc-code-mirror:ready');

      const url = this.getAttribute('fetch');
      this.handleFetch(url);
    }
    
    // This is required to inform the form that the component can be form-associated
    static get formAssociated() {
      return true;
    }

    handleFetch(url) {
      try {
        if (url) {
          // console.log('----> wc-code-mirror - fetching from: ', url);
          fetch(url, {
            method: 'GET'
          })
          .then(response => response.json())
          .then(json => {
            this.editor.setValue(json.result);
            const payload = { 
              detail: { name: this.getAttribute('name'), editor: this.editor },
              bubbles: true,
              composed: true
            };
            const customEvent = new CustomEvent('fetch-complete', payload);
            this.dispatchEvent(customEvent);      
          });
        }
      } catch(ex) {
        console.error('Error encountered while trying to fetch wc-code-mirror data!', ex);
      }      
    }
    
    // Method called when the form is reset
    formResetCallback() {
      this.editor.setValue(''); // Reset editor content on form reset
    }

    // Method called when the form state is restored (for example, after back/forward navigation)
    formStateRestoreCallback(state) {
      if (state) {
        this.editor.setValue(state);
      }
    }

    // Optional: Handle disabled state when the form element is disabled
    formDisabledCallback(isDisabled) {
      if (this.editor) {
        this.editor.setOption('readOnly', isDisabled);
      }
    }

    async refresh(timeout=500) {
      await sleep(timeout);
      this.editor.refresh();
      this.editor.focus();
    }

    async getGutters() {
      if (this.hasAttribute('fold-gutter')) {
        // Need to load these serially...
        await this.loadCSS('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldgutter.min.css'),
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldcode.min.js'),
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/foldgutter.min.js'),
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/brace-fold.min.js'),
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/comment-fold.min.js'),
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/indent-fold.min.js'),
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/fold/xml-fold.min.js'),
        await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/edit/matchbrackets.min.js')
      }

      let gutters = [];
      const hasLineNumbers = this.hasAttribute('line-numbers');
      const hasFoldGutter = this.hasAttribute('fold-gutter');

      if (hasLineNumbers && hasFoldGutter) {
        gutters = ["CodeMirror-linenumbers", "CodeMirror-foldgutter"];
      } else if (hasFoldGutter) {
        gutters = ["CodeMirror-foldgutter"];
      }
      return gutters;    
    }

    async loadAssets(theme, mode) {
      if (theme && theme !== 'default') {
        await this.loadTheme(theme);
      }
      if (mode) {
        await this.loadMode(mode);
      }
    }

    async loadTheme(theme) {
      if (!theme || theme === 'default') return;

      const themeUrl = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/${theme}.min.css`;
      if (!document.querySelector(`link[href="${themeUrl}"]`)) {
        await this.loadCSS(themeUrl);
      }
      this.editor.setOption('theme', theme);
    }

    async loadMode(mode) {
      const modeDependencies = {
        "htmlmixed": ["xml", "css", "javascript"],
        "php": ["htmlmixed", "xml", "css", "javascript"],
        "htmlembedded": ["xml", "javascript"],
        "markdown": ["htmlmixed", "xml", "css", "javascript"],
      };
      const dependencies = modeDependencies[mode];
      if (dependencies && dependencies.length > 0) {
        for (const modeName of dependencies) {
          await this.loadScript(`https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/${modeName}/${modeName}.min.js`);
        }
      }

      if (mode === 'litespec') {
        CodeMirror.registerHelper("fold", "litespec", function(cm, start) {
          var line = start.line;
          var lineText = cm.getLine(line);
          
          // Find the opening `{` in the current line
          var startChar = lineText.indexOf("{");
          if (startChar === -1) return; // If no `{` found, no fold

          var tokenType = cm.getTokenTypeAt(CodeMirror.Pos(line, startChar + 1));
          if (tokenType !== "brace") return; // Ensure this is a brace

          // Find the matching closing `}`
          var match = cm.findMatchingBracket(CodeMirror.Pos(line, startChar + 1));
          if (!match || !match.match || match.to === null) return; // No matching closing `}` found

          const result = {
            from: CodeMirror.Pos(line, startChar + 1),  // Fold start
            to: match.to                               // Fold end        
          };
          return result;
        });
        this.editor.setOption('foldOptions', { widget: '↔' });

        const addonModeDependencies = {
          "litespec": ["simple"],
        };
        const addonDependencies = addonModeDependencies[mode];
        if (addonDependencies && addonDependencies.length > 0) {
          for (const modeName of addonDependencies) {
            await this.loadScript(`https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/addon/mode/${modeName}.min.js`);
          }
        }

        const customModes = ['litespec']; // List of custom simple modes you might add
        if (customModes.includes(mode)) {
          const modeUrl = 'https://mattduffield.github.io/lite-spec/dist/highlighters/litespec.mode.cm.js';
          await this.loadScript(modeUrl);
          // Once the custom mode is loaded, set it for the editor
          this.editor.setOption('mode', mode);
          return;
        }
      }





      const modeUrl = `https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/${mode}/${mode}.min.js`;
      if (!document.querySelector(`script[src="${modeUrl}"]`)) {
        await this.loadScript(modeUrl);
      }

      this.editor.setOption('mode', mode);


      // If mode is HTML-based, apply our highlighting
      if (['htmlmixed', 'php', 'markdown', 'htmlembedded'].includes(mode)) {
        // Wait a bit for the mode to be fully applied
        setTimeout(() => {
          this.addWebComponentsJsHighlighting();
        }, 100);
      }


    }

    _unWireEvents() {
      super._unWireEvents();
      const settingsIcon = this.querySelector('.settings-icon');
      settingsIcon.removeEventListener('click', this._handleSettingsIconClick.bind(this));
    }



    /**
     * Add JavaScript highlighting to web components
     * This approach directly scans the document for web component content
     */
    addWebComponentsJsHighlighting() {
      // console.log("Adding JS highlighting to web components");
      
      // Function to apply the highlighting
      const applyHighlighting = () => {
        // console.log("Applying highlighting to editor content");
        
        // Get all content lines
        const lines = this.editor.getValue().split('\n');
        
        // Variables to track web component state
        let inComponent = false;
        let componentName = '';
        let content = [];
        let startLine = -1;
        let endLine = -1;
        
        // Scan for web component tags
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          
          // Look for opening tag
          if (!inComponent) {
            const openMatch = line.match(/<(wc-[a-zA-Z0-9-]+)(?:\s|>)/i);
            if (openMatch) {
              componentName = openMatch[1];
              inComponent = true;
              startLine = i;
              // console.log(`Found opening tag at line ${i}: ${componentName}`);
            }
          } 
          // Look for closing tag
          else {
            const closeMatch = line.match(new RegExp(`</${componentName}>`));
            if (closeMatch) {
              endLine = i;
              inComponent = false;
              // console.log(`Found closing tag at line ${i}: ${componentName}`);
              
              // Process content between tags
              if (startLine !== -1 && endLine !== -1) {
                const jsContent = lines.slice(startLine + 1, endLine).join('\n');
                // console.log(`Processing JS content between lines ${startLine+1} and ${endLine}`);
                
                // Add code highlighting manually using markers
                this.highlightJavaScript(jsContent, startLine + 1, endLine);
              }
              
              // Reset for next component
              startLine = -1;
              endLine = -1;
              componentName = '';
            }
          }
        }
      };
            
      // Run initial highlighting
      setTimeout(() => {
        applyHighlighting();
        
        // Watch for changes and reapply highlighting
        this.editor.on('change', () => {
          // Debounce to avoid too many updates
          clearTimeout(this._highlightTimeout);
          this._highlightTimeout = setTimeout(() => {
            applyHighlighting();
          }, 500);
        });
        
        // console.log("Added change listener for highlighting");
      }, 100);
    }

    /**
     * Highlight JavaScript content using markers
     */
    highlightJavaScript(jsContent, startLine, endLine) {
      // console.log("Highlighting JavaScript content");
      
      // Clear any existing markers in this range
      const doc = this.editor.getDoc();
      const existingMarks = doc.findMarks(
        {line: startLine, ch: 0}, 
        {line: endLine, ch: 0}
      );
      
      existingMarks.forEach(mark => mark.clear());
      
      // Split content into lines
      const jsLines = jsContent.split('\n');
      
      // Use simple regex patterns to identify JavaScript tokens
      const patterns = [
        { pattern: /\b(function|var|let|const|return|if|else|endif|for|endfor|while|switch|case|break|continue|this|new|typeof|instanceof|class|async|await|in)\b/g, className: 'cm-js-keyword' },
        { pattern: /\b(true|false|null|undefined)\b/g, className: 'cm-js-atom' },
        { pattern: /\b\d+(\.\d+)?\b/g, className: 'cm-js-number' },
        { pattern: /(["'`])(?:[^\\]|\\.)*?\1/g, className: 'cm-js-string' },
        { pattern: /[+\-*/%=&|^<>!?:;,.]/g, className: 'cm-js-operator' },
        // Arrow functions
        { pattern: /=>/g, className: 'cm-js-keyword' },
        // Function/property access
        { pattern: /\b\.[A-Za-z]+/g, className: 'cm-js-property' }
      ];
      
      // Apply highlighting to each line
      jsLines.forEach((line, lineIndex) => {
        // Add background to whole line to show it's web component content
        doc.markText(
          {line: startLine + lineIndex, ch: 0},
          {line: startLine + lineIndex, ch: line.length},
          {className: 'cm-wc-content'}
        );
        
        // Apply each pattern
        patterns.forEach(({pattern, className}) => {
          let match;
          // Reset regex state
          pattern.lastIndex = 0;
          
          while ((match = pattern.exec(line)) !== null) {
            const startCh = match.index;
            const endCh = startCh + match[0].length;
            
            // Add specific token highlighting
            doc.markText(
              {line: startLine + lineIndex, ch: startCh},
              {line: startLine + lineIndex, ch: endCh},
              {className}
            );
          }
        });
      });
    }

  }

  customElements.define('wc-code-mirror', WcCodeMirror);
}