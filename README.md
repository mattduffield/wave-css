# Wave CSS
This library provides a set of classes and CSS variables for building web applications that natively support themes. It also comes with a set of web components that are designed to use the theming system without any extra configuration.

This library has been built with HTMX and Hyperscript in mind so that you still have the power of web components but does not use Shadow DOM. You still get excellent code reuse and encapsulation without the complexity of trying to have third-party libraries penetrate the Shadow Root.

## Current Web Components

- wc-base-component
- wc-accordion
- wc-background-image
- wc-div
- wc-dropdown
- wc-flip-box
- wc-image
- wc-menu
- wc-sidebar
- wc-sidenav
- wc-slideshow-image
- wc-slideshow
- wc-tab-item
- wc-tab
- wc-theme-selector
- wc-timeline
- wc-top-nav

## Build

```bash
npm run build
```

## Viewing Components
Execute the following to view the components locally.

```bash
python3 -m http.server 3015
```