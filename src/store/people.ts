/**
 * People store — Zustand state with disk-backed persistence. React state updates
 * synchronously (UI feels instant); the SQLite save runs fire-and-forget. The
 * store is the in-memory source of truth; db.ts is durable backup.
 *
 * Note the curried `create<State>()(...)` form — Zustand v5 requires it
 * (stack/zustand.md); the v4-style `create<State>(...)` type-checks but fails
 * silently at runtime.
 */

import { create } from 'zustand';
import {
  type Person,
  type PreferenceKind,
  makePerson,
  makePreference,
  makeImportantDate,
} from '../data/person';
import { putTombstone } from '../storage/kv';
import { loadAllPeople, savePerson, deletePersonFromDb } from './db';
import { QA_MODE } from '../qa/qaMode';
import { qaPeople } from '../qa/fixtures';

interface PeopleState {
  people: Person[];
  hydrated: boolean;
  hydrate: () => Promise<void>;

  createPerson: (name?: string) => string;
  getPerson: (id: string) => Person | undefined;
  renamePerson: (id: string, name: string) => void;
  setCadence: (id: string, cadenceDays: number | null) => void;
  logContact: (id: string, when?: number) => void;
  setNotes: (id: string, notes: string) => void;
  addImportantDate: (id: string, label: string, month: number, day: number, year?: number) => void;
  removeImportantDate: (id: string, dateId: string) => void;
  addPreference: (id: string, kind: PreferenceKind, text: string) => void;
  removePreference: (id: string, prefId: string) => void;
  deletePerson: (id: string) => void;
  importPeople: (incoming: Person[]) => number;
}

function persist(person: Person): void {
  savePerson(person).catch((err) => console.warn('people: failed to persist', err));
}

export const usePeopleStore = create<PeopleState>()((set, get) => {
  function mutate(id: string, fn: (p: Person) => Person): void {
    let updated: Person | undefined;
    set((s) => ({
      people: s.people.map((p) => {
        if (p.id !== id) return p;
        updated = { ...fn(p), updatedAt: Date.now() };
        return updated;
      }),
    }));
    if (updated) persist(updated);
  }

  return {
    people: [],
    hydrated: false,

    hydrate: async () => {
      try {
        const loaded = await loadAllPeople();
        if (QA_MODE && loaded.length === 0) {
          set({ people: qaPeople(), hydrated: true });
          return;
        }
        set({ people: loaded, hydrated: true });
      } catch (err) {
        console.warn('people: failed to load from disk', err);
        set({ hydrated: true });
      }
    },

    createPerson: (name) => {
      const person = makePerson(name);
      set((s) => ({ people: [person, ...s.people] }));
      persist(person);
      return person.id;
    },

    getPerson: (id) => get().people.find((p) => p.id === id),

    renamePerson: (id, name) => {
      mutate(id, (p) => ({ ...p, name: name.trim() }));
    },

    setCadence: (id, cadenceDays) => {
      mutate(id, (p) => ({ ...p, cadenceDays }));
    },

    logContact: (id, when = Date.now()) => {
      mutate(id, (p) => ({ ...p, lastContactedAt: when }));
    },

    setNotes: (id, notes) => {
      mutate(id, (p) => ({ ...p, notes }));
    },

    addImportantDate: (id, label, month, day, year) => {
      mutate(id, (p) => ({
        ...p,
        importantDates: [...p.importantDates, makeImportantDate(label, month, day, year)],
      }));
    },

    removeImportantDate: (id, dateId) => {
      mutate(id, (p) => ({
        ...p,
        importantDates: p.importantDates.filter((d) => d.id !== dateId),
      }));
    },

    addPreference: (id, kind, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      mutate(id, (p) => ({ ...p, preferences: [...p.preferences, makePreference(kind, trimmed)] }));
    },

    removePreference: (id, prefId) => {
      mutate(id, (p) => ({ ...p, preferences: p.preferences.filter((pr) => pr.id !== prefId) }));
    },

    deletePerson: (id) => {
      set((s) => ({ people: s.people.filter((p) => p.id !== id) }));
      deletePersonFromDb(id).catch((err) => console.warn('people: failed to delete', err));
      putTombstone(id, Date.now()).catch(() => {});
    },

    importPeople: (incoming) => {
      if (incoming.length === 0) return 0;
      set((s) => ({ people: [...incoming, ...s.people] }));
      for (const p of incoming) persist(p);
      return incoming.length;
    },
  };
});
