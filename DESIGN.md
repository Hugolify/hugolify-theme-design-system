# Design System — hugolify-theme-design-system

> Token-based CSS design system for Hugolify projects.
> All visual decisions are expressed as CSS custom properties — override any token in your project without touching this package.

---

## Visual Theme & Atmosphere

**Philosophy** — Minimal, accessible, performance-first. No decorative complexity. Every visual element serves a function.

**Character** — Clean editorial. Generous whitespace. Strong typographic hierarchy. Color is used sparingly and purposefully: brand on calls-to-action, status colors on feedback, neutrals everywhere else.

**Mood** — Professional without being corporate. Modern without chasing trends. Readable on any device, legible for any user.

---

## Color Palette & Roles

Colors are defined in two layers: **primitive** (raw OKLCH values, `@uncinq/design-tokens`) and **semantic** (purposeful aliases, consumed by components).

**Never use primitive tokens directly in components.** Always go through semantic tokens.

### Brand

| Token | Default | Use |
|-------|---------|-----|
| `--color-brand` | sienna-600 `oklch(0.530 0.195 22°)` | Primary CTA backgrounds, active states, links |
| `--color-brand-muted` | sienna-100 | Tinted section backgrounds |
| `--color-brand-hover` | sienna-700 | Hover state on brand elements |
| `--color-brand-strong` | sienna-900 | Emphasis, darkest brand shade |
| `--color-text-on-brand` | white | Text on brand-colored backgrounds |

**Override the brand in your project:**
```css
@layer tokens {
  :root {
    --color-brand:        var(--color-violet-600);
    --color-brand-muted:  var(--color-violet-100);
    --color-brand-hover:  var(--color-violet-700);
    --color-brand-strong: var(--color-violet-900);
  }
}
```

### Backgrounds & surfaces

| Token | Default | Use |
|-------|---------|-----|
| `--color-background` | white | Page background |
| `--color-background-muted` | gray-100 | Section backgrounds, sidebars |
| `--color-background-surface` | = `--color-background` | Cards, panels |
| `--color-background-media` | gray-200 | Image placeholders, skeleton |

### Text

| Token | Default | Use |
|-------|---------|-----|
| `--color-text` | gray-900 | Body copy |
| `--color-text-muted` | gray-500 | Captions, metadata, secondary |
| `--color-text-disabled` | gray-300 | Disabled states |
| `--color-heading` | black | All headings |
| `--color-link` | = `--color-text` | Inline links (default: unstyled) |
| `--color-link-hover` | = `--color-accent` | Link hover |

### Status colors (WCAG AA compliant)

| Token | Primitive | Pair with |
|-------|-----------|-----------|
| `--color-danger` | red-600 | `--color-text-on-danger` (white) |
| `--color-success` | green-600 | `--color-text-on-success` (white) |
| `--color-info` | blue-600 | `--color-text-on-info` (white) |
| `--color-warning` | amber-500 | `--color-text-on-warning` (gray-900) ⚠ dark text required |

Each variant has `-muted` (light bg) and `-strong` (hover/emphasis) companions.

---

## Typography Rules

### Font families

| Token | Default | Use |
|-------|---------|-----|
| `--font-family-sans` | system-ui, sans-serif | Body text, UI |
| `--font-family-heading` | = `--font-family-sans` | Headings (override to differentiate) |
| `--font-family-mono` | ui-monospace, monospace | Code blocks |

### Type scale

**Fluid sizes** (Utopia `clamp()`, viewport-responsive) — use these by default:

| Token | Range | Use |
|-------|-------|-----|
| `--font-size-fluid-2xs` | 10 → 12px | Footnotes, legal |
| `--font-size-fluid-xs` | 12 → 14px | Labels, badges |
| `--font-size-fluid-sm` | 14 → 16px | Captions, secondary text |
| `--font-size-fluid-md` | 16 → 18px | Body copy (base) |
| `--font-size-fluid-lg` | 18 → 24px | Lead paragraphs |
| `--font-size-fluid-xl` | 24 → 48px | Display titles |
| `--font-size-fluid-2xl` | 48 → 64px | Hero headings |
| `--font-size-fluid-display` | 64 → 96px | Oversized display |

**Semantic aliases** (reference fluid tokens — prefer these in components):

| Token | Resolves to | Use |
|-------|-------------|-----|
| `--font-size-text` | `--font-size-fluid-md` | Body copy |
| `--font-size-small` | `--font-size-fluid-sm` | Secondary text |
| `--font-size-heading-01` | `--font-size-fluid-xl` | `<h1>` |
| `--font-size-heading-02` | `--font-size-fluid-lg` | `<h2>` |
| `--font-size-heading-03` to `06` | `--font-size-fluid-md` / `sm` | `<h3>` to `<h6>` |

**Fixed sizes** (`--font-size-2xs` → `--font-size-display`) — static rem values, use only when fluid scaling must be avoided (e.g. UI controls with fixed height).

### Rules

- Line length capped at `--max-width-paragraph` (≈ 65ch) for body text
- `--line-height-base` for body, `--line-height-tight` for headings
- Avoid more than 3 font sizes on a single screen — use weight and color to create hierarchy instead

---

## Component Stylings

Components use **scoped CSS custom properties** — each component exposes its own token API that falls back to semantic tokens.

### Buttons

```html
<a class="btn btn-primary">Primary</a>
<a class="btn btn-secondary">Secondary</a>
<a class="btn btn-ghost">Ghost</a>
<a class="btn btn-link">Link</a>
<a class="btn btn-danger">Danger</a>
```

**Variants:** `btn-primary`, `btn-secondary`, `btn-ghost`, `btn-link`, `btn-dark`, `btn-light`, `btn-danger`, `btn-success`, `btn-warning`, `btn-info`

**Sizes:** `btn-xs`, `btn-sm`, `btn-md`, `btn-lg`, `btn-xl`

**Icon buttons:** `btn-close` (× icon), `btn-menu` (hamburger), `btn-search` (magnifier) — use `--icon-close`, `--icon-menu`, `--icon-search` mask tokens.

**Token overrides:**

```css
/* Project-level button customisation */
@layer tokens {
  :root {
    --btn-border-radius: var(--radius-pill);  /* pill buttons */
    --btn-font-weight: var(--font-weight-bold);
  }
}
```

### Navigation

```html
<nav class="nav">
  <ul>
    <li><a href="/">Home</a></li>
  </ul>
</nav>
```

`--nav-direction`: `column` (default, vertical) or `row` (horizontal).

### Dialog (modal panel)

Two CSS variants — `.modal` (centred) and `.drawer` (edge) — share one skeleton
(`panel.css`) and one driver (`components/dialog.js`). The tag picks the
strategy, not the class.

```html
<!-- Always an overlay → native <dialog>: the browser owns Escape, the focus
     trap, inertness and the backdrop. -->
<dialog class="drawer drawer-end" id="mainSearch" aria-labelledby="searchLabel">…</dialog>

<!-- Becomes a region of the page above a breakpoint → not a <dialog>, since
     one is exposed as role="dialog" even when only styled as a sidebar.
     popover="auto" gives the same top layer and ::backdrop without the role;
     dialog.js sets the dialog ARIA solely while the panel is open. -->
<div class="drawer panel-inline" id="toc" popover="auto" aria-labelledby="tocLabel">…</div>

<button class="btn-toc js-dialog-toggle" data-target="#toc">Table of contents</button>
```

Close with `.js-dialog-close` inside the panel, Escape, or a click outside.
JS events: `dialog:shown`, `dialog:hidden`.

### Cards, blocks, sections

Components follow Hugo partial naming: `block`, `item`, `hero`, `cta`, `gallery`, `quote`, `pricing`…

Each has a corresponding token file in `assets/css/tokens/component/` — override layout, spacing, and colors there.

---

## Layout Principles

### Spacing scale

T-shirt scale backed by `--size-*` primitives:

| Token | Value | Use |
|-------|-------|-----|
| `--spacing-2xs` | 0.25rem | Tight micro-spacing |
| `--spacing-xs` | 0.5rem | Compact elements |
| `--spacing-sm` | 0.75rem | Small gaps |
| `--spacing-md` | 1rem | Default element spacing |
| `--spacing-lg` | 1.5rem | Section inner padding |
| `--spacing-xl` | 2rem | Between components |
| `--spacing-2xl` | 3rem | Section vertical rhythm |
| `--spacing-section` | fluid clamp | Page-level vertical rhythm |

### Grid

12-column grid by default. Column classes: `col-xsmall` (3 cols), `col-small` (4), `col-medium` (6), `col-large` (8).

Tokens: `--grid-columns`, `--grid-gap`, `--grid-max-width`.

### Principles

- Every block has symmetric vertical padding via `--spacing-section`
- Horizontal max-width controlled by `--grid-max-width` (default 1280px) with auto margins
- No pixel values in components — always reference spacing tokens

---

## Depth & Elevation

| Token | Use |
|-------|-----|
| `--shadow-sm` | Cards, inputs at rest |
| `--shadow-md` | Dropdowns, popovers |
| `--shadow-lg` | Modals, drawers |
| `--shadow-center-sm` | Centered glow effects |

**Surface hierarchy:** `--color-background` (page) → `--color-background-surface` (cards) → `--color-background-muted` (nested panels). Elevation is expressed through shadow, not background color changes.

**Backdrop:** `--color-backdrop` (semi-transparent black) behind drawers and modals.

---

## Do's and Don'ts

### Do

- ✓ Reference semantic tokens (`--color-brand`, `--spacing-md`) in all component and project CSS
- ✓ Override tokens in `@layer tokens` to rebrand — never edit package files
- ✓ Use `--color-text-on-*` tokens for text on colored backgrounds
- ✓ Use `btn-warning` with `--color-text-on-warning` (dark text — amber is bright)
- ✓ Use Hugo partials for all page structure — don't write raw HTML for standard blocks

### Don't

- ✗ Use primitive tokens (`--color-sienna-600`) directly in component or project CSS
- ✗ Hardcode hex or OKLCH values — if a color has no token, create one
- ✗ Mix `hugolify-theme-bootstrap` and `hugolify-theme-design-system` in the same project
- ✗ Override component styles with high-specificity selectors — use the token API instead
- ✗ Use `!important` — if specificity is a problem, check the `@layer` order

---

## Responsive Behavior

### Breakpoints

| Token | Value | Name |
|-------|-------|------|
| `--size-mobile` | 375px | Small phone |
| `--size-tablet` | 768px | Tablet / large phone landscape |
| `--size-desktop` | 1024px | Laptop |
| `--size-wide` | 1280px | Wide desktop |

Media queries are mobile-first (`min-width`). No utility class breakpoints — use semantic layout tokens instead.

### Touch targets

- Minimum 44×44px for interactive elements (WCAG 2.5.5)
- `--spacing-control` ensures inputs and buttons meet this threshold

### Typography

- Fluid type via `--fluid-text-*` tokens (Utopia clamp) — no manual breakpoints for font sizes
- `--max-width-paragraph` caps line length on wide viewports

---

## Agent Prompt Guide

### Token reference (use these names, not raw values)

```
Colors:    --color-brand, --color-background, --color-text, --color-border
Spacing:   --spacing-xs → --spacing-2xl, --spacing-section
Radius:    --radius-sm, --radius-md, --radius-lg, --radius-pill
Shadow:    --shadow-sm, --shadow-md, --shadow-lg
Type:      --font-size-sm → --font-size-xl, --font-size-heading-01 → 06
```

### Generating a Hugo partial

> "Create a Hugo partial for a pricing card. Use `--color-background-surface`, `--shadow-sm`, `--radius-md`, `--spacing-lg`. The CTA should use `class="btn btn-primary"`. Accept `title`, `price`, `features` (list), and `cta` (object with `label` and `url`) as front matter params."

### Overriding the brand

> "Override the brand color to violet in the project's `@layer tokens` block. Use `--color-violet-600` for brand, `--color-violet-100` for muted, `--color-violet-700` for hover, `--color-violet-900` for strong."

### Adding a custom component token

> "Add a `--hero-background` token scoped to `.hero` that defaults to `--color-background-muted`. Override it to `--color-brand-muted` for the homepage hero."

### Responsive section

> "Create a two-column grid section. Single column on mobile, two columns from `--size-tablet`. Use `--grid-gap` for the gutter and `--spacing-section` for vertical padding."
