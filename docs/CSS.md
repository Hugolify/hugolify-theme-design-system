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
@uncinq/design-tokens        ← primitive + semantic CSS custom properties  (@layer config)
@uncinq/component-tokens     ← component-scoped CSS custom properties      (@layer config)
@uncinq/css-base             ← reset, native element styles, layouts       (@layer base, layouts)
@uncinq/css-components       ← generic UI components                       (@layer components)
hugolify-theme-design-system ← hugolify-specific tokens + components       (all layers)
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
  background-color: var(--btn-bg);
  border: none;
  border-radius: var(--btn-border-radius);
  color: var(--btn-color);
  cursor: pointer;
  display: inline-flex;
  font-size: var(--btn-font-size);
  padding-block: var(--btn-padding-y);
  padding-inline: var(--btn-padding-x);
  text-decoration: none;
}
```

> Custom properties inside `:root {}` blocks also follow alphabetical order.

---

## Cascade layers

Layers are declared **once** at the top of `main.css`, in order of precedence (lowest to highest).

```css
@layer config, base, layouts, vendors, components;
```

| Layer | Contents |
| --- | --- |
| `config` | Design tokens — CSS custom properties, `@custom-media` |
| `base` | Reset, native HTML element styles |
| `layouts` | Layout structures (container, grid, row) |
| `vendors` | Third-party libraries (Splide…) |
| `components` | UI components |

### `main.css` — entry point

```css
/* css/main.css */
@layer config, base, layouts, vendors, components;

/* Un Cinq base — reset + elements + layouts */
@import '@uncinq/css-base';

/* Tokens */
@import 'tokens/design-system.css';
@import 'tokens/theme.css';
@import 'tokens/site.css';

/* Config */
@import 'mediaqueries.css';

/* Vendors */
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
