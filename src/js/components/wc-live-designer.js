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
      return ['id', 'class', 'canvas-url', 'theme'];
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

    // Component palette items
    static CONTAINERS = [
      { type: 'div', label: 'Div' },
      { type: 'fieldset', label: 'Fieldset' },
      { type: 'wc-form', label: 'Form' },
      { type: 'wc-tab', label: 'Tab Container' },
      { type: 'wc-tab-item', label: 'Tab Item' },
      { type: 'wc-accordion', label: 'Accordion' },
      { type: 'wc-dropdown', label: 'Dropdown' },
      { type: 'wc-sidebar', label: 'Sidebar' },
      { type: 'wc-sidenav', label: 'Sidenav' },
    ];

    static ELEMENTS = [
      { type: 'wc-input', label: 'Input', icon: 'input-text' },
      { type: 'wc-select', label: 'Select', icon: 'list-dropdown' },
      { type: 'wc-textarea', label: 'Textarea', icon: 'align-left' },
      { type: 'wc-field', label: 'Field (display)', icon: 'tag' },
      { type: 'wc-input', label: 'Checkbox', icon: 'square-check', defaults: { type: 'checkbox', 'toggle-switch': '' } },
      { type: 'wc-input', label: 'Email', icon: 'envelope', defaults: { type: 'email' } },
      { type: 'wc-input', label: 'Phone', icon: 'phone', defaults: { type: 'tel' } },
      { type: 'wc-input', label: 'Date', icon: 'calendar', defaults: { type: 'date' } },
      { type: 'wc-input', label: 'Number', icon: 'hashtag', defaults: { type: 'number' } },
      { type: 'wc-input', label: 'Currency', icon: 'dollar-sign', defaults: { type: 'currency' } },
      { type: 'hr', label: 'Divider' },
      { type: 'wc-fa-icon', label: 'Icon' },
      { type: 'wc-save-split-button', label: 'Save Split Button' },
      { type: 'wc-save-button', label: 'Save Button' },
      { type: 'wc-hotkey', label: 'Hotkey' },
      { type: 'wc-breadcrumb', label: 'Breadcrumb' },
      { type: 'wc-loader', label: 'Loader' },
      { type: 'wc-article-skeleton', label: 'Article Skeleton' },
      { type: 'wc-table-skeleton', label: 'Table Skeleton' },
      { type: 'wc-code-mirror', label: 'Code Mirror' },
      { type: 'wc-tabulator', label: 'Tabulator' },
      { type: 'wc-image', label: 'Image' },
      { type: 'wc-google-map', label: 'Google Map' },
      { type: 'wc-chart', label: 'Chart' },
      { type: 'wc-chartjs', label: 'ChartJS' },
      { type: 'wc-ai-bot', label: 'AI Bot' },
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
            <!-- Left Panel: Palette (resizable) -->
            <div class="ld-palette flex flex-col" style="width: 220px; min-width: 160px; max-width: 400px; background: var(--surface-2); border-right: 1px solid var(--surface-5); overflow: hidden; resize: horizontal;">
              <wc-tab class="flex flex-col flex-1 min-h-0 text-xs" animate>
                <wc-tab-item class="active" label="Containers">
                  <input class="ld-palette-search" type="search" placeholder="Filter..." style="margin: 4px; padding: 4px 8px; background: var(--surface-3); color: var(--text-1); border: 1px solid var(--surface-5); border-radius: 4px; font-size: 11px;" />
                  <div class="flex flex-col gap-1 p-2 overflow-y-auto" style="max-height: calc(100vh - 140px);">
                    ${WcLiveDesigner.CONTAINERS.map(c => `
                      <div class="ld-palette-item" data-type="${c.type}" draggable="true">${c.label}</div>
                    `).join('')}
                  </div>
                </wc-tab-item>
                <wc-tab-item label="Elements">
                  <input class="ld-palette-search" type="search" placeholder="Filter..." style="margin: 4px; padding: 4px 8px; background: var(--surface-3); color: var(--text-1); border: 1px solid var(--surface-5); border-radius: 4px; font-size: 11px;" />
                  <div class="flex flex-col gap-1 p-2 overflow-y-auto" style="max-height: calc(100vh - 140px);">
                    ${WcLiveDesigner.ELEMENTS.map(c => `
                      <div class="ld-palette-item" data-type="${c.type}" ${c.defaults ? `data-defaults='${JSON.stringify(c.defaults)}'` : ''} draggable="true">${c.label}</div>
                    `).join('')}
                  </div>
                </wc-tab-item>
                <wc-tab-item label="Fields">
                  <div class="flex flex-col gap-1 p-2">
                    <select class="ld-schema-select" style="background: var(--surface-3); color: var(--text-1); border: 1px solid var(--surface-5); border-radius: 4px; padding: 4px 8px; font-size: 11px; width: 100%;">
                      <option value="">Select a schema...</option>
                    </select>
                    <div class="ld-fields flex flex-col gap-1 overflow-y-auto" style="max-height: calc(100vh - 180px);">
                    </div>
                  </div>
                </wc-tab-item>
              </wc-tab>
            </div>

            <!-- Center: Canvas -->
            <div class="ld-canvas-area flex flex-col flex-1 items-center justify-start overflow-auto" style="background: var(--surface-1);">
              <iframe class="ld-canvas-iframe" src="${canvasUrl}" style="background: var(--surface-1); border: none; transition: width 0.3s, height 0.3s;"></iframe>
            </div>

            <!-- Right Panel: Properties (resizable) -->
            <div class="ld-properties flex flex-col" style="width: 280px; min-width: 200px; max-width: 500px; background: var(--surface-2); border-left: 1px solid var(--surface-5); overflow-y: auto; resize: horizontal; direction: rtl;">
              <div style="direction: ltr;">
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
        </div>
      `;

      this._applyStyle();
      this._wireEvents();

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
        .ld-props-panel .ld-prop-row { display: flex; flex-direction: column; gap: 2px; }
        .ld-props-panel .ld-prop-row label { font-size: 11px; color: var(--text-5); font-weight: 500; }
        .ld-props-panel .ld-prop-row input,
        .ld-props-panel .ld-prop-row select,
        .ld-props-panel .ld-prop-row textarea {
          background: var(--surface-3); color: var(--text-1); border: 1px solid var(--surface-5);
          border-radius: 4px; padding: 4px 8px; font-size: 12px; font-family: inherit;
        }
        /* Resizable panel handles */
        .ld-palette { overflow: hidden; }
        .ld-palette::-webkit-resizer { background: var(--surface-5); }
        .ld-properties::-webkit-resizer { background: var(--surface-5); }
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

      // Palette drag start
      this.querySelectorAll('.ld-palette-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
          const type = item.dataset.type;
          const defaults = item.dataset.defaults ? JSON.parse(item.dataset.defaults) : {};
          e.dataTransfer.setData('application/json', JSON.stringify({ type, defaults }));
          e.dataTransfer.effectAllowed = 'copy';
        });
      });

      // Drop on the iframe area — relay to iframe
      const canvasArea = this.querySelector('.ld-canvas-area');
      canvasArea?.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      });

      canvasArea?.addEventListener('drop', (e) => {
        e.preventDefault();
        try {
          const payload = JSON.parse(e.dataTransfer.getData('application/json'));
          if (payload.type) {
            const properties = { ...payload.defaults };
            if (!properties['lbl-label'] && payload.type.startsWith('wc-input')) {
              properties['lbl-label'] = 'New Field';
            }
            this._postToCanvas('addComponent', {
              type: payload.type,
              parentId: null,
              position: null,
              properties
            });
          }
        } catch (err) {
          console.warn('[wc-live-designer] Drop error:', err);
        }
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

    async _loadSchemaList(selectEl) {
      try {
        const response = await fetch('/api/_schema_builder?size=100&page=1');
        if (!response.ok) return;
        const data = await response.json();
        const schemas = data.data || [];
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
        const response = await fetch(`/api/_schema_builder?size=1&page=1&filter_field=slug&filter_type=%3D&filter_value=${schemaSlug}`);
        if (!response.ok) {
          fieldsContainer.innerHTML = '<div style="color: var(--text-6);">Failed to load schema</div>';
          return;
        }
        const data = await response.json();
        const schemas = data.data || [];
        if (schemas.length === 0) {
          fieldsContainer.innerHTML = '<div style="color: var(--text-6);">Schema not found</div>';
          return;
        }

        const schemaRecord = schemas[0];
        let jsonSchema;
        try {
          jsonSchema = typeof schemaRecord.json_schema === 'string'
            ? JSON.parse(schemaRecord.json_schema)
            : schemaRecord.json_schema;
        } catch (e) {
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

          // Wire drag
          item.addEventListener('dragstart', (e) => {
            const type = item.dataset.type;
            const defaults = JSON.parse(item.dataset.defaults);
            e.dataTransfer.setData('application/json', JSON.stringify({ type, defaults }));
            e.dataTransfer.effectAllowed = 'copy';
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
        // Will need enum options populated
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
          // Set theme on canvas
          const theme = this.getAttribute('theme') || 'theme-ocean dark';
          this._postToCanvas('setTheme', { theme });
          // Send sample data if available
          if (Object.keys(this._sampleData).length > 0) {
            this._postToCanvas('setSampleData', { data: this._sampleData });
          }
          break;

        case 'componentSelected':
          this._selectedComponent = {
            designerId: e.data.designerId,
            type: e.data.type,
            properties: e.data.properties
          };
          this._showPropertyPanel(e.data.type, e.data.properties, e.data.designerId);
          break;

        case 'componentDeselected':
          this._selectedComponent = null;
          this._hidePropertyPanel();
          break;

        case 'componentAdded':
        case 'componentRemoved':
          // Could update a tree view here
          break;

        case 'treeResponse':
          // Handle serialized tree
          if (this._treeCallback) {
            this._treeCallback(e.data.tree);
            this._treeCallback = null;
          }
          break;
      }
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
        commonProps.push({ name: 'required', label: 'Required', type: 'checkbox', value: properties.required || false });
        commonProps.push({ name: 'toggle-switch', label: 'Toggle Switch', type: 'checkbox', value: properties['toggle-switch'] != null });
      } else if (type === 'wc-select') {
        commonProps.push({ name: 'required', label: 'Required', type: 'checkbox', value: properties.required || false });
        commonProps.push({ name: 'multiple', label: 'Multiple', type: 'checkbox', value: properties.multiple || false });
        commonProps.push({ name: 'mode', label: 'Mode', type: 'select', value: properties.mode || '', options: ['', 'chip'] });
        commonProps.push({ name: 'data-lookup', label: 'Lookup', type: 'text', value: properties['data-lookup'] || '' });
      } else if (type === 'wc-textarea') {
        commonProps.push({ name: 'rows', label: 'Rows', type: 'number', value: properties.rows || '4' });
        commonProps.push({ name: 'required', label: 'Required', type: 'checkbox', value: properties.required || false });
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
        input?.addEventListener('change', () => {
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

    _handleAttributeChange(name, newValue) {
      if (name === 'theme' && this._canvasReady) {
        this._postToCanvas('setTheme', { theme: newValue });
      }
    }
  }

  customElements.define(WcLiveDesigner.is, WcLiveDesigner);
}
