/**
 *  Name: wc-checkin
 *  Usage:
 *    <wc-checkin mode="in" scan-source="both" endpoint="/x/checkin"
 *                event-id="EVT-1" session-id="SES-1" csrf="{{CSRFToken}}"></wc-checkin>
 *
 *    <wc-checkin mode="out" scan-source="usb" endpoint="/x/checkin"
 *                event-id="EVT-1" allow-override></wc-checkin>
 *
 *  Description:
 *    A touch-friendly check-in / check-out surface for a staffed station (tablet).
 *    It captures a scanned code (USB keyboard-wedge scanner and/or camera), POSTs it to a
 *    server endpoint, and renders the server's allow/deny result in big, glanceable states.
 *
 *    THE COMPONENT NEVER DECIDES ALLOW/DENY — the server is authoritative. It only displays
 *    what the server returns, never caches or infers authorization, and never receives the
 *    authorized barcodes (only display names + a yes/no). It also orchestrates the two-step
 *    check-out (identify the child, then authorize a pickup).
 *
 *    Fail-safe: on any network/parse error it shows an ERROR state and never shows ALLOWED.
 *
 *  Attributes (observed):
 *    - mode          : "in" (default) | "out"
 *    - scan-source   : "usb" (default) | "camera" | "both"
 *    - endpoint      : server URL to POST to (e.g. /x/checkin)
 *    - event-id      : passed through on every request
 *    - session-id    : passed through on every request
 *    - csrf          : CSRF token — sent as the X-CSRF-Token header AND csrf_token in the body
 *    - allow-override: boolean; show an admin "Override" action on a denied check-out
 *                      (only when the server response also carries override_allowed:true)
 *    - beep          : boolean (default true; beep="false" disables) — short success/fail tone
 *
 *  Request body (JSON, POSTed on each scan):
 *    { mode, scanned_barcode, event_id, session_id, step, attendee_id?, csrf_token?, override? }
 *    step is "identify" on the first scan and "authorize" on the check-out pickup scan.
 *
 *  Response (rendered as-is; the server decides):
 *    { allowed, reason, attendee:{id,name,photo?}, authorized_names?,
 *      requires_pickup_scan?, recorded_id?, override_allowed? }
 *
 *  Events (CustomEvent, bubbles+composed, fired on the element AND on document):
 *    - wccheckinscanned / checkin:scanned  — detail { code, source, step }
 *    - wccheckinresult  / checkin:result   — detail is the full server response
 *    - wccheckinerror   / checkin:error    — detail { message }
 *
 *  Integration hook (optional): set `el.requestHandler = async (payload) => response` to route
 *    the POST through your own client instead of the built-in fetch (used by the demo + tests).
 *    It does not change the contract — the handler's response is still authoritative.
 *
 *  Note on camera decoding: prefers the browser's native BarcodeDetector API (QR + 1-D,
 *    zero load — Chromium/Android). Browsers without it (Safari/Firefox) fall back to a
 *    lazily-loaded ZXing decoder so the camera works everywhere; ZXing is loaded through
 *    Wave's shared loader, so WaveAssetBase self-hosting + CDN fallback apply (it is only
 *    fetched the first time a fallback browser opens the camera). If neither is available
 *    (e.g. offline with no mirror), the camera control shows a "use a USB scanner" message —
 *    the USB path is always available.
 */

import { WcBaseComponent } from './wc-base-component.js';

// Offline fallback decoder for browsers without the native BarcodeDetector API.
// Loaded via the shared loader → WaveAssetBase self-hosting mirror folder is
// "@zxing/library-0.21.3/umd/index.min.js" (falls back to this CDN url).
const ZXING_URL = 'https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js';

if (!customElements.get('wc-checkin')) {
  class WcCheckin extends WcBaseComponent {
    static get observedAttributes() {
      return ['mode', 'scan-source', 'endpoint', 'event-id', 'session-id', 'csrf', 'allow-override', 'beep', 'class'];
    }

    constructor() {
      super();
      // Don't append children in the constructor — that throws "must not have children"
      // when the element is created via document.createElement. Append on connect.
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-checkin');

      // Scan state
      this._state = 'idle';            // idle | scanning | result | pickup | camera | error
      this._awaitPickup = false;       // two-step check-out: waiting for the pickup scan
      this._attendee = null;           // the identified child (for the authorize step)
      this._lastPayload = null;        // last request (for override re-post)
      this._resetTimer = null;

      // USB keyboard-wedge buffer
      this._buf = '';
      this._lastKeyTime = 0;
      this._MAX_INTERKEY = 60;         // ms — a longer gap means human typing (resets the buffer)
      this._MIN_LEN = 3;               // a scan must be at least this many chars

      // Camera
      this._stream = null;
      this._detector = null;
      this._rafId = 0;
      this._zxingReader = null;   // fallback decoder (lazy)
      this._frameCanvas = null;   // offscreen canvas for the fallback decode

      this._onKeydown = this._handleKeydown.bind(this);
      this._onClick = this._handleClick.bind(this);
    }

    connectedCallback() {
      const existing = this.querySelector(':scope > .wc-checkin');
      if (existing) this.componentElement = existing;
      else if (!this.contains(this.componentElement)) this.appendChild(this.componentElement);
      super.connectedCallback();
      this._applyStyle();
      this._wireEvents();
      this._renderIdle();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unWireEvents();
      this._stopCamera();
      if (this._resetTimer) clearTimeout(this._resetTimer);
    }

    _render() {
      super._render();
      if (typeof htmx !== 'undefined') htmx.process(this);
    }

    // ---- Config getters -------------------------------------------------------

    get mode() {
      return (this.getAttribute('mode') || 'in').toLowerCase() === 'out' ? 'out' : 'in';
    }
    get scanSource() {
      const s = (this.getAttribute('scan-source') || 'usb').toLowerCase();
      return ['usb', 'camera', 'both'].includes(s) ? s : 'usb';
    }
    get usesUsb() { return this.scanSource === 'usb' || this.scanSource === 'both'; }
    get usesCamera() { return this.scanSource === 'camera' || this.scanSource === 'both'; }
    get beepEnabled() { return this.getAttribute('beep') !== 'false'; }
    get canOverride() { return this.hasAttribute('allow-override'); }

    // ---- Events ---------------------------------------------------------------

    _emit(newName, legacyName, detail) {
      this._emitEvent(newName, legacyName, { bubbles: true, composed: true, detail }, document);
    }

    // ---- Scan capture: USB keyboard-wedge -------------------------------------

    _handleKeydown(e) {
      if (!this.usesUsb) return;
      // Ignore modifier combos.
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      const gap = now - this._lastKeyTime;

      if (e.key === 'Enter') {
        // A rapid burst terminated by Enter is a scan.
        const code = this._buf.trim();
        this._buf = '';
        if (code.length >= this._MIN_LEN) {
          e.preventDefault();
          this._handleScan(code, 'usb');
        }
        return;
      }

      // Only accumulate single printable characters.
      if (e.key.length === 1) {
        // A slow keystroke (human typing) restarts the buffer, so normal typing
        // never accumulates into a false scan.
        if (gap > this._MAX_INTERKEY) this._buf = '';
        this._buf += e.key;
        this._lastKeyTime = now;
      }
    }

    // ---- Scan capture: camera (native BarcodeDetector) ------------------------

    async _startCamera() {
      const native = ('BarcodeDetector' in window);
      // Browsers without BarcodeDetector (Safari/Firefox): lazily load the ZXing fallback.
      if (!native) {
        try {
          await this._loadZxing();
        } catch (_) {
          this._renderCameraUnsupported();
          return;
        }
      }
      this._renderCamera();
      try {
        if (native && !this._detector) this._detector = new window.BarcodeDetector();
        this._stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, audio: false
        });
        const video = this.componentElement.querySelector('.ci-video');
        if (!video) { this._stopCamera(); return; }
        video.srcObject = this._stream;
        await video.play();
        this._scanLoop(video, native);
      } catch (err) {
        this._stopCamera();
        this._fail('Camera unavailable — ' + (err && err.message ? err.message : 'access denied'));
      }
    }

    _loadZxing() {
      if (window.ZXing && window.ZXing.MultiFormatReader) return Promise.resolve();
      return this.loadLibrary(ZXING_URL, 'ZXing');
    }

    _scanLoop(video, native) {
      const tick = async () => {
        if (!this._stream) return;
        try {
          let value = null;
          if (native) {
            const codes = await this._detector.detect(video);
            if (codes && codes.length) value = codes[0].rawValue;
          } else {
            value = this._zxingDecodeFrame(video);
          }
          if (value) {
            this._stopCamera();
            this._handleScan(value, 'camera');
            return;
          }
        } catch (_) { /* transient decode error / no code this frame — keep scanning */ }
        this._rafId = requestAnimationFrame(tick);
      };
      this._rafId = requestAnimationFrame(tick);
    }

    // Fallback: draw the current video frame to an offscreen canvas and decode with ZXing.
    _zxingDecodeFrame(video) {
      const w = video.videoWidth, h = video.videoHeight;
      if (!w || !h) return null;
      const cv = this._frameCanvas || (this._frameCanvas = document.createElement('canvas'));
      cv.width = w; cv.height = h;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(video, 0, 0, w, h);
      return this._zxingDecode(cv);
    }

    // Decode a canvas with ZXing core (QR + common 1-D formats). Returns the text or null.
    _zxingDecode(canvas) {
      const Z = window.ZXing;
      if (!Z || !Z.MultiFormatReader) return null;
      if (!this._zxingReader) {
        this._zxingReader = new Z.MultiFormatReader();
        const hints = new Map();
        hints.set(Z.DecodeHintType.POSSIBLE_FORMATS, [
          Z.BarcodeFormat.QR_CODE, Z.BarcodeFormat.CODE_128, Z.BarcodeFormat.CODE_39,
          Z.BarcodeFormat.EAN_13, Z.BarcodeFormat.EAN_8, Z.BarcodeFormat.UPC_A,
          Z.BarcodeFormat.UPC_E, Z.BarcodeFormat.ITF, Z.BarcodeFormat.CODABAR
        ]);
        hints.set(Z.DecodeHintType.TRY_HARDER, true);
        this._zxingReader.setHints(hints);
      }
      try {
        const src = new Z.HTMLCanvasElementLuminanceSource(canvas);
        const bmp = new Z.BinaryBitmap(new Z.HybridBinarizer(src));
        const result = this._zxingReader.decode(bmp);
        return result && result.getText ? result.getText() : null;
      } catch (_) {
        // NotFoundException on a frame with no code is expected — keep scanning.
        return null;
      }
    }

    _stopCamera() {
      if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = 0; }
      if (this._stream) {
        this._stream.getTracks().forEach(t => t.stop());
        this._stream = null;
      }
    }

    // ---- Server round-trip ----------------------------------------------------

    _handleScan(code, source) {
      if (!code) return;
      if (this._state === 'scanning') return; // one in-flight request at a time
      const step = (this.mode === 'out' && this._awaitPickup) ? 'authorize' : 'identify';
      this._emit('wccheckinscanned', 'checkin:scanned', { code, source, step });

      const payload = {
        mode: this.mode,
        scanned_barcode: code,
        event_id: this.getAttribute('event-id') || '',
        session_id: this.getAttribute('session-id') || '',
        step
      };
      if (step === 'authorize' && this._attendee) payload.attendee_id = this._attendee.id;
      const csrf = this.getAttribute('csrf');
      if (csrf) payload.csrf_token = csrf;

      this._lastPayload = payload;
      this._post(payload);
    }

    async _post(payload) {
      this._renderScanning();
      let res;
      try {
        if (typeof this.requestHandler === 'function') {
          res = await this.requestHandler(payload);
        } else {
          const endpoint = this.getAttribute('endpoint');
          if (!endpoint) throw new Error('No endpoint configured');
          const headers = { 'Content-Type': 'application/json' };
          const csrf = this.getAttribute('csrf');
          if (csrf) headers['X-CSRF-Token'] = csrf;
          const r = await fetch(endpoint, {
            method: 'POST',
            headers,
            credentials: 'same-origin',
            body: JSON.stringify(payload)
          });
          if (!r.ok) throw new Error(`Server error (${r.status})`);
          res = await r.json();
        }
      } catch (err) {
        // Fail safe — never render ALLOWED on error.
        this._fail(err && err.message ? err.message : 'Network error');
        return;
      }
      this._handleResult(res || {}, payload);
    }

    _handleResult(res, payload) {
      this._emit('wccheckinresult', 'checkin:result', res);

      // Two-step check-out: first scan identifies the child and asks for a pickup scan.
      if (this.mode === 'out' && payload.step === 'identify' && res.requires_pickup_scan) {
        this._attendee = res.attendee || null;
        this._awaitPickup = true;
        this._renderPickup(res);
        return;
      }

      // Terminal result.
      this._awaitPickup = false;
      this._beep(!!res.allowed);
      this._renderResult(res, payload);
    }

    _fail(message) {
      this._emit('wccheckinerror', 'checkin:error', { message });
      this._beep(false);
      this._awaitPickup = false;
      this._renderError(message);
    }

    _override() {
      if (!this._lastPayload) return;
      const payload = { ...this._lastPayload, step: 'authorize', override: true };
      this._lastPayload = payload;
      this._post(payload);
    }

    // ---- Success / fail tone (WebAudio, no asset) -----------------------------

    _beep(ok) {
      if (!this.beepEnabled) return;
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;
        this._audio = this._audio || new Ctx();
        const ctx = this._audio;
        if (ctx.state === 'suspended') ctx.resume();
        const now = ctx.currentTime;
        const tones = ok ? [880, 1320] : [200];
        tones.forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = ok ? 'sine' : 'square';
          osc.frequency.value = f;
          const t = now + i * 0.12;
          gain.gain.setValueAtTime(0.0001, t);
          gain.gain.exponentialRampToValueAtTime(0.2, t + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
          osc.connect(gain).connect(ctx.destination);
          osc.start(t);
          osc.stop(t + 0.12);
        });
      } catch (_) { /* audio best-effort */ }
    }

    // ---- Rendering ------------------------------------------------------------

    _escape(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    _setStage(state, html) {
      this._state = state;
      const el = this.componentElement;
      el.className = `wc-checkin state-${state} mode-${this.mode}`;
      el.innerHTML = html;
      this.setAttribute('role', 'group');
      this.setAttribute('aria-label', this.mode === 'out' ? 'Check-out station' : 'Check-in station');
    }

    _cameraButton() {
      if (!this.usesCamera) return '';
      return `<button type="button" class="ci-btn ci-btn-ghost" data-ci="camera-start">
        <span class="ci-cam-ico" aria-hidden="true">📷</span> Use camera
      </button>`;
    }

    _attendeeCard(attendee) {
      if (!attendee) return '';
      const name = this._escape(attendee.name || '');
      const id = this._escape(attendee.id || '');
      const initials = (attendee.name || '?').trim().split(/\s+/).map(w => w[0] || '')
        .slice(0, 2).join('').toUpperCase();
      const avatar = attendee.photo
        ? `<img class="ci-photo" src="${this._escape(attendee.photo)}" alt="">`
        : `<div class="ci-photo ci-photo-initials" aria-hidden="true">${this._escape(initials)}</div>`;
      return `<div class="ci-attendee">
        ${avatar}
        <div class="ci-attendee-text">
          <div class="ci-name">${name}</div>
          ${id ? `<div class="ci-id">${id}</div>` : ''}
        </div>
      </div>`;
    }

    _renderIdle() {
      this._stopCamera();
      this._awaitPickup = false;
      this._attendee = null;
      const title = this.mode === 'out' ? 'Scan a wristband to check out' : 'Scan a wristband';
      this._setStage('idle', `
        <div class="ci-panel">
          <div class="ci-scanmark" aria-hidden="true">
            <svg viewBox="0 0 48 48" width="56" height="56" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
              <path d="M6 16V9a3 3 0 0 1 3-3h7M42 16V9a3 3 0 0 0-3-3h-7M6 32v7a3 3 0 0 0 3 3h7M42 32v7a3 3 0 0 1-3 3h-7"/>
              <line x1="4" y1="24" x2="44" y2="24" stroke-width="4"/>
            </svg>
          </div>
          <div class="ci-title" role="status" aria-live="polite">${this._escape(title)}</div>
          <div class="ci-sub">${this.mode === 'out' ? 'Check-out' : 'Check-in'} station</div>
          ${this._cameraButton()}
        </div>`);
    }

    _renderScanning() {
      this._setStage('scanning', `
        <div class="ci-panel">
          <div class="ci-spinner" aria-hidden="true"></div>
          <div class="ci-title" role="status" aria-live="polite">Checking…</div>
        </div>`);
    }

    _renderResult(res, payload) {
      const allowed = !!res.allowed;
      const verdict = allowed ? 'ALLOWED' : 'DENIED';
      const reason = res.reason ? `<div class="ci-reason">${this._escape(res.reason)}</div>` : '';

      // matched pickup + released confirmation on an allowed check-out authorize
      let extra = '';
      if (allowed && this.mode === 'out' && payload && payload.step === 'authorize') {
        extra = `<div class="ci-released">Released</div>`;
      }

      let override = '';
      if (!allowed && this.mode === 'out' && this.canOverride && res.override_allowed) {
        override = `<button type="button" class="ci-btn ci-btn-warn" data-ci="override">Override</button>`;
      }

      this._setStage('result', `
        <div class="ci-panel ci-${allowed ? 'allow' : 'deny'}">
          <div class="ci-verdict" role="status" aria-live="assertive">${verdict}</div>
          ${this._attendeeCard(res.attendee)}
          ${extra}
          ${reason}
          <div class="ci-actions">
            ${override}
            <button type="button" class="ci-btn ci-btn-primary" data-ci="next">Next</button>
          </div>
        </div>`);

      // Auto-reset for the next attendee.
      this._scheduleReset(allowed ? 4000 : 6000);
    }

    _renderError(message) {
      this._setStage('error', `
        <div class="ci-panel ci-error">
          <div class="ci-verdict" role="alert" aria-live="assertive">ERROR</div>
          <div class="ci-reason">${this._escape(message)}</div>
          <div class="ci-actions">
            <button type="button" class="ci-btn ci-btn-primary" data-ci="next">Try again</button>
          </div>
        </div>`);
    }

    _renderCamera() {
      this._setStage('camera', `
        <div class="ci-panel ci-camera">
          <div class="ci-videowrap">
            <video class="ci-video" playsinline muted></video>
            <div class="ci-reticle" aria-hidden="true"></div>
          </div>
          <div class="ci-title" role="status" aria-live="polite">Point the camera at the code</div>
          <div class="ci-actions">
            <button type="button" class="ci-btn ci-btn-cancel" data-ci="camera-stop">Stop camera</button>
          </div>
        </div>`);
    }

    _renderCameraUnsupported() {
      this._setStage('idle', `
        <div class="ci-panel">
          <div class="ci-title">Camera scanning isn't available.</div>
          <div class="ci-sub">Use a USB barcode scanner at this station.</div>
          <div class="ci-actions">
            <button type="button" class="ci-btn ci-btn-primary" data-ci="next">OK</button>
          </div>
        </div>`);
    }

    _scheduleReset(ms) {
      if (this._resetTimer) clearTimeout(this._resetTimer);
      this._resetTimer = setTimeout(() => this._renderIdle(), ms);
    }

    // ---- Click delegation -----------------------------------------------------

    _handleClick(e) {
      const btn = e.target.closest('[data-ci]');
      if (!btn || !this.componentElement.contains(btn)) return;
      const action = btn.getAttribute('data-ci');
      if (this._resetTimer) { clearTimeout(this._resetTimer); this._resetTimer = null; }
      switch (action) {
        case 'next': this._renderIdle(); break;
        case 'cancel': this._renderIdle(); break;
        case 'override': this._override(); break;
        case 'camera-start': this._startCamera(); break;
        case 'camera-stop': this._stopCamera(); this._awaitPickup ? this._renderPickupPrompt() : this._renderIdle(); break;
      }
    }

    // Re-show the pickup prompt after stopping the camera mid-checkout.
    _renderPickupPrompt() {
      this._renderPickup({ attendee: this._attendee, authorized_names: this._lastAuthNames || [] });
    }

    // ---- Wiring ---------------------------------------------------------------

    _wireEvents() {
      super._wireEvents();
      document.addEventListener('keydown', this._onKeydown, true);
      this.componentElement.addEventListener('click', this._onClick);
    }

    _unWireEvents() {
      super._unWireEvents();
      document.removeEventListener('keydown', this._onKeydown, true);
      if (this.componentElement) this.componentElement.removeEventListener('click', this._onClick);
    }

    _handleAttributeChange(attrName, newValue, oldValue) {
      if (attrName === 'class') { super._handleAttributeChange(attrName, newValue, oldValue); return; }
      if (['mode', 'scan-source'].includes(attrName)) {
        // A mode/source switch resets the surface to a clean idle state.
        if (this._isConnected) this._renderIdle();
        return;
      }
      // endpoint / event-id / session-id / csrf / allow-override / beep are read live — no re-render.
    }

    // Keep the authorized names around so a camera detour can restore the pickup prompt.
    _renderPickup(res) {
      this._lastAuthNames = Array.isArray(res.authorized_names) ? res.authorized_names : [];
      const names = this._lastAuthNames;
      const list = names.length
        ? `<ul class="ci-authlist">${names.map(n => `<li>${this._escape(n)}</li>`).join('')}</ul>`
        : `<div class="ci-sub">No authorized pickups on file.</div>`;
      this._setStage('pickup', `
        <div class="ci-panel ci-pickup">
          ${this._attendeeCard(res.attendee)}
          <div class="ci-authhead">Authorized pickups</div>
          ${list}
          <div class="ci-prompt" role="status" aria-live="polite">Scan an authorized pickup</div>
          <div class="ci-actions">
            ${this.usesCamera ? `<button type="button" class="ci-btn ci-btn-ghost" data-ci="camera-start"><span aria-hidden="true">📷</span> Use camera</button>` : ''}
            <button type="button" class="ci-btn ci-btn-cancel" data-ci="cancel">Cancel</button>
          </div>
        </div>`);
    }

    _applyStyle() {
      const style = `
        wc-checkin { display: contents; }

        @layer wc.usage {
          .wc-checkin {
            display: flex;
            flex-direction: column;
            align-items: stretch;
            min-height: 20rem;
            border: 1px solid var(--card-border-color, var(--surface-4));
            border-radius: 0.75rem;
            background: var(--card-bg-color, var(--surface-1));
            color: var(--text-1);
            overflow: hidden;
            --ci-accent: var(--primary-bg-color);
          }
          .wc-checkin .ci-panel {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 0.75rem;
            text-align: center;
            padding: 2rem 1.5rem;
          }
          .wc-checkin.state-result .ci-panel,
          .wc-checkin.state-error .ci-panel { padding-top: 2.5rem; }

          .wc-checkin .ci-scanmark { color: var(--ci-accent); opacity: 0.85; }
          .wc-checkin .ci-title { font-size: 1.5rem; font-weight: 600; line-height: 1.2; }
          .wc-checkin .ci-sub { font-size: 0.95rem; color: var(--text-2, var(--text-1)); opacity: 0.8; }

          /* Big glanceable verdict */
          .wc-checkin .ci-verdict {
            font-size: clamp(2.25rem, 8vw, 3.5rem);
            font-weight: 800;
            letter-spacing: 0.05em;
            line-height: 1;
          }
          .wc-checkin .ci-panel.ci-allow { --ci-tone: var(--success-color, #22c55e); }
          .wc-checkin .ci-panel.ci-deny,
          .wc-checkin .ci-panel.ci-error { --ci-tone: var(--danger-color, #ef4444); }
          .wc-checkin .ci-panel.ci-allow .ci-verdict,
          .wc-checkin .ci-panel.ci-deny .ci-verdict,
          .wc-checkin .ci-panel.ci-error .ci-verdict { color: var(--ci-tone); }
          .wc-checkin.state-result,
          .wc-checkin.state-error { border-width: 2px; }
          .wc-checkin.state-result .ci-panel.ci-allow,
          .wc-checkin.state-result .ci-panel.ci-deny,
          .wc-checkin.state-error .ci-panel.ci-error {
            box-shadow: inset 0 0 0 9999px color-mix(in srgb, var(--ci-tone) 8%, transparent);
          }

          .wc-checkin .ci-released {
            font-size: 1.1rem; font-weight: 700;
            color: var(--success-color, #22c55e);
            text-transform: uppercase; letter-spacing: 0.08em;
          }
          .wc-checkin .ci-reason { font-size: 1.05rem; max-width: 28rem; }

          /* Attendee card */
          .wc-checkin .ci-attendee {
            display: flex; align-items: center; gap: 0.875rem;
            padding: 0.75rem 1rem;
            background: var(--surface-2);
            border-radius: 0.625rem;
          }
          .wc-checkin .ci-photo {
            width: 3.5rem; height: 3.5rem; flex: 0 0 auto;
            border-radius: 50%; object-fit: cover;
            background: var(--surface-3);
          }
          .wc-checkin .ci-photo-initials {
            display: flex; align-items: center; justify-content: center;
            font-weight: 700; font-size: 1.25rem; color: var(--text-1);
          }
          .wc-checkin .ci-attendee-text { text-align: left; }
          .wc-checkin .ci-name { font-size: 1.25rem; font-weight: 600; }
          .wc-checkin .ci-id { font-size: 0.85rem; opacity: 0.7; font-family: ui-monospace, Menlo, monospace; }

          /* Pickup list */
          .wc-checkin .ci-authhead { font-weight: 600; margin-top: 0.25rem; }
          .wc-checkin .ci-authlist {
            list-style: none; margin: 0; padding: 0;
            display: flex; flex-wrap: wrap; gap: 0.375rem; justify-content: center;
          }
          .wc-checkin .ci-authlist li {
            padding: 0.25rem 0.75rem;
            background: var(--surface-2);
            border-radius: 999px;
            font-size: 0.95rem;
          }
          .wc-checkin .ci-prompt {
            margin-top: 0.5rem;
            font-size: 1.25rem; font-weight: 600;
            color: var(--ci-accent);
          }

          /* Buttons — large tap targets */
          .wc-checkin .ci-actions { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; margin-top: 0.5rem; }
          .wc-checkin .ci-btn {
            min-height: 3rem;
            padding: 0.75rem 1.75rem;
            font-size: 1.05rem; font-weight: 600;
            border: 1px solid transparent;
            border-radius: 0.5rem;
            cursor: pointer;
            background: var(--surface-3);
            color: var(--text-1);
          }
          .wc-checkin .ci-btn:focus-visible { outline: 2px solid var(--ci-accent); outline-offset: 2px; }
          .wc-checkin .ci-btn-primary { background: var(--ci-accent); color: var(--primary-color, #fff); }
          .wc-checkin .ci-btn-ghost { background: transparent; border-color: var(--surface-4); }
          .wc-checkin .ci-btn-cancel { background: transparent; border-color: var(--surface-4); }
          .wc-checkin .ci-btn-warn { background: var(--warning-color, #f59e0b); color: #1a1a1a; }

          /* Spinner */
          .wc-checkin .ci-spinner {
            width: 3rem; height: 3rem;
            border: 4px solid var(--surface-3);
            border-top-color: var(--ci-accent);
            border-radius: 50%;
            animation: wc-checkin-spin 0.8s linear infinite;
          }
          @keyframes wc-checkin-spin { to { transform: rotate(360deg); } }

          /* Camera */
          .wc-checkin .ci-videowrap {
            position: relative;
            width: 100%; max-width: 22rem;
            aspect-ratio: 4 / 3;
            background: #000;
            border-radius: 0.625rem;
            overflow: hidden;
          }
          .wc-checkin .ci-video { width: 100%; height: 100%; object-fit: cover; display: block; }
          .wc-checkin .ci-reticle {
            position: absolute; inset: 18%;
            border: 3px solid rgba(255,255,255,0.85);
            border-radius: 0.5rem;
            box-shadow: 0 0 0 9999px rgba(0,0,0,0.25);
          }
        }
      `.trim();
      this.loadStyle('wc-checkin-style', style);
    }
  }

  customElements.define('wc-checkin', WcCheckin);
  window.WcCheckin = WcCheckin;
}
