/**
 * Component test — the person hub's own controls (Uplevel-3 T3 action coverage).
 *
 * This screen has two modes and both can lose work. In NEW mode nothing is
 * written until Save, so the tests assert the store is still empty until the
 * user commits, and that a blank name can't commit at all. In EDIT mode the
 * controls covered here are the ones with consequences: logging a catch-up,
 * starting a conversation about this person, and removing them.
 *
 * Removal goes through a destructive confirm, so the Alert is driven for real —
 * pressing "Remove this person" must NOT delete anything on its own; only the
 * confirm button does.
 *
 * The people/conversations stores are the REAL ones (only their SQLite layer is
 * stubbed), so each press is asserted against the record the store actually
 * holds afterwards rather than against a spy.
 */

import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
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
// The stores' durable layer — in-memory state is what the screen reads.
jest.mock('../../store/db', () => ({
  loadAllPeople: jest.fn(async () => []),
  savePerson: jest.fn(async () => {}),
  deletePersonFromDb: jest.fn(async () => {}),
  loadAllConversations: jest.fn(async () => []),
  saveConversation: jest.fn(async () => {}),
  deleteConversationFromDb: jest.fn(async () => {}),
}));
jest.mock('../../storage/kv', () => ({ putTombstone: jest.fn(async () => {}) }));
// Reminder scheduling is an OS side effect, not part of what a press does here.
jest.mock('../../lib/reminderAdapter', () => ({
  optInToReminders: jest.fn(async () => {}),
  syncAppReminders: jest.fn(async () => {}),
}));
jest.mock('../../qa/qaMode', () => ({ QA_MODE: false }));
jest.mock('../../qa/fixtures', () => ({ qaPeople: () => [], qaConversations: () => [] }));
jest.mock('expo-contacts/legacy', () => ({
  Fields: {},
  SortTypes: {},
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));

import { usePeopleStore } from '../../store/people';
import { useConversationsStore } from '../../store/conversations';
import PersonDetailScreen from '../PersonDetailScreen';

const nav = { goBack: jest.fn(), navigate: jest.fn(), replace: jest.fn() };

async function renderDetail(personId?: string) {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PersonDetailScreen
        // The screen only touches goBack/navigate/replace; the rest of the
        // react-navigation prop surface has no bearing on what is on screen.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={nav as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={{ key: 'PersonDetail', name: 'PersonDetail', params: { personId } } as any}
      />
    </SafeAreaProvider>
  );
}

function people() {
  return usePeopleStore.getState().people;
}

describe('PersonDetailScreen — new person', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    usePeopleStore.setState({ people: [] });
    useConversationsStore.setState({ conversations: [] });
  });

  it('creates nobody until Save, then opens the person it created', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderDetail(undefined);

    await user.type(screen.getByLabelText('Their name'), 'Ada');
    // Typing alone writes nothing — backing out here must leave no record.
    expect(people()).toHaveLength(0);

    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(people()).toHaveLength(1);
    expect(people()[0].name).toBe('Ada');
    // replace, not push — back from the saved person goes to the directory,
    // never to a stale draft of the same person.
    expect(nav.replace).toHaveBeenCalledWith('PersonDetail', { personId: people()[0].id });
  });

  it('saves from the keyboard return as well as the button', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderDetail(undefined);

    await user.type(screen.getByLabelText('Their name'), 'Ada', { submitEditing: true });

    expect(people()).toHaveLength(1);
    expect(people()[0].name).toBe('Ada');
  });

  it('refuses to save a blank name', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderDetail(undefined);

    await user.type(screen.getByLabelText('Their name'), '   ', { submitEditing: true });
    await user.press(screen.getByRole('button', { name: 'Save' }));

    expect(people()).toHaveLength(0);
    expect(nav.replace).not.toHaveBeenCalled();
  });
});

describe('PersonDetailScreen — existing person', () => {
  let id: string;

  beforeEach(() => {
    jest.clearAllMocks();
    usePeopleStore.setState({ people: [] });
    useConversationsStore.setState({ conversations: [] });
    id = usePeopleStore.getState().createPerson('Ada');
  });

  it('logs a catch-up and clears the note', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderDetail(id);

    await user.type(screen.getByLabelText('What did you talk about? (optional)'), 'Caught up over coffee');
    await user.press(screen.getByRole('button', { name: 'I reached out' }));

    const logged = people()[0];
    expect(logged.interactions).toHaveLength(1);
    expect(logged.interactions[0].note).toBe('Caught up over coffee');
    expect(logged.lastContactedAt).not.toBeNull();
    // The note box empties, so the next catch-up doesn't inherit this one's note.
    expect(screen.getByLabelText('What did you talk about? (optional)').props.value).toBe('');
  });

  it('starts a conversation linked to this person and opens it', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderDetail(id);

    await user.press(screen.getByRole('button', { name: 'Start a conversation' }));

    const created = useConversationsStore.getState().conversations;
    expect(created).toHaveLength(1);
    expect(created[0].personId).toBe(id);
    expect(nav.navigate).toHaveBeenCalledWith('ConversationDetail', {
      conversationId: created[0].id,
    });
  });

  it('asks before removing, and removes only once confirmed', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const user = userEvent.setup({ delay: 0 });
    await renderDetail(id);

    await user.press(screen.getByRole('button', { name: 'Remove this person' }));

    // The press itself deletes nothing — everything saved about a person is at
    // stake, so it costs one deliberate extra tap.
    expect(people()).toHaveLength(1);
    expect(alert).toHaveBeenCalledTimes(1);
    const [title, , buttons] = alert.mock.calls[0] as unknown as [
      string,
      string,
      { text: string; style?: string; onPress?: () => void }[],
    ];
    expect(title).toContain('Ada');
    expect(buttons.find((b) => b.style === 'cancel')).toBeTruthy();

    const confirm = buttons.find((b) => b.style === 'destructive');
    expect(confirm).toBeTruthy();
    confirm!.onPress!();

    await waitFor(() => expect(people()).toHaveLength(0));
    expect(nav.goBack).toHaveBeenCalled();
    alert.mockRestore();
  });
});
