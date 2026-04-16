import { create } from 'zustand';
import type { AppSettings, CustomGroup } from '../types';
import { readStorage, writeStorage } from '../utils/storage';

// ─── Default Settings ────────────────────────────────────────────────

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  soundEnabled: true,
  confettiEnabled: true,
  maxChipsVisible: 8,
  customGroups: [],
  landingPagePatterns: [],
};

// ─── Types ───────────────────────────────────────────────────────────

interface SettingsActions {
  /** Read settings from chrome.storage.local and hydrate store. */
  fetchSettings: () => Promise<void>;
  /** Toggle the sound-enabled flag. */
  toggleSound: () => Promise<void>;
  /** Toggle the confetti-enabled flag. */
  toggleConfetti: () => Promise<void>;
  /** Change the theme preference. */
  setTheme: (theme: 'light' | 'dark' | 'system') => Promise<void>;
  /** Add a custom group rule. */
  addCustomGroup: (group: CustomGroup) => Promise<void>;
  /** Remove a custom group rule by its groupKey. */
  removeCustomGroup: (groupKey: string) => Promise<void>;
}

export type SettingsStore = {
  settings: AppSettings;
  loading: boolean;
} & SettingsActions;

// ─── Store ───────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loading: false,

  fetchSettings: async () => {
    set({ loading: true });
    try {
      const storage = await readStorage();
      set({ settings: storage.settings, loading: false });
    } catch {
      set({ settings: DEFAULT_SETTINGS, loading: false });
    }
  },

  toggleSound: async () => {
    const { settings } = get();
    const updated: AppSettings = { ...settings, soundEnabled: !settings.soundEnabled };
    set({ settings: updated });
    const storage = await readStorage();
    await writeStorage({ ...storage, settings: updated });
  },

  toggleConfetti: async () => {
    const { settings } = get();
    const updated: AppSettings = { ...settings, confettiEnabled: !settings.confettiEnabled };
    set({ settings: updated });
    const storage = await readStorage();
    await writeStorage({ ...storage, settings: updated });
  },

  setTheme: async (theme: 'light' | 'dark' | 'system') => {
    const { settings } = get();
    const updated: AppSettings = { ...settings, theme };
    set({ settings: updated });
    const storage = await readStorage();
    await writeStorage({ ...storage, settings: updated });
  },

  addCustomGroup: async (group: CustomGroup) => {
    const { settings } = get();
    const updated: AppSettings = {
      ...settings,
      customGroups: [...settings.customGroups, group],
    };
    set({ settings: updated });
    const storage = await readStorage();
    await writeStorage({ ...storage, settings: updated });
  },

  removeCustomGroup: async (groupKey: string) => {
    const { settings } = get();
    const updated: AppSettings = {
      ...settings,
      customGroups: settings.customGroups.filter((g) => g.groupKey !== groupKey),
    };
    set({ settings: updated });
    const storage = await readStorage();
    await writeStorage({ ...storage, settings: updated });
  },
}));
