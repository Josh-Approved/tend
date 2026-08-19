/**
 * Component test — Today's header control (Uplevel-3 T3 action coverage).
 *
 * Today is the tab the app opens on, so the gear here is the only route into
 * Settings a first-run user is guaranteed to meet. It renders on the empty
 * ("caught up") state as well as the populated one, and both are asserted —
 * losing it behind the empty branch would strand someone with no people yet.
 *
 * The list actions on this screen (the reach-out pill and the rows) have their
 * own tests; this one is about the chrome.
 */

import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
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
// The pull-to-reveal funding footer is reanimated-backed and irrelevant to the
// header; stubbing it keeps this test off the worklets runtime.
jest.mock('../../components/FundingFooter', () => ({ FundingFooter: () => null }));
jest.mock('../../components/usePullRevealFooter', () => ({
  usePullRevealFooter: () => ({
    pullToReveal: false,
    reveal: undefined,
    gesture: { current: undefined },
    onScrollJS: undefined,
    onScrollViewLayout: undefined,
    onContentSizeChange: undefined,
  }),
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

import { makePerson, type Person } from '../../data/person';

const mockState: { people: Person[]; logContact: jest.Mock } = {
  people: [],
  logContact: jest.fn(),
};
jest.mock('../../store/people', () => ({
  usePeopleStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}));

import TodayScreen from '../TodayScreen';

const navigation = { navigate: jest.fn() };

function renderToday() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TodayScreen navigation={navigation as any} route={{ key: 'Today', name: 'Today' } as any} />
    </SafeAreaProvider>
  );
}

/** Someone overdue, so the populated branch of the screen renders. */
function overduePerson(name: string): Person {
  const p = makePerson(name);
  return { ...p, cadenceDays: 7, lastContactedAt: Date.now() - 90 * 24 * 60 * 60 * 1000 };
}

describe('TodayScreen header', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockState.people = [];
  });

  it('opens Settings from the gear when there is nothing due', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderToday();

    await user.press(screen.getByRole('button', { name: 'Settings' }));

    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
  });

  it('opens Settings from the gear when people are due', async () => {
    mockState.people = [overduePerson('Ada')];
    const user = userEvent.setup({ delay: 0 });
    await renderToday();

    await user.press(screen.getByRole('button', { name: 'Settings' }));

    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
  });
});
