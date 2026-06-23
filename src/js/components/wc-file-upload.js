/**
 *
 *  Name: wc-file-upload
 *  Usage:
 *    A form-associated file/image upload field. Drop or click to pick a file; it uploads
 *    (multipart) to a configurable endpoint and submits the returned URL as a normal named
 *    form value (FACE) — so the standard server save path stores the URL string under `name`
 *    with no special handling. Works out-of-the-box with the /upload → Cloudflare R2 endpoint.
 *
 *    <wc-file-upload
 *        name="document_url"
 *        value="{{ Record.document_url }}"
 *        lbl-label="Document"
 *        accept="image/*,application/pdf"
 *        max-size="10"                  <!-- MB -->
 *        upload-url="/upload"
 *        category="attachments"
 *        record-id="{{ RecordID }}"
 *        multiple
 *        required>
 *    </wc-file-upload>
 *
 *  Endpoint contract (POST multipart/form-data to `upload-url`):
 *    fields: file (required), category (default "attachments"), record_id (default "general")
 *    success → JSON { url, filename, originalName, contentType, size }; the component reads `url`.
 *    error   → non-200 JSON { error }; the message is surfaced and the field is left unset.
 *
 *  Value: single → the URL string; `multiple` → a JSON array of URL strings (submitted under `name`).
 *
 *  Attributes:
 *    name (required), value, lbl-label, accept, max-size (MB), upload-url (default /upload),
 *    category (default attachments), record-id (default general), multiple, required, disabled
 *
 *  Events (bubbling, composed):
 *    wcfileuploadchange — on add/remove; detail { value }  (legacy alias wc-file-upload:change)
 *
 *  htmx-safe: initializes on swap; re-seeds on value change. Composes wc-progress (upload bar)
 *  and wc-fa-icon. Styles in @layer wc.usage.
 */

import { WcBaseFormComponent } from './wc-base-form-component.js';

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|bmp|avif)(\?|#|$)/i;

class WcFileUpload extends WcBaseFormComponent {
  static get is() {
    return 'wc-file-upload';
  }

  static get observedAttributes() {
    return ['name', 'id', 'class', 'value', 'lbl-label', 'accept', 'max-size',
      'upload-url', 'category', 'record-id', 'multiple', 'required', 'disabled'];
  }

  constructor() {
    super();
    this._files = [];        // [{ url, name, type, size }]
    this._value = '';
    this._activeUploads = 0;

    this._onDropzoneClick = this._handleDropzoneClick.bind(this);
    this._onInputChange = this._handleInputChange.bind(this);
    this._onDragOver = (e) => { e.preventDefault(); this.dropzoneEl?.classList.add('drag-over'); };
    this._onDragLeave = () => this.dropzoneEl?.classList.remove('drag-over');
    this._onDrop = this._handleDrop.bind(this);
    this._onPreviewClick = this._handlePreviewClick.bind(this);

    const compEl = this.querySelector(':scope > .wc-file-upload');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-file-upload');
      this.appendChild(this.componentElement);
    }
  }

  async connectedCallback() {
    super.connectedCallback(); // renders skeleton, then calls our _wireEvents
    this._applyStyle();
    this._seedValue();
    this._updateValidity();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._unWireEvents();
  }

  // ---- Value contract (FACE) ------------------------------------------------

  get value() { return this._value; }
  set value(v) {
    this._seedFromValue(v);
    this._syncValue(false);
    this._renderPreviews();
  }

  get multiple() { return this.hasAttribute('multiple'); }

  // ---- Lifecycle ------------------------------------------------------------

  _render() {
    super._render();
    const built = this.componentElement.querySelector(':scope > .wc-file-upload-dropzone');
    if (!built) {
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
    }
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  _buildSkeleton() {
    const labelText = this.getAttribute('lbl-label') || '';
    if (labelText) {
      const lbl = document.createElement('label');
      lbl.textContent = labelText;
      this.componentElement.appendChild(lbl);
    }

    const dz = document.createElement('div');
    dz.classList.add('wc-file-upload-dropzone');
    dz.setAttribute('role', 'button');
    dz.tabIndex = 0;
    const accept = this.getAttribute('accept') || '';
    const maxSize = this.getAttribute('max-size') || '';
    dz.innerHTML = `
      <wc-fa-icon name="cloud-arrow-up" size="1.25rem"></wc-fa-icon>
      <div class="wc-file-upload-prompt">Drop a file or <span class="wc-file-upload-browse">browse</span></div>
      <div class="wc-file-upload-hint">${accept ? accept : 'Any file'}${maxSize ? ` · up to ${maxSize}MB` : ''}</div>
    `.trim();
    const input = document.createElement('input');
    input.type = 'file';
    input.classList.add('wc-file-upload-input');
    if (accept) input.accept = accept;
    if (this.multiple) input.multiple = true;
    // NB: intentionally NO `name` — the raw file is never submitted; only the FACE url value is.
    dz.appendChild(input);
    this.componentElement.appendChild(dz);
    this.dropzoneEl = dz;
    this.inputEl = input;

    const progress = document.createElement('wc-progress');
    progress.classList.add('wc-file-upload-progress');
    progress.setAttribute('percent', '0');
    progress.setAttribute('size', 'sm');
    progress.hidden = true;
    this.componentElement.appendChild(progress);
    this.progressEl = progress;

    const msg = document.createElement('div');
    msg.classList.add('wc-file-upload-message');
    msg.hidden = true;
    this.componentElement.appendChild(msg);
    this.messageEl = msg;

    const previews = document.createElement('div');
    previews.classList.add('wc-file-upload-previews');
    this.componentElement.appendChild(previews);
    this.previewsEl = previews;

    if (this.hasAttribute('disabled')) dz.classList.add('is-disabled');
  }

  // ---- Value seeding --------------------------------------------------------

  _seedValue() {
    const raw = this.getAttribute('value');
    if (raw) this._seedFromValue(raw);
    this._syncValue(false);
    this._renderPreviews();
  }

  _seedFromValue(raw) {
    this._files = [];
    if (raw == null || raw === '') return;
    let urls = [];
    if (this.multiple) {
      try {
        const parsed = JSON.parse(raw);
        urls = Array.isArray(parsed) ? parsed : (typeof parsed === 'string' ? [parsed] : []);
      } catch (ex) {
        urls = String(raw).split(',').map(s => s.trim()).filter(Boolean);
      }
    } else {
      urls = [String(raw)];
    }
    urls.filter(Boolean).forEach(url => this._files.push(this._fileFromUrl(String(url))));
  }

  _fileFromUrl(url) {
    let name = url;
    try { name = decodeURIComponent(url.split('/').pop().split('?')[0]) || url; } catch (ex) {}
    const isImage = IMAGE_EXT.test(url) || /^data:image\//i.test(url);
    return { url, name, type: isImage ? 'image/*' : '', size: null };
  }

  // ---- Upload ---------------------------------------------------------------

  _handleDropzoneClick(e) {
    if (this.hasAttribute('disabled')) return;
    if (e.target.closest('.wc-file-upload-input')) return;
    this.inputEl.click();
  }

  _handleInputChange() {
    if (this.inputEl.files && this.inputEl.files.length) {
      this._handleFiles(this.inputEl.files);
      this.inputEl.value = ''; // allow re-picking the same file
    }
  }

  _handleDrop(e) {
    e.preventDefault();
    this.dropzoneEl?.classList.remove('drag-over');
    if (this.hasAttribute('disabled')) return;
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length) this._handleFiles(files);
  }

  _handleFiles(fileList) {
    this._clearMessage();
    const files = Array.from(fileList);
    const toUpload = this.multiple ? files : files.slice(0, 1);
    if (!this.multiple) this._files = []; // single mode replaces

    for (const file of toUpload) {
      const err = this._validate(file);
      if (err) { this._showMessage(err); continue; }
      this._uploadFile(file);
    }
  }

  _validate(file) {
    const accept = this.getAttribute('accept');
    if (accept && !this._matchesAccept(file, accept)) {
      return `"${file.name}" is not an accepted type (${accept}).`;
    }
    const maxSize = parseFloat(this.getAttribute('max-size'));
    if (!isNaN(maxSize) && maxSize > 0 && file.size > maxSize * 1024 * 1024) {
      return `"${file.name}" exceeds the ${maxSize}MB limit.`;
    }
    return null;
  }

  _matchesAccept(file, accept) {
    const patterns = accept.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const type = (file.type || '').toLowerCase();
    const name = (file.name || '').toLowerCase();
    return patterns.some(p => {
      if (p.endsWith('/*')) return type.startsWith(p.slice(0, -1)); // image/* → "image/"
      if (p.startsWith('.')) return name.endsWith(p);
      return type === p;
    });
  }

  _uploadFile(file) {
    const url = this.getAttribute('upload-url') || '/upload';
    const fd = new FormData();
    fd.append('file', file);
    fd.append('category', this.getAttribute('category') || 'attachments');
    fd.append('record_id', this.getAttribute('record-id') || 'general');

    const xhr = new XMLHttpRequest();
    this._activeUploads++;
    this._showProgress(0);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) this._showProgress((e.loaded / e.total) * 100);
    });
    xhr.addEventListener('load', () => {
      this._activeUploads = Math.max(0, this._activeUploads - 1);
      let data = {};
      try { data = JSON.parse(xhr.responseText); } catch (ex) {}
      if (xhr.status >= 200 && xhr.status < 300 && data && data.url) {
        this._files.push({
          url: data.url,
          name: data.originalName || data.filename || this._fileFromUrl(data.url).name,
          type: data.contentType || file.type || '',
          size: data.size != null ? data.size : file.size
        });
        this._syncValue(true);
        this._renderPreviews();
      } else {
        this._showMessage((data && data.error) ? data.error : `Upload failed (${xhr.status}).`);
      }
      if (this._activeUploads === 0) this._hideProgress();
    });
    xhr.addEventListener('error', () => {
      this._activeUploads = Math.max(0, this._activeUploads - 1);
      this._showMessage('Upload failed — network error.');
      if (this._activeUploads === 0) this._hideProgress();
    });

    xhr.open('POST', url);
    xhr.send(fd);
  }

  // ---- Value sync -----------------------------------------------------------

  _syncValue(emit) {
    if (this.multiple) {
      this._value = this._files.length ? JSON.stringify(this._files.map(f => f.url)) : '';
    } else {
      this._value = this._files.length ? this._files[0].url : '';
    }
    this._internals.setFormValue(this._value);
    this._updateValidity();
    if (emit) {
      this._emitEvent('wcfileuploadchange', 'wc-file-upload:change', {
        bubbles: true, composed: true, detail: { value: this._value }
      });
    }
  }

  _updateValidity() {
    if (this.hasAttribute('required') && !this._files.length) {
      this._internals.setValidity({ valueMissing: true }, 'Please add a file.', this.dropzoneEl || this);
    } else {
      this._internals.setValidity({});
    }
  }

  // ---- Preview --------------------------------------------------------------

  _renderPreviews() {
    if (!this.previewsEl) return;
    this.previewsEl.innerHTML = '';
    this._files.forEach((f, idx) => {
      const item = document.createElement('div');
      item.classList.add('wc-file-upload-item');
      item.dataset.index = idx;

      const isImage = (f.type && f.type.startsWith('image/')) || IMAGE_EXT.test(f.url);
      if (isImage) {
        const img = document.createElement('img');
        img.classList.add('wc-file-upload-thumb');
        img.src = f.url;
        img.alt = f.name;
        img.loading = 'lazy';
        item.appendChild(img);
      } else {
        const icon = document.createElement('wc-fa-icon');
        icon.setAttribute('name', 'file');
        icon.setAttribute('size', '1rem');
        icon.classList.add('wc-file-upload-fileicon');
        item.appendChild(icon);
      }

      const meta = document.createElement('div');
      meta.classList.add('wc-file-upload-itemmeta');
      const link = document.createElement('a');
      link.classList.add('wc-file-upload-itemname');
      link.href = f.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = f.name;
      meta.appendChild(link);
      if (f.size != null) {
        const size = document.createElement('span');
        size.classList.add('wc-file-upload-itemsize', 'badge', 'badge-muted');
        size.textContent = this._formatSize(f.size);
        meta.appendChild(size);
      }
      item.appendChild(meta);

      if (!this.hasAttribute('disabled')) {
        const rm = document.createElement('button');
        rm.type = 'button';
        rm.classList.add('wc-file-upload-remove', 'btn', 'btn-sm');
        rm.setAttribute('aria-label', 'Remove file');
        rm.innerHTML = '&times;';
        item.appendChild(rm);
      }
      this.previewsEl.appendChild(item);
    });
  }

  _handlePreviewClick(e) {
    const rm = e.target.closest('.wc-file-upload-remove');
    if (!rm) return;
    e.preventDefault();
    const item = rm.closest('.wc-file-upload-item');
    const idx = parseInt(item.dataset.index, 10);
    if (idx >= 0) {
      this._files.splice(idx, 1);
      this._syncValue(true);
      this._renderPreviews();
    }
  }

  _formatSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // ---- Progress / messages --------------------------------------------------

  _showProgress(pct) {
    if (!this.progressEl) return;
    this.progressEl.hidden = false;
    this.progressEl.setAttribute('percent', String(Math.round(pct)));
  }
  _hideProgress() {
    if (this.progressEl) { this.progressEl.hidden = true; this.progressEl.setAttribute('percent', '0'); }
  }
  _showMessage(msg) {
    if (!this.messageEl) return;
    this.messageEl.textContent = msg;
    this.messageEl.hidden = false;
  }
  _clearMessage() {
    if (this.messageEl) { this.messageEl.textContent = ''; this.messageEl.hidden = true; }
  }

  // ---- Wiring ---------------------------------------------------------------

  _wireEvents() {
    // The base would treat our file <input> as the form value source — null it so it doesn't,
    // and so base _handleInputChange (which would set value = "C:\fakepath") never fires.
    this.formElement = null;
    super._wireEvents();
    if (!this.dropzoneEl) return;
    this.dropzoneEl.removeEventListener('click', this._onDropzoneClick);
    this.dropzoneEl.addEventListener('click', this._onDropzoneClick);
    this.dropzoneEl.removeEventListener('dragover', this._onDragOver);
    this.dropzoneEl.addEventListener('dragover', this._onDragOver);
    this.dropzoneEl.removeEventListener('dragleave', this._onDragLeave);
    this.dropzoneEl.addEventListener('dragleave', this._onDragLeave);
    this.dropzoneEl.removeEventListener('drop', this._onDrop);
    this.dropzoneEl.addEventListener('drop', this._onDrop);
    this.inputEl.removeEventListener('change', this._onInputChange);
    this.inputEl.addEventListener('change', this._onInputChange);
    this.previewsEl.removeEventListener('click', this._onPreviewClick);
    this.previewsEl.addEventListener('click', this._onPreviewClick);
  }

  _unWireEvents() {
    super._unWireEvents();
    if (this.dropzoneEl) {
      this.dropzoneEl.removeEventListener('click', this._onDropzoneClick);
      this.dropzoneEl.removeEventListener('dragover', this._onDragOver);
      this.dropzoneEl.removeEventListener('dragleave', this._onDragLeave);
      this.dropzoneEl.removeEventListener('drop', this._onDrop);
    }
    if (this.inputEl) this.inputEl.removeEventListener('change', this._onInputChange);
    if (this.previewsEl) this.previewsEl.removeEventListener('click', this._onPreviewClick);
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'value') {
      this._seedFromValue(newValue);
      this._syncValue(false);
      this._renderPreviews();
      return;
    }
    if (attrName === 'required') { this._updateValidity(); return; }
    if (['accept', 'max-size', 'multiple', 'lbl-label', 'disabled'].includes(attrName)) {
      // Rebuild skeleton (accept/multiple affect the input), preserving current files.
      const files = this._files.slice();
      this.componentElement.innerHTML = '';
      this._buildSkeleton();
      this._wireEvents();
      this._files = files;
      this._renderPreviews();
      return;
    }
    if (attrName === 'class') { super._handleAttributeChange(attrName, newValue); return; }
    if (['name', 'id'].includes(attrName)) { super._handleAttributeChange(attrName, newValue); return; }
    super._handleAttributeChange(attrName, newValue);
  }

  _applyStyle() {
    const style = `
      wc-file-upload { display: contents; }

      @layer wc.usage {
        .wc-file-upload { display: flex; flex-direction: column; gap: 0.375rem; width: 100%; }
        .wc-file-upload > label { font-weight: 500; }
        .wc-file-upload-dropzone {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
          padding: 1.25rem 1rem;
          text-align: center;
          color: var(--text-2, var(--component-alt-color));
          background-color: var(--surface-3);
          border: 2px dashed var(--surface-4);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: border-color 0.15s, background-color 0.15s;
        }
        .wc-file-upload-dropzone:hover,
        .wc-file-upload-dropzone:focus-visible {
          border-color: var(--primary-bg-color);
          outline: none;
        }
        .wc-file-upload-dropzone.drag-over {
          border-color: var(--primary-bg-color);
          background-color: color-mix(in oklab, var(--primary-bg-color) 12%, var(--surface-3));
        }
        .wc-file-upload-dropzone.is-disabled { opacity: 0.6; cursor: not-allowed; }
        .wc-file-upload-input { display: none; }
        .wc-file-upload-browse { color: var(--primary-bg-color); text-decoration: underline; }
        .wc-file-upload-hint { font-size: 0.72rem; opacity: 0.8; }
        .wc-file-upload-progress { width: 100%; }
        .wc-file-upload-message {
          font-size: 0.8rem;
          color: var(--danger-color, #ef4444);
        }
        .wc-file-upload-previews { display: flex; flex-direction: column; gap: 0.375rem; }
        .wc-file-upload-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.375rem 0.5rem;
          background-color: var(--surface-2);
          border: 1px solid var(--surface-4);
          border-radius: 0.375rem;
        }
        .wc-file-upload-thumb {
          width: 40px; height: 40px;
          object-fit: cover;
          border-radius: 0.25rem;
          flex: 0 0 auto;
        }
        .wc-file-upload-fileicon {
          width: 40px; height: 40px;
          display: flex; align-items: center; justify-content: center;
          background-color: var(--surface-3);
          border-radius: 0.25rem;
          flex: 0 0 auto;
        }
        .wc-file-upload-itemmeta {
          display: flex; flex-direction: column; gap: 0.125rem;
          min-width: 0; flex: 1 1 auto;
        }
        .wc-file-upload-itemname {
          color: var(--text-1);
          font-size: 0.85rem;
          overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
        }
        .wc-file-upload-itemsize { align-self: flex-start; }
        .wc-file-upload-remove {
          flex: 0 0 auto;
          line-height: 1;
          padding: 0.125rem 0.5rem;
          font-size: 1rem;
        }
        wc-file-upload[required] .wc-file-upload > label::after { content: ' *'; font-weight: bold; }
      }
    `.trim();
    this.loadStyle('wc-file-upload-style', style);
  }
}

customElements.define(WcFileUpload.is, WcFileUpload);
export { WcFileUpload };
