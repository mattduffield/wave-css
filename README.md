# Wave CSS
This library provides a set of classes and CSS variables for building web applications that natively support themes. It also comes with a set of web components that are designed to use the theming system without any extra configuration.

This library has been built with HTMX and Hyperscript in mind so that you still have the power of web components but does not use Shadow DOM. You still get excellent code reuse and encapsulation without the complexity of trying to have third-party libraries penetrate the Shadow Root.


## General Web Components

- [wc-base-component](docs/wc-base-component.md)
- [wc-accordion](docs/wc-accordion.md)
- [wc-background-image](docs/wc-background-image.md)
- [wc-breadcrumb](docs/wc-breadcrumb.md)
- [wc-canvas-dot-hightlight](docs/wc-canvas-dot-highlight.md)
- [wc-dropdown](docs/wc-dropdown.md)
- [wc-flip-box](docs/wc-flip-box.md)
- [wc-image](docs/wc-image.md)
- [wc-save-button](docs/wc-save-button.md)
- [wc-save-split-button](docs/wc-save-split-button.md)
- [wc-sidebar](docs/wc-sidebar.md)
- [wc-sidenav](docs/wc-sidenav.md)
- [wc-slide-show](docs/wc-slide-show.md)
- [wc-split-button](docs/wc-split-button.md)
- [wc-tab](docs/wc-tab.md)
- [wc-tabulator](docs/wc-tabulator.md)
- [wc-theme-selector](docs/wc-theme-selector.md)
- [wc-timeline](docs/wc-timeline.md)


## Form Web Components
- [wc-base-form-component](docs/wc-base-form-component.md)
- [wc-form](docs/wc-form.md)
- [wc-code-mirror](docs/wc-code-mirror.md)
- [wc-input](docs/wc-input.md)
- [wc-select](docs/wc-select.md)
- [wc-textarea](docs/wc-textarea.md)


## Loaders
- [wc-article-skeleton](docs/wc-article-skeleton.md)
- [wc-card-skeleton](docs/wc-card-skeleton.md)
- [wc-list-skeleton](docs/wc-list-skeleton.md)
- [wc-table-skeleton](docs/wc-table-skeleton.md)
- [wc-loader](docs/wc-loader.md)


## Non-UI Components
- [wc-behavior](docs/wc-behavior.md)
- [wc-event-handler](docs/wc-event-handler.md)
- [wc-event-hub](docs/wc-event-hub.md)
- [wc-hotkey](docs/wc-hotkey.md)
- [wc-javascript](docs/wc-javascript.md)
- [wc-mask-hub](docs/wc-mask-hub.md)
- [wc-prompt](docs/wc-prompt.md)
- [wc-theme](docs/wc-theme.md)
- [wc-visibility-change](docs/wc-visibility-change.md)


## Component Lifecycle
- ctor
- `_render`
- connectedCallback
- `_handleAttributeChange`



## Build
Execute the following command to build the bundler for both `css` and `javascript`.

```bash
npm run build
```

## Viewing Components
Execute the following to view the components locally.

```bash
python3 -m http.server 3015
```


## References
https://fabricweb.z5.web.core.windows.net/pr-deploy-site/refs/heads/master/theming-designer/
https://m2.material.io/design/color/the-color-system.html#color-theme-creation
