#!/usr/bin/env python3
"""
Generate the component contrast-fix block at the end of src/css/main.css.

Run:  python3 -m http.server 3015            (project root, other shell)
      npm run build                           (so dist/ has the components)
      python3.12 scripts/gen-component-contrast.py
      npm run build && python3.12 tests/component-contrast-test.py

ADDITIVE ONLY. Nothing in a component changes. For every entry in REGISTRY the script renders
views/visual-reference.html in every theme × {forced light, forced dark, follow the OS} × {OS light,
OS dark} × {regular, .crisp}, measures the element with its ORIGINAL color, and only where it fails
(text < 4.5:1, icons/borders/chip "×" < 3:1) tries the candidate colors in order and keeps the first
that passes for every instance. It then writes one unlayered rule per (fix, chosen color):

    :is(<the exact theme+mode+family states that failed>) <element> { color: <candidate>; }

so passing states are untouched (no rule matches) and failing ones get the smallest readable fix.
A fix needed in every state collapses to one unconditional rule.

Candidate placeholders: {O} = the element's own original color measured in that state;
{INK} = black or white, whichever reads on the element's measured background.
"""

import json
import os
import re
import sys
from collections import defaultdict

from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MAIN = os.path.join(ROOT, "src/css/main.css")
BASE = os.environ.get("WAVE_BASE", "http://localhost:3015")
BEGIN = "/* === BEGIN generated: component contrast fixes (scripts/gen-component-contrast.py) === */"
END = "/* === END generated: component contrast fixes === */"

Y = "(0.2126*pow((clamp(0,r,255)/255 + 0.055)/1.055, 2.4) + 0.7152*pow((clamp(0,g,255)/255 + 0.055)/1.055, 2.4) + 0.0722*pow((clamp(0,b,255)/255 + 0.055)/1.055, 2.4))"
CH = f"clamp(0, (0.179 - {Y}) * 1000000000, 255)"


def ink(fill):
    """black or white picked from a fill expression's luminance (same crossover as --wc-on-primary)"""
    return f"rgb(from {fill} {CH} {CH} {CH})"


ON_SURFACE = ["color-mix(in srgb, {O} 55%, var(--text-1))", "color-mix(in srgb, {O} 30%, var(--text-1))",
              "var(--text-1)", "{INK}"]
ACCENT_TEXT = ["color-mix(in srgb, var(--primary-bg-color) 55%, var(--text-1))",
               "color-mix(in srgb, var(--primary-bg-color) 30%, var(--text-1))", "var(--text-1)", "{INK}"]
ON_PRIMARY = ["var(--wc-on-primary)", ink("var(--primary-bg-color)"), "{INK}"]
GRAY_TEXT = ["var(--text-2)", "var(--text-1)", "{INK}"]

# id, component wrapper (data-comp), element selector (global, as the fix rule targets it),
# property, [(measure selector inside the element's wrapper, kind, need)], candidates
REGISTRY = [
    # 1. text/icons ON an accent or colored fill → black/white from the fill
    ("select-chip", "wc-select-chip", "wc-select .chip", "color",
     [("wc-select .chip", "text", 4.5), ("wc-select .chip-close", "text", 3)], ON_PRIMARY),
    ("pivot-zone-chip", "wc-pivot", ".pivot-zone-chip", "color",
     [(".pivot-zone-chip > *", "text", 4.5)], ON_PRIMARY),
    ("wizard-active", "wc-wizard", ".wc-wizard-indicator.active", "color",
     [(".wc-wizard-indicator.active", "text", 4.5), (".wc-wizard-indicator.active svg", "icon", 3)], ON_PRIMARY),
    ("sidenav-buttons", "wc-sidenav", "wc-sidenav :is(.closebtn, .openbtn)", "color",
     [(".closebtn", "text", 4.5), (".openbtn span", "text", 4.5)], ON_PRIMARY),
    ("calendar-event", "wc-calendar", ".wc-calendar-event", "color",
     [(".wc-calendar-event > *", "text", 4.5)],
     [ink("var(--event-color, var(--primary-bg-color))")]),
    ("gantt-bar-label", "wc-gantt", ".wc-gantt-bar .wc-gantt-bar-label", "color",
     [(".wc-gantt-bar-label", "text", 4.5)], [ink("var(--bar-color, var(--primary-bg-color))")]),
    ("sidebar-link", "wc-sidebar", "wc-sidebar .wc-sidebar a", "color",
     [("wc-sidebar .wc-sidebar a", "text", 4.5)], [ink("var(--background-color)"), "{INK}"]),
    ("sidenav-link", "wc-sidenav", "wc-sidenav .wc-sidenav.sidenav a", "color",
     [(".wc-sidenav.sidenav a", "text", 4.5)], [ink("var(--background-color)"), "{INK}"]),
    ("tabulator-header", "wc-tabulator", ".wc-tabulator.tabulator .tabulator-header .tabulator-col", "color",
     [(".tabulator-col-title", "text", 4.5)], [ink("var(--card-border-color)"), "{INK}"]),
    # 2. accent-colored text / borders on a surface → the .on-surface-accent mix
    ("help-trigger", "wc-help-drawer", ".help-drawer-trigger", "color",
     [(".help-drawer-trigger", "text", 4.5)], ACCENT_TEXT),
    ("help-trigger-border", "wc-help-drawer", ".help-drawer-trigger", "border-color",
     [(".help-drawer-trigger", "border", 3)], ACCENT_TEXT),
    ("chart-builder-add", "wc-chart-builder", ".chart-builder-add-btn", "color",
     [(".chart-builder-add-btn", "text", 4.5)], ACCENT_TEXT),
    ("pivot-field-zone", "wc-pivot", ".pivot-panel-field-zone", "color",
     [(".pivot-panel-field-zone", "text", 4.5)], ACCENT_TEXT),
    ("markdown-link", "wc-markdown-viewer", ".wc-markdown-viewer a", "color",
     [(".wc-markdown-viewer a", "text", 4.5)], ACCENT_TEXT),
    ("file-upload-browse", "wc-file-upload", ".wc-file-upload-browse", "color",
     [(".wc-file-upload-browse", "text", 4.5)], ACCENT_TEXT),
    ("cron-expression", "wc-cron-picker", ".cron-expression", "color",
     [(".cron-expression", "text", 4.5)], ON_SURFACE),
    ("menu-link", "wc-menu", "wc-menu .wc-menu a", "color",
     [("wc-menu .wc-menu a", "text", 4.5)], ON_SURFACE),
    ("rating-icon", "wc-rating", ".wc-rating-star", "color",
     [(".wc-rating-star svg", "icon", 3)], ON_SURFACE),
    # 3. fixed gray fallbacks (undefined --text-color/--surface-* tokens) → readable text tokens
    ("pivot-panel-text", "wc-pivot", ":is(.pivot-panel-header, .pivot-panel-field)", "color",
     [(".pivot-panel-header", "text", 4.5), (".pivot-panel-field-name", "text", 4.5)], GRAY_TEXT),
    ("pivot-th", "wc-pivot", ".pivot-table th:not(.pivot-total-header):not(.pivot-row-header)", "color",
     [(".pivot-table th:not(.pivot-total-header):not(.pivot-row-header)", "text", 4.5)], GRAY_TEXT),
    ("pivot-row-header", "wc-pivot", ".pivot-table th.pivot-row-header", "color",
     [(".pivot-table th.pivot-row-header", "text", 4.5)], GRAY_TEXT),
    ("pivot-cell", "wc-pivot", ".pivot-table td.pivot-cell", "color",
     [(".pivot-table td.pivot-cell", "text", 4.5)], GRAY_TEXT),
    ("pivot-label", "wc-pivot", ".pivot-table td.pivot-row-label", "color",
     [(".pivot-table td.pivot-row-label", "text", 4.5)], GRAY_TEXT),
    ("pivot-totals", "wc-pivot", ".pivot-table :is(.pivot-row-total, .pivot-col-total, .pivot-total-label, .pivot-total-header)", "color",
     [(".pivot-table :is(.pivot-row-total, .pivot-col-total, .pivot-total-label, .pivot-total-header)", "text", 4.5)], GRAY_TEXT),
    ("pivot-grand-total", "wc-pivot", ".pivot-table .pivot-grand-total", "color",
     [(".pivot-table .pivot-grand-total", "text", 4.5)], GRAY_TEXT),
    ("pivot-field-type", "wc-pivot", ".pivot-panel-field-type", "color",
     [(".pivot-panel-field-type", "text", 4.5)], ["{INK}"]),
    ("doctree-key", "wc-document-tree", ":is(.doctree-key, .doctree-arrow-active)", "color",
     [(".doctree-key", "text", 4.5), (".doctree-arrow-active", "text", 4.5)], GRAY_TEXT),
    ("explain-text", "wc-explain-tree", ":is(.explain-node-name, .explain-metric-value)", "color",
     [(".explain-node-name", "text", 4.5), (".explain-metric-value", "text", 4.5)], GRAY_TEXT),
    ("split-grip", "wc-split-pane", ".wc-split-grip", "color",
     [(".wc-split-grip svg", "icon", 3)], ["var(--text-1)", "{INK}"]),
    ("contact-chip-close", "wc-contact-chip", ".wc-contact-chip .close-btn", "color",
     [(".close-btn", "text", 4.5)], ["var(--text-5)", "var(--text-2)", "{INK}"]),
    ("cron-select-border", "wc-cron-picker", "wc-cron-picker select", "border-color",
     [("select", "border", 3)], ["var(--text-9)", "var(--text-6)", "{INK}"]),
    # 4. status / syntax colors used as text on a surface → mix toward --text-1 (keeps the hue)
    ("explain-summary-good", "wc-explain-tree", ".explain-summary-good", "color",
     [(".explain-summary-good", "text", 4.5)], ON_SURFACE),
]
REGISTRY += [
    ("tabulator-placeholder", "wc-tabulator-empty", ".wc-tabulator.tabulator .tabulator-placeholder-contents", "color",
     [(".tabulator-placeholder-contents", "text", 4.5)], ["var(--text-2)", "var(--text-1)", "{INK}"]),
    ("tabulator-footer", "wc-tabulator-paged",
     ".wc-tabulator.tabulator .tabulator-footer :is(.tabulator-page-counter, .tabulator-page:not(.active))", "color",
     [(".tabulator-page-counter", "text", 4.5), (".tabulator-page:not(.active)", "text", 4.5)],
     ["var(--text-2)", "var(--text-1)", "{INK}"]),
    # the highlighted/hovered row only exists while the dropdown is open: measured on a probe painted with
    # the same tokens (--primary-color on --primary-bg-color), applied to the real rows
    # the open dropdown's search box: its FOCUSED border (the generator and the test open the dropdown)
    ("select-input-focus-border", "wc-select-chip", "wc-select .dropdown-input:focus", "border-color",
     [(".dropdown-input", "border", 3)], ["var(--text-9)", "var(--text-6)", "{INK}"], "wc-select .dropdown-input"),
    ("select-option-active", "wc-select-option-probe", "wc-select :is(.option.highlighted, .option:hover)", "color",
     [(".vr-onprimary-probe", "text", 4.5)], ON_PRIMARY, ".vr-onprimary-probe"),
]
for v in ["warn", "danger", "neutral"]:
    REGISTRY.append((f"explain-summary-{v}", "wc-explain-tree-variants", f".explain-summary-{v}", "color",
                     [(f".explain-summary-{v}", "text", 4.5)], ON_SURFACE))
for t in ["string", "number", "boolean", "null", "date"]:
    REGISTRY.append((f"doctree-{t}", "wc-document-tree", f".doctree-type-{t}", "color",
                     [(f".doctree-type-{t}", "text", 4.5)], ON_SURFACE))
for t in ["objectid", "object", "array"]:
    REGISTRY.append((f"doctree-{t}", "wc-document-tree-variants", f".doctree-type-{t}", "color",
                     [(f".doctree-type-{t}", "text", 4.5)], ON_SURFACE))
REGISTRY.append(("markdown-code", "wc-markdown-viewer", ".wc-markdown-viewer code[class*=\"language-\"]", "color",
                 [("code[class*=\"language-\"]", "text", 4.5)], ["var(--text-1)", "{INK}"]))
for t in ["punctuation", "interpolation-punctuation", "template-punctuation", "operator", "property", "number",
          "boolean", "constant", "string", "class-name", "function", "comment", "keyword", "null", "parameter",
          "interpolation"]:
    REGISTRY.append((f"prism-{t}", "wc-markdown-viewer", f".wc-markdown-viewer .token.{t}", "color",
                     [(f".token.{t}", "text", 4.5)], ON_SURFACE))
REGISTRY.append(("codemirror-monokai-keyword", "wc-code-mirror", ".cm-s-monokai span.cm-keyword", "color",
                 [(".cm-keyword", "text", 4.5)], ON_SURFACE))
for b in ["success", "warning", "danger", "info"]:
    REGISTRY.append((f"badge-{b}", "*", f".badge-{b}", "color", [(f".badge-{b}", "text", 4.5)], ON_SURFACE))

MODES = [("light", "light", "light"), ("light", "dark", "light"), ("dark", "dark", "dark"),
         ("dark", "light", "dark"), ("light", "light", ""), ("dark", "dark", "")]  # (mode, OS, class)
FAMILIES = ["regular", "crisp"]

MEASURE_JS = r"""
([entries]) => {
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (col) => { cv.clearRect(0,0,1,1); cv.fillStyle = '#000'; cv.fillStyle = col; cv.fillRect(0,0,1,1); const d = cv.getImageData(0,0,1,1).data; return [d[0],d[1],d[2],d[3]/255]; };
  const lum = ([r,g,b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const over = (top, under) => [0,1,2].map(i => top[i]*top[3] + under[i]*(1-top[3])).concat(1);
  const bgOf = (el) => { const layers = [];
    for (let n = el; n; n = n.parentElement) { const cs = getComputedStyle(n);
      if (cs.backgroundImage && cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return null;
      const v = rgba(cs.backgroundColor); if (v[3] === 0) continue; layers.push(v); if (v[3] >= .999) break; }
    let out = layers.length && layers[layers.length-1][3] >= .999 ? layers.pop() : rgba(getComputedStyle(document.body).backgroundColor);
    for (let i = layers.length-1; i >= 0; i--) out = over(layers[i], out); return out; };
  const ratio = (fg, bg) => { const f = over(rgba(fg), bg); const a = lum(f), b = lum(bg); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05); };
  const visible = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0.05; };
  const paints = (svg) => [...svg.querySelectorAll('path, circle, rect, polygon, polyline, line, ellipse, use, text')].map(s => { const cs = getComputedStyle(s);
      return cs.fill && cs.fill !== 'none' && !/url\(/.test(cs.fill) ? cs.fill : (cs.stroke && cs.stroke !== 'none' ? cs.stroke : null); }).filter(Boolean);
  const measureOne = (el, kind) => {
    if (!visible(el)) return null;
    if (kind === 'icon') { const bg = bgOf(el.parentElement); if (!bg) return null; const ps = paints(el).filter(p => rgba(p)[3] > 0); return ps.length ? Math.max(...ps.map(p => ratio(p, bg))) : null; }
    if (kind === 'border') { const bg = bgOf(el.parentElement); const c = getComputedStyle(el).borderTopColor; if (!bg || rgba(c)[3] === 0) return null; return ratio(c, bg); }
    if (!el.textContent.trim()) return null; const bg = bgOf(el); if (!bg) return null; return ratio(getComputedStyle(el).color, bg);
  };
  const inkFor = (el) => { const bg = bgOf(el) || [255,255,255,1]; const L = lum(bg); return (L + .05) / .05 >= 1.05 / (L + .05) ? '#000000' : '#ffffff'; };
  const res = {};
  for (const [id, comp, apply, prop, measures, cands] of entries) {
    const roots = comp === '*' ? [document.body] : [...document.querySelectorAll(`.vr-comp[data-comp="${comp}"]`)];
    const targets = [];       // [el, kind, need]
    for (const root of roots) for (const [sel, kind, need] of measures) for (const el of root.querySelectorAll(sel)) targets.push([el, kind, need]);
    const applyEls = [];
    for (const root of roots) { try { applyEls.push(...root.querySelectorAll(apply)); } catch (e) {} if (root.matches?.(apply)) applyEls.push(root); }
    const worst = () => { let w = Infinity, ok = true; for (const [el, kind, need] of targets) { const v = measureOne(el, kind); if (v == null) continue; w = Math.min(w, v); if (v < need) ok = false; } return [ok, w]; };
    const [ok0, w0] = worst();
    if (ok0 || !applyEls.length) { res[id] = { ok: ok0, w0, n: targets.length }; continue; }
    const orig = getComputedStyle(applyEls[0]).getPropertyValue(prop === 'border-color' ? 'border-top-color' : prop);
    const ink = inkFor(prop === 'border-color' ? applyEls[0].parentElement : applyEls[0]);
    let chosen = null, w1 = null;
    for (const c of cands) {
      const val = c.replaceAll('{O}', orig).replaceAll('{INK}', ink);
      // keep each element's own inline value (a probe's original color can BE inline) and restore it
      const saved = applyEls.map(e => [e.style.getPropertyValue(prop), e.style.getPropertyPriority(prop)]);
      applyEls.forEach(e => e.style.setProperty(prop, val, 'important'));
      const [ok, w] = worst();
      applyEls.forEach((e, i) => { if (saved[i][0]) e.style.setProperty(prop, saved[i][0], saved[i][1]); else e.style.removeProperty(prop); });
      if (ok) { chosen = val; w1 = w; break; }
    }
    res[id] = { ok: false, w0, chosen, w1, n: targets.length };
  }
  return res;
}
"""

src = open(MAIN).read()
APPEND = sys.argv[sys.argv.index("--append") + 1].split(",") if "--append" in sys.argv else None
RUN = [e for e in REGISTRY if not APPEND or e[0] in APPEND]
if BEGIN in src and not APPEND:
    a = src.index(BEGIN); b = src.index(END) + len(END)
    src = src[:a].rstrip("\n") + "\n" + src[b:].lstrip("\n")
    open(MAIN, "w").write(src)
    print("removed the previous generated block — rebuild before measuring (npm run build), then re-run")
    sys.exit(0)
THEMES = sorted(set(re.findall(r"^\s*\.(theme-[a-z-]+)\s*\{", src, re.M)))

decisions = defaultdict(lambda: defaultdict(list))   # id -> chosen -> [state]
unfixable = defaultdict(list)
measured = {}
with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1100, "height": 900})
    page.goto(f"{BASE}/views/visual-reference.html?build=new", wait_until="networkidle", timeout=120000)
    page.wait_for_timeout(3000)
    # open the chip select's dropdown (as tests/component-contrast-test.py does) so its focused input is measured
    page.click('[data-comp="wc-select-chip"] .dropdown-input')
    page.keyboard.press("ArrowDown")
    page.wait_for_timeout(200)
    for fam in FAMILIES:
        for mode, os_, cls in MODES:
            page.emulate_media(color_scheme=os_)
            for t in THEMES:
                page.evaluate(f"document.documentElement.className = '{' '.join(x for x in [t, cls, 'crisp' if fam == 'crisp' else ''] if x)}'")
                page.evaluate("() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
                res = page.evaluate(MEASURE_JS, [[list(e[:2]) + [e[6] if len(e) > 6 else e[2]] + list(e[3:6]) for e in RUN]])
                state = (t, mode, "forced" if cls else os_, fam)
                for rid, r in res.items():
                    measured.setdefault(rid, []).append(r["w0"])
                    if r["ok"]:
                        continue
                    if r.get("chosen"):
                        decisions[rid][r["chosen"]].append(state)
                    else:
                        unfixable[rid].append((state, r["w0"]))
    browser.close()

TOTAL = len(THEMES) * len(MODES) * len(FAMILIES)


def state_sel(t, mode, how, fam):
    other = "dark" if mode == "light" else "light"
    if how == "forced":
        return f".{t}.{mode}" + (".crisp" if fam == "crisp" else ":not(.crisp)")
    return f".{t}:not(.{mode}):not(.{other})" + (".crisp" if fam == "crisp" else ":not(.crisp)")


apply_of = {e[0]: (e[2], e[3]) for e in REGISTRY}
if APPEND and BEGIN in src:
    head, rest = src.split(END, 1)
    lines = []
if not (APPEND and BEGIN in src):
  lines = [BEGIN,
         "/* Component contrast fixes — ADDITIVE. Each rule matches only the theme × mode × family states where",
         "   the component's ORIGINAL color fails WCAG on the visual reference page (text 4.5:1; icons, borders,",
         "   chip × 3:1) and applies the first candidate that passes; every passing state is untouched. !important",
         "   because some originals are !important or inline (candidates were measured that way). Generated",
         "   by scripts/gen-component-contrast.py — re-run after changing a component's colors or a theme.",
         "   Gate: tests/component-contrast-test.py. */"]
summary = []
for rid, by in decisions.items():
    apply, prop = apply_of[rid]
    nstates = sum(len(v) for v in by.values())
    summary.append((rid, nstates, len(by)))
    for chosen, states in by.items():
        if len(states) == TOTAL:
            lines.append(f"{apply} {{ {prop}: {chosen} !important; }}")
            continue
        forced = [s for s in states if s[2] == "forced"]
        if forced:
            lines.append(f":is({', '.join(state_sel(*s) for s in forced)}) {apply} {{ {prop}: {chosen} !important; }}")
        for os_ in ["light", "dark"]:
            auto = [s for s in states if s[2] == os_]
            if auto:
                lines.append(f"@media (prefers-color-scheme: {os_}) {{ :is({', '.join(state_sel(*s) for s in auto)}) {apply} {{ {prop}: {chosen} !important; }} }}")
if APPEND and BEGIN in src:
    src = head.rstrip("\n") + "\n" + "\n".join(lines) + "\n" + END + rest
else:
    lines += [END, ""]
    src = src.rstrip("\n") + "\n\n" + "\n".join(lines)
open(MAIN, "w").write(src)
json.dump({"summary": summary, "unfixable": {k: [[list(s), w] for s, w in v] for k, v in unfixable.items()}},
          open(os.path.join(ROOT, "tests", ".component-contrast-decisions.json"), "w"), indent=1)
print(f"{len(decisions)} fixes over {TOTAL} states:")
for rid, n, k in sorted(summary, key=lambda x: -x[1]):
    print(f"  {rid:28} {n:4} states, {k} distinct value(s)")
for rid, v in unfixable.items():
    print(f"  UNFIXABLE {rid}: {len(v)} states, e.g. {v[:2]}")
