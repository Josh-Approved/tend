/**
 * Component test — Voice Control can actually drive the reach-out pill.
 *
 * Voice Control works by letting someone say the words printed on a control; it
 * matches those words against the accessibility label. The pill on Today used to
 * be labelled "Mark reached out to {name}" while the words on it read "Reached
 * out" — so the visible name sat mid-phrase in English, and LAST in German
 * ("Bei Ada gemeldet markieren") and Japanese ("Adaに連絡したことを記録"). The
 * button was unspeakable, in an app whose App Store page claims Voice Control
 * support.
 *
 * The property under test is the one that has to hold in every language, not
 * just English: the accessible name IS the visible name. There is no linter rule
 * for this, so this test is the net.
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
// The pull-to-reveal funding footer is reanimated-backed and irrelevant to what
// the pill is called; stubbing it keeps this test off the worklets runtime.
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
import { t, setLocaleStrings, resetToBaseStrings } from '../../i18n';
import { LOCALES } from '../../i18n/locales';

const mockState: { people: Person[]; logContact: jest.Mock } = {
  people: [],
  logContact: jest.fn(),
};
jest.mock('../../store/people', () => ({
  usePeopleStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}));

import TodayScreen from '../TodayScreen';

/** Someone with a cadence and a long-past last contact — i.e. overdue, so the
 *  reach-out pill renders. */
function overduePerson(name: string): Person {
  const p = makePerson(name);
  return { ...p, cadenceDays: 7, lastContactedAt: Date.now() - 90 * 24 * 60 * 60 * 1000 };
}

function renderToday() {
  const navigation = { navigate: jest.fn() };
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <TodayScreen navigation={navigation as any} route={{ key: 'Today', name: 'Today' } as any} />
    </SafeAreaProvider>
  );
}

describe('Today reach-out pill — speakable name', () => {
  afterEach(() => resetToBaseStrings());

  it('is reachable by the words printed on it', async () => {
    mockState.people = [overduePerson('Ada')];

    await renderToday();

    // The visible text and the accessible name are the same string, so a Voice
    // Control user saying what they can read hits the button.
    expect(screen.getByRole('button', { name: 'Reached out' })).toBeTruthy();
    // The person's name still reaches VoiceOver — via the hint, which Voice
    // Control ignores.
    expect(screen.getByRole('button', { name: 'Reached out' }).props.accessibilityHint).toBe(
      'Logs that you reached out to Ada today.'
    );
  });

  it.each(['de', 'ja', 'fr', 'es', 'it', 'pt-BR'] as const)(
    'keeps the accessible name equal to the visible name in %s',
    async (locale) => {
      setLocaleStrings(LOCALES[locale]);
      mockState.people = [overduePerson('Ada')];

      await renderToday();

      // The verb-final languages are where a "Mark reached out to {name}" label
      // put the visible word last and broke the match.
      const visible = t('today.reachedOut');
      expect(screen.getByRole('button', { name: visible })).toBeTruthy();
    }
  );
});
