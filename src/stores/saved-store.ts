import { create } from 'zustand';
import type { SavedTab } from '../types';
import {
  getSavedTabs,
  checkOffSavedTab,
  dismissSavedTab,
  saveTabForLater,
} from '../utils/storage';
import { getErrorMessage } from '../utils/error';

// ─── Types ──────────────────────────────────────────────────────────

interface SavedActions {
  /** Fetch active and archived saved tabs from storage. */
  fetchSaved: () => Promise<void>;
  /** Save a new tab for later. */
  saveTab: (url: string, title: string) => Promise<void>;
  /** Mark a saved tab as completed (checked off -> archive). */
  checkOff: (id: string) => Promise<void>;
  /** Dismiss (soft-delete) a saved tab. */
  dismiss: (id: string) => Promise<void>;
  /** Update the archive search query (local filter, no async). */
  setArchiveSearch: (query: string) => void;
  /** Clear the current error state. */
  clearError: () => void;
}

export type SavedStore = {
  active: SavedTab[];
  archived: SavedTab[];
  archiveSearch: string;
  loading: boolean;
  error: string | null;
} & SavedActions;

// ─── Store ──────────────────────────────────────────────────────────

export const useSavedStore = create<SavedStore>((set) => ({
  active: [],
  archived: [],
  archiveSearch: '',
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchSaved: async () => {
    set({ loading: true, error: null });
    try {
      const { active, archived } = await getSavedTabs();
      set({ active, archived, loading: false });
    } catch (err: unknown) {
      set({ active: [], archived: [], loading: false, error: getErrorMessage(err, 'Failed to load saved tabs') });
    }
  },

  saveTab: async (url: string, title: string) => {
    await saveTabForLater({ url, title });
    // Close the tab after saving
    try {
      const allTabs = await chrome.tabs.query({});
      const match = allTabs.find((t) => t.url === url);
      if (match?.id != null) {
        await chrome.tabs.remove(match.id);
      }
    } catch {
      // Tab may already be closed — that's fine
    }
    await useSavedStore.getState().fetchSaved();
  },

  checkOff: async (id: string) => {
    await checkOffSavedTab(id);
    await useSavedStore.getState().fetchSaved();
  },

  dismiss: async (id: string) => {
    await dismissSavedTab(id);
    await useSavedStore.getState().fetchSaved();
  },

  setArchiveSearch: (query: string) => {
    set({ archiveSearch: query });
  },
}));
