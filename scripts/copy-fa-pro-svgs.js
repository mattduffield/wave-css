const fs = require('fs');
const path = require('path');

// IMPORTANT: Update this path to where you extracted Font Awesome Pro
const FA_PRO_PATH = '/Users/matthewduffield/Documents/_assets/fontawesome-pro-6.7.2-web'; // <-- UPDATE THIS!

// Icons you want to copy (add more as needed)
const ICONS_TO_COPY = [
  'house',
  'user',
  'users',
  'heart',
  'star',
  'camera',
  'envelope',
  'envelopes',
  'bell',
  'check',
  'xmark',
  'magnifying-glass',
  'gear',
  'gears',
  'gear-complex',
  'trash',
  'pen-to-square',
  'phone',
  'chevron-down',
  'chevron-up',
  'chevron-left',
  'chevron-right',
  'arrow-up',
  'arrow-up-from-line',
  'arrow-up-to-line',
  'arrow-down',
  'arrow-down-from-line',
  'arrow-down-to-line',
  'arrow-right',
  'arrow-right-from-line',
  'arrow-right-to-line',
  'arrow-left',
  'arrow-left-from-line',
  'arrow-left-to-line',
  'arrows-from-line',
  'arrows-to-line',
  'download',
  'upload',
  'plus',
  'minus',
  'circle-check',
  'circle-xmark',
  'calendar',
  'calendar-days',
  'pen',
  'paperclip',
  'tag',
  'tags',
  'book',
  'clock',
  'page',
  'file',
  'files',
  'file-lines',
  'folder',
  'folder-open',
  'image',
  'images',
  'video',
  'music',
  'comment',
  'comments',
  'share',
  'print',
  'search',
  'filter',
  'code',
  'code-branch',
  'code-compare',
  'brackets-curly',
  'brackets-square',
  'bug',
  'terminal',
  'square-terminal',
  'sort',
  'edit',
  'copy',
  'clone',
  'paste',
  'save',
  'floppy-disk',
  'undo',
  'redo',
  'magnet',
  'toggle-on',
  'toggle-off',
  'eye',
  'eye-slash',
  'sliders',
  'sliders-up',
  'clipboard',
  'clipboard-user',
  'clipboard-question',
  'clipboard-list',
  'clipboard-check',
  'bars',
  'bars-staggered',
  'bars-sort',
  'bars-progress',
  'bars-filter',
  'signal-bars',
  'chart-bar',
  'chart-simple',
  'chart-scatter-bubble',
  'chart-scatter',
  'chart-waterfall',
  'chart-sine',
  'chart-simple-horizontal',
  'chart-radar',
  'chart-pie-simple',
  'chart-pie',
  'chart-user',
  'chart-line-up-down',
  'chart-line-down',
  'chart-line-up',
  'chart-line',
  'chart-kanban',
  'database',
  'server',
  'table',
  'screwdriver-wrench',
  'toolbox',
  'wrench',
  'hammer',
  'screwdriver',
  'knife-kitchen',
  'shovel',
  'fire',
  'telescope',
  'object-group',
  'object-ungroup',
  'objects-align-top',
  'objects-align-right',
  'objects-align-bottom',
  'objects-align-left',
  'objects-align-center-horizontal',
  'objects-align-center-vertical',
  'thumbtack',
  'globe',
  'city',
  'pencil',
  'address-book',
  'building',
  'network-wired',
  'address-card',
  'sitemap',
  'timeline',
  'users-viewfinder',
  'crosshairs',
  'crosshairs-simple',
  'circle-dot',
  'bullseye',
  'bullseye-pointer',
  'bullseye-arrow',
  'link',
  'link-slash',
  'dash',
  'hyphen',
  'horizontal-rule',
  'underline',
  'rectangle',
  'input-text',
  'input-numeric',
  'input-pipe',
  'pen-field',
  'memo',
  'rotate',
  'rotate-reverse',
  'rotate-right',
  'retweet',
  'window',
  'window-maximize',
  'window-minimize',
  'window-restore',
  'browser',
  'browsers',
  'section',
  'heading',
  'sidebar',
  'sidebar-flip',
  'columns-3',
  'objects-column',
  'table-columns',
  'table-rows',
  'line-columns',
  'ruler',
  'ruler-vertical',
  'ruler-horizontal',
  'ruler-triangle',
  'pen-ruler',
  'credit-card',
  'lock',
  'lock-open',
  'unlock',
  'fingerprint',
  'sign-out',
  'sign-out-alt',
  'sign-in',
  'sign-in-alt',
  // Add more icon names here
];

// Styles to copy (comment out any you don't need)
const STYLES_TO_COPY = [
  'solid',
  'regular',
  'light',
  'thin',
  'duotone', // This is duotone-solid
  'duotone-regular',
  'duotone-light',
  'duotone-thin',
  // 'sharp-solid',
  // 'sharp-regular', 
  // 'sharp-light',
  // 'sharp-thin',
  // 'sharp-duotone-solid',
  // 'sharp-duotone-regular',
  // 'sharp-duotone-light',
  // 'sharp-duotone-thin',
];

// Brand icons to copy (these are in a different directory)
const BRAND_ICONS = [
  'github',
  'twitter',
  'facebook',
  'instagram',
  'linkedin',
  'youtube',
  'google',
  'apple',
  'microsoft',
  'amazon',
  // Add more brand names here
];

function copyIcon(iconName, style, sourceDir, destDir) {
  const sourcePath = path.join(sourceDir, `${iconName}.svg`);
  const destPath = path.join(destDir, `${iconName}.svg`);
  
  if (fs.existsSync(sourcePath)) {
    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
      fs.mkdirSync(destDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(sourcePath, destPath);
    console.log(`✓ Copied: ${style}/${iconName}.svg`);
    return true;
  } else {
    console.log(`✗ Not found: ${style}/${iconName}.svg`);
    return false;
  }
}

function main() {
  console.log('Font Awesome Pro SVG Copier');
  console.log('===========================\n');
  
  // Check if FA Pro path exists
  if (!fs.existsSync(FA_PRO_PATH)) {
    console.error(`ERROR: Font Awesome Pro path not found: ${FA_PRO_PATH}`);
    console.log('\nPlease update the FA_PRO_PATH variable in this script to point to your Font Awesome Pro directory.');
    console.log('It should contain folders like: svgs/, webfonts/, etc.');
    process.exit(1);
  }
  
  const svgsPath = path.join(FA_PRO_PATH, 'svgs');
  if (!fs.existsSync(svgsPath)) {
    console.error(`ERROR: SVGs directory not found at: ${svgsPath}`);
    console.log('Make sure you have the correct Font Awesome Pro directory.');
    process.exit(1);
  }
  
  let copiedCount = 0;
  let notFoundCount = 0;
  
  // Copy regular style icons
  STYLES_TO_COPY.forEach(style => {
    console.log(`\nCopying ${style} icons...`);
    const sourceDir = path.join(svgsPath, style);
    const destDir = path.join(__dirname, '..', 'src', 'assets', 'icons', style);
    
    if (!fs.existsSync(sourceDir)) {
      console.log(`⚠️  Style directory not found: ${style}`);
      return;
    }
    
    ICONS_TO_COPY.forEach(iconName => {
      if (copyIcon(iconName, style, sourceDir, destDir)) {
        copiedCount++;
      } else {
        notFoundCount++;
      }
    });
  });
  
  // Copy brand icons
  console.log('\nCopying brand icons...');
  const brandsSourceDir = path.join(svgsPath, 'brands');
  const brandsDestDir = path.join(__dirname, '..', 'src', 'assets', 'icons', 'brands');
  
  if (fs.existsSync(brandsSourceDir)) {
    BRAND_ICONS.forEach(brandName => {
      if (copyIcon(brandName, 'brands', brandsSourceDir, brandsDestDir)) {
        copiedCount++;
      } else {
        notFoundCount++;
      }
    });
  } else {
    console.log('⚠️  Brands directory not found');
  }
  
  // Summary
  console.log('\n===========================');
  console.log(`✓ Successfully copied: ${copiedCount} icons`);
  console.log(`✗ Not found: ${notFoundCount} icons`);
  console.log('\nNext steps:');
  console.log('1. Run: npm run build');
  console.log('2. Test your icons with the icon-demo.html file');
  
  // Show which styles were found
  console.log('\nAvailable styles in your Font Awesome Pro:');
  const availableStyles = fs.readdirSync(svgsPath).filter(f => 
    fs.statSync(path.join(svgsPath, f)).isDirectory()
  );
  console.log(availableStyles.join(', '));
}

// Run the script
main();