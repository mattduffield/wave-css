/**
 *
 *  Name: wc-fx-board
 *  Usage:
 *    A per-station FX player for a multi-zone sound/vision board. Renders category-grouped
 *    pads from a typed resource list and plays audio/video LOCALLY on the station device.
 *    "Effect" resources overlap/retrigger; a "background" resource is EXCLUSIVE (a new
 *    background stops the previous one) and honors loop. Effective volume is
 *    master(0..1) x resource.volume, and the master slider live-adjusts playing media.
 *
 *    When `controllable`, the board ALSO executes remote COMMANDs addressed to its `zone`
 *    (received over a host-provided WebSocket via `ws-url`, or fed in with `.receive(json)`)
 *    and, after any change, emits a STATE message (over the socket and as a `message` event)
 *    so a master console reflects what is playing.
 *
 *    <wc-fx-board
 *        zone="main-hall" controllable show-shortcuts
 *        master-volume="80" columns="4"
 *        resources='[{"id":"a1","type":"audio","name":"Applause","category":"Crowd","file_url":"/fx/applause.mp3","volume":0.9,"loop":false,"is_background":false,"shortcut_key":"1","order":0}]'
 *        categories='[{"name":"Crowd","icon":"users","color":"#3b82f6"}]'
 *        ws-url="/ws/fx_ws?role=station&zone=main-hall">
 *    </wc-fx-board>
 *
 *  RESOURCE shape (JSON):
 *    { id, type:"audio"|"video"|"light", name, category, file_url,
 *      shortcut_key, volume(0..1), loop, is_background, order }
 *    type:"light" is reserved — rendered as a labeled, disabled "coming soon" pad (no playback).
 *
 *  Attributes:
 *    resources       (JSON)   — array of resource objects (required)
 *    categories      (JSON)   — optional [{ name, icon, color }] for group order/label/accent
 *    master-volume   (0..100) — default 80
 *    show-shortcuts  (bool)   — assign number keys 1..9 to the first nine pads
 *    zone            (string) — this station's zone id (matched against COMMAND.zone)
 *    controllable    (bool)   — execute remote COMMANDs for this zone + emit STATE on change
 *    columns         (int)    — fixed pad columns per group (else responsive auto-fill)
 *    ws-url          (string) — open a WebSocket the component drives
 *
 *  WebSocket protocol:
 *    COMMAND (master->zone): { type:"cmd", zone, action, resource_id?, value? }
 *      action in "play"|"stop"|"stopAll"|"volume"|"background"|"requestState"
 *    STATE   (zone->masters): { type:"state", zone, playing:[{id,type,is_background}], master_volume }
 *      master_volume is a 0..1 fraction.
 *
 *  Public API:
 *    .send(obj)     — send an outgoing protocol message (over the socket if open) AND dispatch
 *                     a `message` CustomEvent {detail: obj} so a host can forward it itself.
 *    .receive(json) — deliver an INCOMING protocol message (object or JSON string). A `cmd`
 *                     for this zone is executed (only when `controllable`).
 *    .play(id) / .stop(id) / .stopAll() / .setMasterVolume(0..100)
 *
 *  Events (bubbling, composed):
 *    wcfxboardplay  / wc-fx-board:play  — detail { id, type, zone }
 *    wcfxboardstop  / wc-fx-board:stop  — detail { id, type, zone }
 *    message                            — detail = the outgoing protocol object
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcFxBoard extends WcBaseComponent {
  static get is() {
    return 'wc-fx-board';
  }

  static get observedAttributes() {
    return [
      'id', 'class', 'resources', 'categories', 'master-volume',
      'show-shortcuts', 'zone', 'controllable', 'columns', 'ws-url'
    ];
  }

  constructor() {
    super();
    this._resources = [];
    this._categories = [];
    this._resById = new Map();
    this._active = new Map();   // id -> { instances:Set<HTMLMediaElement>, resource, isBackground }
    this._bgId = null;          // currently-playing exclusive background id
    this._videoActiveId = null; // resource id currently owning the single video surface
    this._keymap = new Map();   // shortcut key -> resource id
    this._masterVolume = 80;    // 0..100
    this._zone = '';
    this._columns = 0;
    this._showShortcuts = false;
    this._wsUrl = '';
    this._ws = null;

    this._onClick = this._handleClick.bind(this);
    this._onInput = this._handleInput.bind(this);
    this._onKeydown = this._handleKeydown.bind(this);

    const compEl = this.querySelector(':scope > .wc-fx-board');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-fx-board');
      this.appendChild(this.componentElement);
    }
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.stopAll();
    this._closeWs();
    this._unWireEvents();
  }

  // ---- Public API -----------------------------------------------------------

  get resources() { return this._resources.slice(); }
  set resources(arr) {
    this.stopAll();
    this._resources = Array.isArray(arr) ? arr : [];
    this._indexResources();
    this._renderBoard();
  }

  get zone() { return this._zone; }

  play(id) { this._playResource(id); }
  stop(id) { this._stopResource(id); }

  setMasterVolume(v) {
    this._masterVolume = this._clamp(this._num(v, this._masterVolume), 0, 100);
    const slider = this.componentElement.querySelector('.wc-fx-master-input');
    if (slider) slider.value = String(this._masterVolume);
    const readout = this.componentElement.querySelector('.wc-fx-master-value');
    if (readout) readout.textContent = `${Math.round(this._masterVolume)}%`;
    // Live-adjust everything currently playing.
    this._active.forEach(entry => {
      const vol = this._effectiveVolume(entry.resource);
      entry.instances.forEach(el => { try { el.volume = vol; } catch (ex) {} });
    });
    this._afterChange();
  }

  stopAll() {
    if (!this._active || this._active.size === 0) {
      this._hideVideo();
      this._bgId = null;
      this._videoActiveId = null;
      return;
    }
    const entries = Array.from(this._active.values());
    this._active.forEach((entry, id) => {
      entry.instances.forEach(el => this._haltMedia(el));
      this._reflectPad(id, false);
    });
    this._active.clear();
    this._bgId = null;
    this._videoActiveId = null;
    this._hideVideo();
    entries.forEach(entry => this._emitStop(entry.resource));
    this._afterChange();
  }

  /** Send an outgoing protocol message: over the socket if open, and as a `message` event. */
  send(obj) {
    if (obj == null) return;
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      try { this._ws.send(JSON.stringify(obj)); } catch (ex) {}
    }
    this.dispatchEvent(new CustomEvent('message', { detail: obj }));
  }

  /** Deliver an incoming protocol message (object or JSON string). */
  receive(json) {
    let msg = json;
    if (typeof json === 'string') {
      try { msg = JSON.parse(json); } catch (ex) { return; }
    }
    if (!msg || typeof msg !== 'object') return;
    if (msg.type !== 'cmd') return;                 // board acts on commands only
    if (!this.hasAttribute('controllable')) return; // only controllable stations obey
    if (msg.zone != null && String(msg.zone) !== String(this._zone)) return;
    this._executeCommand(msg);
  }

  // ---- Config / rendering ---------------------------------------------------

  _render() {
    super._render();
    this._readConfig();
    this._renderBoard();
    this._wireEvents();
    this._connectWs();
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  _readConfig() {
    this._resources = this._parseJSON('resources', []);
    this._categories = this._parseJSON('categories', []);
    this._zone = this.getAttribute('zone') || '';
    this._columns = parseInt(this.getAttribute('columns'), 10) || 0;
    this._showShortcuts = this.hasAttribute('show-shortcuts');
    this._masterVolume = this._clamp(this._num(this.getAttribute('master-volume'), 80), 0, 100);
    this._wsUrl = this.getAttribute('ws-url') || '';
    this._indexResources();
  }

  _indexResources() {
    this._resById = new Map();
    this._resources.forEach(r => {
      if (r && r.id != null) this._resById.set(String(r.id), r);
    });
  }

  _renderBoard() {
    const el = this.componentElement;
    if (!el) return;
    const wasActive = new Map(this._active); // preserve pressed state for still-present audio
    el.innerHTML = '';
    this._keymap = new Map();

    // Header: master volume + Stop All
    const header = document.createElement('div');
    header.className = 'wc-fx-board-header';

    const master = document.createElement('label');
    master.className = 'wc-fx-master';
    const mlabel = document.createElement('span');
    mlabel.className = 'wc-fx-master-label';
    mlabel.textContent = 'Master';
    const minput = document.createElement('input');
    minput.type = 'range';
    minput.className = 'wc-fx-master-input';
    minput.min = '0'; minput.max = '100'; minput.step = '1';
    minput.value = String(this._masterVolume);
    minput.setAttribute('aria-label', 'Master volume');
    const mvalue = document.createElement('span');
    mvalue.className = 'wc-fx-master-value';
    mvalue.textContent = `${Math.round(this._masterVolume)}%`;
    master.appendChild(mlabel);
    master.appendChild(minput);
    master.appendChild(mvalue);

    const stopAll = document.createElement('button');
    stopAll.type = 'button';
    stopAll.className = 'btn btn-sm wc-fx-stop-all';
    stopAll.textContent = 'Stop All';
    stopAll.setAttribute('aria-label', 'Stop all playing media');

    header.appendChild(master);
    header.appendChild(stopAll);
    el.appendChild(header);

    // Single inline video surface (hidden until a video plays)
    const surface = document.createElement('div');
    surface.className = 'wc-fx-video-surface';
    surface.hidden = true;
    const video = document.createElement('video');
    video.className = 'wc-fx-video';
    video.setAttribute('playsinline', '');
    video.setAttribute('controls', '');
    const vclose = document.createElement('button');
    vclose.type = 'button';
    vclose.className = 'wc-fx-video-close';
    vclose.textContent = '×';
    vclose.setAttribute('aria-label', 'Stop video');
    surface.appendChild(vclose);
    surface.appendChild(video);
    el.appendChild(surface);
    this._videoSurface = surface;
    this._videoEl = video;
    // Route the shared video element's lifecycle back to whichever pad owns it.
    video.addEventListener('ended', () => {
      if (this._videoActiveId != null && !video.loop) this._removeInstance(this._videoActiveId, video);
    });
    video.addEventListener('error', () => {
      if (this._videoActiveId != null) { this._markError(this._videoActiveId); this._removeInstance(this._videoActiveId, video); }
    });

    // Category-grouped pads
    let padIndex = 0;
    const groups = this._groupResources();
    const gridCols = this._columns > 0 ? `repeat(${this._columns}, minmax(0, 1fr))` : '';
    groups.forEach(group => {
      const groupEl = document.createElement('div');
      groupEl.className = 'wc-fx-group';
      if (group.cat && group.cat.color) groupEl.style.setProperty('--fx-cat-color', group.cat.color);

      const gh = document.createElement('div');
      gh.className = 'wc-fx-group-header';
      if (group.cat && group.cat.icon) {
        const ic = document.createElement('wc-fa-icon');
        ic.setAttribute('name', group.cat.icon);
        ic.className = 'wc-fx-group-icon';
        gh.appendChild(ic);
      }
      const gt = document.createElement('span');
      gt.className = 'wc-fx-group-title';
      gt.textContent = group.cat ? group.cat.name : 'Uncategorized';
      gh.appendChild(gt);
      groupEl.appendChild(gh);

      const grid = document.createElement('div');
      grid.className = 'wc-fx-grid';
      if (gridCols) grid.style.gridTemplateColumns = gridCols;

      group.items.forEach(res => {
        const pad = this._createPad(res, padIndex);
        grid.appendChild(pad);
        // shortcut key registration
        const key = pad.dataset.key;
        if (key) this._keymap.set(key, String(res.id));
        padIndex++;
      });

      groupEl.appendChild(grid);
      el.appendChild(groupEl);
    });

    // Re-apply pressed state for resources still active after a re-render (audio survives).
    wasActive.forEach((entry, id) => {
      if (this._active.has(id)) this._reflectPad(id, true);
    });
  }

  _createPad(res, index) {
    const type = res.type || 'audio';
    const isLight = type === 'light';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wc-fx-pad';
    btn.dataset.id = String(res.id);
    btn.dataset.type = type;
    btn.setAttribute('aria-pressed', 'false');
    if (res.is_background) btn.classList.add('is-background');

    // Shortcut: explicit key wins; else 1..9 when show-shortcuts.
    let key = res.shortcut_key ? String(res.shortcut_key) : '';
    if (!key && this._showShortcuts && index < 9) key = String(index + 1);
    if (key) btn.dataset.key = key;

    if (isLight) {
      btn.classList.add('is-light');
      btn.disabled = true;
    }

    const nameEl = document.createElement('span');
    nameEl.className = 'wc-fx-pad-name';
    nameEl.textContent = res.name != null ? res.name : String(res.id);
    btn.appendChild(nameEl);

    const meta = document.createElement('span');
    meta.className = 'wc-fx-pad-meta';
    if (key) {
      const kb = document.createElement('kbd');
      kb.className = 'wc-fx-pad-key';
      kb.textContent = key;
      meta.appendChild(kb);
    }
    const typeBadge = document.createElement('span');
    typeBadge.className = 'badge badge-muted wc-fx-pad-type';
    typeBadge.textContent = type;
    meta.appendChild(typeBadge);
    if (res.is_background) {
      const bg = document.createElement('span');
      bg.className = 'badge badge-info wc-fx-pad-bg';
      bg.textContent = 'bg';
      meta.appendChild(bg);
    }
    if (isLight) {
      const soon = document.createElement('span');
      soon.className = 'badge badge-warning wc-fx-pad-soon';
      soon.textContent = 'coming soon';
      meta.appendChild(soon);
    }
    btn.appendChild(meta);

    // Accessible label including the shortcut.
    let aria = res.name != null ? String(res.name) : String(res.id);
    if (key) aria += `, shortcut ${key}`;
    aria += `, ${type}`;
    if (res.is_background) aria += ', background';
    if (isLight) aria += ', coming soon';
    btn.setAttribute('aria-label', aria);

    return btn;
  }

  _groupResources() {
    const catByName = new Map();
    this._categories.forEach((c, i) => { if (c && c.name != null) catByName.set(String(c.name), { ...c, _i: i }); });
    const groups = new Map();
    this._resources.forEach(r => {
      const name = r.category != null ? String(r.category) : 'Uncategorized';
      if (!groups.has(name)) groups.set(name, { cat: catByName.get(name) || { name }, items: [], _seen: groups.size });
      groups.get(name).items.push(r);
    });
    const arr = Array.from(groups.values());
    arr.sort((a, b) => {
      const ai = catByName.has(a.cat.name) ? catByName.get(a.cat.name)._i : 1000 + a._seen;
      const bi = catByName.has(b.cat.name) ? catByName.get(b.cat.name)._i : 1000 + b._seen;
      return ai - bi;
    });
    arr.forEach(g => g.items.sort((a, b) => (this._num(a.order, 0) - this._num(b.order, 0)) ||
      String(a.name || '').localeCompare(String(b.name || ''))));
    return arr;
  }

  // ---- Playback -------------------------------------------------------------

  _playResource(id, forceBackground) {
    const res = this._resById.get(String(id));
    if (!res) return;
    if ((res.type || 'audio') === 'light') return; // reserved type: no playback
    if (!res.file_url) { this._markError(id); return; }

    const isBg = forceBackground || !!res.is_background;
    if (isBg) this._stopBackground();

    let mediaEl;
    if ((res.type) === 'video') {
      // Single shared surface: a new video replaces whatever it was showing.
      if (this._videoActiveId != null && this._videoActiveId !== String(id)) {
        this._removeInstance(this._videoActiveId, this._videoEl);
      }
      mediaEl = this._videoEl;
      mediaEl.loop = !!res.loop;
      mediaEl.volume = this._effectiveVolume(res);
      mediaEl.src = res.file_url;
      this._videoActiveId = String(id);
      this._showVideo();
      const p = mediaEl.play();
      if (p && p.catch) p.catch(() => {});
    } else {
      // Audio effects overlap (a fresh element per trigger); background is single.
      mediaEl = new Audio();
      mediaEl.preload = 'auto';
      mediaEl.loop = !!res.loop;
      mediaEl.volume = this._effectiveVolume(res);
      mediaEl.src = res.file_url;
      mediaEl.addEventListener('ended', () => { if (!mediaEl.loop) this._removeInstance(id, mediaEl); });
      mediaEl.addEventListener('error', () => { this._markError(id); this._removeInstance(id, mediaEl); }, { once: true });
      const p = mediaEl.play();
      if (p && p.catch) p.catch(() => {});
    }

    let entry = this._active.get(String(id));
    if (!entry) { entry = { instances: new Set(), resource: res, isBackground: isBg }; this._active.set(String(id), entry); }
    entry.isBackground = isBg;
    entry.instances.add(mediaEl);
    if (isBg) this._bgId = String(id);
    this._clearError(id);
    this._reflectPad(id, true);
    this._emitPlay(res);
    this._afterChange();
  }

  _stopResource(id) {
    const entry = this._active.get(String(id));
    if (!entry) return;
    entry.instances.forEach(el => this._haltMedia(el));
    this._active.delete(String(id));
    if (this._bgId === String(id)) this._bgId = null;
    if (this._videoActiveId === String(id)) { this._videoActiveId = null; this._hideVideo(); }
    this._reflectPad(id, false);
    this._emitStop(entry.resource);
    this._afterChange();
  }

  _stopBackground() {
    if (this._bgId != null) this._stopResource(this._bgId);
  }

  /** Remove ONE finished instance without a full stop (ended/error path). */
  _removeInstance(id, el) {
    const entry = this._active.get(String(id));
    if (!entry) return;
    entry.instances.delete(el);
    if (el === this._videoEl && this._videoActiveId === String(id)) {
      this._videoActiveId = null;
      this._hideVideo();
    }
    if (entry.instances.size === 0) {
      this._active.delete(String(id));
      if (this._bgId === String(id)) this._bgId = null;
      this._reflectPad(id, false);
      this._emitStop(entry.resource);
      this._afterChange();
    }
  }

  _haltMedia(el) {
    try { el.pause(); } catch (ex) {}
    try { el.currentTime = 0; } catch (ex) {}
    if (el === this._videoEl) { try { el.removeAttribute('src'); el.load(); } catch (ex) {} }
  }

  _effectiveVolume(res) {
    const rv = res && res.volume != null ? this._num(res.volume, 1) : 1;
    return this._clamp((this._masterVolume / 100) * rv, 0, 1);
  }

  _showVideo() { if (this._videoSurface) this._videoSurface.hidden = false; }
  _hideVideo() { if (this._videoSurface) this._videoSurface.hidden = true; }

  _reflectPad(id, on) {
    const pad = this.componentElement.querySelector(`.wc-fx-pad[data-id="${CSS.escape(String(id))}"]`);
    if (!pad) return;
    pad.classList.toggle('is-playing', !!on);
    pad.setAttribute('aria-pressed', on ? 'true' : 'false');
  }

  _markError(id) {
    const pad = this.componentElement.querySelector(`.wc-fx-pad[data-id="${CSS.escape(String(id))}"]`);
    if (pad) { pad.classList.add('is-error'); pad.classList.remove('is-playing'); pad.setAttribute('aria-pressed', 'false'); }
  }
  _clearError(id) {
    const pad = this.componentElement.querySelector(`.wc-fx-pad[data-id="${CSS.escape(String(id))}"]`);
    if (pad) pad.classList.remove('is-error');
  }

  // ---- Remote command / state ----------------------------------------------

  _executeCommand(msg) {
    switch (msg.action) {
      case 'play': this._playResource(msg.resource_id); break;
      case 'stop': this._stopResource(msg.resource_id); break;
      case 'stopAll': this.stopAll(); break;
      case 'volume': this.setMasterVolume(this._num(msg.value, 0) * 100); break;
      case 'background':
        if (msg.resource_id != null) this._playResource(msg.resource_id, true);
        else this._stopBackground();
        break;
      case 'requestState': this._emitState(); break;
      default: break;
    }
  }

  _afterChange() {
    if (this.hasAttribute('controllable')) this._emitState();
  }

  _emitState() {
    const playing = [];
    this._active.forEach((entry, id) => {
      playing.push({ id, type: entry.resource.type || 'audio', is_background: !!entry.isBackground });
    });
    this.send({ type: 'state', zone: this._zone, playing, master_volume: this._masterVolume / 100 });
  }

  // ---- WebSocket ------------------------------------------------------------

  _connectWs() {
    this._closeWs();
    if (!this._wsUrl) return;
    try {
      const ws = new WebSocket(this._wsUrl);
      this._ws = ws;
      ws.addEventListener('message', (e) => this.receive(e.data));
      ws.addEventListener('open', () => { if (this.hasAttribute('controllable')) this._emitState(); });
      ws.addEventListener('error', () => {});
      ws.addEventListener('close', () => { if (this._ws === ws) this._ws = null; });
    } catch (ex) {
      this._ws = null; // fail-soft on a bad url; host can still use .receive()/.send()
    }
  }

  _closeWs() {
    if (this._ws) {
      try { this._ws.close(); } catch (ex) {}
      this._ws = null;
    }
  }

  // ---- Events / wiring ------------------------------------------------------

  _handleClick(e) {
    if (e.target.closest('.wc-fx-video-close')) { this._stopVideoSurface(); return; }
    if (e.target.closest('.wc-fx-stop-all')) { this.stopAll(); return; }
    const pad = e.target.closest('.wc-fx-pad');
    if (!pad || !this.componentElement.contains(pad) || pad.disabled) return;
    const id = pad.dataset.id;
    const res = this._resById.get(String(id));
    if (!res) return;
    // Background pads toggle; effects always (re)trigger and overlap.
    if (res.is_background && this._bgId === String(id)) this._stopResource(id);
    else this._playResource(id);
  }

  _stopVideoSurface() {
    if (this._videoActiveId != null) this._stopResource(this._videoActiveId);
    else this._hideVideo();
  }

  _handleInput(e) {
    if (e.target.closest('.wc-fx-master-input')) {
      this.setMasterVolume(e.target.value);
    }
  }

  _handleKeydown(e) {
    if (!this._keymap || this._keymap.size === 0) return;
    const t = e.target;
    if (t && (t.matches('input, textarea, select, [contenteditable="true"]'))) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const id = this._keymap.get(e.key);
    if (id == null) return;
    e.preventDefault();
    const res = this._resById.get(String(id));
    if (!res || (res.type || 'audio') === 'light') return;
    if (res.is_background && this._bgId === String(id)) this._stopResource(id);
    else this._playResource(id);
  }

  _emitPlay(res) {
    this._emitEvent('wcfxboardplay', 'wc-fx-board:play', {
      bubbles: true, composed: true,
      detail: { id: res.id, type: res.type || 'audio', zone: this._zone }
    });
  }
  _emitStop(res) {
    this._emitEvent('wcfxboardstop', 'wc-fx-board:stop', {
      bubbles: true, composed: true,
      detail: { id: res.id, type: res.type || 'audio', zone: this._zone }
    });
  }

  _wireEvents() {
    super._wireEvents();
    const el = this.componentElement;
    el.removeEventListener('click', this._onClick);
    el.addEventListener('click', this._onClick);
    el.removeEventListener('input', this._onInput);
    el.addEventListener('input', this._onInput);
    document.removeEventListener('keydown', this._onKeydown);
    document.addEventListener('keydown', this._onKeydown);
  }

  _unWireEvents() {
    super._unWireEvents();
    const el = this.componentElement;
    if (el) {
      el.removeEventListener('click', this._onClick);
      el.removeEventListener('input', this._onInput);
    }
    document.removeEventListener('keydown', this._onKeydown);
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'master-volume') {
      this.setMasterVolume(newValue);
    } else if (attrName === 'ws-url') {
      this._wsUrl = newValue || '';
      this._connectWs();
    } else if (attrName === 'resources') {
      this.stopAll();
      this._readConfig();
      this._renderBoard();
    } else if (['categories', 'columns', 'show-shortcuts', 'zone', 'controllable'].includes(attrName)) {
      this._readConfig();
      this._renderBoard();
    } else if (attrName === 'class') {
      super._handleAttributeChange(attrName, newValue);
    } else {
      super._handleAttributeChange(attrName, newValue);
    }
  }

  // ---- Helpers --------------------------------------------------------------

  _parseJSON(attr, fallback) {
    const raw = this.getAttribute(attr);
    if (!raw) return fallback;
    try {
      const parsed = JSON.parse(raw);
      return parsed != null ? parsed : fallback;
    } catch (ex) {
      console.warn(`[wc-fx-board] invalid JSON for ${attr}`, ex);
      return fallback;
    }
  }

  _num(v, dflt) { const n = parseFloat(v); return Number.isNaN(n) ? dflt : n; }
  _clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
}

customElements.define(WcFxBoard.is, WcFxBoard);
export { WcFxBoard };
