/**
 * Italian (it) domain translations. Overlays SHELL_LOCALES.it in locales.ts.
 * Mirrors appStrings.ts; {placeholders} kept verbatim; "Josh Approved" never translates.
 */
const it = {
  nav: {
    today: 'Oggi',
    people: 'Persone',
    htc: 'HTC',
    me: 'Io',
  },
  today: {
    title: 'Oggi',
    reachOut: 'Fatti sentire',
    caughtUp: 'Sei in pari con tutti.',
    caughtUpSub: 'Per ora nessuno ha bisogno di un pensiero.',
  },
  home: {
    title: 'Persone',
    empty: 'Ancora nessuno qui. Aggiungi qualcuno con cui vuoi restare in contatto — oppure portali dentro dai tuoi contatti.',
    add: 'Aggiungi persona',
    importContacts: 'Importa dai contatti',
    overdueBy: 'In ritardo di {days}g',
    dueToday: 'Fatti sentire oggi',
    dueInDays: 'Tra {days}g',
    okInDays: 'Prossimo contatto tra {days}g',
    noReminder: 'Nessun promemoria impostato',
    markReached: 'Segna che ti sei fatto sentire con {name}',
    comingUp: 'In arrivo',
    comingUpToday: '{label} di {name} · oggi',
    comingUpDays: '{label} di {name} · tra {days}g',
    searchPlaceholder: 'Cerca persone',
    searchNoResults: 'Nessuno corrisponde a “{query}”.',
    importing: 'Importazione…',
  },
  person: {
    newPerson: 'Nuova persona',
    namePlaceholder: 'Il suo nome',
    logSectionLabel: 'Registra un contatto',
    reachedOut: 'Mi sono fatto sentire',
    logKindCall: 'Chiamata',
    logKindText: 'Messaggio',
    logKindInPerson: 'Di persona',
    logKindOther: 'Altro',
    logNotePlaceholder: 'Di cosa avete parlato? (facoltativo)',
    lastReachedToday: 'Ti sei fatto sentire oggi',
    lastReachedDays: 'Ti sei fatto sentire {days}g fa',
    lastReachedNever: 'Non hai ancora registrato un contatto',
    historyLabel: 'Contatti recenti',
    cadenceLabel: 'Ogni quanto vuoi farti sentire?',
    cadenceNone: 'Nessun promemoria',
    cadenceWeekly: 'Ogni settimana',
    cadenceBiweekly: 'Ogni 2 settimane',
    cadenceMonthly: 'Ogni mese',
    cadenceQuarterly: 'Ogni 3 mesi',
    howWeMetLabel: 'Come vi siete conosciuti',
    howWeMetPlaceholder: 'Dove è iniziato tutto, come vi conoscete…',
    notesLabel: 'Note',
    notesPlaceholder: 'Cosa vuoi ricordare? I suoi gusti, cosa sta vivendo, cosa chiedere la prossima volta…',
    datesLabel: 'Date importanti',
    dateLabelPlaceholder: 'Compleanno, anniversario…',
    monthPlaceholder: 'MM',
    dayPlaceholder: 'GG',
    addDate: 'Aggiungi data',
    inDays: 'tra {days}g',
    dateToday: 'oggi',
    prefsLabel: 'Cosa piace, cosa no e idee regalo',
    like: 'Cosa piace',
    dislike: 'Cosa non piace',
    gift: 'Idee regalo',
    prefPlaceholder: 'Aggiungi qualcosa da ricordare',
    addPref: 'Aggiungi',
    remove: 'Rimuovi',
    deletePerson: 'Rimuovi questa persona',
    deleteConfirmTitle: 'Rimuovere {name}?',
    deleteConfirmBody: 'Questo cancella tutto ciò che hai salvato su di loro. Non si può annullare.',
    cancel: 'Annulla',
    confirmRemove: 'Rimuovi',
    untitled: 'questa persona',
    personalityLabel: 'Personalità',
    personalityHint: 'Facoltativo. Se la conosci, l’app suggerisce modi gentili per esserci — punti di partenza, non etichette.',
  },
  personality: {
    framework: {
      enneagram: 'Tipo dell’Enneagramma',
      attachment: 'Stile di attaccamento',
    },
    enneagram: {
      '1': {
        short: '1',
        label: 'Tipo 1 · Il Perfezionista',
        relate:
          'Ha principi e vuole che le cose siano fatte bene. Apprezza ad alta voce i suoi standard elevati e non prendere le correzioni sul personale — è premura, non critica. Ricordagli che il “abbastanza bene” spesso basta.',
      },
      '2': {
        short: '2',
        label: 'Tipo 2 · L’Altruista',
        relate:
          'Caloroso e attento a ciò di cui hanno bisogno gli altri. Per una volta chiedigli di cosa ha bisogno lui — raramente lo dice. Nota la cura che dona e dilla a voce; può svuotarsi finché non resta nulla.',
      },
      '3': {
        short: '3',
        label: 'Tipo 3 · Il Realizzatore',
        relate:
          'Determinato e orientato agli obiettivi. Festeggia l’impegno, non solo il risultato. Ricordagli che ci tieni a chi è, non solo a ciò che ottiene.',
      },
      '4': {
        short: '4',
        label: 'Tipo 4 · L’Individualista',
        relate:
          'Sente in profondità ed è autentico. Accogli le sue emozioni senza correre a risolverle — vuole essere visto davvero, non tirato su di morale.',
      },
      '5': {
        short: '5',
        label: 'Tipo 5 · L’Osservatore',
        relate:
          'Riflessivo e riservato. Dagli spazio e un preavviso prima delle richieste grandi. Il tempo da solo per ricaricarsi non è distanza da te.',
      },
      '6': {
        short: '6',
        label: 'Tipo 6 · Il Lealista',
        relate:
          'Leale e attento a ciò che potrebbe andare storto. Sii saldo e coerente — la prevedibilità costruisce la sua fiducia. Prendi sul serio le sue preoccupazioni invece di liquidarle.',
      },
      '7': {
        short: '7',
        label: 'Tipo 7 · L’Entusiasta',
        relate:
          'Allegro e pieno di possibilità. Coinvolgilo nei piani e nelle avventure. Con delicatezza, restagli accanto nelle emozioni difficili che preferirebbe saltare.',
      },
      '8': {
        short: '8',
        label: 'Tipo 8 · Il Protettore',
        relate:
          'Diretto e con un carattere forte. Sii schietto con lui — rispetta l’onestà più dei giri di parole. Sotto la forza c’è qualcuno che protegge un cuore tenero.',
      },
      '9': {
        short: '9',
        label: 'Tipo 9 · Il Pacificatore',
        relate:
          'Accomodante e in cerca di armonia. Chiedi la sua opinione e aspettala — minimizza ciò che desidera. Mantieni i conflitti calmi; la pressione lo fa ritirare.',
      },
    },
    attachment: {
      secure: {
        short: 'Sicuro',
        label: 'Sicuro',
        relate:
          'A suo agio sia con la vicinanza sia con lo spazio. Continua così — onestà, affidabilità e calore funzionano bene. È un’àncora stabile per gli altri.',
      },
      anxious: {
        short: 'Ansioso',
        label: 'Ansioso',
        relate:
          'Cerca vicinanza e sente molto la distanza. Rassicuralo più di quanto sembri necessario, e fallo con costanza. Un rapido “ti penso” tra un incontro e l’altro placa molto.',
      },
      avoidant: {
        short: 'Evitante',
        label: 'Evitante',
        relate:
          'Tiene all’indipendenza e ha bisogno di spazio. Non stargli addosso — dagli respiro e lascia che torni da sé. Insistere sulla vicinanza di solito lo fa allontanare.',
      },
      disorganized: {
        short: 'Misto',
        label: 'Misto',
        relate:
          'Desidera vicinanza ma fatica a fidarsi. Sii paziente e prevedibile — la fiducia arriva piano. Una presenza costante e senza pressioni vale più dei grandi gesti.',
      },
    },
  },
  htc: {
    title: 'Affronta la conversazione',
    whatIsThis: 'Cos’è questo?',
    introTitle: 'Affronta la conversazione',
    introBody1:
      'La vicinanza si blocca in silenzio quando qualcosa resta non detto — un dolore che non hai nominato, una delusione che hai mandato giù, o qualcosa di te che è difficile dire.',
    introBody2:
      'Quando una cosa è grande abbastanza da mettere distanza tra voi, ma difficile abbastanza da tenertela dentro, quello è il segnale per affrontare la conversazione.',
    introBody3:
      'Questo spazio ti aiuta a darle un nome, a trovare le parole e ad arrivare preparato — una conversazione onesta alla volta.',
    introPrivacy: 'Tutto ciò che scrivi resta sul tuo dispositivo.',
    introDismiss: 'Ho capito',
    toHave: 'Da affrontare',
    had: 'Affrontate',
    empty:
      'Ancora nessuna conversazione. Quando qualcosa pesa tra te e qualcuno, dagli un nome qui e pensa a come dirlo.',
    add: 'Inizia una conversazione',
    personSection: 'Conversazioni da affrontare',
    someone: 'qualcuno',
    untitled: 'Una conversazione da affrontare',
    newConversation: 'Nuova conversazione',
    whoLabel: 'Con chi è?',
    whoPlaceholder: 'Il suo nome',
    pickPersonTitle: 'Con chi è?',
    someoneNew: 'Qualcuno di nuovo',
    chooseExisting: 'Qualcuno che già segui',
    linkExisting: 'Scegli tra le tue persone',
    changePerson: 'Cambia',
    noPeopleYet: 'Ancora nessuno nella tua lista di persone.',
    flavorLabel: 'Che tipo di conversazione è?',
    core: {
      topicLabel: 'Cosa hai bisogno di condividere o di dire?',
      topicPlaceholder: 'La cosa che pesa tra voi…',
      storyLabel: 'La storia che mi sto raccontando…',
      storyPlaceholder: 'Il significato che le stai dando — che può essere vero o no.',
      impactLabel: 'Come incide su di te, o sul rapporto?',
      impactPlaceholder: 'Il prezzo di lasciarlo non detto…',
      hopeLabel: 'Cosa speri che nasca da questa conversazione?',
      hopePlaceholder: 'Immagina un buon esito…',
    },
    flavor: {
      open: 'Qualcosa da condividere',
      hurt: 'Qualcosa che mi ha ferito',
      aboutMe: 'Difficile da dire su di me',
      boundary: 'Un confine di cui ho bisogno',
      apology: 'Delle scuse che devo',
      appreciation: 'Un apprezzamento che ho trattenuto',
    },
    prompt: {
      iStatement: { label: 'Dillo in prima persona', placeholder: 'Quando è successo ___, mi sono sentito ___' },
      vulnerable: { label: 'Cosa mi mette a nudo condividere', placeholder: 'La cosa difficile da dire è…' },
      need: { label: 'Il confine di cui ho bisogno', placeholder: 'Quello di cui ho bisogno d’ora in poi è…' },
      sorryFor: { label: 'Mi dispiace per…', placeholder: 'Nomina con precisione cosa hai fatto.' },
      theHurt: {
        label: 'Come penso ti abbia ferito',
        placeholder: 'Nomina l’effetto su di loro — è questo che fa arrivare delle scuse.',
      },
      askForgiveness: { label: 'Chiedi perdono', placeholder: 'es. “Mi perdoni?”' },
      holdingBack: { label: 'Quello che volevo dirti', placeholder: 'Apprezzo…' },
    },
    note: {
      apology:
        'Delle scuse vere hanno tre parti: nomina cosa hai fatto, nomina come ha ferito l’altro e chiedi perdono. Quell’ultimo passo è quello che quasi tutti saltano — ed è ciò che apre la porta alla riconciliazione.',
    },
    markHad: 'Abbiamo affrontato questa conversazione',
    hadOn: 'Conversazione affrontata',
    reopen: 'Segna di nuovo come da affrontare',
    reflectionLabel: 'Com’è andata?',
    reflectionPlaceholder: 'Cos’è successo, come ti sei sentito, cosa hai imparato…',
    deleteConversation: 'Elimina questa conversazione',
    deleteConfirmTitle: 'Eliminare questa conversazione?',
    deleteConfirmBody: 'Questo rimuove tutto ciò che hai scritto qui. Non si può annullare.',
  },
  me: {
    title: 'Io',
    intro:
      'Un manuale su di te — le cose che vorresti facessero capire chi ti vuole bene. Compila ciò che senti tuo; è tuo da tenere, e tuo da condividere quando te la senti.',
    share: 'Condividi il mio manuale',
    shareHeading: 'Qualcosa su di me',
    prompt: {
      communicate: { label: 'Come comunico', placeholder: 'Diretto, o lento ad aprirmi? Meglio per iscritto o a voce?' },
      feedback: { label: 'Come mi piace ricevere riscontri', placeholder: 'Con delicatezza, o senza giri? Mi serve tempo per assorbirli?' },
      conflict: { label: 'Come sono nei conflitti', placeholder: 'Mi serve prima dello spazio, o parlarne subito?' },
      feelCared: { label: 'Come mi sento amato', placeholder: 'Ciò che davvero arriva come affetto per me…' },
      showCare: { label: 'Come mostro che ci tengo', placeholder: 'Il modo in cui mi esce la cura — così non viene fraintesa…' },
      fillsMeUp: { label: 'Cosa mi ricarica', placeholder: 'Le persone, i luoghi e le cose che mi rimettono in forze…' },
      drains: { label: 'Cosa mi svuota', placeholder: 'Cosa mi prosciuga, le cose che mi danno fastidio…' },
      growth: { label: 'Su cosa sto lavorando', placeholder: 'Un punto di crescita che vorrei sapesse chi mi è vicino…' },
      support: { label: 'Come sostenermi quando sono giù', placeholder: 'Quando faccio fatica, cosa aiuta davvero…' },
      values: { label: 'Cosa conta di più per me', placeholder: 'I valori per cui cerco di vivere…' },
    },
  },
  notify: {
    reachOutTitle: 'È ora di farti sentire con {name}',
    reachOutBody: 'È passato un po’ — un saluto veloce vale tanto.',
    dateTitle: '{label} di {name} è in arrivo',
    dateBody: 'Un buon momento per farti sentire.',
  },
  data: {
    imported: '{count} aggiunti',
    importDenied: 'Accesso ai contatti negato.',
    importNone: 'Nessun contatto da aggiungere.',
    importLimited: '{count} aggiunti dai contatti che hai condiviso.',
    importError: 'Non è stato possibile leggere i tuoi contatti. Riprova.',
  },
};
export default it;
