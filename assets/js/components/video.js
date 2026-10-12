/**
 * Video — lazy-loads video sources via IntersectionObserver.
 * Supports mobile/desktop source variants via data-src_mobile / data-src.
 * Starts videos marked data-autoplay once loaded (see autoplay()).
 * For autoplay videos without native controls, wires up the play/pause
 * toggle button (.js-toggle-video) rendered alongside the video.
 */
class Video {
  constructor(el) {
    this.el = el;
    this.toggle = el.parentElement.querySelector('.js-toggle-video');
    this.observe();
    this.initToggle();
  }

  observe() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.load();
          observer.unobserve(this.el);
        }
      });
    });
    observer.observe(this.el);
  }

  load() {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const hasMobile = Array.from(this.el.children).some(
      (s) => s.tagName === 'SOURCE' && s.hasAttribute('data-src_mobile')
    );

    Array.from(this.el.children).forEach((source) => {
      if (source.tagName !== 'SOURCE') return;
      if (isMobile && hasMobile && source.hasAttribute('data-src_mobile')) {
        source.src = source.dataset.src_mobile;
      } else if (source.hasAttribute('data-src')) {
        source.src = source.dataset.src;
      }
    });

    this.el.load();
    this.el.classList.remove('is-lazy');
    this.autoplay();
  }

  // Autoplay from script rather than the autoplay attribute: in Low Power
  // Mode, Safari forces a play button over any video carrying the attribute.
  // A refused play() leaves the video on its poster, with no button drawn.
  autoplay() {
    if (!this.el.hasAttribute('data-autoplay')) return;
    this.el.play().catch(() => {});
  }

  initToggle() {
    if (!this.toggle) return;

    this.toggle.addEventListener('click', () => {
      if (this.el.paused) {
        this.el.play();
      } else {
        this.el.pause();
      }
    });

    // Keep the button in sync with the video's actual playback state
    this.el.addEventListener('play', () => this.syncToggle());
    this.el.addEventListener('pause', () => this.syncToggle());
    this.syncToggle();
  }

  syncToggle() {
    const playing = !this.el.paused;
    this.toggle.classList.toggle('is-playing', playing);
    const label = playing ? this.toggle.dataset.labelPause : this.toggle.dataset.labelPlay;
    if (label) this.toggle.setAttribute('aria-label', label);
  }
}

// Load videos
document.querySelectorAll('.js-video.is-lazy').forEach((el) => new Video(el));
