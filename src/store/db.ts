/**
 * Domain SQLite persistence for Tend. Opens the SAME connection the shell's
 * storage/kv.ts owns (one file, one backup unit — canon § Backup Layer 1: the DB
 * lives in Documents and rides OS auto-backup) and adds the one domain table.
 *
 * Nested collections (importantDates, preferences, interactions) are stored as
 * JSON columns — a person is one row, one backup unit. Writes are fire-and-forget
 * (the in-memory store is the source of truth); hydrate() is awaited once at start.
 */

import { getDb } from '../storage/kv';
import type { Person, ImportantDate, Preference, Interaction, PersonalityType } from '../data/person';

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
        howWeMet        TEXT,
        importantDates  TEXT NOT NULL,
        preferences     TEXT NOT NULL,
        personalityTypes TEXT NOT NULL DEFAULT '[]',
        interactions    TEXT NOT NULL DEFAULT '[]',
        createdAt       INTEGER NOT NULL,
        updatedAt       INTEGER NOT NULL
      );
    `);
    // Migrate installs created before howWeMet / interactions / personalityTypes existed.
    for (const stmt of [
      `ALTER TABLE people ADD COLUMN howWeMet TEXT`,
      `ALTER TABLE people ADD COLUMN interactions TEXT NOT NULL DEFAULT '[]'`,
      `ALTER TABLE people ADD COLUMN personalityTypes TEXT NOT NULL DEFAULT '[]'`,
    ]) {
      try {
        await db.execAsync(stmt);
      } catch {
        // column already exists — expected on a current schema
      }
    }
  })();
  return _ready;
}

interface PersonRow {
  id: string;
  name: string;
  cadenceDays: number | null;
  lastContactedAt: number | null;
  notes: string;
  howWeMet: string | null;
  importantDates: string;
  preferences: string;
  personalityTypes: string | null;
  interactions: string | null;
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
    howWeMet: row.howWeMet ?? undefined,
    importantDates: JSON.parse(row.importantDates) as ImportantDate[],
    preferences: JSON.parse(row.preferences) as Preference[],
    personalityTypes: row.personalityTypes ? (JSON.parse(row.personalityTypes) as PersonalityType[]) : [],
    interactions: row.interactions ? (JSON.parse(row.interactions) as Interaction[]) : [],
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
      (id, name, cadenceDays, lastContactedAt, notes, howWeMet, importantDates, preferences, personalityTypes, interactions, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      person.id,
      person.name,
      person.cadenceDays,
      person.lastContactedAt,
      person.notes,
      person.howWeMet ?? null,
      JSON.stringify(person.importantDates),
      JSON.stringify(person.preferences),
      JSON.stringify(person.personalityTypes),
      JSON.stringify(person.interactions),
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
