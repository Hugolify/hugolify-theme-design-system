/**
 * Search — focuses the input when the search panel opens.
 *
 * Listens to the dialog:shown custom event.
 */
const search = document.getElementById('mainSearch');

if (search) {
  search.addEventListener('dialog:shown', () => search.querySelector('input')?.focus());
}
