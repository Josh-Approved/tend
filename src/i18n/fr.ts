/**
 * French (fr) domain translations. Overlays SHELL_LOCALES.fr in locales.ts.
 * Mirrors appStrings.ts; {placeholders} kept verbatim; "Josh Approved" never translates.
 */
const fr = {
  nav: {
    today: "Aujourd'hui",
    people: 'Proches',
    htc: 'HTC',
    me: 'Moi',
  },
  today: {
    title: "Aujourd'hui",
    reachOut: 'Prendre des nouvelles',
    caughtUp: 'Tu es à jour.',
    caughtUpSub: "Personne n'a besoin d'un petit signe pour le moment.",
  },
  home: {
    title: 'Proches',
    empty: "Personne ici pour l'instant. Ajoute quelqu'un avec qui tu veux garder le lien — ou fais venir des gens depuis tes contacts.",
    add: 'Ajouter une personne',
    importContacts: 'Importer depuis les contacts',
    overdueBy: 'En retard de {days} j',
    dueToday: "Prendre des nouvelles aujourd'hui",
    dueInDays: 'À faire dans {days} j',
    okInDays: 'Prochain contact dans {days} j',
    noReminder: 'Aucun rappel défini',
    markReached: 'Marquer que tu as pris des nouvelles de {name}',
    comingUp: 'À venir',
    comingUpToday: "{label} de {name} · aujourd'hui",
    comingUpDays: '{label} de {name} · dans {days} j',
    searchPlaceholder: 'Rechercher une personne',
    searchNoResults: 'Personne ne correspond à « {query} ».',
    importing: 'Importation…',
  },
  person: {
    newPerson: 'Nouvelle personne',
    namePlaceholder: 'Son nom',
    logSectionLabel: 'Noter un moment partagé',
    reachedOut: "J'ai pris des nouvelles",
    logKindCall: 'Appel',
    logKindText: 'Message',
    logKindInPerson: 'En personne',
    logKindOther: 'Autre',
    logNotePlaceholder: 'De quoi avez-vous parlé ? (facultatif)',
    lastReachedToday: "Tu as pris des nouvelles aujourd'hui",
    lastReachedDays: 'Dernier contact il y a {days} j',
    lastReachedNever: "Tu n'as encore noté aucun contact",
    historyLabel: 'Moments récents',
    cadenceLabel: 'À quelle fréquence veux-tu prendre des nouvelles ?',
    cadenceNone: 'Aucun rappel',
    cadenceWeekly: 'Chaque semaine',
    cadenceBiweekly: 'Toutes les 2 semaines',
    cadenceMonthly: 'Chaque mois',
    cadenceQuarterly: 'Tous les 3 mois',
    howWeMetLabel: 'Comment vous vous êtes rencontrés',
    howWeMetPlaceholder: 'Où ça a commencé, comment vous vous connaissez…',
    notesLabel: 'Notes',
    notesPlaceholder: "Que veux-tu retenir ? Ses préférences, ce qui se passe pour elle, ce qu'il faudra lui demander la prochaine fois…",
    datesLabel: 'Dates importantes',
    dateLabelPlaceholder: 'Anniversaire, date marquante…',
    monthPlaceholder: 'MM',
    dayPlaceholder: 'JJ',
    addDate: 'Ajouter une date',
    inDays: 'dans {days} j',
    dateToday: "aujourd'hui",
    prefsLabel: "Goûts, aversions et idées cadeaux",
    like: 'Aime',
    dislike: "N'aime pas",
    gift: 'Idées cadeaux',
    prefPlaceholder: 'Ajoute quelque chose à retenir',
    addPref: 'Ajouter',
    remove: 'Retirer',
    deletePerson: 'Retirer cette personne',
    deleteConfirmTitle: 'Retirer {name} ?',
    deleteConfirmBody: "Cela supprime tout ce que tu as enregistré à son sujet. C'est irréversible.",
    cancel: 'Annuler',
    confirmRemove: 'Retirer',
    untitled: 'cette personne',
    aboutSectionLabel: 'À son sujet',
    cadenceRow: 'À quelle fréquence',
    notSet: 'Non défini',
    noneYet: 'Rien pour l’instant',
    oneSaved: '1 enregistré',
    countSaved: '{count} enregistrés',
    personalityLabel: 'Personnalité',
    personalityHint: "Facultatif. Si tu la connais, l'app suggère des façons douces d'être présent — des points de départ, pas des cases.",
  },
  personality: {
    framework: {
      enneagram: 'Type ennéagramme',
      attachment: "Style d'attachement",
    },
    enneagram: {
      '1': {
        short: '1',
        label: "Type 1 · Le perfectionniste",
        relate:
          "Intègre, et tient à ce que les choses soient bien faites. Souligne ses exigences élevées à voix haute, et ne prends pas les corrections pour toi — c'est de l'attention, pas de la critique. Rappelle-lui que « assez bien » suffit souvent.",
      },
      '2': {
        short: '2',
        label: "Type 2 · L'altruiste",
        relate:
          "Chaleureux et attentif aux besoins de tous. Demande-lui ce dont il a besoin pour une fois — il le dit rarement. Remarque l'attention qu'il donne et nomme-la ; il peut se vider jusqu'au bout.",
      },
      '3': {
        short: '3',
        label: "Type 3 · Le battant",
        relate:
          "Motivé et tourné vers ses objectifs. Célèbre l'effort, pas seulement la victoire. Rappelle-lui que tu tiens à qui il est, et pas seulement à ce qu'il accomplit.",
      },
      '4': {
        short: '4',
        label: "Type 4 · L'individualiste",
        relate:
          "Sensible en profondeur et authentique. Accueille ses émotions sans te précipiter pour les réparer — il veut être vraiment vu, pas réconforté à la hâte.",
      },
      '5': {
        short: '5',
        label: "Type 5 · L'observateur",
        relate:
          "Réfléchi et discret. Laisse-lui de l'espace et préviens-le avant les grandes demandes. Le temps seul pour se ressourcer n'est pas une mise à distance de toi.",
      },
      '6': {
        short: '6',
        label: 'Type 6 · Le loyal sceptique',
        relate:
          "Loyal, et prévoit ce qui pourrait mal tourner. Sois stable et constant — la régularité bâtit sa confiance. Prends ses inquiétudes au sérieux plutôt que de les balayer.",
      },
      '7': {
        short: '7',
        label: "Type 7 · L'enthousiaste",
        relate:
          "Joyeux et plein de possibles. Embarque-le dans tes projets et tes aventures. Reste doucement avec lui dans les émotions difficiles qu'il préférerait éviter.",
      },
      '8': {
        short: '8',
        label: 'Type 8 · Le protecteur',
        relate:
          "Direct et déterminé. Sois franc avec lui — il respecte l'honnêteté plus que les précautions. Sous la force se cache quelqu'un qui protège un cœur tendre.",
      },
      '9': {
        short: '9',
        label: 'Type 9 · Le pacificateur',
        relate:
          "Facile à vivre et en quête d'harmonie. Demande-lui son avis et attends-le — il minimise ses propres envies. Garde le conflit calme ; la pression le fait se replier.",
      },
    },
    attachment: {
      secure: {
        short: 'Sécure',
        label: 'Sécure',
        relate:
          "À l'aise avec la proximité comme avec l'espace. Continue ce que tu fais — l'honnêteté, la fiabilité et la chaleur portent leurs fruits. Il offre un ancrage stable aux autres.",
      },
      anxious: {
        short: 'Anxieux',
        label: 'Anxieux',
        relate:
          "A soif de proximité et ressent vivement la distance. Rassure-le plus que ça ne te semble nécessaire, et fais-le avec constance. Un petit « je pense à toi » entre deux visites apaise beaucoup.",
      },
      avoidant: {
        short: 'Évitant',
        label: 'Évitant',
        relate:
          "Tient à son indépendance et a besoin d'air. Ne l'envahis pas — laisse-lui de l'espace et laisse-le revenir de lui-même. Insister sur la proximité le fait généralement reculer.",
      },
      disorganized: {
        short: 'Mixte',
        label: 'Mixte',
        relate:
          "Veut la proximité mais a du mal à faire confiance. Sois patient et prévisible — la confiance vient lentement. Une présence stable et sans pression fait plus que les grands gestes.",
      },
    },
  },
  htc: {
    title: 'Avoir la conversation',
    whatIsThis: "C'est quoi ?",
    introTitle: 'Avoir la conversation',
    introBody1:
      "La proximité s'enraye en silence quand quelque chose reste tu — une blessure que tu n'as pas nommée, une déception que tu as ravalée, ou quelque chose sur toi qui est difficile à dire.",
    introBody2:
      "Quand quelque chose est assez grand pour creuser une distance entre vous, mais assez difficile pour que tu le gardes en toi, c'est le signal d'avoir la conversation.",
    introBody3:
      'Cet espace t\'aide à le nommer, à trouver les mots, et à y aller préparé — une conversation honnête à la fois.',
    introPrivacy: "Tout ce que tu écris reste sur ton appareil.",
    introDismiss: 'Compris',
    toHave: 'À avoir',
    had: 'Eues',
    empty:
      "Aucune conversation pour l'instant. Quand quelque chose reste en suspens entre toi et quelqu'un, nomme-le ici et prévois comment tu vas le dire.",
    add: 'Lancer une conversation',
    personSection: 'Conversations à avoir',
    someone: 'quelqu’un',
    untitled: 'Une conversation à avoir',
    newConversation: 'Nouvelle conversation',
    whoLabel: "Avec qui est-ce ?",
    whoPlaceholder: 'Son nom',
    pickPersonTitle: "Avec qui est-ce ?",
    someoneNew: 'Quelqu’un de nouveau',
    chooseExisting: 'Quelqu’un que tu suis',
    linkExisting: 'Choisir parmi tes proches',
    changePerson: 'Changer',
    noPeopleYet: "Personne dans ta liste de proches pour l'instant.",
    flavorLabel: "Quel genre de conversation est-ce ?",
    core: {
      topicLabel: 'Que dois-tu partager ou aborder ?',
      topicPlaceholder: 'Ce qui reste en suspens entre vous…',
      storyLabel: 'L’histoire que je me raconte…',
      storyPlaceholder: 'Le sens que tu lui donnes — qui peut être vrai ou non.',
      impactLabel: "En quoi cela t'affecte, toi ou la relation ?",
      impactPlaceholder: 'Le prix de le laisser non dit…',
      hopeLabel: 'Qu’espères-tu de cette conversation ?',
      hopePlaceholder: 'Imagine une issue heureuse…',
    },
    flavor: {
      open: 'Quelque chose à partager',
      hurt: "Quelque chose qui m'a blessé",
      aboutMe: 'Difficile à dire sur moi',
      boundary: "Une limite dont j'ai besoin",
      apology: 'Des excuses que je dois',
      appreciation: 'De la gratitude que j’ai retenue',
    },
    prompt: {
      iStatement: { label: 'Dis-le à la première personne', placeholder: "Quand ___ est arrivé, je me suis senti ___" },
      vulnerable: { label: 'Ce qui me rend vulnérable à partager', placeholder: 'Ce qui est difficile à dire, c’est…' },
      need: { label: "La limite dont j'ai besoin", placeholder: "Ce dont j'ai besoin pour la suite, c’est…" },
      sorryFor: { label: 'Je suis désolé pour…', placeholder: 'Nomme précisément ce que tu as fait.' },
      theHurt: {
        label: "Comment je pense que ça t'a blessé",
        placeholder: "Nomme l'impact sur l'autre — c'est ce qui fait que des excuses portent.",
      },
      askForgiveness: { label: 'Demander pardon', placeholder: 'p. ex. « Est-ce que tu me pardonnes ? »' },
      holdingBack: { label: 'Ce que je voulais te dire', placeholder: "J'apprécie…" },
    },
    note: {
      apology:
        "De vraies excuses ont trois parties : nommer ce que tu as fait, nommer en quoi ça a blessé l'autre, et demander pardon. Cette dernière étape est celle que la plupart des gens sautent — et c'est elle qui ouvre la porte à la réconciliation.",
    },
    markHad: 'Nous avons eu cette conversation',
    hadOn: 'Conversation eue',
    reopen: 'Remettre dans les conversations à avoir',
    reflectionLabel: 'Comment ça s’est passé ?',
    reflectionPlaceholder: "Ce qui s'est passé, comment tu l'as ressenti, ce que tu en retiens…",
    deleteConversation: 'Supprimer cette conversation',
    deleteConfirmTitle: 'Supprimer cette conversation ?',
    deleteConfirmBody: "Cela retire tout ce que tu as écrit ici. C'est irréversible.",
  },
  me: {
    title: 'Moi',
    intro:
      "Un mode d'emploi sur toi — ce que tu aimerais que les gens qui t'aiment comprennent. Remplis ce qui te parle ; c'est à toi de le garder, et à toi de le partager quand tu te sens prêt.",
    share: 'Partager mon mode d’emploi',
    shareHeading: 'Un peu sur moi',
    prompt: {
      communicate: { label: 'Comment je communique', placeholder: "Direct, ou lent à m'ouvrir ? Mieux à l'écrit ou à l'oral ?" },
      feedback: { label: 'Comment j’aime recevoir un retour', placeholder: "En douceur, ou franchement ? Ai-je besoin de temps pour le digérer ?" },
      conflict: { label: 'Comment je suis dans le conflit', placeholder: "Ai-je besoin d'espace d'abord, ou d'en parler tout de suite ?" },
      feelCared: { label: 'Comment je me sens aimé', placeholder: 'Ce qui me touche vraiment comme de l’amour…' },
      showCare: { label: 'Comment je montre que je tiens à toi', placeholder: "La façon dont l'attention sort de moi — pour qu'elle ne soit pas mal comprise…" },
      fillsMeUp: { label: 'Ce qui me remplit', placeholder: 'Les gens, les lieux et les choses qui me rechargent…' },
      drains: { label: 'Ce qui m’épuise', placeholder: 'Ce qui me vide, ce qui m’agace…' },
      growth: { label: 'Ce sur quoi je travaille', placeholder: "Un point de progression que j'aimerais qu'un proche connaisse…" },
      support: { label: 'Comment me soutenir quand je vais mal', placeholder: "Quand je traverse une période difficile, ce qui aide vraiment…" },
      values: { label: 'Ce qui compte le plus pour moi', placeholder: 'Les valeurs que j’essaie de vivre…' },
    },
  },
  notify: {
    reachOutTitle: 'Il est temps de prendre des nouvelles de {name}',
    reachOutBody: "Ça fait un moment — un petit bonjour fait beaucoup de bien.",
    dateTitle: 'Le {label} de {name} approche',
    dateBody: 'Un bon moment pour prendre des nouvelles.',
  },
  data: {
    imported: '{count} ajoutés',
    importDenied: "L'accès aux contacts a été refusé.",
    importNone: 'Aucun contact à ajouter trouvé.',
    importLimited: '{count} ajoutés parmi les contacts que tu as partagés.',
    importError: 'Impossible de lire tes contacts. Réessaie.',
  },
};
export default fr;
