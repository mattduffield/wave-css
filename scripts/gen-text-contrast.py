#!/usr/bin/env python3
"""
Generate the regular-mode (non-.crisp) text-contrast block in src/css/main.css.

Run:  python3 -m http.server 3015   (project root, in another shell)
      python3.12 scripts/gen-text-contrast.py
Then: npm run build && python3.12 tests/text-contrast-test.py

Every theme builds its text from its own swatch ramp (light: --text-N = --swatch-(14-N); dark:
--text-N = --swatch-N). The muted levels sit in the middle of the same ramp as the backgrounds, so they
failed WCAG on the theme's own surfaces (light --text-6 in 52/52 themes). This script measures, in the
browser, how dark (light mode) / light (dark mode) each tier of text must be to clear its target on EVERY
text surface of that theme and mode — keeping each swatch's own chroma and hue — and writes:

  per theme × mode   --wc-text-lim (text 1-6, >= 4.5:1) and --wc-text-lim-ui (text 7-9, >= 3:1)
  generic            --text-N: oklch(from var(--swatch-K) min(l, var(--wc-text-lim)) c h)   (light)
                     --text-N: oklch(from var(--swatch-K) max(l, var(--wc-text-lim)) c h)   (dark)

so text that already passes keeps its exact color and only failing levels move. Light-mode card surfaces
(--surface-5) too dark for ANY dark text to pass (coffee/sienna/chocolate) are lightened first.
Everything is inside @supports (relative color) — older browsers keep the original theme text.
"""

import os
import re
import sys

from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MAIN = os.path.join(ROOT, "src/css/main.css")
BASE = os.environ.get("WAVE_BASE", "http://localhost:3015")
BEGIN = "/* === BEGIN generated: regular-mode text contrast (scripts/gen-text-contrast.py) === */"
END = "/* === END generated: regular-mode text contrast === */"

TEXT_SURF = ["--surface-1", "--surface-2", "--surface-3", "--surface-4", "--surface-5",
             "--card-bg-color", "--container-bg-color", "--component-bg-color"]
UI_SURF = ["--surface-1", "--surface-2", "--card-bg-color", "--component-bg-color"]
TARGET, TARGET_UI = 4.6, 3.1          # a hair over 4.5 / 3 so rounding can't land under
SURF5_MIN_Y = 0.30                    # light-mode card floor (black text then >= 7:1, muted text has room

src = open(MAIN).read()
# strip any previous generated block so we measure the ORIGINAL theme tokens
if BEGIN in src:
    a = src.index(BEGIN)
    b = src.index(END) + len(END)
    src = src[:a] + src[b:].lstrip("\n")
THEMES = sorted(set(re.findall(r"^\s*\.(theme-[a-z-]+)\s*\{", src, re.M)))

MEASURE_JS = r"""
([textSurf, uiSurf, target, targetUi, mode, surf5Floor]) => {
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgb = (col) => { cv.clearRect(0,0,1,1); cv.fillStyle = '#000'; cv.fillStyle = col; cv.fillRect(0,0,1,1); const d = cv.getImageData(0,0,1,1).data; return [d[0], d[1], d[2]]; };
  const Y = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126*f(r) + 0.7152*f(g) + 0.0722*f(b); };
  const C = (y1, y2) => (Math.max(y1, y2) + 0.05) / (Math.min(y1, y2) + 0.05);
  const probe = document.createElement('i'); document.body.appendChild(probe);
  const resolve = (expr) => { probe.style.color = ''; probe.style.color = expr; return getComputedStyle(probe).color; };
  const s = getComputedStyle(document.documentElement);
  const v = (t) => s.getPropertyValue(t).trim();
  const out = { surf5: null };
  // light-mode card floor
  if (mode === 'light') {
    const y5 = Y(rgb(resolve(v('--surface-5'))));
    if (y5 < surf5Floor) {
      let lo = 0, hi = 1;
      for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; const y = Y(rgb(resolve(`oklch(from ${v('--swatch-5')} ${m} c h)`))); if (y >= surf5Floor) hi = m; else lo = m; }
      out.surf5 = Math.ceil(hi * 1000) / 1000;
      document.documentElement.style.setProperty('--surface-5', `oklch(from var(--swatch-5) ${out.surf5} c h)`);
    }
  }
  const surfY = (list) => list.map(t => Y(rgb(resolve(getComputedStyle(document.documentElement).getPropertyValue(t).trim())))).filter(y => !isNaN(y));
  const tY = surfY(textSurf), uY = surfY(uiSurf);
  const sw = (n) => v('--swatch-' + n);
  // swatch feeding text level N
  const swOf = (n) => mode === 'light' ? sw(14 - n) : sw(n);
  const limitFor = (levels, ys, tgt) => {
    // light: the LARGEST L (all swatches of the tier) that still passes; dark: the SMALLEST
    let lim = mode === 'light' ? 1 : 0;
    for (const n of levels) {
      const pass = (L) => { const y = Y(rgb(resolve(`oklch(from ${swOf(n)} ${L} c h)`))); return ys.every(b => C(y, b) >= tgt); };
      let lo = 0, hi = 1;
      if (mode === 'light') { for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (pass(m)) lo = m; else hi = m; } lim = Math.min(lim, lo); }
      else { for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (pass(m)) hi = m; else lo = m; } lim = Math.max(lim, hi); }
    }
    return mode === 'light' ? Math.floor(lim * 1000) / 1000 : Math.ceil(lim * 1000) / 1000;
  };
  out.lim = limitFor([1, 2, 3, 4, 5, 6], tY, target);
  out.limUi = limitFor([7, 8, 9], uY, targetUi);
  document.documentElement.style.removeProperty('--surface-5');
  probe.remove();
  return out;
}
"""

results = {}
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page()
    # measure against the ORIGINAL theme CSS (the built file minus this block)
    page.set_content(f"<html><head><style>{src}</style></head><body></body></html>")
    page.wait_for_timeout(500)
    for mode in ["light", "dark"]:
        for t in THEMES:
            got = []
            for cls, scheme in [(f"{t} {mode}", "light"), (t, mode)]:   # forced mode, and OS-following
                page.emulate_media(color_scheme=scheme)
                page.evaluate(f"document.documentElement.className = '{cls}'")
                got.append(page.evaluate(MEASURE_JS, [TEXT_SURF, UI_SURF, TARGET, TARGET_UI, mode, SURF5_MIN_Y]))
            pick = min if mode == "light" else max
            s5 = [g["surf5"] for g in got if g["surf5"] is not None]
            results[(t, mode)] = {"lim": pick(g["lim"] for g in got), "limUi": pick(g["limUi"] for g in got),
                                  "surf5": max(s5) if s5 else None}
    browser.close()

ALL = ", ".join("." + t for t in THEMES)


LIGHT_STATUS = {"success": ("#16a34a", "#22c55e"), "danger": ("#dc2626", "#ef4444"),
                "warning": ("#d97706", "#f59e0b"), "info": ("#2563eb", "#3b82f6")}
DARK_STATUS = {"success": ("#22c55e", "#4ade80"), "danger": ("#ef4444", "#f87171"),
               "warning": ("#f59e0b", "#fbbf24"), "info": ("#3b82f6", "#60a5fa")}
HC_DARK_STATUS = {"success": ("#00d000", "#66ff66"), "danger": ("#ff2020", "#ff7070"),
                  "warning": ("#ffaa00", "#ffd060"), "info": ("#00ccff", "#66e0ff")}


def status(table, indent="    "):
    return "\n".join(f"{indent}--{k}-color: {a};\n{indent}--{k}-light-color: {b};" for k, (a, b) in table.items())


def tokens(mode):
    op = "min" if mode == "light" else "max"
    lines = []
    for n in range(1, 10):
        k = 14 - n if mode == "light" else n
        lim = "--wc-text-lim" if n <= 6 else "--wc-text-lim-ui"
        fallback = "1" if mode == "light" else "0"
        lines.append(f"    --text-{n}: oklch(from var(--swatch-{k}) {op}(l, var({lim}, {fallback})) c h);")
    lines.append("    /* form outlines (inputs, checkboxes, radios, toggles) >= 3:1 — the lightest guaranteed level */")
    lines += ["    --component-border-color: var(--text-9);", "    --checkbox-border: var(--text-9);", "    --radio-border: var(--text-9);"]
    lines.append("    /* status colors follow the page's mode (Wave's defaults follow the OS) */")
    lines.append(status(LIGHT_STATUS if mode == "light" else DARK_STATUS))
    return "\n".join(lines)


def per_theme(mode):
    rows = []
    for t in THEMES:
        r = results[(t, mode)]
        body = f"--wc-text-lim: {r['lim']}; --wc-text-lim-ui: {r['limUi']};"
        if r.get("surf5") is not None:
            body += f" --surface-5: oklch(from var(--swatch-5) {r['surf5']} c h);"
        rows.append((t, body))
    return rows


def block():
    out = [BEGIN,
           "/* Regular (non-.crisp) themes: text levels 1-6 >= 4.5:1 and 7-9 >= 3:1 on every text surface of",
           "   the theme in light AND dark. Each level keeps its own swatch's hue and chroma and only gets darker",
           "   (light) / lighter (dark) where it would fail — text that already passed is unchanged. Limits are",
           "   measured per theme × mode by scripts/gen-text-contrast.py; re-run it after changing a theme's",
           "   swatches. Forced modes (.light/.dark on the theme element) and OS-following (no mode class) are",
           "   both covered. .crisp is unaffected (unlayered, owns its own text). Gate: tests/text-contrast-test.py */",
           "@supports (color: oklch(from red l c h)) {",
           "  @layer wc.colors {"]
    for mode, other, scheme in [("light", "dark", "light"), ("dark", "light", "dark")]:
        out.append(f"    /* ---- {mode} ---- */")
        out.append(f"    :is({ALL}).{mode} {{")
        out.append("  " + tokens(mode).replace("\n", "\n  "))
        out.append("    }")
        for t, body in per_theme(mode):
            out.append(f"    .{t}.{mode} {{ {body} }}")
        out.append(f"    @media (prefers-color-scheme: {scheme}) {{")
        out.append(f"      :is({ALL}):not(.{other}):not(.{mode}) {{")
        out.append("    " + tokens(mode).replace("\n", "\n    "))
        out.append("      }")
        for t, body in per_theme(mode):
            out.append(f"      .{t}:not(.{other}):not(.{mode}) {{ {body} }}")
        out.append("    }")
    hc = status(HC_DARK_STATUS, "").replace("\n", " ")
    out.append("    /* high-contrast keeps its own AAA-saturated status set in dark */")
    out.append(f"    .theme-high-contrast.dark {{ {hc} }}")
    out.append(f"    @media (prefers-color-scheme: dark) {{ .theme-high-contrast:not(.light):not(.dark) {{ {hc} }} }}")
    out += ["  }", "}"]
    Y = "(0.2126*pow((clamp(0,r,255)/255 + 0.055)/1.055, 2.4) + 0.7152*pow((clamp(0,g,255)/255 + 0.055)/1.055, 2.4) + 0.0722*pow((clamp(0,b,255)/255 + 0.055)/1.055, 2.4))"
    ch = f"clamp(0, (0.179 - {Y}) * 1000000000, 255)"
    ink = lambda v: f"rgb(from var({v}) {ch} {ch} {ch})"
    out += ["/* Text ON a colored fill: black or white picked from the fill's own luminance (WCAG crossover",
            "   Y≈0.179) — AA on every theme's fill. --wc-on-primary = text on --primary-bg-color (primary badge,",
            "   accent-fill fallback, wc-table/fx headers); hover + disabled button labels; components that paint",
            "   --button-color ON --button-bg-color. Also defined on .crisp so a nested crisp re-resolves it. */",
            "@supports (color: rgb(from white r g b)) and (width: calc(pow(2, 2) * 1px)) {",
            "  @layer wc.colors {",
            f"    :is({ALL}), .crisp {{",
            f"      --wc-on-primary: {ink('--primary-bg-color')};",
            f"      --button-hover-color: {ink('--button-hover-bg-color')};",
            f"      /* disabled: the legible ink, eased 25% toward the fill so it still reads as disabled (>= 3:1) */",
            f"      --button-disabled-color: color-mix(in srgb, {ink('--button-disabled-bg-color')} 75%, var(--button-disabled-bg-color));",
            "    }",
            "    :is(.wc-accordion .accordion-header, .wc-dropdown .dropbtn, .wc-ai-bot-nano-btn) {",
            f"      --button-color: {ink('--button-bg-color')};",
            "    }",
            "  }",
            "}",
            END, ""]
    return "\n".join(out)


gen = block()
anchor = "@layer wc.colors {"
i = src.index(anchor)
src = src[:i] + gen + "\n" + src[i:]
open(MAIN, "w").write(src)
fixed = sorted({t for (t, m), r in results.items() if r.get("surf5") is not None})
print(f"wrote {len(THEMES)} themes × 2 modes; light card surface lightened for: {', '.join(fixed) or 'none'}")
