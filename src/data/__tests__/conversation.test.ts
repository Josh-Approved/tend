/**
 * Trust-core unit tests (canon § QA & testing Tier 1) for HTC. The trust core is
 * the pure data layer in ../conversation — the open/had selectors that power the
 * tab, the per-person link that powers the detail badge, and additive,
 * crash-proof import sanitization.
 */

import { describe, it, expect } from '@jest/globals';
import {
  makeConversation,
  activeConversations,
  openConversations,
  hadConversations,
  openConversationsForPerson,
  conversationDisplayName,
  sanitizeImportedConversation,
  type Conversation,
} from '../conversation';

const at = (patch: Partial<Conversation> = {}): Conversation => ({ ...makeConversation(), ...patch });

describe('makeConversation', () => {
  it('starts open, unlinked, with empty framework + trimmed name', () => {
    const c = makeConversation(null, '  Mom  ', 'apology');
    expect(c.personName).toBe('Mom');
    expect(c.flavor).toBe('apology');
    expect(c.status).toBe('open');
    expect(c.hadAt).toBeNull();
    expect(c.flavorFields).toEqual({});
    expect(c.id).toMatch(/^htc/);
  });
});

describe('open / had selectors', () => {
  it('splits by status, drops tombstoned, and orders each list', () => {
    const open1 = at({ status: 'open', createdAt: 100 });
    const open2 = at({ status: 'open', createdAt: 300 });
    const had1 = at({ status: 'had', hadAt: 50 });
    const had2 = at({ status: 'had', hadAt: 200 });
    const gone = at({ status: 'open', createdAt: 999, deletedAt: Date.now() });
    const list = [open1, had1, open2, had2, gone];

    expect(activeConversations(list)).toHaveLength(4);
    expect(openConversations(list).map((c) => c.createdAt)).toEqual([300, 100]); // newest first
    expect(hadConversations(list).map((c) => c.hadAt)).toEqual([200, 50]); // most recent first
  });
});

describe('openConversationsForPerson (detail badge)', () => {
  it('returns only this person’s still-to-have conversations', () => {
    const mine = at({ personId: 'p1', status: 'open' });
    const mineHad = at({ personId: 'p1', status: 'had', hadAt: 1 });
    const other = at({ personId: 'p2', status: 'open' });
    const list = [mine, mineHad, other];
    expect(openConversationsForPerson(list, 'p1')).toEqual([mine]);
    expect(openConversationsForPerson(list, 'pX')).toEqual([]);
  });
});

describe('conversationDisplayName', () => {
  it('uses the name, falling back when blank', () => {
    expect(conversationDisplayName(at({ personName: 'Dad' }), 'Someone')).toBe('Dad');
    expect(conversationDisplayName(at({ personName: '   ' }), 'Someone')).toBe('Someone');
  });
});

describe('sanitizeImportedConversation', () => {
  it('re-mints the id, keeps fields, coerces a bad flavor, filters flavorFields', () => {
    const safe = sanitizeImportedConversation({
      id: 'OLD-ID',
      personId: 'p1',
      personName: 'Sarah',
      flavor: 'not-a-flavor',
      topic: 'The thing I keep avoiding',
      story: "The story I'm telling myself is that she's mad at me",
      impact: 'It keeps me distant',
      hope: 'To clear the air',
      flavorFields: { sorryFor: 'being late', bogus: 5 },
      status: 'had',
      hadAt: 123,
      reflection: 'It went better than I feared',
    });
    expect(safe).not.toBeNull();
    expect(safe!.id).not.toBe('OLD-ID');
    expect(safe!.flavor).toBe('open'); // unknown flavor coerced
    expect(safe!.status).toBe('had');
    expect(safe!.hadAt).toBe(123);
    expect(safe!.flavorFields).toEqual({ sorryFor: 'being late' }); // non-string dropped
    expect(safe!.reflection).toBe('It went better than I feared');
  });

  it('defaults a had import with no timestamp, and rejects empty/non-objects', () => {
    const hadNoStamp = sanitizeImportedConversation({ topic: 'x', status: 'had' });
    expect(hadNoStamp!.status).toBe('had');
    expect(typeof hadNoStamp!.hadAt).toBe('number'); // backfilled so it sorts

    expect(sanitizeImportedConversation(null)).toBeNull();
    expect(sanitizeImportedConversation('nope')).toBeNull();
    expect(sanitizeImportedConversation({ status: 'open' })).toBeNull(); // no text at all
  });
});
