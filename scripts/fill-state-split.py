#!/usr/bin/env python3
"""
Split generated contrast fixes that also hit an element's primary-FILL state (hover / active), per theme state.

Run:  python3 -m http.server 3015   (project root, other shell)
      python3.12 scripts/fill-state-split.py        (gen-component-contrast.py runs it at the end)
Then: npm run build

A few fixes in the "component contrast fixes" block were measured on the element at REST (text on a surface), but
their selector also matches the element's hover/active state, where it sits on the primary fill — e.g. the menu link
fix also colors the active link. In states where that color fails on the fill, the fix must not apply there (the
component's own fill text — --on-accent / --wc-on-primary-* — takes over). In states where it passes, nothing changes.

For each entry below, every generated line is split into: the original selector for states where the chosen color is
>= 4.5:1 on the fill, and the narrowed selector (fill states excluded) for states where it fails. Idempotent: lines
are normalized back to the original selector first.
"""

import os
import re

from playwright.sync_api import sync_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MAIN = os.path.join(ROOT, "src/css/main.css")
BEGIN = "/* === BEGIN generated: component contrast fixes (scripts/gen-component-contrast.py) === */"
END = "/* === END generated: component contrast fixes === */"
FILL = "var(--accent-fill-bg, var(--primary-bg-color))"
# (original selector, narrowed selector) — the fill states are hover / active / .active
ENTRIES = [
    (".chart-builder-add-btn", ".chart-builder-add-btn:not(:hover)"),
    (".help-drawer-trigger", ".help-drawer-trigger:not(:hover)"),
    ("wc-menu .wc-menu a", "wc-menu .wc-menu a:not(.active):not(:hover):not(:active)"),
    (".wc-tabulator.tabulator .tabulator-header .tabulator-col", ".wc-tabulator.tabulator .tabulator-header .tabulator-col:not(:hover)"),
]

LINE = re.compile(r"^(?P<pre>@media \(prefers-color-scheme: (?P<os>light|dark)\) \{ )?:is\((?P<states>[^)]*(?:\)[^)]*)*?)\) "
                  r"(?P<sel>.+?) \{ color: (?P<val>.+) !important; \}(?P<post> \})?$")

MEASURE = """([cls, val]) => {
  const d = document.documentElement; d.className = cls;
  const p = document.getElementById('p'); p.style.background = '%s'; p.style.color = val;
  const cv = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  const rgba = (c) => { cv.clearRect(0,0,1,1); cv.fillStyle = '#000'; cv.fillStyle = c; cv.fillRect(0,0,1,1); const x = cv.getImageData(0,0,1,1).data; return [x[0],x[1],x[2],x[3]/255]; };
  const lum = ([r,g,b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055, 2.4); }; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b); };
  const cs = getComputedStyle(p), bg = rgba(cs.backgroundColor), f0 = rgba(cs.color);
  const f = [0,1,2].map(i => f0[i]*f0[3] + bg[i]*(1-f0[3]));
  const a = lum(f), b = lum(bg); return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
}""" % FILL


def split_states(states_src):
    """split ':is(a, b, c)' contents at top-level commas"""
    out, depth, cur = [], 0, ""
    for ch in states_src:
        if ch == "(":
            depth += 1
        elif ch == ")":
            depth -= 1
        if ch == "," and depth == 0:
            out.append(cur.strip()); cur = ""
        else:
            cur += ch
    if cur.strip():
        out.append(cur.strip())
    return out


def state_class(sel):
    """'.theme-x.light:not(.crisp)' / '.theme-x:not(.light):not(.dark).crisp' → html class string"""
    t = re.match(r"\.(theme-[a-z-]+)", sel).group(1)
    mode = re.match(r"\.theme-[a-z-]+\.(light|dark)", sel)
    return " ".join(x for x in [t, mode.group(1) if mode else "", "crisp" if sel.endswith(".crisp") else ""] if x)


def main():
    src = open(MAIN).read()
    a, b = src.index(BEGIN), src.index(END)
    block = src[a:b]
    for orig, narrow in ENTRIES:   # normalize (idempotent)
        block = block.replace(f") {narrow} {{ color:", f") {orig} {{ color:")
    lines, changed = block.split("\n"), 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        pg = browser.new_page()
        pg.set_content(f"<html><head><style>{src}</style></head><body><span id='p'>x</span></body></html>")
        out = []
        for line in lines:
            m = LINE.match(line)
            if not m or m.group("sel") not in [e[0] for e in ENTRIES]:
                out.append(line); continue
            narrow = dict(ENTRIES)[m.group("sel")]
            os_ = m.group("os")
            keep, cut = [], []
            for st in split_states(m.group("states")):
                pg.emulate_media(color_scheme=os_ or ("dark" if ".dark" in st else "light"))
                ratio = pg.evaluate(MEASURE, [state_class(st), m.group("val")])
                (keep if ratio >= 4.5 else cut).append(st)
            pre, post = m.group("pre") or "", m.group("post") or ""
            for sts, sel in [(keep, m.group("sel")), (cut, narrow)]:
                if sts:
                    out.append(f"{pre}:is({', '.join(sts)}) {sel} {{ color: {m.group('val')} !important; }}{post}")
            changed += len(cut)
        browser.close()
    src = src[:a] + "\n".join(out) + src[b:]
    open(MAIN, "w").write(src)
    print(f"fill-state split: {changed} state(s) narrowed so the fill text applies there")


if __name__ == "__main__":
    main()
