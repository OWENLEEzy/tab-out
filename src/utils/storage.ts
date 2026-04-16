import type { StorageSchema, SavedTab, Workspace, AppSettings } from '../types';

const CURRENT_SCHEMA_VERSION = 2;

/**
 * Serial write queue to prevent race conditions during rapid consecutive
 * read-modify-write operations (e.g., checking off multiple saved items).
 * Without this, overlapping reads can cause data loss.
 */
let writeQueue: Promise<void> = Promise.resolve();

function queuedWrite(fn: () => Promise<void>): Promise<void> {
  const task = writeQueue.then(fn);
  writeQueue = task.catch(() => {});
  return task;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'system',
  soundEnabled: true,
  confettiEnabled: true,
  maxChipsVisible: 8,
  customGroups: [],
  landingPagePatterns: [],
};

const EMPTY_SCHEMA: StorageSchema = {
  schemaVersion: CURRENT_SCHEMA_VERSION,
  deferred: [],
  workspaces: [],
  settings: DEFAULT_SETTINGS,
  groupOrder: {},
};

/**
 * Migrate storage data from older schema versions.
 * Applies migrations sequentially: v0→v1, v1→v2, etc.
 */
function migrate(data: Partial<StorageSchema>): StorageSchema {
  const version = data.schemaVersion ?? 0;

  if (version < 1) {
    // v0 → v1: initial schema
    // Existing "deferred" data from vanilla JS version may exist
    // under the key "deferred" with shape: { id, url, title, savedAt, completed, dismissed }
    // The new schema is compatible — no transformation needed.
  }

  if (version < 2) {
    // v1 → v2: add groupOrder for drag-and-drop persistence
  }

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    deferred: Array.isArray(data.deferred) ? data.deferred : [],
    workspaces: Array.isArray(data.workspaces) ? data.workspaces : [],
    settings: { ...DEFAULT_SETTINGS, ...data.settings },
    groupOrder: data.groupOrder ?? {},
  };
}

/**
 * Read the full storage schema, applying migrations if needed.
 */
export async function readStorage(): Promise<StorageSchema> {
  const result = await chrome.storage.local.get([
    'schemaVersion',
    'deferred',
    'workspaces',
    'settings',
    'groupOrder',
  ]);

  return migrate({
    schemaVersion: result.schemaVersion as number | undefined,
    deferred: result.deferred as SavedTab[] | undefined,
    workspaces: result.workspaces as Workspace[] | undefined,
    settings: result.settings as AppSettings | undefined,
    groupOrder: result.groupOrder as Record<string, number> | undefined,
  });
}

/**
 * Write the full storage schema. Uses write queue to prevent race conditions.
 */
export async function writeStorage(data: StorageSchema): Promise<void> {
  await queuedWrite(async () => {
    await chrome.storage.local.set({
      schemaVersion: data.schemaVersion,
      deferred: data.deferred,
      workspaces: data.workspaces,
      settings: data.settings,
      groupOrder: data.groupOrder,
    });
  });
}

/**
 * Get saved tabs (deferred items), split into active and archived.
 * Filters out dismissed items.
 */
export async function getSavedTabs(): Promise<{
  active: SavedTab[];
  archived: SavedTab[];
}> {
  const storage = await readStorage();
  const visible = storage.deferred.filter((t) => !t.dismissed);
  return {
    active: visible.filter((t) => !t.completed),
    archived: visible.filter((t) => t.completed),
  };
}

/**
 * Save a tab for later. Creates a new SavedTab entry.
 */
export async function saveTabForLater(tab: {
  url: string;
  title: string;
}): Promise<SavedTab> {
  const storage = await readStorage();
  let domain = '';
  try {
    domain = new URL(tab.url).hostname;
  } catch {
    // Leave domain empty for malformed URLs
  }

  const savedTab: SavedTab = {
    id: crypto.randomUUID(),
    url: tab.url,
    title: tab.title,
    domain,
    savedAt: new Date().toISOString(),
    completed: false,
    dismissed: false,
  };

  const updated: StorageSchema = {
    ...storage,
    deferred: [...storage.deferred, savedTab],
  };

  await writeStorage(updated);
  return savedTab;
}

/**
 * Mark a saved tab as completed (checked off → archive).
 */
export async function checkOffSavedTab(id: string): Promise<void> {
  const storage = await readStorage();
  const updated: StorageSchema = {
    ...storage,
    deferred: storage.deferred.map((t) =>
      t.id === id
        ? { ...t, completed: true, completedAt: new Date().toISOString() }
        : t
    ),
  };
  await writeStorage(updated);
}

/**
 * Dismiss a saved tab (remove from all views).
 */
export async function dismissSavedTab(id: string): Promise<void> {
  const storage = await readStorage();
  const updated: StorageSchema = {
    ...storage,
    deferred: storage.deferred.map((t) =>
      t.id === id ? { ...t, dismissed: true } : t
    ),
  };
  await writeStorage(updated);
}

/**
 * Read app settings from storage.
 */
export async function readSettings(): Promise<AppSettings> {
  const storage = await readStorage();
  return storage.settings;
}

/**
 * Update app settings in storage.
 */
export async function writeSettings(
  settings: Partial<AppSettings>
): Promise<void> {
  const storage = await readStorage();
  const updated: StorageSchema = {
    ...storage,
    settings: { ...storage.settings, ...settings },
  };
  await writeStorage(updated);
}

/**
 * Persist custom group ordering from drag-and-drop.
 */
export async function writeGroupOrder(order: Record<string, number>): Promise<void> {
  const storage = await readStorage();
  await writeStorage({ ...storage, groupOrder: order });
}

// Export for testing
export { EMPTY_SCHEMA, CURRENT_SCHEMA_VERSION };
