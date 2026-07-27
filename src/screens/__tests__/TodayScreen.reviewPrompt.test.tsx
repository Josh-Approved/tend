/**
 * Regression test for defect tend-20260708-1 — the review prompt shipped synced
 * but DEAD: nothing called recordSuccessfulCompletion and nothing mounted
 * <ReviewModal>, so the prompt could never appear on either platform.
 *
 * The success moment is logging a catch-up. This proves the whole path from the
 * Today tab's one-tap "Reached out" pill: the contact is logged, the canonical
 * completion counter is advanced, and when the canonical framework says this
 * completion should prompt, the modal actually appears. It fails against the
 * pre-fix screen (which called logContact alone).
 *
 * Only the two seams are mocked — the people store (a fixed overdue roster) and
 * the canonical reviewPrompt storage (so the framework's own thresholds are
 * tested in its own suite, not re-asserted here). Queries go by role/label.
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

// The pull-to-reveal funding footer rides on reanimated worklets, which have no
// native half under jest. Stub the two modules that pull it in — neither is part
// of what this test proves.
jest.mock('../../components/FundingFooter', () => ({ FundingFooter: () => null }));
jest.mock('../../components/usePullRevealFooter', () => ({
  usePullRevealFooter: () => ({
    pullToReveal: { value: 0 },
    reveal: { value: 0 },
    gesture: { toGestureArray: () => [] },
    onScrollJS: () => {},
    onScrollViewLayout: () => {},
    onContentSizeChange: () => {},
  }),
}));
jest.mock('react-native-gesture-handler', () => ({
  GestureDetector: ({ children }: { children: React.ReactNode }) => children,
}));

// The canonical trigger framework — mocked so this test asserts the WIRING
// (called once per logged catch-up, modal shown when it says so), not the
// thresholds, which reviewPrompt owns.
jest.mock('../../storage/reviewPrompt', () => ({
  recordSuccessfulCompletion: jest.fn(),
  markReviewPromptShown: jest.fn(() => Promise.resolve()),
  dismissReviewPrompt: jest.fn(() => Promise.resolve()),
  markReviewOpened: jest.fn(() => Promise.resolve()),
}));

// A fixed roster with one long-overdue person, so the "Reach out" section and
// its one-tap pill render. Prefixed `mock` so the factory may close over it.
const mockLogContact = jest.fn();
const DAY = 24 * 60 * 60 * 1000;
const mockPeopleState = {
  people: [
    {
      id: 'p1',
      name: 'Ada',
      cadenceDays: 7,
      lastContactedAt: Date.now() - 60 * DAY,
      createdAt: Date.now() - 90 * DAY,
      updatedAt: Date.now() - 60 * DAY,
      notes: '',
      howWeMet: '',
      interactions: [],
      importantDates: [],
      preferences: [],
      personality: {},
    },
  ],
  logContact: mockLogContact,
};
jest.mock('../../store/people', () => ({
  usePeopleStore: (selector: (s: typeof mockPeopleState) => unknown) => selector(mockPeopleState),
}));

import TodayScreen from '../TodayScreen';
import { recordSuccessfulCompletion } from '../../storage/reviewPrompt';

const mockRecord = recordSuccessfulCompletion as jest.MockedFunction<
  typeof recordSuccessfulCompletion
>;

async function renderToday() {
  const navigation = { navigate: jest.fn() } as never;
  const r = await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <TodayScreen navigation={navigation} route={{ key: 'Today', name: 'Today' } as never} />
    </SafeAreaProvider>
  );
  return r;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Today — review prompt wiring (tend-20260708-1)', () => {
  it('logging a catch-up records a completion and shows the modal when eligible', async () => {
    mockRecord.mockResolvedValue(true);
    const user = userEvent.setup();
    await renderToday();

    // The one-tap pill is labelled "Mark <name> as reached out" — pressing it
    // is the success moment.
    const pill = await screen.findByRole('button', { name: /reached out/i });
    await user.press(pill);

    expect(mockLogContact).toHaveBeenCalledWith('p1');
    expect(mockRecord).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(screen.getByText(/leave a review/i)).toBeOnTheScreen());
  });

  it('does not show the modal when the framework says this completion is not the one', async () => {
    mockRecord.mockResolvedValue(false);
    const user = userEvent.setup();
    await renderToday();

    await user.press(screen.getByRole('button', { name: /reached out/i }));

    expect(mockRecord).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mockLogContact).toHaveBeenCalled());
    expect(screen.queryByText(/leave a review/i)).toBeNull();
  });

  it('never fires on mount — the prompt is a completion, not a launch', async () => {
    mockRecord.mockResolvedValue(false);
    await renderToday();
    expect(mockRecord).not.toHaveBeenCalled();
  });
});
