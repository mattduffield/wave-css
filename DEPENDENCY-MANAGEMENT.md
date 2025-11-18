# Wave CSS Dependency Management

## Overview

Wave CSS includes a centralized dependency management system that solves race conditions when loading external libraries like IMask and CodeMirror. This ensures all dependencies are loaded before components that need them initialize.

## The Problem

Before the dependency manager, components would load their own dependencies individually, causing issues:

- **Race conditions**: Multiple components loading the same library simultaneously
- **Timing issues**: Components initializing before dependencies finished downloading
- **Page refresh failures**: Phone masks not applying because IMask hadn't loaded yet
- **No ready state**: Applications couldn't know when Wave CSS was fully initialized

## The Solution

The `WcDependencyManager` provides:

1. ✅ **Centralized loading**: Each library loads exactly once, no matter how many components need it
2. ✅ **Deduplication**: Multiple simultaneous requests return the same promise
3. ✅ **Ready state API**: Applications can await `wc.ready` to know when everything is loaded
4. ✅ **Timeout handling**: Graceful error handling if libraries fail to load
5. ✅ **Works with HTMX**: Handles both initial page load and dynamic content updates

## Usage

### For Application Developers

Wait for Wave CSS to be fully ready before initializing your app:

```javascript
// Wait for all Wave CSS dependencies to load
wc.ready.then(() => {
  console.log('✓ Wave CSS is fully loaded and ready!');

  // Safe to initialize your application now
  initializeApp();
});
```

Or with async/await:

```javascript
async function main() {
  await wc.ready;
  console.log('✓ All dependencies loaded');

  // Your application code here
}

main();
```

### Check Dependency Status

```javascript
// Check if a specific dependency is loaded
if (wc.DependencyManager.isLoaded('IMask')) {
  console.log('✓ IMask is ready');
}

// Get status of all dependencies
const status = wc.DependencyManager.getStatus();
console.log(status);
// {
//   IMask: { registered: true, loaded: true, globalAvailable: true },
//   CodeMirror: { registered: true, loaded: true, globalAvailable: true },
//   Tabulator: { registered: false, loaded: false, globalAvailable: false }
// }
```

### Adding Custom Dependencies

If you have additional external libraries to load:

```javascript
// Add a custom dependency
wc.DependencyManager.addDependency('MyLibrary', {
  url: 'https://cdn.example.com/mylibrary.min.js',
  globalName: 'MyLib',
  timeout: 10000
});

// Or multiple files (JS + CSS)
wc.DependencyManager.addDependency('MyUILib', {
  urls: [
    'https://cdn.example.com/myuilib.min.css',
    'https://cdn.example.com/myuilib.min.js'
  ],
  globalName: 'MyUILib',
  timeout: 15000
});

// Register and load it
wc.DependencyManager.register('MyLibrary');
await wc.DependencyManager.load('MyLibrary');
```

## For Component Developers

If you're creating a new Wave CSS component that depends on an external library:

### 1. Register the Dependency in Constructor

```javascript
import { DependencyManager } from '../utils/dependency-manager.js';

class WcMyComponent extends HTMLElement {
  constructor() {
    super();

    // Register that this component needs IMask
    DependencyManager.register('IMask');
  }
}
```

### 2. Load Before Using

```javascript
async connectedCallback() {
  // Wait for IMask to be available
  await DependencyManager.load('IMask');

  // Now safe to use IMask
  this.mask = IMask(this.input, {
    mask: '(000) 000-0000'
  });
}
```

### 3. Add Configuration (if new library)

If your component needs a library not yet in the dependency manager, add it to the configuration in `src/js/utils/dependency-manager.js`:

```javascript
this._dependencyConfigs = {
  // ...existing configs...
  'YourLibrary': {
    url: 'https://cdn.example.com/yourlib.min.js',  // Single file
    // OR
    urls: [                                           // Multiple files
      'https://cdn.example.com/yourlib.min.css',
      'https://cdn.example.com/yourlib.min.js'
    ],
    globalName: 'YourLib',  // Name on window object
    timeout: 10000          // Timeout in milliseconds
  }
};
```

## Built-in Dependencies

Wave CSS pre-configures these dependencies:

| Dependency | Purpose | Global Name | Components Using It |
|-----------|---------|-------------|---------------------|
| IMask | Input masking for phone, SSN, currency, etc. | `IMask` | `wc-mask-hub`, `wc-input` |
| CodeMirror | Code editor with syntax highlighting | `CodeMirror` | `wc-code-mirror` |
| Tabulator | Advanced data tables | `Tabulator` | `wc-tabulator` |

## How It Works

### Registration Phase (Constructor)

When a component is constructed, it calls `DependencyManager.register('LibraryName')` to indicate it needs that library.

```javascript
constructor() {
  super();
  DependencyManager.register('IMask');  // "I need IMask!"
}
```

### Loading Phase (ConnectedCallback)

When the component connects to the DOM, it awaits the dependency:

```javascript
async connectedCallback() {
  await DependencyManager.load('IMask');  // Wait for it to load
  // Now IMask is guaranteed to be available
  this.initializeMask();
}
```

### Deduplication

If 10 components all call `DependencyManager.load('IMask')`:
- The **first** call starts downloading IMask
- The remaining **9 calls** receive the **same promise**
- IMask downloads **once**, all 10 components await the same download

### Ready State Resolution

The `wc.ready` promise resolves when:
1. All registered dependencies have been loaded
2. Their global objects are available on `window`

```javascript
// Application code
await wc.ready;
// ✓ IMask loaded and window.IMask exists
// ✓ CodeMirror loaded and window.CodeMirror exists
// ✓ All components can safely initialize
```

## Timeout and Error Handling

If a dependency fails to load:

```javascript
try {
  await DependencyManager.load('IMask');
} catch (error) {
  console.error('Failed to load IMask:', error);
  // Show error to user or fallback behavior
}
```

Default timeout: **10 seconds** for single files, **15 seconds** for multiple files

To customize timeout, add it to the configuration:

```javascript
wc.DependencyManager.addDependency('SlowLibrary', {
  url: 'https://slow-cdn.example.com/library.js',
  globalName: 'SlowLib',
  timeout: 30000  // 30 seconds
});
```

## HTMX Compatibility

The dependency manager works seamlessly with HTMX and includes built-in integration for dynamic content updates.

**Initial Page Load:**
```html
<wc-mask-hub></wc-mask-hub>
<wc-input type="tel"
  _="on wc:ready from document
     call wc.MaskHub.phoneMaskElement(me)
  end">
</wc-input>
```
- `wc-mask-hub` registers and loads IMask
- `wc.ready` resolves when IMask is loaded
- `wc:ready` event fires after DOMContentLoaded
- Hyperscript listeners receive the event and apply masks

**HTMX Partial Update (Automatic):**
```html
<!-- HTMX swaps in new content -->
<wc-input type="tel"
  _="on wc:ready from document
     call wc.MaskHub.phoneMaskElement(me)
  end">
</wc-input>
```
- HTMX fires `htmx:afterSettle` event
- DependencyManager detects content swap
- After 100ms delay (for hyperscript initialization), dispatches `wc:ready` to new elements
- Hyperscript listeners on new elements receive the event
- Masks apply automatically

### How It Works

The dependency manager listens for `htmx:afterSettle` events:

```javascript
document.addEventListener('htmx:afterSettle', (event) => {
  if (dependencyManager.isReady) {
    const target = event.detail.target;

    // Wait for hyperscript to process new elements
    setTimeout(() => {
      // Dispatch wc:ready to container
      target.dispatchEvent(new CustomEvent('wc:ready', { bubbles: true }));

      // Dispatch wc:ready to all child elements
      target.querySelectorAll('*').forEach(el => {
        el.dispatchEvent(new CustomEvent('wc:ready', { bubbles: false }));
      });
    }, 100);
  }
});
```

**Why `htmx:afterSettle` instead of `htmx:afterSwap`?**
- `htmx:afterSwap` fires immediately after content is swapped
- Hyperscript may not have processed `_` attributes yet
- `htmx:afterSettle` fires after all HTMX processing completes
- The 100ms delay ensures hyperscript has initialized listeners

**Why the 100ms delay?**
- Hyperscript needs time to parse and attach event listeners to new elements
- Without the delay, `wc:ready` would fire before listeners exist
- 100ms is sufficient for hyperscript initialization while remaining imperceptible to users

## Migration Guide

If you have existing Wave CSS components with custom dependency loading:

### Before (Old Way)
```javascript
import { loadLibrary } from './helper-function.js';

class WcMyComponent extends HTMLElement {
  constructor() {
    super();
    this.loadLibrary = loadLibrary.bind(this);
  }

  async connectedCallback() {
    // Risk: Multiple loads, race conditions
    await this.loadLibrary('https://cdn.example.com/library.js', 'MyLib');
    this.initializeFeature();
  }
}
```

### After (New Way)
```javascript
import { DependencyManager } from '../utils/dependency-manager.js';

class WcMyComponent extends HTMLElement {
  constructor() {
    super();
    // Register dependency
    DependencyManager.register('MyLib');
  }

  async connectedCallback() {
    // Safe: Deduplicated, cached, no race conditions
    await DependencyManager.load('MyLib');
    this.initializeFeature();
  }
}
```

## Debugging

Enable console logging to see what's happening:

```javascript
// Check status
console.log(wc.DependencyManager.getStatus());

// Monitor the ready promise
wc.ready
  .then(() => console.log('✓ Ready!'))
  .catch(err => console.error('✗ Failed:', err));
```

Console output when dependencies load:

```
⏳ Loading IMask...
✓ IMask loaded successfully
⏳ Loading CodeMirror...
✓ CodeMirror loaded successfully
✓ All Wave CSS dependencies ready!
```

## API Reference

### `wc.ready`
**Type:** `Promise<void>`

Promise that resolves when all registered dependencies are loaded.

```javascript
await wc.ready;
```

### `wc.DependencyManager.register(name)`
**Parameters:** `name` (string) - Dependency name

Register a dependency as required. Call this in component constructors.

```javascript
DependencyManager.register('IMask');
```

### `wc.DependencyManager.load(name, customConfig?)`
**Parameters:**
- `name` (string) - Dependency name
- `customConfig` (object, optional) - Custom configuration

**Returns:** `Promise<any>` - The loaded library's global object

Load a dependency (or return cached promise if already loading).

```javascript
const IMask = await DependencyManager.load('IMask');
```

### `wc.DependencyManager.isLoaded(name)`
**Parameters:** `name` (string) - Dependency name

**Returns:** `boolean` - Whether the dependency is loaded

Check if a dependency is already loaded.

```javascript
if (DependencyManager.isLoaded('IMask')) {
  // Safe to use IMask
}
```

### `wc.DependencyManager.getStatus()`
**Returns:** `object` - Status of all dependencies

Get detailed status of all configured dependencies.

```javascript
const status = DependencyManager.getStatus();
```

### `wc.DependencyManager.addDependency(name, config)`
**Parameters:**
- `name` (string) - Dependency name
- `config` (object) - Configuration object
  - `url` (string) - URL for single file
  - `urls` (array) - URLs for multiple files
  - `globalName` (string) - Name on window object
  - `timeout` (number) - Timeout in milliseconds

Add a custom dependency configuration.

```javascript
DependencyManager.addDependency('Chart.js', {
  url: 'https://cdn.jsdelivr.net/npm/chart.js',
  globalName: 'Chart',
  timeout: 10000
});
```

## Best Practices

1. **Always register in constructor**: This ensures the dependency manager knows what needs to load before marking the system as "ready"

2. **Always await before using**: Even if you think a dependency is loaded, always await it to handle edge cases

3. **Use specific timeouts**: If a library is large or from a slow CDN, increase the timeout

4. **Handle errors gracefully**: Wrap `load()` calls in try/catch to handle network failures

5. **Test with slow networks**: Use Chrome DevTools to throttle network and test race conditions

6. **Document dependencies**: When creating a new component, document which external libraries it needs

## Example: Complete Component with Dependencies

```javascript
import { DependencyManager } from '../utils/dependency-manager.js';
import { WcBaseComponent } from './wc-base-component.js';

class WcChart extends WcBaseComponent {
  constructor() {
    super();

    // Register Chart.js as required
    DependencyManager.register('Chart.js');
  }

  async connectedCallback() {
    super.connectedCallback();

    try {
      // Wait for Chart.js to load
      const Chart = await DependencyManager.load('Chart.js');

      // Now safe to create chart
      this.chart = new Chart(this.canvas, {
        type: 'bar',
        data: this.getData()
      });

    } catch (error) {
      console.error('Failed to load Chart.js:', error);
      this.showError('Unable to load charting library');
    }
  }

  disconnectedCallback() {
    if (this.chart) {
      this.chart.destroy();
    }
    super.disconnectedCallback();
  }
}

customElements.define('wc-chart', WcChart);
```

## Troubleshooting

### "wc.ready never resolves"

**Cause:** A registered dependency failed to load or wasn't registered properly.

**Solution:** Check browser console for error messages. Verify all dependencies in `getStatus()`.

```javascript
console.log(wc.DependencyManager.getStatus());
```

### "Dependency loads multiple times"

**Cause:** Not using the dependency manager, using old `loadLibrary()` method.

**Solution:** Migrate to `DependencyManager.load()`.

### "Component initializes before dependency loads"

**Cause:** Not awaiting `DependencyManager.load()`.

**Solution:** Always use `await`:

```javascript
// ✗ Wrong
DependencyManager.load('IMask');  // Missing await!
this.mask = IMask(...);           // IMask might not be ready

// ✓ Correct
await DependencyManager.load('IMask');
this.mask = IMask(...);  // Guaranteed to be ready
```

### "Timeout errors"

**Cause:** Slow network or CDN, or library actually failing to load.

**Solution:** Increase timeout or check CDN availability:

```javascript
wc.DependencyManager.addDependency('SlowLib', {
  url: 'https://slow-cdn.com/lib.js',
  globalName: 'SlowLib',
  timeout: 30000  // Increase from default 10s
});
```

---

For questions or issues, please refer to the [Wave CSS documentation](https://github.com/yourusername/wave-css) or open an issue on GitHub.
