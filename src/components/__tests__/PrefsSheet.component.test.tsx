/**
 * Component test — the likes / dislikes / gift-ideas sheet (Uplevel-3 T3 action
 * coverage).
 *
 * Every control here either files something the user typed or throws it away,
 * and both failures are silent. Two of them are worth pinning specifically: the
 * kind chips decide WHICH list an entry lands in, so a chip that doesn't take
 * would file a dislike as a like with nothing on screen to say so; and the add
 * row is guarded on a non-blank entry, so "does nothing" is the correct outcome
 * for an empty box rather than a bug — asserted as such instead of left
 * ambiguous.
 *
 * The sheet is controlled: it reports what the user did through its callbacks
 * and the screen owns the store, so the callbacks ARE the outcome.
 */

import React from 'react';
import { render, screen, userEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type { Preference } from '../../data/person';

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

import { PrefsSheet } from '../PrefsSheet';

const handlers = {
  onClose: jest.fn(),
  onAdd: jest.fn(),
  onRemove: jest.fn(),
};

function coffee(): Preference {
  return { id: 'pref-1', kind: 'like', text: 'Flat whites' };
}

async function renderSheet(preferences: Preference[] = []) {
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PrefsSheet visible preferences={preferences} {...handlers} />
    </SafeAreaProvider>
  );
}

describe('PrefsSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('removes the preference whose X was pressed, by id', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet([coffee()]);

    await user.press(screen.getByRole('button', { name: 'Remove' }));

    expect(handlers.onRemove).toHaveBeenCalledWith('pref-1');
  });

  it('files the entry under the kind chip that is selected', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet();

    // "Likes" is the default, so this proves the chip actually took.
    await user.press(screen.getByRole('button', { name: 'Gift ideas' }));
    await user.type(screen.getByLabelText('Add something to remember'), 'A good notebook');
    await user.press(screen.getByRole('button', { name: 'Add' }));

    expect(handlers.onAdd).toHaveBeenCalledWith('gift', 'A good notebook');
  });

  it('announces which kind chip is selected rather than only filling it', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet();

    await user.press(screen.getByRole('button', { name: 'Dislikes' }));

    expect(
      screen.getByRole('button', { name: 'Dislikes' }).props.accessibilityState
    ).toMatchObject({ selected: true });
    expect(
      screen.getByRole('button', { name: 'Likes' }).props.accessibilityState
    ).toMatchObject({ selected: false });
  });

  it('files from the keyboard return as well as the + button, and clears the box', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet();

    const input = screen.getByLabelText('Add something to remember');
    await user.type(input, 'Hates cilantro', { submitEditing: true });

    expect(handlers.onAdd).toHaveBeenCalledWith('like', 'Hates cilantro');
    // The box empties, so the next entry starts clean instead of re-filing this one.
    expect(screen.getByLabelText('Add something to remember').props.value).toBe('');
  });

  it('files nothing from a blank box', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderSheet();

    await user.type(screen.getByLabelText('Add something to remember'), '   ', {
      submitEditing: true,
    });
    await user.press(screen.getByRole('button', { name: 'Add' }));

    expect(handlers.onAdd).not.toHaveBeenCalled();
  });
});
