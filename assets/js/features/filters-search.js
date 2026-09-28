/**
 * Filters search — narrows the filter lists to the terms having a word that
 * starts with the query, once it is at least 3 characters long.
 *
 * Case and accents are ignored, so "penal" finds "Droit pénal". A word starts
 * after anything that is not a letter or a digit (space, hyphen, apostrophe),
 * so "arret" finds "l'arrêt" too. A list left without a match is hidden with
 * its title.
 *
 * The terms folded behind a "show more" are searched too: the fold is opened
 * while searching, then set back as it was once the search is cleared.
 *
 * Markup: commons/filters/search.html in hugolify-theme, rendered when
 * site.Params.filters.search.enable is true.
 */
const MIN_LENGTH = 3;

const normalize = (text) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const escapeRegExp = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

document.querySelectorAll('.js-filters-search').forEach((input) => {
  const content = input.closest('.content');
  const status = input.parentElement.querySelector('[role="status"]');
  const lists = [...content.querySelectorAll('.list')].map((list) => ({
    list,
    more: list.querySelector('.filters-more'),
    wasOpen: false,
    items: [...list.querySelectorAll('li')].map((item) => ({
      item,
      text: normalize(item.textContent),
    })),
  }));
  let isSearching = false;

  input.addEventListener('input', () => {
    const query = normalize(input.value);
    const isActive = query.length >= MIN_LENGTH;
    const wordStart = new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(query)}`, 'u');
    let matches = 0;

    if (isActive !== isSearching) {
      lists.forEach((entry) => {
        if (!entry.more) return;
        if (isActive) entry.wasOpen = entry.more.open;
        entry.more.open = isActive || entry.wasOpen;
      });
      isSearching = isActive;
    }

    lists.forEach(({ list, items }) => {
      let listMatches = 0;
      items.forEach(({ item, text }) => {
        const isMatch = !isActive || wordStart.test(text);
        item.hidden = !isMatch;
        if (isMatch) listMatches += 1;
      });
      list.hidden = listMatches === 0;
      matches += listMatches;
    });

    /* Assigning textContent replaces the text node even when the string is
       the same, and the live region reads itself out again. Only a message
       that actually changed reaches it. */
    const message = isActive && matches === 0 ? status.dataset.empty : '';
    if (status.textContent !== message) status.textContent = message;
  });
});
