# hugolify-theme-design-system

Design System styling layer for [hugolify-theme](https://github.com/hugolify/hugolify-theme).

This module provides the CSS (Design Tokens + CSS) and Vanilla JavaScript for hugolify-theme.

## Requirements

- [Hugo extended](https://gohugo.io/installation/) >= 0.141.0
- [hugolify-theme](https://github.com/hugolify/hugolify-theme)

## Install

Edit `config/_default/module.yaml`:

```yaml
imports:
  - path: github.com/hugolify/hugolify-theme/v2
  - path: github.com/hugolify/hugolify-theme-design-system
```

## Customization

Override variables in `assets/css/tokens/site.css`:

```css
:root {
  --color-primary: #000;
}
```

## Structure

```
assets/
├── sass/
│   ├── main-theme.sass
│   ├── abstracts/        # Variables, mixins, functions
│   ├── base/             # Element styles
│   ├── layout/           # Header, footer, grid, sidebar
│   ├── components/       # UI components
│   ├── pages/            # Page-specific styles
│   └── vendors/          # Bootstrap, Splide, Leaflet…
└── js/
    ├── components/       # Menu, TOC, video…
    ├── features/         # Animation, carousel, map…
    └── blocks/           # Block-specific scripts
```

## Vendors

**Import in javascript core pipe:**

- Cookie consent
- Rellax

**Import in javascript features pipe:**

- Leaflet
- Splide
- Tobii

## Documentation

https://www.hugolify.io/docs/

## Licensing

Hugolify is free for personal or commercial projects (MIT license)
