/**
 * Lists store — Zustand state with disk-backed persistence. React state updates
 * synchronously (UI feels instant); the SQLite save runs fire-and-forget. The
 * store is the in-memory source of truth; db.ts is durable backup.
 *
 * Note the curried `create<State>()(...)` form — Zustand v5 requires it
 * (stack/zustand.md); the v4-style `create<State>(...)` type-checks but fails
 * silently at runtime.
 */

import { create } from 'zustand';
import {
  type ItemList,
  type ListItem,
  makeItem,
  makeList,
  findActiveByName,
} from '../data/item';
import { putTombstone } from '../storage/kv';
import { loadAllLists, saveList, deleteListFromDb } from './db';
import { QA_MODE } from '../qa/qaMode';
import { qaLists } from '../qa/fixtures';

interface ListsState {
  lists: ItemList[];
  hydrated: boolean;
  hydrate: () => Promise<void>;

  createList: (name?: string) => string;
  getList: (id: string) => ItemList | undefined;
  renameList: (id: string, name: string) => void;
  deleteList: (id: string) => void;
  importLists: (incoming: ItemList[]) => number;

  addItem: (listId: string, name: string) => void;
  setDone: (listId: string, itemId: string, done: boolean) => void;
  setNote: (listId: string, itemId: string, note: string) => void;
  deleteItem: (listId: string, itemId: string) => void;
}

function persist(list: ItemList): void {
  saveList(list).catch((err) => console.warn('list: failed to persist', err));
}

export const useListsStore = create<ListsState>()((set, get) => {
  function mutate(id: string, fn: (l: ItemList) => ItemList): void {
    let updated: ItemList | undefined;
    set((s) => ({
      lists: s.lists.map((l) => {
        if (l.id !== id) return l;
        updated = { ...fn(l), updatedAt: Date.now() };
        return updated;
      }),
    }));
    if (updated) persist(updated);
  }

  function mutateItem(listId: string, itemId: string, fn: (it: ListItem) => ListItem): void {
    mutate(listId, (l) => ({
      ...l,
      items: l.items.map((it) => (it.id === itemId ? { ...fn(it), updatedAt: Date.now() } : it)),
    }));
  }

  return {
    lists: [],
    hydrated: false,

    hydrate: async () => {
      try {
        const loaded = await loadAllLists();
        if (QA_MODE && loaded.length === 0) {
          set({ lists: qaLists(), hydrated: true });
          return;
        }
        set({ lists: loaded, hydrated: true });
      } catch (err) {
        console.warn('list: failed to load from disk', err);
        set({ hydrated: true });
      }
    },

    createList: (name) => {
      const list = makeList(name);
      set((s) => ({ lists: [list, ...s.lists] }));
      persist(list);
      return list.id;
    },

    getList: (id) => get().lists.find((l) => l.id === id),

    renameList: (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      mutate(id, (l) => ({ ...l, name: trimmed }));
    },

    deleteList: (id) => {
      set((s) => ({ lists: s.lists.filter((l) => l.id !== id) }));
      deleteListFromDb(id).catch((err) => console.warn('list: failed to delete', err));
      putTombstone(id, Date.now()).catch(() => {});
    },

    importLists: (incoming) => {
      if (incoming.length === 0) return 0;
      set((s) => ({ lists: [...incoming, ...s.lists] }));
      for (const l of incoming) persist(l);
      return incoming.length;
    },

    addItem: (listId, name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      const list = get().lists.find((l) => l.id === listId);
      if (!list) return;
      const existing = findActiveByName(list, trimmed);
      if (existing) {
        // Re-adding an item you'd checked off means you want it again.
        mutateItem(listId, existing.id, (it) => ({ ...it, done: false }));
        return;
      }
      mutate(listId, (l) => ({ ...l, items: [...l.items, makeItem(trimmed)] }));
    },

    setDone: (listId, itemId, done) => {
      mutateItem(listId, itemId, (it) => ({ ...it, done }));
    },

    setNote: (listId, itemId, note) => {
      const n = note.trim();
      mutateItem(listId, itemId, (it) => ({ ...it, note: n.length ? n : undefined }));
    },

    deleteItem: (listId, itemId) => {
      mutateItem(listId, itemId, (it) => ({ ...it, deletedAt: Date.now() }));
    },
  };
});
