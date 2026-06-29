/**
 * Carousel — lazy-loads Splide via a shared promise.
 * Splide (JS + CSS) is injected dynamically on first use;
 * subsequent carousels wait on the same promise (no duplicate loading).
 *
 * @see https://splidejs.com/
 */
/* global Splide */
import scrollspy from '../utils/scrollspy';

// Lucide "chevron-right" path (https://lucide.dev/icons/chevron-right),
// rescaled from Lucide's 24×24 grid to the 40×40 viewBox Splide requires for
// `arrowPath`. Rendered as a stroke (not Splide's default fill) via CSS — see
// vendors/splide.css. Splide mirrors the prev arrow, so one path covers both.
const ARROW_PATH = 'm15 30 10-10-10-10';

// Splide scripts
let splideLoadPromise = null;
function loadSplide() {
  if (splideLoadPromise) return splideLoadPromise;

  splideLoadPromise = new Promise((resolve) => {
    const css = document.createElement('style');
    css.textContent = `@import url('/assets/css/splide.min.css') layer(vendors);`;
    document.head.appendChild(css);

    const js = document.createElement('script');
    js.type = 'text/javascript';
    js.src = '/assets/js/splide.min.js';
    js.addEventListener('load', resolve);
    document.body.appendChild(js);
  });

  return splideLoadPromise;
}

// Carousel class
class Carousel {
  constructor(carousel) {
    this.carousel = carousel;
    loadSplide().then(() => this.init());
  }

  init() {
    this.initDefaults();
    this.initCarousel();
  }

  initDefaults() {
    Splide.defaults = {
      arrowPath: ARROW_PATH,
      i18n: window.i18n.carousel
    };
  }

  initCarousel() {
    const splide = new Splide(this.carousel).mount();
    this.eventsCarousel(splide);
  }

  eventsCarousel(splide) {
    splide.on('click', (slide, e) => {
      if (e.pointerType === 'mouse') splide.go(slide.index);
    });
  }
}

// Load carousels
const carousels = document.querySelectorAll('.js-carousel');
carousels.forEach((carousel) => {
  scrollspy(carousel, () => new Carousel(carousel));
});
