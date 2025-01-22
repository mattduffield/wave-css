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
    }

    _createElement() {
      const record_id = this.getAttribute('record-id') || '';
      const slug = this.getAttribute('slug') || '';
      const controls = `<div class="flex flex-row justify-between">
            <wc-input name="preview_toggle" 
              class="col"
              lbl-label="Preview"
              type="radio"
              radio-group-class="row modern"
              value="off"
              >
              <option value="on">Show</option>
              <option value="off">Hide</option>
            </wc-input>
            <wc-input name="drag_toggle" 
              class="col"
              lbl-label="Drag n Drop"
              type="radio"
              radio-group-class="row modern"
              value="off"
              >
              <option value="on">Enable</option>
              <option value="off">Disable</option>
            </wc-input>
        </div>
      `;
      let markup = '';
      let src = '';

      if (record_id === 'create' || record_id === '') {
        src = `/v/${slug}/create`;
        markup = `${controls}
        <iframe class="preview"
                src=""
                style="height: calc(-360px + 100vh);"
                >
        </iframe>`;
      } else {
        src = `/v/${slug}/${record_id}`;
        markup = `${controls}
        <iframe class="preview"
                src=""
                style="height: calc(-360px + 100vh);"
                >
        </iframe>
      `.trim();
      }

      this.componentElement.addEventListener('load', (e) => {
        const previewFrame = this.querySelector('iframe.preview');
        const previewToggle = this.querySelector('wc[name="preview_toggle"]');
        const dragToggle = this.querySelector('wc[name="drag_toggle"]');
  
        previewToggle.addEventListener('change', (event) => {
          console.log('wc-template-preview:previewToggle change - ', event);
          previewFrame.src = src;
          previewFrame.reload();
        });
        dragToggle.addEventListener('change', (event) => {
          console.log('wc-template-preview:dragToggle change - ', event);
        });
  
      }, {once: true});

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
    }

    _unWireEvents() {
      super._unWireEvents();
    }

  }

  customElements.define('wc-template-preview', WcTemplatePreview);
}