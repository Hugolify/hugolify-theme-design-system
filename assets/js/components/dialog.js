/**
 * Dialog — modal panel, native or popover-driven.
 *
 * One API, two strategies picked from the element's tag. Both put the panel in
 * the top layer, so both get a native ::backdrop and neither depends on a
 * z-index or on where the panel sits in the document.
 *
 * - <dialog> → showModal() / close(). The browser handles Escape, the focus
 *   trap and making the rest of the page inert. Use this whenever the panel is
 *   always an overlay.
 *
 * - popover="auto" → showPopover() / hidePopover(). Same top layer, same
 *   ::backdrop, but the element keeps its own semantics: role="dialog" and
 *   aria-modal are set here, only while the panel is open. That is what a
 *   <dialog> cannot do — it reads as a dialog even when CSS merely styles it
 *   as a sidebar. Use this form for panels that become a region of the page
 *   above a breakpoint (see .panel-inline in css-components).
 *
 *   "auto" and not "manual": a manual popover deliberately leaves the page
 *   interactive, so its backdrop swallows nothing and a click outside lands on
 *   the inert background, where no event is ever dispatched. Light dismiss is
 *   the platform's answer, and it also brings Escape. Inertness and the focus
 *   move stay ours.
 *
 * Markup: class .modal (centred) or .drawer (edge) — see @uncinq/css-components.
 *         Any panel that is not a <dialog> must carry popover="auto".
 * Toggle: .js-dialog-toggle[data-target="#id"]
 * Close:  .js-dialog-close inside the panel
 *
 * Events (bubble):
 * - dialog:shown  — after opening
 * - dialog:hidden — after closing
 */
import { lockBackground, focusFirst } from '../utils/a11y';

const withTransition = (fn) => {
  if (document.startViewTransition) document.startViewTransition(fn);
  else fn();
};

const emit = (panel, name) => panel.dispatchEvent(new CustomEvent(name, { bubbles: true }));

/**
 * A click on the ::backdrop reports the panel itself as the target, since the
 * backdrop belongs to it. Only the coordinates tell the two apart — and a
 * keyboard-triggered click reports 0,0, which must not count as outside.
 */
const isBackdropClick = (panel, e) => {
  if (e.target !== panel) return false;
  const rect = panel.getBoundingClientRect();
  return !(
    e.clientX >= rect.left &&
    e.clientX <= rect.right &&
    e.clientY >= rect.top &&
    e.clientY <= rect.bottom
  );
};

/**
 * In-page anchors: close first so the scroll lock is released before the
 * browser jumps to the target, then let the navigation happen.
 */
const isAnchor = (e) => Boolean(e.target.closest('a[href^="#"]'));

function nativeStrategy(panel) {
  let lastToggle = null;

  const close = () => {
    if (!panel.open) return;
    withTransition(() => panel.close());
  };

  panel.addEventListener('click', (e) => {
    if (isBackdropClick(panel, e) || isAnchor(e)) close();
  });

  // `close` also fires on Escape. Native focus restore can be lost across a
  // view transition, hence the explicit focus.
  panel.addEventListener('close', () => {
    lastToggle?.focus();
    emit(panel, 'dialog:hidden');
  });

  return {
    open: (toggle) => {
      lastToggle = toggle;
      withTransition(() => {
        panel.showModal();
        emit(panel, 'dialog:shown');
      });
    },
    close,
  };
}

function popoverStrategy(panel) {
  let lastToggle = null;
  let unlock = null;
  let closedAt = 0;

  const isOpen = () => panel.matches(':popover-open');

  // Teardown hangs off the toggle event, never off a close() of our own: with
  // popover="auto" the platform closes the panel by itself — light dismiss,
  // Escape — and the inert background, the dialog ARIA and the focus have to
  // be released in those cases too.
  panel.addEventListener('toggle', (e) => {
    if (e.newState === 'open') return;
    closedAt = performance.now();
    panel.removeAttribute('aria-modal');
    panel.removeAttribute('role');
    unlock?.();
    unlock = null;
    lastToggle?.focus();
    emit(panel, 'dialog:hidden');
  });

  panel.addEventListener('click', (e) => {
    if (isAnchor(e)) panel.hidePopover();
  });

  return {
    open: (toggle) => {
      // Light dismiss fires on pointerdown, so clicking the trigger while the
      // panel is open closes it and then still delivers a click here. Without
      // this window the panel would reopen on the spot.
      if (isOpen() || performance.now() - closedAt < 200) return;
      lastToggle = toggle;
      unlock = lockBackground(panel);
      // Set only while open: above its breakpoint a .panel-inline panel is a
      // region of the page and must not read as a dialog.
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      panel.showPopover();
      focusFirst(panel);
      emit(panel, 'dialog:shown');
    },
    close: () => {
      if (isOpen()) panel.hidePopover();
    },
  };
}

const panels = [];

function initPanel(panel) {
  const strategy = panel.tagName === 'DIALOG' ? nativeStrategy(panel) : popoverStrategy(panel);

  document
    .querySelectorAll(`.js-dialog-toggle[data-target="#${panel.id}"]`)
    .forEach((toggle) => {
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        strategy.open(toggle);
      });
    });

  panel.querySelectorAll('.js-dialog-close').forEach((btn) => {
    btn.addEventListener('click', () => strategy.close());
  });

  panel._dialogInstance = strategy;
  panels.push({ panel, strategy });
}

document.querySelectorAll('.modal[id], .drawer[id]').forEach(initPanel);

/**
 * A .panel-inline-* panel turns into a region of the page above its
 * breakpoint. CSS puts it back in the flow on its own, but it cannot release
 * the top layer, the scroll lock, the inert background or the dialog ARIA — so
 * an open panel has to be closed for real when the viewport width changes.
 *
 * Width only: on mobile the virtual keyboard and the collapsing URL bar fire
 * resize constantly, and closing a panel while someone is typing in it would
 * be worse than the problem being solved.
 */
let viewportWidth = window.innerWidth;

window.addEventListener(
  'resize',
  () => {
    if (window.innerWidth === viewportWidth) return;
    viewportWidth = window.innerWidth;
    panels.forEach(({ panel, strategy }) => {
      if (panel.matches('[class*="panel-inline-"]')) strategy.close();
    });
  },
  { passive: true }
);

export const getInstance = (panel) => panel._dialogInstance ?? null;
