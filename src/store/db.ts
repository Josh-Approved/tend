/**
 * Domain SQLite persistence for Tend. Opens the SAME connection the shell's
 * storage/kv.ts owns (one file, one backup unit — canon § Backup Layer 1: the DB
 * lives in Documents and rides OS auto-backup) and adds the one domain table.
 *
 * Nested collections (importantDates, preferences) are stored as JSON columns —
 * a person is one row, one backup unit. Writes are fire-and-forget (the in-memory
 * store is the source of truth); hydrate() is awaited once at app start.
 */

import { getDb } from '../storage/kv';
import type { Person, ImportantDate, Preference } from '../data/person';

let _ready: Promise<void> | null = null;

async function ensureTable(): Promise<void> {
  if (_ready) return _ready;
  _ready = (async () => {
    const db = await getDb();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS people (
        id              TEXT PRIMARY KEY NOT NULL,
        name            TEXT NOT NULL,
        cadenceDays     INTEGER,
        lastContactedAt INTEGER,
        notes           TEXT NOT NULL,
        importantDates  TEXT NOT NULL,
        preferences     TEXT NOT NULL,
        createdAt       INTEGER NOT NULL,
        updatedAt       INTEGER NOT NULL
      );
    `);
  })();
  return _ready;
}

interface PersonRow {
  id: string;
  name: string;
  cadenceDays: number | null;
  lastContactedAt: number | null;
  notes: string;
  importantDates: string;
  preferences: string;
  createdAt: number;
  updatedAt: number;
}

function rowToPerson(row: PersonRow): Person {
  return {
    id: row.id,
    name: row.name,
    cadenceDays: row.cadenceDays ?? null,
    lastContactedAt: row.lastContactedAt ?? null,
    notes: row.notes,
    importantDates: JSON.parse(row.importantDates) as ImportantDate[],
    preferences: JSON.parse(row.preferences) as Preference[],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export async function loadAllPeople(): Promise<Person[]> {
  await ensureTable();
  const db = await getDb();
  const rows = await db.getAllAsync<PersonRow>('SELECT * FROM people ORDER BY updatedAt DESC');
  return rows.map(rowToPerson);
}

export async function savePerson(person: Person): Promise<void> {
  await ensureTable();
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO people
      (id, name, cadenceDays, lastContactedAt, notes, importantDates, preferences, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      person.id,
      person.name,
      person.cadenceDays,
      person.lastContactedAt,
      person.notes,
      JSON.stringify(person.importantDates),
      JSON.stringify(person.preferences),
      person.createdAt,
      person.updatedAt,
    ]
  );
}

export async function deletePersonFromDb(id: string): Promise<void> {
  await ensureTable();
  const db = await getDb();
  await db.runAsync('DELETE FROM people WHERE id = ?', [id]);
}
