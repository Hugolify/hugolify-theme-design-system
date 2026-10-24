/**
 * Dialog — modal panel, native or popover-driven.
 *
 * One API, two strategies picked from the element's tag. Both put the panel in
 * the top layer, so both get a native ::backdrop and neither depends on a
 * z-index or on where the panel sits in the document.
 *
 * - <dialog> → opened by command="show-modal". The browser handles Escape, the
 *   focus trap and making the rest of the page inert, and closedby="any" adds
 *   the click on the backdrop. Use this whenever the panel is always an
 *   overlay.
 *
 * - popover="auto" → opened by popovertarget. Same top layer, same ::backdrop,
 *   but the element keeps its own semantics: role="dialog" and aria-modal are
 *   set here, only while the panel is open. That is what a <dialog> cannot do
 *   — it reads as a dialog even when CSS merely styles it as a sidebar. Use
 *   this form for panels that become a region of the page above a breakpoint
 *   (see .panel-inline in css-components).
 *
 *   "auto" and not "manual": a manual popover deliberately leaves the page
 *   interactive, so its backdrop swallows nothing and a click outside lands on
 *   the inert background, where no event is ever dispatched. Light dismiss is
 *   the platform's answer, and it also brings Escape. Inertness stays ours.
 *
 * The browser opens and closes the panel by itself, through the native
 * invokers of the markup (hugolify-theme commons/dialog/button.html), so the
 * panel works without JavaScript. This script only adds what the platform
 * does not: the dialog ARIA and the inert background of a popover, closing on
 * an in-page anchor or a width change, and the events below. It still opens
 * the panel itself from a button without a native invoker — older markup —
 * or when the browser does not know invoker commands yet.
 *
 * Markup: class .modal (centred) or .drawer (edge) — see @uncinq/css-components.
 *         Any panel that is not a <dialog> must carry popover="auto".
 * Toggle: popovertarget, or commandfor + command="show-modal"; otherwise
 *         .js-dialog-toggle[data-target="#id"]
 * Close:  popovertargetaction="hide", or command="close"; otherwise
 *         .js-dialog-close inside the panel
 *
 * Events (bubble):
 * - dialog:shown  — after opening
 * - dialog:hidden — after closing
 */
import { lockBackground, focusFirst } from '../utils/a11y';

const supportsCommands = 'commandForElement' in HTMLButtonElement.prototype;

/** True when the browser acts on the button by itself */
const isInvoker = (btn) =>
  btn.hasAttribute('popovertarget') || (supportsCommands && btn.hasAttribute('commandfor'));

const emit = (panel, name) => panel.dispatchEvent(new CustomEvent(name, { bubbles: true }));

/**
 * The platform hands the focus back to the trigger on Escape and on the close
 * button, but not always: light dismiss and some browsers leave it on <body>.
 */
const restoreFocus = (panel) => {
  if (document.activeElement && document.activeElement !== document.body) return;
  document.querySelector(`[aria-controls="${panel.id}"]`)?.focus({ preventScroll: true });
};

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
  const close = () => {
    if (panel.open) panel.close();
  };

  // The backdrop click is closedby="any" where the browser supports it; this
  // covers the others, and finds the panel already closed everywhere else.
  panel.addEventListener('click', (e) => {
    if (isBackdropClick(panel, e) || isAnchor(e)) close();
  });

  // A <dialog> has no opening event everywhere yet, but every way in sets
  // [open]: the invoker command as well as showModal() below.
  new MutationObserver(() => {
    if (panel.open) emit(panel, 'dialog:shown');
  }).observe(panel, { attributeFilter: ['open'] });

  // `close` fires on every way out: Escape, backdrop, command, close()
  panel.addEventListener('close', () => {
    restoreFocus(panel);
    emit(panel, 'dialog:hidden');
  });

  return {
    open: () => {
      if (!panel.open) panel.showModal();
    },
    close,
  };
}

function popoverStrategy(panel) {
  let unlock = null;
  let closedAt = 0;

  const isOpen = () => panel.matches(':popover-open');

  // Setup and teardown hang off the toggle events, never off a call of our
  // own: the platform opens and closes the panel by itself — invoker, light
  // dismiss, Escape. beforetoggle runs before the change, so the background is
  // released before the platform hands the focus back to the trigger.
  panel.addEventListener('beforetoggle', (e) => {
    if (e.newState === 'open') {
      // Set only while open: above its breakpoint a .panel-inline panel is a
      // region of the page and must not read as a dialog.
      panel.setAttribute('role', 'dialog');
      panel.setAttribute('aria-modal', 'true');
      unlock = lockBackground(panel);
      return;
    }
    panel.removeAttribute('aria-modal');
    panel.removeAttribute('role');
    unlock?.();
    unlock = null;
  });

  panel.addEventListener('toggle', (e) => {
    if (e.newState === 'open') {
      // The platform focuses an [autofocus] descendant; markup without one
      // still needs the focus moved inside.
      if (!panel.contains(document.activeElement)) focusFirst(panel);
      emit(panel, 'dialog:shown');
      return;
    }
    closedAt = performance.now();
    restoreFocus(panel);
    emit(panel, 'dialog:hidden');
  });

  panel.addEventListener('click', (e) => {
    if (isAnchor(e)) panel.hidePopover();
  });

  return {
    open: () => {
      // Light dismiss fires on pointerdown, so clicking a trigger without
      // popovertarget while the panel is open closes it and then still
      // delivers a click here. Without this window the panel would reopen on
      // the spot. A popovertarget trigger is exempt from light dismiss.
      if (isOpen() || performance.now() - closedAt < 200) return;
      panel.showPopover();
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
      if (isInvoker(toggle)) return;
      toggle.addEventListener('click', (e) => {
        e.preventDefault();
        strategy.open();
      });
    });

  panel.querySelectorAll('.js-dialog-close').forEach((btn) => {
    if (isInvoker(btn)) return;
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
