/**
 * Component test — the "who is this conversation with?" picker.
 *
 * Covers the picker's whole action surface: start fresh ("Someone new"), pick an
 * existing person, close without choosing, and clear the search box. The people
 * store is mocked to a fixed roster; everything else is the real component, so
 * the search threshold and the real `searchPeople` filter run.
 *
 * Queries go by role/label only, which is what makes the clear-search assertion
 * meaningful: defect tend-20260819-1 was that the X clearing the search box
 * announced itself as "Cancel" — the same accessible name as the header X that
 * throws the picker away, so Voice Control could not tell the two apart.
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

import { makePerson, type Person } from '../../data/person';

// The roster the mocked store hands back, swapped per test — the picker only
// shows its search box once the directory is big enough to need one.
const mockState: { people: Person[] } = { people: [] };
jest.mock('../../store/people', () => ({
  usePeopleStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}));

import { PersonPicker } from '../PersonPicker';

async function renderPicker(overrides: { onClose?: jest.Mock; onSelect?: jest.Mock } = {}) {
  const onClose = overrides.onClose ?? jest.fn();
  const onSelect = overrides.onSelect ?? jest.fn();
  await render(
    <SafeAreaProvider initialMetrics={METRICS}>
      <PersonPicker visible onClose={onClose} onSelect={onSelect} />
    </SafeAreaProvider>
  );
  return { onClose, onSelect };
}

describe('PersonPicker', () => {
  beforeEach(() => {
    mockState.people = [];
  });

  it('starts a conversation with nobody in particular from "Someone new"', async () => {
    const user = userEvent.setup({ delay: 0 });
    const onSelect = jest.fn();
    mockState.people = [makePerson('Mom')];

    await renderPicker({ onSelect });
    await user.press(screen.getByRole('button', { name: 'Someone new' }));

    expect(onSelect).toHaveBeenCalledWith({ kind: 'new' });
  });

  it('links the conversation to the person you tap', async () => {
    const user = userEvent.setup({ delay: 0 });
    const onSelect = jest.fn();
    const mom = makePerson('Mom');
    mockState.people = [mom];

    await renderPicker({ onSelect });
    await user.press(screen.getByRole('button', { name: 'Mom' }));

    expect(onSelect).toHaveBeenCalledWith({ kind: 'person', id: mom.id, name: 'Mom' });
  });

  it('closes without choosing anyone when the header X is pressed', async () => {
    const user = userEvent.setup({ delay: 0 });
    const onClose = jest.fn();
    const onSelect = jest.fn();
    mockState.people = [makePerson('Mom')];

    await renderPicker({ onClose, onSelect });
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).not.toHaveBeenCalled();
  });

  // Regression proof for defect tend-20260819-1. The clear-search control must
  // have its OWN accessible name: on the pre-fix code it was `common.cancel`, so
  // this screen carried two buttons named "Cancel" and the query below resolved
  // to two elements and threw.
  it('names the clear-search X for what it does, not "Cancel"', async () => {
    const user = userEvent.setup({ delay: 0 });
    // Eight people is the threshold at which the picker grows a search box.
    mockState.people = [
      'Mom',
      'Dad',
      'Sarah Chen',
      'Ravi',
      'Ada',
      'Grace',
      'Kim',
      'Yusuf',
    ].map((n) => makePerson(n));

    await renderPicker();

    const search = screen.getByLabelText('Search people');
    await user.type(search, 'Sar');

    // The clear control appears only once there is something to clear...
    const clear = screen.getByRole('button', { name: 'Clear search' });
    // ...and the picker's dismiss control keeps "Cancel" to itself, so the two
    // are distinguishable by voice.
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy();

    await user.press(clear);

    // Clearing the query brings the whole directory back.
    expect(screen.getByRole('button', { name: 'Mom' })).toBeTruthy();
  });
});
