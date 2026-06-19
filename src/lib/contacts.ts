/**
 * Import people from the device address book (canon: the user's own data, on
 * device — nothing is uploaded). Returns fresh Person records to add additively,
 * or null if the user declines permission. Defensive: any failure returns null
 * rather than throwing into the UI.
 */

import * as Contacts from 'expo-contacts';
import { makePerson, makeImportantDate, type Person } from '../data/person';

export type ContactImportResult = { people: Person[] } | { denied: true } | null;

export async function importFromContacts(): Promise<ContactImportResult> {
  try {
    const { granted } = await Contacts.requestPermissionsAsync();
    if (!granted) return { denied: true };

    const { data } = await Contacts.getContactsAsync({
      fields: [
        Contacts.Fields.Name,
        Contacts.Fields.FirstName,
        Contacts.Fields.LastName,
        Contacts.Fields.Birthday,
      ],
      sort: Contacts.SortTypes.FirstName,
    });

    const people: Person[] = [];
    for (const ct of data) {
      const name = (ct.name || [ct.firstName, ct.lastName].filter(Boolean).join(' ')).trim();
      if (!name) continue;
      const person = makePerson(name);
      const bday = ct.birthday;
      // expo-contacts birthday.month is 0-indexed (JS Date convention).
      if (bday && typeof bday.month === 'number' && typeof bday.day === 'number') {
        person.importantDates = [makeImportantDate('Birthday', bday.month + 1, bday.day, bday.year ?? undefined)];
      }
      people.push(person);
    }
    return { people };
  } catch {
    return null;
  }
}
