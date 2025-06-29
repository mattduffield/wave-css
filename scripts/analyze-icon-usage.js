#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Function to recursively find files
function findFiles(dir, extensions, files = []) {
  if (!fs.existsSync(dir)) return files;
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', 'dist', '.git'].includes(entry.name)) {
        findFiles(fullPath, extensions, files);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// Directories to scan for icon usage
const SCAN_DIRS = [
  { dir: 'src', extensions: ['.js', '.jsx', '.ts', '.tsx', '.html'] },
  { dir: 'views', extensions: ['.html'] },
  // Add more as needed
];

// Patterns to find icon usage
const ICON_PATTERNS = [
  // wc-icon component usage
  /<wc-icon[^>]+name=["']([^"']+)["'][^>]*(?:icon-style=["']([^"']+)["'])?/g,
  // JavaScript references
  /icon:\s*["']([^"']+)["']/g,
  /iconName:\s*["']([^"']+)["']/g,
  /name:\s*["']([^"']+)["'].*style:\s*["']([^"']+)["']/g,
];

// Analyze codebase for icon usage
function analyzeIconUsage() {
  const usedIcons = new Map(); // Map of "style/name" -> count
  
  console.log('Analyzing icon usage in codebase...\n');
  
  // Collect all files to scan
  const allFiles = [];
  for (const { dir, extensions } of SCAN_DIRS) {
    const dirPath = path.join(__dirname, '..', dir);
    findFiles(dirPath, extensions, allFiles);
  }
  
  console.log(`Scanning ${allFiles.length} files...\n`);
  
  for (const file of allFiles) {
    const content = fs.readFileSync(file, 'utf8');
    
    // Check each pattern
    for (const regex of ICON_PATTERNS) {
      let match;
      const regexCopy = new RegExp(regex.source, regex.flags);
      
      while ((match = regexCopy.exec(content)) !== null) {
        const iconName = match[1];
        const iconStyle = match[2] || 'solid'; // Default to solid if not specified
        const key = `${iconStyle}/${iconName}`;
        
        usedIcons.set(key, (usedIcons.get(key) || 0) + 1);
      }
    }
  }
  
  // Sort by usage count
  const sortedIcons = Array.from(usedIcons.entries())
    .sort((a, b) => b[1] - a[1]);
  
  console.log(`Found ${sortedIcons.length} unique icons used in codebase:\n`);
  
  // Display top 20 most used
  console.log('Top 20 most used icons:');
  sortedIcons.slice(0, 20).forEach(([icon, count]) => {
    console.log(`  ${icon}: ${count} uses`);
  });
  
  // Save full analysis
  const analysisPath = path.join(__dirname, '../dist/assets/icon-bundles/icon-usage.json');
  const analysisDir = path.dirname(analysisPath);
  
  if (!fs.existsSync(analysisDir)) {
    fs.mkdirSync(analysisDir, { recursive: true });
  }
  
  const analysis = {
    timestamp: new Date().toISOString(),
    totalIcons: sortedIcons.length,
    icons: sortedIcons.map(([icon, count]) => ({ icon, count }))
  };
  
  fs.writeFileSync(analysisPath, JSON.stringify(analysis, null, 2));
  console.log(`\nFull analysis saved to: ${analysisPath}`);
  
  return sortedIcons.map(([icon]) => icon);
}

// Generate optimized bundle based on usage
function generateOptimizedBundle(usedIcons) {
  console.log('\nGenerating optimized icon bundle...');
  
  const ICONS_DIR = path.join(__dirname, '../src/assets/icons');
  const bundle = {};
  let foundCount = 0;
  let missingCount = 0;
  
  for (const iconPath of usedIcons) {
    const [style, name] = iconPath.split('/');
    const svgPath = path.join(ICONS_DIR, style, `${name}.svg`);
    
    if (fs.existsSync(svgPath)) {
      const svgContent = fs.readFileSync(svgPath, 'utf8');
      bundle[iconPath] = parseSvg(svgContent);
      foundCount++;
    } else {
      console.log(`  ⚠ Warning: ${iconPath}.svg not found`);
      missingCount++;
    }
  }
  
  const bundlePath = path.join(__dirname, '../dist/assets/icon-bundles/used-icons.json');
  const bundleContent = JSON.stringify(bundle);
  fs.writeFileSync(bundlePath, bundleContent);
  
  const bundleSize = (bundleContent.length / 1024).toFixed(1);
  console.log(`\n✓ Created optimized bundle with ${foundCount} icons (${bundleSize}KB)`);
  if (missingCount > 0) {
    console.log(`  ⚠ ${missingCount} icons were referenced but not found`);
  }
}

// Parse SVG helper (same as bundle-icons.js)
function parseSvg(svgContent) {
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 512 512';
  
  const paths = [];
  const pathRegex = /<path([^>]+)>/g;
  let match;
  
  while ((match = pathRegex.exec(svgContent)) !== null) {
    const pathAttrs = match[1];
    const path = {};
    
    const dMatch = pathAttrs.match(/\bd="([^"]+)"/);
    if (dMatch) path.d = dMatch[1];
    
    const classMatch = pathAttrs.match(/class="([^"]+)"/);
    if (classMatch) path.class = classMatch[1];
    
    const opacityMatch = pathAttrs.match(/opacity="([^"]+)"/);
    if (opacityMatch) path.opacity = opacityMatch[1];
    
    const fillMatch = pathAttrs.match(/fill="([^"]+)"/);
    if (fillMatch) path.fill = fillMatch[1];
    
    if (path.d) paths.push(path);
  }
  
  return { viewBox, paths };
}

// Run analysis
const usedIcons = analyzeIconUsage();
generateOptimizedBundle(usedIcons);