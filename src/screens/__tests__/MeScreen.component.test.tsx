/**
 * Component test — the Me tab's two controls (Uplevel-3 T3 action coverage).
 *
 * The gear, and "Share my manual". Sharing is the only place in the app where
 * something a user wrote can leave the device, so the assertions are about the
 * two things that matter: it hands the OS share sheet the composed manual (not
 * an empty or half-built string), and it is inert while there is nothing to
 * share, so a stray tap on a blank manual can't open a share sheet at all.
 *
 * The me store is the REAL one (only its settings layer is stubbed), so the
 * shared text is asserted against what the store actually holds.
 */

import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { Share } from 'react-native';
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
// The store's durable layer — in-memory state is what the screen reads.
jest.mock('../../storage/kv', () => ({
  getAppSetting: jest.fn(async () => null),
  setAppSetting: jest.fn(async () => {}),
}));
jest.mock('../../qa/qaMode', () => ({ QA_MODE: false }));
jest.mock('../../qa/fixtures', () => ({ qaMeProfile: () => ({}) }));

import { useMeStore } from '../../store/me';
import MeScreen from '../MeScreen';

const nav = { navigate: jest.fn() };

async function renderMe() {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <MeScreen navigation={nav as any} route={{ key: 'Me', name: 'Me' } as any} />
    </SafeAreaProvider>
  );
}

describe('MeScreen', () => {
  let share: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    useMeStore.setState({ profile: {}, hydrated: true });
    share = jest.spyOn(Share, 'share').mockResolvedValue({ action: 'sharedAction' } as never);
  });

  afterEach(() => share.mockRestore());

  it('opens Settings from the gear', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderMe();

    await user.press(screen.getByRole('button', { name: 'Settings' }));

    expect(nav.navigate).toHaveBeenCalledWith('Settings');
  });

  it('hands the composed manual to the share sheet', async () => {
    useMeStore.setState({ profile: { fillsMeUp: 'Mornings, before anyone talks to me.' } });
    const user = userEvent.setup({ delay: 0 });
    await renderMe();

    await user.press(screen.getByRole('button', { name: 'Share my manual' }));

    expect(share).toHaveBeenCalledTimes(1);
    const message = share.mock.calls[0][0].message as string;
    // What the user wrote is in it, under its prompt's heading — a share that
    // dropped either would read as an empty manual to whoever received it.
    expect(message).toContain('Mornings, before anyone talks to me.');
    expect(message.length).toBeGreaterThan('Mornings, before anyone talks to me.'.length);
  });

  it('does not open a share sheet while the manual is empty', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderMe();

    await user.press(screen.getByRole('button', { name: 'Share my manual' }));

    expect(share).not.toHaveBeenCalled();
  });
});
