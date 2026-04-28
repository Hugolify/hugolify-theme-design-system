# CSS Architecture — Design Tokens & Vanilla CSS

> An opinionated guide for writing sane, maintainable and scalable vanilla CSS with design tokens.

---

## Table of contents

- [Philosophy](#philosophy)
- [Stack overview](#stack-overview)
- [Folder structure](#folder-structure)
- [Alphabetical property order](#alphabetical-property-order)
- [Cascade layers](#cascade-layers)
- [Tokens](#tokens)
  - [`design-system.css` — entry point](#design-systemcss--the-token-entry-point)
  - [Color palette generation](#color-palette-generation)
  - [The three token layers](#the-three-token-layers)
  - [Responsive tokens](#responsive-tokens)
  - [Naming conventions](#naming-conventions)
  - [False friends](#nomenclature--false-friends)
- [Style Dictionary — source vs. output](#style-dictionary--source-vs-output)

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
@uncinq/design-tokens      ← primitive + semantic CSS custom properties  (@layer config)
@uncinq/component-tokens   ← component-scoped CSS custom properties      (@layer config)
@uncinq/css-base           ← reset, native element styles, layouts       (@layer base, layouts)
@uncinq/css-components     ← generic UI components                       (@layer components)
hugolify-theme-design-system ← hugolify-specific tokens + components     (all layers)
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
│   ├── component/           ← hugolify-specific component tokens only
│   │   ├── audio.css
│   │   ├── block.css
│   │   ├── comparison.css
│   │   ├── footer.css
│   │   ├── gallery.css
│   │   ├── header.css
│   │   ├── images.css
│   │   ├── main-menu.css
│   │   ├── pagination-between.css
│   │   ├── press.css
│   │   ├── pricing.css
│   │   ├── quote.css
│   │   ├── screenshot.css
│   │   ├── sidebarmenu.css
│   │   ├── timeline.css
│   │   ├── toc.css
│   │   └── transcription.css
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
│   ├── audio.css
│   ├── block.css
│   ├── main-menu.css
│   └── … (blocks/, sections/)
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
  padding: var(--btn-padding-y) var(--btn-padding-x);
  text-decoration: none;
}

/* ❌ Avoid */
.button {
  display: inline-flex;
  padding: var(--btn-padding-y) var(--btn-padding-x);
  background-color: var(--btn-bg);
  color: var(--btn-color);
  border: none;
  border-radius: var(--btn-border-radius);
  font-size: var(--btn-font-size);
  text-decoration: none;
  cursor: pointer;
}
```

> Custom properties inside `:root {}` blocks also follow alphabetical order.

---

## Cascade Layers

Layers are declared **once** at the top of `main.css`, in order of precedence (lowest to highest).

```css
@layer config, base, layouts, vendors, components;
```

### Layer responsibilities

| Layer | Contents | Overrides |
| --- | --- | --- |
| `config` | Design tokens — CSS custom properties, `@custom-media` | Nothing |
| `base` | Reset, native HTML element styles | Nothing |
| `layouts` | Layout structures (container, grid, row) | `base` |
| `vendors` | Third-party libraries (Splide…) | `layouts` |
| `components` | UI components | `vendors` |

### `main.css` — actual entry point

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

/* Blocks */
@import 'components/blocks/block-cta.css';
/* … */

/* Sections */
@import 'sections/pages.css';
```

> **Important:** `@import '@uncinq/css-base'` must come **before** any `@import` that inlines CSS content. `postcss-import` resolves npm package imports only when they appear before inlined CSS in the same file.

---

## Tokens

### `design-system.css` — the token entry point

All token files are imported through a single `tokens/design-system.css` file, in layer order.

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

### Color palette generation

Color primitives (`--color-blue-500`, `--color-gray-900`…) need a coherent scale before becoming tokens. [Kigen](https://kigen.design/color) is a generator that produces an 11-step palette (50 → 950) from a single base color, following the Tailwind naming convention.

Key features useful for this DS:

- **Algorithm choice** — different generation methods (perceptual, linear…)
- **Contrast shift** — fine-tune luminosity spread across the scale
- **OKLCH export** — modern color space, perceptually uniform
- **CSS / Tokens export** — drops directly into `tokens/primitive/color.css`
- **Figma plugin** — keeps designer and developer scales in sync

Workflow: generate the palette in Kigen → export as CSS → paste into `tokens/primitive/color.css` → wire to semantic tokens in `tokens/semantic/color.css`.

---

### The three token layers

#### 1. `tokens/primitive/` — raw values

Named after their physical content, with no contextual meaning.

```css
/* tokens/primitive/color.css */
:root {
  --color-blue-100: #dbeafe;
  --color-blue-500: #3b82f6;
  --color-blue-900: #1e3a8a;
  --color-gray-100: #f3f4f6;
  --color-gray-500: #6b7280;
  --color-gray-900: #111827;
  --color-white: #ffffff;
}
```

```css
/* tokens/primitive/size.css */
:root {
  --size-8: 0.5rem;
  --size-16: 1rem;
  --size-32: 2rem;
  --size-64: 4rem;
}
```

#### 2. `tokens/semantic/` — purpose and meaning

Tokens that carry intent. They **always reference primitives**, never raw values.

```css
/* tokens/semantic/color.css */
:root {
  --color-bg: var(--color-white);
  --color-bg-muted: var(--color-gray-100);
  --color-brand: var(--color-blue-500);
  --color-text: var(--color-gray-900);
  --color-text-muted: var(--color-gray-500);
  --color-text-disabled: var(--color-gray-300);
}
```

> **Golden rule:** a semantic token always points to a primitive.
> A primitive never points to another token.

#### Token type classification

| Category | Primitive | Semantic | Reason |
| --- | --- | --- | --- |
| Color | `--color-blue-500` | `--color-brand`, `--color-text` | Palette → intent |
| Size | `--size-8`, `--size-16` | `--spacing-xs`, `--spacing-md` | Raw scale → T-shirt spacing |
| Font | `--font-family-sans`, `--font-weight-bold` | `--font-site-text`, `--font-weight-heading` | Catalog → role |
| Radius | — | `--radius-control`, `--radius-pill` | References `--size-*` directly — no primitive needed |
| Shadow | `--shadow-sm`, `--shadow-lg` | — | Composite value, cannot derive from `--size-*` |
| Border | — | `--border-width-normal` | Absolute px values, no primitive needed |
| Motion | — | `--duration-fast`, `--easing-default` | Absolute values, no primitive needed |
| Ratio | — | `--ratio-16-9` | Mathematical constants, no primitive needed |

**Why radius has no primitive:** with `--size-6` added to the size scale, all radius values map directly to `--size-*`. The semantic layer (`--radius-control`, `--radius-pill`, `--radius-surface`) references `--size-*` directly. `9999px` (pill) and `0` (none) are hardcoded as they have no size equivalent.

**Why shadow stays primitive:** box-shadow is a composite value with offsets, blur, spread, and color — it cannot be decomposed into `--size-*` tokens meaningfully.

#### 3. `tokens/component/` — component tokens

Scoped to a single component. Reference semantic tokens.

```css
/* tokens/component/button.css */
:root {
  --btn-border-radius: var(--radius-control);
  --btn-color-bg:      var(--color-brand);
  --btn-color-text:    var(--color-text-on-brand);
  --btn-font-size:     var(--font-size-sm);
  --btn-gap:           var(--spacing-sm);
  --btn-padding:       var(--spacing-control);
}
```

Generic component tokens are provided by `@uncinq/component-tokens`. Hugolify-specific ones live in `assets/css/tokens/component/`.

---

### Responsive tokens

When a token value changes at a breakpoint, the **responsive logic lives in the component CSS**, not in the token file. Token files hold only static named values.

```css
/* tokens/component/container.css — static values only */
--container-max-width-tablet:      45rem;   /* 720px  */
--container-max-width-tablet-wide: 60rem;   /* 960px  */
--container-max-width-laptop:      75rem;   /* 1200px */
--container-max-width-desktop:     82.5rem; /* 1320px */

/* components/container.css — breakpoint logic */
.container {
  @media (--tablet)      { max-width: var(--container-max-width-tablet); }
  @media (--tablet-wide) { max-width: var(--container-max-width-tablet-wide); }
  @media (--laptop)      { max-width: var(--container-max-width-laptop); }
  @media (--desktop)     { max-width: var(--container-max-width-desktop); }
}
```

Breakpoint names in tokens follow the viewport they activate — not a size scale — to avoid ambiguity (`tablet` = active from tablet up, not the tablet size itself).

### Fluid tokens

Heading and spacing tokens use **CSS `clamp()`** for fluid scaling — no media queries needed. The value scales continuously between a minimum (mobile) and a maximum (desktop) based on viewport width. These are defined in `@uncinq/design-tokens/tokens/semantic/fluid.css`:

```css
/* Fluid text scale */
--fluid-text-sm:  clamp(1.125rem, 1rem + 0.5556vw, 1.5rem);   /* 18 → 24px */
--fluid-text-md:  clamp(1.5rem, 1.25rem + 1.1111vw, 2.25rem);  /* 24 → 36px */
--fluid-text-lg:  clamp(2.25rem, 2rem + 1.1111vw, 3rem);       /* 36 → 48px */

/* Fluid spacing scale */
--fluid-spacing-sm: clamp(1.25rem, 0.8333rem + 1.8519vw, 2.5rem);   /* 20 → 40px */
--fluid-spacing-md: clamp(1.875rem, 1.25rem + 2.7778vw, 3.75rem);   /* 30 → 60px */
--fluid-spacing-lg: clamp(2.5rem, 1.6667rem + 3.7037vw, 5rem);      /* 40 → 80px */
```

Viewport range: 360px → 1440px.

### Naming conventions

#### Folders and files

- `kebab-case` for everything
- Plural for folders (`components/`, `tokens/`)
- Singular for files (`button.css`, `color.css`)
- No underscores

#### Custom properties

Pattern: `--[component]-[element]-[property]-[state]`

```text
--btn-color-bg              → background color of btn (default state)
--btn-color-bg-hover        → background color of btn on hover
--btn-color-border          → border color of btn
--btn-color-text            → text color of btn
--btn-color-text-decoration → text-decoration color of btn
--comparison-item-color-bg-on-block-bg  → bg of item when placed inside a block-bg section
--hero-color-title        → color of the hero title
--item-border-radius      → border-radius of item
--font-size-lg            → semantic size token (no component prefix)
--spacing-surface         → semantic spacing role token (no component prefix)
```

**Segment rules:**

| Segment | Values | Notes |
| --- | --- | --- |
| `component` | `btn`, `item`, `hero`, `comparison`… | Always first |
| `element` | `color`, `border`, `font-size`, `padding`… | CSS property category |
| `property` | `bg`, `text`, `border`, `radius`, `width`… | What it styles |
| `state` | `hover`, `focus`, `active`, `disabled` | Interaction state only — optional |

**Color tokens always use `color-*`:**

All color values — background, text, border — live under the `color-*` family. `border` appears in two places: as an element (`border-width`, `border-style`, `border-radius`) and as a property under `color-*` (`color-border`).

| CSS property | Token property |
| --- | --- |
| `background-color` | `color-bg` |
| `color` (text) | `color-text` |
| `border-color` | `color-border` |

This follows the same convention as Shopify Polaris — one `color-*` family for all color tokens, `border-*` reserved for structural border properties only.

A placement context (inside a block, on a colored section) is **not a state** — use a descriptive suffix such as `on-block-bg` instead.

---

#### Nomenclature — false friends

Terms borrowed from other design systems that have different meanings here, or that are outright forbidden.

#### ❌ `surface` / `on-surface` as a color pair

**Origin:** Material Design 3 (`--md-sys-color-surface`, `--md-sys-color-on-surface`).
**Problem:** `surface` is not a CSS property. It conflates two distinct concepts — `background-color` and `color` — into an abstract metaphor that is not self-explanatory.

```css
/* ❌ avoid */
--btn-surface: var(--color-brand);
--btn-on-surface: var(--color-text-on-brand);

/* ✅ correct */
--btn-color-bg: var(--color-brand);
--btn-color-text: var(--color-text-on-brand);
```

`--radius-surface` and `--spacing-surface` are **fine** — `surface` here names a semantic role (the rounded/padded surface of a card or panel), not a color pair.

#### ❌ `on-surface` as a placement context modifier

**Origin:** Material Design / Tailwind (`text-on-surface`).
**Problem:** `on-surface` is not a DTCG interaction state (`hover`, `active`, `focus`, `disabled`). Using it as a token suffix creates confusion about what triggers the value change.

```css
/* ❌ avoid — "on-surface" looks like a state */
--comparison-item-color-bg-on-surface: var(--color-bg);

/* ✅ correct — explicit placement context */
--comparison-item-color-bg-on-block-bg: var(--color-bg);
```

#### ❌ `border-color` as a token suffix

**Origin:** CSS property name (`border-color`).
**Problem:** Puts border color in the `border-*` family, separate from `color-bg` and `color-text`. All color tokens should live under `color-*` for consistency and to make theming predictable.

```css
/* ❌ avoid */
--btn-border-color: var(--color-brand);

/* ✅ correct — all colors under color-* */
--btn-color-border: var(--color-brand);
```

`border-width`, `border-style`, `border-radius` remain in the `border-*` family — they are structural, not color values.

#### ❌ `&-modifier` nesting in native CSS

**Origin:** Sass/SCSS `&` string concatenation.
**Problem:** Native CSS nesting does **not** support `&` concatenation. `&-rtl` is only valid in Sass.

```css
/* ❌ does not work in native CSS */
.block-editorial {
  &-rtl { … }
}

/* ✅ flat rule in the same @layer block */
@layer components {
  .block-editorial { … }
  .block-editorial-rtl { … }
}
```

#### ❌ `@media` inside token files

Token files (`tokens/primitive/`, `tokens/semantic/`, `tokens/component/`) contain **static named values only**. Responsive logic belongs in component CSS files.

```css
/* ❌ avoid in tokens/component/container.css */
:root {
  @media (--tablet) { --container-max-width: 45rem; }
}

/* ✅ in components/container.css */
.container {
  @media (--tablet) { max-width: var(--container-max-width-tablet); }
}
```

---

## Style Dictionary — source vs. output

[Style Dictionary](https://styledictionary.com) is an optional build tool that transforms tokens defined in JSON into CSS files (or other formats: JS, iOS, Android…).

### How it works

The JSON token files can be **written by hand or exported from Figma** (via plugins or the native Figma Variables export). Style Dictionary reads those JSON files and generates the CSS output for each target platform.

```text
tokens/                    ← JSON source files — hand-written or exported from Figma
├── primitive/
│   ├── color.json
│   └── spacing.json
└── semantic/
    └── color.json
         ↓
    Style Dictionary
         ↓
assets/css/tokens/         ← generated CSS output — never edit manually
├── primitive/
│   └── color.css
└── semantic/
    └── color.css
```

> Style Dictionary generates **one or more CSS files** depending on the `config.json` setup.
> You can output a single `tokens.css`, one file per layer, or one per platform.
> Files in `assets/css/tokens/` are **never edited by hand** when using Style Dictionary — regenerate instead.

### Figma → JSON → CSS workflow

```text
Figma Variables / Tokens Studio
        ↓  export .json
tokens/ (source, versioned in git)
        ↓  style-dictionary build
assets/css/tokens/ (output, imported by design-system.css)
```

This setup makes Figma the single source of truth for all design decisions.
Any change made in Figma flows automatically into CSS after running the build.

### Example config

```json
{
  "source": ["tokens/**/*.json"],
  "platforms": {
    "css": {
      "transformGroup": "css",
      "buildPath": "assets/css/tokens/",
      "files": [
        {
          "destination": "primitive/color.css",
          "format": "css/variables",
          "filter": { "attributes": { "category": "primitive" } }
        },
        {
          "destination": "semantic/color.css",
          "format": "css/variables",
          "filter": { "attributes": { "category": "semantic" } }
        }
      ]
    }
  }
}
```

### Without Style Dictionary

If the project has no build step and no Figma token export,
tokens are written directly as CSS files in `assets/css/tokens/primitive/` and `assets/css/tokens/semantic/`.
The architecture stays identical — Style Dictionary is **not required** to apply this structure.
