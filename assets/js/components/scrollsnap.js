/**
 * Scrollsnap — keyboard access for the CSS carousels, and their optional
 * prev/next buttons and pagination.
 *
 * The carousel itself is pure CSS (@uncinq/css-components,
 * css/utilities/scrollsnap.css): the row scrolls and snaps with no JS at all.
 * JS only adds what CSS cannot express:
 *
 * - a scrolling row has to be reachable and scrollable with a keyboard, so
 *   every .scrollsnap-* row that actually overflows gets tabindex="0" and a
 *   name. Above its breakpoint the grid comes back, there is nothing left to
 *   scroll, and the tab stop goes away with it
 * - prev/next buttons, opt-in with the scrollsnap.nav param, and a pagination,
 *   opt-in with scrollsnap.pagination — site wide, per block type, or on a
 *   single block. The theme then puts .js-scrollsnap-nav /
 *   .js-scrollsnap-pagination, or their -pointer variant for controls a touch
 *   screen does not get, next to .scrollsnap-* (see func/SetScrollsnap.html)
 *
 * A11y:
 * - while it scrolls, the row is a named role="group": announced as one thing,
 *   focusable, and scrolled with the arrow keys — items are not always links,
 *   so tabbing into them is not a way in one can count on
 * - the buttons come BEFORE the row, in the DOM and on screen alike, so they
 *   are reached without tabbing through every item first; the pagination comes
 *   after, where it is read as the position report it is
 * - controls carry an aria-label and aria-controls, the nav turns aria-disabled
 *   at its end of the row rather than disabled, which would drop the focus of
 *   whoever just clicked, and the current dot carries aria-current
 * - controls are hidden while the row does not overflow
 *
 * The pointer-only variants are left to CSS — see components/scrollsnap-nav.css
 * and components/scrollsnap-pagination.css. A neighbour that has to know
 * whether a control is on screen therefore needs both states: the hidden
 * attribute AND that media query.
 */

const SCROLLERS = '.scrollsnap, .scrollsnap-sm, .scrollsnap-md, .scrollsnap-lg, .scrollsnap-xl';

let uid = 0;

class Scrollsnap {
  constructor(scroller) {
    this.scroller = scroller;
    this.rtl = getComputedStyle(scroller).direction === 'rtl';
    this.frame = null;
    this.scrollable = null;
    this.dots = [];
    // A row already named by the markup keeps its own role and label.
    this.named = scroller.hasAttribute('role') || scroller.hasAttribute('aria-label');
    this.i18n = window.i18n || {};

    this.nav = this.wants('nav') ? this.renderNav() : null;
    if (this.nav) scroller.insertAdjacentElement('beforebegin', this.nav);

    this.pagination = this.wants('pagination') ? this.renderPagination() : null;
    if (this.pagination) scroller.insertAdjacentElement('afterend', this.pagination);

    this.bind();
    this.update();
  }

  /** Opted in either way — plain, or only where there is a fine pointer. */
  wants(kind) {
    return this.scroller.classList.contains(`js-scrollsnap-${kind}`)
      || this.scroller.classList.contains(`js-scrollsnap-${kind}-pointer`);
  }

  /** The class name of a control, carrying the pointer variant over to CSS. */
  classFor(kind) {
    const base = `scrollsnap-${kind}`;
    return this.scroller.classList.contains(`js-scrollsnap-${kind}-pointer`)
      ? `${base} ${base}-pointer`
      : base;
  }

  /** aria-controls needs something to point at. */
  identify() {
    if (!this.scroller.id) this.scroller.id = `scrollsnap-${(uid += 1)}`;
    return this.scroller.id;
  }

  renderNav() {
    this.identify();

    const nav = document.createElement('div');
    nav.className = this.classFor('nav');
    nav.hidden = true;
    this.prev = this.button('prev', this.i18n.previous);
    this.next = this.button('next', this.i18n.next);
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

  /** The dots themselves are built on measure — their count depends on how
      many viewports wide the row turns out to be. */
  renderPagination() {
    this.identify();

    const pagination = document.createElement('div');
    pagination.className = this.classFor('pagination');
    pagination.hidden = true;
    return pagination;
  }

  dot(page) {
    const label = (this.i18n.carousel && this.i18n.carousel.pageX) || '%s';
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = 'scrollsnap-pagination-dot';
    dot.setAttribute('aria-label', label.replace('%s', page + 1));
    dot.setAttribute('aria-controls', this.scroller.id);
    dot.addEventListener('click', () => this.scrollTo(page * this.scroller.clientWidth));
    return dot;
  }

  bind() {
    if (this.nav) {
      this.prev.addEventListener('click', () => this.move(-1));
      this.next.addEventListener('click', () => this.move(1));
    }
    this.scroller.addEventListener('scroll', () => this.schedule(), { passive: true });
    // Catches both the viewport resizing and the grid coming back above its rung.
    new ResizeObserver(() => this.schedule()).observe(this.scroller);
  }

  /** One item at a time — the snap points do the landing. */
  move(sign) {
    // aria-disabled leaves the button clickable, so the end is checked here.
    if ((sign < 0 ? this.prev : this.next).getAttribute('aria-disabled') === 'true') return;

    this.scroller.scrollBy({
      left: this.step() * sign * (this.rtl ? -1 : 1),
      behavior: this.behavior()
    });
  }

  scrollTo(left) {
    this.scroller.scrollTo({
      left: this.rtl ? -left : left,
      behavior: this.behavior()
    });
  }

  behavior() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
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
    // quite matches, and would keep a dead tab stop or an end control alive.
    this.setScrollable(max > 1);
    if (!this.scrollable) return;

    const position = Math.abs(this.scroller.scrollLeft);
    if (this.nav) this.updateNav(position, max);
    if (this.pagination) this.updatePagination(position, max);
  }

  updateNav(position, max) {
    this.prev.setAttribute('aria-disabled', String(position <= 1));
    this.next.setAttribute('aria-disabled', String(position >= max - 1));
  }

  updatePagination(position, max) {
    const width = this.scroller.clientWidth;
    // One dot per viewport-wide page — the same unit a dot scrolls by, so the
    // count follows the row instead of the number of items, and 9 cards under
    // 3 columns read as 3 dots rather than 9.
    this.fill(Math.max(1, Math.ceil((this.scroller.scrollWidth - 1) / width)));

    // The last page is a partial one: the row stops before a whole width, so
    // rounding would never reach it.
    const current = position >= max - 1
      ? this.dots.length - 1
      : Math.min(Math.round(position / width), this.dots.length - 1);

    this.dots.forEach((dot, page) => {
      if (page === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  fill(pages) {
    if (pages === this.dots.length) return;

    this.dots = Array.from({ length: pages }, (_, page) => this.dot(page));
    this.pagination.replaceChildren(...this.dots);
  }

  /** A row that no longer overflows is a plain grid again — and a plain grid
      is neither a tab stop nor a group, and has nothing to drive. */
  setScrollable(scrollable) {
    if (scrollable === this.scrollable) return;
    this.scrollable = scrollable;

    if (this.nav) this.nav.hidden = !scrollable;
    if (this.pagination) this.pagination.hidden = !scrollable;

    if (scrollable) {
      this.scroller.tabIndex = 0;
      if (!this.named) {
        this.scroller.setAttribute('role', 'group');
        this.scroller.setAttribute('aria-label', (this.i18n.carousel && this.i18n.carousel.carousel) || 'Carousel');
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
