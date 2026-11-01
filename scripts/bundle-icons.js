#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '../src/assets/icons');
const OUTPUT_DIR = path.join(__dirname, '../dist/assets/icon-bundles');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Icon styles to bundle
const ICON_STYLES = [
  'solid',
  'regular', 
  'light',
  'thin',
  'duotone',
  'duotone-regular',
  'duotone-light',
  'duotone-thin',
  'brands'
];

// Parse SVG and extract path data
function parseSvg(svgContent) {
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 512 512';
  
  const paths = [];
  const pathRegex = /<path([^>]+)>/g;
  let match;
  
  while ((match = pathRegex.exec(svgContent)) !== null) {
    const pathAttrs = match[1];
    const path = {};
    
    // Extract d attribute
    const dMatch = pathAttrs.match(/\bd="([^"]+)"/);
    if (dMatch) path.d = dMatch[1];
    
    // Extract class attribute
    const classMatch = pathAttrs.match(/class="([^"]+)"/);
    if (classMatch) path.class = classMatch[1];
    
    // Extract opacity
    const opacityMatch = pathAttrs.match(/opacity="([^"]+)"/);
    if (opacityMatch) path.opacity = opacityMatch[1];
    
    // Extract fill
    const fillMatch = pathAttrs.match(/fill="([^"]+)"/);
    if (fillMatch) path.fill = fillMatch[1];
    
    if (path.d) paths.push(path);
  }
  
  return { viewBox, paths };
}

// Bundle icons by style
async function bundleIconsByStyle() {
  console.log('Starting icon bundling...\n');
  
  for (const style of ICON_STYLES) {
    const styleDir = path.join(ICONS_DIR, style);
    
    if (!fs.existsSync(styleDir)) {
      console.log(`Skipping ${style} - directory not found`);
      continue;
    }
    
    const files = fs.readdirSync(styleDir).filter(f => f.endsWith('.svg'));
    
    if (files.length === 0) {
      console.log(`Skipping ${style} - no SVG files found`);
      continue;
    }
    
    console.log(`Bundling ${style} icons (${files.length} files)...`);
    
    const bundle = {};
    let totalSize = 0;
    
    for (const file of files) {
      const iconName = file.replace('.svg', '');
      const svgPath = path.join(styleDir, file);
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      
      totalSize += svgContent.length;
      bundle[iconName] = parseSvg(svgContent);
    }
    
    // Write bundle
    const bundlePath = path.join(OUTPUT_DIR, `${style}-icons.json`);
    const bundleContent = JSON.stringify(bundle);
    fs.writeFileSync(bundlePath, bundleContent);
    
    const bundleSize = (bundleContent.length / 1024).toFixed(1);
    const originalSize = (totalSize / 1024).toFixed(1);
    const savings = (100 - (bundleContent.length / totalSize * 100)).toFixed(1);
    
    console.log(`  ✓ Created ${style}-icons.json`);
    console.log(`    Original: ${originalSize}KB, Bundle: ${bundleSize}KB (${savings}% smaller)`);
  }
  
  console.log('\nIcon bundling complete!');
}

// Create a bundle of commonly used icons
async function bundleCommonIcons() {
  console.log('\nCreating common icons bundle...');
  
  // Define your most commonly used icons here
  const COMMON_ICONS = [
    { name: 'house', style: 'solid' },
    { name: 'user', style: 'solid' },
    { name: 'gear', style: 'solid' },
    { name: 'heart', style: 'solid' },
    { name: 'star', style: 'solid' },
    { name: 'check', style: 'solid' },
    { name: 'xmark', style: 'solid' },
    { name: 'plus', style: 'solid' },
    { name: 'minus', style: 'solid' },
    { name: 'magnifying-glass', style: 'solid' },
    { name: 'envelope', style: 'solid' },
    { name: 'bell', style: 'solid' },
    { name: 'trash', style: 'solid' },
    { name: 'pen-to-square', style: 'solid' },
    { name: 'arrow-right', style: 'solid' },
    { name: 'arrow-left', style: 'solid' },
    { name: 'arrow-up', style: 'solid' },
    { name: 'arrow-down', style: 'solid' },
    { name: 'spinner', style: 'solid' },
    { name: 'circle-notch', style: 'solid' },
    // Add more common icons as needed
  ];
  
  const bundle = {};
  
  for (const { name, style } of COMMON_ICONS) {
    const svgPath = path.join(ICONS_DIR, style, `${name}.svg`);
    
    if (fs.existsSync(svgPath)) {
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      const key = `${style}/${name}`;
      bundle[key] = parseSvg(svgContent);
    } else {
      console.log(`  ⚠ Warning: ${style}/${name}.svg not found`);
    }
  }
  
  const bundlePath = path.join(OUTPUT_DIR, 'common-icons.json');
  fs.writeFileSync(bundlePath, JSON.stringify(bundle));
  
  console.log(`  ✓ Created common-icons.json with ${Object.keys(bundle).length} icons`);
}

// Copy icon bundles to versioned dist folder
function copyBundlesToVersioned() {
  const versionedBundles = path.join(__dirname, '../dist/wave-css-0.0.1/assets/icon-bundles');
  if (!fs.existsSync(path.join(__dirname, '../dist/wave-css-0.0.1'))) return;
  if (!fs.existsSync(versionedBundles)) {
    fs.mkdirSync(versionedBundles, { recursive: true });
  }
  const files = fs.readdirSync(OUTPUT_DIR).filter(f => f.endsWith('.json'));
  files.forEach(f => {
    fs.copyFileSync(path.join(OUTPUT_DIR, f), path.join(versionedBundles, f));
  });
  console.log(`\nIcon bundles copied to dist/wave-css-0.0.1/assets/icon-bundles`);

  // Also copy to go-kart
  const goKartBundles = path.join(__dirname, '../../../_learn/go-kart/static/js/wave-css-0.0.1/assets/icon-bundles');
  const goKartDir = path.join(__dirname, '../../../_learn/go-kart/static/js/wave-css-0.0.1');
  if (fs.existsSync(goKartDir)) {
    if (!fs.existsSync(goKartBundles)) {
      fs.mkdirSync(goKartBundles, { recursive: true });
    }
    files.forEach(f => {
      fs.copyFileSync(path.join(OUTPUT_DIR, f), path.join(goKartBundles, f));
    });
    console.log(`Icon bundles copied to go-kart/static/js/wave-css-0.0.1/assets/icon-bundles`);
  }
}

// Searchable index of the bundled icons, from Font Awesome's own metadata:
//   icon-index.json   — every bundled icon: { name, label, styles, aliases, terms }
//   icon-aliases.json — { alias: name } for FA's official aliases (wc-fa-icon loads it on a miss,
//                       so name="tshirt" / "undo-alt" / "home" resolve to the bundled icon)
//   docs/ICONS.md     — the same list as a table, for searching by eye or grep
// Without the FA Pro metadata (another machine) it still writes names + styles.
const FA_PRO_PATH = process.env.FA_PRO_PATH || '/Users/matthewduffield/Documents/_assets/fontawesome-pro-7.2.0-web';

function buildIconIndex() {
  console.log('\nBuilding icon index...');
  let meta = {};
  const metaPath = path.join(FA_PRO_PATH, 'metadata', 'icons.json');
  if (fs.existsSync(metaPath)) {
    meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
  } else {
    console.log('  ⚠ Font Awesome metadata not found — index has names and styles only');
  }

  const byName = new Map();
  for (const style of ICON_STYLES) {
    const dir = path.join(ICONS_DIR, style);
    if (!fs.existsSync(dir)) continue;
    for (const file of fs.readdirSync(dir)) {
      if (!file.endsWith('.svg')) continue;
      const name = file.slice(0, -4);
      if (!byName.has(name)) byName.set(name, []);
      byName.get(name).push(style);
    }
  }

  const names = [...byName.keys()].sort();
  const icons = names.map((name) => {
    const m = meta[name] || {};
    return {
      name,
      label: m.label || name.replace(/-/g, ' '),
      styles: byName.get(name),
      aliases: ((m.aliases && m.aliases.names) || []).filter((a) => !byName.has(a)).sort(),
      terms: ((m.search && m.search.terms) || []).slice(0, 12),
    };
  });

  // Official aliases → bundled name (never shadowing a real bundled icon)
  const aliases = {};
  icons.forEach((icon) => icon.aliases.forEach((a) => { if (!aliases[a]) aliases[a] = icon.name; }));

  fs.writeFileSync(path.join(OUTPUT_DIR, 'icon-index.json'), JSON.stringify({ count: icons.length, icons }));
  fs.writeFileSync(path.join(OUTPUT_DIR, 'icon-aliases.json'), JSON.stringify(aliases));

  const esc = (s) => String(s).replace(/\|/g, '\\|');
  const lines = [
    '# Bundled icons',
    '',
    '<!-- Generated by scripts/bundle-icons.js on every build — do not edit. -->',
    '',
    `${icons.length} icons. Use the **name** with \`<wc-fa-icon name="…">\` (optionally \`icon-style\`). An **alias** also works:`,
    'wc-fa-icon resolves Font Awesome\'s official aliases (e.g. `tshirt` → `shirt`, `home` → `house`). To add an icon, add its',
    'name to `ICONS_TO_COPY` in `scripts/copy-fa-pro-svgs.js` and rebuild. Machine-readable: `dist/assets/icon-bundles/icon-index.json`.',
    '',
    '| Name | Styles | Aliases | Search terms |',
    '|------|--------|---------|--------------|',
    ...icons.map((i) => `| \`${i.name}\` | ${i.styles.length === ICON_STYLES.length - 1 && !i.styles.includes('brands') ? 'all' : i.styles.join(', ')} | ${esc(i.aliases.join(', '))} | ${esc(i.terms.join(', '))} |`),
    '',
  ];
  fs.writeFileSync(path.join(__dirname, '../docs/ICONS.md'), lines.join('\n'));
  console.log(`  ✓ icon-index.json (${icons.length} icons), icon-aliases.json (${Object.keys(aliases).length} aliases), docs/ICONS.md`);
}

// Run bundling
(async () => {
  await bundleIconsByStyle();
  await bundleCommonIcons();
  buildIconIndex();
  copyBundlesToVersioned();
})();