# WC-Emoji Web Component

An emoji reaction bar with an expandable, categorized emoji picker. It can render a quick-access reaction row plus a "more" trigger, or a picker-only trigger button. Every emoji carries a shortcode (e.g. `:thumbsup:` for 👍) shown as a tooltip.

## Features

- Quick-access reaction bar with configurable emojis
- Expandable picker with categorized emojis
- Picker-only mode (trigger button, no quick bar)
- Custom categories and quick emojis via JSON attributes
- Shortcodes for every emoji (tooltips + programmatic lookup)
- Reveal-on-hover binding to an ancestor element
- EventHub API to open/close/toggle the picker

## Basic Usage

```html
<!-- Quick reaction bar with expandable picker -->
<wc-emoji
  quick-emojis='["👍","❤️","🎉","😂"]'
  onpick="handleEmoji(event.detail.emoji)">
</wc-emoji>

<!-- Picker only (just a trigger button) -->
<wc-emoji picker-only trigger-emoji="😀"
  onpick="handleEmoji(event.detail.emoji)">
</wc-emoji>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `quick-emojis` | `["👍","❤️","🎉","😂"]` | JSON array of emoji strings for quick-access buttons |
| `picker-only` | — | Boolean; hide the quick bar, show only the trigger button |
| `trigger-emoji` | `...` | Text/emoji shown on the "more" trigger button |
| `onpick` | — | Inline handler invoked on selection; receives `event.detail.emoji` |
| `categories` | — | JSON array to override the default emoji categories |
| `hover-target` | — | CSS selector for an ancestor; the emoji bar stays hidden until that ancestor is hovered |
| `id` | — | Element id |
| `class` | — | CSS classes |

## Events

| Event | Detail | Description |
|-------|--------|-------------|
| `wcemojipick` (alias `emoji:pick`) | `{ emoji, shortcode }` | Fired when an emoji is selected |

## Methods

Static methods on `WcEmoji`:

| Method | Description |
|--------|-------------|
| `getShortcode(emoji)` | Look up the shortcode for an emoji |
| `getEmojiByShortcode(shortcode)` | Look up the emoji for a shortcode |
| `WcEmoji.shortcodeMap` | Full emoji → shortcode map (static getter) |
| `WcEmoji.defaultCategories` | Default category definitions (static getter) |

## EventHub API

```javascript
wc.EventHub.broadcast('wcemojiopen', '#myEmoji');
wc.EventHub.broadcast('wcemojiclose', '#myEmoji');
wc.EventHub.broadcast('wcemojitoggle', '#myEmoji');
```

## Examples

```html
<!-- Custom categories -->
<wc-emoji
  categories='[{"name":"Favorites","emojis":["🔥","🚀","💯"]}]'
  onpick="handleEmoji(event.detail.emoji)">
</wc-emoji>

<!-- Reveal on hover of a parent message row -->
<div class="message">
  <wc-emoji hover-target=".message" onpick="react(event.detail.emoji)"></wc-emoji>
</div>
```

## Notes

- Extends `WcBaseComponent`.
- Shortcodes are shown as tooltips on hover; use `WcEmoji.shortcodeMap` to resolve them programmatically.
