/**
 * Search — focuses the input when the search panel opens.
 *
 * Listens to modal:shown and drawer:shown custom events.
 */
const search = document.getElementById('mainSearch');

if (search) {
  const focusInput = () => search.querySelector('input')?.focus();

  search.addEventListener('drawer:shown', focusInput);
  search.addEventListener('modal:shown', focusInput);
}
