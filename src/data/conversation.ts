/**
 * Domain model for "Have the Conversation" (HTC) — a hard, honest conversation
 * you need to have with someone, and the simple framework that helps you prepare
 * for it. THIS IS APP-OWNED TRUST CORE: pure (no expo / RN imports) so jest tests
 * it directly (src/data/__tests__/conversation.test.ts), and lib/transfer.ts
 * reuses `sanitizeImportedConversation` for additive backup import.
 *
 * The thesis: intimacy stalls when something is big enough to put distance
 * between two people but hard enough that you hold it in. Naming it and planning
 * the conversation is the move. A "flavor" tailors the prompts to the kind of
 * conversation it is; the apology flavor carries the full reconciliation loop
 * (name what you did → name the hurt → ask forgiveness).
 *
 * The framework catalog (which prompts each flavor adds) + the i18n key helpers
 * live in ./conversationFramework; this file owns the stored shape, the pure
 * selectors the screens read, and crash-proof import sanitization.
 */

import { makeId } from '../lib/id';

/** The kinds of conversation HTC facilitates. 'open' is the generic default. */
export type ConversationFlavor =
  | 'open'
  | 'hurt'
  | 'aboutMe'
  | 'boundary'
  | 'apology'
  | 'appreciation';

export const CONVERSATION_FLAVORS: readonly ConversationFlavor[] = [
  'open',
  'hurt',
  'aboutMe',
  'boundary',
  'apology',
  'appreciation',
];

/** Open = still to have; had = the conversation happened (the payoff state). */
export type ConversationStatus = 'open' | 'had';

export interface Conversation {
  id: string;
  /** Optional link to a Person record (enables the per-person badge). */
  personId: string | null;
  /** Display name — cached/freeform so it survives an unlinked person or a
   *  deleted Person record. */
  personName: string;
  flavor: ConversationFlavor;
  // Core framework (always shown):
  /** What you need to share or talk about. */
  topic: string;
  /** "The story I'm telling myself…" — what you're making it mean. */
  story: string;
  /** How it's affecting you / the relationship. */
  impact: string;
  /** What you hope comes from the conversation. */
  hope: string;
  /** Flavor-tailored answers, keyed by prompt key (see conversationFramework). */
  flavorFields: Record<string, string>;
  status: ConversationStatus;
  /** "How did it go?" — captured after the conversation, to reinforce the loop. */
  reflection: string;
  createdAt: number;
  updatedAt: number;
  /** When you marked it had, ms epoch. null while open. */
  hadAt: number | null;
  /** Soft-delete tombstone (canon § Backup #5) — null/undefined = active. */
  deletedAt?: number;
}

export function makeConversation(
  personId: string | null = null,
  personName = '',
  flavor: ConversationFlavor = 'open'
): Conversation {
  const now = Date.now();
  return {
    id: makeId('htc'),
    personId,
    personName: personName.trim(),
    flavor,
    topic: '',
    story: '',
    impact: '',
    hope: '',
    flavorFields: {},
    status: 'open',
    reflection: '',
    createdAt: now,
    updatedAt: now,
    hadAt: null,
  };
}

export function activeConversations(list: Conversation[]): Conversation[] {
  return list.filter((c) => c.deletedAt == null);
}

/** Conversations still to have — newest intent first. Pure. */
export function openConversations(list: Conversation[]): Conversation[] {
  return activeConversations(list)
    .filter((c) => c.status === 'open')
    .sort((a, b) => b.createdAt - a.createdAt);
}

/** Conversations you've had — most recently had first. Pure. */
export function hadConversations(list: Conversation[]): Conversation[] {
  return activeConversations(list)
    .filter((c) => c.status === 'had')
    .sort((a, b) => (b.hadAt ?? b.updatedAt) - (a.hadAt ?? a.updatedAt));
}

/** Still-to-have conversations linked to one person — powers the detail badge. */
export function openConversationsForPerson(list: Conversation[], personId: string): Conversation[] {
  return openConversations(list).filter((c) => c.personId === personId);
}

/** A one-line label for a row: the person, or a gentle fallback. Pure. */
export function conversationDisplayName(c: Conversation, fallback: string): string {
  return c.personName.trim() || fallback;
}

/**
 * Coerce one untrusted parsed object into a safe Conversation for additive import
 * (canon § Backup Layer 3). Fresh id so an import never clobbers existing data;
 * unknown shapes are skipped, not crashed on. Pure — unit-tested.
 */
export function sanitizeImportedConversation(raw: unknown): Conversation | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  // A conversation with nothing in it isn't worth importing.
  const hasText =
    typeof r.topic === 'string' ||
    typeof r.personName === 'string' ||
    typeof r.story === 'string';
  if (!hasText) return null;

  const flavor: ConversationFlavor = CONVERSATION_FLAVORS.includes(r.flavor as ConversationFlavor)
    ? (r.flavor as ConversationFlavor)
    : 'open';

  const flavorFields: Record<string, string> = {};
  if (r.flavorFields && typeof r.flavorFields === 'object') {
    for (const [k, v] of Object.entries(r.flavorFields as Record<string, unknown>)) {
      if (typeof v === 'string') flavorFields[k] = v;
    }
  }

  const base = makeConversation(
    typeof r.personId === 'string' ? r.personId : null,
    typeof r.personName === 'string' ? r.personName : '',
    flavor
  );
  const status: ConversationStatus = r.status === 'had' ? 'had' : 'open';

  return {
    ...base,
    topic: typeof r.topic === 'string' ? r.topic : '',
    story: typeof r.story === 'string' ? r.story : '',
    impact: typeof r.impact === 'string' ? r.impact : '',
    hope: typeof r.hope === 'string' ? r.hope : '',
    flavorFields,
    status,
    reflection: typeof r.reflection === 'string' ? r.reflection : '',
    hadAt: status === 'had' && typeof r.hadAt === 'number' ? r.hadAt : status === 'had' ? base.createdAt : null,
  };
}
