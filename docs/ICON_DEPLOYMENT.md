# Wave CSS Icon Deployment Guide

This guide explains how to handle icon assets when deploying applications that use Wave CSS icon components.

## Overview

Wave CSS provides two icon components:
- **wc-icon**: Loads individual SVG files on demand
- **wc-fa-icon**: Loads pre-bundled icon sets

Both components need access to icon assets, which can be configured for different deployment scenarios.

## Deployment Options

### 1. Local Assets (Default)

Include icon assets with your application build:

```bash
# In your build process
npm run build

# This runs:
# - node esbuild.config.js (builds JS/CSS)
# - node scripts/bundle-icons.js (creates icon bundles)
```

Your deployment should include:
```
dist/
  assets/
    icons/          # Individual SVG files (for wc-icon)
    icon-bundles/   # JSON bundles (for wc-fa-icon)
```

### 2. CDN Deployment

Configure components to load from a CDN:

```javascript
// In your app's initialization code
WcIconConfig.setBaseUrl('https://cdn.example.com/wave-css/assets');

// Or configure separately
WcIconConfig.setIconBaseUrl('https://cdn.example.com/wave-css/icons');
WcIconConfig.setBundleBaseUrl('https://cdn.example.com/wave-css/bundles');
```

### 3. Custom Bundle (Recommended for Production)

Create a bundle with only the icons your app uses:

```bash
# Analyze your codebase and create optimized bundle
node scripts/analyze-icon-usage.js

# This creates:
# - dist/assets/icon-bundles/used-icons.json (only icons you use)
# - dist/assets/icon-bundles/icon-usage.json (usage report)
```

Then load only your custom bundle:

```javascript
// Load your custom bundle at app startup
await WcFaIcon.loadBundle('/dist/assets/icon-bundles/used-icons.json');
```

## Build Integration

### Webpack Example

```javascript
// webpack.config.js
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'node_modules/wave-css/dist/assets/icon-bundles',
          to: 'assets/icon-bundles'
        }
      ]
    })
  ]
};
```

### Vite Example

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  publicDir: 'public',
  build: {
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
```

### Next.js Example

```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(svg|json)$/,
      type: 'asset/resource'
    });
    return config;
  }
};

// In your _app.js
import { WcIconConfig } from 'wave-css';

WcIconConfig.setBaseUrl(process.env.NEXT_PUBLIC_ASSET_URL || '');
```

## Performance Optimization

### 1. Pre-load Critical Bundles

```javascript
// Pre-load bundles for better performance
async function initializeIcons() {
  // Load the styles you know you'll use
  await Promise.all([
    WcFaIcon.loadBundle('/assets/icon-bundles/solid-icons.json'),
    WcFaIcon.loadBundle('/assets/icon-bundles/regular-icons.json')
  ]);
}

// Call during app initialization
initializeIcons();
```

### 2. Use Resource Hints

```html
<!-- Preload critical icon bundles -->
<link rel="preload" 
      href="/assets/icon-bundles/solid-icons.json" 
      as="fetch" 
      crossorigin>

<!-- DNS prefetch for CDN -->
<link rel="dns-prefetch" href="https://cdn.example.com">
```

### 3. Enable Compression

Ensure your server serves compressed assets:
- Enable gzip/brotli for JSON files
- Set appropriate cache headers
- Use CDN with edge caching

## Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

```nginx
# nginx.conf
server {
  location /assets/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    gzip_static on;
  }
}
```

## Troubleshooting

### Icons Not Loading

1. Check browser console for 404 errors
2. Verify `WcIconConfig.bundleBaseUrl` is set correctly
3. Ensure bundles are included in your build output

### CORS Issues

If loading from a different domain:
```nginx
location /assets/ {
  add_header Access-Control-Allow-Origin *;
}
```

### Bundle Size Too Large

Use the analyze script to create a custom bundle:
```bash
node scripts/analyze-icon-usage.js
```

## Best Practices

1. **Use wc-fa-icon for production** - Better performance with many icons
2. **Create custom bundles** - Include only icons you use
3. **Configure base URLs early** - Set URLs before any icons render
4. **Use CDN when possible** - Leverage caching across deployments
5. **Monitor bundle sizes** - Keep track of icon usage growth

## Examples

### Static Site Deployment

```html
<!-- Set configuration before loading components -->
<script>
  window.WcIconConfig = {
    bundleBaseUrl: '/static/icon-bundles'
  };
</script>
<script type="module" src="/js/wave-css.min.js"></script>
```

### SPA Deployment

```javascript
// main.js
import { WcIconConfig } from 'wave-css';

// Configure based on environment
WcIconConfig.setBaseUrl(
  process.env.NODE_ENV === 'production' 
    ? 'https://assets.example.com/wave-css' 
    : '/dist/assets'
);
```

### Micro-frontend Deployment

```javascript
// Each micro-frontend can have its own configuration
const iconConfig = window.WaveCSS?.WcIconConfig || {};
iconConfig.setBaseUrl(`/${appName}/assets`);
```