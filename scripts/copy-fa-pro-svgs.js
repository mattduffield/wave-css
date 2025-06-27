const fs = require('fs');
const path = require('path');

// IMPORTANT: Update this path to where you extracted Font Awesome Pro
const FA_PRO_PATH = '/Users/matthewduffield/Documents/_assets/fontawesome-pro-6.7.2-web'; // <-- UPDATE THIS!

// Font Awesome icon aliases mapping
const ICON_ALIASES = {
  // Common aliases
  'search': 'magnifying-glass',
  'edit': 'pen-to-square',
  'save': 'floppy-disk',
  'undo': 'arrow-rotate-left',
  'redo': 'arrow-rotate-right',
  'sign-out': 'right-from-bracket',
  'sign-in': 'right-to-bracket',
  'sign-out-alt': 'arrow-right-from-bracket',
  'sign-in-alt': 'arrow-right-to-bracket',
  'home': 'house',
  'settings': 'gear',
  'cog': 'gear',
  'cogs': 'gears',
  'trash-alt': 'trash-can',
  'delete': 'trash',
  'remove': 'xmark',
  'clear': 'eraser',
  'close': 'xmark',
  'times': 'xmark',
  'check': 'check',
  'ok': 'check',
  'search-plus': 'magnifying-glass-plus',
  'search-minus': 'magnifying-glass-minus',
  'zoom-in': 'magnifying-glass-plus',
  'zoom-out': 'magnifying-glass-minus',
  'power-off': 'power-off',
  'sign-out': 'right-from-bracket',
  'log-out': 'right-from-bracket',
  'sign-in': 'right-to-bracket',
  'log-in': 'right-to-bracket',
  'download': 'download',
  'upload': 'upload',
  'shopping-cart': 'cart-shopping',
  'chart-bar': 'chart-column',
  'bar-chart': 'chart-column',
  'line-chart': 'chart-line',
  'area-chart': 'chart-area',
  'pie-chart': 'chart-pie',
  'usd': 'dollar-sign',
  'eur': 'euro-sign',
  'gbp': 'sterling-sign',
  'inr': 'indian-rupee-sign',
  'jpy': 'yen-sign',
  'cny': 'yen-sign',
  'btc': 'bitcoin-sign',
  'rouble': 'ruble-sign',
  'rub': 'ruble-sign',
  'krw': 'won-sign',
  'refresh': 'arrows-rotate',
  'sync': 'arrows-rotate',
  'mail': 'envelope',
  'email': 'envelope',
  'warning': 'triangle-exclamation',
  'exclamation-triangle': 'triangle-exclamation',
  'error': 'circle-xmark',
  'times-circle': 'circle-xmark',
  'info': 'circle-info',
  'info-circle': 'circle-info',
  'question-circle': 'circle-question',
  'help': 'circle-question',
  'picture': 'image',
  'photo': 'image',
  'picture-o': 'image',
  'photo-o': 'image',
  'pictures': 'images',
  'photos': 'images',
};

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
  'magnifying-glass-plus',
  'magnifying-glass-minus',
  'gear',
  'gears',
  'gear-complex',
  'trash',
  'trash-can',
  'power-off',
  'pen-to-square',
  'edit', // Alias for pen-to-square - will copy the same icon
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
  'circle',
  'circle-check',
  'circle-xmark',
  'circle-info',
  'circle-question',
  'square',
  'square-check',
  'square-xmark',
  'square-info',
  'square-question',
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
  'search', // Alias for magnifying-glass
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
  'cart-shopping',
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
  'chart-area',
  'chart-bar',
  'chart-column',
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
  'dollar-sign',
  'triangle',
  'triangle-exclamation',
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
  'earth-oceana',
  'earth-europe',
  'earth-asia',
  'earth-africa',
  'earth-americas',
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
  'right-from-bracket',
  'arrow-right-from-bracket',
  'right-to-bracket',
  'arrow-right-to-bracket',
  'eraser',
  'vial',
  'vials',
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
  // Check if this icon name is an alias
  const actualIconName = ICON_ALIASES[iconName] || iconName;
  
  // Try the original name first, then the alias
  let sourcePath = path.join(sourceDir, `${iconName}.svg`);
  let destPath = path.join(destDir, `${iconName}.svg`);
  
  // If original doesn't exist and we have an alias, try the alias
  if (!fs.existsSync(sourcePath) && actualIconName !== iconName) {
    sourcePath = path.join(sourceDir, `${actualIconName}.svg`);
    // Still save with the original requested name for easier use
    destPath = path.join(destDir, `${iconName}.svg`);
    
    if (fs.existsSync(sourcePath)) {
      console.log(`  → Using alias: ${iconName} → ${actualIconName}`);
    }
  }
  
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
    console.log(`✗ Not found: ${style}/${iconName}.svg${actualIconName !== iconName ? ` (tried alias: ${actualIconName})` : ''}`);
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