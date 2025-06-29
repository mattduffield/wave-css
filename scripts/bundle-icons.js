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

// Run bundling
(async () => {
  await bundleIconsByStyle();
  await bundleCommonIcons();
})();