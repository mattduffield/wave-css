/**
 * 
 *  Name: wc-template-preview
 *  Usage:
 *    <wc-template-preview
 *      url="/screen/contact/123"
 *      new-url="/screen/contact/create"
 *      return-url="/screen/contact_list/list">
 *    </wc-template-preview>
 * 
 *  API:
 *    wc.EventHub.broadcast('wc-accordion:open', ['[data-wc-id="0982-a544-98da-b3da"]'], '.accordion-header:nth-of-type(1)')
 *    wc.EventHub.broadcast('wc-accordion:close', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(1)'])
 *    wc.EventHub.broadcast('wc-accordion:toggle', ['[data-wc-id="0982-a544-98da-b3da"]', '.accordion-header:nth-of-type(2)'])
 */

import { WcBaseComponent } from './wc-base-component.js';

if (!customElements.get('wc-template-preview')) {

  class WcTemplatePreview extends WcBaseComponent {
    static get observedAttributes() {
      return [];
    }

    constructor() {
      super();

      const compEl = this.querySelector('.wc-template-preview');
      if (compEl) {
        this.componentElement = compEl;
      } else {
        this.classList.add("contents");
        this.componentElement = document.createElement('div');
        const cls = this.getAttribute('cls') || '';
        this.componentElement.className = `wc-template-preview ${cls}`;
        this.appendChild(this.componentElement);
        this._createElement();
      }
      console.log('ctor:wc-template-preview');
    }

    async connectedCallback() {
      this._applyStyle();
      this._wireEvents();
      console.log('connectedCallback:wc-template-preview');
    }

    disconnectedCallback() {
      this._unWireEvents();
      console.log('disconnectedCallback:wc-template-preview');
    }

    _createElement() {
      const record_id = this.getAttribute('record-id') || '';
      const slug = this.getAttribute('slug') || '';
      const controls = `<div class="flex flex-row justify-between">
            <wc-input name="preview_toggle" 
              class="row items-center gap-1"
              lbl-label="Preview"
              type="radio"
              radio-group-class="row modern text-2xs"
              value="off"
              >
              <option value="on">Show</option>
              <option value="off">Hide</option>
            </wc-input>
            <wc-input name="drag_toggle" 
              class="row items-center gap-1 hidden"
              lbl-label="Drag n Drop"
              type="radio"
              radio-group-class="row modern text-2xs"
              value="off"
              >
              <option value="on">Enable</option>
              <option value="off">Disable</option>
            </wc-input>
        </div>
      `;
      let src = '';

      if (record_id === 'create' || record_id === '') {
        src = `/v/${slug}/create`;
      } else {
        src = `/v/${slug}/${record_id}`;
      }
      const markup = `${controls}
        <iframe class="preview hidden"
                src=""
                style="height: calc(-360px + 100vh);"
                >
        </iframe>
      `.trim();

      this.componentElement.innerHTML = markup;

    }

    _handleAttributeChange(attrName, newValue) {    
      super._handleAttributeChange(attrName, newValue);  
    }

    _applyStyle() {
      const style = `
        .wc-template-preview {
        }
      `.trim();
      this.loadStyle('wc-template-preview-style', style);
    }

    _wireEvents() {
      super._wireEvents();
      const previewFrame = this.querySelector('iframe.preview');
      const previewToggleInput = this.querySelector('wc-input input[name="preview_toggle"]');
      const previewToggle = previewToggleInput.closest('wc-input');
      const dragToggleInput = this.querySelector('wc-input input[name="drag_toggle"]');
      const dragToggle = dragToggleInput.closest('wc-input');

      previewToggle.addEventListener('change', (event) => {
        const {target} = event;
        const toggle = dragToggle.querySelector('.wc-input');
        if (target.value === 'on') {
          previewFrame.src = src;
          toggle.classList.remove('hidden');
          this.componentElement.classList.add('col-1');
          previewFrame.classList.remove('hidden');
        } else {
          previewFrame.src = '';
          toggle.classList.add('hidden');
          this.componentElement.classList.remove('col-1');
          previewFrame.classList.add('hidden');
        }
        // console.log('wc-template-preview:previewToggle change - ', event);
      });
      dragToggle.addEventListener('change', (event) => {
        const {target} = event;
        if (target.value === 'on') {
          previewFrame.contentDocument.body.classList.add('preview-frame');
          wc.EventHub.broadcast('wc-template-preview:enable-drag', '', '');
        } else {
          previewFrame.contentDocument.body.classList.remove('preview-frame');
          wc.EventHub.broadcast('wc-template-preview:disable-drag', '', '');
        }
        // console.log('wc-template-preview:dragToggle change - ', event);
      });
    }

    _unWireEvents() {
      super._unWireEvents();
      const previewFrame = this.querySelector('iframe.preview');
      const previewToggleInput = this.querySelector('wc-input input[name="preview_toggle"]');
      const previewToggle = previewToggleInput.closest('wc-input');
      const dragToggleInput = this.querySelector('wc-input input[name="drag_toggle"]');
      const dragToggle = dragToggleInput.closest('wc-input');

      previewToggle.removeEventListener('change', (event) => {
        const {target} = event;
        const toggle = dragToggle.querySelector('.wc-input');
        if (target.value === 'on') {
          previewFrame.src = src;
          toggle.classList.remove('hidden');
          this.componentElement.classList.add('col-1');
          previewFrame.classList.remove('hidden');
        } else {
          previewFrame.src = '';
          toggle.classList.add('hidden');
          this.componentElement.classList.remove('col-1');
          previewFrame.classList.add('hidden');
        }
        // console.log('wc-template-preview:previewToggle change - ', event);
      });
      dragToggle.removeEventListener('change', (event) => {
        const {target} = event;
        if (target.value === 'on') {
          previewFrame.contentDocument.body.classList.add('preview-frame');
          wc.EventHub.broadcast('wc-template-preview:enable-drag', '', '');
        } else {
          previewFrame.contentDocument.body.classList.remove('preview-frame');
          wc.EventHub.broadcast('wc-template-preview:disable-drag', '', '');
        }
        // console.log('wc-template-preview:dragToggle change - ', event);
      });
    }

  }

  customElements.define('wc-template-preview', WcTemplatePreview);
}