/**
 * Component test — the important-dates sheet's controls (Uplevel-3 T3 action
 * coverage).
 *
 * Two things here can lose data or quietly do nothing: the Trash next to a
 * stored date (birthday or otherwise), and the + that files a new one. The +
 * refuses an out-of-range month/day rather than storing a date that can never
 * come round — so "does nothing" is the correct behaviour there and is asserted
 * as such, not left ambiguous.
 *
 * The sheet is a controlled component: it reports what the user did through its
 * callbacks and the screen owns the store, so the callbacks ARE the outcome.
 */

import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { ImportantDate } from '../../data/person';

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

import { DatesSheet } from '../DatesSheet';

const handlers = {
  onClose: jest.fn(),
  onSetBirthday: jest.fn(),
  onClearBirthday: jest.fn(),
  onAdd: jest.fn(),
  onRemove: jest.fn(),
};

function anniversary(): ImportantDate {
  return { id: 'd1', label: 'Anniversary', month: 9, day: 14 };
}

async function renderSheet(opts: { birthday?: ImportantDate; otherDates?: ImportantDate[] } = {}) {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <DatesSheet
        visible
        birthday={opts.birthday}
        otherDates={opts.otherDates ?? []}
        {...handlers}
      />
    </SafeAreaProvider>
  );
}

describe('DatesSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('clears the stored birthday from its Trash', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet({ birthday: { id: 'b', label: 'Birthday', month: 3, day: 2 } });

    // With no other dates stored, the only Remove on screen is the birthday's —
    // it appears only when a birthday exists, which is the affordance under test.
    await user.press(screen.getByRole('button', { name: 'Remove' }));

    expect(handlers.onClearBirthday).toHaveBeenCalledTimes(1);
    expect(handlers.onRemove).not.toHaveBeenCalled();
  });

  it('removes the other date whose Trash was pressed, by id', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet({ otherDates: [anniversary()] });

    await user.press(screen.getByRole('button', { name: 'Remove' }));

    expect(handlers.onRemove).toHaveBeenCalledWith('d1');
    expect(handlers.onClearBirthday).not.toHaveBeenCalled();
  });

  it('files a new date from the add row and clears the form', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet();

    await user.type(screen.getByLabelText('Anniversary, the day you met…'), 'Met at the market');
    await user.type(screen.getByLabelText('MM'), '6');
    await user.type(screen.getByLabelText('DD'), '21');
    await user.press(screen.getByRole('button', { name: 'Add date' }));

    expect(handlers.onAdd).toHaveBeenCalledWith('Met at the market', 6, 21);
    // The form empties, so the next date starts clean instead of re-filing this one.
    expect(screen.getByLabelText('Anniversary, the day you met…').props.value).toBe('');
    expect(screen.getByLabelText('MM').props.value).toBe('');
  });

  it('falls back to a generic label when only a date is entered', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet();

    await user.type(screen.getByLabelText('MM'), '1');
    await user.type(screen.getByLabelText('DD'), '9');
    await user.press(screen.getByRole('button', { name: 'Add date' }));

    expect(handlers.onAdd).toHaveBeenCalledWith('Important dates', 1, 9);
  });

  it('refuses a day that cannot exist rather than storing it', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet();

    await user.type(screen.getByLabelText('MM'), '13');
    await user.type(screen.getByLabelText('DD'), '40');
    await user.press(screen.getByRole('button', { name: 'Add date' }));

    expect(handlers.onAdd).not.toHaveBeenCalled();
  });
});
