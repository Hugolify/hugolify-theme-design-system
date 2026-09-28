/**
 * Filters "show more" — catches the focus the fold drops.
 *
 * Once the terms are out, the summary goes away, see .filters-more in
 * components/filters-more.css. A control removed while it holds the focus sends
 * that focus back to the document, and the keyboard lands at the top of the
 * page instead of the panel. The first term revealed takes it instead: the
 * reading carries on where it was, and a screen reader announces what has
 * just appeared.
 *
 * The stylesheet only hides the summary of a fold this module has taken over,
 * so with no script the control stays in place and nothing is lost.
 *
 * Markup: commons/filters/taxonomy.html in hugolify-theme, rendered when
 * site.Params.filters.more.enable is true.
 *
 * WCAG 2.4.3 Focus Order, level A: this module is what keeps the fold to it,
 * so it goes away only with the disappearing summary it answers.
 */
document.querySelectorAll('.filters-more').forEach((fold) => {
  const summary = fold.querySelector('summary');
  if (!summary) return;

  fold.classList.add('is-initialized');

  summary.addEventListener('click', () => {
    /* The fold opens once this listener is done, the summary going with it:
       the term to focus is only there on the next frame. */
    requestAnimationFrame(() => {
      if (fold.open) fold.querySelector('a')?.focus();
    });
  });
});
