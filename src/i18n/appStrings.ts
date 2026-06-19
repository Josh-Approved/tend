/**
 * App-specific copy for Tend. APP-OWNED — every user-facing string in the domain
 * screens lives here (canon § Translations); reference it via t('home.…') /
 * t('person.…') from ../i18n. Shell chrome (Settings/About, common actions) is
 * translated by the shell's own strings.
 */

export const APP_STRINGS = {
  home: {
    title: 'People',
    empty: 'No one here yet. Tap + to add someone you want to keep up with.',
    add: 'Add person',
    overdueBy: 'Overdue by {days}d',
    dueToday: 'Reach out today',
    dueInDays: 'Due in {days}d',
    okInDays: 'Next check-in in {days}d',
    noReminder: 'No reminder set',
    markReached: 'Mark reached out to {name}',
  },
  person: {
    newPerson: 'New person',
    namePlaceholder: 'Their name',
    reachedOut: 'I reached out',
    lastReachedToday: 'Reached out today',
    lastReachedDays: 'Last reached out {days}d ago',
    lastReachedNever: "You haven't logged reaching out yet",
    cadenceLabel: 'How often do you want to reach out?',
    cadenceNone: 'No reminder',
    cadenceWeekly: 'Weekly',
    cadenceBiweekly: 'Every 2 weeks',
    cadenceMonthly: 'Monthly',
    cadenceQuarterly: 'Every 3 months',
    notesLabel: 'Notes',
    notesPlaceholder: "What do you want to remember? Their favorites, what's going on, what to ask about next time…",
    datesLabel: 'Important dates',
    dateLabelPlaceholder: 'Birthday, anniversary…',
    monthPlaceholder: 'MM',
    dayPlaceholder: 'DD',
    addDate: 'Add date',
    inDays: 'in {days}d',
    dateToday: 'today',
    prefsLabel: 'Likes, dislikes & gift ideas',
    like: 'Likes',
    dislike: 'Dislikes',
    gift: 'Gift ideas',
    prefPlaceholder: 'Add something to remember',
    addPref: 'Add',
    remove: 'Remove',
    deletePerson: 'Remove this person',
    deleteConfirmTitle: 'Remove {name}?',
    deleteConfirmBody: "This deletes everything you've saved about them. It can't be undone.",
    cancel: 'Cancel',
    confirmRemove: 'Remove',
    untitled: 'this person',
  },
  data: {
    imported: '{count} added',
  },
} as const;
