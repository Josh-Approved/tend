/**
 * Conversations store (Have the Conversation) — Zustand state with disk-backed
 * persistence, mirroring store/people.ts. React state updates synchronously (UI
 * feels instant); the SQLite save runs fire-and-forget. The store is the
 * in-memory source of truth; db.ts is durable backup.
 *
 * Note the curried `create<State>()(...)` form — Zustand v5 requires it.
 */

import { create } from 'zustand';
import {
  type Conversation,
  type ConversationFlavor,
  makeConversation,
} from '../data/conversation';
import { putTombstone } from '../storage/kv';
import { loadAllConversations, saveConversation, deleteConversationFromDb } from './db';
import { QA_MODE } from '../qa/qaMode';
import { qaConversations } from '../qa/fixtures';
import { usePeopleStore } from './people';

/** Fields the detail form can edit directly. */
type EditableField = 'personName' | 'topic' | 'story' | 'impact' | 'hope' | 'reflection';

interface ConversationsState {
  conversations: Conversation[];
  hydrated: boolean;
  hydrate: () => Promise<void>;

  createConversation: (personId?: string | null, personName?: string, flavor?: ConversationFlavor) => string;
  getConversation: (id: string) => Conversation | undefined;
  setField: (id: string, field: EditableField, value: string) => void;
  setFlavor: (id: string, flavor: ConversationFlavor) => void;
  setFlavorField: (id: string, key: string, value: string) => void;
  markHad: (id: string) => void;
  reopen: (id: string) => void;
  deleteConversation: (id: string) => void;
  importConversations: (incoming: Conversation[]) => number;
}

function persist(c: Conversation): void {
  saveConversation(c).catch((err) => console.warn('conversations: failed to persist', err));
}

export const useConversationsStore = create<ConversationsState>()((set, get) => {
  function mutate(id: string, fn: (c: Conversation) => Conversation): void {
    let updated: Conversation | undefined;
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== id) return c;
        updated = { ...fn(c), updatedAt: Date.now() };
        return updated;
      }),
    }));
    if (updated) persist(updated);
  }

  return {
    conversations: [],
    hydrated: false,

    hydrate: async () => {
      try {
        const loaded = await loadAllConversations();
        if (QA_MODE && loaded.length === 0) {
          // Link a couple to the already-seeded people for a realistic demo.
          const seeded = qaConversations(usePeopleStore.getState().people);
          set({ conversations: seeded, hydrated: true });
          for (const c of seeded) persist(c);
        } else {
          set({ conversations: loaded, hydrated: true });
        }
      } catch (err) {
        console.warn('conversations: failed to load from disk', err);
        set({ hydrated: true });
      }
    },

    createConversation: (personId = null, personName = '', flavor = 'open') => {
      const c = makeConversation(personId, personName, flavor);
      set((s) => ({ conversations: [c, ...s.conversations] }));
      persist(c);
      return c.id;
    },

    getConversation: (id) => get().conversations.find((c) => c.id === id),

    setField: (id, field, value) => {
      mutate(id, (c) => ({ ...c, [field]: value }));
    },

    setFlavor: (id, flavor) => {
      mutate(id, (c) => ({ ...c, flavor }));
    },

    setFlavorField: (id, key, value) => {
      mutate(id, (c) => ({ ...c, flavorFields: { ...c.flavorFields, [key]: value } }));
    },

    markHad: (id) => {
      mutate(id, (c) => ({ ...c, status: 'had', hadAt: Date.now() }));
    },

    reopen: (id) => {
      mutate(id, (c) => ({ ...c, status: 'open', hadAt: null }));
    },

    deleteConversation: (id) => {
      set((s) => ({ conversations: s.conversations.filter((c) => c.id !== id) }));
      deleteConversationFromDb(id).catch((err) => console.warn('conversations: failed to delete', err));
      putTombstone(id, Date.now()).catch(() => {});
    },

    importConversations: (incoming) => {
      if (incoming.length === 0) return 0;
      set((s) => ({ conversations: [...incoming, ...s.conversations] }));
      for (const c of incoming) persist(c);
      return incoming.length;
    },
  };
});
