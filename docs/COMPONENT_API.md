# Wave CSS Component API Reference

This document provides detailed API information for all Wave CSS components. Each component section includes attributes, methods, events, and usage examples.

## Base Components

### WcBaseComponent

The foundation class for all Wave CSS components.

**Lifecycle Methods:**
- `constructor()`: Initialize component
- `connectedCallback()`: Called when added to DOM
- `disconnectedCallback()`: Called when removed from DOM
- `_render()`: Override to define initial DOM structure
- `_handleAttributeChange(name, oldValue, newValue)`: Handle attribute changes

**Properties:**
- `wcId`: Unique component identifier
- `_isConnected`: Connection state
- `_pendingAttributes`: Attributes waiting to be applied

### WcBaseFormComponent

Extends WcBaseComponent with form functionality.

**Additional Properties:**
- `value`: Get/set component value
- `name`: Form field name
- `disabled`: Disabled state
- `readonly`: Read-only state
- `required`: Required validation

**Methods:**
- `validate()`: Run validation
- `setCustomValidity(message)`: Set custom validation message
- `checkValidity()`: Check if valid

## Component Reference

### wc-input

Text input component with validation support.

**Attributes:**
- `type`: Input type (text, email, password, tel, url, number)
- `placeholder`: Placeholder text
- `pattern`: Validation pattern
- `min/max`: For number inputs
- `minlength/maxlength`: Character limits
- `autocomplete`: Autocomplete behavior

**Events:**
- `input`: Value changed
- `change`: Value committed
- `invalid`: Validation failed

**Example:**
```html
<wc-input 
  name="email" 
  type="email" 
  placeholder="Enter email"
  required>
</wc-input>
```

### wc-select

Dropdown selection component.

**Attributes:**
- `options`: JSON array of options
- `placeholder`: Default option text
- `multiple`: Allow multiple selection

**Example:**
```html
<wc-select 
  name="country" 
  options='[{"value":"us","label":"United States"},{"value":"uk","label":"United Kingdom"}]'
  placeholder="Select country">
</wc-select>
```

### wc-checkbox

Checkbox input with label support.

**Attributes:**
- `checked`: Initial checked state
- `indeterminate`: Indeterminate state
- `label`: Checkbox label text

**Example:**
```html
<wc-checkbox 
  name="terms" 
  label="I agree to terms"
  required>
</wc-checkbox>
```

### wc-fa-icon

Font Awesome icon component.

**Attributes:**
- `name`: Icon name (e.g., "home", "user", "settings")
- `icon-style`: Icon style (solid, regular, light, duotone, thin, brands)
- `size`: Size (xs, sm, lg, 2x-10x)
- `color`: Icon color
- `spin`: Add spin animation
- `pulse`: Add pulse animation
- `rotate`: Rotation angle (90, 180, 270)
- `flip`: Flip direction (horizontal, vertical, both)

**For Duotone Icons:**
- `primary-color`: Primary layer color
- `secondary-color`: Secondary layer color
- `primary-opacity`: Primary layer opacity
- `secondary-opacity`: Secondary layer opacity
- `swap-opacity`: Swap opacity values

**Example:**
```html
<wc-fa-icon 
  name="home" 
  icon-style="duotone"
  size="2x"
  primary-color="blue"
  secondary-color="lightblue">
</wc-fa-icon>
```

### wc-modal

Modal dialog component.

**Attributes:**
- `open`: Show/hide modal
- `title`: Modal title
- `size`: Modal size (sm, md, lg, xl)
- `backdrop`: Show backdrop (true/false)
- `keyboard`: Close on ESC (true/false)

**Methods:**
- `show()`: Show modal
- `hide()`: Hide modal
- `toggle()`: Toggle visibility

**Events:**
- `modal:show`: Modal shown
- `modal:hide`: Modal hidden

**Example:**
```html
<wc-modal id="myModal" title="Confirm Action">
  <p>Are you sure you want to proceed?</p>
  <div slot="footer">
    <wc-button onclick="document.getElementById('myModal').hide()">Cancel</wc-button>
    <wc-button variant="primary">Confirm</wc-button>
  </div>
</wc-modal>
```

### wc-table

Data table with sorting and filtering.

**Attributes:**
- `data`: JSON array of row data
- `columns`: Column definitions
- `sortable`: Enable sorting
- `filterable`: Enable filtering
- `paginate`: Enable pagination
- `page-size`: Rows per page

**Example:**
```html
<wc-table
  columns='[{"key":"name","label":"Name"},{"key":"email","label":"Email"}]'
  data='[{"name":"John","email":"john@example.com"}]'
  sortable
  filterable>
</wc-table>
```

## Event System

### EventHub Usage

The EventHub enables communication between components.

**Broadcasting Events:**
```javascript
// Broadcast to all components
wc.EventHub.broadcast('event:name', null, { data: 'value' });

// Broadcast to specific components
wc.EventHub.broadcast('event:name', ['wc-modal#myModal'], { data: 'value' });

// Broadcast to multiple selectors
wc.EventHub.broadcast('event:name', ['.my-class', 'wc-input[name="email"]'], { data: 'value' });
```

**Common Event Patterns:**
- `form:submit`: Form submission
- `modal:show/hide`: Modal visibility
- `tab:change`: Tab selection
- `table:sort`: Table sorting
- `pagination:change`: Page change

## Theming

Themes are **generated in OKLCH** from two knobs plus a light/dark mode. Full guide:
[`THEMES.md`](./THEMES.md); token catalog: [`COLORS.md`](./COLORS.md).

### The knobs + role tokens

```css
/* A theme just sets these; the whole palette derives from them. */
--hue: 230;          /* 0–360 color-wheel angle */
--chroma-mult: 1;    /* saturation: 1 full · 0 grayscale · 0.15 muted */

/* Components style with ROLE tokens (never hardcoded hex) — they resolve
   correctly in every theme AND in light/dark automatically: */
background: var(--surface-2);
color:      var(--text-1);
/* accent fill + auto-contrast on-color */
background: var(--primary-bg-color);
color:      var(--wc-on-primary);
/* semantic */
color: var(--danger-color);
```

Key families: `--surface-1..13`, `--text-1..13`, `--component-/card-/container-*`,
`--primary-bg-color` / `--wc-on-primary`, `--success/danger/warning/info-color`, and (in `crisp`
mode) the `--accent` family. See [`COLORS.md`](./COLORS.md) for the complete list.

### Applying / switching themes

Themes are **classes on `<html>`**: `theme-<name>` + `light`|`dark` (+ optional `crisp`).

```html
<!-- Declarative + persistent (saves to localStorage) -->
<wc-theme theme="theme-ocean" mode="dark"></wc-theme>

<!-- Swatch-grid picker with a light/dark toggle -->
<wc-theme-selector theme="theme-ocean" mode="light"></wc-theme-selector>

<!-- Or set the classes directly -->
<html class="theme-ocean dark">
```

> Wave uses an explicit `.light`/`.dark` **class**, not the CSS `light-dark()` function — so mode is
> user-controllable, mixable with 50+ hue themes, and nestable. (See [`THEMES.md` §10](./THEMES.md).)

## AI Bots — which one?

Two chat components share the same UI/API; they differ by inference engine. Full docs:
[`wc-ai-bot.md`](./wc-ai-bot.md), [`wc-hf-bot.md`](./wc-hf-bot.md).

| Want… | Use | Notes |
|---|---|---|
| Zero-setup, "just works" in Chrome, private/offline | **`wc-ai-bot`** `provider="gemini-nano"` | Chrome's built-in on-device model; one-time download. |
| In-browser LLM on any WebGPU browser, pick the model | **`wc-ai-bot`** `provider="webllm"` (or `auto`) | Llama 3.2 etc. via WebGPU; auto-sized to GPU. |
| A hosted/streaming backend you control | **`wc-ai-bot`** `provider="server"` | SSE endpoint (+ optional Cloudflare Turnstile). |
| A **specific Hugging Face / ONNX model**, no WebGPU required | **`wc-hf-bot`** | Transformers.js (WASM/CPU or WebGPU). |
| Slash-command generators + knowledge bases | **`wc-ai-bot`** `mode="assistant"` | `/create-schema`, `/create-screen`, … + `context-urls`. |

`provider="auto"` (default) uses Gemini Nano if it's already available, otherwise WebLLM.
Demos: `views/ai-bot.html`, `views/ai-bot-assistant.html`, `views/hf-bot.html`, `views/company-bot-example.html`.

## Advanced Usage

### Custom Component Creation

```javascript
class WcMyComponent extends WcBaseComponent {
  static get is() {
    return 'wc-my-component';
  }
  
  static get observedAttributes() {
    return ['title', 'color'];
  }
  
  async _render() {
    this.innerHTML = `
      <div class="my-component">
        <h3>${this.getAttribute('title') || 'Default Title'}</h3>
      </div>
    `;
  }
  
  _handleAttributeChange(name, oldValue, newValue) {
    if (name === 'title') {
      this.querySelector('h3').textContent = newValue;
    }
  }
}

customElements.define(WcMyComponent.is, WcMyComponent);
```

### Form Validation

```javascript
// Custom validation
const input = document.querySelector('wc-input[name="username"]');
input.addEventListener('input', (e) => {
  if (e.target.value.length < 3) {
    e.target.setCustomValidity('Username must be at least 3 characters');
  } else {
    e.target.setCustomValidity('');
  }
});
```

### Dynamic Component Creation

```javascript
// Create component programmatically
const modal = document.createElement('wc-modal');
modal.setAttribute('title', 'Dynamic Modal');
modal.innerHTML = '<p>This modal was created dynamically!</p>';
document.body.appendChild(modal);
modal.show();
```