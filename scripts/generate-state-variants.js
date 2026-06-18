/**
 * generate-state-variants.js
 *
 * Generates interactive-state (hover / focus / focus-visible / active) variants for
 * Wave CSS's design-system COLOR utilities, and injects them into src/css/main.css
 * between AUTO-GENERATED markers (inside `@layer wc.state`).
 *
 * Why a generator: main.css is hand-written and bundled directly (no CSS build step),
 * so this keeps the state-variant matrix in sync with the base color utilities without
 * hand-listing hundreds of rules. Re-run after adding/renaming a base color utility:
 *
 *     node scripts/generate-state-variants.js
 *
 * Scope (default): design-system tokens only (surface ramp, text ramp, semantic
 * colors, card/container/component, swatch, badges) — keeps the bundle lean.
 *
 * Scope B (opt-in): pass `--palette` (or set WAVE_STATE_PALETTE=1) to ALSO mirror the
 * raw Tailwind named palette (bg-{family}-{shade}, text-{family}-{shade}, plus
 * white/black/transparent). This adds ~2,000 extra rules, so it's off by default.
 *
 *     node scripts/generate-state-variants.js            # design-system only
 *     node scripts/generate-state-variants.js --palette  # + Tailwind palette
 *
 * Each base utility is mirrored 1:1, preserving its CSS property — so background,
 * foreground (text), and border targets stay independently controllable per state
 * (e.g. `hover:surface-3` = background, `hover:surface-color-3` = text).
 */

const fs = require("fs");
const path = require("path");

const MAIN_CSS = path.join(__dirname, "..", "src", "css", "main.css");

const INCLUDE_PALETTE =
  process.argv.includes("--palette") || process.env.WAVE_STATE_PALETTE === "1";

// The four interactive states: class prefix -> pseudo-class appended to the selector.
const STATES = [
  { prefix: "hover", pseudo: "hover" },
  { prefix: "focus", pseudo: "focus" },
  { prefix: "focus-visible", pseudo: "focus-visible" },
  { prefix: "active", pseudo: "active" },
];

const RAMP = Array.from({ length: 13 }, (_, i) => i + 1); // 1..13

// Build the flat list of base color utilities to mirror: { cls, decls: [[prop, value]] }.
// `decls` is a list so multi-declaration utilities (badges) are supported.
function buildBaseUtilities() {
  const utils = [];
  const one = (cls, prop, value) => utils.push({ cls, decls: [[prop, value]] });

  // --- Surface ramp (1..13) ---
  RAMP.forEach((n) => {
    one(`surface-${n}`, "background-color", `var(--surface-${n})`);
    one(`surface-color-${n}`, "color", `var(--surface-${n})`);
    one(`border-surface-${n}`, "border-color", `var(--surface-${n})`);
    one(`surface-${n}-border-color`, "border-color", `var(--surface-${n})`);
    one(`swatch-bg-color-${n}`, "background-color", `var(--swatch-${n})`);
  });

  // --- Text ramp (1..13) ---
  RAMP.forEach((n) => {
    one(`text-${n}`, "color", `var(--text-${n})`);
    one(`text-bg-color-${n}`, "background-color", `var(--text-${n})`);
    one(`text-${n}-border-color`, "border-color", `var(--text-${n})`);
  });

  // --- Structural surfaces ---
  ["container", "card", "component"].forEach((name) => {
    one(`${name}-bg-color`, "background-color", `var(--${name}-bg-color)`);
    one(`${name}-color`, "color", `var(--${name}-color)`);
    one(`${name}-border-color`, "border-color", `var(--${name}-border-color)`);
  });

  // --- Primary / secondary ---
  one("primary-color", "color", "var(--primary-color)");
  one("primary-light-color", "color", "var(--primary-light)");
  one("primary-hover-color", "color", "var(--primary-hover-color)");
  one("primary-bg-color", "background-color", "var(--primary-bg-color)");
  one("primary-border-color", "border-color", "var(--primary-color)");
  one("primary-bg-border-color", "border-color", "var(--primary-bg-color)");
  one("secondary-bg-color", "background-color", "var(--secondary-bg-color)");

  // --- Status colors (success / danger / warning / info) ---
  ["success", "danger", "warning", "info"].forEach((name) => {
    one(`${name}-color`, "color", `var(--${name}-color)`);
    one(`${name}-light-color`, "color", `var(--${name}-light-color)`);
    one(`${name}-bg-color`, "background-color", `var(--${name}-color)`);
    one(`${name}-border-color`, "border-color", `var(--${name}-color)`);
  });

  // --- Badges (color-only variants; the structural `.badge` base is intentionally
  //     excluded so state variants never apply layout/padding). ---
  const badge = (cls, bg, color) =>
    utils.push({ cls, decls: [["background", bg], ["color", color]] });
  badge("badge-success", "rgba(34, 197, 94, 0.15)", "var(--success-color)");
  badge("badge-warning", "rgba(245, 158, 11, 0.15)", "var(--warning-color)");
  badge("badge-danger", "rgba(239, 68, 68, 0.15)", "var(--danger-color)");
  badge("badge-info", "rgba(59, 130, 246, 0.15)", "var(--info-color)");
  badge("badge-muted", "var(--surface-3)", "var(--text-6)");
  badge("badge-primary", "var(--primary-bg-color)", "var(--primary-text-color, #fff)");

  // --- Scope B (opt-in): raw Tailwind named palette ---
  if (INCLUDE_PALETTE) {
    buildPaletteUtilities().forEach((u) => utils.push(u));
  }

  return utils;
}

// The Tailwind named palette: .bg-{family}-{shade} / .text-{family}-{shade} ->
// var(--wc-{family}-{shade}), plus the standalone white/black/transparent. There are
// no border-palette base utilities in Wave, so none are mirrored (stay symmetric).
function buildPaletteUtilities() {
  const families = [
    "slate", "gray", "zinc", "neutral", "stone", "red", "orange", "amber",
    "yellow", "lime", "green", "emerald", "teal", "cyan", "sky", "blue",
    "indigo", "violet", "purple", "fuchsia", "pink", "rose",
  ];
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const out = [];
  const one = (cls, prop, value) => out.push({ cls, decls: [[prop, value]] });

  families.forEach((f) => {
    shades.forEach((s) => {
      one(`bg-${f}-${s}`, "background-color", `var(--wc-${f}-${s})`);
      one(`text-${f}-${s}`, "color", `var(--wc-${f}-${s})`);
    });
  });

  // Standalone keywords (text-transparent does not exist as a base utility).
  one("bg-white", "background-color", "var(--wc-white)");
  one("bg-black", "background-color", "var(--wc-black)");
  one("bg-transparent", "background-color", "transparent");
  one("text-white", "color", "var(--wc-white)");
  one("text-black", "color", "var(--wc-black)");

  return out;
}

function renderBlock() {
  const utils = buildBaseUtilities();
  const lines = [];
  lines.push("@layer wc.state {");
  lines.push(
    "    /* Interactive-state color variants — generated by scripts/generate-state-variants.js."
  );
  lines.push(
    "       Each mirrors a base design-system color utility on :hover / :focus / :focus-visible / :active,"
  );
  lines.push(
    "       preserving its property so background, text, and border stay independently targetable."
  );
  lines.push(
    `       Scope: design-system tokens${INCLUDE_PALETTE ? " + Tailwind named palette (--palette)" : " only (run with --palette to add the Tailwind palette)"}. */`
  );

  STATES.forEach(({ prefix, pseudo }, si) => {
    if (si > 0) lines.push("");
    lines.push(`    /* ${prefix}: */`);
    utils.forEach(({ cls, decls }) => {
      // Escape the leading state colon (e.g. `.hover\:surface-3:hover`).
      lines.push(`    .${prefix}\\:${cls}:${pseudo} {`);
      decls.forEach(([prop, value]) => lines.push(`        ${prop}: ${value};`));
      lines.push("    }");
    });
  });

  lines.push("}");
  return lines.join("\n");
}

const BEGIN = "/* === BEGIN AUTO-GENERATED state-variant color utilities (scripts/generate-state-variants.js) === */";
const END = "/* === END AUTO-GENERATED state-variant color utilities === */";

function inject(css, block) {
  const wrapped = `${BEGIN}\n${block}\n${END}`;
  const beginIdx = css.indexOf(BEGIN);
  const endIdx = css.indexOf(END);

  if (beginIdx !== -1 && endIdx !== -1) {
    // Replace existing generated region (idempotent re-run).
    return css.slice(0, beginIdx) + wrapped + css.slice(endIdx + END.length);
  }

  // First run: insert right before `@layer wc.usage {` so the state layer is declared
  // late (wins the cascade over base color utilities).
  const anchor = "@layer wc.usage {";
  const anchorIdx = css.indexOf(anchor);
  if (anchorIdx === -1) {
    throw new Error("Could not find `@layer wc.usage {` anchor in main.css");
  }
  return css.slice(0, anchorIdx) + wrapped + "\n\n" + css.slice(anchorIdx);
}

function main() {
  const css = fs.readFileSync(MAIN_CSS, "utf8");
  const block = renderBlock();
  const out = inject(css, block);
  fs.writeFileSync(MAIN_CSS, out, "utf8");

  const ruleCount = (block.match(/:\s*(hover|focus|focus-visible|active)\s*\{/g) || []).length;
  const scope = INCLUDE_PALETTE ? "design-system + Tailwind palette" : "design-system only";
  console.log(`State-variant color utilities generated: ${ruleCount} rules across ${STATES.length} states (${scope}).`);
  console.log(`Injected into ${path.relative(path.join(__dirname, ".."), MAIN_CSS)} (@layer wc.state).`);
}

main();
