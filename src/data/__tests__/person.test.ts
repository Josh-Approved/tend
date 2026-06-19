/**
 * Trust-core unit tests (canon § QA & testing Tier 1) for Tend. The trust core
 * is the pure data layer in ../person — above all `dueStatus` (who's due to reach
 * out to) and `upcomingDates` (birthdays/anniversaries coming up), plus the date
 * math and additive, crash-proof import sanitization.
 */

import { describe, it, expect } from '@jest/globals';
import {
  DAY_MS,
  makePerson,
  makePreference,
  makeImportantDate,
  makeInteraction,
  sortedInteractions,
  dueStatus,
  daysSinceContact,
  sortByUrgency,
  nextOccurrence,
  upcomingDates,
  sanitizeImportedPerson,
  type Person,
} from '../person';

const at = (name: string, patch: Partial<Person> = {}): Person => ({ ...makePerson(name), ...patch });

describe('constructors', () => {
  it('makePerson trims, starts with no cadence / never-contacted, empty history', () => {
    const p = makePerson('  Mom  ');
    expect(p.name).toBe('Mom');
    expect(p.cadenceDays).toBeNull();
    expect(p.lastContactedAt).toBeNull();
    expect(p.interactions).toEqual([]);
    expect(p.id).toMatch(/^p/);
  });

  it('makeInteraction trims notes and drops empties', () => {
    expect(makeInteraction('call', '  rang her ').note).toBe('rang her');
    expect(makeInteraction('text', '   ').note).toBeUndefined();
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
    expect(s.dueAt).toBe(now - 10 * DAY_MS + 7 * DAY_MS);
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

describe('sortedInteractions', () => {
  it('returns catch-ups newest first', () => {
    const p = at('A', {
      interactions: [makeInteraction('call', undefined, 100), makeInteraction('text', undefined, 300), makeInteraction('other', undefined, 200)],
    });
    expect(sortedInteractions(p).map((i) => i.at)).toEqual([300, 200, 100]);
  });
});

describe('nextOccurrence + upcomingDates', () => {
  it('rolls a passed date to next year and keeps an upcoming one', () => {
    const jan1 = new Date(2024, 0, 1).getTime();
    expect(new Date(nextOccurrence(makeImportantDate('B', 12, 25), jan1)).getFullYear()).toBe(2024);
    const feb1 = new Date(2024, 1, 1).getTime();
    expect(new Date(nextOccurrence(makeImportantDate('A', 1, 10), feb1)).getFullYear()).toBe(2025);
  });

  it('surfaces only dates within the window, soonest first', () => {
    const now = new Date(2024, 5, 1).getTime(); // Jun 1
    const a = at('A', { importantDates: [makeImportantDate('Birthday', 6, 10)] }); // +9d
    const b = at('B', { importantDates: [makeImportantDate('Anniversary', 6, 3)] }); // +2d
    const far = at('Far', { importantDates: [makeImportantDate('Birthday', 12, 1)] }); // far off
    const up = upcomingDates([a, far, b], now, 30);
    expect(up.map((u) => u.person.name)).toEqual(['B', 'A']);
    expect(up.every((u) => u.days <= 30)).toBe(true);
  });
});

describe('sanitizeImportedPerson', () => {
  it('re-mints the id, keeps valid nested data incl. interactions + howWeMet', () => {
    const safe = sanitizeImportedPerson({
      id: 'OLD-COLLIDING-ID',
      name: 'Sarah',
      cadenceDays: 14,
      notes: 'Hates lilies',
      howWeMet: 'College',
      importantDates: [{ label: 'Birthday', month: 5, day: 2 }, { nope: 1 }],
      preferences: [{ kind: 'dislike', text: 'Lilies' }, 'garbage'],
      interactions: [{ at: 123, kind: 'text', note: 'caught up' }, { kind: 'call' }],
    });
    expect(safe).not.toBeNull();
    expect(safe!.id).not.toBe('OLD-COLLIDING-ID');
    expect(safe!.howWeMet).toBe('College');
    expect(safe!.importantDates).toHaveLength(1);
    expect(safe!.preferences).toHaveLength(1);
    expect(safe!.interactions).toHaveLength(1); // the one without `at` is dropped
    expect(safe!.interactions[0].kind).toBe('text');
  });

  it('returns null for non-person shapes instead of throwing', () => {
    expect(sanitizeImportedPerson(null)).toBeNull();
    expect(sanitizeImportedPerson({ notes: 'x' })).toBeNull();
    expect(sanitizeImportedPerson('nope')).toBeNull();
  });
});
