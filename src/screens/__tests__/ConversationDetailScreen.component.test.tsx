/**
 * Component test — the conversation detail form's action surface.
 *
 * This is the screen where a whole conversation lives, so every control here is
 * one a user can lose work with: linking it to a person, changing what kind of
 * conversation it is, marking it had, reopening it, deleting it, and leaving.
 *
 * The conversations store is the REAL one (only its SQLite layer is stubbed), so
 * each press is asserted against the record the store actually holds afterwards
 * — not against a spy that would still pass if the mutation were wrong.
 */

import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
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
import ConversationDetailScreen from '../ConversationDetailScreen';

const nav = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

function conversation() {
  return useConversationsStore.getState().conversations[0];
}

async function renderDetail(id: string) {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <ConversationDetailScreen
        // The screen only touches goBack/navigate/addListener; the rest of the
        // react-navigation prop surface has no bearing on what is on screen.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={nav as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={{ key: 'd', name: 'ConversationDetail', params: { conversationId: id } } as any}
      />
    </SafeAreaProvider>
  );
}

/** A conversation with enough written in it that the leave-guard won't discard it. */
function seedConversation(personId: string | null = null, personName = ''): string {
  const id = useConversationsStore.getState().createConversation(personId, personName);
  useConversationsStore.getState().setField(id, 'topic', 'The thing we keep not saying');
  return id;
}

describe('ConversationDetailScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useConversationsStore.setState({ conversations: [] });
    usePeopleStore.setState({ people: [] });
  });

  it('offers a way to link an unlinked conversation to someone you track', async () => {
    const user = userEvent.setup({ delay: 0 });
    usePeopleStore.setState({ people: [makePerson('Mom')] });
    await renderDetail(seedConversation());

    await user.press(screen.getByRole('button', { name: 'Choose from your people' }));

    // The picker is up, offering the people directory.
    expect(screen.getByRole('button', { name: 'Someone new' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mom' })).toBeTruthy();
  });

  it('reopens the picker from Change once the conversation is linked', async () => {
    const user = userEvent.setup({ delay: 0 });
    const mom = makePerson('Mom');
    usePeopleStore.setState({ people: [mom] });
    await renderDetail(seedConversation(mom.id, 'Mom'));

    // A linked conversation swaps the invitation for a Change control...
    expect(screen.queryByRole('button', { name: 'Choose from your people' })).toBeNull();
    await user.press(screen.getByRole('button', { name: 'Change' }));

    expect(screen.getByRole('button', { name: 'Someone new' })).toBeTruthy();
  });

  it('changes what kind of conversation this is when a flavor chip is picked', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderDetail(seedConversation());
    expect(conversation().flavor).toBe('open');

    await user.press(screen.getByRole('button', { name: 'An apology I owe' }));

    expect(conversation().flavor).toBe('apology');
    // The apology flavor brings its own prompts with it — the chip is not just
    // a label, it re-tailors the form.
    expect(screen.getByLabelText('I’m sorry for…')).toBeTruthy();
  });

  it('marks the conversation had, and offers the reflection', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderDetail(seedConversation());

    await user.press(screen.getByRole('button', { name: 'We had this conversation' }));

    expect(conversation().status).toBe('had');
    expect(screen.getByLabelText('How did it go?')).toBeTruthy();
  });

  it('puts a had conversation back on the list to have', async () => {
    const user = userEvent.setup({ delay: 0 });
    const id = seedConversation();
    useConversationsStore.getState().markHad(id);
    await renderDetail(id);

    await user.press(screen.getByRole('button', { name: 'Mark as still to have' }));

    expect(conversation().status).not.toBe('had');
    expect(screen.getByRole('button', { name: 'We had this conversation' })).toBeTruthy();
  });

  it('asks before deleting, and only deletes once confirmed', async () => {
    const user = userEvent.setup({ delay: 0 });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    await renderDetail(seedConversation());

    await user.press(screen.getByRole('button', { name: 'Delete this conversation' }));

    // Nothing is gone yet — a destructive action confirms first (canon § UX).
    expect(useConversationsStore.getState().conversations).toHaveLength(1);
    expect(alert).toHaveBeenCalledTimes(1);

    const [, , buttons] = alert.mock.calls[0];
    const confirm = (buttons ?? []).find((b) => b.style === 'destructive');
    expect(confirm).toBeTruthy();
    confirm!.onPress!();

    expect(useConversationsStore.getState().conversations).toHaveLength(0);
    expect(nav.goBack).toHaveBeenCalled();
  });

  it('leaves the screen from Save, keeping what was written', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderDetail(seedConversation());

    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(nav.goBack).toHaveBeenCalledTimes(1);
    // Everything auto-saves as you type, so Save is commit-and-exit — the record
    // must survive the exit, not be re-written by it.
    expect(conversation().topic).toBe('The thing we keep not saying');
  });
});
