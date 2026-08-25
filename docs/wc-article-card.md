# WC-Article-Card Web Component

A card that fetches article metadata (title, description, image, publish date, domain) from a URL and renders it as a linked preview card.

> Related: ./wc-contact-card.md, ./wc-contact-chip.md, ./wc-data-cards.md.

## Features

- Fetches article metadata from a backend endpoint
- Displays a cover image, title link, description, source domain, and publish date
- Optional image override via `img-url` or a preset `article-type` image
- Theme-aware styling with hover lift effect
- Async-ready: resolves the `ready` promise after data loads

## Basic Usage

```html
<wc-article-card url="https://example.com/some-article"></wc-article-card>
```

## Attributes

| Attribute | Default | Description |
|-----------|---------|-------------|
| `id` | — | Unique identifier |
| `class` | — | CSS classes applied to the component |
| `url` | — | Article URL. Metadata is fetched from `/api/article-metadata?url=<url>` and the card links to this URL |
| `img-url` | — | Explicit image URL that overrides the fetched `imageUrl` |
| `article-type` | `news` | Preset cover image keyword: `news`, `css`, `technology`, or `programming` |

## Notes

- Metadata is fetched from `/api/article-metadata?url=<encoded url>`; the endpoint is expected to return `{ title, description, imageUrl, publishDate, domain }`.
- When `url` is present the component defers its `ready` promise and resolves it once the fetch completes (or errors).
- Host element uses `display: contents`.
