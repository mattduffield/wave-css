# WC-Dropdown-Item Web Component

A lightweight semantic wrapper for a single dropdown entry, used inside [`wc-dropdown`](./wc-dropdown.md). It renders `display: contents` (via the `contents` class) and adds no styling or behavior of its own — wrap the actual link/content inside it.

> Related: ./wc-dropdown.md (parent).

## Basic Usage

```html
<wc-dropdown label="Menu">
  <wc-dropdown-item><a href="#">Profile</a></wc-dropdown-item>
  <wc-dropdown-item><a href="#">Settings</a></wc-dropdown-item>
  <wc-dropdown-item><a href="#">Logout</a></wc-dropdown-item>
</wc-dropdown>
```

## Notes

- Config/wrapper element: it has no observed attributes, no events, and no public methods.
- Extends `HTMLElement` directly (not `WcBaseComponent`).
