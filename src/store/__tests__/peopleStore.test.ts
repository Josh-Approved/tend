/**
 * People store — direct trust-core unit test (Uplevel 3 / T1).
 *
 * The intent fuzzer (intentFuzz.test.ts) drives randomized stories against the
 * store's OUTPUT; this file drives every action DIRECTLY and asserts the exact
 * mechanics the fuzzer can't see — that persistence actually fires with the right
 * object, that a persist/delete failure warns-and-keeps-state, that notifications
 * re-sync on the scheduling paths, and that each mutator touches only its target.
 * Together they close the store's surviving-mutant clusters (persist /
 * syncNotifications / mutate).
 */

jest.mock('../db', () => ({
  loadAllPeople: jest.fn(async () => []),
  savePerson: jest.fn(async () => {}),
  deletePersonFromDb: jest.fn(async () => {}),
}));
jest.mock('../../storage/kv', () => ({ putTombstone: jest.fn(async () => {}) }));
jest.mock('../../lib/notifications', () => ({ rescheduleAll: jest.fn(async () => {}) }));
// The store pulls in lib/contacts (for the real dedupe), which top-level imports
// expo-contacts/legacy — a native module that won't load under jest. Stub it.
jest.mock('expo-contacts/legacy', () => ({
  Fields: {},
  SortTypes: {},
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));
jest.mock('../../qa/qaMode', () => ({ QA_MODE: false }));
jest.mock('../../qa/fixtures', () => ({ qaPeople: () => [] }));

import { usePeopleStore } from '../people';
import { savePerson, loadAllPeople, deletePersonFromDb } from '../db';
import { putTombstone } from '../../storage/kv';
import { rescheduleAll } from '../../lib/notifications';
import { makePerson, type Person } from '../../data/person';

const mSave = savePerson as jest.Mock;
const mLoad = loadAllPeople as jest.Mock;
const mDelete = deletePersonFromDb as jest.Mock;
const mTombstone = putTombstone as jest.Mock;
const mReschedule = rescheduleAll as jest.Mock;

/** Let fire-and-forget persist/delete `.catch` handlers run. */
const flush = () => new Promise((r) => setImmediate(r));

let nowValue: number;
let warnSpy: jest.SpyInstance;

beforeEach(() => {
  jest.clearAllMocks();
  nowValue = 1_000_000;
  jest.spyOn(Date, 'now').mockImplementation(() => nowValue);
  warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  usePeopleStore.setState({ people: [], hydrated: false });
});

afterEach(() => {
  jest.restoreAllMocks();
});

const store = () => usePeopleStore.getState();

// ── createPerson ─────────────────────────────────────────────────────────────
describe('createPerson', () => {
  it('mints a person, prepends it, persists it, and returns its id', () => {
    const id = store().createPerson('Ada');
    const people = store().people;
    expect(people).toHaveLength(1);
    expect(people[0].id).toBe(id);
    expect(people[0].name).toBe('Ada');
    // persisted with the exact new person object
    expect(mSave).toHaveBeenCalledTimes(1);
    expect(mSave).toHaveBeenCalledWith(expect.objectContaining({ id, name: 'Ada' }));
  });

  it('prepends each new person to the front of the list', () => {
    store().createPerson('Ada');
    store().createPerson('Bo');
    const people = store().people;
    expect(people.map((p) => p.name)).toEqual(['Bo', 'Ada']);
  });
});

// ── persist failure handling (L51-52) ────────────────────────────────────────
describe('persist', () => {
  it('keeps the change in state and warns when savePerson rejects', async () => {
    mSave.mockRejectedValueOnce(new Error('disk full'));
    const id = store().createPerson('Ada');
    // state still holds the new person despite the failed disk write
    expect(store().people[0].id).toBe(id);
    await flush();
    expect(warnSpy).toHaveBeenCalledWith('people: failed to persist', expect.any(Error));
  });

  it('does not warn when the write succeeds', async () => {
    store().createPerson('Ada');
    await flush();
    expect(warnSpy).not.toHaveBeenCalledWith('people: failed to persist', expect.anything());
  });
});

// ── mutate core, exercised via renamePerson (L60-70) ─────────────────────────
describe('mutate (via renamePerson)', () => {
  it('changes only the target, bumps its updatedAt, and persists exactly it', () => {
    nowValue = 1_000_000;
    const idA = store().createPerson('Ada');
    const idB = store().createPerson('Bo');
    const beforeB = store().people.find((p) => p.id === idB)!;
    mSave.mockClear();

    nowValue = 2_000_000;
    store().renamePerson(idA, 'Adelaide');

    const a = store().people.find((p) => p.id === idA)!;
    const b = store().people.find((p) => p.id === idB)!;
    expect(a.name).toBe('Adelaide');
    expect(a.updatedAt).toBe(2_000_000); // bumped to the mutate-time clock
    // non-target person completely untouched (same object, same fields)
    expect(b).toBe(beforeB);
    expect(b.name).toBe('Bo');
    expect(b.updatedAt).toBe(1_000_000);
    // persisted exactly the updated target
    expect(mSave).toHaveBeenCalledTimes(1);
    expect(mSave).toHaveBeenCalledWith(expect.objectContaining({ id: idA, name: 'Adelaide', updatedAt: 2_000_000 }));
  });

  it('trims the name on rename', () => {
    const id = store().createPerson('Ada');
    store().renamePerson(id, '  Bo  ');
    expect(store().getPerson(id)!.name).toBe('Bo');
  });

  it('is a no-op (no state change, no persist) for a missing id', () => {
    const id = store().createPerson('Ada');
    const beforePerson = store().getPerson(id)!;
    mSave.mockClear();
    store().renamePerson('does-not-exist', 'X');
    // the target person is left byte-for-byte identical...
    expect(store().getPerson(id)).toBe(beforePerson);
    expect(store().getPerson(id)!.name).toBe('Ada');
    // ...and nothing is persisted (the mutate `updated` stayed undefined)
    expect(mSave).not.toHaveBeenCalled();
  });
});

// ── getPerson ────────────────────────────────────────────────────────────────
describe('getPerson', () => {
  it('returns the person for a known id and undefined otherwise', () => {
    const id = store().createPerson('Ada');
    expect(store().getPerson(id)!.name).toBe('Ada');
    expect(store().getPerson('nope')).toBeUndefined();
  });
});

// ── setCadence (L104-108) ────────────────────────────────────────────────────
describe('setCadence', () => {
  it('sets the cadence and reschedules WITH a prompt when non-null', () => {
    const id = store().createPerson('Ada');
    mReschedule.mockClear();
    store().setCadence(id, 7);
    expect(store().getPerson(id)!.cadenceDays).toBe(7);
    expect(mReschedule).toHaveBeenCalledWith(expect.any(Array), { prompt: true });
  });

  it('clears the cadence and reschedules WITHOUT a prompt when null', () => {
    const id = store().createPerson('Ada');
    store().setCadence(id, 30);
    mReschedule.mockClear();
    store().setCadence(id, null);
    expect(store().getPerson(id)!.cadenceDays).toBeNull();
    expect(mReschedule).toHaveBeenCalledWith(expect.any(Array), { prompt: false });
  });
});

// ── logContact ───────────────────────────────────────────────────────────────
describe('logContact', () => {
  it('prepends an interaction, sets lastContactedAt, and re-syncs notifications', () => {
    const id = store().createPerson('Ada');
    nowValue = 5_000_000;
    mReschedule.mockClear();
    store().logContact(id, 'call', 'caught up');
    const p = store().getPerson(id)!;
    expect(p.interactions).toHaveLength(1);
    expect(p.interactions[0].kind).toBe('call');
    expect(p.interactions[0].note).toBe('caught up');
    expect(p.lastContactedAt).toBe(p.interactions[0].at);
    // notifications re-synced with the current people list
    expect(mReschedule).toHaveBeenCalledWith(store().people);
  });

  it('prepends newer interactions in front of older ones', () => {
    const id = store().createPerson('Ada');
    store().logContact(id, 'call');
    store().logContact(id, 'text');
    const p = store().getPerson(id)!;
    expect(p.interactions.map((i) => i.kind)).toEqual(['text', 'call']);
  });

  it("defaults the interaction kind to 'other' when none is given", () => {
    const id = store().createPerson('Ada');
    store().logContact(id); // no kind arg — exercises the L111 default
    expect(store().getPerson(id)!.interactions[0].kind).toBe('other');
  });
});

// ── setNotes / setHowWeMet ───────────────────────────────────────────────────
describe('setNotes', () => {
  it('stores notes verbatim (no trimming)', () => {
    const id = store().createPerson('Ada');
    store().setNotes(id, '  keep the spaces  ');
    expect(store().getPerson(id)!.notes).toBe('  keep the spaces  ');
  });
});

describe('setHowWeMet', () => {
  it('trims and keeps a non-empty value', () => {
    const id = store().createPerson('Ada');
    store().setHowWeMet(id, '  met at work  ');
    expect(store().getPerson(id)!.howWeMet).toBe('met at work');
  });

  it('collapses a blank value to undefined', () => {
    const id = store().createPerson('Ada');
    store().setHowWeMet(id, 'x');
    store().setHowWeMet(id, '   ');
    expect(store().getPerson(id)!.howWeMet).toBeUndefined();
  });
});

// ── important dates ──────────────────────────────────────────────────────────
describe('important dates', () => {
  it('adds a date and re-syncs notifications', () => {
    const id = store().createPerson('Ada');
    mReschedule.mockClear();
    store().addImportantDate(id, 'Birthday', 3, 14, 1990);
    const dates = store().getPerson(id)!.importantDates;
    expect(dates).toHaveLength(1);
    expect(dates[0]).toMatchObject({ label: 'Birthday', month: 3, day: 14, year: 1990 });
    expect(mReschedule).toHaveBeenCalledWith(store().people);
  });

  it('removes exactly the targeted date, keeping the others', () => {
    const id = store().createPerson('Ada');
    store().addImportantDate(id, 'Birthday', 3, 14);
    store().addImportantDate(id, 'Anniversary', 6, 1);
    const [first, second] = store().getPerson(id)!.importantDates;
    mReschedule.mockClear();
    store().removeImportantDate(id, first.id);
    const remaining = store().getPerson(id)!.importantDates;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(second.id);
    expect(remaining[0].label).toBe('Anniversary');
    expect(mReschedule).toHaveBeenCalledWith(store().people);
  });
});

// ── preferences ──────────────────────────────────────────────────────────────
describe('preferences', () => {
  it('adds a trimmed preference', () => {
    const id = store().createPerson('Ada');
    store().addPreference(id, 'gift', '  fountain pen  ');
    const prefs = store().getPerson(id)!.preferences;
    expect(prefs).toHaveLength(1);
    expect(prefs[0]).toMatchObject({ kind: 'gift', text: 'fountain pen' });
  });

  it('ignores a blank preference (no add, no persist)', () => {
    const id = store().createPerson('Ada');
    mSave.mockClear();
    store().addPreference(id, 'like', '   ');
    expect(store().getPerson(id)!.preferences).toHaveLength(0);
    expect(mSave).not.toHaveBeenCalled();
  });

  it('removes exactly the targeted preference, keeping the others', () => {
    const id = store().createPerson('Ada');
    store().addPreference(id, 'like', 'coffee');
    store().addPreference(id, 'dislike', 'cilantro');
    const [first, second] = store().getPerson(id)!.preferences;
    store().removePreference(id, first.id);
    const remaining = store().getPerson(id)!.preferences;
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(second.id);
    expect(remaining[0].text).toBe('cilantro');
  });
});

// ── personality ──────────────────────────────────────────────────────────────
describe('setPersonalityType', () => {
  it('sets and then clears a framework value', () => {
    const id = store().createPerson('Ada');
    store().setPersonalityType(id, 'enneagram', '5');
    expect(store().getPerson(id)!.personalityTypes).toEqual([{ framework: 'enneagram', value: '5' }]);
    store().setPersonalityType(id, 'enneagram', null);
    expect(store().getPerson(id)!.personalityTypes).toEqual([]);
  });
});

// ── deletePerson ─────────────────────────────────────────────────────────────
describe('deletePerson', () => {
  it('removes exactly the target, tombstones it, and re-syncs notifications', () => {
    const idA = store().createPerson('Ada');
    const idB = store().createPerson('Bo');
    mReschedule.mockClear();
    store().deletePerson(idA);
    const ids = store().people.map((p) => p.id);
    expect(ids).toEqual([idB]);
    expect(mDelete).toHaveBeenCalledWith(idA);
    expect(mTombstone).toHaveBeenCalledWith(idA, expect.any(Number));
    expect(mReschedule).toHaveBeenCalledWith(store().people);
  });

  it('keeps the state change but warns when the disk delete rejects', async () => {
    const id = store().createPerson('Ada');
    mDelete.mockRejectedValueOnce(new Error('locked'));
    store().deletePerson(id);
    expect(store().people).toHaveLength(0); // state already updated
    await flush();
    expect(warnSpy).toHaveBeenCalledWith('people: failed to delete', expect.any(Error));
  });
});

// ── importPeople (L164-173) ──────────────────────────────────────────────────
describe('importPeople', () => {
  it('adds fresh people, prepends them, persists each, and returns the count added', () => {
    store().createPerson('Existing');
    mSave.mockClear();
    const incoming: Person[] = [makePerson('Ada'), makePerson('Bo')];
    const added = store().importPeople(incoming);
    expect(added).toBe(2);
    const names = store().people.map((p) => p.name);
    expect(names).toEqual(['Ada', 'Bo', 'Existing']); // added prepended, order preserved
    expect(mSave).toHaveBeenCalledTimes(2);
  });

  it('dedupes by name — importing an already-tracked name adds 0', () => {
    store().createPerson('Ada');
    mSave.mockClear();
    const added = store().importPeople([makePerson('Ada')]);
    expect(added).toBe(0);
    expect(store().people).toHaveLength(1);
    expect(mSave).not.toHaveBeenCalled();
  });

  it('returns 0 and does not mutate when there is nothing to add', () => {
    const before = store().people;
    mReschedule.mockClear();
    const added = store().importPeople([]);
    expect(added).toBe(0);
    expect(store().people).toBe(before);
    expect(mReschedule).not.toHaveBeenCalled();
  });

  it('re-syncs notifications when it actually adds someone', () => {
    mReschedule.mockClear();
    store().importPeople([makePerson('Ada')]);
    expect(mReschedule).toHaveBeenCalledWith(store().people);
  });
});

// ── hydrate (L76-89) ─────────────────────────────────────────────────────────
describe('hydrate', () => {
  it('loads people from disk and re-syncs notifications', async () => {
    const loaded = [makePerson('Ada'), makePerson('Bo')];
    mLoad.mockResolvedValueOnce(loaded);
    await store().hydrate();
    expect(store().people).toEqual(loaded);
    expect(store().hydrated).toBe(true);
    expect(mReschedule).toHaveBeenCalledWith(store().people);
  });

  it('stays empty but marks hydrated when disk has no people (QA_MODE off)', async () => {
    mLoad.mockResolvedValueOnce([]);
    await store().hydrate();
    expect(store().people).toEqual([]);
    expect(store().hydrated).toBe(true);
  });

  it('warns, flips hydrated, and keeps people empty when the load rejects', async () => {
    mLoad.mockRejectedValueOnce(new Error('corrupt db'));
    await store().hydrate();
    expect(warnSpy).toHaveBeenCalledWith('people: failed to load from disk', expect.any(Error));
    expect(store().hydrated).toBe(true);
    expect(store().people).toEqual([]);
  });

  it('seeds QA fixtures when QA_MODE is on and disk is empty', async () => {
    const seeded = [makePerson('Fixture Fran')];
    const freshStore = requireQaStore({ loaded: [], fixtures: seeded });
    await freshStore.getState().hydrate();
    expect(freshStore.getState().people).toEqual(seeded);
    expect(freshStore.getState().hydrated).toBe(true);
  });

  it('keeps the LOADED people (not fixtures) when QA_MODE is on but disk is NON-empty', async () => {
    const loaded = [makePerson('Real Rita'), makePerson('Real Ravi')];
    const fixtures = [makePerson('Sentinel Fixture')]; // distinct ids
    const freshStore = requireQaStore({ loaded, fixtures });
    await freshStore.getState().hydrate();
    // real code takes the else branch (loaded.length !== 0) → keeps loaded;
    // both L79 mutants (QA_MODE || …, condition → true) would wrongly seed fixtures.
    expect(freshStore.getState().people).toEqual(loaded);
    expect(freshStore.getState().people).not.toEqual(fixtures);
  });

  it("starts hydrated=false before any hydrate/setState on a pristine module", () => {
    jest.resetModules();
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const freshStore = require('../people').usePeopleStore;
    // observe the store's own initial state — beforeEach's setState hasn't touched
    // this fresh instance, so the L74 `hydrated: false` literal is exercised.
    expect(freshStore.getState().hydrated).toBe(false);
    expect(freshStore.getState().people).toEqual([]);
  });
});

/**
 * Re-require the store with QA_MODE forced on and controllable load/fixtures, in
 * a fresh module registry so the store's create() runs against these mocks.
 */
function requireQaStore(opts: { loaded: Person[]; fixtures: Person[] }) {
  jest.resetModules();
  jest.doMock('../db', () => ({
    loadAllPeople: jest.fn(async () => opts.loaded),
    savePerson: jest.fn(async () => {}),
    deletePersonFromDb: jest.fn(async () => {}),
  }));
  jest.doMock('../../storage/kv', () => ({ putTombstone: jest.fn(async () => {}) }));
  jest.doMock('../../lib/notifications', () => ({ rescheduleAll: jest.fn(async () => {}) }));
  jest.doMock('expo-contacts/legacy', () => ({
    Fields: {},
    SortTypes: {},
    requestPermissionsAsync: jest.fn(),
    getContactsAsync: jest.fn(),
  }));
  jest.doMock('../../qa/qaMode', () => ({ QA_MODE: true }));
  jest.doMock('../../qa/fixtures', () => ({ qaPeople: () => opts.fixtures }));
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('../people').usePeopleStore as typeof usePeopleStore;
}
