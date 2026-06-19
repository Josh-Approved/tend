/**
 * QA fixtures — deterministic data the app boots with under QA_MODE (the capture
 * pipeline builds with EXPO_PUBLIC_QA_MODE=1). Built with the app's OWN
 * constructors so it's valid by construction. A realistic spread of due states
 * (overdue → soon → ok → none), catch-up history, and a near birthday so the
 * home "Coming up" section reads like real use.
 */

import {
  makePerson,
  makePreference,
  makeImportantDate,
  makeInteraction,
  DAY_MS,
  type Person,
  type ImportantDate,
  type Preference,
  type Interaction,
} from '../data/person';

export function qaPeople(): Person[] {
  const now = Date.now();
  const soon = new Date(now + 9 * DAY_MS); // a birthday ~9 days out → shows in "Coming up"

  function make(
    name: string,
    cadenceDays: number | null,
    daysSince: number | null,
    howWeMet: string,
    notes: string,
    importantDates: ImportantDate[],
    preferences: Preference[],
    interactions: Interaction[]
  ): Person {
    const p = makePerson(name);
    p.cadenceDays = cadenceDays;
    p.lastContactedAt = daysSince == null ? null : now - daysSince * DAY_MS;
    p.howWeMet = howWeMet || undefined;
    p.notes = notes;
    p.importantDates = importantDates;
    p.preferences = preferences;
    p.interactions = interactions;
    return p;
  }

  return [
    make(
      'Mom',
      7,
      12,
      'She raised me — but you knew that one.',
      'Loves a long phone call. Ask about her garden — first tomatoes this year.',
      [makeImportantDate('Birthday', 5, 2)],
      [makePreference('like', 'Long phone calls'), makePreference('dislike', 'Texting'), makePreference('gift', 'Audiobooks')],
      [
        makeInteraction('call', 'Caught up about the garden', now - 12 * DAY_MS),
        makeInteraction('inPerson', 'Sunday dinner', now - 26 * DAY_MS),
      ]
    ),
    make(
      'Sarah Chen',
      14,
      13,
      'College roommates.',
      'Tough stretch at work lately — more listening than fixing.',
      [makeImportantDate('Birthday', soon.getMonth() + 1, soon.getDate())],
      [makePreference('dislike', 'Lilies'), makePreference('like', 'Tulips'), makePreference('gift', 'A pottery class')],
      [makeInteraction('text', 'Sent her a recipe she asked about', now - 13 * DAY_MS)]
    ),
    make(
      'Dad',
      30,
      8,
      '',
      'Talk fishing. New puppy named Scout.',
      [makeImportantDate('Anniversary', 6, 14)],
      [],
      [makeInteraction('call', undefined, now - 8 * DAY_MS)]
    ),
    make('Marcus', 90, 80, 'College — the other roommate.', 'Training for a trail marathon.', [], [
      makePreference('gift', 'Trail running socks'),
    ], []),
    make('Priya', null, 4, 'Met at the design conference.', 'Follow up about the book she recommended.', [], [], []),
  ];
}
