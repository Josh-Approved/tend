/**
 * Component test — Voice Control can actually drive the linked-person row.
 *
 * Voice Control activates a control by its accessible NAME: someone says the
 * words they can see and iOS matches them against `accessibilityLabel`. The row
 * that shows who a conversation is linked to prints the PERSON'S NAME, and it
 * used to be labelled with the bare verb ("Change" / "Ändern" / "変更"). So a
 * user reading "Mom" off the screen and saying "Mom" matched nothing — in every
 * one of the seven languages this app ships, not just the awkward ones. That is
 * defect tend-20260809-1.
 *
 * The property this pins is the one that has to hold per locale: the accessible
 * name STARTS WITH the visible person name, with the action word after it.
 *
 * These read `props.accessibilityLabel` DIRECTLY rather than querying
 * `getByRole('button', { name })`. That query resolves the accessible name from
 * the label when one is set and falls back to child text when it isn't, so a
 * name-based query would have happily found this button on the broken code — it
 * is exactly the assertion that cannot catch this bug.
 *
 * Companion to TodayScreen.voiceControl.test.tsx, which pins the same rule on
 * the reach-out pill.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: () => Promise.resolve(),
}));
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
// The store's durable layer — the in-memory state is what the screen reads, so
// stubbing SQLite keeps the real mutators.
jest.mock('../../store/db', () => ({
  loadAllConversations: jest.fn(async () => []),
  saveConversation: jest.fn(async () => {}),
  deleteConversationFromDb: jest.fn(async () => {}),
}));
jest.mock('../../storage/kv', () => ({ putTombstone: jest.fn(async () => {}) }));
jest.mock('../../qa/qaMode', () => ({ QA_MODE: false }));
jest.mock('../../qa/fixtures', () => ({ qaConversations: () => [] }));
// Lets store/people load (its lib/contacts pulls expo-contacts at import time).
jest.mock('expo-contacts/legacy', () => ({
  Fields: {},
  SortTypes: {},
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));

import { useConversationsStore } from '../../store/conversations';
import { usePeopleStore } from '../../store/people';
import { makePerson } from '../../data/person';
import { t, setLocaleStrings, resetToBaseStrings, CANONICAL_LOCALES } from '../../i18n';
import { LOCALES } from '../../i18n/locales';
import ConversationDetailScreen from '../ConversationDetailScreen';

const nav = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

async function renderDetail(id: string) {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ConversationDetailScreen
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={nav as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={{ key: 'd', name: 'ConversationDetail', params: { conversationId: id } } as any}
      />
    </SafeAreaProvider>
  );
}

/** A conversation linked to a real person, with enough written in it that the
 *  leave-guard won't discard it. */
function seedLinked(personName: string): string {
  const person = makePerson(personName);
  usePeopleStore.setState({ people: [person] });
  const id = useConversationsStore.getState().createConversation(person.id, personName);
  useConversationsStore.getState().setField(id, 'topic', 'The thing we keep not saying');
  return id;
}

/**
 * The pressable whose PRINTED text is `visible`, found without going anywhere
 * near its accessible name — the screen header prints the same person name, so
 * this walks up from each matching text node and keeps the one that sits inside
 * a button. Locating this way is what makes the test able to fail: a
 * name-based query would simply not find the control on the broken label and
 * report "unable to find an element" instead of showing the wrong name.
 */
function rowLabelledBy(visible: string): string | undefined {
  for (const node of screen.getAllByText(visible)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let cur: any = node.parent;
    while (cur) {
      if (cur.props?.accessibilityRole === 'button') return cur.props.accessibilityLabel;
      cur = cur.parent;
    }
  }
  return undefined;
}

/** English (no overlay) plus every locale the app ships. */
const CASES: string[] = ['en', ...CANONICAL_LOCALES];

describe('Conversation detail linked-person row — speakable name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useConversationsStore.setState({ conversations: [] });
    usePeopleStore.setState({ people: [] });
  });
  afterEach(() => resetToBaseStrings());

  describe.each(CASES)('%s', (locale) => {
    beforeEach(() => {
      if (locale === 'en') resetToBaseStrings();
      else setLocaleStrings(LOCALES[locale]);
    });

    it('names the row with the person name a user can read on it, first', async () => {
      await renderDetail(seedLinked('Mom'));

      const label = rowLabelledBy('Mom');

      // The whole point: saying the visible name matches, because the accessible
      // name LEADS with it. A label that merely contains the name — or drops it
      // for a bare verb, as the pre-fix code did — fails here.
      expect(label).toBeDefined();
      expect(label?.startsWith('Mom')).toBe(true);
      // …and the action word printed on the row is still in the name, after it.
      expect(label).toContain(t('htc.changePerson'));
      expect(label).toBe(`Mom${t('htc.changePersonSuffix')}`);
    });

    it('falls back to the visible placeholder name when the person is unnamed', async () => {
      // A linked conversation whose name field has been emptied prints
      // "someone" (localised); the accessible name must lead with THAT.
      const person = makePerson('Mom');
      usePeopleStore.setState({ people: [person] });
      const id = useConversationsStore.getState().createConversation(person.id, '   ');
      useConversationsStore.getState().setField(id, 'topic', 'The thing we keep not saying');
      await renderDetail(id);

      const visible = t('htc.someone');
      const label = rowLabelledBy(visible);

      expect(label).toBeDefined();
      expect(label?.startsWith(visible)).toBe(true);
    });
  });
});
