/**
 * Component test — the Have the Conversation tab's action surface.
 *
 * Three controls sit in this tab besides the list itself: the info button that
 * reopens the concept intro, the gear, and the + that starts a conversation.
 * Tapping a listed conversation opens it. The conversations store is the real
 * one (SQLite stubbed), so starting a conversation is asserted against the
 * record that actually gets created and the id the screen navigates to.
 */

import React from 'react';
import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
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
jest.mock('../../store/db', () => ({
  loadAllConversations: jest.fn(async () => []),
  saveConversation: jest.fn(async () => {}),
  deleteConversationFromDb: jest.fn(async () => {}),
}));
// The screen reads/writes one app setting: whether the intro has been seen.
// Backing it with a plain object keeps the first-run branch real.
const mockSettings: Record<string, string> = {};
jest.mock('../../storage/kv', () => ({
  putTombstone: jest.fn(async () => {}),
  getAppSetting: jest.fn(async (k: string) => mockSettings[k] ?? null),
  setAppSetting: jest.fn(async (k: string, v: string) => {
    mockSettings[k] = v;
  }),
}));
jest.mock('../../qa/qaMode', () => ({ QA_MODE: false }));
jest.mock('../../qa/fixtures', () => ({ qaConversations: () => [] }));
jest.mock('expo-contacts/legacy', () => ({
  Fields: {},
  SortTypes: {},
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));

import { useConversationsStore } from '../../store/conversations';
import { usePeopleStore } from '../../store/people';
import HTCScreen from '../HTCScreen';

const nav = { navigate: jest.fn() };

async function renderHTC() {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <HTCScreen navigation={nav as any} route={{ key: 'HTC', name: 'HTC' } as any} />
    </SafeAreaProvider>
  );
}

describe('HTCScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useConversationsStore.setState({ conversations: [] });
    usePeopleStore.setState({ people: [] });
    // Returning users: the intro has been seen, so it isn't in the way.
    mockSettings['htc.introSeen'] = '1';
  });

  it('opens the conversation you tap', async () => {
    const user = userEvent.setup({ delay: 0 });
    const id = useConversationsStore.getState().createConversation(null, 'Mom');
    await renderHTC();

    await user.press(screen.getByRole('button', { name: 'Mom' }));

    expect(nav.navigate).toHaveBeenCalledWith('ConversationDetail', { conversationId: id });
  });

  it('reopens the concept intro from the info button', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderHTC();

    expect(screen.queryByText('Have the conversation')).toBeNull();
    await user.press(screen.getByRole('button', { name: 'What is this?' }));

    expect(screen.getByText('Have the conversation')).toBeTruthy();
  });

  it('opens Settings from the gear', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderHTC();

    await user.press(screen.getByRole('button', { name: 'Settings' }));

    expect(nav.navigate).toHaveBeenCalledWith('Settings');
  });

  it('starts a conversation from the + and opens the new record', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderHTC();

    await user.press(screen.getByRole('button', { name: 'Start a conversation' }));
    // The + asks who it's with first — nothing is created until that's answered.
    expect(screen.getByRole('header', { name: 'Who is this with?' })).toBeTruthy();
    expect(useConversationsStore.getState().conversations).toHaveLength(0);

    await user.press(screen.getByRole('button', { name: 'Someone new' }));

    const created = useConversationsStore.getState().conversations;
    expect(created).toHaveLength(1);
    expect(nav.navigate).toHaveBeenCalledWith('ConversationDetail', {
      conversationId: created[0].id,
    });
  });

  it('shows the intro unprompted the very first time the tab is opened', async () => {
    delete mockSettings['htc.introSeen'];
    const user = userEvent.setup({ delay: 0 });
    await renderHTC();

    await waitFor(() => expect(screen.getByText('Have the conversation')).toBeTruthy());

    // Dismissing it records that it was seen, so it never ambushes twice.
    await user.press(screen.getByRole('button', { name: 'Got it' }));
    await waitFor(() => expect(mockSettings['htc.introSeen']).toBe('1'));
  });
});
