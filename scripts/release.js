const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const version = pkg.version;
const distDir = path.join(__dirname, '..', 'dist');
const releaseDir = path.join(distDir, `wave-css-${version}`);
const goKartDir = path.join(__dirname, '..', '..', '..', '_learn', 'go-kart', 'static', 'js', `wave-css-${version}`);

// Copy directory recursively
function copyDir(src, dest, skipVersionedDirs = false) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    if (skipVersionedDirs && path.basename(src).startsWith('wave-css-')) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyDir(path.join(src, child), path.join(dest, child), skipVersionedDirs);
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Build release
if (fs.existsSync(releaseDir)) {
  fs.rmSync(releaseDir, { recursive: true });
}
fs.mkdirSync(releaseDir, { recursive: true });
copyDir(distDir, releaseDir, true);  // Skip nested wave-css-* dirs
console.log(`✓ Release ${version} created at dist/wave-css-${version}/`);

// Auto-copy to Go Kart
if (fs.existsSync(path.dirname(goKartDir))) {
  if (fs.existsSync(goKartDir)) {
    fs.rmSync(goKartDir, { recursive: true });
  }
  copyDir(releaseDir, goKartDir, false);  // Copy everything, no skipping
  console.log(`✓ Copied to Go Kart at ${goKartDir}`);
} else {
  console.log(`\nTo copy to Go Kart:\n  cp -r dist/wave-css-${version}/* /path/to/go-kart/static/js/wave-css-${version}/`);
}
