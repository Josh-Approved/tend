/**
 * Intent fuzzer — the adversarial gate for Tend's trust core (Uplevel 3 / T1).
 *
 * WHAT'S THE TRUST CORE. Tend keeps the practical memory you hold about the
 * people you want to stay close to: their name, notes, how you met, cadence,
 * important dates, preferences, personality read, and the running history of
 * your catch-ups — plus the reminder ("who's due?") derived from that, and the
 * manual export/import round-trip that IS "your data stays with you". The real
 * store (`usePeopleStore`, a production zustand store) is the system under test;
 * the `Map<id, ...>` model is the INDEPENDENT intent ledger (the oracle).
 *
 * (The spec bullet says "encrypted-export round-trip". Reality: the export is a
 * plain JSON envelope — the E2E-encryption tenet is about data we might operate,
 * and Tend operates none; the file never leaves the device unless the user
 * shares it. The oracle tests what actually ships: sanitize(export(person))
 * restores every field. Noted in the stage STATUS.)
 *
 * ORACLES (intent, never convergence-only — canon 2026-07-03):
 *   I-FIELDS   after any interleaved edit story, every live person's every
 *              field reads back exactly what the story last wrote — nothing
 *              lost, nothing bled across people. Count matches too (no dupe,
 *              no phantom).
 *   I-GONE     a deleted person's id never reappears; a re-add by name is a
 *              FRESH record (new id), never a resurrection.
 *   I-DEDUPE   import adds exactly the names not already held (case-insensitive,
 *              blanks dropped) — never doubles anyone.
 *   I-DUE      the reminder state (dueStatus) a person reads matches an
 *              independent re-derivation from cadence + last-contact.
 *   I-ROUNDTRIP  sanitize(JSON round-trip(person)) === person, field for field
 *              (modulo re-minted id/timestamps) — "import restores exactly what
 *              export wrote".
 */

import fc from 'fast-check';
import { runIntentFuzz, intent } from '../../../qa/intent-fuzz/harness';
import { replayRegressions } from '../../../qa/intent-fuzz/replay';

jest.mock('../db', () => ({
  loadAllPeople: jest.fn(async () => []),
  savePerson: jest.fn(async () => {}),
  deletePersonFromDb: jest.fn(async () => {}),
}));
jest.mock('../../storage/kv', () => ({ putTombstone: jest.fn(async () => {}) }));
jest.mock('../../lib/notifications', () => ({ rescheduleAll: jest.fn(async () => {}) }));
// The store pulls in lib/contacts for the real dedupe (the thing under test),
// which top-level imports expo-contacts/legacy — whose native module won't load
// under jest. Stub the native surface; the pure dedupe never touches it.
jest.mock('expo-contacts/legacy', () => ({
  Fields: {},
  SortTypes: {},
  requestPermissionsAsync: jest.fn(),
  getContactsAsync: jest.fn(),
}));
jest.mock('../../qa/qaMode', () => ({ QA_MODE: false }));
jest.mock('../../qa/fixtures', () => ({ qaPeople: () => [] }));

import {
  type Person,
  type PreferenceKind,
  type InteractionKind,
  type PersonalityFramework,
  type DueState,
  DAY_MS,
  SOON_WINDOW_DAYS,
  dueStatus,
  sanitizeImportedPerson,
} from '../../data/person';

const APP = require('../../../app.json').expo.slug as string;

// ── the real store, shaped to what the model drives ──────────────────────────
type PeopleStore = {
  getState: () => {
    people: Person[];
    createPerson: (name?: string) => string;
    renamePerson: (id: string, name: string) => void;
    setCadence: (id: string, cadenceDays: number | null) => void;
    logContact: (id: string, kind?: InteractionKind, note?: string) => void;
    setNotes: (id: string, notes: string) => void;
    setHowWeMet: (id: string, howWeMet: string) => void;
    addImportantDate: (id: string, label: string, month: number, day: number, year?: number) => void;
    removeImportantDate: (id: string, dateId: string) => void;
    addPreference: (id: string, kind: PreferenceKind, text: string) => void;
    removePreference: (id: string, prefId: string) => void;
    setPersonalityType: (id: string, framework: PersonalityFramework, value: string | null) => void;
    deletePerson: (id: string) => void;
    importPeople: (incoming: Person[]) => number;
  };
};
interface Real {
  store: PeopleStore;
}

// The independent intent ledger for one person: exactly what the story wrote.
interface MP {
  name: string;
  cadenceDays: number | null;
  hasContact: boolean;
  interactions: number;
  notes: string;
  howWeMet: string | undefined;
  dates: Array<{ label: string; month: number; day: number; year?: number }>;
  prefs: Array<{ kind: PreferenceKind; text: string }>;
  personality: Map<PersonalityFramework, string>;
}
interface Model {
  people: Map<string, MP>; // id -> ledger
}

const FRAMEWORKS: PersonalityFramework[] = ['enneagram', 'attachment'];
const PREF_KINDS: PreferenceKind[] = ['like', 'dislike', 'gift'];
const KINDS: InteractionKind[] = ['call', 'text', 'inPerson', 'other'];

function live(r: Real): Person[] {
  return r.store.getState().people;
}
function pickId(m: Model, r: Real, n: number): string | null {
  const ids = live(r).map((p) => p.id);
  if (ids.length === 0) return null;
  return ids[n % ids.length];
}

/** Independent re-derivation of the reminder state — the I-DUE oracle. */
function expectedDueState(p: Person, now: number): DueState {
  if (p.cadenceDays == null || p.cadenceDays <= 0) return 'none';
  const base = p.lastContactedAt ?? p.createdAt;
  const msUntil = base + p.cadenceDays * DAY_MS - now;
  if (msUntil <= 0) return 'overdue';
  return Math.ceil(msUntil / DAY_MS) <= SOON_WINDOW_DAYS ? 'soon' : 'ok';
}

/** I-FIELDS + I-GONE: every live person reads back exactly the ledger, and the
 *  store holds precisely the modelled set (no loss, no dupe, no resurrection). */
function checkFields(m: Model, r: Real): void {
  const people = live(r);
  intent(
    `store should hold exactly ${m.people.size} people (had ${people.length})`,
    people.length === m.people.size
  );
  const byId = new Map(people.map((p) => [p.id, p]));
  for (const [id, mp] of m.people) {
    const p = byId.get(id);
    intent(`person ${id} must still exist`, p != null);
    if (!p) continue;
    intent(`name should be "${mp.name}" (was "${p.name}")`, p.name === mp.name);
    intent(`notes should survive`, p.notes === mp.notes);
    intent(`howWeMet should survive`, p.howWeMet === mp.howWeMet);
    intent(`cadence should be ${mp.cadenceDays}`, p.cadenceDays === mp.cadenceDays);
    intent(
      `interactions count should be ${mp.interactions} (was ${p.interactions.length})`,
      p.interactions.length === mp.interactions
    );
    intent(
      `last-contact flag should be ${mp.hasContact}`,
      mp.hasContact ? p.lastContactedAt != null : p.lastContactedAt == null
    );
    intent(
      `important dates should survive in order`,
      sameDates(p.importantDates, mp.dates)
    );
    intent(`preferences should survive in order`, samePrefs(p.preferences, mp.prefs));
    intent(`personality read should survive`, samePersonality(p, mp.personality));
  }
}

function sameDates(actual: Person['importantDates'], expected: MP['dates']): boolean {
  if (actual.length !== expected.length) return false;
  return actual.every((d, i) => {
    const e = expected[i];
    return d.label === e.label && d.month === e.month && d.day === e.day && d.year === e.year;
  });
}
function samePrefs(actual: Person['preferences'], expected: MP['prefs']): boolean {
  if (actual.length !== expected.length) return false;
  return actual.every((p, i) => p.kind === expected[i].kind && p.text === expected[i].text);
}
function samePersonality(p: Person, expected: Map<PersonalityFramework, string>): boolean {
  if (p.personalityTypes.length !== expected.size) return false;
  return p.personalityTypes.every((pt) => expected.get(pt.framework) === pt.value);
}

/** I-ROUNDTRIP: what export writes, import restores — field for field. */
function checkRoundTrip(r: Real): void {
  for (const p of live(r)) {
    const restored = sanitizeImportedPerson(JSON.parse(JSON.stringify(p)));
    intent(`export/import must restore person "${p.name}"`, restored != null);
    if (!restored) continue;
    intent('name round-trips', restored.name === p.name);
    intent('cadence round-trips', restored.cadenceDays === p.cadenceDays);
    intent('last-contact round-trips', restored.lastContactedAt === p.lastContactedAt);
    intent('notes round-trip', restored.notes === p.notes);
    intent('howWeMet round-trips', restored.howWeMet === p.howWeMet);
    intent('important dates round-trip', sameDates(restored.importantDates, p.importantDates));
    intent('preferences round-trip', samePrefs(restored.preferences, p.preferences));
    intent(
      'personality round-trips',
      restored.personalityTypes.length === p.personalityTypes.length &&
        p.personalityTypes.every((pt) =>
          restored.personalityTypes.some((q) => q.framework === pt.framework && q.value === pt.value)
        )
    );
    intent(
      'interactions round-trip',
      restored.interactions.length === p.interactions.length &&
        p.interactions.every((it, i) => {
          const q = restored.interactions[i];
          return q.at === it.at && q.kind === it.kind && q.note === it.note;
        })
    );
  }
}

// ── commands: one per real user action ───────────────────────────────────────
class CreatePerson implements fc.Command<Model, Real> {
  constructor(readonly name: string) {}
  check = () => true;
  run(m: Model, r: Real): void {
    const id = r.store.getState().createPerson(this.name);
    m.people.set(id, {
      name: this.name.trim(),
      cadenceDays: null,
      hasContact: false,
      interactions: 0,
      notes: '',
      howWeMet: undefined,
      dates: [],
      prefs: [],
      personality: new Map(),
    });
    checkFields(m, r);
  }
  toString = () => `create(${JSON.stringify(this.name)})`;
}

class Rename implements fc.Command<Model, Real> {
  constructor(readonly pick: number, readonly name: string) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    r.store.getState().renamePerson(id, this.name);
    m.people.get(id)!.name = this.name.trim();
    checkFields(m, r);
  }
  toString = () => `rename(#${this.pick}, ${JSON.stringify(this.name)})`;
}

class SetNotes implements fc.Command<Model, Real> {
  constructor(readonly pick: number, readonly notes: string) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    r.store.getState().setNotes(id, this.notes);
    m.people.get(id)!.notes = this.notes;
    checkFields(m, r);
  }
  toString = () => `notes(#${this.pick})`;
}

class SetHowWeMet implements fc.Command<Model, Real> {
  constructor(readonly pick: number, readonly text: string) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    r.store.getState().setHowWeMet(id, this.text);
    const trimmed = this.text.trim();
    m.people.get(id)!.howWeMet = trimmed ? trimmed : undefined;
    checkFields(m, r);
  }
  toString = () => `howWeMet(#${this.pick})`;
}

class SetCadence implements fc.Command<Model, Real> {
  constructor(readonly pick: number, readonly days: number | null) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    r.store.getState().setCadence(id, this.days);
    m.people.get(id)!.cadenceDays = this.days;
    checkFields(m, r);
  }
  toString = () => `cadence(#${this.pick}, ${this.days})`;
}

class LogContact implements fc.Command<Model, Real> {
  constructor(readonly pick: number, readonly kind: InteractionKind) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    r.store.getState().logContact(id, this.kind);
    const mp = m.people.get(id)!;
    mp.hasContact = true;
    mp.interactions += 1;
    checkFields(m, r);
  }
  toString = () => `log(#${this.pick}, ${this.kind})`;
}

class AddDate implements fc.Command<Model, Real> {
  constructor(
    readonly pick: number,
    readonly label: string,
    readonly month: number,
    readonly day: number,
    readonly year: number | undefined
  ) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    r.store.getState().addImportantDate(id, this.label, this.month, this.day, this.year);
    m.people.get(id)!.dates.push({
      label: this.label.trim() || 'Date',
      month: this.month,
      day: this.day,
      year: this.year,
    });
    checkFields(m, r);
  }
  toString = () => `addDate(#${this.pick})`;
}

class RemoveDate implements fc.Command<Model, Real> {
  constructor(readonly pick: number, readonly idx: number) {}
  check = (m: Model) => [...m.people.values()].some((p) => p.dates.length > 0);
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    const p = live(r).find((x) => x.id === id)!;
    if (p.importantDates.length === 0) return;
    const i = this.idx % p.importantDates.length;
    r.store.getState().removeImportantDate(id, p.importantDates[i].id);
    m.people.get(id)!.dates.splice(i, 1);
    checkFields(m, r);
  }
  toString = () => `rmDate(#${this.pick}, ${this.idx})`;
}

class AddPref implements fc.Command<Model, Real> {
  constructor(readonly pick: number, readonly kind: PreferenceKind, readonly text: string) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    r.store.getState().addPreference(id, this.kind, this.text);
    const trimmed = this.text.trim();
    if (trimmed) m.people.get(id)!.prefs.push({ kind: this.kind, text: trimmed });
    checkFields(m, r);
  }
  toString = () => `addPref(#${this.pick}, ${this.kind})`;
}

class RemovePref implements fc.Command<Model, Real> {
  constructor(readonly pick: number, readonly idx: number) {}
  check = (m: Model) => [...m.people.values()].some((p) => p.prefs.length > 0);
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    const p = live(r).find((x) => x.id === id)!;
    if (p.preferences.length === 0) return;
    const i = this.idx % p.preferences.length;
    r.store.getState().removePreference(id, p.preferences[i].id);
    m.people.get(id)!.prefs.splice(i, 1);
    checkFields(m, r);
  }
  toString = () => `rmPref(#${this.pick}, ${this.idx})`;
}

class SetPersonality implements fc.Command<Model, Real> {
  constructor(
    readonly pick: number,
    readonly framework: PersonalityFramework,
    readonly value: string | null
  ) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    r.store.getState().setPersonalityType(id, this.framework, this.value);
    const map = m.people.get(id)!.personality;
    if (this.value) map.set(this.framework, this.value);
    else map.delete(this.framework);
    checkFields(m, r);
  }
  toString = () => `personality(#${this.pick}, ${this.framework}=${this.value})`;
}

class DeletePerson implements fc.Command<Model, Real> {
  constructor(readonly pick: number) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    r.store.getState().deletePerson(id);
    m.people.delete(id);
    intent(`deleted id ${id} must not resurrect`, !live(r).some((p) => p.id === id));
    checkFields(m, r);
  }
  toString = () => `delete(#${this.pick})`;
}

class ImportPeople implements fc.Command<Model, Real> {
  constructor(readonly names: string[]) {}
  check = () => true;
  run(m: Model, r: Real): void {
    // Import mints fresh records; sanitize gives each a fresh id, so the store's
    // dedupe (by trimmed lowercased name) is the thing under test.
    const incoming = this.names
      .map((n) => sanitizeImportedPerson({ name: n }))
      .filter((p): p is Person => p != null);
    const before = new Set(live(r).map((p) => p.id));
    const added = r.store.getState().importPeople(incoming);

    // Independent expectation: names not already held, blanks dropped, first
    // occurrence within the batch wins.
    const seen = new Set([...m.people.values()].map((p) => p.name.trim().toLowerCase()));
    let expected = 0;
    for (const n of this.names) {
      const key = n.trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      expected += 1;
    }
    intent(`import should add exactly ${expected} (added ${added})`, added === expected);

    for (const p of live(r)) {
      if (before.has(p.id)) continue;
      m.people.set(p.id, {
        name: p.name,
        cadenceDays: null,
        hasContact: false,
        interactions: 0,
        notes: '',
        howWeMet: undefined,
        dates: [],
        prefs: [],
        personality: new Map(),
      });
    }
    checkFields(m, r);
  }
  toString = () => `import(${JSON.stringify(this.names)})`;
}

class ProbeDue implements fc.Command<Model, Real> {
  constructor(readonly pick: number, readonly offsetDays: number) {}
  check = (m: Model) => m.people.size > 0;
  run(m: Model, r: Real): void {
    const id = pickId(m, r, this.pick);
    if (!id) return;
    const p = live(r).find((x) => x.id === id)!;
    // A `now` anchored to this person's own clock, so the boundary probe is
    // deterministic relative to stored data (not the wall clock).
    const base = p.lastContactedAt ?? p.createdAt;
    const now = base + this.offsetDays * DAY_MS;
    const got = dueStatus(p, now).state;
    const want = expectedDueState(p, now);
    intent(`due state should be ${want} at +${this.offsetDays}d (was ${got})`, got === want);
  }
  toString = () => `probeDue(#${this.pick}, +${this.offsetDays}d)`;
}

// ── arbitraries ──────────────────────────────────────────────────────────────
const name = fc.oneof(
  fc.constantFrom('Ada', 'Bo', 'Cy', 'Di', 'Ada ', ' bo', 'DI', ''),
  fc.string({ maxLength: 12 })
);
const text = fc.oneof(fc.constantFrom('', ' ', 'note', ' trim me '), fc.string({ maxLength: 20 }));
const cadence = fc.oneof(
  fc.constant<number | null>(null),
  fc.constantFrom(0, -3, 7, 14, 30, 90),
  fc.integer({ min: -10, max: 400 })
);

const commands: fc.Arbitrary<fc.Command<Model, Real>>[] = [
  name.map((n) => new CreatePerson(n)),
  fc.tuple(fc.nat(), name).map(([p, n]) => new Rename(p, n)),
  fc.tuple(fc.nat(), text).map(([p, t]) => new SetNotes(p, t)),
  fc.tuple(fc.nat(), text).map(([p, t]) => new SetHowWeMet(p, t)),
  fc.tuple(fc.nat(), cadence).map(([p, d]) => new SetCadence(p, d)),
  fc.tuple(fc.nat(), fc.constantFrom(...KINDS)).map(([p, k]) => new LogContact(p, k)),
  fc
    .tuple(fc.nat(), text, fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 28 }), fc.option(fc.integer({ min: 1900, max: 2100 }), { nil: undefined }))
    .map(([p, l, mo, d, y]) => new AddDate(p, l, mo, d, y)),
  fc.tuple(fc.nat(), fc.nat()).map(([p, i]) => new RemoveDate(p, i)),
  fc.tuple(fc.nat(), fc.constantFrom(...PREF_KINDS), text).map(([p, k, t]) => new AddPref(p, k, t)),
  fc.tuple(fc.nat(), fc.nat()).map(([p, i]) => new RemovePref(p, i)),
  fc
    .tuple(fc.nat(), fc.constantFrom(...FRAMEWORKS), fc.oneof(fc.constant<string | null>(null), fc.constantFrom('5', '9', 'secure', 'anxious')))
    .map(([p, f, v]) => new SetPersonality(p, f, v)),
  fc.nat().map((p) => new DeletePerson(p)),
  fc.array(name, { maxLength: 4 }).map((ns) => new ImportPeople(ns)),
  fc.tuple(fc.nat(), fc.integer({ min: -5, max: 400 })).map(([p, o]) => new ProbeDue(p, o)),
];

function setup(): { model: Model; real: Real } {
  let store!: PeopleStore;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    store = require('../people').usePeopleStore;
  });
  return { model: { people: new Map() }, real: { store } };
}

export function buildPeopleProperty(): fc.IPropertyWithHooks<unknown> {
  return fc.property(fc.commands(commands, { maxCommands: 60 }), (cmds) => {
    const s = setup();
    fc.modelRun(() => ({ model: s.model, real: s.real }), cmds);
    checkFields(s.model, s.real);
    checkRoundTrip(s.real);
  }) as unknown as fc.IPropertyWithHooks<unknown>;
}

describe('people store — intent fuzzer', () => {
  it('every field, reminder, and export/import survives randomized stories', () => {
    runIntentFuzz<Model, Real>({
      app: APP,
      model: 'people',
      commands,
      setup,
      atQuiescence: (s) => {
        checkFields(s.model, s.real);
        checkRoundTrip(s.real);
      },
    });
  });
});

replayRegressions({ models: { people: buildPeopleProperty } });
