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


## References
https://fabricweb.z5.web.core.windows.net/pr-deploy-site/refs/heads/master/theming-designer/
https://m2.material.io/design/color/the-color-system.html#color-theme-creation



  .theme-rose      { --hue: 0; }
  .theme-petal     { --hue: 5; }
  .theme-sunset    { --hue: 10; }
  .theme-peach     { --hue: 15; }
  .theme-fire      { --hue: 20; }
  .theme-desert    { --hue: 30; }
  .theme-golden    { --hue: 45; }
  .theme-honey     { --hue: 50; }
  .theme-amber     { --hue: 55; }
  .theme-olive     { --hue: 65; } 
  .theme-moss      { --hue: 75; } 
  .theme-avocado   { --hue: 85; } 
  .theme-lime      { --hue: 90; }
  .theme-fern      { --hue: 95; } 
  .theme-meadow    { --hue: 105; }
  .theme-cornsilk  { --hue: 108; } 
  .theme-sage      { --hue: 110; }
  .theme-forest    { --hue: 120; }
  .theme-jungle    { --hue: 130; }
  .theme-emerald   { --hue: 140; }
  .theme-mint      { --hue: 150; }
  .theme-turquoise { --hue: 160; }
  .theme-aqua      { --hue: 170; }
  .theme-lagoon    { --hue: 180; }
  .theme-ice       { --hue: 190; }
  .theme-ocean     { --hue: 200; }
  .theme-azure     { --hue: 210; }
  .theme-sky       { --hue: 220; }
  .theme-midsky    { --hue: 230; }
  .theme-deepsky   { --hue: 240; }
  .theme-royal     { --hue: 250; }
  .theme-twilight  { --hue: 260; }
  .theme-lavender  { --hue: 275; }
  .theme-violet    { --hue: 290; }
  .theme-grape     { --hue: 300; }
  .theme-plum      { --hue: 320; }
  .theme-fuchsia   { --hue: 330; }
  .theme-cottoncandy { --hue: 340; }
  .theme-blush     { --hue: 350; }
  .theme-bubblegum { --hue: 355; }

  .theme-rose,
  .theme-petal,
  .theme-sunset,
  .theme-peach,
  .theme-fire,
  .theme-desert,
  .theme-golden,
  .theme-honey,
  .theme-amber,
  .theme-olive,
  .theme-moss,
  .theme-avocado,
  .theme-lime,
  .theme-fern,
  .theme-meadow,
  .theme-cornsilk,
  .theme-sage,
  .theme-forest,
  .theme-jungle,
  .theme-emerald,
  .theme-mint,
  .theme-turquoise,
  .theme-aqua,
  .theme-lagoon,
  .theme-ice,
  .theme-ocean,
  .theme-azure,
  .theme-sky,
  .theme-midsky,
  .theme-deepsky,
  .theme-royal,
  .theme-twilight,
  .theme-lavender,
  .theme-violet,
  .theme-grape,
  .theme-plum,
  .theme-fuchsia,
  .theme-cottoncandy,
  .theme-blush,
  .theme-bubblegum,


    --swatch-1: oklch(99% .05 var(--hue));
    --swatch-2: oklch(95% .05 var(--hue));
    --swatch-3: oklch(90% .1 var(--hue));
    --swatch-4: oklch(80% .2 var(--hue));
    --swatch-5: oklch(72% .25 var(--hue));
    --swatch-6: oklch(67% .31 var(--hue));
    --swatch-7: oklch(50% .27 var(--hue));
    --swatch-8: oklch(35% .25 var(--hue));
    --swatch-9: oklch(25% .22 var(--hue));
    --swatch-10: oklch(14% .2 var(--hue));
    --swatch-11: oklch(10% .19 var(--hue));
    --swatch-12: oklch(5% .1 var(--hue));
