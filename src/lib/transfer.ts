/**
 * Manual export / import (canon § Backup & restore Layer 3) for Tend. The generic
 * file/share/pick plumbing lives in the shell's lib/backup.ts; this file owns the
 * domain part — what goes in the payload and how an imported payload is sanitized
 * (additive, never destructive: a colliding id is re-minted by the per-record
 * sanitizers). One envelope carries both people and the conversations you keep in
 * Have the Conversation, so "your data" stays whole.
 */

import { exportEnvelope, pickEnvelope } from './backup';
import { type Person, sanitizeImportedPerson } from '../data/person';
import { type Conversation, sanitizeImportedConversation } from '../data/conversation';
import { type MeProfile, sanitizeImportedMe } from '../data/me';

const APP_SLUG = 'tend';
const EXPORT_VERSION = 1;

export async function exportData(people: Person[], conversations: Conversation[], me: MeProfile): Promise<void> {
  await exportEnvelope(APP_SLUG, EXPORT_VERSION, { people, conversations, me });
}

export interface ParsedImport {
  people: Person[];
  conversations: Conversation[];
  me: MeProfile;
}

/** Pick a file and return the records to add. Returns empties on cancel / bad
 *  file; an older export missing a key (conversations / me) simply yields none. */
export async function pickAndParseData(): Promise<ParsedImport> {
  const env = await pickEnvelope();
  const payload = env?.payload as { people?: unknown[]; conversations?: unknown[]; me?: unknown } | undefined;

  const people: Person[] = [];
  for (const raw of Array.isArray(payload?.people) ? payload!.people : []) {
    const safe = sanitizeImportedPerson(raw);
    if (safe) people.push(safe);
  }

  const conversations: Conversation[] = [];
  for (const raw of Array.isArray(payload?.conversations) ? payload!.conversations : []) {
    const safe = sanitizeImportedConversation(raw);
    if (safe) conversations.push(safe);
  }

  const me = sanitizeImportedMe(payload?.me);

  return { people, conversations, me };
}
