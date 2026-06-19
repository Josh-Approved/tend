/**
 * Manual export / import (canon § Backup & restore Layer 3) for the `list`
 * archetype. The generic file/share/pick plumbing lives in the shell's
 * lib/backup.ts; this file owns the domain part — what goes in the payload and
 * how an imported payload is sanitized (additive, never destructive: a
 * colliding id is re-minted by sanitizeImportedList).
 */

import { exportEnvelope, pickEnvelope } from './backup';
import { type ItemList, sanitizeImportedList } from '../data/item';

const APP_SLUG = 'tend';
const EXPORT_VERSION = 1;

export async function exportLists(lists: ItemList[]): Promise<void> {
  await exportEnvelope(APP_SLUG, EXPORT_VERSION, { lists });
}

/** Pick a file and return the lists to add. Returns [] on cancel / bad file. */
export async function pickAndParseLists(): Promise<ItemList[]> {
  const env = await pickEnvelope();
  const payload = env?.payload as { lists?: unknown[] } | undefined;
  const rawLists = Array.isArray(payload?.lists) ? payload!.lists : [];
  const out: ItemList[] = [];
  for (const raw of rawLists) {
    const safe = sanitizeImportedList(raw);
    if (safe) out.push(safe);
  }
  return out;
}
