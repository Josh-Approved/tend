/**
 * Spanish (es) domain translations. Overlays SHELL_LOCALES.es in locales.ts.
 * Mirrors appStrings.ts; {placeholders} kept verbatim; "Josh Approved" never translates.
 */
const es = {
  nav: {
    today: 'Hoy',
    people: 'Personas',
    htc: 'HTC',
    me: 'Yo',
  },
  today: {
    title: 'Hoy',
    reachOut: 'Ponte en contacto',
    caughtUp: 'Estás al día.',
    caughtUpSub: 'Nadie necesita un recordatorio ahora mismo.',
  },
  home: {
    title: 'Personas',
    empty: 'Aún no hay nadie aquí. Añade a alguien con quien quieras mantener el contacto, o trae personas desde tus contactos.',
    add: 'Añadir persona',
    importContacts: 'Importar desde contactos',
    overdueBy: 'Atrasado {days}d',
    dueToday: 'Ponte en contacto hoy',
    dueInDays: 'En {days}d',
    okInDays: 'Próximo contacto en {days}d',
    noReminder: 'Sin recordatorio',
    markReached: 'Marcar que contactaste con {name}',
    comingUp: 'Próximamente',
    comingUpToday: '{label} de {name} · hoy',
    comingUpDays: '{label} de {name} · en {days}d',
    searchPlaceholder: 'Buscar personas',
    searchNoResults: 'Nadie coincide con “{query}”.',
    importing: 'Importando…',
  },
  person: {
    newPerson: 'Persona nueva',
    namePlaceholder: 'Su nombre',
    logSectionLabel: 'Registrar un contacto',
    reachedOut: 'Me puse en contacto',
    logKindCall: 'Llamada',
    logKindText: 'Mensaje',
    logKindInPerson: 'En persona',
    logKindOther: 'Otro',
    logNotePlaceholder: '¿De qué hablasteis? (opcional)',
    lastReachedToday: 'Contactaste hoy',
    lastReachedDays: 'Último contacto hace {days}d',
    lastReachedNever: 'Todavía no has registrado ningún contacto',
    historyLabel: 'Contactos recientes',
    cadenceLabel: '¿Con qué frecuencia quieres ponerte en contacto?',
    cadenceNone: 'Sin recordatorio',
    cadenceWeekly: 'Cada semana',
    cadenceBiweekly: 'Cada 2 semanas',
    cadenceMonthly: 'Cada mes',
    cadenceQuarterly: 'Cada 3 meses',
    howWeMetLabel: 'Cómo os conocisteis',
    howWeMetPlaceholder: 'Dónde empezó, de qué os conocéis…',
    notesLabel: 'Notas',
    notesPlaceholder: '¿Qué quieres recordar? Lo que le gusta, cómo le va, qué preguntarle la próxima vez…',
    datesLabel: 'Fechas importantes',
    dateLabelPlaceholder: 'Cumpleaños, aniversario…',
    monthPlaceholder: 'MM',
    dayPlaceholder: 'DD',
    addDate: 'Añadir fecha',
    inDays: 'en {days}d',
    dateToday: 'hoy',
    prefsLabel: 'Gustos, cosas que no le gustan e ideas de regalo',
    like: 'Le gusta',
    dislike: 'No le gusta',
    gift: 'Ideas de regalo',
    prefPlaceholder: 'Añade algo para recordar',
    addPref: 'Añadir',
    remove: 'Quitar',
    deletePerson: 'Eliminar a esta persona',
    deleteConfirmTitle: '¿Eliminar a {name}?',
    deleteConfirmBody: 'Esto borra todo lo que has guardado sobre esta persona. No se puede deshacer.',
    cancel: 'Cancelar',
    confirmRemove: 'Eliminar',
    untitled: 'esta persona',
    personalityLabel: 'Personalidad',
    personalityHint: 'Opcional. Si lo sabes, la app te sugiere formas suaves de estar presente: puntos de partida, no etiquetas.',
  },
  personality: {
    framework: {
      enneagram: 'Tipo del eneagrama',
      attachment: 'Estilo de apego',
    },
    enneagram: {
      '1': {
        short: '1',
        label: 'Tipo 1 · El que mejora',
        relate:
          'De principios, y quiere que las cosas se hagan bien. Reconoce en voz alta sus altos estándares y no te tomes las correcciones de forma personal: es cuidado, no crítica. Recuérdale que lo bastante bueno suele bastar.',
      },
      '2': {
        short: '2',
        label: 'Tipo 2 · El que ayuda',
        relate:
          'Cálido y atento a lo que necesitan los demás. Para variar, pregúntale qué necesita: casi nunca lo dice. Fíjate en el cuidado que da y nómbralo; puede vaciarse por completo.',
      },
      '3': {
        short: '3',
        label: 'Tipo 3 · El que logra',
        relate:
          'Motivado y centrado en metas. Celebra el esfuerzo, no solo el triunfo. Recuérdale que valoras quién es, no solo lo que consigue.',
      },
      '4': {
        short: '4',
        label: 'Tipo 4 · El individualista',
        relate:
          'De sentir profundo y auténtico. Acompaña sus emociones sin correr a arreglarlas: quiere que lo vean de verdad, no que lo animen.',
      },
      '5': {
        short: '5',
        label: 'Tipo 5 · El que observa',
        relate:
          'Reflexivo y reservado. Dale espacio y avísale antes de pedirle cosas grandes. El tiempo a solas para recargarse no es alejarse de ti.',
      },
      '6': {
        short: '6',
        label: 'Tipo 6 · El leal escéptico',
        relate:
          'Leal, y previene lo que podría salir mal. Sé firme y constante: la previsibilidad le da confianza. Toma en serio sus preocupaciones en lugar de restarles importancia.',
      },
      '7': {
        short: '7',
        label: 'Tipo 7 · El entusiasta',
        relate:
          'Animado y lleno de posibilidades. Inclúyelo en planes y aventuras. Con delicadeza, quédate con él en las emociones difíciles que preferiría saltarse.',
      },
      '8': {
        short: '8',
        label: 'Tipo 8 · El que protege',
        relate:
          'Directo y de voluntad fuerte. Sé claro con él: respeta la honestidad más que los rodeos. Bajo la fuerza hay alguien que cuida un corazón tierno.',
      },
      '9': {
        short: '9',
        label: 'Tipo 9 · El que pacifica',
        relate:
          'Tranquilo y buscador de armonía. Pídele su opinión y espérala: resta importancia a lo que quiere. Mantén la calma en los conflictos; la presión hace que se retire.',
      },
    },
    attachment: {
      secure: {
        short: 'Seguro',
        label: 'Seguro',
        relate:
          'A gusto tanto con la cercanía como con el espacio. Sigue como lo haces: la honestidad, la fiabilidad y la calidez le llegan bien. Es un ancla firme para los demás.',
      },
      anxious: {
        short: 'Ansioso',
        label: 'Ansioso',
        relate:
          'Ansía la cercanía y siente mucho la distancia. Tranquilízalo más de lo que parece necesario, y hazlo de forma constante. Un rápido “pienso en ti” entre encuentros calma mucho.',
      },
      avoidant: {
        short: 'Evitativo',
        label: 'Evitativo',
        relate:
          'Valora la independencia y necesita espacio. No lo agobies: dale espacio y deja que vuelva por su cuenta. Empujar hacia la cercanía suele hacer que se retire.',
      },
      disorganized: {
        short: 'Mixto',
        label: 'Mixto',
        relate:
          'Quiere cercanía pero le cuesta confiar. Ten paciencia y sé previsible: la confianza llega despacio. Una presencia firme y sin presión hace más que los grandes gestos.',
      },
    },
  },
  htc: {
    title: 'Ten la conversación',
    whatIsThis: '¿Qué es esto?',
    introTitle: 'Ten la conversación',
    introBody1:
      'La cercanía se estanca en silencio cuando algo queda sin decir: una herida que no has nombrado, una decepción que te has tragado o algo sobre ti que cuesta contar.',
    introBody2:
      'Cuando algo es lo bastante grande como para abrir distancia entre vosotros, pero lo bastante difícil como para que te lo guardes, esa es la señal de tener la conversación.',
    introBody3:
      'Este espacio te ayuda a nombrarlo, encontrar las palabras y entrar preparado: una conversación honesta a la vez.',
    introPrivacy: 'Lo que escribas se queda en tu dispositivo.',
    introDismiss: 'Entendido',
    toHave: 'Pendientes',
    had: 'Tenidas',
    empty:
      'Aún no hay conversaciones. Cuando algo se interponga entre tú y alguien, nómbralo aquí y planea cómo lo dirás.',
    add: 'Empezar una conversación',
    personSection: 'Conversaciones pendientes',
    someone: 'alguien',
    untitled: 'Una conversación pendiente',
    newConversation: 'Conversación nueva',
    whoLabel: '¿Con quién es esto?',
    whoPlaceholder: 'Su nombre',
    pickPersonTitle: '¿Con quién es esto?',
    someoneNew: 'Alguien nuevo',
    chooseExisting: 'Alguien a quien sigues',
    linkExisting: 'Elige entre tus personas',
    changePerson: 'Cambiar',
    noPeopleYet: 'Todavía no hay nadie en tu lista de personas.',
    flavorLabel: '¿Qué tipo de conversación es esta?',
    core: {
      topicLabel: '¿Qué necesitas compartir o hablar?',
      topicPlaceholder: 'Eso que se interpone entre vosotros…',
      storyLabel: 'La historia que me estoy contando…',
      storyPlaceholder: 'Lo que estás dando por hecho, que puede ser cierto o no.',
      impactLabel: '¿Cómo te está afectando esto, a ti o a la relación?',
      impactPlaceholder: 'El coste de dejarlo sin decir…',
      hopeLabel: '¿Qué esperas que salga de esta conversación?',
      hopePlaceholder: 'Imagina un buen desenlace…',
    },
    flavor: {
      open: 'Algo que compartir',
      hurt: 'Algo que me dolió',
      aboutMe: 'Algo difícil de contar sobre mí',
      boundary: 'Un límite que necesito',
      apology: 'Una disculpa que debo',
      appreciation: 'Un aprecio que me he guardado',
    },
    prompt: {
      iStatement: { label: 'Dilo en primera persona', placeholder: 'Cuando pasó ___, me sentí ___' },
      vulnerable: { label: 'Lo que da miedo compartir', placeholder: 'Lo que cuesta decir es…' },
      need: { label: 'El límite que necesito', placeholder: 'Lo que necesito de aquí en adelante es…' },
      sorryFor: { label: 'Siento haber…', placeholder: 'Nombra en concreto lo que hiciste.' },
      theHurt: {
        label: 'Cómo creo que te dolió',
        placeholder: 'Nombra el impacto en la otra persona: eso es lo que hace que una disculpa llegue.',
      },
      askForgiveness: { label: 'Pide perdón', placeholder: 'p. ej. “¿Me perdonas?”' },
      holdingBack: { label: 'Lo que llevo tiempo queriendo decirte', placeholder: 'Agradezco…' },
    },
    note: {
      apology:
        'Una disculpa de verdad tiene tres partes: nombra lo que hiciste, nombra cómo le dolió y pide perdón. Ese último paso es el que casi todos se saltan, y es el que abre la puerta a la reconciliación.',
    },
    markHad: 'Tuvimos esta conversación',
    hadOn: 'Conversación tenida',
    reopen: 'Marcar como pendiente',
    reflectionLabel: '¿Cómo fue?',
    reflectionPlaceholder: 'Qué pasó, cómo se sintió, qué aprendiste…',
    deleteConversation: 'Eliminar esta conversación',
    deleteConfirmTitle: '¿Eliminar esta conversación?',
    deleteConfirmBody: 'Esto borra todo lo que has escrito aquí. No se puede deshacer.',
  },
  me: {
    title: 'Yo',
    intro:
      'Un manual sobre ti: las cosas que querrías que entendieran las personas que te quieren. Rellena lo que te resuene; es tuyo para guardarlo, y tuyo para compartirlo cuando estés listo.',
    share: 'Compartir mi manual',
    shareHeading: 'Un poco sobre mí',
    prompt: {
      communicate: { label: 'Cómo me comunico', placeholder: '¿Directo, o me cuesta abrirme? ¿Mejor por escrito o en voz alta?' },
      feedback: { label: 'Cómo me gusta recibir comentarios', placeholder: '¿Con delicadeza, o sin rodeos? ¿Necesito tiempo para asimilarlos?' },
      conflict: { label: 'Cómo soy en los conflictos', placeholder: '¿Necesito espacio primero, o hablarlo enseguida?' },
      feelCared: { label: 'Cómo siento que me cuidan', placeholder: 'Lo que de verdad me llega como cariño…' },
      showCare: { label: 'Cómo demuestro que me importa', placeholder: 'La forma en que me sale el cariño, para que no se malinterprete…' },
      fillsMeUp: { label: 'Lo que me llena', placeholder: 'Las personas, los lugares y las cosas que me recargan…' },
      drains: { label: 'Lo que me agota', placeholder: 'Lo que me deja sin energía, lo que me saca de quicio…' },
      growth: { label: 'En lo que estoy trabajando', placeholder: 'Algo que quiero mejorar y que querría que supiera alguien cercano…' },
      support: { label: 'Cómo apoyarme cuando estoy bajo', placeholder: 'Cuando lo estoy pasando mal, lo que de verdad ayuda…' },
      values: { label: 'Lo que más me importa', placeholder: 'Los valores por los que trato de vivir…' },
    },
  },
  notify: {
    reachOutTitle: 'Es buen momento para contactar con {name}',
    reachOutBody: 'Hace tiempo: un saludo rápido vale mucho.',
    dateTitle: 'Se acerca {label} de {name}',
    dateBody: 'Un buen momento para ponerte en contacto.',
  },
  data: {
    imported: '{count} añadidos',
    importDenied: 'Se denegó el acceso a los contactos.',
    importNone: 'No se encontraron contactos para añadir.',
    importLimited: '{count} añadidos de los contactos que compartiste.',
    importError: 'No se pudieron leer tus contactos. Inténtalo de nuevo.',
  },
};
export default es;
