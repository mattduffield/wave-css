# WC-Tab-Item Web Component

An individual tab content panel used inside [`wc-tab`](./wc-tab.md). The parent `wc-tab` reads its `label` to build the tab button and shows/hides the panel content. The host renders `display: contents`; the inner `.wc-tab-item` container holds the panel content.

> Related: ./wc-tab.md (parent).

## Features

- Declares a tab's label and its inline content
- Can be activated programmatically or by clicking the item
- Updates the corresponding tab button text when `label` changes

## Basic Usage

```html
<wc-tab>
  <wc-tab-item class="active" label="London">
    <div class="p-4">
      <h3>London</h3>
      <p>Content for the London tab.</p>
    </div>
  </wc-tab-item>
  <wc-tab-item label="New York">
    <div class="p-4">
      <h3>New York</h3>
      <p>Content for the New York tab.</p>
    </div>
  </wc-tab-item>
</wc-tab>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes; add `active` to mark the initially shown tab |
| `label` | — | Tab button text; changing it updates the corresponding button |
| `active` | (absent) | Marks this item as the active panel |

## Methods

| Method | Description |
|--------|-------------|
| `activate()` | Activates this tab by clicking its corresponding tab button in the parent `wc-tab` |

You can also call `tabItem.click()` to activate the tab.

## Examples

```html
<script>
  // Programmatically activate a tab
  const tabItem = document.querySelector('wc-tab-item[label="New York"]');
  tabItem.activate();
</script>
```

## Notes

- Clicking the `wc-tab-item` element itself (not child elements) activates the tab, so buttons/links inside the panel content keep working normally.
- When `label` changes, the parent updates the matching tab button's text and `data-label` while preserving any close button on removable tabs.
