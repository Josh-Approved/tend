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
  type PersonalityType,
} from '../data/person';
import { makeConversation, type Conversation } from '../data/conversation';

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
    interactions: Interaction[],
    personalityTypes: PersonalityType[] = []
  ): Person {
    const p = makePerson(name);
    p.cadenceDays = cadenceDays;
    p.lastContactedAt = daysSince == null ? null : now - daysSince * DAY_MS;
    p.howWeMet = howWeMet || undefined;
    p.notes = notes;
    p.importantDates = importantDates;
    p.preferences = preferences;
    p.interactions = interactions;
    p.personalityTypes = personalityTypes;
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
      ],
      [
        { framework: 'enneagram', value: '2' },
        { framework: 'attachment', value: 'secure' },
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
      [makeInteraction('text', 'Sent her a recipe she asked about', now - 13 * DAY_MS)],
      [{ framework: 'attachment', value: 'anxious' }]
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

/**
 * QA seed for Have the Conversation. Links to the already-seeded people by name
 * (so the per-person badge demos too), with a spread across flavors and one
 * already-had conversation so the "Had" section + reflection show.
 */
export function qaConversations(people: Person[]): Conversation[] {
  const now = Date.now();
  const find = (name: string): Person | undefined => people.find((p) => p.name === name);

  function make(
    person: Person | undefined,
    personName: string,
    flavor: Conversation['flavor'],
    fields: Partial<Conversation>,
    flavorFields: Record<string, string> = {}
  ): Conversation {
    const c = makeConversation(person?.id ?? null, personName, flavor);
    Object.assign(c, fields);
    c.flavorFields = flavorFields;
    return c;
  }

  const mom = find('Mom');
  const sarah = find('Sarah Chen');
  const dad = find('Dad');

  return [
    make(
      mom,
      'Mom',
      'apology',
      {
        createdAt: now - 1 * DAY_MS,
        topic: 'I snapped at her on the phone last weekend and never circled back.',
        story: "The story I'm telling myself is that if I bring it up I'll just make it worse.",
        impact: "We've been a little stiff with each other since, and I hate that.",
        hope: 'To own it cleanly and feel close again.',
      },
      {
        sorryFor: 'I’m sorry for snapping at you when you were just trying to help.',
        theHurt: 'I think it made you feel brushed off, like your help wasn’t wanted.',
        askForgiveness: 'Will you forgive me?',
      }
    ),
    make(
      sarah,
      'Sarah Chen',
      'hurt',
      {
        createdAt: now - 4 * DAY_MS,
        topic: 'She’s canceled our last two plans last-minute.',
        story: "The story I'm telling myself is that I'm not a priority to her right now.",
        impact: "I've started to pull back instead of saying anything.",
        hope: 'To be honest without blaming, and understand what’s going on for her.',
      },
      { iStatement: 'When plans fall through last-minute, I feel like I don’t matter.' }
    ),
    make(
      dad,
      'Dad',
      'appreciation',
      {
        createdAt: now - 10 * DAY_MS,
        status: 'had',
        hadAt: now - 2 * DAY_MS,
        topic: 'I’ve never actually told him how much his steadiness meant growing up.',
        hope: 'Just to say it, out loud, while I can.',
        reflection: 'Said it on our call. He got quiet, then thanked me. Glad I didn’t wait.',
      },
      { holdingBack: 'I’ve been meaning to tell you that you were my steady ground.' }
    ),
  ];
}
