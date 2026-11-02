# Wave CSS changelog — 2026-11-02 (knowledge base 1.56.0)

## wc-rich-text: resize, align and alt-text images (additive)

Inserted images (toolbar, upload, paste) used to stay at their natural size with no way to change them.

**New**
- **Select** an image by clicking it, or by Shift+Arrow from the caret next to it: a 2px outline in `--text-1` and
  four corner handles.
- **Resize**: corner handles via pointer events (mouse, touch, pen; aspect ratio kept; 22px handles on touch
  screens); an image toolbar with **S / M / L / Original** (25 / 50 / 75 / 100% of the natural width) and a
  **Width** box in pixels. Stored as `width="N"` plus inline `width: Npx; max-width: 100%; height: auto`.
- **Align**: **Left / Center / Right** (click the active one again to clear) — center `display: block; margin: 0 auto`,
  left `float: left; margin: 0 12px 8px 0`, right `float: right; margin: 0 0 8px 12px`.
- **Alt text** field → `alt`; **Remove** button.
- **Keyboard**: Enter / Space opens the toolbar (focus on its first control, ←/→ between buttons), Esc closes it with the
  image still selected, Esc again deselects, Delete / Backspace removes the image; focus returns to the text.
- Each change fires the normal `wcrichtextchange` (a handle drag fires once, on release) and updates the form value.

**Unchanged:** the toolbar's existing items, stored values, markdown mode (size/alignment dropped as before), and every
editor in which no image is touched. The outline, handles and image toolbar are siblings of the editable area (never in
the value); their page-level listeners exist only while an image is selected. The CSS bundle (`wave-css*.css`) is
byte-identical — the new styles are injected by wc-rich-text itself.

**Files**: `src/js/components/wc-rich-text.js`; demo section "Images: resize, align, alt text" in `views/rich-text.html`;
`docs/wc-rich-text.md`; knowledge base; CLAUDE.md.

**Verified**
- `tests/rich-text-image-tools-test.py` 44/44 — select (click, Shift+Arrow), outline tracks the image, selecting is not a
  change, clicking text deselects; resize by the SE and NW handles (mouse; aspect 2.000), one change per drag, by real
  touch events, S/M/L/Original (100/200/300/400 of 400), the Width box; Left/Center/Right + clearing; alt; the keyboard
  path (Enter, arrows + Enter, Esc, Space, Esc, Delete, typing continues); form value = value; size/alignment/alt survive
  DOMPurify; save-and-reopen (same content and image attributes, renders 200px centered with its alt); markdown value
  unchanged; with images present but untouched, typing gives values and change events **identical to the previous
  build**, and the page errors are identical (3 pre-existing); document listeners only while selected; none leaked.
- `tests/rich-text-image-email-contrast-test.py` 20/20 — **email (Gmail-style)**: no `<style>`, no classes on images,
  inline only; rendered CSS-free at 600px (M 200×100 centered; S floats left and right with text wrapping beside them)
  and in a 320px column (all fit, aspect kept); a 400px original in a 300px column → 300×150. **Contrast in all
  54 themes × forced light / forced dark / follow the OS × OS light / OS dark × regular / .crisp**: outline ≥ 9.17:1 and
  handles ≥ 9.17:1 vs the editor (≥ 5.17:1 vs the image), toolbar text and pressed buttons ≥ 16.94:1, alt placeholder
  ≥ 19.50:1, button / input borders ≥ 3.16:1, toolbar border ≥ 3.30:1, focus ring ≥ 16.94:1.
- Existing suites: `rich-text-test` 22/22, `rich-text-image-test` 14/14, `rich-text-fields-test` 13/13.
- **Pixel-identical**: every `views/*.html` page, previous build vs new, 4 states each — all identical except pages
  that are non-deterministic in both builds (chartjs, data-cards, dependency-example, color — proven by rendering each
  build twice); one-state differences on cron-picker, org-chart, vin-decoder and busy-indicator were timing flakes
  (identical on re-render).

**Notes**
- The toolbar opens below the selected image and covers the line under it while open (click elsewhere or Esc to close).
- While an image is selected it is the editor's selection, so the browser draws its normal selection tint over it.
- Test fix: the contrast sweep disables transitions — Wave's form fields animate `color`, and an immediate measurement
  after a theme switch catches the old theme's color mid-transition.

---

## wc-select: setting value on a chip / multiple select (knowledge base 1.57.0)

**Before:** `sel.setAttribute('value', 'a,b,c')` or `sel.value = …` on a rendered `<wc-select mode="chip" multiple>`
only reached the inner `<select>` (through the base form component); `selectedOptions` and the chips stayed as they
were, and no `change` fired. A `value="a,b"` in the markup showed no chips.

**Now** (chip / multiple only): a value change from outside replaces `selectedOptions` with the comma-separated list
(an array works too; values trimmed; an option matching case-insensitively keeps its canonical value; unknown values
become custom options under `allow-custom` / `allow-dynamic`, as `addChip` does), then runs `updateSelect()`,
`updateChips()` and `updateDropdownOptions()` and dispatches **one** `change` — none if the selection didn't change.
A `value="a,b"` in the markup now renders those chips, silently (no `change` on page load, so `hx-trigger="change"`
doesn't fire). The inner `<select>`'s own change events keep their old path, so a user's native multi-select change
isn't collapsed to one value.

**Unchanged:** single selects, `addChip` / `removeChip`, native multi-select interaction — each verified identical to
the previous build. No demo page renders a chip/multiple select with a `value` attribute.

**Verified:** `tests/select-value-test.py` 18/18 (render `value="a,b"` → chips a, b, silent; set `"c"` → one chip "c",
selectedOptions/inner select/form = c, one change, dropdown hides c; set `""` → no chips, one change; property, array,
no-op, case-insensitive, allow-custom, plain multiple; the unchanged paths identical to the previous build). Related
suites pass: `select-face-test` 15/15, form-array (24, 34, 15, 10, and generic 18/19 — its one failing check,
"dropdown input has autocomplete=off", fails identically on the previous build: the test predates the
`password-contact` autofill token), combobox suites, `component-contrast-test` 62/62.
