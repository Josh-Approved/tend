/**
 * Import people from the device address book (canon: the user's own data, on
 * device — nothing is uploaded). Returns fresh Person records to add additively.
 *
 * Outcomes are kept distinct so the UI can speak to each one (a swallowed error
 * that reads as "nothing happened" is the bug this module exists to avoid):
 *   - { people, limited } — got contacts (limited = iOS "selected contacts only")
 *   - { denied: true }    — the user declined the permission
 *   - { error: true }     — anything threw; surface "try again", never silence
 *
 * The mapping (`contactsToPeople`) and dedup (`dedupePeopleByName`) are PURE and
 * exported so they're unit-tested directly with no expo mocks.
 */

// SDK 56 moved the free-function API (getContactsAsync, Fields, SortTypes,
// requestPermissionsAsync) to the `/legacy` entry. Importing them from the main
// "expo-contacts" gives a shim whose getContactsAsync THROWS at runtime — the
// permission prompt still appears, then the read fails and lands in the catch
// below as { error: true } ("Couldn't read your contacts"). Pin to /legacy so
// the whole functional API keeps working unchanged.
import * as Contacts from 'expo-contacts/legacy';
import { makePerson, makeImportantDate, type Person } from '../data/person';

export type ContactImportResult =
  | { people: Person[]; limited: boolean }
  | { denied: true }
  | { error: true };

/** A raw expo-contacts record, narrowed to just the fields we read. Pure-fn input. */
export type RawContact = {
  name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  birthday?: { month?: number | null; day?: number | null; year?: number | null } | null;
};

/**
 * Map already-fetched raw contacts to Person records. Pure — no expo imports.
 * Name falls back to first+last; nameless contacts are skipped. expo-contacts
 * birthday.month is 0-indexed (JS Date convention), so we add 1.
 */
export function contactsToPeople(rawContacts: readonly RawContact[]): Person[] {
  const people: Person[] = [];
  for (const ct of rawContacts) {
    const name = (ct.name || [ct.firstName, ct.lastName].filter(Boolean).join(' ')).trim();
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

export async function importFromContacts(): Promise<ContactImportResult> {
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
    // and still import whatever getContactsAsync returned.
    const limited = perm.accessPrivileges === 'limited';

    return { people: contactsToPeople(data as RawContact[]), limited };
  } catch {
    return { error: true };
  }
}
