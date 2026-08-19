/**
 * Component test — the guided contacts picker (the flow that replaced the bulk
 * "dump every contact onto People" import).
 *
 * We mock only `fetchContactsForPicker` (the expo read) — the real
 * `contactsToPeople` runs, so `onAdd` receives real Person records and the test
 * proves the whole select → map → hand-back path, not just a callback. The
 * people store is mocked to a fixed roster so "already tracked" contacts render
 * as Added and can't be re-picked. Queries go by role/label/text only.
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

// A fixed people roster the mocked store hands back (prefixed `mock` so the
// jest.mock factory may close over it).
const mockPeopleState = { people: [{ id: 'p1', name: 'Mom' }] };
jest.mock('../../store/people', () => ({
  usePeopleStore: (selector: (s: typeof mockPeopleState) => unknown) => selector(mockPeopleState),
}));

// Real contactsToPeople/dedupe etc.; only the expo read is stubbed.
jest.mock('../../lib/contacts', () => {
  const actual = jest.requireActual('../../lib/contacts');
  return { ...actual, fetchContactsForPicker: jest.fn() };
});

import { ContactPicker } from '../ContactPicker';
import { fetchContactsForPicker, type ContactFetchResult } from '../../lib/contacts';
import type { Person } from '../../data/person';

const mockFetch = fetchContactsForPicker as jest.MockedFunction<typeof fetchContactsForPicker>;

const BASE_CONTACTS = [
  { id: 'c1', name: 'Ada Lovelace', raw: { id: 'c1', name: 'Ada Lovelace' } },
  { id: 'c2', name: 'Grace Hopper', raw: { id: 'c2', name: 'Grace Hopper', birthday: { month: 11, day: 9 } } },
  { id: 'c3', name: 'Mom', raw: { id: 'c3', name: 'Mom' } }, // already tracked
];

function ready(): ContactFetchResult {
  return { limited: false, contacts: BASE_CONTACTS };
}

/** Enough contacts that the picker offers its search box (threshold is 8). */
function manyContacts(): ContactFetchResult {
  const extra = ['Alan Turing', 'Edsger Dijkstra', 'Barbara Liskov', 'Ken Thompson', 'Anita Borg', 'Katherine Johnson'];
  return {
    limited: false,
    contacts: [
      ...BASE_CONTACTS,
      ...extra.map((name, i) => ({ id: `x${i}`, name, raw: { id: `x${i}`, name } })),
    ],
  };
}

function wrap(ui: React.ReactElement) {
  return <SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>;
}

describe('ContactPicker', () => {
  beforeEach(() => mockFetch.mockReset());

  it('maps only the picked contacts to people and closes', async () => {
    const user = userEvent.setup({ delay: 0 });
    const onAdd = jest.fn();
    const onClose = jest.fn();
    mockFetch.mockResolvedValue(ready());

    await render(wrap(<ContactPicker visible onAdd={onAdd} onClose={onClose} />));

    // Contacts load asynchronously.
    await screen.findByRole('checkbox', { name: 'Ada Lovelace' });

    await user.press(screen.getByRole('checkbox', { name: 'Grace Hopper' }));
    await user.press(screen.getByRole('button', { name: 'Add 1' }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    const added = onAdd.mock.calls[0][0] as Person[];
    expect(added.map((p) => p.name)).toEqual(['Grace Hopper']);
    // The birthday carried through (month 11 → stored as 12).
    expect(added[0].importantDates[0]).toMatchObject({ label: 'Birthday', month: 12, day: 9 });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('shows an already-tracked contact as Added and never hands it back', async () => {
    const user = userEvent.setup({ delay: 0 });
    const onAdd = jest.fn();
    mockFetch.mockResolvedValue(ready());

    await render(wrap(<ContactPicker visible onAdd={onAdd} onClose={jest.fn()} />));
    await screen.findByRole('checkbox', { name: 'Ada Lovelace' });

    // "Mom" is tracked → tagged Added, and offers no checkbox to toggle.
    expect(screen.getByText('Added')).toBeTruthy();
    expect(screen.queryByRole('checkbox', { name: 'Mom' })).toBeNull();

    // Picking a real contact only hands back that one.
    await user.press(screen.getByRole('checkbox', { name: 'Ada Lovelace' }));
    await user.press(screen.getByRole('button', { name: 'Add 1' }));
    const added = onAdd.mock.calls[0][0] as Person[];
    expect(added.map((p) => p.name)).toEqual(['Ada Lovelace']);
  });

  it('surfaces the declined-permission message instead of silence', async () => {
    const onAdd = jest.fn();
    mockFetch.mockResolvedValue({ denied: true });

    await render(wrap(<ContactPicker visible onAdd={onAdd} onClose={jest.fn()} />));

    await waitFor(() => expect(screen.getByText('Contacts access was declined.')).toBeTruthy());
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('closes on Cancel without importing the contacts already ticked', async () => {
    const user = userEvent.setup({ delay: 0 });
    const onAdd = jest.fn();
    const onClose = jest.fn();
    mockFetch.mockResolvedValue(ready());

    await render(wrap(<ContactPicker visible onAdd={onAdd} onClose={onClose} />));
    await screen.findByRole('checkbox', { name: 'Ada Lovelace' });

    await user.press(screen.getByRole('checkbox', { name: 'Ada Lovelace' }));
    await user.press(screen.getByRole('button', { name: 'Cancel' }));

    // Backing out is a real cancel — a tick is not a commit, so nobody lands in
    // the directory from a picker the user closed.
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('restores the full list when the search is cleared', async () => {
    const user = userEvent.setup({ delay: 0 });
    // The search box only appears once the address book is long enough to need one.
    mockFetch.mockResolvedValue(manyContacts());

    await render(wrap(<ContactPicker visible onAdd={jest.fn()} onClose={jest.fn()} />));
    await screen.findByRole('checkbox', { name: 'Ada Lovelace' });

    await user.type(screen.getByLabelText('Search contacts'), 'Grace');
    await waitFor(() => expect(screen.queryByRole('checkbox', { name: 'Ada Lovelace' })).toBeNull());

    await user.press(screen.getByRole('button', { name: 'Clear search' }));

    // The X has to empty the box AND re-run the filter — clearing the text while
    // leaving the list filtered strands the user with no way back to everyone.
    await waitFor(() =>
      expect(screen.getByRole('checkbox', { name: 'Ada Lovelace' })).toBeTruthy()
    );
    expect(screen.getByLabelText('Search contacts').props.value).toBe('');
  });
});
