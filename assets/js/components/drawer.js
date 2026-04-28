/**
 * Drawer — vanilla, accessible.
 *
 * CSS classes:
 * - show       — panel is visible
 * - showing    — added during open transition, removed on shown
 * - hiding     — added during close transition, removed on hidden
 * - is-open    — alias kept for CSS targeting
 *
 * Events (full lifecycle, bubbles):
 * - drawer:show   — before opening (transition starts)
 * - drawer:shown  — after opening (transition ends, focus moved)
 * - drawer:hide   — before closing (transition starts)
 * - drawer:hidden — after closing (transition ends, focus restored)
 *
 * A11y:
 * - aria-hidden on panel when closed
 * - aria-modal + role="dialog" expected in HTML
 * - Background locked via `inert`
 * - Focus moved inside on open, restored on close
 * - Escape to close
 * - Body scroll lock
 */
import { lockBackground, focusFirst } from '../utils/a11y';

class Drawer {
  constructor(el) {
    this.el = el;
    this._unlock = null;
    this._previousFocus = null;
    this._backdrop = null;
    this._escHandler = (e) => { if (e.key === 'Escape') this.hide(); };
  }

  _createBackdrop() {
    this._backdrop = document.createElement('div');
    this._backdrop.className = 'drawer-backdrop fade';
    this._backdrop.addEventListener('click', () => this.hide());
    this.el.insertAdjacentElement('afterend', this._backdrop);
    void this._backdrop.offsetHeight; // force reflow
    this._backdrop.classList.add('show');
  }

  _removeBackdrop() {
    if (!this._backdrop) return;
    this._backdrop.classList.remove('show');
    const el = this._backdrop;
    this._backdrop = null;
    const duration = parseFloat(getComputedStyle(el).transitionDuration) * 1000 || 0;
    setTimeout(() => el.remove(), duration);
  }

  _afterTransition(fn) {
    const duration = parseFloat(getComputedStyle(this.el).transitionDuration) * 1000 || 0;
    setTimeout(fn, duration);
  }

  _anchorHandler(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    e.preventDefault();
    const href = link.href;
    this.hide();
    setTimeout(() => { location.href = href; }, 300);
  }

  show() {
    this._previousFocus = document.activeElement;
    this._unlock = lockBackground(this.el);
    this._createBackdrop();

    this.el.classList.add('showing');
    this.el.removeAttribute('aria-hidden');
    document.body.classList.add('drawer-open');
    document.addEventListener('keydown', this._escHandler);
    this.el.addEventListener('click', (e) => this._anchorHandler(e));
    this.el.dispatchEvent(new CustomEvent('drawer:show', { bubbles: true }));

    void this.el.offsetHeight; // force reflow for CSS transition
    this.el.classList.add('is-open', 'show');

    this._afterTransition(() => {
      this.el.classList.remove('showing');
      focusFirst(this.el);
      this.el.dispatchEvent(new CustomEvent('drawer:shown', { bubbles: true }));
    });
  }

  hide() {
    this.el.classList.add('hiding');
    this.el.classList.remove('is-open', 'show');
    this.el.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('drawer-open');
    document.removeEventListener('keydown', this._escHandler);
    this.el.dispatchEvent(new CustomEvent('drawer:hide', { bubbles: true }));

    this._afterTransition(() => {
      this._unlock?.();
      this._removeBackdrop();
      this.el.classList.remove('hiding');
      this._previousFocus?.focus();
      this.el.dispatchEvent(new CustomEvent('drawer:hidden', { bubbles: true }));
    });
  }

  static getInstance(el) {
    return el._drawerInstance ?? null;
  }
}

// Auto-init
document.querySelectorAll('.js-drawer-toggle').forEach((trigger) => {
  const target = document.querySelector(trigger.dataset.target);
  if (!target) return;

  const instance = new Drawer(target);
  target._drawerInstance = instance;

  trigger.addEventListener('click', () => instance.show());
});

document.querySelectorAll('.js-drawer-close').forEach((btn) => {
  btn.addEventListener('click', () => {
    const panel = btn.closest('[id]');
    if (panel) Drawer.getInstance(panel)?.hide();
  });
});
