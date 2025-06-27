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
