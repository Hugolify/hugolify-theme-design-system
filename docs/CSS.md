# CSS Architecture — Design Tokens & Vanilla CSS

---

## Table of contents

- [Philosophy](#philosophy)
- [Stack overview](#stack-overview)
- [Folder structure](#folder-structure)
- [Alphabetical property order](#alphabetical-property-order)
- [Cascade layers](#cascade-layers)
- [Packages](#packages)

---

## Philosophy

- **One single place** for each style decision
- **From abstract to concrete** — tokens → base → components
- **Readability first** — an open file should be self-explanatory
- **No magic** — no framework, no mandatory build tool

---

## Stack overview

The CSS stack is split across four shared npm packages and a local layer:

```text
@uncinq/design-tokens        ← primitive + semantic CSS custom properties  (@layer tokens)
@uncinq/component-tokens     ← component-scoped CSS custom properties      (@layer tokens)
@uncinq/css-base             ← reset, native element styles, layouts       (@layer reset, base, layouts)
@uncinq/css-components       ← generic UI components                       (@layer components, utilities)
hugolify-theme-design-system ← hugolify-specific tokens + components       (all layers)
third-party stylesheets      ← Splide, Leaflet, Tobii, injected at runtime (@layer libs)
```

Each layer is strictly additive — no package reaches into a lower layer.

---

## Folder structure

```text
assets/css/
│
├── tokens/
│   ├── design-system.css    ← entry point: @uncinq/design-tokens
│   │                            + @uncinq/component-tokens
│   │                            + hugolify component tokens
│   ├── component/           ← hugolify-specific component tokens
│   ├── theme.css            ← project-level token overrides (@layer config)
│   └── site.css             ← site-specific token overrides (@layer config)
│
├── layouts/                 ← hugolify layout overrides (@layer layouts)
│   ├── footer.css
│   ├── grid.css
│   ├── header.css
│   └── main.css
│
├── components/              ← hugolify-specific components (@layer components)
│   ├── blocks/
│   └── sections/
│
├── vendors/                 ← our overrides OF third-party CSS (@layer vendors)
│   ├── leaflet.css          ←   the libraries themselves land in @layer libs
│   └── splide.css
│
├── utilities/               ← single-purpose classes (@layer utilities)
│   ├── display.css
│   └── scrollsnap.css
│
├── utilities.css            ← imports every utilities/ file
├── mediaqueries.css         ← @custom-media definitions
└── main.css                 ← entry point — @layer + all imports
```

---

## Alphabetical property order

All CSS properties are written in **alphabetical order** within a declaration block.
This removes all debate about ordering, makes diffs cleaner, and speeds up scanning.

```css
/* ✅ Correct */
.button {
  background-color: var(--btn-background);
  border: none;
  border-radius: var(--btn-border-radius);
  color: var(--btn-color);
  cursor: pointer;
  display: inline-flex;
  font-size: var(--btn-font-size);
  padding-block: var(--btn-padding-block);
  padding-inline: var(--btn-padding-inline);
  text-decoration: none;
}
```

> Custom properties inside `:root {}` blocks also follow alphabetical order.

---

## Cascade layers

Layers are declared **once** at the top of `main.css`, in order of precedence (lowest to highest).

```css
@layer reset, tokens, libs, vendors, base, layouts, components, pages, utilities;
```

| Layer | Contents |
| --- | --- |
| `reset` | The reset itself, from @uncinq/css-base |
| `tokens` | Design tokens — CSS custom properties |
| `libs` | Third-party stylesheets themselves (Splide, Leaflet, Tobii) |
| `vendors` | **Our overrides** of those libraries |
| `base` | Native HTML element styles |
| `layouts` | Layout structures (container, grid, row) |
| `components` | UI components |
| `pages` | Page-specific rules |
| `utilities` | Single-purpose classes — they win over a component's own rules |

### `libs` vs `vendors`

The libraries are loaded by their feature scripts, on first use, with
`@import url('/assets/css/splide.min.css') layer(libs)` — see
`js/features/carousel.js`, `js/features/map.js`, `js/components/gallery.js`.
They therefore arrive **after** everything main.css imported, so they cannot
share a layer with the CSS that dresses them: at equal specificity the file
that loaded last would win, and a minified library wins a lot of those ties.
Two layers settle it once and for all, and spare `vendors/*.css` an
`!important` on every rule.

Three things to keep in mind:

- a layer name that is never declared is appended **last**, stronger than
  `utilities` — so `libs` has to stay in the `@layer` line above, or injecting
  into it makes the problem worse than not layering at all
- CSS **outside** any layer beats every layer, so dropping `layer(…)` from
  those imports would set the libraries above everything
- `!important` reverses the layer order: an important declaration in `libs`
  still beats one in `vendors`

### `main.css` — entry point

```css
/* css/main.css */
@layer reset, tokens, libs, vendors, base, layouts, components, pages, utilities;

/* Un Cinq base — reset + elements + layouts */
@import '@uncinq/css-base';

/* Tokens */
@import 'tokens/design-system.css';
@import 'tokens/theme.css';
@import 'tokens/site.css';

/* Config */
@import 'mediaqueries.css';

/* Vendors — our overrides; the libraries land in @layer libs at runtime */
@import 'vendors/splide.css';

/* Layouts */
@import 'layouts/footer.css';
@import 'layouts/grid.css';
@import 'layouts/header.css';
@import 'layouts/main.css';

/* Components — generic */
@import '@uncinq/css-components';

/* Components — Hugolify-specific */
@import 'components/audio.css';
@import 'components/block.css';
/* … */
```

> **Important:** `@import '@uncinq/css-base'` must come **before** any `@import` that inlines CSS content. `postcss-import` resolves npm package imports only when they appear before inlined CSS in the same file.

### `design-system.css` — token entry point

```css
/* tokens/design-system.css */

/* 1. Design tokens — primitive + semantic */
@import '@uncinq/design-tokens';

/* 2. Component tokens — generic */
@import '@uncinq/component-tokens';

/* 3. Component tokens — Hugolify-specific */
@import 'component/audio.css';
@import 'component/block.css';
@import 'component/footer.css';
@import 'component/header.css';
@import 'component/main-menu.css';
/* … */
```

The project then overrides tokens in `tokens/theme.css` (brand, typography…) and `tokens/site.css` (site-specific values), both in `@layer config`.

---

## Packages

| Package | Description | Docs |
| --- | --- | --- |
| [`@uncinq/design-tokens`](https://github.com/uncinq/design-tokens) | Primitive + semantic CSS custom properties — token architecture, naming convention, OKLCH colors, fluid scales, Style Dictionary | [README](https://github.com/uncinq/design-tokens#readme) · [DTCG](https://github.com/uncinq/design-tokens/blob/main/docs/DTCG.md) |
| [`@uncinq/component-tokens`](https://github.com/uncinq/component-tokens) | Component-scoped CSS custom properties — naming convention, per-component token list | [README](https://github.com/uncinq/component-tokens#readme) |
| [`@uncinq/css-base`](https://github.com/uncinq/css-base) | Reset, native element styles, layout primitives | [README](https://github.com/uncinq/css-base#readme) |
| [`@uncinq/css-components`](https://github.com/uncinq/css-components) | Generic UI components (btn, card, form…) | [README](https://github.com/uncinq/css-components#readme) |
