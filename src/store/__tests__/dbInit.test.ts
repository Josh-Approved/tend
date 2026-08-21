/**
 * Database open + additive-migration concurrency (trust core).
 *
 * This app opens SQLite exactly once, from the shell's storage/kv.ts, and the
 * domain module borrows that one connection. Both halves of that sentence are
 * load-bearing and neither is visible to any other test:
 *
 *  - kv.ts must memoize the open PROMISE, not the resolved handle. Caching the
 *    handle lets several startup callers each run their own open + schema exec
 *    concurrently. On a FRESH install that is harmless, which is exactly why
 *    the class hides: nothing is missing, so nothing is ALTERed and every
 *    suite stays green. On an UPGRADE install the racers all see the same
 *    missing column, all queue the same ADD COLUMN, and the losers throw —
 *    hydration fails and a real user with real people opens the app to an
 *    empty Today. This is the defect the packing-list SDK-57 device boot
 *    caught on 2026-07-27 (commit f08dcaa).
 *  - There must be exactly ONE openDatabaseAsync call site for the file. Two
 *    call sites are harmless once the SQLite directory exists, but on the
 *    first launch after an install both race expo-sqlite's directory create
 *    and the loser rejects, which again reads as an empty list (packing-list
 *    commit 6546d5e, reproduced at ~2 in 15 cold launches).
 *
 * The fake database below reproduces SQLite's real behaviour — a duplicate
 * ADD COLUMN throws — and every step yields, so concurrent callers genuinely
 * interleave. A regression that re-opens either race turns this file red.
 */

/** A `people` table as it existed before howWeMet / interactions /
 *  personalityTypes were added — i.e. what an upgrading user actually has. */
const LEGACY_PEOPLE_COLUMNS = [
  'id',
  'name',
  'cadenceDays',
  'lastContactedAt',
  'notes',
  'importantDates',
  'preferences',
  'createdAt',
  'updatedAt',
];

let columns: string[] = [];
let openCount = 0;
let createdPeopleTables = 0;

/** Yields to the timer queue so concurrent callers interleave. */
const tick = () => new Promise((r) => setTimeout(r, 0));

/**
 * Every step of the fake database is a real `setTimeout(0)` (that interleaving
 * IS the race under test), so these tests are timer-scheduling bound rather
 * than work bound. Alone they run in well under a second; inside the full
 * parallel suite on a loaded machine the timer queue gets starved and they can
 * blow through a short default. A timeout here is not a slow test, it is a
 * starved one.
 */
const TIMER_BOUND_TIMEOUT_MS = 30_000;

const fakeDb = {
  async execAsync(sql: string) {
    await tick();
    if (/CREATE TABLE IF NOT EXISTS people/.test(sql)) createdPeopleTables += 1;
    const add = /ALTER TABLE people ADD COLUMN (\w+)/.exec(sql);
    if (add) {
      const col = add[1];
      // Exactly what SQLite does — this is the failure the app would hit.
      if (columns.includes(col)) {
        throw new Error(`SQLiteErrorException: duplicate column name: ${col}`);
      }
      columns.push(col);
    }
    return undefined;
  },
  async getAllAsync() {
    await tick();
    return [];
  },
  async getFirstAsync() {
    await tick();
    return null;
  },
  async runAsync() {
    await tick();
    return undefined;
  },
};

jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(async () => {
    openCount += 1;
    await tick();
    return fakeDb;
  }),
}));

beforeEach(() => {
  columns = [...LEGACY_PEOPLE_COLUMNS];
  openCount = 0;
  createdPeopleTables = 0;
});

describe('db init', () => {
  it('opens once and sets the table up once when several callers race at startup', async () => {
    await jest.isolateModulesAsync(async () => {
      const db = require('../db');

      // The real startup shape: the people hydration, the conversation list
      // and a second people read all reach for the database in one tick.
      const [people, conversations] = await Promise.all([
        db.loadAllPeople(),
        db.loadAllConversations(),
        db.loadAllPeople(),
      ]);

      expect(people).toEqual([]);
      expect(conversations).toEqual([]);
      expect(openCount).toBe(1);
      expect(createdPeopleTables).toBe(1);
    });
  }, TIMER_BOUND_TIMEOUT_MS);

  it('opens once across the whole app — domain and shell share one connection', async () => {
    await jest.isolateModulesAsync(async () => {
      const db = require('../db');
      const kv = require('../../storage/kv');

      // Cold start: hydration (domain) and a shell settings read land together.
      await Promise.all([
        db.loadAllPeople(),
        kv.getAppSetting('theme'),
        db.loadAllConversations(),
      ]);

      expect(openCount).toBe(1);
    });
  }, TIMER_BOUND_TIMEOUT_MS);

  it('migrates a legacy people table without failing hydration', async () => {
    await jest.isolateModulesAsync(async () => {
      const db = require('../db');

      // The upgrade path: a table created before these three columns existed.
      await expect(db.loadAllPeople()).resolves.toEqual([]);

      for (const col of ['howWeMet', 'interactions', 'personalityTypes']) {
        expect(columns.filter((c) => c === col)).toHaveLength(1);
      }
    });
  }, TIMER_BOUND_TIMEOUT_MS);

  it('leaves a current schema untouched and still hydrates', async () => {
    await jest.isolateModulesAsync(async () => {
      // A fresh install already has every column, so all three ALTERs throw
      // "duplicate column name" — that has to stay the harmless outcome.
      columns = [
        ...LEGACY_PEOPLE_COLUMNS,
        'howWeMet',
        'interactions',
        'personalityTypes',
      ];
      const db = require('../db');

      await expect(db.loadAllPeople()).resolves.toEqual([]);
      expect(columns).toHaveLength(12);
    });
  }, TIMER_BOUND_TIMEOUT_MS);

  it('does not cache a failed setup — a later call retries the open', async () => {
    await jest.isolateModulesAsync(async () => {
      const SQLite = require('expo-sqlite');
      SQLite.openDatabaseAsync.mockImplementationOnce(async () => {
        openCount += 1;
        await tick();
        throw new Error('Couldn’t create directory');
      });
      const db = require('../db');

      await expect(db.loadAllPeople()).rejects.toThrow();
      // A transient open failure must not leave the people list permanently
      // empty for the rest of the process.
      await expect(db.loadAllPeople()).resolves.toEqual([]);
      expect(openCount).toBe(2);
    });
  }, TIMER_BOUND_TIMEOUT_MS);
});
