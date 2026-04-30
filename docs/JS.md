# JS Architecture — Vanilla JavaScript

> An opinionated guide for writing sane, maintainable and scalable vanilla JavaScript without a framework.

---

## Table of contents

- [Philosophy](#philosophy)
- [Folder structure](#folder-structure)
- [Entry point — `main.js`](#entry-point--mainjs)
- [Layers](#layers)
  - [utils/](#utils)
  - [components/](#components)
  - [features/](#features)
  - [blocks/](#blocks)
  - [vendors/](#vendors)
  - [datas/](#datas)
- [Component pattern](#component-pattern)
- [Custom events](#custom-events)
- [A11y](#a11y)
- [Extension points](#extension-points)

---

## Philosophy

- **No framework** — vanilla JS only, no React, Vue, or Alpine
- **Progressive enhancement** — JS adds behaviour, never replaces structure
- **One responsibility per file** — each file does one thing
- **Class for stateful components, function for utilities**
- **Accessibility first** — keyboard, focus, `inert`, ARIA managed explicitly

---

## Folder structure

```
assets/js/
│
├── utils/               # Pure functions, no DOM side-effects at module level
│   ├── a11y.js          # Focus management: lockBackground(), focusFirst()
│   ├── global.js        # Body preload class removal on load
│   └── scrollspy.js     # IntersectionObserver one-shot callback
│
├── components/          # Always-on UI: initialised on every page
│   ├── index.js         # Barrel — imports all active components
│   ├── custom.js        # Extension point for project-specific components
│   ├── drawer.js
│   ├── dropdown.js
│   ├── form.js
│   ├── gallery.js
│   ├── gauge.js
│   ├── menu.js
│   ├── modal.js
│   ├── tooltip.js
│   └── video.js
│
├── features/            # Optional — enabled per-site via Hugo params
│   ├── custom.js        # Extension point for project-specific features
│   ├── animation.js     # data-anim scroll reveal (requires params.animation)
│   ├── carousel.js      # (requires params.carousel)
│   ├── map.js           # (requires params.map)
│   ├── parallax.js      # (requires params.parallax.enable)
│   ├── search.js        # (requires params.search.enable)
│   ├── vimeo.js         # (requires params.vimeo)
│   └── youtube.js       # (requires params.youtube)
│
├── blocks/              # Block-specific JS — loaded conditionally
│   ├── index.js         # Fallback: imports all blocks (no hugolify-admin)
│   ├── audio.js
│   ├── chart.js
│   ├── datas.js
│   ├── form.js
│   ├── gallery.js
│   └── instagram.js
│
├── vendors/             # Third-party integrations
│   └── custom.js        # Extension point — import npm packages here
│
├── datas/               # Static JS data files
│   └── map-tiles.js     # Map tile provider configuration
│
└── main.js              # Hugo-templated entry point
```

---

## Entry point — `main.js`

`main.js` is a **Hugo template** (`.js` with template syntax). Hugo evaluates it server-side and outputs a standard JS module. This is the only file that contains Hugo logic.

```js
// main.js (simplified)

import './utils/global';
import './vendors/custom';

// Features — conditionally included by Hugo based on site params
{{ if $params.animation }}  import './features/animation'; {{ end }}
{{ if $params.carousel }}   import './features/carousel';  {{ end }}
{{ if $params.map }}        import './features/map';       {{ end }}

import './features/custom';

// Blocks — selective loading via hugolify-admin, or full fallback
{{ with $params.admin.blocks.enable }}
  {{ range . }}
    {{ if fileExists (print "assets/js/blocks/" . ".js") }}
      import './blocks/{{ . }}.js';
    {{ end }}
  {{ end }}
{{ else }}
  import './blocks/index.js';
{{ end }}

import './components/index';
import './components/custom';
```

**Load order:**

1. `utils/global` — runs immediately (removes `.preload` class)
2. `vendors/custom` — third-party libs before anything else
3. Features — optional, Hugo-gated
4. Blocks — selective or full
5. Components — always last (depend on DOM being ready via event listeners)

---

## Layers

### `utils/`

Pure functions with no side-effects at module load time. Always `export`ed, never auto-executed.

```js
// utils/scrollspy.js
export const scrollspy = (element, fn) => {
  const observer = new IntersectionObserver((entries) => {
    if (entries.some(({ isIntersecting }) => isIntersecting)) {
      observer.disconnect();
      fn();
    }
  });
  observer.observe(element);
};
```

```js
// utils/a11y.js
export function lockBackground(exception) { … }
export function focusFirst(container) { … }
```

**Rules:**
- No `document.querySelector` at module level
- Always named exports (no default unless aliased)
- No side-effects — pure input/output

### `components/`

Always-on UI components. Initialised on every page via `components/index.js`.

```js
// components/index.js
import './drawer';
import './dropdown';
import './menu';
import './modal';
import './tooltip';
import './video';
```

Each component file is self-contained: class definition + auto-init at the bottom.

```js
// Pattern
class MyComponent {
  constructor(el) { … }
  show() { … }
  hide() { … }
  static getInstance(el) { return el._myInstance ?? null; }
}

// Auto-init
document.querySelectorAll('.js-my-trigger').forEach((trigger) => {
  const target = document.querySelector(trigger.dataset.target);
  if (!target) return;
  const instance = new MyComponent(target);
  target._myInstance = instance;
  trigger.addEventListener('click', () => instance.show());
});
```

**Rules:**
- Class for anything stateful (open/close, transitions, focus)
- Store instance on the DOM node: `el._componentInstance = instance`
- Always expose `static getInstance(el)` for cross-component access
- Guard against missing elements: `if (!target) return`

### `features/`

Optional capabilities gated by Hugo site params. Loaded only when the feature is enabled in `config/_default/params.yaml`.

```js
// features/animation.js
import scrollspy from '../utils/scrollspy';

const elements = document.querySelectorAll('[data-anim]');
document.addEventListener('DOMContentLoaded', () => {
  elements.forEach((elm) => {
    scrollspy(elm, () => { elm.dataset.animShow = true; });
  });
});
```

**Rules:**
- Feature files are side-effect modules (no exports needed)
- Import utils, never import components
- Use `DOMContentLoaded` for deferred DOM access

### `blocks/`

JS specific to content blocks (chart, gallery, form…). Loaded selectively:

- **With hugolify-admin** — only the blocks used on the site are imported (via `params.admin.blocks.enable`)
- **Without hugolify-admin** — `blocks/index.js` imports everything as a fallback

**Rules:**
- One file per block, named after the block: `chart.js`, `gallery.js`
- No dependency on other blocks
- Can import features or utils

### `vendors/`

Third-party library glue. `vendors/custom.js` is the extension point — import npm packages here.

```js
// vendors/custom.js
import Splide from '@splidejs/splide';
window.Splide = Splide; // expose if needed by blocks
```

### `datas/`

Static JS data files (not logic). Currently holds map tile provider configs.

---

## Component pattern

All stateful UI components follow the same structure:

```js
class ComponentName {
  constructor(el) {
    this.el = el;
    this._previousFocus = null;
    this._unlock = null;
    // bind handlers that need removal
    this._escHandler = (e) => { if (e.key === 'Escape') this.hide(); };
  }

  show() {
    this._previousFocus = document.activeElement;
    this.el.dispatchEvent(new CustomEvent('component:show', { bubbles: true }));
    // … transition logic …
    this.el.dispatchEvent(new CustomEvent('component:shown', { bubbles: true }));
  }

  hide() {
    this.el.dispatchEvent(new CustomEvent('component:hide', { bubbles: true }));
    // … transition logic …
    this._previousFocus?.focus();
    this.el.dispatchEvent(new CustomEvent('component:hidden', { bubbles: true }));
  }

  static getInstance(el) {
    return el._componentInstance ?? null;
  }
}
```

**Transition handling** — read CSS `transitionDuration` rather than hardcoding delays:

```js
_afterTransition(fn) {
  const duration = parseFloat(getComputedStyle(this.el).transitionDuration) * 1000 || 0;
  setTimeout(fn, duration);
}
```

---

## Custom events

Components dispatch a **4-event lifecycle** that mirrors the Bootstrap convention:

| Event | When |
| --- | --- |
| `component:show` | Before opening — transition starts |
| `component:shown` | After opening — transition ends, focus moved |
| `component:hide` | Before closing — transition starts |
| `component:hidden` | After closing — transition ends, focus restored |

Component names replace `component`: `drawer:show`, `modal:shown`, `dropdown:hidden`…

Other components (e.g. `menu.js`) listen to these events to react to state changes without direct coupling:

```js
// menu.js — reacts to drawer and modal events
elm.addEventListener('drawer:shown', () => {
  document.documentElement.classList.add('is-menu-open');
});
elm.addEventListener('drawer:hidden', () => {
  document.documentElement.classList.remove('is-menu-open');
});
```

---

## A11y

All interactive components implement the same accessibility checklist:

| Concern | Implementation |
| --- | --- |
| Background lock | `inert` attribute via `lockBackground()` in `utils/a11y.js` |
| Focus on open | `focusFirst(container)` in `utils/a11y.js` |
| Focus restore on close | `this._previousFocus?.focus()` |
| Keyboard close | `Escape` key via `_escHandler`, added/removed around lifecycle |
| ARIA hidden | `aria-hidden="true"` when closed, removed on open |
| Expected HTML | `role="dialog"` + `aria-modal="true"` in the template |

`lockBackground` uses the `inert` attribute (not `aria-hidden`) to prevent interaction with background elements — it covers keyboard, pointer, and assistive technology simultaneously.

---

## Extension points

Three files exist solely as extension points for project-specific code. They are always imported and never removed.

| File | Purpose |
| --- | --- |
| `vendors/custom.js` | Import and expose third-party npm packages |
| `features/custom.js` | Add site-specific feature scripts |
| `components/custom.js` | Add site-specific component scripts |

These files ship empty. Add code directly — no wiring needed, they are already in the load order.
