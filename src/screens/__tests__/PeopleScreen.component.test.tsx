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

function renderPeople() {
  const navigation = { navigate: jest.fn() };
  // The screen only ever touches navigation.navigate; the rest of the
  // react-navigation prop surface is irrelevant to what's on screen.
  return render(
    <SafeAreaProvider initialMetrics={METRICS}>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <PeopleScreen navigation={navigation as any} route={{ key: 'People', name: 'People' } as any} />
    </SafeAreaProvider>
  );
}

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
