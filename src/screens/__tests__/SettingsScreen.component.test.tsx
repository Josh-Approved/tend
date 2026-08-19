/**
 * Component test — the birthday-reminders switch (Uplevel-3 T3 action coverage).
 *
 * This is the app's only notification opt-out, so the failure it guards against
 * is a switch that moves on screen while the alarms keep firing. The toggle has
 * to do two things in order: persist the choice, then re-sync the armed OS
 * reminders — turning it off cancels them, turning it back on re-arms them.
 * A switch wired to state alone would look correct and change nothing.
 *
 * The stored value is also read back on mount: a switch that always renders ON
 * would tell someone who opted out that they hadn't.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
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
jest.mock('../../qa/qaMode', () => ({ QA_MODE: false }));
jest.mock('../../qa/fixtures', () => ({ qaPeople: () => [], qaConversations: () => [] }));
jest.mock('expo-contacts/legacy', () => ({
  Fields: {},
  SortTypes: {},
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));
// Export/import touch the file system; nothing on this screen's toggle path.
jest.mock('../../lib/transfer', () => ({
  exportData: jest.fn(async () => {}),
  pickAndParseData: jest.fn(async () => ({ people: [], conversations: [], me: null })),
}));
// The tip jar opens a billing connection when mounted.
jest.mock('../../lib/tipJar', () => ({
  isStoreKnownUnavailable: () => true,
  useTipJar: () => ({ status: 'unavailable', products: [], pendingSku: null, tip: jest.fn() }),
}));
jest.mock('../../components/MoreFromJA', () => ({ MoreFromJA: () => null }));
jest.mock('../../feedback/FeedbackProvider', () => ({
  useFeedback: () => ({ open: jest.fn() }),
}));

// The reminder adapter IS the thing under test at the seam — the switch has to
// reach both halves of it. (Prefixed `mock` for jest's hoisted factory.)
const mockGetEnabled = jest.fn<Promise<boolean>, []>(async () => true);
const mockSetEnabled = jest.fn<Promise<void>, [boolean]>(async () => {});
const mockSyncAppReminders = jest.fn<Promise<void>, [unknown]>(async () => {});
jest.mock('../../lib/reminderAdapter', () => ({
  getBirthdayRemindersEnabled: () => mockGetEnabled(),
  setBirthdayRemindersEnabled: (v: boolean) => mockSetEnabled(v),
  syncAppReminders: (people: unknown) => mockSyncAppReminders(people),
  optInToReminders: jest.fn(async () => {}),
}));

import SettingsScreen from '../SettingsScreen';

const nav = { goBack: jest.fn(), navigate: jest.fn() };

async function renderSettings() {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <SettingsScreen
        // The screen only touches goBack/navigate; the rest of the
        // react-navigation prop surface has no bearing on what is on screen.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        navigation={nav as any}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        route={{ key: 'Settings', name: 'Settings' } as any}
      />
    </SafeAreaProvider>
  );
}

function birthdaySwitch() {
  return screen.getByRole('switch', { name: 'Birthday reminders' });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockGetEnabled.mockResolvedValue(true);
});

describe('SettingsScreen — birthday reminders', () => {
  it('persists the opt-out and re-syncs the armed reminders', async () => {
    await renderSettings();

    fireEvent(birthdaySwitch(), 'valueChange', false);

    expect(mockSetEnabled).toHaveBeenCalledWith(false);
    // Storing the preference is not enough — the alarms already armed with the
    // OS have to be cancelled, or the switch lies.
    await waitFor(() => expect(mockSyncAppReminders).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(birthdaySwitch().props.accessibilityState).toMatchObject({ checked: false })
    );
  });

  it('re-arms them when switched back on', async () => {
    mockGetEnabled.mockResolvedValue(false);
    await renderSettings();

    await waitFor(() =>
      expect(birthdaySwitch().props.accessibilityState).toMatchObject({ checked: false })
    );

    fireEvent(birthdaySwitch(), 'valueChange', true);

    expect(mockSetEnabled).toHaveBeenCalledWith(true);
    await waitFor(() => expect(mockSyncAppReminders).toHaveBeenCalledTimes(1));
  });

  it('shows the stored choice on arrival rather than defaulting to on', async () => {
    mockGetEnabled.mockResolvedValue(false);
    await renderSettings();

    await waitFor(() =>
      expect(birthdaySwitch().props.accessibilityState).toMatchObject({ checked: false })
    );
    expect(mockSetEnabled).not.toHaveBeenCalled();
  });
});
