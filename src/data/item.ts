/**
 * Domain model for the `list` archetype: a named list of items you can check
 * off. THIS IS THE APP'S OWN CODE — rename the types to your domain (e.g.
 * GroceryItem / Trip / Recipe) and extend the fields. Kept pure (no expo / RN
 * imports) so it's the app's trust core: jest-expo tests it directly
 * (src/data/__tests__/item.test.ts), and lib/transfer.ts reuses
 * `sanitizeImportedList` for additive import.
 */

import { makeId } from '../lib/id';

export interface ListItem {
  id: string;
  name: string;
  done: boolean;
  note?: string;
  addedAt: number;
  updatedAt: number;
  /** Soft-delete tombstone (canon § Backup #5) — null/undefined = active. */
  deletedAt?: number;
}

export interface ItemList {
  id: string;
  name: string;
  items: ListItem[];
  createdAt: number;
  updatedAt: number;
}

export function makeItem(name: string): ListItem {
  const now = Date.now();
  return { id: makeId('i'), name: name.trim(), done: false, addedAt: now, updatedAt: now };
}

export function makeList(name = 'New list'): ItemList {
  const now = Date.now();
  return { id: makeId('l'), name: name.trim() || 'New list', items: [], createdAt: now, updatedAt: now };
}

/** Active (non-tombstoned) item matching `name`, case-insensitive. */
export function findActiveByName(list: ItemList, name: string): ListItem | undefined {
  const n = name.trim().toLowerCase();
  return list.items.find((it) => it.deletedAt == null && it.name.toLowerCase() === n);
}

export function activeItems(list: ItemList): ListItem[] {
  return list.items.filter((it) => it.deletedAt == null);
}

/** Coerce one untrusted parsed object into a safe ItemList for additive import
 *  (canon § Backup Layer 3). Fresh ids so an import never clobbers existing
 *  data; unknown shapes are skipped, not crashed on. Pure — unit-tested. */
export function sanitizeImportedList(raw: unknown): ItemList | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.name !== 'string' || !Array.isArray(r.items)) return null;
  const base = makeList(r.name);
  const items: ListItem[] = [];
  for (const it of r.items as unknown[]) {
    if (!it || typeof it !== 'object') continue;
    const o = it as Record<string, unknown>;
    if (typeof o.name !== 'string') continue;
    const now = Date.now();
    items.push({
      id: makeId('i'),
      name: o.name,
      done: o.done === true,
      note: typeof o.note === 'string' ? o.note : undefined,
      addedAt: typeof o.addedAt === 'number' ? o.addedAt : now,
      updatedAt: now,
    });
  }
  return { ...base, name: `${r.name} (imported)`, items };
}
