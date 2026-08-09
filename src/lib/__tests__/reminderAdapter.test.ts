/**
 * Trust-core unit tests for the reminder ADAPTER (canon § QA & testing Tier 1).
 *
 * The canonical planner has its own tests (`src/data/__tests__/reminderPlan.test.ts`);
 * this file pins the app-specific half — how a Person's cadence and saved dates
 * become neutral items, and what the OS is therefore asked to arm. It carries
 * forward every guarantee the old hand-rolled `planReminders` was pinned on:
 *
 *   - a FUTURE due moment is armed at the exact instant, never clamped to
 *     "just after the app opens" (the 6-months-out / never-reopen case),
 *   - an ALREADY-overdue person gets exactly one catch-up nudge, and reopening
 *     the app cannot re-fire it,
 *   - logging contact starts a new cycle, which re-arms,
 *   - people with no cadence and deleted people plan nothing, and their marks
 *     prune themselves,
 *   - birthdays can be switched off wholesale without touching anything else,
 *   - the old `reachoutNotifiedMarks` ledger is carried across to the module's
 *     `reminderMarks`, re-namespaced, so an existing install cannot be nudged
 *     twice for the same due-cycle.
 */

const mockKv = new Map<string, string>();

jest.mock('../../storage/kv', () => ({
  getAppSetting: jest.fn(async (k: string) => (mockKv.has(k) ? mockKv.get(k)! : null)),
  setAppSetting: jest.fn(async (k: string, v: string) => {
    mockKv.set(k, v);
  }),
}));

// Nothing here touches the OS; stub the scheduler so the suite stays pure (and
// so importing expo-notifications under jest doesn't warn about Expo Go).
jest.mock('../reminderScheduler', () => ({
  rescheduleReminders: jest.fn(async () => ({ armed: 0, permission: false, skipped: false })),
  syncReminders: jest.fn(),
}));

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  DAY_MS,
  makeImportantDate,
  makePerson,
  type Person,
} from '../../data/person';
import { planReminders, type PlannedReminder } from '../../data/reminderPlan';
import {
  dateItemId,
  migrateReminderMarks,
  reachOutItemId,
  reminderCopy,
  reminderItems,
  resetMarksMigrationForTests,
} from '../reminderAdapter';

const NOW = new Date(2026, 5, 10, 12, 0, 0).getTime();

const person = (name: string, patch: Partial<Person> = {}): Person => ({
  ...makePerson(name),
  ...patch,
});

/** Plan straight through the real planner — the adapter's output is only ever
 *  meaningful as what the OS ends up being asked to arm. */
const plan = (people: Person[], opts: { excludeBirthdays?: boolean; marks?: Record<string, number> } = {}) =>
  planReminders(reminderItems(people, { excludeBirthdays: opts.excludeBirthdays }), Date.now(), {
    marks: opts.marks,
  });

const reachOutFor = (p: Person, r: { reminders: PlannedReminder[] }) =>
  r.reminders.find((x) => x.itemId === reachOutItemId(p.id));

beforeEach(() => {
  mockKv.clear();
  resetMarksMigrationForTests();
  jest.spyOn(Date, 'now').mockImplementation(() => NOW);
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('reach-out items', () => {
  it('arms a future due moment at the EXACT instant (delivers with the app closed)', () => {
    const p = person('Mom', { cadenceDays: 7, lastContactedAt: NOW - 2 * DAY_MS });
    const due = NOW - 2 * DAY_MS + 7 * DAY_MS;
    const r = plan([p]);
    expect(reachOutFor(p, r)?.at).toBe(due);
    // never clamped to "just after the app opened"
    expect(reachOutFor(p, r)!.at).toBeGreaterThan(NOW + 60_000);
    expect(r.marks[reachOutItemId(p.id)]).toBe(due);
  });

  it('a future alarm is still armed when its due-cycle is already marked', () => {
    // The 6-months-out / never-reopen regression guard: remembering that we
    // armed a cycle must not cancel the pending future alarm.
    const p = person('Later', { cadenceDays: 180, lastContactedAt: NOW });
    const due = NOW + 180 * DAY_MS;
    const r = plan([p], { marks: { [reachOutItemId(p.id)]: due } });
    expect(reachOutFor(p, r)?.at).toBe(due);
  });

  it('overdue with no prior mark: one catch-up nudge shortly after, cycle remembered', () => {
    const p = person('Old', { cadenceDays: 7, lastContactedAt: NOW - 30 * DAY_MS });
    const due = NOW - 30 * DAY_MS + 7 * DAY_MS;
    const r = plan([p]);
    expect(reachOutFor(p, r)?.kind).toBe('catchUp');
    expect(reachOutFor(p, r)!.at).toBeGreaterThan(NOW);
    expect(r.marks[reachOutItemId(p.id)]).toBe(due);
  });

  it('overdue and already nudged for this cycle: does NOT re-fire on reopen', () => {
    const p = person('Old', { cadenceDays: 7, lastContactedAt: NOW - 30 * DAY_MS });
    const due = NOW - 30 * DAY_MS + 7 * DAY_MS;
    const r = plan([p], { marks: { [reachOutItemId(p.id)]: due } });
    expect(reachOutFor(p, r)).toBeUndefined();
    expect(r.marks[reachOutItemId(p.id)]).toBe(due); // carried forward
  });

  it('logging contact starts a new cycle, which re-arms (the mark no longer matches)', () => {
    const p = person('Old', { cadenceDays: 7, lastContactedAt: NOW - DAY_MS });
    const due = NOW - DAY_MS + 7 * DAY_MS;
    const r = plan([p], { marks: { [reachOutItemId(p.id)]: NOW - 30 * DAY_MS } });
    expect(reachOutFor(p, r)?.at).toBe(due);
    expect(r.marks[reachOutItemId(p.id)]).toBe(due);
  });

  it('no cadence and deleted people plan nothing, and their marks prune themselves', () => {
    const none = person('NoCadence', { cadenceDays: null });
    const gone = person('Deleted', {
      cadenceDays: 7,
      lastContactedAt: NOW - 30 * DAY_MS,
      deletedAt: NOW,
    });
    const r = plan([none, gone], { marks: { [reachOutItemId(gone.id)]: 123 } });
    expect(r.reminders).toHaveLength(0);
    expect(r.marks).toEqual({});
  });
});

describe('important-date items', () => {
  const soon = new Date(NOW + 2 * DAY_MS);
  const month = soon.getMonth() + 1;
  const day = soon.getDate();

  const withDates = () =>
    person('Both', {
      importantDates: [
        makeImportantDate('Birthday', month, day),
        makeImportantDate('Anniversary', month, day),
      ],
    });

  const labels = (r: { reminders: PlannedReminder[] }) =>
    r.reminders.filter((x) => x.kindKey !== 'reachOut').map((x) => x.meta?.dateLabel);

  it('fires on the day of the next occurrence, at the app-wide hour', () => {
    const p = person('Bday', { importantDates: [makeImportantDate('Birthday', month, day)] });
    const r = plan([p]);
    const fired = r.reminders.find((x) => x.kindKey === 'birthday');
    expect(fired).toBeDefined();
    expect(new Date(fired!.at).getHours()).toBe(9); // DEFAULT_NOTIFY_HOUR
    expect(fired!.at).toBeGreaterThan(NOW);
  });

  it('honours the app-wide notification hour instead of a hardcoded 9am', () => {
    const p = person('Bday', { importantDates: [makeImportantDate('Birthday', month, day)] });
    const items = reminderItems([p]);
    const r = planReminders(items, NOW, { notifyHour: 18 });
    expect(new Date(r.reminders[0].at).getHours()).toBe(18);
  });

  it('birthdays are planned by default', () => {
    expect(labels(plan([withDates()]))).toEqual(['Birthday', 'Anniversary']);
  });

  it('excludeBirthdays drops ONLY the birthday; other dates still plan', () => {
    expect(labels(plan([withDates()], { excludeBirthdays: true }))).toEqual(['Anniversary']);
  });

  it('a lowercase "birthday" label is the same canonical concept', () => {
    const p = person('Lower', { importantDates: [makeImportantDate('  birthday ', month, day)] });
    expect(labels(plan([p], { excludeBirthdays: true }))).toEqual([]);
    expect(labels(plan([p]))).toEqual(['birthday']);
  });

  it('switching birthdays off never touches reach-outs or their marks', () => {
    const p = person('Mom', {
      cadenceDays: 7,
      lastContactedAt: NOW - 2 * DAY_MS,
      importantDates: [makeImportantDate('Birthday', month, day)],
    });
    const due = NOW - 2 * DAY_MS + 7 * DAY_MS;
    const r = plan([p], { excludeBirthdays: true });
    expect(reachOutFor(p, r)?.at).toBe(due);
    expect(r.marks[reachOutItemId(p.id)]).toBe(due);
    expect(labels(r)).toEqual([]);
  });

  it('namespaces each date by its own id so one person can hold several', () => {
    const p = withDates();
    const items = reminderItems([p]);
    expect(items.map((i) => i.id)).toEqual(p.importantDates.map((d) => dateItemId(d.id)));
  });
});

describe('the iOS pending-notification cap (the defect this adoption fixes)', () => {
  it('never asks the OS to arm more than the budget, however many people', () => {
    const people = Array.from({ length: 80 }, (_, i) =>
      person(`P${i}`, {
        cadenceDays: 7,
        lastContactedAt: NOW - DAY_MS,
        importantDates: [makeImportantDate('Birthday', 12, 25)],
      })
    );
    const r = plan(people);
    expect(r.reminders.length).toBeLessThanOrEqual(56);
  });
});

describe('reminderCopy', () => {
  const planned = (over: Partial<PlannedReminder>): PlannedReminder => ({
    key: 'k',
    itemId: 'i',
    label: 'Ada',
    at: NOW,
    kind: 'due',
    daysBeforeDue: 0,
    ...over,
  });

  it('reads the reach-out copy for a cadence nudge', () => {
    const { title, body } = reminderCopy(planned({ kindKey: 'reachOut' }));
    expect(title).toContain('Ada');
    expect(body).toBeTruthy();
  });

  it('reads the date copy, with the date label, for a birthday and any other date', () => {
    for (const kindKey of ['birthday', 'importantDate']) {
      const { title } = reminderCopy(planned({ kindKey, meta: { dateLabel: 'Anniversary' } }));
      expect(title).toContain('Ada');
      expect(title).toContain('Anniversary');
    }
  });

  it('falls back to a neutral name when the person has none', () => {
    expect(reminderCopy(planned({ label: '   ', kindKey: 'reachOut' })).title).toBeTruthy();
  });
});

describe('carrying the old notified marks across', () => {
  it('renames the key AND re-namespaces every entry, so no nudge repeats', async () => {
    mockKv.set('reachoutNotifiedMarks', JSON.stringify({ p1: 111, p2: 222 }));
    await migrateReminderMarks();
    expect(JSON.parse(mockKv.get('reminderMarks')!)).toEqual({
      'reachout:p1': 111,
      'reachout:p2': 222,
    });
  });

  it('runs once — a later prune of the ledger is not undone', async () => {
    mockKv.set('reachoutNotifiedMarks', JSON.stringify({ p1: 111 }));
    await migrateReminderMarks();
    mockKv.set('reminderMarks', '{}'); // the module rebuilt the ledger and pruned p1
    resetMarksMigrationForTests();
    await migrateReminderMarks();
    expect(mockKv.get('reminderMarks')).toBe('{}');
  });

  it('never clobbers a ledger the module has already written', async () => {
    mockKv.set('reachoutNotifiedMarks', JSON.stringify({ p1: 111 }));
    mockKv.set('reminderMarks', JSON.stringify({ 'reachout:p9': 999 }));
    await migrateReminderMarks();
    expect(JSON.parse(mockKv.get('reminderMarks')!)).toEqual({ 'reachout:p9': 999 });
  });

  it('is a no-op on a fresh install and survives a corrupt legacy value', async () => {
    await migrateReminderMarks();
    expect(mockKv.has('reminderMarks')).toBe(false);

    mockKv.set('reachoutNotifiedMarks', 'not json');
    resetMarksMigrationForTests();
    mockKv.delete('reminderMarksMigrated');
    await expect(migrateReminderMarks()).resolves.toBeUndefined();
    expect(mockKv.has('reminderMarks')).toBe(false);
  });
});
