/**
 *
 *  Name: wc-fx-console
 *  Usage:
 *    The MASTER console for a multi-zone FX board. It never plays anything locally — it
 *    REMOTE-CONTROLS zones. Pick a zone, then its category-grouped pads (+ master volume +
 *    Stop All) SEND COMMANDs to that zone over a host-provided WebSocket. Incoming STATE
 *    messages drive a live per-zone "playing" indicator (whole floor at a glance) and a
 *    "now playing" list for the selected zone.
 *
 *    <wc-fx-console
 *        master-volume="80"
 *        zones='[{"id":"z1","name":"Main Hall","event_name":"main-hall",
 *                 "categories":[{"name":"Crowd","icon":"users"}],
 *                 "resources":[{"id":"a1","type":"audio","name":"Applause","category":"Crowd","file_url":"/fx/applause.mp3"}]}]'
 *        ws-url="/ws/fx_ws?role=master">
 *    </wc-fx-console>
 *
 *  WebSocket protocol (see wc-fx-board):
 *    COMMAND (master->zone): { type:"cmd", zone, action, resource_id?, value? }
 *      action in "play"|"stop"|"stopAll"|"volume"|"background"|"requestState"
 *    STATE   (zone->masters): { type:"state", zone, playing:[{id,type,is_background}], master_volume }
 *    A zone's routing key is its `event_name` (falling back to `id`); STATE.zone is matched to it.
 *
 *  Attributes:
 *    zones          (JSON)   — [{ id, name, event_name, resources:[…], categories?:[…] }]
 *    master-volume  (0..100) — default 80 (slider value for the selected zone)
 *    ws-url         (string) — open a WebSocket the component drives
 *
 *  Public API:
 *    .send(obj)     — send an outgoing message (over the socket if open) AND dispatch a
 *                     `message` CustomEvent {detail: obj} so a host can forward it itself.
 *    .receive(json) — deliver an incoming message (object or JSON string); STATE updates the UI.
 *    .selectZone(idOrKey)
 *
 *  Events (bubbling, composed):
 *    wcfxconsolecommand / wc-fx-console:command — detail { zone, action, resource_id, value }
 *    message                                    — detail = the outgoing protocol object
 */

import { WcBaseComponent } from './wc-base-component.js';

class WcFxConsole extends WcBaseComponent {
  static get is() {
    return 'wc-fx-console';
  }

  static get observedAttributes() {
    return ['id', 'class', 'zones', 'master-volume', 'ws-url'];
  }

  constructor() {
    super();
    this._zones = [];
    this._zoneByKey = new Map();  // routing key (event_name||id) -> zone
    this._selectedKey = null;
    this._masterVolume = 80;
    this._liveState = new Map();  // zone key -> { playing:[…], master_volume }
    this._wsUrl = '';
    this._ws = null;

    this._onClick = this._handleClick.bind(this);
    this._onInput = this._handleInput.bind(this);

    const compEl = this.querySelector(':scope > .wc-fx-console');
    if (compEl) {
      this.componentElement = compEl;
    } else {
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-fx-console');
      this.appendChild(this.componentElement);
    }
  }

  connectedCallback() {
    super.connectedCallback();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._closeWs();
    this._unWireEvents();
  }

  // ---- Public API -----------------------------------------------------------

  get zones() { return this._zones.slice(); }
  set zones(arr) {
    this._zones = Array.isArray(arr) ? arr : [];
    this._indexZones();
    this._renderConsole();
  }

  selectZone(idOrKey) {
    const zone = this._resolveZone(idOrKey);
    if (!zone) return;
    this._selectedKey = this._zoneKey(zone);
    this._renderConsole();
    // Ask the freshly-selected zone for its current state.
    this._sendCommand('requestState');
  }

  send(obj) {
    if (obj == null) return;
    if (this._ws && this._ws.readyState === WebSocket.OPEN) {
      try { this._ws.send(JSON.stringify(obj)); } catch (ex) {}
    }
    this.dispatchEvent(new CustomEvent('message', { detail: obj }));
  }

  receive(json) {
    let msg = json;
    if (typeof json === 'string') {
      try { msg = JSON.parse(json); } catch (ex) { return; }
    }
    if (!msg || typeof msg !== 'object') return;
    if (msg.type !== 'state') return;  // console reflects state; it doesn't obey commands
    const key = String(msg.zone);
    this._liveState.set(key, {
      playing: Array.isArray(msg.playing) ? msg.playing : [],
      master_volume: msg.master_volume
    });
    this._refreshLive(key);
  }

  // ---- Config / rendering ---------------------------------------------------

  _render() {
    super._render();
    this._readConfig();
    this._renderConsole();
    this._wireEvents();
    this._connectWs();
    if (typeof htmx !== 'undefined') htmx.process(this);
  }

  _readConfig() {
    this._zones = this._parseJSON('zones', []);
    this._masterVolume = this._clamp(this._num(this.getAttribute('master-volume'), 80), 0, 100);
    this._wsUrl = this.getAttribute('ws-url') || '';
    this._indexZones();
  }

  _indexZones() {
    this._zoneByKey = new Map();
    this._zones.forEach(z => { if (z) this._zoneByKey.set(this._zoneKey(z), z); });
    // keep/repair selection
    if (!this._selectedKey || !this._zoneByKey.has(this._selectedKey)) {
      this._selectedKey = this._zones.length ? this._zoneKey(this._zones[0]) : null;
    }
  }

  _zoneKey(zone) { return String(zone.event_name != null ? zone.event_name : zone.id); }

  _resolveZone(idOrKey) {
    const s = String(idOrKey);
    if (this._zoneByKey.has(s)) return this._zoneByKey.get(s);
    return this._zones.find(z => String(z.id) === s) || null;
  }

  _renderConsole() {
    const el = this.componentElement;
    if (!el) return;
    el.innerHTML = '';

    // Zone selector (list)
    const zonesEl = document.createElement('div');
    zonesEl.className = 'wc-fx-console-zones';
    zonesEl.setAttribute('role', 'tablist');
    zonesEl.setAttribute('aria-label', 'Zones');
    this._zones.forEach(z => {
      const key = this._zoneKey(z);
      const zb = document.createElement('button');
      zb.type = 'button';
      zb.className = 'wc-fx-zone';
      zb.dataset.zoneKey = key;
      zb.setAttribute('role', 'tab');
      const selected = key === this._selectedKey;
      zb.classList.toggle('is-selected', selected);
      zb.setAttribute('aria-selected', selected ? 'true' : 'false');

      const nm = document.createElement('span');
      nm.className = 'wc-fx-zone-name';
      nm.textContent = z.name != null ? z.name : key;
      zb.appendChild(nm);

      const ind = document.createElement('span');
      ind.className = 'wc-fx-zone-indicator';
      zb.appendChild(ind);

      zonesEl.appendChild(zb);
    });
    el.appendChild(zonesEl);

    // Selected-zone panel
    const panel = document.createElement('div');
    panel.className = 'wc-fx-console-panel';
    const zone = this._selectedKey != null ? this._zoneByKey.get(this._selectedKey) : null;

    if (!zone) {
      const empty = document.createElement('div');
      empty.className = 'wc-fx-console-empty';
      empty.textContent = 'No zone selected';
      panel.appendChild(empty);
      el.appendChild(panel);
      this._zones.forEach(z => this._refreshLive(this._zoneKey(z)));
      return;
    }

    // Panel header: master volume + Stop All (send commands)
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
    minput.setAttribute('aria-label', `Master volume for ${zone.name || this._selectedKey}`);
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
    stopAll.setAttribute('aria-label', `Stop all in ${zone.name || this._selectedKey}`);

    header.appendChild(master);
    header.appendChild(stopAll);
    panel.appendChild(header);

    // Now-playing (live)
    const now = document.createElement('div');
    now.className = 'wc-fx-nowplaying';
    now.setAttribute('aria-live', 'polite');
    panel.appendChild(now);

    // Grouped pads (send play commands)
    const resources = Array.isArray(zone.resources) ? zone.resources : [];
    const categories = Array.isArray(zone.categories) ? zone.categories : [];
    const groups = this._groupResources(resources, categories);
    const cols = parseInt(zone.columns, 10) || 0;
    const gridCols = cols > 0 ? `repeat(${cols}, minmax(0, 1fr))` : '';
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
      group.items.forEach(res => grid.appendChild(this._createPad(res)));
      groupEl.appendChild(grid);
      panel.appendChild(groupEl);
    });

    el.appendChild(panel);

    // Paint live indicators (all zones) + selected now-playing.
    this._zones.forEach(z => this._refreshLive(this._zoneKey(z)));
  }

  _createPad(res) {
    const type = res.type || 'audio';
    const isLight = type === 'light';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'wc-fx-pad';
    btn.dataset.id = String(res.id);
    btn.dataset.type = type;
    btn.setAttribute('aria-pressed', 'false');
    if (res.is_background) btn.classList.add('is-background');
    if (isLight) { btn.classList.add('is-light'); btn.disabled = true; }

    const nameEl = document.createElement('span');
    nameEl.className = 'wc-fx-pad-name';
    nameEl.textContent = res.name != null ? res.name : String(res.id);
    btn.appendChild(nameEl);

    const meta = document.createElement('span');
    meta.className = 'wc-fx-pad-meta';
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

    let aria = res.name != null ? String(res.name) : String(res.id);
    aria += `, ${type}`;
    if (res.is_background) aria += ', background';
    if (isLight) aria += ', coming soon';
    btn.setAttribute('aria-label', aria);
    return btn;
  }

  _groupResources(resources, categories) {
    const catByName = new Map();
    (categories || []).forEach((c, i) => { if (c && c.name != null) catByName.set(String(c.name), { ...c, _i: i }); });
    const groups = new Map();
    (resources || []).forEach(r => {
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

  // ---- Live state reflection ------------------------------------------------

  _refreshLive(key) {
    const state = this._liveState.get(key);
    const count = state && Array.isArray(state.playing) ? state.playing.length : 0;

    // Zone-list indicator (whole floor at a glance)
    const zb = this.componentElement.querySelector(`.wc-fx-zone[data-zone-key="${CSS.escape(key)}"]`);
    if (zb) {
      const ind = zb.querySelector('.wc-fx-zone-indicator');
      if (ind) {
        ind.textContent = count > 0 ? String(count) : '';
        ind.classList.toggle('is-active', count > 0);
      }
      zb.classList.toggle('is-playing', count > 0);
    }

    // Selected-zone now-playing + pad highlights
    if (key !== this._selectedKey) return;
    const zone = this._zoneByKey.get(key);
    const now = this.componentElement.querySelector('.wc-fx-nowplaying');
    if (now) {
      now.innerHTML = '';
      const items = (state && state.playing) ? state.playing : [];
      if (!items.length) {
        const idle = document.createElement('span');
        idle.className = 'wc-fx-nowplaying-idle';
        idle.textContent = 'Nothing playing';
        now.appendChild(idle);
      } else {
        const label = document.createElement('span');
        label.className = 'wc-fx-nowplaying-label';
        label.textContent = 'Playing:';
        now.appendChild(label);
        items.forEach(p => {
          const res = zone && Array.isArray(zone.resources)
            ? zone.resources.find(r => String(r.id) === String(p.id)) : null;
          const chip = document.createElement('span');
          chip.className = 'badge wc-fx-nowplaying-chip';
          if (p.is_background) chip.classList.add('badge-info');
          chip.textContent = res && res.name != null ? res.name : String(p.id);
          now.appendChild(chip);
        });
      }
    }
    // Pad is-playing highlight
    const playingIds = new Set(((state && state.playing) || []).map(p => String(p.id)));
    this.componentElement.querySelectorAll('.wc-fx-pad').forEach(pad => {
      const on = playingIds.has(pad.dataset.id);
      pad.classList.toggle('is-playing', on);
      pad.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  // ---- Commands -------------------------------------------------------------

  _sendCommand(action, resource_id, value) {
    if (this._selectedKey == null) return;
    const cmd = { type: 'cmd', zone: this._selectedKey, action };
    if (resource_id != null) cmd.resource_id = resource_id;
    if (value != null) cmd.value = value;
    this.send(cmd);
    this._emitEvent('wcfxconsolecommand', 'wc-fx-console:command', {
      bubbles: true, composed: true,
      detail: { zone: this._selectedKey, action, resource_id: resource_id != null ? resource_id : null, value: value != null ? value : null }
    });
  }

  // ---- WebSocket ------------------------------------------------------------

  _connectWs() {
    this._closeWs();
    if (!this._wsUrl) return;
    try {
      const ws = new WebSocket(this._wsUrl);
      this._ws = ws;
      ws.addEventListener('message', (e) => this.receive(e.data));
      ws.addEventListener('open', () => {
        // Ask every zone for its state so the whole floor lights up.
        this._zones.forEach(z => {
          this.send({ type: 'cmd', zone: this._zoneKey(z), action: 'requestState' });
        });
      });
      ws.addEventListener('error', () => {});
      ws.addEventListener('close', () => { if (this._ws === ws) this._ws = null; });
    } catch (ex) {
      this._ws = null;
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
    const zoneBtn = e.target.closest('.wc-fx-zone');
    if (zoneBtn && this.componentElement.contains(zoneBtn)) {
      this.selectZone(zoneBtn.dataset.zoneKey);
      return;
    }
    if (e.target.closest('.wc-fx-stop-all')) { this._sendCommand('stopAll'); return; }
    const pad = e.target.closest('.wc-fx-pad');
    if (!pad || !this.componentElement.contains(pad) || pad.disabled) return;
    const zone = this._selectedKey != null ? this._zoneByKey.get(this._selectedKey) : null;
    const res = zone && Array.isArray(zone.resources)
      ? zone.resources.find(r => String(r.id) === String(pad.dataset.id)) : null;
    // Background toggles off if it is the one currently playing; else (re)trigger.
    const state = this._liveState.get(this._selectedKey);
    const bgActive = state && (state.playing || []).some(p => String(p.id) === String(pad.dataset.id) && p.is_background);
    if (res && res.is_background && bgActive) this._sendCommand('stop', pad.dataset.id);
    else this._sendCommand('play', pad.dataset.id);
  }

  _handleInput(e) {
    if (e.target.closest('.wc-fx-master-input')) {
      this._masterVolume = this._clamp(this._num(e.target.value, this._masterVolume), 0, 100);
      const readout = this.componentElement.querySelector('.wc-fx-master-value');
      if (readout) readout.textContent = `${Math.round(this._masterVolume)}%`;
      this._sendCommand('volume', null, this._masterVolume / 100);
    }
  }

  _wireEvents() {
    super._wireEvents();
    const el = this.componentElement;
    el.removeEventListener('click', this._onClick);
    el.addEventListener('click', this._onClick);
    el.removeEventListener('input', this._onInput);
    el.addEventListener('input', this._onInput);
  }

  _unWireEvents() {
    super._unWireEvents();
    const el = this.componentElement;
    if (!el) return;
    el.removeEventListener('click', this._onClick);
    el.removeEventListener('input', this._onInput);
  }

  _handleAttributeChange(attrName, newValue, oldValue) {
    if (attrName === 'zones') {
      this._readConfig();
      this._renderConsole();
    } else if (attrName === 'master-volume') {
      this._masterVolume = this._clamp(this._num(newValue, 80), 0, 100);
      const slider = this.componentElement.querySelector('.wc-fx-master-input');
      if (slider) slider.value = String(this._masterVolume);
      const readout = this.componentElement.querySelector('.wc-fx-master-value');
      if (readout) readout.textContent = `${Math.round(this._masterVolume)}%`;
    } else if (attrName === 'ws-url') {
      this._wsUrl = newValue || '';
      this._connectWs();
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
      console.warn(`[wc-fx-console] invalid JSON for ${attr}`, ex);
      return fallback;
    }
  }

  _num(v, dflt) { const n = parseFloat(v); return Number.isNaN(n) ? dflt : n; }
  _clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
}

customElements.define(WcFxConsole.is, WcFxConsole);
export { WcFxConsole };
