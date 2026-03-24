const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');
const version = pkg.version;
const distDir = path.join(__dirname, '..', 'dist');
const releaseDir = path.join(distDir, `wave-css-${version}`);

if (fs.existsSync(releaseDir)) {
  console.error(`Release ${version} already exists at dist/wave-css-${version}/`);
  console.error('Bump the version in package.json before creating a new release.');
  process.exit(1);
}

function copyRecursiveSync(src, dest) {
  const stats = fs.statSync(src);
  if (stats.isDirectory()) {
    // Skip versioned release directories to avoid nesting
    if (path.basename(src).startsWith('wave-css-')) return;
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursiveSync(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.copyFileSync(src, dest);
  }
}

fs.mkdirSync(releaseDir, { recursive: true });
copyRecursiveSync(distDir, releaseDir);

console.log(`\n✓ Release ${version} created at dist/wave-css-${version}/`);
console.log(`\nTo copy to Go Kart:\n  cp -r dist/wave-css-${version}/* /path/to/go-kart/static/dist/`);
