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
  actionablePeople,
  peopleByName,
  searchPeople,
  personalityValue,
  setPersonalityValue,
  nextOccurrence,
  upcomingDates,
  planReminders,
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

describe('planReminders — reliable scheduling', () => {
  const now = 1_700_000_000_000;
  const reachoutFor = (id: string, r: ReturnType<typeof planReminders>) =>
    r.reminders.find((x) => x.key === `reachout:${id}` && x.kind === 'reachOut');

  it('arms a future due-moment at the exact time (delivers with the app closed)', () => {
    const p = at('Mom', { cadenceDays: 7, lastContactedAt: now - 2 * DAY_MS });
    const due = now - 2 * DAY_MS + 7 * DAY_MS; // 5 days out
    const r = planReminders([p], now, {});
    expect(reachoutFor(p.id, r)?.at).toBe(due);
    // and it must never clamp a future alarm to "just after the app opens"
    expect(reachoutFor(p.id, r)?.at).toBeGreaterThan(now + 60_000);
    expect(r.marks[p.id]).toBe(due);
  });

  it('a future alarm is still armed even when its due-cycle is already marked (never dropped)', () => {
    // This is the 6-months-out / never-reopen regression guard: dedup must not
    // cancel a pending future alarm just because we remembered arming it.
    const p = at('Later', { cadenceDays: 180, lastContactedAt: now });
    const due = now + 180 * DAY_MS;
    const r = planReminders([p], now, { [p.id]: due });
    expect(reachoutFor(p.id, r)?.at).toBe(due);
  });

  it('overdue with no prior mark: one catch-up nudge shortly after, and remembers the cycle', () => {
    const p = at('Old', { cadenceDays: 7, lastContactedAt: now - 30 * DAY_MS });
    const due = now - 30 * DAY_MS + 7 * DAY_MS; // in the past
    const r = planReminders([p], now, {}, 60_000);
    expect(reachoutFor(p.id, r)?.at).toBe(now + 60_000);
    expect(r.marks[p.id]).toBe(due);
  });

  it('overdue already nudged for this cycle: does NOT re-fire on the next reschedule', () => {
    const p = at('Old', { cadenceDays: 7, lastContactedAt: now - 30 * DAY_MS });
    const due = now - 30 * DAY_MS + 7 * DAY_MS;
    const r = planReminders([p], now, { [p.id]: due });
    expect(reachoutFor(p.id, r)).toBeUndefined();
    expect(r.marks[p.id]).toBe(due); // mark carried forward
  });

  it('logging contact starts a new cycle, which re-arms (mark no longer matches)', () => {
    const p = at('Old', { cadenceDays: 7, lastContactedAt: now - DAY_MS });
    const staleMark = now - 30 * DAY_MS; // a previous, different due-cycle
    const r = planReminders([p], now, { [p.id]: staleMark });
    const due = now - DAY_MS + 7 * DAY_MS; // 6 days out, future
    expect(reachoutFor(p.id, r)?.at).toBe(due);
    expect(r.marks[p.id]).toBe(due);
  });

  it('no cadence, deleted people, and marks pruning', () => {
    const none = at('NoCadence', { cadenceDays: null });
    const gone = at('Deleted', { cadenceDays: 7, lastContactedAt: now - 30 * DAY_MS, deletedAt: now });
    const r = planReminders([none, gone], now, { [gone.id]: 123 });
    expect(r.reminders).toHaveLength(0);
    expect(r.marks).toEqual({}); // pruned — no cadence people to remember
  });

  it('arms an important date the morning of its next occurrence', () => {
    const d = new Date(now);
    const p = at('Bday', {
      importantDates: [makeImportantDate('Birthday', d.getMonth() + 1, d.getDate() + 2)],
    });
    const r = planReminders([p], now, {});
    const date = r.reminders.find((x) => x.kind === 'importantDate');
    expect(date).toBeDefined();
    expect(date?.at).toBeGreaterThan(now);
    expect(date?.dateLabel).toBe('Birthday');
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

describe('actionablePeople (Today dashboard)', () => {
  const now = 1_700_000_000_000;
  it('keeps only overdue + soon, most urgent first', () => {
    const overdue = at('Overdue', { cadenceDays: 7, lastContactedAt: now - 30 * DAY_MS });
    const soon = at('Soon', { cadenceDays: 14, lastContactedAt: now - 13 * DAY_MS });
    const ok = at('Ok', { cadenceDays: 30, lastContactedAt: now - 1 * DAY_MS });
    const none = at('None', { cadenceDays: null });
    expect(actionablePeople([none, ok, soon, overdue], now).map((p) => p.name)).toEqual(['Overdue', 'Soon']);
  });
});

describe('peopleByName (directory)', () => {
  it('sorts A→Z and drops tombstoned', () => {
    const list = [at('Zoe'), at('amir'), at('Gone', { deletedAt: Date.now() }), at('Bea')];
    expect(peopleByName(list).map((p) => p.name)).toEqual(['amir', 'Bea', 'Zoe']);
  });
});

describe('searchPeople (directory search)', () => {
  it('returns the full A→Z directory for a blank query', () => {
    const list = [at('Zoe'), at('amir'), at('Bea')];
    expect(searchPeople(list, '   ').map((p) => p.name)).toEqual(['amir', 'Bea', 'Zoe']);
  });

  it('filters by case-insensitive name substring and drops tombstoned', () => {
    const list = [at('Sarah Chen'), at('sara lee'), at('Marcus'), at('Gone', { deletedAt: Date.now() })];
    expect(searchPeople(list, 'sar').map((p) => p.name)).toEqual(['sara lee', 'Sarah Chen']);
    expect(searchPeople(list, 'xyz')).toEqual([]);
  });
});

describe('personality types', () => {
  it('getter reads the value for a framework, undefined when unset', () => {
    const p = at('A', { personalityTypes: [{ framework: 'enneagram', value: '5' }] });
    expect(personalityValue(p, 'enneagram')).toBe('5');
    expect(personalityValue(p, 'attachment')).toBeUndefined();
  });

  it('setPersonalityValue replaces within a framework, keeps others, and clears with null', () => {
    let types = setPersonalityValue([], 'enneagram', '5');
    types = setPersonalityValue(types, 'attachment', 'secure');
    expect(types).toHaveLength(2);
    types = setPersonalityValue(types, 'enneagram', '8'); // replace, not append
    expect(types.filter((t) => t.framework === 'enneagram')).toEqual([{ framework: 'enneagram', value: '8' }]);
    expect(types).toHaveLength(2);
    types = setPersonalityValue(types, 'enneagram', null); // clear
    expect(types).toEqual([{ framework: 'attachment', value: 'secure' }]);
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
      personalityTypes: [
        { framework: 'enneagram', value: '4' },
        { framework: 'mbti', value: 'INTJ' }, // unknown framework → dropped
        { framework: 'enneagram', value: '7' }, // duplicate framework → dropped
        { framework: 'attachment', value: 'secure' },
      ],
      interactions: [{ at: 123, kind: 'text', note: 'caught up' }, { kind: 'call' }],
    });
    expect(safe).not.toBeNull();
    expect(safe!.id).not.toBe('OLD-COLLIDING-ID');
    expect(safe!.howWeMet).toBe('College');
    expect(safe!.importantDates).toHaveLength(1);
    expect(safe!.preferences).toHaveLength(1);
    expect(safe!.personalityTypes).toEqual([
      { framework: 'enneagram', value: '4' },
      { framework: 'attachment', value: 'secure' },
    ]);
    expect(safe!.interactions).toHaveLength(1); // the one without `at` is dropped
    expect(safe!.interactions[0].kind).toBe('text');
  });

  it('returns null for non-person shapes instead of throwing', () => {
    expect(sanitizeImportedPerson(null)).toBeNull();
    expect(sanitizeImportedPerson({ notes: 'x' })).toBeNull();
    expect(sanitizeImportedPerson('nope')).toBeNull();
  });
});
