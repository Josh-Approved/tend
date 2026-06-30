/**
 * Brazilian Portuguese (pt-BR) domain translations. Overlays SHELL_LOCALES['pt-BR'] in locales.ts.
 * Mirrors appStrings.ts; {placeholders} kept verbatim; "Josh Approved" never translates.
 */
const ptBR = {
  nav: {
    today: 'Hoje',
    people: 'Pessoas',
    htc: 'HTC',
    me: 'Eu',
  },
  today: {
    title: 'Hoje',
    reachOut: 'Entrar em contato',
    caughtUp: 'Você está em dia.',
    caughtUpSub: 'Ninguém precisa de um lembrete agora.',
  },
  home: {
    title: 'Pessoas',
    empty: 'Ninguém por aqui ainda. Adicione alguém com quem você quer manter contato — ou traga pessoas dos seus contatos.',
    add: 'Adicionar pessoa',
    importContacts: 'Importar dos contatos',
    overdueBy: 'Atrasado há {days}d',
    dueToday: 'Entre em contato hoje',
    dueInDays: 'Em {days}d',
    okInDays: 'Próximo contato em {days}d',
    noReminder: 'Sem lembrete definido',
    markReached: 'Marcar contato com {name}',
    comingUp: 'Em breve',
    comingUpToday: '{label} de {name} · hoje',
    comingUpDays: '{label} de {name} · em {days}d',
    searchPlaceholder: 'Buscar pessoas',
    searchNoResults: 'Ninguém corresponde a “{query}”.',
    importing: 'Importando…',
  },
  person: {
    newPerson: 'Nova pessoa',
    namePlaceholder: 'O nome dela',
    logSectionLabel: 'Registrar uma conversa',
    reachedOut: 'Entrei em contato',
    logKindCall: 'Ligação',
    logKindText: 'Mensagem',
    logKindInPerson: 'Pessoalmente',
    logKindOther: 'Outro',
    logNotePlaceholder: 'Sobre o que vocês conversaram? (opcional)',
    lastReachedToday: 'Contato feito hoje',
    lastReachedDays: 'Último contato há {days}d',
    lastReachedNever: 'Você ainda não registrou nenhum contato',
    historyLabel: 'Conversas recentes',
    cadenceLabel: 'Com que frequência você quer entrar em contato?',
    cadenceNone: 'Sem lembrete',
    cadenceWeekly: 'Semanalmente',
    cadenceBiweekly: 'A cada 2 semanas',
    cadenceMonthly: 'Mensalmente',
    cadenceQuarterly: 'A cada 3 meses',
    howWeMetLabel: 'Como vocês se conheceram',
    howWeMetPlaceholder: 'Onde começou, como vocês se conhecem…',
    notesLabel: 'Notas',
    notesPlaceholder: 'O que você quer lembrar? As preferências dela, o que está acontecendo, o que perguntar na próxima vez…',
    datesLabel: 'Datas importantes',
    dateLabelPlaceholder: 'Aniversário, data especial…',
    monthPlaceholder: 'MM',
    dayPlaceholder: 'DD',
    addDate: 'Adicionar data',
    inDays: 'em {days}d',
    dateToday: 'hoje',
    prefsLabel: 'Gostos, desgostos e ideias de presente',
    like: 'Gosta de',
    dislike: 'Não gosta de',
    gift: 'Ideias de presente',
    prefPlaceholder: 'Adicione algo para lembrar',
    addPref: 'Adicionar',
    remove: 'Remover',
    deletePerson: 'Remover esta pessoa',
    deleteConfirmTitle: 'Remover {name}?',
    deleteConfirmBody: 'Isso apaga tudo o que você salvou sobre ela. Não dá para desfazer.',
    cancel: 'Cancelar',
    confirmRemove: 'Remover',
    untitled: 'esta pessoa',
    personalityLabel: 'Personalidade',
    personalityHint: 'Opcional. Se você souber, o app sugere formas gentis de estar presente — pontos de partida, não rótulos.',
  },
  personality: {
    framework: {
      enneagram: 'Tipo do Eneagrama',
      attachment: 'Estilo de apego',
    },
    enneagram: {
      '1': {
        short: '1',
        label: 'Tipo 1 · O Aperfeiçoador',
        relate:
          'Tem princípios e quer as coisas bem-feitas. Reconheça em voz alta os padrões altos dela e não leve as correções para o lado pessoal — é cuidado, não crítica. Lembre que o suficientemente bom muitas vezes basta.',
      },
      '2': {
        short: '2',
        label: 'Tipo 2 · O Prestativo',
        relate:
          'Caloroso e atento ao que todos os outros precisam. Pergunte do que ela precisa, para variar — ela raramente diz. Perceba o cuidado que ela oferece e diga isso; ela pode se entregar até se esvaziar.',
      },
      '3': {
        short: '3',
        label: 'Tipo 3 · O Realizador',
        relate:
          'Determinado e focado em metas. Celebre o esforço, não só a vitória. Lembre que você valoriza quem ela é, não apenas o que ela conquista.',
      },
      '4': {
        short: '4',
        label: 'Tipo 4 · O Individualista',
        relate:
          'Sente profundamente e é autêntico. Acolha os sentimentos dela sem pressa de resolver — ela quer ser realmente vista, não animada.',
      },
      '5': {
        short: '5',
        label: 'Tipo 5 · O Observador',
        relate:
          'Reflexivo e reservado. Dê espaço e um aviso antes de pedidos grandes. Tempo sozinha para se recarregar não é distância de você.',
      },
      '6': {
        short: '6',
        label: 'Tipo 6 · O Cético Leal',
        relate:
          'Leal e atento ao que pode dar errado. Seja firme e constante — a previsibilidade constrói a confiança dela. Leve as preocupações dela a sério em vez de minimizá-las.',
      },
      '7': {
        short: '7',
        label: 'Tipo 7 · O Entusiasta',
        relate:
          'Animado e cheio de possibilidades. Inclua-a nos planos e nas aventuras. Com delicadeza, fique ao lado dela nos sentimentos difíceis que ela preferiria pular.',
      },
      '8': {
        short: '8',
        label: 'Tipo 8 · O Protetor',
        relate:
          'Direto e de vontade forte. Seja franco com ela — ela respeita a honestidade mais do que os rodeios. Sob a força, há alguém guardando um coração sensível.',
      },
      '9': {
        short: '9',
        label: 'Tipo 9 · O Pacificador',
        relate:
          'Tranquilo e em busca de harmonia. Peça a opinião dela e espere por ela — ela minimiza os próprios desejos. Mantenha o conflito calmo; pressão a faz se retrair.',
      },
    },
    attachment: {
      secure: {
        short: 'Seguro',
        label: 'Seguro',
        relate:
          'À vontade tanto com proximidade quanto com espaço. Continue fazendo o que faz — honestidade, confiabilidade e carinho caem bem. Ela é um porto firme para os outros.',
      },
      anxious: {
        short: 'Ansioso',
        label: 'Ansioso',
        relate:
          'Anseia por proximidade e sente a distância de forma intensa. Tranquilize-a mais do que parece necessário, e seja constante nisso. Um rápido “estou pensando em você” entre os encontros acalma muita coisa.',
      },
      avoidant: {
        short: 'Evitativo',
        label: 'Evitativo',
        relate:
          'Valoriza a independência e precisa de espaço. Não a sufoque — dê espaço e deixe que ela volte por conta própria. Insistir na proximidade costuma fazê-la se afastar.',
      },
      disorganized: {
        short: 'Misto',
        label: 'Misto',
        relate:
          'Quer proximidade, mas tem dificuldade em confiar. Seja paciente e previsível — a confiança vem aos poucos. Uma presença firme e sem pressão faz mais do que grandes gestos.',
      },
    },
  },
  htc: {
    title: 'Ter a conversa',
    whatIsThis: 'O que é isto?',
    introTitle: 'Ter a conversa',
    introBody1:
      'A proximidade trava em silêncio quando algo fica por dizer — uma mágoa que você não nomeou, uma decepção que você engoliu, ou algo sobre você que é difícil de falar.',
    introBody2:
      'Quando algo é grande o bastante para criar distância entre vocês, mas difícil o bastante para você guardar, esse é o sinal de ter a conversa.',
    introBody3:
      'Este espaço ajuda você a nomear isso, encontrar as palavras e chegar preparado — uma conversa honesta de cada vez.',
    introPrivacy: 'Tudo o que você escrever fica no seu dispositivo.',
    introDismiss: 'Entendi',
    toHave: 'Para ter',
    had: 'Tidas',
    empty:
      'Nenhuma conversa ainda. Quando algo estiver entre você e alguém, nomeie aqui e planeje como você vai dizer.',
    add: 'Iniciar uma conversa',
    personSection: 'Conversas para ter',
    someone: 'alguém',
    untitled: 'Uma conversa para ter',
    newConversation: 'Nova conversa',
    whoLabel: 'Com quem é esta conversa?',
    whoPlaceholder: 'O nome dela',
    pickPersonTitle: 'Com quem é esta conversa?',
    someoneNew: 'Alguém novo',
    chooseExisting: 'Alguém que você acompanha',
    linkExisting: 'Escolher das suas pessoas',
    changePerson: 'Trocar',
    noPeopleYet: 'Ninguém na sua lista de pessoas ainda.',
    flavorLabel: 'Que tipo de conversa é esta?',
    core: {
      topicLabel: 'O que você precisa compartilhar ou conversar?',
      topicPlaceholder: 'A coisa que está entre vocês…',
      storyLabel: 'A história que eu conto para mim mesmo…',
      storyPlaceholder: 'O sentido que você dá a isso — que pode ou não ser verdade.',
      impactLabel: 'Como isso está afetando você, ou a relação?',
      impactPlaceholder: 'O custo de deixar isso por dizer…',
      hopeLabel: 'O que você espera que venha desta conversa?',
      hopePlaceholder: 'Imagine um bom resultado…',
    },
    flavor: {
      open: 'Algo para compartilhar',
      hurt: 'Algo que me magoou',
      aboutMe: 'Difícil de falar sobre mim',
      boundary: 'Um limite de que preciso',
      apology: 'Um pedido de desculpas que devo',
      appreciation: 'Um reconhecimento que segurei',
    },
    prompt: {
      iStatement: { label: 'Diga na primeira pessoa', placeholder: 'Quando ___ aconteceu, eu me senti ___' },
      vulnerable: { label: 'O que parece vulnerável compartilhar', placeholder: 'O que é difícil dizer é…' },
      need: { label: 'O limite de que preciso', placeholder: 'O que eu preciso daqui em diante é…' },
      sorryFor: { label: 'Me desculpe por…', placeholder: 'Nomeie especificamente o que você fez.' },
      theHurt: {
        label: 'Como eu acho que isso te magoou',
        placeholder: 'Nomeie o impacto sobre ela — é isso que faz um pedido de desculpas tocar.',
      },
      askForgiveness: { label: 'Peça perdão', placeholder: 'ex.: “Você me perdoa?”' },
      holdingBack: { label: 'O que eu venho querendo te dizer', placeholder: 'Eu agradeço…' },
    },
    note: {
      apology:
        'Um pedido de desculpas verdadeiro tem três partes: nomear o que você fez, nomear como isso magoou a pessoa e pedir perdão. Esse último passo é o que a maioria pula — e é o que abre a porta para a reconciliação.',
    },
    markHad: 'Tivemos esta conversa',
    hadOn: 'Tive esta conversa',
    reopen: 'Marcar como ainda por ter',
    reflectionLabel: 'Como foi?',
    reflectionPlaceholder: 'O que aconteceu, como você se sentiu, o que aprendeu…',
    deleteConversation: 'Excluir esta conversa',
    deleteConfirmTitle: 'Excluir esta conversa?',
    deleteConfirmBody: 'Isso remove tudo o que você escreveu aqui. Não dá para desfazer.',
  },
  me: {
    title: 'Eu',
    intro:
      'Um manual sobre você — as coisas que você gostaria que as pessoas que te amam entendessem. Preencha o que fizer sentido; é seu para guardar, e seu para compartilhar quando estiver pronto.',
    share: 'Compartilhar meu manual',
    shareHeading: 'Um pouco sobre mim',
    prompt: {
      communicate: { label: 'Como eu me comunico', placeholder: 'Direto, ou demoro para me abrir? Melhor por escrito ou em voz alta?' },
      feedback: { label: 'Como eu gosto de receber feedback', placeholder: 'Com delicadeza, ou direto? Preciso de tempo para digerir?' },
      conflict: { label: 'Como eu sou no conflito', placeholder: 'Preciso de espaço primeiro, ou de conversar na hora?' },
      feelCared: { label: 'Como eu me sinto cuidado', placeholder: 'O que de fato chega até mim como amor…' },
      showCare: { label: 'Como eu demonstro cuidado', placeholder: 'O jeito como o cuidado sai de mim — para não ser mal interpretado…' },
      fillsMeUp: { label: 'O que me enche de energia', placeholder: 'As pessoas, lugares e coisas que me recarregam…' },
      drains: { label: 'O que me desgasta', placeholder: 'O que me esgota, o que me incomoda…' },
      growth: { label: 'No que estou trabalhando', placeholder: 'Um ponto de crescimento que eu gostaria que alguém próximo soubesse…' },
      support: { label: 'Como me apoiar quando estou para baixo', placeholder: 'Quando estou sofrendo, o que de fato ajuda…' },
      values: { label: 'O que mais importa para mim', placeholder: 'Os valores pelos quais tento viver…' },
    },
  },
  notify: {
    reachOutTitle: 'Hora de entrar em contato com {name}',
    reachOutBody: 'Já faz um tempo — um oi rápido faz toda a diferença.',
    dateTitle: '{label} de {name} está chegando',
    dateBody: 'Um bom momento para entrar em contato.',
  },
  data: {
    imported: '{count} adicionados',
    importDenied: 'O acesso aos contatos foi negado.',
    importNone: 'Nenhum contato encontrado para adicionar.',
    importLimited: '{count} adicionados dos contatos que você compartilhou.',
    importError: 'Não foi possível ler seus contatos. Tente novamente.',
  },
};
export default ptBR;
