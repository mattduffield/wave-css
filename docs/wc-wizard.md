# WC-Wizard Web Component

A declarative step-by-step wizard. All step content is inline (same pattern as `wc-tab`) and shown/hidden via CSS. Navigation is driven by public methods — the consumer supplies their own navigation buttons. Step indicator pills are rendered above the content and are clickable.

> Related: ./wc-wizard-step.md (child), ./wc-tab.md.

## Features

- Inline step content via [`wc-wizard-step`](./wc-wizard-step.md) children
- Clickable step indicator pills (with optional icons)
- Public navigation API (`next`, `back`, `goTo`) — buttons provided externally
- Per-step `before-navigate` hook (calls a `window` function before leaving a step)
- Emits `wcwizardstepchange` so consumers can update button visibility

## Basic Usage

```html
<wc-wizard id="my-wizard">
  <wc-wizard-step label="Basics">
    <wc-input name="name" lbl-label="Name"></wc-input>
  </wc-wizard-step>
  <wc-wizard-step label="Details" before-navigate="saveState">
    <wc-select name="type" lbl-label="Type"></wc-select>
  </wc-wizard-step>
  <wc-wizard-step label="Preview">
    <div id="preview"></div>
  </wc-wizard-step>
</wc-wizard>

<div class="row gap-2">
  <button onclick="document.getElementById('my-wizard').back()">Back</button>
  <button onclick="document.getElementById('my-wizard').next()">Next</button>
</div>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `active-step` | `0` | Zero-based index of the initially active step; setting it later navigates to that step |

## Events

| Event | Description |
|-------|-------------|
| `wcwizardstepchange` | Fires after the step changes (and once on initial render). `detail`: `{ step, totalSteps, isFirst, isLast }`. Bubbles and is composed |

## Methods

| Method | Description |
|--------|-------------|
| `next()` | Advance to the next step (no-op on the last step) |
| `back()` | Go to the previous step (no-op on the first step) |
| `goTo(stepIndex)` | Navigate to a specific zero-based step index |
| `getCurrentStep()` | Returns the current step index |
| `getTotalSteps()` | Returns the total number of steps |
| `isFirst()` | Returns `true` if on the first step |
| `isLast()` | Returns `true` if on the last step |

## Examples

```html
<wc-wizard id="setup" active-step="0"></wc-wizard>
<script>
  const wiz = document.getElementById('setup');
  wiz.addEventListener('wcwizardstepchange', (e) => {
    const { isFirst, isLast } = e.detail;
    document.getElementById('backBtn').disabled = isFirst;
    document.getElementById('nextBtn').style.display = isLast ? 'none' : '';
  });
</script>
```

## Notes

- A step's `before-navigate` attribute names a `window` function that is invoked before navigating away from that step.
- Step indicator pills are clickable and call `goTo` for their index.
- For dynamic step content, use `hx-get` with `hx-trigger="load"` inside a step.
