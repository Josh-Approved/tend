/**
 * QA fixtures — deterministic data the app boots with under QA_MODE (the capture
 * pipeline builds with EXPO_PUBLIC_QA_MODE=1). Built with the app's OWN
 * constructors so it's valid by construction. A realistic spread of due states
 * (overdue → soon → ok → none) so the home screen reads like real use.
 */

import {
  makePerson,
  makePreference,
  makeImportantDate,
  DAY_MS,
  type Person,
  type ImportantDate,
  type Preference,
} from '../data/person';

export function qaPeople(): Person[] {
  const now = Date.now();

  function make(
    name: string,
    cadenceDays: number | null,
    daysSince: number | null,
    notes: string,
    importantDates: ImportantDate[],
    preferences: Preference[]
  ): Person {
    const p = makePerson(name);
    p.cadenceDays = cadenceDays;
    p.lastContactedAt = daysSince == null ? null : now - daysSince * DAY_MS;
    p.notes = notes;
    p.importantDates = importantDates;
    p.preferences = preferences;
    return p;
  }

  return [
    make(
      'Mom',
      7,
      12,
      'Loves a long phone call. Ask about her garden — first tomatoes this year.',
      [makeImportantDate('Birthday', 5, 2)],
      [
        makePreference('like', 'Long phone calls'),
        makePreference('dislike', 'Texting'),
        makePreference('gift', 'Audiobooks'),
      ]
    ),
    make(
      'Sarah Chen',
      14,
      13,
      'Tough stretch at work lately — more listening than fixing.',
      [],
      [
        makePreference('dislike', 'Lilies'),
        makePreference('like', 'Tulips'),
        makePreference('gift', 'A pottery class'),
      ]
    ),
    make('Dad', 30, 8, 'Talk fishing. New puppy named Scout.', [makeImportantDate('Anniversary', 6, 14)], []),
    make('Marcus', 90, 80, 'College roommate. Training for a trail marathon.', [], [
      makePreference('gift', 'Trail running socks'),
    ]),
    make('Priya', null, 4, 'Met at the design conference. Follow up about the book she recommended.', [], []),
  ];
}
