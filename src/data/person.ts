/**
 * Domain model for Tend: a person you want to keep up with, plus the practical
 * memory you keep about them. THIS IS THE APP'S OWN CODE (the trust core) — kept
 * pure (no expo / RN imports) so jest-expo tests it directly
 * (src/data/__tests__/person.test.ts), and lib/transfer.ts reuses
 * `sanitizeImportedPerson` for additive import.
 *
 * The load-bearing logic is `dueStatus` — "who should I reach out to, and how
 * does that read?" Get it wrong and the whole app is wrong, so it's pure and
 * heavily tested.
 */

import { makeId } from '../lib/id';

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Within this many days of due, a person reads as "soon" rather than "ok". */
export const SOON_WINDOW_DAYS = 2;

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

export interface Person {
  id: string;
  name: string;
  /** Days between intended check-ins. null = no reminder cadence. */
  cadenceDays: number | null;
  /** When you last reached out, ms epoch. null = never. */
  lastContactedAt: number | null;
  notes: string;
  importantDates: ImportantDate[];
  preferences: Preference[];
  createdAt: number;
  updatedAt: number;
  /** Soft-delete tombstone (canon § Backup #5) — null/undefined = active. */
  deletedAt?: number;
}

export type DueState = 'overdue' | 'soon' | 'ok' | 'none';

export interface DueStatus {
  state: DueState;
  /** ms epoch the next check-in is due, or null when no cadence is set. */
  dueAt: number | null;
  /** Whole days until due (negative = overdue), or null when no cadence. */
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

export function makePerson(name = ''): Person {
  const now = Date.now();
  return {
    id: makeId('p'),
    name: name.trim(),
    cadenceDays: null,
    lastContactedAt: null,
    notes: '',
    importantDates: [],
    preferences: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function makePreference(kind: PreferenceKind, text: string): Preference {
  return { id: makeId('pref'), kind, text: text.trim() };
}

export function makeImportantDate(
  label: string,
  month: number,
  day: number,
  year?: number
): ImportantDate {
  return { id: makeId('date'), label: label.trim() || 'Date', month, day, year };
}

export function activePeople(people: Person[]): Person[] {
  return people.filter((p) => p.deletedAt == null);
}

/**
 * The trust core: when is this person due for a check-in, and how does it read?
 * Pure + deterministic (now is passed in). The clock starts from the last time
 * you reached out — or, if you never have, from when you added them. No cadence
 * means no due state at all (the app never nags about someone you didn't ask it to).
 */
export function dueStatus(
  person: Person,
  now: number,
  soonWindowDays = SOON_WINDOW_DAYS
): DueStatus {
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

  return {
    ...base,
    cadenceDays: typeof r.cadenceDays === 'number' ? r.cadenceDays : null,
    lastContactedAt: typeof r.lastContactedAt === 'number' ? r.lastContactedAt : null,
    notes: typeof r.notes === 'string' ? r.notes : '',
    importantDates,
    preferences,
  };
}
