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
- wc-loader
	- Properties
    - Size
    - Speed
    - Thickness
	- API
    - show
    - hide
    - toggle
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


## Form Web Components

- wc-base-form-component
- wc-form
- wc-code-mirror
- wc-input (text, number, range, date, time, week, month, checkbox, radio)
- wc-select (standard and multiple with mode=chip and mode=multiple)
- wc-textarea


## Non-UI Components

- wc-behavior
- wc-event-handler
- wc-event-hub
- wc-visibility-change


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

## Colors

| Name             | Color     |
| ---------------- | --------- |
| Primary BG color | #91c5ff |
| Primary color    | #ffffff |
| BG color         | #0d47a1 |
| Color            | #91c5ff |
