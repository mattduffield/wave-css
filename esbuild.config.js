const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// JavasScript bundling and minification
esbuild.build({
  entryPoints: ['src/js/components/index.js'],
  bundle: true,
  minify: true,
  outfile: 'dist/wave-css.min.js',  // Output bundled file
  format: 'esm',  // Use ESM for modern imports
  // watch: process.argv.includes('--watch'),  // Optional: Watch mode
}).catch(() => process.exit(1));

// JavasScript bundling
esbuild.build({
  entryPoints: ['src/js/components/index.js'],
  bundle: true,
  minify: false,
  outfile: 'dist/wave-css.js',  // Output bundled file
  format: 'esm',  // Use ESM for modern imports
  // watch: process.argv.includes('--watch'),  // Optional: Watch mode
}).catch(() => process.exit(1));

// JavasScript bundling
esbuild.build({
  entryPoints: ['src/js/components/helper-function.js'],
  bundle: true,
  minify: false,
  outfile: 'dist/wave-helpers.js',  // Output bundled file
  format: 'iife',  // Immediately Invoked Function Execution
  globalName: 'WaveHelpers', // Namespace for helpers
}).catch(() => process.exit(1));

// CSS bundling
esbuild.build({
  entryPoints: ['src/css/main.css'],
  bundle: true,
  minify: false,
  outfile: 'dist/wave-css.css'
}).catch(() => process.exit(1));

// CSS bundling and minification
esbuild.build({
  entryPoints: ['src/css/main.css'],
  bundle: true,
  minify: true,
  outfile: 'dist/wave-css.min.css'
}).catch(() => process.exit(1));

// Critical CSS minification (for inlining in <head>)
esbuild.build({
  entryPoints: ['src/css/critical.css'],
  bundle: true,
  minify: true,
  outfile: 'dist/wave-critical.min.css'
}).catch(() => process.exit(1));

// Copy SVG assets to dist
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy icons directory if it exists
const iconsSource = path.join(__dirname, 'src/assets/icons');
const iconsTarget = path.join(__dirname, 'dist/assets/icons');

if (fs.existsSync(iconsSource)) {
  copyRecursiveSync(iconsSource, iconsTarget);
  console.log('SVG icons copied to dist/assets/icons');
}

// Copy built files to versioned dist folder
const versionedDir = path.join(__dirname, 'dist/wave-css-0.0.1');
if (fs.existsSync(versionedDir)) {
  ['wave-css.js', 'wave-css.min.js', 'wave-css.css', 'wave-css.min.css', 'wave-critical.min.css', 'wave-helpers.js'].forEach(file => {
    const src = path.join(__dirname, 'dist', file);
    const dest = path.join(versionedDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, dest);
    }
  });
  // Copy icons and icon bundles to versioned folder
  const versionedIcons = path.join(versionedDir, 'assets/icons');
  if (fs.existsSync(iconsTarget)) {
    copyRecursiveSync(iconsTarget, versionedIcons);
  }
  // Note: icon bundles are copied by bundle-icons.js which runs after esbuild
  console.log('Built files copied to dist/wave-css-0.0.1');

  // Also copy to go-kart project
  const goKartDir = path.join(__dirname, '../../_learn/go-kart/static/js/wave-css-0.0.1');
  if (fs.existsSync(goKartDir)) {
    ['wave-css.js', 'wave-css.min.js', 'wave-css.css', 'wave-css.min.css', 'wave-critical.min.css', 'wave-helpers.js'].forEach(file => {
      const src = path.join(__dirname, 'dist', file);
      const dest = path.join(goKartDir, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      }
    });
    // Copy icons
    const goKartIcons = path.join(goKartDir, 'assets/icons');
    if (fs.existsSync(iconsTarget)) {
      copyRecursiveSync(iconsTarget, goKartIcons);
    }
    console.log('Built files copied to go-kart/static/js/wave-css-0.0.1');
  }
}

// Copy live-designer-canvas.html to dist with adjusted paths
const canvasSource = path.join(__dirname, 'views/live-designer-canvas.html');
const canvasDist = path.join(__dirname, 'dist/live-designer-canvas.html');
if (fs.existsSync(canvasSource)) {
  let canvasHTML = fs.readFileSync(canvasSource, 'utf8');
  // Adjust paths from views/ (../dist/) to dist/ (same directory)
  canvasHTML = canvasHTML.replace(/\.\.\/dist\//g, './');
  fs.writeFileSync(canvasDist, canvasHTML);
  console.log('Live designer canvas copied to dist/live-designer-canvas.html');
}
