# DTCG — Design Token Community Group

The [W3C Design Token Community Group (DTCG)](https://www.w3.org/community/design-tokens/) defines a standard interchange format for design tokens, so they can travel between tools (Figma, code, documentation) without loss of meaning.

`hugolify-theme-design-system` uses DTCG JSON as its token source format, stored in `assets/tokens/`. [Style Dictionary v5](https://styledictionary.com/) transforms those JSON files into CSS custom properties — see [STYLE-DICTIONARY.md](STYLE-DICTIONARY.md) for the build pipeline. Tokens inherit from `@uncinq/design-tokens` and `@uncinq/component-tokens` upstream.

---

## The DTCG format

The [DTCG spec](https://tr.designtokens.org/format/) defines tokens as JSON objects with reserved `$`-prefixed keys:

```json
{
  "color": {
    "brand": {
      "$value": "oklch(0.530 0.195 22.0)",
      "$type": "color",
      "$description": "Primary brand color — used for CTAs and highlights."
    }
  }
}
```

| Key | Required | Description |
| --- | --- | --- |
| `$value` | ✅ | The token's value |
| `$type` | recommended | The token type (see below) |
| `$description` | optional | Human-readable documentation |
| `$extensions` | optional | Vendor-specific metadata (e.g. Figma, Tokens Studio) |

---

## DTCG token types

### Scalar types

| Type | Example value | CSS usage |
| --- | --- | --- |
| `color` | `oklch(0.530 0.195 22.0)` | `color`, `background-color` |
| `dimension` | `1rem`, `4px` | `width`, `padding`, `font-size` |
| `fontFamily` | `"system-ui, sans-serif"` | `font-family` |
| `fontWeight` | `700` | `font-weight` |
| `duration` | `300ms` | `transition-duration` |
| `cubicBezier` | `[0.165, 0.84, 0.44, 1]` | `animation-timing-function` |
| `number` | `1.5` | `line-height`, `opacity` |
| `string` | `"uppercase"` | free-form text values |
| `strokeStyle` | `"solid"`, `"dashed"` | `border-style` |

### Composite types

| Type | Shape | CSS usage |
| --- | --- | --- |
| `shadow` | `{offsetX, offsetY, blur, spread, color}` | `box-shadow` |
| `border` | `{width, style, color}` | `border` shorthand |
| `transition` | `{duration, delay, timingFunction}` | `transition` shorthand |
| `typography` | `{fontFamily, fontSize, fontWeight, letterSpacing, lineHeight}` | typography rules |
| `gradient` | `{gradientType, stops[]}` | `background: linear-gradient(…)` |

→ Full type list: [tr.designtokens.org/format/#types](https://tr.designtokens.org/format/#types)

> **Note on `clamp()` values:** DTCG has no native `fluid` type. Fluid tokens use `$type: "dimension"` as the closest match — a documented gap in the spec.

---

## Naming conventions

### CSS compound properties → camelCase

CSS property names that are two words (kebab-case in CSS) are written as a single **camelCase key** — not as a nested group. The `pathToKebab` transform converts them back to kebab-case for the CSS output, so the result is identical either way.

| JSON key | CSS custom property |
| --- | --- |
| `"fontFamily"` | `--btn-font-family` |
| `"fontSize"` | `--btn-font-size` |
| `"fontStyle"` | `--btn-font-style` |
| `"fontWeight"` | `--btn-font-weight` |
| `"lineHeight"` | `--btn-line-height` |
| `"maxHeight"` | `--btn-max-height` |
| `"maxWidth"` | `--btn-max-width` |
| `"textDecoration"` | `--btn-text-decoration` |
| `"textTransform"` | `--btn-text-transform` |

```json
// ✅ correct
"btn": {
  "fontSize": { "$value": "{fontSize.sm}", "$type": "dimension" },
  "fontWeight": { "$value": "{fontWeight.bold}", "$type": "fontWeight" }
}

// ❌ wrong
"btn": {
  "font": {
    "size": { "$value": "{fontSize.sm}", "$type": "dimension" },
    "weight": { "$value": "{fontWeight.bold}", "$type": "fontWeight" }
  }
}
```

**Exception — semantic namespaces:** `border`, `color`, `padding`, `margin`, `shadow` used to group multiple sub-properties stay nested, because the group key itself is not a CSS property compound word.

```json
// ✅ border as a namespace grouping multiple properties
"border": {
  "radius": { "$value": "{radius.control}", "$type": "dimension" },
  "width":  { "$value": "{border.width.sm}", "$type": "dimension" }
}

// ✅ color as a semantic grouping
"color": {
  "background": { "$value": "{color.background.default}", "$type": "color" },
  "text":       { "$value": "{color.text.default}", "$type": "color" }
}
```

### Logical properties → sub-keys of `padding` / `margin`

Sub-axes of `padding` and `margin` use **CSS logical property names** as sub-keys — not physical directions (`x`, `y`, `top`, `bottom`, `left`, `right`).

| Sub-key | CSS logical property | Physical equivalent |
| --- | --- | --- |
| `"inline"` | `padding-inline` / `margin-inline` | left + right |
| `"block"` | `padding-block` / `margin-block` | top + bottom |
| `"inlineStart"` | `padding-inline-start` / `margin-inline-start` | left (LTR) |
| `"inlineEnd"` | `padding-inline-end` / `margin-inline-end` | right (LTR) |
| `"blockStart"` | `padding-block-start` / `margin-block-start` | top |
| `"blockEnd"` | `padding-block-end` / `margin-block-end` | bottom |

```json
// ✅ correct
"padding": {
  "inline": { "$value": "{spacing.sm}", "$type": "dimension" },
  "block":  { "$value": "{spacing.xs}", "$type": "dimension" }
}

// ❌ wrong
"padding": {
  "x": { "$value": "{spacing.sm}", "$type": "dimension" },
  "y": { "$value": "{spacing.xs}", "$type": "dimension" }
}
```

**Exception — CSS `top`/`bottom`/`left`/`right` as positioning values** (not margin/padding sub-keys) keep their physical names, since they map to CSS position properties, not logical shorthands.

```json
// ✅ positioning — physical names are correct here
"sticky": {
  "top": { "$value": "4rem", "$type": "dimension" }
}
```

### States → nested sub-keys

Interactive states (`default`, `hover`, `active`, `disabled`…) are expressed as **nested keys** under the property they modify. The `default` key is automatically stripped by the build transform.

```json
"color": {
  "background": {
    "default": { "$value": "{color.brand.default}", "$type": "color" },
    "hover":   { "$value": "{color.brand.hover}",   "$type": "color" }
  }
}
```

```css
/* output */
--btn-color-background: var(--color-brand);
--btn-color-background-hover: var(--color-brand-hover);
```

States and camelCase properties compose naturally:

```json
"color": {
  "textDecoration": {
    "default": { "$value": "transparent", "$type": "color" },
    "hover":   { "$value": "{color.link.default}", "$type": "color" }
  }
}
```

```css
--btn-color-text-decoration: transparent;
--btn-color-text-decoration-hover: var(--color-link);
```

---


## References (aliases)

Tokens can reference other tokens using `{dotted.path}` syntax:

```json
{
  "color": {
    "link": {
      "default": {
        "$value": "{color.brand.default}",
        "$type": "color"
      }
    }
  }
}
```

In CSS, this maps to `var()`:

```css
--color-link: var(--color-brand);
```

This is the key mechanism behind the **primitive → semantic → component** hierarchy.

→ [tr.designtokens.org/format/#alias](https://tr.designtokens.org/format/#alias)

---

## References

- [DTCG specification](https://tr.designtokens.org/format/) — W3C Community Group draft
- [DTCG GitHub](https://github.com/design-tokens/community-group) — issues, discussion
- [Style Dictionary v5](https://styledictionary.com/) — token build pipeline, see [STYLE-DICTIONARY.md](STYLE-DICTIONARY.md)
- [Tokens Studio](https://tokens.studio/) — Figma plugin for DTCG workflows
