const esbuild = require('esbuild');

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
  entryPoints: ['src/css/base.css'],
  bundle: true,
  minify: false,
  outfile: 'dist/wave-css.css'
}).catch(() => process.exit(1));

// CSS bundling and minification
esbuild.build({
  entryPoints: ['src/css/base.css'],
  bundle: true,
  minify: true,
  outfile: 'dist/wave-css.min.css'
}).catch(() => process.exit(1));
