/**
 * Gallery — lazy-loads Tobii lightbox via a shared promise.
 * Tobii (JS) is injected dynamically on first use;
 * subsequent galleries wait on the same promise (no duplicate loading).
 * Uses i18n strings for close/next/previous labels.
 *
 * @see https://github.com/midzer/tobii
 */
import scrollspy from '../utils/scrollspy';

let tobiiLoadPromise = null;
function loadTobii() {
  if (tobiiLoadPromise) return tobiiLoadPromise;

  tobiiLoadPromise = new Promise((resolve) => {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = '/assets/css/tobii.min.css';
    document.head.appendChild(css);

    const js = document.createElement('script');
    js.src = '/assets/js/tobii.min.js';
    js.addEventListener('load', resolve);
    document.body.appendChild(js);
  });

  return tobiiLoadPromise;
}

const galleries = document.querySelectorAll('.js-gallery');
let lightboxLoaded = false;

class Gallery {
  constructor(div) {
    this.gallery = div;
    if (this.gallery && !lightboxLoaded) {
      loadTobii().then(() => this.init());
    }
  }

  init() {
    lightboxLoaded = true;
    const tobii = new window.Tobii({
      captionsSelector: 'self',
      captionAttribute: 'data-caption',
      zoom: false,
      navLabel: [window.i18n.previous, window.i18n.next],
      closeLabel: window.i18n.close
    });
  }
}

galleries.forEach((gallery) => {
  scrollspy(gallery, () => {
    new Gallery(gallery);
  });
});