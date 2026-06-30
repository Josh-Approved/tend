/**
 * Japanese (ja) domain translations. Overlays SHELL_LOCALES.ja in locales.ts.
 * Mirrors appStrings.ts; {placeholders} kept verbatim; "Josh Approved" never translates.
 */
const ja = {
  nav: {
    today: '今日',
    people: 'みんな',
    htc: 'HTC',
    me: '自分',
  },
  today: {
    title: '今日',
    reachOut: '連絡する',
    caughtUp: 'すべて追いつきました。',
    caughtUpSub: '今、急いで連絡すべき人はいません。',
  },
  home: {
    title: 'みんな',
    empty: 'まだ誰もいません。これからも大切にしたい人を追加するか、連絡先から取り込んでみましょう。',
    add: '人を追加',
    importContacts: '連絡先から取り込む',
    overdueBy: '{days}日経過',
    dueToday: '今日連絡しましょう',
    dueInDays: 'あと{days}日',
    okInDays: '次の連絡まであと{days}日',
    noReminder: 'リマインダーは未設定',
    markReached: '{name}に連絡したことを記録',
    comingUp: 'もうすぐ',
    comingUpToday: '{name}の{label}・今日',
    comingUpDays: '{name}の{label}・あと{days}日',
    searchPlaceholder: '人を検索',
    searchNoResults: '「{query}」に一致する人はいません。',
    importing: '取り込み中…',
  },
  person: {
    newPerson: '新しい人',
    namePlaceholder: '名前',
    logSectionLabel: '近況を記録する',
    reachedOut: '連絡しました',
    logKindCall: '電話',
    logKindText: 'メッセージ',
    logKindInPerson: '直接会った',
    logKindOther: 'その他',
    logNotePlaceholder: 'どんな話をしましたか？（任意）',
    lastReachedToday: '今日連絡しました',
    lastReachedDays: '最後の連絡は{days}日前',
    lastReachedNever: 'まだ連絡の記録がありません',
    historyLabel: '最近の近況',
    cadenceLabel: 'どのくらいの頻度で連絡したいですか？',
    cadenceNone: 'リマインダーなし',
    cadenceWeekly: '毎週',
    cadenceBiweekly: '2週間ごと',
    cadenceMonthly: '毎月',
    cadenceQuarterly: '3か月ごと',
    howWeMetLabel: '出会ったきっかけ',
    howWeMetPlaceholder: 'どこで始まったか、どんな知り合いか…',
    notesLabel: 'メモ',
    notesPlaceholder: '覚えておきたいことは？好きなもの、最近の様子、次に聞きたいこと…',
    datesLabel: '大切な日',
    dateLabelPlaceholder: '誕生日、記念日…',
    monthPlaceholder: '月',
    dayPlaceholder: '日',
    addDate: '日付を追加',
    inDays: 'あと{days}日',
    dateToday: '今日',
    prefsLabel: '好き・苦手・贈り物のアイデア',
    like: '好きなもの',
    dislike: '苦手なもの',
    gift: '贈り物のアイデア',
    prefPlaceholder: '覚えておきたいことを追加',
    addPref: '追加',
    remove: '削除',
    deletePerson: 'この人を削除',
    deleteConfirmTitle: '{name}を削除しますか？',
    deleteConfirmBody: 'この人について保存したすべてが消えます。元には戻せません。',
    cancel: 'キャンセル',
    confirmRemove: '削除',
    untitled: 'この人',
    personalityLabel: '性格',
    personalityHint: '任意です。わかっていれば、そっと寄り添うヒントを提案します。決めつけではなく、きっかけとして。',
  },
  personality: {
    framework: {
      enneagram: 'エニアグラムのタイプ',
      attachment: 'アタッチメントのスタイル',
    },
    enneagram: {
      '1': {
        short: '1',
        label: 'タイプ1・改善する人',
        relate:
          '信念を持ち、物事を正しく進めたい人。その高い基準を言葉にして認めてあげて、指摘を個人的に受け取らないで。それは批判ではなく、思いやりです。「十分でいい」ことが多いと、そっと伝えてあげて。',
      },
      '2': {
        short: '2',
        label: 'タイプ2・助ける人',
        relate:
          'あたたかく、周りの人が何を必要としているかに敏感な人。たまには、その人自身が何を必要としているか聞いてあげて。めったに口にしないから。その思いやりに気づいて言葉にして。空っぽになるまで尽くしてしまう人です。',
      },
      '3': {
        short: '3',
        label: 'タイプ3・達成する人',
        relate:
          '意欲的で、目標に向かう人。結果だけでなく、その努力をたたえてあげて。成し遂げたことだけでなく、その人そのものを大切に思っていると伝えて。',
      },
      '4': {
        short: '4',
        label: 'タイプ4・個性を大切にする人',
        relate:
          '深く感じ、自分らしくある人。すぐに直そうとせず、その気持ちにそっと寄り添って。元気づけられたいのではなく、本当に理解されたい人です。',
      },
      '5': {
        short: '5',
        label: 'タイプ5・観察する人',
        relate:
          '思慮深く、控えめな人。スペースを与え、大きなお願いの前には前もって伝えて。ひとりで充電する時間は、あなたとの距離ではありません。',
      },
      '6': {
        short: '6',
        label: 'タイプ6・誠実な懐疑家',
        relate:
          '誠実で、うまくいかない場合に備える人。落ち着いて一貫した態度でいて。予測できることが信頼を育てます。その心配を軽く流さず、まじめに受け止めてあげて。',
      },
      '7': {
        short: '7',
        label: 'タイプ7・楽しむ人',
        relate:
          '前向きで、可能性にあふれた人。計画や冒険に誘ってあげて。避けて通りたくなるつらい気持ちにも、そっと一緒にいてあげて。',
      },
      '8': {
        short: '8',
        label: 'タイプ8・守る人',
        relate:
          'はっきりしていて、意志の強い人。遠回しにせず、率直に伝えて。回りくどさより正直さを大切にします。その強さの奥には、やわらかな心を守っている人がいます。',
      },
      '9': {
        short: '9',
        label: 'タイプ9・調和を保つ人',
        relate:
          'おだやかで、調和を求める人。意見を聞いて、待ってあげて。自分の望みを控えめにする人だから。対立は穏やかに。プレッシャーをかけると引いてしまいます。',
      },
    },
    attachment: {
      secure: {
        short: '安定型',
        label: '安定型',
        relate:
          '親しさにも距離にも、心地よくいられる人。今のあなたのままでいて。正直さ、頼もしさ、あたたかさがよく届きます。周りにとって、しっかりとした支えになる人です。',
      },
      anxious: {
        short: '不安型',
        label: '不安型',
        relate:
          '親しさを求め、距離を強く感じる人。必要だと思う以上に安心させてあげて、それを一貫して続けて。会えないあいだの短い「あなたを思っているよ」が、たくさんの安心になります。',
      },
      avoidant: {
        short: '回避型',
        label: '回避型',
        relate:
          '自立を大切にし、余白が必要な人。せかさないで。スペースを与えて、その人のペースで戻ってくるのを待って。親しさを迫ると、たいてい引いてしまいます。',
      },
      disorganized: {
        short: '混合型',
        label: '混合型',
        relate:
          '親しさを求めつつ、信頼するのが難しい人。辛抱強く、予測できる態度でいて。信頼はゆっくり育ちます。大げさなしぐさより、落ち着いた、押しつけのない存在のほうが力になります。',
      },
    },
  },
  htc: {
    title: '大切な話をする',
    whatIsThis: 'これは何ですか？',
    introTitle: '大切な話をする',
    introBody1:
      '言えないままの何か——名づけられない傷つき、のみこんだ失望、言い出しにくい自分のこと——があると、親しさはそっと止まってしまいます。',
    introBody2:
      'ふたりのあいだに距離を生むほど大きいのに、抱え込んでしまうほど難しい。それが、大切な話をする合図です。',
    introBody3:
      'ここは、それに名前をつけ、言葉を見つけ、心の準備をして臨むための場所です。正直な会話を、ひとつずつ。',
    introPrivacy: '書いたことは、すべてこの端末の中にとどまります。',
    introDismiss: 'わかりました',
    toHave: 'これからの話',
    had: '話した',
    empty:
      'まだ会話はありません。誰かとのあいだに引っかかることがあるなら、ここに名前をつけて、どう伝えるか考えてみましょう。',
    add: '会話を始める',
    personSection: 'これからの会話',
    someone: '誰か',
    untitled: 'これからの会話',
    newConversation: '新しい会話',
    whoLabel: '誰との話ですか？',
    whoPlaceholder: '名前',
    pickPersonTitle: '誰との話ですか？',
    someoneNew: '新しい人',
    chooseExisting: '記録している人',
    linkExisting: 'みんなから選ぶ',
    changePerson: '変更',
    noPeopleYet: 'まだみんなのリストに誰もいません。',
    flavorLabel: 'どんな会話ですか？',
    core: {
      topicLabel: '何を伝えたい、話したいですか？',
      topicPlaceholder: 'ふたりのあいだに引っかかっていること…',
      storyLabel: '自分が思い込んでいること…',
      storyPlaceholder: 'そう受け取っていること。本当かもしれないし、そうでないかもしれません。',
      impactLabel: 'これは、あなた自身や関係にどう影響していますか？',
      impactPlaceholder: '言わないままでいることの代償…',
      hopeLabel: 'この会話から、何が生まれることを望みますか？',
      hopePlaceholder: 'よい結末を思い描いてみて…',
    },
    flavor: {
      open: '伝えたいこと',
      hurt: '傷ついたこと',
      aboutMe: '自分について言いにくいこと',
      boundary: '必要な境界線',
      apology: '伝えるべき謝罪',
      appreciation: '言えずにいた感謝',
    },
    prompt: {
      iStatement: { label: '「私」を主語にして伝える', placeholder: '___が起きたとき、私は___と感じました' },
      vulnerable: { label: '打ち明けるのが怖いこと', placeholder: '言いにくいのは…' },
      need: { label: '必要な境界線', placeholder: 'これから私に必要なのは…' },
      sorryFor: { label: 'ごめんなさい…', placeholder: '自分が何をしたか、具体的に書いて。' },
      theHurt: {
        label: 'どう傷つけたと思うか',
        placeholder: '相手への影響を言葉にして。それが謝罪を届くものにします。',
      },
      askForgiveness: { label: 'ゆるしを求める', placeholder: '例：「ゆるしてもらえますか？」' },
      holdingBack: { label: 'ずっと伝えたかったこと', placeholder: 'ありがたいと思っているのは…' },
    },
    note: {
      apology:
        '本当の謝罪には3つの要素があります。自分が何をしたかを言い、それがどう傷つけたかを言い、ゆるしを求めること。最後のひとつは、多くの人が飛ばしてしまう——そしてそれこそが、仲直りへの扉を開くのです。',
    },
    markHad: 'この会話をしました',
    hadOn: 'この会話をしました',
    reopen: 'まだこれからの話に戻す',
    reflectionLabel: 'どうでしたか？',
    reflectionPlaceholder: '何が起きたか、どう感じたか、何に気づいたか…',
    deleteConversation: 'この会話を削除',
    deleteConfirmTitle: 'この会話を削除しますか？',
    deleteConfirmBody: 'ここに書いたすべてが消えます。元には戻せません。',
  },
  me: {
    title: '自分',
    intro:
      'あなた自身の取扱説明書——あなたを大切に思う人たちに、わかっていてほしいこと。心に響くところを書いてみて。あなたのもので、準備ができたら誰かと分かち合えます。',
    share: '取扱説明書を共有',
    shareHeading: '私について少し',
    prompt: {
      communicate: { label: '私の伝え方', placeholder: 'はっきり言う方？それとも心を開くのに時間がかかる？書く方が得意？話す方が得意？' },
      feedback: { label: 'フィードバックの受け取り方', placeholder: 'やさしく？それともストレートに？受け止めるのに時間が必要？' },
      conflict: { label: '対立のときの私', placeholder: 'まず距離が必要？それともすぐ話し合いたい？' },
      feelCared: { label: '大切にされていると感じるとき', placeholder: '私にとって、本当に愛として届くこと…' },
      showCare: { label: '私の愛の示し方', placeholder: '私の思いやりの出方。誤解されないように…' },
      fillsMeUp: { label: '私を満たすもの', placeholder: '私を元気にしてくれる人、場所、もの…' },
      drains: { label: '私を消耗させるもの', placeholder: '私の力を奪うもの、苦手なこと…' },
      growth: { label: '今取り組んでいること', placeholder: '親しい人に知っていてほしい、成長したい部分…' },
      support: { label: '落ち込んでいるときの支え方', placeholder: 'つらいとき、本当に助けになること…' },
      values: { label: '私が最も大切にしていること', placeholder: '私が大切に生きようとしている価値観…' },
    },
  },
  notify: {
    reachOutTitle: '{name}に連絡する頃です',
    reachOutBody: 'しばらく経ちました。短いひと言でも、ずっと届きます。',
    dateTitle: '{name}の{label}が近づいています',
    dateBody: '連絡するのにいいタイミングです。',
  },
  data: {
    imported: '{count}件追加',
    importDenied: '連絡先へのアクセスが拒否されました。',
    importNone: '追加できる連絡先が見つかりませんでした。',
    importLimited: '共有された連絡先から{count}件追加しました。',
    importError: '連絡先を読み取れませんでした。もう一度お試しください。',
  },
};
export default ja;
