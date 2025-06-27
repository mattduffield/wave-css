# Wave CSS Icon Deployment Guide

## Overview
The Wave CSS icon system is designed to be flexible for different deployment scenarios. Icons can be loaded from various sources depending on your deployment setup.

## Deployment Options

### Option 1: Bundle Icons with Your Application (Recommended)
Include the icon SVGs in your application's dist folder:

```
your-app/
├── dist/
│   ├── wave-css.min.js
│   ├── wave-css.min.css
│   └── assets/
│       └── icons/
│           ├── solid/
│           ├── regular/
│           ├── light/
│           └── duotone/
```

### Option 2: CDN Hosting
Host your icons on a CDN and configure the base path:

```javascript
// Set globally for all icons
WcIcon.setBasePath('https://cdn.example.com/icons');

// Or use the icon registry
wc.iconRegistry.setBaseUrl('https://cdn.example.com/icons');
```

### Option 3: Inline Icons (Best Performance)
Pre-register frequently used icons to avoid HTTP requests:

```javascript
// In your initialization code
import { iconRegistry } from 'wave-css';

// Register individual icons
iconRegistry.register('house', '<svg>...</svg>', 'solid');
iconRegistry.register('user', '<svg>...</svg>', 'solid');

// Or load from a bundled JSON file
await iconRegistry.loadFromJson('/icons-bundle.json', 'solid');
```

### Option 4: Per-Instance Path Configuration
Set the base path on individual icons:

```html
<!-- Use different paths for different icon sets -->
<wc-icon name="house" icon-style="solid" base-path="/assets/icons"></wc-icon>
<wc-icon name="github" icon-style="brands" base-path="/assets/brand-icons"></wc-icon>
```

## Configuration Examples

### 1. Global Configuration (Recommended)
In your app's initialization:

```javascript
import WcIcon from 'wave-css';

// Configure based on environment
if (process.env.NODE_ENV === 'production') {
  WcIcon.setBasePath('https://cdn.myapp.com/assets/icons');
} else {
  WcIcon.setBasePath('/dist/assets/icons');
}
```

### 2. Build-Time Configuration
Create an icons configuration module:

```javascript
// icons-config.js
export const ICON_BASE_PATH = process.env.ICON_PATH || '/assets/icons';

// In your main app
import { ICON_BASE_PATH } from './icons-config';
WcIcon.setBasePath(ICON_BASE_PATH);
```

### 3. Runtime Configuration
Allow dynamic configuration:

```javascript
// Get path from your app config
const config = await fetch('/api/config').then(r => r.json());
WcIcon.setBasePath(config.iconBasePath);
```

## Best Practices

1. **For Small Icon Sets** (< 20 icons): Use inline registration for best performance
2. **For Large Icon Sets**: Use lazy loading with proper base path configuration
3. **For Multi-tenant Apps**: Use per-instance base-path attributes
4. **For PWAs**: Pre-cache icon paths in your service worker

## Webpack/Build Tool Integration

### Webpack Example
```javascript
// webpack.config.js
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/assets/icons', to: 'assets/icons' }
      ],
    }),
  ],
};
```

### Vite Example
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/assets/icons',
          dest: 'assets'
        }
      ]
    })
  ]
});
```

## Environment-Specific Paths

```javascript
// icon-setup.js
const getIconPath = () => {
  const host = window.location.hostname;
  
  if (host === 'localhost') {
    return '/dist/assets/icons';
  } else if (host.includes('staging')) {
    return '/stage/assets/icons';
  } else {
    return '/assets/icons';
  }
};

WcIcon.setBasePath(getIconPath());
```

## Troubleshooting

1. **404 Errors**: Check that your base path matches where icons are actually served
2. **CORS Issues**: Ensure your CDN allows cross-origin requests
3. **Performance**: Consider pre-registering frequently used icons
4. **Caching**: Icons are cached after first load, clear cache if icons don't update

## Migration from Hard-coded Paths

If you need to migrate existing code:

```javascript
// Before: Hard-coded path
// <wc-icon name="house" icon-style="solid"></wc-icon>

// After: Configurable path
WcIcon.setBasePath('/my-app/icons');
// Icons will now load from /my-app/icons/solid/house.svg
```