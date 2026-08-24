/**
 * A11y utilities — focus management helpers.
 */

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Lock everything outside a panel using the `inert` attribute.
 *
 * Walks up from the panel to <body>, inerting the siblings found at each
 * level: only the panel and its ancestor chain stay reachable. Inerting the
 * children of <body> alone would leave the whole subtree around a nested
 * panel — a drawer inside <main>, for instance — focusable behind it.
 *
 * Elements already inert are left alone, so restoring never reveals them.
 * Returns a function to restore the previous state.
 */
export function lockBackground(panel) {
  const locked = [];

  for (let node = panel; node && node !== document.body; node = node.parentElement) {
    const parent = node.parentElement;
    if (!parent) break;

    for (const sibling of parent.children) {
      if (sibling === node || sibling.inert || sibling.tagName === 'SCRIPT') continue;
      sibling.inert = true;
      locked.push(sibling);
    }
  }

  return () => locked.forEach((el) => (el.inert = false));
}

/**
 * Move focus inside a container: an explicit [autofocus] target if there is
 * one, the first focusable element otherwise.
 */
export function focusFirst(container) {
  const el = container.querySelector('[autofocus]') ?? container.querySelector(FOCUSABLE);
  if (el) el.focus();
}
