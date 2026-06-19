/**
 * App-specific copy for the `list` archetype. APP-OWNED — every user-facing
 * string in the domain screens lives here (canon § Translations); reference it
 * via t('list.…') from ../i18n. Rename keys to your domain when you fork.
 */

export const APP_STRINGS = {
  home: {
    title: 'Lists',
    empty: 'No lists yet. Tap + to add one.',
    newList: 'New list',
    add: 'Add list',
  },
  list: {
    addItem: 'Add an item',
    empty: 'No items yet. Add one above.',
    itemCount: '{done} of {total}',
    delete: 'Delete list',
    rename: 'Rename list',
  },
} as const;
