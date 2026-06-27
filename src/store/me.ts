/**
 * The "Me" manual store — a single profile (not a list), so it persists as one
 * JSON blob in app_settings (which rides the same SQLite file + OS auto-backup as
 * everything else). React state updates synchronously; the save is fire-and-forget.
 *
 * Note the curried `create<State>()(...)` form — Zustand v5 requires it.
 */

import { create } from 'zustand';
import { type MeProfile, mergeMeProfile } from '../data/me';
import { getAppSetting, setAppSetting } from '../storage/kv';
import { QA_MODE } from '../qa/qaMode';
import { qaMeProfile } from '../qa/fixtures';

const ME_KEY = 'me.profile';

interface MeState {
  profile: MeProfile;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  setField: (key: string, value: string) => void;
  importProfile: (incoming: MeProfile) => number;
}

function persist(profile: MeProfile): void {
  setAppSetting(ME_KEY, JSON.stringify(profile)).catch((err) => console.warn('me: failed to persist', err));
}

export const useMeStore = create<MeState>()((set, get) => ({
  profile: {},
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await getAppSetting(ME_KEY);
      const loaded: MeProfile = raw ? (JSON.parse(raw) as MeProfile) : {};
      if (QA_MODE && Object.keys(loaded).length === 0) {
        const seeded = qaMeProfile();
        set({ profile: seeded, hydrated: true });
        persist(seeded);
      } else {
        set({ profile: loaded, hydrated: true });
      }
    } catch (err) {
      console.warn('me: failed to load', err);
      set({ hydrated: true });
    }
  },

  setField: (key, value) => {
    const profile = { ...get().profile, [key]: value };
    set({ profile });
    persist(profile);
  },

  importProfile: (incoming) => {
    const { profile, added } = mergeMeProfile(get().profile, incoming);
    if (added > 0) {
      set({ profile });
      persist(profile);
    }
    return added;
  },
}));
