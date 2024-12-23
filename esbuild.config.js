const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/js/components/index.js'],
  bundle: true,
  minify: true,
  outfile: 'dist/wave-css.min.js',  // Output bundled file
  format: 'esm',  // Use ESM for modern imports
  // watch: process.argv.includes('--watch'),  // Optional: Watch mode
}).catch(() => process.exit(1));

esbuild.build({
  entryPoints: ['src/js/components/index.js'],
  bundle: true,
  minify: false,
  outfile: 'dist/wc-css.js',  // Output bundled file
  format: 'esm',  // Use ESM for modern imports
  // watch: process.argv.includes('--watch'),  // Optional: Watch mode
}).catch(() => process.exit(1));

// CSS bundling and minification
esbuild.build({
  entryPoints: ['src/css/base.css'],
  bundle: true,
  minify: true,
  outfile: 'dist/styles.min.css'
}).catch(() => process.exit(1));
