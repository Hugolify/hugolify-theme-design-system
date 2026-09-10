/**
 * Scrollsnap — keyboard access for the CSS carousels, and their optional
 * prev/next buttons.
 *
 * The carousel itself is pure CSS (@uncinq/css-components,
 * css/utilities/scrollsnap.css): the row scrolls and snaps with no JS at all.
 * JS only adds what CSS cannot express:
 *
 * - a scrolling row has to be reachable and scrollable with a keyboard, so
 *   every .scrollsnap-* row that actually overflows gets tabindex="0" and a
 *   name. Above its breakpoint the grid comes back, there is nothing left to
 *   scroll, and the tab stop goes away with it
 * - prev/next buttons, opt-in with the scrollsnap.nav param — site wide, per
 *   block type, or on a single block. The theme then puts .js-scrollsnap-nav,
 *   or .js-scrollsnap-nav-pointer for the buttons a touch screen does not get,
 *   next to .scrollsnap-* (see func/SetScrollsnap.html)
 *
 * A11y:
 * - while it scrolls, the row is a named role="group": announced as one thing,
 *   focusable, and scrolled with the arrow keys — items are not always links,
 *   so tabbing into them is not a way in one can count on
 * - the buttons come BEFORE the row, in the DOM and on screen alike, so they
 *   are reached without tabbing through every item first
 * - they carry an aria-label and aria-controls, and turn aria-disabled at
 *   their end of the row rather than disabled, which would drop the focus of
 *   whoever just clicked them
 * - the whole nav is hidden while the row does not overflow
 *
 * The pointer-only variant is left to CSS — see components/scrollsnap-nav.css.
 * A neighbour that has to know whether the buttons are on screen therefore
 * needs both states: the hidden attribute AND that media query.
 */

const SCROLLERS = '.scrollsnap, .scrollsnap-sm, .scrollsnap-md, .scrollsnap-lg, .scrollsnap-xl';

let uid = 0;

class Scrollsnap {
  constructor(scroller) {
    this.scroller = scroller;
    this.rtl = getComputedStyle(scroller).direction === 'rtl';
    this.frame = null;
    this.scrollable = null;
    // A row the markup already named keeps its own role and label.
    this.named = scroller.hasAttribute('role') || scroller.hasAttribute('aria-label');
    this.label = (window.i18n && window.i18n.carousel && window.i18n.carousel.carousel) || 'Carousel';

    this.nav = this.wantsNav() ? this.renderNav() : null;
    if (this.nav) scroller.insertAdjacentElement('beforebegin', this.nav);

    this.bind();
    this.update();
  }

  wantsNav() {
    return this.scroller.classList.contains('js-scrollsnap-nav')
      || this.scroller.classList.contains('js-scrollsnap-nav-pointer');
  }

  renderNav() {
    if (!this.scroller.id) this.scroller.id = `scrollsnap-${(uid += 1)}`;

    const nav = document.createElement('div');
    // The pointer-only variant is decided in CSS, on the nav itself.
    nav.className = this.scroller.classList.contains('js-scrollsnap-nav-pointer')
      ? 'scrollsnap-nav scrollsnap-nav-pointer'
      : 'scrollsnap-nav';
    nav.hidden = true;
    this.prev = this.button('prev', window.i18n && window.i18n.previous);
    this.next = this.button('next', window.i18n && window.i18n.next);
    nav.append(this.prev, this.next);
    return nav;
  }

  button(direction, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `scrollsnap-nav-btn scrollsnap-nav-${direction}`;
    button.setAttribute('aria-label', label || direction);
    button.setAttribute('aria-controls', this.scroller.id);
    // The arrow itself is a mask on ::before — see components/scrollsnap-nav.css.
    return button;
  }

  bind() {
    if (this.nav) {
      this.prev.addEventListener('click', () => this.scroll(-1));
      this.next.addEventListener('click', () => this.scroll(1));
    }
    this.scroller.addEventListener('scroll', () => this.schedule(), { passive: true });
    // Catches both the viewport resizing and the grid coming back above its rung.
    new ResizeObserver(() => this.schedule()).observe(this.scroller);
  }

  /** One item at a time — the snap points do the landing. */
  scroll(sign) {
    // aria-disabled leaves the button clickable, so the end is checked here.
    if ((sign < 0 ? this.prev : this.next).getAttribute('aria-disabled') === 'true') return;

    this.scroller.scrollBy({
      left: this.step() * sign * (this.rtl ? -1 : 1),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    });
  }

  /** Item pitch = width + gap, read off the items themselves. */
  step() {
    const [first, second] = this.scroller.children;
    if (first && second) return Math.abs(second.offsetLeft - first.offsetLeft);
    if (first) return first.offsetWidth;
    return this.scroller.clientWidth;
  }

  schedule() {
    if (this.frame) return;
    this.frame = requestAnimationFrame(() => {
      this.frame = null;
      this.update();
    });
  }

  update() {
    const max = this.scroller.scrollWidth - this.scroller.clientWidth;
    // A pixel of slack: sub-pixel track widths leave a scrollWidth that never
    // quite matches, and would keep a dead tab stop or an end button alive.
    this.setScrollable(max > 1);
    if (!this.nav || !this.scrollable) return;

    const position = Math.abs(this.scroller.scrollLeft);
    this.prev.setAttribute('aria-disabled', String(position <= 1));
    this.next.setAttribute('aria-disabled', String(position >= max - 1));
  }

  /** A row that no longer overflows is a plain grid again — and a plain grid
      is neither a tab stop nor a group. */
  setScrollable(scrollable) {
    if (scrollable === this.scrollable) return;
    this.scrollable = scrollable;

    if (this.nav) this.nav.hidden = !scrollable;

    if (scrollable) {
      this.scroller.tabIndex = 0;
      if (!this.named) {
        this.scroller.setAttribute('role', 'group');
        this.scroller.setAttribute('aria-label', this.label);
      }
      return;
    }

    this.scroller.removeAttribute('tabindex');
    if (!this.named) {
      this.scroller.removeAttribute('role');
      this.scroller.removeAttribute('aria-label');
    }
  }
}

document.querySelectorAll(SCROLLERS).forEach((scroller) => new Scrollsnap(scroller));
