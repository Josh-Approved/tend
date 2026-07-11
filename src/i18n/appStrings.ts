/**
 * App-specific copy for Tend. APP-OWNED — every user-facing string in the domain
 * screens (and the local-reminder copy) lives here (canon § Translations);
 * reference it via t('home.…') / t('person.…') / t('notify.…') from ../i18n.
 */

export const APP_STRINGS = {
  nav: {
    today: 'Today',
    people: 'People',
    htc: 'HTC',
    me: 'Me',
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
    importing: 'Importing…',
  },
  person: {
    newPerson: 'New person',
    namePlaceholder: 'Their name',
    logSectionLabel: 'Log a catch-up',
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
    aboutSectionLabel: 'About them',
    cadenceRow: 'How often',
    notSet: 'Not set',
    noneYet: 'None yet',
    oneSaved: '1 saved',
    countSaved: '{count} saved',
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
  htc: {
    title: 'Have the Conversation',
    whatIsThis: 'What is this?',
    introTitle: 'Have the conversation',
    introBody1:
      'Closeness quietly stalls when something goes unspoken — a hurt you haven’t named, a disappointment you’ve swallowed, or something about yourself that’s hard to say.',
    introBody2:
      'When something is big enough to put distance between you, but hard enough that you hold it in, that’s the signal to have the conversation.',
    introBody3:
      'This space helps you name it, find the words, and walk in prepared — one honest conversation at a time.',
    introPrivacy: 'Whatever you write stays on your device.',
    introDismiss: 'Got it',
    toHave: 'To have',
    had: 'Had',
    empty:
      'No conversations yet. When something’s sitting between you and someone, name it here and plan how you’ll say it.',
    add: 'Start a conversation',
    personSection: 'Conversations to have',
    someone: 'someone',
    untitled: 'A conversation to have',
    newConversation: 'New conversation',
    whoLabel: 'Who is this with?',
    whoPlaceholder: 'Their name',
    pickPersonTitle: 'Who is this with?',
    someoneNew: 'Someone new',
    chooseExisting: 'Someone you’re tracking',
    linkExisting: 'Choose from your people',
    changePerson: 'Change',
    noPeopleYet: 'No one in your people list yet.',
    flavorLabel: 'What kind of conversation is this?',
    core: {
      topicLabel: 'What do you need to share or talk about?',
      topicPlaceholder: 'The thing that’s sitting between you…',
      storyLabel: 'The story I’m telling myself…',
      storyPlaceholder: 'What you’re making it mean — which may or may not be true.',
      impactLabel: 'How is this affecting you, or the relationship?',
      impactPlaceholder: 'The cost of leaving it unsaid…',
      hopeLabel: 'What do you hope comes from this conversation?',
      hopePlaceholder: 'Picture a good outcome…',
    },
    flavor: {
      open: 'Something to share',
      hurt: 'Something that hurt me',
      aboutMe: 'Hard to share about myself',
      boundary: 'A boundary I need',
      apology: 'An apology I owe',
      appreciation: 'Appreciation I’ve held back',
    },
    prompt: {
      iStatement: { label: 'Say it as an “I” statement', placeholder: 'When ___ happened, I felt ___' },
      vulnerable: { label: 'What feels vulnerable to share', placeholder: 'What’s hard to say is…' },
      need: { label: 'The boundary I need', placeholder: 'What I need going forward is…' },
      sorryFor: { label: 'I’m sorry for…', placeholder: 'Name specifically what you did.' },
      theHurt: {
        label: 'How I think it hurt you',
        placeholder: 'Name the impact on them — this is what makes an apology land.',
      },
      askForgiveness: { label: 'Ask for forgiveness', placeholder: 'e.g. “Will you forgive me?”' },
      holdingBack: { label: 'What I’ve been meaning to tell you', placeholder: 'I appreciate…' },
    },
    note: {
      apology:
        'A real apology has three parts: name what you did, name how it hurt them, and ask for forgiveness. That last step is the one most people skip — and it’s what opens the door to reconciliation.',
    },
    markHad: 'We had this conversation',
    hadOn: 'Had this conversation',
    reopen: 'Mark as still to have',
    reflectionLabel: 'How did it go?',
    reflectionPlaceholder: 'What happened, how it felt, what you learned…',
    deleteConversation: 'Delete this conversation',
    deleteConfirmTitle: 'Delete this conversation?',
    deleteConfirmBody: 'This removes everything you’ve written here. It can’t be undone.',
  },
  me: {
    title: 'Me',
    intro:
      'A manual about you — the things you’d want the people who love you to understand. Fill in what resonates; it’s yours to keep, and yours to share when you’re ready.',
    share: 'Share my manual',
    shareHeading: 'A bit about me',
    prompt: {
      communicate: { label: 'How I communicate', placeholder: 'Direct, or slow to open up? Better in writing or out loud?' },
      feedback: { label: 'How I like feedback', placeholder: 'Gently, or straight up? Do I need time to sit with it?' },
      conflict: { label: 'How I am in conflict', placeholder: 'Do I need space first, or to talk it through right away?' },
      feelCared: { label: 'How I feel cared for', placeholder: 'What actually lands as love for me…' },
      showCare: { label: 'How I show I care', placeholder: 'The way care comes out of me — so it’s not misread…' },
      fillsMeUp: { label: 'What fills me up', placeholder: 'The people, places, and things that recharge me…' },
      drains: { label: 'What wears me down', placeholder: 'What drains me, my pet peeves…' },
      growth: { label: 'What I’m working on', placeholder: 'A growth edge I’d want someone close to me to know…' },
      support: { label: 'How to support me when I’m low', placeholder: 'When I’m struggling, what actually helps…' },
      values: { label: 'What matters most to me', placeholder: 'The values I try to live by…' },
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
    importLimited: '{count} added from the contacts you shared.',
    importError: 'Couldn’t read your contacts. Please try again.',
  },
} as const;
