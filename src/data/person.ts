/**
 * Domain model for Tend: a person you want to keep up with, the practical memory
 * you keep about them, and the history of your catch-ups. THIS IS THE APP'S OWN
 * CODE (the trust core) — kept pure (no expo / RN imports) so jest-expo tests it
 * directly (src/data/__tests__/person.test.ts), and lib/transfer.ts reuses
 * `sanitizeImportedPerson` for additive import.
 *
 * The load-bearing logic is `dueStatus` ("who should I reach out to, and how does
 * that read?") and `upcomingDates` (birthdays/anniversaries coming up). Both pure
 * and heavily tested.
 */

import { makeId } from '../lib/id';

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Within this many days of due, a person reads as "soon" rather than "ok". */
export const SOON_WINDOW_DAYS = 2;
/** How far ahead the home "Coming up" section looks for important dates. */
export const UPCOMING_WINDOW_DAYS = 30;

export type PreferenceKind = 'like' | 'dislike' | 'gift';

export interface Preference {
  id: string;
  kind: PreferenceKind;
  text: string;
}

export interface ImportantDate {
  id: string;
  /** "Birthday", "Anniversary", or a custom label. */
  label: string;
  month: number; // 1-12
  day: number; // 1-31
  year?: number; // optional
}

export type InteractionKind = 'call' | 'text' | 'inPerson' | 'other';

export interface Interaction {
  id: string;
  at: number; // ms epoch
  kind: InteractionKind;
  note?: string;
}

/**
 * Personality frameworks we support. Both are open (no trademark): the app
 * records the type in ~2 taps and supplies its OWN plain "how to relate to this
 * person" guidance (no trademarked text). MBTI® and the "Love Languages" are
 * deliberately excluded — their names/text are protected (canon: clone the
 * function, not the expression). The per-type labels + guidance live in i18n
 * under `personality.<framework>.<value>.{short,label,relate}`; the value
 * catalog + key helpers live in ./personality.
 */
export type PersonalityFramework = 'enneagram' | 'attachment';

export const PERSONALITY_FRAMEWORKS: readonly PersonalityFramework[] = ['enneagram', 'attachment'];

export interface PersonalityType {
  framework: PersonalityFramework;
  /** Framework-specific value key, e.g. '5' (enneagram) or 'secure' (attachment). */
  value: string;
}

export interface Person {
  id: string;
  name: string;
  /** Days between intended check-ins. null = no reminder cadence. */
  cadenceDays: number | null;
  /** When you last reached out, ms epoch. null = never. */
  lastContactedAt: number | null;
  notes: string;
  /** How you met / where it started. */
  howWeMet?: string;
  importantDates: ImportantDate[];
  preferences: Preference[];
  /** Optional personality types (at most one per framework). Depth-as-lookup. */
  personalityTypes: PersonalityType[];
  /** Catch-up history, newest first is not guaranteed — sort on read. */
  interactions: Interaction[];
  createdAt: number;
  updatedAt: number;
  /** Soft-delete tombstone (canon § Backup #5) — null/undefined = active. */
  deletedAt?: number;
}

export type DueState = 'overdue' | 'soon' | 'ok' | 'none';

export interface DueStatus {
  state: DueState;
  dueAt: number | null;
  daysUntilDue: number | null;
}

/** Cadence presets offered in the UI, in days. null = no reminder. */
export const CADENCE_PRESETS: ReadonlyArray<{ key: string; days: number | null }> = [
  { key: 'none', days: null },
  { key: 'weekly', days: 7 },
  { key: 'biweekly', days: 14 },
  { key: 'monthly', days: 30 },
  { key: 'quarterly', days: 90 },
];

export const INTERACTION_KINDS: readonly InteractionKind[] = ['call', 'text', 'inPerson', 'other'];

export function makePerson(name = ''): Person {
  const now = Date.now();
  return {
    id: makeId('p'),
    name: name.trim(),
    cadenceDays: null,
    lastContactedAt: null,
    notes: '',
    howWeMet: undefined,
    importantDates: [],
    preferences: [],
    personalityTypes: [],
    interactions: [],
    createdAt: now,
    updatedAt: now,
  };
}

/** The currently selected value for a framework, or undefined if none set. Pure. */
export function personalityValue(person: Person, framework: PersonalityFramework): string | undefined {
  return person.personalityTypes.find((pt) => pt.framework === framework)?.value;
}

/**
 * Pure updater: set (or replace) the value for a framework, or clear it with
 * null. At most one entry per framework. Returns a new array.
 */
export function setPersonalityValue(
  types: PersonalityType[],
  framework: PersonalityFramework,
  value: string | null
): PersonalityType[] {
  const rest = types.filter((pt) => pt.framework !== framework);
  return value ? [...rest, { framework, value }] : rest;
}

export function makePreference(kind: PreferenceKind, text: string): Preference {
  return { id: makeId('pref'), kind, text: text.trim() };
}

export function makeImportantDate(label: string, month: number, day: number, year?: number): ImportantDate {
  return { id: makeId('date'), label: label.trim() || 'Date', month, day, year };
}

export function makeInteraction(kind: InteractionKind, note?: string, at = Date.now()): Interaction {
  const trimmed = note?.trim();
  return { id: makeId('int'), at, kind, note: trimmed ? trimmed : undefined };
}

export function activePeople(people: Person[]): Person[] {
  return people.filter((p) => p.deletedAt == null);
}

/** Catch-ups newest first. */
export function sortedInteractions(person: Person): Interaction[] {
  return person.interactions.slice().sort((a, b) => b.at - a.at);
}

/**
 * The trust core: when is this person due for a check-in, and how does it read?
 * Pure + deterministic (now is passed in). The clock starts from the last time
 * you reached out — or, if you never have, from when you added them. No cadence
 * means no due state (the app never nags about someone you didn't ask it to).
 */
export function dueStatus(person: Person, now: number, soonWindowDays = SOON_WINDOW_DAYS): DueStatus {
  if (person.cadenceDays == null || person.cadenceDays <= 0) {
    return { state: 'none', dueAt: null, daysUntilDue: null };
  }
  const base = person.lastContactedAt ?? person.createdAt;
  const dueAt = base + person.cadenceDays * DAY_MS;
  const msUntil = dueAt - now;
  const daysUntilDue = Math.ceil(msUntil / DAY_MS);
  let state: DueState;
  if (msUntil <= 0) state = 'overdue';
  else if (daysUntilDue <= soonWindowDays) state = 'soon';
  else state = 'ok';
  return { state, dueAt, daysUntilDue };
}

/** Whole days since you last reached out (from creation if never). Always >= 0. */
export function daysSinceContact(person: Person, now: number): number {
  const base = person.lastContactedAt ?? person.createdAt;
  return Math.max(0, Math.floor((now - base) / DAY_MS));
}

const URGENCY: Record<DueState, number> = { overdue: 0, soon: 1, ok: 2, none: 3 };

/** Active people ordered for the home screen: most urgent first, then by name. */
export function sortByUrgency(people: Person[], now: number): Person[] {
  return activePeople(people)
    .slice()
    .sort((a, b) => {
      const da = dueStatus(a, now);
      const db = dueStatus(b, now);
      if (URGENCY[da.state] !== URGENCY[db.state]) return URGENCY[da.state] - URGENCY[db.state];
      if (da.dueAt != null && db.dueAt != null && da.dueAt !== db.dueAt) return da.dueAt - db.dueAt;
      return a.name.localeCompare(b.name);
    });
}

/** People who need action now — overdue or due soon — most urgent first. Powers
 *  the Today dashboard, which stays short no matter how many people you track. */
export function actionablePeople(people: Person[], now: number): Person[] {
  return sortByUrgency(people, now).filter((p) => {
    const st = dueStatus(p, now).state;
    return st === 'overdue' || st === 'soon';
  });
}

/** Active people sorted A→Z for the People directory. */
export function peopleByName(people: Person[]): Person[] {
  return activePeople(people)
    .slice()
    .sort((a, b) => (a.name.trim() || '￿').localeCompare(b.name.trim() || '￿'));
}

/**
 * The A→Z directory filtered by a name query (case-insensitive substring). An
 * empty/blank query returns the full directory. Pure — powers People search.
 */
export function searchPeople(people: Person[], query: string): Person[] {
  const sorted = peopleByName(people);
  const q = query.trim().toLowerCase();
  if (!q) return sorted;
  return sorted.filter((p) => p.name.trim().toLowerCase().includes(q));
}

/** Next annual occurrence (ms, local midnight) of a month/day on or after today. Pure. */
export function nextOccurrence(date: ImportantDate, now: number): number {
  const d = new Date(now);
  const startOfToday = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  let next = new Date(d.getFullYear(), date.month - 1, date.day).getTime();
  if (next < startOfToday) {
    next = new Date(d.getFullYear() + 1, date.month - 1, date.day).getTime();
  }
  return next;
}

/** Whole calendar days from today until `ms` (0 = today). Pure. */
export function daysUntil(ms: number, now: number): number {
  const d = new Date(now);
  const startOfToday = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((ms - startOfToday) / DAY_MS);
}

export interface UpcomingDate {
  person: Person;
  date: ImportantDate;
  at: number;
  days: number;
}

/** Important dates across all active people landing within `withinDays`, soonest first. Pure. */
export function upcomingDates(people: Person[], now: number, withinDays = UPCOMING_WINDOW_DAYS): UpcomingDate[] {
  const out: UpcomingDate[] = [];
  for (const p of activePeople(people)) {
    for (const date of p.importantDates) {
      const at = nextOccurrence(date, now);
      const days = daysUntil(at, now);
      if (days >= 0 && days <= withinDays) out.push({ person: p, date, at, days });
    }
  }
  return out.sort((a, b) => a.days - b.days);
}

/**
 * Coerce one untrusted parsed object into a safe Person for additive import
 * (canon § Backup Layer 3). Fresh ids so an import never clobbers existing data;
 * unknown shapes are skipped, not crashed on. Pure — unit-tested.
 */
export function sanitizeImportedPerson(raw: unknown): Person | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== 'string') return null;
  const base = makePerson(r.name);

  const importantDates: ImportantDate[] = [];
  if (Array.isArray(r.importantDates)) {
    for (const d of r.importantDates as unknown[]) {
      if (!d || typeof d !== 'object') continue;
      const o = d as Record<string, unknown>;
      if (typeof o.month !== 'number' || typeof o.day !== 'number') continue;
      importantDates.push(
        makeImportantDate(
          typeof o.label === 'string' ? o.label : 'Date',
          o.month,
          o.day,
          typeof o.year === 'number' ? o.year : undefined
        )
      );
    }
  }

  const preferences: Preference[] = [];
  if (Array.isArray(r.preferences)) {
    for (const p of r.preferences as unknown[]) {
      if (!p || typeof p !== 'object') continue;
      const o = p as Record<string, unknown>;
      if (typeof o.text !== 'string') continue;
      const kind: PreferenceKind = o.kind === 'dislike' || o.kind === 'gift' ? o.kind : 'like';
      preferences.push(makePreference(kind, o.text));
    }
  }

  const personalityTypes: PersonalityType[] = [];
  if (Array.isArray(r.personalityTypes)) {
    for (const pt of r.personalityTypes as unknown[]) {
      if (!pt || typeof pt !== 'object') continue;
      const o = pt as Record<string, unknown>;
      if (typeof o.value !== 'string') continue;
      if (o.framework !== 'enneagram' && o.framework !== 'attachment') continue;
      if (personalityTypes.some((x) => x.framework === o.framework)) continue; // one per framework
      personalityTypes.push({ framework: o.framework, value: o.value });
    }
  }

  const interactions: Interaction[] = [];
  if (Array.isArray(r.interactions)) {
    for (const i of r.interactions as unknown[]) {
      if (!i || typeof i !== 'object') continue;
      const o = i as Record<string, unknown>;
      if (typeof o.at !== 'number') continue;
      const kind: InteractionKind =
        o.kind === 'text' || o.kind === 'inPerson' || o.kind === 'other' ? o.kind : 'call';
      interactions.push(makeInteraction(kind, typeof o.note === 'string' ? o.note : undefined, o.at));
    }
  }

  return {
    ...base,
    cadenceDays: typeof r.cadenceDays === 'number' ? r.cadenceDays : null,
    lastContactedAt: typeof r.lastContactedAt === 'number' ? r.lastContactedAt : null,
    notes: typeof r.notes === 'string' ? r.notes : '',
    howWeMet: typeof r.howWeMet === 'string' && r.howWeMet.trim() ? r.howWeMet : undefined,
    importantDates,
    preferences,
    personalityTypes,
    interactions,
  };
}
