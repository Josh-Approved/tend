/**
 * Domain SQLite persistence for the `list` archetype. Opens the SAME connection
 * the shell's storage/kv.ts owns (one file, one backup unit — canon § Backup
 * Layer 1: the DB lives in Documents and rides OS auto-backup) and adds the
 * one domain table. Rename `lists` to your domain when you fork this.
 *
 * Writes are fire-and-forget (the in-memory store is the source of truth);
 * hydrate() is awaited once at app start.
 */

import { getDb } from '../storage/kv';
import type { ItemList, ListItem } from '../data/item';

let _ready: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (_ready) return _ready;
  _ready = (async () => {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS lists (
        id        TEXT PRIMARY KEY NOT NULL,
        name      TEXT NOT NULL,
        items     TEXT NOT NULL,
        createdAt INTEGER NOT NULL,
        updatedAt INTEGER NOT NULL
      );
    `);
  })();
  return _ready;
}

interface ListRow {
  id: string;
  name: string;
  items: string;
  createdAt: number;
  updatedAt: number;
}

function rowToList(row: ListRow): ItemList {
  return {
    id: row.id,
    name: row.name,
    items: JSON.parse(row.items) as ListItem[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function loadAllLists(): Promise<ItemList[]> {
  await ensureTable();
  const db = await getDb();
  const rows = await db.getAllAsync<ListRow>('SELECT * FROM lists ORDER BY updatedAt DESC');
  return rows.map(rowToList);
}

export async function saveList(list: ItemList): Promise<void> {
  await ensureTable();
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO lists (id, name, items, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)`,
    [list.id, list.name, JSON.stringify(list.items), list.createdAt, list.updatedAt]
  );
}

export async function deleteListFromDb(id: string): Promise<void> {
  await ensureTable();
  const db = await getDb();
  await db.runAsync('DELETE FROM lists WHERE id = ?', [id]);
}
