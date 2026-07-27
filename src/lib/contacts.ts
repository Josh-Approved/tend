/**
 * Read people from the device address book so the user can CHOOSE who to track
 * (canon: the user's own data, on device — nothing is uploaded). We deliberately
 * do NOT bulk-add every contact: `fetchContactsForPicker` returns the address
 * book for a selection UI (components/ContactPicker), and only the people the
 * user picks become Person records. Reading fresh on each call means a contact
 * added on the phone after the first import shows up the next time the picker is
 * opened — there is no stale snapshot to fall behind.
 *
 * Outcomes are kept distinct so the UI can speak to each one (a swallowed error
 * that reads as "nothing happened" is the bug this module exists to avoid):
 *   - { contacts, limited } — got the address book (limited = iOS "selected only")
 *   - { denied: true }      — the user declined the permission
 *   - { error: true }       — anything threw; surface "try again", never silence
 *
 * The mapping (`contactsToPeople`), name derivation (`contactDisplayName`) and
 * dedup (`dedupePeopleByName`) are PURE and exported so they're unit-tested
 * directly with no expo mocks.
 */

// SDK 56 moved the free-function API (getContactsAsync, Fields, SortTypes,
// requestPermissionsAsync) to the `/legacy` entry. Importing them from the main
// "expo-contacts" gives a shim whose getContactsAsync THROWS at runtime — the
// permission prompt still appears, then the read fails and lands in the catch
// below as { error: true } ("Couldn't read your contacts"). Pin to /legacy so
// the whole functional API keeps working unchanged.
import * as Contacts from 'expo-contacts/legacy';
import { makePerson, makeImportantDate, type Person } from '../data/person';

/** A raw expo-contacts record, narrowed to just the fields we read. Pure-fn input. */
export type RawContact = {
  id?: string | null;
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  birthday?: { month?: number | null; day?: number | null; year?: number | null } | null;
};

/** One address-book entry, prepared for the picker: a stable key + display name. */
export type PickableContact = {
  /** Stable id for selection + list keys (falls back to the display name). */
  id: string;
  /** Already-derived display name (never empty — nameless entries are dropped). */
  name: string;
  /** The raw record, carried through so a picked contact maps to a Person. */
  raw: RawContact;
};

export type ContactFetchResult =
  | { contacts: PickableContact[]; limited: boolean }
  | { denied: true }
  | { error: true };

/**
 * The display name for a raw contact: the full name, else first+last, trimmed.
 * Empty string when there's nothing usable (caller drops those). Pure — shared
 * by the picker (display + dedup) and `contactsToPeople` so they never diverge.
 */
export function contactDisplayName(ct: RawContact): string {
  return (ct.name || [ct.firstName, ct.lastName].filter(Boolean).join(' ')).trim();
}

/**
 * Map already-fetched raw contacts to Person records. Pure — no expo imports.
 * Nameless contacts are skipped. expo-contacts birthday.month is 0-indexed (JS
 * Date convention), so we add 1.
 */
export function contactsToPeople(rawContacts: readonly RawContact[]): Person[] {
  const people: Person[] = [];
  for (const ct of rawContacts) {
    const name = contactDisplayName(ct);
    if (!name) continue;
    const person = makePerson(name);
    const bday = ct.birthday;
    if (bday && typeof bday.month === 'number' && typeof bday.day === 'number') {
      person.importantDates = [makeImportantDate('Birthday', bday.month + 1, bday.day, bday.year ?? undefined)];
    }
    people.push(person);
  }
  return people;
}

/**
 * Drop incoming people whose trimmed, lowercased name already exists in
 * `existing`. Case-insensitive; pure. Nameless incoming are dropped (they can't
 * be a meaningful person and would all collide on '').
 */
export function dedupePeopleByName(existing: Person[], incoming: Person[]): Person[] {
  const seen = new Set(existing.map((p) => p.name.trim().toLowerCase()));
  const out: Person[] = [];
  for (const p of incoming) {
    const key = p.name.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/**
 * Turn already-fetched raw contacts into pickable rows: derive the display name
 * once, drop the nameless, sort A→Z, and give each a stable key. Pure so the
 * picker's list shape is unit-testable without expo. Ties on name fall back to
 * id so the order is deterministic.
 */
export function toPickableContacts(rawContacts: readonly RawContact[]): PickableContact[] {
  const out: PickableContact[] = [];
  for (const raw of rawContacts) {
    const name = contactDisplayName(raw);
    if (!name) continue;
    out.push({ id: (raw.id && String(raw.id)) || name, name, raw });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
}

/**
 * Read the address book for the picker. Prompts for permission, then reads
 * fresh (no cached snapshot). Returns pickable rows plus whether iOS granted
 * only a limited/selected subset, so the UI can say so.
 */
export async function fetchContactsForPicker(): Promise<ContactFetchResult> {
  try {
    const perm = await Contacts.requestPermissionsAsync();
    if (!perm.granted) return { denied: true };

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.Birthday,
      ],
      sort: Contacts.SortTypes.FirstName,
    });

    // iOS 18+ "selected contacts only" surfaces as accessPrivileges === 'limited'
    // on the permission response. Android / older iOS won't set it — default false
    // and still show whatever getContactsAsync returned.
    const limited = perm.accessPrivileges === 'limited';

    return { contacts: toPickableContacts(data as RawContact[]), limited };
  } catch {
    return { error: true };
  }
}
