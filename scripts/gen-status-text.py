#!/usr/bin/env python3
"""
Generate the per-theme mix shares behind the readable status text classes.

Run:  python3 -m http.server 3015   (project root, other shell)
      python3.12 scripts/gen-status-text.py
Then: npm run build && python3.12 tests/status-text-test.py

.on-surface-success (etc.) and the status TEXT classes (.success-color, .success-light-color, … and their
hover:/focus:/focus-visible:/active: variants) render the state color mixed toward --text-1:
    color-mix(in srgb, var(--success-color) var(--wc-on-surface-success-mix, 55%), var(--text-1, #111))
55% is the historic .on-surface-* share; it is not readable everywhere (2.45:1 on lemon dark, 1.86:1 for
warning-light on designer). This script measures, per theme × mode (forced and OS-following) × family
(regular, .crisp), the LARGEST share <= 55% that clears 4.6:1 on --surface-1…5, --card-bg-color and
--container-bg-color, and writes it only where it is below 55% — states where 55% already passes get no
variable, so .on-surface-* is unchanged there. The --success-color/… tokens are never touched.
"""

import os
import re

from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MAIN = os.path.join(ROOT, "src/css/main.css")
BASE = os.environ.get("WAVE_BASE", "http://localhost:3015")
BEGIN = "/* === BEGIN generated: status text mix (scripts/gen-status-text.py) === */"
END = "/* === END generated: status text mix === */"
SURF = ["--surface-1", "--surface-2", "--surface-3", "--surface-4", "--surface-5", "--card-bg-color", "--container-bg-color"]
KEYS = [f"{k}{v}" for k in ["success", "danger", "warning", "info"] for v in ["", "-light"]]
TARGET = 4.6
MODES = [("light", "light", "forced"), ("dark", "dark", "forced"), ("light", "light", "auto"), ("dark", "dark", "auto")]

src = open(MAIN).read()
if BEGIN in src:
    a = src.index(BEGIN); b = src.index(END) + len(END)
    src = src[:a].rstrip("\n") + "\n" + src[b:].lstrip("\n")
THEMES = sorted(set(re.findall(r"^\s*\.(theme-[a-z-]+)\s*\{", src, re.M)))

JS = r"""
([keys, surf, target]) => {
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const x = document.getElementById('x');
  const col = (e) => { x.style.color = ''; x.style.color = e; return getComputedStyle(x).color; };
  const rgb = (c) => { cv.clearRect(0,0,1,1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0,0,1,1); return cv.getImageData(0,0,1,1).data; };
  const lum = (c) => { const d = rgb(c); const f = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(d[0])+0.7152*f(d[1])+0.0722*f(d[2]); };
  const C = (a, b) => { const A = lum(a), B = lum(b); return (Math.max(A,B)+.05)/(Math.min(A,B)+.05); };
  const bgs = surf.map(s => col(`var(${s})`));
  const out = {};
  // badge text sits on the badge's 15% tint over the surface
  const TINT = { success: [34, 197, 94], warning: [245, 158, 11], danger: [239, 68, 68], info: [59, 130, 246] };
  const over = (t, c) => { const d = rgb(c); return `rgb(${[0,1,2].map(i => Math.round(t[i]*0.15 + d[i]*0.85)).join(',')})`; };
  for (const k of Object.keys(TINT)) {
    const tb = bgs.map(b => over(TINT[k], b));
    const ok = (pc, ink, t = target) => { const fg = col(`color-mix(in srgb, var(--${k}-color) ${pc}%, ${ink})`); return tb.every(b => C(fg, b) >= t); };
    let pc = 55, ink = 'var(--text-1, #111)';
    while (pc > 0 && !ok(pc, ink)) pc--;
    if (!ok(pc, ink)) {          // even pure --text-1 can't: mix toward pure black or white instead
      // a background right at the black/white crossover can't give 4.6 — accept the real 4.5 here
      for (const t of [target, 4.55, 4.5]) {   // keep a little margin when the crossover allows it
        for (const k2 of ['#ffffff', '#000000']) { let q = 55; while (q > 0 && !ok(q, k2, t)) q--; if (ok(q, k2, t)) { ink = k2; pc = q; break; } }
        if (ink[0] === '#') break;
      }
    }
    out['badge-' + k] = pc;
    if (ink[0] === '#') out['badge-' + k + '-ink'] = ink;
  }
  // wc-dropdown grid-round icon: the theme's primary color on a header background — the largest share of
  // --primary-bg-color (100% = the plain primary) mixed toward --text-1 that reaches 3:1 on every header surface
  {
    const hb = ['--surface-1', '--surface-2', '--component-bg-color', '--container-bg-color', '--card-bg-color'].map(t => col(`var(${t})`));
    const ok = (pc, t) => { const fg = col(`color-mix(in srgb, var(--primary-bg-color) ${pc}%, var(--text-1, #111))`); return hb.every(b => C(fg, b) >= t); };
    let pc = 100; while (pc > 0 && !ok(pc, 3.1)) pc--;
    if (!ok(pc, 3.1)) { pc = 100; while (pc > 0 && !ok(pc, 3.0)) pc--; }
    out['dropdown-grid'] = pc;
  }
  // static text color on --primary-bg-color: what the --wc-on-primary formula gives in a working browser,
  // so text-on-primary rules don't depend on relative color + pow() (some Chrome versions get it wrong)
  out['on-primary'] = col('var(--wc-on-primary, rgb(1, 2, 3))');
  // ...but only where the fill can't move: an app may re-hue a theme (Informa Events tenants set --hue), and a
  // static pick for the theme's own hue would be wrong for another. Re-hue and keep it only if the fill is fixed.
  {
    const de = document.documentElement, fill = col('var(--primary-bg-color)'), prev = de.style.getPropertyValue('--hue');
    const moves = [17, 133, 251, 307].some(h => { de.style.setProperty('--hue', String(h)); return col('var(--primary-bg-color)') !== fill; });
    if (prev) de.style.setProperty('--hue', prev); else de.style.removeProperty('--hue');
    if (moves) out['on-primary'] = 'follows-hue';
  }
  // Text on the primary fill, regular themes: a black/white ink that passes on the fill at the theme's own hue AND
  // at every tenant hue (apps re-hue themes), formula-free. Prefer the formula's own pick (pixel-identical where it
  // was already used). Then flag which original text colors fail on the fill, so rules only change where they fail.
  {
    const de = document.documentElement, prev = de.style.getPropertyValue('--hue');
    const ORIG = ['--primary-color', '#fff', '--surface-1', '--text-1', '--text-5'];
    const snap = () => [col('var(--primary-bg-color)'), ORIG.map(t => col(t.startsWith('--') ? `var(${t})` : t))];
    const own = snap(), snaps = [own];
    for (let h = 0; h < 360; h += 10) { de.style.setProperty('--hue', String(h)); snaps.push(snap()); }
    if (prev) de.style.setProperty('--hue', prev); else de.style.removeProperty('--hue');
    const robust = (ink) => snaps.every(([f]) => C(ink, f) >= 4.5);
    const pick = col('var(--wc-on-primary, rgb(1, 2, 3))');
    const first = /\b0,? 0,? 0\b|srgb 0 0 0/.test(pick) ? '#000' : '#fff';
    const second = first === '#000' ? '#fff' : '#000';
    out['primary-ink'] = robust(first) ? first : robust(second) ? second : 'formula';
    // an original text color "fails" if it is under 4.5:1 on the fill at the theme's own hue or at any tenant hue
    out['primary-fails'] = ORIG.filter((t, i) => snaps.some(([f, cols]) => C(cols[i], f) < 4.5));
  }
  for (const k of keys) {
    const ok = (pc) => { const fg = col(`color-mix(in srgb, var(--${k}-color) ${pc}%, var(--text-1, #111))`); return bgs.every(b => C(fg, b) >= target); };
    let pc = 55; while (pc > 0 && !ok(pc)) pc--;
    out[k] = pc;          // 0 = pure --text-1 (always readable: the text ramp guarantees it)
  }
  return out;
}
"""

res = {}
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.set_content(f"<html><head><style>{src}</style></head><body><i id='x'></i></body></html>")
    pg.wait_for_timeout(400)
    for fam in ["regular", "crisp"]:
        for mode, os_, how in MODES:
            pg.emulate_media(color_scheme=os_)
            for t in THEMES:
                cls = " ".join(x for x in [t, mode if how == "forced" else "", "crisp" if fam == "crisp" else ""] if x)
                pg.evaluate(f"document.documentElement.className = '{cls}'")
                res[(t, mode, how, fam)] = pg.evaluate(JS, [KEYS, SURF, TARGET])
    b.close()


def sel(t, mode, how, fam):
    other = "dark" if mode == "light" else "light"
    s = f".{t}.{mode}" if how == "forced" else f".{t}:not(.{mode}):not(.{other})"
    return s + (".crisp" if fam == "crisp" else ":not(.crisp)")


lines = [BEGIN,
         "/* Largest share of each status color (<= 55%) that keeps .on-surface-* and the status text classes",
         "   >= 4.5:1 on surface-1…5, card and container — written ONLY where 55% fails; elsewhere the var",
         "   is unset and the classes use 55% (unchanged). --wc-badge-*-mix: the same for badge text, measured on",
         "   the badge's 15% tint over each surface. --wc-dropdown-grid-auto: the wc-dropdown grid-round icon color",
         "   where the plain --primary-bg-color is under 3:1 on a header surface. --wc-on-primary-static: black or white",
         "   for text on --primary-bg-color — the value the --wc-on-primary formula gives in a working browser, written",
         "   statically so text-on-primary rules don't depend on relative color + pow(); ONLY where the fill doesn't follow",
         "   --hue (an app may re-hue a theme). Regular themes also get --wc-on-primary-ink (black/white that passes on",
         "   the fill at every --hue, formula-free) and --wc-on-primary-text / -white / -surface / -text1 / -text5 where",
         "   --primary-color / #fff / --surface-1 / --text-1 / --text-5 FAIL on the fill at the theme's hue or any tenant",
         "   --hue (unset where they pass → rules unchanged). Generated by scripts/gen-status-text.py. */",
         "@layer wc.colors {"]
media = {"light": [], "dark": []}
n = 0
for (t, mode, how, fam), r in sorted(res.items()):
    def one(k, v):
        if k == "primary-ink":
            return ""   # written with primary-fails below
        if k == "primary-fails":
            return ""
        if k == "on-primary":
            return {"rgb(0, 0, 0)": "--wc-on-primary-static: #000;", "color(srgb 0 0 0)": "--wc-on-primary-static: #000;",
                    "rgb(255, 255, 255)": "--wc-on-primary-static: #fff;", "color(srgb 1 1 1)": "--wc-on-primary-static: #fff;"}.get(v, "")
        if k == "dropdown-grid":
            return f"--wc-dropdown-grid-auto: color-mix(in srgb, var(--primary-bg-color) {v}%, var(--text-1, #111));" if v < 100 else ""
        if k.endswith("-ink"):
            return f"--wc-{k}: {v};"
        if v >= 55:
            return ""
        return f"--wc-{k}-mix: {v}%;" if k.startswith("badge-") else f"--wc-on-surface-{k}-mix: {v}%;"
    decl = " ".join(d for d in (one(k, v) for k, v in r.items()) if d)
    if fam == "regular":
        ink = "var(--wc-on-primary-static, var(--wc-on-primary))" if r["primary-ink"] == "formula" else r["primary-ink"]
        extra = [f"--wc-on-primary-ink: {ink};"]
        for tok, name in [("--primary-color", "text"), ("#fff", "white"), ("--surface-1", "surface"), ("--text-1", "text1"), ("--text-5", "text5")]:
            if tok in r["primary-fails"]:
                extra.append(f"--wc-on-primary-{name}: {ink};")
        decl = (decl + " " + " ".join(extra)).strip()
    if not decl:
        continue
    n += 1
    if how == "forced":
        lines.append(f"  {sel(t, mode, how, fam)} {{ {decl} }}")
    else:
        media[mode].append(f"    {sel(t, mode, how, fam)} {{ {decl} }}")
for mode in ["light", "dark"]:
    if media[mode]:
        lines.append(f"  @media (prefers-color-scheme: {mode}) {{")
        lines += media[mode]
        lines.append("  }")
lines += ["}", END, ""]
anchor = "@layer wc.colors {"
i = src.index(anchor)
src = src[:i] + "\n".join(lines) + "\n" + src[i:]
open(MAIN, "w").write(src)
lowest = {k: min(r[k] for r in res.values()) for k in KEYS + [f"badge-{b}" for b in ["success", "warning", "danger", "info"]]}
lowest["dropdown-grid"] = min(r["dropdown-grid"] for r in res.values())
lowest["dropdown-grid-states"] = sum(1 for r in res.values() if r["dropdown-grid"] < 100)
lowest["on-primary-static"] = sum(1 for r in res.values() if r["on-primary"] in ("rgb(0, 0, 0)", "rgb(255, 255, 255)", "color(srgb 0 0 0)", "color(srgb 1 1 1)"))
lowest["on-primary-follows-hue"] = sum(1 for r in res.values() if r["on-primary"] == "follows-hue")
lowest["on-primary-static-themes"] = sorted({t for (t, m, h, f), r in res.items() if r["on-primary"] != "follows-hue"})
lowest["primary-ink-formula-fallbacks"] = sum(1 for (t, m, h, f), r in res.items() if f == "regular" and r["primary-ink"] == "formula")
lowest["primary-fails"] = {n: sum(1 for (t, m, h, f), r in res.items() if f == "regular" and n in r["primary-fails"]) for n in ["--primary-color", "#fff", "--surface-1", "--text-1", "--text-5"]}
lowest["ink-overrides"] = sum(1 for r in res.values() for k in r if k.endswith("-ink"))
print(f"{n} theme×mode×family states need a smaller share; lowest share per key: {lowest}")
