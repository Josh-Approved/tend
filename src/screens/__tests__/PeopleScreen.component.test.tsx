/**
 * Component test — the People directory's action surface.
 *
 * The regression this guards: a second "add" affordance (an icon-only
 * `UserPlus`) sat in the People header next to the gear while the `+` FAB was
 * already the add control, so the tab shipped two buttons that both add a
 * person. One add affordance per surface — the FAB. Bringing people in from
 * contacts is offered on the empty state (first run) and in Settings, never as a
 * rival + in the header.
 *
 * Queries go by role/label only, so this also fails if the FAB or the gear loses
 * its accessibility label.
 *
 * The second block presses each of the tab's three controls and asserts where it
 * lands (Uplevel-3 T3 action coverage).
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
// Lets ../../lib/contacts load under jest (its top-level expo-contacts import).
jest.mock('expo-contacts/legacy', () => ({
  Fields: {},
  SortTypes: {},
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));

import { makePerson, type Person } from '../../data/person';

// A roster the mocked store hands back. `people` is swapped per test so the same
// screen can be rendered empty (first run) and populated (the everyday state).
const mockState: { people: Person[]; importPeople: jest.Mock } = {
  people: [],
  importPeople: jest.fn(),
};
jest.mock('../../store/people', () => ({
  usePeopleStore: (selector: (s: typeof mockState) => unknown) => selector(mockState),
}));

import PeopleScreen from '../PeopleScreen';

// The screen only ever touches navigation.navigate; the rest of the
// react-navigation prop surface is irrelevant to what's on screen.
const navigation = { navigate: jest.fn() };

function renderPeople() {
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PeopleScreen navigation={navigation as any} route={{ key: 'People', name: 'People' } as any} />
    </SafeAreaProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  mockState.people = [];
});

describe('PeopleScreen action surface', () => {
  it('offers exactly one way to add a person once the directory has people', async () => {
    mockState.people = [makePerson('Mom'), makePerson('Sarah Chen')];

    await renderPeople();

    // The FAB is the add control...
    expect(screen.getByRole('button', { name: 'Add person' })).toBeTruthy();
    // ...and it is the ONLY one. The header carries the gear, nothing that adds.
    expect(screen.queryAllByRole('button', { name: 'Import from contacts' })).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Settings' })).toBeTruthy();
  });

  it('offers the contacts route on the empty state, where there is nothing to rival', async () => {
    mockState.people = [];

    await renderPeople();

    // First run is the one place both routes belong: a labelled text button for
    // contacts, plus the FAB for typing a name.
    expect(screen.getByRole('button', { name: 'Import from contacts' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add person' })).toBeTruthy();
  });
});

describe('PeopleScreen controls', () => {
  it('opens a blank person draft from the FAB without creating a record', async () => {
    mockState.people = [makePerson('Mom')];
    const user = userEvent.setup({ delay: 0 });
    await renderPeople();

    await user.press(screen.getByRole('button', { name: 'Add person' }));

    // Empty params — the draft persists nothing until Save, so backing straight
    // out of a blank screen must not leave a nameless person behind.
    expect(navigation.navigate).toHaveBeenCalledWith('PersonDetail', {});
  });

  it('opens Settings from the gear', async () => {
    mockState.people = [makePerson('Mom')];
    const user = userEvent.setup({ delay: 0 });
    await renderPeople();

    await user.press(screen.getByRole('button', { name: 'Settings' }));

    expect(navigation.navigate).toHaveBeenCalledWith('Settings');
  });

  it('opens the person whose row was tapped', async () => {
    const mom = makePerson('Mom');
    mockState.people = [mom, makePerson('Sarah Chen')];
    const user = userEvent.setup({ delay: 0 });
    await renderPeople();

    // The row's accessible name is the whole summary line, so it is matched by
    // pattern — pinning the exact composed string here would make this test a
    // copy assertion rather than a navigation one.
    await user.press(screen.getByRole('button', { name: /^Mom,/ }));

    expect(navigation.navigate).toHaveBeenCalledWith('PersonDetail', { personId: mom.id });
  });

  it('restores the full directory when the search is cleared', async () => {
    // The search box only appears once the directory is long enough to need one.
    mockState.people = [
      makePerson('Mom'),
      makePerson('Sarah Chen'),
      ...['Ada', 'Grace', 'Alan', 'Edsger', 'Barbara', 'Ken'].map((n) => makePerson(n)),
    ];
    const user = userEvent.setup({ delay: 0 });
    await renderPeople();

    await user.type(screen.getByLabelText('Search people'), 'Sarah');
    await waitFor(() => expect(screen.queryByRole('button', { name: /^Mom,/ })).toBeNull());

    await user.press(screen.getByRole('button', { name: 'Clear search' }));

    // The X has to empty the box AND re-run the filter — clearing the text while
    // leaving the list filtered strands the user with no way back to everyone.
    await waitFor(() => expect(screen.getByRole('button', { name: /^Mom,/ })).toBeTruthy());
    expect(screen.getByLabelText('Search people').props.value).toBe('');
  });

  it('opens the contact picker from the empty state', async () => {
    const user = userEvent.setup({ delay: 0 });
    await renderPeople();

    await user.press(screen.getByRole('button', { name: 'Import from contacts' }));

    // The picker is a full-screen modal of its own — its title is the proof it
    // actually came up, rather than the button merely having a handler.
    await waitFor(() =>
      expect(screen.getByRole('header', { name: 'Add from contacts' })).toBeTruthy()
    );
  });
});
