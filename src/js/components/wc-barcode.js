/**
 *  Name: wc-barcode
 *  Usage:
 *    <wc-barcode value="IE-4F9K2" caption="Ava Noble"></wc-barcode>
 *    <wc-barcode value="IE-4F9K2" symbology="code128" label="bottom" size="64"></wc-barcode>
 *
 *  Description:
 *    Renders a scannable code (QR by default, Code128 optional) plus the human-readable
 *    value, as crisp print-quality SVG. Self-contained — the QR and Code128 generators
 *    are bundled (no external CDN), so it works offline. The code itself is always pure
 *    black on white (never tinted by the theme) so scanners read it reliably; the caption
 *    and label may use theme text color. Display-only (no form participation, no events).
 *
 *  Attributes (observed):
 *    - value      : the code to encode (required; empty ⇒ renders nothing)
 *    - symbology  : "qr" (default) | "code128"
 *    - label      : "right" (default) | "bottom" | "none" — where to show the value
 *    - size       : QR square px (default 96) / Code128 bar height px (default 64)
 *    - ec-level   : QR error correction "L" | "M" (default) | "Q" | "H"
 *    - caption    : optional small text above (e.g. an attendee name)
 *
 *  API: `value` property getter/setter (re-renders on change).
 */

import { WcBaseComponent } from './wc-base-component.js';

// ─── Bundled QR generator (byte mode, versions 1–40, EC L/M/Q/H) ──────────────
// Ported from Project Nayuki's QR Code generator (MIT). Simplified mask-penalty
// (any valid mask yields a scannable code — the format bits record which one).
const QR = (() => {
  const ECC = { L: [0, 1], M: [1, 0], Q: [2, 3], H: [3, 2] }; // ordinal, formatBits

  const ECC_CODEWORDS_PER_BLOCK = [
    [-1,7,10,15,20,26,18,20,24,30,18,20,24,26,30,22,24,28,30,28,28,28,28,30,30,26,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    [-1,10,16,26,18,24,16,18,22,22,26,30,22,22,24,24,28,28,26,26,26,26,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28,28],
    [-1,13,22,18,26,18,24,18,22,20,24,28,26,24,20,30,24,28,28,26,30,28,30,30,30,30,28,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
    [-1,17,28,22,16,22,28,26,26,24,28,24,28,22,24,24,30,28,28,26,28,30,24,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30,30],
  ];
  const NUM_EC_BLOCKS = [
    [-1,1,1,1,1,1,2,2,2,2,4,4,4,4,4,6,6,6,6,7,8,8,9,9,10,12,12,12,13,14,15,16,17,18,19,19,20,21,22,24,25],
    [-1,1,1,1,2,2,4,4,4,5,5,5,8,9,9,10,10,11,13,14,16,17,17,18,20,21,23,25,26,28,29,31,33,35,37,38,40,43,45,47,49],
    [-1,1,1,2,2,4,4,6,6,8,8,8,10,12,16,12,17,16,18,21,20,23,23,25,27,29,34,34,35,38,40,43,45,48,51,53,56,59,62,65,68],
    [-1,1,1,2,4,4,4,5,6,8,8,11,11,16,16,18,16,19,21,25,25,25,34,30,32,35,37,40,42,45,48,51,54,57,60,63,66,70,74,77,81],
  ];

  const getBit = (x, i) => ((x >>> i) & 1) !== 0;

  function gfMul(x, y) {
    let z = 0;
    for (let i = 7; i >= 0; i--) { z = (z << 1) ^ ((z >>> 7) * 0x11D); z ^= ((y >>> i) & 1) * x; }
    return z & 0xFF;
  }
  function rsDivisor(degree) {
    const result = new Array(degree).fill(0);
    result[degree - 1] = 1;
    let root = 1;
    for (let i = 0; i < degree; i++) {
      for (let j = 0; j < degree; j++) {
        result[j] = gfMul(result[j], root);
        if (j + 1 < degree) result[j] ^= result[j + 1];
      }
      root = gfMul(root, 0x02);
    }
    return result;
  }
  function rsRemainder(data, divisor) {
    const result = new Array(divisor.length).fill(0);
    for (const b of data) {
      const factor = b ^ result.shift();
      result.push(0);
      divisor.forEach((coef, i) => { result[i] ^= gfMul(coef, factor); });
    }
    return result;
  }

  function numRawDataModules(ver) {
    let result = (16 * ver + 128) * ver + 64;
    if (ver >= 2) {
      const numAlign = Math.floor(ver / 7) + 2;
      result -= (25 * numAlign - 10) * numAlign - 55;
      if (ver >= 7) result -= 36;
    }
    return result;
  }
  const numDataCodewords = (ver, ord) =>
    Math.floor(numRawDataModules(ver) / 8) - ECC_CODEWORDS_PER_BLOCK[ord][ver] * NUM_EC_BLOCKS[ord][ver];
  const ccBits = (ver) => (ver <= 9 ? 8 : 16);

  function utf8Bytes(str) {
    const out = [];
    for (const ch of str) {
      let cp = ch.codePointAt(0);
      if (cp < 0x80) out.push(cp);
      else if (cp < 0x800) out.push(0xC0 | (cp >> 6), 0x80 | (cp & 0x3F));
      else if (cp < 0x10000) out.push(0xE0 | (cp >> 12), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
      else out.push(0xF0 | (cp >> 18), 0x80 | ((cp >> 12) & 0x3F), 0x80 | ((cp >> 6) & 0x3F), 0x80 | (cp & 0x3F));
    }
    return out;
  }

  function alignmentPositions(ver, size) {
    if (ver === 1) return [];
    const numAlign = Math.floor(ver / 7) + 2;
    const step = ver === 32 ? 26 : Math.ceil((size - 13) / (numAlign * 2 - 2)) * 2;
    const result = [6];
    for (let pos = size - 7; result.length < numAlign; pos -= step) result.splice(1, 0, pos);
    return result;
  }

  // Returns { size, modules: boolean[][] } or null when value is empty.
  function encode(text, eccName) {
    if (!text) return null;
    const ecc = ECC[eccName] || ECC.M;
    const ord = ecc[0], fmt = ecc[1];
    const bytes = utf8Bytes(text);

    // smallest version that fits
    let version = 1;
    for (; version <= 40; version++) {
      if (4 + ccBits(version) + 8 * bytes.length <= numDataCodewords(version, ord) * 8) break;
    }
    if (version > 40) throw new Error('wc-barcode: value too long to encode as QR');

    // bit buffer → data codewords
    const bb = [];
    const appendBits = (val, len) => { for (let i = len - 1; i >= 0; i--) bb.push((val >>> i) & 1); };
    appendBits(4, 4);
    appendBits(bytes.length, ccBits(version));
    for (const b of bytes) appendBits(b, 8);
    const capacityBits = numDataCodewords(version, ord) * 8;
    appendBits(0, Math.min(4, capacityBits - bb.length));
    appendBits(0, (8 - bb.length % 8) % 8);
    for (let pad = 0xEC; bb.length < capacityBits; pad ^= 0xEC ^ 0x11) appendBits(pad, 8);

    const dataCw = new Array(bb.length / 8).fill(0);
    bb.forEach((bit, i) => { dataCw[i >>> 3] |= bit << (7 - (i & 7)); });

    // ECC + interleave
    const numBlocks = NUM_EC_BLOCKS[ord][version];
    const blockEccLen = ECC_CODEWORDS_PER_BLOCK[ord][version];
    const rawCw = Math.floor(numRawDataModules(version) / 8);
    const numShort = numBlocks - rawCw % numBlocks;
    const shortLen = Math.floor(rawCw / numBlocks);
    const div = rsDivisor(blockEccLen);
    const blocks = [];
    let k = 0;
    for (let i = 0; i < numBlocks; i++) {
      const dat = dataCw.slice(k, k + shortLen - blockEccLen + (i < numShort ? 0 : 1));
      k += dat.length;
      const rem = rsRemainder(dat, div);
      if (i < numShort) dat.push(0);
      blocks.push(dat.concat(rem));
    }
    const codewords = [];
    for (let i = 0; i < blocks[0].length; i++) {
      for (let j = 0; j < blocks.length; j++) {
        if (i !== shortLen - blockEccLen || j >= numShort) codewords.push(blocks[j][i]);
      }
    }

    // matrix
    const size = version * 4 + 17;
    const modules = Array.from({ length: size }, () => new Array(size).fill(false));
    const isFn = Array.from({ length: size }, () => new Array(size).fill(false));
    const setFn = (x, y, dark) => { modules[y][x] = dark; isFn[y][x] = true; };

    // timing
    for (let i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0); }
    // finders
    const drawFinder = (cx, cy) => {
      for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) {
        const dist = Math.max(Math.abs(dx), Math.abs(dy));
        const x = cx + dx, y = cy + dy;
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, dist !== 2 && dist !== 4);
      }
    };
    drawFinder(3, 3); drawFinder(size - 4, 3); drawFinder(3, size - 4);
    // alignment
    const ap = alignmentPositions(version, size);
    const n = ap.length;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      if ((i === 0 && j === 0) || (i === 0 && j === n - 1) || (i === n - 1 && j === 0)) continue;
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) {
        setFn(ap[j] + dx, ap[i] + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
      }
    }

    const drawFormat = (mask) => {
      const data = fmt << 3 | mask;
      let rem = data;
      for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
      const bits = ((data << 10 | rem) ^ 0x5412) & 0x7FFF;
      for (let i = 0; i <= 5; i++) setFn(8, i, getBit(bits, i));
      setFn(8, 7, getBit(bits, 6)); setFn(8, 8, getBit(bits, 7)); setFn(7, 8, getBit(bits, 8));
      for (let i = 9; i < 15; i++) setFn(14 - i, 8, getBit(bits, i));
      for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, getBit(bits, i));
      for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, getBit(bits, i));
      setFn(8, size - 8, true); // always-dark module
    };
    const drawVersion = () => {
      if (version < 7) return;
      let rem = version;
      for (let i = 0; i < 12; i++) rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
      const bits = version << 12 | rem;
      for (let i = 0; i < 18; i++) {
        const bit = getBit(bits, i), a = size - 11 + i % 3, b = Math.floor(i / 3);
        setFn(a, b, bit); setFn(b, a, bit);
      }
    };
    drawFormat(0); // reserve
    drawVersion();

    // codewords (zigzag)
    let bi = 0;
    for (let right = size - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let vert = 0; vert < size; vert++) {
        for (let jj = 0; jj < 2; jj++) {
          const x = right - jj;
          const upward = ((right + 1) & 2) === 0;
          const y = upward ? size - 1 - vert : vert;
          if (!isFn[y][x] && bi < codewords.length * 8) {
            modules[y][x] = getBit(codewords[bi >>> 3], 7 - (bi & 7));
            bi++;
          }
        }
      }
    }

    const applyMask = (mask) => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
        if (isFn[y][x]) continue;
        let inv = false;
        switch (mask) {
          case 0: inv = (x + y) % 2 === 0; break;
          case 1: inv = y % 2 === 0; break;
          case 2: inv = x % 3 === 0; break;
          case 3: inv = (x + y) % 3 === 0; break;
          case 4: inv = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0; break;
          case 5: inv = (x * y) % 2 + (x * y) % 3 === 0; break;
          case 6: inv = ((x * y) % 2 + (x * y) % 3) % 2 === 0; break;
          case 7: inv = ((x + y) % 2 + (x * y) % 3) % 2 === 0; break;
        }
        if (inv) modules[y][x] = !modules[y][x];
      }
    };
    // Simplified penalty (runs + 2x2 blocks + dark ratio) — mask choice doesn't affect scannability.
    const penalty = () => {
      let score = 0;
      for (let y = 0; y < size; y++) {
        let run = 1;
        for (let x = 1; x < size; x++) {
          if (modules[y][x] === modules[y][x - 1]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
          else run = 1;
        }
      }
      for (let x = 0; x < size; x++) {
        let run = 1;
        for (let y = 1; y < size; y++) {
          if (modules[y][x] === modules[y - 1][x]) { run++; if (run === 5) score += 3; else if (run > 5) score++; }
          else run = 1;
        }
      }
      for (let y = 0; y < size - 1; y++) for (let x = 0; x < size - 1; x++) {
        const c = modules[y][x];
        if (c === modules[y][x + 1] && c === modules[y + 1][x] && c === modules[y + 1][x + 1]) score += 3;
      }
      let dark = 0;
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (modules[y][x]) dark++;
      const total = size * size;
      score += (Math.ceil(Math.abs(dark * 20 - total * 10) / total) - 1) * 10;
      return score;
    };

    let best = 0, min = Infinity;
    for (let m = 0; m < 8; m++) {
      applyMask(m); drawFormat(m);
      const p = penalty();
      if (p < min) { min = p; best = m; }
      applyMask(m); // undo
    }
    applyMask(best);
    drawFormat(best);

    return { size, modules };
  }

  return { encode };
})();

// ─── Bundled Code128 generator (Code Set B) ───────────────────────────────────
const CODE128 = (() => {
  // Standard bar/space width patterns for values 0..106 (6 modules each).
  const PATTERNS = [
    '212222','222122','222221','121223','121322','131222','122213','122312','132212','221213',
    '221312','231212','112232','122132','122231','113222','123122','123221','223211','221132',
    '221231','213212','223112','312131','311222','321122','321221','312212','322112','322211',
    '212123','212321','232121','111323','131123','131321','112313','132113','132311','211313',
    '231113','231311','112133','112331','132131','113123','113321','133121','313121','211331',
    '231131','213113','213311','213131','311123','311321','331121','312113','312311','332111',
    '314111','221411','431111','111224','111422','121124','121421','141122','141221','112214',
    '112412','122114','122411','142112','142211','241211','221114','413111','241112','134111',
    '111242','121142','121241','114212','124112','124211','411212','421112','421211','212141',
    '214121','412121','111143','111341','131141','114113','114311','411113','411311','113141',
    '114131','311141','411131','211412','211214','211232','2331112', // 106 = stop (7 widths)
  ];
  const START_B = 104, STOP = 106;

  // Returns { modules: number[] (1=bar,0=space), quiet } or null when unencodable.
  function encode(text) {
    if (!text) return null;
    const vals = [];
    for (const ch of text) {
      const code = ch.codePointAt(0);
      if (code < 32 || code > 126) return null; // Code Set B covers printable ASCII only
      vals.push(code - 32);
    }
    let sum = START_B;
    vals.forEach((v, i) => { sum += v * (i + 1); });
    const checksum = sum % 103;
    const symbols = [START_B, ...vals, checksum, STOP];

    const modules = [];
    symbols.forEach(sym => {
      const widths = PATTERNS[sym];
      for (let i = 0; i < widths.length; i++) {
        const w = parseInt(widths[i], 10);
        const bar = i % 2 === 0 ? 1 : 0; // patterns start with a bar
        for (let j = 0; j < w; j++) modules.push(bar);
      }
    });
    return { modules, quiet: 10 };
  }

  return { encode };
})();

if (!customElements.get('wc-barcode')) {
  class WcBarcode extends WcBaseComponent {
    static get observedAttributes() {
      return ['value', 'symbology', 'label', 'size', 'ec-level', 'caption', 'class'];
    }

    constructor() {
      super();
      // NB: don't append children in the constructor — that throws "must not have
      // children" when the element is created via document.createElement. Append on connect.
      this.componentElement = document.createElement('div');
      this.componentElement.classList.add('wc-barcode');
    }

    connectedCallback() {
      const existing = this.querySelector(':scope > .wc-barcode');
      if (existing) this.componentElement = existing;
      else if (!this.contains(this.componentElement)) this.appendChild(this.componentElement);
      super.connectedCallback();
      this._applyStyle();
    }

    _render() {
      super._render();
      this._draw();
    }

    _handleAttributeChange(attrName, newValue) {
      if (['value', 'symbology', 'label', 'size', 'ec-level', 'caption'].includes(attrName)) {
        this._draw();
      } else {
        super._handleAttributeChange(attrName, newValue);
      }
    }

    get value() { return this.getAttribute('value') || ''; }
    set value(val) {
      if (val == null || val === '') this.removeAttribute('value');
      else this.setAttribute('value', String(val));
      this._draw();
    }

    _escape(s) {
      return String(s == null ? '' : s)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    _draw() {
      const el = this.componentElement;
      if (!el) return;

      const value = this.getAttribute('value') || '';
      // Empty value ⇒ render nothing.
      if (!value) {
        el.innerHTML = '';
        this.removeAttribute('role');
        this.removeAttribute('aria-label');
        return;
      }

      const symbology = (this.getAttribute('symbology') || 'qr').toLowerCase();
      const labelPos = (this.getAttribute('label') || 'right').toLowerCase();
      const caption = this.getAttribute('caption') || '';
      const ecLevel = (this.getAttribute('ec-level') || 'M').toUpperCase();
      const sizeAttr = parseInt(this.getAttribute('size'), 10);

      this.setAttribute('role', 'img');
      this.setAttribute('aria-label', `barcode ${value}`);

      let codeSvg = '';
      try {
        codeSvg = symbology === 'code128'
          ? this._renderCode128(value, Number.isFinite(sizeAttr) ? sizeAttr : 64)
          : this._renderQr(value, ecLevel, Number.isFinite(sizeAttr) ? sizeAttr : 96);
      } catch (e) {
        console.error('[wc-barcode]', e);
        el.innerHTML = '';
        return;
      }

      const labelHtml = labelPos === 'none'
        ? ''
        : `<span class="barcode-label">${this._escape(value)}</span>`;
      const captionHtml = caption
        ? `<span class="barcode-caption">${this._escape(caption)}</span>`
        : '';

      el.innerHTML = `
        ${captionHtml}
        <div class="barcode-main label-${labelPos}">
          <span class="barcode-code">${codeSvg}</span>
          ${labelHtml}
        </div>`;
    }

    _renderQr(value, ecLevel, px) {
      const qr = QR.encode(value, ecLevel);
      if (!qr) return '';
      const quiet = 4;
      const dim = qr.size + quiet * 2;
      // Merge horizontal runs of dark modules into rects for a compact path.
      let rects = '';
      for (let y = 0; y < qr.size; y++) {
        let x = 0;
        while (x < qr.size) {
          if (qr.modules[y][x]) {
            let w = 1;
            while (x + w < qr.size && qr.modules[y][x + w]) w++;
            rects += `<rect x="${x + quiet}" y="${y + quiet}" width="${w}" height="1"/>`;
            x += w;
          } else x++;
        }
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${px}" height="${px}" viewBox="0 0 ${dim} ${dim}" shape-rendering="crispEdges" role="presentation">` +
        `<rect width="${dim}" height="${dim}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
    }

    _renderCode128(value, barHeight) {
      const bc = CODE128.encode(value);
      if (!bc) throw new Error(`value contains characters Code128-B can't encode: ${value}`);
      const mod = 2;   // px per narrow module
      const h = barHeight;
      const total = bc.modules.length + bc.quiet * 2;
      const width = total * mod;
      let rects = '';
      let x = 0;
      const m = bc.modules;
      while (x < m.length) {
        if (m[x]) {
          let w = 1;
          while (x + w < m.length && m[x + w]) w++;
          rects += `<rect x="${(bc.quiet + x) * mod}" y="0" width="${w * mod}" height="${h}"/>`;
          x += w;
        } else x++;
      }
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${h}" viewBox="0 0 ${width} ${h}" shape-rendering="crispEdges" role="presentation">` +
        `<rect width="${width}" height="${h}" fill="#fff"/><g fill="#000">${rects}</g></svg>`;
    }

    _applyStyle() {
      const style = `
        wc-barcode {
          display: inline-block;
        }
        .wc-barcode {
          display: inline-flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
        }
        .wc-barcode:empty {
          display: none;
        }
        .wc-barcode .barcode-caption {
          font-size: 0.75rem;
          line-height: 1.1;
          color: var(--text-1);
        }
        .wc-barcode .barcode-main {
          display: flex;
          flex-direction: row;
          align-items: center;
          gap: 8px;
        }
        .wc-barcode .barcode-main.label-bottom {
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .wc-barcode .barcode-code {
          display: inline-flex;
          background: #fff; /* code is always black-on-white for scanners */
          line-height: 0;
        }
        .wc-barcode .barcode-code svg {
          display: block;
        }
        .wc-barcode .barcode-label {
          font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
          font-weight: 600;
          font-size: 0.9rem;
          letter-spacing: 0.02em;
          white-space: nowrap;
          color: var(--text-1);
        }
        /* Clean printed label: no shadows/margins, forced black-on-white. */
        @media print {
          .wc-barcode {
            box-shadow: none !important;
            margin: 0 !important;
            background: #fff !important;
          }
          .wc-barcode .barcode-caption,
          .wc-barcode .barcode-label {
            color: #000 !important;
          }
        }
      `.trim();
      this.loadStyle('wc-barcode-style', style);
    }
  }

  customElements.define('wc-barcode', WcBarcode);
  window.WcBarcode = WcBarcode;
}
