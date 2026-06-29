/**
 * People store — Zustand state with disk-backed persistence. React state updates
 * synchronously (UI feels instant); the SQLite save runs fire-and-forget. The
 * store is the in-memory source of truth; db.ts is durable backup. Scheduling-
 * relevant changes also re-sync local reminders (fire-and-forget, never blocking).
 *
 * Note the curried `create<State>()(...)` form — Zustand v5 requires it
 * (stack/zustand.md).
 */

import { create } from 'zustand';
import {
  type Person,
  type PreferenceKind,
  type InteractionKind,
  type PersonalityFramework,
  makePerson,
  makePreference,
  makeImportantDate,
  makeInteraction,
  setPersonalityValue,
} from '../data/person';
import { putTombstone } from '../storage/kv';
import { dedupePeopleByName } from '../lib/contacts';
import { loadAllPeople, savePerson, deletePersonFromDb } from './db';
import { rescheduleAll } from '../lib/notifications';
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
  logContact: (id: string, kind?: InteractionKind, note?: string) => void;
  setNotes: (id: string, notes: string) => void;
  setHowWeMet: (id: string, howWeMet: string) => void;
  addImportantDate: (id: string, label: string, month: number, day: number, year?: number) => void;
  removeImportantDate: (id: string, dateId: string) => void;
  addPreference: (id: string, kind: PreferenceKind, text: string) => void;
  removePreference: (id: string, prefId: string) => void;
  setPersonalityType: (id: string, framework: PersonalityFramework, value: string | null) => void;
  deletePerson: (id: string) => void;
  importPeople: (incoming: Person[]) => number;
}

function persist(person: Person): void {
  savePerson(person).catch((err) => console.warn('people: failed to persist', err));
}

export const usePeopleStore = create<PeopleState>()((set, get) => {
  function syncNotifications(): void {
    rescheduleAll(get().people).catch(() => {});
  }

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
        } else {
          set({ people: loaded, hydrated: true });
        }
      } catch (err) {
        console.warn('people: failed to load from disk', err);
        set({ hydrated: true });
      }
      syncNotifications();
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
      // Setting a cadence is the explicit opt-in: this is the only place that may
      // prompt for notification permission. Skip the prompt when clearing it.
      rescheduleAll(get().people, { prompt: cadenceDays != null }).catch(() => {});
    },

    logContact: (id, kind = 'other', note) => {
      const entry = makeInteraction(kind, note);
      mutate(id, (p) => ({
        ...p,
        lastContactedAt: entry.at,
        interactions: [entry, ...p.interactions],
      }));
      syncNotifications();
    },

    setNotes: (id, notes) => {
      mutate(id, (p) => ({ ...p, notes }));
    },

    setHowWeMet: (id, howWeMet) => {
      const trimmed = howWeMet.trim();
      mutate(id, (p) => ({ ...p, howWeMet: trimmed ? trimmed : undefined }));
    },

    addImportantDate: (id, label, month, day, year) => {
      mutate(id, (p) => ({
        ...p,
        importantDates: [...p.importantDates, makeImportantDate(label, month, day, year)],
      }));
      syncNotifications();
    },

    removeImportantDate: (id, dateId) => {
      mutate(id, (p) => ({ ...p, importantDates: p.importantDates.filter((d) => d.id !== dateId) }));
      syncNotifications();
    },

    addPreference: (id, kind, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      mutate(id, (p) => ({ ...p, preferences: [...p.preferences, makePreference(kind, trimmed)] }));
    },

    removePreference: (id, prefId) => {
      mutate(id, (p) => ({ ...p, preferences: p.preferences.filter((pr) => pr.id !== prefId) }));
    },

    setPersonalityType: (id, framework, value) => {
      mutate(id, (p) => ({ ...p, personalityTypes: setPersonalityValue(p.personalityTypes, framework, value) }));
    },

    deletePerson: (id) => {
      set((s) => ({ people: s.people.filter((p) => p.id !== id) }));
      deletePersonFromDb(id).catch((err) => console.warn('people: failed to delete', err));
      putTombstone(id, Date.now()).catch(() => {});
      syncNotifications();
    },

    importPeople: (incoming) => {
      // Dedupe against the people we already have so re-running an import (or
      // importing a contact list with someone already tracked) never doubles
      // anyone. Return the count ACTUALLY added so the UI can speak the truth.
      const toAdd = dedupePeopleByName(get().people, incoming);
      if (toAdd.length === 0) return 0;
      set((s) => ({ people: [...toAdd, ...s.people] }));
      for (const p of toAdd) persist(p);
      syncNotifications();
      return toAdd.length;
    },
  };
});
