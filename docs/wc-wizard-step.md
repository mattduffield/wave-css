# WC-Wizard-Step Web Component

A child element for [`wc-wizard`](./wc-wizard.md) that holds one step's inline content. The parent wizard reads its attributes to build the step indicator and shows/hides its content. Same pattern as `wc-tab-item`.

> Related: ./wc-wizard.md (parent), ./wc-tab-item.md.

## Basic Usage

```html
<wc-wizard>
  <wc-wizard-step label="Basics">
    <wc-input name="name" lbl-label="Name"></wc-input>
  </wc-wizard-step>
  <wc-wizard-step label="Details" icon="cog" before-navigate="saveState">
    <wc-select name="type" lbl-label="Type"></wc-select>
  </wc-wizard-step>
</wc-wizard>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `label` | `""` | Display label shown in the step indicator pill |
| `icon` | `""` | Optional icon name for the `wc-fa-icon` in the step indicator |
| `before-navigate` | `""` | Optional name of a `window` function called before navigating away from this step |

## Notes

- Config/child element: it contains inline step content that is shown/hidden by the parent wizard and has no events or public methods of its own.
- Extends `HTMLElement` directly; its content and attributes are consumed by `wc-wizard`.
