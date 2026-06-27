/**
 * App-specific copy for Tend. APP-OWNED — every user-facing string in the domain
 * screens (and the local-reminder copy) lives here (canon § Translations);
 * reference it via t('home.…') / t('person.…') / t('notify.…') from ../i18n.
 */

export const APP_STRINGS = {
  nav: {
    today: 'Today',
    people: 'People',
  },
  today: {
    title: 'Today',
    reachOut: 'Reach out',
    caughtUp: "You're all caught up.",
    caughtUpSub: 'Nobody needs a nudge right now.',
  },
  home: {
    title: 'People',
    empty: 'No one here yet. Add someone you want to keep up with — or bring people in from your contacts.',
    add: 'Add person',
    importContacts: 'Import from contacts',
    overdueBy: 'Overdue by {days}d',
    dueToday: 'Reach out today',
    dueInDays: 'Due in {days}d',
    okInDays: 'Next check-in in {days}d',
    noReminder: 'No reminder set',
    markReached: 'Mark reached out to {name}',
    comingUp: 'Coming up',
    comingUpToday: "{name}'s {label} · today",
    comingUpDays: "{name}'s {label} · in {days}d",
    searchPlaceholder: 'Search people',
    searchNoResults: 'No one matches “{query}”.',
  },
  person: {
    newPerson: 'New person',
    namePlaceholder: 'Their name',
    reachedOut: 'I reached out',
    logKindCall: 'Call',
    logKindText: 'Text',
    logKindInPerson: 'In person',
    logKindOther: 'Other',
    logNotePlaceholder: 'What did you talk about? (optional)',
    lastReachedToday: 'Reached out today',
    lastReachedDays: 'Last reached out {days}d ago',
    lastReachedNever: "You haven't logged reaching out yet",
    historyLabel: 'Recent catch-ups',
    cadenceLabel: 'How often do you want to reach out?',
    cadenceNone: 'No reminder',
    cadenceWeekly: 'Weekly',
    cadenceBiweekly: 'Every 2 weeks',
    cadenceMonthly: 'Monthly',
    cadenceQuarterly: 'Every 3 months',
    howWeMetLabel: 'How you met',
    howWeMetPlaceholder: 'Where it started, how you know each other…',
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
    personalityLabel: 'Personality',
    personalityHint: 'Optional. If you know it, the app suggests gentle ways to show up — starting points, not boxes.',
  },
  personality: {
    framework: {
      enneagram: 'Enneagram type',
      attachment: 'Attachment style',
    },
    enneagram: {
      '1': {
        short: '1',
        label: 'Type 1 · The Improver',
        relate:
          "Principled, and wants things done right. Appreciate their high standards out loud, and don't take corrections personally — it's care, not criticism. Remind them that good enough is often enough.",
      },
      '2': {
        short: '2',
        label: 'Type 2 · The Helper',
        relate:
          'Warm and tuned to what everyone else needs. Ask what they need for a change — they rarely say. Notice the care they give and name it; they can pour out until they’re empty.',
      },
      '3': {
        short: '3',
        label: 'Type 3 · The Achiever',
        relate:
          'Driven and goal-focused. Celebrate the effort, not just the win. Remind them you value who they are, not only what they accomplish.',
      },
      '4': {
        short: '4',
        label: 'Type 4 · The Individualist',
        relate:
          'Deep-feeling and authentic. Meet their feelings without rushing to fix them — they want to be truly seen, not cheered up.',
      },
      '5': {
        short: '5',
        label: 'Type 5 · The Observer',
        relate:
          'Thoughtful and private. Give them space and a heads-up before big asks. Time alone to recharge isn’t distance from you.',
      },
      '6': {
        short: '6',
        label: 'Type 6 · The Loyal Skeptic',
        relate:
          'Loyal, and plans for what could go wrong. Be steady and consistent — predictability builds their trust. Take their worries seriously rather than brushing them off.',
      },
      '7': {
        short: '7',
        label: 'Type 7 · The Enthusiast',
        relate:
          'Upbeat and full of possibility. Bring them into plans and adventures. Gently stay with them through the hard feelings they’d rather skip past.',
      },
      '8': {
        short: '8',
        label: 'Type 8 · The Protector',
        relate:
          'Direct and strong-willed. Be straight with them — they respect honesty over tiptoeing. Underneath the strength is someone guarding a soft heart.',
      },
      '9': {
        short: '9',
        label: 'Type 9 · The Peacemaker',
        relate:
          'Easygoing and harmony-seeking. Ask for their opinion and wait for it — they downplay their own wants. Keep conflict calm; pressure makes them withdraw.',
      },
    },
    attachment: {
      secure: {
        short: 'Secure',
        label: 'Secure',
        relate:
          'Comfortable with both closeness and space. Keep doing what you do — honesty, reliability, and warmth land well. They make a steady anchor for others.',
      },
      anxious: {
        short: 'Anxious',
        label: 'Anxious',
        relate:
          'Craves closeness and feels distance keenly. Reassure them more than feels necessary, and be consistent about it. A quick “thinking of you” between visits settles a lot.',
      },
      avoidant: {
        short: 'Avoidant',
        label: 'Avoidant',
        relate:
          'Values independence and needs room. Don’t crowd them — give space and let them come back on their own. Pushing for closeness usually makes them retreat.',
      },
      disorganized: {
        short: 'Mixed',
        label: 'Mixed',
        relate:
          'Wants closeness but finds trust hard. Be patient and predictable — trust comes slowly. Steady, low-pressure presence does more than big gestures.',
      },
    },
  },
  notify: {
    reachOutTitle: 'Time to reach out to {name}',
    reachOutBody: "It's been a while — a quick hello goes a long way.",
    dateTitle: "{name}'s {label} is coming up",
    dateBody: 'A good moment to reach out.',
  },
  data: {
    imported: '{count} added',
    importDenied: 'Contacts access was declined.',
    importNone: 'No contacts found to add.',
  },
} as const;
