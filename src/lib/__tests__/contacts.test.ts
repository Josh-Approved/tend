/**
 * Pure-logic tests for the contacts import mapping + dedup (lib/contacts).
 * These cover the two functions that must be right for the import to be
 * trustworthy: turning raw address-book records into Person[] (name fallback,
 * skipping the nameless, the 0-indexed birthday-month offset) and dropping
 * people we already track (case-insensitive). No expo mocks — both are pure.
 */

import { describe, it, expect, jest } from '@jest/globals';

// The functions under test are pure and take plain objects — but importing them
// from ../contacts pulls in that module's top-level `import * as Contacts from
// 'expo-contacts'`, whose native module won't load under jest. Stub the native
// surface so the module loads; the pure functions never touch it.
jest.mock('expo-contacts', () => ({
  Fields: {},
  SortTypes: {},
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));

import { contactsToPeople, dedupePeopleByName, type RawContact } from '../contacts';
import { makePerson } from '../../data/person';

describe('contactsToPeople', () => {
  it('uses the full name when present, trimmed', () => {
    const people = contactsToPeople([{ name: '  Ada Lovelace  ' }]);
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe('Ada Lovelace');
  });

  it('falls back to first + last when name is missing', () => {
    const people = contactsToPeople([{ firstName: 'Grace', lastName: 'Hopper' }]);
    expect(people[0].name).toBe('Grace Hopper');
  });

  it('falls back to a lone first or last name', () => {
    const people = contactsToPeople([{ firstName: 'Madonna' }, { lastName: 'Beyoncé' }]);
    expect(people.map((p) => p.name)).toEqual(['Madonna', 'Beyoncé']);
  });

  it('skips contacts with no usable name', () => {
    const raw: RawContact[] = [
      { name: '' },
      { firstName: '', lastName: '' },
      {},
      { name: '   ' },
      { name: 'Real Person' },
    ];
    const people = contactsToPeople(raw);
    expect(people).toHaveLength(1);
    expect(people[0].name).toBe('Real Person');
  });

  it('adds 1 to the 0-indexed birthday month and carries day + year', () => {
    // expo-contacts month 0 = January → stored as month 1.
    const people = contactsToPeople([{ name: 'Jan Baby', birthday: { month: 0, day: 15, year: 1990 } }]);
    expect(people[0].importantDates).toHaveLength(1);
    const d = people[0].importantDates[0];
    expect(d.label).toBe('Birthday');
    expect(d.month).toBe(1);
    expect(d.day).toBe(15);
    expect(d.year).toBe(1990);

    // month 11 = December → 12.
    const dec = contactsToPeople([{ name: 'Dec Baby', birthday: { month: 11, day: 25 } }]);
    expect(dec[0].importantDates[0].month).toBe(12);
    expect(dec[0].importantDates[0].year).toBeUndefined();
  });

  it('leaves importantDates empty when birthday is absent or partial', () => {
    const people = contactsToPeople([
      { name: 'No Bday' },
      { name: 'Day Only', birthday: { day: 3 } },
      { name: 'Month Only', birthday: { month: 4 } },
    ]);
    expect(people.every((p) => p.importantDates.length === 0)).toBe(true);
  });
});

describe('dedupePeopleByName', () => {
  it('drops incoming whose name already exists (case-insensitive)', () => {
    const existing = [makePerson('Ada Lovelace')];
    const incoming = [makePerson('ada lovelace'), makePerson('Grace Hopper')];
    const result = dedupePeopleByName(existing, incoming);
    expect(result.map((p) => p.name)).toEqual(['Grace Hopper']);
  });

  it('ignores surrounding whitespace when comparing', () => {
    const existing = [makePerson('Katherine Johnson')];
    const incoming = [makePerson('  katherine johnson  ')];
    expect(dedupePeopleByName(existing, incoming)).toHaveLength(0);
  });

  it('dedupes within the incoming batch too', () => {
    const incoming = [makePerson('Mae Jemison'), makePerson('mae jemison')];
    const result = dedupePeopleByName([], incoming);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Mae Jemison');
  });

  it('returns everyone when nothing collides', () => {
    const existing = [makePerson('Ada')];
    const incoming = [makePerson('Grace'), makePerson('Mae')];
    expect(dedupePeopleByName(existing, incoming)).toHaveLength(2);
  });

  it('drops nameless incoming (they would all collide on the empty string)', () => {
    const incoming = [makePerson(''), makePerson('   '), makePerson('Real')];
    const result = dedupePeopleByName([], incoming);
    expect(result.map((p) => p.name)).toEqual(['Real']);
  });
});
