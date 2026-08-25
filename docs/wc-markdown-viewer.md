# WC-Markdown-Viewer Web Component

Enhances server-rendered (goldmark) markdown HTML with Prism.js syntax highlighting and copy-to-clipboard buttons on code blocks. You give it already-rendered markdown HTML; it upgrades the code blocks and applies markdown content styling.

## Features

- Prism.js syntax highlighting for fenced code blocks
- Copy-to-clipboard button on each code block (appears on hover, 2s checkmark feedback)
- Loads Prism core and only the language components it detects, on demand
- Auto-processes on connect and re-processes after HTMX swaps
- Theme auto-detects dark/light, overridable via `theme`
- Full markdown content styling (headings, tables, blockquotes, lists, inline code, links, images)

## Basic Usage

```html
<wc-markdown-viewer>
  <h1>My Doc</h1>
  <pre><code class="language-json">{"key": "value"}</code></pre>
</wc-markdown-viewer>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Element id |
| `class` | — | CSS classes |
| `theme` | auto-detect (dark/light) | Prism theme name override |

## Examples

```html
<!-- Multiple languages; components load on demand -->
<wc-markdown-viewer>
  <pre><code class="language-python">print("hi")</code></pre>
  <pre><code class="language-sql">SELECT * FROM users;</code></pre>
</wc-markdown-viewer>

<!-- Force a specific Prism theme -->
<wc-markdown-viewer theme="prism-tomorrow">
  <pre><code class="language-go">package main</code></pre>
</wc-markdown-viewer>
```

## Notes

- Extends `WcBaseComponent`.
- Prism.js core (v1.29.0) and the needed language components are lazy-loaded from the CDN (or your self-hosted mirror via `WaveAssetBase`) based on the `language-*` classes found in the code blocks; supports json, javascript, sql, bash, go, html, python, ruby, and more.
- htmx-safe: re-processes freshly-swapped content via an `htmx:afterSettle` listener.
- Wraps content the server already rendered — it does not itself parse Markdown source.
- No custom events; no public methods.
