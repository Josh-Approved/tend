/**
 * Trust-core unit tests (canon § QA & testing Tier 1) for Tend. The trust core
 * is the pure data layer in ../person — above all `dueStatus` (who's due to reach
 * out to), plus the date math and additive, crash-proof import sanitization.
 * These are the worked examples a refactor would silently break.
 */

import { describe, it, expect } from '@jest/globals';
import {
  DAY_MS,
  makePerson,
  makePreference,
  makeImportantDate,
  dueStatus,
  daysSinceContact,
  sortByUrgency,
  nextOccurrence,
  sanitizeImportedPerson,
  type Person,
} from '../person';

const at = (name: string, patch: Partial<Person> = {}): Person => ({ ...makePerson(name), ...patch });

describe('constructors', () => {
  it('makePerson trims, starts with no cadence / never-contacted, mints an id', () => {
    const p = makePerson('  Mom  ');
    expect(p.name).toBe('Mom');
    expect(p.cadenceDays).toBeNull();
    expect(p.lastContactedAt).toBeNull();
    expect(p.id).toMatch(/^p/);
    expect(p.createdAt).toBeGreaterThan(0);
  });

  it('makePreference / makeImportantDate trim and mint ids', () => {
    expect(makePreference('dislike', '  Lilies ').text).toBe('Lilies');
    expect(makeImportantDate('  Birthday ', 5, 2).label).toBe('Birthday');
    expect(makeImportantDate('', 5, 2).label).toBe('Date');
  });
});

describe('dueStatus — the trust core', () => {
  const now = 1_700_000_000_000;

  it('returns "none" when there is no cadence', () => {
    expect(dueStatus(at('A', { cadenceDays: null }), now).state).toBe('none');
    expect(dueStatus(at('A', { cadenceDays: 0 }), now).dueAt).toBeNull();
  });

  it('counts from last contact, and flags overdue once past due', () => {
    const p = at('Mom', { cadenceDays: 7, lastContactedAt: now - 10 * DAY_MS });
    const s = dueStatus(p, now);
    expect(s.state).toBe('overdue');
    expect(s.dueAt).toBe(now - 10 * DAY_MS + 7 * DAY_MS); // 3 days ago
    expect(s.daysUntilDue).toBeLessThan(0);
  });

  it('reads as "soon" inside the window and "ok" outside it', () => {
    expect(dueStatus(at('S', { cadenceDays: 14, lastContactedAt: now - 13 * DAY_MS }), now).state).toBe('soon');
    expect(dueStatus(at('O', { cadenceDays: 30, lastContactedAt: now - 5 * DAY_MS }), now).state).toBe('ok');
  });

  it('falls back to createdAt when never contacted', () => {
    const p = at('New', { cadenceDays: 7, lastContactedAt: null, createdAt: now - 9 * DAY_MS });
    expect(dueStatus(p, now).state).toBe('overdue');
  });
});

describe('daysSinceContact', () => {
  const now = 1_700_000_000_000;
  it('measures from last contact, never negative', () => {
    expect(daysSinceContact(at('A', { lastContactedAt: now - 3 * DAY_MS }), now)).toBe(3);
    expect(daysSinceContact(at('A', { lastContactedAt: now + 5 * DAY_MS }), now)).toBe(0);
  });
});

describe('sortByUrgency', () => {
  const now = 1_700_000_000_000;
  it('orders overdue → soon → ok → none, drops tombstoned', () => {
    const overdue = at('Overdue', { cadenceDays: 7, lastContactedAt: now - 30 * DAY_MS });
    const soon = at('Soon', { cadenceDays: 14, lastContactedAt: now - 13 * DAY_MS });
    const ok = at('Ok', { cadenceDays: 30, lastContactedAt: now - 1 * DAY_MS });
    const none = at('None', { cadenceDays: null });
    const gone = at('Gone', { cadenceDays: 7, lastContactedAt: now - 99 * DAY_MS, deletedAt: now });
    const sorted = sortByUrgency([none, ok, soon, overdue, gone], now);
    expect(sorted.map((p) => p.name)).toEqual(['Overdue', 'Soon', 'Ok', 'None']);
  });
});

describe('nextOccurrence', () => {
  it('rolls a passed date to next year and keeps an upcoming one this year', () => {
    const jan1 = new Date(2024, 0, 1).getTime();
    const dec = makeImportantDate('Birthday', 12, 25);
    const jan10 = makeImportantDate('Anniversary', 1, 10);
    expect(new Date(nextOccurrence(dec, jan1)).getFullYear()).toBe(2024); // upcoming this year
    expect(new Date(nextOccurrence(jan10, jan1)).getFullYear()).toBe(2024);
    const feb1 = new Date(2024, 1, 1).getTime();
    expect(new Date(nextOccurrence(jan10, feb1)).getFullYear()).toBe(2025); // already passed → next year
  });
});

describe('sanitizeImportedPerson', () => {
  it('re-mints the id, keeps valid nested data, drops garbage', () => {
    const safe = sanitizeImportedPerson({
      id: 'OLD-COLLIDING-ID',
      name: 'Sarah',
      cadenceDays: 14,
      lastContactedAt: 123,
      notes: 'Hates lilies',
      importantDates: [{ label: 'Birthday', month: 5, day: 2 }, { nope: 1 }],
      preferences: [{ kind: 'dislike', text: 'Lilies' }, { kind: 'bogus', text: 'Tulips' }, 'garbage'],
    });
    expect(safe).not.toBeNull();
    expect(safe!.id).not.toBe('OLD-COLLIDING-ID');
    expect(safe!.name).toBe('Sarah');
    expect(safe!.cadenceDays).toBe(14);
    expect(safe!.importantDates).toHaveLength(1);
    expect(safe!.preferences).toHaveLength(2); // 'bogus' kind coerced to 'like', 'garbage' dropped
    expect(safe!.preferences[1].kind).toBe('like');
  });

  it('returns null for non-person shapes instead of throwing', () => {
    expect(sanitizeImportedPerson(null)).toBeNull();
    expect(sanitizeImportedPerson({ notes: 'x' })).toBeNull();
    expect(sanitizeImportedPerson('nope')).toBeNull();
  });
});
