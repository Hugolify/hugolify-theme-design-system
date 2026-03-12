# hugolify-theme-design-system

Design System styling layer for [hugolify-theme](https://github.com/hugolify/hugolify-theme).

This module provides the CSS (Design System + SASS) and JavaScript for hugolify-theme.

## Requirements

- [Hugo extended](https://gohugo.io/installation/) >= 0.141.0
- [hugolify-theme](https://github.com/hugolify/hugolify-theme)

## Installation

Change style module in `config/_default/module.yaml`:

```yaml
replacements: >
  github.com/hugolify/hugolify-theme-bootstrap ->
  github.com/hugolify/hugolify-theme-design-system
```

## Customization

Override variables in `assets/sass/abstracts/_variables-site.sass`:

```sass

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

## Documentation

https://www.hugolify.io/docs/

## Licensing

Hugolify is free for personal or commercial projects (MIT license)
