/**
 * Manual export / import (canon § Backup & restore Layer 3) for Tend. The generic
 * file/share/pick plumbing lives in the shell's lib/backup.ts; this file owns the
 * domain part — what goes in the payload and how an imported payload is sanitized
 * (additive, never destructive: a colliding id is re-minted by
 * sanitizeImportedPerson).
 */

import { exportEnvelope, pickEnvelope } from './backup';
import { type Person, sanitizeImportedPerson } from '../data/person';

const APP_SLUG = 'tend';
const EXPORT_VERSION = 1;

export async function exportPeople(people: Person[]): Promise<void> {
  await exportEnvelope(APP_SLUG, EXPORT_VERSION, { people });
}

/** Pick a file and return the people to add. Returns [] on cancel / bad file. */
export async function pickAndParsePeople(): Promise<Person[]> {
  const env = await pickEnvelope();
  const payload = env?.payload as { people?: unknown[] } | undefined;
  const rawPeople = Array.isArray(payload?.people) ? payload!.people : [];
  const out: Person[] = [];
  for (const raw of rawPeople) {
    const safe = sanitizeImportedPerson(raw);
    if (safe) out.push(safe);
  }
  return out;
}
