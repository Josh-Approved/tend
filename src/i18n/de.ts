/**
 * German (de) domain translations. Overlays SHELL_LOCALES.de in locales.ts.
 * Mirrors appStrings.ts; {placeholders} kept verbatim; "Josh Approved" never translates.
 */
const de = {
  nav: {
    today: 'Heute',
    people: 'Menschen',
    htc: 'HTC',
    me: 'Ich',
  },
  today: {
    title: 'Heute',
    reachOut: 'Melde dich',
    caughtUp: 'Du bist auf dem neuesten Stand.',
    caughtUpSub: 'Gerade braucht niemand einen Anstoß.',
  },
  home: {
    title: 'Menschen',
    empty: 'Noch niemand hier. Füge jemanden hinzu, mit dem du in Kontakt bleiben möchtest – oder hol Menschen aus deinen Kontakten dazu.',
    add: 'Person hinzufügen',
    importContacts: 'Aus Kontakten importieren',
    overdueBy: 'Überfällig seit {days} T.',
    dueToday: 'Heute melden',
    dueInDays: 'Fällig in {days} T.',
    okInDays: 'Nächster Kontakt in {days} T.',
    noReminder: 'Keine Erinnerung gesetzt',
    markReached: 'Bei {name} gemeldet markieren',
    comingUp: 'Steht bevor',
    comingUpToday: '{name}: {label} · heute',
    comingUpDays: '{name}: {label} · in {days} T.',
    searchPlaceholder: 'Menschen suchen',
    searchNoResults: 'Niemand passt zu „{query}“.',
    importing: 'Wird importiert…',
  },
  person: {
    newPerson: 'Neue Person',
    namePlaceholder: 'Ihr Name',
    logSectionLabel: 'Kontakt festhalten',
    reachedOut: 'Ich habe mich gemeldet',
    logKindCall: 'Anruf',
    logKindText: 'Nachricht',
    logKindInPerson: 'Persönlich',
    logKindOther: 'Sonstiges',
    logNotePlaceholder: 'Worüber habt ihr gesprochen? (optional)',
    lastReachedToday: 'Heute gemeldet',
    lastReachedDays: 'Zuletzt vor {days} T. gemeldet',
    lastReachedNever: 'Du hast noch keinen Kontakt festgehalten',
    historyLabel: 'Letzte Kontakte',
    cadenceLabel: 'Wie oft möchtest du dich melden?',
    cadenceNone: 'Keine Erinnerung',
    cadenceWeekly: 'Wöchentlich',
    cadenceBiweekly: 'Alle 2 Wochen',
    cadenceMonthly: 'Monatlich',
    cadenceQuarterly: 'Alle 3 Monate',
    howWeMetLabel: 'Wie ihr euch kennengelernt habt',
    howWeMetPlaceholder: 'Wo es anfing, woher ihr euch kennt…',
    notesLabel: 'Notizen',
    notesPlaceholder: 'Was möchtest du dir merken? Ihre Vorlieben, was gerade los ist, wonach du nächstes Mal fragen kannst…',
    datesLabel: 'Wichtige Tage',
    dateLabelPlaceholder: 'Geburtstag, Jahrestag…',
    monthPlaceholder: 'MM',
    dayPlaceholder: 'TT',
    addDate: 'Tag hinzufügen',
    inDays: 'in {days} T.',
    dateToday: 'heute',
    prefsLabel: 'Mag, mag nicht & Geschenkideen',
    like: 'Mag',
    dislike: 'Mag nicht',
    gift: 'Geschenkideen',
    prefPlaceholder: 'Etwas zum Merken hinzufügen',
    addPref: 'Hinzufügen',
    remove: 'Entfernen',
    deletePerson: 'Diese Person entfernen',
    deleteConfirmTitle: '{name} entfernen?',
    deleteConfirmBody: 'Das löscht alles, was du über sie gespeichert hast. Es lässt sich nicht rückgängig machen.',
    cancel: 'Abbrechen',
    confirmRemove: 'Entfernen',
    untitled: 'diese Person',
    personalityLabel: 'Persönlichkeit',
    personalityHint: 'Optional. Wenn du sie kennst, schlägt die App behutsame Wege vor, da zu sein – Anhaltspunkte, keine Schubladen.',
  },
  personality: {
    framework: {
      enneagram: 'Enneagramm-Typ',
      attachment: 'Bindungsstil',
    },
    enneagram: {
      '1': {
        short: '1',
        label: 'Typ 1 · Die Perfektionistin',
        relate:
          'Prinzipientreu und will, dass Dinge richtig gemacht werden. Würdige ihre hohen Ansprüche ausdrücklich und nimm Korrekturen nicht persönlich – das ist Fürsorge, keine Kritik. Erinnere sie daran, dass gut genug oft genug ist.',
      },
      '2': {
        short: '2',
        label: 'Typ 2 · Die Helferin',
        relate:
          'Warmherzig und feinfühlig für das, was alle anderen brauchen. Frag ausnahmsweise, was sie selbst braucht – sie sagt es selten. Bemerke die Fürsorge, die sie schenkt, und sprich sie an; sie kann sich verausgaben, bis sie leer ist.',
      },
      '3': {
        short: '3',
        label: 'Typ 3 · Die Macherin',
        relate:
          'Zielstrebig und auf Erfolg ausgerichtet. Feiere die Mühe, nicht nur den Erfolg. Erinnere sie daran, dass du sie für das schätzt, wer sie ist, nicht nur für das, was sie erreicht.',
      },
      '4': {
        short: '4',
        label: 'Typ 4 · Die Individualistin',
        relate:
          'Tief fühlend und authentisch. Begegne ihren Gefühlen, ohne sie schnell lösen zu wollen – sie möchte wirklich gesehen werden, nicht aufgemuntert.',
      },
      '5': {
        short: '5',
        label: 'Typ 5 · Die Beobachterin',
        relate:
          'Nachdenklich und zurückhaltend. Gib ihr Raum und kündige große Bitten vorher an. Zeit für sich zum Auftanken ist keine Distanz zu dir.',
      },
      '6': {
        short: '6',
        label: 'Typ 6 · Die loyale Skeptikerin',
        relate:
          'Loyal und vorausschauend, was schiefgehen könnte. Sei beständig und verlässlich – Berechenbarkeit baut ihr Vertrauen auf. Nimm ihre Sorgen ernst, statt sie abzutun.',
      },
      '7': {
        short: '7',
        label: 'Typ 7 · Die Begeisterte',
        relate:
          'Optimistisch und voller Möglichkeiten. Bezieh sie in Pläne und Abenteuer ein. Bleib behutsam bei ihr durch die schweren Gefühle, die sie lieber überspringen würde.',
      },
      '8': {
        short: '8',
        label: 'Typ 8 · Die Beschützerin',
        relate:
          'Direkt und willensstark. Sei ehrlich zu ihr – sie schätzt Offenheit mehr als vorsichtiges Drumherumreden. Unter der Stärke wacht jemand über ein weiches Herz.',
      },
      '9': {
        short: '9',
        label: 'Typ 9 · Die Friedensstifterin',
        relate:
          'Gelassen und auf Harmonie bedacht. Frag nach ihrer Meinung und warte darauf – sie stellt eigene Wünsche zurück. Halte Konflikte ruhig; Druck lässt sie sich zurückziehen.',
      },
    },
    attachment: {
      secure: {
        short: 'Sicher',
        label: 'Sicher',
        relate:
          'Fühlt sich mit Nähe wie mit Freiraum wohl. Mach weiter wie bisher – Ehrlichkeit, Verlässlichkeit und Wärme kommen gut an. Sie sind ein beständiger Anker für andere.',
      },
      anxious: {
        short: 'Ängstlich',
        label: 'Ängstlich',
        relate:
          'Sehnt sich nach Nähe und spürt Distanz deutlich. Beruhige sie öfter, als nötig scheint, und sei darin verlässlich. Ein kurzes „Ich denk an dich“ zwischendurch beruhigt vieles.',
      },
      avoidant: {
        short: 'Vermeidend',
        label: 'Vermeidend',
        relate:
          'Schätzt Unabhängigkeit und braucht Raum. Bedräng sie nicht – gib Freiraum und lass sie von selbst zurückkommen. Auf Nähe zu drängen lässt sie meist zurückweichen.',
      },
      disorganized: {
        short: 'Gemischt',
        label: 'Gemischt',
        relate:
          'Möchte Nähe, tut sich aber schwer mit Vertrauen. Sei geduldig und berechenbar – Vertrauen kommt langsam. Beständige, druckfreie Präsenz wirkt mehr als große Gesten.',
      },
    },
  },
  htc: {
    title: 'Das Gespräch führen',
    whatIsThis: 'Was ist das?',
    introTitle: 'Das Gespräch führen',
    introBody1:
      'Nähe gerät leise ins Stocken, wenn etwas unausgesprochen bleibt – eine Verletzung, die du nicht benannt hast, eine Enttäuschung, die du geschluckt hast, oder etwas über dich selbst, das schwer zu sagen ist.',
    introBody2:
      'Wenn etwas groß genug ist, um Distanz zwischen euch zu schaffen, aber schwer genug, dass du es für dich behältst, ist das das Zeichen, das Gespräch zu führen.',
    introBody3:
      'Dieser Raum hilft dir, es zu benennen, die Worte zu finden und vorbereitet hineinzugehen – ein ehrliches Gespräch nach dem anderen.',
    introPrivacy: 'Was du schreibst, bleibt auf deinem Gerät.',
    introDismiss: 'Verstanden',
    toHave: 'Zu führen',
    had: 'Geführt',
    empty:
      'Noch keine Gespräche. Wenn etwas zwischen dir und jemandem steht, benenne es hier und plane, wie du es sagst.',
    add: 'Ein Gespräch beginnen',
    personSection: 'Zu führende Gespräche',
    someone: 'jemand',
    untitled: 'Ein zu führendes Gespräch',
    newConversation: 'Neues Gespräch',
    whoLabel: 'Mit wem ist das?',
    whoPlaceholder: 'Ihr Name',
    pickPersonTitle: 'Mit wem ist das?',
    someoneNew: 'Jemand Neues',
    chooseExisting: 'Jemand, den du begleitest',
    linkExisting: 'Aus deinen Menschen wählen',
    changePerson: 'Ändern',
    noPeopleYet: 'Noch niemand in deiner Liste.',
    flavorLabel: 'Was für ein Gespräch ist das?',
    core: {
      topicLabel: 'Was musst du teilen oder ansprechen?',
      topicPlaceholder: 'Die Sache, die zwischen euch steht…',
      storyLabel: 'Die Geschichte, die ich mir erzähle…',
      storyPlaceholder: 'Was du daraus machst – was stimmen kann oder auch nicht.',
      impactLabel: 'Wie wirkt sich das auf dich oder die Beziehung aus?',
      impactPlaceholder: 'Was es kostet, es ungesagt zu lassen…',
      hopeLabel: 'Was erhoffst du dir von diesem Gespräch?',
      hopePlaceholder: 'Stell dir ein gutes Ergebnis vor…',
    },
    flavor: {
      open: 'Etwas zum Teilen',
      hurt: 'Etwas, das mich verletzt hat',
      aboutMe: 'Schwer über mich selbst zu sagen',
      boundary: 'Eine Grenze, die ich brauche',
      apology: 'Eine Entschuldigung, die ich schuldig bin',
      appreciation: 'Wertschätzung, die ich zurückgehalten habe',
    },
    prompt: {
      iStatement: { label: 'Sag es als „Ich“-Botschaft', placeholder: 'Als ___ geschah, fühlte ich mich ___' },
      vulnerable: { label: 'Was sich verletzlich anfühlt zu teilen', placeholder: 'Schwer zu sagen ist…' },
      need: { label: 'Die Grenze, die ich brauche', placeholder: 'Was ich von nun an brauche, ist…' },
      sorryFor: { label: 'Es tut mir leid für…', placeholder: 'Benenne genau, was du getan hast.' },
      theHurt: {
        label: 'Wie es dich meiner Meinung nach verletzt hat',
        placeholder: 'Benenne die Auswirkung auf sie – das ist es, was eine Entschuldigung ankommen lässt.',
      },
      askForgiveness: { label: 'Um Verzeihung bitten', placeholder: 'z. B. „Kannst du mir verzeihen?“' },
      holdingBack: { label: 'Was ich dir schon lange sagen wollte', placeholder: 'Ich schätze…' },
    },
    note: {
      apology:
        'Eine echte Entschuldigung hat drei Teile: benenne, was du getan hast, benenne, wie es sie verletzt hat, und bitte um Verzeihung. Diesen letzten Schritt überspringen die meisten – und genau er öffnet die Tür zur Versöhnung.',
    },
    markHad: 'Wir haben dieses Gespräch geführt',
    hadOn: 'Dieses Gespräch geführt',
    reopen: 'Als noch zu führen markieren',
    reflectionLabel: 'Wie ist es gelaufen?',
    reflectionPlaceholder: 'Was passiert ist, wie es sich anfühlte, was du gelernt hast…',
    deleteConversation: 'Dieses Gespräch löschen',
    deleteConfirmTitle: 'Dieses Gespräch löschen?',
    deleteConfirmBody: 'Das entfernt alles, was du hier geschrieben hast. Es lässt sich nicht rückgängig machen.',
  },
  me: {
    title: 'Ich',
    intro:
      'Eine Anleitung über dich – die Dinge, die die Menschen, die dich lieben, verstehen sollten. Füll aus, was sich stimmig anfühlt; es gehört dir, und du teilst es, wenn du bereit bist.',
    share: 'Meine Anleitung teilen',
    shareHeading: 'Ein bisschen über mich',
    prompt: {
      communicate: { label: 'Wie ich kommuniziere', placeholder: 'Direkt, oder taue ich langsam auf? Besser schriftlich oder laut?' },
      feedback: { label: 'Wie ich Rückmeldung mag', placeholder: 'Behutsam oder geradeheraus? Brauche ich Zeit, um es sacken zu lassen?' },
      conflict: { label: 'Wie ich im Konflikt bin', placeholder: 'Brauche ich erst Raum, oder rede ich es lieber gleich aus?' },
      feelCared: { label: 'Wie ich mich umsorgt fühle', placeholder: 'Was bei mir wirklich als Liebe ankommt…' },
      showCare: { label: 'Wie ich zeige, dass ich mich sorge', placeholder: 'Wie Fürsorge aus mir herauskommt – damit sie nicht missverstanden wird…' },
      fillsMeUp: { label: 'Was mich auffüllt', placeholder: 'Die Menschen, Orte und Dinge, die mich auftanken…' },
      drains: { label: 'Was mich zermürbt', placeholder: 'Was mich auslaugt, meine Reizthemen…' },
      growth: { label: 'Woran ich arbeite', placeholder: 'Ein Wachstumsfeld, von dem ein Mensch, der mir nahesteht, wissen sollte…' },
      support: { label: 'Wie du mich stützt, wenn es mir schlecht geht', placeholder: 'Wenn ich kämpfe, was wirklich hilft…' },
      values: { label: 'Was mir am wichtigsten ist', placeholder: 'Die Werte, nach denen ich zu leben versuche…' },
    },
  },
  notify: {
    reachOutTitle: 'Zeit, dich bei {name} zu melden',
    reachOutBody: 'Es ist eine Weile her – ein kurzes Hallo bewirkt viel.',
    dateTitle: '{name}: {label} steht bevor',
    dateBody: 'Ein guter Moment, sich zu melden.',
  },
  data: {
    imported: '{count} hinzugefügt',
    importDenied: 'Der Zugriff auf die Kontakte wurde abgelehnt.',
    importNone: 'Keine Kontakte zum Hinzufügen gefunden.',
    importLimited: '{count} aus den geteilten Kontakten hinzugefügt.',
    importError: 'Deine Kontakte konnten nicht gelesen werden. Bitte versuch es erneut.',
  },
};
export default de;
