/**
 * Edge-inset audit over this app's own screens — APP-OWNED: seeded once by
 * `sync.mjs qa`, never overwritten.
 *
 * src/qa/edgeInset.ts (canonical) fails when text or an icon sits closer than
 * 8pt to the inside edge of a card, sheet, row or button; the canonical
 * edgeInset.proof.test.tsx proves it catches the shape that shipped.
 *
 * What belongs here: Settings, and every screen, sheet or pane that draws a
 * card, a filled or bordered row, or a labelled button. Each renders with a
 * person on file (overdue, with dates, likes, a personality type and a logged
 * catch-up), a conversation to have and one already had, so the rows and cards
 * actually appear. A new screen or sheet gets a line here in the same PR.
 * qa-canonical `test/edge-inset-screens` warns while this file renders none of
 * the app's screens or components.
 *
 * Fixing a finding: give the content room inside the surface, usually the
 * container's own horizontal gutter (the screen's space.s5 / space.s6), rather
 * than padding each row.
 */

import React from 'react';

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
// The stores' durable layer — in-memory state is what the screens read.
jest.mock('../../store/db', () => ({
  loadAllPeople: () => Promise.resolve([]),
  savePerson: () => Promise.resolve(),
  deletePersonFromDb: () => Promise.resolve(),
  loadAllConversations: () => Promise.resolve([]),
  saveConversation: () => Promise.resolve(),
  deleteConversationFromDb: () => Promise.resolve(),
}));
// HTC reads one app setting: the intro has been seen, so the list is in front.
jest.mock('../../storage/kv', () => ({
  putTombstone: () => Promise.resolve(),
  getAppSetting: () => Promise.resolve('1'),
  setAppSetting: () => Promise.resolve(),
}));
jest.mock('../../lib/reminderAdapter', () => ({
  getBirthdayRemindersEnabled: () => Promise.resolve(true),
  setBirthdayRemindersEnabled: () => Promise.resolve(),
  syncAppReminders: () => Promise.resolve(),
  optInToReminders: () => Promise.resolve(),
}));
jest.mock('../../qa/qaMode', () => ({ QA_MODE: false }));
jest.mock('../../qa/fixtures', () => ({ qaPeople: () => [], qaConversations: () => [] }));
jest.mock('expo-contacts/legacy', () => ({
  Fields: {},
  SortTypes: {},
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));
// The address-book read; enough contacts that the picker shows its search box,
// one of them already tracked so the "Added" row renders too.
jest.mock('../../lib/contacts', () => {
  const actual = jest.requireActual('../../lib/contacts');
  const names = ['Mom', 'Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Barbara Liskov',
    'Ken Thompson', 'Anita Borg', 'Katherine Johnson', 'Edsger Dijkstra'];
  return {
    ...actual,
    fetchContactsForPicker: () =>
      Promise.resolve({
        limited: true,
        contacts: names.map((name, i) => ({ id: `c${i}`, name, raw: { id: `c${i}`, name } })),
      }),
  };
});
jest.mock('../../lib/transfer', () => ({
  exportData: () => Promise.resolve(),
  pickAndParseData: () => Promise.resolve({ people: [], conversations: [], me: null }),
}));
// Real price buttons, so the audit sees the tip tiers as they render.
jest.mock('../../lib/tipJar', () => {
  const { TIP_PRODUCT_IDS } = require('../../constants/tipProducts');
  return {
    isStoreKnownUnavailable: () => false,
    useTipJar: () => ({
      status: 'ready',
      products: TIP_PRODUCT_IDS.map((id: string) => ({ id, displayPrice: '$2.99' })),
      pendingSku: null,
      tip: jest.fn(),
    }),
  };
});
// No native rating sheet, so the review prompt falls back to its own card.
jest.mock('expo-store-review', () => ({
  isAvailableAsync: () => Promise.resolve(false),
  requestReview: () => Promise.resolve(),
}));
jest.mock('../../feedback/FeedbackProvider', () => ({ useFeedback: () => ({ open: jest.fn() }) }));
// The pull-to-reveal footer is reanimated + gesture-handler worklets: native
// machinery with no bearing on padding. The screens' own layout stays real.
jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: { View },
    useAnimatedStyle: (fn: () => unknown) => fn(),
    interpolate: (v: number, inRange: number[], outRange: number[]) =>
      outRange[0] + (v - inRange[0]) * (outRange[1] - outRange[0]),
  };
});
jest.mock('../../components/usePullRevealFooter', () => ({
  usePullRevealFooter: () => ({
    pullToReveal: false,
    reveal: { value: 0 },
    gesture: {},
    onScrollJS: undefined,
    onScrollViewLayout: undefined,
    onContentSizeChange: undefined,
  }),
}));
jest.mock('react-native-gesture-handler', () => {
  const { View } = require('react-native');
  return {
    GestureDetector: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    GestureHandlerRootView: View,
  };
});

import { auditScreen } from '../edgeInsetAudit';
import { t } from '../../i18n';
import SettingsScreen from '../../screens/SettingsScreen';
import TodayScreen from '../../screens/TodayScreen';
import PeopleScreen from '../../screens/PeopleScreen';
import PersonDetailScreen from '../../screens/PersonDetailScreen';
import ConversationDetailScreen from '../../screens/ConversationDetailScreen';
import HTCScreen from '../../screens/HTCScreen';
import MeScreen from '../../screens/MeScreen';
import Credits from '../../components/Credits';
import { NotifyTimePane } from '../../components/NotifyTimeSetting';
import { CadenceSheet } from '../../components/CadenceSheet';
import { DatesSheet } from '../../components/DatesSheet';
import { PrefsSheet } from '../../components/PrefsSheet';
import { PersonalitySheet } from '../../components/PersonalitySheet';
import { PersonTextSheet } from '../../components/PersonTextSheet';
import { ContactPicker } from '../../components/ContactPicker';
import { PersonPicker } from '../../components/PersonPicker';
import { HTCIntro } from '../../components/HTCIntro';
import TipJarSheet from '../../components/TipJarSheet';
import LaunchNoticeModal from '../../components/LaunchNoticeModal';
import ReviewModal from '../../components/ReviewModal';
import { TIP_PRODUCT_IDS } from '../../constants/tipProducts';
import { usePeopleStore } from '../../store/people';
import { useConversationsStore } from '../../store/conversations';
import { useMeStore } from '../../store/me';
import { getBirthday, otherImportantDates } from '../../data/person';

/* eslint-disable @typescript-eslint/no-explicit-any */
const navigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
} as any;
const route = (name: string, params?: object) => ({ key: name, name, params }) as any;
/* eslint-enable @typescript-eslint/no-explicit-any */
const noop = () => {};
const DAY = 24 * 60 * 60 * 1000;

let personId = '';
let openConversationId = '';
let hadConversationId = '';

const person = () => usePeopleStore.getState().people.find((p) => p.id === personId)!;

/** Enough extra people that the directory and the person picker show search. */
function addMorePeople() {
  for (const name of ['Ada', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fern', 'Gus', 'Hana']) {
    usePeopleStore.getState().createPerson(name);
  }
}

beforeEach(() => {
  usePeopleStore.setState({ people: [] });
  useConversationsStore.setState({ conversations: [] });
  useMeStore.setState({ profile: {} });

  const people = usePeopleStore.getState();
  personId = people.createPerson('Mom');
  people.setCadence(personId, 7);
  people.logContact(personId, 'call', 'Caught up over coffee');
  const soon = new Date(Date.now() + 5 * DAY);
  people.setBirthday(personId, soon.getMonth() + 1, soon.getDate());
  people.addImportantDate(personId, 'Anniversary', soon.getMonth() + 1, soon.getDate());
  people.addPreference(personId, 'like', 'Gardening');
  people.addPreference(personId, 'gift', 'Loose-leaf tea');
  people.setPersonalityType(personId, 'enneagram', '2');
  people.setPersonalityType(personId, 'attachment', 'secure');
  people.setHowWeMet(personId, 'She raised me');
  people.setNotes(personId, 'Calls on Sunday mornings');
  // Overdue, so Today lists her with the reach-out pill.
  usePeopleStore.setState((st) => ({
    people: st.people.map((p) => (p.id === personId ? { ...p, lastContactedAt: Date.now() - 30 * DAY } : p)),
  }));

  const convs = useConversationsStore.getState();
  openConversationId = convs.createConversation(personId, 'Mom', 'apology');
  convs.setField(openConversationId, 'topic', 'I snapped at her on the phone last weekend');
  hadConversationId = convs.createConversation(null, 'Sam', 'appreciation');
  convs.setField(hadConversationId, 'topic', 'Thanks for covering my shifts');
  convs.markHad(hadConversationId);

  useMeStore.getState().setField('communicate', 'Text first, then call');
});

describe("edge-inset audit — this app's screens", () => {
  it('Settings', async () => {
    expect(
      await auditScreen(<SettingsScreen navigation={navigation} route={route('Settings')} />, {
        readyText: t('settings.notifyTime'),
      })
    ).toEqual([]);
  });

  it('Today', async () => {
    expect(
      await auditScreen(<TodayScreen navigation={navigation} route={route('Today')} />, {
        readyText: 'Mom',
      })
    ).toEqual([]);
  });

  it('Today (caught up)', async () => {
    usePeopleStore.setState({ people: [] });
    expect(
      await auditScreen(<TodayScreen navigation={navigation} route={route('Today')} />, {
        readyText: t('today.caughtUp'),
      })
    ).toEqual([]);
  });

  it('People', async () => {
    addMorePeople();
    expect(
      await auditScreen(<PeopleScreen navigation={navigation} route={route('People')} />, {
        readyText: 'Mom',
      })
    ).toEqual([]);
  });

  it('People (empty, import from contacts)', async () => {
    usePeopleStore.setState({ people: [] });
    expect(
      await auditScreen(<PeopleScreen navigation={navigation} route={route('People')} />, {
        readyText: t('home.importContacts'),
      })
    ).toEqual([]);
  });

  it('Person detail (existing person)', async () => {
    expect(
      await auditScreen(
        <PersonDetailScreen navigation={navigation} route={route('PersonDetail', { personId })} />,
        { readyText: t('person.reachedOut') }
      )
    ).toEqual([]);
  });

  it('Person detail (new person)', async () => {
    expect(
      await auditScreen(<PersonDetailScreen navigation={navigation} route={route('PersonDetail', {})} />, {
        readyText: t('person.cadenceRow'),
      })
    ).toEqual([]);
  });

  it('Conversation detail (to have, linked person)', async () => {
    expect(
      await auditScreen(
        <ConversationDetailScreen
          navigation={navigation}
          route={route('ConversationDetail', { conversationId: openConversationId })}
        />,
        { readyText: t('htc.markHad') }
      )
    ).toEqual([]);
  });

  it('Conversation detail (had)', async () => {
    expect(
      await auditScreen(
        <ConversationDetailScreen
          navigation={navigation}
          route={route('ConversationDetail', { conversationId: hadConversationId })}
        />,
        { readyText: t('htc.reopen') }
      )
    ).toEqual([]);
  });

  it('Have the Conversation', async () => {
    expect(
      await auditScreen(<HTCScreen navigation={navigation} route={route('HTC')} />, {
        readyText: 'Sam',
      })
    ).toEqual([]);
  });

  it('Have the Conversation (empty)', async () => {
    useConversationsStore.setState({ conversations: [] });
    expect(
      await auditScreen(<HTCScreen navigation={navigation} route={route('HTC')} />, {
        readyText: t('htc.empty'),
      })
    ).toEqual([]);
  });

  it('Me', async () => {
    expect(
      await auditScreen(<MeScreen navigation={navigation} route={route('Me')} />, {
        readyText: t('me.share'),
      })
    ).toEqual([]);
  });

  it('Acknowledgements', async () => {
    expect(
      await auditScreen(<Credits onBack={noop} />, { readyText: t('credits.footnote') })
    ).toEqual([]);
  });

  it('Notification time pane', async () => {
    expect(await auditScreen(<NotifyTimePane visible hour={9} onClose={noop} onPick={noop} />)).toEqual([]);
  });

  it('Cadence sheet', async () => {
    expect(await auditScreen(<CadenceSheet visible value={7} onClose={noop} onPick={noop} />)).toEqual([]);
  });

  it('Dates sheet', async () => {
    const p = person();
    expect(
      await auditScreen(
        <DatesSheet
          visible
          birthday={getBirthday(p)}
          otherDates={otherImportantDates(p)}
          onClose={noop}
          onSetBirthday={noop}
          onClearBirthday={noop}
          onAdd={noop}
          onRemove={noop}
        />,
        { readyText: /Anniversary/ }
      )
    ).toEqual([]);
  });

  it('Likes & gifts sheet', async () => {
    expect(
      await auditScreen(
        <PrefsSheet visible preferences={person().preferences} onClose={noop} onAdd={noop} onRemove={noop} />,
        { readyText: 'Gardening' }
      )
    ).toEqual([]);
  });

  it('Personality sheet', async () => {
    expect(
      await auditScreen(<PersonalitySheet visible person={person()} onClose={noop} onPick={noop} />, {
        readyText: t('person.personalityHint'),
      })
    ).toEqual([]);
  });

  it('Notes sheet', async () => {
    expect(
      await auditScreen(
        <PersonTextSheet
          visible
          multiline
          title={t('person.notesLabel')}
          value={person().notes}
          placeholder={t('person.notesPlaceholder')}
          onClose={noop}
          onChange={noop}
        />
      )
    ).toEqual([]);
  });

  it('Contact picker', async () => {
    expect(
      await auditScreen(<ContactPicker visible onClose={noop} onAdd={noop} />, {
        readyText: t('contactPicker.guide'),
      })
    ).toEqual([]);
  });

  it('Person picker', async () => {
    addMorePeople();
    expect(
      await auditScreen(<PersonPicker visible onClose={noop} onSelect={noop} />, {
        readyText: t('htc.chooseExisting'),
      })
    ).toEqual([]);
  });

  it('Have the Conversation intro', async () => {
    expect(
      await auditScreen(<HTCIntro visible onClose={noop} />, { readyText: t('htc.introTitle') })
    ).toEqual([]);
  });

  it('Tip jar sheet', async () => {
    expect(
      await auditScreen(<TipJarSheet visible onDismiss={noop} productIds={TIP_PRODUCT_IDS} />, {
        readyText: t('tip.title'),
      })
    ).toEqual([]);
  });

  it('Launch notice', async () => {
    expect(
      await auditScreen(<LaunchNoticeModal visible onDismiss={noop} />, {
        readyText: t('launchNotice.title'),
      })
    ).toEqual([]);
  });

  it('Review prompt (no native sheet)', async () => {
    expect(
      await auditScreen(
        <ReviewModal
          visible
          onDismiss={noop}
          appName="Tend"
          iosAppStoreId="0"
          androidPackageName="com.joshapproved.tend"
        />,
        { readyText: t('about.review') }
      )
    ).toEqual([]);
  });
});
