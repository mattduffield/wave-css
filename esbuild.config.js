const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// All esbuild bundles. They are AWAITED together in main() and any failure
// aborts the whole script (non-zero exit, with the error printed) BEFORE the
// copy steps run — so a build error can never silently ship a stale bundle to
// dist/, the versioned folder, or the vendored go-kart copy.
const buildConfigs = [
  // JS: bundle + minify, and un-minified
  { entryPoints: ['src/js/components/index.js'], bundle: true, minify: true,  outfile: 'dist/wave-css.min.js', format: 'esm' },
  { entryPoints: ['src/js/components/index.js'], bundle: true, minify: false, outfile: 'dist/wave-css.js',     format: 'esm' },
  // Helpers (IIFE global)
  { entryPoints: ['src/js/components/helper-function.js'], bundle: true, minify: false, outfile: 'dist/wave-helpers.js', format: 'iife', globalName: 'WaveHelpers' },
  // CSS: bundle + minify
  { entryPoints: ['src/css/main.css'], bundle: true, minify: false, outfile: 'dist/wave-css.css' },
  { entryPoints: ['src/css/main.css'], bundle: true, minify: true,  outfile: 'dist/wave-css.min.css' },
  // Critical CSS (for inlining in <head>)
  { entryPoints: ['src/css/critical.css'], bundle: true, minify: true, outfile: 'dist/wave-critical.min.css' },
];

// Recursive copy helper for SVG assets.
function copyRecursiveSync(src, dest) {
  if (!fs.existsSync(src)) return;
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

async function main() {
  // 1) Build everything FIRST. If any build errors, this rejects → main().catch
  //    exits non-zero before we copy anything (no stale-bundle shipping).
  await Promise.all(buildConfigs.map((cfg) => esbuild.build(cfg)));

  // 2) Copy SVG icons to dist.
  const iconsSource = path.join(__dirname, 'src/assets/icons');
  const iconsTarget = path.join(__dirname, 'dist/assets/icons');
  if (fs.existsSync(iconsSource)) {
    copyRecursiveSync(iconsSource, iconsTarget);
    console.log('SVG icons copied to dist/assets/icons');
  }

  const bundleFiles = ['wave-css.js', 'wave-css.min.js', 'wave-css.css', 'wave-css.min.css', 'wave-critical.min.css', 'wave-helpers.js', 'wave-theme-init.js'];

  // 3) Copy freshly-built files to the versioned dist folder (+ icons).
  const versionedDir = path.join(__dirname, 'dist/wave-css-0.0.1');
  if (fs.existsSync(versionedDir)) {
    bundleFiles.forEach((file) => {
      const src = path.join(__dirname, 'dist', file);
      const dest = path.join(versionedDir, file);
      if (fs.existsSync(src)) fs.copyFileSync(src, dest);
    });
    const versionedIcons = path.join(versionedDir, 'assets/icons');
    if (fs.existsSync(iconsTarget)) copyRecursiveSync(iconsTarget, versionedIcons);
    // Note: icon bundles are copied by bundle-icons.js which runs after esbuild.
    console.log('Built files copied to dist/wave-css-0.0.1');

    // 4) Also vendor the built files into the go-kart project.
    const goKartDir = path.join(__dirname, '../../_learn/go-kart/static/js/wave-css-0.0.1');
    if (fs.existsSync(goKartDir)) {
      bundleFiles.forEach((file) => {
        const src = path.join(__dirname, 'dist', file);
        const dest = path.join(goKartDir, file);
        if (fs.existsSync(src)) fs.copyFileSync(src, dest);
      });
      const goKartIcons = path.join(goKartDir, 'assets/icons');
      if (fs.existsSync(iconsTarget)) copyRecursiveSync(iconsTarget, goKartIcons);
      console.log('Built files copied to go-kart/static/js/wave-css-0.0.1');
    }
  }

  // 5) Copy live-designer-canvas.html to dist with adjusted paths.
  const canvasSource = path.join(__dirname, 'views/live-designer-canvas.html');
  const canvasDist = path.join(__dirname, 'dist/live-designer-canvas.html');
  if (fs.existsSync(canvasSource)) {
    let canvasHTML = fs.readFileSync(canvasSource, 'utf8');
    // Adjust paths from views/ (../dist/) to dist/ (same directory).
    canvasHTML = canvasHTML.replace(/\.\.\/dist\//g, './');
    fs.writeFileSync(canvasDist, canvasHTML);
    console.log('Live designer canvas copied to dist/live-designer-canvas.html');
  }
}

main().catch((err) => {
  console.error('[esbuild] BUILD FAILED — aborting before copying any (stale) bundles:');
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});
